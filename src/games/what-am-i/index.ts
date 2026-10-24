// What Am I?'s registration: the only file other code may import from this game.
// The pure rules (specs/what-am-i/api.md, WAI-H1) and, from lane W2, the screens: setup, the game's frame, Home's row, the
// Start new dialog, History's game night and the browser test hooks (window.__waiTest).
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

// ---- Screens (lane W2: setup and the game's frame; lanes W3 and W4 fill the game screens in ui/Screens.tsx) ----
import { WhatAmIScreen, type WhatAmIStart } from './ui/WhatAmIScreen';
import { NightRowButton, PastNight, StartNewNightDialog } from './ui/Open';
import { WaiSettings } from './ui/Settings';
import { installTestHooks } from './ui/hooks';
import {
  endUnfinished, historyTitle, homeRow, isNight, PREF_PREFIX, startNewAsk, sweepNights, unfinishedNight,
} from './ui/night';

export type { WhatAmIStart };

export const whatAmI = {
  info: whatAmIInfo,
  rules: whatAmIRulesForApp,
  /** Setup and the game on the host phone. */
  Screen: WhatAmIScreen,
  /** A saved What Am I? game night. */
  isNight,
  /** WAI-090, WAI-091: Home's unfinished row (two lines), or null. */
  homeRow,
  NightRowButton,
  /** The unfinished game night (to reopen after a reload), or null. */
  unfinishedId: (store: Parameters<typeof unfinishedNight>[0]) => unfinishedNight(store)?.saved.id ?? null,
  /** WAI-001: the unfinished night and the Start new dialog's body. */
  startNewAsk,
  StartNewNightDialog,
  /** "Start new (ends that one)". */
  endUnfinished,
  /** Version 1.1 item 44: nights left 12 hours end when the app opens. */
  sweep: sweepNights,
  /** WAI-092: History's row ("What Am I? · 2 games") and the past night. */
  historyTitle,
  PastNight,
  /** WAI-013: "Answer by moving the phone", for the app's Settings. */
  Settings: WaiSettings,
  /** Version 1.2 item 1: What Am I?'s line on "Join a game". */
  joinLine: "What Am I? is played on the host's phone. Ask the host to add your name.",
  /** WAI-H1b to H11: `window.__waiTest` (never in the release build). */
  installTestHooks,
  /** WAI-H11: the start of this phone's What Am I? preference keys. */
  prefPrefix: PREF_PREFIX,
};
