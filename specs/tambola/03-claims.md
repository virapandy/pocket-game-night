# Checking claims

A player shouts a claim. **Paper tickets** (Phase 1a): the anchor checks the ticket in front of the room, and
the host records the result on the host phone (TAM-037); the app does not check the numbers.
**Phone tickets** (Phase 2): the host phone checks the claim, by scanning the player's claim QR (TAM-177) or
by entering the ticket number (TAM-174). The app's check uses **called numbers only**. What a player marked
or forgot to mark does not matter. (Change request of 28 September 2026: `docs/games/tambola/changes-2026-09-28.md`.)

## TAM-020: Early Five is accepted when any 5 numbers on the ticket have been called
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given ticket 3 has 3, 17, 42, 55 and 81 among its numbers
And 3, 17, 42, 55 and 81 have all been called
When the host checks ticket 3 for Early Five
Then the claim is accepted

## TAM-021: Early Five is a bogey with only 4 called numbers
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given only 4 of ticket 3's numbers have been called
When the host checks ticket 3 for Early Five
Then the claim is rejected as a bogey
And the host sees which numbers on the ticket were called, and how many more are needed

## TAM-022: Top Line is accepted when all 5 top-row numbers are called
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given all 5 numbers in ticket 7's top row have been called
When the host checks ticket 7 for Top Line
Then the claim is accepted

## TAM-023: Top Line is a bogey if even one top-row number is missing
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given 4 of the 5 top-row numbers on ticket 7 have been called
When the host checks ticket 7 for Top Line
Then the claim is rejected as a bogey
And the host sees the missing number

## TAM-024: Middle Line and Bottom Line work the same way as Top Line
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given the scenarios TAM-022 and TAM-023
Then they hold in the same way for the middle row (Middle Line) and the bottom row (Bottom Line)

## TAM-025: A full line in a different row does not win the claimed line
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given ticket 7's bottom row is complete but its top row is not
When the host checks ticket 7 for Top Line
Then the claim is rejected as a bogey

## TAM-026: Four Corners means the first and last numbers of the top and bottom rows
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given the first and last numbers of ticket 2's top row and bottom row have been called
When the host checks ticket 2 for Four Corners
Then the claim is accepted
(The corners are the outermost numbers in those rows, not the grid's corner squares, which may be blank.)

## TAM-027: Four Corners is a bogey if one corner is missing
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given 3 of ticket 2's 4 corner numbers have been called
When the host checks ticket 2 for Four Corners
Then the claim is rejected as a bogey

## TAM-028: Full House is accepted only when all 15 numbers are called
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given all 15 numbers on ticket 5 have been called
When the host checks ticket 5 for Full House
Then the claim is accepted

## TAM-029: Full House is a bogey with 14 of 15
Status: draft
Phase: Phase 2 (phone tickets); with paper tickets the anchor judges (TAM-037), and the optional "Check numbers" helper uses the same pattern rules (TAM-139)
Given 14 of ticket 5's 15 numbers have been called
When the host checks ticket 5 for Full House
Then the claim is rejected as a bogey

## TAM-030: A pattern already won cannot be won again
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given Top Line was won by ticket 7 and the host closed Top Line (TAM-145)
When the host checks ticket 9 for Top Line, and ticket 9's top line is complete
Then the claim is refused with "Top Line already won"
And it is not counted as a bogey

## TAM-031: A claim for a pattern not in this game is refused
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the host set up the game without Four Corners
When the host tries to check a ticket for Four Corners
Then the pattern cannot be chosen

## TAM-032: A claim for a ticket not in this game is refused
Status: draft
Phase: Phase 2 (phone tickets)
Given the game has tickets 1 to 10
When the host enters ticket 14
Then the host sees "No ticket 14 in this game", and nothing changes

## TAM-033: The result is announced to the room
Status: draft (reworded by the tester on 2026-09-28 to fit the change request; was approved, owner, 2026-09-28)
Phase: Phase 1a
When a win or a bogey is recorded (paper tickets, TAM-037) or a claim is checked (phone tickets, TAM-174, TAM-177)
Then the host phone shows the result in large text: the player's name (or ticket number), the pattern,
and "✓" with the prize, or "✗ Bogey"
And with phone tickets, or when the "Check numbers" helper was used (TAM-139), the ticket or the numbers
read out are shown with the called numbers highlighted, so the room can check it together
(Before the change request, the ticket was always shown. With paper tickets and no numbers typed, the app
has no ticket to show; the anchor shows the paper ticket instead.)

## TAM-034: For every possible ticket and call history, the check is right
Status: approved, owner, 2026-09-28 (change request: phone tickets only)
Phase: Phase 2 (phone tickets); also holds for the optional "Check numbers" helper (TAM-139)
For thousands of random tickets and random sets of called numbers
Then a claim is accepted if, and only if, the pattern is complete on called numbers

## TAM-035: A number the player forgot to mark still counts
Status: approved, owner, 2026-09-28 (change request: phone tickets only)
Phase: Phase 2 (phone tickets)
Given 56 was called and is on ticket 4, but the player never marked it
When the host checks ticket 4 for a pattern that needs 56
Then 56 counts, because only called numbers matter

## TAM-036: A claim is judged on the numbers called at the moment it is made
Status: approved, owner, 2026-09-28 (change request: phone tickets only)
Phase: Phase 2 (phone tickets)
Given ticket 6's Top Line needs 72, which has not been called
When the host checks ticket 6 for Top Line
Then it is a bogey, even if 72 is called straight afterwards

## TAM-037: Paper tickets: the anchor checks the ticket, the host records the win
Status: approved, owner, 2026-09-28 (change request)
Phase: Phase 1a
Given the game uses paper tickets
When a player shouts a claim and the anchor checks their ticket in front of the room
Then the host taps "Record a win", picks the prize and the winning player (several players for a tie),
and confirms; no numbers are typed
And the app shows "Top Line: ✓ Riya, ₹50" for the room
And if the anchor rules it a bogey, the host can record "Bogey: Riya" (it appears in the summary)

## TAM-038: A late claim shows which number completed the pattern
Status: approved, owner, 2026-09-28 (change request: phone tickets only; with paper tickets the anchor judges)
Phase: Phase 2 (phone tickets)
Given Top Line on a ticket was complete when 45 was called, and 12 has been called since
When the host checks the claim
Then it is treated as late, and the host sees "Top Line was complete at 45"
And with paper tickets the app does not judge lateness: the anchor does, and the host records the result (TAM-037)

## TAM-039: Paper tickets: the host picks who is claiming
Status: approved, owner, 2026-09-28 (change request: stays, as part of "Record a win")
Phase: Phase 1a
Given the game uses paper tickets and the host entered names at setup (or left them as Player 1, Player 2 …)
When the host records a win or a bogey (TAM-037)
Then the host picks the claiming player from that list in one tap (several players for a tie)
And a recorded win credits the prize to that player in the payout summary

## TAM-139: "Check numbers": an optional helper for disputes, off the main path
Status: draft (new, tester, 2026-09-28, from the change request: "the typed-number check may stay as an optional helper")
Phase: Phase 1a
Given the game uses paper tickets and the room disagrees about a claim
When the host opens the menu and taps "Check numbers", picks the pattern and types the numbers read out
Then each shows as called (✓, green) or not called (✗, red)
And the helper says whether those numbers complete the pattern on called numbers (the rules of TAM-020 to TAM-029)
And it records nothing by itself: the anchor decides, and the host still uses "Record a win" or "Bogey" (TAM-037)
And "Check numbers" is not on the calling screen itself, only in the menu
Wrong input: a number outside 1 to 90, or typed twice, is refused with a one-line reason, and too few
numbers for the pattern shows "Top Line needs 5 numbers"
