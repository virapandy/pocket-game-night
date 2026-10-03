# 04-vote-and-reveal.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 2.2, 3 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-030: The countdown to point
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Vote now", "Get ready to point", "Point again: …" (IMP-032) or "Count again" (IMP-031) (t = 0)
Then the countdown screen shows: the heading "Get ready to point…" from t = 0; `countdown-number` "3" at t = 1 s,
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then the picker shows the heading "Who got the most fingers?", one button per player in seat order (two columns,
each button 56 px tall), the quiet "It's a tie" and "Count again", and the main button "Reveal", disabled
When the host taps Arjun
Then Arjun is selected (outline, ✓, tint, `aria-pressed="true"`), nothing is revealed, and the main button reads
"Reveal Arjun", enabled
When the host taps Meena
Then the selection moves to Meena (Arjun `aria-pressed="false"`) and the main button reads "Reveal Meena"
And tapping the selected name again changes nothing
When the host taps "Count again"
Then the selection is cleared and the countdown runs again (IMP-030), then this same picker
When the host taps "Reveal Arjun"
Then the reveal starts (IMP-033 or IMP-034; guideline 47); recorded as `reveal`

## IMP-032: A tie gets one re-vote
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "It's a tie"
Then the picker switches to ticking 2 or more names: "It's a tie" disappears, any selection is cleared, and the main
button reads "Point again", disabled
And tapping a name ticks it (`aria-pressed="true"`); tapping a ticked name unticks it
And with 2 or more ticked, the main button reads "Point again: " plus the ticked names in seat order, joined by ", "
with " or " before the last: "Point again: Arjun or Meena", "Point again: Arjun, Meena or Kabir"; every player may be
ticked
When "Point again: Arjun or Meena" is tapped
Then the countdown runs (IMP-030); recorded as `tie`
And then the re-vote picker shows only Arjun and Meena, the quiet "Still a tie" and "Count again", and the main button
"Reveal" (disabled until one is picked, then "Reveal Arjun"), picking one name as in IMP-031
And "Count again" here runs the countdown again and returns to this re-vote picker
And "Count again" in tie mode (before "Point again") clears the ticks, runs the countdown and returns to the
one-name picker of IMP-031
When the host taps "Still a tie"
Then the impostor escapes (IMP-038); recorded as `stillTie`
And there is never a second re-vote

## IMP-033: Caught: the guess comes before the word is shown
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Arjun is the impostor and the word is Pani puri
When "Reveal Arjun" is tapped (t = 0)
Then one reveal screen shows, whose lines (`reveal-line`, in order) stay on screen once shown:
- t = 0: build-up: "Arjun was" with `build-up-dots` "." at t = 0.6 s, ".." at t = 1.2 s, "..." at t = 1.8 s; sound
  `drumroll` once at t = 0 (if sound on); `body`'s background colour does not change
- t = 2.5 s: the build-up line's element is replaced by "Caught red-handed! ARJUN was the impostor." (so the
  number of `reveal-line`s is 1 at t = 0, 1 at t = 2.5 s, 2 at t = 4.0 s)
- t = 4.0 s: "Arjun, one guess. Say it out loud! (No repeating the clues.)" and the main button "Show the word"
And the word is not in the page (IMP-013) until "Show the word" is tapped
When it is tapped
Then "Show the word" goes, the `reveal-line` "The word was Pani puri." and, under it, the small line
"Also called Golgappa / Puchka" (`also-called`, not a reveal line, not announced; only when the word has other
names) appear, and two quiet buttons of equal size, "Guessed right" and
"Wrong guess", appear side by side; neither has the main look (IMP-080)
When a verdict is tapped (recorded as `verdict`)
Then the two buttons go and the result block (IMP-035, IMP-040, IMP-044) appears below the lines at once, with the
main button "Next round"
And every reveal line is announced as it appears; the build-up is announced once as "Arjun was" (the dots are not
announced)
And with reduced motion the same lines appear at the same times, with no transform, transition or animation
(the dots still appear as text)
And sizes: the build-up line and the first line of each outcome ("Caught red-handed!…", "Meena was crew!",
"Still a tie!…") 28 px; the other reveal lines 20 px; "Also called …" 15 px; `round-outcome` 28 px; `evening-line`
and `round-points` 17 px (IMP-073)

## IMP-034: The reveal when the crew got it wrong
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Arjun is the impostor and the word is Samosa
When "Reveal Meena" is tapped (t = 0)
Then the build-up shows as in IMP-033 with "Meena was", then:
- t = 2.5 s: the build-up line is replaced by "Meena was crew!"
- t = 4.0 s: "The impostor was ARJUN. Escaped!"
- t = 5.5 s: "The word was Samosa."
- t = 7.0 s: the result block, headline "Arjun escaped!", main button "Next round"
And all these lines stay on screen; there is no last guess and no "Undo"

## IMP-035: The room judges the last guess
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given IMP-033's verdict step
When the room agrees Arjun's guess "Kachori" is wrong and the host taps "Wrong guess"
Then `round-outcome` reads "The crew wins!"
When instead the host taps "Guessed right" (another name counts: "Golgappa" for Pani puri)
Then `round-outcome` reads "Arjun steals the round!"
And the app never judges the guess; it records only the tap

## IMP-036: Two impostors (after the play-test)
Status: approved, owner, 2026-10-03
Phase: Impostor later
Given 8 or more players and 2 impostors chosen
Then both impostors see "You're one of 2 impostors" and never who the other is
(The vote and reveal for two impostors are designed after the play-test.)

## IMP-037: Undo the verdict only, before the next round
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given a caught round's result block after "Wrong guess"
Then the result block has the quiet "Undo"
When "Undo" is tapped
Then the result block goes and "Guessed right" / "Wrong guess" show again, with the word still shown; any points of
that verdict are taken back, and the round is no longer completed until a verdict is tapped again (engine `undo`
of the `verdict` record; a "This word didn't work" tapped meanwhile stays)
And "Undo" is offered until "Next round" is tapped or players or choices are changed (`setPlayers`, `setChoices`),
also after the evening is reopened (IMP-091) or after "Oops, keep playing" (IMP-101), and never on an escaped round
And a reveal is never undone (it is protected by "Reveal Arjun", IMP-031), and a deal is never undone (use "Deal
again with a new word")

## IMP-038: "Still a tie": the impostor escapes
Status: approved, owner, 2026-10-03 (detail of IMP-032)
Phase: Impostor 1
Given Arjun is the impostor, the word is Samosa, and the re-vote picker is showing
When "Still a tie" is tapped (t = 0)
Then the reveal screen shows with no build-up and no `drumroll`:
- t = 0: "Still a tie! The impostor was ARJUN. Escaped!"
- t = 1.5 s: "The word was Samosa."
- t = 3.0 s: the result block, headline "Arjun escaped!", main button "Next round"
And the round is escaped (+2 to Arjun when keeping score); there is no last guess and no "Undo"
