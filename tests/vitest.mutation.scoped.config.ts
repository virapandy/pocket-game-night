// Scoped mutation (tests/mutation/scoped.mjs) when a change touches Impostor's rules and Tambola's rules or the engine's
// money code together: the tests of tests/vitest.mutation.config.ts and tests/vitest.mutation.impostor.config.ts in one
// run, with the same shortened simulations. Not used by `npm test` or the weekly run.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root,
  test: {
    include: ['tests/{contract,games/tambola,replays,sim}/**/*.test.ts', 'tests/games/impostor/**/*.test.ts'],
    // The key check reads git and the real key file; it tests the repo, not the rules.
    exclude: ['tests/sim/key-hygiene.test.ts', '**/node_modules/**'],
    environment: 'node',
    reporters: ['dot'],
    testTimeout: 120_000,
    printConsoleTrace: false,
    env: { SIM_GAMES: '200', SIM_MASS_GAMES: '60', JEV: 'off' },
  },
});
