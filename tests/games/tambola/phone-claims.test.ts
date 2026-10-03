// Phase 2: the host phone checks phone-ticket claims (specs/tambola/03-claims.md, 04-house-rules.md,
// 05-secrets-and-seeds.md). Scenarios: TAM-020 to TAM-029, TAM-030, TAM-032, TAM-034, TAM-035, TAM-036,
// TAM-038, TAM-041, TAM-044, TAM-056, TAM-058, TAM-172, TAM-174 to TAM-176, TAM-178, TAM-190.
// These bring back the "Waiting for Phase 2" checks (README.md) as phone-ticket tests.
// A claim is the host's move { type: 'check-claim', ticket, pattern }, made after scanning the claim QR or
// typing the ticket number. The tests work out the right verdict from the host's own view (tickets, calls).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { rules, T0, type Pattern } from './helpers';
import {
  calledOn, corners, expected, makeTickets, nums, patternSet, PhoneGame, phoneTiers, row, type Rows,
} from './phone';

const CARRY_ON = { bogey: 'carry-on' };
const lastClaim = (g: PhoneGame) => g.lastClaim;

/** Calls until the pattern is complete on called numbers for this ticket (Early Five: 5 called). */
function callUntilComplete(g: PhoneGame, ticket: number, pattern: Pattern) {
  const rows = g.ticket(ticket).rows;
  return g.callWhile(() => expected(rows, pattern, g.called).reason === 'not-called');
}

it('Phase 2 exports are present: check-claim is a detail move of the rules', () => {
  expect(rules.detailMoves, 'check-claim is not a detail move yet').toEqual(expect.arrayContaining(['check-claim', 'assign', 'to-paper']));
});

describe('TAM-020 and TAM-021: Early Five', () => {
  it('TAM-020: accepted when 5 of the ticket\'s numbers have been called', () => {
    const g = new PhoneGame();
    expect(callUntilComplete(g, 3, 'early-five')).toBe(true);
    expect(g.claim(3, 'early-five').ok).toBe(true);
    expect(lastClaim(g)).toMatchObject({ ticket: 3, pattern: 'early-five', verdict: 'accepted', playerId: 'p3' });
  });

  it('TAM-021: a bogey with only 4 called; the host sees how many more are needed', () => {
    const g = new PhoneGame();
    const rows = g.ticket(3).rows;
    g.callWhile(() => calledOn(rows, g.called) < 4);
    expect(g.claim(3, 'early-five').ok).toBe(true);
    expect(lastClaim(g)).toMatchObject({ ticket: 3, pattern: 'early-five', verdict: 'bogey', reason: 'not-called', needed: 1 });
  });
});

describe('TAM-022 to TAM-025: lines', () => {
  const lines: [Pattern, number][] = [['top-line', 0], ['middle-line', 1], ['bottom-line', 2]];
  for (const [pattern, r] of lines) {
    it(`TAM-022 and TAM-024: ${pattern} is accepted when all 5 numbers of row ${r + 1} are called`, () => {
      const g = new PhoneGame({ seed: `line-${r}` });
      expect(callUntilComplete(g, 1, pattern)).toBe(true);
      g.claim(1, pattern);
      expect(lastClaim(g)).toMatchObject({ ticket: 1, pattern, verdict: 'accepted' });
    });

    it(`TAM-023 and TAM-024: ${pattern} is a bogey with 4 of 5 called; the host sees the missing number`, () => {
      const g = new PhoneGame({ seed: `line-miss-${r}` });
      const line = row(g.ticket(1).rows, r);
      g.callWhile(() => line.filter((n) => g.called.includes(n)).length < 4);
      const missing = line.filter((n) => !g.called.includes(n));
      expect(missing).toHaveLength(1);
      g.claim(1, pattern);
      expect(lastClaim(g)).toMatchObject({ verdict: 'bogey', reason: 'not-called', missing });
    });
  }

  it('TAM-025: a full bottom row does not win Top Line', () => {
    for (let s = 0; s < 40; s++) {
      const g = new PhoneGame({ seed: `rows-${s}` });
      const rows = g.ticket(2).rows;
      g.callWhile(() => !row(rows, 2).every((n) => g.called.includes(n)));
      if (row(rows, 0).every((n) => g.called.includes(n))) continue; // top row also full: try another game
      g.claim(2, 'top-line');
      expect(lastClaim(g)).toMatchObject({ verdict: 'bogey', reason: 'not-called' });
      return;
    }
    expect.fail('no game found where the bottom row filled before the top row');
  });
});

describe('TAM-026 and TAM-027: Four Corners are the first and last numbers of the top and bottom rows', () => {
  it('TAM-026: accepted when those four are called, whatever else is missing', () => {
    const g = new PhoneGame({ seed: 'corners' });
    const rows = g.ticket(4).rows;
    const four = corners(rows);
    g.callWhile(() => !four.every((n) => g.called.includes(n)));
    g.claim(4, 'four-corners');
    expect(lastClaim(g)).toMatchObject({ verdict: 'accepted' });
  });

  it('TAM-026: the grid\'s corner squares do not count when they are blank; the outermost numbers do', () => {
    // Find a ticket whose top-left square is blank: its corner is the first number in the row, not the square.
    for (let s = 0; s < 40; s++) {
      const t = makeTickets(`blank-corner-${s}`, 6).find((x) => x.rows[0]![0] === null);
      if (!t) continue;
      expect(corners(t.rows)[0]).toBe(row(t.rows, 0)[0]);
      const g = new PhoneGame({ sheetSeed: `blank-corner-${s}` });
      const four = corners(g.ticket(t.number).rows);
      g.callWhile(() => !four.every((n) => g.called.includes(n)));
      g.claim(t.number, 'four-corners');
      expect(lastClaim(g).verdict).toBe('accepted');
      return;
    }
    expect.fail('no ticket with a blank top-left square in 40 sheets');
  });

  it('TAM-027: a bogey with 3 of the 4 corners', () => {
    const g = new PhoneGame({ seed: 'corners-3' });
    const four = corners(g.ticket(4).rows);
    g.callWhile(() => four.filter((n) => g.called.includes(n)).length < 3);
    g.claim(4, 'four-corners');
    expect(lastClaim(g)).toMatchObject({ verdict: 'bogey', reason: 'not-called', missing: four.filter((n) => !g.called.includes(n)) });
  });
});

describe('TAM-028 and TAM-029: Full House', () => {
  it('TAM-029: 14 of 15 is a bogey; TAM-028: all 15 is accepted', () => {
    const g = new PhoneGame({ seed: 'full', settings: CARRY_ON });
    const rows = g.ticket(5).rows;
    g.callWhile(() => calledOn(rows, g.called) < 14);
    g.claim(5, 'full-house');
    expect(lastClaim(g)).toMatchObject({ verdict: 'bogey', reason: 'not-called' });
    expect(lastClaim(g).missing).toHaveLength(1);
    g.callWhile(() => calledOn(rows, g.called) < 15);
    g.claim(5, 'full-house');
    expect(lastClaim(g)).toMatchObject({ ticket: 5, pattern: 'full-house', verdict: 'accepted' });
  });
});

describe('TAM-034: for every ticket and call history, the check is right (property)', () => {
  const patterns: Pattern[] = ['early-five', 'top-line', 'middle-line', 'bottom-line', 'four-corners', 'full-house'];
  it('accepted if, and only if, complete on called numbers by the latest call; late or not called otherwise', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 12 }), fc.string({ minLength: 1, maxLength: 12 }),
        fc.integer({ min: 1, max: 90 }), fc.integer({ min: 1, max: 6 }), fc.constantFrom(...patterns),
        (draw, sheet, calls, ticket, pattern) => {
          const g = new PhoneGame({ seed: `p-${draw}`, sheetSeed: `s-${sheet}` }).call(calls);
          const rows = g.ticket(ticket).rows;
          const want = expected(rows, pattern, g.called);
          const got = g.peek(ticket, pattern);
          expect(got.ok).toBe(true);
          expect(got.claim).toMatchObject({ ticket, pattern, ...want });
        },
      ),
      { numRuns: 400 },
    );
  });
});

describe('TAM-035: a number the player forgot to mark still counts', () => {
  it('only called numbers matter: the claim carries no marks, and the host state holds none', () => {
    const g = new PhoneGame({ seed: 'unmarked' });
    callUntilComplete(g, 4, 'early-five');
    g.claim(4, 'early-five');
    expect(lastClaim(g).verdict).toBe('accepted');
    expect(JSON.stringify(g.host)).not.toMatch(/"marks?"/);
    // Anything the phone might add about marks is ignored: the verdict comes from the calls only.
    const h = new PhoneGame({ seed: 'unmarked' });
    callUntilComplete(h, 4, 'early-five');
    h.do({ type: 'check-claim', ticket: 4, pattern: 'early-five', marks: [] } as any);
    expect(lastClaim(h).verdict).toBe('accepted');
  });
});

describe('TAM-036: a claim is judged on the numbers called at the moment it is made', () => {
  it('a bogey stays a bogey after the missing number is called, and replays the same', () => {
    const g = new PhoneGame({ seed: 'moment', settings: CARRY_ON });
    const line = row(g.ticket(6).rows, 0);
    g.callWhile(() => line.filter((n) => g.called.includes(n)).length < 4);
    const missing = line.find((n) => !g.called.includes(n))!;
    g.claim(6, 'top-line');
    expect(lastClaim(g)).toMatchObject({ verdict: 'bogey', missing: [missing] });
    g.callWhile(() => !g.called.includes(missing));
    const claims = g.host.claims.filter((c: any) => c.ticket === 6);
    expect(claims).toHaveLength(1);
    expect(claims[0].verdict).toBe('bogey');
    expect(PhoneGame.of(g.replayed()).host.claims).toEqual(g.host.claims);
  });

  it('TAM-178: waiting for the camera never makes a claim late by itself: the verdict is the one at the moment it is entered', () => {
    const g = new PhoneGame({ seed: 'camera-wait' });
    callUntilComplete(g, 2, 'early-five');
    // 30 seconds later, with no new number called, the claim is still on time.
    g.do({ type: 'check-claim', ticket: 2, pattern: 'early-five' }, g.clock + 30_000);
    expect(lastClaim(g).verdict).toBe('accepted');
  });
});

describe('TAM-038 and TAM-043: a late claim shows which number completed the pattern', () => {
  it('complete at one number, claimed after the next: a late bogey with completedAt', () => {
    const g = new PhoneGame({ seed: 'late' });
    callUntilComplete(g, 1, 'top-line');
    const completedAt = g.called[g.called.length - 1]!;
    g.call();
    g.claim(1, 'top-line');
    expect(lastClaim(g)).toMatchObject({ verdict: 'bogey', reason: 'late', completedAt });
  });

  it('Early Five: completedAt is the fifth of the ticket\'s numbers to be called', () => {
    const g = new PhoneGame({ seed: 'late-5' });
    const rows = g.ticket(2).rows;
    g.callWhile(() => calledOn(rows, g.called) < 5);
    const fifth = g.called[g.called.length - 1]!;
    g.call(3);
    g.claim(2, 'early-five');
    expect(lastClaim(g)).toMatchObject({ verdict: 'bogey', reason: 'late', completedAt: fifth });
  });
});

describe('TAM-174: a phone-ticket claim credits the ticket\'s owner automatically', () => {
  it('the verdict names the owner, and the prize goes to them in the summary with no player picked', () => {
    const g = new PhoneGame({ seed: 'owner' });
    callUntilComplete(g, 3, 'early-five');
    g.claim(3, 'early-five');
    const c = lastClaim(g);
    const earlyFive = g.host.tiers.find((t: any) => t.pattern === 'early-five').amount;
    expect(c).toMatchObject({ ticket: 3, playerId: 'p3', verdict: 'accepted', prize: earlyFive });
    g.close('early-five').do({ type: 'end' });
    const dad = g.summary.payouts.find((p: any) => p.playerId === 'p3');
    expect(dad.won).toBe(earlyFive);
  });

  it('the claim move needs no player: naming one changes nothing about who is credited', () => {
    const g = new PhoneGame({ seed: 'owner-2' });
    callUntilComplete(g, 3, 'early-five');
    g.do({ type: 'check-claim', ticket: 3, pattern: 'early-five', playerId: 'p1' } as any);
    expect(lastClaim(g).playerId).toBe('p3');
  });
});

describe('TAM-172 and TAM-175: the host keeps who holds each ticket, and can correct it', () => {
  it('before the first call, the host can give a ticket to a different player', () => {
    const g = new PhoneGame();
    g.do({ type: 'assign', ticket: 3, playerId: 'p1' });
    expect(g.ticket(3).playerId).toBe('p1');
  });

  it('TAM-175: after ticket 3 won, changing its owner to Arjun credits Arjun with that prize and any later one', () => {
    const players = [{ id: 'p1', name: 'Riya' }, { id: 'p2', name: 'Arjun' }, { id: 'p3', name: 'Dad' }];
    const g = new PhoneGame({ seed: 'correct', players });
    callUntilComplete(g, 1, 'early-five');
    g.claim(1, 'early-five');
    g.close('early-five');
    g.do({ type: 'assign', ticket: 1, playerId: 'p2' });
    expect(g.ticket(1).playerId).toBe('p2');
    callUntilComplete(g, 1, 'full-house');
    g.claim(1, 'full-house');
    expect(lastClaim(g).playerId).toBe('p2');
    g.close('full-house').do({ type: 'end' });
    const pay = Object.fromEntries(g.summary.payouts.map((p: any) => [p.playerId, p.won]));
    const amount = (p: Pattern) => g.summary.tiers.find((t: any) => t.pattern === p).amount;
    expect(pay.p2).toBe(amount('early-five') + amount('full-house'));
    expect(pay.p1).toBe(0);
  });

  it('TAM-175: the change is in the game\'s history, so a replay shows it', () => {
    const g = new PhoneGame({ seed: 'history' }).call(3);
    g.do({ type: 'assign', ticket: 2, playerId: 'p5' });
    expect(g.records.some((r) => (r.move as any).type === 'assign')).toBe(true);
    expect(PhoneGame.of(g.replayed()).ticket(2).playerId).toBe('p5');
  });

  it('wrong input: an unknown player or a ticket not in the game is refused, and nothing changes', () => {
    const g = new PhoneGame().call(2);
    const before = g.match;
    expect(g.try({ type: 'assign', ticket: 3, playerId: 'ghost' }).ok).toBe(false);
    expect(g.try({ type: 'assign', ticket: 99, playerId: 'p1' }).ok).toBe(false);
    expect(g.match).toBe(before);
  });

  it('TAM-175 wrong input: giving a player a ticket they already hold is refused, "Ticket 1 is already Riya\'s", and nothing changes', () => {
    const players = [{ id: 'p1', name: 'Riya' }, { id: 'p2', name: 'Arjun' }, { id: 'p3', name: 'Dad' }];
    for (const called of [0, 3]) {
      const g = new PhoneGame({ seed: `already-${called}`, players }).call(called);
      expect(g.ticket(1).playerId).toBe('p1');
      const before = g.match;
      const r = g.try({ type: 'assign', ticket: 1, playerId: 'p1' });
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/^Ticket 1 is already Riya['’]s\.?$/);
      expect(g.match).toBe(before);
      expect(g.ticket(1).playerId).toBe('p1');
    }
  });
});

describe('TAM-176 and TAM-032: tickets not in the game', () => {
  const four = [{ id: 'p1', name: 'Riya' }, { id: 'p2', name: 'Asha' }, { id: 'p3', name: 'Dad' }, { id: 'p4', name: 'Kabir' }];

  it('TAM-176: 4 tickets handed out from a sheet of 6: the other 2 are not in play and count for nothing in the pot', () => {
    const g = new PhoneGame({ players: four, contribution: 50 });
    expect(g.tickets.map((t) => t.number)).toEqual([1, 2, 3, 4]);
    expect(g.host.tiers.reduce((s: number, t: any) => s + t.amount, 0)).toBe(200);
    g.call(5);
    const before = g.match;
    const r = g.claim(5, 'early-five');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/5/);
    expect(r.reason).toMatch(/in this game/i);
    expect(g.match).toBe(before);
  });

  it('TAM-032: the host enters ticket 14 in a game of tickets 1 to 10: "No ticket 14 in this game", nothing changes', () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
    const g = new PhoneGame({ players: ten }).call(4);
    const before = g.match;
    const r = g.claim(14, 'top-line');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/14/);
    expect(r.reason).toMatch(/in this game/i);
    for (const bad of [0, -1, 2.5, NaN]) expect(g.claim(bad, 'top-line').ok).toBe(false);
    expect(g.match).toBe(before);
  });
});

describe('TAM-030, TAM-031 and TAM-044 with phone tickets: refusals are never bogeys', () => {
  it('TAM-030: a pattern already won and closed is refused with "already won", not a bogey', () => {
    const g = new PhoneGame({ seed: 'won' });
    callUntilComplete(g, 1, 'early-five');
    g.claim(1, 'early-five');
    g.close('early-five');
    const bogeys = g.host.claims.filter((c: any) => c.verdict === 'bogey').length;
    const r = g.claim(2, 'early-five');
    expect(r.ok).toBe(false);
    expect(r.reason?.toLowerCase()).toContain('already won');
    expect(g.host.claims.filter((c: any) => c.verdict === 'bogey')).toHaveLength(bogeys);
  });

  it('TAM-031: a pattern not in this game is refused', () => {
    const g = new PhoneGame({ tiers: phoneTiers(300).filter((t) => t.pattern !== 'four-corners').map((t) => (t.pattern === 'full-house' ? { ...t, amount: t.amount + 30 } : t)) }).call(5);
    expect(g.claim(1, 'four-corners').ok).toBe(false);
  });

  it('TAM-031, TAM-117 and TAM-177: a claim for a prize this game doesn\'t have (as a typed-code ticket may send) is refused with a reason, is not a bogey, and changes nothing', () => {
    // Owner decision 2026-09-30: a typed-code ticket offers every usual prize; the host refuses the ones not in the game.
    const g = new PhoneGame({ settings: { bogey: 'out' }, tiers: phoneTiers(300).filter((t) => t.pattern !== 'four-corners').map((t) => (t.pattern === 'full-house' ? { ...t, amount: t.amount + 30 } : t)) }).call(5);
    const before = g.match;
    const claims = g.host.claims.length;
    const r = g.claim(1, 'four-corners');
    expect(r.ok).toBe(false);
    expect((r.reason ?? '').trim().length).toBeGreaterThan(0);
    expect(g.host.claims).toHaveLength(claims);
    expect(g.match).toBe(before);
    expect(g.ticket(1).status).not.toBe('out');
  });

  it('TAM-044 (out): after a bogey the ticket is out; its next claim is refused "Ticket 3 is out", and is not another bogey', () => {
    const g = new PhoneGame({ seed: 'out', settings: { bogey: 'out' } }).call(1);
    g.claim(3, 'full-house');
    expect(lastClaim(g).verdict).toBe('bogey');
    expect(g.ticket(3).status).toBe('out');
    const count = g.host.claims.length;
    const r = g.claim(3, 'early-five');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Ticket 3 is out/);
    expect(g.host.claims).toHaveLength(count);
    // Other tickets still play.
    expect(g.claim(4, 'full-house').ok).toBe(true);
  });

  it('TAM-044 (carry on): after a bogey the ticket stays in play', () => {
    const g = new PhoneGame({ seed: 'carry', settings: CARRY_ON }).call(1);
    g.claim(3, 'full-house');
    expect(g.ticket(3).status).toBe('in-play');
    callUntilComplete(g, 3, 'early-five');
    expect(g.claim(3, 'early-five').ok).toBe(true);
    expect(lastClaim(g).verdict).toBe('accepted');
  });

  it('nothing can be claimed before the first number or after the game is over', () => {
    const g = new PhoneGame();
    expect(g.claim(1, 'early-five').ok).toBe(false);
    g.call(3).do({ type: 'end' });
    expect(g.claim(1, 'early-five').ok).toBe(false);
  });
});

describe('TAM-041, TAM-190 and TAM-145: a tie on the same number, even on one player\'s two tickets, is two claims', () => {
  /** A game where two tickets complete Early Five on the same call, before any other ticket. */
  function findTie() {
    for (let s = 0; s < 300; s++) {
      const g = new PhoneGame({ seed: `tie-${s}`, sheetSeed: `tie-sheet-${s}`, players: [
        { id: 'p1', name: 'Riya', tickets: 3 }, { id: 'p2', name: 'Asha', tickets: 3 }, { id: 'p3', name: 'Dad', tickets: 3 },
        { id: 'p4', name: 'Kabir', tickets: 3 },
      ] });
      const done = () => g.tickets.filter((t) => calledOn(t.rows, g.called) >= 5).map((t) => t.number);
      g.callWhile(() => done().length === 0);
      if (done().length >= 2) return { g, tied: done().slice(0, 2) };
    }
    throw new Error('no Early Five tie found in 300 games');
  }

  it('both claims are accepted, the tier waits to be closed, and the prize is shared; both shares go to Riya when she holds both', () => {
    const { g, tied } = findTie();
    // Give Riya only the tied tickets that are not already hers: giving her own ticket again is refused (TAM-175,
    // owner decision 2026-09-30).
    for (const t of tied) if (g.ticket(t).playerId !== 'p1') g.do({ type: 'assign', ticket: t, playerId: 'p1' });
    for (const t of tied) expect(g.ticket(t).playerId).toBe('p1');
    g.claim(tied[0]!, 'early-five');
    expect(lastClaim(g).verdict).toBe('accepted');
    expect(g.host.awaitingClose).toEqual(['early-five']);
    g.claim(tied[1]!, 'early-five');
    expect(lastClaim(g).verdict).toBe('accepted');
    const amount = g.host.tiers.find((t: any) => t.pattern === 'early-five').amount;
    const accepted = g.host.claims.filter((c: any) => c.verdict === 'accepted');
    expect(accepted.map((c: any) => c.ticket).sort()).toEqual([...tied].sort());
    expect(accepted.reduce((s: number, c: any) => s + c.prize, 0)).toBe(amount);
    g.close('early-five').do({ type: 'end' });
    expect(g.summary.payouts.find((p: any) => p.playerId === 'p1').won).toBe(amount);
  });

  it('the same ticket cannot win the same tier twice', () => {
    const { g, tied } = findTie();
    g.claim(tied[0]!, 'early-five');
    const again = g.claim(tied[0]!, 'early-five');
    expect(again.ok).toBe(false);
  });
});

describe('TAM-056: the host can see all tickets; nobody else can', () => {
  it('the host view lists every ticket in the game with its numbers, owner and status', () => {
    const g = new PhoneGame({ sheetSeed: 'all-tickets' });
    const made = makeTickets('all-tickets', 6);
    expect(g.tickets).toHaveLength(6);
    g.tickets.forEach((t, i) => {
      expect(t.rows).toEqual(made[i]!.rows);
      expect(typeof t.playerId).toBe('string');
      expect(t.status).toBe('in-play');
    });
  });

  it('the room view holds no ticket', () => {
    const g = new PhoneGame({ sheetSeed: 'room' }).call(10);
    const room = JSON.stringify(g.room);
    for (const t of g.tickets) expect(room).not.toContain(JSON.stringify(t.rows));
    expect((g.room as any).tickets ?? []).toEqual([]);
  });
});

describe('TAM-058: paper and phone tickets can be mixed; a player can switch to paper mid-game', () => {
  it('after "to-paper", the player\'s phone tickets can no longer be claimed, and the anchor\'s win is recorded for them', () => {
    const g = new PhoneGame({ seed: 'mixed' }).call(4);
    g.do({ type: 'to-paper', playerId: 'p2' });
    expect(g.ticket(2).status).toBe('paper');
    const r = g.claim(2, 'early-five');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/paper/i);
    // Paper wins are recorded on the anchor's word (TAM-037).
    expect(g.win('early-five', 'p2').ok).toBe(true);
    expect(lastClaim(g)).toMatchObject({ playerId: 'p2', pattern: 'early-five', verdict: 'accepted' });
  });

  it('switching before the first call works too ("Can\'t scan? Give a paper ticket")', () => {
    const g = new PhoneGame();
    g.do({ type: 'to-paper', playerId: 'p4' });
    expect(g.ticket(4).status).toBe('paper');
    expect(g.try({ type: 'to-paper', playerId: 'ghost' }).ok).toBe(false);
  });

  it('UX list row 8 (owner 2026-10-03): "plays on paper" can be undone until the first number is called, then it is final', () => {
    const g = new PhoneGame({ seed: 'paper-undo' });
    g.do({ type: 'to-paper', playerId: 'p4' });
    const rec = g.lastRecordOf('to-paper');
    expect(g.ticket(4).status).toBe('paper');
    // Before the first call: undo puts the phone ticket back in play, and its claims work again.
    const r = g.undo(rec.seq, g.clock + 60_000);
    expect(r.ok, 'undo of "to-paper" before the first call').toBe(true);
    expect(g.ticket(4).status).toBe('in-play');
    expect(PhoneGame.of(g.replayed()).ticket(4).status, 'the undo replays').toBe('in-play');
    // Again, then a number is called: from then on the switch is final.
    g.do({ type: 'to-paper', playerId: 'p4' });
    const again = g.lastRecordOf('to-paper');
    g.call();
    const late = g.undo(again.seq, g.clock + 1_000);
    expect(late.ok, 'undo of "to-paper" after the first call').toBe(false);
    expect(g.ticket(4).status).toBe('paper');
  });

  it('UX list row 8: a switch to paper made after the first call can never be undone', () => {
    const g = new PhoneGame({ seed: 'paper-undo-late' }).call(1);
    g.do({ type: 'to-paper', playerId: 'p2' });
    const rec = g.lastRecordOf('to-paper');
    expect(g.undo(rec.seq, rec.at + 1).ok).toBe(false);
    expect(g.ticket(2).status).toBe('paper');
  });

  it('a mixed game ends with money that adds up, and replays exactly', () => {
    const g = new PhoneGame({ seed: 'mixed-end' });
    g.do({ type: 'to-paper', playerId: 'p6' });
    callUntilComplete(g, 1, 'early-five');
    g.claim(1, 'early-five');
    g.close('early-five');
    g.win('top-line', 'p6');
    g.close('top-line').do({ type: 'end' });
    const s = g.summary;
    const paid = s.payouts.reduce((a: number, p: any) => a + p.paid, 0);
    const back = s.payouts.reduce((a: number, p: any) => a + p.won + p.handedBack, 0);
    expect(back).toBe(paid);
    expect(PhoneGame.of(g.replayed()).summary).toEqual(s);
  });
});

describe('Phone-ticket games keep the rules\' promises', () => {
  it('every accepted move keeps the invariants, and the claim checks are detail moves, not listed legal moves', () => {
    const g = new PhoneGame({ seed: 'inv' }).call(10);
    expect(rules.invariants(g.match.state)).toEqual([]);
    const types = rules.legalMoves(g.match.state, 'host').map((m: any) => m.type);
    expect(types).not.toContain('check-claim');
  });

  it('a claim can be undone any time; later calls stay (TAM-070, TAM-072)', () => {
    const g = new PhoneGame({ seed: 'undo', settings: CARRY_ON }).call(3);
    g.claim(1, 'full-house');
    const seq = g.lastRecordOf('check-claim').seq;
    g.call(2);
    const called = g.called;
    const u = g.undo(seq, g.clock + 60_000);
    expect(u.ok).toBe(true);
    expect(g.host.claims).toEqual([]);
    expect(g.called).toEqual(called);
  });

  it('patternSet agrees with the scenarios (sanity check of the test helper itself)', () => {
    const t = makeTickets('helper', 1)[0]!;
    const rows: Rows = t.rows;
    expect(patternSet(rows, 'full-house')).toEqual(nums(rows));
    expect(patternSet(rows, 'four-corners')).toHaveLength(4);
    expect(T0).toBeGreaterThan(0);
  });
});
