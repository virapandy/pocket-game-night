#!/usr/bin/env node
// Turns the approved rhyme catalog (docs/games/tambola/rhymes.csv) into the app's content pack
// (content/tambola/rhymes.json). Refuses to write the pack if any rule in specs/tambola/11-rhymes.md
// is broken. Run again whenever the catalog changes: npm run build:rhymes
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const source = path.join(root, 'docs/games/tambola/rhymes.csv');
const target = path.join(root, 'content/tambola/rhymes.json');

const LANGUAGES = ['en', 'hi'];
const STYLES = ['classic', 'indian', 'playful', 'cricket', 'bollywood', 'festival', 'hindi'];
// Indian references come first: twice as likely to be picked (owner, 2026-09-28, docs/games/tambola/rhymes.md).
const STYLE_WEIGHTS = { classic: 1, playful: 1, indian: 2, cricket: 2, bollywood: 2, festival: 2, hindi: 2 };
const MAX_LENGTH = 40;

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

const [header, ...lines] = parseCsv(readFileSync(source, 'utf8'));
const col = Object.fromEntries(header.map((name, i) => [name.trim(), i]));
for (const name of ['number', 'language', 'style', 'family_friendly', 'rhyme']) {
  if (!(name in col)) throw new Error(`rhymes.csv has no "${name}" column`);
}

const problems = [];
const rhymes = lines.map((cells, i) => {
  const line = i + 2;
  const get = (name) => (cells[col[name]] ?? '').trim();
  const n = Number(get('number'));
  const lang = get('language');
  const style = get('style');
  const ff = get('family_friendly');
  const text = get('rhyme');
  if (!Number.isInteger(n) || n < 1 || n > 90) problems.push(`line ${line}: number "${get('number')}" is not 1 to 90`);
  if (!LANGUAGES.includes(lang)) problems.push(`line ${line}: unknown language "${lang}"`);
  if (!STYLES.includes(style)) problems.push(`line ${line}: unknown style "${style}"`);
  if (ff !== 'yes' && ff !== 'no') problems.push(`line ${line}: family_friendly must be yes or no, got "${ff}"`);
  if (!text) problems.push(`line ${line}: empty rhyme`);
  if ([...text].length > MAX_LENGTH) problems.push(`line ${line}: "${text}" is longer than ${MAX_LENGTH} characters`);
  return { n, lang, style, familyFriendly: ff === 'yes', text };
});

// Per-number rules (TAM-150, TAM-157).
for (let n = 1; n <= 90; n++) {
  const mine = rhymes.filter((r) => r.n === n);
  const en = mine.filter((r) => r.lang === 'en');
  if (en.length < 3) problems.push(`${n}: ${en.length} English rhymes, needs at least 3`);
  if (en.filter((r) => r.familyFriendly).length < 2) problems.push(`${n}: fewer than 2 family-friendly English rhymes`);
  if (!mine.some((r) => r.lang === 'hi')) problems.push(`${n}: no Hindi rhyme`);
  const seen = new Set();
  for (const r of mine) {
    const key = r.text.toLowerCase();
    if (seen.has(key)) problems.push(`${n}: "${r.text}" appears twice`);
    seen.add(key);
  }
}

if (problems.length) {
  console.error(`Rhyme pack not written (${problems.length} problems):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

rhymes.sort((a, b) => a.n - b.n);
const pack = {
  format: 1,
  game: 'tambola',
  pack: 'core',
  languages: LANGUAGES,
  styleWeights: STYLE_WEIGHTS,
  rhymes,
};
// One rhyme per line keeps changes easy to review.
const body = rhymes.map((r) => '    ' + JSON.stringify(r)).join(',\n');
const head = JSON.stringify({ ...pack, rhymes: undefined }, null, 2).replace(/\n}$/, '');
writeFileSync(target, `${head},\n  "rhymes": [\n${body}\n  ]\n}\n`);
console.log(`Wrote ${path.relative(root, target)}: ${rhymes.length} rhymes for 90 numbers.`);
