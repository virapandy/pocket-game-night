# Test report
Progress (2026-10-03, tester, release-candidate fix round 2): pulled main at 9cb6133 (the coder's round-2 fixes for
the 5 screenshot problems, plus the quick-verify "No tests found" fix). New Linux reference pictures from Screenshots
run 37109849856 on main (green); Mac pictures regenerated locally. 4 of the 5 problems are fixed; quick mark at
360 × 640 is better but still cuts "Show claim". No test needed changing.

Commit tested: 9cb6133   Date: 2026-10-03
Automation run: see "Quick verify on the tester's push" below.
Result: GREEN (every test); one screenshot finding below is a layout problem for the coder, not a failing test.

## Layers (owner's Mac: `caffeinate -i taskpolicy -b`, at most 3 workers)
| Layer | Tests run | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`) | 520 | 520 | 0 |
| Browser, Android: layout, setup-layout, setup, usability, ux-rows-3-oct, ux-rows-8-15, payouts-and-tally, after-the-game, phone-tickets, pattern-cue, late-joiners, phone-late-joiners, calling, held-tickets, home-and-buttons, dark-mode | 208 | 207 | 0 (1 skipped, as before) |
| Browser, iPhone: layout, setup-layout, ux-rows-3-oct, ux-rows-8-15, payouts-and-tally, phone-tickets, home-and-buttons | 132 | 131 | 0 (1 skipped, as before) |
| Screenshots, Linux (Screenshots run 37109849856 on 9cb6133, new references) | 24 tests, 57 pictures | 24 | 0 (13 pictures changed) |
| Screenshots, Mac (regenerated, `SCREENS_NEW=1 --update-snapshots`) | 24 tests, 57 pictures | 24 | 0 (the same 13 changed) |

## Failing (real bugs only)
- None among the tests. Layout problem still seen in the pictures (for the coder):
  1. `player-quick-mark-360x640` (row 3; slows play): better but still wrong. The cue line is now on screen, but the
     three ticket pictures under the pad wrap onto two rows (Ticket 3 alone on the second), which pushes "Show claim"
     down so only its top 20 px or so show at the bottom edge. Same on Mac and Linux. Expected: the whole "Show claim"
     button on a 360 × 640 screen without scrolling (for example the three ticket pictures on one row, as at 390).

## Tests changed
- None. Only the reference pictures (13 Linux, 13 Mac) were replaced with the pictures of 9cb6133.

## Screenshot comparison (`tests/browser/screens.spec.ts`, tag `@screens`)
Android phone, 360 × 640, 390 × 844 and 812 × 375; 19 screens, 57 pictures per machine. References: Linux
(`-android-linux.png`, from Screenshots run 37109849856, what the complete run compares against) and Mac
(`-android-darwin.png`, regenerated today). Both unapproved until the product owner or UX designer checks them.

## Screenshots to approve (rc-2026-10-03, pictures of 9cb6133)
Folder: `tests/browser/screens.spec.ts-snapshots/`, names `<screen>-<size>-android-linux.png` (Mac: `-darwin`).
Pink boxes are the test's covers over QR codes; the Undo bar after a call shows as an empty bar. "Before" is the
tester's first look at 882fb03; "Now" is 9cb6133 (round 2).

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
| player-quick-mark | 3 | 360, 390: header a tall thin column; 360: rows 71–90 and "Show claim" off screen | 360: better, still wrong. Keys smaller (about 29 px), pad and cue line on screen, but the ticket pictures wrap to two rows and only the top edge of "Show claim" shows. 390 fine | Flag |
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
- None this round: every local run passed first time (rule tests 520 of 520; no retries in the browser runs).
- Last round's notes (a slow first rule-test run under load; a 4-pixel difference between two Linux pictures; the
  cancelled quick verify 37101188825 at the 15-minute limit) did not recur.

## Requests for the Build workspace
- Layout item 1 under "Failing" (quick mark at 360 × 640: "Show claim" whole on screen).
- (Done since the last report: quick verify's area and shard steps pass when only @screens tests changed; layout
  items 2 to 5 fixed.)

## Notes for the owner (plain English)
- The second round of layout fixes worked for four of the five problems: on a small phone the hand-out screen shows the
  whole typed code, the payouts list no longer has a stray dot and shows a whole row, and the calling screen's header
  stays clear of the big number; in landscape the Prizes screen shows every button whole.
- Still to fix: on a small 360 × 640 phone the player's "Quick mark" screen shows only the top edge of "Show claim"
  (the player has to scroll to claim). It is closer than before.
- Still open from before: the cue line on the player's tickets is cut with "…" plus "More" on narrower phones and in
  landscape (a question for the product owner); before the first call the calling screen shows "Repeat · Another
  rhyme" and an empty "Last" (polish).
- The 57 pictures are ready for the product owner or UX designer to approve or flag at release.
