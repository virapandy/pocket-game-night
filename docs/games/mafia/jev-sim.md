# Jev design check: mafia, Mafia table simulation

Run: 2026-10-23, budget `product`. Tool: `tests/tools/jev-design/run.ts --sim mafia`. Sizes 6, 8, 10, 12, 16; police shares never, when-found; seed 1. Findings only.

## Mafia table simulation

Referee in code (rules: `docs/games/mafia/guide.md`, MF1 to MF15); Jev only chose each player's night pick and day point from the legal names. Seed 1; game seeds are derived from it, size and game number, so the referee's deals are replayable (Jev's answers are logged in the sidecar JSON, which `--replay` plays back). Games per cell asked: 20. Villagers' night "suspect" pick has no effect and is not asked. A Mafia pick must be a non-Mafia player. Police: `never` keeps findings private; `when-found` adds "the Police says X is Mafia" to every player's facts that day if the Police is still in.

| Players | Police shares | Games | Village wins | Mafia wins | Unfinished | Village win % | Rounds/game | First out sits out (rounds) | Doctor saves/game | Mafia disagreements/game | Ties/game | Second ties/game | Nobody by choice/game | Nobody after tie/game |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | never | 20 | 10 | 10 | 0 | 50% | 3.5 | 2.4 | 0.90 | 0.00 | 0.20 | 0.00 | 2.40 | 0.00 |
| 6 | when-found | 20 | 16 | 4 | 0 | 80% | 2.5 | 1.4 | 0.60 | 0.00 | 0.05 | 0.00 | 1.50 | 0.00 |
| 8 | never | 20 | 8 | 12 | 0 | 40% | 4.5 | 3.4 | 0.60 | 0.00 | 0.15 | 0.00 | 2.60 | 0.00 |
| 8 | when-found | 20 | 13 | 7 | 0 | 65% | 3.9 | 2.8 | 0.65 | 0.00 | 0.05 | 0.00 | 1.90 | 0.00 |
| 10 | never | 20 | 8 | 12 | 0 | 40% | 6.0 | 4.8 | 0.80 | 0.00 | 0.05 | 0.00 | 4.25 | 0.00 |
| 10 | when-found | 20 | 17 | 3 | 0 | 85% | 3.8 | 2.7 | 0.70 | 0.00 | 0.05 | 0.00 | 1.75 | 0.00 |
| 12 | never | 20 | 7 | 13 | 0 | 35% | 7.4 | 6.3 | 0.90 | 0.00 | 0.00 | 0.00 | 4.75 | 0.00 |
| 12 | when-found | 20 | 12 | 8 | 0 | 60% | 6.7 | 5.6 | 1.30 | 0.00 | 0.10 | 0.00 | 3.80 | 0.00 |
| 16 | never | 7 | 0 | 7 | 0 | 0% | 11.7 | 10.7 | 1.71 | 0.00 | 0.00 | 0.00 | 8.43 | 0.00 |

- Decisions used by the simulation: 7943 (limit 8000).
- Stopped early: Jev or the budget stopped answering. A game cut off by the stop is not counted.
- "First out sits out": rounds from the first player going out to the end of the game (0 = the game ended that round).

## Decisions used

- This run: 8000 decisions, 8000 calls.
- Product count this ISO week (2026-W43): 3896 before, 11896 after, of 15000.
- Shared count this ISO week: 5699 before, 13699 after, of 50000.
- Stopped early: no.
- Picks where Jev's answer named no legal name (a legal name was then chosen at random): 0.
- Choices log (for `--replay`): /Users/virat/Documents/Game_On/pocket-game-night-product/docs/games/mafia/jev-sim.md.json

## Tool faults (kept apart from findings)

- None: every call answered on the first try.
