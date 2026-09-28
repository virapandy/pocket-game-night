# What the browser tests look for (Phase 1a, with the 1a.1 feedback fixes)

For the Build workspace. The browser tests find things the way a person would: by the button's words,
a field's label, or (where there are no words to use) a `data-testid`. Names come from the scenarios and
`docs/games/tambola/journeys.md`. If one of these doesn't fit the design, ask in `docs/test-questions.md`.

The shared steps live in `helpers.ts`.

## Buttons (accessible name)
| Where | Buttons |
|---|---|
| Home | `Tambola…` (the game card), `History` |
| Tambola start | `New game`, `How to play` |
| Setup | `Paper tickets`, `Phone tickets…` (may be disabled until Phase 2), `Next`, `No money`, one-tap name suggestions named after the name, `Confirm prizes`, a `Remove…` control per removable tier (TAM-183) |
| Game: top bar (`top-bar`) | `Back`, the progress text "23 of 90 called", `Menu` (the ⋯ with its word, TAM-109) |
| Game: calling screen | `Repeat`, `Another rhyme` (quiet text buttons), `Record a win` (its own row, not filled), `Next number` (full width at the very bottom, the only filled button). Nothing else: End game and Discard game are only in the menu (TAM-124) |
| Game: menu | `Settings`, `Show the room`, `Board`, `Check numbers`, `End game`, `Discard game`, as `menuitem`s or buttons, visible only once `Menu` is tapped. A long press on the number also opens Show the room |
| Record a win (TAM-037) | one button per pattern in play (`Early Five`, `Top Line`, `Middle Line`, `Bottom Line`, `Four Corners`, `Full House`, `Second Full House`), then one button per player name (tap several for a tie), then `Confirm`, or `Bogey` to record a bogey for the picked player. `Cancel` or `Back` to leave. No number field |
| Check numbers (TAM-139) | one button per pattern in play, the field `Numbers read out`, `Check`, and `Close`, `Done`, `Back` or `Cancel` |
| After a recorded win (TAM-145, TAM-126) | `Add another winner` (goes straight to picking the player; the pattern is kept; then `Confirm`), `Close Top Line` ("Close <Pattern>", also the chip's Close); the main button reads "Close Top Line first" and no number can be drawn until the tier is closed. After the last Full House is closed: `End game and show payouts`. The result has `Undo…` |
| Undo toast (TAM-125) | inside `undo-toast`: a button named `Undo…` |
| Board sheet (TAM-127) | a `role="dialog"` holding `board`, with `Close`, `Done` or `Back` |
| Screen-sleep tip (TAM-128) | text "keep your screen on", `Got it`, `OK` or `Close`; afterwards "Screen may sleep" in the top bar |
| Dialogs (`role="dialog"`) | End: text "End the game and show payouts?", `End game`, `Keep playing`. Discard: `Discard…`, and "N prize(s) was/were already won" when true. Undo claim: `Undo…` |
| After the game | `Play again` |
| Resume | `Tap to resume`, or after 12 hours `Resume`, `End it…`, `Discard it…` |
| Settings (from the menu) | a checkbox or switch named `Vibration`; `Done`, `Close` or `Back` |
| iPhone tip | inside `install-tip`: `Got it`, `Close` or `OK` |
| History | `Delete oldest…` when storage is nearly full |

## Fields (label)
`Number of players` · `Name of player 1`, `Name of player 2` … · `Contribution per ticket` ·
`Top Line amount` (one per tier: "<Pattern> amount"; the only place each tier's amount is shown, TAM-183, and what TAM-081/TAM-084 read) · `Numbers read out` (Check numbers only; accepts "4 23 41 62 85").
`Contribution per ticket` holds a real value, 50, when the step opens (TAM-182); a refused value shows a one-line
reason in an element with `role="alert"`.

## Test ids
| `data-testid` | What |
|---|---|
| `current-number` | The called number: only its digits |
| `current-rhyme` | Its rhyme (empty only if there is none, TAM-015) |
| `last-calls` | Recent calls; each number in an element with `data-number` |
| `board` | The 1–90 board; each cell has `data-number`, called ones `data-called="true"` |
| `room-view` | "Show the room"; contains its own `current-number`, `current-rhyme`, `last-calls`; a tap anywhere returns |
| `claim-result` | A recorded win or bogey, in large text (at least 24 CSS px): "Top Line: ✓ Riya, ₹60" ("Player 4" if unnamed; no ₹ with No money), or "✗ Bogey" with the name and pattern; "Shared" for a tie. With paper tickets no ticket or numbers are shown (no `data-called` inside) |
| `check-result` | The Check numbers helper: each typed number as "23 ✓" or "91 ✗" with `data-called="true"/"false"`, and whether they complete the pattern ("complete" / "not complete"); a one-line reason for wrong input, such as "Top Line needs 5 numbers" |
| `top-bar` | The calling screen's top bar |
| `prize-chips` | The row of prize chips; scrolls sideways inside itself if needed, all chips on one line |
| `prize-chip` | One tier: open "Top ●", won "Early 5 ✓ Riya" (with a `Close…` button until closed), closed (greyed, no ●, no Close) |
| `undo-toast` | "Called 21 · Undo (5s)", floating just above `Record a win`; moves nothing |
| `payout-summary` | The end-of-game summary: each tier's winners or "not won"; per person paid, won, handed back and net (TAM-088, TAM-089); "Bogey: Riya" for recorded bogeys; no "handed back" with No money |
| `unfinished-games` | Home list of unfinished games: "Tambola, 8:40 pm, 23 numbers called" ("1 number called") |
| `history-game` | One row per past game |
| `call-list` | Every call of a past game, each with `data-number` |
| `sample-ticket` | The sample ticket on How to play |
| `install-tip` | The one-time iPhone tip |

## Texts
"All 90 numbers called" · "Game resumed" · "Tap to resume" · "keep your screen on" · "only on this phone" (History) ·
"storage is nearly full" · "hand back" (discard summary) · "initial" (duplicate name) · "Abandoned" (History)

## Layout checks (390 × 844 unless stated)
- The page never scrolls on the calling screen (TAM-138); `current-number` stays fully on screen; nothing but the top bar above it (TAM-123).
- `current-number` digits at least 160 CSS px, its box at least 30% of the screen height; `current-rhyme` under it at 24 CSS px or more; `last-calls` under that.
- Landscape 844 × 390 (TAM-129): number in the left half, rhyme and last calls in the right half, `Record a win` and `Next number` along the bottom.
- Setup (TAM-181): `Next` / `Confirm prizes` fixed within 40 px of the bottom on every step, for 6, 12 or 20 players.

## Other checks
- `overscroll-behavior-y: none` or `contain` on the page during a game (TAM-111).
- `navigator.wakeLock.request()` during a game and again on return to the front (TAM-110).
- `navigator.vibrate()` on Next number unless turned off (TAM-135); `navigator.storage.persist()` when the first game starts (PLT-013).
- The game survives reload and a closed tab (saved at every change, PLT-003).
