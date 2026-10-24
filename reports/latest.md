# Test report
Commit tested: 1914f02 (lane-k: c283b49 app code + tester 1914f02)   Date: 2026-10-25
Result: RED (one real bug, MAF-080). Quick verify 40133386430: rule tests pass; browser 396 passed, 1 failed.

## Failing (real bugs only)
- `tests/browser/mafia-usability.spec.ts` "MAF-080: at 812 × 375 and 568 × 320 the main button sits bottom right" (MAF-080,
  Impostor's landscape rule): at 568 × 320 on N0 ("Night 1", opened from flow `night1-start`) the main button's left edge is
  at x = 194; expected in the right half (x ≥ 283). Its right and bottom edges are right; it is too wide, reaching into the
  left half. 812 × 375 passes. Same result locally on Android and in automation.

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
