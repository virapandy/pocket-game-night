# 08-room-host-and-teach.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.5, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-070: How to play, on request
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then "How to play" never opens by itself
When the host taps the quiet "How to play" on "How do you want to play?", or the menu item "How to play" (IMP-075)
Then a sheet shows the heading "How to play", then the heading "Read this aloud" with these 4 lines in an ordered
list, exactly, in this order:
1. "Everyone sees the secret word except one impostor."
2. "Clockwise, say one word about it. Don't say the word!"
3. "Talk, then on 3, 2, 1 everyone points."
4. "Most fingers is revealed. Caught: the crew wins. Wrong person: the impostor wins."
And under the list, one paragraph by mode: Easy "The impostor sees the category and a hint." / Hard "The impostor
sees nothing and never starts."
And then, only with the last-chance guess on, the paragraph "A caught impostor can steal the round by guessing the
word."
And then the rules of IMP-072
And the main button "Done" closes the sheet and returns to the screen it was opened from, with nothing else changed
(a running timer keeps running, IMP-027)
And the quiet "Practice round first" (IMP-071) shows only when the sheet was opened from the choices screen of a new
evening (not from "Change how we play", IMP-006, and not from the menu)
And the text follows the choices selected on screen when opened from the choices screen, and the evening's current
choices when opened from the menu
And the sheet has no menu button; IMP-013's check holds while it is open

## IMP-071: Practice round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Practice round first" in "How to play" opened from a new evening's choices screen
Then the evening is created with the choices on screen and its first round is a practice round (records
`startDeal {practice: true}`), played exactly like a normal round, with the chip "Practice" (`practice-chip`) at the
top left of its deal, clues, talk, countdown, picker and result screens
And it has no round number (the round after it is round 1); it uses a word (which then counts as dealt tonight,
IMP-051); it counts for the starter cycle (IMP-021) and the impostor streak (IMP-061)
And it scores no points (no `round-points`, no `scoreboard` on its result) and is not in `evening-line`,
the summary line, fun lines or Share's counts
And with the last-chance guess on, a caught impostor in the practice round gets the guess step (IMP-039), scoring
nothing
And after its result, "Next round" deals round 1 with no chip
And a practice round can only be the first round of an evening

## IMP-072: The rules in "How to play" never show secrets
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then after the paragraphs of IMP-070, "How to play" shows an unordered list of exactly these 3 items, in this order,
the same in every mode and setting:
- "Not allowed: the word itself, a rhyme, a translation, or 'thing'."
- "Repeating someone's clue is allowed."
- "Kids may use up to 3 words."
And they never show a word, hint, other name or role (IMP-013)

## IMP-073: Sizes for the phone in the middle of the table
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then at every size, these sizes hold (guideline 46):

| Element | Size | May shrink when | Floor |
|---|---|---|---|
| `starter-name` | 56 px | name over 8 characters, or 320 px wide | 32 px (may wrap onto 2 lines) |
| `talk-heading` | 56 px | 320 px wide | 32 px |
| `pass-name` on screen A | 48 px | name would not fit in 1 line at 48 px | 32 px (may wrap onto 2 lines) |
| `pass-name` on screen B | 48 px | name would not fit in 1 line at 48 px (it never wraps) | 32 px; 20 px in portrait at heights of 640 px or less; a name still too wide at that floor shrinks just enough to fit on one line, never cut off (product owner, 4 October, as built) |
| "Time's up!" (h1) | 40 px | never | 40 px |
| `timer` | 120 px | 320 px wide: exactly 112 px | 112 px |
| `countdown-heading` "Get ready to point…" | 40 px | never | 40 px |
| `timer-label` | 28 px | never | 28 px |
| `countdown-number` "3" "2" "1" | 200 px portrait | 812 × 375: exactly 160 px | 160 px |
| `countdown-number` "Point!" | 96 px | 320 px wide: exactly 72 px | 72 px |
| `private-word` (box 2 lines tall) | 36 px | Larger text on, or word over 20 characters | 30 px |
| `build-up` | 40 px | never | 40 px |
| `result-headline` | 56 px | widths below 360 px, so it stays on one line (product owner, 4 October) | 44 px |
| `result-impostor` | 32 px (may wrap onto 3 lines) | never | 32 px |
| `result-word` | 44 px | word over 12 characters | 32 px (fits in 3 lines) |
| `result-note`, `guess-line` | 20 px | never | 20 px |
| `round-outcome` | 28 px | never | 28 px |
| `deal-progress`, `word-category` | 17 px (21 px with Larger text) | never | 17 px |
| `look-away` | 20 px (24 px with Larger text) | never | 20 px |
| `also-called` | small line | never | 15 px |

And "may shrink" means the size is any value from the floor to the full size; with no listed reason it is exactly the
full size
And every row that may shrink also may shrink, on any row, when the screen's content is taller than the screen
(IMP-081 step 2)

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
Status: approved, owner, 2026-10-04 (changed; detail of IMP-006, IMP-017, IMP-025, IMP-093)
Phase: Impostor 1
Then "··· Menu" (top right) has exactly these items, in this order (the item that ends things last):

| Moment | Items |
|---|---|
| Deal (screens A, B, "No problem!", "Welcome back.") | How to play · Players · Deal again with a new word · Settings · End the evening |
| Clues, talk (Free flow or Timer), picker | How to play · Players · See my word again · Deal again with a new word · Settings · End the evening |
| Round result (between rounds), no-words screen (IMP-052) | How to play · Players · Change how we play · Settings · History · End the evening |
| "left halfway" screen (IMP-091) | How to play · Players · Settings · History · End the evening ("Players" shows only "Change players after this round." and "OK"; product owner, 4 October) |

And there is no menu button on "How to play", the countdown screen, during "See my word again", on the summary,
during the 1.5 s build-up, nor during the last-chance guess's guess and verdict steps (IMP-039); the result screen
has it (between-rounds items) once the round is completed
And History opened from the between-rounds menu has "← Back", which returns to the same screen
And there is no "← Back" during a round; the browser's or phone's Back button during a round keeps the same
screen and changes nothing


## IMP-076: More options: the last-chance guess
Status: approved, owner, 2026-10-04 (changed; detail of IMP-005)
Phase: Impostor 1
When the host taps the quiet "More options ›" on "How do you want to play?"
Then a sheet shows the heading "More options", the group "Last guess for a caught impostor" with two option buttons
"Off" and "On" (one selected: outline, ✓, tint, `aria-pressed="true"`; never the main look), the small line "A
caught impostor can steal the round by guessing the word." under them, and the main button "Done"
And the selected option shows the choice on screen: off on this phone's first ever evening; otherwise from the last-used
choices (IMP-009), or the evening's choices in "Change how we play" and "Play again"
When "On" is tapped and then "Done"
Then the choice on screen becomes `lastGuess: true`; it is saved with the other choices when "Start round" is tapped
(`setChoices` between rounds, IMP-006); the button text "More options ›" does not change
And a change applies only on "Done"; closing the sheet any other way (tapping outside it, the browser's or phone's
Back) discards the change
And "Include non-veg food" stays in the Categories sheet (IMP-007)
And the setting changes exactly these and nothing else: the impostor's private line 4 (IMP-011), the guess step
(IMP-033, IMP-039, IMP-071), Undo (IMP-037), the +1 to the impostor (IMP-041, IMP-044), the menu during the guess
and verdict steps (IMP-075), the main look on the verdict step (IMP-080), the wake lock release (IMP-087), reopening
during the guess (IMP-091), the verdict kept in History (IMP-094, IMP-105), and the paragraph "A caught impostor can
steal the round by guessing the word." in "How to play" (IMP-070)

---
