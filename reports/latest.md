# Test report
Commit tested: a9ed2c3 (app; the tests are 4afcd4a and 011883c on top)   Date: 2026-10-01
Result: RED (Android emulator only: 2 real bugs; every ordinary layer is GREEN)

Extended testing (roadmap step 7, `docs/handover.md` item 7), PLT-110 to PLT-123.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays, key check, with no Jev key (PLT-114) | `npm test` | 486 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 257 | 0 | 1 (unchanged, deliberate) |
| Browser, iPhone (WebKit) | same | 251 | 0 | 7 (unchanged, deliberate) |
| Android phone emulator, Chrome 109 on Android 13 (PLT-120, PLT-121) | `npx playwright test --config tests/playwright.android.config.ts` | 8 | 2 (both failed again on the retry) | 0 |
| Mass simulation, 100,000 scripted games (PLT-116, PLT-117) | `npx vitest run --config tests/vitest.extended.config.ts` | 100,000 games, 0 failures | 0 | — |
| Jev smoke run, 10 games with Jev personas (PLT-123) | same run, `JEV_GAMES=10 JEV_DECISIONS=300` | 10 games, 0 failures | 0 | — |
| Mutation testing (PLT-119) | not run: Stryker is not installed (request below) | — | — | — |

Jev decisions used: 300 this run; 451 of the 20,000 weekly cap used this week (2026-W40).

## Failing (real bugs only)
- `tests/android/emulator.spec.ts` "TAM-111: swiping in from the edge (Android's back gesture) during a game does not
  navigate away, each time" (TAM-111, PLT-121): expected the calling screen to stay after every back gesture; got:
  the first back gesture is absorbed, the second one (with a number called in between) leaves the app for the
  previous page in Chrome (`about:blank` in the test). Same result on the retry. The game itself is not lost: home
  shows it under "Unfinished games" with "Tap to resume" and it resumes at the same number (that check passes).
- `tests/android/emulator.spec.ts` "TAM-116: with the processor slowed like a budget phone, taps respond within
  100 ms" (TAM-116, PLT-121): expected every tap on "Next number" to show the new number within 100 ms; got 311 to
  340 ms on all 10 taps (5 per try, both tries). Measured further: the delay is the same with the processor at
  normal speed (297 to 340 ms), and it sits between the finger touching the screen and Chrome's click event
  (about 300 ms), not in the app's own work (3 to 22 ms after the click). A plain page with the same viewport line,
  tapped the same way on the same emulator, gets its click in 1 to 18 ms, so this looks like Chrome waiting to see
  whether the tap is a double tap on this app's pages. Worth confirming on a real Android phone.

## Passing on the Android emulator
- PLT-120 at 390 × 844 and at 360 × 800: setup, calling, a win, closing tiers, undo of the last call, a tie, ending
  and the payout summary (₹300 out equals the pot), all offline after the first visit; the calling screen never
  scrolls (TAM-138).
- TAM-111: pulling down on the calling screen does not refresh the page. TAM-065: if the page is left, the game
  resumes exactly where it was.
- TAM-112: Android closing Chrome in the background; the game reopens with "Game resumed" at the same number.
- TAM-064: Chrome finds the app installable (no installability errors, a valid manifest) and it starts offline
  from its start address.
- TAM-110 and TAM-128: the screen is kept awake during a game (or the hint shows).

## Simulations (summary in `reports/sim/summary-latest.md`)
- 100,000 scripted games (49,990 paper, 50,010 phone, 2 to 60 tickets): 85,760 played to the end, 10,550 ended
  early, 3,690 discarded, 0 never ended. 461,564 wins, 1,151,402 bogeys (all correctly refused), 28,679 ties,
  51,574 late joiners, 279,856 undos. First Full House after 43 to 90 numbers, typically 75. No number called twice,
  money always added up, no secret in any view, every replay matched: 0 failures, so no new replay files.
- Jev smoke run, 10 games: the slow grandparent, the over-eager child and the distracted guest played alongside the
  scripted players; Jev only picked among legal moves and the rules decided every verdict. 300 Jev decisions, then
  it fell back to scripts as this run's own limit said. 0 failures.
- Key check (PLT-115) passed, with the Jev key present on this computer, over every file git would publish,
  this report, the summary and the replays.

## Flaky or setup problems (not for the Build workspace)
- None this run. The 8 skipped browser tests are the same deliberate skips as before.
- The Android emulator run needed no new install on this Mac: the Android SDK, an Android 13 image and an emulator
  (`pgn_pixel`) were already here. How to set one up is in `tests/android/README.md`.
- Two of my own Android tests were fixed before this run (not loosened): the budget-phone test now uses a real touch
  screen (it could not tap at all before), and the back-gesture test now checks the scenario as written ("does not
  navigate away") instead of accepting a return trip through home.
- Test-side wording: the scripted part of the summary says "No Jev key: ran with random and scripted players" even
  when a key is present (that part never uses Jev). I will reword it next round; it changes no result.

## Requests for the Build workspace
1. devDependencies: `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` (same major version, the newest
   that supports Vitest 5; if none does yet, say so in `docs/test-questions.md`). No TypeScript checker plugin.
2. `package.json` scripts:
   - `"test:mutation": "stryker run tests/stryker.config.mjs"` (config already pushed; it mutates Tambola's
     `check`, `codes`, `prizes`, `rules`, `tickets` and `src/engine/money.ts`, `tally.ts`, runs
     `tests/vitest.mutation.config.ts`, writes `reports/stryker/`, never fails on a low score)
   - `"test:mutation:summary": "node tests/mutation/summary.mjs"` (writes `reports/mutation-latest.md`: share
     caught, per file, every mistake missed)
   - `"test:extended": "vitest run --config tests/vitest.extended.config.ts"`
   - `"test:android": "playwright test --config tests/playwright.android.config.ts"`
3. `.gitignore`: add `.stryker-tmp/` (`reports/stryker/` and `reports/runs/` are already there).
4. A new workflow `.github/workflows/weekly.yml`, separate from `ci.yml`, report-only (PLT-118):
   - `on: schedule: - cron: '0 2 * * 1'` (Mondays 02:00 UTC) and `workflow_dispatch`.
   - Its own `concurrency` group, so it never cancels or waits on "Check and publish"; no Pages permissions;
     nothing in `ci.yml` depends on it. Every job `continue-on-error: true`, `runs-on: ubuntu-latest`.
   - Job `simulation` (`timeout-minutes: 90`): checkout, setup-node 24 with npm cache, `npm ci`,
     `npm run test:extended` with `env: JEV_API_KEY: ${{ secrets.JEV_API_KEY }}` (the owner adds that repository
     secret; without it the step still runs and says "No Jev key"). Keep `reports/runs/jev-usage.json` between runs
     with `actions/cache` (key `jev-usage-<ISO year-week>`, restore-keys `jev-usage-`) so manual runs cannot pass
     the 20,000 weekly cap. Never `echo` the key or print the environment. Upload `reports/sim/` and `tests/replays/`
     as an artifact (`if: always()`).
   - Job `mutation` (`timeout-minutes: 300`): `npm ci`, `npm run test:mutation`, then (`if: always()`)
     `npm run test:mutation:summary`; upload `reports/mutation-latest.md` and `reports/stryker/`.
   - Job `android` (`timeout-minutes: 60`): enable KVM (the usual udev rule for `/dev/kvm`), `npm ci`,
     `npm run build`, then `reactivecircus/android-emulator-runner@v2` with `api-level: 33`, `target: google_apis`,
     `arch: x86_64`, `profile: pixel_6`, `disable-animations: true`, `script: npm run test:android`. Upload
     `test-results/android/` (`if: always()`).
   - Job `report` (`needs` all three, `if: always()`, `permissions: contents: write`): download the artifacts,
     write `reports/weekly/<YYYY-MM-DD>.md` with each job's result and the two summaries, commit it and the
     summaries to `main` as "Weekly run <date>" and push (a push by the workflow's own token starts no other run).
     If that is more than wanted, uploading the artifacts alone is enough; the tester can copy them into `reports/`.

## Questions for the owner
1. TAM-111 on Android: a second back gesture leaves the app for the page before it. The game is safe and resumes
   from home. Should the app stop every back gesture during a game (as the scenario and UX guideline 23 say), or
   is "the game is never lost" enough on Android? The test takes the scenario's wording until you say otherwise.
2. PLT-119: mutation testing will run as soon as Stryker is added; the first score will come in the next report.

## Notes for the owner (plain English)
- Everything that worked before still works, with no Jev key at all.
- 100,000 computer-played games found no rule or money mistakes. Ten games with Jev playing a slow grandparent,
  an over-eager child and a distracted guest also found none. Jev used 300 of this week's 20,000 decisions
  (451 used so far this week).
- On a real Android phone emulator, a whole game works offline at two phone sizes, survives Android closing
  Chrome, keeps the screen awake and can be installed. Two things need fixing: swiping back twice leaves the
  game (it is not lost, it waits on the home screen), and each tap on "Next number" takes about a third of a
  second to show, where the target is a tenth.
