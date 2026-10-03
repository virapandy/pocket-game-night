# Test report
Progress (2026-10-03 local, tester): SPEED FIRST step 1 (tester part) done: smoke set tagged (16 tests, `@smoke`, 51 s on Android with one worker, all passing on app b223754) and the area map `tests/browser/areas.json`, both documented in `tests/browser/README.md`. Next: the coder's quick-verify automation uses them; then lanes A, B, C (UX rows 1-25). Rows done: 0 of 25.

Commit tested: 5c5030d (app; tests at the commit carrying this report)   Date: 2026-10-02
Result: RED (expected: tests written first for UX list rows 8 to 15; the app has not been built for them yet)

Task: loop step 2 for `docs/handover.md` step 2b, UX list rows 8 to 15 (owner approved the behaviour on 1 October).
Scenarios written or updated (all `approved, owner, 2026-10-01`): TAM-178 (row 8), TAM-181 (rows 9 and 15), TAM-190
(row 10), TAM-195 (row 11), TAM-214 new (row 12), TAM-125 and TAM-119 (row 13), TAM-177 (row 14), TAM-122, TAM-191,
TAM-126, TAM-117, TAM-193, TAM-132, TAM-183 (row 15), PLT-301 (lists the hand-out and the typed claim form).
The handover has no rows beyond 15. Names and test ids for the Build workspace: `tests/browser/README.md`,
"UX list of 1 October 2026, rows 8 to 15".

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (no Jev key) | `npm test` | 517 | 0 | 0 |
| Browser, Android (Chromium) and iPhone (WebKit) | `npm run build && npm run test:browser` | 566 | 46 (23 per phone, all new or replaced tests) | 8 (unchanged, deliberate) |

Every test that passed before still passes, except the three replaced ones listed under "Test changes".

## Failing (real bugs only): new tests waiting for the build, each failing for the right reason
Files: `tests/browser/ux-rows-8-15.spec.ts` (U), `tests/browser/held-tickets.spec.ts` (H), `phone-tickets.spec.ts` (P),
`layout.spec.ts` (L).
- TAM-178 (U, 2 tests): with no camera the typed form is open and "Enter ticket number" is still shown; with nothing
  filled in, "Check" gives a refusal instead of doing nothing (chosen-prize look not reached yet).
- TAM-181 (U, 2 tests): "Next ticket" is half width, 216 px above the bottom; "New game" is 319 px above the bottom.
- TAM-132 (U): reads "Waiting: Riya 2, Asha 1, Dad 1"; expected "Waiting: Riya (2 tickets), Asha (1 ticket), Dad (1 ticket)".
- TAM-183 (U): "Remove" is the main action's red, rgb(179, 38, 30); expected a neutral grey.
- TAM-190 (U, 2 tests): "Which ticket?" has no `ticket-picture`; with the cue on, ticket 1 is listed first instead of the
  ticket the cue named (3).
- TAM-195 (U, 2 tests): the cue outline is 3 px (expected at least 4) and there is no corner mark; the cue says
  "Ticket 1: Early Five filled." and repeats Early Five per ticket, instead of "Early Five filled on ticket 1" once.
- TAM-214 (H, 3 tests): Grandma's ticket on Riya's phone shows only "Ticket 3" (the header names everyone "Grandma");
  the claim screen says "Top Line · Ticket 3 · Riya"; a 4th ticket is accepted, no "This phone already holds 3 tickets".
  (Its two edge tests, rescanning a held ticket and a new game's ticket, pass already.)
- TAM-125/TAM-119 (U, 2 tests): 8 px between the undo toast and "Scan a claim" / "Record a win"; expected at least
  16 px; the toast is a near-black bar rgb(28, 27, 26).
- TAM-177 (U): "Cancel" on "Which prize?" has a border like a prize button; expected the link look.
- TAM-193 (U): "Done" under the claim QR has the main look; expected outlined.
- TAM-117 (U): the player's menu says "Enter a ticket code"; expected "Add a ticket by code". (The X-pattern hint
  already shows.)
- TAM-191/TAM-122 (P, 2 tests): "One at a time" ticket starts at x = 0; expected a 12 px margin each side.
- TAM-126 (L, 3 tests): chips run off the side ("Middle" 328 to 431 px on 390 px; "Bottom" 318 to 426 px on 375 px);
  expected them to wrap, every chip wholly on screen.

## Test changes (superseded by the owner-approved rows; please confirm the two marked "owner")
1. `layout.spec.ts`, TAM-126: "with seven tiers the chips stay on one line and scroll sideways" replaced by "the chips
   wrap: every chip wholly on screen, words in full, no sideways scrolling, the page never scrolls", at 390 px (7 tiers)
   and 375 px (5 and 7 tiers). Stricter. **Owner:** the UX list names TAM-183 for "host prize chips wrap", but the
   chips cut off ("Ho…") are the calling screen's, TAM-126; that scenario said "scroll sideways", now "wrap".
2. `phone-tickets.spec.ts`, TAM-191/TAM-122 (2 tests): "cells at least 42 px" replaced by "a 12 px margin each side,
   cells at least (screen width − 32) / 9" (39.8 px at 390, 38.1 at 375), now also checked at 375 px. **Owner:** a
   12 px margin cannot leave 42 px cells on a 390 px phone; the review's own figure is "about 39 px at 375".
3. Locators only, no behaviour loosened: `showClaim` and the TAM-190 test pick "Ticket 3" by a name that starts
   "Ticket 3" (the new pictures may add words); the TAM-058 test accepts "Can't scan? Give a paper ticket" as a button
   or a link.

## Spec questions (decided by the tester for now, owner may change)
1. Numbers chosen where the review gives none: at least 16 px above the toast's lower button; "lighter" toast = under
   3:1 against the screen (the main look is 3:1 or more); cue line at least 4 px ("thicker" than today's 3 px); a ticket
   picture at most 60% of the full ticket's height; the paper link at most 40 px above the main button and 44 px tall.
2. "Early Five said once" is read as: across all tickets, line and "More" together say Early Five once
   ("Early Five filled on ticket 1", or "on tickets 1 and 2").
3. "Waiting: Player 1 (1 ticket)" counts the tickets that player still waits for (it drops as tickets are handed out).
4. "Which ticket?" with the cue on and several fills: only the first-named ticket is required to say "Pattern filled".
5. TAM-214: on a phone holding tickets of two people, each ticket names its holder (Riya's own tickets say "Riya").

## Flaky or setup problems (not for the Build workspace)
- None.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- New test ids: `ticket-picture` (on "Which ticket?"), `cue-mark` (corner mark in each cue cell), optional
  `cue-outline`. Details in `tests/browser/README.md`.

## Notes for the owner (plain English)
- I wrote the checks for UX list rows 8 to 15 before the app changes, as usual, so they fail now; every one fails
  because the app still looks or behaves the old way, not because of a fault in the check.
- Two of your earlier rules changed to match your 1 October decisions: the prize chips now wrap instead of sliding
  sideways, and "One at a time" cells get a little smaller (about 40 px instead of 42) to keep a 12 px edge. Please
  confirm both.
- Row 12 is a new scenario, TAM-214: a phone can hold Grandma's ticket under her name, and at most 3 tickets.
