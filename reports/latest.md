# Test report
Progress (2026-10-03, tester, release-candidate fix round, C1 layout fixes from the screenshot check): pulled main at
60d9982 (lanes A, B and C merged). New Linux reference pictures from Screenshots run 37107961271 (on test branch
`tester-screens-cover` = 60d9982 app + the cover fix below; the same app as run 37107123037 on main, whose pictures
match these except the covers); Mac pictures regenerated locally. The test's own cover fault is fixed. Every earlier
screenshot problem is checked below: most are fixed, 2 are still wrong, 3 small ones remain. No test needed changing: every affected
browser spec passes on 60d9982 as it stood.

Commit tested: 60d9982   Date: 2026-10-03
Automation run: quick verify 37107118670 on 60d9982 (the coder's push): GREEN. Quick verify 37109376278 on the
tester's push 2c7c02c: RED from a workflow fault, not a test: type-check, build, rule tests and the smoke set passed;
"Browser tests for the changed areas" picked only `screens.spec.ts`, whose tests are all @screens, so
`--grep-invert @screens` left none and Playwright stopped with "No tests found" (request below).
Result: GREEN (every test); the screenshot findings below are layout problems for the coder, not failing tests.

## Layers (owner's Mac: `caffeinate -i taskpolicy -b`, at most 3 workers, Android first)
| Layer | Tests run | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`) | 520 | 520 | 0 (see flaky: 2 timed out on a first, overloaded run; 520 of 520 twice after) |
| Browser, Android: setup-layout, layout, usability, ux-rows-3-oct, ux-rows-8-15, home-and-buttons | 97 | 96 | 0 (1 skipped, as before) |
| Browser, Android: phone-tickets, payouts-and-tally, claims, held-tickets, pattern-cue, calling, setup, app-shell, phone-claims, late-joiners, phone-late-joiners, dark-mode | 138 | 138 | 0 |
| Browser, iPhone: home-and-buttons (PLT-300, PLT-301 install tip), setup-layout, layout, ux-rows-8-15, ux-rows-3-oct | 85 | 85 | 0 |
| Screenshots, Linux (Screenshots run 37107961271, new references) | 24 tests, 57 pictures | 24 | 0 |
| Screenshots, Mac (regenerated, `SCREENS_NEW=1 --update-snapshots`) | 24 tests, 57 pictures | 24 | 0 |

## Failing (real bugs only)
- None among the tests. Layout problems still seen in the pictures (for the coder, from "Screenshots to approve"):
  1. `player-quick-mark-360x640` (row 3; lane A's fix): still wrong. On a 360 × 640 phone the keys keep their full
     height, so the pad ends just above the bottom, the ticket pictures are cut by the screen edge, and the cue line and
     "Show claim" are off screen. Expected: the whole pad and "Show claim" on the screen without scrolling. Same on Mac
     and Linux.
  2. `host-hand-out-360x640`, Linux font: the typed code loses its last character ("8XM2-ETZD-PSXS-CM3F-N42", the "K"
     cut by the right edge). The Mac font fits. Expected: the whole code visible on a 360 px phone with a wider font
     (shrink or wrap between groups).
  3. `host-game-over-payouts-360x640` (small): the "·" before "net" wraps onto a line of its own under "paid ₹50 · won
     ₹30 · handed back ₹40", and the net line starts right at the bottom of the list's visible area (cut through).
  4. `host-calling-360x640` and `host-verdict-proof-360x640` (small, new): the top bar's "Tambola · Game Z9QB" wraps,
     "Z9QB" alone on a second line touching the top of the big number.
  5. `host-prizes-812x375` (small): the "+ Four Corners …" add buttons show only their top edge at the bottom of the
     list (they scroll), and "× Remove" touches the right edge of its prize box.

## Tests changed (nothing loosened)
- `screens.spec.ts` (tester's own fault, from the last report): the covers over QR codes and the counting-down
  "Called 24 · Undo (5s)" bar are now painted in the page by a style sheet (`tests/browser/screens-cover.css`, a pink
  box for QR codes, see-through words for the bar) instead of Playwright's `mask`, which painted over everything,
  pop-ups included. `host-not-handed-out-question` (360, 812) and `host-record-a-win` (360, 812) now show every word of
  their pop-ups. The bar's place and size still show. README "Screenshot comparison" updated.
- No other test changed: the landscape hand-out, number-size and payouts checks all pass as they are on 60d9982.

## Screenshot comparison (`tests/browser/screens.spec.ts`, tag `@screens`)
Android phone, 360 × 640, 390 × 844 and 812 × 375; 19 screens, 57 pictures per machine. References: Linux
(`-android-linux.png`, from Screenshots run 37107961271, what the complete run compares against) and Mac
(`-android-darwin.png`, regenerated today). Both unapproved until the product owner or UX designer checks them.

## Screenshots to approve (rc-2026-10-03, pictures of 60d9982)
Folder: `tests/browser/screens.spec.ts-snapshots/`, names `<screen>-<size>-android-linux.png` (Mac: `-darwin`).
Pink boxes are the test's covers over QR codes; the Undo bar after a call shows as an empty bar. "Before" is the
tester's first look at 882fb03; "Now" is 60d9982.

| Screen | Rows | Before | Now | Approve / Flag |
|---|---|---|---|---|
| host-ticket-type | 11, 1 | 360, 812: title and question half hidden under the Cancel bar | Fixed: "New game" and "How are tickets handed out?" fully visible at all sizes (812: on one line beside Cancel) | |
| host-prizes | 9, 19 | 812: list squeezed to a sliver; 360: "+ Bottom Line" cut, "Remove" touching the box edge | Fixed at 360 (all add buttons visible, Remove inside its box; small: session line ends "Saturday 3 O…"). 812 much better: the three prizes readable in two columns; small: add buttons only show their top edge (scroll), "Remove" touches its box edge | |
| host-hand-out | 10, 19, 25 | 812: QR over "Can't scan?" and "Next ticket"; 360: lines clipped, typed code and "0 of 3 handed out" off screen | Fixed at 812 (QR left, everything else right, no overlap) and 390. 360: everything on screen, but on Linux's font the typed code's last "K" is cut (Mac fits) | |
| host-not-handed-out-question | 7 | test cover hid the pop-up's words | Fixed (test): every word readable at all sizes | |
| host-plays-on-paper | 8 | fine; polish: "Repeat · Another rhyme" and empty "Last" before the first call | Unchanged | |
| host-calling | 11, 16, 25 | 360: big number's top cut under the header | Fixed: number whole. Small new: at 360 "Game Z9QB" wraps onto a second header line touching the number | |
| host-room-view | 25 | 812: "Last" over the rhyme, tiles cut | Fixed: number left, rhyme, "Last" and the 3 tiles right, nothing cut | |
| host-record-a-win | 5 | 360: test cover over Back and Cancel | Fixed (test): Back and Cancel readable | |
| host-game-over-payouts | 14, 22, 5 | 812: list a sliver; 360: Riya's net cut, Home/Report wrap | Fixed at 812 (list readable, Session tally and Play again on the right). 360: Home and Report one line each (fixed); small: a lone "·" line and the net line cut at the list's fold; Settle and Session tally buttons wrap to 2 lines | |
| host-verdict-proof | 24, 5 | 360: verdict card over "Scan a claim" and the chips | Fixed: the card stops above the chips and scrolls inside itself. Note: at 360 and 812 "Undo claim" and "Done" are only reached by scrolling the card | |
| host-settings-in-game | 18 | fine | Unchanged | |
| history-clear-one | 5, 19 | fine | Unchanged | |
| player-tickets-cue | 1, 2, 3 | fine; landscape line cut with "…" + More (question for the product owner) | Header now one line under the bar (better). Still: at 360 and 390 on Linux even the short line is cut, "Ticket 1: patterns filled. S… More" | |
| player-quick-mark | 3 | 360, 390: header a tall thin column; 360: rows 71–90 and "Show claim" off screen | Header fixed (one line). 360: still wrong, "Show claim" and the cue line off screen, ticket pictures cut (keys did not shrink) | |
| player-which-ticket | 12 | 812: ticket pictures very small | Fixed: three readable ticket pictures side by side | |
| player-which-prize | 17 | fine | Unchanged | |
| player-claim-qr | 13, 19 | fine | Unchanged (cover now a plain pink box) | |
| player-done-with-this-game | 20 | fine | Fine (header one line) | |
| player-home-saved-tickets | 21 | 360: "Menu" touching the right edge | Fixed: Menu has its margin | |

## Quarantined
SOP item 6 (standing owner approval): a test that fails and then passes with no change is set aside for at most 2 days,
listed here with its date, and fixed by the tester; never deleted or weakened.
| Test | Set aside on | Why | Back by |
|---|---|---|---|
| (none) | | | |

## Flaky or setup problems (not for the Build workspace)
- Rule tests: the first `npm test` of this round took 197 s (the Mac busy) and 2 tests failed; the next two runs passed
  520 of 520 in 78 s with nothing changed. Load, not a fault; watched, not quarantined (not seen in automation).
- Screenshots: `player-done-with-this-game-360x640` differed by 4 pixels (by 4 of 255) between two Linux runs of the
  same app; far inside the comparison's tolerance.
- The cover fix needed Linux pictures before it reached main, so they were made on a test-only branch,
  `tester-screens-cover` (tests only, no app change; deleted after use).
- Quick verify 37101188825 was cancelled at the 15-minute job limit: a push touching shared test set-up runs all 350
  Android tests, which took 13.0 minutes on the green run and over 15 on the cancelled one. Not a test failure.
- Screenshots: a clock that never moves stalled the app (clicks that never finished), and the "Undo (5s)" countdown
  moved the bar's words; fixed in the spec (running clock, the bar covered). Not quarantined: never in the gate yet.

## Requests for the Build workspace
- `quick.yml`, "Browser tests for the changed areas": when the changed specs hold only @screens tests (a push that
  changes only `screens.spec.ts` or its pictures), the step fails with "No tests found" (run 37109376278). Add
  `--pass-with-no-tests` to that command, or leave `screens.spec.ts` out of the picked specs.
- Layout items 1 to 5 under "Failing" (screenshots), most important first.
- (Done since the last report: quick verify now uses two shards and skips @screens; the Screenshots workflow exists.)

## Notes for the owner (plain English)
- Most of the layout problems from the picture check are fixed: the setup steps, the hand-out screen in landscape, the
  room view, the payouts, the verdict card, the player's "Which ticket?" pictures and Home's Menu all look right now.
- Still to fix: on a small 360 × 640 phone the player's "Quick mark" screen still pushes "Show claim" off the bottom,
  and on phones with a wider font the hand-out screen cuts the last letter of the typed code. Three small polish items
  are listed for the coder.
- My own mistake in the picture test is fixed: the pink box hiding the changing QR code no longer covers the words of a
  pop-up lying on top of it.
- Still open from before: in landscape (and on Linux's wider font at 360 and 390) even the short cue line is cut with
  "…" plus "More" (row 1 question for the product owner); before the first call the calling screen shows
  "Repeat · Another rhyme" and an empty "Last" (polish).
- The 57 pictures are ready for the product owner or UX designer to approve or flag at release.
