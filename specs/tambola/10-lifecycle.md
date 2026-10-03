# Tambola lifecycle: money when games end or are abandoned

The shared lifecycle rules are in `specs/platform/01-lifecycle.md` (PLT-001 to PLT-021).
These scenarios cover what is special to Tambola: the prize pool.

## TAM-140: Ending versus discarding a game with money
Status: approved, owner, 2026-10-03 (the "Game over" banner, UX list row 22, docs/games/tambola/ux-review-2026-10-03-after-the-game.md item 3); was approved, owner, 2026-09-28 (decided: owner)
Phase: Phase 1a
When the host taps "End game" (TAM-066)
Then prizes already won are paid, and unclaimed tiers follow TAM-088
When the host taps "Discard game" instead (PLT-005)
Then the game is void: nobody is paid, and the summary shows each player's contribution to hand back
And if prizes had already been accepted, the confirmation says so: "2 prizes were already won. Discard anyway?"
And (UX list row 22, approved, owner, 2026-10-03) the host's summary starts with a banner at the top, with the payouts
still visible below it:
- after End: "✓ Game over · Players: phones away. Tap Done with this game." (with paper tickets only, nobody has a
  phone ticket to put away: "✓ Game over"; the tester's reading of the row, C2, noted in reports/latest.md)
- after Discard: "Game over · Discarded · Nobody wins. Everyone gets their contribution back."
And the banner stays until the host leaves the screen; nothing timed takes it away

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
Status: approved, owner, 2026-10-03 (UX list row 6, docs/handover.md 2b; docs/games/tambola/ux-review-2026-10-02-full.md: "Add another winner" in phone-ticket games too); approved, owner, 2026-09-30 (docs/decisions.md 2026-09-30: the Close on the prize chip stays and still works while the screen is dimmed); approved, owner, 2026-09-30 (docs/games/tambola/changes-2026-09-30-playtest.md: "Next number waits" replaced by "the main button becomes 'Close Top Line'", TAM-198); was approved, owner, 2026-09-29 (added on the owner's decision of 2026-09-29, docs/decisions.md: the result goes away by itself after closing); was approved, owner, 2026-09-28 (owner: the win and the end of the game are manual; the host can add another winner, for every tier)
Phase: Phase 1a
Given Top Line has just been accepted for Riya
Then Top Line stays open, and the host sees "Add another winner" and "Close Top Line"
And the main button becomes "Close Top Line" until the host closes it (TAM-198); the Close on the prize chip is a second way, and works too
When the host checks Asha's Top Line claim before closing, and it completed on the same number
Then it is accepted and the prize is shared (TAM-041, TAM-087)
When the host taps "Close Top Line"
Then Top Line is closed: a later Top Line claim is refused with "Top Line already won" (TAM-030), and "Next number" works again
And after the host closes a tier, its result goes away by itself; no Done is needed
And the same holds for every tier, Full House included: the last Full House is closed by hand, then the host ends the game (TAM-075)
Phone-ticket games (UX list row 6, approved, owner, 2026-10-03)
Given a phone-ticket game in which Kabir plays on paper (TAM-058)
And Riya's Top Line claim has just been accepted from her claim QR (TAM-177)
Then "Add another winner" is shown and works, exactly as in a paper game, while Top Line waits to be closed
When the host taps it
Then the host can add the next winner either way: scan another claim QR (TAM-177), or record a paper player's win
by picking Kabir (TAM-039)
And (N1 of the 1.1.0 release review, decided 2026-10-03) typing or scanning Kabir's paper ticket there is refused with
"Ticket 4 plays on paper: pick Kabir by name if the anchor agrees." and "Pick the winner by name", which opens the
name list titled "Another Top Line winner" (TAM-058)
And a second winner who completed on the same number shares the prize with Riya (TAM-041, TAM-087)
And Top Line still waits to be closed: the main button is still "Close Top Line" (TAM-198)
Wrong input: a scanned claim QR that isn't a win (a number not called, or complete on an earlier number) is a bogey
or a late claim as usual (TAM-177, TAM-038), and Riya's win stands, still waiting to be closed
(A claim that completed on an earlier number is still late, TAM-043. Closing a tier nobody won does nothing,
so undoing a wrong claim still reopens its tier, TAM-070.)

## TAM-198: After a win, closing the prize is the main action
Status: approved, owner, 2026-10-03 (UX list row 6: phone-ticket games too); approved, owner, 2026-09-30 (docs/decisions.md 2026-09-30: what still works while the screen is dimmed); approved, owner, 2026-09-30 (docs/games/tambola/changes-2026-09-30-playtest.md section 1, from the family play-test)
Phase: Phase 1a
Given a win for Top Line has just been recorded (TAM-037)
Then the big button at the bottom, where "Next number" is, becomes "Close Top Line": filled, enabled,
the same size and place (TAM-100)
And "Add another winner" sits just above it, as a secondary button (TAM-145)
And the rest of the calling screen is dimmed, except the win card, the number and these two buttons
And while the screen is dimmed, these still work: "Add another winner", the Close on the prize's chip, and the menu
(End game, Discard game, Show the room)
When the host taps anywhere else in the dimmed area (for example "Record a win")
Then nothing happens there, and the "Close Top Line" button pulses once (never a repeating blink or flash)
When the host taps the Close on the Top Line chip instead
Then the prize closes exactly as with "Close Top Line"
When the host opens the menu and ends or discards the game, or shows the room
Then that works as it does at any other time (TAM-066, TAM-140)
When the host taps "Close Top Line"
Then the prize closes, the screen is no longer dimmed, and the button is "Next number" again
And "Undo win" stays available on the win card until the prize is closed (TAM-070)
And all of this holds in a phone-ticket game too, after a claim accepted from a claim QR: "Add another winner" sits
above "Close Top Line" and works while the screen is dimmed (UX list row 6, approved, owner, 2026-10-03; TAM-145)
