# Test report
Progress (2026-10-03, tester, release prep for rc-2026-10-03, `docs/change-sop.md` "Added 3 October" item 2): the
manual Screenshots run 37106167958 (success) made the Linux reference pictures; all 57 are now committed next to the
Mac ones as **unapproved references** (19 screens × 3 sizes, names `<screen>-<size>-android-linux.png`, exactly what
`screens.spec.ts` asks for on Linux). Earlier today: quick verify 37104619193 on 882fb03 GREEN. No browser tests run
locally for this step. Next: the product owner / UX designer approve or flag each screen below ("Screenshots to
approve"); then the release candidate's complete run compares against them. Rows built: 25 of 25; rows with all their
tests green: 25 of 25.

Commit tested: f6f154a (app; unchanged at 882fb03, the commit automation ran)   Date: 2026-10-03
Automation run: quick verify 37104619193 on 882fb03: GREEN. Smoke set 16 passed; the push touched shared test set-up,
so every browser test ran on Android: 349 passed, 1 skipped (the same one as before); rule tests green.
Result: GREEN

Task: SOP quick-verify round on lane A's TAM-195 cue fixes (rows 1, 3, 11) and lane C's row 7 "ask once" and row 19
History wording, then release prep (screenshot comparison, `docs/change-sop.md` "Added 3 October" item 2).

## Layers (owner's Mac: `caffeinate -i taskpolicy -b`, at most 3 workers, Android first)
| Layer | Tests run | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`) | 520 | 520 | 0 |
| Browser, Android: changed specs (ux-rows-3-oct, history, pattern-cue, ux-rows-8-15, phone-claims) | 77 | 77 | 0 |
| Browser, Android: the rest of lanes A and C (phone-tickets, held-tickets, home-and-buttons, report-problem, phone-late-joiners, after-the-game, sessions, session-line) | 98 | 98 | 0 |
| Browser, iPhone: specs touching layout (ux-rows-3-oct, pattern-cue, history) | 41 | 41 | 0 |
| Automation, Android, every browser test (run 37104619193) | 350 | 349 | 0 (1 skipped, as before) |
| Screenshot comparison, Android (`screens.spec.ts`, 24 tests, 57 pictures), 3 repeats | 72 | 72 | 0 |

The first run on these tests, quick verify 37101188825 on 0e1062a, was cancelled at its 15-minute limit (323 of 350
reached) with 2 failures, both test faults (below), fixed in 882fb03.

## Failing (real bugs only)
- None.

## Tests changed (the approved rows; nothing loosened)
- Row 7 (TAM-132), `ux-rows-3-oct.spec.ts`, 2 new tests: after "Hand it out now" the next "Start calling" starts calling
  with no question and the ticket stays Dad's phone ticket; after "Hand it out now" and giving the ticket to Asha,
  "Start calling" asks again naming Asha, and once more only once. Spec TAM-132 has both lines (C2 choice, lane C).
- Row 19 (PLT-025, PLT-011), `history.spec.ts`, new test: one past game in an unsettled tally, "Clear all history" says
  "It's in an unsettled tally, and will be taken out of it." and never "of them". Spec PLT-025 has the line.
- TAM-195 (rows 1, 3, 11), `pattern-cue.spec.ts`: "More" must say "Ticket 1: Early Five and Top Line filled" and
  "Ticket 3: Top Line filled" (was: either, with Early Five at most once; now exactly once, for the first ticket); the
  cue-off check also refuses "Top Line filled"; new test: at 360 px one ticket's too-wide line reads "Ticket 6:
  patterns filled. Shout if it's right!" with "More", the full words only behind "More", one line, Early Five once.
  `ux-rows-8-15.spec.ts`: "Early Five filled on ticket 1" exactly, never "on tickets".
- TAM-058, `phone-claims.spec.ts` and `ux-rows-3-oct.spec.ts`: "the ticket says paper" now reads the ticket's own words
  without its buttons (new helper `textOutsideButtons`), and the "Switch to paper" button must be gone.
- Test faults found by run 37101188825, `phone-tickets.spec.ts` (TAM-195): two tests looked for "Early Five" and
  "corners" on the line itself; on the runner's wider fonts the approved row 1 swap puts those words behind "More".
  They now read the line and "More" together and are stricter: "Early Five filled on ticket 1", "Ticket N: Four
  Corners filled". The line must still name the ticket and say "Shout if it's right!".
- `tests/browser/README.md`: "top row filled" replaced by the prize names (around lines 379 and 525–535); the swap, row 7
  and row 19 described; new section "Screenshot comparison".

## Screenshot comparison (new, `tests/browser/screens.spec.ts`, tag `@screens`)
Android phone, 360 × 640, 390 × 844 and 812 × 375, each screen as it first appears. Seeded randomness (same games,
tickets and game codes every run), clock starting 7:00 pm India time, animations off; QR codes and the counting-down
"Called 24 · Undo (5s)" bar covered by a box. Stable: 72 of 72 over 3 repeats. Screens (file name start, rows):
host-ticket-type (11, 1); host-prizes (9, 19); host-hand-out (10, 19, 25); host-not-handed-out-question (7);
host-plays-on-paper (8); host-calling (11, 16, 25); host-room-view (25); host-record-a-win (5);
host-game-over-payouts (14, 22, 5); host-verdict-proof (24, 5); host-settings-in-game (18); history-clear-one (5, 19);
player-tickets-cue (1, 2, 3); player-quick-mark (3); player-which-ticket (12); player-which-prize (17);
player-claim-qr (13, 19); player-done-with-this-game (20); player-home-saved-tickets (21).
- References exist for both machines: the Mac's (`-android-darwin.png`, 57) and, since today, Linux's
  (`-android-linux.png`, 57, from Screenshots run 37106167958). The complete run uses the Linux ones, so these 24 tests
  now compare instead of skipping.
- Neither set is approved yet: the product owner or UX designer checks them at release (list below).

## Screenshots to approve (rc-2026-10-03)
Folder: `tests/browser/screens.spec.ts-snapshots/`. Each screen has 3 Linux pictures:
`<screen>-360x640-android-linux.png`, `<screen>-390x844-android-linux.png`, `<screen>-812x375-android-linux.png`
(the Mac set has the same names ending `-android-darwin.png`). Pink boxes are covers the test puts over QR codes and the
counting-down Undo bar, not part of the app. Mark each Approve or Flag. "Looked at" is the tester's first look only;
every problem noted is the same on the Mac pictures (it is the app's layout, not Linux), and Linux's wider font makes
the 360 ones slightly worse.

| Screen (file name start) | Rows | Tester's first look | Approve / Flag |
|---|---|---|---|
| host-ticket-type | 11, 1 | 360 and 812: the "New game" title and question are half hidden under the Cancel bar (page scrolled) | |
| host-prizes | 9, 19 | 812: the prize list squeezed to a sliver, only the top edge of "Early Five" shows; 360: "+ Bottom Line" cut, "Remove" touches the box edge | |
| host-hand-out | 10, 19, 25 | 812: the QR overlaps "Can't scan? Give a paper ticket" and the "Next ticket" button; 360: "Check it says Game Z9QB" clipped at the bottom, the typed code and "0 of 3 handed out" not visible | |
| host-not-handed-out-question | 7 | Pop-up fine at 390; at 360 and 812 the QR cover lies on top of the pop-up and hides its words (test cover, see note) | |
| host-plays-on-paper | 8 | Looks fine; known polish: "Repeat · Another rhyme" and empty "Last" before the first call | |
| host-calling | 11, 16, 25 | 360: the big number's top is cut off under the header; otherwise fine | |
| host-room-view | 25 | 812: "Last" overlaps the rhyme text, and the 24/74/8 tiles are cut at the bottom | |
| host-record-a-win | 5 | 390 fine; 360: Back and Cancel partly under the Undo-bar cover (test cover); 812 fine | |
| host-game-over-payouts | 14, 22, 5 | 812: payout list squeezed to a sliver ("Top Line" cut through); 360: Riya's "net: gets ₹20" cut, Home/Report buttons wrap | |
| host-verdict-proof | 24, 5 | 360: the verdict card overlaps "Scan a claim" and the Early 5 / Top / House chips; 390 and 812 fine | |
| host-settings-in-game | 18 | Looks fine (page continues below) | |
| history-clear-one | 5, 19 | Looks fine | |
| player-tickets-cue | 1, 2, 3 | Looks fine; row 1 question already open: in landscape the line is cut with "…" plus "More" | |
| player-quick-mark | 3 | 360 and 390: the header (name, tickets, game, time) wraps into a tall thin column, pushing the grid down; at 360 rows 71–90 and "Show claim" are off screen | |
| player-which-ticket | 12 | 812: the ticket previews are very small to read; otherwise fine | |
| player-which-prize | 17 | Looks fine | |
| player-claim-qr | 13, 19 | Looks fine (812: ticket and Done continue below) | |
| player-done-with-this-game | 20 | Looks fine | |
| player-home-saved-tickets | 21 | Looks fine; 360: "Menu" touches the right edge | |

Note on the test covers (tester's own, for the owner): in `host-not-handed-out-question` (360, 812) and
`host-record-a-win` (360) the cover over the QR or the Undo bar is drawn on top of the pop-up and hides some of its
words, so those pictures cannot catch changes to those words. Tightening it (covering only what shows) changes the
pictures, so it waits for the reviewers' verdict and a new Screenshots run.

## Quarantined
SOP item 6 (standing owner approval): a test that fails and then passes with no change is set aside for at most 2 days,
listed here with its date, and fixed by the tester; never deleted or weakened.
| Test | Set aside on | Why | Back by |
|---|---|---|---|
| (none) | | | |

## Flaky or setup problems (not for the Build workspace)
- Quick verify 37101188825 was cancelled at the 15-minute job limit: a push touching shared test set-up runs all 350
  Android tests, which took 13.0 minutes on the green run and over 15 on the cancelled one. Not a test failure.
- Screenshots: a clock that never moves stalled the app (clicks that never finished), and the "Undo (5s)" countdown
  moved the bar's words; fixed in the spec (running clock, the bar covered). Not quarantined: never in the gate yet.

## Requests for the Build workspace
- `quick.yml`: the 15-minute limit is shorter than an "every browser test" run can take (13.0 and over 15 minutes
  today); raise it, or split that run into two shards.
- `quick.yml`: add `--grep-invert @screens` to its browser runs. Until then `screens.spec.ts` skips itself when
  `GITHUB_WORKFLOW` contains "quick".
- Linux reference pictures: a way to collect them from the runner, such as a manual workflow that runs
  `SCREENS_NEW=1 npm run test:browser -- --project=android --grep @screens --update-snapshots` and uploads
  `tests/browser/screens.spec.ts-snapshots/`. I then commit the approved ones.

## Notes for the owner (plain English)
- Every change in this round works as the rows say: the player's cue names prizes ("Ticket 1: Top Line filled"), says
  Early Five once for the first ticket, and shortens itself to "Ticket 1: patterns filled. Shout if it's right!" with
  "More" when the full words don't fit; "Start calling" asks once, and again only if the ticket changes hands; History
  says "It's in an unsettled tally…" for one game.
- Question for the product owner (row 1): in landscape (812 × 375) even the short line is cut with "…" ("Ticket 1:
  patterns filled. Shout if it's ri… More"). Row 1 said "in landscape the line is never cut off"; lane A's fix chose "…"
  plus "More". The tests accept it (one line, "More" holds everything); see `player-tickets-cue-812x375`.
- Seen in the pictures, polish only: before the first call the calling screen already shows "Repeat · Another rhyme"
  and an empty "Last" (`host-plays-on-paper`).
- The 57 pictures are ready for the product owner or UX designer to look through at release; once approved they become
  the reference that any later look change is compared against.
