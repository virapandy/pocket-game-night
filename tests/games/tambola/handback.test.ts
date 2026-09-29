// Money of prizes nobody won goes back to the players, equally per ticket: specs/tambola/08-prizes.md
// (TAM-088, TAM-089, TAM-093), 06-room-and-host.md (TAM-066), 10-lifecycle.md (TAM-144), and the record the
// session tally reads (PLT-017, PLT-021). Change request of 28 September 2026; per ticket confirmed by the owner.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { moneyProblems } from '../../../src/engine';
import { Game, type Pattern } from './helpers';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const byPlayer = (s: any) => Object.fromEntries(s.payouts.map((p: any) => [p.playerId, p]));

/** Six players, one ticket each, at ₹50: a ₹300 pot over four tiers. */
const FOUR_TIERS = [
  { pattern: 'early-five' as Pattern, amount: 30 },
  { pattern: 'four-corners' as Pattern, amount: 50 },
  { pattern: 'top-line' as Pattern, amount: 60 },
  { pattern: 'full-house' as Pattern, amount: 160 },
];

describe('TAM-066 and TAM-088: ending early pays the winners exactly their tiers and hands the rest back', () => {
  function endedEarly() {
    const g = new Game({ tiers: FOUR_TIERS }).call(8);
    g.win('early-five', 'p1');
    g.closeAll().call(5);
    g.win('top-line', 'p2');
    g.closeAll().call(5);
    g.do({ type: 'end' });
    return g.summary;
  }

  it('the winners of claimed tiers get exactly their tier amounts, nothing more', () => {
    const s = endedEarly();
    const tier = (p: Pattern) => s.tiers.find((t: any) => t.pattern === p);
    expect(tier('early-five').winners).toEqual([{ playerId: 'p1', amount: 30 }]);
    expect(tier('top-line').winners).toEqual([{ playerId: 'p2', amount: 60 }]);
    expect(tier('four-corners')).toMatchObject({ amount: 50, winners: [] });
    expect(tier('full-house')).toMatchObject({ amount: 160, winners: [] });
  });

  it('the ₹210 nobody won is handed back equally per ticket: ₹35 to each of the six', () => {
    const s = endedEarly();
    const p = byPlayer(s);
    for (const id of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) expect(p[id].handedBack).toBe(35);
    expect(p.p1).toMatchObject({ paid: 50, won: 30, handedBack: 35, net: 15 });
    expect(p.p2).toMatchObject({ paid: 50, won: 60, handedBack: 35, net: 45 });
    expect(p.p3).toMatchObject({ paid: 50, won: 0, handedBack: 35, net: -15 });
  });

  it('payouts plus money handed back add up to the pot exactly', () => {
    const s = endedEarly();
    expect(sum(s.payouts.map((p: any) => p.won)) + sum(s.payouts.map((p: any) => p.handedBack))).toBe(300);
    expect(moneyProblems(s.money)).toEqual([]);
  });

  it('a player with 2 tickets gets twice as much back as a player with 1', () => {
    const players = [{ id: 'r', name: 'Riya', tickets: 2 }, { id: 'a', name: 'Asha' }, { id: 'd', name: 'Dad' }];
    const tiers = [
      { pattern: 'early-five' as Pattern, amount: 20 },
      { pattern: 'top-line' as Pattern, amount: 40 },
      { pattern: 'full-house' as Pattern, amount: 140 },
    ];
    const g = new Game({ players, tiers }).call(6);
    g.win('early-five', 'd');
    g.closeAll().do({ type: 'end' });
    const p = byPlayer(g.summary);
    expect(p.r.handedBack).toBe(90);
    expect(p.a.handedBack).toBe(45);
    expect(p.d.handedBack).toBe(45);
    expect(p.d).toMatchObject({ paid: 50, won: 20, net: 15 });
  });
});

describe('TAM-089: the payout summary says what the host hands each person', () => {
  it('lists each tier with its winners, or none ("not won"), and per person paid, won, handed back and net', () => {
    const g = new Game({ tiers: FOUR_TIERS }).call(8);
    g.win('early-five', 'p3');
    g.closeAll().call(20);
    g.win('full-house', 'p4', 'p5');
    g.finish();
    const s = g.summary;
    expect(s.tiers.map((t: any) => t.pattern).sort()).toEqual(['early-five', 'four-corners', 'full-house', 'top-line']);
    const notWon = s.tiers.filter((t: any) => t.winners.length === 0).map((t: any) => t.pattern).sort();
    expect(notWon).toEqual(['four-corners', 'top-line']);
    expect(s.payouts.map((p: any) => p.playerId)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
    for (const p of s.payouts) {
      expect(p.paid).toBe(50);
      expect(p.net).toBe(p.won + p.handedBack - p.paid);
      expect(typeof p.name).toBe('string');
    }
    expect(sum(s.payouts.map((p: any) => p.won + p.handedBack))).toBe(300);
    // ₹110 not won, over 6 tickets: ₹19, ₹19, ₹18, ₹18, ₹18, ₹18 in player order.
    expect(s.payouts.map((p: any) => p.handedBack)).toEqual([19, 19, 18, 18, 18, 18]);
  });

  it('per person, "Host gives": the prize plus the money handed back; the host gives out exactly the pot', () => {
    const g = new Game({ tiers: FOUR_TIERS }).call(8);
    g.win('early-five', 'p3');
    g.closeAll().call(20);
    g.win('full-house', 'p4', 'p5');
    g.finish();
    const s = g.summary;
    for (const p of s.payouts) {
      expect(Number.isInteger(p.hostGives), `${p.playerId}: hostGives is a whole number of rupees`).toBe(true);
      expect(p.hostGives).toBe(p.won + p.handedBack);
    }
    // ₹30 Early Five to p3; ₹160 Full House shared by p4 and p5 (₹80 each); ₹110 handed back as above.
    expect(s.payouts.map((p: any) => p.hostGives)).toEqual([19, 19, 30 + 18, 80 + 18, 80 + 18, 18]);
    expect(sum(s.payouts.map((p: any) => p.hostGives))).toBe(s.pot);
    expect(s.pot).toBe(300);
  });

  it('edge: nobody won anything, so the host gives each person back exactly what they paid (TAM-144)', () => {
    const g = new Game({ tiers: FOUR_TIERS }).call(8);
    g.do({ type: 'end' });
    const s = g.summary;
    for (const p of s.payouts) expect(p.hostGives).toBe(p.paid);
    expect(sum(s.payouts.map((p: any) => p.hostGives))).toBe(300);
  });

  it('for any game with money, the host gives out the pot to the rupee, and each person gets won plus handed back', () => {
    const patterns = FOUR_TIERS.map((t) => t.pattern);
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.constantFrom(...patterns), fc.subarray(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], { minLength: 1, maxLength: 3 })), { maxLength: 4 }),
        (wins) => {
          const g = new Game({ tiers: FOUR_TIERS }).call(15);
          const done = new Set<string>();
          for (const [pattern, who] of wins) {
            if (done.has(pattern) || pattern === 'full-house') continue;
            done.add(pattern);
            g.win(pattern, ...who);
            g.closeAll().call(1);
          }
          g.do({ type: 'end' });
          const s = g.summary;
          for (const p of s.payouts) expect(p.hostGives).toBe(p.won + p.handedBack);
          expect(sum(s.payouts.map((p: any) => p.hostGives))).toBe(s.pot);
        },
      ),
      { numRuns: 60 },
    );
  });
});

describe('TAM-093: money handed back is split to the rupee, fairly and in a fixed order', () => {
  // Three tickets at ₹50 (a ₹150 pot): Early Five ₹100 is won; Top Line ₹20 and Full House ₹30 (₹50) are not.
  const tiers = [
    { pattern: 'early-five' as Pattern, amount: 100 },
    { pattern: 'top-line' as Pattern, amount: 20 },
    { pattern: 'full-house' as Pattern, amount: 30 },
  ];

  it('₹50 across the tickets of Riya, Asha and Dad: ₹17, ₹17 and ₹16', () => {
    const players = [{ id: 'r', name: 'Riya' }, { id: 'a', name: 'Asha' }, { id: 'd', name: 'Dad' }];
    const g = new Game({ players, tiers }).call(6);
    g.win('early-five', 'd');
    g.closeAll().do({ type: 'end' });
    const p = byPlayer(g.summary);
    expect([p.r.handedBack, p.a.handedBack, p.d.handedBack]).toEqual([17, 17, 16]);
  });

  it('the extra rupees go in the order the players were listed at setup', () => {
    const players = [{ id: 'x3', name: 'Dad' }, { id: 'x1', name: 'Riya' }, { id: 'x2', name: 'Asha' }];
    const g = new Game({ players, tiers }).call(6);
    g.win('early-five', 'x1');
    g.closeAll().do({ type: 'end' });
    const p = byPlayer(g.summary);
    expect([p.x3.handedBack, p.x1.handedBack, p.x2.handedBack]).toEqual([17, 17, 16]);
  });

  it('a ticket that is out after a bogey still gets its share', () => {
    const players = [{ id: 'r', name: 'Riya' }, { id: 'a', name: 'Asha' }, { id: 'd', name: 'Dad' }];
    const g = new Game({ players, tiers, settings: { bogey: 'out' } }).call(6);
    g.bogey('a', 'top-line');
    g.win('early-five', 'd');
    g.closeAll().do({ type: 'end' });
    expect(byPlayer(g.summary).a.handedBack).toBe(17);
  });

  it('with "No money", unclaimed prizes are listed as not won and nothing is handed back', () => {
    const labels = [
      { pattern: 'early-five' as Pattern, amount: 0, label: 'Chocolate' },
      { pattern: 'full-house' as Pattern, amount: 0, label: 'The big cake' },
    ];
    const g = new Game({ contribution: null, tiers: labels }).call(6);
    g.win('early-five', 'p1');
    g.closeAll().do({ type: 'end' });
    const s = g.summary;
    expect(s.money).toBeNull();
    expect(s.tiers.find((t: any) => t.pattern === 'full-house').winners).toEqual([]);
    for (const p of s.payouts ?? []) expect(p.handedBack).toBe(0);
  });

  it('for any tickets and any unclaimed money: exact total, each person within a rupee per ticket of an equal share', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 2, maxLength: 12 }),
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 0, max: 100 }),
        (ticketsEach, contribution, wonPct) => {
          const players = ticketsEach.map((t, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}`, tickets: t }));
          const T = sum(ticketsEach);
          const pot = T * contribution;
          const early = Math.floor((pot * wonPct) / 100);
          const g = new Game({ players, contribution, tiers: [
            { pattern: 'early-five', amount: early }, { pattern: 'full-house', amount: pot - early },
          ] }).call(5);
          g.win('early-five', 'p1');
          g.closeAll().do({ type: 'end' });
          const s = g.summary;
          const U = pot - early;
          const hb = s.payouts.map((p: any) => p.handedBack);
          expect(sum(hb)).toBe(U);
          s.payouts.forEach((p: any, i: number) => {
            const t = ticketsEach[i]!;
            expect(p.handedBack).toBeGreaterThanOrEqual(t * Math.floor(U / T));
            expect(p.handedBack).toBeLessThanOrEqual(t * Math.ceil(U / T));
          });
          if (ticketsEach.every((t) => t === 1)) {
            for (let i = 1; i < hb.length; i++) expect(hb[i]).toBeLessThanOrEqual(hb[i - 1]);
          }
          expect(moneyProblems(s.money)).toEqual([]);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe('TAM-144: a game that ends with no prize won hands every contribution back', () => {
  it('nobody is paid a prize, and each person gets back exactly what they paid', () => {
    const g = new Game({ players: [{ id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha' }, { id: 'p3', name: 'Dad', tickets: 3 }] }).call(12);
    g.bogey('p2', 'top-line'); // a bogey wins nothing
    g.do({ type: 'end' });
    const s = g.summary;
    expect(s.result).toBe('ended');
    for (const t of s.tiers) expect(t.winners).toEqual([]);
    expect(moneyProblems(s.money)).toEqual([]);
    expect(Object.fromEntries(s.payouts.map((p: any) => [p.playerId, [p.paid, p.won, p.handedBack, p.net]]))).toEqual({
      p1: [100, 0, 100, 0], p2: [50, 0, 50, 0], p3: [150, 0, 150, 0],
    });
  });
});

describe('PLT-017 and PLT-021: the money record the tally reads includes money handed back', () => {
  it('each person\'s "got back" (won in the money record) is prizes plus money handed back, and it balances', () => {
    const g = new Game({ tiers: FOUR_TIERS }).call(8);
    g.win('early-five', 'p1');
    g.closeAll().do({ type: 'end' });
    const s = g.summary;
    const payouts = byPlayer(s);
    for (const person of s.money.people) {
      const p = payouts[person.personId];
      expect(person.paid).toBe(p.paid);
      expect(person.won).toBe(p.won + p.handedBack);
    }
    expect(moneyProblems(s.money)).toEqual([]);
  });
});
