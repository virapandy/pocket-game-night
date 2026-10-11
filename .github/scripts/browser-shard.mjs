// Splits the browser tests into shards that take about the same time (quick.yml, "Every browser test").
// Playwright's own --shard cuts the test list into consecutive slices, so the slow files (the long Tambola games)
// landed together in one shard (6.6 and 12.2 minutes on 11 October). This spreads every file's tests over all shards
// instead: each test location (file:line:column; tests made in a loop share one) goes, in list order, to the shard
// with the fewest tests so far. Every shard computes the same split from the same commit, so every test runs in
// exactly one shard.
// Usage: node .github/scripts/browser-shard.mjs <JSON from `playwright test --list --reporter=json`> <shard> <total>
// Prints this shard's locations, one per line, as Playwright location filters (nothing when it has no tests).
import { readFileSync } from 'node:fs';

const [file, shardArg, totalArg] = process.argv.slice(2);
const shard = Number(shardArg);
const total = Number(totalArg);
if (!file || !Number.isInteger(shard) || !Number.isInteger(total) || shard < 1 || shard > total) {
  console.error('Usage: node .github/scripts/browser-shard.mjs <list.json> <shard> <total>');
  process.exit(2);
}

const report = JSON.parse(readFileSync(file, 'utf8'));
const units = new Map(); // "file:line:column" -> number of tests there, in the list's order
const walk = (suite) => {
  for (const spec of suite.specs ?? []) {
    const key = `${spec.file}:${spec.line}:${spec.column}`;
    units.set(key, (units.get(key) ?? 0) + (spec.tests?.length ?? 1));
  }
  for (const child of suite.suites ?? []) walk(child);
};
for (const suite of report.suites ?? []) walk(suite);

const counts = Array(total).fill(0);
const mine = [];
for (const [key, n] of units) {
  let pick = 0;
  for (let i = 1; i < total; i++) if (counts[i] < counts[pick]) pick = i;
  counts[pick] += n;
  if (pick === shard - 1) mine.push(key);
}

// A location filter's file part is a regular expression on the full path: anchor it to the whole file name.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const key of mine) {
  const [, name, line, column] = /^(.*):(\d+):(\d+)$/.exec(key);
  console.log(`/${escape(name)}$:${line}:${column}`);
}
console.error(
  `Shard ${shard} of ${total}: ${counts[shard - 1]} tests at ${mine.length} locations (all shards: ${counts.join(', ')}).`,
);
