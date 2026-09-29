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

## TAM-082: Rounded tiers always add up to the pot exactly, and equal shares get equal amounts
Status: approved, owner, 2026-09-29 (reworded on the owner's tiny-pot decision of 2026-09-29, docs/decisions.md: when rounding to the unit would leave Full House smaller than another prize, round to the nearest ₹1 instead; answers docs/test-questions.md 2026-09-29); was approved, owner, 2026-09-29 (every tier except Full House rounds to the nearest unit, an exact half rounds down; Full House takes the rest); was approved, owner, 2026-09-28 (change request: equal shares, rounding differences to Full House first)
Phase: Phase 1a
For every pot size and every set of tiers
Then every tier except Full House is its exact share rounded to the nearest rounding unit (₹10 by default)
And an exact half rounds down (a ₹45 share becomes ₹40, never ₹50)
And Full House takes whatever is left, so the tiers add up to the pot exactly
And tiers with the same share always get the same amount
And no tier is ever negative, and Full House stays the largest
Except for tiny pots: when rounding to the unit would leave Full House smaller than another tier (or below ₹0),
every tier except Full House is instead its exact share rounded to the nearest ₹1 (an exact half rounds down),
and Full House takes whatever is left
And only if even that would leave Full House smaller than another tier are the tiers other than Full House
lowered ₹1 at a time (tiers with the same share lowered together, so they stay equal) until Full House is the largest
Example: a ₹530 pot across 10 / 20 / 70 % gives ₹50 / ₹110 / ₹370 (₹53 → ₹50, ₹106 → ₹110, Full House the rest)
Example: 6 tickets at ₹50 (a ₹300 pot) across 10 / 15 / 15 / 15 / 45 % gives the three Lines the same
amount (never ₹50, ₹40, ₹40, as the first release did), and Full House takes the difference:
₹30 / ₹40 / ₹40 / ₹40 / ₹150 (₹30 stays ₹30; ₹45 is an exact half and rounds down to ₹40)
Example: 6 tickets at ₹6 (a ₹36 pot) across 10 / 15 / 15 / 15 / 45 %: rounding to ₹10 would give
₹0 / ₹10 / ₹10 / ₹10 and leave Full House only ₹6, so the tiers round to ₹1 instead: ₹4 / ₹5 / ₹5 / ₹5 / ₹17
(₹3.60 → ₹4, ₹5.40 → ₹5), never ₹0 / ₹0 / ₹0 / ₹0 / ₹36
Example: 7 tickets at ₹5 (a ₹35 pot), same split: ₹3 / ₹5 / ₹5 / ₹5 / ₹17 (₹3.50 is an exact half and rounds
down to ₹3; ₹5.25 → ₹5)

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

## TAM-086: A win shows the prize
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (reworded by the tester on 2026-09-28 to match the wording in TAM-037 and TAM-177; was approved, owner, 2026-09-28)
Phase: Phase 1a
When a Top Line win is recorded for Riya (paper tickets, TAM-037)
Then the host phone shows "Top Line: ✓ Riya, ₹60" (or "Player 4" if no name was entered)
And with phone tickets (Phase 2) the verdict reads "Top Line: ✓ Accepted, ₹60 to Riya" (TAM-174, TAM-177)
(Before: "Accepted: ₹60 to Riya". With "No money", the prize label is shown instead of an amount, TAM-090.)

## TAM-087: A shared prize is split as evenly as possible
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given Top Line is worth ₹50 and three tickets win it on the same number
Then they get ₹17, ₹17 and ₹16 (split to the rupee, adding up to ₹50 exactly)
And the extra rupee goes in ticket-number order

## TAM-088: Money from prizes nobody won goes back to the players
Status: approved, owner, 2026-09-28 (change request; replaces "an unclaimed tier is spread across the won tiers". No roll-over still holds)
Phase: Phase 1a
Given the game ends with some tiers unclaimed (for example only Early Five was won)
Then the money of every unclaimed tier is handed back to the players, equally per ticket
(a player with 2 tickets gets twice as much back as a player with 1), split to the rupee
And the winners of claimed tiers get exactly their tier amounts, nothing more
And payouts plus money handed back add up to the pot exactly
And the payout summary shows, per person: paid, won, handed back, and the net amount
And nothing carries over to another game
(Per ticket confirmed by the owner on 2026-09-28.)

## TAM-089: The payout summary says what the host hands each person
Status: approved, owner, 2026-09-29 (docs/games/tambola/changes-2026-09-29-money-and-1b.md: the host is the bank for each game; was "The payout summary balances", approved, owner, 2026-09-28)
Phase: Phase 1a
When a game ends
Then the summary lists each tier with its winner(s) and amount (or "not won") (TAM-088)
And, for each person: paid, prize won, money handed back, and "Host gives Riya ₹77" (prize plus money back)
And the total the host gives out equals the pot, to the rupee
(Player-to-player hand-overs appear only in the session's optional Settle up, PLT-028.)

## TAM-090: The app never moves money
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then there is no payment button, payment link, UPI request or wallet anywhere in the game
And a game can be played with "No money": prizes are optional text labels (such as "chocolate"),
the tiers are still suggested by ticket count, and every scenario above works without amounts

## TAM-091: For every pot and every combination of tiers, removals, edits and ties, the total balances
Status: approved, owner, 2026-09-28 (wording aligned with the new TAM-088, as the change request asked)
Phase: Phase 1a
For thousands of random pots, ticket counts, tier edits, removals, ties and unclaimed tiers
Then every tier amount is zero or more, and prizes paid out plus money handed back always add up to the pot exactly
And tiers with the same share always have the same amount (TAM-082)

## TAM-092: Tiers with the same share stay equal after the anchor's edits and removals
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28; follows from TAM-082)
Phase: Phase 1a
Given 10 tickets with Top, Middle and Bottom Line at the same share
When the host removes Early Five (TAM-083), or the anchor fixes Full House at a new amount (TAM-084)
Then the three Lines still have the same amount as each other, and the total still equals the pot
When the anchor fixes Top Line itself at ₹80
Then only Top Line differs; Middle and Bottom Line stay equal to each other
Edge: if the pot cannot be split so that equal shares are equal (for example a ₹20 pot), Full House takes
the difference and no tier goes below ₹0

## TAM-093: Money handed back is split to the rupee, fairly and in a fixed order
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28; follows from TAM-088)
Phase: Phase 1a
Given ₹50 of unclaimed prizes is handed back across 3 tickets held by Riya, Asha and Dad
Then they get ₹17, ₹17 and ₹16, adding up to ₹50 exactly
And the extra rupees go in the order the players were listed at setup (like a shared prize, TAM-087)
And a late joiner's ticket (TAM-067) counts like every other ticket
And with a game played for "No money" (TAM-090), unclaimed prizes are simply listed as "not won", with nothing handed back
And a ticket that is out after a bogey (TAM-044) still gets its share, because its contribution stayed in the pot.

## TAM-197: From the payouts to the session tally in one tap
Status: approved, owner, 2026-09-29 (docs/games/tambola/changes-2026-09-29-money-and-1b.md, 1b review finding 3)
Phase: Phase 1b
When a game ends and the payout summary shows
Then "Play again" and "Session tally" are fixed at the bottom of the screen (TAM-181)
And "Session tally" opens this game's session tally (PLT-017)
