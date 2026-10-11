// Stryker settings for scoped mutation (tests/mutation/scoped.mjs; docs/change-sop.md): the weekly settings
// (tests/stryker.config.mjs) with only the files and lines a change touched, passed in PGN_SCOPED_MUTATE as a JSON
// list ("src/games/tambola/rules/check.ts:40-52", …). Its reports go to reports/stryker/scoped/ (gitignored), so the
// weekly report in reports/stryker/ is never overwritten. Run it through scoped.mjs, not directly.
// The tests run against each mistake: PGN_SCOPED_VITEST, set by scoped.mjs from the files mutated (Tambola and engine
// files: tests/vitest.mutation.config.ts; Impostor's rules: tests/vitest.mutation.impostor.config.ts; both: the two
// together, tests/vitest.mutation.scoped.config.ts).
import base from '../stryker.config.mjs';

const mutate = JSON.parse(process.env.PGN_SCOPED_MUTATE ?? '[]');
if (!Array.isArray(mutate) || mutate.length === 0) throw new Error('PGN_SCOPED_MUTATE is empty: run tests/mutation/scoped.mjs');

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  ...base,
  mutate,
  vitest: { ...base.vitest, configFile: process.env.PGN_SCOPED_VITEST || base.vitest.configFile },
  // `--incremental` (scoped.mjs passes it on): results for mistakes and tests unchanged since the last scoped run are
  // reused from this file instead of being run again.
  incrementalFile: 'reports/stryker/scoped/incremental.json',
  reporters: ['clear-text', 'html', 'json'],
  htmlReporter: { fileName: 'reports/stryker/scoped/index.html' },
  jsonReporter: { fileName: 'reports/stryker/scoped/mutation.json' },
  tempDirName: '.stryker-tmp/scoped',
};
