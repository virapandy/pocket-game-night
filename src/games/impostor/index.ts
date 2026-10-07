// Impostor's registration: the only file other code may import from this game.
// The game's card, its guest line, its screens, its saved evenings and the pure rules (impostorRules on the engine's
// GameRules, specs/impostor/).
//
// Test hooks (specs/impostor/README.md, "Test hooks the build provides"):
//   1, the rule API exported below (impostorRules, pickImpostor, pickStarter, pickWord, scoreRound,
//   readImpostorEvening, readTestSeeds; plus eveningTotals for IMP-042); 2, the word list content/impostor/words.json
//   (npm run build:words, IMP-055); 3, pgn.test.seeds read at a new evening's first "Start round", except in the
//   release build (`--mode release`); 4, Pointer Events on the hold pad; 5, timers on setTimeout and Date.now();
//   6, visibilitychange and pagehide; 8, wake lock and vibration; 9, the deal's test ids; 12, the "Larger text" and
//   "Tap to show instead of hold" switches; 13, pgn.pref.impostor.*, pgn.pref.largerText, pgn.impostor-ui.<id> and
//   saved evenings under pgn.game.<id>.
//   7, the four sounds and window.__sounds (ui/device.ts); 10, Share (ui/Summary.tsx); and the test ids of the talk,
//   vote, reveal, result, summary and History.
import type { GameInfo, SavedGame, SavedGameStore, Preferences } from '../../engine';
import { impostorRules } from './rules';
import {
  clearUi, clock, describeEvening, endEvening, eveningOpens, loadEvening, pendingSummary, roundToShow, sweepEvenings, unfinishedEvening,
  unfinishedLine,
} from './ui/evening';
import { ImpostorPastGame, ImpostorScreen } from './ui/ImpostorScreen';
import { ImpostorSettings } from './ui/Sheets';
import { useTapGuard } from './ui/parts';

export {
  impostorRules, pickImpostor, pickStarter, pickWord, scoreRound, readImpostorEvening, readTestSeeds, eveningTotals,
  WORDS as impostorWords,
  type ImpostorConfig, type ImpostorMove, type ImpostorState, type ImpostorView, type ImpostorWord, type Choices as ImpostorChoices,
} from './rules';
export type { ImpostorOpen } from './ui/ImpostorScreen';

export const impostorInfo: GameInfo = {
  id: 'impostor',
  title: 'Impostor',
  // IMP-001: the card's line on "What shall we play?".
  tagline: "Find who doesn't know the word · 3–20 players · about 4 min a round",
};

/** IMP-001: the unfinished game, for "What shall we play?" (the resume card and the "Start new" dialog). */
function unfinished(store: SavedGameStore): { id: string; round: number; label: string; startedAt: string } | null {
  const u = unfinishedEvening(store);
  return u
    ? { id: u.saved.id, round: roundToShow(u.match.state), label: unfinishedLine(u.saved), startedAt: clock(u.saved.createdAt) }
    : null;
}

/** IMP-001 "Start new": `endEvening` at once, with no summary (deleted when it has no counted round, IMP-097). */
function endNow(store: SavedGameStore, ui: Preferences, id: string) {
  const saved = store.get(id);
  const match = saved && loadEvening(saved);
  if (saved && match) endEvening(store, saved as Parameters<typeof endEvening>[1], match);
  clearUi(ui, id);
}

export const impostor = {
  info: impostorInfo,
  Screen: ImpostorScreen,
  PastGame: ImpostorPastGame,
  rules: impostorRules,
  /** IMP-096: false for a saved evening that no longer replays; the app then never lists it. */
  opens: eveningOpens,
  /** History and session rows: players and counted rounds. */
  describe: describeEvening,
  /** Home's unfinished row (IMP-001): "Impostor · Riya, Arjun and 2 more · round 4". */
  unfinishedLine: (saved: SavedGame) => unfinishedLine(saved),
  unfinished,
  endNow,
  /** IMP-104: evenings left more than 12 hours end by themselves. Run before anything lists unfinished games. */
  sweep: (store: SavedGameStore, ui: Preferences) => sweepEvenings(store, ui, Date.now()),
  /** IMP-101: an evening whose summary was showing and was not left: the app opens on it again. */
  pendingSummary,
  /** IMP-094: History lists an evening in progress as one row, "In progress" (a tap resumes it). */
  listsInProgress: true,
  /** IMP-103: the past evening's button in History. */
  reuseLabel: 'Play again',
  /** IMP-109: "Larger text", "Tap to show instead of hold" and "Skipped words", for the app's Settings. */
  Settings: ImpostorSettings,
  /**
   * I29: Impostor's 500 ms tap guard, also on Home and "What shall we play?" (the screens an Impostor game starts and
   * ends on). Returns the `onClickCapture` handler for the screen's outer element.
   */
  useTapGuard,
  /** IMP-002: the last line of "Join a game". */
  joinNote: "Playing Impostor? It's all on the host's phone. Nothing to join, just play along!",
};
