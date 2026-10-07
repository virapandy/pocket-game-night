// Weekly mutation run, Impostor groups only (.github/workflows/mutation.yml): the Test role's weekly settings
// (tests/stryker.config.mjs) with Impostor's rules as the files to mutate and Impostor's tests as the tests to run
// (.github/mutation/vitest.impostor.config.mjs). The workflow narrows `mutate` to one group with --mutate.
// Automation settings (Build role). Reports go to the same place as the weekly run's (reports/stryker/).
import base from '../../tests/stryker.config.mjs';

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  ...base,
  mutate: ['src/games/impostor/rules/**/*.ts'],
  vitest: { ...base.vitest, configFile: '.github/mutation/vitest.impostor.config.mjs' },
};
