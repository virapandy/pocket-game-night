# Test report
Commit tested: 12e38a3 (app code; tests unchanged from 92a289d)   Date: 2026-09-28
Result: GREEN

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 265 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 92 | 0 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 87 | 0 | 6 (unchanged: 3 Android or Chromium only; 3 offline reload, owner decision) |

Build (`npm run build`): succeeds. No replay files were written (no simulation failures).

Focus this round: **TAM-108** (one tap on the room view returns to the host controls at once) and **TAM-126**
(long press opens the room view; lifting the finger does not close it) now both pass on Android and iPhone. The
TAM-108 and TAM-126 browser tests were also run 3 extra times on each phone: 18 of 18 passed, so not a lucky run.

All Phase 1a.1 scenarios pass: TAM-037, TAM-039, TAM-033, TAM-086, TAM-139, TAM-034, TAM-088, TAM-089,
TAM-093, TAM-144, TAM-066, PLT-017, TAM-082, TAM-092, TAM-091, TAM-077, TAM-107, TAM-108, TAM-123 to TAM-129,
TAM-138, TAM-181 to TAM-183, plus every older test.

## Failing (real bugs only)
None.

## Flaky or setup problems (not for the Build workspace)
None this run.

## Requests for the Build workspace
None.

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
Everything passes on both phones. The last problem is fixed: after opening "Show the room", one tap goes straight
back to the host screen, and a long press still opens the room view without closing it again when you lift your
finger. One question is still open for you: on the first setup step, is tapping "Paper tickets" (now a big button
at the bottom) enough, or do you want a separate "Next" there?
