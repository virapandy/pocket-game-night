// Impostor's registration: the only file other code may import from this game.
// First build step: the game's card, its guest line and a placeholder screen. The rules (impostorRules on the
// engine's GameRules), saved evenings and the screens follow once their tests are written
// (docs/games/impostor/scenarios.md, Test hooks).
//
// Test hooks (scenarios.md, "Test hooks the build provides"):
//   Used now: 2, the word list content/impostor/words.json (npm run build:words, IMP-055).
//   Needed by the later build, not added yet: 1, the rule API here (impostorRules, pickImpostor, pickStarter,
//   pickWord, scoreRound, readImpostorEvening, readTestSeeds); 3, pgn.test.seeds and config.testDeals outside the
//   release build (`--mode release`); 4, Pointer Events on the hold pad; 5, timers on setTimeout/setInterval and
//   Date.now(); 6, visibilitychange and pagehide; 7, the four Web Audio sounds and window.__sounds; 8, wake lock and
//   vibration; 9, the Impostor test ids (resume-card and Home's Impostor row included); 10, Share; 11, fetch only;
//   12, the "Larger text" and "Tap to show instead of hold" switches; 13, the pgn.pref.impostor.* and
//   pgn.impostor-ui.<id> keys and saved evenings under pgn.game.<id>.
import type { GameInfo } from '../../engine';
import { ImpostorScreen } from './ui/ImpostorScreen';

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
