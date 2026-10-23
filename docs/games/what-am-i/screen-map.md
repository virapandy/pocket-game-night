# What Am I?: screen map (draft 3, product owner, 23 October 2026)

**Status: draft 3** (critic pass, section J; six persona walks, section L; word guidelines, section M, `map-walk-2026-10-23.md`; where J or L and a row differ, the later section wins). Jev's check is pending (handover). Stage 1 of `docs/proposals/design-before-code.md` (step 1b of `docs/new-game-process.md`). Drawn from
`guide.md`, `fit-and-stories.md`, `words.md` and decisions WA1–WA10 (`docs/decisions.md`, 23 October). No scenarios exist
yet, so the IDs column says which future scenario file a row belongs to (`WAI-01 setup` … `WAI-10 lifecycle`). Where a
later `scenarios.md` differs from this map, the scenarios win.

Built in from the Secret Words and Mafia maps so we don't find them again: visible tap guards, "How to play" on every
setup screen, the where-line after a break, a Pause icon, "← Home" and "End" visible after a game, one main button per
screen.

**How to read it.** One table per screen: what is on it (*Words*), then one row per button or gesture: where it leads and
what it records. *Intentions* says which of the common next wishes are visible without opening a menu (**stop** ·
**home** · **back** · **help** · **undo** · **pause**); "(menu)" means only through "··· Menu". Sizes: every screen works at
320 × 568, 360 × 640, 390 × 844, 812 × 375 and 568 × 320 unless its *Sizes* line says otherwise. Example names are in K1.

**Rules that apply to every screen:**
- *Visible tap guards:* every main button appears greyed for 800 ms after its screen appears (1 s on "I'm ready") and then
  comes alive; quiet buttons are not guarded (same rule as Secret Words and Mafia).
- *The guesser can't see the word screen.* During a turn (T2–T3) every mark is confirmed by **sound and a buzz** (WA10),
  never by text alone. Android buzzes; iPhone browsers can't, so sound carries it there.
- *Pause* icon (name "Pause") on every screen during a game opens D1; on the word screen it sits in a corner, small, so a
  forehead doesn't press it (open item H3).
- *Where-line:* "Round 2 · Arjun's turn next" / "Round 2 · Arjun guessing, 34 s left" / "Game over, game 1", shown under
  "Welcome back." after a hide or reload, on the Pause cover and on Home's resume row. A turn never carries on while the
  app is hidden: hiding pauses it.
- *Menu*, in this order where an item applies: How to play · Players · Words and time · Pause · Home (keep this game) ·
  End the game · End for tonight · Settings · History.

## A. Home and the picker (shared with other games)

### A1. Home (changes for What Am I? only)
*Words:* "Host a game" lists What Am I? among the games; unfinished row "What Am I?, 8:05 pm · Riya, Arjun +4 · Round 2" +
where-line + "Tap to resume".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Unfinished What Am I? row | the game's last screen with "Welcome back." (a turn in progress resumes on D1 Paused, with the same word and time left) | — | WAI-10 |

### A2. What shall we play? (new card)
*Words:* card "What Am I?" · "Phone on your forehead, the room gives clues · 2–20 players · 10 min a round".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| What Am I? card, nothing unfinished | S1 Who's playing? | — | WAI-01 |
| What Am I? card, a game night unfinished | A3 Start new dialog (shared) | — | WAI-10 |

## B. Setup (host phone)

### S1. Who's playing?
*Words:* heading "Who's playing?"; tonight's names already in the list; input "Player name" + "Add"; per name "✕" and
drag handle (order = turn order); counter "6 players"; under 2: "What Am I? needs at least 2 players." (main disabled);
over 20: "Up to 20 players." (Add disabled); quiet "How to play"; quiet "← Back"; main "Next". *Intentions:* back, help.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Add / Enter | name added, input cleared (every Enter adds, however fast, M3); same name: "Riya is already playing. Add an initial, like Riya S." | — | WAI-01 |
| ✕ | name removed, toast "Kabir removed · Undo" | — | WAI-01 |
| Drag a name | turn order changes | — | WAI-01 |
| How to play | S4 → Done → back here | — | WAI-09 |
| ← Back | A2 picker | — | WAI-01 |
| Next | S2 Words and time | — | WAI-01 |

### S2. Words and time
*Words:* heading "Words and time"; "Word pack" list, one choice: **Mix of all** (default) · Animals · Food · Around the house ·
Jobs · Sports and cricket · Festivals and places · Act it out · Famous Indians; each with "40 words" ("Mix of all: 316
words"); "Turn length" 30 s · **60 s** · 90 s with "30 s for small kids, 90 s for grandparents"; switch "Non-veg food words"
**off** (WA9); switch "Sound and buzz" **on** with "The guesser can't see the screen, so sounds tell them a word counted."
(WA10); quiet "How to play"; quiet "← Back"; main "Start". *Intentions:* back, help.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| a pack / a length / a switch | choice shown selected | setup | WAI-01, 03 |
| How to play | S4 → back | — | WAI-09 |
| ← Back | S1 (names kept) | — | WAI-01 |
| Start | S3 Read this aloud (first What Am I? game tonight) or T1 for the first player | `start` (word order from the word seed) | WAI-01 |

### S3. Read this aloud (first game of the night)
*Words:* "Read this aloud:"; card "One of us holds the phone on their forehead, screen to the room. Everyone else gives
clues: talk, act, make the noise, but never say the word. Got it? Tilt the phone down. Stuck? Tilt it up to pass. Passing
is free. You have 60 seconds. Most words tonight wins."; quiet "← Back"; quiet "How to play"; main "First turn".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| First turn | T1 for the first player | — | WAI-01 |
| ← Back | S2 | — | WAI-01 |
| How to play | S4 → back | — | WAI-09 |

### S4. How to play (setup screens, menu)
*Words:* the guide's "How to play" steps 1–8 in short lines, with a drawing of the phone held sideways on a forehead;
"Done".
| Tap | Leads to | IDs |
|---|---|---|
| Done | the screen it was opened from | WAI-09 |

## C. A turn

### T1. Pass screen ("Riya, you're guessing")
*Words:* "Riya, you're guessing"; "Hold the phone **sideways** on your forehead, screen facing the room."; the drawing;
score line "Round 1 · turn 1 of 6"; quiet "Not Riya? Someone else first"; Pause icon; "··· Menu"; main "I'm ready". When the
pack has under 15 new words left tonight: line "Only 8 new Animals words left. After that, words come from Mix of all."
(open item H1). *Intentions:* pause, help (menu), stop (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| I'm ready | T0 Allow tilt (first turn on this phone only, where the phone asks) or T2 | — | WAI-02 |
| Not Riya? Someone else first | D2 Players, pick who goes now; Riya goes next | `reorder` | WAI-06 |
| Pause / Menu | D1 / menu | — | WAI-06 |

### T0. Tilt or tap? (once per phone, only where the phone asks for motion permission)
*Words:* "Mark words by tilting?"; "Tilt down for Got it, up for Pass. Your phone will ask once."; quiet "Tap only";
main "Allow tilt".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Allow tilt | the phone's own permission prompt → T2 (refused: T2 with tap only, toast "Tap to mark words: bottom half Got it, top half Pass.") | setting | WAI-02 |
| Tap only | T2 with tap only | setting | WAI-02 |

### T2. Get ready (countdown)
*Words:* big "3", "2", "1" with a beep each (sound on); "Put it on your forehead!". The clock has not started.
Sizes: designed for 812 × 375 and 568 × 320 (sideways); upright it still shows, smaller.
| Event | Leads to | Records | IDs |
|---|---|---|---|
| countdown ends | T3 with the first word; clock starts | — | WAI-02 |
| Pause | D1 | — | WAI-06 |

### T3. The word (room-facing, sideways)
*Words:* the word as large as fits on one or two lines (readable from 3 metres); small pack name ("Animals"); time left
"0:34"; small Pause icon in a corner. No other text. Sizes: designed for 812 × 375 and 568 × 320; upright it still works.
| Gesture | Leads to | Records | IDs |
|---|---|---|---|
| tilt down, or tap the bottom half | green flash "Got it!" (0.6 s) + ding + short buzz → next word | `got` | WAI-02 |
| tilt up, or tap the top half | orange flash "Pass" (0.6 s) + low tone + double buzz → next word | `pass` | WAI-02 |
| any mark within 0.8 s of a new word appearing | ignored (stops one tilt marking two words) | — | WAI-02 |
| 10 s left | three quick ticks, then ticking to the end | — | WAI-02 |
| time up | long buzz + "Time's up!" sound → T4; the word on screen counts as passed | `timeUp` | WAI-02 |
| Pause, or the app hidden (call, lock, switch app) | D1 Paused; clock stopped; word hidden | `pause` | WAI-06 |
| pack runs out | words continue from Mix of all without stopping | — | WAI-03 |

### T4. Time's up (end of turn)
*Words:* "Time's up! Riya got 5"; two lists: **Got it** (green) "Tiger · Owl · Camel · Duck · Bat" and **Passed** (grey)
"Penguin · Zebra"; line "Marked wrong? Tap a word to move it."; quiet "··· Menu"; Pause icon; quiet "← Home (game saved)"; line "Next: Arjun"; main "Save score". Back to upright layout.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| a word | moves to the other list; count updates ("Riya got 4") | `fix` | WAI-04 |
| Save score | toast "Score saved · Undo" (10 s) → T1 for the next player, or R1 when everyone has had a turn this round | `scoreTurn` | WAI-04 |

## D. Between rounds

### R1. Round over
*Words:* "Round 1 done"; scoreboard, highest first, "Arjun 7 · Riya 5 · Meena 5 · …"; line "Words nobody got: Penguin,
Zebra"; quiet "Change players or words"; quiet "End the game"; quiet "← Home"; main "Round 2".
*Intentions:* stop, home, change (visible); help (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Round 2 | T1 for the first player in the list | — | WAI-05 |
| Change players or words | S1 ("← Back to the game") → S2 → "Carry on" (scores kept) | setup | WAI-05 |
| End the game | D5 | — | WAI-07 |
| ← Home | A1 (game stays unfinished) | — | WAI-10 |

## E. Dialogs during a game
| # | Dialog | Words | Buttons → where | Records | IDs |
|---|---|---|---|---|---|
| D1 | Paused (cover) | "Paused"; the where-line; "The word is hidden. Tap Carry on when you're ready." | Carry on → T1, or T2 countdown again then T3 with the **same word** and time left · quiet "Skip this turn" → T4 with what was marked so far | `resume` / `timeUp` | WAI-06 |
| D2 | Players | names with "✕" and drag handles; add row; mid-round: "New players take their turn at the end of this round." | Done → back; ✕ → D3; tap a name on "Someone else first" → T1 for them | `addPlayer`, `reorder` | WAI-06 |
| D3 | Kabir has to leave? | "Kabir's points stay on tonight's scoreboard." | Kabir leaves → back, toast "Kabir left · Undo" (10 s) · Keep Kabir (main) → D2 | `leave` | WAI-06 |
| D4 | Words and time (menu, between turns only) | S2's choices; mid-turn the item is greyed with "After this turn" | Done → back (applies from the next turn) | setup | WAI-03 |
| D5 | End the game? | "Tonight's winner will be shown." | End the game → G1, toast "Game ended · Undo" (10 s) · Keep playing (main) → back | `endGame` | WAI-07 |
| D6 | End for tonight? | "Tonight's scores stay in History." | End for tonight → G2 · Keep playing (main) → back | — | WAI-07 |

## F. After a game, after the night

### G1. Game over
*Words:* "Arjun wins with 14!" / tie "Arjun and Meena share the win with 12!"; scoreboard; fun lines "Best turn: Meena,
8 words" · "Words nobody got: Penguin, Zebra, Kangaroo"; "Tonight: Arjun 1 win"; quiet "Change players or
words"; quiet "End for tonight"; quiet "← Home"; main "Play again". *Intentions:* stop, home, play on, change (visible).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Play again | T1 for the first player, scores at 0, same pack and time, no word from tonight repeated | `start` | WAI-07 |
| Change players or words | S1 → S2 → Start (no read-aloud) | `start` | WAI-07 |
| End for tonight | D6 → G2 | — | WAI-07 |
| ← Home | A1 | — | WAI-10 |
| Undo (toast after End the game) | the screen it came from | nothing | WAI-07 |

### G2. Summary "Tonight's What Am I?"
*Words:* "6 players · 2 games · 148 words got"; "Wins: Arjun 1 · Meena 1"; "Best guesser tonight: Meena (31 words)";
quiet "Oops, keep playing"; quiet "← Home"; main "Play something else". Menu: only "Delete tonight's games".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Oops, keep playing | where the host came from | nothing | WAI-07 |
| ← Home / Play something else | A1 / A2 (tonight's names kept) | `endEvening` | WAI-07 |

## G. The paths (the finite list for the coverage map)
```
A1→A2  A1→(resume)T1|D1(over T2/T3)|T4|R1|G1   A2→S1  A2→A3
S1→S2  S1→S4→S1  S1→A2      S2→S3|T1  S2→S1  S2→S4→S2      S3→T1  S3→S2  S3→S4→S3
T1→T0→T2  T1→T2  T1→D2→T1  T1→D1→T1  T1→menu…
T2→T3  T2→D1→T2
T3→T3(got|pass|guarded)  T3→T4(time up)  T3→D1→T2→T3(same word)  T3→D1→T4(skip)
T4→T4(fix)  T4→T1  T4→R1
R1→T1  R1→S1→S2→T1  R1→D5→G1  R1→A1
any game screen→D1→same   any game screen→D2→D3→same   between turns→D4→same   any→D5→G1   any→D6→G2
G1→T1  G1→S1→S2→T1  G1→D6→G2  G1→A1  G1→(undo)step
G2→(back)step  G2→A1  G2→A2
```
Rule branches to reach at least once: tilt and tap; tilt refused (tap only); a mark within the 0.8 s guard; time up with a
word on screen; a word fixed both ways; a pack running out mid-turn; non-veg on and off; 30, 60 and 90 s; sound off; a
pause mid-word then carry on; skip after a pause; a player added mid-round; a leaver mid-round; "Someone else first";
a tie for the win; 2 players; 20 players.

## H. Open in draft 1 (for the persona walks, the critic and Jev to test)
1. **Packs of 40 run out fast.** About 8–12 words a turn means one pack lasts 4 turns. Draft 1 continues from Mix of all
   (T1 warns). Packs should grow to about 100 words each before release; the word list is edition 1.
2. **Tilt directions on a forehead.** "Down" means the screen tips towards the floor. Persona walks should check people
   read "down" the way the phone means it; the read-aloud says it once.
3. **Pause on the word screen** must not be pressed by a forehead or hair; a small corner icon may still be hit. Option:
   pause only by taking the phone down (hiding the app) and a two-finger tap.
4. **Clock while upright.** Draft 1 keeps the clock running whatever the phone's angle; turning upright to peek is
   cheating the room judges, as with paper.

## J. Critic pass of draft 1 (23 October): what changed
1. **Rotation lock (T3).** When the phone is held sideways but the screen stays upright, the word is drawn turned to fit the
   sideways phone. T1 adds, only where turning can't be detected: "Screen not turning? Turn off rotation lock."
2. **Signal for the guesser (T3, WA10).** On iPhone, T1 adds "Turn your ringer on so you hear each word count." On S2,
   turning "Sound and buzz" off shows "The guesser won't know a word counted." (the switch still works).
3. **Screen stays awake** for the whole turn (T2–T4). If the phone refuses, T1 adds "Keep your screen on during the turn."
4. **One tilt, one mark.** A tilt counts only once the phone has come back level since the last mark (and the 0.8 s guard
   still applies). Taps within 15% of the short edges (where fingers grip) are ignored. Each gets its own scenario.
5. **T4 visible stop and home, undo:** Pause, "← Home (game saved)", "Next: Arjun", main "Save score" (not "Keep score"),
   toast "Score saved · Undo" (10 s).
6. **Home visible mid-round:** quiet "← Home (game saved)" on T1 and on the D1 Paused cover.
7. **Coming and going (D2, D3, M1, M7).** A newcomer added mid-round takes a turn **in this round, after the last player in
   the list**; T1 shows "Joining this round: Zoya" until their turn. A leave that would leave 1 player: "2 players needed.
   Add someone, or end the game." with "Add a player" / "End the game". If the leaver is the player on T1, T1 moves to the
   next player.
8. **Every word used tonight:** when Mix of all has no new words, T1 says "All words used tonight. Words from earlier games
   come back, oldest first." S2's counts leave out non-veg words while the switch is off ("Food: 36 words").
9. **S2 label when changing mid-game:** from R1 or G1 "Change players or words", S2's main button reads "Carry on" (R1,
   scores kept) or "Start" (G1, new game).
10. **Back to tilt:** Settings gets "Mark words by tilting" (on/off), so "Tap only" on T0 is never final.
11. **Example data fixed** (K2): only Animals words; "Best turn" instead of "Fastest turn"; game 1 tally.
12. **Words** (`words.csv`): 26 words replaced (near-duplicates such as Skipping/Jumping rope and Police/Traffic police;
    Gilli danda; names a 10-year-old can't describe; Rajinikanth and Mother Teresa as close to politics or religion; Fair →
    Exhibition; Church and Mosque beside Temple). Famous Indians now leans to sport; the Jev word check judges it.
13. **WAI-08 is not used** (as MAF-08 in Mafia). New paths: T1 (rotation, ringer, awake lines); T3 (re-level before the
    next tilt; edge taps ignored); T4→A1; T4→(undo)T4; D3→"2 players needed"; T1→"All words used"; A1→(resume)T4|R1|G1
    exactly as left.

## L. Six persona walks of draft 2 (23 October): what changed
1. **Pause in a turn (T3).** A clear "Pause" button (words and icon, at least 48 px) in the top corner the room sees, kept
   outside the Got it / Pass tap zones (taps there never mark). Laying the phone flat, face up, for 1.5 s pauses. The
   phone's Back gesture pauses (never leaves the turn).
2. **Tap guards** keep the shared look (Secret Words decision 2). A tap during a guard is dropped, never carried to the
   next screen's button.
3. **Exits.** The menu item becomes "Home (game saved)", the same words as the buttons. D5 adds "Shows this game's winner.
   You can play again with the same people."; D6 adds "Shows tonight's summary. Every score is kept in History."
4. **When the game ends.** S3's last sentence becomes "Play as many rounds as you like; tap End the game to see who got
   the most." R1 shows the same line, small, above its buttons.
5. **S3** says the chosen length: "You have 30 seconds." / "60 seconds" / "90 seconds".
6. **No undo mid-turn** (it would cost the turn's time). S3 adds "Marked wrong? Fix it when time's up."; T4 is where it's fixed.
7. **T1, less clutter.** At most one tip line at a time, in this order: joining line, pack running out, phone tip. The
   phone tips (ringer, rotation lock, screen on) show on the first turn on this phone only. "Not Riya? Someone else first"
   becomes "Someone else goes first".
8. **The rule on every T1:** under the instruction, always: "Tilt down: Got it · Tilt up: Pass" (tap mode: "Tap bottom:
   Got it · Tap top: Pass"). T0 shows the same as a small drawing.
9. **Getting in.** A2 card: "Phone on your forehead, the room gives clues · One phone, passed round · 2–20 players".
   A visible quiet "Players (6) ›" on T1 and R1 opens D2, whose top line reads "Add a name to join. New players go after
   the last player in this round."
10. **Undo after Save score** stays on screen until the next "I'm ready" (not 10 s), as "Riya: 5 saved · Undo".
11. **S2 words.** Pack list shows a tick on the chosen pack (Mix of all ticked at first). Switch "Include non-veg food
    (chicken, fish, egg)" off; switch "Sounds" on with "So the guesser knows a word counted."; off: "The guesser won't
    know a word counted."
12. **Skip this turn** (D1) opens "Skip Riya's turn? Words marked so far still count." with Skip · **Carry on** (main).
13. **After any pause**, Carry on counts 3, 2, 1 and shows a **new** word; the hidden word goes back to the pack unused.
    The time left is kept.
14. **Fairness.** On T4, a word moved shows ↺ ("Owl ↺"); after Save score the turn is locked (Undo above reopens it). R1
    and G1 show turns played: "Arjun 14 (2 turns) · Zoya 6 (1 turn)". Ties stay shared (WA7).
15. **A1 resume row** in two lines: "What Am I? · Round 2 · Arjun's turn" / "Riya, Arjun +4 · 8:05 pm · Tap to resume".
16. ~~**G2:** "Oops, keep playing" becomes "Back to the game".~~ Reversed by M2: word guideline A8 keeps "Oops, keep playing".

## M. Word guidelines check (`docs/word-guidelines.md`, 23 October)
1. **Buttons as a verb and its object (A3):** "Keep Kabir" → "Don't remove Kabir"; "Tap only" → "Use taps instead";
   "Carry on" → "Carry on playing" (D1, S2 from R1, the Skip dialog); "Skip" in the Skip dialog → "Skip Riya's turn".
2. **"Oops" stays (A8):** G2 keeps "Oops, keep playing"; L16 is reversed.
3. **The main button names the person (A4):** T1's "I'm ready" → "I'm Riya: start" (the 1 s guard applies to it).
4. **One word per idea (A1):** a **turn** is one player's 30–90 s; a **round** is everyone once; a **game** runs from Start
   to "End the game"; **tonight** is the game night ("End for tonight"). Never "session" or "evening" on screen. A word on
   screen is a **word**, never a "card" or "clue".
5. **Plurals counted (A9):** "1 word", "2 words"; "1 turn", "2 turns"; "1 player" never shown (2 is the minimum).
6. **Say what a choice does (A6):** every S2 choice already has its line; the pack list adds a line under Mix of all:
   "Words from every pack."
7. **Content words (Part B):** `words.csv` edition 1 is checked by B1–B7 and the length rule (B5: at most 22 characters,
   two lines on the sideways word screen at 568 × 320, checked by code before approval).
8. **Packs grown (23 October):** 97–100 words a pack, 789 in all (`words.md`). S2 shows each pack's real count, leaving out
   non-veg words while that switch is off: "Animals · 97 words", "Food · 89 words" (100 with non-veg), "Mix of all · 776
   words". Open item H1 (packs running out after 4 turns) is closed: a pack now lasts about 10 turns, and the T1 warning
   and Mix-of-all fallback stay for big groups.

## K. Prototype script (what the tap-through shows)
Same rendering rules as Secret Words K3 (one state per screen, real labels, K4-style outcomes), with this data.

**K1. The example game night.** Players in turn order: Riya, Arjun, Meena, Kabir, Zoya, Dev. Pack: Animals, 60 s, sound on,
non-veg off. Game 1 of the night.

**K2. Round 1:** Riya gets Tiger, Owl, Camel, Duck, Bat, passes Penguin, Zebra (5); Arjun 7; Meena 5; Kabir 3; Zoya 4; Dev
6. Round 2 adds Arjun 7, Meena 8, Riya 4, Dev 5, Zoya 3, Kabir 4. End: Arjun 14 wins. Words nobody got: Penguin, Zebra,
Kangaroo. Best turn: Meena, 8 words. G1's tally line reads "Tonight: Arjun 1 win" (game 1).

**K3. Which outcome a tap follows.** T3 shows "Tiger" first; "Got it" and "Pass" both lead to the next word in K2's order;
the prototype's clock jumps to T4 after the seventh word. A word tapped on T4 moves list. "Save score" after Dev leads to
R1. A1 resume → D1 over Arjun's turn with "Welcome back." and the where-line "Round 2 · Arjun guessing, 34 s left".
