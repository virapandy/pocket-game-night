# Release gate: rc-1.2.0 (Tambola 1.2.0, branch release/1.2), 3 October 2026

Product owner with the **UX designer**, from the release branch's own Screenshots run 37119724773 (artifact
screens-snapshots, 114 pictures; all 19 screens at 360 × 640, 390 × 844 and 812 × 375 checked). Pictures only, no live
play. For this release the owner approved leaving Impostor's tests and the screenshot comparison out of the complete
run (decisions.md, 3 October), so this picture review stands in for the comparison.

## Verdict: GO
Nothing in the pictures blocks play.

| Item (1.1.0 review) | Result | Evidence |
|---|---|---|
| Point a, cue line | Fixed | "Ticket 1: Early Five, Top Line. Shout!", two lines at 360 and one at 390 and 812, no "…", buttons on screen; beside the last ticket in landscape |
| Point b, verdict buttons | Fixed | "Undo claim" and "Done" pinned at the bottom of the card at every size |
| N1, paper winner by name | No picture | Owner's try-out and the tester's browser test cover it (see below) |
| N2, nothing under the rhyme before the first call | Fixed | host-plays-on-paper |
| N2, "Screen may sleep" as a thin line | Not shown | The pictures show the first-run "Keep your screen on… Got it" card, which the screenshot test never dismisses |
| N3, Quick mark in landscape | Fixed | 1–90, pictures, cue line and "Show claim" all on screen |
| N4, ✓ in the key's corner | Fixed | all sizes |
| N5, "Has Dad got their ticket?" | Fixed | "Yes, start calling" the only main button; fits everywhere |
| Row 16, lighter Called · Undo bar | Bar in place | its words are see-through on purpose in the test (countdown), so the look is judged in the try-out |
| Payouts buttons at 360 | Fixed | at 390 on the CI's Linux font "Settle with players" is cut ("…playe"); the Mac picture at 390 fits |
| Prizes step at 360 | Fixed | note and session name in full |
| Landscape "Which prize?" and claim QR "Done" | Fixed | |

## For the next list (not blocking)
- The first-run "Keep your screen on" card pushes the big number off screen at 360 while a verdict shows (sev 2);
  the screenshot test should also picture the thin line after "Got it".
- Payout buttons at 390 with wider fonts: let the two buttons stack when they don't fit (sev 2).
- At 360 only a sliver of the proof picture shows above the pinned buttons (sev 1); the player's info line still ends
  in "…" at 360 and 390 (sev 1); "(new)·" missing a space at 812 (sev 1).

## Owner's try-out: please include
A phone-ticket game in which one player is moved to paper: record a phone winner, then "Add another winner" for the
paper player (N1). Also tap "Got it" on the screen tip and check a thin "Screen may sleep" line stays under the header.
