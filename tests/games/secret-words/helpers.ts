// Shared helpers for the Secret Words rule tests (C3 parts, written before the build, 22 October 2026).
// The names and shapes are the scenarios' "Test hooks the build provides", item 1 (specs/secret-words/README.md),
// made exact for the Build role in specs/secret-words/api.md. Everything is imported from
// src/games/secret-words/index.ts only.
//
// The module is loaded with a dynamic import, so that until the game is built every test fails on its own with
// "src/games/secret-words is not built yet", instead of the whole file failing to load.
//
// The scenarios' own algorithms (SWD-022, SWD-024) and the word list are in oracle.ts, re-exported here.
import { createRng, HOST, play, startMatch, type Match } from '../../../src/engine';
import { oracleBoard, type Audience, type BoardSize, type Kind, type OracleBoard, type SecretWordsWord, type Team } from './oracle';

export * from './oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */
const loaded: any = await import('../../../src/games/secret-words').catch((e: unknown) => ({ __loadError: e }));

/** One export of src/games/secret-words/index.ts, or a clear failure when it is not there yet. */
export function need<T = any>(name: string): T {
  if (loaded && '__loadError' in loaded) {
    const why = String((loaded.__loadError as Error)?.message ?? loaded.__loadError).split('\n')[0];
    throw new Error(`src/games/secret-words is not built yet (needs ${name}): ${why}`);
  }
  if (loaded[name] === undefined) throw new Error(`${name} is not exported from src/games/secret-words yet`);
  return loaded[name] as T;
}

export const rules = (): any => need('secretWordsRules');
export const boardFromCode = (code: string, words: readonly SecretWordsWord[]): any => need<any>('boardFromCode')(code, words);
export const codeFor = (cfg: { edition: number; board: BoardSize; words: Audience }, deck: number, n: number): string =>
  need<any>('codeFor')(cfg, deck, n);
export const pickDeck = (dealSeed: string, k: number, candidates: readonly string[], avoid: ReadonlySet<string>): number =>
  need<any>('pickDeck')(dealSeed, k, candidates, avoid);
export const penaltyCell = (state: any, dealSeed: string): number => need<any>('penaltyCell')(state, dealSeed);
export const nextMapCode = (code: string, words: readonly SecretWordsWord[]): string | null => need<any>('nextMapCode')(code, words);
export const reduceLetters = (text: string): string => need<any>('reduceLetters')(text);
export const parseMapCode = (typed: string, words: readonly SecretWordsWord[]): string => need<any>('parseMapCode')(typed, words);
export const clueWarning = (typed: string, cells: readonly { word: string; turned: boolean }[]): string | null =>
  need<any>('clueWarning')(typed, cells);
export const readSecretWordsEvening = (saved: unknown): any => need<any>('readSecretWordsEvening')(saved);
export const readTestSeeds = (raw: string | null, release: boolean): any => need<any>('readTestSeeds')(raw, release);

// ---- Example evening (Terms) ----

export const NAMES = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om'];
export const PAIR = { id: 'SWDT-01', orange: 'Chai Champions', teal: 'Coffee Commandos' };
export const ROOM = { kind: 'room' } as const;

export interface Choices { map: 'pass' | 'shared' | 'own'; board: BoardSize; landmine: 'lose' | 'turn'; words: Audience }
export const DEFAULT_CHOICES: Choices = { map: 'pass', board: 'full', landmine: 'lose', words: 'family' };

export interface TeamsInput {
  orange: string[]; teal: string[]; clueGivers: { orange: string | null; teal: string | null };
  partners: { orange: string | null; teal: string | null }; names: { id: string; orange: string; teal: string }; guessOnly: string[];
}
/** The example teams: orange Riya, Meena, Zoya, Om (clue giver Riya); teal Arjun, Kabir, Dev (clue giver Arjun). */
export function exampleTeams(o: Partial<TeamsInput> = {}): TeamsInput {
  return {
    orange: ['Riya', 'Meena', 'Zoya', 'Om'], teal: ['Arjun', 'Kabir', 'Dev'],
    clueGivers: { orange: 'Riya', teal: 'Arjun' }, partners: { orange: null, teal: null }, names: PAIR, guessOnly: [], ...o,
  };
}

export interface EveningOptions {
  seed?: string; teamsSeed?: string; teams?: TeamsInput; choices?: Partial<Choices>; recent?: string[]; testBoards?: string[];
  splits?: number;
}
export function setupInput(o: EveningOptions = {}): any {
  const teams = o.teams ?? exampleTeams();
  const config: any = {
    players: [...teams.orange, ...teams.teal],
    teams,
    splits: o.splits ?? 1,
    choices: { ...DEFAULT_CHOICES, ...o.choices },
    excludedWords: { recent: o.recent ?? [] },
  };
  if (o.testBoards) config.testBoards = o.testBoards;
  return { gameId: 'secret-words', seeds: { deal: o.seed ?? 'deal-seed-1', teams: o.teamsSeed ?? 'teams-seed-1' }, config };
}

/** 22 October 2026, 20:40 in India. */
export const T0 = 1_792_683_000_000;
export type AnyMatch = Match<any, any, any>;

/**
 * One Secret Words evening on the engine, one second per move, through the referee (`play`). Moves the rules list
 * complete (`deal`, `dealNew`, `reveal` with its `freeCell`, `brokeRule` with its cell) are taken from `legalMoves`
 * (Test hooks item 1; specs/secret-words/api.md).
 */
export class Evening {
  readonly rules = rules();
  match: AnyMatch;
  at: number;
  lastReason = '';

  constructor(readonly o: EveningOptions = {}) {
    this.match = startMatch(this.rules, setupInput(o), T0);
    this.at = T0;
  }

  get state() { return this.match.state; }
  get seeds() { return this.match.setup.seeds as { deal: string; teams: string }; }
  get records() { return this.match.records; }
  get choices(): Choices {
    let c = this.match.setup.config.choices as Choices;
    for (const r of this.match.records) if (r.move.type === 'setChoices') c = r.move.choices;
    return c;
  }

  /** Plays a move; returns whether the referee accepted it (a refused move changes nothing). */
  try(move: any): boolean {
    const r = play(this.rules, this.match, move, { by: HOST, at: (this.at += 1000) });
    if (r.ok) { this.match = r.value; this.lastReason = ''; return true; }
    this.lastReason = r.reason;
    return false;
  }
  /** Plays a move that must be accepted. */
  must(move: any): this {
    if (!this.try(move)) throw new Error(`refused ${JSON.stringify(move)}: ${this.lastReason}`);
    return this;
  }
  legal(): any[] { return [...(this.rules.legalMoves(this.state, HOST) ?? [])]; }
  legalOf(type: string): any[] { return this.legal().filter((m) => m.type === type); }
  view(viewer: any = ROOM): any { return this.rules.view(this.state, viewer); }

  /** The listed `deal` (or `dealNew`) move, played. Returns its code. */
  deal(type: 'deal' | 'dealNew' = 'deal'): string {
    const ms = this.legalOf(type);
    if (ms.length !== 1) throw new Error(`expected exactly one listed ${type}, got ${JSON.stringify(ms)}`);
    this.must(ms[0]);
    return ms[0].code;
  }
  /** The code of the board in play (the latest `deal` or `dealNew`). */
  code(): string {
    for (let i = this.records.length - 1; i >= 0; i--) {
      const m = this.records[i]!.move;
      if (m.type === 'deal' || m.type === 'dealNew') return m.code;
    }
    throw new Error('no deal yet');
  }
  board(): OracleBoard { return oracleBoard(this.code()); }
  /** D: the deal number of the evening (deals and new boards, from 1). */
  dealNumber(): number { return this.records.filter((r) => r.move.type === 'deal' || r.move.type === 'dealNew').length; }
  /** T: the turn number on this board (from 1). */
  turnNumber(): number {
    let t = 1;
    for (const r of this.records) {
      if (r.move.type === 'deal' || r.move.type === 'dealNew') t = 1;
      else if (r.move.type === 'nextTurn') t++;
    }
    return t;
  }
  /** Face-down cells (by the room view) of a kind (by the board), in cell order. */
  faceDown(kind?: Kind): number[] {
    const cells = this.view().cells as { word: string; kind?: Kind }[];
    const b = this.board();
    return cells.map((c, i) => (c.kind === undefined && (kind === undefined || b.kinds[i] === kind) ? i : -1)).filter((i) => i >= 0);
  }
  turn(): Team { return this.view().turn; }
  other(t: Team = this.turn()): Team { return t === 'orange' ? 'teal' : 'orange'; }
  clue(n: number | 'inf', word?: string): this { return this.must(word === undefined ? { type: 'clue', n } : { type: 'clue', n, word }); }
  /** The listed `reveal` move for this cell (it carries `freeCell` when the rules need one), played; else `{ reveal, cell }`. */
  reveal(cell: number): boolean {
    const listed = this.legalOf('reveal').find((m) => m.cell === cell);
    return this.try(listed ?? { type: 'reveal', cell });
  }
  mustReveal(cell: number): this {
    if (!this.reveal(cell)) throw new Error(`refused reveal ${cell}: ${this.lastReason}`);
    return this;
  }
  brokeRule(): this {
    const ms = this.legalOf('brokeRule');
    if (ms.length !== 1) throw new Error(`expected exactly one listed brokeRule, got ${JSON.stringify(ms)}`);
    return this.must(ms[0]);
  }
  /** "End our turn", then "Other team's turn" (SWD-044). */
  endTurn(): this { return this.must({ type: 'endTurn' }).must({ type: 'nextTurn' }); }
  nextTurn(): this { return this.must({ type: 'nextTurn' }); }
  over(): boolean { const v = this.view(); return v.winner !== null || v.endedEarly === true; }
  /** The guessing team wins at once: clue ∞, then every one of its words. */
  winTurn(): this {
    const t = this.turn();
    this.clue('inf');
    for (const c of this.faceDown(t)) this.mustReveal(c);
    return this;
  }
  /** The SavedGame the app would store for this evening (engine format 2). */
  saved(status = 'in-progress'): any {
    return {
      format: 2, gameType: 'secret-words', id: 'sw-test', createdAt: T0, updatedAt: this.at, status,
      setup: this.match.setup, records: this.match.records,
    };
  }
}

/** The face-down cells of `team` in cell order, the free word's draw (SWD-043, SWD-046). */
export function oracleFreeCell(list: readonly number[], seed: string): number {
  return list[createRng(seed).int(list.length)]!;
}

// ---- Random scripted games (SWD-025, SWD-041, SWD-050 properties; the contract driver) ----

/** Random choices for a scripted game. */
export function randomChoices(rng: { int(n: number): number }): Choices {
  const maps = ['pass', 'shared', 'own'] as const;
  return {
    map: maps[rng.int(3)]!, board: rng.int(3) === 0 ? 'easy' : 'full', landmine: rng.int(2) ? 'turn' : 'lose',
    words: rng.int(2) ? 'grownups' : 'family',
  };
}

/** A random clue: a number 0–9 or ∞, sometimes with a word. */
export function randomClue(rng: { int(n: number): number }): any {
  const k = rng.int(12);
  const n = k === 11 ? 'inf' : k > 9 ? 1 : k;
  return rng.int(3) === 0 ? { type: 'clue', n } : { type: 'clue', n, word: ['Monsoon', 'Rain', 'Cricket ball', 'x'][rng.int(4)] };
}

/**
 * Plays one game from its first deal to its result with random taps: mostly listed moves (reveals, "End our turn",
 * "Other team's turn", "New board" now and then, "End the game" rarely), a clue whenever one may be given, and junk
 * the rules must refuse (a clue after a reveal, an early "End our turn", a reveal of a turned cell). `onStep` sees the
 * evening after every accepted move.
 */
export function randomGame(e: Evening, rng: { int(n: number): number }, onStep: (e: Evening) => void = () => {}, maxMoves = 400): void {
  e.deal();
  onStep(e);
  for (let i = 0; i < maxMoves && !e.over(); i++) {
    const legal = e.legal().filter((m) => m.type !== 'endEvening' && m.type !== 'deal');
    const pool: any[] = [];
    for (const m of legal) {
      if (m.type === 'endGame') { if (rng.int(60) === 0) pool.push(m); }
      else if (m.type === 'dealNew') { if (rng.int(40) === 0) pool.push(m); }
      else if (m.type === 'brokeRule') { if (rng.int(6) === 0) pool.push(m); }
      else pool.push(m);
    }
    pool.push(randomClue(rng));
    if (rng.int(8) === 0) pool.push({ type: 'endTurn' }, { type: 'nextTurn' }, { type: 'reveal', cell: rng.int(25) });
    const move = pool[rng.int(pool.length)];
    if (e.try(move)) onStep(e);
  }
}
