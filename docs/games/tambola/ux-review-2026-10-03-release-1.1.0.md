# Release review: rc-2026-10-03b (1.1.0), 3 October 2026

Product owner with the **UX designer**, on the preview link (app reports 1.1.0+72ad1e3; same app code as the
release candidate, later commits changed only screenshots and docs). Sizes 320 × 568, 360 × 640, 390 × 844,
812 × 375, 844 × 390. A phone-ticket game (3 players, one moved to paper, one ticket left waiting, 34 calls, three
bogeys, a win, "Add another winner", room view, End game) and a cue-on game from QR links. Plus all 19 screens in the
tester's "Screenshots to approve" table. **Not covered:** a real camera (old-game claim note), the 6-hour Home state
live (screenshot only), iPhone, a real screen reader (the live region was checked in the page).

## Verdict: GO, with one small text fix first
Nothing blocks play. One dead end on a rare path (N1) gets a one-line message change in this release; everything else
goes to the next list. Earlier strengths are kept (Home's equal cards, bogey verdicts naming uncalled numbers, the room
view, Quick mark's feedback line).

## Rows 1–25
Done: 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21 (screenshot), 22, 24, 25.
Partly:
- **1** cue line: fits and keeps buttons on screen at every size, but the line is cut ("…" + More) at every size, so the
  prize names hide behind More. Accepted for 1.1.0 (point a).
- **6** "Add another winner" in phone games works for phone tickets, but for a paper player it sends the host to
  "Record a win", which is hidden until the prize is closed (N1).
- **15** the 3-per-phone limit works; holding another player's ticket under their name wasn't checked live (the tester's
  TAM-214 covers it).
- **16** the Called/Undo bar is about as heavy as a secondary button, 8 px above "Scan a claim" (judgement; next list).
Not confirmed: **23** the "were cleared" line didn't show once when a new game's ticket replaced old ones (maybe timing);
the old-game claim note needs a camera. Tester to confirm.

## Screenshots (19 screens)
Approved: host-ticket-type, host-prizes, host-hand-out, host-not-handed-out-question, host-plays-on-paper,
host-calling, host-room-view, host-record-a-win, host-game-over-payouts, host-settings-in-game, history-clear-one,
player-which-ticket, player-which-prize, player-claim-qr, player-done-with-this-game, player-home-saved-tickets.
Flagged, not blocking (next list): **host-verdict-proof** (point b), **player-tickets-cue** (point a),
**player-quick-mark** (landscape keys 55–90 and "Show claim" below the screen; ✓ drawn over the digits at 360 and 390).

## The two open points (decided)
- **a. Cue line cut with "…" + More:** accepted for 1.1.0. Next: up to **two lines** with shorter wording,
  "Ticket 1: Early Five, Top Line. Shout!", and More only when even that doesn't fit (3 prizes at 320 px); in landscape
  the line may use the empty space beside the last ticket. At 320 × 568 with Larger text the cells may shrink to about
  29 px to keep the buttons on screen.
- **b. "Undo claim" / "Done" reached by scrolling inside the verdict card on small phones:** accepted for 1.1.0 ("Next
  number" stays reachable, so play never stalls). Next: pin "Undo claim" and "Done" to the bottom of the card, with the
  proof line and picture scrolling above them.

## Findings for the next list
- **N1 (sev 3, host, mixed games):** after a recorded win, "Add another winner" with a paper ticket number says to use
  "Record a win", which isn't available until the prize is closed: a dead end. **For 1.1.0:** the message becomes
  "Ticket 4 plays on paper. To add a paper winner: tap Undo win, then Record a win and pick both names." **Next:** "Add
  another winner" offers the name list, as in paper games.
- **N2 (sev 2):** where the screen can't be kept awake, the "☾ Screen may sleep" badge squeezes the calling header to
  four lines at 320 px and hides the big number at 360 with a verdict showing. Move it into the menu or under the header.
- **N3 (sev 2):** Quick mark in landscape: 10 × 9 keys about 26 px tall (or the ticket pictures beside the pad) so 1–90
  and "Show claim" fit.
- **N4 (sev 2):** Quick mark's ✓ goes in the key's top-right corner, as on ticket cells, not over the digits.
- **N5 (sev 1):** the row 7 question becomes "Has Zoya got their ticket?" with "Yes, start calling" as the main button
  (the host can't know whether she scanned).
- Polish: empty "Last" and "Repeat · Another rhyme" before the first call; at 360 the prizes step's "Once you confirm…"
  half hidden and the session name cut; "Settle with players" wraps at 360; landscape "Which prize?" buttons small and
  left-aligned; landscape claim QR's "Done" below the screen; Called/Undo bar lighter (row 16).

## For the play-test
Does anyone open "More" on the cue line? Do hosts find the scroll in the verdict card?
