// Turns Stryker's report (reports/stryker/mutation.json, gitignored) into the plain summary PLT-119 asks for:
// reports/mutation-latest.md with the share of deliberate mistakes caught, per file, and every mistake no test caught.
// Run from the repo root after `npm run test:mutation`: `node tests/mutation/summary.mjs`. Never fails the run.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const IN = 'reports/stryker/mutation.json';
const OUT = 'reports/mutation-latest.md';
const TARGET = 80;

if (!existsSync(IN)) {
  writeFileSync(OUT, `# Mutation testing (PLT-119)\n\nNo Stryker report found (${IN}): the run did not finish. Setup problem, not an app bug (PLT-122).\n`);
  process.exit(0);
}
const report = JSON.parse(readFileSync(IN, 'utf8'));
const CAUGHT = new Set(['Killed', 'Timeout']);
const MISSED = new Set(['Survived', 'NoCoverage']);
let caught = 0, missed = 0;
const rows = [], misses = [];
for (const [file, { mutants, source }] of Object.entries(report.files)) {
  let c = 0, m = 0;
  const lines = source.split('\n');
  for (const mu of mutants) {
    if (CAUGHT.has(mu.status)) c++;
    else if (MISSED.has(mu.status)) {
      m++;
      const line = mu.location.start.line;
      const code = (lines[line - 1] ?? '').trim().slice(0, 100);
      misses.push(`- \`${file}:${line}\` ${mu.mutatorName}${mu.replacement ? ` → \`${String(mu.replacement).replace(/\s+/g, ' ').slice(0, 60)}\`` : ''}` +
        ` (${mu.status === 'NoCoverage' ? 'no test runs this line' : 'no test noticed'}): \`${code}\``);
    }
  }
  caught += c; missed += m;
  rows.push(`| ${file} | ${c} | ${m} | ${c + m ? Math.round((100 * c) / (c + m)) : 100}% |`);
}
const score = caught + missed ? (100 * caught) / (caught + missed) : 100;
const out = [
  '# Mutation testing (PLT-119)',
  '',
  `Deliberate mistakes caught: **${score.toFixed(1)}%** (${caught} of ${caught + missed}); target ${TARGET}%: ${score >= TARGET ? 'met' : 'not met'}.`,
  'Mistakes that stop the code compiling or cannot run are not counted.',
  '',
  '| File | Caught | Not caught | Share caught |',
  '|---|---|---|---|',
  ...rows,
  '',
  '## Mistakes no test caught',
  'Each becomes a new test from an approved scenario, or a note that it cannot change behaviour.',
  '',
  ...(misses.length ? misses : ['- None.']),
  '',
  `_Written ${new Date().toISOString().slice(0, 10)}._`,
  '',
];
writeFileSync(OUT, out.join('\n'));
console.log(`Mutation score ${score.toFixed(1)}% (${caught}/${caught + missed}); ${misses.length} not caught; written ${OUT}`);
