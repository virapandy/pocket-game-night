# What the Mafia rule tests expect (C3, written before the build, 25 October 2026)

For the Build workspace. The contract is `specs/mafia/` (scenarios version 1.1, approved 25 October, MF18); the exact rule
API these tests import is **`specs/mafia/api.md`** (with the product owner's clarifications of 25 October folded in). If
something there is wrong or impossible, write it in `docs/test-questions.md`; don't work around it. Until
`src/games/mafia/index.ts` exists, every test that needs it fails with "src/games/mafia is not built yet (needs …)".

| File | Scenarios |
|---|---|
| `deal.test.ts` | MAF-003 (counts), MAF-004 (`start`), MAF-010 and MAF-P1 (deal, streaks, item 16, 26), MAF-H3, MAF-011/015 (own view), MAF-014 (redeal), MAF-052 item 12 (deal leave and its Undo) |
| `night.test.ts` | MAF-020 to MAF-027 (night order, every role's job and tags, item 4, 8, 9, 10, 11), MAF-P3 (500 random game nights) |
| `votes.test.ts` | MAF-033 to MAF-036 (votes, ties, item 14), MAF-051, MAF-052 (day leaves, Undo), MAF-054, MAF-061 (Play again) |
| `winning.test.ts` | MAF-040 (both worked examples), MAF-041, MAF-042, MAF-043 / MAF-P6 (1,000 random game nights), MAF-P4 |
| `privacy.test.ts` | MAF-016 / MAF-P2: the room view never differs with the roles or picks; each player's own view |
| `stories.test.ts` | MAF-037, MAF-P5, MAF-H5; `content/mafia/stories.json` against `docs/games/mafia/stories.csv` |
| `saved.test.ts` | MAF-093, IMP-096/097, the fixture `tests/fixtures/mafia-saved-nights-v1.json` (never edit), every flow of `flows.ts` (MAF-H6), MAF-062/064 facts, `readTestSeeds` |
| `../../contract/mafia.test.ts` | the shared contract suite (PLT-100 onwards) |

`oracle.ts` holds the scenarios' own algorithms (the deal with streaks, night order, the Mafia's random choice with
`rng()` = `int(2 ** 32) / 2 ** 32`, the story pick, the Mafia counts) written with the engine's `createRng` and `shuffle`.
`flows.ts` holds game nights as move lists (pure data, the MAF-040 worked example among them), opened by the browser tests
through `pgn.test.load`. `helpers.ts` loads the game and plays game nights through the engine's `play`, taking moves
from `legalMoves`; `randomNight` is the random host used by the properties.

Property tests run the scenarios' numbers: 500 game nights (P3), 1,000 (P6), 2,000 (P5), 300 to 400 for the others; with
a straightforward build they take a minute or two in all.

Browser checks: `tests/browser/mafia-c3.spec.ts` (MAF-P2 across two deals, MAF-P7 frame, the deal and story on screen,
resume), then the screens: `mafia-setup` (01), `mafia-deal-night` (02, 03), `mafia-day` (04), `mafia-room` (06),
`mafia-results` (07), `mafia-usability` (09). All are marked `aheadOfMafiaScreens` (expected to fail) until the screens
exist; `PGN_IGNORE_AHEAD=1` runs them as real checks on a lane branch. Test ids they look for: `deal-progress`,
`night-progress`, `pass-name`, `private-block`, `private-word`, `job-line`, `night-names`, `result-line`, `story`,
`role-line`, `count-line`, `where-line`, `countdown-heading`, `countdown-number`, `day-timer`, `main-button`,
`unfinished-games`.
