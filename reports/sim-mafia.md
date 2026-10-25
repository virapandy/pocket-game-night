# Mafia simulations (25 October 2026)

Lane `lane-o`, tested build: `main` d5dd03e (Mafia built, hidden). Owner's request of 25 October: extensive testing via Jev.
Report-only: nothing here fails a build. Code computes every fact; Jev only chooses; the real rules engine
(`src/games/mafia/rules`) is the referee.

## 1. Against the real rules engine (200 games)

Tool: `tests/sim/mafia-engine.ts` with `tests/sim/mafia-engine.run.ts` (reuses `tests/tools/jev-design/sim-mafia.ts`'s way of
asking, but the deal, the night order, the night's result, the stories, ties and the winner come from the engine's `play`).
Seeds `w43-<size>-<police>-<game>`. Day point without "nobody" (`--no-nobody`). Mafia count: the suggested one. Jev chose every
Mafia pick, Doctor protection, Police check and day point (each player apart, with that player's own facts: role, partners,
own checks and protections, everything public). Villagers' and ghosts' night picks change nothing and were made by a seeded
stub. A Mafia, Doctor or Police was offered the names the guide allows; when the engine refused Jev's top name, the refusal was
counted and the best-ranked name the engine allows was played (no extra decision). After every move the engine's invariants
were checked; at the end the winner was re-counted by code from the roles, and the saved game night replayed (same state,
same `readMafiaNight`).

| Players | Police shares | Games | Village wins | Mafia wins | Village win % | Rounds/game | Doctor saves/game | Ties/game | Second ties/game |
|---|---|---|---|---|---|---|---|---|---|
| 6 | never | 20 | 11 | 9 | 55% | 1.95 | 0.40 | 0.20 | 0.15 |
| 6 | when-found | 20 | 12 | 8 | 60% | 2.00 | 0.45 | 0.30 | 0.25 |
| 8 | never | 20 | 12 | 8 | 60% | 2.75 | 0.80 | 0.30 | 0.10 |
| 8 | when-found | 20 | 10 | 10 | 50% | 2.85 | 0.60 | 0.30 | 0.10 |
| 10 | never | 20 | 15 | 5 | 75% | 3.50 | 0.95 | 0.00 | 0.00 |
| 10 | when-found | 20 | 10 | 10 | 50% | 4.25 | 1.65 | 0.15 | 0.00 |
| 12 | never | 20 | 14 | 6 | 70% | 5.20 | 1.90 | 0.00 | 0.00 |
| 12 | when-found | 20 | 9 | 11 | 45% | 4.60 | 1.30 | 0.00 | 0.00 |
| 16 | never | 20 | 10 | 10 | 50% | 7.00 | 2.05 | 0.00 | 0.00 |
| 16 | when-found | 20 | 12 | 8 | 60% | 6.65 | 2.25 | 0.00 | 0.00 |
| **All** | | **200** | **115** | **85** | **58%** | | | | |

- Every game finished (no game ran past 40 rounds). Village wins per size: 6 → 23 of 40, 8 → 22 of 40, 10 → 25 of 40,
  12 → 23 of 40, 16 → 22 of 40.
- **Rules the engine refused that Jev tried: 1** in 200 games: a Police tried to check a player they had already checked this
  game ("That name is not allowed"; the engine is right, Version 1.1 item 4). Nothing else Jev chose was refused. The engine's
  allowed names matched the guide-level lists for every Mafia and Doctor turn (code, no Jev).
- **Problems: none.** Invariants held after every move; every winner matched the code's own count of Mafia against the rest;
  every saved game night replayed to the same state and the same `readMafiaNight`.
- Jev's Mafia always agreed on one name (no disagreements to settle), and no Jev Doctor-or-Police behaviour reached a rule edge
  the engine refused, except the one re-check above. Ties were rare with Jev (0 from 10 players up; the seeded stub, choosing at
  random, tied 1.4 to 2.4 times a game at those sizes), so the tie and second-tie screens get little exercise from Jev tables.
- The Police sharing a finding did not help the Village in these games (Village won 53 of 100 games with sharing, 62 of 100 without
  each). Jev is not reliable at following a public accusation, so treat this as a weak signal, not evidence about real tables.
- For comparison, the seeded stub (random choices, 200 games, `reports/sim/mafia-engine-stub.md`): Village 21% overall, with
  65 refused Police re-checks; also no problems.
- Parts: `reports/sim/mafia-engine-jev-part1.md` (6 players, never, and 11 games of when-found; stopped when the Mac slept and Jev
  could not be reached twice in a row), `-part2.md` (the other 9 games of 6 when-found, same seeds), `-part3.md` (8 to 16).
- Jev decisions: 446 + 124 + 8,601 = **9,171**.

## 2. Screen-played evenings with the privacy check (20 evenings)

Tool: `tests/sims/mafia-runner.ts` with `mafia-evenings.sim.ts`, preview build, 3 workers under `caffeinate -i taskpolicy -b`.
Mafia is not on the picker yet, so each night opens on the first deal screen through MAF-H6 (`pgn.test.load`, only `start`
recorded), with the evening's own deals (MAF-H3). Seeds `w43-001` to `w43-020`, every one with Jev choosing as the persona
(first-time host 4, grandparent 4, 10-year-old 3, distracted host 3, competitive uncle 3, guest 3) on room screens, at night
(given its own role only) and in the vote, from button names only; the scripted persona carried on after 35 decisions.
Results per evening: `reports/sim/screen/mafia/maf-w43-*.json`.

- **All 20 evenings reached Home after "Tonight's Mafia"**: 30 games, 6,118 steps, 101 nights, 77 votes, 5 to 12 players
  (5: 2, 6: 5, 7: 2, 8: 2, 9: 1, 10: 3, 11: 2, 12: 3), widths 320 to 812. Covered: the deal (tap mode), Deal again (6 evenings),
  every night screen, morning, day, countdown, the picker, ties (5) and "Still a tie" (1), "Nobody today" (2), vote results,
  game over, Play again (10), End for tonight (20), End the game (1), Pause (10), the Players dialog (12) with someone joining
  the next game and 7 players leaving (by day and at night), How to play (6), 3 reloads.
- **Privacy (MAF-P2 / MAF-016), checked on 2,281 room screens**: the page text, accessible names, title and live regions never
  put a role or "Not Mafia" next to the name of a player who was in or had left; no room screen held a private part
  (`private-word`, `job-line`, `night-names`, `result-line`); N0, N1 and N3 named nobody but the player the phone was passed to.
  The truth used was what B2 showed each player, so Deal again was followed. **No privacy slip.**
  Three hits in trial and run versions were the checker's own mistakes, now fixed in the runner: How to play's "The Police
  learns only Mafia or Not Mafia." (names nobody), and the leave toast "Dev left · Undo" / "Tara left · Undo" on N1 (MAF-052
  names the leaver by design; seeds `w43-011` step 62, `w43-019` step 84; the leaver's role was not shown).
- **Stuck: none.** Every screen but the countdown had a way on; no screen held a persona for 30 steps. (A runner fault in an
  earlier version, not the app, kept a player on B2 after Deal again; fixed.)
- At most one main button, nothing sideways, no console error, no reload lost a saved move.
- For the product owner (Jev as persona, a weak signal): Jev's "which button next?" rating on the "Deal again?" dialog picked
  "Deal again" over the main "Keep these roles" (0.66 to 0.84) in 6 of 20 evenings, and personas opened Menu → Deal again
  from the deal pass screen repeatedly (for example `w43-002` steps 26 to 31, then confirmed it).
- Jev decisions: **703** (and about 160 more in a first run stopped to fix the runner).

## Decisions used (Mafia)

Rules engine 9,171 + screens 703 + stopped first screen run about 160 = **about 10,030**.
