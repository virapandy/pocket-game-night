// One line for the owner (docs/proposals/e2e-and-jev-testing.md, "What the owner sees"), from reports/sim/screen/*.json
// (every shard's results, gathered in one folder). Writes reports/sim/screen-summary.md and prints it.
// Run: node tests/sims/summary.mjs [folder]
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const dir = process.argv[2] ?? 'reports/sim/screen';
const files = existsSync(dir) ? readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.json')) : [];
const all = files.map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))).filter((r) => r && r.seed && r.config);
const withJev = all.filter((r) => r.config.persona && r.jevDecisions > 0).length;
const count = (k) => all.reduce((n, r) => n + r.findings.filter((f) => k.includes(f.kind)).length, 0);
const flags = all.flatMap((r) => r.flags.map((f) => ({ seed: r.seed, ...f })));
const line = `${all.length} evenings played (${withJev} with Jev people): ${count(['dead end', 'did not finish', 'crash'])} dead ends, ` +
  `${count(['secret shown'])} secrets shown, ${flags.length} screens flagged confusing, ${count(['layout'])} layout breaks` +
  `; also ${count(['main button'])} main-button and ${count(['console error'])} console-error findings, ${count(['not recognised'])} screens not recognised.`;
// Secret Words evenings (tests/sims/secret-words-runner.ts): per evening, where the persona got stuck, screens with no clear
// way on, and any privacy slip (a face-down word's kind visible to the room).
function swSection() {
  const sw = all.filter((r) => r.game === 'Secret Words');
  if (!sw.length) return [];
  const personaOf = (r) => r.config.personaPlayed ?? r.config.persona ?? 'scripted';
  const of = (r, ks) => r.findings.filter((f) => ks.includes(f.kind));
  const lines = ['', '## Secret Words evenings', '',
    `${sw.length} evenings played (${sw.filter((r) => r.config.persona && r.jevDecisions > 0).length} with Jev people), ${sw.filter((r) => r.finished).length} reached Home after the summary; ` +
    `${sw.reduce((n, r) => n + of(r, ['secret shown']).length, 0)} privacy slips, ${sw.reduce((n, r) => n + (r.stuckAt?.length ?? 0), 0)} places where the persona got stuck, ` +
    `${sw.reduce((n, r) => n + of(r, ['no clear way on']).length, 0)} screens with no clear way on, ${sw.reduce((n, r) => n + of(r, ['map phone']).length, 0)} map phone problems.`, ''];
  for (const r of sw) {
    const notes = [];
    const stuck = (r.stuckAt ?? []).map((x) => `${x.screen} (${x.steps} steps)`);
    if (stuck.length) notes.push(`stuck at ${[...new Set(stuck)].join(', ')}`);
    if ((r.noWayOn ?? []).length) notes.push(`no clear way on at ${r.noWayOn.join(', ')}`);
    const slips = [...new Set(of(r, ['secret shown']).map((f) => `${f.screen}: ${f.detail}`))].slice(0, 2);
    if (slips.length) notes.push(`PRIVACY: ${slips.join(' | ')}`);
    const other = [...new Set(r.findings.filter((f) => !['secret shown', 'stuck', 'no clear way on'].includes(f.kind)).map((f) => `${f.kind} on ${f.screen}: ${f.detail}`))].slice(0, 3);
    if (other.length) notes.push(other.join(' | '));
    lines.push(`- ${r.seed} (${personaOf(r)}, ${r.phones} phone${r.phones > 1 ? 's' : ''}, ${r.config.board}, ${r.games} game${r.games === 1 ? '' : 's'}, ${r.steps} steps): ${notes.length ? notes.join('; ') : 'played end to end, nothing to report'}`);
  }
  return lines;
}

const out = [`# Screen simulations`, '', line, '', '## Failing evenings (replays in tests/replays/screen/)', '',
  ...all.filter((r) => r.findings.length).map((r) => `- ${r.seed} (${r.config.width} × ${r.config.height}, ${r.config.players.length} players): ` +
    [...new Set(r.findings.map((f) => `${f.kind} on ${f.screen}: ${f.detail}`))].slice(0, 4).join(' | ')),
  '', '## Screens flagged confusing (Jev)', '', ...flags.map((f) => `- ${f.seed} step ${f.step}, ${f.screen}: Jev would tap "${f.jevChoice}" (${f.probability}), main button "${f.mainButton}". ${f.screenshot}`),
  ...swSection(),
  '', `Jev decisions: ${all.reduce((n, r) => n + (r.jevDecisions || 0), 0)}.`];
writeFileSync('reports/sim/screen-summary.md', out.join('\n') + '\n');
console.log(out.join('\n'));
