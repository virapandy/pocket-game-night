# 09-usability.md: Usability (C1/C2)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## MAF-080: One main button, guards, sizes
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
At most one main button per screen, and it is the next step (as IMP-080); every main button has the guard (Terms); every screen
works at every size (IMP-073, IMP-088 rules); no page scrolling on B1, B2, N0–N3, M1, the countdown and V2–V4 at every size with
Larger text off (G1, G2, S1–S3 and Day may scroll, main fixed); at 812 × 375 and 568 × 320 the main button sits bottom right as
Impostor's landscape rule.

**Version 1.1** (item 6): **N2 arithmetic (rule 4), 320 × 568, Larger text off, no top bar on N2:** 16 + night-progress 18 + 4 + name 34 + 8 + pad 48 (once shown, the pad shrinks from 120 px to a 48 px "Tap to hide" button) + 8 + job-line 41 + 8 + names box + 8 + result-line 41 + 8 + main 60 + 16 = 318 + names box, so the names box is 250 px: **3 rows (6 names) without scrolling**; more scroll inside the box. Larger text on: 3 rows still (the box is 228 px). Landscape (812 × 375, 568 × 320): names box in the right half at full height minus 32 px (at least 4 rows, 8 names); everything else in the left half, main bottom left of that half.

## MAF-081: Night screens can't be read from across the table
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
On N2 the job line and names are body text (17 px; 21 px with Larger text); nothing on N2 uses colour alone to show a role; the
role word in the job line is the same weight and colour for every role. B2 follows IMP-011's sizes.

## MAF-082: Screen readers, no flashing, kind words, sounds
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
As IMP-083 (private text in a polite `private-live` region only while shown), IMP-084, IMP-085 (no screen says "killed", "dead",
"die" or "murder"; MF2), IMP-087 (screen stays awake during a game) and IMP-089 (sounds: `tick`/`ding` in the countdown and the day
timer only; **no sound or vibration on N2 or B2**, so a role never makes a noise).

## MAF-083: Words
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Every on-screen string is in the Canonical strings or a scenario; none other. Banned on every Mafia screen: "killed", "dead",
"die", "murder", "lynch", "eliminate", "werewolf", "moderator", "session", "evening".
