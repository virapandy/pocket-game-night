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
const out = [`# Screen simulations`, '', line, '', '## Failing evenings (replays in tests/replays/screen/)', '',
  ...all.filter((r) => r.findings.length).map((r) => `- ${r.seed} (${r.config.width} × ${r.config.height}, ${r.config.players.length} players): ` +
    [...new Set(r.findings.map((f) => `${f.kind} on ${f.screen}: ${f.detail}`))].slice(0, 4).join(' | ')),
  '', '## Screens flagged confusing (Jev)', '', ...flags.map((f) => `- ${f.seed} step ${f.step}, ${f.screen}: Jev would tap "${f.jevChoice}" (${f.probability}), main button "${f.mainButton}". ${f.screenshot}`),
  '', `Jev decisions: ${all.reduce((n, r) => n + (r.jevDecisions || 0), 0)}.`];
writeFileSync('reports/sim/screen-summary.md', out.join('\n') + '\n');
console.log(out.join('\n'));
