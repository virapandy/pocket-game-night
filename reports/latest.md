# Test report
Commit tested: 1d1e626 (Phase 1a Tambola, round 2)   Date: 2026-09-28
Result: GREEN, apart from the known WebKit offline-reload issue (3 iPhone tests, not counted against the build)

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 243 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 57 | 0 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 52 | 3 (all the known WebKit offline-reload issue) | 3 (Android or Chromium only) |

Build (`npm run build`): succeeds. Browser counts are from the final full run of both phones with the
default number of workers, after the two test fixes below. The iPhone failures were re-run one at a time.

## Failing (real bugs only)
None.

Fixed since round 1 and now passing: TAM-101 ("Next number" no longer sticks disabled) and its knock-ons
TAM-012, TAM-016, TAM-017, TAM-064/TAM-114 (Android), TAM-070, TAM-145, TAM-156, PLT-002; PLT-012 on Android.
PLT-012 and PLT-013 on iPhone were test faults (see below), and pass now.

## Flaky or setup problems (not for the Build workspace)
- **Known: WebKit offline reload.** Every run, and again one test at a time: `app-shell.spec.ts` "after one visit,
  the app opens with no internet", TAM-064/TAM-114 and TAM-069 on iPhone fail at `page.reload` with "WebKit
  encountered an internal error". The same tests pass on Android. Not counted against the build. Still to confirm
  in automation or by hand on the iPhone Simulator.
- **Stalled taps under load (round 1):** not seen this round.
- **Test fix this round (stricter, not looser; see `docs/test-questions.md`):** PLT-013 and PLT-012 put their
  stand-ins for the browser's "keep my data" and "how full is storage" functions on the `navigator.storage` object.
  WebKit drops extra properties on that object during setup, so the app reached the real function and the test
  wrongly failed. Both stand-ins now go on `StorageManager.prototype` before the page loads, and both tests now
  also check that the stand-in is still in place when the app would use it. The round 1 finding "on iPhone the
  app does not ask to keep data" was wrong. PLT-012 and PLT-013 passed 3 of 3 repeats on each phone.

## Update 2026-09-28: PLT-004 changed by the owner (re-run on 060349e, same app code as 1d1e626)
- `specs/platform/01-lifecycle.md` PLT-004 now says: within 12 hours the game is not opened automatically; the
  home screen shows it with "Tap to resume", and one tap goes back into it, paused, where it was left.
- The browser test for it now also checks that the game is not opened on its own, that it is listed with
  "Tap to resume", and that one tap returns to the same number and calls with nothing called on its own.
- PLT-002 and PLT-004 browser tests: 6 of 6 pass (3 per phone). `npm test`: 243 of 243 pass (no unit tests for
  PLT-002 or PLT-004).

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- Unchanged: please update the "End of game" row in `src/games/tambola/CLAUDE.md` to match TAM-075 and TAM-145.

## Draft scenarios (no tests written)
- None in Phase 1a. Drafts found are for later phases only (for example TAM-020, TAM-032, TAM-050, TAM-053,
  TAM-117 for Phase 2; PLT-100 for Phase 2.5; TAM-200 for Phase 6).

## Notes for the owner (plain English)
- The serious bug from last round is fixed: "Next number" no longer gets stuck, so long games run to the end.
- The "storage nearly full" warning in History now shows.
- On iPhone, the app does ask the phone to keep saved games safe. Last round I said it did not; that was my
  test's mistake, not the app's. I fixed the test and noted it in `docs/test-questions.md`.
- The only failures left are the known iPhone test-browser problem with reloading while offline. It needs a check
  on a real iPhone or the iPhone Simulator before we can say offline works there.
