# Calling numbers

The host phone draws numbers. By default the anchor reads each one aloud, with its rhyme.

## TAM-010: The host draws the next number
Status: draft
Phase: Phase 1
Given a game has started
When the host taps "Next number"
Then one new number between 1 and 90 is drawn
And it is shown large on the host phone with its rhyme for the anchor to read

## TAM-011: No number is called twice
Status: draft
Phase: Phase 1
For every game, however long
Then no number is drawn more than once

## TAM-012: At most 90 numbers are called
Status: draft
Phase: Phase 1
Given all 90 numbers have been called
When the host taps "Next number"
Then nothing new is drawn
And the host sees "All 90 numbers called"

## TAM-013: Every number from 1 to 90 can come up
Status: draft
Phase: Phase 1
Over 90,000 simulated games from different draw seeds
Then every game played to the end draws all 90 numbers
And each number comes first in about 1 game in 90, with no number standing out
(a chi-square test at the 0.1% level; a failure means the draw is not fair)

## TAM-014: The same draw seed always gives the same order
Status: draft
Phase: Phase 1
Given a draw seed
When a game is replayed from it
Then the numbers come out in exactly the same order

## TAM-015: A number without a rhyme still gets called
Status: draft
Phase: Phase 1
Given the rhyme pack has no rhyme for 67
When 67 is drawn
Then the host phone shows "67" clearly, with no error and no blank space

## TAM-016: The host can see what has been called
Status: draft
Phase: Phase 1
Given 23 numbers have been called
When the host opens the board
Then the 1–90 board shows those 23 numbers marked
And the last 5 calls are shown in order, most recent first (the room view shows 3, TAM-107)

## TAM-017: The anchor can repeat the last number
Status: draft
Phase: Phase 1
Given 45 was just called
When a player asks for a repeat and the host taps "Repeat"
Then 45 and its rhyme are shown again
And no new number is drawn
