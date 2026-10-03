// What a player's phone knows about its game (Phase 2), kept in one place on the phone. Every fact says where it
// came from: "player" (their own marks and crossed-out prizes) today; "host" facts (called numbers, won prizes)
// can be added later by connected mode (TAM-211) through the same place, without changing the screens that read
// it (quick mark, the pattern cue, the claim picker). See docs/games/tambola/ux-phone-tickets.md, section 6.
import type { Preferences } from '../../../engine';
import { cornerNumbers, isPattern, numbersOn, PATTERN_NAMES, PATTERNS, rowNumbers, type Pattern, type Rows } from '../rules';

export type Source = 'player' | 'host';

export type Fact =
  | { readonly kind: 'marked'; readonly ticket: number; readonly n: number; readonly source: Source }
  | { readonly kind: 'won'; readonly pattern: Pattern; readonly source: Source };

export interface PhoneTicketCopy {
  readonly number: number;
  readonly rows: Rows;
  /**
   * TAM-214: who holds this ticket, from its QR (a phone may hold another player's ticket); null for a typed code,
   * which carries no name. Missing on tickets saved before 2 October 2026: those take the game's name.
   */
  readonly name?: string | null;
}

/** The game on this phone: its tickets and every fact about it. */
export interface PhoneGameFacts {
  readonly v: 1;
  readonly game: string;
  /**
   * The phone's own player: the name on the first ticket QR scanned for this game; unknown if the tickets were typed
   * in (the typed code carries only the ticket).
   */
  readonly name: string | null;
  readonly startedAt: number | null;
  /**
   * PLT-300, TAM-171 (UX list row 21): when this game's first ticket was added to this phone, the time of a ticket
   * added by typed code (which carries no start time). Missing on tickets saved before 3 October 2026.
   */
  readonly addedAt: number | null;
  /** PLT-300: when the player last tapped "Open" on Home's row of old tickets; they then open as usual for 6 hours. */
  readonly openedAt: number | null;
  readonly tiers: readonly Pattern[] | null;
  /**
   * TAM-195: the host turned the pattern cue on (from a format-2 ticket QR). Off for older QRs, typed codes and
   * games saved on this phone before the setting existed.
   */
  readonly cue: boolean;
  readonly tickets: readonly PhoneTicketCopy[];
  readonly facts: readonly Fact[];
}

const GAME_KEY = 'tambola.phone-game';
export const LAYOUT_KEY = 'tambola.phone-layout';
export const LARGE_TEXT_KEY = 'tambola.phone-large-text';
export const AWAY_KEY = 'tambola.phone-away';

export function loadPhoneGame(prefs: Preferences): PhoneGameFacts | null {
  const g = prefs.get<unknown>(GAME_KEY, null) as Partial<PhoneGameFacts> | null;
  if (!g || typeof g !== 'object' || g.v !== 1 || typeof g.game !== 'string' || !Array.isArray(g.tickets) || g.tickets.length === 0) return null;
  const tickets = g.tickets.filter((t) => t && Number.isInteger(t.number) && Array.isArray(t.rows) && t.rows.length === 3);
  if (tickets.length === 0) return null;
  const facts = (Array.isArray(g.facts) ? g.facts : []).filter(
    (f): f is Fact =>
      !!f &&
      ((f.kind === 'marked' && Number.isInteger(f.ticket) && Number.isInteger(f.n)) || (f.kind === 'won' && isPattern(f.pattern))) &&
      (f.source === 'player' || f.source === 'host'),
  );
  return {
    v: 1,
    game: g.game,
    name: typeof g.name === 'string' ? g.name : null,
    startedAt: typeof g.startedAt === 'number' ? g.startedAt : null,
    addedAt: typeof g.addedAt === 'number' ? g.addedAt : null,
    openedAt: typeof g.openedAt === 'number' ? g.openedAt : null,
    tiers: Array.isArray(g.tiers) ? g.tiers.filter(isPattern) : null,
    cue: g.cue === true,
    tickets,
    facts,
  };
}

export function savePhoneGame(prefs: Preferences, game: PhoneGameFacts | null) {
  prefs.set(GAME_KEY, game);
}

/** TAM-214, TAM-045: a phone holds at most 3 tickets of a game, its own and any it holds for others. */
export const PHONE_TICKET_LIMIT = 3;
export const PHONE_FULL = 'This phone already holds 3 tickets. Give this ticket to another phone.';

/**
 * TAM-214: adding this ticket would be a 4th of the same game. Scanning one already held is not a new one, and a
 * ticket of a new game replaces the old game's (TAM-171).
 */
export function phoneIsFull(current: PhoneGameFacts | null, game: string, ticket: number): boolean {
  if (!current || current.game !== game) return false;
  return !current.tickets.some((t) => t.number === ticket) && current.tickets.length >= PHONE_TICKET_LIMIT;
}

/** TAM-214: the name of the person who holds this ticket (null: a typed code, no name known). */
export const holderOf = (game: PhoneGameFacts, t: PhoneTicketCopy): string | null => (t.name === undefined ? game.name : t.name);

/**
 * Adds a scanned or typed ticket. A ticket of the same game joins the others; a ticket of a new game replaces
 * the old game's tickets, marks and all (TAM-171). Check `phoneIsFull` first (TAM-214).
 */
export function addTicket(
  current: PhoneGameFacts | null,
  t: { game: string; ticket: number; rows: Rows; name?: string; startedAt?: number; tiers?: readonly Pattern[]; cue?: boolean },
  /** When it is added to this phone (PLT-300: a typed-code ticket's time). */
  now: number | null = null,
): PhoneGameFacts {
  const same = current && current.game === t.game ? current : null;
  const tickets = [
    ...(same?.tickets ?? []).filter((x) => x.number !== t.ticket),
    { number: t.ticket, rows: t.rows, name: t.name ?? null },
  ].sort((a, b) => a.number - b.number);
  return {
    v: 1,
    game: t.game,
    // The phone's own player is the first name it was given; a held ticket (TAM-214) keeps its own name.
    name: same?.name ?? t.name ?? null,
    startedAt: t.startedAt ?? same?.startedAt ?? null,
    addedAt: same?.addedAt ?? now,
    openedAt: same?.openedAt ?? null,
    tiers: t.tiers ?? same?.tiers ?? null,
    // A scanned QR says whether the host turned the cue on; a typed code says nothing, so it stays as it was (off
    // for a new game).
    cue: t.cue ?? same?.cue ?? false,
    tickets,
    facts: same?.facts ?? [],
  };
}

/** PLT-300 (UX list row 21): tickets older than this open on Home, with "Open" and "Clear", instead of by themselves. */
export const OLD_TICKETS_MS = 6 * 3600_000;

/** The tickets' time (TAM-171): the game's start time from its QR, or when a typed-code ticket was added. */
export const ticketsTime = (game: PhoneGameFacts): number | null => game.startedAt ?? game.addedAt;

/**
 * PLT-300: the tickets' time is more than 6 hours ago (and they weren't opened from Home since). Saved tickets with
 * neither time, kept from before this change, count as old too.
 */
export function ticketsAreOld(game: PhoneGameFacts, now: number): boolean {
  const t = ticketsTime(game);
  if (t === null && game.openedAt === null) return true;
  return now - Math.max(t ?? 0, game.openedAt ?? 0) > OLD_TICKETS_MS;
}

/** "9:15 am" (the same day), "yesterday, 9:15 pm" or "Sat 26 Sep" (earlier), in this phone's time (PLT-300). */
export function whenWords(t: number, now: number): string {
  const d = new Date(t);
  const clock = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`;
  const today = new Date(now);
  if (d.toDateString() === today.toDateString()) return clock;
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `yesterday, ${clock}`;
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** The numbers marked on a ticket. */
export function marksOn(game: PhoneGameFacts, ticket: number): Set<number> {
  return new Set(game.facts.filter((f): f is Extract<Fact, { kind: 'marked' }> => f.kind === 'marked' && f.ticket === ticket).map((f) => f.n));
}

/** Marks or unmarks a number on one ticket (TAM-131). */
export function toggleMark(game: PhoneGameFacts, ticket: number, n: number): PhoneGameFacts {
  const has = game.facts.some((f) => f.kind === 'marked' && f.ticket === ticket && f.n === n);
  return {
    ...game,
    facts: has
      ? game.facts.filter((f) => !(f.kind === 'marked' && f.ticket === ticket && f.n === n))
      : [...game.facts, { kind: 'marked', ticket, n, source: 'player' }],
  };
}

/**
 * Quick mark (TAM-192, TAM-194): marks the number on every ticket that has it, or unmarks it if it is marked.
 * Returns the tickets it is on and whether it is now marked.
 */
export function quickMark(game: PhoneGameFacts, n: number): { game: PhoneGameFacts; on: number[]; marked: boolean } {
  const on = game.tickets.filter((t) => numbersOn(t.rows).includes(n)).map((t) => t.number);
  if (on.length === 0) return { game, on, marked: false };
  const wasMarked = on.some((t) => marksOn(game, t).has(n));
  const rest = game.facts.filter((f) => !(f.kind === 'marked' && f.n === n && on.includes(f.ticket)));
  const facts = wasMarked ? rest : [...rest, ...on.map((ticket) => ({ kind: 'marked' as const, ticket, n, source: 'player' as const }))];
  return { game: { ...game, facts }, on, marked: !wasMarked };
}

/** The prizes known to be gone, and who said so (TAM-196; the host, later, in connected mode: TAM-211). */
export function crossedOut(game: PhoneGameFacts): Map<Pattern, Source> {
  const out = new Map<Pattern, Source>();
  for (const f of game.facts) if (f.kind === 'won' && out.get(f.pattern) !== 'host') out.set(f.pattern, f.source);
  return out;
}

/** The player crosses a prize out, or undoes their own cross-out. It never undoes the host's. */
export function toggleCrossed(game: PhoneGameFacts, pattern: Pattern): PhoneGameFacts {
  const who = crossedOut(game).get(pattern);
  if (who === 'host') return game;
  return {
    ...game,
    facts:
      who === 'player'
        ? game.facts.filter((f) => !(f.kind === 'won' && f.pattern === pattern && f.source === 'player'))
        : [...game.facts, { kind: 'won', pattern, source: 'player' }],
  };
}

/** The prizes this game has; if the ticket was typed in, the phone can't know them, so every usual prize. */
export function prizesOf(game: PhoneGameFacts): Pattern[] {
  return game.tiers ? [...game.tiers] : PATTERNS.filter((p) => p !== 'second-full-house');
}

/** The cells a pattern covers on a ticket, for outlines (Early Five: none, as it is any 5). */
export function patternCells(rows: Rows, pattern: Pattern): number[] {
  switch (pattern) {
    case 'early-five':
      return [];
    case 'top-line':
      return rowNumbers(rows, 0);
    case 'middle-line':
      return rowNumbers(rows, 1);
    case 'bottom-line':
      return rowNumbers(rows, 2);
    case 'four-corners':
      return cornerNumbers(rows);
    default:
      return numbersOn(rows);
  }
}

export interface CueFill {
  readonly ticket: number;
  readonly pattern: Pattern;
}

/**
 * TAM-195: where the player's own marks fill a prize of this game, only when the host turned the cue on. Based
 * only on their marks: never a verdict. Each fill (ticket order, then the game's prize order, UX list row 1), and the
 * cells to outline per ticket.
 */
export function patternCue(game: PhoneGameFacts): { fills: CueFill[]; cells: Map<number, Set<number>> } {
  const fills: CueFill[] = [];
  const cells = new Map<number, Set<number>>();
  if (!game.cue) return { fills, cells };
  const crossed = crossedOut(game);
  const prizes = prizesOf(game).filter((p) => !crossed.has(p));
  // Second Full House fills exactly when Full House does: say it once.
  const said = prizes.filter((p) => p !== 'second-full-house' || !prizes.includes('full-house'));
  for (const t of game.tickets) {
    const marks = marksOn(game, t.number);
    const numbers = numbersOn(t.rows);
    for (const p of said) {
      const need = patternCells(t.rows, p);
      const filled = p === 'early-five' ? numbers.filter((n) => marks.has(n)).length >= 5 : need.every((n) => marks.has(n));
      if (!filled) continue;
      fills.push({ ticket: t.number, pattern: p });
      const set = cells.get(t.number) ?? new Set<number>();
      need.forEach((n) => set.add(n));
      cells.set(t.number, set);
    }
  }
  return { fills, cells };
}

/** "Tickets 1 and 3", "Tickets 1, 2 and 3". */
function ticketList(numbers: readonly number[], word = 'Ticket'): string {
  if (numbers.length === 1) return `${word} ${numbers[0]}`;
  return `${word}s ${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}`;
}

/** "Early Five and Top Line", "Early Five, Top Line and Full House". */
function andList(words: readonly string[]): string {
  return words.length === 1 ? words[0]! : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/**
 * The cue's parts (TAM-195, UX list row 1): one per ticket, in ticket order, naming its prizes in prize order: one
 * prize "Ticket 3: Top Line filled", several "Ticket 1: Early Five and Top Line filled" (product owner's answer 2).
 * Early Five is said once (rows 11 and 3), for the first ticket it fills: with that ticket's other prizes, or else on
 * its own at the end, "Early Five filled on ticket 1".
 */
export function cueParts(fills: readonly CueFill[]): string[] {
  const five = fills.find((f) => f.pattern === 'early-five')?.ticket;
  const lineTickets = [...new Set(fills.filter((f) => f.pattern !== 'early-five').map((f) => f.ticket))];
  const fold = five !== undefined && lineTickets.includes(five);
  const parts: string[] = [];
  for (const t of lineTickets) {
    const prizes = fills.filter((f) => f.ticket === t && (f.pattern !== 'early-five' || (fold && t === five))).map((f) => f.pattern);
    parts.push(`Ticket ${t}: ${andList(prizes.map((p) => PATTERN_NAMES[p]))} filled`);
  }
  if (five !== undefined && !fold) parts.push(`Early Five filled on ticket ${five}`);
  return parts;
}

/** The tickets the cue names, in the order it names them (TAM-190: "Which ticket?" lists the first one first). */
export function cueTickets(fills: readonly CueFill[]): number[] {
  const lines = [...new Set(fills.filter((f) => f.pattern !== 'early-five').map((f) => f.ticket))];
  const five = fills.find((f) => f.pattern === 'early-five')?.ticket;
  return lines.length ? lines : five !== undefined ? [five] : [];
}

const SHOUT = "Shout if it's right!";

/**
 * The cue's one line (TAM-195, UX list row 1). One part: "Ticket 1: Early Five and Top Line filled. Shout if it's
 * right!", or, when that doesn't fit, the short line "Ticket 1: patterns filled. Shout if it's right!" with "More"
 * holding the full words (so nothing is said twice, row 11). Several tickets: the approved short wording, "Tickets 1
 * and 3: patterns filled. Shout if it's right!", with "More" always there for each ticket's prizes.
 */
export function cueLine(fills: readonly CueFill[]): { line: string; short: string; more: boolean } | null {
  if (fills.length === 0) return null;
  const parts = cueParts(fills);
  const tickets = cueTickets(fills);
  const many = parts.length > 1 || parts[0]!.includes(' and ');
  const short = `${ticketList(tickets)}: ${many ? 'patterns' : 'pattern'} filled. ${SHOUT}`;
  if (parts.length === 1) return { line: `${parts[0]}. ${SHOUT}`, short, more: false };
  if (tickets.length > 1) return { line: short, short, more: true };
  // One ticket with lines, and Early Five said apart on another ticket: name the ticket, the rest under "More".
  return { line: `${parts[0]}. ${SHOUT}`, short: `${parts[0]}. ${SHOUT}`, more: true };
}
