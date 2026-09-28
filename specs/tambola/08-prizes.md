# Prize pool

The app calculates the pot, suggests a split, and shows payouts. It **never collects, holds or sends
money**; people settle in cash or UPI outside the app. Examples use ₹; the currency follows the phone.

## TAM-080: The pot is calculated from tickets and contribution
Status: draft
Given 8 players, 2 of whom take 2 tickets, so 10 tickets in play
And the contribution is ₹50 per ticket
Then the pot shows ₹500 (10 tickets × ₹50)
And it updates immediately if the host changes players, tickets or the contribution before prizes are locked

## TAM-081: The app suggests a split across the patterns in play
Status: draft
Given a ₹500 pot and the six default patterns
Then the app suggests Early Five 10% (₹50), Four Corners 10% (₹50), each Line 12% (₹60) and Full House 44% (₹220)
And with fewer patterns, the suggestion rescales over the remaining ones, with Full House always the largest

## TAM-082: Suggested amounts are rounded, and always add up to the pot
Status: draft
For every pot size and set of patterns
Then each tier except Full House is rounded down to the rounding unit (₹10 by default)
And the remainder goes to Full House
And the tiers add up to the pot exactly

## TAM-083: The anchor confirms the prizes before the first number
Status: draft
Given the suggested split is shown
When the anchor changes Top Line to ₹80
Then the app shows "₹20 over the pot" (or under) and cannot lock the prizes until it balances
And the anchor can choose "adjust Full House" to balance it in one tap
When the anchor taps "Confirm prizes"
Then the prizes are locked and the first number can be called

## TAM-084: Prizes cannot change after the first number
Status: draft
Given prizes are locked and a number has been called
Then the tier amounts cannot be edited
Except by ending the game, or by the owner's late-joiner rule (TAM-067)

## TAM-085: An accepted claim shows the prize
Status: draft
When Riya's Top Line claim is accepted
Then the host phone shows "Accepted: ₹60 to Riya" (or to "Ticket 4" if no names were entered)

## TAM-086: A shared prize is split equally
Status: draft
Given Top Line is worth ₹60 and two tickets win it on the same number
Then each gets ₹30
And if the amount does not divide evenly (e.g. ₹50 among 3), each gets the amount rounded down
to the rounding unit, and the remainder follows the owner's rule (TAM-087)

## TAM-087: Unclaimed tiers and remainders follow the owner's rule
Status: waiting for owner decision
A tier can be left unclaimed (for example, nobody claimed Four Corners before Full House ended the game).
Options:
- A. Added to the Full House prize
- B. Shared equally among all the game's winners
- C. Returned to the players (shown as a refund per ticket)
- D. Carried over to the next game's pot (with Play again)
Scenario once chosen:
When the game ends with an unclaimed tier or remainder
Then the payout summary applies the chosen rule, and the total still equals the pot

## TAM-088: The payout summary balances
Status: draft
When a game ends
Then the summary lists, for each tier, the winner(s) and amount
And, for each person, what they paid and what they won
And total paid out plus any carried or refunded amount equals the pot, to the rupee

## TAM-089: The app never moves money
Status: draft
Then there is no payment button, payment link, UPI request or wallet anywhere in the game
And a game can be played with "No money": prizes are optional text labels (such as "chocolate")
and every scenario above works without amounts
