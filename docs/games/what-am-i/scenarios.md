# What Am I?: scenarios (version 1.1 draft, 23 October 2026)

Status: **draft 1.1, not yet approved** (the two-reader check of version 1 is resolved in section "Version 1.1" below). Drawn from `screen-map.md` draft 4 (binding where this file is silent), `guide.md`,
`words.md` and the What Am I? decisions in `docs/decisions.md` (WA1–WA10 and the rows of 23 October). Written to
`docs/spec-rules.md`. Before approval: the two-reader check (rule 12), then the owner. After approval the tester copies each
section into `specs/what-am-i/` (file names in the headings) and writes tests. Build only after Secret Words is released
(roadmap).

**This file is binding: where `screen-map.md`, `guide.md` or `words.md` differ, this file wins.**
Phase: **What Am I? 1** = first release, every scenario here unless it says "later".
Change classes (`docs/change-sop.md`): the word order and its seed, marking rules, scoring, saved game nights and the word list
format = **C3** (tests first: sections 02, 03 rules, 04, 07); screens = C1/C2. Sections 05 and 08 are not used (rounds are
in 04).

### Product owner's resolutions while drafting (low impact; the owner may overrule)
- **R1. "Lay the phone flat to pause" is dropped.** Laying a phone flat face up passes through "phone up", which marks Pass
  first. Pause stays on the Pause button (the room can reach it: the screen faces them), the phone's Back gesture and hiding
  the app. Map draft 4's T3 row changes accordingly.
- **R2. A word hidden by a pause goes to the end of the queue,** not back to its place, and is not "shown" (WAI-021).
- **R3. Mix of all lists a word once** even when it sits in two packs (Bat, Swimming): 753 words with non-veg on, 743 off.
- **R4. A player who leaves keeps their points on the scoreboard,** marked "(left)", and is never the winner unless they
  rejoin (a leaver can't share the win).

## Version 1.1: the two-reader check (coder-reader and tester-reader, 23 October)
**Every item below wins over the earlier text of the scenario it names.** Items marked C3 are rules; the rest are screens.

**Words and the queue (C3)**
1. **Seeds.** The seed is `seeds.words` everywhere ("wordSeed" in WAI-010 means it). Browser hook: WAI-H1b sets it.
2. **Input order.** Before shuffling, eligible words are sorted by `id` ascending. R3: Mix of all keeps the copy with the
   lowest id (Bat WAIW-040 in Animals; Swimming WAIW-181 in Sports and cricket); T3's pack name and the saved id are that copy's.
3. **The queue** at `start` = `shuffle(sortedEligible, createRng(\`${seeds.words}:${gameIndex}\`))`, then stably split into
   the **unshown part** (not shown tonight, in shuffled order) followed by the **shown part** (shown earlier tonight, oldest
   first-shown first).
4. **Fallback** (pack not Mix of all): when the pack's unshown part becomes empty (its last unshown word is shown, or at `start`
   if already empty), Mix of all's eligible words minus every word shown tonight and minus the pack's words are shuffled with
   `createRng(\`${seeds.words}:${gameIndex}:mix\`)` and appended to the unshown part.
5. **A hidden word** (pause or skip, R2) is put at the end of the unshown part, before the shown part.
6. **Worked example** (WAI-H7 list of 5 Animals words, non-veg off, first game, seed fixed so the shuffle gives Owl, Tiger,
   Duck, Bat, Camel): Riya's turn shows Owl (Got it), Tiger (Pass), Duck (paused, hidden). Queue now: Bat, Camel, Duck. Carry on:
   Bat (Got it), Camel (Got it), Duck (time up, passed). Unshown part empty, so the Mix fallback is appended (H7 sets it empty
   too): the shown part follows, oldest first: Owl, Tiger, Bat, Camel, Duck. Next T1 shows tip 3.
7. **Tip for an active fallback:** WAI-011 gains item 2b, "Animals words used up. Words now come from Mix of all." (after 2,
   before 3), while the fallback supplies words.

**Marking (C3)**
8. **Pitch.** θ = asin(cos β · cos γ) in degrees, from `DeviceOrientationEvent` β and γ (independent of
   `screen.orientation`): 0 with the phone upright, +90 flat face up, −90 face down. Tests inject β and γ (WAI-H3), or θ directly.
9. **θ₀** = the mean θ of orientation events with times in [2500, 3000) ms of T2. No event there: θ₀ is not set and the turn
   runs with taps only.
10. **Held.** A motion mark fires at the first event that ends a span of at least 150 ms in which every event's θ − θ₀ is past
    the threshold (≤ −40 Got it, ≥ +40 Pass); the span starts at the first such event. If the span ends inside the 800 ms guard,
    the mark fires at the first event after the guard ends while still past the threshold.
11. **Re-arm.** After a motion mark, motion marks are ignored until an event with |θ − θ₀| < 15. Taps don't re-arm or block
    motion. The first motion mark of a turn needs no re-arm.
12. **Worked example** (θ₀ = 2, events every 16 ms, word 1 appears at t = 0): θ = −45 from t = 1000 → Got it at the event at
    t ≥ 1150; flash to 1750, word 2 at 1750; θ = −50 at 1800 → ignored (not re-armed); θ = 5 at 2000 → re-armed; θ = +45 from
    2100 → span complete at 2250 but inside the guard (to 2550) → Pass fires at the first event at or after 2550.
13. **Marking areas.** On the screen as displayed (after any WAI-024 turn), W × H CSS px. Landscape (W > H): grip bands
    x < 0.15W and x ≥ 0.85W are excluded; portrait: no grip bands. The Pause button's rectangle plus 8 px is excluded. Top area
    y < H/2; bottom area y ≥ H/2. Taps on `time-left`, the pack name or the word inside an area count. At 812 × 375: Pause
    x 748–796, y 16–64; top area x 121.8–690.2, y 0–187.5; bottom x 121.8–690.2, y 187.5–375. At 390 × 844: Pause x 326–374,
    y 16–64 (excluded x 318–382, y 8–72); top y 0–422; bottom y 422–844, full width.
14. **Marks in flight.** A mark is recorded when it fires. If time up or a pause comes during its flash, the mark stands and no
    next word is shown. Property: got + pass + (1 if `timeUp` carries a word, else 0) = words shown in the turn.
15. **Moves.** `timeUp { word?: id }`: the word on screen is passed; no `word` when a flash was running or the turn was in T2.
    New move **`skip`**: ends the turn from the Paused cover (WAI-043); the hidden word goes back unshown; T4 opens with h1 "Turn
    skipped. Riya got 2" and the marks so far. A skipped turn is saved by "Save score" like any other and counts as a turn played.
    The Turn term ends at "Save score" in every case.

**Motion permission (WAI-013, replaces its bullets)**
16. Stored on this phone: `motionState` = `unknown` (first) · `granted` · `refused` · `taps`. T0 shows only when: hand hold,
    Settings "Answer by moving the phone" on, `requestPermission` exists, and `motionState = unknown`. "Yes, move the phone" →
    the request: granted → `granted`; refused or throws → `refused`, toast "Tap bottom: Got it · Tap top: Pass". "Use taps
    instead" → `taps` and the Settings switch off. With `granted`, the app calls `requestPermission` again silently on each page
    load's first start tap (a user gesture); "denied" → `refused`. With `refused`: taps only, no T0; under the Settings switch the
    small line "Your phone said no. To use moving, allow motion for this site in the phone's settings." Turning the switch off and
    on sets `unknown` (T0 shows on the next hand-hold turn). Where `requestPermission` doesn't exist, motion follows the switch.

**Tips (WAI-011 item 4, replaced)**
17. Phone tips show on **the first turn of each game** on this phone, at most one, the first that applies: ringer (iPhone,
    Sounds on, and only in tonight's first game); rotation lock (a rotation-lock event recorded on this phone in an earlier game);
    screen on (a wake lock refused on an earlier turn on this phone).

**Times and sounds (WAI-016, WAI-022)**
18. Countdown beeps at t = 0, 1000, 2000 ms of T2. Turn clock: from T3 opening, t = 0 to the turn time T (30000, 60000 or 90000
    ms); it runs during flashes and stops only while paused. Ticks: three at T − 10000, T − 9900, T − 9800 (replacing that
    second's single tick), then one at each of T − 9000 … T − 1000; no tick at T; the time-up tone at T.
19. `time-left` shows ⌈(T − t)/1000⌉ as m:ss ("1:00", "0:34", "0:01"); it shows "0:00" only on the frame time up fires.
20. Hook **WAI-H8**: a log of `{ t, kind: 'sound' | 'vibrate', name | pattern }` for every sound and vibration call.

**Rotation (WAI-024)**
21. The 500 ms starts at the first event with |γ| ≥ 60 while `screen.orientation.type` is a portrait type; the turn reverses
    after 500 ms with |γ| < 45; the event is recorded at most once per game.

**Sizes (WAI-003, WAI-020, WAI-030, WAI-080)**
22. WAI-003: the page scrolls at every size; the main button stays fixed. (The "no page scrolling" sentence is withdrawn.)
23. WAI-020: the word's size is the largest from 96 px down to 40 px in 2 px steps at which it fits in 2 lines, breaking at
    spaces only; at 40 px a word that still doesn't fit breaks anywhere. Pack name 15 px (19 px with Larger text).
24. WAI-030: words are chips 44 px tall, 8 px gaps, wrapping; each list sits in one scroll container `turn-lists`, which takes
    the space between the h1 and the small lines; the h1, small lines and main button never scroll away.
25. Landscape main button: at 812 × 375 Impostor's rule (358 × 60, bottom right, 16 px in); at 568 × 320, 240 × 52, bottom right,
    12 px in. T3 has none.

**Undo and End (WAI-031, WAI-060)**
26. "Riya: 5 saved · Undo" is hidden while a dialog or the Paused cover is open and shows again after; it goes (turn locked) on
    the next start tap, on "Round 2", on any other recorded move (reorder, addPlayer, leave, setHold, setChoices), on Home, or on a
    reload. A tap ignored by a guard does not remove it. Undo from R1 (after the round's last save) returns to that T4.
27. `endGame` during an unsaved turn records only `endGame`; the turn's moves stay in the log but don't count. Undo removes
    `endGame` and returns to the Paused cover (from T2/T3, turn intact, time left) or to T4 (unsaved).

**People (WAI-015, WAI-033, WAI-041, WAI-042, WAI-062)**
28. "Someone else goes first": the chosen player moves to just before the current player. Order R, A, M, K, Z, D on Riya's T1,
    choose Meena → M, R, A, K, Z, D. In this mode the dialog shows only name buttons (no ✕, drag or add) and the quiet button
    "Keep Riya first" instead of Done.
29. **2 players left:** when the game has exactly 2 current players, ✕ opens a dialog whose h1 is "2 players needed." with the body
    "Add someone, or end the game." and buttons "Add a player" (focuses the add row) and "End the game" (main) → WAI-060.
30. Players and leaving are greyed during T2–T4 with the small line "After this turn" (T4 included: a guesser can't leave before
    saving). Several leavers are listed at the end of scoreboards in the order they left.
31. Score line "Round 1 · turn k of n": n = players who have saved a turn this round + current players still to play; k = 1 +
    players who have saved a turn this round.
32. A leaver's exact name is accepted in the add row (no duplicate message) and rejoins at the end of the order with their points.
33. Mid-game "Change players or words" (from R1 or G1): S1's ✕ opens WAI-042's dialog (`leave`); new names go to the end
    (`addPlayer`); drag records `reorder`; the quiet button "← Back to the game" returns to R1 or G1 with nothing recorded.

**Results text (WAI-033, WAI-061, WAI-064)**
34. Overflow: "Words nobody got: Penguin, Zebra, Kangaroo, Owl, Duck and 3 more" ("and 1 more"); no comma before "and".
35. "Best turn: Meena, 8 words" / "…, 1 word". A game whose saved turns all scored 0: h1 "Nobody got a word this game!", no
    winner, the tally unchanged.
36. G1 tally "Tonight: Arjun 2 wins · Meena 1 win" (most first, ties in turn order; no won game yet: line left out). G2 "Wins:
    Arjun 2 · Meena 1"; none: "No wins yet". "6 players" in G2 counts everyone who saved a turn tonight, leavers included;
    "1 word got" / "148 words got".
37. **Worked example:** Arjun 12 (left), Meena 12, Dev 12 → h1 "Meena and Dev share the win with 12!" (Arjun is not a winner,
    R4).
38. Per turn in example K2: round 1 Riya 5, Arjun 7, Meena 5, Kabir 3, Zoya 4, Dev 6; round 2 Riya 4, Arjun 7, Meena 8, Kabir 4,
    Zoya 3, Dev 5.

**Menu, where-line, Home row (WAI-090–092)**
39. "··· Menu" button, accessible name "Menu". Items by screen (others hidden): T1 and R1: all nine; T4: How to play, Words and
    time, Pause, Home (game saved), End the game, End for tonight, Settings, with Players greyed ("After this turn"); T2, T3: no
    menu; G1: How to play, End for tonight, Settings, History.
40. Where-line on T4 unsaved: "Round 2 · Riya's turn, not saved yet". After G1, Home's line 1: "What Am I? · Game over, game 1".
    Line 2: the first two current players in turn order, "+n" for the other current players (leavers not counted), and the
    time of tonight's first `start` in the phone's local time, "8:05 pm" (h:mm, lower-case am/pm). G2 has no where-line (tonight
    has ended).

**Exact text pulled in (WAI-001, WAI-006, WAI-012, WAI-091)**
41. Start new dialog: h1 "Start a new game night?"; body "The game night from 8:05 pm (Riya, Arjun +4) will end."; two equal
    quiet buttons "Carry on that one", "Start new (ends that one)"; no main button.
42. How to play lines (an `ol`): 1 "One player guesses. They hold the phone on their forehead or chest, screen facing the
    room." 2 "Everyone else gives clues: talk, act, make the noise. Never say the word." 3 "Got it? Phone down. Stuck? Phone up to
    pass. Passing is free." 4 "Hands-free: stand the phone behind the guesser; a clue giver taps the bottom for Got it, the top to
    pass." 5 "When time's up, fix any word marked wrong, then save the score." 6 "Pass the phone to the next player. Everyone
    once is a round." 7 "Play as many rounds as you like. End the game to see who got the most."
43. Drawings (`hold-drawing`), alt texts: "Phone held on the forehead, screen facing the room" · "Phone held against the chest,
    screen facing the room" · "Phone standing behind a seated player, facing the room".
44. Ending by itself: a game night left unfinished is ended 12 hours after its last move when the app is next opened
    (`endEvening` at the opening time); an unsaved turn is dropped; it then shows in History, not on Home.

**Smaller**
45. WAI-003's options are `role="radio"` with `aria-checked` (an exception to Impostor's Selected term). Last-used values are
    saved at `start`.
46. Pause on T1 or T4: the cover without "Skip Riya's turn". Each tap on a T4 word is one `fix` (no guard on word chips).
47. WAI-081: live region `data-testid="mark-live"`; flash text 4.5:1 against the flash colour.
48. WAI-082, exact: no screen text contains, as a whole word, case-insensitive, "tilt", "tilting", "nod", "session", "evening"
    or "card"; "clue" appears only in "Give clues", "gives clues", "Clue givers", "clue giver".
49. New hooks: **WAI-H1b** seed in the browser (`window.__waiTest.setSeed('t1')`); **WAI-H9** fire `visibilitychange` and the
    Back gesture (`popstate`); **WAI-H10** wall clock and time zone; **WAI-H11** clear this phone's stored state.

## Terms
Terms defined in `docs/games/impostor/scenarios.md` mean exactly the same here: **main button, quiet button, selected, tint,
greyed, disabled, small line, body text, toast, dialog, Larger text, fits in N lines, no page scrolling, names, plurals,
t = …, sound on**, with one change: **undo toasts in What Am I? last 10 s** (5 s in Impostor), except "Riya: 5 saved · Undo"
(WAI-031). Characters as in Secret Words' Terms ("·" U+00B7 with a space either side; "←" U+2190; "↺" U+21BA; "✕" U+2715;
"–" U+2013; apostrophes U+0027).

| Term | Meaning |
|---|---|
| **Screen sizes** | 320 × 568, 360 × 640, 390 × 844 (portrait), 812 × 375 and 568 × 320 (landscape). "Every size" = all five, Larger text off and on. |
| **Pack** | One of the eight lists in `words.csv` (`pack` column): Animals, Food, Around the house, Jobs, Sports and cricket, Festivals and places, Act it out, Famous Indians. **Mix of all** = every pack, each word text once (R3). |
| **Eligible words** | The chosen pack's words, minus `nonveg = yes` words while "Include non-veg food" is off. |
| **Word text** | Exactly as in `words.csv` (e.g. "Pressure cooker"); on T3 shown in CAPITALS by CSS `text-transform: uppercase`; tests compare DOM text as in the list. |
| **Shown** | A word is shown when it appears on T3 and is then marked Got it or Pass, or is on screen at time up. A word hidden by a pause is not shown (R2). |
| **Tonight / game night** | One What Am I? saved game night (engine `SavedGame`), from the first `start` to `endEvening`, holding every game of that night. It joins tonight's session (PLT-016) as Impostor's evenings do (IMP-102). On screen it is "tonight" only. |
| **Game** | From a `start` to `endGame` (or `endEvening` mid-game). Scores start at 0 in each game. |
| **Turn** | One player's turn: from T1's start button to "Save score" on T4 (or the skip of WAI-043). **Turn time** = the chosen 30, 60 or 90 s. |
| **Round** | Every player in the turn order once. A round ends when the last player in the order has saved a score. |
| **Turn order** | The player list's order (S1), plus players added mid-round at the end (WAI-041). |
| **Hold** | `hand` (the guesser holds the phone on forehead or chest) or `free` (hands-free: the phone stands behind the guesser, a clue giver taps). A game's hold is chosen on S2; a player may override it for the rest of the game (WAI-014). |
| **Motion** | Answering by moving the phone, on in `hand` hold when Settings "Answer by moving the phone" is on and motion is available (WAI-013). Taps always work as well, in both holds. |
| **Reference angle** | θ₀: the phone's pitch averaged over the last 500 ms of T2's countdown (WAI-016). |
| **Pitch** | θ: the angle in degrees between the screen's outward normal and the horizontal plane; positive when the screen faces up, negative when it faces the floor. From `DeviceOrientationEvent` (test hook WAI-H3). |
| **Mark** | One Got it or one Pass on T3. |
| **Score** | A player's Got it count, summed over their saved turns in this game. **Turns played**: their saved turns in this game. |
| **Guard** | A main button ignores taps for 800 ms after its screen mounts (1000 ms for "I'm Riya: start" and "Start Riya's turn") and shows the greyed look meanwhile; a tap during a guard does nothing and is never carried to the next screen. Same rule as SWD-114. |

Example players, typed in this order: **Riya, Arjun, Meena, Kabir, Zoya, Dev**. Added mid-round: **Om**. Example words (pack
Animals): Tiger, Owl, Camel, Duck, Bat, Penguin, Zebra, Kangaroo.
Plurals: "1 word" / "2 words"; "1 turn" / "2 turns"; "1 game" / "2 games"; "6 players" (never 1).

## Canonical strings
| Where | Exact text | Element | ID |
|---|---|---|---|
| Picker card | "What Am I?" · "Phone on your forehead, the room gives clues · One phone, passed round · 2–20 players" | button, name starts "What Am I?" | WAI-001 |
| Home unfinished row | line 1 "What Am I? · Round 2 · Arjun's turn"; line 2 "Riya, Arjun +4 · 8:05 pm · Tap to resume" | inside `unfinished-games` | WAI-091 |
| Who's playing? | h1 "Who's playing?"; small line "Players take turns in this order. Drag a name to move it."; "What Am I? needs at least 2 players."; "Up to 20 players."; Impostor's duplicate message "Riya is already playing. Add an initial, like Riya S."; toast "Kabir removed · Undo" | h1; small line; `role="alert"`; toast | WAI-002 |
| Words and time | h1 "Words and time"; h2 "Which words?", "Time for each turn", "How to hold the phone"; line under Mix of all "Words from every pack."; time line "30 s for small kids, 90 s for grandparents"; hold lines (WAI-003); switches "Include non-veg food (chicken, fish, egg)", "Sounds"; sound line on "So the guesser knows a word counted." / off "The guesser won't know a word counted."; line "Ready as it is, or change anything above."; main "Start with these words" / from R1 "Carry on playing" | h1; h2; radio groups; switches; main | WAI-003 |
| Pack option | "<Pack> · <n> words" (e.g. "Animals · 93 words"; "Mix of all · 743 words") | radio label | WAI-003 |
| Read this aloud | h1 "Read this aloud"; the card text of WAI-005; main "First turn" | h1; paragraph; main | WAI-005 |
| Pass screen | h1 "Riya, you're guessing"; hold line, rule line, score line, tip line (WAI-011); quiet "Someone else goes first", "Hands-free for Riya" / "Riya will hold it", "Players (6) ›", "← Home (game saved)"; main "I'm Riya: start" / "Start Riya's turn" | h1; small lines; quiet buttons; main | WAI-011 |
| Motion question | h1 "Answer by moving the phone?"; "Move the phone down for Got it, up for Pass. Your phone will ask once."; quiet "Use taps instead"; main "Yes, move the phone"; toast "Tap bottom: Got it · Tap top: Pass" | h1; paragraph; buttons; toast | WAI-013 |
| Countdown | "3", "2", "1"; line "Put it on your forehead or chest!" / hands-free "Riya, don't turn round!" | `countdown`; small line | WAI-016 |
| Word screen | top line "Give clues. Don't say the word!" / hands-free "Clue givers: tap bottom for Got it, top for Pass."; the word; pack name; time "0:34"; flashes "Got it!" / "Pass"; button "Pause" | small line; `the-word`; small line; `time-left`; `mark-flash`; button | WAI-020 |
| Time's up | h1 "Time's up! Riya got 5"; h2 "Got it", "Passed"; word buttons "Owl" / moved "Owl ↺"; lines "Marked wrong? Tap a word to move it.", "Next: Arjun" / last of round "Next: round over"; quiet "← Home (game saved)"; main "Save score"; toast "Riya: 5 saved · Undo" | h1; h2; buttons; small lines; main; `undo-toast` | WAI-030, 031 |
| Round over | h1 "Round 1 done"; scoreboard rows "Arjun 7 (1 turn)"; line "Words nobody got: Penguin, Zebra"; small line "Play as many rounds as you like; tap End the game to see who got the most."; quiet "Players (6) ›", "Change players or words", "End the game", "← Home (game saved)"; main "Round 2" | h1; `scoreboard` list; small lines; buttons | WAI-033 |
| Paused | dialog "Paused"; where-line; "The word is hidden. Tap Carry on playing when you're ready."; quiet "Skip Riya's turn", "← Home (game saved)"; main "Carry on playing" | dialog | WAI-040 |
| Skip | dialog "Skip Riya's turn?"; "Words marked so far still count."; "Skip Riya's turn" / "Carry on playing" (main) | dialog | WAI-043 |
| Players | dialog "Players"; top line "Add a name to join. New players go after the last player in this round."; ✕ per name; Done | dialog | WAI-041 |
| Leave | dialog "Kabir has to leave?"; "Kabir's points stay on tonight's scoreboard."; "Kabir leaves" / "Don't remove Kabir" (main); toast "Kabir left · Undo"; one left: "2 players needed. Add someone, or end the game." with "Add a player" / "End the game" | dialog; toast | WAI-042 |
| End the game | dialog "End the game?"; "Shows this game's winner. You can play again with the same people."; "End the game" / "Keep playing" (main); toast "Game ended · Undo" | dialog; toast | WAI-060 |
| End for tonight | dialog "End for tonight?"; "Shows tonight's summary. Every score is kept in History."; "End for tonight" / "Keep playing" (main) | dialog | WAI-063 |
| Game over | h1 "Arjun wins with 14!" / tie "Arjun and Meena share the win with 12!" / three or more "Arjun, Meena and Dev share the win with 12!"; scoreboard rows "Arjun 14 (2 turns)"; lines "Best turn: Meena, 8 words", "Words nobody got: Penguin, Zebra, Kangaroo", "Tonight: Arjun 1 win"; quiet "Change players or words", "End for tonight", "← Home"; main "Play again" | h1; list; small lines; buttons | WAI-061 |
| Tonight's summary | h1 "Tonight's What Am I?"; "6 players · 2 games · 148 words got"; "Wins: Arjun 1 · Meena 1"; "Best guesser tonight: Meena (31 words)"; quiet "Oops, keep playing", "← Home"; main "Play something else" | h1; small lines; buttons | WAI-064 |
| Where-line | "Round 2 · Arjun's turn next" (T1, T4 after save, R1) · "Round 2 · Arjun guessing, 34 s left" (paused turn) · "Game over, game 1" (G1) | `where-line` | WAI-090 |
| Tip lines | "Joining this round: Om" · "Only 8 new Animals words left. After that, words come from Mix of all." · "All words used tonight. Words from earlier games come back, oldest first." · "Turn your ringer on so you hear each word count." · "Screen not turning? Turn off rotation lock." · "Keep your screen on during the turn." | `tip-line` | WAI-011 |
| Menu | "How to play", "Players", "Words and time", "Pause", "Home (game saved)", "End the game", "End for tonight", "Settings", "History" (only those that apply, this order) | menu items | WAI-092 |
| Settings | switch "Answer by moving the phone" | switch | WAI-013 |

---

## 01 Setup → `specs/what-am-i/01-setup.md`

### WAI-001 Picking What Am I?
Status: draft · Phase: What Am I? 1
Home's "Host a game" line lists What Am I? among the games (titles joined with ", " and " or " before the last). The picker
"What shall we play?" shows the What Am I? card (Canonical strings) after Secret Words' card, all cards equal in width and
height (±1 px). Tapping it opens "Who's playing?"; with an unfinished What Am I? game night, the shared Start new dialog (as
SWD-115) opens instead: "Start new (ends that one)" records `endEvening` for it and opens "Who's playing?"; "Carry on that
one" resumes it (WAI-091).

### WAI-002 Who's playing?
Status: draft · Phase: What Am I? 1
Impostor's names screen (IMP-003) with: no "Sit in a circle…" line; ▲ ▼ replaced by a drag handle per name (accessible name
"Move Riya", with "Move up" / "Move down" actions for keyboards and screen readers); the small line "Players take turns in this
order. Drag a name to move it." under the h1. Tonight's names filled in in their last order. "Next" is disabled with fewer than
2 names, and "What Am I? needs at least 2 players." shows below the list whenever that is true. A 21st name shows "Up to 20
players." and adds nothing. ✕ removes a name with the undo toast "Kabir removed · Undo". Every Enter adds its name and keeps
the field focused (as SWD-132). "← Back" → the picker. "Next" → Words and time.

### WAI-003 Words and time
Status: draft · Phase: What Am I? 1
One screen, no page scrolling at 390 × 844 with Larger text off; elsewhere it scrolls, the main button stays fixed.
1. **"Which words?"**: a radio group of 9 options in this order: Mix of all, Animals, Food, Around the house, Jobs, Sports and
   cricket, Festivals and places, Act it out, Famous Indians. Each label "<Pack> · <n> words" with n = eligible words of that
   pack (R3 for Mix of all). With `words.csv` edition 1 and non-veg off: Mix of all 743, Animals 93, Food 89, Around the house
   100, Jobs 96, Sports and cricket 95, Festivals and places 96, Act it out 100, Famous Indians 76; with non-veg on, Food 99
   and Mix of all 753. The selected option shows a ✓ and `aria-checked="true"`. Mix of all has the small line "Words from
   every pack." Default: Mix of all.
2. **"Time for each turn"**: 30 s · 60 s · 90 s (default 60 s), small line "30 s for small kids, 90 s for grandparents".
3. **"How to hold the phone"**: "In the guesser's hand" with small line "Forehead or chest; the guesser moves it to answer." ·
   "Hands-free" with "The phone stands behind the guesser; one clue giver taps to answer. Good for grandparents and small
   children." Default: In the guesser's hand.
4. **Switches**: "Include non-veg food (chicken, fish, egg)" (default off); "Sounds" (default on) with the small line "So the
   guesser knows a word counted." while on and "The guesser won't know a word counted." while off.
5. Small line "Ready as it is, or change anything above." directly above the main button "Start with these words".
Every choice starts from the last-used values on this phone (pack, time, hold, both switches); the first time, the defaults.
"← Back" → Who's playing? (names kept). "How to play" → WAI-006.

### WAI-004 Starting a game
Status: draft · Phase: What Am I? 1
When this is the first What Am I? game of tonight, "Start with these words" opens Read this aloud (WAI-005) and records
nothing; its "First turn" records `start`. Otherwise "Start with these words" records `start` and opens T1 for the first player.
`start` holds the choices and the turn order; scores are 0 for everyone.

### WAI-005 Read this aloud
Status: draft · Phase: What Am I? 1
The card reads, in hand hold: "One of us holds the phone on their forehead or chest, screen to the room. Everyone else gives
clues: talk, act, make the noise, but never say the word. Got it? Move the phone down. Stuck? Move it up to pass. Passing is
free. Marked wrong? Fix it when time's up. You have 60 seconds. Play as many rounds as you like; tap End the game to see who
got the most." ("60 seconds" is the chosen time: "30 seconds", "90 seconds".) In hands-free hold, the sentences "Got it? Move
the phone down. Stuck? Move it up to pass." become "The phone stands behind the guesser. One clue giver taps the bottom for Got
it, the top to pass." Fits without scrolling at every size with Larger text off. "First turn" → T1 for the first player;
"← Back" → Words and time with every choice kept (nothing was recorded).

### WAI-006 How to play
Status: draft · Phase: What Am I? 1
Opened from S1, S2, S3 and the menu. h1 "How to play"; the steps of `guide.md` "How to play" in short lines, with three drawings
(phone on a forehead, on a chest, standing behind a player), each with alt text ("Phone held on the forehead, screen facing
the room" etc.); main "Done" → the screen it was opened from, unchanged.

## 02 Words → `specs/what-am-i/02-words.md` (C3)

### WAI-010 The word order
Status: draft · Phase: What Am I? 1
At `start`, the game's queue is the eligible words shuffled with `shuffle(words, createRng(\`${wordSeed}:${gameIndex}\`))`
(gameIndex = 1 for tonight's first game), then filtered: words **shown** earlier tonight are moved to the end of the queue in
the order they were first shown (oldest first). Each T3 word is the next one in the queue. Property: within one game no word is
shown twice while unshown eligible words remain; across games, no word is shown twice tonight until every eligible word has
been shown. A test may fix `wordSeed` (WAI-H1).
**Running out:** when the chosen pack has no unshown word left, the next words come from Mix of all's unshown words (same seed
rule, gameIndex unchanged), without stopping the turn. When Mix of all has none left either, shown words return, oldest first.

### WAI-011 Tip lines on T1
Status: draft · Phase: What Am I? 1
At most one tip line shows on T1, the first that applies in this order:
1. "Joining this round: Om" while a player added this round has not had their turn (names joined with ", " and " and ").
2. "Only 8 new Animals words left. After that, words come from Mix of all." when the chosen pack (not Mix of all) has 1–14
   unshown eligible words ("Only 1 new Animals word left. …").
3. "All words used tonight. Words from earlier games come back, oldest first." when Mix of all has no unshown word.
4. A phone tip on this phone's first What Am I? turn ever, the first that applies: "Turn your ringer on so you hear each word
   count." (iPhone and Sounds on; WAI-H5 decides the platform) · "Screen not turning? Turn off rotation lock." (only if the last
   game on this phone recorded a rotation-lock event, WAI-024) · "Keep your screen on during the turn." (the wake lock was
   refused on this phone's last turn, WAI-025).

## 03 A turn → `specs/what-am-i/03-turn.md` (marking rules C3; screens C2)

### WAI-012 The pass screen
Status: draft · Phase: What Am I? 1
T1 for the player whose turn it is. h1 "Riya, you're guessing". **Hand hold:** small line "Hold the phone on your forehead or
chest, screen facing the room."; the forehead-and-chest drawing; rule line "Phone down: Got it · Phone up: Pass" (motion off or
unavailable: "Tap bottom: Got it · Tap top: Pass"); quiet "Hands-free for Riya"; main "I'm Riya: start". **Hands-free:** small
line "Stand the phone behind Riya, facing the room. Riya, don't turn round!"; the standing-phone drawing; rule line "One clue
giver taps: bottom half Got it · top half Pass"; when Riya chose it in a hand-hold game, the small line "Hands-free (Riya's
choice)"; quiet "Riya will hold it"; main "Start Riya's turn". Both: score line "Round 1 · turn 1 of 6" (turn k of the round's
current length); the tip line (WAI-011); quiet "Someone else goes first", "Players (6) ›" (count of current players), "← Home
(game saved)"; Pause; "··· Menu". Main guard 1000 ms.

### WAI-013 Motion permission and the motion question
Status: draft · Phase: What Am I? 1
Motion needs hand hold and Settings "Answer by moving the phone" on (default on).
- Where the browser needs permission for motion (`DeviceOrientationEvent.requestPermission` exists) and this phone has never
  answered: "I'm Riya: start" opens T0 (Canonical strings) instead of T2. "Yes, move the phone" calls the permission request:
  granted → T2 with motion; refused or failed → T2 with taps only and the toast "Tap bottom: Got it · Tap top: Pass". "Use taps
  instead" → T2 with taps only and turns the Settings switch off. T0 is shown at most once per phone.
- Where no permission is needed and orientation events arrive, motion is on without T0.
- Where no orientation event has arrived within 1 s of T2 starting, the turn runs with taps only (no message).
- Settings "Answer by moving the phone" turned on again: T0 shows again on the next hand-hold turn where permission is needed
  and not yet granted.

### WAI-014 Hands-free for one player
Status: draft · Phase: What Am I? 1
"Hands-free for Riya" on T1 switches T1 to the hands-free layout for Riya now and on her later turns in this game, recording
`setHold { player: 'Riya', hold: 'free' }`; "Riya will hold it" does the reverse. A player's override ends with the game (Play
again starts from S2's hold). Nothing else changes.

### WAI-015 Someone else goes first
Status: draft · Phase: What Am I? 1
"Someone else goes first" opens Players (WAI-041) with the line "Who goes now?" above the names and each name a button. Tapping
"Meena" records `reorder` so Meena takes this turn and Riya the next; T1 opens for Meena. Done without a choice → T1 for Riya,
nothing recorded. Only players who have not had their turn this round are offered.

### WAI-016 Countdown
Status: draft · Phase: What Am I? 1
T2: "3", "2", "1", each 1000 ms, with a 100 ms beep at each (Sounds on); small line "Put it on your forehead or chest!"
(hands-free "Riya, don't turn round!"); Pause. The screen wake lock is requested at T2's start (WAI-025). θ₀ is the mean pitch
over the last 500 ms of the countdown. At t = 3000 ms T3 opens and the turn clock starts at the turn time.

### WAI-020 The word screen
Status: draft · Phase: What Am I? 1
T3 shows, for the room: the top small line (Canonical strings), the word (`the-word`, CAPITALS by CSS, bold, sized to fit in 2
lines: the largest size from 96 px down to 40 px that fits; at 568 × 320 the longest word, 22 characters, fits at 40 px), the
pack name (15 px; for a Mix of all fallback word, its own pack), `time-left` "0:34" (m:ss, whole seconds rounded up), and a
"Pause" button (48 × 48 px minimum, icon and the word "Pause", 16 px from the top and right edges as the room sees the screen).
Designed for landscape; in portrait the same layout stacks. The screen's **marking areas** are the top half and bottom half
of the screen as the room reads the word, minus: the Pause button with 8 px around it, and a band of 15% of the screen's long
side at each short edge (where hands grip).

### WAI-021 Marking
Status: draft · Phase: What Am I? 1
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

### WAI-022 Sounds and vibration
Status: draft · Phase: What Am I? 1
With Sounds on: Got it = a 200 ms rising ding; Pass = a 200 ms low tone; each of the last 10 seconds = a 50 ms tick, with three
quick ticks (50 ms, 100 ms apart) at 10 s left; time up = a 600 ms falling tone. Vibration (where `navigator.vibrate` exists,
whatever the Sounds switch): Got it 40 ms; Pass 40, 60, 40 ms; time up 400 ms. Volume follows the phone. With Sounds off, no
sound is played; vibration stays.

### WAI-023 Time up
Status: draft · Phase: What Am I? 1
At 0 s left, `timeUp` is recorded with the word on screen as passed (none if a flash was running), the time-up sound and
vibration play, the wake lock is released after T4 shows, and T4 opens.

### WAI-024 Rotation lock
Status: draft · Phase: What Am I? 1
On T2 and T3, when orientation events say the phone is held sideways (|gamma| ≥ 60° for 500 ms) but `screen.orientation.type`
is a portrait type, the page draws T3 rotated 90° to read correctly to the room and records a rotation-lock event on this phone
(WAI-011). Test hook WAI-H3 sets both values.

### WAI-025 Screen stays awake
Status: draft · Phase: What Am I? 1
`navigator.wakeLock.request('screen')` at T2's start; released on T4, Pause and app hidden; requested again on resume. If the
request is refused or the API is missing, the turn goes on, and this phone records it for WAI-011's tip.

## 04 End of a turn and scores → `specs/what-am-i/04-scores.md` (C3)

### WAI-030 Time's up screen
Status: draft · Phase: What Am I? 1
T4, portrait layout. h1 "Time's up! Riya got 5" (the Got it count). h2 "Got it" then its words as buttons in the order shown;
h2 "Passed" then its words (time-up word last). Empty list: "None". Small line "Marked wrong? Tap a word to move it."; small line
"Next: Arjun" (the next player in the order; after the round's last player "Next: round over"); quiet "← Home (game saved)";
Pause; "··· Menu"; main "Save score". Fits without scrolling at 390 × 844 for up to 20 words; more words scroll the lists only.
Tapping a word records `fix` and moves it to the other list's end with "↺" after it ("Owl ↺"; moving it back removes the ↺); the
h1's count updates.

### WAI-031 Save score, and Undo
Status: draft · Phase: What Am I? 1
"Save score" records `scoreTurn`: the player's score grows by the Got it count, turns played by 1, and T1 opens for the next
player (or R1 after the round's last player). The undo toast "Riya: 5 saved · Undo" stays until the next "I'm Riya: start" /
"Start Riya's turn" or "Round 2" tap, or until another toast replaces it. Undo records `undoScore`, takes the turn's points and
turn count back, and reopens T4 exactly as before Save (lists and ↺ marks kept). After the toast has gone, the turn is locked.

### WAI-032 Scores
Status: draft · Phase: What Am I? 1
Scoreboards list players highest score first; ties in the order of the turn order. Each row "Arjun 7 (1 turn)"; players who left
"Kabir 3 (1 turn) (left)" at the end. Example K2 of `screen-map.md`: after round 1, Arjun 7, Dev 6, Riya 5, Meena 5, Zoya 4,
Kabir 3; after round 2, Arjun 14, Meena 13, Dev 11, Riya 9, Kabir 7, Zoya 7.

### WAI-033 Round over
Status: draft · Phase: What Am I? 1
After the last player's "Save score": R1 (Canonical strings). "Words nobody got: Penguin, Zebra" lists this round's passed words
(after fixes) in order shown, at most 5, then "and 3 more"; none: the line is left out. "Round 2" (the next round's number) →
T1 for the first player in the turn order. "Change players or words" → Who's playing? with "← Back to the game", then Words and
time with main "Carry on playing" (records `setChoices` / `setPlayers`; scores kept) → T1 for the next round's first player.

## 06 Interruptions and people → `specs/what-am-i/06-interruptions.md` (C2)

### WAI-040 Pause
Status: draft · Phase: What Am I? 1
The Pause button, the menu item, the phone's Back gesture during T1–T4, and the app being hidden (`visibilitychange` to
hidden) all open the Paused cover (Canonical strings) and record `pause`. On T2/T3 the clock stops at once and the word is hidden
(the cover covers the whole screen; the word is not in the DOM). "Carry on playing" records `resume`: from T1 or T4, back to
that screen; from T2/T3, the countdown runs again (WAI-016, new θ₀) and T3 shows the **next** word in the queue with the time
left kept; the hidden word goes to the end of the queue unshown (R2). "← Home (game saved)" → Home; the game stays unfinished.

### WAI-041 Players during a game
Status: draft · Phase: What Am I? 1
Players (from "Players (6) ›" on T1 and R1, or the menu) lists the players in turn order with ✕ and drag handles, an add row,
and the top line "Add a name to join. New players go after the last player in this round." Adding Om mid-round records
`addPlayer` and puts Om at the end of the turn order; he takes a turn this round and T1 shows "Joining this round: Om" until
then. Dragging records `reorder` (only among players still to play this round; players who have played stay in place). Re-adding
the name of a player who left this game brings back their points and turns.

### WAI-042 Someone leaves
Status: draft · Phase: What Am I? 1
✕ opens "Kabir has to leave?". "Kabir leaves" records `leave`: Kabir leaves the turn order, keeps his points (R4), the undo toast
"Kabir left · Undo" shows; if it was Kabir's T1, T1 opens for the next player. With 2 players, ✕ instead opens the dialog with
"2 players needed. Add someone, or end the game.", buttons "Add a player" (focuses the add row) and "End the game" (→ WAI-060).
Leaving is not offered during T2–T3 (the menu's Players item is greyed with the small line "After this turn").

### WAI-043 Skip a turn
Status: draft · Phase: What Am I? 1
"Skip Riya's turn" on the Paused cover (during T2/T3 only) opens "Skip Riya's turn?". "Skip Riya's turn" records `timeUp` (the
hidden word goes back unshown, R2) and opens T4 with what was marked; "Carry on playing" → back to the cover.

### WAI-044 Words and time mid-game
Status: draft · Phase: What Am I? 1
The menu's "Words and time" between turns (T1, T4 before saving, R1) opens S2's choices in a sheet with main "Done"; changes record
`setChoices` and apply from the next turn (a changed pack builds a new queue by WAI-010 with the same gameIndex). During T2–T3 the
item is greyed with "After this turn".

## 07 Game over and tonight → `specs/what-am-i/07-results.md` (saved data C3)

### WAI-060 End the game
Status: draft · Phase: What Am I? 1
"End the game" (R1, the menu, the leave dialog) opens "End the game?". "End the game" records `endGame` and opens G1 with the toast
"Game ended · Undo"; Undo removes `endGame` and returns to the screen it came from. A turn in progress (T2–T4 unsaved) is dropped:
its marks don't count.

### WAI-061 Game over
Status: draft · Phase: What Am I? 1
G1 (Canonical strings). The winner is the highest score among players who haven't left (R4); ties share the win. "Best turn"
names the single turn with most Got it (ties: the earliest). "Words nobody got" lists this game's passed words, at most 5 then
"and 3 more". "Tonight: Arjun 1 win" counts won games tonight per player ("Arjun 1 win · Meena 1 win"; a shared win counts for
each). A game with no saved turn shows h1 "Game ended. No turns played." and no winner.

### WAI-062 Play again
Status: draft · Phase: What Am I? 1
"Play again" records `start` (gameIndex + 1) with the same players (leavers removed), order, pack, time and hold (per-player
overrides cleared), scores 0, and opens T1 for the first player. "Change players or words" → S1 → S2 → "Start with these words"
(no read-aloud).

### WAI-063 End for tonight
Status: draft · Phase: What Am I? 1
"End for tonight" (G1 or menu) opens its dialog; confirming records `endGame` if a game is open, then `endEvening`, and opens G2.

### WAI-064 Tonight's summary
Status: draft · Phase: What Am I? 1
G2 (Canonical strings): players who took part tonight, games ended with at least one saved turn, total Got it tonight; wins per
player (most first); "Best guesser tonight" = most Got it over tonight (ties: "Meena and Dev (31 words)"). "Oops, keep playing"
removes `endEvening` (and the `endGame` it added) and returns where the host came from. "← Home" / "Play something else" → Home /
the picker, tonight's names kept (IMP-102). Menu: only "Delete tonight's games" (as IMP).

## 09 Usability → `specs/what-am-i/09-usability.md` (C1/C2)

### WAI-080 Sizes and text
Status: draft · Phase: What Am I? 1
Every screen works at every size with Larger text off and on: nothing cut off, no horizontal scrolling, the main button fixed
(Impostor's landscape main button rule except on T3, which has no main button). The longest real values: 16-character player
names, 22-character words, 20 players.

### WAI-081 Accessibility
Status: draft · Phase: What Am I? 1
Each mark is announced in an `aria-live="assertive"` region ("Got it", "Pass"); time left announced at 10 s ("10 seconds left");
T3's word is in an `h1`. Every icon button has a word or accessible name. Contrast 4.5:1 for all text; the flashes 3:1 against
the word.

### WAI-082 Words on screen never used
Status: draft · Phase: What Am I? 1
No What Am I? screen shows "tilt", "nod", "session", "evening", "card" or "clue" as a noun for the word (the hands-free line's
"clue giver" is allowed). Checked by text search on every screen state.

## 10 Lifecycle → `specs/what-am-i/10-lifecycle.md` (saved data C3)

### WAI-090 Where-line
Status: draft · Phase: What Am I? 1
The where-line (Canonical strings) shows under "Welcome back." after a reload or a return from hidden, on the Paused cover, and
on Home's unfinished row (line 1 there uses "What Am I? · Round 2 · Arjun's turn").

### WAI-091 Resume
Status: draft · Phase: What Am I? 1
Every move is saved as it happens. Reopening the app (or tapping the Home row) returns to the same screen: T1, T4 (lists and ↺
kept), R1 or G1; a turn in T2/T3 returns on the Paused cover with its time left. A game night left unfinished ends by itself 12
hours after its last move, as IMP-104 (unsaved turn dropped).

### WAI-092 History
Status: draft · Phase: What Am I? 1
The game night is listed in History as "What Am I? · 2 games" with its players; "Play again" there opens S1 with its players and
S2 with its last choices. Saved data carries a format version and each shown word's id (B9), so a later edition never changes
what an old game shows.

## Test hooks the build provides
- **WAI-H1** Rule API in `src/games/what-am-i/index.ts` (pure), fitting the engine (`startMatch`, `play`, `replay`, `viewFor`,
  `SavedGame`, `createRng`, `shuffle`). Moves: `start`, `got`, `pass`, `timeUp`, `fix`, `scoreTurn`, `undoScore`, `pause`,
  `resume`, `addPlayer`, `leave`, `reorder`, `setHold`, `setChoices`, `setPlayers`, `endGame`, `endEvening`. Seeds:
  `{ words: string }`. `queueFor(state)` returns the remaining queue (ids) for tests.
- **WAI-H2** Fake clock for the countdown, the turn clock, guards and toasts.
- **WAI-H3** Orientation injection: set pitch θ, gamma and `screen.orientation.type`; or "no orientation events".
- **WAI-H4** Permission: `requestPermission` absent, granted, refused, throws.
- **WAI-H5** Platform: iPhone or Android (for the ringer tip and vibration).
- **WAI-H6** Wake lock: granted, refused, missing.
- **WAI-H7** Word list override: a short test list (e.g. 5 words) to exercise running out.
