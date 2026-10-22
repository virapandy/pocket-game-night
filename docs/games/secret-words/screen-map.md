# Secret Words: screen map (draft 3, product owner, 22 October 2026)

**Status: draft 3, matching scenarios version 3.6 (22 October).** Every mark that said *proposed* in draft 2 is approved
(owner, 11 October); section I below adds the 22 October changes. Where this map and `scenarios.md` differ, the scenarios win.
This is the map the prototype renderer reads and the coverage map is derived from.
Draft 1 was: Drawn from `scenarios.md` version 3.4 (binding), `ux.md`, `lifecycle.md`
and `play-modes.md`. Where this file and `scenarios.md` differ, `scenarios.md` wins until the owner decides otherwise.
This is stage 1 of `docs/proposals/design-before-code.md`: once the owner has corrected it, the orchestrator runs Jev's
per-screen checks and the six persona walks on it, then the prototype is generated from it.

**How to read it.** One table per screen: what is on it, then one row per button or gesture: where it leads and what it
records. *Intentions* says which of the common next wishes are visible on that screen without opening a menu
(**stop** the game or evening · **home** · **back** · **help** · **undo** · **pause**); "(menu)" means only through
"··· Menu". Sizes: every host screen works at 320 × 568, 360 × 640, 390 × 844, 812 × 375 and 568 × 320 unless the
*Sizes* line says otherwise. Example names: Riya and Arjun give clues; teams Chai Champions (orange) and Coffee Commandos (teal).

**Rules that apply to every screen (draft 2):**
- *Visible tap guards (decision 2):* every main button appears in the greyed look for its guard (800 ms; 1 s "I'm Riya";
  1.5 s "Other team's turn" after a turn-ending reveal) and comes alive when the guard ends. Timings as K35; quiet buttons
  unaffected. One look rule for every game.
- *Pause (decision 6):* a Pause icon button (accessible name "Pause") beside "··· Menu" on the pass, clue, guessing, end-turn
  and turn-over screens opens D4. The menu is grouped, in this order: play (Earlier clues · Start 90-second timer · Someone
  else taps Reveal · Players · Show the map to a clue giver · Show the map code again) · fix (New board) · leave (Pause · Home
  (keep this game) · End the game · End for tonight) · more (How to play · Settings · History). Items per step as before.
- *Where-line (decision 3):* `where-line` "Turn 4 · Chai Champions' clue" / "Chai Champions guessing · 2 guesses left" /
  "Game over, game 2" under "Welcome back." (P1), on the Pause cover (D4) and on Home's resume row (A1).

## A. Home and the picker (shared with other games)

### A1. Home
*Words:* "Host a game" with "Tambola, Impostor or Secret Words on this phone" · "Join a game" with "Tambola ticket or Secret
Words map from the host" · unfinished row "Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1" + "Tap to resume" ·
"Last game night: Chai Champions 2 · Coffee Commandos 1" + "Play again with these teams" (next day, under 36 h) · saved map row
"Secret Words map 27P-3QX8 · Tap to open" (older than 6 h: "Open" / "Clear"). *Intentions:* help (menu How to play of Home),
History (menu). Sizes: as today.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Host a game | A2 picker | — | SWD-001 |
| Join a game | J1 Join screen | — | SWD-002 |
| Unfinished row (with the where-line, decision 3) | the game's last step (P1…G1) | — | SWD-115, 062 |
| Play again with these teams | S2 Make teams with last night's players, teams and names (after A3 if a game night is unfinished) | — | SWD-115 |
| Saved map row / Open | M1 Map phone | — | SWD-036 |
| Clear (saved map) | M2 Clear map dialog | — | SWD-036 |
| Menu → History | E1 History | — | SWD-115 |

### A2. What shall we play?
*Words:* three equal cards; "Secret Words" · "Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game";
resume card "Secret Words · Chai Champions v Coffee Commandos · 2–1 · Tap to resume". *Intentions:* back (to Home).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Secret Words card, nothing unfinished | S1 Who's playing? | — | SWD-001 |
| Secret Words card, a game night unfinished | A3 Start new dialog | — | SWD-115 |
| Resume card | the game's last step | — | SWD-115 |

### A3. Dialog "Start a new game night?"
*Words:* "The one from 8:40 pm (Chai Champions v Coffee Commandos, 2–1) will end." Two equal quiet buttons, no main.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Carry on that one | the game's last step | — | SWD-115 |
| Start new (ends that one) | S1 Who's playing? (new game night) | `endGame` if mid-game, `endEvening` of the old night; no summary | SWD-067 |

## B. Setup (host phone)

### S1. Who's playing?
*Words:* "Who's playing?"; tonight's names filled in; "Clear list"; past names; "Add at least 4 players." (under 4);
"20 players is the most." *Intentions:* back. No menu.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Add a name / Enter | same screen, name added, field kept focused | — | SWD-003, 132 |
| Clear list | same screen, empty | — | SWD-003 |
| Next (4–20 names) | S2 Make teams | — | SWD-003 |
| ← Back | A2 picker; from game over: "← Back to the game" → G1 | — | SWD-003, 112 |

### S2. Make teams
*Words:* "Make teams"; "Chai Champions (4)" / "Coffee Commandos (3)" with icon and "Orange team" / "Teal team"; badge "Clue
giver"; "Doesn't give clues" under such names; "Tap a name to move it to the other team."; alerts "Each team needs at least 2
players." · "Each team needs someone who can give clues." *Intentions:* back, undo (toast). No menu. Page may scroll, main fixed.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| A name ("Move Om to Coffee Commandos") | same screen; toast "Om moved to Coffee Commandos · Undo" | teams (on Next) | SWD-005 |
| Undo (toast) | same screen, as before the move | — | SWD-005 |
| Shuffle teams | same screen; toast "Teams shuffled · Undo" | draw k+1 | SWD-006, 130 |
| New team names (first deal not yet made) | same screen; toast "New team names · Undo" | names draw m+1 | SWD-013 |
| Change clue givers | S2a Clue givers sheet | — | SWD-007 |
| Next | S3 Choices | `setTeams` on the deal | SWD-004, 008 |
| ← Back | S1 Who's playing? (teams kept) | — | SWD-004 |

### S2a. Sheet "Clue givers" (also from G1 "Swap")
*Words:* groups "Chai Champions" / "Coffee Commandos"; one button per player; "Add a partner" ↔ "Remove partner"; group
"Chai Champions partner"; switch "Doesn't give clues" per player; alert "Each team needs someone who can give clues."
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| A player | selected as clue giver | on Done | SWD-007 |
| Add a partner / a partner name / Remove partner | partner group shown / chosen / cleared | on Done | SWD-123 |
| Doesn't give clues (switch) | that player ineligible; next eligible becomes clue giver if needed | on Done (`guessOnly`) | SWD-014 |
| Done | back to S2 or G1, changes applied | `setTeams` / `setClueGivers` at the deal | SWD-007, 112 |
| Close any other way | back, nothing changed | — | SWD-007 |

### S3. How do you want to play? (Choices)
*Words:* "Same as last time" (when carried over); "How many phones?" cards "One phone" / "Two phones" (+ "Recommended") /
"Three phones" with their lines; "Board" Full / Easy; "Landmine" Lose the game / Lose your turn (Full only); "Words" Whole
family / + Harder words; "Big group? The Easy board is easier to read." (9+); "Pick how many phones to start." above the
disabled main. *Intentions:* back. No menu. Page may scroll, main fixed.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| A phones card / Board / Landmine / Words option | same screen, option selected | `lastChoices` at the deal | SWD-009, 066, 119 |
| How to play (quiet, decision 1) | S5 → Done → here | — | new |
| Start the game, read-aloud due | S4 Read this aloud | — | SWD-009, 010 |
| Start the game, otherwise | deal → S7 Scan screen (two or three phones) or P1 Pass screen (one phone) | the deal (evening created on the first) | SWD-009, 012 |
| ← Back | S2 Make teams | — | SWD-009 |

### S4. Read this aloud (once per session)
*Words:* "Read this aloud"; 4 numbered lines (team names filled in; Landmine line varies by board and Landmine choice).
*Intentions:* back, help (this is the help).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Let's play | deal → S7 or P1 | the deal | SWD-010 |
| Show me the board first | deal → S6 Preview board | the deal | SWD-010, 012 |
| ← Back | S3 Choices | — | SWD-010 |

### S5. How to play (menu, any game step; dispute dialog's "Clue rules")
*Words:* "How to play"; "Read this aloud" + 4 lines; "The rules" + 6 lines; "Clue rules" + 4 lines; the credit line.
Nothing about the map. Page may scroll.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Done | the step it was opened from (dispute dialog if opened from it) | — | SWD-011, 124, 131 |

### S6. Preview board (after "Show me the board first")
*Words:* heading "The board, before you start" (W23); the board, every cell locked; "Chai Champions start"; counts. *Intentions:* help, pause, home, stop (all menu).
Menu: How to play · New board · Pause · Home (keep this game) · End for tonight · Settings · History.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Start | S7 Scan screen (two or three phones) or P1 Pass screen (one phone) | — | SWD-012 |
| ↻ (flip) | same, grid turned for the starting team | UI angle | SWD-102 |

### S7. Clue givers, scan your map (two or three phones; after every deal)
*Words:* "Clue givers, scan your map"; two phones "Riya and Arjun: sit side by side and share one map phone." / three phones
"Riya (Chai Champions, orange) and Arjun (Coffee Commandos, teal): scan on your own phones."; QR ≥ 200 px; "or type:
27P-3QX8"; board check line (one of SWD-116's four wordings); Do Not Disturb tip (first deal); "Guessers: don't scan this
one!" (decision 5, replaces "Everyone else: look away from their phones."); W11: a line above the QR "On the other
phone: open the app, tap Join a game, scan this." and the heading and main of W11. *Intentions:* help, pause, home, stop, players (all menu). Page may scroll, QR fixed size, main fixed.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| The map phone is ready (two) / Both have the map (three) | P3 Clue screen of the starting team | — | SWD-033 |
| Menu → Players | D7 Players sheet | `setPlayers` | SWD-127 |
| Menu → New board / Pause / Home (keep this game) / End the game / End for tonight / Settings / History | D5 / D4 / A1 / D6 / D8 / Settings / E1 | see each | menu table |
| Resume before the first clue | this screen again | — | SWD-033 |

### S7a. Show the map code again (menu, two or three phones, from P3 to P6)
*Words:* as S7 for the current board, without the Do Not Disturb tip. No menu.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Back to the game | the step it was opened from | — | SWD-129 |

## C. A turn (host phone)

### P1. Pass screen (one phone, start of each turn)
*Words:* team bar; "Chai Champions, your turn"; "Pass the phone to"; RIYA (large); "Clue giver for Chai Champions (orange)";
waiting line "Coffee Commandos: guess how many Riya will say!"; recap line "Last turn: …" (from turn 2); Do Not Disturb tip
(first pass of the evening); "Welcome back." with the where-line above it after a hide or reload. Hide order when short:
tip, waiting line, recap. *Intentions:* pause (icon, decision 6); help, home, stop, players (menu); timer (button). Menu: How to play · Players · New board ·
Pause · Home (keep this game) · End the game · End for tonight · Settings · History.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| I'm Riya (taps ignored for 1 s after appearing) | P2 Private map | — | SWD-030, 114 |
| Start 90-second timer ↔ Stop timer | same screen, timer running / removed; at 0 it only shows "Time's up!", nothing else happens | — | SWD-047 |
| Pause icon | D4 Paused | — | decision 6 |
| Menu items | as S7 | | menu table |

### P2. Private map (one phone; also S7b "Show the map to a clue giver")
*Words:* "RIYA"; "You give clues for Chai Champions (orange)"; W23 small line "Only Riya should see this screen."; counts; map area (empty until shown); pad "Tap to see the map" /
"Tap to hide"; "Our words" / "Whole map" and "↻ Flip" (while shown); "Not Riya? Go back" (before the first show) / "Someone saw
the map" (while shown); list "Your words (6 left)" + "Landmine word: Shadow"; "Still looking? Tap to keep the map" (at 50 s).
No menu, no team bar. *Intentions:* back (before the first show), hide. Sizes: narrow portrait shows the list, never the grid;
landscape grid left, column right.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Tap to see the map | map shown; main "I have my clue" appears | — | SWD-031 |
| Tap to hide · 60 s silence · app hidden | map removed; app hidden → P1 with "Welcome back." | — | SWD-031, 032, 121 |
| Our words ↔ Whole map | list ↔ grid | — | SWD-031 |
| ↻ Flip | grid turned | UI angle | SWD-102 |
| Not Riya? Go back | P1 Pass screen | — | SWD-113 |
| Someone saw the map | map removed → D5 New board dialog; "Keep playing" → here, hidden | — | SWD-113, 055 |
| I have my clue | P3 Clue screen | `mapSeen` (once per turn) | SWD-031 |
| From P3 "See the map again": Back to my clue | P3 with number and word kept | — | SWD-040 |
| From S7b: Done, hide the map | the step the game was on | — | SWD-037 |

### P3. Clue screen (one phone after P2; two or three phones at the start of each turn)
*Words:* team bar; "Chai Champions, your turn"; "Riya, say your clue out loud. How many words is it for?"; keys 0–9 and ∞
("many"); "2 means up to 3 guesses. 0 or ∞: as many as you like."; input "Clue word (optional)"; "Heads up: Cricket is on the
board." (when the word is on the board); counts; tip "One word, one number. No faces, no pointing!" (evening's first turn);
waiting line and recap (two or three phones). Hide order: tip, waiting line, help line, recap. *Intentions:* pause (icon); help, home,
stop, players (menu); timer (button); back to the map (one phone). Menu: as P1 + (two or three phones) Show the map to a clue
giver · Show the map code again.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| A number key / ∞ | key selected; main "Clue for 2: start guessing" | — | SWD-040 |
| Type a clue word | warning appears or clears live; never blocks | — | SWD-101 |
| Clue for N: start guessing | P4 Guessing | `clue` (number, optional word) | SWD-040 |
| See the map again (one phone) | P2 shown, main "Back to my clue" | — | SWD-040 |
| Keep my clue (after Change clue / Try another clue) | P4 with the old clue | — | SWD-040 |
| Start 90-second timer ↔ Stop timer | same screen | — | SWD-047 |
| Menu → Show the map to a clue giver (2/3) | S7b sheet "Show the map to" → P1 + P2 for that person, main "Done, hide the map" | — | SWD-037 |
| Menu → Show the map code again (2/3) | S7a | — | SWD-129 |
| Other menu items | as S7 | | menu table |

### P4. Guessing (the board)
*Words:* team bar; timer (if running); "Chai Champions guessing" (first 3 s: "Riya: poker face, no hints!"); "CRICKET · 2" or
"Clue: 2"; "3 guesses left (2 + 1 extra)" → "2 guesses left" … or "Guess as many as you like"; "Earlier: MONSOON 2 · 1 · RAIN ∞"
(tall portrait and landscape); counts + ↻; the board; tip "Tap a word to suggest it. Sunita taps Reveal." (evening's first
guessing turn) or the result line; action slot: "Change clue" + "Clue not allowed?" until the first reveal, then "End our
turn"; main "Sunita: Reveal" / "Sunita: Reveal KITE". *Intentions:* undo (unpick), stop/home/pause/help (menu). Menu: How to
play · Earlier clues · Start 90-second timer/Stop timer · Clue not allowed? (window) · Pass the pick · Players · (2/3) Show the
map to a clue giver · Show the map code again · New board · Pause · Home (keep this game) · End the game · End for tonight ·
Settings · History. Sizes: narrow portrait shows "Turn your phone sideways to see the board."; 568 × 320 moves "Change clue"
into the menu.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| A face-down word | picked (outline, ✓, tint); tap again unpicks; another word moves the pick | — | SWD-042 |
| Sunita: Reveal KITE | cell turns (300 ms); result line; then by the table below | `reveal` | SWD-042, 043 |
| ↳ own word, guesses left | P4 continues: "✓ Riya's clue works! 2 guesses left." | | SWD-043 |
| ↳ own word, allowance used up | P6 Turn over: "✓ Riya's clue works! That's all your guesses." | | SWD-043 |
| ↳ blank | P6: "Blank word. Other team's turn next." | | SWD-043 |
| ↳ other team's word | P6: "✗ The other team's word! It counts for them." | | SWD-043 |
| ↳ either team's last word | G1 Game over | | SWD-043, 050 |
| ↳ Landmine, Lose the game | G1 Game over (other team wins) | | SWD-043 |
| ↳ Landmine, Lose your turn | P6 + a free word for the other team: "Boom! The Landmine! …" | `freeCell` | SWD-043 |
| Change clue (until the first reveal) | P3 with the clue selected, quiet "Keep my clue" | a replacing `clue` on confirm | SWD-041 |
| Clue not allowed? (until the first reveal; a guess is a confirmed reveal, so the same window as Change clue) | D1 Dispute dialog | — | SWD-046, 124 |
| End our turn (after the first reveal) | P5 End-turn line | — | SWD-044 |
| ↻ | grid turned for the guessing team | UI angle | SWD-102 |
| Menu → Earlier clues | D2 sheet "Earlier clues" → Done → here | — | SWD-041 |
| Menu → Pass the pick (2+ guessers; W13 "Someone else taps Reveal") | D3 "Who picks this turn?" → a name → here, main renamed | UI `pickerOverride` | SWD-122 |
| Pause icon | D4 Paused | — | decision 6 |
| Other menu items | as S7 / P3 | | menu table |

### P5. End-turn line
*Words:* cells locked; "Chai Champions ended their turn."; quiet "Oops, keep guessing"; main "Other team's turn". Timer
stops. *Intentions:* undo ("Oops, keep guessing"); menu as P6.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Oops, keep guessing | P4 as it was | — | SWD-044 |
| Other team's turn | P1 for the other team (one phone) / P3 for the other team (two or three phones) | end of turn, next turn | SWD-044, 045 |

### P6. Turn over
*Words:* cells locked; the result line stays; clue line, guess line, tip removed; main "Other team's turn" (taps ignored
1.5 s after a turn-ending reveal). *Intentions:* stop/home/pause/help/players (menu). Menu: How to play · Earlier clues ·
Players · (2/3) Show the map to a clue giver · Show the map code again · New board · Pause · Home (keep this game) · End
the game · End for tonight · Settings · History.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Other team's turn | P1 (one phone) / P3 (two or three phones) for the other team | next turn | SWD-045, 114 |

## D. Dialogs and sheets during a game
| # | Dialog | Words | Buttons → where | Records | IDs |
|---|---|---|---|---|---|
| D1 | Clue not allowed? | "Clue not allowed? Both clue givers decide together." | Try another clue → P3 (with Keep my clue) · Turn ends, they get a word → P6 with "Clue broke a rule. One of the other team's words was turned over." · Clue rules → S5 scrolled to Clue rules, Done → back here · Let it go (main) → P4 | `brokeRule` on the second | SWD-124, 046 |
| D2 | Earlier clues | one line per clue in force, oldest first | Done → P4 | — | SWD-041 |
| D3 | Who picks this turn? | one button per guesser; Cancel | a name → P4 · Cancel → P4 | UI only | SWD-122 |
| D4 | Paused (cover) | "Paused"; the where-line (decision 3); "Tap Carry on when everyone's back." (W17 "…when you're ready.") | Carry on → the same step (guards not restarted) | — | SWD-110 |
| D5 | New board? | "New board? For when someone saw the map or the words are too hard. This board won't count. Same teams and clue givers." | New board → deal → S7 or P1 · Keep playing (main) → back | new deal | SWD-055 |
| D6 | End this game with no winner? | | End the game → G1 "Game ended. No winner." with toast "Game ended · Undo" (10 s) · Keep playing (main) → back | `endGame` when the toast expires or the screen is left; Undo → back to the step | SWD-054 |
| D7 | Players | per team: name (Rename), "Move to …" (guessers), "✕" (Remove); add row: "Player name", "Doesn't give clues", "Add to Chai Champions" / "Add to Coffee Commandos" | Done → the step; toasts "Neha joined Chai Champions" · "Zoya moved to Coffee Commandos · Undo" · "Kabir left · Undo" | `setPlayers` per change | SWD-127 |
| D7a | Who gives clues for Coffee Commandos now? | one button per eligible player | Done → removal confirmed, toast · close → cancelled | `setPlayers` | SWD-127 |
| D7b | Kabir leaves Coffee Commandos with only Om. Move someone over? (W23: "Coffee Commandos would be left with only Om. Move someone over?") | "Move Zoya over" per movable guesser; "No one can move over." | Move Zoya over → both changes · Keep Kabir (main) → D7 · End the game → D6 | `setPlayers` | SWD-127 |
| D8 | End for tonight? | "End for tonight? Tonight's tally stays in History." / mid-game "… This game won't count in the tally." | End for tonight → G2 Summary · Keep playing (main) → back | nothing yet (see G2) | SWD-060 |
| S7b | Show the map to | "Riya (Chai Champions)", "Arjun (Coffee Commandos)"; Cancel | a name → P1 + P2 for them, main "Done, hide the map" → back · Cancel → back | — | SWD-037 |

## E. After a game, after the night (host phone)

### G1. Game over
*Words:* team bar of the winner (none when ended early); "Chai Champions win!" + "All 9 words found." or "Boom! The Landmine
got Coffee Commandos." / "Game ended. No winner."; the whole map (face-down words faded in their colour); "Coffee Commandos were
1 word away!"; "Best clue: MONSOON 2 · all 2 found"; "Tonight: Chai Champions 2 · Coffee Commandos 1"; "Next clue givers:
Meena and Kabir" + "Swap"; quiet "Change players, phones or board"; quiet "End for tonight"; quiet "← Home"; main "Play
again". *Intentions:* stop, home, play on, change (all visible); help, players, Settings, History (menu). Page may scroll,
main fixed. Sizes: narrow portrait shows the sideways line instead of the board.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Play again | deal → S7 (two or three phones) or P1 (one phone), starting team drawn anew (random each deal; the tally counts won games only; the summary's "3 games" counts won and ended early; there is no tiebreak, a game night has no final) | `setClueGivers` if swapped; the deal | SWD-053 |
| Swap | S2a Clue givers sheet for the next game → Done → here, line updated | on Play again | SWD-112 |
| Change players, phones or board | S1 Who's playing? ("← Back to the game") → S2 (no "New team names") → S3 → Start the game (no read-aloud) → deal | changes recorded at the deal | SWD-112 |
| End for tonight | D8 → G2 Summary | — | SWD-060 |
| ← Home | A1 Home (game night stays unfinished) | — | SWD-111 |
| Undo (toast, after End the game, 10 s) | the step the menu was opened from | nothing recorded | SWD-054 |
| Menu → Players / How to play / Settings / History | D7 / S5 / Settings / E1 (Players here moves one guesser in one tap, no need for "Change players…") | | menu table |

### G2. Summary "Tonight's Secret Words"
*Words:* "6 players · 3 games · 31 words found"; the tally; "Clues tonight from Riya, Nana and Zoya"; quiet "Oops, keep
playing" (until recorded); quiet "← Home"; main "Play something else". Menu: only "Delete tonight's games".
*Intentions:* undo, home, play on (visible).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Oops, keep playing | the step the host came from, as it was | nothing | SWD-060 |
| ← Home | A1 Home | `endGame` (if mid-game) + `endEvening` | SWD-060 |
| Play something else | A2 picker (tonight's names kept) | same | SWD-060 |
| Reload / app hidden / 12 h | same recorded; summary shows without "Oops" | same | SWD-060, 063 |
| Menu → Delete tonight's games | D9 "Delete tonight's games? The games and tally will be lost." → Delete → A1 · Keep it (main) → here | the game night deleted | SWD-065 |

### E1. History
*Words:* "Secret Words · 3 games"; "Game 2 · Chai Champions won · Riya and Arjun gave clues" (· "(Landmine)" · "Ended early").
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| A game row | E1a: heading "Game 2 · Chai Champions won" (W23); the board with the whole map and "Clues: Chai Champions CRICKET 2 · …"; ← Back → E1 | — | SWD-064 |
| ← Back / Done | the step History was opened from, or Home | — | menu table |

## F. The map phone (a clue giver's own phone, two or three phones)

### J1. Join a game (Home's second card)
*Words:* "Join a game"; scanner "Scan a ticket or secret map"; "Type a ticket code"; Impostor's line; "Playing Secret Words?
Clue givers: scan the host's map code. Everyone else: just play along!"; quiet "I have a map code".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Scan a map QR | M1 Map phone (team names known) | saved map | SWD-133, 117 |
| I have a map code | J2 Code entry | — | SWD-002 |
| ← Back | A1 Home | — | |

### J2. Type the map code
*Words:* "Type the map code"; "Map code" (placeholder 27P-3QX8); errors "That code doesn't look right. Check it with the
host." · "This map needs a newer version of the app. Open the app once with internet, then try again."
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Open the map (7 valid characters) | M1 Map phone (no team names) | saved map (replaces the old; toast "New map. The old one was cleared.") | SWD-002, 036 |
| Open the map (bad code) | here, error shown, text kept | — | SWD-002 |
| ← Back | J1 Join screen | — | SWD-002 |

### M1. Secret Words map
*Words:* "Secret Words map"; "Chai Champions (orange) · Coffee Commandos (teal)" (from a QR); "Code 27P-3QX8 · Chai Champions
start" (or "Orange team starts"); "First words: Cricket · Bat · Monsoon"; the map grid; "Optional: tap a word once it's found to
fade it; tap again to undo. The board in the middle is always right."; "Orange list" / "Teal list" / "Whole map"; "Hide map" /
"Show map"; "Next map"; "Done with this game"; "Game over? Tap Done with this game, or Next map for the next one, or when
the host deals a new board." (decision 7); "Still looking? Tap to keep the map" (50 s); three phones, first opening only: "I
give clues for:" with "Chai Champions" / "Coffee Commandos" (decision 7; that colour's list is highlighted and listed first;
saved with the map); quiet "Clue rules" (decision 1). No main, no menu, no ↻. *Intentions:* back (← Back → Home), hide,
done, help (Clue rules). Sizes: narrow
portrait shows the sideways line instead of the grid; landscape grid left, column right; Larger text follows this phone.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| A map word | faded ↔ unfaded on this phone | `found` saved | SWD-035 |
| Orange list / Teal list / Whole map | list ↔ grid | — | SWD-120 |
| Hide map ↔ Show map · 60 s silence · app hidden | map removed ↔ shown | — | SWD-034, 121 |
| Next map | M3 dialog "Next map? Only when the host has dealt the next board." with "Next map" / "Not yet" (main) (decision 7) → the next board of the same deck, found marks cleared; toast "Next map. It should start with: Kite · Tiffin · Rain." or "That was the last map of this deck. Scan the new code." (after the host's "New board", Next map gives the right board: a replaced board uses a deal index) | saved map replaced | SWD-039 |
| Clue rules | S5 How to play, scrolled to "Clue rules", without any map; Done → here | — | decision 1 |
| I give clues for: Chai Champions / Coffee Commandos (three phones, until chosen; then quiet "Change") | here, that team's list button first | saved with the map | SWD-034, 117 |
| Done with this game | M2 "Clear this map from your phone?" | — | SWD-036 |
| ← Back | A1 Home (map kept as a saved row) | — | SWD-034 |

### M2. Dialog "Clear this map from your phone?"
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Clear map | A1 Home, no saved map | map removed | SWD-036 |
| Keep it (main) | M1 (or A1 if opened from Home's "Clear") | — | SWD-036 |

## G. The paths (the finite list for the coverage map)
Every screen-to-screen move on the host phone, one line each. Dialogs that return to the same screen are not listed.
```
A1→A2  A1→J1  A1→(resume)P1|P3|P4|P5|P6|G1|S6|S7  A1→S2(last night)  A1→M1  A1→E1
A2→S1  A2→A3  A2→(resume)…        A3→S1  A3→(resume)…
S1→S2  S1→A2  S1→G1(back to the game)
S2→S3  S2→S1  S2→S2a→S2
S3→S4  S3→S7  S3→P1  S3→S2
S4→S7  S4→P1  S4→S6  S4→S3
S6→S7  S6→P1  S6→S5→S6  S6→D5→S7|P1  S6→D4→S6  S6→A1  S6→D8→G2
S7→P3  S7→S5|D7|D5|D4|D6|D8→…  S7→A1
S7a→P3|P4|P5|P6 (back to the step)
P1→P2  P1→S5|D7|D5|D4|D6|D8  P1→A1
P2→P3  P2→P1(not Riya; app hidden)  P2→D5→P1(new board) or back to P2
P3→P4  P3→P2(see the map again)→P3  P3→P4(keep my clue)  P3→S7b→P1,P2→(back)  P3→S7a→P3  P3→menu…  P3→A1
P4→P4(reveal, own word)  P4→P6  P4→G1  P4→P5  P4→P3(change clue)  P4→D1→P3|P6|S5|P4  P4→D2|D3→P4  P4→menu…  P4→A1
P5→P4  P5→P1|P3(other team)
P6→P1|P3(other team)  P6→menu…  P6→A1
G1→S7|P1(play again)  G1→S2a→G1  G1→S1→S2→S3→S7|P1  G1→D8→G2  G1→A1  G1→(undo)P1|P3|P4|P5|P6|S7  G1→S5|D7|E1
G2→(back)any step  G2→A1  G2→A2  G2→D9→A1|G2
E1→E1a→E1  E1→(back)step|A1
J1→M1  J1→J2  J1→A1        J2→M1  J2→J2(error)  J2→J1
M1→M3→M1(next map)|M1  M1→M2→A1|M1  M1→S5→M1  M1→A1
S3→S5→S3  P1|P3|P4|P5|P6→D4(pause icon)→same
```
Rule branches to reach at least once (by scenario): SWD-043's nine result rows; SWD-046 broke a rule; SWD-050 both ways
to win; SWD-054 end the game + undo; SWD-055 new board; SWD-060 end for tonight + oops; SWD-063 12 hours; SWD-067 start
new; SWD-039 next map, last map; SWD-002 the two code errors; SWD-127 every player change incl. team of one; SWD-123 pairs
on every pair string; SWD-116 the four board-check wordings; SWD-121 the 60 s hide on both map screens; SWD-110 pause on
every step that has it; SWD-114 the three tap guards.

## H. What draft 1 showed up (answered 11 October: 1 and 2 → decision 1; 3, 5, 6, 7 confirmed as designed; 4 → "Someone else taps Reveal" wording, stays in the menu)
1. **No help on the map phone.** A clue giver on their own phone has no "How to play" or "Clue rules" (M1 has no menu). Add
   a quiet "Clue rules" on the map phone?
2. **No help during setup.** S1–S4 have no menu, so a first-time host can't open "How to play" until the read-aloud card.
   Fine if the picker card's "How to play" (Home menu) covers it; otherwise a quiet "How to play" on S3?
3. **The private map has no way to stop or go home.** By design (privacy: it exits only to the pass screen). Confirm.
4. **"Pass the pick" is menu-only.** The owner's own K38 made the picker a social cue; a buried item may never be found.
   Confirm menu-only, or show "Pass the pick" as a quiet link next to the main?
5. **Two "Undo" shapes.** Toasts with "· Undo" (teams, players, end the game) and quiet buttons named "Oops, keep …" (end
   turn, summary). Both are approved patterns; confirm the split is deliberate (toast = you did it by accident; Oops = you
   changed your mind).
6. **Game over's "← Home" is a quiet button, but mid-game Home is menu-only** ("Home (keep this game)"). Deliberate, so a
   stray tap can't leave a round? Confirm.
7. **Settings is reachable from every game menu but nowhere in setup.** Same as the other games; confirm.

## I. Draft 3 additions (scenarios version 3.6, 22 October)
| Screen | Change | IDs |
|---|---|---|
| Every map-opening route on a phone with an unfinished game night (J1 scan, J2 code, the QR link, A1 saved map) | New dialog D11 "This phone is the board. Open the map here?": quiet "Open the map here" → M1 · main "No, keep the board" → back | SWD-002, 036 (D2) |
| S3 Choices | Quiet "How to play" under the heading → S5 → Done → S3 | SWD-009 |
| S5 How to play | Rule 7 "The host phone stays at the table: it's the board."; opened from M1 "Clue rules" it opens at Clue rules and returns to M1 | SWD-011 |
| S6 Preview, S7 Scan | `pause-button` → D4 | SWD-012, 033, 110 (D5) |
| S7 Scan | Warning directly above the QR; `other-phone-line`; `mismatch-line` "Doesn't match? Scan this code again."; landscape two columns; three phones with new clue givers: "Meena and Kabir: scan this code on your phones. Riya and Arjun: tap Done with this game." | SWD-033, 116 (D1) |
| P2 Private map | Row space reserved; "Someone saw the map" at the top right; pad quiet look, 72 px while shown | SWD-031 |
| P4 Guessing | 568 × 320: guess line in the action slot until the first reveal; 160 px panel: ↻ into the menu, Pause in its place | SWD-041 |
| P1 Pass screen | Timer 120 px at 390 px wide and up | SWD-047 (D4) |
| Narrow portrait (320) | Easy board shows in portrait; Full keeps the sideways line + "Or choose the Easy board for the next game." | SWD-092 (D6) |
| M1 Map phone | Quiet "Clue rules" → S5; `my-team` (three phones) until chosen, then "I give clues for: …" + quiet "Change"; `mismatch-line`; "Hide map" pinned top right; list buttons stacked in portrait; end line "Game over: tap Done with this game. New board on the host: tap Next map." | SWD-034, 117, 120 (D3) |
| G1, M1 | Faded cells by a light fill, not opacity | SWD-051 |
| Every guarded main | Greyed look while waiting, label unchanged | SWD-114 |

**Paths added (R10):** QR link from the phone's camera → M1 (or D11 first) · bad link → J2 with the error · S7b "Show the map to" from P4, P5, P6 · D7b "End the game" → D6 → G1 · app opened after 12 hours → A1 with the night ended (SWD-063) · S3→S5→S3 · M1→S5→M1 · D11→M1|back. **Removed:** P2 → D5 → S7 (the private map is one phone only).

## J. Screens draft 3 named but did not describe (added 22 October, from the design rule checks)
### D9. Dialog "Delete tonight's games? The games and tally will be lost."
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Delete | A1 Home | the game night deleted | SWD-065 |
| Keep it (main) | G2 Summary | — | SWD-065 |

### E1a. History: one game
*Words:* h1 "Game 2 · Chai Champions won"; the board with the whole map (faded cells by SWD-051); "Clues: Chai Champions CRICKET 2 · Coffee Commandos 1 · …". No main.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| ← Back | E1 History | — | SWD-064 |

### M3. Dialog "Next map? Only when the host has dealt the next board."
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Next map (quiet) | M1 with the next map, toast | saved map replaced | SWD-039 |
| Not yet (main) | M1 unchanged | — | SWD-039 |

### D11. Dialog "This phone is the board. Open the map here?"
*Words:* "Clue givers use their own phone. To show the map on this phone, use Show the map to a clue giver in the game's menu." (one phone: "…With one phone, pass this phone to the clue giver when the game says so.")
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Open the map here (quiet) | M1 | saved map | SWD-002 |
| No, keep the board (main) | the screen the map was opened from (J1, J2 or A1); from the camera with the app closed, A1 | — | SWD-002 |

### Settings (shared with every game)
Opened from any game menu's "Settings" or Home's menu; ← Back returns to where it was opened. Contents as the app's shared Settings (Larger text, sound, tap to show); not Secret Words specific. IDs: SWD-132.

### D7 openers (paths for D7a and D7b)
D7 "✕" on a clue giver with no partner → D7a → Done → D7 (toast) · D7 "✕" leaving a team with one player → D7b → Move Zoya over → D7 | Keep Kabir → D7 | End the game → D6 → G1.

### Paths for D11 (section G additions)
```
J1→D11→M1|J1   J2→D11→M1|J2   A1→D11→M1|A1   (QR link)→D11→M1|A1
D7→D7a→D7   D7→D7b→D7|D6
```
**Stop and Home during a turn (design checks R3):** menu-only on S6, S7, P1, P3, P4 and P6 by the owner's decision of 11
October (Pause visible; Home and End in the menu). Game over and the summary show them as buttons.

## K. Prototype script (product owner, 22 October): what the tap-through shows
The first prototype rendered this map's tables literally: every alternative line of a screen at once, the *Tap* column's
descriptions as button labels ("A face-down word", "↳ blank", "A number key / ∞"), no board grid, blank names. Persona walks
on it judged the rendering, not the design. This section is the data the renderer needs to show **one real phone screen per
state**. Everything here is example content; the scenarios stay binding for behaviour.

**K1. The example game night.** Players Riya, Arjun, Meena, Kabir, Zoya, Dev, Om, Sunita. Teams: Chai Champions (orange) Riya,
Meena, Zoya, Sunita; Coffee Commandos (teal) Arjun, Kabir, Dev, Om. Clue givers Riya and Arjun. One phone unless a screen says
otherwise. Tally 2–1. Game 3, turn 4, Chai Champions' turn, clue "Cricket · 2". Choices: Full board, Whole family words,
Landmine "Lose the game" (chosen by the host over the Whole family default, K33).

**K2. The board** (Full, Chai Champions start; row by row, kind in brackets: O orange, T teal, N nobody, L Landmine):
```
Cricket(O)  Bat(T)      Monsoon(O)  Kite(N)     Tiffin(O)
Mehendi(T)  Lamp(N)     Rain(O)     Shadow(L)   Train(N)
Chai(T)     Samosa(O)   Dosa(T)     Idli(N)     Pickle(O)
Laddu(T)    Jalebi(N)   Paneer(O)   Wicket(T)   Stump(N)
Umpire(O)   Coconut(T)  Honey(N)    Century(T)  Six(O)
```
Turned over at guessing: Cricket, Rain (orange), Bat (teal), Train (nobody). Counts "7 left · 7 left".

**K3. Rendering rules for the renderer.**
1. Each screen shows **one state**: the first line of each *Words* alternative ("A / B" shows A), with names and numbers from K1.
   Lines the map marks "(when …)" show only if K1 makes them true.
2. Button labels are the screen's real labels (the quoted words in the *Tap* column), never the row's description. A row that
   stands for many buttons draws them all: "A number key / ∞" draws keys 0–9 and ∞; "A face-down word" draws the board.
3. Every screen with a board (S6, P4, P5, P6, G1, E1a, P2 map, M1) draws the 5 × 5 grid of K2, laid out by SWD-090/091, with turned
   cells in their kind colour and icon; the private map and the map phone show every kind.
4. A tap with several outcomes (a reveal; "Other team's turn"; resume) follows **K4**, never a chooser note.
5. Taps that stay on the screen change it as the map says (a picked cell gets the selected look and the main reads "Sunita: Reveal
   KITE"; "Tap to see the map" shows the map). "Carry on" closes the cover.
6. Every row the map marks as a button is a real button (Home's unfinished row and saved-map row included).
7. The phone size is the frame: 360 × 640 by default, a size switch in the grey bar; the grey bar stays out of the frame.

**K4. Which outcome a tap follows.** Reveal on Kite → "Blank word. Other team's turn next." → P6. Reveal on Samosa → "✓ Riya's clue
works! 2 guesses left." (any orange word). Reveal on Shadow → G1 with "Boom! Chai Champions hit the Landmine." heading "Coffee
Commandos win!". Reveal on a teal word → "✗ The other team's word! It counts for them." → P6. "Other team's turn" → P1 for
Arjun (Coffee Commandos). Home's unfinished row → P1 with "Welcome back." and the where-line. G1 from "End the game" shows
"Game ended. No winner." only; otherwise "Chai Champions win!" + "All 9 words found." only. P2 "Tap to see the map" → the K2
grid. D7 lists the eight players of K1 with their buttons. S5 shows the full How to play text of SWD-011 and 131.
