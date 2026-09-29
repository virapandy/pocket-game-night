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
  t: { game: string; ticket: number; rows: Rows; name?: string; startedAt?: number; tiers?: readonly Pattern[] },
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

const CUE_WORDS: Readonly<Record<Pattern, string>> = {
  'early-five': '5 numbers of',
  'top-line': 'the top row of',
  'middle-line': 'the middle row of',
  'bottom-line': 'the bottom row of',
  'four-corners': 'the four corners of',
  'full-house': 'every number of',
  'second-full-house': 'every number of',
};

/**
 * TAM-195: where the player's own marks fill a prize of this game. Based only on their marks: never a verdict.
 * One line per filled prize, and the cells to outline per ticket.
 */
export function patternCue(game: PhoneGameFacts): { lines: string[]; cells: Map<number, Set<number>> } {
  const crossed = crossedOut(game);
  const prizes = prizesOf(game).filter((p) => !crossed.has(p));
  // Second Full House fills exactly when Full House does: say it once.
  const said = prizes.filter((p) => p !== 'second-full-house' || !prizes.includes('full-house'));
  const lines: string[] = [];
  const cells = new Map<number, Set<number>>();
  for (const t of game.tickets) {
    const marks = marksOn(game, t.number);
    const numbers = numbersOn(t.rows);
    for (const p of said) {
      const need = patternCells(t.rows, p);
      const filled = p === 'early-five' ? numbers.filter((n) => marks.has(n)).length >= 5 : need.every((n) => marks.has(n));
      if (!filled) continue;
      lines.push(`Your marks fill ${CUE_WORDS[p]} ticket ${t.number}. Shout if it's right!`);
      const set = cells.get(t.number) ?? new Set<number>();
      need.forEach((n) => set.add(n));
      cells.set(t.number, set);
    }
  }
  return { lines, cells };
}
