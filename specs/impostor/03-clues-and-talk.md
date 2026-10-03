# 03-clues-and-talk.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 2.2, 3 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-020: Who starts
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Riya, Arjun, Meena, Kabir and Zoya, and Meena starts
Then the clues screen shows `starter-name` MEENA, then "starts", then `clue-order`
"then clockwise: Meena → Kabir → Zoya → Riya → Arjun" (seat order from the starter, wrapping round)
And the announcer says "Meena starts, then clockwise: Meena, Kabir, Zoya, Riya, Arjun"
And `starter-name` is 56 px at widths of 360 px and up for names of up to 8 characters; for longer names, at 320 px
wide, and at 812 × 375, it may be any size from 32 px to 56 px; at 32 px it may wrap onto 2 lines; never cut off
And `clue-order` is body text; when its text is taller than the space left above the main button, it scrolls inside its own box and the main button stays
wholly on screen (20 names of 16 characters at 320 × 568 with Larger text included)
And in **Hard** mode the starter is never the round's impostor; in **Easy** mode the impostor may start

## IMP-021: The starter moves round, without repeats
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then the starter is picked when the deal ends (after the last "Done"), by the starter seed, uniformly among players
who have not started in the current cycle and (Hard) are not this round's impostor
And when no player qualifies, a new cycle starts first (everyone becomes "not started"), then the pick is made
And a round counts for the cycle once its clues screen shows, the practice round included; a round redealt after
its clues screen showed ("Deal again") still counted
And a removed player leaves the cycle; a player who joins enters it as not yet started
Example (Hard, 4 players): Riya, Arjun and Meena have started; Kabir is this round's impostor; nobody qualifies, so a
new cycle starts and the starter is one of Riya, Arjun, Meena (each one third)
Property (1,000 seeded evenings of 20 rounds, 3 to 12 players, Easy and Hard): within one cycle nobody starts twice;
in Hard the starter is never the impostor; tolerance 0 failures

## IMP-022: One round of clues; a second round for 3 to 5 players
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given 3, 4 or 5 players
Then the clues screen has the quiet button "Another round of clues"
When it is tapped
Then the line "Second round: MEENA starts again" (the same starter) appears under `clue-order`, the button disappears
for the rest of the round, and nothing else changes (recorded as `anotherRoundOfClues`)
Given 6 or more players
Then the button is not shown

## IMP-023: Free flow
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Talking is Free flow
When "Talk it over" is tapped on the clues screen
Then the talk screen shows the heading "Talk it over" (`talk-heading`), "Who sounded unsure?" and the main button
"Vote now", with no timer
And `talk-heading` is 56 px at widths of 360 px and up (it may wrap onto 2 lines); at 320 px wide it may be any size
from 32 px to 56 px
And nothing on this screen changes by itself (guideline 28)

## IMP-024: Timer
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Talking is Timer
When "Start the 2-minute timer" is tapped (t = 0)
Then the talk screen shows only `timer` (no `talk-heading`, no "Who sounded unsure?"), which reads "2:00" (m:ss)
and counts down once per second: "1:59" at t = 1 s … "0:00" at t = 120 s, with the
main button "Vote now" and the quiet "Pause"
And `timer` is 120 px (112 px at 320 px wide)
And at "1:00" the announcer says "1 minute left"
And at "0:00": `timer` stays showing "0:00"; the heading "Time's up!" appears; sound `chime` plays once (if sound on);
the announcer says "Time's up"; the main button "Vote now" is replaced by "Get ready to point"; "Pause" is removed
And it never moves on to the vote by itself (guideline 48): "0:00" stays until a tap
And "Vote now" (before 0:00) and "Get ready to point" (at 0:00) both start the countdown (IMP-030)
And there is no menu from t = 0 of the countdown (IMP-075); the menu is available during the timer

## IMP-025: Deal again with a new word
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host opens the menu during a round (deal, clues, talk or picker) and taps "Deal again with a new word"
Then a dialog asks "Deal again? This round won't count. For when someone said the word or saw a screen." with
"Deal again" and "Keep playing" (main)
When "Keep playing" is tapped
Then the dialog closes and nothing changes (a running timer kept running while the dialog was open)
When "Deal again" is tapped
Then the deal starts again from the first player in seat order with a new word and a new impostor (IMP-061), the same
players and round number, and no points; recorded as `dealAgain`
And the dealt-again word stays used tonight (IMP-051)

## IMP-027: The timer pauses
Status: approved, owner, 2026-10-03 (detail of IMP-024)
Phase: Impostor 1
Given the timer is running at "1:30"
When "Pause" is tapped
Then `timer` stays at "1:30", "Pause" becomes "Carry on", and the small line "Paused · Tap to carry on" shows under
the timer
When "Carry on" is tapped
Then counting resumes from "1:30" (the next change, to "1:29", 1 s later), "Pause" returns and the small line goes
And the timer also pauses, exactly as if "Pause" were tapped, only when the page becomes hidden (and so when the
evening is reopened, IMP-091) and when "See my word again" opens (IMP-017); dialogs ("Deal again?", "End now?",
"Players"), the menu, Rules and Settings never pause it; it never catches up for time spent paused (guideline 34);
only "Carry on" resumes it
And the remaining time is kept in `pgn.impostor-ui.<id>` (`timerMs`), not as a move and not in the saved record
