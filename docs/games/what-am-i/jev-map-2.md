# Jev design check: what-am-i

Run: 2026-10-23, budget `product`. Tool: `tests/tools/jev-design/run.ts`. Findings only: nothing in the source files was changed. Bands: above 0.8 clear, 0.5 to 0.8 report, below 0.5 or "uncertain" unsure. Every probability is one Jev answer per question (no repeats), so a value near a band edge may move on a re-run.

## Screen map

- Screens parsed: 14; asked: 12; not asked (fewer than 2 buttons in a table, or beyond --screens): A1, S4.
- **Flagged** (Jev's likeliest button is not the main button, P above 0.8): none.
- **Report band** (not the main button, P 0.5 to 0.8): none.
- **Jev unsure**: S2, T3, G1.
- **Way out not visible** (P yes below 0.5): A2 0.06.
- **Purpose not clearly clear** (P yes below 0.8): T1 0.71; T2 0.55; T3 0.52.
- **Labels below 0.5:** 50 of 107. Labels 0.5 to 0.8: 50.
- Main button = the map's `main "..."` wording in a screen's Words line; screens without it are not judged against a main button. Buttons = the first column of each screen's tables (menu items included if the map lists them).

### Persona disagreements (likeliest button differs from the main button)

- S1: grandparent: How to play (0.69); first-time host: How to play (0.85); new guest: How to play (0.42)
- S2: grandparent: How to play (0.39); first-time host: How to play (0.81); new guest: How to play (0.50)
- T1: grandparent: Someone else goes first (0.34); new guest: Someone else goes first (0.57)
- T0: grandparent: Use taps instead (0.82); one-hand host: Use taps instead (0.80); new guest: Use taps instead (0.58)
- T4: grandparent: ← Home (game saved) (0.42); new guest: ← Home (game saved) (0.60)
- R1: new guest: ← Home (game saved) (0.32)
- G1: grandparent: ← Home (0.34); new guest: ← Home (0.46)
- G2: one-hand host: Oops, keep playing (0.58)

### Per screen

### A2. What shall we play? (new card)

Main button: (none found). Buttons: What Am I? card, nothing unfinished · What Am I? card, a game night unfinished.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| What Am I? card, nothing unfinished | 0.92 | clear | n/a | no main button found in the map (not judged) | 0.06 | 0.80 | none |

### S1. Who's playing?

Main button: Next. Buttons: Add / Enter · ✕ · Drag a name · How to play · ← Back · Next.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Next | 0.64 | report | 0.64 | ok, medium (0.5 to 0.8) | 0.93 | 1.00 | grandparent: How to play (0.69); first-time host: How to play (0.85); new guest: How to play (0.42) |

### S2. Words and time

Main button: Start with these words. Buttons: a pack / a time / a hold / a switch · How to play · ← Back · Start with these words · Carry on playing (from R1).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| ← Back | 0.42 | unsure | 0.31 | Jev unsure | 0.79 | 0.84 | grandparent: How to play (0.39); first-time host: How to play (0.81); new guest: How to play (0.50) |

### S3. Read this aloud (first game of the night)

Main button: First turn. Buttons: First turn · ← Back · How to play.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| First turn | 0.96 | clear | 0.96 | no | 0.77 | 0.94 | none |

### T1. Pass screen ("Riya, you're guessing")

Main button: I'm Riya: start. Buttons: I'm Riya: start · Start Riya's turn (hands-free) · Someone else goes first · Hands-free for Riya / Riya will hold it · Players (6) › · ← Home (game saved) · Pause / ··· Menu.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| I'm Riya: start | 0.64 | report | 0.64 | ok, medium (0.5 to 0.8) | 0.71 | 0.71 | grandparent: Someone else goes first (0.34); new guest: Someone else goes first (0.57) |

### T0. Answer by moving the phone? (once per phone, only where the phone asks for motion permission)

Main button: Yes, move the phone. Buttons: Yes, move the phone · Use taps instead.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Yes, move the phone | 0.60 | report | 0.60 | ok, medium (0.5 to 0.8) | 0.85 | 0.94 | grandparent: Use taps instead (0.82); one-hand host: Use taps instead (0.80); new guest: Use taps instead (0.58) |

### T2. Get ready (countdown)

Main button: (none found). Buttons: countdown ends · Pause.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| countdown ends | 0.76 | report | n/a | no main button found in the map (not judged) | 0.62 | 0.55 | none |

### T3. The word (room-facing)

Main button: (none found). Buttons: phone moved down (screen towards the floor), or a tap on the bottom half · phone moved up, or a tap on the top half · a mark within 0.8 s of a new word; a move before the phone has come back level since the l · hands-free: any phone movement (a bump, a slide) · 10 s left · time up · Pause, phone's Back, or the app hidden (laying the phone flat is not a pause: it would mar · pack runs out.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| uncertain | 0.49 | unsure | n/a | Jev unsure | 0.84 | 0.52 | none |

### T4. Time's up (end of turn)

Main button: Save score. Buttons: a word · Save score · Undo (toast) · ← Home (game saved).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Save score | 0.70 | report | 0.70 | ok, medium (0.5 to 0.8) | 0.97 | 0.97 | grandparent: ← Home (game saved) (0.42); new guest: ← Home (game saved) (0.60) |

### R1. Round over

Main button: Round 2. Buttons: Round 2 · Players (6) › · Change players or words · End the game · ← Home (game saved).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Round 2 | 0.65 | report | 0.65 | ok, medium (0.5 to 0.8) | 0.99 | 0.96 | new guest: ← Home (game saved) (0.32) |

### G1. Game over

Main button: Play again. Buttons: Play again · Change players or words · End for tonight · ← Home · Undo (toast after End the game).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Play again | 0.48 | unsure | 0.48 | Jev unsure | 1.00 | 0.98 | grandparent: ← Home (0.34); new guest: ← Home (0.46) |

### G2. Summary "Tonight's What Am I?"

Main button: ← Home / Play something else. Buttons: Oops, keep playing · ← Home / Play something else · Critic helper, pass of draft 1 (23 October) · Six persona walks of draft 2 (map-walk-2026-10-23.md) · Word guidelines (docs/word-guidelines.md) · First Jev check (jev-check.md) · Owner, 23 October.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| ← Home / Play something else | 0.88 | clear | 0.88 | no | 0.92 | 0.81 | one-hand host: Oops, keep playing (0.58) |

### Labels below 0.5 ("understood at once by most Indian families, including a non-Hindi speaker from Tirunelveli?")

| Label | P yes | Top answer |
|---|---|---|
| First Jev check (jev-check.md) | 0.02 | no |
| and a drag handle; line | 0.05 | no |
| ; score line and tip line as above; | 0.05 | no |
| / | 0.10 | no |
| ; counter | 0.14 | no |
| (from R1's | 0.14 | no |
| ; at most one tip line, in this order: | 0.16 | no |
| (hands-free: | 0.16 | no |
| . | 0.17 | no |
| (main disabled); over 20: | 0.18 | no |
| (taps only: | 0.20 | no |
| Undo (toast) | 0.21 | no |
| · Hands-free with | 0.22 | no |
| · | 0.22 | no |
| countdown ends | 0.23 | no |
| ; the drawing; rule line | 0.24 | no |
| phone moved up, or a tap on the top half | 0.24 | no |
| on with | 0.26 | no |
| . *Words, hands-free:* | 0.26 | no |
| ); score line | 0.27 | no |
| : | 0.28 | no |
| ; main | 0.29 | no |
| Drag a name | 0.29 | no |
| ; | 0.29 | no |
| , | 0.31 | no |
| Owner, 23 October | 0.31 | no |
| (Add disabled); quiet | 0.34 | no |
| pack runs out | 0.34 | no |
| ; under 2: | 0.35 | no |
| Hands-free for Riya / Riya will hold it | 0.35 | no |
| Use taps instead | 0.35 | no |
| ✕ | 0.36 | no |
| Start Riya's turn (hands-free) | 0.36 | no |
| What Am I? card, nothing unfinished | 0.37 | no |
| Arjun 14 (2 turns) · Zoya 6 (1 turn) | 0.39 | no |
| Change players or words | 0.41 | no |
| Next: Arjun | 0.42 | no |
| Undo (toast after End the game) | 0.42 | no |
| with a beep each (sounds on); | 0.43 | no |
| What Am I? card, a game night unfinished | 0.44 | no |
| : In the guesser's hand with | 0.44 | no |
| Owl ↺ | 0.44 | no |
| a pack / a time / a hold / a switch | 0.45 | no |
| Answer by moving the phone? | 0.45 | no |
| Best guesser tonight: Meena (31 words) | 0.45 | no |
| Penguin · Zebra | 0.47 | no |
| Best turn: Meena, 8 words | 0.47 | no |
| ; when off: | 0.49 | no |
| on iPhone / | 0.49 | no |
| Save score | 0.49 | no |

## Decisions used

- This run: 215 decisions, 18 calls.
- Product count this ISO week (2026-W43): 11896 before, 12111 after, of 15000.
- Shared count this ISO week: 13699 before, 13914 after, of 50000.
- Stopped early: no.
- Skipped: nothing.

## Tool faults (kept apart from findings)

- None: every call answered on the first try.
