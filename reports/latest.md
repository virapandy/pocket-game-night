# Test report
Commit tested: b948252   Date: 2026-09-29
Result: RED (expected: new Phase 7 tests written before the code, loop step 2)

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 430 | 30 (all new: `tests/contract/reports.test.ts`) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 243 | 14 (all new: `report-problem.spec.ts`) | 1 (unchanged) |
| Browser, iPhone (WebKit) | same | 237 | 14 (all new: `report-problem.spec.ts`) | 7 (unchanged) |

Every test that passed before still passes. No flaky retries.

## Failing (real bugs only)
- None. Every failure is a Phase 7 test for code not written yet, and fails for that reason:
  - `tests/contract/reports.test.ts` (PLT-200, PLT-201, PLT-203 to PLT-208): "makeReport / makePlayerReport /
    addSeeds / reportText / readReport / sortReports is not exported from src/engine yet".
  - `tests/browser/report-problem.spec.ts` (PLT-200 to PLT-203, PLT-206 to PLT-209), on both phones: no
    `Report a problem` on home, the calling screen, the payout screen or the player's ticket screen; no "Something
    went wrong; your game is safe" after an uncaught error or a failed promise. The steps before (setting up paper and
    phone games, ending, handing out, scanning, marking) all work.

## Phase 7 scenarios (owner sign-off 29 September 2026)
PLT-200 to PLT-209 are now `approved` in `specs/platform/03-feedback.md`, with the product owner's verdicts; PLT-208
with the stub wording (reports go to a stub for now, nothing leaves the phone; a real free, no-account destination is
required before any wider public release).

| Scenario | Rules/contract | Browser |
|---|---|---|
| PLT-200 report from any screen, version, phone, seeds and moves | yes | home, calling screen (menu, not thumb zone), payout screen, player phone |
| PLT-201 no names, session names or money; preview is exactly what is sent | yes | yes |
| PLT-202 waits for a connection, never interrupts a game | — | yes (sending hook) |
| PLT-203 crash caught, game safe, report only offered | yes (error in report) | yes |
| PLT-204 every report becomes a replay | yes; `tests/replays/` also accepts saved reports | — |
| PLT-205 sorted, grouped, ranked weekly | yes (`sortReports`) | — |
| PLT-206 no seeds until the game ends | yes | yes (end and discard) |
| PLT-207 player report: own tickets and marks only | yes | yes (two phones) |
| PLT-208 nothing leaves the phone, no account, stub | yes | yes (every request checked) |
| PLT-209 waiting list, delete, sent only once | — | yes (sending hook) |

## Flaky or setup problems (not for the Build workspace)
- None this run.

## Requests for the Build workspace
- Names, shapes and test ids are in `tests/contract/README.md` ("Problem reports") and `tests/browser/README.md`
  ("Phase 7: Report a problem"), including the test-only sending hook `window.__pgnSendReport(text)`.

## Questions for the owner (spec questions; the tests take the reading shown)
1. **PLT-201 and PLT-204 pull against each other on money.** Reports carry no money amounts, so a report replays the
   game's calls, claims and bogeys exactly, but not its prize amounts: a bug in the payouts could not be reproduced
   from a report alone. The tests keep money out (PLT-201 wins). Is that right?
2. **PLT-201, names typed by the host.** The tests expect a player's name typed in "What happened?" to become their
   "Player N" (and a player's own name to be left out of a report from their phone). Session names or amounts typed
   in the sentence are not changed. Is that enough?
3. **PLT-205 with the stub.** Nothing arrives anywhere yet, so the sorting is tested as a function the app provides.
   The tests fix only: a crash is a "bug", an empty report is "noise", the same words or the same error are one
   group, the biggest group first, the last 7 days only. How "confusion" and "idea" are told apart is not set.
4. **PLT-202 and PLT-209 with the stub.** With the stub, a report is kept on the phone at once, so waiting for a
   connection is tested through a test-only stand-in for the future real destination. Nothing in the scenarios says
   whether reports kept by the stub are listed anywhere on the phone; the tests do not ask for it.

## Notes for the owner (plain English)
- This round writes the checks for "Report a problem" before it is built; nothing about the app has changed, and
  everything that worked before still works on Android and iPhone.
- The checks ask for: a "Report a problem" item in the menus (host and player phones), a short "What happened?"
  box, a preview showing exactly what would be sent, names turned into "Player 1", "Player 2", no money, and the
  game's secret numbers held back until the game is over. For now, sending keeps the report on the phone and nothing
  leaves it, as you decided; the checks confirm the app talks to no other server at all.
