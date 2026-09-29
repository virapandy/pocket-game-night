# What the browser tests look for (Phase 1a with the 1a.1 fixes, Phase 1b, and Phase 2)

For the Build workspace. The browser tests find things the way a person would: by the button's words,
a field's label, or (where there are no words to use) a `data-testid`. Names come from the scenarios and
`docs/games/tambola/journeys.md`. If one of these doesn't fit the design, ask in `docs/test-questions.md`.

The shared steps live in `helpers.ts`.

## Buttons (accessible name)
| Where | Buttons |
|---|---|
| Home | `Tambola…` (the game card), `History` |
| Tambola start | `New game`, `How to play` |
| Setup | `Paper tickets`, `Phone tickets…` (enabled from Phase 2; see "Phase 2: phone tickets" below), `Next`, `No money`, one-tap name suggestions named after the name, `Confirm prizes`, a `Remove…` control per removable tier (TAM-183) |
| Game: top bar (`top-bar`) | `Back`, the progress text "23 of 90 called", `Menu` (the ⋯ with its word, TAM-109) |
| Game: calling screen | `Repeat`, `Another rhyme` (quiet text buttons), `Record a win` (its own row, not filled), `Next number` (full width at the very bottom, the only filled button). Nothing else: End game and Discard game are only in the menu (TAM-124) |
| Game: menu | `Settings`, `Show the room`, `Board`, `Check numbers`, `End game`, `Discard game`, as `menuitem`s or buttons, visible only once `Menu` is tapped. A long press on the number also opens Show the room |
| Record a win (TAM-037) | one button per pattern in play (`Early Five`, `Top Line`, `Middle Line`, `Bottom Line`, `Four Corners`, `Full House`, `Second Full House`), then one button per player name (tap several for a tie), then `Confirm`, or `Bogey` to record a bogey for the picked player. `Cancel` or `Back` to leave. No number field |
| Check numbers (TAM-139) | one button per pattern in play, the field `Numbers read out`, `Check`, and `Close`, `Done`, `Back` or `Cancel` |
| After a recorded win (TAM-145, TAM-126, TAM-198) | The main button (`main-button`, where `Next number` was) **becomes** `Close Top Line` ("Close <Pattern>"): filled, enabled, same size and place; no button is named `Next number` until the tier is closed. `Add another winner` sits just above it (secondary, not filled; goes straight to picking the player; the pattern is kept; then `Confirm`). Only the main button is named exactly "Close <Pattern>": the won prize's chip **keeps** a Close, named just `Close`, which closes the prize too. The rest of the calling screen is dimmed and taps there do nothing, except `Add another winner`, the chip's `Close` and `Menu` (with End game, Discard game, Show the room), which still work (see "After a win, closing the prize is the main action" below). After the last Full House is closed: `End game and show payouts`. The win card has `Undo…` |
| Undo toast (TAM-125) | inside `undo-toast`: a button named `Undo…` |
| Board sheet (TAM-127) | a `role="dialog"` holding `board`, with `Close`, `Done` or `Back` |
| Screen-sleep tip (TAM-128) | text "keep your screen on", `Got it`, `OK` or `Close`; afterwards "Screen may sleep" in the top bar |
| Dialogs (`role="dialog"`) | End: text "End the game and show payouts?", `End game`, `Keep playing`. Discard: `Discard…`, and "N prize(s) was/were already won" when true. Undo claim: `Undo…` |
| After the game | `Play again` and `Session tally` (TAM-197), both fixed at the bottom of the screen (TAM-181); `Session tally` opens the session screen of the session this game is in. Below the person rows: `Settle with host` (TAM-089) and `Settle with players` (TAM-199) |
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
| `prize-chip` | One tier: open "Top ●", won "Early 5 ✓ Riya" (a `Close` button on it until closed is optional since TAM-198), closed (greyed, no ●, no Close) |
| `undo-toast` | "Called 21 · Undo (5s)", floating just above `Record a win`; moves nothing |
| `payout-summary` | The end-of-game summary: each tier's winners or "not won"; one `payout-person` row per person with paid, won and net (TAM-088, TAM-089); the pot ("₹300"); "Bogey: Riya" for recorded bogeys; no "handed back", no "Host gives" and no ₹ with No money |
| `payout-person` | One per person in `payout-summary`, with `data-name`, `data-paid`, `data-won` (prizes only), `data-net` (= won + money handed back − paid), whole rupees; its text has the name and the words "paid", "won" and "net", and the net in ₹ |
| `settle-with-host` | After tapping `Settle with host` (TAM-089): one `host-gives` per person, with `data-name`, `data-amount` (= paid + net: prize plus money handed back) and the text "Host gives Riya ₹77". The amounts add up to the pot |
| `settle-with-players` | After tapping `Settle with players` (TAM-199): one `hand-over` per hand-over for **this game only**, with `data-from`, `data-to`, `data-amount` and the text "Dad pays Riya ₹50" (exactly that form); the fewest hand-overs, and everyone ends at ₹0 (as `settleUp` in tests/contract/README.md). No `hand-over` on the payout screen before the button is tapped |
| `main-button` | The big button at the bottom of the calling screen: `Next number`, or `Close Top Line` while a win waits to be closed (TAM-100, TAM-198) |
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
- Phone-ticket game (TAM-212, Phase 2, `phone-late-joiners.spec.ts`): after `Add`, the hand-out screen (`hand-out`,
  as before the game) shows the joiner's tickets from the next sheet, "Ticket 7 → Kabir (1 of 2)", with `ticket-qr`
  and `ticket-code`; `Next ticket` between them, and after the last one `Back to calling` (or `Start calling`), which
  returns to the calling screen with the calls kept. `prize-update` may show before or after the hand-out. The
  joiner's tickets are in menu → `Tickets` with their name.
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

## Money and 1b review fixes (29 September 2026) and play-test fixes (30 September 2026)

Tests: `payouts-and-tally.spec.ts`, `close-prize.spec.ts`, `session-line.spec.ts`, and changes in `claims.spec.ts`,
`layout.spec.ts`, `lifecycle.spec.ts`, `usability.spec.ts`. Shared steps in `helpers.ts` (`mainButton`,
`payoutPeople`, `hostGivesList`, `handOvers`, `expectAtBottom`, `expectNotHiddenBehind`).

### The payout screen (TAM-088, TAM-089, TAM-199, TAM-197, TAM-181; owner 2026-09-30)
- `payout-person` rows (paid, won, net) as in the test-id table above, then two buttons: `Settle with host` shows
  `settle-with-host` ("Host gives Riya ₹77" per person; the host gives out exactly the pot, to the rupee) and
  `Settle with players` shows `settle-with-players` (this game's hand-overs, fewest possible, "Dad pays Riya ₹50").
  The session tally keeps its own `Settle up` (PLT-028, unchanged).
- `Play again` and `Session tally` fixed at the bottom (bottom edge within 40 px of the screen's, fully on screen
  without scrolling, same place after scrolling), also with 20 players; the last `payout-person` can be scrolled
  into view above them and is not covered.
- `Session tally` opens that game's session: `tally` visible and the session's name on the screen.

### The session screen (TAM-181, PLT-017, TAM-109)
- `Settle up` and `Mark as settled` (when shown) fixed at the bottom the same way, with 20 people in the tally;
  after `Settle up`, `Mark as settled` too; the last `tally-person` and the last `hand-over` scroll into view above them.
- Each `tally-person` is one compact row (at most 60 CSS px tall at 390 × 844) with the name and the balance ("₹…"
  or "Even"); seven rows fit on the screen at once. `data-paid`, `data-got-back`, `data-net` stay as they are.
- Tapping a `tally-person` shows `tally-person-detail` (PLT-017, owner 2026-09-30): the person's paid, won (prizes only)
  and got back (= `data-got-back`), each as a word and its amount, such as "Paid ₹50", "Won ₹0", "Got back ₹40" (the
  word within 20 characters before the amount, or just after it).
- Sessions list: each session is (or holds) a button whose **accessible name** holds the session's name, "1 game" /
  "2 games" and "Not settled" (or "Unsettled") / "Settled"; tapping it opens the session.

### After a win, closing the prize is the main action (TAM-198, TAM-145, TAM-126)
- `main-button` reads `Close Top Line` (accessible name exactly that), filled (a solid background, not the page's),
  enabled, at the same place and size as `Next number` (within 1 px), not covered and not faded.
- `Add another winner`: at most 24 px above `main-button`, overlapping it sideways, with a different background.
- Dimmed: `Record a win` and the top bar's "of 90 called" are dimmed: either a translucent
  layer lies over them (the topmost element at their centre, or its parent, has a background with alpha between
  0.05 and 0.98, or a backdrop blur/brightness), or they are faded (opacity ≤ 0.7 up the tree, or a brightness,
  grayscale or opacity filter). Not dimmed: `claim-result` (with its `Undo…`), `current-number`, `main-button` and
  `Add another winner`: each topmost at its centre, opacity ≥ 0.95, no filter.
- Still working while dimmed (owner, 2026-09-30), so topmost at their centre (whether they look dimmed is not
  checked): `Menu` (opens with `End game`, `Discard game`, `Show the room`, each working as usual; End game pays the
  won prize), the won chip's `Close` (inside its `prize-chip`; closes the prize exactly like `Close Top Line`) and
  `Add another winner`.
- A tap elsewhere in the dimmed area (where `Record a win` or the top bar's "of 90 called" is) opens nothing and changes nothing, and starts an
  animation on `main-button` (or inside it) that plays once (`getAnimations()` iterations 1; a CSS animation,
  transition, or `element.animate`), then stops within 2 s. Before any stray tap, nothing on the button animates,
  and nothing ever repeats (no infinite iterations).
- Tapping `Close Top Line` closes the prize: the dimming goes, the win card goes by itself, `main-button` reads
  `Next number` again, in the same place. Undoing the win (TAM-070) also ends the dimming. A bogey never dims.

### The session line before the game (PLT-029)
- On the last setup step (`Confirm prizes`), for Play again and for a New game within the session's 3 hours:
  `session-line`, one line (at most 56 CSS px tall) above `Confirm prizes`, with the text "Session: <name>" and a
  button whose name starts `Change`. With no change, `Confirm prizes` starts the game in that session with **no**
  session question.
- `Change` shows `New session` and one button per recent **unsettled** session, named starting with the session's
  name (a settled session is not offered). `New session` shows `Session name`, filled in with the day
  ("Sunday 4 Oct"), and `Save`; then the line reads "Session: <new name>" and `Confirm prizes` starts the game in the
  new session without asking again. Picking a session makes the line read "Session: <that name>".
- The first game of all, and a game more than 3 hours after the session's last one (owner, 2026-09-30): the line
  reads "Session: <the day> (new)" ("Session: Monday 5 Oct (new)") with `Change`. With no change, the game starts that
  new session. `Change` lists `New session` and up to 3 unsettled sessions whose games were in the last 7 days.
  Whether the PLT-016 question still follows `Confirm prizes` in these two cases is not decided; the tests accept both
  (the helper `confirmPrizes` names a session through `Change` when the line says "(new)").

## Phase 2: phone tickets (owner sign-off 29 September 2026)

Tests: `phone-tickets.spec.ts` and `phone-claims.spec.ts`; shared steps in `phone.ts`. Each phone is its own browser
context (its own storage), made by `newPhone` with the same device settings as the test's project, so every test
runs on the Android and the iPhone sizes. Players' phones are 390 × 844 portrait (`PORTRAIT`) unless a test turns
them to 844 × 390 (`LANDSCAPE`). Scenarios: TAM-020, TAM-022, TAM-023, TAM-030, TAM-032, TAM-033, TAM-036, TAM-038,
TAM-044, TAM-050, TAM-051, TAM-055 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170 to TAM-179,
TAM-190 to TAM-196, TAM-212 (`phone-late-joiners.spec.ts`).

### The camera test hook (host phone)
The host's camera is replaced in tests, before the page loads, by `window.__pgnCamera`. When it exists, "Scan a
claim" must call `window.__pgnCamera.start(onRead, onFail)` instead of opening the real camera, and call the function
`start` returns when the scanner closes. `onRead(text)` hands the app the text of a QR the camera read;
`onFail(why)` says the camera cannot be used (`'denied'`: permission refused; `'no-camera'`: none). Without the hook
the app uses the real camera. The app's own 10-second "no read" timer uses `setTimeout` or `Date` (the tests use
Playwright's fake clock). A QR's text is always also in a `data-payload` attribute on the element that shows it, so
tests read the text from there. Two checks (TAM-117 ticket QR, TAM-177 claim QR) also photograph the QR as drawn and
read it with jsQR (`readDrawnQr` in `phone.ts`): what is drawn must read back exactly as `data-payload`.

### Setup and handing out (host)
- Setup: `Phone tickets` (accessible name starting "Phone tickets"), then the shared players step with, per player,
  a select or number field labelled `Tickets for player 1`, `Tickets for player 2` … (1 by default, 1 to 3), then
  `Next`, the contribution, `Next`, `Confirm prizes` (and the session question or line, as for paper).
- Then the hand-out screen, `hand-out`:
  - `hand-out-ticket`: "Ticket 3 → Riya (1 of 2)" (arrow `→`; "(k of n)" is this player's k-th of n tickets). The name
    is a button (the first button inside `hand-out-ticket`); tapping it lists the players as buttons named by name;
    picking one gives this ticket to that player before the QR is shown (TAM-172).
  - `ticket-qr`: the QR, at least 200 × 200 CSS px, drawn as `svg`, `canvas` or `img`, with `data-payload` holding
    the whole link it encodes: the app's own address (`…/pocket-game-night/…`) with the ticket in it, so a phone's
    camera opens the app (TAM-117). The text "Scan with your phone's camera".
  - `ticket-code`: the typed code, exactly "K7QM-2XPA-9RTD-4HWC-B3NF": 20 letters and digits (no 0, O, 1, I, L) in 5
    groups of 4 joined by `-` (TAM-117, owner decision 2026-09-30). Typed on a phone, it opens the ticket with its
    number and the game code in `phone-ticket-header`.
  - `hand-out-progress`: "0 of 4 handed out", counting each `Next ticket` (TAM-132).
  - `hand-out-waiting`: "Waiting: Asha 2, Dad 1": every player still waiting for a ticket; a player leaves the list once
    all their tickets are handed out.
  - `game-code`: the 4-character game code (TAM-170). Also shown on the calling screen (top bar or its own line).
  - Buttons: `Next ticket`, which becomes `Start calling` after the last ticket (then the calling screen);
    `Can't scan? Give a paper ticket`: that player plays on paper, and the rest of their tickets are skipped (TAM-058).
- Calling screen with phone tickets: `Scan a claim` (exactly this name, owner decision 2026-09-30) instead of, or next to,
  `Record a win`. With paper players in the game (TAM-058), `Record a win` stays, as in 1a.1, for them.
- Menu → `Tickets` (TAM-056, host only): one `host-ticket` per ticket in the game, with `data-ticket`, the owner's
  name in its text, 27 `[data-cell]` cells as below, a button starting `Change owner` (then player buttons by
  name, TAM-175) and a button starting `Switch to paper` (the player moves to paper; the ticket's text then says
  "paper"). Closed with `Close`, `Done` or `Back`.

### The player's phone
- Scanning a ticket = opening the `data-payload` link. The ticket appears with no network requests to any other
  server; it opens with no internet once the phone has opened the app (TAM-057). Scanning further tickets of the
  same game adds them; a ticket of a new game replaces the old game's tickets, marks and all (TAM-171).
- Typing a code: the home screen has `Enter ticket code`, then the field `Ticket code` and `Open ticket`. A code that
  is not a ticket shows a one-line reason in `role="alert"`.
- `phone-ticket`: one per ticket shown, with `data-ticket`. Inside, 27 elements with `data-cell`, in row order (row 1
  left to right, then rows 2 and 3); numbered cells also have `data-number`, blanks have none (or empty). A marked cell
  has `data-marked="true"`, a different background and a "✓" in its text (TAM-131). Cells that the "your marks fill a
  pattern" cue outlines have `data-cue="true"`; cells outlined on the claim screen have `data-outlined="true"`.
- `phone-ticket-header`: "Riya · Ticket 3 · Game 7K3P · 8:40 pm": the name, "Ticket 3", the game code and the start
  time (h:mm) (TAM-170). "Listen to the anchor" somewhere on the screen.
- No `current-number`, `last-calls`, `board`, `room-view` and no `[data-called]` on a player's phone; the only
  `[data-number]` elements are the player's own tickets' numbers (TAM-050, TAM-051).
- `Prizes` (button starting "Prizes") opens `prize-list`: one `prize-item` per prize in this game, named by the prize
  ("Top Line"). Tapping one crosses it out: `data-crossed="true"`, greyed, with "won"; tapping again undoes it (TAM-196).
- `Menu` (named "Menu") holds `Larger text` (a switch, checkbox, button or menu item): all text grows; no cell's text
  is cut off, no cells overlap, nothing runs off the side (TAM-121).
- Layouts (TAM-173, TAM-191, TAM-122): with several tickets, all are shown by default: portrait 390 × 844 stacked in
  ticket order, no page scrolling, every cell at least 40 × 40 CSS px, rows running left to right; landscape 844 × 390:
  the first two side by side, the third below, no scrolling, cells at least 40 px. Turning the phone keeps every mark.
  `One at a time` shows one ticket (cells at least 44 px) with tabs, `role="tab"`, named `Ticket 3`, `Ticket 4` …
  (the visible text may be shorter); `All tickets` goes back. The choice is remembered on the phone, for the next game too.
- `Quick mark` (TAM-192): `quick-mark-pad` with buttons named `1` to `90`; `quick-mark-message`: "✓ 36 marked on ticket
  3", "37: not on your tickets" (for a number on two tickets, both ticket numbers, TAM-194); tapping a marked number
  again unmarks it. Under the pad, one `quick-mark-thumbnail` per ticket, with `data-ticket` and cells as in
  `phone-ticket` (a marked cell's background differs from an unmarked one's). Tapping a thumbnail shows that ticket
  alone (as `One at a time`, cells at least 44 px); `Back` returns to quick mark, and `Back` in quick mark returns to
  the tickets.
- `pattern-cue` (TAM-195): one element holding the cue lines, such as "Your marks fill the top row of ticket 3. Shout if
  it's right!" (one line per filled prize; Early Five mentions the ticket, not a row or corners). It exists only
  while the player's marks fill a prize in this game; never a verdict ("accepted", "correct", "winner"), never a claim.
- `Show claim` (TAM-177, TAM-190, TAM-193): with several tickets, "Which ticket?" and buttons `Ticket 3` …; then one
  button per prize in this game (`Early Five`, `Top Line` …; a crossed-out prize is disabled or not offered). Then
  `claim-screen`: the text "Top Line · Ticket 3 · Riya" (any case), "Show this to the host", `claim-qr` with
  `data-payload` (the claim QR's text), above one `phone-ticket` (the claimed one) with the pattern's cells
  `data-outlined="true"` (Top Line: the top row; Four Corners: the corners; Full House: all 15; Early Five: none),
  and `Done`. Never a verdict.

### Checking a claim (host)
- `Scan a claim` opens `claim-scanner` and starts the camera at once (the hook's `start` is called
  on the tap). `Enter ticket number` is always visible there. If the camera fails, or no QR is read within 10
  seconds, the text "Enter the ticket number instead" shows and the field `Ticket number` takes over (hidden before
  10 seconds). The typed path: `Ticket number`, a prize button (if the prize is not already picked), `Check`.
- The verdict appears in `claim-result` within 2 seconds of the read, with no internet: "Top Line: ✓ Accepted, ₹60
  to Riya" (the ticket's owner, TAM-174), "Top Line: ✗ Bogey: 72 not called" (the pattern's numbers not called), or
  for a late claim "✗ Bogey" with "Top Line was complete at 45" (TAM-038). It shows the ticket with called numbers
  marked `data-called="true"` (TAM-033). After an accepted claim, closing works as with paper (`main-button` reads
  `Close Top Line`).
- Refusals go in `claim-refused`, never as a bogey, and change nothing: "This claim is for another game (code
  7K3P)", "Top Line already won", "Ticket 3 is out", "This claim doesn't match ticket 3" (with `Check ticket 3 by
  number`), a plain reason for anything that is not a claim QR, and for a typed number "No ticket 14 in this game".
  Closed with `Close`, `OK`, `Done` or `Cancel`.
