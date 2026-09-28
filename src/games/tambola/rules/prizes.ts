// The prize pool (specs/tambola/08-prizes.md). Money is calculated, never moved.
// Every split here uses whole amounts and adds up exactly (largest remainder).
import { PATTERNS, type Pattern } from './types';

/** TAM-081: suggested tiers and split by tickets in play. Full House is always the largest. */
export function suggestTiers(tickets: number): { pattern: Pattern; percent: number }[] {
  if (tickets >= 25) {
    return [
      { pattern: 'early-five', percent: 8 },
      { pattern: 'four-corners', percent: 8 },
      { pattern: 'top-line', percent: 10 },
      { pattern: 'middle-line', percent: 10 },
      { pattern: 'bottom-line', percent: 10 },
      { pattern: 'full-house', percent: 32 },
      { pattern: 'second-full-house', percent: 22 },
    ];
  }
  if (tickets >= 12) {
    return [
      { pattern: 'early-five', percent: 10 },
      { pattern: 'four-corners', percent: 10 },
      { pattern: 'top-line', percent: 12 },
      { pattern: 'middle-line', percent: 12 },
      { pattern: 'bottom-line', percent: 12 },
      { pattern: 'full-house', percent: 44 },
    ];
  }
  if (tickets >= 6) {
    return [
      { pattern: 'early-five', percent: 10 },
      { pattern: 'top-line', percent: 15 },
      { pattern: 'middle-line', percent: 15 },
      { pattern: 'bottom-line', percent: 15 },
      { pattern: 'full-house', percent: 45 },
    ];
  }
  return [
    { pattern: 'early-five', percent: 10 },
    { pattern: 'top-line', percent: 20 },
    { pattern: 'full-house', percent: 70 },
  ];
}

/** The share a standard pattern gets when the host adds it to the suggestion (TAM-083). */
const ADDED_WEIGHT: Readonly<Record<Pattern, number>> = {
  'early-five': 10,
  'four-corners': 10,
  'top-line': 12,
  'middle-line': 12,
  'bottom-line': 12,
  'full-house': 44,
  'second-full-house': 22,
};

/**
 * Splits a whole amount across whole-number weights, in proportion, adding up exactly.
 * Extra units go to the largest remainders; ties go to the larger weight, then to the earlier item.
 * With no weight at all, the amount is split evenly.
 */
export function apportion(total: number, weights: readonly number[]): number[] {
  if (weights.length === 0) return [];
  const w = weights.every((x) => x === 0) ? weights.map(() => 1) : weights;
  const sum = w.reduce((a, b) => a + b, 0);
  const out = w.map((x) => Math.floor((total * x) / sum));
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = w.map((x, i) => ({ i, rem: (total * x) % sum, x })).sort((a, b) => b.rem - a.rem || b.x - a.x || a.i - b.i);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k]!.i]! += 1;
  return out;
}

export interface PlanInput {
  readonly tickets: number;
  readonly contribution: number;
  /** Rounding unit, ₹10 by default (TAM-082). */
  readonly unit?: number;
  readonly removed?: readonly Pattern[];
  readonly added?: readonly Pattern[];
  /** Amounts the anchor fixed by hand (TAM-084). The other tiers absorb the difference. */
  readonly fixed?: Partial<Record<Pattern, number>>;
}

export interface PrizePlan {
  readonly pot: number;
  readonly tiers: { pattern: Pattern; percent: number; amount: number }[];
}

/** TAM-080 to TAM-084: the pot and rounded tier amounts that add up to it exactly. */
export function planPrizes(input: PlanInput): PrizePlan {
  const { tickets, contribution } = input;
  const unit = input.unit ?? 10;
  if (!Number.isSafeInteger(tickets) || tickets < 0) throw new RangeError('Tickets must be a whole number.');
  if (!Number.isSafeInteger(contribution) || contribution < 0) throw new RangeError('The contribution must be a whole amount.');
  if (!Number.isSafeInteger(unit) || unit < 1) throw new RangeError('The rounding unit must be a whole amount of 1 or more.');
  const pot = tickets * contribution;

  // Full House can never be removed: it is the tier that ends the game.
  const removed = new Set<Pattern>((input.removed ?? []).filter((p) => p !== 'full-house'));
  const weights = new Map<Pattern, number>();
  for (const t of suggestTiers(tickets)) if (!removed.has(t.pattern)) weights.set(t.pattern, t.percent);
  for (const p of input.added ?? []) if (!weights.has(p)) weights.set(p, ADDED_WEIGHT[p]);
  const patterns = PATTERNS.filter((p) => weights.has(p));

  const fixed = new Map<Pattern, number>();
  for (const p of patterns) {
    const f = input.fixed?.[p];
    if (f === undefined) continue;
    if (!Number.isSafeInteger(f) || f < 0) throw new RangeError('A prize must be a whole amount of zero or more.');
    fixed.set(p, f);
  }
  // If every tier is fixed, Full House takes up whatever is left.
  if (fixed.size === patterns.length) fixed.delete('full-house');
  const fixedSum = [...fixed.values()].reduce((a, b) => a + b, 0);
  if (fixedSum > pot) throw new RangeError('The prizes you set add up to more than the pot.');

  const free = patterns.filter((p) => !fixed.has(p));
  const pool = pot - fixedSum;
  const amounts = new Map<Pattern, number>(fixed);
  if (free.length > 0) {
    const sink = sinkOf(free, weights);
    for (const [p, a] of splitEqually(pool, unit, free, weights, sink, 'amounts')) amounts.set(p, a);
  }

  // Percentages: equal shares show equal percentages, different shares different ones; the rest goes to the sink.
  const percents = splitEqually(100, 1, patterns, weights, sinkOf(patterns, weights), 'floor');
  return {
    pot,
    tiers: patterns.map((pattern) => ({
      pattern,
      percent: percents.get(pattern)!,
      amount: amounts.get(pattern)!,
    })),
  };
}

/**
 * The tier that takes the rounding difference (TAM-082, TAM-092): Full House when it is free, otherwise the
 * free tier with the largest share that no other free tier shares, so equal shares stay equal.
 */
function sinkOf(free: readonly Pattern[], weights: ReadonlyMap<Pattern, number>): Pattern {
  if (free.includes('full-house')) return 'full-house';
  const w = (p: Pattern) => weights.get(p)!;
  const unique = free.filter((p) => free.filter((q) => w(q) === w(p)).length === 1);
  const pick = (list: readonly Pattern[]) => list.reduce((a, b) => (w(b) > w(a) ? b : a));
  return pick(unique.length > 0 ? unique : free);
}

/**
 * Splits `pool` across `items` in proportion to their weights, in whole `unit`s (TAM-082, TAM-092):
 * items with the same weight always get the same amount, and every item but `sink` is a whole number of
 * units. For amounts, leftover units go, a whole group at a time, to the groups with the largest
 * remainders, unless that would make a group larger than the sink; whatever is still left, including
 * anything smaller than a unit, goes to `sink`. In 'floor' mode every leftover goes to the sink.
 */
function splitEqually(
  pool: number,
  unit: number,
  items: readonly Pattern[],
  weights: ReadonlyMap<Pattern, number>,
  sink: Pattern,
  mode: 'amounts' | 'floor',
): Map<Pattern, number> {
  const raw = items.map((p) => weights.get(p)!);
  const w = raw.every((x) => x === 0) ? raw.map(() => 1) : raw;
  const total = w.reduce((a, b) => a + b, 0);
  const units = Math.floor(pool / unit);
  const got = new Map<Pattern, number>(items.map((p, i) => [p, Math.floor((units * w[i]!) / total)]));
  let left = units - [...got.values()].reduce((a, b) => a + b, 0);

  const groups = new Map<number, { weight: number; first: number; members: Pattern[] }>();
  items.forEach((p, i) => {
    if (p === sink) return;
    const g = groups.get(w[i]!) ?? { weight: w[i]!, first: i, members: [] };
    g.members.push(p);
    groups.set(w[i]!, g);
  });
  const ordered = [...groups.values()].sort(
    (a, b) => ((units * b.weight) % total) - ((units * a.weight) % total) || b.weight - a.weight || a.first - b.first,
  );
  const gifted: Pattern[][] = [];
  for (const g of mode === 'amounts' ? ordered : []) {
    if (left <= 0) break;
    if (g.members.length > left) continue;
    for (const p of g.members) got.set(p, got.get(p)! + 1);
    left -= g.members.length;
    gifted.push(g.members);
  }
  got.set(sink, got.get(sink)! + left);

  const out = new Map<Pattern, number>();
  for (const [p, u] of got) out.set(p, u * unit);
  out.set(sink, out.get(sink)! + (pool - units * unit));

  if (mode === 'amounts') {
    const tooBig = () => items.some((p) => p !== sink && out.get(p)! > out.get(sink)!);
    while (tooBig() && gifted.length > 0) {
      for (const p of gifted.pop()!) {
        out.set(p, out.get(p)! - unit);
        out.set(sink, out.get(sink)! + unit);
      }
    }
  }
  return out;
}
