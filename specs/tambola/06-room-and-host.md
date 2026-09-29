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
Status: approved, owner, 2026-09-28
Phase: Phase 1b
When the host turns on "Phone speaks the call"
Then a short warning appears: the anchor's calling is part of the fun
And the host can confirm or cancel
And turning the same setting on again later in this game does not show the warning again

## TAM-062: Each shortcut has its own warning
Status: approved, owner, 2026-09-28
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
And the players step is the shared one (PLT-024): names are captured there, and blanks become "Player 1", "Player 2" …

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

## Setup redesign (change request, 28 September 2026)
From `docs/games/tambola/ux-calling-screen.md`, setup problems 9 to 11 (problem 12 is TAM-082). New drafts.

## TAM-181: The main button stays at the bottom on every setup step
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign). Ticket-mode step decided 2026-09-29 (docs/decisions.md): tapping "Paper tickets" moves on at once, with no separate "Next"
Phase: Phase 1a
Given a 390 × 844 screen
On the ticket-mode step, a one-choice step
Then there is no separate "Next": tapping "Paper tickets" moves on to the players step at once
On every other setup step (players, contribution, prizes, confirm)
Then the step's main button ("Next", or "Confirm prizes" on the last step) is fixed at the bottom of the screen
And it stays visible without scrolling, however many players or tiers there are (for example 6, 12 or 20 players)
And nothing on the step is hidden behind it: the last player's name box can still be scrolled into view above it
The same holds after the game (1b review findings 1 and 2, approved, owner, 2026-09-29, docs/games/tambola/changes-2026-09-29-money-and-1b.md):
On the payout screen, "Play again" (and "Session tally", TAM-197) is fixed at the bottom, however many players there are
On a session's screen, "Settle up" and "Mark as settled" are fixed at the bottom, however many people are in the tally
And nothing is hidden behind them: the last person can still be scrolled into view above them

## TAM-182: The contribution has a real default value, not a grey hint
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
When the host reaches the contribution step
Then the field already holds a real value (₹50 today), and the pot is shown from it straight away (TAM-080)
And the host can change it or choose "No money" (TAM-090)
Wrong input: an empty field, 0, a negative number or letters are refused with a one-line reason, and "Next" waits

## TAM-183: The prizes step fits on one screen
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
Given the suggested five tiers for 6 to 11 tickets (TAM-081)
Then each tier shows its name and its amount once, with a small remove control (still at least 44 × 44 CSS px, TAM-104)
And all five tiers, the pot and "Confirm prizes" fit on one 390 × 844 screen without scrolling
And with six or seven tiers (12 or more tickets) the list may scroll, but "Confirm prizes" stays fixed at the bottom (TAM-181)

## Phase 1b: gaps found in the review of 28 September 2026 (new drafts)

## TAM-184: A late joiner added by mistake can be taken out again
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; follows from TAM-067)
Phase: Phase 1b
Given the host added Kabir as a late joiner by mistake, and no number has been called since
When the host removes Kabir
Then his contribution comes out of the pot, the prizes go back to what they were before he joined, and the
host screen shows the amounts for the anchor to announce
And once a number has been called after he joined, he can no longer be removed (he may already be winning)
Edge: with late joining set to 0 (TAM-067), "Add a late player" does not appear at all

## TAM-185: The phone's voice repeats when asked
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; follows from TAM-180)
Phase: Phase 1b
Given "Phone speaks the call" is on
When the anchor taps "Repeat" (TAM-017)
Then the phone says the same number and rhyme again
When the anchor taps "Another rhyme" (TAM-155)
Then the phone says the number with the new rhyme
And the host can mute the voice with one tap during the game, without the warning again (TAM-061)

## TAM-186: Auto-call waits for wins
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; follows from TAM-120 and TAM-145)
Phase: Phase 1b
Given auto-call is on
When the host taps "Record a win" or "Check numbers", or a won tier is waiting to be closed
Then auto-call pauses, and no number is called until the tier is closed and the host resumes
And the timer starts again from zero after resuming, so the room never gets two calls close together
And undo of the last call (TAM-119) works the same with auto-call on, and pauses auto-call
And the time between calls is 5 to 30 seconds, in 5-second steps, 10 seconds by default (TAM-120).

## TAM-187: A voice that fails never stops the game
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; follows from TAM-180)
Phase: Phase 1b
Given "Phone speaks the call" is on and the phone has no internet
When a number is called
Then it is spoken if the phone's voice works offline
And if the phone cannot speak it, the number is still shown as usual, and the host sees one short note, once:
"The phone's voice isn't working; the anchor calls"
And auto-call keeps its timer, so the game carries on (the anchor reads the screen)
