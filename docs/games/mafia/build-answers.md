# Mafia: answers for the build, ready in advance (product owner, 25 October 2026)

For the tester writing `specs/mafia/` and the C3 tests, and for the coder lanes after them. Binding text is still
`scenarios.md` version 1.1 (with its "Version 1.1" items). These items only **clarify** it where a reader is likely to stop;
they are the "Version 1.2" clarifications the handover asks the product-owner helper to record, and they will be copied into
`scenarios.md` Version 1.2 with the persona-walk findings. Each item: scenario, question, answer, source. Anything that
would change a rule, a role power or who wins is in **"For the owner"** at the end and is built as approved until answered.

**Open test questions (docs/test-questions.md, pulled 25 October):** none for Mafia on `main` or on any pushed lane branch.

Precedence: Version 1.1 items > the scenario's own text > the Canonical strings table > `text.csv` > `screen-map.md`
draft 4. Every on-screen string comes from `text.csv` (keys `mf.*`), plus the few shared strings named below.

## A. Conflicts between scenario text and Version 1.1

1. **MAF-022 vs 1.1 item 6: names visible on N2 at 320 × 568.** Q: "at least 8 names without scrolling" or "3 rows (6
   names)"? A: **1.1 item 6 wins: 3 rows, 6 names**, more scroll inside the names box; landscape at least 4 rows (8 names).
2. **MAF-025 vs 1.1 item 4: Police with nobody left to check.** Q: MAF-025 lists only the checked players; item 4 says every
   role lists everyone dealt and not leaving. A: **item 4 wins**: the box lists everyone dealt this game who hasn't left, all
   greyed: the Police "you", checked players with their answer, out players "out" (plus their answer if checked, item 8).
3. **MAF-011 vs 1.1 item 20: card lines.** A: every role card = the role word, **2 text lines, then 1 empty line** (item 20),
   not "3 lines". Mafia line 1 = the partner line, line 2 "At night, you pick who goes out. By day, act like a Villager.";
   Doctor, Police, Villager lines as `text.csv` (`mf.b2-doctor.2–3` etc.).
4. **MAF-005 vs screen map S3: when the deal is made.** A: the scenario wins: "Give everyone a role" records `start` and
   deals; S3's "← Back" removes `start`. Going back and forward deals the **same** roles again (same seed, same k); nobody
   has seen them, so this is fine.
5. **Menu "Home".** A: "Home (game is saved)" (Canonical strings, `mf.menu.7`), not the map's "Home (keep this game)".
6. **Screen map D2's line "New players join the next game."** Q: build it? A: no: it is in neither the scenarios nor
   `text.csv` (MAF-083: no other strings). The per-name tag "Imran · joins next game" says it.

## B. The night job, same for every role (C3 in look: MAF-P7)

7. **1.1 items 5–6: job and result lines that need 3 lines.** Q: item 5 fixes both boxes at 2 lines, but at 320 px (and with
   Larger text or 16-character names) some texts need 3 or more: the Villager's job line, the later Mafia's job line, the
   Mafia's "Om. If the Mafia's picks differ, …" result. A: **sameness wins (P7, a privacy rule).** Both boxes have one fixed
   height for every role on a given N2: the height of the longest variant of that box, for this game's longest name, at the
   current width and text size (2 lines is the minimum). Text is top-aligned. The names box takes what is left and scrolls
   inside itself. Tests check equal sizes across roles (±1 px) and a minimum of 2 lines, not 41 px exactly.
8. **Name buttons and tags.** Q: how does a tag sit, and what is the Doctor's own button? A: each name button is 56 px tall
   with the name and, under it inside the button, at most one small tag line (the Police's answer may follow "out" on the same
   tag line: "out · Mafia"). The Doctor's own button reads "Meena" with the tag "(you) · once a game" (`mf.n2-doctor.2`) while
   self-protect is unused; once used, greyed with "used". Tags are not in the accessible name (item 4).
9. **Which tag wins when two apply.** A: "you" first; then "out"; then the role's own reason ("used" > "protected last night";
   a Mafia's partner "Mafia"). A Mafia partner who is out shows "out" only (their role is already public).
10. **The pad after hiding.** Q: after "Tap to hide", does the pad stay 48 px? A: no: it returns to the 120 px "Tap to see your
    night job"; the job line, names and result are emptied (not in the DOM), same for every role. The 4000 ms keep counting.
11. **The main button's guard after a hide.** A: each time the main button appears (after the 4000 ms and a pick, and again
    after every re-show), its 800 ms guard starts again, for every role, so a "Tap to see" never lands on "Done".
12. **1.1 item 9: a later Mafia when the previous Mafia left mid-night.** A: the leaver's pick still counts (item 11), so the
    next Mafia sees it as "the latest Mafia pick so far tonight", named.
13. **Seat order for the night order.** Q: the starting seat's player has left. A: start at the next seat in order whose
    player hasn't left (out players included: they take a ghost guess). n = players dealt this game, so a leave during the deal
    (item 12) removes the seat, and a mid-game leaver's seat is skipped.
14. **Private screens and toasts.** Q: an undo toast is showing when "I'm Meena" is tapped. A: opening B2 or N2 closes any
    toast (no undo after it); private screens never show a toast.

## C. Leaving (1.1 items 11–14)

15. **A night leaver who was already the Mafia's pick.** Q: the Mafia picked Kabir earlier tonight, then Kabir leaves. A: item
    11 says a night leaver is "not a target" from the moment of leaving, so **Mafia picks naming him are dropped** from `picks`
    before MAF-027 step 1. If other Mafia picks remain, the target comes from them; if none remain, nobody is out and the
    morning reads the fixed line "A quiet night. Nobody is out!" (as "no Mafia made a pick", MAF-037). A Doctor's protection
    of him protects nobody. "What happened each night" still lists what was picked, then "· Kabir left". This keeps MF10 (a
    leaver's role is never shown before game over). Source: 1.1 item 11; MAF-027; MAF-037.
16. **A leave during the deal (item 12): Undo.** A: the toast "Kabir left · Undo" shows on the new "Player 1 of N"; Undo records
    `unleave` and deals again **with** Kabir (next `:dN` seed), back to "Player 1 of N", so nobody keeps a role they may have
    seen. The Mafia count: kept unless MAF-003's limits for the new N forbid it, then the suggestion S (as MAF-061).
17. **Players dialog mid-game, what it lists.** A: seat order; players who are in with ✕; out players without ✕ as the Day
    rows ("Kabir · Villager · out night 1"); leavers "Neha · left"; additions "Imran · joins next game"; the add row and "Done"
    as Impostor's Players sheet (IMP-079 strings "Player name", "Add", "Done").
18. **MAF-041, the leaver line with two leavers.** A: when leaves decide the game, every player whose leave applied in that
    step is named: "Kabir had to leave." / "Kabir and Om had to leave."
19. **Day leave that ends the game (item 13), toast on G1.** As written; Undo returns to the screen before with the leave
    removed and the game going on.

## D. Day, vote and results

20. **Capitals.** Q: "KABIR is out.", "RIYA", "Arjun's pick: KABIR": capitals in the DOM? A: **no: CSS `text-transform` only**;
    the DOM text is as typed ("Kabir is out."), tests match names case-insensitively. Source: the Names term, shared with
    Impostor (Impostor's Terms: "a name written in CAPITALS (RIYA) is shown upper case with CSS only"). Story names
    (`{NAME}`) are as typed.
21. **MAF-031, Day list order.** A: "Who's still in" in seat order; then out players in the order they went out; then leavers
    in the order they left.
22. **MAF-031, the timer between screens.** A: it keeps counting on V1 (item 23), ends when V2 opens, and is not saved. On a
    hide (no Paused cover) it keeps counting by the wall clock; only the Paused cover stops it.
23. **V3, the re-vote picker.** Q: what is on it? A: h1 "Who got the most fingers?", only the tied players (seat order),
    "Not sure?" with "Still a tie" and "Count again" (no "It's a tie", no "Nobody today", item 24), main "Vote out" / "Vote Kabir
    out". **No "← Back to talking"** (the `tie` is recorded; MF6 allows one re-vote only); Home and End stay in the menu, as V2.
24. **V2t with three tied.** A: main "Point again: Kabir, Om or Riya" (seat order); countdown heading "Point only at Kabir, Om
    or Riya".
25. **MAF-092, the "Back after a break?" line.** Q: M1 and Y1 already have "See my role again"; add a second one? A: no: the line
    shows directly above the existing quiet "See my role again"; it goes when the screen is left.
26. **MAF-053, the G1 menu.** A: How to play, Players, Pause, Home (game is saved), End for tonight, Settings, History. No "End
    the game" (the game is over). Settings = the app's Settings sheet.
27. **MAF-063, what End for tonight records.** A: as SWD-060: nothing at the dialog; `endGame` (if mid-game, no winner) and
    `endEvening` are recorded when G2 is left ("← Home", "Play something else", a reload, the app hidden, or 12 hours).
    "Oops, keep playing" returns as it was until then; after a reload or hide G2 shows without it.
28. **MAF-064, G2 with no winner tonight.** A: the "Village 2 · Mafia 1" line is left out until a game tonight has a winner
    (as G1's tally). "1 game", "1 player".
29. **MAF-062, plurals.** "Best Mafia spotter" needs at least 2 nights, so "nights" is always plural.
30. **MAF-090, Home row line 1.** A: "Mafia · " + the where-line of the screen it resumes at (e.g. "Mafia · Dealing roles ·
    Riya's turn with the phone", "Mafia · Day 2 · after the vote"). Line 2: the first two players dealt this game who haven't
    left, in seat order, "+n" for the rest (out players counted), tonight's first `start` time, "Tap to resume".
31. **MAF-093, History time.** A: each game's own `start` time; "1 night" / "3 nights".
32. **MAF-010, the role seed.** A: `seeds.roles` made fresh with `crypto.getRandomValues` at tonight's first `start`, saved
    with the game night; later games use k. Browser seeds and deals (item 33) in development and preview builds only (IMP-064).
33. **MAF-003, Villagers line.** Q: plural for 1? A: never needed: the limits keep V ≥ 2 ("Villagers: 2" at N = 6, M = 2).
    Worked limits check out against the formula (N 5, 6, 9, 16).

## E. Shared screens and other games

34. **MAF-001, the picker and Home.** The Mafia card and the Host line live in the shared Home and picker files that What Am I?
    also changes: build them in the same lane as What Am I?'s picker work, or after it merges. Until Mafia is released, the
    release build must not show the Mafia card (release What Am I? from a release branch, or keep the card out of release
    builds); the preview may show it.
35. **Invisible guards in tests.** A tap inside a guard must really land: `click({ force: true })` or a dispatched click (as
    the Secret Words tests, test-questions 23 October). N2's main is hidden, not greyed, until its conditions are met.

## Suggested screen lanes (for the orchestrator)
Refines the handover's suggestion so files shared by two changes stay together (the deal and night pass screens are one
component; the menu, Pause cover and dialogs appear on screens of every lane).
- **Lane M1, rules (C3, first, alone):** `src/games/mafia/` (deal, streaks, redeal, night order, night resolution with
  leaves, winner check, stories pick, results and fun lines, tonight, saved data, `viewFor`), `content/mafia/stories.json`,
  hooks H2, H3, H5, H6. Screen lanes start after it merges.
- **Lane M2, setup and the room frame (small, merge first):** S1–S4, "··· Menu", Pause and the Paused cover, the where-line
  and "Welcome back.", Players and leave dialogs (all three bodies), End the game, End for tonight, Deal again dialog. The
  picker card and Host line only if What Am I?'s picker lane has merged (item 34).
- **Lane M3, private screens (C3 in look, reviewer checks every role's N2 is the same frame):** B1, B2 (role card, First
  time lines), D5 "Whose role?" (reuses B1/B2), N0, N1, N2, N3.
- **Lane M4, day and results:** M1 (stories, role and count lines, MAF-092 line), Y1 with the timer, V1, V2, V2t, V3, V3s,
  V4, "Nobody out today?", G1, G2, History rows.
Order: M1 → M2 → M3 and M4 in parallel. What Am I? lanes come first when slots are short (it releases first).

## Parked for Version 1.2 (not to build now; no scope growth mid-batch)
- A guest who taps "Join a game" sees no line for Mafia (What Am I? has "… is played on the host's phone"). A matching line
  for Mafia goes to Version 1.2 with the persona-walk findings.

## For the owner
1. **The Police could see two answers in one night.** Today the check is recorded only on "Done"; the approved text says a
   Back, a reload or hiding the app loses the pick. So a Police who taps a name, sees the answer, then hides the app, could
   come back and check a second person. Options: (a) keep it as approved: it needs deliberate cheating, like peeking, which
   MF15 already handles with "carry on" (convention: human-moderated games can't stop a cheat either); (b) the first name
   tapped is saved at once, so after a reload the Police sees that same answer again and can't pick another (closes the gap;
   a small rules change, C3). Recommendation: (b), basis "ours" (no convention covers app reloads); built as (a) until you say.
