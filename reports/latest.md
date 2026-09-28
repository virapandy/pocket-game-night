# Test report
Commit tested: 1d1e626 app code (tests at 8d80d7b plus the WebKit skips below)   Date: 2026-09-28
Result: GREEN

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 243 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 57 | 0 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 52 | 0 | 6 (3 Android or Chromium only; 3 offline reload, owner decision) |

Build (`npm run build`): succeeds. App code (`src/`, `content/`, configs) is unchanged since 1d1e626.

## Owner decision carried out: offline-reload tests on iPhone (docs/decisions.md, 2026-09-28)
- **Confirmed a Playwright WebKit limitation, not an app fault.** Source: microsoft/playwright issue #42775
  ("WebKit offline emulation rejects service-worker navigation, including a literal response"), open, on
  Playwright 1.63.0 (our version), reproduced by Playwright's maintainers on macOS and Linux, Chromium and
  Firefox pass. Own probe with no app code at all (a two-line page and a service worker that answers every
  page load with fixed text): Chromium reloads offline fine; WebKit fails with the same
  "page.reload: WebKit encountered an internal error".
- **Change:** in `tests/browser/app-shell.spec.ts`, "after one visit, the app opens with no internet",
  TAM-064/TAM-114 and TAM-069 now skip on WebKit only, with a reason pointing to the issue and to
  `docs/decisions.md`. Nothing else in the tests changed; they run unchanged on Android (Chromium) and pass.
- **iPhone Simulator hand check: not done, the Simulator is not available on this Mac** (only Apple's
  Command Line Tools are installed, not Xcode). Offline opening on iPhone is therefore still unchecked by hand.
  To do it: install Xcode (free), or open the preview link once on a real iPhone, switch on Airplane Mode,
  reopen it, and check the home screen and the Tambola screens appear.
- Once issue #42775 is fixed in a Playwright release, the skips should be removed (owner approval needed).

## Failing (real bugs only)
None.

Fixed since round 1 and now passing: TAM-101 ("Next number" no longer sticks disabled) and its knock-ons
TAM-012, TAM-016, TAM-017, TAM-064/TAM-114 (Android), TAM-070, TAM-145, TAM-156, PLT-002; PLT-012 on Android.
PLT-012 and PLT-013 on iPhone were test faults (see below), and pass now.

## Flaky or setup problems (not for the Build workspace)
- **WebKit offline reload:** confirmed as Playwright issue #42775 (also failed in automation run 36424213432 on
  Linux). The three tests now skip on iPhone by owner decision; see above.
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
- Everything passes. The three "works with no internet" checks now run on Android only, as you decided. I confirmed
  the iPhone failures come from the test tool itself (a known, reported problem), not from our app.
- I could not check offline opening on iPhone by hand, because this Mac has no iPhone Simulator (it needs Xcode).
  Please try it on a real iPhone: open the preview once, turn on Airplane Mode, reopen it, and check Tambola opens.
