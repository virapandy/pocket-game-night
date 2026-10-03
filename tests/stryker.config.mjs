// Mutation testing (PLT-119): Stryker makes small deliberate mistakes in a copy of Tambola's rules and the money
// code, runs the tests against each, and reports the share caught. It never changes the real code (it works in a
// sandbox copy). Report-only: the target is 80%, and a lower score never fails a run or holds back the preview.
// Run from the repo root: `npm run test:mutation` (requested from Build), then `node tests/mutation/summary.mjs`.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: [
    'src/games/tambola/rules/check.ts',
    'src/games/tambola/rules/codes.ts',
    'src/games/tambola/rules/prizes.ts',
    'src/games/tambola/rules/rules.ts',
    // Stryker 10 cannot mutate `x!++` / `x!--` (a TypeScript non-null mark on ++ or --): it stops the whole run with
    // "UpdateExpression expected ... TSNonNullExpression". Only those three lines (92, 93, 121) are left out; every
    // other line of tickets.ts is still mutated. Tool limit, not a test or app fault. Re-check if the lines move.
    'src/games/tambola/rules/tickets.ts:1-91',
    'src/games/tambola/rules/tickets.ts:94-120',
    'src/games/tambola/rules/tickets.ts:122-9999',
    'src/engine/money.ts',
    'src/engine/tally.ts',
  ],
  // Stryker's own Vitest runner, wrapped for Vitest 5's test names (tests/mutation/vitest-runner-v5.mjs explains).
  plugins: ['@stryker-mutator/vitest-runner', './tests/mutation/vitest-runner-v5.mjs'],
  testRunner: 'vitest-v5',
  // Stryker rewrites tsconfig paths for its sandbox with an older TypeScript API that TypeScript 7 no longer has
  // ("ts.parseConfigFileTextToJson is not a function"). Our tsconfig has no paths outside the repo to rewrite, and
  // Vitest does not type-check, so that step is turned off by naming a file that does not exist. Tool limit only.
  tsconfigFile: 'tests/stryker-no-tsconfig-rewrite.json',
  vitest: { configFile: 'tests/vitest.mutation.config.ts' },
  coverageAnalysis: 'perTest',
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/stryker/index.html' },
  jsonReporter: { fileName: 'reports/stryker/mutation.json' },
  thresholds: { high: 80, low: 60, break: null },
  concurrency: 2,
  timeoutMS: 60_000,
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  ignorePatterns: ['dist', 'reports', 'test-results', 'playwright-report', 'coverage', '.env.local', '.env'],
};
