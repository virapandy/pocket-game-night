# 07-results.md: Game over and tonight (saved data C3)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## MAF-060: Game over
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
G1: the winner's h1 and line ("The Village wins!" + "Every Mafia is out." / "The Mafia win!" + "They're as many as everyone
else." / "Game ended. No winner."); leaver line when MAF-041 applies; h2 "Who was who": one row per player dealt, in seat order,
"Arjun · Mafia · voted out day 2" / "Kabir · Villager · out night 1" / "Riya · Villager · in to the end" / "Neha · Police · left";
quiet "What happened each night" opens a list, one line a night: "Night 1: the Mafia picked Kabir · the Doctor protected Kabir ·
the Police checked Zoya (Mafia) · nobody was out" (when the Mafia differed: "the Mafia picked Kabir and Om; the phone chose Om");
the fun lines (MAF-062); the tally line "Tonight: Village 2 · Mafia 1" (left out until a game tonight has a winner); quiet "Change
players or roles", "End for tonight", "← Home"; main "Play again". The page may scroll; the main button stays fixed.

**Version 1.1** (item 18): **"What happened each night"** (MAF-060), clauses in this order, each left out when its role made no pick (no such role, out, left, 5 players, nothing left to check): "the Mafia picked Kabir" (differ: "the Mafia picked Kabir and Om; the phone chose Om"; no pick: "the Mafia made no pick") · "the Doctor protected Kabir" (self: "the Doctor protected themselves") · "the Police checked Zoya (Mafia)" / "(Not Mafia)" · last: "Kabir was out" / "nobody was out". A night leaver adds "· Kabir left".

## MAF-061: Play again and changes
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"Play again" records `start` for game k + 1 with the same players (players added by `addNext` at the end of the seat order,
leavers removed) and the same Mafia count, unless MAF-003's limits no longer allow it, then the suggestion S; fewer than 5
players → Who's playing? with "Mafia needs at least 5 players." No read-aloud. "Change players or roles" → Who's playing? (with
"← Back to the game" returning to G1, nothing recorded) → Roles → "Give everyone a role" → the deal.

**Version 1.1** (item 28): **MAF-002:** after a refused 17th name the field keeps the text; "Up to 16 players." and "Mafia needs at least 5 players." are `role="alert"`. **MAF-061:** S1 opened from G1 shows "← Back to the game" in place of "← Back".

## MAF-062: Fun lines and the tally
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
On G1, each only when it applies: **"Best Mafia spotter: Om picked a Mafia 3 nights out of 3"**: the Villager whose night picks
named a `mafia` on the most nights, at least 2 (ties: earliest in seat order); **"Best ghost guess: Riya"**: the out player whose
ghost guesses named a `mafia` most often, at least 1 (ties: seat order). The tally counts games with a winner tonight: "Tonight:
Village 2 · Mafia 1" (both numbers always shown once a game has a winner, "Village 1 · Mafia 0").

**Version 1.1** (item 17): **Spotter (MAF-062):** only players dealt `villager`; "out of N" = nights they picked while in; ghost guesses excluded; no full stop. **Best ghost guess:** only out players dealt `villager` or `doctor` (an out Mafia knows; the Police may have checked).

## MAF-063: End for tonight
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Menu or G1 "End for tonight" → dialog (Canonical strings) → "End for tonight" → G2 (MAF-064); `endGame` (mid-game) and
`endEvening` are recorded when G2 is left or after the rules of SWD-060 ("Oops, keep playing" returns unchanged).

**Version 1.1** (item 15): **Games** (MAF-064): every game started tonight, including ended-early and cut short by End for tonight; the Village–Mafia tally counts only games with a winner. MAF-063's "This game won't count." means "won't count for the Village or the Mafia": the line becomes "Tonight's score stays in History. This game won't count for either side."

## MAF-064: Tonight's summary
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
G2: h1 "Tonight's Mafia"; "9 players · 3 games" (players dealt in any game tonight; games = games started, ended or won);
"Village 2 · Mafia 1"; "Arjun was Mafia in 2 games" (the player Mafia in the most games, at least 2; ties: seat order; else left
out); "Best Mafia spotter tonight: Om" (most spotter nights over all games, at least 2; else left out); quiet "Oops, keep
playing", "← Home"; main "Play something else" → the picker with tonight's names. Menu: only "Delete tonight's games" (as SWD-060
and D9).

**Version 1.1** (item 15): **Games** (MAF-064): every game started tonight, including ended-early and cut short by End for tonight; the Village–Mafia tally counts only games with a winner. MAF-063's "This game won't count." means "won't count for the Village or the Mafia": the line becomes "Tonight's score stays in History. This game won't count for either side."

**Version 1.1** (item 29): **MAF-064:** G2's menu item "Delete tonight's games" opens D9 as in Secret Words (same words, "games" for Mafia).
