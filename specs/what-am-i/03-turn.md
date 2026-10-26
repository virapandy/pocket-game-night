# What Am I?: 03 A turn (marking rules C3; screens C2)

Copied from `docs/games/what-am-i/scenarios.md` version 1.3 (approved by the owner, 24 October 2026) with Version 1.4 (product owner, 26 October 2026). Each scenario
carries the Version 1.1 to 1.4 items that name it, word for word; a later version wins over earlier text in the
same scenario (1.4 over 1.3 over 1.2 over 1.1 over the body). Terms, canonical strings and test hooks: [README.md](README.md);
the exact rule API and browser hooks the tests use: [api.md](api.md).

### WAI-012 The pass screen
Status: approved · Phase: What Am I? 1
T1 for the player whose turn it is. h1 "Riya, you're guessing". **Hand hold:** small line "Hold the phone on your forehead or
chest, screen facing the room."; the forehead-and-chest drawing; rule line "Phone down: Got it · Phone up: Pass" (motion off or
unavailable: "Tap bottom: Got it · Tap top: Pass"); quiet "Hands-free for Riya"; main "I'm Riya: start". **Hands-free:** small
line "Stand the phone behind Riya, facing the room. Riya, don't turn round!"; the standing-phone drawing; rule line "One clue
giver taps: bottom half Got it · top half Pass"; when Riya chose it in a hand-hold game, the small line "Hands-free (Riya's
choice)"; quiet "Riya will hold it"; main "Start Riya's turn". Both: score line "Round 1 · player 1 of 6" (turn k of the round's
current length); the tip line (WAI-011); quiet "Someone else goes first", "← Home
(game saved)"; Pause; "··· Menu". Main guard 1000 ms.

**Version 1.1** (wins over the text above):
1.1 item 31: Score line "Round 1 · turn k of n": n = players who have saved a turn this round + current players still to play; k = 1 +
    players who have saved a turn this round.
1.1 item 50: **T1 without Players** (second Jev read and three prototype walks, 23 October): T1 has no "Players (6) ›"; Players is
    on R1 and in the menu. WAI-012's and the Canonical strings' mentions of it on the pass screen are withdrawn.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 3: **Score line** "Round 1 · player 1 of 6" (was "turn 1 of 6"; walks mixed "turn" and "round"); same k and n as Version 1.1 item 31.

**Version 1.4** (product owner, 26 October 2026; wins over the text above, and over Versions 1.1 to 1.3):
1.4 item 3: "Hands-free" → **"Stand the phone up"** everywhere on screen: S2's option (its small line unchanged); T1's quiet buttons
   "Stand the phone up for Riya" / "Riya will hold it"; the hold line "Stand the phone up (Riya's choice)"; Read this aloud's
   hands-free sentence starts "Or stand the phone up behind the guesser; …". The `free` hold keeps its name in code.

### WAI-013 Motion permission and the motion question
Status: approved · Phase: What Am I? 1
Motion needs hand hold and Settings "Answer by moving the phone" on (default on).
- Where the browser needs permission for motion (`DeviceOrientationEvent.requestPermission` exists) and this phone has never
  answered: "I'm Riya: start" opens T0 (Canonical strings) instead of T2. "Yes, move the phone" calls the permission request:
  granted → T2 with motion; refused or failed → T2 with taps only and the toast "Tap bottom: Got it · Tap top: Pass". "Use taps
  instead" → T2 with taps only and turns the Settings switch off. T0 is shown at most once per phone.
- Where no permission is needed and orientation events arrive, motion is on without T0.
- Where no orientation event has arrived within 1 s of T2 starting, the turn runs with taps only (no message).
- Settings "Answer by moving the phone" turned on again: T0 shows again on the next hand-hold turn where permission is needed
  and not yet granted.

**Version 1.1** (wins over the text above):
1.1 item 16: Stored on this phone: `motionState` = `unknown` (first) · `granted` · `refused` · `taps`. T0 shows only when: hand hold,
    Settings "Answer by moving the phone" on, `requestPermission` exists, and `motionState = unknown`. "Yes, move the phone" →
    the request: granted → `granted`; refused or throws → `refused`, toast "Tap bottom: Got it · Tap top: Pass". "Use taps
    instead" → `taps` and the Settings switch off. With `granted`, the app calls `requestPermission` again silently on each page
    load's first start tap (a user gesture); "denied" → `refused`. With `refused`: taps only, no T0; under the Settings switch the
    small line "Your phone said no. To use moving, allow motion for this site in the phone's settings." Turning the switch off and
    on sets `unknown` (T0 shows on the next hand-hold turn). Where `requestPermission` doesn't exist, motion follows the switch.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 14: **Motion off by choice** (distracted host): T0's paragraph ends "You can change this in Settings."

**Version 1.4** (product owner, 26 October 2026; wins over the text above, and over Versions 1.1 to 1.3):
1.4 item 4 (kept, by design): "Answer by moving the phone?" has no Home (it's one question before the turn; Back returns to T1,
   build answers item 17).

### WAI-014 Hands-free for one player
Status: approved · Phase: What Am I? 1
"Hands-free for Riya" on T1 switches T1 to the hands-free layout for Riya now and on her later turns in this game, recording
`setHold { player: 'Riya', hold: 'free' }`; "Riya will hold it" does the reverse. A player's override ends with the game (Play
again starts from S2's hold). Nothing else changes.

**Version 1.4** (product owner, 26 October 2026; wins over the text above, and over Versions 1.1 to 1.3):
1.4 item 3: "Hands-free" → **"Stand the phone up"** everywhere on screen: S2's option (its small line unchanged); T1's quiet buttons
   "Stand the phone up for Riya" / "Riya will hold it"; the hold line "Stand the phone up (Riya's choice)"; Read this aloud's
   hands-free sentence starts "Or stand the phone up behind the guesser; …". The `free` hold keeps its name in code.

### WAI-015 Someone else goes first
Status: approved · Phase: What Am I? 1
"Someone else goes first" opens Players (WAI-041) with the line "Who goes now?" above the names and each name a button. Tapping
"Meena" records `reorder` so Meena takes this turn and Riya the next; T1 opens for Meena. Done without a choice → T1 for Riya,
nothing recorded. Only players who have not had their turn this round are offered.

**Version 1.1** (wins over the text above):
1.1 item 28: "Someone else goes first": the chosen player moves to just before the current player. Order R, A, M, K, Z, D on Riya's T1,
    choose Meena → M, R, A, K, Z, D. In this mode the dialog shows only name buttons (no ✕, drag or add) and the quiet button
    "Keep Riya first" instead of Done.

### WAI-016 Countdown
Status: approved · Phase: What Am I? 1
T2: "3", "2", "1", each 1000 ms, with a 100 ms beep at each (Sounds on); small line "Put it on your forehead or chest!"
(hands-free "Riya, don't turn round!"); Pause. The screen wake lock is requested at T2's start (WAI-025). θ₀ is the mean pitch
over the last 500 ms of the countdown. At t = 3000 ms T3 opens and the turn clock starts at the turn time.

**Version 1.1** (wins over the text above):
1.1 item 9: **θ₀** = the mean θ of orientation events with times in [2500, 3000) ms of T2. No event there: θ₀ is not set and the turn
   runs with taps only.
1.1 item 18: Countdown beeps at t = 0, 1000, 2000 ms of T2. Turn clock: from T3 opening, t = 0 to the turn time T (30000, 60000 or 90000
    ms); it runs during flashes and stops only while paused. Ticks: three at T − 10000, T − 9900, T − 9800 (replacing that
    second's single tick), then one at each of T − 9000 … T − 1000; no tick at T; the time-up tone at T.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 8: **θ₀ only when steady** (critic 1): θ₀ is set from [2500, 3000) ms of T2 only if every event there is within 10 of their mean
   and |mean| < 35. Otherwise θ₀ is set from the first 500 ms span of T3 whose events are all within 10 of their mean; until then
   motion marks are ignored (taps work).

### WAI-020 The word screen
Status: approved · Phase: What Am I? 1
T3 shows, for the room: the top small line (Canonical strings), the word (`the-word`, CAPITALS by CSS, bold, sized to fit in 2
lines: the largest size from 96 px down to 40 px that fits; at 568 × 320 the longest word, 22 characters, fits at 40 px), the
pack name (15 px; for a Mix of all fallback word, its own pack), `time-left` "0:34" (m:ss, whole seconds rounded up), and a
"Pause" button (48 × 48 px minimum, icon and the word "Pause", 16 px from the top and right edges as the room sees the screen).
Designed for landscape; in portrait the same layout stacks. The screen's **marking areas** are the top half and bottom half
of the screen as the room reads the word, minus: the Pause button with 8 px around it, and a band of 15% of the screen's long
side at each short edge (where hands grip).

**Version 1.1** (wins over the text above):
1.1 item 2: **Input order.** Before shuffling, eligible words are sorted by `id` ascending. R3: Mix of all keeps the copy with the
   lowest id (Bat WAIW-040 in Animals; Swimming WAIW-181 in Sports and cricket); T3's pack name and the saved id are that copy's.
1.1 item 13: **Marking areas.** On the screen as displayed (after any WAI-024 turn), W × H CSS px. Landscape (W > H): grip bands
    x < 0.15W and x ≥ 0.85W are excluded; portrait: no grip bands. The Pause button's rectangle plus 8 px is excluded. Top area
    y < H/2; bottom area y ≥ H/2. Taps on `time-left`, the pack name or the word inside an area count. At 812 × 375: Pause
    x 748–796, y 16–64; top area x 121.8–690.2, y 0–187.5; bottom x 121.8–690.2, y 187.5–375. At 390 × 844: Pause x 326–374,
    y 16–64 (excluded x 318–382, y 8–72); top y 0–422; bottom y 422–844, full width.
1.1 item 18: Countdown beeps at t = 0, 1000, 2000 ms of T2. Turn clock: from T3 opening, t = 0 to the turn time T (30000, 60000 or 90000
    ms); it runs during flashes and stops only while paused. Ticks: three at T − 10000, T − 9900, T − 9800 (replacing that
    second's single tick), then one at each of T − 9000 … T − 1000; no tick at T; the time-up tone at T.
1.1 item 19: `time-left` shows ⌈(T − t)/1000⌉ as m:ss ("1:00", "0:34", "0:01"); it shows "0:00" only on the frame time up fires.
1.1 item 23: WAI-020: the word's size is the largest from 96 px down to 40 px in 2 px steps at which it fits in 2 lines, breaking at
    spaces only; at 40 px a word that still doesn't fit breaks anywhere. Pack name 15 px (19 px with Larger text).

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 1: **Who T3's line is for** (guest): the top line reads "Everyone else: give clues. Don't say the word!" (hands-free line
   unchanged).
1.3 item 9: **T3 sizes** (distracted host, guest): `time-left` 28 px bold; the pack name 18 px (22 px with Larger text).

**Version 1.4** (product owner, 26 October 2026; wins over the text above, and over Versions 1.1 to 1.3):
1.4 item 2: **Which half is Got it (WAI-020):** T3 shows two small lines (15 px; 19 px with Larger text), in both holds: **"Pass"**
   centred directly under the top small line, and **"Got it"** centred 8 px above the bottom edge of the screen as the room reads
   it (after any WAI-024 turn). They are text, not buttons; a tap on them counts for their marking area (as `time-left`). The
   word's fit size (WAI-020 / 1.1 item 23, 96 px down to 40 px) is computed for the space left between them; at 568 × 320 the
   longest word still fits at 40 px. Basis: the 1.5.0 and 1.5.1 player walks (some); ours (no outside source checked).
Tester's reading for the tests: "directly under" = the label's top within 16 px below the top line's bottom, nothing between;
   "centred" = its centre within 2 px of the screen's centre line (as the room reads it); neither label overlaps the word, the
   pack name, `time-left` or the Pause button, at every size, in both holds, with Larger text and after a WAI-024 turn.

### WAI-021 Marking
Status: approved · Phase: What Am I? 1
- **Got it:** a tap in the bottom marking area, or (motion on) θ − θ₀ ≤ −40° held for 150 ms. **Pass:** a tap in the top
  marking area, or θ − θ₀ ≥ +40° held for 150 ms.
- Each mark records `got` or `pass` for the word on screen, shows the flash "Got it!" (green, `--good`) or "Pass" (orange,
  `--warn`) over the whole screen for 600 ms, plays its sound and vibration (WAI-022), and shows the next word when the flash
  ends.
- **Ignored, nothing recorded:** any mark within 800 ms of a word appearing (measured from the end of the previous flash, or
  from T3 opening); a motion mark before |θ − θ₀| has come back under 15° since the last motion mark; taps outside the marking
  areas; any phone movement in hands-free hold; a second tap during a flash.
- A tap and a motion mark in the same 150 ms count once (the first).
- Property: the number of `got` plus `pass` in a turn equals the number of words shown in it minus the one on screen at time up
  (which is recorded by `timeUp` as passed).

**Version 1.1** (wins over the text above):
1.1 item 8: **Pitch.** θ = asin(cos β · cos γ) in degrees, from `DeviceOrientationEvent` β and γ (independent of
   `screen.orientation`): 0 with the phone upright, +90 flat face up, −90 face down. Tests inject β and γ (WAI-H3), or θ directly.
1.1 item 9: **θ₀** = the mean θ of orientation events with times in [2500, 3000) ms of T2. No event there: θ₀ is not set and the turn
   runs with taps only.
1.1 item 10: **Held.** A motion mark fires at the first event that ends a span of at least 150 ms in which every event's θ − θ₀ is past
    the threshold (≤ −40 Got it, ≥ +40 Pass); the span starts at the first such event. If the span ends inside the 800 ms guard,
    the mark fires at the first event after the guard ends while still past the threshold.
1.1 item 11: **Re-arm.** After a motion mark, motion marks are ignored until an event with |θ − θ₀| < 15. Taps don't re-arm or block
    motion. The first motion mark of a turn needs no re-arm.
1.1 item 12: **Worked example** (θ₀ = 2, events every 16 ms, word 1 appears at t = 0): θ = −45 from t = 1000 → Got it at the event at
    t ≥ 1150; flash to 1750, word 2 at 1750; θ = −50 at 1800 → ignored (not re-armed); θ = 5 at 2000 → re-armed; θ = +45 from
    2100 → span complete at 2250 but inside the guard (to 2550) → Pass fires at the first event at or after 2550.
1.1 item 13: **Marking areas.** On the screen as displayed (after any WAI-024 turn), W × H CSS px. Landscape (W > H): grip bands
    x < 0.15W and x ≥ 0.85W are excluded; portrait: no grip bands. The Pause button's rectangle plus 8 px is excluded. Top area
    y < H/2; bottom area y ≥ H/2. Taps on `time-left`, the pack name or the word inside an area count. At 812 × 375: Pause
    x 748–796, y 16–64; top area x 121.8–690.2, y 0–187.5; bottom x 121.8–690.2, y 187.5–375. At 390 × 844: Pause x 326–374,
    y 16–64 (excluded x 318–382, y 8–72); top y 0–422; bottom y 422–844, full width.
1.1 item 14: **Marks in flight.** A mark is recorded when it fires. If time up or a pause comes during its flash, the mark stands and no
    next word is shown. Property: got + pass + (1 if `timeUp` carries a word, else 0) = words shown in the turn.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 8: **θ₀ only when steady** (critic 1): θ₀ is set from [2500, 3000) ms of T2 only if every event there is within 10 of their mean
   and |mean| < 35. Otherwise θ₀ is set from the first 500 ms span of T3 whose events are all within 10 of their mean; until then
   motion marks are ignored (taps work).

**Version 1.4** (product owner, 26 October 2026; wins over the text above, and over Versions 1.1 to 1.3):
1.4 item 4 (kept, by design): taps in the 1.4 s after a mark are ignored (the "Got it!" / "Pass" flash shows the mark counted; a
   second tap must not mark the next word).

### WAI-022 Sounds and vibration
Status: approved · Phase: What Am I? 1
With Sounds on: Got it = a 200 ms rising ding; Pass = a 200 ms low tone; each of the last 10 seconds = a 50 ms tick, with three
quick ticks (50 ms, 100 ms apart) at 10 s left; time up = a 600 ms falling tone. Vibration (where `navigator.vibrate` exists,
whatever the Sounds switch): Got it 40 ms; Pass 40, 60, 40 ms; time up 400 ms. Volume follows the phone. With Sounds off, no
sound is played; vibration stays.

**Version 1.1** (wins over the text above):
1.1 item 18: Countdown beeps at t = 0, 1000, 2000 ms of T2. Turn clock: from T3 opening, t = 0 to the turn time T (30000, 60000 or 90000
    ms); it runs during flashes and stops only while paused. Ticks: three at T − 10000, T − 9900, T − 9800 (replacing that
    second's single tick), then one at each of T − 9000 … T − 1000; no tick at T; the time-up tone at T.
1.1 item 20: Hook **WAI-H8**: a log of `{ t, kind: 'sound' | 'vibrate', name | pattern }` for every sound and vibration call.

### WAI-023 Time up
Status: approved · Phase: What Am I? 1
At 0 s left, `timeUp` is recorded with the word on screen as passed (none if a flash was running), the time-up sound and
vibration play, the wake lock is released after T4 shows, and T4 opens.

**Version 1.1** (wins over the text above):
1.1 item 14: **Marks in flight.** A mark is recorded when it fires. If time up or a pause comes during its flash, the mark stands and no
    next word is shown. Property: got + pass + (1 if `timeUp` carries a word, else 0) = words shown in the turn.
1.1 item 15: **Moves.** `timeUp { word?: id }`: the word on screen is passed; no `word` when a flash was running or the turn was in T2.
    New move **`skip`**: ends the turn from the Paused cover (WAI-043); the hidden word goes back unshown; T4 opens with h1 "Turn
    skipped. Riya got 2" and the marks so far. A skipped turn is saved by "Save score" like any other and counts as a turn played.
    The Turn term ends at "Save score" in every case.

### WAI-024 Rotation lock
Status: approved · Phase: What Am I? 1
On T2 and T3, when orientation events say the phone is held sideways (|gamma| ≥ 60° for 500 ms) but `screen.orientation.type`
is a portrait type, the page draws T3 rotated 90° to read correctly to the room and records a rotation-lock event on this phone
(WAI-011). Test hook WAI-H3 sets both values.

**Version 1.1** (wins over the text above):
1.1 item 21: The 500 ms starts at the first event with |γ| ≥ 60 while `screen.orientation.type` is a portrait type; the turn reverses
    after 500 ms with |γ| < 45; the event is recorded at most once per game.

### WAI-025 Screen stays awake
Status: approved · Phase: What Am I? 1
`navigator.wakeLock.request('screen')` at T2's start; released on T4, Pause and app hidden; requested again on resume. If the
request is refused or the API is missing, the turn goes on, and this phone records it for WAI-011's tip.
