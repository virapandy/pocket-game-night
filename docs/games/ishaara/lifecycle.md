# Ishaara: the whole evening, stage by stage (draft, 4 October 2026)

**Binding details are in scenarios.md; where this file differs, scenarios.md wins.**
Designed against the five stages in `docs/proposals/next-game-lifecycle.md`, before any build. Rules: `guide.md`.
Screens: `ux.md`. Words: `words.md`.

## Who is involved
| Role | Who | Note |
|---|---|---|
| **Host** | Holds the phone, sets up; **also plays** (guesser or clue giver) | Must never see the map unless they are a clue giver |
| **Clue giver** | One per team per game | Sees the map; says clues; keeps a straight face |
| **Guesser** | Everyone else | Sees only the board |
| **Newcomer** | Never played | Should be a guesser in their first game (rotation puts experienced players first only if the host chooses) |
| **Guest with the link** | Opens the app on their own phone | Nothing to join unless they are a clue giver with "own phones" |

## Ways to play
| Mode | First release? | Falls back to |
|---|---|---|
| **One phone, map passed to the clue giver** | Yes | Paper: 25 words written, a map drawn by one person |
| **Clue givers' own phones** (map from a QR or code, offline) | Yes | One phone |
| Board on the TV | Later | One phone |
| Guessers' own phones ("my pick" votes) | Later, connected mode | One phone |

---

## Stage 1. Decide
| Who | Sees | Does | Target |
|---|---|---|---|
| Host | "What shall we play?": Tambola, Impostor, **Ishaara** | Taps Ishaara | 5 s |
| Guest with the link | Join screen line: "Playing Ishaara? Clue givers: scan the host's map code. Everyone else: just play along!" | Clue givers scan; others put the phone away | — |
Fits 4–20 players; best 6–8; about 15 minutes a game.

## Stage 2. Set up and join
| Step | Default | Target |
|---|---|---|
| Who's playing? | Tonight's names (PLT-024) | 0 s if tonight's names; 60 s typing the first time |
| Make teams | Shuffled into equal teams (±1) the first time; last teams after | 10 s |
| How do you want to play? | Map: no default (two equal cards); Board Full; Words Whole family; last-used values afterwards | 5 s |
| Read this aloud | Once per session | 20 s |
| Own phones only: scan the map | Once per game; QR or 6-character code | 20 s |
**Target:** 30 s from the Ishaara card to the first clue for a group that played earlier tonight; 2 minutes the first time.
**Late joiner:** "Change teams" between games, or menu → "Players" during a game: joins as a guesser on the smaller team
straight away (guessers have no secret). **Someone leaves:** removed at once from "Players"; if they were the clue giver,
the team's next player takes over and sees the map at the team's next pass (own phones: "Show the map to a clue giver").

## Stage 3. Teach
| Moment | What the app does |
|---|---|
| First Ishaara game of the session | "Read this aloud": four lines (`ux.md` §5) |
| First clue of the evening | Under the number keys, one small line: "One word, one number. No faces, no pointing!" |
| First guess of the evening | Small line: "Tap a word, then Reveal. You can take one more than the number." |
| Any time | Menu → "How to play": the rule book in plain words, never showing the map |
| After a wrong word | The result line says what happened and whose turn it is, so the rule teaches itself |
| Kids or first-timers | "Family: 16" board, no Bhoot |

## Stage 4. Play
**Turn loop:** map (one phone: pass and hold; own phones: already on their phone) → clue number → guesses → result →
next team.

**Moments every game must handle**
| Moment | Behaviour |
|---|---|
| Phone locks or a call comes while the map shows | Map hidden at once; returns to the "Pass the phone to RIYA" screen (one phone), never the map |
| App closed mid-game | Reopens at the same step; on the board, or at "Pass the phone to…" if the map was showing |
| A guesser glimpsed the map | Menu "Deal a new board": new words, new map, same teams and clue givers; this board isn't counted |
| A clue broke a rule | Menu "That clue broke a rule": confirm → the turn ends and one random word of the other team is turned over |
| Wrong word tapped | Nothing happens until "Reveal <WORD>" is tapped; tap another word to change the pick |
| Slow clue giver or team | "Hurry up: 90 s" anyone may tap; at 0 the screen says "Time's up!" and waits |
| Clue giver forgets the map (own phones: their phone died) | One phone takes over: menu "Show the map to a clue giver" → pass and hold, as one-phone mode |
| Phone dies | Paper: write the 25 words still on the board; the other clue giver draws the map from memory, or start a paper game |
| Ending early | Menu "End the game": no winner, not counted in tonight's tally |

## Stage 5. After the game, after the evening
| Moment | What happens |
|---|---|
| Game result | Winner line, the whole map shown on the board (face-down words faded), tonight's tally |
| Play again | Same teams, the next clue givers (rule 17), new board with no word used tonight, starting team random |
| Change teams | Back to "Make teams" with the current teams |
| Own phones afterwards | The clue giver's phone shows "Done with this game" (clears the map); a map more than 6 hours old opens on Home with "Open" / "Clear", as Tambola tickets |
| End the evening | "Tonight: Mango 3 · Peacock 2"; fun lines; "Play something else" / "Back to Home" |
| History | Each game: teams, clue givers, the board, the map, the winner, how it ended; replayable from the seed |
| Words afterwards | No word repeats in an evening; words of the last 3 evenings are avoided when possible |

## Lifecycle questions (process step 4b)
| Question | Answer |
|---|---|
| Ending early vs discarding | "End the game" keeps the game in history as "Ended early", outside the tally. "Discard the evening" (asks first) removes the evening and its tally |
| Resuming hours later | The board doesn't spoil with time: within 12 hours it resumes at the same step (one phone: at "Pass the phone to…" if the map was showing). After 12 hours the evening ends by itself; an unfinished game is kept as "Ended early" |
| Chaining | Each game chains into the next; teams and tonight's tally carry over; clue givers rotate |
| What a finished evening keeps | Players, teams, each game's seed, board, map, clue numbers, every reveal in order, winner; the map is not a spoiler once the game is over |
| Must never be lost | Tonight's tally of a finished evening |

## Paper play-test (process step 5), before any build
6+ players, 3 games, one phone used only as a timer:
1. Write 25 words from `words.csv` on slips in a 5 × 5 grid. One person (not playing that game) draws the map on paper:
   9 for the starting team, 8 for the other, 7 nobody's, 1 Bhoot, and hands it to both clue givers.
2. Play one Full game and one Family game (16 slips, 6/5/5, no Bhoot). Try one game where the map is shown on a phone
   held privately, passed between clue givers.
3. Note afterwards: did anyone not know a word? Was 8 letters too short? Were Mango and Peacock fun? How long did clue
   givers think? Did anyone want a timer? Did the kids enjoy being clue giver? Was passing the map phone annoying?
