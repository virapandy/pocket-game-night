# 08-room-host-and-teach.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 2.2, 3 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-070: The read-aloud card, once a session
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the first Impostor evening of tonight's session
When "Start round" is tapped
Then the card shows the heading "Read this aloud" and these 4 lines, in an ordered list, exactly:
1. "Everyone gets the same secret word, except the impostor."
2. "Take turns to say one word about it. Don't say the word!"
3. "Then talk, and all point at who you think the impostor is."
4. "Impostor: blend in. Caught? Guess the word to steal the round."
And the main button "Start the deal" (starts round 1's deal) and the quiet "Practice round first" (IMP-071); both
are recorded as `startDeal`
And the card shows before the practice round when there is one, and not again before round 1
And it does not show for any later Impostor evening of the same session, whatever happened to the evening it was
shown for (ended, discarded or unfinished): "Start round" goes straight to the deal (the app records
`startDeal {practice: false}` itself)
And the card has no menu button; "← Back" returns to "How do you want to play?" and the evening stays created
(unfinished, IMP-001)

## IMP-071: Practice round
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Practice round first"
Then the next round is a practice round, played exactly like a normal round, with the chip "Practice"
(`practice-chip`) at the top left of its deal, clues, talk, countdown, picker, reveal and result screens
And it has no round number (the round after it is round 1); it uses a word (which then counts as dealt tonight,
IMP-051); it counts for the starter cycle (IMP-021) and the impostor streak (IMP-061)
And it scores no points (no `round-points`, no `scoreboard` on its result) and is not in `evening-line`,
the summary line, fun lines or Share's counts
And after its result, "Next round" deals round 1 with no card and no chip

## IMP-072: Rules mid-game never show secrets
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When anyone opens "Rules" from the menu
Then a sheet shows the heading "How to play", these lines for **Easy**, each its own paragraph, exactly:
"1. Everyone sees the same secret word, except the impostor, who sees only the category and a hint." ·
"2. Take turns clockwise. Say one word about the secret word." ·
"3. Not allowed: the word itself, a rhyme, a translation, or 'thing'. Repeating someone's clue is allowed." ·
"4. Talk it over, then everyone points at once on 3, 2, 1." ·
"5. Caught? The impostor gets one guess at the word to steal the round." ·
"Kids may use up to 3 words."
And for **Hard**, line 1 reads "1. Everyone sees the same secret word, except the impostor, who sees nothing." and
the paragraph "The impostor never starts." comes between lines 2 and 3; the rest is the same
And the main button "Done" closes the sheet and returns to the same screen with nothing else changed
And IMP-013's check holds while it is open (no word, hint, other name or role)

## IMP-073: Sizes for the phone in the middle of the table
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then at every size, these sizes hold (guideline 46):

| Element | Size | May shrink when | Floor |
|---|---|---|---|
| `starter-name` | 56 px | name over 8 characters, 320 px wide, or 812 × 375 | 32 px (may wrap onto 2 lines) |
| `talk-heading` | 56 px | 320 px wide | 32 px |
| `pass-name` | 48 px | name would not fit in 1 line at 48 px | 32 px (may wrap onto 2 lines) |
| `timer` | 120 px | 320 px wide: exactly 112 px | 112 px |
| `countdown-number` "3" "2" "1" | 200 px portrait | 812 × 375: exactly 160 px | 160 px |
| `countdown-number` "Point!" | 96 px | 320 px wide: exactly 72 px | 72 px |
| `private-word` | 36 px | Larger text on, or word over 20 characters | 30 px |
| `reveal-line`, build-up and first line of an outcome | 28 px | never | 28 px |
| `reveal-line`, other lines | 20 px | never | 20 px |
| `round-outcome` | 28 px | never | 28 px |

And "may shrink" means the size is any value from the floor to the full size; with no listed reason it is exactly the
full size

## IMP-074: Late joiner and someone leaving
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given a round result is showing (between rounds)
When the host opens the menu, taps "Players", and adds Zoya
Then the sheet "Players" (the list, field and buttons of IMP-003, with its limits) shows Zoya at the end; ▲ ▼ move
her to her seat; the main button "Done" closes the sheet and records one `setPlayers` with the final list (nothing
is recorded when the list is unchanged); she is dealt in from the next round, at 0 points when keeping score (or
with her old total when she had left earlier, IMP-044)
When the host taps ✕ next to Kabir
Then he is removed at once and the toast reads "Kabir left · Points kept · Undo" (keeping score) or "Kabir left ·
Undo" (not keeping score), for 5 s inside the sheet; "Undo" puts him back in the same seat; tapping "Done" while
the toast shows closes the toast with the sheet (he stays removed)
And his points stay on the scoreboard, greyed (IMP-044)
And with 3 players, tapping ✕ removes nobody and shows "Keep at least 3 players."
When "Players" is opened from the menu during a round (deal, clues, talk or picker)
Then a dialog shows only "Change players after this round." and the main button "OK", which closes it with nothing
changed

## IMP-075: The menu at each moment
Status: approved, owner, 2026-10-03 (detail of IMP-006, IMP-017, IMP-025, IMP-093)
Phase: Impostor 1
Then "··· Menu" (top right) has exactly these items, in this order (the item that ends things last):

| Moment | Items |
|---|---|
| Deal (screens A, B, "No problem!", "Welcome back.") | Rules · Players · Deal again with a new word · Settings · End the evening |
| Clues, talk (Free flow or Timer), picker | Rules · Players · See my word again · Deal again with a new word · Settings · End the evening |
| Round result (between rounds), "left halfway" screen, no-words screen (IMP-052) | Rules · Players · Change how we play · Settings · History · End the evening |

And there is no menu button on the read-aloud card, the countdown screen, during "See my word again", on the
summary, nor on the reveal screen from "Reveal …" (or "Still a tie") until its result block appears
And History opened from the between-rounds menu has "← Back", which returns to the same screen
And there is no "← Back" during a round; the browser's or phone's Back button during a round keeps the same
screen and changes nothing
