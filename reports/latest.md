# Test report
Commit tested: 12e38a3 (app code; tests are the new Phase 1b tests in this commit)   Date: 2026-09-29
Result: RED, as expected: loop step 2 (failing tests written for Phase 1b, before the code). Every Phase 1a and
1a.1 test still passes.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 267 | 35 (all new, Phase 1b) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 95 | 53 (all new, Phase 1b) | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 90 | 53 (all new, Phase 1b) | 6 (unchanged: 3 Android or Chromium only; 3 offline reload, owner decision) |

Build (`npm run build`): succeeds.

## Owner decisions of 29 September applied
- **TAM-181**: scenario reworded; new browser check that the ticket-mode step has no "Next" and tapping
  "Paper tickets" moves on at once. Already passes on both phones.
- **TAM-043**: scenario reworded (the app's record of which number completed a pattern is phone tickets only);
  new rule check that a paper-ticket win the anchor accepts is recorded however many numbers later. Already passes.
- **TAM-129**: scenario reworded; the landscape check now also needs digits of at least 160 px. Already passes.

## New Phase 1b tests (all 27 Phase 1b scenarios are approved or decided; none in draft)
| Area | Scenarios | Files | Tests |
|---|---|---|---|
| Tally and settle up (rules, property tests: money adds up to the rupee) | PLT-017 to PLT-021, PLT-023, PLT-025, PLT-028 | `tests/contract/tally.test.ts` | 18 |
| Late joiners (rules, property test) | TAM-067, TAM-184, TAM-093 late-joiner line, TAM-073 | `tests/games/tambola/late-joiners.test.ts` | 18 |
| Sessions, tally, settle up, mark as settled, undo, settled record | PLT-016 to PLT-020, PLT-022, PLT-023, PLT-026 to PLT-028 | `tests/browser/sessions.spec.ts` | 9 per phone |
| History tools | PLT-006, PLT-009, PLT-010, PLT-011, PLT-025 | `tests/browser/history.spec.ts` | 9 per phone |
| Late joiners on screen | TAM-067, TAM-184, TAM-093 | `tests/browser/late-joiners.spec.ts` | 6 per phone |
| Phone voice | TAM-061, TAM-062, TAM-180, TAM-185, TAM-187 | `tests/browser/voice.spec.ts` | 13 per phone |
| Auto-call | TAM-120, TAM-186 (5 to 30 s in 5 s steps, 10 default), TAM-187, TAM-062 | `tests/browser/auto-call.spec.ts` | 12 per phone |
| Dark mode | TAM-134, TAM-188 | `tests/browser/dark-mode.spec.ts` | 6 per phone |

Names, test ids and shapes for the Build workspace: `tests/contract/README.md` (new: `tallySession`,
`settleUp`), `tests/games/tambola/README.md` (new moves `add-player`, `remove-player`; "Late joiners"),
`tests/browser/README.md` (new "Phase 1b" section). The browser helper now answers the session question after
"Confirm prizes" if the app asks it, so the 1a tests keep working once sessions exist.

Already passing today (correct behaviour, not a lucky pass): late joining set to 0 refuses a late joiner;
the app starts in light mode on a phone set to dark; an unfinished game has no Delete.

Why the rest fail (checked for every failure): the controls and functions are not there yet ("Sessions",
"Session name", "Settle up", "Clear all history", "Use this setup", "Delete", "Add a late player",
"Phone speaks the call", "Auto-call", "Dark mode", `tallySession`, `settleUp`, the `add-player` move), or the
unfinished setup is not remembered (PLT-006). No failure comes from a helper or an old test.

## Failing (real bugs only)
None: the failures are Phase 1b features not built yet.

## Flaky or setup problems (not for the Build workspace)
None this run.

## Requests for the Build workspace
None beyond building Phase 1b against the READMEs above.

## Spec questions (for the orchestrator and the owner)
1. **PLT-026 vs PLT-016:** PLT-026 says that after the paused game is resumed and ended the next day, "starting
   a new game the next day still asks 'Continue … or start a new session?'". PLT-016 asks only when a game starts
   more than 3 hours after the session's last game *ended*, and that game has only just ended. Which wins?
   Tested for now: the next day, with last night's game still paused, a new game asks (both scenarios agree).
2. **TAM-067, paper tickets:** "a pattern already complete when they join cannot be claimed". With paper tickets
   the anchor judges this, like any late claim (the TAM-043 decision), so the app records what the anchor
   accepts. The app's own check is tested with phone tickets (Phase 2). Please confirm.
3. **TAM-067 "rounded":** read as TAM-092's rounding: each tier except Full House grows in whole ₹10, Full House
   takes the rest and stays the largest.
4. Readings where the spec gives no exact wording: the suggested session name looks like "Sunday 4 Oct"; the
   voice's "one short note, once" means once per game; after "Check numbers", auto-call stays paused until the
   host resumes (there is no tier to close); TAM-134's "or a player" waits for tickets on phones (Phase 2), so
   only the host phone is tested.

## Scenarios without tests (not approved, or not this phase)
Phase 1b: none left (all 27 now have tests). Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008,
TAM-020 to TAM-029, TAM-032, TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132,
TAM-170, TAM-171, TAM-178, TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); Phase 7 (PLT-200 to PLT-209);
extended testing (PLT-114 to PLT-123); Phase 6 on hold (TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
Your three decisions are now in the scenarios and checked, and the app already does all three. The tests for
the next stage are written: sessions and the money tally with "Settle up", adding a late player, the phone's
voice and auto-call, dark mode, and deleting or reusing past games. They fail today because those features
aren't built yet, which is expected at this step; nothing that already worked has broken. One question for you:
if a game is left paused overnight and finished the next morning, should the very next game still ask
"Continue last night's session or start a new one?"
