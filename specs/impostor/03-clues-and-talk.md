# 03-clues-and-talk.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.9, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-020: Who starts
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Riya, Arjun, Meena, Kabir and Zoya, and Meena starts
Then the clues screen shows `starter-name` MEENA, then "starts", then "Each say one word about your secret:", then
`clue-order` "Meena → Kabir → Zoya → Riya → Arjun" (seat order from the starter, wrapping round)
And the announcer says "Meena starts. Each say one word about your secret: Meena, Kabir, Zoya, Riya, Arjun"
And `starter-name` is 56 px at widths of 360 px and up and at 812 × 375 for names of up to 8 characters; for longer
names, and at 320 px wide, it may be any size from 32 px to 56 px; at 32 px it may wrap onto 2 lines; never cut off
And `clue-order` is body text; when its text is taller than the space left above the main button, it scrolls inside
its own box and the main button stays wholly on screen (20 names of 16 characters at 320 × 568 with Larger text
included)
And at 812 × 375 `starter-name` and "starts" sit in the left half; "✓ Everyone has seen their word.", "Phone in the
middle, face up.", "Each say one word about your secret:", `clue-order`, the IMP-022 button and the main button sit
in the right half
And in **Hard** mode the starter is never the round's impostor; in **Easy** mode the impostor may start
And at 812 × 375 "Go round again" and "See my word again" share one row (two equal halves) in the right half, and
"Not enough clues?" is not shown (the button alone)
And at 320 × 568 the order is: `starter-name`, "starts", then one box that scrolls inside its own height holding
"✓ Everyone has seen their word.", "Phone in the middle, face up.", "Each say one word about your secret:" and
`clue-order`; then "Not enough clues?", then "Go round again" and "See my word again" on one row (two equal halves),
then the joining line (IMP-079), then the main button
Arithmetic (rule 4), 320 × 568, 5 players, Larger text off: top bar 48 + `starter-name` (32 px, 2 lines) 77 +
"starts" 24 + the box 120 (5 lines: 24 + 24 + 24 + 48) + "Not enough clues?" 21 + shared row 48 + joining line 21 +
main button 76 + 8 gaps of 8 = 499 px ≤ 568 (with more players the box scrolls inside); at 360 × 640 and 390 × 844
the screen keeps the order of IMP-016 with "Go round again" and "See my word again" stacked: 48 + 48 + 77 + 24 + 24
+ 48 + 21 + 48 + 48 + 21 + 76 + 10 × 8 = 563 px ≤ 640; at 812 × 375 the right half: 48 + 24 + 24 + 24 + 48 + 48
(shared row) + 21 + 76 + 7 × 8 = 369 px ≤ 375

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
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given 3, 4 or 5 players
Then the clues screen has the quiet button "Go round again", placed in the bottom bar directly above the main button
(not under `clue-order`), with the small line "Not enough clues?" (15 px; 19 px with Larger text) directly above
it, except at 812 × 375 (IMP-020) (product owner, 4 October,
after Jev's confusion flags: the old label in the middle of the screen read as the first step)
When it is tapped
Then the line "Second round: MEENA starts again" (the same starter) appears under `clue-order`, the button disappears
for the rest of the round, and nothing else changes (recorded as `anotherRoundOfClues`)
Given 6 or more players
Then the button is not shown

## IMP-023: Free flow
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Talking is Free flow
When "Clues done, talk it over" is tapped on the clues screen
Then the talk screen shows the heading "Talk it over" (`talk-heading`), "Who sounded unsure?", the quiet "See my word
again" (IMP-017), the joining line of IMP-079 when someone is waiting, and the main button "Vote now", with no timer
And `talk-heading` is 56 px at widths of 360 px and up (it may wrap onto 2 lines); at 320 px wide it may be any size
from 32 px to 56 px
And nothing on this screen changes by itself (guideline 28)

## IMP-024: Timer
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Talking is Timer
When "Clues done, start timer" is tapped (t = 0)
Then the talk screen shows `timer-label` "Talk it over" (28 px) directly above `timer`, which reads "2:00" (m:ss)
and counts down once per second: "1:59" at t = 1 s … "0:00" at t = 120 s, with the main button "Vote now" and the
quiet "Pause", the quiet "See my word again" (IMP-017) and the joining line of IMP-079 when someone is waiting;
there is no `talk-heading` and no "Who sounded unsure?"
And `timer` is 120 px (112 px at 320 px wide)
And at "1:00" the announcer says "1 minute left"
And at "0:00": `timer` stays showing "0:00"; the heading "Time's up!" (h1, 40 px, never shrinks) appears directly
under `timer`; sound `chime` plays once (if sound on);
the announcer says "Time's up"; the main button "Vote now" is replaced by "Get ready to point"; "Pause" is replaced
by the quiet "1 more minute"
When "1 more minute" is tapped (no move)
Then `timer` reads "1:00" and counts down again; "Time's up!" goes; the main button reads "Vote now"; "Pause"
returns; at "0:00" everything above happens again ("1 more minute" has no limit; no "1 minute left" announcement
for an added minute)
And it never moves on to the vote by itself (guideline 48): "0:00" stays until a tap
And "Vote now" and "Get ready to point" both start the countdown (IMP-030)
And there is no menu from t = 0 of the countdown (IMP-075); the menu is available during the timer
And at 812 × 375 `timer-label`, `timer` and "Time's up!" sit in the left half; the buttons in the right half
Arithmetic (rule 4), 812 × 375: left half 48 (top bar) + 34 + 132 (`timer`, 120 px) + 40 = 254 px ≤ 375; portrait
320 × 568: 48 + 34 + 124 + 40 + 21 + 48 + 48 + 21 + 76 + 8 gaps of 8 = 524 px ≤ 568

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
"Players"), the menu, "How to play" and Settings never pause it; it never catches up for time spent paused (guideline 34);
only "Carry on" resumes it
And the remaining time is kept in `pgn.impostor-ui.<id>` (`timerMs`), not as a move and not in the saved record

---
