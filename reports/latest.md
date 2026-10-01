# Test report
Commit tested: d3aa874   Date: 2026-10-01
Result: GREEN locally (every layer, Android and iPhone). Automation result for this push: see the commit that follows this one, or the orchestrator's summary.

Task: loop step 4 for `docs/handover.md` items 2 (small fixes) and 3 (report answers Q1 to Q4).
Scenarios: TAM-198, TAM-181/TAM-199, PLT-201, PLT-204, PLT-205, PLT-202/PLT-209, plus the whole suite.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (no Jev key) | `npm test` | 512 | 0 | 0 |
| Browser, Android (Chromium) and iPhone (WebKit) | `npm run build && npm run test:browser` | 518 | 0 | 8 (unchanged, deliberate) |

All 9 rule-level and 12 browser-level tests that failed on 280a32d now pass:
- TAM-198 strict: the called number stays as bright while the rest is dimmed.
- TAM-181/TAM-199: both settle buttons are on screen at 390 × 844 with 6 and with 20 players.
- PLT-201/PLT-204: reports carry the money numbers (contribution, prizes, payouts with names as "Player N"); a
  money bug replays with the same pot.
- PLT-205: "Undo didn't work" (straight or curly apostrophe) is a bug; "Lovely game, thank you" and "asdf" are noise.
- PLT-202/PLT-209: reports kept by the stub or kept offline are listed under "Reports waiting to send" with the note.

## Failing (real bugs only)
- None.

## Flaky or setup problems (not for the Build workspace)
- None this round. No dependency changes, so no `npm ci` was needed.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- None new. Thank you for the browser-trace upload in automation (earlier request); the early ticket link request
  still stands as optional.

## Notes for the owner (plain English)
- The two small fixes and the four report answers are built and every check passes on both phone types.
- Open question still waiting for you (in `docs/test-questions.md`, 2026-10-01): when a problem report has words of
  two kinds ("How do I add a player?"), the app treats it as a bug first, then confusion, then idea. Please confirm
  that order or choose another; no test depends on it yet.
