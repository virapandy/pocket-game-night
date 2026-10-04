# Impostor: detailed UX (3 October 2026)

**Binding details are in scenarios.md; where this file differs, scenarios.md wins.**

Screen specification by the **UX designer**, reviewed and decided by the **product owner**, before any build.
Sizes for Impostor are **predicted** from Tambola's measured layout (390 × 844: main button 358 × 60, solid red,
16 px gutters, 17 px body, outlined 48 px quiet buttons, "← Back" top left, "··· Menu" top right) and must be
measured on the first build. Rules: `guide.md`. Stages: `lifecycle.md`. Scenarios: `scenarios.md`.

## Product owner decisions on the designer's findings
| ID | Sev | Finding | Decided |
|---|---|---|---|
| R1 | 4 | The word was shown before the last guess | **Hide the word until the guess is said aloud**; then "Show the word" and the room judges. Since 4 October the guess is optional ("Last-chance guess", off by default) |
| R2 | 4 | One mis-tap on a name reveals the impostor | **Pick a name, then "Reveal Arjun"**; Undo covers only the guess verdict |
| R3 | 3 | Letting go passed the phone, so a slip skipped a player | **Letting go only hides**; "Done, pass to Arjun" appears after the first hold |
| R4 | 3 | Phone long-press menus can leak the word | **No text selection, callout, magnifier, context menu or drag** on the pad and word; checked on Android and iPhone |
| R5 | 3 | Screen readers, tap mode, app-switcher thumbnail | Word in a live region on that turn only; earphone note; blank cover when the app is hidden |
| R6 | 3 | The impostor's screen looks different at a glance | **Same five-line block for every role** (line 5 "Also called …" is empty for the impostor); crew also see the category in Easy; arm's-length size |
| R7 | 3 | Game cards on Home would reopen the owner's Home decision (1 October) | **Home stays** "Host a game" / "Join with my ticket"; "Host a game" leads to **"What shall we play?"** (Tambola, Impostor) |
| R8 | 2 | The choices screen overflows small phones | One row per choice, only the chosen option's line shown; landscape 2 × 2 |
| R9 | 2 | 12-player lists can't always avoid scrolling | Lists may scroll inside; main button fixed; outcome line visible |
| R10 | 2 | Room text too small across a table | Starter 56 px, timer 120 px, countdown 200 px; "table view" (upside-down copy) is a play-test question |
| R11 | 2 | Timer end started the vote by itself | "Time's up!" then a tap; nothing auto-advances (guideline 28) |
| R12 | 2 | Two menu items did the same thing | Merged: **"Deal again with a new word"** |
| R13 | 2 | The two-impostor vote is complex | **One impostor only in the first release**; two after the play-test (simplicity first) |
| R14 | 2 | Reordering needed dragging | ▲ ▼ buttons (guideline 21) |
| R15 | 2 | "We know it, skip" duplicated the main button | Replaced by "Practice round first" |
| R16 | 2 | "Everyone has seen" cost a tap every round | Merged with the clues screen |
| R17 | 2 | "Same players?" added a tap | Tonight's names arrive filled in, with "Clear list" |
| R18 | 1 | Countdown voice | Ticks on; voice follows the phone-voice setting (off by default) |
| R19 | 1 | Biryani is non-veg (off by default) | Samosa is the example word |
| R20 | 1 | Tap mode hid after 5 s | 8 s |
Lasting rules from this review are guidelines 45–48 in `docs/ux-guidelines.md`.

## Shared rules
- Tambola's look. One full-width main button at the bottom; quiet outlined actions above it; "··· Menu" top right.
- "← Back" on setup screens only. During a round there is no Back: the menu has what's needed.
- Nothing scrolls during a round, except a list longer than the screen (R9). The screen stays awake from the first
  deal to the round result (guideline 32).

## Screens
### 1. Home and "What shall we play?"
- Home unchanged; the "Host a game" line becomes "Tambola or Impostor on this phone".
- **What shall we play?** Two equal cards: Tambola "Housie on paper or phones · 2 hrs"; Impostor "Find who doesn't
  know the word · 3–20 players · about 4 min a round". Tapping a card moves on (no main button). An unfinished game
  shows above: "Impostor · round 4 · Tap to resume", and in Home's unfinished rows. 5 s.
- **Guest:** the "Join with my ticket" screen ends with "Playing Impostor? It's all on the host's phone. Nothing to
  join, just play along!"

### 2. Who's playing? (seat order)
```
← Back                   ··· Menu
Who's playing?
Sit in a circle. This is the passing and clue order.
 1  Riya            ▲ ▼  ✕
 2  Arjun           ▲ ▼  ✕
 3  Meena           ▲ ▼  ✕
[ Type a name…        ][ Add ]
 Riya S · Kabir · Zoya      (past names, one tap to add)
[            Next            ]
```
- Rows 56 px; ▲ ▼ ✕ each 44 × 44. Enter adds and keeps the keyboard open; names up to 16 characters.
- Duplicate: "Riya is already playing. Add an initial, like Riya S."
- Tonight's names arrive filled in, with a quiet "Clear list".
- "Next" disabled below 3 players, with "Add at least 3 players."
- Between rounds (menu → Players): add at the end, ▲ ▼ to their seat, dealt in next round at 0; ✕ removes at once
  with "Kabir left · Points kept · Undo" ("Kabir left · Undo" when not keeping score). Mid-round: "Change players after
  this round." with "OK".

### 3. How do you want to play?
```
← Back
How do you want to play?
Mode     [ Easy ✓ ][ Hard   ]
 The impostor gets the category and a hint.
Talking  [Free flow✓][ Timer ]
 Talk as long as you like, then tap Vote now.
Score    [ No ✓   ][ Yes    ]
 Just play. We count catches and escapes.
Words  [Whole family✓][+Grown-ups]
 Words kids and grandparents know.
Categories: all 9 ›
[ More options › ][ How to play  ]
[          Start round          ]
```
Other lines: Hard "The impostor gets nothing and never starts." · Timer "Two minutes to talk, then a chime." ·
Yes "Points every round, totals for the game." · + Grown-ups "Adds words kids or elders may not know."
Categories sheet: 9 switches and "Include non-veg food" (off). More options sheet: "Last guess for a caught impostor"
with "Off ✓" / "On" and "A caught impostor can win the round by guessing the word." "More options ›" and "How to
play" share one row. "Same as last time" under the heading when choices were carried over. 10 s.

### 4. How to play (on request only: "How to play" on the choices screen, or the menu)
Heading "How to play", then "Read this aloud": the 4 lines, the mode line, the last-guess line (only when on) and the
rules list, exactly as in IMP-070 and IMP-072 (decided 4 October, F7).
Main "Done"; quiet "Practice round first" only when opened from a new game's choices
screen (a "Practice" chip on every room screen; no points).

### 5. The deal
```
A                          B (not held)               B (held)
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Pass the phone to│   │ RIYA             │   │ Your secret      │
│                  │   │                  │   │ Samosa           │
│     RIYA         │   │ ┌──────────────┐ │   │ Category: Food   │
│                  │   │ │  Hold here   │ │   │ Give one-word    │
│                  │   │ │ to see your  │ │   │ clues. Don't say │
│                  │   │ │    word      │ │   │ it!              │
│ [  I'm Riya   ]  │   │ └──────────────┘ │   │ │  (holding)   │ │
└──────────────────┘   │ Tap instead      │   └──────────────────┘
                       └──────────────────┘
After the first let-go following a hold of at least 0.5 s, B shows, in space reserved from the start (nothing
moves, guideline 45a): [ Done, pass to Arjun ] (main) and the text button "Don't know this word?" under the name,
which asks "New word for everyone?" ("New word" / "Back")
```
- A: name 48 px, shrinking to 32 px to fit. Never the previous word.
- A and B: "Player 2 of 4" (17 px) above "Pass the phone to" and above the name on B; A also "Everyone else, look
  away!" (20 px) under the name (owner, 4 October; IMP-019). No progress line in "See my word again".
- B: full-width hold pad, at least 160 px tall (288 × 160 at 320 px), "Tap instead" under it; while held it reads
  "Let go to hide"; **the word shows above the pad, never under the finger**, on a layer over the top of the screen;
  only while held; letting go hides it at once. The word area is a fixed 2 lines tall for every role. "Done…" appears for every role on the first let-go after a hold of
  at least 0.5 s.
- What each role sees while holding (always five lines; line 5 is "Also called …" or empty, always empty for the
  impostor; exact text in IMP-011):

| Crew, Easy | Impostor, Easy | Crew, Hard | Impostor, Hard |
|---|---|---|---|
| Your secret | Your secret | Your secret | Your secret |
| **Samosa** | **You're the impostor** | **Samosa** | **You're the impostor** |
| Category: Food | Category: Food · Hint: Tea time | Give one-word clues. | Listen and blend in. |
| Give one-word clues. Don't say it! | Listen, blend in, guess the word. (guess off: "Listen and blend in. Don't get caught!") | Don't say it! | Guess the word if caught. (guess off: "Don't get caught!") |
| (Also called … or empty) | (empty) | (Also called … or empty) | (empty) |

- Other names in a small line: "Also called Golgappa / Puchka" (Pani puri); "Also called Payesh" (Kheer / Payasam).
- "Don't know this word?" → "New word for everyone?" → "New word" → "No problem! New word coming." and "Pass the
  phone back to RIYA" with main "I'm Riya"; same place for every role.
- 8–10 s per player.

### 6. Clues (merged with "everyone has seen")
```
✓ Everyone has seen their word.
  Phone in the middle, face up.
      MEENA
      starts
Each say one word about your secret:
Meena → Kabir → Zoya → Riya → Arjun
[ Clues done, talk it over ]   (Timer: [ Clues done, start timer ])
 One more round of clues        (3–5 players only)
```
Starter name 56 px. Landscape: starter name left; order and buttons right.

### 7. Talking
- Free flow: "Talk it over" (56 px), "Who sounded unsure?", main "Vote now".
- Timer: label "Talk it over" (28 px) above the timer, which starts at "2:00", 120 px (112 px at 320 px wide); main
  "Vote now"; quiet "Pause" / "Carry on". At 0:00 the `chime` (no louder than the tick), "Time's up!", main "Get
  ready to point", quiet "1 more minute". It never moves on by itself.

### 8. Countdown
"Get ready to point…" (40 px) 1 s; "3", "2", "1" 200 px (160 px in landscape), 1 s each; "Point!" holds 2 s, then the picker
opens by itself. A tick per number, a ding on "Point!"; voice only if the phone voice is on. Reduce motion: numbers swap without scaling. Screen readers:
each number announced. Interrupted: back to "Get ready to point".

### 9. Who got the most fingers?
Two columns of name buttons (56 px); tapping selects (outline, ✓, tint); main **"Reveal Arjun"**, shown as a disabled
"Reveal" until a name is picked; 24 px below the names, "Not sure?" with the text buttons "It's a tie" and "Count
again". Tie: pick the tied names → main "Point again: Arjun or Meena" →
countdown → only those names plus "Still a tie" (the impostor escapes).

### 10. Result (one screen, owner 4 October)
- Build-up 1.5 s: "Arjun was…", the drumroll sound, no colour change; then everything at once (exact order in
  IMP-033, IMP-034, IMP-038).
- **Caught:** "✓ Caught!" (56 px) · "ARJUN was the impostor" (32 px) · "The word was" "School trip" (44 px) ·
  "Also called Excursion" · chip "School and childhood" (17 px) · "You caught the impostor!".
- **Wrong person:** "✗ Escaped!" · "Meena was not the impostor." · "ARJUN was the impostor" · the word and chip · "Arjun escaped!".
- **Still a tie:** "✗ Escaped!" · "Still a tie." · "ARJUN was the impostor" · the word and chip · "Arjun escaped!"
  (no build-up).
- The screen scrolls as one page; only "Next round" is pinned (guideline 46a). No "Undo" with the last guess off.
- **Last guess for a caught impostor (optional, off by default):** caught → "✓ Caught!" · "ARJUN was the impostor" · "Last chance, Arjun!
  Guess the word out loud. Get it right and you win the round." · main "Arjun guessed. Show the word" → the word,
  chip and two equal buttons "Guessed right" / "Wrong guess" → "You caught the impostor!" / "Arjun wins the round!" (IMP-039).

### 11. Round result (on the same screen)
Outcome: "You caught the impostor!" / "Arjun wins the round!" / "Arjun escaped!". Without scores: "This game: impostor caught 3
· escaped 2". With scores: this round's points, then the game's scoreboard (36 px rows, highest first, ties share a
place (1-2-2-4), leavers greyed; one column up to 360 px wide, two columns of 50% from 390 px; caption "Scores since round 4"). Main "Next round"; quiet "Undo" (the guess verdict
only, last-chance guess on) and "This word didn't work". Bottom row: outlined "End game" beside main "Next round"
(stacked at 320 px); "← Home" top left keeps the game to resume (IMP-077).

### 12. End of the game
"That's the game!", the lead line ("Arjun wins the game with 2 points!", or "Impostor caught 4 · escaped 3"), up to 2 fun
lines, the final scoreboard. Main "Play again"; quiet "Play something else", "Home", "More ›" ("Oops, keep playing",
Share, History, then after a divider "Discard this game"). Scrolls as one page. "End game" between rounds opens it at
once; mid-round (menu "End game"): "End now? This round won't count." ("End now" / "Keep playing"); "Discard this
game? Its rounds and scores will be lost." ("Discard" / "Keep it").

### 13. Menu (destructive items last)
| Moment | Items |
|---|---|
| Deal | How to play · Players · Deal again with a new word · Settings · End game |
| Clues, talk, vote | How to play · Players · See my word again · Deal again with a new word · Settings · End game |
| Between rounds | How to play · Players · Change how we play · Settings · History ("End game" is a button, IMP-077) |
No menu on the countdown or during the reveal. "Deal again with a new word" confirms: "Deal again? This round won't count. For when someone said the word or saw a
screen." ("Deal again" / "Keep playing").

### 14. Interruptions
Deal: "Welcome back. Pass the phone to ARJUN" (the player who hasn't tapped Done), never a word. Clues or talk: same
screen, timer "Paused · Tap to carry on". Countdown: back to "Get ready to point". After "Reveal": the result without
the build-up. Over 3 hours: "This round was left halfway. Start a fresh round?" Storage gone: "Start a new game".

## Privacy on a passed phone (guideline 45)
- The word is in the page **only while held**: not hidden text, not the title, not History. It hides on lift, on
  finger cancel, on scroll or zoom, and when the page is hidden; a blank cover is drawn so the app-switcher thumbnail
  shows nothing (check on the owner's Android phone).
- Tap mode: "Tap to see your word" / "Tap to hide", auto-hide after 8 s, then "Done". Anyone can choose "Tap instead".
- No text selection, callout, magnifier, context menu or drag on the pad and word.
- A web app can't block screenshots; held-only display is the protection.
- Screen readers: the pad is a button "Hold here to see your word"; the word goes to a live region for that turn only.
  Tap-mode note: "Your screen reader will say the word out loud. Use earphones or turn the volume down."
- No role tells: same background, block shape, 10 ms vibration on press for everyone, no sound on reveal, "Done" at
  the same moment; the word 36 px (30 px floor with Larger text or long words), for one reader at arm's length.

## Layout by size (predicted)
| Screen | 320 × 568 | 360 × 640 | 390 × 844 | 812 × 375 | Larger text |
|---|---|---|---|---|---|
| Deal | Fits; pad 288 × 160 | Fits; pad 328 × 160 | Fits; pad 358 × 160 | Word left, pad 374 × 160 and Done right | Fits (IMP-010 arithmetic) |
| Longest word (31 characters) | 2 lines, 30–36 px | 2 lines | 2 lines | 2 lines | 30 px floor |
| Choices | One-row form only | Fits | Fits | 2 × 2 grid, button right (17b) | Scrolls, button fixed (setup) |
| Who got the most fingers? (12) | 2 columns; scrolls inside with Larger text | 2 columns | 2 columns, no scroll (names ≤ 8 characters) | 2 columns, scrolls inside | Inside scroll |
| Result and scoreboard (12) | 1 column, page scrolls | 1 column, page scrolls | 2 columns, no scroll (IMP-033 arithmetic) | Outcome left, scoreboard right, page scrolls | Page scrolls |
Names up to 16 characters shrink to 32 px on room screens and wrap to 2 lines in two-column lists.

## Tone (Indian English, plain)
Use: "✓ Caught!", "Arjun wins the round!", "Arjun escaped!", "Meena was not the impostor.", "You caught the impostor!",
"No problem! New word coming." Never: liar, loser, fooled, "bad clue", anything about
a player's intelligence.

## To check on the first build (state grid)
Each screen × first use, 3 and 12 players, 16-character names, Larger text, tap mode, screen reader, resumed, hidden 10
minutes, 3 hours later, storage lost, practice round. First: the deal in tap mode with a screen reader; the reveal
after a resume; the picker with 12 players at 320 × 568 with Larger text.

## Play-test questions (paper or first build)
Readable across the table (56 px name, 120 px timer)? Does the far side need the upside-down "table view"? Does anyone
notice how long the impostor holds the phone? Do fingers slip, and is "Done" obvious? Does the room point in sync on
ticks alone? Do kids get "Show the word" before judging? Is 2 minutes too long?

## Review of the first build (UX designer, 4 October 2026) and product owner decisions
Live preview, 390 × 844, 360 × 640, 320 × 568, 812 × 375; Easy/Hard, Free flow/Timer, scores on/off, 4 and 12 players.
Strengths kept: 44 px+ targets, fixed main button, 3 taps to the first deal, the secret only in the page while held,
pick-then-reveal, room sizes for starter/timer/countdown.

| # | Sev | Finding (measured unless noted) | Decided (goes into scenarios v3.3) |
|---|---|---|---|
| F1 | 3 | Result and summary overflow: text cut off at the top at 320 × 568, scoreboard second column off-screen, scores under the buttons, scroll areas inside scroll areas; landscape shows 2 of 4 rows | Result and summary scroll **as one page** with only the main button pinned; no inner scroll areas; scoreboard one column at widths ≤ 360 px, two columns (50% each) from 390 px; landscape: outcome left, scoreboard right |
| F2 | 3 | Reveal too small for the room (28 px, word 20 px) | Result: "✓ Caught!" / "✗ Escaped!" 56 px centred; "ARJUN was the impostor" 32 px; the word 44 px; category chip 17 px outlined below it; "Get ready to point…" 40 px |
| F3 | 3 | "Don't know this word?" appears where "Tap instead" was after the layout jumps; one tap re-deals for everyone | Nothing on screen B moves after the first hold (space reserved); "Don't know this word?" becomes a small text button under the name; it asks "New word for everyone?" with "New word" / "Back" (main) |
| F4 | 2 | Hold pad 112 × 96 at 320 px; shrinks in landscape | Full-width pad at every size, at least 160 px tall (288 × 160 at 320 px); "Tap instead" below it; while held the pad reads "Let go to hide" for every role |
| F5 | 2 | Landscape clues screen hides the clockwise order | Landscape: starter name 56 px left; order and buttons right |
| F6 | 2 | Clue wording (judgement) | "Each say one word about your secret:" then "Arjun → Meena → Kabir → Riya"; main "Clues done, talk it over"; quiet "One more round of clues" |
| F7 | 2 | How-to-play text wrong in Hard mode and with the guess off | The card's text follows the current settings (Hard: "The impostor sees nothing and never starts"; guess line only when the setting is on); lines per the designer |
| F8 | 2 | "It's a tie" / "Count again" look like names, too close | 24 px gap, label "Not sure?" above, text-style 48 px buttons |
| F9 | 2 | Summary repeats itself, no winner line, five equal buttons | Lead line "Arjun wins the night with 2 points!" (no scores: "Impostor caught 4 · escaped 3"); drop "Rounds played"; quiet "Oops, keep playing" and "Play something else"; "More ›" holds Share, History and, last after a divider, "Discard this evening" |
| F10 | 1 | Timer | Label "Talk it over" 28 px above the timer; "Time's up!" adds quiet "1 more minute" |
| F11 | 2 | "You're the impostor" wraps taller than a word at 320 px (predicted) | The word area has a fixed 2-line height, centred, for every role |
| F12 | 1 | Polish | Category switches deep blue, not the main red (17a); screen-reader note only when "Tap to show" is on; History date once; "3–20" never breaks; "Whole family" fits in 48 px; "Same as last time" line on the choices screen when choices were carried over; "Scores since round 2" |
Also: with the last guess off the result has no "Undo" (a reveal can't be undone); "Player 2 of 4" 17 px above "Pass the
phone to" and on the hold screen; "Everyone else, look away!" 20 px; the setting reads "Last guess for a caught
impostor" with Off ✓ / On and "A caught impostor can win the round by guessing the word." New guidelines 45a and 46a.
Not now: the upside-down "table view".

## Re-check of round 4 (UX designer, 4 October 2026, live preview)
F1, F3–F9, F11, F12 done; F2 partly (the one must-fix below); F10's "1 more minute" not tried live. The new round end,
how to play on request and the pass-the-phone touches are built as scenarios v3.5 say.
| # | Sev | Finding | Label | Decided |
|---|---|---|---|---|
| N1 | 3 | "✗ Escaped!" breaks onto two lines at 320 px (headline stays 56 px) | **Must fix before release** | 44 px below 360 px wide, one line (IMP-073, decision I23) |
| N2 | 2 | Two-column scoreboard: a total sits next to the other column's rank ("Riya 1 1 Chandrasekharan 1") | Next list | 24 px gap with a thin divider; rank as a muted 15 px "1." |
| N3 | 2 | Long one-word names break mid-word ("VENKATARAGHAV / AN") | Next list | Break lines only at spaces; a one-word name too wide shrinks to fit one line (starter floor 24 px, list floor 15 px) |
| N4 | 1 | Many players sharing the top score make a wall of names | Next list | More than 3 sharing: "11 players share the game with 1 point!"; round points "+1 each to the other players (11)" |
| N5 | 1 | "Whose word?" with 12 players hides Cancel at 360 × 640 | Next list | Cancel pinned at the bottom; only names scroll |
| N6 | 1 | Hold-screen name 2 px past its box at 360 × 640 | Next list | Keep shrinking until it fits |

## Owner's play, 4 October: how do I stop? (product owner decision)
The owner found that the round result offers only "Next round"; ending is hidden in the menu as "End the evening", there
is no Home between rounds, and "evening" clashes with the app's "session". Missed by both reviews because they checked
the screens against the spec (which put ending in the menu) instead of asking what a player wants next. Fixed in the
process: playbook pass 12a ("What next?") and guideline 47a.
| Where | Decided |
|---|---|
| Round result | Main "Next round"; visible outlined "End game" beside it (same row at widths ≥ 360 px, above it at 320 px); "← Home" at top left |
| Between rounds | "← Home" keeps the game saved; Home and "What shall we play?" show "Impostor · round 4 · Tap to resume" |
| Words on screen | Only "game" in Impostor: "End game", "That's the game!", "Discard this game", "This game: impostor caught 3 · escaped 2", "Start a new game? The game from 8:40 pm will be ended." No "evening", "night" or "session" on any Impostor screen; the session stays behind the scenes (History groups tonight's games) |
| End screen | "That's the game!", winner line, fun lines; main "Play again" (same players and choices, a new game); quiet "Play something else" and "Home"; "More ›" holds Oops, Share, History and, last, "Discard this game" |
