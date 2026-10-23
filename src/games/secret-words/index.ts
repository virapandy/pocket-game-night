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

export const secretWordsInfo: GameInfo = {
  id: 'secret-words',
  title: 'Secret Words',
  // SWD-001: the picker card's line.
  tagline: 'Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game',
};
