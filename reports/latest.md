# Test report
Commit tested: 5c5030d   Date: 2026-10-01
Result: RED, but only because of two faults in my own tests (details below). No real bugs found: every behaviour
in the approved scenarios for item 2 and UX list rows 1, 1a and 2 to 7 is built and checked.

Task: loop step 4 for `docs/handover.md` item 2 (app version) and UX list rows 1, 1a, 2 to 7. Scenarios: PLT-200,
TAM-053, TAM-195, PLT-300, TAM-057, TAM-213, TAM-181, PLT-301, TAM-103, TAM-124, TAM-197, TAM-192, plus the whole
suite. `npm ci` run first (package-lock changed for the 1.0.0 version).

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (no Jev key) | `npm test` | 517 | 0 | 0 |
| Browser, Android (Chromium) and iPhone (WebKit) | `npm run build && npm run test:browser` | 563 | 3 (test faults) | 8 (unchanged, deliberate) |

Android: 2 failing (TAM-192 caption, TAM-116). iPhone: 1 failing (TAM-192 caption; TAM-116 is Chromium-only and
skipped on iPhone, as before).

## Real bugs
- None.

## Tests I believe are wrong (for the owner; not changed, per the rules)
1. TAM-192 caption, `tests/browser/phone-tickets.spec.ts` "each thumbnail is captioned with its ticket" (Android and
   iPhone). The app does caption each thumbnail: the page's accessibility tree reads `Ticket 1` followed by the
   ticket's numbers as separate items. The test reads the thumbnail's raw text, where the caption and the first number
   run together with no space ("Ticket 112 27 42…" reads as "Ticket 112274…"), so its "Ticket 1 then a word break"
   check can never match. The test should read the caption on its own, or allow the numbers to follow directly.
2. TAM-116, `tests/browser/usability.spec.ts` "usable within 5 seconds … slow connection" (Android only). It waits
   for a Home button named "Tambola…", which PLT-300 (approved 1 October) replaced with "Host a game" and "Join with
   my ticket". I missed this test when adapting the shared steps in 74bad36. Home does load: "Host a game" is on
   screen. The test should wait for "Host a game" instead; the 5-second limit stays the same. It failed 5 out of 5
   on a repeat run, the same way each time.

Both changes keep the check just as strict. With your OK I will make them in the next round.

## Flaky or setup problems (not for the Build workspace)
- None.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- None new.

## Notes for the owner (plain English)
- Everything you approved on 1 October is now in the app and passes its tests on both phones: the new Home, the
  paper-or-phone cards with Next, the host's pattern-cue switch (off by default) and the one-line cue, one main button
  per screen, the bigger quick-mark keys with ticks, "Show claim" at the bottom, and app version 1.0.0.
- The run is still red only because two of my own tests check things the wrong way (above). Nothing in the app needs
  fixing. Questions 1 to 6 in the previous report are still open.
- No scenarios are left in draft from this task.
