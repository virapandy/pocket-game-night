// The scenarios' own algorithms for Secret Words, written out from specs/secret-words/02-deal.md (SWD-022, SWD-024) with
// only the engine's createRng and shuffle, plus the word list read from docs/games/secret-words/words.csv. Used by the
// rule tests (helpers.ts) and the browser tests (tests/browser/secret-words.ts). They define what the build must give;
// they are not a copy of it. No import of the game itself here.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRng, shuffle } from '../../../src/engine';

export type Team = 'orange' | 'teal';
export type Kind = Team | 'nobody' | 'landmine';
export type BoardSize = 'full' | 'easy';
export type Audience = 'family' | 'grownups';

/* eslint-disable @typescript-eslint/no-explicit-any */
// ---- The word list (SWD-023, SWD-099) ----

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export const CSV_PATH = here('../../../docs/games/secret-words/words.csv');
export const JSON_PATH = here('../../../content/secret-words/words.json');
export const TEAM_NAMES_PATH = here('../../../docs/games/secret-words/team-names.csv');

/** A real CSV parser (RFC 4180: quoted fields, doubled quotes, commas and line breaks inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

const csv = parseCsv(readFileSync(CSV_PATH, 'utf8'));
export const CSV_HEADER = csv[0]!;
export const CSV_ROWS: Record<string, string>[] = csv.slice(1).map((r) => Object.fromEntries(CSV_HEADER.map((k, i) => [k, r[i] ?? ''])));

/** A word as `content/secret-words/words.json` holds it (SWD-099; types in specs/secret-words/api.md). */
export interface SecretWordsWord {
  id: string; word: string; meanings: string; category: string; audience: Audience; nonveg: boolean; edition: number;
  retired_in: number | null;
}
/** The words built straight from `words.csv`, in row order, in the `words.json` shape. */
export const WORDS: SecretWordsWord[] = CSV_ROWS.map((r) => ({
  id: r.id!, word: r.word!, meanings: r.meanings!, category: r.category!, audience: r.audience as Audience,
  nonveg: r.nonveg === 'yes', edition: Number(r.edition), retired_in: r.retired_in ? Number(r.retired_in) : null,
}));
export const wordById = (id: string): SecretWordsWord => {
  const w = WORDS.find((x) => x.id === id);
  if (!w) throw new Error(`no word ${id} in words.csv`);
  return w;
};

/** The shipped list, `content/secret-words/words.json` (SWD-099). */
export function shippedWords(): any[] {
  if (!existsSync(JSON_PATH)) throw new Error('content/secret-words/words.json is not there yet (SWD-099)');
  return JSON.parse(readFileSync(JSON_PATH, 'utf8'));
}

const pairs = parseCsv(readFileSync(TEAM_NAMES_PATH, 'utf8'));
/** `team-names.csv` (SWD-013): `{ id, orange, teal }`, 20 pairs. */
export const TEAM_PAIRS: { id: string; orange: string; teal: string }[] = pairs.slice(1).map((r) => ({ id: r[0]!, orange: r[1]!, teal: r[2]! }));

// ---- Oracle: the map code (SWD-022) ----

export const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const DECKS = 31 ** 4; // 923,521 deck seeds, 0 to 923,520
export const EDITION = 1; // the only shipped edition (SWD-023)

/** SWD-022 step 1: the candidates of an edition and audience, in `words.csv` row order. */
export function candidates(edition: number, audience: Audience, words: readonly SecretWordsWord[] = WORDS): SecretWordsWord[] {
  return words.filter((w) => w.edition <= edition && (w.retired_in === null || w.retired_in > edition) &&
    (audience === 'grownups' || w.audience === 'family'));
}
export const sizeOf = (board: BoardSize) => (board === 'full' ? 25 : 16);

/** SWD-022: the 7 symbols for config, deal index n and deck seed d, with the check symbol. No hyphen. */
export function oracleCode(cfg: { edition: number; board: BoardSize; words: Audience }, d: number, n: number): string {
  const v = [
    (cfg.edition - 1) * 4 + (cfg.board === 'easy' ? 2 : 0) + (cfg.words === 'grownups' ? 1 : 0),
    n,
    Math.floor(d / 31 ** 3) % 31, Math.floor(d / 31 ** 2) % 31, Math.floor(d / 31) % 31, d % 31,
  ];
  const check = v.reduce((s, x, i) => s + (i + 1) * x, 0) % 31;
  return [...v, check].map((x) => ALPHABET[x]).join('');
}

/** SWD-022: the parts of a well-formed 7-symbol code (no check of validity). */
export function codeParts(code: string) {
  const v = [...code].map((c) => ALPHABET.indexOf(c));
  return {
    config: v[0]!, edition: Math.floor(v[0]! / 4) + 1, board: (v[0]! & 2 ? 'easy' : 'full') as BoardSize,
    words: (v[0]! & 1 ? 'grownups' : 'family') as Audience, n: v[1]!, d: ((v[2]! * 31 + v[3]!) * 31 + v[4]!) * 31 + v[5]!,
    check: v[6]!,
  };
}

/** The last valid deal index of a deck for a board size and audience (SWD-022, SWD-039). */
export const lastN = (board: BoardSize, audience: Audience, edition = EDITION) =>
  Math.floor((candidates(edition, audience).length - sizeOf(board)) / 25);

export interface OracleBoard { ids: string[]; words: string[]; kinds: Kind[]; starts: Team; edition: number; board: BoardSize; audience: Audience }

/** SWD-022 "The board from a code", steps 1 to 4, for a valid code. (Remembered per code: the same code, the same board.) */
const boards = new Map<string, OracleBoard>();
export function oracleBoard(code: string): OracleBoard {
  let b = boards.get(code);
  if (!b) { b = boardSteps(code); boards.set(code, b); }
  return b;
}
function boardSteps(code: string): OracleBoard {
  const p = codeParts(code);
  const cands = candidates(p.edition, p.words);
  const deck = shuffle(cands, createRng(`secret-words:deck:${p.d}`));
  const size = sizeOf(p.board);
  const words = deck.slice(25 * p.n, 25 * p.n + size);
  const r = createRng(`secret-words:board:${p.d}:${p.n}`);
  const starts: Team = r.int(2) === 0 ? 'orange' : 'teal';
  const other: Team = starts === 'orange' ? 'teal' : 'orange';
  const counts = p.board === 'full' ? [9, 8, 7, 1] : [6, 5, 5, 0];
  const pile: Kind[] = [
    ...Array<Kind>(counts[0]!).fill(starts), ...Array<Kind>(counts[1]!).fill(other),
    ...Array<Kind>(counts[2]!).fill('nobody'), ...Array<Kind>(counts[3]!).fill('landmine'),
  ];
  const kinds = shuffle(pile, r);
  return { ids: words.map((w) => w.id), words: words.map((w) => w.word), kinds, starts, edition: p.edition, board: p.board, audience: p.words };
}

/** SWD-024: the deck seed the host picks. */
export function oraclePickDeck(dealSeed: string, k: number, cands: readonly string[], avoid: ReadonlySet<string>): number {
  const rng = createRng(`${dealSeed}:deck:${k}`);
  const m = Math.min(75, cands.length);
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < 200; i++) {
    const d = rng.int(DECKS);
    const deck = shuffle(cands, createRng(`secret-words:deck:${d}`));
    let score = 0;
    for (let j = 0; j < m; j++) if (avoid.has(deck[j]!)) score++;
    if (score < bestScore) { best = d; bestScore = score; }
    if (score === 0) break;
  }
  return best;
}

/**
 * SWD-024: the codes a live evening deals, in order. `next(choices)` gives the next deal's code: a new deck at the first
 * deal, whenever Board or Words changed since the last deal, and when the deck runs out.
 */
export class DeckOracle {
  k = 0;
  d = -1;
  n = 0;
  last: { board: BoardSize; words: Audience } | null = null;
  readonly dealt = new Set<string>();
  newDeck = false;
  constructor(readonly dealSeed: string, readonly recent: readonly string[] = []) {}
  next(choices: { board: BoardSize; words: Audience }): string {
    const cands = candidates(EDITION, choices.words).map((w) => w.id);
    const changed = !this.last || this.last.board !== choices.board || this.last.words !== choices.words;
    this.newDeck = changed || 25 * this.n + sizeOf(choices.board) > cands.length;
    if (this.newDeck) {
      this.k++;
      this.d = oraclePickDeck(this.dealSeed, this.k, cands, new Set([...this.dealt, ...this.recent]));
      this.n = 0;
    }
    this.last = { board: choices.board, words: choices.words };
    const code = oracleCode({ edition: EDITION, board: choices.board, words: choices.words }, this.d, this.n);
    this.n++;
    for (const id of oracleBoard(code).ids) this.dealt.add(id);
    return code;
  }
}

