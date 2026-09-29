# Test report
Commit tested: 76bd5b8 (app code; test commit on top: see git log)   Date: 2026-09-29
Result: RED, as intended. New checks for the product owner's review of the live 1a.1 build
(`docs/games/tambola/review-2026-09-29.md`) fail on 76bd5b8 for exactly the reasons the review found.
Everything else is unchanged and still green.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 304 | 2 (new TAM-082 checks) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 150 | 3 (TAM-123, TAM-138, TAM-125) | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 145 | 3 (TAM-123, TAM-138, TAM-125) | 6 (unchanged) |

Build (`npm run build`): succeeds.

## What changed in the tests (all stricter, nothing loosened)
- `tests/games/tambola/prizes.test.ts`, new block "TAM-082: Full House takes every rounding difference":
  the ₹300 example from the review (6 tickets at ₹50: ₹30 / ₹40 / ₹40 / ₹40 / ₹150), and a property check over
  5,000 random pots, ticket counts and units: every tier other than Full House is within one unit of its own exact
  share, a share that is already whole units is kept exactly, and Full House is the pot minus the rest.
- `tests/browser/layout.spec.ts`: a new check that nothing lies on top of the called number (25 points across it
  must show the number itself). New tests "TAM-138 and TAM-123: the number stays fully in view while a win is shown":
  win shown, bogey shown, after "Close Top Line" with no Done tapped, after an undo. The TAM-125 toast test now also
  checks the toast does not overlap the prize chips.
- `specs/tambola/09-usability.md`, TAM-125: wording updated to the owner-approved change of 2026-09-29 ("never
  covers "Next number", "Record a win" or the prize chips").

## Failing (real bugs only)
- TAM-082 `prizes.test.ts` "₹300 pot … ₹30 / ₹40 / ₹40 / ₹40 / ₹150": expected Early Five ₹30 and Full House ₹150,
  got Early Five ₹40 and Full House ₹140 (review finding 1).
- TAM-082 `prizes.test.ts` "a tier other than Full House is its own share rounded …": expected Early Five ₹280
  (10% of a ₹2,800 pot, 16 tickets at ₹175), got ₹290: a rounding difference went to Early Five, not Full House.
- TAM-123 `layout.spec.ts` "while a win is shown …" (both phones): expected nothing on top of the number, got the
  win card (`claim-result`) covering 10 of 25 points of it (review finding 2).
- TAM-138 `layout.spec.ts` "nothing covers the number while a win or a bogey is shown, after closing the tier …"
  (both phones): the `claim-result` card covers the number while the win is shown, while a bogey is shown, and
  still after "Close Top Line" (review findings 2 and 4).
- TAM-125 `layout.spec.ts` "Called 21 · Undo (5s)" … (both phones): expected the toast not to overlap the prize
  chips, got an overlap (review finding 3).

## Already passing
- TAM-138 "after an undo of a call, nothing covers the number" (both phones).
- All rhyme pack tests (TAM-150 to TAM-158) against the current pack. They count no rhymes and name no rhyme text,
  so revision 2 cannot break them by its size or wording. I also checked `docs/games/tambola/rhymes.csv`
  (revision 2, 405 rhymes) against every rule they test: at least 3 English (2 family-friendly) and 1 Hindi per
  number, a family-friendly English Indian-style rhyme per number, at most 40 characters, no repeats per number,
  some English rhymes not family-friendly (7). All hold, so the rebuilt pack should stay green.

## Flaky or setup problems (not for the Build workspace)
- None.

## Requests for the Build workspace
- None.

## Spec questions (for the orchestrator and the owner)
- **TAM-082 rounding direction.** The review proposes "every tier except Full House is its exact share rounded
  down". The approved TAM-082 example says a ₹530 pot across 10 / 20 / 70 % gives ₹50 / **₹110** / ₹370, which is
  rounding to the nearest ₹10 (₹106 → ₹110); rounding down would give ₹100 and Full House ₹380. The new checks
  accept either (each tier within one unit of its share; Full House takes the rest) and pin only the numbers both
  agree on. Nearest with halves going down (₹45 → ₹40) fits both examples. Which rule does the owner want?
- **Finding 4 (the result card stays after Close until Done)** is not in any approved scenario's words. The new
  TAM-138 check fails while that card covers the number after Close, but would not require the card to go away if
  it moved off the number. Proposed addition to TAM-145 for the owner's approval: "After the host closes a tier,
  its result goes away by itself; no Done is needed."
- **One-time screen-sleep tip (TAM-128) covers the top of the number while it is shown** (seen on the Android
  browser, where the phone refuses to keep the screen awake). TAM-138 says the number stays fully visible after
  calls. The new tests keep the screen awake so the tip does not appear; no test fails on it. Is covering the
  number with the one-time tip acceptable?
- Still open from earlier: PLT-026 vs PLT-016 (a game paused overnight), TAM-067 paper-ticket late claims,
  TAM-067 rounding, PLT-014 session of old games.

## Scenarios without tests (not approved, or not this phase)
Phase 1b: none left. Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008, TAM-020 to TAM-029, TAM-032,
TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171, TAM-178,
TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); extended testing (PLT-114 to PLT-123); Phase 6 on hold
(TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
The four problems the product owner found in the live game now have checks, and those checks fail on today's
build for the same reasons: Early Five gets ₹40 instead of ₹30 in a ₹300 pot (Full House loses the ₹10), the
win card hides the called number (and stays after the prize is closed), and the "Called 21 · Undo" message sits on
top of the prize chips. Nothing else broke. The new rhyme list (405 rhymes) passes every rhyme rule already.
One question for you: when a prize share is not a round number, should it round down, or to the nearest ₹10
(the approved example rounds ₹106 up to ₹110)?
