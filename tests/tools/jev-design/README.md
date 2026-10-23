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
  `reports/runs/jev-usage-product.json` (gitignored, per ISO week) and stops at 30,000 (raised from 15,000 on 23 October; the shared 50,000 stays the outer limit, both are counted); each decision counts in both files.
  The run stops cleanly at either limit and the report says which.

## Text check (`--texts`)

```
node tests/tools/jev-design/run.ts --budget product --game mafia \
  --texts /Users/virat/Documents/Game_On/pocket-game-night-product/docs/games/mafia/stories.csv --column text \
  --out <report path>
```

One Choice call per row, four questions each with "uncertain": (a) family-friendly, (b) understood by a mixed-region Indian
family, (c) scary for a 7-year-old, (d) would get a laugh. The report lists rows under 0.5 on (a) or (b), or over 0.5 on (c),
and the (d) rows under 0.5 as information. `--max-rows N` for a slice. Map mode now skips table rows whose first cell is a
dialog row ID (D1, D2 ...) or starts with "App hidden" or "A name".

## Mafia table simulation (`--sim mafia`)

```
node tests/tools/jev-design/run.ts --budget product --game mafia --sim mafia \
  --players 6,8,10,12,16 --games 20 --police-shares never,when-found --seed 1 --max-decisions 8000 \
  --out <report path>
```

`--no-nobody` (a flag, no value): the day point offers only the players still in, with no "nobody" (Jev chose "nobody" far
more than real people do). Ties and the second tie work as before. The report says which setting ran.

The referee is code (`sim-mafia.ts`: rules from `docs/games/mafia/guide.md`, MF1 to MF15); Jev only picks one name per
player per night or day, from the legal names (plus "nobody" by day, no "uncertain" option), given a fact list the code
writes (public facts plus that player's own private facts). Villagers' night "suspect" pick has no effect and is not asked.
`--police-shares when-found` adds "the Police says X is Mafia" to every player's facts that day if the Police is still in.
Game seeds come from `--seed`, size and game number; the report has one row per size and setting. The run stops cleanly at
`--max-decisions` or a budget limit (a cut-off game is not counted). Choices are saved beside the report as `<out>.json`;
`--replay <that file>` with the same other options replays the same games without calling Jev.

Self-test of the referee (no Jev, no budget, a few seconds): `node tests/tools/jev-design/run.ts --self-test`
(Mafia counts by size, Doctor rules, tie and second tie, Mafia win when equal, no private-role leaks, replayability).
