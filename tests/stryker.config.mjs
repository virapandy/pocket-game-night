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
    'src/games/tambola/rules/tickets.ts',
    'src/engine/money.ts',
    'src/engine/tally.ts',
  ],
  testRunner: 'vitest',
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
