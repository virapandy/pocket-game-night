# Game lifecycle and history (all games)

What happens to a game over time: starting, pausing, abandoning, finishing, looking back, deleting.
These apply to every game. Game-specific parts (such as Tambola's money) live in that game's specs.
Everything is stored **only on the host phone**: no account, no cloud.

## The states of a game
```
 Setup ──confirm──▶ In progress ◀──resume── Paused
   │                  │    │                  ▲
   │                  │    └──app hidden──────┘
   │                  ├──End game──▶ Ended ──────┐
   │                  └──Discard───▶ Abandoned ──┤
   └──leave setup──▶ (setup kept for next time)  ▼
                                      History ──Delete──▶ gone
```

## PLT-001: A game moves through clear states
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then every game is in exactly one state: Setup, In progress, Paused, Ended or Abandoned
And only In progress and Paused games can change; Ended and Abandoned games are read-only

## PLT-002: Several unfinished games are allowed
Status: approved, owner, 2026-09-28 (decided: owner: no one-game limit unless absolutely necessary)
Phase: Phase 1a
Given a game is in progress or paused
When the host starts a new game
Then the new game starts without asking anything about the other one
And the home screen lists every unfinished game ("Tambola, 8:40 pm, 23 numbers called") to continue

## PLT-003: Every change is saved at once
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When anything changes in a game (a call, a claim, a setting)
Then it is saved on the phone immediately, so closing the app never loses it (TAM-065, TAM-111, TAM-112)

## PLT-004: Coming back to an unfinished game
Status: approved, owner, 2026-09-28 (decided: owner; changed by the owner on 2026-09-28, see docs/decisions.md)
Phase: Phase 1a
Given a game was left in progress
When the host opens the app within 12 hours
Then the game is not opened automatically: the home screen shows it with "Tap to resume"
And one tap on it goes straight back into that game, paused, exactly where it was left
When the host opens the app after more than 12 hours
Then the app asks: "Resume", "End it (with payouts so far)" or "Discard it"
And the app never ends or discards a game on its own

## PLT-005: Discarding a game
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host taps "Discard game" and confirms ("Discard this game? Nobody wins and it can't be resumed.")
Then the game is marked Abandoned in history, with everything that happened up to then
And for games with money, the game's own rule applies (Tambola: TAM-140)

## PLT-006: An unfinished setup is remembered
Status: approved, owner, 2026-09-28
Phase: Phase 1b
Given the host started setting up a game but did not confirm it
When they come back to set up a game
Then the last setup is filled in, ready to change or confirm

## PLT-007: History lists past games, newest first
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host opens History
Then each game shows the game name, date and time, number of players, and result
(for example "Full House: Dad", or "Abandoned")
And games are grouped by session (PLT-016)

## PLT-008: A past game can be looked at, but not changed
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host opens a past game
Then the summary is shown, plus every call and claim in order
And nothing in it can be edited

## PLT-009: Play again from a past game's setup
Status: approved, owner, 2026-09-28
Phase: Phase 1b
When the host opens a past game and taps "Use this setup"
Then a new game starts in Setup with the same players, contribution, tiers and house rules
And new tickets and a new draw seed

## PLT-010: Deleting a past game
Status: approved, owner, 2026-09-28
Phase: Phase 1b
When the host deletes a past game
Then it disappears at once, with "Deleted. Undo" for 5 seconds
And after that it is gone for good
And a game in progress or paused cannot be deleted: it must be ended or discarded first

## PLT-011: Clearing all history
Status: approved, owner, 2026-09-28
Phase: Phase 1b
When the host taps "Clear all history"
Then a confirmation asks "Delete all 23 past games from this phone? This can't be undone."
with buttons "Delete all" and "Keep"
And a game in progress is not affected

## PLT-012: No limit on history, but no surprises either
Status: approved, owner, 2026-09-28 (decided: owner)
Phase: Phase 1a
Given a finished game takes a few kilobytes
Then the app keeps every past game until the host deletes it
And if the phone's storage for the app is nearly full, the app says so and offers to delete the oldest games;
it never deletes them silently

## PLT-013: The app is honest that history lives only on this phone
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host opens History for the first time
Then a one-line note says history is kept only on this phone, and is lost if the app's data is cleared
And the app asks the browser to keep its data (persistent storage) when the first game starts
And on iPhone, the install tip (TAM-118) explains that the home-screen app keeps data more reliably

## PLT-014: Old games still open after an app update
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given games were saved by an older version of the app
When the app is updated
Then every past game and any game in progress still opens, with nothing lost
(Saved games carry a format version from the first release.)

## PLT-015: Games played without the app are not entered by hand
Status: decided 2026-09-28 (owner)
Phase: later, with the Scoreboard game
When a group played on paper without the app
Then there is no way to type that game into Tambola history
(Manual score entry belongs to the Scoreboard game, game four.)

## PLT-016: Every game belongs to a named session
Status: decided 2026-09-28 (owner)
Phase: Phase 1b
When the host starts the first game of a gathering
Then the app asks for a session name, suggesting one ("Sunday 28 Sep")
And every game started after that joins the same session by default
When the host starts a game more than 3 hours after the last game in that session ended
Then the app asks: "Continue 'Diwali at Nani's' or start a new session?"

## PLT-017: The tally covers finished, unsettled games in one session
Status: decided 2026-09-28 (owner); wording aligned with TAM-088 on 2026-09-28, as the change request asked
Phase: Phase 1b
When the host opens the tally for a session
Then it adds up only games that are Ended and not yet settled
And it leaves out games in progress, paused or abandoned
And for each person it shows what they paid, what they got back (prizes won, plus any money handed back
from prizes nobody won, TAM-088), and one net amount
And its totals balance: everything paid in equals everything paid out
And each person is one compact row: their name and their balance (1b review finding 4, approved, owner, 2026-09-29,
docs/games/tambola/changes-2026-09-29-money-and-1b.md: seven people must not fill the screen)

## PLT-018: Games in different sessions are never tallied together
Status: decided 2026-09-28 (owner)
Phase: Phase 1b
Then a tally only ever includes games from one session
And there is no way to add a game from another session

## PLT-019: Settling marks the games done
Status: decided 2026-09-28 (owner)
Phase: Phase 1b
When the host taps "Settle" on a tally and confirms ("Mark 3 games as settled? Do this after the money has changed hands.")
Then every game in that tally is marked Settled, and the tally is empty again
And later games in the same session start a new tally
And settled games show "Settled" in history and can no longer be tallied

## PLT-020: The same person across games
Status: approved, owner, 2026-09-28
Phase: Phase 1b
Then the tally matches people across games in a session by the name used in each game
And Play again and "Use this setup" keep the same names, so the match is automatic

## PLT-021: The tally works for any game with money
Status: decided 2026-09-28 (owner)
Phase: Phase 1b
Given any game that uses money (Tambola now; Scoreboard, Rummy and poker nights later)
When the game ends
Then it records, for each person, what they paid and what they won in that game
And the tally uses only that record, so a new game with money needs no change to the tally

## PLT-022: Sessions can be seen and renamed
Status: approved, owner, 2026-09-28
Phase: Phase 1b
When the host opens Sessions
Then every session is listed, newest first, with its games and whether its tally is settled
And the host can rename a session at any time

## PLT-023: Games without money stay out of the tally
Status: approved, owner, 2026-09-28
Phase: Phase 1b
Given a game was played with "No money"
Then it appears in the session's history but never in its tally

## PLT-024: Every game's setup captures players' names
Status: approved, owner, 2026-09-28 (decided: owner: names are captured at setup, in every game)
Phase: Phase 1a
When the host sets up any game
Then there is one players step, the same in every game: the number of players and their names
And names can be typed quickly or picked from names used before on this phone, shown as one-tap suggestions
And a name left blank becomes "Player 1", "Player 2" …, which the host can rename at any time during the game
And Play again and "Use this setup" bring the same names back (PLT-009, TAM-068)
And two players cannot have the same name in one game (the app asks to add an initial: "Riya S")

## Phase 1b: gaps found in the review of 28 September 2026 (new drafts)

## PLT-025: Deleting a game that is still in an unsettled tally
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; follows from PLT-010, PLT-011 and PLT-017)
Phase: Phase 1b
Given an ended game is in the "Diwali at Nani's" tally and not yet settled
When the host deletes it (PLT-010)
Then the confirmation says so: "This game is in the unsettled tally for 'Diwali at Nani's'. Delete it and take it out of the tally?"
And after deleting, the tally no longer includes it, and still balances
When the host taps "Clear all history" (PLT-011) and some tallies are unsettled
Then the confirmation also says how many games are in unsettled tallies
And "Deleted. Undo" (PLT-010) brings the game back into the same tally

## PLT-026: A game stays in the session it was started in
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; follows from PLT-016)
Phase: Phase 1b
Given a game was started in "Diwali at Nani's" and left paused overnight
When the host resumes and ends it the next day (PLT-004)
Then it stays in "Diwali at Nani's" and is tallied there, not in a new session
And starting a new game the next day still asks "Continue 'Diwali at Nani's' or start a new session?" (PLT-016)

## PLT-027: A settled tally can be looked at later
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; follows from PLT-019)
Phase: Phase 1b
When the host opens a session whose games were settled
Then each settle is listed with its date and time, and one tap shows what it said: per person paid, got back and net
And nothing in it can be edited
And right after settling, "Settled. Undo" shows for 5 seconds; undo puts the games back into the unsettled tally exactly as before.

## PLT-028: Settle up: net amounts first, then who pays whom
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; proposal for the owner)
Phase: Phase 1b
Given a session tally where Riya is +₹120, Asha −₹70 and Dad −₹50
Then the tally shows each person's net amount
When the host taps "Settle up"
Then it lists the fewest hand-overs that settle it: "Asha pays Riya ₹70 · Dad pays Riya ₹50", adding up exactly to each net amount
And no payment is made or requested: text only (TAM-090)
When the host taps "Mark as settled" and confirms (PLT-019)
Then the games are settled (PLT-019, PLT-027)

## PLT-029: The session is shown, and can be changed, before the game starts
Status: approved, owner, 2026-09-30 (docs/games/tambola/changes-2026-09-30-playtest.md section 2; docs/decisions.md)
Phase: Phase 1b
On the last setup step, above "Confirm prizes", one line shows "Session: Tuesday 29 Sep · Change"
When the host taps "Change"
Then they can start a new session (with a suggested name) or pick one of the recent unsettled sessions
And with no change, the game joins the session shown, as today (PLT-016)
