# Mutation testing: weekly in full, scoped for C3 changes and releases

Stryker makes small deliberate mistakes in a sandbox copy of the rules and money code and runs the tests against
each one; the share it catches shows how well the tests guard that code (PLT-119, target 80%, report-only).

| When | What | Command (from the repo root) |
|---|---|---|
| Weekly (unattended) | every rules and money file (`tests/stryker.config.mjs`) | `npm run test:mutation`, then `node tests/mutation/summary.mjs` → `reports/mutation-latest.md` |
| A C3 change (`docs/change-sop.md`) | only the rules and money **lines** that change touched | `caffeinate -i taskpolicy -b node tests/mutation/scoped.mjs <first commit of the change>~1..HEAD --incremental` |
| A release | every rules and money **file** changed since the last release | `node tests/mutation/scoped.mjs <last release>..HEAD --whole-files` |
| C0, C1, C2 | none | |

## Scoped runs (`scoped.mjs`, owner decision 3 October 2026)
- Files that count: `src/games/<game>/rules/**/*.ts` and `src/engine/money.ts`, `tally.ts`, `session.ts`. Lines the
  weekly settings leave out (a Stryker limit noted in `tests/stryker.config.mjs`) are left out here too.
- With no matching lines in the range it prints "nothing to mutate. Green." and exits 0.
- End the range at `HEAD`: line numbers come from the end of the range, and Stryker mutates the files as they are now
  (it warns if a file changed after the range's end).
- Options: `--only <path>` (one file), `--whole-files`, `--concurrency <n>` (default 2; capped at 3 unless `CI` is set),
  `--dry-run` (list what would be mutated, run nothing).
- Settings: `stryker.scoped.config.mjs` (the weekly settings with only those files and lines). Stryker's report goes
  to `reports/stryker/scoped/` (gitignored; the weekly report is never overwritten); the summary to
  `reports/mutation-scoped.md`. A low score never fails; a Stryker crash exits non-zero (a setup problem).
- On the owner's Mac (owner, 3 October): `caffeinate -i taskpolicy -b node tests/mutation/scoped.mjs <range>`.

Measured 3 October 2026 on the Mac, low priority, concurrency 2: one small file, 3 changed lines of
`src/games/tambola/rules/rules.ts` (`ae4b7f1~1..ae4b7f1`), 9 mistakes: 410 s. Most of the time is Stryker's first run
of every rule test to learn which tests reach which lines, and the shortened simulations in
`tests/vitest.mutation.config.ts`, which run for each mistake they reach.

## Incremental mode and Impostor (faster-cycles item 9, checked 11 October 2026)
- **Stryker's incremental mode works with our Vitest set-up** (Stryker 10, Vitest 5, the `vitest-v5` wrapper). Checked on
  `src/games/impostor/rules/picks.ts:8-9` (3 mistakes): first run 161 s; the same run again 77 s, Stryker reporting
  "3 of 3 mutant result(s) are reused". The time left is Stryker's first run of every test to learn which tests reach
  which lines; incremental mode cannot skip that.
- `--incremental` on `scoped.mjs` turns it on. Results are kept in `reports/stryker/scoped/incremental.json`
  (gitignored, on this Mac only). It pays off on the second and later runs of the same change (after a fix round): only
  mistakes in changed lines, or reached by changed tests, run again. A first run costs the same as without it.
- **The command the tester runs for a C3 change** (changed lines only, from the repo root):
  `caffeinate -i taskpolicy -b node tests/mutation/scoped.mjs <first commit of the change>~1..HEAD --incremental`
  Add `--dry-run` first to see the lines. Never per C0 to C2 change; the full run stays weekly.
- **Which tests run against the mistakes** (`scoped.mjs` picks): Tambola's rules and the engine's money files:
  `tests/vitest.mutation.config.ts`; Impostor's rules only: `tests/vitest.mutation.impostor.config.ts`; both in one
  change: `tests/vitest.mutation.scoped.config.ts`. Before this, a scoped run on Impostor's rules ran Tambola's tests and
  every mistake showed as "no test runs this line".
- **For the Build role:** `.github/mutation/stryker.impostor.config.mjs` can point `vitest.configFile` at
  `tests/vitest.mutation.impostor.config.ts` (same settings as `.github/mutation/vitest.impostor.config.mjs`, which can
  then go). For the nightly or weekly run in CI, incremental mode needs `incremental.json` kept between runs (an
  Actions cache keyed on the branch); without it every run is a full run.
