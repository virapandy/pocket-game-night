# Test report
Progress (2026-10-03 10:40 local, tester): lanes A, B, C (C1/C2) and the C3 batch tested on dccc48e; tests the lanes
broke updated to the approved rows; C2 tests written for rows 4, 7, 22, 24 (row 9 in the session tests); C3 tests pass;
scoped mutation for the C3 batch 100%. Next: the coder fixes the 3 pattern-cue bugs below (lane A, TAM-195), then a
release candidate. Rows built: 25 of 25 merged (1-25 in lanes and C3); rows with all their tests green: 22 of 25 (rows 1
and 3 wait on the cue fixes; row 11's "Early Five once" too).

Commit tested: dccc48e (app; lanes A-C at 92a84f9 plus the C3 batch)   Date: 2026-10-03
Automation run: see "Automation" below (filled in after the push)
Result: RED (3 real bugs in 4 tests, all in the player's pattern cue, TAM-195; everything else green locally)

Task: `docs/change-sop.md`, the tester's part of C1/C2 lanes A, B, C and the C3 batch (rows 6, 8, 20, 21, 23).
Scenarios: the UX list rows of `docs/handover.md` 2b, approved, owner, 2026-10-03.

## Layers (run on the owner's Mac: `caffeinate -i taskpolicy -b`, at most 3 workers, Android first)
| Layer | Tests run | Passing | Failing |
|---|---|---|---|
| Rule tests (`npm test`) | 520 | 520 | 0 |
| Browser, Android: every spec the lanes broke or I changed (phone-claims, phone-tickets, after-the-game, held-tickets, phone-late-joiners, sessions, session-line, layout, history, ux-rows-3-oct (new), pattern-cue, ux-rows-8-15, home-and-buttons, report-problem) | 206 | 202 | 4 (3 real bugs; one of them in 2 tests) |
| Browser, iPhone: specs touching layout (layout, phone-tickets, ux-rows-3-oct) | 83 | 82 | 0 (1 skipped, as before) |
| Scoped mutation, C3 batch (`40717a7..dccc48e`, `rules.ts:875-877`, canUndo "to-paper") | 5 mistakes | 5 caught (100%) | 0 |
The automation run on 92a84f9 (quick verify 37095588430, Android, 292 tests) was red with 60 failures; all but the 3
below came from tests needing the approved new behaviour (mostly one shared hand-out step, row 7).

## Failing (real bugs only)
All three are lane A, the pattern cue with the host's switch on (TAM-195, UX list rows 1 and 11):
- `pattern-cue.spec.ts` "2 ticket(s)" and "3 ticket(s) on a 375 × 812 phone" (TAM-195, row 1): at 812 × 375 landscape,
  Larger text off, the line "Ticket 5: Early Five and Top Line filled. Shout if it's right!" wraps onto 2 lines;
  expected one line, with "More" when it doesn't fit.
- `pattern-cue.spec.ts` "fills on two tickets…" (TAM-195, product owner's answer 2, row 1): "More" lists "Ticket 1: top
  row filled", "Ticket 3: top row filled"; expected each ticket to name its prizes: "Ticket 1: Top Line filled" (the
  line itself, "Tickets 1 and 3: patterns filled · More", is right).
- `ux-rows-8-15.spec.ts` "Early Five on two tickets is said once" (TAM-195, row 11, and row 3's "Early Five named
  once"): the line says "Early Five filled on tickets 1 and 2" and "More" says it again; expected Early Five mentioned
  once across the line and "More", naming the first ticket: "Early Five filled on ticket 1".

## Tests updated (the approved rows; nothing unrelated loosened)
- Lane A: `phone-tickets.spec.ts` landscape test now waits, within its existing 1 second, for the tickets to re-lay
  after turning (see flaky section). Row 2 (fit to 320 px) added as a new test; the 390 px "at least 40 px" checks stay.
- Lane B: `layout.spec.ts` "nothing above the number" skips only screen-reader-only elements (the row 4 live region is
  1 × 1 px and clipped; nothing visible is excused); TAM-129 landscape now checks row 11: "Next number" at the bottom and
  72 px tall, "Record a win" just above it, never beside it (was: both within 40 px of the bottom); the iPhone turn gets
  the same 1-second settle. `after-the-game.spec.ts`: one past game is deleted with "Delete" ("Delete the past game",
  row 19).
- Lane C: `phone.ts` hand-out step answers the row 7 question with "Start anyway" (`startAnywayIfAsked`, also in
  `phone-late-joiners.spec.ts`); `phone-tickets.spec.ts` hand-out instruction is row 25's "Scan with your camera to get
  your ticket. Check it says Game 7K3P."; `sessions.spec.ts` and `session-line.spec.ts` PLT-016: the first game names its
  session on the session line, no naming screen (row 9; stricter: no question may follow).
- Shared: `enterTicketNumber` taps "Enter ticket number" only while the form is still closed (with no camera the form
  now opens by itself while the test was tapping).
- Specs reworded to the rows: TAM-122 (row 2), TAM-131/TAM-193 (rows 3, 13), PLT-302 new (row 4), TAM-132 (row 7),
  TAM-058 (row 8), PLT-016 (row 9), TAM-129 (row 11), TAM-089/TAM-199 "gets ₹100 overall" (row 14), TAM-120 (row 18),
  PLT-011 (rows 5, 19), TAM-140/PLT-005 (row 22), TAM-174 (row 24), TAM-107/TAM-172 (row 25).

## New tests
- `ux-rows-3-oct.spec.ts` (18 tests, all pass on Android; layout ones on iPhone): row 4 announcer (call and rhyme,
  "Another rhyme", recorded win, scanned accepted and bogey, never the proof line, never seen); row 7 (the question and
  its three answers; after "Start anyway" the last ticket is still the player's and his claim is judged as usual); row 22
  (banner after End with phone tickets, after End with paper, after Discard; above the payouts; nothing timed); row 24
  (proof line scanned accepted, bogey, by number; none for a paper win); row 25 (game code on hand-out, top bar, room
  view); row 2 (320 × 640 and 375 × 667).
- Rule tests: row 8 "to-paper" undo before the first call, never after (`phone-claims.test.ts`); the host's and each
  player's view carry the cue setting (`phone-secrets.test.ts`), the gap the last scoped mutation found at `rules.ts:766`.
- C3 tests written first (after-the-game, phone-claims row 6, held-tickets): all pass on dccc48e.

## Quarantined
SOP item 6 (standing owner approval): a test that fails and then passes with no change is set aside for at most 2 days,
listed here with its date, and fixed by the tester; never deleted or weakened. A test that blocks a release is not
quarantined without asking the owner.
| Test | Set aside on | Why | Back by |
|---|---|---|---|
| (none) | | | |

## Flaky or setup problems (not for the Build workspace)
- Two turn-the-phone tests read the screen one frame too early after the lane B/A layout changes (Android tickets: still
  stacked at the first frame; iPhone calling screen: the number 0 px tall for a frame). Fixed in the tests by waiting at
  most 1 second for the turn, the allowance already used for the tickets; not quarantined, since the cause is known.
- `enterTicketNumber` race (see above): fixed in the helper.

## Requests for the Build workspace
- None. The new names (`announcer`, `game-over`, `claim-proof`, `room-game-code`, `game-code` in the top bar) are as
  built; listed in `tests/browser/README.md`, last section.

## Notes for the owner (plain English)
- Row 7 works as built, but asks at the end of every phone-ticket hand-out: the last ticket is on screen when "Start
  calling" appears, so it always counts as "waiting", even when the player has scanned. "Hand it out now" goes back to
  the same ticket, and "Start calling" asks again; only "Start anyway" or "Give a paper ticket" get past it. The
  tests accept this (it matches the row), but the product owner may want "Start calling" on the last ticket to count it
  as handed out, or a "Yes, they have it" answer. A C2 choice; not a bug.
- Row 22: in a paper-ticket game the banner says just "✓ Game over" (no "phones away" line, since nobody has a phone
  ticket). I took that as the sensible reading and wrote it into TAM-140; the product owner can say otherwise.
- With one past game in unsettled tallies, the History question says "1 of them is in unsettled tallies": slightly odd
  English with only one game (polish, not tested).
- The ticket list's "Switch to paper (Dad)" button contains the word "paper", so the older TAM-058 browser check "the
  ticket says paper" would pass even before switching; the new row 7 test checks the button is gone instead. I'll
  tighten the older check next round (it doesn't loosen anything).
- The C3 batch (rows 6, 8, 20, 21, 23): every test written first now passes; mutation caught all 5 deliberate mistakes in
  the one rules change. Row 8's "Undo" coming back after undoing the first call is accepted (reviewer note).
