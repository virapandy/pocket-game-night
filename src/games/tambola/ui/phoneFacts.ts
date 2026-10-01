// What a player's phone knows about its game (Phase 2), kept in one place on the phone. Every fact says where it
// came from: "player" (their own marks and crossed-out prizes) today; "host" facts (called numbers, won prizes)
// can be added later by connected mode (TAM-211) through the same place, without changing the screens that read
// it (quick mark, the pattern cue, the claim picker). See docs/games/tambola/ux-phone-tickets.md, section 6.
import type { Preferences } from '../../../engine';
import { cornerNumbers, isPattern, numbersOn, PATTERNS, rowNumbers, type Pattern, type Rows } from '../rules';

export type Source = 'player' | 'host';

export type Fact =
  | { readonly kind: 'marked'; readonly ticket: number; readonly n: number; readonly source: Source }
  | { readonly kind: 'won'; readonly pattern: Pattern; readonly source: Source };

export interface PhoneTicketCopy {
  readonly number: number;
  readonly rows: Rows;
}

/** The game on this phone: its tickets and every fact about it. */
export interface PhoneGameFacts {
  readonly v: 1;
  readonly game: string;
  /** From the ticket QR; unknown if the ticket was typed in (the typed code carries only the ticket). */
  readonly name: string | null;
  readonly startedAt: number | null;
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
    tiers: Array.isArray(g.tiers) ? g.tiers.filter(isPattern) : null,
    cue: g.cue === true,
    tickets,
    facts,
  };
}

export function savePhoneGame(prefs: Preferences, game: PhoneGameFacts | null) {
  prefs.set(GAME_KEY, game);
}

/**
 * Adds a scanned or typed ticket. A ticket of the same game joins the others; a ticket of a new game replaces
 * the old game's tickets, marks and all (TAM-171).
 */
export function addTicket(
  current: PhoneGameFacts | null,
  t: { game: string; ticket: number; rows: Rows; name?: string; startedAt?: number; tiers?: readonly Pattern[]; cue?: boolean },
): PhoneGameFacts {
  const same = current && current.game === t.game ? current : null;
  const tickets = [...(same?.tickets ?? []).filter((x) => x.number !== t.ticket), { number: t.ticket, rows: t.rows }].sort(
    (a, b) => a.number - b.number,
  );
  return {
    v: 1,
    game: t.game,
    name: t.name ?? same?.name ?? null,
    startedAt: t.startedAt ?? same?.startedAt ?? null,
    tiers: t.tiers ?? same?.tiers ?? null,
    // A scanned QR says whether the host turned the cue on; a typed code says nothing, so it stays as it was (off
    // for a new game).
    cue: t.cue ?? same?.cue ?? false,
    tickets,
    facts: same?.facts ?? [],
  };
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

/** How the cue line names each prize (TAM-195, owner 2026-10-01): "Ticket 3: top row filled". */
export const CUE_WORDS: Readonly<Record<Pattern, string>> = {
  'early-five': 'Early Five filled',
  'top-line': 'top row filled',
  'middle-line': 'middle row filled',
  'bottom-line': 'bottom row filled',
  'four-corners': 'four corners filled',
  'full-house': 'Full House filled',
  'second-full-house': 'Full House filled',
};

export interface CueFill {
  readonly ticket: number;
  readonly pattern: Pattern;
}

/**
 * TAM-195: where the player's own marks fill a prize of this game, only when the host turned the cue on. Based
 * only on their marks: never a verdict. Each fill (ticket order; Early Five last on a ticket, as the lines and
 * corners say more), and the cells to outline per ticket.
 */
export function patternCue(game: PhoneGameFacts): { fills: CueFill[]; cells: Map<number, Set<number>> } {
  const fills: CueFill[] = [];
  const cells = new Map<number, Set<number>>();
  if (!game.cue) return { fills, cells };
  const crossed = crossedOut(game);
  const prizes = prizesOf(game).filter((p) => !crossed.has(p));
  // Second Full House fills exactly when Full House does: say it once.
  const said = prizes
    .filter((p) => p !== 'second-full-house' || !prizes.includes('full-house'))
    .sort((a, b) => Number(a === 'early-five') - Number(b === 'early-five'));
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
function ticketList(numbers: readonly number[]): string {
  if (numbers.length === 1) return `Ticket ${numbers[0]}`;
  return `Tickets ${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}`;
}

/**
 * The cue's one line (TAM-195, row 1a): "Ticket 3: top row filled. Shout if it's right!", or with fills on several
 * tickets "Tickets 1 and 3: patterns filled. Shout if it's right!". `more` is true when there is more to say.
 */
export function cueLine(fills: readonly CueFill[]): { line: string; more: boolean } | null {
  if (fills.length === 0) return null;
  const tickets = [...new Set(fills.map((f) => f.ticket))];
  const what = tickets.length === 1 ? CUE_WORDS[fills[0]!.pattern] : 'patterns filled';
  return { line: `${ticketList(tickets)}: ${what}. Shout if it's right!`, more: fills.length > 1 };
}

/** Each fill in full, for "More": "Ticket 1: top row filled". */
export const cueDetail = (f: CueFill) => `Ticket ${f.ticket}: ${CUE_WORDS[f.pattern]}`;
