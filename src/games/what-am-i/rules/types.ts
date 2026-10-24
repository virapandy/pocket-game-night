// What Am I?'s shapes (specs/what-am-i/api.md): the word list, the choices, the moves, the state and the view.

export const PACKS = [
  'Animals', 'Food', 'Around the house', 'Jobs', 'Sports and cricket', 'Festivals and places', 'Act it out', 'Famous Indians',
] as const;
export type Pack = (typeof PACKS)[number];
export type PackChoice = Pack | 'mix';
export type Hold = 'hand' | 'free';
export type TurnTime = 30 | 60 | 90;

/** One row of content/what-am-i/words.json (built from docs/games/what-am-i/words.csv). */
export interface WaiWord {
  readonly id: string;
  readonly word: string;
  readonly pack: Pack;
  readonly audience: 'family';
  readonly nonveg: boolean;
  readonly edition: number;
  readonly retired_in: number | null;
}

/** S2's choices (WAI-003). */
export interface Choices {
  readonly pack: PackChoice;
  readonly time: TurnTime;
  readonly hold: Hold;
  readonly nonveg: boolean;
  readonly sounds: boolean;
}

/** WAI-H7: `testWords` replaces the whole word list for this game night. */
export interface WaiConfig {
  /** WAI-092: the word list's edition this game night started with (missing: edition 1). */
  readonly edition?: number;
  readonly testWords?: readonly WaiWord[];
}

export type WaiMove =
  | { readonly type: 'start'; readonly players: readonly string[]; readonly choices: Choices }
  | { readonly type: 'got'; readonly word: string }
  | { readonly type: 'pass'; readonly word: string }
  | { readonly type: 'timeUp'; readonly word?: string }
  | { readonly type: 'pause'; readonly turn: boolean; readonly word?: string }
  | { readonly type: 'resume' }
  | { readonly type: 'skip' }
  | { readonly type: 'scoreTurn' }
  | { readonly type: 'undoScore' }
  | { readonly type: 'fix'; readonly word: string }
  | { readonly type: 'addPlayer'; readonly name: string }
  | { readonly type: 'leave'; readonly player: string }
  | { readonly type: 'reorder'; readonly order: readonly string[] }
  | { readonly type: 'setHold'; readonly player: string; readonly hold: Hold }
  | { readonly type: 'setChoices'; readonly choices: Choices }
  | { readonly type: 'setPlayers'; readonly players: readonly string[] }
  | { readonly type: 'endGame' }
  | { readonly type: 'endEvening' };

export type Step = 'new' | 'pass' | 'turn' | 'review' | 'gameOver' | 'ended';

/** The open turn: from its first move to Save score. */
export interface OpenTurn {
  readonly player: string;
  readonly got: readonly string[];
  readonly passed: readonly string[];
  /** Ids now showing ↺ (in the other list from where they were marked). */
  readonly moved: readonly string[];
  readonly endedEarly: boolean;
  /** Every word shown in this turn, in the order shown (got, passed and the time-up word). */
  readonly shown: readonly string[];
}

/** A turn saved by Save score. */
export interface SavedTurn {
  readonly round: number;
  readonly player: string;
  readonly got: number;
  /** The turn's passed words after fixes, in the order shown. */
  readonly passed: readonly string[];
  readonly moved: number;
  readonly endedEarly: boolean;
}

export interface GameResult {
  readonly game: number;
  readonly winners: readonly string[];
  readonly top: number;
  readonly bestTurn: { readonly player: string; readonly got: number } | null;
  readonly passed: readonly string[];
  readonly moved: number;
  readonly endedEarly: number;
  readonly turns: number;
}

export interface Tonight {
  readonly players: readonly string[];
  readonly games: number;
  readonly got: number;
  readonly wins: readonly { readonly player: string; readonly wins: number }[];
  readonly best: { readonly players: readonly string[]; readonly got: number } | null;
}

/** An ended game, kept for tonight's summary. */
export interface PastGame {
  readonly result: GameResult;
  readonly turns: readonly SavedTurn[];
}

export interface WaiState {
  /** The word list in use (the shipped list, or WAI-H7's test list). */
  readonly words: readonly WaiWord[];
  /** seeds.words: never in a view. */
  readonly seed: string;
  readonly step: Step;
  readonly paused: boolean;
  /** The pause was made from T2 or T3 (`pause { turn: true }`). */
  readonly pausedTurn: boolean;
  /** The open or last game's gameIndex; 0 before the first start. */
  readonly game: number;
  readonly choices: Choices | null;
  /** Current players, in turn order. */
  readonly order: readonly string[];
  /** Players who left this game and have not rejoined, in the order they left. */
  readonly left: readonly string[];
  /** Each player's own hold for the rest of this game (WAI-014). */
  readonly holds: Readonly<Record<string, Hold>>;
  /** This game's scores, leavers included. */
  readonly scores: Readonly<Record<string, { readonly score: number; readonly turns: number }>>;
  readonly round: number;
  /** Players who saved a turn in this round (leavers included). */
  readonly played: readonly string[];
  /** Players added during this round (WAI-011 tip 1). */
  readonly joined: readonly string[];
  readonly turn: OpenTurn | null;
  /** This game's saved turns, in order. */
  readonly saved: readonly SavedTurn[];
  /** The queue's unshown part (ids), next word first; a Mix of all fallback is appended here. */
  readonly unshown: readonly string[];
  /** The Mix of all fallback has been appended this game (pack not Mix of all). */
  readonly fallback: boolean;
  /** Word texts shown tonight, oldest first (a word shown again moves to the end). */
  readonly shownTonight: readonly string[];
  /** Word texts shown in this game: they rejoin the queue only once its unshown part is empty. */
  readonly shownThisGame: readonly string[];
  /** The state just before the last Save score, while Undo is still allowed. */
  readonly undo: WaiState | null;
  readonly result: GameResult | null;
  readonly past: readonly PastGame[];
}

export interface WaiView {
  readonly step: Step;
  readonly paused: boolean;
  readonly game: number;
  readonly round: number;
  readonly player: string | null;
  readonly order: readonly string[];
  readonly toPlay: readonly string[];
  readonly left: readonly string[];
  readonly holds: Readonly<Record<string, Hold>>;
  readonly choices: Choices | null;
  readonly turn: {
    readonly got: readonly string[];
    readonly passed: readonly string[];
    readonly moved: readonly string[];
    readonly endedEarly: boolean;
  } | null;
  readonly scoreboard: readonly { readonly player: string; readonly score: number; readonly turns: number; readonly left: boolean }[];
  readonly passedByRound: readonly (readonly string[])[];
  readonly result: GameResult | null;
  readonly tonight: Tonight;
}
