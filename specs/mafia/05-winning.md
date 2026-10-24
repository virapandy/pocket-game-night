# 05-winning.md: Winning (C3)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## MAF-040: The winner check
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Checked after each night resolves (MAF-027 step 5), after each `voteOut`, and after each day `leave`. With m = Mafia who are in
and v = other players who are in: **m = 0 → the Village wins**; else **m ≥ v → the Mafia win**; else the game goes on. Worked
examples: 9 players, 2 Mafia; night 1 Kabir out (m 2, v 6); day 1 Om out (2, 5); night 2 saved; day 2 Zoya out (1, 5); night 3
Meena out (1, 4); day 3 Arjun out (0, 4) → the Village wins. 6 players, 1 Mafia: night 1 out (1, 4), day 1 a Villager out (1, 3),
night 2 out (1, 2), day 2 a Villager out (1, 1) → the Mafia win.

## MAF-041: Leavers and the winner
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
A leaver counts as out for MAF-040 from the moment the leave applies (day: at once; night: MAF-027 step 4). If the leave decides
the game, G1 shows the winner's h1 and the line "Kabir had to leave." under it. A leaver's role is shown only on G1 (MF10).

**Version 1.1** (item 11): **A night leave takes the player out of tonight at once (owner):** from the moment "Kabir leaves" is tapped at night, Kabir is not in any names box tonight (not a target, not protected, not checked), his turn if not yet taken is skipped, a pick he made still counts, and the leave applies at MAF-027 step 4. So a leaver's role is never shown before game over (MF10) and a leave can't be used to dodge a target already resolved. A leave on N3 applies when "Read the morning" is tapped.

**Version 1.1** (item 13): **A day leave that ends the game** closes the dialog and opens G1 at once; the toast "Kabir left · Undo" shows on G1 and Undo returns to the screen before with the leave removed. Any later recorded move closes an undo toast; a night leave's Undo works only until MAF-027 runs.

## MAF-042: Ending with no winner
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
`endGame` (MAF-054) ends the game with no winner: G1 h1 "Game ended. No winner.", every role shown; the game is not in tonight's
Village–Mafia tally (MAF-062) but counts in "games" (MAF-064).

## MAF-043: Properties of a whole game
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
For thousands of random games (seeded deals, random legal moves from the Rule API, random leaves; MAF-P6): every game ends; exactly
one of Village win, Mafia win or no winner; the tally adds up (Village + Mafia = games with a winner); no move is accepted that
the rules forbid (a pick of a disallowed name, a vote for a player who is out, a `nightPick` out of order, "Deal again" after
"Start the night"); `replay` of the saved moves gives the same state.
