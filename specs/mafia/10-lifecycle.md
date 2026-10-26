# 10-lifecycle.md: Lifecycle (saved data C3)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## MAF-090: Where-line
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
The where-line (Canonical strings) shows under "Welcome back." after a reload or a return from hidden, on the Paused cover, and on
Home's unfinished row (line 1 there: "Mafia · Night 2 · Meena's turn with the phone" / "Mafia · Day 2 · talking" / "Mafia · Game
over, game 2").

**Version 1.1** (item 3): **Where-lines (MAF-090), complete:** B1 "Dealing roles · Riya's turn with the phone"; N0 "Night 2 · starting"; N1 "Night 2 · Meena's turn with the phone"; N3 "Night 2 · over"; M1 "Morning, day 2"; Y1 "Day 2 · talking"; V2, V2t, V3 "Day 2 · vote"; V3s and V4 "Day 2 · after the vote"; G1 "Game over, game 2". Home row line 2's time is the game night's first `start`.

## MAF-091: Resume, never on a private screen
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Every move is saved as it happens. Reopening the app or tapping Home's row returns to the room screen of the current step: during
the deal or a night, the pass screen of the player whose turn it is (never B2 or N2); otherwise the screen itself (N0, N3, M1, Y1,
V2, V4, G1; the countdown and the tie screens resume at V2 with nothing selected; an open dialog at the screen under it), with
"Welcome back." and the where-line. A game night left unfinished ends by itself 12 hours after its last move, as IMP-104.

**Version 1.1** (item 22): **MAF-091:** after a recorded `tie`, the game resumes at **V3** (the tied players); V3s and V4 resume as themselves, V4 with the role line shown at once.

**Version 1.4 (product owner, 26 October; owner away)** (item 2; answers the Test role's row of 25 October): after the night's last pick and before "Read the morning", a resume opens **N3** ("Night over.", where-line "Night 2 · over", "Welcome back."), so the phone goes back to the host before the morning shows; never M1. Tests: `tests/browser/mafia-v14.spec.ts`, `mafia-deal-night.spec.ts` (MAF-028).

## MAF-092: Coming back the next day
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
When Home's row is tapped more than 6 hours after the last move and the game is past the deal, the resumed screen first shows the
line "Back after a break? Everyone can see their role again." with the quiet button "See my role again" (MAF-015) above the main
button. *(Product owner's call, lifecycle.md; low.)*

**Version 1.1** (item 21): **MAF-092:** the line shows only when the game resumes on M1 or Y1 (from a reopen or Home's row) and the last move was more than 6 hours ago and the last `seen` is recorded; resuming elsewhere, it shows once on the next M1 or Y1.

## MAF-093: History and saved data
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
History lists "Mafia · 9:10 pm · 9 players · The Village won · 3 nights" per game (no winner: "Game ended"), and "Play again"
there opens Who's playing? with its players. A finished game keeps players in seat order, every role, every night's picks
(including Villagers' and ghost guesses), the Mafia's random choice, each vote, leavers, the story ids used and the role seed, so
`replay` rebuilds it exactly. Saved data carries a format version (IMP-096); a game night with no game past the deal is not kept
(IMP-097).

**Version 1.1** (item 19): **History (MAF-093):** "The Village won" / "The Mafia won" / "Game ended"; "3 nights" counts resolved nights.
