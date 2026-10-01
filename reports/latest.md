# Test report
Commit tested: 280a32d (app; unchanged at 059aaaa) with this round's new tests   Date: 2026-10-01
Result: RED, as expected: new failing tests for `docs/handover.md` "Next, in order" items 2 and 3 (owner-approved).
Every test that passed before still passes. Automation for this push will be red from these new tests only.

Task: loop step 2 for handover items 2 (small fixes) and 3 (report answers Q1 to Q4).

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (no Jev key) | `npm test` | 503 | 9 (all new, `tests/contract/reports.test.ts`) | 0 |
| Browser, Android (Chromium) and iPhone (WebKit) | `npm run build && npm run test:browser` | 506 | 12 (6 new tests × 2 phones) | 8 (unchanged, deliberate) |

## Scenarios changed (approved, owner, 2026-10-01)
- PLT-201: reports include the game's money numbers (contribution per ticket, prize amounts, payouts); names and
  session names still left out; the host sees exactly what is sent. (Q1)
- PLT-204: money bugs can be replayed from a report. (Q1)
- PLT-205: the sorting words for bug, confusion, idea, noise; a report with a caught error is always a bug. (Q3)
- PLT-202, PLT-209: reports kept by the stub are listed under "Reports waiting to send" with the note
  "Kept on this phone: sending isn't set up yet". (Q4)
- TAM-181: on the payout screen, "Settle with host" and "Settle with players" are reachable without scrolling at
  390 × 844, with 6 or 20 players. (Item 2)
- TAM-198: wording unchanged; a strict check added. PLT-201 Q2 (free text): no change.

Tests replaced with the owner's approval (Q1, "replace tests that require money to be left out"): in
`tests/contract/reports.test.ts`, "no money: no contribution, tier amount, pot …" and "no session name, and nothing
from the saved game's money record" became the money-in tests below; in `tests/browser/report-problem.spec.ts` the
PLT-201 "no ₹ / no money" assertions became "the money numbers are in".

## Failing (real bugs only: new behaviour not built yet)
- TAM-198, `tests/browser/close-prize.spec.ts` "strict: while dimmed, the called number looks exactly as bright as
  before the win": expected the number's background to stay the page colour (about 255,250,242), got grey (about
  140,140,136). The number's box sits above the dim layer but is see-through, so the dim shows behind the digits.
- TAM-181/TAM-199, `tests/browser/payouts-and-tally.spec.ts` "6 players: both settle buttons are on the screen as it
  first appears, and a tap there works": expected "Settle with players" to end within 844 px, got 1057 px.
- Same test, "20 players": expected within 844 px, got about 2428 px.
- PLT-201, `tests/contract/reports.test.ts` "the money numbers are in": expected `game.setup.config.money` to be
  `{ currency: 'INR', contribution: 37 }`, got `null`.
- PLT-201, "the payouts are in": expected `game.money` (the saved money record, names as "Player N"), got none.
- PLT-201, "edge: a game still being played holds its money numbers too": contribution missing.
- PLT-201, "no session name, and no settlement … the money record goes in with names replaced": `game.money` missing.
- PLT-204, "money bugs can be replayed": expected the replay's pot 148, got `null` (replayed as a "No money" game).
- PLT-205, "Undo didn't work" and the curly-apostrophe edge ("didn’t work"): expected bug, got confusion.
- PLT-205, "Lovely game, thank you" and "asdf": expected noise, got confusion.
- PLT-201/PLT-200, `tests/browser/report-problem.spec.ts` "from the payout screen … the money numbers are in":
  expected contribution 37 in the sent report, got none.
- PLT-202/PLT-209, "a report kept by the stub is listed with its date, first line and the note": expected 1
  `waiting-report`, got 0.
- PLT-202/PLT-209, "a report kept while offline is listed with the note too …": expected 2, got 0.

## Flaky or setup problems (not for the Build workspace)
- None this round.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- Names, test ids and shapes are in `tests/browser/README.md` (payout screen; "After a win … main action", the new
  "Strict" bullet; "Phase 7", money and "Reports waiting to send") and `tests/contract/README.md` ("Problem reports":
  `game.money`, money numbers in `game.setup.config`, the sorting words).
- Earlier optional requests (trace upload in automation, early ticket link) still stand.

## Notes for the owner (plain English)
- New checks were added for the two small fixes and the four report answers. They fail now because the app has not
  been changed yet; that is expected at this step.
- One open point for PLT-205: when a sentence has words of two kinds ("How do I add a player?" has "how do I" and
  "add"), which kind wins is not decided. The tests avoid such sentences; please decide if it matters.
- The tests count a phone's curly apostrophe ("didn’t work", as an iPhone types it) the same as "didn't work". Say so
  if you disagree.
