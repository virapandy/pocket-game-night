# Impostor: detailed UX (3 October 2026)

**Binding details are in scenarios.md; where this file differs, scenarios.md wins.**

Screen specification by the **UX designer**, reviewed and decided by the **product owner**, before any build.
Sizes for Impostor are **predicted** from Tambola's measured layout (390 × 844: main button 358 × 60, solid red,
16 px gutters, 17 px body, outlined 48 px quiet buttons, "← Back" top left, "··· Menu" top right) and must be
measured on the first build. Rules: `guide.md`. Stages: `lifecycle.md`. Scenarios: `scenarios.md`.

## Product owner decisions on the designer's findings
| ID | Sev | Finding | Decided |
|---|---|---|---|
| R1 | 4 | The word was shown before the last guess | **Hide the word until the guess is said aloud**; then "Show the word" and the room judges |
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
[          Start round          ]
```
Other lines: Hard "The impostor gets nothing and never starts." · Timer "Two minutes to talk, then a chime." ·
Yes "Points every round, totals for the night." · + Grown-ups "Adds words kids or elders may not know."
Categories sheet: 9 switches and "Include non-veg food" (off). 10 s.

### 4. Read this aloud (first Impostor evening of tonight's session, once)
1. "Everyone gets the same secret word, except the impostor."
2. "Take turns to say one word about it. Don't say the word!"
3. "Then talk, and all point at who you think the impostor is."
4. "Impostor: blend in. Caught? Guess the word to steal the round."
Main "Start the deal"; quiet "Practice round first" (a "Practice" chip on every room screen; no points).

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
After the first let-go following a hold of at least 0.5 s, B adds: [ Done, pass to Arjun ] (main) and the quiet
"Don't know this word?"
```
- A: name 48 px, shrinking to 32 px to fit. Never the previous word.
- B: hold pad at least 200 × 160 px in the lower half; **the word shows above the pad, never under the finger**;
  only while held; letting go hides it at once. "Done…" appears for every role on the first let-go after a hold of
  at least 0.5 s.
- What each role sees while holding (always five lines; line 5 is "Also called …" or empty, always empty for the
  impostor; exact text in IMP-011):

| Crew, Easy | Impostor, Easy | Crew, Hard | Impostor, Hard |
|---|---|---|---|
| Your secret | Your secret | Your secret | Your secret |
| **Samosa** | **You're the impostor** | **Samosa** | **You're the impostor** |
| Category: Food | Category: Food · Hint: Tea time | Give one-word clues. | Listen and blend in. |
| Give one-word clues. Don't say it! | Listen, blend in, guess the word. | Don't say it! | Guess the word if caught. |
| (Also called … or empty) | (empty) | (Also called … or empty) | (empty) |

- Other names in a small line: "Also called Golgappa / Puchka" (Pani puri); "Also called Payesh" (Kheer / Payasam).
- "Don't know this word?" → "No problem! New word coming." and "Pass the phone back to RIYA" with main "I'm Riya";
  same place for every role.
- 8–10 s per player.

### 6. Clues (merged with "everyone has seen")
```
✓ Everyone has seen their word.
  Phone in the middle, face up.
      MEENA
      starts
then clockwise: Meena → Kabir → Zoya → Riya → Arjun
[ Talk it over ]   (Timer: [ Start the 2-minute timer ])
 Another round of clues        (3–5 players only)
```
Starter name at least 56 px.

### 7. Talking
- Free flow: "Talk it over" (56 px), "Who sounded unsure?", main "Vote now".
- Timer: starts at "2:00", 120 px (112 px at 320 px wide); main "Vote now"; quiet "Pause" / "Carry on". At 0:00 the
  `chime` (no louder than the tick), "Time's up!", main "Get ready to point". It never moves on by itself.

### 8. Countdown
"Get ready to point…" 1 s; "3", "2", "1" 200 px (160 px in landscape), 1 s each; "Point!" holds 2 s, then the picker
opens by itself. A tick per number, a ding on "Point!"; voice only if the phone voice is on. Reduce motion: numbers swap without scaling. Screen readers:
each number announced. Interrupted: back to "Get ready to point".

### 9. Who got the most fingers?
Two columns of name buttons (56 px); tapping selects (outline, ✓, tint); main **"Reveal Arjun"**, shown as a disabled
"Reveal" until a name is picked; quiet "It's a tie" and "Count again". Tie: pick the tied names → main "Point again: Arjun or Meena" →
countdown → only those names plus "Still a tie" (the impostor escapes).

### 10. Reveal and last guess
- Build-up 2.5 s: "Arjun was" and three dots appearing one every 0.6 s, the drumroll sound, no colour change (reduce
  motion: the same, with no animation). Lines then appear 1.5 s apart and all stay (timings in IMP-033, IMP-034,
  IMP-038).
- **Caught:** "Caught red-handed! ARJUN was the impostor." → "Arjun, one guess. Say it out loud! (No repeating the
  clues.)" → main **"Show the word"** → the word, its other names, and two equal buttons "Guessed right" / "Wrong
  guess" (equal, neither is the main look). Other names count as right.
- **Escaped:** "Meena was crew!" → "The impostor was ARJUN. Escaped!" → "The word was Samosa."
- **Still a tie:** "Still a tie! The impostor was ARJUN. Escaped!" → "The word was Samosa." (no build-up).

### 11. Round result
Outcome: "The crew wins!" / "Arjun steals the round!" / "Arjun escaped!". Without scores: "Tonight: impostor caught 3
· escaped 2". With scores: this round's points, then the night's scoreboard (36 px rows, highest first, ties share a
place (1-2-2-4), leavers greyed; two columns from 7 players). Main "Next round"; quiet "Undo" (the guess verdict
only) and "This word didn't work".

### 12. End of the evening
"That's the night!", up to 3 true fun lines, the final scoreboard or "7 rounds · impostor caught 4 · escaped 3".
Main "Back to Home"; quiet, in order: "Oops, keep playing", "Play something else", "Share", "History", "Discard this
evening". Confirmations: "End the evening?" ("End the evening" / "Keep playing"); mid-round "End now? This round
won't count." ("End now" / "Keep playing"); "Discard this evening? Its rounds and scores will be lost." ("Discard" /
"Keep it").

### 13. Menu (destructive items last)
| Moment | Items |
|---|---|
| Deal | Rules · Players · Deal again with a new word · Settings · End the evening |
| Clues, talk, vote | Rules · Players · See my word again · Deal again with a new word · Settings · End the evening |
| Between rounds | Rules · Players · Change how we play · Settings · History · End the evening |
No menu on the countdown or during the reveal. "Deal again with a new word" confirms: "Deal again? This round won't count. For when someone said the word or saw a
screen." ("Deal again" / "Keep playing").

### 14. Interruptions
Deal: "Welcome back. Pass the phone to ARJUN" (the player who hasn't tapped Done), never a word. Clues or talk: same
screen, timer "Paused · Tap to carry on". Countdown: back to "Get ready to point". After "Reveal": the outcome without
the build-up. Over 3 hours: "This round was left halfway. Start a fresh round?" Storage gone: "Start a new evening".

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
| Deal | Fits; pad 120 px | Fits | Fits | Word left, pad and Done right | Word wraps to 3 lines |
| Longest word (33 characters) | At most 3 lines, 30–36 px | At most 3 lines | At most 3 lines | At most 3 lines | 30 px floor |
| Choices | One-row form only | Fits | Fits | 2 × 2 grid, button right (17b) | Scrolls, button fixed (setup) |
| Who got the most fingers? (12) | 2 columns; scrolls inside with Larger text | 2 columns | 2 columns, no scroll (names ≤ 8 characters) | 2 columns, scrolls inside | Inside scroll |
| Scoreboard (12) | 2 columns, scrolls inside | 2 columns, scrolls inside | 2 columns, no scroll (names ≤ 8 characters) | 2 columns, scrolls inside | Inside scroll |
Names up to 16 characters shrink to 32 px on room screens and wrap to 2 lines in two-column lists.

## Tone (Indian English, plain)
Use: "Caught red-handed!", "Arjun steals the round!", "Arjun escaped!", "Meena was crew!", "The crew wins!",
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
