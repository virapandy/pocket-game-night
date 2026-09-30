// Android phone emulator runs (PLT-120, PLT-121): Chrome for Android on a real emulator, driven over adb.
// Not part of `npm run test:browser`: it needs an emulator that is already running (tests/android/README.md).
// Run from the repo root: `npm run build && npx playwright test --config tests/playwright.android.config.ts`.
import { defineConfig } from '@playwright/test';

const PORT = 4173;
export const APP_URL = `http://localhost:${PORT}/pocket-game-night/`;

export default defineConfig({
  testDir: './android',
  outputDir: '../test-results/android',
  fullyParallel: false,
  workers: 1, // one emulator, one Chrome
  forbidOnly: !!process.env.CI,
  retries: 1, // PLT-122: an emulator run is retried once; a failure that repeats is a real bug
  reporter: process.env.CI ? [['github'], ['line']] : [['line']],
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: { baseURL: APP_URL, actionTimeout: 20_000 },
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    cwd: '..',
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
