# 05-scoring.md (C3)

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.8, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-040: No points by default
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Score is No
Then no points, ranks or scoreboard show anywhere in the evening
And each counted round's result screen shows `evening-line` "This game: impostor caught 3 · escaped 2": the counts of
this evening's counted rounds, this round included
And the practice round's result shows no `evening-line`
And `evening-line` is never shown while Score is Yes

## IMP-041: Points when keeping score
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Score is Yes
Then each counted round scores exactly (`scoreRound`): escaped (wrong person or "Still a tie"): the impostor +2;
caught with the last-chance guess off: every crew member of that round +1; with it on, caught and "Guessed right":
the impostor +1; caught and "Wrong guess": every crew member of that round +1
And nobody else gets points; the practice round scores nothing
And the result screen shows this round's points and the evening's scoreboard (IMP-044)
And there is no target score: the evening ends only when the host ends it

## IMP-042: Points always add up
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Property (sample 1,000 seeded evenings of 1 to 30 rounds, 3 to 12 players, random outcomes, verdicts, undos,
joins, leaves and Score switches): every player's total equals the sum of their points in the rounds that were
scored; each round's points equal `scoreRound` for its outcome; tolerance 0 differences

## IMP-043: Turning score on or off mid-evening
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Score was No for rounds 1 to 3
When the host switches Score to Yes between rounds ("Change how we play", IMP-006)
Then rounds from round 4 score, and `scoreboard` shows the small line "Scores since round 4"
And "Scores since round N" names the evening's first scored round and shows only when N is greater than 1
When Score is later switched to No
Then `scoreboard` and `round-points` are hidden and `evening-line` shows instead; totals are kept unchanged
When it is switched to Yes again
Then scoring resumes from the next round, adding to the kept totals

## IMP-044: Scoreboard order and this round's points
Status: approved, owner, 2026-10-04 (changed; detail of IMP-041)
Phase: Impostor 1
Then `round-points` shows this round's points: "+2 Arjun" (escaped), "+1 Arjun" (caught, guessed right: last-chance
guess on only), "+1 each: Riya, Meena, Kabir" (caught, with no guess or a wrong guess; that round's crew in seat
order)
And `scoreboard` lists every player of the evening, one `score-row` each, highest total first, ranked 1-2-2-4
(players with equal totals share the rank; the next rank skips), equal totals in seat order
And a player who left stays in the ranking by their total, like everyone else, greyed; among equal totals, current
players come first in seat order, then players who left, in the order they left
And a player who left and is added again with the same name (ignoring case) is a current player again, keeps their
old total, and is no longer greyed
And each row shows the rank, the name and the total, with `data-rank`, `data-name`, `data-points`
And each row has a minimum height of 36 px; a name that does not fit on one line wraps and the row grows; at widths of 360 px or less (320 × 568, 360 × 640) and at 812 × 375 (where the scoreboard
sits in the right half, IMP-081) the scoreboard is one column; at 390 px wide and more in portrait (390 × 844) it is
two columns of 50% each, the first column holding the first ceil(n / 2) rows in rank order and the second the rest
(12 players: 6 and 6; 7 players: 4 and 3; 3 players: 2 and 1)
And the scoreboard never has its own scroll area: the result screen scrolls as one page (guideline 46a, IMP-081)

---
