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

export interface TambolaConfig {
  readonly ticketMode: 'paper';
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
  | { readonly type: 'remove-player'; readonly playerId: string };

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
}

/** One recorded winner or bogey, in order. */
export interface ClaimView {
  readonly playerId: string;
  readonly pattern: Pattern;
  readonly verdict: 'accepted' | 'bogey';
  /** This winner's share after ties (TAM-086, TAM-087); none with "No money". */
  readonly prize?: number;
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
}
