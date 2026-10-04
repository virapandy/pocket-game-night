# Secret Words: scenarios (version 3.4, 4 October 2026)

Status: **version 3.4 approved by the owner, 4 October 2026** (SWD-001 to SWD-133; two-reader check of 3.3 and a final verification pass resolved) (version 3.2, SWD-001 to SWD-104, was approved on 4 October; 3.3
added the owner's decisions K32–K41 as section 07; 3.4 folds section 07 into every earlier scenario it changes, with the
product owner's resolutions 1–21, and waits for its two-reader check and approval). SWD-200+ are direction, built later.
Decisions K1–K18 decided by the owner (4 October, "follow the recommendation"). Version 2 resolves every guess from the
two-reader check (`docs/spec-rules.md` rule 12: a coder-reader and a tester-reader, 4 October). After approval the tester
copies these into `specs/secret-words/` (file names in each section heading) and writes tests. Hand-over follows
`docs/roadmap.md`: after Impostor's release.

**This file is binding: where `ux.md`, `lifecycle.md` or `guide.md` differ, this file wins.**
Phases: **Secret Words 1** = first release. **Secret Words later** = designed now, built later (SWD-200+).
Change classes (`docs/change-sop.md`): the deal, the map code, the board algorithm, saved evenings and the word list
format = **C3** (tests first: sections 02, 04 rules, 05, 06, SWD-099); screens = C1/C2.

### What version 3.4 changes (rule 11; product owner's resolutions 1–21, 4 October)
Section 07 no longer "wins over" earlier scenarios: every earlier sentence, string row, menu row, tap → move row, rule-API
type, test hook and test id it changed is edited in place, so each fact has one place. Reworded or retired, by ID:
- **Ends are recorded late (res. 1):** "End the game" now shows "Game ended. No winner." with a 10 s `undo-toast` "Game ended
  · Undo"; `endGame` is recorded when the toast expires or the screen is left (SWD-054, 112). "End for tonight" records nothing
  until the summary is left; new quiet "Oops, keep playing" (SWD-060, 128). SWD-060's "never reopens" now applies once recorded.
  Tap → move rows for "End the game" and "End for tonight" reworded.
- **Pairs (res. 2):** `Teams.partners`, `setClueGivers.partners`; pair strings for the pass screen (`pass-name` on two lines,
  main "We're Nana and Aarav", line "Clue givers for Chai Champions (orange)"), private map ("Nana + Aarav", "Not Nana and
  Aarav? Go back"), clue prompt, result line, poker line, waiting line, scan screen, "Show the map to", History, credits
  (SWD-007, 014, 030, 031, 033, 037, 040, 043, 064, 113, 116, 123, 125, 126, 128).
- **Players (res. 3):** SWD-061 retired (replaced by SWD-127). Retired strings: "Add" (button), "Riya left · Meena is the new
  clue giver · Undo", "'Remove' is disabled for every player of a team of 2". New: rename, "Move to Coffee Commandos", "Add to
  Chai Champions" / "Add to Coffee Commandos", "Neha joined Chai Champions", "Zoya moved to Coffee Commandos · Undo", "Who gives
  clues for Coffee Commandos now?", "Kabir leaves Coffee Commandos with only Om. Move someone over?", "Move Zoya over", "Keep
  Kabir", "No one can move over.". `setPlayers` gains `renames` (SWD-014, 064, 127, test hook 1).
- **Game over (res. 4):** SWD-056 retired (replaced by SWD-112). "Change teams" is retired everywhere (Terms Deal, SWD-004,
  009, 013, 102, tap → move) for "Change players, phones or board"; "End the evening" (SWD-051) reads "End for tonight"; new
  `next-clue-givers` and "Swap"; SWD-014's "The Clue givers sheet exists only on Make teams" reworded; SWD-053 reworded.
- **Home, Pause, menus (res. 5):** quiet "← Home" only at game over; elsewhere menu item "Home (keep this game)" (SWD-111).
  `pause-cover` is a dialog (was h1 "Paused" on a cover) (SWD-110). The menu table's "Hurry up / Stop timer" column now reads
  "Start 90-second timer / Stop timer"; new columns Earlier clues, Pass the pick, Show the map code again, Pause, Home (keep
  this game); Home's own menu gains "History" (SWD-115). "Show the map code again" is no longer "at every game step" (SWD-129).
- **Picker (res. 6):** `turn-line` no longer reads "Chai Champions guessing · Sunita picks"; main "Reveal" / "Reveal <WORD>"
  → "Sunita: Reveal" / "Sunita: Reveal <WORD>" (SWD-042, 091, 122); first-guess tip "Tap a word, then Reveal. You can take one
  more than the number." → "Tap a word to suggest it. Sunita taps Reveal." (SWD-041, 122); "Pass the pick" opens the dialog
  "Who picks this turn?" (was "a sheet"); room view gains `picker`.
- **Board fit (res. 7):** `clue-line` "Cricket · 2 · 3 guesses left" / "Clue: 2 · 3 guesses left" / "Clue: 1 · 1 guess left" /
  "CRICKET · ∞ · guess as many as you like" / "Clue: 0 · guess as many as you like" retired for `clue-line` + `guess-line`
  (SWD-041, 118); the 360 × 640 sum is now 630; panels restated (SWD-091).
- **Clocks (res. 8):** "180 s" and "3 minutes" map hides retired for 60 000 ms with a 50 000 ms warning (SWD-031, 040, 121, test
  hook 3); "appears" defined (SWD-114); poker line timing (SWD-125).
- **Endings (res. 9):** `fun-line` and "fun lines" retired; `best-clue` example "Best clue: MONSOON 3 · all 3 found" → "Best clue:
  MONSOON 2 · all 2 found"; `near-miss` only after a won game; "Oxford comma none" reworded; the room view's clues gain `found`
  (SWD-060, 128, test hook 1). The room view's `lastTurn.ended` gains `'landmine'`, which SWD-103's recap already needed.
- **Home rows (res. 10):** "Secret Words, 8:40 pm, game 2" → "Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1"
  (SWD-062, 115); resume card "Secret Words · game 2 · Tap to resume" → "Secret Words · Chai Champions v Coffee Commandos · 2–1 ·
  Tap to resume" (SWD-001, 115); "Start a new evening? The evening from 8:40 pm will be ended." with "Start new" / "Carry on that
  evening (main)" → SWD-115's dialog (SWD-001, 067, 115; Terms gains the dialog exception); `last-night` "Last night: …" → "Last
  game night: Chai Champions 2 · Coffee Commandos 1".
- **Board check (res. 11):** `board-check` on every deal (was from the second); "Hand the map phone to Meena and Kabir, tap Next
  map on it, and check it starts with: …" → "Hand the map phone to Meena and Kabir, tap Next map, and check it starts with: …";
  "Tap Next map on the map phone, and check …" → "Tap Next map on the map phone and check it starts with: …"; three-phone and
  new-deck variants added (SWD-033, 039, 116).
- **Map phone (res. 12):** QR `#map=<code>` → `#map=<code>&t=<pair id>` (SWD-002, 033, 117); `pgn.secretWords.map` gains `t`
  (SWD-036); "Chai Champions ● orange · Coffee Commandos ◆ teal" → `map-teams` "Chai Champions (orange) · Coffee Commandos
  (teal)"; `map-code-line` "Code 27P-3QX8 · Chai Champions start" with names; small line "Tap a word once it's turned over, to
  fade it." → SWD-120's; lists "Orange list" / "Teal list" / "Whole map" with "Orange words (6)" / "Teal words (5)" (SWD-034,
  117, 120); the map phone page may scroll in portrait (SWD-034).
- **Setup words (res. 13):** "Deal the words" → "Start the game" (SWD-009); `start-hint` above the main (was "under");
  Landmine default per K33 (SWD-009, 066, 119); `big-group-hint`.
- **Disputes (res. 14):** "Clue not allowed? This turn ends and one of the other team's words is turned over." with "Yes, it
  broke a rule" / "Cancel (main)" retired for "Clue not allowed? Both clue givers decide together." with "Try another clue",
  "Turn ends, they get a word", "Clue rules", "Let it go (main)" (SWD-041, 046, 124).
- **How to play (res. 15):** "The rules" lines 3 ("Don't say a word that is still face down…") and 4 ("English, or a word you'd
  use…") retired, lines renumbered 1–6; h2 "Clue rules" added (SWD-011, 131).
- **Layouts (res. 16):** hide orders for the pass screen and the clue screen (SWD-030, 040); the private map's lists gain "Not
  Riya? Go back" and "Someone saw the map" (SWD-031, 113).
- **Fair shuffles (res. 17):** SWD-004, 006 and 130 share one acceptance rule.
- **Join scanner (res. 18):** Tambola's scan label on the Join screen → "Scan a ticket or secret map" (SWD-002, 133). Rule 11:
  this rewords **PLT-300** (Home → Join) and the **Tambola join scenarios** that quote the scan label; the tester updates them.
- **Renames (res. 19):** SWD-014 accessible name "Riya: guesses only" → "Riya: doesn't give clues"; every "Turn" button
  (SWD-031, 034, 041, 102) → "↻" / "↻ Flip", accessible name "Flip the board"; SWD-048's UI state gains `paused` and
  `pickerOverride`, and its steps gain game over and the summary.
- **Strings and hooks (res. 20):** canonical rows replaced: Picker resume card, Start new, Home unfinished row, Join screen,
  Clue givers sheet, Choices, How to play, Scan screen, Pass screen, Private map, Map phone, Clue screen, Board status, First-guess
  tip, Board buttons, Broke a rule (now Dispute), Timer, Game over, Summary, Discard (now "Delete tonight's games"), Players sheet,
  Show the map sheet, History; rows added for every section 07 string. Test ids added: `map-teams`, `map-list`, `start-hint`,
  `big-group-hint`; retired: `fun-line`.
- **Terms (res. 21):** example names Sunita, Nana, Aarav, Neha (Om and Zoya were already listed) and example words Lamp, Rain,
  Shadow, Train; new terms Guessers, Picker, Partner, Found, Game night.

### Version 3.3 (owner, 4 October, K32–K41): real sessions and behaviour
From the player walk (`player-walk-2026-10-04.md`), real-session events (`session-events-2026-10-04.md`) and behaviour
(`behaviour.md`). New section **07 Sessions and behaviour** (SWD-110 to SWD-139) (from version 3.4 folded into the earlier
scenarios it changes). Plain words everywhere: "Start the game", "+ Harder words", "Doesn't give clues", "Start 90-second timer",
"Clue not allowed?", "Delete tonight's games", "End for tonight", "Landmine word: Shadow", "Flip the board", "Heads up: Cricket
is on the board.", "New board", "blank" for nobody's words, "✓ Riya's clue works!" (the clue giver's name), "Boom! The Landmine
got Coffee Commandos.". Retired: "Check 78" board checks (now words), "The Landmine went off 1 time", "Riya's clues won 2
games", "Guesses only" tag on Make teams, the 180 s map hide (now 60 s).

### Version 3.2 (owner, 4 October, K28–K30)
- The danger word is **the Landmine** (was the Ghost): "Coffee Commandos stepped on the Landmine!", "The Landmine went off 1
  time"; icon a landmine; sound `boom`.
- New setup choice **Landmine** (Full board only): **Lose the game** (default, the standard rule) or **Lose your turn** (the turn
  ends and the other team gets one word free) (SWD-009, 043). (Version 3.3, K33, changed the default: SWD-119.)
- The boards are **Full** (25 words) and **Easy** (16 words, no Landmine); "Family board" is retired.
- Playing against the phone (2–3 players) stays a future extension (SWD-200).

### What version 3 changes (rule 11; owner's decisions P1–P9 and "Join a game", 4 October)
- **How many phones?** replaces "How do clue givers see the map?": One phone · Two phones (Recommended: one map phone shared
  by both clue givers) · Three phones (SWD-009); `choices.map` = `'pass' | 'shared' | 'own'`. Picker card: "15–25 min a game".
- **Optional clue word**, shown big on the board with earlier clues and a warning if it is a face-down word (SWD-040, 041,
  101); reverses K15.
- One phone: **tap to see the map** (no hold), hidden 3 minutes after the last touch; "Our words" list; "See the map again"
  (SWD-031, 040).
- **"Change clue"** and **"Clue broke a rule?"** on the board until the first reveal (SWD-041, 046).
- **"Turn"** rotates the board inside the app, remembered per team (SWD-102). **"Guesses only"** per player (SWD-014).
- **"Next map"** on the map phone, with a 2-symbol check (SWD-039). **Recap line**, **Do Not Disturb tip**, bigger timer
  (SWD-103, 104, 047).
- **Home: "Join a game"** with "Tambola ticket or Secret Words map from the host" (SWD-002).
- Retired wordings: "How do clue givers see the map?", "Pass this phone", "Clue givers' own phones" and their lines; "Hold
  here to see the map", "Tap instead"; "Join with my ticket" (Home); "about 15 min a game" (picker); "Both have the map" for
  two phones (now "The map phone is ready").
- New IDs: SWD-014, 039, 101, 102, 103, 104, 105; SWD-205, 206 (direction).
- **Version 3.1 (two-reader check):** valid example code 27P-3QX8 (check "78"; next map 28P-3QXA, "8A"); the guessing screen's
  budget at 360 × 640 (the change row shares the "End our turn" slot; "Turn" is a 44 × 44 ↻ in the counts row); **"Turn"
  flips the board 180° only** (90° can't fit words in portrait: a deviation from P6's 90° steps); "Keep my clue"; exact
  clue-word matching; layouts for the clue screen, private map and map phone in landscape; Guesses-only edge cases;
  `nextMapCode`; `dnd-tip`; History's clue line. Retired: "hold", "tap mode", "60 s" (60 s restored in 3.3 by K36, SWD-121), "Both have the map" for two phones.

**Funny team names (owner, 4 October, K25):** "Mango" and "Peacock" are retired. The teams are the orange team and the
teal team, with a random pair of funny names each evening (SWD-013, `team-names.csv`); icons are shapes (circle, diamond).
Result lines no longer name a team ("✓ Your word!", "✗ The other team's word!"); the turn-over button reads "Other team's turn".

**Board words (owner, 4 October, K24):** English, or Indian words known everywhere (test: Tirunelveli or Sivagangai, no Hindi);
35 words replaced in `words.csv` before edition 1 ships; How to play's example reads "(chai, dosa)".

**All names in English (owner, 4 October, K23):** the losing card was renamed from "the Bhoot" to "the Ghost" (now **the
Landmine**, K28); the board word Ghost (SWDW-209) is replaced by Shadow. Sounds and icons unchanged.

**"Inspired by Codenames" (owner, 4 October, K22):** the picker card and How to play say so (SWD-001, SWD-011); the word
"Codenames" appears nowhere else in the app: never as a name, logo, styling, heading, button, page title or web address
(`legal.md`).

**Renamed (owner, 4 October, K21):** the game was called Ishaara until 4 October; IDs ISH- became SWD- and word ids ISHW-
became SWDW-, one for one. Every "Ishaara" on screen reads "Secret Words". Nothing else changed.

### What version 2 changes (rule 11)
- **The map code** is now 7 symbols (`XXX-XXXX`): config, deal index, a 4-symbol deck seed, a check symbol (SWD-022). The
  6-symbol code of version 1 is retired: with a seed per board, "no repeats this evening" could not hold (about 1.5% of
  evenings would succeed by game 6).
- **The words come from a shuffled deck** per evening, 25 words per deal (SWD-024); `words.csv` gains `edition` and `retired_in`.
- The scan screen is a **map screen** (it carries the code); it is not a room screen (SWD-025, SWD-028).
- Dialogs put the safe choice on the main button, as Impostor ("Keep playing" (main)).
- "Rules" is now **"How to play"** (as Impostor), with exact text (SWD-011).
- Retired wordings: "Rules" (menu item), "Yes, it broke a rule (main)", "Deal a new board (main)", "End the game (main)",
  "or type: K7P-3QX" (now "or type: K7P-3QX4" in version 2; now "or type: 27P-3QX8"), "Meena is now Mango's clue giver." (now part of the removal toast),
  "Everyone else: look away from your neighbour's phone." (ux.md).
- New detail IDs: SWD-011, 012, 013 (K25), 027, 028, 038, 048, 049, 056, 066, 067.

---

## Terms
Terms already defined in `docs/games/impostor/scenarios.md` mean exactly the same here: **main button, quiet button,
selected, tint, greyed, disabled, small line, body text, toast, dialog, Larger text, fits in N lines, no page scrolling,
names, plurals, t = …, sound on**. Characters: "·" U+00B7 with a space either side; "…" U+2026; "→" U+2192; "✓" U+2713;
"✗" U+2717; "∞" U+221E; "–" U+2013; "↻" U+21BB; "✕" U+2715; "←" U+2190; apostrophes and inner quotes U+0027.

| Term | Meaning |
|---|---|
| **Screen sizes** | 320 × 568, 360 × 640, 390 × 844 (portrait), 812 × 375 and 568 × 320 (landscape). "Every size" = all five, Larger text off and on. |
| **Narrow portrait** | `innerWidth < 360` and `innerHeight > innerWidth` (320 × 568 in the list). |
| **Landscape main button** | On every Secret Words screen except the board screens, the private map and the map phone: as Impostor, 358 × 60 at the bottom right, 16 px from the right and bottom edges. Board screens: SWD-091. |
| **Dialog (exception)** | Impostor's Dialog term holds, with one exception: the Start new dialog (SWD-115) has two equal quiet buttons and **no main button**. |
| **Team** | The **orange team** and the **teal team**. Each evening gives them a random pair of funny names (SWD-013); in this file the example evening's names are **Chai Champions** (orange) and **Coffee Commandos** (teal), and every string written with them stands for that team's name. Names are written as in the list, never upper case. The orange team is always listed first. |
| **Team bar** | `team-bar`: an 8 px strip in the team colour across the top edge, on the pass screen, the clue screen and the board screens; always with the team's name in words nearby (`turn-heading` or `turn-line`). |
| **Team colour** | `--team-orange` / `--team-teal` (`ux.md` §1); used only for that team's cells and its bar. |
| **Team icon** | Our own SVG shapes: a filled circle (orange team), a filled diamond (teal team), a short dash (nobody), a landmine (the Landmine); `aria-hidden`, 16 × 16 px, top left of a cell, 2 px in. Never written as text characters (no "●" or "◆" in the DOM). |
| **Kind** | `orange`, `teal`, `nobody` or `landmine`. |
| **Board** | **Full** = 25 words, 5 × 5; **Easy** = 16 words, 4 × 4. Cells in row-major order, `data-index` 0 top left. |
| **Board screens** | The preview board (SWD-012), guessing (SWD-041), the end-turn line (SWD-044), turn over (SWD-045) and the board part of game over (SWD-051). |
| **Word text** | Every board and map word shows exactly as in the list (title case, e.g. "Kite"), in the app's body font stack, weight 600, never transformed. Elsewhere `<WORD>` is the same word upper case by CSS (`text-transform`), DOM text as in the list. |
| **Face down / turned over** | Not yet revealed / revealed. Turned over: fill in the kind's colour, the kind's icon and the word (white text on orange, teal and Landmine in light mode; `--text` on Nobody). |
| **Locked** | Board cells that can't be picked: `aria-disabled="true"`, taps do nothing, **not greyed** (an exception to "disabled"). |
| **The map** | The kind of every word on the board. |
| **Map screens** | The private map (SWD-031), the scan screen (SWD-033, also when opened by "Show the map code again", SWD-129) and the map phone (SWD-034). |
| **Room screens** | Every host-phone screen of a game that is not a map screen. Until game over, **no room screen has any information about a face-down word's kind in the page** (SWD-025). |
| **Clue giver** | The one player per team, at any moment, who may see the map, together with that team's **partner** when it has one (SWD-123). The **credited** clue givers of a game are the team's clue giver and partner when the game ends. |
| **Partner** | A second player who gives clues with the team's clue giver for one game (SWD-123); "a pair" = clue giver and partner. |
| **Guessers** | A team's current players minus this game's clue giver and partner, in team list order (SWD-122). |
| **Picker** | The guesser who taps "Reveal" in a guessing turn (SWD-122); a social cue, never enforced. |
| **Found** | A turn's **found** words: its own team's words turned over by that team's guesses during that turn; a word turned over by SWD-046 or as the Landmine's free word never counts (SWD-103, 128). |
| **Deal** | Dealing a board: the first deal, "Play again", "New board", and the deal after "Change players, phones or board". The deals of an evening are numbered from 1. |
| **Game** | From a deal to its result. A board replaced by "New board" is not a game. **Won** games have a winner; **ended early** games ended by "End the game", "End for tonight" mid-game, "Start new (ends that one)" or SWD-063, once their `endGame` is recorded (SWD-054, 060). **Game number** N = games so far + 1 while playing; on game over, the finished game's number. |
| **Turn** | From a team's clue screen to its end-turn line or turn over. Turns are numbered per board from 1, both teams together. |
| **Guess** | One confirmed reveal ("Sunita: Reveal <WORD>"). **Allowance**: clue 1–9 → number + 1; 0 and ∞ → unlimited. |
| **Evening** | One Secret Words saved game (engine `SavedGame`), created at its first deal, holding every game of that evening. It joins the current session (PLT-016) as Impostor's evenings do (IMP-102). **On screen an evening is always called a "game night"**; "evening" is never shown. |
| **This evening's words** | Every word on any board dealt in this evening, replaced boards included. |
| **Tally** | `tally`: "Tonight: Chai Champions 2 · Coffee Commandos 1": won games of this evening by team (fits in 2 lines). |
| **Map code** | 7 symbols from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 symbols; value = index, `2` = 0), shown `XXX-XXXX` (hyphen in the DOM text). |
| **Map phone** | A phone showing a map opened from a map code. |
| **Board check** | The words of cells 0, 1 and 2 (SWD-116). |
| **Quiet button height** | 48 px, as Impostor, everywhere in this file; a label may wrap onto 2 lines (15 px, 19 px with Larger text) only where a scenario says so. |
| **Text matching** | Tests compare DOM text. Text written in CAPITALS here (a name, `<WORD>`, "CRICKET") is DOM text as typed or as in the list, shown upper case by CSS. |
| **Eligible** | A player whose "Doesn't give clues" switch is off (SWD-014). |
| **Screen mounts** | A step's screen **appears** when it mounts: on entering the step, and on a reload. Closing a dialog or sheet, "Carry on" (SWD-110) and "Welcome back." (SWD-032) do not count as appearing (SWD-114). |

Example players, typed in this order: **Riya, Arjun, Meena, Kabir, Zoya, Dev, Om**. Other example names (pairs, pickers, added
players): **Sunita, Nana, Aarav, Neha** (each stands for any player's name; Om and Zoya are from the list above). Example words
(edition 1): Cricket, Bat, Monsoon, Kite, Tiffin, Mehendi, Lamp, Rain, Shadow, Train.
Plurals: "1 word" / "2 words"; "1 guess" / "2 guesses"; "1 game" / "2 games"; "1 time" / "2 times"; "1 word found" / "31 words
found".

---

## Canonical strings
| Where | Exact text | Element | ID |
|---|---|---|---|
| Home, under "Host a game" | "Tambola, Impostor or Secret Words on this phone" (list joined with ", " and " or " before the last) | text inside the button | SWD-001 |
| Picker card | "Secret Words" · "Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game" | button, name starts "Secret Words" | SWD-001 |
| Picker resume card | "Secret Words · Chai Champions v Coffee Commandos · 2–1 · Tap to resume" ("0–0" before any won game) | `resume-card` | SWD-115 |
| Start new | dialog: heading "Start a new game night?"; paragraph "The one from 8:40 pm (Chai Champions v Coffee Commandos, 2–1) will end." with, in this order, two equal quiet buttons "Carry on that one", "Start new (ends that one)"; no main | dialog (named "Start a new game night?"); buttons | SWD-115 |
| Home unfinished row | "Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1" and "Tap to resume" | inside `unfinished-games` | SWD-115 |
| Home last game night | "Last game night: Chai Champions 2 · Coffee Commandos 1"; button "Play again with these teams" | `last-night` paragraph; button | SWD-115 |
| Home menu | adds "History" | menu item | SWD-115 |
| Home, second card | accessible name starts "Join a game"; title "Join a game"; line "Tambola ticket or Secret Words map from the host" (replaces "Join with my ticket" / "Got a QR or code from the host?") | button | SWD-002 |
| Join screen | heading "Join a game"; in order: the scanner, labelled "Scan a ticket or secret map", and its button "Type a ticket code" (was "Type the code"); Impostor's line (IMP-002); then "Playing Secret Words? Clue givers: scan the host's map code. Everyone else: just play along!"; quiet "I have a map code" | h1; scanner label; paragraph; button | SWD-002, 133 |
| Code entry | heading "Type the map code"; label "Map code"; placeholder "27P-3QX8"; main "Open the map"; errors "That code doesn't look right. Check it with the host." · "This map needs a newer version of the app. Open the app once with internet, then try again." | h1; input; main; `role="alert"` | SWD-002 |
| Who's playing? | heading "Who's playing?"; "Add at least 4 players." · "20 players is the most." · Impostor's duplicate message; from game over: "← Back to the game" | h1; `role="alert"`; button | SWD-003, 112 |
| Make teams | heading "Make teams"; h2s "Chai Champions (4)" / "Coffee Commandos (3)", each with its team icon and the small line "Orange team" / "Teal team"; badge "Clue giver"; small line "Tap a name to move it to the other team."; small line "Doesn't give clues" under such names; quiet "Shuffle teams", "New team names", "Change clue givers"; main "Next"; alerts "Each team needs at least 2 players." · "Each team needs someone who can give clues." | h1; h2; `clue-giver-badge`; small lines (`guess-only-tag`); buttons; `role="alert"` | SWD-004–008, 014 |
| Team toasts | "Om moved to Coffee Commandos · Undo" · "Teams shuffled · Undo" · "New team names · Undo" | `undo-toast` | SWD-005, 006, 013 |
| Clue givers sheet | dialog "Clue givers"; groups "Chai Champions" / "Coffee Commandos"; one button per player; per team quiet "Add a partner" ↔ "Remove partner" and group "Chai Champions partner"; per player a switch "Doesn't give clues" (accessible name "Riya: doesn't give clues"); alert "Each team needs someone who can give clues."; main "Done" | dialog; `role="group"`; buttons with `aria-pressed`; `role="switch"` | SWD-007, 014, 123 |
| Choices | heading "How do you want to play?"; small line "Same as last time" (carried over); groups "How many phones?", "Board", "Landmine" (Full board only), "Words"; `big-group-hint` "Big group? The Easy board is easier to read." (9 or more players); `start-hint` "Pick how many phones to start." (above the disabled main); main "Start the game" | h1; small lines; `role="group"`; main | SWD-009, 119 |
| Phone cards | "One phone" + "Pass it to the clue giver to see the map. About 25 min a game." · "Two phones" + small line "Recommended" (`recommended`, between title and text) + "One more phone, shared by both clue givers. About 15 min a game." · "Three phones" + "One more phone for each clue giver. About 15 min a game." | buttons with `aria-pressed` | SWD-009 |
| Options | "Full: 25 words" / "Easy: 16 words"; "Lose the game" / "Lose your turn"; "Whole family" / "+ Harder words" | buttons with `aria-pressed` | SWD-009 |
| Option lines | Full "9 and 8 words to find, 7 blank, 1 Landmine." · Easy "6 and 5 words to find, 5 blank, no Landmine." · Lose the game "Step on it and your team loses." · Lose your turn "Step on it and your turn ends; the other team gets one word free." · Whole family "Words kids and grandparents know." · + Harder words "Adds words kids or elders may not know." | small line under the group | SWD-009 |
| Read this aloud | heading "Read this aloud"; 4 lines (SWD-010); main "Let's play"; quiet "Show me the board first" | h1; `ol` of 4 `li` | SWD-010 |
| How to play | heading "How to play"; h2 "Read this aloud" + the 4 lines; h2 "The rules" + 6 lines (SWD-011); h2 "Clue rules" + 4 lines (SWD-131); small line `credit` (SWD-011); main "Done" | h1; h2; `ol`; small line | SWD-011, 131 |
| Preview board | `turn-line` "Chai Champions start"; counts; main "Start" | paragraphs; main | SWD-012 |
| Scan screen | heading "Clue givers, scan your map"; two phones: "Riya and Arjun: sit side by side and share one map phone." · three phones: "Riya (Chai Champions, orange) and Arjun (Coffee Commandos, teal): scan on your own phones." (a pair reads "Nana + Aarav"); QR; "or type: 27P-3QX8"; `board-check` (SWD-116); `dnd-tip` (SWD-104); `waiting-line` is not here; small line "Everyone else: look away from their phones."; main "The map phone is ready" (two) / "Both have the map" (three) | h1; paragraph; `map-qr` (`img`, name "Map code 27P-3QX8"); `map-code-text`; small line; main | SWD-033 |
| Board check (scan screen) | first deal (or the first after a change of phones): "The map phone should start with: Cricket · Bat · Monsoon" / three phones "The map phones should start with: Cricket · Bat · Monsoon"; next deal, clue givers changed: "Hand the map phone to Meena and Kabir, tap Next map, and check it starts with: Kite · Tiffin · Rain" / three phones "Meena and Kabir: tap Next map on your phones and check they start with: Kite · Tiffin · Rain"; unchanged: "Tap Next map on the map phone and check it starts with: Kite · Tiffin · Rain" / three phones "Tap Next map on both map phones and check they start with: Kite · Tiffin · Rain"; new deck: "New code: scan again. The map phone should start with: Kite · Tiffin · Rain" / three phones "New code: scan again. The map phones should start with: Kite · Tiffin · Rain" | `board-check` paragraph | SWD-116 |
| Map code again | the scan screen for the current board; main "Back to the game" | main | SWD-129 |
| Pass screen | heading "Chai Champions, your turn"; "Pass the phone to"; `<NAME>` (pair: two lines "NANA +" / "AARAV"); "Clue giver for Chai Champions (orange)" (pair: "Clue givers for Chai Champions (orange)"); `waiting-line`; `recap-line` (SWD-103); `dnd-tip` (SWD-104); quiet "Start 90-second timer"; main "I'm Riya" (pair: "We're Nana and Aarav") | h1 `turn-heading`; paragraph; `pass-name`; paragraph; small lines; button; main | SWD-030, 123 |
| Waiting line | "Coffee Commandos: guess how many Riya will say!" (pair: "Coffee Commandos: guess how many Nana and Aarav will say!") | `waiting-line` small line | SWD-126 |
| Welcome back | "Welcome back." above the pass screen | paragraph | SWD-032 |
| Private map | heading `<NAME>` (pair: "Nana + Aarav"); small line "You give clues for Chai Champions (orange)"; counts; pad "Tap to see the map" / "Tap to hide"; quiet "Our words" / "Whole map"; quiet "↻ Flip" (accessible name "Flip the board"); quiet "Not Riya? Go back" (pair: "Not Nana and Aarav? Go back"; before the first show); quiet "Someone saw the map" (while shown); list `our-words`: h2 "Your words (6 left)" ("(1 left)" for one), each word an `li`, small line `avoid-line` "Landmine word: Shadow"; main "I have my clue" (SWD-037: "Done, hide the map"; from "See the map again": "Back to my clue") | h1; small line; `hold-pad`; buttons; `our-words`; main | SWD-031, 113 |
| Hide warning | "Still looking? Tap to keep the map" | `hide-warning` (`role="status"`) | SWD-121 |
| Map phone | heading "Secret Words map"; `map-teams` "Chai Champions (orange) · Coffee Commandos (teal)" (scanned with a known `t` only); `map-code-line` "Code 27P-3QX8 · Chai Champions start" (without names: "Code 27P-3QX8 · Orange team starts"); `first-words` "First words: Cricket · Bat · Monsoon"; small line "Optional: tap a word once it's found to fade it; tap again to undo. The board in the middle is always right."; quiet "Orange list" / "Teal list" / "Whole map"; quiet "Hide map" / "Show map"; quiet "Next map"; quiet "Done with this game"; `map-end-line` "Game over? Tap Done with this game, or Next map for the next one." | h1; paragraphs; small lines; buttons | SWD-034, 116, 117, 120 |
| Map phone lists | h2 "Orange words (6)" / "Teal words (5)", each word an `li`; then `avoid-line` "Landmine word: Shadow" (none on Easy) | `map-list` | SWD-120 |
| Map phone toasts | "New map. The old one was cleared." · "Next map. It should start with: Kite · Tiffin · Rain." · "That was the last map of this deck. Scan the new code." (at the bottom, 16 px up) | `toast` | SWD-036, 039, 116 |
| Map phone dialog | "Clear this map from your phone?" with "Clear map" / "Keep it" (main) | dialog | SWD-036 |
| Saved map row (Home) | "Secret Words map 27P-3QX8 · Tap to open" (button) · older: "Secret Words map 27P-3QX8" with "Open" / "Clear" | `saved-map` | SWD-036 |
| Clue screen | heading "Chai Champions, your turn"; `clue-prompt` "Riya, say your clue out loud. How many words is it for?" (pair: "Nana and Aarav, say your clue out loud. How many words is it for?"); keys "0"…"9", "∞" (with "many" under it); `clue-help` "2 means up to 3 guesses. 0 or ∞: as many as you like."; input labelled "Clue word (optional)" (`clue-word`); `clue-warning` "Heads up: Cricket is on the board."; counts; tip "One word, one number. No faces, no pointing!"; `waiting-line` and `recap-line` (two or three phones); quiet "See the map again" (one phone); from "Change clue" or "Try another clue": quiet "Keep my clue"; quiet "Start 90-second timer"; main "Pick a number" (disabled) / "Clue for 2: start guessing" / "Clue for 0: start guessing" / "Clue for ∞: start guessing" | h1 `turn-heading`; paragraph `clue-prompt`; `clue-key` buttons with `aria-pressed`; small line `clue-help`; input; paragraph; `word-counts`; small lines `tip`, `waiting-line`, `recap-line`; buttons; main | SWD-040, 101, 118 |
| Counts | circle icon "9 left" · diamond icon "8 left" (visible text "9 left · 8 left"; accessible name "Chai Champions: 9 words left. Coffee Commandos: 8 words left."); landscape board panel: two lines | `word-counts` | SWD-040, 043 |
| Board status | `turn-line` "Chai Champions guessing" (for the first 3 000 ms of a guessing screen after a confirmed clue: "Riya: poker face, no hints!"; pair "Nana + Aarav: poker face, no hints!"); `clue-line` with a word "CRICKET · 2" (DOM "Cricket · 2" as typed) / "CRICKET · ∞", with no word "Clue: 2" ("Clue: 0", "Clue: ∞"); `guess-line` "3 guesses left (2 + 1 extra)" (clue 1: "2 guesses left (1 + 1 extra)"), then "2 guesses left", "1 guess left"; 0 and ∞: "Guess as many as you like"; `clue-history` "Earlier: MONSOON 2 · 1 · RAIN ∞"; quiet "Change clue", "Clue not allowed?"; icon button "↻" (accessible name "Flip the board") | paragraphs; buttons | SWD-041, 102, 118, 125 |
| First-guess tip | "Tap a word to suggest it. Sunita taps Reveal." | small line `tip` | SWD-122 |
| Board buttons | quiet "End our turn"; main "Sunita: Reveal" (disabled) / "Sunita: Reveal <WORD>" (DOM "Sunita: Reveal Lamp") | button; main | SWD-042, 044, 122 |
| Pass the pick | menu item "Pass the pick"; dialog "Who picks this turn?" with one button per guesser (`aria-pressed` on the current picker) and quiet "Cancel" | menu item; dialog; buttons | SWD-122 |
| Result lines | SWD-043 table (pair: "✓ Nana and Aarav's clue works! …"); end-turn "Chai Champions ended their turn."; quiet "Oops, keep guessing" | `result-line`; button | SWD-043, 044, 125 |
| Turn-over main | "Other team's turn" | main | SWD-045 |
| Dispute | dialog "Clue not allowed? Both clue givers decide together." with, stacked: quiet "Try another clue", quiet "Turn ends, they get a word", quiet "Clue rules", main "Let it go" | dialog; buttons | SWD-124 |
| Broke a rule | result line "Clue broke a rule. One of the other team's words was turned over." | `result-line` | SWD-046 |
| Timer | `hurry-timer` "1:30" … "0:01", then "Time's up!", or "Paused"; button / menu item "Start 90-second timer" ↔ "Stop timer" | span; button | SWD-047 |
| Recap | "Last turn: Coffee Commandos found 2 words; Train was blank." (SWD-103) | `recap-line` | SWD-103 |
| Do Not Disturb tip | "Tip: turn on Do Not Disturb so messages don't pop up on the board." | `dnd-tip` | SWD-104 |
| Earlier clues sheet | dialog "Earlier clues"; one `li` per clue in force of this game, oldest first: "Chai Champions: CRICKET 2" / "Coffee Commandos: 1" / "Chai Champions: RAIN ∞"; main "Done" | dialog | SWD-041 |
| Pause | menu item "Pause"; `pause-cover`: heading "Paused"; line "Tap Carry on when everyone's back."; main "Carry on" | `role="dialog"` named "Paused"; paragraph; main | SWD-110 |
| Game menu items | "Home (keep this game)" · "Show the map code again" · "Pause" · "Pass the pick" | menu items | SWD-110, 111, 122, 129 |
| Game over | heading "Chai Champions win!"; line "All 9 words found." / "Boom! The Landmine got Coffee Commandos."; ended early: heading "Game ended. No winner."; `near-miss` "Coffee Commandos were 1 word away!" / "Coffee Commandos were 2 words away!"; `best-clue` "Best clue: MONSOON 2 · all 2 found" / "Best clue: MONSOON 2 · 3 found" / "Best clue: RAIN ∞ · 4 found"; tally; `next-clue-givers` "Next clue givers: Meena and Kabir" (pair "Next clue givers: Nana + Aarav and Kabir") with quiet "Swap"; quiet "Change players, phones or board", "End for tonight", "← Home"; main "Play again" | h1 `game-heading`; `result-line`; paragraphs; `tally`; buttons; main | SWD-051, 112, 128 |
| Game ended toast | "Game ended · Undo" (10 s) | `undo-toast` | SWD-054 |
| Deal new | dialog "New board? For when someone saw the map or the words are too hard. This board won't count. Same teams and clue givers." with "New board" / "Keep playing" (main) | dialog | SWD-055 |
| End game | dialog "End this game with no winner?" with "End the game" / "Keep playing" (main) | dialog | SWD-054 |
| End for tonight | dialog "End for tonight? Tonight's tally stays in History." (mid-game: "End for tonight? This game won't count in the tally.") with "End for tonight" / "Keep playing" (main) | dialog | SWD-060 |
| Summary | heading "Tonight's Secret Words"; `summary-line` "6 players · 3 games · 31 words found" ("1 game", "1 word found"); tally; `clue-credit` "Clues tonight from Riya, Nana and Zoya" ("Clues tonight from Riya" / "Clues tonight from Riya and Nana"); quiet "Oops, keep playing" (until recorded); quiet "← Home"; main "Play something else"; menu "Delete tonight's games" | h1; paragraphs; `tally`; buttons; main | SWD-060, 065, 128 |
| Delete tonight's games | dialog "Delete tonight's games? The games and tally will be lost." with "Delete" / "Keep it" (main) | dialog | SWD-065 |
| Players sheet | dialog "Players"; h2s "Chai Champions" / "Coffee Commandos"; per player: the name (button, accessible name "Rename Kabir"; tapping gives an input labelled "Player name" and quiet "Done"), quiet "Move to Coffee Commandos" (guessers only; accessible name "Move Zoya to Coffee Commandos"), "✕" (accessible name "Remove Kabir"); adding: input labelled "Player name", placeholder "Type a name…", switch "Doesn't give clues", buttons "Add to Chai Champions" / "Add to Coffee Commandos"; main "Done"; toasts "Neha joined Chai Champions" (no Undo) · "Zoya moved to Coffee Commandos · Undo" · "Kabir left · Undo" | dialog; h2; buttons; input; `role="switch"`; `toast`; `undo-toast` | SWD-127 |
| New clue giver | dialog "Who gives clues for Coffee Commandos now?" with one button per eligible player of that team (`aria-pressed`) and main "Done" | dialog | SWD-127 |
| Team of one | dialog "Kabir leaves Coffee Commandos with only Om. Move someone over?" with buttons "Move Zoya over" (one per guesser who can move) and main "Keep Kabir"; if no one can: line "No one can move over." with main "Keep Kabir" and quiet "End the game" | dialog; buttons; paragraph | SWD-127 |
| Show the map sheet | dialog "Show the map to"; buttons "Riya (Chai Champions)", "Arjun (Coffee Commandos)" (pair: "Nana + Aarav (Chai Champions)"); quiet "Cancel" | dialog | SWD-037 |
| Sideways | "Turn your phone sideways to see the board." | paragraph `turn-sideways` (body text) | SWD-092 |
| History | "Secret Words · 3 games"; "Game 2 · Chai Champions won · Riya and Arjun gave clues"; "Game 2 · Chai Champions won (Landmine) · Riya and Arjun gave clues"; "Game 3 · Ended early · Meena and Kabir gave clues"; pair "Game 4 · Coffee Commandos won · Nana + Aarav and Kabir gave clues" | `history-game`; `history-round` | SWD-064 |
| Announcements | SWD-095 | `announcer` (`aria-live="polite"`) | SWD-095 |

### Menu ("··· Menu", top right) at each step
Items in this order; **—** = not present; "disabled" = shown and disabled; "2/3" = only with two or three phones. "← Back" or
"Done" from Settings, History and How to play returns to the same step.

| Step | How to play | Earlier clues | Start 90-second timer / Stop timer | Clue not allowed? | Pass the pick | Players | Show the map to a clue giver | Show the map code again | New board | Pause | Home (keep this game) | End the game | End for tonight | Settings | History |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Who's playing?, Make teams, Choices, Read this aloud | no menu ("← Back" instead) | | | | | | | | | | | | | | |
| Preview board | ✓ | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Scan screen | ✓ | — | — | — | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Map code again (SWD-129) | no menu (main "Back to the game") | | | | | | | | | | | | | | |
| Pass screen | ✓ | — | — (button on screen) | — | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Private map | no menu (SWD-031, 113) | | | | | | | | | | | | | | |
| Clue screen | ✓ | — | — (button on screen) | — | — | ✓ | 2/3 | 2/3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Guessing | ✓ | ✓ | ✓ | ✓, disabled outside SWD-046's window | ✓ (hidden when the team has 1 guesser) | ✓ | 2/3 | 2/3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| End-turn line, turn over | ✓ | ✓ | — | — | — | ✓ | 2/3 | 2/3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Game over | ✓ | — | — | — | — | ✓ | — | — | — | — | — (button on screen) | — | — (button on screen) | ✓ | ✓ |
| Summary | only "Delete tonight's games" | | | | | | | | | | | | | | |

At 568 × 320, "Change clue" (SWD-041) is a menu item right after "Clue not allowed?", with the same window. The clue screen
opened by "Change clue" or "Try another clue" has the clue screen's menu. Home's own menu (outside a game) gains "History"
(SWD-115).

**Back:** "← Back" on setup screens: Who's playing? → the picker (from game over: "← Back to the game" → game over, SWD-112);
Make teams → Who's playing?; Choices → Make teams; Read this aloud → Choices; code entry → the Join screen; map phone →
Home. Make teams keeps its teams across "← Back" (SWD-004). During a game there is no "← Back", and the browser's or phone's
Back does nothing (the existing back guard).

---

## 01 Setup → `specs/secret-words/01-setup.md`

### SWD-001 Picking Secret Words
Home's "Host a game" reads "Tambola, Impostor or Secret Words on this phone" (titles joined with ", ", and " or " before the last). Its picker "What shall we play?" shows three cards
of equal width and height (±1 px) in the order Tambola, Impostor, Secret Words; tapping Secret Words opens "Who's playing?". With an
unfinished Secret Words game night its resume card (SWD-115) shows above the cards (after Impostor's, if both are unfinished);
tapping the Secret Words card then opens the Start new dialog (SWD-115): "Start new (ends that one)" ends that game night
(SWD-067) and opens "Who's playing?"; "Carry on that one" resumes it.

### SWD-002 Join a game, and the map code
Home's second card reads **"Join a game"** with the line "Tambola ticket or Secret Words map from the host" (owner, 4
October), and opens the Join screen, now headed "Join a game". (Until Secret Words ships, the line reads "Tambola ticket from
the host"; that C1 change is in the handover and tested with Tambola; Secret Words' tests check only the final line.) Rule 11:
this rewords PLT-300 (Home), IMP-002 (its string row and Given) and the Tambola join scenarios that quote "Join with my ticket"
or "Type the code" (now "Type a ticket code") or Tambola's scan label (now "Scan a ticket or secret map", SWD-133); the tester
updates their wording. On the Join screen, in this order: the scanner "Scan a ticket or secret map" (SWD-133) and "Type a
ticket code"; Impostor's line; Secret Words' line; quiet "I have a map code", which opens the code entry.
Input: `autocapitalize="characters"`, `maxlength="12"`. The typed text is read with spaces and hyphens removed and letters
upper-cased. "Open the map" is disabled while that leaves fewer than 7 characters. On tap:
1. not exactly 7 characters, any character outside the alphabet (0, O, 1, I, L included), or a wrong check symbol
   (SWD-022), or a deal index too large for its edition (checked only for shipped editions) → "That code doesn't look right. Check it with the host.", typed
   text kept;
2. a config symbol for an edition this app doesn't have (value ≥ 4 while the app has only edition 1) → "This map needs a
   newer version of the app. Open the app once with internet, then try again.";
3. otherwise the map phone opens (SWD-034), without team names (SWD-117).
**The QR link** `<origin><BASE_URL>#map=27P3QX8&t=SWDT-01` (`BASE_URL` = the app's base, e.g. `/pocket-game-night/` or
`/preview/`; `t` = the game night's team-name pair id, SWD-117) opens the map phone directly; the hash is then removed from the
address. An invalid or newer code in the link opens the code entry with it filled in (raw) and the matching error shown; "← Back"
there goes to the Join screen. Opening a map never changes an unfinished host game night on that phone.

### SWD-003 Who's playing?
Impostor's names screen (IMP-003) **without** the "Sit in a circle…" line and without ▲ ▼ (order means nothing here):
tonight's names filled in, "Clear list", past names. "Next" is disabled while there are fewer than 4 names, with "Add at
least 4 players." shown below the list whenever that is true (0 names included). Adding a 21st name shows "20 players is the
most." and adds nothing. "← Back" → the picker (opened from game over: "← Back to the game", SWD-112). Every Enter adds its name
and keeps the field focused (SWD-132).

### SWD-004 Make teams
The first time in a new evening's setup: names are shuffled with ``shuffle(names, createRng(`${teamSeed}:${k}`))``, k = 1;
the first ⌈n/2⌉ go to the orange team and the rest to the teal team, each in shuffled order; the draw is accepted by SWD-130's
rule (otherwise k + 1, at most 10 draws). `teamSeed` is made (or read from test hook 2) on first entering Make teams for a new
evening and kept into the evening's setup. Clue givers: SWD-007. ("Play again with these teams", SWD-115, skips this draw.)
Returning to Make teams ("← Back" then "Next", or "Change players, phones or board" later, SWD-112) keeps the teams: names no
longer playing are dropped; new names join the smaller team (orange if equal) at the end; a clue giver who left is replaced by
SWD-007.
Columns side by side, each (screen width − 32 − 8) / 2 px wide; names may wrap to 2 lines; the badge sits on its own line
under the name. This screen may scroll (page); the main button stays fixed.

### SWD-005 Moving a player
Each name is a button with accessible name "Move Om to Coffee Commandos" (`aria-label`; the badge is not part of the name). A tap
moves the player to the end of the other team and shows "Om moved to Coffee Commandos · Undo". If they were their team's clue giver,
the old team's clue giver becomes the player now at the moved player's old position, else the team's first player; the
moved player is a guesser. A team left empty has no clue giver; the next player to join it becomes clue giver. "Undo"
restores teams and clue givers exactly as before that move. Only the latest move can be undone (a new toast replaces the
old one). A second tap within 500 ms of the first does nothing.

### SWD-006 Shuffle teams
"Shuffle teams" draws a new split with the next k (SWD-004), accepted by SWD-130's rule, at most 10 draws in all, keeping the
10th. Clue givers by SWD-007. Toast "Teams shuffled · Undo" (Undo as SWD-005). k counts every draw of the evening and is saved
(`splits`).

### SWD-007 Clue givers
Each team's suggested clue giver is its eligible member credited with the **fewest games this evening** (won and ended early;
replaced boards don't count; a partner's games count, SWD-123); ties go to the earliest in that team's list. (Game 1: each
team's first eligible player.) A suggestion never has a partner. "Change clue givers" (Make teams) and "Swap" (game over,
SWD-112) open the Clue givers sheet: per team, the current one selected; tapping another selects it; "Done" applies; closing it
any other way changes nothing.

### SWD-008 Team minimum
While either team has fewer than 2 players, "Next" is disabled and "Each team needs at least 2 players." shows. Teams may
differ in size by any amount.

### SWD-009 How do you want to play?
Three groups, each showing only its chosen option's line (the phone cards always show their own text).
**How many phones?**: three equal cards (±1 px) in this order: "One phone", "Two phones" (with the small line "Recommended"
inside the card, never the selected or main look), "Three phones"; none selected the first time on this phone, so "Start the
game" is disabled until one is tapped, with `start-hint` (SWD-119) above it (`choices.map` = `'pass'`, `'shared'`, `'own'`).
Two and three phones play the same way; they differ only in the scan screen's wording (SWD-033, 116). Cards are stacked full
width in portrait and at 568 × 320, and side by side at 812 × 375; each card's accessible name is its title, its texts linked
by `aria-describedby`. "Recommended" never changes the card's look beyond its own small line. This screen may scroll (page);
the main button stays fixed. **Board**: Full (default) / Easy; with 9 or more players `big-group-hint` (SWD-119) shows under
this group. **Landmine** (shown only while Full is chosen; Easy has no Landmine): Lose the game / Lose your turn
(`choices.landmine` = `'lose' | 'turn'`; kept when Easy is chosen); its default is SWD-119's. **Words**: Whole family (default)
/ + Harder words. A new evening starts from this phone's last-used values for all four (SWD-066), with "Same as last time" under
the heading; each saved field is read on its own (an unknown value gives that field's first-time state; "Same as last time"
shows only when all four were valid; a missing `landmine` takes SWD-119's default and counts as valid); version 2's `'pass'`
and `'own'` read unchanged. "Start the game": if the read-aloud card is due (SWD-010) it opens; otherwise it deals at once (in a
new evening, the evening is created then). Between games the choices change only through "Change players, phones or board" →
Who's playing? → Make teams → this screen (SWD-112).

### SWD-010 Read this aloud
Due when no Secret Words game has been dealt yet in the current session (PLT-016); checked when "Start the game" is tapped in a
new evening. Lines: 1 "Two teams, Chai Champions and Coffee Commandos. Each has a clue giver who sees the secret map." (the evening's names) 2 "Clue givers: say
one word and a number. 'Monsoon, 2' means two of our words go with monsoon." 3 "Guessers: talk, then turn over words one at
a time. Wrong word? Your turn ends." 4 "Find all your words first. Step on the Landmine and you lose!" (Lose your turn: "Find all your words first. Step on the
Landmine and your turn ends!"; Easy: "Find all your words first!"). "Let's play" deals; "Show me the board first" deals and opens the preview board (SWD-012).

### SWD-011 How to play (detail of SWD-010)
Menu → "How to play": h2 "Read this aloud" and its 4 lines, then h2 "The rules": 1 "Clue givers see the secret map.
Everyone else sees only the words." 2 "A clue is one word and one number. It must be about meaning, not spelling or where a
word sits." 3 "No faces, no pointing, no extra hints. Before the first guess, both clue givers decide together whether a clue is allowed." 4 "Guessers
take at least one guess, and up to the number plus one. 0 or ∞: as many as you like." 5 "Your word: keep going. Nobody's word
or the other team's: your turn ends. The Landmine: you lose!" (Lose your turn: "The Landmine: your turn ends and the other team
gets a word free."; Easy: without the Landmine sentence) 6 "First team to find all its words wins." Then h2 "Clue rules" and its
4 lines (SWD-131). Then the small line `credit`: "Secret Words uses game rules inspired by Codenames, designed by Vlaada
Chvátil. Codenames is a trademark of Czech Games Edition. Secret Words is an independent free game and is not made, sponsored or
endorsed by Czech Games Edition." (plain text, no styling; `docs/games/secret-words/legal.md`) Main "Done" returns (opened from
the dispute dialog's "Clue rules": to that dialog, SWD-124). The page may scroll. Nothing about the map appears.

### SWD-012 The preview board (detail of SWD-010)
After "Show me the board first": the board with every cell locked, `turn-line` "Chai Champions start" (the starting team), the
counts, and main "Start", which leads to the scan screen (two or three phones) or the pass screen (one phone). No clue line, no tips.

### SWD-013 Funny team names (owner, 4 October, K25)
Each evening the two teams get a random pair from `team-names.csv` (20 pairs, column `id` e.g. `SWDT-01`; the first name goes to
the orange team, the second to the teal team). The pair is drawn on first entering Make teams for a new evening:
``createRng(`${teamSeed}:names:${m}`)``, m = 1, picking uniformly among the pairs not used by the 3 most recently started other
Secret Words evenings on this phone (all 20 if fewer than 4 remain). Quiet **"New team names"** on Make teams draws again with
the next m, never giving the pair on screen, with the toast "New team names · Undo" (Undo restores the previous pair). The
names are fixed from the evening's first deal: later "Change players, phones or board" shows them without "New team names".
"Play again with these teams" (SWD-115) reuses the previous game night's pair instead of drawing, without "New team names".
Every name is a plural phrase of at most 18 characters, so headings read "Chai Champions win!", and screens never use a
possessive ("Chai Champions's"). Names are content: English or known everywhere (K24), kind to everyone (never about a region,
religion, caste, gender or body). `team-names.csv` changes like the word list: by edition (SWD-023); a saved evening keeps
its names as text, with the pair id.

### SWD-014 Doesn't give clues (P7)
In the Clue givers sheet each player row has the name button and, on its own line under it, a switch "Doesn't give clues" (`role="switch"`,
`aria-checked`, accessible name "Riya: doesn't give clues"), off by default; the sheet scrolls inside. Changes apply on "Done", like the
rest of the sheet. A player with it on is not **eligible**: never suggested by SWD-007 (and so not by SWD-006), never a partner
(SWD-123), never chosen by SWD-005 or SWD-127 (each picks the next eligible player in list order, wrapping to the first), and
their name button is disabled. Turning it on for the current clue giver makes the next eligible player the clue giver. A team's
last eligible player's switch is disabled, with "Each team needs someone who can give clues." under that team's group. If a move
or shuffle on Make teams leaves a team with no eligible player, Make teams shows the same message and "Next" is disabled. Make
teams shows the small line "Doesn't give clues" (`guess-only-tag`) under such names. In "Players" (SWD-127), "Remove" is disabled
for a team's last eligible player; added players start with the switch as set when added. Kept in `teams.guessOnly` (recorded
with `setTeams`, or `setPlayers` for players added in a game), carried by name into a new evening from the latest Secret Words
evening of the same session. The Clue givers sheet opens from Make teams ("Change clue givers") and from game over ("Swap",
SWD-112), nowhere else.

---

## 02 The deal and its secrets → `specs/secret-words/02-deal.md` (C3)

### SWD-020 What a board holds
Full: 25 distinct words; starting team 9, other 8, nobody 7, Landmine 1. Easy: 16 distinct words; 6, 5, 5, 0.
**Property:** for 10,000 random valid codes of each size, exactly these counts and all words distinct.

### SWD-021 Who starts
**Property:** over 10,000 random valid codes, each team starts between 48% and 52% of boards.

### SWD-022 The map code
Symbols (values 0–30): **1 config** = (edition − 1) × 4 + (Easy ? 2 : 0) + (+ Harder words ? 1 : 0) (edition 1: 0–3);
**2 deal index** n (0–30, the board's place in the deck, SWD-024); **3–6 deck seed** d (0 to 31⁴ − 1 = 923,520, base 31,
most significant first); **7 check** = (1·v1 + 2·v2 + 3·v3 + 4·v4 + 5·v5 + 6·v6) mod 31. Shown "27P-3QX8".
**The board from a code** (`boardFromCode`), a pure function of the code and the shipped list:
1. `candidates` = rows with `edition` ≤ e and (`retired_in` blank or > e); for Whole family only rows with `audience` =
   family; in `words.csv` row order.
2. `deck` = ``shuffle(candidates, createRng(`secret-words:deck:${d}`))`` (the engine's `shuffle`).
3. `words` = `deck.slice(25·n, 25·n + size)` (size 25 or 16; Easy boards also step by 25).
4. `r` = ``createRng(`secret-words:board:${d}:${n}`)``; `starts` = `r.int(2) === 0 ? 'orange' : 'teal'`; then `kinds` =
   `shuffle([starts × 9, other × 8, nobody × 7, landmine × 1], r)` (Easy 6, 5, 5, 0), in that order of draws.
A code is valid only if its check is right, its edition is shipped and 25·n + size ≤ candidates.length.
**Property:** `boardFromCode` gives the same result for 10,000 codes on every call. **Browser check (5 codes, via test hook
2):** the host board and a map phone given the same code show the same words in the same cells with the same kinds and
starting team. **Golden boards:** the tester records 5 codes with their exact boards from the first green build as fixtures;
any later change to them is a C3 defect (a list change makes a new edition instead).

### SWD-023 Words and editions
`words.csv` columns: `id, word, meanings, category, audience, nonveg, edition, retired_in, notes`. Edition 1 = every row with
`edition` 1. **Any change to the list makes a new edition** (new rows get the new edition; a retired row gets `retired_in` =
the new edition and stays in the file). The app ships every edition it knows, so old codes and old evenings always rebuild the
same boards. At most 7 editions fit the config symbol; each edition's candidates stay at most 775 words (31 deals of 25).
Non-veg words are dealt (K10).

### SWD-024 The deck: no repeats this evening
At evening creation, whenever the candidate list changes (Board or Words changed), and when the deck runs out, the host picks
a **deck**: with ``rng = createRng(`${seeds.deal}:deck:${k}`)`` (k = the evening's deck number from 1) it draws up to 200
deck seeds, each `rng.int(923521)`, and keeps the one whose first min(75, candidates.length) deck words contain the fewest of
(this evening's words ∪ recent words), ties to the earliest drawn, stopping early at the first with none. `recent` = the board
words of the 3 most recently started other Secret Words evenings on this phone that weren't deleted, frozen at evening
creation. Deals then use n = 0, 1, 2, … in that deck; when 25·n + size would exceed the candidates, the next deal picks a new
deck (k + 1) and starts at n = 0. **Property:** for 1,000 random evenings of 15 Full Whole-family deals with the edition-1
list, no word is on two boards. (Once the deck runs out, or after a change of Board or Words, repeats can happen.)

### SWD-025 The map stays private
Until game over, every room screen's DOM has no kind of a face-down cell: all face-down cells have the same attributes,
classes, inline style and computed style except `data-index` and the word text. **Rule property:** over 10,000 random games,
`viewFor(room)` never contains a face-down cell's kind. **Browser check:** 10 seeded games in each map mode, at every step.
The map and the code appear only on map screens.

### SWD-026 Replays
The evening's record holds its seeds, setup and moves; every `deal` and `dealNew` records its code, and `brokeRule` its cell.
Replay accepts any recorded code valid for the shipped editions and gives the same boards, reveals and results. Live, `play`
accepts only the code SWD-024 gives for that deal (or the test hook's), and only SWD-046's cell.

### SWD-027 Map code checks (detail of SWD-022)
**Property:** every code `codeFor` makes passes the check; changing any one symbol of a valid code to any other symbol fails
it, and so does swapping two adjacent different symbols.

### SWD-028 The scan screen shows the code (detail of SWD-025)
The scan screen shows the code by design (K3, owner); it is a map screen. Accepted with K3: someone who can read the code
and the app's source could work out the other boards of that deck. This is family trust, like Tambola's anchor, and an
owner-accepted exception to "seeds never leave the host phone".

---

## 03 Seeing the map → `specs/secret-words/03-map.md` (screens C2; privacy C3)

### SWD-030 One phone: pass to the clue giver
At the start of each turn with one phone: team bar; heading "Chai Champions, your turn" with the team icon; "Pass the phone
to"; `pass-name` RIYA at 48 px, shrinking in 1 px steps to 32 px to fit one line, and wrapping onto 2 lines at 32 px if it
still doesn't fit (a pair, SWD-123: two block lines "NANA +" and "AARAV", DOM text "Nana +" and "Aarav", each line shrinking
on its own the same way, floor 32 px); "Clue giver for Chai Champions (orange)" (pair: "Clue givers for Chai Champions
(orange)"); `waiting-line` (SWD-126); the recap line (SWD-103); the Do Not Disturb tip on the evening's first pass screen
(SWD-104); quiet "Start 90-second timer"; main "I'm Riya" (pair: "We're Nana and Aarav"; taps ignored for 1 s after the screen
appears, SWD-114).
**Layout.** The content above the main scrolls inside if needed, main fixed. When space runs short, these hide in this order:
`dnd-tip`, then `waiting-line`, then `recap-line`; the heading, "Pass the phone to", `pass-name`, the clue-giver line, the timer
button and the main never hide. At 320 × 568 the content may also scroll inside after those have hidden.

### SWD-031 One phone: the private map (P4)
After "I'm Riya": heading "Riya" (CSS upper case; pair "Nana + Aarav"); small line "You give clues for Chai Champions (orange)";
the counts; the map area (empty while hidden); pad `hold-pad`, a button named by its visible text "Tap to see the map" / "Tap to
hide" (no `aria-pressed`); quiet "Our words" and quiet "↻ Flip" (accessible name "Flip the board") side by side (half width
each, shown only while the map shows); quiet "Not Riya? Go back" before the first show and quiet "Someone saw the map" while the
map shows (SWD-113); main once shown; no menu, no team bar.
- A tap on the pad shows the map; taps within 500 ms of the last are ignored. The map is removed from the page at once on
  "Tap to hide", by SWD-121 (60 000 ms), when "Someone saw the map" opens its dialog (SWD-113), and when the app is hidden
  (SWD-032). When it hides, "Our words", "↻ Flip" and "Someone saw the map" hide and the list resets to the grid; the main stays.
- The shown map: every cell with its word text, kind colour and icon; cells already turned over at 40% opacity with the word
  struck through (accessible name adds ", found"); turned as the team's board angle (SWD-102).
- "Our words" swaps the grid for `our-words`: h2 "Your words (6 left)" ("(1 left)" for one; this team's face-down words), each
  word an `li` at 24 px (28 px with Larger text) in `data-index` order, then the small line `avoid-line` "Landmine word: Shadow" with
  the landmine icon (the Landmine's word if face down; none on the Easy board). The button then reads "Whole map".
- Main "I have my clue" appears at the first show and then stays; tapping it removes the map, records `mapSeen` (once per
  turn) and opens the clue screen.
- No text selection, callout, magnifier, context menu or drag on the pad or the map. No sound, no vibration.
- **Layout.** Portrait: heading, small line, counts, map area (board layout, SWD-090), the "Our words | ↻ Flip" row, pad (full
  width, 96 px tall), "Not Riya? Go back" or "Someone saw the map" (full width, 48 px), main; the content above the main
  scrolls inside if needed, main pinned, and does not scroll at 390 × 844 (Larger text off and on). Landscape: map area at the
  left as the board (SWD-091); at the right a column (200 px at 812 × 375, 160 px at 568 × 320) with heading, small line,
  counts, pad (column width × 96), "Our words", "↻ Flip", "Not Riya? Go back" or "Someone saw the map", and the main (column
  width × 60) pinned at the bottom; the column above the main scrolls inside if needed (at 568 × 320 it does).
- Narrow portrait: heading, small line, `turn-sideways`, the pad, "Not Riya? Go back" or "Someone saw the map", and the main;
  a tap on the pad shows the `our-words` list (not the grid), and the main appears at that first show; the content above the
  main scrolls inside if needed, main pinned.

### SWD-032 Leaving a map screen
On `visibilitychange` to hidden on the private map or the map phone: a full-screen `privacy-cover` appears and the map is
removed in the same task. Back on the host: the pass screen for the same player with "Welcome back." above it. Reload or resume
does the same.

### SWD-033 Two or three phones: scan the map
After each deal (after the preview's "Start", if shown) with two or three phones: the scan screen (strings above), QR at least
200 × 200 px encoding `<origin><BASE_URL>#map=<code>&t=<pair id>` (code without hyphen; pair id from `team-names.csv`, e.g.
`SWDT-01`, SWD-117); the orange team's clue giver named first in both wordings (a pair as "Nana + Aarav"). Two phones: main "The
map phone is ready"; three phones: main "Both have the map". `board-check` follows SWD-116 on every deal. The main opens the
starting team's clue screen. Resuming any time before the board's first clue shows the scan screen again. The page may scroll;
the QR stays 200 × 200 and the main stays fixed. While paused (SWD-110) the QR is removed from the DOM. The host never shows the
map in these modes until game over, except through SWD-037.

### SWD-034 The map phone
Heading "Secret Words map"; `map-teams` (SWD-117, only with known team names); `map-code-line` "Code 27P-3QX8 · Chai Champions
start" (without names: "Code 27P-3QX8 · Orange team starts", SWD-117); `first-words` (SWD-116); the map grid (`map-grid`, cells
`map-cell` with `data-index`, in the host board's order, each with word text, kind colour and icon, laid out as the board,
SWD-090/091, without the panel); the small line and the lists (SWD-120); quiet "Hide map" / "Show map"; quiet "Next map"
(SWD-039); quiet "Done with this game"; `map-end-line` (SWD-120). No main button, no "↻", no menu; "← Back" → Home. The map
shows on opening; after the app has been hidden, and after SWD-121's 60 000 ms, it returns hidden, with "Show map". Screen-on
lock (wake lock) while shown. In portrait the page may scroll at every size; grid cells are 48–56 px tall (SWD-090's widths).
Narrow portrait: "Turn your phone sideways to see the board." in place of the grid, buttons kept. Landscape: grid at the left;
heading, team and code lines, `first-words`, small line, buttons and `map-end-line` in a column at the right (200 px at
812 × 375, 160 px at 568 × 320) that scrolls inside if needed. The host's game ending changes nothing here. Larger text follows
this phone's own setting.

### SWD-035 Fading found words
Tapping a map cell toggles **found** (40% opacity, word struck through, accessible name adds ", found") on this phone only,
saved with the map. A second tap within 500 ms does nothing. Optional (SWD-120's small line says so); lists never fade (SWD-120).

### SWD-036 Clearing and replacing maps
This phone keeps at most one map (`pgn.secretWords.map` = `{ code, savedAt, found: number[], t?: string }`; `savedAt` = when
the code was first opened, or when "Next map" opened it; `t` = the pair id from the QR, kept by "Next map", SWD-117). "Done with
this game" → dialog → "Clear map" removes it and opens Home. Opening a different code (except by "Next map", SWD-039) replaces
it, with the toast "New map. The old one was cleared."; opening the same code opens it with its found marks and no toast. Home
shows a saved map as `saved-map`: a button "Secret Words map 27P-3QX8 · Tap to open"; more than 6 hours after `savedAt`, the
text "Secret Words map 27P-3QX8" with buttons "Open" and "Clear" ("Clear" opens the same dialog). The app never opens a saved map
by itself.

### SWD-037 Showing the map on the host (two or three phones)
Menu → "Show the map to a clue giver" → sheet "Show the map to" with the two current clue givers ("Riya (Chai Champions)",
"Arjun (Coffee Commandos)"; a pair "Nana + Aarav (Chai Champions)") and quiet "Cancel" → a name: SWD-030 and SWD-031 for that
player or pair, with main "Done, hide the map", which returns to the step the game was on.

### SWD-038 Larger text on map screens (detail of SWD-031, SWD-034)
Larger text changes the heading and lines, never the map's word size (SWD-090).

### SWD-039 Next map and the board check (P8, C3)
"Next map" on a map phone opens `nextMapCode(code)`: the same config and deck seed, deal index n + 1, a new check symbol, if that
code is valid (SWD-022); taps within 500 ms are ignored. It replaces the saved map (found marks cleared, `savedAt` = now, `t`
kept), shows the map even if it was hidden, and the toast "Next map. It should start with: Kite · Tiffin · Rain." (SWD-116;
27P-3QX8 → 28P-3QXA). If `nextMapCode` gives `null`: the toast "That was the last map of this deck. Scan the new code." and
nothing changes. With edition 1's Whole family list (451 candidates), the last valid n is 17 for both Full and Easy (25·17 + 25 =
450 ≤ 451; 25·18 + 16 = 466 > 451). "New board" uses up a deal index like any deal. **Property:** for 1,000 random evenings,
every deal for which SWD-116 shows one of its "Next map" wordings (clue givers changed or unchanged, two or three phones) has
exactly the code `nextMapCode` gives from the previous deal's code, and every deal showing a "New code: scan again." wording
does not.

---

## 04 Clues and guesses → `specs/secret-words/04-play.md` (rules C3, screens C2)

### SWD-040 The clue (P3, P4)
Team bar; heading "Chai Champions, your turn"; `clue-prompt` "Riya, say your clue out loud. How many words is it for?" (pair:
"Nana and Aarav, say your clue out loud. How many words is it for?"); keys; `clue-help` (SWD-118) under the keys; the input
`clue-word` "Clue word (optional)" (`maxlength="24"`, `autocapitalize="off"`; Enter does not submit); `clue-warning` (SWD-101);
the counts; on the evening's first turn of its first game only, the tip; with two or three phones `waiting-line` (SWD-126) and
the recap line (SWD-103); one phone: quiet "See the map again"; from "Change clue" or "Try another clue": quiet "Keep my clue";
quiet "Start 90-second timer"; main.
Keys `clue-key`: portrait 0–4 and 5–9 in two rows, then "∞" full width; each 56 × 56 px (∞ 56 px tall), gaps 2 px at 320 px wide
and 8 px from 360 px up. The "∞" key shows "∞" with the small word "many" under it (SWD-118); accessible name "As many as you
like". A tap selects a key (selected look); another tap moves the pick. Main "Pick a number" (disabled), then "Clue for 2: start
guessing" (0: "Clue for 0: start guessing"; ∞: "Clue for ∞: start guessing"); the word is recorded trimmed, inner spaces and
case kept, and left out when empty (SWD-101).
- "See the map again" (one phone) opens the private map shown, SWD-121's clock starting at that show and a running timer
  carrying on, with main "Back to my clue", which returns here with the number and word kept; nothing is recorded.
- "Keep my clue" (after "Change clue" or "Try another clue") returns to guessing with the clue unchanged; nothing is recorded.
  A reload while changing returns to guessing with the old clue.
- **Layout.** Portrait: one column; the content above the fixed main scrolls inside when needed. At 390 × 844 with Larger
  text off, nothing scrolls with the keyboard closed. When space runs short, these hide in this order: the tip, then
  `waiting-line`, then `clue-help`, then the recap line.
  812 × 375: two columns: the left (heading, prompt, input, warning, counts, tip, waiting line, recap, buttons) scrolls inside;
  the right column, 358 px wide, holds the keys in two rows of 6 (0–5; 6–9 and ∞), each 56 × 56 (∞ too) with 4 px gaps, then
  `clue-help`, above the main. 568 × 320: one column scrolling inside, keys in one row of 11 at 44 × 44 with 4 px gaps, main at
  the bottom right. No-scroll checks are made with the keyboard closed; when the input has focus it is scrolled into view.

### SWD-041 Guessing and the allowance (P3, P5)
After the clue (portrait, top to bottom): team bar; top bar with `hurry-timer` (if running) and "··· Menu"; `turn-line`
"Chai Champions guessing" (1 line; at most 2 in the landscape panel; the poker line of SWD-125 for its first 3 000 ms);
`clue-line` and `guess-line` (SWD-118) as one block; `clue-history`; the counts row with the "↻" button (44 × 44, accessible
name "Flip the board") at its right end; the board; the tip or result line (at most 2 lines); the **action slot**; the main
(SWD-122: "Sunita: Reveal").
- **Action slot:** until the turn's first reveal (ending at the "Reveal" tap, t = 0), two quiet buttons side by side, "Change
  clue" and "Clue not allowed?" (half width each, 48 px, labels may wrap onto 2 lines); from the first reveal, quiet "End our
  turn". At turn over (including after `brokeRule`) the slot is empty.
- `clue-line` and `guess-line`: SWD-118. `guess-line` counts down while guesses remain.
- `clue-history`: this team's earlier clues in force in this game, newest first, at most 3: "Earlier: MONSOON 2 · 1 · RAIN ∞"
  (number alone without a word; ∞ as "∞"); not before the team's second clue; replaced clues never show. Shown in portrait when
  `innerHeight` ≥ 700 (Larger text on or off) and in the landscape panel; otherwise hidden. The menu's "Earlier clues" sheet
  always lists every clue in force of this game.
- The first-guess tip (SWD-122) shows in the tip place on the evening's first guessing turn until its first reveal.
- "Change clue" opens the clue screen with the number and word selected; confirming records a new `clue` that replaces the
  turn's clue (announced again); "Keep my clue" returns (SWD-040). "Clue not allowed?" opens the dispute dialog (SWD-124);
  after "Let it go", "Change clue" still works.
- **Fit at 360 × 640 (Larger text off):** team bar 8 + top bar 48 + turn-line 24 + clue block 48 (`clue-line` 22 px, 1 line;
  `guess-line` 15 px, 1 line) + counts row 44 + board (5 × 48 + 4 × 4) 256 + result 42 + action slot 48 + main 60 + bottom 16
  = 594, plus 9 gaps of 4 px = 630 ≤ 640. Shrink order when it doesn't fit: cell height 56 → 48 px, then `clue-line` 22 → 17
  px. Longest content for this fit: an 18-character team name, a 12-character clue word with "∞", a 16-character picker name
  (main on 2 lines at 17 px). A longer clue word wraps onto a 2nd line at 17 px, and the page may then scroll as one with the
  main fixed. With Larger text on at 360 × 640 the page scrolls as one with the main fixed. No page scrolling at 390 × 844
  (Larger text off and on).
  `turn-line` is 17 px, weight 600, not grown by Larger text; the poker line shrinks in 1 px steps to 13 px to stay on 1
  line, and if it still doesn't fit, each name shows its first 8 characters then "…". Longest content adds a pair of
  16-character names in the poker line.
**Property:** no turn records more guesses than its allowance (counted from the turn's last `clue`), no `clue` follows a reveal
in the same turn, and no turn ends by "End our turn" before one guess.

### SWD-042 Pick, then confirm
Face-down cells are buttons (`board-cell`, `data-index`, accessible name "Kite, face down", `aria-pressed`). A tap picks
(selected look: outline, ✓, tint; never a team colour); a tap on the picked cell unpicks; a tap on another moves the pick.
Turned-over cells are not buttons. Main "Sunita: Reveal" (disabled) / "Sunita: Reveal <WORD>" (the picker's name, SWD-122).
Tapping it is the guess; anyone may tap it. The pick clears after each guess.

### SWD-043 What a guess does
At t = 0 the cell starts a 300 ms turn (none with reduce motion); at t = 300 ms (0 with reduce motion) the cell shows turned
over, the counts update and the result line shows; taps on cells and buttons do nothing until then.

| Word was | Result line | Then |
|---|---|---|
| Own team's, guesses left (clue 1–9) | "✓ Riya's clue works! 2 guesses left." / "✓ Riya's clue works! 1 guess left." | Guessing continues |
| Own team's, clue 0 or ∞ | "✓ Riya's clue works! Keep going, or end your turn." | Guessing continues |
| Own team's, allowance used up | "✓ Riya's clue works! That's all your guesses." | Turn over |
| Nobody's | "Blank word. Other team's turn next." | Turn over |
| The other team's | "✗ The other team's word! It counts for them." | Turn over |
| Either team's last word | none | Game over at t = 300 ms: that team wins |
| The Landmine, Lose the game | none | Game over at t = 300 ms: the other team wins |
| The Landmine, Lose your turn | "Boom! The Landmine! Your turn is over, and the other team gets one word free." | Turn over; the free word turns over as SWD-046 (seed ``${seeds.deal}:landmine:${D}:${T}``, recorded as the reveal's `freeCell`); if it is that team's last word, game over: that team wins |
"Riya" is the guessing team's clue giver; with a pair, "✓ Nana and Aarav's clue works!" and the same endings (SWD-125). Other
result lines name no team and no person, so every name fits. The last-word and Landmine rows win over the others. With Lose your
turn, the Landmine stays turned over and can't be picked again.

### SWD-044 Ending the turn early
"End our turn" (shown from the turn's first reveal, SWD-041): a tap shows the end-turn line: cells locked, result
line "Chai Champions ended their turn.", quiet "Oops, keep guessing" (back to guessing; nothing recorded), main "Other team's turn"
(records the end of the turn and the next turn). A running timer stops when the line shows.

### SWD-045 Turn over
Cells locked (not greyed), the result line stays, the clue line, guess line and tip are removed, "End our turn" is hidden, main
"Other team's turn": one phone → the pass screen for the other team's clue giver; two or three phones → the other team's clue
screen.

### SWD-046 A clue that broke a rule
The menu item "Clue not allowed?" is enabled from the clue until the turn's first guess; disabled otherwise. It and the board's
quiet "Clue not allowed?" (SWD-041) open the dispute dialog (SWD-124). Its "Turn ends, they get a word": the turn
ends; `list` = the other team's face-down cells in cell order; cell =
``list[createRng(`${seeds.deal}:penalty:${D}:${T}`).int(list.length)]`` (D = deal number of the evening, T = turn number on
this board); that cell turns over as SWD-043 (vibration 50 ms, the `thud` sound). Result line "Clue broke a rule. One of
the other team's words was turned over." and turn over; if it was that team's last word: game over, that team wins.

### SWD-047 Start 90-second timer
"Start 90-second timer" (buttons on the pass and clue screens; menu item while guessing) starts the timer `hurry-timer`. Place and
`font-size` (Larger text has no effect): portrait board screens, in the top bar left of "··· Menu", 56 px at 390 × 844 and 40 px
at 360 × 640; landscape board panel, on its own row above "··· Menu", 40 px at 812 × 375 and 568 × 320; the private map's top
right and every other screen, 28 px. "Time's up!" and "Paused" shrink in 1 px steps to fit their place, floor 28 px. It reads
"1:30" at t = 0, "1:29" at t = 1 s, … "0:01" at t = 89 s, and "Time's up!" from t = 90 s (with the chime, sound on); "0:00" never
shows. The button or menu item reads "Stop timer" from the start until tapped (also after "Time's up!"); "Stop timer" removes
the timer. A timer started on the pass screen keeps running on the private map and the clue screen. Nothing else ever happens
because of the timer. It is removed when the clue is given, at the end-turn line, at turn over, on "New board", "End the
game" and game over. When the app is hidden, or on "Pause" (SWD-110), it shows "Paused" and the button or item reads "Start
90-second timer"; it stays "Paused" ("Carry on" does not restart it) until a tap on "Start 90-second timer" restarts it at 1:30
from that tap. It is not saved: after a reload there is no timer.

### SWD-048 Reload during play (detail)
Only moves are saved, plus UI state `pgn.secretWords-ui.<id>` = `{ step, angles: { orange: 0 | 180, teal: 0 | 180 }, paused:
boolean, pickerOverride: string | null }` (step: `'preview' | 'scan' | 'pass' | 'map' | 'end-turn' | 'game-over' |
'summary'`; `'game-over'` is saved while the "Game ended · Undo" toast runs, `'summary'` while the summary has not been left,
SWD-060; other steps are read from the moves). A reload returns to the last step with the last reveal's result line, the board
angles, the pause cover if paused (SWD-110) and the picker override of this turn (SWD-122); picks, the selected key, the typed
clue word not yet confirmed, open dialogs and menus, the timer and a shown map are lost; a private map returns to its pass screen
with "Welcome back."; a clue screen opened by "Change clue" or "Try another clue" returns to guessing. A reload with step
`'game-over'` and no `endGame` yet records `endGame` and shows game over without the toast (SWD-054); with step `'summary'` it
records `endGame` (if mid-game) and `endEvening` and shows the summary without "Oops, keep playing" (SWD-060).

### SWD-049 Double taps (detail)
Every button that records a move ignores another tap for 800 ms after a tap; picks and key choices follow the last tap.

### SWD-101 The clue word (P3, C3)
The `clue` move carries `word` (1–24 characters after trimming), or no `word` at all; replay rejects a longer word.
**Warning (clue screen only):** both the typed text and each face-down word are reduced to their letters a–z: NFKC, lower
case, every other character dropped ("ice-cream" → "icecream", "Taj Mahal" → "tajmahal"). If the typed text keeps at least 3
letters and equals a reduced face-down word, contains one, or is contained in one, `clue-warning` (a paragraph under the input)
reads "Heads up: Cricket is on the board." for the first such word in `data-index` order (word
text); otherwise it is absent. It updates on every input event and never blocks. Worked cases with Bat and Monsoon face down:
"bat" and "Batsman" warn ("Bat …"); "mon" warns ("Monsoon …"); "ca" never warns; "मानसून" never warns. Words already turned
over never warn.

### SWD-102 Flip the board (P6, flip only)
The "↻" button (accessible name "Flip the board"; "↻ Flip" on the private map) on every board screen and the private map,
hidden in narrow portrait. Each tap flips the grid 180° (0° ↔ 180°) inside its area, so its words read upright from the other
side of the table; cells keep their `data-index` (at 180°, index 0 is at the bottom right) and are tapped where they show.
`word-board` (and the private map's `map-grid`) carry `data-angle="0"` or `"180"`. 90° is not offered: in portrait a turned
5 × 5 grid gives each word about 40–48 px, too narrow for 8 letters at 12 px (a deviation from P6's 90° steps). The angle is kept
per team colour for the evening (UI state, SWD-048), across games and "Change players, phones or board": a tap on the guessing,
end-turn line or turn-over step changes the guessing team's angle; on the private map, the clue giver's team's; on the preview,
the starting team's; at game over, the angle of the team that played last. A team's angle is applied when its turn starts; turn
over keeps the team that just played.

### SWD-103 Recap line (P9)
`recap-line` on the pass screen (one phone) and the clue screen (two or three phones, also when opened by "Change clue" or "Try
another clue"), from the board's second turn (it restarts after "New board"; it shows again after a reload): "Last turn: Coffee
Commandos found 2 words;" (that turn's **found** words, Terms; "found 1 word", "found 0 words") then how the turn ended, the
first that applies: broke a rule → "the clue broke a rule."; the Landmine (Lose your turn) → "they stepped on the Landmine.";
"End our turn" → "they stopped."; allowance used up → "they used all their guesses."; a nobody's word → "Train was blank."; the
other team's word (the current team's) → "Train was yours!". Fits in 2 lines (3 with Larger text) at every size with an
18-character team name and an 8-letter word.

### SWD-104 Do Not Disturb tip (P9)
`dnd-tip` "Tip: turn on Do Not Disturb so messages don't pop up on the board." on the evening's first deal, on every showing of
its first pass screen (one phone, including after "Welcome back." or a reload) until the evening's first `mapSeen`, or of its
first scan screen (two or three phones) until the evening's first `clue`. Not after "New board" when that
happens later, and not on the "Show the map code again" screen. It never shows together with the "One word, one number" tip.

---

## 05 Winning and the night → `specs/secret-words/05-results.md` (C3)

### SWD-050 Who wins
A team wins when all its words are turned over (by either team, or SWD-046). With Lose the game, turning over the Landmine makes the other team win; with Lose your turn, see SWD-043.
**Property:** every one of 10,000 random scripted games ends with exactly one winner, or ended early.

### SWD-051 Game over
Heading "Chai Champions win!"; line "All 9 words found." (the winner's total: 9, 8, 6 or 5) or, for the Landmine, "Boom! The
Landmine got Coffee Commandos." (the losing team); the whole map: turned-over cells as before, face-down cells now in their
kind's colour and icon at 50% opacity (accessible name "Kite, teal team, not found"); then the parts and buttons of SWD-112 in
its order (`near-miss`, `best-clue`, tally, `next-clue-givers` with "Swap", "Change players, phones or board", "End for
tonight", "← Home", main "Play again"). The page may scroll as one, main fixed. Wake lock released. Narrow portrait: the
sideways line instead of the board.

### SWD-052 Tally
"Tonight: Chai Champions 2 · Coffee Commandos 1" (won games only); "Tonight: Chai Champions 0 · Coffee Commandos 0" before any.

### SWD-053 Play again
Same teams and choices; the clue givers shown in `next-clue-givers` (SWD-007's suggestion, without a partner, unless changed
by "Swap", SWD-112); a new deal (SWD-024); then the scan screen or the new starting team's pass screen.

### SWD-054 End the game
Menu "End the game" (scan, pass, clue, guessing, end-turn line, turn over) → dialog "End this game with no winner?" → "End the
game": game over with heading "Game ended. No winner.", no result line, the whole map as SWD-051, tally unchanged, the parts
and buttons of SWD-112 (`best-clue` by SWD-128; no `near-miss`), and a 10 s `undo-toast` "Game ended · Undo". `endGame` is
recorded when the toast expires (t = 10 s from the dialog's "End the game"), or earlier at the first of: a tap that leaves the
game over screen ("Play again", "Change players, phones or board", "End for tonight", "← Home", or the menu's "How to play",
"Settings" or "History"), a reload, or the app being hidden; the toast is then removed. "Undo" within the 10 s records nothing
and returns to the step the menu was opened from, as it was (the timer stays removed). Taps on "Swap" or the menu's "Players"
don't leave the screen. Once recorded, the game counts for SWD-007 and History. `canUndo` stays false: the Undo is screen state,
not a move.

### SWD-055 New board
Menu "New board" (any step from the first deal until game over) and the private map's "Someone saw the map" (SWD-113) → dialog
→ "New board": a new deal with the same teams, clue givers and choices; the starting team drawn anew; turn numbers restart;
tips don't show again; the timer stops; clue-giver counts unchanged. Then the scan screen or the new starting team's pass screen.

### SWD-056 (retired)
Retired in version 3.4: replaced by SWD-112 ("Change players, phones or board").

---

## 06 The evening → `specs/secret-words/06-evening.md` (saved data C3)

### SWD-060 End of the evening
"End for tonight" (game over button, or menu) → dialog → "End for tonight": the summary shows what SWD-128 lists, with quiet
"Oops, keep playing", quiet "← Home" and main "Play something else" (the picker, tonight's names kept). **Nothing is recorded
until the summary is left**: by "← Home", "Play something else", a reload, the app being hidden, or SWD-063; then `endGame` (if a
game was in progress, it is ended early) and `endEvening` are recorded. "Oops, keep playing" (only until they are recorded)
returns to the step the host came from, as it was, and records nothing. After a reload or the app being hidden, the summary
shows without "Oops, keep playing". Once `endEvening` is recorded the game night never reopens; a game night with no game at
all is then deleted, otherwise it stays in History.

### SWD-061 (retired)
Retired in version 3.4: replaced by SWD-127.

### SWD-062 Leaving and resuming
Every move is saved. Home's unfinished row and the picker's resume card (SWD-115) return to the same step (SWD-048).

### SWD-063 The 12-hour limit
When the app opens or Home shows, an evening whose last move is more than 12 hours old ends: `endGame` (if a game was in
progress) and `endEvening`, both at the last move + 12 hours. No summary shows. A pending "Game ended" (SWD-054) or summary
(SWD-060) is recorded the same way.

### SWD-064 History
Evening row "Secret Words · 3 games" (won and ended early). Game rows: "Game 2 · Chai Champions won · Riya and Arjun gave clues"; Landmine: "Game
2 · Chai Champions won (Landmine) · Riya and Arjun gave clues"; "Game 3 · Ended early · Meena and Kabir gave clues"
(credited clue givers, the orange team's first; a pair "Nana + Aarav and Kabir gave clues"; names as renamed, SWD-127).
Tapping a game row opens its board with the whole map and the line `history-clues` "Clues: Chai Champions CRICKET 2 · Coffee
Commandos 1 · Chai Champions RAIN ∞" (every clue in force, oldest first; a clue without a word shows its number alone) ("←
Back" to the evening).

### SWD-065 Delete tonight's games
Summary menu "Delete tonight's games" → dialog → "Delete": the evening is deleted and Home opens. No undo.

### SWD-066 Saved choices (detail of SWD-009)
`pgn.pref.secretWords.lastChoices` = `{ map, board, landmine, words }`, written at each deal. Unreadable or missing → the
first-time state; a missing `landmine` alone → SWD-119's default.

### SWD-067 Start new (detail of SWD-001)
"Start new (ends that one)" (SWD-115) records `endGame` (if a game was in progress) and `endEvening` for the old evening, then
opens "Who's playing?" for a new evening. No summary shows.

---

## 07 Sessions and behaviour (version 3.3) → `specs/secret-words/07-sessions.md` (C2; SWD-118, 123, 125, 127, 129 C3)
Binding. Version 3.4 edited every earlier scenario these change, so the two agree. Sources: W1–W20, E1–E25, B1–B12; decisions
K32–K41.

### SWD-110 Pause (E1)
Menu "Pause" at the preview, scan screen, pass screen, clue screen, guessing, end-turn line and turn over (not at game over,
not on the private map, which has its own exits, SWD-113). It opens `pause-cover`, `role="dialog"` covering the screen, named
"Paused" by its heading "Paused"; line "Tap Carry on when everyone's back."; main "Carry on". While paused: the screen-on lock
is released (re-acquired on "Carry on" where the step holds it); a running timer shows "Paused" and stays so until "Start
90-second timer" is tapped (SWD-047); on the scan screen the QR is removed from the DOM. "Carry on" returns to the same step
(it does not restart SWD-114's guards). Nothing is recorded. A reload while paused returns to the step with the cover shown
(SWD-048).

### SWD-111 Home during a game (E1, W2)
At game over, quiet "← Home" (SWD-112) opens Home. At every other game step from the preview to turn over, the menu item "Home
(keep this game)" opens Home at once (no dialog). The game stays unfinished and resumes from Home's row or the picker's resume
card (SWD-115) at the same step. Phone Back still does nothing during a game.

### SWD-112 Game over: what next (W2, W4, E13, B4, B8)
Game over shows, in this order: heading and line (SWD-051, SWD-054); the board (SWD-051); `near-miss` and `best-clue` (SWD-128); the tally;
`next-clue-givers` "Next clue givers: Meena and Kabir" (SWD-007's suggestion, the orange team's first; a pair "Next clue
givers: Nana + Aarav and Kabir") with quiet "Swap"; quiet "Change players, phones or board"; quiet "End for tonight"; quiet "←
Home"; main "Play again".
- **"Swap"** opens the Clue givers sheet (SWD-007, 014, 123) for the next game; "Done" updates `next-clue-givers`. Nothing is
  recorded until "Play again": switch changes then record `setTeams`, clue-giver and partner changes `setClueGivers`.
- **"Change players, phones or board"** opens Who's playing? with tonight's names, whose "← Back" reads "← Back to the game"
  and returns to game over; then Make teams (SWD-004, without "New team names") and Choices, with their normal "← Back".
  Nothing changes until "Start the game" (no read-aloud), which records the changes and deals (tap → move table).
- **"End for tonight"**: SWD-060. **"← Home"**: SWD-111. **"Play again"**: SWD-053.

`next-clue-givers` counts a game ended by "End the game" as ended early from the moment game over shows; it does not
change when `endGame` is recorded, and "Undo" discards it. Team bar at game over: the winning team's bar; ended early: no team
bar.
### SWD-113 The private map: wrong person and someone looking (E6, E8, E5)
Before the first show, the private map has quiet "Not Riya? Go back" (pair "Not Nana and Aarav? Go back"): it returns to the
pass screen (without "Welcome back."); nothing recorded. While the map shows: quiet "Someone saw the map" removes the map from
the DOM and opens the New board dialog (SWD-055); "Keep playing" returns to the private map with the map hidden (pad "Tap to see
the map"); "New board" deals. "I'm Riya" ignores taps for 1 s after the pass screen appears (SWD-114).

### SWD-114 Taps right after a screen appears (E7, W11, K35)
Every main button ignores taps for 800 ms after its screen appears (Terms: Screen mounts; a reload mounts; closing a dialog,
"Carry on" and "Welcome back." don't restart it), in addition to SWD-049. Exceptions, which win over the 800 ms: "I'm Riya" /
"We're Nana and Aarav" ignores taps for 1 s; "Other team's turn" after a turn-ending reveal ignores taps for 1.5 s counted from
t = 300 ms (the word shown turned over, SWD-043). Quiet buttons are not affected.

### SWD-115 Home rows, Start new and next day (E18, K37)
- **Unfinished row** (in `unfinished-games`): "Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1" (the game
  night's start, phone's local time, "pm" lower case, no leading zero; score = the tally, orange first; "0–0" before any won
  game) and "Tap to resume". **Picker resume card** `resume-card`: "Secret Words · Chai Champions v Coffee Commandos · 2–1 · Tap
  to resume".
- **Start new** (tapping the Secret Words picker card with an unfinished game night): dialog `role="dialog"` named "Start a new
  game night?", heading "Start a new game night?" and paragraph "The one from 8:40 pm (Chai Champions v Coffee Commandos, 2–1) will end.", with
  two equal quiet buttons in this order "Carry on that one", "Start new (ends that one)" and no main (Terms: Dialog exception).
  Shown once per tap of the card. "Start new (ends that one)": SWD-067.
- **Next day:** `last-night` "Last game night: Chai Champions 2 · Coffee Commandos 1" with button "Play again with these teams",
  for the most recent ended (recorded `endEvening`), not deleted Secret Words game night with at least 1 game, while now − its
  `endEvening` time < 129 600 000 ms (36 h); shown under the unfinished rows; only the newest one. The button (after the Start
  new dialog first, if a game night is unfinished) opens Make teams with the same players, teams, team names (reused, no "New
  team names"; overrides SWD-013's draw) and "Doesn't give clues" switches; Make teams' "← Back" → Who's playing? with those
  names; then Choices as SWD-009 ("Same as last time"); "Start the game" starts a new game night with its own tally.
- Home's own menu gains "History" (SWD-064).

### SWD-116 Board check by words (W1)
The map phone shows `first-words` "First words: Cricket · Bat · Monsoon" (the words of cells 0, 1, 2). The host's scan screen
shows `board-check`, the first wording that applies (example words of the next board: Kite · Tiffin · Rain):
1. The evening's first deal, or the first deal after "How many phones?" changed (SWD-112): two phones "The map phone should start with: Cricket · Bat · Monsoon"; three phones "The map
   phones should start with: Cricket · Bat · Monsoon".
2. A deal with a new deck (SWD-024): two phones "New code: scan again. The map phone should start with: Kite · Tiffin · Rain";
   three phones "New code: scan again. The map phones should start with: Kite · Tiffin · Rain".
3. The next deal of the same deck, clue givers (with partners) different from the previous deal's: two phones "Hand the map
   phone to Meena and Kabir, tap Next map, and check it starts with: Kite · Tiffin · Rain"; three phones "Meena and Kabir: tap
   Next map on your phones and check they start with: Kite · Tiffin · Rain" (names = this deal's clue givers, orange first; a
   pair "Nana + Aarav").
4. The same, clue givers unchanged: two phones "Tap Next map on the map phone and check it starts with: Kite · Tiffin · Rain";
   three phones "Tap Next map on both map phones and check they start with: Kite · Tiffin · Rain".
The "Show the map code again" screen (SWD-129) shows wording 1's form with the current board's words. Next map's toast: "Next
map. It should start with: Kite · Tiffin · Rain." (SWD-039).

### SWD-117 Team names on the map phone (W5, C3 for the QR format)
The scan QR is `<origin><BASE_URL>#map=27P3QX8&t=SWDT-01` (`t` = the game night's pair id, `team-names.csv` column `id`). A map
phone opened from it saves `t` (SWD-036; kept by "Next map"; the Join scanner, SWD-133, reads it too) and shows under the heading
`map-teams` "Chai Champions (orange) · Coffee Commandos (teal)" and `map-code-line` "Code 27P-3QX8 · Chai Champions start" (the
starting team's name). A typed code, or an unknown `t` (ignored), shows no `map-teams` and "Code 27P-3QX8 · Orange team starts"
("Teal team starts"). Team icons stay SVG (Terms); no "●" or "◆" characters.

### SWD-118 Clue numbers explained (W6, C3 for the moves' view)
Under the keys, `clue-help` "2 means up to 3 guesses. 0 or ∞: as many as you like."; the ∞ key shows "∞" over the small word
"many". The board shows `clue-line` (22 px, weight 700, 1 line, not grown by Larger text; shrinks in 1 px steps to 17 px, SWD-041)
with a word "CRICKET · 2" (DOM "Cricket · 2", the word as typed, upper case by CSS; ∞ "CRICKET · ∞"), with no word "Clue: 2" ("Clue:
0", "Clue: ∞"); and under it, as one block, `guess-line` (15 px, 19 px with Larger text, 1 line): "3 guesses left (2 + 1
extra)" (clue 1: "2 guesses left (1 + 1 extra)"; clue 9: "10 guesses left (9 + 1 extra)") before the turn's first reveal, then
"2 guesses left", "1 guess left"; for 0 and ∞ "Guess as many as you like".

### SWD-119 Setup words (W7, W15)
On Choices, `start-hint` "Pick how many phones to start." (small line) shows directly **above** the main "Start the game" while
it is disabled. With 9 or more players, `big-group-hint` "Big group? The Easy board is easier to read." (small line) shows under
the Board group. The Landmine choice: a saved `lastChoices.landmine` wins; with none, K33's default: "Lose your turn" with Whole
family, "Lose the game" with + Harder words, updated whenever Words changes until the host taps a Landmine option in this setup.

### SWD-120 Map phone kindness (W12, W17, B10)
The map phone's small line reads "Optional: tap a word once it's found to fade it; tap again to undo. The board in the middle
is always right." While the map shows, three quiet buttons "Orange list" / "Teal list" / "Whole map": a list replaces the grid
with `map-list`: h2 "Orange words (6)" / "Teal words (5)" (that colour's words not faded on this phone, the count in brackets),
each word an `li` at 24 px (28 px with Larger text) in `data-index` order, then `avoid-line` "Landmine word: Shadow" (none on
Easy); words in a list can't be tapped to fade; "Whole map" returns to the grid. It always shows `map-end-line` "Game over? Tap
Done with this game, or Next map for the next one." The map hides by SWD-121.

### SWD-121 Maps hide after 60 seconds (K36)
On the private map and the map phone, the clock starts when the map is shown (a tap on the pad, any opening of the map phone (scan, link, typed code, Home's saved map), "Next
map", "Show map", "See the map again", SWD-037) and restarts on each `pointerdown` on that screen. From 50 000 ms,
`hide-warning` (`role="status"`) "Still looking? Tap to keep the map" shows over the map; while it shows, the first
`pointerdown` only restarts the clock (it doesn't press a button or fade a cell) and removes the warning. At 60 000 ms the map
is removed from the DOM: the private map shows the pad "Tap to see the map"; the map phone shows "Show map" and releases the
screen-on lock.

### SWD-122 The picker (B1, B11, K38)
Each guessing turn has a **picker**. `guessers` = the team's current players minus this game's clue giver and partner, in team
list order, taken when the turn's `clue` is recorded (later player changes don't affect this turn). Picker = `guessers[r mod
guessers.length]`, r = that team's earlier guessing turns on this board (a turn counts once its `clue` is recorded, even if a
dispute ended it before any guess); r restarts at each deal. The room view carries `picker: string | null` (computed; null
outside guessing). Menu "Pass the pick" (guessing; hidden when the team has 1 guesser) opens dialog "Who picks this turn?" with
one button per guesser (`aria-pressed` on the current picker) and quiet "Cancel"; a name sets the picker for this turn only (UI
state `pickerOverride`, SWD-048) and closes; rotation is unaffected. `turn-line` stays "Chai Champions guessing" (no picker in
it). The main reads "Sunita: Reveal" (disabled, no pick) / "Sunita: Reveal LAMP" (DOM "Sunita: Reveal Lamp"); in portrait its
text may shrink in 1 px steps to 17 px and wrap onto 2 lines. In the landscape panels (200 px and 160 px) the name is on line 1
(a name longer than 12 characters shows its first 12 then "…"; `aria-label` holds the full text) and "Reveal LAMP" on line 2,
font shrinking to fit, floor 15 px. The evening's first guessing turn shows the tip "Tap a word to suggest it. Sunita taps
Reveal." Anyone may still tap; the name is a social cue, never enforced.

A renamed picker's new name shows at once; a removed picker stays this turn's picker (the name still shows) until the turn
ends; "Pass the pick" lists only current players.
### SWD-123 Pairs of clue givers (B2, K39, C3)
`Teams` gains `partners: { orange: string | null; teal: string | null }`, carried by `setClueGivers`. In the Clue givers sheet
each team has quiet "Add a partner": it shows a group "Chai Champions partner" with one button per eligible player of that team
other than the clue giver (`aria-pressed`, none pressed) and the button then reads "Remove partner" (clears it). A partner must
be eligible, and the team must keep at least 1 guesser: a button that would leave none is disabled. The clue giver's button is
disabled in the partner group and the partner's in the clue-giver group. Applies on "Done". Pairs are per game: Play again's
suggestion (SWD-007) has no partner; "Swap" (SWD-112) can add one. Both partners are credited (SWD-007 counts the game for each)
and neither is a guesser or picker that game. Pair strings (each replaces the single name):

| Where | Pair text |
|---|---|
| Pass screen | "Pass the phone to" then `pass-name` "NANA +" / "AARAV" (two lines, SWD-030); "Clue givers for Chai Champions (orange)"; main "We're Nana and Aarav" |
| Private map | heading "Nana + Aarav"; "Not Nana and Aarav? Go back" |
| Clue screen | `clue-prompt` "Nana and Aarav, say your clue out loud. How many words is it for?" |
| Result line | "✓ Nana and Aarav's clue works! 2 guesses left." (and the other endings of SWD-043) |
| Poker line | "Nana + Aarav: poker face, no hints!" |
| Waiting line | "Coffee Commandos: guess how many Nana and Aarav will say!" |
| Scan screen, "Show the map to", board check | "Nana + Aarav" (sheet button "Nana + Aarav (Chai Champions)") |
| Game over | "Next clue givers: Nana + Aarav and Kabir" |
| History | "Nana + Aarav and Kabir gave clues" |
| Summary credits | each name on its own: "Clues tonight from Riya, Nana and Aarav" |

Either partner removed mid-game (SWD-127) leaves the other as the clue giver, with no dialog.

### SWD-124 Disputes (B3, K40)
"Clue not allowed?" (board button and menu, SWD-046's window) opens the dialog "Clue not allowed? Both clue givers decide
together." with stacked full-width 48 px buttons in this order: quiet "Try another clue" (opens the clue screen as "Change
clue" does, with "Keep my clue", which returns to guessing; confirming records a new `clue` that replaces the old); quiet "Turn
ends, they get a word" (records `brokeRule`, SWD-046); quiet "Clue rules" (opens How to play scrolled to h2 "Clue rules"; its
"Done" returns to this dialog); main "Let it go" (closes; nothing recorded). Closing the dialog any other way is "Let it go".

### SWD-125 Credit people, blame the board (B5, B6)
- Own word: "✓ Riya's clue works! 2 guesses left." (pairs: "✓ Nana and Aarav's clue works! …"); every other result line names no
  person (SWD-043).
- Poker line: `turn-line` reads "Riya: poker face, no hints!" (pair "Nana + Aarav: poker face, no hints!") for 3 000 ms from the
  guessing screen mounting after a confirmed clue (also after "Change clue" or "Try another clue"), then "Chai Champions guessing".
  Not after a reload or "Carry on"; not announced (SWD-095). Tests wait 3 s before checking `turn-line`'s "guessing" text.
- The Landmine (Lose the game): heading "Chai Champions win!", line "Boom! The Landmine got Coffee Commandos."; (Lose your turn)
  "Boom! The Landmine! Your turn is over, and the other team gets one word free.".
- Nothing ever names who tapped a wrong word.

### SWD-126 A job for the waiting team (B7)
On the pass screen (one phone) and the clue screen (two or three phones), `waiting-line` (small line) "Coffee Commandos: guess
how many Riya will say!" (the team not giving the clue; the clue giver's name, or "Nana and Aarav"). Hide orders: SWD-030, 040.

### SWD-127 Players during a game (E2, E3, E4, E16, B12, C3)
Menu "Players" opens the sheet "Players": an h2 per team ("Chai Champions" / "Coffee Commandos"), its players in list order,
then the adding row; main "Done" closes. Every confirmed change records one `setPlayers { players, teams, renames? }`
(`renames`: old → new; History credits, the tally and `guessOnly` follow); the picker of a turn already under way is unaffected
(SWD-122).
- **Rename:** tap the name (button, accessible name "Rename Kabir") → an input labelled "Player name" holding the name, with
  quiet "Done"; Enter or "Done" saves (team, place and counts kept; Impostor's duplicate message for a name already playing, and
  an empty name keeps the old one). No Undo.
- **Move** (guessers only; at every step whose menu has "Players"): quiet "Move to Coffee Commandos" (accessible name "Move Zoya to
  Coffee Commandos") moves the player to the end of the other team with the toast "Zoya moved to Coffee Commandos · Undo" (Undo
  restores as before, recording another `setPlayers`). Disabled when the team would be left with fewer than 2 players or with no
  guesser.
- **Add:** input labelled "Player name" (placeholder "Type a name…"), switch "Doesn't give clues", buttons "Add to Chai
  Champions" / "Add to Coffee Commandos" (disabled while the input is empty); the player joins the end of that team as a
  guesser from now on; toast "Neha joined Chai Champions" (no Undo). Impostor's duplicate message; "20 players is the most."
- **Remove a guesser** ("✕", accessible name "Remove Kabir"): toast "Kabir left · Undo" (Undo puts them back in place). If the
  team then has a partner and no guesser, the partner becomes a guesser in the same change.
- **Remove a clue giver** (with no partner): dialog "Who gives clues for Coffee Commandos now?" with the team's other eligible
  players (the next eligible in list order, wrapping, pre-selected; `aria-pressed`) and main "Done"; closing without "Done"
  cancels the removal. On "Done": the toast "Kabir left · Undo". One phone: the new clue giver takes the team's next pass; if
  their team is on its pass or clue step, the pass screen restarts for them; once guessing has started, the turn carries on. Two
  or three phones: they use "Show the map code again" (SWD-129). Removing one of a pair: SWD-123.
- **A team is never left with 1 player.** A removal that would do so opens "Kabir leaves Coffee Commandos with only Om. Move
  someone over?" with a button "Move Zoya over" per guesser of the other team whose team would keep at least 2 players (and a
  guesser), and main "Keep Kabir" (cancels). "Move Zoya over" removes Kabir and moves Zoya in one change (if Kabir gave clues, the
  clue-giver dialog follows first, and "Done" confirms the whole change). If no one can move: the line "No one can move over."
  with main "Keep Kabir" and quiet "End the game" (opens SWD-054's dialog; Kabir stays; absent at game over).
- "Remove" is disabled for a team's last eligible player (SWD-014).

### SWD-128 Endings (B8)
**Found** is defined in Terms. Game over (SWD-112):
- `near-miss`, only after a won game (any board, a Landmine loss included), when the losing team had 1 or 2 words left:
  "Coffee Commandos were 1 word away!" / "Coffee Commandos were 2 words away!"; otherwise absent.
- `best-clue`, after won and ended-early games: among both teams' clues in force of this game that have a word and found at
  least 2, the one with the most found, the earliest on a tie: "Best clue: MONSOON 2 · all 2 found" when found equals its number
  (1–9), otherwise "Best clue: MONSOON 2 · 3 found"; 0 and ∞: "Best clue: RAIN ∞ · 4 found" / "Best clue: RAIN 0 · 4 found";
  absent when none qualifies. The room view's clues carry `found`.
Summary (SWD-060), in order: heading "Tonight's Secret Words"; `summary-line` "6 players · 3 games · 31 words found" (players =
everyone who played at least 1 game this game night; games = won and ended early; words = found words summed over the game
night's turns; singular "1 game", "1 word found"); the tally; `clue-credit` "Clues tonight from Riya, Nana and Zoya" (every
credited clue giver, partners included, in order of first credit; "Clues tonight from Riya" / "Clues tonight from Riya and
Nana"; absent if none); quiet "Oops, keep playing" (until recorded, SWD-060); quiet "← Home"; main "Play something else". No
Landmine count, no ranking of clue givers.

A game in progress when "End for tonight" was tapped counts as ended early in `summary-line` (players, games, words found)
and `clue-credit`, although it is recorded only when the summary is left.
### SWD-129 Map code again (E9)
With two or three phones, menu "Show the map code again" at the clue screen, guessing, end-turn line and turn over: the scan
screen for the current board (no new deal; QR and `map-code-text` as SWD-033, `board-check` as SWD-116, no `dnd-tip`), with
"Everyone else: look away from their phones.", no menu, and main "Back to the game", which returns to the step. Nothing is
recorded.

### SWD-130 Fair shuffles (B9)
A team draw (the first split, SWD-004, and "Shuffle teams", SWD-006) is accepted when its two teams' counts of "Doesn't give
clues" players differ by at most 1, it doesn't put the same set of names in each team as now (shuffles only), and, from game 2,
its two teams are not last game's two teams (compared as sets, colours ignored); otherwise the next k draws, at most 10 draws in
all, keeping the 10th.

### SWD-131 Clue rules box (K34)
How to play has h2 "Clue rules" after "The rules" and before `credit`, an `ol` of 4: 1 "One word only. Names like Taj Mahal
count as one." 2 "About meaning: no spelling, no rhymes, no 'top left'." 3 "Not a word on the board, or part of one." 4
"English, or a word you'd use in English (chai, dosa)." The dispute dialog's "Clue rules" (SWD-124) opens How to play scrolled
to it.

### SWD-132 Settings and names (E17, E19)
Settings save every change at once (no Save button). In "Who's playing?" every Enter adds its name and keeps the field focused; 7
names typed quickly with Enter give 7 rows.

### SWD-133 Join scanner (W18)
The Join screen's scanner is labelled "Scan a ticket or secret map" (replacing Tambola's scan label there) and also reads map
QRs, opening the map phone with `t` (SWD-117). Rule 11: this rewords PLT-300 and the Tambola join scenarios that quote the scan
label.

---

## 09 Usability → `specs/secret-words/09-usability.md` (C1/C2)

### SWD-090 Board text and portrait layout
Portrait board: 8 px side margins, 4 px gaps; cells (width − 16 − gaps) / columns wide (Full at 360: 65.6 px; at 390: 71.6
px). Cell height 56 px, shrinking to no less than 48 px so the page doesn't scroll. One font size for all words of a board:
the largest whole px from 22 down to 12 at which every word fits in 1 line within its cell minus 4 px padding each side.
Larger text doesn't change it. Status lines and the full height budget: SWD-041. No page scrolling at 390 × 844 (Larger text off and on) and 360 × 640
(Larger text off), within SWD-041's longest content. The map phone may scroll (SWD-034).

### SWD-091 Landscape board
812 × 375: grid at the left (margins 16 px left and bottom, 8 px under the team bar); a 200 px panel at the right (16 px right
margin, 12 px gap). Panel, top to bottom: `hurry-timer` row (48 px, when running); a row with "↻" (44 × 44) and "··· Menu" (48
px); a middle part that scrolls inside if needed: `turn-line` (at most 2 lines), `clue-line`, `guess-line`, `clue-history`,
counts (two lines), `result-line`, tip; then pinned at the bottom the action slot (until the first reveal "Change clue" and
"Clue not allowed?" stacked, each 200 × 48; then "End our turn" 200 × 48) and the main button (200 × 60) holding 2 lines: the
picker's name and "Reveal LAMP" (SWD-122), font shrinking to fit, floor 15 px. Height: team bar 8 + timer row 48 + button row
48 + middle part ≥ 83 + action slot 96 + main 60 + bottom 16 + 4 gaps of 4 px = 375 (the middle part grows by 48 without the
timer and by 48 after the first reveal). Cells at least 100 × 56 px. 568 × 320: the 48 px action slot stays reserved (empty) until the first reveal; the same with 8 px margins, a 160 px panel
(main 160 × 60, same 2 lines, floor 15 px) and an 8 px gap, and no change row ("Change clue" and "Clue not allowed?" are menu
items, SWD-041/046; the slot holds "End our turn" 160 × 48 from the first reveal); height: team bar 8 + timer row 48 + button
row 48 + middle part ≥ 84 + slot 48 + main 60 + bottom 8 + 4 gaps of 4 px = 320; cells at least 69 × 54 px. No page scrolling.
Cell sizes are measured on the unturned board.

### SWD-092 Narrow portrait
On the board screens, the private map and the map phone, narrow portrait shows `turn-sideways` in place of the grid; the other
parts of the screen stay (on the board, "Sunita: Reveal" stays disabled). Turning to landscape shows the grid. All other screens
work at 320 × 568 portrait.

### SWD-093 Never colour alone
Every turned-over cell and every map cell has its kind's icon and an accessible name: "Kite, orange team" / "Kite, teal
team" / "Kite, blank word" / "Kite, the Landmine" (+ ", found" or ", not found" where SWD-031, SWD-035 and SWD-051 say).

### SWD-094 Targets
Every button at least 44 × 44 px; board cells per SWD-090/091; keys per SWD-040.

### SWD-095 Screen readers
The announcer reads: the clue ("Clue for Chai Champions: 1 word" / "2 words" / "0 words" / "as many as you like"; with a word,
as typed, "Clue for Chai Champions: Cricket, 1 word" / "Cricket, 2 words" / "Cricket, 0 words" / "Cricket, as many as you like";
announced again after "Change clue" or "Try another clue"); each result line; at turn over "Other team's turn"; at game over the
heading then the line ("Chai Champions win! All 9 words found."). It never announces the map, and never the poker line
(SWD-125). Map cells are reachable by name only on map screens.

### SWD-096 Reduce motion
With `prefers-reduced-motion: reduce`: no cell turn and no animations (`document.getAnimations().length === 0` on board
screens); everything else the same.

### SWD-097 Sound and vibration
Sounds (Impostor's sound hook, `window.__sounds`): `ding` (own word), `thud` (nobody's, the other team's, a broken-rule
turn), `boom` (the Landmine), `chime` (time's up); peak gains of `thud`, `boom` and `chime` ≤ `ding`'s. Vibration 50 ms on every
reveal, 200 ms on the Landmine. The private map and the map phone make no sound and no vibration.

### SWD-098 One main button
At most one main button per screen, always the next step. (The Start new dialog has none: Terms.)

### SWD-099 Word list check (C3, content)
`content/secret-words/words.json` is built from `words.csv` (`{ id, word, meanings, category, audience, nonveg, edition,
retired_in }[]`). **Checks:** ids unique; words 3–8 letters A–Z, unique ignoring case; every edition's candidates ≤ 775.
**Browser content test** (both browser projects): every word, as word text, fits in 57 px at 12 px (the 360 × 640 cell) and in
63 px at 14 px (the 390 × 844 cell). A failing word is reported to the product owner, who replaces it in a new edition.

---

## Test hooks the build provides
1. **Rule API** in `src/games/secret-words/index.ts` (pure), fitting the engine (`startMatch`, `play`, `replay`, `viewFor`,
   `SavedGame`, `createRng`, `shuffle`):
   ```ts
   type Team = 'orange' | 'teal'; type Kind = Team | 'nobody' | 'landmine';
   interface SecretWordsChoices { map: 'pass' | 'shared' | 'own'; board: 'full' | 'easy'; landmine: 'lose' | 'turn'; words: 'family' | 'grownups' }
   interface Teams { orange: string[]; teal: string[]; clueGivers: { orange: string | null; teal: string | null };
     partners: { orange: string | null; teal: string | null };   // SWD-123
     names: { id: string; orange: string; teal: string }; guessOnly: string[] }
   // SetupInput: { gameId: 'secret-words', seeds: { deal: string, teams: string }, config: { players: string[], teams: Teams,
   //   splits: number, choices: SecretWordsChoices, excludedWords: { recent: string[] /* ids */ }, testBoards?: string[] } }
   type SecretWordsMove =
     | { type: 'deal'; code: string } | { type: 'dealNew'; code: string } | { type: 'mapSeen' }
     | { type: 'clue'; n: 0|1|2|3|4|5|6|7|8|9|'inf'; word?: string } | { type: 'reveal'; cell: number; freeCell?: number }
     | { type: 'endTurn' } | { type: 'brokeRule'; cell: number } | { type: 'nextTurn' } | { type: 'endGame' }
     | { type: 'setTeams'; teams: Teams; splits: number }
     | { type: 'setClueGivers'; clueGivers: Teams['clueGivers']; partners: Teams['partners'] }
     | { type: 'setChoices'; choices: SecretWordsChoices }
     | { type: 'setPlayers'; players: string[]; teams: Teams; renames?: Record<string, string> }   // old → new, SWD-127
     | { type: 'endEvening' };
   boardFromCode(code: string, words: readonly SecretWordsWord[]):
     { words: string[]; kinds: Kind[]; starts: Team; edition: number; board: 'full' | 'easy'; audience: 'family' | 'grownups' }
     | { error: 'invalid' | 'newer' };
   codeFor(cfg: { edition: number; board: 'full' | 'easy'; words: 'family' | 'grownups' }, deck: number, n: number): string; // 7 symbols, no hyphen
   pickDeck(dealSeed: string, k: number, candidates: readonly string[], avoid: ReadonlySet<string>): number;
   penaltyCell(state: SecretWordsState, dealSeed: string): number;
   nextMapCode(code: string, words: readonly SecretWordsWord[]): string | null;   // SWD-039, unchanged in 3.4
   reduceLetters(text: string): string;        // SWD-101 (NFKC, lower case, a–z only)
   parseMapCode(typed: string, words: readonly SecretWordsWord[]): string | 'invalid' | 'newer';   // unchanged in 3.4 (the `t` part of a QR is read by the screen, not here)
   readSecretWordsEvening(saved: SavedGame);
   readTestSeeds(raw: string | null, release: boolean): { deal?: string; teams?: string; boards?: string[] } | null;
   ```
   Views: room → `{ cells: { word: string; kind?: Kind }[]` (kind only when turned over, or for every cell after game over)`,
   clueWord: string | null, clues: { team: Team; n: number | 'inf'; word?: string; found: number }[]` (in force, this game;
   `found` per Terms)`, lastTurn: { team: Team; found: number; ended: 'rule' | 'stopped' | 'allowance' | 'nobody' | 'other' |
   'landmine'; cell?: number } | null, turn: Team, clue: number | 'inf' | null, guessesLeft: number | 'unlimited' | null, left:
   { orange: number; teal: number }, picker: string | null` (SWD-122, computed)`, step, winner: Team | null, endedEarly: boolean }`;
   `{ kind: 'player', playerId }` → the map only for a current clue giver or partner, otherwise the room view. `isOver` is true
   after `endEvening`. `clue` is a detail move (`detailMoves: ['clue', …]`, free-text word); `canUndo` is always false (the
   "Game ended · Undo" toast is screen state, SWD-054); `forReport` blanks clue words (they may contain names).
   **Tap → move** (a tap not listed records nothing):

   | Tap | Records |
   |---|---|
   | Setup screens, team moves, Shuffle, "New team names", Undo on teams, the "Doesn't give clues" switch and partner buttons (until the sheet's "Done"), choice cards, "Start", "Both have the map", "The map phone is ready", "I'm Riya" / "We're Nana and Aarav", "Not Riya? Go back", pad taps, number keys, the clue word, picks, "End our turn", "Oops, keep guessing", "Start 90-second timer", "Stop timer", How to play, "Clue rules", "Pause", "Carry on", "Home (keep this game)", "← Home" (except as below), Show the map to a clue giver, "Show the map code again", "Back to the game", "Our words", "Whole map", "See the map again", "Back to my clue", "Change clue" and "Try another clue" (until confirmed), "Keep my clue", "Clue not allowed?" (opens the dialog), "Let it go", "Pass the pick" and its dialog, "↻", Earlier clues, "Someone saw the map" (opens the dialog), "Undo" on "Game ended · Undo", "Oops, keep playing", "Swap" and its sheet's "Done", "Change players, phones or board" (until "Start the game"), "Play again with these teams" (until "Start the game"), "Keep Kabir", the map phone's "Next map", "Orange list", "Teal list", "Whole map", "Hide map", "Show map", fades | nothing |
   | "Let's play" / "Show me the board first" / "Start the game" (new evening, also after "Play again with these teams") | evening created, then `deal` |
   | "I have my clue" | `mapSeen` (once per turn) |
   | "Clue for N: start guessing" (also after "Change clue" or "Try another clue") | `clue {n, word}` |
   | "Sunita: Reveal <WORD>" | `reveal {cell}` |
   | end-turn line's "Other team's turn" | `endTurn`, then `nextTurn` |
   | turn-over "Other team's turn" | `nextTurn` |
   | "Turn ends, they get a word" | `brokeRule {cell}` |
   | "End the game" (dialog) | `endGame` when the "Game ended · Undo" toast expires, or at a tap that leaves game over, a reload or the app being hidden (SWD-054); nothing if "Undo" is tapped first |
   | "New board" (dialog, also from "Someone saw the map") | `dealNew {code}` |
   | "Play again" | `setTeams` (if "Swap" changed a switch), `setClueGivers` (if the clue givers or partners differ from the last game's), then `deal` |
   | "Change players, phones or board" → … → "Start the game" | `setPlayers` (if names changed), `setTeams` (if changed), `setClueGivers` (if changed), `setChoices` (if changed), then `deal` |
   | Players sheet: rename, move, add, remove (after its dialog's "Done" or "Move Zoya over" where one opens), or a toast's "Undo" | `setPlayers` each |
   | "End for tonight" (dialog) | nothing until the summary is left; then `endGame` (if mid-game) and `endEvening` |
   | Leaving the summary ("← Home", "Play something else", reload, app hidden, SWD-063) | `endGame` (if mid-game), then `endEvening` (once) |
   | "Start new (ends that one)" | `endGame` (if mid-game), then `endEvening` |
   | "Delete" (Delete tonight's games) | the SavedGame is deleted |
2. **Seeds** from `localStorage['pgn.test.seeds']` in development and preview builds only (as Impostor):
   `{ "deal": "<seed>", "teams": "<seed>", "boards": ["27P3QX8", …] }`. `teams` is read on first entering Make teams for a
   new evening; `deal` and `boards` at evening creation. `boards[i]` is used for deal i + 1 and bypasses SWD-024; a code whose
   config doesn't match the choices is a test error. Without seeds: fresh random seeds per evening.
3. **Pointer input, clock** (60 000 ms map hide and 50 000 ms warning, SWD-121; 3 000 ms poker line, SWD-125; 10 s "Game ended ·
   Undo", SWD-054; 36 h last game night, SWD-115; 1 s "I'm Riya", 800 ms main-button and double-tap ignore, 1.5 s "Other team's
   turn" from t = 300 ms, SWD-049, 114; 500 ms double tap and pad taps; 300 ms turn; 90 s timer; toasts; 6 h saved map; 12 h
   limit), **visibility, wake lock, vibration, sounds**: as Impostor's hooks 4–8.
4. **Test ids:** `main-button`, `resume-card`, `unfinished-games`, `last-night`, `team-bar`, `turn-heading`, `pass-name`,
   `hold-pad`, `privacy-cover`, `pause-cover`, `word-board`, `board-cell` (`data-index`), `map-grid`, `map-cell` (`data-index`),
   `map-qr`, `map-code-text`, `map-code-line`, `map-teams`, `first-words`, `map-list`, `map-end-line`, `hide-warning`,
   `board-check`, `clue-prompt`, `clue-key`, `clue-help`, `clue-word`, `clue-warning`, `word-counts`, `turn-line`, `clue-line`,
   `guess-line`, `clue-history`, `tip`, `result-line`, `recap-line`, `waiting-line`, `dnd-tip`, `hurry-timer`, `game-heading`,
   `near-miss`, `best-clue`, `next-clue-givers`, `summary-line`, `clue-credit`, `tally`, `our-words`, `avoid-line`,
   `recommended`, `start-hint`, `big-group-hint`, `guess-only-tag`, `clue-giver-badge`, `history-clues`, `saved-map`,
   `turn-sideways`, `credit`, `history-game`, `history-round`, `announcer`, `undo-toast`, `toast` (`word-board` and `map-grid`
   carry `data-angle`; `hold-pad` is named by its visible text). Retired: `fun-line`.
5. **QR reading in tests** needs a QR decoder in the test tools (for example jsQR): a tooling request from the tester.

---

## Secret Words later (direction, built later)
- **SWD-200** 2–3 players together against the phone (the official co-op variant); the owner's call on 4 October: a future extension.
- **SWD-201** Picture boards for children who can't read.
- **SWD-202** Regional word themes; each player's own script on the map phone.
- **SWD-203** Board on the TV.
- **SWD-204** "My pick" on guessers' phones (connected mode).
- **SWD-205** "Board on your phone": any guest scans a board QR (words only, no map; its own format, C3) and sees the words large
  on their own phone, tapping to fade them (`play-modes.md` §4).
- **SWD-206** Connected Secret Words (Version D): a phone per team showing the live board, guessing from your seat, "my pick"
  votes; needs internet and a small free relay; with connected mode (Phase 6), if the play-test shows families want it.
