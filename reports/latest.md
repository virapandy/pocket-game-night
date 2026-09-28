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
- Rhymes: the catalog is approved. Convert docs/games/tambola/rhymes.csv (409 rhymes) into a content pack in content/tambola/. Selection rules, including Indian references being twice as likely (TAM-158): specs/tambola/11-rhymes.md.
- Start with docs/handover.md.
- New for Phase 1a: PLT-024, one shared players step in every game's setup (names, suggestions from past names, blanks become Player 1, 2 …, no duplicate names). Build it once in the app shell, not inside Tambola.
- Seeds changed for Phase 2 (sheets of 6 made it necessary): a player's QR carries only that ticket's numbers, never a seed; the draw seed and a sheet seed stay on the host (TAM-008, TAM-053, TAM-054). Please update src/engine/CLAUDE.md ("one seed per ticket") and the Seeds section of src/games/tambola/CLAUDE.md.
- Build Phase 1a first: scenarios marked "Phase: Phase 1a" (Tambola with paper tickets on one host phone, one game at a time done well). Phase 1b follows.
- Every finished game with money must record, for each person, what they paid and won (PLT-021), so the Phase 1b tally needs no change to games.
- Phase 0: set up package.json with TypeScript, Vite + React, Vitest, fast-check and Playwright,
  with test scripts pointing at configs in tests/.

## Notes for the owner (plain English)
Phase 1a scenarios are approved. Test code starts as soon as the Build workspace pushes Phase 0 (project setup and the engine's contract), because the tests need its function names.
Scenarios exist for every phase (1a: 98 approved; 1b: 18; 2: 36; 2.5: 14; 6: 11; 7: 6), cross-checked against the guide, journeys and UX guidelines, and waiting for the owner's approval. No test code yet: it gets written once the owner approves and Phase 0 has set up the test runner and the game contract.
