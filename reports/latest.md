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
- Build Phase 1a first: scenarios marked "Phase: Phase 1a" (Tambola with paper tickets on one host phone, one game at a time done well). Phase 1b follows.
- Every finished game with money must record, for each person, what they paid and won (PLT-021), so the Phase 1b tally needs no change to games.
- Phase 0: set up package.json with TypeScript, Vite + React, Vitest, fast-check and Playwright,
  with test scripts pointing at configs in tests/.

## Notes for the owner (plain English)
118 Tambola scenarios and 21 platform scenarios are drafted (Phase 1a: 89, Phase 1b: 15, Phase 2: 34), cross-checked against the guide, journeys and UX guidelines, and waiting for the owner's approval. No test code yet: it gets written once the owner approves and Phase 0 has set up the test runner and the game contract.
