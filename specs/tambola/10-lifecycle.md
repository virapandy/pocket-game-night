# Tambola lifecycle: money when games end or are abandoned

The shared lifecycle rules are in `specs/platform/01-lifecycle.md` (PLT-001 to PLT-021).
These scenarios cover what is special to Tambola: the prize pool.

## TAM-140: Ending versus discarding a game with money
Status: approved, owner, 2026-09-28 (decided: owner)
Phase: Phase 1a
When the host taps "End game" (TAM-066)
Then prizes already won are paid, and unclaimed tiers follow TAM-088
When the host taps "Discard game" instead (PLT-005)
Then the game is void: nobody is paid, and the summary shows each player's contribution to hand back
And if prizes had already been accepted, the confirmation says so: "2 prizes were already won. Discard anyway?"

## TAM-141: A game shows only its own winnings; the tally is separate
Status: approved, owner, 2026-09-28 (decided: owner)
Phase: Phase 1a
When a Tambola game ends
Then its summary shows only that game: what each person paid and won
And totals across games live in the session tally (PLT-017 to PLT-019, Phase 1b)

## TAM-142: Retired
Status: retired 2026-09-28 (roll-over dropped; unclaimed tiers stay within their own game, TAM-088)

## TAM-143: What a finished Tambola game keeps
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then each finished or abandoned game keeps: date and time, ticket mode, players and tickets,
contribution and pot, tiers, every call in order, every claim and verdict, bogeys, and payouts
And that record is enough to replay the game exactly (TAM-073) and to settle a dispute ("show every call")

## TAM-144: A game that ends with no prize won hands every contribution back
Status: draft (found while writing Phase 1a tests; needs the owner's decision)
Phase: Phase 1a
Given a game with money where nobody has won any prize
When the host ends the game (TAM-066)
Then nobody is paid a prize, and the summary shows each player's contribution to hand back, as with Discard (TAM-140)
(Otherwise "total paid out equals the pot" (TAM-089) cannot hold. The tests assume this until the owner decides.)

## TAM-145: Two players complete Full House on the same number
Status: draft (found while writing Phase 1a tests; needs the owner's decision)
Phase: Phase 1a
Given ties on the same number share the prize (TAM-041)
And the game ends when the last Full House tier is accepted (TAM-075)
Then a second Full House on that same number cannot be entered, because the game has already ended
Options:
- A. Keep it simple: the first Full House entered ends the game (the tests assume this today)
- B. After a Full House is accepted, the host sees "Any more Full Houses on this number?" and can check more before the game ends (matches the tie rule)
