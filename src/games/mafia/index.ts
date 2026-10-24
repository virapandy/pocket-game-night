// Mafia's registration: the only file other code may import from this game.
// For now the pure rules only (specs/mafia/api.md, MAF-H1 to MAF-H6); the screens come in later lanes.
//   The rule API: mafiaRules, mafiaCounts, readMafiaNight, readTestSeeds.
//   The morning stories content/mafia/stories.json (npm run build:stories, MAF-037).
// Not on Home or the picker yet: What Am I? is released first (owner, 24 October).
import type { GameInfo } from '../../engine';

export {
  mafiaRules, mafiaCounts, keptCount as mafiaKeptCount, readMafiaNight, readTestSeeds, STORIES as mafiaStories,
  QUIET_NIGHT as mafiaQuietNight,
  type MafiaConfig, type MafiaMove, type MafiaState, type MafiaView, type MafiaPlayerView, type NightJob as MafiaNightJob,
  type Role as MafiaRole, type MafiaNight, type MafiaNightGame, type MafiaTestSeeds,
} from './rules';

export const mafiaInfo: GameInfo = {
  id: 'mafia',
  title: 'Mafia',
  // MAF-001: the picker card's line.
  tagline: 'Find the Mafia before they find you · 5–16 players · 15–30 min a game',
};
