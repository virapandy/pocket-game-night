# Test report
## Lane-e, Secret Words rules engine + owner answers of 22 October (SWD-090, 042, 099, 103)
Commit tested: c86f220 (app 0ff9800, Secret Words rules engine; tests c86f220)   Date: 2026-10-22
Result: RED (expected: SWD-103's new rule only). Quick verify 39811481754 on lane-e: every browser test (4 of 4 shards)
green, so SWD-099's content check now passes; verify job red on 3 rule tests, all SWD-103.
- Rule tests: 846 of 849 pass (locally and in quick verify). Every other Secret Words rule test now passes on 0ff9800.
- Browser, `secret-words-c3.spec.ts` locally on both phones: 38 of 38 as expected (18 marked expected-to-fail until the
  screens exist, now including SWD-090's shrink-alone check and SWD-042's two tap-to-zoom checks).
## Failing (real bugs only)
- SWD-103 v3.6, `tests/games/secret-words/play.test.ts` "the last allowed guess on a nobody's word → nobody with its cell":
  expected `lastTurn` `{ ended: 'nobody', cell }`, got `ended: 'allowance'` (no cell).
- SWD-103 v3.6, same file, "the last allowed guess on the other team's word → other with its cell": expected
  `ended: 'other'` with `cell`, got `'allowance'`.
- SWD-103 v3.6, same file, "with a clue for 2, a wrong word as the third (last allowed) guess": expected `ended: 'nobody'`
  with `cell`, found 2; got `'allowance'`. The rule: "they used all their guesses" only when the last allowed guess was the
  team's own word; a wrong word gives that word's line.
## Flaky or setup problems (not for the Build workspace)
- Lane-e is NOT merged with main: merging origin/main brings main's `src/proto/` and `vite.config.ts` into the Test lane
  folder, and the role guard blocks the Test role from changing those files (merge aborted). The orchestrator (or the
  lane-e coder) needs to merge origin/main into lane-e. Main's docs were read from `origin/main` for this round.
- Locally under `taskpolicy -b`, 6 heavy rule tests (simulations, chi-square, SWD-025's 10,000 games) timed out; all 65
  pass at normal priority. One local browser run had 3 timeouts under load; the re-run was 38 of 38.
## Notes for the owner (plain English)
- Your answer on wide words is now what the tests check: every word must fit its cell at 10 px; the 10 words that need
  less than 12 px (Boundary, Rickshaw, Puncture, Mosquito, Monsoon, Homework, Umbrella, Diamond, Germany, Himalaya)
  stay and are listed, not failed. SWD-099's text still says a too-wide word is replaced; SWD-090's 22 October paragraph
  says it never is. The tests follow the newer answer; the product owner may want SWD-099's line updated to match.
- New screen checks wait for the board screens: only a too-wide word's cell is smaller, never below 10 px; tapping a word
  shows it large (28 px) over its cell, and the large word looks the same whatever kind the word is.

## Earlier verdict (main, 11 October)
**Progress 22 Oct 2026 (lane-e, Secret Words C3 tests first): scenarios v3.6 copied to `specs/secret-words/` (94 scenarios + 2 retired + 7 direction); 140 rule tests (with the contract suite) written: 126 fail only with "src/games/secret-words is not built yet" or "content/secret-words/words.json is not there yet", 8 content checks already pass; every existing rule test still passes (706 of 706); 16 browser checks in `tests/browser/secret-words-c3.spec.ts`, 15 marked expected-to-fail until the screens exist; SWD-099's browser content test fails for real: 10 words are wider than their cell on both phones (Boundary, Rickshaw, Puncture, Mosquito, Monsoon, Homework, Umbrella, Diamond, Germany, Himalaya; for the product owner); rule API for the coder: `specs/secret-words/api.md`; the verdict below stands.**
**Progress 22 Oct 2026: design rule checks script done and run on the Secret Words screen map draft 2 (`reports/design-checks-secret-words.md`: 15 findings, 18 cannot check); next: re-run on draft 3; tests/code unchanged, so the verdict below stands; rows done: 1 of 1.**
**Faster cycles, test side (items 3, 7, 9, 11): GREEN. Quick verify 38115857931 on e0b62d4, every browser test on Android.**

Commit tested: e0b62d4 (app b7a01c8, shared screen building blocks; tests e0b62d4)   Date: 2026-10-11
Result: GREEN. Quick verify 38115857931: rule tests 706 of 706; smoke 17 passed; every browser test on Android (the
shared test set-up changed), 346 + 345 passed, 1 skipped (the usual one-phone-only test). iPhone: not in quick verify;
locally the eight Tambola files that wait out Home's guard passed on iPhone (86 of 86).
- Failing (real bugs): none. Nothing any test checks was changed.
- Item 3, clock: every test page now starts with Playwright's clock (runs with real time); the 500 ms tap guard is
  waited out by moving the app's time on, not by sleeping. Guard tests still pause the clock and tap within 500 ms.
  Measured locally (Android, 3 workers): eight Tambola files 444 s → 345 s; three Impostor files 281 s → 250 s (Impostor
  already used the clock, so that difference is mostly the Mac's run-to-run spread). One test adjusted for the clock,
  not its check: PLT-203's injected crash is thrown from a microtask instead of a timer (the clock's timers keep a thrown
  error from reaching the page as uncaught). No animation is known to cause flakiness, so none was turned off.
- Item 7, area map: one game's files run only that game's browser files plus smoke (Impostor now lists all 12 of its
  files; 4 were missing). Shared app shell files and the new `src/blocks/**` run smoke + both games' key journeys + Home
  + layout rules (6 to 7 files instead of 11 or all). Checked: b7a01c8's blocks change maps to 17 files, not all 42.
- Item 9, mutation: Stryker's incremental mode works with our Vitest set-up (re-run 161 s → 77 s, "3 of 3 reused").
  Command for a C3 change in `tests/mutation/README.md`. Scoped runs on Impostor's rules now use Impostor's tests.
- Item 11, quarantine: documented in `tests/browser/README.md`; list below.

## Quarantined (known-flaky; still run every time, never re-run away)
| Test | Scenario | Owner | Reason | Since | Ends when |
|---|---|---|---|---|---|
| `tests/android/emulator.spec.ts` PLT-120 full paper game at 390 × 844 | PLT-120 | tester | passed only on its PLT-122 retry, weekly run 37593615495 (emulator timing) | 2026-10-11 | three weekly runs green first time |
| `tests/android/emulator.spec.ts` TAM-116 taps within 100 ms on a slowed processor | TAM-116 | tester | passed only on its PLT-122 retry, weekly run 37593615495 | 2026-10-11 | three weekly runs green first time |
| TAM-111 (emulator back gesture) | TAM-111 | tester | watch only: no failure on record in this clone's reports; not marked | 2026-10-11 | next weekly run |

## Flaky or setup problems (not for the Build workspace)
- Quick verify's two Android shards are unbalanced (6.6 min and 12.2 min); splitting by file would even them (item 7).

## Requests for the Build workspace
- quick.yml: run `--grep-invert @quarantine` in the blocking browser steps and `--grep @quarantine` in a
  non-blocking step, so a known-flaky test never freezes the preview (only weekly emulator tests are tagged today).
- `.github/mutation/stryker.impostor.config.mjs`: point `vitest.configFile` at `tests/vitest.mutation.impostor.config.ts`
  and remove `.github/mutation/vitest.impostor.config.mjs` (same settings).
- Optional: cache `reports/stryker/scoped/incremental.json` (or the weekly run's own incremental file) between runs if
  CI mutation should be incremental.

## Notes for the owner (plain English)
Tests no longer sit and wait half a second at every "tap guard"; they fast-forward the app's clock instead. A push that
changes one game now runs that game's browser tests only (plus the quick core check), and a change to shared screens
runs the core journeys of both games. Known-flaky tests are now listed with an owner instead of being quietly re-run.

---

**Impostor 1.3.1 (round 6b, I29 R1–R4, and P11 "Join a game"): GREEN on both phones. Complete run 37726525429 on b0ed99d.**

Commit tested: app 131c234 (1.3.1, lane V); tests b0ed99d   Date: 2026-10-08
Result: GREEN. Complete run 37726525429 (b0ed99d), every job green on Android and iPhone. Quick verify 37590811765 (57e0c2d)
and 37593591313 (0037c8b) green. Earlier complete runs 37592526265 and 37721886881 failed only on the three Home screenshots
(new "Join a game" card) and the TAM-118 test's tap within the guard; both fixed in b0ed99d.
- Rule tests: 706 of 706 (local).
- New `tests/browser/impostor-round6b.spec.ts` (29 tests a phone): R1 menus reach "End game" at 812 × 375 and 320 × 568, Larger
  text on/off; R2 tap guard on Home, "What shall we play?", talk, picker, summary, How to play, never the hold pad; R3 no text
  selection by tapping, text fields still work; R4 option labels keep their spaces; R5 and R10 checks. Before lane V: R1 at
  812 × 375, R2 (6 of 8), R3 and R4 (Android) failed as expected; on 131c234 all pass on both phones, unmarked.
- Failing (real app bugs): none.
- Test changes for the new guard (I29 replaces IMP-077's reopen exception): every helper and test now waits 500 ms before a tap
  on Home, "What shall we play?", and any Impostor screen, dialog or sheet that has just appeared, the reopened result included
  (`settle` in impostor.ts, `waitOutTapGuard` in helpers.ts). Nothing they check was loosened. Two tests were adjusted in
  timing only: "a running timer keeps running while How to play is open" (still 1:55 after 5 s, How to play open 4.5 s of them)
  and IMP-099's exact 3-hour limit (the tap still lands at exactly 3 h and 3 h + 1 ms, with the clock paused there instead of
  fixed, because a fixed clock never lets the 500 ms guard end). The announcer countdown test now runs on fake time only.
- P11: Home tests expect "Join a game" / "Tambola ticket from the host" and the Join screen heading "Join a game"; specs and
  README updated. R1's check allows 1 px of rounding at the screen edge (GitHub's Android drew "End game" 0.3 px past it).
- R5 (IMP-004, tonight's names after going Home): PASS on 1.3.0 (a28f679) and 1.3.1, both phones: after "End game" then
  "Home"; after "← Home" then "Start new"; after ending and opening the app again. Each lists Riya, Arjun, Meena, Kabir in order.
  Note: an evening whose first round was never counted is not kept (IMP-097), so "Start new" over it starts empty, as specified.
- R10 (IMP-003, fast and slow Enter): PASS on 1.3.0 and 1.3.1, both phones: one key every 400 ms then Enter after 2 s; four names
  each followed at once by Enter; a name and Enter within the first second of the screen. Every name added, in order.
- TAM-112 (Android closing Chrome): the 3 October failure (69 expected, 42 shown, run 37143638539) came from the old check
  (1 s in the background). The 4 October check never reached its assertion on GitHub (run 37254838465): Playwright's
  `newPage()` fails on a relaunched Chrome for Android, a tool fault. Fixed in ec4b633 (uses Chrome's own tab, emptied first);
  the confirming emulator run is weekly run 37592531112 (result to follow).

- Screenshots for the product owner's approval (C1, P11): the three "player: Home with tickets more than 6 hours old" references
  (360 × 640, 390 × 844, 812 × 375; Linux from Screenshots run 37726011326, Mac made locally) now show "Join a game" /
  "Tambola ticket from the host". No other reference changed.
- TAM-118 (iPhone tip): the test tapped "Got it" within Home's new 500 ms guard; it now waits first. Not an app bug.
- TAM-112: CONFIRMED FIXED / not reproduced. With the emulator check repaired, weekly run 37593615495 (0037c8b) passed TAM-112:
  Android closed Chrome after 10 s in the background and the game reopened at the same number. The 3 October failure was the
  old check's 1 s in the background, not lost data. No coder work needed. (TAM-111 back gestures and TAM-116 passed; PLT-120 at
  390 × 844 and TAM-116 passed on their retry: emulator flakiness.)

## Flaky or setup problems (not for the Build workspace)
- Locally (3 workers on the owner's Mac) a few long tests hit the 30 s test limit; each passes alone. Not seen on GitHub.
- Mutation: no local Stryker run was running; the only local result is the scoped run of 3 October (rules.ts 5 of 5, 100%).


---

**Round 6 (6 October), progress: round 6 is GREEN on both phones (quick verify 37441309625 and complete run 37441347272 on 6edd1e8).**

Commit tested: 6edd1e8 (app b1e589b = round 6 43f1c97 + IMP-088 fix; tests 6edd1e8)   Date: 2026-10-06
Result: GREEN
- Quick verify 37441309625 on 6edd1e8: green (rule tests 692 of 692; smoke 17 passed; changed areas 428 passed, Android).
- Complete run 37441347272 on 6edd1e8, both phones: green, every job (Android 345 + 344, iPhone 342 + 314 passed).
- Failing (real bugs): none. No expected-to-fail marks left from this round.
- Quick verify 37432370177 (9895f8b) failed 6 Android tests. Four were test faults: the tests tapped a setup button within
  500 ms of the choices screen or a sheet showing again, which IMP-010 v3.9 ignores. Each now waits 500 ms first (nothing
  checked was changed): IMP-052 "Change categories" (after the choices screen shows, and after the Categories sheet opens),
  IMP-007 reopening the Categories sheet after "Done", IMP-070/072/076 More options after Back, IMP-007/IMP-070 Categories
  after Back. The other two (IMP-088 "Whole family" with Larger text at 320 and 360: text 98 > 96 px and 109 > 108 px) were a
  real app failure; b1e589b fixes it and both pass on both phones, unmarked.
- Local on b1e589b: rule tests 706 of 706; impostor-setup + impostor-play-screens on both phones 248 passed (on 43f1c97, with
  the IMP-088 marks) and IMP-088 22 of 22 on b1e589b (no marks).

**Round 6, P1 for the orchestrator (6 October): the P1 test is pushed, commit f5f8ead** (`tests/browser/impostor-round6-p1.spec.ts`,
both phones). It is expected to fail on main and **passes unmarked on lane-t 63c42aa** (all 10 tests, run with
`PGN_IGNORE_AHEAD=1` against a lane-t build). Lane T can merge. The shared helpers now wait out the setup tap guard (P2),
which lane T adds. The remaining P2–P11 tests follow; their report replaces this note.

Commit tested: app fbfedea (main: round 5 with lanes R and S); tests 858848e   Date: 2026-10-05
Result: GREEN

Runs:
- Quick verify 37276708670 on 858848e: green (smoke 17 passed; changed areas 286 passed). Earlier green: 37274027922 (0157c97),
  37276076807 (7bfcddc).
- Complete run 37276733013 on 858848e, both phones: green, every job (Android and iPhone: 304 + 332 + 334 + 335 passed).
  The earlier complete run 37274031425 (0157c97) failed one iPhone test only: a fault in my IMP-085 plain-words test (a random
  deal could make Riya the impostor, so the reveal stopped at the guess step); fixed with a forced deal in 858848e.
- Screenshots run 37274027980 (0157c97): the Linux 812 × 375 Larger-text clues picture now shows the whole clue order and the
  button row clear of the main button (about 8 px above it); added as the Linux reference. All Impostor clues references
  (360, 390, 812; Linux and Mac) are **not yet approved**: for the product owner's release review.
- Rule tests: 705 of 705.

## Failing (real bugs only)
None. Lane S fixed the last two: IMP-020/022 at 812 × 375 (equal heights, tops aligned, row clear of the main button; new
Larger-text test proves it) and IMP-071 with IMP-077 (practice chip on its own line directly under "← Home", both in the left
half; the test now checks "under" at 390, 360 and 320).

## Question for the product owner (test marked expected-to-fail until answered)
- **IMP-071 vs IMP-077:** answered by the orchestrator ("← Home" first, chip to its right, left half); see the failure above for
  the sizes where it does not fit. Should the chip fit at 320/360 and with Larger text too?
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

## Mutation testing
**After (round 5 rules, 2118820, with the new tests):** running locally (1,196 mutants; 176 done, 3 survived and 3 timed out
so far, at 5 October 15:20; several more hours at low priority). Scores per file follow when it ends.

### Before (Impostor rules, v1.2.0 → ce6513c; run before round 5's rule changes)
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
