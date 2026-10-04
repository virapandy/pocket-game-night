# Test report
Progress (2026-10-04, tester, Impostor round 4 on main df8f362, app eb3ef8f, all lanes D, E, F, G merged): every
expected-to-fail mark removed (20 rule, all browser); whole Impostor round run. Rule tests 649 of 649. Browser: the
complete run on both phones (37171594652, tests 91a1748) and quick verify on cb2846f (37172433872) leave 5 real failures
per phone (IMP-088 "Whole family" ×4 sizes, IMP-076 Back on "More options"); 3 test faults found there are fixed
(cb2846f, 4d90864). Quick verify on this report's push: named in the hand-back.

Commit tested: app eb3ef8f (main df8f362); tests 4d90864   Date: 2026-10-04
Result: RED (2 real failures, 5 tests per phone)

## Layers (app eb3ef8f)
| Layer | Tests | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`, local and quick verify 37172433872) | 649 | 649 | 0 |
| Impostor browser, per phone (complete run 37171594652; quick verify 37172433872, Android) | 230 | 223 | 7 on 91a1748: 5 real + 2 test faults (fixed); quick verify on cb2846f: 5 real + 2 (toast's Undo, test fault, fixed in 4d90864) |
| Tambola and platform browser incl. Home, picker, Settings, History, Sessions, per phone (complete run 37171594652) | about 300 | all, except Android screenshots | 4 Android screenshot references (`screens.spec.ts`, the other session's, as before) |

## Failing (real bugs only)
- impostor-setup.spec.ts IMP-088 ""Whole family" fits on one line inside its 48 px button" at 320 × 568, 320 × 568 Larger
  text, 360 × 640, 360 × 640 Larger text (both phones; also the reviewer's note a): expected `scrollWidth ≤ clientWidth`;
  got 114 > 104, 129 > 104, 129 > 124, 159 > 124. The selected "Whole family ✓" spills out of its button.
- impostor-setup.spec.ts IMP-076 "More options: Off selected on a first evening; a change applies only on "Done"; Back
  discards it" (both phones): expected the browser's Back to close the sheet, back on "How do you want to play?" with
  "Off" still selected; got the "More options" sheet still open with "On" pressed.

## Test faults fixed this round (before any verdict; no assertion loosened)
- IMP-005 row "directly above Start round": the test demanded a gap of 32 px or less, which the spec does not say; now
  "no control between the row and Start round".
- IMP-081 overlap on the result screen: a page that scrolls as one may pass under the pinned main button; now checked
  scrolled to the end. And a toast's own "Undo" is part of the toast (allowed over text, never over a control).
- IMP-052 set-up blocked the category by both word lists; word-ids `no-words-2` left Festivals words open and writes the
  expected id of deal 3 for `setChoices` (reviewer); helper's legal-move fill does not cover `setChoices`.

## Expected to fail
- None. Impostor round 4 is built; every mark is removed (rule 20, browser all). IMP-075's open-question mark is gone:
  the "left halfway" menu as built is the spec and passes.

## Notes
- Live and replay word ids: the rules accept any listed word id live as well as on replay (the engine cannot tell them
  apart); the orchestrator accepted this, no engine change. The tests check the replay side and take live ids from the
  legal moves (or write the expected id for `setChoices`).
- Reviewer note b: evenings saved before word ids (the v2.2 fixture) are hidden, as IMP-096 v3.5 says, and that test
  passes; evenings saved with word ids by the round-4 builds reopen (IMP-001 resume, 090, 091, 096 tests pass).
- Hidden reserved buttons on screen B are checked as not visible.

## Questions
- None new. (Earlier: old `setChoices` moves without `lastGuess`: no test assumes either reading.)

## Flaky or setup problems (not for the Build workspace)
- Android screenshot references in `screens.spec.ts` (4) fail as before; the other session's, left alone.

## Requests for the Build workspace
- None.

## Notes for the owner (plain English)
- All of Impostor round 4 now works in the tests on both phones: the new result screen, summary with the winner line,
  How to play on request, the new pass-the-phone screens, the word list of 4 October and the optional last guess.
- Two small things to fix: "Whole family" does not fit its button on the two smallest phones, and the phone's Back button
  does not close the "More options" sheet.

# Round 4 step 1 report (9d0709f), kept for reference
Progress (2026-10-04, tester, Impostor round 4 step 1 on main at 9d0709f, lanes D and F merged): specs/impostor copied
from scenarios v3.5; C3 rule tests written first and marked expected-to-fail; every Impostor browser test brought to
v3.5, with those waiting for the C3 lane or the result screen marked expected-to-fail. Quick verify on b575a29 (run
37167564844): rule tests 629 passed + 20 expected-to-fail, smoke 16 of 16, Impostor browser 218 passed, 6 failed (4 real,
2 test faults fixed since). The run on this report's push is named in the hand-back.

Commit tested: app 9d0709f (tests b575a29 and this push)   Date: 2026-10-04
Result: RED (1 real failure: "Whole family" overflows its button at 320 and 360 wide, IMP-088)

## Layers (app 9d0709f)
| Layer | Tests | Passing | Expected to fail (not built) | Failing |
|---|---|---|---|---|
| Rule tests (quick verify 37167564844) | 649 | 629 | 20 (C3: word list, word ids, per-deal seeds, last-chance guess setting, v3 fixture) | 0 |
| Impostor browser, Android (same run) | 224 | 218, incl. marked tests that failed as expected | see the list below | 6 on b575a29: 4 real (IMP-088), 2 test faults, fixed in this push |
| Local Android run (3 workers, Mac load 3 to 5) | 220 | used only to set the marks; many timeouts from the Mac's load, not counted | | |

## Failing (real bugs only)
- impostor-setup.spec.ts "IMP-088 … 320 × 568 / 320 × 568 Larger text / 360 × 640 / 360 × 640 Larger text: "Whole family"
  fits on one line inside its 48 px button" (IMP-088, F12; also the reviewer's note): expected `scrollWidth ≤ clientWidth`;
  got 114 > 104 (320), 129 > 104 (320 Larger text), 129 > 124 (360), 159 > 124 (360 Larger text). The selected option
  ("Whole family ✓") is cut off or spills out of its button. The spec's label column is 56 px + 8 px gap (64 px); the
  test allows the options to start 63 to 80 px after the label.

## Test faults fixed in this push (before any verdict)
- IMP-052 "Change categories …": the set-up blocked the category's words by words.csv only; the shipped list still has
  the categories of before 4 October, so a word was left and the no-words screen never showed. Now blocked by both lists.
- IMP-075 "a round result has the between-rounds menu": marked expected-to-fail but passes (lane F built "How to play").
  Mark removed. Same for IMP-052 "the heading … Allow repeats deals".

## Expected to fail (marked; they wait for the C3 lane or the result screen)
- Rule (it.fails, 20): words.test IMP-053 json entry, IMP-054 words.json = words.csv, retired never dealt (property),
  IMP-055 shape with `retired`; word-ids.test (7): word id on every dealing move, wordId null with no word, `Allow
  repeats` / `Change categories` ids, deal 1 and deal 2 per-deal seeds, swapped ids replay with the same impostors and
  starters (property), retired id replays, missing or unknown id refused; last-guess.test (6): guess off refuses
  showWord and verdict, Next round straight after the reveal, wordDidntWork after it, practice round, switching the
  setting between rounds, guess-off points (property); saved-evening.test (3): v3 fixture's ended evening replays,
  later moves on it, the v2.2 fixture no longer replays.
- Browser (test.fail): the one result screen (IMP-033, 034, 038, 039, 073, 081 result scroll and landscape, 083
  announcer, 084 no build-up flash, 087 release at 1.5 s, 100); More options and the guess setting (IMP-009, 011 line 4,
  070 guess paragraph, 076); summary lead line and "More ›" (IMP-092, 095, 097, 098, 101); "1 more minute" and timer label
  (IMP-024); "Not sure?" (IMP-031); "How to play" from the menu with the 3 rules (IMP-070, 072) and from the choices
  screen; "New word for everyone?" record with word id (IMP-015); v3 fixture, hidden pre-3.1 evenings and word ids in
  saved moves (IMP-096); reopened result screens (IMP-091, 037); "Scores since round 4" and guess-off points (IMP-043,
  041); IMP-007 switch names (v3.5 names: lane C3 renames the list) ; IMP-088 Larger text 17 px at 320; IMP-053 result.
- IMP-075 open-question mark: removed. The "left halfway" menu as built is the spec (decisions I21) and the test passes.

## Tests updated or retired because of v3.x (scenario ID: what and why)
Rule tests (helpers: word ids filled from `legalMoves`; `DEFAULT_CHOICES` plays with `lastGuess: true`; `setChoices` in
tests of other rules uses the 6 category names common to both lists; `ACTIVE` words for pickWord):
- IMP-050, 051, 052 (words.test): pickWord given the active list; category "Cricket and games" → "Sports and games";
  IMP-051 random categories and the IMP-052 frozen-set evening use the 6 common names (changed list, same checks).
- IMP-054, 055: 311 rows / 291 active / 20 retired, retired categories allowed on retired rows, renamed words, `retired`
  in words.json (scenario changed 4 October).
- IMP-033 → IMP-039 (vote-and-reveal.test): the "guess before the word" tests now name IMP-039 (guess on); new guess-off
  tests in last-guess.test.
- IMP-015 (deal.test "not dealt again"): blocked set = every id but the two (retired words would otherwise slip in).
- IMP-096 (saved-evening.test): new format fixture `tests/fixtures/impostor-saved-evenings-v3.json` (word ids, lastGuess,
  new names); the v2.2 fixture is kept unedited as "an evening from an earlier preview build", now expected not to replay.
- Contract driver: word-dealing moves take their `wordId` from the legal moves.
Browser:
- Retired: IMP-070 read-aloud card (3 tests), IMP-075 "no menu on the read-aloud card", IMP-081/IMP-010 "block clears
  the name" hold screen (8), IMP-033/034/038 timed reveal lines (3), IMP-072 "Rules" sheet (2), IMP-083 announcer of
  reveal lines, IMP-031/033 caught flow with "Caught red-handed!" — each replaced by a v3.5 test (scenarios changed).
- Updated: IMP-016, 020, 022 clue wording; IMP-075 menus ("How to play"); IMP-014 note shown only while on; IMP-011
  impostor line 4 split by the guess setting; IMP-012 property ignores the deal-progress text, private-word 2 lines;
  IMP-013 checks the build-up, not the guess step; IMP-015 dialog; IMP-017 look-away; IMP-007 v3.5 names and colour;
  IMP-008 three taps; IMP-009 7 choices, "Same as last time", mapping; IMP-088 sizes, inner scroll, Whole family;
  IMP-091, 092, 093, 095, 097, 098, 101, 105, 106 summary and reopen; IMP-043 caption; IMP-100 word on the result.
- Hidden reserved buttons on screen B ("Done…", "Don't know this word?", "Tap instead" in tap mode) checked as not
  visible instead of not in the page (reviewer note).
- Unchanged-scenario tests whose record check met the new `wordId` (IMP-025, 052, 071, 091) now check the move type;
  the full record with `wordId` is checked in the IMP-096 browser test.
- Navigation helpers reach the same screens on the old and the new build while lanes land (marked "v2.2 build:").

## Questions
- Test hooks item 1: "Live, play accepts only the id that pickWord gives for deal n; replay accepts any recorded id".
  The engine's `play` and `replay` both call the rules' `apply`, so the rules cannot tell them apart. The tests check
  only the replay side and fill live ids from `legalMoves`. Product owner or coder: how is the live check meant to work?
- Reviewer note (b) "evenings saved by the previous build reopen correctly": the current preview build saves moves
  without `wordId`. By IMP-096 v3.5 such evenings no longer replay and are hidden once the C3 lane lands. Is that
  intended for evenings saved by today's preview, or should a move without `wordId` be read once from the list?
- Old evenings whose `setChoices` moves have no `lastGuess`: do those read as on as well (IMP-096 names only the saved
  choices)? No test assumes either.

## Flaky or setup problems (not for the Build workspace)
- Local browser run took 1.9 h at 3 workers; about 15 tests timed out on the owner's Mac (load) and passed on GitHub.

## Requests for the Build workspace
- None.

## Notes for the owner (plain English)
- The new Impostor rules (word list of 4 October, last guess as a setting, saved evenings that stay the same when the
  word list changes) now have tests waiting for the build. The screens already built today (passing the phone, setup,
  How to play on request, clue wording) pass their updated tests.
- One real problem: on the two smallest phones "Whole family" does not fit inside its button.

# Round 3 report (f01d78b), kept for reference
Progress (2026-10-03, tester, Impostor round 3 on main at f01d78b, the fix for round 2's one failure): the hold screen
at 320 × 568 with Larger text (IMP-081 / IMP-010) now passes on both phones. Nothing else regressed: every Impostor and
Tambola browser test passes on both phones, except the IMP-075 mark (open question) and the same 4 Android screenshot
references (the other session's, left alone). No test changed this round.

Commit tested: f01d78b (app and tests; f01d78b changes only `src/games/impostor/ui/impostor.css`)   Date: 2026-10-03
Automation (the verdict): complete run 37139451171 (f01d78b, both phones, report only): Android 560 passed, 4 failed
(the 4 screenshots), 1 skipped; iPhone 534 passed, 0 failed, 31 skipped (screenshot and Android-only tests). No flaky
or retried test. Quick verify 37139429154 (f01d78b, Android): green; rule tests 627 of 627, smoke 16 of 16, changed
areas 411 passed, 1 skipped, 0 failed.
Result: GREEN for Impostor apart from the IMP-075 mark and the 4 known Android screenshots (the complete run itself is
red only on those 4 screenshots)

## Layers (f01d78b)
| Layer | Tests | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`, on GitHub: complete run "check" and quick verify) | 627 | 627 | 0 |
| Impostor browser, per phone (complete run 37139451171) | 184 | 183 + 1 marked (IMP-075 open question) | 0 |
| Tambola and platform browser, per phone (same run) | 381 | all, except 4 Android screenshots | 4 Android screenshots (not behaviour, left alone) |

## Round-2 failure, now
| Scenario | Test | On f01d78b |
|---|---|---|
| IMP-081 / IMP-010 | impostor-round-screens.spec.ts "320 × 568, Larger text: after "Don't know this word?" appears, the block clears the name and the pad; nothing scrolls" | passes, both phones (the 360, 390 and 812 sizes and the round 2 room-screen overlap checks also pass) |

## Failing (real bugs only)
- None.

## Expected to fail
Still marked: 1 per phone, unchanged: impostor-round-screens.spec.ts IMP-075 the "left halfway" screen has the
between-rounds menu (open question for the product owner; fails only on "Change how we play").

## Screenshots to refresh and approve (Android; the other session's, left alone)
`host-game-over-payouts-360x640`, `host-verdict-proof-812x375`, `player-quick-mark-360x640`, `player-quick-mark-812x375`:
unchanged.

## Questions
- IMP-075 / IMP-091 (product owner): "Change how we play" on the "left halfway" screen (unchanged).
- PLT-006 with IMP-102: which comes first, an unfinished Tambola setup or tonight's Impostor names (unchanged; worth one
  line in a spec).

## Flaky or setup problems (not for the Build workspace)
- The owner's Mac: load average about 150. A local `npm test` could not start its workers (31 "Timeout waiting for
  worker" errors, no test ran; not a test failure) and a 2-worker retry printed nothing. The rule test result here is
  GitHub's (627 of 627, twice). No local browser run.

## Requests for the Build workspace
- None.

## Notes for the owner (plain English)
- The last problem from round 2 is fixed: on the smallest phone with "Larger text" on, the player's secret no longer
  sits on top of their name while they look at their word.
- Everything else in Impostor and Tambola still works on both phones. Two things stay open, as before: one question
  about the "left halfway" screen's menu, and 4 Tambola pictures waiting for approval from the other session.

# Round 2 report (60b1f5c), kept for reference
Progress (2026-10-03, tester, Impostor round 2 on main at 60b1f5c, the fixes for round 1's failures on c857400): rule
tests 627 of 627 pass. Browser, both phones, on GitHub (the owner's Mac was at a load of 85 to 170 and could not start
browsers in 10 minutes): every round-1 failure is fixed except one size: the hold screen at 320 × 568 with Larger text
(IMP-081 / IMP-010). IMP-006 is now checked and passes. The reviewer's new layout checks pass on both phones. Tambola:
every Tambola test passes on both phones except the same 4 Android screenshot references (the other session's).

Commit tested: 60b1f5c (app), tests at 8d37788   Date: 2026-10-03
Automation (the verdict): complete run 37138281343 (tests 8d37788, both phones, report only): Android 559 passed,
5 failed (1 real + the 4 screenshots), 1 skipped; iPhone 533 passed, 1 failed (real), 31 skipped (screenshot and
Android-only tests). Quick verify 37138269803 (tests 8d37788, Android): 410 passed, 1 failed (the same real one),
1 skipped. Earlier this round: complete run 37137437557 and quick verify 37137434663 (tests c131ec1) failed also on
a fault in the new overlap test, fixed in 8d37788 (below). Quick verify on this report's push: named in the hand-back.
Result: RED (1 real failure)

## Layers (60b1f5c)
| Layer | Tests | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`, local) | 627 | 627 | 0 |
| Impostor browser, per phone (complete run 37138281343) | 184 (8 new) | 182 + 1 marked (IMP-075 open question) | 1 real (IMP-081 / IMP-010, 320 × 568 Larger text) |
| Tambola and platform browser, per phone (same run; setup, Home, History, Sessions included) | 381 | all, except 4 Android screenshots | 4 Android screenshots (not behaviour, left alone) |

## Round-1 failures, now
| Scenario | Test | On 60b1f5c |
|---|---|---|
| IMP-102 | impostor-play-screens "Play something else … Tambola's setup arrives with tonight's names" | passes, both phones |
| IMP-003 | impostor-setup ""← Back" … the list is kept when the host comes back in the same visit" | passes, both phones |
| IMP-083 | impostor-play-screens "the announcer gets the countdown and each reveal line" | passes, both phones |
| IMP-034 / IMP-006 | impostor-round-screens "IMP-006: "Change how we play" on a result …" (Hard, Timer, escaped) | passes, both phones: the reveal now reaches its result, and IMP-006 itself is checked |
| IMP-099 / IMP-101 | impostor-saved-evenings "the summary's 3 hours" | passes, both phones |
| IMP-001 | impostor-setup IMP-001 dialog and IMP-070 Home row ("9:30 pm") | passes on GitHub's iPhone and Android; the Mac-only iPhone check could not be run (Mac load) |
| IMP-088 | impostor-setup "320 × 568 … no page scrolling" | passes, both phones |
| IMP-081 / IMP-010 | impostor-round-screens hold screen | 320 × 568, 360 × 640 (Larger text off and on) and 390, 812 pass; **320 × 568 with Larger text still fails** (below) |

## Failing (real bugs only)
- IMP-081 / IMP-010, impostor-round-screens.spec.ts "320 × 568, Larger text: after "Don't know this word?" appears,
  the block clears the name and the pad; nothing scrolls" (both phones, complete run and quick verify): with the
  longest word and the 16-character name "Alexandrapetrova", the private block (y 67–355) starts inside the player's
  name (y 62–87): "Your secret" is printed over "ALEXANDRAPETROVA" (seen in the run's trace). Expected: block and name
  apart, block wholly above the pad, nothing scrolling. 320 × 568 without Larger text now passes.

## New tests this round (all pass on both phones)
- impostor-play-screens.spec.ts "IMP-081: the room screens at 320 × 568 and 360 × 640: nothing drawn over anything
  else" (4: each size, Larger text off and on), the reviewer's check: deal screen A, clues, talk with the timer,
  countdown, picker (before and after a pick), the reveal steps, the result and its "Samosa won't come up again ·
  Undo" toast, with the practice chip, a 16-character name and the longest word. On each: no page scrolling, main button
  wholly on screen, chip shown, and no two controls or lines of text drawn over each other (`overlapping` in
  `tests/browser/impostor.ts`); the toast wholly on screen and above the main button (README "Toast").
- impostor-setup.spec.ts "320 × 568, Larger text off and on: "Who's playing?" with four 16-character names" (IMP-003
  rows): no sideways scrolling, every name in full, ▲ ▼ ✕ at least 44 × 44, field, "Add" and "Next" within the width,
  nothing drawn over anything else at the top and the bottom of the page.
- IMP-088 at 812 × 375 (2 × 2 grid, "Start round" overlapping no group): the existing test, passes on both phones.
- impostor-play-screens.spec.ts "IMP-089 sound off": Home → "⋯ Menu" → "Settings" → "This phone" → "Sound" unticked
  (saved as `sound: false` in `pgn.pref.tambola.settings`); a whole round to the reveal plays no sound.
- impostor-play-screens.spec.ts "IMP-102 and PLT-024: on a phone with no game tonight, Tambola started from Home still
  has empty name boxes" and "IMP-102 and PLT-006: an unfinished Tambola setup still comes first after "Play something
  else"" (Zoya, Farhan, Ira, not tonight's Impostor players).

## Tests changed this round (test fault in a new test, before any verdict; no assertion loosened)
- The new overlap check measured a line of text by its whole line box. The 200 px countdown "3" has about 40 px of
  empty space above the digit, which touched the box of "point…" above it, though the screen shows clear space between
  them (trace frame checked). Lines now count from 0.2 em below their top to 0.1 em above their bottom.

## Expected to fail
Still marked: 1 per phone, unchanged.
| File | Test | Why |
|---|---|---|
| impostor-round-screens.spec.ts | IMP-075 the "left halfway" screen has the between-rounds menu | open question for the product owner; fails only on "Change how we play" |

## Screenshots to refresh and approve (Android; the other session's, left alone)
`host-game-over-payouts-360x640`, `host-verdict-proof-812x375`, `player-quick-mark-360x640`, `player-quick-mark-812x375`:
unchanged from round 1.

## Questions
- IMP-075 / IMP-091 (product owner): "Change how we play" on the "left halfway" screen (unchanged).
- PLT-006 with IMP-102: the specs do not yet say which comes first when an unfinished Tambola setup and tonight's
  Impostor names both exist. The new test follows the orchestrator's instruction (the draft comes first); worth one
  line in PLT-006 or IMP-102 so it is written down.

## Flaky or setup problems (not for the Build workspace)
- The owner's Mac: load average 85 to 170 all round; a 4-file local browser run printed nothing in 10 minutes and was
  stopped. Every browser result here is from GitHub. The Mac-only iPhone "9:30 PM" check (round 1) is therefore not
  re-checked; GitHub's iPhone shows "9:30 pm".

## Requests for the Build workspace
- None.

## Notes for the owner (plain English)
- Seven of the eight problems from the last round are fixed: Tambola now gets tonight's names after Impostor, the
  player list survives going back, screen readers hear the word, the hard-mode reveal finishes, the 3-hour limit is
  exact, the choices screen fits a small phone, and the times read "pm".
- One is left: on the smallest phone with "Larger text" on, the player's secret starts on top of their name while
  they look at their word.

# Round 1 report (c857400), kept for reference
Progress (2026-10-03, tester, the whole of Impostor on main at c857400): rule tests 627 of 627 pass. Browser, both
phones, on GitHub (the owner's Mac was under macOS system load, about 140, and could not start browsers): 176 Impostor
tests per phone (49 new in `impostor-play-screens.spec.ts`); every expected-to-fail mark is off except one open question
(IMP-075 "left halfway" menu). Real failures: IMP-102 (Tambola names after Impostor), IMP-081 hold screen at 320 and
360, IMP-088 at 320, IMP-003 "← Back" list, IMP-083 (word line not announced), IMP-034 in Hard + Timer (escaped reveal
stops), IMP-099/101 (summary's "Oops" gone at exactly 3 hours). Tambola: every Tambola test passes on both phones in the complete run,
except 4 Android screenshot comparisons that changed where last round's flagged screen problems were fixed.

Commit tested: c857400 (app), tests at this push   Date: 2026-10-03
Automation: complete run 37133348919 (tests 385df28, both phones, report only): Android 544 passed, 12 failed, 1
skipped; iPhone 518 passed, 8 failed, 31 skipped (screenshot tests are Android only). The 12 and 8 are the real
failures below, the announcer test and IMP-006 / IMP-099 test faults fixed in this push, and the 4 Android screenshots.
Quick verify 37133348530 (tests 385df28, Android): 348 passed, 8 failed (same list, Android). Quick verify on this
report's push is named in the tester's hand-back.
Result: RED (8 real failures, below)

## Layers (c857400)
| Layer | Tests | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`, local) | 627 | 627 | 0 |
| Impostor browser, per phone (complete run 37133348919, Android and iPhone; confirmed by quick verify 37134265228 on this report's tests) | 176 | 165 | 10 real (IMP-081 ×4, IMP-088, IMP-003, IMP-102, IMP-083, IMP-034 via the IMP-006 test, IMP-099 summary 3 h) + 1 marked (IMP-075 open question) |
| Tambola and platform browser tests (same run) | 381 per phone (Android 1 skipped; iPhone 31 skipped: screenshots and Android-only tests) | all run, except 4 Android screenshots | 4 screenshots (not behaviour) |

## Failing (real bugs only)
- IMP-083, impostor-play-screens.spec.ts "the announcer gets the countdown and each reveal line" (iPhone in both
  complete runs, Android in 3 of 4 GitHub runs): after "Show the word", "The word was Samosa." shows as a reveal line
  but is never put in `announcer`; everything before it is announced in order. Expected: every reveal line announced
  as it appears.
- IMP-034 (found by the IMP-006 test, impostor-round-screens.spec.ts, Android quick verify 37134265228 and the complete
  run): Hard mode, Timer, "Vote now" before 0:00, then "Reveal Riya" (crew): at 7.5 s the screen still shows only "Riya
  was crew!" and "The impostor was Arjun. Escaped!", with a "··· Menu" button; no "The word was …" and no result block.
  Expected: the word at 5.5 s and "Arjun escaped!" with "Next round" at 7.0 s (as it does in Easy, Free flow). IMP-006
  itself is therefore not checked yet.
- IMP-099 / IMP-101, impostor-saved-evenings.spec.ts "the summary's 3 hours" (Android; clock held exactly at
  summaryShownAt + 3 h): the summary opens without "Oops, keep playing". Expected: still offered at exactly 3 hours
  (limits are "more than"), gone 1 ms later. (The round's last move was 3 h 5 min earlier; IMP-099 says the round's
  3 hours are not used once summaryShownAt is set.)
- IMP-102, impostor-play-screens.spec.ts "Play something else → What shall we play?; Tambola's setup arrives with
  tonight's names" (both phones): after an Impostor evening with Riya, Arjun, Meena, Kabir and "Play something else",
  Tambola → New game → Paper tickets → Next shows "Name of player 1" empty (placeholder "Player 1"). Expected: Riya,
  Arjun, Meena, Kabir filled in (IMP-004, PLT-024).
- IMP-081 / IMP-010, impostor-round-screens.spec.ts "320 × 568" and "360 × 640", Larger text off and on (both phones on
  GitHub; 360 passes on the Mac's fonts): with the longest word and a 16-character name the private block lies over the
  player's name (320: block y 59–232, name y 72–140; Larger text: block starts above the screen). Expected: block and
  name apart, block wholly above the pad, nothing scrolling.
- IMP-088, impostor-setup.spec.ts "320 × 568 … everything shows with no page scrolling" (both phones): "Start round"
  covers "Categories: all 9 ›" and the last option line is cut. Expected: groups, Categories and "Start round" all on
  screen at 320 × 568.
- IMP-003, impostor-setup.spec.ts ""← Back" … the list is kept when the host comes back in the same visit" (both
  phones): after "← Back" and the Impostor card again, the list is empty. Expected: the typed names still there.
- Mac only, iPhone (WebKit on macOS): "9:30 PM" where IMP-001 says "9:30 pm" (Home row and the "Start a new evening?"
  dialog). It does not happen on GitHub's iPhone (Linux WebKit) or Android. Low priority; for the coder to look at.

## Expected to fail
Removed on c857400 (pass on both phones): 38 marks (quick verify 37130708905 and complete run 37133348919): privacy
IMP-013 ×2, 053, 031/033; saved evenings IMP-037, 091 ×7, 092 ×2, 093, 094 ×2 (096 fixture included), 095, 097, 098 ×2;
scoring IMP-035, 040–044 (14); setup IMP-071 after the practice result; round screens IMP-075 result menu, IMP-087
release. Also IMP-006 and IMP-099 summary 3 h (test faults fixed): they now fail on real bugs (above), unmarked.
Still marked: 1 per phone.
| File | Test | Why |
|---|---|---|
| impostor-round-screens.spec.ts | IMP-075 the "left halfway" screen has the between-rounds menu | open question for the product owner (below); fails only on "Change how we play" |

## Tests changed (test faults; no assertion loosened)
- IMP-083 announcer (new): the clock jumped 6 s at once, so the screen could skip drawing one announcement ("3" went
  missing once). It now steps one moment at a time, as the passing IMP-030 test does; the word line is still missing
  (real, above).
- IMP-006 (written last round, marked): waited 4 s after "Reveal Riya"; an escaped reveal reaches its result at 7 s.
  Now 7.5 s; the reveal still stops (real, above).
- IMP-099 summary 3 h: the same real-time drift as last round's exact-3-hours test; `fixed: true` now; still fails
  (real, above).
- New file fixes before any verdict: IMP-052 looked up "the only saved evening" while an earlier evening is saved too;
  IMP-100 matched the word line twice (the announcer has it too); IMP-081 play screens allow 1 px of sub-pixel rounding.

## Screenshots to refresh and approve (Android, complete run)
`host-game-over-payouts-360x640`, `host-verdict-proof-812x375`, `player-quick-mark-360x640`, `player-quick-mark-812x375`:
about 1% of pixels changed, exactly at last round's flagged problems (the cut "Settle with players" label, the ✓ over
the digits, the verdict buttons at 812). They look fixed; the references need a Screenshots run and the product owner's
or UX designer's approval. Not a Tambola behaviour change.

## Questions
- IMP-075 / IMP-091 (product owner): "Change how we play" on the "left halfway" screen, which the rules refuse mid-round.
- IMP-003: does "the same visit to the Impostor setup" include going back to "What shall we play?" and tapping the card
  again? The test reads it as yes.
- IMP-089: there is no test yet for "sound off" (no visible sound switch was found to turn off through the screens);
  which Settings switch is "the app's existing sound setting"?

## Flaky or setup problems (not for the Build workspace)
- The owner's Mac: load average 120–170 from macOS services (asset and update daemons) from about 19:00; browsers could
  not start. This round's browser results are from GitHub. A preview server left from 16:06 had also stopped answering
  and was stopped.

## Round 1 (lane E, 870cd2f), kept for reference
Progress (2026-10-03, tester, Impostor lane E on main at 870cd2f: setup, deal and privacy, saved evenings, first clue
screen): rule tests 627 of 627 pass. Browser, local, Android + iPhone: the three Impostor files have 30 tests per phone
that now pass (marks removed) and 36 per phone still marked (they need talk, vote, reveal, result, summary, History's
look back or scoring). Two new screen files (61 tests per phone) for IMP-001 (dialog), 003–009, 016/020/022 (clues),
070, 071, 075, 081, 087, 088, 109. Real failures: IMP-081 and IMP-088 at 320 × 568, IMP-003 "← Back" list, IMP-001
"PM" on iPhone. Test faults fixed: 5 (fake clock drifting with real time; one helper). The rest of Impostor (c857400)
is next. Quick verify on this push is named in the hand-back.

Commit tested: 870cd2f (app), tests at this push   Date: 2026-10-03
Result: RED (4 real failures below, all lane E layout or wording; no privacy, rule or saved-evening failure)

## Layers this round (owner's Mac: `caffeinate -i taskpolicy -b`, at most 3 workers)
| Layer | Tests run | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`) | 627 | 627 | 0 |
| Browser, Android + iPhone: impostor-privacy, impostor-saved-evenings, impostor-scoring | 132 per run (66 per phone) | 30 per phone pass; 36 per phone fail as marked | 0 unexpected |
| Browser, Android + iPhone: impostor-setup (new) | 30 per phone | 27 Android, 25 iPhone (+1 marked, failing as expected) | 2 Android, 4 iPhone (real, below) |
| Browser, Android + iPhone: impostor-round-screens (new) | 31 per phone | 25 per phone (+4 marked) | 2 per phone (real, below) |
| Browser, Tambola Home / picker / History / Sessions set (app-shell, home-and-buttons, usability, history, setup, lifecycle, sessions, after-the-game) | 172 | see Flaky or setup problems | not a verdict this round |

## Failing (real bugs only)
- impostor-round-screens.spec.ts, "320 × 568 (and with Larger text): after "Don't know this word?" appears, the block
  clears the name and the pad" (IMP-081, IMP-010; the coder's layout note): confirmed. With the longest word
  ("Five more minutes, then phone off") and a 16-character name, the private block (y 59–232) lies right over the
  player's name (y 72–140), so both are unreadable; with Larger text the block starts above the screen (y −22).
  Expected: block and name apart, block wholly above the pad, nothing scrolling. 360, 390 and 812 pass.
- impostor-setup.spec.ts, "320 × 568: one row per group … everything shows with no page scrolling" (IMP-088):
  "Start round" covers the "Categories: all 9 ›" button (Categories y 502–550, "Start round" y 492–552), and the
  last option line is cut ("Words kids and grandparents"). Expected: four groups, Categories and "Start round" all
  on screen at 320 × 568, Larger text off.
- impostor-setup.spec.ts, ""← Back" returns to "What shall we play?"; the list is kept when the host comes back in
  the same visit" (IMP-003): after "← Back" and tapping the Impostor card again, "Who's playing?" is empty (2 names
  typed). Expected: Riya and Arjun still listed. (If the Build role reads "the same visit" differently, it is a
  question for the product owner.)
- iPhone only, impostor-setup.spec.ts IMP-001 dialog and IMP-070 "← Back" (Home row): the time reads "9:30 PM";
  Canonical strings say "9:30 pm" ("The evening from 8:40 pm will be ended.", "Impostor, 8:40 pm, round 4").
  Android shows "pm".

## Expected to fail (not built yet on 870cd2f)
Owner decision, 3 October 2026 (Vitest `it.fails`, Playwright `test.fail`). Removed this round (pass on both phones):
impostor-privacy IMP-010 (3 tests), 011 (3), 012 (6, the 4 property batches included), 013 select/copy, 014 (2),
015 (2), 016/020 (2), 017, 060/064 (2); impostor-saved-evenings IMP-090 (3), 091 clues and "left halfway" (2), 096
saves every move, 099 exact 3 h and 12 h (2). Still marked:
| File | Marked per phone | Scenario IDs | Needs |
|---|---|---|---|
| impostor-privacy.spec.ts | 4 | IMP-013 (easy, hard), IMP-053, IMP-031/033 | talk, vote, reveal |
| impostor-saved-evenings.spec.ts | 18 | IMP-037, 091 (talk, timer, picker, re-vote, reveals), 092, 093, 094, 095, 096 (fixture in History), 097, 098, 099 (summary 3 h) | talk to summary, History |
| impostor-scoring.spec.ts | 14 | IMP-035, 040–044 | result, scoring |
| impostor-setup.spec.ts | 1 | IMP-071 after the practice result | result |
| impostor-round-screens.spec.ts | 4 | IMP-075 result menu, IMP-006, IMP-087 release; IMP-075 "left halfway" menu | result; the last one is an open question (below) |
Totals: 41 per phone.

## Tests changed this round (test faults; no assertion loosened)
- Playwright's installed fake clock also moves with real time, so a "499 ms" hold, a "7,999 ms" tap-mode wait and
  "exactly 3 hours / 12 hours" reopenings were a few real milliseconds longer than written. New `freezeClock`
  (impostor.ts) stops that around those holds (IMP-010 main test, IMP-012 same moment, IMP-014 setting on, IMP-004
  toast), and `phoneWith(…, { fixed: true })` holds `Date.now()` at the opening moment (IMP-099 two tests). Same checks.
- `impostorCard` (impostor.ts) also matched the resume card "Impostor · round 1 · Tap to resume"; it now skips it.
- New tests, IMP-008/IMP-070 "later evening": first written with an ended evening put in storage; the app decides
  "first Impostor evening of the session" from the evening that showed the card, so they now play it for real (card
  shown, evening left, "Start new"). The card is then skipped, as the scenario says.

## Notes (not failures)
- IMP-020/073: a 16-character starter name fits at 320 wide (32 px, two lines) when the screen opens at that size, but
  when the screen changes size while the clues show (390 → 320, or turning the phone), the name keeps its size and is cut
  off (33 px on one line, 355 px wide in 288). Tests open at the size; worth a look for rotation.
- IMP-107 test hook confirmed: `pgn.pref.impostor.blockedWords` is stored oldest first and Settings lists it newest
  first ("Skipped words (3)": Kheer / Payasam, Pani puri, Samosa for [Samosa, Pani puri, Kheer]); "Bring back"
  removes the row and the id at once, no toast or dialog. Consistent with IMP-107 (the scenario fixes only the shown
  order).
- No Tambola browser test opens Settings from Home; the new IMP-109 test does (both switches and the note found there).

## Questions
- IMP-075 / IMP-091: the "left halfway" screen's menu has no "Change how we play" (the rules refuse it mid-round). The
  test follows the scenario and is marked expected to fail until the product owner answers (orchestrator's instruction).
- IMP-003: does "the same visit to the Impostor setup" include going back to "What shall we play?" and tapping the
  Impostor card again? The test reads it as yes.

## Flaky or setup problems (not for the Build workspace)
- A preview server left from an earlier run (16:06) stopped answering, and the runs kept reusing it; stopped.
- The Mac was under heavy system load (load average 120–150 from macOS update and asset services), so Chromium
  sometimes could not start within 3 minutes. Android IMP-010/011 timed out once under load and passed alone. The Tambola
  set gave timeouts only ("setting up page", browser launch), no assertion failures; its verdict this round is the
  quick verify run (Android smoke set: Home, Host a game, History, Sessions) named in the hand-back.

---
# Earlier report (kept until the next release review)
Progress (2026-10-03, tester, Impostor core rules on main at 381b514; tests at f595a30 plus this round): the
expected-to-fail marks went on in f595a30 (owner decision of 3 October). On 381b514 every marked rule and contract
test passed (they turned red, as intended), so all 94 marks are off. Rule tests (`npm test`): 627 of 627 pass, Tambola
included; the contract suite now runs for Impostor (6 tests, all pass). One test fault fixed (below, IMP-062). Browser,
local, Android + iPhone, the three Impostor files: still 132 of 132 fail as expected (the screens are not built), so
their marks stay. Quick verify on this push is named in the hand-back.

Progress (2026-10-03, tester, next UX list after 1.1.0, on main at 0f54b99 with tests e5fb4a7): quick verify on
0f54b99 (run 37116779688) red only because it ran the previous tests (old hand-out question); on e5fb4a7 (run
37116782570) 3 of 357 browser tests red, all test faults, fixed and run locally on both phones. 26 Linux and 24 Mac
screenshot references replaced (Screenshots run 37116796764). Three screen problems for the coder (below).

Progress (2026-10-03, tester, Impostor step 1: specs and C3 tests first, on main at e5fb4a7): `specs/impostor/` added,
copied unchanged from `docs/games/impostor/scenarios.md` v2.2 (README with Terms, Canonical strings and Test hooks;
01-setup.md to 11-after-the-game.md and 12-later.md; 91 scenarios, statuses kept "approved, owner, 2026-10-03").
Failing tests written for the C3 scenarios. Rule and property tests (`tests/games/impostor/`, 101 tests): words.test.ts
IMP-050–055; deal.test.ts IMP-010, 011, 015, 016, 025, 063; starter.test.ts IMP-020, 021; vote-and-reveal.test.ts
IMP-031–035, 037, 038; scoring.test.ts IMP-041, 042; secrets-and-seeds.test.ts IMP-060–062, 064; saved-evening.test.ts
IMP-096 (fixture `tests/fixtures/impostor-saved-evenings.json`); `tests/contract/impostor.test.ts` the contract suite.
Browser tests (66 per phone, in the area map, not in the smoke set): impostor-privacy.spec.ts IMP-010–017, 020, 031,
033, 053, 060, 062, 064; impostor-saved-evenings.spec.ts IMP-037, 090–099; impostor-scoring.spec.ts IMP-035, 040–044.
As expected they fail because the game is not built yet: 94 of 101 rule tests fail ("impostorRules / pickWord / … is
not exported from src/games/impostor yet"); the 7 that pass check the word list the coder already shipped (IMP-053–055)
and the fixture's format (IMP-096). All 66 browser tests fail on Android at the first Impostor screen ("Who's playing?"
is not there yet). Three questions for the product owner in `docs/test-questions.md` (IMP-042 totals, IMP-091 reopen
after "Vote now", IMP-099 summary left over 3 hours). Request for the Build workspace: IMP-064's release-build half can
only be seen on a `--mode release` build; the rule test covers `readTestSeeds(raw, true)`.

Commit tested: 0f54b99 (app), tests at e5fb4a7 plus this round's fixes   Date: 2026-10-03
Automation runs: quick verify 37116779688 on 0f54b99 (red: the old tests, see Flaky or setup problems); quick verify
37116782570 on e5fb4a7 (red: 3 test faults, fixed here); Screenshots run 37116796764 on e5fb4a7 (green, pictures taken).
Quick verify on this report's own push is named in the tester's hand-back to the orchestrator (one push per round).
Result: GREEN for the tests (no behaviour scenario fails once the 3 test faults are fixed); 3 screen problems flagged in
the pictures for the coder (below), none covered by a failing test.

## Layers this round (owner's Mac: `caffeinate -i taskpolicy -b`, at most 3 workers)
Impostor files in this clone (untracked, another chat's work) were left out of every run and of the commit.
| Layer | Tests run | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`, Impostor excluded) | 520 | 520 | 0 |
| Browser, quick verify 37116782570 on e5fb4a7 (Every browser test, 2 shards) | 357 | 353 (1 skipped, as before) | 3, all test faults (below) |
| Browser, local after the fixes, Android + iPhone: pattern-cue.spec.ts | 24 | 24 | 0 |
| Browser, local after the fixes, Android + iPhone: phone-claims.spec.ts | 50 | 50 | 0 |
| Screenshots, Linux (Screenshots run 37116796764) | 24 tests, 57 pictures | taken | 26 pictures changed, references replaced |
| Screenshots, Mac (`--update-snapshots=changed`) | 24 tests, 57 pictures | 24 | 24 pictures changed, references replaced |

## Expected to fail (not built yet)
Owner decision, 3 October 2026: tests written first for a part not built yet are marked expected to fail (Vitest
`it.fails`, Playwright `test.fail`) so quick verify stays green. A marked test that starts passing turns red on
purpose; then the tester removes its mark. Rule and contract marks: all removed on 381b514 (94 tests now pass:
IMP-010, 011, 015, 016, 020, 021, 025, 031–035, 037, 038, 041, 042, 050–052, 060–064, 096 and the contract suite).
Still marked (the Impostor screens are not built):
| File | Marked | Scenario IDs |
|---|---|---|
| tests/browser/impostor-privacy.spec.ts | 26 per phone | IMP-010, IMP-011, IMP-012, IMP-013, IMP-014, IMP-015, IMP-016, IMP-017, IMP-020, IMP-031, IMP-033, IMP-053, IMP-060, IMP-062, IMP-064 |
| tests/browser/impostor-saved-evenings.spec.ts | 26 per phone | IMP-037, IMP-090, IMP-091, IMP-092, IMP-093, IMP-094, IMP-095, IMP-096, IMP-097, IMP-098, IMP-099 |
| tests/browser/impostor-scoring.spec.ts | 14 per phone | IMP-035, IMP-040, IMP-041, IMP-042, IMP-043, IMP-044 |
Totals: 66 browser tests per phone (132 on both phones).
Still open for the product owner (tests accept either behaviour until answered): IMP-091 reopen after "Vote now",
IMP-099 summary left over 3 hours. IMP-042: `eveningTotals(saved)` now exists; a rule property for the totals will be
added once it is listed in the Test hooks of `specs/impostor/README.md` (totals stay checked on screen meanwhile).

## Tests changed this round (test fault; no assertion loosened)
- `secrets-and-seeds.test.ts`, IMP-062 "before the reveal, the host and room views hold only { round, practice,
  players, starter }": it searched the view's JSON text, key names included, for every secret. Water purifier's other
  name "RO" matched the key "round", so a correct view failed. It now searches the view's values (the keys are already
  checked to be exactly those four); the same secrets, the same 200 evenings.
- `tests/contract/impostor.test.ts`: "Impostor registers its rules" is now always registered (it fails only if
  `impostorRules` is missing), so it could carry the mark and show when the rules arrived. Same check.

## Failing (real bugs only)
No scenario test fails. Three screen problems seen in the pictures (polish rows of the next UX list; no test covers
the exact look), for the coder:
- Settle buttons at 360 (polish, TAM-181/TAM-199 screen): "Settle with players" is now on one line but its last
  letter is cut off by the button's edge ("Settle with player"). Expected: the whole label inside the button.
  Picture: `host-game-over-payouts-360x640-android-linux.png`.
- N4, quick mark ✓ (TAM-192 screen) at 360 × 640: the ✓ sits over the second digit of every marked key (23, 30, 52, 61,
  74), so the number is partly crossed out. Expected: the ✓ in the key's corner, clear of the number, as it now is at
  390 × 844. At 812 × 375 it just touches the digit. Picture: `player-quick-mark-360x640-android-linux.png`.
- Point b, verdict buttons (TAM-174 screen) at 812 × 375: "Undo claim" and "Done" are pinned but their bottom edge is
  cut off by the card's bottom; the "Ticket 1 · checked from your copy" line no longer shows. Expected: both buttons
  whole. Picture: `host-verdict-proof-812x375-android-linux.png`.

## Tests changed (test faults; no assertion loosened)
- `pattern-cue.spec.ts`, TAM-195 point a "when even the short words need a third line": the test's case (two tickets,
  three prizes, 320 × 568, Larger text) fits in two lines on the app ("Ticket 1: Early Five, Top Line. Ticket 3: Top
  Line. Shout!", Larger text on, checked), so the app rightly kept the full words. The case now fills the top and
  middle rows of tickets 1 and 3 (five prizes), which does need a third line; the same checks: "Tickets 1 and 3: patterns
  filled. Shout!", "More", at most two lines, "More" keeps the full words, Early Five said once.
- `pattern-cue.spec.ts`, the line counter: it counted "More", sitting beside the two message lines and centred between
  them, as a third line. It now counts the message's lines, and still counts "More" as a line if it sits above or
  below them.
- `phone-claims.spec.ts`, N1 (TAM-058, TAM-198): (1) putting a refusal away tapped the first "Close" on the screen,
  which is the prize chip's Close (it closes the prize); it now taps the refusal's own Close (the refusal does have
  its own, plus "Try again"). (2) After "Add another winner", Riya's accepted win stays on screen (it waits to be
  closed); the check "no result shown" now checks that this result is unchanged and does not name Dad.

## Screenshot comparison (`tests/browser/screens.spec.ts`, tag `@screens`)
Android phone, 360 × 640, 390 × 844 and 812 × 375; 19 screens, 57 pictures per machine. References: Linux from
Screenshots run 37116796764 on e5fb4a7 (app 0f54b99), Mac regenerated locally. Both unapproved until the product owner
or UX designer checks them.

## Screenshots to approve (next UX list after 1.1.0, pictures of 0f54b99)
Folder: `tests/browser/screens.spec.ts-snapshots/`, names `<screen>-<size>-android-linux.png` (Mac: `-darwin`).
Pink boxes are the test's covers over QR codes. "Before" is 1.1.0 (85b9cc1); "Now" is 0f54b99. The 1.1.0 release review
approved 16 of 19 and flagged host-verdict-proof, player-tickets-cue and player-quick-mark.

| Screen | Items | Before (1.1.0) | Now (0f54b99) | Approve / Flag |
|---|---|---|---|---|
| host-ticket-type | | approved | Unchanged | |
| host-prizes | polish | 360: session line "Saturday 3 O…", "Once you confirm…" cut | Fixed: at 360 the title sits beside Back, "Once you confirm, the prizes are locked for this game." and "Session: Saturday 3 Oct (new)" in full. Prize names still wrap to two lines at 360 (as before) | |
| host-hand-out | | approved | Unchanged | |
| host-not-handed-out-question | N5 | "Dad hasn't got their ticket", "Hand it out now" main | Fixed: "Has Dad got their ticket?", "Ticket 3 is the last one to hand out.", "Yes, start calling" main, then "Not yet, hand it out", "Give a paper ticket"; all three sizes | |
| host-plays-on-paper | polish (rhyme, bar) | "Repeat · Another rhyme" and empty "Last" before the first call; boxed "Dad plays on paper · Undo" bar | Fixed: nothing under "Tap Next number to call the first number." before the first call; the bar is a light pill, not a button look. Note: at 360 the sleep tip now sits lower, leaving a blank band under the header | |
| host-calling | N2 | approved | Unchanged: the pictures show the one-time sleep tip (before "Got it"), so N2's line under the header is not in any picture; the TAM-128 browser test passed on both phones | |
| host-room-view | | approved | Unchanged | |
| host-record-a-win | | approved | Unchanged | |
| host-game-over-payouts | polish | "Settle with players" on 2 lines | One line now, but the last letter is cut: "Settle with player" (bug above). 390: unchanged layout | Flag |
| host-verdict-proof | point b | flagged: "Undo claim" and "Done" reached by scrolling | 360: fixed, both pinned whole at the card's bottom; the ticket proof now scrolls under them (only its top edge shows). 812: buttons pinned but cut off at the bottom (bug above) | Flag (812) |
| host-settings-in-game | | approved | Unchanged | |
| history-clear-one | | approved | Unchanged | |
| player-tickets-cue | point a | flagged: "Ticket 1: patterns filled. S… More" | Fixed: "Ticket 1: Early Five, Top Line. Shout!" in full on two lines at 360 and 390, no "More"; 812: in full on one line in the space beside ticket 2 | |
| player-quick-mark | N3, N4 | flagged | N3 fixed: in landscape the pad is on the left, the words, three ticket pictures, cue and "Show claim" on the right, all on screen. N4: 390 fixed (✓ in the corner, clear); 360: ✓ over the second digit (bug above); 812: ✓ touches the digit | Flag (360) |
| player-which-ticket | | approved | Unchanged | |
| player-which-prize | landscape polish | 812: buttons squeezed to the left, names on 2 lines | Fixed: title centred, three equal buttons across, names on one line, "Cancel" centred | |
| player-claim-qr | landscape polish | 812: ticket and "Done" below the fold | Fixed: QR on the left; title, "Show this to the host", ticket and "Done" on the right, all on screen | |
| player-done-with-this-game | (cue behind) | approved | Only the cue line behind the question changed (two lines, as above) | |
| player-home-saved-tickets | (not this list) | approved | "Host a game" now reads "Tambola or Impostor on this phone" (from main's Impostor work); layout fine | |

## Quarantined
SOP item 6 (standing owner approval): a test that fails and then passes with no change is set aside for at most 2 days,
listed here with its date, and fixed by the tester; never deleted or weakened.
| Test | Set aside on | Why | Back by |
|---|---|---|---|
| (none) | | | |

## Flaky or setup problems (not for the Build workspace)
- Quick verify 37116779688 (0f54b99) ran the tests from before e5fb4a7, which wait for the old question "Dad hasn't got
  their ticket"; every test that hands out tickets failed there (102). Not a bug: the run on e5fb4a7 has the new
  wording and passes those tests.
- A first local browser run was spoiled by another chat's Playwright run sharing this clone's results folder (missing
  trace files, closed browsers); it was stopped. Later runs used their own results folder and passed.

## Requests for the Build workspace
- The three screen problems above (settle label cut at 360; quick mark ✓ over the digits at 360; verdict buttons cut in
  landscape).

## Notes for the owner (plain English)
- Done and working: the player's hint line now says the prizes in full on up to two lines; the hand-out question reads
  "Has Dad got their ticket?" with "Yes, start calling" as the main answer; nothing clutters the calling screen before
  the first number; the "plays on paper" bar is lighter; the Prizes step fits a small phone; in landscape "Which
  prize?", the claim QR and Quick mark are laid out side by side with everything on screen; a paper ticket's claim
  now offers the name list.
- Three small look problems remain: "Settle with players" loses its last letter on a small phone; on a small phone the
  quick mark tick covers part of the number; in landscape the "Undo claim" and "Done" buttons on a verdict are cut off
  at the bottom.
- For the product owner: the scenario's example of when the hint needs "More" ("two tickets with three prizes at
  320 px") actually fits in two lines, so the app shows the full words there. That follows the rule; only the example
  is off. The test now uses a case with five prizes.
