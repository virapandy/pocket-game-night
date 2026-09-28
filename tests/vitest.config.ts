// Rule, property, contract, replay and simulation tests (everything except the browser).
// Run from the repo root: `npm test`. Failures only; passing tests stay quiet.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root,
  test: {
    include: ['tests/{contract,games,replays,sim}/**/*.test.ts'],
    environment: 'node',
    reporters: ['dot'],
    // Simulations and property tests run thousands of games.
    testTimeout: 120_000,
    // Failing property tests print their seed and path; re-run with FC_SEED to reproduce.
    printConsoleTrace: false,
  },
});
