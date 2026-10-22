# 09-usability.md: Usability (C1/C2)

Copied from `docs/games/secret-words/scenarios.md` (version 3.6, approved by the owner 22 October 2026), the binding contract. Where a scenario ends with a paragraph headed "Version 3.6", that paragraph wins over the text above it. Terms, canonical strings, the menu table and the test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## SWD-090: Board text and portrait layout
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Portrait board: 8 px side margins, 4 px gaps; cells (width − 16 − gaps) / columns wide (Full at 360: 65.6 px; at 390: 71.6
px). Cell height 56 px, shrinking to no less than 48 px so the page doesn't scroll. One font size for all words of a board:
the largest whole px from 22 down to 12 at which every word fits in 1 line within its cell minus 4 px padding each side.
Larger text doesn't change it. Status lines and the full height budget: SWD-041. No page scrolling at 390 × 844 (Larger text off and on) and 360 × 640
(Larger text off), within SWD-041's longest content. The map phone may scroll (SWD-034).

## SWD-091: Landscape board
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
812 × 375: grid at the left (margins 16 px left and bottom, 8 px under the team bar); a 200 px panel at the right (16 px right
margin, 12 px gap). Panel, top to bottom: `hurry-timer` row (48 px, when running); a row with "↻" (44 × 44) and "··· Menu" (48
px); a middle part that scrolls inside if needed: `turn-line` (at most 2 lines), `clue-line`, `guess-line`, `clue-history`,
counts (two lines), `result-line`, tip; then pinned at the bottom the action slot (until the first reveal "Change clue" and
"Clue not allowed?" stacked, each 200 × 48; then "End our turn" 200 × 48) and the main button (200 × 60) holding 2 lines: the
picker's name and "Reveal LAMP" (SWD-122), font shrinking to fit, floor 15 px. Height: team bar 8 + timer row 48 + button row
48 + middle part ≥ 83 + action slot 96 + main 60 + bottom 16 + 4 gaps of 4 px = 375 (the middle part grows by 48 without the
timer and by 48 after the first reveal). Cells at least 100 × 56 px. 568 × 320: the 48 px action slot stays reserved (empty) until the first reveal; the same with 8 px margins, a 160 px panel
(main 160 × 60, same 2 lines, floor 15 px) and an 8 px gap, and no change row ("Change clue" and "Clue not allowed?" are menu
items, SWD-041/046; the slot holds "End our turn" 160 × 48 from the first reveal); height: team bar 8 + timer row 48 + button
row 48 + middle part ≥ 84 + slot 48 + main 60 + bottom 8 + 4 gaps of 4 px = 320; cells at least 69 × 54 px. No page scrolling.
Cell sizes are measured on the unturned board.

## SWD-092: Narrow portrait
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
On the board screens, the private map and the map phone, narrow portrait shows `turn-sideways` in place of the grid; the other
parts of the screen stay (on the board, "Sunita: Reveal" stays disabled). Turning to landscape shows the grid. All other screens
work at 320 × 568 portrait.
**Version 3.6 (owner, 22 October):** **Easy board in narrow portrait:** at `innerWidth < 360` in portrait an **Easy** board shows as a 4 × 4 grid with SWD-090's 8 px margins and 4 px gaps: cells (innerWidth − 16 − 12) / 4 wide (73 px at 320), 48 px tall, one font size by SWD-090's rule (22 down to 12 px); the page may scroll as one with the main fixed. Easy never shows `turn-sideways`; its cells are buttons and "Reveal" works as everywhere. A **Full** board keeps `turn-sideways` "Turn your phone sideways to see the board." and, on host board screens only, the small line `turn-sideways-hint` "Or choose the Easy board for the next game." The private map and the map phone show an Easy board's grid in narrow portrait (replacing, for Easy only, SWD-031's and SWD-034's narrow-portrait list or sideways line): the private map keeps SWD-031's 3.6 slots (pad 64 px) with the 4 × 4 grid as its map area, the content above the main scrolling inside when it doesn't fit. A Full board keeps their existing narrow rules.

## SWD-093: Never colour alone
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Every turned-over cell and every map cell has its kind's icon and an accessible name: "Kite, orange team" / "Kite, teal
team" / "Kite, blank word" / "Kite, the Landmine" (+ ", found" or ", not found" where SWD-031, SWD-035 and SWD-051 say).

## SWD-094: Targets
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Every button at least 44 × 44 px; board cells per SWD-090/091; keys per SWD-040.

## SWD-095: Screen readers
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
The announcer reads: the clue ("Clue for Chai Champions: 1 word" / "2 words" / "0 words" / "as many as you like"; with a word,
as typed, "Clue for Chai Champions: Cricket, 1 word" / "Cricket, 2 words" / "Cricket, 0 words" / "Cricket, as many as you like";
announced again after "Change clue" or "Try another clue"); each result line; at turn over "Other team's turn"; at game over the
heading then the line ("Chai Champions win! All 9 words found."). It never announces the map, and never the poker line
(SWD-125). Map cells are reachable by name only on map screens.

## SWD-096: Reduce motion
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
With `prefers-reduced-motion: reduce`: no cell turn and no animations (`document.getAnimations().length === 0` on board
screens); everything else the same.

## SWD-097: Sound and vibration
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Sounds (Impostor's sound hook, `window.__sounds`): `ding` (own word), `thud` (nobody's, the other team's, a broken-rule
turn), `boom` (the Landmine), `chime` (time's up); peak gains of `thud`, `boom` and `chime` ≤ `ding`'s. Vibration 50 ms on every
reveal, 200 ms on the Landmine. The private map and the map phone make no sound and no vibration.

## SWD-098: One main button
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
At most one main button per screen, always the next step. (The Start new dialog has none: Terms.)

## SWD-099: Word list check (C3, content)
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
`content/secret-words/words.json` is built from `words.csv` (`{ id, word, meanings, category, audience, nonveg, edition,
retired_in }[]`). **Checks:** ids unique; words 3–8 letters A–Z, unique ignoring case; every edition's candidates ≤ 775.
**Browser content test** (both browser projects): every word, as word text, fits in 57 px at 12 px (the 360 × 640 cell) and in
63 px at 14 px (the 390 × 844 cell). A failing word is reported to the product owner, who replaces it in a new edition.
