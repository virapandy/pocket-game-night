# Noto Sans (the app's one font)

Shipped with the app so every phone and test machine draws text the same way (owner, 11 October 2026,
`docs/proposals/faster-cycles.md` item 3). No font service is called at run time; the service worker
precaches these files, so the app works offline.

- `noto-sans-400.woff2`, `noto-sans-700.woff2`: Noto Sans regular and bold, Latin subset, copied unchanged
  from `@fontsource/noto-sans` 5.3.0 (`files/noto-sans-latin-400-normal.woff2`, `-700-normal.woff2`).
  Not an npm dependency: a one-off copy (`npm pack @fontsource/noto-sans`).
- `OFL.txt`: the SIL Open Font License 1.1 they are released under.

Declared in `src/app/styles.css` (`@font-face`) and preloaded in `index.html`.
