# Tambola lifecycle: money when games end, are abandoned, or chain into a night

The shared lifecycle rules are in `specs/platform/01-lifecycle.md` (PLT-001 to PLT-015).
These scenarios cover what is special to Tambola: the prize pool.

## TAM-140: Ending versus discarding a game with money
Status: decided 2026-09-28 (owner)
Phase: Phase 1
When the host taps "End game" (TAM-066)
Then prizes already won are paid, and unclaimed tiers follow TAM-088
When the host taps "Discard game" instead (PLT-005)
Then the game is void: nobody is paid, and the summary shows each player's contribution to hand back
And if prizes had already been accepted, the confirmation says so: "2 prizes were already won. Discard anyway?"

## TAM-141: A game shows only its own winnings; the tally is separate
Status: decided 2026-09-28 (owner)
Phase: Phase 1
When a Tambola game ends
Then its summary shows only that game: what each person paid and won
And totals across games live in the session tally (PLT-017 to PLT-019, Phase 1b)

## TAM-142: A roll-over never gets lost
Status: draft (recommended)
Phase: Phase 1
Given an unclaimed tier rolled over into the next game (TAM-088)
When that next game is discarded
Then the rolled-over amount goes back to the previous game, spread across its won tiers (the end-of-session rule in TAM-088)
And the night's totals still balance

## TAM-143: What a finished Tambola game keeps
Status: draft
Phase: Phase 1
Then each finished or abandoned game keeps: date and time, ticket mode, players and tickets,
contribution and pot, tiers, every call in order, every claim and verdict, bogeys, and payouts
And that record is enough to replay the game exactly (TAM-073) and to settle a dispute ("show every call")
