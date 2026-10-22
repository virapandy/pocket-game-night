# Jev read of the Secret Words prototype (visible text and buttons)

Run: 22 October 2026, tester. Prototype: main, second pass (published from b82c5e4), built locally and served on localhost; read with Playwright at 360 x 640 (all screens and dialogs on the index page) and 812 x 375 (board screens). Tools: `tests/tools/jev-proto-collect.mjs` (reads the screens), `tests/tools/jev-proto-walk.ts` (asks Jev); shots in `reports/runs/jev-proto-shots.json`. Findings only.

## Summary

- Screens and dialogs asked: 41 reads (40 at 360 x 640, 1 extra at 812 x 375 where the visible words differ). Labels asked: 199.
- **Flagged** (top pick is not the main button, P above 0.8): J2 ([text field: Map code], 0.90).
- **Report band** (not the main button, P 0.5 to 0.8): S2a (Add a partner, 0.63); D7b (Move Zoya over, 0.61).
- **Jev unsure** (top is "uncertain" or P below 0.5): A3, P3, P4, D1, D3, D5, D6, D7a, D8, S7b, M1, M2, D9, P4@812.
- **Way out not visible** (P yes below 0.5): A1 0.02; A2 0.01; A3 0.11; S6 0.04; S7 0.05; P1 0.03; P3 0.04; P4 0.03; P5 0.05; P6 0.02; D4 0.03; P4@812 0.04.
- **Purpose not clearly clear** (P yes below 0.8): S6 0.18; P2 0.79; P4 0.61; P5 0.60; P6 0.49; D2 0.21; G2 0.79; E1 0.78; P4@812 0.61.
- **Flags count** (unsure + report + FLAG + way out below 0.5): 29.
- **Labels below 0.5:** 54. Labels 0.5 to 0.8: 87.

## How the questions were asked

- State per screen given to Jev: the screen name, phone size, the visible words (board words left out), the visible buttons (the "··· Menu" button is one of them) and, as a separate field, what sits behind the menu button. Same nine questions as the 11 October map walk: (a) next button, (b) six personas, (c) way out without a menu, (d) purpose from words alone; every one a Choice with "uncertain" (the API refuses true/false and score).
- Repeated buttons are one option ("✕ (8 of these)"); the board is one option "A face-down word on the board". The main button is the one the prototype draws as the big red button; it was not told to Jev. Screens with no main button are listed but not judged.
- The prototype shows one state per screen id; states reached by tapping (for example P2 after "Tap to see the map") were not read.
- At 812 x 375 only P4 shows different words (an "Earlier:" line); S6, P5, P6, S7 and P3 read the same as at 360 x 640 and were not asked twice.

## Persona disagreements (most likely button differs from the main button)

- S1: first-time host: [text field: Add a name] (0.77); new guest: [text field: Add a name] (0.81)
- S2a: grandparent: Add a partner (0.42); child: Add a partner (0.53); first-time host: Add a partner (0.66); one-hand host: Add a partner (0.33); uncle: Add a partner (0.58); new guest: Add a partner (0.56)
- S3: grandparent: Easy (0.55); first-time host: How to play (0.47)
- S4: grandparent: Show me the board first (0.55)
- P1: first-time host: ··· Menu (0.59); uncle: Start 90-second timer (0.52)
- P4: grandparent: Change clue (0.28); first-time host: ··· Menu (0.77); new guest: ··· Menu (0.48)
- P5: first-time host: ··· Menu (0.82); new guest: ··· Menu (0.33)
- P6: first-time host: ··· Menu (0.83); new guest: ··· Menu (0.49)
- D1: grandparent: Clue rules (0.64); child: Try another clue (0.46); first-time host: Clue rules (0.87); uncle: Try another clue (0.64); new guest: Clue rules (0.48)
- D5: grandparent: New board (0.62); first-time host: New board (0.77); new guest: New board (0.60)
- D6: grandparent: End the game (0.44); first-time host: uncertain (0.40); one-hand host: End the game (0.44)
- D7b: grandparent: uncertain (0.34); child: Move Zoya over (0.56); first-time host: Move Zoya over (0.48); one-hand host: Move Zoya over (0.43); uncle: Move Zoya over (0.53); new guest: Move Zoya over (0.50)
- D8: grandparent: End for tonight (0.50); first-time host: End for tonight (0.43); one-hand host: End for tonight (0.57)
- G1: first-time host: ··· Menu (0.57); new guest: Change players, phones or board (0.30)
- J2: grandparent: [text field: Map code] (0.83); child: [text field: Map code] (0.93); first-time host: [text field: Map code] (0.84); one-hand host: [text field: Map code] (0.70); uncle: [text field: Map code] (0.83); new guest: [text field: Map code] (0.89)
- M2: first-time host: uncertain (0.48); uncle: uncertain (0.49)
- P4@812: grandparent: Change clue (0.23); child: A face-down word on the board (0.26); first-time host: ··· Menu (0.83); uncle: A face-down word on the board (0.26); new guest: ··· Menu (0.45)

## Map walk (11 Oct) vs prototype: screens in both

Columns: old top pick (map walk) | new flag | way out new | way out old | purpose new | purpose old.

| Screen | Map walk 11 Oct | Prototype | Way out new | Way out old | Purpose new | Purpose old |
|---|---|---|---|---|---|---|
| A1 | unsure | no main button (not judged) | 0.02 | 0.33 | 0.92 | 1.00 |
| A2 | top Secret Words card 0.51 | no main button (not judged) | 0.01 | 0.93 | 0.92 | 0.99 |
| A3 | unsure | Jev unsure | 0.11 | 0.79 | 0.99 | 0.99 |
| S1 | top Add a name / Enter | ok, medium (0.5 to 0.8) | 0.97 | 0.91 | 1.00 | 1.00 |
| S2 | top Next 0.76 | no | 0.98 | 0.94 | 1.00 | 1.00 |
| S2a | unsure | report (0.5 to 0.8) | 0.88 | 0.89 | 0.94 | 0.98 |
| S3 | top Two phones 0.68 | ok, medium (0.5 to 0.8) | 0.85 | 0.98 | 0.92 | 0.99 |
| S4 | top Let's play | no | 0.98 | 0.98 | 0.95 | 0.53 |
| S5 | top Done | no | 0.89 | 0.93 | 1.00 | 1.00 |
| S6 | top Start | no | 0.04 | 0.02 | 0.18 | 0.17 |
| S7 | not in the map walk | no | 0.05 | n/a | 0.97 | n/a |
| S7a | not in the map walk | no | 0.96 | n/a | 0.98 | n/a |
| P1 | top I'm Riya | ok, medium (0.5 to 0.8) | 0.03 | 0.02 | 0.96 | 0.99 |
| P2 | not in the map walk | no main button (not judged) | 0.94 | n/a | 0.79 | n/a |
| P3 | top Clue for 2: start guessing | Jev unsure | 0.04 | 0.06 | 0.92 | 0.94 |
| P4 | not in the map walk | Jev unsure | 0.03 | n/a | 0.61 | n/a |
| P5 | top Other team's turn | ok, medium (0.5 to 0.8) | 0.05 | 0.40 | 0.60 | 0.77 |
| P6 | top Other team's turn | ok, medium (0.5 to 0.8) | 0.02 | 0.22 | 0.49 | 0.77 |
| D1 | top Clue rules 0.69 | Jev unsure | 0.95 | 0.75 | 0.89 | 0.76 |
| D2 | top Done | no main button (not judged) | 0.99 | 0.99 | 0.21 | 0.70 |
| D3 | top A name (Sunita) | Jev unsure | 0.91 | 1.00 | 0.92 | 0.91 |
| D4 | top Carry on | no main button (not judged) | 0.03 | 0.07 | 0.95 | 0.97 |
| D5 | unsure | Jev unsure | 0.80 | 0.45 | 0.97 | 0.80 |
| D6 | unsure | Jev unsure | 0.98 | 0.99 | 0.97 | 0.98 |
| D7 | unsure | no main button (not judged) | 0.99 | 0.96 | 0.95 | 0.99 |
| D7a | top A player (Om) 0.76 | Jev unsure | 0.99 | 0.95 | 0.92 | 0.91 |
| D7b | unsure | report (0.5 to 0.8) | 0.89 | 0.98 | 0.88 | 0.49 |
| D8 | unsure | Jev unsure | 0.99 | 1.00 | 0.99 | 0.90 |
| S7b | top Back to the game | Jev unsure | 1.00 | 0.98 | 0.98 | 0.96 |
| G1 | unsure | ok, medium (0.5 to 0.8) | 1.00 | 1.00 | 0.97 | 1.00 |
| G2 | unsure | ok, medium (0.5 to 0.8) | 0.93 | 0.98 | 0.79 | 0.95 |
| E1 | top ← Back / Done | no main button (not judged) | 0.99 | 1.00 | 0.78 | 0.85 |
| J1 | top I have a map code 0.57 | no main button (not judged) | 1.00 | 0.96 | 0.95 | 1.00 |
| J2 | top Open the map 0.75 | FLAG | 1.00 | 0.99 | 0.99 | 0.99 |
| M1 | top A map word 0.52 | Jev unsure | 0.99 | 1.00 | 0.90 | 0.98 |
| M2 | unsure | Jev unsure | 0.98 | 0.97 | 1.00 | 0.99 |
| D9 | unsure | Jev unsure | 1.00 | 0.99 | 1.00 | 1.00 |
| E1a | top ← Back | no main button (not judged) | 1.00 | 0.99 | 0.95 | 0.24 |
| M3 | not in the map walk | ok, medium (0.5 to 0.8) | 0.93 | n/a | 0.93 | n/a |
| D11 | not in the map walk | ok, medium (0.5 to 0.8) | 0.99 | n/a | 0.96 | n/a |
| P4@812 | not in the map walk | Jev unsure | 0.04 | n/a | 0.61 | n/a |

## Per screen

### A1. Home (screen), 360 x 640

Words: ··· Menu / Host a game / Tambola, Impostor or Secret Words on this phone / Join a game / Tambola ticket or Secret Words map from the host / Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1 / Tap to resume / Secret Words map 27P-3QX8 · Tap to open

Buttons: ··· Menu · Host a game Tambola, Impostor or Secret Words on this phone · Join a game Tambola ticket or Secret Words map from the host · Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1 Tap to resume · Secret Words map 27P-3QX8 · Tap to open (no main button)

Behind the menu: History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1 Tap to resume | 0.51 | report | n/a | no main button (not judged) | 0.02 | 0.92 | none |

### A2. What shall we play? (screen), 360 x 640

Words: What shall we play? / Secret Words / Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game / Secret Words · Chai Champions v Coffee Commandos · 2–1 · Tap to resume

Buttons: Secret Words Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game · Secret Words · Chai Champions v Coffee Commandos · 2–1 · Tap to resume (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Secret Words Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game | 0.65 | report | n/a | no main button (not judged) | 0.01 | 0.92 | none |

### A3. Dialog "Start a new game night?" (dialog), 360 x 640

Words: Start a new game night? / The one from 8:40 pm (Chai Champions v Coffee Commandos, 2–1) will end. / Carry on that one / Start new

Buttons: Carry on that one · Start new (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Start new | 0.49 | unsure | n/a | Jev unsure | 0.11 | 0.99 | none |

### S1. Who's playing? (screen), 360 x 640

Words: ← Back / Who's playing? / Riya / Arjun / Meena / Kabir / Zoya / Dev / Om / Sunita / Clear list / 20 players is the most. / Next

Buttons: ← Back · Clear list · [text field: Add a name] · **Next** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Next | 0.56 | report | 0.56 | ok, medium (0.5 to 0.8) | 0.97 | 1.00 | first-time host: [text field: Add a name] (0.77); new guest: [text field: Add a name] (0.81) |

### S2. Make teams (screen), 360 x 640

Words: ← Back / Make teams / Chai Champions (4) / Orange team / Riya / Clue giver / Meena / Zoya / Sunita / Coffee Commandos (4) / Teal team / Arjun / Clue giver / Kabir / Dev / Om / Tap a name to move it to the other team. / Shuffle teams / Change clue givers / Next

Buttons: ← Back · Riya · Meena · Zoya · Sunita · Arjun · Kabir · Dev · Om · Shuffle teams · Change clue givers · **Next** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Next | 0.88 | clear | 0.88 | no | 0.98 | 1.00 | none |

### S2a. Sheet "Clue givers" (also from G1 "Swap") (sheet), 360 x 640

Words: Clue givers / Chai Champions (4) / ✓ Riya / Doesn't give clues / Meena / Doesn't give clues / Zoya / Doesn't give clues / Sunita / Doesn't give clues / Coffee Commandos (4) / ✓ Arjun / Doesn't give clues / Kabir / Doesn't give clues / Dev / Doesn't give clues / Om / Doesn't give clues / Add a partner / Each team needs someone who can give clues. / Doesn't give clues / ... (23 lines)

Buttons: Riya · Doesn't give clues [switch off] (8 of these) · Meena · Zoya · Sunita · Arjun · Kabir · Dev · Om · Add a partner · Each team needs someone who can give clues. · Doesn't give clues · **Done** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Add a partner | 0.63 | report | 0.14 | report (0.5 to 0.8) | 0.88 | 0.94 | grandparent: Add a partner (0.42); child: Add a partner (0.53); first-time host: Add a partner (0.66); one-hand host: Add a partner (0.33); uncle: Add a partner (0.58); new guest: Add a partner (0.56) |

### S3. How do you want to play? (Choices) (screen), 360 x 640

Words: ← Back / How do you want to play? / How many phones? / ✓ One phone / Two phones / Recommended / Three phones / Board / ✓ Full / Easy / Landmine / ✓ Lose the game / Lose your turn / Words / ✓ Whole family / + Harder words / How to play / Start the game

Buttons: ← Back · One phone · Two phones Recommended · Three phones · Full · Easy · Lose the game · Lose your turn · Whole family · + Harder words · How to play · **Start the game** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Start the game | 0.77 | report | 0.77 | ok, medium (0.5 to 0.8) | 0.85 | 0.92 | grandparent: Easy (0.55); first-time host: How to play (0.47) |

### S4. Read this aloud (once per session) (screen), 360 x 640

Words: ← Back / Read this aloud / Two teams, Chai Champions and Coffee Commandos. Each has a clue giver who sees the secret map. / Clue givers: say one word and a number. 'Monsoon, 2' means two of our words go with monsoon. / Guessers: talk, then turn over words one at a time. Wrong word? Your turn ends. / Find all your words first. Step on the Landmine and you lose! / Show me the board first / Let's play

Buttons: ← Back · Show me the board first · **Let's play** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Let's play | 0.85 | clear | 0.85 | no | 0.98 | 0.95 | grandparent: Show me the board first (0.55) |

### S5. How to play (menu, any game step; dispute dialog's "Clue rules") (screen), 360 x 640

Words: How to play / Read this aloud / Two teams, Chai Champions and Coffee Commandos. Each has a clue giver who sees the secret map. / Clue givers: say one word and a number. 'Monsoon, 2' means two of our words go with monsoon. / Guessers: talk, then turn over words one at a time. Wrong word? Your turn ends. / Find all your words first. Step on the Landmine and you lose! / The rules / Clue givers see the secret map. Everyone else sees only the words. / A clue is one word and one number. It must be about meaning, not spelling or where a word sits. / No faces, no pointing, no extra hints. Before the first guess, both clue givers decide together whether a clue is allowed. / Guessers take at least one guess, and up to the number plus one. 0 or ∞: as many as you like. / Your word: keep going. Nobody's word or the other team's: your turn ends. The Landmine: you lose! / First team to find all its words wins. / The host phone stays at the table: it's the board. / Clue rules / One word only. Names like Taj Mahal count as one. / About meaning: no spelling, no rhymes, no 'top left'. / Not a word on the board, or part of one. / English, or a word you'd use in English (chai, dosa). / Secret Words uses game rules inspired by Codenames, designed by Vlaada Chvátil. Codenames is a trademark of Czech Games Edition. Secret Words is an independent free game and is not made, sponsored or endorsed by Czech Games Edition. / Done

Buttons: **Done** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Done | 1.00 | clear | 1.00 | no | 0.89 | 1.00 | none |

### S6. Preview board (after "Show me the board first") (screen), 360 x 640

Words: ··· Menu / The board, before you start / Chai Champions start / 9 left / · / 8 left / ↻ / Start

Buttons: ··· Menu · ↻ · **Start** (main)

Behind the menu: How to play · New board · Pause · Home · End for tonight · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Start | 0.90 | clear | 0.90 | no | 0.04 | 0.18 | none |

### S7. Clue givers, scan your map (two or three phones; after every deal) (screen), 360 x 640

Words: ··· Menu / Clue givers, scan your map / Riya and Arjun: sit side by side and share one map phone. / QR / or type: 27P-3QX8 / Guessers: don't scan this one! / On the other phone: open the app, tap Join a game, scan this. / The map phone is ready

Buttons: ··· Menu · **The map phone is ready** (main)

Behind the menu: Players · New board · Pause · Home · End the game · End for tonight · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| The map phone is ready | 0.94 | clear | 0.94 | no | 0.05 | 0.97 | none |

### S7a. Show the map code again (menu, two or three phones, from P3 to P6) (screen), 360 x 640

Words: Clue givers, scan your map / Riya and Arjun: sit side by side and share one map phone. / QR / or type: 27P-3QX8 / Guessers: don't scan this one! / On the other phone: open the app, tap Join a game, scan this. / Back to the game

Buttons: **Back to the game** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Back to the game | 0.96 | clear | 0.96 | no | 0.96 | 0.98 | none |

### P1. Pass screen (one phone, start of each turn) (screen), 360 x 640

Words: ··· Menu / Chai Champions, your turn / Pass the phone to / RIYA / Clue giver for Chai Champions (orange) / Coffee Commandos: guess how many Riya will say! / Start 90-second timer / I'm Riya

Buttons: ··· Menu · Start 90-second timer · **I'm Riya** (main)

Behind the menu: How to play · Players · New board · Pause · Home · End the game · End for tonight · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| I'm Riya | 0.58 | report | 0.58 | ok, medium (0.5 to 0.8) | 0.03 | 0.96 | first-time host: ··· Menu (0.59); uncle: Start 90-second timer (0.52) |

### P2. Private map (one phone; also S7b "Show the map to a clue giver") (screen), 360 x 640

Words: RIYA / You give clues for Chai Champions (orange) / Only Riya should see this screen. / 7 left / · / 7 left / Tap to see the map / Not Riya? Go back

Buttons: Tap to see the map · Not Riya? Go back (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Tap to see the map | 0.80 | report | n/a | no main button (not judged) | 0.94 | 0.79 | none |

### P3. Clue screen (one phone after P2; two or three phones at the start of each turn) (screen), 360 x 640

Words: ··· Menu / Chai Champions, your turn / Riya, say your clue out loud. How many words is it for? / 0 / 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / ∞ / 2 means up to 3 guesses. 0 or ∞: as many as you like. / Heads up: Cricket is on the board. / 7 left / · / 7 left / See the map again / Start 90-second timer

Buttons: ··· Menu · 0 · 1 · 2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · ∞ · [text field: Clue word (optional)] · See the map again · Start 90-second timer (no main button)

Behind the menu: Show the map code again · How to play · Players · New board · Pause · Home · End the game · End for tonight · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.32 | unsure | n/a | Jev unsure | 0.04 | 0.92 | none |

### P4. Guessing (the board) (screen), 360 x 640

Words: ··· Menu / Chai Champions guessing / CRICKET · 2 / 3 guesses left (2 + 1 extra) / 7 left / · / 7 left / ↻ / Change clue / Clue not allowed? / Sunita: Reveal

Buttons: ··· Menu · ↻ · Change clue · Clue not allowed? · **Sunita: Reveal** (main) · A face-down word on the board

Behind the menu: How to play · Earlier clues · Start 90-second timer · Clue not allowed? · Pass the pick · Players · Show the map code again · New board · Pause · Home · End the game · End for tonight · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Sunita: Reveal | 0.32 | unsure | 0.32 | Jev unsure | 0.03 | 0.61 | grandparent: Change clue (0.28); first-time host: ··· Menu (0.77); new guest: ··· Menu (0.48) |

### P5. End-turn line (screen), 360 x 640

Words: ··· Menu / Chai Champions ended their turn. / Oops, keep guessing / Other team's turn

Buttons: ··· Menu · Oops, keep guessing · **Other team's turn** (main)

Behind the menu: How to play · Earlier clues · Players · Show the map code again · New board · Pause · Home · End the game · End for tonight · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Other team's turn | 0.52 | report | 0.52 | ok, medium (0.5 to 0.8) | 0.05 | 0.60 | first-time host: ··· Menu (0.82); new guest: ··· Menu (0.33) |

### P6. Turn over (screen), 360 x 640

Words: ··· Menu / Other team's turn

Buttons: ··· Menu · **Other team's turn** (main)

Behind the menu: How to play · Earlier clues · Players · Show the map code again · New board · Pause · Home · End the game · End for tonight · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Other team's turn | 0.76 | report | 0.76 | ok, medium (0.5 to 0.8) | 0.02 | 0.49 | first-time host: ··· Menu (0.83); new guest: ··· Menu (0.49) |

### D1. Clue not allowed? (dialog), 360 x 640

Words: Clue not allowed? Both clue givers decide together. / Try another clue / Turn ends, they get a word / Clue rules / Let it go

Buttons: Try another clue · Turn ends, they get a word · Clue rules · **Let it go** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Clue rules | 0.40 | unsure | 0.14 | Jev unsure | 0.95 | 0.89 | grandparent: Clue rules (0.64); child: Try another clue (0.46); first-time host: Clue rules (0.87); uncle: Try another clue (0.64); new guest: Clue rules (0.48) |

### D2. Earlier clues (dialog), 360 x 640

Words: Earlier clues / Done

Buttons: Done (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Done | 0.99 | clear | n/a | no main button (not judged) | 0.99 | 0.21 | none |

### D3. Who picks this turn? (dialog), 360 x 640

Words: Who picks this turn? / Meena / Zoya / Sunita / Cancel

Buttons: Meena · Zoya · Sunita · Cancel (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.83 | clear | n/a | Jev unsure | 0.91 | 0.92 | none |

### D4. Paused (cover) (dialog), 360 x 640

Words: Paused / Turn 4 · Chai Champions' clue / Tap Carry on when everyone's back. / Carry on

Buttons: Carry on (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Carry on | 0.98 | clear | n/a | no main button (not judged) | 0.03 | 0.95 | none |

### D5. New board? (dialog), 360 x 640

Words: New board? For when someone saw the map or the words are too hard. This board won't count. Same teams and clue givers. / New board / Keep playing

Buttons: New board · **Keep playing** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| New board | 0.38 | unsure | 0.36 | Jev unsure | 0.80 | 0.97 | grandparent: New board (0.62); first-time host: New board (0.77); new guest: New board (0.60) |

### D6. End this game with no winner? (dialog), 360 x 640

Words: End this game with no winner? / End the game / Keep playing

Buttons: End the game · **Keep playing** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.47 | unsure | 0.16 | Jev unsure | 0.98 | 0.97 | grandparent: End the game (0.44); first-time host: uncertain (0.40); one-hand host: End the game (0.44) |

### D7. Players (dialog), 360 x 640

Words: Players / Chai Champions (4) / Riya / ✕ / Meena / Move to Coffee Commandos / ✕ / Zoya / Move to Coffee Commandos / ✕ / Sunita / Move to Coffee Commandos / ✕ / Coffee Commandos (4) / Arjun / ✕ / Kabir / Move to Chai Champions / ✕ / Dev / Move to Chai Champions / ✕ / ... (29 lines)

Buttons: Riya · ✕ (8 of these) · Meena · Move to Coffee Commandos (3 of these) · Zoya · Sunita · Arjun · Kabir · Move to Chai Champions (3 of these) · Dev · Om · Done (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Done | 0.77 | report | n/a | no main button (not judged) | 0.99 | 0.95 | none |

### D7a. Who gives clues for Coffee Commandos now? (dialog), 360 x 640

Words: Who gives clues for Coffee Commandos now? / Arjun / Kabir / Dev / Om / Done

Buttons: Arjun · Kabir · Dev · Om · Done (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.59 | report | n/a | Jev unsure | 0.99 | 0.92 | none |

### D7b. Kabir leaves Coffee Commandos with only Om. Move someone over? (W23: "Coffee Commandos would be left with only Om. Move someone over?") (dialog), 360 x 640

Words: Kabir leaves Coffee Commandos with only Om. Move someone over? / Move Zoya over / No one can move over. / End the game / Keep Kabir

Buttons: Move Zoya over · End the game · **Keep Kabir** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Move Zoya over | 0.61 | report | 0.13 | report (0.5 to 0.8) | 0.89 | 0.88 | grandparent: uncertain (0.34); child: Move Zoya over (0.56); first-time host: Move Zoya over (0.48); one-hand host: Move Zoya over (0.43); uncle: Move Zoya over (0.53); new guest: Move Zoya over (0.50) |

### D8. End for tonight? (dialog), 360 x 640

Words: End for tonight? Tonight's tally stays in History. / End for tonight / Keep playing

Buttons: End for tonight · **Keep playing** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.47 | unsure | 0.21 | Jev unsure | 0.99 | 0.99 | grandparent: End for tonight (0.50); first-time host: End for tonight (0.43); one-hand host: End for tonight (0.57) |

### S7b. Show the map to (dialog), 360 x 640

Words: Show the map to / Riya (Chai Champions) / Arjun (Coffee Commandos) / Cancel

Buttons: Riya (Chai Champions) · Arjun (Coffee Commandos) · Cancel (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.67 | report | n/a | Jev unsure | 1.00 | 0.98 | none |

### G1. Game over (screen), 360 x 640

Words: ··· Menu / Chai Champions win! / All 9 words found. / Coffee Commandos were 1 word away! / Best clue: MONSOON 2 · all 2 found / Tonight: Chai Champions 2 · Coffee Commandos 1 / Next clue givers: Meena and Kabir / Swap / Change players, phones or board / End for tonight / ← Home / Play again

Buttons: ··· Menu · Swap · Change players, phones or board · End for tonight · ← Home · **Play again** (main)

Behind the menu: Players · How to play · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Play again | 0.64 | report | 0.64 | ok, medium (0.5 to 0.8) | 1.00 | 0.97 | first-time host: ··· Menu (0.57); new guest: Change players, phones or board (0.30) |

### G2. Summary "Tonight's Secret Words" (screen), 360 x 640

Words: ··· Menu / Tonight's Secret Words / 6 players · 3 games · 31 words found / Clues tonight from Riya, Nana and Zoya / ← Home / Play something else

Buttons: ··· Menu · ← Home · **Play something else** (main)

Behind the menu: Delete tonight's games

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Play something else | 0.79 | report | 0.79 | ok, medium (0.5 to 0.8) | 0.93 | 0.79 | none |

### E1. History (screen), 360 x 640

Words: ← Back / Secret Words · 3 games / Game 2 · Chai Champions won · Riya and Arjun gave clues

Buttons: ← Back · Game 2 · Chai Champions won · Riya and Arjun gave clues (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| ← Back | 0.59 | report | n/a | no main button (not judged) | 0.99 | 0.78 | none |

### J1. Join a game (Home's second card) (screen), 360 x 640

Words: ← Back / Join a game / Scan a ticket or secret map / Type a ticket code / Playing Secret Words? Clue givers: scan the host's map code. Everyone else: just play along! / I have a map code

Buttons: ← Back · Scan a ticket or secret map · I have a map code (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| I have a map code | 0.54 | report | n/a | no main button (not judged) | 1.00 | 0.95 | none |

### J2. Type the map code (screen), 360 x 640

Words: ← Back / Type the map code / Map code / Open the map

Buttons: ← Back · [text field: Map code] · **Open the map** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| [text field: Map code] | 0.90 | clear | 0.08 | FLAG | 1.00 | 0.99 | grandparent: [text field: Map code] (0.83); child: [text field: Map code] (0.93); first-time host: [text field: Map code] (0.84); one-hand host: [text field: Map code] (0.70); uncle: [text field: Map code] (0.83); new guest: [text field: Map code] (0.89) |

### M1. Secret Words map (screen), 360 x 640

Words: ← Back / Secret Words map / Chai Champions (orange) · Coffee Commandos (teal) / Code 27P-3QX8 · Chai Champions start / First words: Cricket · Bat · Monsoon / Optional: tap a word once it's found to fade it; tap again to undo. The board in the middle is always right. / Orange list / Hide map / Next map / Done with this game / Game over? Tap Done with this game, or Next map for the next one, or when the host deals a new board. / Still looking? Tap to keep the map / Chai Champions (4) / Riya / Meena / Zoya / Sunita / Coffee Commandos (4) / Arjun / Kabir / Dev / Om / ... (26 lines)

Buttons: ← Back · Orange list · Hide map · Next map · Done with this game · Clue rules · Teal list · Whole map · I give clues for: Chai Champions · A face-down word on the board (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.22 | unsure | n/a | Jev unsure | 0.99 | 0.90 | none |

### M2. Dialog "Clear this map from your phone?" (dialog), 360 x 640

Words: Clear this map from your phone? / Clear map / Keep it

Buttons: Clear map · **Keep it** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.63 | report | 0.19 | Jev unsure | 0.98 | 1.00 | first-time host: uncertain (0.48); uncle: uncertain (0.49) |

### D9. Dialog "Delete tonight's games? The games and tally will be lost." (dialog), 360 x 640

Words: Delete tonight's games? The games and tally will be lost. / Delete / Keep it

Buttons: Delete · **Keep it** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.56 | report | 0.34 | Jev unsure | 1.00 | 1.00 | none |

### E1a. History: one game (screen), 360 x 640

Words: ← Back / Game 2 · Chai Champions won / Clues: Chai Champions CRICKET 2 · Coffee Commandos 1

Buttons: ← Back (no main button)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| ← Back | 0.98 | clear | n/a | no main button (not judged) | 1.00 | 0.95 | none |

### M3. Dialog "Next map? Only when the host has dealt the next board." (dialog), 360 x 640

Words: Next map? Only when the host has dealt the next board. / Next map / Not yet

Buttons: Next map · **Not yet** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Not yet | 0.79 | report | 0.79 | ok, medium (0.5 to 0.8) | 0.93 | 0.93 | none |

### D11. Dialog "This phone is the board. Open the map here?" (dialog), 360 x 640

Words: This phone is the board. Open the map here? / Clue givers use their own phone. To show the map on this phone, use Show the map to a clue giver in the game's menu. / Open the map here / No, keep the board

Buttons: Open the map here · **No, keep the board** (main)

Behind the menu: no menu button

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| No, keep the board | 0.66 | report | 0.66 | ok, medium (0.5 to 0.8) | 0.99 | 0.96 | none |

### P4@812. Guessing (the board) (screen, wide), 812 x 375

Words: ··· Menu / Chai Champions guessing / CRICKET · 2 / 3 guesses left (2 + 1 extra) / Earlier: MONSOON 2 · 1 · RAIN ∞ / 7 left / · / 7 left / ↻ / Change clue / Clue not allowed? / Sunita: Reveal

Buttons: ··· Menu · ↻ · Change clue · Clue not allowed? · **Sunita: Reveal** (main) · A face-down word on the board

Behind the menu: How to play · Earlier clues · Start 90-second timer · Clue not allowed? · Pass the pick · Players · Show the map code again · New board · Pause · Home · End the game · End for tonight · Settings · History

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Sunita: Reveal | 0.28 | unsure | 0.28 | Jev unsure | 0.04 | 0.61 | grandparent: Change clue (0.23); child: A face-down word on the board (0.26); first-time host: ··· Menu (0.83); uncle: A face-down word on the board (0.26); new guest: ··· Menu (0.45) |

## Labels below 0.5 ("would most Indian families, including a non-Hindi speaker from Tirunelveli, understand this at once?")

| Label | P yes | Top answer |
|---|---|---|
| or type: 27P-3QX8 | 0.04 | no |
| Kabir leaves Coffee Commandos with only Om. Move someone over? | 0.05 | no |
| Teal list | 0.08 | no |
| Keep Kabir | 0.09 | no |
| Move to Coffee Commandos | 0.12 | no |
| The one from 8:40 pm (Chai Champions v Coffee Commandos, 2–1) will end. | 0.15 | no |
| Who gives clues for Coffee Commandos now? | 0.15 | no |
| Arjun (Coffee Commandos) | 0.17 | no |
| Tambola ticket or Secret Words map from the host | 0.18 | no |
| Next map? Only when the host has dealt the next board. | 0.18 | no |
| Tambola, Impostor or Secret Words on this phone | 0.19 | no |
| Coffee Commandos: guess how many Riya will say! | 0.21 | no |
| Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game | 0.23 | no |
| Teal team | 0.24 | no |
| The host phone stays at the table: it's the board. | 0.24 | no |
| Map code | 0.24 | no |
| Code 27P-3QX8 · Chai Champions start | 0.25 | no |
| Secret Words uses game rules inspired by Codenames, designed by Vlaada Chvátil. Codenames is a trademark of Czech Games Edition. Secret Words is an independent free game and is not made, sponsored or endorsed by Czech Games Edition. | 0.26 | no |
| Coffee Commandos were 1 word away! | 0.26 | no |
| Coffee Commandos (4) | 0.28 | no |
| Tap Carry on when everyone's back. | 0.28 | no |
| This phone is the board. Open the map here? | 0.28 | no |
| Pass the pick | 0.30 | no |
| Playing Secret Words? Clue givers: scan the host's map code. Everyone else: just play along! | 0.30 | no |
| Clue giver for Chai Champions (orange) | 0.31 | no |
| Guessers take at least one guess, and up to the number plus one. 0 or ∞: as many as you like. | 0.32 | no |
| Orange list | 0.32 | no |
| QR | 0.34 | no |
| Move to Chai Champions | 0.35 | no |
| End for tonight? Tonight's tally stays in History. | 0.35 | no |
| Secret Words map | 0.35 | no |
| The map phone is ready | 0.36 | no |
| Move Zoya over | 0.37 | no |
| Optional: tap a word once it's found to fade it; tap again to undo. The board in the middle is always right. | 0.37 | no |
| Type the map code | 0.38 | no |
| Landmine | 0.39 | no |
| Clue givers, scan your map | 0.40 | no |
| Guessers: don't scan this one! | 0.40 | no |
| Heads up: Cricket is on the board. | 0.40 | no |
| Carry on that one | 0.42 | no |
| Change clue givers | 0.43 | no |
| A clue is one word and one number. It must be about meaning, not spelling or where a word sits. | 0.43 | no |
| Add to Chai Champions | 0.43 | no |
| Tonight: Chai Champions 2 · Coffee Commandos 1 | 0.43 | no |
| Scan a ticket or secret map | 0.43 | no |
| I have a map code | 0.43 | no |
| Secret Words map 27P-3QX8 · Tap to open | 0.44 | no |
| Clue givers: say one word and a number. 'Monsoon, 2' means two of our words go with monsoon. | 0.44 | no |
| You give clues for Chai Champions (orange) | 0.44 | no |
| Riya (Chai Champions) | 0.44 | no |
| Tap a name to move it to the other team. | 0.45 | no |
| Your word: keep going. Nobody's word or the other team's: your turn ends. The Landmine: you lose! | 0.46 | no |
| Swap | 0.46 | no |
| New board? For when someone saw the map or the words are too hard. This board won't count. Same teams and clue givers. | 0.49 | no |

Labels in the 0.5 to 0.8 band (report): 87: Host a game (0.52); Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1 (0.60); Tap to resume (0.77); Secret Words · Chai Champions v Coffee Commandos · 2–1 · Tap to resume (0.58); Start a new game night? (0.69); Who's playing? (0.79); Clear list (0.64); 20 players is the most. (0.64); Chai Champions (4) (0.66); Clue giver (0.55); Shuffle teams (0.62); Clue givers (0.57); Doesn't give clues (0.69); Add a partner (0.74); Each team needs someone who can give clues. (0.76); Recommended (0.64); Board (0.80); Lose your turn (0.65); Two teams, Chai Champions and Coffee Commandos. Each has a clue giver who sees the secret map. (0.60); Guessers: talk, then turn over words one at a time. Wrong word? Your turn ends. (0.56); Find all your words first. Step on the Landmine and you lose! (0.61); Show me the board first (0.73); Clue givers see the secret map. Everyone else sees only the words. (0.63); No faces, no pointing, no extra hints. Before the first guess, both clue givers decide together whether a clue is allowed. (0.51); Clue rules (0.64); One word only. Names like Taj Mahal count as one. (0.69); About meaning: no spelling, no rhymes, no 'top left'. (0.59); Not a word on the board, or part of one. (0.60); English, or a word you'd use in English (chai, dosa). (0.80); The board, before you start (0.52); Chai Champions start (0.56); 8 left (0.80); New board (0.58); End for tonight (0.77); Settings (0.75); Riya and Arjun: sit side by side and share one map phone. (0.51); On the other phone: open the app, tap Join a game, scan this. (0.67); Chai Champions, your turn (0.64); Pass the phone to (0.79); RIYA (0.50); Only Riya should see this screen. (0.80); Not Riya? Go back (0.69); Riya, say your clue out loud. How many words is it for? (0.75); 2 means up to 3 guesses. 0 or ∞: as many as you like. (0.60); Show the map code again (0.53); Chai Champions guessing (0.62); Change clue (0.56); Clue not allowed? (0.79); Sunita: Reveal (0.59); Earlier clues (0.72); Chai Champions ended their turn. (0.51); Oops, keep guessing (0.78); Other team's turn (0.80); Clue not allowed? Both clue givers decide together. (0.64); Turn ends, they get a word (0.64); Let it go (0.65); Who picks this turn? (0.71); Turn 4 · Chai Champions' clue (0.57); Carry on (0.54); End this game with no winner? (0.67); No one can move over. (0.62); Show the map to (0.75); Chai Champions win! (0.70); Best clue: MONSOON 2 · all 2 found (0.65); Next clue givers: Meena and Kabir (0.61); Change players, phones or board (0.60); Tonight's Secret Words (0.79); Clues tonight from Riya, Nana and Zoya (0.56); Delete tonight's games (0.70); Secret Words · 3 games (0.80); Game 2 · Chai Champions won · Riya and Arjun gave clues (0.68); Type a ticket code (0.64); Chai Champions (orange) · Coffee Commandos (teal) (0.59); Hide map (0.58); Next map (0.77); Game over? Tap Done with this game, or Next map for the next one, or when the host deals a new board. (0.59); Still looking? Tap to keep the map (0.60); Whole map (0.60); I give clues for: Chai Champions (0.65); Clear this map from your phone? (0.59); Clear map (0.69); Delete tonight's games? The games and tally will be lost. (0.76); Delete (0.80); Game 2 · Chai Champions won (0.58); Clues: Chai Champions CRICKET 2 · Coffee Commandos 1 (0.50); Clue givers use their own phone. To show the map on this phone, use Show the map to a clue giver in the game's menu. (0.50); No, keep the board (0.65). Labels not answered: 0.

## Decisions used

- 577 decisions, 52 calls (41 reads x 9 questions, 199 labels). Weekly cap in the client 50,000; used this ISO week after the job: 1803.
- Skipped for cap or tool: nothing.

## Tool faults (apart from findings, PLT-122)

- None: every call answered on the first try.
- Noted: Choice questions only (as on 11 October). The collector reads screens as the browser shows them; a screen whose text is drawn only after a tap is not seen.

## Map walk (11 Oct) vs prototype: flags that changed (tester summary, written after the table above)

The old ids are those of map draft 1, the new ones draft 2; the comparison table matches by id only, so a few rows compare screens whose content was reshaped (P3, P5, P6, S6, S7). Read it as a pointer, not a proof.

- **Fixed (no longer flagged):** S1 (was flagged: Jev wanted "Add a name / Enter"; now fine, top pick is the main button or the name field, medium); S3 (Two phones 0.68, now ok); G1 and G2 (were unsure, now medium); S4 purpose 0.53 to 0.95; D7b purpose 0.49 to 0.88; E1a purpose 0.24 to 0.95; D5 way out 0.45 to 0.80; D1 purpose 0.76 to 0.89; D7 and A1 no longer judged (no main button drawn).
- **Still flagged:** A3, D5, D6, D8, D9, M2 (two-button dialogs: Jev answers "uncertain" with no sight of the screen behind; same as 11 Oct, so a reading artefact more than a screen fault); S6, P1, P3, P5, P6, D4 (way out only in the menu, by design); S6 purpose 0.18 (the preview board is words only in the prototype: a board with a "Start" line).
- **New flags:** J2 (Jev picks the "Map code" field before "Open the map", 0.90; reading: typing comes first, so this is probably right, a field is not a button); P3 and P4 (top is "uncertain" or low; P4 has 25 board cells, a menu and four buttons, and Jev gives "Sunita: Reveal" only 0.32 at 360 x 640); D1, D3, D7a, S7b, M1 (top is "uncertain" or a low pick, where 11 Oct they were medium or named); A2 way out 0.93 to 0.01 (the prototype's A2 has no "← Back" on the screen, only the two cards; the map had one); A3 way out 0.79 to 0.11; A1 way out 0.33 to 0.02; P5 purpose 0.77 to 0.60 and P6 0.77 to 0.49 (the screens show only "Other team's turn" with the menu button); D2 purpose 0.70 to 0.21 (the prototype draws "Earlier clues" and "Done" with no clue lines).
- **Unchanged bad:** the way-out-hidden group (P1, P3, P4, P5, P6, D4, S6), unchanged since 11 Oct because the map puts stop and home in the menu on purpose.

## Reading notes (tester, not Jev)

- Two-button dialogs again read "uncertain" at the top; Jev sees only the dialog words.
- J2: the "FLAG" is the text field beating the main button; it is the natural first step, not a fault.
- Prototype states reached by tapping were not read (P2 after the tap, P4 after the first reveal, S7 with two or three phones); the 11 October walk split these as P2a/P2b, P4a/P4b, S7a2/S7a3, so those rows have no counterpart here.
- Collector note: the first index read picked up the "Map problems" link list and counted S6 twice; fixed in `tests/tools/jev-proto-collect.mjs`, and the saved shots were de-duplicated. The first Jev run therefore also asked S6 twice (9 wasted decisions, inside the cap).
