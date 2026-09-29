// The reviewed rhyme catalog, docs/games/tambola/rhymes.csv: the source the app's pack is made from
// (specs/tambola/11-rhymes.md). Read by the rule tests and the browser tests, so both check against the
// catalog the owner approved, not against whatever pack happens to be built.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface CatalogRhyme { n: number; lang: string; style: string; familyFriendly: boolean; text: string }

/** Styles with an Indian reference (TAM-158). */
export const INDIAN_STYLES = new Set(['indian', 'cricket', 'bollywood', 'festival', 'hindi']);

/** Splits one CSV file into rows of fields (quoted fields may hold commas and doubled quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

export function readCatalog(): CatalogRhyme[] {
  const csv = readFileSync(fileURLToPath(new URL('../docs/games/tambola/rhymes.csv', import.meta.url)), 'utf8');
  const [header, ...rows] = parseCsv(csv);
  const col = (name: string) => header!.indexOf(name);
  const [n, lang, style, ff, text] = ['number', 'language', 'style', 'family_friendly', 'rhyme'].map(col);
  return rows.map((r) => ({
    n: Number(r[n!]),
    lang: r[lang!]!.trim(),
    style: r[style!]!.trim(),
    familyFriendly: r[ff!]!.trim() === 'yes',
    text: r[text!]!.trim(),
  }));
}

/** Numbers 1–90 that have no Hindi rhyme in the catalog (35 today). */
export function numbersWithoutHindi(catalog = readCatalog()): number[] {
  const hi = new Set(catalog.filter((r) => r.lang === 'hi').map((r) => r.n));
  return Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => !hi.has(n));
}
