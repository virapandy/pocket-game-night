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
