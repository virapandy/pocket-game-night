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
- A secret gets its own seed (for example, a host-only draw seed and one seed per ticket).
- Every move is a small serialisable record. The move-record format carries a version number from day one,
  because saved failing games become permanent tests.
- The host phone holds the one true state. Other phones only send moves and show their own view.
- The engine announces events (game started, first action, game ended) through one hook; nothing listens yet.
