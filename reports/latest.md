# Test report
Commit tested: f75a9bf (app code; test and docs commit on top: see git log)   Date: 2026-09-29
Result: RED, on one check only, and it is a spec question, not an app bug. Every failure from the last report is
fixed: TAM-082's rounding examples, TAM-145, TAM-123, TAM-138, TAM-125 and TAM-128 now pass on both phones. The
one remaining failure is the TAM-082 exact-rounding property on tiny pots, where the approved spec asks for two
things that cannot both be true (see "Spec questions"). No test was changed.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (Phase 1a and 1b) | `npm test` | 309 | 1 (TAM-082 property) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 156 | 0 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 151 | 0 | 6 (unchanged: offline and Chromium-only checks) |

Build (`npm run build`): succeeds. No dependency changes, so no `npm ci` was needed.

## Failing (real bugs only)
- None. The one failing check is listed under "Spec questions" below, because the app follows the approved spec
  as far as the spec can be followed.

## TAM-082 property runs (several seeds)
- The TAM-082 prize tests (`prizes.test.ts`, `setup.test.ts`) were run 9 times with fresh random seeds. Every
  property passed on every run except "each tier but Full House is exactly its share rounded … and Full House is
  the pot minus the rest", which failed on all 9 runs, always on a tiny pot next to a large unit. Examples:
  105 tickets at ₹3 (₹315 pot, ₹50 unit): exact rounding gives each small tier ₹50 and Full House ₹15, the app
  gives the small tiers ₹0 and Full House ₹315; 6 tickets at ₹56 (₹336 pot, ₹100 unit): Lines ₹100 each would
  leave Full House ₹36, the app gives ₹0 each; 32 tickets at ₹1 (₹32 pot, ₹5 unit).
- To be sure nothing else hides behind these, every input the properties draw from was checked (1,194,000
  combinations of tickets 2 to 200, ₹1 to ₹1,000, units ₹1 to ₹100; a one-off check, not kept as a test). The app
  gives exactly the rounded amounts in all but 1,292 of them (about 1 in 1,000). All 1,292 are cases where exact
  rounding would leave Full House below another tier or below ₹0. On all 1,194,000, the prizes add up to the pot,
  none is negative, Full House is the largest, equal shares get equal amounts and every tier but Full House is a
  whole number of units.

## Rhymes (TAM-150 to TAM-158)
- All rhyme tests pass against the rebuilt pack. The pack in the app is exactly catalog revision 4
  (`docs/games/tambola/rhymes.csv`, 397 rhymes, as recorded in `docs/decisions.md`): same 397 lines, none missing,
  none extra, no repeats. The catalog also meets every rule the tests check (at least 3 English, 2 of them
  family-friendly, and 1 Hindi per number; at most 40 characters; 7 English lines marked not family-friendly).

## Flaky or setup problems (not for the Build workspace)
- None.

## Requests for the Build workspace
- None.

## Spec questions (for the orchestrator and the owner)
- New, TAM-082 on tiny pots (answered in `docs/test-questions.md`, left open for the owner): the spec says both
  "every tier except Full House is its share rounded to the nearest unit" and "Full House stays the largest". For
  about 1 in 1,000 pot sizes (for example 6 tickets at ₹6, a ₹36 pot, with the default ₹10 rounding) both cannot
  hold, and the spec does not say which gives way or what the prizes should then be. The app puts the whole pot
  (or most of it) on Full House in those cases. The exact-rounding check keeps failing until the owner decides.
- Still open from earlier: PLT-026 vs PLT-016 (a game paused overnight), TAM-067 paper-ticket late claims,
  TAM-067 rounding, PLT-014 session of old games.

## Scenarios without tests (not approved, or not this phase)
Phase 1b: none left. Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008, TAM-020 to TAM-029, TAM-032,
TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171, TAM-178,
TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); extended testing (PLT-114 to PLT-123); Phase 6 on hold
(TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
All the fixes from the review now work on both Android and iPhone: the smaller prizes are rounded to the nearest
₹10 with halves going down (₹30 / ₹40 / ₹40 / ₹40 / ₹150 for a ₹300 pot), the win card goes away by itself after
the host closes the prize, nothing covers the called number, and the "Called 21 · Undo" message no longer overlaps
the prize chips. The new rhyme list (397 rhymes) is in the app exactly as approved.

One question for you. With very small pots, rounding the smaller prizes to ₹10 can leave Full House smaller than a
Line. Example: 6 tickets at ₹6 is a ₹36 pot; rounding gives each Line ₹10, leaving Full House only ₹6. Today the
app then gives all ₹36 to Full House and ₹0 to the rest. Is that what you want, or should the small prizes round
down (or to the rupee) in such games? Until you choose, one automatic check stays red.
