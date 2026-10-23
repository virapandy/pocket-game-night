# Jev design check: mafia

Run: 2026-10-23, budget `product`. Tool: `tests/tools/jev-design/run.ts`. Findings only: nothing in the source files was changed. Bands: above 0.8 clear, 0.5 to 0.8 report, below 0.5 or "uncertain" unsure. Every probability is one Jev answer per question (no repeats), so a value near a band edge may move on a re-run.

## Screen map

- Screens parsed: 20; asked: 15; not asked (fewer than 2 buttons in a table, or beyond --screens): A1, S4, N0, N3, V1.
- **Flagged** (Jev's likeliest button is not the main button, P above 0.8): none.
- **Report band** (not the main button, P 0.5 to 0.8): S2 (How to play, 0.56); B2 (Hold / let go (or Tap instead → "Tap to see" / "Tap to hide"), 0.67); N2 (Tap to see your night job / Tap to hide, 0.72); Y1 (Start 2-minute timer, 0.64).
- **Jev unsure**: S1, V2, V3.
- **Way out not visible** (P yes below 0.5): A2 0.06; M1 0.36; Y1 0.35; V3 0.28.
- **Purpose not clearly clear** (P yes below 0.8): A2 0.52; N1 0.77; N2 0.62; M1 0.79; V2 0.63; V3 0.37; V4 0.76; G1 0.54.
- **Labels below 0.5:** 50 of 136. Labels 0.5 to 0.8: 68.
- Main button = the map's `main "..."` wording in a screen's Words line; screens without it are not judged against a main button. Buttons = the first column of each screen's tables (menu items included if the map lists them).

### Persona disagreements (likeliest button differs from the main button)

- S1: grandparent: How to play (0.73); child: How to play (0.63); first-time host: How to play (0.93); one-hand host: How to play (0.38); new guest: Add / Enter (0.47)
- S2: grandparent: How to play (0.83); child: How to play (0.69); first-time host: How to play (0.95); one-hand host: How to play (0.36); new guest: How to play (0.71)
- B2: grandparent: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.76); child: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.77); first-time host: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.69); one-hand host: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.64); uncle: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.73); new guest: Not Riya? ← Back (0.55)
- N2: grandparent: Tap to see your night job / Tap to hide (0.62); child: Tap to see your night job / Tap to hide (0.67); first-time host: Tap to see your night job / Tap to hide (0.59); one-hand host: Tap to see your night job / Tap to hide (0.60); uncle: Tap to see your night job / Tap to hide (0.56); new guest: Not Meena? ← Back (0.58)
- Y1: child: Start 2-minute timer (0.53); first-time host: Start 2-minute timer (0.74); new guest: See my role again (0.36)
- V4: new guest: ← Home (0.52)
- G1: grandparent: ← Home (0.46)

### Per screen

### A2. What shall we play? (new card)

Main button: (none found). Buttons: Mafia card, nothing unfinished · Mafia card, a game night unfinished.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Mafia card, nothing unfinished | 0.76 | report | n/a | no main button found in the map (not judged) | 0.06 | 0.52 | none |

### S1. Who's playing?

Main button: Next. Buttons: Add / Enter · ✕ · How to play · ← Back · Next.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| How to play | 0.37 | unsure | 0.27 | Jev unsure | 0.93 | 0.99 | grandparent: How to play (0.73); child: How to play (0.63); first-time host: How to play (0.93); one-hand host: How to play (0.38); new guest: Add / Enter (0.47) |

### S2. Roles

Main button: Deal the roles. Buttons: − / + · How to play · ← Back · Deal the roles.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| How to play | 0.56 | report | 0.24 | report (0.5 to 0.8) | 0.66 | 0.99 | grandparent: How to play (0.83); child: How to play (0.69); first-time host: How to play (0.95); one-hand host: How to play (0.36); new guest: How to play (0.71) |

### S3. Read this aloud (first Mafia game of the night)

Main button: Pass the phone round. Buttons: Pass the phone round · ← Back · How to play.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Pass the phone round | 0.96 | clear | 0.96 | no | 0.91 | 0.88 | none |

### B1. Pass screen (deal)

Main button: I'm Riya. Buttons: I'm Riya · Pause icon.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| I'm Riya | 0.96 | clear | 0.96 | no | 0.78 | 0.96 | none |

### B2. Role card (private)

Main button: Done, pass to Arjun. Buttons: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") · Not Riya? ← Back · New to Mafia? What this means / hide · Someone saw my role · Done, pass to Arjun · Done, everyone's seen · App hidden or reload while shown.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") | 0.67 | report | 0.14 | report (0.5 to 0.8) | 0.88 | 0.85 | grandparent: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.76); child: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.77); first-time host: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.69); one-hand host: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.64); uncle: Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") (0.73); new guest: Not Riya? ← Back (0.55) |

### N1. Pass screen (night)

Main button: I'm Meena. Buttons: I'm Meena · Pause icon.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| I'm Meena | 0.86 | clear | 0.86 | no | 0.54 | 0.77 | none |

### N2. Night job (private, same layout for every role)

Main button: Done, pass to Kabir. Buttons: Mafia, first to hold the phone tonight · Mafia, later ones (two to four Mafia) · Doctor · Police · Villager · Out player · Tap · Tap to see your night job / Tap to hide · A name · Not Meena? ← Back · Done, pass to Kabir · Done, night over (last player) · App hidden / reload while shown.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Tap to see your night job / Tap to hide | 0.72 | report | 0.03 | report (0.5 to 0.8) | 0.78 | 0.62 | grandparent: Tap to see your night job / Tap to hide (0.62); child: Tap to see your night job / Tap to hide (0.67); first-time host: Tap to see your night job / Tap to hide (0.59); one-hand host: Tap to see your night job / Tap to hide (0.60); uncle: Tap to see your night job / Tap to hide (0.56); new guest: Not Meena? ← Back (0.58) |

### M1. Morning (room; the host reads it aloud)

Main button: Start talking. Buttons: Start talking · See who won · See my role again.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Start talking | 0.78 | report | 0.78 | ok, medium (0.5 to 0.8) | 0.36 | 0.79 | none |

### Y1. Day: talk it over

Main button: Time to vote. Buttons: Time to vote · See my role again · Start 2-minute timer.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Start 2-minute timer | 0.64 | report | 0.29 | report (0.5 to 0.8) | 0.35 | 0.86 | child: Start 2-minute timer (0.53); first-time host: Start 2-minute timer (0.74); new guest: See my role again (0.36) |

### V2. Who got the most fingers?

Main button: (none found). Buttons: A name · Put Kabir out · It's a tie · Count again · Nobody today · ← Back to talking.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Put Kabir out | 0.31 | unsure | n/a | Jev unsure | 0.70 | 0.63 | none |

### V3. Tie

Main button: (none found). Buttons: Names · Point again · Not a tie · Start night 2 (second tie).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Start night 2 (second tie) | 0.44 | unsure | n/a | Jev unsure | 0.28 | 0.37 | none |

### V4. Vote result (room)

Main button: Start night 2. Buttons: Start night 2 · See who won · End the game · ← Home · D1 · D2 · D3 · D4 · D5 · D6 · D7 · D8.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Start night 2 | 0.69 | report | 0.69 | ok, medium (0.5 to 0.8) | 0.91 | 0.76 | new guest: ← Home (0.52) |

### G1. Game over

Main button: Play again. Buttons: Play again · Change players or roles · End for tonight · ← Home · Undo (toast after End the game).

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| Play again | 0.56 | report | 0.56 | ok, medium (0.5 to 0.8) | 0.99 | 0.54 | grandparent: ← Home (0.46) |

### G2. Summary "Tonight's Mafia"

Main button: ← Home / Play something else. Buttons: Oops, keep playing · ← Home / Play something else.

| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |
|---|---|---|---|---|---|---|---|
| ← Home / Play something else | 0.64 | report | 0.64 | ok, medium (0.5 to 0.8) | 0.94 | 0.82 | none |

### Labels below 0.5 ("understood at once by most Indian families, including a non-Hindi speaker from Tirunelveli?")

| Label | P yes | Top answer |
|---|---|---|
| D1 | 0.05 | no |
| D2 | 0.08 | no |
| D4 | 0.08 | no |
| (D5). | 0.09 | no |
| App hidden or reload while shown | 0.09 | no |
| App hidden / reload while shown | 0.09 | no |
| D8 | 0.11 | no |
| D3 | 0.13 | no |
| D5 | 0.13 | no |
| D7 | 0.13 | no |
| Mafia card, nothing unfinished | 0.14 | no |
| Out players: your ghost guess. | 0.16 | no |
| It closes with the role. Also in | 0.18 | no |
| ; main | 0.19 | no |
| · | 0.20 | no |
| ; counter | 0.21 | no |
| Mafia card, a game night unfinished | 0.22 | no |
| Put Kabir out | 0.22 | no |
| / | 0.22 | no |
| D6 | 0.23 | no |
| out night 1 | 0.26 | no |
| Mafia most often: Arjun (2 games) | 0.27 | no |
| Put out | 0.28 | no |
| (main disabled); over 16: | 0.29 | no |
| Deal the roles | 0.32 | no |
| ; lines | 0.33 | no |
| Start night 2 (second tie) | 0.34 | no |
| ); fun lines: | 0.35 | no |
| (Villagers' picks), | 0.35 | no |
| Not Meena? ← Back | 0.37 | no |
| New to Mafia? | 0.37 | no |
| Sharpest eyes tonight: Om | 0.38 | no |
| While the role shows, a quiet | 0.39 | no |
| (when any); | 0.39 | no |
| Tap everyone who is tied | 0.43 | no |
| Undo (toast after End the game) | 0.43 | no |
| Not Riya? ← Back | 0.44 | no |
| Mafia, first to hold the phone tonight | 0.44 | no |
| ; rules box | 0.45 | no |
| Mafia, later ones (two to four Mafia) | 0.45 | no |
| New to Mafia? What this means / hide | 0.46 | no |
| (Add disabled); quiet | 0.47 | no |
| , | 0.47 | no |
| Tap instead | 0.47 | no |
| - VILLAGER · | 0.48 | no |
| ; Villager: | 0.49 | no |
| Tap | 0.49 | no |
| Who got the most fingers? | 0.49 | no |
| Not a tie | 0.49 | no |
| protected last night | 0.49 | no |

## Decisions used

- This run: 271 decisions, 22 calls.
- Product count this ISO week (2026-W43): 3428 before, 3699 after, of 15000.
- Shared count this ISO week: 5231 before, 5502 after, of 50000.
- Stopped early: no.
- Skipped: nothing.

## Tool faults (kept apart from findings)

- None: every call answered on the first try.
