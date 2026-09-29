# Test report
Commit tested: 89a5e90 (app code unchanged since then), with the test changes in this commit   Date: 2026-09-29
Result: RED, by one expected failure: the new 42 px "One at a time" fit check (TAM-122, TAM-191, owner decision
2026-09-30). The app has not been changed for it yet. Everything else passes, including the owner's other two decisions.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 430 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 241 | 2 | 1 (unchanged) |
| Browser, iPhone (WebKit) | same | 235 | 2 | 7 (unchanged, incl. TAM-057 offline under the WebKit decision) |

## Failing (real bugs only)
- **TAM-191 / TAM-122** (`tests/browser/phone-tickets.spec.ts`, "TAM-191 and TAM-122: One at a time … no sideways
  sliding"), both phones. Expected: on a 390 px portrait screen, one ticket at a time fits with no sideways sliding.
  Actual: the ticket is 396 px wide inside a 390 px area (`tickets tickets-one`, `overflow-x: auto`), so it slides
  sideways and the last column (352 to 396 px) runs off the screen. Cells pass the 42 px minimum.
- **TAM-192 / TAM-122** (`tests/browser/phone-tickets.spec.ts`, "TAM-192: … tapping one opens it, Back returns"), both
  phones. The same fault: a ticket opened from a quick-mark thumbnail is shown the same way as "One at a time" and
  slides sideways in the same way (396 px in 390 px).

## Owner decisions of 2026-09-30 applied in this commit
1. TAM-175: giving a player a ticket they already hold is refused, "Ticket 1 is already Riya's", and nothing changes.
   Added to the scenario and the rules README, with a new check in `phone-claims.test.ts` (passes; a trailing full stop
   is accepted, as the app ends the reason with one). "Both shares go to Riya when she holds both" now reassigns only
   the tied ticket that isn't already hers, and checks she holds both; every tie check is unchanged. It passes.
2. TAM-122 and TAM-191 reworded to 42 px cells in "One at a time", with the whole ticket fitting a 390 px portrait
   screen. The check (cells at least 42 px; nothing around or inside the ticket scrolls or is slid sideways; every cell
   fully on screen) runs in "One at a time" on both tabs and on a ticket opened from quick mark. It fails, as above.
3. TAM-117 and TAM-177: a typed-code ticket offers every usual prize under "Show claim"; the host refuses a prize the
   game doesn't have, calmly, never as a bogey. New checks: `phone-claims.spec.ts` (typed code, 3-ticket game, Four
   Corners offered and refused with a reason, no bogey, the game carries on, a real prize is still judged) and
   `phone-claims.test.ts` (refused with a reason, no claim recorded, nothing changes, the ticket is not put out). Pass.

## Test faults (for the owner)
- None.

## Flaky or setup problems (not for the Build workspace)
- None this run. The one-off iPhone slow ticket link from the last report did not come back.

## Requests for the Build workspace
- TAM-122 / TAM-191: in "One at a time" (and a ticket opened from a quick-mark thumbnail) on a 390 px portrait screen,
  make the whole ticket fit with cells at least 42 px and no sideways sliding.
