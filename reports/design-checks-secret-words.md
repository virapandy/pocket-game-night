# Design rule checks: Secret Words screen map, draft 2

Run 22 October 2026 by the tester with `tests/tools/design-checks/run.ts` (README next to it); it reads the map and `scenarios.md` (for the ids) and nothing else. Report-only: nothing here blocks a build. Tool self-test passed (`--self-test`).

Source: `docs/games/secret-words/screen-map.md`. 36 screens and dialogs, 138 button rows read.

**Findings: 15. Cannot check: 18. Accepted exceptions: 2. Tool faults: 0.**

## Findings, by screen

Counts by rule: R1 way out 2 · R2 button leads somewhere 6 · R3 stop and home 6 · R6 rule hook has a scenario 1


### - (whole map)
- **R2 button leads somewhere**: the paths list uses D9, which is not a screen in the map
- **R2 button leads somewhere**: the paths list uses E1a, which is not a screen in the map
- **R2 button leads somewhere**: the paths list uses M3, which is not a screen in the map

### S6 Preview board (after "Show me the board first")
- **R3 stop and home**: stop and home only in the menu (playbook 12a: a common intention reachable only through a menu is a finding; the map chose this on purpose, so it needs the owner's explicit decision)

### S7 Clue givers, scan your map (two or three phones; after every deal)
- **R3 stop and home**: stop and home only in the menu (playbook 12a: a common intention reachable only through a menu is a finding; the map chose this on purpose, so it needs the owner's explicit decision)

### P1 Pass screen (one phone, start of each turn)
- **R3 stop and home**: stop and home only in the menu (playbook 12a: a common intention reachable only through a menu is a finding; the map chose this on purpose, so it needs the owner's explicit decision)

### P3 Clue screen (one phone after P2; two or three phones at the start of each turn)
- **R3 stop and home**: stop and home only in the menu (playbook 12a: a common intention reachable only through a menu is a finding; the map chose this on purpose, so it needs the owner's explicit decision)

### P4 Guessing (the board)
- **R3 stop and home**: stop and home only in the menu (playbook 12a: a common intention reachable only through a menu is a finding; the map chose this on purpose, so it needs the owner's explicit decision)

### P6 Turn over
- **R3 stop and home**: stop and home only in the menu (playbook 12a: a common intention reachable only through a menu is a finding; the map chose this on purpose, so it needs the owner's explicit decision)

### D7a Who gives clues for Coffee Commandos now?
- **R1 way out**: no row or path in the map names this screen, so as written nobody can reach it

### D7b Kabir leaves Coffee Commandos with only Om. Move someone over? (*proposed* W23: "Coffee Commandos would be left with only Om. Move someone over?")
- **R1 way out**: no row or path in the map names this screen, so as written nobody can reach it

### G2 Summary "Tonight's Secret Words"
- **R2 button leads somewhere**: leads to D9, which has no section or row of its own in the map (its buttons are not checked)

### E1 History
- **R2 button leads somewhere**: leads to E1a, which has no section or row of its own in the map (its buttons are not checked)

### M1 Secret Words map
- **R2 button leads somewhere**: leads to M3, which has no section or row of its own in the map (its buttons are not checked)
- **R6 rule hook has a scenario**: "I give clues for: Chai Champions / Coffee Co…" records "saved with the map" but its ids cell is "decision 7"

## Cannot check (the map does not say enough)


### - (whole map)
- R4 one main button: the map does not say whether these screens have a main button: A1, A2, S1, S2a, S4, S5, S6, S7a, P1, E1, J1, J2
- R4 one main button: a main button is mentioned but not named on: S2, S3, S7

### A1 Home
- R5 banned words: "Last game night: Chai Champions 2 · Coffee Comman…" (night): retired on Impostor screens (decisions I25); whether Secret Words follows is not decided (its own ux.md says "evening")

### A2 What shall we play?
- R5 banned words: "Secret Words card, a game night unfinished" (night): retired on Impostor screens (decisions I25); whether Secret Words follows is not decided (its own ux.md says "evening")

### A3 Dialog "Start a new game night?"
- R5 banned words: "Start a new game night?" (night): retired on Impostor screens (decisions I25); whether Secret Words follows is not decided (its own ux.md says "evening")

### S2a Sheet "Clue givers" (also from G1 "Swap")
- R2 button leads somewhere: 3 row(s) say what happens only in words, with no screen id, so the target cannot be checked: "A player", "Add a partner / a partner name / Remove…", "Doesn't give clues (switch)"

### P2 Private map (one phone; also S7b "Show the map to a clue giver")
- R2 button leads somewhere: 3 row(s) say what happens only in words, with no screen id, so the target cannot be checked: "Tap to see the map", "Our words ↔ Whole map", "↻ Flip"
- R3 stop and home: stop and home not mentioned in the Intentions line, so whether they are reachable cannot be told

### P3 Clue screen (one phone after P2; two or three phones at the start of each turn)
- R2 button leads somewhere: 2 row(s) say what happens only in words, with no screen id, so the target cannot be checked: "A number key / ∞", "Type a clue word"
- R4 one main button: names 3 main labels ("Clue for 2: start guessing", "Back to my clue", "Done, hide the map"); they may be states of one button, so "one at a time" cannot be checked

### P4 Guessing (the board)
- R2 button leads somewhere: 3 row(s) say what happens only in words, with no screen id, so the target cannot be checked: "A face-down word", "Sunita: Reveal KITE", "↻"

### P5 End-turn line
- R3 stop and home: stop and home not mentioned in the Intentions line, so whether they are reachable cannot be told

### D7a Who gives clues for Coffee Commandos now?
- R1 way out: no row names another screen or a way back; some rows are described only in words, so a way out cannot be ruled in or out
- R2 button leads somewhere: 2 row(s) say what happens only in words, with no screen id, so the target cannot be checked: "Done", "close"

### D7b Kabir leaves Coffee Commandos with only Om. Move someone over? (*proposed* W23: "Coffee Commandos would be left with only Om. Move someone over?")
- R2 button leads somewhere: 1 row(s) say what happens only in words, with no screen id, so the target cannot be checked: "Move Zoya over"

### M1 Secret Words map
- R2 button leads somewhere: 3 row(s) say what happens only in words, with no screen id, so the target cannot be checked: "A map word", "Orange list / Teal list / Whole map", "Hide map ↔ Show map · 60 s silence · ap…"
- R4 one main button: says "no main", and a row names "Not yet" as main; probably a dialog opened from this screen, but the map does not say so
- R7 secret behind a hold: the map has a Hide/Show toggle and hides after 60 s, but the source never says whether it starts hidden or shown

## Accepted exceptions (a decision accepts these; not findings)

- S7 R7 secret behind a hold: decisions K19 / K3: the map code and QR are shown to clue givers on the host phone; accepted as family trust
- S7a R7 secret behind a hold: decisions K19 / K3: same code shown again on request

## Tool faults (about the script or the map file format, not about the design)

- limit of the map format, not a fault: it has no screen-kind tag, so which screens are "between rounds", "game steps" or "not secret any more" is a setting in rules.ts (SECRET_WORDS), and R7 recognises secrets by phrases such as "Your words" and "Hide map"
