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
- Quarantined: PLT-120 at 390 × 844 and TAM-116 (emulator, weekly). Un-quarantine after three weekly runs green first time.
- Build role requests (in `reports/latest.md`): quick verify to run `@quarantine` tests non-blocking; point
  `.github/mutation/stryker.impostor.config.mjs` at `tests/vitest.mutation.impostor.config.ts`; cache
  `incremental.json` if the weekly mutation run should be incremental.
- Not done from faster-cycles yet (test side): item 2 (shared text list, behaviour-based checks), Playwright Docker
  image (item 3), sharding beyond quick verify's two shards (item 7).
- Local timing on the Mac swings about 10 to 15 % between runs; compare before/after on the same files back to back.
