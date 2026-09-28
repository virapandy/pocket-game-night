# Secrets and seeds

Nobody should be able to see another player's ticket or the upcoming numbers, even with a curious phone.

## TAM-050: A player sees only their own ticket
Status: draft
Given Riya holds ticket 3
When Riya's view of the game is shown
Then it contains ticket 3 and the numbers called so far
And it contains no other ticket's numbers

## TAM-051: A player never sees upcoming numbers
Status: draft
For every point in every game
Then no player's view contains any number that has not been called yet

## TAM-052: The draw seed never leaves the host phone
Status: draft
For every QR code, share link, printed ticket and player view
Then none of them contains the draw seed, or anything the draw order can be worked out from

## TAM-053: A player's QR code carries only their own ticket
Status: draft (Phase 2: offline QR tickets)
When the host shows the join QR for ticket 3
Then the QR holds ticket 3's seed and number and the game ID, and nothing else

## TAM-054: One ticket's seed reveals nothing about other tickets
Status: draft (Phase 2)
Given a player knows ticket 3's seed
Then they cannot rebuild any other ticket or the draw order from it

## TAM-055: A ticket rebuilt on a player's phone matches the host's copy
Status: draft (Phase 2)
Given a player scanned the QR for ticket 3, with no internet
When their phone builds the ticket
Then it is identical to ticket 3 on the host phone

## TAM-056: The host can see all tickets
Status: draft
When the host checks a claim
Then the host phone can show any ticket in the game
(Only the host has this view.)

## TAM-057: A phone ticket works with no internet
Status: draft (Phase 2)
Given a player opened the app link once before, and now has no internet
When they scan their ticket QR
Then their ticket appears and they can mark it

## TAM-058: Paper and phone tickets can be mixed in one game
Status: draft (Phase 2)
Given 6 players use phone tickets and 2 use paper tickets from a book
When claims are made
Then phone-ticket claims are checked by ticket number, paper-ticket claims by the numbers read out (TAM-037)
And a player can switch from phone to paper mid-game
