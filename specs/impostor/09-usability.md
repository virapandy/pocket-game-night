# 09-usability.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 2.2, 3 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-080: At most one main button, and it is the next step
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then every Impostor screen has at most one element with the main look, `data-testid="main-button"`, and it is the
next step (guideline 17a)
And exactly these have none: "What shall we play?" (cards), screen B until "Done…" appears (hold mode, tap mode and
"See my word again"), the countdown,
the reveal before "Show the word" or before the result block appears, and the verdict step ("Guessed right" /
"Wrong guess" look equal)
And a destructive choice ("End now", "End the evening", "Discard", "Deal again") is never the main button

## IMP-081: Nothing scrolls during a round
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then the deal, clues, talk, countdown, picker, reveal and result screens have no page scrolling at every size, with
names of 16 characters, 3 to 20 players, the practice chip, the timer, and the longest word
("Five more minutes, then phone off": `private-word` fits in 3 lines, IMP-012)
And where content is taller than the screen, these give way, in this order, and nothing else:
1. `clue-order`, the picker's name list and `scoreboard` scroll inside their own boxes (IMP-020, IMP-082, IMP-044);
2. the room-screen names shrink to their floors (IMP-073);
3. on the reveal screen, the reveal lines above the result block scroll inside their own box, kept scrolled to the
   newest line
And the main button stays wholly on screen and fixed at the bottom throughout
And at 812 × 375 the hold screen puts the block on the left and the pad (and "Done…") on the right; the reveal
screen puts the reveal lines on the left and the result block on the right

## IMP-082: Lists of 12 to 20 players
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then at 390 × 844 with Larger text off and names of up to 8 characters, the picker ("Who got the most fingers?")
shows 12 players in two columns with no scrolling at all
And the `scoreboard` on the round result may always scroll inside its own box (the reveal lines above it stay)
And otherwise (13 to 20 players, longer names, Larger text, smaller screens or landscape) each list is two columns
and scrolls inside its own box, the main button stays fixed at the bottom, and the heading or `round-outcome`
stays wholly on screen

## IMP-083: Screen readers
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then `announcer` (`aria-live="polite"`) receives exactly: the clue order (IMP-020), "1 minute left" and "Time's up"
(IMP-024), "3", "2", "1", "Point!" (IMP-030), and each reveal line as it appears (IMP-033, IMP-034, IMP-038)
And the build-up is announced once, as "Arjun was"; its dots, and the `also-called` line, are never announced
And `hold-pad` is a button whose accessible name is its visible text: "Hold here to see your word" (or "Tap to see
your word" / "Tap to hide")
And the player's block is put in `private-live` (`aria-live="assertive"`) only while it is shown on their own turn,
and emptied when it hides (IMP-018); `announcer` never receives a word, hint or role before the reveal

## IMP-084: No flashing
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then sampled every 50 ms through the countdown and the whole reveal, no element's computed background colour
changes more than 3 times in any 1 s window
And the reveal screens for caught, escaped and "Still a tie" have the same `body` background colour

## IMP-085: Kind words
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then no Impostor text (every string in this file, every screen's text) contains, ignoring case, "liar", "loser",
"fooled", "stupid" or "bad clue"
And the result headlines are exactly "The crew wins!", "Arjun steals the round!" and "Arjun escaped!"

## IMP-086: A slipped finger costs nothing
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When a player's finger slips off the pad (`pointerleave` or `pointercancel`) while the block shows
Then the block hides at once, the pad shows again, and the player stays on their screen B
And the phone moves to the next player only on "Done…" (IMP-010); nothing else changes

## IMP-087: The screen stays awake during a round
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then `navigator.wakeLock.request('screen')` is called when a round's first screen A shows, and again on every return
to visible while a round is in progress (guideline 32)
And the lock is released when the round's result block appears (and requested again if "Undo" reopens the verdict)
And when `navigator.wakeLock` is missing or refused, nothing else happens (no message)

## IMP-088: The choices screen at 320 × 568 and in landscape
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then on "How do you want to play?" each group is one row: the label in a 64 px column, then the two options sharing
the rest of the row equally (each at least 48 px tall), with only the selected option's line under it
And option text is 17 px (15 px at 320 px wide; with Larger text 21 px, and 19 px at 320 px wide)
And at 320 × 568 with Larger text off, the four groups, the Categories button and "Start round" show with no page
scrolling
And with Larger text the content above "Start round" may scroll; "Start round" stays fixed at the bottom
And at 812 × 375 the four groups sit in a 2 × 2 grid and "Start round" overlaps none of them (guideline 17b)

## IMP-089: Sounds, vibration and voice
Status: approved, owner, 2026-10-03 (detail of IMP-012, IMP-024, IMP-030, IMP-033)
Phase: Impostor 1
Then the only sounds in Impostor are `tick` (each countdown number), `ding` ("Point!"), `chime` (timer at 0:00) and
`drumroll` (reveal build-up start), played only with sound on, and recorded in `window.__sounds` (Test hooks item 7)
And `chime` and `drumroll` peak gain ≤ `tick`'s peak gain
And no sound plays during the deal (screens A and B) for any role
And vibration is `navigator.vibrate(10)` on each press of the pad only (IMP-012)
And speech is used only for the countdown (IMP-030), only with phone voice on
