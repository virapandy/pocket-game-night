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

/** How many numbers a paper-ticket claim must read out for each pattern. */
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
  readonly money: { readonly currency: 'INR'; readonly contribution: number } | null;
  /** The prizes as confirmed by the anchor. Locked for the whole game (TAM-085). */
  readonly tiers: readonly Tier[];
  readonly settings: TambolaSettings;
}

export type TambolaMove =
  | { readonly type: 'call' }
  | { readonly type: 'another-rhyme' }
  | { readonly type: 'claim'; readonly playerId: string; readonly pattern: Pattern; readonly numbers: readonly number[] }
  | { readonly type: 'close-tier'; readonly pattern: Pattern }
  | { readonly type: 'rename'; readonly playerId: string; readonly name: string }
  | { readonly type: 'end' }
  | { readonly type: 'discard' };

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
  readonly numbers: readonly number[];
  readonly checks: readonly ClaimCheck[];
  readonly verdict: 'accepted' | 'bogey';
  readonly reason?: 'not-called' | 'late';
  readonly completedAt?: number;
  /** How many numbers had been called when the claim was made. */
  readonly callsBefore: number;
}

/** The host phone's one true game. Holds the draw order, so it never leaves the host. */
export interface TambolaState {
  readonly config: TambolaConfig;
  readonly players: readonly TambolaPlayer[];
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

export interface ClaimView {
  readonly playerId: string;
  readonly pattern: Pattern;
  readonly numbers: readonly number[];
  readonly checks: readonly ClaimCheck[];
  readonly verdict: 'accepted' | 'bogey';
  readonly reason?: 'not-called' | 'late';
  readonly completedAt?: number;
  readonly prize?: number;
}

export interface SummaryTier {
  readonly pattern: Pattern;
  readonly amount: number;
  readonly label?: string;
  readonly winners: readonly { readonly playerId: string; readonly amount: number }[];
}

export interface TambolaSummary {
  readonly result: 'ended' | 'discarded';
  readonly callsMade: number;
  readonly pot: number | null;
  readonly tiers: readonly SummaryTier[];
  readonly bogeys: readonly { readonly playerId: string; readonly pattern: Pattern }[];
  readonly money: MoneyRecord | null;
}

export interface TambolaView {
  readonly players: readonly { readonly id: string; readonly name: string }[];
  readonly tiers: readonly Tier[];
  readonly called: readonly number[];
  readonly current: { readonly number: number; readonly rhyme: Rhyme | null } | null;
  readonly lastCalls: readonly number[];
  readonly allCalled: boolean;
  readonly openPatterns: readonly Pattern[];
  readonly awaitingClose: readonly Pattern[];
  readonly readyToEnd: boolean;
  readonly claims: readonly ClaimView[];
  readonly over: boolean;
  readonly summary: TambolaSummary | null;
}
