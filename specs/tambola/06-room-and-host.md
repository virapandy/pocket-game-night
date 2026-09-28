# The room and the host

The phone replaces paper, not the fun. Shortcuts that remove the shouting and checking are off by default.

## TAM-060: A new game starts with the room-ritual defaults
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host starts a new game without changing settings
Then the phone does not speak the calls (the anchor reads them)
And numbers are not auto-marked on players' phones
And players have no Claim button (they shout)
And verdicts are shown on the host phone only

## TAM-061: Turning on a shortcut shows a friendly warning, once
Status: draft
Phase: Phase 1b
When the host turns on "Phone speaks the call"
Then a short warning appears: the anchor's calling is part of the fun
And the host can confirm or cancel
And turning the same setting on again later in this game does not show the warning again

## TAM-062: Each shortcut has its own warning
Status: draft
Phase: Phase 1b (the Phase 6 part waits for connected mode)
Then "Phone speaks the call" and "Auto-call" (TAM-120) each show their own warning the first time
they are turned on
And later, in connected mode only (Phase 6), so do "Auto-mark", "Claim button" and "Verdict on every phone"

## TAM-063: A game starts fast
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the app is open on the host phone
When the host sets up a game for 6 players with default settings, including a contribution and the suggested split
Then the first number can be drawn within 60 seconds, with no sign-in and no account

## TAM-064: The game works with no internet
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the app was opened once before and the phone is now in airplane mode
When the host starts and plays a full game on one phone
Then everything works: drawing, rhymes, the board, claim checks and the result

## TAM-065: Pausing does not lose the game
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given a game is in progress
When the host phone locks, or the app is closed and reopened
Then the game continues from exactly where it was

## TAM-066: The host can end the game early
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host taps "End game" and confirms
Then the game ends and the payout summary shows the winners so far
And unclaimed tiers follow TAM-088

## TAM-067: A late joiner can get a ticket mid-game
Status: decided 2026-09-28 (convention: numbers already called count; the claim-before-next-number rule means a pattern already complete on joining cannot be claimed)
Phase: Phase 1b
Given 6 numbers have been called, and late joining is allowed until 10 numbers (host setting; 0 turns it off)
When a new player arrives and the host adds them with a ticket (paper or phone)
Then the numbers already called count on their ticket, as in paper Tambola
And a pattern already complete at the moment they join cannot be claimed; it must be completed by a later number
And their contribution is added to the pot and split across the tiers not yet won, rounded, keeping the total exact (owner, 2026-09-28)
And the new prize amounts are shown on the host screen for the anchor to announce
When 10 numbers have been called
Then the host can no longer add players until the next game

## TAM-068: Play again keeps the setup
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When a game ends and the host taps "Play again"
Then the players, contribution, patterns and split are kept
And the tickets and the draw seed are new
And the anchor confirms the prizes again before the first number

## TAM-069: How to play works offline
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the phone has no internet
When a first-timer opens "How to play" from the start screen
Then the one-page guide with a sample ticket is shown

## TAM-130: House rules are settings with the conventions as defaults
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host opens the game settings
Then each house rule (ties, late claims, bogey penalty, tickets per player, late joining, auto-call)
is listed with its convention as the default, in plain words
And changing one applies only to this game and later games, never to a game in progress

## TAM-137: Setup asks for the ticket mode and, optionally, names
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host starts a new game
Then the first choice is "Paper tickets" or "Phone tickets" (Phase 2)
And names are optional; without them players are "Player 1", "Player 2" …

## TAM-180: The phone's voice calls the number, only if the host wants it
Status: decided 2026-09-28 (owner: the anchor calling is the fun; phone voice is optional)
Phase: Phase 1b
Given the anchor calls aloud by default, and the phone's voice is off in every new game
When the host turns on "Phone speaks the call" or auto-call (with the one-time warning, TAM-061)
And a number is called
Then the phone says the number, the rhyme, and the number again ("Five. Man alive. Five.")
And it uses an Indian English voice if the phone has one, otherwise any English voice
And a Hindi rhyme is spoken only if the phone has a Hindi voice; otherwise only the number is spoken
And if the phone has no voice at all, the option is greyed out with a one-line reason
