# What the Impostor tests expect (C3 parts, written before the build, 3 October 2026)

For the Build workspace. The tests are the definition of done; this page lists what they import and what they
assume, so nothing has to be reverse-engineered. The contract is `specs/impostor/` (scenarios v2.2, copied unchanged
from `docs/games/impostor/scenarios.md`): its **Test hooks the build provides** section is binding. If something
here is wrong or impossible, write it in `docs/test-questions.md`; don't work around it.

## Files
| File | Scenarios |
|---|---|
| `words.test.ts` | IMP-050, IMP-051, IMP-052, IMP-053, IMP-054, IMP-055 |
| `deal.test.ts` | IMP-010, IMP-011, IMP-015, IMP-016, IMP-025, IMP-063 |
| `starter.test.ts` | IMP-020, IMP-021 |
| `vote-and-reveal.test.ts` | IMP-031, IMP-032, IMP-033, IMP-034, IMP-035, IMP-037, IMP-038 |
| `scoring.test.ts` | IMP-041, IMP-042 |
| `secrets-and-seeds.test.ts` | IMP-060, IMP-061, IMP-062, IMP-064 |
| `saved-evening.test.ts` | IMP-096 (with `tests/fixtures/impostor-saved-evenings.json`) |
| `../../contract/impostor.test.ts` | the shared contract suite (PLT-100 onwards; IMP-062: views keep every secret) |

Browser tests for the same C3 scenarios: `tests/browser/impostor-privacy.spec.ts`,
`impostor-saved-evenings.spec.ts`, `impostor-scoring.spec.ts` (see `tests/browser/README.md`, "Impostor").

## Imports
Everything comes from **`src/games/impostor/index.ts`** (Test hooks item 1), loaded once by `helpers.ts`. Until an
export exists, each test that needs it fails on its own with "… is not exported from src/games/impostor yet".

`impostorRules` · `pickImpostor` · `pickStarter` · `pickWord` · `scoreRound` · `readImpostorEvening` ·
`readTestSeeds`, with exactly the signatures in Test hooks item 1. The engine (`startMatch`, `play`, `replay`, `undo`,
`createRng`, `readSavedGame`) is used as it is today; no engine change is expected.

The word list is read from `content/impostor/words.json` (IMP-055) and compared with `docs/games/impostor/words.csv`
(parsed by a real CSV parser in `helpers.ts`). `pickWord` is called with the CSV rows in the `words.json` shape.

## How the rule tests play an evening
`helpers.ts`'s `Evening` plays moves through the engine's `play` (one second apart, `by: 'host'`) exactly as the
"Tap → move" table: `startDeal {practice}`, then one `seen` per player, `startTalk`, `voteNow`, then `reveal {player}`
(then `showWord` and `verdict {right}` when it is the impostor), or `tie {players}` then `reveal` / `stillTie`; then
`nextRound`. It reads the round's impostor and word from the **player views** (`{ role: 'impostor' }` /
`{ role: 'crew', wordId }`), and the starter, round number and players from the **host view**.

Forced deals (`config.testDeals`, Test hooks item 3) set some rounds' word, impostor or starter. The tests only force
deals that keep every rule (a starter who has not started this cycle, never the impostor in Hard; family words).

## What the tests expect the rules to refuse
These follow from the scenarios (the buttons do not exist at that moment); a refused move changes nothing:
- any move before `startDeal`, and a second `startDeal`;
- `seen` once everyone has seen; `startTalk` before everyone has seen;
- `anotherRoundOfClues` with 6 or more players, or twice in a round (IMP-022);
- `reveal` before `voteNow`, of someone not playing, a second `reveal` in a round, and in a re-vote of someone not
  tied (IMP-031, IMP-032);
- `tie` with fewer than 2 players, the same player twice, or someone not playing; a second `tie` (IMP-032);
- `stillTie` without a `tie` first;
- `verdict` before `showWord`; `showWord` or `verdict` after a crew member is revealed or after "Still a tie";
  `nextRound` before a caught round has its verdict (IMP-033, IMP-034, IMP-038).

`canUndo` is true only for the round's latest `verdict` while no `nextRound`, `setPlayers`, `setChoices` or
`endEvening` came after it (`wordDidntWork` does not end the window); false for every other record (IMP-037).

## What the rule tests cannot check (asked in `docs/test-questions.md`)
- IMP-042's evening **totals**: no export or view carries them (the host view is exactly
  `{ round, practice, players, starter }` plus `impostor` and `wordId` after the reveal). The rule property checks
  every round's points against `scoreRound` for its outcome over 1,000 evenings; the totals are checked on screen with
  an example evening (`tests/browser/impostor-scoring.spec.ts`).
- IMP-064 on the release build: `readTestSeeds(raw, true)` is checked here; the browser tests run on the preview
  build only.

## Running
`npm test` runs these with every other rule test. On their own:
```
npx vitest run --config tests/vitest.config.ts tests/games/impostor tests/contract/impostor.test.ts
```
The property tests (1,000 evenings each, 10,000 picks) take a few seconds in all.
