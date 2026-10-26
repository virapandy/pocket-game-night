# 02-deal.md: The deal (C3 rules; screens C2)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## MAF-010: Dealing roles
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
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

**Version 1.1** (item 16): **Streaks (MAF-010):** "games k − 1 and k − 2" are the two games started before this one tonight, whatever their end; a game the player wasn't dealt in breaks their streak. Seeds combine as `:d1`, then `:d1:r1`, `:d1:r2`, ….

**Version 1.1** (item 26): **MAF-020/MAF-010:** "Start the night" records `startNight { night }`; each "Done, pass to …" and "Done, everyone's seen" records `seen { player }`; MAF-021's "i of T" = turns taken tonight + 1, T = players in tonight's order (after skips).

## MAF-011: What each role card says
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
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

**Version 1.1** (item 20): **MAF-011:** every role card has **2 lines under the role word plus 1 empty line**, so all cards are the same height. MAF-015's partner text replaces line 1 only. Its variants: one partner out "Zoya is out. You're the only Mafia left."; partner left "Zoya has left. You're the only Mafia left."; with M = 3 or 4: the partners still in first, "You and Dev are the Mafia. Zoya is out." / "You, Dev and Om are the Mafia. Zoya is out." / "You and Om are the Mafia. Zoya and Dev are out."; all others out or left: "Zoya and Dev are out. You're the only Mafia left." (names in seat order; "left" for leavers, "out" for out players, "Zoya is out and Dev has left." when mixed). "Not Riya? ← Back" in D5 returns to the screen it came from.

**Version 1.4 (product owner, 26 October; owner away)** (item 6; class C1, words for weak-English readers): the Mafia card's line 2 (`mf.b2-mafia.6`) reads **"At night, you pick who is out. By day, act like a Villager."** ("goes out" can read as "goes outside"). Every card keeps item 20's layout and height.

## MAF-012: First time? What this role means
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
On **every** role card while shown, a quiet button "First time? What this role means" under the block (MF14). Tapping it shows,
under the role lines and in the same private block, three lines for that role; tapping again ("Hide this") hides them; they
also hide with the role. Mafia: "Your side wins when the Mafia are as many as everyone else." · "At night, pick who goes out." ·
"By day, join in and point at others. Stay calm!" Doctor: "Your side wins when every Mafia is out." · "At night, protect one
person." · "If you protect the Mafia's pick, nobody goes out." Police: "Your side wins when every Mafia is out." · "At night,
check one person." · "You choose whether to tell the room what you found." Villager: "Your side wins when every Mafia is out." ·
"At night, pick who you think is Mafia. Only you see it." · "By day, listen, ask questions and vote." Records nothing.

**Version 1.4 (product owner, 26 October; owner away)** (item 6; class C1): the Mafia's second line (`mf.b2-first-time.2`) reads **"At night, pick who is out."**

## MAF-013: Wrong person, double taps, interruptions during the deal
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
As IMP-010, IMP-018 and IMP-090: "Not Riya? ← Back" (before the first hold) returns to Riya's pass screen; a tap within the guard
does nothing; hiding the app or a reload during a shown role empties the block at once and returns to that player's pass screen
with "Welcome back." above the where-line; nothing is recorded until "Done, pass to …".

## MAF-014: Deal again (before night 1 only)
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"Someone saw my role" (B2) and the menu item "Deal again" (deal pass screens and N0 of night 1 until "Start the night") open the
dialog "Deal again?" · "Everyone gets a new role." "Deal again" records `redeal` (new deal with `createRng(\`${seeds.roles}:${k}:d1\`)`,
then `:d2`, …; streak rule as MAF-010) and opens "Player 1 of N" for seat 0. "Keep these roles" (main) returns to where it was
opened, nothing recorded. From "Start the night" on, "Deal again" is not in the menu and "Someone saw my role" is not shown (MF15).

**Version 1.1** (item 12): **A leave during the deal (owner):** on B1 (before night 1's "Start the night") the dialog body reads "Kabir leaves. Everyone gets a new role without Kabir." and "Kabir leaves" records `leave` then `redeal` (MAF-014; N must stay ≥ 5, else the leave is refused with "Mafia needs at least 5 players." and "OK"). On N0 of night 1, as a night leave.

## MAF-015: See my role again
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Quiet "See my role again" on Morning (MAF-030) and Day (MAF-031), and the menu item on those two screens only. It opens the dialog
"Whose role?" with one button per player who is **in**, and "Cancel". A name opens that player's deal pass screen without
`deal-progress`, then their role card (MAF-011, MAF-012) with main "Done, back to the day" → the screen it came from. A Mafia
whose partners are out reads "Zoya is out. You're the only Mafia left." (two or more out: "Zoya and Dev are out. You're the only
Mafia left."; one of three out: "You and Dev are the Mafia. Zoya is out."). Records nothing. Players who are out are not
offered (their role is already shown).

**Version 1.1** (item 20): **MAF-011:** every role card has **2 lines under the role word plus 1 empty line**, so all cards are the same height. MAF-015's partner text replaces line 1 only. Its variants: one partner out "Zoya is out. You're the only Mafia left."; partner left "Zoya has left. You're the only Mafia left."; with M = 3 or 4: the partners still in first, "You and Dev are the Mafia. Zoya is out." / "You, Dev and Om are the Mafia. Zoya is out." / "You and Om are the Mafia. Zoya and Dev are out."; all others out or left: "Zoya and Dev are out. You're the only Mafia left." (names in seat order; "left" for leavers, "out" for out players, "Zoya is out and Dev has left." when mixed). "Not Riya? ← Back" in D5 returns to the screen it came from.

## MAF-016: The host sees nothing secret
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Property (MAF-P2, as IMP-062): no room screen, toast, dialog, accessible name, page title or `aria-live` region ever holds a role
of a player who is in or has left, a night pick, a Police result, whose turn in the night pass is Mafia, or how many players
are still to pick tonight. Exceptions only: roles shown by MAF-030 and MAF-036, and everything on G1 after game over.

**Version 1.1** (item 31): **MAF-P2 vs MAF-021:** "i of T" on N1 is allowed: it never depends on roles. MAF-016's "how many players are still to pick" means **how many Mafia** (or any role) are still to pick.
