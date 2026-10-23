# 03-map.md: Seeing the map (screens C2; privacy C3)

Copied from `docs/games/secret-words/scenarios.md` (version 3.7, approved by the owner 23 October 2026), the binding contract. Where a scenario ends with a paragraph headed "Version 3.7", that paragraph wins over the text above it, then its "Version 3.6" paragraph. Terms, canonical strings, the menu table and the test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## SWD-030: One phone: pass to the clue giver
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
At the start of each turn with one phone: team bar; heading "Chai Champions, your turn" with the team icon; "Pass the phone
to"; `pass-name` RIYA at 48 px, shrinking in 1 px steps to 32 px to fit one line, and wrapping onto 2 lines at 32 px if it
still doesn't fit (a pair, SWD-123: two block lines "NANA +" and "AARAV", DOM text "Nana +" and "Aarav", each line shrinking
on its own the same way, floor 32 px); "Clue giver for Chai Champions (orange)" (pair: "Clue givers for Chai Champions
(orange)"); `waiting-line` (SWD-126); the recap line (SWD-103); the Do Not Disturb tip on the evening's first pass screen
(SWD-104); quiet "Start 90-second timer"; main "I'm Riya" (pair: "We're Nana and Aarav"; taps ignored for 1 s after the screen
appears, SWD-114).
**Layout.** The content above the main scrolls inside if needed, main fixed. When space runs short, these hide in this order:
`dnd-tip`, then `waiting-line`, then `recap-line`; the heading, "Pass the phone to", `pass-name`, the clue-giver line, the timer
button and the main never hide. At 320 × 568 the content may also scroll inside after those have hidden.

## SWD-031: One phone: the private map (P4)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
After "I'm Riya": heading "Riya" (CSS upper case; pair "Nana + Aarav"); small line "You give clues for Chai Champions (orange)";
the counts; the map area (empty while hidden); pad `hold-pad`, a button named by its visible text "Tap to see the map" / "Tap to
hide" (no `aria-pressed`); quiet "Our words" and quiet "↻ Flip" (accessible name "Flip the board") side by side (half width
each, shown only while the map shows); quiet "Not Riya? Go back" before the first show and quiet "Someone saw the map" while the
map shows (SWD-113); main once shown; no menu, no team bar.
- A tap on the pad shows the map; taps within 500 ms of the last are ignored. The map is removed from the page at once on
  "Tap to hide", by SWD-121 (60 000 ms), when "Someone saw the map" opens its dialog (SWD-113), and when the app is hidden
  (SWD-032). When it hides, "Our words", "↻ Flip" and "Someone saw the map" hide and the list resets to the grid; the main stays.
- The shown map: every cell with its word text, kind colour and icon; cells already turned over at 40% opacity with the word
  struck through (accessible name adds ", found"); turned as the team's board angle (SWD-102).
- "Our words" swaps the grid for `our-words`: h2 "Your words (6 left)" ("(1 left)" for one; this team's face-down words), each
  word an `li` at 24 px (28 px with Larger text) in `data-index` order, then the small line `avoid-line` "Never guess: Shadow (the Landmine)" with
  the landmine icon (the Landmine's word if face down; none on the Easy board). The button then reads "Whole map".
- Main "I have my clue" appears at the first show and then stays; tapping it removes the map, records `mapSeen` (once per
  turn) and opens the clue screen.
- No text selection, callout, magnifier, context menu or drag on the pad or the map. No sound, no vibration.
- **Layout.** Portrait: heading, small line, counts, map area (board layout, SWD-090), the "Our words | ↻ Flip" row, pad (full
  width, 96 px tall), "Not Riya? Go back" or "Someone saw the map" (full width, 48 px), main; the content above the main
  scrolls inside if needed, main pinned, and does not scroll at 390 × 844 (Larger text off and on). Landscape: map area at the
  left as the board (SWD-091); at the right a column (200 px at 812 × 375, 160 px at 568 × 320) with heading, small line,
  counts, pad (column width × 96), "Our words", "↻ Flip", "Not Riya? Go back" or "Someone saw the map", and the main (column
  width × 60) pinned at the bottom; the column above the main scrolls inside if needed (at 568 × 320 it does).
- Narrow portrait: heading, small line, `turn-sideways`, the pad, "Not Riya? Go back" or "Someone saw the map", and the main;
  a tap on the pad shows the `our-words` list (not the grid), and the main appears at that first show; the content above the
  main scrolls inside if needed, main pinned.
**Version 3.6 (owner, 22 October):** Under the heading, small line `private-line` "Only Riya should see this screen." (pair: "Only Nana and Aarav should see this screen."; 1 line, shrinking in 1 px steps to 13 px, then each name shows its first 8 characters then "…"). **Fixed places, every state (R6):** every slot below is reserved from the screen's first paint, so nothing moves when the map shows or hides: the heading row (44 px: the heading at the left, shrinking in 1 px steps to 20 px to fit; at the right, quiet "Someone saw the map", 44 px tall, shown only while the map shows); `private-line`; the small line; the counts; the map area; the "Our words | ↻ Flip" row (48 px, empty and not focusable while hidden); the pad (quiet outlined look, never the main look, **64 px tall in both states**); the "Not Riya? Go back" slot (48 px; the button before the first show, empty after); the main slot (60 px; empty before the first show). Portrait fit at 360 × 640, Larger text off, map shown or hidden: heading row 44 + `private-line` 20 + small line 20 + counts 32 + map area 256 + row 48 + pad 64 + slot 48 + main 60 + bottom 16 = 608, plus 8 gaps of 4 = 640. Larger text on, or smaller screens: the content above the main scrolls inside (as before). This replaces both 96 px figures above (portrait "full width, 96 px tall" and landscape "column width × 96"). Landscape: the column's pad is column width × 64; the rest as SWD-031's landscape text. Found cells: see SWD-051.
**Version 3.7 (owner, 23 October):** **Map key (P8):** `map-key`, a small line block of exactly 2 lines under the map area: line 1 circle icon "Chai Champions", diamond icon "Coffee Commandos"; line 2 dash icon "nobody's word", landmine icon "Landmine: never guess" (Easy: line 2 is the dash entry only). Icons 16 px; each line shrinks in 1 px steps to 13 px to stay on one line, then team names show their first 12 characters and "…". Its 40 px slot is reserved from first paint and empty while the map is hidden (SWD-031's fixed places). **Fit at 360 × 640, Larger text off, shown or hidden:** heading row 44 + `private-line` 20 + small line 20 + counts 32 + map area 216 (cells 40 px tall, private map only; not tappable) + `map-key` 40 + row 48 + pad 60 + slot 48 + main 60 + bottom 16 = 604, plus 9 gaps of 4 = 640. The pad is 60 px in both states (replacing 3.6's 64). At 320 × 568 and with Larger text the content above the main scrolls inside, as before. Landscape: `map-key` sits in the right column under the counts, wrapping freely (the column scrolls).

## SWD-032: Leaving a map screen
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
On `visibilitychange` to hidden on the private map or the map phone: a full-screen `privacy-cover` appears and the map is
removed in the same task. Back on the host: the pass screen for the same player with "Welcome back." above it. Reload or resume
does the same.
**Version 3.6 (owner, 22 October):** Under "Welcome back.", `where-line` (SWD-110) for the step the game is on.

## SWD-033: Two or three phones: scan the map
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
After each deal (after the preview's "Start", if shown) with two or three phones: the scan screen (strings above), QR at least
200 × 200 px encoding `<origin><BASE_URL>#map=<code>&t=<pair id>` (code without hyphen; pair id from `team-names.csv`, e.g.
`SWDT-01`, SWD-117); the orange team's clue giver named first in both wordings (a pair as "Nana + Aarav"). Two phones: main "The map phone has the map"; three phones: main "Both have the map". `board-check` follows SWD-116 on every deal. The main opens the
starting team's clue screen. Resuming any time before the board's first clue shows the scan screen again. The page may scroll;
the QR stays 200 × 200 and the main stays fixed. While paused (SWD-110) the QR is removed from the DOM. The host never shows the
map in these modes until game over, except through SWD-037.
**Version 3.6 (owner, 22 October):** **Portrait, in this order:** heading "Clue givers: scan to get the secret map"; the clue-giver line (SWD-033's two-phone or three-phone sentence); `other-phone-line` (two phones "On the other phone: open the app, tap Join a game, scan this."; three phones "On your phones: open the app, tap Join a game, scan this."); the small line "Guessers: don't scan this one!"; the QR; the code text; `board-check` (SWD-116); `mismatch-line` "Doesn't match? Scan this code again." (small line); `dnd-tip`. The page may scroll; main fixed. **QR size** (replaces "at least 200" and "stays 200 × 200"): 200 × 200 in portrait and at 812 × 375; 160 × 160 at 568 × 320. **Landscape:** QR at the left (16 px margin at 812 × 375, 8 px at 568 × 320, vertically centred); a right column (812 × 375: 564 px wide; 568 × 320: 384 px) holding the rest in the same order and scrolling inside, with the landscape main (358 × 60) pinned at its bottom right. **Mains:** two phones "The map phone has the map" (replaces "The map phone is ready"); three phones "Both have the map". `pause-button` sits left of "··· Menu" (SWD-110).
**Version 3.7 (owner, 23 October):** **Two-phone clue-giver line (P7):** "Riya and Arjun give clues for different teams but share one map phone, as at a real table: sit side by side." (pair: "Nana + Aarav and Arjun …").

## SWD-034: The map phone
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Heading "Secret Words map"; `map-teams` (SWD-117, only with known team names); `map-code-line` "Host's code 27P-3QX8 · Chai Champions go first" (without names: "Host's code 27P-3QX8 · Orange team goes first", SWD-117); `first-words` (SWD-116); the map grid (`map-grid`, cells
`map-cell` with `data-index`, in the host board's order, each with word text, kind colour and icon, laid out as the board,
SWD-090/091, without the panel); the small line and the lists (SWD-120); quiet "Hide map" / "Show map"; quiet "Next map"
(SWD-039); quiet "Done with this game"; `map-end-line` (SWD-120). No main button, no "↻", no menu; "← Back" → Home. The map
shows on opening; after the app has been hidden, and after SWD-121's 60 000 ms, it returns hidden, with "Show map". Screen-on
lock (wake lock) while shown. In portrait the page may scroll at every size; grid cells are 48–56 px tall (SWD-090's widths).
Narrow portrait: "Turn your phone sideways to see the board." in place of the grid, buttons kept. Landscape: grid at the left;
heading, team and code lines, `first-words`, small line, buttons and `map-end-line` in a column at the right (200 px at
812 × 375, 160 px at 568 × 320) that scrolls inside if needed. The host's game ending changes nothing here. Larger text follows
this phone's own setting.
**Version 3.6 (owner, 22 October):** **Clue rules:** quiet "Clue rules" opens SWD-011 as stated there. **My team (D3):** only on a map opened from a QR with `&p=own`: `my-team` under `map-code-line`, shown on every opening until a team is chosen: small line "I give clues for:" and two buttons (48 px, `aria-pressed`) with the team names from `t`, or "Orange team" / "Teal team" when `t` is missing or unknown. Once chosen it reads "I give clues for: Chai Champions" with quiet "Change" (48 px) beside it, which shows the two buttons again. Choosing changes only the order of the list buttons: the chosen team's list button first, the other team's second, "Whole map" third (before a choice: orange, teal, Whole map). The map still opens on the grid, and the grid always shows both teams' colours. `team` is saved with the map (SWD-036), kept by "Next map", and cleared when a different code is opened. A typed code or a QR without `p` never shows `my-team`. **Order, top to bottom:** heading row (heading at the left; "Hide map" / "Show map" at the right, quiet, 44 px, `position: sticky` so it stays visible while the page scrolls); `map-teams`; `map-code-line`; `my-team`; `first-words`; `mismatch-line` "Doesn't match? Scan the host's code again."; the grid (or list); the small line; the list buttons (portrait: stacked full width, 48 px each; landscape: in the column); "Next map"; "Clue rules"; "Done with this game"; `map-end-line` "Game over: tap Done with this game. New board on the host: tap Next map." (replaces SWD-120's and the table's earlier text). Found cells: see SWD-051.
**Version 3.7 (owner, 23 October):** **Map key (P8):** `map-key` as SWD-031 (two lines, same entries and shrink rule) directly under the grid, also in narrow portrait; the page may scroll as before. **Selected view (P9):** the two list buttons and "Whole map" carry `aria-pressed`; the one showing has the selected look; on opening, "Whole map" is pressed.

## SWD-035: Fading found words
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Tapping a map cell toggles **found** (40% opacity, word struck through, accessible name adds ", found") on this phone only,
saved with the map. A second tap within 500 ms does nothing. Optional (SWD-120's small line says so); lists never fade (SWD-120).

## SWD-036: Clearing and replacing maps
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
This phone keeps at most one map (`pgn.secretWords.map` = `{ code, savedAt, found: number[], t?: string }`; `savedAt` = when
the code was first opened, or when "Next map" opened it; `t` = the pair id from the QR, kept by "Next map", SWD-117). "Done with
this game" → dialog → "Remove" removes it and opens Home. Opening a different code (except by "Next map", SWD-039) replaces
it, with the toast "New map opened. The old one is gone."; opening the same code opens it with its found marks and no toast. Home
shows a saved map as `saved-map`: a button "Secret Words map 27P-3QX8 · Tap to open"; more than 6 hours after `savedAt`, the
text "Secret Words map 27P-3QX8" with buttons "Open" and "Remove" ("Remove" opens the same dialog). The app never opens a saved map
by itself.
**Version 3.6 (owner, 22 October):** The saved map is `{ code, savedAt, found: number[], t?: string, p?: 'own', team?: 'orange' | 'teal' }`. Home's rows keep their text ("Secret Words map 27P-3QX8 · Tap to open"; older than 6 hours: the text with "Open" / "Remove"). Opening it on a phone with an unfinished game night asks first (SWD-002).

## SWD-037: Showing the map on the host (two or three phones)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Menu → "Show the map to a clue giver" → sheet "Show the map to" with the two current clue givers ("Riya (Chai Champions)",
"Arjun (Coffee Commandos)"; a pair "Nana + Aarav (Chai Champions)") and quiet "Cancel" → a name: SWD-030 and SWD-031 for that
player or pair, with main "Done, hide the map", which returns to the step the game was on.

## SWD-038: Larger text on map screens (detail of SWD-031, SWD-034)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Larger text changes the heading and lines, never the map's word size (SWD-090).

## SWD-039: Next map and the board check (P8, C3)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
"Next map" on a map phone first asks "Next map? Only after the host starts the next game." (quiet "Next map", main "Not yet"); its "Next map" opens `nextMapCode(code)`: the same config and deck seed, deal index n + 1, a new check symbol, if that
code is valid (SWD-022); taps within 500 ms are ignored. It replaces the saved map (found marks cleared, `savedAt` = now, `t`
kept), shows the map even if it was hidden, and the toast "Next map. It should start with: Kite · Tiffin · Rain." (SWD-116;
27P-3QX8 → 28P-3QXA). If `nextMapCode` gives `null`: the toast "No more maps from this code. Scan the host's new code." and
nothing changes. With edition 1's Whole family list (439 candidates, v3.5), the last valid n is 16 for both Full and Easy (25·16 + 25 =
425 ≤ 439; 25·17 + 16 = 441 > 439). "New board" uses up a deal index like any deal. **Property:** for 1,000 random evenings,
every deal for which SWD-116 shows one of its "Next map" wordings (wording 3 with two phones, wording 4 with two or three phones; three phones with changed clue givers scan instead, version 3.6) has
exactly the code `nextMapCode` gives from the previous deal's code, and every deal showing a "New code: scan again." wording
does not.
