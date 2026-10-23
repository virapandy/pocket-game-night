# Secret Words screen lane A: what the tests look for (written 23 October 2026, scenarios v3.7)

For the Build role, lane A (Home, picker, Join, setup: A1 to A3, J1, J2, D11, S1 to S5). Files:
`tests/browser/secret-words-a-home.spec.ts` (A1 to A3, J1, J2, D11), `tests/browser/secret-words-a-setup.spec.ts` (S1 to S5, the
"Clue givers" sheet, sizes, small lines), shared steps in `tests/browser/secret-words-a.ts`. Exact strings are the scenarios' (Canonical
strings, version 3.7 strings); the tests find things by role and label, and by the test ids below. Scenario IDs are in each test name.

**Expected-to-fail marker.** Every test calls `aheadOfSecretWordsScreens`, so the lane's quick verify stays green until the
screens exist. To run them as real checks: `PGN_IGNORE_AHEAD=1 npm run test:browser -- --project=android secret-words-a`. When a
test starts passing, Playwright says "expected to fail, but passed": that is the tester's cue to remove the call. Run them with
`PGN_IGNORE_AHEAD=1` while building.

**Registering the game.** Secret Words must be in the app's picker (`hostGames` in `src/app/games.ts`) so Home's "Host a game"
reads "Tambola, Impostor or Secret Words on this phone" and the picker shows the third card.

## Saved data the tests write (so screens read it, and the tests read it back)
- A game night is a saved game at `pgn.game.<id>` with `gameType: 'secret-words'`, plus its session at `pgn.session.<sessionId>`
  (`tests/fixtures/secret-words-saved-evenings-v1.json` is the shape; never edited). The tests start nights from it (1-1 after two won
  games, game 3 dealt; and the same night ended) and read back `status`, `setup.config` and `records[].move.type`.
- A saved map: `pgn.secretWords.map` = `{ code, savedAt, found: [], t? }` (SWD-036).
- Seeds: `pgn.test.seeds` = `{ deal, teams, boards: [code] }` (Test hooks item 2). The tests give `teams-a` and expect SWD-004's draw
  `shuffle(names, createRng('teams-a:1'))` (and `:2`, `:3` for Shuffle; SWD-130's rule), so the draw must follow the scenario exactly.
- Larger text: `pgn.pref.largerText = true`.
- Time zone Asia/Kolkata: a night started 22 October 2026 15:30 UTC reads "9:00 pm".

## Test ids and roles by screen
| Screen | What is looked for |
|---|---|
| A1 Home | the "Host a game" button (text inside: "Tambola, Impostor or Secret Words on this phone"); the second card, button named "Join a game ..." with the title "Join a game" and the line "Tambola ticket or Secret Words map from the host"; `unfinished-games` row in three lines (line 2 is `where-line`); `last-night` (text exactly "Last game night: Chai Champions 1 · Coffee Commandos 1") and button "Play again with these teams"; Home's menu has menu item "History"; `saved-map` button |
| A2 picker | heading "What shall we play?"; three cards that are buttons named "Tambola ...", "Impostor ...", "Secret Words ..." (equal width and height within 1 px); `resume-card` (button; three lines); "← Back" |
| A3 | `role="dialog"` named "Start a new game night?" with a heading of the same words, the paragraph, exactly two buttons "Carry on that one" and "Start new (ends that one)" (equal size), no `main-button` inside |
| J1 | (the Join scanner starts the camera at once through the shared hook `window.__pgnCamera.start(onRead, onFail)`, as the claim scanner does; `onRead(text)` with a map link opens the map phone) heading "Join a game"; scanner labelled "Scan a ticket or secret map"; button "Type a ticket code"; Impostor's line; Secret Words' line; quiet "Type the host's code"; "← Back" |
| J2 | heading "Type the host's code"; input labelled "Host's code" (placeholder "27P-3QX8", `autocapitalize="characters"`, `maxlength="12"`); small line "Dashes and small letters are fine."; main "Open the map" (disabled under 7 characters after spaces and hyphens go); errors as `role="alert"` with the typed text kept; "← Back" |
| D11 | `board-phone-dialog` with `role="dialog"` named by its heading "This phone is the board. Open the map here?"; paragraph (one-phone and two/three-phone variants); buttons in order "Open the map here" (quiet) and "No, keep the board" (the `main-button`, with `data-guard="on"` for its first 800 ms). **Until a choice is made, none of `map-grid`, `map-cell`, `map-list`, `our-words`, `avoid-line`, `first-words`, `map-qr`, nor the texts "Orange words", "Teal words", "Never guess", "Whole map" is in the page** (privacy; tested for all four routes: typed, QR link, Join scanner, Home's saved map) |
| S1 | heading "Who's playing?"; input labelled "Player name"; Enter adds and keeps focus; buttons "Remove <name>" (at least 44 × 44); "Clear list" and `undo-toast` "List cleared · Undo"; alert "Add at least 4 players." (also with 0 names); "20 players is the most." as `role="alert"`; Impostor's duplicate message; main "Next"; "← Back" |
| S2 Make teams | heading "Make teams"; h2 per team "<name> · 4 players" / "· 1 player" / "· 0 players" (orange first, side by side); small lines "Orange team" / "Teal team"; each player a button with `aria-label` "Move <name> to <other team name>" (page order = team order); `clue-giver-badge` "Clue giver" (inside the player's row, its own line, not in the button's name); `guess-only-tag` "Doesn't give clues"; "Tap a name to move it to the other team."; quiet "Shuffle teams", "New team names", "Choose clue givers"; `undo-toast` with a button "Undo"; main "Next"; alerts "Each team needs at least 2 players." / "Each team needs someone who can give clues."; "← Back" |
| S2a sheet | `role="dialog"` named "Clue givers"; `role="group"` per team named by the team's name; a button per player with `aria-pressed`; `role="switch"` named "<name>: doesn't give clues" with `aria-checked`; small lines "Plays as a guesser only. Good for small kids." and "Two people give the clues together."; quiet "Add a partner"; the alert; main "Done" |
| S3 Choices | heading "How do you want to play?"; buttons named exactly "One phone", "Two phones", "Three phones" with `aria-pressed` and an accessible description of their text; `recommended` inside "Two phones"; `role="group"` named "How many phones?", "Board", "Landmine", "Words"; options "Full: 25 words" / "Easy: 16 words", "Lose the game" / "Lose your turn", "Whole family" / "+ Harder words" with `aria-pressed`; `start-hint`; `big-group-hint`; "Same as last time"; quiet "How to play" (48 px, full width); main "Start the game" |
| S4 | heading "Read this aloud"; an `ol` of 4 `li`; main "Let's play"; quiet "Show me the board first"; `larger-text-hint` with a link "Settings" (absent with Larger text on); "← Back" |
| S5 | h1 "How to play"; h2 "Read this aloud", "The rules", "Clue rules", each followed by an `ol`; `credit`; main "Done" |

## What is not in lane A (the tests assume only the other lanes' names)
After "Let's play" the tests read the saved game (a first move `deal` with the seeded code), not the pass or scan screens (lane B).
Opening a map ends on the map phone, heading "Secret Words map" and `map-teams` / `map-code-line` (lane C); those few checks fail until lane C is built.
The resume card and "Carry on that one" are checked only for leaving the picker and recording nothing.
Not tested for want of a way to close a sheet "any other way" (SWD-007): see `docs/test-questions.md`.
