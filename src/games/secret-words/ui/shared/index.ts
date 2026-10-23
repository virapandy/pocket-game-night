// Secret Words' shared screen pieces (built in screen lane B, reused by lanes C and D; build-plan.md §2). Import them
// from here. The stylesheet (sw.css) holds their looks and the team colours.
import './sw.css';

export { BoardGrid, cellName, fitWords, type GridCell } from './BoardGrid';
export { GUARD_MS, SwMain, useGuard } from './guard';
export { KindIcon, PauseGlyph } from './icons';
export { Announcer, GameMenu, MapKey, PauseButton, SwDialog, TeamBar, WhereLine, WordCounts, type MenuItem } from './parts';
export { useShrinkToFit } from './shrink';
export {
  playSound, soundOn, useMediaQuery, useNow, usePageVisibility, useReducedMotion, useViewport, useWakeLock, vibrate,
  type SoundName, type Viewport,
} from './device';
