# What the browser tests look for (Phase 1a with the 1a.1 fixes, Phase 1b, and Phase 2)

For the Build workspace. The browser tests find things the way a person would: by the button's words,
a field's label, or (where there are no words to use) a `data-testid`. Names come from the scenarios and
`docs/games/tambola/journeys.md`. If one of these doesn't fit the design, ask in `docs/test-questions.md`.

The shared steps live in `helpers.ts`.

## Quick verify: the smoke set and the area map (change SOP, 3 October 2026)
`docs/change-sop.md` runs the complete browser suite only before a release. On every push the automation runs
the **smoke set** plus the specs for the **area** the change touched.

**Smoke set:** 16 tests tagged with Playwright's tag option (`test('…', { tag: '@smoke' }, async …)`). Together they
walk the core journeys end to end. About 51 s on Android with one worker (measured 3 October on app b223754).
```
npm run build && npm run test:browser -- --project=android --grep @smoke
npm run test:browser -- --project=android --grep @smoke --workers=1   # the CI timing
```
**On the owner's Mac (owner, 3 October):** every local browser run uses at most 3 workers and runs at low
priority on the efficiency cores, because the owner uses the Mac meanwhile:
```
caffeinate -i taskpolicy -b npm run test:browser -- --project=android --grep @smoke --workers=3
```
Heavy or complete runs belong on GitHub, not on the Mac.
| Journey | Test |
|---|---|
| Open the app, Home | `app-shell.spec.ts` "the home screen opens and lists Tambola" |
| Offline reopen (Android) | `app-shell.spec.ts` "after one visit, the app opens with no internet" |
| Host a paper game to the first call | `calling.spec.ts` TAM-010 |
| Record a win and close it | `claims.spec.ts` TAM-145 "after Close Top Line the win goes away by itself" |
| End game and payouts | `payouts-and-tally.spec.ts` TAM-088/089 "one row per person with paid, won and net" |
| Settle tab | `payouts-and-tally.spec.ts` TAM-088/089 "Settle with host" |
| Sessions and tally | `sessions.spec.ts` PLT-017/019/020/027/028 "two ended games and one in progress" |
| Hand out a phone ticket | `phone-tickets.spec.ts` TAM-172/132 |
| Open it on a player's phone | `phone-tickets.spec.ts` TAM-055/056 |
| Quick mark | `phone-tickets.spec.ts` TAM-192 "tap the number heard" |
| Typed-code fallback | `phone-tickets.spec.ts` TAM-117/057 "typing the code on a phone opens the same ticket" |
| Show claim | `phone-claims.spec.ts` TAM-177/193 |
| Scan a claim: accepted | `phone-claims.spec.ts` TAM-177/174/020/033 |
| Scan a claim: bogey | `phone-claims.spec.ts` TAM-177/022/023 |
| Report a problem | `report-problem.spec.ts` PLT-200/201/208 "from the payout screen" |
| Dark mode | `dark-mode.spec.ts` TAM-134 "the host can switch to dark mode during a game" |

The tag changes only which tests are picked, never what they check. Adding or removing a smoke test is the
Test role's job; keep the set near 15 tests and under about 2 minutes on Android with one worker.

**Area map:** `tests/browser/areas.json` maps app paths (globs: `**` any depth, `*` within one folder) to the
spec files that cover them. For each changed path, every area whose `paths` match adds its `specs`; the smoke set
always runs too. A path no area matches runs the smoke set only (`default`). `specs: ["*"]` (build, dependencies,
shared test helpers) means every spec; a changed spec file runs itself. Each area names its lane:
**A** player's phone (`PhoneTickets.tsx`, `TicketGrid.tsx`, `phoneFacts.ts`, `qr.tsx`), **B** host calling,
claims, payouts, settings and summary (`Play.tsx`, `scanner.ts`, `Settings.tsx`, `voice.ts`, `Summary.tsx`,
`format.ts`, `theme.ts`), **C** host setup and hand-out (`Setup.tsx`, `SessionQuestion.tsx`, `HandOut.tsx`), or
`shared` (app shell, engine, rules, content, storage: a change there reaches several lanes). Example, to run
lane A's specs by hand:
```
npm run test:browser -- --project=android phone-tickets phone-claims pattern-cue held-tickets
```

## Buttons (accessible name)
| Where | Buttons |
|---|---|
| Home | `Host a game…` and `Join with my ticket…` (PLT-300, see "UX list of 1 October 2026" below); `Sessions`, `History`, `Report a problem`, `Settings`, directly or inside a `Menu` button |
| Tambola start | `New game`, `How to play`; the text "Housie on paper or on phones" (TAM-213) |
| Setup | `Paper tickets…`, `Phone tickets…` (two cards, then `Next`, TAM-213; see "UX list of 1 October 2026"), `Next`, `No money`, one-tap name suggestions named after the name, `Confirm prizes`, a `Remove…` control per removable tier (TAM-183) |
| Game: top bar (`top-bar`) | `Back`, the progress text "23 of 90 called", `Menu` (the ⋯ with its word, TAM-109) |
| Game: calling screen | `Repeat`, `Another rhyme` (quiet text buttons), `Record a win` (its own row, not filled), `Next number` (full width at the very bottom, the only filled button). Nothing else: End game and Discard game are only in the menu (TAM-124) |
| Game: menu | `Settings`, `Show the room`, `Board`, `Check numbers`, `End game`, `Discard game`, as `menuitem`s or buttons, visible only once `Menu` is tapped. A long press on the number also opens Show the room |
| Record a win (TAM-037) | one button per pattern in play (`Early Five`, `Top Line`, `Middle Line`, `Bottom Line`, `Four Corners`, `Full House`, `Second Full House`), then one button per player name (tap several for a tie), then `Confirm`, or `Bogey` to record a bogey for the picked player. `Cancel` or `Back` to leave. No number field |
| Check numbers (TAM-139) | one button per pattern in play, the field `Numbers read out`, `Check`, and `Close`, `Done`, `Back` or `Cancel` |
| After a recorded win (TAM-145, TAM-126, TAM-198) | The main button (`main-button`, where `Next number` was) **becomes** `Close Top Line` ("Close <Pattern>"): filled, enabled, same size and place; no button is named `Next number` until the tier is closed. `Add another winner` sits just above it (secondary, not filled; goes straight to picking the player; the pattern is kept; then `Confirm`). Only the main button is named exactly "Close <Pattern>": the won prize's chip **keeps** a Close, named just `Close`, which closes the prize too. The rest of the calling screen is dimmed and taps there do nothing, except `Add another winner`, the chip's `Close` and `Menu` (with End game, Discard game, Show the room), which still work (see "After a win, closing the prize is the main action" below). After the last Full House is closed: `End game and show payouts`. The win card has `Undo…` |
| Undo toast (TAM-125) | inside `undo-toast`: a button named `Undo…` |
| Board sheet (TAM-127) | a `role="dialog"` holding `board`, with `Close`, `Done` or `Back` |
| Screen-sleep tip (TAM-128) | text "keep your screen on", `Got it`, `OK` or `Close`; afterwards "Screen may sleep" in the top bar |
| Dialogs (`role="dialog"`) | End: text "End the game and show payouts?", `End game` (outlined), `Keep playing` (the main look, TAM-103). Discard: `Discard…`, and "N prize(s) was/were already won" when true. Undo claim: `Undo…` |
| After the game | `Play again` and `Session tally` (TAM-197), both fixed at the bottom of the screen (TAM-181); `Session tally` opens the session screen of the session this game is in. `Settle with host` (TAM-089) and `Settle with players` (TAM-199), both reachable without scrolling (owner, 2026-10-01) |
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
| `prize-chips` | The row of prize chips. Since 1 October 2026 (TAM-126, UX list row 15) the chips **wrap** onto more lines instead of scrolling sideways: every chip wholly on screen with its words in full, the row never scrolls sideways, the page never scrolls (375 px and up, up to seven tiers) |
| `prize-chip` | One tier: open "Top ●", won "Early 5 ✓ Riya" (a `Close` button on it until closed is optional since TAM-198), closed (greyed, no ●, no Close) |
| `undo-toast` | "Called 21 · Undo (5s)", floating just above `Record a win` (or `Scan a claim`); moves nothing. Since 1 October 2026 (TAM-125, UX list row 13): a light bar (under 3:1 against the screen behind it, words at 4.5:1) with at least 16 px between it and the button below |
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
- Setup (TAM-181): `Next` / `Confirm prizes` fixed within 40 px of the bottom on every step, for 6, 12 or 20 players. The ticket-mode step **has** `Next` too since 1 October 2026 (TAM-213, replacing the one-tap step of 29 September): tapping a card chooses it and does not move on; `Next` does, and does nothing before a card is chosen.

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
  With one past game in an unsettled tally it says "It's in an unsettled tally, and will be taken out of it." (row 19).
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
- `Settle with host` and `Settle with players` reachable without scrolling (product owner's review, approved by the owner
  1 October 2026): at 390 × 844 with 6 and with 20 players, with the page and every scrolling area at the top, each lies
  wholly on the screen and is topmost at its centre, while `Play again` and `Session tally` stay at the bottom; a tap
  at its centre works (`settle-with-host` shows). Where they go (the fixed bottom area, above the rows, or folded rows)
  is the Build workspace's choice.
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
- Strict (product owner's review, 1 October 2026): a screenshot of `current-number`'s box looks the same while dimmed
  as just before the win: its most common colour (the background behind the digits) and its digits' colour each
  within 12 per channel of before. A dim layer behind a see-through number box, or over it, fails this.
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
  - `hand-out-waiting`: "Waiting: Riya (2 tickets), Asha (1 ticket), Dad (1 ticket)" (TAM-132, owner 2026-10-01; was
    "Waiting: Asha 2, Dad 1"): every player still waiting, with the tickets they still wait for; a player leaves the list
    once all their tickets are handed out.
  - `game-code`: the 4-character game code (TAM-170). Also shown on the calling screen (top bar or its own line).
  - Buttons: `Next ticket`, which becomes `Start calling` after the last ticket (then the calling screen);
    `Can't scan? Give a paper ticket`: that player plays on paper, and the rest of their tickets are skipped (TAM-058).
    Since 1 October 2026 (TAM-181, UX list row 9): `Next ticket` / `Start calling` full width at the bottom, the one
    main look; `Can't scan? Give a paper ticket` a link (a `button` or `link`) just above it: see "rows 8 to 15" below.
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
- Typing a code: Home's `Join with my ticket` → `Type the code` (PLT-300; was `Enter ticket code` on Home), then the field `Ticket code` and `Open ticket`. A code that
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
  `One at a time` shows one ticket (cells at least 42 px; on a 390 px portrait screen the whole ticket fits with no
  sideways sliding: nothing around or inside the ticket scrolls or is clipped sideways, and every cell is fully on
  screen, owner decision 2026-09-30) with tabs, `role="tab"`, named `Ticket 3`, `Ticket 4` …
  (the visible text may be shorter); `All tickets` goes back. The choice is remembered on the phone, for the next game too.
- `Quick mark` (TAM-192): `quick-mark-pad` with buttons named `1` to `90`; `quick-mark-message`: "✓ 36 marked on ticket
  3", "37: not on your tickets" (for a number on two tickets, both ticket numbers, TAM-194); tapping a marked number
  again unmarks it. Under the pad, one `quick-mark-thumbnail` per ticket, with `data-ticket` and cells as in
  `phone-ticket` (a marked cell's background differs from an unmarked one's). Tapping a thumbnail shows that ticket
  alone (as `One at a time`: cells at least 42 px, no sideways sliding); `Back` returns to quick mark, and `Back` in quick mark returns to
  the tickets.
- `pattern-cue` (TAM-195): only when the host turned the cue on (off by default since 1 October 2026; see "UX list of 1
  October 2026"). One slim line, such as "Ticket 3: Top Line filled. Shout if it's right!". It exists only while the
  player's marks fill a prize in this game; never a verdict ("accepted", "correct", "winner"), never a claim.
- `Show claim` (TAM-177, TAM-190, TAM-193): with several tickets, "Which ticket?" and buttons `Ticket 3` …; then one
  button per prize in this game (`Early Five`, `Top Line` …; a crossed-out prize is disabled or not offered). Then
  `claim-screen`: the text "Top Line · Ticket 3 · Riya" (any case), "Show this to the host", `claim-qr` with
  `data-payload` (the claim QR's text), above one `phone-ticket` (the claimed one) with the pattern's cells
  `data-outlined="true"` (Top Line: the top row; Four Corners: the corners; Full House: all 15; Early Five: none),
  and `Done`. Never a verdict. A ticket opened only by typed code has no prize list, so it offers every usual prize
  (`Early Five`, `Top Line`, `Middle Line`, `Bottom Line`, `Four Corners`, `Full House`); the host's scan refuses a
  prize this game doesn't have in `claim-refused`, never as a bogey (TAM-117, TAM-177, owner decision 2026-09-30).

### Checking a claim (host)
- `Scan a claim` opens `claim-scanner` and starts the camera at once (the hook's `start` is called
  on the tap). `Enter ticket number` is visible there until the typed form is open; while the field `Ticket number`
  shows, `Enter ticket number` is hidden (TAM-178, owner 2026-10-01). If the camera fails, or no QR is read within 10
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

## Phase 7: Report a problem (owner sign-off 29 September 2026)

Tests: `report-problem.spec.ts` (both phones, Android and iPhone sizes). Scenarios: PLT-200 to PLT-203, PLT-206 to
PLT-209. What a report holds is defined in `tests/contract/README.md`, "Problem reports"; here, the screens.

### Opening it (PLT-200)
- `Report a problem` (a `menuitem` or button) on the **home** screen (directly, or inside a `Menu` button there), on the
  **calling screen** (inside `Menu` only: not visible before `Menu` is tapped; its centre in the top two-thirds of
  the screen, never in the thumb zone), on the **payout screen** after a game (directly or inside a `Menu`), and on a
  **player's ticket screen** (inside its `Menu`).
- The form: a field labelled `What happened?` (empty at first; optional), `report-preview`, `Send report` (enabled
  even with nothing typed) and `Cancel` (closes the form, sends nothing).
- Money (owner, 1 October 2026): for a game with money, the report holds the contribution and prize amounts and, after
  the game, `game.money` (what is in it: `tests/contract/README.md`, "Problem reports"); the preview's visible text shows
  the contribution amount (for example "37"), so the host sees the money that is sent.
- `report-preview`: what will be sent, shown to the host before sending (PLT-201). Its `data-payload` attribute holds
  **exactly** the text that will be sent (`reportText`, JSON), kept up to date as the host types; its visible text
  includes the sentence (with names already replaced, "Player 1's prize looked wrong") and the app version.
- The report holds the game on screen: on the calling screen the game in progress, on the payout screen the game just
  ended (with its seeds), on home no game. `phone` names the phone: it contains "Android" on the Android test phone
  (Pixel 7) and "iPhone" on the iPhone. No e-mail or password field anywhere in the flow (PLT-208).

### Sending
- **The sending hook** (tests only): when `window.__pgnSendReport` exists, the app sends a report by calling
  `window.__pgnSendReport(text)` with exactly the preview's `data-payload` text (or, for a report that waited for its
  game to end, that report with the seeds added) instead of the stub. Resolving means the report arrived: it leaves
  the waiting list and is never sent again. Rejecting means it did not: it stays waiting and is tried again later (at
  the latest on the next `online` event). The app never calls it while `navigator.onLine` is false, tries every waiting
  report when the `online` event fires (and when the app opens), and never starts a second send of a report while one
  is still going (PLT-209). Reports are kept in the phone's storage, so they survive a reload.
- **The stub** (no hook, the real app for now, PLT-208): `Send report` keeps the report on the phone and shows a line
  containing "kept on this phone". Nothing leaves the phone: every request the app makes is a GET to its own address,
  and `navigator.sendBeacon` is never called — also on app start, during a game and after a crash.
- A game in progress or paused (PLT-206): the form says "Your report will be sent when this game ends"; the report is
  kept without seeds and is sent (hook) or kept (stub) only once that game is ended with `End game` or discarded.
  Then the seeds are added; the id, the words and the moves stay as they were when reported.
- No connection (PLT-202): the report waits; when the connection returns it goes by itself, without any dialog and
  without changing the screen (a game on the calling screen carries on untouched).

### After a crash (PLT-203)
An uncaught error (`window` `error` event) or an unhandled promise rejection during a game: the game stays saved (a
reload resumes it with every call), and the text "Something went wrong; your game is safe" shows with a button whose
name starts `Report` and a `Not now` button. Nothing is sent unless the host goes on and taps `Send report`. The
button opens the same form; its report has `error.message` with the error's message. `Not now` closes the message and
the game carries on.

### Reports waiting to send (PLT-209)
Settings (the home screen's `Settings` if there is one, otherwise the Tambola start screen's `Settings`) has
`Reports waiting to send` (a button or link). It lists one `waiting-report` per report not yet sent (also those
waiting for their game to end), each with its date ("29 Sep") and the first line of its words, and a button starting
`Delete` (a confirming `dialog` with a button starting `Delete` is allowed). A deleted report is never sent. The list
updates by itself when reports are sent. The tests reach it by taps only (no page load), also offline.
While sending is not set up yet (the stub, no sending hook; product owner, 1 October 2026): every report the stub keeps
is listed there as a `waiting-report` (also one kept while offline, and one that waited for its game to end), and the
screen shows the note "Kept on this phone: sending isn't set up yet" (straight or curly apostrophe). They stay listed
after a reload and after the connection returns, and can be deleted the same way.

## UX list of 1 October 2026 (owner approved the behaviour; `docs/handover.md` step 2 and 2b, rows 1, 1a and 2 to 7)

Tests: `home-and-buttons.spec.ts` (PLT-300, PLT-301, TAM-057, TAM-213, TAM-103, TAM-124, TAM-197), `pattern-cue.spec.ts`
(TAM-195, TAM-053), the quick mark tests in `phone-tickets.spec.ts` (TAM-192), `setup-layout.spec.ts` (TAM-181 with
TAM-213), `report-problem.spec.ts` (PLT-200). Rule side: `tests/games/tambola/phone-secrets.test.ts` (see
`tests/games/tambola/README.md`, "The ticket QR, format version 2"). Shared steps in `helpers.ts` (`hostAGame`,
`joinWithMyTicket`, `openTambola`, `ticketCard`, `chooseTicketType`, `cueSwitch`, `turnCueOn`, `fromHome`,
`openTypedCode`, `typeTicketCode`, `hasMainLook`, `isOutlined`, `mainLookButtons`, `expectOneMainButton`) and
`phone.ts` (`setUpPhoneGame(…, { cue })`, `phoneGame(…, { cue })`, `padKey`, `cueMore`, `allCueText`).

### The main look and outlined (PLT-301, UX guideline 17a)
- **Main look**: the control's own background is opaque (alpha ≥ 0.9, opacity ≥ 0.9) and has a contrast of at least
  3:1 with the colour behind it (the nearest ancestor with an opaque background, or white). Today's solid red
  `rgb(179, 38, 30)` on the cream page is the main look; a light tint is not; no fill is not.
- **Outlined**: not the main look, with a visible border (≥ 1 px, not transparent), a CSS outline, or a box-shadow.
- **One per screen**: among visible `button`, `[role=button]`, `a[href]`, `[role=radio]`, `[role=tab]`, `[role=switch]`
  (only the top dialog's when a dialog is open; otherwise leaving out dialogs and open menus), at most one has the main
  look, and it is the next step. Checked: Home (none), Tambola start (`New game` or none), ticket type (`Next`;
  required once a card is chosen), players, contribution (`Next`, required), prizes (`Confirm prizes`, required),
  calling (`Next number`, required, checked once it is enabled again after a call), the End game question
  (`Keep playing`, required; `End game` outlined), the Discard question (`Discard…` never the main look), payouts (at
  most one; `Play again` outlined, never the main look), a player's tickets, "One at a time" and quick mark
  (`Show claim`, required; a chosen tab such as `Ticket 3` must not have the main look).
- A **chosen option** says so with `aria-pressed="true"`, `aria-checked="true"` or `aria-selected="true"`, shows a "✓"
  in its text, is outlined, and has a different (tinted) background from an unchosen one; never the main look.

### Home (PLT-300, TAM-057)
- Two buttons whose accessible names start `Host a game` and `Join with my ticket`: the same size (within 2 px), the
  same background colour, top border colour and width, and font weight; neither has the main look. The host card's
  text mentions "this phone"; the join card's mentions "QR" or "code".
- First visit (fresh storage): the text "You're ready for game night" (straight or curly apostrophe). On the first visit
  only: after a reload, or opening Home again, it is gone (product owner's answer 3, 2 October 2026).
- `Host a game` → the Tambola start screen (`New game`); a game picker with a `Tambola…` button in between is fine.
- `Join with my ticket` → some text mentioning the "camera" (scan the host's QR with the phone's camera) and a button
  starting `Type the code`, which shows the field `Ticket code` and `Open ticket` (a wrong code: `role="alert"`).
- `unfinished-games` sits wholly below both cards; nothing inside it has the main look ("Tap to resume" today is solid
  red: that changes); tapping its "Tap to resume" still goes back into the game (PLT-004; the words stay "Tap to resume", product owner's
  answer 1, 2 October 2026).
- `Sessions`, `History`, `Report a problem` and `Settings` stay reachable from Home: a button or `menuitem` with that
  exact name, directly or after tapping a button named with "Menu". "Settings" there leads to the same settings as
  the Tambola start screen's (the PLT-209 tests use it to reach `Reports waiting to send`).

### Paper or phone (TAM-213, TAM-181)
- The Tambola start screen shows "Housie on paper or on phones" (and no "Housie with paper tickets").
- `New game` → two cards, buttons (or `role="radio"`) whose accessible names start `Paper tickets` and `Phone tickets`,
  equal as on Home, holding "Always works. Print or bring tickets." and "Each player gets their ticket on their phone.
  Everyone must have opened the link once." respectively. Neither is chosen, nor shows "✓", when the step opens.
- Tapping a card chooses it (as "chosen option" above; the other is unchosen) and stays on the step. `Next` (fixed at
  the bottom, the main look once a card is chosen) moves to the players step; before a choice it is disabled or does
  nothing.

### The pattern cue: a host option (TAM-195, TAM-053)
- On the ticket-type step, once `Phone tickets` is chosen (never before, never with paper): a `role="switch"` or
  checkbox whose accessible name contains "Players' phones say when their marks fill a prize pattern" (straight or
  curly apostrophe), **off**, with the text "Off: players spot their own wins, as on paper." visible.
- Turning it on shows "Some players may stop listening and wait for the phone, and paper players get no help. Claims
  are still shouted and checked." (inline, or in a `dialog` with `Turn on`; the tests tap `Turn on` if there is one).
  Then the switch is checked. Choosing paper again hides it.
- The setting goes into every ticket QR of the game (format version 2). A ticket opened from a QR made before this
  change (`tests/fixtures/ticket-qr-v1.json`, real links `#t=T1.…` from the app at d3aa874) still opens, with the cue
  off. A ticket opened by typed code has the cue off. The player's menu has no cue switch.
- **Cue off**: no `pattern-cue`, no cell with `data-cue="true"` (tickets and quick-mark thumbnails), no text "Shout if
  it's right", "top row filled", "Top Line filled", "patterns filled" or "Pattern filled" anywhere, also on "Which ticket?". The claim
  screen still outlines the picked prize (`data-outlined`, TAM-193).
- **Cue on**: `pattern-cue` is one line (all its text at one height) such as "Ticket 3: Top Line filled. Shout if
  it's right!": each ticket names its prizes by their names, in prize order ("Ticket 1: Early Five and Top Line
  filled", product owner's answer 2). With fills on two tickets it reads "Tickets 1 and 3: patterns filled" and has a
  `More` button (or link) inside `pattern-cue`. One ticket whose line is too wide for the screen reads "Ticket 1:
  patterns filled. Shout if it's right!" ("pattern filled" for one prize) with `More`, the full words only behind
  `More` (row 1, 3 October). `More` opens `pattern-cue-more`, holding each fill in full, such as "Ticket 1: Early Five
  and Top Line filled" and "Ticket 3: Top Line filled" (closed with a button starting `Close`, `Done`, `Back` or `OK`,
  or Escape). Early Five's line names the ticket and "Early Five", no row or
  corners; Four Corners' names the ticket and "corners".
- **One slim line** (row 1a): on 375 × 812 and 812 × 375, Larger text off and on, with 1, 2 and 3 tickets, and the page
  scrolled to the top: `pattern-cue`'s box overlaps no shown `phone-ticket` box; `One at a time` (when there is one),
  `Quick mark` and `Show claim` are each wholly on the screen and topmost at their centre.

### Quick mark (TAM-192)
- Each pad key is a button named by its number; once marked, its name may also carry a "✓" before or after the number
  (`^(✓\s*)?36(\s*✓)?$`). Keys never get `data-number` (TAM-050: only the player's own ticket cells have it).
- Every key at least 44 CSS px tall on 390 × 844 and 375 × 812 (portrait).
- A marked number's key (marked on the pad or on the ticket) has a "✓" in its text and a different background from an
  unmarked key; unmarking removes both (same background as an unmarked key again).
- Each `quick-mark-thumbnail` contains its caption "Ticket 3" (inside the thumbnail element).
- `Show claim` (exact name) is on the quick mark screen: bottom edge within 40 px of the screen's bottom, wholly on
  screen, not covered, the screen's one main look; tapping it opens the usual claim steps ("Which ticket?" with
  several tickets). `Back` (exact name) has its centre in the top 15% of the screen.

### The app version (PLT-200)
`appVersion` in every report (host and player) is a release number: `^[1-9]\d*\.\d+\.\d+` with an optional build note
after `+` or `-` ("1.0.0", "1.0.0+059aaaa"); "0.0.0+…" is refused.

## UX list of 1 October 2026, rows 8 to 15 (owner approved the behaviour; `docs/handover.md` step 2b)

Tests: `ux-rows-8-15.spec.ts` (TAM-178, TAM-181, TAM-190, TAM-195, TAM-125/TAM-119, TAM-177, TAM-117, TAM-132, TAM-183,
TAM-193), `held-tickets.spec.ts` (TAM-214, new), and changes in `phone-tickets.spec.ts` (TAM-191/TAM-122: the 12 px
margin replaces "cells at least 42 px"), `layout.spec.ts` (TAM-126: chips wrap, replacing "scroll sideways"),
`phone-claims.spec.ts` (TAM-190 choice names). New shared steps: `helpers.ts` (`hasLinkLook`, `contrast`, `luminance`,
`isNeutral`, `backgrounds`) and `phone.ts` (`ticketChoice`, `ticketChoiceOrder`, `addTicketByCode`).

### Looks
- **Link look** (`hasLinkLook`): not the main look, no fill of its own (background alpha below 0.1), no border of 1 px
  or more in a visible colour, no CSS outline at rest, no box-shadow. A `button` or an `a`/`role="link"` both count.
- **Neutral grey** (`isNeutral`): red, green and blue within 24 of each other.

### Row 8: the host's typed claim form (TAM-178), inside `claim-scanner`
- While the field `Ticket number` shows, no visible `Enter ticket number`. With a camera, before 10 s: `Enter ticket
  number` shows, the field doesn't; tapping it shows the field and hides the button.
- Prize buttons are `button`s (or `role="radio"`) named by the prize, with an optional "✓" before or after
  (`^(✓\s*)?Top Line(\s*✓)?$`). The chosen one: `aria-pressed`, `aria-checked` or `aria-selected` "true", a "✓" in
  its text, outlined, a different background from an unchosen prize, never the main look.
- `Check`: with no ticket number, or no prize, it is disabled or a tap does nothing: **no `claim-result` and no
  `claim-refused`** (at 5c5030d an empty form gives a refusal). With both filled it is enabled and is the only control in
  `claim-scanner` with the main look; tapping it gives the verdict.

### Row 9 and polish: hand-out and start (TAM-181, TAM-132)
- `Next ticket`, and `Start calling` on the last ticket: bottom edge within 40 px of the screen's, left edge within 24 px
  of the screen's left and right edge within 24 px of its right (full width), not covered, the screen's one main look.
- `Can't scan? Give a paper ticket` (button or link, name starting so): the link look, wholly above the main button and
  at most 40 px above it, at least 44 px tall. Shown with both `Next ticket` and `Start calling`.
- `hand-out-waiting` as in the hand-out section above.
- Tambola start screen: `New game` bottom edge within 40 px of the screen's bottom, not covered.

### Row 10: "Which ticket?" (TAM-190)
- Each choice is a `button` whose accessible name **starts** "Ticket 3" (anything may follow: the picture's numbers if
  not `aria-hidden`, "Pattern filled"; never "Ticket 30" for 3). Inside it, a small picture: `data-testid="ticket-picture"`
  with `data-ticket` and 27 `[data-cell]` as in `phone-ticket` (numbers in `data-number`, her marks
  `data-marked="true"`), at most 60% of the full ticket's height. With 3 tickets on 390 × 844 the page doesn't scroll
  and every choice is wholly on screen.
- Order shown (top to bottom, then left to right): ticket order with the cue off, and no "Pattern filled" text anywhere.
  With the cue on, the ticket the `pattern-cue` line names first ("Ticket 3: …" or "Tickets 2 and 3: …") comes first,
  and its choice contains "Pattern filled"; the others don't.

### Row 11: the cue's outline and Early Five (TAM-195, cue on)
- Every cell with `data-cue="true"` contains a visible `data-testid="cue-mark"` (the corner mark; `aria-hidden` is
  fine); no cell without `data-cue="true"` contains one.
- The outline is at least 4 CSS px (it was a 3 px inset shadow): the cue cell's own border, CSS outline or box-shadow
  spread, or a `data-testid="cue-outline"` element inside the ticket with such a line.
- Early Five: the cue line plus "More" mention "Early Five" exactly once, as "Early Five filled on ticket 1" (the first
  ticket with 5 marks; never "on tickets 1 and 2"), however many tickets have 5 marks; or, when that first ticket also
  fills a line, with it: "Ticket 1: Early Five and Top Line filled".

### Row 12: holding another player's ticket (TAM-214, `held-tickets.spec.ts`)
- Each `phone-ticket` names its holder in an element whose whole text is "Grandma · Ticket 3" (a typed code: just
  "Ticket 3"); a held ticket never shows the phone's other name; the phone's own tickets still show "Riya".
- `claim-screen`: "Top Line · Ticket 3 · Grandma" (never "Riya"); the host's verdict "… to Grandma"; Grandma's
  `payout-person` has the prize.
- A 4th ticket of the same game (QR link or typed code): `role="alert"` with "This phone already holds 3 tickets"; the 3
  tickets and their marks stay; the 4th is not shown, also after a reload. Rescanning a held ticket: no refusal. A
  ticket of a new game: replaces them (TAM-171), no refusal.
- Adding by code on a phone with tickets: the player's `Menu` → `Add a ticket by code` (a `menuitem` or button; there
  is no "Enter a ticket code" any more), then `Ticket code` and `Open ticket`.

### Row 13: the undo toast (TAM-125, TAM-119)
- With phone tickets and with paper: at least 16 px between the bottom of `undo-toast` and the top of `Scan a claim` /
  `Record a win`. The toast as seen (its background, with its opacity, over the opaque colour behind it) has a contrast
  under 3:1 with that colour behind; every text inside it has at least 4.5:1 against the toast.

### Row 14: "Which prize?" (TAM-177)
- `Cancel` (button or link) has the link look; a prize button does not. Tapping it: no `claim-qr`, back to the tickets.

### Row 15: polish
- `One at a time` (TAM-191, TAM-122) on 390 × 844 and 375 × 812: the shown `phone-ticket` box and every cell lie
  between x = 12 and the screen width − 12; every cell at least (screen width − 32) / 9 CSS px (39.8 at 390, 38.1 at 375)
  and never under 24. Also for a ticket opened from a quick-mark thumbnail.
- Prize chips (TAM-126): see `prize-chips` above; checked with 7 tiers at 390 px and 5 and 7 tiers at 375 px.
- Code field (TAM-117): `Ticket code`'s `placeholder` (or the text it is `aria-describedby`) matches
  `^X{4}(-X{4})*(-?(…|\.\.\.))?$` ("XXXX-XXXX-XXXX-XXXX-XXXX" or "XXXX-XXXX-…"), on Home's typed-code form and after
  `Add a ticket by code`.
- `claim-screen`'s `Done` (TAM-193): outlined, never the main look, under `claim-qr`.
- Prizes step (TAM-183): every visible `Remove…` button's text colour is a neutral grey with at least 4.5:1 contrast,
  never the main look; a visible border is grey too.

## Product owner's answers to questions 1 to 6 (2 October 2026, `docs/handover.md` step 3): no more "either answer"
- 1: the unfinished game's row says exactly "Tap to resume" (`home-and-buttons.spec.ts`).
- 2: one ticket filling two prizes: the cue (line plus `More`) says "Ticket 1: Early Five and Top Line filled. Shout if
  it's right!" (prize order). With fills on two tickets, `More` names each ticket's prizes, such as "Ticket 1: Early Five
  and Top Line filled" or "Ticket 1: Top Line filled", Early Five said at most once (`phone-tickets.spec.ts`,
  `pattern-cue.spec.ts`; UX list row 1).
- 3: "You're ready for game night" on the first visit only (`home-and-buttons.spec.ts`).
- 4: Settings from Home's menu: unchanged, already tested.
- 5: on the payout screen, before any settle tab is opened, `Settle with host` is the one control with the main look
  (`home-and-buttons.spec.ts` TAM-197/TAM-089; UX list row 5).
- 6: at 812 × 375 with 3 tickets and Larger text on, the page doesn't scroll and all three `phone-ticket` boxes are wholly
  on screen (`pattern-cue.spec.ts`; UX list row 1).

## C3 batch of 3 October 2026: UX list rows 6, 20, 21 and 23 (owner approved; tests first)

### Row 6: "Add another winner" with phone tickets (TAM-145, TAM-198; `phone-claims.spec.ts`)
- In a phone-ticket game, after a claim QR is accepted, `Add another winner` shows exactly as in paper games: enabled,
  above `main-button` (`Close Early Five`), topmost at its centre while the screen is dimmed.
- Tapping it offers the ways to add the next winner: one button per **paper** player, named by name, then `Confirm`
  (as in paper games, TAM-039: the result says "Shared"); and scanning another claim QR, either by opening
  `claim-scanner` at once or with a button `Scan a claim` (the tests tap the last visible one). A scanned claim gets its
  usual verdict in `claim-result` ("✗ Bogey", or accepted and shared); `main-button` still reads `Close Early Five`,
  and the won `prize-chip` still names Riya.

### Row 20: "Done with this game…" (TAM-215; `after-the-game.spec.ts`)
- The player's `Menu` (named "Menu"): its **last** `menuitem` is named "Done with this game…" (or "...", or none).
- It opens a `dialog` (or `alertdialog`) holding "Clear your tickets from this phone?", "Tickets 1 · 2 · Game 7K3P"
  (a held ticket adds "Grandma's ticket 3", TAM-214), "Your marks go too." and "Do this when the host says the game is
  over.", with `Keep my tickets` (the one main look) and `Clear tickets` (outlined, never the main look).
- `Keep my tickets`: the dialog closes, every ticket and mark stays. `Clear tickets`: Home (`Host a game`, `Join with my
  ticket`), no `phone-ticket`, no `saved-tickets`, no text "Your tickets" anywhere, also after a reload.

### Row 21: tickets more than 6 hours old (PLT-300, TAM-171; `after-the-game.spec.ts`)
- The tests set each phone's clock with Playwright's clock and read times in the `Asia/Kolkata` time zone.
- A ticket's time: the game's start time from its QR; for a ticket added by typed code, when it was added to the phone.
- Opened less than 6 hours after that time: the tickets open, as before. More than 6 hours: Home, no `phone-ticket`, and
  `data-testid="saved-tickets"`, wholly below both Home cards, with the text "Your tickets from 9:15 am" (same day),
  "Your tickets from yesterday, 9:15 pm" (the day before) or "Your tickets from Sat 26 Sep" (earlier; times as h:mm am/pm),
  and the buttons `Open` and `Clear` (exact names, never the main look; Home still has no main look).
- `Open`: the tickets with every mark. `Clear`: the dialog of row 20; `Keep my tickets` keeps the row, `Clear tickets`
  removes the tickets and the row (also after a reload).

### Row 23: a claim or a ticket from an old game (TAM-179, TAM-171; `after-the-game.spec.ts`)
- In `claim-refused`, for a claim QR of a game this host phone ended: "That game has ended (game 7K3P, 9:15 pm). This
  claim doesn't count." (the time as the old game's tickets show it in `phone-ticket-header`); discarded: "That game was
  discarded (game 7K3P). This claim doesn't count."; a game the phone never ran, or one removed with History's `Clear all
  history`: "This claim is for another game (code 7K3P)" as before. Never "✗" or "Bogey"; no `claim-result`; its
  `Close` has the main look and closes it, back to the calling screen.
- A player's phone adding a ticket of a new game (QR link, or the menu's `Add a ticket by code`) shows only the new
  ticket and the text "Your tickets from game 7K3P were cleared." (7K3P the old game's code).

## UX list rows of 3 October 2026 (lanes A to C; the rows are the owner's approval; `ux-rows-3-oct.spec.ts`)
C2 rows written alongside the build, and the C1 rules a screenshot can't show. Row 9 is in `sessions.spec.ts` and
`session-line.spec.ts`; the C3 rows (6, 8, 20, 21, 23) in `after-the-game.spec.ts`, `phone-claims.spec.ts` and the rule tests.

| Test id or name | Where | Row, scenario |
|---|---|---|
| `announcer` | host screen: one polite live region (`aria-live="polite"` or `role="status"`), screen-reader only (clipped to nothing). After a call: exactly "25. Christmas Day" (the number, a dot, the rhyme shown); after "Another rhyme" the new rhyme; after a verdict its first line ("Top Line: ✓ Riya", "Early Five: ✓ Accepted, ₹60 to Riya", "Top Line: ✗ Bogey…"), never the proof line | 4, PLT-302 |
| dialog named "Dad hasn't got their ticket" | hand-out, after "Start calling" while a ticket waits (the one on screen counts): "Ticket 3 is still waiting…", buttons "Hand it out now", "Give a paper ticket", "Start anyway". Asked once: after "Hand it out now", the next "Start calling" on that ticket starts calling with no question; if the host then gives the ticket to someone else (the name button), "Start calling" asks again, naming the new owner | 7, TAM-132 |
| `game-over` | top of the host's summary. After End with phone tickets "✓ Game over · Players: phones away. Tap Done with this game."; with paper tickets "✓ Game over"; after Discard "Game over · Discarded · Nobody wins. Everyone gets their contribution back." Above `payout-summary` | 22, TAM-140, PLT-005 |
| `claim-proof` | inside `claim-result`, under the verdict, smaller: "Ticket 1 · game 7K3P · same numbers as your copy" (scanned, accepted or bogey); "… · checked from your copy" (typed ticket number); none for a paper win | 24, TAM-174 |
| `game-code` | hand-out: "Game 7K3P" above `ticket-qr`; calling screen, inside `top-bar`: "Tambola · Game 7K3P", text, not a control | 25, TAM-172, TAM-107 |
| `room-game-code` | inside `room-view`: "Game 7K3P", bottom-left, at least 8 px in from the edges, below `current-number` and `last-calls`, under a quarter of the number's font size | 25, TAM-107 |
| hand-out instruction | "Scan with your camera to get your ticket. Check it says Game 7K3P." | 25, TAM-172 |
| tickets at 320 × 640 and 375 × 667 | "All tickets" and "One at a time": no sideways sliding, every cell on screen, cells at least 24 px and at least (width − 40) / 9 wide | 2, TAM-122 |
| History, one past game | "Delete the past game from this phone?…" with "Delete" and "Keep"; in an unsettled tally also "It's in an unsettled tally, and will be taken out of it." (never "1 of them") | 19, PLT-011, PLT-025 |
| hand-out helper (`phone.ts`) | `confirmHandOut` / `startAnywayIfAsked` answer the row 7 question with "Start anyway" | 7 |
