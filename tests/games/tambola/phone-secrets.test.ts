// Phase 2: secrets, the ticket QR and code, and the claim QR (specs/tambola/05-secrets-and-seeds.md,
// 09-usability.md). Scenarios: TAM-050, TAM-051, TAM-052 (with the sheet seed), TAM-053, TAM-054, TAM-055,
// TAM-057, TAM-117, TAM-170, TAM-172, TAM-177, TAM-178, TAM-179, TAM-196 (the host's refusal), and the
// extensibility note (versioned QR formats), TAM-195 (the host's pattern-cue setting in the ticket QR, format
// version 2, owner 2026-10-01). Shapes: README.md, "Phase 2: phone tickets".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { defaults, T0, type Pattern } from './helpers';
import {
  CODE_ALPHABET, decodeClaim, decodeTicket, decodeTypedCode, encodeClaim, encodeTicket, intsInArrays, makeTickets, nums,
  PhoneGame, readClaim, ticketInfo, typedCode, type Rows,
} from './phone';

/** Real format-1 ticket QRs from the app at d3aa874 (tests/fixtures/ticket-qr-v1.json). */
const V1: { rule: { text: string; ticket: any }[]; browser: { link: string; ticket: number; name: string }[] } = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../fixtures/ticket-qr-v1.json', import.meta.url)), 'utf8'),
);

const DRAW = 'draw-seed-Xq93-secret';
const SHEET = 'sheet-seed-Mv27-secret';
// TAM-053 and TAM-195 (owner 2026-10-01): the ticket QR also carries the host's pattern-cue setting, as `cue`.
const TICKET_KEYS = ['v', 'game', 'ticket', 'name', 'rows', 'startedAt', 'tiers', 'cue'];
const CLAIM_KEYS = ['v', 'game', 'ticket', 'pattern', 'rows'];

/** Every way a seed could hide in a string: as is, URL-encoded, or in base64. */
function hides(text: string, seed: string): boolean {
  const b64 = Buffer.from(seed).toString('base64').replace(/=+$/, '');
  const b64url = b64.replace(/\+/g, '-').replace(/\//g, '_');
  return [seed, encodeURIComponent(seed), b64, b64url].some((s) => text.includes(s));
}

function game(opts: Record<string, unknown> = {}) {
  return new PhoneGame({ seed: DRAW, sheetSeed: SHEET, ...opts });
}

describe('TAM-050 and TAM-051: a player sees only their own ticket, and no called or upcoming numbers', () => {
  const players = [{ id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha', tickets: 1 }, { id: 'p3', name: 'Dad', tickets: 3 }];

  it("Riya's view holds her own tickets (numbers and layout), and nobody else's", () => {
    const g = game({ players }).call(15);
    const view = g.view({ kind: 'player', playerId: 'p1' });
    const mine = g.tickets.filter((t) => t.playerId === 'p1');
    expect(view.tickets.map((t: any) => ({ number: t.number, rows: t.rows }))).toEqual(mine.map((t) => ({ number: t.number, rows: t.rows })));
    const text = JSON.stringify(view);
    for (const t of g.tickets.filter((x) => x.playerId !== 'p1')) expect(text).not.toContain(JSON.stringify(t.rows));
  });

  it('at every point in the game, the only numbers in a player\'s view are on their own tickets: no calls, no draw', () => {
    fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 10 }), fc.integer({ min: 0, max: 90 }), (seed, calls) => {
      const g = new PhoneGame({ seed: `v-${seed}`, sheetSeed: `s-${seed}`, players }).call(calls);
      for (const p of players) {
        const own = new Set(g.tickets.filter((t) => t.playerId === p.id).flatMap((t) => nums(t.rows)));
        const seen = intsInArrays(g.view({ kind: 'player', playerId: p.id }));
        for (const n of seen) expect(own.has(n), `player ${p.id} sees ${n}, which is not on their tickets`).toBe(true);
      }
    }), { numRuns: 60 });
  });

  it('TAM-052 with phone tickets: neither the draw seed nor the sheet seed is in the room or any player view', () => {
    const g = game({ players }).call(30);
    for (const v of [{ kind: 'room' }, ...players.map((p) => ({ kind: 'player', playerId: p.id }))] as any[]) {
      const text = JSON.stringify(g.view(v));
      expect(hides(text, DRAW)).toBe(false);
      expect(hides(text, SHEET)).toBe(false);
    }
  });
});

describe('TAM-053 (reworded 2026-09-30), TAM-054, TAM-170, TAM-172: the ticket QR carries only that ticket', () => {
  it('ticketInfo gives ticket 3\'s numbers and layout, its number, the game code, the owner\'s name, the start time, the prizes and the cue setting', () => {
    const g = game();
    const info = ticketInfo(g.host, 3, T0);
    expect(Object.keys(info).sort()).toEqual(TICKET_KEYS.filter((k) => k !== 'v' || 'v' in info).sort());
    expect(info).toMatchObject({ game: g.host.code, ticket: 3, name: 'Dad', rows: g.ticket(3).rows, startedAt: T0 });
    expect(info.tiers).toEqual(g.host.tiers.map((t: any) => t.pattern));
    expect(info.cue, 'TAM-195: the cue is off unless the host turned it on').toBe(false);
  });

  it('TAM-170: the game code is 4 characters with no look-alikes, and differs between games', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const code = new PhoneGame({ seed: `code-${i}`, sheetSeed: `code-sheet-${i}` }).host.code;
      expect(code).toMatch(/^[2-9A-HJKMNP-Z]{4}$/);
      codes.add(code);
    }
    expect(codes.size).toBeGreaterThanOrEqual(19);
  });

  it('round trip: decoding the QR gives back exactly the ticket, its number, the game code, the name, the start time, the prizes and the cue setting, with format version 2, and nothing else', () => {
    const g = game();
    for (const t of g.tickets) {
      const info = ticketInfo(g.host, t.number, T0);
      const text = encodeTicket(info);
      expect(typeof text).toBe('string');
      const back = decodeTicket(text);
      expect(back.ok).toBe(true);
      expect(back.ticket.v, 'TAM-053 (owner 2026-10-01): the ticket QR with the cue setting is format version 2').toBe(2);
      expect(Object.keys(back.ticket).sort()).toEqual([...TICKET_KEYS].sort());
      const { v: _v, ...rest } = back.ticket;
      const { v: _w, ...want } = info;
      expect(rest).toEqual(want);
    }
  });

  it('the QR text never holds a seed, another ticket\'s numbers or any called number', () => {
    const g = game().call(20);
    const info = ticketInfo(g.host, 3, T0);
    const text = encodeTicket(info);
    expect(hides(text, DRAW)).toBe(false);
    expect(hides(text, SHEET)).toBe(false);
    const decoded = decodeTicket(text).ticket;
    const own = new Set(nums(g.ticket(3).rows));
    for (const n of intsInArrays(decoded)) expect(own.has(n)).toBe(true);
  });

  it('TAM-054: the QR is made from the ticket info alone: the same info gives the same QR, whatever the game\'s seeds', () => {
    const a = new PhoneGame({ seed: 'draw-a', sheetSeed: 'same-sheet' });
    const b = new PhoneGame({ seed: 'draw-b', sheetSeed: 'same-sheet' });
    const ia = ticketInfo(a.host, 2, T0);
    const ib = { ...ticketInfo(b.host, 2, T0), game: ia.game };
    expect(encodeTicket(ib)).toBe(encodeTicket(ia));
  });

  it('wrong input: text that is not a ticket QR is refused with a plain reason, never a crash', () => {
    for (const bad of ['', 'hello', 'https://example.com/', '{"rows":[]}', '%%%', 'A'.repeat(5000)]) {
      const r = decodeTicket(bad);
      expect(r.ok).toBe(false);
      expect(typeof r.reason).toBe('string');
    }
    const g = game().call(5);
    const claim = encodeClaim({ game: g.host.code, ticket: 1, pattern: 'top-line', rows: g.ticket(1).rows });
    expect(decodeTicket(claim).ok).toBe(false);
  });
});

describe('TAM-195 and TAM-053 (owner 2026-10-01): the host\'s pattern-cue setting travels in the ticket QR; off by default', () => {
  it('the cue is off by default in a new game\'s settings', () => {
    expect(defaults?.patternCue, 'tambolaDefaults.patternCue').toBe(false);
  });

  it('with the host\'s switch on (settings.patternCue), every ticket QR says so; with it off, every one says off', () => {
    for (const on of [true, false]) {
      const g = game({ settings: { patternCue: on }, players: [{ id: 'p1', name: 'Riya', tickets: 3 }, { id: 'p2', name: 'Asha', tickets: 1 }] });
      for (const t of g.tickets) {
        const info = ticketInfo(g.host, t.number, T0);
        expect(info.cue).toBe(on);
        const back = decodeTicket(encodeTicket(info));
        expect(back.ok).toBe(true);
        expect(back.ticket.v).toBe(2);
        expect(back.ticket.cue, `ticket ${t.number} with the cue ${on ? 'on' : 'off'}`).toBe(on);
        expect(back.ticket.rows).toEqual(t.rows);
      }
    }
  });

  it('the host\'s view and each player\'s view say whether the cue is on (settings.patternCue), and off by default', () => {
    for (const on of [true, false]) {
      const g = game({ settings: { patternCue: on }, players: [{ id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha', tickets: 1 }] });
      expect(g.host.patternCue, `host view, cue ${on ? 'on' : 'off'}`).toBe(on);
      for (const id of ['p1', 'p2']) expect(g.view({ kind: 'player', playerId: id }).patternCue, `player ${id}, cue ${on ? 'on' : 'off'}`).toBe(on);
    }
    const plain = game({ players: [{ id: 'p1', name: 'Riya', tickets: 1 }] });
    expect(plain.view({ kind: 'player', playerId: 'p1' }).patternCue, 'default').toBe(false);
  });

  it('the setting changes nothing else in the QR: same ticket, number, game, name, start time and prizes', () => {
    const on = game({ settings: { patternCue: true } });
    const off = game({ settings: { patternCue: false } });
    const a = decodeTicket(encodeTicket(ticketInfo(on.host, 2, T0))).ticket;
    const b = decodeTicket(encodeTicket(ticketInfo(off.host, 2, T0))).ticket;
    const { cue: ca, ...ra } = a;
    const { cue: cb, ...rb } = b;
    expect([ca, cb]).toEqual([true, false]);
    expect(ra).toEqual(rb);
  });

  it('an older QR (format version 1, made before this change) still opens, exactly as before, with the cue off', () => {
    for (const old of V1.rule) {
      const back = decodeTicket(old.text);
      expect(back.ok, `the version 1 QR "${old.text}" no longer opens`).toBe(true);
      expect(back.ticket.v).toBe(1);
      const { cue, ...rest } = back.ticket;
      expect(cue ?? false, 'an older QR has the cue off').toBe(false);
      expect(rest).toEqual(old.ticket);
    }
  });

  it('a typed code never carries the cue: decoding it gives the cue off (or no cue at all), even when the host turned it on', () => {
    const g = game({ settings: { patternCue: true }, players: [{ id: 'p1', name: 'Riya', tickets: 2 }] });
    for (const t of g.tickets) {
      const code = typedCode(ticketInfo(g.host, t.number, T0));
      expect(code).toMatch(/^[2-9A-HJKMNP-Z]{4}(-[2-9A-HJKMNP-Z]{4}){4}$/);
      const r = decodeTypedCode(code);
      expect(r.ok).toBe(true);
      expect(r.ticket.cue ?? false).toBe(false);
      expect(r.ticket.rows).toEqual(t.rows);
    }
  });
});

describe('TAM-055 and TAM-057: the ticket on the phone is identical to the host\'s copy, from the QR alone', () => {
  it('property: for any game and ticket, decoding its QR gives the host\'s ticket, number for number', () => {
    fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 12 }), fc.integer({ min: 1, max: 6 }), (seed, n) => {
      const g = new PhoneGame({ seed: `d-${seed}`, sheetSeed: `s-${seed}` });
      const back = decodeTicket(encodeTicket(ticketInfo(g.host, n, T0)));
      expect(back.ok).toBe(true);
      expect(back.ticket.rows).toEqual(g.ticket(n).rows);
      expect(back.ticket.ticket).toBe(n);
    }), { numRuns: 100 });
  });
});

describe('TAM-117: the typed code (20 characters in 5 groups of 4, owner decision 2026-09-30)', () => {
  const FORMAT = /^[2-9A-HJKMNP-Z]{4}(-[2-9A-HJKMNP-Z]{4}){4}$/;

  it('is 20 characters in 5 groups of 4, such as "K7QM-2XPA-9RTD-4HWC-B3NF", with no look-alikes (no 0, O, 1, I or L)', () => {
    const g = game({ players: [{ id: 'p1', name: 'Riya', tickets: 3 }, { id: 'p2', name: 'Asha', tickets: 3 }, { id: 'p3', name: 'Dad', tickets: 3 }] });
    for (const t of g.tickets) {
      const code = typedCode(ticketInfo(g.host, t.number, T0));
      expect(code).toMatch(FORMAT);
      expect(code.replace(/-/g, '')).toMatch(CODE_ALPHABET);
      expect(code.replace(/-/g, '')).toHaveLength(20);
    }
  });

  it('each ticket in a game has its own code', () => {
    const g = game({ players: [{ id: 'p1', name: 'Riya', tickets: 3 }, { id: 'p2', name: 'Asha', tickets: 3 }, { id: 'p3', name: 'Dad', tickets: 3 }] });
    const codes = g.tickets.map((t) => typedCode(ticketInfo(g.host, t.number, T0)));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('typing it opens the whole ticket with no internet: the code alone gives the numbers and layout, the ticket number and the game code', () => {
    fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 12 }), fc.integer({ min: 1, max: 6 }), (seed, n) => {
      const g = new PhoneGame({ seed: `c-${seed}`, sheetSeed: `cs-${seed}` });
      const code = typedCode(ticketInfo(g.host, n, T0));
      expect(code).toMatch(FORMAT);
      const r = decodeTypedCode(code);
      expect(r.ok).toBe(true);
      expect(r.ticket.rows).toEqual(g.ticket(n).rows);
      expect(r.ticket.ticket).toBe(n);
      expect(r.ticket.game).toBe(g.host.code);
    }), { numRuns: 100 });
  });

  it('works for a big game too: ticket 30 of 30 still fits in 20 characters and opens with its number', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, name: `Player ${i + 1}`, tickets: 3 }));
    const g = game({ players });
    const code = typedCode(ticketInfo(g.host, 30, T0));
    expect(code).toMatch(FORMAT);
    const r = decodeTypedCode(code);
    expect(r.ok).toBe(true);
    expect(r.ticket.ticket).toBe(30);
    expect(r.ticket.rows).toEqual(g.ticket(30).rows);
  });

  it('holds no seed; wrong input (empty, too short, look-alike letters, the old 12-character length) is refused with a plain reason', () => {
    const g = game();
    const code = typedCode(ticketInfo(g.host, 1, T0));
    expect(hides(code, DRAW)).toBe(false);
    expect(hides(code, SHEET)).toBe(false);
    for (const bad of ['', 'ABCD', '0000-0000-0000', 'hello world!', '7K3P-M4X9-2TRD', 'OOOO-IIII-LLLL-1111-0000', code.slice(0, 19)]) {
      const r = decodeTypedCode(bad);
      expect(r.ok, `"${bad}" should be refused`).toBe(false);
      expect(typeof r.reason).toBe('string');
    }
  });
});

describe('TAM-177 and the extensibility note: the claim QR', () => {
  it('carries the ticket number, the game code, the prize and the ticket, with format version 1, and nothing else', () => {
    const g = game().call(4);
    const claim = { game: g.host.code, ticket: 3, pattern: 'top-line' as Pattern, rows: g.ticket(3).rows };
    const text = encodeClaim(claim);
    const back = decodeClaim(text);
    expect(back.ok).toBe(true);
    expect(back.claim.v).toBe(1);
    expect(Object.keys(back.claim).sort()).toEqual([...CLAIM_KEYS].sort());
    expect(back.claim).toMatchObject(claim);
    expect(hides(text, DRAW)).toBe(false);
    expect(hides(text, SHEET)).toBe(false);
  });

  it('round trip for every pattern and ticket', () => {
    const g = game();
    const patterns: Pattern[] = ['early-five', 'top-line', 'middle-line', 'bottom-line', 'four-corners', 'full-house', 'second-full-house'];
    for (const t of g.tickets) for (const pattern of patterns) {
      const claim = { game: g.host.code, ticket: t.number, pattern, rows: t.rows };
      expect(decodeClaim(encodeClaim(claim)).claim).toMatchObject(claim);
    }
  });

  it('a ticket QR is not a claim QR', () => {
    const g = game();
    expect(decodeClaim(encodeTicket(ticketInfo(g.host, 1, T0))).ok).toBe(false);
  });
});

describe('TAM-177, TAM-178, TAM-179: the host reads a claim QR against its own copy', () => {
  const claimFor = (g: PhoneGame, ticket: number, pattern: Pattern, rows?: Rows) =>
    encodeClaim({ game: g.host.code, ticket, pattern, rows: rows ?? g.ticket(ticket).rows });

  it('a matching claim is read as { ticket, pattern }, and the verdict is the same as typing the ticket number (TAM-178)', () => {
    const g = game().call(10);
    const r = readClaim(g.host, claimFor(g, 3, 'top-line'));
    expect(r).toMatchObject({ ok: true, ticket: 3, pattern: 'top-line' });
    const scanned = PhoneGame.of(g.match); scanned.claim(r.ticket, r.pattern);
    const typed = PhoneGame.of(g.match); typed.claim(3, 'top-line');
    expect(scanned.host.claims).toEqual(typed.host.claims);
  });

  it('reading a claim changes nothing: the host view is the same afterwards', () => {
    const g = game().call(10);
    const before = JSON.stringify(g.host);
    readClaim(g.host, claimFor(g, 3, 'top-line'));
    readClaim(g.host, 'nonsense');
    expect(JSON.stringify(g.host)).toBe(before);
  });

  it('from another game: "This claim is for another game (code 7K3P)", refused', () => {
    const g = game().call(5);
    const other = new PhoneGame({ seed: 'other-draw', sheetSeed: 'other-sheet' });
    expect(other.host.code).not.toBe(g.host.code);
    const r = readClaim(g.host, claimFor(other, 2, 'early-five'));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/another game/i);
    expect(r.reason).toContain(other.host.code);
  });

  it('a ticket never handed out in this game (TAM-176): "Ticket 5 is not in this game", refused', () => {
    const four = [{ id: 'p1', name: 'Riya' }, { id: 'p2', name: 'Asha' }, { id: 'p3', name: 'Dad' }, { id: 'p4', name: 'Kabir' }];
    const g = game({ players: four }).call(5);
    const sixth = makeTickets(SHEET, 6)[4]!; // the host made the sheet; ticket 5 was never handed out
    const r = readClaim(g.host, encodeClaim({ game: g.host.code, ticket: 5, pattern: 'early-five', rows: sixth.rows }));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Ticket 5 is not in this game/);
  });

  it('an edited or damaged ticket: "This claim doesn\'t match ticket 3", refused, never a bogey; "Check ticket 3 by number" is offered', () => {
    const g = game().call(10);
    const rows = g.ticket(3).rows.map((r) => [...r]);
    // Swap one number for another in the same column's range that is not on the ticket.
    const c = rows[0]!.findIndex((n) => n !== null);
    const old = rows[0]![c]!;
    const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9;
    const onTicket = new Set(nums(rows));
    let replacement = lo;
    while (onTicket.has(replacement) && replacement <= hi) replacement++;
    rows[0]![c] = replacement;
    expect(replacement).not.toBe(old);
    const r = readClaim(g.host, claimFor(g, 3, 'top-line', rows));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/doesn.t match ticket 3/);
    expect(r.checkByNumber).toBe(3);
    // The host's own copy gives the verdict (TAM-174).
    expect(g.claim(3, 'top-line').ok).toBe(true);
    expect(g.lastClaim.ticket).toBe(3);
  });

  it('tamper property: any edit to a claim QR is refused, or read as a claim whose ticket matches the host\'s copy exactly', () => {
    const g = game().call(12);
    const text = claimFor(g, 2, 'middle-line');
    fc.assert(fc.property(fc.nat(text.length - 1), fc.integer({ min: 32, max: 126 }), (i, code) => {
      const edited = text.slice(0, i) + String.fromCharCode(code) + text.slice(i + 1);
      let r: any;
      expect(() => (r = readClaim(g.host, edited))).not.toThrow();
      if (r.ok) {
        const d = decodeClaim(edited);
        expect(d.ok).toBe(true);
        expect(d.claim.game).toBe(g.host.code);
        expect(d.claim.rows).toEqual(g.ticket(r.ticket).rows);
      }
    }), { numRuns: 500 });
  });

  it('garbage, a ticket QR, or an empty read is refused with a plain reason', () => {
    const g = game().call(3);
    for (const bad of ['', 'hello', 'https://example.com/', encodeTicket(ticketInfo(g.host, 1, T0))]) {
      const r = readClaim(g.host, bad);
      expect(r.ok).toBe(false);
      expect(typeof r.reason).toBe('string');
      expect(r.reason.length).toBeGreaterThan(0);
    }
  });

  it('TAM-179 and TAM-196: a prize already won is refused "Top Line already won", not a bogey', () => {
    const g = game();
    const rows = g.ticket(1).rows;
    g.callWhile(() => !rows[0]!.filter((n) => n !== null).every((n) => g.called.includes(n as number)));
    g.claim(1, 'top-line');
    expect(g.lastClaim.verdict).toBe('accepted');
    g.close('top-line');
    const read = readClaim(g.host, claimFor(g, 2, 'top-line'));
    const bogeys = g.host.claims.filter((c: any) => c.verdict === 'bogey').length;
    // Refused when read, or when checked: either way with "Top Line already won", and never a bogey.
    const reason = read.ok ? g.claim(2, 'top-line').reason : read.reason;
    expect(reason).toMatch(/Top Line already won/);
    expect(g.host.claims.filter((c: any) => c.verdict === 'bogey')).toHaveLength(bogeys);
  });

  it('TAM-179: a ticket that is out after a bogey is refused "Ticket 3 is out", not another bogey', () => {
    const g = game({ settings: { bogey: 'out' } }).call(2);
    g.claim(3, 'full-house');
    const count = g.host.claims.length;
    const read = readClaim(g.host, claimFor(g, 3, 'early-five'));
    const reason = read.ok ? g.claim(3, 'early-five').reason : read.reason;
    expect(reason).toMatch(/Ticket 3 is out/);
    expect(g.host.claims).toHaveLength(count);
  });
});
