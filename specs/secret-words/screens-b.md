# Secret Words, screen lane B: what the tests look for (tester, 23 October 2026, scenarios v3.7)

For the lane B coder. Everything here is already in the scenarios (README.md: Terms, Canonical strings, the menu table,
Test hooks items 3 and 4, the 3.6 test ids); this page only lists, per screen, what the lane B tests find and how. The
exact words are `docs/games/secret-words/text.csv`. If something here can't fit the design, ask in `docs/test-questions.md`.

Tests: `tests/browser/secret-words-shared.spec.ts` (shared pieces), `secret-words-turn.spec.ts` (S6, S7, P1 to P6),
`secret-words-dialogs.spec.ts` (D1 to D5, menu, Pause, timer, reload), and lane B's checks in `secret-words-c3.spec.ts`
(SWD-090 shrink alone, SWD-042 zoom, SWD-033 QR, SWD-129). Helpers: `secret-words-b.ts`, `secret-words.ts`.

## How the tests get to your screens
- Through lane A's setup (Home → "Host a game" → "Secret Words" → names → Make teams "Next" → Choices → "Start the game" →
  "Read this aloud" → "Let's play" or "Show me the board first"). **Until lane A's screens are on the branch, every lane B
  test stops at the picker.** Boards come from `pgn.test.seeds` `{ deal, teams, boards }` (Test hooks item 2).
- Who is on which team, the team names and the clue givers are read from the saved evening: `pgn.game.<id>` with
  `gameType: 'secret-words'`, `setup.config.teams` (`orange`, `teal`, `clueGivers`, `partners`, `names: { id, orange, teal }`),
  and the moves from `records[].move`. The UI state is `pgn.secretWords-ui.<id>` (SWD-048: `step`, `angles`, `paused`,
  `pickerOverride`).
- Time: Playwright's clock. Guards are waited out with 2 s of app time; guard tests freeze the clock and tap with
  `force` while `data-guard="on"`.
- Larger text: `localStorage['pgn.pref.largerText'] = true`. Sounds: `window.__sounds` (`{ name, at, gain }`), vibration
  via `navigator.vibrate`, the screen-on lock via `navigator.wakeLock.request('screen')` (as Impostor).

## Shared pieces (lanes C and D reuse them)
| Piece | Test id / role | Checked |
|---|---|---|
| Board grid | `word-board` (`data-angle` "0"/"180"), cells `board-cell` with `data-index` (row-major from 0) | SWD-090 sizes at 390 × 844 and 360 × 640 (8 px margins, 4 px gaps, cells 71.6 / 65.6 px wide, 48–56 px tall, one font size 12–22 px, weight 600, `text-transform: none`); SWD-091 at 812 × 375 and 568 × 320; SWD-092 at 320 × 568 (Full: `turn-sideways` + `turn-sideways-hint`; Easy: 4 × 4, 73 × 48) |
| Cell names | face down: `aria-label` "Kite, face down" + `aria-pressed`; turned over: "Kite, orange team" / "teal team" / "nobody's word" / "the Landmine", not a button; locked cells `aria-disabled="true"`, opacity 1 | SWD-042, 093, Terms |
| Cell icon | an `svg` inside the cell, within an `aria-hidden="true"` element, 16 × 16, top left (2 px in); no ● or ◆ in the page | SWD-093 |
| Zoom | `word-zoom`: the word at 28 px weight 700, not a button | SWD-042 (preview locked cells: 2 000 ms) |
| Team bar | `team-bar`: 8 px tall at y = 0, full width, background = `var(--team-orange)` / `var(--team-teal)` (compared after the browser resolves both) | pass, clue, guessing, turn over; none on the private map |
| Pause | `pause-button`: accessible name "Pause", 44 × 44, an `svg` inside, directly left of "··· Menu" on its row | preview, scan, pass, clue, guessing, end-turn, turn over; not on the private map |
| Pause cover | `pause-cover`, `role="dialog"` named "Paused" (heading), `where-line` inside it, "Tap Carry on when you're ready.", main "Carry on" | SWD-110 |
| Where-line | `where-line`, 15 px, at most 2 lines | the step texts of SWD-110 v3.6 (e.g. "Before game 1", "Scan the map, game 1", "Turn 1 · clue for Chai Champions", "Chai Champions guessing · 3 guesses left", "Turn 1 · Chai Champions ended their turn", "Turn 1 over · Coffee Commandos next") |
| Tap guard | the main (`main-button`) while waiting: `data-guard="on"`, `aria-disabled="true"`, computed opacity 0.5, label unchanged; a main disabled for another reason uses the `disabled` attribute and never has `data-guard` | SWD-114 |
| Menu | "··· Menu" button (name matches /Menu/); items `role="menuitem"` inside `role="menu"`, rules `role="separator"` inside it; a "Done" button closes the sheet | SWD-110 v3.7 order |

## Screens
- **S6 preview:** h1 "The board, before you start", `turn-line` "<team> start", `word-counts`, cells locked, main "Start"; no
  `clue-line`, `tip`, `dnd-tip`. The `deal` is recorded by "Show me the board first".
- **S7 scan:** h1 "Clue givers: scan to get the secret map"; the clue-giver sentence (paragraph, exact text); `other-phone-line`;
  "Guessers: don't scan this one!"; `map-qr` (an `img` named "Map code 27P-3QX8", drawn so the test can read it, as Tambola's
  QR); `map-code-text` "Or type this code: 27P-3QX8"; `board-check`; `mismatch-line`; `dnd-tip`; in this order top to bottom.
  QR removed from the DOM while paused.
- **P1 pass:** `turn-heading`, "Pass the phone to", `pass-name` (DOM as typed, `text-transform: uppercase`), "Clue giver for
  Chai Champions (orange)", `waiting-line`, `recap-line`, `dnd-tip`, quiet "Start 90-second timer", main "I'm Riya".
  "Welcome back." (exact text) with `where-line` after a hide or reload.
- **P2 private map:** h1 = the name; `private-line`; "You give clues for Chai Champions (orange)"; `word-counts`; `hold-pad`
  (a button, no `aria-pressed`); the map `map-grid` with `map-cell`s (only in the DOM while shown; accessible names as
  board cells); `map-key`; "Our words" / "Whole map"; "↻ Flip" (accessible name "Flip the board"); "Not Riya? Go back";
  "Someone saw the map"; `our-words` (h2 + `li`s), `avoid-line`; `hide-warning`; `privacy-cover` on hide (the map removed in
  the same task as `visibilitychange`). No menu, no `team-bar`, no `pause-button`, no `main-button` before the first show.
- **P3 clue:** `clue-prompt`, 11 `clue-key` buttons with `aria-pressed` (the ∞ key named "As many as you like"), `anyone-line`,
  `clue-help`, input labelled "Clue word (optional)" (`maxlength="24"`, `autocapitalize="off"`), `clue-warning`, `tip`,
  `waiting-line` / `recap-line` (two or three phones), quiet "See the map again" (one phone), "Keep my clue".
- **P4 guessing:** `turn-line`, `clue-line`, `guess-line`, `clue-history`, `word-counts` (accessible name per Counts),
  "↻ Flip" (72 × 44, right of the counts), the board, `tip` / `result-line`, quiet "Change clue", "Clue not allowed?",
  "End our turn", main "<picker>: Reveal <Word>" (the word upper case by CSS in its own element, the name as typed),
  `hurry-timer`, `toast` "Board flipped for the other side of the table", `announcer` (`aria-live="polite"`).
- **P5 / P6:** `result-line`, quiet "Oops, keep guessing", main "Other team's turn".
- **Dialogs** (each `role="dialog"`, named by its first sentence): "Clue not allowed? Both clue givers decide together.",
  "Earlier clues" (`li`s, main "Done"), "Who taps Reveal this turn?", "Paused", "New board? …" (main "Keep playing"),
  "Show the map to" (buttons "Riya (Chai Champions)", …, "Cancel"). Escape on the dispute dialog is "Let it go".
- **Moves** checked against the Tap → move table: `deal`, `mapSeen` (once per turn), `clue {n, word?}` (word trimmed, left
  out when empty), `reveal {cell, freeCell?}`, `endTurn` then `nextTurn`, `nextTurn`, `brokeRule {cell}`, `dealNew {code}`;
  everything else records nothing.

## Not lane B (marked `aheadOfSecretWordsScreens`, expected to fail until those lanes land)
Game over's heading (G1, lane D) for SWD-025; the map phone (lane C) for SWD-022 and SWD-117; Join and code entry (lanes A
and C); Home's Secret Words row (lane A) for SWD-111's resume. SWD-112 (game over's buttons) is lane D's screen: no lane B test.
