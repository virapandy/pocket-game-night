// Phase 2: the refusals of the typed code, the ticket QR and the claim QR (specs/tambola/05-secrets-and-seeds.md,
// 09-usability.md, 01-tickets.md). Written 4 October 2026 from the weekly mutation report, which found these refusal
// paths run by no test. Scenarios: TAM-117 (wrong input: a code that is not a ticket is refused with a one-line
// reason), TAM-001 to TAM-005 (every ticket the app shows is a valid ticket), TAM-053 and TAM-055 (a ticket QR gives
// exactly the host's copy; anything else is refused, never a crash), TAM-177 and TAM-117 (a typed-code ticket's claim
// for a prize this game doesn't have is refused calmly, never a bogey), TAM-058 (decided 2026-10-03: a claim QR for a
// ticket that plays on paper is refused, never a bogey), TAM-179 (refusals change nothing). Shapes: README.md,
// "Phase 2: phone tickets". Refusals with no approved scenario are not tested here (docs/test-questions.md, 4 October).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { T0, type Pattern } from './helpers';
import {
  decodeTicket, decodeTypedCode, encodeClaim, encodeTicket, nums, phoneTiers, PhoneGame, readClaim, ticketInfo, typedCode,
  type Rows,
} from './phone';

/** The letters and digits of a typed code (TAM-117: no 0, O, 1, I or L). */
const LETTERS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const RANGES: [number, number][] = [[1, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 90]];

/** TAM-001 to TAM-005, read from the rows alone. */
function isTambolaTicket(rows: Rows): boolean {
  if (!Array.isArray(rows) || rows.length !== 3) return false;
  if (rows.some((r) => !Array.isArray(r) || r.length !== 9 || r.filter((n) => n !== null).length !== 5)) return false;
  const all = nums(rows);
  if (all.length !== 15 || new Set(all).size !== 15) return false;
  for (let c = 0; c < 9; c++) {
    const [lo, hi] = RANGES[c]!;
    const col = rows.map((r) => r[c]).filter((n): n is number => n !== null);
    if (col.length < 1 || col.length > 3) return false;
    if (col.some((n) => !Number.isInteger(n) || n < lo || n > hi)) return false;
    for (let i = 1; i < col.length; i++) if (col[i]! <= col[i - 1]!) return false;
  }
  return true;
}

/** A refusal as the README shapes it: `{ ok: false, reason }` with a plain, non-empty, one-line reason. */
function expectRefusal(r: any, what: string) {
  expect(r?.ok, `${what} should be refused`).toBe(false);
  expect(typeof r.reason, `${what}: the refusal has a reason`).toBe('string');
  expect(r.reason.trim().length, `${what}: the reason is not empty`).toBeGreaterThan(0);
  expect(r.reason, `${what}: the reason is one line`).not.toMatch(/\n/);
}

const tryRead = <T>(f: () => T): T | 'threw' => {
  try { return f(); } catch { return 'threw'; }
};

describe('TAM-117 wrong input: a typed code that is not a ticket is refused with a one-line reason, never a crash', () => {
  it('something that is not text at all (nothing, a number, an object, a list) is refused', () => {
    for (const bad of [undefined, null, 12345, {}, [], true]) {
      const r = tryRead(() => decodeTypedCode(bad as any));
      expect(r, `${JSON.stringify(bad)} should be refused, not crash`).not.toBe('threw');
      expectRefusal(r, JSON.stringify(bad));
    }
  });

  it('the refusals of short, long and look-alike codes are one plain line', () => {
    const g = new PhoneGame({ seed: 'typed-refusals' });
    const code = typedCode(ticketInfo(g.host, 1, T0)).replace(/-/g, '');
    for (const bad of ['', code.slice(0, 19), `${code}2`, `${code.slice(0, 19)}0`, `${code.slice(0, 19)}O`, `${code.slice(0, 19)}1`,
      `${code.slice(0, 19)}I`, `${code.slice(0, 19)}L`, `${code.slice(0, 19)}!`]) {
      expectRefusal(decodeTypedCode(bad), `"${bad}"`);
    }
  });

  it('property: any 20 characters from the code\'s letters are refused, or open a valid ticket (TAM-001 to TAM-005) whose own code is exactly what was typed', () => {
    const letter = fc.constantFrom(...LETTERS.split(''));
    fc.assert(fc.property(fc.array(letter, { minLength: 20, maxLength: 20 }), (chars) => {
      const text = chars.join('');
      const r = tryRead(() => decodeTypedCode(text));
      expect(r, `"${text}" crashed`).not.toBe('threw');
      if (r === 'threw') return;
      if (r.ok !== true) { expectRefusal(r, `"${text}"`); return; }
      expect(isTambolaTicket(r.ticket.rows), `"${text}" opened a broken ticket`).toBe(true);
      expect(Number.isInteger(r.ticket.ticket) && r.ticket.ticket >= 1).toBe(true);
      expect(r.ticket.game).toMatch(/^[2-9A-HJKMNP-Z]{4}$/);
      expect(typedCode({ rows: r.ticket.rows, ticket: r.ticket.ticket, game: r.ticket.game }).replace(/-/g, '')).toBe(text);
    }), { numRuns: 3000 });
  });

  it('property: a typing slip (one character changed) in a real code is refused, or opens a valid ticket whose own code is exactly what was typed', () => {
    const g = new PhoneGame({ seed: 'typing-slips', players: [{ id: 'p1', name: 'Riya', tickets: 3 }, { id: 'p2', name: 'Asha', tickets: 3 }] });
    const codes = g.tickets.map((t) => typedCode(ticketInfo(g.host, t.number, T0)).replace(/-/g, ''));
    fc.assert(fc.property(fc.nat(codes.length - 1), fc.nat(19), fc.constantFrom(...LETTERS.split('')), (k, i, ch) => {
      const code = codes[k]!;
      const text = code.slice(0, i) + ch + code.slice(i + 1);
      const r = tryRead(() => decodeTypedCode(text));
      expect(r, `"${text}" crashed`).not.toBe('threw');
      if (r === 'threw') return;
      if (text === code) {
        expect(r.ok).toBe(true);
        expect(r.ticket.rows).toEqual(g.ticket(k + 1).rows);
        return;
      }
      if (r.ok !== true) { expectRefusal(r, `"${text}"`); return; }
      expect(isTambolaTicket(r.ticket.rows)).toBe(true);
      expect(typedCode({ rows: r.ticket.rows, ticket: r.ticket.ticket, game: r.ticket.game }).replace(/-/g, '')).toBe(text);
    }), { numRuns: 2000 });
  });
});

describe('TAM-053 and TAM-055: a damaged ticket QR is refused, or still gives exactly the host\'s copy; never a crash', () => {
  const g = new PhoneGame({ seed: 'damaged-qr', settings: { patternCue: true } });
  const info = ticketInfo(g.host, 3, T0);
  const text = encodeTicket(info);
  const code = typedCode(info).replace(/-/g, '');
  const codeStart = text.indexOf(code);
  const codeEnd = codeStart + code.length;

  /** Refused, or the host's ticket 3 with its number and the game code, number for number (TAM-055). */
  function refusedOrHostCopy(damaged: string) {
    const r = tryRead(() => decodeTicket(damaged));
    expect(r, `"${damaged}" crashed`).not.toBe('threw');
    if (r === 'threw') return;
    if (r.ok !== true) { expectRefusal(r, `"${damaged}"`); return; }
    expect(r.ticket.rows, `"${damaged}" opened a ticket that is not the host's copy`).toEqual(info.rows);
    expect(r.ticket.ticket).toBe(3);
    expect(r.ticket.game).toBe(g.host.code);
  }

  it('the QR as made opens the host\'s ticket 3 (the starting point for the damage below)', () => {
    expect(codeStart).toBeGreaterThan(0);
    const r = decodeTicket(text);
    expect(r.ok).toBe(true);
    expect(r.ticket.rows).toEqual(info.rows);
  });

  it('cut short anywhere inside the ticket code: refused (TAM-117: too short)', () => {
    for (let n = 0; n < codeEnd; n++) expectRefusal(tryRead(() => decodeTicket(text.slice(0, n))), `the first ${n} characters`);
  });

  it('cut short after the ticket code, or with any part missing: refused, or the host\'s copy', () => {
    for (let n = codeEnd; n < text.length; n++) refusedOrHostCopy(text.slice(0, n));
    const parts = text.split('.');
    for (let i = 1; i < parts.length; i++) refusedOrHostCopy([...parts.slice(0, i), ...parts.slice(i + 1)].join('.'));
  });

  it('a damaged start time, prize list, cue mark or name: refused, or the host\'s copy, never a crash', () => {
    const [v, c, started, tiers, , name] = text.split('.');
    const damaged = [
      [v, c, '!!', tiers, '1', name], [v, c, '', tiers, '1', name], [v, c, 'z'.repeat(20), tiers, '1', name],
      [v, c, started, '', '1', name], [v, c, started, 'XQ', '1', name], [v, c, started, `${tiers}${tiers![0]}`, '1', name],
      [v, c, started, tiers, '', name], [v, c, started, tiers, '7', name], [v, c, started, tiers, 'yes', name],
      [v, c, started, tiers, '1', ''], [v, c, started, tiers, '1', '%20%20'], [v, c, started, tiers, '1', '%E0%A4'],
      [v, c, started, tiers, '1', '%'], [v, c, started, tiers, '1', 'R%ZZya'], [v, c, started, tiers, '1', 'x'.repeat(500)],
    ];
    for (const parts of damaged) refusedOrHostCopy(parts.join('.'));
  });

  it('property: one character changed outside the ticket code is refused, or still gives the host\'s copy', () => {
    const outside = [...Array(text.length).keys()].filter((i) => i < codeStart || i >= codeEnd);
    fc.assert(fc.property(fc.constantFrom(...outside), fc.integer({ min: 32, max: 126 }), (i, ch) => {
      refusedOrHostCopy(text.slice(0, i) + String.fromCharCode(ch) + text.slice(i + 1));
    }), { numRuns: 1500 });
  });

  it('property: one character changed inside the ticket code is refused, or opens a valid ticket (TAM-001 to TAM-005); never a crash', () => {
    fc.assert(fc.property(fc.integer({ min: codeStart, max: codeEnd - 1 }), fc.integer({ min: 32, max: 126 }), (i, ch) => {
      const damaged = text.slice(0, i) + String.fromCharCode(ch) + text.slice(i + 1);
      const r = tryRead(() => decodeTicket(damaged));
      expect(r, `"${damaged}" crashed`).not.toBe('threw');
      if (r === 'threw') return;
      if (r.ok !== true) { expectRefusal(r, `"${damaged}"`); return; }
      expect(isTambolaTicket(r.ticket.rows)).toBe(true);
    }), { numRuns: 1500 });
  });
});

describe('TAM-177 and TAM-179: the host\'s scan refuses what does not belong, calmly, and changes nothing', () => {
  const noFourCorners = phoneTiers(300).filter((t) => t.pattern !== 'four-corners')
    .map((t) => (t.pattern === 'full-house' ? { ...t, amount: t.amount + 30 } : t));

  it('README: reading something that is not text never crashes, and is refused with a plain reason', () => {
    const g = new PhoneGame({ seed: 'scan-not-text' }).call(3);
    const before = JSON.stringify(g.host);
    for (const bad of [undefined, null, 42, {}, [], 'C1.' + 'A'.repeat(300) + '.T', 'C1..T', 'C1.ABCD', 'C1.ABCD.T.extra']) {
      const r = tryRead(() => readClaim(g.host, bad as any));
      expect(r, `${JSON.stringify(bad)} crashed`).not.toBe('threw');
      expectRefusal(r, JSON.stringify(bad));
    }
    expect(JSON.stringify(g.host)).toBe(before);
  });

  it('TAM-117 and TAM-177: a typed-code ticket\'s claim for a prize this game doesn\'t have is refused with a plain reason, never a bogey, and nothing changes', () => {
    const g = new PhoneGame({ seed: 'no-corners-scan', tiers: noFourCorners, settings: { bogey: 'out' } }).call(6);
    const before = JSON.stringify(g.host);
    const claims = g.host.claims.length;
    const r = readClaim(g.host, encodeClaim({ game: g.host.code, ticket: 2, pattern: 'four-corners', rows: g.ticket(2).rows }));
    expectRefusal(r, 'a Four Corners claim in a game without Four Corners');
    expect(r.reason).not.toMatch(/bogey/i);
    expect(r.checkByNumber).toBeUndefined();
    expect(g.host.claims).toHaveLength(claims);
    expect(JSON.stringify(g.host)).toBe(before);
    expect(g.ticket(2).status).toBe('in-play');
  });

  it('TAM-177: the same claim for a prize the game has is read as a claim (the refusal above is about the prize only)', () => {
    const g = new PhoneGame({ seed: 'no-corners-scan', tiers: noFourCorners, settings: { bogey: 'out' } }).call(6);
    const r = readClaim(g.host, encodeClaim({ game: g.host.code, ticket: 2, pattern: 'top-line', rows: g.ticket(2).rows }));
    expect(r).toMatchObject({ ok: true, ticket: 2, pattern: 'top-line' });
  });

  it('TAM-058 (decided 2026-10-03): a claim QR for ticket 4, which plays on paper, is refused "Ticket 4 plays on paper", never a bogey, and nothing changes', () => {
    const g = new PhoneGame({ seed: 'paper-scan', settings: { bogey: 'out' } }).call(5);
    g.do({ type: 'to-paper', playerId: 'p4' });
    expect(g.ticket(4).status).toBe('paper');
    const before = JSON.stringify(g.host);
    const claims = g.host.claims.length;
    const read = readClaim(g.host, encodeClaim({ game: g.host.code, ticket: 4, pattern: 'early-five' as Pattern, rows: g.ticket(4).rows }));
    expect(JSON.stringify(g.host)).toBe(before);
    // As with "already won" and "is out" (README), the refusal may come when the scan is read or when it is checked.
    if (read.ok !== true) expectRefusal(read, 'a claim QR for a paper ticket');
    else expect(read).toMatchObject({ ticket: 4, pattern: 'early-five' });
    const reason = read.ok === true ? g.claim(4, 'early-five').reason : read.reason;
    expect(reason).toMatch(/Ticket 4 plays on paper/);
    expect(reason).not.toMatch(/bogey/i);
    expect(g.host.claims).toHaveLength(claims);
    expect(g.ticket(4).status).toBe('paper');
  });
});
