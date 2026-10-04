# Test report
Commit tested: app ce6513c (main, version 1.3.0, I24 fixes); tests last pushed 835006e   Date: 2026-10-04
Result: GREEN with one known app bug marked expected-to-fail (IMP-020 at 812 × 375 with Larger text, below). It
blocks the release candidate until fixed.

Verdict runs (GitHub):
- Complete run 37195629182 on 835006e: **green**. Rule tests 649 of 649. Browser, Android 629 passed (316 + 313); iPhone 597
  passed, 31 skipped (screenshots are compared on Android only) (313 + 284). The two IMP-020 checks count as expected
  failures on both phones.
- Quick verify: 37192305287 (2c57fff), 37193827736 (950ce9e), 37194355521 (f9a152e), 37194847736 (a54230f),
  37195629042 (835006e): all green (smoke 17 of 17, browser 247 passed on 835006e).
- Complete run 37194847819 on a54230f: red only because the IMP-020 marks covered Android alone and the same bug shows
  on the iPhone too. Fixed in 835006e by marking both phones.
- Local (Mac, ≤ 3 workers, low priority): `npm test` 663 of 663 (includes another session's untracked Tambola file,
  14 tests, not part of this push); the four changed Impostor browser files 314 of 314 on both phones.

## Failing (real bugs only)
- **IMP-020: clue order not shown at 812 × 375 with Larger text** (found in this round; not a regression in the rules).
  - Screen: Impostor clues screen, 3 to 5 players (so "Not enough clues?" and "Go round again" show), phone sideways
    812 × 375, Settings "Larger text" on.
  - Expected (IMP-020): the right half shows "✓ Everyone has seen their word.", "Phone in the middle, face up.",
    "Each say one word about your secret:", then `clue-order` "Meena → Kabir → Zoya → Riya → Arjun" (it may scroll
    inside its own box), then the IMP-022 button and the main button.
  - Actual on Linux fonts (GitHub, both phones): `clue-order` has **0 px** height, so it is not shown at all. The visible
    text goes from "Each say one word about your secret:" (wraps onto 2 lines at 21 px) straight to "Not enough clues?".
  - Actual on Mac fonts (Android, measured): `clue-order` box 17.2 px tall (top 180.2, bottom 197.4) for one 29.4 px line
    (21 px text, scrollHeight 29). Only the top 58 % of the line shows; the bottom half of the names is cut off.
    "Not enough clues?" 205.4–231 (19 px), "Go round again" 235–283, main button 299–359. With Larger text off it fits:
    23.8 px box for a 23.8 px line.
  - Cause in plain words: moving "Not enough clues?" and "Go round again" into the bottom bar (I24) took about 74 px
    from the right half, and the clue order box is the one that shrinks.
  - Tests: `tests/browser/impostor-round-screens.spec.ts`, "IMP-020 (I24): at 812 × 375 with Larger text and 5 players
    ... the clue order is shown in the right half" (expected to fail on Linux). Replay:
    `tests/replays/screen/impostor-w37193830503-011.json` (812 × 375, 4 players, Larger text: "not recognised" on
    the clues screen 4 times, because the runner can't see the clue order). It has `expectedToFail` on Linux. When
    the fix lands, both will show "expected to fail but passed" and the tester removes the marks.
  - Pictures: `reports/screens/imp-020-clues-larger-812x375-linux.png` (Screenshots run 37194355612) and
    `reports/screens/imp-020-clues-larger-812x375-mac.png`.

## Evening 128 of weekly run 37189752105 (812 × 375, 10 players): runner fault, fixed (879d20d)
- What happened: in the Players sheet the scripted host removed Dev; the "Dev left · Undo" toast (5 s, IMP-074) sits
  above the main button, over the recently-used name chip "Asha". The runner tapped "Asha", its 3 s click limit ran
  out under the toast, and it recorded a crash ("could not do button:Asha … Timeout") and then "no summary".
- Why it's not an app bug: the toast is where the spec puts it (README Terms, "Toast": a bar above the main button,
  5 s). A host would wait a moment or close the toast.
- Runner fixes (`tests/sims/impostor-runner.ts`): (1) a toast lying over the button the host wants is waited out
  (5.1 s) before the tap. (2) The app clock is frozen once the evening starts and moves only with the runner's
  steps, so a seed plays the same on any machine. Before this, the replay went differently on a slower computer:
  an "Undo" toast had already gone by step 116. (3) A replay that runs out of saved steps (one saved at a crash)
  carries on with the scripted host, so a fixed evening can reach its end.
- Proof: with fix (1) switched off, the frozen-clock replay gives exactly the original two findings. With the fixes,
  the replay passes on both phones. Kept as `tests/replays/screen/impostor-w37189752105-128.json`. 9 local evenings and
  40 evenings on GitHub (weekly only_sims run 37193830503, no Jev): 0 dead ends, 0 secrets shown, 0 layout breaks,
  0 confusing flags. The only finding there was the IMP-020 bug above (evening 011).
- Product owner's next-list item N5 (with 12 players, "Whose word?" hides its Cancel on small phones) is a separate
  issue. Evening 128 had 10 players and never reached "Whose word?". Not tested in this round.

## I24 changes: specs and tests (2c57fff)
- `specs/impostor/` updated word for word from `docs/games/impostor/scenarios.md`: IMP-022 ("Go round again" in the
  bottom bar above the main button, "Not enough clues?" 15 px above it), IMP-033 and the IMP-073 table (headline 44 px below
  390 px), README (canonical strings, Test hooks move table, announcer emptied when a new deal starts).
- Tests: IMP-022's label, its place (directly above the main button, nothing between, nearer the main button than the clue
  order at 390 × 844), "Not enough clues?" 15 px / 19 px with Larger text. IMP-073/IMP-033: 44 px and one line at 320,
  359, 360, 375 and 389 wide; 56 px at 390 and 812 × 375. IMP-083: the announcer is empty on a new deal (after "Next
  round" and through its deal, and after "Deal again with a new word"), and the next clue order is announced.
  Reopening an evening saved on the clues screen still announces the clue order. The old label was replaced in the
  journeys and privacy files. All pass on both phones.
- Quick verify on ce6513c (37191375633) was red only because the tests still used the old label; green from 2c57fff on.

## Screenshots (950ce9e, f9a152e, a54230f)
- The 4 Tambola Android references (host-game-over-payouts-360x640, host-verdict-proof-812x375,
  player-quick-mark-360x640, player-quick-mark-812x375): new Linux references from Screenshots run 37193828590 are
  **byte-identical** to the pictures the product owner approved at the 1.2.0 release gate (Screenshots run
  37119724773, `docs/handover.md` "Release gate rc-1.2.0", verdict GO). The Mac references were regenerated locally. The
  change is the ✓ moved to the corner of a marked number. No other reference changed.
- New Impostor C1 picture `impostor-clues-larger` (5 players, Larger text): references at 360 × 640 and 390 × 844 (Linux
  and Mac), waiting for the product owner's approval. Both read well. **812 × 375 has no reference** because of the IMP-020
  bug (pictures above). Take it after the fix, for approval.
- The reviewer's concern is confirmed: at 812 × 375 with Larger text the clue order can't be read.

## Mutation testing (Impostor rules changed since v1.2.0)
All of `src/games/impostor/rules/` is new since v1.2.0 (rules.ts, picks.ts, saved.ts, index.ts; types.ts holds only
types): 1,035 mutants. GitHub's weekly mutation job only covers Tambola and engine files, and its file list can only be
changed in the workflow (Build side), so this ran locally at low priority (3 workers, `caffeinate -i taskpolicy -b`),
with a scratch Stryker config pointing at the Impostor rule, property and contract tests (not committed).
**In progress** (interim, 4 October 19:00 IST): 418/1035 tested (74 survived, 6 timed out). Final score and surviving mutants follow in the next push.

## Flaky or setup problems (not for the Build workspace)
- Simulated evenings used to depend on the computer's speed (the app clock ran with real time). Fixed in the runner (above).
- The first two local Stryker attempts stopped early: the 5-minute first-run limit, then IMP-061's 1,000-evening
  property over the 120 s test limit under Stryker's tracking. Limits raised in the scratch config only; no test changed.

## Requests for the Build workspace
- Fix IMP-020 at 812 × 375 with Larger text (above).
- Add an Impostor group to the weekly mutation job (`.github/workflows/weekly.yml`, matrix `mutation`), for example
  `src/games/impostor/rules/rules.ts` split in two plus `picks.ts,saved.ts`. Its Vitest config must include
  `tests/games/impostor/` and `tests/contract/impostor.test.ts`. The scope note in `tests/vitest.mutation.config.ts` is
  another session's uncommitted work, so I did not touch it.

## Notes for the owner (plain English)
- The three I24 fixes work: "Go round again" now sits just above the main button under "Not enough clues?", the result
  headline is smaller on phones narrower than 390 px, and the screen reader starts each new deal fresh.
- One problem to fix before the release: with the phone sideways and Larger text on, moving "Go round again" down
  squeezed out the list of who speaks in what order. It's half visible or gone, depending on the phone's font.
- Evening 128's "crash" was the test robot's fault, not the app's. The robot has been fixed and now plays the same
  evening the same way on any computer.
