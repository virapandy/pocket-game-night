# 09-usability.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.9, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-080: At most one main button, and it is the next step
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then every Impostor screen has at most one element with the main look, `data-testid="main-button"`, and it is the
next step (guideline 17a)
And exactly these have none: "What shall we play?" (cards), screen B until "Done…" appears (hold mode, tap mode and
"See my word again"), the countdown,
the 1.5 s build-up, the verdict step of the last-chance guess ("Guessed right" / "Wrong guess" look equal), and the "Start a new game?"
dialog (IMP-001)
And a destructive choice ("End now", "End game", "Discard", "Deal again") is never the main button

## IMP-081: Nothing scrolls during a round, except the result screen
Status: approved, owner, 2026-10-06 (changed)
Phase: Impostor 1
Then the deal, clues, talk, countdown and picker screens have no page scrolling at every size, with names of 16
characters, 3 to 20 players, the practice chip, the timer, and the longest word ("Mummy finding it in two seconds":
`private-word` fits in 2 lines, IMP-012)
And where content on those screens is taller than the screen, these give way, in this order, and nothing else:
1. `clue-order` and the picker's name list scroll inside their own boxes (IMP-020, IMP-082);
2. the room-screen names shrink to their floors (IMP-073)
And the result screen (and the summary, IMP-092) scrolls as one page (guideline 46a): the main button stays pinned at
the bottom; no element inside has its own scroll area; when the screen appears it is scrolled to the top (after the
last-chance guess's verdict: scrolled so `round-outcome` is wholly in view)
And the main button stays wholly on screen and fixed at the bottom on every screen
And every Impostor screen with pinned buttons gives its scrolling content a bottom padding equal to the pinned area's
height (main button 60 + 16 = 76 px; the stacked "End game" row at 320 px wide 132 px; the summary 76 px), so the
last line of content can always be scrolled fully above the pinned buttons; nothing is ever hidden under them
And at 812 × 375 with 5 and with 12 players: the picker shows its heading and names in the left half (5 players: 48 +
70 + 3 rows × 64 = 310 px ≤ 375; 12 players: the names box scrolls inside) and "Not sure?", the text buttons and the
main button in the right half (48 + 24 + 48 + 76 + 2 × 8 = 212 px); the result screen and the summary scroll as one
page with the 76 px bottom padding, so every scoreboard row, a `round-outcome` with a 16-character name, and "Home" can be scrolled
into view; the Players sheet scrolls as one page with the field and "Add" reachable above its pinned "Done"; "Whose
word?" shows its names in two columns in a box that scrolls inside (5 players: 3 rows × 64 = 192 px; 12 players: 6
rows, scrolls) with "Cancel" pinned at the dialog's bottom, always visible
And at 812 × 375 the hold screen puts the block on the left (its layer also covers the whole top bar, menu button
included, IMP-010) and the pad, "Not Riya? ← Back" and "Done…" on the right ("Tap instead" and "Don't know this word?" under the name
on the left); the result
screen puts `result-headline`, `result-note`, `result-impostor`, the word, `also-called`, the chip and
`round-outcome` in the left half, and `evening-line` or `round-points` with the scoreboard, and the quiet buttons, in
the right half; the guess and verdict steps of IMP-039 do the same (lines and word left; "Arjun guessed. Show the
word", "Guessed right" and "Wrong guess" right)

## IMP-082: Lists of 12 to 20 players
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then at 390 × 844 with Larger text off and names of up to 8 characters, the picker ("Who got the most fingers?")
shows 12 players in two columns with no scrolling at all (arithmetic in IMP-031)
And otherwise (13 to 20 players, longer names, Larger text, smaller screens or landscape) the picker's names are two
columns and scroll inside their own box, the main button stays fixed at the bottom, and the heading stays wholly on
screen
And at 812 × 375 the layout is IMP-031's (heading and names box left; "Not sure?", the text buttons and the main
button right)
And the scoreboard follows IMP-044 (one or two columns; never its own scroll area)

## IMP-083: Screen readers
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then `announcer` (`aria-live="polite"`) receives exactly these, and nothing else:
- the clue order (IMP-020);
- "1 minute left" and "Time's up" (IMP-024);
- "3", "2", "1", "Point!" (IMP-030);
- "Arjun was…" once, at t = 0 of the build-up (IMP-033);
- at t = 1.5 s (at t = 0 after "Still a tie", IMP-038), in screen order: `result-headline`, `result-note` (when
  shown), `result-impostor`, "The word was Samosa" (`word-label` and `result-word` as one announcement) and
  `round-outcome` (IMP-033, IMP-034, IMP-038); with the last-chance guess: `result-headline`, `result-impostor` and
  `guess-line` (IMP-039);
- with the last-chance guess, after "Arjun guessed. Show the word": "The word was School trip"; after a verdict:
  `round-outcome`
And `also-called`, `word-category`, `deal-progress`, `look-away`, `evening-line` and `round-points` are never
announced
And `hold-pad` is a button whose accessible name is its visible text: "Hold here to see your word", "Let go to hide"
while held (or "Tap to see your word" / "Tap to hide")
And the player's block is put in `private-live` (`aria-live="assertive"`) only while it is shown on their own turn,
and emptied when it hides (IMP-018); `announcer` never receives a word, hint or role before the result screen
shows the word

## IMP-084: No flashing
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then sampled every 50 ms through the countdown, the build-up and the first 3 s of the result screen, no element's
computed background colour
changes more than 3 times in any 1 s window
And the result screens for caught, escaped and "Still a tie" have the same `body` background colour ("✓" and "✗" are
text, with no coloured background)

## IMP-085: Kind words
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then no Impostor text (every string in this file, every screen's text) contains, ignoring case, "liar", "loser",
"fooled", "stupid" or "bad clue"
And no Impostor screen shows the words "evening", "night" or "session" (case-insensitive, whole word) in its own
text; the word list's words, other names and hints (for example the hint "Late night") are not counted
And no Impostor screen shows the words "crew" or "steal" in its own text (M24)
And the `round-outcome` lines are exactly "You caught the impostor!", "Arjun wins the round!" and "Arjun escaped!"; the
`result-headline` is exactly "✓ Caught!" or "✗ Escaped!"

## IMP-086: A slipped finger costs nothing
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When a player's finger slips off the pad (`pointerleave` or `pointercancel`) while the block shows
Then the block hides at once, the pad shows again, and the player stays on their screen B
And the phone moves to the next player only on "Done…" (IMP-010); nothing else changes

## IMP-087: The screen stays awake during a round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then `navigator.wakeLock.request('screen')` is called when a round's first screen A shows, and again on every return
to visible while a round is in progress (guideline 32)
And the lock is released when the round is completed: at t = 1.5 s of the result screen (IMP-033, IMP-034), at once
on "Still a tie" (IMP-038), or, with the last-chance guess, on the verdict tap (IMP-039)
And it is requested again when "Undo" reopens the verdict (IMP-037), and released again on the next verdict
And when `navigator.wakeLock` is missing or refused, nothing else happens (no message)

## IMP-088: The choices screen at 320 × 568 and in landscape
Status: approved, owner, 2026-10-06 (changed)
Phase: Impostor 1
Then on "How do you want to play?" each group is one row: the label in its own column, then the two options sharing
the rest of the row equally, 8 px apart (each at least 48 px tall), with only the selected option's line under it;
every label ("Mode", "Talking", "Score", "Words") fits on one line in its column and never sits behind an option
And widths: label column 88 px at 360 × 640, 390 × 844 and 812 × 375, 72 px at 320 × 568; options at 390 × 844:
(390 − 32 − 88 − 8 − 8) / 2 = 127 px each; at 360 × 640: 112 px each; at 320 × 568: (320 − 32 − 72 − 8 − 8) / 2 =
100 px each; at 812 × 375 (2 × 2 grid, each group cell (812 − 32 − 16) / 2 = 382 px): (382 − 88 − 16) / 2 = 139 px
each
And label and option text are 17 px (15 px at 320 px wide); with Larger text 19 px (17 px at 320 px wide); "Whole
family" fits on one line inside its 48 px-tall button at every size
And at 320 × 568, with Larger text on or off, the content above "Start round" (the four groups, the Categories
button and the row "More options ›" / "How to play") may scroll inside its own box; at the other sizes it scrolls
inside that box only with Larger text on; "Start round" stays fixed at the bottom and the page never scrolls
And at 812 × 375 the four groups sit in a 2 × 2 grid and "Start round" overlaps none of them (guideline 17b)

## IMP-089: Sounds, vibration and voice
Status: approved, owner, 2026-10-03 (detail of IMP-012, IMP-024, IMP-030, IMP-033)
Phase: Impostor 1
Then the only sounds in Impostor are `tick` (each countdown number), `ding` ("Point!"), `chime` (timer at 0:00) and
`drumroll` (start of the 1.5 s build-up after "Reveal …"), played only with sound on, and recorded in `window.__sounds` (Test hooks item 7)
And `chime` and `drumroll` peak gain ≤ `tick`'s peak gain
And no sound plays during the deal (screens A and B) for any role
And vibration is `navigator.vibrate(10)` on each press of the pad only (IMP-012)
And speech is used only for the countdown (IMP-030), only with phone voice on

---
