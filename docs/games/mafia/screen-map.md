# Mafia: screen map (draft 3, product owner, 23 October 2026)

**Status: draft 3** (critic pass of draft 1 applied, section J; owner's answers J-Q1 and J-Q2, 23 October). Stage 1 of `docs/proposals/design-before-code.md` (step 1b of `docs/new-game-process.md`). Drawn from
`guide.md`, `fit-and-stories.md` and decisions MF1–MF13 (`docs/decisions.md`, 22 October). No scenarios exist yet, so
the IDs column says which future scenario file a row belongs to (`MAF-01 setup` … `MAF-10 lifecycle`). Where a later
`scenarios.md` differs from this map, the scenarios win.

Built in from the Secret Words walks (`../secret-words/map-walk-2026-10-11.md`) so we don't find them again: visible tap
guards, "How to play" on every setup screen, the where-line after a break, a Pause icon, "← Home" and "End" visible after
a game, one main button per screen, nothing secret on any screen the room can see.

**How to read it.** One table per screen: what is on it (*Words*), then one row per button or gesture: where it leads and
what it records. *Intentions* says which of the common next wishes are visible without opening a menu (**stop** ·
**home** · **back** · **help** · **undo** · **pause**); "(menu)" means only through "··· Menu". Sizes: every screen works at
320 × 568, 360 × 640, 390 × 844, 812 × 375 and 568 × 320 unless its *Sizes* line says otherwise. Example names are in K1.

**Rules that apply to every screen:**
- *Visible tap guards:* every main button appears greyed for 800 ms after its screen appears (1 s on "I'm Riya") and then
  comes alive; quiet buttons are not guarded (same rule as Secret Words).
- *Room screens and private screens.* **Private** screens (the role card and the night job, B2 and N2) show one player's
  secret and are reached only through a pass screen and a hold or tap; they have no menu and no Pause. Every other screen
  is a **room** screen: it never shows a living player's role, a night pick, or how many players are still to pick.
- *Same for everyone at night (MF1).* Every private night screen has the same layout, the same number of taps (pick one
  name, then Done), and its "Done" comes alive 4 s after the job is shown, whatever the role, so nobody can be read from
  how long they hold the phone.
- *Pause* icon (name "Pause") beside "··· Menu" on every room screen during a game opens D1.
- *Where-line:* "Night 2 · Meena's turn with the phone" / "Day 2 · talking" / "Day 2 · vote" / "Game over, game 2", shown
  under "Welcome back." after a hide or reload, on the Pause cover and on Home's resume row.
- *Words:* "out", never "killed" or "dead" (MF2). The roles are **Mafia**, **Doctor**, **Police** and **Villager** (MF4).
  The two sides are **the Mafia** and **the Village**.
- *Menu*, in this order where an item applies: How to play · Players · See my role again (day only) · Deal again (before
  night 1 only) · Pause · Home (keep this game) · End the game · End for tonight · Settings · History.

## A. Home and the picker (shared with other games)

### A1. Home (changes for Mafia only)
*Words:* "Host a game" with "Tambola, Impostor, Secret Words, What Am I? or Mafia on this phone"; unfinished row "Mafia, 9:10 pm ·
Riya, Arjun +6 · Night 2" + where-line + "Tap to resume".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Unfinished Mafia row | the game's last room screen with "Welcome back." (never a private screen: a night in progress resumes at the pass screen of the player whose turn it is) | — | MAF-10 |

### A2. What shall we play? (new card)
*Words:* card "Mafia", always after the What Am I? card (owner, 23 October) · "Find the Mafia before they find you · 5–16 players · 15–30 min a game".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Mafia card, nothing unfinished | S1 Who's playing? | — | MAF-01 |
| Mafia card, a game night unfinished | A3 Start new dialog (shared) | — | MAF-10 |

## B. Setup (host phone)

### S1. Who's playing?
*Words:* heading "Who's playing?"; tonight's names already in the list (from another game tonight); input "Player name" +
"Add"; per name "✕"; counter "8 players"; under 5: "Mafia needs at least 5 players."
(main disabled); over 16: "Up to 16 players." (Add disabled); quiet "How to play"; quiet "← Back"; main "Next".
*Intentions:* back, help.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Add / Enter | name added, input cleared (every Enter adds, however fast, M3); same name: "Riya is already playing. Add an initial, like Riya S." | — | MAF-01 |
| ✕ | name removed, toast "Kabir removed · Undo" | — | MAF-01 |
| How to play | S4 How to play → Done → back here | — | MAF-09 |
| ← Back | A2 picker | — | MAF-01 |
| Next | S2 Roles | — | MAF-01 |

### S2. Roles
*Words:* heading "Roles for 8 players"; line "Mafia: 2" with "−" and "+" and "We suggest 2 for 8 players."; lines "Doctor:
1", "Police: 1", "Villagers: 4" (counts only, no buttons); with 5 players: "With 5 players: 1 Mafia and 4 Villagers. Doctor and
Police join at 6." ; rules box "Night comes first · Doctor can protect themselves once a game, never the same person two
nights running · Police learns Mafia or Not Mafia · A tie: point again once, then nobody is out"; quiet "How to play";
quiet "← Back"; main "Deal the roles". *Intentions:* back, help.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| − / + | Mafia count changes by one from the suggestion, never more (MF5): "−" disabled at suggestion − 1 or 1; "+" disabled at suggestion + 1, and whenever one more Mafia would make the Mafia equal the rest after night 1 (so never at 5 players); Villagers line follows | setup | MAF-01 |
| How to play | S4 → Done → back | — | MAF-09 |
| ← Back | S1 (names kept) | — | MAF-01 |
| Deal the roles | S3 Read this aloud (first Mafia game tonight) or B1 first pass screen | `deal` (roles from the role seed) | MAF-01, 05 |

### S3. Read this aloud (first Mafia game of the night)
*Words:* "Read this aloud:"; card "2 of us are secretly the Mafia. Everyone else is the Village. At night we pass the phone
round and everyone does the same thing, so nobody can tell who is who. Each morning the phone tells us what happened, then
we talk and vote someone out. The Village wins by finding every Mafia. The Mafia win when they are as many as everyone
else."; quiet "← Back"; quiet "How to play"; main "Pass the phone round".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Pass the phone round | B1 for the first player | — | MAF-01 |
| ← Back | S2 (deal not yet made: the deal is made on "Pass the phone round") | — | MAF-01 |
| How to play | S4 → back | — | MAF-09 |

### S4. How to play (setup screens, menu)
*Words:* the guide's "How to play" steps 1–7 and the rules box of S2, in short lines; the peek line of MF15; "Done".
| Tap | Leads to | IDs |
|---|---|---|
| Done | the screen it was opened from | MAF-09 |

## C. The deal (pass the phone, once per game)

### B1. Pass screen (deal)
*Words:* "Player 2 of 8"; "Pass the phone to"; RIYA (large); "Everyone else, look away!"; main "I'm Riya" (1 s guard).
*Intentions:* pause (icon), menu: How to play · Players · Deal again · Pause · Home · End the game.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| I'm Riya | B2 Role card | — | MAF-05 |
| Pause icon | D1 | — | MAF-06 |

### B2. Role card (private)
*Words:* "Player 2 of 8"; RIYA; quiet "Tap instead" under the name; pad "Hold here to see your role"; while held one of:
- **MAFIA** · "You and Zoya are the Mafia." (three or four: "You, Zoya and Dev are the Mafia."; one: "You are the only Mafia."; in "See my role again" after a partner is out: "Zoya is out. You're the only Mafia left.") · "At night, you pick who goes out. By day, act like a Villager."
- **DOCTOR** · "At night, pick someone to protect from the Mafia. Yourself once a game. Never the same person two nights running."
- **POLICE** · "At night, check one person. The phone tells only you: Mafia or Not Mafia."
- **VILLAGER** · "You have no night power. By day, talk, watch and find the Mafia."
While the role shows, a quiet "New to Mafia? What this means" (on **every** role card, so opening it tells nobody anything;
MF14) opens, on the same private screen, three short lines for that role, e.g. Mafia: "Your side wins when the Mafia are as
many as everyone else." · "At night, pick who goes out." · "By day, join in and point at others. Stay calm!"; Villager: "Your
side wins when every Mafia is out." · "At night, pick who you think is Mafia. Only you see it." · "By day, listen, ask
questions and vote." It closes with the role. Also in "See my role again" (D5).
"Not Riya? ← Back" under the pad until the first hold; after the first hold: quiet "Someone saw my role", main "Done, pass to
Arjun" (last player: "Done, everyone's seen"). No menu.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Hold / let go (or Tap instead → "Tap to see" / "Tap to hide") | role shown / hidden | — | MAF-05 |
| Not Riya? ← Back | B1 for Riya | — | MAF-05 |
| New to Mafia? What this means / hide | the three lines for this role shown / hidden; hidden with the role | — | MAF-04 |
| Someone saw my role | D4 Deal again | — | MAF-05 |
| Done, pass to Arjun | B1 for Arjun | `seen` | MAF-05 |
| Done, everyone's seen | N0 Night begins | `seen` | MAF-02 |
| App hidden or reload while shown | role hidden; B1 for Riya with "Welcome back." | — | MAF-10 |

## D. Night (pass the phone again, every night, MF1)

### N0. Night begins (room)
*Words:* "Night 1"; "Pass the phone round once more. Everyone does the same: tap to see your night job, pick one name, tap
Done, pass it on." (Night uses tap to see, not hold: names must be tapped while the job shows.); "Keep your face still!"; main "Start the night". *Intentions:* pause, help (menu), stop (menu).
> Nothing here explains how the Mafia agree: only the Mafia need it, and they see it on their own screen. The night order
> is seat order starting one seat later each night, so the Mafia are not always first.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Start the night | N1 for the first player in the night order | — | MAF-02 |

### N1. Pass screen (night)
*Words:* "Night 1 · 3 of 8"; "Pass the phone to"; MEENA; "Everyone else, look away!"; main "I'm Meena" (1 s guard). Players who
are out are in the order too, with "Out players: your ghost guess." under the name (MF11). *Intentions:* pause, menu as B1
without "Deal again".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| I'm Meena | N2 Night job | — | MAF-02 |
| Pause icon | D1 | — | MAF-06 |

### N2. Night job (private, same layout for every role)
*Words:* "Night 1"; MEENA; pad "Tap to see your night job" (hidden again by "Tap to hide", app hidden, or 60 s); while shown:
role word and job line, then one button per name (2 columns), then one result line after a pick, then main "Done, pass to
Kabir" (alive 4 s after the job is first shown, and only after a pick). "Not Meena? ← Back" until the first tap on the pad.
No menu.
| Role | Job line | Names shown | After a pick (one line) |
|---|---|---|---|
| Mafia, first to hold the phone tonight | "MAFIA · Pick who goes out tonight. Zoya will see your pick." (only Mafia left: "MAFIA · Pick who goes out tonight.") | everyone in, except the Mafia | "Kabir. Zoya can agree or change it." (alone: "Kabir.") |
| Mafia, later ones (two to four Mafia) | "MAFIA · Arjun's pick: KABIR. Tap Kabir to agree, or pick someone else." The latest Mafia pick so far carries the tag "Arjun's pick"; **nothing is pre-selected**, so it takes one tap like everyone else | the same | "Kabir. You agree." / "Om. If the Mafia's picks differ, the phone picks one of them at random." |
| Doctor | "DOCTOR · Pick someone to protect tonight." | everyone in, including yourself ("Meena (you) · once a game"); last night's pick greyed with "protected last night"; yourself greyed with "used" once used | "Om is protected tonight." |
| Police | "POLICE · Pick someone to check." | everyone in except yourself; checked players with their answer in small type | "Zoya: MAFIA." / "Zoya: Not Mafia." |
| Villager | "VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this." | everyone in except yourself | "You think it's Zoya. At the end we'll see if you were right." |
| Out player | "YOU'RE OUT · Ghost guess: who's Mafia? Pick one." | everyone still in | "Your guess: Zoya." |
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Tap to see your night job / Tap to hide | job shown / hidden (pick kept) | — | MAF-02 |
| A name | that name selected with its result line; tapping another name moves the pick. Police: the first name tapped is the check, its answer shows and the other names grey out (one tap, as for everyone) | — | MAF-02, 05 |
| Not Meena? ← Back | N1 for Meena | — | MAF-02 |
| Done, pass to Kabir | N1 for Kabir | `nightPick` | MAF-02 |
| Done, night over (last player) | N3 | `nightPick`; the night resolves in this order: (1) if the Mafia's picks differ, one of them at random (role seed); (2) if the Doctor protected that player, nobody is out; (3) otherwise that player is out | MAF-02, 03 |
| App hidden / reload while shown | job hidden; N1 for Meena with "Welcome back."; nothing recorded until Done | — | MAF-10 |

### N3. Night over (room)
*Words:* "Night over."; "Host, take the phone and read the morning aloud."; main "Read the morning". *Intentions:* pause;
help, stop, home (menu: How to play · Players · Pause · Home · End the game · End for tonight).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Read the morning | M1 Morning | — | MAF-02 |

### M1. Morning (room; the host reads it aloud)
*Words:* "Morning, day 1"; one story, then the line for who is out (examples):
- Out: "The Mafia knocked on KABIR's door at midnight. Kabir is out. Kabir was a Villager." (role shown, MF3)
- Saved: "The Mafia came knocking, but the Doctor got there first with a hot cup of turmeric milk. Nobody is out!" (never names who was saved: the Mafia never pick their own, so it would clear them)
- Then: "7 players left · Mafia caught: 0 of 2". Only Mafia **shown** as Mafia count as caught; a player who left (D3) never changes this line, so the room can't learn a leaver's role.
A story is picked at random from a short list (`stories.csv`, later), never the same twice in a game; stories never name
the Doctor or say who the Police checked. Quiet "See my role again"; main "Start talking" (or "See who won" when the night ended the game); quiet "End the game" and "← Home" when
"Start talking" is the main. *Intentions:* pause, stop, home; help (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Start talking | Y1 Day | — | MAF-02 |
| See who won | G1 (the Mafia now equal the rest) | — | MAF-03 |
| See my role again | D5 | — | MAF-05 |

## E. Day (room)

### Y1. Day: talk it over
*Words:* "Day 1 · Talk it over"; "Who's still in:" names; out names greyed, each with their shown role; "Out players: watch
quietly, no hints!"; quiet "See my role again"; quiet "Start 2-minute timer" ↔ "Stop timer"; main "Time to vote".
*Intentions:* pause, help (menu), stop (menu), timer.
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Time to vote | V1 Countdown | — | MAF-02 |
| See my role again | D5 | — | MAF-05 |
| Start 2-minute timer | timer on this screen; at 0 a chime and "Time's up!", nothing else | — | MAF-02 |

### V1. Countdown
*Words:* "Everyone in, point at who you think is Mafia."; big "3", "2", "1", "Point!" (1 s each); then automatically V2.
Quiet "Not yet" during the count → Y1. *Intentions:* back (Not yet), pause.

### V2. Who got the most fingers?
*Words:* heading "Who got the most fingers?"; one button per player still in; label "Not sure? Count again."; text buttons
"It's a tie", "Count again", "Nobody today" (MF12); quiet "← Back to talking"; main "Put out" (disabled) → "Put Kabir out".
*Intentions:* back, pause; help, stop (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| A name | selected; main "Put Kabir out" | — | MAF-02 |
| Put Kabir out | V4 Vote result | `voteOut` | MAF-02 |
| It's a tie | V3 Tie | — | MAF-02 |
| Count again | V1 | — | MAF-02 |
| Nobody today | D6 "Nobody out today?" | — | MAF-02 |
| ← Back to talking | Y1 (timer reset) | — | MAF-02 |

### V3. Tie
*Words:* first tie: heading "Tap everyone who is tied"; names; quiet "Not a tie"; main "Point again (2 players)". Second tie:
"Still a tie. Nobody is out today." main "Start night 2". *Intentions:* back (Not a tie), pause; stop (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Names | selected | — | MAF-02 |
| Point again | V1 with only the tied players named ("Point only at Kabir or Om") → V2 with only them, "It's a tie" now leads to the second-tie screen | `tie` | MAF-02 |
| Not a tie | V2 | — | MAF-02 |
| Start night 2 (second tie) | N0 night 2 | `voteNobody` | MAF-02 |

### V4. Vote result (room)
*Words:* "KABIR is out."; build-up 1.5 s; then "Kabir was MAFIA!" or "Kabir was a Villager." (or Doctor, Police);
"Mafia caught: 1 of 2" (same rule as M1); quiet "End the game"; quiet "← Home"; main "Start night 2" (or "See who won" when
the game is over). *Intentions:* stop, home, pause; help (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Start night 2 | N0 | — | MAF-02 |
| See who won | G1 | — | MAF-03 |
| End the game | D7 | — | MAF-07 |
| ← Home | A1 (game kept) | — | MAF-10 |

## F. Dialogs during a game
| # | Dialog | Words | Buttons → where | Records | IDs |
|---|---|---|---|---|---|
| D1 | Paused (cover) | "Paused"; the where-line; "Tap Carry on when everyone's back." | Carry on → the same room screen | — | MAF-06 |
| D2 | Players | names with "✕"; add row "Player name" + "Add"; mid-game: "New players join the next game." | Done → back; ✕ → D3 | `addNext` | MAF-06 |
| D3 | Kabir has to leave? | By day: "Kabir goes out now. Their role stays secret until the game ends." (MF10). At night (N0–N3): "Kabir leaves when this night is over. Their role stays secret until the game ends." | Kabir leaves → back, toast "Kabir left · Undo" (10 s); at night the leave is applied after the night resolves (their pick counts; if they were the Mafia's target they are out as usual). If the leave ends the game → G1 "The Village wins!" / "The Mafia win!" with "Kabir had to leave." · Keep Kabir (main) → D2 | `leave` | MAF-06 |
| D4 | Deal again? (before night 1 only) | "Deal again? Everyone gets a new role." | Deal again → B1 first player · Keep these roles (main) → back | new `deal` | MAF-05 |
| D5 | See my role again | heading "Whose role?"; names of players still in; Cancel | a name → B1 for them ("Not Meena? ← Back") → B2 with main "Done, back to the day" → back | — | MAF-05 |
| D6 | Nobody out today? | "Nobody goes out today. Straight to night 2." | Nobody today → N0 · Back to the vote (main) → V2 | `voteNobody` | MAF-02 |
| D7 | End this game with no winner? | "Everyone's role will be shown." | End the game → G1 "Game ended. No winner." with toast "Game ended · Undo" (10 s) · Keep playing (main) → back | `endGame` | MAF-07 |
| D8 | End for tonight? | "End for tonight? Tonight's score stays in History." / mid-game "… This game won't count." | End for tonight → G2 · Keep playing (main) → back | — | MAF-07 |

## G. After a game, after the night

### G1. Game over
*Words:* "The Village wins! Every Mafia is out." / "The Mafia win! They're as many as everyone else." / "Game ended. No
winner."; the roles list: every player with their role, out players with "out night 1" / "voted out day 2"; quiet "What
happened each night" (opens a list: "Night 1: Mafia picked Kabir · Doctor protected Kabir · Police checked Zoya (Mafia)");
fun lines: "Sharpest eyes: Om picked a Mafia 3 nights out of 3" (Villagers' picks), "Best ghost guess: Riya" (when
any); "Tonight: Village 2 · Mafia 1"; quiet "Change players or roles"; quiet "End for tonight"; quiet "← Home"; main "Play
again". *Intentions:* stop, home, play on, change (visible); help, Settings, History (menu).
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Play again | deal with the same players (new ones added, leavers removed) → B1; the Mafia count is kept unless S2's limits no longer allow it, then the suggestion. Fewer than 5 players: S1 with "Mafia needs at least 5 players." | `deal` | MAF-07 |
| Change players or roles | S1 ("← Back to the game") → S2 → Deal the roles (no read-aloud) | — | MAF-07 |
| End for tonight | D8 → G2 | — | MAF-07 |
| ← Home | A1 (game night stays unfinished) | — | MAF-10 |
| Undo (toast after End the game) | the step it came from | nothing | MAF-07 |

### G2. Summary "Tonight's Mafia"
*Words:* "8 players · 3 games"; "Village 2 · Mafia 1"; "Mafia most often: Arjun (2 games)"; "Sharpest eyes tonight: Om"; quiet
"Oops, keep playing"; quiet "← Home"; main "Play something else". Menu: only "Delete tonight's games".
| Tap | Leads to | Records | IDs |
|---|---|---|---|
| Oops, keep playing | where the host came from | nothing | MAF-07 |
| ← Home / Play something else | A1 / A2 (tonight's names kept) | `endEvening` | MAF-07 |

## H. The paths (the finite list for the coverage map)
```
A1→A2  A1→(resume)B1|N0|N1|N3|M1|Y1|V2|V4|G1 (V1 and V3 resume at V2; an open dialog resumes at the screen under it)   A2→S1  A2→A3
S1→S2  S1→S4→S1  S1→A2      S2→S3|B1  S2→S1  S2→S4→S2      S3→B1  S3→S4→S3
B1→B2  B1→D1→B1  B1→menu…   B2→B1(next)  B2→B1(not Riya)  B2→D4→B1|B2  B2→N0(last)
N0→N1  N1→N2  N1→D1→N1  N1→menu…   N2→N1(next)  N2→N1(not Meena; app hidden)  N2→N3(last)
N3→M1  M1→Y1  M1→G1(see who won)  M1→D5→B1→B2→M1
Y1→V1  Y1→D5→…→Y1  Y1→menu…
V1→V2  V1→Y1(not yet)   V2→V4  V2→V3  V2→V1  V2→D6→N0|V2   V3→V1  V3→V2  V3→N0(second tie)
V4→N0  V4→G1
any room screen→D1→same   any room screen→D2→D3→same|G1   any room screen→D7→G1   any room screen→D8→G2
G1→B1  G1→S1→S2→B1  G1→D8→G2  G1→A1  G1→(undo)step
G2→(back)step  G2→A1  G2→A2
```
Rule branches to reach at least once: three and four Mafia agreeing and differing; one Mafia left; a leaver at night
who was the Mafia's target; Play again below 5 players; Doctor saves the Mafia's pick; Doctor's self-protect used then greyed; Doctor's
"protected last night"; Mafia agree; Mafia differ (random); Police sees Mafia and Not Mafia; night ends the game; vote ends
the game (both sides); first tie then decided; second tie; Nobody today; a leaver who was the last Mafia; a leaver who makes
the Mafia equal; "New to Mafia?" on each role; 5 players (no Doctor or Police); 16 players with 4 Mafia; Mafia count ±1.

## I. Open in draft 1 (for the persona walks, the critic and Jev to test)
1. **Night pass with out players** (MF11): out players take the phone too, for their ghost guess. It adds about 10 s per out
   player per night, but keeps them in the game and makes the pass the same for everyone. Alternative: they guess once, when
   they go out.
2. **The 4-second Done** on N2: long enough to hide the Mafia's agreeing? Too slow for the Villagers?
3. **Story text** for the morning: tone with kids and grandparents; to be written as `stories.csv` and Jev-checked.
4. **The night order** starts one seat later each night, so the Mafia aren't always first or last.
5. No timer on the night, by design: the 4 s Done is the only pace-setter.

6. **Persona walks not done yet.** The player helper may read only live screens (role guard), so it cannot walk this map as
   text. The walks run on the tap-through prototype once the renderer (built for Secret Words) can draw this map; or the
   owner allows a text walk (a project rule change). Asked 22 October.

## J. Critic pass of draft 1 (22 October): what changed
Applied (product owner's call, low or medium): the Mafia count line counts only Mafia shown, so a leaver's role never leaks;
nothing pre-selected for later Mafia (same taps for all); three and four Mafia agree by "latest pick" and differ at random;
one-Mafia texts; night resolution order (random pick, then the Doctor); a leaver at night leaves after the night; "+" never
lets the Mafia equal the rest after night 1; the saved story never names who was saved; the Villager asks "who do you think
is Mafia? Think, then pick" so Villagers take a moment too; "turmeric milk", "who goes out tonight", "think is Mafia",
"score"; visible stop, home and back on M1, V1–V4 and S3; Play again checks the player count; resume points for V1, V3 and
dialogs. MAF-08 (prizes) is not used: Mafia has no prizes.
Not changed: "Welcome back." after a reload during a night job (it shows only that the holder's phone was interrupted; low).

**Owner's answers (23 October):**
- **J-Q1 → MF14:** no "First time" tick (it told the room who wasn't Mafia). Every role card has a private "New to Mafia? What
  this means" instead (B2, D5). Replaces MF9.
- **J-Q2 → MF15:** if someone peeks at a night job, the game carries on and the peeker promises to forget, as with a human
  moderator. "Deal again" stays for before night 1 only; How to play says so: "Saw someone's screen? Keep it to yourself and
  carry on. Before the first night, Deal again instead."

## K. Prototype script (what the tap-through shows)
Same rendering rules as Secret Words K3 (one state per screen, real labels, K4-style outcomes), with this data.

**K1. The example game night.** Players in seat order: Riya, Arjun, Meena, Kabir, Zoya, Dev, Om, Sunita. Mafia: Arjun and
Zoya. Doctor: Meena. Police: Dev. Villagers: Riya, Kabir, Om, Sunita. Game 2 of the night; tally Village 1 · Mafia 0.
Shown state: night 1, Meena's turn (3 of 8).

**K2. Night 1:** Arjun picks Kabir; Zoya agrees; Meena protects Kabir; Dev checks Zoya (MAFIA); Riya suspects Arjun, Kabir
suspects Dev, Om suspects Zoya, Sunita suspects Riya. Morning: Kabir saved, nobody out. Day 1: tie between Om and Zoya, point
again, Om is voted out (Villager). Night 2: Arjun picks Dev; Zoya changes to Meena; the phone picks Dev; Meena protects
herself; Dev is out (Police). Day 2: Zoya voted out (MAFIA). Night 3: Arjun picks Meena, Meena protects Riya; Meena out.
Players left: Riya, Arjun, Kabir, Sunita (1 Mafia v 3). Day 3: Arjun voted out → "The Village wins!".

**K3. Which outcome a tap follows.** N2 role shown follows K1 for the named player (Meena: DOCTOR). "Read the morning" after
night 1 shows the "Saved" story. "Put Om out" → V4 "Om was a Villager." "Start talking" always leads to Y1 in the prototype; G1 is reached by
"See who won" on V4 after day 3. A1 resume → N1 for Meena with "Welcome back." and the where-line.
