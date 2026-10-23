# Mafia: lifecycle and long-term behaviour (draft, 23 October 2026)

Step 4b of `docs/new-game-process.md`. The shared rules are in `specs/platform/01-lifecycle.md` (states, one game at a time,
resume, discard, history, delete, storage, updates); this file answers only what is special to Mafia. Screens: `screen-map.md`
draft 3. Decisions: MF1–MF15 (`docs/decisions.md`).

## Ending early vs discarding
| Case | What happens |
|---|---|
| **End the game** (D7) mid-game | Every role is shown on G1 with "Game ended. No winner." and the nights so far. Not counted in tonight's score (Village v Mafia), but counted in "games played". Undo for 10 s. |
| **Someone must leave** (D3) | Out at once by day, after the night at night; role stays secret until the game ends (MF10, draft 2). If that decides the game, it ends with the normal winner and "Kabir had to leave." |
| **Discard** (History, "Delete tonight's games") | The game night and its score are gone. Mafia has no money or prizes, so nothing needs keeping. |
| **Start new** while a game is unfinished (A3) | The old one ends as "Game ended. No winner." (shared rule). |

## Resuming
- **Within the evening:** a Mafia game resumes sensibly hours later; nothing in it is timed except the optional 2-minute day
  timer, which restarts stopped.
- **Never on a private screen.** Resume, reload or the app being hidden always lands on a room screen; a night in progress
  lands on the pass screen of the player whose turn it is, with "Welcome back." and the where-line. A night pick counts only
  when that player tapped Done.
- **Next day:** an unfinished game is offered on Home like any other ("Mafia · Riya, Arjun +6 · Night 2"); nobody may
  remember their role, so the resume row's first screen offers "See my role again" for everyone (D5) before carrying on.
  *(Product owner's call, low; listed for the owner.)*

## Chaining games
- **Play again** keeps the players (new ones added, leavers removed) and the Mafia count unless the new count doesn't allow
  it (screen map G1); new roles every game from a new role seed.
- **Night-level totals:** "Village 2 · Mafia 1", "Mafia most often", "Sharpest eyes" (Villagers' night picks), "Best ghost
  guess". No points per player: Mafia is a team game, and per-player scores reward the Mafia for staying hidden, which
  families didn't ask for.
- **Fair roles across games:** nobody is Mafia three games running (as Impostor's streak rule), from the role seed.
  *(Product owner's call, low.)*

## What a finished game keeps
- For History and disputes: players in seat order, every role, every night's picks (Mafia, Doctor, Police, Villagers'
  suspects, ghost guesses), the random choice when the Mafia differed, each vote (including ties and Nobody today), leavers,
  the story IDs used, and the role seed, so the game replays exactly.
- Nothing secret is left behind: roles are already shown at game over, so keeping them spoils nothing (unlike a word game's
  word list).
- History line: "Mafia · 9:10 pm · 9 players · The Village won · 3 nights".

## Anything that must never be lost
Nothing beyond the shared rules: no money, no prizes, no roll-overs. The score of tonight is kept with the game night like
every game's.

## Players' own phones (later, designed now)
Roles on each player's phone would remove the deal pass and the night pass, but bring back the night's "who's tapping"
problem in a new form (screens lit up at once). Not before the one-phone game has been played; the contract keeps roles and
picks per player so a later phone mode needs no rule change.
