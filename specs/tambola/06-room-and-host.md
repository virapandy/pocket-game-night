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
When the host sets up a game with default settings for 6 players
Then the first number can be drawn within 30 seconds, with no sign-in and no account

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
