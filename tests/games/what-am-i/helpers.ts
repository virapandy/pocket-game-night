// Shared helpers for the What Am I? rule tests (C3 parts, written before the build, 24 October 2026).
// The names and shapes are the scenarios' "Test hooks the build provides" (WAI-H1, H7), made exact for the Build role in
// specs/what-am-i/api.md. Everything is imported from src/games/what-am-i/index.ts only.
//
// Ahead of the build: the module is loaded with a dynamic import. While it cannot be loaded, every test written with
// `wit` below is run and must fail with "src/games/what-am-i is not built yet" (or the missing word list): it is reported
// as passing only for that reason, so these tests never turn another game's run red, and a mistake in a test that shows
// before the game is needed still fails. Once src/games/what-am-i/index.ts exists, `wit` is plain `it`.
// PGN_IGNORE_AHEAD=1 runs them unmarked at any time.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { HOST, play, startMatch, type Match } from '../../../src/engine';
import { NAMES, type PackChoice, type WaiWord } from './oracle';

export * from './oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */
const loaded: any = await import('../../../src/games/what-am-i').catch((e: unknown) => ({ __loadError: e }));
export const NOT_BUILT = /src\/games\/what-am-i is not built yet|content\/what-am-i\/words\.json is not built yet/;
const missing = !!(loaded && '__loadError' in loaded);
/** True while the game is not built and the tests run marked "ahead of the build". */
export const AHEAD = missing && !process.env.PGN_IGNORE_AHEAD;

/** One export of src/games/what-am-i/index.ts, or a clear failure when it is not there yet. */
export function need<T = any>(name: string): T {
  if (missing) {
    const why = String((loaded.__loadError as Error)?.message ?? loaded.__loadError).split('\n')[0];
    throw new Error(`src/games/what-am-i is not built yet (needs ${name}): ${why}`);
  }
  if (loaded[name] === undefined) throw new Error(`${name} is not exported from src/games/what-am-i yet`);
  return loaded[name] as T;
}

/**
 * `it`, for a test that needs the game. Ahead of the build it must fail with the "not built yet" error: any other
 * failure (a mistake in the test) or a pass turns it red.
 */
export function wit(name: string, fn: () => unknown | Promise<unknown>, timeout?: number) {
  if (!AHEAD) return it(name, fn as any, timeout);
  return it(name, async () => {
    let error: unknown = null;
    try { await fn(); } catch (e) { error = e; }
    expect(error, 'passed although src/games/what-am-i is not built: this test does not test the game').not.toBeNull();
    // fast-check puts the property's own error in `cause`
    const why: string[] = [];
    for (let e: any = error, i = 0; e && i < 5; e = e.cause, i++) why.push(String(e?.message ?? e));
    expect(why.join('\n')).toMatch(NOT_BUILT);
  }, timeout);
}

export const rules = (): any => need('whatAmIRules');
export const queueFor = (state: unknown): string[] => need<any>('queueFor')(state);

const WORDS_JSON = fileURLToPath(new URL('../../../content/what-am-i/words.json', import.meta.url));
/** content/what-am-i/words.json as shipped. */
export function shippedWords(): WaiWord[] {
  if (!existsSync(WORDS_JSON)) throw new Error('content/what-am-i/words.json is not built yet');
  return JSON.parse(readFileSync(WORDS_JSON, 'utf8'));
}

// ---- Choices and setup ----

export interface Choices { pack: PackChoice; time: 30 | 60 | 90; hold: 'hand' | 'free'; nonveg: boolean; sounds: boolean }
export const DEFAULT_CHOICES: Choices = { pack: 'mix', time: 60, hold: 'hand', nonveg: false, sounds: true };
export const choices = (o: Partial<Choices> = {}): Choices => ({ ...DEFAULT_CHOICES, ...o });

export function setupInput(o: { seed?: string; testWords?: WaiWord[] } = {}): any {
  const config: any = {};
  if (o.testWords) config.testWords = o.testWords;
  return { gameId: 'what-am-i', seeds: { words: o.seed ?? 'words-seed-1' }, config };
}

// ---- A game night played through the engine, as the host's taps record it ----

export type Mark = 'G' | 'P';

export class Night {
  match: Match<any, any, any>;
  at = 1_000_000;
  constructor(o: { seed?: string; testWords?: WaiWord[] } = {}) {
    this.match = startMatch(rules(), setupInput(o), this.at);
  }
  get state(): any { return this.match.state; }
  get view(): any { return rules().view(this.match.state, { kind: 'host' }); }
  get queue(): string[] { return queueFor(this.match.state); }
  get records(): any[] { return this.match.records as any[]; }
  /** Plays a move; throws with the reason if refused. */
  play(move: any): this {
    const r = play(rules(), this.match, move, { by: HOST, at: (this.at += 1000) });
    if (!r.ok) throw new Error(`refused ${JSON.stringify(move)}: ${r.reason}`);
    this.match = r.value;
    return this;
  }
  /** Whether a move is accepted; the game stays as it was either way. */
  accepts(move: any): boolean {
    return play(rules(), this.match, move, { by: HOST, at: this.at + 1000 }).ok;
  }
  start(players: string[] = NAMES, c: Partial<Choices> = {}): this { return this.play({ type: 'start', players, choices: choices(c) }); }
  /** The word on screen now (the queue's first word). */
  get head(): string {
    const q = this.queue;
    if (q.length === 0) throw new Error('the queue is empty');
    return q[0]!;
  }
  got(): string { const w = this.head; this.play({ type: 'got', word: w }); return w; }
  pass(): string { const w = this.head; this.play({ type: 'pass', word: w }); return w; }
  /** Time up with the word on screen passed (`word` false: during a flash, no word). Returns the word or null. */
  timeUp(word = true): string | null {
    if (!word) { this.play({ type: 'timeUp' }); return null; }
    const w = this.head; this.play({ type: 'timeUp', word: w }); return w;
  }
  /** Pause from T3 with the word on screen hidden (R2). */
  pauseHiding(): string { const w = this.head; this.play({ type: 'pause', turn: true, word: w }); return w; }
  pause(turn: boolean): this { return this.play({ type: 'pause', turn }); }
  resume(): this { return this.play({ type: 'resume' }); }
  skip(): this { return this.play({ type: 'skip' }); }
  fix(word: string): this { return this.play({ type: 'fix', word }); }
  save(): this { return this.play({ type: 'scoreTurn' }); }
  undoScore(): this { return this.play({ type: 'undoScore' }); }
  endGame(): this { return this.play({ type: 'endGame' }); }
  endEvening(): this { return this.play({ type: 'endEvening' }); }
  /** One turn's marks in order ("GGP" = got, got, pass), then time up (with the next word on screen, or during a flash). */
  turn(marks: string, o: { timeUpWord?: boolean } = {}): { got: string[]; passed: string[]; shown: string[] } {
    const got: string[] = [], passed: string[] = [], shown: string[] = [];
    for (const m of marks) {
      if (m === 'G') { const w = this.got(); got.push(w); shown.push(w); }
      else { const w = this.pass(); passed.push(w); shown.push(w); }
    }
    const t = this.timeUp(o.timeUpWord ?? false);
    if (t) { passed.push(t); shown.push(t); }
    return { got, passed, shown };
  }
  /** A whole saved turn with `got` Got it and `passed` Pass, then time up during the last flash, then Save score. */
  savedTurn(got: number, passed = 0): { got: string[]; passed: string[] } {
    const t = this.turn('G'.repeat(got) + 'P'.repeat(passed));
    this.save();
    return { got: t.got, passed: t.passed };
  }
}

/** The scoreboard as "Arjun 7 (1 turn)" rows (WAI-032), from the view. */
export const boardRows = (v: any): string[] =>
  (v.scoreboard as any[]).map((r) => `${r.player} ${r.score} (${r.turns} ${r.turns === 1 ? 'turn' : 'turns'})${r.left ? ' (left)' : ''}`);

/** Plays K2's two rounds (Version 1.1 item 38) from a fresh start; returns each turn's passed words in order. */
export function playK2(n: Night, K2_GOT: number[][], K2_PASSED: number[][]): string[][] {
  const passed: string[][] = [];
  for (let r = 0; r < 2; r++) {
    const round: string[] = [];
    for (let p = 0; p < 6; p++) round.push(...n.savedTurn(K2_GOT[r]![p]!, K2_PASSED[r]![p]!).passed);
    passed.push(round);
  }
  return passed;
}
