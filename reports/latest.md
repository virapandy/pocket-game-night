# Test report
Commit tested: 5c26598 (app code; test and docs commits on top: see git log)   Date: 2026-09-29
Result: GREEN. Every layer passes on both phones. This closes the Phase 1a.1 review findings and Phase 1b.
Focus checks all pass: TAM-150 and TAM-153 (pack rebuilt to 361 rhymes, Hindi rhymes for the catalog's 55 numbers,
Hindi games fall back to a family-friendly English rhyme with an Indian reference), TAM-185 (Repeat, Another rhyme,
one-tap mute) and TAM-082 (tiny pots round to the rupee).

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (Phase 1a and 1b) | `npm test` | 318 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 157 | 0 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 152 | 0 | 6 (unchanged: offline and Chromium-only checks) |

`npm ci` run; build succeeded. The browser suite was run twice in a row: green both times, nothing flaky.

## Failing (real bugs only)
- None.

## What changed in the tests (no assertion changed)
- Browsers now run silent, so the computer running the tests makes no beeps or speech. The beeps came from the
  app's short tick on Next number (TAM-135, Web Audio), and any check that turns the phone's real voice on could
  speak aloud. New `tests/browser/fixtures.ts`: every page starts with Web Audio routed through a gain of 0 and each
  real speech utterance spoken at volume 0; the app still ticks and still asks to speak exactly as before. Tests that
  stand in for the voice (`fakeVoices`) are unaffected. All browser specs import `test`/`expect` from it instead of
  `@playwright/test` (same API). `tests/playwright.config.ts`: Android (Chromium) also starts with `--mute-audio`.

## Flaky or setup problems (not for the Build workspace)
- None this run.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- None.

## Notes for the owner (plain English)
- Everything passes on both Android and iPhone. Your rhyme change is in: 361 rhymes, Hindi rhymes where the
  catalog has them, and a family-friendly English rhyme with an Indian touch for the other numbers in a Hindi game.
  Tiny pots round to the rupee, and Repeat / Another rhyme / mute work.
- The tests no longer make sound on your Mac: the test browsers now play everything at zero volume.
