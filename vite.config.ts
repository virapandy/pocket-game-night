import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from GitHub Pages at https://virapandy.github.io/pocket-game-night/.
// Local preview uses the same path, so browser tests see exactly what is deployed.
export const BASE = '/pocket-game-night/';

export default defineConfig({
  base: BASE,
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
