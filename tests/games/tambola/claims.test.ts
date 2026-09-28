// Checking paper-ticket claims: specs/tambola/03-claims.md, 04-house-rules.md, 08-prizes.md (TAM-086, TAM-087).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { HOST } from '../../../src/engine';
import { Game, NEEDS, rules, uncalled, type Pattern } from './helpers';

const THREE = [
  { id: 'a', name: 'Asha' },
  { id: 'b', name: 'Bala' },
  { id: 'c', name: 'Chitra' },
];

describe('TAM-037: paper tickets, checked from the numbers read out', () => {
  it('accepts when all five read-out numbers were called, showing each as called', () => {
    const g = new Game().call(12);
    const nums = g.onTimeNumbers('top-line');
    expect(g.claim('p1', 'top-line', nums).ok).toBe(true);
    const c = g.lastClaim;
    expect(c.verdict).toBe('accepted');
    expect(c.checks).toEqual(nums.map((number) => ({ number, called: true })));
  });

  it('is a bogey when one read-out number was not called, and shows which one', () => {
    const g = new Game().call(12);
    const missing = uncalled(g)[0]!;
    const nums = [...g.onTimeNumbers('top-line').slice(1), missing];
    expect(g.claim('p1', 'top-line', nums).ok).toBe(true);
    const c = g.lastClaim;
    expect(c.verdict).toBe('bogey');
    expect(c.reason).toBe('not-called');
    expect(c.checks.find((x: any) => x.number === missing)).toEqual({ number: missing, called: false });
    expect(c.checks.filter((x: any) => x.called)).toHaveLength(4);
  });

  it.each(Object.entries(NEEDS) as [Pattern, number][])('%s needs exactly %i numbers read out', (pattern, need) => {
    // Six tickets at ₹50: a ₹300 pot.
    const players = [{ id: 'p1', name: 'Riya', tickets: 3 }, { id: 'p2', name: 'Asha', tickets: 3 }];
    const tiers: { pattern: Pattern; amount: number }[] =
      pattern === 'full-house'
        ? [{ pattern, amount: 300 }]
        : pattern === 'second-full-house'
          ? [{ pattern: 'full-house', amount: 200 }, { pattern, amount: 100 }]
          : [{ pattern, amount: 100 }, { pattern: 'full-house', amount: 200 }];
    const g = new Game({ players, contribution: 50, tiers });
    g.call(20);
    const called = g.called;
    const tooFew = g.claim('p1', pattern, called.slice(-(need - 1)));
    expect(tooFew.ok).toBe(false);
    const tooMany = g.claim('p1', pattern, called.slice(-(need + 1)));
    expect(tooMany.ok).toBe(false);
    expect(g.host.claims).toHaveLength(0);
  });

  it('refuses numbers outside 1 to 90, repeated numbers, and an unknown player; nothing changes', () => {
    const g = new Game().call(12);
    const good = g.onTimeNumbers('top-line');
    const before = g.match;
    expect(g.claim('p1', 'top-line', [...good.slice(1), 91]).ok).toBe(false);
    expect(g.claim('p1', 'top-line', [...good.slice(1), 0]).ok).toBe(false);
    expect(g.claim('p1', 'top-line', [...good.slice(1), good[1]!]).ok).toBe(false);
    expect(g.claim('nobody', 'top-line', good).ok).toBe(false);
    expect(g.match).toBe(before);
  });
});


describe('TAM-035: a number the player forgot to mark still counts', () => {
  it('only called numbers matter; the host state has no marks to consult', () => {
    const g = new Game().call(15);
    expect(g.claim('p4', 'early-five', g.onTimeNumbers('early-five')).ok).toBe(true);
    expect(g.lastClaim.verdict).toBe('accepted');
    expect(JSON.stringify(g.match.state)).not.toMatch(/"marks?"/i);
  });
});

describe('TAM-036: a claim is judged on the numbers called at the moment it is made', () => {
  it('is a bogey if a needed number is called straight afterwards', () => {
    const g = new Game().call(10);
    const next = new Game().call(11).called[10]!; // the same seed: the number that comes next
    const nums = [...g.onTimeNumbers('top-line').slice(1), next];
    g.claim('p1', 'top-line', nums);
    expect(g.lastClaim.verdict).toBe('bogey');
    g.call();
    expect(g.called).toContain(next);
    expect(g.host.claims[0].verdict).toBe('bogey');
    expect(g.replayed().state).toEqual(g.match.state);
  });
});

describe('TAM-038 and TAM-043: a late claim is a bogey that shows when the pattern was complete', () => {
  it('Top Line complete at one number, claimed after the next number: bogey, "late", completed at that number', () => {
    const g = new Game().call(10);
    const nums = g.onTimeNumbers('top-line');
    const completedAt = g.called[9]!;
    g.call();
    expect(g.claim('p1', 'top-line', nums).ok).toBe(true);
    const c = g.lastClaim;
    expect(c.verdict).toBe('bogey');
    expect(c.reason).toBe('late');
    expect(c.completedAt).toBe(completedAt);
    expect(g.host.openPatterns).toContain('top-line');
  });

  it('with paper tickets, lateness comes from the numbers read out: the latest of them must be the latest call', () => {
    const g = new Game().call(20);
    const called = g.called;
    // Five called numbers, none of which is the latest call.
    const nums = called.slice(10, 15);
    g.claim('p2', 'early-five', nums);
    expect(g.lastClaim.verdict).toBe('bogey');
    expect(g.lastClaim.reason).toBe('late');
    expect(g.lastClaim.completedAt).toBe(called[14]);
  });
});

describe('TAM-030: a pattern already won cannot be won again', () => {
  it('once Top Line is closed, a second Top Line is refused with "already won" and is not a bogey', () => {
    const g = new Game().call(10);
    g.claim('p1', 'top-line', g.onTimeNumbers('top-line'));
    g.close('top-line').call();
    const r = g.claim('p2', 'top-line', g.onTimeNumbers('top-line'));
    expect(r.ok).toBe(false);
    expect(r.reason?.toLowerCase()).toContain('already won');
    expect(g.host.claims).toHaveLength(1);
    expect(g.host.openPatterns).not.toContain('top-line');
  });
});

describe('TAM-031: a pattern not in this game cannot be chosen', () => {
  it('Four Corners is not open and a claim for it is refused', () => {
    const g = new Game().call(10);
    expect(g.host.openPatterns).not.toContain('four-corners');
    expect(g.claim('p1', 'four-corners', g.called.slice(-4)).ok).toBe(false);
  });

  it('the open patterns are exactly the tiers in play', () => {
    const g = new Game();
    expect([...g.host.openPatterns].sort()).toEqual(['bottom-line', 'early-five', 'full-house', 'middle-line', 'top-line']);
  });
});

describe('TAM-033: the result is announced to the room', () => {
  it('the room view carries the latest verdict with the player, the pattern and the checked numbers', () => {
    const g = new Game().call(8);
    g.claim('p3', 'early-five', g.onTimeNumbers('early-five'));
    const latest = g.room.claims[g.room.claims.length - 1];
    expect(latest).toMatchObject({ playerId: 'p3', pattern: 'early-five', verdict: 'accepted' });
    expect(latest.checks).toHaveLength(5);
  });
});

describe('TAM-039 and TAM-086: the host picks who is claiming; the prize is credited to them', () => {
  it('an accepted Top Line credits its amount to the chosen player', () => {
    const tiers = [
      { pattern: 'early-five' as Pattern, amount: 30 },
      { pattern: 'top-line' as Pattern, amount: 60 },
      { pattern: 'full-house' as Pattern, amount: 210 },
    ];
    const g = new Game({ contribution: 50, tiers }).call(10);
    g.claim('p1', 'top-line', g.onTimeNumbers('top-line'));
    expect(g.lastClaim).toMatchObject({ playerId: 'p1', verdict: 'accepted', prize: 60 });
  });
});

describe('TAM-041 and TAM-042: ties on the same number share the prize', () => {
  const tiers = [
    { pattern: 'early-five' as Pattern, amount: 20 },
    { pattern: 'top-line' as Pattern, amount: 50 },
    { pattern: 'full-house' as Pattern, amount: 80 },
  ];

  it('two players completing Top Line on the same number, both before the next number, share it', () => {
    const g = new Game({ players: THREE, tiers }).call(10);
    const nums = g.onTimeNumbers('top-line');
    const other = [...g.called.slice(-6, -2), g.called[9]!]; // a different set, also ending on the latest call
    expect(g.claim('a', 'top-line', nums).ok).toBe(true);
    expect(g.claim('b', 'top-line', other).ok).toBe(true);
    const [c1, c2] = g.host.claims;
    expect(c1.verdict).toBe('accepted');
    expect(c2.verdict).toBe('accepted');
    expect(c1.prize + c2.prize).toBe(50);
    expect([c1.prize, c2.prize]).toEqual([25, 25]);
  });

  it('TAM-087: three winners of ₹50 get ₹17, ₹17 and ₹16, the extra rupee in player order', () => {
    const g = new Game({ players: THREE, tiers }).call(10);
    const nums = g.onTimeNumbers('top-line');
    g.claim('c', 'top-line', nums);
    g.claim('a', 'top-line', nums);
    g.claim('b', 'top-line', nums);
    const byPlayer = Object.fromEntries(g.host.claims.map((c: any) => [c.playerId, c.prize]));
    expect(byPlayer).toEqual({ a: 17, b: 17, c: 16 });
  });

  it('a second claim after the host closed the tier is not a tie: refused as already won', () => {
    const g = new Game({ players: THREE, tiers }).call(10);
    g.claim('a', 'top-line', g.onTimeNumbers('top-line'));
    const nums = g.onTimeNumbers('top-line');
    g.close('top-line');
    expect(g.claim('b', 'top-line', nums).ok).toBe(false);
    g.call();
    expect(g.claim('b', 'top-line', g.onTimeNumbers('top-line')).ok).toBe(false);
  });
});

describe('TAM-044: after a bogey (paper tickets)', () => {
  it('the bogey is recorded against the player and shown in the summary', () => {
    const g = new Game().call(10);
    g.claim('p2', 'top-line', [...g.called.slice(-4), uncalled(g)[0]!]);
    g.do({ type: 'end' });
    expect(g.summary.bogeys).toContainEqual({ playerId: 'p2', pattern: 'top-line' });
  });

  it('the app does not block that player later: the room keeps the ticket out, and they may hold another', () => {
    const g = new Game({ players: [{ id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha' }] }).call(10);
    g.claim('p1', 'top-line', [...g.called.slice(-4), uncalled(g)[0]!]);
    g.call();
    expect(g.claim('p1', 'early-five', g.onTimeNumbers('early-five')).ok).toBe(true);
    expect(g.lastClaim.verdict).toBe('accepted');
  });

  it('with "carry on", a bogey changes nothing but the record', () => {
    const g = new Game({ settings: { bogey: 'carry-on' } }).call(10);
    g.claim('p2', 'top-line', [...g.called.slice(-4), uncalled(g)[0]!]);
    expect(g.host.openPatterns).toContain('top-line');
    expect(g.claim('p2', 'top-line', g.onTimeNumbers('top-line')).ok).toBe(true);
    expect(g.lastClaim.verdict).toBe('accepted');
  });
});

describe('TAM-034: for every call history and every read-out, the check is right', () => {
  it('accepted if, and only if, all numbers were called and the latest of them is the latest call', () => {
    const patterns: Pattern[] = ['early-five', 'top-line', 'middle-line', 'bottom-line', 'full-house'];
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 12 }),
        fc.integer({ min: 1, max: 90 }),
        fc.constantFrom(...patterns),
        fc.array(fc.integer({ min: 0, max: 1_000_000 }), { minLength: 15, maxLength: 15 }),
        fc.integer({ min: 0, max: 3 }),
        (seed, calls, pattern, picks, mode) => {
          const g = new Game({ seed }).call(calls);
          const called = g.called;
          const need = NEEDS[pattern];
          // Build a read-out: mode 0 on time, 1 late, 2 one uncalled number, 3 anything.
          const pool =
            mode === 3 ? Array.from({ length: 90 }, (_, i) => i + 1) : mode === 1 ? called.slice(0, -1) : called;
          if (pool.length < need) return;
          const chosen = new Set<number>(mode === 0 ? [called[called.length - 1]!] : []);
          for (const p of picks) {
            if (chosen.size >= need) break;
            chosen.add(pool[p % pool.length]!);
          }
          for (let i = 0; chosen.size < need; i++) chosen.add(pool[i]!);
          let nums = [...chosen];
          if (mode === 2) {
            const out = uncalled(g);
            if (out.length === 0) return;
            nums = [...nums.slice(1), out[picks[0]! % out.length]!];
          }
          const allCalled = nums.every((n) => called.includes(n));
          const latestIdx = Math.max(...nums.map((n) => called.indexOf(n)));
          const expectAccepted = allCalled && latestIdx === called.length - 1;

          expect(g.claim('p1', pattern, nums).ok).toBe(true);
          const c = g.lastClaim;
          expect(c.verdict).toBe(expectAccepted ? 'accepted' : 'bogey');
          if (!expectAccepted) expect(c.reason).toBe(allCalled ? 'late' : 'not-called');
          expect(c.checks.map((x: any) => x.called)).toEqual(nums.map((n) => called.includes(n)));
        },
      ),
      { numRuns: 2_000 },
    );
  });
});

describe('TAM-145: closing a tier is a manual step', () => {
  const tiers = [
    { pattern: 'early-five' as Pattern, amount: 20 },
    { pattern: 'top-line' as Pattern, amount: 50 },
    { pattern: 'full-house' as Pattern, amount: 80 },
  ];

  it('an accepted claim leaves the tier open and waiting; the next number waits until it is closed', () => {
    const g = new Game({ players: THREE, tiers }).call(10);
    g.claim('a', 'top-line', g.onTimeNumbers('top-line'));
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
    const g = new Game({ players: THREE, tiers }).call(10);
    g.claim('a', 'top-line', g.onTimeNumbers('top-line'));
    expect(g.claim('b', 'top-line', g.onTimeNumbers('top-line')).ok).toBe(true);
    expect(g.host.claims.map((c: any) => c.prize)).toEqual([25, 25]);
    g.close('top-line');
    expect(g.claim('c', 'top-line', g.onTimeNumbers('top-line')).ok).toBe(false);
  });

  it('a late claim is still a bogey while the tier is open', () => {
    const g = new Game({ players: THREE, tiers }).call(10);
    const early = g.called.slice(4, 9); // completed on an earlier number
    g.claim('a', 'top-line', g.onTimeNumbers('top-line'));
    g.claim('b', 'top-line', early);
    expect(g.lastClaim).toMatchObject({ verdict: 'bogey', reason: 'late' });
  });

  it('works the same for Full House: accepting it never ends the game; the host adds winners, closes, then ends', () => {
    const g = new Game({ players: THREE, tiers }).call(30);
    g.claim('a', 'full-house', g.onTimeNumbers('full-house'));
    expect(g.over).toBe(false);
    expect(g.claim('c', 'full-house', g.onTimeNumbers('full-house')).ok).toBe(true);
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
    const g = new Game({ players: THREE, tiers }).call(5);
    const before = g.host;
    expect(g.try({ type: 'close-tier', pattern: 'top-line' }).ok).toBe(true);
    expect(g.host).toEqual(before);
  });

  it('TAM-070: undoing a wrong claim after its tier was closed reopens the tier; later calls stay', () => {
    const g = new Game({ players: THREE, tiers }).call(10);
    g.claim('a', 'top-line', g.onTimeNumbers('top-line'));
    const rec = g.lastRecordOf('claim');
    g.close('top-line').call(3);
    const called = g.called;
    expect(g.undo(rec.seq, g.clock + 1).ok).toBe(true);
    expect(g.host.openPatterns).toContain('top-line');
    expect(g.called).toEqual(called);
  });
});
