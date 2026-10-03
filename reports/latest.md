# Test report
Progress (2026-10-03, tester, release-candidate fix round 3, last check before the release freeze): pulled main at
e6fc91a (85b9cc1, "quick mark thumbnails stay on one row at 360", plus a docs-only Impostor commit on top). New Linux
reference from Screenshots run 37111322622 on main (green); the Mac picture regenerated locally. The quick mark problem
at 360 × 640 is fixed: "Show claim" is wholly on screen. No test needed changing.

Commit tested: 85b9cc1 (main at e6fc91a; the later commit changes only docs)   Date: 2026-10-03
Automation run: Screenshots run 37111322622 on e6fc91a, green (all 24 screenshot tests, 57 pictures per machine).
Quick verify on this report's own push is named in the tester's hand-back to the orchestrator (one push per round, so
it cannot be written into this file). Last complete-layer runs: round 2 below.
Result: GREEN (every test run this round passed; no layout problem left in the pictures).

## Layers this round (owner's Mac: `caffeinate -i taskpolicy -b`, at most 3 workers)
| Layer | Tests run | Passing | Failing |
|---|---|---|---|
| Browser, Android + iPhone: phone-tickets, TAM-192 (quick mark) | 10 | 10 | 0 |
| Screenshots, Linux (Screenshots run 37111322622 on e6fc91a) | 24 tests, 57 pictures | 24 | 0 (1 picture changed: player-quick-mark-360x640) |
| Screenshots, Mac (player test only, `SCREENS_NEW=1 --update-snapshots`) | 3 tests (one per size), 18 pictures | 3 | 0 (the same 1 picture changed) |

Rule tests were not rerun locally this round (the only code change is one screen file); quick verify runs all of them
on the push. Round 2 (9cb6133): rule tests 520 of 520; Android 207 of 208 and iPhone 131 of 132 (1 skipped each, as
before), all passing.

## Failing (real bugs only)
- None.
- Fixed this round: `player-quick-mark-360x640` (row 3). On Linux and Mac the three ticket pictures sit on one row
  under the pad, and "Show claim" is whole on screen (button from about 584 to 631 px of 640). Keys measure about
  30 × 32 px (at least 28). The other 56 Linux pictures are byte-for-byte unchanged. The screenshot set has no
  375 × 812 portrait size (only 360 × 640, 390 × 844 and 812 × 375 landscape), so 375 is covered by the TAM-192 test
  only (keys at least 44 px tall on 375 × 812 and 390 × 844, passing on both phones).

## Tests changed
- None. Only the reference picture `player-quick-mark-360x640` (Linux and Mac) was replaced with the picture of 85b9cc1.
  (Round 2: 13 Linux and 13 Mac pictures replaced with those of 9cb6133.)

## Screenshot comparison (`tests/browser/screens.spec.ts`, tag `@screens`)
Android phone, 360 × 640, 390 × 844 and 812 × 375; 19 screens, 57 pictures per machine. References: Linux
(`-android-linux.png`, from Screenshots run 37111322622 on e6fc91a, what the complete run compares against) and Mac
(`-android-darwin.png`, regenerated locally). Both unapproved until the product owner or UX designer checks them.

## Screenshots to approve (rc-2026-10-03, pictures of 85b9cc1)
Folder: `tests/browser/screens.spec.ts-snapshots/`, names `<screen>-<size>-android-linux.png` (Mac: `-darwin`).
Pink boxes are the test's covers over QR codes; the Undo bar after a call shows as an empty bar. "Before" is the
tester's first look at 882fb03; "Now" is 85b9cc1 (round 3; only quick mark at 360 changed since round 2's 9cb6133).

| Screen | Rows | Before | Now | Approve / Flag |
|---|---|---|---|---|
| host-ticket-type | 11, 1 | 360, 812: title and question half hidden under the Cancel bar | Fixed (round 1), unchanged | |
| host-prizes | 9, 19 | 812: list squeezed to a sliver; 360: "+ Bottom Line" cut, "Remove" touching the box edge | Fixed. 812: title and pot line beside Back, all three prizes and all four add buttons whole, "Remove" inside its box, Confirm on screen. 360 and 390: fine (polish, as before: at 360 the prize names wrap to two lines, and the session line ends "Saturday 3 O…") | |
| host-hand-out | 10, 19, 25 | 812: QR over "Can't scan?" and "Next ticket"; 360: lines clipped, typed code and "0 of 3 handed out" off screen | Fixed. 360 (Linux font): the whole code "8XM2-ETZD-PSXS-CM3F-N42K" on one line. 812: QR about 280 px (well above 170), nothing overlaps. 390 fine | |
| host-not-handed-out-question | 7 | test cover hid the pop-up's words | Fixed (test); pictures changed only behind the pop-up (typed code) | |
| host-plays-on-paper | 8 | fine; polish: "Repeat · Another rhyme" and empty "Last" before the first call | Header now one line ("Game Z9QB"); polish unchanged | |
| host-calling | 11, 16, 25 | 360: big number's top cut under the header | Fixed: at 360 the header shows "3 of 90 called / Game Z9QB" on two short lines, clear of the number; 390 and 812 unchanged | |
| host-room-view | 25 | 812: "Last" over the rhyme, tiles cut | Fixed (round 1), unchanged | |
| host-record-a-win | 5 | 360: test cover over Back and Cancel | Fixed (test), unchanged | |
| host-game-over-payouts | 14, 22, 5 | 812: list a sliver; 360: Riya's net cut, Home/Report wrap | Fixed. 360: no lone "·"; Riya's whole row (name, "paid ₹50 · won ₹30 · handed back ₹40", "net: gets ₹20") above the fold. Polish as before: "Settle with players" wraps to 2 lines | |
| host-verdict-proof | 24, 5 | 360: verdict card over "Scan a claim" and the chips | Fixed; at 360 the header is now one line. Note as before: "Undo claim" and "Done" are reached by scrolling the card | |
| host-settings-in-game | 18 | fine | Unchanged | |
| history-clear-one | 5, 19 | fine | Unchanged | |
| player-tickets-cue | 1, 2, 3 | fine; landscape line cut with "…" + More (question for the product owner) | Unchanged. At 360 and 390 on Linux even the short line is cut: "Ticket 1: patterns filled. S… More" (360), "…Shou… More" (390). Product owner question, row 1 | |
| player-quick-mark | 3 | 360, 390: header a tall thin column; 360: rows 71–90 and "Show claim" off screen | Fixed (round 3). 360: keys about 30 × 32 px, pad and cue line on screen, the three ticket pictures on one row, "Show claim" whole. Polish: at 360 on Linux the header line ends "Game Z9QB ·" (time cut), on Mac it fits. 390 and 812 unchanged | |
| player-which-ticket | 12 | 812: ticket pictures very small | Fixed (round 1), unchanged | |
| player-which-prize | 17 | fine | Unchanged | |
| player-claim-qr | 13, 19 | fine | Unchanged | |
| player-done-with-this-game | 20 | fine | Fine | |
| player-home-saved-tickets | 21 | 360: "Menu" touching the right edge | Fixed (round 1), unchanged | |

## Quarantined
SOP item 6 (standing owner approval): a test that fails and then passes with no change is set aside for at most 2 days,
listed here with its date, and fixed by the tester; never deleted or weakened.
| Test | Set aside on | Why | Back by |
|---|---|---|---|
| (none) | | | |

## Flaky or setup problems (not for the Build workspace)
- None this round: every local run passed first time, no retries.

## Requests for the Build workspace
- None. (Done since the last report: quick mark at 360 × 640, "Show claim" whole on screen.)

## Notes for the owner (plain English)
- The second round of layout fixes worked for four of the five problems: on a small phone the hand-out screen shows the
  whole typed code, the payouts list no longer has a stray dot and shows a whole row, and the calling screen's header
  stays clear of the big number; in landscape the Prizes screen shows every button whole.
- Now fixed too: on a small 360 × 640 phone the player's "Quick mark" screen shows the whole "Show claim" button, with
  the three ticket pictures on one row. All five layout problems from the first look are fixed.
- Still open from before: the cue line on the player's tickets is cut with "…" plus "More" on narrower phones and in
  landscape (a question for the product owner); before the first call the calling screen shows "Repeat · Another
  rhyme" and an empty "Last" (polish).
- The 57 pictures are ready for the product owner or UX designer to approve or flag at release.
