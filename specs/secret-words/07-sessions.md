# 07-sessions.md: Sessions and behaviour (version 3.3) (C2; SWD-118, 123, 125, 127, 129 C3)

Copied from `docs/games/secret-words/scenarios.md` (version 3.7, approved by the owner 23 October 2026), the binding contract. Where a scenario ends with a paragraph headed "Version 3.7", that paragraph wins over the text above it, then its "Version 3.6" paragraph. Terms, canonical strings, the menu table and the test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).
Binding. Version 3.4 edited every earlier scenario these change, so the two agree. Sources: W1–W20, E1–E25, B1–B12; decisions
K32–K41.

## SWD-110: Pause (E1)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Menu "Pause" at the preview, scan screen, pass screen, clue screen, guessing, end-turn line and turn over (not at game over,
not on the private map, which has its own exits, SWD-113). It opens `pause-cover`, `role="dialog"` covering the screen, named
"Paused" by its heading "Paused"; line "Tap Carry on when you're ready."; main "Carry on". While paused: the screen-on lock
is released (re-acquired on "Carry on" where the step holds it); a running timer shows "Paused" and stays so until "Start
90-second timer" is tapped (SWD-047); on the scan screen the QR is removed from the DOM. "Carry on" returns to the same step
(it does not restart SWD-114's guards). Nothing is recorded. A reload while paused returns to the step with the cover shown
(SWD-048).
**Version 3.6 (owner, 22 October):** `pause-button` (icon button, accessible name "Pause", 44 × 44, our own SVG) on the preview, the scan screen, the pass screen, the clue screen, guessing, the end-turn line and turn over; placement SWD-041 (board screens) and directly left of "··· Menu" elsewhere; a tap does what the menu's "Pause" does. Not on the private map. **Menu groups:** play (Earlier clues · Start 90-second timer / Stop timer · Clue not allowed? · Change clue (568 × 320) · Flip the board (every board screen at 568 × 320) · Someone else taps Reveal · Players · Show the map to a clue giver · Show the map code again) · fix (New board) · leave (Pause · Home (keep this game) · End the game · End for tonight) · more (How to play · Settings · History); a 1 px `--border` rule (`role="separator"`) between groups that have items. **`where-line`** (small line, at most 2 lines, names never shortened) is shown under "Welcome back.", on the Pause cover under "Paused", and in Home's row and the resume card (SWD-115), for the step the game is on: preview "Before game 2"; scan screen "Scan the map, game 2"; pass screen, private map and clue screen "Turn 4 · clue for Chai Champions"; guessing "Chai Champions guessing · 3 guesses left" (the full allowance before the first reveal, then what is left; "1 guess left"; clue 0 or ∞ "Chai Champions guessing · as many as you like"); end-turn line "Turn 4 · Chai Champions ended their turn"; turn over "Turn 4 over · Coffee Commandos next"; game over "Game over, game 2"; summary "Game night over". Setup steps are never resumed (the evening starts at its first deal), so they have none.
**Version 3.7 (owner, 23 October):** **Menu order (P2):** "Pause" is always the first item of every game menu that has it (before the play group). "New board" is its own group, always directly above the leave group, so it is always in the same place counted from the bottom. The menu sheet scrolls inside with its "Done" pinned at the bottom; while more items are below the fold, a 24 px fade shows at the list's bottom edge. Group order otherwise as 3.6.

## SWD-111: Home during a game (E1, W2)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
At game over, quiet "← Home" (SWD-112) opens Home. At every other game step from the preview to turn over, the menu item "Home
(keep this game)" opens Home at once (no dialog). The game stays unfinished and resumes from Home's row or the picker's resume
card (SWD-115) at the same step. Phone Back still does nothing during a game.

## SWD-112: Game over: what next (W2, W4, E13, B4, B8)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Game over shows, in this order: heading and line (SWD-051, SWD-054); the board (SWD-051); `near-miss` and `best-clue` (SWD-128); the tally;
`next-clue-givers` "Next clue givers: Meena and Kabir" (SWD-007's suggestion, the orange team's first; a pair "Next clue
givers: Nana + Aarav and Kabir") with quiet "Swap clue givers"; quiet "Change teams, players, phones or board"; quiet "End for tonight"; quiet "←
Home"; main "Play again".
- **"Swap clue givers"** opens the Clue givers sheet (SWD-007, 014, 123) for the next game; "Done" updates `next-clue-givers`. Nothing is
  recorded until "Play again": switch changes then record `setTeams`, clue-giver and partner changes `setClueGivers`.
- **"Change teams, players, phones or board"** opens Who's playing? with tonight's names, whose "← Back" reads "← Back to the game"
  and returns to game over; then Make teams (SWD-004, without "New team names") and Choices, with their normal "← Back".
  Nothing changes until "Start the game" (no read-aloud), which records the changes and deals (tap → move table).
- **"End for tonight"**: SWD-060. **"← Home"**: SWD-111. **"Play again"**: SWD-053.

`next-clue-givers` counts a game ended by "End the game" as ended early from the moment game over shows; it does not
change when `endGame` is recorded, and "Undo" discards it. Team bar at game over: the winning team's bar; ended early: no team
bar.
**Version 3.7 (owner, 23 October):** **Game over's bottom bar (P1, guideline 47a):** both quiet "End for tonight" and main "Play again" move out of the scrolling list into a pinned bottom bar (16 px side margins, 16 px from the bottom). Side by side when `innerWidth` ≥ 360 and Larger text is off: the width after the 8 px gap is split 40 / 60 (at 360 px: 125 and 187 px; at 390 px: 137 and 205 px), both 60 px tall; "End for tonight" is an exception to the Terms' 48 px quiet height and its label may wrap to 2 lines at 15 px. Otherwise (narrow portrait, or Larger text on) they stack full width, "End for tonight" above "Play again", 60 + 8 + 60 = 128 px. Landscape: stacked in the landscape main area (358 px wide), 128 px tall. The rest of SWD-112's order (heading … "← Home") scrolls above the bar.

## SWD-113: The private map: wrong person and someone looking (E6, E8, E5)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Before the first show, the private map has quiet "Not Riya? Go back" (pair "Not Nana and Aarav? Go back"): it returns to the
pass screen (without "Welcome back."); nothing recorded. While the map shows: quiet "Someone saw the map" removes the map from
the DOM and opens the New board dialog (SWD-055); "Keep playing" returns to the private map with the map hidden (pad "Tap to see
the map"); "New board" deals. "I'm Riya" ignores taps for 1 s after the pass screen appears (SWD-114).

## SWD-114: Taps right after a screen appears (E7, W11, K35)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Every main button ignores taps for 800 ms after its screen appears (Terms: Screen mounts; a reload mounts; closing a dialog,
"Carry on" and "Welcome back." don't restart it), in addition to SWD-049. Exceptions, which win over the 800 ms: "I'm Riya" /
"We're Nana and Aarav" ignores taps for 1 s; "Other team's turn" after a turn-ending reveal ignores taps for 1.5 s counted from
t = 300 ms (the word shown turned over, SWD-043). Quiet buttons are not affected. **While a main button's guard runs it shows the greyed look (Terms) and becomes live when the
guard ends** (v3.5 item 2); a tap during the guard does nothing and is not queued. Tests may check both looks.
**Version 3.6 (owner, 22 October):** **Which buttons wait:** 1 s: "I'm Riya" / "We're Nana and Aarav". 1.5 s: "Other team's turn" after any turn-ending reveal, counted from t = 300 ms of that reveal; after "Turn ends, and one of their words is turned over for them", counted from t = 300 ms of the free word's turn (SWD-046). 800 ms: every other main button of a screen, sheet, dialog or cover, including "Carry on" (from the Pause cover appearing), "Keep playing", "Let it go", "Done", "Start the game", "Play again", "No, keep the board", and "Other team's turn" on the end-turn line (from that line showing). **Mounts:** opening a dialog, sheet or cover starts its own main's wait; closing one does not restart the wait of the screen beneath (Terms). **Look and hook:** while waiting, the main shows the greyed look with its own label unchanged and has `aria-disabled="true"` and `data-guard="on"`; a main disabled for another reason ("Sunita: Reveal" with no pick, "Pick a number") keeps its disabled label and look and never has `data-guard`. Quiet buttons never wait.

## SWD-115: Home rows, Start new and next day (E18, K37)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
- **Unfinished row** (in `unfinished-games`): "Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1" (the game
  night's start, phone's local time, "pm" lower case, no leading zero; score = the tally, orange first; "0–0" before any won
  game) and "Tap to resume". **Picker resume card** `resume-card`: "Secret Words · Chai Champions v Coffee Commandos · 2–1 · Tap
  to resume".
- **Start new** (tapping the Secret Words picker card with an unfinished game night): dialog `role="dialog"` named "Start a new
  game night?", heading "Start a new game night?" and paragraph "The game night from 8:40 pm (Chai Champions v Coffee Commandos, 2–1) will end.", with
  two equal quiet buttons in this order "Carry on that one", "Start new (ends that one)" and no main (Terms: Dialog exception).
  Shown once per tap of the card. "Start new (ends that one)": SWD-067.
- **Next day:** `last-night` "Last game night: Chai Champions 2 · Coffee Commandos 1" with button "Play again with these teams",
  for the most recent ended (recorded `endEvening`), not deleted Secret Words game night with at least 1 game, while now − its
  `endEvening` time < 129 600 000 ms (36 h); shown under the unfinished rows; only the newest one. The button (after the Start
  new dialog first, if a game night is unfinished) opens Make teams with the same players, teams, team names (reused, no "New
  team names"; overrides SWD-013's draw) and "Doesn't give clues" switches; Make teams' "← Back" → Who's playing? with those
  names; then Choices as SWD-009 ("Same as last time"); "Start the game" starts a new game night with its own tally.
- Home's own menu gains "History" (SWD-064).
**Version 3.6 (owner, 22 October):** Home's unfinished row and the picker's resume card become three lines (replacing their one-line strings): line 1 "Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1" (row) / "Secret Words · Chai Champions v Coffee Commandos · 2–1" (card); line 2 `where-line` (SWD-110); line 3 "Tap to resume". The accessible name is the three lines joined with " · ".

## SWD-116: Board check by words (W1)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
The map phone shows `first-words` "First words: Cricket · Bat · Monsoon" (the words of cells 0, 1, 2). The host's scan screen
shows `board-check`, the first wording that applies (example words of the next board: Kite · Tiffin · Rain):
1. The evening's first deal, or the first deal after "How many phones?" changed (SWD-112): two phones "The map phone should start with: Cricket · Bat · Monsoon"; three phones "The map
   phones should start with: Cricket · Bat · Monsoon".
2. A deal with a new deck (SWD-024): two phones "New code: scan again. The map phone should start with: Kite · Tiffin · Rain";
   three phones "New code: scan again. The map phones should start with: Kite · Tiffin · Rain".
3. The next deal of the same deck, clue givers (with partners) different from the previous deal's: two phones "Hand the map
   phone to Meena and Kabir, tap Next map, and check it starts with: Kite · Tiffin · Rain"; three phones "Meena and Kabir: scan this code on your phones and check they start with: Kite · Tiffin · Rain. Riya and Arjun: tap Done with this game." (names = this deal's clue givers, orange first; a
   pair "Nana + Aarav").
4. The same, clue givers unchanged: two phones "Tap Next map on the map phone and check it starts with: Kite · Tiffin · Rain";
   three phones "Tap Next map on both map phones and check they start with: Kite · Tiffin · Rain".
The "Show the map code again" screen (SWD-129) shows wording 1's form with the current board's words. Next map's toast: "Next
map. It should start with: Kite · Tiffin · Rain." (SWD-039).
**Version 3.6 (owner, 22 October):** **Three phones, clue givers changed (D1):** wording 3 for three phones is "Meena and Kabir: scan this code on your phones and check they start with: Kite · Tiffin · Rain. Riya and Arjun: tap Done with this game." First names: this deal's clue givers; second: the previous deal's clue givers who are not clue givers now (orange first in each list; two names "A and B", three or more "A, B and C"; a pair "Nana + Aarav"). If the second list is empty, its sentence is dropped. Two phones keep "Hand the map phone to Meena and Kabir, tap Next map, and check it starts with: …". Wording 4 (unchanged) stays. `mismatch-line` (SWD-033) follows every wording, also on the "Show the map code again" screen (SWD-129).

## SWD-117: Team names on the map phone (W5, C3 for the QR format)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
The scan QR is `<origin><BASE_URL>#map=27P3QX8&t=SWDT-01` (`t` = the game night's pair id, `team-names.csv` column `id`), plus `&p=own` with three phones (v3.5 item 7: the map phone then shows `my-team` on first opening; a typed code never does). A map
phone opened from it saves `t` (SWD-036; kept by "Next map"; the Join scanner, SWD-133, reads it too) and shows under the heading
`map-teams` "Chai Champions (orange) · Coffee Commandos (teal)" and `map-code-line` "Host's code 27P-3QX8 · Chai Champions go first" (the
starting team's name). A typed code, or an unknown `t` (ignored), shows no `map-teams` and "Host's code 27P-3QX8 · Orange team goes first"
("Teal team goes first"). Team icons stay SVG (Terms); no "●" or "◆" characters.
**Version 3.6 (owner, 22 October):** The QR gains `&p=own` with three phones; without it the map phone treats the map as two phones (no `my-team`, SWD-034).

## SWD-118: Clue numbers explained (W6, C3 for the moves' view)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Under the keys, `clue-help` "2 means up to 3 guesses. 0 or ∞: as many as you like."; the ∞ key shows "∞" over the small word
"many". The board shows `clue-line` (22 px, weight 700, 1 line, not grown by Larger text; shrinks in 1 px steps to 17 px, SWD-041)
with a word "CRICKET · 2" (DOM "Cricket · 2", the word as typed, upper case by CSS; ∞ "CRICKET · ∞"), with no word "Clue: 2" ("Clue:
0", "Clue: ∞"); and under it, as one block, `guess-line` (15 px, 19 px with Larger text, 1 line): "3 guesses left (2 + 1
extra)" (clue 1: "2 guesses left (1 + 1 extra)"; clue 9: "10 guesses left (9 + 1 extra)") before the turn's first reveal, then
"2 guesses left", "1 guess left"; for 0 and ∞ "Guess as many as you like".

## SWD-119: Setup words (W7, W15)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
On Choices, `start-hint` "Pick how many phones to start." (small line) shows directly **above** the main "Start the game" while
it is disabled. With 9 or more players, `big-group-hint` "Big group? The Easy board is easier to read." (small line) shows under
the Board group. The Landmine choice: a saved `lastChoices.landmine` wins; with none, K33's default: "Lose your turn" with Whole
family, "Lose the game" with + Harder words, updated whenever Words changes until the host taps a Landmine option in this setup.

## SWD-120: Map phone kindness (W12, W17, B10)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
The map phone's small line reads "Tap a word when it's found to fade it (optional). The host's board is what counts." While the map shows, three quiet buttons "Orange team's words" / "Teal team's words" / "Whole map": a list replaces the grid
with `map-list`: h2 "Orange words (6)" / "Teal words (5)" (that colour's words not faded on this phone, the count in brackets),
each word an `li` at 24 px (28 px with Larger text) in `data-index` order, then `avoid-line` "Never guess: Shadow (the Landmine)" (none on
Easy); words in a list can't be tapped to fade; "Whole map" returns to the grid. It always shows `map-end-line` "Game over: tap Done with this game. New board on the host: tap Next map." The map hides by SWD-121.
**Version 3.6 (owner, 22 October):** List buttons "Orange team's words" / "Teal team's words" / "Whole map", ordered and laid out as SWD-034. `map-end-line` text: SWD-034 (replaces the text above).
**Version 3.7 (owner, 23 October):** The current view's button is pressed (SWD-034, P9).

## SWD-121: Maps hide after 60 seconds (K36)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
On the private map and the map phone, the clock starts when the map is shown (a tap on the pad, any opening of the map phone (scan, link, typed code, Home's saved map), "Next
map", "Show map", "See the map again", SWD-037) and restarts on each `pointerdown` on that screen. From 50 000 ms,
`hide-warning` (`role="status"`) "Still looking? Tap to keep the map" shows over the map; while it shows, the first
`pointerdown` only restarts the clock (it doesn't press a button or fade a cell) and removes the warning. At 60 000 ms the map
is removed from the DOM: the private map shows the pad "Tap to see the map"; the map phone shows "Show map" and releases the
screen-on lock.

## SWD-122: The picker (B1, B11, K38)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Each guessing turn has a **picker**. `guessers` = the team's current players minus this game's clue giver and partner, in team
list order, taken when the turn's `clue` is recorded (later player changes don't affect this turn). Picker = `guessers[r mod
guessers.length]`, r = that team's earlier guessing turns on this board (a turn counts once its `clue` is recorded, even if a
dispute ended it before any guess); r restarts at each deal. The room view carries `picker: string | null` (computed; null
outside guessing). Menu "Someone else taps Reveal" (guessing; hidden when the team has 1 guesser) opens dialog "Who taps Reveal this turn?" with
one button per guesser (`aria-pressed` on the current picker) and quiet "Cancel"; a name sets the picker for this turn only (UI
state `pickerOverride`, SWD-048) and closes; rotation is unaffected. `turn-line` stays "Chai Champions guessing" (no picker in
it). The main reads "Sunita: Reveal" (disabled, no pick) / "Sunita: Reveal LAMP" (DOM "Sunita: Reveal Lamp"); in portrait its
text may shrink in 1 px steps to 17 px and wrap onto 2 lines. In the landscape panels (200 px and 160 px) the name is on line 1
(a name longer than 12 characters shows its first 12 then "…"; `aria-label` holds the full text) and "Reveal LAMP" on line 2,
font shrinking to fit, floor 15 px. The evening's first guessing turn shows the tip "Tap a word to suggest it. Sunita taps
Reveal." Anyone may still tap; the name is a social cue, never enforced.

A renamed picker's new name shows at once; a removed picker stays this turn's picker (the name still shows) until the turn
ends; "Someone else taps Reveal" lists only current players.
## SWD-123: Pairs of clue givers (B2, K39, C3)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
`Teams` gains `partners: { orange: string | null; teal: string | null }`, carried by `setClueGivers`. In the Clue givers sheet
each team has quiet "Add a partner": it shows a group "Chai Champions partner" with one button per eligible player of that team
other than the clue giver (`aria-pressed`, none pressed) and the button then reads "Remove partner" (clears it). A partner must
be eligible, and the team must keep at least 1 guesser: a button that would leave none is disabled. The clue giver's button is
disabled in the partner group and the partner's in the clue-giver group. Applies on "Done". Pairs are per game: Play again's
suggestion (SWD-007) has no partner; "Swap clue givers" (SWD-112) can add one. Both partners are credited (SWD-007 counts the game for each)
and neither is a guesser or picker that game. Pair strings (each replaces the single name):

| Where | Pair text |
|---|---|
| Pass screen | "Pass the phone to" then `pass-name` "NANA +" / "AARAV" (two lines, SWD-030); "Clue givers for Chai Champions (orange)"; main "We're Nana and Aarav" |
| Private map | heading "Nana + Aarav"; "Not Nana and Aarav? Go back" |
| Clue screen | `clue-prompt` "Nana and Aarav, say your clue out loud. How many words is it for?" |
| Result line | "✓ Nana and Aarav's clue works! 2 guesses left." (and the other endings of SWD-043) |
| Poker line | "Nana + Aarav: no hints, no faces!" |
| Waiting line | "While you wait, Coffee Commandos: guess how many words Nana and Aarav's clue will be for." |
| Scan screen, "Show the map to", board check | "Nana + Aarav" (sheet button "Nana + Aarav (Chai Champions)") |
| Game over | "Next clue givers: Nana + Aarav and Kabir" |
| History | "Nana + Aarav and Kabir gave clues" |
| Summary credits | each name on its own: "Clues tonight from Riya, Nana and Aarav" |

Either partner removed mid-game (SWD-127) leaves the other as the clue giver, with no dialog.

## SWD-124: Disputes (B3, K40)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
"Clue not allowed?" (board button and menu, SWD-046's window) opens the dialog "Clue not allowed? Both clue givers decide
together." with stacked full-width 48 px buttons in this order: quiet "Try another clue" (opens the clue screen as "Change
clue" does, with "Keep my clue", which returns to guessing; confirming records a new `clue` that replaces the old); quiet "Turn ends, and one of their words is turned over for them" (records `brokeRule`, SWD-046); quiet "Clue rules" (opens How to play scrolled to h2 "Clue rules"; its
"Done" returns to this dialog); main "Let it go" (closes; nothing recorded). Closing the dialog any other way is "Let it go".
**Version 3.7 (owner, 23 October):** Second button: quiet "Turn ends, and one of their words is turned over for them" (P6), 48 px, may wrap to 2 lines.

## SWD-125: Credit people, blame the board (B5, B6)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
- Own word: "✓ Riya's clue works! 2 guesses left." (pairs: "✓ Nana and Aarav's clue works! …"); every other result line names no
  person (SWD-043).
- Poker line: `turn-line` reads "Riya: no hints, no faces!" (pair "Nana + Aarav: no hints, no faces!") for 3 000 ms from the
  guessing screen mounting after a confirmed clue (also after "Change clue" or "Try another clue"), then "Chai Champions guessing".
  Not after a reload or "Carry on"; not announced (SWD-095). Tests wait 3 s before checking `turn-line`'s "guessing" text.
- The Landmine (Lose the game): heading "Chai Champions win!", line "Boom! Coffee Commandos hit the Landmine."; (Lose your turn)
  "Boom! The Landmine. Your turn ends and the other team gets a free word.".
- Nothing ever names who tapped a wrong word.

## SWD-126: A job for the waiting team (B7)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
On the pass screen (one phone) and the clue screen (two or three phones), `waiting-line` (small line) "While you wait, Coffee Commandos: guess how many words Riya's clue will be for." (the team not giving the clue; the clue giver's name, or "Nana and Aarav"). Hide orders: SWD-030, 040.
**Version 3.7 (owner, 23 October):** `waiting-line` "While you wait, Coffee Commandos: guess how many words Riya's clue will be for." (P5); may wrap to 2 lines.

## SWD-127: Players during a game (E2, E3, E4, E16, B12, C3)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Menu "Players" opens the sheet "Players": an h2 per team ("Chai Champions" / "Coffee Commandos"), its players in list order,
then the adding row; main "Done" closes. Every confirmed change records one `setPlayers { players, teams, renames? }`
(`renames`: old → new; History credits, the tally and `guessOnly` follow); the picker of a turn already under way is unaffected
(SWD-122).
- **Rename:** tap the name (button, accessible name "Rename Kabir") → an input labelled "Player name" holding the name, with
  quiet "Done"; Enter or "Done" saves (team, place and counts kept; Impostor's duplicate message for a name already playing, and
  an empty name keeps the old one). No Undo.
- **Move** (guessers only; at every step whose menu has "Players"): quiet "Switch team" (accessible name "Move Zoya to
  Coffee Commandos") moves the player to the end of the other team with the toast "Zoya moved to Coffee Commandos · Undo" (Undo
  restores as before, recording another `setPlayers`). Disabled when the team would be left with fewer than 2 players or with no
  guesser.
- **Add:** input labelled "Player name" (placeholder "Type a name…"), switch "Doesn't give clues", buttons "Add to Chai
  Champions" / "Add to Coffee Commandos" (disabled while the input is empty); the player joins the end of that team as a
  guesser from now on; toast "Neha joined Chai Champions" (no Undo). Impostor's duplicate message; "20 players is the most."
- **Remove a guesser** ("✕", accessible name "Remove Kabir"): toast "Kabir left · Undo" (Undo puts them back in place). If the
  team then has a partner and no guesser, the partner becomes a guesser in the same change.
- **Remove a clue giver** (with no partner): dialog "Who gives clues for Coffee Commandos now?" with the team's other eligible
  players (the next eligible in list order, wrapping, pre-selected; `aria-pressed`) and main "Done"; closing without "Done"
  cancels the removal. On "Done": the toast "Kabir left · Undo". One phone: the new clue giver takes the team's next pass; if
  their team is on its pass or clue step, the pass screen restarts for them; once guessing has started, the turn carries on. Two
  or three phones: they use "Show the map code again" (SWD-129). Removing one of a pair: SWD-123.
- **A team is never left with 1 player.** A removal that would do so opens "Coffee Commandos would be left with only Om. Move someone over?" with a button "Move Zoya over" per guesser of the other team whose team would keep at least 2 players (and a
  guesser), and main "Don't remove Kabir" (cancels). "Move Zoya over" removes Kabir and moves Zoya in one change (if Kabir gave clues, the
  clue-giver dialog follows first, and "Done" confirms the whole change). If no one can move: the line "No one can move over."
  with main "Don't remove Kabir" and quiet "End the game" (opens SWD-054's dialog; Kabir stays; absent at game over).
- "Remove" is disabled for a team's last eligible player (SWD-014).
**Version 3.7 (owner, 23 October):** Players sheet buttons: quiet "Switch team" (accessible name "Move Zoya to Coffee Commandos"); team-of-one dialog main "Don't remove Kabir".

## SWD-128: Endings (B8)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
**Found** is defined in Terms. Game over (SWD-112):
- `near-miss`, only after a won game (any board, a Landmine loss included), when the losing team had 1 or 2 words left:
  "Coffee Commandos were 1 word away!" / "Coffee Commandos were 2 words away!"; otherwise absent.
- `best-clue`, after won and ended-early games: among both teams' clues in force of this game that have a word and found at
  least 2, the one with the most found, the earliest on a tie: "Best clue: MONSOON 2 · all 2 found" when found equals its number
  (1–9), otherwise "Best clue: MONSOON 2 · 3 found"; 0 and ∞: "Best clue: RAIN ∞ · 4 found" / "Best clue: RAIN 0 · 4 found";
  absent when none qualifies. The room view's clues carry `found`.
Summary (SWD-060), in order: heading "Tonight's Secret Words"; `summary-line` "6 players · 3 games · 31 words found" (players =
everyone who played at least 1 game this game night; games = won and ended early; words = found words summed over the game
night's turns; singular "1 game", "1 word found"); the tally; `clue-credit` "Clues tonight from Riya, Nana and Zoya" (every
credited clue giver, partners included, in order of first credit; "Clues tonight from Riya" / "Clues tonight from Riya and
Nana"; absent if none); quiet "Oops, keep playing" (until recorded, SWD-060); quiet "← Home"; main "Play something else". No
Landmine count, no ranking of clue givers.

A game in progress when "End for tonight" was tapped counts as ended early in `summary-line` (players, games, words found)
and `clue-credit`, although it is recorded only when the summary is left.
## SWD-129: Map code again (E9)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
With two or three phones, menu "Show the map code again" at the clue screen, guessing, end-turn line and turn over: the scan
screen for the current board (no new deal; QR and `map-code-text` as SWD-033, `board-check` as SWD-116, no `dnd-tip`), with
"Guessers: don't scan this one!", no menu, and main "Back to the game", which returns to the step. Nothing is
recorded.

## SWD-130: Fair shuffles (B9)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
A team draw (the first split, SWD-004, and "Shuffle teams", SWD-006) is accepted when its two teams' counts of "Doesn't give
clues" players differ by at most 1, it doesn't put the same set of names in each team as now (shuffles only), and, from game 2,
its two teams are not last game's two teams (compared as sets, colours ignored); otherwise the next k draws, at most 10 draws in
all, keeping the 10th.

## SWD-131: Clue rules box (K34)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
How to play has h2 "Clue rules" after "The rules" and before `credit`, an `ol` of 4: 1 "One word only. Names like Taj Mahal
count as one." 2 "About meaning: no spelling, no rhymes, no 'top left'." 3 "Not a word on the board, or part of one." 4
"English, or a word you'd use in English (chai, dosa)." The dispute dialog's "Clue rules" (SWD-124) opens How to play scrolled
to it.
**Version 3.6 (22 October, from the simulated table games):** line 3 reads "Not a word on the board, or a form or part of one (no 'rail' while Railway is face down). Letters inside another word are fine (Pan with Japan)." Words already turned over may be used. A clue may repeat an earlier clue (the rulebook doesn't forbid it). The clue screen's warning (SWD-101) stays a hint, not a rule: it may also show for allowed clues such as Pan with Japan.

## SWD-132: Settings and names (E17, E19)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Settings save every change at once (no Save button). In "Who's playing?" every Enter adds its name and keeps the field focused; 7
names typed quickly with Enter give 7 rows.

## SWD-133: Join scanner (W18)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
The Join screen's scanner is labelled "Scan a ticket or secret map" (replacing Tambola's scan label there) and also reads map
QRs, opening the map phone with `t` (SWD-117). Rule 11: this rewords PLT-300 and the Tambola join scenarios that quote the scan
label.
