#!/usr/bin/env node
// Turns the approved Secret Words lists into the app's content files, as SWD-099 and SWD-013 say:
//   docs/games/secret-words/words.csv      → content/secret-words/words.json
//   docs/games/secret-words/team-names.csv → content/secret-words/team-names.json
// Refuses to write anything if a check of SWD-099 or SWD-023 fails. Run again whenever a list changes:
// npm run build:words
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'docs/games/secret-words');
const out = path.join(root, 'content/secret-words');

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

function table(file, columns) {
  const [header, ...lines] = parseCsv(readFileSync(path.join(dir, file), 'utf8'));
  const col = Object.fromEntries(header.map((name, i) => [name.trim(), i]));
  for (const name of columns) if (!(name in col)) throw new Error(`${file} has no "${name}" column`);
  return lines.map((cells) => Object.fromEntries(columns.map((name) => [name, cells[col[name]] ?? ''])));
}

const problems = [];

// ---- words.csv (SWD-023, SWD-099). The notes column stays out. ----
const rows = table('words.csv', ['id', 'word', 'meanings', 'category', 'audience', 'nonveg', 'edition', 'retired_in']);
const ids = new Set();
const seen = new Set();
const words = rows.map((r, i) => {
  const line = i + 2;
  if (!/^SWDW-\d{3}$/.test(r.id)) problems.push(`line ${line}: id "${r.id}" is not SWDW- and 3 digits`);
  if (ids.has(r.id)) problems.push(`line ${line}: id ${r.id} appears twice`);
  ids.add(r.id);
  if (!/^[A-Za-z]{3,8}$/.test(r.word)) problems.push(`line ${line}: "${r.word}" is not 3 to 8 letters A–Z`);
  const key = r.word.toLowerCase();
  if (seen.has(key)) problems.push(`line ${line}: "${r.word}" appears twice`);
  seen.add(key);
  if (r.audience !== 'family' && r.audience !== 'grownups') problems.push(`line ${line}: audience must be family or grownups`);
  if (r.nonveg !== 'yes' && r.nonveg !== 'no') problems.push(`line ${line}: nonveg must be yes or no`);
  const edition = Number(r.edition);
  if (!Number.isInteger(edition) || edition < 1 || edition > 7) problems.push(`line ${line}: edition must be 1 to 7`);
  const retired = r.retired_in === '' ? null : Number(r.retired_in);
  if (retired !== null && !(Number.isInteger(retired) && retired > edition)) problems.push(`line ${line}: retired_in must be blank or a later edition`);
  return {
    id: r.id, word: r.word, meanings: r.meanings, category: r.category, audience: r.audience, nonveg: r.nonveg === 'yes',
    edition, retired_in: retired,
  };
});
// Every edition's candidates stay at most 775 words (31 deals of 25), for both Words choices.
for (const e of new Set(words.map((w) => w.edition))) {
  for (const audience of ['family', 'grownups']) {
    const n = words.filter((w) => w.edition <= e && (w.retired_in === null || w.retired_in > e) && (audience === 'grownups' || w.audience === 'family')).length;
    if (n > 775) problems.push(`edition ${e}, ${audience}: ${n} candidates (at most 775)`);
  }
}

// ---- team-names.csv (SWD-013). The notes column stays out. ----
const pairs = table('team-names.csv', ['id', 'orange', 'teal']);
pairs.forEach((p, i) => {
  if (p.id !== `SWDT-${String(i + 1).padStart(2, '0')}`) problems.push(`team-names line ${i + 2}: id "${p.id}" out of order`);
  for (const name of [p.orange, p.teal]) {
    if (!name.trim() || name.length > 18) problems.push(`team-names line ${i + 2}: "${name}" must be 1 to 18 characters`);
  }
});

if (problems.length) {
  console.error(`Secret Words lists not written (${problems.length} problems):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

// One entry per line keeps changes easy to review. Same rows, same order as the CSV.
const lines = (xs) => `[\n${xs.map((x) => '  ' + JSON.stringify(x)).join(',\n')}\n]\n`;
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'words.json'), lines(words));
writeFileSync(path.join(out, 'team-names.json'), lines(pairs));
console.log(`Wrote content/secret-words: ${words.length} words, ${pairs.length} team-name pairs.`);
