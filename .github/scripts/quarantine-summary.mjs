// Lists the quarantined browser tests' results (tests tagged @quarantine, tests/browser/README.md "Quarantine") on the
// run's summary page. Used by the non-blocking "Quarantined browser tests" steps in quick.yml and ci.yml: those tests
// run every time, and their results are shown here instead of turning the run red.
// Usage: node .github/scripts/quarantine-summary.mjs <Playwright JSON report> <heading>
import { readFileSync, appendFileSync, existsSync } from 'node:fs';

const [file, heading = 'Quarantined browser tests'] = process.argv.slice(2);
const lines = [`### ${heading} (non-blocking)`, ''];

if (!file || !existsSync(file)) {
  lines.push('No report was written: the quarantined tests did not run (see the step log).');
} else {
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const rows = [];
  const walk = (suite, path) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        const last = results[results.length - 1];
        const result = last ? last.status : test.status === 'skipped' ? 'skipped' : 'did not run';
        const note = (test.annotations ?? [])
          .filter((a) => a.type === 'quarantine')
          .map((a) => a.description)
          .join('; ');
        rows.push({ test: [...path, spec.title].join(' › '), file: spec.file, project: test.projectName, result, note });
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  // The top-level suites are the files; their titles are not part of a test's name.
  for (const suite of report.suites ?? []) walk(suite, []);
  const failed = rows.filter((r) => !['passed', 'skipped'].includes(r.result)).length;
  if (rows.length === 0) {
    lines.push('No quarantined tests in this run.');
  } else {
    lines.push(
      `${rows.length} quarantined test${rows.length === 1 ? '' : 's'}: ${rows.length - failed} passed or skipped, ` +
        `${failed} failed. They never block the run; the tester reports them under "Quarantined".`,
      '',
      '| Test | File | Phone | Result | Quarantine note |',
      '|---|---|---|---|---|',
    );
    const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    for (const r of rows) {
      lines.push(`| ${cell(r.test)} | ${cell(r.file)} | ${cell(r.project)} | ${cell(r.result)} | ${cell(r.note)} |`);
    }
  }
}

const text = lines.join('\n') + '\n';
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
process.stdout.write(text);
