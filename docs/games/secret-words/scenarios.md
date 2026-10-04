# Secret Words: scenarios (version 3, 4 October 2026)

Status: **version 3.2, draft.** Version 2 (SWD-001 to SWD-099) was approved by the owner on 4 October; version 3 applies the
owner's decisions P1–P9 of 4 October (`play-modes.md`) and "Join a game", and version 3.1 resolves the two-reader check of version 3 (4 October); it waits for the owner's approval.
SWD-200+ are direction, built later. Decisions K1–K18 decided by the owner (4 October, "follow the
recommendation"). Version 2 resolves every guess from the two-reader check (`docs/spec-rules.md` rule 12: a coder-reader
and a tester-reader, 4 October). After approval the tester copies these into `specs/secret-words/` (file names in each section
heading) and writes tests. Hand-over follows `docs/roadmap.md`: after Impostor's release.

**This file is binding: where `ux.md`, `lifecycle.md` or `guide.md` differ, this file wins.**
Phases: **Secret Words 1** = first release. **Secret Words later** = designed now, built later (SWD-200+).
Change classes (`docs/change-sop.md`): the deal, the map code, the board algorithm, saved evenings and the word list
format = **C3** (tests first: sections 02, 04 rules, 05, 06, SWD-099); screens = C1/C2.

### Version 3.2 (owner, 4 October, K28–K30)
- The danger word is **the Landmine** (was the Ghost): "Coffee Commandos stepped on the Landmine!", "The Landmine went off 1
  time"; icon a landmine; sound `boom`.
- New setup choice **Landmine** (Full board only): **Lose the game** (default, the standard rule) or **Lose your turn** (the turn
  ends and the other team gets one word free) (SWD-009, 043).
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
  `nextMapCode`; `dnd-tip`; History's clue line. Retired: "hold", "tap mode", "60 s", "Both have the map" for two phones.

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
"✗" U+2717; "∞" U+221E; "–" U+2013; apostrophes and inner quotes U+0027.

| Term | Meaning |
|---|---|
| **Screen sizes** | 320 × 568, 360 × 640, 390 × 844 (portrait), 812 × 375 and 568 × 320 (landscape). "Every size" = all five, Larger text off and on. |
| **Narrow portrait** | `innerWidth < 360` and `innerHeight > innerWidth` (320 × 568 in the list). |
| **Landscape main button** | On every Secret Words screen except the board screens, the private map and the map phone: as Impostor, 358 × 60 at the bottom right, 16 px from the right and bottom edges. Board screens: SWD-091. |
| **Team** | The **orange team** and the **teal team**. Each evening gives them a random pair of funny names (SWD-013); in this file the example evening's names are **Chai Champions** (orange) and **Coffee Commandos** (teal), and every string written with them stands for that team's name. Names are written as in the list, never upper case. The orange team is always listed first. |
| **Team bar** | `team-bar`: an 8 px strip in the team colour across the top edge, on the pass screen, the clue screen and the board screens; always with the team's name in words nearby (`turn-heading` or `turn-line`). |
| **Team colour** | `--team-orange` / `--team-teal` (`ux.md` §1); used only for that team's cells and its bar. |
| **Team icon** | Our own SVG shapes: a filled circle (orange team), a filled diamond (teal team), a short dash (nobody), a landmine (the Landmine); `aria-hidden`, 16 × 16 px, top left of a cell, 2 px in. |
| **Kind** | `orange`, `teal`, `nobody` or `landmine`. |
| **Board** | **Full** = 25 words, 5 × 5; **Easy** = 16 words, 4 × 4. Cells in row-major order, `data-index` 0 top left. |
| **Board screens** | The preview board (SWD-012), guessing (SWD-041), the end-turn line (SWD-044), turn over (SWD-045) and the board part of game over (SWD-051). |
| **Word text** | Every board and map word shows exactly as in the list (title case, e.g. "Kite"), in the app's body font stack, weight 600, never transformed. Elsewhere `<WORD>` is the same word upper case by CSS (`text-transform`), DOM text as in the list. |
| **Face down / turned over** | Not yet revealed / revealed. Turned over: fill in the kind's colour, the kind's icon and the word (white text on orange, teal and Landmine in light mode; `--text` on Nobody). |
| **Locked** | Board cells that can't be picked: `aria-disabled="true"`, taps do nothing, **not greyed** (an exception to "disabled"). |
| **The map** | The kind of every word on the board. |
| **Map screens** | The private map (SWD-031), the scan screen (SWD-033) and the map phone (SWD-034). |
| **Room screens** | Every host-phone screen of a game that is not a map screen. Until game over, **no room screen has any information about a face-down word's kind in the page** (SWD-025). |
| **Clue giver** | The one player per team, at any moment, who may see the map. The **credited** clue giver of a game is the team's clue giver when the game ends. |
| **Deal** | Dealing a board: the first deal, "Play again", "Deal a new board", and the deal after "Change teams". The deals of an evening are numbered from 1. |
| **Game** | From a deal to its result. A board replaced by "Deal a new board" is not a game. **Won** games have a winner; **ended early** games ended by "End the game", "End the evening" mid-game, "Start new" or SWD-063. **Game number** N = games so far + 1 while playing; on game over, the finished game's number. |
| **Turn** | From a team's clue screen to its end-turn line or turn over. Turns are numbered per board from 1, both teams together. |
| **Guess** | One confirmed reveal ("Reveal <WORD>"). **Allowance**: clue 1–9 → number + 1; 0 and ∞ → unlimited. |
| **Evening** | One Secret Words saved game (engine `SavedGame`), created at its first deal, holding every game of that evening. It joins the current session (PLT-016) as Impostor's evenings do (IMP-102). |
| **This evening's words** | Every word on any board dealt in this evening, replaced boards included. |
| **Tally** | `tally`: "Tonight: Chai Champions 2 · Coffee Commandos 1": won games of this evening by team (fits in 2 lines). |
| **Map code** | 7 symbols from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 symbols; value = index, `2` = 0), shown `XXX-XXXX` (hyphen in the DOM text). |
| **Map phone** | A phone showing a map opened from a map code. |
| **Board check** | Symbols 2 and 7 of a map code, e.g. "78" for 27P-3QX8. |
| **Quiet button height** | 48 px, as Impostor, everywhere in this file; a label may wrap onto 2 lines (15 px, 19 px with Larger text) only where a scenario says so. |
| **Text matching** | Tests compare DOM text. Text written in CAPITALS here (a name, `<WORD>`, "CRICKET") is DOM text as typed or as in the list, shown upper case by CSS. |
| **Eligible** | A player whose "Guesses only" switch is off (SWD-014). |

Example players, typed in this order: **Riya, Arjun, Meena, Kabir, Zoya, Dev, Om**. Example words (edition 1):
Cricket, Bat, Monsoon, Kite, Tiffin, Mehendi.
Plurals: "1 word" / "2 words"; "1 guess" / "2 guesses"; "1 game" / "2 games"; "1 time" / "2 times".

---

## Canonical strings
| Where | Exact text | Element | ID |
|---|---|---|---|
| Home, under "Host a game" | "Tambola, Impostor or Secret Words on this phone" (list joined with ", " and " or " before the last) | text inside the button | SWD-001 |
| Picker card | "Secret Words" · "Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game" | button, name starts "Secret Words" | SWD-001 |
| Picker resume card | "Secret Words · game 2 · Tap to resume" | `resume-card` | SWD-001 |
| Start new | dialog "Start a new evening? The evening from 8:40 pm will be ended." with "Start new" / "Carry on that evening" (main) | dialog | SWD-001 |
| Home unfinished row | "Secret Words, 8:40 pm, game 2" and "Tap to resume" | inside `unfinished-games` | SWD-062 |
| Home, second card | accessible name starts "Join a game"; title "Join a game"; line "Tambola ticket or Secret Words map from the host" (replaces "Join with my ticket" / "Got a QR or code from the host?") | button | SWD-002 |
| Join screen | heading "Join a game"; in order: Tambola's scan and its button "Type a ticket code" (was "Type the code"); Impostor's line (IMP-002); then "Playing Secret Words? Clue givers: scan the host's map code. Everyone else: just play along!"; quiet "I have a map code" | paragraph; button | SWD-002 |
| Code entry | heading "Type the map code"; label "Map code"; placeholder "27P-3QX8"; main "Open the map"; errors "That code doesn't look right. Check it with the host." · "This map needs a newer version of the app. Open the app once with internet, then try again." | h1; input; main; `role="alert"` | SWD-002 |
| Who's playing? | heading "Who's playing?"; "Add at least 4 players." · "20 players is the most." · Impostor's duplicate message | h1; `role="alert"` | SWD-003 |
| Make teams | heading "Make teams"; h2s "Chai Champions (4)" / "Coffee Commandos (3)", each with its team icon and the small line "Orange team" / "Teal team"; badge "Clue giver"; small line "Tap a name to move it to the other team."; quiet "Shuffle teams", "New team names", "Change clue givers"; main "Next"; alert "Each team needs at least 2 players." | h1; h2; `clue-giver-badge`; small line; buttons; `role="alert"` | SWD-004–008 |
| Team toasts | "Om moved to Coffee Commandos · Undo" · "Teams shuffled · Undo" · "New team names · Undo" | `undo-toast` | SWD-005, 006, 013 |
| Clue givers sheet | dialog "Clue givers"; groups "Chai Champions" / "Coffee Commandos"; one button per player; per player a switch "Guesses only" (accessible name "Riya: guesses only"); alert "Each team needs someone who can give clues."; main "Done" | dialog; `role="group"`; buttons with `aria-pressed`; `role="switch"` | SWD-007, 014 |
| Choices | heading "How do you want to play?"; small line "Same as last time" (carried over); groups "How many phones?", "Board", "Landmine" (Full board only), "Words"; main "Deal the words" | h1; small line; `role="group"` | SWD-009 |
| Phone cards | "One phone" + "Pass it to the clue giver to see the map. About 25 min a game." · "Two phones" + small line "Recommended" (`recommended`, between title and text) + "One more phone, shared by both clue givers. About 15 min a game." · "Three phones" + "One more phone for each clue giver. About 15 min a game." | buttons with `aria-pressed` | SWD-009 |
| Options | "Full: 25 words" / "Easy: 16 words"; "Lose the game" / "Lose your turn"; "Whole family" / "+ Grown-ups" | buttons with `aria-pressed` | SWD-009 |
| Option lines | Full "9 and 8 words to find, 7 nobody's, 1 Landmine." · Easy "6 and 5 words to find, 5 nobody's, no Landmine." · Lose the game "Step on it and your team loses." · Lose your turn "Step on it and your turn ends; the other team gets one word free." · Whole family "Words kids and grandparents know." · + Grown-ups "Adds words kids or elders may not know." | small line under the group | SWD-009 |
| Read this aloud | heading "Read this aloud"; 4 lines (SWD-010); main "Let's play"; quiet "Show me the board first" | h1; `ol` of 4 `li` | SWD-010 |
| How to play | heading "How to play"; h2 "Read this aloud" + the 4 lines; h2 "The rules" + 8 lines (SWD-011); small line `credit` (SWD-011); main "Done" | h1; h2; `ol`; small line | SWD-011 |
| Preview board | `turn-line` "Chai Champions start"; counts; main "Start" | paragraphs; main | SWD-012 |
| Scan screen | heading "Clue givers, scan your map"; two phones: "Riya and Arjun: sit side by side and share one map phone." · three phones: "Riya (Chai Champions, orange) and Arjun (Coffee Commandos, teal): scan on your own phones."; QR; "or type: 27P-3QX8"; `board-check` "Already have the last map open? Tap Next map on it and check it shows 78." or "New code: scan again."; `dnd-tip` (SWD-104); small line "Everyone else: look away from their phones."; main "The map phone is ready" (two) / "Both have the map" (three) | h1; paragraph; `map-qr` (`img`, name "Map code 27P-3QX8"); `map-code-text`; small line; main | SWD-033 |
| Pass screen | heading "Chai Champions, your turn"; "Pass the phone to"; `<NAME>`; "Clue giver for Chai Champions (orange)"; `recap-line` (SWD-103); `dnd-tip` (SWD-104); quiet "Hurry up: 90 s"; main "I'm Riya" | h1 `turn-heading`; paragraph; `pass-name`; paragraph; small lines; button; main | SWD-030 |
| Welcome back | "Welcome back." above the pass screen | paragraph | SWD-032 |
| Private map | heading `<NAME>`; small line "You give clues for Chai Champions (orange)"; counts; pad "Tap to see the map" / "Tap to hide"; quiet "Our words" / "Whole map"; quiet "↻ Turn" (accessible name "Turn the board"); list `our-words`: h2 "Your words (6 left)" ("(1 left)" for one), each word an `li`, small line `avoid-line` "Avoid: Shadow"; main "I have my clue" (SWD-037: "Done, hide the map"; from "See the map again": "Back to my clue") | h1; small line; `hold-pad`; button; `our-words`; main | SWD-031 |
| Map phone | heading "Secret Words map"; "Code 27P-3QX8 · Check 78 · Orange team starts"; small line "Tap a word once it's turned over, to fade it."; quiet "Hide map" / "Show map"; quiet "Next map"; quiet "Done with this game"; toasts "Next map. Check it shows 8A on the host." · "That was the last map of this deck. Scan the new code." (toasts at the bottom, 16 px up) | h1; `map-code-line`; small line; buttons; `toast` | SWD-034, 039 |
| Map phone dialog | "Clear this map from your phone?" with "Clear map" / "Keep it" (main) | dialog | SWD-036 |
| Map phone toast | "New map. The old one was cleared." | `toast` | SWD-036 |
| Saved map row (Home) | "Secret Words map 27P-3QX8 · Tap to open" (button) · older: "Secret Words map 27P-3QX8" with "Open" / "Clear" | `saved-map` | SWD-036 |
| Clue screen | heading "Chai Champions, your turn"; "Riya, say your clue out loud. How many words is it for?"; keys "0"…"9", "∞"; input labelled "Clue word (optional)" (`clue-word`); `clue-warning` "Cricket is still on the board. Clue rules say: pick another word." (paragraph under the input); counts; tip "One word, one number. No faces, no pointing!"; `recap-line` (two or three phones); quiet "See the map again" (one phone); from "Change clue": quiet "Keep my clue"; quiet "Hurry up: 90 s"; main "Pick a number" (disabled) / "Clue for 2: start guessing" / "Clue for 0: start guessing" / "Clue for ∞: start guessing" | h1 `turn-heading`; paragraph `clue-prompt`; `clue-key` buttons with `aria-pressed`; input; paragraph; `word-counts`; small lines `tip`, `recap-line`; buttons; main | SWD-040, 101 |
| Counts | circle icon "9 left" · diamond icon "8 left" (visible text "9 left · 8 left"; accessible name "Chai Champions: 9 words left. Coffee Commandos: 8 words left."); landscape board panel: two lines | `word-counts` | SWD-040, 043 |
| Board status | `turn-line` "Chai Champions guessing"; `clue-line` with a word "CRICKET · 2 · 3 guesses left" (DOM "Cricket · 2 · 3 guesses left" as typed) / "CRICKET · ∞ · guess as many as you like", without "Clue: 2 · 3 guesses left" / "Clue: 1 · 1 guess left" / "Clue: ∞ · guess as many as you like" / "Clue: 0 · guess as many as you like"; `clue-history` "Earlier: MONSOON 2 · 1 · RAIN ∞"; quiet "Change clue", "Clue broke a rule?"; icon button "↻" (accessible name "Turn the board") | paragraphs; buttons | SWD-041, 102 |
| First-guess tip | "Tap a word, then Reveal. You can take one more than the number." | small line `tip` | SWD-041 |
| Board buttons | quiet "End our turn"; main "Reveal" (disabled) / "Reveal <WORD>" | button; main | SWD-042, 044 |
| Result lines | SWD-043 table; end-turn "Chai Champions ended their turn."; quiet "Oops, keep guessing" | `result-line`; button | SWD-043, 044 |
| Turn-over main | "Other team's turn" | main | SWD-045 |
| Broke a rule | dialog "That clue broke a rule? This turn ends and one of the other team's words is turned over." with "Yes, it broke a rule" / "Cancel" (main); result line "Clue broke a rule. One of the other team's words was turned over." | dialog; `result-line` | SWD-046 |
| Timer | `hurry-timer` "1:30" … "0:01", then "Time's up!", or "Paused"; button / menu item "Hurry up: 90 s" ↔ "Stop timer" | span; button | SWD-047 |
| Recap | "Last turn: Coffee Commandos found 2 words; Train was nobody's." (SWD-103) | `recap-line` | SWD-103 |
| Do Not Disturb tip | "Tip: turn on Do Not Disturb so messages don't pop up on the board." | `dnd-tip` | SWD-104 |
| Earlier clues sheet | dialog "Earlier clues"; one `li` per clue in force of this game, oldest first: "Chai Champions: CRICKET 2" / "Coffee Commandos: 1" / "Chai Champions: RAIN ∞"; main "Done" | dialog | SWD-041 |
| Game over | heading "Chai Champions win!"; line "All 9 words found." / "Coffee Commandos stepped on the Landmine!"; ended early: heading "Game ended. No winner."; tally; main "Play again"; quiet "Change teams", "End the evening" | h1 `game-heading`; `result-line`; `tally`; buttons | SWD-050–054 |
| Deal new | dialog "Deal a new board? This board won't count. Same teams and clue givers." with "Deal a new board" / "Keep playing" (main) | dialog | SWD-055 |
| End game | dialog "End this game with no winner?" with "End the game" / "Keep playing" (main) | dialog | SWD-054 |
| End evening | dialog "End the evening? Tonight's tally stays in History." (mid-game: "End the evening? This game won't count.") with "End the evening" / "Keep playing" (main) | dialog | SWD-060 |
| Summary | heading "Tonight's Secret Words"; tally; fun lines; main "Play something else"; quiet "Back to Home"; menu "Discard this evening" | h1; `tally`; `fun-line` each; buttons | SWD-060, 065 |
| Discard | dialog "Discard this evening? Its games and tally will be lost." with "Discard" / "Keep it" (main) | dialog | SWD-065 |
| Players sheet | dialog "Players"; h2s "Chai Champions" / "Coffee Commandos"; names with "Remove Kabir" (✕); label "Player name", placeholder "Type a name…", button "Add"; main "Done"; toasts "Kabir left · Undo" · "Riya left · Meena is the new clue giver · Undo" | dialog; buttons; input; `undo-toast` | SWD-061 |
| Show the map sheet | dialog "Show the map to"; buttons "Riya (Chai Champions)", "Arjun (Coffee Commandos)"; quiet "Cancel" | dialog | SWD-037 |
| Sideways | "Turn your phone sideways to see the board." | paragraph `turn-sideways` (body text) | SWD-092 |
| History | "Secret Words · 3 games"; "Game 2 · Chai Champions won · Riya and Arjun gave clues"; "Game 2 · Chai Champions won, Coffee Commandos stepped on the Landmine · Riya and Arjun gave clues"; "Game 3 · Ended early · Meena and Kabir gave clues" | `history-game`; `history-round` | SWD-064 |
| Announcements | SWD-095 | `announcer` (`aria-live="polite"`) | SWD-095 |

### Menu ("··· Menu", top right) at each step
Items in this order; **—** = not present; "disabled" = shown and disabled. "← Back" or "Done" from Settings, History and
How to play returns to the same step.

| Step | How to play | Hurry up / Stop timer | That clue broke a rule | Players | Show the map to a clue giver | Deal a new board | End the game | End the evening | Settings | History |
|---|---|---|---|---|---|---|---|---|---|---|
| Who's playing?, Make teams, Choices, Read this aloud | no menu ("← Back" instead) | | | | | | | | | |
| Preview board | ✓ | — | — | — | — | ✓ | — | ✓ | ✓ | ✓ |
| Scan screen | ✓ | — | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pass screen | ✓ | — | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Private map | no menu | | | | | | | | | |
| Clue screen | ✓ | — (button on screen) | — | ✓ | two or three phones | ✓ | ✓ | ✓ | ✓ | ✓ |
| Guessing | ✓ | ✓ | ✓, disabled outside SWD-046's window | ✓ | two or three phones | ✓ | ✓ | ✓ | ✓ | ✓ |
| End-turn line, turn over | ✓ | — | — | ✓ | two or three phones | ✓ | ✓ | ✓ | ✓ | ✓ |
| Game over | ✓ | — | — | ✓ | — | — | — | — | ✓ | ✓ |
| Summary | only "Discard this evening" | | | | | | | | | |

"Earlier clues" (SWD-041) sits after "How to play" on the guessing, end-turn line and turn-over steps, at every screen height;
disabled before the board's first clue. At 568 × 320, "Change clue" (SWD-041) is a menu item after "That clue broke a rule",
with the same window. The clue screen opened by "Change clue" has the clue screen's menu.

**Back:** "← Back" on setup screens: Who's playing? → the picker; Make teams → Who's playing?; Choices → Make teams;
Read this aloud → Choices; code entry → the Join screen; map phone → Home. Make teams keeps its teams across "← Back"
(SWD-004). During a game there is no "← Back", and the browser's or phone's Back does nothing (the existing back guard).

---

## 01 Setup → `specs/secret-words/01-setup.md`

### SWD-001 Picking Secret Words
Home's "Host a game" reads "Tambola, Impostor or Secret Words on this phone" (titles joined with ", ", and " or " before the last). Its picker "What shall we play?" shows three cards
of equal width and height (±1 px) in the order Tambola, Impostor, Secret Words; tapping Secret Words opens "Who's playing?". With an
unfinished Secret Words evening its resume card shows above the cards (after Impostor's, if both are unfinished); tapping the
Secret Words card then opens the "Start new" dialog: "Start new" ends that evening (SWD-067) and opens "Who's playing?";
"Carry on that evening" resumes it.

### SWD-002 Join a game, and the map code
Home's second card reads **"Join a game"** with the line "Tambola ticket or Secret Words map from the host" (owner, 4
October), and opens the Join screen, now headed "Join a game". (Until Secret Words ships, the line reads "Tambola ticket from
the host"; that C1 change is in the handover and tested with Tambola; Secret Words' tests check only the final line.) Rule 11:
this rewords PLT-300 (Home), IMP-002 (its string row and Given) and the Tambola join scenarios that quote "Join with my ticket"
or "Type the code" (now "Type a ticket code"); the tester updates their wording. On the Join screen, in this order: Tambola's
scan and "Type a ticket code"; Impostor's line; Secret Words' line; quiet "I have a map code", which opens the code entry.
Input: `autocapitalize="characters"`, `maxlength="12"`. The typed text is read with spaces and hyphens removed and letters
upper-cased. "Open the map" is disabled while that leaves fewer than 7 characters. On tap:
1. not exactly 7 characters, any character outside the alphabet (0, O, 1, I, L included), or a wrong check symbol
   (SWD-022), or a deal index too large for its edition (checked only for shipped editions) → "That code doesn't look right. Check it with the host.", typed
   text kept;
2. a config symbol for an edition this app doesn't have (value ≥ 4 while the app has only edition 1) → "This map needs a
   newer version of the app. Open the app once with internet, then try again.";
3. otherwise the map phone opens (SWD-034).
**The QR link** `<origin><BASE_URL>#map=27P3QX8` (`BASE_URL` = the app's base, e.g. `/pocket-game-night/` or `/preview/`)
opens the map phone directly; the hash is then removed from the address. An invalid or newer code in the link opens the code entry
with it filled in (raw) and the matching error shown; "← Back" there goes to the Join screen. Opening a map never changes an unfinished host evening on that phone.

### SWD-003 Who's playing?
Impostor's names screen (IMP-003) **without** the "Sit in a circle…" line and without ▲ ▼ (order means nothing here):
tonight's names filled in, "Clear list", past names. "Next" is disabled while there are fewer than 4 names, with "Add at
least 4 players." shown below the list whenever that is true (0 names included). Adding a 21st name shows "20 players is the
most." and adds nothing. "← Back" → the picker.

### SWD-004 Make teams
The first time in a new evening's setup: names are shuffled with ``shuffle(names, createRng(`${teamSeed}:${k}`))``, k = 1;
the first ⌈n/2⌉ go to the orange team and the rest to the teal team, each in shuffled order. `teamSeed` is made (or read from test hook 2) on
first entering Make teams for a new evening and kept into the evening's setup. Clue givers: SWD-007.
Returning to Make teams ("← Back" then "Next", or "Change teams" later) keeps the teams: names no longer playing are dropped;
new names join the smaller team (orange if equal) at the end; a clue giver who left is replaced by SWD-007.
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
"Shuffle teams" draws a new split with the next k (SWD-004). If it puts the same set of names in each team as now, it draws
again with the next k, at most 10 draws in all, keeping the 10th. Clue givers by SWD-007. Toast "Teams shuffled · Undo"
(Undo as SWD-005). k counts every draw of the evening and is saved (`splits`).

### SWD-007 Clue givers
Each team's suggested clue giver is its member credited with the **fewest games this evening** (won and ended early;
replaced boards don't count); ties go to the earliest in that team's list. (Game 1: each team's first player.) "Change clue
givers" opens the sheet: per team, the current one selected; tapping another selects it; "Done" applies; closing it any
other way changes nothing.

### SWD-008 Team minimum
While either team has fewer than 2 players, "Next" is disabled and "Each team needs at least 2 players." shows. Teams may
differ in size by any amount.

### SWD-009 How do you want to play?
Three groups, each showing only its chosen option's line (the phone cards always show their own text).
**How many phones?**: three equal cards (±1 px) in this order: "One phone", "Two phones" (with the small line "Recommended"
inside the card, never the selected or main look), "Three phones"; none selected the first time on this phone, so "Deal the
words" is disabled until one is tapped (`choices.map` = `'pass'`, `'shared'`, `'own'`). Two and three phones play the same
way; they differ only in the scan screen's wording (SWD-033). Cards are stacked full width in portrait and at 568 × 320, and
side by side at 812 × 375; each card's accessible name is its title, its texts linked by `aria-describedby`. "Recommended"
never changes the card's look beyond its own small line. This screen may scroll (page); the main button stays fixed. **Board**: Full (default) / Easy. **Landmine** (shown only while Full is chosen; Easy has no Landmine): Lose the game
(default, the standard rule) / Lose your turn (`choices.landmine` = `'lose' | 'turn'`; kept when Easy is chosen). **Words**: Whole family
(default) / + Grown-ups. A new evening starts from this phone's last-used values for all four (SWD-066), with "Same as last
time" under the heading; each saved field is read on its own (an unknown value gives that field's first-time state;
"Same as last time" shows only when all four were valid; a missing `landmine` reads as `'lose'`); version 2's `'pass'` and `'own'` read unchanged. "Deal the words": if the read-aloud card is due
(SWD-010) it opens; otherwise it deals at once (in a new evening, the evening is created then). Between games the choices
change only through "Change teams" → "Next" → this screen (SWD-056).
### SWD-010 Read this aloud
Due when no Secret Words game has been dealt yet in the current session (PLT-016); checked when "Deal the words" is tapped in a
new evening. Lines: 1 "Two teams, Chai Champions and Coffee Commandos. Each has a clue giver who sees the secret map." (the evening's names) 2 "Clue givers: say
one word and a number. 'Monsoon, 2' means two of our words go with monsoon." 3 "Guessers: talk, then turn over words one at
a time. Wrong word? Your turn ends." 4 "Find all your words first. Step on the Landmine and you lose!" (Lose your turn: "Find all your words first. Step on the
Landmine and your turn ends!"; Easy: "Find all your words first!"). "Let's play" deals; "Show me the board first" deals and opens the preview board (SWD-012).

### SWD-011 How to play (detail of SWD-010)
Menu → "How to play": h2 "Read this aloud" and its 4 lines, then h2 "The rules": 1 "Clue givers see the secret map.
Everyone else sees only the words." 2 "A clue is one word and one number. It must be about meaning, not spelling or where a
word sits." 3 "Don't say a word that is still face down on the board, or part of one." 4 "English, or a word you'd use in
an English sentence (chai, dosa), is fine. Names like Taj Mahal count as one word." 5 "No faces, no pointing, no extra
hints. The other clue giver judges a clue before the first guess." 6 "Guessers take at least one guess, and up to the number
plus one. 0 or ∞: as many as you like." 7 "Your word: keep going. Nobody's word or the other team's: your turn ends. The Landmine: you lose!" (Lose your
turn: "The Landmine: your turn ends and the other team gets a word free."; Easy: without the Landmine sentence) 8 "First team to find all its words wins." Then the small line `credit`: "Secret Words uses game rules inspired by
Codenames, designed by Vlaada Chvátil. Codenames is a trademark of Czech Games Edition. Secret Words is an independent free
game and is not made, sponsored or endorsed by Czech Games Edition." (plain text, no styling; `docs/games/secret-words/legal.md`) Main "Done" returns.
The page may scroll. Nothing about the map appears.

### SWD-012 The preview board (detail of SWD-010)
After "Show me the board first": the board with every cell locked, `turn-line` "Chai Champions start" (the starting team), the
counts, and main "Start", which leads to the scan screen (two or three phones) or the pass screen (one phone). No clue line, no tips.

### SWD-013 Funny team names (owner, 4 October, K25)
Each evening the two teams get a random pair from `team-names.csv` (20 pairs; the first name goes to the orange team, the
second to the teal team). The pair is drawn on first entering Make teams for a new evening:
``createRng(`${teamSeed}:names:${m}`)``, m = 1, picking uniformly among the pairs not used by the 3 most recently started other
Secret Words evenings on this phone (all 20 if fewer than 4 remain). Quiet **"New team names"** on Make teams draws again with
the next m, never giving the pair on screen, with the toast "New team names · Undo" (Undo restores the previous pair). The
names are fixed from the evening's first deal: later "Change teams" shows them without "New team names". Every name is a
plural phrase of at most 18 characters, so headings read "Chai Champions win!", and screens never use a possessive
("Chai Champions's"). Names are content: English or known everywhere (K24), kind to everyone (never about a region,
religion, caste, gender or body). `team-names.csv` changes like the word list: by edition (SWD-023); a saved evening keeps
its names as text.


### SWD-014 Guesses only (P7)
In the Clue givers sheet each player row has the name button and, on its own line under it, a switch "Guesses only" (`role="switch"`,
`aria-checked`, accessible name "Riya: guesses only"), off by default; the sheet scrolls inside. Changes apply on "Done", like the
rest of the sheet. A player with it on is not **eligible**: never suggested by SWD-007 (game 1: each team's first eligible
player; and so not by SWD-006), never chosen by SWD-005 or SWD-061 (each picks the next eligible player in list order,
wrapping to the first), and their name button is disabled. Turning it on for the current clue giver makes the next eligible player the clue
giver. A team's last eligible player's switch is disabled, with "Each team needs someone who can give clues." under that
team's group. If a move or shuffle on Make teams leaves a team with no eligible player, Make teams shows the same message and
"Next" is disabled. Make teams shows the small line "Guesses only" (`guess-only-tag`) under such names. In "Players" (SWD-061),
"Remove" is disabled for a team's last eligible player; added players start eligible. Kept in `teams.guessOnly` (recorded
with `setTeams`), carried by name into a new evening from the latest Secret Words evening of the same session. The Clue givers
sheet exists only on Make teams.
---

## 02 The deal and its secrets → `specs/secret-words/02-deal.md` (C3)

### SWD-020 What a board holds
Full: 25 distinct words; starting team 9, other 8, nobody 7, Landmine 1. Easy: 16 distinct words; 6, 5, 5, 0.
**Property:** for 10,000 random valid codes of each size, exactly these counts and all words distinct.

### SWD-021 Who starts
**Property:** over 10,000 random valid codes, each team starts between 48% and 52% of boards.

### SWD-022 The map code
Symbols (values 0–30): **1 config** = (edition − 1) × 4 + (Easy ? 2 : 0) + (+ Grown-ups ? 1 : 0) (edition 1: 0–3);
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
words of the 3 most recently started other Secret Words evenings on this phone that weren't discarded, frozen at evening
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
still doesn't fit; "Clue giver for Chai Champions (orange)"; the recap line (SWD-103); the Do Not Disturb tip on the evening's first pass
screen (SWD-104); quiet "Hurry up: 90 s"; main "I'm Riya".

### SWD-031 One phone: the private map (P4)
After "I'm Riya": heading "Riya" (CSS upper case); small line "You give clues for Chai Champions (orange)"; the counts; the map
area (empty while hidden); pad `hold-pad`, a button named by its visible text "Tap to see the map" / "Tap to hide" (no
`aria-pressed`); quiet "Our words" and quiet "↻ Turn" (accessible name "Turn the board") side by side (half width each, shown only while the map shows); main once
shown; no menu, no team bar.
- A tap on the pad shows the map; taps within 500 ms of the last are ignored. The map is removed from the page at once on
  "Tap to hide", at t = 180 000 ms after the latest `pointerdown` anywhere on this screen (still shown at 179 999), and when the
  app is hidden (SWD-032). When it hides, "Our words" and "Turn" hide and the list resets to the grid; the main stays.
- The shown map: every cell with its word text, kind colour and icon; cells already turned over at 40% opacity with the word
  struck through (accessible name adds ", found"); turned as the team's board angle (SWD-102).
- "Our words" swaps the grid for `our-words`: h2 "Your words (6 left)" ("(1 left)" for one; this team's face-down words), each
  word an `li` at 24 px (28 px with Larger text) in `data-index` order, then the small line `avoid-line` "Avoid: Shadow" with
  the landmine icon (the Landmine's word if face down; none on the Easy board). The button then reads "Whole map".
- Main "I have my clue" appears at the first show and then stays; tapping it removes the map, records `mapSeen` (once per
  turn) and opens the clue screen.
- No text selection, callout, magnifier, context menu or drag on the pad or the map. No sound, no vibration.
- **Layout.** Portrait: heading, small line, counts, map area (board layout, SWD-090), the "Our words | Turn" row, pad (full
  width, 96 px tall), main; the content above the main scrolls inside if needed, and does not at 390 × 844 (Larger text off and
  on). Landscape: map area at the left as the board (SWD-091); at the right a column (200 px at 812 × 375, 160 px at 568 × 320)
  with heading, small line, counts, pad (column width × 96), "Our words", "Turn" and the main (column width × 60) at the
  bottom; the column scrolls inside if needed.
- Narrow portrait: heading, small line, `turn-sideways`, the pad and the main; a tap on the pad shows the `our-words` list
  (not the grid), and the main appears at that first show.
### SWD-032 Leaving a map screen
On `visibilitychange` to hidden on the private map or the map phone: a full-screen `privacy-cover` appears and the map is
removed in the same task. Back on the host: the pass screen for the same player with "Welcome back." above it. Reload or resume
does the same.

### SWD-033 Two or three phones: scan the map
After each deal (after the preview's "Start", if shown) with two or three phones: the scan screen (strings above), QR at least
200 × 200 px encoding `<origin><BASE_URL>#map=<code>` (no hyphen); the orange team's clue giver named first in both wordings.
Two phones: main "The map phone is ready"; three phones: main "Both have the map". From the evening's second deal on (Play
again, Deal a new board, Change teams), `board-check` reads "Already have the last map open? Tap Next map on it and check it
shows 78." when this deal's code equals `nextMapCode` of the previous deal's code (replaced boards included), else "New code:
scan again." On the evening's first deal `board-check` is absent. The main opens the starting team's clue screen. Resuming any time before the board's first clue shows the scan
screen again. The page may scroll; the QR stays 200 × 200 and the main stays fixed. The host never shows the map in these modes
until game over, except through SWD-037.
### SWD-034 The map phone
Heading "Secret Words map"; `map-code-line` "Code 27P-3QX8 · Check 78 · Orange team starts" (a map phone knows colours, not names); the map grid (`map-grid`, cells `map-cell` with
`data-index`, in the host board's order, each with word text, kind colour and icon, laid out and sized as the board,
SWD-090/091, without the panel); the small line; quiet "Hide map" / "Show map"; quiet "Next map" (SWD-039); quiet "Done with this game". No main button, no "Turn",
no menu; "← Back" → Home. The map shows on opening; after the app has been hidden it returns hidden, with "Show map". Wake
lock while shown. Narrow portrait: "Turn your phone sideways to see the board." in place of the grid, buttons kept.
Landscape: grid at the left; heading, code line and buttons in a column at the right (200 px at 812 × 375, 160 px at
568 × 320) that scrolls inside if needed. `map-code-line` always includes the board check: "Code 27P-3QX8 · Check 78 ·
Orange team starts". The host's game ending changes
nothing here. Larger text follows this phone's own setting.

### SWD-035 Fading found words
Tapping a map cell toggles **found** (40% opacity, word struck through, accessible name adds ", found") on this phone only,
saved with the map. A second tap within 500 ms does nothing.

### SWD-036 Clearing and replacing maps
This phone keeps at most one map (`pgn.secretWords.map` = `{ code, savedAt, found: number[] }`; `savedAt` = when the code was
first opened, or when "Next map" opened it). "Done with this game" → dialog → "Clear map" removes it and opens Home. Opening a different code (except by "Next map", SWD-039) replaces it,
with the toast "New map. The old one was cleared."; opening the same code opens it with its found marks and no toast. Home
shows a saved map as `saved-map`: a button "Secret Words map 27P-3QX8 · Tap to open"; more than 6 hours after `savedAt`, the
text "Secret Words map 27P-3QX8" with buttons "Open" and "Clear" ("Clear" opens the same dialog). The app never opens a saved map
by itself.

### SWD-037 Showing the map on the host (two or three phones)
Menu → "Show the map to a clue giver" → sheet with the two current clue givers → a name: SWD-030 and SWD-031 for that player,
with main "Done, hide the map", which returns to the step the game was on.

### SWD-038 Larger text on map screens (detail of SWD-031, SWD-034)
Larger text changes the heading and lines, never the map's word size (SWD-090).


### SWD-039 Next map and the board check (P8, C3)
"Next map" on a map phone opens `nextMapCode(code)`: the same config and deck seed, deal index n + 1, a new check symbol, if that
code is valid (SWD-022); taps within 500 ms are ignored. It replaces the saved map (found marks cleared, `savedAt` = now), shows
the map even if it was hidden, and the toast "Next map. Check it shows 8A on the host." (27P-3QX8 → 28P-3QXA, check "8A"). If
`nextMapCode` gives `null`: the toast "That was the last map of this deck. Scan the new code." and nothing changes. With
edition 1's Whole family list (451 candidates), the last valid n is 17 for both Full and Easy (25·17 + 25 = 450 ≤ 451; 25·18 +
16 = 466 > 451). "Deal a new board" uses up a deal index like any deal. **Property:** for 1,000 random evenings, every deal for
which SWD-033 shows "Tap Next map" has exactly the code `nextMapCode` gives from the previous deal's code.
---

## 04 Clues and guesses → `specs/secret-words/04-play.md` (rules C3, screens C2)

### SWD-040 The clue (P3, P4)
Team bar; heading "Chai Champions, your turn"; `clue-prompt` "Riya, say your clue out loud. How many words is it for?"; keys; the
input `clue-word` "Clue word (optional)" (`maxlength="24"`, `autocapitalize="off"`; Enter does not submit); `clue-warning`
(SWD-101); the counts; on the evening's first turn of its first game only, the tip; with two or three phones the recap line
(SWD-103); one phone: quiet "See the map again"; from "Change clue": quiet "Keep my clue"; quiet "Hurry up: 90 s"; main.
Keys `clue-key`: portrait 0–4 and 5–9 in two rows, then "∞" full width; each 56 × 56 px (∞ 56 px tall), gaps 2 px at 320 px wide
and 8 px from 360 px up. "∞" shows "∞" only; accessible name "As many as you like" (accepted exception to WCAG 2.5.3). A tap
selects a key (selected look); another tap moves the pick. Main "Pick a number" (disabled), then "Clue for 2: start guessing"
(0: "Clue for 0: start guessing"; ∞: "Clue for ∞: start guessing"); the word is recorded trimmed, inner spaces and case kept,
and left out when empty (SWD-101).
- "See the map again" (one phone) opens the private map shown, the 180 s hide applying and a running timer carrying on, with
  main "Back to my clue", which returns here with the number and word kept; nothing is recorded.
- "Keep my clue" (after "Change clue") returns to guessing with the clue unchanged; nothing is recorded. A reload while
  changing returns to guessing with the old clue.
- **Layout.** Portrait: one column; the content above the fixed main scrolls inside when needed. At 390 × 844 with Larger
  text off, nothing scrolls with the keyboard closed. When space runs short, the tip hides first, then the recap line.
  812 × 375: two columns: the left (heading, prompt, input, warning, counts, tip, recap, buttons) scrolls inside; the right
  column, 358 px wide, holds the keys in two rows of 6 (0–5; 6–9 and ∞), each 56 × 56 (∞ too) with 4 px gaps, above the main. 568 × 320: one
  column scrolling inside, keys in one row of 11 at 44 × 44 with 4 px gaps, main at the bottom right. No-scroll checks are made
  with the keyboard closed; when the input has focus it is scrolled into view.
### SWD-041 Guessing and the allowance (P3, P5)
After the clue (portrait, top to bottom): team bar; top bar with `hurry-timer` (if running) and "··· Menu"; `turn-line`
"Chai Champions guessing" (1 line; at most 2 in the landscape panel); `clue-line` (22 px, weight 700, at most 2 lines, not
grown by Larger text; shrinks in 1 px steps to 17 px, then wraps anywhere); `clue-history`; the counts row with the "↻" Turn
button (44 × 44, accessible name "Turn the board") at its right end; the board; the tip or result line (at most 2 lines); the
**action slot**; the main.
- **Action slot:** until the turn's first reveal (ending at the "Reveal" tap, t = 0), two quiet buttons side by side, "Change
  clue" and "Clue broke a rule?" (half width each, 48 px, labels may wrap onto 2 lines); from the first reveal, quiet "End our
  turn". At turn over (including after `brokeRule`) the slot is empty.
- `clue-line`: with a word, DOM "Cricket · 2 · 3 guesses left" (the word as typed, upper case by CSS); without, "Clue: 2 · 3
  guesses left". It counts down while guesses remain: "· 2 guesses left", "· 1 guess left"; for 0 and ∞, "· guess as many as
  you like".
- `clue-history`: this team's earlier clues in force in this game, newest first, at most 3: "Earlier: MONSOON 2 · 1 · RAIN ∞"
  (number alone without a word; ∞ as "∞"); not before the team's second clue; replaced clues never show. Shown in portrait when
  `innerHeight` ≥ 700 (Larger text on or off) and in the landscape panel; otherwise hidden. The menu's "Earlier clues" sheet
  always lists every clue in force of this game.
- "Change clue" opens the clue screen with the number and word selected; confirming records a new `clue` that replaces the
  turn's clue (announced again); "Keep my clue" returns (SWD-040). "Clue broke a rule?" opens SWD-046's dialog; after
  "Cancel", "Change clue" still works.
- **Fit at 360 × 640:** team bar 8 + top bar 48 + turn-line 24 + clue-line 58 + counts row 44 + board (5 × 48 + 4 × 4) 256 +
  result 42 + action slot 48 + main 60 + bottom 16 = 604, plus 8 gaps of 4 px = 636 ≤ 640 with Larger text off. Shrink order
  when it doesn't fit: cell height 56 → 48 px, then `clue-line` 22 → 17 px; with Larger text on at 360 × 640 the page
  may scroll as one with the main fixed (the only exception).
**Property:** no turn records more guesses than its allowance (counted from the turn's last `clue`), no `clue` follows a reveal
in the same turn, and no turn ends by "End our turn" before one guess.
### SWD-042 Pick, then confirm
Face-down cells are buttons (`board-cell`, `data-index`, accessible name "Kite, face down", `aria-pressed`). A tap picks
(selected look: outline, ✓, tint; never a team colour); a tap on the picked cell unpicks; a tap on another moves the pick.
Turned-over cells are not buttons. Main "Reveal" (disabled) / "Reveal <WORD>". Tapping it is the guess. The pick clears after
each guess.

### SWD-043 What a guess does
At t = 0 the cell starts a 300 ms turn (none with reduce motion); at t = 300 ms (0 with reduce motion) the cell shows turned
over, the counts update and the result line shows; taps on cells and buttons do nothing until then.

| Word was | Result line | Then |
|---|---|---|
| Own team's, guesses left (clue 1–9) | "✓ Your word! 2 guesses left." / "✓ Your word! 1 guess left." | Guessing continues |
| Own team's, clue 0 or ∞ | "✓ Your word! Keep going, or end your turn." | Guessing continues |
| Own team's, allowance used up | "✓ Your word! That's all your guesses." | Turn over |
| Nobody's | "Nobody's word. Other team's turn next." | Turn over |
| The other team's | "✗ The other team's word! It counts for them." | Turn over |
| Either team's last word | none | Game over at t = 300 ms: that team wins |
| The Landmine, Lose the game | none | Game over at t = 300 ms: the other team wins |
| The Landmine, Lose your turn | "✗ The Landmine! Your turn is over, and the other team gets one word free." | Turn over; the free word turns over as SWD-046 (seed ``${seeds.deal}:landmine:${D}:${T}``, recorded as the reveal's `freeCell`); if it is that team's last word, game over: that team wins |
Result lines name no team, so every name fits. The last-word and Landmine rows win over the others. With Lose your turn, the Landmine stays turned over and can't be
picked again.

### SWD-044 Ending the turn early
"End our turn" (shown from the turn's first reveal, SWD-041): a tap shows the end-turn line: cells locked, result
line "Chai Champions ended their turn.", quiet "Oops, keep guessing" (back to guessing; nothing recorded), main "Other team's turn"
(records the end of the turn and the next turn). A running timer stops when the line shows.

### SWD-045 Turn over
Cells locked (not greyed), the result line stays, the clue line and tip are removed, "End our turn" is hidden, main
"Other team's turn": one phone → the pass screen for the other team's clue giver; two or three phones → the other team's clue
screen.

### SWD-046 A clue that broke a rule
Menu item enabled from the clue until the turn's first guess; disabled otherwise. The board's quiet "Clue broke a rule?"
(SWD-041) opens the same dialog. Dialog → "Yes, it broke a rule": the turn
ends; `list` = the other team's face-down cells in cell order; cell =
``list[createRng(`${seeds.deal}:penalty:${D}:${T}`).int(list.length)]`` (D = deal number of the evening, T = turn number on
this board); that cell turns over as SWD-043 (vibration 50 ms, the `thud` sound). Result line "Clue broke a rule. One of
the other team's words was turned over." and turn over; if it was that team's last word: game over, that team wins.

### SWD-047 Hurry up: 90 s
"Hurry up: 90 s" (buttons on the pass and clue screens; menu item while guessing) starts the timer `hurry-timer`. Place and
`font-size` (Larger text has no effect): portrait board screens, in the top bar left of "··· Menu", 56 px at 390 × 844 and 40 px
at 360 × 640; landscape board panel, on its own row above "··· Menu", 40 px at 812 × 375 and 568 × 320; the private map's top
right and every other screen, 28 px. "Time's up!" and "Paused" shrink in 1 px steps to fit their place, floor 28 px. It reads
"1:30" at t = 0, "1:29" at t = 1 s, … "0:01" at t = 89 s, and "Time's up!" from t = 90 s (with the chime, sound on); "0:00" never
shows. The button or menu item reads "Stop timer" from the start until tapped (also after "Time's up!"); "Stop timer" removes
the timer. A timer started on the pass screen keeps running on the private map and the clue screen. Nothing else ever happens
because of the timer. It is removed when the clue is given, at the end-turn line, at turn over, on "Deal a new board", "End the
game" and game over. When the app is hidden it shows "Paused" and the button or item reads "Hurry up: 90 s"; a tap restarts it
at 1:30 from that tap. It is not saved: after a reload there is no timer.
### SWD-048 Reload during play (detail)
Only moves are saved, plus UI state `pgn.secretWords-ui.<id>` = `{ step, angles: { orange: 0 | 180, teal: 0 | 180 } }` (step:
preview, scan, pass, map, end-turn line). A reload returns to the last step with the last reveal's result line and the board
angles; picks, the selected key, the typed clue word not yet confirmed, open dialogs and menus, the timer and a shown map are
lost; a private map returns to its pass screen with "Welcome back."; a clue screen opened by "Change clue" returns to guessing.
### SWD-049 Double taps (detail)
Every button that records a move ignores another tap for 800 ms after a tap; picks and key choices follow the last tap.


### SWD-101 The clue word (P3, C3)
The `clue` move carries `word` (1–24 characters after trimming), or no `word` at all; replay rejects a longer word.
**Warning (clue screen only):** both the typed text and each face-down word are reduced to their letters a–z: NFKC, lower
case, every other character dropped ("ice-cream" → "icecream", "Taj Mahal" → "tajmahal"). If the typed text keeps at least 3
letters and equals a reduced face-down word, contains one, or is contained in one, `clue-warning` (a paragraph under the input)
reads "Cricket is still on the board. Clue rules say: pick another word." for the first such word in `data-index` order (word
text); otherwise it is absent. It updates on every input event and never blocks. Worked cases with Bat and Monsoon face down:
"bat" and "Batsman" warn ("Bat …"); "mon" warns ("Monsoon …"); "ca" never warns; "मानसून" never warns. Words already turned
over never warn.
### SWD-102 Turn the board (P6, flip only)
"↻" Turn (accessible name "Turn the board") on every board screen and the private map, hidden in narrow portrait. Each tap
flips the grid 180° (0° ↔ 180°) inside its area, so its words read upright from the other side of the table; cells keep their
`data-index` (at 180°, index 0 is at the bottom right) and are tapped where they show. `word-board` (and the private map's
`map-grid`) carry `data-angle="0"` or `"180"`. 90° is not offered: in portrait a turned 5 × 5 grid gives each word about 40–48 px,
too narrow for 8 letters at 12 px (a deviation from P6's 90° steps). The angle is kept per team colour for the evening (UI state,
SWD-048), across games and "Change teams": a tap on the guessing, end-turn line or turn-over step changes the guessing team's
angle; on the private map, the clue giver's team's; on the preview, the starting team's; at game over, the angle of the team
that played last. A team's angle is applied when its turn starts; turn over keeps the team that just played.
### SWD-103 Recap line (P9)
`recap-line` on the pass screen (one phone) and the clue screen (two or three phones, also when opened by "Change clue"), from
the board's second turn (it restarts after "Deal a new board"; it shows again after a reload): "Last turn: Coffee Commandos found
2 words;" (that team's own words turned over by its guesses in that turn; a word turned over by SWD-046 or as the Landmine's free word never counts; "found 1
word", "found 0 words") then how the turn ended, the first that applies: broke a rule → "the clue broke a rule."; the Landmine (Lose your turn) → "they stepped on the Landmine."; "End our turn" →
"they stopped."; allowance used up → "they used all their guesses."; a nobody's word → "Train was nobody's."; the other team's
word (the current team's) → "Train was yours!". Fits in 2 lines (3 with Larger text) at every size with an 18-character team
name and an 8-letter word.
### SWD-104 Do Not Disturb tip (P9)
`dnd-tip` "Tip: turn on Do Not Disturb so messages don't pop up on the board." on the evening's first deal, on every showing of
its first pass screen (one phone, including after "Welcome back." or a reload) until the evening's first `mapSeen`, or of its
first scan screen (two or three phones) until the evening's first `clue`. Not after "Deal a new board" when that
happens later. It never shows together with the "One word, one number" tip.
---

## 05 Winning and the night → `specs/secret-words/05-results.md` (C3)

### SWD-050 Who wins
A team wins when all its words are turned over (by either team, or SWD-046). With Lose the game, turning over the Landmine makes the other team win; with Lose your turn, see SWD-043.
**Property:** every one of 10,000 random scripted games ends with exactly one winner, or ended early.

### SWD-051 Game over
Heading "Chai Champions win!"; line "All 9 words found." (the winner's total: 9, 8, 6 or 5) or, for the Landmine, "Coffee Commandos stepped on
the Landmine!" (the losing team); the whole map: turned-over cells as before, face-down cells now in their kind's colour and icon
at 50% opacity (accessible name "Kite, teal team, not found"); tally; main "Play again"; quiet "Change teams", "End the
evening". The page may scroll as one, main fixed. Wake lock released. Narrow portrait: the sideways line instead of the board.

### SWD-052 Tally
"Tonight: Chai Champions 2 · Coffee Commandos 1" (won games only); "Tonight: Chai Champions 0 · Coffee Commandos 0" before any.

### SWD-053 Play again
Same teams; clue givers by SWD-007; same choices; a new deal (SWD-024); then the scan screen or the new starting team's pass
screen.

### SWD-054 End the game
Menu "End the game" (scan, pass, clue, guessing, end-turn, turn over) → dialog → "End the game": heading "Game ended. No
winner.", no result line, the whole map as SWD-051, tally unchanged, same buttons. The game counts for SWD-007 and History.

### SWD-055 Deal a new board
Menu "Deal a new board" (any step from the first deal until game over) → dialog → "Deal a new board": a new deal with the same
teams, clue givers and choices; the starting team drawn anew; turn numbers restart; tips don't show again; the timer stops;
clue-giver counts unchanged. Then the scan screen or the new starting team's pass screen.

### SWD-056 Change teams (detail of SWD-051)
"Change teams" → Make teams (current teams) → "Next" → Choices → "Deal the words" deals the next game (no read-aloud).

---

## 06 The evening → `specs/secret-words/06-evening.md` (saved data C3)

### SWD-060 End of the evening
"End the evening" (game over button, or menu) → dialog → "End the evening": a game in progress is ended early; the evening ends;
the summary shows: tally; fun lines, at most two, in this order: "Riya's clues won 2 games" (the credited clue giver with the
most won games, at least 1; tie: the one who reached that count first) and "The Landmine went off 1 time" (at least 1); main
"Play something else" (the picker, tonight's names kept); quiet "Back to Home". An ended evening never reopens; an evening
with no game at all is deleted, otherwise it stays in History.

### SWD-061 Players during a game
Menu "Players" (sheet; changes apply at once): "Add" puts a name in the smaller team (orange if equal) as a guesser from now on;
Impostor's duplicate message; "20 players is the most.". "Remove Kabir" removes a guesser with "Kabir left · Undo" (Undo puts
them back in place). Removing a clue giver makes the team's next eligible player in list order (wrapping to the first) its clue giver,
with "Riya left · Meena is the new clue giver · Undo"; if that team is on its pass, private map or clue step in one-phone mode,
its pass screen restarts for Meena; once guessing has started, the turn carries on. With two or three phones the new clue giver uses
SWD-037. "Remove" is disabled for every player of a team of 2.

### SWD-062 Leaving and resuming
Every move is saved. Home's row "Secret Words, 8:40 pm, game 2" (the evening's start, phone's local time, "pm" lower case, no
leading zero; game number per Terms). "Tap to resume" returns to the same step (SWD-048).

### SWD-063 The 12-hour limit
When the app opens or Home shows, an evening whose last move is more than 12 hours old ends: `endGame` (if a game was in
progress) and `endEvening`, both at the last move + 12 hours. No summary shows.

### SWD-064 History
Evening row "Secret Words · 3 games" (won and ended early). Game rows: "Game 2 · Chai Champions won · Riya and Arjun gave clues"; Landmine: "Game
2 · Chai Champions won, Coffee Commandos stepped on the Landmine · Riya and Arjun gave clues"; "Game 3 · Ended early · Meena and Kabir gave clues"
(credited clue givers, the orange team's first). Tapping a game row opens its board with the whole map and the line
`history-clues` "Clues: Chai Champions CRICKET 2 · Coffee Commandos 1 · Chai Champions RAIN ∞" (every clue in force,
oldest first; a clue without a word shows its number alone) ("← Back" to the evening).

### SWD-065 Discard the evening
Summary menu "Discard this evening" → dialog → "Discard": the evening is deleted and Home opens. No undo.

### SWD-066 Saved choices (detail of SWD-009)
`pgn.pref.secretWords.lastChoices` = `{ map, board, landmine, words }`, written at each deal. Unreadable or missing → the first-time state.

### SWD-067 Start new (detail of SWD-001)
"Start new" records `endGame` (if a game was in progress) and `endEvening` for the old evening, then opens "Who's playing?"
for a new evening. No summary shows.

---

## 09 Usability → `specs/secret-words/09-usability.md` (C1/C2)

### SWD-090 Board text and portrait layout
Portrait board: 8 px side margins, 4 px gaps; cells (width − 16 − gaps) / columns wide (Full at 360: 65.6 px; at 390: 71.6
px). Cell height 56 px, shrinking to no less than 48 px so the page doesn't scroll. One font size for all words of a board:
the largest whole px from 22 down to 12 at which every word fits in 1 line within its cell minus 4 px padding each side.
Larger text doesn't change it. Status lines and the full height budget: SWD-041. No page scrolling at 390 × 844 (Larger text off and on) and 360 × 640
(Larger text off).

### SWD-091 Landscape board
812 × 375: grid at the left (margins 16 px left and bottom, 8 px under the team bar); a 200 px panel at the right (16 px right
margin, 12 px gap). Panel, top to bottom: `hurry-timer` row (when running); a row with "↻" (44 × 44) and "··· Menu"; a middle part
that scrolls inside if needed: `turn-line` (at most 2 lines), `clue-line`, `clue-history`, counts (two lines), `result-line`, tip;
then pinned at the bottom the action slot (until the first reveal "Change clue" and "Clue broke a rule?" stacked, each 200 × 48;
then "End our turn" 200 × 48) and the main button (200 × 60). Cells at least 100 × 56 px. The main button's text may shrink to
17 px to fit. 568 × 320: the same with 8 px margins, a 160 px panel (main 160 × 60) and an 8 px gap, and no change row (both are
menu items, SWD-041/046); cells at least 69 × 54 px. No page scrolling. Cell sizes are measured on the unturned board.
### SWD-092 Narrow portrait
On the board screens, the private map and the map phone, narrow portrait shows `turn-sideways` in place of the grid; the other
parts of the screen stay (on the board, "Reveal" stays disabled). Turning to landscape shows the grid. All other screens work at
320 × 568 portrait.

### SWD-093 Never colour alone
Every turned-over cell and every map cell has its kind's icon and an accessible name: "Kite, orange team" / "Kite, teal
team" / "Kite, nobody's word" / "Kite, the Landmine" (+ ", found" or ", not found" where SWD-031, SWD-035 and SWD-051 say).

### SWD-094 Targets
Every button at least 44 × 44 px; board cells per SWD-090/091; keys per SWD-040.

### SWD-095 Screen readers
The announcer reads: the clue ("Clue for Chai Champions: 1 word" / "2 words" / "0 words" / "as many as you like"; with a word,
as typed, "Clue for Chai Champions: Cricket, 1 word" / "Cricket, 2 words" / "Cricket, 0 words" / "Cricket, as many as you like";
announced again after "Change clue"); each result line; at
turn over "Other team's turn"; at game over the heading then the line ("Chai Champions win! All 9 words found."). It never announces the
map. Map cells are reachable by name only on map screens.

### SWD-096 Reduce motion
With `prefers-reduced-motion: reduce`: no cell turn and no animations (`document.getAnimations().length === 0` on board
screens); everything else the same.

### SWD-097 Sound and vibration
Sounds (Impostor's sound hook, `window.__sounds`): `ding` (own word), `thud` (nobody's, the other team's, a broken-rule
turn), `boom` (the Landmine), `chime` (time's up); peak gains of `thud`, `boom` and `chime` ≤ `ding`'s. Vibration 50 ms on every
reveal, 200 ms on the Landmine. The private map and the map phone make no sound and no vibration.

### SWD-098 One main button
At most one main button per screen, always the next step.

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
   interface Teams { orange: string[]; teal: string[]; clueGivers: { orange: string | null; teal: string | null }; names: { id: string; orange: string; teal: string }; guessOnly: string[] }
   // SetupInput: { gameId: 'secret-words', seeds: { deal: string, teams: string }, config: { players: string[], teams: Teams,
   //   splits: number, choices: SecretWordsChoices, excludedWords: { recent: string[] /* ids */ }, testBoards?: string[] } }
   type SecretWordsMove =
     | { type: 'deal'; code: string } | { type: 'dealNew'; code: string } | { type: 'mapSeen' }
     | { type: 'clue'; n: 0|1|2|3|4|5|6|7|8|9|'inf'; word?: string } | { type: 'reveal'; cell: number; freeCell?: number }
     | { type: 'endTurn' } | { type: 'brokeRule'; cell: number } | { type: 'nextTurn' } | { type: 'endGame' }
     | { type: 'setTeams'; teams: Teams; splits: number } | { type: 'setClueGivers'; clueGivers: Teams['clueGivers'] }
     | { type: 'setChoices'; choices: SecretWordsChoices } | { type: 'setPlayers'; players: string[]; teams: Teams }
     | { type: 'endEvening' };
   boardFromCode(code: string, words: readonly SecretWordsWord[]):
     { words: string[]; kinds: Kind[]; starts: Team; edition: number; board: 'full' | 'easy'; audience: 'family' | 'grownups' }
     | { error: 'invalid' | 'newer' };
   codeFor(cfg: { edition: number; board: 'full' | 'easy'; words: 'family' | 'grownups' }, deck: number, n: number): string; // 7 symbols, no hyphen
   pickDeck(dealSeed: string, k: number, candidates: readonly string[], avoid: ReadonlySet<string>): number;
   penaltyCell(state: SecretWordsState, dealSeed: string): number;
   nextMapCode(code: string, words: readonly SecretWordsWord[]): string | null;   // SWD-039
   reduceLetters(text: string): string;        // SWD-101 (NFKC, lower case, a–z only)
   parseMapCode(typed: string, words: readonly SecretWordsWord[]): string | 'invalid' | 'newer';
   readSecretWordsEvening(saved: SavedGame);
   readTestSeeds(raw: string | null, release: boolean): { deal?: string; teams?: string; boards?: string[] } | null;
   ```
   Views: room → `{ cells: { word: string; kind?: Kind }[], clueWord: string | null, clues: { team: Team; n: number | 'inf'; word?: string }[] (in force, this game), lastTurn: { team: Team; found: number; ended: 'rule' | 'stopped' | 'allowance' | 'nobody' | 'other'; cell?: number } | null` (kind only when turned over, or for every cell after game over)`,
   turn: Team, clue: number | 'inf' | null, guessesLeft: number | 'unlimited' | null, left: { orange: number; teal: number },
   step, winner: Team | null, endedEarly: boolean }`; `{ kind: 'player', playerId }` → the map only for a current clue giver,
   otherwise the room view. `isOver` is true after `endEvening`. `clue` is a detail move (`detailMoves: ['clue', …]`, free-text
   word); `canUndo` is always false; `forReport` blanks clue words (they may contain names).
   **Tap → move** (a tap not listed records nothing):

   | Tap | Records |
   |---|---|
   | Setup screens, team moves, Shuffle, "New team names", Undo on teams, the "Guesses only" switch (until the sheet's "Done"), choice cards, "Start", "Both have the map", "The map phone is ready", "I'm Riya", pad taps, number keys, the clue word, picks, "End our turn", "Oops, keep guessing", Hurry up, Stop timer, How to play, Show the map to a clue giver, "Our words", "See the map again", "Back to my clue", "Change clue" (until confirmed), "Keep my clue", "Clue broke a rule?" (opens the dialog), "↻", Earlier clues, "Next map" (map phone) | nothing |
   | "Let's play" / "Show me the board first" / "Deal the words" (new evening) | evening created, then `deal` |
   | "I have my clue" | `mapSeen` (once per turn) |
   | "Clue for N: start guessing" (also after "Change clue") | `clue {n, word}` |
   | "Reveal <WORD>" | `reveal {cell}` |
   | end-turn line's "Other team's turn" | `endTurn`, then `nextTurn` |
   | turn-over "Other team's turn" | `nextTurn` |
   | "Yes, it broke a rule" | `brokeRule {cell}` |
   | "End the game" (dialog) | `endGame` |
   | "Deal a new board" (dialog) | `dealNew {code}` |
   | "Play again" | `setClueGivers` (if they change), then `deal` |
   | Change teams → Next → "Deal the words" | `setTeams` (if changed), `setClueGivers` (if changed), `setChoices` (if changed), then `deal` |
   | Players sheet add, remove, or its Undo | `setPlayers` each |
   | "End the evening" (dialog), "Start new" | `endGame` (if mid-game), then `endEvening` |
   | "Discard" | the SavedGame is deleted |
2. **Seeds** from `localStorage['pgn.test.seeds']` in development and preview builds only (as Impostor):
   `{ "deal": "<seed>", "teams": "<seed>", "boards": ["27P3QX8", …] }`. `teams` is read on first entering Make teams for a
   new evening; `deal` and `boards` at evening creation. `boards[i]` is used for deal i + 1 and bypasses SWD-024; a code whose
   config doesn't match the choices is a test error. Without seeds: fresh random seeds per evening.
3. **Pointer input, clock** (180 s map hide, 800 ms ignore, 500 ms double tap and pad taps, 300 ms turn, 90 s timer, toasts, 6 h,
   12 h), **visibility, wake lock, vibration, sounds**: as Impostor's hooks 4–8.
4. **Test ids:** `main-button`, `resume-card`, `unfinished-games`, `team-bar`, `turn-heading`, `pass-name`, `hold-pad`,
   `privacy-cover`, `word-board`, `board-cell` (`data-index`), `map-grid`, `map-cell` (`data-index`), `map-qr`,
   `map-code-text`, `map-code-line`, `clue-prompt`, `clue-key`, `word-counts`, `turn-line`, `clue-line`, `tip`, `result-line`,
   `hurry-timer`, `game-heading`, `our-words`, `avoid-line`, `clue-word`, `clue-warning`, `clue-history`, `recap-line`, `board-check`, `dnd-tip`, `recommended`, `guess-only-tag`, `history-clues` (`word-board` and `map-grid` carry `data-angle`; `hold-pad` is named by its visible text), `tally`, `fun-line`, `saved-map`, `clue-giver-badge`, `turn-sideways`, `credit`, `history-game`,
   `history-round`, `announcer`, `undo-toast`, `toast`.
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
