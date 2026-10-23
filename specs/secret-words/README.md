# Secret Words: scenarios (version 3.7, 23 October 2026)

Copied from `docs/games/secret-words/scenarios.md` (version 3.7), the binding contract, split into one file per section as its headings name. Each scenario's paragraph headed "Version 3.7" wins over the text above it in the same scenario, then its "Version 3.6" paragraph. Rule API for the tests (Test hooks item 1 made exact): [api.md](api.md).

| File | Scenarios |
|---|---|
| [01-setup.md](01-setup.md) | SWD-001 to SWD-014 |
| [02-deal.md](02-deal.md) | SWD-020 to SWD-028 (C3) |
| [03-map.md](03-map.md) | SWD-030 to SWD-039 |
| [04-play.md](04-play.md) | SWD-040 to SWD-049, SWD-101 to SWD-104 (rules C3) |
| [05-results.md](05-results.md) | SWD-050 to SWD-056 (C3) |
| [06-evening.md](06-evening.md) | SWD-060 to SWD-067 (saved data C3) |
| [07-sessions.md](07-sessions.md) | SWD-110 to SWD-133 |
| [09-usability.md](09-usability.md) | SWD-090 to SWD-099 |
| [10-later.md](10-later.md) | SWD-200 to SWD-206 (direction) |

Status: **version 3.7 approved by the owner, 23 October 2026** (the prototype walks and Jev's prototype read, `prototype-walk-2026-10-22.md`); version 3.6 was approved on 22 October ("go ahead": the critic pass and UX review, `design-review-2026-10-22.md`); version 3.5 was approved on 11 October ("yes to all": the screen map's persona walks and Jev read, `map-walk-2026-10-11.md` §3 and §8); version 3.4 was approved on 4 October (SWD-001 to SWD-133; two-reader check of 3.3 and a final verification pass resolved) (version 3.2, SWD-001 to SWD-104, was approved on 4 October; 3.3
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

### What version 3.7 changes (rule 11; owner, 23 October: P1–P10 and the wording of Jev's prototype read)
Each change is a paragraph headed "Version 3.7" at the end of the scenario it touches; it wins over earlier text in that
scenario, including its 3.6 paragraph. Strings below replace their old form everywhere in this file. Scenarios touched: SWD-005,
007, 010, 031, 033, 034, 039, 041, 043, 102, 103, 110, 112, 120, 124, 126, 127, the Terms and the strings table.
- **Nobody's word (P4):** the kind `nobody` is called "nobody's word" wherever a person reads it: result line "Nobody's word.
  Other team's turn next."; recap "Train was nobody's."
- **Waiting line (P5):** "While you wait, Coffee Commandos: guess how many words Riya's clue will be for." (pair: "…Nana and
  Aarav's clue…").
- **Dispute button (P6):** "Turn ends, and one of their words is turned over for them".
- **Jev's prototype read, reworded (old → new):** "or type: 27P-3QX8" → "Or type this code: 27P-3QX8"; "Keep Kabir" → "Don't
  remove Kabir"; Players sheet "Move to Coffee Commandos" → "Switch team" (accessible name unchanged: "Move Zoya to Coffee
  Commandos"); "Change clue givers" → "Choose clue givers"; "Next map? Only when the host has dealt the next board." → "Next map?
  Only after the host starts the next game."; How to play rule 7 "The host phone stays at the table: it's the board." → "Keep the
  host phone on the table: it shows the board."; Make teams' h2s "Chai Champions (4)" → "Chai Champions · 4 players".
  "Landmine" stays (K28) and is explained by the map key (P8).
- **Two-phone clue-giver line (P7):** "Riya and Arjun: sit side by side and share one map phone." → "Riya and Arjun give clues for
  different teams but share one map phone, as at a real table: sit side by side."
- SWD-005, 007 and 039 change only by these string swaps; SWD-041 has a 3.7 paragraph. The "What version 3.x changes" sections
  below are history and keep the strings of their time.

### What version 3.6 changes (rule 11; owner's decisions D1–D6 and the product owner's resolutions R1–R18, 22 October)
Source: `design-review-2026-10-22.md` (labels D1–D6 and R1–R18 point there and add no requirement of their own); clarified
by the coder-reader and tester-reader check of 22 October. **Every change is written into the scenario it touches, as a paragraph headed
"Version 3.6" at the end of that scenario; where it differs from the earlier text of the same scenario, that paragraph
wins.** Version 3.5's items are now also written into their scenarios' bodies (SWD-009, 011, 012, 031, 032, 033, 034, 040,
110, 114, 115, 117, 120). Scenarios touched: SWD-002, 009, 011, 012, 031, 032, 033, 034, 036, 040, 041, 047, 051, 092, 110,
114, 115, 116, 117, 120, the Menu note and the strings table. Guidelines 14, 24, 46a and 49 reworded (`docs/ux-guidelines.md`).

### What version 3.5 changes (rule 11; owner's decisions of 11 October from the screen map walks, `docs/decisions.md`)
Source: `screen-map.md` draft 2 and `map-walk-2026-10-11.md`. Every string below replaces its old form everywhere in this file.
1. **Help (decision 1):** Choices gains quiet "How to play" (opens SWD-011; "Done" returns to Choices). The map phone gains
   quiet "Clue rules" (opens How to play scrolled to h2 "Clue rules", never any map; "Done" returns to the map phone, map
   state unchanged). SWD-009, 011, 034.
2. **Visible tap guards (decision 2):** while a main button's guard runs (SWD-114) it shows the greyed look and becomes live
   when the guard ends; the same look rule applies to every game. SWD-114.
3. **Where-line (decision 3):** `where-line` (small line) under "Welcome back." (SWD-032), on the Pause cover (SWD-110) and in
   Home's unfinished row and the picker's resume card (SWD-115): "Turn 4 · clue for Chai Champions" (pass, map and clue steps:
   "Turn N · clue for <team>"; never a possessive, SWD-013; version 3.6), "Chai Champions guessing · 2 guesses
   left" (guessing and end-turn line; clue 0 or ∞: "· as many as you like"), "Turn 4 over · Coffee Commandos next" (turn over),
   "Game over, game 2" (game over), "Scan the map, game 2" (scan screen), "Before game 1" (preview). N = turn number on this
   board (Terms).
4. **Reveal stays final (decision 4):** K35 confirmed; no change.
5. **Scan screen (decision 5, W11):** heading "Clue givers: scan to get the secret map"; new paragraph `other-phone-line` above
   the QR "On the other phone: open the app, tap Join a game, scan this."; the small line becomes "Guessers: don't scan this
   one!"; two-phone main "The map phone has the map". SWD-033, 129.
6. **Pause icon and menu groups (decision 6):** an icon button `pause-button` (accessible name "Pause", 44 × 44, the pause
   glyph as our own SVG) directly left of "··· Menu" (left of `hurry-timer` when it shows) on the pass screen, the clue screen,
   guessing, the end-turn line and turn over; it does what the menu's "Pause" does. The menu's items are grouped by a 1 px
   `--border` rule between groups, in this order: play (Earlier clues · Start 90-second timer / Stop timer · Clue not allowed?
   · Change clue (568 × 320 only) · Someone else taps Reveal · Players · Show the map to a clue giver · Show the map code
   again) · fix (New board) · leave (Pause · Home (keep this game) · End the game · End for tonight) · more (How to play ·
   Settings · History). Which items a step has is unchanged (menu table). SWD-110.
7. **Map phone in step (decision 7):** on a map phone opened from a QR with `t` and `phones = 'own'` in the QR (three phones;
   the QR gains `&p=own` for three phones, nothing for two), the first opening shows, under `map-code-line`, `my-team`: small
   line "I give clues for:" with two buttons "Chai Champions" / "Coffee Commandos" (`aria-pressed`); a tap saves `team` with
   the map (kept by "Next map"), lists that team's words first in "Whole map" lists and opens that team's list by default;
   until tapped, nothing else changes. "Next map" first opens the dialog "Next map? Only after the host starts the next game." with quiet "Next map" and main "Not yet"; "Next map" does SWD-039; "Not yet" closes. `map-end-line` reads "Game over: tap Done with this game. New board on the host: tap Next map." SWD-034, 036, 039, 117.
8. **Wording batch (W1–W24, `map-walk-2026-10-11.md` §6):** Landmine lines ("Boom! Coffee Commandos hit the Landmine.";
   "Boom! The Landmine. Your turn ends and the other team gets a free word."; `avoid-line` "Never guess: Shadow (the
   Landmine)"); map phone lists "Orange team's words" / "Teal team's words"; Join and code entry ("Secret Words clue givers:
   scan the host's code to get your secret map."; quiet "Type the host's code"; heading "Type the host's code"; label
   "Host's code"; small line "Dashes and small letters are fine."); `map-code-line` "Host's code 27P-3QX8 · Chai Champions go
   first" / "… · Orange team goes first"; map phone toasts "New map opened. The old one is gone." / "No more maps from this
   code. Scan the host's new code."; the map phone small line "Tap a word when it's found to fade it (optional). The host's
   board is what counts."; the clear dialog "Remove this map from your phone?" with "Remove" / "Keep it" and Home's saved-map
   button "Remove"; poker line "Riya: no hints, no faces!"; "Someone else taps Reveal" (menu) and "Who taps Reveal this
   turn?" (dialog); `clue-warning` "Careful: Cricket is a word on the board."; broke-a-rule line "The clue broke a rule, so
   the other team got a free word."; the New board dialog "New board? New words, same teams, fresh start. For when someone
   saw the map or the words are too hard. This board won't count."; Pause cover line "Tap Carry on when you're ready."; Start
   new paragraph "The game night from 8:40 pm (Chai Champions v Coffee Commandos, 2–1) will end."; game over quiet "Swap clue
   givers" and "Change teams, players, phones or board"; Clue givers sheet small lines under the switch "Plays as a guesser
   only. Good for small kids." and under "Add a partner" "Two people give the clues together."; clue screen small line
   `anyone-line` "Anyone can tap the number." on the evening's first clue screen (hides first when space is short); first-guess
   tip "Tap a word to suggest it. Sunita taps Reveal (it takes turns)."; preview board h1 "The board, before you start";
   private map small line `private-line` "Only Riya should see this screen." (pair: "Only Nana and Aarav should see this
   screen.") under the heading; History game h1 "Game 2 · Chai Champions won" ("Game 2 · Chai Champions won (Landmine)",
   "Game 3 · Ended early"); team-of-one dialog "Coffee Commandos would be left with only Om. Move someone over?". "Tally"
   stays (owner, 11 October; a cross-game word).
9. **Word list (K27 amended):** 12 words move from `family` to `grownups` (Puri, Pitch, Googly, Sitar, Interval, Reel, Sparkler,
   Lantern, Duster, Mexico, Greece, Patna), so Whole family has 439 candidates and SWD-039's worked number changes; team-name
   pairs SWDT-07 and SWDT-08 become Early Birds / Night Owls and Loud Speakers / Quiet Corners. SWD-013, 039, 099.
10. **Jev (PLT-113):** the weekly cap is 50,000 decisions (decision of 8 October); the tester updates `specs/platform`.

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
  clues for Coffee Commandos now?", "Coffee Commandos would be left with only Om. Move someone over?", "Move Zoya over", "Don't remove Kabir", "No one can move over.". `setPlayers` gains `renames` (SWD-014, 064, 127, test hook 1).
- **Game over (res. 4):** SWD-056 retired (replaced by SWD-112). "Change teams" is retired everywhere (Terms Deal, SWD-004,
  009, 013, 102, tap → move) for "Change teams, players, phones or board"; "End the evening" (SWD-051) reads "End for tonight"; new
  `next-clue-givers` and "Swap clue givers"; SWD-014's "The Clue givers sheet exists only on Make teams" reworded; SWD-053 reworded.
- **Home, Pause, menus (res. 5):** quiet "← Home" only at game over; elsewhere menu item "Home (keep this game)" (SWD-111).
  `pause-cover` is a dialog (was h1 "Paused" on a cover) (SWD-110). The menu table's "Hurry up / Stop timer" column now reads
  "Start 90-second timer / Stop timer"; new columns Earlier clues, Someone else taps Reveal, Show the map code again, Pause, Home (keep
  this game); Home's own menu gains "History" (SWD-115). "Show the map code again" is no longer "at every game step" (SWD-129).
- **Picker (res. 6):** `turn-line` no longer reads "Chai Champions guessing · Sunita picks"; main "Reveal" / "Reveal <WORD>"
  → "Sunita: Reveal" / "Sunita: Reveal <WORD>" (SWD-042, 091, 122); first-guess tip "Tap a word, then Reveal. You can take one
  more than the number." → "Tap a word to suggest it. Sunita taps Reveal (it takes turns)." (SWD-041, 122); "Someone else taps Reveal" opens the dialog
  "Who taps Reveal this turn?" (was "a sheet"); room view gains `picker`.
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
  (teal)"; `map-code-line` "Host's code 27P-3QX8 · Chai Champions go first" with names; small line "Tap a word once it's turned over, to
  fade it." → SWD-120's; lists "Orange team's words" / "Teal team's words" / "Whole map" with "Orange words (6)" / "Teal words (5)" (SWD-034,
  117, 120); the map phone page may scroll in portrait (SWD-034).
- **Setup words (res. 13):** "Deal the words" → "Start the game" (SWD-009); `start-hint` above the main (was "under");
  Landmine default per K33 (SWD-009, 066, 119); `big-group-hint`.
- **Disputes (res. 14):** "Clue not allowed? This turn ends and one of the other team's words is turned over." with "Yes, it
  broke a rule" / "Cancel (main)" retired for "Clue not allowed? Both clue givers decide together." with "Try another clue",
  "Turn ends, and one of their words is turned over for them", "Clue rules", "Let it go (main)" (SWD-041, 046, 124).
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
"Clue not allowed?", "Delete tonight's games", "End for tonight", "Never guess: Shadow (the Landmine)", "Flip the board", "Heads up: Cricket
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
  two phones (now "The map phone has the map").
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
  "or type: K7P-3QX" (now "or type: K7P-3QX4" in version 2; now "Or type this code: 27P-3QX8"), "Meena is now Mango's clue giver." (now part of the removal toast),
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
| **Deal** | Dealing a board: the first deal, "Play again", "New board", and the deal after "Change teams, players, phones or board". The deals of an evening are numbered from 1. |
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
| **Small line colour (P10, version 3.7)** | Every small line in Secret Words uses `--text`, not the muted grey; contrast at least 4.5:1. Size stays as each scenario states (15 px, 19 px with Larger text, unless a scenario gives its own size or shrink floor, such as `private-line`'s 13 px or the poker line's 13 px). |
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
| Start new | dialog: heading "Start a new game night?"; paragraph "The game night from 8:40 pm (Chai Champions v Coffee Commandos, 2–1) will end." with, in this order, two equal quiet buttons "Carry on that one", "Start new (ends that one)"; no main | dialog (named "Start a new game night?"); buttons | SWD-115 |
| Home unfinished row | "Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1" and "Tap to resume" | inside `unfinished-games` | SWD-115 |
| Home last game night | "Last game night: Chai Champions 2 · Coffee Commandos 1"; button "Play again with these teams" | `last-night` paragraph; button | SWD-115 |
| Home menu | adds "History" | menu item | SWD-115 |
| Home, second card | accessible name starts "Join a game"; title "Join a game"; line "Tambola ticket or Secret Words map from the host" (replaces "Join with my ticket" / "Got a QR or code from the host?") | button | SWD-002 |
| Join screen | heading "Join a game"; in order: the scanner, labelled "Scan a ticket or secret map", and its button "Type a ticket code" (was "Type the code"); Impostor's line (IMP-002); then "Secret Words clue givers: scan the host's code to get your secret map."; quiet "Type the host's code" | h1; scanner label; paragraph; button | SWD-002, 133 |
| Code entry | heading "Type the host's code"; label "Host's code"; small line "Dashes and small letters are fine."; placeholder "27P-3QX8"; main "Open the map"; errors "That code doesn't look right. Check it with the host." · "This map needs a newer version of the app. Open the app once with internet, then try again." | h1; input; main; `role="alert"` | SWD-002 |
| Who's playing? | heading "Who's playing?"; "Add at least 4 players." · "20 players is the most." · Impostor's duplicate message; from game over: "← Back to the game" | h1; `role="alert"`; button | SWD-003, 112 |
| Make teams | heading "Make teams"; h2s "Chai Champions · 4 players" / "Coffee Commandos · 3 players", each with its team icon and the small line "Orange team" / "Teal team"; badge "Clue giver"; small line "Tap a name to move it to the other team."; small line "Doesn't give clues" under such names; quiet "Shuffle teams", "New team names", "Choose clue givers"; main "Next"; alerts "Each team needs at least 2 players." · "Each team needs someone who can give clues." | h1; h2; `clue-giver-badge`; small lines (`guess-only-tag`); buttons; `role="alert"` | SWD-004–008, 014 |
| Team toasts | "Om moved to Coffee Commandos · Undo" · "Teams shuffled · Undo" · "New team names · Undo" | `undo-toast` | SWD-005, 006, 013 |
| Clue givers sheet | dialog "Clue givers"; groups "Chai Champions" / "Coffee Commandos"; one button per player; per team quiet "Add a partner" ↔ "Remove partner" with the small line "Two people give the clues together." under it, and group "Chai Champions partner"; per player a switch "Doesn't give clues" with the small line "Plays as a guesser only. Good for small kids." under it (accessible name "Riya: doesn't give clues"); alert "Each team needs someone who can give clues."; main "Done" | dialog; `role="group"`; buttons with `aria-pressed`; `role="switch"` | SWD-007, 014, 123 |
| Choices | heading "How do you want to play?"; small line "Same as last time" (carried over); groups "How many phones?", "Board", "Landmine" (Full board only), "Words"; quiet "How to play" (v3.5 item 1); `big-group-hint` "Big group? The Easy board is easier to read." (9 or more players); `start-hint` "Pick how many phones to start." (above the disabled main); main "Start the game" | h1; small lines; `role="group"`; main | SWD-009, 119 |
| Phone cards | "One phone" + "Pass it to the clue giver to see the map. About 25 min a game." · "Two phones" + small line "Recommended" (`recommended`, between title and text) + "One more phone, shared by both clue givers. About 15 min a game." · "Three phones" + "One more phone for each clue giver. About 15 min a game." | buttons with `aria-pressed` | SWD-009 |
| Options | "Full: 25 words" / "Easy: 16 words"; "Lose the game" / "Lose your turn"; "Whole family" / "+ Harder words" | buttons with `aria-pressed` | SWD-009 |
| Option lines | Full "9 and 8 words to find, 7 blank, 1 Landmine." · Easy "6 and 5 words to find, 5 blank, no Landmine." · Lose the game "Step on it and your team loses." · Lose your turn "Step on it and your turn ends; the other team gets one word free." · Whole family "Words kids and grandparents know." · + Harder words "Adds words kids or elders may not know." | small line under the group | SWD-009 |
| Read this aloud | heading "Read this aloud"; 4 lines (SWD-010); main "Let's play"; quiet "Show me the board first" | h1; `ol` of 4 `li` | SWD-010 |
| How to play | heading "How to play"; h2 "Read this aloud" + the 4 lines; h2 "The rules" + 7 lines (SWD-011); h2 "Clue rules" + 4 lines (SWD-131); small line `credit` (SWD-011); main "Done" | h1; h2; `ol`; small line | SWD-011, 131 |
| Preview board | h1 "The board, before you start"; `turn-line` "Chai Champions start"; counts; main "Start" | h1; paragraphs; main | SWD-012 |
| Scan screen | heading "Clue givers: scan to get the secret map"; `other-phone-line` "On the other phone: open the app, tap Join a game, scan this." above the QR; two phones: "Riya and Arjun give clues for different teams but share one map phone, as at a real table: sit side by side." · three phones: "Riya (Chai Champions, orange) and Arjun (Coffee Commandos, teal): scan on your own phones." (a pair reads "Nana + Aarav"); QR; "Or type this code: 27P-3QX8"; `board-check` (SWD-116); `dnd-tip` (SWD-104); `waiting-line` is not here; small line "Guessers: don't scan this one!"; main "The map phone has the map" (two) / "Both have the map" (three) | h1; paragraph; `map-qr` (`img`, name "Map code 27P-3QX8"); `map-code-text`; small line; main | SWD-033 |
| Board check (scan screen) | first deal (or the first after a change of phones): "The map phone should start with: Cricket · Bat · Monsoon" / three phones "The map phones should start with: Cricket · Bat · Monsoon"; next deal, clue givers changed: "Hand the map phone to Meena and Kabir, tap Next map, and check it starts with: Kite · Tiffin · Rain" / three phones "Meena and Kabir: scan this code on your phones and check they start with: Kite · Tiffin · Rain. Riya and Arjun: tap Done with this game."; unchanged: "Tap Next map on the map phone and check it starts with: Kite · Tiffin · Rain" / three phones "Tap Next map on both map phones and check they start with: Kite · Tiffin · Rain"; new deck: "New code: scan again. The map phone should start with: Kite · Tiffin · Rain" / three phones "New code: scan again. The map phones should start with: Kite · Tiffin · Rain" | `board-check` paragraph | SWD-116 |
| Map code again | the scan screen for the current board; main "Back to the game" | main | SWD-129 |
| Pass screen | heading "Chai Champions, your turn"; "Pass the phone to"; `<NAME>` (pair: two lines "NANA +" / "AARAV"); "Clue giver for Chai Champions (orange)" (pair: "Clue givers for Chai Champions (orange)"); `waiting-line`; `recap-line` (SWD-103); `dnd-tip` (SWD-104); quiet "Start 90-second timer"; main "I'm Riya" (pair: "We're Nana and Aarav") | h1 `turn-heading`; paragraph; `pass-name`; paragraph; small lines; button; main | SWD-030, 123 |
| Waiting line | "While you wait, Coffee Commandos: guess how many words Riya's clue will be for." (pair: "While you wait, Coffee Commandos: guess how many words Nana and Aarav's clue will be for.") | `waiting-line` small line | SWD-126 |
| Welcome back | "Welcome back." above the pass screen, with `where-line` under it (v3.5 item 3) | paragraph; small line | SWD-032 |
| Where-line | "Turn 4 · clue for Chai Champions" · "Chai Champions guessing · 3 guesses left" · "Turn 4 over · Coffee Commandos next" · "Game over, game 2" · "Scan the map, game 2" · "Before game 1" (v3.5 item 3) | `where-line` small line | SWD-032, 110, 115 |
| Private map | heading `<NAME>` (pair: "Nana + Aarav"); small line `private-line` "Only Riya should see this screen." (pair "Only Nana and Aarav should see this screen."); small line "You give clues for Chai Champions (orange)"; counts; pad "Tap to see the map" / "Tap to hide"; quiet "Our words" / "Whole map"; quiet "↻ Flip" (accessible name "Flip the board"); quiet "Not Riya? Go back" (pair: "Not Nana and Aarav? Go back"; before the first show); quiet "Someone saw the map" (while shown); list `our-words`: h2 "Your words (6 left)" ("(1 left)" for one), each word an `li`, small line `avoid-line` "Never guess: Shadow (the Landmine)"; main "I have my clue" (SWD-037: "Done, hide the map"; from "See the map again": "Back to my clue") | h1; small line; `hold-pad`; buttons; `our-words`; main | SWD-031, 113 |
| Hide warning | "Still looking? Tap to keep the map" | `hide-warning` (`role="status"`) | SWD-121 |
| Map phone | heading "Secret Words map"; `map-teams` "Chai Champions (orange) · Coffee Commandos (teal)" (scanned with a known `t` only); `map-code-line` "Host's code 27P-3QX8 · Chai Champions go first" (without names: "Host's code 27P-3QX8 · Orange team goes first"); `first-words` "First words: Cricket · Bat · Monsoon"; small line "Tap a word when it's found to fade it (optional). The host's board is what counts."; quiet "Orange team's words" / "Teal team's words" / "Whole map"; quiet "Hide map" / "Show map"; quiet "Next map"; quiet "Clue rules"; quiet "Done with this game"; `my-team` (three phones, first opening): small line "I give clues for:" + buttons "Chai Champions" / "Coffee Commandos" (v3.5 items 1, 7); `map-end-line` "Game over: tap Done with this game. New board on the host: tap Next map." | h1; paragraphs; small lines; buttons | SWD-034, 116, 117, 120 |
| Map phone lists | h2 "Orange words (6)" / "Teal words (5)", each word an `li`; then `avoid-line` "Never guess: Shadow (the Landmine)" (none on Easy) | `map-list` | SWD-120 |
| Map phone toasts | "New map opened. The old one is gone." · "Next map. It should start with: Kite · Tiffin · Rain." · "No more maps from this code. Scan the host's new code." (at the bottom, 16 px up) | `toast` | SWD-036, 039, 116 |
| Map phone dialogs | "Remove this map from your phone?" with "Remove" / "Keep it" (main) · "Next map? Only after the host starts the next game." with quiet "Next map" / main "Not yet" (v3.5 item 7) | dialog | SWD-036, 039 |
| Saved map row (Home) | "Secret Words map 27P-3QX8 · Tap to open" (button) · older: "Secret Words map 27P-3QX8" with "Open" / "Remove" | `saved-map` | SWD-036 |
| Clue screen | heading "Chai Champions, your turn"; `clue-prompt` "Riya, say your clue out loud. How many words is it for?" (pair: "Nana and Aarav, say your clue out loud. How many words is it for?"); keys "0"…"9", "∞" (with "many" under it); `clue-help` "2 means up to 3 guesses. 0 or ∞: as many as you like."; input labelled "Clue word (optional)" (`clue-word`); `clue-warning` "Careful: Cricket is a word on the board."; counts; tip "One word, one number. No faces, no pointing!"; `anyone-line` "Anyone can tap the number." (the evening's first clue screen); `waiting-line` and `recap-line` (two or three phones); quiet "See the map again" (one phone); from "Change clue" or "Try another clue": quiet "Keep my clue"; quiet "Start 90-second timer"; main "Pick a number" (disabled) / "Clue for 2: start guessing" / "Clue for 0: start guessing" / "Clue for ∞: start guessing" | h1 `turn-heading`; paragraph `clue-prompt`; `clue-key` buttons with `aria-pressed`; small line `clue-help`; input; paragraph; `word-counts`; small lines `tip`, `waiting-line`, `recap-line`; buttons; main | SWD-040, 101, 118 |
| Counts | circle icon "9 left" · diamond icon "8 left" (visible text "9 left · 8 left"; accessible name "Chai Champions: 9 words left. Coffee Commandos: 8 words left."); landscape board panel: two lines | `word-counts` | SWD-040, 043 |
| Board status | `turn-line` "Chai Champions guessing" (for the first 3 000 ms of a guessing screen after a confirmed clue: "Riya: no hints, no faces!"; pair "Nana + Aarav: no hints, no faces!"); `clue-line` with a word "CRICKET · 2" (DOM "Cricket · 2" as typed) / "CRICKET · ∞", with no word "Clue: 2" ("Clue: 0", "Clue: ∞"); `guess-line` "3 guesses left (2 + 1 extra)" (clue 1: "2 guesses left (1 + 1 extra)"), then "2 guesses left", "1 guess left"; 0 and ∞: "Guess as many as you like"; `clue-history` "Earlier: MONSOON 2 · 1 · RAIN ∞"; quiet "Change clue", "Clue not allowed?"; icon button "↻" (accessible name "Flip the board") | paragraphs; buttons | SWD-041, 102, 118, 125 |
| First-guess tip | "Tap a word to suggest it. Sunita taps Reveal (it takes turns)." | small line `tip` | SWD-122 |
| Board buttons | quiet "End our turn"; main "Sunita: Reveal" (disabled) / "Sunita: Reveal <WORD>" (DOM "Sunita: Reveal Lamp") | button; main | SWD-042, 044, 122 |
| Someone else taps Reveal | menu item "Someone else taps Reveal"; dialog "Who taps Reveal this turn?" with one button per guesser (`aria-pressed` on the current picker) and quiet "Cancel" | menu item; dialog; buttons | SWD-122 |
| Result lines | SWD-043 table (pair: "✓ Nana and Aarav's clue works! …"); end-turn "Chai Champions ended their turn."; quiet "Oops, keep guessing" | `result-line`; button | SWD-043, 044, 125 |
| Turn-over main | "Other team's turn" | main | SWD-045 |
| Dispute | dialog "Clue not allowed? Both clue givers decide together." with, stacked: quiet "Try another clue", quiet "Turn ends, and one of their words is turned over for them", quiet "Clue rules", main "Let it go" | dialog; buttons | SWD-124 |
| Broke a rule | result line "The clue broke a rule, so the other team got a free word." | `result-line` | SWD-046 |
| Timer | `hurry-timer` "1:30" … "0:01", then "Time's up!", or "Paused"; button / menu item "Start 90-second timer" ↔ "Stop timer" | span; button | SWD-047 |
| Recap | "Last turn: Coffee Commandos found 2 words; Train was nobody's." (SWD-103) | `recap-line` | SWD-103 |
| Do Not Disturb tip | "Tip: turn on Do Not Disturb so messages don't pop up on the board." | `dnd-tip` | SWD-104 |
| Earlier clues sheet | dialog "Earlier clues"; one `li` per clue in force of this game, oldest first: "Chai Champions: CRICKET 2" / "Coffee Commandos: 1" / "Chai Champions: RAIN ∞"; main "Done" | dialog | SWD-041 |
| Pause | menu item "Pause" and `pause-button` (icon, accessible name "Pause") beside "··· Menu" on the pass, clue, guessing, end-turn and turn-over screens; `pause-cover`: heading "Paused"; `where-line`; line "Tap Carry on when you're ready."; main "Carry on" | `role="dialog"` named "Paused"; paragraph; main | SWD-110 |
| Game menu items | "Home (keep this game)" · "Show the map code again" · "Pause" · "Someone else taps Reveal"; grouped play · fix · leave · more with a 1 px rule between groups (v3.5 item 6) | menu items | SWD-110, 111, 122, 129 |
| Game over | heading "Chai Champions win!"; line "All 9 words found." / "Boom! Coffee Commandos hit the Landmine."; ended early: heading "Game ended. No winner."; `near-miss` "Coffee Commandos were 1 word away!" / "Coffee Commandos were 2 words away!"; `best-clue` "Best clue: MONSOON 2 · all 2 found" / "Best clue: MONSOON 2 · 3 found" / "Best clue: RAIN ∞ · 4 found"; tally; `next-clue-givers` "Next clue givers: Meena and Kabir" (pair "Next clue givers: Nana + Aarav and Kabir") with quiet "Swap clue givers"; quiet "Change teams, players, phones or board", "End for tonight", "← Home"; main "Play again" | h1 `game-heading`; `result-line`; paragraphs; `tally`; buttons; main | SWD-051, 112, 128 |
| Game ended toast | "Game ended · Undo" (10 s) | `undo-toast` | SWD-054 |
| Deal new | dialog "New board? New words, same teams, fresh start. For when someone saw the map or the words are too hard. This board won't count." with "New board" / "Keep playing" (main) | dialog | SWD-055 |
| End game | dialog "End this game with no winner?" with "End the game" / "Keep playing" (main) | dialog | SWD-054 |
| End for tonight | dialog "End for tonight? Tonight's tally stays in History." (mid-game: "End for tonight? This game won't count in the tally.") with "End for tonight" / "Keep playing" (main) | dialog | SWD-060 |
| Summary | heading "Tonight's Secret Words"; `summary-line` "6 players · 3 games · 31 words found" ("1 game", "1 word found"); tally; `clue-credit` "Clues tonight from Riya, Nana and Zoya" ("Clues tonight from Riya" / "Clues tonight from Riya and Nana"); quiet "Oops, keep playing" (until recorded); quiet "← Home"; main "Play something else"; menu "Delete tonight's games" | h1; paragraphs; `tally`; buttons; main | SWD-060, 065, 128 |
| Delete tonight's games | dialog "Delete tonight's games? The games and tally will be lost." with "Delete" / "Keep it" (main) | dialog | SWD-065 |
| Players sheet | dialog "Players"; h2s "Chai Champions" / "Coffee Commandos"; per player: the name (button, accessible name "Rename Kabir"; tapping gives an input labelled "Player name" and quiet "Done"), quiet "Switch team" (guessers only; accessible name "Move Zoya to Coffee Commandos"), "✕" (accessible name "Remove Kabir"); adding: input labelled "Player name", placeholder "Type a name…", switch "Doesn't give clues", buttons "Add to Chai Champions" / "Add to Coffee Commandos"; main "Done"; toasts "Neha joined Chai Champions" (no Undo) · "Zoya moved to Coffee Commandos · Undo" · "Kabir left · Undo" | dialog; h2; buttons; input; `role="switch"`; `toast`; `undo-toast` | SWD-127 |
| New clue giver | dialog "Who gives clues for Coffee Commandos now?" with one button per eligible player of that team (`aria-pressed`) and main "Done" | dialog | SWD-127 |
| Team of one | dialog "Coffee Commandos would be left with only Om. Move someone over?" with buttons "Move Zoya over" (one per guesser who can move) and main "Don't remove Kabir"; if no one can: line "No one can move over." with main "Don't remove Kabir" and quiet "End the game" | dialog; buttons; paragraph | SWD-127 |
| Show the map sheet | dialog "Show the map to"; buttons "Riya (Chai Champions)", "Arjun (Coffee Commandos)" (pair: "Nana + Aarav (Chai Champions)"); quiet "Cancel" | dialog | SWD-037 |
| Sideways | "Turn your phone sideways to see the board." | paragraph `turn-sideways` (body text) | SWD-092 |
| History | "Secret Words · 3 games"; "Game 2 · Chai Champions won · Riya and Arjun gave clues"; "Game 2 · Chai Champions won (Landmine) · Riya and Arjun gave clues"; "Game 3 · Ended early · Meena and Kabir gave clues"; pair "Game 4 · Coffee Commandos won · Nana + Aarav and Kabir gave clues" | `history-game`; `history-round` | SWD-064 |
| Announcements | SWD-095 | `announcer` (`aria-live="polite"`) | SWD-095 |

| Version 3.6 strings | board-phone dialog "This phone is the board. Open the map here?" / "Clue givers use their own phone. To show the map on this phone, use Show the map to a clue giver in the game's menu." / quiet "Open the map here" / main "No, keep the board" · How to play rule 7 "Keep the host phone on the table: it shows the board." · `mismatch-line` "Doesn't match? Scan this code again." (scan screen) / "Doesn't match? Scan the host's code again." (map phone) · `map-end-line` "Game over: tap Done with this game. New board on the host: tap Next map." · `my-team` "I give clues for:" / "I give clues for: Chai Champions" + quiet "Change" · three-phone board check "Meena and Kabir: scan this code on your phones and check they start with: Kite · Tiffin · Rain. Riya and Arjun: tap Done with this game." · `turn-sideways` small line "Or choose the Easy board for the next game." · where-lines "Before game 1", "Scan the map, game 2", "Turn 4 · clue for Chai Champions", "Chai Champions guessing · 3 guesses left", "Turn 4 over · Coffee Commandos next", "Game over, game 2" · menu item "Flip the board" (160 px panel) | see each scenario | SWD-002, 011, 033, 034, 041, 092, 110, 116 |

| Version 3.7 strings | `map-key` "Chai Champions" · "Coffee Commandos" · "nobody" · "Landmine: never guess" (each after its icon) · `larger-text-hint` "Small text? Turn on Larger text in Settings." · flip button "↻ Flip" · two-phone line "Riya and Arjun give clues for different teams but share one map phone, as at a real table: sit side by side." · "Nobody's word. Other team's turn next." · "Train was nobody's." · "While you wait, Coffee Commandos: guess how many words Riya's clue will be for." · "Turn ends, and one of their words is turned over for them" · "Or type this code: 27P-3QX8" · "Don't remove Kabir" · "Switch team" · "Choose clue givers" · "Next map? Only after the host starts the next game." · "Keep the host phone on the table: it shows the board." · "Chai Champions · 4 players" | see each scenario | SWD-010, 031, 033, 034, 043, 102, 103, 124, 126, 127 |

### Menu ("··· Menu", top right) at each step
**Version 3.6:** the columns below say only *which* items a step has. On screen, items always appear in the group order of
SWD-110 (play · fix · leave · more), never in this table's column order.

Items in this order; **—** = not present; "disabled" = shown and disabled; "2/3" = only with two or three phones. "← Back" or
"Done" from Settings, History and How to play returns to the same step.

| Step | How to play | Earlier clues | Start 90-second timer / Stop timer | Clue not allowed? | Someone else taps Reveal | Players | Show the map to a clue giver | Show the map code again | New board | Pause | Home (keep this game) | End the game | End for tonight | Settings | History |
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
   | Setup screens, team moves, Shuffle, "New team names", Undo on teams, the "Doesn't give clues" switch and partner buttons (until the sheet's "Done"), choice cards, "Start", "Both have the map", "The map phone has the map", "I'm Riya" / "We're Nana and Aarav", "Not Riya? Go back", pad taps, number keys, the clue word, picks, "End our turn", "Oops, keep guessing", "Start 90-second timer", "Stop timer", How to play, "Clue rules", "Pause", "Carry on", "Home (keep this game)", "← Home" (except as below), Show the map to a clue giver, "Show the map code again", "Back to the game", "Our words", "Whole map", "See the map again", "Back to my clue", "Change clue" and "Try another clue" (until confirmed), "Keep my clue", "Clue not allowed?" (opens the dialog), "Let it go", "Someone else taps Reveal" and its dialog, "↻", Earlier clues, "Someone saw the map" (opens the dialog), "Undo" on "Game ended · Undo", "Oops, keep playing", "Swap clue givers" and its sheet's "Done", "Change teams, players, phones or board" (until "Start the game"), "Play again with these teams" (until "Start the game"), "Don't remove Kabir", the map phone's "Next map", "Orange team's words", "Teal team's words", "Whole map", "Hide map", "Show map", fades | nothing |
   | "Let's play" / "Show me the board first" / "Start the game" (new evening, also after "Play again with these teams") | evening created, then `deal` |
   | "I have my clue" | `mapSeen` (once per turn) |
   | "Clue for N: start guessing" (also after "Change clue" or "Try another clue") | `clue {n, word}` |
   | "Sunita: Reveal <WORD>" | `reveal {cell}` |
   | end-turn line's "Other team's turn" | `endTurn`, then `nextTurn` |
   | turn-over "Other team's turn" | `nextTurn` |
   | "Turn ends, and one of their words is turned over for them" | `brokeRule {cell}` |
   | "End the game" (dialog) | `endGame` when the "Game ended · Undo" toast expires, or at a tap that leaves game over, a reload or the app being hidden (SWD-054); nothing if "Undo" is tapped first |
   | "New board" (dialog, also from "Someone saw the map") | `dealNew {code}` |
   | "Play again" | `setTeams` (if "Swap clue givers" changed a switch), `setClueGivers` (if the clue givers or partners differ from the last game's), then `deal` |
   | "Change teams, players, phones or board" → … → "Start the game" | `setPlayers` (if names changed), `setTeams` (if changed), `setClueGivers` (if changed), `setChoices` (if changed), then `deal` |
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

**Version 3.6 test ids and hooks:** `pause-button`, `where-line`, `private-line`, `my-team`, `mismatch-line`, `anyone-line`, `other-phone-line`, `turn-sideways-hint`, `board-phone-dialog`; the tap-guard state `data-guard="on"` (SWD-114); tests set a saved map, with or without `t`, `p` and `team`, by writing `pgn.secretWords.map` directly (SWD-036's shape).
