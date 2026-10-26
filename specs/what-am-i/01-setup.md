# What Am I?: 01 Setup

Copied from `docs/games/what-am-i/scenarios.md` version 1.3 (approved by the owner, 24 October 2026) with Version 1.4 (product owner, 26 October 2026). Each scenario
carries the Version 1.1 to 1.4 items that name it, word for word; a later version wins over earlier text in the
same scenario (1.4 over 1.3 over 1.2 over 1.1 over the body). Terms, canonical strings and test hooks: [README.md](README.md);
the exact rule API and browser hooks the tests use: [api.md](api.md).

### WAI-001 Picking What Am I?
Status: approved · Phase: What Am I? 1
Home's "Host a game" line lists What Am I? among the games (titles joined with ", " and " or " before the last). The picker
"What shall we play?" shows the What Am I? card (Canonical strings) after Secret Words' card, all cards equal in width and
height (±1 px). Tapping it opens "Who's playing?"; with an unfinished What Am I? game night, the shared Start new dialog (as
SWD-115) opens instead: "Start new (ends that one)" records `endEvening` for it and opens "Who's playing?"; "Carry on that
one" resumes it (WAI-091).

**Version 1.1** (wins over the text above):
1.1 item 41: Start new dialog: h1 "Start a new game night?"; body "The game night from 8:05 pm (Riya, Arjun +4) will end."; two equal
    quiet buttons "Carry on that one", "Start new (ends that one)"; no main button.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 1: **A guest on their own phone** (guest walk, stuck): Home's shared "Join a game" screen gains the line, after the other games'
   lines: "What Am I? is played on the host's phone. Ask the host to add your name." (`join-line-what-am-i`).

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 10: **The picker gets a way back** (four walks; Jev: A2's way out 0.06): "What shall we play?" gains a quiet "← Home". It is the
    shared picker, so this changes every game's picker (C1; product owner's call, listed for the owner).

### WAI-002 Who's playing?
Status: approved · Phase: What Am I? 1
Impostor's names screen (IMP-003) with: no "Sit in a circle…" line; ▲ ▼ replaced by a drag handle per name (accessible name
"Move Riya", with "Move up" / "Move down" actions for keyboards and screen readers); the small line "Players take turns in this
order. Drag a name to move it." under the h1. Tonight's names filled in in their last order. "Next" is disabled with fewer than
2 names, and "What Am I? needs at least 2 players." shows below the list whenever that is true. A 21st name shows "Up to 20
players." and adds nothing. ✕ removes a name with the undo toast "Kabir removed · Undo". Every Enter adds its name and keeps
the field focused (as SWD-132). "← Back" → the picker. "Next" → Words and time.

### WAI-003 Words and time
Status: approved · Phase: What Am I? 1
The page scrolls at every size; the main button stays fixed.
1. **"Which words?"**: a radio group of 9 options in this order: Mix of all, Animals, Food, Around the house, Jobs, Sports and
   cricket, Festivals and places, Act it out, Famous Indians. Each label "<Pack> · <n> words" with n = eligible words of that
   pack (R3 for Mix of all). With `words.csv` edition 1 and non-veg off: Mix of all 714, Animals 92, Food 88, Around the house
   100, Jobs 94, Sports and cricket 87, Festivals and places 91, Act it out 100, Famous Indians 64; with non-veg on, Food 98
   and Mix of all 724. The selected option shows a ✓ and `aria-checked="true"`. Mix of all has the small line "Words from
   every pack." Default: Mix of all.
2. **"Time for each turn"**: 30 s · 60 s · 90 s (default 60 s), small line "30 s for small kids, 90 s for grandparents".
3. **"How to hold the phone"**: "In the guesser's hand" with small line "Forehead or chest; the guesser moves it to answer." ·
   "Hands-free" with "The phone stands behind the guesser; one clue giver taps to answer. Good for grandparents and small
   children." Default: In the guesser's hand.
4. **Switches**: "Include non-veg food (chicken, fish, egg)" (default off); "Sounds" (default on) with the small line "So the
   guesser knows a word counted." while on and "The guesser won't know a word counted." while off.
5. Small line "Ready as it is, or change anything above." directly above the main button "Start with these words".
Every choice starts from the last-used values on this phone (pack, time, hold, both switches); the first time, the defaults.
"← Back" → Who's playing? (names kept). "How to play" → WAI-006.

**Version 1.1** (wins over the text above):
1.1 item 2: **Input order.** Before shuffling, eligible words are sorted by `id` ascending. R3: Mix of all keeps the copy with the
   lowest id (Bat WAIW-040 in Animals; Swimming WAIW-181 in Sports and cricket); T3's pack name and the saved id are that copy's.
1.1 item 22: WAI-003: the page scrolls at every size; the main button stays fixed. (The "no page scrolling" sentence is withdrawn.)
1.1 item 45: WAI-003's options are `role="radio"` with `aria-checked` (an exception to Impostor's Selected term). Last-used values are
    saved at `start`.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 4: **Hold, one place to read it** (uncle, distracted host): S2's "How to hold the phone" gains the small line "You can change
   this for one player on their turn." T1's quiet buttons stay "Hands-free for Riya" / "Riya will hold it".

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 4: **S2 order** (grandparent, distracted host: the hold choice was buried under nine packs): "Time for each turn", then "How to
   hold the phone", then "Which words?", then the two switches.

**Version 1.4** (product owner, 26 October 2026; wins over the text above, and over Versions 1.1 to 1.3):
1.4 item 3: "Hands-free" → **"Stand the phone up"** everywhere on screen: S2's option (its small line unchanged); T1's quiet buttons
   "Stand the phone up for Riya" / "Riya will hold it"; the hold line "Stand the phone up (Riya's choice)"; Read this aloud's
   hands-free sentence starts "Or stand the phone up behind the guesser; …". The `free` hold keeps its name in code.

### WAI-004 Starting a game
Status: approved · Phase: What Am I? 1
When this is the first What Am I? game of tonight, "Start with these words" opens Read this aloud (WAI-005) and records
nothing; its "First turn" records `start`. Otherwise "Start with these words" records `start` and opens T1 for the first player.
`start` holds the choices and the turn order; scores are 0 for everyone.

### WAI-005 Read this aloud
Status: approved · Phase: What Am I? 1
The card reads, in hand hold: "One of us holds the phone on their forehead or chest, screen to the room. Everyone else gives
clues: talk, act, make the noise, but never say the word. Got it? Move the phone down. Stuck? Move it up to pass. Passing is
free. Marked wrong? Fix it when time's up. You have 60 seconds. Play as many rounds as you like; tap End the game to see who
got the most." ("60 seconds" is the chosen time: "30 seconds", "90 seconds".) In hands-free hold, the sentences "Got it? Move
the phone down. Stuck? Move it up to pass." become "The phone stands behind the guesser. One clue giver taps the bottom for Got
it, the top to pass." Fits without scrolling at every size with Larger text off. "First turn" → T1 for the first player;
"← Back" → Words and time with every choice kept (nothing was recorded).

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 12: **Do Not Disturb** (critic 7): Read this aloud ends with the sentence "Tip: turn on Do Not Disturb so messages don't buzz."
    A notification banner or a system dialog over the page (battery saver, a permission prompt) does not pause the turn; only
    the page being hidden does (WAI-040).

**Version 1.4** (product owner, 26 October 2026; wins over the text above, and over Versions 1.1 to 1.3):
1.4 item 3: "Marked wrong? Tap a word to move it." → **"A word in the wrong list? Tap it to move it."**; Read this aloud's "Marked
   wrong? Fix it when time's up." → "A word in the wrong list? Fix it when time's up."

### WAI-006 How to play
Status: approved · Phase: What Am I? 1
Opened from S1, S2, S3 and the menu. h1 "How to play"; the steps of `guide.md` "How to play" in short lines, with three drawings
(phone on a forehead, on a chest, standing behind a player), each with alt text ("Phone held on the forehead, screen facing
the room" etc.); main "Done" → the screen it was opened from, unchanged.

**Version 1.1** (wins over the text above):
1.1 item 42: How to play lines (an `ol`): 1 "One player guesses. They hold the phone on their forehead or chest, screen facing the
    room." 2 "Everyone else gives clues: talk, act, make the noise. Never say the word." 3 "Got it? Phone down. Stuck? Phone up to
    pass. Passing is free." 4 "Hands-free: stand the phone behind the guesser; a clue giver taps the bottom for Got it, the top to
    pass." 5 "When time's up, fix any word marked wrong, then save the score." 6 "Pass the phone to the next player. Everyone
    once is a round." 7 "Play as many rounds as you like. End the game to see who got the most."
1.1 item 43: Drawings (`hold-drawing`), alt texts: "Phone held on the forehead, screen facing the room" · "Phone held against the chest,
    screen facing the room" · "Phone standing behind a seated player, facing the room".

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 13: **Saying the word or peeking** (critic 11): How to play gains line 5b, after line 5: "Said the word, or the guesser peeked?
    Move that word to Passed when time's up."

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 7: **How to play, scoring and judging** (uncle): after line 5: "One point for each word you got. Passing costs nothing." and
   "The room decides if a clue broke the rules."

**Version 1.4** (product owner, 26 October 2026; wins over the text above, and over Versions 1.1 to 1.3):
1.4 item 3: "Hands-free" → **"Stand the phone up"** everywhere on screen: S2's option (its small line unchanged); T1's quiet buttons
   "Stand the phone up for Riya" / "Riya will hold it"; the hold line "Stand the phone up (Riya's choice)"; Read this aloud's
   hands-free sentence starts "Or stand the phone up behind the guesser; …". The `free` hold keeps its name in code.
Tester's reading (26 October, in `docs/test-questions.md` for the product owner): Read this aloud's card (WAI-005) has no
   "Hands-free" in it; the only on-screen sentence that starts "Hands-free" and goes on "stand the phone … behind the guesser; …"
   is How to play's line 4 (1.1 item 42). So line 4 reads **"Or stand the phone up behind the guesser; a clue giver taps the
   bottom for Got it, the top to pass."**, and WAI-005's hands-free sentences stay as they are.

