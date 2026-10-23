# Word guidelines: every game, every screen, every word list (product owner, 23 October 2026)

**Binding for every game** (Tambola, Impostor, Secret Words, What Am I? and after). Two kinds of words: **screen words** (what
the app says: headings, buttons, lines, toasts) and **content words** (what the game plays with: word lists, team names,
categories, rhymes). Each rule says where it came from, so it can be challenged with evidence rather than taste.
`docs/ux-guidelines.md` covers sizes and layout; this file covers what the words say.

## Why this file exists
Across three games, more changes came from words than from rules. Tambola's Home didn't say "host" or "join"; Impostor said
"evening", "night" and "session" for one idea until the owner stopped it (I25); the "Cricket" category held Badminton (I22);
Jev rated 25 of 26 clue-screen flags on wording (I24); Secret Words needed a 24-line wording batch (W1–W24), a second set from
the prototype read, and terms like "Blank word", "Pass the pick" and "Teal list" that no persona understood. Every one was
cheap to fix in a document and expensive once tested and built.

## Part A. Screen words

**A1. One word per idea, the same word everywhere.** Pick one name for each thing and never use another. Impostor: "game",
never "evening", "night" or "session" (I25). Secret Words: "game night" for the evening, "board", "map", "clue giver",
"nobody's word". Keep a game's words in its text list (C2) and grep for the others before every hand-over.

**A2. Words a family uses, not words a designer uses.** Test: would a grandmother say it aloud at the table? "Blank word" →
"Nobody's word"; "Pass the pick" → "Someone else taps Reveal"; "Heads up" → "Careful"; "poker face" → "no hints, no faces";
"deck", "edition", "allowance", "picker", "kind" stay inside the code and the scenarios, never on screen.

**A3. Buttons say what happens, as a verb and its object.** "Reveal KITE", "End for tonight", "Remove this map", "Switch team".
Never a bare noun ("Swap" → "Swap clue givers"; "Teal list" → "Teal team's words") and never a name alone as an action ("Keep
Kabir" → "Don't remove Kabir").

**A4. The main button names the person or thing when that matters.** "I'm Riya", "Sunita: Reveal KITE", "Clue for 2: start
guessing". It stops the wrong person or the wrong word, and doubles as instruction.

**A5. Every screen answers "what next?" in words, not only in a menu.** Stop and home are visible where the guidelines say
(47a); after an interruption, a where-line says where the game is ("Chai Champions guessing · 2 guesses left").

**A6. Say what a choice does, in one short line, where the choice is made.** "Lose your turn: Step on it and your turn ends;
the other team gets one word free." A choice with no line beside it gets asked about at the table.

**A7. Tell people what happened, and whose it was.** Result lines name the outcome and the next step ("Nobody's word. Other
team's turn next."); a penalty says whose loss it is ("Turn ends, and one of their words is turned over for them").
Credit people, blame the board: name the clue giver on success, nobody on a mistake (B5, B6).

**A8. Undo and "oops" in the same voice.** Toasts "… · Undo" for an action just done by mistake; "Oops, keep playing" for a
change of mind. People smiled at "Oops" in every walk.

**A9. No possessives on names we generate, and plurals that read naturally.** Team names are plural phrases, so "Chai Champions
win!" and never "Chai Champions's"; where-lines say "clue for Chai Champions" (SWD-013). Plurals always counted: "1 word",
"2 words".

**A10. Never colour or shape alone; give the key in words.** Every icon has a word (guideline 17, 26); a board of coloured
cells has a one-line key, including what to avoid ("Landmine: never guess", P8).

**A11. Short, but never cryptic.** One idea per line; a line fits in 2 lines at 360 px with the longest real values (an
18-character team name, a 16-character player name). Cut words, not meaning: "Or type this code: 27P-3QX8", not "or type:".

**A12. Kind and calm.** No blame, no shouting, no fear: "Something went wrong; your game is safe." A real-weapon word needs
the owner's explicit choice (the Landmine, K28).

**A13. Explain why when a rule looks odd.** "Riya and Arjun give clues for different teams but share one map phone, as at a
real table." One clause of why removes most arguments.

**A14. No borrowed vocabulary that ties us to another product.** Secret Words never says "spymaster", "agent", "assassin",
"codename" (K22); "Inspired by Codenames" only where the legal note allows.

## Part B. Content words

**B1. Known everywhere in India.** English, or an Indian word that a non-Hindi speaker from Tirunelveli or Sivagangai knows at
once (K24). Regional words are welcome when they are balanced across regions (Idli, Pongal and Onam beside Holi and Jalebi).

**B2. Names in English.** Game names, team names, pack names and the danger card are plain English (K1, K23).

**B3. Family-friendly by default.** "Whole family" is the default list; harder words are an opt-in ("+ Harder words",
"+ Grown-ups"). Non-veg food words carry a flag and are off by default where the game puts them in someone's mouth
(Impostor, What Am I?) (I13, WA9). Nothing political, religious-divisive, about caste, region, gender or bodies.

**B4. Words a 10-year-old can play.** Act it out, describe it, or clue it: if a child can't, it goes to the harder list.

**B5. Fit the screen before the list is approved.** Secret Words: at most 8 letters on the board (K10), and a word that still
won't fit shrinks alone with tap to zoom (SWD-090). Every list gets a length check by code, not by eye.

**B6. Categories must make sense to a player who sees them.** Badminton under "Cricket" broke Impostor (I22). Where players never
see the category (Secret Words), category fit doesn't matter and isn't checked.

**B7. Fun is a requirement, not a garnish.** The owner asked for quirky, funny words (I16) and funny team names (K25). Each list
has a share of words that get a laugh, checked by the same fairness rules.

**B8. Close words are a game problem, not a list problem.** Words too close to each other spoil a board; check them on dealt
boards (simulated table games), not in the abstract.

**B9. One list per edition, versioned.** A word is changed or retired by edition; saved games keep the words they were played
with (SWD-023).

## Part C. How we check words, every time
1. **One source of truth.** Screen words live in the scenarios' canonical strings table and the game's `text.csv`; content
   words in `words.csv`. A wording change edits both in one commit (`text.csv` is regenerated from the table).
2. **Persona walks read words first.** The six personas report "words I didn't understand" on the screen map, then on the
   prototype; anything two personas flag is reworded.
3. **Jev reads every label and every word.** "Would most Indian families, including a non-Hindi speaker from Tirunelveli,
   understand this at once?"; below 0.5 is reworded or replaced unless it's a name or a deliberate term with a key (Landmine).
   Content words: known at once and family-friendly, every edition.
4. **Simulated table games** for games with word boards or clues: words confused on dealt boards, clue rules that trip people.
5. **Reader checks** confirm every string is exact and appears once in its final form.
6. **Before release,** grep the game's screens for the words it must never use (A1, A14).

## Lessons by game (the record)
| Game | Word problem | What fixed it |
|---|---|---|
| Tambola | Home said neither "host" nor "join" | "Host a game" / "Join a game" (P11) |
| Tambola | "Close the prize" not obvious in a family play-test | Verb and object on the button, play-tested |
| Impostor | "evening", "night", "session" for one thing | "game" only (I25) |
| Impostor | Badminton, Hockey, Chess under "Cricket" | "Sports and games" (I22) |
| Impostor | Clue screen's quiet button read as the first step | "Go round again", moved and reworded (I24) |
| Secret Words | Hindi words a Tamil family wouldn't know | Tirunelveli test (K24); 35 words replaced |
| Secret Words | "Ghost", "Bhoot", then "Landmine" | English names (K23); owner's choice of tone (K28) |
| Secret Words | 24 unclear strings on the map walk | Wording batch W1–W24 |
| Secret Words | "Blank word", "Pass the pick", "Teal list", rival clue givers "side by side" | 3.7 rewording (P4–P7) |
| Secret Words | "Part of a board word" read as letters (Pan/Japan) | Rule says forms and parts, with an example |
