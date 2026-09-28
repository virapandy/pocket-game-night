# Calling numbers

The host phone draws numbers. By default the anchor reads each one aloud, with its rhyme.

## TAM-010: The host draws the next number
Status: draft
Given a game has started
When the host taps "Next number"
Then one new number between 1 and 90 is drawn
And it is shown large on the host phone with its rhyme for the anchor to read

## TAM-011: No number is called twice
Status: draft
For every game, however long
Then no number is drawn more than once

## TAM-012: At most 90 numbers are called
Status: draft
Given all 90 numbers have been called
When the host taps "Next number"
Then nothing new is drawn
And the host sees "All 90 numbers called"

## TAM-013: Every number from 1 to 90 can come up
Status: draft
Over many games
Then every number from 1 to 90 is drawn at some point
And no number is drawn much more often than others in first place

## TAM-014: The same draw seed always gives the same order
Status: draft
Given a draw seed
When a game is replayed from it
Then the numbers come out in exactly the same order

## TAM-015: A number without a rhyme still gets called
Status: draft
Given the rhyme pack has no rhyme for 67
When 67 is drawn
Then the host phone shows "67" clearly, with no error and no blank space

## TAM-016: The host can see what has been called
Status: draft
Given 23 numbers have been called
When the host opens the board
Then the 1–90 board shows those 23 numbers marked
And the last few calls are shown in order, most recent first

## TAM-017: The anchor can repeat the last number
Status: draft
Given 45 was just called
When a player asks for a repeat and the host taps "Repeat"
Then 45 and its rhyme are shown again
And no new number is drawn
