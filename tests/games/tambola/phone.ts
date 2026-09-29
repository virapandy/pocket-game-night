// Shared helpers for the Phase 2 (phone tickets) rule tests. The names and shapes follow
// tests/games/tambola/README.md, "Phase 2: phone tickets". Everything is imported from
// src/games/tambola/index.ts only; the tests work out what is right from the host's own view.
import { HOST, play, startMatch } from '../../../src/engine';
import { Game, mod, PLAYERS, rules, settings, T0, type AnyMatch, type Pattern, type PlayerSpec } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Cell = number | null;
export type Rows = Cell[][];
export interface Ticket { number: number; sheet: number; rows: Rows }

/** `makeTickets(sheetSeed, count)`: tickets 1..count from sheets of 6 (TAM-001 to TAM-008, TAM-048). */
export function makeTickets(sheetSeed: string, count: number): Ticket[] {
  if (typeof mod.makeTickets !== 'function') throw new Error('makeTickets is not exported from src/games/tambola yet (Phase 2)');
  return mod.makeTickets(sheetSeed, count);
}
const need = (name: string) => {
  if (typeof mod[name] !== 'function') throw new Error(`${name} is not exported from src/games/tambola yet (Phase 2)`);
  return mod[name];
};
export const encodeTicket = (info: any): string => need('encodeTicket')(info);
export const decodeTicket = (text: string): any => need('decodeTicket')(text);
export const typedCode = (info: any): string => need('typedCode')(info);
export const decodeTypedCode = (code: string): any => need('decodeTypedCode')(code);
export const ticketInfo = (view: any, ticket: number, startedAt: number): any => need('ticketInfo')(view, ticket, startedAt);
export const encodeClaim = (claim: any): string => need('encodeClaim')(claim);
export const decodeClaim = (text: string): any => need('decodeClaim')(text);
export const readClaim = (view: any, text: string): any => need('readClaim')(view, text);

/** Letters and digits a typed code may use: no 0, O, 1, I or L (TAM-117). */
export const CODE_ALPHABET = /^[2-9A-HJKMNP-Z]+$/;

export const nums = (rows: Rows): number[] => rows.flat().filter((n): n is number => n !== null);
export const row = (rows: Rows, r: number): number[] => rows[r]!.filter((n): n is number => n !== null);
/** The first and last numbers of the top and bottom rows (TAM-026). */
export const corners = (rows: Rows): number[] => {
  const top = row(rows, 0), bottom = row(rows, 2);
  return [top[0]!, top[top.length - 1]!, bottom[0]!, bottom[bottom.length - 1]!];
};

/** The numbers a pattern needs, or null for Early Five (any 5). */
export function patternSet(rows: Rows, pattern: Pattern): number[] | null {
  switch (pattern) {
    case 'early-five': return null;
    case 'top-line': return row(rows, 0);
    case 'middle-line': return row(rows, 1);
    case 'bottom-line': return row(rows, 2);
    case 'four-corners': return corners(rows);
    default: return nums(rows);
  }
}

/**
 * What the host phone must decide for a claim on this ticket, from the calls so far (TAM-020 to TAM-029,
 * TAM-034, TAM-036, TAM-038): complete on called numbers and completed by the latest call → accepted;
 * complete earlier → a late bogey, with the number that completed it; otherwise a bogey.
 */
export function expected(rows: Rows, pattern: Pattern, called: number[]) {
  const at = new Map(called.map((n, i) => [n, i]));
  const set = patternSet(rows, pattern);
  let completedIdx: number | null = null;
  if (set === null) {
    const hits = nums(rows).filter((n) => at.has(n)).map((n) => at.get(n)!).sort((a, b) => a - b);
    if (hits.length >= 5) completedIdx = hits[4]!;
  } else if (set.every((n) => at.has(n))) {
    completedIdx = Math.max(...set.map((n) => at.get(n)!));
  }
  if (completedIdx === null) return { verdict: 'bogey' as const, reason: 'not-called' as const };
  if (completedIdx === called.length - 1) return { verdict: 'accepted' as const };
  return { verdict: 'bogey' as const, reason: 'late' as const, completedAt: called[completedIdx]! };
}

/** Six tiers, every pattern but Second Full House, adding up to the pot. */
export function phoneTiers(pot: number): { pattern: Pattern; amount: number }[] {
  const s = Math.floor(pot * 0.1);
  return [
    { pattern: 'early-five', amount: s }, { pattern: 'top-line', amount: s }, { pattern: 'middle-line', amount: s },
    { pattern: 'bottom-line', amount: s }, { pattern: 'four-corners', amount: s }, { pattern: 'full-house', amount: pot - 5 * s },
  ];
}

export interface PhoneOptions {
  seed?: string;          // the draw seed
  sheetSeed?: string;     // the sheet seed (host-only, TAM-008)
  players?: PlayerSpec[];
  contribution?: number | null;
  tiers?: { pattern: Pattern; amount: number }[];
  settings?: Record<string, unknown>;
}

/** A phone-ticket game (README "Phase 2: phone tickets"): ticketMode 'phone', seeds { draw, sheet }. */
export function phoneSetup(opts: PhoneOptions = {}): any {
  const players = (opts.players ?? PLAYERS).map((p) => ({ id: p.id, name: p.name, tickets: p.tickets ?? 1 }));
  const contribution = opts.contribution === undefined ? 50 : opts.contribution;
  const tickets = players.reduce((s, p) => s + p.tickets, 0);
  const pot = contribution === null ? 0 : tickets * contribution;
  const seed = opts.seed ?? 'phone-draw-1';
  return {
    gameId: `phone-${seed}`,
    seeds: { draw: seed, sheet: opts.sheetSeed ?? `sheet-${seed}` },
    config: {
      ticketMode: 'phone',
      players,
      money: contribution === null ? null : { currency: 'INR', contribution },
      tiers: opts.tiers ?? phoneTiers(pot),
      settings: settings(opts.settings),
    },
  };
}

/** A phone-ticket game on the host phone, with the paper helpers of `Game` plus claim checks. */
export class PhoneGame extends Game {
  constructor(opts: PhoneOptions = {}) {
    super();
    this.clock = T0;
    this.match = startMatch(rules, phoneSetup(opts), this.clock);
  }
  static of(match: AnyMatch): PhoneGame {
    const g = Object.create(PhoneGame.prototype) as PhoneGame;
    g.match = match;
    const last = match.records[match.records.length - 1];
    g.clock = last ? last.at : T0;
    return g;
  }
  /** The host checks a phone-ticket claim, by scan or by number (TAM-174, TAM-177, TAM-178). */
  claim(ticket: number, pattern: Pattern) {
    return this.try({ type: 'check-claim', ticket, pattern });
  }
  /** Checks a claim without keeping the result: the verdict the host would see now. */
  peek(ticket: number, pattern: Pattern): { ok: boolean; reason?: string; claim?: any } {
    const r = play(rules, this.match, { type: 'check-claim', ticket, pattern } as any, { by: HOST, at: this.clock + 1000 });
    if (!r.ok) return { ok: false, reason: r.reason };
    const claims = rules.view(r.value.state, { kind: 'host' }).claims;
    return { ok: true, claim: claims[claims.length - 1] };
  }
  get tickets(): { number: number; sheet: number; rows: Rows; playerId: string; status: string }[] {
    const tickets = this.host.tickets;
    if (!Array.isArray(tickets)) throw new Error('The host view has no `tickets` list yet (Phase 2, README "Phase 2: phone tickets")');
    return tickets;
  }
  ticket(n: number) {
    const t = this.tickets.find((x) => x.number === n);
    if (!t) throw new Error(`The host view has no ticket ${n}`);
    return t;
  }
  /** Calls until `done()` holds, stopping at 90 calls. Returns whether it held. */
  callWhile(notDone: () => boolean): boolean {
    while (notDone()) {
      if (this.called.length >= 90) return false;
      this.call();
    }
    return true;
  }
}

/** How many of this ticket's numbers have been called. */
export const calledOn = (rows: Rows, called: number[]) => nums(rows).filter((n) => called.includes(n)).length;

/** Every whole number 1–90 found anywhere in arrays inside a value (nulls in ticket rows are skipped). */
export function intsInArrays(value: unknown, out = new Set<number>()): Set<number> {
  if (Array.isArray(value)) {
    for (const v of value) {
      if (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 90) out.add(v as number);
      else if (v && typeof v === 'object') intsInArrays(v, out);
    }
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) intsInArrays(v, out);
  }
  return out;
}
