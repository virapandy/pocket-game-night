# Jev design check (a tool, not a test)

Not part of `npm test`; needs no vitest or playwright. Generalises `tests/tools/jev-map-walk.ts`. Uses `tests/sim/jev.ts`
(key from `JEV_API_KEY` or the gitignored `.env.local`, retry once, redaction). Talks only to the Jev API; never fetches a
web page; never prints the key. Reads only the files named below; paths may be anywhere (product clone docs, a scratchpad).

```
cd /Users/virat/Documents/Game_On/pocket-game-night-testing && node tests/tools/jev-design/run.ts \
  --budget product --game what-am-i \
  --map /Users/virat/Documents/Game_On/pocket-game-night-product/docs/games/what-am-i/screen-map.md \
  --words /Users/virat/Documents/Game_On/pocket-game-night-product/docs/games/what-am-i/words.csv \
  --out <report path>
```

Options: `--map` and/or `--words` (at least one); `--out` (required); `--game` (label); `--budget product|test` (default `test`).
Small slices for trials: `--screens N`, `--max-words N`, `--max-labels N`.

- Screen map: each `### ID. Name` section is a screen; buttons are the first column of its tables; the main button is the
  one named by `main "..."` in the Words line (screens without it are asked but not judged). Per screen, one call of 9
  questions: next button, the same for six personas, way out, purpose; then per-label "understood at once".
- Words: `words.csv` with a `word` column (and optional `id`). Per word: known to a mixed-region Indian family (8 to 80,
  including a non-Hindi speaker from Tirunelveli), can be acted or described, political or religious-sensitive.
- Every question is a Choice with an "uncertain" option.
- Budget: `test` counts only towards the shared 50,000 a week (`reports/runs/jev-usage.json`). `product` also keeps
  `reports/runs/jev-usage-product.json` (gitignored, per ISO week) and stops at 15,000; each decision counts in both files.
  The run stops cleanly at either limit and the report says which.
