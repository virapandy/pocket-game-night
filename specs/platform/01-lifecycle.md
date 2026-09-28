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
Status: draft
Phase: Phase 1
Then every game is in exactly one state: Setup, In progress, Paused, Ended or Abandoned
And only In progress and Paused games can change; Ended and Abandoned games are read-only

## PLT-002: One game in progress at a time
Status: draft (recommended)
Phase: Phase 1
Given a game is in progress or paused
When the host starts a new game
Then the app asks: "Resume the current game", "End it (with payouts so far)" or "Discard it"
And no second game starts until one of those is chosen

## PLT-003: Every change is saved at once
Status: draft
Phase: Phase 1
When anything changes in a game (a call, a claim, a setting)
Then it is saved on the phone immediately, so closing the app never loses it (TAM-065, TAM-111, TAM-112)

## PLT-004: Coming back to an unfinished game
Status: draft (recommended)
Phase: Phase 1
Given a game was left in progress
When the host opens the app within 12 hours
Then the game resumes straight away, paused, with "Tap to resume"
When the host opens the app after more than 12 hours
Then the app asks: "Resume", "End it (with payouts so far)" or "Discard it"
And the app never ends or discards a game on its own

## PLT-005: Discarding a game
Status: draft (recommended)
Phase: Phase 1
When the host taps "Discard game" and confirms ("Discard this game? Nobody wins and it can't be resumed.")
Then the game is marked Abandoned in history, with everything that happened up to then
And for games with money, the game's own rule applies (Tambola: TAM-140)

## PLT-006: An unfinished setup is remembered
Status: draft
Phase: Phase 1
Given the host started setting up a game but did not confirm it
When they come back to set up a game
Then the last setup is filled in, ready to change or confirm

## PLT-007: History lists past games, newest first
Status: draft
Phase: Phase 1
When the host opens History
Then each game shows the game name, date and time, number of players, and result
(for example "Full House: Dad", or "Abandoned")
And games played one after another with Play again are grouped as one game night

## PLT-008: A past game can be looked at, but not changed
Status: draft
Phase: Phase 1
When the host opens a past game
Then the summary is shown, plus every call and claim in order
And nothing in it can be edited

## PLT-009: Play again from a past game's setup
Status: draft
Phase: Phase 1
When the host opens a past game and taps "Use this setup"
Then a new game starts in Setup with the same players, contribution, tiers and house rules
And new tickets and a new draw seed

## PLT-010: Deleting a past game
Status: draft
Phase: Phase 1
When the host deletes a past game
Then it disappears at once, with "Deleted. Undo" for 5 seconds
And after that it is gone for good
And a game in progress or paused cannot be deleted: it must be ended or discarded first

## PLT-011: Clearing all history
Status: draft
Phase: Phase 1
When the host taps "Clear all history"
Then a confirmation asks "Delete all 23 past games from this phone? This can't be undone."
with buttons "Delete all" and "Keep"
And a game in progress is not affected

## PLT-012: No limit on history, but no surprises either
Status: draft (recommended)
Phase: Phase 1
Given a finished game takes a few kilobytes
Then the app keeps every past game until the host deletes it
And if the phone's storage for the app is nearly full, the app says so and offers to delete the oldest games;
it never deletes them silently

## PLT-013: The app is honest that history lives only on this phone
Status: draft
Phase: Phase 1
When the host opens History for the first time
Then a one-line note says history is kept only on this phone, and is lost if the app's data is cleared
And the app asks the browser to keep its data (persistent storage) when the first game starts
And on iPhone, the install tip (TAM-118) explains that the home-screen app keeps data more reliably

## PLT-014: Old games still open after an app update
Status: draft
Phase: Phase 1
Given games were saved by an older version of the app
When the app is updated
Then every past game and any game in progress still opens, with nothing lost
(Saved games carry a format version from the first release.)

## PLT-015: Games played without the app are not entered by hand
Status: draft (recommended)
Phase: later, with the Scoreboard game
When a group played on paper without the app
Then there is no way to type that game into Tambola history
(Manual score entry belongs to the Scoreboard game, game four.)
