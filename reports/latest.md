# Test report
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
