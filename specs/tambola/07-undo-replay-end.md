# Undo, replay and the end of the game

## TAM-070: The host can undo a wrongly entered claim
Status: draft
Phase: Phase 1a
Given the host entered ticket 8 for Top Line by mistake, and it was accepted
When the host taps "Undo" and confirms
Then the claim is removed, Top Line is available again, and the rest of the game is unchanged

## TAM-071: A called number cannot be un-called
Status: draft
Phase: Phase 1a
Given 45 was called more than 5 seconds ago
Then there is no way to take 45 back
(The room has already heard it. Within 5 seconds, a mis-tap can be undone: TAM-119.)

## TAM-072: Undo after later moves keeps those later moves
Status: draft
Phase: Phase 1a
Given the host accepted a wrong claim, then 3 more numbers were called
When the host undoes the wrong claim
Then the 3 later numbers stay called, in the same order

## TAM-073: Any game can be replayed exactly
Status: draft
Phase: Phase 1a
For every game, given its seeds and its list of moves
When it is replayed
Then every number, claim and result comes out exactly the same

## TAM-074: A game that ever fails is kept forever
Status: draft
Phase: Phase 1a
Whenever any test or simulation finds a problem
Then that game's seeds and moves are saved as a permanent test

## TAM-075: The game ends at Full House
Status: draft
Phase: Phase 1a
When the last allowed Full House is accepted
Then the game ends and the summary shows every pattern and who won it

## TAM-076: When all 90 are called, every ticket is complete
Status: draft
Phase: Phase 1a
Given nobody has claimed Full House
When the 90th number is called
Then the host is told all numbers are out and every ticket is now a Full House
And the host can check the remaining claims, then end the game

## TAM-077: Every game ends
Status: draft
Phase: Phase 1a
For thousands of simulated games, with players who claim early, late, falsely or never
Then every game reaches an end, and no game gets stuck

## TAM-078: The end-of-game summary is correct
Status: draft
Phase: Phase 1a
When a game ends
Then the summary lists each pattern with its winning ticket or player, bogeys made,
and how many numbers were called
