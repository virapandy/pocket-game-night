import { build, defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

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

// The tap-through prototype (docs/proposals/design-before-code.md, stage 2): one page per game with a screen map,
// at <base>proto/<game>/ (src/proto), its files under proto/. Preview and local builds only; the families' release
// build leaves it out. It is built on its own after the app, so the app's own files stay exactly as they were.
const GAMES_DOCS = new URL('./docs/games/', import.meta.url);
const PROTO_HTML = 'src/proto/index.html';
function screenMapGames(): string[] {
  return readdirSync(GAMES_DOCS).filter((g) => existsSync(new URL(`${g}/screen-map.md`, GAMES_DOCS)));
}
/** `virtual:screen-maps`: every docs/games/<game>/screen-map.md (and its scenarios.md) as text; in dev, <base>proto/… serves the page. */
function screenMaps(): Plugin {
  const id = 'virtual:screen-maps';
  return {
    name: 'pgn-screen-maps',
    resolveId: (source) => (source === id ? `\0${id}` : null),
    load(source) {
      if (source !== `\0${id}`) return null;
      const maps: Record<string, string> = {};
      // The scenarios too: a prototype script may show a scenario's full text ("S5 shows the full How to play text").
      const scenarios: Record<string, string> = {};
      for (const g of screenMapGames()) {
        const file = new URL(`${g}/screen-map.md`, GAMES_DOCS);
        this.addWatchFile(file.pathname);
        maps[g] = readFileSync(file, 'utf8');
        const sc = new URL(`${g}/scenarios.md`, GAMES_DOCS);
        if (existsSync(sc)) {
          this.addWatchFile(sc.pathname);
          scenarios[g] = readFileSync(sc, 'utf8');
        }
      }
      return `export default ${JSON.stringify(maps)};\nexport const scenarios = ${JSON.stringify(scenarios)};`;
    },
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && new RegExp(`^${BASE}proto(/[^./?#]*)*/?([?#].*)?$`).test(req.url)) req.url = `${BASE}${PROTO_HTML}`;
        next();
      });
    },
  };
}
/** After the app's build: builds the prototype page and writes it once per game (and once as the list of games). */
function prototypes(mode: string): Plugin {
  let outDir = 'dist';
  return {
    name: 'pgn-prototypes',
    apply: 'build',
    configResolved: (config) => void (outDir = config.build.outDir),
    async closeBundle() {
      await build({
        configFile: false,
        mode,
        base: BASE,
        logLevel: 'warn',
        plugins: [
          react(),
          screenMaps(),
          {
            name: 'pgn-prototype-pages',
            enforce: 'post',
            generateBundle(_options, bundle) {
              const page = bundle[PROTO_HTML];
              if (!page || page.type !== 'asset') return;
              delete bundle[PROTO_HTML];
              for (const g of ['', ...screenMapGames()]) {
                this.emitFile({ type: 'asset', fileName: `proto/${g ? `${g}/` : ''}index.html`, source: page.source });
              }
            },
          },
        ],
        build: { outDir, emptyOutDir: false, assetsDir: 'proto/assets', rollupOptions: { input: PROTO_HTML } },
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const withPrototypes = mode !== 'release';
  return {
    base: BASE,
    server: { port: port(env.DEV_PORT, 5173) },
    preview: { port: port(env.PREVIEW_PORT, 4173) },
    define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
    plugins: [
      react(),
      screenMaps(),
      ...(withPrototypes ? [prototypes(mode)] : []),
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
          // The prototype pages are not part of the app.
          globIgnores: ['proto/**'],
          navigateFallback: `${BASE}index.html`,
          // The families' app must never answer for the preview, which lives inside its path.
          // Nor for the prototype pages, which are their own pages.
          navigateFallbackDenylist: [new RegExp(`^${BASE}proto/`), ...(IS_PREVIEW ? [] : [new RegExp(`^${BASE}preview/`)])],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
  };
});
