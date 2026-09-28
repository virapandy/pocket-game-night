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
  const order = w
    .map((x, i) => ({ i, rem: (total * x) % sum, x }))
    .sort((a, b) => b.rem - a.rem || b.x - a.x || a.i - b.i);
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
  const units = Math.floor(pool / unit);
  const shares = apportion(units, free.map((p) => weights.get(p)!));
  const amounts = new Map<Pattern, number>(fixed);
  free.forEach((p, i) => amounts.set(p, shares[i]! * unit));
  // What cannot be rounded to the unit goes to Full House, so it stays the largest.
  const rest = pool - units * unit;
  if (rest > 0) {
    const target = free.includes('full-house')
      ? 'full-house'
      : free.reduce((a, b) => (weights.get(b)! > weights.get(a)! ? b : a));
    amounts.set(target, amounts.get(target)! + rest);
  }

  const percents = apportion(100, patterns.map((p) => weights.get(p)!));
  return {
    pot,
    tiers: patterns.map((pattern, i) => ({ pattern, percent: percents[i]!, amount: amounts.get(pattern)! })),
  };
}
