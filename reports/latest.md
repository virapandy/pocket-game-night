# Test report
Commit tested: 2d25d8b (app code; tests from 16c2c71 plus the two test-question answers in this push)   Date: 2026-09-28
Result: RED (one real bug, on both phones; everything else green)

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 265 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 91 | 1 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 86 | 1 | 6 (unchanged: 3 Android or Chromium only; 3 offline reload, owner decision) |

Build (`npm run build`): succeeds. No replay files were written (no simulation failures).

All Phase 1a.1 scenarios now pass: TAM-037, TAM-039, TAM-033, TAM-086, TAM-139, TAM-034, TAM-088, TAM-089,
TAM-093, TAM-144, TAM-066, PLT-017, TAM-082, TAM-092, TAM-091, TAM-077, TAM-123 to TAM-129, TAM-138, TAM-181 to
TAM-183, plus every older test that reaches the screen the new way.

## Failing (real bugs only)
- `tests/browser/calling.spec.ts` "TAM-107 and TAM-108: Show the room shows only the number … and the last 3 calls"
  (**TAM-108**, Android and iPhone): expected one tap on the room view to return to the host controls; got: a tap
  in the first half second after the room view opens is ignored and the room view stays. Measured on both phones:
  taps at 25 to 350 ms after it opens do nothing; taps at 700 ms or later work. Everything else in the test passes
  (controls hidden, number, last 3 calls, digits at least 160 px). This looks like a guard so that lifting the
  finger after the long press (TAM-126) does not close the view at once. TAM-108 has no such grace period, and a
  host opening it from the menu and tapping straight back loses the tap. Suggestion only: ignore just the release
  that ends the long press, not every tap for a while. Same failure 3 of 3 reruns on each phone, so not a flake.
  No replay (browser test).

## Flaky or setup problems (not for the Build workspace)
None this run.

## Test questions answered (docs/test-questions.md)
1. **TAM-084 reading `tier-amount` text:** agreed. The anchor sees each amount in its "<Pattern> amount" field, and
   TAM-183 says it is shown once, so the tests now read the fields. TAM-084 checks Top Line holds 80 and the five
   fields add up to ₹500; the TAM-080/TAM-081 test checks each of the five tiers has a visible amount field and they
   add up to ₹300 (before, it only counted five `tier-amount` elements). `tier-amount` is removed from
   `tests/browser/README.md`, so the hidden copy can go. Stricter, not looser. Both tests pass on both phones.
2. **TAM-181 ticket-mode step:** left open for the owner (see spec question 1). No test changed.

## Requests for the Build workspace
- Fix TAM-108 above.
- The visually hidden `data-testid="tier-amount"` copies on the prizes step are no longer used by any test and may
  be removed.

## Spec questions (for the orchestrator and the owner)
1. **TAM-181:** the ticket-mode step has no "Next"; the builder made "Paper tickets" the fixed bottom button, with
   "Phone tickets (coming later)" above it. Is that what the owner wants, or a separate "Next"? Once answered, the
   Test role will reword TAM-181 and add a ticket-mode check. Today TAM-181 is tested on the players, contribution
   and prizes steps only.
2. **TAM-043** (unchanged from last round): reword to say the app's part is phone tickets only?
3. **TAM-129** (unchanged): "at least as readable as in portrait" tested as landscape digits at least as tall as
   portrait digits.
4. Readings used where the spec gives no number (unchanged): "large text" = at least 24 CSS px; "about 40% of the
   screen" = at least 30% of the screen height; "full width" = within 48 px; "at the bottom" = within 40 px of the
   bottom edge.
5. **TAM-093** late-joiner line needs late joiners (TAM-067, Phase 1b): tested with the 1b tests.

## Scenarios without tests (not approved, or not this phase)
Phase 1b (approved; tests next round). Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008, TAM-020 to TAM-029,
TAM-032, TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171,
TAM-178, TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); Phase 7 (PLT-200 to PLT-209); extended testing
(PLT-114 to PLT-123); Phase 6 on hold (TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
Nearly there. The feedback fixes all work in the tests: wins are recorded on the anchor's word, unwon money is handed
back per ticket, equal prizes stay equal, the calling screen fits on one screen, and the setup button stays at the
bottom. One small problem: after opening "Show the room", a tap in the first half second is ignored, so the room
view does not go back at once. One question for you: on the first setup step, is tapping "Paper tickets" (now a big
button at the bottom) enough, or do you want a separate "Next" there?
