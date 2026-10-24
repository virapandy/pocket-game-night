#!/usr/bin/env node
// Turns the approved What Am I? word list into the app's content file (specs/what-am-i/api.md, "The word list"):
//   docs/games/what-am-i/words.csv → content/what-am-i/words.json
// One object per CSV row, in row order; the notes column stays out. Refuses to write anything if a check fails.
// Run again whenever the list changes: npm run build:words
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const csv = path.join(root, 'docs/games/what-am-i/words.csv');
const out = path.join(root, 'content/what-am-i');

const PACKS = ['Animals', 'Food', 'Around the house', 'Jobs', 'Sports and cricket', 'Festivals and places', 'Act it out', 'Famous Indians'];

/** A real CSV parser: quoted fields, doubled quotes, commas and line breaks inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
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

const [header, ...lines] = parseCsv(readFileSync(csv, 'utf8'));
const col = Object.fromEntries(header.map((name, i) => [name.trim(), i]));
const columns = ['id', 'word', 'pack', 'audience', 'nonveg', 'edition', 'retired_in'];
for (const name of columns) if (!(name in col)) throw new Error(`words.csv has no "${name}" column`);

const problems = [];
const ids = new Set();
let last = '';
const words = lines.map((cells, i) => {
  const r = Object.fromEntries(columns.map((name) => [name, cells[col[name]] ?? '']));
  const line = i + 2;
  if (!/^WAIW-\d{3}$/.test(r.id)) problems.push(`line ${line}: id "${r.id}" is not WAIW- and 3 digits`);
  if (ids.has(r.id)) problems.push(`line ${line}: id ${r.id} appears twice`);
  if (r.id <= last) problems.push(`line ${line}: id ${r.id} is not after ${last}`);
  ids.add(r.id); last = r.id;
  if (!r.word.trim()) problems.push(`line ${line}: empty word`);
  if (!PACKS.includes(r.pack)) problems.push(`line ${line}: unknown pack "${r.pack}"`);
  if (r.audience !== 'family') problems.push(`line ${line}: audience must be family`);
  if (r.nonveg !== 'yes' && r.nonveg !== 'no') problems.push(`line ${line}: nonveg must be yes or no`);
  const edition = Number(r.edition);
  if (!Number.isInteger(edition) || edition < 1) problems.push(`line ${line}: edition must be a whole number from 1`);
  const retired = r.retired_in === '' ? null : Number(r.retired_in);
  if (retired !== null && !(Number.isInteger(retired) && retired > edition)) problems.push(`line ${line}: retired_in must be blank or a later edition`);
  return { id: r.id, word: r.word, pack: r.pack, audience: r.audience, nonveg: r.nonveg === 'yes', edition, retired_in: retired };
});
// A word text may sit in two packs (R3), but never twice in one pack.
const inPack = new Set();
for (const w of words) {
  const key = `${w.pack}\u0000${w.word}`;
  if (inPack.has(key)) problems.push(`"${w.word}" appears twice in ${w.pack}`);
  inPack.add(key);
}

if (problems.length) {
  console.error(`What Am I? word list not written (${problems.length} problems):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

const json = `[\n${words.map((x) => '  ' + JSON.stringify(x)).join(',\n')}\n]\n`;
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'words.json'), json);
console.log(`Wrote content/what-am-i/words.json: ${words.length} words.`);
