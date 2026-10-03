# Ishaara: scenarios (version 1, draft, 4 October 2026)

Status: **draft; decisions K1–K18 decided by the owner (4 October).** Written to `docs/spec-rules.md`. The two-reader
check (rule 12) is running; its results go into version 2, which goes to the owner for approval.
After approval the tester copies these into `specs/ishaara/` (file names in each section heading) and writes tests.
Hand-over follows the roadmap (`docs/roadmap.md`): after Impostor's release.

**This file is binding: where `ux.md`, `lifecycle.md` or `guide.md` differ, this file wins.**
Phases: **Ishaara 1** = first release (one phone or clue givers' own phones, offline, `words.csv` edition 1).
**Ishaara later** = designed now, built later (ISH-200+).
Change classes (`docs/change-sop.md`): the deal, the map, the map code, saved evenings and the word list format = **C3**
(tests first; sections 02, 05, 06 and ISH-099); screens = C1/C2.

---

## Terms
Every scenario uses these words with exactly these meanings. Terms already defined in
`docs/games/impostor/scenarios.md` (main button, quiet button, selected, tint, greyed, disabled, small line, body text,
toast, dialog, Larger text, fits in N lines, no page scrolling, names, plurals, t = …, sound on) **mean exactly the same
here**, with one change: Ishaara's main button in landscape is described in ISH-091.

| Term | Meaning |
|---|---|
| **Screen sizes** | 320 × 568, 360 × 640, 390 × 844 (portrait) and 812 × 375 (landscape). "Every size" = all four, Larger text off and on. |
| **Team** | **Mango** or **Peacock**. Team names are shown exactly so, never upper case, except where a scenario says `<TEAM>`. |
| **Team colour** | `--mango` / `--peacock` (`ux.md` §1); never used for buttons, picks or anything but cells of that team and that team's bar. |
| **Team icon** | Our own SVG: a mango (Mango), a feather (Peacock), a dot (Nobody), a ghost (Bhoot); `aria-hidden`, at least 16 × 16 px. |
| **Kind** | What a word is on the map: `mango`, `peacock`, `nobody` or `bhoot`. |
| **Board** | The grid of words: **Full** = 25 words, 5 columns × 5 rows; **Family** = 16 words, 4 × 4. Cells in row-major order, index 0 top left. |
| **Face down / turned over** | A word not yet revealed / revealed. A turned-over cell shows its kind's colour, icon and the word. |
| **The map** | The kind of every word on the board. |
| **Map screens** | The one-phone private screen (ISH-031) and the map phone screen (ISH-034). **No other screen ever has a face-down word's kind in the page** (not in text, attributes, classes, styles or `aria`), until the game is over. |
| **Room screens** | Every screen of the host phone during a game except the private map screen. |
| **Clue giver** | The one player per team per game who may see the map. |
| **Turn** | From a team's clue screen (ISH-040) to its turn-over line (ISH-045). |
| **Guess** | One confirmed reveal ("Reveal <WORD>"). Picks without confirming are not guesses. |
| **Guess allowance** | For a clue of 1–9: the number + 1. For 0 and ∞: unlimited. |
| **Game** | From a deal to its result. A board replaced by "Deal a new board" is not a game. |
| **Counted game** | A game won by a team. Games ended with "End the game" are **not counted**. |
| **Evening** | One Ishaara saved game (engine `SavedGame`): from the first deal to ended or discarded. Holds every game of the evening. |
| **Tonight's tally** | Counted games won by Mango and by Peacock in this evening. |
| **Map code** | 6 characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 symbols, no 0, O, 1, I, L), shown as `XXX-XXX`. |
| **Map phone** | A clue giver's own phone showing a map opened from a map code. |

Example players, in the order typed: **Riya, Arjun, Meena, Kabir, Zoya, Dev**. Example words are from `words.csv` once
it is approved; this file uses Cricket, Bat, Monsoon, Kite, Tiffin.

---

## Canonical strings
One wording per place. `<Name>` = a player's name as typed; `<NAME>` = the same, upper case by CSS. `<Team>` = Mango or
Peacock; `<Other>` = the other team. `<WORD>` = the word upper case by CSS, DOM text as in the list.

| Where | Exact text | Element | ID |
|---|---|---|---|
| Home, under "Host a game" | "Tambola, Impostor or Ishaara on this phone" | text inside the button | ISH-001 |
| Ishaara card | "Ishaara" · "Team word hunt with one-word clues · 4–20 players · about 15 min a game" | button, name starts "Ishaara" | ISH-001 |
| Home unfinished row | "Ishaara, 8:40 pm, game 2" and "Tap to resume" | inside `unfinished-games` | ISH-062 |
| Join screen | "Playing Ishaara? Clue givers: scan the host's map code. Everyone else: just play along!"; quiet "I have a map code" | paragraph; button | ISH-002 |
| Map code entry | heading "Type the map code"; label "Map code"; main "Open the map"; errors "That code doesn't look right. Check it with the host." · "This map needs a newer version of the app. Open the app once with internet, then try again." | h1; input; main; `role="alert"` | ISH-002 |
| Who's playing? | the shared names step (PLT-024); message "Add at least 4 players." | `role="alert"` | ISH-003 |
| Make teams | heading "Make teams"; column headings "Mango (4)" / "Peacock (3)"; badge "Clue giver"; line "Tap a name to move it to the other team."; quiet "Shuffle teams", "Change clue givers"; main "Next"; message "Each team needs at least 2 players." | h1; h2 each; span; small line; buttons; `role="alert"` | ISH-004–008 |
| Move toast | "Om moved to Peacock · Undo" | `undo-toast` | ISH-005 |
| Clue givers sheet | heading "Clue givers"; groups "Mango" / "Peacock" with one button per player; main "Done" | dialog | ISH-007 |
| Choices | heading "How do you want to play?"; group "How do clue givers see the map?" with cards "Pass this phone" ("One phone. The clue giver holds it to see the map.") and "Clue givers' own phones" ("They scan a code. Works without internet."); group "Board": "Full: 25 words" / "Family: 16 words"; group "Words": "Whole family" / "+ Grown-ups"; main "Deal the words" | h1; `role="group"` named by its label; buttons with `aria-pressed` | ISH-009 |
| Option lines | Full "9 and 8 words to find, 7 nobody's, 1 Bhoot." · Family "6 and 5 words to find, 5 nobody's, no Bhoot." · Whole family "Words kids and grandparents know." · + Grown-ups "Adds words kids or elders may not know." | small line under the group | ISH-009 |
| Read this aloud | heading "Read this aloud"; 4 lines (ISH-010); main "Let's play"; quiet "Show me the board first" | h1; `ol` of 4 `li` | ISH-010 |
| Pass screen | "<Team>'s turn" · "Pass the phone to" · `<NAME>` · "<Team>'s clue giver"; main "I'm <Name>" | paragraph; paragraph; `pass-name`; paragraph; main | ISH-030 |
| Private map | heading `<NAME>`; line "<Team>'s turn · Mango 9 left · Peacock 8 left"; pad "Hold here to see the map"; quiet "Tap instead"; tap mode "Tap to see the map" / "Tap to hide"; main "I have my clue" | h1; small line; button `hold-pad`; button; main | ISH-031 |
| Scan screen | heading "Clue givers, scan your map"; line "Riya (Mango) and Arjun (Peacock)"; QR; line "or type: K7P-3QX"; line "Everyone else: look away from their phones."; main "Both have the map" | h1; paragraph; `img` named "Map code K7P-3QX"; paragraph; small line; main | ISH-033 |
| Map phone | heading "Ishaara map"; line "Code K7P-3QX · Mango starts"; small line "Tap a word once it's turned over, to fade it."; quiet "Hide map" / "Show map"; quiet "Done with this game" | h1; paragraph; small line; buttons | ISH-034 |
| Map phone dialog | "Clear this map from your phone?" · "Keep it" / "Clear map (main)" | dialog | ISH-036 |
| Map phone toast | "New map. The old one was cleared." | `toast` | ISH-036 |
| Clue screen | `team-bar`; heading "<Team>'s turn"; line "<Name>, say your clue out loud."; line "How many words is it for?"; keys "0"…"9" and "∞" (accessible name "As many as you like"); counts line; first-game tip "One word, one number. No faces, no pointing!"; quiet "Hurry up: 90 s"; main "Pick a number" (disabled) / "Clue for 2: start guessing" / "Clue for ∞: start guessing" | div; h1; paragraphs; buttons with `aria-pressed`; `word-counts`; small line; button; main | ISH-040 |
| Counts line | "Mango 9 left · Peacock 8 left" | `word-counts` | ISH-040, 043 |
| Board status | "<Team> guessing" · "Clue: 2 · 3 guesses left" / "Clue: 2 · 1 guess left" / "Clue: ∞ · guess as many as you like" / "Clue: 0 · guess as many as you like" | `turn-line`; `clue-line` | ISH-041 |
| First-guess tip | "Tap a word, then Reveal. You can take one more than the number." (first turn of the first game of the evening only) | small line | ISH-041 |
| Board buttons | quiet "End our turn"; main "Reveal" (disabled) / "Reveal <WORD>" | button; main | ISH-042, 044 |
| Result lines | see ISH-043 | `result-line` | ISH-043 |
| End-turn screen | line "<Team> ended their turn."; quiet "Oops, keep guessing" | `result-line`; button | ISH-044 |
| Turn-over main | "<Other>'s turn" | main | ISH-045 |
| Broke-a-rule dialog | "That clue broke a rule?" · body "<Team>'s turn ends and one of <Other>'s words is turned over." · "Cancel" / "Yes, it broke a rule (main)" | dialog | ISH-046 |
| Timer | `hurry-timer` "1:30"…"0:00"; then "Time's up!"; quiet "Stop timer" | span; span; button | ISH-047 |
| Game over | heading "<Team> wins!"; line "All 9 words found." / "<Other> woke the Bhoot!"; ended early: heading "Game ended. No winner."; tally "Tonight: Mango 2 · Peacock 1"; main "Play again"; quiet "Change teams", "End the evening" | h1; `result-line`; `tally`; buttons | ISH-050–054 |
| Deal-new dialog | "Deal a new board?" · body "This board won't count. Same teams and clue givers." · "Keep playing" / "Deal a new board (main)" | dialog | ISH-055 |
| End-game dialog | "End this game with no winner?" · "Keep playing" / "End the game (main)" | dialog | ISH-054 |
| Evening summary | heading "Tonight's Ishaara"; tally; fun lines (ISH-060); main "Play something else"; quiet "Back to Home" | h1; `tally`; `li`s; buttons | ISH-060 |
| Menu (game) | "Rules" · "Hurry up: 90 s" · "That clue broke a rule" · "Show the map to a clue giver" (own phones only) · "Players" · "Deal a new board" · "End the game" · "End the evening" | menu items | ISH-046–065 |
| Sideways | "Turn your phone sideways to see the board." | h1 `turn-sideways` | ISH-092 |
| Announcements | ISH-095 | `announcer` (`aria-live="polite"`) | ISH-095 |

---

## 01 Setup → `specs/ishaara/01-setup.md`

### ISH-001 Picking Ishaara
Given Home, when the host taps "Host a game", then "What shall we play?" shows three equal cards in this order:
Tambola, Impostor, Ishaara, with the texts above; tapping the Ishaara card opens "Who's playing?" (no main button on
the picker). Home's "Host a game" line reads "Tambola, Impostor or Ishaara on this phone".

### ISH-002 A guest or a clue giver opens the link
Given the Join screen ("Join with my ticket"), then its last paragraph is the Ishaara line and below it the quiet
button "I have a map code". Tapping it opens "Type the map code": one input (`autocapitalize="characters"`,
`maxlength="9"`), main "Open the map" disabled until 6 symbols are entered. Spaces and hyphens are ignored; letters are
read upper case. Any of 0, O, 1, I, L makes the code invalid (they are never in a code). Invalid symbols or a wrong length on "Open the map" show "That code doesn't look right.
Check it with the host." and keep the typed text. A code whose first symbol names an edition this app doesn't have
shows the "newer version" message. A valid code opens the map phone screen (ISH-034).
Opening the QR's link (`<app base URL>#map=K7P3QX`) opens the same screen directly.

### ISH-003 Who's playing?
The shared names step (PLT-024) with tonight's names filled in. "Next" is disabled below 4 names, with "Add at least 4
players."; the most is 20 (the shared step's limit message).

### ISH-004 Make teams, the first time tonight
Given no Ishaara game yet in this evening, when "Who's playing?" → "Next", then the players are split at random
(team seed, test hook 3): Mango gets ⌈n/2⌉, Peacock ⌊n/2⌋; each column lists its players in the order drawn. Each
team's first player is its clue giver (badge "Clue giver"). Column headings show counts: "Mango (3)".
Given a later game in the same evening, "Change teams" opens this screen with the current teams and clue givers.

### ISH-005 Moving a player
Tapping a name (a button, accessible name "Move Om to Peacock") moves the player to the end of the other column at once
and shows the toast "Om moved to Peacock · Undo"; "Undo" puts them back in their old place. If the moved player was
their team's clue giver, the badge moves to the old team's next player in list order, and the moved player is a
guesser on the new team. A double tap within 500 ms moves the player once.

### ISH-006 Shuffle teams
"Shuffle teams" makes a new random split (team seed, next draw) with the ⌈n/2⌉ / ⌊n/2⌋ sizes; if the split equals the
current one (the same set of names in each team), it draws again, at most 10 times. Clue givers: each team's first
player. Toast "Teams shuffled · Undo".

### ISH-007 Clue givers
For game 2 onwards, each team's suggested clue giver is the team member with the **fewest games as clue giver this
evening** (games and games ended early count; boards replaced by "Deal a new board" don't); ties go to the earliest in
that team's list. "Change clue givers" opens the sheet: per team, one selected name; tapping another selects it; "Done"
applies. Nothing else changes.

### ISH-008 Team minimum
While either team has fewer than 2 players, "Next" is disabled and "Each team needs at least 2 players." shows. Uneven
teams by any amount are allowed (only the minimum is enforced).

### ISH-009 How do you want to play?
Three groups. **Map:** two equal cards, neither selected the first time on this phone, selected look when tapped (no
default, like paper and phone tickets). **Board:** Full (default) / Family. **Words:** Whole family (default) /
+ Grown-ups. Each group shows only its chosen option's line. "Deal the words" is disabled until a map card is selected.
Later evenings start with this phone's last-used values for all three. Between games, the choices are changed only from
"Change teams" → "Next" (this screen shows again).

### ISH-010 Read this aloud
Shown once per session, before the first deal of the first Ishaara game: 1 "Two teams, Mango and Peacock. Each has a
clue giver who sees the secret map." 2 "Clue givers: say one word and a number. 'Monsoon, 2' means two of our words go
with monsoon." 3 "Guessers: talk, then turn over words one at a time. Wrong word? Your turn ends." 4 "Find all your
words first. Turn over the Bhoot and you lose!" (Family board: line 4 is "Find all your words first!").
"Let's play" deals. "Show me the board first" deals and shows the board with every word disabled and main "Start"
(starts the first turn).

---

## 02 The deal and its secrets → `specs/ishaara/02-deal.md` (C3)

### ISH-020 What a board holds
Full: 25 distinct words; starting team 9, the other 8, nobody 7, Bhoot 1. Family: 16 distinct words; 6, 5, 5, 0.
**Property:** for 10,000 random seeds and both sizes, the counts are exactly these and all words differ.

### ISH-021 Who starts
The starting team is drawn from the board seed: Mango or Peacock, each with probability ½. **Property:** over 10,000
seeds each team starts between 48% and 52% of boards. The starting team gives the first clue.

### ISH-022 The map code
The code is 6 symbols. Symbol 1 is the **config**: index `(edition − 1) × 4 + (family board ? 2 : 0) + (grown-ups ? 1 : 0)`
into the 31-symbol alphabet (edition 1 uses symbols 0–3: `2`, `3`, `4`, `5`). Symbols 2–6 are the **board seed**, a number
from 0 to 31⁵ − 1 written in base 31, most significant first. The board, the map and the starting team are a pure
function of (edition, size, audience, board seed), so **any phone rebuilds the same board from the code alone, offline.**
**Property:** for 1,000 codes, two fresh browser contexts given the same code show the same 25 (or 16) words in the same
cells with the same kinds and the same starting team.

### ISH-023 Words of the board
The candidate words are the list's rows for the edition with audience `family` (Whole family) or all rows (+ Grown-ups),
minus rows marked `retired`. Non-veg words are included (they are just words on a board; K10).

### ISH-024 No repeats tonight
When dealing, the host phone draws up to 200 board seeds from the evening's deal seed (n-th deal: draws
``createRng(`${seeds.deal}:${n}`)``). It takes the **first** seed whose board has no word used tonight and no word used in
the last 3 evenings. If none of the 200 qualifies, it takes the one with the fewest words used tonight, then fewest from
the last 3 evenings, then the earliest drawn. "Used tonight" = every word on any board dealt this evening, including
boards replaced by "Deal a new board". **Property:** for 1,000 random evenings of 6 Full games with the edition-1 list,
no word appears on two boards of one evening.

### ISH-025 The map stays private
On every room screen (Terms), at every step until the game is over, the page contains no information about a face-down
word's kind. **Check:** for every step of 100 scripted games in both map modes, the DOM text, attributes, classes and
inline styles of the room screen are identical for two boards that differ only in the kinds of face-down words.

### ISH-026 Replays
An evening's saved record holds its seeds, its moves and every board's code; replaying it gives the same boards, reveals
and results. Later edits to `words.csv` never change a past evening (a code names its edition; retired words stay in the
shipped list with `retired`).

---

## 03 Seeing the map → `specs/ishaara/03-map.md` (one-phone screens C2; privacy C3)

### ISH-030 One phone: pass to the clue giver
At the start of each turn in "Pass this phone" mode, the room screen shows the pass screen for that team's clue giver:
"Mango's turn", "Pass the phone to", RIYA (48 px, shrinking to 32 px to fit one line), "Mango's clue giver", main
"I'm Riya". A slim bar (8 px) in the team colour runs along the top edge, with the team icon beside "Mango's turn".

### ISH-031 One phone: the private map
After "I'm Riya": heading RIYA; small line "Mango's turn · Mango 9 left · Peacock 8 left"; the pad "Hold here to see
the map" (at least 200 × 96 px, in the lower third in portrait, the right third in landscape); quiet "Tap instead".
- **While the pad is held** (pointer down), the map shows **above** the pad (portrait) or to its left (landscape): the
  board's grid, each cell with its word, kind colour, team icon and, for turned-over words, 40% opacity and a line
  through the word. Releasing hides it at once (not in the page).
- **"Tap instead"**: the pad reads "Tap to see the map"; a tap shows the map until "Tap to hide" or **60 s after the
  last tap anywhere on this screen**.
- After the first release that follows a hold of at least 0.5 s, or the first tap-show, main **"I have my clue"**
  appears; it hides the map and opens the clue screen (ISH-040).
- No text selection, callout, magnifier, context menu or drag on the pad or the map (guideline 45).

### ISH-032 The map hides when the phone is left
If the app goes to the background while the private map screen shows (map visible or not), the map is removed from
the page at once, the app-switcher shows a blank cover, and on return the pass screen (ISH-030) shows with "Welcome
back." above it.

### ISH-033 Own phones: scan the map
In "Clue givers' own phones" mode, after each deal the scan screen shows: the two clue givers' names with teams, a QR
(at least 200 × 200 px; content `<app base URL>#map=<code>`), the code as text "or type: K7P-3QX", the small line, and
main "Both have the map". The host phone never shows the map in this mode until the game is over (except ISH-037).

### ISH-034 The map phone
Opening a code shows: heading "Ishaara map"; "Code K7P-3QX · Mango starts"; the map grid (same cell order as the host's
board, every cell with word, kind colour and icon); the small line; quiet "Hide map" (toggles to "Show map");
quiet "Done with this game". There is no main button. The map shows on opening; when the app goes to the background it
hides and on return shows "Show map". The screen stays awake while the map shows.

### ISH-035 Fading found words on the map phone
Tapping a map cell toggles it **found** (40% opacity and a line through the word) on this phone only. It never affects
the host. A double tap within 500 ms toggles once.

### ISH-036 Clearing and replacing maps
"Done with this game" → dialog → "Clear map" removes the map from this phone and opens Home. Opening a new code while a
map is saved replaces it and shows the toast "New map. The old one was cleared." Home shows a saved map as a row "Ishaara
map K7P-3QX" with "Tap to open"; a map saved more than 6 hours ago shows "Open" and "Clear" instead (as Tambola tickets).

### ISH-037 Own phones: a clue giver's phone fails
Menu "Show the map to a clue giver" (own-phones mode only, during a game) opens a sheet with the two clue givers' names;
picking one runs ISH-030 and ISH-031 for them once, then returns to the screen the game was on.

---

## 04 Clues and guesses → `specs/ishaara/04-play.md` (rules C3, screens C2)

### ISH-040 The clue
The clue screen shows the team bar, "<Team>'s turn", "<Name>, say your clue out loud.", "How many words is it for?",
the keys, the counts line and quiet "Hurry up: 90 s". Keys: 0–9 in two rows of 5 (portrait) or one row of 11 with ∞
(landscape), each at least 56 × 56 px; ∞ full width in portrait. Tapping a key selects it (selected look); tapping
another moves the pick. Main reads "Pick a number" (disabled) until a key is picked, then "Clue for N: start guessing".
Tapping it starts the turn's guessing (ISH-041). The first turn of the first game of the evening also shows the
first-clue tip.

### ISH-041 Guesses allowed
After the clue, the board shows "<Team> guessing" and the clue line. Allowance: 1–9 → N + 1; 0 and ∞ → unlimited.
The clue line counts down after each guess of this team's own words ("Clue: 2 · 3 guesses left" → "Clue: 2 · 2 guesses
left" → "Clue: 2 · 1 guess left"). **Property:** no turn ever records more guesses than its allowance.

### ISH-042 Pick, then confirm
Tapping a face-down word selects it (selected look; no team colour); tapping it again unselects; tapping another moves
the pick. Turned-over words are not buttons. Main reads "Reveal" (disabled) with no pick, "Reveal <WORD>" with one.
Tapping "Reveal <WORD>" is the guess; its button ignores taps for 800 ms after the guess and until the result line shows.

### ISH-043 What a guess does
The word turns over (300 ms flip; none with reduce motion), the counts line updates, and one result line shows:

| Word was | Result line | Then |
|---|---|---|
| Own team's, allowance left, team not finished | "✓ Mango's word! 2 guesses left." / "✓ Mango's word! 1 guess left." / unlimited: "✓ Mango's word! Keep going, or end your turn." | Guessing continues |
| Own team's, allowance used up | "✓ Mango's word! That's all your guesses." | Turn over (ISH-045) |
| Nobody's | "Nobody's word. Peacock's turn next." | Turn over |
| The other team's | "✗ Peacock's word! It counts for them." | Turn over |
| A team's last word (either team's) | — | Game over: that team wins (ISH-050) |
| The Bhoot | — | Game over: the other team wins (ISH-050) |

### ISH-044 Ending the turn early
"End our turn" is disabled until the team has made one guess this turn. Tapping it shows the end-turn line "Mango ended
their turn." with quiet "Oops, keep guessing" (back to guessing, nothing recorded) and main "Peacock's turn".

### ISH-045 Turn over
At turn over the board stays visible with every word disabled, the result line stays, the clue line is removed, and the
only main is "<Other>'s turn". Tapping it starts the other team's turn: ISH-030 (one phone) or ISH-040 (own phones).
The hurry-up timer, if running, stops.

### ISH-046 A clue broke a rule
Menu "That clue broke a rule" is enabled only after a clue and before the turn's first guess. Dialog → "Yes, it broke a
rule": the turn ends and **one of the other team's face-down words, chosen at random** (``createRng(`${seeds.deal}:penalty:${g}:${t}`)``,
g = game number, t = turn number) is turned over. Result line: "Clue broke a rule. One of Peacock's words was turned over."
If it was Peacock's last word, Peacock wins.

### ISH-047 Hurry up: 90 s
"Hurry up: 90 s" (clue screen, pass screen and the menu during guessing) starts a timer at 1:30 counting each second,
shown as `hurry-timer` (32 px) in the status area; the button becomes "Stop timer". At 0:00 the chime plays (sound on),
the timer reads "Time's up!" and stays until the clue is given or the turn ends. Nothing else happens: no turn ends, no
screen changes (guideline 48). The timer stops when the clue is given, at turn over, and when the app is hidden (it shows
"Paused" and the tap "Hurry up: 90 s" restarts at 1:30).

---

## 05 Winning and the night → `specs/ishaara/05-results.md` (C3)

### ISH-050 Who wins
A team wins when all its words are turned over, by either team or by ISH-046. Turning over the Bhoot makes the other
team win at once. **Property:** every game of 10,000 random scripted games ends with exactly one winner or "ended early".

### ISH-051 The game-over screen
Heading "<Team> wins!"; line "All 9 words found." (the team's count) or "<Other> woke the Bhoot!"; the whole map on the
board: turned-over words as before, face-down words now in their kind's colour and icon at 50% opacity; the tally; main
"Play again"; quiet "Change teams" and "End the evening". On a map phone nothing changes (it doesn't know).

### ISH-052 Tonight's tally
"Tonight: Mango 2 · Peacock 1" counts counted games of this evening; "Tonight: Mango 0 · Peacock 0" before any.

### ISH-053 Play again
"Play again": same teams; clue givers by ISH-007; same choices; a new deal (ISH-024); then ISH-030 or ISH-033.

### ISH-054 End the game early
Menu "End the game" → dialog → "End the game": heading "Game ended. No winner."; the whole map as ISH-051; the tally
unchanged.

### ISH-055 Deal a new board
Menu "Deal a new board" → dialog → "Deal a new board": a new deal (ISH-024) with the same teams, clue givers and
choices; the old board is not a game; own phones: the scan screen shows the new code.

---

## 06 The evening → `specs/ishaara/06-evening.md` (saved data C3)

### ISH-060 End of the evening
"End the evening" (game over, or menu with a confirmation "End the evening?" "Keep playing" / "End the evening (main)")
shows the summary: the tally and up to two fun lines: "<Name>'s clues won 2 games" (the clue giver with the most
counted wins as clue giver, at least 1; tie: the one who reached that count first) and "The Bhoot woke up 1 time" (if at
least 1). Main "Play something else" (opens "What shall we play?" with tonight's names kept); quiet "Back to Home".

### ISH-061 Players during a game
Menu "Players": add a name → they join the smaller team at once as a guesser (Mango if equal); remove a guesser at once
(toast "Kabir left · Undo"); removing a clue giver asks the team's next player in list order to take over ("Meena is
now Mango's clue giver."); in one-phone mode the next Mango turn passes to Meena; in own-phones mode the menu offers ISH-037
for Meena. A team can't drop below 2 ("Each team needs at least 2 players.").

### ISH-062 Leaving and resuming
Everything is saved on every move. Home's unfinished row reads "Ishaara, 8:40 pm, game 2" (the evening's start time and
the game in progress). Within 12 hours of the last move, "Tap to resume" returns to the same step, except a private map
screen, which returns to its pass screen with "Welcome back.".

### ISH-063 The 12-hour limit
An evening untouched for more than 12 hours ends by itself; a game in progress is kept as ended early.

### ISH-064 History
History shows "Ishaara · 3 games" per evening; each game row: "Game 2 · Mango won · Riya and Arjun gave clues"
("ended early" / "Bhoot"); opening one shows its board with the whole map.

### ISH-065 Discard the evening
Menu "End the evening" → summary → menu "Discard this evening" → dialog "Discard this evening? Its games and tally are
removed." "Keep it" / "Discard (main)". The evening leaves History.

---

## 09 Usability → `specs/ishaara/09-usability.md` (C1/C2)

### ISH-090 Board text
Portrait board: 8 px side margins and 4 px gaps between cells (cells 65.6 px wide at 360, 71.6 px at 390). All words on a board share one font size: the largest whole px from 22 down to 12 at which every word on **that** board
fits on one line in its cell with 4 px padding each side (Fits in 1 line). At 812 × 375 and 390 × 844 the size is at
least 14 px for every edition-1 board (Full and Family). Larger text doesn't change the board size.

### ISH-091 Landscape board
At 812 × 375: the grid fills the left part (16 px left, top and bottom margins); a 200 px wide panel on the right
(16 px right margin, 12 px gap) holds the turn line, clue line, counts, "End our turn" and the main button (200 × 60,
bottom right). No page scrolling. Cells at least 100 × 56 px (Full).

### ISH-092 Narrow portrait
At 320 × 568 portrait the board and the private map show only "Turn your phone sideways to see the board." (h1) and the
main button of that step stays usable; turning to landscape shows the board. Every other screen works in portrait at 320.

### ISH-093 Never colour alone
Every turned-over cell and every map cell shows its kind's icon and has an accessible name "Kite, Mango's word" /
"…, Peacock's word" / "…, nobody's word" / "…, the Bhoot". Face-down: "Kite, face down". Team bars sit next to the team
name in words.

### ISH-094 Targets
Every button at least 44 × 44 px; board cells at least 56 px tall in portrait at 360 and 390; number keys 56 × 56 px.

### ISH-095 Screen readers
The announcer reads: the clue ("Mango's clue: 2 words"), each result line, the turn over, the game over heading and line.
It never reads the map, except on the private map screen while it shows and on the map phone.

### ISH-096 Reduce motion
With reduce motion: no flip, no timer animation; everything else the same.

### ISH-097 Sound and vibration
With sound on: a soft "ding" for an own word, a low "thud" for nobody's or the other team's, a "boo" for the Bhoot, the
chime at time's up. Vibration 50 ms on every reveal (200 ms for the Bhoot). The private map screen makes no sound or
vibration that differs by what it shows.

### ISH-098 One main button
Every screen has at most one main button, and it is the next step (ISH-091 places it in landscape).

### ISH-099 Word list fit (C3, content)
`content/ishaara/words.json` is built from `docs/games/ishaara/words.csv`. **Check:** every word is 3–8 letters A–Z only,
unique, and fits on one line in a 57 px wide box at 12 px in the board's font and weight (the cell width at 360 × 640,
65.6 px, minus 4 px padding each side).
A word that fails is reported to the product owner, who replaces it.

---

## Test hooks the build provides
1. **Rule API** in `src/games/ishaara/index.ts`, fitting the existing engine (`startMatch`, `play`, `replay`, `viewFor`,
   `SavedGame`, `createRng`): `ishaaraRules` with `id: 'ishaara'`; `boardFromCode(code, words)` → `{ words: string[],
   kinds: Kind[], starts: Team }`; `codeFor(config, seed)`; `pickBoardSeed(dealRng, used, recent)`; moves `deal`,
   `clue {n: 0–9 | 'inf'}`, `reveal {cell}`, `endTurn`, `brokeRule`, `nextTurn`, `endGame`, `dealNew`, `setTeams`,
   `setClueGivers`, `setPlayers`, `endEvening`. Exact signatures are settled in the two-reader check (version 2).
2. **Seeds** from `localStorage['pgn.test.seeds']` as Impostor (ignored in a release): `{ deal?: string, teams?: string,
   boards?: string[] }` (`boards` = map codes to use for deal 1, 2, …).
3. **Team seed:** ``createRng(`${seeds.teams}:${k}`)`` for the k-th split of the evening.
4. **Clock:** fake timers for the 60 s tap mode, the 90 s timer, the 6-hour map limit and the 12-hour evening limit.
5. **Background/foreground:** `visibilitychange` as Impostor.

---

## Ishaara later (direction, built later)
- **ISH-200** 2–3 players together against the phone (official co-op variant; `guide.md` variants).
- **ISH-201** Picture boards for children who can't read.
- **ISH-202** Regional word themes, each player's own script on the map phone.
- **ISH-203** Board on the TV.
- **ISH-204** "My pick" on guessers' phones (connected mode).
