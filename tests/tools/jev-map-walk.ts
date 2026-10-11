// One-off tool (not a test, not run by any test runner): Jev's read of the Secret Words screen map, 11 October 2026.
//   node tests/tools/jev-map-walk.ts map     screens (a to d) and labels      -> reports/runs/jev-map-walk.json
//   node tests/tools/jev-map-walk.ts words   word list and team names check   -> reports/runs/jev-word-check.json
//   node tests/tools/jev-map-walk.ts report                                   -> reports/jev-map-walk-secret-words.md
// Uses the Jev client in tests/sim/jev.ts (key, weekly cap, retry, redaction). Never prints the key.
// Every question is a Choice with an "uncertain" option: the API refused true/false and score questions on 11 October
// 2026, so nothing here attempts them.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { makeBudget, makeJev, loadJevKey, USAGE_FILE, isoWeek, type ChoiceAnswer, type ChoiceQuestion } from '../sim/jev.ts';
import { SCREENS, LABELS, PERSONAS, type Screen } from './secret-words-screens.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const MAP_JSON = `${ROOT}reports/runs/jev-map-walk.json`;
const WORD_JSON = `${ROOT}reports/runs/jev-word-check.json`;
const REPORT = `${ROOT}reports/jev-map-walk-secret-words.md`;
const UNSURE = 'uncertain';

type Probs = Record<string, number>;
const top = (p: Probs) => Object.entries(p).sort((a, b) => b[1] - a[1])[0] ?? ['?', 0];
const probsOf = (a?: ChoiceAnswer): Probs | null => (a && a.type === 'choice' && a.probabilities ? a.probabilities : null);

function nextQuestion(s: Screen, persona?: string): ChoiceQuestion {
  return {
    type: 'choice',
    instructions: {
      question: 'A family is playing this word game at home. Which button would a person on this screen press next?' + (persona ? ` The person is ${persona}.` : ''),
      note: 'Pick only from the visible buttons. Choose "uncertain" if you have no clear view.',
    },
    criteria: { ...Object.fromEntries(s.buttons.map((b) => [b, `the button "${b}"`])), [UNSURE]: 'no clear view' },
  };
}
const yesNo = (question: string): ChoiceQuestion => ({
  type: 'choice',
  instructions: { question, note: 'Answer yes or no. Choose "uncertain" if you have no clear view.' },
  criteria: { yes: 'yes', no: 'no', [UNSURE]: 'no clear view' },
});

function makeClient(runLimit: number) {
  const key = loadJevKey();
  if (!key) throw new Error('No Jev key');
  const budget = makeBudget({ file: USAGE_FILE, runLimit });
  return { jev: makeJev({ key, budget }), budget };
}

async function mapRun() {
  const { jev, budget } = makeClient(760);
  const out: any = { week: isoWeek(Date.now()), screens: {}, labels: {}, skipped: [] as string[], probeDecisions: 3 };
  budget.take(3); // the format probe made before this run (choice worked; boolean and score were refused)
  for (const s of SCREENS) {
    const state = { screen: `${s.id} ${s.name}`, words_on_screen: s.words, visible_buttons: s.buttons };
    const qs: Record<string, ChoiceQuestion> = { a: nextQuestion(s) };
    for (const p of PERSONAS) qs['b_' + p.key] = nextQuestion(s, p.says);
    qs.c = yesNo('Can a person see, without opening a menu, how to stop or leave what they are doing on this screen?');
    qs.d = yesNo('Is the purpose of this screen clear from its words alone?');
    const ans = await jev.choose(state, qs);
    if (!ans) { out.skipped.push(s.id); continue; }
    out.screens[s.id] = Object.fromEntries(Object.entries(ans).map(([k, v]) => [k, probsOf(v)]));
  }
  const q = 'Would most Indian families, including someone from Tirunelveli who does not speak Hindi, understand this word or phrase at once?';
  for (let i = 0; i < LABELS.length; i += 20) {
    const batch = LABELS.slice(i, i + 20);
    const qs: Record<string, ChoiceQuestion> = {};
    batch.forEach((l, j) => (qs['l' + j] = { ...yesNo(q), instructions: { question: q, word_or_phrase: l, note: 'It appears on a phone screen in a family word game. Answer yes or no. Choose "uncertain" if you have no clear view.' } }));
    const ans = await jev.choose({ context: 'Labels on the screens of a family word game played in English in India' }, qs);
    if (!ans) { out.skipped.push(...batch); continue; }
    batch.forEach((l, j) => (out.labels[l] = probsOf(ans['l' + j])));
  }
  out.stats = { calls: jev.stats.calls, decisions: budget.thisRun, failures: jev.stats.failures, capReached: jev.stats.capReached, usedThisWeek: budget.used() };
  mkdirSync(`${ROOT}reports/runs`, { recursive: true });
  writeFileSync(MAP_JSON, JSON.stringify(out, null, 1));
  console.log('map run done', JSON.stringify(out.stats), 'skipped', out.skipped.length);
}

function parseCsv(text: string): string[][] {
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
  return rows.filter((r) => r.length > 1);
}

async function wordsRun() {
  const { jev, budget } = makeClient(2000);
  const dir = `${ROOT}docs/games/secret-words/`;
  const words = parseCsv(readFileSync(dir + 'words.csv', 'utf8')).slice(1);
  const teams = parseCsv(readFileSync(dir + 'team-names.csv', 'utf8')).slice(1);
  const out: any = { words: {}, teams: {}, skipped: [], codeChecks: [] as string[] };
  const known = 'Would most Indian families, including someone from Tirunelveli who does not speak Hindi, know this word at once?';
  const family = 'Is this word fine to say aloud in front of children and grandparents at a family party?';
  const ctx = { context: 'Words for a family team word game (like Codenames) played in English in India' };
  for (let i = 0; i < words.length; i += 6) {
    const batch = words.slice(i, i + 6);
    const qs: Record<string, ChoiceQuestion> = {};
    batch.forEach((r, j) => {
      const [id, word] = r as [string, string];
      qs[`k${j}`] = yesNo(`${known} The word is "${word}".`);
      qs[`f${j}`] = yesNo(`${family} The word is "${word}".`);
      if (/\s/.test(word.trim())) out.codeChecks.push(`${id} ${word}: more than one word`);
    });
    const ans = await jev.choose(ctx, qs);
    if (!ans) { out.skipped.push(...batch.map((r) => r[0])); continue; }
    batch.forEach((r, j) => (out.words[r[0]!] = { word: r[1], category: r[3], audience: r[4], known: probsOf(ans[`k${j}`]), family: probsOf(ans[`f${j}`]) }));
  }
  for (let i = 0; i < teams.length; i += 6) {
    const batch = teams.slice(i, i + 6);
    const qs: Record<string, ChoiceQuestion> = {};
    batch.forEach((r, j) => {
      qs[`k${j}`] = yesNo(`Would most Indian families, including someone from Tirunelveli who does not speak Hindi, understand the team names "${r[1]}" and "${r[2]}" at once?`);
      qs[`f${j}`] = yesNo(`Are the team names "${r[1]}" and "${r[2]}" fine for a family party with children and grandparents?`);
    });
    const ans = await jev.choose(ctx, qs);
    if (!ans) { out.skipped.push(...batch.map((r) => r[0])); continue; }
    batch.forEach((r, j) => (out.teams[r[0]!] = { orange: r[1], teal: r[2], known: probsOf(ans[`k${j}`]), family: probsOf(ans[`f${j}`]) }));
  }
  out.stats = { calls: jev.stats.calls, decisions: budget.thisRun, failures: jev.stats.failures, capReached: jev.stats.capReached, usedThisWeek: budget.used() };
  writeFileSync(WORD_JSON, JSON.stringify(out, null, 1));
  console.log('word run done', JSON.stringify(out.stats), 'skipped', out.skipped.length);
}

const pct = (n: number | undefined) => (n === undefined ? 'n/a' : n.toFixed(2));
const cell = (s: string) => s.replace(/\|/g, '/');
function band(p: number): string { return p > 0.8 ? 'clear' : p >= 0.5 ? 'report' : 'unsure'; }

function report() {
  const m = JSON.parse(readFileSync(MAP_JSON, 'utf8'));
  const w = existsSync(WORD_JSON) ? JSON.parse(readFileSync(WORD_JSON, 'utf8')) : null;
  const L: string[] = [];
  const flagged: string[] = [], reported: string[] = [], unsure: string[] = [], noWay: string[] = [], unclear: string[] = [];
  const personaDiffs: string[] = [];
  const rows: string[] = [];
  for (const s of SCREENS) {
    const r = m.screens[s.id];
    if (!r) { rows.push(`### ${s.id}. ${s.name}\n\nNot asked (see decisions used).\n`); continue; }
    const [tb, tp] = top(r.a);
    let flag = 'no';
    if (tb === UNSURE || tp < 0.5) { flag = 'Jev unsure'; unsure.push(s.id); }
    else if (s.main === null) flag = 'no main button (not judged)';
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
    rows.push(`### ${s.id}. ${s.name}\n\n` +
      `Main button: ${s.main ?? '(none)'}. Buttons: ${s.buttons.join(' · ')}.\n\n` +
      `| Jev's most likely button | P | Band | Main button P | Flag | Way out (P yes) | Purpose (P yes) | Persona disagreements |\n|---|---|---|---|---|---|---|---|\n` +
      `| ${cell(tb)} | ${pct(tp)} | ${band(tp)} | ${s.main ? pct(r.a[s.main]) : 'n/a'} | ${flag} | ${pct(way)} | ${pct(purpose)} | ${diffs.length ? cell(diffs.join('; ')) : 'none'} |\n`);
  }
  const labelRows = Object.entries(m.labels as Record<string, Probs | null>).map(([l, p]) => ({ l, y: p?.yes ?? 0, u: p ? top(p)[0] === UNSURE : true, has: !!p }));
  const bad = labelRows.filter((x) => x.has && x.y < 0.5).sort((a, b) => a.y - b.y);
  const mid = labelRows.filter((x) => x.has && x.y >= 0.5 && x.y <= 0.8).length;

  L.push('# Jev read of the Secret Words screen map (draft 1)', '',
    `Run: 11 October 2026, tester. Map: \`docs/games/secret-words/screen-map.md\` draft 1. Tool: \`tests/tools/jev-map-walk.ts\` (one-off, not a test). Findings only: nothing in the map or scenarios was changed.`, '',
    '## Summary', '',
    `- Screens and dialogs asked: ${Object.keys(m.screens).length} of ${SCREENS.length}. Labels asked: ${labelRows.length}.`,
    `- **Flagged** (Jev's most likely button is not the main button, P above 0.8): ${flagged.length ? flagged.join('; ') : 'none'}.`,
    `- **Report band** (not the main button, P 0.5 to 0.8): ${reported.length ? reported.join('; ') : 'none'}.`,
    `- **Jev unsure** (top choice "uncertain" or P below 0.5): ${unsure.length ? unsure.join(', ') : 'none'}.`,
    `- **Way out not visible** (P yes below 0.5): ${noWay.length ? noWay.join('; ') : 'none'}.`,
    `- **Purpose not clearly clear** (P yes below 0.8): ${unclear.length ? unclear.join('; ') : 'none'}.`,
    `- **Labels below 0.5:** ${bad.length}. Labels 0.5 to 0.8: ${mid}.`, '',
    '## How the questions were asked', '',
    '- Every screen: one call with 9 questions. (a) Choice among the visible buttons plus "uncertain"; (b) the same Choice six times, once per persona (grandparent with weak English, 10-year-old, first-time host, distracted host with one hand, competitive uncle who knows the rules, guest who just opened the link); (c) way out, yes/no/uncertain; (d) purpose, yes/no/uncertain. State given to Jev: the screen name, the map\'s Words line and the visible buttons (menu items left out).',
    '- **"Noul" was run as a Choice with yes / no / uncertain.** The Jev client only supports Choice. A probe on 11 October showed the API refuses a `boolean` question ("Invalid request") and a `score` question needs a `criteria` field the client does not model, so true/false and score are not confirmed (the open item in `docs/proposals/e2e-and-jev-testing.md`). Probabilities below are the "yes" share.',
    '- Bands: above 0.8 clear; 0.5 to 0.8 report; below 0.5 or "uncertain" is Jev unsure. Flag: top option is not the main button with P above 0.8. Screens with no main button in the map (A3, D3, D10, E1, E1a, J1, M1) are listed with their numbers but not judged; the map names no "obvious next step" for them.',
    '- Screens with several states are split as the map splits them: S7 two phones (S7a2) and three phones (S7a3), S7a shown as S7b (the map code again), P2 hidden (P2a) and shown (P2b), P4 before (P4a) and after (P4b) the first reveal, Show the map to as D10. State detail not in the map (for example whether the saved-map row on Home is present) was shown as the map lists it, all rows at once on A1, so Home\'s answers are for a Home that shows every row.',
    '- Buttons with a variable part (a name, a number) are named by one example (Riya, Sunita, KITE, 2).', '');
  L.push('## Reading notes (tester, not Jev)', '',
    '- S1: "Add a name / Enter" is the step before Next on a screen that is still filling up, so Jev picking it is likely the map showing a list already filled in without saying so; read it as a state-description gap, not a screen fault.',
    '- Low "way out" answers on the pass, scan, clue, guessing and turn-over screens match the map\'s own Intentions lines (stop, home and pause are in the menu there by design); the map phone and private map are by design (map section H, items 1 and 3).',
    '- Dialogs with two buttons (D5, D6, D8, D9, M2) often show "uncertain" at the top: Jev was shown only the dialog words and button names, with no sight of the screen behind it.',
    '- Every probability is one Jev answer per question (no repeats), so a value near a band edge may move on a re-run.', '');
  L.push('## Persona disagreements (most likely button differs from the main button)', '', personaDiffs.length ? personaDiffs.map((x) => '- ' + x).join('\n') : 'None.', '');
  L.push('## Per screen', '', ...rows);
  L.push('## Labels below 0.5 ("would most Indian families, including a non-Hindi speaker from Tirunelveli, understand this at once?")', '',
    bad.length ? '| Label | P yes | Top answer |\n|---|---|---|\n' + bad.map((x) => `| ${cell(x.l)} | ${pct(x.y)} | ${x.u ? 'uncertain' : 'no'} |`).join('\n') : 'None.', '',
    `Labels in the 0.5 to 0.8 band (report): ${mid}. Labels not answered: ${labelRows.filter((x) => !x.has).length}.`, '',
    '<details><summary>Every label with P yes</summary>', '', '| Label | P yes |', '|---|---|', ...labelRows.map((x) => `| ${cell(x.l)} | ${x.has ? pct(x.y) : 'n/a'} |`), '', '</details>', '');
  // word list
  L.push('## Word list check (`words.csv`, `team-names.csv`)', '');
  if (!w) L.push('Not run.', '');
  else {
    const ws = Object.entries(w.words as Record<string, any>);
    const lowK = ws.filter(([, v]) => (v.known?.yes ?? 0) < 0.5), lowF = ws.filter(([, v]) => (v.family?.yes ?? 0) < 0.5);
    const midK = ws.filter(([, v]) => v.known?.yes >= 0.5 && v.known?.yes <= 0.8).length;
    const f = (arr: [string, any][], k: string) => arr.length ? arr.map(([id, v]) => `${id} ${v.word} (${v.category}, ${pct(v[k]?.yes)})`).join('; ') : 'none';
    L.push(`Words asked: ${ws.length} of 452, two questions each (known at once by most Indian families including a non-Hindi speaker from Tirunelveli; fine to say in front of children and grandparents). "One word, not a phrase" was checked by code, not Jev. The "too close to another board word" pairs question was not run (needs a pair list; none exists yet). P yes below 0.5 is listed; 0.5 to 0.8 is counted only.`, '',
      `- **Not known at once (below 0.5), ${lowK.length}:** ${f(lowK, 'known')} (words in the 0.5 to 0.8 band: ${midK})`, '',
      `- **Not clearly family-friendly (below 0.5), ${lowF.length}:** ${f(lowF, 'family')}`, '',
      `- Code check, more than one word: ${w.codeChecks.length ? w.codeChecks.join('; ') : 'none'}.`, '');
    const ts = Object.entries(w.teams as Record<string, any>);
    const tl = ts.filter(([, v]) => (v.known?.yes ?? 1) < 0.8 || (v.family?.yes ?? 1) < 0.8);
    L.push(`**Team names:** ${ts.length} pairs asked (understood at once; family-friendly). Pairs under 0.8 on either: ${tl.length ? tl.map(([id, v]) => `${id} ${v.orange} / ${v.teal} (understood ${pct(v.known?.yes)}, family ${pct(v.family?.yes)})`).join('; ') : 'none'}.`, '',
      w.skipped.length ? `Not asked (cap or tool): ${w.skipped.join(', ')}.` : '', '',
      `Word check decisions: ${w.stats.decisions}.`, '');
  }
  L.push('## Decisions used', '',
    `- Map run: ${m.stats.decisions} decisions (3 for the format probe, ${SCREENS.length * 9} for screens, ${LABELS.length} for labels), ${m.stats.calls} calls. Word list check: ${w ? w.stats.decisions : 0}. Total this job: ${m.stats.decisions + (w ? w.stats.decisions : 0)}.`,
    `- Weekly cap in the client: 50,000. Used this ISO week after the job: ${w ? w.stats.usedThisWeek : m.stats.usedThisWeek}.`,
    `- Skipped for cap or tool: ${m.skipped.length ? m.skipped.join(', ') : 'nothing'}.`, '',
    '## Tool faults (apart from findings, PLT-122)', '',
    ...(() => {
      const fails = [...m.stats.failures, ...(w ? w.stats.failures : [])];
      return fails.length ? fails.map((x: string) => '- ' + x) : ['- None: every call answered on the first try.'];
    })(),
    '- Noted: the client has Choice questions only (see above). "Uncertain" was added by the script as an option on every question.', '');
  writeFileSync(REPORT, L.join('\n'));
  console.log('report written', flagged.length, 'flagged', bad.length, 'labels below 0.5');
}

const cmd = process.argv[2];
if (cmd === 'map') await mapRun(); else if (cmd === 'words') await wordsRun(); else if (cmd === 'report') report();
else console.log('usage: node tests/tools/jev-map-walk.ts map|words|report');
