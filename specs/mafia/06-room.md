# 06-room.md: The room and the host (C2)

Copied from `docs/games/mafia/scenarios.md` (version 1.1, approved by the owner 25 October 2026, decision MF18), the binding contract. Each scenario's paragraph headed "Version 1.1" is that file's two-reader item, copied word for word; it wins over the text above it. Terms, canonical strings, screen IDs, properties and test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md). Paragraphs headed "Version 1.2 (owner, 25 October)" are the owner's privacy changes of 25 October ("do all as recommended"); they win over Version 1.1 and the text above them.

## MAF-050: Pause
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
A Pause icon button (accessible name "Pause") beside "··· Menu" on every room screen of a game (B1, N0, N1, N3, M1, Y1, V2–V4)
opens the Paused cover: "Paused", the where-line, "Tap Carry on when everyone's back.", main "Carry on" → the same screen (the day
timer paused and resumed; guards not restarted). Not on private screens or the countdown.

**Version 1.1** (item 2): **Countdown (V1)** has no menu and no Pause; a leave can't start there. MAF-052's "by day" list is **M1, Y1, V2, V2t, V3, V3s, V4**. MAF-050's Pause list is B1, N0, N1, N3, M1, Y1, V2, V2t, V3, V3s, V4 and G1.

## MAF-051: Someone arrives
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
Menu "Players" (dialog, as IMP-079) adds a name mid-game: it joins **the next game** (roles are dealt), shown in the dialog as
"Imran · joins next game"; records `addNext { name }`. Between games (G1) "Change players or roles" adds them at once (MAF-061).

## MAF-052: Someone has to leave
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
In the Players dialog, ✕ beside a player who is in opens "Kabir has to leave?" with the day or night body (Canonical strings).
"Kabir leaves" records `leave { player }` and shows the toast "Kabir left · Undo" (10 s; Undo removes the `leave`, nothing else
changed). **By day** (M1, Y1, V1–V4) the leave applies at once: Kabir is greyed in the Day list as "Kabir · left", is not
offered in the picker, and MAF-040 runs. **At night** (N0–N3) it applies after the night resolves (MAF-027 step 4); Kabir's
night turn, if not yet taken, is skipped; a pick already made counts. Players who are out can't leave the game (✕ hidden; they
just stop playing). "Don't remove Kabir" (main) → the dialog. Property: a leave never shows the leaver's role before game over.

**Version 1.1** (item 2): **Countdown (V1)** has no menu and no Pause; a leave can't start there. MAF-052's "by day" list is **M1, Y1, V2, V2t, V3, V3s, V4**. MAF-050's Pause list is B1, N0, N1, N3, M1, Y1, V2, V2t, V3, V3s, V4 and G1.

**Version 1.1** (item 11): **A night leave takes the player out of tonight at once (owner):** from the moment "Kabir leaves" is tapped at night, Kabir is not in any names box tonight (not a target, not protected, not checked), his turn if not yet taken is skipped, a pick he made still counts, and the leave applies at MAF-027 step 4. So a leaver's role is never shown before game over (MF10) and a leave can't be used to dodge a target already resolved. A leave on N3 applies when "Read the morning" is tapped.

**Version 1.1** (item 12): **A leave during the deal (owner):** on B1 (before night 1's "Start the night") the dialog body reads "Kabir leaves. Everyone gets a new role without Kabir." and "Kabir leaves" records `leave` then `redeal` (MAF-014; N must stay ≥ 5, else the leave is refused with "Mafia needs at least 5 players." and "OK"). On N0 of night 1, as a night leave.

**Version 1.1** (item 13): **A day leave that ends the game** closes the dialog and opens G1 at once; the toast "Kabir left · Undo" shows on G1 and Undo returns to the screen before with the leave removed. Any later recorded move closes an undo toast; a night leave's Undo works only until MAF-027 runs.

**Version 1.1** (item 14): A tied player who leaves before the re-vote is dropped from V3; if one tied player is left, V3 shows that name alone.

## MAF-053: The menu at each moment
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"··· Menu" (accessible name "Menu") on room screens only. Items in the Canonical strings' order, only those that apply: How to play
(all) · Players (all) · See my role again (M1, Y1) · Deal again (B1, N0 of night 1) · Pause (all) · Home (game is saved) (all) ·
End the game (all) · End for tonight (all) · Settings (G1) · History (G1). No menu on B2, N2 or the countdown.

## MAF-054: End the game
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"End the game" (menu, M1, V4) → dialog (Canonical strings) → "End the game" records `endGame` → G1 "Game ended. No winner." with
the toast "Game ended · Undo" (10 s; Undo removes `endGame` and returns to the screen it came from). "Keep playing" (main) →
back.

**Version 1.2 (owner, 25 October)** (privacy change B, C3): **no role while the Undo toast is up.** While the toast "Game ended · Undo" is showing, G1 shows h1 "Game ended. No winner." but **no h2 "Who was who", no player's role anywhere** (text, accessible names, live regions), no "What happened each night" and no fun lines (MAF-062). Roles show only once the toast has gone: another move, its 10 s timeout, or a screen change (including a reload or the app hidden), i.e. once the Undo chance has ended. Undo returns to the screen it came from with no role ever shown.

## MAF-055: Home and the phone resting
Status: approved, owner, 2026-10-25 (version 1.1, MF18)
Phase: Mafia 1
"← Home" and "Home (game is saved)" open Home with the game night unfinished (MAF-091). From a night screen they are in the menu
only (N0, N1, N3); from a private screen there is no way to Home except hiding the app.
