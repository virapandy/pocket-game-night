// Mafia's registration: the only file other code may import from this game.
// The pure rules (specs/mafia/api.md, MAF-H1 to MAF-H6) and the screens (lane M2: setup S1–S4 and the room frame; lane M4:
// the morning, day and results in ui/Day.tsx and ui/Results.tsx; the private screens are stand-ins in ui/StandIns.tsx
// until their lane replaces them).
//   The rule API: mafiaRules, mafiaCounts, readMafiaNight, readTestSeeds.
//   The morning stories content/mafia/stories.json (npm run build:stories, MAF-037).
//   MAF-H6: `mafia.openTestLoad` opens `localStorage['pgn.test.load']` (development and preview builds only).
// Not on Home or the picker yet: What Am I? is released first (owner, 24 October). The app reaches the screens through
// the test hooks, a reload during a game night, or (later) Home's row via `mafia.homeRow`.
import type { GameInfo } from '../../engine';
import { mafiaRules as rules } from './rules';
import { MafiaScreen } from './ui/MafiaScreen';
import { historyRows } from './ui/history';
import { PastGame } from './ui/Past';
import { homeRow, openTestLoad, reloadNight, unfinishedNight } from './ui/tonight';

export type { MafiaStart } from './ui/MafiaScreen';

export {
  mafiaRules, mafiaCounts, keptCount as mafiaKeptCount, readMafiaNight, readTestSeeds, STORIES as mafiaStories,
  QUIET_NIGHT as mafiaQuietNight, STORY_EDITIONS as mafiaStoryEditions, MAFIA_STORY_EDITION,
  type MafiaConfig, type MafiaMove, type MafiaState, type MafiaView, type MafiaPlayerView, type NightJob as MafiaNightJob,
  type Role as MafiaRole, type MafiaNight, type MafiaNightGame, type MafiaTestSeeds,
} from './rules';

export const mafiaInfo: GameInfo = {
  id: 'mafia',
  title: 'Mafia',
  // MAF-001: the picker card's line.
  tagline: 'Find the Mafia before they find you · 5–16 players · 15–30 min a game',
};

export const mafia = {
  info: mafiaInfo,
  rules,
  Screen: MafiaScreen,
  /** MAF-H6 (item 34): stores `pgn.test.load`'s game night on this phone and returns its id (null in the release build). */
  openTestLoad,
  /** The unfinished Mafia game night on this phone (MAF-091), or null. */
  unfinishedNight,
  /** MAF-091 / PO 30: Home's two lines for an unfinished game night. */
  homeRow,
  /** MAF-093: History's rows for a saved game night, one per game that is over. */
  historyRows,
  /** MAF-093: one past game from History, with "Play again". */
  PastGame,
  /** A reload's game night: the unfinished one, or one ended on Tonight's summary (item 27). */
  reloadNight,
};
