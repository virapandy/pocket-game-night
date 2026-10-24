# Test report
Commit tested: e55f749 (lane-k: app f63370e + landscape fix 45e1588 + tester e55f749)   Date: 2026-10-25
Result: GREEN. Quick verify run 40136323734 (lane-k, e55f749): verify success (rule tests and the changed areas' browser tests).

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
