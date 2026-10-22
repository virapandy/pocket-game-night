# 01-setup.md: Setup

Copied from `docs/games/secret-words/scenarios.md` (version 3.6, approved by the owner 22 October 2026), the binding contract. Where a scenario ends with a paragraph headed "Version 3.6", that paragraph wins over the text above it. Terms, canonical strings, the menu table and the test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## SWD-001: Picking Secret Words
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Home's "Host a game" reads "Tambola, Impostor or Secret Words on this phone" (titles joined with ", ", and " or " before the last). Its picker "What shall we play?" shows three cards
of equal width and height (±1 px) in the order Tambola, Impostor, Secret Words; tapping Secret Words opens "Who's playing?". With an
unfinished Secret Words game night its resume card (SWD-115) shows above the cards (after Impostor's, if both are unfinished);
tapping the Secret Words card then opens the Start new dialog (SWD-115): "Start new (ends that one)" ends that game night
(SWD-067) and opens "Who's playing?"; "Carry on that one" resumes it.

## SWD-002: Join a game, and the map code
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Home's second card reads **"Join a game"** with the line "Tambola ticket or Secret Words map from the host" (owner, 4
October), and opens the Join screen, now headed "Join a game". (Until Secret Words ships, the line reads "Tambola ticket from
the host"; that C1 change is in the handover and tested with Tambola; Secret Words' tests check only the final line.) Rule 11:
this rewords PLT-300 (Home), IMP-002 (its string row and Given) and the Tambola join scenarios that quote "Join with my ticket"
or "Type the code" (now "Type a ticket code") or Tambola's scan label (now "Scan a ticket or secret map", SWD-133); the tester
updates their wording. On the Join screen, in this order: the scanner "Scan a ticket or secret map" (SWD-133) and "Type a
ticket code"; Impostor's line; Secret Words' line; quiet "Type the host's code", which opens the code entry.
Input: `autocapitalize="characters"`, `maxlength="12"`. The typed text is read with spaces and hyphens removed and letters
upper-cased. "Open the map" is disabled while that leaves fewer than 7 characters. On tap:
1. not exactly 7 characters, any character outside the alphabet (0, O, 1, I, L included), or a wrong check symbol
   (SWD-022), or a deal index too large for its edition (checked only for shipped editions) → "That code doesn't look right. Check it with the host.", typed
   text kept;
2. a config symbol for an edition this app doesn't have (value ≥ 4 while the app has only edition 1) → "This map needs a
   newer version of the app. Open the app once with internet, then try again.";
3. otherwise the map phone opens (SWD-034), without team names (SWD-117).
**The QR link** `<origin><BASE_URL>#map=27P3QX8&t=SWDT-01` (`BASE_URL` = the app's base, e.g. `/pocket-game-night/` or
`/preview/`; `t` = the game night's team-name pair id, SWD-117) opens the map phone directly; the hash is then removed from the
address. An invalid or newer code in the link opens the code entry with it filled in (raw) and the matching error shown; "← Back"
there goes to the Join screen. Opening a map never changes an unfinished host game night on that phone.
**Version 3.6 (owner, 22 October):** **Opening a map on the board phone (D2).** On a phone holding an unfinished Secret Words game night (one with no `endEvening` recorded), opening a map by any route (the QR link, the Join scanner, a typed code, Home's saved map) shows, **after** the code is found valid (invalid and newer codes show their errors first, as before), the dialog `board-phone-dialog` (`role="dialog"`, named by its heading) "This phone is the board. Open the map here?" with the paragraph "Clue givers use their own phone. To show the map on this phone, use Show the map to a clue giver in the game's menu." (one-phone game nights: "Clue givers use their own phone. With one phone, pass this phone to the clue giver when the game says so."), quiet "Open the map here" and main "No, keep the board" (800 ms guard, SWD-114). "No, keep the board" returns to the screen the map was opened from (the Join screen, the code entry, Home); opened from the camera with the app closed, to Home. "Open the map here" continues as before. A phone with no unfinished game night never asks.

## SWD-003: Who's playing?
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Impostor's names screen (IMP-003) **without** the "Sit in a circle…" line and without ▲ ▼ (order means nothing here):
tonight's names filled in, "Clear list", past names. "Next" is disabled while there are fewer than 4 names, with "Add at
least 4 players." shown below the list whenever that is true (0 names included). Adding a 21st name shows "20 players is the
most." and adds nothing. "← Back" → the picker (opened from game over: "← Back to the game", SWD-112). Every Enter adds its name
and keeps the field focused (SWD-132).

## SWD-004: Make teams
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
The first time in a new evening's setup: names are shuffled with ``shuffle(names, createRng(`${teamSeed}:${k}`))``, k = 1;
the first ⌈n/2⌉ go to the orange team and the rest to the teal team, each in shuffled order; the draw is accepted by SWD-130's
rule (otherwise k + 1, at most 10 draws). `teamSeed` is made (or read from test hook 2) on first entering Make teams for a new
evening and kept into the evening's setup. Clue givers: SWD-007. ("Play again with these teams", SWD-115, skips this draw.)
Returning to Make teams ("← Back" then "Next", or "Change teams, players, phones or board" later, SWD-112) keeps the teams: names no
longer playing are dropped; new names join the smaller team (orange if equal) at the end; a clue giver who left is replaced by
SWD-007.
Columns side by side, each (screen width − 32 − 8) / 2 px wide; names may wrap to 2 lines; the badge sits on its own line
under the name. This screen may scroll (page); the main button stays fixed.

## SWD-005: Moving a player
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Each name is a button with accessible name "Move Om to Coffee Commandos" (`aria-label`; the badge is not part of the name). A tap
moves the player to the end of the other team and shows "Om moved to Coffee Commandos · Undo". If they were their team's clue giver,
the old team's clue giver becomes the player now at the moved player's old position, else the team's first player; the
moved player is a guesser. A team left empty has no clue giver; the next player to join it becomes clue giver. "Undo"
restores teams and clue givers exactly as before that move. Only the latest move can be undone (a new toast replaces the
old one). A second tap within 500 ms of the first does nothing.

## SWD-006: Shuffle teams
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
"Shuffle teams" draws a new split with the next k (SWD-004), accepted by SWD-130's rule, at most 10 draws in all, keeping the
10th. Clue givers by SWD-007. Toast "Teams shuffled · Undo" (Undo as SWD-005). k counts every draw of the evening and is saved
(`splits`).

## SWD-007: Clue givers
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Each team's suggested clue giver is its eligible member credited with the **fewest games this evening** (won and ended early;
replaced boards don't count; a partner's games count, SWD-123); ties go to the earliest in that team's list. (Game 1: each
team's first eligible player.) A suggestion never has a partner. "Change clue givers" (Make teams) and "Swap clue givers" (game over,
SWD-112) open the Clue givers sheet: per team, the current one selected; tapping another selects it; "Done" applies; closing it
any other way changes nothing.

## SWD-008: Team minimum
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
While either team has fewer than 2 players, "Next" is disabled and "Each team needs at least 2 players." shows. Teams may
differ in size by any amount.

## SWD-009: How do you want to play?
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Three groups, each showing only its chosen option's line (the phone cards always show their own text).
**How many phones?**: three equal cards (±1 px) in this order: "One phone", "Two phones" (with the small line "Recommended"
inside the card, never the selected or main look), "Three phones"; none selected the first time on this phone, so "Start the
game" is disabled until one is tapped, with `start-hint` (SWD-119) above it (`choices.map` = `'pass'`, `'shared'`, `'own'`).
Two and three phones play the same way; they differ only in the scan screen's wording (SWD-033, 116). Cards are stacked full
width in portrait and at 568 × 320, and side by side at 812 × 375; each card's accessible name is its title, its texts linked
by `aria-describedby`. "Recommended" never changes the card's look beyond its own small line. This screen may scroll (page);
the main button stays fixed. **Board**: Full (default) / Easy; with 9 or more players `big-group-hint` (SWD-119) shows under
this group. **Landmine** (shown only while Full is chosen; Easy has no Landmine): Lose the game / Lose your turn
(`choices.landmine` = `'lose' | 'turn'`; kept when Easy is chosen); its default is SWD-119's. **Words**: Whole family (default)
/ + Harder words. A new evening starts from this phone's last-used values for all four (SWD-066), with "Same as last time" under
the heading; each saved field is read on its own (an unknown value gives that field's first-time state; "Same as last time"
shows only when all four were valid; a missing `landmine` takes SWD-119's default and counts as valid); version 2's `'pass'`
and `'own'` read unchanged. "Start the game": if the read-aloud card is due (SWD-010) it opens; otherwise it deals at once (in a
new evening, the evening is created then). Between games the choices change only through "Change teams, players, phones or board" →
Who's playing? → Make teams → this screen (SWD-112).
**Version 3.6 (owner, 22 October):** Quiet "How to play" (full width, 48 px, no tap guard) sits directly under the heading (and under "Same as last time" when shown); it opens How to play (SWD-011), whose "Done" returns to Choices with every choice as it was. Returning mounts Choices again, so "Start the game" waits its 800 ms (SWD-114).

## SWD-010: Read this aloud
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Due when no Secret Words game has been dealt yet in the current session (PLT-016); checked when "Start the game" is tapped in a
new evening. Lines: 1 "Two teams, Chai Champions and Coffee Commandos. Each has a clue giver who sees the secret map." (the evening's names) 2 "Clue givers: say
one word and a number. 'Monsoon, 2' means two of our words go with monsoon." 3 "Guessers: talk, then turn over words one at
a time. Wrong word? Your turn ends." 4 "Find all your words first. Step on the Landmine and you lose!" (Lose your turn: "Find all your words first. Step on the
Landmine and your turn ends!"; Easy: "Find all your words first!"). "Let's play" deals; "Show me the board first" deals and opens the preview board (SWD-012).

## SWD-011: How to play (detail of SWD-010)
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Menu → "How to play": h2 "Read this aloud" and its 4 lines, then h2 "The rules": 1 "Clue givers see the secret map.
Everyone else sees only the words." 2 "A clue is one word and one number. It must be about meaning, not spelling or where a
word sits." 3 "No faces, no pointing, no extra hints. Before the first guess, both clue givers decide together whether a clue is allowed." 4 "Guessers
take at least one guess, and up to the number plus one. 0 or ∞: as many as you like." 5 "Your word: keep going. Nobody's word
or the other team's: your turn ends. The Landmine: you lose!" (Lose your turn: "The Landmine: your turn ends and the other team
gets a word free."; Easy: without the Landmine sentence) 6 "First team to find all its words wins." Then h2 "Clue rules" and its
4 lines (SWD-131). Then the small line `credit`: "Secret Words uses game rules inspired by Codenames, designed by Vlaada
Chvátil. Codenames is a trademark of Czech Games Edition. Secret Words is an independent free game and is not made, sponsored or
endorsed by Czech Games Edition." (plain text, no styling; `docs/games/secret-words/legal.md`) Main "Done" returns (opened from
the dispute dialog's "Clue rules": to that dialog, SWD-124). The page may scroll. Nothing about the map appears.
**Version 3.6 (owner, 22 October):** "The rules" has 7 lines: line 7 "The host phone stays at the table: it's the board." Opened from the map phone's "Clue rules" (SWD-034), How to play opens with h2 "Clue rules" at the top of the viewport; while it is open the map is removed from the DOM; its "Done" returns to the map phone with the map hidden ("Show map"), whatever SWD-121's clock says.

## SWD-012: The preview board (detail of SWD-010)
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
After "Show me the board first": the board with every cell locked, `turn-line` "Chai Champions start" (the starting team), the
counts, and main "Start", which leads to the scan screen (two or three phones) or the pass screen (one phone). No clue line, no tips.
**Version 3.6 (owner, 22 October):** h1 "The board, before you start" (the h1 style of every Secret Words step, 1 line) above `turn-line`; in the SWD-041 budget it takes the place of the clue block (48 px), so the preview fits wherever guessing fits. The preview has `pause-button` (SWD-110).

## SWD-013: Funny team names (owner, 4 October, K25)
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Each evening the two teams get a random pair from `team-names.csv` (20 pairs, column `id` e.g. `SWDT-01`; the first name goes to
the orange team, the second to the teal team). The pair is drawn on first entering Make teams for a new evening:
``createRng(`${teamSeed}:names:${m}`)``, m = 1, picking uniformly among the pairs not used by the 3 most recently started other
Secret Words evenings on this phone (all 20 if fewer than 4 remain). Quiet **"New team names"** on Make teams draws again with
the next m, never giving the pair on screen, with the toast "New team names · Undo" (Undo restores the previous pair). The
names are fixed from the evening's first deal: later "Change teams, players, phones or board" shows them without "New team names".
"Play again with these teams" (SWD-115) reuses the previous game night's pair instead of drawing, without "New team names".
Every name is a plural phrase of at most 18 characters, so headings read "Chai Champions win!", and screens never use a
possessive ("Chai Champions's"). Names are content: English or known everywhere (K24), kind to everyone (never about a region,
religion, caste, gender or body). `team-names.csv` changes like the word list: by edition (SWD-023); a saved evening keeps
its names as text, with the pair id.

## SWD-014: Doesn't give clues (P7)
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
In the Clue givers sheet each player row has the name button and, on its own line under it, a switch "Doesn't give clues" (`role="switch"`,
`aria-checked`, accessible name "Riya: doesn't give clues"), off by default; the sheet scrolls inside. Changes apply on "Done", like the
rest of the sheet. A player with it on is not **eligible**: never suggested by SWD-007 (and so not by SWD-006), never a partner
(SWD-123), never chosen by SWD-005 or SWD-127 (each picks the next eligible player in list order, wrapping to the first), and
their name button is disabled. Turning it on for the current clue giver makes the next eligible player the clue giver. A team's
last eligible player's switch is disabled, with "Each team needs someone who can give clues." under that team's group. If a move
or shuffle on Make teams leaves a team with no eligible player, Make teams shows the same message and "Next" is disabled. Make
teams shows the small line "Doesn't give clues" (`guess-only-tag`) under such names. In "Players" (SWD-127), "Remove" is disabled
for a team's last eligible player; added players start with the switch as set when added. Kept in `teams.guessOnly` (recorded
with `setTeams`, or `setPlayers` for players added in a game), carried by name into a new evening from the latest Secret Words
evening of the same session. The Clue givers sheet opens from Make teams ("Change clue givers") and from game over ("Swap clue givers",
SWD-112), nowhere else.
