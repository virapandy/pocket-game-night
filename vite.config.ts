import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// The version shown in problem reports (PLT-200): package.json's version plus the commit, when automation builds it.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
const commit = process.env.GITHUB_SHA?.slice(0, 7);
const APP_VERSION = commit ? `${pkg.version}+${commit}` : `${pkg.version}+local`;

// Served from GitHub Pages at https://virapandy.github.io/pocket-game-night/ (the families' link).
// Local preview uses the same path, so browser tests see exactly what is deployed.
// Automation also builds the owner's preview with APP_BASE=/pocket-game-night/preview/: its own path,
// its own service worker scope and its own installed app, so it never replaces the families' app.
const FAMILIES_BASE = '/pocket-game-night/';
export const BASE = process.env.APP_BASE || FAMILIES_BASE;
const IS_PREVIEW = BASE !== FAMILIES_BASE;

// Per-copy ports: each working copy (main, lane-a, -b, -c) can set DEV_PORT and PREVIEW_PORT in its own
// gitignored .env.local, so several copies serve side by side. Defaults stay 5173 (dev) and 4173 (preview);
// a --port on the command line (as the browser tests pass) still wins.
function port(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : fallback;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: BASE,
    server: { port: port(env.DEV_PORT, 5173) },
    preview: { port: port(env.PREVIEW_PORT, 4173) },
    define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
    plugins: [
      react(),
      VitePWA({
        // Updates are offered on the home screen only, never mid-game (docs/handover.md).
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: IS_PREVIEW ? 'Pocket Game Night (preview)' : 'Pocket Game Night',
          short_name: IS_PREVIEW ? 'GN preview' : 'Game Night',
          description: 'Run in-person party and card games from one phone.',
          start_url: BASE,
          scope: BASE,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#fffaf2',
          theme_color: '#b3261e',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Open once, then works offline: precache the whole app shell and content on first visit.
          globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
          navigateFallback: `${BASE}index.html`,
          // The families' app must never answer for the preview, which lives inside its path.
          navigateFallbackDenylist: IS_PREVIEW ? [] : [new RegExp(`^${BASE}preview/`)],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
  };
});
