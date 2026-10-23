# What Am I?: first prototype walks and second Jev read (product owner, 23 October 2026)

Prototype `/preview/proto/what-am-i/` (generated from screen map draft 4). Three persona walks (grandparent, first-time host,
10-year-old; mid-size model, own browser tab each) and Jev's second screen read of the map (`jev-map-2.md`, 215 decisions).

## What we learned
**Most of what the walks hit is how the prototype was drawn, not the design.** The renderer drew rows' descriptions as
buttons and left out lists, because draft 4's table cells described taps instead of quoting labels:
- A1 showed only a button "Unfinished What Am I? row" that did nothing, and no "Host a game" (stuck, 3/3).
- T3 showed no word, only the gesture descriptions as buttons (stuck, 3/3).
- S2 showed "a pack" and plain lines with no ✓ or radio; S4 How to play was empty; S1's main read "Drag a name"; D2 had no
  names; R1 and G1 had no scoreboard; T4's word chips didn't move; D1 showed 'quiet "Skip Riya's turn"'.
- A double tap on "I'm Riya: start" skipped the countdown; browser Back went to the index.
Fixed in the map: real quoted labels in the tap tables and **K4, exact states for the renderer** (draft 4.1). The
prototype needs re-rendering before the remaining walks (distracted host, competitive uncle, guest) and a re-run of these three.

**Real design findings (Jev and at least one walk agree):**
- **T1 is crowded** (Jev purpose 0.71; all three walks): "Players (6) ›" leaves T1 (stays on R1 and in the menu). Draft 4.1,
  scenarios 1.1 item 50.
- **S1 and S2: personas reach for How to play** (Jev: first-time host 0.85 / 0.81; the host walk wanted the rules first): the
  button is there and must work (it was broken in the prototype). No design change.
- **Words to watch on the next walk:** "Pass" and "Got it" (grandparent), "Hands-free", "Mix of all", "pack" (in the
  prototype these showed out of context). Re-check on the re-rendered prototype before rewording.

**Jev's second read in short:** no screen flagged; the main button is Jev's top pick on S1, T1, T0, T4 and R1 (0.60–0.70) and
clear on S3 and G2; unsure on S2 (← Back 0.42 over the main 0.31) and G1 (Play again 0.48, personas lean to ← Home at the end
of a night, which is fine). A2's way out (0.06): the picker has no Back on purpose (Home is the app's top). G2's buttons
picked up the history table under it; draft 4.1 keeps that table further down, after K.
