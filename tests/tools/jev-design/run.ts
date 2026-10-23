// Tool (not a test, not run by npm test): Jev design checks for the product side. A generalisation of
// tests/tools/jev-map-walk.ts. Plain node, no vitest or playwright:
//   node tests/tools/jev-design/run.ts --game what-am-i --map <screen-map.md> --words <words.csv> --out <report.md> [--budget product|test]
// Reads only the files named on the command line, talks only to the Jev API (tests/sim/jev.ts: key, retry, redaction),
// never fetches a web page, never prints the key. Every question is a Choice with an "uncertain" option.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { makeBudget, makeJev, loadJevKey, USAGE_FILE, isoWeek, type Budget, type ChoiceAnswer, type ChoiceQuestion } from '../../sim/jev.ts';

const ROOT = new URL('../../../', import.meta.url).pathname;
const PRODUCT_FILE = `${ROOT}reports/runs/jev-usage-product.json`;
const PRODUCT_CAP = 15_000;
const UNSURE = 'uncertain';

const PERSONAS = [
  { key: 'grandparent', says: 'a grandparent with weak English' },
  { key: 'child', says: 'a 10-year-old' },
  { key: 'first-time host', says: 'a first-time host' },
  { key: 'one-hand host', says: 'a distracted host with one hand' },
  { key: 'uncle', says: 'a competitive uncle who knows the rules' },
  { key: 'new guest', says: 'a guest who just opened the link' },
];

// ---------- arguments ----------
function parseArgs(argv: string[]) {
  const a: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]!;
    if (!k.startsWith('--')) throw new Error(`Unexpected argument: ${k}`);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`Missing value for ${k}`);
    a[k.slice(2)] = v; i++;
  }
  return a;
}

// ---------- parsing the inputs ----------
interface Screen { id: string; name: string; words: string; buttons: string[]; main: string | null }
const clean = (s: string) => s.replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();

export function parseMap(text: string): Screen[] {
  const out: Screen[] = [];
  const parts = text.split(/^### /m).slice(1);
  for (const part of parts) {
    const lines = part.split('\n');
    const head = clean(lines[0] ?? '');
    const m = head.match(/^([^\s.]+)\.\s+(.*)$/);
    const id = m ? m[1]! : head.split(' ')[0]!;
    const name = m ? m[2]! : head;
    let words = ''; const buttons: string[] = [];
    let inTable = false, headerSeen = false;
    const wordLines: string[] = [];
    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (line.startsWith('|')) {
        inTable = true;
        if (/^\|[\s:|-]+\|?$/.test(line)) { headerSeen = true; continue; }
        if (!headerSeen) continue; // the header row
        const first = clean(line.replace(/^\|/, '').split('|')[0] ?? '');
        if (first && first !== '—' && !buttons.includes(first)) buttons.push(first.slice(0, 90));
      } else if (!inTable && line) wordLines.push(line);
      else if (inTable && !line) { inTable = false; headerSeen = false; }
    }
    words = clean(wordLines.join(' ')).replace(/^\*?Words:\*?\s*/i, '');
    const mm = words.match(/main(?: button)?\s+["“]([^"”]+)["”]/i);
    const main = mm ? buttons.find((b) => b.toLowerCase().includes(mm[1]!.toLowerCase())) ?? null : null;
    out.push({ id, name, words: words.slice(0, 1500), buttons, main });
  }
  return out;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r[0] ?? '').trim());
}

/** Short quoted phrases from a screen's words and buttons, for the "understood at once" question. */
function labelsOf(screens: Screen[]): string[] {
  const set = new Set<string>();
  for (const s of screens) {
    for (const m of s.words.matchAll(/["“]([^"”]{2,40})["”]/g)) set.add(m[1]!.trim());
    for (const b of s.buttons) if (b.length <= 40) set.add(b);
  }
  return [...set];
}

// ---------- budget: product count plus the shared 50,000 ----------
export function makeProductBudget(shared: Budget, product: Budget): Budget {
  let stoppedBy: string | null = null;
  return {
    cap: product.cap,
    used: () => product.used(),
    left: () => Math.min(shared.left(), product.left()),
    take(n: number) {
      if (shared.cap - shared.used() < n) { stoppedBy = `the shared weekly limit of ${shared.cap}`; return false; }
      if (product.cap - product.used() < n) { stoppedBy = `the product weekly limit of ${product.cap}`; return false; }
      shared.take(n); product.take(n);
      return true;
    },
    get thisRun() { return product.thisRun; },
    get stoppedBy() { return stoppedBy as Budget['stoppedBy']; },
  };
}

// ---------- questions ----------
type Probs = Record<string, number>;
const top = (p: Probs) => Object.entries(p).sort((a, b) => b[1] - a[1])[0] ?? ['?', 0];
const probsOf = (a?: ChoiceAnswer): Probs | null => (a && a.type === 'choice' && a.probabilities ? a.probabilities : null);
const pct = (n: number | undefined) => (n === undefined ? 'n/a' : n.toFixed(2));
const cell = (s: string) => s.replace(/\|/g, '/');
const band = (p: number) => (p > 0.8 ? 'clear' : p >= 0.5 ? 'report' : 'unsure');

const yesNo = (question: string, extra: Record<string, string> = {}): ChoiceQuestion => ({
  type: 'choice',
  instructions: { question, ...extra, note: 'Answer yes or no. Choose "uncertain" if you have no clear view.' },
  criteria: { yes: 'yes', no: 'no', [UNSURE]: 'no clear view' },
});
const nextQuestion = (s: Screen, persona?: string): ChoiceQuestion => ({
  type: 'choice',
  instructions: {
    question: 'A family is playing this game at home. Which button would a person on this screen press next?' + (persona ? ` The person is ${persona}.` : ''),
    note: 'Pick only from the visible buttons. Choose "uncertain" if you have no clear view.',
  },
  criteria: { ...Object.fromEntries(s.buttons.map((b) => [b, `the button "${b}"`])), [UNSURE]: 'no clear view' },
});

const KNOWN = 'Would a mixed-region Indian family (ages 8 to 80, including someone from Tirunelveli who does not speak Hindi) know this word at once?';
const ACTED = 'Can this word be acted out or described to a guesser without saying it?';
const SENSITIVE = 'Is this word political or religiously sensitive, so that it could upset someone at a family party?';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.map && !args.words) throw new Error('Give --map and/or --words. See tests/tools/jev-design/README.md');
  if (!args.out) throw new Error('Give --out <report path>');
  const mode = args.budget ?? 'test';
  if (mode !== 'product' && mode !== 'test') throw new Error('--budget must be product or test');
  const game = args.game ?? 'game';
  const maxScreens = args.screens ? Number(args.screens) : Infinity;
  const maxWords = args['max-words'] ? Number(args['max-words']) : Infinity;
  const maxLabels = args['max-labels'] ? Number(args['max-labels']) : Infinity;

  const key = loadJevKey();
  if (!key) throw new Error('No Jev key (JEV_API_KEY or .env.local in the Test clone)');
  const shared = makeBudget({ file: USAGE_FILE });
  const product = mode === 'product' ? makeBudget({ file: PRODUCT_FILE, cap: PRODUCT_CAP }) : null;
  const budget = product ? makeProductBudget(shared, product) : shared;
  const sharedBefore = shared.used(), productBefore = product ? product.used() : 0;
  const jev = makeJev({ key, budget });

  const screens = args.map ? parseMap(readFileSync(resolve(args.map), 'utf8')) : [];
  const askable = screens.filter((s) => s.buttons.length >= 2).slice(0, maxScreens);
  const notAsked = screens.filter((s) => !askable.includes(s)).map((s) => s.id);
  const screenRes: Record<string, Record<string, Probs | null>> = {};
  const labelRes: Record<string, Probs | null> = {};
  const skipped: string[] = [];

  for (const s of askable) {
    const state = { screen: `${s.id} ${s.name}`, words_on_screen: s.words, visible_buttons: s.buttons };
    const qs: Record<string, ChoiceQuestion> = { a: nextQuestion(s) };
    for (const p of PERSONAS) qs['b_' + p.key] = nextQuestion(s, p.says);
    qs.c = yesNo('Can a person see, without opening a menu, how to stop or leave what they are doing on this screen?');
    qs.d = yesNo('Is the purpose of this screen clear from its words alone?');
    const ans = await jev.choose(state, qs);
    if (!ans) { skipped.push(s.id); if (jev.stats.capReached) break; continue; }
    screenRes[s.id] = Object.fromEntries(Object.entries(ans).map(([k, v]) => [k, probsOf(v)]));
  }
  if (askable.length && !jev.stats.capReached) {
    const labels = labelsOf(askable).slice(0, maxLabels);
    const q = 'Would most Indian families, including someone from Tirunelveli who does not speak Hindi, understand this word or phrase at once?';
    for (let i = 0; i < labels.length; i += 20) {
      const batch = labels.slice(i, i + 20);
      const qs: Record<string, ChoiceQuestion> = {};
      batch.forEach((l, j) => (qs['l' + j] = yesNo(q, { word_or_phrase: l })));
      const ans = await jev.choose({ context: `Labels on the screens of a family game (${game}) played in English in India` }, qs);
      if (!ans) { skipped.push(...batch.map((l) => 'label ' + l)); if (jev.stats.capReached) break; continue; }
      batch.forEach((l, j) => (labelRes[l] = probsOf(ans['l' + j])));
    }
  }

  // words
  const wordRes: { id: string; word: string; known: Probs | null; acted: Probs | null; sensitive: Probs | null }[] = [];
  let wordsTotal = 0;
  if (args.words) {
    const rows = parseCsv(readFileSync(resolve(args.words), 'utf8'));
    const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
    const wi = header.indexOf('word') >= 0 ? header.indexOf('word') : 1;
    const ii = header.indexOf('id') >= 0 ? header.indexOf('id') : 0;
    const all = rows.slice(1).filter((r) => (r[wi] ?? '').trim());
    wordsTotal = all.length;
    const words = all.slice(0, maxWords);
    for (let i = 0; i < words.length && !jev.stats.capReached; i += 6) {
      const batch = words.slice(i, i + 6);
      const qs: Record<string, ChoiceQuestion> = {};
      batch.forEach((r, j) => {
        const w = r[wi]!.trim();
        qs[`k${j}`] = yesNo(KNOWN, { word: w });
        qs[`a${j}`] = yesNo(ACTED, { word: w });
        qs[`s${j}`] = yesNo(SENSITIVE, { word: w });
      });
      const ans = await jev.choose({ context: `Words for a family party game (${game}) played in English in India` }, qs);
      if (!ans) { skipped.push(...batch.map((r) => 'word ' + (r[ii] ?? r[wi]))); continue; }
      batch.forEach((r, j) => wordRes.push({ id: r[ii] ?? '', word: r[wi]!.trim(), known: probsOf(ans[`k${j}`]), acted: probsOf(ans[`a${j}`]), sensitive: probsOf(ans[`s${j}`]) }));
    }
  }

  // ---------- report ----------
  const L: string[] = [];
  const flagged: string[] = [], reported: string[] = [], unsure: string[] = [], noWay: string[] = [], unclear: string[] = [], personaDiffs: string[] = [], rows: string[] = [];
  for (const s of askable) {
    const r = screenRes[s.id];
    if (!r || !r.a) { rows.push(`### ${s.id}. ${s.name}\n\nNot asked (see decisions used).\n`); continue; }
    const [tb, tp] = top(r.a);
    let flag = 'no';
    if (tb === UNSURE || tp < 0.5) { flag = 'Jev unsure'; unsure.push(s.id); }
    else if (s.main === null) flag = 'no main button found in the map (not judged)';
    else if (tb !== s.main) {
      if (tp > 0.8) { flag = 'FLAG'; flagged.push(`${s.id} (${tb}, ${pct(tp)})`); }
      else { flag = 'report (0.5 to 0.8)'; reported.push(`${s.id} (${tb}, ${pct(tp)})`); }
    } else if (tp < 0.8) flag = 'ok, medium (0.5 to 0.8)';
    const way = r.c?.yes ?? 0, purpose = r.d?.yes ?? 0;
    if (way < 0.5) noWay.push(`${s.id} ${pct(way)}`);
    if (purpose < 0.8) unclear.push(`${s.id} ${pct(purpose)}`);
    const diffs: string[] = [];
    if (s.main !== null) for (const p of PERSONAS) {
      const [pb, pp] = top(r['b_' + p.key] ?? {});
      if (pb !== s.main) diffs.push(`${p.key}: ${pb} (${pct(pp)})`);
    }
    if (diffs.length) personaDiffs.push(`${s.id}: ${diffs.join('; ')}`);
    rows.push(`### ${s.id}. ${s.name}\n\nMain button: ${s.main ?? '(none found)'}. Buttons: ${s.buttons.join(' · ')}.\n\n` +
      `| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |\n|---|---|---|---|---|---|---|---|\n` +
      `| ${cell(tb)} | ${pct(tp)} | ${band(tp)} | ${s.main ? pct(r.a[s.main]) : 'n/a'} | ${flag} | ${pct(way)} | ${pct(purpose)} | ${diffs.length ? cell(diffs.join('; ')) : 'none'} |\n`);
  }
  const labelRows = Object.entries(labelRes).map(([l, p]) => ({ l, y: p?.yes ?? 0, has: !!p, u: p ? top(p)[0] === UNSURE : true }));
  const badLabels = labelRows.filter((x) => x.has && x.y < 0.5).sort((a, b) => a.y - b.y);
  const midLabels = labelRows.filter((x) => x.has && x.y >= 0.5 && x.y <= 0.8).length;

  const used = budget.thisRun;
  const sharedAfter = shared.used();
  L.push(`# Jev design check: ${game}`, '',
    `Run: ${new Date().toISOString().slice(0, 10)}, budget \`${mode}\`. Tool: \`tests/tools/jev-design/run.ts\`. Findings only: nothing in the source files was changed. Bands: above 0.8 clear, 0.5 to 0.8 report, below 0.5 or "uncertain" unsure. Every probability is one Jev answer per question (no repeats), so a value near a band edge may move on a re-run.`, '');
  if (args.map) {
    L.push('## Screen map', '',
      `- Screens parsed: ${screens.length}; asked: ${askable.length}; not asked (fewer than 2 buttons in a table, or beyond --screens): ${notAsked.length ? notAsked.join(', ') : 'none'}.`,
      `- **Flagged** (Jev's likeliest button is not the main button, P above 0.8): ${flagged.length ? flagged.join('; ') : 'none'}.`,
      `- **Report band** (not the main button, P 0.5 to 0.8): ${reported.length ? reported.join('; ') : 'none'}.`,
      `- **Jev unsure**: ${unsure.length ? unsure.join(', ') : 'none'}.`,
      `- **Way out not visible** (P yes below 0.5): ${noWay.length ? noWay.join('; ') : 'none'}.`,
      `- **Purpose not clearly clear** (P yes below 0.8): ${unclear.length ? unclear.join('; ') : 'none'}.`,
      `- **Labels below 0.5:** ${badLabels.length} of ${labelRows.length}. Labels 0.5 to 0.8: ${midLabels}.`,
      `- Main button = the map's \`main "..."\` wording in a screen's Words line; screens without it are not judged against a main button. Buttons = the first column of each screen's tables (menu items included if the map lists them).`, '',
      '### Persona disagreements (likeliest button differs from the main button)', '',
      personaDiffs.length ? personaDiffs.map((x) => '- ' + x).join('\n') : 'None.', '',
      '### Per screen', '', ...rows,
      '### Labels below 0.5 ("understood at once by most Indian families, including a non-Hindi speaker from Tirunelveli?")', '',
      badLabels.length ? '| Label | P yes | Top answer |\n|---|---|---|\n' + badLabels.map((x) => `| ${cell(x.l)} | ${pct(x.y)} | ${x.u ? 'uncertain' : 'no'} |`).join('\n') : 'None.', '');
  }
  if (args.words) {
    const f = (sel: (w: (typeof wordRes)[number]) => boolean, p: (w: (typeof wordRes)[number]) => number) => {
      const hit = wordRes.filter(sel); return hit.length ? hit.map((w) => `${w.id} ${w.word} (${pct(p(w))})`).join('; ') : 'none';
    };
    const kY = (w: (typeof wordRes)[number]) => w.known?.yes ?? 0, aY = (w: (typeof wordRes)[number]) => w.acted?.yes ?? 0, sY = (w: (typeof wordRes)[number]) => w.sensitive?.yes ?? 0;
    const sure = (p: Probs | null) => !!p && top(p)[0] !== UNSURE;
    L.push('## Word list', '',
      `Words asked: ${wordRes.length} of ${wordsTotal}, three questions each: known to a mixed-region Indian family (ages 8 to 80, including a non-Hindi speaker from Tirunelveli); can be acted or described; political or religious-sensitive. Listed: known or acted below 0.5 (P yes), sensitive above 0.5 (P yes). Unsure = top answer "uncertain".`, '',
      `- **Not known at once (P yes below 0.5):** ${f((w) => !!w.known && kY(w) < 0.5, kY)}`,
      `- **Cannot be acted or described (P yes below 0.5):** ${f((w) => !!w.acted && aY(w) < 0.5, aY)}`,
      `- **Political or religious-sensitive (P yes above 0.5):** ${f((w) => !!w.sensitive && sY(w) > 0.5, sY)}`,
      `- **Unsure on any question:** ${wordRes.filter((w) => !sure(w.known) || !sure(w.acted) || !sure(w.sensitive)).map((w) => `${w.id} ${w.word}`).join('; ') || 'none'}`,
      `- Known, 0.5 to 0.8 band: ${wordRes.filter((w) => w.known && kY(w) >= 0.5 && kY(w) <= 0.8).length}.`, '');
  }
  L.push('## Decisions used', '',
    `- This run: ${used} decisions, ${jev.stats.calls} calls.`,
    ...(product ? [`- Product count this ISO week (${isoWeek(Date.now())}): ${productBefore} before, ${product.used()} after, of ${PRODUCT_CAP}.`] : []),
    `- Shared count this ISO week: ${sharedBefore} before, ${sharedAfter} after, of ${shared.cap}.`,
    `- Stopped early: ${jev.stats.capReached ? 'yes, by ' + (budget.stoppedBy ?? 'a limit') : 'no'}.`,
    `- Skipped: ${skipped.length ? skipped.join(', ') : 'nothing'}.`, '',
    '## Tool faults (kept apart from findings)', '',
    ...(jev.stats.failures.length ? jev.stats.failures.map((x) => '- ' + x) : ['- None: every call answered on the first try.']), '');
  mkdirSync(dirname(resolve(args.out)), { recursive: true });
  writeFileSync(resolve(args.out), L.join('\n'));
  console.log(`done: ${used} decisions (${mode}); shared ${sharedBefore}->${sharedAfter}` + (product ? `; product ${productBefore}->${product.used()}` : '') +
    (jev.stats.capReached ? `; STOPPED by ${budget.stoppedBy}` : '') + `; failures ${jev.stats.failures.length}; report ${args.out}`);
}

try { await main(); } catch (e: any) { console.error('jev-design: ' + (e?.message ?? e)); process.exit(1); }
