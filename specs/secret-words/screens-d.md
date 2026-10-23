# Secret Words, screen lane D: what the tests look for (tester, 23 October 2026, scenarios v3.7)

For the lane D coder (after the game: G1, G2, D6–D9, E1, E1a, the Players sheet). Everything here is already in the
scenarios (README.md: Terms, Canonical strings, the menu table, Test hooks); this page only lists, per screen, what the
lane D tests find and how. Exact words: `docs/games/secret-words/text.csv`. If something here can't fit the design, ask
in `docs/test-questions.md`.

Tests: `tests/browser/secret-words-game-over.spec.ts` (G1, D6, New board, Play again, the v3.7 bottom bar, D8, G2, D9,
SWD-063, 067), `secret-words-players-history.spec.ts` (D7 with D7a/D7b, E1, E1a), and the game-over step of SWD-025 in
`secret-words-c3.spec.ts`. Helpers: `secret-words-d.ts`. Shared pieces from lane B are used as lane B defines them
(`screens-b.md`): `word-board` / `board-cell` (`data-index`), `team-bar`, `pause-button`, `where-line`, the menu
(`role="menu"`, `menuitem`, `separator`, pinned "Done"), `main-button`, `data-guard`.

## How the tests get to your screens
- **Most tests do not play on screen.** They save a game night on the phone, written move by move
  (`tests/browser/secret-words-d-evenings.ts`, every evening replayed through the rules by
  `tests/games/secret-words/lane-d-evenings.test.ts`; engine `SavedGame` format 2, `gameType: 'secret-words'`, `sessionId`, key
  `pgn.game.<id>`, its session `pgn.session.<id>`), optionally with the UI state `pgn.secretWords-ui.<id>` (SWD-048), and
  then **reload** the app. SWD-048: a reload returns to the last step, so the app must open straight on game over for an
  evening whose last game has ended, and on the summary for step `'summary'`. (If the app shows Home instead, the tests
  tap Home's Secret Words row "Tap to resume", which is lane A's.)
- Example evening: Riya, Meena, Zoya, Om (Chai Champions, orange, clue giver Riya) v Arjun, Kabir, Dev (Coffee Commandos,
  teal, clue giver Arjun), one phone, Full, Lose the game, Whole family, team names SWDT-01. Boards come from
  `config.testBoards`, so every test knows its words and kinds.
- Tests marked `needsLanes('A' | 'B', …)` pass through lane A's or lane B's screens (setup screens, the Clue givers sheet,
  Home's row; a mid-game step after a reload, its menu, the New board dialog, the pass and scan screens). They are
  expected to fail until those lanes are merged; `PGN_IGNORE_AHEAD=1` runs them as real checks.

## G1 game over
| Part | Test id / role | Checked |
|---|---|---|
| Heading | `game-heading`, an h1: "Chai Champions win!" / "Coffee Commandos win!" / "Game ended. No winner." | SWD-051, 054 |
| Line | `result-line`: "All 9 words found." (winner's total 9, 8, 6 or 5) / "Boom! Chai Champions hit the Landmine." (the team that hit it); none when ended early | SWD-051 |
| Board | `word-board` with every cell named by kind: turned over "Kite, orange team"; face down now "Kite, teal team, not found" ("blank word", "the Landmine"); faded fill = `color-mix(in srgb, <kind token> 20%, var(--surface))`, word colour `--text`, opacity 1; turned-over fill = the kind token | SWD-051 v3.6, 093 |
| Narrow portrait | Full: `turn-sideways` "Turn your phone sideways to see the board." and no visible cells; Easy: the 16 cells | SWD-051, 092 |
| `near-miss` | "Coffee Commandos were 1 word away!" / "… 2 words away!"; only after a won game (the Landmine included) | SWD-128 |
| `best-clue` | "Best clue: Ocean 2 · all 2 found" / "… · 3 found" / "Best clue: Rain ∞ · 9 found" / "Best clue: Rain 0 · 9 found" (DOM text as typed, the word upper case by CSS, so `innerText` shows "OCEAN"); earliest on a tie; absent when none found ≥ 2 | SWD-128 |
| `tally` | "Tonight: Chai Champions 1 · Coffee Commandos 0" | SWD-052 |
| `next-clue-givers` | "Next clue givers: Meena and Kabir" (fewest games; partners count; "Doesn't give clues" never suggested; follows renames) | SWD-007, 112 |
| Buttons | quiet "Swap clue givers", "Change teams, players, phones or board", "← Home" in that DOM order after the tally; "End for tonight" (quiet) and main "Play again" in the pinned bar | SWD-112 |
| Team bar | `team-bar` background = `var(--team-orange)` / `var(--team-teal)` of the winner; none when ended early | SWD-112 |
| Menu | exactly Players · separator · How to play · Settings · History; no `pause-button` | menu table, SWD-110 |
| Screen-on lock | none held at game over | SWD-051 |

**Bottom bar (v3.7 P1):** at 390 × 844 and 360 × 640: side by side, "End for tonight" left, both 60 px tall, 16 px from
the sides and the bottom, widths 40 / 60 of the row, the same place after scrolling, "← Home" ends above the bar. At
320 × 568 and with Larger text (`pgn.pref.largerText`) at 390: stacked full width, "End for tonight" above, 60 + 8 + 60. At
812 × 375 and 568 × 320: stacked, 358 px wide, right edge and bottom 16 px in, 128 px tall. **Open question:** the
scenario's widths (137 / 205, 125 / 187) need a 16 px gap; its text says 8 px. The tests accept a gap of 8 or 16 and check
the widths only with 16 (`docs/test-questions.md`).

## Moves the tests read (`records[].move`)
- Play again: `setClueGivers { clueGivers, partners: { orange: null, teal: null } }` only when the clue givers differ, then
  `deal { code }`; `pgn.pref.secretWords.lastChoices` written. Swap clue givers → Done records nothing until Play again.
- Change teams, players, phones or board → … → "Start the game": no "Read this aloud"; `setChoices` then `deal` (no
  `setPlayers`/`setTeams` when those didn't change); "← Back to the game" records nothing.
- End the game (D6): nothing until the toast expires (10 s), a tap leaving game over, a reload or the app hidden: then
  `endGame`; UI step `'game-over'` while the toast runs; "Undo" records nothing. A reload with step `'game-over'` records
  `endGame` and shows game over without the toast.
- End for tonight (D8) → summary records nothing; leaving it ("← Home", "Play something else", reload, hidden, step
  `'summary'` on opening) records `endEvening` (after `endGame` if mid-game), once; status `ended`.
- Delete (D9): the `pgn.game.<id>` key is gone; Home opens; no Undo.
- SWD-063: on opening, more than 12 h after the last move: `endGame` (if mid-game) and `endEvening`, both with `at` =
  last move + 12 h; Home, no summary, no game over. At exactly 12 h nothing happens.
- Players sheet: one `setPlayers { players, teams, renames? }` per confirmed change; an Undo records another.

## G2 summary, dialogs
- Summary: h1 "Tonight's Secret Words"; `summary-line` "7 players · 1 game · 9 words found"; `tally`; `clue-credit` "Clues
  tonight from Riya and Arjun" (order of first credit, orange first within a game; partners each on their own); quiet
  "Oops, keep playing", quiet "← Home", main "Play something else"; menu only "Delete tonight's games". No "Landmine" in the
  page.
- Dialogs (`role="dialog"`, named by their first sentence): "End this game with no winner?" ("End the game", main "Keep
  playing"); "End for tonight? Tonight's tally stays in History." / mid-game "End for tonight? This game won't count in the
  tally." ("End for tonight", main "Keep playing"); "Delete tonight's games? The games and tally will be lost." ("Delete",
  main "Keep it"). Toast `undo-toast` "Game ended · Undo" with a button "Undo".

## D7 Players sheet
Dialog "Players"; h2 "Chai Champions" / "Coffee Commandos"; per player a button named "Rename Kabir", for guessers a
button with text "Switch team" named "Move Zoya to Coffee Commandos" (disabled when its team would keep < 2 players or no
guesser), a button named "Remove Kabir"; adding row: an input labelled "Player name" with placeholder "Type a name…", a
`role="switch"` named "Doesn't give clues" (`aria-checked`), "Add to Chai Champions" / "Add to Coffee Commandos"
(disabled while empty); main "Done". Renaming shows a second input labelled "Player name" (no placeholder "Type a name…")
holding the name and a quiet "Done"; Enter saves. Messages as text in the sheet: "Riya is already playing. Add an initial,
like Riya S." (`role="alert"` on rename), "20 players is the most.". Toasts: `toast` "Neha joined Chai Champions" (no
button), `undo-toast` "Zoya moved to Coffee Commandos · Undo" / "Kabir left · Undo" (button "Undo"). D7a: dialog "Who gives
clues for Coffee Commandos now?" with a button per eligible player (`aria-pressed`, next eligible pre-selected) and main
"Done"; Escape cancels. D7b: dialog "Coffee Commandos would be left with only Arjun. Move someone over?" with "Move Zoya
over" buttons or the text "No one can move over.", main "Don't remove Kabir", quiet "End the game" only before game over.

## E1 / E1a History
History's evening row (`history-game`) "Secret Words · 3 games"; tapping it lists `history-round` rows "Game 1 · Chai
Champions won · Riya and Arjun gave clues", "Game 2 · Coffee Commandos won (Landmine) · Meena and Kabir gave clues", "Game 3 ·
Ended early · Meena and Kabir gave clues" (pairs "Riya + Meena and Arjun K gave clues", names as renamed). Tapping a row:
h1 "Game 1 · Chai Champions won", the board (`word-board`, whole-map names as G1), `history-clues` "Clues: Coffee Commandos
Monsoon 2 · Chai Champions ∞" (DOM text), no main, "← Back" back to the rows. Data: the format fixture
`tests/fixtures/secret-words-saved-evenings-v1.json` (`ended`).
