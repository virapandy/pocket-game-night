// Phase 2: tickets the app makes, from sheets of 6 (specs/tambola/01-tickets.md, TAM-048, TAM-194).
// Scenarios: TAM-001 to TAM-008, TAM-048, TAM-176, TAM-194. Shapes: README.md, "Phase 2: phone tickets".
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mod } from './helpers';
import { makeTickets, nums, PhoneGame, row, type Ticket } from './phone';

const RANGES: [number, number][] = [[1, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 90]];
const seedArb = fc.string({ minLength: 1, maxLength: 24 });
const col = (t: Ticket, c: number) => t.rows.map((r) => r[c]).filter((n): n is number => n !== null && n !== undefined);

describe('TAM-001 to TAM-005: every ticket the app makes is a valid Tambola ticket', () => {
  it('has 3 rows of 9 cells; blanks are null', () => {
    fc.assert(fc.property(seedArb, fc.integer({ min: 1, max: 30 }), (seed, count) => {
      for (const t of makeTickets(seed, count)) {
        expect(t.rows).toHaveLength(3);
        for (const r of t.rows) {
          expect(r).toHaveLength(9);
          for (const c of r) expect(c === null || Number.isInteger(c)).toBe(true);
        }
      }
    }), { numRuns: 100 });
  });

  it('TAM-001: 15 numbers, 5 in each row and 4 blank spaces', () => {
    fc.assert(fc.property(seedArb, (seed) => {
      for (const t of makeTickets(seed, 12)) {
        expect(nums(t.rows)).toHaveLength(15);
        for (let r = 0; r < 3; r++) {
          expect(row(t.rows, r)).toHaveLength(5);
          expect(t.rows[r]!.filter((c) => c === null)).toHaveLength(4);
        }
      }
    }), { numRuns: 200 });
  });

  it("TAM-002: every number sits in its column's range (column 9 holds 80 to 90)", () => {
    fc.assert(fc.property(seedArb, (seed) => {
      for (const t of makeTickets(seed, 12)) {
        for (let c = 0; c < 9; c++) {
          const [lo, hi] = RANGES[c]!;
          for (const n of col(t, c)) {
            expect(n).toBeGreaterThanOrEqual(lo);
            expect(n).toBeLessThanOrEqual(hi);
          }
        }
      }
    }), { numRuns: 200 });
  });

  it('TAM-003: every column has at least 1 number and at most 3', () => {
    fc.assert(fc.property(seedArb, (seed) => {
      for (const t of makeTickets(seed, 12)) {
        for (let c = 0; c < 9; c++) {
          expect(col(t, c).length).toBeGreaterThanOrEqual(1);
          expect(col(t, c).length).toBeLessThanOrEqual(3);
        }
      }
    }), { numRuns: 200 });
  });

  it('TAM-004: within each column, numbers increase from top to bottom', () => {
    fc.assert(fc.property(seedArb, (seed) => {
      for (const t of makeTickets(seed, 12)) {
        for (let c = 0; c < 9; c++) {
          const v = col(t, c);
          for (let i = 1; i < v.length; i++) expect(v[i]!).toBeGreaterThan(v[i - 1]!);
        }
      }
    }), { numRuns: 200 });
  });

  it('TAM-005: all 15 numbers on a ticket are different', () => {
    fc.assert(fc.property(seedArb, (seed) => {
      for (const t of makeTickets(seed, 12)) expect(new Set(nums(t.rows)).size).toBe(15);
    }), { numRuns: 200 });
  });
});

describe('TAM-006 and TAM-048: tickets come in sheets of 6, and a full sheet uses every number exactly once', () => {
  it('tickets are numbered 1, 2, 3 … and ticket n is on sheet ⌈n/6⌉', () => {
    const t = makeTickets('numbering', 14);
    expect(t.map((x) => x.number)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    expect(t.map((x) => x.sheet)).toEqual(t.map((x) => Math.ceil(x.number / 6)));
  });

  it('every full sheet of 6 holds 1 to 90 exactly once', () => {
    fc.assert(fc.property(seedArb, fc.integer({ min: 1, max: 5 }), (seed, sheets) => {
      const t = makeTickets(seed, sheets * 6);
      for (let s = 0; s < sheets; s++) {
        const all = t.slice(s * 6, s * 6 + 6).flatMap((x) => nums(x.rows)).sort((a, b) => a - b);
        expect(all).toEqual(Array.from({ length: 90 }, (_, i) => i + 1));
      }
    }), { numRuns: 150 });
  });

  it('a part sheet is the start of the full sheet: fewer tickets are the first ones of the same sheets', () => {
    fc.assert(fc.property(seedArb, fc.integer({ min: 1, max: 17 }), (seed, count) => {
      const full = makeTickets(seed, 18);
      expect(makeTickets(seed, count)).toEqual(full.slice(0, count));
    }), { numRuns: 100 });
  });

  it('wrong input: 0 or a negative or fractional count is refused or gives no tickets, never a broken ticket', () => {
    expect(mod.makeTickets, 'makeTickets is not exported yet (Phase 2)').toBeTypeOf('function');
    for (const bad of [0, -1, 2.5]) {
      let out: Ticket[] | 'threw';
      try { out = makeTickets('bad', bad); } catch { out = 'threw'; }
      if (out !== 'threw') expect(out.every((t) => nums(t.rows).length === 15)).toBe(true);
      if (out !== 'threw' && bad <= 0) expect(out).toEqual([]);
    }
  });
});

describe('TAM-007: tickets for different players are different', () => {
  it('10 players: no two tickets are identical, for any sheet seed', () => {
    fc.assert(fc.property(seedArb, (seed) => {
      const keys = makeTickets(seed, 10).map((t) => JSON.stringify(t.rows));
      expect(new Set(keys).size).toBe(10);
    }), { numRuns: 300 });
  });

  it('30 tickets over 5 sheets: all different', () => {
    const keys = makeTickets('big-party', 30).map((t) => JSON.stringify(t.rows));
    expect(new Set(keys).size).toBe(30);
  });
});

describe('TAM-008: the same sheet seed always gives the same tickets', () => {
  it('number for number, every time', () => {
    fc.assert(fc.property(seedArb, (seed) => {
      expect(makeTickets(seed, 12)).toEqual(makeTickets(seed, 12));
    }), { numRuns: 100 });
  });

  it('different sheet seeds give different tickets', () => {
    const a = makeTickets('sheet-a', 6).map((t) => JSON.stringify(t.rows));
    const b = makeTickets('sheet-b', 6).map((t) => JSON.stringify(t.rows));
    expect(a).not.toEqual(b);
  });

  it('the game on the host phone uses the tickets made from its sheet seed, and a replay has them too', () => {
    const g = new PhoneGame({ sheetSeed: 'host-sheet-seed' });
    const made = makeTickets('host-sheet-seed', 6);
    expect(g.tickets.map((t) => ({ number: t.number, sheet: t.sheet, rows: t.rows }))).toEqual(made);
    g.call(12);
    const replayed = PhoneGame.of(g.replayed());
    expect(replayed.tickets.map((t) => t.rows)).toEqual(made.map((t) => t.rows));
  });

  it('the draw seed does not change the tickets; the sheet seed does not change the draw', () => {
    const a = new PhoneGame({ seed: 'draw-1', sheetSeed: 'sheet-1' }).call(20);
    const b = new PhoneGame({ seed: 'draw-2', sheetSeed: 'sheet-1' }).call(20);
    const c = new PhoneGame({ seed: 'draw-1', sheetSeed: 'sheet-2' }).call(20);
    expect(b.tickets.map((t) => t.rows)).toEqual(a.tickets.map((t) => t.rows));
    expect(c.called).toEqual(a.called);
  });
});

describe('TAM-194 and TAM-172: tickets are handed out in order, a player\'s tickets together', () => {
  const players = [
    { id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha', tickets: 3 }, { id: 'p3', name: 'Dad', tickets: 1 },
    { id: 'p4', name: 'Kabir', tickets: 3 }, { id: 'p5', name: 'Meera', tickets: 1 },
  ];

  it('players get consecutive tickets in the order they were listed: Riya 1–2, Asha 3–5, Dad 6, Kabir 7–9, Meera 10', () => {
    const g = new PhoneGame({ players });
    const owners = g.tickets.map((t) => [t.number, t.playerId]);
    expect(owners).toEqual([
      [1, 'p1'], [2, 'p1'], [3, 'p2'], [4, 'p2'], [5, 'p2'], [6, 'p3'], [7, 'p4'], [8, 'p4'], [9, 'p4'], [10, 'p5'],
    ]);
  });

  it('strictly in order (owner, 2026-09-30): when the sheet has too few left, the tickets span two sheets; none is skipped for a fresh sheet', () => {
    const g = new PhoneGame({ players: [
      { id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Dad', tickets: 2 }, { id: 'p3', name: 'Asha', tickets: 3 },
    ] });
    expect(g.tickets.map((t) => [t.number, t.sheet, t.playerId])).toEqual([
      [1, 1, 'p1'], [2, 1, 'p1'], [3, 1, 'p2'], [4, 1, 'p2'], [5, 1, 'p3'], [6, 1, 'p3'], [7, 2, 'p3'],
    ]);
  });

  it('property: the tickets in the game are exactly 1 to the number handed out, with no gaps', () => {
    fc.assert(fc.property(seedArb, fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 1, maxLength: 12 }), (seed, counts) => {
      const ps = counts.map((k, i) => ({ id: `q${i}`, name: `Player ${i + 1}`, tickets: k }));
      const g = new PhoneGame({ players: ps, sheetSeed: seed });
      const total = counts.reduce((a, b) => a + b, 0);
      expect(g.tickets.map((t) => t.number)).toEqual(Array.from({ length: total }, (_, i) => i + 1));
    }), { numRuns: 60 });
  });

  it('a player whose tickets fit on one sheet has them all on that sheet, so a called number is on at most one of them', () => {
    fc.assert(fc.property(seedArb, fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 1, maxLength: 10 }), (seed, counts) => {
      const ps = counts.map((k, i) => ({ id: `q${i}`, name: `Player ${i + 1}`, tickets: k }));
      const g = new PhoneGame({ players: ps, sheetSeed: seed });
      for (const p of ps) {
        const mine = g.tickets.filter((t) => t.playerId === p.id);
        expect(mine).toHaveLength(p.tickets);
        const numbers = mine.map((t) => t.number);
        // Consecutive.
        numbers.forEach((n, i) => i > 0 && expect(n).toBe(numbers[i - 1]! + 1));
        const sheets = new Set(mine.map((t) => t.sheet));
        const firstSheetLeft = 6 - ((numbers[0]! - 1) % 6);
        if (p.tickets <= firstSheetLeft) {
          expect(sheets.size).toBe(1);
          const all = mine.flatMap((t) => nums(t.rows));
          expect(new Set(all).size).toBe(all.length);
        }
      }
    }), { numRuns: 100 });
  });
});
