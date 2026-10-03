// Impostor's shapes: setup, moves, state and views (specs/impostor/README.md, Test hooks item 1).

/** The 9 categories, named and ordered exactly as IMP-007. */
export const CATEGORIES = [
  'Food', 'Festivals and occasions', 'Around the house', 'Travel and places', 'Films, music and TV',
  'Cricket and games', 'School and childhood', 'Weddings and family', 'Desi life',
] as const;

/** One word of content/impostor/words.json (IMP-055). */
export interface ImpostorWord {
  readonly id: string;
  readonly word: string;
  readonly other_names: string;
  readonly category: string;
  readonly audience: 'family' | 'grownups';
  readonly nonveg: boolean;
  readonly hint: string;
}

export interface Choices {
  readonly mode: 'easy' | 'hard';
  readonly talking: 'free' | 'timer';
  readonly score: boolean;
  readonly words: 'family' | 'grownups';
  readonly categories: readonly string[];
  readonly nonveg: boolean;
}

/** IMP-005 and IMP-007: the first-ever defaults. */
export const DEFAULT_CHOICES: Choices = {
  mode: 'easy', talking: 'free', score: false, words: 'family', categories: [...CATEGORIES], nonveg: false,
};

/** The word sets frozen when the evening starts (IMP-052, IMP-096). */
export interface ExcludedWords {
  readonly dealtTonight: readonly string[];
  readonly recent: readonly string[];
  readonly blocked: readonly string[];
}

/** A forced deal (Test hooks item 3): development and preview builds only. */
export interface TestDeal {
  readonly wordId?: string;
  readonly impostor?: string;
  readonly starter?: string;
}

export interface ImpostorConfig {
  /** Seat order at the first "Start round". */
  readonly players: readonly string[];
  readonly choices: Choices;
  readonly excludedWords: ExcludedWords;
  readonly testDeals?: readonly TestDeal[];
}

export interface WordFilter {
  readonly words: 'family' | 'grownups';
  readonly categories: readonly string[];
  readonly nonveg: boolean;
  readonly usedTonight: ReadonlySet<string>;
  readonly recent: ReadonlySet<string>;
  readonly blocked: ReadonlySet<string>;
  readonly allowRepeats: boolean;
}

export type ImpostorMove =
  | { readonly type: 'startDeal'; readonly practice: boolean }
  | { readonly type: 'seen' }
  | { readonly type: 'dontKnow' }
  | { readonly type: 'startTalk' }
  | { readonly type: 'anotherRoundOfClues' }
  | { readonly type: 'voteNow' }
  | { readonly type: 'reveal'; readonly player: string }
  | { readonly type: 'tie'; readonly players: readonly string[] }
  | { readonly type: 'stillTie' }
  | { readonly type: 'showWord' }
  | { readonly type: 'verdict'; readonly right: boolean }
  | { readonly type: 'nextRound' }
  | { readonly type: 'dealAgain' }
  | { readonly type: 'allowRepeats' }
  | { readonly type: 'wordDidntWork'; readonly blocked: boolean }
  | { readonly type: 'setPlayers'; readonly players: readonly string[] }
  | { readonly type: 'setChoices'; readonly choices: Choices }
  | { readonly type: 'endEvening' };

/** Where a round is: deal, clues, talk, vote (picker), revote, caught (impostor revealed), guess (word shown), result. */
export type RoundStep = 'deal' | 'clues' | 'talk' | 'vote' | 'revote' | 'caught' | 'guess' | 'result';

export interface Round {
  /** Counted rounds before this one + 1; null for the practice round. */
  readonly number: number | null;
  readonly practice: boolean;
  /** The round's players, in seat order. */
  readonly players: readonly string[];
  readonly wordId: string;
  readonly impostor: string;
  readonly step: RoundStep;
  readonly seen: number;
  readonly starter: string | null;
  readonly secondClues: boolean;
  readonly tied: readonly string[] | null;
  readonly revealed: string | null;
  readonly stillTie: boolean;
  readonly verdict: boolean | null;
  /** "This word didn't work" is on for this round's word. */
  readonly wordBlocked: boolean;
  /** Whether that tap added the word to the blocked set (false when it was already blocked, say from excludedWords). */
  readonly blockAdded: boolean;
  /** This round's points, when it was scored. */
  readonly points: Readonly<Record<string, number>> | null;
}

export interface ImpostorState {
  readonly seeds: { readonly word: string; readonly starter: string };
  readonly testDeals: readonly TestDeal[];
  readonly frozen: ExcludedWords;
  /** Current players, in seat order. */
  readonly players: readonly string[];
  readonly choices: Choices;
  /** ready: before "Start the deal"; noWords: a deal found no word (IMP-052); round: a round is dealt. */
  readonly phase: 'ready' | 'noWords' | 'round';
  /** Whether the deal waiting in noWords is the practice round. */
  readonly pendingPractice: boolean;
  readonly round: Round | null;
  readonly over: boolean;
  /** Counted rounds completed (IMP terms). */
  readonly counted: number;
  /** Rounds dealt so far, redeals included: picks each deal's seed and forced deal. */
  readonly dealCount: number;
  /** Starters picked so far: picks each starter's seed. */
  readonly starterPicks: number;
  /** Words dealt this evening (redeals and practice included). */
  readonly dealt: readonly string[];
  /** The evening's blocked words: the frozen ones, plus "Don't know this word?" and "This word didn't work". */
  readonly blocked: readonly string[];
  readonly allowRepeats: boolean;
  readonly startedThisCycle: readonly string[];
  /** The impostor of each completed round, oldest first. */
  readonly recentImpostors: readonly string[];
  /** The record number (`seq`) of the verdict that "Undo" may still take back (IMP-037), or null. */
  readonly undoVerdictSeq: number | null;
  /** Every player's total over the scored rounds, players who left included (IMP-042). */
  readonly totals: Readonly<Record<string, number>>;
}

export type PlayerView = { readonly role: 'crew'; readonly wordId: string } | { readonly role: 'impostor' } | null;

export interface TableView {
  readonly round: number | null;
  readonly practice: boolean;
  readonly players: readonly string[];
  readonly starter: string | null;
  readonly impostor?: string;
  readonly wordId?: string;
}

export type ImpostorView = TableView | PlayerView;
