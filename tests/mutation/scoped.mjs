// Scoped mutation testing (change SOP, owner 3 October 2026: docs/change-sop.md, docs/decisions.md 2026-10-03).
// A C3 change gets Stryker's deliberate mistakes only on the rules and money lines it touched; a release gets them on
// every such line changed since the last release; the full run (tests/stryker.config.mjs) stays weekly.
//
// Run from the repo root:
//   node tests/mutation/scoped.mjs <git range> [--whole-files] [--only <path>] [--concurrency <n>] [--dry-run]
//   node tests/mutation/scoped.mjs d0cdd8c..HEAD                 a C3 change: the lines it touched
//   node tests/mutation/scoped.mjs <last release>..HEAD --whole-files   a release: every changed rules or money file
// The range defaults to HEAD~1..HEAD. On the owner's Mac, run it as
//   caffeinate -i taskpolicy -b node tests/mutation/scoped.mjs <range>        (concurrency is capped at 3 there)
//
// Which files count (the same rules and money code the weekly run mutates): src/games/<game>/rules/**/*.ts and
// src/engine/money.ts, tally.ts, session.ts. Lines the weekly config leaves out (a Stryker limit, see
// tests/stryker.config.mjs) are left out here too. With nothing to mutate it says so and exits 0 (green).
// Report-only, like the weekly run: a low score never fails; a Stryker crash exits non-zero (a setup problem).
// Output: Stryker's report in reports/stryker/scoped/ (gitignored) and a short summary in reports/mutation-scoped.md.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import base from '../stryker.config.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const range = args.find((a, i) => !a.startsWith('--') && !['--only', '--concurrency'].includes(args[i - 1])) ?? 'HEAD~1..HEAD';
const wholeFiles = flag('--whole-files');
const only = value('--only');
const dryRun = flag('--dry-run');
const cap = process.env.CI ? 8 : 3; // the owner's Mac: at most 3 at once (owner, 3 October 2026)
const concurrency = Math.min(Number(value('--concurrency') ?? base.concurrency ?? 2), cap);

const RULES = /^src\/games\/[^/]+\/rules\/.+\.ts$/;
const MONEY = new Set(['src/engine/money.ts', 'src/engine/tally.ts', 'src/engine/session.ts']);
const counts = (f) => (RULES.test(f) || MONEY.has(f)) && !/\.(test|spec|d)\.ts$/.test(f);

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });

// Changed files that still exist after the range (added or modified, renames followed).
const files = git('diff', '--name-only', '--diff-filter=AMR', range, '--', 'src')
  .split('\n').map((s) => s.trim()).filter(Boolean).filter(counts).filter((f) => !only || f === only).filter((f) => existsSync(f));

/** Lines added or changed in the new version of a file, as [start, end] pairs, merged. */
function touchedLines(file) {
  const out = [];
  for (const m of git('diff', '-U0', range, '--', file).matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(m[1]), len = m[2] === undefined ? 1 : Number(m[2]);
    if (len > 0) out.push([start, start + len - 1]);
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of out) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

/** What the weekly config allows per file: null = the whole file; otherwise its line ranges. */
function allowedByBase(file) {
  const ranges = [];
  for (const entry of base.mutate) {
    const [path, lines] = entry.split(':');
    if (path !== file) continue;
    if (!lines) return null;
    const [a, b] = lines.split('-').map(Number);
    ranges.push([a, b ?? a]);
  }
  return ranges.length ? ranges : null;
}

function intersect(a, b) {
  const out = [];
  for (const [s1, e1] of a) for (const [s2, e2] of b) {
    const s = Math.max(s1, s2), e = Math.min(e1, e2);
    if (s <= e) out.push([s, e]);
  }
  return out;
}

// Line numbers come from the end of the range, while Stryker mutates the files as they are now: warn if they differ.
const end = range.includes('..') ? range.split(/\.\.\.?/)[1] || 'HEAD' : 'HEAD';
const movedSince = files.filter((f) => git('diff', '--name-only', end, '--', f).trim() !== '');
if (!wholeFiles && movedSince.length) console.warn(`Warning: ${movedSince.join(', ')} changed after ${end}; line numbers may be off. End the range at HEAD.`);

const mutate = [];
for (const file of files) {
  const length = readFileSync(file, 'utf8').split('\n').length;
  let ranges = wholeFiles ? [[1, length]] : touchedLines(file);
  const allowed = allowedByBase(file);
  if (allowed) ranges = intersect(ranges, allowed);
  if (wholeFiles && !allowed) { mutate.push(file); continue; }
  for (const [s, e] of ranges) mutate.push(`${file}:${s}-${e}`);
}

const summaryFile = 'reports/mutation-scoped.md';
if (mutate.length === 0) {
  const msg = `No rules or money lines changed in ${range}${only ? ` (only ${only})` : ''}: nothing to mutate. Green.`;
  console.log(msg);
  if (!dryRun) writeFileSync(summaryFile, `# Scoped mutation (docs/change-sop.md)\n\nRange: \`${range}\`\n\n${msg}\n`);
  process.exit(0);
}

console.log(`Scoped mutation for ${range}${wholeFiles ? ' (whole files)' : ''}, concurrency ${concurrency}:\n  ${mutate.join('\n  ')}`);
if (dryRun) process.exit(0);

mkdirSync('reports/stryker/scoped', { recursive: true });
const started = Date.now();
const run = spawnSync('npx', ['stryker', 'run', 'tests/mutation/stryker.scoped.config.mjs', '--concurrency', String(concurrency)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  encoding: 'utf8',
  env: { ...process.env, PGN_SCOPED_MUTATE: JSON.stringify(mutate) },
  maxBuffer: 256 * 1024 * 1024,
});
const seconds = Math.round((Date.now() - started) / 1000);
const reportPath = 'reports/stryker/scoped/mutation.json';
if (run.status !== 0 || !existsSync(reportPath)) {
  const tail = `${run.stdout ?? ''}\n${run.stderr ?? ''}`.trim().split('\n').slice(-15).join('\n');
  writeFileSync(summaryFile, `# Scoped mutation (docs/change-sop.md)\n\nRange: \`${range}\`\n\nStryker did not finish (exit ${run.status}, ${seconds} s). Setup problem, not an app bug.\n\n\`\`\`\n${tail}\n\`\`\`\n`);
  console.error(`Stryker did not finish (exit ${run.status}). See ${summaryFile}.`);
  process.exit(run.status || 1);
}

// The summary: share caught per file, and every mistake no test caught.
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const CAUGHT = new Set(['Killed', 'Timeout']), MISSED = new Set(['Survived', 'NoCoverage']);
let caught = 0, missed = 0;
const rows = [], misses = [];
for (const [file, { mutants, source }] of Object.entries(report.files)) {
  const lines = source.split('\n');
  let c = 0, m = 0;
  for (const mu of mutants) {
    if (CAUGHT.has(mu.status)) c++;
    else if (MISSED.has(mu.status)) {
      m++;
      const line = mu.location.start.line;
      misses.push(`- \`${file}:${line}\` ${mu.mutatorName} (${mu.status === 'NoCoverage' ? 'no test runs this line' : 'no test noticed'}): \`${(lines[line - 1] ?? '').trim().slice(0, 100)}\``);
    }
  }
  caught += c; missed += m;
  if (c + m) rows.push(`| \`${file}\` | ${c} | ${m} | ${Math.round((100 * c) / (c + m))}% |`);
}
const score = caught + missed ? Math.round((100 * caught) / (caught + missed)) : 100;
writeFileSync(summaryFile, [
  '# Scoped mutation (docs/change-sop.md)', '',
  `Range: \`${range}\`${wholeFiles ? ' (whole files)' : ' (lines touched)'} · ${seconds} s · concurrency ${concurrency} · target 80% (report-only)`, '',
  `Caught ${caught} of ${caught + missed} deliberate mistakes: **${score}%**.`, '',
  '| File | Caught | Missed | Score |', '|---|---|---|---|', ...rows, '',
  misses.length ? '## Mistakes no test caught' : 'Every mistake was caught.', ...misses, '',
].join('\n'));
console.log(`Scoped mutation: ${score}% caught (${caught} of ${caught + missed}) in ${seconds} s. Summary: ${summaryFile}`);
