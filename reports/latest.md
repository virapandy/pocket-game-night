# Test report
Commit tested: 5030bde (app code; tests are the ones pushed in c145f97)   Date: 2026-09-29
Result: GREEN. Every layer passes on Android and iPhone. Nothing failed, and no test was flaky.

Scenarios covered by this round (handover items 3 and 4, all approved or decided): TAM-088, TAM-089, TAM-199, TAM-197,
TAM-181, PLT-017, TAM-198, TAM-145, TAM-126, PLT-029. Every test that failed in the last report because the feature
did not exist yet now passes. The rest of the suite still passes.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 321 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 197 | 0 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 192 | 0 | 6 (unchanged) |

## Failing (real bugs only)
None.

## Flaky or setup problems (not for the Build workspace)
- None in this run.
- The Test clone still holds **uncommitted Phase 2 (phone tickets) work** (handover item 5). It was set aside for the
  whole run, so it is not in the counts above and not in this commit. It was put back unchanged afterwards.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
None.

## Questions for the owner (still open from the last report; no test depends on a guess)
1. PLT-029 vs PLT-016 and PLT-026: when the line already says "Session: Monday 5 Oct (new)", should the old
   "Continue or start a new session?" question still appear after Confirm prizes? The tests accept either for now.
2. PLT-017: in the row detail, is "got back" the prizes plus money handed back, or only the money handed back? The
   tests check it only where both are the same.

## Notes for the owner (plain English)
- Everything in this round works on both phone types. The payout screen shows one row per person (paid, won, net) with
  "Settle with host" and "Settle with players". The session tally has compact rows you can tap for detail. After a win
  the screen dims until you close the prize, and the menu still works. The last setup step shows the session line.
- Things to try in the preview: play a game with money to the end, try both settle buttons, open the session tally and
  tap a person, and start a new game to see the session line and its Change button.
