# Secrets and seeds

Nobody should be able to see another player's ticket or the upcoming numbers, even with a curious phone.

## TAM-050: A player sees only their own ticket
Status: draft
Phase: Phase 2 (phone tickets)
Given Riya holds ticket 3
When Riya's view of the game is shown
Then it contains ticket 3 and the numbers called so far
And it contains no other ticket's numbers

## TAM-051: A player never sees upcoming numbers
Status: draft
Phase: Phase 2 (phone tickets)
For every point in every game
Then no player's view contains any number that has not been called yet

## TAM-052: The draw seed never leaves the host phone
Status: approved, owner, 2026-09-28
Phase: Phase 1a
For every QR code, share link, printed ticket and player view
Then none of them contains the draw seed, or anything the draw order can be worked out from

## TAM-053: A player's QR code carries only their own ticket
Status: draft
Phase: Phase 2 (phone tickets)
When the host shows the join QR for ticket 3
Then the QR holds ticket 3's 15 numbers and layout, its ticket number and the game code, and nothing else
And no seed of any kind
(A seed would let a curious phone rebuild the other tickets on the same sheet of 6.)

## TAM-054: One ticket reveals nothing useful about other tickets or the draw
Status: draft
Phase: Phase 2 (phone tickets)
Given a player has ticket 3's QR or code
Then they cannot work out any other ticket's numbers or the draw order from it
(They can only tell that the other 5 tickets on their sheet don't contain their own numbers, which gives no advantage.)

## TAM-055: A ticket on a player's phone matches the host's copy
Status: draft
Phase: Phase 2 (phone tickets)
Given a player scanned the QR for ticket 3, with no internet
When their phone shows the ticket
Then it is identical to ticket 3 on the host phone

## TAM-056: The host can see all tickets
Status: draft
Phase: Phase 2 (phone tickets)
When the host checks a claim
Then the host phone can show any ticket in the game
(Only the host has this view.)

## TAM-057: A phone ticket works with no internet
Status: draft
Phase: Phase 2 (phone tickets)
Given a player opened the app link once before, and now has no internet
When they scan their ticket QR
Then their ticket appears and they can mark it
And nothing is fetched from a server: everything the ticket needs is inside the QR link

## TAM-058: Paper and phone tickets can be mixed in one game
Status: draft
Phase: Phase 2 (phone tickets)
Given 6 players use phone tickets and 2 use paper tickets from a book
When claims are made
Then phone-ticket claims are checked by ticket number, paper-ticket claims by the numbers read out (TAM-037)
And a player can switch from phone to paper mid-game

## TAM-131: Players mark their own phone ticket, and can unmark
Status: draft
Phase: Phase 2 (phone tickets)
When a player taps a number on their phone ticket
Then it shows as marked (fill and mark); tapping again unmarks it; nothing asks for confirmation
And marks stay on the player's phone and never affect claim checks (TAM-035)

## TAM-132: The host sees which tickets have been handed out
Status: draft
Phase: Phase 2 (phone tickets)
While handing out phone tickets
When a player has scanned and the host taps "Next ticket"
Then the host screen shows "7 of 10 handed out" and which tickets are still waiting
(With no internet, the host phone cannot know that a scan worked, so the host confirms each hand-out.)

## TAM-133: A player's phone can show the last calls
Status: draft
Phase: Phase 2 (phone tickets)
Given a player cannot see the host screen
When they open "Last calls" on their phone ticket
Then the last 3 calls are shown, and nothing that has not been called

## TAM-170: A phone ticket shows its game
Status: draft
Phase: Phase 2 (phone tickets)
When a player's ticket is shown on their phone
Then it shows the ticket number, the game code and start time, and the prize tiers for that game
And the host screen shows the same game code, so a ticket from an earlier game is easy to spot

## TAM-171: A phone ticket survives locks and reloads
Status: draft
Phase: Phase 2 (phone tickets)
Given a player's phone shows ticket 3 with 9 numbers marked
When the phone locks, the browser reloads, or the player switches apps and comes back
Then ticket 3 is still there with the same 9 marks
And it stays until the player scans a ticket for a new game

## TAM-172: Each phone ticket is handed to a named player
Status: approved, owner, 2026-09-28
Phase: Phase 2 (phone tickets)
Given the players and their tickets per player were set at setup (PLT-024, TAM-045)
When the host hands out tickets
Then the host screen shows the next ticket already assigned: "Ticket 3 → Riya (1 of 2)"
And the host can pick a different player from the list before showing the QR
And the QR carries that player's name, so their phone shows "Riya, ticket 3"
And the host phone keeps the record of which ticket belongs to whom; it is the only record

## TAM-173: A player with several tickets keeps them on one phone
Status: approved, owner, 2026-09-28
Phase: Phase 2 (phone tickets)
Given Riya has 2 tickets
When she scans both QR codes on her phone
Then both tickets are on her phone, one above the other (or one tap apart), each with its own marks

## TAM-174: A phone-ticket claim credits the ticket's owner automatically
Status: approved, owner, 2026-09-28
Phase: Phase 2 (phone tickets)
When the host checks a claim by entering ticket 3
Then the verdict shows the owner ("Top Line: ✓ Accepted, ₹60 to Riya")
And the prize is credited to Riya, with no need to pick the player (unlike paper tickets, TAM-039)

## TAM-175: The host can correct who holds a ticket
Status: approved, owner, 2026-09-28
Phase: Phase 2 (phone tickets)
Given ticket 3 was assigned to Riya by mistake and Arjun has it
When the host changes ticket 3's owner to Arjun
Then any prize ticket 3 wins from then on, and any it already won, is credited to Arjun
And the change is recorded in the game's history (so a replay shows it)
And Arjun's phone still shows "Riya" on the ticket until he rescans; that label is only a display

## TAM-176: Tickets that were never handed out are not in the game
Status: approved, owner, 2026-09-28
Phase: Phase 2 (phone tickets)
Given the host made a sheet of 6 but handed out only 4 tickets
Then the other 2 tickets are not in play, count for nothing in the pot, and any claim on them is refused (TAM-032)
