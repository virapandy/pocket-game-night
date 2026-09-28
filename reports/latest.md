# Test report
Commit tested: 0ed2251 (app code unchanged since fb66361)   Date: 2026-09-28
Result: RED (expected: baseline before the Phase 1a build; Tambola's rules and screens do not exist yet)

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 112 | 131 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 5 | 52 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 2 | 53 | 3 (Android or Chromium only) |

Build (`npm run build`): succeeds.

## Failing (real bugs only)
None. Every failure is Phase 1a not built yet:
- `npm test`: all 131 failures are in the Tambola files (`tests/games/tambola/*`, `tests/contract/tambola.test.ts`,
  `tests/sim/tambola.test.ts`) and fail because `src/games/tambola/rules/` is empty: `tambolaRules`,
  `pickRhyme`, `suggestTiers`, `planPrizes`, `tambolaDefaults` and `rules` on the `tambola` registration
  are missing. The 3 fast-check property failures (TAM-034, TAM-082, TAM-091) fail on the very first
  input for the same reason. Engine and rhyme-pack tests all pass.
- Browser, Android: all 52 failures time out looking for Phase 1a buttons (setup, calling, claims).
- Browser, iPhone: 49 of the same, plus TAM-118 (the iPhone install tip is not built yet).

## Flaky or setup problems (not for the Build workspace)
- **WebKit is now installed on the Test Mac** (`npx playwright install webkit`), so the iPhone layer runs locally.
- **iPhone offline reload, needs checking in automation:** 3 iPhone tests that reload the page with no
  internet (`tests/browser/app-shell.spec.ts`: "after one visit, the app opens with no internet",
  TAM-064/TAM-114, TAM-069) fail every time (4 of 4 runs) with "WebKit encountered an internal error"
  on `page.reload`. The same tests get past the reload on Android. The first one is Phase 0 behaviour
  that already works on Android. This looks like a limit of Playwright's WebKit on macOS with offline
  mode and service workers, not an app bug, but I have not proved that. If automation (Linux WebKit)
  shows the same error, I will check offline opening by hand on the iPhone Simulator before calling it a bug.
- **Tests passing now only because nothing is built yet** (they will mean something once screens exist):
  "TAM-118: Android hosts do not see the iPhone tip" passes because no tip exists anywhere. TAM-116
  "usable within 5 seconds on a slow connection" passes against the Phase 0 home screen only.
- No flaky tests seen: the Vitest results matched the previous report exactly (112 / 131).

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- Unchanged from the last report: build Phase 1a against the tests. What the tests import and the shapes
  they expect: `tests/games/tambola/README.md`. What the browser tests look for on screen:
  `tests/browser/README.md`. Suggested order: rules module, setup screens, calling screen, claim check,
  end/discard/play again, saving/resume/history, usability.
- TAM-145 (prizes closed by hand; host ends the game) and TAM-144 (no prize won: contributions handed back)
  are covered by the tests; see the last report's notes, now in `tests/games/tambola/README.md`.
- Please update the "End of game" row in `src/games/tambola/CLAUDE.md` to match TAM-075 and TAM-145.

## Notes for the owner (plain English)
- The Test role is now run by the tester helper inside the orchestrator chat. The desktop app can still
  do this job, but not at the same time. `tests/CLAUDE.md` says so, and says "decided" scenarios count as approved.
- Baseline check done: everything that should work today works, and everything failing is Tambola that
  has not been built yet. The Build side can start.
- One thing to watch: on the iPhone test browser, reopening the app with no internet fails in a way that
  looks like a test-tool problem. I'll confirm it in automation or on the iPhone Simulator.
