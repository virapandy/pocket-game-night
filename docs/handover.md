# Handover: start here

## Now: status and what's next (product owner, updated 3 October 2026: speed first)
A new orchestrator session starts here: read this section, then work through **"Next, in order"** from the
top, reporting to the owner after each. The product owner keeps this section
current; instructions live here, not in chat. History from Phase 0 and 1a is further down.

### C1 now (owner, 4 October, P11): Home says "Join a game"
Home's second card: title **"Join a game"**, line **"Tambola ticket from the host"** (replaces "Join with my ticket" / "Got a QR
or code from the host?"); the Join screen's heading reads "Join a game". When Secret Words ships the line becomes "Tambola ticket
or Secret Words map from the host" (SWD-002). Update any test that matches the old wording. C1: one commit, screenshot approval.

### Owner's answers on the overnight checks (4 October, run 37143638539): do these
1. **TAM-112 (go):** the Android emulator lost the last calls when Android closed Chrome mid-game (42 shown instead of 69).
   The tester confirms it with that one test on GitHub (not on the owner's Mac), **between Impostor rounds** when the Test
   clone is free; then a coder fixes it (likely: save every call at once, not in batches). C3 (saved data): test first.
2. **Mutation testing (yes):** a coder splits the weekly full mutation run into smaller parallel jobs, each under GitHub's
   5-hour limit. Automation only; nothing changes for families.
3. **Impostor tests (ok):** remind the Impostor chat to mark its tests for unbuilt features "expected to fail" (decision of
   3 October) so quick verify on `main` goes green again and the preview link updates. Red since about 20:00 on IMP-052,
   IMP-075, IMP-088; Tambola is not failing.

### SPEED FIRST (owner, 3 October): read before anything else
The owner: the loop has run for days on simple changes; progress must be much faster. No app change has landed since
1 October afternoon. **New way of working: `docs/change-sop.md`** (owner approved). In short: sort every change into
C0 Docs, C1 Look, C2 Screen behaviour or C3 Core; only C3 gets tests first; quick verify (~3 min) on every push; the
complete test only before a release; up to 3 coders in parallel, each on its own area.

**Do now, in this order:**
1. **Set up (one short round, coder and tester in parallel):** coder splits automation into quick verify on push
   (publishes the preview) and the complete run on release and nightly (publishes the families' link); proposes the
   rule edits for parallel coders in worktrees for the owner's one-time OK. Tester tags the smoke set and writes the
   map from app area to browser test files. Until parallel coders are approved, one coder does lanes A, B, C in turn.
   Also in setup (SOP "Added 3 October"): screenshot comparison with reference pictures for the screens in rows 1–25
   (tester); per-copy ports (coder); the read-only AI reviewer helper (coder, with its role in the guard); the
   "Quarantined" section in the report (tester).
2. **Build UX rows 1–25 (2b below) in three parallel lanes, no tests first** (the tester updates broken tests and
   writes C2 tests alongside):
   | Lane | Area | Rows (class) |
   |---|---|---|
   | A | Player's phone: tickets, cue, claim | 1 (C1), 2 (C1), 3 (C1), 12 (C2), 13 (C1), 17 (C1), 19 player parts (C1) |
   | B | Host: calling, claims, payouts, settings, summary | 4 (C2), 5 (C1/C2), 14 (C1), 16 (C1), 18 (C1), 22 (C2), 24 (C2), 25 (C1), 19 host parts (C1) |
   | C | Host: setup and hand-out | 7 (C2), 8 (C2), 9 (C2), 10 (C1), 11 (C1) |
3. **C3 rows, tests first, at the same time as step 2:** tester writes tests for 6, 20, 21 and 23 (row 15 already
   has TAM-214); then one coder builds 6, 15, 20, 21, 23 as one batch after lanes A–C are merged.
4. **Release:** freeze `main` as the release candidate; complete run once; UX designer re-check of rows 1–25; release
   notes; owner tries it, then the families' link. Each row is its own commit and passes the AI reviewer before merge.
- **Paused until rows 1–25 are released:** new UX rows and reviews (product owner), mutation, emulator, simulation and
  Jev work (weekly unattended run only). Exception: the C3 batch (step 3) gets mutation **only on the rules and money
  lines it changed** (owner, 3 October); setting that up is part of the tester's setup round.
- C1/C2 questions don't stop work (pick by the UX guidelines, note it); C3 questions go to the owner in one list.
- Stuck after 3 rounds or half a day: tell the owner. One progress line at the top of `reports/latest.md` per step.

### Release gate rc-1.2.0 (Tambola 1.2.0, branch release/1.2): product owner with UX designer, 3 October
**Verdict: GO** (`docs/games/tambola/ux-review-2026-10-03-release-1.2.0.md`), from Screenshots run 37119724773.
Fixed in the pictures: point a, point b, N3, N4, N5, nothing under the rhyme before the first call, payouts and prizes at
360, landscape "Which prize?" and claim QR. Not in the pictures, so for the owner's try-out: N1 (paper winner by name,
also while a won prize waits) and the thin "Screen may sleep" line after "Got it". The empty-looking Called · Undo
bar is the test's see-through countdown, not a fault. Next list (not blocking): the first-run screen tip pushing the
number off at 360 with a verdict; payout buttons stacking when a wider font cuts "Settle with players" at 390; small
polish. **Tester:** add pictures of the thin sleep line after "Got it" and of N1's name list.

### Release review of rc-2026-10-03b (1.1.0): product owner with UX designer, 3 October
**Verdict: GO, after one small text fix** (`docs/games/tambola/ux-review-2026-10-03-release-1.1.0.md`).
- **Fix before release (C1, one line):** in a phone-ticket game, after a recorded win, "Add another winner" with a
  paper ticket number currently says to use "Record a win", which is hidden until the prize is closed. New message:
  "Ticket 4 plays on paper. To add a paper winner: tap Undo win, then Record a win and pick both names." Refreeze,
  complete run, then the owner's try-out.
- **Rows 1–25:** 20 done; 1, 6, 15, 16 partly (accepted for 1.1.0, listed below); 23 not confirmed: **tester**, please
  confirm the "Your tickets from game … were cleared" line and the old-game claim note.
- **Screenshots:** 16 of 19 approved; host-verdict-proof, player-tickets-cue and player-quick-mark flagged as
  next-list items, not blockers. Please record these verdicts in the report's table.
- **Open point a (cue line "…" + More):** accepted for 1.1.0; next: two lines, shorter wording.
- **Open point b (verdict card scrolls on small phones):** accepted for 1.1.0; next: pin "Undo claim" and "Done".
- **Next UX list, after the release** (details in the review doc): N1 full fix ("Add another winner" offers names);
  cue line two lines; verdict buttons pinned; "Screen may sleep" badge out of the header; Quick mark landscape keys and ✓
  in the corner; "Has Zoya got their ticket?" wording; polish (empty "Last", prizes step and payouts at 360, landscape
  "Which prize?" and claim QR "Done", lighter Called/Undo bar).

### Impostor round 4 (owner approved 4 October): do this next, before any Impostor release
After the owner's play and the UX designer's review of the first build. **Binding: `docs/games/impostor/scenarios.md`
v3.5** (passed the coder and tester reads per `docs/spec-rules.md`); every changed scenario is marked
"2026-10-04". In plain words:
1. **The round ends on one result screen** right after "Reveal <name>": "✓ Caught!" or "✗ Escaped!", who the impostor
   was, the word and its category, then "Next round". The last guess becomes an optional setting, off by default.
2. **How to play only on request** (button on the choices screen and in the menu); its text follows the settings.
3. **Pass the phone:** "Player 2 of 4", "Everyone else, look away!", a full-width pad that reads "Let go to hide",
   nothing moves after the first hold, "New word for everyone?" confirmation.
4. **UX fixes F1–F12** (`ux.md`, last section): result and summary screens that scroll as one page on small phones or with Larger text (no inner scroll areas; scenarios win), room-sized reveal, landscape
   layouts, clue wording, tie buttons, summary winner line, "1 more minute", polish. Guidelines 45a and 46a.
5. **C3, word list and saved evenings:** rebuild `content/impostor/words.json` from `docs/games/impostor/words.csv`
   (311 rows: 291 active, 20 `retired`; new category names "Sports and games", "Out and about", "Everyday moments");
   each deal records its word id and draws from per-deal seeds; old evenings without `lastGuess` read as on; evenings
   from earlier preview builds that don't replay are hidden; regenerate the format fixture with word ids.
Classes: 5 is C3 (tests first, mutation on the changed rules lines); 1–3 are C2; 4 is C1/C2. Tester first copies the
changed scenarios into `specs/impostor/` and lists the tests to update or retire (the tester read of 4 October already
names them by file). Lanes: A deal and privacy; B result, summary, picker, timer; C setup, choices, how to play;
C3 in its own lane. Then quick verify, the owner tries the preview, then "release Impostor".

### Impostor round 5 (owner approved 4 October, I25 and I26): before the 1.3.0 release candidate
**Hold the release-candidate freeze until this round is green.** Binding: `docs/games/impostor/scenarios.md` **v3.8**
(passed the coder and tester reads; every changed scenario marked "2026-10-04 (changed)", new IMP-077, IMP-078,
IMP-079). Plain words, from the owner's own play, four player runs and the UX "What next?" pass
(`docs/room-moments.md`):
1. **Between rounds:** "Next round" with a visible "End game" beside it and "← Home" (game saved); "Players (5) ›"
   visible on the result.
2. **Words:** "game" everywhere (never "evening", "night", "session", "crew", "steal"); "You caught the impostor!",
   "Arjun wins the round!", "Clues done, start timer", "Done, back to clues".
3. **End screen:** "That's the game!", main "Play again", then "Play something else", "Home", "More ›".
4. **People coming and going:** add someone mid-round ("Joining next round: Zoya"); someone leaving mid-round gets
   "Finish this round first" (main) or "Deal again without Kabir" (one new move `dealAgainWithout`, never revealing
   roles); "3 players needed." when it would drop below 3; fast Enter keeps every name.
5. **Breaks and mistakes:** "Home (game is saved)" mid-round; resume rows with names; "Not Riya? ← Back"; a 500 ms
   double-tap guard on buttons (not the hold pad); "See my word again" visible on clues and talk; settings kept on
   Back; "Start new?" asked once with equal buttons; tie heading "Tap everyone who is tied" with "Not a tie";
   "Tap instead" away from "Done"; test seeds that don't fit the players are ignored.
6. Already in the must-fix list: headline 44 px below 390 px; announcer emptied at each deal (I24).
Classes: the moves (`dealAgainWithout`, mid-round adds, `leaveAfterRound`) are C3, tests first; the rest C1/C2.
The tester read of 4 October lists every test file and line to change or retire, and the new tests. Then quick verify,
a **player run** of the changed flows (`docs/proposals/player-agent.md`, one at a time from cleared app data), then
the freeze.

### Impostor round 4 review (product owner with the UX designer, 4 October)
Built as scenarios v3.5 say; F1–F12 done except F2 at 320 px. **Must fix before release (joins this round):** N1 — `result-headline` 44 px, one line, below **390** px wide
(IMP-073); and from Jev's flags (I24): "Go round again" in the bottom bar above the main button with "Not enough
clues?" (IMP-022), and the announcer emptied when a new deal starts (IMP-083 / canonical strings). **Next list** (after the Impostor release, not this
round): N2–N6 in `docs/games/impostor/ux.md` ("Re-check of round 4"). Jev's 13 confusing-screen flags: send them to the
product owner with screenshots once sorted.

### Impostor build, product owner answers (4 October)
All open Impostor questions in `docs/test-questions.md` are answered in `docs/decisions.md` I21 and written into
`docs/games/impostor/scenarios.md` (IMP-075, IMP-091, IMP-073 `pass-name`, IMP-102). **No app change needed:** the
build already does all of it. Tester: copy the changed scenario lines into `specs/impostor/` and remove the IMP-075
mark (the "left halfway" menu as built is now the spec). Then Impostor waits for the owner's "release Impostor".

### Secret Words, the third game: START WHEN RELEASE CANDIDATE 1.3.0 IS FROZEN (owner, 4 October)
**Scenarios version 3.2 (SWD-001 to SWD-104) approved by the owner on 4 October; version 3.4 (adds section 07 Sessions and
behaviour, SWD-110 to 133, plain wording, decisions K32–K41; two reader checks and a final pass done) waits for the owner's approval.** If the freeze comes before 3.4
is approved, the tester starts with the parts 3.4 doesn't touch (02 deal and map code, SWD-099 word list) and waits for 3.4 for
the rest, after two two-reader checks and a final
check pass; SWD-200+ are direction only. Design in `docs/games/secret-words/`: `scenarios.md` (binding), guide, ux, lifecycle,
play-modes, legal, `words.csv` (452 words) and `team-names.csv` (both owner-approved, K27). Decisions K1–K30 and P1–P11 in
`docs/decisions.md`.
**Start** as soon as Impostor's release candidate 1.3.0 is frozen on its release branch (do not wait for "release Impostor");
release work stays on the release branch, Secret Words goes on `main`, as decided on 3 October.
1. **Tester:** copy the scenarios into `specs/secret-words/` (file names in each section heading); request a QR decoder for
   tests (hook 5); write tests first for the C3 parts: 02 deal (incl. the golden boards of SWD-022 and SWD-027/039 properties),
   04 rules, 05, 06, SWD-099, SWD-101; mark tests for unbuilt features "expected to fail" so quick verify stays green.
2. **Coder:** build by `docs/change-sop.md`: the rules and map code (C3) in their own lane; screens in lanes (setup and Home
   "Join a game"; the map screens and map phone; clue and board). Each lane through the AI reviewer before merge.
3. **Product owner and UX designer** review the preview at phone sizes; the owner tries it, ideally with a family game.
4. Never let Secret Words work delay the Impostor release: release-branch fixes come first.

### Queued: Impostor, the next game (product owner, 3 October): start only after the Tambola release
Design done (owner-approved direction; scenarios await the owner's approval): `docs/games/impostor/` (guide,
lifecycle, **ux.md** every screen, words.csv 309 words, scenarios.md: IMP-001 to IMP-096 **approved by the owner 3 October**, IMP-100 to IMP-108 after the game approved too,
IMP-200+ later), decisions I1–I20, guidelines 45–48. **scenarios.md v2.2 is the binding contract** (exact strings, sizes, timings, test hooks; passed
two independent coder and tester reads per `docs/spec-rules.md`): build and test exactly what it says; anything still
unclear goes back to the product owner before a build, never guessed. When Tambola is released:
1. Tester: copy `scenarios.md` into `specs/impostor/` (file per heading), status as approved by the owner; write tests
   first for the C3 parts (rules, secrets and seeds, scoring, words list format, saved evenings: IMP-010–017,
   020–021, 025, 031–037, 040–043, 050–054, 060–063, 090–096); C1/C2 screen tests alongside the build.
2. Coder: the game slice `src/games/impostor/` on the existing contract (no engine change expected); the word list
   from `docs/games/impostor/words.csv` into `content/impostor/` (like the rhymes); "What shall we play?" after
   "Host a game". Lanes: A deal and privacy, B talk/vote/reveal/result, C setup, menu and end; C3 parts in one lane.
3. Release as usual; then the paper or first-build play-test questions in `ux.md`.

### Status (2 October, product owner with the UX designer, on app 5c5030d)
| Item | State |
|---|---|
| Tester's report on 5c5030d, automation run 36852157933 | GREEN; live preview up to date (app 1.0.0) |
| UX list rows 1–7 | Rows 1, 2, 3, 5, 6, 7 **done**; rows 1a and 4 **partly** (remainders are rows 1 and 5 below) |
| Full UX review under the playbook | **Done** (2 October): `docs/games/tambola/ux-review-2026-10-02-full.md`; merged into the list below |
| Tester's six questions (report on 5c5030d) and the coder's question on red marks | **Answered** in step 3 |
| UX designer helper | Installed (`.claude/agents/ux-designer.md`) |
| Extended testing | Continues |
| Phase 6 (connected mode), new games | On hold |

### Next, in order (for the orchestrator)
0. ~~Make automation green and publish~~ **done** (1 October). Keep the rule: **a test report is GREEN only if the
   automation run for that commit is green too**; the report names that run.
1. ~~Product owner review of Phase 2 and Phase 7~~ **done.** Works as specified: hand-out ("Ticket 1 → Riya (1 of 2)",
   QR, 20-character code, "0 of 4 handed out", who's waiting, paper fallback); a valid ticket on the player's
   phone; both tickets together with no scrolling and "One at a time"; quick mark ("✓ 54 marked on ticket 1",
   "11: not on your tickets", thumbnails with filled cells); the claim screen (big QR, top row outlined);
   crossing out prizes; Larger text; the host's "Scan a claim" falling back to the ticket number when there is no
   camera, with only this game's prizes; "Top Line: ✗ Bogey: 12, 22, 30, 40, 80 not called", credited to Riya,
   ticket out; "Ticket 1 is out" refused calmly; "Report a problem" on host and player, with the preview of what is
   sent, held until the game ends, kept on the phone.
2. ~~Small fixes~~ **done** (app version 1.0.0, PLT-200; the called number stays bright while dimmed, TAM-198).
2b. **UX fixes: one consolidated list** (product owner with the UX designer; process in `docs/ux-evaluation-playbook.md`).
   This is the **only** UX list; each review is merged into it in priority order and finished rows are removed. Details:
   `docs/games/tambola/ux-review-2026-10-01-several-tickets.md` (S), `…-2026-10-01-action-hierarchy.md` (H),
   `…-2026-10-02-full.md` (F). Rows 1–7 of 1 October are done. Ask the tester to write or update the scenarios named,
   then run the loop from the top. Severity: 4 blocks play, 3 a core task falters, 2 slower, 1 polish.

   | # | Sev | Change | Scenarios | From |
   |---|---|---|---|---|
   | 1 | 3 | Cue line, rest of old row 1a: at 360 × 640 with Larger text and 3 tickets, "One at a time", "Quick mark" and "Show claim" stay on screen (hide "Listen to the anchor…" while the cue shows); in landscape the line is never cut off; at 812 × 375 with 3 tickets and Larger text all three tickets fit with no scrolling. The line names the prizes in prize order: "Ticket 1: Early Five and Top Line filled. Shout if it's right!", "More" when it doesn't fit | TAM-195 | F, Q2, Q6 |
   | 2 | 3 | Tickets fit the screen width down to 320 px: cells shrink to fit (about 32 px at 320 px, 12 px side margins), in "All tickets" and "One at a time" (today 378 px wide on a 375 px screen) | TAM-122, TAM-191 | F, S |
   | 3 | 3 | Marks are not red: deep blue fill (#1E3A5F), white number, ✓ at least 14 px, on the ticket **and** Quick mark's marked keys; the cue outline orange (#D97706) with a corner mark and thin white inner line; Early Five named once. Red is for actions only (guideline 17a) | TAM-131, TAM-192, TAM-195 | F, coder's question, old row 11 |
   | 4 | 3 | Screen readers hear the called number, its rhyme and every verdict (a polite live region) | new PLT (guideline 26a) | F |
   | 5 | 3 | One main button per screen, the rest of old row 4: the chosen winner in "Record a win", the chosen prize in the claim scan (old row 8: "Check" the only solid button, active once ticket and prize are filled; "Enter ticket number" hidden while its form is open) and an opened settle tab show outline, ✓ and tint; "Settle with host" has the main look on the payout screen until a tab is opened; History's "Delete all" outlined | PLT-301, TAM-178, TAM-089, TAM-199 | F, H, Q5 |
   | 6 | 2 | Phone-ticket games: "Add another winner" usable while a win waits to close, as in paper games (a paper player's tie can't be added today) | TAM-198, TAM-145 | F |
   | 7 | 2 | "Start calling" while tickets wait asks: "Zoya hasn't got her ticket" with "Hand it out now", "Give a paper ticket", "Start anyway" | TAM-132 | F |
   | 8 | 2 | "Can't scan? Give a paper ticket" confirms with "Kabir plays on paper · Undo" | TAM-058 | F |
   | 9 | 2 | First game of all: no separate "New session" naming screen; the session line above "Confirm prizes" is enough (reword PLT-016 to match PLT-029) | PLT-016, PLT-029 | F |
   | 10 | 2 | Hand-out: "Next ticket" / "Start calling" full width at the bottom; "Can't scan? Give a paper ticket" as a link above it | TAM-181 | H |
   | 11 | 2 | Landscape: on the ticket-type step the two cards sit side by side and "Next" hides neither; on the calling screen "Next number" is 72 px tall and "Record a win" doesn't sit beside it; the opening hint isn't cut off (guideline 17b) | TAM-213, TAM-107, TAM-138 | F |
   | 12 | 2 | "Which ticket?": small pictures of each ticket; with the cue on, the one it named first, marked "Pattern filled" | TAM-190 | S |
   | 13 | 2 | The claim QR screen outlines only the chosen prize's pattern | TAM-177 | F |
   | 14 | 2 | Payouts: the sign stays with the amount ("pays ₹12", "gets ₹35", never "net –" / "₹12" on two lines); "Host gives Riya ₹77" rows are plain text, not button-like | TAM-089, TAM-199 | F |
   | 15 | 2 | A phone may hold another player's ticket under that player's name; at most 3 tickets per phone: "This phone already holds 3 tickets" (not yet reviewed live) | new TAM | S |
   | 16 | 2 | Calling: the "Called 60 · Undo" bar lighter, with more space above "Scan a claim" | TAM-119 | H |
   | 17 | 2 | Player's "Which prize?": "Cancel" as a link | TAM-177 | H |
   | 18 | 2 | Settings opened during a game has "Back" at the top (today "Done" is 1,830 px down) | TAM-120 | F |
   | 19 | 1 | Polish: player screens use 16 px side margins like the rest; host prize chips wrap ("Close" runs off a 390 px screen, TAM-183); "Add a ticket by code" (TAM-117); "Done" outlined under the claim QR; "Waiting: Riya (3 tickets)" (TAM-132); a long name doesn't break "(1 of 1)"; "New game" at the bottom; "Remove" in grey; Full House field aligned; "Delete the past game" for one | listed | S, H, F |

   | 20 | 2 | Player's menu: "Done with this game…" clears this phone's tickets after "Clear your tickets from this phone?" ("Keep my tickets" main, "Clear tickets" outlined); held tickets named and cleared | TAM-171, new TAM | A |
   | 21 | 2 | Tickets more than 6 hours old open on Home with "Your tickets from 7:30 pm / yesterday, 9:15 pm / Sat 28 Sep · Open · Clear"; the phone saves when a typed-code ticket was added | TAM-171, PLT-300 | A |
   | 22 | 2 | Host's summary after End or Discard starts with a "Game over" banner ("Players: phones away…"; Discard: "Nobody wins…"), payouts still visible below | TAM-140, PLT-005 | A |
   | 23 | 2 | A claim from an old game, looked up in History: "That game has ended (game 7K3P, 9:15 pm)…" or "That game was discarded…"; unknown games as today; a new game's ticket replacing old ones says "Your tickets from game 7K3P were cleared" | TAM-179, TAM-171 | A |

   | 24 | 2 | Every scanned verdict shows its proof on a second line: "Ticket 3 · game 7K3P · same numbers as your copy" (accepted and bogey); after "Check by number": "…· checked from your copy" | TAM-174, TAM-177, TAM-179 | A |
   | 25 | 2 | The game code is visible to the room: calling screen top bar "Tambola · Game 7K3P"; room view small "Game 7K3P" bottom-left; hand-out screen "Game 7K3P" above the QR and "Check it says Game 7K3P" in the instruction | TAM-107, TAM-172 | A |
   (Rows 20–25, added 3 October from `docs/games/tambola/ux-review-2026-10-03-after-the-game.md` (A), are severity 2 but
   numbered at the end so earlier row numbers stay as the tester already uses them.)
   Not changing: tickets per player stay 1 to 3; the 20-character typed code; "Show claim" stays the player's main
   button; "Tap to resume" stays; auto-call calls at once when the host turns it on. After the next green build the UX
   designer re-checks each row.
3. **Answers to the tester's six questions (report on 5c5030d) and the coder's question** (product owner with the UX
   designer, 2 October; `docs/games/tambola/ux-review-2026-10-02-full.md`): 1 keep "Tap to resume"; 2 the cue names both
   prizes in prize order (row 1); 3 "You're ready for game night" on the first visit only; 4 Settings reachable from
   Home's menu, confirmed; 5 "Settle with host" has the main look until a tab is opened (row 5); 6 all three tickets
   must fit at 812 × 375 with Larger text (row 1). Coder: solid red marks do break guideline 17a; row 3 changes them.
   The tests can now drop the "either answer" allowances for 1–6. (Earlier questions for report 357b824: done.)
3b. **Product owner, 3 October, on the tester's report for rows 8–15 (f361bd0):**
   - **Numbering:** those tests follow the **1 October** row numbers. In today's list they are rows 5 (typed claim form),
     10, 12, 3 (cue outline: now orange with a corner mark, Early Five once), 15, 16, 17 and 19. Still without tests: rows
     1, 2, 3 (blue marks), 4, 6, 7, 8, 9, 11, 13, 14 and 18. Ask the tester for those next, using today's numbers.
   - **Tester's five spec questions:** all five readings accepted as written (toast and picture sizes, Early Five said
     once across tickets, "Waiting" counts tickets still to hand out, only the first-named ticket says "Pattern filled",
     each held ticket names its holder).
   - The two "owner" test changes (chips wrap, 12 px margin) are recorded (f2486a7).
4. **Owner check on two real Android phones (owner's task):** scan a ticket QR with a phone camera, mark a few
   numbers, show a claim QR and scan it with the host phone. This is the one path the review could not try (no
   camera in the review browser). Check the player's phone shows their **name and the game's start time** (a
   typed code carries neither, which is expected), and that the verdict appears within 2 seconds.
5. **Extended testing** (signed off; weekly Jev cap 20,000 decisions) continues once 0 is done.

---

# History: Phase 0 and 1a (28 September 2026)

## Status at the start of Phase 1a
| Item | State |
|---|---|
| Architecture, principles, two-workspace split | Decided (`CLAUDE.md`) |
| Tambola rules, journeys, UX guidelines, lifecycle | Written and cross-checked (`docs/games/tambola/`, `docs/ux-guidelines.md`) |
| Owner decisions | All made (`docs/decisions.md`) |
| Scenarios | Every phase has scenarios: 1a 100 (**all approved**, including TAM-144 and TAM-145 added on 28 September), 1b 18, 2 36, 2.5 14, 6 11, 7 6 (drafts until each phase comes up) |
| Rhyme catalog | `docs/games/tambola/rhymes.md` and `rhymes.csv` (409 rhymes, English and Hindi, 4–6 per number); **approved by the owner** |
| Tests | **Phase 1a tests written and pushed** (see "Phase 1a tests ready" at the end). They fail until Phase 1a is built |
| Code | Phase 0 built (engine, app shell, automation). **Next: Phase 1a**, against the tests |

## Read in this order
1. `CLAUDE.md` (root), then `src/CLAUDE.md` and `src/engine/CLAUDE.md`
2. `docs/games/tambola/guide.md`, including the **Contract check** section
3. `docs/games/tambola/journeys.md`
4. `docs/ux-guidelines.md`
5. `specs/tambola/README.md` and `specs/platform/README.md` (phases and scenario map)
6. `reports/latest.md` (requests to the Build workspace)

## Your first tasks, in order
1. **Update `src/games/tambola/CLAUDE.md`.** Its "House rules: waiting for the owner's decisions"
   section is out of date. Replace it with the decided rules from `specs/tambola/04-house-rules.md`,
   and add: paper tickets in Phase 1a (the app makes no tickets until Phase 2); prizes from
   `specs/tambola/08-prizes.md`; rhymes chosen at random (below).
2. **Phase 0: the foundation.** Done when an empty Tambola screen opens offline on the owner's
   phone from a preview link, and a first test written by the Test workspace passes in automation.
   - `package.json` with TypeScript, Vite + React, `vite-plugin-pwa`, Vitest, fast-check, Playwright
   - Test configs live in `tests/` (`tests/vitest.config.ts`, `tests/playwright.config.ts`);
     scripts: `typecheck`, `build`, `test`, `test:browser`
   - Installable web app: precache the whole app shell on first visit; updates offered only on the
     home screen, never mid-game (`registerType: 'prompt'`)
   - GitHub Actions: type-check, build and all tests on every push; GitHub Pages link updated when green (owner decision)
   - A dependency-boundary check for the rules in `src/CLAUDE.md`
   - Fill in the **Commands** section of the root `CLAUDE.md` (it will ask the owner)
3. **The engine skeleton** (`src/engine/`): the seven-question contract, seeded randomness, move
   records, replay and undo, plus these points from the Tambola contract check:
   - every move record carries a time (the 5-second undo of a call needs it; rules never read the clock)
   - viewers: host, **room**, and each player
   - moves carry details (pattern, player or ticket, numbers read out)
   - player-only state (ticket marks) stays outside the host's game state
   - saved games carry a **format version** from the first release (PLT-014)
   - every finished game with money records what each person paid and won (PLT-021)
4. **Rhyme content pack.** Convert `docs/games/tambola/rhymes.csv` into `content/tambola/`
   now (approved). Selection rules are below.

Then wait for tests: the Test workspace pushes them after the owner approves Phase 1a, and you build
against them (`reports/latest.md` says what's failing).

## Rhymes: how they are chosen
- Each number has several rhymes, in English and Hindi, with style tags (classic, Indian, Bollywood,
  cricket, festival, playful).
- On each call, one rhyme is picked **at random from the ones allowed by the host's settings**,
  with Indian-reference styles twice as likely as classic or playful ones (TAM-158)
  (language: English, Hindi or both; family-friendly filter on by default).
- The pick comes from the game's seeded random generator, never `Math.random()`, so a replay shows
  the same rhymes (TAM-073).
- Scenarios: `specs/tambola/11-rhymes.md`.

## Phase 1a scope (build this, nothing more)
Scenarios marked `Phase: Phase 1a` in `specs/tambola/` and `specs/platform/`. In short:
setup with paper tickets and the prize pool · calling with rhymes · the host board and room view ·
checking claims from numbers read out · ties, bogeys, late claims · undo of claims and of a call within
5 seconds · end, discard, play again · resume and history view · the key usability rules.

**Not yet:** sessions and tally, late joiners, phone voice and auto-call, dark mode (Phase 1b);
tickets on phones and QR codes (Phase 2); Jev; any server or relay.

## How Phase 1a was started (history)
> Read `docs/handover.md` and follow "Your first tasks, in order". Start with task 1, then plan
> Phase 0 and show me the plan in plain English before building. Remember: you never write or
> run tests; type-check, push, and read `reports/latest.md`.

(Phase 0 is done. From now on, open Claude Code in the workspace folder and ask the orchestrator
for the next task. See "How we work" in `CLAUDE.md`.)

## Phase 0 built (Build workspace, 28 September 2026)
For the Test workspace:
- `package.json` scripts are ready: `npm test` expects `tests/vitest.config.ts`, and `npm run test:browser`
  expects `tests/playwright.config.ts`. Both configs are yours to write. Automation runs each layer
  as soon as its config exists (`.github/workflows/ci.yml`).
- The app is served under `/pocket-game-night/` everywhere: `npm run build && npm run preview` serves
  http://localhost:4173/pocket-game-night/. The home screen shows a "Tambola" button, which opens a screen with the heading "Tambola".
- The engine's public entry is `src/engine/index.ts`; see `src/engine/CLAUDE.md` "What is here" for the
  contract shape the shared contract suite can test against. Tambola's rules module is not written yet:
  it waits for the approved Phase 1a tests.
- Live link (after the first green run): https://virapandy.github.io/pocket-game-night/
- Rhyme pack built: `content/tambola/rhymes.json` (format 1, 409 rhymes, fields `n`, `lang`, `style`,
  `familyFriendly`, `text`, plus `styleWeights`). Rebuilt from the catalog with `npm run build:rhymes`.
  TAM-150, TAM-156 and TAM-157 can be tested against this file.

## Phase 1a tests ready (Test workspace, 28 September 2026)
For the Build workspace. Every approved Phase 1a scenario now has tests; build until they pass.

**Read first**
1. `reports/latest.md`: what passes now, what fails, and requests.
2. `tests/games/tambola/README.md`: the names and shapes the rule tests import from
   `src/games/tambola/index.ts` (`tambolaRules`, `tambolaDefaults`, `suggestTiers`, `planPrizes`,
   `pickRhyme`, `rules` on the registration), the moves, the views and the summary.
3. `tests/browser/README.md`: the button words, field labels and `data-testid`s the browser tests look for.

**Two owner decisions made while writing the tests** (both in `docs/decisions.md`)
- **TAM-145: prizes are closed by hand, and the host ends the game.** After an accepted claim the tier stays
  open ("Add another winner" / "Close Top Line"); Next number waits until it is closed; closing the last
  Full House does not end the game; the host taps "End game and show payouts". TAM-075 changed to match.
  `src/games/tambola/CLAUDE.md` still says the game ends at Full House: please update it.
- **TAM-144: no prize won means contributions are handed back**, as with Discard.

**Where things stand**
| Layer | Command | Now |
|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 112 pass (engine, rhyme pack); 131 wait for Tambola's rules |
| Browser (Android and iPhone sizes) | `npm run build && npm run test:browser` | 5 pass (home, install, offline, fast first load); the rest wait for Phase 1a screens |

The rule tests were checked against a throwaway Tambola written only for that purpose (never committed):
all pass against it, so a failure means the app differs from the tests. Automation stops at the first failing
layer, so the browser tests run there once the rule tests pass. The live link updates only when everything is green.

**Suggested order:** rules module → setup screens → calling → claim check and closing tiers → end, discard,
play again → saving, resume, history → usability. Build only Phase 1a.

**Paste this into Claude Code in VS Code**
> Pull, then read `docs/handover.md` ("Phase 1a tests ready"), `reports/latest.md`,
> `tests/games/tambola/README.md` and `tests/browser/README.md`. Build Phase 1a in the suggested order,
> starting with Tambola's rules module. Type-check and push after each step. If a test looks wrong, write it
> in `docs/test-questions.md` instead of working around it. Explain each change to me in plain English.

## Phase 7: Report a problem (Build workspace, 29 September 2026)

- **Stub destination, must be replaced (PLT-208).** "Send report" goes to a stub for now: the report is kept on the
  phone (`pgn.reports.kept` in the phone's storage) and nothing leaves it. A real free, no-account destination is
  required **before any wider public release** (owner, 2026-09-28). The one place to change is `stubSend` in
  `src/app/reports.ts` (marked `TODO(PLT-208)`); the waiting list, retries and "one send at a time" already work
  for a real destination.
- What a report holds, and what it never holds, is worked out in `src/engine/reports.ts` (`makeReport`,
  `makePlayerReport`, `addSeeds`, `reportText`, `readReport`, `sortReports`). Each game takes names and money out of
  its own setup and moves with the optional `GameRules.forReport` (Tambola: `forReport` in `rules/rules.ts`).
- Where it shows: home, the calling screen's Menu, the payout screen, the player's ticket Menu; after an
  unexpected error, a calm message offers a report. Waiting reports: Tambola → Settings → "Reports waiting to send".
- Tests use a stand-in, `window.__pgnSendReport(text)`, in place of the stub; the app never defines it.
