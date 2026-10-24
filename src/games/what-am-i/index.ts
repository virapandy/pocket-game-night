// What Am I?'s registration: the only file other code may import from this game.
// For now the pure rules only (specs/what-am-i/api.md, WAI-H1); the screens come in later lanes, so the game is not on
// Home or the picker yet.
//   The rule API: whatAmIRules, queueFor, and the pure pieces the screens will use (the marking decision, the where-line,
//   Home's row and the tip line, the saved game night).
//   The word list content/what-am-i/words.json (npm run build:words, from docs/games/what-am-i/words.csv).
import type { GameInfo } from '../../engine';
import { whatAmIRules as whatAmIRulesForApp } from './rules';

export {
  whatAmIRules, queueFor, headOf as whatAmIHead, packOf as whatAmIPackOf, wordText as whatAmIWordText, eligible as whatAmIEligible,
  packCount as whatAmIPackCount, validChoices as whatAmIValidChoices, playersProblem as whatAmIPlayersProblem,
  readWhatAmINight, WORDS as whatAmIWords, PACKS as whatAmIPacks,
  pitch, countdownReference, steadyReference, startMotion, motionEvent, tapArea, pauseRect, timeLeftText, tickTimes,
  rotationEvent, startRotation, COUNTDOWN_BEEPS, FLASH_MS, GUARD_MS, HOLD_MS,
  whereLine as whatAmIWhereLine, homeLine1 as whatAmIHomeLine1, homeLine2 as whatAmIHomeLine2, clockText, playersShort,
  joinNames, tipLine as whatAmITipLine,
  type WaiConfig, type WaiMove, type WaiState, type WaiView, type WaiWord, type Choices as WhatAmIChoices,
  type Pack as WhatAmIPack, type PackChoice as WhatAmIPackChoice, type Hold as WhatAmIHold, type GameResult as WhatAmIResult,
  type Tonight as WhatAmITonight, type WhatAmINight, type PhoneTips as WhatAmIPhoneTips, type Motion, type MarkKind, type Sample,
  type Rect, type Rotation,
} from './rules';

export const whatAmIInfo: GameInfo = {
  id: 'what-am-i',
  title: 'What Am I?',
  // WAI-001: the picker card's line.
  tagline: 'Phone on your forehead, the room gives clues · One phone, passed round · 2–20 players',
};

/** Registered for the app once the screens exist (later lanes); not in hostGames or games until then. */
export const whatAmI = {
  info: whatAmIInfo,
  rules: whatAmIRulesForApp,
};
