// Runs the one-off simulated-table scripts (not part of npm test; its own config, so the normal include never sees them).
//   SIM_MODE=deal npx vitest run --config tests/tools/sim-table/vitest.config.ts deal
//   SIM_MODE=play npx vitest run --config tests/tools/sim-table/vitest.config.ts play
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('../../..', import.meta.url)),
  test: {
    include: ['tests/tools/sim-table/*.sim.ts'],
    environment: 'node',
    reporters: ['default'],
    testTimeout: 6 * 60 * 60 * 1000,
  },
});
