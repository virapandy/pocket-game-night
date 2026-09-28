# Test report
Commit tested: none yet   Date: -
Result: NO TESTS YET

## Failing (real bugs only)
None.

## Flaky or setup problems (not for the Build workspace)
None.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- Update src/games/tambola/CLAUDE.md: the "House rules: waiting for the owner's decisions" section is
  out of date. All are decided; see docs/decisions.md and specs/tambola/04-house-rules.md.
- Phase 0 engine must support four points from the Tambola contract check
  (docs/games/tambola/guide.md): a time on each move record, a "room" viewer, moves with details,
  and player-only state (marks) outside the host's game state.
- Saved games need a format version from the first release (PLT-014), since Phase 1 reaches real families.
- Phase 1 scope is Tambola with paper tickets on one host phone: the scenarios marked "Phase: Phase 1".
- Phase 0: set up package.json with TypeScript, Vite + React, Vitest, fast-check and Playwright,
  with test scripts pointing at configs in tests/.

## Notes for the owner (plain English)
119 Tambola scenarios (84 for Phase 1, 34 for Phase 2) and 15 platform lifecycle scenarios are drafted, cross-checked against the guide, journeys and UX guidelines, and waiting for the owner's approval. No test code yet: it gets written once the owner approves and Phase 0 has set up the test runner and the game contract.
