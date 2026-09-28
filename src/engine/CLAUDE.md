# src/engine/: the game contract and referee

The engine runs any game written to the contract. It must stay pure and tiny.

## The contract: every game answers seven questions
| Question | Meaning |
|---|---|
| Setup | Given the players and seeds, what is the starting state? |
| Legal moves | What can this player do right now? (a finite list, so the generic Jev player can choose from it) |
| Apply | What happens when someone makes a move? |
| View | What is this specific player allowed to see? |
| Game over | Has the game ended? |
| Invariants | What must always be true? |
| Undo | Which moves can be taken back, and by whom? The engine undoes by replaying without that move. |

## Hard rules
- No imports from `src/games`, `src/blocks`, `src/adapters` or `src/app`.
- No DOM, no `fetch`, no storage, no timers inside rules.
- No `Math.random()` and no `Date.now()`: all randomness comes from a seeded generator, time from moves.
- A secret gets its own seed, and seeds never leave the host phone (for example, Tambola's draw seed and
  sheet seed). Other phones receive only the result they may see, such as their own ticket's numbers.
- Every move is a small serialisable record. The move-record format carries a version number from day one,
  because saved failing games become permanent tests.
- The host phone holds the one true state. Other phones only send moves and show their own view.
- The engine announces events (game started, first action, game ended) through one hook; nothing listens yet.

## What is here (Phase 0)
| File | Holds |
|---|---|
| `contract.ts` | `GameRules`: the seven questions; `Viewer` (host, room, player); `SetupInput` with named seeds; `PlayerLocal` for phone-only state such as marks |
| `moves.ts` | `MoveRecord` (format `v: 1`, `seq`, `at`, `by`, `move`) and `HOST` |
| `random.ts` | `createRng(seed)`, `shuffle`, `pick`, `deriveSeed`. Fresh secret seeds are made in the app with `crypto`, never here |
| `referee.ts` | `startMatch`, `play` (checks invariants after every move; refuses moves after game over), `undo` (replays without the move; refused if a later move would break), `replay`, `viewFor` |
| `events.ts` | The one announce hook: game started, first action, game ended |
| `money.ts` | `MoneyRecord`: what each person paid and won (PLT-021); `moneyProblems` checks it balances |
| `saved-game.ts` | `SavedGame` (format 1): setup plus move records, status (PLT-001), money; `readSavedGame` reads every known format |
