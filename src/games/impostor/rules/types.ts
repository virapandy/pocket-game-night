// Impostor's shapes: setup, moves, state and views (specs/impostor/README.md, Test hooks item 1).

/** The 9 categories, named and ordered exactly as IMP-007 (4 October 2026). */
export const CATEGORIES = [
  'Food', 'Festivals and occasions', 'Around the house', 'Out and about', 'Films, music and TV',
  'Sports and games', 'School and childhood', 'Weddings and family', 'Everyday moments',
] as const;

/** IMP-009: category names from before 4 October, and the names they became. */
export const RENAMED_CATEGORIES: Readonly<Record<string, string>> = {
  'Travel and places': 'Out and about',
  'Cricket and games': 'Sports and games',
  'Desi life': 'Everyday moments',
};

/** One word of content/impostor/words.json (IMP-055). */
export interface ImpostorWord {
  readonly id: string;
  readonly word: string;
  readonly other_names: string;
  readonly category: string;
  readonly audience: 'family' | 'grownups';
  readonly nonveg: boolean;
  readonly hint: string;
  /** IMP-054: a retired word is never dealt, but still resolves for replay and History. */
  readonly retired: boolean;
}

export interface Choices {
  readonly mode: 'easy' | 'hard';
  readonly talking: 'free' | 'timer';
  readonly score: boolean;
  readonly words: 'family' | 'grownups';
  readonly categories: readonly string[];
  readonly nonveg: boolean;
  /**
   * IMP-076: the last-chance guess after a caught impostor. Off for a new evening unless chosen; a saved evening whose
   * choices have no `lastGuess` reads as on (every evening before version 3 had the guess).
   */
  readonly lastGuess: boolean;
}

/** IMP-005, IMP-007 and IMP-076: the first-ever defaults (the last-chance guess off). */
export const DEFAULT_CHOICES: Choices = {
  mode: 'easy', talking: 'free', score: false, words: 'family', categories: [...CATEGORIES], nonveg: false, lastGuess: false,
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

/**
 * The id of the word a move deals (Test hooks item 1, scenarios v3.5): `null` when no word is left (the no-words
 * screen). Live, the rules list the id the deal's own seed picks; replay accepts any id of the shipped list.
 */
export type DealtWordId = string | null;

export type ImpostorMove =
  | { readonly type: 'startDeal'; readonly practice: boolean; readonly wordId: DealtWordId }
  | { readonly type: 'seen' }
  | { readonly type: 'dontKnow'; readonly wordId: DealtWordId }
  | { readonly type: 'startTalk' }
  | { readonly type: 'anotherRoundOfClues' }
  | { readonly type: 'voteNow' }
  | { readonly type: 'reveal'; readonly player: string }
  | { readonly type: 'tie'; readonly players: readonly string[] }
  | { readonly type: 'stillTie' }
  | { readonly type: 'showWord' }
  | { readonly type: 'verdict'; readonly right: boolean }
  | { readonly type: 'nextRound'; readonly wordId: DealtWordId }
  | { readonly type: 'dealAgain'; readonly wordId: DealtWordId }
  | { readonly type: 'allowRepeats'; readonly wordId: DealtWordId }
  | { readonly type: 'wordDidntWork'; readonly blocked: boolean }
  | { readonly type: 'setPlayers'; readonly players: readonly string[] }
  /** IMP-078 "Finish this round first": the player stays in this round and leaves at its result. */
  | { readonly type: 'leaveAfterRound'; readonly player: string }
  /** IMP-078 "Deal again without Kabir": one move that removes the player and deals the same round again. */
  | { readonly type: 'dealAgainWithout'; readonly player: string; readonly wordId: DealtWordId }
  /** `wordId` only when it redeals the same round from the no-words screen (IMP-052). */
  | { readonly type: 'setChoices'; readonly choices: Choices; readonly wordId?: DealtWordId }
  | { readonly type: 'endEvening' };

/** A move as the screens ask for it: a word-dealing move before the rules fill in its `wordId`. */
export type AskedMove = ImpostorMove extends infer M ? (M extends { wordId: DealtWordId } ? Omit<M, 'wordId'> & { readonly wordId?: DealtWordId } : M) : never;

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
  /** IMP-078: the players who left at this round's result ("Finish this round first"), in the order marked. */
  readonly left: readonly string[];
}

export interface ImpostorState {
  readonly seeds: { readonly word: string; readonly starter: string };
  readonly testDeals: readonly TestDeal[];
  readonly frozen: ExcludedWords;
  /**
   * Current players, in seat order (the list the next deal deals): mid-round it holds this round's players, then
   * anyone added during the round (IMP-079); pending leavers stay in it until a round reaches its result (IMP-078).
   */
  readonly players: readonly string[];
  /** IMP-078: pending leavers ("Finish this round first"), removed at the round's result or by `endEvening`. */
  readonly leaving: readonly string[];
  readonly choices: Choices;
  /** ready: before "Start the deal"; noWords: a deal found no word (IMP-052); round: a round is dealt. */
  readonly phase: 'ready' | 'noWords' | 'round';
  /** Whether the deal waiting in noWords is the practice round. */
  readonly pendingPractice: boolean;
  readonly round: Round | null;
  readonly over: boolean;
  /** Counted rounds completed (IMP terms). */
  readonly counted: number;
  /**
   * Words dealt so far, redeals included (a deal that finds no word does not count): deal n draws its word, impostor
   * and starter from its own seeds and takes `testDeals[n-1]`.
   */
  readonly dealCount: number;
  /** Words dealt this evening (redeals and practice included). */
  readonly dealt: readonly string[];
  /** The evening's blocked words: the frozen ones, plus "Don't know this word?" and "This word didn't work". */
  readonly blocked: readonly string[];
  readonly allowRepeats: boolean;
  readonly startedThisCycle: readonly string[];
  /** The impostor of each completed round, oldest first. */
  readonly recentImpostors: readonly string[];
  /** Moves accepted so far: the position of the latest move among the records (rebuilt identically by replay). */
  readonly moves: number;
  /**
   * The verdict that "Undo" may still take back (IMP-037): its position among the records (the `moves` count after
   * it), and its time stamp. Null when nothing can be undone.
   */
  readonly undoVerdictSeq: number | null;
  readonly undoVerdictAt: number | null;
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
