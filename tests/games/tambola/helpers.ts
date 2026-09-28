// Shared helpers for Tambola rule tests. The shapes follow tests/games/tambola/README.md.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HOST, play, replay, startMatch, undo, viewFor, type Match, type Viewer } from '../../../src/engine';
import * as tambolaModule from '../../../src/games/tambola';

// Loose types on purpose: the tests describe behaviour, the Build workspace owns the real types.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Pattern =
  | 'early-five' | 'top-line' | 'middle-line' | 'bottom-line' | 'four-corners' | 'full-house' | 'second-full-house';
export type AnyMatch = Match<any, any, any>;

export const mod = tambolaModule as any;
export const rules = mod.tambolaRules;
export const defaults = mod.tambolaDefaults;
export const suggestTiers: (tickets: number) => { pattern: Pattern; percent: number }[] = (t) => mod.suggestTiers(t);
export const planPrizes: (input: any) => { pot: number; tiers: { pattern: Pattern; percent: number; amount: number }[] } = (i) =>
  mod.planPrizes(i);
export const pickRhyme: (...args: any[]) => any = (...args) => mod.pickRhyme(...args);

export const NEEDS: Record<Pattern, number> = {
  'early-five': 5, 'top-line': 5, 'middle-line': 5, 'bottom-line': 5, 'four-corners': 4, 'full-house': 15, 'second-full-house': 15,
};

export interface Pack {
  format: number;
  languages: string[];
  styleWeights: Record<string, number>;
  rhymes: { n: number; lang: string; style: string; familyFriendly: boolean; text: string }[];
}
export const pack: Pack = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../content/tambola/rhymes.json', import.meta.url)), 'utf8'),
);

export interface PlayerSpec { id: string; name: string; tickets?: number }

export const PLAYERS: PlayerSpec[] = [
  { id: 'p1', name: 'Riya' }, { id: 'p2', name: 'Asha' }, { id: 'p3', name: 'Dad' },
  { id: 'p4', name: 'Kabir' }, { id: 'p5', name: 'Meera' }, { id: 'p6', name: 'Nani' },
];

/** Settings: the module's defaults with test overrides (falls back to the documented defaults). */
export function settings(over: Record<string, unknown> = {}): any {
  const base = defaults ?? {
    ties: 'share', lateClaims: 'bogey', bogey: 'out', ticketsPerPlayer: 1, maxTicketsPerPlayer: 3,
    lateJoinUntil: 10, autoCall: 'off', speakCalls: false, autoMark: false, claimButtons: false,
    verdictsOnPhones: false, vibrate: true, sound: true, rhymes: { language: 'en', familyFriendly: true },
  };
  return { ...base, ...over };
}

export interface GameOptions {
  seed?: string;
  players?: PlayerSpec[];
  contribution?: number | null;
  tiers?: { pattern: Pattern; amount: number; label?: string }[];
  settings?: Record<string, unknown>;
}

/** A paper-ticket game. Without `tiers`, uses 10/20/70 style amounts that add up to the pot. */
export function config(opts: GameOptions = {}): any {
  const players = (opts.players ?? PLAYERS).map((p) => ({ id: p.id, name: p.name, tickets: p.tickets ?? 1 }));
  const contribution = opts.contribution === undefined ? 50 : opts.contribution;
  const tickets = players.reduce((s, p) => s + p.tickets, 0);
  const pot = contribution === null ? 0 : tickets * contribution;
  const tiers = opts.tiers ?? defaultTiers(pot);
  return {
    ticketMode: 'paper',
    players,
    money: contribution === null ? null : { currency: 'INR', contribution },
    tiers,
    settings: settings(opts.settings),
  };
}

/** Five tiers that add up to the pot exactly (not the app's suggestion: a fixed, easy-to-read set). */
export function defaultTiers(pot: number): { pattern: Pattern; amount: number }[] {
  const e = Math.floor(pot * 0.1), t = Math.floor(pot * 0.15), m = Math.floor(pot * 0.15), b = Math.floor(pot * 0.15);
  return [
    { pattern: 'early-five', amount: e },
    { pattern: 'top-line', amount: t },
    { pattern: 'middle-line', amount: m },
    { pattern: 'bottom-line', amount: b },
    { pattern: 'full-house', amount: pot - e - t - m - b },
  ];
}

export function setupInput(opts: GameOptions = {}): any {
  return { gameId: `test-${opts.seed ?? 'seed-1'}`, seeds: { draw: opts.seed ?? 'seed-1' }, config: config(opts) };
}

export const T0 = 1_790_000_000_000; // a fixed start time; tests never read the clock

/** A game on the host phone. Every move is 10 seconds after the one before unless `at` is given. */
export class Game {
  match: AnyMatch;
  clock: number;
  constructor(opts: GameOptions = {}) {
    this.clock = T0;
    this.match = startMatch(rules, setupInput(opts), this.clock);
  }
  static fromMatch(match: AnyMatch): Game {
    const g = Object.create(Game.prototype) as Game;
    g.match = match;
    const last = match.records[match.records.length - 1];
    g.clock = last ? last.at : T0;
    return g;
  }

  /** Plays a move; returns the verdict and keeps the new match if accepted. */
  try(move: any, at?: number): { ok: boolean; reason?: string } {
    this.clock = at ?? this.clock + 10_000;
    const r = play(rules, this.match, move, { by: HOST, at: this.clock });
    if (r.ok) this.match = r.value;
    return r.ok ? { ok: true } : { ok: false, reason: r.reason };
  }
  /** Plays a move that must be accepted. */
  do(move: any, at?: number): this {
    const r = this.try(move, at);
    if (!r.ok) throw new Error(`Move ${JSON.stringify(move)} was refused: ${r.reason}`);
    return this;
  }
  call(times = 1): this {
    for (let i = 0; i < times; i++) this.do({ type: 'call' });
    return this;
  }
  /** Calls up to `times` numbers, stopping at 90. */
  callUpTo(times: number): this {
    return this.call(Math.max(0, Math.min(times, 90 - this.called.length)));
  }
  /** Calls until `n` has been called. */
  callUntil(n: number): this {
    while (!this.called.includes(n)) this.call();
    return this;
  }
  claim(playerId: string, pattern: Pattern, numbers: number[]) {
    return this.try({ type: 'claim', playerId, pattern, numbers });
  }
  /** Numbers that make an on-time claim for `pattern`: the latest call plus earlier called numbers. */
  onTimeNumbers(pattern: Pattern): number[] {
    const need = NEEDS[pattern];
    const called = this.called;
    if (called.length < need) throw new Error(`Only ${called.length} numbers called; ${pattern} needs ${need}`);
    return called.slice(called.length - need);
  }
  undo(seq: number, now: number) {
    const r = undo(rules, this.match, seq, { by: HOST, now });
    if (r.ok) this.match = r.value;
    return r;
  }
  view(viewer: Viewer = { kind: 'host' }): any {
    return viewFor(rules, this.match, viewer);
  }
  get host(): any { return this.view({ kind: 'host' }); }
  get room(): any { return this.view({ kind: 'room' }); }
  get called(): number[] { return this.host.called; }
  get lastClaim(): any { const c = this.host.claims; return c[c.length - 1]; }
  get over(): boolean { return rules.isOver(this.match.state); }
  get records() { return this.match.records; }
  get summary(): any { return this.host.summary; }
  lastRecordOf(type: string) {
    return [...this.match.records].reverse().find((r) => (r.move as any).type === type)!;
  }
  replayed(): AnyMatch {
    const r = replay(rules, this.match.setup, this.match.records);
    if (!r.ok) throw new Error(`Replay failed: ${r.reason}`);
    return r.value;
  }
}

/** Numbers from 1 to 90 not yet called in this game. */
export function uncalled(g: Game): number[] {
  const c = new Set(g.called);
  return Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => !c.has(n));
}

/** Every array of whole numbers anywhere in a value (to look for leaked numbers in views). */
export function numberArrays(value: unknown, out: number[][] = []): number[][] {
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((v) => Number.isInteger(v))) out.push(value as number[]);
    else value.forEach((v) => numberArrays(v, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => numberArrays(v, out));
  }
  return out;
}
