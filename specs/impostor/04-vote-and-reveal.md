# 04-vote-and-reveal.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.5, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-030: The countdown to point
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Vote now", "Get ready to point", "Point again: …" (IMP-032) or "Count again" (IMP-031) (t = 0)
Then the countdown screen shows: the heading `countdown-heading` "Get ready to point…" (40 px) from t = 0; `countdown-number` "3" at t = 1 s,
"2" at t = 2 s, "1" at t = 3 s, "Point!" at t = 4 s; and the picker opens by itself at t = 6 s (a countdown started by
a tap, guideline 48)
And `countdown-number` for "3", "2", "1" is 200 px in portrait and 160 px at 812 × 375; "Point!" is 96 px
(72 px at 320 px wide)
And sound `tick` plays at t = 1, 2 and 3 s and `ding` at t = 4 s (if sound on); with phone voice on, "3", "2", "1"
and "Point!" are spoken at the same moments; the announcer says "3", "2", "1", "Point!"
And with reduced motion the numbers change with no transform and no transition
And there is no menu and no main button on the countdown screen
And if the page is hidden during the countdown, on return it starts again from "Get ready to point…" (t = 0)

## IMP-031: Recording who got the most fingers: pick, then reveal
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then the picker shows the heading "Who got the most fingers?", one button per player in seat order (two columns,
each button 56 px tall, 8 px apart); 24 px below the last name button the label "Not sure?" (body text); under it,
side by side and of equal width, the text buttons "It's a tie" and "Count again" (48 px tall, no outline, so they
never look like names); and the main button "Reveal", disabled
Arithmetic (rule 4), 390 × 844, 12 players, Larger text off: top bar 48 + heading 70 + 6 rows × 64 = 384 + 24 + 24 +
48 + main button 76 + 3 gaps of 8 = 698 px ≤ 844
And at 812 × 375 the heading and the names box (two columns, scrolling inside its own box) sit in the left half;
"Not sure?", "It's a tie" (or "Still a tie"), "Count again" and the main button sit in the right half
When the host taps Arjun
Then Arjun is selected (outline, ✓, tint, `aria-pressed="true"`), nothing is revealed, and the main button reads
"Reveal Arjun", enabled
When the host taps Meena
Then the selection moves to Meena (Arjun `aria-pressed="false"`) and the main button reads "Reveal Meena"
And tapping the selected name again changes nothing
When the host taps "Count again"
Then the selection is cleared and the countdown runs again (IMP-030), then this same picker
When the host taps "Reveal Arjun"
Then the result screen starts (IMP-033, IMP-034 or IMP-039; guideline 47); recorded as `reveal`

## IMP-032: A tie gets one re-vote
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "It's a tie"
Then the picker switches to ticking 2 or more names: "It's a tie" disappears ("Not sure?" and "Count again" stay), any selection is cleared, and the main
button reads "Point again", disabled
And tapping a name ticks it (`aria-pressed="true"`); tapping a ticked name unticks it
And with 2 or more ticked, the main button reads "Point again: " plus the ticked names in seat order, joined by ", "
with " or " before the last: "Point again: Arjun or Meena", "Point again: Arjun, Meena or Kabir"; every player may be
ticked
When "Point again: Arjun or Meena" is tapped
Then the countdown runs (IMP-030); recorded as `tie`
And then the re-vote picker shows only Arjun and Meena, "Not sure?" with the text buttons "Still a tie" and "Count
again", and the main button
"Reveal" (disabled until one is picked, then "Reveal Arjun"), picking one name as in IMP-031
And "Count again" here runs the countdown again and returns to this re-vote picker
And "Count again" in tie mode (before "Point again") clears the ticks, runs the countdown and returns to the
one-name picker of IMP-031
When the host taps "Still a tie"
Then the impostor escapes (IMP-038); recorded as `stillTie`
And there is never a second re-vote

## IMP-033: Caught: one result screen, the word shown at once
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Arjun is the impostor, the word is School trip (other names "Excursion", category "School and childhood"),
and the last-chance guess is off (IMP-076)
When "Reveal Arjun" is tapped (t = 0; recorded as `reveal`, which completes the round)
Then the result screen shows only `build-up` "Arjun was…" from t = 0 to t = 1.5 s; sound `drumroll` plays once at
t = 0 (if sound on); `body`'s background colour does not change; there is no menu button and no main button
And at t = 1.5 s the build-up is replaced, all at once, by, top to bottom:
1. `result-headline` "✓ Caught!"
2. `result-impostor` "ARJUN was the impostor"
3. `word-label` "The word was", then `result-word` "School trip"
4. `also-called` "Also called Excursion" (only when the word has other names; not announced)
5. `word-category` "School and childhood" (the word's `category` exactly; not a button)
6. `round-outcome` "The crew wins!" (h2)
7. `evening-line` (Score No, IMP-040) or `round-points` and `scoreboard` (Score Yes, IMP-044)
8. the quiet "This word didn't work" (IMP-107); and the main button "Next round", pinned; the menu button returns
And sizes: `build-up` 40 px; `result-headline` 56 px, centred (44 px at widths below 390 px, always one line); `result-note` 20 px; `result-impostor` 32 px, centred
(it may wrap onto 3 lines); `word-label` body text; `result-word` 44 px, centred, fitting in 3 lines (a word over 12
characters may be any size from 32 px to 44 px); `also-called` small line; `word-category` 17 px (21 px with Larger
text) in an outlined chip directly below the word (and below `also-called` when shown); `round-outcome` 28 px;
`evening-line` and `round-points` body text
And there is no "Undo" and no guess step with the last-chance guess off (a reveal is never undone, guideline 47)
And the screen scrolls as one page (guideline 46a; IMP-081); no part of it has its own scroll area
And with reduced motion the build-up and the switch at t = 1.5 s happen with no transform, transition or animation
And nothing else appears later on this screen; it stays until "Next round" (or the menu) is used
Arithmetic (rule 4), 390 × 844, Score No, guess off, a word of up to 12 characters with no other names, a name of up
to 8 characters, Larger text off: top bar 48 + 67 + 77 (2 lines) + 24 + 53 + 36 + 34 + 24 + 48 + main button 76 + 9
gaps of 8 = 559 px ≤ 844, so it does not scroll; with Score Yes and 12 players (scoreboard 6 rows × 36 = 216,
`round-points` 24 in place of `evening-line`, and one more 8 px gap) 783 px ≤ 844. At 320 × 568 and 360 × 640, with Larger text, longer
words or names, or `also-called`, the page may scroll

## IMP-034: The result when the crew picked the wrong person
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Arjun is the impostor and the word is Samosa (category "Food", no other names)
When "Reveal Meena" is tapped (t = 0; recorded as `reveal`, which completes the round)
Then the build-up "Meena was…" shows from t = 0 to t = 1.5 s exactly as in IMP-033
And at t = 1.5 s it is replaced, all at once, by, top to bottom: `result-headline` "✗ Escaped!", `result-note` "Meena
was crew.", `result-impostor` "ARJUN was the impostor", `word-label` "The word was", `result-word` "Samosa", no
`also-called`, `word-category` "Food", `round-outcome` "Arjun escaped!", then items 7 and 8 of IMP-033, with
IMP-033's sizes and scrolling
And there is no guess step and no "Undo", whatever the last-chance guess setting

## IMP-035: The room judges the last-chance guess
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the last-chance guess is on, Arjun was caught, the word is Pani puri, and IMP-039's verdict step shows
When the room agrees Arjun's guess "Samosa" is wrong and the host taps "Wrong guess"
Then `round-outcome` reads "The crew wins!"
When instead the host taps "Guessed right" (another name counts: "Golgappa" for Pani puri)
Then `round-outcome` reads "Arjun steals the round!"
And the app never judges the guess; it records only the tap
Given the last-chance guess is off
Then there is no guess, no verdict and no "Arjun steals the round!"

## IMP-036: Two impostors (after the play-test)
Status: approved, owner, 2026-10-03
Phase: Impostor later
Given 8 or more players and 2 impostors chosen
Then both impostors see "You're one of 2 impostors" and never who the other is
(The vote and reveal for two impostors are designed after the play-test.)

## IMP-037: Undo the verdict only, before the next round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the last-chance guess is on, Arjun was caught, and the result shows after a verdict ("Guessed right" or
"Wrong guess") (IMP-039)
Then the quiet buttons under the result read, in this order, "Undo" then "This word didn't work", above the main
button "Next round"
When "Undo" is tapped (engine `undo` of the `verdict` record)
Then `round-outcome`, the evening line or points, the scoreboard, "Undo", "This word didn't work" and "Next round"
go; "Guessed
right" and "Wrong guess" show again under the word, which stays shown; that verdict's points are taken back; the
round is not completed until a verdict is tapped again; the menu button goes (IMP-075); a "This word didn't work"
tapped before "Undo" stays recorded
And "Undo" stays offered until "Next round" is tapped or players or choices change (`setPlayers`, `setChoices`),
including after the evening is reopened (IMP-091) or after "Oops, keep playing" (IMP-101)
And "Undo" is never offered with the last-chance guess off, nor on an escaped or "Still a tie" round
And a reveal is never undone (it is protected by "Reveal Arjun", IMP-031), and a deal is never undone (use "Deal
again with a new word")

## IMP-038: "Still a tie": the impostor escapes
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Arjun is the impostor, the word is Samosa, and the re-vote picker is showing
When "Still a tie" is tapped (t = 0; recorded as `stillTie`, which completes the round)
Then the result screen shows at once, with no build-up and no `drumroll`, top to bottom: `result-headline`
"✗ Escaped!", `result-note` "Still a tie.", `result-impostor` "ARJUN was the impostor", `word-label` "The word was",
`result-word` "Samosa", `word-category` "Food", `round-outcome` "Arjun escaped!", then items 7 and 8 of IMP-033,
with IMP-033's sizes and scrolling
And the round is escaped (+2 to Arjun when keeping score); there is no guess step and no "Undo"

## IMP-039: The last-chance guess, when it is on
Status: approved, owner, 2026-10-04 (changed; detail of IMP-033)
Phase: Impostor 1
Given the last-chance guess is on (IMP-076), Arjun is the impostor and the word is School trip
When "Reveal Arjun" is tapped (t = 0; recorded as `reveal`)
Then the build-up shows from t = 0 to t = 1.5 s exactly as in IMP-033
And at t = 1.5 s it is replaced, all at once, by: `result-headline` "✓ Caught!", `result-impostor` "ARJUN was the
impostor", `guess-line` "Last chance, Arjun! Guess the word out loud. Get it right and you steal the round." (20 px)
and the main button "Arjun guessed. Show the word"; the word is not in the page (IMP-013); there is no menu button
When "Arjun guessed. Show the word" is tapped (recorded as `showWord`)
Then that button goes and, under those lines, `word-label` "The word was", `result-word` "School trip",
`also-called` "Also called Excursion" and `word-category` "School and childhood" appear, with two quiet buttons of
equal size side by side, "Guessed right" and "Wrong guess"; neither has the main look (IMP-080)
When a verdict is tapped (recorded as `verdict`, which completes the round)
Then the two buttons go and these appear under the chip, at once: `round-outcome` "The crew wins!" ("Wrong guess")
or "Arjun steals the round!" ("Guessed right"), then item 7 of IMP-033, then the quiet "Undo" (IMP-037), the quiet
"This word didn't work" and the main button "Next round"; the menu button returns; the page scrolls so that
`round-outcome` is wholly in view
And every line shown stays on the screen until "Next round"; sizes and scrolling as in IMP-033
And when the vote revealed a crew member, or the re-vote ended "Still a tie", there is no guess step: IMP-034 and
IMP-038 apply unchanged

---
