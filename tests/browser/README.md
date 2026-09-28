# What the browser tests look for (Phase 1a)

For the Build workspace. The browser tests find things the way a person would: by the button's words,
a field's label, or (where there are no words to use) a `data-testid`. Names come from the scenarios and
`docs/games/tambola/journeys.md`. If one of these doesn't fit the design, ask in `docs/test-questions.md`.

The shared steps live in `helpers.ts`.

## Buttons (accessible name)
| Where | Buttons |
|---|---|
| Home | `Tambola…` (the game card), `History` |
| Tambola start | `New game`, `How to play` |
| Setup | `Paper tickets`, `Phone tickets…` (may be disabled until Phase 2), `Next`, `No money`, one-tap name suggestions named after the name, `Confirm prizes` |
| Game | `Next number`, `Repeat`, `Another rhyme`, `Undo last call` (only within 5 s), `Show the room`, `Check a claim`, `Board` (only if the board isn't always shown), `Settings`, `End game`, `Discard game` |
| Check a claim | one button per player name, one per pattern in play (`Early Five`, `Top Line`, `Middle Line`, `Bottom Line`, `Four Corners`, `Full House`, `Second Full House`), `Check`, `Cancel` or `Back`, then `Undo…` on the result |
| Dialogs (`role="dialog"`) | End: text "End the game and show payouts?", `End game`, `Keep playing`. Discard: `Discard…`, and "N prize(s) was/were already won" when true. Undo claim: `Undo…` |
| After the game | `Play again` |
| Resume | `Tap to resume`, or after 12 hours `Resume`, `End it…`, `Discard it…` |
| Settings | a checkbox or switch named `Vibration`; `Done`, `Close` or `Back` |
| iPhone tip | inside `install-tip`: `Got it`, `Close` or `OK` |
| History | `Delete oldest…` when storage is nearly full |

## Fields (label)
`Number of players` · `Name of player 1`, `Name of player 2` … · `Contribution per ticket` ·
`Top Line amount` (one per tier: "<Pattern> amount") · `Numbers read out` (accepts "4 23 41 62 85")

## Test ids
| `data-testid` | What |
|---|---|
| `current-number` | The called number: only its digits |
| `current-rhyme` | Its rhyme (empty only if there is none, TAM-015) |
| `last-calls` | Recent calls; each number in an element with `data-number` |
| `board` | The 1–90 board; each cell has `data-number`, called ones `data-called="true"` |
| `room-view` | "Show the room"; contains its own `current-number`, `current-rhyme`, `last-calls`; a tap anywhere returns |
| `tier-amount` | Each tier's amount on the prizes step |
| `claim-result` | The verdict: "✓ Accepted" or "✗ Bogey", "Accepted: ₹60 to Riya", "Top Line was complete at 45"; each read-out number shown as "23 ✓" or "91 ✗" with `data-called="true"/"false"` |
| `payout-summary` | The end-of-game summary |
| `unfinished-games` | Home list of unfinished games: "Tambola, 8:40 pm, 23 numbers called" ("1 number called") |
| `history-game` | One row per past game |
| `call-list` | Every call of a past game, each with `data-number` |
| `sample-ticket` | The sample ticket on How to play |
| `install-tip` | The one-time iPhone tip |

## Texts
"All 90 numbers called" · "Game resumed" · "Tap to resume" · "keep your screen on" · "only on this phone" (History) ·
"storage is nearly full" · "hand back" (discard summary) · "initial" (duplicate name) · "Abandoned" (History)

## Other checks
- `overscroll-behavior-y: none` or `contain` on the page during a game (TAM-111).
- `navigator.wakeLock.request()` during a game and again on return to the front (TAM-110).
- `navigator.vibrate()` on Next number unless turned off (TAM-135); `navigator.storage.persist()` when the first game starts (PLT-013).
- The game survives reload and a closed tab (saved at every change, PLT-003).
