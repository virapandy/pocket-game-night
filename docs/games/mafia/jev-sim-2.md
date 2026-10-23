# Jev design check: mafia, Mafia table simulation

Run: 2026-10-23, budget `product`. Tool: `tests/tools/jev-design/run.ts --sim mafia`. Sizes 8, 12, 16; police shares never, when-found; seed 1; day point --no-nobody. Findings only.

## Mafia table simulation

Referee in code (rules: `docs/games/mafia/guide.md`, MF1 to MF15); Jev only chose each player's night pick and day point from the legal names. Seed 1; game seeds are derived from it, size and game number, so the referee's deals are replayable (Jev's answers are logged in the sidecar JSON, which `--replay` plays back). Games per cell asked: 20. Villagers' night "suspect" pick has no effect and is not asked. A Mafia pick must be a non-Mafia player. Police: `never` keeps findings private; `when-found` adds "the Police says X is Mafia" to every player's facts that day if the Police is still in.

| Players | Police shares | Games | Village wins | Mafia wins | Unfinished | Village win % | Rounds/game | First out sits out (rounds) | Doctor saves/game | Mafia disagreements/game | Ties/game | Second ties/game | Nobody by choice/game | Nobody after tie/game |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | never | 20 | 10 | 10 | 0 | 50% | 3.3 | 2.3 | 0.75 | 0.00 | 0.25 | 0.10 | 0.00 | 0.10 |
| 8 | when-found | 20 | 14 | 6 | 0 | 70% | 2.9 | 1.9 | 0.60 | 0.00 | 0.10 | 0.00 | 0.00 | 0.00 |
| 12 | never | 20 | 15 | 5 | 0 | 75% | 5.0 | 4.0 | 1.20 | 0.00 | 0.05 | 0.00 | 0.00 | 0.00 |
| 12 | when-found | 20 | 15 | 5 | 0 | 75% | 4.8 | 3.9 | 1.00 | 0.00 | 0.10 | 0.10 | 0.00 | 0.10 |
| 16 | never | 20 | 11 | 9 | 0 | 55% | 7.4 | 6.4 | 2.05 | 0.00 | 0.10 | 0.00 | 0.00 | 0.00 |
| 16 | when-found | 20 | 9 | 11 | 0 | 45% | 7.5 | 6.5 | 2.15 | 0.00 | 0.15 | 0.05 | 0.00 | 0.05 |

- Day point setting: --no-nobody (the day point offers only the players still in; no "nobody").
- Decisions used by the simulation: 7260 (limit 12000).
- Stopped early: no. A game cut off by the stop is not counted.
- "First out sits out": rounds from the first player going out to the end of the game (0 = the game ended that round).

## Decisions used

- This run: 7260 decisions, 7260 calls.
- Product count this ISO week (2026-W43): 12229 before, 19489 after, of 30000.
- Shared count this ISO week: 14032 before, 21292 after, of 50000.
- Stopped early: no.
- Picks where Jev's answer named no legal name (a legal name was then chosen at random): 0.
- Choices log (for `--replay`): /Users/virat/Documents/Game_On/pocket-game-night-product/docs/games/mafia/jev-sim-2.md.json

## Tool faults (kept apart from findings)

- None: every call answered on the first try.
