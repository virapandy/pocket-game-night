# What Am I?: screen map (draft 4, product owner, 23 October 2026)

**Status: draft 4.2** (23 October: scenarios Version 1.2 applied: "End Riya's turn now", "player 1 of 6", the Join line, two-player dialog, sound and Do Not Disturb tips, new paths). Before that, draft 4.1 (23 October: T1 loses "Players (6) ›", which stays on R1 and in the menu, after the second Jev read and three prototype walks agreed T1 is crowded; section K4 gives the prototype renderer exact states). Every change from the critic pass, the six persona walks, the word guidelines check, the first Jev
check and the owner's hold choices (drafts 2–3, sections J–O) is now written into the screens themselves; section H lists
where each came from. Stage 1 of `docs/proposals/design-before-code.md` (step 1b of `docs/new-game-process.md`). Drawn from
`guide.md`, `fit-and-stories.md`, `words.md` and the What Am I? decisions in `docs/decisions.md` (WA1–WA10 and the 23 October
rows). No scenarios exist yet, so the IDs column names the future scenario file (`WAI-01 setup` … `WAI-10 lifecycle`;
WAI-08 is not used). Where a later `scenarios.md` differs from this map, the scenarios win. This is the map the prototype
renderer and the Jev screen read use.

**How to read it.** One table per screen: what is on it (*Words*), then one row per button or gesture: where it leads and
what it records. *Intentions* says which of the common next wishes are visible without opening a menu (**stop** ·
**home** · **back** · **help** · **undo** · **pause**); "(menu)" means only through "··· Menu". Sizes: every screen works at
320 × 568, 360 × 640, 390 × 844, 812 × 375 and 568 × 320 unless its *Sizes* line says otherwise. Example names are in K1.

**Rules that apply to every screen:**
- *Visible tap guards:* every main button appears greyed for 800 ms after its screen appears (1 s on "I'm Riya: start" and
  "Start Riya's turn") and then comes alive; a tap during a guard is dropped, never carried to the next screen. Quiet buttons
  are not guarded (same look as Secret Words and Mafia).
- *The guesser can't see the word screen.* Every mark during a turn is confirmed by **sound and a buzz** (WA10), never by
  text alone. Android buzzes; iPhone browsers can't, so sound carries it there.
- *Pause:* a "Pause" button (icon and word) on every screen during a game opens D1. On the word screen it is at least 48 px,
  in the top corner the room sees, outside the Got it / Pass areas. The phone's Back gesture pauses during a turn; hiding the
  app (call, lock, switching app) pauses too.
- *Screen stays awake* from T2 to T4.
- *Where-line:* "Round 2 · Arjun's turn next" / "Round 2 · Arjun guessing, 34 s left" / "Game over, game 1", under "Welcome
  back." after a hide or reload, on the Pause cover and on Home's resume row.
- *One word per idea:* a **turn** is one player's 30–90 s; a **round** is everyone once; a **game** runs from Start to "End
  the game"; **tonight** is the game night. A word on screen is a **word**, never a "card" or "clue". "Tilt" never appears on
  screen: the screens say "move the phone down / up" (owner, 23 October). Plurals counted: "1 word", "2 turns".
- *Menu*, in this order where an item applies: How to play · Players · Words and time · Pause · Home (game saved) · End the
  game · End for tonight · Settings · History. Settings holds "Answer by moving the phone" (on/off).

## A. Home and the picker (shared with other games)

### A1. Home (changes for What Am I? only)
*Words:* "Host a game" lists What Am I? among the games; unfinished row in two lines "What Am I? · Round 2 · Arjun's turn" /
"Riya, Arjun +4 · 8:05 pm · Tap to resume".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| "What Am I? · Round 2 · Arjun's turn" (the unfinished row) | the game's last screen exactly as left (T1, T4, R1 or G1), with "Welcome back." and the where-line; a turn in progress resumes on D1 Paused | — | WAI-10 |

### A2. What shall we play? (new card)
*Words:* card "What Am I?" · "Phone on your forehead, the room gives clues · One phone, passed round · 2–20 players".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| What Am I? card, nothing unfinished | S1 Who's playing? | — | WAI-01 |
| What Am I? card, a game night unfinished | A3 Start new dialog (shared) | — | WAI-10 |

## B. Setup (host phone)

### S1. Who's playing?
*Words:* heading "Who's playing?"; tonight's names already in the list; input "Player name" + "Add"; per name "✕" and a
drag handle; line "Players take turns in this order. Drag a name to move it."; counter "6 players"; under 2: "What Am I?
needs at least 2 players." (main disabled); over 20: "Up to 20 players." (Add disabled); quiet "How to play"; quiet
"← Back"; main "Next". *Intentions:* back, help.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Add / Enter | name added, input cleared (every Enter adds, however fast); same name: "Riya is already playing. Add an initial, like Riya S." | — | WAI-01 |
| ✕ | name removed, toast "Kabir removed · Undo" | — | WAI-01 |
| drag handle "Move Riya" | turn order changes | — | WAI-01 |
| How to play | S4 → Done → back here | — | WAI-09 |
| ← Back | A2 picker | — | WAI-01 |
| Next | S2 Words and time | — | WAI-01 |

### S2. Words and time
*Words:* heading "Words and time".
"Which words?" (one choice, tick on the chosen one): **Mix of all · 743 words** with "Words from every pack." (ticked at
first) · Animals · 93 words · Food · 89 words · Around the house · 100 words · Jobs · 96 words · Sports and cricket · 95 words ·
Festivals and places · 96 words · Act it out · 100 words · Famous Indians · 76 words (counts leave out non-veg words while
that switch is off; Food 99 and Mix 753 with it on).
"Time for each turn": 30 s · **60 s** · 90 s with "30 s for small kids, 90 s for grandparents".
"How to hold the phone": **In the guesser's hand** with "Forehead or chest; the guesser moves it to answer." ·
**Hands-free** with "The phone stands behind the guesser; one clue giver taps to answer. Good for grandparents and small
children." (the last choice is kept on this phone).
Switch "Include non-veg food (chicken, fish, egg)" **off** (WA9). Switch "Sounds" **on** with "So the guesser knows a word
counted."; when off: "The guesser won't know a word counted." (WA10).
Line above the main button: "Ready as it is, or change anything above."; quiet "How to play"; quiet "← Back"; main
**"Start with these words"** (from R1's "Change players or words": **"Carry on playing"**, scores kept).
*Intentions:* back, help.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| each option: "Mix of all · 743 words" … "Famous Indians · 76 words"; "30 s" · "60 s" · "90 s"; "In the guesser's hand" · "Hands-free"; the two switches | choice shown selected (✓) | setup | WAI-01, 03 |
| How to play | S4 → back | — | WAI-09 |
| ← Back | S1 (names kept) | — | WAI-01 |
| Start with these words | S3 Read this aloud (first What Am I? game tonight) or T1 for the first player | `start` (word order from the word seed) | WAI-01 |
| Carry on playing (from R1) | T1 for the next player, scores kept | setup | WAI-05 |

### S3. Read this aloud (first game of the night)
*Words:* "Read this aloud:"; card "One of us holds the phone on their forehead or chest, screen to the room. Everyone else
gives clues: talk, act, make the noise, but never say the word. Got it? Move the phone down. Stuck? Move it up to pass.
Passing is free. Marked wrong? Fix it when time's up. You have 60 seconds. Play as many rounds as you like; tap End the
game to see who got the most." (the time is the one chosen; in hands-free the second and third sentences become "The phone
stands behind the guesser. One clue giver taps the bottom for Got it, the top to pass."); quiet "← Back"; quiet "How to
play"; main "First turn".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| First turn | T1 for the first player | — | WAI-01 |
| ← Back | S2 | — | WAI-01 |
| How to play | S4 → back | — | WAI-09 |

### S4. How to play (setup screens, menu)
*Words:* the guide's "How to play" steps in short lines, with drawings of the phone held on a forehead, on a chest, and
standing behind a player; "Done".
| Tap | Leads to | IDs |
|---|---|---|
| Done | the screen it was opened from | WAI-09 |

## C. A turn

### T1. Pass screen ("Riya, you're guessing")
*Words, in the guesser's hand:* "Riya, you're guessing"; "Hold the phone on your forehead or chest, screen facing the
room."; the drawing; rule line "Phone down: Got it · Phone up: Pass" (taps only: "Tap bottom: Got it · Tap top: Pass");
score line "Round 1 · player 1 of 6"; at most one tip line, in this order: "Joining this round: Zoya" · "Only 8 new Animals
words left. After that, words come from Mix of all." · "All words used tonight. Words from earlier games come back, oldest
first." · a phone tip on this phone's first turn only ("Turn your ringer on so you hear each word count." on iPhone /
"Screen not turning? Turn off rotation lock." / "Keep your screen on during the turn."); quiet "Someone else goes first";
quiet "Hands-free for Riya"; quiet "← Home (game saved)"; Pause; "··· Menu"; main **"I'm Riya:
start"**.
*Words, hands-free:* "Riya, you're guessing"; "Stand the phone behind Riya, facing the room. Riya, don't turn round!";
drawing of a phone leaning on a cushion or glass behind a seated player; rule line "One clue giver taps: bottom half Got it
· top half Pass"; score line and tip line as above; "Hands-free (Riya's choice)" when it is her choice in a hand-mode game;
quiet "Riya will hold it"; quiet "Someone else goes first"; quiet "← Home (game saved)"; Pause;
"··· Menu"; main **"Start Riya's turn"**.
*Intentions:* pause, home, change (visible); help, stop (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| I'm Riya: start | T0 (first turn on this phone, where the phone asks for motion) or T2 | — | WAI-02 |
| Start Riya's turn (hands-free) | T2 (T0 never shown) | — | WAI-02 |
| Someone else goes first | D2 Players, pick who goes now; Riya goes next | `reorder` | WAI-06 |
| Hands-free for Riya / Riya will hold it | T1 in the other way, kept for Riya for the rest of the game | setup | WAI-02 |
| ← Home (game saved) | A1 | — | WAI-10 |
| Pause / ··· Menu | D1 / menu | — | WAI-06 |

### T0. Answer by moving the phone? (once per phone, only where the phone asks for motion permission)
*Words:* heading "Answer by moving the phone?"; drawing of the phone moving down and up; "Move the phone down for Got it, up
for Pass. Your phone will ask once."; quiet "Use taps instead"; main **"Yes, move the phone"**.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Yes, move the phone | the phone's own permission prompt → T2 (refused: T2 with taps only, toast "Tap bottom: Got it · Tap top: Pass") | setting | WAI-02 |
| Use taps instead | T2 with taps only (Settings "Answer by moving the phone" turns it back on) | setting | WAI-02 |

### T2. Get ready (countdown)
*Words:* big "3", "2", "1" with a beep each (sounds on); "Put it on your forehead or chest!" (hands-free: "Riya, don't turn
round!"); Pause. The clock has not started. Sizes: designed for 812 × 375 and 568 × 320; upright it still shows.
| Event | Leads to | Records | IDs |
|---|---|---|---|
| countdown ends | T3 with a word; clock starts | — | WAI-02 |
| Pause | D1 | — | WAI-06 |

### T3. The word (room-facing)
*Words:* small top line for the room "Give clues. Don't say the word!" (hands-free: "Clue givers: tap bottom for Got it, top
for Pass."); the word as large as fits on one or two lines (readable from 3 metres); small pack name ("Animals"); time
left "0:34"; Pause button in the top corner. Sizes: designed for 812 × 375 and 568 × 320 (sideways); upright works; with
rotation lock on, the word is drawn turned to fit a sideways phone.
| Gesture | Leads to | Records | IDs |
|---|---|---|---|
| phone moved down (screen towards the floor), or a tap on the bottom half | green flash "Got it!" (0.6 s) + ding + short buzz → next word | `got` | WAI-02 |
| phone moved up, or a tap on the top half | orange flash "Pass" (0.6 s) + low tone + double buzz → next word | `pass` | WAI-02 |
| a mark within 0.8 s of a new word; a move before the phone has come back level since the last mark; a tap within 15% of the short edges or on the Pause button | ignored | — | WAI-02 |
| hands-free: any phone movement (a bump, a slide) | ignored; only taps mark | — | WAI-02 |
| 10 s left | three quick ticks, then ticking to the end | — | WAI-02 |
| time up | long buzz + "Time's up!" sound → T4; the word on screen counts as passed | `timeUp` | WAI-02 |
| Pause, phone's Back, or the app hidden (laying the phone flat is not a pause: it would mark Pass first; scenarios R1) | D1 Paused; clock stopped; word hidden | `pause` | WAI-06 |
| pack runs out | words continue from Mix of all without stopping | — | WAI-03 |

### T4. Time's up (end of turn)
*Words:* "Time's up! Riya got 5"; two lists: **Got it** (green) "Tiger · Owl · Camel · Duck · Bat" and **Passed** (grey)
"Penguin · Zebra"; a word moved shows ↺ ("Owl ↺"); line "Marked wrong? Tap a word to move it."; line "Next: Arjun"; Pause;
quiet "← Home (game saved)"; "··· Menu"; main **"Save score"**. Upright layout.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| a word | moves to the other list with ↺; count updates ("Riya got 4") | `fix` | WAI-04 |
| Save score | T1 for the next player, or R1 when everyone has had a turn this round; toast "Riya: 5 saved · Undo" stays until the next start | `scoreTurn` | WAI-04 |
| Undo (toast) | T4 for Riya, reopened | undo of `scoreTurn` | WAI-04 |
| ← Home (game saved) | A1 | — | WAI-10 |

## D. Between rounds

### R1. Round over
*Words:* "Round 1 done"; scoreboard, highest first, with turns played: "Arjun 7 (1 turn) · Dev 6 · Riya 5 · Meena 5 · …";
line "Words nobody got: Penguin, Zebra"; small line "Play as many rounds as you like; tap End the game to see who got the
most."; quiet "Players (6) ›"; quiet "Change players or words"; quiet "End the game"; quiet "← Home (game saved)"; main
"Round 2". *Intentions:* stop, home, change (visible); help (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Round 2 | T1 for the first player in the list | — | WAI-05 |
| Players (6) › | D2 | — | WAI-06 |
| Change players or words | S1 ("← Back to the game") → S2 → "Carry on playing" (scores kept) | setup | WAI-05 |
| End the game | D5 | — | WAI-07 |
| ← Home (game saved) | A1 | — | WAI-10 |

## E. Dialogs during a game
| # | Dialog | Words | Buttons → where | Records | IDs |
|---|---|---|---|---|---|
| D1 | Paused (cover) | "Paused"; the where-line; "The word is hidden. Tap Carry on playing when you're ready." | **Carry on playing** → T1 or T4 (paused there), or T2 countdown again then T3 with a **new** word (the hidden one goes back unused) and the time left · quiet "End Riya's turn now" → D7 · quiet "← Home (game saved)" → A1 | `resume` | WAI-06 |
| D2 | Players | top line "Add a name to join. New players go after the last player in this round."; names with "✕" and drag handles; add row | Done → back; ✕ → D3; from "Someone else goes first", tap a name → T1 for them | `addPlayer`, `reorder` | WAI-06 |
| D3 | Kabir has to leave? | "Kabir's points stay on tonight's scoreboard." If only 1 would be left: "2 players needed. Add someone, or end the game." | Kabir leaves → back, toast "Kabir left · Undo" (10 s); if Kabir was on T1, T1 moves to the next player · **Don't remove Kabir** → D2 · (1 left) Add a player → D2 · End the game → D5 | `leave` | WAI-06 |
| D4 | Words and time (menu, between turns only) | S2's choices; mid-turn the item is greyed with "After this turn" | Done → back (applies from the next turn) | setup | WAI-03 |
| D5 | End the game? | "Shows this game's winner. You can play again with the same people." | End the game → G1, toast "Game ended · Undo" (10 s) · **Keep playing** → back | `endGame` | WAI-07 |
| D6 | End for tonight? | "Shows tonight's summary. Every score is kept in History." | End for tonight → G2 · **Keep playing** → back | — | WAI-07 |
| D7 | End Riya's turn now? | "Riya's turn ends now. Words marked so far still count." | End Riya's turn now → T4 "Turn ended early. Riya got 2" with what was marked · **Carry on playing** → D1 | `skip` | WAI-06 |

## F. After a game, after the night

### G1. Game over
*Words:* "Arjun wins with 14!" / tie "Arjun and Meena share the win with 12!"; scoreboard with turns played ("Arjun 14 (2
turns) · Zoya 6 (1 turn)"); fun lines "Best turn: Meena, 8 words" · "Words nobody got: Penguin, Zebra, Kangaroo";
"Tonight: Arjun 1 win"; quiet "Change players or words"; quiet "End for tonight"; quiet "← Home"; main "Play again".
*Intentions:* stop, home, play on, change (visible).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Play again | T1 for the first player, scores at 0, same words, time and hold, no word from tonight repeated | `start` | WAI-07 |
| Change players or words | S1 → S2 → "Start with these words" (no read-aloud) | `start` | WAI-07 |
| End for tonight | D6 → G2 | — | WAI-07 |
| ← Home | A1 | — | WAI-10 |
| Undo (toast after End the game) | the screen it came from | nothing | WAI-07 |

### G2. Summary "Tonight's What Am I?"
*Words:* "6 players · 2 games · 148 words got"; "Wins: Arjun 1 · Meena 1"; "Best guesser tonight: Meena (31 words)"; quiet
"Oops, keep playing"; quiet "← Home"; main "Play something else". Menu: only "Delete tonight's games".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Oops, keep playing | where the host came from | nothing | WAI-07 |
| ← Home / Play something else | A1 / A2 (tonight's names kept; `endEvening` was recorded at D6) | — | WAI-07 |

## G. The paths (the finite list for the coverage map)
```
A1→A2  A1→(resume)T1|D1(over T2/T3)|T4|R1|G1   A2→S1  A2→A3
S1→S2  S1→S4→S1  S1→A2      S2→S3|T1  S2→S1  S2→S4→S2      S3→T1  S3→S2  S3→S4→S3
T1→T0→T2  T1→T2  T1(hands-free)→T2  T1→T1(hands-free|hold it)  T1→D2→T1  T1→D1→T1  T1→A1  T1→menu…
T2→T3  T2→D1→T2
T3→T3(got|pass|ignored)  T3→T4(time up)  T3→D1→T2→T3(new word)  T3→D1→D7→T4  T3→D1→A1
T4→T4(fix)  T4→T1  T4→R1  T4→(undo)T4  T4→A1
R1→T1  R1→D2→R1  R1→S1→S2→T1  R1→S1→R1(back to the game)  R1→D5→G1  R1→A1
menu→Settings→same  menu→History→same  G2→menu→Delete tonight's games  D3(2 left)→D2(add)|D2(don't remove)|D5
D2(who goes now)→T1(kept first)  G1→(undo)D1|T4  any dialog→Back→closes  (12 h later)→History  T4→D4→T4
any game screen→D1→same   any→D2→D3→same|D5   between turns→D4→same   any→D5→G1   any→D6→G2
G1→T1  G1→S1→S2→T1  G1→D6→G2  G1→A1  G1→(undo)step
G2→(back)step  G2→A1  G2→A2
```
Rule branches to reach at least once: moving the phone and tapping; motion refused (taps only); hands-free with a bump while a
word shows (no mark); one player hands-free in a hand-mode game; a mark within the 0.8 s guard; a second move before the
phone came back level; an edge tap; time up with a word on screen; a word fixed both ways; Undo after Save score; a pack
running out mid-turn; every word used tonight; non-veg on and off; 30, 60 and 90 s; sounds off; a pause mid-word then a new
word; skip after a pause; a player added mid-round; a leaver mid-round, the leaver on T1, a leave down to 1 player;
"Someone else goes first"; a tie for the win; 2 players; 20 players; rotation lock on.

## K. Prototype script (what the tap-through shows)
Same rendering rules as Secret Words K3 (one state per screen, real labels, K4-style outcomes), with this data.

**K1. The example game night.** Players in turn order: Riya, Arjun, Meena, Kabir, Zoya, Dev. Words: Animals, 60 s, in the
guesser's hand, sounds on, non-veg off; Kabir chooses hands-free on his turn. Game 1 of the night.

**K2. Round 1:** Riya gets Tiger, Owl, Camel, Duck, Bat, passes Penguin, Zebra (5); Arjun 7; Meena 5; Kabir 3 (hands-free);
Zoya 4; Dev 6. Round 2 adds Arjun 7, Meena 8, Riya 4, Dev 5, Zoya 3, Kabir 4. End: Arjun 14 wins. Words nobody got: Penguin,
Zebra, Kangaroo. Best turn: Meena, 8 words. G1's tally line reads "Tonight: Arjun 1 win" (game 1).

**K4. Exact states for the renderer** (K3 of Secret Words applies: one state per screen; button labels are the quoted words
only, never a row's description; the word "quiet" and the quote marks are never drawn).
- **A1:** a main button "Host a game" (→ A2) above the unfinished row, a button of two lines "What Am I? · Round 2 · Arjun's
  turn" / "Riya, Arjun +4 · 8:05 pm · Tap to resume" (→ D1 over Arjun's turn).
- **A2:** the card button "What Am I?" with its line "Phone on your forehead, the room gives clues · One phone, passed round ·
  2–20 players".
- **S1:** the six names of K1 as a list, each with a drag handle and "✕"; the input "Player name" and "Add"; the small line; "6
  players"; quiet "How to play" (→ S4), "← Back" (→ A2); main "Next" (→ S2).
- **S2:** three radio groups drawn as rows with a ✓ on the chosen one (Mix of all, 60 s, In the guesser's hand), every option
  with its line; two switches (non-veg off, Sounds on); the "Ready as it is…" line; main "Start with these words" (→ S3). The
  page scrolls; the main button never covers other text.
- **S4:** the seven lines of the scenarios' How to play (version 1.1 item 42) and the three drawings as labelled boxes; "Done".
- **T1:** the hand-hold state for Riya ("Round 1 · player 1 of 6", no tip line); "Hands-free for Riya" switches to the hands-free
  state (shown as Kabir's turn in K2); main → T0 the first time, then T2.
- **T2:** "3" with the line; main absent; after 3 s (or a tap anywhere) → T3.
- **T3:** sideways frame (812 × 375 by default for this screen); the top line, the word **TIGER** large, "Animals", "0:34",
  and the Pause button; the bottom half of the screen is one tap area labelled small "Got it" and the top half one labelled
  "Pass" (labels for the prototype only). Each tap shows the next K2 word; after the seventh, T4. No row descriptions drawn.
- **T4:** the h1 with the count; the two lists as word chips that move between lists on tap (with ↺, count updating); "Next:
  Arjun"; Pause, "← Home (game saved)", "Menu"; main "Save score" (→ T1 for Arjun, toast "Riya: 5 saved · Undo"; Undo → T4).
- **R1, G1:** the full scoreboard of K2 as a list ("Arjun 7 (1 turn)", "Dev 6 (1 turn)", … after round 1; "Arjun 14 (2 turns)",
  "Meena 13 (2 turns)", … at game over).
- **D2:** the six names with "✕" and handles, the add row, the top line, "Done".
- **D1:** "Carry on playing" (main), "End Riya's turn now", "← Home (game saved)" (no "quiet" text).
- **Guards:** a double tap on a main button counts once (the 800 ms / 1 s guard), so T1 never skips T2.
- **Back:** the browser Back goes to the previous prototype screen, not the index.

**K3. Which outcome a tap follows.** T3 shows "Tiger" first; "Got it" and "Pass" both lead to the next word in K2's order;
the prototype's clock jumps to T4 after the seventh word. A word tapped on T4 moves list with ↺. "Save score" after Dev
leads to R1. "Hands-free for Kabir" on Kabir's T1 shows the hands-free T1. A1 resume → D1 over Arjun's turn with "Welcome
back." and the where-line "Round 2 · Arjun guessing, 34 s left".

## H. Where draft 4's changes came from
| Source | What it changed |
|---|---|
| Critic helper, pass of draft 1 (23 October) | rotation lock; ringer tip; screen awake; one move one mark; edge taps; T4 stop, home and undo; Home on T1 and D1; joiners this round; leave down to 1; all words used; "Carry on playing" from R1; Settings to turn moving back on; example data; 26 words replaced; WAI-08 unused |
| Six persona walks of draft 2 (`map-walk-2026-10-23.md`) | Pause button and gestures; tap guard never carries; one word for Home; End lines; when the game ends; chosen time in S3; fix after time's up; T1 one tip at a time; the rule line on T1; Players on T1 and R1; Undo until the next start; S2 words and ticks; Skip asks first; a new word after a pause; ↺ and turns played; two-line resume row |
| Word guidelines (`docs/word-guidelines.md`) | verb-and-object buttons ("Don't remove Kabir", "Use taps instead", "Carry on playing", "End Riya's turn now"); "Oops, keep playing" kept; "I'm Riya: start"; one word per idea; counted plurals; "Words from every pack." |
| First Jev check (`jev-check.md`) | "move the phone down / up" (owner chose it over tilt and nod); "Which words?", "Time for each turn", "Start with these words", "Ready as it is…"; "Give clues. Don't say the word!" on T3 |
| Owner, 23 October | forehead or chest; hands-free mode and per-player choice |

Still open, for the prototype walks and the next Jev read: whether "phone down" is read the same way from the chest as from
the forehead; whether a clue giver finds the hands-free tap halves without looking twice.
