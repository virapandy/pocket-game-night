# Prize pool

The app calculates the pot, suggests the prize tiers and split, and shows payouts. It **never collects,
holds or sends money**; people settle in cash or UPI outside the app. Examples use ₹; the currency
follows the phone. **Rule for every amount: the tiers always add up to the pot exactly.** The app
rounds each tier to a convenient unit (₹10 by default) and nudges individual tiers up or down as
needed to hit the total.

## TAM-080: The pot is calculated from tickets and contribution
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given 8 players, 2 of whom take 2 tickets, so 10 tickets in play
And the contribution is ₹50 per ticket
Then the pot shows ₹500 (10 tickets × ₹50)
And it updates immediately if the host changes players, tickets or the contribution before prizes are locked

## TAM-081: The app suggests tiers based on the number of tickets in play
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then the suggested tiers and split are:
| Tickets in play | Suggested tiers | Split |
|---|---|---|
| 2–5 | Early Five, Top Line, Full House | 10 / 20 / 70 % |
| 6–11 | Early Five, Top Line, Middle Line, Bottom Line, Full House | 10 / 15 / 15 / 15 / 45 % |
| 12–24 | Early Five, Four Corners, Top, Middle and Bottom Line, Full House | 10 / 10 / 12 / 12 / 12 / 44 % |
| 25 or more | The six above plus Second Full House | 8 / 8 / 10 / 10 / 10 / 32 / 22 % |
And the suggestion updates as players or tickets change, until the prizes are locked
(Fewer tickets means fewer tiers, so a prize still feels like a win. Full House is always the largest.)

## TAM-082: Rounded tiers always add up to the pot exactly
Status: approved, owner, 2026-09-28
Phase: Phase 1a
For every pot size and every set of tiers
Then each tier is a multiple of the rounding unit where possible (₹10 by default)
And individual tiers are nudged up or down so the tiers add up to the pot exactly
And no tier is ever negative, and Full House stays the largest
Example: a ₹530 pot across 10 / 20 / 70 % gives ₹50 / ₹110 / ₹370

## TAM-083: The host can remove a tier, and add it back
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the suggested tiers for 10 tickets
When the host removes Middle Line
Then its share is spread across the remaining tiers in proportion, and the total still equals the pot
When the host adds Middle Line back
Then it returns at its suggested share and the others shrink in proportion
And the host can also add any standard pattern that was not suggested (such as Four Corners)
And Full House cannot be removed, because it ends the game

## TAM-084: The anchor confirms the prizes before the first number
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the suggested tiers are shown
When the anchor changes Top Line to ₹80
Then the other tiers adjust so the total still equals the pot, and the anchor sees each change
And the anchor can fix any tier's amount; the unfixed tiers absorb the difference
When the anchor taps "Confirm prizes"
Then the prizes are locked and the first number can be called

## TAM-085: Prizes cannot change after the first number
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given prizes are locked and a number has been called
Then tier amounts cannot be edited
Except through the late-joiner rule (TAM-067) or the unclaimed-tier rule (TAM-087)

## TAM-086: An accepted claim shows the prize
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When Riya's Top Line claim is accepted
Then the host phone shows "Accepted: ₹60 to Riya" (or to "Ticket 4" if no names were entered)

## TAM-087: A shared prize is split as evenly as possible
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given Top Line is worth ₹50 and three tickets win it on the same number
Then they get ₹17, ₹17 and ₹16 (split to the rupee, adding up to ₹50 exactly)
And the extra rupee goes in ticket-number order

## TAM-088: An unclaimed tier is spread across the won tiers
Status: decided 2026-09-28 (owner: no roll-over; totals always match the pot)
Phase: Phase 1a
Given the game ends with Four Corners (₹50) unclaimed
Then the ₹50 is spread across the tiers that were won in this game, in proportion to their amounts, rounded
And the payouts add up to the pot exactly
And nothing carries over to another game

## TAM-089: The payout summary balances
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When a game ends
Then the summary lists, for each tier, the winner(s) and amount
And, for each person, what they paid and what they won
And total paid out equals the pot, to the rupee

## TAM-090: The app never moves money
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then there is no payment button, payment link, UPI request or wallet anywhere in the game
And a game can be played with "No money": prizes are optional text labels (such as "chocolate"),
the tiers are still suggested by ticket count, and every scenario above works without amounts

## TAM-091: For every pot and every combination of tiers, removals, edits and ties, the total balances
Status: approved, owner, 2026-09-28
Phase: Phase 1a
For thousands of random pots, ticket counts, tier edits, removals, ties and unclaimed tiers
Then every tier amount is zero or more, and the payouts always add up to the pot exactly
