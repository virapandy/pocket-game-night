# Secret Words: theme and screens (draft, 4 October 2026)

**Binding details are in scenarios.md; where this file differs, scenarios.md wins.**
Product owner, from the app research in `research.md` §3 and the lessons of Tambola and Impostor. To be reviewed with
the UX designer at phone sizes before the owner's walk-through (process step 3). Sizes are predicted from Tambola's
measured layout (main button 60 px tall, 16 px gutters, 17 px body, 48 px quiet buttons) and must be measured on the
first build.

## 1. Choosing the theme
### What the existing apps do
| Look | Used by | Strength | Weakness for us |
|---|---|---|---|
| 1960s spy / noir dossier | Codenames itself, Secret Agent, most clones | Says "secret" at once | **Closest to Codenames' trade dress**; dark and adult; "assassin" is wrong for children |
| Flat, minimal grid | Horsepaste, Speednames | Most legible, fastest, smallest | Feels like a utility; no party energy; red/blue only failed colour-blind players |
| Pictures / Disney characters | Codenames Pictures, Disney Family | Great for small children | Licensed characters; needs art; theme knowledge splits groups |
| Team colours as the turn signal | Codenames App 2024 (whole background in team colour) | Whose turn is obvious from across the table | Colour alone; a full-colour background clashes with our cream look |

### Options for us, scored
| Option | Distinct from Codenames | Family and kids | India-centric | Legible on a phone | Fits our look (cream, red main button) | Tone (a mistake gets a laugh) |
|---|---|---|---|---|---|---|
| A. Spy noir ("agents", black) | ✗ | ✗ | ✗ | ~ | ✗ dark | ✗ "assassin" |
| B. Desi detective ("Jasoos", case files) | ~ still spy | ~ | ✓ | ~ | ~ | ~ |
| C. Flat minimal, red v blue | ✓ | ~ | ✗ | ✓ | ✗ **red is our main-button colour** (guideline 17a) | ~ |
| **D. Flat board + Indian festive teams: Mango v Peacock, the Ghost** | **✓** | **✓** | **✓** | **✓** | **✓** | **✓** |

### Decision (product owner; owner may overrule, K2)
**Option D: Tambola's clean, flat look for the board, with two Indian team identities and a friendly ghost.**
- **Team Mango** (deep mango orange) and **Team Peacock** (peacock teal): the national fruit and the national bird,
  known to every region and every age, no politics, no religion. Orange and teal stay apart for the common colour-vision
  deficiencies (unlike red and green or red and blue).
- **Nobody's words:** light sand, with a plain dot.
- **The Ghost** (instead of an assassin): a friendly cartoon ghost on near-black. "You woke the Ghost!" gets a laugh,
  never a put-down. Plain English, like every name in the game (owner, 4 October, K23).
- **Never colour alone** (guideline 26): every turned-over word and every map cell carries an **icon and a word**:
  mango, feather, dot, ghost; "Mango", "Peacock", "Nobody", "Ghost".
- **Red stays for the main button only**; turns are shown by a slim team-coloured bar **and** the team's name, not a
  full-screen colour.
- **No Codenames vocabulary:** "clue giver", "guessers", "the map", "words", "the Ghost"; never "spymaster", "agent",
  "operative", "assassin", "key card", "codename".

### Colours (to be checked by the coder; text contrast ≥ 4.5:1, guideline 25)
| Token | Light | Dark | Used for |
|---|---|---|---|
| `--mango` | #B45309 | #F59E0B | Mango cells (white text in light, near-black text in dark), Mango bar |
| `--peacock` | #0F766E | #2DD4BF | Peacock cells, Peacock bar |
| `--nobody` | #E7DFD3 | #3A3632 | Nobody's cells (text `--text`) |
| `--ghost` | #1C1B1A | #F3EFE9 | The Ghost cell (inverted text) |
Face-down words: `--surface` with a 1 px `--border`. A picked word: Tambola's "selected" look (outline, ✓, tint),
never the main look and never a team colour.

## 2. Screens
Shared rules: one full-width main button at the bottom, always the next step; quiet outlined buttons above it;
"··· Menu" top right; "← Back" on setup screens only; nothing auto-advances at a decision (guideline 48); a reveal is
pick, then confirm (guideline 47); the screen stays awake from the deal to the game result.

### 1. What shall we play?
A third equal card: **Secret Words** "Inspired by Codenames · team word hunt · 4–20 players · about 15 min a game".

### 2. Who's playing?
The shared names step (PLT-024), tonight's names filled in. "Next" needs at least 4 names.

### 3. Make teams
```
← Back                         ··· Menu
Make teams
 Mango 🥭 (4)          Peacock 🪶 (3)
 Riya  ★ clue giver     Arjun ★ clue giver
 Meena                  Kabir
 Zoya                   Dev
 Om
[ Shuffle teams ]  [ Change clue givers ]
Tap a name to move it to the other team.
[               Next               ]
```
- First time tonight: shuffled into teams differing by at most one. Later games: last game's teams.
- Tap a name: it moves to the other team, with "Om moved to Peacock · Undo".
- ★ clue giver suggested by rotation (rule 17); "Change clue givers" opens a pick per team.
- "Next" disabled with "Each team needs at least 2 players." when a team has fewer.
- Icons in sketches are placeholders: the build uses our own SVG mango and feather, not emoji.

### 4. How do you want to play?
```
← Back
How do you want to play?
How do clue givers see the map?
 ┌──────────────┐ ┌──────────────┐
 │ Pass this    │ │ Clue givers' │
 │ phone        │ │ own phones   │
 │ One phone,   │ │ Scan a code; │
 │ hold to see  │ │ works offline│
 └──────────────┘ └──────────────┘
Board   [ Full: 25 ✓ ][ Family: 16 ]
Words   [ Whole family ✓ ][ + Grown-ups ]
[            Deal the words            ]   (disabled until a map card is chosen)
```

### 5. Read this aloud (first Secret Words game of tonight's session, once)
1. "Two teams, Mango and Peacock. Each has a clue giver who sees the secret map."
2. "Clue givers: say one word and a number. 'Monsoon, 2' means two of our words go with monsoon."
3. "Guessers: talk, then turn over words one at a time. Wrong word? Your turn ends."
4. "Find all your words first. Turn over the Ghost and you lose!"
Main "Let's play"; quiet "Show me the board first" (opens the board with no turn started, then "Start").

### 6. Seeing the map
**One phone:**
```
A (room)                    B (private, held)                  B (released)
┌────────────────────┐    ┌──────────────────────────┐     ┌──────────────────────┐
│ Mango's turn       │    │ RIYA · Mango's map       │     │ RIYA · Mango's map   │
│ Pass the phone to  │    │ ┌──┬──┬──┬──┬──┐          │     │ (map hidden)         │
│      RIYA          │    │ │🥭│· │🪶│👻│🥭│  5 × 5    │     │                      │
│ Mango's clue giver │    │ ... words in their colour │     │ [Hold here to see]   │
│ [ I'm Riya ]       │    │ found words faded         │     │ Tap instead          │
└────────────────────┘    │ [ holding … ]            │     │ [ I have my clue ]   │
                          └──────────────────────────┘     └──────────────────────┘
```
- The map shows only while the pad is held (Impostor's hold-to-see, guideline 45). "Tap instead" shows it until
  "Hide" or 60 s after the last tap (thinking takes longer than an Impostor reveal's 8 s).
- The map never appears on a room screen. Leaving the app hides it at once.
- "I have my clue" appears after the first hold; it hides the map and opens the clue screen.

**Clue givers' own phones** (once per game, after the deal):
```
Clue givers, scan your map
 Riya (Mango) and Arjun (Peacock)
     ┌────────┐
     │   QR   │      or type: K7P-3QX4
     └────────┘
 Everyone else: look away from their phones.
[         Both have the map         ]
```
On the clue giver's phone: the map, always visible, "Hide map" / "Show map", tap a word to fade it as found (this phone
only), "Done with this game" at the end. Opening the link also works with no internet.

### 7. The clue
```
Mango's turn  ▌(mango bar)          ··· Menu
Riya, say your clue out loud.
How many words is it for?
 [0][1][2][3][4]
 [5][6][7][8][9]
 [   ∞  as many as you like   ]
 Mango 9 left · Peacock 8 left
 [ Hurry up: 90 s ]
[       Clue for 2: start guessing     ]   (disabled "Pick a number" until one is picked)
```
Keys 56 × 56 px, selected look on the chosen number.

### 8. The board (guessing)
Landscape (recommended when the phone lies in the middle):
```
┌───────────────────────────────────────────────────┬────────────────┐
│ Cricket │ Bat    │ Monsoon│ Kite   │ Tiffin       │ Mango guessing │
│ Ring    │ Rocket │ Chalk  │ Ganga  │ Match        │ Clue: 2        │
│ Fan     │ Star   │ Pitch  │ Train  │ Mehendi      │ 3 guesses left │
│ Cup     │ Bank   │ Lassi  │ Ghost  │ Paneer       │ 🥭 7 · 🪶 8     │
│ Tiger   │ Moon   │ Ticket │ Chain  │ Station      │ [End our turn] │
│                                                   │ [Reveal KITE]  │
└───────────────────────────────────────────────────┴────────────────┘
```
- Words are as large as fits: one size for the whole board, the largest from 22 px down to 12 px at which every word on
  that board fits on one line. Words have at most 8 letters (`words.md`).
- Portrait works at 360 px wide and up; at 320 px wide in portrait the board asks "Turn your phone sideways to see the
  board." (the longest words can't fit at 12 px).
- Tap a word: selected look. Main "Reveal KITE" (pick, then confirm). "End our turn" disabled until one guess is made.
- After a reveal, one result line above the buttons: "✓ Mango's word! 2 guesses left." · "Nobody's word. Peacock's
  turn next." · "✗ Peacock's word! It counts for them."; the Ghost goes straight to game over
- Menu: see the menu table in `scenarios.md` ("How to play" replaces "Rules").

### 9. Turn over, game over
- Turn over: the result line stays, the board stays visible; main "Peacock's turn" → screen 6A for Peacock (one phone)
  or screen 7 (own phones).
- Game over: "Mango wins! All 9 words found." (Ghost: "Mango wins!" with "Peacock woke the Ghost!"), the **whole map** on the
  board: face-down words now coloured but faded, turned-over words solid. "Tonight: Mango 2 · Peacock 1". Main
  "Play again"; quiet "Change teams", "End the evening".

### 10. End of the evening
"Tonight: Mango 3 · Peacock 2"; fun lines ("Riya's clues won 2 games", "The Ghost woke up 1 time"); "Play something
else"; "Back to Home".

## 3. Lasting rule added to `docs/ux-guidelines.md`
49. **Word boards on a shared phone.** A board of many words can't meet the 56 px table-text rule (46). Instead: landscape
first, one font size for the whole board (the largest that fits, never below 12 px), words of at most 8 letters, a
smaller board option (16 words) and a "turn sideways" message where even 12 px can't fit. Guessers lean in, as they
do over a real board.

## 4. Play-test questions
Can 6 people read the board on one phone lying in the middle? Does holding the phone to see the map feel natural for
a 60-second think? Is "Pass this phone" or "own phones" more popular? Is the Family board too easy for adults?
