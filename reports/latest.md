# Test report
Commit tested: a9ed2c3   Date: 2026-09-29
Result: GREEN

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 460 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 257 | 0 | 1 (unchanged, deliberate) |
| Browser, iPhone (WebKit) | same | 251 | 0 | 7 (unchanged, deliberate) |

No test was changed between the tests commit (22a4a2e) and the commit tested. No flaky retries.

## Failing (real bugs only)
- None.

## Phase 7 "Report a problem" (PLT-200 to PLT-209)
All 30 new rules and contract checks in `tests/contract/reports.test.ts` and all 14 new browser checks in
`tests/browser/report-problem.spec.ts` now pass, on Android and iPhone. `tests/replays/` accepts saved reports and
every replay still plays cleanly (PLT-204).

| Scenario | Rules/contract | Browser (Android and iPhone) |
|---|---|---|
| PLT-200 report from any screen | pass | pass |
| PLT-201 no names, session names or money | pass | pass |
| PLT-202 waits for a connection | — | pass |
| PLT-203 crash caught, game safe | pass | pass |
| PLT-204 every report becomes a replay | pass | — |
| PLT-205 sorted and grouped | pass | — |
| PLT-206 no seeds until the game ends | pass | pass |
| PLT-207 player report: own tickets only | pass | pass |
| PLT-208 nothing leaves the phone, stub | pass | pass |
| PLT-209 waiting list, delete, sent once | — | pass |

## Flaky or setup problems (not for the Build workspace)
- None this run. The 8 skipped browser tests are the same deliberate skips as before (offline under a service
  worker cannot run in Playwright WebKit, checked by hand on iPhone; Chromium-only slow-down checks; phone-specific
  install tips).

## Requests for the Build workspace
- None.

## Questions for the owner (still open from the previous report; the tests take the reading shown there)
1. PLT-201 vs PLT-204: reports carry no money, so payout bugs cannot be replayed from a report alone.
2. PLT-201: only player names typed in "What happened?" are replaced; session names or amounts typed there are not.
3. PLT-205: how "confusion" and "idea" are told apart is not set.
4. PLT-202 and PLT-209: whether stub-kept reports are listed on the phone is not asked by the tests.

## Notes for the owner (plain English)
- "Report a problem" is built and every check passes on Android and iPhone: the menu item on home, the calling
  screen, the payout screen and a player's phone; the preview of exactly what is sent; names turned into
  "Player 1", "Player 2"; no money; secret numbers held back until the game is over; a calm "your game is safe"
  message after a crash; and nothing leaving the phone.
- Everything that worked before still works.
