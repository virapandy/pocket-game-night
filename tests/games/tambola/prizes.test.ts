// The prize pool: specs/tambola/08-prizes.md (TAM-080 to TAM-091). Money is calculated, never moved.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { moneyProblems } from '../../../src/engine';
import { Game, mod, planPrizes, suggestTiers, type Pattern } from './helpers';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const byPattern = (tiers: { pattern: Pattern; amount?: number; percent?: number }[], key: 'amount' | 'percent') =>
  Object.fromEntries(tiers.map((t) => [t.pattern, t[key]]));

describe('TAM-080: the pot is tickets × contribution', () => {
  it('8 players, 2 of them with 2 tickets, at ₹50: ₹500', () => {
    expect(planPrizes({ tickets: 10, contribution: 50 }).pot).toBe(500);
  });

  it('updates when tickets or the contribution change', () => {
    expect(planPrizes({ tickets: 11, contribution: 50 }).pot).toBe(550);
    expect(planPrizes({ tickets: 10, contribution: 20 }).pot).toBe(200);
  });
});

describe('TAM-081: tiers suggested from the number of tickets', () => {
  const table: [number[], Record<string, number>][] = [
    [[2, 3, 5], { 'early-five': 10, 'top-line': 20, 'full-house': 70 }],
    [[6, 8, 11], { 'early-five': 10, 'top-line': 15, 'middle-line': 15, 'bottom-line': 15, 'full-house': 45 }],
    [[12, 18, 24], { 'early-five': 10, 'four-corners': 10, 'top-line': 12, 'middle-line': 12, 'bottom-line': 12, 'full-house': 44 }],
    [[25, 40, 100], {
      'early-five': 8, 'four-corners': 8, 'top-line': 10, 'middle-line': 10, 'bottom-line': 10, 'full-house': 32, 'second-full-house': 22,
    }],
  ];
  for (const [counts, split] of table) {
    it.each(counts)(`%i tickets: ${Object.keys(split).join(', ')}`, (tickets) => {
      const tiers = suggestTiers(tickets);
      expect(byPattern(tiers, 'percent')).toEqual(split);
      expect(sum(tiers.map((t) => t.percent))).toBe(100);
    });
  }
});

describe('TAM-082: rounded tiers always add up to the pot exactly', () => {
  it('a ₹530 pot across 10 / 20 / 70 % gives ₹50 / ₹110 / ₹370', () => {
    const plan = planPrizes({ tickets: 5, contribution: 106 });
    expect(plan.pot).toBe(530);
    expect(byPattern(plan.tiers, 'amount')).toEqual({ 'early-five': 50, 'top-line': 110, 'full-house': 370 });
  });

  it('for every pot and tier set: exact total, never negative, Full House largest, whole units where possible', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 200 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.constantFrom(1, 5, 10, 20, 50, 100),
        (tickets, contribution, unit) => {
          const plan = planPrizes({ tickets, contribution, unit });
          const amounts = plan.tiers.map((t) => t.amount);
          expect(plan.pot).toBe(tickets * contribution);
          expect(sum(amounts)).toBe(plan.pot);
          for (const a of amounts) expect(Number.isInteger(a) && a >= 0).toBe(true);
          const fh = plan.tiers.find((t) => t.pattern === 'full-house')!.amount;
          for (const a of amounts) expect(fh).toBeGreaterThanOrEqual(a);
          if (plan.pot % unit === 0) for (const a of amounts) expect(a % unit).toBe(0);
        },
      ),
      { numRuns: 3_000 },
    );
  });
});

describe('TAM-083: the host can remove a tier, and add it back', () => {
  const base = { tickets: 10, contribution: 50 };

  it('removing Middle Line spreads its share across the others in proportion; the total still equals the pot', () => {
    const plan = planPrizes({ ...base, removed: ['middle-line'] });
    const amounts = byPattern(plan.tiers, 'amount');
    expect(Object.keys(amounts).sort()).toEqual(['bottom-line', 'early-five', 'full-house', 'top-line']);
    expect(sum(Object.values(amounts))).toBe(500);
    const share = { 'early-five': 10, 'top-line': 15, 'bottom-line': 15, 'full-house': 45 };
    for (const [p, pct] of Object.entries(share)) {
      expect(Math.abs(amounts[p]! - (500 * pct) / 85)).toBeLessThanOrEqual(20);
    }
  });

  it('adding it back returns every tier to its suggested amount', () => {
    expect(planPrizes({ ...base, removed: [] })).toEqual(planPrizes(base));
  });

  it('a standard pattern that was not suggested (Four Corners) can be added', () => {
    const plan = planPrizes({ ...base, added: ['four-corners'] });
    expect(plan.tiers.map((t) => t.pattern)).toContain('four-corners');
    expect(sum(plan.tiers.map((t) => t.amount))).toBe(500);
  });

  it('Full House cannot be removed', () => {
    expect(typeof mod.planPrizes, 'planPrizes is not exported yet').toBe('function');
    let plan: ReturnType<typeof planPrizes> | undefined;
    try {
      plan = planPrizes({ ...base, removed: ['full-house'] });
    } catch {
      return; // refusing is fine
    }
    expect(plan!.tiers.map((t) => t.pattern)).toContain('full-house');
    expect(sum(plan!.tiers.map((t) => t.amount))).toBe(500);
  });
});

describe('TAM-084: the anchor confirms the prizes, and can fix any amount', () => {
  it('Top Line fixed at ₹80: the unfixed tiers absorb the difference, and the total still equals the pot', () => {
    const plan = planPrizes({ tickets: 10, contribution: 50, fixed: { 'top-line': 80 } });
    const amounts = byPattern(plan.tiers, 'amount');
    expect(amounts['top-line']).toBe(80);
    expect(sum(Object.values(amounts))).toBe(500);
    // The rest (₹420) follows the suggested shares 10 : 15 : 15 : 45.
    expect(Math.abs(amounts['full-house']! - (420 * 45) / 85)).toBeLessThanOrEqual(20);
    for (const a of Object.values(amounts)) expect(a).toBeGreaterThanOrEqual(0);
  });

  it('two fixed tiers stay as fixed', () => {
    const plan = planPrizes({ tickets: 10, contribution: 50, fixed: { 'top-line': 80, 'early-five': 40 } });
    expect(byPattern(plan.tiers, 'amount')).toMatchObject({ 'top-line': 80, 'early-five': 40 });
    expect(sum(plan.tiers.map((t) => t.amount))).toBe(500);
  });
});

describe('TAM-085: prizes cannot change after the first number', () => {
  it('no move edits a tier once the game has started, and the locked tiers stay as set up', () => {
    const g = new Game().call(1);
    const tiers = g.host.tiers;
    expect(tiers.length).toBeGreaterThan(0);
    for (const move of [
      { type: 'edit-tier', pattern: 'top-line', amount: 999 },
      { type: 'set-tier', pattern: 'top-line', amount: 999 },
      { type: 'remove-tier', pattern: 'early-five' },
      { type: 'confirm-prizes' },
    ]) {
      expect(g.try(move).ok).toBe(false);
    }
    expect(g.host.tiers).toEqual(tiers);
  });
});

describe('TAM-091: for every pot, tier edit, removal, tie and unclaimed tier, the payouts balance', () => {
  const optional: Pattern[] = ['early-five', 'four-corners', 'top-line', 'middle-line', 'bottom-line', 'second-full-house'];

  it('every amount is zero or more and the payouts add up to the pot exactly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 2, maxLength: 30 }),
        fc.integer({ min: 1, max: 500 }),
        fc.subarray(optional),
        fc.option(fc.integer({ min: 0, max: 100 })),
        fc.array(fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 1, max: 3 }), fc.integer({ min: 0, max: 12 })), {
          minLength: 1, maxLength: 8,
        }),
        fc.boolean(),
        (seed, ticketsEach, contribution, removed, fixedPct, wins, endEarly) => {
          const players = ticketsEach.map((t, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}`, tickets: t }));
          const tickets = sum(ticketsEach);
          const pot = tickets * contribution;
          const suggested = suggestTiers(tickets).map((t) => t.pattern);
          const fixedPattern = suggested.find((p) => p !== 'full-house' && !removed.includes(p));
          const fixed = fixedPct !== null && fixedPattern ? { [fixedPattern]: Math.floor((pot * fixedPct) / 200) } : {};
          const plan = planPrizes({ tickets, contribution, removed: removed.filter((p) => suggested.includes(p)), fixed });
          expect(sum(plan.tiers.map((t) => t.amount))).toBe(pot);
          for (const t of plan.tiers) expect(t.amount).toBeGreaterThanOrEqual(0);

          const g = new Game({ seed, players, contribution, tiers: plan.tiers.map(({ pattern, amount }) => ({ pattern, amount })) });
          const order = plan.tiers.map((t) => t.pattern).filter((p) => p !== 'full-house' && p !== 'second-full-house');
          let won = 0;
          for (const [tierIdx, tieCount, gap] of wins) {
            const pattern = order[tierIdx % Math.max(order.length, 1)];
            if (!pattern || !g.host.openPatterns.includes(pattern)) continue;
            g.callUpTo(Math.max(gap, 5 - g.called.length));
            for (let k = 0; k < Math.min(tieCount, players.length); k++) {
              expect(g.claim(players[k]!.id, pattern, g.onTimeNumbers(pattern)).ok).toBe(true);
            }
            won++;
          }
          if (!endEarly || won === 0) {
            // Play to Full House (a tie of up to two), which also covers "nobody won anything else".
            g.callUpTo(Math.max(15 - g.called.length, 1));
            for (let k = 0; k < Math.min(2, players.length) && !g.over; k++) {
              g.claim(players[k]!.id, 'full-house', g.onTimeNumbers('full-house'));
            }
            if (!g.over) g.do({ type: 'end' });
          } else {
            g.do({ type: 'end' });
          }
          const s = g.summary;
          expect(moneyProblems(s.money)).toEqual([]);
          expect(sum(s.money.people.map((p: any) => p.won))).toBe(pot);
          expect(sum(s.tiers.map((t: any) => t.amount))).toBe(pot);
          for (const t of s.tiers) {
            expect(t.amount).toBeGreaterThanOrEqual(0);
            expect(sum(t.winners.map((w: any) => w.amount))).toBe(t.winners.length ? t.amount : 0);
          }
        },
      ),
      { numRuns: 500 },
    );
  });
});
