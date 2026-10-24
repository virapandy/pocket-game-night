// What Am I?'s rules (specs/what-am-i/ sections 02, 03 rules, 04, 07, 10; api.md). Pure: no screen, clock or randomness
// other than the seeded word order. The host phone is the referee; every move is the host's tap.
import type { ActorId, GameRules, MoveContext, Verdict, Viewer } from '../../../engine';
import {
  WORDS, buildUnshown, gameOpen, headOf, hideWord, markShown, wordById,
} from './queue';
import {
  PACKS, type Choices, type GameResult, type Hold, type OpenTurn, type PastGame, type SavedTurn, type Tonight, type WaiConfig,
  type WaiMove, type WaiState, type WaiView,
} from './types';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 20;

const ok = (value: WaiState): Verdict<WaiState> => ({ ok: true, value });
const no = (reason: string): Verdict<WaiState> => ({ ok: false, reason });

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** S2's choices are well formed. */
export function validChoices(c: unknown): c is Choices {
  if (!isObject(c)) return false;
  return (
    (c.pack === 'mix' || (PACKS as readonly unknown[]).includes(c.pack)) &&
    (c.time === 30 || c.time === 60 || c.time === 90) &&
    (c.hold === 'hand' || c.hold === 'free') &&
    typeof c.nonveg === 'boolean' &&
    typeof c.sounds === 'boolean'
  );
}

const cleanChoices = (c: Choices): Choices => ({ pack: c.pack, time: c.time, hold: c.hold, nonveg: c.nonveg, sounds: c.sounds });

/** A name as typed is usable: not empty after trimming. */
const usableName = (n: unknown): n is string => typeof n === 'string' && n.trim() !== '';

/** 2 to 20 different, non-empty names. */
export function playersProblem(players: unknown): string | null {
  if (!Array.isArray(players)) return 'Players must be a list of names.';
  if (players.length < MIN_PLAYERS) return 'What Am I? needs at least 2 players.';
  if (players.length > MAX_PLAYERS) return 'Up to 20 players.';
  if (!players.every(usableName)) return 'Every player needs a name.';
  if (new Set(players).size !== players.length) return 'Each name may appear once.';
  return null;
}

/** Players still to play this round, in turn order (the current player first). */
export const toPlayOf = (s: WaiState): string[] => s.order.filter((p) => !s.played.includes(p));

/** Whose turn it is (T1 to T4), or null. */
export function currentPlayer(s: WaiState): string | null {
  if (s.turn) return s.turn.player;
  if (s.step !== 'pass') return null;
  return toPlayOf(s)[0] ?? null;
}

const holdOf = (s: WaiState, p: string): Hold => s.holds[p] ?? s.choices?.hold ?? 'hand';

/** When every current player has saved a turn this round, the next round starts. */
function nextRoundIfDone(s: WaiState): WaiState {
  if (s.order.length > 0 && toPlayOf(s).length === 0) return { ...s, round: s.round + 1, played: [], joined: [] };
  return s;
}

function emptyTurn(player: string): OpenTurn {
  return { player, got: [], passed: [], moved: [], endedEarly: false, shown: [] };
}

/** Starts the turn if T1 has its first move (a mark, time up or a pause from T2). */
function withTurn(s: WaiState): WaiState {
  if (s.turn) return s;
  const p = currentPlayer(s);
  return { ...s, step: 'turn', turn: emptyTurn(p!) };
}

/** A game ended: its result from the saved turns (WAI-060, WAI-061; R4: leavers never win). */
export function resultOf(s: WaiState): GameResult {
  const current = s.order;
  const top = Math.max(0, ...current.map((p) => s.scores[p]?.score ?? 0));
  const winners = top > 0 ? current.filter((p) => (s.scores[p]?.score ?? 0) === top) : [];
  let bestTurn: GameResult['bestTurn'] = null;
  for (const t of s.saved) if (!bestTurn || t.got > bestTurn.got) bestTurn = { player: t.player, got: t.got };
  return {
    game: s.game,
    winners,
    top,
    bestTurn,
    passed: s.saved.flatMap((t) => t.passed),
    moved: s.saved.reduce((n, t) => n + t.moved, 0),
    endedEarly: s.saved.filter((t) => t.endedEarly).length,
    turns: s.saved.length,
  };
}

/** WAI-064: tonight's summary over tonight's ended games (players: everyone who saved a turn tonight). */
export function tonightOf(s: WaiState): Tonight {
  const players: string[] = [];
  const add = (p: string) => { if (!players.includes(p)) players.push(p); };
  for (const g of s.past) for (const t of g.turns) add(t.player);
  for (const t of s.saved) add(t.player);
  const counted = s.past.filter((g) => g.turns.length > 0);
  const got = new Map<string, number>();
  const wins = new Map<string, number>();
  let total = 0;
  for (const g of counted) {
    for (const t of g.turns) {
      total += t.got;
      got.set(t.player, (got.get(t.player) ?? 0) + t.got);
    }
    for (const w of g.result.winners) wins.set(w, (wins.get(w) ?? 0) + 1);
  }
  const winList = players
    .filter((p) => (wins.get(p) ?? 0) > 0)
    .map((p) => ({ player: p, wins: wins.get(p)! }))
    .sort((a, b) => b.wins - a.wins);
  let best: Tonight['best'] = null;
  const guessers = players.filter((p) => got.has(p));
  if (guessers.length > 0) {
    const most = Math.max(...guessers.map((p) => got.get(p)!));
    best = { players: guessers.filter((p) => got.get(p) === most), got: most };
  }
  return { players, games: counted.length, got: total, wins: winList, best };
}

function endGame(s: WaiState): WaiState {
  const result = resultOf(s);
  const past: PastGame = { result, turns: s.saved };
  return { ...s, step: 'gameOver', paused: false, pausedTurn: false, turn: null, result, past: [...s.past, past] };
}

/** A people change between turns (leave, add, reorder): T1 shows the first player still to play. */
function people(s: WaiState, order: readonly string[], left: readonly string[], joined: readonly string[], scores = s.scores): WaiState {
  return nextRoundIfDone({ ...s, order, left, joined, scores });
}

function applyMove(s: WaiState, move: WaiMove): Verdict<WaiState> {
  if (!isObject(move)) return no('Not a move.');
  if (s.step === 'ended') return no('Tonight has ended.');
  const open = gameOpen(s);
  const between = s.step === 'pass' && !s.turn && !s.paused; // T1 or R1, no turn under way
  const head = headOf(s);

  switch (move.type) {
    case 'start': {
      if (s.step !== 'new' && s.step !== 'gameOver') return no('A game is already open.');
      const problem = playersProblem(move.players);
      if (problem) return no(problem);
      if (!validChoices(move.choices)) return no('Those choices are not allowed.');
      const choices = cleanChoices(move.choices);
      const game = s.game + 1;
      const players = [...move.players];
      const q = buildUnshown(s.words, s.seed, game, choices, s.shownTonight);
      return ok({
        ...s, step: 'pass', paused: false, pausedTurn: false, game, choices, order: players, left: [], holds: {},
        scores: Object.fromEntries(players.map((p) => [p, { score: 0, turns: 0 }])), round: 1, played: [], joined: [],
        turn: null, saved: [], unshown: q.unshown, fallback: q.fallback, shownThisGame: [], undo: null,
      });
    }

    case 'got':
    case 'pass': {
      if (s.paused || !(s.step === 'pass' || s.step === 'turn')) return no('No word is on screen.');
      if (head === null || move.word !== head) return no('That word is not on screen.');
      const t = withTurn(s);
      const turn = t.turn!;
      const next: OpenTurn = move.type === 'got'
        ? { ...turn, got: [...turn.got, head], shown: [...turn.shown, head] }
        : { ...turn, passed: [...turn.passed, head], shown: [...turn.shown, head] };
      return ok({ ...t, ...markShown(t, head), turn: next, undo: null });
    }

    case 'timeUp': {
      if (s.paused || !(s.step === 'pass' || s.step === 'turn')) return no('No turn is running.');
      const t = withTurn(s);
      if (move.word === undefined) return ok({ ...t, step: 'review', undo: null });
      if (head === null || move.word !== head) return no('That word is not on screen.');
      const turn = t.turn!;
      return ok({
        ...t, ...markShown(t, head), step: 'review', undo: null,
        turn: { ...turn, passed: [...turn.passed, head], shown: [...turn.shown, head] },
      });
    }

    case 'pause': {
      if (s.paused) return no('Already paused.');
      if (typeof move.turn !== 'boolean') return no('A pause says whether a turn was under way.');
      if (!move.turn) {
        if (!((s.step === 'pass' && !s.turn) || s.step === 'review')) return no('A turn is under way.');
        if (move.word !== undefined) return no('No word is on screen.');
        return ok({ ...s, paused: true, pausedTurn: false });
      }
      if (!(s.step === 'pass' || s.step === 'turn')) return no('No turn is under way.');
      const t = withTurn(s);
      if (move.word === undefined) return ok({ ...t, paused: true, pausedTurn: true, undo: null });
      if (head === null || move.word !== head) return no('That word is not on screen.');
      return ok({ ...t, paused: true, pausedTurn: true, unshown: hideWord(t, head), undo: null });
    }

    case 'resume':
      if (!s.paused) return no('Nothing is paused.');
      return ok({ ...s, paused: false, pausedTurn: false });

    case 'skip': {
      if (!s.paused || !s.pausedTurn || !s.turn) return no('Only a paused turn can end early.');
      return ok({ ...s, paused: false, pausedTurn: false, step: 'review', turn: { ...s.turn, endedEarly: true }, undo: null });
    }

    case 'fix': {
      if (s.step !== 'review' || s.paused || !s.turn) return no('Words are fixed on the time\'s up screen.');
      const t = s.turn;
      const w = move.word;
      let got = t.got, passed = t.passed;
      if (got.includes(w)) { got = got.filter((x) => x !== w); passed = [...passed, w]; }
      else if (passed.includes(w)) { passed = passed.filter((x) => x !== w); got = [...got, w]; }
      else return no('That word is not in this turn.');
      const moved = t.moved.includes(w) ? t.moved.filter((x) => x !== w) : [...t.moved, w];
      return ok({ ...s, turn: { ...t, got, passed, moved }, undo: null });
    }

    case 'scoreTurn': {
      if (s.step !== 'review' || s.paused || !s.turn) return no('There is no turn to save.');
      const t = s.turn;
      const passedSet = new Set(t.passed);
      const saved: SavedTurn = {
        round: s.round, player: t.player, got: t.got.length, passed: t.shown.filter((w) => passedSet.has(w)),
        moved: t.moved.length, endedEarly: t.endedEarly,
      };
      const prev = s.scores[t.player] ?? { score: 0, turns: 0 };
      const next: WaiState = {
        ...s, step: 'pass', turn: null, saved: [...s.saved, saved],
        scores: { ...s.scores, [t.player]: { score: prev.score + saved.got, turns: prev.turns + 1 } },
        played: s.played.includes(t.player) ? s.played : [...s.played, t.player],
        undo: { ...s, undo: null },
      };
      return ok(nextRoundIfDone(next));
    }

    case 'undoScore':
      if (!s.undo || s.paused) return no('There is no saved score to take back.');
      return ok({ ...s.undo, undo: null });

    case 'addPlayer': {
      if (!between) return no('Players change between turns.');
      if (!usableName(move.name)) return no('A new player needs a name.');
      const name = move.name;
      if (s.order.includes(name)) return no(`${name} is already playing.`);
      if (s.order.length >= MAX_PLAYERS) return no('Up to 20 players.');
      const scores = s.scores[name] ? s.scores : { ...s.scores, [name]: { score: 0, turns: 0 } };
      const joined = s.played.includes(name) || s.joined.includes(name) ? s.joined : [...s.joined, name];
      return ok({ ...people(s, [...s.order, name], s.left.filter((p) => p !== name), joined, scores), undo: null });
    }

    case 'leave': {
      if (!between) return no('Players change between turns.');
      if (!s.order.includes(move.player)) return no('That player is not playing.');
      if (s.order.length <= MIN_PLAYERS) return no('2 players needed.');
      const order = s.order.filter((p) => p !== move.player);
      return ok({ ...people(s, order, [...s.left, move.player], s.joined.filter((p) => p !== move.player)), undo: null });
    }

    case 'reorder': {
      if (!between) return no('Players change between turns.');
      const o = move.order;
      if (!Array.isArray(o) || o.length !== s.order.length || new Set(o).size !== o.length || !o.every((p) => s.order.includes(p))) {
        return no('A new order must hold the same players.');
      }
      return ok({ ...s, order: [...o], undo: null });
    }

    case 'setPlayers': {
      if (!between) return no('Players change between turns.');
      const problem = playersProblem(move.players);
      if (problem) return no(problem);
      const players = [...move.players];
      const leaving = s.order.filter((p) => !players.includes(p));
      const scores = { ...s.scores };
      for (const p of players) if (!scores[p]) scores[p] = { score: 0, turns: 0 };
      const left = [...s.left.filter((p) => !players.includes(p)), ...leaving];
      const joined = [
        ...s.joined.filter((p) => players.includes(p)),
        ...players.filter((p) => !s.order.includes(p) && !s.played.includes(p) && !s.joined.includes(p)),
      ];
      return ok({ ...people(s, players, left, joined, scores), undo: null });
    }

    case 'setHold': {
      if (!between) return no('The hold changes on the pass screen.');
      if (!s.order.includes(move.player)) return no('That player is not playing.');
      if (move.hold !== 'hand' && move.hold !== 'free') return no('Hold is hand or free.');
      return ok({ ...s, holds: { ...s.holds, [move.player]: move.hold }, undo: null });
    }

    case 'setChoices': {
      if (s.paused) return no('Paused.');
      if (!(between || s.step === 'review' || s.step === 'gameOver')) return no('Words and time change between turns.');
      if (!validChoices(move.choices)) return no('Those choices are not allowed.');
      const choices = cleanChoices(move.choices);
      const before = s.choices;
      let next: WaiState = { ...s, choices, undo: null };
      if (open && (!before || before.pack !== choices.pack || before.nonveg !== choices.nonveg)) {
        const q = buildUnshown(s.words, s.seed, s.game, choices, s.shownTonight);
        next = { ...next, unshown: q.unshown, fallback: q.fallback };
      }
      return ok(next);
    }

    case 'endGame':
      if (!open) return no('No game is open.');
      return ok({ ...endGame(s), undo: null });

    case 'endEvening':
      if (open) return no('End the game first.');
      return ok({ ...s, step: 'ended', paused: false, pausedTurn: false, undo: null });

    default:
      return no('Not a What Am I? move.');
  }
}

function legal(s: WaiState): WaiMove[] {
  if (s.step === 'ended') return [];
  if (s.step === 'new' || s.step === 'gameOver') return [{ type: 'endEvening' }];
  if (s.paused) {
    const out: WaiMove[] = [{ type: 'resume' }];
    if (s.pausedTurn) out.push({ type: 'skip' });
    out.push({ type: 'endGame' });
    return out;
  }
  const out: WaiMove[] = [];
  if (s.step === 'review') {
    for (const w of [...s.turn!.got, ...s.turn!.passed]) out.push({ type: 'fix', word: w });
    out.push({ type: 'scoreTurn' }, { type: 'pause', turn: false }, { type: 'endGame' });
    return out;
  }
  const head = headOf(s);
  if (head !== null) {
    out.push(
      { type: 'got', word: head }, { type: 'pass', word: head }, { type: 'timeUp', word: head },
      { type: 'pause', turn: true, word: head },
    );
  }
  out.push({ type: 'timeUp' }, { type: 'pause', turn: true });
  if (s.step === 'pass' && !s.turn) {
    out.push({ type: 'pause', turn: false });
    if (s.order.length > MIN_PLAYERS) for (const p of s.order) out.push({ type: 'leave', player: p });
    if (s.undo) out.push({ type: 'undoScore' });
  }
  out.push({ type: 'endGame' });
  return out;
}

function view(s: WaiState): WaiView {
  const left = new Set(s.left);
  const rank = (ps: readonly string[]) =>
    ps.map((p, i) => ({ p, i, sc: s.scores[p] ?? { score: 0, turns: 0 } }))
      .sort((a, b) => b.sc.score - a.sc.score || a.i - b.i);
  const scoreboard = s.game === 0 ? [] : [
    ...rank(s.order).map(({ p, sc }) => ({ player: p, score: sc.score, turns: sc.turns, left: false })),
    ...s.left.map((p) => ({ player: p, score: s.scores[p]?.score ?? 0, turns: s.scores[p]?.turns ?? 0, left: left.has(p) })),
  ];
  const rounds = Math.max(0, ...s.saved.map((t) => t.round));
  const passedByRound: string[][] = Array.from({ length: rounds }, () => []);
  for (const t of s.saved) passedByRound[t.round - 1]!.push(...t.passed);
  const inGame = gameOpen(s);
  return {
    step: s.step,
    paused: s.paused,
    game: s.game,
    round: s.round,
    player: inGame ? currentPlayer(s) : null,
    order: [...s.order],
    toPlay: inGame ? toPlayOf(s) : [],
    left: [...s.left],
    holds: Object.fromEntries(s.order.map((p) => [p, holdOf(s, p)])),
    choices: s.choices,
    turn: inGame && s.turn
      ? { got: [...s.turn.got], passed: [...s.turn.passed], moved: [...s.turn.moved], endedEarly: s.turn.endedEarly }
      : null,
    scoreboard,
    passedByRound,
    result: s.result,
    tonight: tonightOf(s),
  };
}

function invariants(s: WaiState): string[] {
  const out: string[] = [];
  if (new Set(s.order).size !== s.order.length) out.push('A player is listed twice in the turn order.');
  if (gameOpen(s)) {
    if (s.order.length < MIN_PLAYERS || s.order.length > MAX_PLAYERS) out.push('A game needs 2 to 20 players.');
    if (!s.choices) out.push('An open game has no choices.');
  }
  if (s.order.some((p) => s.left.includes(p))) out.push('A current player is also listed as left.');
  if (new Set(s.unshown).size !== s.unshown.length) out.push('A word is twice in the queue.');
  if (s.turn) {
    const all = [...s.turn.got, ...s.turn.passed];
    if (new Set(all).size !== all.length) out.push('A word is in both lists of a turn.');
    if (all.length !== s.turn.shown.length) out.push('A turn\'s lists do not match the words shown.');
  }
  for (const [p, sc] of Object.entries(s.scores)) {
    if (sc.score < 0 || sc.turns < 0) out.push(`${p} has a negative score.`);
  }
  const total = s.saved.reduce((n, t) => n + t.got, 0);
  const scored = Object.values(s.scores).reduce((n, sc) => n + sc.score, 0);
  if (gameOpen(s) && total !== scored) out.push('The scores do not add up to the saved turns.');
  return out;
}

export const whatAmIRules: GameRules<WaiConfig, WaiState, WaiMove, WaiView> = {
  id: 'what-am-i',
  detailMoves: ['start', 'addPlayer', 'reorder', 'setHold', 'setChoices', 'setPlayers'],

  setup(input) {
    const test = input.config?.testWords;
    return {
      words: test ? [...test] : WORDS,
      seed: input.seeds.words ?? '',
      step: 'new', paused: false, pausedTurn: false, game: 0, choices: null, order: [], left: [], holds: {}, scores: {},
      round: 0, played: [], joined: [], turn: null, saved: [], unshown: [], fallback: false, shownTonight: [], shownThisGame: [], undo: null,
      result: null, past: [],
    };
  },

  legalMoves(state: WaiState, _actor: ActorId) {
    return legal(state);
  },

  apply(state: WaiState, move: WaiMove, _ctx: MoveContext) {
    return applyMove(state, move);
  },

  view(state: WaiState, _viewer: Viewer) {
    return view(state);
  },

  isOver: (state) => state.step === 'ended',

  invariants,

  // Undo is the `undoScore` move; the app removes `endGame` and `endEvening` itself (WAI-060, WAI-064).
  canUndo: () => false,
};

/** The text of a word id in this game night's list. */
export const wordText = (state: WaiState, id: string): string => wordById(state.words, id)?.word ?? id;
