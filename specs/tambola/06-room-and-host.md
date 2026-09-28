# The room and the host

The phone replaces paper, not the fun. Shortcuts that remove the shouting and checking are off by default.

## TAM-060: A new game starts with the room-ritual defaults
Status: draft
When the host starts a new game without changing settings
Then the phone does not speak the calls (the anchor reads them)
And numbers are not auto-marked on players' phones
And players have no Claim button (they shout)
And verdicts are shown on the host phone only

## TAM-061: Turning on a shortcut shows a friendly warning, once
Status: draft
When the host turns on "Phone speaks the call"
Then a short warning appears: the anchor's calling is part of the fun
And the host can confirm or cancel
And turning the same setting on again later in this game does not show the warning again

## TAM-062: Each shortcut has its own warning
Status: draft
Then "Phone speaks the call", "Auto-mark", "Claim button" and "Verdict on every phone" each show
their own warning the first time they are turned on

## TAM-063: A game starts fast
Status: draft
Given the app is open on the host phone
When the host sets up a game for 6 players with default settings, including a contribution and the suggested split
Then the first number can be drawn within 60 seconds, with no sign-in and no account

## TAM-064: The game works with no internet
Status: draft
Given the app was opened once before and the phone is now in airplane mode
When the host starts and plays a full game on one phone
Then everything works: drawing, rhymes, the board, claim checks and the result

## TAM-065: Pausing does not lose the game
Status: draft
Given a game is in progress
When the host phone locks, or the app is closed and reopened
Then the game continues from exactly where it was

## TAM-066: The host can end the game early
Status: draft
When the host taps "End game" and confirms
Then the game ends and a summary shows the winners so far

## TAM-067: A late joiner can get a ticket mid-game
Status: decided 2026-09-28 (convention: numbers already called count; the claim-before-next-number rule means a pattern already complete on joining cannot be claimed)
Given 6 numbers have been called, and late joining is allowed until 10 numbers (host setting; 0 turns it off)
When a new player arrives and the host adds them with a ticket (paper or phone)
Then the numbers already called count on their ticket, as in paper Tambola
And a pattern already complete at the moment they join cannot be claimed; it must be completed by a later number
And their contribution is added to the pot and spread across the tiers not yet won, keeping the total exact
When 10 numbers have been called
Then the host can no longer add players until the next game

## TAM-068: Play again keeps the setup
Status: draft
When a game ends and the host taps "Play again"
Then the players, contribution, patterns and split are kept
And the tickets and the draw seed are new
And the anchor confirms the prizes again before the first number

## TAM-069: How to play works offline
Status: draft
Given the phone has no internet
When a first-timer opens "How to play" from the start screen
Then the one-page guide with a sample ticket is shown
