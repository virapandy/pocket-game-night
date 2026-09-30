// The tests Stryker runs against each deliberate mistake (PLT-119): every rule, property, contract, replay and
// simulation test, with the simulations shortened so a few thousand mistakes finish on a free machine.
// Not used by `npm test`. Stryker points here from tests/stryker.config.mjs.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root,
  test: {
    include: ['tests/{contract,games,replays,sim}/**/*.test.ts'],
    // The key check reads git and the real key file; it tests the repo, not the rules.
    exclude: ['tests/sim/key-hygiene.test.ts', '**/node_modules/**'],
    environment: 'node',
    reporters: ['dot'],
    testTimeout: 120_000,
    printConsoleTrace: false,
    env: { SIM_GAMES: '200', SIM_MASS_GAMES: '60', JEV: 'off' },
  },
});
