// The tests Stryker runs against each deliberate mistake in Impostor's rules (src/games/impostor/rules/): Impostor's
// rule and property tests and its contract test, with the simulations shortened as in tests/vitest.mutation.config.ts.
// Not used by `npm test`. Used by the scoped runs (tests/mutation/scoped.mjs, for Impostor's rules) and meant for the
// weekly Impostor run: the Build role can point .github/mutation/stryker.impostor.config.mjs's `vitest.configFile` here
// and remove .github/mutation/vitest.impostor.config.mjs (same settings).
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root,
  test: {
    include: ['tests/games/impostor/**/*.test.ts', 'tests/contract/impostor.test.ts'],
    exclude: ['**/node_modules/**'],
    environment: 'node',
    reporters: ['dot'],
    testTimeout: 120_000,
    printConsoleTrace: false,
    env: { SIM_GAMES: '200', SIM_MASS_GAMES: '60', JEV: 'off' },
  },
});
