import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// The version shown in problem reports (PLT-200): package.json's version plus the commit, when automation builds it.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
const commit = process.env.GITHUB_SHA?.slice(0, 7);
const APP_VERSION = commit ? `${pkg.version}+${commit}` : `${pkg.version}+local`;

// Served from GitHub Pages at https://virapandy.github.io/pocket-game-night/.
// Local preview uses the same path, so browser tests see exactly what is deployed.
export const BASE = '/pocket-game-night/';

export default defineConfig({
  base: BASE,
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  plugins: [
    react(),
    VitePWA({
      // Updates are offered on the home screen only, never mid-game (docs/handover.md).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pocket Game Night',
        short_name: 'Game Night',
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
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
