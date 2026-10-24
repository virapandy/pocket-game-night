// Mafia's rules on the game contract (specs/mafia/api.md): one game night, holding every game of that night.
// Pure: every random choice comes from `seeds.roles` (MAF-H2); no clock, screen or storage.
import { HOST, type GameRules, type MoveContext, type SetupInput, type Verdict, type Viewer } from '../../../engine';
import { dealRoles, keptCount, mafiaCounts, validOverride } from './deal';
import {
  STORIES, allowedNames, checkWinner, checksOf, inTonight, isIn, isOut, nightJob, nightTurn, remaining, resolveNight,
} from './night';
import type {
  Game, MafiaConfig, MafiaMove, MafiaPlayerView, MafiaState, MafiaView, Role, Step,
} from './types';

const no = (reason: string): Verdict<MafiaState> => ({ ok: false, reason });
const yes = (value: MafiaState): Verdict<MafiaState> => ({ ok: true, value });

const cleanName = (x: unknown): string | null => {
  if (typeof x !== 'string') return null;
  const t = x.trim();
  return t.length >= 1 && t.length <= 16 ? t : null;
};
const seatOrder = (g: Game, names: readonly string[]) => g.players.filter((p) => names.includes(p));

function current(s: MafiaState): Game | null {
  return s.games[s.games.length - 1] ?? null;
}
function stepOf(s: MafiaState): Step {
  if (s.ended) return 'ended';
  return current(s)?.step ?? 'idle';
}
/** Right after a deal leave, before its redeal: only `redeal` (item 12). */
const awaitingRedeal = (s: MafiaState) => s.undo?.kind === 'dealLeave' && !s.undo.redealt;

/** A copy to change, without the previous undo (any recorded move closes it, item 13). */
function draft(s: MafiaState): MafiaState {
  return structuredClone({ ...s, undo: null });
}
const snapshot = (s: MafiaState): MafiaState => ({ ...s, undo: null });

function earlierDeals(s: MafiaState, k: number) {
  return s.games.slice(0, k - 1).map((g) => g.roles);
}
function redealGame(s: MafiaState, g: Game): void {
  g.redeals += 1;
  g.roles = dealRoles(s.seed, g.number, g.players, g.mafiaCount, earlierDeals(s, g.number), g.redeals);
  g.step = 'deal';
  g.seen = 0;
  g.round = 0;
}

/** MAF-061: "Play again" for this game over, or null with fewer than 5 (or more than 16) players. */
function playAgain(s: MafiaState, g: Game): MafiaMove | null {
  const players = [...g.players.filter((p) => !g.left.includes(p)), ...s.next];
  if (players.length < 5 || players.length > 16 || new Set(players).size !== players.length) return null;
  return { type: 'start', players, mafiaCount: keptCount(players.length, g.mafiaCount) };
}

function startGame(s: MafiaState, move: Extract<MafiaMove, { type: 'start' }>): Verdict<MafiaState> {
  const step = stepOf(s);
  if (step !== 'idle' && step !== 'gameOver') return no('A game can start only before the first game or at game over.');
  if (!Array.isArray(move.players)) return no('No players.');
  const players: string[] = [];
  for (const raw of move.players) {
    const name = cleanName(raw);
    if (name === null) return no('Each name needs 1 to 16 characters.');
    if (players.includes(name)) return no(`${name} is already playing.`);
    players.push(name);
  }
  if (players.length < 5) return no('Mafia needs at least 5 players.');
  if (players.length > 16) return no('Up to 16 players.');
  if (!mafiaCounts(players.length).allowed.includes(move.mafiaCount)) return no('That Mafia count is not allowed.');
  const next = draft(s);
  const k = next.games.length + 1;
  const m = move.mafiaCount;
  const roles = validOverride(next.deals[String(k)], players, m) ?? dealRoles(next.seed, k, players, m, earlierDeals(next, k), 0);
  next.games.push({
    number: k, startPlayers: [...players], startCount: m, players, mafiaCount: m, roles, redeals: 0, step: 'deal', seen: 0,
    round: 0, out: [], left: [], leftLog: [], leaving: [], night: null, nights: [], votes: [], tie: null, tied: null,
    morning: null, vote: null, winner: null, endedEarly: false, started: false, used: { out: [], saved: [] },
  });
  next.next = [];
  return yes(next);
}

function leave(s: MafiaState, g0: Game, player: string): Verdict<MafiaState> {
  if (!isIn(g0, player) || g0.leaving.includes(player)) return no(`${player} can't leave now.`);
  const next = draft(s);
  const g = current(next) as Game;
  switch (g.step) {
    case 'deal': {
      if (awaitingRedeal(s)) return no('Deal again first.');
      if (g.players.length - 1 < 5) return no('Mafia needs at least 5 players.');
      g.players = g.players.filter((p) => p !== player);
      g.mafiaCount = keptCount(g.players.length, g.mafiaCount);
      next.undo = { kind: 'dealLeave', player, redealt: false };
      return yes(next);
    }
    case 'nightStart':
      if (g.round > 1) return dayLeave(s, next, g, player, g.round - 1);
      g.leaving.push(player);
      next.undo = { kind: 'leave', player, prev: snapshot(s) };
      return yes(next);
    case 'night':
      g.leaving.push(player);
      if (remaining(g).length === 0) resolveNight(next, g);   // a night leave's Undo works only until MAF-027 runs
      else next.undo = { kind: 'leave', player, prev: snapshot(s) };
      return yes(next);
    case 'day':
    case 'revote':
      return dayLeave(s, next, g, player, g.round);
    default:
      return no(`${player} can't leave now.`);
  }
}

function dayLeave(s: MafiaState, next: MafiaState, g: Game, player: string, day: number): Verdict<MafiaState> {
  g.left.push(player);
  g.leftLog.push({ player, when: 'day', round: day });
  if (g.tied) g.tied = g.tied.filter((p) => p !== player);
  checkWinner(g);
  next.undo = { kind: 'leave', player, prev: snapshot(s) };
  return yes(next);
}

function apply(s: MafiaState, move: MafiaMove, ctx: MoveContext): Verdict<MafiaState> {
  if (ctx.by !== HOST) return no('Only the host phone records moves.');
  if (!move || typeof move !== 'object') return no('Not a move.');
  if (s.ended) return no('Tonight has ended.');
  if (move.type === 'start') return startGame(s, move);
  const g0 = current(s);
  if (!g0) return no('No game has started.');
  const step = g0.step;
  if (awaitingRedeal(s) && move.type !== 'redeal') return no('Deal again first.');

  switch (move.type) {
    case 'seen': {
      if (step !== 'deal' || g0.players[g0.seen] !== move.player) return no('Not their turn.');
      const next = draft(s);
      const g = current(next) as Game;
      g.seen += 1;
      if (g.seen === g.players.length) { g.step = 'nightStart'; g.round = 1; }
      return yes(next);
    }
    case 'redeal': {
      const ok = step === 'deal' || (step === 'nightStart' && g0.round === 1 && g0.leaving.length === 0);
      if (!ok) return no('Deal again only before the first night starts.');
      const next = draft(s);
      redealGame(next, current(next) as Game);
      if (s.undo?.kind === 'dealLeave' && !s.undo.redealt) next.undo = { ...s.undo, redealt: true };
      return yes(next);
    }
    case 'startNight': {
      if (step !== 'nightStart' || move.night !== g0.round) return no('Not that night.');
      const next = draft(s);
      const g = current(next) as Game;
      g.step = 'night';
      g.night = { turns: [], picks: [] };
      g.morning = null;
      g.vote = null;
      if (g.round === 1) g.started = true;
      if (remaining(g).length === 0) resolveNight(next, g);
      return yes(next);
    }
    case 'nightPick': {
      const turn = nightTurn(g0);
      if (step !== 'night' || !turn || turn.player !== move.player) return no('Not their turn.');
      const allowed = allowedNames(g0, move.player);
      const ok = move.target === null ? allowed.length === 0 : typeof move.target === 'string' && allowed.includes(move.target);
      if (!ok) return no('That name is not allowed.');
      const next = draft(s);
      const g = current(next) as Game;
      const night = g.night as NonNullable<Game['night']>;
      night.picks.push({ player: move.player, target: move.target, kind: isOut(g, move.player) ? 'ghost' : (g.roles[move.player] as Role) });
      night.turns.push(move.player);
      if (remaining(g).length === 0) resolveNight(next, g);
      return yes(next);
    }
    case 'voteOut': {
      const ok = (step === 'day' && isIn(g0, move.player)) || (step === 'revote' && !!g0.tied?.includes(move.player) && isIn(g0, move.player));
      if (!ok) return no('Not a player who can be voted out.');
      const next = draft(s);
      const g = current(next) as Game;
      const role = g.roles[move.player] as Role;
      g.out.push({ player: move.player, role, how: 'vote', round: g.round });
      g.votes.push({ day: g.round, tie: g.tie, out: move.player, nobody: null });
      g.vote = { player: move.player, role };
      g.tie = null;
      g.tied = null;
      if (!checkWinner(g)) { g.step = 'nightStart'; g.round += 1; }
      return yes(next);
    }
    case 'voteNobody': {
      const ok = (step === 'day' && move.reason === 'chosen') || (step === 'revote' && move.reason === 'secondTie');
      if (!ok) return no('Not now.');
      const next = draft(s);
      const g = current(next) as Game;
      g.votes.push({ day: g.round, tie: g.tie, out: null, nobody: move.reason });
      g.tie = null;
      g.tied = null;
      g.step = 'nightStart';
      g.round += 1;
      return yes(next);
    }
    case 'tie': {
      if (step !== 'day' || !Array.isArray(move.players)) return no('A tie is only for the day\'s vote.');
      const names = move.players;
      if (names.length < 2 || new Set(names).size !== names.length || !names.every((p) => typeof p === 'string' && isIn(g0, p))) {
        return no('A tie needs 2 or more players who are in.');
      }
      const next = draft(s);
      const g = current(next) as Game;
      g.tie = seatOrder(g, names);
      g.tied = [...g.tie];
      g.step = 'revote';
      return yes(next);
    }
    case 'leave':
      if (typeof move.player !== 'string') return no('No player.');
      return leave(s, g0, move.player);
    case 'unleave': {
      const u = s.undo;
      if (u?.kind === 'leave' && u.player === move.player) return yes(snapshot(u.prev));
      if (u?.kind === 'dealLeave' && u.redealt && u.player === move.player) {
        const next = draft(s);
        const g = current(next) as Game;
        g.players = g.startPlayers.filter((p) => p === move.player || g.players.includes(p));
        g.mafiaCount = keptCount(g.players.length, g.startCount);
        redealGame(next, g);
        return yes(next);
      }
      return no('Nothing to undo.');
    }
    case 'addNext': {
      const name = cleanName(move.name);
      if (name === null) return no('A name needs 1 to 16 characters.');
      if ((g0.players.includes(name) && !g0.left.includes(name)) || s.next.includes(name)) return no(`${name} is already playing.`);
      const next = draft(s);
      next.next.push(name);
      return yes(next);
    }
    case 'endGame': {
      if (step === 'gameOver') return no('The game is over.');
      const next = draft(s);
      const g = current(next) as Game;
      g.step = 'gameOver';
      g.winner = null;
      g.endedEarly = true;
      next.undo = { kind: 'endGame', prev: snapshot(s) };
      return yes(next);
    }
    case 'unEndGame':
      if (s.undo?.kind !== 'endGame') return no('Nothing to undo.');
      return yes(snapshot(s.undo.prev));
    case 'endEvening': {
      if (step !== 'gameOver') return no('End the game first.');
      const next = draft(s);
      next.ended = true;
      return yes(next);
    }
    default:
      return no('Not a Mafia move.');
  }
}

function legalMoves(s: MafiaState, actor: string): MafiaMove[] {
  if (actor !== HOST || s.ended) return [];
  const g = current(s);
  if (!g) return [];
  const out: MafiaMove[] = [];
  const u = s.undo;
  if (awaitingRedeal(s)) return [{ type: 'redeal' }];
  const leaves = () => {
    for (const p of g.players) if (inTonight(g, p)) out.push({ type: 'leave', player: p });
  };
  switch (g.step) {
    case 'deal':
      out.push({ type: 'seen', player: g.players[g.seen] as string }, { type: 'redeal' });
      if (g.players.length - 1 >= 5) leaves();
      out.push({ type: 'endGame' });
      break;
    case 'nightStart':
      out.push({ type: 'startNight', night: g.round });
      if (g.round === 1 && g.leaving.length === 0) out.push({ type: 'redeal' });
      leaves();
      out.push({ type: 'endGame' });
      break;
    case 'night': {
      const turn = nightTurn(g);
      if (turn) {
        const allowed = allowedNames(g, turn.player);
        if (allowed.length === 0) out.push({ type: 'nightPick', player: turn.player, target: null });
        for (const t of allowed) out.push({ type: 'nightPick', player: turn.player, target: t });
      }
      leaves();
      out.push({ type: 'endGame' });
      break;
    }
    case 'day':
      for (const p of g.players) if (isIn(g, p)) out.push({ type: 'voteOut', player: p });
      out.push({ type: 'voteNobody', reason: 'chosen' });
      leaves();
      out.push({ type: 'endGame' });
      break;
    case 'revote':
      for (const p of g.tied ?? []) if (isIn(g, p)) out.push({ type: 'voteOut', player: p });
      out.push({ type: 'voteNobody', reason: 'secondTie' });
      leaves();
      out.push({ type: 'endGame' });
      break;
    case 'gameOver': {
      const again = playAgain(s, g);
      if (again) out.push(again);
      out.push({ type: 'endEvening' });
      break;
    }
  }
  if (u?.kind === 'leave' || (u?.kind === 'dealLeave' && u.redealt)) out.push({ type: 'unleave', player: u.player });
  if (u?.kind === 'endGame') out.push({ type: 'unEndGame' });
  return out;
}

function roomView(s: MafiaState): MafiaView {
  const g = current(s);
  const step = stepOf(s);
  const tally = { village: 0, mafia: 0 };
  for (const x of s.games) if (x.step === 'gameOver' && x.winner) tally[x.winner]++;
  if (!g) {
    return {
      step, game: 0, players: [], mafiaCount: 0, round: 0, turn: null, in: [], out: [], left: [], leaving: [], caught: 0,
      morning: null, tied: null, vote: null, winner: null, roles: null, tally, games: 0, next: [...s.next],
    };
  }
  const turn = g.step === 'deal' && !awaitingRedeal(s)
    ? { player: g.players[g.seen] as string, i: g.seen + 1, of: g.players.length }
    : g.step === 'deal' ? null : nightTurn(g);
  const over = step === 'gameOver';
  return {
    step, game: g.number, players: [...g.players], mafiaCount: g.mafiaCount, round: g.round, turn,
    in: g.players.filter((p) => isIn(g, p)),
    out: g.out.map((o) => ({ ...o })), left: [...g.left], leaving: [...g.leaving],
    caught: g.out.filter((o) => o.how === 'vote' && o.role === 'mafia').length,
    morning: g.morning ? { ...g.morning } : null,
    tied: g.step === 'revote' && g.tied ? [...g.tied] : null,
    vote: g.vote ? { ...g.vote } : null,
    winner: over ? g.winner : null,
    roles: over ? { ...g.roles } : null,
    tally, games: s.games.length, next: [...s.next],
  };
}

function view(s: MafiaState, viewer: Viewer): MafiaView {
  const room = roomView(s);
  if (viewer.kind !== 'player') return room;
  const g = current(s);
  const p = viewer.playerId;
  if (!g || !g.players.includes(p)) {
    const nobody: MafiaPlayerView = { ...room, me: null, job: null, checks: [] };
    return nobody;
  }
  const role = g.roles[p] as Role;
  const partners = role === 'mafia' ? g.players.filter((x) => x !== p && g.roles[x] === 'mafia') : [];
  const turn = !s.ended && g.step === 'night' ? nightTurn(g) : null;
  const own: MafiaPlayerView = {
    ...room,
    me: { role, partners },
    job: turn?.player === p ? nightJob(g, p) : null,
    checks: role === 'police' ? checksOf(g, p) : [],
  };
  return own;
}

function invariants(s: MafiaState): string[] {
  const problems: string[] = [];
  for (const g of s.games) {
    if (g.out.some((o) => g.left.includes(o.player))) problems.push(`game ${g.number}: a player is both out and left`);
    if (new Set(g.out.map((o) => o.player)).size !== g.out.length) problems.push(`game ${g.number}: a player went out twice`);
    if (g.step !== 'deal' && Object.values(g.roles).filter((r) => r === 'mafia').length !== g.mafiaCount) {
      problems.push(`game ${g.number}: the Mafia count does not match the deal`);
    }
  }
  return problems;
}

export const mafiaRules: GameRules<MafiaConfig, MafiaState, MafiaMove, MafiaView> & { readonly detailMoves: readonly MafiaMove['type'][] } = {
  id: 'mafia',
  detailMoves: ['start', 'tie', 'addNext'],
  setup(input: SetupInput<MafiaConfig>): MafiaState {
    const config: MafiaConfig = input.config ?? {};
    const known = (ids: readonly string[] | undefined, kind: 'out' | 'saved') => {
      const all = STORIES.filter((x) => x.kind === kind).map((x) => x.id);
      const chosen = (ids ?? []).filter((id) => all.includes(id));
      return chosen.length > 0 ? [...chosen] : all;
    };
    return {
      seed: input.seeds.roles ?? '',
      deals: structuredClone((config.deals ?? {}) as Record<string, Record<string, Role>>),
      stories: { out: known(config.stories?.out, 'out'), saved: known(config.stories?.saved, 'saved') },
      games: [], next: [], ended: false, undo: null,
    };
  },
  legalMoves,
  apply,
  view,
  isOver: (s) => s.ended,
  invariants,
  canUndo: () => false,
};

/** The game currently in play, for the screens and the saved game night. */
export const currentGame = current;
export { roomView };
