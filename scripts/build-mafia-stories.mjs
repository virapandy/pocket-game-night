#!/usr/bin/env node
// Turns the approved Mafia morning stories into the app's content file (MAF-037, edition 1.2):
//   docs/games/mafia/stories.csv → content/mafia/stories.json
// One object per CSV row, in row order, { id, kind, text }; the notes column stays out.
// Refuses to write anything if a check fails. Run again whenever the list changes: npm run build:stories
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'docs/games/mafia/stories.csv');
const out = path.join(root, 'content/mafia');

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

const [header, ...lines] = parseCsv(readFileSync(src, 'utf8'));
const col = Object.fromEntries(header.map((name, i) => [name.trim(), i]));
for (const name of ['id', 'kind', 'text']) if (!(name in col)) throw new Error(`stories.csv has no "${name}" column`);

const problems = [];
const ids = new Set();
const stories = lines.map((cells, i) => {
  const line = i + 2;
  const s = { id: cells[col.id] ?? '', kind: cells[col.kind] ?? '', text: cells[col.text] ?? '' };
  if (!/^MAFS-\d{2}$/.test(s.id)) problems.push(`line ${line}: id "${s.id}" is not MAFS- and 2 digits`);
  if (ids.has(s.id)) problems.push(`line ${line}: id ${s.id} appears twice`);
  ids.add(s.id);
  if (s.kind !== 'out' && s.kind !== 'saved') problems.push(`line ${line}: kind must be out or saved`);
  if (s.kind === 'out' && !s.text.includes('{NAME}')) problems.push(`line ${line}: an out story must name {NAME}`);
  if (s.kind === 'saved' && s.text.includes('{NAME}')) problems.push(`line ${line}: a saved story names nobody`);
  if (!s.text.trim()) problems.push(`line ${line}: no text`);
  return s;
});

if (problems.length) {
  console.error(`Mafia stories not written (${problems.length} problems):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
const json = `[\n${stories.map((x) => '  ' + JSON.stringify(x)).join(',\n')}\n]\n`;
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'stories.json'), json);
console.log(`Wrote content/mafia/stories.json: ${stories.length} stories.`);
