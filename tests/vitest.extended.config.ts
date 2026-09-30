// The long, scheduled runs (PLT-118): mass simulations and the optional Jev step. Not part of `npm test`.
// Run from the repo root: `npx vitest run --config tests/vitest.extended.config.ts` (a script is requested from Build).
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root,
  test: {
    include: ['tests/sim/**/*.run.ts'],
    environment: 'node',
    reporters: ['dot'],
    testTimeout: 6 * 60 * 60 * 1000,
    printConsoleTrace: false,
  },
});
