# 04-day.md: Morning and day (C2; votes C3)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## MAF-030: Morning
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
h1 "Morning, day r"; `story` (MAF-037); for a night out, `role-line` "Kabir was a Villager." / "Kabir was the Doctor." / "Kabir
was the Police." (a Mafia is never out at night); `count-line` "8 players left · Mafia caught: 0 of 2", where the first number
counts players who are in, and **Mafia caught** counts Mafia whose role has been shown (MAF-P4: a leaver never changes this line
before game over). Quiet "See my role again" (MAF-015), quiet "End the game" (MAF-054), quiet "← Home" (MAF-091); main "Start
talking" → MAF-031, or, when the night ended the game, main "See who won" → G1 and only "← Home" stays among the quiet buttons.
Pause icon. Menu: How to play · Players · See my role again · Pause · Home (game is saved) · End the game · End for tonight.

**Version 1.1** (item 25): **MAF-036 and MAF-030:** when the vote or night ends the game, only "← Home" stays among the quiet buttons; quiet buttons are there from t = 0.

## MAF-031: Day: talk it over
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
h1 "Day r · Talk it over"; h2 "Who's still in" with players who are in (seat order); then out players greyed, "Kabir · Villager ·
out night 1" / "Om · Villager · voted out day 1", and leavers "Neha · left" (no role); small line "Out players: watch quietly, no
hints!"; quiet "See my role again"; small text link "Start a 2-minute timer"; quiet "← Home"; main "Time to vote" → MAF-032.
The timer: tapping the link starts `day-timer` at "2:00", counting down each second (t = 0 at the tap; paused while the Paused
cover is open); the link reads "Stop timer" (removes the timer). At 0: sound `ding` (if sound on), "Time's up!" replaces the
timer, nothing else happens. Pause icon. Menu as MAF-030.

**Version 1.1** (item 23): **MAF-031 timer:** shows m:ss, "2:00" at t = 0, "1:59" at t = 1 s, never "0:00" ("Time's up!" at t = 120 s, and the link then reads "Start a 2-minute timer" again); keeps counting during the countdown (its ding may sound then); not saved (a reload removes it). "Out players: watch quietly, no hints!" shows only when someone is out.

## MAF-032: The countdown
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
As IMP-030 with heading "Everyone in, point at who you think is Mafia." and, for a re-vote, "Point only at Kabir or Om" (names in
seat order, ", " and " or " before the last). Started by "Time to vote", "Count again" or "Point again: …". Quiet "Not yet"
during the countdown → Day (timer state kept). Then the picker opens by itself.

**Version 1.1** (item 2): **Countdown (V1)** has no menu and no Pause; a leave can't start there. MAF-052's "by day" list is **M1, Y1, V2, V2t, V3, V3s, V4**. MAF-050's Pause list is B1, N0, N1, N3, M1, Y1, V2, V2t, V3, V3s, V4 and G1.

## MAF-033: Who got the most fingers?
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
As IMP-031 with: name buttons for players who are in; the text buttons "It's a tie", "Count again" and **"Nobody today"** (three
side by side of equal width; at 320 px wide two on the first row and "Nobody today" centred under them); quiet "← Back to talking"
→ Day (the timer reset to none); main "Vote out" disabled → after a pick "Vote Kabir out" → records `voteOut { player }` → MAF-036.

**Version 1.1** (item 24): **MAF-033/034:** "Nobody today" is on V2 only, not V2t or V3. V2t's main reads "Point again" (disabled) until 2 are ticked.

## MAF-034: A tie
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
As IMP-032 with "Reveal" read as "Vote … out": "It's a tie" → h1 "Tap everyone who is tied", "Not a tie", main "Point again: Kabir
or Om" → records `tie { players }` → the countdown → a re-vote picker with only the tied players, "Still a tie" and "Count again";
"Vote Kabir out" → `voteOut` → MAF-036. **"Still a tie"** records `voteNobody { reason: 'secondTie' }` and shows h1 "Still a tie.
Nobody is out today.", quiet "← Home", main "Start night r + 1" → N0. There is never a second re-vote (MF6).

**Version 1.1** (item 14): A tied player who leaves before the re-vote is dropped from V3; if one tied player is left, V3 shows that name alone.

**Version 1.1** (item 24): **MAF-033/034:** "Nobody today" is on V2 only, not V2t or V3. V2t's main reads "Point again" (disabled) until 2 are ticked.

## MAF-035: Nobody today
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"Nobody today" opens the dialog of the Canonical strings; "Nobody today" records `voteNobody { reason: 'chosen' }` → N0 for night
r + 1; "Back to the vote" (main) → the picker, nothing recorded (MF12).

## MAF-036: Vote result
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
h1 "KABIR is out." (name in capitals); at t = 1500 ms the `role-line` "Kabir was MAFIA!" / "Kabir was a Villager." / "Kabir was
the Doctor." / "Kabir was the Police." and the count line (MAF-030 rule); the main button appears at t = 1500 ms with its guard
from then. Main "Start night r + 1" → N0, or "See who won" → G1 when the vote ended the game. Quiet "End the game", "← Home".
A vote is final once "Vote Kabir out" is tapped: there is no undo (as IMP-031; the pick-then-confirm is the safety).

**Version 1.1** (item 25): **MAF-036 and MAF-030:** when the vote or night ends the game, only "← Home" stays among the quiet buttons; quiet buttons are there from t = 0.

## MAF-037: The morning story
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Stories come from `content/mafia/stories.json`, built from `docs/games/mafia/stories.csv` (edition 1.2: 12 `out`, 10 `saved`,
ids kept). Each morning: out → an `out` story with `{NAME}` replaced by the player's name; nobody out → a `saved` story; nobody
out because no Mafia picked (MAF-027) → the fixed line "A quiet night. Nobody is out!". The story is
`pick(unused, createRng(\`${seeds.roles}:${k}:story${r}\`))` where `unused` are that kind's stories not used in this game, in id
order; when every story of a kind is used, all of that kind are unused again. Property (MAF-P5): no story repeats in a game while
an unused one of its kind remains; a saved story never contains a player's name.

**Version 1.1** (item 10): **`pick`** in MAF-023 and MAF-037 is `list[floor(rng() × list.length)]` using the rng's first value. MAF-023's worked example uses MAF-H3's deal with `seeds.roles = "mafia-example"`; the tester confirms the 0.62 (or the example changes to whatever that seed's first value gives, keeping the rule).

**Version 1.1** (item 32): **MAF-037:** every `{NAME}` is replaced; a night leaver gets no line on M1 (they're shown as "left" on Y1).
