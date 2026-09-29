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
Status: approved, owner, 2026-09-28 (change request: now the special case of TAM-088)
Phase: Phase 1a
Given a game with money where nobody has won any prize
When the host ends the game (TAM-066)
Then this is the special case of TAM-088: nobody won, so all the money goes back
And nobody is paid a prize, and the summary shows each player's contribution to hand back, as with Discard (TAM-140)
(Equally per ticket means each player gets back exactly what they paid.)

## TAM-145: Closing a prize tier is a manual step, and so is ending the game
Status: approved, owner, 2026-09-30 (docs/games/tambola/changes-2026-09-30-playtest.md: "Next number waits" replaced by "the main button becomes 'Close Top Line'", TAM-198); was approved, owner, 2026-09-29 (added on the owner's decision of 2026-09-29, docs/decisions.md: the result goes away by itself after closing); was approved, owner, 2026-09-28 (owner: the win and the end of the game are manual; the host can add another winner, for every tier)
Phase: Phase 1a
Given Top Line has just been accepted for Riya
Then Top Line stays open, and the host sees "Add another winner" and "Close Top Line"
And the main button becomes "Close Top Line" until the host closes it (TAM-198); the Close on the prize chip may stay as a second way
When the host checks Asha's Top Line claim before closing, and it completed on the same number
Then it is accepted and the prize is shared (TAM-041, TAM-087)
When the host taps "Close Top Line"
Then Top Line is closed: a later Top Line claim is refused with "Top Line already won" (TAM-030), and "Next number" works again
And after the host closes a tier, its result goes away by itself; no Done is needed
And the same holds for every tier, Full House included: the last Full House is closed by hand, then the host ends the game (TAM-075)
(A claim that completed on an earlier number is still late, TAM-043. Closing a tier nobody won does nothing,
so undoing a wrong claim still reopens its tier, TAM-070.)

## TAM-198: After a win, closing the prize is the main action
Status: approved, owner, 2026-09-30 (docs/games/tambola/changes-2026-09-30-playtest.md section 1, from the family play-test)
Phase: Phase 1a
Given a win for Top Line has just been recorded (TAM-037)
Then the big button at the bottom, where "Next number" is, becomes "Close Top Line": filled, enabled,
the same size and place (TAM-100)
And "Add another winner" sits just above it, as a secondary button (TAM-145)
And the rest of the calling screen is dimmed, except the win card, the number and these two buttons
When the host taps anywhere in the dimmed area
Then nothing happens there, and the "Close Top Line" button pulses once (never a repeating blink or flash)
When the host taps "Close Top Line"
Then the prize closes, the screen is no longer dimmed, and the button is "Next number" again
And "Undo win" stays available on the win card until the prize is closed (TAM-070)
