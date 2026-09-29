// The prize pool: specs/tambola/08-prizes.md (TAM-080 to TAM-092). Money is calculated, never moved.
// Money handed back when prizes are not won (TAM-088, TAM-093) is in handback.test.ts.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { moneyProblems } from '../../../src/engine';
import { Game, mod, planPrizes, suggestTiers, type Pattern } from './helpers';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const byPattern = (tiers: { pattern: Pattern; amount?: number; percent?: number }[], key: 'amount' | 'percent') =>
  Object.fromEntries(tiers.map((t) => [t.pattern, t[key]]));

// TAM-082: a share rounded to the nearest unit, an exact half rounding down, in whole-rupee arithmetic
// (the share is pot × percent / 100).
const nearestHalfDown = (pot: number, percent: number, unit: number) => {
  const twice = 2 * pot * percent; // twice the share, in hundredths of a rupee
  const step = 100 * unit; // one unit, in hundredths of a rupee
  return Math.max(0, Math.ceil((twice - step) / (2 * step))) * unit;
};

// TAM-082 (owner decision 2026-09-29, tiny pots): does rounding every tier but Full House to `unit` still leave
// Full House at least as large as every other tier (and not below ₹0)? If not, the tiers round to ₹1 instead.
const roundingFits = (pot: number, tiers: { pattern: Pattern; percent: number }[], unit: number) => {
  const others = tiers.filter((t) => t.pattern !== 'full-house').map((t) => nearestHalfDown(pot, t.percent, unit));
  const fh = pot - sum(others);
  return fh >= 0 && others.every((a) => fh >= a);
};

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

  it('for every pot and tier set: exact total, never negative, Full House largest, whole units where possible (not in tiny pots)', () => {
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
          // Tiny pots (TAM-082, owner decision 2026-09-29) round to ₹1, so whole units only where the unit fits.
          if (plan.pot % unit === 0 && roundingFits(plan.pot, plan.tiers, unit)) for (const a of amounts) expect(a % unit).toBe(0);
        },
      ),
      { numRuns: 3_000 },
    );
  });
});

describe('TAM-082: tiers with the same share get the same amount; rounding differences go to Full House first', () => {
  it('6 tickets at ₹50 (a ₹300 pot) across 10 / 15 / 15 / 15 / 45 %: the three Lines are equal, Full House takes the difference', () => {
    const plan = planPrizes({ tickets: 6, contribution: 50 });
    const a = byPattern(plan.tiers, 'amount');
    expect(a['top-line']).toBe(a['middle-line']);
    expect(a['middle-line']).toBe(a['bottom-line']);
    expect(a['early-five']! % 10).toBe(0);
    expect(a['top-line']! % 10).toBe(0);
    expect(sum(plan.tiers.map((t) => t.amount))).toBe(300);
    expect(a['full-house']).toBe(300 - a['early-five']! - 3 * a['top-line']!);
    for (const v of Object.values(a)) expect(a['full-house']).toBeGreaterThanOrEqual(v!);
  });

  it('for every pot and tier set: equal shares, equal amounts; every tier but Full House is a whole number of units (whole rupees in tiny pots)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 200 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.constantFrom(1, 5, 10, 20, 50, 100),
        (tickets, contribution, unit) => {
          const plan = planPrizes({ tickets, contribution, unit });
          const step = roundingFits(plan.pot, plan.tiers, unit) ? unit : 1;
          for (const x of plan.tiers) {
            for (const y of plan.tiers) if (x.percent === y.percent) expect(x.amount).toBe(y.amount);
            if (x.pattern !== 'full-house') expect(x.amount % step).toBe(0);
            expect(x.amount).toBeGreaterThanOrEqual(0);
          }
          expect(sum(plan.tiers.map((t) => t.amount))).toBe(plan.pot);
        },
      ),
      { numRuns: 3_000 },
    );
  });
});

describe('TAM-082: Full House takes every rounding difference (product owner review 2026-09-29, finding 1)', () => {
  // The live 1a.1 build gave the ₹300 pot ₹40 / ₹40 / ₹40 / ₹40 / ₹140: a rounding difference went to Early Five,
  // so Early Five equalled a Line. Only Full House takes differences; every other tier is its own share, rounded.
  it('6 tickets at ₹50 (a ₹300 pot) across 10 / 15 / 15 / 15 / 45 %: ₹30 / ₹40 / ₹40 / ₹40 / ₹150', () => {
    const plan = planPrizes({ tickets: 6, contribution: 50 });
    expect(plan.pot).toBe(300);
    expect(byPattern(plan.tiers, 'amount')).toEqual({
      'early-five': 30, 'top-line': 40, 'middle-line': 40, 'bottom-line': 40, 'full-house': 150,
    });
  });
});

describe('TAM-082: every tier but Full House rounds to the nearest unit, an exact half rounds down; Full House takes the rest (owner decision 2026-09-29)', () => {
  it('a ₹530 pot across 10 / 20 / 70 %: ₹53 rounds to ₹50, ₹106 rounds to ₹110, Full House takes ₹370', () => {
    const plan = planPrizes({ tickets: 5, contribution: 106 });
    expect(byPattern(plan.tiers, 'amount')).toEqual({ 'early-five': 50, 'top-line': 110, 'full-house': 370 });
  });

  it('an exact half rounds down: 10 tickets at ₹45 (a ₹450 pot): Early Five ₹45 → ₹40, each Line ₹67.50 → ₹70, Full House ₹200', () => {
    const plan = planPrizes({ tickets: 10, contribution: 45 });
    expect(plan.pot).toBe(450);
    expect(byPattern(plan.tiers, 'amount')).toEqual({
      'early-five': 40, 'top-line': 70, 'middle-line': 70, 'bottom-line': 70, 'full-house': 200,
    });
  });

  it('an exact half rounds down in a smaller game: 3 tickets at ₹150 (a ₹450 pot) across 10 / 20 / 70 %: ₹40 / ₹90 / ₹320', () => {
    const plan = planPrizes({ tickets: 3, contribution: 150 });
    expect(plan.pot).toBe(450);
    expect(byPattern(plan.tiers, 'amount')).toEqual({ 'early-five': 40, 'top-line': 90, 'full-house': 320 });
  });

  it('a ₹2,800 pot (16 tickets at ₹175): Early Five and Four Corners are exactly ₹280, never ₹290', () => {
    const plan = planPrizes({ tickets: 16, contribution: 175 });
    const a = byPattern(plan.tiers, 'amount');
    expect(a['early-five']).toBe(280);
    expect(a['four-corners']).toBe(280);
  });

  it('for every pot, ticket count and unit: each tier but Full House is exactly its share rounded to the nearest unit (half down), and Full House is the pot minus the rest; in tiny pots, to the nearest ₹1 (owner decision 2026-09-29)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 200 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.constantFrom(1, 5, 10, 20, 50, 100),
        (tickets, contribution, unit) => {
          const plan = planPrizes({ tickets, contribution, unit });
          const others = plan.tiers.filter((t) => t.pattern !== 'full-house');
          const fh = plan.tiers.find((t) => t.pattern === 'full-house')!.amount;
          expect(fh).toBe(plan.pot - sum(others.map((t) => t.amount)));
          // The owner's rule, in order: round to the unit; if that leaves Full House smaller than another tier
          // (or below ₹0), round to ₹1 instead; only if even that fails, lower the others ₹1 at a time.
          const step = roundingFits(plan.pot, plan.tiers, unit) ? unit : roundingFits(plan.pot, plan.tiers, 1) ? 1 : null;
          for (const t of others) {
            if (step === null) {
              // Last resort: each tier is at most its ₹1-rounded share, never negative, equal shares equal,
              // and Full House the largest.
              expect(t.amount).toBeLessThanOrEqual(nearestHalfDown(plan.pot, t.percent, 1));
              expect(t.amount).toBeGreaterThanOrEqual(0);
              expect(fh).toBeGreaterThanOrEqual(t.amount);
              for (const y of others) if (y.percent === t.percent) expect(y.amount).toBe(t.amount);
              continue;
            }
            const expected = nearestHalfDown(plan.pot, t.percent, step);
            const why = `${t.pattern} at ${t.percent}% of ₹${plan.pot} (unit ₹${unit}${step !== unit ? ', tiny pot so ₹1' : ''}) is ₹${(plan.pot * t.percent) / 100}: expected ₹${expected}, got ₹${t.amount}`;
            expect(t.amount, why).toBe(expected);
          }
        },
      ),
      { numRuns: 5_000 },
    );
  });
});

describe('TAM-082: tiny pots round to ₹1 when rounding to the unit would leave Full House smaller than another tier (owner decision 2026-09-29)', () => {
  it('6 tickets at ₹6 (a ₹36 pot) across 10 / 15 / 15 / 15 / 45 %: ₹4 / ₹5 / ₹5 / ₹5 / ₹17, never ₹0 / ₹0 / ₹0 / ₹0 / ₹36', () => {
    const plan = planPrizes({ tickets: 6, contribution: 6 });
    expect(plan.pot).toBe(36);
    expect(byPattern(plan.tiers, 'amount')).toEqual({
      'early-five': 4, 'top-line': 5, 'middle-line': 5, 'bottom-line': 5, 'full-house': 17,
    });
  });

  it('7 tickets at ₹5 (a ₹35 pot): an exact half still rounds down at ₹1: ₹3 / ₹5 / ₹5 / ₹5 / ₹17', () => {
    const plan = planPrizes({ tickets: 7, contribution: 5 });
    expect(plan.pot).toBe(35);
    expect(byPattern(plan.tiers, 'amount')).toEqual({
      'early-five': 3, 'top-line': 5, 'middle-line': 5, 'bottom-line': 5, 'full-house': 17,
    });
  });

  it('a pot where the ₹10 unit fits is not affected: 6 tickets at ₹50 still gives ₹30 / ₹40 / ₹40 / ₹40 / ₹150', () => {
    const plan = planPrizes({ tickets: 6, contribution: 50 });
    expect(byPattern(plan.tiers, 'amount')).toEqual({
      'early-five': 30, 'top-line': 40, 'middle-line': 40, 'bottom-line': 40, 'full-house': 150,
    });
  });
});

describe('TAM-092: tiers with the same share stay equal after the anchor\'s edits and removals', () => {
  const base = { tickets: 10, contribution: 50 };
  const lines = (plan: ReturnType<typeof planPrizes>) => {
    const a = byPattern(plan.tiers, 'amount');
    return [a['top-line'], a['middle-line'], a['bottom-line']];
  };

  it('removing Early Five keeps the three Lines equal, and the total equals the pot', () => {
    const plan = planPrizes({ ...base, removed: ['early-five'] });
    const [t, m, b] = lines(plan);
    expect(t).toBe(m);
    expect(m).toBe(b);
    expect(sum(plan.tiers.map((x) => x.amount))).toBe(500);
  });

  it('fixing Full House at a new amount keeps the three Lines equal', () => {
    for (const fh of [200, 250, 310]) {
      const plan = planPrizes({ ...base, fixed: { 'full-house': fh } });
      const [t, m, b] = lines(plan);
      expect(byPattern(plan.tiers, 'amount')['full-house']).toBe(fh);
      expect(t).toBe(m);
      expect(m).toBe(b);
      expect(sum(plan.tiers.map((x) => x.amount))).toBe(500);
      for (const x of plan.tiers) expect(x.amount).toBeGreaterThanOrEqual(0);
    }
  });

  it('fixing Top Line itself at ₹80: only Top Line differs; Middle and Bottom Line stay equal', () => {
    const plan = planPrizes({ ...base, fixed: { 'top-line': 80 } });
    const [t, m, b] = lines(plan);
    expect(t).toBe(80);
    expect(m).toBe(b);
    expect(sum(plan.tiers.map((x) => x.amount))).toBe(500);
  });

  it('edge: a ₹20 pot that cannot be split so equal shares are equal: Full House takes the difference, none below ₹0', () => {
    const plan = planPrizes({ tickets: 10, contribution: 2 });
    const [t, m, b] = lines(plan);
    expect(t).toBe(m);
    expect(m).toBe(b);
    expect(sum(plan.tiers.map((x) => x.amount))).toBe(20);
    for (const x of plan.tiers) expect(x.amount).toBeGreaterThanOrEqual(0);
    const a = byPattern(plan.tiers, 'amount');
    for (const v of Object.values(a)) expect(a['full-house']).toBeGreaterThanOrEqual(v!);
  });

  it('for every removal and fixed amount: unfixed tiers with the same share always have the same amount', () => {
    const optional: Pattern[] = ['early-five', 'four-corners', 'top-line', 'middle-line', 'bottom-line', 'second-full-house'];
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 120 }),
        fc.integer({ min: 1, max: 500 }),
        fc.subarray(optional),
        // Full House stays free here, so it can take the difference (TAM-092 edge).
        fc.option(fc.tuple(fc.constantFrom<Pattern>(...optional), fc.integer({ min: 0, max: 100 }))),
        (tickets, contribution, removedAll, fix) => {
          const suggested = suggestTiers(tickets).map((t) => t.pattern);
          const removed = removedAll.filter((p) => suggested.includes(p));
          const pot = tickets * contribution;
          const fixed: Partial<Record<Pattern, number>> = {};
          if (fix && suggested.includes(fix[0]) && !removed.includes(fix[0])) fixed[fix[0]] = Math.floor((pot * fix[1]) / 200);
          const plan = planPrizes({ tickets, contribution, removed, fixed });
          expect(sum(plan.tiers.map((t) => t.amount))).toBe(pot);
          const free = plan.tiers.filter((t) => !(t.pattern in fixed));
          for (const x of free) {
            expect(x.amount).toBeGreaterThanOrEqual(0);
            for (const y of free) if (x.percent === y.percent) expect(x.amount).toBe(y.amount);
          }
        },
      ),
      { numRuns: 1_500 },
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
  // Wins are recorded on the anchor's word (TAM-037); unclaimed tiers are handed back (TAM-088).
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
            const ids = players.slice(0, Math.min(tieCount, players.length)).map((p) => p.id);
            expect(g.win(pattern, ...ids).ok).toBe(true);
            g.close(pattern);
            won++;
          }
          if (!endEarly || won === 0) {
            // Play to Full House (a tie of up to two), which also covers "nobody won anything else".
            g.callUpTo(Math.max(15 - g.called.length, 1));
            g.win('full-house', ...players.slice(0, Math.min(2, players.length)).map((p) => p.id));
            g.finish();
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
            // TAM-088: a won tier pays exactly its locked amount; nothing is spread onto it.
            expect(t.amount).toBe(plan.tiers.find((x) => x.pattern === t.pattern)!.amount);
          }
          expect(sum(s.payouts.map((p: any) => p.won + p.handedBack))).toBe(pot);
          const unclaimed = sum(s.tiers.filter((t: any) => t.winners.length === 0).map((t: any) => t.amount));
          expect(sum(s.payouts.map((p: any) => p.handedBack))).toBe(unclaimed);
          // TAM-082: tiers with the same share always have the same amount (fixed tiers aside).
          const free = plan.tiers.filter((t) => !(t.pattern in fixed));
          for (const x of free) for (const y of free) if (x.percent === y.percent) expect(x.amount).toBe(y.amount);
        },
      ),
      { numRuns: 500 },
    );
  });
});
