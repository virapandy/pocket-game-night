# 03-night.md: Night (C3 rules; screens C2)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md). Paragraphs headed "Version 1.2 (owner, 25 October)" are the owner's privacy changes of 25 October ("do all as recommended"); they win over Version 1.1 and the text above them. Paragraphs headed "Version 1.3 (owner, 26 October; MF21)" are the private "why" line on N2 (a 1.6.x point release); they win over Version 1.2 A's "a tap on a name the role may not pick does nothing".

## MAF-020: Night begins
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
N0 shows h1 "Night r", the two lines of the Canonical strings, and main "Start the night" → the night pass screen of the first
player in the night order (Terms). Night 1 follows the last `seen`; night r > 1 follows Day r − 1 (MAF-034, 035, 036). Menu:
How to play · Players · Deal again (night 1 only) · Pause · Home (game is saved) · End the game · End for tonight.

**Version 1.1** (item 26): **MAF-020/MAF-010:** "Start the night" records `startNight { night }`; each "Done, pass to …" and "Done, everyone's seen" records `seen { player }`; MAF-021's "i of T" = turns taken tonight + 1, T = players in tonight's order (after skips).

## MAF-021: The night pass
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Every player in the night order gets one turn, in that order: pass screen (`night-progress` "Night r · i of T", T = players in
the night order; "Pass the phone to"; NAME; "Everyone else, look away!"; for a player who is out also "You're out: pick who you
think is Mafia."; main "I'm Meena", 1000 ms guard) → night job (MAF-022). Worked order, game 1, 9 players: night 1 starts at seat
0 (Riya, Arjun, … Neha); night 2 at seat 1 (Arjun … Neha, Riya); game 2 night 1 at seat 1. A player who leaves (MAF-052) before
their turn is skipped and T drops by one from the next pass screen.

**Version 1.1** (item 26): **MAF-020/MAF-010:** "Start the night" records `startNight { night }`; each "Done, pass to …" and "Done, everyone's seen" records `seen { player }`; MAF-021's "i of T" = turns taken tonight + 1, T = players in tonight's order (after skips).

**Version 1.1** (item 31): **MAF-P2 vs MAF-021:** "i of T" on N1 is allowed: it never depends on roles. MAF-016's "how many players are still to pick" means **how many Mafia** (or any role) are still to pick.

## MAF-022: The night job: one layout for every role
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
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

**Version 1.1** (item 4): **Same names for every role (owner):** N2's names box lists **every player dealt this game who hasn't left and isn't leaving tonight**, in seat order, for every role; names the player may not pick are greyed (native `disabled`) with a small tag under the name: "you", "Mafia" (a Mafia's partners), "out", "protected last night", "used" (Doctor's self after use; "used" wins over "protected last night"), "Mafia" / "Not Mafia" (Police's earlier checks). So the number of buttons never depends on the role. Tags are not part of the button's accessible name; a greyed button's name ends ", can't pick".

**Version 1.1** (item 5): **MAF-P7 means the frame:** for every role, N2 has the same elements in the same order (night-progress, name, pad, job-line, names box, result-line, main) with the same sizes (±1 px): job-line and result-line boxes are always **2 lines tall** (`min-height` = 2 × line height; a 1-line text is top-aligned), name buttons 56 px, the same count (item 4), and the same guard.

**Version 1.1** (item 6): **N2 arithmetic (rule 4), 320 × 568, Larger text off, no top bar on N2:** 16 + night-progress 18 + 4 + name 34 + 8 + pad 48 (once shown, the pad shrinks from 120 px to a 48 px "Tap to hide" button) + 8 + job-line 41 + 8 + names box + 8 + result-line 41 + 8 + main 60 + 16 = 318 + names box, so the names box is 250 px: **3 rows (6 names) without scrolling**; more scroll inside the box. Larger text on: 3 rows still (the box is 228 px). Landscape (812 × 375, 568 × 320): names box in the right half at full height minus 32 px (at least 4 rows, 8 names); everything else in the left half, main bottom left of that half.

**Version 1.1** (item 7): **The pick on N2** is kept while the job is hidden on the same N2. Back ("Not Meena? ← Back"), a reload or the app hidden loses the pick (nothing was recorded) and the next N2 for that player starts the 4000 ms again. Tapping the selected name again changes nothing. **Clocks:** the 4000 ms start at the first "Tap to see"; the 60 s hide counts from the last `pointerdown` anywhere on N2. When both guard conditions are met, the main button appears and its 800 ms guard starts then (likewise V4's main: appears at 1500 ms, live at 2300 ms).

**Version 1.2 (owner, 25 October)** (privacy change A, C3, MAF-P2/P7, guideline 51; replaces item 4's greying and tags, and wins over item 8 and the scenario text): **N2's names look the same for every role.** The names box keeps item 4's list (every player dealt this game who hasn't left and isn't leaving tonight, seat order), but **no name button is greyed, `disabled` or `aria-disabled`**, and every name button has the same look (opacity, colours, border) for every role; only the selected one differs (`aria-pressed="true"`). **Every role sees the same tags:** "you" under the player's own name and "out" under players who are out, nothing else. Gone: "Mafia" (a Mafia's partners), "used", "protected last night", the Police's "Mafia" / "Not Mafia", "Arjun's pick", and the Doctor's "(you) · once a game". **A tap on a name the role may not pick does nothing:** nothing is recorded, nothing visible changes (the selection, the result line and the main button stay as they were). This covers the Mafia's partners, the Doctor's own name once used and last night's protection, the Police's earlier checks, the player's own name ("you") and players who are out (for a player who is in). **Screen readers** read the same for every role: each name button's accessible name is the player's name only (no ", can't pick", no tag, no partner name). **Every role takes the same number of taps:** the main button needs the 4000 ms and one name tap for every role, including a Police with nobody left to check (MAF-025).

**Version 1.3 (owner, 26 October; MF21)** (why a name can't be picked; class C2, but N2 is C3 in look, MAF-P7; wins over Version 1.2 A's "a tap on a name the role may not pick does nothing"; copied word for word from `docs/games/mafia/scenarios.md`):
1. On N2, a tap on a name the role may not pick **selects nothing** and puts one line in `result-line` (the same box, size and place for every role), replacing what was there until the next tap on any name. Done's conditions don't change. Nothing is recorded; no sound or vibration (MAF-082).
2. The line, the first that applies:
   - the player's own name (any role): **"That's you. Pick someone else."**
   - a player who is out (any role, ghost guesses included): **"Kabir is out. Pick someone else."**
   - Mafia, a partner: **"Zoya is Mafia too. Pick someone else."**
   - Doctor, last night's pick: **"You protected Om last night. Pick someone else."**
   - Doctor, themselves after using it: **"You've already protected yourself once. Pick someone else."**
   - Police, a player checked on an earlier night: **"You checked Zoya on night 1: Mafia. Pick someone else."** / "…: Not Mafia. …"
   - Police, any other name after tonight's check: **"Tonight's check is done: Zoya is MAFIA."** / "…: Zoya is Not Mafia." (the tonight's answer again; the checked name stays selected).
3. Names in capitals by CSS only (as the build answers' item 20). Each line fits the result-line box as sized by build answers item 7 (the longest variant counts towards that height). Strings join `text.csv` as `mf.n2-why.1` to `.7`.

**Version 1.3, the tester's reading** (Test role, 26 October; the tests follow it; the orchestrator's decisions of 26 October are marked, for the product owner to confirm in `docs/test-questions.md`):
- **Orchestrator's decision, 26 October:** "The player's own name (any role)" is the reason only when being themselves is what stops the pick: a Doctor who is in may pick themselves, so the Doctor's own name gets the Doctor's reasons ("You've already protected yourself once. …"); a player who is out (any role) tapping their own name gets "That's you. …".
- The answer words of line 6 are "Mafia" / "Not Mafia" as written; line 7's "MAFIA" may be capitals in the DOM or by CSS (tests match case-insensitively, as for "Zoya: MAFIA.").
- Screen readers: the line is announced on N2 only, through a polite live region of N2 (the result line or one inside N2); it is never in a room screen's text, labels or live regions, and the name buttons' accessible names stay the name only (Version 1.2 A).
- After "Tap to hide", 60 s or IMP-018's triggers, the result line is empty (MAF-022), so no why-line shows while the job is hidden.
- **Orchestrator's decision, 26 October:** the Doctor's own name on the night right after they protected themselves (both "last night" and "used" apply) reads "You've already protected yourself once. Pick someone else." (`selfUsed` wins over `lastNight`).
- **Orchestrator's decision, 26 October:** a tap on the already-selected name while a why-line shows brings back that pick's result line (the pick stays; nothing is recorded).
- **Orchestrator's decision, 26 October:** when the job is shown again after a hide that followed a why-line, the result line shows the current pick's line (empty when nothing is picked).
- Not changed: a Police with nobody left to check (Version 1.2 A): any name tap is the tap Done needs and shows "Nobody left to check.".

## MAF-023: Mafia at night
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
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

**Version 1.1** (item 4): **Same names for every role (owner):** N2's names box lists **every player dealt this game who hasn't left and isn't leaving tonight**, in seat order, for every role; names the player may not pick are greyed (native `disabled`) with a small tag under the name: "you", "Mafia" (a Mafia's partners), "out", "protected last night", "used" (Doctor's self after use; "used" wins over "protected last night"), "Mafia" / "Not Mafia" (Police's earlier checks). So the number of buttons never depends on the role. Tags are not part of the button's accessible name; a greyed button's name ends ", can't pick".

**Version 1.1** (item 9): **Mafia (MAF-023):** "first Mafia" = the first Mafia **in** who takes a turn tonight; a Mafia who is out takes a ghost guess (MAF-026), never the Mafia job. "Zoya will see your pick" names only Mafia in who are still to take their turn tonight; with 2 or 3 of them "Zoya and Dev will see your pick" / "Zoya, Dev and Om will see your pick", and the result line "Kabir. Zoya and Dev can agree or change it." Each later Mafia sees **the latest Mafia pick so far tonight** (with three Mafia, the third sees the second's pick, named: "Zoya's pick: OM. …").

**Version 1.1** (item 10): **`pick`** in MAF-023 and MAF-037 is `list[floor(rng() × list.length)]` using the rng's first value. MAF-023's worked example uses MAF-H3's deal with `seeds.roles = "mafia-example"`; the tester confirms the 0.62 (or the example changes to whatever that seed's first value gives, keeping the rule).

**Version 1.2 (owner, 25 October)** (privacy change A, C3, MAF-P2/P7, guideline 51; replaces item 4's greying and tags, and wins over item 8 and the scenario text): **N2's names look the same for every role.** The names box keeps item 4's list (every player dealt this game who hasn't left and isn't leaving tonight, seat order), but **no name button is greyed, `disabled` or `aria-disabled`**, and every name button has the same look (opacity, colours, border) for every role; only the selected one differs (`aria-pressed="true"`). **Every role sees the same tags:** "you" under the player's own name and "out" under players who are out, nothing else. Gone: "Mafia" (a Mafia's partners), "used", "protected last night", the Police's "Mafia" / "Not Mafia", "Arjun's pick", and the Doctor's "(you) · once a game". **A tap on a name the role may not pick does nothing:** nothing is recorded, nothing visible changes (the selection, the result line and the main button stay as they were). This covers the Mafia's partners, the Doctor's own name once used and last night's protection, the Police's earlier checks, the player's own name ("you") and players who are out (for a player who is in). **Screen readers** read the same for every role: each name button's accessible name is the player's name only (no ", can't pick", no tag, no partner name). **Every role takes the same number of taps:** the main button needs the 4000 ms and one name tap for every role, including a Police with nobody left to check (MAF-025).

**Version 1.3 (owner, 26 October; MF21)**: see MAF-022, Version 1.3. The Mafia's lines: own name "That's you. Pick someone else."; a player who is out "Kabir is out. Pick someone else."; a partner who is in "Zoya is Mafia too. Pick someone else." (`mf.n2-why.1` to `.3`).

## MAF-024: Doctor at night
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"DOCTOR · Pick someone to protect tonight." Allowed: every player who is in, including the Doctor ("Meena (you) · once a game"),
**except** the player the Doctor protected on the previous night (greyed, small tag "protected last night") and, once the Doctor
has protected themselves this game, the Doctor (greyed, "used"). The previous night means night r − 1 only: a player protected on
night 1 may be protected on night 3. Result line "Om is protected tonight." / self "You are protected tonight."

**Version 1.1** (item 4): **Same names for every role (owner):** N2's names box lists **every player dealt this game who hasn't left and isn't leaving tonight**, in seat order, for every role; names the player may not pick are greyed (native `disabled`) with a small tag under the name: "you", "Mafia" (a Mafia's partners), "out", "protected last night", "used" (Doctor's self after use; "used" wins over "protected last night"), "Mafia" / "Not Mafia" (Police's earlier checks). So the number of buttons never depends on the role. Tags are not part of the button's accessible name; a greyed button's name ends ", can't pick".

**Version 1.2 (owner, 25 October)** (privacy change A, C3, MAF-P2/P7, guideline 51; replaces item 4's greying and tags, and wins over item 8 and the scenario text): **N2's names look the same for every role.** The names box keeps item 4's list (every player dealt this game who hasn't left and isn't leaving tonight, seat order), but **no name button is greyed, `disabled` or `aria-disabled`**, and every name button has the same look (opacity, colours, border) for every role; only the selected one differs (`aria-pressed="true"`). **Every role sees the same tags:** "you" under the player's own name and "out" under players who are out, nothing else. Gone: "Mafia" (a Mafia's partners), "used", "protected last night", the Police's "Mafia" / "Not Mafia", "Arjun's pick", and the Doctor's "(you) · once a game". **A tap on a name the role may not pick does nothing:** nothing is recorded, nothing visible changes (the selection, the result line and the main button stay as they were). This covers the Mafia's partners, the Doctor's own name once used and last night's protection, the Police's earlier checks, the player's own name ("you") and players who are out (for a player who is in). **Screen readers** read the same for every role: each name button's accessible name is the player's name only (no ", can't pick", no tag, no partner name). **Every role takes the same number of taps:** the main button needs the 4000 ms and one name tap for every role, including a Police with nobody left to check (MAF-025).

**Version 1.3 (owner, 26 October; MF21)**: see MAF-022, Version 1.3. The Doctor's lines: a player who is out "Kabir is out. Pick someone else."; last night's pick "You protected Om last night. Pick someone else."; themselves once used "You've already protected yourself once. Pick someone else." (`mf.n2-why.2`, `.4`, `.5`).

## MAF-025: Police at night
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"POLICE · Pick someone to check." Allowed: every player who is in except the Police and except players this Police has already
checked (shown greyed with their answer as a small tag "Mafia" / "Not Mafia"). **The first name tapped is the check**: its
answer shows at once in the result line, "Zoya: MAFIA." or "Zoya: Not Mafia.", and every other name greys out; there is one tap,
as for every role. When no name is allowed (everyone in has been checked): job line "POLICE · Nobody left to check.", names box
lists the checked players greyed with their answers, and the main button needs only the 4000 ms (no pick); records `nightPick
{ player, target: null }`.

**Version 1.1** (item 4): **Same names for every role (owner):** N2's names box lists **every player dealt this game who hasn't left and isn't leaving tonight**, in seat order, for every role; names the player may not pick are greyed (native `disabled`) with a small tag under the name: "you", "Mafia" (a Mafia's partners), "out", "protected last night", "used" (Doctor's self after use; "used" wins over "protected last night"), "Mafia" / "Not Mafia" (Police's earlier checks). So the number of buttons never depends on the role. Tags are not part of the button's accessible name; a greyed button's name ends ", can't pick".

**Version 1.1** (item 8): **Police:** "already checked" means this game only; after a hide on the same N2 the check stays locked (answer shown, other names greyed). The checked list shows players still dealt-and-not-left (out ones tagged "out", their answer kept as a second tag).

**Version 1.2 (owner, 25 October)** (privacy change A, C3, MAF-P2/P7, guideline 51; replaces item 4's greying and tags, and wins over item 8 and the scenario text): **N2's names look the same for every role.** The names box keeps item 4's list (every player dealt this game who hasn't left and isn't leaving tonight, seat order), but **no name button is greyed, `disabled` or `aria-disabled`**, and every name button has the same look (opacity, colours, border) for every role; only the selected one differs (`aria-pressed="true"`). **Every role sees the same tags:** "you" under the player's own name and "out" under players who are out, nothing else. Gone: "Mafia" (a Mafia's partners), "used", "protected last night", the Police's "Mafia" / "Not Mafia", "Arjun's pick", and the Doctor's "(you) · once a game". **A tap on a name the role may not pick does nothing:** nothing is recorded, nothing visible changes (the selection, the result line and the main button stay as they were). This covers the Mafia's partners, the Doctor's own name once used and last night's protection, the Police's earlier checks, the player's own name ("you") and players who are out (for a player who is in). **Screen readers** read the same for every role: each name button's accessible name is the player's name only (no ", can't pick", no tag, no partner name). **Every role takes the same number of taps:** the main button needs the 4000 ms and one name tap for every role, including a Police with nobody left to check (MAF-025).

**Version 1.2 (owner, 25 October)** (privacy change A, Police part): the Police's answer shows **only in the result line** ("Zoya: MAFIA." / "Zoya: Not Mafia."); after the Police's first tap the other names **do not grey out** and keep their look; a tap on another name does nothing (Version 1.2 change A). **Nobody left to check:** the job line stays "POLICE · Nobody left to check.", the names box lists every name as for every role (none greyed, no answers), the main button still needs the 4000 ms **and a name tap**, any name tap shows "Nobody left to check." in the result line, and Done records `nightPick { player, target: null }`.

**Version 1.2 (owner, 25 October)** (privacy change C, C3): **the Police's first tap is saved at once.** The first name the Police taps records `check { player, target }` at that moment (rule API: `specs/mafia/api.md`). From then on that night: after a reload, the app hidden, or "Not Dev? ← Back", the Police's N2 opens with that same name selected and that same answer in the result line, and the Police cannot check another name (a tap on another name does nothing; the only pick Done can record is the checked name). Main "Done, pass to …" still records `nightPick { player, target }` with the checked name. The room screens show nothing of the check (MAF-P2). Replaces item 7's "a reload or the app hidden loses the pick" for the Police only.

**Version 1.3 (owner, 26 October; MF21)**: see MAF-022, Version 1.3. The Police's lines, the first that applies: own name "That's you. Pick someone else."; a player who is out "Kabir is out. Pick someone else."; a player checked on an earlier night "You checked Zoya on night 1: Mafia. Pick someone else." / "You checked Riya on night 1: Not Mafia. Pick someone else."; after tonight's check, any other name "Tonight's check is done: Zoya is MAFIA." / "Tonight's check is done: Sunita is Not Mafia.", the checked name staying selected (`mf.n2-why.1`, `.2`, `.6`, `.7`). Unchanged: nobody left to check (Version 1.2 A).

## MAF-026: Villagers and players who are out
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Villager: "VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this."; allowed: everyone in except themselves;
result line "You think it's Zoya. At the end we'll see if you were right." Player who is out: "YOU'RE OUT · Ghost guess: who's
Mafia? Pick one."; allowed: everyone in; result line "Your guess: Zoya." These picks change nothing in the game; they feed the
fun lines (MAF-062).

**Version 1.1** (item 4): **Same names for every role (owner):** N2's names box lists **every player dealt this game who hasn't left and isn't leaving tonight**, in seat order, for every role; names the player may not pick are greyed (native `disabled`) with a small tag under the name: "you", "Mafia" (a Mafia's partners), "out", "protected last night", "used" (Doctor's self after use; "used" wins over "protected last night"), "Mafia" / "Not Mafia" (Police's earlier checks). So the number of buttons never depends on the role. Tags are not part of the button's accessible name; a greyed button's name ends ", can't pick".

**Version 1.1** (item 9): **Mafia (MAF-023):** "first Mafia" = the first Mafia **in** who takes a turn tonight; a Mafia who is out takes a ghost guess (MAF-026), never the Mafia job. "Zoya will see your pick" names only Mafia in who are still to take their turn tonight; with 2 or 3 of them "Zoya and Dev will see your pick" / "Zoya, Dev and Om will see your pick", and the result line "Kabir. Zoya and Dev can agree or change it." Each later Mafia sees **the latest Mafia pick so far tonight** (with three Mafia, the third sees the second's pick, named: "Zoya's pick: OM. …").

**Version 1.2 (owner, 25 October)** (privacy change A, C3, MAF-P2/P7, guideline 51; replaces item 4's greying and tags, and wins over item 8 and the scenario text): **N2's names look the same for every role.** The names box keeps item 4's list (every player dealt this game who hasn't left and isn't leaving tonight, seat order), but **no name button is greyed, `disabled` or `aria-disabled`**, and every name button has the same look (opacity, colours, border) for every role; only the selected one differs (`aria-pressed="true"`). **Every role sees the same tags:** "you" under the player's own name and "out" under players who are out, nothing else. Gone: "Mafia" (a Mafia's partners), "used", "protected last night", the Police's "Mafia" / "Not Mafia", "Arjun's pick", and the Doctor's "(you) · once a game". **A tap on a name the role may not pick does nothing:** nothing is recorded, nothing visible changes (the selection, the result line and the main button stay as they were). This covers the Mafia's partners, the Doctor's own name once used and last night's protection, the Police's earlier checks, the player's own name ("you") and players who are out (for a player who is in). **Screen readers** read the same for every role: each name button's accessible name is the player's name only (no ", can't pick", no tag, no partner name). **Every role takes the same number of taps:** the main button needs the 4000 ms and one name tap for every role, including a Police with nobody left to check (MAF-025).

**Version 1.3 (owner, 26 October; MF21)**: see MAF-022, Version 1.3. A Villager's line: own name "That's you. Pick someone else."; a player who is out "Kabir is out. Pick someone else.". A player who is out (ghost guess): own name "That's you. Pick someone else."; another player who is out "Om is out. Pick someone else." (`mf.n2-why.1`, `.2`).

## MAF-027: The night resolves
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
After the last `nightPick` of night r, in this order (MF1b, guide): (1) the Mafia's target (MAF-023); (2) if the Doctor's pick
tonight is the target, **nobody is out**; (3) otherwise the target is out, `out night r`, role shown. Then (4) any night leave
(MAF-052) applies; then (5) the winner check (MAF-040). If no Mafia made a pick (every Mafia in left before their turn), nobody
is out. Property (MAF-P3): at most one player goes out at night (plus leavers); a protected target never goes out; the Mafia
never target a `mafia`; the Doctor never protects the same player two nights running nor themselves twice in a game.

**Version 1.1** (item 11): **A night leave takes the player out of tonight at once (owner):** from the moment "Kabir leaves" is tapped at night, Kabir is not in any names box tonight (not a target, not protected, not checked), his turn if not yet taken is skipped, a pick he made still counts, and the leave applies at MAF-027 step 4. So a leaver's role is never shown before game over (MF10) and a leave can't be used to dodge a target already resolved. A leave on N3 applies when "Read the morning" is tapped.

## MAF-028: Night over
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
N3: h1 "Night over."; "Host, take the phone and read the morning aloud."; main "Read the morning" → MAF-030. Menu: How to play ·
Players · Pause · Home (game is saved) · End the game · End for tonight.
