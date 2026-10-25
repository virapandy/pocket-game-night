# Test report
Commit tested: ccadfa9 (lane-n = coder e214282 + night.test.ts fix)   Date: 2026-10-25
Result: GREEN
Run: https://github.com/virapandy/pocket-game-night/actions/runs/40179636277 (Quick verify on lane-n, green to the end)

## Layers
- Rule tests (tests/games/mafia): 9 files, 181 passed, 0 failed.
- Build: ok. Android local (mafia-c3, mafia-deal-night, mafia-room, 3 workers): 40 passed, 0 failed.

## What changed (tests only, no check kept out)
- "Version 1.2 A ... every turn of the worked example (three nights)": day 3 now votes Arjun out (as GAME_1); Om day 1, Zoya day 2. All checks kept. test-questions row answered.

## Failing (real bugs only)
- None.

---
## Previous report
Commit tested: 303ee77 (lane-u = main 6648586 + WebKit-safe What Am I? tests)   Date: 2026-10-25
Result: RED (one failure already on main, not in this lane's scope); all 17 What Am I? iPhone failures fixed
Run: https://github.com/virapandy/pocket-game-night/actions/runs/40147321743 (complete run, workflow_dispatch on lane-u)

## Layers
- check: green. Android 1/2, 2/2: green. iPhone 2/2: green. iPhone 1/2: 665 passed, 1 failed, 30 skipped.
- Local (what-am-i-c3, -turn, -usability; both phones, 3 workers): 132 passed, 0 failed.

## What changed (tests only, no check loosened)
- WAI-013, WAI-021, WAI-024: orientation events fall back to a plain `deviceorientation` Event with the same fields where
  WebKit refuses `new DeviceOrientationEvent` (tests/browser/what-am-i.ts `scheduleOrientation`).
- WAI-080: scrolling uses `scrollBy` (page and scrollable boxes set directly; Chromium also gets the wheel), since mobile
  WebKit has no `mouse.wheel`. Same assertions.

## Failing (real bugs only)
- None confirmed.

## Needs the owner or product owner
- MAF-061 item 28, tests/browser/mafia-results.spec.ts:69, iPhone only: still fails as on main (9cede1f); unchanged by this lane.

---
## Previous report (main 9cede1f, run 40142743156)
Commit tested: 9cede1f (main)   Date: 2026-10-25
Result: RED (complete run, both phones)
Run: https://github.com/virapandy/pocket-game-night/actions/runs/40142743156 (workflow_dispatch; failed jobs rerun once)

## Layers
- check: green. Android 1/2 and 2/2: green. iPhone 1/2: 665 passed, 1 failed. iPhone 2/2: 660 passed, 18 failed (first attempt 19; one passed on rerun).

## Failing (real bugs only)
- None confirmed.

## Needs the owner or product owner
- MAF-061 item 28, tests/browser/mafia-results.spec.ts:69, iPhone only: "Change players or roles" did not show the "Who's playing?" heading. Failed on both attempts, passes on Android. Probably the known Mafia setup leftover until the Mafia card ships, but it is not in the named list (setup tests and MAF-055); the coder should confirm.

## Flaky or setup problems (not for the Build workspace)
- iPhone only, failed both attempts, caused by iPhone browser limits in the test, not the app (Android passes the same tests):
  - WAI-021 (what-am-i-c3.spec.ts lines 173, 188, 202, 215): page.clock.runFor throws "TypeError: Illegal constructor" in WebKit.
  - WAI-013 (what-am-i-turn.spec.ts:220): same error.
  - WAI-024 (what-am-i-turn.spec.ts:417, 438): same error family.
  - WAI-080 (what-am-i-usability.spec.ts:29 x10 sizes, :65): page.mouse.wheel is not supported in mobile WebKit.
  Total 17 on iPhone. Needs a test rewrite (tester job, with owner approval where a check changes) or an iPhone exclusion decision. Not skipped by me.
- SWD-002 (v3.6) D11, secret-words-a-home.spec.ts:480, iPhone: failed first attempt (board-phone-dialog not found), passed on rerun. Flaky.
- Quarantined: TAM-191/TAM-122 phone-tickets passed.

---
## Earlier report still on main (lane-j, different commit, kept for reference)
# Test report
Commit tested: 58a23e6 (lane-j = main); tests pushed at fc418f9   Date: 2026-10-25
Result: GREEN. Quick verify run 40145320428 (lane-j, fc418f9): verify success. Rule tests 1165/1165; browser smoke 17 passed;
What Am I? area 171 passed, 0 failed; 1 quarantined test passed.

## This round: possible scoring bug from a player walk (WAI-020, WAI-021, WAI-030; also WAI-040, WAI-043, WAI-010)
- Report: round 2, Dev's turn, after a pause and a Home trip, Carry on from the Paused cover; SKATING showed; two quick taps
  on the bottom half flashed "Got it!"; Pause, "End Dev's turn now"; T4 had only "Rohit Sharma" and "Dev got 1".
- **Not reproduced.** New `tests/browser/what-am-i-marks-in-flight.spec.ts` (14 tests, in the What Am I? area) checks, in
  round 2 for Dev with a fixed seed: (a) a Got it tap plus a second tap 0, 100, 150 or 300 ms later inside the 600 ms flash,
  by mouse and by touch, Pause during the flash (really during: the Pause button takes taps over the flash) and after it,
  then End Dev's turn now; (b) the same after a pause and a trip away (Home row, the app hidden, a reload) and Carry on from
  the Paused cover, a sweep of double taps across the 800 ms guard after resume, and one run in real time; (c) taps during
  the countdown just after resume (no flash, nothing recorded) and inside the guard, then the first tap after it. In every
  case the flashed word was on T4's Got it list, in "Turn ended early. Dev got n", recorded once as `got`, and in Dev's score
  on Round over. Android local, 3 workers, PGN_PORT=4191: 14/14 passed; also passed in run 40145320428.
- **Reload mid-turn (WAI-010 Version 1.1 items 5, 6; WAI-091):** with Duck on screen, a reload records
  `{ type: 'pause', turn: true, word: <Duck's id> }`; after Carry on, Bat and Camel show and then Duck comes back. Passes.
- These stay as regression tests.

## Real bugs
- None.

## Flaky or setup
- Local `npm test` under taskpolicy -b: SWD-025 10,000-game privacy property timed out at 120 s (load; passes in the run).

## Notes for the owner (plain English)
- We could not make a word that flashed "Got it!" go missing, by any of the ways the walk described. If a player sees it
  again, a screen recording or the "Report a problem" share would help pin it down.

---
Earlier report (83cc320, run 40140895888) follows.
Commit tested: 83cc320 (lane-k: main 18d247e with What Am I? + Mafia bundle app code, plus the Mafia test commits 1914f02, af5f50a, e55f749, 5ad327d cherry-picked from lane-k-backup)   Date: 2026-10-25
Result: GREEN. Quick verify run 40140895888 (lane-k, 83cc320): verify success. Rule tests 1165/1165; changed areas' browser tests 17 + 398 passed, 0 failed; 1 quarantined test passed.

## This round
- Cherry-picks: conflicts only in reports/tester-notes.md (kept both the What Am I? lane T and the Mafia lane-k notes) and
  reports/latest.md (this file). tests/browser/areas.json and docs/test-questions.md merged by themselves with both games'
  entries, no duplicate rows. Every Mafia test file is byte-for-byte the backup's; no check changed.
- Rule tests, local (`npm test` under taskpolicy -b): 1162 passed, 3 timed out at 120 s (MAF-P5 stories, MAF-043/P6
  winning, SWD-025 privacy). Rerun on their own at normal priority: 21/21 passed. Load only, not bugs.
- Browser, Android, local, 3 workers, PGN_PORT=4191 after `npm run build`: every mafia-*.spec.ts, what-am-i-lifecycle,
  home-and-buttons, history (the filter also took secret-words-players-history): 132 passed, 0 failed. The still-marked
  `needsMafiaCardOrHomeRow` tests (all of mafia-setup.spec.ts and mafia-room MAF-055) failed as expected; they need the
  picker's Mafia card / Home's row.

## Real bugs
- None.

## Flaky or setup
- The three 120 s property timeouts above, local only under low priority.

---
Earlier report (e55f749, run 40136323734) follows.


## This round
- New `tests/browser/mafia-results.spec.ts` "MAF-P2 / MAF-093: opening #mafia-past/<id>/2 while game 2 is still being played ...":
  fails on 45e1588 (a reload on that address showed game 2's "Who was who" with every role), passes on f63370e (Home).
  Android and iPhone local: passes.
- MAF-080 (landscape main button at 568 x 320) now passes (run 40134441146 green).

## Shared landscape button (blocks.css, about 268 px at 568 x 320): Impostor, Secret Words, What Am I? at 568 x 320 / 812 x 375, Android, local
- 150 landscape/no-scroll tests: 146 passed, 4 failed. No label wrapped or clipped in any of them.
- 1 real change of expectation (OWNER): `secret-words-a-setup.spec.ts` "568 x 320 ... in landscape put it 358 x 60 at the bottom right"
  (both Larger text off and on): main is now 268 wide, test and specs/secret-words/README.md ("Landscape main button ... 358 x 60")
  expect 358. Not changed by the tester. The spec/test must be updated to the owner's new width, or the button kept at 358.
  (667 x 375 is not a size these files use; 812 x 375 passed.)
- 2 failures under load only (SWD-031 private map at 360 x 640; SWD-040 clue keys at 320 x 568): both pass on rerun (20/20).
- What Am I? tests are expected-to-fail marked until built, so their pass is not evidence.
- Local iPhone only: "MAF-061 item 28" fails (stays on the first deal screen after tapping "Change players or roles");
  passes in automation. Check with the next full run.

## Mafia browser files, Android, local, 3 workers (c283b49 + 1914f02)
- With the marks: 72 passed (10 of them the expected-to-fail held-back tests), 1 failed (MAF-080 above).
- `PGN_IGNORE_AHEAD=1` (marks off): 62 passed, 11 failed: the 9 `mafia-setup.spec.ts` tests and MAF-055, which need the
  picker's Mafia card, Home's "Host a game" line or Home's row (held back until What Am I? releases; marked
  `needsMafiaCardOrHomeRow`), and MAF-080.

## What changed in the tests (1914f02)
- `aheadOfMafiaScreens` removed everywhere. Only the 9 setup tests and MAF-055 keep a mark, now `needsMafiaCardOrHomeRow`.
- Deal tests (MAF-P2, MAF-P7 sizes, both MAF-010s, MAF-011 to MAF-014) open the first deal pass screen through MAF-H6
  (`openDeal`, new flow `deal-start`) instead of through the picker; their checks are unchanged. All pass.
- Timing (docs/test-questions.md rows answered): MAF-P2 and MAF-P7 sizes `test.slow()`; the MAF-P7 guard test pauses the
  clock 1000 ms ahead (was 10 ms); MAF-050 no longer waits 10 s for a heading B1 and N1 don't have.
- New, all passing: MAF-093 History order among other games; MAF-093/PLT-008 past game screen and its Play again;
  MAF-093/MAF-061 Play again without a leaver (new flow `left-neha-ended`); PLT-011 Clear all with Mafia nights;
  MAF-063/SWD-060 Tonight's summary left by hiding the app, mid-game and at game over.

## Flaky or setup problems (not for the Build workspace)
- Local, busy Mac (3 workers, low priority): MAF-011 and MAF-P7 sizes once each hung 10 s on a forced click; both pass
  alone (twice each) and in automation. `npm test` locally: 3 long random properties timed out at 120 s (load); they pass
  in automation.

## Requests for the Build workspace
- None.

## Notes for the owner (plain English)
- Every Mafia screen is now checked for real, except the parts that need the Mafia card on "What shall we play?" and Home's
  row, which wait for What Am I?. One thing to fix: on a small phone held sideways, the main button on the night screen is
  too wide; it should sit in the bottom right.
