# Test report
Commit tested: b948252   Date: 2026-09-29
Result: GREEN

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 430 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 243 | 0 | 1 (unchanged) |
| Browser, iPhone (WebKit) | same | 237 | 0 | 7 (unchanged, incl. TAM-057 offline under the WebKit decision) |

No flaky retries on either phone.

## Failing (real bugs only)
- None.

## Focus of this round
- **TAM-191 / TAM-122**: "One at a time" on a 390 px portrait phone now fits the whole ticket: cells at least 42 px,
  nothing slides sideways, every cell fully on screen. Passes on Android and iPhone. The layout choice is still
  remembered for the next game.
- **TAM-192 / TAM-122**: a ticket opened from a quick-mark thumbnail fits the same way, and Back returns to quick mark.
  Passes on both phones.
- **TAM-173 / TAM-122**: the stacked portrait and landscape layouts still pass (no regression from the change).

## Test faults (for the owner)
- None.

## Flaky or setup problems (not for the Build workspace)
- None this run.

## Requests for the Build workspace
- None.

## Notes for the owner (plain English)
- On a phone held upright, "One at a time" now shows the whole ticket with big enough squares and no sideways sliding.
  The same is true when you tap a small ticket picture in quick mark to open it. Everything else still works on
  Android and iPhone. Worth trying in the preview: pick "One at a time" on a phone and check all nine columns are
  visible without swiping.
