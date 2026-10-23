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

## 23 October: Secret Words screen lane C tests (lane-e)
- `tests/browser/secret-words-c-map.spec.ts` + helpers `secret-words-c.ts`; coder note `specs/secret-words/screens-c.md`. M1 is opened by the `#map=` link on a fresh phone (lane A also owns/tests that link). When lane A/B/D land, remove the `aheadOfSecretWordsScreens` calls that then pass.
- **Port clash:** Playwright's preview server is fixed at port 4173 with `reuseExistingServer`; two testers running browser tests at once share (or kill) each other's server and test the other lane's build. Run browser tests one tester at a time, or check `curl localhost:4173/pocket-game-night/` serves your own build first.
