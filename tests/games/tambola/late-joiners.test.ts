// Phase 1b: late joiners on the host phone (paper tickets).
// Scenarios: TAM-067 (a late joiner gets a ticket mid-game), TAM-184 (taken out again if added by mistake),
// TAM-093 (a late joiner's ticket counts like every other ticket in money handed back), TAM-073 (replays),
// PLT-021 (the game's money record still balances). Moves and shapes: tests/games/tambola/README.md.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { moneyProblems } from '../../../src/engine';
import { Game, planPrizes, suggestTiers, type Pattern } from './helpers';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

const THREE = [
  { id: 'riya', name: 'Riya' },
  { id: 'asha', name: 'Asha' },
  { id: 'dad', name: 'Dad' },
];
// ₹50 each, 3 tickets: a ₹150 pot.
const TIERS: { pattern: Pattern; amount: number }[] = [
  { pattern: 'early-five', amount: 20 },
  { pattern: 'top-line', amount: 30 },
  { pattern: 'full-house', amount: 100 },
];
const KABIR = { id: 'kabir', name: 'Kabir', tickets: 1 };

const addPlayer = (g: Game, player: { id: string; name: string; tickets: number }) => g.try({ type: 'add-player', player });
const removePlayer = (g: Game, playerId: string) => g.try({ type: 'remove-player', playerId });
const tierAmounts = (g: Game): Record<string, number> =>
  Object.fromEntries((g.host.tiers as { pattern: string; amount: number }[]).map((t) => [t.pattern, t.amount]));

describe('TAM-067: a late joiner can get a ticket mid-game', () => {
  it('after 6 numbers, the host adds Kabir; he is a player, and his ₹50 is added to the pot, split across the tiers', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    expect(addPlayer(g, KABIR).ok).toBe(true);
    expect(g.host.players.map((p: any) => p.name)).toEqual(['Riya', 'Asha', 'Dad', 'Kabir']);
    const after = tierAmounts(g);
    // The new prize amounts are on the host view, for the anchor to announce; the total is exact.
    expect(sum(Object.values(after))).toBe(200);
    for (const t of TIERS) expect(after[t.pattern]).toBeGreaterThanOrEqual(t.amount);
    expect(after['full-house']).toBeGreaterThanOrEqual(Math.max(after['early-five']!, after['top-line']!));
    // The numbers already called stay called: nothing about the draw changes.
    expect(g.called).toHaveLength(6);
  });

  it('only tiers nobody has won yet grow; a won tier keeps its amount, even before it is closed', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    g.win('early-five', 'asha');
    g.close('early-five');
    g.call(1);
    g.win('top-line', 'riya'); // won, still waiting to be closed (TAM-145)
    expect(addPlayer(g, KABIR).ok).toBe(true);
    const after = tierAmounts(g);
    expect(after['early-five']).toBe(20);
    expect(after['top-line']).toBe(30);
    expect(after['full-house']).toBe(150);
  });

  it('the money is rounded to ₹10 where possible, keeping the total exact', () => {
    // 6 tickets at ₹50: the app's own suggested tiers for a ₹300 pot.
    const six = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, name: id.toUpperCase() }));
    const plan = planPrizes({ tickets: 6, contribution: 50 });
    const g = new Game({ players: six, tiers: plan.tiers.map(({ pattern, amount }) => ({ pattern, amount })) }).call(6);
    const before = tierAmounts(g);
    expect(addPlayer(g, { id: 'g', name: 'G', tickets: 1 }).ok).toBe(true);
    const after = tierAmounts(g);
    expect(sum(Object.values(after))).toBe(350);
    for (const [pattern, amount] of Object.entries(after)) {
      expect(amount).toBeGreaterThanOrEqual(before[pattern]!);
      if (pattern !== 'full-house') expect((amount - before[pattern]!) % 10, `${pattern} grows by whole ₹10`).toBe(0);
    }
  });

  it('a late joiner with 2 tickets adds 2 contributions', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(3);
    expect(addPlayer(g, { id: 'kabir', name: 'Kabir', tickets: 2 }).ok).toBe(true);
    expect(sum(Object.values(tierAmounts(g)))).toBe(250);
  });

  it('with "No money", a late joiner is added and nothing about the prizes changes', () => {
    const tiers = [
      { pattern: 'early-five' as Pattern, amount: 0, label: 'chocolate' },
      { pattern: 'full-house' as Pattern, amount: 0, label: 'cake' },
    ];
    const g = new Game({ players: THREE, contribution: null, tiers }).call(4);
    const before = g.host.tiers;
    expect(addPlayer(g, KABIR).ok).toBe(true);
    expect(g.host.tiers).toEqual(before);
    g.call(1);
    g.win('full-house', 'kabir');
    g.finish();
    expect(g.summary.pot).toBeNull();
    expect(g.summary.payouts).toBeNull();
  });

  it('a late joiner can win like anyone else, and is paid in the summary', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    addPlayer(g, KABIR);
    const topLine = tierAmounts(g)['top-line']!;
    g.call(1);
    expect(g.win('top-line', 'kabir').ok).toBe(true);
    g.close('top-line');
    g.call(1);
    g.win('full-house', 'riya');
    g.finish();
    const s = g.summary;
    expect(s.pot).toBe(200);
    const kabir = s.payouts.find((p: any) => p.playerId === 'kabir');
    expect(kabir.paid).toBe(50);
    expect(kabir.won).toBe(topLine);
    expect(moneyProblems(s.money)).toEqual([]);
    expect(s.money.people.map((p: any) => p.name)).toContain('Kabir');
  });

  it('late joining is allowed while fewer than 10 numbers are called; at 10 the host can no longer add players', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(9);
    expect(addPlayer(g, KABIR).ok).toBe(true);
    g.call(1);
    expect(g.called).toHaveLength(10);
    const r = addPlayer(g, { id: 'meera', name: 'Meera', tickets: 1 });
    expect(r.ok).toBe(false);
    expect(r.reason ?? '').not.toBe('');
    expect(g.host.players).toHaveLength(4);
  });

  it('the host setting moves the limit: until 3 numbers', () => {
    const g = new Game({ players: THREE, tiers: TIERS, settings: { lateJoinUntil: 3 } }).call(2);
    expect(addPlayer(g, KABIR).ok).toBe(true);
    g.call(1);
    expect(addPlayer(g, { id: 'meera', name: 'Meera', tickets: 1 }).ok).toBe(false);
  });

  it('with late joining set to 0, nobody can be added', () => {
    const g = new Game({ players: THREE, tiers: TIERS, settings: { lateJoinUntil: 0 } }).call(1);
    expect(addPlayer(g, KABIR).ok).toBe(false);
    expect(sum(Object.values(tierAmounts(g)))).toBe(150);
  });

  it('wrong input is refused and nothing changes: a name already in the game, 0 or 4 tickets, an id already used, after the game is over', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(4);
    const before = g.match;
    for (const player of [
      { id: 'kabir', name: 'Riya', tickets: 1 }, // PLT-024: two players cannot have the same name
      { id: 'kabir', name: 'Kabir', tickets: 0 }, // TAM-045: 1 to 3 tickets
      { id: 'kabir', name: 'Kabir', tickets: 4 },
      { id: 'asha', name: 'Kabir', tickets: 1 },
    ]) {
      expect(addPlayer(g, player).ok, JSON.stringify(player)).toBe(false);
    }
    expect(g.match).toBe(before);
    expect(addPlayer(g, KABIR).ok, 'a correct late joiner is still accepted').toBe(true);
    g.do({ type: 'end' });
    expect(addPlayer(g, { id: 'meera', name: 'Meera', tickets: 1 }).ok).toBe(false);
  });

  it('a game with a late joiner replays exactly (TAM-073)', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    expect(addPlayer(g, KABIR).ok).toBe(true);
    g.call(3);
    g.win('early-five', 'kabir');
    g.close('early-five');
    g.call(2);
    const again = g.replayed();
    expect(again.state).toEqual(g.match.state);
  });
});

describe('TAM-184: a late joiner added by mistake can be taken out again', () => {
  it('before any further number: his contribution comes out, and the prizes go back to what they were', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    const before = g.host.tiers;
    addPlayer(g, KABIR);
    expect(removePlayer(g, 'kabir').ok).toBe(true);
    expect(g.host.tiers).toEqual(before);
    expect(g.host.players.map((p: any) => p.name)).toEqual(['Riya', 'Asha', 'Dad']);
    g.call(1);
    g.win('full-house', 'riya');
    g.finish();
    expect(g.summary.pot).toBe(150);
    expect(g.summary.payouts.map((p: any) => p.name)).toEqual(['Riya', 'Asha', 'Dad']);
    expect(moneyProblems(g.summary.money)).toEqual([]);
  });

  it('with a won tier: removing him puts every amount back exactly, won tiers included', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    g.win('early-five', 'dad');
    g.close('early-five');
    const before = g.host.tiers;
    expect(addPlayer(g, { id: 'kabir', name: 'Kabir', tickets: 3 }).ok).toBe(true);
    expect(sum(Object.values(tierAmounts(g)))).toBe(300);
    expect(removePlayer(g, 'kabir').ok).toBe(true);
    expect(g.host.tiers).toEqual(before);
  });

  it('once a number has been called after he joined, he can no longer be removed', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    addPlayer(g, KABIR);
    const withKabir = g.host.tiers;
    g.call(1);
    const r = removePlayer(g, 'kabir');
    expect(r.ok).toBe(false);
    expect(g.host.players).toHaveLength(4);
    expect(g.host.tiers).toEqual(withKabir);
  });

  it('a removed late joiner can be added again, and the prizes are the same as the first time', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    addPlayer(g, KABIR);
    const first = g.host.tiers;
    removePlayer(g, 'kabir');
    expect(addPlayer(g, KABIR).ok).toBe(true);
    expect(g.host.tiers).toEqual(first);
  });
});

describe('TAM-093: a late joiner\'s ticket counts like every other ticket in money handed back', () => {
  it('only Full House won: the unwon money is split across all 4 tickets, extra rupees in the order players were listed', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    addPlayer(g, KABIR);
    const amounts = tierAmounts(g);
    const unwon = amounts['early-five']! + amounts['top-line']!;
    g.call(1);
    g.win('full-house', 'riya');
    g.finish();
    const s = g.summary;
    const order = ['riya', 'asha', 'dad', 'kabir'];
    const base = Math.floor(unwon / 4);
    const extra = unwon % 4;
    for (const [i, id] of order.entries()) {
      const p = s.payouts.find((x: any) => x.playerId === id);
      expect(p.handedBack, id).toBe(base + (i < extra ? 1 : 0));
    }
    expect(sum(s.payouts.map((p: any) => p.won + p.handedBack))).toBe(200);
  });

  it('a late joiner with 2 tickets gets twice the share of a player with 1', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    addPlayer(g, { id: 'kabir', name: 'Kabir', tickets: 2 });
    const amounts = tierAmounts(g);
    const unwon = amounts['early-five']! + amounts['top-line']!;
    g.call(1);
    g.win('full-house', 'riya');
    g.finish();
    const hb = Object.fromEntries(g.summary.payouts.map((p: any) => [p.playerId, p.handedBack]));
    expect(sum(Object.values(hb) as number[])).toBe(unwon);
    const perTicket = Math.floor(unwon / 5);
    expect(hb['kabir']).toBeGreaterThanOrEqual(2 * perTicket);
    expect(hb['kabir']).toBeLessThanOrEqual(2 * perTicket + 2);
  });
});

describe('TAM-067, TAM-184, TAM-093 and PLT-021: with late joiners, the money always adds up exactly', () => {
  it('for random games with late joiners, removals, ties and unwon tiers: prizes plus money handed back equal the pot', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 2, maxLength: 12 }),
        fc.integer({ min: 1, max: 300 }),
        // Late joiners: at how many calls they join (0 to 9), their tickets, and whether they are taken out again.
        fc.array(fc.tuple(fc.integer({ min: 1, max: 9 }), fc.integer({ min: 1, max: 3 }), fc.boolean()), { maxLength: 4 }),
        fc.array(fc.tuple(fc.integer({ min: 0, max: 5 }), fc.integer({ min: 1, max: 3 })), { maxLength: 5 }),
        fc.boolean(),
        (seed, ticketsEach, contribution, joins, wins, playToFullHouse) => {
          const players = ticketsEach.map((t, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}`, tickets: t }));
          let tickets = sum(ticketsEach);
          const plan = planPrizes({ tickets, contribution });
          const g = new Game({ seed, players, contribution, tiers: plan.tiers.map(({ pattern, amount }) => ({ pattern, amount })) });
          const everyone = [...players];
          const sorted = [...joins].sort((a, b) => a[0] - b[0]);
          for (const [k, [at, t, takeOut]] of sorted.entries()) {
            g.callUpTo(Math.max(0, at - g.called.length));
            if (g.host.awaitingClose.length) g.closeAll();
            const late = { id: `late${k}`, name: `Late ${k}`, tickets: t };
            // Always fewer than 10 numbers called here (no wins yet), so a late joiner must be accepted.
            expect(addPlayer(g, late).ok).toBe(true);
            expect(sum((g.host.tiers as any[]).map((x) => x.amount))).toBe((tickets + t) * contribution);
            if (takeOut) {
              expect(removePlayer(g, late.id).ok).toBe(true);
            } else {
              tickets += t;
              everyone.push(late);
            }
            expect(sum((g.host.tiers as any[]).map((x) => x.amount))).toBe(tickets * contribution);
          }
          const pot = tickets * contribution;
          const order = (g.host.tiers as any[]).map((t) => t.pattern).filter((p) => p !== 'full-house' && p !== 'second-full-house');
          for (const [idx, tie] of wins) {
            const pattern = order[idx % Math.max(order.length, 1)];
            if (!pattern || !g.host.openPatterns.includes(pattern)) continue;
            g.callUpTo(1);
            if (g.host.awaitingClose.length) g.closeAll();
            const ids = everyone.slice(-Math.min(tie, everyone.length)).map((p) => p.id);
            expect(g.win(pattern, ...ids).ok).toBe(true);
            g.close(pattern);
          }
          if (playToFullHouse) {
            g.callUpTo(1);
            if (g.host.awaitingClose.length) g.closeAll();
            g.win('full-house', everyone[everyone.length - 1]!.id);
          }
          g.finish();
          const s = g.summary;
          expect(s.pot).toBe(pot);
          expect(sum(s.tiers.map((t: any) => t.amount))).toBe(pot);
          for (const t of s.tiers) expect(t.amount).toBeGreaterThanOrEqual(0);
          expect(sum(s.payouts.map((p: any) => p.won + p.handedBack))).toBe(pot);
          expect(sum(s.payouts.map((p: any) => p.paid))).toBe(pot);
          expect(s.payouts.map((p: any) => p.playerId)).toEqual(everyone.map((p) => p.id));
          for (const p of s.payouts) {
            const who = everyone.find((e) => e.id === p.playerId)!;
            expect(p.paid).toBe(who.tickets * contribution);
            expect(p.net).toBe(p.won + p.handedBack - p.paid);
          }
          expect(moneyProblems(s.money)).toEqual([]);
          expect(g.replayed().state).toEqual(g.match.state);
          // The suggestion itself is untouched by late joiners: it is only for setup (TAM-081).
          expect(suggestTiers(sum(ticketsEach)).length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 300 },
    );
  });
});
