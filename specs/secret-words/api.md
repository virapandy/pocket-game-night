# Secret Words: the rule API the tests use (C3, 22 October 2026)

For the Build role. This makes "Test hooks the build provides", item 1 ([README.md](README.md)), exact: what the rule
tests import, what they pass in and what they expect back. Nothing here changes a scenario; where this page and a
scenario differ, the scenario wins and the tester fixes this page (write it in `docs/test-questions.md`).

Tests: `tests/games/secret-words/*.test.ts`, `tests/contract/secret-words.test.ts` (the shared contract suite),
`tests/browser/secret-words-c3.spec.ts`. Fixtures: `tests/fixtures/secret-words-golden-boards.json`,
`tests/fixtures/secret-words-saved-evenings-v1.json` (never edit either).

## Where
Everything comes from **`src/games/secret-words/index.ts`**. Until an export exists, each test that needs it fails on
its own with "… is not exported from src/games/secret-words yet". The engine (`startMatch`, `play`, `replay`, `undo`,
`createRng`, `shuffle`, `readSavedGame`) is used as it is today; no engine change is expected.

## The word list
`content/secret-words/words.json`, built from `docs/games/secret-words/words.csv` (as `npm run build:words` does for
Impostor). One object per CSV row, in row order, exactly:

```ts
interface SecretWordsWord {
  id: string;            // "SWDW-001"
  word: string;          // as in the list, "Chai"
  meanings: string; category: string;
  audience: 'family' | 'grownups';
  nonveg: boolean;       // CSV "yes" → true, "no" → false
  edition: number;       // CSV "1" → 1
  retired_in: number | null;  // blank → null
}
```
The `notes` column stays out. The tests compare the file with the CSV row for row.

## Exports

| Export | Input | Output |
|---|---|---|
| `secretWordsRules` | — | the game's `GameRules<Config, State, SecretWordsMove, View>`, `id: 'secret-words'` |
| `boardFromCode(code, words)` | a 7-symbol code **without hyphen**; the word list | `{ words: string[] /* word text */, ids: string[] /* word ids, same order */, kinds: Kind[], starts: 'orange' \| 'teal', edition: number, board: 'full' \| 'easy', audience: 'family' \| 'grownups' }`, or `{ error: 'invalid' }` / `{ error: 'newer' }` |
| `codeFor(cfg, deck, n)` | `{ edition, board, words }`, deck seed 0–923,520, deal index n | the 7-symbol code, no hyphen |
| `parseMapCode(typed, words)` | what was typed (any case, spaces, hyphens) | the 7-symbol code, or `'invalid'` / `'newer'` (SWD-002's order: rule 1 before rule 2) |
| `nextMapCode(code, words)` | a valid code | the code with deal index n + 1, or `null` when that is not valid |
| `pickDeck(dealSeed, k, candidates, avoid)` | `seeds.deal`, the evening's deck number k, candidate **ids** in `words.csv` row order, ids to avoid | the deck seed (SWD-024) |
| `penaltyCell(state, dealSeed)` | the state on the clue or guessing step before the turn's first guess; `seeds.deal` | the cell SWD-046 turns over |
| `reduceLetters(text)` | any text | NFKC, lower case, a–z only (SWD-101) |
| `clueWarning(typed, cells)` | the typed clue word; the board as `{ word, turned }[]` in `data-index` order | the word text of the first face-down word SWD-101 warns about, or `null` (**new here**: SWD-101's warning as a pure function, so the rule tests can check it) |
| `readSecretWordsEvening(saved)` | a `SavedGame` of this game | see "The evening" below |
| `readTestSeeds(raw, release)` | `localStorage['pgn.test.seeds']`, whether this is the release build | `{ deal?, teams?, boards? }` with only the keys present, or `null` (release build, missing, not JSON, not an object) |

Codes everywhere in the rule API are 7 symbols without the hyphen ("27P3QX8"); the hyphen is only for showing.
`boardFromCode` with the worked example: `'27P3QX8'` is edition 1, Full, Whole family, n = 5; `nextMapCode('27P3QX8')`
is `'28P3QXA'`.

## Setup
`startMatch(secretWordsRules, setup, at)` with Test hooks item 1's `SetupInput`:
```ts
{ gameId: 'secret-words', seeds: { deal: string, teams: string },
  config: { players: string[], teams: Teams, splits: number, choices: SecretWordsChoices,
            excludedWords: { recent: string[] /* word ids */ }, testBoards?: string[] } }
```
`Teams` as item 1, with `partners` (may be set already at setup: Make teams' Clue givers sheet). The evening starts with
no deal; its first move is `deal`. `testBoards[i]` is the code of deal i + 1 (deals and new boards counted together).

## Moves and when they are legal
Moves are item 1's `SecretWordsMove`. **`legalMoves(state, 'host')` lists complete moves** for everything except the
detail moves (`detailMoves` = `['clue', 'setTeams', 'setClueGivers', 'setChoices', 'setPlayers']`). The tests take
these from the list and play them through `play`:

| Step | Listed |
|---|---|
| before the first deal | `{ type: 'deal', code }` (SWD-024's code, or `testBoards[0]`) |
| clue step (a team's turn, no clue yet) | `mapSeen` (one phone, once per turn), `dealNew {code}`, `endGame` |
| guessing | one `reveal {cell}` per face-down cell, the Landmine's with `freeCell` under Lose your turn; `brokeRule {cell}` before the turn's first guess; `endTurn` after it; `dealNew {code}`; `endGame` |
| turn over (allowance used up, a wrong word, the Landmine under Lose your turn, broke a rule, or after `endTurn`) | `nextTurn`, `dealNew {code}`, `endGame` |
| game over (a winner, or ended early) | `deal {code}` (Play again), `endEvening` |
| after `endEvening` | nothing (`isOver` is true) |

- `clue` is legal on the clue step, and again while guessing **before the turn's first reveal** ("Change clue" / "Try
  another clue": it replaces the turn's clue). `n` is 0–9 or `'inf'`; `word`, when present, is 1–24 characters after
  trimming. A clue never needs `mapSeen` first (the tests give clues without it).
- `reveal` needs a clue, a face-down cell 0–24 (0–15 on Easy) and guesses left. Under Lose your turn the Landmine's
  reveal must carry exactly SWD-043's `freeCell`; every other reveal has no `freeCell`.
- `brokeRule` is accepted only with SWD-046's cell (deterministic, so replay agrees). The same holds for `freeCell`.
- `deal` / `dealNew`: any code valid for the shipped editions is accepted (replay must accept any recorded code,
  SWD-026). Live, the code comes from `legalMoves` only. (The engine replays through the same `apply`, so `apply` cannot
  refuse a valid code that is not SWD-024's; as Impostor's word ids, 4 October. See `docs/test-questions.md`.)
- A change of Board or Words by `setChoices` makes the next deal pick a new deck (k + 1, n = 0). A change of Landmine or
  phones alone keeps the deck.
- `setChoices`, `setClueGivers`, `setTeams`: at game over. `setPlayers`: at any step from the first deal to game over.
  Every team change keeps: each team at least 2 players; a clue giver who is a player of that team and eligible (not in
  `guessOnly`); a partner (if any) who is another eligible player of that team; at least 1 guesser per team; at most 20
  players; no name twice. Anything else is refused.
- `endGame`: from the first deal until game over. `endEvening`: at game over only (mid-game, `endGame` comes first).
- `canUndo` is always false.

## Views
Room (`{ kind: 'room' }`), exactly item 1's fields:
```ts
{ cells: { word: string; kind?: Kind }[],   // face-down cells are exactly { word }; kind when turned over, and for every cell after game over
  clueWord: string | null, clue: number | 'inf' | null, guessesLeft: number | 'unlimited' | null,   // null outside guessing
  clues: { team; n; word?; found }[],         // clues in force this game, oldest first; a replaced clue is gone
  lastTurn: { team; found; ended; cell? } | null,   // the board's previous turn; null on a board's first turn
  turn: Team, left: { orange: number; teal: number }, picker: string | null,   // picker null outside guessing
  step, winner: Team | null, endedEarly: boolean }
```
- `guessesLeft`: clue 1–9 → n + 1 before the first reveal, one fewer per guess; 0 and ∞ → `'unlimited'`.
- `lastTurn.ended`: `'rule' | 'landmine' | 'stopped' | 'allowance' | 'nobody' | 'other'`; `cell` only for `'nobody'`
  and `'other'` (the word that ended the turn).
- No map code, no seed and no list of kinds is ever in the room view before game over.

Player `{ kind: 'player', playerId }`: for the current clue giver or partner of either team, the same shape with
`kind` on **every** cell (the map); for anyone else, exactly the room view.

## The evening (`readSecretWordsEvening`)
```ts
{ seeds, players: string[] /* now */, teams: Teams /* now */, choices: SecretWordsChoices /* now */,
  status: SavedGame['status'], ended: boolean /* endEvening recorded */,
  games: { number: number; winner: Team | null; endedEarly: boolean; landmine: boolean /* won by the Landmine (Lose the game) */;
           code: string /* the board it ended on */; clueGivers: { orange: string[]; teal: string[] } /* credited: clue giver, then partner; names as renamed */;
           clues: { team; n; word?; found }[] /* in force, oldest first */ }[],   // won and ended-early games only; a replaced board is not a game
  tally: { orange: number; teal: number } }   // won games
```
A game in progress is not in `games` until it ends.
