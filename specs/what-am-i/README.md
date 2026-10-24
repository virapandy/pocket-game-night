# What Am I?: scenarios (version 1.3, approved by the owner, 24 October 2026)

Copied from `docs/games/what-am-i/scenarios.md` (version 1.3), the binding contract, split into one file per section as its
headings name (05 and 08 are not used). **Each scenario carries, word for word, the Version 1.1, 1.2 and 1.3 items that name
it; a later version wins over earlier text in the same scenario (1.3 over 1.2 over 1.1 over the body).** The version
sections below are kept whole as well, for the items that touch every screen (Terms, the guard, the hooks). Where an older
canonical string below differs from a scenario's version item, the version item wins (for example T3's top line, R1's h1,
"End Riya's turn now", the sound tip, the Paused body).
Rule API and browser hooks for the tests (Test hooks made exact): [api.md](api.md).

| File | Scenarios |
|---|---|
| [01-setup.md](01-setup.md) | WAI-001 to WAI-006 |
| [02-words.md](02-words.md) | WAI-010, WAI-011 (C3) |
| [03-turn.md](03-turn.md) | WAI-012 to WAI-016, WAI-020 to WAI-025 (marking rules C3; screens C2) |
| [04-scores.md](04-scores.md) | WAI-030 to WAI-033 (C3) |
| [06-interruptions.md](06-interruptions.md) | WAI-040 to WAI-044 (C2) |
| [07-results.md](07-results.md) | WAI-060 to WAI-064 (saved data C3) |
| [09-usability.md](09-usability.md) | WAI-080 to WAI-082 (C1/C2) |
| [10-lifecycle.md](10-lifecycle.md) | WAI-090 to WAI-092 (saved data C3) |

Tests: rule tests `tests/games/what-am-i/` and `tests/contract/what-am-i.test.ts`; browser tests
`tests/browser/what-am-i-*.spec.ts`. Until `src/games/what-am-i` exists they are marked "ahead of the build" (expected to fail,
and checked to fail only because the game is missing); see `tests/games/what-am-i/README.md`.

---

Status: **version 1.3 approved by the owner, 24 October 2026** ("Approved: What Am I? scenarios version 1.3. Hand them to the tester."). Read each scenario together with the "Version 1.1", "1.2" and "1.3" sections, which win over the text they name.
`words.md` and the What Am I? decisions in `docs/decisions.md` (WA1–WA10 and the rows of 23 October). Written to
`docs/spec-rules.md`. Before approval: the two-reader check (rule 12), then the owner. After approval the tester copies each
section into `specs/what-am-i/` (file names in the headings) and writes tests. Build only after Secret Words is released
(roadmap).

**This file is binding: where `screen-map.md`, `guide.md` or `words.md` differ, this file wins.**
Phase: **What Am I? 1** = first release, every scenario here unless it says "later".
Change classes (`docs/change-sop.md`): the word order and its seed, marking rules, scoring, saved game nights and the word list
format = **C3** (tests first: sections 02, 03 rules, 04, 07); screens = C1/C2. Sections 05 and 08 are not used (rounds are
in 04).

### Product owner's resolutions while drafting (owner confirmed R1–R4, 23 October)
- **R1. "Lay the phone flat to pause" is dropped.** Laying a phone flat face up passes through "phone up", which marks Pass
  first. Pause stays on the Pause button (the room can reach it: the screen faces them), the phone's Back gesture and hiding
  the app. Map draft 4's T3 row changes accordingly.
- **R2. A word hidden by a pause goes to the end of the queue,** not back to its place, and is not "shown" (WAI-021).
- **R3. Mix of all lists a word once** even when it sits in two packs (Bat, Swimming): 724 words with non-veg on, 714 off (edition 1 after the second Jev check).
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
46. Pause on T1 or T4: the cover without "End Riya's turn now". Each tap on a T4 word is one `fix` (no guard on word chips).
47. WAI-081: live region `data-testid="mark-live"`; flash text 4.5:1 against the flash colour.
48. WAI-082, exact: no screen text contains, as a whole word, case-insensitive, "tilt", "tilting", "nod", "session", "evening"
    or "card"; "clue" appears only in "Give clues", "gives clues", "Clue givers", "clue giver".
49. New hooks: **WAI-H1b** seed in the browser (`window.__waiTest.setSeed('t1')`); **WAI-H9** fire `visibilitychange` and the
    Back gesture (`popstate`); **WAI-H10** wall clock and time zone; **WAI-H11** clear this phone's stored state.
50. **T1 without Players** (second Jev read and three prototype walks, 23 October): T1 has no "Players (6) ›"; Players is
    on R1 and in the menu. WAI-012's and the Canonical strings' mentions of it on the pass screen are withdrawn.

## Version 1.3: six persona walks of the prototype (24 October)
**Every item below wins over the earlier text and over Versions 1.1 and 1.2.** Source: `prototype-walk-2-2026-10-24.md`.
1. **Who T3's line is for** (guest): the top line reads "Everyone else: give clues. Don't say the word!" (hands-free line
   unchanged).
2. **A round is not the game** (guest): R1's h1 reads "Round 1 done. Round 2 next." (k and k + 1).
3. **Who's ahead, during play** (10-year-old, uncle): T4 gains the small line under the h1 "Riya: 9 in all · Top: Arjun 14"
   (after this turn's count, before saving; when Riya is top: "Riya: 14 in all · Top so far"; a shared top: "Top: Arjun and Meena
   12"). The menu gains "Scores" (after "Players"), opening a sheet with R1's scoreboard and "Done".
4. **S2 order** (grandparent, distracted host: the hold choice was buried under nine packs): "Time for each turn", then "How to
   hold the phone", then "Which words?", then the two switches.
5. **Nothing under the main button** (four walks): every scrolling screen ends with bottom padding equal to the main button's
   height plus 16 px (plus any toast's height while one shows), so the last line, "← Back", "How to play" and "← Home (game saved)"
   can always be scrolled clear of it. Toasts sit above the main button and never cover a quiet button that is the only way to a
   screen: while a toast shows, that button is scrolled into view above it.
6. **D2's add row at 320 px** (10-year-old: "Add" cut off): the input shrinks; "Add" keeps at least 72 × 48 px.
7. **How to play, scoring and judging** (uncle): after line 5: "One point for each word you got. Passing costs nothing." and
   "The room decides if a clue broke the rules."
8. **Paused says the clock stopped** (distracted host): the cover's body reads "The clock is stopped and the word is hidden.
   Tap Carry on playing when you're ready."
9. **T3 sizes** (distracted host, guest): `time-left` 28 px bold; the pack name 18 px (22 px with Larger text).
10. **The picker gets a way back** (four walks; Jev: A2's way out 0.06): "What shall we play?" gains a quiet "← Home". It is the
    shared picker, so this changes every game's picker (C1; product owner's call, listed for the owner).
11. **Tap guards are invisible** (owner, 24 October, every game): main buttons look live at once; the guard times stay and a
    tap inside them does nothing. Replaces the Guard term's "shows the greyed look meanwhile". Not changed: "End the game" vs "End for tonight" (three walks; shared words, D5 and D6 say what each does).
12. **Prototype-only** (renderer, not design): the fixed example data (names, rounds, "2 players needed" with 6), the turn clock
    not running, T2's tap hint after choosing motion, "Drawing" boxes, Back with a dialog open, dialogs reopening on Back, and
    editing the address. Listed in the handover for the renderer lane.

## Version 1.2: three more persona walks and the critic pass (23 October)
**Every item below wins over the earlier text and over Version 1.1.** Source: `map-walk-2-2026-10-23.md`.
1. **A guest on their own phone** (guest walk, stuck): Home's shared "Join a game" screen gains the line, after the other games'
   lines: "What Am I? is played on the host's phone. Ask the host to add your name." (`join-line-what-am-i`).
2. **"End Riya's turn now"** replaces "Skip Riya's turn" everywhere (uncle, guest: "Pass" vs "Skip"). Its dialog: h1 "End Riya's
   turn now?", body "Riya's turn ends now. Words marked so far still count.", buttons "End Riya's turn now" / "Carry on playing"
   (main). It records `skip` (Version 1.1 item 15), and T4 then reads "Turn ended early. Riya got 2".
3. **Score line** "Round 1 · player 1 of 6" (was "turn 1 of 6"; walks mixed "turn" and "round"); same k and n as Version 1.1 item 31.
4. **Hold, one place to read it** (uncle, distracted host): S2's "How to hold the phone" gains the small line "You can change
   this for one player on their turn." T1's quiet buttons stay "Hands-free for Riya" / "Riya will hold it".
5. **Ending with an unfinished round** (critic 4, uncle): when End the game is opened mid-round, its body is "Round 2 isn't done:
   Zoya and Dev haven't played. Shows this game's winner." (names of current players still to play, joined with ", " and " and ";
   more than 3: "4 players haven't played."). Main stays "Keep playing".
6. **A visible record** (uncle): G1 gains the small line "Moved after time's up: 3 words · Turns ended early: 1" (each part only
   when not 0; the whole line left out when both are 0).
7. **Two players left** (critic 2): that dialog's buttons become "End the game", quiet "Don't remove Kabir" (→ D2), and main
   "Add a player" (focuses the add row).
8. **θ₀ only when steady** (critic 1): θ₀ is set from [2500, 3000) ms of T2 only if every event there is within 10 of their mean
   and |mean| < 35. Otherwise θ₀ is set from the first 500 ms span of T3 whose events are all within 10 of their mean; until then
   motion marks are ignored (taps work).
9. **Sound tip for everyone** (critic 6, 10): the ringer tip becomes "Turn the sound up so the guesser hears each word count.",
   on both platforms, on the first turn of every game, while Sounds is on. "Ringer" never appears.
10. **Screen-on tip sooner** (critic 3): "Keep your screen on during the turn." shows on the next T1 after any refused wake lock,
    once per game; it ranks right after "Joining this round".
11. **Rotation tip by platform** (critic 10): iPhone "Screen not turning? Turn off rotation lock."; Android "Screen not turning?
    Turn on Auto-rotate."
12. **Do Not Disturb** (critic 7): Read this aloud ends with the sentence "Tip: turn on Do Not Disturb so messages don't buzz."
    A notification banner or a system dialog over the page (battery saver, a permission prompt) does not pause the turn; only
    the page being hidden does (WAI-040).
13. **Saying the word or peeking** (critic 11): How to play gains line 5b, after line 5: "Said the word, or the guesser peeked?
    Move that word to Passed when time's up."
14. **Motion off by choice** (distracted host): T0's paragraph ends "You can change this in Settings."
15. **Home row for a paused turn** (distracted host): line 1 uses the where-line: "What Am I? · Round 2 · Arjun guessing, 34 s
    left"; tapping it opens the Paused cover, where "Carry on playing" counts 3, 2, 1 and shows a new word with that time.
16. **Settings and History in a game:** menu "Settings" opens the app's Settings sheet; "Done" returns to the same screen,
    unchanged. Menu "History" opens History; its "← Back" returns to the same screen. G2's menu "Delete tonight's games" works as
    Impostor's (IMP-105's delete, with its confirm).
17. **Phone Back on screens without a turn:** S1–S4 as their "← Back"; G1 and G2 as "← Home"; on any dialog it closes the dialog
    (as its quiet, non-destructive button).
18. **Kept as decided:** R2 stays (a paused word goes back unshown; the guesser never sees the word, so it can fairly come back);
    shared ties (WA7); the guards' greyed look (all games). **Out of scope:** two host phones in one game; each phone keeps its
    own words.

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
| **Guard** | A main button ignores taps for 800 ms after its screen mounts (1000 ms for "I'm Riya: start" and "Start Riya's turn") and keeps its normal live look meanwhile (owner, 24 October); a tap during a guard does nothing and is never carried to the next screen. Same rule as SWD-114. |

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
| Pack option | "<Pack> · <n> words" (e.g. "Animals · 93 words"; "Mix of all · 714 words") | radio label | WAI-003 |
| Read this aloud | h1 "Read this aloud"; the card text of WAI-005; main "First turn" | h1; paragraph; main | WAI-005 |
| Pass screen | h1 "Riya, you're guessing"; hold line, rule line, score line, tip line (WAI-011); quiet "Someone else goes first", "Hands-free for Riya" / "Riya will hold it", "Players (6) ›", "← Home (game saved)"; main "I'm Riya: start" / "Start Riya's turn" | h1; small lines; quiet buttons; main | WAI-011 |
| Motion question | h1 "Answer by moving the phone?"; "Move the phone down for Got it, up for Pass. Your phone will ask once."; quiet "Use taps instead"; main "Yes, move the phone"; toast "Tap bottom: Got it · Tap top: Pass" | h1; paragraph; buttons; toast | WAI-013 |
| Countdown | "3", "2", "1"; line "Put it on your forehead or chest!" / hands-free "Riya, don't turn round!" | `countdown`; small line | WAI-016 |
| Word screen | top line "Give clues. Don't say the word!" / hands-free "Clue givers: tap bottom for Got it, top for Pass."; the word; pack name; time "0:34"; flashes "Got it!" / "Pass"; button "Pause" | small line; `the-word`; small line; `time-left`; `mark-flash`; button | WAI-020 |
| Time's up | h1 "Time's up! Riya got 5"; h2 "Got it", "Passed"; word buttons "Owl" / moved "Owl ↺"; lines "Marked wrong? Tap a word to move it.", "Next: Arjun" / last of round "Next: round over"; quiet "← Home (game saved)"; main "Save score"; toast "Riya: 5 saved · Undo" | h1; h2; buttons; small lines; main; `undo-toast` | WAI-030, 031 |
| Round over | h1 "Round 1 done"; scoreboard rows "Arjun 7 (1 turn)"; line "Words nobody got: Penguin, Zebra"; small line "Play as many rounds as you like; tap End the game to see who got the most."; quiet "Players (6) ›", "Change players or words", "End the game", "← Home (game saved)"; main "Round 2" | h1; `scoreboard` list; small lines; buttons | WAI-033 |
| Paused | dialog "Paused"; where-line; "The word is hidden. Tap Carry on playing when you're ready."; quiet "End Riya's turn now", "← Home (game saved)"; main "Carry on playing" | dialog | WAI-040 |
| Skip | dialog "End Riya's turn now?"; "Words marked so far still count."; "End Riya's turn now" / "Carry on playing" (main) | dialog | WAI-043 |
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


## Test hooks the build provides
- **WAI-H1** Rule API in `src/games/what-am-i/index.ts` (pure), fitting the engine (`startMatch`, `play`, `replay`, `viewFor`,
  `SavedGame`, `createRng`, `shuffle`). Moves: `start`, `got`, `pass`, `timeUp`, `skip`, `fix`, `scoreTurn`, `undoScore`, `pause`,
  `resume`, `addPlayer`, `leave`, `reorder`, `setHold`, `setChoices`, `setPlayers`, `endGame`, `endEvening`. Seeds:
  `{ words: string }`. `queueFor(state)` returns the remaining queue (ids) for tests.
- **WAI-H2** Fake clock for the countdown, the turn clock, guards and toasts.
- **WAI-H3** Orientation injection: set pitch θ, gamma and `screen.orientation.type`; or "no orientation events".
- **WAI-H4** Permission: `requestPermission` absent, granted, refused, throws.
- **WAI-H5** Platform: iPhone or Android (for the ringer tip and vibration).
- **WAI-H6** Wake lock: granted, refused, missing.
- **WAI-H7** Word list override: a short test list (e.g. 5 words) to exercise running out.
