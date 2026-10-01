# Test report
Commit tested: 5c5030d (app; tests at the commit carrying this report)   Date: 2026-10-01
Result: GREEN

Task: apply the two test-fault fixes the owner approved on 2026-10-01 (TAM-192 caption, TAM-116 Home button), then
rerun everything on app commit 5c5030d.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (no Jev key) | `npm test` | 517 | 0 | 0 |
| Browser, Android (Chromium) and iPhone (WebKit) | `npm run build && npm run test:browser` | 566 | 0 | 8 (unchanged, deliberate) |

## Failing (real bugs only)
- None.

## Test changes (owner approved 2026-10-01, recorded in docs/test-questions.md)
1. TAM-192, `tests/browser/phone-tickets.spec.ts` "each thumbnail is captioned with its ticket": now checks that each
   thumbnail holds its own visible caption reading exactly "Ticket N". Just as strict.
2. TAM-116, `tests/browser/usability.spec.ts` "usable within 5 seconds … slow connection": now waits for "Host a game"
   on Home (name starts with "Host a game", as the PLT-300 tests use), same 5-second limit.

## Flaky or setup problems (not for the Build workspace)
- None.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- None new.

## Notes for the owner (plain English)
- Everything is green on both phones. The two fixes you approved were to my own tests; the app did not change.
- Questions 1 to 6 in the earlier report are still open. No scenarios are left in draft from this task.
