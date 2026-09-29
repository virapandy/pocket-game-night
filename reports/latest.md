# Test report
Commit tested: f75a9bf (app code; test and docs commits on top: see git log)   Date: 2026-09-29
Result: RED, on TAM-082 tiny pots only. The owner answered the tiny-pot question (docs/decisions.md, e4bfa25):
when rounding to the unit would leave Full House smaller than another prize, the smaller prizes round to the
nearest ₹1 instead (halves down). TAM-082 is reworded and its checks now expect exactly that. The app still gives
those prizes ₹0 and Full House the whole pot, so three TAM-082 checks fail. This is a real bug for the Build role.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (Phase 1a and 1b) | `npm test` | 310 | 3 (TAM-082 tiny pots) | 0 |
| Browser, Android (Chromium) | not re-run this time (no app or browser-test change since the last run on f75a9bf) | 156 | 0 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 151 | 0 | 6 (unchanged: offline and Chromium-only checks) |

No dependency changes, so no `npm ci` was needed.

## Failing (real bugs only)
- TAM-082, `tests/games/tambola/prizes.test.ts` "6 tickets at ₹6 (a ₹36 pot)": expected ₹4 / ₹5 / ₹5 / ₹5 / ₹17,
  got ₹0 / ₹0 / ₹0 / ₹0 / ₹36.
- TAM-082, same file, "7 tickets at ₹5 (a ₹35 pot)": expected ₹3 / ₹5 / ₹5 / ₹5 / ₹17 (₹3.50 is a half, rounds
  down), got ₹0 for every tier but Full House.
- TAM-082, same file, property "each tier but Full House is exactly its share rounded … in tiny pots, to the
  nearest ₹1": fails on every run on a tiny pot, e.g. Early Five at 8% of ₹628 with a ₹100 unit is ₹50.24:
  expected ₹50, got ₹0.

## TAM-082 tiny pots (owner decision 2026-09-29)
- The rule the checks now expect, in order: every tier but Full House is its share rounded to the nearest unit,
  half down; if that would leave Full House smaller than another tier or below ₹0, the share rounded to the
  nearest ₹1, half down; Full House always takes the rest. Only if ₹1 rounding also fails are the tiers lowered
  ₹1 at a time, equal shares together; a one-off check of all 1,194,000 inputs the properties draw from found no
  such case with the suggested tiers (1,292 inputs need the ₹1 rounding, none need more), so that step is only
  checked for its limits.
- The "whole units" properties now expect whole rupees, not whole units, exactly where the rule switches to ₹1.
- The prizes file was run 4 times with fresh seeds: the same 3 checks failed each time, everything else passed.

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
- TAM-082 tiny pots: answered by the owner (see above and `docs/test-questions.md`).
- Still open from earlier: PLT-026 vs PLT-016 (a game paused overnight), TAM-067 paper-ticket late claims,
  TAM-067 rounding, PLT-014 session of old games.

## Scenarios without tests (not approved, or not this phase)
Phase 1b: none left. Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008, TAM-020 to TAM-029, TAM-032,
TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171, TAM-178,
TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); extended testing (PLT-114 to PLT-123); Phase 6 on hold
(TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
Your answer on tiny pots is now written into the scenario and the automatic checks: with a ₹36 pot the prizes
should be ₹4 / ₹5 / ₹5 / ₹5 / ₹17. The app still gives ₹0 / ₹0 / ₹0 / ₹0 / ₹36 there, so three checks are red
until the Build side changes it. Everything else still passes.
