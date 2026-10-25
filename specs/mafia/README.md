# Mafia: scenarios (version 1.1, approved 25 October 2026)

Copied from `docs/games/mafia/scenarios.md` (version 1.1), the binding contract, split into one file per section as its headings name.
Status: **version 1.1 approved by the owner, 25 October 2026** (decision MF18: "Approved: Mafia scenarios version 1.1, including your calls on the same names for every role at night and on leaving during the night or the deal."). Every scenario is `Status: approved`. Each scenario carries the Version 1.1 items that name it, word for word, under "Version 1.1"; they win over the text above them. Decisions MF1–MF15 and MF18 (`docs/decisions.md`). Where `screen-map.md`, `guide.md`, `lifecycle.md` or `stories.md` differ, these scenarios win.
Rule API for the tests (MAF-H1 made exact): [api.md](api.md). Mafia is released after What Am I? (owner, 24 October).

| File | Scenarios |
|---|---|
| [01-setup.md](01-setup.md) | MAF-001 to MAF-006 (C1/C2) |
| [02-deal.md](02-deal.md) | MAF-010 to MAF-016 (C3 rules; screens C2) |
| [03-night.md](03-night.md) | MAF-020 to MAF-028 (C3 rules; screens C2) |
| [04-day.md](04-day.md) | MAF-030 to MAF-037 (C2; votes C3) |
| [05-winning.md](05-winning.md) | MAF-040 to MAF-043 (C3) |
| [06-room.md](06-room.md) | MAF-050 to MAF-055 (C2) |
| [07-results.md](07-results.md) | MAF-060 to MAF-064 (saved data C3) |
| [09-usability.md](09-usability.md) | MAF-080 to MAF-083 (C1/C2) |
| [10-lifecycle.md](10-lifecycle.md) | MAF-090 to MAF-093 (saved data C3) |

Change classes (`docs/change-sop.md`): the deal and its seed, the night rules and their resolution, winning, saved game nights
and the stories file = **C3** (tests first: sections 02, 03, 05, 10); screens = C1/C2.

## Version 1.2 (owner, 25 October 2026): privacy changes
The owner approved three privacy changes on 25 October ("do all as recommended"; C3, MAF-P2/P7, guideline 51). Each is a
"Version 1.2 (owner, 25 October)" paragraph on the scenarios it changes, and wins over Version 1.1:
- **A. N2's names look the same for every role** (MAF-022 to MAF-026): no greyed or disabled name for any role, the same
  tags for every role ("you", "out" only), a tap on a name the role may not pick does nothing, accessible names are the
  name only, and a Police with nobody left to check still taps a name ("Nobody left to check." in the result line).
- **B. End the game, then Undo** (MAF-054, MAF-060): while "Game ended · Undo" shows, G1 shows no "Who was who" and no role.
- **C. The Police's first tap is saved at once** (MAF-025): the move `check` (api.md); after a reload, hiding the app or
  Back the Police sees the same answer and cannot check another name that night.

## Version 1.1 items that apply to every section

The other items (4 to 32) are copied into the scenarios they name. Item numbers as in `docs/games/mafia/scenarios.md`.

1. **Screen IDs** (used across this file): S1 Who's playing? · S2 Roles · S3 Read this aloud · S4 How to play · B1 deal pass screen · B2 role card · N0 Night begins · N1 night pass screen · N2 night job · N3 Night over · M1 Morning · Y1 Day · V1 countdown · V2 picker (one name) · V2t picker in tie mode · V3 re-vote picker (tied players only) · V3s "Still a tie" screen · V4 vote result · G1 Game over · G2 Tonight's summary · D5 the "Whose role?" dialog.
33. Browser hooks use Impostor's `localStorage['pgn.test.seeds']` (development and preview builds only, IMP-064) with this shape: `{ "mafia": { "seeds": { "roles": "mafia-example" }, "deals": { "1": { "Riya": "villager", "Arjun": "mafia", … } }, "stories": { "out": ["…"], "saved": ["…"] } } }`; any part may be left out. Deals are by game index k; a deal that doesn't match the players or the Mafia count is ignored (as M26).
34. **MAF-H6 (new):** a saved-state loader for tests: `localStorage['pgn.test.load']` = a `SavedGame` JSON for Mafia, opened on next load as if resumed (development and preview builds only), so night 3 or game 3 need not be played through the screens.

## Terms
Terms defined in `docs/games/impostor/scenarios.md` mean exactly the same here: **main button, quiet button, small text link,
selected, tint, greyed, disabled, small line, body text, toast, dialog, Larger text, fits in N lines, no page scrolling,
names, plurals, t = …, sound on**. Undo toasts last **10 s**. Characters as in Secret Words' Terms ("·" U+00B7 with a space
either side; "←" U+2190; "✕" U+2715; "–" U+2013; apostrophes U+0027).

| Term | Meaning |
|---|---|
| **Screen sizes** | 320 × 568, 360 × 640, 390 × 844 (portrait), 812 × 375 and 568 × 320 (landscape). "Every size" = all five, Larger text off and on. |
| **Roles** | `mafia`, `doctor`, `police`, `villager`. On screen: "Mafia", "Doctor", "Police", "Villager". The sides: **the Mafia** (every `mafia`) and **the Village** (everyone else). |
| **Mafia count** | The number of `mafia` dealt in a game. **Suggested**: 5–7 players → 1, 8–11 → 2, 12–15 → 3, 16 → 4 (MF5). |
| **In / out** | A player is **in** until they are out at night, voted out, or leave. Players who are out stay at the table and in the night pass (ghost guess). |
| **Shown role** | A player's role is **shown** when they go out at night or are voted out (MF3). A **leaver's** role is not shown until game over (MF10). |
| **Tonight / game night** | One Mafia saved game night (engine `SavedGame`), from the first `start` to `endEvening`, holding every game of that night; joins tonight's session as IMP-102. On screen "tonight" only. |
| **Game** | From `start` (the deal) to game over or `endGame`. **Game index** k = 1 for tonight's first game. |
| **Round** | Night r and the day r after it. Night 1 comes first (MF guide rule 1). |
| **Night order** | Every player dealt this game who hasn't left, in seat order, starting at seat ((k − 1) + (r − 1)) mod n, where n = players dealt this game and seats are numbered 0 to n − 1 in S1's order; a seat whose player has left is skipped. |
| **Private screen** | B2 (role card) and N2 (night job): reached only through a pass screen; no menu, no Pause, no toast. Every other screen is a **room screen**. |
| **Guard** | A main button ignores taps for 800 ms after its screen mounts (1000 ms for "I'm Riya") and keeps its normal live look meanwhile; a tap during a guard does nothing and is never carried to the next screen (as WAI and SWD-114). |
| **Night job guard** | N2's main button stays hidden until **both**: 4000 ms have passed since the job was first shown on this N2, and a name is picked (MF1). The 4000 ms keep counting while the job is hidden again. |

Example players in seat order: **Riya, Arjun, Meena, Kabir, Zoya, Dev, Om, Sunita, Neha** (9). Example deal (game 1, seed fixed
by MAF-H2): Mafia **Arjun** and **Zoya**; Doctor **Meena**; Police **Dev**; Villagers Riya, Kabir, Om, Sunita, Neha. Added later:
**Imran**. Plurals: "1 player" / "2 players"; "1 game" / "2 games"; "1 Mafia" / "2 Mafia" (Mafia has no plural form).

## Canonical strings
| Where | Exact text | Element | ID |
|---|---|---|---|
| Picker card | "Mafia" · "Find the Mafia before they find you · 5–16 players · 15–30 min a game" | button, name starts "Mafia" | MAF-001 |
| Home unfinished row | line 1 "Mafia · Night 2 · Meena's turn with the phone"; line 2 "Riya, Arjun +7 · 9:10 pm · Tap to resume" | inside `unfinished-games` | MAF-091 |
| Who's playing? | h1 "Who's playing?"; "Mafia needs at least 5 players."; "Up to 16 players."; "Riya is already playing. Add an initial, like Riya S."; toast "Kabir removed · Undo"; small text link "How to play"; quiet "← Back"; main "Next" | h1; `role="alert"`; toast; buttons | MAF-002 |
| Roles | h1 "Roles for 9 players"; "Mafia: 2" with buttons "−" "+" (names "Fewer Mafia", "More Mafia"); "We suggest 2 for 9 players."; "Doctor: 1", "Police: 1", "Villagers: 5"; 5 players: "With 5 players: 1 Mafia and 4 Villagers. Doctor and Police join at 6."; rules box (MAF-003); small text link "How to play"; quiet "← Back"; main "Give everyone a role" | h1; lines; buttons; main | MAF-003 |
| Read this aloud | h1 "Read this aloud"; card text (MAF-005); quiet "← Back"; small text link "How to play"; main "Pass the phone round" | h1; paragraph; buttons | MAF-005 |
| Deal pass | "Player 2 of 9"; "Pass the phone to"; RIYA; "Everyone else, look away!"; main "I'm Riya" | `deal-progress`; `pass-name`; paragraph; main | MAF-010 |
| Role card | "Player 2 of 9"; RIYA; quiet "Tap instead"; pad "Hold here to see your role" (tap mode "Tap to see" / "Tap to hide"); role lines (MAF-011); quiet "First time? What this role means"; "Not Riya? ← Back"; quiet "Someone saw my role"; main "Done, pass to Arjun" / "Done, everyone's seen" / in D5 "Done, back to the day" | as IMP-010 | MAF-011–014 |
| Night begins | h1 "Night 1"; "Pass the phone round once more. Everyone does the same: tap to see your night job, pick one name, tap Done, pass it on."; "Keep your face still!"; main "Start the night" | h1; paragraphs; main | MAF-020 |
| Night pass | "Night 1 · 3 of 9"; "Pass the phone to"; MEENA; "Everyone else, look away!"; out player: "You're out: pick who you think is Mafia."; main "I'm Meena" | `night-progress`; `pass-name`; paragraphs; main | MAF-021 |
| Night job | "Night 1"; MEENA; pad "Tap to see your night job" / "Tap to hide"; job line and result line (MAF-022–026); "Not Meena? ← Back"; main "Done, pass to Kabir" / last "Done, night over" | `night-progress`; `pass-name`; button; `job-line`; `night-names`; `result-line`; main | MAF-022 |
| Night over | h1 "Night over."; "Host, take the phone and read the morning aloud."; main "Read the morning" | h1; paragraph; main | MAF-028 |
| Morning | h1 "Morning, day 1"; the story; role line "Kabir was a Villager." / "Kabir was MAFIA!"; count line "8 players left · Mafia caught: 0 of 2"; quiet "See my role again", "End the game", "← Home"; main "Start talking" / "See who won" | h1; `story`; `role-line`; `count-line`; buttons | MAF-030 |
| Day | h1 "Day 1 · Talk it over"; h2 "Who's still in"; out players "Kabir · Villager · out night 1"; "Out players: watch quietly, no hints!"; quiet "See my role again"; small text link "Start a 2-minute timer" / "Stop timer"; `day-timer` "1:59"; "Time's up!"; quiet "← Home"; main "Time to vote" | h1; h2; list; small lines; buttons | MAF-031 |
| Countdown | heading "Everyone in, point at who you think is Mafia."; "3", "2", "1", "Point!"; quiet "Not yet" | `countdown-heading`; `countdown-number`; button | MAF-032 |
| Picker | h1 "Who got the most fingers?"; name buttons; "Not sure?"; text buttons "It's a tie", "Count again", "Nobody today"; quiet "← Back to talking"; main "Vote out" (disabled) / "Vote Kabir out" | as IMP-031 | MAF-033 |
| Tie | h1 "Tap everyone who is tied"; "Not a tie"; main "Point again: Kabir or Om"; re-vote "Still a tie"; second tie h1 "Still a tie. Nobody is out today."; quiet "← Home"; main "Start night 2" | as IMP-032 | MAF-034 |
| Nobody today | dialog "Nobody out today?"; "Nobody goes out today. Straight to night 2."; "Nobody today" / "Back to the vote" (main) | dialog | MAF-035 |
| Vote result | h1 "KABIR is out."; after 1.5 s "Kabir was MAFIA!" / "Kabir was a Villager." / "Kabir was the Doctor." / "Kabir was the Police."; count line; quiet "End the game", "← Home"; main "Start night 2" / "See who won" | h1; `role-line`; `count-line`; buttons | MAF-036 |
| Leave | dialog "Kabir has to leave?"; by day "Kabir goes out now. Their role stays secret until the game ends."; at night "Kabir leaves when this night is over. Their role stays secret until the game ends."; "Kabir leaves" / "Don't remove Kabir" (main); toast "Kabir left · Undo" | dialog; toast | MAF-052 |
| Deal again | dialog "Deal again?"; "Everyone gets a new role."; "Deal again" / "Keep these roles" (main) | dialog | MAF-014 |
| See my role again | dialog "Whose role?"; names of players in; "Cancel" | dialog | MAF-015 |
| Paused | dialog "Paused"; where-line; "Tap Carry on when everyone's back."; main "Carry on" | dialog | MAF-050 |
| End the game | dialog "End this game with no winner?"; "Everyone's role will be shown."; "End the game" / "Keep playing" (main); toast "Game ended · Undo" | dialog; toast | MAF-054 |
| End for tonight | dialog "End for tonight?"; "Tonight's score stays in History." / mid-game "Tonight's score stays in History. This game won't count."; "End for tonight" / "Keep playing" (main) | dialog | MAF-063 |
| Game over | h1 "The Village wins!" + "Every Mafia is out." / "The Mafia win!" + "They're as many as everyone else." / "Game ended. No winner."; leaver line "Kabir had to leave."; h2 "Who was who"; rows "Arjun · Mafia · voted out day 2"; quiet "What happened each night"; fun lines (MAF-062); "Tonight: Village 2 · Mafia 1"; quiet "Change players or roles", "End for tonight", "← Home"; main "Play again" | h1; small lines; h2; list; buttons | MAF-060–062 |
| Tonight's summary | h1 "Tonight's Mafia"; "9 players · 3 games"; "Village 2 · Mafia 1"; "Arjun was Mafia in 2 games"; "Best Mafia spotter tonight: Om"; quiet "Oops, keep playing", "← Home"; main "Play something else" | h1; small lines; buttons | MAF-064 |
| Where-line | "Night 2 · Meena's turn with the phone" · "Morning, day 2" · "Day 2 · talking" · "Day 2 · vote" · "Game over, game 2" | `where-line` | MAF-090 |
| Menu | "How to play", "Players", "See my role again", "Deal again", "Pause", "Home (game is saved)", "End the game", "End for tonight", "Settings", "History" (only those that apply, this order) | menu items | MAF-053 |

## Properties (the tester's fast-check suites)
- **MAF-P1** Deal (MAF-010). **MAF-P2** Nothing secret on room screens (MAF-016). **MAF-P3** Night rules (MAF-027).
- **MAF-P4** "Mafia caught" never moves on a leave. **MAF-P5** Stories (MAF-037). **MAF-P6** Whole games (MAF-043).
- **MAF-P7** Same for everyone at night: for every role, N2 has the same elements in the same order with the same sizes (±1 px)
  at every size, and the same guard; the night pass's T and order never depend on roles.

## Test hooks the build provides
- **MAF-H1** Rule API in `src/games/mafia/index.ts` (pure), fitting the engine (`startMatch`, `play`, `replay`, `viewFor`,
  `SavedGame`, `createRng`, `shuffle`). Moves: `start`, `seen`, `redeal`, `startNight`, `nightPick`, `voteOut`, `tie`,
  `voteNobody`, `leave`, `unleave`, `addNext`, `endGame`, `unEndGame`, `endEvening`. `viewFor(state, player)` returns only what
  that player may see; `viewFor(state, 'room')` what room screens may show.
- **MAF-H2** Seeds: `{ roles: string }` (deal, Mafia random choice, stories), fixable in development and preview builds only
  (IMP-064).
- **MAF-H3** Deal override: give the roles directly (e.g. the example deal) in development and preview builds only.
- **MAF-H4** Fake clock (guards, the 4000 ms night job guard, the 60 s hide, the 1500 ms vote result, the day timer, toasts, 6 h
  and 12 h).
- **MAF-H5** Story list override: a short test list (e.g. 2 `out`, 1 `saved`) to exercise reuse.
