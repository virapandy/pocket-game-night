# Test report
Progress (2026-10-03, tester, Impostor tests marked expected to fail, on main at f5085cc): owner decision of
3 October (docs/decisions.md). Every Impostor test from c8ab011 that fails today is marked expected to fail (Vitest
`it.fails`, Playwright `test.fail`); nothing skipped, no check changed. Rule tests: 527 pass, 94 expected fail (621).
Browser, local, Android + iPhone, the three Impostor files: 132 of 132 fail as expected. Quick verify on this push is
named in the hand-back. See "Expected to fail (not built yet)" below.

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
Owner decision, 3 October 2026: tests written first for Impostor, not built yet, are marked expected to fail so quick
verify stays green and the preview keeps updating. Each mark comes off as its part of the build lands: a marked test
that starts passing turns red on purpose (that is a finding, not a fault); then the tester removes its mark. The 7
Impostor rule tests that already pass (IMP-053, IMP-054, IMP-055 word list; IMP-096 fixture format) are not marked.
| File | Marked | Scenario IDs |
|---|---|---|
| tests/contract/impostor.test.ts | 1 ("Impostor registers its rules"; once impostorRules exists the full contract suite runs unmarked) | contract suite, IMP-062 |
| tests/games/impostor/deal.test.ts | 18 | IMP-010, IMP-011, IMP-015, IMP-016, IMP-025, IMP-063 |
| tests/games/impostor/starter.test.ts | 11 | IMP-020, IMP-021 |
| tests/games/impostor/vote-and-reveal.test.ts | 21 | IMP-031, IMP-032, IMP-033, IMP-034, IMP-035, IMP-037, IMP-038 |
| tests/games/impostor/scoring.test.ts | 6 | IMP-041, IMP-042 |
| tests/games/impostor/secrets-and-seeds.test.ts | 21 | IMP-060, IMP-061, IMP-062, IMP-064 |
| tests/games/impostor/words.test.ts | 12 of 17 | IMP-050, IMP-051, IMP-052 |
| tests/games/impostor/saved-evening.test.ts | 4 of 6 | IMP-096 (readImpostorEvening and replay) |
| tests/browser/impostor-privacy.spec.ts | 26 per phone | IMP-010, IMP-011, IMP-012, IMP-013, IMP-014, IMP-015, IMP-016, IMP-017, IMP-020, IMP-031, IMP-033, IMP-053, IMP-060, IMP-062, IMP-064 |
| tests/browser/impostor-saved-evenings.spec.ts | 26 per phone | IMP-037, IMP-090, IMP-091, IMP-092, IMP-093, IMP-094, IMP-095, IMP-096, IMP-097, IMP-098, IMP-099 |
| tests/browser/impostor-scoring.spec.ts | 14 per phone | IMP-035, IMP-040, IMP-041, IMP-042, IMP-043, IMP-044 |
Totals: 94 rule and contract tests, 66 browser tests per phone (132 on both phones).
Still open for the product owner (tests accept either behaviour until answered): IMP-091 reopen after "Vote now",
IMP-099 summary left over 3 hours. IMP-042: the coder will expose `eveningTotals(saved)`; a rule test for the totals
follows once it is in the Test hooks.

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
