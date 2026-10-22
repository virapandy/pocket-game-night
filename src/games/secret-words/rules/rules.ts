// Secret Words on the engine's game contract (src/engine/CLAUDE.md): setup, legal moves, apply, view, game over,
// invariants, undo. The contract is specs/secret-words/ (scenarios v3.6) and its rule API, specs/secret-words/api.md.
// One evening is one match: its first move is a deal, and it holds every game until `endEvening`.
// Every board comes from its map code (SWD-022); every code the rules list comes from the deal seed (SWD-024); the
// broken-rule word and the Landmine's free word come from the deal seed, the deal number and the turn (SWD-043, 046).
// The state stays plain data, so a replay gives exactly the same state.
import { createRng, type GameRules, type MoveContext, type Verdict, type Viewer } from '../../../engine';
import { boardFromCode, candidates, codeFor, latestEdition, pickDeck, sizeOf, WORDS } from './code';
import type {
  ClueInForce, ClueNumber, DeckPlace, GameState, LastTurn, PastGame, SecretWordsCell, SecretWordsChoices, SecretWordsConfig,
  SecretWordsMove, SecretWordsState, SecretWordsView, Team, Teams, TurnEnd,
} from './types';

const MAX_PLAYERS = 20;
const MAX_CLUE_WORD = 24;

type Result = Verdict<SecretWordsState>;
const ok = (value: SecretWordsState): Result => ({ ok: true, value });
const no = (reason: string): Result => ({ ok: false, reason });

export const other = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');
const TEAMS: readonly Team[] = ['orange', 'teal'];
const isString = (x: unknown): x is string => typeof x === 'string';
const isStringList = (x: unknown): x is string[] => Array.isArray(x) && x.every(isString);

// ---- Teams and players ----

/** A problem with these players and teams, or null when they are fine (Moves: "Every team change keeps …"). */
export function teamsProblem(players: unknown, teams: unknown): string | null {
  if (!isStringList(players)) return 'Players must be a list of names.';
  if (typeof teams !== 'object' || teams === null) return 'Teams are missing.';
  const t = teams as Partial<Record<keyof Teams, unknown>>;
  if (!isStringList(t.orange) || !isStringList(t.teal)) return 'Each team must be a list of names.';
  const all = [...t.orange, ...t.teal];
  if (all.some((p) => p.trim() === '')) return 'A player has no name.';
  const lower = all.map((p) => p.toLowerCase());
  if (new Set(lower).size !== lower.length) return 'A name is there twice.';
  if (all.length > MAX_PLAYERS) return '20 players is the most.';
  if (players.length !== all.length || !players.every((p) => all.includes(p))) return 'The teams must hold exactly the players.';
  const guessOnly = t.guessOnly === undefined ? [] : t.guessOnly;
  if (!isStringList(guessOnly)) return 'Guessers-only must be a list of names.';
  const givers = t.clueGivers as Record<string, unknown> | undefined;
  const partners = (t.partners ?? { orange: null, teal: null }) as Record<string, unknown>;
  if (typeof givers !== 'object' || givers === null || typeof partners !== 'object' || partners === null) return 'Clue givers are missing.';
  for (const team of TEAMS) {
    const list = t[team] as string[];
    if (list.length < 2) return 'Each team needs at least 2 players.';
    const cg = givers[team];
    if (!isString(cg) || !list.includes(cg)) return 'Each team needs a clue giver from that team.';
    if (guessOnly.includes(cg)) return "A clue giver can't be a player who doesn't give clues.";
    const partner = partners[team] ?? null;
    if (partner !== null) {
      if (!isString(partner) || !list.includes(partner) || partner === cg) return 'A partner must be another player of that team.';
      if (guessOnly.includes(partner)) return "A partner can't be a player who doesn't give clues.";
    }
    if (list.length - 1 - (partner === null ? 0 : 1) < 1) return 'Each team needs at least 1 guesser.';
  }
  return null;
}

/** A plain copy of the teams, keeping the evening's team names, with only current players as guessers-only. */
function copyTeams(t: Teams, names: Teams['names']): Teams {
  const all = [...t.orange, ...t.teal];
  return {
    orange: [...t.orange],
    teal: [...t.teal],
    clueGivers: { orange: t.clueGivers?.orange ?? null, teal: t.clueGivers?.teal ?? null },
    partners: { orange: t.partners?.orange ?? null, teal: t.partners?.teal ?? null },
    names: { id: names.id, orange: names.orange, teal: names.teal },
    guessOnly: (t.guessOnly ?? []).filter((p) => all.includes(p)),
  };
}

function choicesProblem(c: unknown): string | null {
  if (typeof c !== 'object' || c === null) return 'Choices are missing.';
  const x = c as Partial<Record<keyof SecretWordsChoices, unknown>>;
  if (x.map !== 'pass' && x.map !== 'shared' && x.map !== 'own') return 'Unknown phones choice.';
  if (x.board !== 'full' && x.board !== 'easy') return 'Unknown board.';
  if (x.landmine !== 'lose' && x.landmine !== 'turn') return 'Unknown Landmine choice.';
  if (x.words !== 'family' && x.words !== 'grownups') return 'Unknown words choice.';
  return null;
}

const copyChoices = (c: SecretWordsChoices): SecretWordsChoices => ({ map: c.map, board: c.board, landmine: c.landmine, words: c.words });

/** SWD-122: the team's players minus this game's clue giver and partner, in team list order. */
function guessersOf(s: SecretWordsState, team: Team): string[] {
  return s.teams[team].filter((p) => p !== s.teams.clueGivers[team] && p !== s.teams.partners[team]);
}

// ---- The deck (SWD-024) ----

const candidateCache = new Map<string, string[]>();
function candidateIds(edition: number, words: SecretWordsChoices['words']): string[] {
  const key = `${edition}:${words}`;
  let ids = candidateCache.get(key);
  if (!ids) {
    ids = candidates(WORDS, edition, words).map((w) => w.id);
    candidateCache.set(key, ids);
  }
  return ids;
}

/**
 * The next deck deal's place and code: the next deal index of the current deck, or a new deck (k + 1, n = 0) at the
 * first deal, when Board or Words changed since the deck's last deal, and when the deck runs out.
 */
function planNext(s: Omit<SecretWordsState, 'plan'>): SecretWordsState['plan'] {
  const { board, words } = s.choices;
  const edition = latestEdition(WORDS);
  const cands = candidateIds(edition, words);
  const d = s.deck;
  let place: DeckPlace;
  if (d && d.board === board && d.words === words && 25 * (d.n + 1) + sizeOf(board) <= cands.length) {
    place = { k: d.k, d: d.d, n: d.n + 1, board, words };
  } else {
    const k = (d?.k ?? 0) + 1;
    place = { k, d: pickDeck(s.dealSeed, k, cands, new Set([...s.dealt, ...s.recent])), n: 0, board, words };
  }
  return { ...place, code: codeFor({ edition, board, words }, place.d, place.n) };
}

/** The code the next deal records: the test hook's board, else SWD-024's. */
const nextCode = (s: SecretWordsState): string => s.testBoards[s.deals] ?? s.plan.code;

// ---- The board in play ----

const leftOf = (g: Pick<GameState, 'kinds' | 'turned'>, team: Team): number =>
  g.kinds.reduce((n, k, i) => (k === team && !g.turned[i] ? n + 1 : n), 0);

/** A clue's allowance (Terms): number + 1 for 1–9; unlimited for 0 and ∞. */
const allowance = (n: ClueNumber): number => (n === 0 || n === 'inf' ? Infinity : n + 1);

/** The other team's face-down cells, one drawn from this seed (SWD-043, SWD-046). */
function drawOtherCell(g: GameState, seed: string): number {
  const list: number[] = [];
  g.kinds.forEach((k, i) => { if (k === other(g.turn) && !g.turned[i]) list.push(i); });
  return list.length === 0 ? -1 : list[createRng(seed).int(list.length)]!;
}

/** SWD-046: the cell "Turn ends, they get a word" turns over, for the turn under way. */
export function penaltyCell(state: SecretWordsState, dealSeed: string): number {
  return state.game ? drawOtherCell(state.game, `${dealSeed}:penalty:${state.deals}:${state.game.turnNo}`) : -1;
}

/** SWD-043: the Landmine's free word under Lose your turn, for the turn under way. */
const freeCellFor = (s: SecretWordsState, g: GameState): number => drawOtherCell(g, `${s.dealSeed}:landmine:${s.deals}:${g.turnNo}`);

const landmineLosesTurn = (s: SecretWordsState): boolean => s.choices.landmine === 'turn';

function freshGame(code: string, b: { words: readonly string[]; ids: readonly string[]; kinds: GameState['kinds']; starts: Team }): GameState {
  return {
    code, words: [...b.words], ids: [...b.ids], kinds: [...b.kinds], starts: b.starts,
    turned: b.words.map(() => false), step: 'clue', turn: b.starts, turnNo: 1, mapSeen: false, clue: null, guesses: 0, found: 0,
    ended: null, endedCell: null, lastTurn: null, clues: [], guessTurns: { orange: 0, teal: 0 }, picker: null,
    winner: null, endedEarly: false, landmine: false,
  };
}

function deal(s: SecretWordsState, code: unknown): Result {
  if (!isString(code)) return no('A deal needs a map code.');
  const b = boardFromCode(code, WORDS);
  if ('error' in b) return no(b.error === 'newer' ? 'That map code needs a newer word list.' : "That map code isn't valid.");
  const fromDeck = s.deals >= s.testBoards.length;
  const known = new Set(s.dealt);
  const base = {
    ...s,
    deck: fromDeck ? { k: s.plan.k, d: s.plan.d, n: s.plan.n, board: s.plan.board, words: s.plan.words } : s.deck,
    dealt: [...s.dealt, ...b.ids.filter((id) => !known.has(id))],
    deals: s.deals + 1,
    game: freshGame(code, b),
  };
  return ok({ ...base, plan: planNext(base) });
}

/** The game ends: a winner, or ended early. It joins the evening's games with its credited clue givers. */
function finish(s: SecretWordsState, g: GameState): Result {
  const credit = (t: Team) => [s.teams.clueGivers[t], s.teams.partners[t]].filter(isString);
  const past: PastGame = {
    number: s.games.length + 1, winner: g.winner, endedEarly: g.endedEarly, landmine: g.landmine, code: g.code,
    clueGivers: { orange: credit('orange'), teal: credit('teal') }, clues: g.clues.map((c) => ({ ...c })),
  };
  return ok({ ...s, game: { ...g, step: 'over' }, games: [...s.games, past] });
}

const turnOver = (g: GameState, ended: TurnEnd, cell: number | null): GameState => ({ ...g, step: 'turn-over', ended, endedCell: cell });

function withClueFound(g: GameState): ClueInForce[] {
  const clues = g.clues.slice();
  const last = clues[clues.length - 1];
  if (last) clues[clues.length - 1] = { ...last, found: last.found + 1 };
  return clues;
}

function clue(s: SecretWordsState, g: GameState, m: { n?: unknown; word?: unknown }): Result {
  const changing = g.step === 'guessing' && g.guesses === 0;
  if (g.step !== 'clue' && !changing) return no('A clue is given before the first guess.');
  const n = m.n;
  if (!(n === 'inf' || (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 9))) return no('A clue is a number 0–9 or ∞.');
  let word: string | undefined;
  if (m.word !== undefined) {
    if (!isString(m.word)) return no('A clue word is text.');
    word = m.word.trim();
    if (word.length < 1 || word.length > MAX_CLUE_WORD) return no('A clue word is 1 to 24 characters.');
  }
  const given = word === undefined ? { n: n as ClueNumber } : { n: n as ClueNumber, word };
  const entry: ClueInForce = { team: g.turn, ...given, found: 0 };
  if (changing) {
    return ok({ ...s, game: { ...g, clue: given, clues: [...g.clues.slice(0, -1), entry] } });
  }
  const guessers = guessersOf(s, g.turn);
  const r = g.guessTurns[g.turn];
  return ok({
    ...s,
    game: {
      ...g, step: 'guessing', clue: given, guesses: 0, found: 0, clues: [...g.clues, entry],
      guessTurns: { ...g.guessTurns, [g.turn]: r + 1 }, picker: guessers.length ? guessers[r % guessers.length]! : null,
    },
  });
}

function reveal(s: SecretWordsState, g: GameState, m: { cell?: unknown; freeCell?: unknown }): Result {
  if (g.step !== 'guessing' || !g.clue) return no('Guesses come after the clue.');
  const cell = m.cell;
  if (typeof cell !== 'number' || !Number.isInteger(cell) || cell < 0 || cell >= g.words.length) return no('No such word on the board.');
  if (g.turned[cell]) return no('That word is already turned over.');
  if (g.guesses >= allowance(g.clue.n)) return no('No guesses left.');
  const kind = g.kinds[cell]!;
  const t = g.turn;
  const o = other(t);
  const mineTurn = kind === 'landmine' && landmineLosesTurn(s);
  const free = mineTurn ? freeCellFor(s, g) : -1;
  if (mineTurn) {
    if (m.freeCell !== free) return no("The Landmine's free word is not that one.");
  } else if (m.freeCell !== undefined) return no('Only the Landmine gives a free word.');

  const turned = g.turned.slice();
  turned[cell] = true;
  const guesses = g.guesses + 1;
  const usedUp = guesses >= allowance(g.clue.n);
  let next: GameState = { ...g, turned, guesses };

  if (kind === 'landmine') {
    if (!mineTurn) return finish(s, { ...next, winner: o, landmine: true });
    turned[free] = true;
    if (leftOf(next, o) === 0) return finish(s, { ...next, winner: o });
    return ok({ ...s, game: turnOver(next, 'landmine', null) });
  }
  if (kind === t) {
    next = { ...next, found: g.found + 1, clues: withClueFound(g) };
    if (leftOf(next, t) === 0) return finish(s, { ...next, winner: t });
    return ok({ ...s, game: usedUp ? turnOver(next, 'allowance', null) : next });
  }
  if (kind === o && leftOf(next, o) === 0) return finish(s, { ...next, winner: o });
  // SWD-103's order: allowance used up comes before a blank word and the other team's word.
  if (usedUp) return ok({ ...s, game: turnOver(next, 'allowance', null) });
  return ok({ ...s, game: turnOver(next, kind === 'nobody' ? 'nobody' : 'other', cell) });
}

function nextTurn(s: SecretWordsState, g: GameState): Result {
  if (g.step !== 'turn-over' || g.ended === null) return no('The turn is still under way.');
  const withCell = g.ended === 'nobody' || g.ended === 'other';
  const lastTurn: LastTurn = withCell && g.endedCell !== null
    ? { team: g.turn, found: g.found, ended: g.ended, cell: g.endedCell }
    : { team: g.turn, found: g.found, ended: g.ended };
  return ok({
    ...s,
    game: {
      ...g, step: 'clue', turn: other(g.turn), turnNo: g.turnNo + 1, mapSeen: false, clue: null, guesses: 0, found: 0,
      ended: null, endedCell: null, lastTurn, picker: null,
    },
  });
}

function renamed(s: SecretWordsState, renames: unknown): Pick<SecretWordsState, 'games' | 'game'> {
  if (typeof renames !== 'object' || renames === null) return { games: s.games, game: s.game };
  const map = renames as Record<string, unknown>;
  const to = (p: string): string => (Object.prototype.hasOwnProperty.call(map, p) && isString(map[p]) ? (map[p] as string) : p);
  return {
    games: s.games.map((g) => ({ ...g, clueGivers: { orange: g.clueGivers.orange.map(to), teal: g.clueGivers.teal.map(to) } })),
    game: s.game && s.game.picker !== null ? { ...s.game, picker: to(s.game.picker) } : s.game,
  };
}

// ---- The contract ----

function setup(config: SecretWordsConfig, seeds: Readonly<Record<string, string>>): SecretWordsState {
  const teams = copyTeams(config.teams, config.teams.names);
  const base: Omit<SecretWordsState, 'plan'> = {
    dealSeed: seeds.deal ?? '',
    testBoards: [...(config.testBoards ?? [])],
    recent: [...(config.excludedWords?.recent ?? [])],
    players: [...config.players],
    teams,
    splits: config.splits ?? 0,
    choices: copyChoices(config.choices),
    deck: null,
    dealt: [],
    deals: 0,
    game: null,
    games: [],
    ended: false,
  };
  return { ...base, plan: planNext(base) };
}

function legalMoves(s: SecretWordsState): SecretWordsMove[] {
  if (s.ended) return [];
  const g = s.game;
  if (!g || g.step === 'over') {
    const out: SecretWordsMove[] = [{ type: 'deal', code: nextCode(s) }];
    if (g) out.push({ type: 'endEvening' });
    return out;
  }
  const out: SecretWordsMove[] = [];
  if (g.step === 'clue') {
    if (s.choices.map === 'pass' && !g.mapSeen) out.push({ type: 'mapSeen' });
  } else if (g.step === 'guessing') {
    const mineTurn = landmineLosesTurn(s);
    g.turned.forEach((t, cell) => {
      if (t) return;
      if (g.kinds[cell] === 'landmine' && mineTurn) out.push({ type: 'reveal', cell, freeCell: freeCellFor(s, g) });
      else out.push({ type: 'reveal', cell });
    });
    if (g.guesses === 0) out.push({ type: 'brokeRule', cell: penaltyCell(s, s.dealSeed) });
    else out.push({ type: 'endTurn' });
  } else if (g.step === 'turn-over') {
    out.push({ type: 'nextTurn' });
  }
  out.push({ type: 'dealNew', code: nextCode(s) }, { type: 'endGame' });
  return out;
}

function apply(s: SecretWordsState, move: SecretWordsMove, _ctx: MoveContext): Result {
  if (s.ended) return no('This game night has ended.');
  if (typeof move !== 'object' || move === null) return no('Unknown move.');
  const m = move as SecretWordsMove & Record<string, unknown>;
  const g = s.game;
  const atGameOver = g !== null && g.step === 'over';
  const playing = g !== null && g.step !== 'over';
  switch (m.type) {
    case 'deal':
      if (playing) return no('A game is under way: use New board.');
      return deal(s, m.code);
    case 'dealNew':
      if (!playing) return no('New board is for a game under way.');
      return deal(s, m.code);
    case 'mapSeen':
      if (!playing || g.step !== 'clue' || g.mapSeen || s.choices.map !== 'pass') return no('The map is seen once, before the clue.');
      return ok({ ...s, game: { ...g, mapSeen: true } });
    case 'clue':
      if (!playing) return no('No game is under way.');
      return clue(s, g, m);
    case 'reveal':
      if (!playing) return no('No game is under way.');
      return reveal(s, g, m);
    case 'endTurn':
      if (!playing || g.step !== 'guessing' || g.guesses === 0) return no('A turn ends early only after a guess.');
      return ok({ ...s, game: turnOver(g, 'stopped', null) });
    case 'brokeRule': {
      if (!playing || g.step !== 'guessing' || g.guesses > 0) return no('A clue can be refused only before the first guess.');
      const cell = penaltyCell(s, s.dealSeed);
      if (m.cell !== cell) return no("That is not the other team's free word.");
      const turned = g.turned.slice();
      turned[cell] = true;
      const next: GameState = { ...g, turned };
      if (leftOf(next, other(g.turn)) === 0) return finish(s, { ...next, winner: other(g.turn) });
      return ok({ ...s, game: turnOver(next, 'rule', null) });
    }
    case 'nextTurn':
      if (!playing) return no('No game is under way.');
      return nextTurn(s, g);
    case 'endGame':
      if (!playing) return no('No game is under way.');
      return finish(s, { ...g, endedEarly: true });
    case 'endEvening':
      if (!atGameOver) return no('End the game first.');
      return ok({ ...s, ended: true });
    case 'setChoices': {
      if (!atGameOver) return no('Choices change between games.');
      const problem = choicesProblem(m.choices);
      if (problem) return no(problem);
      const base = { ...s, choices: copyChoices(m.choices) };
      return ok({ ...base, plan: planNext(base) });
    }
    case 'setClueGivers': {
      if (!atGameOver) return no('Clue givers change between games.');
      const teams = { ...s.teams, clueGivers: m.clueGivers, partners: m.partners };
      const problem = teamsProblem(s.players, teams);
      if (problem) return no(problem);
      return ok({ ...s, teams: copyTeams(teams, s.teams.names) });
    }
    case 'setTeams': {
      if (!atGameOver) return no('Teams change between games.');
      if (typeof m.splits !== 'number' || !Number.isInteger(m.splits) || m.splits < 0) return no('Splits must be a count.');
      const problem = teamsProblem(s.players, m.teams);
      if (problem) return no(problem);
      return ok({ ...s, teams: copyTeams(m.teams, s.teams.names), splits: m.splits });
    }
    case 'setPlayers': {
      if (g === null) return no('Players change from the first deal.');
      const problem = teamsProblem(m.players, m.teams);
      if (problem) return no(problem);
      return ok({ ...s, ...renamed(s, m.renames), players: [...m.players], teams: copyTeams(m.teams, s.teams.names) });
    }
    default:
      return no('Unknown move.');
  }
}

function roomView(s: SecretWordsState, showMap: boolean): SecretWordsView {
  const g = s.game;
  if (!g) {
    return {
      cells: [], clueWord: null, clue: null, guessesLeft: null, clues: [], lastTurn: null, turn: 'orange', left: { orange: 0, teal: 0 },
      picker: null, step: s.ended ? 'ended' : 'before', winner: null, endedEarly: false,
    };
  }
  const over = g.step === 'over';
  const cells: SecretWordsCell[] = g.words.map((word, i) => (over || showMap || g.turned[i] ? { word, kind: g.kinds[i]! } : { word }));
  const guessing = g.step === 'guessing' && g.clue !== null;
  const c = guessing ? g.clue : null;
  return {
    cells,
    clueWord: c?.word ?? null,
    clue: c ? c.n : null,
    guessesLeft: c ? (c.n === 0 || c.n === 'inf' ? 'unlimited' : c.n + 1 - g.guesses) : null,
    clues: g.clues.map((x) => ({ ...x })),
    lastTurn: g.lastTurn ? { ...g.lastTurn } : null,
    turn: g.turn,
    left: { orange: leftOf(g, 'orange'), teal: leftOf(g, 'teal') },
    picker: guessing ? g.picker : null,
    step: s.ended ? 'ended' : g.step,
    winner: g.winner,
    endedEarly: g.endedEarly,
  };
}

/** The current clue givers and partners of both teams: the people who may see the map (SWD-123). */
const seesTheMap = (s: SecretWordsState, who: string): boolean =>
  TEAMS.some((t) => s.teams.clueGivers[t] === who || s.teams.partners[t] === who);

function view(s: SecretWordsState, viewer: Viewer): SecretWordsView {
  return roomView(s, viewer.kind === 'player' && seesTheMap(s, viewer.playerId));
}

function invariants(s: SecretWordsState): string[] {
  const problems: string[] = [];
  const g = s.game;
  if (g) {
    if (g.turned.length !== g.words.length || g.kinds.length !== g.words.length) problems.push('The board and its map differ in size.');
    if (g.clue && g.guesses > allowance(g.clue.n)) problems.push('A turn took more guesses than its clue allows.');
    if ((g.winner !== null || g.endedEarly) !== (g.step === 'over')) problems.push('A game is over exactly when it has a result.');
    if (g.winner !== null && g.endedEarly) problems.push('A game has a winner or ended early, never both.');
  }
  if (s.games.some((x, i) => x.number !== i + 1)) problems.push('Games are numbered from 1 in order.');
  if (s.ended && (!g || g.step !== 'over')) problems.push('A game night ends only at game over.');
  return problems;
}

export const secretWordsRules: GameRules<SecretWordsConfig, SecretWordsState, SecretWordsMove, SecretWordsView> = {
  id: 'secret-words',
  setup: (input) => setup(input.config, input.seeds),
  legalMoves: (state) => legalMoves(state),
  detailMoves: ['clue', 'setTeams', 'setClueGivers', 'setChoices', 'setPlayers'],
  apply,
  view,
  isOver: (state) => state.ended,
  invariants,
  // SWD-054: the "Game ended · Undo" toast is screen state, not a move.
  canUndo: () => false,
};
