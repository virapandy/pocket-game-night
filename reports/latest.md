# Test report
Commit tested: 76bd5b8 (app code; test commit on top: see git log)   Date: 2026-09-29
Result: RED, as intended. The owner answered the three spec questions (docs/decisions.md, 325bc40). TAM-082,
TAM-145, TAM-128 and TAM-138 are reworded and approved (owner, 2026-09-29), and their new checks fail on 76bd5b8
for exactly the reasons the review found. Everything else is unchanged and still green.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 306 | 4 (TAM-082) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 150 | 6 (TAM-145 ×2, TAM-123, TAM-138, TAM-125, TAM-128/TAM-138) | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 145 | 6 (same six) | 6 (unchanged) |

Build (`npm run build`): succeeds.

## What changed (all stricter, nothing loosened)
- Specs: TAM-082 (`08-prizes.md`) now says every tier except Full House is its share rounded to the nearest unit
  (₹10 by default), an exact half rounds down, and Full House takes the rest; the ₹300 example is spelled out.
  TAM-145 (`10-lifecycle.md`) adds "after the host closes a tier, its result goes away by itself; no Done is needed".
  TAM-138 and TAM-128 (`09-usability.md`) add that the one-time screen-sleep tip never covers the called number.
- `tests/games/tambola/prizes.test.ts`: the rounding property that allowed "within one unit" is replaced by an exact
  one: each tier other than Full House equals its share rounded to the nearest unit with halves down, and Full House
  is the pot minus the rest (5,000 random pots, ticket counts and units). New examples: ₹530 → ₹50 / ₹110 / ₹370;
  ₹450 with 10 tickets → ₹40 / ₹70 / ₹70 / ₹70 / ₹200; ₹450 with 3 tickets → ₹40 / ₹90 / ₹320; ₹2,800 with
  16 tickets → Early Five and Four Corners ₹280 each.
- `tests/browser/claims.spec.ts`: two TAM-145 checks: after "Close Top Line" (single and shared win), with nothing
  else tapped, the result card (`claim-result`) goes away and no "Done" button is left.
- `tests/browser/layout.spec.ts`: a TAM-128/TAM-138 check with the screen NOT kept awake: while the one-time tip is
  shown, nothing covers the called number, and the page does not scroll.

## Failing (real bugs only)
- TAM-082 `prizes.test.ts` "₹300 pot … ₹30 / ₹40 / ₹40 / ₹40 / ₹150": expected Early Five ₹30 and Full House ₹150,
  got Early Five ₹40 and Full House ₹140 (review finding 1).
- TAM-082 `prizes.test.ts` "an exact half rounds down in a smaller game: 3 tickets at ₹150 …": expected Early Five
  ₹40 (₹45 is a half, rounds down), got ₹50.
- TAM-082 `prizes.test.ts` "a ₹2,800 pot (16 tickets at ₹175) …": expected Early Five ₹280, got ₹290.
- TAM-082 `prizes.test.ts` "for every pot … exactly its share rounded to the nearest unit (half down)": e.g. Top Line
  at 20% of ₹510 (share ₹102) expected ₹100, got ₹110; a rounding difference goes to a tier other than Full House.
- TAM-145 `claims.spec.ts` "after "Close Top Line" the win goes away by itself" (both phones): expected the
  `claim-result` card hidden after closing, got it still visible (review finding 4).
- TAM-145 `claims.spec.ts` "a shared win goes away by itself too" (both phones): same, after a shared win.
- TAM-123 `layout.spec.ts` "while a win is shown …" (both phones): expected nothing on top of the number, got the
  win card (`claim-result`) covering it (review finding 2).
- TAM-138 `layout.spec.ts` "nothing covers the number while a win or a bogey is shown, after closing the tier …"
  (both phones): the `claim-result` card covers the number while the win and the bogey are shown, and after Close.
- TAM-125 `layout.spec.ts` "Called 21 · Undo (5s)" … (both phones): expected the toast not to overlap the prize
  chips, got an overlap (review finding 3).
- TAM-128/TAM-138 `layout.spec.ts` "while the one-time tip is shown, it never covers the called number" (both
  phones): the tip ("Keep your screen on: this phone may let …") covers the number at 5 of 25 points (its top edge).

## Already passing
- TAM-138 "after an undo of a call, nothing covers the number" (both phones).
- TAM-082 "an exact half rounds down: 10 tickets at ₹45" and the ₹530 example (both already match the rule).
- TAM-128 "refused: a one-time tip, then only a small icon" and "kept awake: neither appears" (both phones).
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
- Answered 2026-09-29: TAM-082 rounding (nearest ₹10, halves down, Full House the rest), TAM-145 (result goes away
  after closing), TAM-128/TAM-138 (the tip never covers the number). All now approved and tested.
- Still open from earlier: PLT-026 vs PLT-016 (a game paused overnight), TAM-067 paper-ticket late claims,
  TAM-067 rounding, PLT-014 session of old games.

## Scenarios without tests (not approved, or not this phase)
Phase 1b: none left. Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008, TAM-020 to TAM-029, TAM-032,
TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171, TAM-178,
TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); extended testing (PLT-114 to PLT-123); Phase 6 on hold
(TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
Your three answers are now written into the scenarios and have checks. On today's build they fail, as expected:
prize amounts other than Full House are not yet rounded to the nearest ₹10 with halves going down (Early Five gets
₹40 instead of ₹30 in a ₹300 pot), the win card stays after the host closes the prize, the win card and the
one-time "keep your screen on" tip sit on top of the called number, and the "Called 21 · Undo" message overlaps
the prize chips. Nothing else broke.
