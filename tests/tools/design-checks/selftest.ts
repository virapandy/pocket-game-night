// Self-test of the design rule checks: the fixture map has one deliberate fault per rule, and each must be reported.
// node tests/tools/design-checks/run.ts --self-test
import { readMap } from './read-map.ts';
import { runRules, SECRET_WORDS } from './rules.ts';

const set = readMap(new URL('./fixtures/bad-map.md', import.meta.url).pathname);
const res = runRules(set, { ...SECRET_WORDS, gameSteps: [], betweenRounds: { A3: { need: ['stop'], why: 'fixture' } }, knownScenarioIds: new Set(['SWD-001']) });
const has = (kind: string, rule: string, screen: string, re: RegExp) => res.some((r) => r.kind === kind && r.rule.startsWith(rule) && r.screen === screen && re.test(r.text));
const checks: [string, boolean][] = [
  ['R2 unknown target Z9', has('finding', 'R2', 'A1', /P9/)],
  ['R2 empty target', has('finding', 'R2', 'A1', /no "leads to"/)],
  ['R2 words-only target is "cannot"', has('cannot', 'R2', 'A2', /Pad/)],
  ['R1 dead end', has('finding', 'R1', 'A4', /no button leads to another screen/)],
  ['R3 stop missing on a between-rounds screen', has('finding', 'R3', 'A3', /stop/)],
  ['R4 destructive main', has('finding', 'R4', 'A2', /destructive/)],
  ['R4 two mains are "cannot"', has('cannot', 'R4', 'A2', /2 main labels/)],
  ['R5 banned word', has('finding', 'R5', 'A2', /spymaster/)],
  ['R5 bare Yes', has('finding', 'R5', 'A2', /bare yes/)],
  ['R6 hook without an id', has('finding', 'R6', 'A2', /records "deal"/)],
  ['R6 unknown scenario id', has('finding', 'R6', 'A2', /SWD-002/)],
  ['R7 secret with no hold', has('finding', 'R7', 'A3', /no hold/)],
];
let bad = 0;
for (const [n, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}`); if (!ok) bad++; }
console.log(bad ? `${bad} self-test check(s) failed: tool fault` : 'self-test passed');
process.exitCode = bad ? 1 : 0;
