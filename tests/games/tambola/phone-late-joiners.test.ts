// Phase 2: late joiners in a phone-ticket game (specs/tambola/06-room-and-host.md).
// Scenarios: TAM-212 (a late joiner gets phone tickets from the next sheet; owner decision 2026-09-30), with
// TAM-067 (late joining: called numbers count, a pattern complete on joining cannot be claimed, money, the limit),
// TAM-006 and TAM-194 (a player's tickets from one sheet never share a number), TAM-032, TAM-050, TAM-117, TAM-174.
// The move is the same `add-player` as with paper tickets (README.md, "Late joiners"); with phone tickets the
// host view's `tickets` gains the joiner's tickets (README.md, "Phase 2: phone tickets").
import { describe, expect, it } from 'vitest';
import { T0 } from './helpers';
import { decodeTypedCode, expected, makeTickets, nums, PhoneGame, ticketInfo, typedCode } from './phone';

const SHEET = 'late-sheet-seed';
const SIX = [
  { id: 'p1', name: 'Riya' }, { id: 'p2', name: 'Asha' }, { id: 'p3', name: 'Dad' },
  { id: 'p4', name: 'Meera' }, { id: 'p5', name: 'Nani' }, { id: 'p6', name: 'Arjun' },
];
const THREE = SIX.slice(0, 3);
const KABIR = { id: 'kabir', name: 'Kabir', tickets: 2 };

const addPlayer = (g: PhoneGame, player: { id: string; name: string; tickets: number }) => g.try({ type: 'add-player', player });
const ticketsOf = (g: PhoneGame, playerId: string) => g.tickets.filter((t) => t.playerId === playerId);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('TAM-212: after a full first sheet, a late joiner gets tickets 7 and 8 from the next sheet', () => {
  it('Kabir joins after 4 numbers with 2 tickets: tickets 7 and 8, sheet 2, his, in play; the calls stay as they were', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(4);
    const called = [...g.called];
    expect(g.tickets).toHaveLength(6);
    expect(addPlayer(g, KABIR).ok).toBe(true);
    expect(g.tickets).toHaveLength(8);
    const his = ticketsOf(g, 'kabir');
    expect(his.map((t) => [t.number, t.sheet, t.status])).toEqual([[7, 2, 'in-play'], [8, 2, 'in-play']]);
    expect(g.called).toEqual(called);
  });

  it('his tickets are made by the same sheet rules (the sheet seed\'s tickets 7 and 8), new, and share no number', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(4);
    const before = g.tickets.map((t) => JSON.stringify(t.rows));
    addPlayer(g, KABIR);
    const his = ticketsOf(g, 'kabir');
    const want = makeTickets(SHEET, 8);
    expect(his.map((t) => t.rows)).toEqual([want[6]!.rows, want[7]!.rows]);
    for (const t of his) expect(before).not.toContain(JSON.stringify(t.rows));
    const all = his.flatMap((t) => nums(t.rows));
    expect(new Set(all).size).toBe(all.length);
  });

  it('before he is added, ticket 7 is "not in this game" (TAM-032); after, it can be claimed', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(4);
    const r = g.claim(7, 'early-five');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/7/);
    expect(r.reason).toMatch(/in this game/i);
  });

  it('his hand-out QR and typed code carry his name and his ticket, like any other ticket (TAM-117, TAM-172)', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(4);
    addPlayer(g, KABIR);
    const info = ticketInfo(g.host, 7, T0);
    expect(info).toMatchObject({ ticket: 7, name: 'Kabir', game: g.host.code, rows: g.ticket(7).rows });
    const typed = decodeTypedCode(typedCode(info));
    expect(typed.ok).toBe(true);
    expect(typed.ticket.rows).toEqual(g.ticket(7).rows);
  });

  it('his phone sees only his own tickets (TAM-050)', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(4);
    addPlayer(g, KABIR);
    const view = g.view({ kind: 'player', playerId: 'kabir' });
    expect(view.tickets.map((t: any) => t.number).sort()).toEqual([7, 8]);
  });

  it('the numbers already called count; a pattern completed by a later number is accepted and credited to Kabir (TAM-174)', () => {
    // A game where a number called before he joined is on his ticket 7.
    let g!: PhoneGame;
    for (let s = 0; s < 200; s++) {
      g = new PhoneGame({ players: SIX, sheetSeed: `${SHEET}-${s}`, seed: `late-draw-${s}` }).call(4);
      addPlayer(g, KABIR);
      if (nums(g.ticket(7).rows).some((n) => g.called.includes(n))) break;
    }
    const rows = g.ticket(7).rows;
    const earlier = nums(rows).filter((n) => g.called.includes(n));
    expect(earlier.length, 'a number called before he joined is on his ticket').toBeGreaterThan(0);
    expect(g.callWhile(() => expected(rows, 'early-five', g.called).reason === 'not-called')).toBe(true);
    expect(expected(rows, 'early-five', g.called).verdict).toBe('accepted');
    expect(g.claim(7, 'early-five').ok).toBe(true);
    expect(g.lastClaim).toMatchObject({ ticket: 7, pattern: 'early-five', verdict: 'accepted', playerId: 'kabir' });
    // Accepted with fewer than 5 of his numbers called after he joined: the earlier calls counted.
    const afterJoin = g.called.slice(4);
    expect(nums(rows).filter((n) => afterJoin.includes(n)).length).toBeLessThan(5);
  });

  it('TAM-067: a pattern already complete on his ticket when he joined cannot be claimed, even if the last call completed it', () => {
    // Look for a game where the 9th call completes Early Five on one of the joiner's 3 tickets (tickets 7 to 9).
    for (let s = 0; s < 3000; s++) {
      const g = new PhoneGame({ players: SIX, sheetSeed: `lj-sheet-${s}`, seed: `lj-draw-${s}` }).call(9);
      expect(addPlayer(g, { id: 'kabir', name: 'Kabir', tickets: 3 }).ok).toBe(true);
      const t = ticketsOf(g, 'kabir').find((x) => expected(x.rows, 'early-five', g.called).verdict === 'accepted');
      if (!t) continue;
      const claimsBefore = g.host.claims.length;
      const r = g.claim(t.number, 'early-five');
      if (r.ok) {
        expect(g.host.claims.length).toBe(claimsBefore + 1);
        expect(g.lastClaim.verdict, `ticket ${t.number}: Early Five was complete when Kabir joined`).not.toBe('accepted');
      }
      // Refused or a bogey, never accepted: nobody has won Early Five.
      expect(g.host.claims.some((c: any) => c.verdict === 'accepted')).toBe(false);
      return;
    }
    expect.fail('no game found where Early Five was complete on a late joiner\'s ticket at the moment of joining');
  });

  it('money as in TAM-067: his 2 × ₹50 join the pot, and the prizes still add up to it exactly', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(4);
    expect(sum(g.host.tiers.map((t: any) => t.amount))).toBe(300);
    addPlayer(g, KABIR);
    expect(sum(g.host.tiers.map((t: any) => t.amount))).toBe(400);
  });
});

describe('TAM-212: more late joiners, and a first sheet not fully handed out', () => {
  it('each late joiner gets new tickets numbered after every ticket already in the game, consecutive, from the sheet rules', () => {
    const g = new PhoneGame({ players: THREE, sheetSeed: SHEET }).call(2);
    const first = g.tickets.map((t) => t.number);
    expect(first).toEqual([1, 2, 3]);
    expect(addPlayer(g, KABIR).ok).toBe(true);
    const k = ticketsOf(g, 'kabir');
    expect(k).toHaveLength(2);
    expect(k[0]!.number).toBeGreaterThan(3);
    expect(k[1]!.number).toBe(k[0]!.number + 1);
    // Two tickets of his that fit on one sheet are on that sheet, and share no number (TAM-006, TAM-194).
    const kn = k[0]!.number;
    if ((kn - 1) % 6 <= 4) {
      expect(k[0]!.sheet).toBe(k[1]!.sheet);
      const all = k.flatMap((t) => nums(t.rows));
      expect(new Set(all).size).toBe(all.length);
    }
    expect(addPlayer(g, { id: 'vik', name: 'Vikram', tickets: 1 }).ok).toBe(true);
    const v = ticketsOf(g, 'vik');
    expect(v).toHaveLength(1);
    expect(v[0]!.number).toBeGreaterThan(k[1]!.number);
    // Every ticket in the game is the sheet seed's ticket of that number, and each number is used once.
    const max = Math.max(...g.tickets.map((t) => t.number));
    const made = makeTickets(SHEET, max);
    for (const t of g.tickets) {
      expect(t.rows).toEqual(made[t.number - 1]!.rows);
      expect(t.sheet).toBe(Math.ceil(t.number / 6));
    }
    expect(new Set(g.tickets.map((t) => t.number)).size).toBe(g.tickets.length);
  });
});

describe('TAM-212 wrong input: nothing is handed out when adding is refused', () => {
  it('0 or 4 tickets are refused, and no ticket is added', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(4);
    expect(g.tickets).toHaveLength(6);
    expect(addPlayer(g, { id: 'kabir', name: 'Kabir', tickets: 0 }).ok).toBe(false);
    expect(addPlayer(g, { id: 'kabir', name: 'Kabir', tickets: 4 }).ok).toBe(false);
    expect(g.tickets).toHaveLength(6);
  });

  it('after 10 numbers, adding is refused and no ticket is added (TAM-067)', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(10);
    const r = addPlayer(g, KABIR);
    expect(r.ok).toBe(false);
    expect(typeof r.reason).toBe('string');
    expect(g.tickets).toHaveLength(6);
  });

  it('a name already in the game is refused, and no ticket is added', () => {
    const g = new PhoneGame({ players: SIX, sheetSeed: SHEET }).call(4);
    expect(addPlayer(g, { id: 'x', name: 'Riya', tickets: 1 }).ok).toBe(false);
    expect(g.tickets).toHaveLength(6);
  });
});
