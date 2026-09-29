// Browser tests: the built app, served exactly as it is published (under /pocket-game-night/).
// Run from the repo root: `npm run build && npm run test:browser`.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
export const APP_URL = `http://localhost:${PORT}/pocket-game-night/`;

export default defineConfig({
  testDir: './browser',
  outputDir: '../test-results/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // a flaky test is a finding, not something to retry away
  reporter: process.env.CI ? [['github'], ['line']] : [['line']],
  timeout: 30_000,
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
    actionTimeout: 10_000,
  },
  projects: [
    // A mid-range Android phone in portrait, the typical host phone.
    // --mute-audio: the computer running the tests stays quiet (see browser/fixtures.ts for WebKit too).
    { name: 'android', use: { ...devices['Pixel 7'], launchOptions: { args: ['--mute-audio'] } } },
    // iPhone Safari (WebKit): install tip, wake lock and storage differ there.
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    cwd: '..',
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
