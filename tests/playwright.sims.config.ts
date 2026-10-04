// Screen simulations (layers 3 and 4 of docs/proposals/e2e-and-jev-testing.md): whole Impostor evenings through the
// preview build in a hidden browser. Not part of `npm run test:browser`; run on GitHub (weekly, or on request):
//   npm run build && npx playwright test --config tests/playwright.sims.config.ts --shard=1/4
// Settings: SIM_EVENINGS (default 4), SIM_JEV_EVENINGS (default 0; evenings played by Jev personas when a key is
// present), SIM_RUN (a name that makes this run's seeds), JEV_DECISIONS (most Jev decisions per job, default 400).
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
export const APP_URL = `http://localhost:${PORT}/pocket-game-night/`;

export default defineConfig({
  testDir: './sims',
  testMatch: '*.sim.ts',
  outputDir: '../test-results/sims',
  fullyParallel: true,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['line']] : [['line']],
  timeout: 6 * 60_000,
  use: { baseURL: APP_URL, trace: 'off', serviceWorkers: 'allow', actionTimeout: 5_000 },
  projects: [{ name: 'sim', use: { ...devices['Pixel 7'], launchOptions: { args: ['--mute-audio'] } } }],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    cwd: '..',
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
