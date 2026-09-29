# Test report
Commit tested: 76bd5b8 (keep the big number out of the top bar; no pop after Settings)   Date: 2026-09-29
Result: Phase 1b GREEN on 76bd5b8. No real bugs. The PLT-028 test fault (a rare false failure in a money
property test) is fixed with the owner's approval; `npm test` then passed 6 runs out of 6.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 304 | 0 (6 of 6 runs after the approved PLT-028 fix) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 150 | 0 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 145 | 0 | 6 (unchanged: 3 Android or Chromium only; 3 offline reload, owner decision) |

Build (`npm run build`): succeeds. Full browser suite run twice: green both times.

## Round 1 bugs: both fixed
- **iPhone Menu covered by the big number** (TAM-180, TAM-120, TAM-186): fixed. Because it depended on the drawn
  number, `voice.spec.ts`, `auto-call.spec.ts`, `dark-mode.spec.ts` and `sessions.spec.ts` were run 6 times each on
  both phones (480 runs): all passed, including "Play again: the voice is off again in the new game" and the
  auto-call timer, pause and Check numbers tests on iPhone.
- **Closing Settings replayed the number's pop** (TAM-134): fixed. The number's box is the same size before and
  after dark mode on both phones, in all 6 repeats.

## Approved test fixes (owner, 2026-09-29), recorded in `docs/test-questions.md`
- `tests/contract/tally.test.ts` (PLT-028), "for any balanced nets: … in the fewest hand-overs": the last person's
  net is now built as `0 - sum(some)` instead of `-sum(some)`, so it can never be JavaScript's "negative zero".
  Exactly as strict as before. `npm test` passed 6 runs out of 6 afterwards (app code unchanged since 76bd5b8).
- `tests/browser/auto-call.spec.ts` (TAM-186, TAM-120): timer found by role and exact name "Time between calls".
  All 12 auto-call tests pass on both phones.
- `tests/browser/sessions.spec.ts` (PLT-016, PLT-026): the "2 games" / "3 games" / "1 game" checks no longer rely
  on spaces around the count. All 9 session tests pass on both phones.
Both are exactly as strict as before.

## Failing (real bugs only)
None.

## Test faults
None open. The PLT-028 fault from the first run is fixed (see above).

## Flaky or setup problems (not for the Build workspace)
- None. No flaky browser test in 2 full runs plus 480 repeated focus runs.

## Requests for the Build workspace
- None needed. Still optional, for screen readers: the session row reads as "Nani's2 gamesNot settled" run
  together; a space or separator between its parts would read better.

## Spec questions (for the orchestrator and the owner)
- Still open from last report: PLT-026 vs PLT-016 (a game paused overnight and ended in the morning: does the next
  game ask "Continue … or start a new session?"), TAM-067 paper-ticket late claims, TAM-067 rounding.
- PLT-014 does not say which session old (format-1) games belong to. Tested only what PLT-014 promises: they open,
  with nothing lost.

## Scenarios without tests (not approved, or not this phase)
Phase 1b: none left. Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008, TAM-020 to TAM-029, TAM-032,
TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171, TAM-178,
TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); extended testing (PLT-114 to PLT-123); Phase 6 on hold
(TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
Everything in the next stage now works on both an Android phone and an iPhone: sessions, the money tally and
Settle up, adding a late player, deleting and reusing past games, the phone's voice, auto-call and dark mode.
The two small problems from last time are fixed: on iPhone the Menu button always works with the voice or
auto-call on, and closing Settings no longer makes the number "pop". I corrected the two checks you approved.
One more of my own checks is written wrongly: now and then (once in my four runs) it invents a "minus zero" amount and then
complains it is not zero. The app is right. May I correct it? The correction keeps it just as strict.
