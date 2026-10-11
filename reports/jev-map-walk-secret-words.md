# Jev read of the Secret Words screen map (draft 1)

Run: 11 October 2026, tester. Map: `docs/games/secret-words/screen-map.md` draft 1. Tool: `tests/tools/jev-map-walk.ts` (one-off, not a test). Findings only: nothing in the map or scenarios was changed.

## Summary

- Screens and dialogs asked: 41 of 41. Labels asked: 223.
- **Flagged** (Jev's most likely button is not the main button, P above 0.8): S1 (Add a name / Enter, 0.83).
- **Report band** (not the main button, P 0.5 to 0.8): S3 (Two phones, 0.68); D1 (Clue rules, 0.69); D7a (A player (Om), 0.76).
- **Jev unsure** (top choice "uncertain" or P below 0.5): A1, A3, S2a, P2b, P4b, D5, D6, D7, D7b, D8, D9, G1, G2, M2.
- **Way out not visible** (P yes below 0.5): A1 0.33; S6 0.02; S7a2 0.02; S7a3 0.01; P1 0.02; P3 0.06; P4a 0.02; P5 0.40; P6 0.22; D4 0.07; D5 0.45.
- **Purpose not clearly clear** (P yes below 0.8): S4 0.53; S6 0.17; P2a 0.42; P2b 0.69; P5 0.77; P6 0.77; D1 0.76; D2 0.70; D7b 0.49; E1a 0.24.
- **Labels below 0.5:** 44. Labels 0.5 to 0.8: 92.

## How the questions were asked

- Every screen: one call with 9 questions. (a) Choice among the visible buttons plus "uncertain"; (b) the same Choice six times, once per persona (grandparent with weak English, 10-year-old, first-time host, distracted host with one hand, competitive uncle who knows the rules, guest who just opened the link); (c) way out, yes/no/uncertain; (d) purpose, yes/no/uncertain. State given to Jev: the screen name, the map's Words line and the visible buttons (menu items left out).
- **"Noul" was run as a Choice with yes / no / uncertain.** The Jev client only supports Choice. A probe on 11 October showed the API refuses a `boolean` question ("Invalid request") and a `score` question needs a `criteria` field the client does not model, so true/false and score are not confirmed (the open item in `docs/proposals/e2e-and-jev-testing.md`). Probabilities below are the "yes" share.
- Bands: above 0.8 clear; 0.5 to 0.8 report; below 0.5 or "uncertain" is Jev unsure. Flag: top option is not the main button with P above 0.8. Screens with no main button in the map (A3, D3, D10, E1, E1a, J1, M1) are listed with their numbers but not judged; the map names no "obvious next step" for them.
- Screens with several states are split as the map splits them: S7 two phones (S7a2) and three phones (S7a3), S7a shown as S7b (the map code again), P2 hidden (P2a) and shown (P2b), P4 before (P4a) and after (P4b) the first reveal, Show the map to as D10. State detail not in the map (for example whether the saved-map row on Home is present) was shown as the map lists it, all rows at once on A1, so Home's answers are for a Home that shows every row.
- Buttons with a variable part (a name, a number) are named by one example (Riya, Sunita, KITE, 2).

## Reading notes (tester, not Jev)

- S1: "Add a name / Enter" is the step before Next on a screen that is still filling up, so Jev picking it is likely the map showing a list already filled in without saying so; read it as a state-description gap, not a screen fault.
- Low "way out" answers on the pass, scan, clue, guessing and turn-over screens match the map's own Intentions lines (stop, home and pause are in the menu there by design); the map phone and private map are by design (map section H, items 1 and 3).
- Dialogs with two buttons (D5, D6, D8, D9, M2) often show "uncertain" at the top: Jev was shown only the dialog words and button names, with no sight of the screen behind it.
- Every probability is one Jev answer per question (no repeats), so a value near a band edge may move on a re-run.

## Persona disagreements (most likely button differs from the main button)

- A1: grandparent: uncertain (0.26); uncle: Play again with these teams (0.37); new guest: Join a game (0.95)
- A2: grandparent: Resume card (0.42); one-hand host: Resume card (0.74); uncle: Resume card (0.79)
- S1: grandparent: Add a name / Enter (0.77); child: Add a name / Enter (0.92); first-time host: Add a name / Enter (0.95); one-hand host: Add a name / Enter (0.63); uncle: Add a name / Enter (0.73); new guest: Add a name / Enter (0.92)
- S2: one-hand host: Shuffle teams (0.44)
- S2a: grandparent: Doesn't give clues (switch) (0.87); child: Add a partner (0.37); first-time host: A player (0.73); uncle: Add a partner (0.31); new guest: A player (0.78)
- S3: grandparent: Board: Easy (0.70); child: Two phones (0.55); first-time host: Two phones (0.71); one-hand host: Two phones (0.75); uncle: Words: + Harder words (0.33); new guest: Two phones (0.56)
- S4: grandparent: Show me the board first (0.72); first-time host: Show me the board first (0.90)
- S7a3: grandparent: uncertain (0.59)
- P2a: new guest: Not Riya? Go back (0.97)
- P2b: first-time host: Our words / Whole map (0.35); one-hand host: Tap to hide (0.72)
- P4a: grandparent: A face-down word (0.31); child: A face-down word (0.61); uncle: A face-down word (0.48); new guest: A face-down word (0.49)
- P4b: new guest: uncertain (0.28)
- D1: grandparent: Clue rules (0.70); child: Clue rules (0.66); first-time host: Clue rules (0.97); one-hand host: Clue rules (0.26); uncle: Try another clue (0.40); new guest: Clue rules (0.70)
- D5: grandparent: New board (0.91); child: New board (0.47); first-time host: New board (0.72); new guest: New board (0.77)
- D6: grandparent: uncertain (0.61); first-time host: uncertain (0.46); one-hand host: End the game (0.35)
- D7: child: uncertain (0.56); first-time host: uncertain (0.45); new guest: uncertain (0.43)
- D7a: child: A player (Om) (0.53); first-time host: A player (Om) (0.62); uncle: A player (Om) (0.67)
- D7b: grandparent: uncertain (0.40); child: Move Zoya over (0.38); first-time host: uncertain (0.33); one-hand host: Move Zoya over (0.31); new guest: Move Zoya over (0.44)
- D8: grandparent: uncertain (0.48); child: uncertain (0.47); first-time host: uncertain (0.43); one-hand host: End for tonight (0.55)
- G1: grandparent: End for tonight (0.53); first-time host: Change players, phones or board (0.51); one-hand host: End for tonight (0.45); new guest: Change players, phones or board (0.41)
- G2: grandparent: ← Home (0.43); child: Oops, keep playing (0.37); first-time host: ← Home (0.70); one-hand host: Oops, keep playing (0.63); new guest: ← Home (0.55)
- J2: grandparent: ← Back (0.44)
- M2: uncle: uncertain (0.51)

## Per screen

### A1. Home

Main button: Host a game. Buttons: Host a game · Join a game · Unfinished game row (Tap to resume) · Play again with these teams · Saved map row (Open) · Clear (saved map).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Host a game | 0.41 | unsure | 0.41 | Jev unsure | 0.33 | 1.00 | grandparent: uncertain (0.26); uncle: Play again with these teams (0.37); new guest: Join a game (0.95) |

### A2. What shall we play?

Main button: Secret Words card. Buttons: Secret Words card · Resume card · ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Secret Words card | 0.51 | report | 0.51 | ok, medium (0.5 to 0.8) | 0.93 | 0.99 | grandparent: Resume card (0.42); one-hand host: Resume card (0.74); uncle: Resume card (0.79) |

### A3. Dialog: Start a new game night?

Main button: (none). Buttons: Carry on that one · Start new (ends that one).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.57 | report | n/a | Jev unsure | 0.79 | 0.99 | none |

### S1. Who's playing?

Main button: Next. Buttons: Add a name / Enter · Clear list · Next · ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Add a name / Enter | 0.83 | clear | 0.12 | FLAG | 0.91 | 1.00 | grandparent: Add a name / Enter (0.77); child: Add a name / Enter (0.92); first-time host: Add a name / Enter (0.95); one-hand host: Add a name / Enter (0.63); uncle: Add a name / Enter (0.73); new guest: Add a name / Enter (0.92) |

### S2. Make teams

Main button: Next. Buttons: A name (Move Om to Coffee Commandos) · Undo (toast) · Shuffle teams · New team names · Change clue givers · Next · ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Next | 0.76 | report | 0.76 | ok, medium (0.5 to 0.8) | 0.94 | 1.00 | one-hand host: Shuffle teams (0.44) |

### S2a. Sheet: Clue givers

Main button: Done. Buttons: A player · Add a partner · Remove partner · Doesn't give clues (switch) · Done.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Add a partner | 0.40 | unsure | 0.10 | Jev unsure | 0.89 | 0.98 | grandparent: Doesn't give clues (switch) (0.87); child: Add a partner (0.37); first-time host: A player (0.73); uncle: Add a partner (0.31); new guest: A player (0.78) |

### S3. How do you want to play?

Main button: Start the game. Buttons: One phone · Two phones · Three phones · Board: Full · Board: Easy · Landmine: Lose the game · Landmine: Lose your turn · Words: Whole family · Words: + Harder words · Start the game · ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Two phones | 0.68 | report | 0.11 | report (0.5 to 0.8) | 0.98 | 0.99 | grandparent: Board: Easy (0.70); child: Two phones (0.55); first-time host: Two phones (0.71); one-hand host: Two phones (0.75); uncle: Words: + Harder words (0.33); new guest: Two phones (0.56) |

### S4. Read this aloud

Main button: Let's play. Buttons: Let's play · Show me the board first · ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Let's play | 0.93 | clear | 0.93 | no | 0.98 | 0.53 | grandparent: Show me the board first (0.72); first-time host: Show me the board first (0.90) |

### S5. How to play

Main button: Done. Buttons: Done.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Done | 1.00 | clear | 1.00 | no | 0.93 | 1.00 | none |

### S6. Preview board

Main button: Start. Buttons: Start · ↻ (flip).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Start | 0.92 | clear | 0.92 | no | 0.02 | 0.17 | none |

### S7a2. Clue givers, scan your map (two phones)

Main button: The map phone is ready. Buttons: The map phone is ready.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| The map phone is ready | 0.99 | clear | 0.99 | no | 0.02 | 0.97 | none |

### S7a3. Clue givers, scan your map (three phones)

Main button: Both have the map. Buttons: Both have the map.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Both have the map | 0.93 | clear | 0.93 | no | 0.01 | 0.98 | grandparent: uncertain (0.59) |

### S7b. Show the map code again

Main button: Back to the game. Buttons: Back to the game.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Back to the game | 0.99 | clear | 0.99 | no | 0.98 | 0.96 | none |

### P1. Pass screen (one phone)

Main button: I'm Riya. Buttons: I'm Riya · Start 90-second timer.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| I'm Riya | 0.89 | clear | 0.89 | no | 0.02 | 0.99 | none |

### P2a. Private map, hidden (one phone)

Main button: Tap to see the map. Buttons: Tap to see the map · Not Riya? Go back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Tap to see the map | 0.89 | clear | 0.89 | no | 0.99 | 0.42 | new guest: Not Riya? Go back (0.97) |

### P2b. Private map, shown (one phone)

Main button: I have my clue. Buttons: Tap to hide · Our words / Whole map · ↻ Flip · Someone saw the map · I have my clue.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| I have my clue | 0.46 | unsure | 0.46 | Jev unsure | 0.82 | 0.69 | first-time host: Our words / Whole map (0.35); one-hand host: Tap to hide (0.72) |

### P3. Clue screen

Main button: Clue for 2: start guessing. Buttons: A number key (0-9 or ∞) · Clue for 2: start guessing · See the map again (one phone) · Keep my clue (after Change clue) · Start 90-second timer.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Clue for 2: start guessing | 0.90 | clear | 0.90 | no | 0.06 | 0.94 | none |

### P4a. Guessing, before the first reveal

Main button: Sunita: Reveal KITE. Buttons: A face-down word · Sunita: Reveal KITE · Change clue · Clue not allowed? · ↻.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Sunita: Reveal KITE | 0.50 | report | 0.50 | ok, medium (0.5 to 0.8) | 0.02 | 0.93 | grandparent: A face-down word (0.31); child: A face-down word (0.61); uncle: A face-down word (0.48); new guest: A face-down word (0.49) |

### P4b. Guessing, after the first reveal

Main button: Sunita: Reveal KITE. Buttons: A face-down word · Sunita: Reveal KITE · End our turn · ↻.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Sunita: Reveal KITE | 0.42 | unsure | 0.42 | Jev unsure | 0.91 | 0.83 | new guest: uncertain (0.28) |

### P5. End-turn line

Main button: Other team's turn. Buttons: Oops, keep guessing · Other team's turn.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Other team's turn | 0.93 | clear | 0.93 | no | 0.40 | 0.77 | none |

### P6. Turn over

Main button: Other team's turn. Buttons: Other team's turn.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Other team's turn | 1.00 | clear | 1.00 | no | 0.22 | 0.77 | none |

### D1. Dialog: Clue not allowed?

Main button: Let it go. Buttons: Try another clue · Turn ends, they get a word · Clue rules · Let it go.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Clue rules | 0.69 | report | 0.01 | report (0.5 to 0.8) | 0.75 | 0.76 | grandparent: Clue rules (0.70); child: Clue rules (0.66); first-time host: Clue rules (0.97); one-hand host: Clue rules (0.26); uncle: Try another clue (0.40); new guest: Clue rules (0.70) |

### D2. Sheet: Earlier clues

Main button: Done. Buttons: Done.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Done | 0.98 | clear | 0.98 | no | 0.99 | 0.70 | none |

### D3. Sheet: Who picks this turn?

Main button: (none). Buttons: A name (Sunita) · Cancel.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| A name (Sunita) | 0.90 | clear | n/a | no main button (not judged) | 1.00 | 0.91 | none |

### D4. Paused

Main button: Carry on. Buttons: Carry on.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Carry on | 1.00 | clear | 1.00 | no | 0.07 | 0.97 | none |

### D5. Dialog: New board?

Main button: Keep playing. Buttons: New board · Keep playing.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| New board | 0.44 | unsure | 0.21 | Jev unsure | 0.45 | 0.80 | grandparent: New board (0.91); child: New board (0.47); first-time host: New board (0.72); new guest: New board (0.77) |

### D6. Dialog: End this game with no winner?

Main button: Keep playing. Buttons: End the game · Keep playing.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.63 | report | 0.26 | Jev unsure | 0.99 | 0.98 | grandparent: uncertain (0.61); first-time host: uncertain (0.46); one-hand host: End the game (0.35) |

### D7. Sheet: Players

Main button: Done. Buttons: Rename · Move to ... · ✕ (Remove) · Add to Chai Champions · Add to Coffee Commandos · Done.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Done | 0.45 | unsure | 0.45 | Jev unsure | 0.96 | 0.99 | child: uncertain (0.56); first-time host: uncertain (0.45); new guest: uncertain (0.43) |

### D7a. Dialog: Who gives clues for Coffee Commandos now?

Main button: Done. Buttons: A player (Om) · Done.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| A player (Om) | 0.76 | report | 0.08 | report (0.5 to 0.8) | 0.95 | 0.91 | child: A player (Om) (0.53); first-time host: A player (Om) (0.62); uncle: A player (Om) (0.67) |

### D7b. Dialog: Kabir leaves Coffee Commandos with only Om. Move someone over?

Main button: Keep Kabir. Buttons: Move Zoya over · Keep Kabir · End the game.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| End the game | 0.30 | unsure | 0.24 | Jev unsure | 0.98 | 0.49 | grandparent: uncertain (0.40); child: Move Zoya over (0.38); first-time host: uncertain (0.33); one-hand host: Move Zoya over (0.31); new guest: Move Zoya over (0.44) |

### D8. Dialog: End for tonight?

Main button: Keep playing. Buttons: End for tonight · Keep playing.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.63 | report | 0.08 | Jev unsure | 1.00 | 0.90 | grandparent: uncertain (0.48); child: uncertain (0.47); first-time host: uncertain (0.43); one-hand host: End for tonight (0.55) |

### D9. Dialog: Delete tonight's games?

Main button: Keep it. Buttons: Delete · Keep it.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.52 | report | 0.44 | Jev unsure | 0.99 | 1.00 | none |

### D10. Sheet: Show the map to

Main button: (none). Buttons: A name (Riya) · Cancel.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| A name (Riya) | 0.83 | clear | n/a | no main button (not judged) | 1.00 | 0.89 | none |

### G1. Game over

Main button: Play again. Buttons: Play again · Swap · Change players, phones or board · End for tonight · ← Home.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Play again | 0.39 | unsure | 0.39 | Jev unsure | 1.00 | 1.00 | grandparent: End for tonight (0.53); first-time host: Change players, phones or board (0.51); one-hand host: End for tonight (0.45); new guest: Change players, phones or board (0.41) |

### G2. Summary: Tonight's Secret Words

Main button: Play something else. Buttons: Oops, keep playing · ← Home · Play something else.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.37 | unsure | 0.15 | Jev unsure | 0.98 | 0.95 | grandparent: ← Home (0.43); child: Oops, keep playing (0.37); first-time host: ← Home (0.70); one-hand host: Oops, keep playing (0.63); new guest: ← Home (0.55) |

### E1. History

Main button: (none). Buttons: A game row · ← Back / Done.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| ← Back / Done | 0.81 | clear | n/a | no main button (not judged) | 1.00 | 0.85 | none |

### E1a. History: one game

Main button: (none). Buttons: ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| ← Back | 0.94 | clear | n/a | no main button (not judged) | 0.99 | 0.24 | none |

### J1. Join a game

Main button: (none). Buttons: Scan a map QR · I have a map code · ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| I have a map code | 0.57 | report | n/a | no main button (not judged) | 0.96 | 1.00 | none |

### J2. Type the map code

Main button: Open the map. Buttons: Open the map · ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Open the map | 0.75 | report | 0.75 | ok, medium (0.5 to 0.8) | 0.99 | 0.99 | grandparent: ← Back (0.44) |

### M1. Secret Words map

Main button: (none). Buttons: A map word · Orange list / Teal list / Whole map · Hide map · Next map · Done with this game · ← Back.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| A map word | 0.52 | report | n/a | no main button (not judged) | 1.00 | 0.98 | none |

### M2. Dialog: Clear this map from your phone?

Main button: Keep it. Buttons: Clear map · Keep it.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.64 | report | 0.25 | Jev unsure | 0.97 | 0.99 | uncle: uncertain (0.51) |

## Labels below 0.5 ("would most Indian families, including a non-Hindi speaker from Tirunelveli, understand this at once?")

| Label | P yes | Top answer |
|---|---|---|
| Landmine word | 0.06 | no |
| Teal list | 0.07 | no |
| Boom! The Landmine got Coffee Commandos. | 0.08 | no |
| Inspired by Codenames | 0.11 | no |
| Code 27P-3QX8 | 0.11 | no |
| Tambola ticket or Secret Words map from the host | 0.14 | no |
| Tonight's tally stays in History. | 0.16 | no |
| Keep Kabir | 0.17 | no |
| That was the last map of this deck. Scan the new code. | 0.17 | no |
| Map code | 0.20 | no |
| Tambola, Impostor or Secret Words on this phone | 0.22 | no |
| The one from 8:40 pm will end. | 0.23 | no |
| Zoya moved to Coffee Commandos · Undo | 0.24 | no |
| Playing Secret Words? Clue givers: scan the host's map code. Everyone else: just play along! | 0.26 | no |
| Teal team | 0.27 | no |
| The map phone is ready | 0.27 | no |
| Preview board | 0.28 | no |
| Type the map code | 0.28 | no |
| Orange list | 0.28 | no |
| poker face, no hints! | 0.29 | no |
| Clear this map from your phone? | 0.30 | no |
| Tap Carry on when everyone's back. | 0.31 | no |
| Optional: tap a word once it's found to fade it; tap again to undo. The board in the middle is always right. | 0.32 | no |
| Pass the pick | 0.33 | no |
| Add to Chai Champions | 0.35 | no |
| Heads up: Cricket is on the board. | 0.36 | no |
| For when someone saw the map or the words are too hard. This board won't count. Same teams and clue givers. | 0.36 | no |
| Coffee Commandos were 1 word away! | 0.37 | no |
| I have a map code | 0.39 | no |
| Landmine | 0.40 | no |
| Clue broke a rule. One of the other team's words was turned over. | 0.41 | no |
| Om moved to Coffee Commandos · Undo | 0.42 | no |
| Who gives clues for Coffee Commandos now? | 0.43 | no |
| Move Zoya over | 0.44 | no |
| Clue givers, scan your map | 0.45 | no |
| guess how many Riya will say! | 0.45 | no |
| Boom! The Landmine! | 0.46 | no |
| Neha joined Chai Champions | 0.46 | no |
| Carry on that one | 0.48 | no |
| Clue giver for Chai Champions (orange) | 0.48 | no |
| New map. The old one was cleared. | 0.48 | no |
| Do Not Disturb tip | 0.49 | no |
| Scan a ticket or secret map | 0.49 | no |
| Type a ticket code | 0.49 | no |

Labels in the 0.5 to 0.8 band (report): 92. Labels not answered: 0.

<details><summary>Every label with P yes</summary>

| Label | P yes |
|---|---|
| Host a game | 0.60 |
| Tambola, Impostor or Secret Words on this phone | 0.22 |
| Join a game | 0.95 |
| Tambola ticket or Secret Words map from the host | 0.14 |
| Tap to resume | 0.89 |
| Last game night | 0.72 |
| Play again with these teams | 0.90 |
| Secret Words map | 0.50 |
| Tap to open | 0.92 |
| Clear | 0.84 |
| What shall we play? | 0.87 |
| Inspired by Codenames | 0.11 |
| team word hunt | 0.56 |
| 4–20 players | 0.93 |
| 15–25 min a game | 0.95 |
| Start a new game night? | 0.78 |
| The one from 8:40 pm will end. | 0.23 |
| Carry on that one | 0.48 |
| Start new (ends that one) | 0.80 |
| Who's playing? | 0.92 |
| Clear list | 0.75 |
| Add at least 4 players. | 0.91 |
| 20 players is the most. | 0.82 |
| Next | 0.97 |
| ← Back | 0.98 |
| Make teams | 0.96 |
| Orange team | 0.96 |
| Teal team | 0.27 |
| Clue giver | 0.73 |
| Doesn't give clues | 0.78 |
| Tap a name to move it to the other team. | 0.60 |
| Each team needs at least 2 players. | 0.91 |
| Each team needs someone who can give clues. | 0.77 |
| Om moved to Coffee Commandos · Undo | 0.42 |
| Shuffle teams | 0.72 |
| Teams shuffled · Undo | 0.68 |
| New team names | 0.92 |
| Change clue givers | 0.65 |
| Clue givers | 0.71 |
| Add a partner | 0.75 |
| Remove partner | 0.68 |
| Partner | 0.91 |
| Done | 0.99 |
| How do you want to play? | 0.85 |
| Same as last time | 0.91 |
| How many phones? | 0.95 |
| One phone | 0.94 |
| Two phones | 0.97 |
| Three phones | 0.95 |
| Recommended | 0.79 |
| Board | 0.87 |
| Full | 0.96 |
| Easy | 0.98 |
| Landmine | 0.40 |
| Lose the game | 0.94 |
| Lose your turn | 0.72 |
| Words | 0.98 |
| Whole family | 0.96 |
| + Harder words | 0.94 |
| Big group? The Easy board is easier to read. | 0.72 |
| Pick how many phones to start. | 0.86 |
| Start the game | 0.97 |
| Read this aloud | 0.84 |
| Let's play | 0.94 |
| Show me the board first | 0.77 |
| How to play | 0.95 |
| The rules | 0.94 |
| Clue rules | 0.69 |
| Preview board | 0.28 |
| Start | 0.98 |
| Chai Champions start | 0.56 |
| Flip the board | 0.64 |
| Clue givers, scan your map | 0.45 |
| sit side by side and share one map phone. | 0.55 |
| scan on your own phones. | 0.66 |
| or type: | 0.79 |
| Everyone else: look away from their phones. | 0.80 |
| Do Not Disturb tip | 0.49 |
| The map phone is ready | 0.27 |
| Both have the map | 0.66 |
| Show the map code again | 0.59 |
| Back to the game | 0.86 |
| Chai Champions, your turn | 0.65 |
| Pass the phone to | 0.90 |
| Clue giver for Chai Champions (orange) | 0.48 |
| guess how many Riya will say! | 0.45 |
| Last turn: | 0.87 |
| Welcome back. | 0.97 |
| I'm Riya | 0.83 |
| Start 90-second timer | 0.79 |
| Stop timer | 0.88 |
| You give clues for Chai Champions (orange) | 0.51 |
| Tap to see the map | 0.86 |
| Tap to hide | 0.83 |
| Our words | 0.91 |
| Whole map | 0.53 |
| ↻ Flip | 0.70 |
| Not Riya? Go back | 0.54 |
| Someone saw the map | 0.71 |
| Your words (6 left) | 0.94 |
| Landmine word | 0.06 |
| Still looking? Tap to keep the map | 0.50 |
| I have my clue | 0.80 |
| Back to my clue | 0.57 |
| Done, hide the map | 0.64 |
| Show the map to a clue giver | 0.64 |
| say your clue out loud. How many words is it for? | 0.70 |
| 2 means up to 3 guesses. 0 or ∞: as many as you like. | 0.64 |
| Clue word (optional) | 0.76 |
| Heads up: Cricket is on the board. | 0.36 |
| One word, one number. No faces, no pointing! | 0.62 |
| Clue for 2: start guessing | 0.86 |
| See the map again | 0.87 |
| Keep my clue | 0.60 |
| Change clue | 0.62 |
| Chai Champions guessing | 0.54 |
| poker face, no hints! | 0.29 |
| Clue: 2 | 0.93 |
| 3 guesses left (2 + 1 extra) | 0.89 |
| Guess as many as you like | 0.92 |
| Earlier: MONSOON 2 · 1 · RAIN ∞ | 0.54 |
| Turn your phone sideways to see the board. | 0.80 |
| Tap a word to suggest it. Sunita taps Reveal. | 0.60 |
| Sunita: Reveal KITE | 0.89 |
| Clue not allowed? | 0.75 |
| End our turn | 0.71 |
| ✓ Riya's clue works! 2 guesses left. | 0.86 |
| ✓ Riya's clue works! That's all your guesses. | 0.70 |
| Blank word. Other team's turn next. | 0.89 |
| ✗ The other team's word! It counts for them. | 0.74 |
| Boom! The Landmine! | 0.46 |
| Earlier clues | 0.68 |
| Pass the pick | 0.33 |
| Chai Champions ended their turn. | 0.63 |
| Oops, keep guessing | 0.78 |
| Other team's turn | 0.91 |
| Both clue givers decide together. | 0.72 |
| Try another clue | 0.90 |
| Turn ends, they get a word | 0.68 |
| Clue broke a rule. One of the other team's words was turned over. | 0.41 |
| Let it go | 0.61 |
| Who picks this turn? | 0.83 |
| Cancel | 0.94 |
| Paused | 0.92 |
| Tap Carry on when everyone's back. | 0.31 |
| Carry on | 0.54 |
| New board? | 0.70 |
| For when someone saw the map or the words are too hard. This board won't count. Same teams and clue givers. | 0.36 |
| New board | 0.80 |
| Keep playing | 0.92 |
| End this game with no winner? | 0.61 |
| End the game | 0.91 |
| Game ended · Undo | 0.79 |
| Players | 0.96 |
| Rename | 0.81 |
| Move to | 0.91 |
| Remove | 0.89 |
| Player name | 0.94 |
| Add to Chai Champions | 0.35 |
| Neha joined Chai Champions | 0.46 |
| Zoya moved to Coffee Commandos · Undo | 0.24 |
| Kabir left · Undo | 0.52 |
| Who gives clues for Coffee Commandos now? | 0.43 |
| Move someone over? | 0.57 |
| Move Zoya over | 0.44 |
| Keep Kabir | 0.17 |
| No one can move over. | 0.66 |
| End for tonight? | 0.87 |
| Tonight's tally stays in History. | 0.16 |
| This game won't count in the tally. | 0.56 |
| End for tonight | 0.86 |
| Show the map to | 0.85 |
| Chai Champions win! | 0.64 |
| All 9 words found. | 0.87 |
| Boom! The Landmine got Coffee Commandos. | 0.08 |
| Game ended. No winner. | 0.93 |
| Coffee Commandos were 1 word away! | 0.37 |
| Best clue: MONSOON 2 · all 2 found | 0.66 |
| Tonight: Chai Champions 2 · Coffee Commandos 1 | 0.52 |
| Next clue givers | 0.56 |
| Swap | 0.70 |
| Change players, phones or board | 0.65 |
| ← Home | 0.97 |
| Play again | 0.97 |
| Tonight's Secret Words | 0.80 |
| 6 players · 3 games · 31 words found | 0.96 |
| Clues tonight from | 0.52 |
| Oops, keep playing | 0.63 |
| Play something else | 0.92 |
| Delete tonight's games | 0.62 |
| Delete tonight's games? The games and tally will be lost. | 0.77 |
| Keep it | 0.92 |
| History | 0.96 |
| 3 games | 0.98 |
| Chai Champions won | 0.61 |
| gave clues | 0.89 |
| Ended early | 0.84 |
| Clues: Chai Champions CRICKET 2 | 0.66 |
| Scan a ticket or secret map | 0.49 |
| Type a ticket code | 0.49 |
| Playing Secret Words? Clue givers: scan the host's map code. Everyone else: just play along! | 0.26 |
| I have a map code | 0.39 |
| Type the map code | 0.28 |
| Map code | 0.20 |
| That code doesn't look right. Check it with the host. | 0.68 |
| This map needs a newer version of the app. Open the app once with internet, then try again. | 0.68 |
| Open the map | 0.80 |
| New map. The old one was cleared. | 0.48 |
| Code 27P-3QX8 | 0.11 |
| Orange team starts | 0.93 |
| First words | 0.82 |
| Optional: tap a word once it's found to fade it; tap again to undo. The board in the middle is always right. | 0.32 |
| Orange list | 0.28 |
| Teal list | 0.07 |
| Hide map | 0.64 |
| Show map | 0.91 |
| Next map | 0.67 |
| Done with this game | 0.89 |
| Game over? Tap Done with this game, or Next map for the next one. | 0.70 |
| Next map. It should start with: Kite · Tiffin · Rain. | 0.56 |
| That was the last map of this deck. Scan the new code. | 0.17 |
| Clear this map from your phone? | 0.30 |
| Clear map | 0.67 |

</details>

## Word list check (`words.csv`, `team-names.csv`)

Words asked: 452 of 452, three questions each (belongs to its category; known at once by most Indian families including a non-Hindi speaker from Tirunelveli; fine to say in front of children and grandparents). "One word, not a phrase" was checked by code, not Jev. The "too close to another board word" pairs question was not run (needs a pair list; none exists yet). P yes below 0.5 is listed; 0.5 to 0.8 is counted only.

- **Does not belong in its category (below 0.5), 60:** SWDW-080 Ludo (Cricket and sport, 0.15); SWDW-084 Shuttle (Cricket and sport, 0.26); SWDW-132 Paste (Home, 0.45); SWDW-133 Torch (Home, 0.26); SWDW-135 Frame (Home, 0.48); SWDW-136 Well (Home, 0.35); SWDW-149 Ship (Out and about, 0.40); SWDW-150 Boat (Out and about, 0.48); SWDW-152 Bridge (Out and about, 0.41); SWDW-153 Signal (Out and about, 0.17); SWDW-154 Horn (Out and about, 0.19); SWDW-155 Puncture (Out and about, 0.07); SWDW-156 Petrol (Out and about, 0.34); SWDW-166 Post (Out and about, 0.29); SWDW-167 Police (Out and about, 0.42); SWDW-176 Lift (Out and about, 0.42); SWDW-181 Interval (Films and music, 0.45); SWDW-186 Stunt (Films and music, 0.47); SWDW-187 Dialogue (Films and music, 0.40); SWDW-189 Selfie (Films and music, 0.15); SWDW-197 Note (Films and music, 0.34); SWDW-199 Mike (Films and music, 0.08); SWDW-200 Speaker (Films and music, 0.10); SWDW-205 Puppet (Films and music, 0.13); SWDW-206 Magic (Films and music, 0.32); SWDW-208 Comic (Films and music, 0.14); SWDW-214 Anchor (Films and music, 0.08); SWDW-218 Lamp (Festivals, 0.27); SWDW-219 Candy (Festivals, 0.04); SWDW-220 Card (Festivals, 0.01); SWDW-221 Ribbon (Festivals, 0.07); SWDW-222 Parade (Festivals, 0.34); SWDW-223 Santa (Festivals, 0.48); SWDW-225 Prize (Festivals, 0.01); SWDW-227 Rocket (Festivals, 0.09); SWDW-232 Mask (Festivals, 0.26); SWDW-233 Gift (Festivals, 0.21); SWDW-234 Sweet (Festivals, 0.06); SWDW-235 Present (Festivals, 0.16); SWDW-236 Wedding (Festivals, 0.13); SWDW-237 Feast (Festivals, 0.25); SWDW-238 Wish (Festivals, 0.04); SWDW-239 Guest (Festivals, 0.04); SWDW-243 Party (Festivals, 0.15); SWDW-244 Birthday (Festivals, 0.09); SWDW-245 Vacation (Festivals, 0.00); SWDW-246 Picnic (Festivals, 0.01); SWDW-248 Bride (Festivals, 0.03); SWDW-249 Bubble (Festivals, 0.01); SWDW-250 Holiday (Festivals, 0.10); SWDW-291 Pearl (Nature and animals, 0.27); SWDW-301 Scale (School and work, 0.19); SWDW-307 Bench (School and work, 0.41); SWDW-310 Tie (School and work, 0.40); SWDW-317 Guard (School and work, 0.26); SWDW-321 Gum (School and work, 0.01); SWDW-327 Stamp (School and work, 0.30); SWDW-359 Chain (Body and clothes, 0.22); SWDW-361 Watch (Body and clothes, 0.47); SWDW-362 Umbrella (Body and clothes, 0.17)

- **Not known at once (below 0.5), 37:** SWDW-015 Jelly (Food, 0.44); SWDW-022 Corn (Food, 0.45); SWDW-024 Puri (Food, 0.25); SWDW-025 Naan (Food, 0.40); SWDW-042 Kebab (Food, 0.49); SWDW-048 Vada (Food, 0.40); SWDW-051 Tiffin (Food, 0.43); SWDW-057 Pitch (Cricket and sport, 0.29); SWDW-075 Googly (Cricket and sport, 0.31); SWDW-083 Racket (Cricket and sport, 0.47); SWDW-123 Cylinder (Home, 0.48); SWDW-132 Paste (Home, 0.48); SWDW-181 Interval (Films and music, 0.39); SWDW-186 Stunt (Films and music, 0.40); SWDW-190 Trailer (Films and music, 0.45); SWDW-194 Sitar (Films and music, 0.38); SWDW-199 Mike (Films and music, 0.49); SWDW-205 Puppet (Films and music, 0.49); SWDW-211 Flop (Films and music, 0.42); SWDW-212 Reel (Films and music, 0.23); SWDW-228 Sparkler (Festivals, 0.20); SWDW-242 Lantern (Festivals, 0.37); SWDW-306 Duster (School and work, 0.20); SWDW-348 Lungi (Body and clothes, 0.44); SWDW-351 Chappal (Body and clothes, 0.49); SWDW-366 Court (Things and ideas, 0.42); SWDW-398 Bow (Things and ideas, 0.40); SWDW-413 Bhutan (Geography, 0.48); SWDW-417 Mexico (Geography, 0.39); SWDW-419 Greece (Geography, 0.38); SWDW-424 Sydney (Geography, 0.46); SWDW-427 Cairo (Geography, 0.45); SWDW-428 Berlin (Geography, 0.44); SWDW-441 Ooty (Geography, 0.45); SWDW-444 Lucknow (Geography, 0.49); SWDW-446 Patna (Geography, 0.26); SWDW-447 Surat (Geography, 0.41) (words in the 0.5 to 0.8 band: 142)

- **Not clearly family-friendly (below 0.5), 0:** none

- Code check, more than one word: none.

**Team names:** 20 pairs asked (understood at once; family-friendly). Pairs under 0.8 on either: SWDT-01 Chai Champions / Coffee Commandos (understood 0.75, family 0.97); SWDT-02 Sleepy Samosas / Crispy Dosas (understood 0.69, family 1.00); SWDT-05 Back Benchers / Front Benchers (understood 0.75, family 0.90); SWDT-07 Tiffin Thieves / Lunch Box Bandits (understood 0.40, family 0.95); SWDT-08 Remote Hiders / Channel Changers (understood 0.45, family 0.95); SWDT-09 Mosquito Slappers / Power Cut Heroes (understood 0.68, family 0.97); SWDT-10 Biscuit Dunkers / Chutney Lovers (understood 0.63, family 1.00); SWDT-11 Wi-Fi Hunters / Charger Borrowers (understood 0.79, family 0.92); SWDT-12 Monsoon Puddles / Summer Sunburns (understood 0.59, family 0.97); SWDT-14 Auto Racers / Scooter Riders (understood 0.78, family 0.94); SWDT-20 Party Poppers / Paper Boats (understood 0.51, family 0.95).



Word check decisions: 1396.

## Decisions used

- Map run: 596 decisions (3 for the format probe, 369 for screens, 224 for labels), 53 calls. Word list check: 1396. Total this job: 1992.
- Weekly cap in the client: 20,000 (the proposal raises it to 50,000; the client was not changed). Used this ISO week after the job: 1992.
- Skipped for cap or tool: nothing.

## Tool faults (apart from findings, PLT-122)

- None: every call answered on the first try.
- Noted: the client has Choice questions only (see above). "Uncertain" was added by the script as an option on every question.
