# Test report
Commit tested: app 2118820 (main: Impostor round 5, lanes N, O and P, plus the endEvening fix)   Date: 2026-10-05
Result: RED: three real failures in what lanes N and O built (below). Everything else passes or is a load timeout on
the Mac that GitHub passes.

Runs:
- Quick verify 37269157361 on f998d78: 374 passed, 8 failed. 5 are the real failures below. 3 were test timing
  against the new 500 ms tap guard (Journey 8, IMP-013 easy and hard), fixed in the next push. The next run's ID is in the
  hand-back.
- Quick verify 37270079397 on fd82be1: 377 passed, 5 failed, exactly the 5 real failures below.
- Complete run 37270113272 on fd82be1: 1,290 passed; failed only on the real failures below (Android 5, iPhone 5) and 2
  Android screenshots: `impostor-clues-larger` at 360 × 640 and 390 × 844 changed because round 5 added "See my word again"
  to the clues screen (C1). They need new references from the Screenshots workflow and the product owner's approval.
- Rule tests (local, 2118820): 695 of 695 (668 earlier tests, 27 round 5 tests). Of the 32 C3 rule tests, all 32 now pass;
  the 32nd is endEvening after leaveAfterRound, which failed on 728f6cc and was fixed in 2118820.
- Local browser runs on both phones (Mac, low priority, alongside a 10-hour mutation run): every touched Impostor file.
  The single-phone timeouts seen there (IMP-023/024 timers, IMP-081 12 players, IMP-090, IMP-087) were load; they
  pass when run alone and on GitHub.

## Failing (real bugs only)
- **IMP-081 (lane N): the undo toast lies over "Players (5) ›".** `impostor-play-screens.spec.ts`, "IMP-081: the room screens at
  320 × 568 and 360 × 640 … result with its toast", at 320 × 568, 320 × 568 with Larger text, and 360 × 640 with Larger text, both
  phones. Expected: nothing drawn over a button (the toast is a bar above the main button's row). Got: after "This word
  didn't work", the toast "Samosa won't come up again · Undo" covers the quiet "Players (5) ›" (and its "Undo" overlaps it).
- **IMP-020 / IMP-022 (lane O): "Not enough clues?" still shows at 812 × 375.** `impostor-round5.spec.ts`, "812 × 375: 'Go round
  again' and 'See my word again' share one row …", both phones. Expected (v3.8): at 812 × 375 the two buttons share one row
  and "Not enough clues?" is not shown. Got: "Not enough clues?" is on screen.
- **IMP-001 (lane O): the "Start a new game?" buttons aren't equal.** `impostor-setup.spec.ts`, "IMP-001 (v3.8, M22) …", both phones.
  Expected: two equal outlined buttons side by side. Got: "Carry on that game" wraps onto 2 lines (53.3 px tall), "Start new"
  is 48 px, so their tops differ by 2.6 px (Android: x 36 / 211, width 165 each at 390 wide).

Fixed during the round: endEvening refused after leaveAfterRound (IMP-078, IMP-093), found by the C3 rule test on
728f6cc, fixed in 2118820.

## Question for the product owner (test marked expected-to-fail until answered)
- **IMP-071 vs IMP-077:** both put something "at the top left" of the round result: the practice chip (IMP-071) and "← Home"
  (IMP-077). The build shows the chip right of "← Home", ending 15 px into the right half at 390 px wide. The test "after the
  practice result, 'Next round' deals round 1 …" (`impostor-setup.spec.ts`) checks "wholly in the left half" and is marked
  expected-to-fail with this reason. Which wins?
- **IMP-022 vs IMP-020/IMP-079:** IMP-022 says "Go round again" is directly above the main button. v3.8 stacks "See my
  word again" with it, and IMP-079 puts the joining line directly above the main button's area. The test now allows those two
  between "Go round again" and the main button.
- **IMP-074 vs IMP-075 (left halfway):** settled by decision I27 (copied into specs); the test adds a name and expects
  `setPlayers`.

## Notes for the Build workspace (not failures)
- The Players sheet behind "Kabir has to leave?" (and "3 players needed.") is not `inert`/`aria-hidden`: a screen reader or
  keyboard can reach its "Done" behind the dialog. It is dimmed on screen; the runner counts only the front dialog's
  main button.
- The 500 ms tap guard (IMP-010, IMP-077, and the clues screen by the orchestrator's call) works as specified. Every test
  that taps a guarded button right after a screen change now waits 500 ms of app time (`settle` in
  `tests/browser/impostor.ts`, used by `turn`, `dealAll`, `toPicker`, `reveal`), and the simulation runner waits 500 ms
  before every tap.

## Round 5 tests, by scenario (commits b814e20, 7f72770, 197d8a7, 611f462, f998d78 and the next push)
- Specs: `specs/impostor/` = scenarios v3.8 word for word (56 changed scenarios, new IMP-077, 078, 079), plus the I27 note.
- New rule tests, `tests/games/impostor/players-mid-round.test.ts` (32): IMP-079 mid-round adds (4 moments, next deal and
  redeals deal joiners in), IMP-078 leaveAfterRound (4 moments, redeals, endEvening drop, refusals), dealAgainWithout (4
  moments, property: never reveals roles, 300 rounds), fewer than 3 refused, Test hooks item 3 (unfit seeds ignored),
  Test hooks item 1 property (every deal deals the current list, 200 games).
- New browser tests, `tests/browser/impostor-round5.spec.ts`: IMP-003 fast Enter; IMP-010 screen B order at 320/360/390 and
  812 × 375, "Not Riya? ← Back", the double-tap guard (and the pad not guarded); IMP-017 "See my word again" on clues and talk,
  "Done, back to clues / talking / the vote"; IMP-020 clues at 812 × 375 and 320 × 568; IMP-075 "Home (game is saved)";
  IMP-077 bottom row sizes (360, 390, 812, 320), "← Home", never mid-round, between-rounds guard; IMP-001 resume rows with
  names; IMP-074 "Players (N) ›"; IMP-103 History "Play again" asks once; IMP-085 plain words on every screen; IMP-078
  leave dialog (same whatever the role), Back, "Finish this round first" with toast, "Deal again without Kabir", two
  leavers' toast (I27); IMP-079 joining line; Test hooks item 3 in the browser.
- Updated (wording or behaviour changed in v3.8): journeys 1, 2, 3, 5, 6, 8, 10, 11, 12; IMP-005 Score Yes line; IMP-006
  ("← Back" keeps changes, setChoices only when changed, plus a new test); IMP-016 Timer label; IMP-017 "Done, back to
  clues"; IMP-022 placement allowance; IMP-032 tie heading and "Not a tie" (plus a new test); IMP-033/034/035/039/040/095/098
  outcomes, notes, evening line, lead line, fun line, Share; IMP-052 no-words screen; IMP-070 "How to play" line 4 and guess
  paragraph; IMP-075 menus at each moment; IMP-080 dialogs; IMP-092/093/097/101 summary ("That's the game!", "Play again",
  "Home", "More ›" with "Oops, keep playing"), plus a new "Play again" test; IMP-096 resume row; IMP-099 "Oops" in "More ›".
- Replaced (the approved scenario changed in v3.7): "with 3 players ✕ removes nobody: Keep at least 3 players." became the
  "3 players needed." dialog test (and a new "End game" in that dialog test); "mid-round: Change players after this round.
  with OK" became the mid-round adding-only sheet with the joining line. Nothing was deleted without a replacement.
- Runner (`tests/sims/impostor-runner.ts`): knows v3.5 and v3.8 screens and buttons, waits 500 ms before every tap, a replay
  whose saved tap no longer exists carries on scripted, and only the front dialog's main button counts. Both permanent
  replays (128, 011) pass on both phones; 011 is no longer marked expected-to-fail.

## Mutation testing (Impostor rules, v1.2.0 → ce6513c; run before round 5's rule changes)
Local, 3 workers at low priority, 9 h 40 min, scratch Stryker config pointing at the Impostor rule, property and contract
tests (the committed mutation config is another session's uncommitted work and leaves Impostor out). 1,035 mutants:
**70.2 % caught** (650 killed, 77 timed out; 237 survived, 71 not reached); 75.4 % of the mutants the tests reach. Target 80 %.
- picks.ts 95.2 %; saved.ts 96.5 %; rules.ts 65.6 %.
- Survivors that matter: `view` (lines 374, 379: which fields a viewer sees, IMP-062), `complete` (line 210, how a round ends),
  `totalsFor` (226–234, totals of players who left), the `setChoices` redeal from the no-words screen (lines 168–169, never
  reached), `wordDidntWork` guard (328). Most of the rest are refusal reason texts, invariant messages, the
  input checks `choicesProblem` / `playersProblem` (never reached), and the legal-move list `candidates` (object shapes).
- Request: an Impostor group in the weekly mutation job (`.github/workflows/weekly.yml`), with a Vitest config that
  includes `tests/games/impostor/` and `tests/contract/impostor.test.ts`; then rerun on the round 5 rules.

## Release preparation (1.3.0, 4 October; still valid)
- I24 tests (IMP-022, IMP-073/033, IMP-083) pushed and green then (quick verify 37192305287, complete run 37195629182).
- Evening 128 (weekly run 37189752105): a runner fault, fixed; kept as a permanent replay (passes).
- Screenshots: the 4 Tambola Android references are byte-identical to those approved at the 1.2.0 gate (Screenshots
  run 37119724773); Impostor clues with Larger text at 360 and 390 (Linux and Mac), 812 Mac only (Linux wraps "Arjun"
  into the clue order's scroll box: `reports/screens/imp-020-after-fix-9e57bab-812x375-linux.png`, product owner to decide).

## Flaky or setup problems (not for the Build workspace)
- The pull of 4 October could not re-apply another session's uncommitted `docs/test-questions.md` over lane notes added
  upstream. The file was restored byte for byte and is untouched since, but it is now behind main by four upstream
  changes (lane N and O notes, the C3 note), which that session has to merge. The autostash entry `stash@{0}` holds a copy.
- Local runs alongside the mutation run timed out on single tests; GitHub is the verdict.

## Notes for the owner (plain English)
- Round 5 is built and mostly works: people can join or leave mid-round, the game is called a "game" everywhere, and you can
  stop, go Home or play again from between rounds.
- Three small screen problems remain: a message bar covers the "Players" link on small phones, "Not enough clues?" still
  shows with the phone sideways, and the two buttons in "Start a new game?" are not the same size.
- The robot tester now waits half a second before each tap, as people do, because the app ignores very quick double taps.
