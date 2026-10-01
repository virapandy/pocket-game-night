// Tambola's shapes: settings, setup, moves, state and views. See tests/games/tambola/README.md.
import type { MoneyRecord } from '../../../engine';

/** Every pattern the app knows, in the order tiers are listed. */
export const PATTERNS = [
  'early-five',
  'four-corners',
  'top-line',
  'middle-line',
  'bottom-line',
  'full-house',
  'second-full-house',
] as const;
export type Pattern = (typeof PATTERNS)[number];

/** How many numbers each pattern has on a ticket (the "Check numbers" helper, TAM-139). */
export const NEEDS: Readonly<Record<Pattern, number>> = {
  'early-five': 5,
  'four-corners': 4,
  'top-line': 5,
  'middle-line': 5,
  'bottom-line': 5,
  'full-house': 15,
  'second-full-house': 15,
};

export const PATTERN_NAMES: Readonly<Record<Pattern, string>> = {
  'early-five': 'Early Five',
  'four-corners': 'Four Corners',
  'top-line': 'Top Line',
  'middle-line': 'Middle Line',
  'bottom-line': 'Bottom Line',
  'full-house': 'Full House',
  'second-full-house': 'Second Full House',
};

export function isPattern(value: unknown): value is Pattern {
  return typeof value === 'string' && (PATTERNS as readonly string[]).includes(value);
}

export type RhymeLanguage = 'en' | 'hi' | 'both';
export interface RhymeSettings {
  readonly language: RhymeLanguage;
  readonly familyFriendly: boolean;
}

export interface TambolaSettings {
  readonly ties: 'share';
  readonly lateClaims: 'bogey';
  readonly bogey: 'out' | 'carry-on';
  readonly ticketsPerPlayer: number;
  readonly maxTicketsPerPlayer: number;
  readonly lateJoinUntil: number;
  readonly autoCall: 'off' | number;
  readonly speakCalls: boolean;
  readonly autoMark: boolean;
  readonly claimButtons: boolean;
  readonly verdictsOnPhones: boolean;
  /**
   * TAM-195 (owner 2026-10-01): players' phones say when their marks fill a prize pattern. Off by default; the host
   * turns it on at the ticket-type step. Games saved before this setting existed have it off (missing = off).
   */
  readonly patternCue?: boolean;
  readonly vibrate: boolean;
  readonly sound: boolean;
  readonly rhymes: RhymeSettings;
}

export interface TambolaPlayer {
  readonly id: string;
  readonly name: string;
  readonly tickets: number;
}

export interface Tier {
  readonly pattern: Pattern;
  readonly amount: number;
  readonly label?: string;
}

/** Paper tickets from a ticket book (Phase 1a), or tickets the app makes and hands out to phones (Phase 2). */
export type TicketMode = 'paper' | 'phone';

export interface TambolaConfig {
  readonly ticketMode: TicketMode;
  readonly players: readonly TambolaPlayer[];
  /** null means "No money": prizes are text labels only (TAM-090). */
  readonly money: {
    readonly currency: 'INR';
    readonly contribution: number;
  } | null;
  /** The prizes as confirmed by the anchor. Locked for the whole game (TAM-085). */
  readonly tiers: readonly Tier[];
  readonly settings: TambolaSettings;
}

export type TambolaMove =
  | { readonly type: 'call' }
  | { readonly type: 'another-rhyme' }
  /** Paper tickets (TAM-037): the anchor checked the ticket; record a win for one or more players (a tie). */
  | {
      readonly type: 'record-win';
      readonly pattern: Pattern;
      readonly playerIds: readonly string[];
    }
  /** Paper tickets (TAM-037): the anchor ruled a bogey; record it against the player. */
  | {
      readonly type: 'record-bogey';
      readonly playerId: string;
      readonly pattern: Pattern;
    }
  /**
   * Games saved before 28 September 2026 checked typed numbers. Kept only so those games still replay
   * exactly (saved games always open); the app no longer makes this move.
   */
  | {
      readonly type: 'claim';
      readonly playerId: string;
      readonly pattern: Pattern;
      readonly numbers: readonly number[];
    }
  | { readonly type: 'close-tier'; readonly pattern: Pattern }
  | {
      readonly type: 'rename';
      readonly playerId: string;
      readonly name: string;
    }
  | { readonly type: 'end' }
  | { readonly type: 'discard' }
  /** Phase 1b, TAM-067: a late joiner with 1 to 3 tickets, while fewer than `lateJoinUntil` numbers are called. */
  | { readonly type: 'add-player'; readonly player: TambolaPlayer }
  /** Phase 1b, TAM-184: take out a late joiner added by mistake, before the next number. */
  | { readonly type: 'remove-player'; readonly playerId: string }
  /** Phase 2: the host checked a phone ticket's claim, by scanning its claim QR or typing its number (TAM-174, TAM-178). */
  | { readonly type: 'check-claim'; readonly ticket: number; readonly pattern: Pattern }
  /** Phase 2: give a ticket to another player (TAM-172, TAM-175). */
  | { readonly type: 'assign'; readonly ticket: number; readonly playerId: string }
  /** Phase 2: this player plays on paper from now on ("Can't scan? Give a paper ticket", TAM-058). */
  | { readonly type: 'to-paper'; readonly playerId: string };

/** Where a phone ticket stands: in play, out after a bogey (TAM-044), or replaced by paper (TAM-058). */
export type TicketStatus = 'in-play' | 'out' | 'paper';

/** A phone ticket on the host phone: the only copy of who holds what (TAM-056). */
export interface PhoneTicket {
  readonly number: number;
  readonly sheet: number;
  readonly rows: readonly (readonly (number | null)[])[];
  readonly playerId: string;
  readonly status: TicketStatus;
  /** How many numbers had been called when it came into the game: 0, or more for a late joiner (TAM-212). */
  readonly joinedAt: number;
}

/** A ticket as the host sees it (TAM-056), or as its owner's phone sees it (only number and rows, TAM-050). */
export interface TicketView {
  readonly number: number;
  readonly rows: readonly (readonly (number | null)[])[];
  readonly sheet?: number;
  readonly playerId?: string;
  readonly status?: TicketStatus;
}

export interface Rhyme {
  readonly n: number;
  readonly lang: 'en' | 'hi';
  readonly style: string;
  readonly familyFriendly: boolean;
  readonly text: string;
}

export interface RhymePack {
  readonly format: number;
  readonly languages: readonly string[];
  readonly styleWeights: Readonly<Record<string, number>>;
  readonly rhymes: readonly Rhyme[];
}

export interface ClaimCheck {
  readonly number: number;
  readonly called: boolean;
}

export interface ClaimRecord {
  readonly playerId: string;
  readonly pattern: Pattern;
  readonly verdict: 'accepted' | 'bogey';
  /** Only on claims from games saved before 28 September 2026, which checked typed numbers. */
  readonly numbers?: readonly number[];
  readonly checks?: readonly ClaimCheck[];
  readonly reason?: 'not-called' | 'late';
  readonly completedAt?: number;
  /** How many numbers had been called when the claim was made. */
  readonly callsBefore: number;
  /** Phase 2: the phone ticket claimed with. Its prize goes to whoever holds the ticket (TAM-175). */
  readonly ticket?: number;
  /** Phase 2, a bogey: the pattern's numbers not called yet (lines, Four Corners, Full House). */
  readonly missing?: readonly number[];
  /** Phase 2, an Early Five bogey: how many more of the ticket's numbers are needed. */
  readonly needed?: number;
}

/** A late joiner (TAM-067): when they joined, and the prizes just before, so they can be taken out again (TAM-184). */
export interface LateJoin {
  readonly playerId: string;
  readonly calledAt: number;
  readonly before: readonly Tier[];
}

/** The host phone's one true game. Holds the draw order, so it never leaves the host. */
export interface TambolaState {
  readonly config: TambolaConfig;
  /** The players listed at setup, then late joiners in the order they joined. */
  readonly players: readonly TambolaPlayer[];
  /** The prizes: as confirmed at setup, grown by late joiners' money (TAM-067). Locked otherwise (TAM-085). */
  readonly tiers: readonly Tier[];
  readonly lateJoins: readonly LateJoin[];
  /** The whole draw order, made from the draw seed at setup. Secret: views show only what is called. */
  readonly order: readonly number[];
  readonly calledCount: number;
  /** The time on each call's move record, in order (for the 5-second undo, TAM-119). */
  readonly callTimes: readonly number[];
  readonly rhyme: Rhyme | null;
  /** Seed for rhyme choices, derived from the draw seed. Host-only. */
  readonly rhymeSeed: string;
  readonly rhymeDraws: number;
  readonly claims: readonly ClaimRecord[];
  readonly closed: readonly Pattern[];
  readonly result: 'ended' | 'discarded' | null;
  /** Phase 2: every phone ticket in the game, in number order. Empty with paper tickets. */
  readonly tickets: readonly PhoneTicket[];
  /** Phase 2: the sheet seed, for late joiners' tickets (TAM-212). Host-only, like the draw order. Null with paper. */
  readonly sheetSeed: string | null;
  /** Phase 2: the 4-character game code, worked out from the game's id, never from a seed (TAM-170). */
  readonly code: string | null;
}

/** One recorded winner or bogey, in order. */
export interface ClaimView {
  readonly playerId: string;
  readonly pattern: Pattern;
  readonly verdict: 'accepted' | 'bogey';
  /** This winner's share after ties (TAM-086, TAM-087); none with "No money". */
  readonly prize?: number;
  /** Phase 2: the phone ticket, and for a bogey why (TAM-038): not called (with the numbers missing), or late. */
  readonly ticket?: number;
  readonly reason?: 'not-called' | 'late';
  readonly missing?: readonly number[];
  readonly needed?: number;
  readonly completedAt?: number;
}

export interface SummaryTier {
  readonly pattern: Pattern;
  readonly amount: number;
  readonly label?: string;
  readonly winners: readonly {
    readonly playerId: string;
    readonly amount: number;
  }[];
}

export interface TambolaSummary {
  readonly result: 'ended' | 'discarded';
  readonly callsMade: number;
  readonly pot: number | null;
  readonly tiers: readonly SummaryTier[];
  readonly bogeys: readonly {
    readonly playerId: string;
    readonly pattern: Pattern;
  }[];
  /** One per player, in setup order; null with "No money" (TAM-088, TAM-089). */
  readonly payouts: readonly Payout[] | null;
  /** The engine's record (PLT-021): paid, and "won" = prizes plus money handed back (PLT-017). */
  readonly money: MoneyRecord | null;
}

export interface Payout {
  readonly playerId: string;
  readonly name: string;
  /** Contribution × tickets. */
  readonly paid: number;
  /** Prizes only. */
  readonly won: number;
  /** This player's share of the money of tiers nobody won, equal per ticket (TAM-088). */
  readonly handedBack: number;
  /** won + handedBack − paid. */
  readonly net: number;
  /** What the host, as the bank, hands this person: won + handedBack. They add up to the pot (TAM-089). */
  readonly hostGives: number;
}

export interface TambolaView {
  readonly players: readonly { readonly id: string; readonly name: string }[];
  readonly tiers: readonly Tier[];
  readonly called: readonly number[];
  readonly current: {
    readonly number: number;
    readonly rhyme: Rhyme | null;
  } | null;
  readonly lastCalls: readonly number[];
  readonly allCalled: boolean;
  readonly openPatterns: readonly Pattern[];
  readonly awaitingClose: readonly Pattern[];
  readonly readyToEnd: boolean;
  readonly claims: readonly ClaimView[];
  readonly over: boolean;
  readonly summary: TambolaSummary | null;
  /** TAM-067: a late player can be added now. */
  readonly canAddPlayer: boolean;
  /** TAM-184: the late joiners, and whether each can still be taken out (no number called since they joined). */
  readonly lateJoiners: readonly { readonly id: string; readonly name: string; readonly tickets: number; readonly removable: boolean }[];
  /** Phase 2: the game code (TAM-170); null with paper tickets. */
  readonly code: string | null;
  /** Phase 2: the host sees every ticket (TAM-056); a player only their own (TAM-050); the room none. */
  readonly tickets: readonly TicketView[];
  /** TAM-195: the host turned the pattern cue on for players' phones (travels in the ticket QR). */
  readonly patternCue: boolean;
}
