# Mafia: what Jev's story check and table simulation showed (product owner, 23 October 2026)

Raw reports: `jev-stories.md` and `jev-sim.md` (with `jev-sim.md.json` for `--replay`). Run through the jev-design helper with
the product budget: 104 + 8,000 decisions; the product side's week stands at 11,896 of 15,000. Jev is a first filter, never
the approver (`docs/word-guidelines.md`).

## 1. The morning stories
| Finding | Action (stories edition 1.1) |
|---|---|
| **Scary for a 7-year-old over 0.5:** MAFS-06 (packed into a suitcase, 0.56, also friendly only 0.38) and MAFS-12 (it wasn't the milkman, 0.52) | **Both retired.** 13 "out" stories and 11 "saved" stories remain: enough for any game |
| **Understood under 0.4:** MAFS-02 (auto ride, 0.30), 08 (hid the slippers, 0.36), 11 (five-day cricket match, 0.39), 13 (long TV serial, 0.16), 20 (said nobody was home, 0.36) | **Rewritten in plainer words**, marked "re-check" in `stories.csv`: the joke said straight, no Indian-English idiom ("five-day", "serial") |
| Understood 0.4–0.5: MAFS-09, 15, 19, 21, 22, 24 | Kept: near the line on one reading; the re-check covers them too |
| Least funny: MAFS-01 (0.24), 04 (0.21), 25 (0.27) | Kept: 01 is the plain example; funny is a goal, not a flag |
| Funniest: MAFS-16 turmeric milk (0.93), 09 jalebis, 13 (0.88), 19 banana peel (0.84) | — |
**Re-check:** the five rewritten stories and the six near the line, about 44 decisions, next time the product side runs Jev.

## 2. The table simulation (Jev players, code referee)
Village wins, 20 games a cell; the referee applied MF1–MF15 and the MF5 table:

| Players (Mafia) | Police keeps findings private | Police tells the room |
|---|---|---|
| 6 (1) | 50% | 80% |
| 8 (2) | 40% | 65% |
| 10 (2) | 40% | 85% |
| 12 (3) | 35% | 60% |
| 16 (4) | 0% (only 7 games before the limit) | not run |

**What it says, with its limits:**
1. **The convention table is roughly fair**: Mafia-leaning when the Police stays quiet, Village-leaning when the Police
   speaks. That is how the game is meant to work: the Police's choice to speak is the big decision of a game. This sits
   between the two earlier runs (random votes: the Mafia win most; talking AI players: the Village won 11 of 12).
   **No rule change** (`evidence-2026-10-23.md`: conventions win by default).
2. **Jev chose "Nobody today" far more than people would**: 1.5 to 8.4 days a game with nobody out, against none in the 12
   AI games with talk. A day with nobody out helps the Mafia and makes games long (up to 11.7 rounds at 16 players). So the
   "Police quiet" column and the 16-player row **overstate the Mafia's chances**. A rerun without the "nobody" choice would
   tell; it costs about 8,000 decisions, so it waits for next week's budget.
3. **16 players** (4 Mafia) is the one row that looks bad, on 7 games and the "nobody" effect. Watch it; the host can
   already lower the Mafia by one (MF5).
4. Rounds per game (3.5–7.4 at 6–12 players) and the first player out sitting 1.4–6.3 rounds support the ghost guess (MF11).
5. The Mafia never disagreed at night, again; no tool faults; no illegal picks.

## For the owner
Nothing to decide now. Suggested for next week, when the Jev budget resets: (a) the stories re-check (about 44 decisions);
(b) the simulation rerun without "nobody" at 8, 12 and 16 players (about 6,000 decisions).
