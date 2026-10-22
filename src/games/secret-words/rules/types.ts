// Secret Words' shapes: setup, moves, state and views (specs/secret-words/README.md, Test hooks item 1;
// specs/secret-words/api.md).

export type Team = 'orange' | 'teal';
export type Kind = Team | 'nobody' | 'landmine';
export type BoardSize = 'full' | 'easy';
export type Audience = 'family' | 'grownups';

/** One word of content/secret-words/words.json (SWD-099). */
export interface SecretWordsWord {
  readonly id: string;
  readonly word: string;
  readonly meanings: string;
  readonly category: string;
  readonly audience: Audience;
  readonly nonveg: boolean;
  readonly edition: number;
  readonly retired_in: number | null;
}

/** One pair of content/secret-words/team-names.json (SWD-013). */
export interface SecretWordsTeamNames {
  readonly id: string;
  readonly orange: string;
  readonly teal: string;
}

export interface SecretWordsChoices {
  readonly map: 'pass' | 'shared' | 'own';
  readonly board: BoardSize;
  readonly landmine: 'lose' | 'turn';
  readonly words: Audience;
}

export interface Teams {
  readonly orange: readonly string[];
  readonly teal: readonly string[];
  readonly clueGivers: { readonly orange: string | null; readonly teal: string | null };
  /** SWD-123. */
  readonly partners: { readonly orange: string | null; readonly teal: string | null };
  readonly names: SecretWordsTeamNames;
  readonly guessOnly: readonly string[];
}

export interface SecretWordsConfig {
  readonly players: readonly string[];
  readonly teams: Teams;
  readonly splits: number;
  readonly choices: SecretWordsChoices;
  /** Word ids of the 3 most recently started other evenings, frozen at evening creation (SWD-024). */
  readonly excludedWords: { readonly recent: readonly string[] };
  /** Test hooks item 2: the code of deal i + 1 (deals and new boards counted together). */
  readonly testBoards?: readonly string[];
}

export type ClueNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'inf';

export type SecretWordsMove =
  | { readonly type: 'deal'; readonly code: string }
  | { readonly type: 'dealNew'; readonly code: string }
  | { readonly type: 'mapSeen' }
  | { readonly type: 'clue'; readonly n: ClueNumber; readonly word?: string }
  | { readonly type: 'reveal'; readonly cell: number; readonly freeCell?: number }
  | { readonly type: 'endTurn' }
  | { readonly type: 'brokeRule'; readonly cell: number }
  | { readonly type: 'nextTurn' }
  | { readonly type: 'endGame' }
  | { readonly type: 'setTeams'; readonly teams: Teams; readonly splits: number }
  | { readonly type: 'setClueGivers'; readonly clueGivers: Teams['clueGivers']; readonly partners: Teams['partners'] }
  | { readonly type: 'setChoices'; readonly choices: SecretWordsChoices }
  | { readonly type: 'setPlayers'; readonly players: readonly string[]; readonly teams: Teams; readonly renames?: Readonly<Record<string, string>> }
  | { readonly type: 'endEvening' };

/** How a turn ended (SWD-103). */
export type TurnEnd = 'rule' | 'landmine' | 'stopped' | 'allowance' | 'nobody' | 'other';

/** A clue in force this game, with the words it found (Terms "Found", SWD-128). */
export interface ClueInForce {
  readonly team: Team;
  readonly n: ClueNumber;
  readonly word?: string;
  readonly found: number;
}

export interface LastTurn {
  readonly team: Team;
  readonly found: number;
  readonly ended: TurnEnd;
  readonly cell?: number;
}

/** The board a code gives (SWD-022). */
export interface Board {
  readonly words: readonly string[];
  readonly ids: readonly string[];
  readonly kinds: readonly Kind[];
  readonly starts: Team;
  readonly edition: number;
  readonly board: BoardSize;
  readonly audience: Audience;
}

export type GameStep = 'clue' | 'guessing' | 'turn-over' | 'over';

/** The board in play: from its deal (or "New board") to its result. */
export interface GameState {
  readonly code: string;
  readonly words: readonly string[];
  readonly ids: readonly string[];
  readonly kinds: readonly Kind[];
  readonly starts: Team;
  readonly turned: readonly boolean[];
  readonly step: GameStep;
  readonly turn: Team;
  /** T: the turn number on this board, from 1. */
  readonly turnNo: number;
  readonly mapSeen: boolean;
  readonly clue: { readonly n: ClueNumber; readonly word?: string } | null;
  readonly guesses: number;
  readonly found: number;
  readonly ended: TurnEnd | null;
  readonly endedCell: number | null;
  readonly lastTurn: LastTurn | null;
  readonly clues: readonly ClueInForce[];
  /** SWD-122: each team's guessing turns on this board so far (r). */
  readonly guessTurns: { readonly orange: number; readonly teal: number };
  readonly picker: string | null;
  readonly winner: Team | null;
  readonly endedEarly: boolean;
  /** Won by the Landmine (Lose the game). */
  readonly landmine: boolean;
}

/** A finished game of the evening: won, or ended early (SWD-064). */
export interface PastGame {
  readonly number: number;
  readonly winner: Team | null;
  readonly endedEarly: boolean;
  readonly landmine: boolean;
  readonly code: string;
  readonly clueGivers: { readonly orange: readonly string[]; readonly teal: readonly string[] };
  readonly clues: readonly ClueInForce[];
}

/** Where the evening's deck stands (SWD-024): deck number k, deck seed d, deal index n. */
export interface DeckPlace {
  readonly k: number;
  readonly d: number;
  readonly n: number;
  readonly board: BoardSize;
  readonly words: Audience;
}

export interface SecretWordsState {
  readonly dealSeed: string;
  readonly testBoards: readonly string[];
  readonly recent: readonly string[];
  readonly players: readonly string[];
  readonly teams: Teams;
  readonly splits: number;
  readonly choices: SecretWordsChoices;
  /** The deck place of the last deal made from the deck (not a test board). */
  readonly deck: DeckPlace | null;
  /** The next deal's place and code from the deck (SWD-024), worked out ahead so listing moves stays cheap. */
  readonly plan: DeckPlace & { readonly code: string };
  /** This evening's words: every id on any board dealt (SWD-024). */
  readonly dealt: readonly string[];
  /** D: deals and new boards so far. */
  readonly deals: number;
  readonly game: GameState | null;
  readonly games: readonly PastGame[];
  readonly ended: boolean;
}

export interface SecretWordsCell {
  readonly word: string;
  readonly kind?: Kind;
}

export interface SecretWordsView {
  readonly cells: readonly SecretWordsCell[];
  readonly clueWord: string | null;
  readonly clue: ClueNumber | null;
  readonly guessesLeft: number | 'unlimited' | null;
  readonly clues: readonly ClueInForce[];
  readonly lastTurn: LastTurn | null;
  readonly turn: Team;
  readonly left: { readonly orange: number; readonly teal: number };
  readonly picker: string | null;
  readonly step: GameStep | 'before' | 'ended';
  readonly winner: Team | null;
  readonly endedEarly: boolean;
}
