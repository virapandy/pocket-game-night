# Secret Words, screen lane C: what the tests look for (tester, 23 October 2026, scenarios v3.7)

For the lane C coder: the map phone (M1), its "Remove this map from your phone?" dialog (M2) and its "Next map?" dialog (M3).
Everything here is already in the scenarios (03-map.md SWD-034 to 039; 07-sessions.md SWD-117, 120, 121; README.md Terms,
Canonical strings, Test hooks); this page lists what the tests find and how. Exact words: `docs/games/secret-words/text.csv`.
If something can't fit the design, ask in `docs/test-questions.md`.

Tests: `tests/browser/secret-words-c-map.spec.ts` (63 per phone) and lane C's three SWD-117 checks in `secret-words-c3.spec.ts`
(now real). Helpers: `tests/browser/secret-words-c.ts`. Run: `npm run test:browser -- secret-words-c-map`.

## How the tests reach the map phone
- A fresh phone (no game night), then the host's QR link: `./#map=<code>&t=<pair id>` (plus `&p=own` for three phones), loaded
  as a new page. **Lane A's tests check this link too (SWD-002, D11).** If lane A isn't merged when you start, the link opening
  M1 on a phone with no game night is all lane C needs; D11 (a phone with an unfinished night) stays lane A's.
- Boards are the scenarios' own algorithm (`tests/games/secret-words/oracle.ts`): words, kinds and starting team per code.
- Storage read back: `pgn.secretWords.map` = `{ code, savedAt, found: number[], t?, p?, team? }` (the code with or without its
  hyphen). Larger text: `pgn.pref.largerText = true`.
- Time: Playwright's clock (often paused); guards are waited out with 2 s. Screen-on lock: `navigator.wakeLock.request('screen')`
  and the lock's `release()` (a stand-in records both).
- App hidden: `document.visibilityState`/`hidden` changed and `visibilitychange` dispatched; the tests look **in the same task**.

## Privacy (tested first)
| Check | Scenario |
|---|---|
| On `visibilitychange` to hidden: `privacy-cover` in the page and no `map-grid`, `map-cell`, `map-list`, `avoid-line` in the same task (also with a list showing). Back: M1 with the map hidden, "Show map" | SWD-032, 034 |
| After a reload, "← Back" (→ Home), "Hide map", 60 s, "Remove": the page holds no map: none of those test ids, no accessible name with ", orange team" / ", teal team" / ", blank word" / ", nobody's word" / ", the Landmine", no "Orange words (", "Teal words (", "Never guess:" in the HTML | SWD-025, 031, 032, 121 |
| `hide-warning` (`role="status"`) "Still looking? Tap to keep the map" from 50 000 ms; map removed at 60 000 ms, "Show map", lock released. Each `pointerdown` restarts the clock; while the warning shows the first `pointerdown` only removes it (no fade, no dialog). "Show map" and "Next map" start the clock | SWD-121 |
| Lock held while shown; released on "Hide map"; asked again on "Show map" | SWD-034 |

## M1 test ids and roles
| Part | Looked for |
|---|---|
| Heading | `role="heading"` named exactly "Secret Words map"; "Hide map" / "Show map" (buttons, 44 px tall) on its row at the right, sticky (still in view after scrolling to the bottom at 360 × 640) |
| Lines | `map-teams`, `map-code-line`, `my-team` (only with `p=own`), `first-words`, `mismatch-line`, the small line (exact text, also measured: 15 px, 19 px with Larger text), `map-end-line`; top-to-bottom order as SWD-034 v3.6 |
| Grid | `map-grid`; `map-cell` with `data-index` 0–24; text = the word; `aria-label` "Kite, orange team" etc. (+ ", found"); an `svg` inside an `aria-hidden="true"` element, 16 × 16, 2 px from the cell's top left; word weight 600, `text-transform: none`, 1 line. Portrait 390/360: 8 px margins, 4 px gaps, 71.6 / 65.6 px wide, 48–56 px tall |
| `map-key` | under the grid (≤ 16 px), exactly 2 line boxes, texts in order "<orange name>", "<teal name>", "nobody's word", "Landmine: never guess" (Easy: no Landmine), 4 (Easy 3) `svg`s 16 × 16 `aria-hidden`; text ≥ 13 px; long names cut at 12 characters |
| Buttons | "Orange team's words", "Teal team's words", "Whole map" (`aria-pressed`, "Whole map" pressed on opening; stacked full width, 48 px), "Next map", "Clue rules", "Done with this game", "← Back" (→ Home). No `main-button`, no Menu, no "↻"/"Flip the board", no `team-bar`, no `pause-button` |
| Lists | `map-list` with an h2 "Orange words (N)" (faded words left out), `li`s at 24 px (28 px Larger text) in cell order, no buttons inside; `avoid-line` "Never guess: <Word> (the Landmine)" with an `svg` (none on Easy) |
| Fading | a tap on a cell: `aria-label` + ", found", `text-decoration-line` line-through, opacity 1 all the way up, the cell (or something in it) painted `color-mix(in srgb, var(--team-…) 20%, var(--surface))`; `found` saved; a second tap within 500 ms ignored |
| `my-team` | buttons named by the team names (or "Orange team" / "Teal team" for an unknown `t`), 48 px, `aria-pressed`; chosen: "I give clues for: <team>" + "Change" (48 px); the chosen team's list button first |
| Narrow 320 × 568 | Full: `turn-sideways` "Turn your phone sideways to see the board.", grid hidden, no `turn-sideways-hint`, map-key and buttons kept. Easy: 4 × 4, 73 × 48 px |
| Landscape | 812 × 375: grid 16 px from the left, cells ≥ 100 × 56, the column (≤ 200 px wide) right of the grid; 568 × 320: 8 px, ≥ 69 × 54, ≤ 160 px. No page scrolling; the column scrolls to `map-end-line` |
| Toasts | `toast`: "New map opened. The old one is gone." (16 px above the bottom), "Next map. It should start with: A · B · C.", "No more maps from this code. Scan the host's new code." |
| M2 | `role="dialog"` named "Remove this map from your phone?"; "Remove"; `main-button` "Keep it" |
| M3 | `role="dialog"` named "Next map? Only after the host starts the next game."; quiet "Next map"; `main-button` "Not yet"; after "Next map" a tap within 500 ms of it is ignored |

## Not lane C (marked `aheadOfSecretWordsScreens`, expected to fail until those lanes land)
Home's `saved-map` row (lane A), "Clue rules" → How to play (lane A, S5), typed code (lane A, J2), SWD-025 on a board phone that
opened the map (lanes A and B), SWD-022's host board (lanes B and D).
