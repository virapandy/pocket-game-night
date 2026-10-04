# Secret Words: scenarios (version 2, 4 October 2026)

Status: **SWD-001 to SWD-099 approved by the owner, 4 October 2026 (version 2).** SWD-200+ are direction, built later. Decisions K1–K18 decided by the owner (4 October, "follow the
recommendation"). Version 2 resolves every guess from the two-reader check (`docs/spec-rules.md` rule 12: a coder-reader
and a tester-reader, 4 October). After approval the tester copies these into `specs/secret-words/` (file names in each section
heading) and writes tests. Hand-over follows `docs/roadmap.md`: after Impostor's release.

**This file is binding: where `ux.md`, `lifecycle.md` or `guide.md` differ, this file wins.**
Phases: **Secret Words 1** = first release. **Secret Words later** = designed now, built later (SWD-200+).
Change classes (`docs/change-sop.md`): the deal, the map code, the board algorithm, saved evenings and the word list
format = **C3** (tests first: sections 02, 04 rules, 05, 06, SWD-099); screens = C1/C2.

**Funny team names (owner, 4 October, K25):** "Mango" and "Peacock" are retired. The teams are the orange team and the
teal team, with a random pair of funny names each evening (SWD-013, `team-names.csv`); icons are shapes (circle, diamond).
Result lines no longer name a team ("✓ Your word!", "✗ The other team's word!"); the turn-over button reads "Other team's turn".

**Board words (owner, 4 October, K24):** English, or Indian words known everywhere (test: Tirunelveli or Sivagangai, no Hindi);
35 words replaced in `words.csv` before edition 1 ships; How to play's example reads "(chai, dosa)".

**All names in English (owner, 4 October, K23):** the losing card is **the Ghost** (was "the Bhoot"); the board word Ghost
(SWDW-209) is replaced by Shadow. Sounds and icons unchanged.

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
  "or type: K7P-3QX" (now "or type: K7P-3QX4"), "Meena is now Mango's clue giver." (now part of the removal toast),
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
| **Team icon** | Our own SVG shapes: a filled circle (orange team), a filled diamond (teal team), a short dash (nobody), a ghost (the Ghost); `aria-hidden`, 16 × 16 px, top left of a cell, 2 px in. |
| **Kind** | `orange`, `teal`, `nobody` or `ghost`. |
| **Board** | **Full** = 25 words, 5 × 5; **Family** = 16 words, 4 × 4. Cells in row-major order, `data-index` 0 top left. |
| **Board screens** | The preview board (SWD-012), guessing (SWD-041), the end-turn line (SWD-044), turn over (SWD-045) and the board part of game over (SWD-051). |
| **Word text** | Every board and map word shows exactly as in the list (title case, e.g. "Kite"), in the app's body font stack, weight 600, never transformed. Elsewhere `<WORD>` is the same word upper case by CSS (`text-transform`), DOM text as in the list. |
| **Face down / turned over** | Not yet revealed / revealed. Turned over: fill in the kind's colour, the kind's icon and the word (white text on orange, teal and Ghost in light mode; `--text` on Nobody). |
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

Example players, typed in this order: **Riya, Arjun, Meena, Kabir, Zoya, Dev, Om**. Example words (edition 1):
Cricket, Bat, Monsoon, Kite, Tiffin, Mehendi.
Plurals: "1 word" / "2 words"; "1 guess" / "2 guesses"; "1 game" / "2 games"; "1 time" / "2 times".

---

## Canonical strings
| Where | Exact text | Element | ID |
|---|---|---|---|
| Home, under "Host a game" | "Tambola, Impostor or Secret Words on this phone" | text inside the button | SWD-001 |
| Picker card | "Secret Words" · "Inspired by Codenames · team word hunt · 4–20 players · about 15 min a game" | button, name starts "Secret Words" | SWD-001 |
| Picker resume card | "Secret Words · game 2 · Tap to resume" | `resume-card` | SWD-001 |
| Start new | dialog "Start a new evening? The evening from 8:40 pm will be ended." with "Start new" / "Carry on that evening" (main) | dialog | SWD-001 |
| Home unfinished row | "Secret Words, 8:40 pm, game 2" and "Tap to resume" | inside `unfinished-games` | SWD-062 |
| Join screen | after Impostor's line: "Playing Secret Words? Clue givers: scan the host's map code. Everyone else: just play along!"; quiet "I have a map code" | paragraph; button | SWD-002 |
| Code entry | heading "Type the map code"; label "Map code"; placeholder "K7P-3QX4"; main "Open the map"; errors "That code doesn't look right. Check it with the host." · "This map needs a newer version of the app. Open the app once with internet, then try again." | h1; input; main; `role="alert"` | SWD-002 |
| Who's playing? | heading "Who's playing?"; "Add at least 4 players." · "20 players is the most." · Impostor's duplicate message | h1; `role="alert"` | SWD-003 |
| Make teams | heading "Make teams"; h2s "Chai Champions (4)" / "Coffee Commandos (3)", each with its team icon and the small line "Orange team" / "Teal team"; badge "Clue giver"; small line "Tap a name to move it to the other team."; quiet "Shuffle teams", "New team names", "Change clue givers"; main "Next"; alert "Each team needs at least 2 players." | h1; h2; `clue-giver-badge`; small line; buttons; `role="alert"` | SWD-004–008 |
| Team toasts | "Om moved to Coffee Commandos · Undo" · "Teams shuffled · Undo" · "New team names · Undo" | `undo-toast` | SWD-005, 006, 013 |
| Clue givers sheet | dialog "Clue givers"; groups "Chai Champions" / "Coffee Commandos"; one button per player; main "Done" | dialog; `role="group"`; buttons with `aria-pressed` | SWD-007 |
| Choices | heading "How do you want to play?"; small line "Same as last time" (carried over); groups "How do clue givers see the map?", "Board", "Words"; main "Deal the words" | h1; small line; `role="group"` | SWD-009 |
| Map cards | "Pass this phone" + "One phone. The clue giver holds it to see the map." · "Clue givers' own phones" + "They scan a code. Works without internet." | buttons with `aria-pressed` | SWD-009 |
| Options | "Full: 25 words" / "Family: 16 words"; "Whole family" / "+ Grown-ups" | buttons with `aria-pressed` | SWD-009 |
| Option lines | Full "9 and 8 words to find, 7 nobody's, 1 Ghost." · Family "6 and 5 words to find, 5 nobody's, no Ghost." · Whole family "Words kids and grandparents know." · + Grown-ups "Adds words kids or elders may not know." | small line under the group | SWD-009 |
| Read this aloud | heading "Read this aloud"; 4 lines (SWD-010); main "Let's play"; quiet "Show me the board first" | h1; `ol` of 4 `li` | SWD-010 |
| How to play | heading "How to play"; h2 "Read this aloud" + the 4 lines; h2 "The rules" + 8 lines (SWD-011); small line `credit` (SWD-011); main "Done" | h1; h2; `ol`; small line | SWD-011 |
| Preview board | `turn-line` "Chai Champions start"; counts; main "Start" | paragraphs; main | SWD-012 |
| Scan screen | heading "Clue givers, scan your map"; "Riya (Chai Champions, orange) and Arjun (Coffee Commandos, teal)"; QR; "or type: K7P-3QX4"; small line "Everyone else: look away from their phones."; main "Both have the map" | h1; paragraph; `map-qr` (`img`, name "Map code K7P-3QX4"); `map-code-text`; small line; main | SWD-033 |
| Pass screen | heading "Chai Champions, your turn"; "Pass the phone to"; `<NAME>`; "Clue giver for Chai Champions (orange)"; quiet "Hurry up: 90 s"; main "I'm Riya" | h1 `turn-heading`; paragraph; `pass-name`; paragraph; button; main | SWD-030 |
| Welcome back | "Welcome back." above the pass screen | paragraph | SWD-032 |
| Private map | heading `<NAME>`; small line "You give clues for Chai Champions (orange)"; counts; pad "Hold here to see the map"; quiet "Tap instead"; tap mode "Tap to see the map" / "Tap to hide"; main "I have my clue" (SWD-037: "Done, hide the map") | h1; small line; `hold-pad`; button; main | SWD-031 |
| Map phone | heading "Secret Words map"; "Code K7P-3QX4 · Orange team starts"; small line "Tap a word once it's turned over, to fade it."; quiet "Hide map" / "Show map"; quiet "Done with this game" | h1; `map-code-line`; small line; buttons | SWD-034 |
| Map phone dialog | "Clear this map from your phone?" with "Clear map" / "Keep it" (main) | dialog | SWD-036 |
| Map phone toast | "New map. The old one was cleared." | `toast` | SWD-036 |
| Saved map row (Home) | "Secret Words map K7P-3QX4 · Tap to open" (button) · older: "Secret Words map K7P-3QX4" with "Open" / "Clear" | `saved-map` | SWD-036 |
| Clue screen | heading "Chai Champions, your turn"; "Riya, say your clue out loud. How many words is it for?"; keys "0"…"9", "∞"; counts; tip "One word, one number. No faces, no pointing!"; quiet "Hurry up: 90 s"; main "Pick a number" (disabled) / "Clue for 2: start guessing" / "Clue for 0: start guessing" / "Clue for ∞: start guessing" | h1 `turn-heading`; paragraph `clue-prompt`; `clue-key` buttons with `aria-pressed`; `word-counts`; small line `tip`; button; main | SWD-040 |
| Counts | circle icon "9 left" · diamond icon "8 left" (visible text "9 left · 8 left"; accessible name "Chai Champions: 9 words left. Coffee Commandos: 8 words left."); landscape board panel: two lines | `word-counts` | SWD-040, 043 |
| Board status | `turn-line` "Chai Champions guessing"; `clue-line` "Clue: 2 · 3 guesses left" / "Clue: 1 · 1 guess left" / "Clue: ∞ · guess as many as you like" / "Clue: 0 · guess as many as you like" | paragraphs | SWD-041 |
| First-guess tip | "Tap a word, then Reveal. You can take one more than the number." | small line `tip` | SWD-041 |
| Board buttons | quiet "End our turn"; main "Reveal" (disabled) / "Reveal <WORD>" | button; main | SWD-042, 044 |
| Result lines | SWD-043 table; end-turn "Chai Champions ended their turn."; quiet "Oops, keep guessing" | `result-line`; button | SWD-043, 044 |
| Turn-over main | "Other team's turn" | main | SWD-045 |
| Broke a rule | dialog "That clue broke a rule? This turn ends and one of the other team's words is turned over." with "Yes, it broke a rule" / "Cancel" (main); result line "Clue broke a rule. One of the other team's words was turned over." | dialog; `result-line` | SWD-046 |
| Timer | `hurry-timer` "1:30" … "0:01", then "Time's up!", or "Paused"; button / menu item "Hurry up: 90 s" ↔ "Stop timer" | span; button | SWD-047 |
| Game over | heading "Chai Champions win!"; line "All 9 words found." / "Coffee Commandos woke the Ghost!"; ended early: heading "Game ended. No winner."; tally; main "Play again"; quiet "Change teams", "End the evening" | h1 `game-heading`; `result-line`; `tally`; buttons | SWD-050–054 |
| Deal new | dialog "Deal a new board? This board won't count. Same teams and clue givers." with "Deal a new board" / "Keep playing" (main) | dialog | SWD-055 |
| End game | dialog "End this game with no winner?" with "End the game" / "Keep playing" (main) | dialog | SWD-054 |
| End evening | dialog "End the evening? Tonight's tally stays in History." (mid-game: "End the evening? This game won't count.") with "End the evening" / "Keep playing" (main) | dialog | SWD-060 |
| Summary | heading "Tonight's Secret Words"; tally; fun lines; main "Play something else"; quiet "Back to Home"; menu "Discard this evening" | h1; `tally`; `fun-line` each; buttons | SWD-060, 065 |
| Discard | dialog "Discard this evening? Its games and tally will be lost." with "Discard" / "Keep it" (main) | dialog | SWD-065 |
| Players sheet | dialog "Players"; h2s "Chai Champions" / "Coffee Commandos"; names with "Remove Kabir" (✕); label "Player name", placeholder "Type a name…", button "Add"; main "Done"; toasts "Kabir left · Undo" · "Riya left · Meena is the new clue giver · Undo" | dialog; buttons; input; `undo-toast` | SWD-061 |
| Show the map sheet | dialog "Show the map to"; buttons "Riya (Chai Champions)", "Arjun (Coffee Commandos)"; quiet "Cancel" | dialog | SWD-037 |
| Sideways | "Turn your phone sideways to see the board." | paragraph `turn-sideways` (body text) | SWD-092 |
| History | "Secret Words · 3 games"; "Game 2 · Chai Champions won · Riya and Arjun gave clues"; "Game 2 · Chai Champions won, Coffee Commandos woke the Ghost · Riya and Arjun gave clues"; "Game 3 · Ended early · Meena and Kabir gave clues" | `history-game`; `history-round` | SWD-064 |
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
| Clue screen | ✓ | — (button on screen) | — | ✓ | own phones only | ✓ | ✓ | ✓ | ✓ | ✓ |
| Guessing | ✓ | ✓ | ✓, disabled outside SWD-046's window | ✓ | own phones only | ✓ | ✓ | ✓ | ✓ | ✓ |
| End-turn line, turn over | ✓ | — | — | ✓ | own phones only | ✓ | ✓ | ✓ | ✓ | ✓ |
| Game over | ✓ | — | — | ✓ | — | — | — | — | ✓ | ✓ |
| Summary | only "Discard this evening" | | | | | | | | | |

**Back:** "← Back" on setup screens: Who's playing? → the picker; Make teams → Who's playing?; Choices → Make teams;
Read this aloud → Choices; code entry → the Join screen; map phone → Home. Make teams keeps its teams across "← Back"
(SWD-004). During a game there is no "← Back", and the browser's or phone's Back does nothing (the existing back guard).

---

## 01 Setup → `specs/secret-words/01-setup.md`

### SWD-001 Picking Secret Words
Home's "Host a game" reads "Tambola, Impostor or Secret Words on this phone". Its picker "What shall we play?" shows three cards
of equal width and height (±1 px) in the order Tambola, Impostor, Secret Words; tapping Secret Words opens "Who's playing?". With an
unfinished Secret Words evening its resume card shows above the cards (after Impostor's, if both are unfinished); tapping the
Secret Words card then opens the "Start new" dialog: "Start new" ends that evening (SWD-067) and opens "Who's playing?";
"Carry on that evening" resumes it.

### SWD-002 The Join screen and the map code
The Join screen keeps Impostor's line, then Secret Words's line, then quiet "I have a map code", which opens the code entry.
Input: `autocapitalize="characters"`, `maxlength="12"`. The typed text is read with spaces and hyphens removed and letters
upper-cased. "Open the map" is disabled while that leaves fewer than 7 characters. On tap:
1. not exactly 7 characters, any character outside the alphabet (0, O, 1, I, L included), or a wrong check symbol
   (SWD-022), or a deal index too large for its edition → "That code doesn't look right. Check it with the host.", typed
   text kept;
2. a config symbol for an edition this app doesn't have (value ≥ 4 while the app has only edition 1) → "This map needs a
   newer version of the app. Open the app once with internet, then try again.";
3. otherwise the map phone opens (SWD-034).
**The QR link** `<origin><BASE_URL>#map=K7P3QX4` (`BASE_URL` = the app's base, e.g. `/pocket-game-night/` or `/preview/`)
opens the map phone directly; the hash is then removed from the address. An invalid code in the link opens the code entry
with it filled in and the error shown. Opening a map never changes an unfinished host evening on that phone.

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
Three groups, each showing only its chosen option's line (the map cards always show their own text).
**Map**: two equal cards (±1 px), none selected the first time on this phone, so "Deal the words" is disabled until one is
tapped. **Board**: Full (default) / Family. **Words**: Whole family (default) / + Grown-ups. A new evening starts from this
phone's last-used values for all three (SWD-066), with "Same as last time" under the heading. "Deal the words": if the
read-aloud card is due (SWD-010) it opens; otherwise it deals at once (in a new evening, the evening is created then).
Between games the choices change only through "Change teams" → "Next" → this screen (SWD-056).

### SWD-010 Read this aloud
Due when no Secret Words game has been dealt yet in the current session (PLT-016); checked when "Deal the words" is tapped in a
new evening. Lines: 1 "Two teams, Chai Champions and Coffee Commandos. Each has a clue giver who sees the secret map." (the evening's names) 2 "Clue givers: say
one word and a number. 'Monsoon, 2' means two of our words go with monsoon." 3 "Guessers: talk, then turn over words one at
a time. Wrong word? Your turn ends." 4 "Find all your words first. Turn over the Ghost and you lose!" (Family: "Find all your
words first!"). "Let's play" deals; "Show me the board first" deals and opens the preview board (SWD-012).

### SWD-011 How to play (detail of SWD-010)
Menu → "How to play": h2 "Read this aloud" and its 4 lines, then h2 "The rules": 1 "Clue givers see the secret map.
Everyone else sees only the words." 2 "A clue is one word and one number. It must be about meaning, not spelling or where a
word sits." 3 "Don't say a word that is still face down on the board, or part of one." 4 "English, or a word you'd use in
an English sentence (chai, dosa), is fine. Names like Taj Mahal count as one word." 5 "No faces, no pointing, no extra
hints. The other clue giver judges a clue before the first guess." 6 "Guessers take at least one guess, and up to the number
plus one. 0 or ∞: as many as you like." 7 "Your word: keep going. Nobody's word or the other team's: your turn ends. The
Ghost: you lose!" (Family: without "The Ghost: you lose!") 8 "First team to find all its words wins." Then the small line `credit`: "Secret Words uses game rules inspired by
Codenames, designed by Vlaada Chvátil. Codenames is a trademark of Czech Games Edition. Secret Words is an independent free
game and is not made, sponsored or endorsed by Czech Games Edition." (plain text, no styling; `docs/games/secret-words/legal.md`) Main "Done" returns.
The page may scroll. Nothing about the map appears.

### SWD-012 The preview board (detail of SWD-010)
After "Show me the board first": the board with every cell locked, `turn-line` "Chai Champions start" (the starting team), the
counts, and main "Start", which leads to the scan screen (own phones) or the pass screen (one phone). No clue line, no tips.

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

---

## 02 The deal and its secrets → `specs/secret-words/02-deal.md` (C3)

### SWD-020 What a board holds
Full: 25 distinct words; starting team 9, other 8, nobody 7, Ghost 1. Family: 16 distinct words; 6, 5, 5, 0.
**Property:** for 10,000 random valid codes of each size, exactly these counts and all words distinct.

### SWD-021 Who starts
**Property:** over 10,000 random valid codes, each team starts between 48% and 52% of boards.

### SWD-022 The map code
Symbols (values 0–30): **1 config** = (edition − 1) × 4 + (Family ? 2 : 0) + (+ Grown-ups ? 1 : 0) (edition 1: 0–3);
**2 deal index** n (0–30, the board's place in the deck, SWD-024); **3–6 deck seed** d (0 to 31⁴ − 1 = 923,520, base 31,
most significant first); **7 check** = (1·v1 + 2·v2 + 3·v3 + 4·v4 + 5·v5 + 6·v6) mod 31. Shown "K7P-3QX4".
**The board from a code** (`boardFromCode`), a pure function of the code and the shipped list:
1. `candidates` = rows with `edition` ≤ e and (`retired_in` blank or > e); for Whole family only rows with `audience` =
   family; in `words.csv` row order.
2. `deck` = ``shuffle(candidates, createRng(`secret-words:deck:${d}`))`` (the engine's `shuffle`).
3. `words` = `deck.slice(25·n, 25·n + size)` (size 25 or 16; Family boards also step by 25).
4. `r` = ``createRng(`secret-words:board:${d}:${n}`)``; `starts` = `r.int(2) === 0 ? 'orange' : 'teal'`; then `kinds` =
   `shuffle([starts × 9, other × 8, nobody × 7, ghost × 1], r)` (Family 6, 5, 5, 0), in that order of draws.
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
At the start of each turn in "Pass this phone" mode: team bar; heading "Chai Champions, your turn" with the team icon; "Pass the phone
to"; `pass-name` RIYA at 48 px, shrinking in 1 px steps to 32 px to fit one line, and wrapping onto 2 lines at 32 px if it
still doesn't fit; "Clue giver for Chai Champions (orange)"; quiet "Hurry up: 90 s"; main "I'm Riya".

### SWD-031 One phone: the private map
After "I'm Riya": heading RIYA; small line "You give clues for Chai Champions (orange)"; the counts; the map area (the board's layout,
SWD-090/091, empty while hidden); pad "Hold here to see the map" (at least 200 × 96 px; portrait: under the map area, its
bottom at least 8 px above the main button's slot; landscape: in a 200 px column at the right, 16 px from the edge); quiet
"Tap instead"; no menu, no team bar.
- `pointerdown` on the pad shows the map; `pointerup`, `pointercancel` or `pointerleave` removes it from the page at once.
  Only the first pointer counts.
- The shown map: every cell with its word text, kind colour and icon; cells already turned over at 40% opacity with the
  word struck through (accessible name adds ", found").
- "Tap instead" (or the app's "Tap to show instead of hold" setting, IMP-014) puts the pad in tap mode for this turn: "Tap to
  see the map" shows it; "Tap to hide" hides it; it also hides at t = 60 000 ms after the latest `pointerdown` anywhere on
  this screen.
- Main "I have my clue" first appears on the release that ends a hold of at least 500 ms (pointerdown to pointerup; exactly
  500 counts), or at the first tap-show; then it stays. It never shows during the first hold. Tapping it removes the map and
  opens the clue screen.
- No text selection, callout, magnifier, context menu or drag on the pad or the map. No sound, no vibration.
- Narrow portrait: only "Turn your phone sideways to see the board." under the heading and small line; no pad until turned.

### SWD-032 Leaving a map screen
On `visibilitychange` to hidden on the private map or the map phone: a full-screen `privacy-cover` appears and the map is
removed in the same task. Back on the host: the pass screen for the same player with "Welcome back." above it. Reload or resume
does the same.

### SWD-033 Own phones: scan the map
After each deal (after the preview's "Start", if shown) in own-phones mode: the scan screen (strings above), QR at least
200 × 200 px encoding `<origin><BASE_URL>#map=<code>` (no hyphen). The orange team's clue giver is named first. "Both have the map"
opens the starting team's clue screen. Resuming any time before the board's first clue shows the scan screen again. The
host never shows the map in this mode until game over, except through SWD-037.

### SWD-034 The map phone
Heading "Secret Words map"; `map-code-line` "Code K7P-3QX4 · Orange team starts" (a map phone knows colours, not names); the map grid (`map-grid`, cells `map-cell` with
`data-index`, in the host board's order, each with word text, kind colour and icon, laid out and sized as the board,
SWD-090/091, without the panel); the small line; quiet "Hide map" / "Show map"; quiet "Done with this game". No main button,
no menu; "← Back" → Home. The map shows on opening; after the app has been hidden it returns hidden, with "Show map". Wake
lock while shown. Narrow portrait: "Turn your phone sideways to see the board." in place of the grid, buttons kept.
Landscape: grid at the left; heading, code line and buttons in a 200 px column at the right. The host's game ending changes
nothing here. Larger text follows this phone's own setting.

### SWD-035 Fading found words
Tapping a map cell toggles **found** (40% opacity, word struck through, accessible name adds ", found") on this phone only,
saved with the map. A second tap within 500 ms does nothing.

### SWD-036 Clearing and replacing maps
This phone keeps at most one map (`pgn.secretWords.map` = `{ code, savedAt, found: number[] }`; `savedAt` = when the code was
first opened). "Done with this game" → dialog → "Clear map" removes it and opens Home. Opening a different code replaces it,
with the toast "New map. The old one was cleared."; opening the same code opens it with its found marks and no toast. Home
shows a saved map as `saved-map`: a button "Secret Words map K7P-3QX4 · Tap to open"; more than 6 hours after `savedAt`, the
text "Secret Words map K7P-3QX4" with buttons "Open" and "Clear" ("Clear" opens the same dialog). The app never opens a saved map
by itself.

### SWD-037 Showing the map on the host (own phones)
Menu → "Show the map to a clue giver" → sheet with the two current clue givers → a name: SWD-030 and SWD-031 for that player,
with main "Done, hide the map", which returns to the step the game was on.

### SWD-038 Larger text on map screens (detail of SWD-031, SWD-034)
Larger text changes the heading and lines, never the map's word size (SWD-090).

---

## 04 Clues and guesses → `specs/secret-words/04-play.md` (rules C3, screens C2)

### SWD-040 The clue
Team bar; heading "Chai Champions, your turn"; `clue-prompt` "Riya, say your clue out loud. How many words is it for?" (fits in 3 lines);
keys; counts; on the evening's first turn of its first game only, the tip; quiet "Hurry up: 90 s"; main.
Keys `clue-key`: portrait 0–4 and 5–9 in two rows, then "∞" full width; each 56 × 56 px (∞ 56 px tall), gaps 2 px at 320 px
wide and 8 px from 360 px up. 812 × 375: one row of 11 keys (0–9, ∞), 56 × 56, 6 px gaps. 568 × 320: one row of 11, 44 × 44,
4 px gaps. "∞" shows "∞" only; accessible name "As many as you like" (accepted exception to WCAG 2.5.3). A tap selects a key
(selected look); another tap moves the pick. Main "Pick a number" (disabled), then "Clue for 2: start guessing" (0: "Clue
for 0: start guessing"; ∞: "Clue for ∞: start guessing"). No page scrolling at every size, except 320 × 568 with Larger
text, where the content above the fixed main button scrolls inside.

### SWD-041 Guessing and the allowance
After the clue: team bar, `turn-line` "Chai Champions guessing" (at most 2 lines), `clue-line`, counts, the board, the tip on the evening's first turn of
its first game (hidden from that turn's first guess on), quiet "End our turn", main. The clue line counts down while guesses
remain: "Clue: 2 · 3 guesses left" → "Clue: 2 · 2 guesses left" → "Clue: 2 · 1 guess left". **Property:** no turn records
more guesses than its allowance, and none ends by "End our turn" before one guess.

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
| The Ghost | none | Game over at t = 300 ms: the other team wins |
Result lines name no team, so every name fits. The last-word and Ghost rows win over the others.

### SWD-044 Ending the turn early
"End our turn" is disabled until the team has made a guess this turn. A tap shows the end-turn line: cells locked, result
line "Chai Champions ended their turn.", quiet "Oops, keep guessing" (back to guessing; nothing recorded), main "Other team's turn"
(records the end of the turn and the next turn). A running timer stops when the line shows.

### SWD-045 Turn over
Cells locked (not greyed), the result line stays, the clue line and tip are removed, "End our turn" is hidden, main
"Other team's turn": one phone → the pass screen for the other team's clue giver; own phones → the other team's clue screen.

### SWD-046 A clue that broke a rule
Menu item enabled from the clue until the turn's first guess; disabled otherwise. Dialog → "Yes, it broke a rule": the turn
ends; `list` = the other team's face-down cells in cell order; cell =
``list[createRng(`${seeds.deal}:penalty:${D}:${T}`).int(list.length)]`` (D = deal number of the evening, T = turn number on
this board); that cell turns over as SWD-043 (vibration 50 ms, the `thud` sound). Result line "Clue broke a rule. One of
the other team's words was turned over." and turn over; if it was that team's last word: game over, that team wins.

### SWD-047 Hurry up: 90 s
"Hurry up: 90 s" (buttons on the pass and clue screens; menu item while guessing) starts the timer: `hurry-timer` at 28 px in
the top bar left of "··· Menu" (portrait), at the top of the panel (landscape board), at the top right of the private map. It
reads "1:30" at t = 0, "1:29" at t = 1 s, … "0:01" at t = 89 s, and "Time's up!" from t = 90 s (with the chime, sound on);
"0:00" never shows. The button or menu item then reads "Stop timer", which removes the timer. A timer started on the pass
screen keeps running on the private map and the clue screen. Nothing else ever happens because of the timer. It is removed
when the clue is given, at the end-turn line, at turn over, on "Deal a new board", "End the game" and game over. When the app
is hidden it shows "Paused" and the button or item reads "Hurry up: 90 s" (which restarts at 1:30). It is not saved: after a
reload there is no timer.

### SWD-048 Reload during play (detail)
Only moves are saved, plus the step (`pgn.secretWords-ui.<id>`: preview, scan, pass, map, end-turn line). A reload returns to
the last step with the last reveal's result line; picks, the selected key, open dialogs and menus, the timer and tap mode
are lost; a private map returns to its pass screen with "Welcome back.".

### SWD-049 Double taps (detail)
Every button that records a move ignores another tap for 800 ms after a tap; picks and key choices follow the last tap.

---

## 05 Winning and the night → `specs/secret-words/05-results.md` (C3)

### SWD-050 Who wins
A team wins when all its words are turned over (by either team, or SWD-046). Turning over the Ghost makes the other team win.
**Property:** every one of 10,000 random scripted games ends with exactly one winner, or ended early.

### SWD-051 Game over
Heading "Chai Champions win!"; line "All 9 words found." (the winner's total: 9, 8, 6 or 5) or, for the Ghost, "Coffee Commandos woke the
Ghost!" (the losing team); the whole map: turned-over cells as before, face-down cells now in their kind's colour and icon
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
most won games, at least 1; tie: the one who reached that count first) and "The Ghost woke up 1 time" (at least 1); main
"Play something else" (the picker, tonight's names kept); quiet "Back to Home". An ended evening never reopens; an evening
with no game at all is deleted, otherwise it stays in History.

### SWD-061 Players during a game
Menu "Players" (sheet; changes apply at once): "Add" puts a name in the smaller team (orange if equal) as a guesser from now on;
Impostor's duplicate message; "20 players is the most.". "Remove Kabir" removes a guesser with "Kabir left · Undo" (Undo puts
them back in place). Removing a clue giver makes the team's next player in list order (wrapping to the first) its clue giver,
with "Riya left · Meena is the new clue giver · Undo"; if that team is on its pass, private map or clue step in one-phone mode,
its pass screen restarts for Meena; once guessing has started, the turn carries on. In own-phones mode the new clue giver uses
SWD-037. "Remove" is disabled for every player of a team of 2.

### SWD-062 Leaving and resuming
Every move is saved. Home's row "Secret Words, 8:40 pm, game 2" (the evening's start, phone's local time, "pm" lower case, no
leading zero; game number per Terms). "Tap to resume" returns to the same step (SWD-048).

### SWD-063 The 12-hour limit
When the app opens or Home shows, an evening whose last move is more than 12 hours old ends: `endGame` (if a game was in
progress) and `endEvening`, both at the last move + 12 hours. No summary shows.

### SWD-064 History
Evening row "Secret Words · 3 games" (won and ended early). Game rows: "Game 2 · Chai Champions won · Riya and Arjun gave clues"; Ghost: "Game
2 · Chai Champions won, Coffee Commandos woke the Ghost · Riya and Arjun gave clues"; "Game 3 · Ended early · Meena and Kabir gave clues"
(credited clue givers, the orange team's first). Tapping a game row opens its board with the whole map ("← Back" to the evening).

### SWD-065 Discard the evening
Summary menu "Discard this evening" → dialog → "Discard": the evening is deleted and Home opens. No undo.

### SWD-066 Saved choices (detail of SWD-009)
`pgn.pref.secretWords.lastChoices` = `{ map, board, words }`, written at each deal. Unreadable or missing → the first-time state.

### SWD-067 Start new (detail of SWD-001)
"Start new" records `endGame` (if a game was in progress) and `endEvening` for the old evening, then opens "Who's playing?"
for a new evening. No summary shows.

---

## 09 Usability → `specs/secret-words/09-usability.md` (C1/C2)

### SWD-090 Board text and portrait layout
Portrait board: 8 px side margins, 4 px gaps; cells (width − 16 − gaps) / columns wide (Full at 360: 65.6 px; at 390: 71.6
px). Cell height 56 px, shrinking to no less than 48 px so the page doesn't scroll. One font size for all words of a board:
the largest whole px from 22 down to 12 at which every word fits in 1 line within its cell minus 4 px padding each side.
Larger text doesn't change it. Status lines: `turn-line` 1 line, `clue-line` at most 2, counts 1, `result-line` at most 2
(it replaces the tip). No page scrolling at 360 × 640 and 390 × 844, Larger text off and on.

### SWD-091 Landscape board
812 × 375: grid at the left (margins 16 px left and bottom, 8 px under the team bar); a 200 px panel at the right (16 px right
margin, 12 px gap): at its top `hurry-timer` and "··· Menu", then `turn-line`, `clue-line`, counts (two lines),
`result-line` and tip in a middle part that scrolls inside if needed, then "End our turn" (200 × 48) and the main button
(200 × 60) pinned at the bottom. Cells at least 100 × 56 px. The main button's text may shrink to 17 px to fit.
568 × 320: the same with 8 px margins, a 160 px panel (main 160 × 60) and an 8 px gap; cells at least 69 × 54 px. No page
scrolling.

### SWD-092 Narrow portrait
On the board screens, the private map and the map phone, narrow portrait shows `turn-sideways` in place of the grid; the other
parts of the screen stay (on the board, "Reveal" stays disabled). Turning to landscape shows the grid. All other screens work at
320 × 568 portrait.

### SWD-093 Never colour alone
Every turned-over cell and every map cell has its kind's icon and an accessible name: "Kite, orange team" / "Kite, teal
team" / "Kite, nobody's word" / "Kite, the Ghost" (+ ", found" or ", not found" where SWD-031, SWD-035 and SWD-051 say).

### SWD-094 Targets
Every button at least 44 × 44 px; board cells per SWD-090/091; keys per SWD-040.

### SWD-095 Screen readers
The announcer reads: the clue ("Clue for Chai Champions: 1 word" / "2 words" / "0 words" / "as many as you like"); each result line; at
turn over "Other team's turn"; at game over the heading then the line ("Chai Champions win! All 9 words found."). It never announces the
map. Map cells are reachable by name only on map screens.

### SWD-096 Reduce motion
With `prefers-reduced-motion: reduce`: no cell turn and no animations (`document.getAnimations().length === 0` on board
screens); everything else the same.

### SWD-097 Sound and vibration
Sounds (Impostor's sound hook, `window.__sounds`): `ding` (own word), `thud` (nobody's, the other team's, a broken-rule
turn), `boo` (the Ghost), `chime` (time's up); peak gains of `thud`, `boo` and `chime` ≤ `ding`'s. Vibration 50 ms on every
reveal, 200 ms on the Ghost. The private map and the map phone make no sound and no vibration.

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
   type Team = 'orange' | 'teal'; type Kind = Team | 'nobody' | 'ghost';
   interface SecretWordsChoices { map: 'pass' | 'own'; board: 'full' | 'family'; words: 'family' | 'grownups' }
   interface Teams { orange: string[]; teal: string[]; clueGivers: { orange: string | null; teal: string | null }; names: { id: string; orange: string; teal: string } }
   // SetupInput: { gameId: 'secret-words', seeds: { deal: string, teams: string }, config: { players: string[], teams: Teams,
   //   splits: number, choices: SecretWordsChoices, excludedWords: { recent: string[] /* ids */ }, testBoards?: string[] } }
   type SecretWordsMove =
     | { type: 'deal'; code: string } | { type: 'dealNew'; code: string } | { type: 'mapSeen' }
     | { type: 'clue'; n: 0|1|2|3|4|5|6|7|8|9|'inf' } | { type: 'reveal'; cell: number }
     | { type: 'endTurn' } | { type: 'brokeRule'; cell: number } | { type: 'nextTurn' } | { type: 'endGame' }
     | { type: 'setTeams'; teams: Teams; splits: number } | { type: 'setClueGivers'; clueGivers: Teams['clueGivers'] }
     | { type: 'setChoices'; choices: SecretWordsChoices } | { type: 'setPlayers'; players: string[]; teams: Teams }
     | { type: 'endEvening' };
   boardFromCode(code: string, words: readonly SecretWordsWord[]):
     { words: string[]; kinds: Kind[]; starts: Team; edition: number; board: 'full' | 'family'; audience: 'family' | 'grownups' }
     | { error: 'invalid' | 'newer' };
   codeFor(cfg: { edition: number; board: 'full' | 'family'; words: 'family' | 'grownups' }, deck: number, n: number): string; // 7 symbols, no hyphen
   pickDeck(dealSeed: string, k: number, candidates: readonly string[], avoid: ReadonlySet<string>): number;
   penaltyCell(state: SecretWordsState, dealSeed: string): number;
   parseMapCode(typed: string): string | 'invalid' | 'newer';
   readSecretWordsEvening(saved: SavedGame);
   readTestSeeds(raw: string | null, release: boolean): { deal?: string; teams?: string; boards?: string[] } | null;
   ```
   Views: room → `{ cells: { word: string; kind?: Kind }[]` (kind only when turned over, or for every cell after game over)`,
   turn: Team, clue: number | 'inf' | null, guessesLeft: number | 'unlimited' | null, left: { orange: number; teal: number },
   step, winner: Team | null, endedEarly: boolean }`; `{ kind: 'player', playerId }` → the map only for a current clue giver,
   otherwise the room view. `isOver` is true after `endEvening`.
   **Tap → move** (a tap not listed records nothing):

   | Tap | Records |
   |---|---|
   | Setup screens, team moves, Shuffle, Undo on teams, choice cards, "Start", "Both have the map", "I'm Riya", holds, taps, number keys, picks, "End our turn", "Oops, keep guessing", Hurry up, Stop timer, How to play, Show the map to a clue giver | nothing |
   | "Let's play" / "Show me the board first" / "Deal the words" (new evening) | evening created, then `deal` |
   | "I have my clue" | `mapSeen` |
   | "Clue for N: start guessing" | `clue {n}` |
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
   `{ "deal": "<seed>", "teams": "<seed>", "boards": ["K7P3QX4", …] }`. `teams` is read on first entering Make teams for a
   new evening; `deal` and `boards` at evening creation. `boards[i]` is used for deal i + 1 and bypasses SWD-024; a code whose
   config doesn't match the choices is a test error. Without seeds: fresh random seeds per evening.
3. **Pointer input, clock** (500 ms hold, 60 s tap mode, 800 ms ignore, 500 ms double tap, 300 ms turn, 90 s timer, toasts, 6 h,
   12 h), **visibility, wake lock, vibration, sounds**: as Impostor's hooks 4–8.
4. **Test ids:** `main-button`, `resume-card`, `unfinished-games`, `team-bar`, `turn-heading`, `pass-name`, `hold-pad`,
   `privacy-cover`, `word-board`, `board-cell` (`data-index`), `map-grid`, `map-cell` (`data-index`), `map-qr`,
   `map-code-text`, `map-code-line`, `clue-prompt`, `clue-key`, `word-counts`, `turn-line`, `clue-line`, `tip`, `result-line`,
   `hurry-timer`, `game-heading`, `tally`, `fun-line`, `saved-map`, `clue-giver-badge`, `turn-sideways`, `credit`, `history-game`,
   `history-round`, `announcer`, `undo-toast`, `toast`.
5. **QR reading in tests** needs a QR decoder in the test tools (for example jsQR): a tooling request from the tester.

---

## Secret Words later (direction, built later)
- **SWD-200** 2–3 players together against the phone (the official co-op variant).
- **SWD-201** Picture boards for children who can't read.
- **SWD-202** Regional word themes; each player's own script on the map phone.
- **SWD-203** Board on the TV.
- **SWD-204** "My pick" on guessers' phones (connected mode).
