# Mafia: scenarios (version 1.0, draft, 25 October 2026)

Status: **draft, not yet approved.** Written to `docs/spec-rules.md` from `screen-map.md` draft 4, `guide.md`, `lifecycle.md`,
`stories.csv` edition 1.2 and decisions MF1–MF15 (`docs/decisions.md`). Before approval: the two-reader check (rule 12), then
the owner. After approval the tester copies each section into `specs/mafia/` (file names in the headings) and writes tests.
Mafia may be tested and built alongside What Am I?, and is **released after it** (owner, 24 October; roadmap).

**This file is binding: where `screen-map.md`, `guide.md`, `lifecycle.md` or `stories.md` differ, this file wins.**
Phase: **Mafia 1** = first release, every scenario here unless it says "later".
Change classes (`docs/change-sop.md`): the deal and its seed, the night rules and their resolution, winning, saved game nights
and the stories file = **C3** (tests first: sections 02, 03, 05, 10); screens = C1/C2.

---

## Terms
Terms defined in `docs/games/impostor/scenarios.md` mean exactly the same here: **main button, quiet button, small text link,
selected, tint, greyed, disabled, small line, body text, toast, dialog, Larger text, fits in N lines, no page scrolling,
names, plurals, t = …, sound on**. Undo toasts last **10 s**. Characters as in Secret Words' Terms ("·" U+00B7 with a space
either side; "←" U+2190; "✕" U+2715; "–" U+2013; apostrophes U+0027).

| Term | Meaning |
|---|---|
| **Screen sizes** | 320 × 568, 360 × 640, 390 × 844 (portrait), 812 × 375 and 568 × 320 (landscape). "Every size" = all five, Larger text off and on. |
| **Roles** | `mafia`, `doctor`, `police`, `villager`. On screen: "Mafia", "Doctor", "Police", "Villager". The sides: **the Mafia** (every `mafia`) and **the Village** (everyone else). |
| **Mafia count** | The number of `mafia` dealt in a game. **Suggested**: 5–7 players → 1, 8–11 → 2, 12–15 → 3, 16 → 4 (MF5). |
| **In / out** | A player is **in** until they are out at night, voted out, or leave. Players who are out stay at the table and in the night pass (ghost guess). |
| **Shown role** | A player's role is **shown** when they go out at night or are voted out (MF3). A **leaver's** role is not shown until game over (MF10). |
| **Tonight / game night** | One Mafia saved game night (engine `SavedGame`), from the first `start` to `endEvening`, holding every game of that night; joins tonight's session as IMP-102. On screen "tonight" only. |
| **Game** | From `start` (the deal) to game over or `endGame`. **Game index** k = 1 for tonight's first game. |
| **Round** | Night r and the day r after it. Night 1 comes first (MF guide rule 1). |
| **Night order** | Every player dealt this game who hasn't left, in seat order, starting at seat ((k − 1) + (r − 1)) mod n, where n = players dealt this game and seats are numbered 0 to n − 1 in S1's order; a seat whose player has left is skipped. |
| **Private screen** | B2 (role card) and N2 (night job): reached only through a pass screen; no menu, no Pause, no toast. Every other screen is a **room screen**. |
| **Guard** | A main button ignores taps for 800 ms after its screen mounts (1000 ms for "I'm Riya") and keeps its normal live look meanwhile; a tap during a guard does nothing and is never carried to the next screen (as WAI and SWD-114). |
| **Night job guard** | N2's main button stays hidden until **both**: 4000 ms have passed since the job was first shown on this N2, and a name is picked (MF1). The 4000 ms keep counting while the job is hidden again. |

Example players in seat order: **Riya, Arjun, Meena, Kabir, Zoya, Dev, Om, Sunita, Neha** (9). Example deal (game 1, seed fixed
by MAF-H2): Mafia **Arjun** and **Zoya**; Doctor **Meena**; Police **Dev**; Villagers Riya, Kabir, Om, Sunita, Neha. Added later:
**Imran**. Plurals: "1 player" / "2 players"; "1 game" / "2 games"; "1 Mafia" / "2 Mafia" (Mafia has no plural form).

## Canonical strings
| Where | Exact text | Element | ID |
|---|---|---|---|
| Picker card | "Mafia" · "Find the Mafia before they find you · 5–16 players · 15–30 min a game" | button, name starts "Mafia" | MAF-001 |
| Home unfinished row | line 1 "Mafia · Night 2 · Meena's turn with the phone"; line 2 "Riya, Arjun +7 · 9:10 pm · Tap to resume" | inside `unfinished-games` | MAF-091 |
| Who's playing? | h1 "Who's playing?"; "Mafia needs at least 5 players."; "Up to 16 players."; "Riya is already playing. Add an initial, like Riya S."; toast "Kabir removed · Undo"; small text link "How to play"; quiet "← Back"; main "Next" | h1; `role="alert"`; toast; buttons | MAF-002 |
| Roles | h1 "Roles for 9 players"; "Mafia: 2" with buttons "−" "+" (names "Fewer Mafia", "More Mafia"); "We suggest 2 for 9 players."; "Doctor: 1", "Police: 1", "Villagers: 5"; 5 players: "With 5 players: 1 Mafia and 4 Villagers. Doctor and Police join at 6."; rules box (MAF-003); small text link "How to play"; quiet "← Back"; main "Give everyone a role" | h1; lines; buttons; main | MAF-003 |
| Read this aloud | h1 "Read this aloud"; card text (MAF-005); quiet "← Back"; small text link "How to play"; main "Pass the phone round" | h1; paragraph; buttons | MAF-005 |
| Deal pass | "Player 2 of 9"; "Pass the phone to"; RIYA; "Everyone else, look away!"; main "I'm Riya" | `deal-progress`; `pass-name`; paragraph; main | MAF-010 |
| Role card | "Player 2 of 9"; RIYA; quiet "Tap instead"; pad "Hold here to see your role" (tap mode "Tap to see" / "Tap to hide"); role lines (MAF-011); quiet "First time? What this role means"; "Not Riya? ← Back"; quiet "Someone saw my role"; main "Done, pass to Arjun" / "Done, everyone's seen" / in D5 "Done, back to the day" | as IMP-010 | MAF-011–014 |
| Night begins | h1 "Night 1"; "Pass the phone round once more. Everyone does the same: tap to see your night job, pick one name, tap Done, pass it on."; "Keep your face still!"; main "Start the night" | h1; paragraphs; main | MAF-020 |
| Night pass | "Night 1 · 3 of 9"; "Pass the phone to"; MEENA; "Everyone else, look away!"; out player: "You're out: pick who you think is Mafia."; main "I'm Meena" | `night-progress`; `pass-name`; paragraphs; main | MAF-021 |
| Night job | "Night 1"; MEENA; pad "Tap to see your night job" / "Tap to hide"; job line and result line (MAF-022–026); "Not Meena? ← Back"; main "Done, pass to Kabir" / last "Done, night over" | `night-progress`; `pass-name`; button; `job-line`; `night-names`; `result-line`; main | MAF-022 |
| Night over | h1 "Night over."; "Host, take the phone and read the morning aloud."; main "Read the morning" | h1; paragraph; main | MAF-028 |
| Morning | h1 "Morning, day 1"; the story; role line "Kabir was a Villager." / "Kabir was MAFIA!"; count line "8 players left · Mafia caught: 0 of 2"; quiet "See my role again", "End the game", "← Home"; main "Start talking" / "See who won" | h1; `story`; `role-line`; `count-line`; buttons | MAF-030 |
| Day | h1 "Day 1 · Talk it over"; h2 "Who's still in"; out players "Kabir · Villager · out night 1"; "Out players: watch quietly, no hints!"; quiet "See my role again"; small text link "Start a 2-minute timer" / "Stop timer"; `day-timer` "1:59"; "Time's up!"; quiet "← Home"; main "Time to vote" | h1; h2; list; small lines; buttons | MAF-031 |
| Countdown | heading "Everyone in, point at who you think is Mafia."; "3", "2", "1", "Point!"; quiet "Not yet" | `countdown-heading`; `countdown-number`; button | MAF-032 |
| Picker | h1 "Who got the most fingers?"; name buttons; "Not sure?"; text buttons "It's a tie", "Count again", "Nobody today"; quiet "← Back to talking"; main "Vote out" (disabled) / "Vote Kabir out" | as IMP-031 | MAF-033 |
| Tie | h1 "Tap everyone who is tied"; "Not a tie"; main "Point again: Kabir or Om"; re-vote "Still a tie"; second tie h1 "Still a tie. Nobody is out today."; quiet "← Home"; main "Start night 2" | as IMP-032 | MAF-034 |
| Nobody today | dialog "Nobody out today?"; "Nobody goes out today. Straight to night 2."; "Nobody today" / "Back to the vote" (main) | dialog | MAF-035 |
| Vote result | h1 "KABIR is out."; after 1.5 s "Kabir was MAFIA!" / "Kabir was a Villager." / "Kabir was the Doctor." / "Kabir was the Police."; count line; quiet "End the game", "← Home"; main "Start night 2" / "See who won" | h1; `role-line`; `count-line`; buttons | MAF-036 |
| Leave | dialog "Kabir has to leave?"; by day "Kabir goes out now. Their role stays secret until the game ends."; at night "Kabir leaves when this night is over. Their role stays secret until the game ends."; "Kabir leaves" / "Don't remove Kabir" (main); toast "Kabir left · Undo" | dialog; toast | MAF-052 |
| Deal again | dialog "Deal again?"; "Everyone gets a new role."; "Deal again" / "Keep these roles" (main) | dialog | MAF-014 |
| See my role again | dialog "Whose role?"; names of players in; "Cancel" | dialog | MAF-015 |
| Paused | dialog "Paused"; where-line; "Tap Carry on when everyone's back."; main "Carry on" | dialog | MAF-050 |
| End the game | dialog "End this game with no winner?"; "Everyone's role will be shown."; "End the game" / "Keep playing" (main); toast "Game ended · Undo" | dialog; toast | MAF-054 |
| End for tonight | dialog "End for tonight?"; "Tonight's score stays in History." / mid-game "Tonight's score stays in History. This game won't count."; "End for tonight" / "Keep playing" (main) | dialog | MAF-063 |
| Game over | h1 "The Village wins!" + "Every Mafia is out." / "The Mafia win!" + "They're as many as everyone else." / "Game ended. No winner."; leaver line "Kabir had to leave."; h2 "Who was who"; rows "Arjun · Mafia · voted out day 2"; quiet "What happened each night"; fun lines (MAF-062); "Tonight: Village 2 · Mafia 1"; quiet "Change players or roles", "End for tonight", "← Home"; main "Play again" | h1; small lines; h2; list; buttons | MAF-060–062 |
| Tonight's summary | h1 "Tonight's Mafia"; "9 players · 3 games"; "Village 2 · Mafia 1"; "Arjun was Mafia in 2 games"; "Best Mafia spotter tonight: Om"; quiet "Oops, keep playing", "← Home"; main "Play something else" | h1; small lines; buttons | MAF-064 |
| Where-line | "Night 2 · Meena's turn with the phone" · "Morning, day 2" · "Day 2 · talking" · "Day 2 · vote" · "Game over, game 2" | `where-line` | MAF-090 |
| Menu | "How to play", "Players", "See my role again", "Deal again", "Pause", "Home (game is saved)", "End the game", "End for tonight", "Settings", "History" (only those that apply, this order) | menu items | MAF-053 |

---

## 01 Setup → `specs/mafia/01-setup.md` (C1/C2)

### MAF-001 Picking Mafia
Status: draft · Phase: Mafia 1
Home's "Host a game" line lists Mafia **after What Am I?** (titles joined with ", " and " or " before the last). The picker shows
the Mafia card (Canonical strings) **after the What Am I? card**, all cards equal in width and height (±1 px). Tapping it opens
"Who's playing?"; with an unfinished Mafia game night, the shared Start new dialog (as SWD-115) opens instead: "Start new (ends
that one)" records `endEvening` for it and opens "Who's playing?"; "Carry on that one" resumes it (MAF-091).

### MAF-002 Who's playing?
Status: draft · Phase: Mafia 1
Impostor's names screen (IMP-003, seat order, no dragging) with: tonight's names filled in in their last order (IMP-004); a
counter small line "9 players" ("1 player" / "2 players"); "Next" disabled with fewer than 5 names, and "Mafia needs at least 5
players." shown below the list whenever that is true; a 17th name shows "Up to 16 players." and adds nothing. ✕ removes a name
with the toast "Kabir removed · Undo". Every Enter adds its name and keeps the field focused (as SWD-132). Names are 1–16
characters after trimming; the duplicate message as IMP-003. There is **no "First time" tick** (MF14). Small text link "How to
play" → MAF-006; quiet "← Back" → the picker; "Next" → Roles.

### MAF-003 Roles
Status: draft · Phase: Mafia 1
h1 "Roles for N players". Line "Mafia: M" between "−" (accessible name "Fewer Mafia") and "+" ("More Mafia"), each 48 × 48 px;
under it "We suggest S for N players." (S = suggested count). Lines "Doctor: 1", "Police: 1", "Villagers: V" (V = N − M − 2),
text only. With N = 5: no Doctor or Police lines; instead "With 5 players: 1 Mafia and 4 Villagers. Doctor and Police join at
6." and V = N − M.
**The Mafia count** starts at S every time this screen opens with a changed N, else at the value last set for this game night.
"−" is disabled when M = S − 1 or M = 1. "+" is disabled when M = S + 1, or when M + 1 ≥ (N − (M + 1)) − 1 (one more Mafia would
make them equal the rest after night 1); so at N = 5 "+" is always disabled. Worked values: N = 9, S = 2: M may be 1, 2 or 3;
N = 6, S = 1: M = 1 or 2 (2 Mafia face 3 after night 1 and 2 < 3, so the game goes on); N = 5, S = 1: M = 1 only (2 Mafia would
face 2 after night 1: 2 ≥ 2); N = 16, S = 4: M = 3, 4 or 5.
Rules box (body text, 1 px border, 12 px padding), one line each: "Night comes first." · "The Doctor can protect themselves once a
game, never the same person two nights running." · "The Police learns only Mafia or Not Mafia." · "A tie: point again once,
then nobody is out." · "A player who goes out shows their role."
Small text link "How to play" → MAF-006; quiet "← Back" → Who's playing? (names kept; M kept unless N changes); main "Give
everyone a role" → MAF-004.

### MAF-004 Starting a game
Status: draft · Phase: Mafia 1
"Give everyone a role" records `start { players, mafiaCount }` and deals (MAF-010). When this is the first Mafia game of tonight it
opens Read this aloud (MAF-005), otherwise the first deal pass screen (MAF-010).

### MAF-005 Read this aloud
Status: draft · Phase: Mafia 1
The card reads: "M of us are secretly the Mafia. Everyone else is the Village. At night we pass the phone round and everyone does
the same thing, so nobody can tell who is who. Each morning the phone tells us what happened, then we talk and vote someone out.
The Village wins by finding every Mafia. The Mafia win when they are as many as everyone else." ("1 of us is secretly the Mafia"
when M = 1; M as a digit.) Fits without scrolling at every size with Larger text off. Main "Pass the phone round" → the first
deal pass screen; quiet "← Back" → Roles with **the deal undone** (`start` removed; S1–S3 unchanged); small text link "How to
play" → MAF-006 → back here.

### MAF-006 How to play
Status: draft · Phase: Mafia 1
Opened from S1, S2, S3 and the menu. h1 "How to play"; the seven steps of `guide.md` "How to play", in short lines; the rules box
of MAF-003; and the line "Saw someone's screen? Keep it to yourself and carry on. Before the first night, Deal again instead."
(MF15). It never names a player or a role holder (as IMP-072). Main "Done" → the screen it was opened from, unchanged.

---

## 02 The deal → `specs/mafia/02-deal.md` (C3 rules; screens C2)

### MAF-010 Dealing roles
Status: draft · Phase: Mafia 1
At `start`: roles = M × `mafia`, then (N ≥ 6) `doctor` and `police`, then `villager` to N; shuffled with
`shuffle(roles, createRng(\`${seeds.roles}:${k}\`))` and given to players in seat order. **Streaks:** if the deal makes any player
`mafia` in a third game running tonight (they were `mafia` in games k − 1 and k − 2), the deal is redone with
`createRng(\`${seeds.roles}:${k}:r1\`)`, then `:r2`, … until no such player (as IMP-061). Property (MAF-P1): exactly M `mafia`, one
`doctor` and one `police` when N ≥ 6 (none when N = 5), the rest `villager`; nobody `mafia` three games running; the same seeds
give the same deal. A test may fix `seeds.roles` (MAF-H2) or give the deal directly (MAF-H3).
The deal passes the phone in **seat order from seat 0**. Each pass screen and role card is Impostor's deal (IMP-010, IMP-013,
IMP-014, IMP-018, IMP-019) with "word" read as "role": screen A "Player i of N", "Pass the phone to", NAME, "Everyone else, look
away!", main "I'm Riya"; screen B the pad "Hold here to see your role", quiet "Tap instead", "Not Riya? ← Back" until the first
hold, and after the first hold quiet "Someone saw my role" and main "Done, pass to Arjun" (last player "Done, everyone's seen",
which records the last `seen` and opens N0 for night 1).

### MAF-011 What each role card says
Status: draft · Phase: Mafia 1
While held (or tapped open), the private block shows, in IMP-011's layout (`private-word` = the role word in capitals, then lines):
- **Mafia**, M = 2: "MAFIA" · "You and Zoya are the Mafia." · "At night, you pick who goes out. By day, act like a Villager."
  M = 3: "You, Zoya and Dev are the Mafia."; M = 4: "You, Zoya, Dev and Om are the Mafia." (the others in seat order);
  M = 1: "You are the only Mafia."
- **Doctor**: "DOCTOR" · "At night, pick someone to protect from the Mafia." · "Yourself once a game. Never the same person two
  nights running."
- **Police**: "POLICE" · "At night, check one person." · "The phone tells only you: Mafia or Not Mafia."
- **Villager**: "VILLAGER" · "You have no night power." · "By day, talk, watch and find the Mafia."
Every card has the same number of lines (3 under the role word; a short line is padded with an empty line) so the card's
height never tells a watcher the role (as IMP-012). The role text is in the page only while shown (IMP-013).

### MAF-012 First time? What this role means
Status: draft · Phase: Mafia 1
On **every** role card while shown, a quiet button "First time? What this role means" under the block (MF14). Tapping it shows,
under the role lines and in the same private block, three lines for that role; tapping again ("Hide this") hides them; they
also hide with the role. Mafia: "Your side wins when the Mafia are as many as everyone else." · "At night, pick who goes out." ·
"By day, join in and point at others. Stay calm!" Doctor: "Your side wins when every Mafia is out." · "At night, protect one
person." · "If you protect the Mafia's pick, nobody goes out." Police: "Your side wins when every Mafia is out." · "At night,
check one person." · "You choose whether to tell the room what you found." Villager: "Your side wins when every Mafia is out." ·
"At night, pick who you think is Mafia. Only you see it." · "By day, listen, ask questions and vote." Records nothing.

### MAF-013 Wrong person, double taps, interruptions during the deal
Status: draft · Phase: Mafia 1
As IMP-010, IMP-018 and IMP-090: "Not Riya? ← Back" (before the first hold) returns to Riya's pass screen; a tap within the guard
does nothing; hiding the app or a reload during a shown role empties the block at once and returns to that player's pass screen
with "Welcome back." above the where-line; nothing is recorded until "Done, pass to …".

### MAF-014 Deal again (before night 1 only)
Status: draft · Phase: Mafia 1
"Someone saw my role" (B2) and the menu item "Deal again" (deal pass screens and N0 of night 1 until "Start the night") open the
dialog "Deal again?" · "Everyone gets a new role." "Deal again" records `redeal` (new deal with `createRng(\`${seeds.roles}:${k}:d1\`)`,
then `:d2`, …; streak rule as MAF-010) and opens "Player 1 of N" for seat 0. "Keep these roles" (main) returns to where it was
opened, nothing recorded. From "Start the night" on, "Deal again" is not in the menu and "Someone saw my role" is not shown (MF15).

### MAF-015 See my role again
Status: draft · Phase: Mafia 1
Quiet "See my role again" on Morning (MAF-030) and Day (MAF-031), and the menu item on those two screens only. It opens the dialog
"Whose role?" with one button per player who is **in**, and "Cancel". A name opens that player's deal pass screen without
`deal-progress`, then their role card (MAF-011, MAF-012) with main "Done, back to the day" → the screen it came from. A Mafia
whose partners are out reads "Zoya is out. You're the only Mafia left." (two or more out: "Zoya and Dev are out. You're the only
Mafia left."; one of three out: "You and Dev are the Mafia. Zoya is out."). Records nothing. Players who are out are not
offered (their role is already shown).

### MAF-016 The host sees nothing secret
Status: draft · Phase: Mafia 1
Property (MAF-P2, as IMP-062): no room screen, toast, dialog, accessible name, page title or `aria-live` region ever holds a role
of a player who is in or has left, a night pick, a Police result, whose turn in the night pass is Mafia, or how many players
are still to pick tonight. Exceptions only: roles shown by MAF-030 and MAF-036, and everything on G1 after game over.

---

## 03 Night → `specs/mafia/03-night.md` (C3 rules; screens C2)

### MAF-020 Night begins
Status: draft · Phase: Mafia 1
N0 shows h1 "Night r", the two lines of the Canonical strings, and main "Start the night" → the night pass screen of the first
player in the night order (Terms). Night 1 follows the last `seen`; night r > 1 follows Day r − 1 (MAF-034, 035, 036). Menu:
How to play · Players · Deal again (night 1 only) · Pause · Home (game is saved) · End the game · End for tonight.

### MAF-021 The night pass
Status: draft · Phase: Mafia 1
Every player in the night order gets one turn, in that order: pass screen (`night-progress` "Night r · i of T", T = players in
the night order; "Pass the phone to"; NAME; "Everyone else, look away!"; for a player who is out also "You're out: pick who you
think is Mafia."; main "I'm Meena", 1000 ms guard) → night job (MAF-022). Worked order, game 1, 9 players: night 1 starts at seat
0 (Riya, Arjun, … Neha); night 2 at seat 1 (Arjun … Neha, Riya); game 2 night 1 at seat 1. A player who leaves (MAF-052) before
their turn is skipped and T drops by one from the next pass screen.

### MAF-022 The night job: one layout for every role
Status: draft · Phase: Mafia 1
N2 shows "Night r", NAME and the pad "Tap to see your night job" (a button, full width minus 32 px, at least 120 px tall); "Not
Meena? ← Back" under it until the first tap. Tap → shown: `job-line` (the role word in capitals, " · ", the job); `night-names`,
one button per allowed name (MAF-023–026) in seat order, two columns, each 56 px tall, 8 px apart, scrolling inside its own box
when they don't fit (the job line, result line and main button never scroll away; at 320 × 568 at least 8 names show without
scrolling); `result-line` after a pick; the pad now reads "Tap to hide". Tap a name → selected (`aria-pressed="true"`), result
line shown; another name → the pick moves (except the Police, MAF-025). Main "Done, pass to Kabir" (next in the night order) /
last player "Done, night over": hidden until the night job guard (Terms) is met and while the job is hidden; it records
`nightPick { player, target }` and opens the next pass screen or N3.
**Same for everyone** (MF1): every role has exactly one job line, one names box, one result line and one main button; every
role picks exactly one name; no role has an extra screen, tap or sound; the guard is the same 4000 ms. Hidden by "Tap to hide",
60 s with no touch, or IMP-018's triggers: the job, names and result empty at once (pick kept); app hidden or reload → that
player's pass screen with "Welcome back." and nothing recorded for them.

### MAF-023 Mafia at night
Status: draft · Phase: Mafia 1
Allowed names: players who are in and are not `mafia`. **The first Mafia in tonight's night order** reads "MAFIA · Pick who goes
out tonight. Zoya will see your pick." (more partners in: "Zoya and Dev will see your pick."; alone: "MAFIA · Pick who goes out
tonight."); result line "Kabir. Zoya can agree or change it." (alone "Kabir."). **Each later Mafia** reads "MAFIA · Arjun's pick:
KABIR. Tap Kabir to agree, or pick someone else." where Arjun is the Mafia just before them in the night order and KABIR their
pick; Kabir's button carries the small tag "Arjun's pick"; **nothing is pre-selected**. Result line: same name "Kabir. You agree."
/ another "Om. If the Mafia's picks differ, the phone picks one of them at random."
**Target** (MAF-027): if every Mafia pick tonight names the same player, that player; else
`picks[floor(rng() × picks.length)]` with `rng = createRng(\`${seeds.roles}:${k}:night${r}\`)` and `picks` the Mafia picks in night
order (repeats kept, so a name picked twice is twice as likely). Worked example: Arjun picks Kabir, Zoya picks Om → picks [Kabir,
Om] → rng's first value 0.62 → index 1 → Om.

### MAF-024 Doctor at night
Status: draft · Phase: Mafia 1
"DOCTOR · Pick someone to protect tonight." Allowed: every player who is in, including the Doctor ("Meena (you) · once a game"),
**except** the player the Doctor protected on the previous night (greyed, small tag "protected last night") and, once the Doctor
has protected themselves this game, the Doctor (greyed, "used"). The previous night means night r − 1 only: a player protected on
night 1 may be protected on night 3. Result line "Om is protected tonight." / self "You are protected tonight."

### MAF-025 Police at night
Status: draft · Phase: Mafia 1
"POLICE · Pick someone to check." Allowed: every player who is in except the Police and except players this Police has already
checked (shown greyed with their answer as a small tag "Mafia" / "Not Mafia"). **The first name tapped is the check**: its
answer shows at once in the result line, "Zoya: MAFIA." or "Zoya: Not Mafia.", and every other name greys out; there is one tap,
as for every role. When no name is allowed (everyone in has been checked): job line "POLICE · Nobody left to check.", names box
lists the checked players greyed with their answers, and the main button needs only the 4000 ms (no pick); records `nightPick
{ player, target: null }`.

### MAF-026 Villagers and players who are out
Status: draft · Phase: Mafia 1
Villager: "VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this."; allowed: everyone in except themselves;
result line "You think it's Zoya. At the end we'll see if you were right." Player who is out: "YOU'RE OUT · Ghost guess: who's
Mafia? Pick one."; allowed: everyone in; result line "Your guess: Zoya." These picks change nothing in the game; they feed the
fun lines (MAF-062).

### MAF-027 The night resolves
Status: draft · Phase: Mafia 1
After the last `nightPick` of night r, in this order (MF1b, guide): (1) the Mafia's target (MAF-023); (2) if the Doctor's pick
tonight is the target, **nobody is out**; (3) otherwise the target is out, `out night r`, role shown. Then (4) any night leave
(MAF-052) applies; then (5) the winner check (MAF-040). If no Mafia made a pick (every Mafia in left before their turn), nobody
is out. Property (MAF-P3): at most one player goes out at night (plus leavers); a protected target never goes out; the Mafia
never target a `mafia`; the Doctor never protects the same player two nights running nor themselves twice in a game.

### MAF-028 Night over
Status: draft · Phase: Mafia 1
N3: h1 "Night over."; "Host, take the phone and read the morning aloud."; main "Read the morning" → MAF-030. Menu: How to play ·
Players · Pause · Home (game is saved) · End the game · End for tonight.

---

## 04 Morning and day → `specs/mafia/04-day.md` (C2; votes C3)

### MAF-030 Morning
Status: draft · Phase: Mafia 1
h1 "Morning, day r"; `story` (MAF-037); for a night out, `role-line` "Kabir was a Villager." / "Kabir was the Doctor." / "Kabir
was the Police." (a Mafia is never out at night); `count-line` "8 players left · Mafia caught: 0 of 2", where the first number
counts players who are in, and **Mafia caught** counts Mafia whose role has been shown (MAF-P4: a leaver never changes this line
before game over). Quiet "See my role again" (MAF-015), quiet "End the game" (MAF-054), quiet "← Home" (MAF-091); main "Start
talking" → MAF-031, or, when the night ended the game, main "See who won" → G1 and only "← Home" stays among the quiet buttons.
Pause icon. Menu: How to play · Players · See my role again · Pause · Home (game is saved) · End the game · End for tonight.

### MAF-031 Day: talk it over
Status: draft · Phase: Mafia 1
h1 "Day r · Talk it over"; h2 "Who's still in" with players who are in (seat order); then out players greyed, "Kabir · Villager ·
out night 1" / "Om · Villager · voted out day 1", and leavers "Neha · left" (no role); small line "Out players: watch quietly, no
hints!"; quiet "See my role again"; small text link "Start a 2-minute timer"; quiet "← Home"; main "Time to vote" → MAF-032.
The timer: tapping the link starts `day-timer` at "2:00", counting down each second (t = 0 at the tap; paused while the Paused
cover is open); the link reads "Stop timer" (removes the timer). At 0: sound `ding` (if sound on), "Time's up!" replaces the
timer, nothing else happens. Pause icon. Menu as MAF-030.

### MAF-032 The countdown
Status: draft · Phase: Mafia 1
As IMP-030 with heading "Everyone in, point at who you think is Mafia." and, for a re-vote, "Point only at Kabir or Om" (names in
seat order, ", " and " or " before the last). Started by "Time to vote", "Count again" or "Point again: …". Quiet "Not yet"
during the countdown → Day (timer state kept). Then the picker opens by itself.

### MAF-033 Who got the most fingers?
Status: draft · Phase: Mafia 1
As IMP-031 with: name buttons for players who are in; the text buttons "It's a tie", "Count again" and **"Nobody today"** (three
side by side of equal width; at 320 px wide two on the first row and "Nobody today" centred under them); quiet "← Back to talking"
→ Day (the timer reset to none); main "Vote out" disabled → after a pick "Vote Kabir out" → records `voteOut { player }` → MAF-036.

### MAF-034 A tie
Status: draft · Phase: Mafia 1
As IMP-032 with "Reveal" read as "Vote … out": "It's a tie" → h1 "Tap everyone who is tied", "Not a tie", main "Point again: Kabir
or Om" → records `tie { players }` → the countdown → a re-vote picker with only the tied players, "Still a tie" and "Count again";
"Vote Kabir out" → `voteOut` → MAF-036. **"Still a tie"** records `voteNobody { reason: 'secondTie' }` and shows h1 "Still a tie.
Nobody is out today.", quiet "← Home", main "Start night r + 1" → N0. There is never a second re-vote (MF6).

### MAF-035 Nobody today
Status: draft · Phase: Mafia 1
"Nobody today" opens the dialog of the Canonical strings; "Nobody today" records `voteNobody { reason: 'chosen' }` → N0 for night
r + 1; "Back to the vote" (main) → the picker, nothing recorded (MF12).

### MAF-036 Vote result
Status: draft · Phase: Mafia 1
h1 "KABIR is out." (name in capitals); at t = 1500 ms the `role-line` "Kabir was MAFIA!" / "Kabir was a Villager." / "Kabir was
the Doctor." / "Kabir was the Police." and the count line (MAF-030 rule); the main button appears at t = 1500 ms with its guard
from then. Main "Start night r + 1" → N0, or "See who won" → G1 when the vote ended the game. Quiet "End the game", "← Home".
A vote is final once "Vote Kabir out" is tapped: there is no undo (as IMP-031; the pick-then-confirm is the safety).

### MAF-037 The morning story
Status: draft · Phase: Mafia 1
Stories come from `content/mafia/stories.json`, built from `docs/games/mafia/stories.csv` (edition 1.2: 12 `out`, 10 `saved`,
ids kept). Each morning: out → an `out` story with `{NAME}` replaced by the player's name; nobody out → a `saved` story; nobody
out because no Mafia picked (MAF-027) → the fixed line "A quiet night. Nobody is out!". The story is
`pick(unused, createRng(\`${seeds.roles}:${k}:story${r}\`))` where `unused` are that kind's stories not used in this game, in id
order; when every story of a kind is used, all of that kind are unused again. Property (MAF-P5): no story repeats in a game while
an unused one of its kind remains; a saved story never contains a player's name.

---

## 05 Winning → `specs/mafia/05-winning.md` (C3)

### MAF-040 The winner check
Status: draft · Phase: Mafia 1
Checked after each night resolves (MAF-027 step 5), after each `voteOut`, and after each day `leave`. With m = Mafia who are in
and v = other players who are in: **m = 0 → the Village wins**; else **m ≥ v → the Mafia win**; else the game goes on. Worked
examples: 9 players, 2 Mafia; night 1 Kabir out (m 2, v 6); day 1 Om out (2, 5); night 2 saved; day 2 Zoya out (1, 5); night 3
Meena out (1, 4); day 3 Arjun out (0, 4) → the Village wins. 6 players, 1 Mafia: night 1 out (1, 4), day 1 a Villager out (1, 3),
night 2 out (1, 2), day 2 a Villager out (1, 1) → the Mafia win.

### MAF-041 Leavers and the winner
Status: draft · Phase: Mafia 1
A leaver counts as out for MAF-040 from the moment the leave applies (day: at once; night: MAF-027 step 4). If the leave decides
the game, G1 shows the winner's h1 and the line "Kabir had to leave." under it. A leaver's role is shown only on G1 (MF10).

### MAF-042 Ending with no winner
Status: draft · Phase: Mafia 1
`endGame` (MAF-054) ends the game with no winner: G1 h1 "Game ended. No winner.", every role shown; the game is not in tonight's
Village–Mafia tally (MAF-062) but counts in "games" (MAF-064).

### MAF-043 Properties of a whole game
Status: draft · Phase: Mafia 1
For thousands of random games (seeded deals, random legal moves from the Rule API, random leaves; MAF-P6): every game ends; exactly
one of Village win, Mafia win or no winner; the tally adds up (Village + Mafia = games with a winner); no move is accepted that
the rules forbid (a pick of a disallowed name, a vote for a player who is out, a `nightPick` out of order, "Deal again" after
"Start the night"); `replay` of the saved moves gives the same state.

---

## 06 The room and the host → `specs/mafia/06-room.md` (C2)

### MAF-050 Pause
Status: draft · Phase: Mafia 1
A Pause icon button (accessible name "Pause") beside "··· Menu" on every room screen of a game (B1, N0, N1, N3, M1, Y1, V2–V4)
opens the Paused cover: "Paused", the where-line, "Tap Carry on when everyone's back.", main "Carry on" → the same screen (the day
timer paused and resumed; guards not restarted). Not on private screens or the countdown.

### MAF-051 Someone arrives
Status: draft · Phase: Mafia 1
Menu "Players" (dialog, as IMP-079) adds a name mid-game: it joins **the next game** (roles are dealt), shown in the dialog as
"Imran · joins next game"; records `addNext { name }`. Between games (G1) "Change players or roles" adds them at once (MAF-061).

### MAF-052 Someone has to leave
Status: draft · Phase: Mafia 1
In the Players dialog, ✕ beside a player who is in opens "Kabir has to leave?" with the day or night body (Canonical strings).
"Kabir leaves" records `leave { player }` and shows the toast "Kabir left · Undo" (10 s; Undo removes the `leave`, nothing else
changed). **By day** (M1, Y1, V1–V4) the leave applies at once: Kabir is greyed in the Day list as "Kabir · left", is not
offered in the picker, and MAF-040 runs. **At night** (N0–N3) it applies after the night resolves (MAF-027 step 4); Kabir's
night turn, if not yet taken, is skipped; a pick already made counts. Players who are out can't leave the game (✕ hidden; they
just stop playing). "Don't remove Kabir" (main) → the dialog. Property: a leave never shows the leaver's role before game over.

### MAF-053 The menu at each moment
Status: draft · Phase: Mafia 1
"··· Menu" (accessible name "Menu") on room screens only. Items in the Canonical strings' order, only those that apply: How to play
(all) · Players (all) · See my role again (M1, Y1) · Deal again (B1, N0 of night 1) · Pause (all) · Home (game is saved) (all) ·
End the game (all) · End for tonight (all) · Settings (G1) · History (G1). No menu on B2, N2 or the countdown.

### MAF-054 End the game
Status: draft · Phase: Mafia 1
"End the game" (menu, M1, V4) → dialog (Canonical strings) → "End the game" records `endGame` → G1 "Game ended. No winner." with
the toast "Game ended · Undo" (10 s; Undo removes `endGame` and returns to the screen it came from). "Keep playing" (main) →
back.

### MAF-055 Home and the phone resting
Status: draft · Phase: Mafia 1
"← Home" and "Home (game is saved)" open Home with the game night unfinished (MAF-091). From a night screen they are in the menu
only (N0, N1, N3); from a private screen there is no way to Home except hiding the app.

---

## 07 Game over and tonight → `specs/mafia/07-results.md` (saved data C3)

### MAF-060 Game over
Status: draft · Phase: Mafia 1
G1: the winner's h1 and line ("The Village wins!" + "Every Mafia is out." / "The Mafia win!" + "They're as many as everyone
else." / "Game ended. No winner."); leaver line when MAF-041 applies; h2 "Who was who": one row per player dealt, in seat order,
"Arjun · Mafia · voted out day 2" / "Kabir · Villager · out night 1" / "Riya · Villager · in to the end" / "Neha · Police · left";
quiet "What happened each night" opens a list, one line a night: "Night 1: the Mafia picked Kabir · the Doctor protected Kabir ·
the Police checked Zoya (Mafia) · nobody was out" (when the Mafia differed: "the Mafia picked Kabir and Om; the phone chose Om");
the fun lines (MAF-062); the tally line "Tonight: Village 2 · Mafia 1" (left out until a game tonight has a winner); quiet "Change
players or roles", "End for tonight", "← Home"; main "Play again". The page may scroll; the main button stays fixed.

### MAF-061 Play again and changes
Status: draft · Phase: Mafia 1
"Play again" records `start` for game k + 1 with the same players (players added by `addNext` at the end of the seat order,
leavers removed) and the same Mafia count, unless MAF-003's limits no longer allow it, then the suggestion S; fewer than 5
players → Who's playing? with "Mafia needs at least 5 players." No read-aloud. "Change players or roles" → Who's playing? (with
"← Back to the game" returning to G1, nothing recorded) → Roles → "Give everyone a role" → the deal.

### MAF-062 Fun lines and the tally
Status: draft · Phase: Mafia 1
On G1, each only when it applies: **"Best Mafia spotter: Om picked a Mafia 3 nights out of 3"**: the Villager whose night picks
named a `mafia` on the most nights, at least 2 (ties: earliest in seat order); **"Best ghost guess: Riya"**: the out player whose
ghost guesses named a `mafia` most often, at least 1 (ties: seat order). The tally counts games with a winner tonight: "Tonight:
Village 2 · Mafia 1" (both numbers always shown once a game has a winner, "Village 1 · Mafia 0").

### MAF-063 End for tonight
Status: draft · Phase: Mafia 1
Menu or G1 "End for tonight" → dialog (Canonical strings) → "End for tonight" → G2 (MAF-064); `endGame` (mid-game) and
`endEvening` are recorded when G2 is left or after the rules of SWD-060 ("Oops, keep playing" returns unchanged).

### MAF-064 Tonight's summary
Status: draft · Phase: Mafia 1
G2: h1 "Tonight's Mafia"; "9 players · 3 games" (players dealt in any game tonight; games = games started, ended or won);
"Village 2 · Mafia 1"; "Arjun was Mafia in 2 games" (the player Mafia in the most games, at least 2; ties: seat order; else left
out); "Best Mafia spotter tonight: Om" (most spotter nights over all games, at least 2; else left out); quiet "Oops, keep
playing", "← Home"; main "Play something else" → the picker with tonight's names. Menu: only "Delete tonight's games" (as SWD-060
and D9).

---

## 09 Usability → `specs/mafia/09-usability.md` (C1/C2)

### MAF-080 One main button, guards, sizes
Status: draft · Phase: Mafia 1
At most one main button per screen, and it is the next step (as IMP-080); every main button has the guard (Terms); every screen
works at every size (IMP-073, IMP-088 rules); no page scrolling on B1, B2, N0–N3, M1, the countdown and V2–V4 at every size with
Larger text off (G1, G2, S1–S3 and Day may scroll, main fixed); at 812 × 375 and 568 × 320 the main button sits bottom right as
Impostor's landscape rule.

### MAF-081 Night screens can't be read from across the table
Status: draft · Phase: Mafia 1
On N2 the job line and names are body text (17 px; 21 px with Larger text); nothing on N2 uses colour alone to show a role; the
role word in the job line is the same weight and colour for every role. B2 follows IMP-011's sizes.

### MAF-082 Screen readers, no flashing, kind words, sounds
Status: draft · Phase: Mafia 1
As IMP-083 (private text in a polite `private-live` region only while shown), IMP-084, IMP-085 (no screen says "killed", "dead",
"die" or "murder"; MF2), IMP-087 (screen stays awake during a game) and IMP-089 (sounds: `tick`/`ding` in the countdown and the day
timer only; **no sound or vibration on N2 or B2**, so a role never makes a noise).

### MAF-083 Words
Status: draft · Phase: Mafia 1
Every on-screen string is in the Canonical strings or a scenario; none other. Banned on every Mafia screen: "killed", "dead",
"die", "murder", "lynch", "eliminate", "werewolf", "moderator", "session", "evening".

---

## 10 Lifecycle → `specs/mafia/10-lifecycle.md` (saved data C3)

### MAF-090 Where-line
Status: draft · Phase: Mafia 1
The where-line (Canonical strings) shows under "Welcome back." after a reload or a return from hidden, on the Paused cover, and on
Home's unfinished row (line 1 there: "Mafia · Night 2 · Meena's turn with the phone" / "Mafia · Day 2 · talking" / "Mafia · Game
over, game 2").

### MAF-091 Resume, never on a private screen
Status: draft · Phase: Mafia 1
Every move is saved as it happens. Reopening the app or tapping Home's row returns to the room screen of the current step: during
the deal or a night, the pass screen of the player whose turn it is (never B2 or N2); otherwise the screen itself (N0, N3, M1, Y1,
V2, V4, G1; the countdown and the tie screens resume at V2 with nothing selected; an open dialog at the screen under it), with
"Welcome back." and the where-line. A game night left unfinished ends by itself 12 hours after its last move, as IMP-104.

### MAF-092 Coming back the next day
Status: draft · Phase: Mafia 1
When Home's row is tapped more than 6 hours after the last move and the game is past the deal, the resumed screen first shows the
line "Back after a break? Everyone can see their role again." with the quiet button "See my role again" (MAF-015) above the main
button. *(Product owner's call, lifecycle.md; low.)*

### MAF-093 History and saved data
Status: draft · Phase: Mafia 1
History lists "Mafia · 9:10 pm · 9 players · The Village won · 3 nights" per game (no winner: "Game ended"), and "Play again"
there opens Who's playing? with its players. A finished game keeps players in seat order, every role, every night's picks
(including Villagers' and ghost guesses), the Mafia's random choice, each vote, leavers, the story ids used and the role seed, so
`replay` rebuilds it exactly. Saved data carries a format version (IMP-096); a game night with no game past the deal is not kept
(IMP-097).

---

## Properties (the tester's fast-check suites)
- **MAF-P1** Deal (MAF-010). **MAF-P2** Nothing secret on room screens (MAF-016). **MAF-P3** Night rules (MAF-027).
- **MAF-P4** "Mafia caught" never moves on a leave. **MAF-P5** Stories (MAF-037). **MAF-P6** Whole games (MAF-043).
- **MAF-P7** Same for everyone at night: for every role, N2 has the same elements in the same order with the same sizes (±1 px)
  at every size, and the same guard; the night pass's T and order never depend on roles.

## Test hooks the build provides
- **MAF-H1** Rule API in `src/games/mafia/index.ts` (pure), fitting the engine (`startMatch`, `play`, `replay`, `viewFor`,
  `SavedGame`, `createRng`, `shuffle`). Moves: `start`, `seen`, `redeal`, `startNight`, `nightPick`, `voteOut`, `tie`,
  `voteNobody`, `leave`, `unleave`, `addNext`, `endGame`, `unEndGame`, `endEvening`. `viewFor(state, player)` returns only what
  that player may see; `viewFor(state, 'room')` what room screens may show.
- **MAF-H2** Seeds: `{ roles: string }` (deal, Mafia random choice, stories), fixable in development and preview builds only
  (IMP-064).
- **MAF-H3** Deal override: give the roles directly (e.g. the example deal) in development and preview builds only.
- **MAF-H4** Fake clock (guards, the 4000 ms night job guard, the 60 s hide, the 1500 ms vote result, the day timer, toasts, 6 h
  and 12 h).
- **MAF-H5** Story list override: a short test list (e.g. 2 `out`, 1 `saved`) to exercise reuse.
