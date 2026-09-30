# The game contract, new games, and the generic simulated player (Phase 2.5)

These tests run against **every registered game**, so each new game (Impostor, Dumb Charades,
Scoreboard …) is checked the day it plugs in. See `src/engine/CLAUDE.md` for the seven questions.

## PLT-100: Every game is repeatable from its seeds
Status: draft
Phase: Phase 2.5
For every registered game, and thousands of random games of each
Then replaying the same seeds and moves gives exactly the same states, views and results

## PLT-101: No view leaks a secret
Status: draft
Phase: Phase 2.5
Given each game declares which parts of its state are secret, and who may see each part
For thousands of random games of each registered game
Then no player's view and no room view ever contains a secret it is not allowed to see

## PLT-102: Illegal moves are always refused
Status: draft
Phase: Phase 2.5
For every registered game, at random points in random games
When a move that is not in that player's list of legal moves is applied
Then it is refused and the game state does not change

## PLT-103: Every game ends
Status: draft
Phase: Phase 2.5
For thousands of random games of each registered game, played with random legal moves
Then every game reaches its end, within a limit the game declares

## PLT-104: Invariants always hold
Status: draft
Phase: Phase 2.5
For every registered game
Then after every move in thousands of random games, every invariant the game declares is true

## PLT-105: Undo is replaying without the move
Status: draft
Phase: Phase 2.5
For every registered game
When any undoable move is undone
Then the state equals a replay of the game without that move

## PLT-106: Legal moves are a short list
Status: draft
Phase: Phase 2.5
For every registered game, at every point
Then each player's legal moves form a finite list of at most 255 choices
(So the generic Jev player can choose among them with a single question.)

## PLT-107: Saved games of every game still open after updates
Status: draft
Phase: Phase 2.5
For every registered game
Then its saved games carry a format version, and a saved game from each earlier format still opens

## PLT-108: A new game plugs in without engine changes
Status: draft
Phase: Phase 2.5
When a new game is created from the new-game template and registered with one line
Then it passes PLT-100 to PLT-107 without any change to the engine
And other games' tests are unaffected

## PLT-109: Games never import each other
Status: draft
Phase: Phase 2.5
Then the automatic boundary check fails the build if any game imports another game,
or if the engine imports any game (`src/CLAUDE.md`, dependency rules)

## PLT-110: The generic simulated player can play any game
Status: approved, owner, 2026-09-29 (extended testing sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 2.5
Given a registered game, a player's view and a persona (for example "slow grandparent")
When the simulation asks for that player's next move
Then the move is always one of the player's legal moves
And code states the facts in the view first (such as "row 1: 5 of 5 marked"); Jev only chooses

## PLT-111: Simulations work without Jev
Status: approved, owner, 2026-09-29 (extended testing sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 2.5
Given Jev is unavailable, out of its weekly cap, or turned off
When a simulation runs
Then random and scripted players take over, and the run completes with the same summary format

## PLT-112: Jev is never the referee
Status: approved, owner, 2026-09-29 (extended testing sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 2.5
Then only the rules engine decides whether a move is legal or a claim is valid
And when a simulated player expects a different outcome, the disagreement is recorded, not applied

## PLT-113: Jev spending is capped
Status: approved, owner, 2026-09-29 (extended testing sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 2.5
Given the owner has set a weekly cap on Jev calls: **20,000 Jev decisions a week** (owner, 2026-09-29)
When a run reaches the cap
Then no more Jev calls are made that week, and the run finishes with scripted players (owner, 2026-09-29)
