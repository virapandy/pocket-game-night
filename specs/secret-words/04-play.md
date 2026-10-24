# 04-play.md: Clues and guesses (rules C3, screens C2)

Copied from `docs/games/secret-words/scenarios.md` (version 3.7, approved by the owner 23 October 2026), the binding contract. Where a scenario ends with a paragraph headed "Version 3.7", that paragraph wins over the text above it, then its "Version 3.6" paragraph. Terms, canonical strings, the menu table and the test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## SWD-040: The clue (P3, P4)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Team bar; heading "Chai Champions, your turn"; `clue-prompt` "Riya, say your clue out loud. How many words is it for?" (pair:
"Nana and Aarav, say your clue out loud. How many words is it for?"); keys; `clue-help` (SWD-118) under the keys; the input
`clue-word` "Clue word (optional)" (`maxlength="24"`, `autocapitalize="off"`; Enter does not submit); `clue-warning` (SWD-101);
the counts; on the evening's first turn of its first game only, the tip; with two or three phones `waiting-line` (SWD-126) and
the recap line (SWD-103); one phone: quiet "See the map again"; from "Change clue" or "Try another clue": quiet "Keep my clue";
quiet "Start 90-second timer"; main.
Keys `clue-key`: portrait 0–4 and 5–9 in two rows, then "∞" full width; each 56 × 56 px (∞ 56 px tall), gaps 2 px at 320 px wide
and 8 px from 360 px up. The "∞" key shows "∞" with the small word "many" under it (SWD-118); accessible name "As many as you
like". A tap selects a key (selected look); another tap moves the pick. Main "Pick a number" (disabled), then "Clue for 2: start
guessing" (0: "Clue for 0: start guessing"; ∞: "Clue for ∞: start guessing"); the word is recorded trimmed, inner spaces and
case kept, and left out when empty (SWD-101).
- "See the map again" (one phone) opens the private map shown, SWD-121's clock starting at that show and a running timer
  carrying on, with main "Back to my clue", which returns here with the number and word kept; nothing is recorded.
- "Keep my clue" (after "Change clue" or "Try another clue") returns to guessing with the clue unchanged; nothing is recorded.
  A reload while changing returns to guessing with the old clue.
- **Layout.** Portrait: one column; the content above the fixed main scrolls inside when needed. At 390 × 844 with Larger
  text off, nothing scrolls with the keyboard closed. When space runs short, these hide in this order: the tip, then
  `waiting-line`, then `clue-help`, then the recap line.
  812 × 375: two columns: the left (heading, prompt, input, warning, counts, tip, waiting line, recap, buttons) scrolls inside;
  the right column, 358 px wide, holds the keys in two rows of 6 (0–5; 6–9 and ∞), each 56 × 56 (∞ too) with 4 px gaps, then
  `clue-help`, above the main. 568 × 320: one column scrolling inside, keys in one row of 11 at 44 × 44 with 4 px gaps, main at
  the bottom right. No-scroll checks are made with the keyboard closed; when the input has focus it is scrolled into view.
**Version 3.6 (owner, 22 October):** `anyone-line` "Anyone can tap the number." (small line) sits under the keys and above `clue-help`, at every size, on the clue screen of the evening's first turn only (also when that screen is shown again by a reload, "Change clue" or "Try another clue" in that turn). It never hides; when the clue screen's content doesn't fit, the content above the main scrolls inside (SWD-040's layout).
**Version 3.9 (product owner, 24 October; for 1.4.1):** **Team names on the counts:** `word-counts` shows each team's name with its icon and number when both fit on one line at the screen's width ("● Chai Champions 9 left · ◆ Coffee Commandos 8 left"); otherwise each name shortens to its first word ("● Chai 9 · ◆ Coffee 8"), and if that still doesn't fit, icons and numbers only, as before. The accessible name is unchanged.

## SWD-041: Guessing and the allowance (P3, P5)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
After the clue (portrait, top to bottom): team bar; top bar with `hurry-timer` (if running) and "··· Menu"; `turn-line`
"Chai Champions guessing" (1 line; at most 2 in the landscape panel; the poker line of SWD-125 for its first 3 000 ms);
`clue-line` and `guess-line` (SWD-118) as one block; `clue-history`; the counts row with the "↻" button (44 × 44, accessible
name "Flip the board") at its right end; the board; the tip or result line (at most 2 lines); the **action slot**; the main
(SWD-122: "Sunita: Reveal").
- **Action slot:** until the turn's first reveal (ending at the "Reveal" tap, t = 0), two quiet buttons side by side, "Change
  clue" and "Clue not allowed?" (half width each, 48 px, labels may wrap onto 2 lines); from the first reveal, quiet "End our
  turn". At turn over (including after `brokeRule`) the slot is empty.
- `clue-line` and `guess-line`: SWD-118. `guess-line` counts down while guesses remain.
- `clue-history`: this team's earlier clues in force in this game, newest first, at most 3: "Earlier: MONSOON 2 · 1 · RAIN ∞"
  (number alone without a word; ∞ as "∞"); not before the team's second clue; replaced clues never show. Shown in portrait when
  `innerHeight` ≥ 700 (Larger text on or off) and in the landscape panel; otherwise hidden. The menu's "Earlier clues" sheet
  always lists every clue in force of this game.
- The first-guess tip (SWD-122) shows in the tip place on the evening's first guessing turn until its first reveal.
- "Change clue" opens the clue screen with the number and word selected; confirming records a new `clue` that replaces the
  turn's clue (announced again); "Keep my clue" returns (SWD-040). "Clue not allowed?" opens the dispute dialog (SWD-124);
  after "Let it go", "Change clue" still works.
- **Fit at 360 × 640 (Larger text off):** team bar 8 + top bar 48 + turn-line 24 + clue block 48 (`clue-line` 22 px, 1 line;
  `guess-line` 15 px, 1 line) + counts row 44 + board (5 × 48 + 4 × 4) 256 + result 42 + action slot 48 + main 60 + bottom 16
  = 594, plus 9 gaps of 4 px = 630 ≤ 640. Shrink order when it doesn't fit: cell height 56 → 48 px, then `clue-line` 22 → 17
  px. Longest content for this fit: an 18-character team name, a 12-character clue word with "∞", a 16-character picker name
  (main on 2 lines at 17 px). A longer clue word wraps onto a 2nd line at 17 px, and the page may then scroll as one with the
  main fixed. With Larger text on at 360 × 640 the page scrolls as one with the main fixed. No page scrolling at 390 × 844
  (Larger text off and on).
  `turn-line` is 17 px, weight 600, not grown by Larger text; the poker line shrinks in 1 px steps to 13 px to stay on 1
  line, and if it still doesn't fit, each name shows its first 8 characters then "…". Longest content adds a pair of
  16-character names in the poker line.
**Property:** no turn records more guesses than its allowance (counted from the turn's last `clue`), no `clue` follows a reveal
in the same turn, and no turn ends by "End our turn" before one guess.
**Version 3.6 (owner, 22 October):** **Top bar and panel rows.** Portrait top bar, right to left: "··· Menu", `pause-button` (44 × 44), `hurry-timer` when it runs. Landscape button row (pause stays here; the timer keeps its own row): 812 × 375 (200 px): "↻" 44, `pause-button` 44, "··· Menu" 104, 4 px gaps; 568 × 320 (160 px): `pause-button` 44, "··· Menu" 112, and "↻" becomes the menu item "Flip the board". **568 × 320 before the first reveal:** `guess-line` sits in the action slot (48 px) and is not in the middle part, which then holds `turn-line`, `clue-line`, counts and the tip or result line; "Change clue" and "Clue not allowed?" stay menu items. From the first reveal the slot holds "End our turn" and `guess-line` returns to the middle part directly under `clue-line`. **360 × 560** (browser bars): the shrink order applies (cells 56 → 48, then `clue-line` 22 → 17); if it still doesn't fit, the page scrolls as one with the main fixed.
**Version 3.7 (owner, 23 October):** The counts row's right-end button is "↻ Flip", 72 × 44 px, in portrait (SWD-102, version 3.7); the counts keep the rest of the row. Landscape panel rows unchanged (icon-only "↻" at 812 × 375).
**Version 3.9 (product owner, 24 October; for 1.4.1):** Counts follow SWD-040's version 3.9 paragraph; in the landscape panel each team is one line, name first word then number.

## SWD-042: Pick, then confirm
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Face-down cells are buttons (`board-cell`, `data-index`, accessible name "Kite, face down", `aria-pressed`). A tap picks
(selected look: outline, ✓, tint; never a team colour); a tap on the picked cell unpicks; a tap on another moves the pick.
Turned-over cells are not buttons. Main "Sunita: Reveal" (disabled) / "Sunita: Reveal <WORD>" (the picker's name, SWD-122).
Tapping it is the guess; anyone may tap it. The pick clears after each guess.
**Version 3.6 (owner, 22 October):** **Tap to zoom (owner, 22 October):** on every board screen (preview, guessing, end-turn line, turn over, game over, History's board), tapping a cell shows `word-zoom`: the word at 28 px, weight 700, in a card with the selected look's outline, centred over that cell and up to 2 cells wide, kept inside the board (shifted in from the edges), above the cell's neighbours. While guessing, the tap also picks the cell as before, and the zoom stays while the cell is picked; it goes when the pick moves, is cleared or the word is revealed. On locked cells and turned-over cells the tap only zooms, for 2 000 ms, then the zoom goes; another tap within that time moves it. The zoom is not a button, carries no information about a face-down word's kind, and has no animation with reduce motion on. The private map and the map phone keep their lists ("Our words", the team lists) for large text instead.

## SWD-043: What a guess does
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
At t = 0 the cell starts a 300 ms turn (none with reduce motion); at t = 300 ms (0 with reduce motion) the cell shows turned
over, the counts update and the result line shows; taps on cells and buttons do nothing until then.

| Word was | Result line | Then |
|---|---|---|
| Own team's, guesses left (clue 1–9) | "✓ Riya's clue works! 2 guesses left." / "✓ Riya's clue works! 1 guess left." | Guessing continues |
| Own team's, clue 0 or ∞ | "✓ Riya's clue works! Keep going, or end your turn." | Guessing continues |
| Own team's, allowance used up | "✓ Riya's clue works! That's all your guesses." | Turn over |
| Nobody's | "Nobody's word. Other team's turn next." | Turn over |
| The other team's | "✗ The other team's word! It counts for them." | Turn over |
| Either team's last word | none | Game over at t = 300 ms: that team wins |
| The Landmine, Lose the game | none | Game over at t = 300 ms: the other team wins |
| The Landmine, Lose your turn | "Boom! The Landmine. Your turn ends and the other team gets a free word." | Turn over; the free word turns over as SWD-046 (seed ``${seeds.deal}:landmine:${D}:${T}``, recorded as the reveal's `freeCell`); if it is that team's last word, game over: that team wins |
"Riya" is the guessing team's clue giver; with a pair, "✓ Nana and Aarav's clue works!" and the same endings (SWD-125). Other
result lines name no team and no person, so every name fits. The last-word and Landmine rows win over the others. With Lose your
turn, the Landmine stays turned over and can't be picked again.
**Version 3.7 (owner, 23 October):** Result line for the kind `nobody`: "Nobody's word. Other team's turn next." (P4).

## SWD-044: Ending the turn early
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
"End our turn" (shown from the turn's first reveal, SWD-041): a tap shows the end-turn line: cells locked, result
line "Chai Champions ended their turn.", quiet "Oops, keep guessing" (back to guessing; nothing recorded), main "Other team's turn"
(records the end of the turn and the next turn). A running timer stops when the line shows.

## SWD-045: Turn over
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Cells locked (not greyed), the result line stays, the clue line, guess line and tip are removed, "End our turn" is hidden, main
"Other team's turn": one phone → the pass screen for the other team's clue giver; two or three phones → the other team's clue
screen.

## SWD-046: A clue that broke a rule
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
The menu item "Clue not allowed?" is enabled from the clue until the turn's first guess; disabled otherwise. It and the board's
quiet "Clue not allowed?" (SWD-041) open the dispute dialog (SWD-124). Its "Turn ends, and one of their words is turned over for them": the turn
ends; `list` = the other team's face-down cells in cell order; cell =
``list[createRng(`${seeds.deal}:penalty:${D}:${T}`).int(list.length)]`` (D = deal number of the evening, T = turn number on
this board); that cell turns over as SWD-043 (vibration 50 ms, the `thud` sound). Result line "The clue broke a rule, so the other team got a free word." and turn over; if it was that team's last word: game over, that team wins.

## SWD-047: Start 90-second timer
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
"Start 90-second timer" (buttons on the pass and clue screens; menu item while guessing) starts the timer `hurry-timer`. Place and
`font-size` (Larger text has no effect): portrait board screens, in the top bar left of "··· Menu", 56 px at 390 × 844 and 40 px
at 360 × 640; landscape board panel, on its own row above "··· Menu", 40 px at 812 × 375 and 568 × 320; the private map's top
right and every other screen, 28 px. "Time's up!" and "Paused" shrink in 1 px steps to fit their place, floor 28 px. It reads
"1:30" at t = 0, "1:29" at t = 1 s, … "0:01" at t = 89 s, and "Time's up!" from t = 90 s (with the chime, sound on); "0:00" never
shows. The button or menu item reads "Stop timer" from the start until tapped (also after "Time's up!"); "Stop timer" removes
the timer. A timer started on the pass screen keeps running on the private map and the clue screen. Nothing else ever happens
because of the timer. It is removed when the clue is given, at the end-turn line, at turn over, on "New board", "End the
game" and game over. When the app is hidden, or on "Pause" (SWD-110), it shows "Paused" and the button or item reads "Start
90-second timer"; it stays "Paused" ("Carry on" does not restart it) until a tap on "Start 90-second timer" restarts it at 1:30
from that tap. It is not saved: after a reload there is no timer.
**Version 3.6 (owner, 22 October):** **Sizes:** the pass screen in portrait with `innerWidth` ≥ 390 and `innerHeight` ≥ 700: 120 px; any other pass screen: 72 px. On the pass screen the timer has its own line directly under the team bar and above the heading, centred, and never hides (SWD-030's content still scrolls inside when short). Board screens in portrait: 56 px when `innerWidth` ≥ 390 and `innerHeight` ≥ 700, otherwise 40 px; board screens in landscape: 40 px; the private map and the clue screen keep 28 px. "Time's up!" and "Paused" shrink in 1 px steps to fit the width, floor 28 px. "Time's up!" plays the chime (sound on) and changes nothing else.

## SWD-048: Reload during play (detail)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Only moves are saved, plus UI state `pgn.secretWords-ui.<id>` = `{ step, angles: { orange: 0 | 180, teal: 0 | 180 }, paused:
boolean, pickerOverride: string | null }` (step: `'preview' | 'scan' | 'pass' | 'map' | 'end-turn' | 'game-over' |
'summary'`; `'game-over'` is saved while the "Game ended · Undo" toast runs, `'summary'` while the summary has not been left,
SWD-060; other steps are read from the moves). A reload returns to the last step with the last reveal's result line, the board
angles, the pause cover if paused (SWD-110) and the picker override of this turn (SWD-122); picks, the selected key, the typed
clue word not yet confirmed, open dialogs and menus, the timer and a shown map are lost; a private map returns to its pass screen
with "Welcome back."; a clue screen opened by "Change clue" or "Try another clue" returns to guessing. A reload with step
`'game-over'` and no `endGame` yet records `endGame` and shows game over without the toast (SWD-054); with step `'summary'` it
records `endGame` (if mid-game) and `endEvening` and shows the summary without "Oops, keep playing" (SWD-060).

## SWD-049: Double taps (detail)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Every button that records a move ignores another tap for 800 ms after a tap; picks and key choices follow the last tap.

## SWD-101: The clue word (P3, C3)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
The `clue` move carries `word` (1–24 characters after trimming), or no `word` at all; replay rejects a longer word.
**Warning (clue screen only):** both the typed text and each face-down word are reduced to their letters a–z: NFKC, lower
case, every other character dropped ("ice-cream" → "icecream", "Taj Mahal" → "tajmahal"). If the typed text keeps at least 3
letters and equals a reduced face-down word, contains one, or is contained in one, `clue-warning` (a paragraph under the input)
reads "Careful: Cricket is a word on the board." for the first such word in `data-index` order (word
text); otherwise it is absent. It updates on every input event and never blocks. Worked cases with Bat and Monsoon face down:
"bat" and "Batsman" warn ("Bat …"); "mon" warns ("Monsoon …"); "ca" never warns; "मानसून" never warns. Words already turned
over never warn.

## SWD-102: Flip the board (P6, flip only)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
The "↻" button (accessible name "Flip the board"; "↻ Flip" on the private map) on every board screen and the private map,
hidden in narrow portrait. Each tap flips the grid 180° (0° ↔ 180°) inside its area, so its words read upright from the other
side of the table; cells keep their `data-index` (at 180°, index 0 is at the bottom right) and are tapped where they show.
`word-board` (and the private map's `map-grid`) carry `data-angle="0"` or `"180"`. 90° is not offered: in portrait a turned
5 × 5 grid gives each word about 40–48 px, too narrow for 8 letters at 12 px (a deviation from P6's 90° steps). The angle is kept
per team colour for the evening (UI state, SWD-048), across games and "Change teams, players, phones or board": a tap on the guessing,
end-turn line or turn-over step changes the guessing team's angle; on the private map, the clue giver's team's; on the preview,
the starting team's; at game over, the angle of the team that played last. A team's angle is applied when its turn starts; turn
over keeps the team that just played.
**Version 3.7 (owner, 23 October):** **The flip (P3):** in portrait the board's button reads "↻ Flip" (icon and word, 72 × 44 px, at the right end of the counts row, which stays 44 px tall); in the landscape panels it stays the 44 × 44 icon (812 × 375) or the menu item "Flip the board" (568 × 320), and the first flip of the evening shows the toast "Board flipped for the other side of the table" (2 s). The 180° turn is instant (no animation) and taps on board cells are ignored for 300 ms after it. Accessible name "Flip the board" everywhere.

## SWD-103: Recap line (P9)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
`recap-line` on the pass screen (one phone) and the clue screen (two or three phones, also when opened by "Change clue" or "Try
another clue"), from the board's second turn (it restarts after "New board"; it shows again after a reload): "Last turn: Coffee
Commandos found 2 words;" (that turn's **found** words, Terms; "found 1 word", "found 0 words") then how the turn ended, the
first that applies: broke a rule → "the clue broke a rule."; the Landmine (Lose your turn) → "they stepped on the Landmine.";
"End our turn" → "they stopped."; allowance used up → "they used all their guesses."; a nobody's word → "Train was nobody's."; the
other team's word (the current team's) → "Train was yours!". Fits in 2 lines (3 with Larger text) at every size with an
18-character team name and an 8-letter word.
**Version 3.6 (22 October):** when the turn's last allowed guess is a nobody's or the other team's word, the ending is that word's line ("Train was nobody's." / "Train was yours!"); "they used all their guesses." applies only when the last allowed guess was the team's own word. The order of the other endings is unchanged.
**Version 3.7 (owner, 23 October):** "Train was nobody's." (P4).

## SWD-104: Do Not Disturb tip (P9)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
`dnd-tip` "Tip: turn on Do Not Disturb so messages don't pop up on the board." on the evening's first deal, on every showing of
its first pass screen (one phone, including after "Welcome back." or a reload) until the evening's first `mapSeen`, or of its
first scan screen (two or three phones) until the evening's first `clue`. Not after "New board" when that
happens later, and not on the "Show the map code again" screen. It never shows together with the "One word, one number" tip.
