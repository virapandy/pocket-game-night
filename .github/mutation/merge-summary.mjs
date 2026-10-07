// Weekly mutation run (.github/workflows/mutation.yml): merges every group's Stryker report into one summary with the
// share of deliberate mistakes caught per file and overall. A file split over several groups (line ranges) is added up.
// Usage: node .github/mutation/merge-summary.mjs <artifacts folder> <output .md>
// GROUPS (environment, space-separated) lists the groups the run should have; any without a report is named.
// Report-only: never fails.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const [dir = 'artifacts', out = 'mutation-weekly.md'] = process.argv.slice(2);
const expected = (process.env.GROUPS ?? '').split(/\s+/).filter(Boolean);
const CAUGHT = new Set(['Killed', 'Timeout']);
const MISSED = new Set(['Survived', 'NoCoverage']);
const TARGET = 80;

const found = existsSync(dir)
  ? readdirSync(dir).filter((d) => d.startsWith('mutation-') && d !== 'mutation-report').map((d) => d.slice('mutation-'.length))
  : [];
const groups = [...new Set([...expected, ...found])].sort();

const perFile = new Map(); // file -> { c, m }
const perGroup = [];
for (const g of groups) {
  const report = [`${dir}/mutation-${g}/stryker/mutation.json`, `${dir}/mutation-${g}/reports/stryker/mutation.json`].find(existsSync);
  if (!report) { perGroup.push({ g, done: false }); continue; }
  let c = 0, m = 0;
  try {
    for (const [file, { mutants }] of Object.entries(JSON.parse(readFileSync(report, 'utf8')).files)) {
      const t = perFile.get(file) ?? { c: 0, m: 0 };
      for (const mu of mutants) {
        if (CAUGHT.has(mu.status)) { c++; t.c++; } else if (MISSED.has(mu.status)) { m++; t.m++; }
      }
      perFile.set(file, t);
    }
    perGroup.push({ g, done: true, c, m });
  } catch {
    perGroup.push({ g, done: false });
  }
}

const pct = (c, m) => (c + m ? (100 * c) / (c + m) : 100);
let C = 0, M = 0;
for (const { c, m } of perFile.values()) { C += c; M += m; }
const finished = perGroup.filter((x) => x.done).length;

const lines = [
  '# Mutation testing, weekly (PLT-119)',
  '',
  finished
    ? `Overall (${finished} of ${groups.length} groups finished): **${pct(C, M).toFixed(1)}%** of deliberate mistakes caught (${C} of ${C + M}); target ${TARGET}%. Report-only.`
    : 'No group finished, so there is no overall score.',
  '',
  '| File | Caught | Not caught | Share caught |',
  '|---|---|---|---|',
  ...[...perFile.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([f, { c, m }]) => `| \`${f}\` | ${c} | ${m} | ${Math.round(pct(c, m))}% |`),
  '',
  '| Group | Result |',
  '|---|---|',
  ...perGroup.map((x) => `| ${x.g} | ${x.done ? `${Math.round(pct(x.c, x.m))}% (${x.c} of ${x.c + x.m})` : 'no report: did not finish'} |`),
  '',
  '## Each group\'s summary (with the mistakes no test caught)',
  '',
  ...groups.flatMap((g) => {
    const md = [`${dir}/mutation-${g}/mutation-latest.md`, `${dir}/mutation-${g}/reports/mutation-latest.md`].find(existsSync);
    return [`<details><summary>${g}</summary>`, '', md ? readFileSync(md, 'utf8').replace(/^# .*\n/, '') : 'No summary for this group: it did not finish.', '', '</details>', ''];
  }),
];
writeFileSync(out, lines.join('\n'));
console.log(`Merged ${finished} of ${groups.length} groups: ${pct(C, M).toFixed(1)}% caught; written ${out}`);
