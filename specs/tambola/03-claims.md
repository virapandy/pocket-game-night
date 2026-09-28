# Checking claims

A player shouts a claim. The host enters the ticket number and the pattern, and the host phone checks it.
The check uses **called numbers only**. What a player marked or forgot to mark does not matter.

## TAM-020: Early Five is accepted when any 5 numbers on the ticket have been called
Status: draft
Given ticket 3 has 3, 17, 42, 55 and 81 among its numbers
And 3, 17, 42, 55 and 81 have all been called
When the host checks ticket 3 for Early Five
Then the claim is accepted

## TAM-021: Early Five is a bogey with only 4 called numbers
Status: draft
Given only 4 of ticket 3's numbers have been called
When the host checks ticket 3 for Early Five
Then the claim is rejected as a bogey
And the host sees which numbers on the ticket were called, and how many more are needed

## TAM-022: Top Line is accepted when all 5 top-row numbers are called
Status: draft
Given all 5 numbers in ticket 7's top row have been called
When the host checks ticket 7 for Top Line
Then the claim is accepted

## TAM-023: Top Line is a bogey if even one top-row number is missing
Status: draft
Given 4 of the 5 top-row numbers on ticket 7 have been called
When the host checks ticket 7 for Top Line
Then the claim is rejected as a bogey
And the host sees the missing number

## TAM-024: Middle Line and Bottom Line work the same way as Top Line
Status: draft
Given the scenarios TAM-022 and TAM-023
Then they hold in the same way for the middle row (Middle Line) and the bottom row (Bottom Line)

## TAM-025: A full line in a different row does not win the claimed line
Status: draft
Given ticket 7's bottom row is complete but its top row is not
When the host checks ticket 7 for Top Line
Then the claim is rejected as a bogey

## TAM-026: Four Corners means the first and last numbers of the top and bottom rows
Status: draft
Given the first and last numbers of ticket 2's top row and bottom row have been called
When the host checks ticket 2 for Four Corners
Then the claim is accepted
(The corners are the outermost numbers in those rows, not the grid's corner squares, which may be blank.)

## TAM-027: Four Corners is a bogey if one corner is missing
Status: draft
Given 3 of ticket 2's 4 corner numbers have been called
When the host checks ticket 2 for Four Corners
Then the claim is rejected as a bogey

## TAM-028: Full House is accepted only when all 15 numbers are called
Status: draft
Given all 15 numbers on ticket 5 have been called
When the host checks ticket 5 for Full House
Then the claim is accepted

## TAM-029: Full House is a bogey with 14 of 15
Status: draft
Given 14 of ticket 5's 15 numbers have been called
When the host checks ticket 5 for Full House
Then the claim is rejected as a bogey

## TAM-030: A pattern already won cannot be won again
Status: draft
Given Top Line was won by ticket 7 on an earlier number
When the host checks ticket 9 for Top Line, and ticket 9's top line is complete
Then the claim is refused with "Top Line already won"
And it is not counted as a bogey

## TAM-031: A claim for a pattern not in this game is refused
Status: draft
Given the host set up the game without Four Corners
When the host tries to check a ticket for Four Corners
Then the pattern cannot be chosen

## TAM-032: A claim for a ticket not in this game is refused
Status: draft
Given the game has tickets 1 to 10
When the host enters ticket 14
Then the host sees "No ticket 14 in this game", and nothing changes

## TAM-033: The result is announced to the room
Status: draft
When a claim is checked
Then the host phone shows the result in large text: the ticket number or player name, the pattern,
and "Accepted" or "Bogey"
And the ticket is shown with the called numbers highlighted, so the room can check it together

## TAM-034: For every possible ticket and call history, the check is right
Status: draft
For thousands of random tickets and random sets of called numbers
Then a claim is accepted if, and only if, the pattern is complete on called numbers

## TAM-035: A number the player forgot to mark still counts
Status: draft
Given 56 was called and is on ticket 4, but the player never marked it
When the host checks ticket 4 for a pattern that needs 56
Then 56 counts, because only called numbers matter

## TAM-036: A claim is judged on the numbers called at the moment it is made
Status: draft
Given ticket 6's Top Line needs 72, which has not been called
When the host checks ticket 6 for Top Line
Then it is a bogey, even if 72 is called straight afterwards
