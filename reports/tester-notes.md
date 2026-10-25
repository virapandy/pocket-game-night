# Tester notes (short-lived testers, 11 October 2026)

Read this and the top of `reports/latest.md` before starting. Keep it short: replace stale lines, do not append logs.

## How the test set-up works now (faster-cycles items 3, 7, 9, 11)
- **Clock:** every browser test page has Playwright's clock installed at start (`startClock`, `tests/browser/fixtures.ts`;
  extra phones in `newPhone`, `phone.ts`). It runs with real time; `waitOutTapGuard` (helpers.ts) and `settle`
  (impostor.ts) jump the app's time past the 500 ms tap guard instead of sleeping. Guard tests pause the clock
  (`freezeClock`) and still tap within 500 ms. The emulator tests (`tests/android/`) have their own fixture and no clock.
- **Gotcha:** an error thrown inside a page `setTimeout` no longer reaches the app as uncaught under the clock; use
  `queueMicrotask` (as PLT-203 does).
- **Area map:** `tests/browser/areas.json`. One game's files run that game's browser files plus smoke; shared app files
  run smoke + key journeys (`lifecycle`, `impostor-journeys`) + Home + layout rules. A new spec file must be added to
  its game's area. Check a range with `node scripts/browser-areas.mjs <before> <after>`.
- **Mutation for a C3 change:** `caffeinate -i taskpolicy -b node tests/mutation/scoped.mjs <first commit>~1..HEAD --incremental`
  (`--dry-run` first). It picks the test set by game (`tests/vitest.mutation*.config.ts`). Never touch
  `tests/vitest.mutation.config.ts` while another session has it modified.
- **Quarantine:** `tests/browser/README.md`, "Quarantine". Listed in `reports/latest.md`, "Quarantined", with owner and
  reason; tag `@quarantine` + annotation in the test; never skip or retry.

## Open items for the next tester
- **Lane W2 tested (25 October, b9f6a75):** setup and frame pass; 17 tests per phone in what-am-i-interruptions and
  -lifecycle still fail until lanes W3/W4 (T2–T4, G1). The picker's back is "← Home" everywhere now; the Home
  pictures were refreshed (Screenshots run 40129184456), not yet approved. Use `exact: true` for "Move <name>" (it also
  matches "Remove <name>").
- **What Am I? tests first (lane-w, 25 October; scenarios v1.3, approved 24 October):** specs copied to `specs/what-am-i/`
  (01, 02, 03, 04, 06, 07, 09, 10 + README; each scenario carries its Version 1.1–1.3 items word for word; a script did the
  copy, so wording is exact). Rule API and browser hooks made exact in `specs/what-am-i/api.md`; the product owner's 42
  clarifications of 25 October are applied (shown-by-text, Swimming = WAIW-170, tip order, How to play order, sound name
  `countdown`, tied top = "Top so far", 12-hour end = endGame + endEvening). Rule tests `tests/games/what-am-i/` (78 +
  contract registration; the contract suite joins once built): `wit` makes each one pass only if it fails with "not built
  yet", so `npm test` stays green; checked against a throwaway reference build outside the repo (84/84 pass with the
  contract suite; 4 planted faults all caught). Browser: 8 files `tests/browser/what-am-i-*.spec.ts`, 156 tests, helper
  `tests/browser/what-am-i.ts`: `openApp` marks a test expected-to-fail and stops at once while `window.__waiTest` is
  missing (about 1 s each; 141 s Android / 107 s iPhone for all 156 at 3 workers locally). Nothing to remove when built:
  both switch to normal by themselves (rules: `src/games/what-am-i/index.ts` loads; browser: `__waiTest` exists).
  `PGN_IGNORE_AHEAD=1` runs them unmarked. Area "What Am I?" added to `tests/browser/areas.json` (own paths only; no shared
  helper changed, so no other game's run picks them up). Their selectors have never met a real screen: expect to adjust
  selectors, not checks. Two questions in `docs/test-questions.md` (25 October rows: move fields; the queue's second lap).
- Local note: under `taskpolicy -b` the full `npm test` timed SWD-025's 10,000-game property out at 120 s (passes in 26 s at
  normal priority); a Mac-load artefact, not a test or app fault.
- **Mafia lane-m review fixes (25 October, app ed28360):** `tests/games/mafia/editions.test.ts` (frozen story editions;
  missing edition = fixed 1.2, pinned by mocking `src/games/mafia/rules/night.ts`'s `MAFIA_STORY_EDITION`; stories.json
  gaining ids mocked with `vi.doMock`; MAF-H2) and `leaves.test.ts` (MAF-052 `when`). Run Mafia files plus
  `tests/contract/mafia.test.ts` only: running all of `tests/contract` at the same time under `taskpolicy -b` timed out
  4 long property tests (load, not bugs). Orchestrator calls await the product owner (`docs/test-questions.md`, 25 October).
- **Secret Words C3 (lane-e, 22 October):** specs copied to `specs/secret-words/` (v3.6; each scenario's "Version 3.6"
  paragraph wins); rule API for the coder `specs/secret-words/api.md`; rule tests `tests/games/secret-words/` (140 with
  the contract suite) fail only for "not built yet" until the coder's lane lands. `oracle.ts` = the scenarios' own
  board/deck algorithms (shared with the browser helper `tests/browser/secret-words.ts`). The tests were checked
  against a throwaway reference build kept outside the repo (all 140 passed with it, bar the missing words.json), so a red
  rule test after the build is most likely a real difference: read the scenario before suspecting the test.
  Browser: `secret-words-c3.spec.ts` (SWD-022, 025, 099, 117, 129); all but SWD-099 marked `aheadOfSecretWordsScreens`
  until the screens exist: remove a mark when Playwright says "expected to fail, but passed". Their navigation
  (`hostEvening`, `passToClue`, `giveClue`, `revealCell`) follows the canonical strings but has never met a real screen:
  expect to adjust selectors (not checks) the first time. Open questions in `docs/test-questions.md` (22 October rows).
  SWD-025's 10,000-game property takes ~45 s in `npm test`.
- **Lane-e round 2 (22 October, c86f220 on app 0ff9800):** owner answers applied: SWD-090/042/103 v3.6 paragraphs in
  specs; SWD-099's content check is now the 10 px floor (words below 12 px annotated); new ahead-of-screens checks
  SWD-090 shrink-alone (360 × 640) and SWD-042 tap-to-zoom (guessing; turned-over cells, 2 000 ms) use `WIDE_CODE`, the
  first deck whose board holds a known wide word. SWD-103 v3.6 rule tests fail until the coder changes the recap
  (quick verify 39811481754). Lane-e still needs origin/main merged: the Test role can't (main brings `src/proto/`).
- **Test lanes commit fine now:** the role guard strips `-lane-<x>` (commit from lane-e, 22 October).
- Lane-y (Noto Sans, IMP-088 owner decision 11 October): IMP-088 spec and `impostor-setup.spec.ts` checks updated
  (72/60 px label column, 135/120/147/106 px options; labels 4 px above 140/160 px options with Larger text at 320 and
  360, new checks for 360 Larger, 812 Larger and 390 Larger); 120 reference pictures redone, unapproved
  (README, "Screenshot comparison").
- Quarantined: PLT-120 at 390 × 844 and TAM-116 (emulator, weekly). Un-quarantine after three weekly runs green first time.
- Build role requests (in `reports/latest.md`): quick verify to run `@quarantine` tests non-blocking; point
  `.github/mutation/stryker.impostor.config.mjs` at `tests/vitest.mutation.impostor.config.ts`; cache
  `incremental.json` if the weekly mutation run should be incremental.
- Not done from faster-cycles yet (test side): item 2 (shared text list, behaviour-based checks), Playwright Docker
  image (item 3), sharding beyond quick verify's two shards (item 7).
- Local timing on the Mac swings about 10 to 15 % between runs; compare before/after on the same files back to back.

## 22 October (later): SWD-127 repeated-name test, simulated table games blocked
- Added the SWD-127 test in tests/games/secret-words/people.test.ts (a list repeating one name and leaving a member out is refused); passes on b5f030b.
- Simulated table games (docs/handover.md, "Added 22 October") NOT built: the AI clue giver needs a large-model call. There is no Anthropic API key in the environment or .env.local (only JEV_API_KEY), and adding one is a new paid service. Needed from the owner: either an approved API key for a large model with a spending limit, or approval to use another route. Jev (Choice questions only) cannot write clues. The guesser side (Jev Choice over face-down words plus "uncertain") and the board dealing can be built once the clue giver is settled.
- The Test lane worktree for lane-e was clean and fully pushed; removed.

## 22 October (night): simulated table games, scripts built, play not run
- Scripts in tests/tools/sim-table/ (own vitest config, not in npm test): `deal.sim.ts` (done, wrote boards.json: 30 Full + 30 Easy), `play.sim.ts` (needs clues.json), shared `common.ts`. Exchange folder and its README.md (exact clues.json shape and clue rules checked) are outside the clones; its path is in common.ts (`SIM_TABLE_DIR` overrides).
- Run: `SIM_MODE=deal|play npx vitest run --config tests/tools/sim-table/vitest.config.ts deal|play`; wrap play in `caffeinate -i`. Play writes reports/sim-table-secret-words.md and results.json (exchange). Wiring was checked with a stub guesser (`SIM_TABLE_DRYRUN=1`, report to the exchange folder, no Jev); the real run was not made.
- Finding for the owner: the engine has no pass move (a clue needs at least one guess; only "Clue not allowed" ends a turn with none, and it gives the other team a word). A team out of planned clues therefore ends the board and is counted; asked for "pass with clue 0, no guesses" was not possible.
- Jev decisions: one per guess; run limit 6000 (SIM_TABLE_RUN_LIMIT).

## 23 October: Secret Words screen lane A tests (lane-a, scenarios v3.7)
- Written: `tests/browser/secret-words-a-home.spec.ts` (Home, picker, Start new, Join, code entry, QR link, D11 board-phone dialog with privacy checks),
  `secret-words-a-setup.spec.ts` (S1 to S5, the Clue givers sheet, five sizes, small-line colour), shared `secret-words-a.ts`. Coder's note of ids and roles:
  `tests/games/secret-words/screens-a.md`. Specs under `specs/secret-words/` are still v3.6 (the other tester updates them); these tests read v3.7 straight from
  `docs/games/secret-words/scenarios.md`. All 132 tests are marked `aheadOfSecretWordsScreens` except two that already hold (Home menu "History"; no last night on an empty
  phone). Run as real checks with `PGN_IGNORE_AHEAD=1`. Remove each mark when Playwright says "expected to fail, but passed".
- The tests have never met a real screen: expect to adjust selectors (not checks) on the first green attempt. Models inside: SWD-004/006/130 team draws (`drawSplit`),
  saved nights from `secret-words-saved-evenings-v1.json` (`phoneWithNights`, `variant`), codes with the right check symbol (`codeFromValues`).
- Tambola helpers now accept both old and new wording for "Type the code" / "Type a ticket code" and Home's second-card line (SWD-002, rule 11); strip the old forms after lane A merges.
- Not tested: SWD-007 "closing it any other way" (undefined), SWD-130 from game 2 (needs a played game), "Add a partner" behaviour (SWD-123, lane B). Open questions: `docs/test-questions.md` (23 October rows).

## Lane A tests, 23 Oct (tester)
Merged origin/main (PGN_PORT per lane: lane-a 4174). Lane A area: 129 of 132 pass on Android (PGN_IGNORE_AHEAD=1). The 3 failures end on the map phone (lane C): secret-words-a-home.spec.ts lines 323, 358, 418. Four coder questions answered in docs/test-questions.md (all test problems, fixed).

## 23 October: Secret Words 3.7 specs (main) and lane B tests first (lane-b)
- Specs: `specs/secret-words/` is scenarios 3.7 (db2398d). The split was regenerated from `docs/games/secret-words/scenarios.md`
  (sections by their `→ specs/...` headings; `### SWD-nnn Title` → `## SWD-nnn: Title` + Status/Phase lines; README = the
  front matter + Test hooks). Rule tests needed no change for 3.7 (SWD-101/131: the warning stays a hint).
- Lane B (the turn on the host): `secret-words-shared.spec.ts`, `secret-words-turn.spec.ts`, `secret-words-dialogs.spec.ts`,
  helpers `secret-words-b.ts`, coder note `specs/secret-words/screens-b.md`. They reach the turn through lane A's setup, so
  they fail at the picker until lane A is merged and lane-b rebased (done 23 Oct). Six lane B checks in `secret-words-c3.spec.ts` are real
  checks now (SWD-090, 042 ×2, 033 QR ×2, 129); the other 12 stay `aheadOfSecretWordsScreens` (lanes A, C, D).
- Never run against a real screen: expect to adjust selectors (not checks) the first time, as with the C3 browser checks.

## Lane B fixes, 23 Oct (tester)
`pass screen` checks in the SWD-094/098 test wait out the 1 s guard; `toGuessing` waits for `clue-line`. Both questions answered in docs/test-questions.md.

## 23 October: Secret Words screen lane C tests (lane-e)
- `tests/browser/secret-words-c-map.spec.ts` + helpers `secret-words-c.ts`; coder note `specs/secret-words/screens-c.md`. M1 is opened by the `#map=` link on a fresh phone. Lanes A, B, C are on lane-e (7b4407f); only lane D's (game over) marks and the SWD-025 board-phone check (lane B grid fix pending) stay expected-to-fail. Remove each mark when Playwright says "expected to fail, but passed".
- `freshPhone({ fixed: true })` freezes Date.now(): tap guards never end; call `page.clock.setSystemTime(now)` before tapping (see `unfixClock` in the lane C spec).
- Use `PGN_PORT=<own port>` for local browser runs so two testers never share a preview server.

## 23 October: Secret Words lane D tests first (lane-f)
- Files: `secret-words-game-over.spec.ts` (G1, D6, New board, Play again, v3.7 bottom bar, D8, G2, D9, SWD-063, 067),
  `secret-words-players-history.spec.ts` (D7/D7a/D7b, E1, E1a), helpers `secret-words-d.ts`, coder note
  `specs/secret-words/screens-d.md`; SWD-025's game-over step in `secret-words-c3.spec.ts` is now written out (heading,
  result line, whole map by kind); its expected-to-fail marks (SWD-025 ×3, SWD-022 ×5) are removed (they pass, 24 October).
- Most lane D tests open the app on a saved game night written move by move (`secret-words-d-evenings.ts`: the rules
  module can't load in Playwright, its words.json import needs a JSON import attribute; every flow is replayed through the
  rules by `tests/games/secret-words/lane-d-evenings.test.ts`, so add new flows to `ALL_FLOWS`) and reload (SWD-048): real checks now, failing until lane D builds. Tests through lane A or B screens use
  `needsLanes(...)` (expected to fail); remove the call when Playwright says "expected to fail, but passed".
- New area entry in `areas.json` (its own block near the end, so lane A's and B's edits of the Secret Words block merge).
- Questions of 23 October in docs/test-questions.md (bar gap 8 vs 16 px; SWD-051 Landmine wording; credit order etc.).
- Round 2 (23 October): lane D marks all removed (they pass); SWD-025's 3 marks removed; lane-f has origin/main merged (coder 26c3fcd, tester 24 October) and lane D's area entry is back in `areas.json`.

## Secret Words screen simulations (24 October 2026)
`tests/sims/secret-words-evenings.sim.ts` + `secret-words-runner.ts` (README in `tests/sims/`). Count follows `SIM_EVENINGS` (one in five: 40 of 200). Local: `JEV=off SIM_EVENINGS=0 SIM_SW_EVENINGS=2 npx playwright test --config tests/playwright.sims.config.ts --workers=2` (about 25 s for 2; delete `reports/sim/screen` first, passing evenings leave no replay). Candidate app findings the sims raised (not yet confirmed by a rule test): "Other team's turn" stays guarded for good after a Nobody's word (seed t4-008, grandparent, 2 phones); How to play opened from game over shows two main buttons (Play again behind Done); map phone "Next map" sometimes opens no dialog (t4-006). The Jev path is untested locally (no key).

## 25 October: What Am I? reviewer gaps (lane-w1b, C3)
- New failing rule tests: `editions.test.ts` (WAI-092 editions; loads the game with a mocked `content/what-am-i/words.json` via `vi.doMock` + `vi.resetModules`, so a later list can be tried without touching content), WAI-010 seed refusal (`queue.test.ts`), WAI-041 reorder (`scores.test.ts`), WAI-061/064 tie order (`results.test.ts`). API made exact in `specs/what-am-i/api.md`; owner confirmation row in `docs/test-questions.md`.
- On 35420ab 8 fail, all for the gap itself (missing `whatAmIEdition`, replay refused "That word is not on screen", setup accepted without a seed, reorder accepted, Riya before Arjun in ties). "A night started under edition 2" passes now (guard against over-filtering).
- The browser side of editions (the app writing `config.edition` when a night starts) has no test yet; add one with the screens lane.

## 25 October: Mafia scenarios 1.1, tests first (lane-m)
- Specs: `specs/mafia/` split from `docs/games/mafia/scenarios.md` v1.1; each scenario carries its "Version 1.1" items word
  for word (items 1, 33, 34 in the README). Rule API: `specs/mafia/api.md`, with the product owner's 25 October
  clarifications folded in (PO 9 tags, 15 night leaver who was the Mafia's pick, 16 deal-leave Undo and count).
- Rule tests `tests/games/mafia/` (140) + `tests/contract/mafia.test.ts`: all fail only with "src/games/mafia is not built yet"
  (3 oracle/CSV checks pass); every other game's rule test stays green (893). `stories.json` test waits for the content file.
- Checked for self-consistency against a throwaway reference implementation (scratchpad only, not committed): all 146 pass
  except `stories.json`. Two test bugs it found are fixed (P5 rolls back on Undo; the random driver re-reads the deal after
  a deal-leave Undo). A real build may still disagree where `api.md` had to choose; those are in `docs/test-questions.md`.
- `flows.ts` = game nights as move lists (MAF-040 worked example etc.), opened in the browser through `pgn.test.load`
  (MAF-H6) and replayed by `saved.test.ts`. Add new flows there. Fixture `mafia-saved-nights-v1.json`: never edit.
- Browser: `mafia-c3.spec.ts` (C3) and six screen files (01, 02/03, 04, 06, 07, 09), 67 tests, all `aheadOfMafiaScreens`;
  run as real checks with `PGN_IGNORE_AHEAD=1`. Never met a real screen: expect to adjust selectors (not checks) on the first
  lane run. Names are matched case-insensitively (capitals are CSS only). Local port used: PGN_PORT=4185.
- Mafia area added to `areas.json` (its own block before the "changed spec runs itself" entry).
- Questions raised: 9 rows of 25 October in `docs/test-questions.md` (0.62 is really 0.95; leave between vote and N0; story
  reuse; target null for other roles; last turn leaves; N3 or M1 on resume; caught at game over; "past the deal"; mostMafia ties).

## 25 October: What Am I? lane T (lane-t, rebased onto main ddc25fb)
- Turn tests that call `playTurn`/`saveTurns` need `turnTime: 30` (default is 60 s); with `stopAt: 'S1'` call `chooseOnS2(page, { turnTime: 30 })` yourself.
- A round's last saved turn opens Round over (R1); tap the main "Round 2" to reach the next T1.
- History is in Home's menu: use `fromHome(page, 'History')` from helpers.ts.
- Colours are scoped to the game: read CSS variables on the element, not `document.documentElement`.
- Motion tests schedule hundreds of orientation timers (~170 ms real time each under `taskpolicy -b`): give them `test.setTimeout`.
- WAI-010 "no word twice in a turn" is the orchestrator's call (api.md); WAI-033 item 33 from G1 too. Both await the product owner.
- After keeping both sides in a docs/test-questions.md conflict, check for duplicate rows (an earlier cleanup commit gets lost).


## 25 October: Mafia screens built (lane-k), marks off
- `aheadOfMafiaScreens` is gone. Only tests that need the picker's Mafia card, Home's "Host a game" line or Home's row carry
  `needsMafiaCardOrHomeRow` (all of `mafia-setup.spec.ts`, and `mafia-room` MAF-055); remove each when Playwright says
  "expected to fail, but passed" (after What Am I? releases and the card ships).
- Deal tests open the first deal pass screen through MAF-H6: `openDeal(page, names, { deals } | { roles })` (flow
  `deal-start`, only `start` recorded). It shows "Welcome back." like any resume.
- New in `mafia-results.spec.ts`: MAF-093 History order (Impostor v3 fixture copied and moved in time), past game screen,
  Play again without a leaver (flow `left-neha-ended`), PLT-011 Clear all with Mafia nights, MAF-063 G2 left by hiding
  the app. Several game nights on one phone: `loadNight` sets `pgn.test.load` and reloads (clock kept).
- Local runs with 3 workers under `taskpolicy -b` on a busy Mac: a forced click sometimes hangs 10 s (MAF-011, MAF-P7
  sizes; both pass alone) and three long rule properties time out at 120 s; check against the automation run.

## 25 October: lane-k rebuilt on main 18d247e
- Mafia test commits cherry-picked from lane-k-backup onto 18d247e; quick verify 40140895888 green at 83cc320.
- `npx vitest run <file>` without `--config tests/vitest.config.ts` uses a 5 s timeout and fails the long properties; use `npm test -- <file>`.

## 25 October: What Am I? marks in flight (lane-j, fc418f9)
- `what-am-i-marks-in-flight.spec.ts`: a flashed Got it always counts, after pause, Home row, app hidden or reload. Not reproduced.
- Reaching round 2 needs three whole turns: use 30 s turns (a 60 s `runFor` under taskpolicy -b passes the 30 s test timeout);
  the file sets 90 s per test. The Pause button takes taps during the 600 ms flash.
