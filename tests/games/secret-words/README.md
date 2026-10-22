# What the Secret Words rule tests expect (C3, written before the build, 22 October 2026)

For the Build workspace. The contract is `specs/secret-words/` (scenarios v3.6, approved 22 October); the exact rule
API these tests import is **`specs/secret-words/api.md`**. If something there is wrong or impossible, write it in
`docs/test-questions.md`; don't work around it.

| File | Scenarios |
|---|---|
| `words.test.ts` | SWD-099, SWD-023, SWD-013 (team-names.csv as content) |
| `map-code.test.ts` | SWD-020, SWD-021, SWD-022 (golden boards: `tests/fixtures/secret-words-golden-boards.json`), SWD-027, SWD-039 (`nextMapCode`), SWD-002 (`parseMapCode`) |
| `deck.test.ts` | SWD-024, SWD-026, SWD-039 (property), Test hooks item 2 |
| `privacy.test.ts` | SWD-025, SWD-123 (the partner's map) |
| `play.test.ts` | SWD-040 to SWD-046, SWD-101, SWD-103, SWD-118 |
| `results.test.ts` | SWD-050 to SWD-055 |
| `evening.test.ts` | SWD-060, SWD-062, SWD-063 (rules part), SWD-064, SWD-067; the saved-evening fixture `tests/fixtures/secret-words-saved-evenings-v1.json` |
| `people.test.ts` | SWD-123, SWD-125 (rules part), SWD-127 |
| `../../contract/secret-words.test.ts` | the shared contract suite (PLT-100 onwards) |

`oracle.ts` holds the scenarios' own algorithms (SWD-022's board from a code, SWD-024's deck) written out with the
engine's `createRng` and `shuffle`; the tests compare the build with them. `helpers.ts` loads the game and plays
evenings through the engine's `play`, taking `deal`, `dealNew`, `reveal` (with `freeCell`) and `brokeRule` from
`legalMoves`.

Property tests run the scenarios' numbers (10,000 games for SWD-025 and SWD-050, 10,000 codes for SWD-020 to 022,
1,000 evenings for SWD-024 and SWD-039); SWD-025's 10,000 games take about 45 s with a straightforward build.

Browser checks for the same C3 scenarios: `tests/browser/secret-words-c3.spec.ts` (SWD-022, 025, 099, 117, 129); those
that need the Secret Words screens are marked expected-to-fail (`aheadOfSecretWordsScreens`) until the screens exist.
