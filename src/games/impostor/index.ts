// Impostor's registration: the only file other code may import from this game.
// The game's card, its guest line, a placeholder screen, and the pure rules (impostorRules on the engine's
// GameRules, specs/impostor/). The screens follow in later steps (docs/games/impostor/scenarios.md, Test hooks).
//
// Test hooks (scenarios.md, "Test hooks the build provides"):
//   Used now: 1, the rule API exported below (impostorRules, pickImpostor, pickStarter, pickWord, scoreRound,
//   readImpostorEvening, readTestSeeds; plus eveningTotals for IMP-042); 2, the word list content/impostor/words.json
//   (npm run build:words, IMP-055); config.testDeals in the rules (item 3, rules side).
//   Needed by the later build, not added yet: 3, reading pgn.test.seeds outside the release build (`--mode release`); 4, Pointer Events on the hold pad; 5, timers on setTimeout/setInterval and
//   Date.now(); 6, visibilitychange and pagehide; 7, the four Web Audio sounds and window.__sounds; 8, wake lock and
//   vibration; 9, the Impostor test ids (resume-card and Home's Impostor row included); 10, Share; 11, fetch only;
//   12, the "Larger text" and "Tap to show instead of hold" switches; 13, the pgn.pref.impostor.* and
//   pgn.impostor-ui.<id> keys and saved evenings under pgn.game.<id>.
import type { GameInfo } from '../../engine';
import { ImpostorScreen } from './ui/ImpostorScreen';

export {
  impostorRules, pickImpostor, pickStarter, pickWord, scoreRound, readImpostorEvening, readTestSeeds, eveningTotals,
  WORDS as impostorWords,
  type ImpostorConfig, type ImpostorMove, type ImpostorState, type ImpostorView, type ImpostorWord, type Choices as ImpostorChoices,
} from './rules';

export const impostorInfo: GameInfo = {
  id: 'impostor',
  title: 'Impostor',
  // IMP-001: the card's line on "What shall we play?".
  tagline: "Find who doesn't know the word · 3–20 players · about 4 min a round",
};

export const impostor = {
  info: impostorInfo,
  Screen: ImpostorScreen,
  /** IMP-002: the last line of "Join with my ticket". */
  joinNote: "Playing Impostor? It's all on the host's phone. Nothing to join, just play along!",
};
