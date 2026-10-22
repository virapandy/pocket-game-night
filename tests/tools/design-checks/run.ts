// Design rule checks. Usage:
//   node tests/tools/design-checks/run.ts <screen-map.md> [--scenarios <scenarios.md>] [--report <out.md>]
//   node tests/tools/design-checks/run.ts --self-test
// Exit code 0 always (report-only); the counts are printed. Not a test; `npm test` never runs it.
import { readFileSync, writeFileSync } from 'node:fs';
import { readMap } from './read-map.ts';
import { runRules, SECRET_WORDS, type Config } from './rules.ts';
import type { Result, ScreenSet } from './model.ts';

export function scenarioIdsIn(file: string): Set<string> {
  return new Set([...readFileSync(file, 'utf8').matchAll(/\bSWD-\d{3}\b/g)].map((m) => m[0]));
}

export function toMarkdown(set: ScreenSet, results: Result[], title: string, extra: string[] = []): string {
  const F = results.filter((r) => r.kind === 'finding');
  const C = results.filter((r) => r.kind === 'cannot' && !r.text.startsWith('ACCEPTED'));
  const A = results.filter((r) => r.text.startsWith('ACCEPTED'));
  const order = new Map(set.screens.map((s, i) => [s.id, i]));
  const sorter = (a: Result, b: Result) => (order.get(a.screen) ?? -1) - (order.get(b.screen) ?? -1) || a.rule.localeCompare(b.rule);
  const name = (id: string) => set.screens.find((s) => s.id === id)?.name ?? '(whole map)';
  const L: string[] = [];
  L.push(`# ${title}`, '', `Source: \`${set.source}\`. ${set.screens.length} screens and dialogs, ${set.screens.reduce((n, s) => n + s.buttons.length, 0)} button rows read.`, '',
    `**Findings: ${F.length}. Cannot check: ${C.length}. Accepted exceptions: ${A.length}. Tool faults: ${set.faults.length}.**`, '');
  L.push('## Findings, by screen', '');
  if (!F.length) L.push('None.', '');
  const rules = [...new Set(F.map((r) => r.rule))].sort();
  L.push('Counts by rule: ' + (rules.map((r) => `${r} ${F.filter((x) => x.rule === r).length}`).join(' · ') || 'none'), '');
  let last = '';
  for (const r of [...F].sort(sorter)) {
    if (r.screen !== last) { L.push('', `### ${r.screen} ${name(r.screen)}`); last = r.screen; }
    L.push(`- **${r.rule}**: ${r.text}`);
  }
  L.push('', '## Cannot check (the map does not say enough)', '');
  if (!C.length) L.push('None.');
  last = '';
  for (const r of [...C].sort(sorter)) {
    if (r.screen !== last) { L.push('', `### ${r.screen} ${name(r.screen)}`); last = r.screen; }
    L.push(`- ${r.rule}: ${r.text}`);
  }
  L.push('', '## Accepted exceptions (a decision accepts these; not findings)', '');
  for (const r of A) L.push(`- ${r.screen} ${r.rule}: ${r.text.replace('ACCEPTED EXCEPTION ', '')}`);
  if (!A.length) L.push('None.');
  L.push('', '## Tool faults (about the script or the map file format, not about the design)', '');
  if (!set.faults.length && !extra.length) L.push('None.');
  for (const x of [...set.faults, ...extra]) L.push(`- ${x}`);
  L.push('');
  return L.join('\n');
}

function main(): void {
  const a = process.argv.slice(2);
  if (a[0] === '--self-test') { import('./selftest.ts'); return; }
  const file = a.find((x) => !x.startsWith('--') && a[a.indexOf(x) - 1] !== '--scenarios' && a[a.indexOf(x) - 1] !== '--report');
  if (!file) { console.error('usage: node tests/tools/design-checks/run.ts <screen-map.md> [--scenarios file] [--report out.md]'); process.exit(2); }
  const opt = (n: string) => (a.includes(n) ? a[a.indexOf(n) + 1] : undefined);
  const sc = opt('--scenarios');
  const cfg: Config = { ...SECRET_WORDS, knownScenarioIds: sc ? scenarioIdsIn(sc) : null };
  const set = readMap(file);
  const seen = new Set<string>();
  const results = runRules(set, cfg).filter((r) => { const k = `${r.kind}|${r.rule}|${r.screen}|${r.text}`; return !seen.has(k) && !!seen.add(k); });
  const extra = ['limit of the map format, not a fault: it has no screen-kind tag, so which screens are "between rounds", "game steps" or "not secret any more" is a setting in rules.ts (SECRET_WORDS), and R7 recognises secrets by phrases such as "Your words" and "Hide map"', ...(sc ? [] : ['no --scenarios file given, so scenario ids were not checked to exist (R6 checked only that an id is written)']) ];
  const md = toMarkdown(set, results, 'Design rule checks', extra);
  const rep = opt('--report');
  if (rep) writeFileSync(rep, md); else console.log(md);
  const n = (k: string) => results.filter((r) => r.kind === k && !r.text.startsWith('ACCEPTED')).length;
  console.error(`findings ${n('finding')}, cannot check ${n('cannot')}, tool faults ${set.faults.length}`);
}
if (process.argv[1]?.endsWith('design-checks/run.ts')) main();
