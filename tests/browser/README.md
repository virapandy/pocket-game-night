# What the browser tests look for (Phase 1a with the 1a.1 fixes, and Phase 1b)

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
- Landscape 844 × 390 (TAM-129): number in the left half, rhyme and last calls in the right half, `Record a win` and `Next number` along the bottom; the number's digits at least 160 CSS px tall and never smaller than in portrait (owner decision, 29 September 2026).
- Setup (TAM-181): `Next` / `Confirm prizes` fixed within 40 px of the bottom on every step, for 6, 12 or 20 players. The ticket-mode step has **no** `Next`: tapping `Paper tickets` goes straight to the players step (owner decision, 29 September 2026).

## Other checks
- `overscroll-behavior-y: none` or `contain` on the page during a game (TAM-111).
- `navigator.wakeLock.request()` during a game and again on return to the front (TAM-110).
- `navigator.vibrate()` on Next number unless turned off (TAM-135); `navigator.storage.persist()` when the first game starts (PLT-013).
- The game survives reload and a closed tab (saved at every change, PLT-003).

## Phase 1b

Every flow goes through `helpers.ts`, so the session question below is answered in one place
(`confirmPrizes`, `answerSession`). Money in `data-*` attributes is a plain whole number of rupees ("150", "-50").

### Sessions (PLT-016, PLT-022, PLT-026)
- After `Confirm prizes`, the **first game of a gathering** asks for a session name before the first number:
  a field labelled `Session name`, filled in with the day as "Sunday 4 Oct" (weekday, day, short month, in the
  phone's time zone), and a `Start` button. `Next number` is not shown until `Start` is tapped.
- Later games (Play again, or New game from home) join that session **without asking**, until a game is started
  more than 3 hours after the session's last game ended. Then the app asks, in text,
  "Continue 'Diwali at Nani's' or start a new session?" with a button whose name starts `Continue ` and a
  button `New session`. `New session` then shows `Session name` (suggesting the day) and `Start`.
- A game stays in the session it was started in, even when resumed and ended the next day.
- Home has a `Sessions` button. The list has one `session` element per session, newest first, each with its
  name, "1 game" / "2 games", and whether its tally is settled ("Settled" / "Not settled").
- Tapping a `session` opens it: one `session-game` element per game in it (money or not), a `Rename…` button
  (then `Session name` and `Save`), and the tally.

### Tally and settling (PLT-017 to PLT-020, PLT-023, PLT-027, PLT-028)
| `data-testid` | What |
|---|---|
| `tally` | The session's unsettled tally. Empty (no `tally-person`) when there is nothing to tally |
| `tally-person` | One per person (matched by name across games), with `data-name`, `data-paid`, `data-got-back`, `data-net`, and the net shown in words and ₹ ("Dad −₹100", "Riya +₹50") |
| `settle-up` | After tapping `Settle up`: the hand-overs, text only |
| `hand-over` | One per hand-over, "Dad pays Riya ₹50", with `data-from`, `data-to`, `data-amount` |
| `settlement` | One per past settle in the session, showing its date and time ("4 Oct, 7:00 pm") |
| `settlement-detail` | What a settle said, after tapping a `settlement`: its own `tally-person` rows. Read-only: no enabled fields, no `Settle up`, `Mark as settled` or `Edit` |

Buttons: `Settle up`; `Mark as settled` (in the session, or under the hand-overs), which opens a `dialog` saying
"Mark 2 games as settled? Do this after the money has changed hands." with its own `Mark as settled` button.
Then the tally is empty, and "Settled." shows with a button whose name starts `Undo` for 5 seconds; undo puts
the games back exactly as before. Settled games show "Settled" in their `history-game` row. No payment links
or buttons anywhere (TAM-090).

### History tools (PLT-006, PLT-009 to PLT-011, PLT-025)
- New game after a setup that was left unconfirmed: the last setup is filled in (players, names, contribution),
  ready to change or confirm. The ticket-mode step may be skipped or shown again.
- A past game (tap a `history-game` row) has `Use this setup`: a new game in Setup with the same names,
  contribution and tier amounts (steps may be skipped, but `Confirm prizes` is still asked), and a new draw.
- A past game has `Delete` (or `Delete game`). It goes back to History at once, the row gone, with "Deleted."
  and a button whose name starts `Undo`, for 5 seconds; afterwards the game is gone for good, also after reload.
  Unfinished games (in progress or paused) have no `Delete`, in History or in `unfinished-games`.
- A game in an unsettled tally: `Delete` first opens a `dialog`: "This game is in the unsettled tally for
  'Diwali at Nani's'. Delete it and take it out of the tally?" with a button whose name starts `Delete`.
  Undo brings it back into the same tally.
- History has `Clear all history`: a `dialog` "Delete all 2 past games from this phone? This can't be undone."
  with `Delete all` and `Keep`; when some are in unsettled tallies it also says how many ("2 … unsettled").
  A game in progress is not touched.

### Late joiners (TAM-067, TAM-184, TAM-093)
- Game menu: `Add a late player` (shown while fewer than the limit are called; disabled or gone at the limit;
  never shown when late joining is 0). It opens a sheet with the field `Name of late player`, an optional
  `Tickets` field (1 by default), and `Add`. The sheet also lists late joiners with a `Remove Kabir` button
  ("Remove <name>"), only until the next number is called.
- After adding or removing: `prize-update`, the new prize amounts for the anchor to announce, one element per
  tier with `data-pattern` ("early-five") and `data-amount`, shown with ₹; closed with `Close` or `Done`.
- The late joiner can be picked in Record a win, and appears in `payout-summary` (with "Pot ₹200" for the new pot).
- Tambola start screen: a `Settings` button with the field `Late joining` (a select or number: numbers until
  which late joining is allowed, 10 by default, 0 = off). The same screen keeps its `Rhyme language` select
  (values `en`, `hi`, `both`), which the voice tests and `rhymes.spec.ts` set to `hi`. With `hi`, a number with
  no Hindi rhyme shows one of its family-friendly English rhymes with an Indian reference in `current-rhyme` (TAM-153). Closed with `Close`, `Done` or `Back`.

### Voice and auto-call (TAM-061, TAM-062, TAM-120, TAM-180, TAM-185 to TAM-187)
- Game Settings (menu → `Settings`): switches (checkbox or `role="switch"`) `Phone speaks the call` and
  `Auto-call`, both off in every new game (also after Play again), and, while auto-call is on, a `select`
  labelled `Time between calls` with options valued `5`, `10`, `15`, `20`, `25`, `30` (seconds), `10` by default.
- Turning either on the first time in a game opens a `dialog` with `Turn on` and `Cancel`; the voice warning
  mentions the anchor; the auto-call warning has its own text. `Cancel` leaves it off. Turning it on again in
  the same game shows no warning.
- A phone with no voice at all (`speechSynthesis` missing): `Phone speaks the call` is disabled, with a one-line
  reason such as "This phone has no voice".
- Speech uses the standard `speechSynthesis.speak(new SpeechSynthesisUtterance(text))`, choosing a voice from
  `getVoices()` by setting `utterance.voice` (or `utterance.lang`): en-IN first, otherwise any `en-*`; a Hindi
  rhyme only in a `hi-*` voice, and without one only the number is said. Per call the words, joined in order,
  are the number (digits or words), the rhyme exactly as shown in `current-rhyme`, then the number again.
  `Repeat` says the same again; `Another rhyme` says the number with the new rhyme.
- While the voice is on, the calling screen has `Mute voice` (then `Unmute voice`), one tap, no warning.
- If speaking fails (the utterance ends with an `error` event), the game carries on and "The phone's voice
  isn't working; the anchor calls" shows once per game.
- Auto-call: while running, a `Pause auto-call` button; when paused, `Resume auto-call` (or
  "Paused: tap to resume") in exactly the same place. Record a win, Check numbers, a won tier waiting to be
  closed, and Undo last call all pause it; it stays paused until the host resumes, and the timer then starts
  from zero. Going to the background (`visibilitychange` to hidden) pauses it and shows "Paused: tap to resume",
  which resumes it when tapped. A new timer applies from the next call. Timers use `setTimeout`/`setInterval`
  and `Date` (the tests use Playwright's fake clock).

### Dark mode (TAM-134, TAM-188)
- A switch `Dark mode` in the Tambola start screen's `Settings` and in the game's Settings. The app starts light
  even when the phone is set to dark (`prefers-color-scheme: dark`). The choice is remembered on this phone.
- The page paints an opaque background on `html` or `body` (the tests read it). In dark mode every text meets
  4.5:1 (3:1 for 24 px or 18.66 px bold), 7:1 for `current-number`; sizes of the number, rhyme and buttons are
  exactly as in light mode; chips and results keep ✓ and ●.
