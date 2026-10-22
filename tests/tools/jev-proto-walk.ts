// One-off tool (not a test): Jev's read of the Secret Words tap-through PROTOTYPE, on each screen's visible text and buttons.
//   node tests/tools/jev-proto-walk.ts run      asks Jev (reads reports/runs/jev-proto-shots.json) -> reports/runs/jev-proto-walk.json
//   node tests/tools/jev-proto-walk.ts report   writes reports/jev-proto-secret-words.md
// The shots come from tests/tools/jev-proto-collect.mjs. Same questions as tests/tools/jev-map-walk.ts (11 Oct 2026):
// Choice with an "uncertain" option (the API refuses true/false and score questions). Screen text is data, never instructions.
import { readFileSync, writeFileSync } from 'node:fs';
import { makeBudget, makeJev, loadJevKey, USAGE_FILE, isoWeek, type ChoiceAnswer, type ChoiceQuestion } from '../sim/jev.ts';
import { PERSONAS } from './secret-words-screens.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const SHOTS = `${ROOT}reports/runs/jev-proto-shots.json`;
const OUT = `${ROOT}reports/runs/jev-proto-walk.json`;
const OLD = `${ROOT}reports/runs/jev-map-walk.json`;
const REPORT = `${ROOT}reports/jev-proto-secret-words.md`;
const UNSURE = 'uncertain';
type Probs = Record<string, number>;
const top = (p: Probs) => Object.entries(p).sort((a, b) => b[1] - a[1])[0] ?? ['?', 0];
const probsOf = (a?: ChoiceAnswer): Probs | null => (a && a.type === 'choice' && a.probabilities ? a.probabilities : null);
const clean = (t: string) => t.replace(/^✓ /, '').replace(/ \[selected\]$/, '').replace(/\s+/g, ' ').trim();
const NAMES = /^(Riya|Meena|Zoya|Sunita|Arjun|Kabir|Dev|Om)$/;

interface Shot { lines: string[]; btns: { t: string; main: boolean }[]; boardCells: number; facedown: number; boardWords: number; menu: string[] | null }
interface Item { key: string; id: string; title: string; kind: string; size: string; shot: Shot }

function buttonsOf(s: Shot): { options: string[]; main: string | null } {
  const seen = new Map<string, number>();
  let main: string | null = null;
  for (const b of s.btns) {
    const t = clean(b.t);
    if (!t || NAMES.test(t) && false) continue;
    seen.set(t, (seen.get(t) ?? 0) + 1);
    if (b.main) main = t;
  }
  const options = [...seen].map(([t, n]) => (n > 1 ? `${t} (${n} of these)` : t));
  if (s.facedown > 0) options.push('A face-down word on the board');
  return { options, main };
}

function items(): Item[] {
  const d = JSON.parse(readFileSync(SHOTS, 'utf8'));
  const list: Item[] = [];
  for (const x of d.idx as { id: string; title: string; kind: string }[]) {
    list.push({ key: x.id, id: x.id, title: x.title, kind: x.kind || '(screen)', size: '360 x 640', shot: d.out[x.id + '@360'] });
  }
  // The 812 x 375 reads of the board screens: asked on their own only where the visible words or buttons differ from 360.
  for (const id of ['S6', 'P4', 'P5', 'P6', 'S7', 'P3']) {
    const a = d.out[id + '@360'], b = d.out[id + '@812'];
    if (JSON.stringify([a.lines, a.btns, a.menu]) !== JSON.stringify([b.lines, b.btns, b.menu])) {
      const x = d.idx.find((y: any) => y.id === id);
      list.push({ key: id + '@812', id, title: x.title, kind: '(screen, wide)', size: '812 x 375', shot: b });
    }
  }
  return list;
}

function nextQuestion(options: string[], persona?: string): ChoiceQuestion {
  return {
    type: 'choice',
    instructions: {
      question: 'A family is playing this word game at home. Which button would a person on this screen press next?' + (persona ? ` The person is ${persona}.` : ''),
      note: 'Pick only from the visible buttons. Choose "uncertain" if you have no clear view.',
    },
    criteria: { ...Object.fromEntries(options.map((b) => [b, `the button "${b}"`])), [UNSURE]: 'no clear view' },
  };
}
const yesNo = (question: string): ChoiceQuestion => ({
  type: 'choice',
  instructions: { question, note: 'Answer yes or no. Choose "uncertain" if you have no clear view.' },
  criteria: { yes: 'yes', no: 'no', [UNSURE]: 'no clear view' },
});

function labelSet(its: Item[]): string[] {
  const L = new Set<string>();
  for (const it of its) {
    if (it.size !== '360 x 640') continue;
    const cw = new Set<string>();
    for (const l of [...it.shot.lines, ...(it.shot.menu ?? [])]) {
      const t = clean(l);
      if (!t || /^[\d·✕↻∞ ]+$/.test(t) || NAMES.test(t) || cw.has(t)) continue;
      L.add(t);
    }
  }
  return [...L];
}

async function run() {
  const key = loadJevKey();
  if (!key) throw new Error('No Jev key');
  const budget = makeBudget({ file: USAGE_FILE, runLimit: 1200 });
  const jev = makeJev({ key, budget });
  const its = items();
  const out: any = { week: isoWeek(Date.now()), screens: {}, labels: {}, skipped: [] as string[] };
  for (const it of its) {
    const { options } = buttonsOf(it.shot);
    const words = it.shot.lines.filter((l) => l.trim());
    const state = {
      screen: `${it.id} ${it.title} ${it.kind}`,
      phone_size: it.size,
      words_on_screen: words,
      visible_buttons: options,
      behind_the_menu_button_only_after_opening_it: it.shot.menu ?? [],
    };
    const qs: Record<string, ChoiceQuestion> = { a: nextQuestion(options) };
    for (const p of PERSONAS) qs['b_' + p.key] = nextQuestion(options, p.says);
    qs.c = yesNo('Can a person see, without opening a menu, how to stop or leave what they are doing on this screen?');
    qs.d = yesNo('Is the purpose of this screen clear from its words alone?');
    const ans = await jev.choose(state, qs);
    if (!ans) { out.skipped.push(it.key); continue; }
    out.screens[it.key] = Object.fromEntries(Object.entries(ans).map(([k, v]) => [k, probsOf(v)]));
  }
  const q = 'Would most Indian families, including someone from Tirunelveli who does not speak Hindi, understand this word or phrase at once?';
  const labels = labelSet(its);
  for (let i = 0; i < labels.length; i += 20) {
    const batch = labels.slice(i, i + 20);
    const qs: Record<string, ChoiceQuestion> = {};
    batch.forEach((l, j) => (qs['l' + j] = { ...yesNo(q), instructions: { question: q, word_or_phrase: l, note: 'It appears on a phone screen in a family word game. Answer yes or no. Choose "uncertain" if you have no clear view.' } }));
    const ans = await jev.choose({ context: 'Labels on the screens of a family word game played in English in India' }, qs);
    if (!ans) { out.skipped.push(...batch); continue; }
    batch.forEach((l, j) => (out.labels[l] = probsOf(ans['l' + j])));
  }
  out.stats = { calls: jev.stats.calls, decisions: budget.thisRun, failures: jev.stats.failures, capReached: jev.stats.capReached, usedThisWeek: budget.used() };
  writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('done', JSON.stringify(out.stats), 'skipped', out.skipped.length);
}

const pct = (n: number | undefined) => (n === undefined ? 'n/a' : n.toFixed(2));
const cell = (s: string) => s.replace(/\|/g, '/');
const band = (p: number) => (p > 0.8 ? 'clear' : p >= 0.5 ? 'report' : 'unsure');

function report() {
  const m = JSON.parse(readFileSync(OUT, 'utf8'));
  const old = JSON.parse(readFileSync(OLD, 'utf8'));
  const its = items();
  const flagged: string[] = [], reported: string[] = [], unsure: string[] = [], noWay: string[] = [], unclear: string[] = [], persona: string[] = [], rows: string[] = [];
  const oldFlag = (id: string): string => {
    const r = old.screens[id]; if (!r) return 'not in the map walk';
    const [tb, tp] = top(r.a);
    return tb === UNSURE || tp < 0.5 ? 'unsure' : tp > 0.8 ? `top ${tb}` : `top ${tb} ${pct(tp)}`;
  };
  const changes: string[] = [];
  let flags = 0;
  for (const it of its) {
    const r = m.screens[it.key];
    const { options, main } = buttonsOf(it.shot);
    if (!r) { rows.push(`### ${it.key}. ${it.title}\n\nNot asked.\n`); continue; }
    const [tb, tp] = top(r.a);
    let flag = 'no';
    if (tb === UNSURE || tp < 0.5) { flag = 'Jev unsure'; unsure.push(it.key); flags++; }
    else if (main === null) flag = 'no main button (not judged)';
    else if (tb !== main && !(main && tb.startsWith(main))) {
      if (tp > 0.8) { flag = 'FLAG'; flagged.push(`${it.key} (${tb}, ${pct(tp)})`); flags++; }
      else { flag = 'report (0.5 to 0.8)'; reported.push(`${it.key} (${tb}, ${pct(tp)})`); flags++; }
    } else if (tp < 0.8) flag = 'ok, medium (0.5 to 0.8)';
    const way = r.c?.yes ?? 0, purpose = r.d?.yes ?? 0;
    if (way < 0.5) { noWay.push(`${it.key} ${pct(way)}`); flags++; }
    if (purpose < 0.8) { unclear.push(`${it.key} ${pct(purpose)}`); }
    const diffs: string[] = [];
    if (main !== null) for (const p of PERSONAS) {
      const [pb, pp] = top(r['b_' + p.key] ?? {});
      if (pb !== main && !pb.startsWith(main)) diffs.push(`${p.key}: ${pb} (${pct(pp)})`);
    }
    if (diffs.length) persona.push(`${it.key}: ${diffs.join('; ')}`);
    changes.push(`${it.key}\t${oldFlag(it.id)}\t${flag}\t${pct(way)}\t${pct(old.screens[it.id]?.c?.yes)}\t${pct(purpose)}\t${pct(old.screens[it.id]?.d?.yes)}`);
    const seen = it.shot.lines.filter((l) => l.trim());
    const words = seen.length > 22 ? seen.slice(0, 22).join(' / ') + ` / ... (${seen.length} lines)` : seen.join(' / ');
    rows.push(`### ${it.key}. ${it.title} ${it.kind}, ${it.size}\n\n` +
      `Words: ${cell(words)}\n\nButtons: ${cell(options.map((o) => (o === main ? `**${o}** (main)` : o)).join(' · '))}${main ? '' : ' (no main button)'}\n\n` +
      `Behind the menu: ${it.shot.menu ? cell(it.shot.menu.join(' · ')) : 'no menu button'}\n\n` +
      `| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |\n|---|---|---|---|---|---|---|---|\n` +
      `| ${cell(tb)} | ${pct(tp)} | ${band(tp)} | ${main ? pct(r.a[main] ?? r.a[Object.keys(r.a).find((k) => k.startsWith(main)) ?? ''] ?? 0) : 'n/a'} | ${flag} | ${pct(way)} | ${pct(purpose)} | ${diffs.length ? cell(diffs.join('; ')) : 'none'} |\n`);
  }
  const lab = Object.entries(m.labels as Record<string, Probs | null>).map(([l, p]) => ({ l, y: p?.yes ?? 0, has: !!p, u: p ? top(p)[0] === UNSURE : true }));
  const bad = lab.filter((x) => x.has && x.y < 0.5).sort((a, b) => a.y - b.y);
  const mid = lab.filter((x) => x.has && x.y >= 0.5 && x.y <= 0.8);
  const L: string[] = [];
  L.push('# Jev read of the Secret Words prototype (visible text and buttons)', '',
    `Run: 22 October 2026, tester. Prototype: main, second pass (published from b82c5e4), built locally and served on localhost; read with Playwright at 360 x 640 (all screens and dialogs on the index page) and 812 x 375 (board screens). Tools: \`tests/tools/jev-proto-collect.mjs\` (reads the screens), \`tests/tools/jev-proto-walk.ts\` (asks Jev); shots in \`reports/runs/jev-proto-shots.json\`. Findings only.`, '',
    '## Summary', '',
    `- Screens and dialogs asked: ${Object.keys(m.screens).length} reads (${its.filter((i) => i.size === '360 x 640').length} at 360 x 640, ${its.filter((i) => i.size !== '360 x 640').length} extra at 812 x 375 where the visible words differ). Labels asked: ${lab.length}.`,
    `- **Flagged** (top pick is not the main button, P above 0.8): ${flagged.length ? flagged.join('; ') : 'none'}.`,
    `- **Report band** (not the main button, P 0.5 to 0.8): ${reported.length ? reported.join('; ') : 'none'}.`,
    `- **Jev unsure** (top is "uncertain" or P below 0.5): ${unsure.length ? unsure.join(', ') : 'none'}.`,
    `- **Way out not visible** (P yes below 0.5): ${noWay.length ? noWay.join('; ') : 'none'}.`,
    `- **Purpose not clearly clear** (P yes below 0.8): ${unclear.length ? unclear.join('; ') : 'none'}.`,
    `- **Flags count** (unsure + report + FLAG + way out below 0.5): ${flags}.`,
    `- **Labels below 0.5:** ${bad.length}. Labels 0.5 to 0.8: ${mid.length}.`, '',
    '## How the questions were asked', '',
    '- State per screen given to Jev: the screen name, phone size, the visible words (board words left out), the visible buttons (the "··· Menu" button is one of them) and, as a separate field, what sits behind the menu button. Same nine questions as the 11 October map walk: (a) next button, (b) six personas, (c) way out without a menu, (d) purpose from words alone; every one a Choice with "uncertain" (the API refuses true/false and score).',
    '- Repeated buttons are one option ("✕ (8 of these)"); the board is one option "A face-down word on the board". The main button is the one the prototype draws as the big red button; it was not told to Jev. Screens with no main button are listed but not judged.',
    '- The prototype shows one state per screen id; states reached by tapping (for example P2 after "Tap to see the map") were not read.',
    '- At 812 x 375 only P4 shows different words (an "Earlier:" line); S6, P5, P6, S7 and P3 read the same as at 360 x 640 and were not asked twice.', '',
    '## Persona disagreements (most likely button differs from the main button)', '', persona.length ? persona.map((x) => '- ' + x).join('\n') : 'None.', '',
    '## Map walk (11 Oct) vs prototype: screens in both', '',
    'Columns: old top pick (map walk) | new flag | way out new | way out old | purpose new | purpose old.', '',
    '| Screen | Map walk 11 Oct | Prototype | Way out new | Way out old | Purpose new | Purpose old |', '|---|---|---|---|---|---|---|',
    ...changes.map((c) => '| ' + cell(c).split('\t').join(' | ') + ' |'), '',
    '## Per screen', '', ...rows,
    '## Labels below 0.5 ("would most Indian families, including a non-Hindi speaker from Tirunelveli, understand this at once?")', '',
    bad.length ? '| Label | P yes | Top answer |\n|---|---|---|\n' + bad.map((x) => `| ${cell(x.l)} | ${pct(x.y)} | ${x.u ? 'uncertain' : 'no'} |`).join('\n') : 'None.', '',
    `Labels in the 0.5 to 0.8 band (report): ${mid.length}${mid.length ? ': ' + mid.map((x) => `${cell(x.l)} (${pct(x.y)})`).join('; ') : ''}. Labels not answered: ${lab.filter((x) => !x.has).length}.`, '',
    '## Decisions used', '',
    `- ${m.stats.decisions} decisions, ${m.stats.calls} calls (${Object.keys(m.screens).length} reads x 9 questions, ${lab.length} labels). Weekly cap in the client 50,000; used this ISO week after the job: ${m.stats.usedThisWeek}.`,
    `- Skipped for cap or tool: ${m.skipped.length ? m.skipped.join(', ') : 'nothing'}.`, '',
    '## Tool faults (apart from findings, PLT-122)', '',
    ...(m.stats.failures.length ? m.stats.failures.map((x: string) => '- ' + x) : ['- None: every call answered on the first try.']),
    '- Noted: Choice questions only (as on 11 October). The collector reads screens as the browser shows them; a screen whose text is drawn only after a tap is not seen.', '');
  writeFileSync(REPORT, L.join('\n'));
  console.log('report', flags, 'flags', bad.length, 'labels<0.5');
}
const cmd = process.argv[2];
if (cmd === 'run') await run(); else if (cmd === 'report') report(); else console.log('usage: run|report');
