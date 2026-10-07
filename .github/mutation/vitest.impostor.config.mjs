// Weekly mutation run, Impostor groups only (.github/workflows/mutation.yml): the tests Stryker runs against each
// deliberate mistake in src/games/impostor/rules/: Impostor's rule and property tests and its contract test.
// Automation settings (Build role), used only through .github/mutation/stryker.impostor.config.mjs; not by `npm test`.
// If the Test role adds its own Impostor mutation config in tests/, point the Stryker settings there and remove this.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

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
