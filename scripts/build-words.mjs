#!/usr/bin/env node
// Turns the approved Impostor word list (docs/games/impostor/words.csv) into the app's word file
// (content/impostor/words.json), as IMP-055 says. Refuses to write the file if any rule in IMP-054 is broken.
// Run again whenever the list changes: npm run build:words
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const source = path.join(root, 'docs/games/impostor/words.csv');
const target = path.join(root, 'content/impostor/words.json');

// IMP-007: the 9 categories, named exactly (4 October 2026).
const CATEGORIES = [
  'Food',
  'Festivals and occasions',
  'Around the house',
  'Out and about',
  'Films, music and TV',
  'Sports and games',
  'School and childhood',
  'Weddings and family',
  'Everyday moments',
];
// IMP-054: retired rows may still carry a category name from before 4 October.
const RETIRED_CATEGORIES = ['Travel and places', 'Cricket and games', 'Desi life'];
// IMP-055: only these columns go into the file; difficulty, close_cousin, change and notes stay out.
const COLUMNS = ['id', 'word', 'other_names', 'category', 'audience', 'nonveg', 'hint', 'retired'];

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

const [header, ...lines] = parseCsv(readFileSync(source, 'utf8'));
const col = Object.fromEntries(header.map((name, i) => [name.trim(), i]));
for (const name of COLUMNS) {
  if (!(name in col)) throw new Error(`words.csv has no "${name}" column`);
}

const problems = [];
const ids = new Set();
const seenWords = new Set();
const names = (text) => text.split(' / ').map((s) => s.trim().toLowerCase()).filter(Boolean);
const words = lines.map((cells, i) => {
  const line = i + 2;
  const get = (name) => cells[col[name]] ?? '';
  const id = get('id');
  const word = get('word');
  const other = get('other_names');
  const category = get('category');
  const audience = get('audience');
  const nonveg = get('nonveg');
  const hint = get('hint');
  const retired = get('retired');
  if (retired !== 'yes' && retired !== '') problems.push(`line ${line}: retired must be yes or empty, got "${retired}"`);
  if (!/^IMPW-\d{3}$/.test(id)) problems.push(`line ${line}: id "${id}" is not IMPW- and 3 digits`);
  if (ids.has(id)) problems.push(`line ${line}: id ${id} appears twice`);
  ids.add(id);
  if (!word.trim()) problems.push(`line ${line}: empty word`);
  const key = word.trim().toLowerCase();
  if (key && seenWords.has(key)) problems.push(`line ${line}: "${word}" appears twice`);
  seenWords.add(key);
  const allowed = retired === 'yes' ? [...CATEGORIES, ...RETIRED_CATEGORIES] : CATEGORIES;
  if (!allowed.includes(category)) problems.push(`line ${line}: unknown category "${category}"`);
  if (audience !== 'family' && audience !== 'grownups') problems.push(`line ${line}: audience must be family or grownups, got "${audience}"`);
  if (nonveg !== 'yes' && nonveg !== 'no') problems.push(`line ${line}: nonveg must be yes or no, got "${nonveg}"`);
  const h = hint.trim().toLowerCase();
  if (!h) problems.push(`line ${line}: empty hint`);
  else if (h === key || names(word).includes(h) || names(other).includes(h)) problems.push(`line ${line}: hint "${hint}" gives the word away`);
  return { id, word, other_names: other, category, audience, nonveg: nonveg === 'yes', hint, retired: retired === 'yes' };
});

if (problems.length) {
  console.error(`Word list not written (${problems.length} problems):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

// One word per line keeps changes easy to review. Same rows, same order as the CSV (IMP-054).
writeFileSync(target, `[\n${words.map((w) => '  ' + JSON.stringify(w)).join(',\n')}\n]\n`);
console.log(`Wrote ${path.relative(root, target)}: ${words.length} words (${words.filter((w) => !w.retired).length} active).`);
