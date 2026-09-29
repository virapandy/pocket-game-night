// Phone tickets (Phase 2): tickets made from the sheet seed, in sheets of 6 (TAM-001 to TAM-008, TAM-048).
// Pure: every random choice comes from the sheet seed, so the same seed always gives the same tickets.
import { createRng, deriveSeed, shuffle, type Rng } from '../../../engine';

/** A cell of a ticket: its number, or null for a blank square. */
export type Cell = number | null;
/** 3 rows of 9 cells. */
export type Rows = readonly (readonly Cell[])[];

export interface Ticket {
  /** 1, 2, 3 … in the order they are handed out. */
  readonly number: number;
  /** Ticket n is on sheet ⌈n/6⌉. */
  readonly sheet: number;
  readonly rows: Rows;
}

/** The numbers each column holds: 1–9, 10–19 … 80–90. */
export const COLUMNS: readonly (readonly number[])[] = Array.from({ length: 9 }, (_, c) => {
  const lo = c === 0 ? 1 : c * 10;
  const hi = c === 8 ? 90 : c * 10 + 9;
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
});

export const TICKETS_PER_SHEET = 6;
const MAX_ATTEMPTS = 200;

/** Tickets 1..count, from sheets of 6: every full sheet holds 1 to 90 exactly once (TAM-006). */
export function makeTickets(sheetSeed: string, count: number): Ticket[] {
  if (!Number.isFinite(count) || count <= 0) return [];
  const n = Math.floor(count);
  const out: Ticket[] = [];
  for (let s = 0; out.length < n; s++) {
    const sheet = makeSheet(createRng(deriveSeed(sheetSeed, `tambola-sheet:${s + 1}`)));
    for (const rows of sheet) {
      if (out.length >= n) break;
      out.push({ number: out.length + 1, sheet: s + 1, rows });
    }
  }
  return out;
}

/** One sheet of 6 tickets using every number from 1 to 90 once. */
function makeSheet(rng: Rng): Rows[] {
  const counts = columnCounts(rng);
  // Deal each column's numbers to the tickets, in random order, sorted within a ticket.
  const dealt: number[][][] = counts.map(() => []);
  for (let c = 0; c < 9; c++) {
    const pool = shuffle(COLUMNS[c]!, rng);
    let k = 0;
    for (let t = 0; t < TICKETS_PER_SHEET; t++) {
      const take = counts[t]![c]!;
      dealt[t]![c] = pool.slice(k, k + take).sort((a, b) => a - b);
      k += take;
    }
  }
  return counts.map((ticketCounts, t) => {
    const layout = rowLayout(ticketCounts, rng);
    const rows: Cell[][] = [0, 1, 2].map(() => Array<Cell>(9).fill(null));
    for (let c = 0; c < 9; c++) {
      const numbers = dealt[t]![c]!;
      let k = 0;
      for (let r = 0; r < 3; r++) if (layout[r]![c]) rows[r]![c] = numbers[k++]!;
    }
    return rows;
  });
}

/**
 * How many numbers each ticket takes from each column: 1 to 3, 15 per ticket, and the column's size in all.
 * Each ticket starts with 1 from every column; the 36 left over are shared out, each to a ticket that still
 * needs the most, at random among equals. Tried again in the rare case it gets stuck.
 */
function columnCounts(rng: Rng): number[][] {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const counts = Array.from({ length: TICKETS_PER_SHEET }, () => Array<number>(9).fill(1));
    const need = Array<number>(TICKETS_PER_SHEET).fill(6);
    const extras = COLUMNS.map((col) => col.length - TICKETS_PER_SHEET);
    // The fullest columns first, so they still find room.
    const order = shuffle([...Array(9).keys()], rng).sort((a, b) => extras[b]! - extras[a]!);
    let stuck = false;
    for (const c of order) {
      for (let e = 0; e < extras[c]! && !stuck; e++) {
        const open = [...Array(TICKETS_PER_SHEET).keys()].filter((t) => need[t]! > 0 && counts[t]![c]! < 3);
        if (open.length === 0) {
          stuck = true;
          break;
        }
        const most = Math.max(...open.map((t) => need[t]!));
        const best = open.filter((t) => need[t] === most);
        const t = best[rng.int(best.length)]!;
        counts[t]![c]!++;
        need[t]!--;
      }
      if (stuck) break;
    }
    if (!stuck && need.every((x) => x === 0)) return counts;
  }
  throw new Error('Could not make a sheet of tickets.');
}

/**
 * Which rows each column's numbers sit in: every row gets exactly 5. Columns with most numbers go first,
 * each into the rows with most room left (random among equals), which always works for these counts.
 */
function rowLayout(counts: readonly number[], rng: Rng): boolean[][] {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const layout = [0, 1, 2].map(() => Array<boolean>(9).fill(false));
    const room = [5, 5, 5];
    const order = shuffle([...Array(9).keys()], rng).sort((a, b) => counts[b]! - counts[a]!);
    let ok = true;
    for (const c of order) {
      const rows = shuffle([0, 1, 2], rng).sort((a, b) => room[b]! - room[a]!);
      const pick = rows.slice(0, counts[c]!);
      if (pick.some((r) => room[r]! <= 0)) {
        ok = false;
        break;
      }
      for (const r of pick) {
        layout[r]![c] = true;
        room[r]!--;
      }
    }
    if (ok && room.every((x) => x === 0)) return layout;
  }
  throw new Error('Could not lay out a ticket.');
}

/** Every number on a ticket, row by row. */
export function numbersOn(rows: Rows): number[] {
  return rows.flat().filter((n): n is number => n !== null);
}

/** A row's numbers, left to right. */
export function rowNumbers(rows: Rows, r: number): number[] {
  return (rows[r] ?? []).filter((n): n is number => n !== null);
}

/** Four Corners: the first and last numbers of the top and bottom rows (TAM-026). */
export function cornerNumbers(rows: Rows): number[] {
  const top = rowNumbers(rows, 0);
  const bottom = rowNumbers(rows, 2);
  return [top[0]!, top[top.length - 1]!, bottom[0]!, bottom[bottom.length - 1]!];
}

/** Is this a valid Tambola ticket (TAM-001 to TAM-005)? */
export function isValidTicket(rows: unknown): rows is Rows {
  if (!Array.isArray(rows) || rows.length !== 3) return false;
  for (const r of rows) {
    if (!Array.isArray(r) || r.length !== 9) return false;
    if (r.filter((x) => x !== null).length !== 5) return false;
  }
  const seen = new Set<number>();
  for (let c = 0; c < 9; c++) {
    const col = COLUMNS[c]!;
    const lo = col[0]!, hi = col[col.length - 1]!;
    let prev = 0;
    let count = 0;
    for (let r = 0; r < 3; r++) {
      const v = (rows[r] as unknown[])[c];
      if (v === null) continue;
      if (!Number.isInteger(v) || (v as number) < lo || (v as number) > hi || (v as number) <= prev || seen.has(v as number)) return false;
      seen.add(v as number);
      prev = v as number;
      count++;
    }
    if (count < 1) return false;
  }
  return true;
}
