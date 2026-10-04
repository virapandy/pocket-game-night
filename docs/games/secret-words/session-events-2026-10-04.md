# Secret Words: navigation and real-session events (4 October 2026)

Product owner, on the owner's request ("focus on the navigation and scenarios like add/remove player; what can happen in an
actual session"). Inputs: a navigation and session-events check of scenarios v3.2, a player helper living a messy Saturday
(Anita, 7 people, 13 real events, screen text only), the six-persona walk (`player-walk-2026-10-04.md`, W1–W20), and the
lessons from Impostor's player runs (fast Enter loses names, double taps skip the pass screen, the wrong person on a private
screen, no pause, nameless unfinished rows, the "Start new" popup).

**Verdict:** the normal path (set up, play, Play again) is smooth. **Real family life breaks it**: no pause or Home once a game
starts, people can't really come, go or switch teams mid-game, mistakes are permanent, and the next morning is a mystery.

## 1. Navigation: what's missing
| Gap | Where | Fix (E-numbers below) |
|---|---|---|
| No "Home" or "Pause" anywhere once a game is dealt; phone Back does nothing | every game screen | E1 |
| Private map is a dead end for the wrong person (no Back, no menu) | private map | E6 |
| Double-tap chains: the main button sits in the same spot on consecutive screens (turn over → "I'm Arjun" → private map; Reveal → Other team's turn → I'm Arjun; Play again → I'm Meena; Start → scan main → clue; Next → Next on setup) | 7 chains | E7 |
| Scan screen can't be shown again after the first clue | two/three phones | E9 |
| "Change teams" opens setup screens whose Back leads away from the game | game over | E13 |
| Summary is one-way ("an ended evening never reopens"); no undo of "End the game" | game over, summary | E11 |
| History reachable only from a game's menu, not from Home | Home | E15 |

## 2. Real-session events
| # | Event | What the spec does today (v3.2) | Gap | Fix |
|---|---|---|---|---|
| E1 | **Pause** (dinner, 40 min) or **go Home** mid-game, e.g. for a quick Tambola round | Nothing: no pause, no Home; the screen is held awake; the map phone shows its map indefinitely | **Stuck** | Menu "Pause" at every game step: covers the board with "Paused · Tap to carry on", releases the screen lock, keeps the map hidden. "← Home" between turns and at game over (as Impostor I25); the game stays on Home's unfinished row and resumes at the same step |
| E2 | **Late arrival**, mid-game | Joins the smaller team silently; can't choose; not during the private map | Confusing | Players: "Add to Chai Champions" / "Add to Coffee Commandos", with a "Doesn't give clues" switch on the add row (a kid joining for one game); toast "Neha joined Chai Champions" |
| E3 | **Someone switches teams** mid-evening (2 v 4) | Only at game over via Change teams | Annoying | Players sheet: "Move to the other team" for guessers at any step except the private map; a clue giver can't move mid-game (they've seen the map) |
| E4 | **Clue giver leaves** | Next eligible player takes over silently; "Remove" disabled for a team of 2 | **Stuck** | Removing a clue giver asks "Who gives clues for Coffee Commandos now?" (W3); a team left with 1 player asks "Coffee Commandos has only Om. Move someone over?" with a name per button |
| E5 | **Clue giver leaves the phone with the map showing** (door, bathroom) | Map hides after 3 min untouched or on lock | Privacy | **Owner question Q4** (hide sooner); plus quiet "Someone saw the map" on the private map itself |
| E6 | **Wrong person tapped "I'm Riya"** | Dead end: tap the pad (sees the map) or lock the phone | Privacy | Before the first show: quiet "Not Riya? Go back"; "I'm Riya" ignores taps for 1 s after the pass screen appears |
| E7 | **Fast double tap** through consecutive screens | Only move-recording buttons ignore 800 ms | Privacy | **Every** main button ignores taps for 800 ms after its screen appears; the turn-over main 1.5 s (W11) |
| E8 | **Someone glimpsed the map** | One phone: menu "Deal a new board" (not on the map screen); two phones: plus Next map and a check code nobody understood | Confusing | "New board (someone saw the map)" in the menu and on the private map; two phones: the word check of W1 |
| E9 | **Map phone dies or its owner leaves** (two/three phones) | Only "Show the map to a clue giver" on the host | **Stuck** | Menu "Show the map code again" at any step (with "Everyone else: look away"); a new map phone scans it |
| E10 | **Host's own phone leaves** (owner goes home) | No handover | Stuck (rare) | Later (C3): "Move this game to another phone" by QR. Now: How to play says "The host phone stays at the table." |
| E11 | **Accidental "End the game" / "End the evening"** | Safe dialog, then permanent | Lost data | "Game ended" shows "Undo" for 10 s; the summary keeps "Oops, keep playing" until it is left (as Impostor IMP-077) |
| E12 | **Wrong Reveal** | Final | Annoying | **Owner question Q3** |
| E13 | **Change teams / phones / board between games** | "Change teams" → setup screens, Back leads away | Confusing | Game over: quiet "Change players, phones or board" opens the setup screens with "← Back to the game"; nothing changes until "Start the game" |
| E14 | **Continue tomorrow** | After 12 h the game ends silently; next day starts from scratch | Confusing | **Owner question Q5** |
| E15 | **"Who won last night?"** | History only from a game's menu | Stuck | Home's menu has "History" (as Tambola/Impostor); Home shows the latest finished game night as a row: "Last night: Chai Champions 2 · Coffee Commandos 1 · Play again with these teams" (Q5) |
| E16 | **Misspelled name** | Remove and add again (loses team place and clue-giver count) | Annoying | Players: tap a name to rename it (team, place and counts kept) |
| E17 | **Fast Enter typing loses names** (from Impostor) | Inherited from the shared names step | Lost data | Every Enter adds its name; focus stays; a test types 7 names fast and gets 7 rows |
| E18 | **"Start new?" popup** asks the opposite of what the host came for; nameless rows | Inherited | Confusing | Name the old game in the dialog and on Home rows ("Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1"); two equal buttons "Carry on that one" / "Start new (ends that one)"; ask once |
| E19 | **Settings changed mid-game, then Back** (from Impostor) | Unspecified | Lost data | Settings save every change at once |
| E20 | **Phone call / lock / reload** | Board returns to the same step; map screens hide; timer lost | Fine | Note on the board after a return: "Welcome back." with the timer reading "Paused" |
| E21 | **Switch one ↔ two phones mid-evening** (daughter wants her phone back) | Only via Change teams (unlabelled) | Confusing | E13's "Change players, phones or board" |
| E22 | **Words nobody knows** on the board | Only "Deal a new board" | Annoying | Before the first clue: "New board (too hard)" in the menu, not counted |
| E23 | **Second game night the same day** | Tally restarts but says "Tonight" | Confusing | Covered by Q5 |
| E24 | **Clue givers swap** mid-game | Not possible | Fine | Keep: changing clue givers mid-game only with a new board; at game over "Keep clue givers" / "Next clue givers: Meena and Kabir" (W4, W20) |
| E25 | **Rotate, low battery on the host** | Specified; moves are saved | Fine | — |

## 3. Questions for the owner
Q1–Q3 from the player walk stay open (Landmine with family words; clues in other languages; taking back a Reveal), plus:
| # | Question | Options | Recommendation |
|---|---|---|---|
| Q4 | How soon should the secret map hide by itself when nobody touches it? | 3 min (today; clue givers can think in peace) · 60 s with a "Still looking? Tap to keep the map" warning at 50 s · 30 s | 60 s with the warning |
| Q5 | The next day | A fresh game night each time (today) · Home offers "Play again with last night's teams" (names and teams filled in, new tally) · the tally carries on across days | "Play again with last night's teams", new tally; last night stays in History |
