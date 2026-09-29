// Phase 2: what travels between phones, as text. The game code (TAM-170), the typed ticket code (TAM-117),
// the ticket QR (TAM-053) and the claim QR (TAM-177). None of them holds a seed, another ticket or a call.
// Both QR formats start with a version ("T1", "C1"), so a later version can add to them and still read these.
import { deriveSeed } from '../../../engine';
import { COLUMNS, isValidTicket, type Rows } from './tickets';
import { isPattern, PATTERN_NAMES, type Pattern, type TambolaView } from './types';

/** Letters and digits that cannot be mistaken for each other: no 0, O, 1, I or L (TAM-117). */
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const BASE = BigInt(CODE_ALPHABET.length);
const CODE_LENGTH = 20;
const GAME_CODE_LENGTH = 4;

/** The game code: 4 characters worked out from the game's id (never from a seed), different between games. */
export function gameCode(gameId: string): string {
  const hash = BigInt(`0x${deriveSeed(gameId, 'tambola-game-code').slice(0, 12)}`);
  return toChars(hash % BASE ** BigInt(GAME_CODE_LENGTH), GAME_CODE_LENGTH);
}

function toChars(value: bigint, length: number): string {
  let out = '';
  let v = value;
  for (let i = 0; i < length; i++) {
    out = CODE_ALPHABET[Number(v % BASE)]! + out;
    v /= BASE;
  }
  return out;
}

function fromChars(text: string): bigint | null {
  let v = 0n;
  for (const ch of text) {
    const d = CODE_ALPHABET.indexOf(ch);
    if (d < 0) return null;
    v = v * BASE + BigInt(d);
  }
  return v;
}

const isGameCode = (x: unknown): x is string => typeof x === 'string' && x.length === GAME_CODE_LENGTH && fromChars(x) !== null;

// ---------- The typed code: 20 characters carrying the whole ticket (TAM-117, owner decision 2026-09-30) ----------
// The ticket is written as one number in mixed radix: which 5 of the 9 columns each row uses, then which of each
// column's numbers the ticket has, then the game code, the ticket number and a small check against typing slips.

const choose = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
};

/** The rank of a sorted set of positions among all sets of that size (combinatorial number system). */
function rankSet(positions: readonly number[]): number {
  return positions.reduce((sum, p, j) => sum + choose(p, j + 1), 0);
}

function unrankSet(rank: number, k: number): number[] {
  const out: number[] = [];
  let r = rank;
  for (let j = k; j >= 1; j--) {
    let p = j - 1;
    while (choose(p + 1, j) <= r) p++;
    out.unshift(p);
    r -= choose(p, j);
  }
  return out;
}

const ROW_CHOICES = choose(9, 5); // 126 ways to pick a row's 5 columns
const TICKET_RADIX = 1000; // tickets 1 to 1000
const CHECK_RADIX = 32;

interface Digit { value: number; radix: number }

function checkOf(prefix: bigint, game: string, ticket: number): number {
  return Number.parseInt(deriveSeed(`${prefix}:${game}:${ticket}`, 'tambola-typed-code').slice(0, 8), 16) % CHECK_RADIX;
}

/** The typed code for a ticket: "K7QM-2XPA-9RTD-4HWC-B3NF". */
export function typedCode(info: { rows: Rows; ticket: number; game: string }): string {
  if (!isValidTicket(info.rows)) throw new Error('Not a valid ticket.');
  if (!Number.isInteger(info.ticket) || info.ticket < 1 || info.ticket > TICKET_RADIX) throw new Error('No such ticket number.');
  const game = fromChars(info.game);
  if (game === null || info.game.length !== GAME_CODE_LENGTH) throw new Error('Not a game code.');
  const digits: Digit[] = [];
  for (let r = 0; r < 3; r++) {
    const cols = [...Array(9).keys()].filter((c) => info.rows[r]![c] !== null);
    digits.push({ value: rankSet(cols), radix: ROW_CHOICES });
  }
  for (let c = 0; c < 9; c++) {
    const col = COLUMNS[c]!;
    const picked = [0, 1, 2].map((r) => info.rows[r]![c]).filter((n): n is number => n !== null).map((n) => n - col[0]!);
    digits.push({ value: rankSet(picked), radix: choose(col.length, picked.length) });
  }
  let prefix = 0n;
  let scale = 1n;
  for (const d of digits) {
    prefix += BigInt(d.value) * scale;
    scale *= BigInt(d.radix);
  }
  let value = prefix;
  value += game * scale;
  scale *= BASE ** BigInt(GAME_CODE_LENGTH);
  value += BigInt(info.ticket - 1) * scale;
  scale *= BigInt(TICKET_RADIX);
  value += BigInt(checkOf(prefix, info.game, info.ticket)) * scale;
  const chars = toChars(value, CODE_LENGTH);
  return chars.match(/.{4}/g)!.join('-');
}

export type Decoded<T> = { readonly ok: true; readonly ticket: T } | { readonly ok: false; readonly reason: string };

const WRONG_CODE = 'That is not a ticket code. Check it with the host: 20 letters and numbers, such as K7QM-2XPA-9RTD-4HWC-B3NF.';

/** Reads a typed code back into the ticket, its number and the game code, with no internet (TAM-117). */
export function decodeTypedCode(code: string): Decoded<{ rows: Rows; ticket: number; game: string }> {
  if (typeof code !== 'string') return { ok: false, reason: WRONG_CODE };
  const text = code.toUpperCase().replace(/[\s-]/g, '');
  if (text.length !== CODE_LENGTH) return { ok: false, reason: WRONG_CODE };
  let value = fromChars(text);
  if (value === null) return { ok: false, reason: WRONG_CODE };
  const take = (radix: number): number => {
    const r = BigInt(radix);
    const d = Number(value! % r);
    value = value! / r;
    return d;
  };
  const layout = [0, 1, 2].map(() => unrankSet(take(ROW_CHOICES), 5));
  const rows: (number | null)[][] = [0, 1, 2].map(() => Array<number | null>(9).fill(null));
  let prefixScale = BigInt(ROW_CHOICES) ** 3n;
  for (let c = 0; c < 9; c++) {
    const inRows = [0, 1, 2].filter((r) => layout[r]!.includes(c));
    if (inRows.length === 0) return { ok: false, reason: WRONG_CODE };
    const col = COLUMNS[c]!;
    const radix = choose(col.length, inRows.length);
    const picked = unrankSet(take(radix), inRows.length);
    prefixScale *= BigInt(radix);
    inRows.forEach((r, i) => (rows[r]![c] = col[0]! + picked[i]!));
  }
  const full = fromChars(text)!;
  const prefix = full % prefixScale;
  const game = toChars(BigInt(take(Number(BASE ** BigInt(GAME_CODE_LENGTH)))), GAME_CODE_LENGTH);
  const ticket = take(TICKET_RADIX) + 1;
  const check = take(CHECK_RADIX);
  if (value !== 0n || check !== checkOf(prefix, game, ticket) || !isValidTicket(rows)) return { ok: false, reason: WRONG_CODE };
  return { ok: true, ticket: { rows, ticket, game } };
}

// ---------- The ticket QR (TAM-053, TAM-117): inside the app's own link, after "#t=" ----------

const PATTERN_LETTERS: Readonly<Record<Pattern, string>> = {
  'early-five': 'E',
  'four-corners': 'C',
  'top-line': 'T',
  'middle-line': 'M',
  'bottom-line': 'B',
  'full-house': 'F',
  'second-full-house': 'S',
};
const LETTER_PATTERNS = new Map(Object.entries(PATTERN_LETTERS).map(([p, l]) => [l, p as Pattern]));

/** What the hand-out QR carries for one ticket: that ticket and nothing else (TAM-053). */
export interface TicketInfo {
  readonly game: string;
  readonly ticket: number;
  readonly name: string;
  readonly rows: Rows;
  readonly startedAt: number;
  readonly tiers: readonly Pattern[];
}

/** The hand-out QR's facts for one ticket, from the host's view (TAM-053, TAM-170, TAM-172). */
export function ticketInfo(view: TambolaView, ticket: number, startedAt: number): TicketInfo {
  const t = view.tickets.find((x) => x.number === ticket);
  if (!t || view.code === null) throw new Error(`No ticket ${ticket} in this game.`);
  const name = view.players.find((p) => p.id === t.playerId)?.name ?? '';
  return { game: view.code, ticket, name, rows: t.rows, startedAt, tiers: view.tiers.map((x) => x.pattern) };
}

const TICKET_PREFIX = 'T1';
const CLAIM_PREFIX = 'C1';

/** The ticket QR's text: "T1.<typed code>.<start time>.<prizes>.<name>". It depends only on `info`. */
export function encodeTicket(info: TicketInfo): string {
  const code = typedCode(info).replace(/-/g, '');
  const tiers = info.tiers.map((p) => PATTERN_LETTERS[p]).join('');
  return [TICKET_PREFIX, code, Math.max(0, Math.floor(info.startedAt)).toString(36), tiers, encodeURIComponent(info.name)].join('.');
}

const NOT_A_TICKET = 'This is not a Pocket Game Night ticket.';

/** Reads a ticket QR's text, or the whole link it sits in. */
export function decodeTicket(text: string): Decoded<{ v: 1 } & TicketInfo> {
  if (typeof text !== 'string' || text.length > 2000) return { ok: false, reason: NOT_A_TICKET };
  let body = text.trim();
  const at = body.search(/[#?&]t=/);
  if (at >= 0) body = body.slice(at + 3);
  const parts = splitN(body, '.', 5);
  if (!parts || parts[0] !== TICKET_PREFIX) return { ok: false, reason: NOT_A_TICKET };
  const [, code, started, tierText, rawName] = parts as [string, string, string, string, string];
  const decoded = decodeTypedCode(code);
  if (!decoded.ok) return { ok: false, reason: NOT_A_TICKET };
  if (!/^[0-9a-z]{1,12}$/.test(started)) return { ok: false, reason: NOT_A_TICKET };
  const tiers = [...tierText].map((l) => LETTER_PATTERNS.get(l));
  if (tiers.length === 0 || tiers.some((p) => !p) || new Set(tiers).size !== tiers.length) return { ok: false, reason: NOT_A_TICKET };
  let name: string;
  try {
    name = decodeURIComponent(rawName);
  } catch {
    return { ok: false, reason: NOT_A_TICKET };
  }
  if (name.trim() === '' || name.length > 60) return { ok: false, reason: NOT_A_TICKET };
  return {
    ok: true,
    ticket: {
      v: 1,
      game: decoded.ticket.game,
      ticket: decoded.ticket.ticket,
      name,
      rows: decoded.ticket.rows,
      startedAt: Number.parseInt(started, 36),
      tiers: tiers as Pattern[],
    },
  };
}

/** Splits into exactly `n` parts at the first n − 1 separators (the last part may hold the separator). */
function splitN(text: string, sep: string, n: number): string[] | null {
  const out: string[] = [];
  let rest = text;
  for (let i = 0; i < n - 1; i++) {
    const k = rest.indexOf(sep);
    if (k < 0) return null;
    out.push(rest.slice(0, k));
    rest = rest.slice(k + 1);
  }
  out.push(rest);
  return out;
}

// ---------- The claim QR (TAM-177): the ticket, its number, the game code and the prize ----------

export interface ClaimInfo {
  readonly game: string;
  readonly ticket: number;
  readonly pattern: Pattern;
  readonly rows: Rows;
}

/** The claim QR's text: "C1.<typed code>.<prize letter>". */
export function encodeClaim(claim: ClaimInfo): string {
  return [CLAIM_PREFIX, typedCode(claim).replace(/-/g, ''), PATTERN_LETTERS[claim.pattern]].join('.');
}

const NOT_A_CLAIM = "This isn't a claim QR. Ask the player to tap Show claim on their phone.";

export function decodeClaim(text: string): { ok: true; claim: { v: 1 } & ClaimInfo } | { ok: false; reason: string } {
  if (typeof text !== 'string' || text.length > 200) return { ok: false, reason: NOT_A_CLAIM };
  const parts = text.trim().split('.');
  if (parts.length !== 3 || parts[0] !== CLAIM_PREFIX) return { ok: false, reason: NOT_A_CLAIM };
  const pattern = LETTER_PATTERNS.get(parts[2]!);
  const decoded = decodeTypedCode(parts[1]!);
  if (!pattern || !decoded.ok) return { ok: false, reason: NOT_A_CLAIM };
  return { ok: true, claim: { v: 1, game: decoded.ticket.game, ticket: decoded.ticket.ticket, pattern, rows: decoded.ticket.rows } };
}

/**
 * The host reads a claim QR against its own copy (TAM-177, TAM-179). Pure: it changes nothing. Refusals are
 * never bogeys: another game, a ticket not in this game, a QR that doesn't match the host's copy (then the host
 * can check the ticket by number), a prize not in play or already won, a ticket that is out or on paper.
 */
export function readClaim(
  view: TambolaView,
  text: string,
): { ok: true; ticket: number; pattern: Pattern } | { ok: false; reason: string; checkByNumber?: number } {
  let d: ReturnType<typeof decodeClaim>;
  try {
    d = decodeClaim(text);
  } catch {
    return { ok: false, reason: NOT_A_CLAIM };
  }
  if (!d.ok) {
    let isTicket = false;
    try {
      isTicket = decodeTicket(text).ok;
    } catch {
      // Not a ticket either.
    }
    return { ok: false, reason: isTicket ? "This is a ticket QR, not a claim. Ask the player to tap Show claim." : d.reason };
  }
  const c = d.claim;
  if (!isGameCode(c.game) || c.game !== view.code) return { ok: false, reason: `This claim is for another game (code ${c.game}).` };
  const mine = view.tickets.find((t) => t.number === c.ticket);
  if (!mine) return { ok: false, reason: `Ticket ${c.ticket} is not in this game.` };
  if (JSON.stringify(mine.rows) !== JSON.stringify(c.rows)) {
    return { ok: false, reason: `This claim doesn't match ticket ${c.ticket}.`, checkByNumber: c.ticket };
  }
  if (!isPattern(c.pattern) || !view.tiers.some((t) => t.pattern === c.pattern)) {
    return { ok: false, reason: `${PATTERN_NAMES[c.pattern]} is not a prize in this game.` };
  }
  if (!view.openPatterns.includes(c.pattern)) return { ok: false, reason: `${PATTERN_NAMES[c.pattern]} already won.` };
  if (mine.status === 'out') return { ok: false, reason: `Ticket ${c.ticket} is out.` };
  if (mine.status === 'paper') return { ok: false, reason: `Ticket ${c.ticket} plays on paper now: record the anchor's decision with Record a win.` };
  return { ok: true, ticket: c.ticket, pattern: c.pattern };
}
