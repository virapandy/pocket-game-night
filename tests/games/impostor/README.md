# What the Impostor tests expect (C3 parts, written before the build, 3 October 2026; updated 4 October 2026 to v3.5)

For the Build workspace. The tests are the definition of done; this page lists what they import and what they
assume, so nothing has to be reverse-engineered. The contract is `specs/impostor/` (scenarios v3.5, copied unchanged
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
| `saved-evening.test.ts` | IMP-096 (format fixture `tests/fixtures/impostor-saved-evenings-v3.json`; the v2.2 file `impostor-saved-evenings.json` is now an evening from an earlier preview build, which no longer replays) |
| `word-ids.test.ts` | Test hooks item 1 (v3.5): `wordId` on every word-dealing move, per-deal seeds, replay of recorded and retired ids; IMP-021, IMP-052, IMP-054, IMP-060, IMP-061, IMP-096 |
| `last-guess.test.ts` | IMP-033, IMP-035, IMP-037, IMP-039, IMP-041, IMP-071, IMP-076; IMP-096 (no `lastGuess` reads as on) |
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

## Round 4 (v3.5) in short
- **Word ids.** A word-dealing move (`startDeal`, `nextRound`, `dealAgain`, `dontKnow`, `allowRepeats`, and `setChoices`
  when it redeals from the no-words screen) carries `wordId`. The tests take that id from your `legalMoves` (the
  contract's complete moves): `helpers.ts` `withWordId` copies the `wordId` of the legal move of the same type. So
  `legalMoves(state, 'host')` must list each word-dealing move with the id that deal n gives.
- **Per-deal seeds.** Deal n (every word-dealing move counts, from 1; a `nextRound` with `wordId: null` does not) uses
  ``createRng(`${word}:word:${n}`)``, ``createRng(`${word}:impostor:${n}`)`` and ``createRng(`${starter}:${n}`)``.
  `word-ids.test.ts` checks deal 1 and deal 2 against `pickWord(ACTIVE, …)`, `pickImpostor` and `pickStarter`.
- **Replay** accepts any recorded id in the shipped list (retired included) and refuses a word-dealing move without
  `wordId` or with an unknown id.
- **Retired words** are never dealt; `pickWord` tests pass only the active words (`ACTIVE`), the evening tests check
  that no deal is a retired id.
- **`lastGuess`.** `DEFAULT_CHOICES` in `helpers.ts` plays with `lastGuess: true` (so v2.2's caught rounds keep their
  verdict); guess-off rounds pass `lastGuess: false`; choices with no `lastGuess` read as on.
- `setChoices` moves in tests of other rules use the 6 category names that are the same before and after 4 October
  (`changedChoices`).

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
  `nextRound` before a caught round has its verdict, with the last-chance guess on (IMP-034, IMP-038, IMP-039);
- with the guess off: `showWord` and `verdict` after the impostor is revealed (IMP-033, IMP-076).

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
