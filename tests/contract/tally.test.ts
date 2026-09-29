// Phase 1b: the session tally and "Settle up", shared by every game with money.
// Scenarios: PLT-017 (the tally covers ended, unsettled games in one session, and balances), PLT-018 (never
// across sessions), PLT-019 (settled games are not tallied again), PLT-020 (the same person across games, by
// name), PLT-021 (the tally uses only each game's money record, so any game with money works), PLT-023 (games
// without money stay out), PLT-025 (taking a game out still balances), PLT-028 (net amounts, then the fewest
// hand-overs, adding up exactly). Shapes: tests/contract/README.md.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import * as engine from '../../src/engine';
import { Game } from '../games/tambola/helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
const tallySession: (sessionId: string, games: any[]) => any = (s, g) => (engine as any).tallySession(s, g);
const settleUp: (people: { name: string; net: number }[]) => { from: string; to: string; amount: number }[] = (p) =>
  (engine as any).settleUp(p);

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const person = (personId: string, name: string, paid: number, won: number) => ({ personId, name, paid, won });
const game = (id: string, people: ReturnType<typeof person>[], over: Record<string, unknown> = {}) => ({
  id, sessionId: 'diwali', status: 'ended', settled: false, money: { currency: 'INR', people }, ...over,
});
const byName = (t: any) => Object.fromEntries(t.people.map((p: any) => [p.name, p]));

// Two Tambola nights in "Diwali at Nani's": Riya +120, Asha −70, Dad −50 overall (the PLT-028 example).
const G1 = game('g1', [person('p1', 'Riya', 50, 150), person('p2', 'Asha', 50, 0), person('p3', 'Dad', 50, 0)]);
const G2 = game('g2', [person('x', 'Dad', 50, 50), person('y', 'Riya', 50, 70), person('z', 'Asha', 50, 30)]);

describe('PLT-017: the tally covers finished, unsettled games in one session', () => {
  it('for each person: what they paid, what they got back, and one net amount; the totals balance', () => {
    const t = tallySession('diwali', [G1, G2]);
    expect(t.sessionId).toBe('diwali');
    expect(t.gameIds).toEqual(['g1', 'g2']);
    const p = byName(t);
    expect(p['Riya']).toMatchObject({ paid: 100, gotBack: 220, net: 120 });
    expect(p['Asha']).toMatchObject({ paid: 100, gotBack: 30, net: -70 });
    expect(p['Dad']).toMatchObject({ paid: 100, gotBack: 50, net: -50 });
    expect(t.paidIn).toBe(300);
    expect(t.paidOut).toBe(300);
    expect(sum(t.people.map((x: any) => x.net))).toBe(0);
  });

  it('people are listed in the order they first appear', () => {
    expect(tallySession('diwali', [G1, G2]).people.map((p: any) => p.name)).toEqual(['Riya', 'Asha', 'Dad']);
  });

  it('leaves out games in progress, paused, abandoned or still in setup', () => {
    const others = ['in-progress', 'paused', 'abandoned', 'setup'].map((status, i) =>
      game(`o${i}`, [person('p1', 'Riya', 50, 0), person('p2', 'Meera', 50, 100)], { status }),
    );
    const t = tallySession('diwali', [G1, ...others]);
    expect(t.gameIds).toEqual(['g1']);
    expect(t.people.map((p: any) => p.name)).toEqual(['Riya', 'Asha', 'Dad']);
    expect(byName(t)['Riya'].net).toBe(100);
  });

  it('an empty session has an empty tally that still balances', () => {
    const t = tallySession('diwali', []);
    expect(t.gameIds).toEqual([]);
    expect(t.people).toEqual([]);
    expect(t.paidIn).toBe(0);
    expect(t.paidOut).toBe(0);
  });
});

describe('PLT-018: games in different sessions are never tallied together', () => {
  it('a game from another session is never included, even when handed in with the rest', () => {
    const other = game('g9', [person('p1', 'Riya', 50, 0), person('p2', 'Asha', 50, 100)], { sessionId: 'sunday' });
    const t = tallySession('diwali', [G1, other, G2]);
    expect(t.gameIds).toEqual(['g1', 'g2']);
    expect(byName(t)['Riya'].net).toBe(120);
    expect(tallySession('sunday', [G1, other, G2]).gameIds).toEqual(['g9']);
  });
});

describe('PLT-019: settled games can no longer be tallied', () => {
  it('a settled game is left out; later games in the same session start a new tally', () => {
    const t = tallySession('diwali', [{ ...G1, settled: true }, G2]);
    expect(t.gameIds).toEqual(['g2']);
    expect(byName(t)['Riya']).toMatchObject({ paid: 50, gotBack: 70, net: 20 });
    expect(tallySession('diwali', [{ ...G1, settled: true }, { ...G2, settled: true }]).people).toEqual([]);
  });
});

describe('PLT-020: the same person across games is matched by name', () => {
  it('different ids in each game, the same name: one line in the tally', () => {
    const t = tallySession('diwali', [G1, G2]);
    expect(t.people.filter((p: any) => p.name === 'Riya')).toHaveLength(1);
  });

  it('different names are different people, even with the same id', () => {
    const a = game('a', [person('p1', 'Riya', 50, 100), person('p2', 'Asha', 50, 0)]);
    const b = game('b', [person('p1', 'Riya S', 50, 0), person('p2', 'Asha', 50, 100)]);
    expect(tallySession('diwali', [a, b]).people.map((p: any) => p.name)).toEqual(['Riya', 'Asha', 'Riya S']);
  });
});

describe('PLT-021: the tally works for any game with money, from its money record alone', () => {
  it('a made-up scoreboard game (not Tambola) is tallied alongside Tambola, with no change to the tally', () => {
    const rummy = { id: 'r1', sessionId: 'diwali', status: 'ended', settled: false, gameType: 'rummy',
      money: { currency: 'INR', people: [person('q', 'Asha', 200, 0), person('r', 'Riya', 0, 200)] } };
    const t = tallySession('diwali', [G1, rummy]);
    expect(t.gameIds).toEqual(['g1', 'r1']);
    expect(byName(t)['Asha'].net).toBe(-250);
    expect(t.paidIn).toBe(t.paidOut);
  });

  it('a real Tambola game\'s own money record (summary.money) is tallied as it is', () => {
    const g = new Game({ players: [{ id: 'a', name: 'Riya' }, { id: 'b', name: 'Asha' }, { id: 'c', name: 'Dad' }], contribution: 50 });
    g.call(5);
    g.win('early-five', 'a');
    g.close('early-five');
    g.call(1);
    g.win('full-house', 'b');
    g.finish();
    const money = g.summary.money;
    const t = tallySession('diwali', [{ id: 't1', sessionId: 'diwali', status: 'ended', settled: false, money }]);
    expect(t.paidIn).toBe(150);
    expect(t.paidOut).toBe(150);
    for (const p of g.summary.payouts) expect(byName(t)[p.name].net).toBe(p.net);
  });
});

describe('PLT-023: games without money stay out of the tally', () => {
  it('an ended "No money" game is never tallied', () => {
    const t = tallySession('diwali', [G1, { id: 'n1', sessionId: 'diwali', status: 'ended', settled: false, money: null }]);
    expect(t.gameIds).toEqual(['g1']);
  });
});

describe('PLT-025: taking a game out of an unsettled tally still balances', () => {
  it('without G2, the tally is G1 alone, and balances', () => {
    const t = tallySession('diwali', [G1]);
    expect(t.paidIn).toBe(t.paidOut);
    expect(byName(t)['Riya'].net).toBe(100);
  });
});

describe('PLT-028: settle up, net amounts first, then who pays whom', () => {
  it('Riya +₹120, Asha −₹70, Dad −₹50: "Asha pays Riya ₹70 · Dad pays Riya ₹50"', () => {
    const t = tallySession('diwali', [G1, G2]);
    const plan = settleUp(t.people.map((p: any) => ({ name: p.name, net: p.net })));
    expect([...plan].sort((a, b) => a.from.localeCompare(b.from))).toEqual([
      { from: 'Asha', to: 'Riya', amount: 70 },
      { from: 'Dad', to: 'Riya', amount: 50 },
    ]);
  });

  it('nothing to settle when every net is 0, or nobody is in the tally', () => {
    expect(settleUp([{ name: 'Riya', net: 0 }, { name: 'Asha', net: 0 }])).toEqual([]);
    expect(settleUp([])).toEqual([]);
  });

  it('a pair that cancels out is settled in one hand-over, not split up (fewest hand-overs)', () => {
    const plan = settleUp([
      { name: 'Riya', net: 50 }, { name: 'Asha', net: 30 }, { name: 'Dad', net: -30 }, { name: 'Nani', net: -50 },
    ]);
    expect(plan).toHaveLength(2);
    expect(plan).toContainEqual({ from: 'Nani', to: 'Riya', amount: 50 });
    expect(plan).toContainEqual({ from: 'Dad', to: 'Asha', amount: 30 });
  });

  it('the same nets always give the same hand-overs', () => {
    const nets = [{ name: 'A', net: 40 }, { name: 'B', net: -25 }, { name: 'C', net: -15 }, { name: 'D', net: 0 }];
    expect(settleUp(nets)).toEqual(settleUp(nets));
  });

  it('for any balanced nets: whole rupees, debtors pay creditors, it adds up exactly to each net, in the fewest hand-overs', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -500, max: 500 }), { minLength: 1, maxLength: 7 }), (some) => {
        const nets = [...some, -sum(some)].map((net, i) => ({ name: `Person ${i + 1}`, net }));
        const plan = settleUp(nets);
        const left = Object.fromEntries(nets.map((p) => [p.name, p.net]));
        for (const h of plan) {
          expect(Number.isSafeInteger(h.amount) && h.amount > 0, JSON.stringify(h)).toBe(true);
          expect(h.from).not.toBe(h.to);
          const start = nets.find((p) => p.name === h.from)!.net;
          const end = nets.find((p) => p.name === h.to)!.net;
          expect(start, `${h.from} pays, so owes`).toBeLessThan(0);
          expect(end, `${h.to} is paid, so is owed`).toBeGreaterThan(0);
          left[h.from] += h.amount;
          left[h.to] -= h.amount;
        }
        for (const [name, rest] of Object.entries(left)) expect(rest, `${name} is settled exactly`).toBe(0);
        expect(plan.length).toBe(fewestHandOvers(nets.map((p) => p.net)));
      }),
      { numRuns: 400 },
    );
  });
});

describe('PLT-017, PLT-020 and PLT-028: random Tambola nights always tally and settle to the rupee', () => {
  it('any session of up to 4 games among the same friends balances, and settle up leaves everyone at 0', () => {
    const names = ['Riya', 'Asha', 'Dad', 'Nani', 'Kabir', 'Meera'];
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            seed: fc.string({ minLength: 1, maxLength: 6 }),
            who: fc.subarray(names, { minLength: 2 }),
            contribution: fc.integer({ min: 1, max: 200 }),
            winners: fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 1, maxLength: 3 }),
          }),
          { minLength: 1, maxLength: 4 },
        ),
        (nights) => {
          const games = nights.map((n, i) => {
            const players = n.who.map((name, j) => ({ id: `g${i}p${j}`, name }));
            const g = new Game({ seed: n.seed, players, contribution: n.contribution });
            g.call(5);
            const pick = n.winners.map((w) => players[w % players.length]!.id);
            g.win('early-five', ...Array.from(new Set(pick)));
            g.close('early-five');
            g.call(1);
            g.win('full-house', players[0]!.id);
            g.finish();
            return { id: `game${i}`, sessionId: 's', status: 'ended', settled: false, money: g.summary.money };
          });
          const t = tallySession('s', games);
          const paid = sum(games.map((g) => sum(g.money.people.map((p: any) => p.paid))));
          expect(t.paidIn).toBe(paid);
          expect(t.paidOut).toBe(paid);
          expect(sum(t.people.map((p: any) => p.net))).toBe(0);
          for (const p of t.people) expect(p.net).toBe(p.gotBack - p.paid);
          expect(new Set(t.people.map((p: any) => p.name)).size).toBe(t.people.length);
          const left = Object.fromEntries(t.people.map((p: any) => [p.name, p.net]));
          for (const h of settleUp(t.people.map((p: any) => ({ name: p.name, net: p.net })))) {
            left[h.from] += h.amount;
            left[h.to] -= h.amount;
          }
          for (const rest of Object.values(left)) expect(rest).toBe(0);
        },
      ),
      { numRuns: 150 },
    );
  });
});

/**
 * The test's own answer to "how few hand-overs can settle these nets?": everyone who is not already at 0
 * needs one hand-over, less one for every group that can settle among itself. Checked by trying every group.
 */
function fewestHandOvers(nets: number[]): number {
  const people = nets.filter((n) => n !== 0);
  const n = people.length;
  const total = new Array<number>(1 << n).fill(0);
  const groups = new Array<number>(1 << n).fill(0);
  for (let mask = 1; mask < 1 << n; mask++) {
    const low = mask & -mask;
    const i = 31 - Math.clz32(low);
    total[mask] = total[mask ^ low]! + people[i]!;
    let best = 0;
    for (let j = 0; j < n; j++) if (mask & (1 << j)) best = Math.max(best, groups[mask ^ (1 << j)]!);
    groups[mask] = best + (total[mask] === 0 ? 1 : 0);
  }
  return n - groups[(1 << n) - 1]!;
}
