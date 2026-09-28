// Recording paper-ticket wins and bogeys, and the "Check numbers" helper: specs/tambola/03-claims.md,
// 04-house-rules.md, 08-prizes.md (TAM-086, TAM-087), 10-lifecycle.md (TAM-145).
// Change request of 28 September 2026: with paper tickets the anchor checks the ticket and the host only
// records the result (TAM-037); no numbers are typed. The app judging claims (TAM-034 to TAM-036, TAM-038)
// is Phase 2 (phone tickets); see "Waiting for Phase 2" in README.md. TAM-034 also holds for the helper.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { HOST } from '../../../src/engine';
import { checkNumbers, Game, mod, NEEDS, rules, uncalled, type Pattern } from './helpers';

const THREE = [
  { id: 'a', name: 'Asha' },
  { id: 'b', name: 'Bala' },
  { id: 'c', name: 'Chitra' },
];
const TIERS = [
  { pattern: 'early-five' as Pattern, amount: 20 },
  { pattern: 'top-line' as Pattern, amount: 50 },
  { pattern: 'full-house' as Pattern, amount: 80 },
];

describe('TAM-037: paper tickets: the anchor checks the ticket, the host records the win', () => {
  it('"Record a win" takes the prize and the player, no numbers, and is accepted', () => {
    const g = new Game().call(6);
    expect(g.win('top-line', 'p1').ok).toBe(true);
    const c = g.lastClaim;
    expect(c).toMatchObject({ playerId: 'p1', pattern: 'top-line', verdict: 'accepted' });
    expect(g.host.awaitingClose).toEqual(['top-line']);
  });

  it('the app does not check numbers: a win can be recorded after a single call, on the anchor\'s word', () => {
    const g = new Game().call(1);
    expect(g.win('full-house', 'p2').ok).toBe(true);
    expect(g.lastClaim.verdict).toBe('accepted');
  });

  it('several players can be picked for a tie in one step', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(6);
    expect(g.win('top-line', 'a', 'b').ok).toBe(true);
    const winners = g.host.claims.filter((c: any) => c.verdict === 'accepted').map((c: any) => c.playerId).sort();
    expect(winners).toEqual(['a', 'b']);
  });

  it('a bogey ruled by the anchor is recorded against the player and appears in the summary', () => {
    const g = new Game().call(6);
    expect(g.bogey('p1', 'top-line').ok).toBe(true);
    expect(g.lastClaim).toMatchObject({ playerId: 'p1', pattern: 'top-line', verdict: 'bogey' });
    expect(g.host.openPatterns).toContain('top-line');
    expect(g.host.awaitingClose).toEqual([]);
    g.do({ type: 'end' });
    expect(g.summary.bogeys).toContainEqual({ playerId: 'p1', pattern: 'top-line' });
  });

  it('wrong input is refused and nothing changes: no player, an unknown player, a player twice', () => {
    const g = new Game().call(6);
    const before = g.match;
    expect(g.win('top-line').ok).toBe(false);
    expect(g.win('top-line', 'nobody').ok).toBe(false);
    expect(g.win('top-line', 'p1', 'p1').ok).toBe(false);
    expect(g.bogey('nobody', 'top-line').ok).toBe(false);
    expect(g.match).toBe(before);
  });

  it('nothing can be recorded before the first number or after the game is over', () => {
    const g = new Game();
    expect(g.win('early-five', 'p1').ok).toBe(false);
    g.call(5).do({ type: 'end' });
    expect(g.win('early-five', 'p1').ok).toBe(false);
    expect(g.bogey('p1', 'early-five').ok).toBe(false);
  });

  it('recording is a detail move with no numbers in it (the old numbers-read-out claim is not needed)', () => {
    expect(rules.detailMoves).toEqual(expect.arrayContaining(['record-win', 'record-bogey']));
    const g = new Game().call(6);
    g.win('top-line', 'p1');
    const rec = g.lastRecordOf('record-win');
    expect((rec.move as any).numbers).toBeUndefined();
  });
});

describe('TAM-039: the host picks who is claiming; a recorded win credits that player', () => {
  it('the prize goes to the chosen player in the payout summary', () => {
    const tiers = [
      { pattern: 'early-five' as Pattern, amount: 30 },
      { pattern: 'top-line' as Pattern, amount: 60 },
      { pattern: 'full-house' as Pattern, amount: 210 },
    ];
    const g = new Game({ contribution: 50, tiers }).call(6);
    g.win('top-line', 'p4');
    g.finish();
    const top = g.summary.tiers.find((t: any) => t.pattern === 'top-line');
    expect(top.winners).toEqual([{ playerId: 'p4', amount: 60 }]);
    const kabir = g.summary.payouts.find((p: any) => p.playerId === 'p4');
    expect(kabir.won).toBe(60);
  });

  it('names left blank at setup (Player 1, Player 2 …) can be picked like any other', () => {
    const g = new Game({ players: [{ id: 'p1', name: 'Riya' }, { id: 'p2', name: 'Player 2' }] }).call(6);
    expect(g.win('early-five', 'p2').ok).toBe(true);
    expect(g.host.players.find((p: any) => p.id === 'p2').name).toBe('Player 2');
  });
});

describe('TAM-033: the result is announced to the room', () => {
  it('the room view carries the latest result: the player, the pattern, ✓ with the prize', () => {
    const g = new Game({ contribution: 50, tiers: [
      { pattern: 'early-five', amount: 30 }, { pattern: 'top-line', amount: 60 }, { pattern: 'full-house', amount: 210 },
    ] }).call(8);
    g.win('early-five', 'p3');
    const latest = g.room.claims[g.room.claims.length - 1];
    expect(latest).toMatchObject({ playerId: 'p3', pattern: 'early-five', verdict: 'accepted', prize: 30 });
  });

  it('a recorded bogey reaches the room as "✗ Bogey" for that player and pattern', () => {
    const g = new Game().call(8);
    g.bogey('p2', 'top-line');
    const latest = g.room.claims[g.room.claims.length - 1];
    expect(latest).toMatchObject({ playerId: 'p2', pattern: 'top-line', verdict: 'bogey' });
  });
});

describe('TAM-086: a win shows the prize', () => {
  it('a Top Line win for Riya carries its ₹60 prize', () => {
    const tiers = [
      { pattern: 'early-five' as Pattern, amount: 30 },
      { pattern: 'top-line' as Pattern, amount: 60 },
      { pattern: 'full-house' as Pattern, amount: 210 },
    ];
    const g = new Game({ contribution: 50, tiers }).call(6);
    g.win('top-line', 'p1');
    expect(g.lastClaim).toMatchObject({ playerId: 'p1', verdict: 'accepted', prize: 60 });
  });

  it('with "No money" there is no amount, and the label is kept for the room', () => {
    const tiers = [
      { pattern: 'top-line' as Pattern, amount: 0, label: 'Ice cream' },
      { pattern: 'full-house' as Pattern, amount: 0, label: 'The big cake' },
    ];
    const g = new Game({ contribution: null, tiers }).call(6);
    g.win('top-line', 'p1');
    expect(g.lastClaim.verdict).toBe('accepted');
    expect(g.lastClaim.prize ?? 0).toBe(0);
    expect(g.room.tiers.find((t: any) => t.pattern === 'top-line').label).toBe('Ice cream');
  });
});

describe('TAM-030: a pattern already won cannot be won again', () => {
  it('once Top Line is closed, another Top Line win is refused with "already won" and is not a bogey', () => {
    const g = new Game().call(10);
    g.win('top-line', 'p1');
    g.close('top-line').call();
    const r = g.win('top-line', 'p2');
    expect(r.ok).toBe(false);
    expect(r.reason?.toLowerCase()).toContain('already won');
    expect(g.host.claims).toHaveLength(1);
    expect(g.host.openPatterns).not.toContain('top-line');
  });
});

describe('TAM-031: a pattern not in this game cannot be chosen', () => {
  it('Four Corners is not open and a win for it is refused', () => {
    const g = new Game().call(10);
    expect(g.host.openPatterns).not.toContain('four-corners');
    expect(g.win('four-corners', 'p1').ok).toBe(false);
    expect(g.bogey('p1', 'four-corners').ok).toBe(false);
  });

  it('the open patterns are exactly the tiers in play', () => {
    const g = new Game();
    expect([...g.host.openPatterns].sort()).toEqual(['bottom-line', 'early-five', 'full-house', 'middle-line', 'top-line']);
  });
});

describe('TAM-041, TAM-042 and TAM-087: ties on the same number share the prize', () => {
  it('two winners of a ₹50 Top Line, before the tier is closed, get ₹25 each', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(10);
    expect(g.win('top-line', 'a').ok).toBe(true);
    expect(g.win('top-line', 'b').ok).toBe(true);
    expect(g.host.claims.map((c: any) => c.prize)).toEqual([25, 25]);
  });

  it('three winners of ₹50 get ₹17, ₹17 and ₹16, the extra rupee in player order', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(10);
    g.win('top-line', 'c');
    g.win('top-line', 'a', 'b');
    const byPlayer = Object.fromEntries(g.host.claims.map((c: any) => [c.playerId, c.prize]));
    expect(byPlayer).toEqual({ a: 17, b: 17, c: 16 });
  });

  it('the same player cannot win the same tier twice', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(10);
    g.win('top-line', 'a');
    expect(g.win('top-line', 'a').ok).toBe(false);
  });

  it('after the host closed the tier, it is not a tie: refused as already won', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(10);
    g.win('top-line', 'a');
    g.close('top-line');
    expect(g.win('top-line', 'b').ok).toBe(false);
  });
});

describe('TAM-043 and TAM-044 with paper tickets: the anchor rules, the host records a bogey', () => {
  it('a late claim ruled a bogey by the anchor is recorded; the tier stays open for others', () => {
    const g = new Game().call(10);
    g.bogey('p2', 'top-line');
    expect(g.host.openPatterns).toContain('top-line');
    expect(g.win('top-line', 'p1').ok).toBe(true);
  });

  it('the app does not block that player later: the room keeps the ticket out, and they may hold another', () => {
    const g = new Game({ players: [{ id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha' }] }).call(10);
    g.bogey('p1', 'top-line');
    expect(g.win('early-five', 'p1').ok).toBe(true);
    expect(g.lastClaim.verdict).toBe('accepted');
  });

  it('with "carry on", a bogey changes nothing but the record', () => {
    const g = new Game({ settings: { bogey: 'carry-on' } }).call(10);
    g.bogey('p2', 'top-line');
    expect(g.host.openPatterns).toContain('top-line');
    expect(g.win('top-line', 'p2').ok).toBe(true);
  });
});

describe('TAM-145: closing a tier is a manual step', () => {
  it('a recorded win leaves the tier open and waiting; the next number waits until it is closed', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(10);
    g.win('top-line', 'a');
    expect(g.host.openPatterns).toContain('top-line');
    expect(g.host.awaitingClose).toEqual(['top-line']);
    expect(g.try({ type: 'call' }).ok).toBe(false);
    const legal = rules.legalMoves(g.match.state, HOST);
    expect(legal).toContainEqual({ type: 'close-tier', pattern: 'top-line' });
    expect(legal).not.toContainEqual({ type: 'call' });
    g.close('top-line');
    expect(g.host.awaitingClose).toEqual([]);
    expect(g.host.openPatterns).not.toContain('top-line');
    expect(g.try({ type: 'call' }).ok).toBe(true);
  });

  it('the host can add another winner before closing; the prize is shared', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(10);
    g.win('top-line', 'a');
    expect(g.win('top-line', 'b').ok).toBe(true);
    expect(g.host.claims.map((c: any) => c.prize)).toEqual([25, 25]);
    g.close('top-line');
    expect(g.win('top-line', 'c').ok).toBe(false);
  });

  it('works the same for Full House: recording it never ends the game; the host adds winners, closes, then ends', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(30);
    g.win('full-house', 'a');
    expect(g.over).toBe(false);
    expect(g.win('full-house', 'c').ok).toBe(true);
    g.close('full-house');
    expect(g.over).toBe(false);
    expect(g.host.readyToEnd).toBe(true);
    expect(g.try({ type: 'call' }).ok).toBe(false);
    expect(rules.legalMoves(g.match.state, HOST).map((m: any) => m.type).sort()).toEqual(['discard', 'end']);
    g.do({ type: 'end' });
    expect(g.over).toBe(true);
    const fh = g.summary.tiers.find((t: any) => t.pattern === 'full-house');
    expect(fh.winners.map((w: any) => w.playerId).sort()).toEqual(['a', 'c']);
  });

  it('closing a tier nobody won changes nothing', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(5);
    const before = g.host;
    expect(g.try({ type: 'close-tier', pattern: 'top-line' }).ok).toBe(true);
    expect(g.host).toEqual(before);
  });

  it('TAM-070: undoing a wrong win after its tier was closed reopens the tier; later calls stay', () => {
    const g = new Game({ players: THREE, tiers: TIERS }).call(10);
    g.win('top-line', 'a');
    const rec = g.lastRecordOf('record-win');
    g.close('top-line').call(3);
    const called = g.called;
    expect(g.undo(rec.seq, g.clock + 1).ok).toBe(true);
    expect(g.host.openPatterns).toContain('top-line');
    expect(g.host.claims).toEqual([]);
    expect(g.called).toEqual(called);
  });
});

describe('TAM-139: "Check numbers", an optional helper for disputes that records nothing', () => {
  it('is available from the game module', () => {
    expect(typeof mod.checkNumbers, 'checkNumbers is not exported yet').toBe('function');
  });

  it('shows each typed number as called or not, and says whether they complete the pattern on called numbers', () => {
    const g = new Game().call(12);
    const called = g.called;
    const five = called.slice(-5);
    const ok = checkNumbers(called, 'top-line', five);
    expect(ok.ok).toBe(true);
    expect(ok.checks).toEqual(five.map((number) => ({ number, called: true })));
    expect(ok.complete).toBe(true);

    const missing = uncalled(g)[0]!;
    const bad = checkNumbers(called, 'top-line', [...five.slice(1), missing]);
    expect(bad.ok).toBe(true);
    expect(bad.complete).toBe(false);
    expect(bad.checks.find((c: any) => c.number === missing)).toEqual({ number: missing, called: false });
    expect(bad.checks.filter((c: any) => c.called)).toHaveLength(4);
  });

  it('records nothing: the game is exactly the same after using it', () => {
    const g = new Game().call(12);
    const before = JSON.stringify(g.match);
    checkNumbers(g.called, 'top-line', g.called.slice(-5));
    expect(JSON.stringify(g.match)).toBe(before);
    expect(g.host.claims).toEqual([]);
    expect(g.host.openPatterns).toContain('top-line');
  });

  it('wrong input: a number outside 1 to 90, or typed twice, is refused with a one-line reason', () => {
    const called = new Game().call(12).called;
    const four = called.slice(-4);
    for (const nums of [[...four, 91], [...four, 0], [...four, four[0]!]]) {
      const r = checkNumbers(called, 'top-line', nums);
      expect(r.ok).toBe(false);
      expect(typeof r.reason).toBe('string');
      expect(r.reason.length).toBeGreaterThan(0);
      expect(r.reason).not.toContain('\n');
    }
  });

  it.each([
    ['top-line', 'Top Line needs 5 numbers'],
    ['early-five', 'Early Five needs 5 numbers'],
    ['four-corners', 'Four Corners needs 4 numbers'],
    ['full-house', 'Full House needs 15 numbers'],
  ] as [Pattern, string][])('too few numbers for %s: "%s"', (pattern, message) => {
    const called = new Game().call(20).called;
    const r = checkNumbers(called, pattern, called.slice(0, NEEDS[pattern] - 1));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe(message);
  });
});

describe('TAM-034 (for the "Check numbers" helper): for every call history and every set of numbers, the check is right', () => {
  it('complete if, and only if, every typed number has been called', () => {
    const patterns: Pattern[] = ['early-five', 'top-line', 'middle-line', 'bottom-line', 'four-corners', 'full-house'];
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 12 }),
        fc.integer({ min: 1, max: 90 }),
        fc.constantFrom(...patterns),
        fc.uniqueArray(fc.integer({ min: 1, max: 90 }), { minLength: 15, maxLength: 15 }),
        (seed, calls, pattern, pool) => {
          const called = new Game({ seed }).call(calls).called;
          const nums = pool.slice(0, NEEDS[pattern]);
          const r = checkNumbers(called, pattern, nums);
          expect(r.ok).toBe(true);
          expect(r.checks.map((c: any) => c.called)).toEqual(nums.map((n) => called.includes(n)));
          expect(r.complete).toBe(nums.every((n) => called.includes(n)));
        },
      ),
      { numRuns: 2_000 },
    );
  });
});
