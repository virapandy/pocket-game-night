// The tests Stryker runs against each deliberate mistake (PLT-119): every rule, property, contract, replay and
// simulation test, with the simulations shortened so a few thousand mistakes finish on a free machine.
// Not used by `npm test`. Stryker points here from tests/stryker.config.mjs.
// Scope (4 October 2026, docs/test-questions.md): Stryker only mutates Tambola's rules and the engine's money and
// tally code, so only Tambola's and the shared engine/platform tests run here. Other games' tests (Impostor so far)
// are left out: they never exercise the mutated files, and tests written ahead of their build (marked to fail)
// stopped Stryker's first run. When a new game's rules join `mutate`, add its tests here.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root,
  test: {
    include: ['tests/{contract,games/tambola,replays,sim}/**/*.test.ts'],
    // The key check reads git and the real key file; it tests the repo, not the rules.
    // Impostor's contract file runs Impostor only (see Scope above).
    exclude: ['tests/sim/key-hygiene.test.ts', 'tests/contract/impostor.test.ts', '**/node_modules/**'],
    environment: 'node',
    reporters: ['dot'],
    testTimeout: 120_000,
    printConsoleTrace: false,
    env: { SIM_GAMES: '200', SIM_MASS_GAMES: '60', JEV: 'off' },
  },
});
