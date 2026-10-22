# Secret Words: build plan for the orchestrator, coders and tester (product owner, 22 October 2026)

Binding behaviour: `scenarios.md` version 3.6 (each scenario's "Version 3.6" paragraph wins over the text above it). Screens and
paths: `screen-map.md` draft 3. On-screen words: `text.csv` (below). Rules for working: `docs/change-sop.md`. This file only
proposes an order and a split; the orchestrator decides.

## 1. Order
1. **Rules engine** (lane-e, under way): sections 02, 04 rules, 05, 06 saved data, SWD-099, 101, 118, 123, 127 moves. C3, tests first.
2. **Prototype second pass** (C1, `screen-map.md` section K), then the six persona walks and the Jev read; findings go to the
   product owner before screen lanes start, so screens are built once.
3. **Screen lanes A–D in parallel** (below), each C1/C2, area tests and screenshots in the lane, reviewer for C2.
4. **Simulated table games** (tester, `docs/handover.md` "Added 22 October") once the engine deals boards.
5. **Complete run, UX re-check, release candidate; AI playthrough of the release candidate** (six personas at five sizes, Jev and the
   coverage map on the real screens), "Report a problem" real (PLT-208) and rollback ready (owner, 22 October: no hand testing).

## 2. Screen lanes (one area each; files used by two lanes go to the earlier lane)
| Lane | Area | Screens (map) | Scenarios | Class |
|---|---|---|---|---|
| A | Home, picker, Join, setup | A1–A3, J1–J2, D11, S1–S5 | SWD-001–014, 002 (D11), 115, 119, 130–133 | C2 (D11, Start new) / C1 |
| B | The turn on the host | S6, S7, S7a, P1–P6, D1–D5, the menu, Pause | SWD-012, 030–033, 037, 040–049, 090–098, 101–104, 110–114, 116, 122, 124–126, 129 | C2 |
| C | Map phone | M1–M3 | SWD-034–036, 038, 039 (screen), 117, 120, 121 | C2 (privacy parts tested first, SWD-025, 121) |
| D | After the game | G1, G2, D6–D9, E1, E1a, players sheet | SWD-050–055, 060–067, 112, 127 (sheet), 128 | C2 |
Shared pieces (board grid, `word-zoom`, team bar, `pause-button`, `where-line`, tap-guard look) are built **first in lane B** and
reused by C and D; lane B merges them before C and D start their board screens.

## 3. Tests first (tester), before or with the engine
- C3: SWD-020–028 (deal, map code, golden boards SWD-022, properties SWD-027, 039), SWD-040–046 rules, SWD-050 property,
  SWD-054, 060, 063, 065–067 saved data, SWD-099 word list format, SWD-101, 118, 123, 127 moves, SWD-129.
- Privacy, before any map screen: SWD-025 (no kind of a face-down word in a room screen's page), SWD-031/032/121 (map removed on
  hide, leave, 60 s), SWD-002 D11 dialog.
- **Double-tap privacy (from the 10-year-old's prototype walk, 22 October):** a test that double-taps "I'm Riya" and
  "Play again" (two taps 50 ms apart, and two taps 600 ms apart) and checks the private map never shows a map that wasn't asked
  for with "Tap to see the map" (SWD-031, 114). Before any map screen is built.
- Test ids for 3.6: the list before "## Secret Words later" in `scenarios.md`.

## 4. The text list (`text.csv`, faster-cycles item 2)
Every quoted on-screen string from the canonical strings table, one row each: `key`, `text`, `where`, `scenarios`,
`has_example_values` ("yes" where the text holds example names, words, times or numbers that the app fills in). Kept by the product
owner; when a string changes, the scenarios and this file change in the same commit. The coder may load it into the app's text
module; tests should match by role and label and use `text` only for the key strings a scenario quotes exactly. If the orchestrator
prefers another format or key scheme, say so and the product owner regenerates it.
