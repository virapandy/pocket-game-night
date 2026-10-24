# What Am I?: six persona walks of the prototype (product owner, 24 October 2026)

Prototype `/preview/proto/what-am-i/` after the renderer learned section K4. Six persona walks (mid-size model, own tab each:
grandparent, first-time host, 10-year-old with a Back check of 10 presses, distracted host, competitive uncle, guest on their
first turn). Nobody got stuck on a design problem. Fixes: scenarios **Version 1.3**, map draft 4.3.

## Back (the coder couldn't reproduce the old problem)
**Fixed:** in 23 of 27 presses Back went to the previous screen, double taps added one history step, and scroll was kept.
**Still wrong, all prototype-only:** with a menu or dialog open, Back closed it **and** went back a screen (or, once, left the
dialog open and jumped two screens); after a dialog was closed, Back reopened it (T4 → D7, G2 → D6); editing the address hash
(#S2) changed the address but not the screen. In the real app Back during a turn pauses (WAI-040) and on a dialog closes it
(1.2 item 17), so the renderer should match: Back on an open dialog or menu only closes it, and closed dialogs are not history.

## Design findings and fixes (Version 1.3)
| Finding | Walks | Fix |
|---|---|---|
| T3's "Give clues…" read as meant for the guesser | guest | 1: "Everyone else: give clues. Don't say the word!" |
| "Round 1 done" read as game over | guest | 2: "Round 1 done. Round 2 next." |
| Can't see who's ahead until the round ends | 10-year-old, uncle | 3: T4 "Riya: 9 in all · Top: Arjun 14"; menu "Scores" |
| Hold choice buried under nine packs on S2 | grandparent, host | 4: time, hold, then words |
| The fixed main button covers Back, How to play, Home, the last lines | 10-year-old, host, uncle, distracted host | 5: bottom padding; toasts never hide the only way out |
| "Add" cut off at 320 px | 10-year-old | 6 |
| No scoring or judging rule in How to play | uncle | 7 |
| Paused doesn't say the clock stopped | distracted host | 8 |
| Time and pack name tiny on T3 | distracted host, guest | 9 |
| No way back from the picker | grandparent, host, 10-year-old, uncle (Jev 0.06) | 10: "← Home" on the shared picker |

**For the owner (rules for every game):** the greyed main-button guard looks disabled to all six walks (taps feel lost);
"End the game" vs "End for tonight" confused three walks.

**Prototype-only:** fixed example data (names, rounds, counts, "2 players needed" with 6 players), the clock not running (K3
asked for a jump to T4 after the seventh word), T2 showing the tap hint after choosing motion, the "Drawing" boxes, the Back
issues above.
