# Test report
Commit tested: 120da09 (Phase 1a Tambola, round 1)   Date: 2026-09-28
Result: RED

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 243 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 51 | 6 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 46 | 9 (3 are the known WebKit offline-reload issue) | 3 (Android or Chromium only) |

Build (`npm run build`): succeeds. Counts are from the full run with the default number of workers.
Browser failures were then re-run (3 times, and again one test at a time) to separate real bugs from flaky ones.

## Failing (real bugs only)
- **"Next number" sometimes stays disabled for good after a call (TAM-101, and so TAM-012, TAM-016, TAM-017,
  TAM-064/TAM-114 on Android, TAM-070, TAM-145, TAM-156, PLT-002).** Expected: the button stays disabled only
  until the new number is on screen (TAM-101). Got: the new number and rhyme are on screen, but the button stays
  `disabled` for the next 10 seconds and more, so the game cannot go on. It happens at random: after 3, 12 or 69
  calls; on both Android and iPhone; also when tests run one at a time. TAM-012 (90 calls) hit it in 5 of 7 runs on Android and 4 of 4 on iPhone.
  Every other test that calls numbers can hit it; which ones fail changes from run to run.
- **PLT-012** `lifecycle.spec.ts` "when storage is nearly full…" (Android and iPhone, every run): expected History to
  say storage is nearly full and offer to delete the oldest games when the browser reports 97 of 100 used; got
  History with only the "kept only on this phone" note.
- **PLT-013** `lifecycle.spec.ts` "the app asks the browser to keep its data when the first game starts" (iPhone only,
  the one run where setup finished; the other stalled in setup): expected the app to ask for persistent storage by the first call; got no request.
  Passes on Android. I checked that the test's stand-in for the request works on this WebKit, so the app is not asking.

## Flaky or setup problems (not for the Build workspace)
- **Known: WebKit offline reload.** Still happens, every run (4 of 4): `app-shell.spec.ts` "after one visit, the app
  opens with no internet", TAM-064/TAM-114 and TAM-069 on iPhone fail at `page.reload` with "WebKit encountered an
  internal error". Not counted against the build. Still to confirm in automation or by hand on the iPhone Simulator.
- **Stalled taps when many tests run at once.** With the default number of parallel workers, some taps and typing
  hang for 10 seconds on an element that is visible and enabled (setup "Next", a player name box, a player button in
  Check a claim). Seen in PLT-004 (x2), PLT-007, PLT-013, TAM-101, TAM-102, TAM-107/TAM-108, TAM-119 and TAM-037
  in one run or another; each passed on a re-run with one test at a time. Treated as load on the test Mac, not a
  bug, for now. If automation shows the same, it may mean the app is slow on a busy phone (TAM-116).
- **Test fixes this round (stricter, not looser; see `docs/test-questions.md`):**
  - `fillPlayers` in `tests/browser/helpers.ts` matched "Name of player 1" to "Name of player 10" too; now exact.
    TAM-084 (10 players) passes.
  - TAM-037 in `claims.spec.ts`: the "3 ✓" and "3 ✗" checks could match "23 ✓"; now exact. Passed in every run that got past setup.
  - TAM-038 in `claims.spec.ts`: "complete at 4" could accept "complete at 45"; now it cannot.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- Fix the three bugs above. For "Next number", the check is TAM-101's second line: disabled only until the
  new number is on screen.
- Unchanged: please update the "End of game" row in `src/games/tambola/CLAUDE.md` to match TAM-075 and TAM-145.

## Notes for the owner (plain English)
- Big step: all 243 rules and money checks pass, and most screens work on both phones.
- One serious bug: now and then the "Next number" button stops working after a call, and the game gets stuck.
  It is random, so a real game night would probably hit it. The Build side needs to fix this first.
- Two smaller ones: the "storage nearly full" warning in History doesn't appear, and on iPhone the app doesn't
  ask the phone to keep its saved games safe.
- The Build side spotted two test mistakes that could have failed good code. They were right, and I fixed both
  tests plus one more of the same kind. None of this changed what the game should do.
