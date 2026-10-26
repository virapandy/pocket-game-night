# Test report
Commit tested: 05f6e82 (app), lane-t2   Date: 2026-10-26
Result: RED (tests first: What Am I? scenarios Version 1.4 and PLT-303, written before the build; expected to fail until the lane builds them)

Automation: quick verify on lane-t2 (named in the orchestrator's hand-back).

## Layers
- Rule tests (`npm test`): 1190 of 1191 pass; the one failure is a timeout under load (below), passes alone (3 of 3).
- Browser, Android (new and changed files: `what-am-i-v14`, `game-names-one-line`, `what-am-i-setup`, `-turn`, `-scores`):
  the new and changed tests fail as expected (list below); every other test in those files passes (65).
- Browser, iPhone: not run locally (setup problem below); the automation's run is the iPhone verdict.

## Failing (expected: written before the build)
- `what-am-i-v14.spec.ts` (WAI-020, Version 1.4 item 2), 15 tests: T3 shows no "Pass" / "Got it" labels (element not found);
  the standing-hold variants stop earlier at S2's "Stand the phone up" option (not there yet).
- `what-am-i-v14.spec.ts` (WAI-003, 005, 006, 012, 014, Version 1.4 item 3): S2 has no "Stand the phone up" option.
- `game-names-one-line.spec.ts` (PLT-303), 5 of 8: "Secret Words" breaks on Home's "Host a game" line at 320 × 568 and
  360 × 640 and on "Join a game"'s line at 320 × 568, 568 × 320 and 812 × 375; "What Am I?" breaks on the "Host a game" line at
  568 × 320 and 812 × 375 and in "Tonight's What Am I?" at 320 × 568. History passes at 360 × 640, 568 × 320, 812 × 375.
- Changed to the Version 1.4 text, failing until built: `what-am-i-setup` (S2 radio, Read this aloud, How to play line 4, the
  standing-hold card and last-used choices), `what-am-i-turn` (T1's "Stand the phone up for Riya", the hold line, every
  standing-hold test), `what-am-i-scores` (T4's "A word in the wrong list? Tap it to move it.", the totals lines, the
  "Stand the phone up for Arjun" toast test); one standing-hold test in `what-am-i-c3` stops at S2 too.

## Flaky or setup problems (not for the Build workspace)
- iPhone (WebKit) locally: every page load times out (`page.goto`), app-shell's tests too: this Mac's local WebKit, not the app.
- `secret-words/privacy.test.ts` SWD-025 10,000-game property timed out once while the browser run was busy; passes alone.

## Notes for the owner (plain English)
- The word screen will show "Pass" at the top and "Got it" at the bottom; "Hands-free" becomes "Stand the phone up"; T4's lines
  become plainer. Game names will never split over two lines (today "What Am I?" and "Secret Words" do on small and sideways
  screens). Two wording readings are asked of the product owner in `docs/test-questions.md` (26 October).


---

Commit tested: 05f6e82 (main, the 1.6.1 app; lane-m2 = main + these tests)   Date: 2026-10-26
Result: RED (expected: tests first for Mafia Version 1.4, the 1.6.2 point release)
Run: https://github.com/virapandy/pocket-game-night/actions/runs/40352034960 (Quick verify on lane-m2 at 17fb2c8: failure as expected; Android 107 passed, 24 failed, exactly the Version 1.4 checks listed below; the mafia-c3 flake did not recur)
Local: npm test 65 files, 1191 of 1193 passed (2 known load timeouts, both pass alone); build ok; browser mafia-v14,
mafia-deal-night, mafia-day, mafia-why, mafia-walk, mafia-c3 on Android and iPhone, 3 workers: 127 passed, 49 failed
(48 are the new or updated Version 1.4 checks, 24 per phone; 1 load flake, below).

## What changed (tests and specs only)
- specs/mafia/: a "Version 1.4" paragraph on MAF-006, MAF-011, MAF-012, MAF-023 (also 0.95), MAF-026, MAF-032, MAF-055 (by design,
  no change), MAF-060, MAF-064, MAF-091; README: a Version 1.4 section and the canonical strings; api.md: `mostMafia` counts ended
  games only. The orchestrator's calls of 26 October marked confirmed; the Test role's five open Mafia rows of 25 October in
  docs/test-questions.md marked confirmed (product owner, 26 October).
- New tests/browser/mafia-v14.spec.ts (Mafia area). Updated to the new words (nothing loosened): mafia-deal-night (MAF-011,
  MAF-022 to MAF-026, ghost guess; MAF-028 now requires N3 on resume), mafia-day (MAF-032), mafia-why (Villager lines; the P7 frame
  walk now also checks the Villager's new line), mafia-walk (the leak check also looks for "who is out").
- tests/games/mafia/saved.test.ts: two MAF-064 Version 1.4 item 4 tests.

## Failing (real bugs only: Version 1.4 not built yet)
- MAF-011 / MAF-012 (item 6): Mafia card still "At night, you pick who goes out. …"; First time? not yet "At night, pick who is out."
- MAF-023 / MAF-026 (items 3, 6): N2 still "At the end we'll see if you were right.", "MAFIA · Pick who goes out tonight. …",
  "YOU'RE OUT · Ghost guess: who's Mafia? Pick one."; the frame and fit checks behind them run once the words change (checked with
  the old words: every frame equal and every line fits, both phones).
- MAF-032 (item 6): countdown still "Everyone in, point at who you think is Mafia."
- MAF-006 (item 7): How to play has no "Need to stop during someone's turn? …" line.
- MAF-060 (item 5): on G1 "Change players or roles" and "← Home" are pinned (move 0 px while the page moves 184 to 908 px);
  "Play again" and "End for tonight" are already pinned as asked.

Already hold on 1.6.1 (the tests pin them): MAF-091 item 2 (resume after the last pick opens N3) and MAF-064 item 4.

## Flaky or setup problems (not for the Build workspace)
- mafia-c3 "MAF-023 to MAF-026 Version 1.2 A and 1.3 …" failed once on Android with 3 workers under taskpolicy -b (Done appeared
  during the tap); passes alone. Two rule properties timed out at 120 s in the full npm test; pass alone.

---

Commit tested: b529c7c (lane-r2 rebased on main 2a5e5f4, the 1.6.0 release)   Date: 2026-10-26
Result: GREEN
Run: https://github.com/virapandy/pocket-game-night/actions/runs/40292906979 (Quick verify on lane-r2 at 5603138: success)
Local: npm test 65 files, 1191 passed; build ok; browser mafia-*, home-and-buttons, secret-words-a-home (Home and picker), Android and iPhone, 3 workers: 390 passed.