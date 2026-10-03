# Mutation testing: weekly in full, scoped for C3 changes and releases

Stryker makes small deliberate mistakes in a sandbox copy of the rules and money code and runs the tests against
each one; the share it catches shows how well the tests guard that code (PLT-119, target 80%, report-only).

| When | What | Command (from the repo root) |
|---|---|---|
| Weekly (unattended) | every rules and money file (`tests/stryker.config.mjs`) | `npm run test:mutation`, then `node tests/mutation/summary.mjs` → `reports/mutation-latest.md` |
| A C3 change (`docs/change-sop.md`) | only the rules and money **lines** that change touched | `node tests/mutation/scoped.mjs <first commit of the change>~1..HEAD` |
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
