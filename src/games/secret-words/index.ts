// Secret Words' registration: the only file other code may import from this game.
// For now the pure rules only (specs/secret-words/api.md, Test hooks item 1); the screens come in later lanes.
//   The rule API: secretWordsRules, boardFromCode, codeFor, parseMapCode, nextMapCode, pickDeck, penaltyCell,
//   reduceLetters, clueWarning, readSecretWordsEvening, readTestSeeds.
//   The word list content/secret-words/words.json and team names content/secret-words/team-names.json
//   (npm run build:words, SWD-099, SWD-013).
import type { GameInfo } from '../../engine';

export {
  secretWordsRules, boardFromCode, codeFor, parseMapCode, nextMapCode, pickDeck, penaltyCell, reduceLetters, clueWarning,
  readSecretWordsEvening, readTestSeeds, candidates as secretWordsCandidates, teamsProblem as secretWordsTeamsProblem,
  WORDS as secretWordsWords, TEAM_NAMES as secretWordsTeamNames,
  type SecretWordsConfig, type SecretWordsMove, type SecretWordsState, type SecretWordsView, type SecretWordsChoices,
  type SecretWordsWord, type SecretWordsEvening, type Teams as SecretWordsTeams, type Team as SecretWordsTeam,
  type Kind as SecretWordsKind,
} from './rules';

// Screen lane B: the turn on the host (src/games/secret-words/ui/turn/Turn.tsx, how the app uses it at its top).
export { SecretWordsPlay, type SecretWordsPlayProps } from './ui/turn/Turn';
export { showingNight as secretWordsShowingNight } from './ui/turn/store';

export const secretWordsInfo: GameInfo = {
  id: 'secret-words',
  title: 'Secret Words',
  // SWD-001: the picker card's line.
  tagline: 'Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game',
};

// ---- Screens (lane A: Home rows, the picker's card, Join's code entry, the board-phone dialog, setup) ----
import { SecretWordsScreen, type SecretWordsStart } from './ui/SecretWordsScreen';
import {
  BoardPhoneDialog, boardPhoneAsk, CodeEntry, endUnfinished, lastNightRow, MapPhone, nightRow, NightRowButton, readMapCode,
  readMapLink, resumeCard, SavedMapRow, startNewAsk, StartNewNightDialog, type MapCodeError, type MapToOpen,
} from './ui/MapOpen';
import { isNight } from './ui/evening';

export type { SecretWordsStart, MapCodeError as SecretWordsMapCodeError, MapToOpen as SecretWordsMapToOpen };

export const secretWords = {
  info: secretWordsInfo,
  /** Setup and the game on the host phone. */
  Screen: SecretWordsScreen,
  /** A saved game of this game. */
  isNight,
  /** SWD-115: Home's unfinished row (three lines), or null. */
  homeRow: (saved: Parameters<typeof nightRow>[0]) => nightRow(saved, false),
  NightRowButton,
  /** SWD-115: the picker's resume card. */
  resumeCard,
  /** SWD-115: the unfinished game night and the Start new dialog's paragraph. */
  startNewAsk,
  StartNewNightDialog,
  /** SWD-067: "Start new (ends that one)". */
  endUnfinished,
  /** SWD-115: "Last game night". */
  lastNightRow,
  /** SWD-002, SWD-036, SWD-133: opening a map. */
  readMapCode,
  readMapLink,
  boardPhoneAsk,
  BoardPhoneDialog,
  CodeEntry,
  MapPhone,
  SavedMapRow,
  /** SWD-002: Secret Words' line on "Join a game". */
  joinLine: "Secret Words clue givers: scan the host's code to get your secret map.",
};
