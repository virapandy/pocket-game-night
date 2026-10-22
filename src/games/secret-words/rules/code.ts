// The map code, the board it gives and the evening's deck (specs/secret-words/02-deal.md SWD-020 to SWD-027;
// SWD-002's typed code and SWD-039's next map). Pure functions of the code and the shipped word list.
import { createRng, shuffle } from '../../../engine';
import wordsJson from '../../../../content/secret-words/words.json';
import teamNamesJson from '../../../../content/secret-words/team-names.json';
import type { Audience, Board, BoardSize, Kind, SecretWordsTeamNames, SecretWordsWord, Team } from './types';

/** The shipped word list, every edition (SWD-023). */
export const WORDS: readonly SecretWordsWord[] = wordsJson as SecretWordsWord[];
/** The team-name pairs (SWD-013). */
export const TEAM_NAMES: readonly SecretWordsTeamNames[] = teamNamesJson as SecretWordsTeamNames[];

/** Map code symbols, value = index (Terms "Map code"). */
export const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
/** Deck seeds 0 to 31⁴ − 1 = 923,520. */
export const DECK_SEEDS = 31 ** 4;

export const sizeOf = (board: BoardSize): number => (board === 'full' ? 25 : 16);

/** The newest edition a word list holds: the edition new deals use. */
export function latestEdition(words: readonly SecretWordsWord[]): number {
  let e = 0;
  for (const w of words) if (w.edition > e) e = w.edition;
  return e;
}

/** SWD-022 step 1: the candidates of an edition and Words choice, in `words.csv` row order. */
export function candidates(words: readonly SecretWordsWord[], edition: number, audience: Audience): SecretWordsWord[] {
  return words.filter((w) => w.edition <= edition && (w.retired_in === null || w.retired_in > edition) &&
    (audience === 'grownups' || w.audience === 'family'));
}

interface CodeParts {
  readonly edition: number;
  readonly board: BoardSize;
  readonly audience: Audience;
  readonly n: number;
  readonly d: number;
}

const checkOf = (v: readonly number[]): number => v.reduce((s, x, i) => s + (i + 1) * x, 0) % 31;

/** SWD-022: the 7 symbols (no hyphen) for config, deal index n and deck seed d, with the check symbol. */
export function codeFor(cfg: { edition: number; board: BoardSize; words: Audience }, deck: number, n: number): string {
  const v = [
    (cfg.edition - 1) * 4 + (cfg.board === 'easy' ? 2 : 0) + (cfg.words === 'grownups' ? 1 : 0),
    n,
    Math.floor(deck / 31 ** 3) % 31, Math.floor(deck / 31 ** 2) % 31, Math.floor(deck / 31) % 31, deck % 31,
  ];
  return [...v, checkOf(v)].map((x) => ALPHABET[x]).join('');
}

/**
 * Reads a 7-symbol code: 'invalid' (length, alphabet, check symbol, or a deal index too large for a shipped edition),
 * 'newer' (an edition this list doesn't have), or its parts. SWD-002's order: rule 1 before rule 2.
 */
function readCode(code: string, words: readonly SecretWordsWord[]): CodeParts | 'invalid' | 'newer' {
  if (typeof code !== 'string' || code.length !== 7) return 'invalid';
  const v = [...code].map((c) => ALPHABET.indexOf(c));
  if (v.some((x) => x < 0)) return 'invalid';
  if (checkOf(v.slice(0, 6)) !== v[6]) return 'invalid';
  const config = v[0]!;
  const edition = Math.floor(config / 4) + 1;
  if (edition > latestEdition(words)) return 'newer';
  const board: BoardSize = config & 2 ? 'easy' : 'full';
  const audience: Audience = config & 1 ? 'grownups' : 'family';
  const n = v[1]!;
  const d = ((v[2]! * 31 + v[3]!) * 31 + v[4]!) * 31 + v[5]!;
  if (25 * n + sizeOf(board) > candidates(words, edition, audience).length) return 'invalid';
  return { edition, board, audience, n, d };
}

/** SWD-022 "The board from a code", steps 1 to 4. */
export function boardFromCode(code: string, words: readonly SecretWordsWord[]): Board | { error: 'invalid' | 'newer' } {
  const p = readCode(code, words);
  if (p === 'invalid' || p === 'newer') return { error: p };
  const deck = shuffle(candidates(words, p.edition, p.audience), createRng(`secret-words:deck:${p.d}`));
  const dealt = deck.slice(25 * p.n, 25 * p.n + sizeOf(p.board));
  const r = createRng(`secret-words:board:${p.d}:${p.n}`);
  const starts: Team = r.int(2) === 0 ? 'orange' : 'teal';
  const other: Team = starts === 'orange' ? 'teal' : 'orange';
  const counts = p.board === 'full' ? [9, 8, 7, 1] : [6, 5, 5, 0];
  const pile: Kind[] = [
    ...Array<Kind>(counts[0]!).fill(starts), ...Array<Kind>(counts[1]!).fill(other),
    ...Array<Kind>(counts[2]!).fill('nobody'), ...Array<Kind>(counts[3]!).fill('landmine'),
  ];
  return {
    words: dealt.map((w) => w.word), ids: dealt.map((w) => w.id), kinds: shuffle(pile, r), starts,
    edition: p.edition, board: p.board, audience: p.audience,
  };
}

/** SWD-002: what was typed (any case, spaces, hyphens) as a 7-symbol code, or 'invalid' / 'newer'. */
export function parseMapCode(typed: string, words: readonly SecretWordsWord[]): string | 'invalid' | 'newer' {
  const code = String(typed).replace(/[\s-]/g, '').toUpperCase();
  const p = readCode(code, words);
  return p === 'invalid' || p === 'newer' ? p : code;
}

/** SWD-039: the same config and deck seed with deal index n + 1, or null when that is not valid. */
export function nextMapCode(code: string, words: readonly SecretWordsWord[]): string | null {
  const p = readCode(code, words);
  if (p === 'invalid' || p === 'newer') return null;
  if (p.n + 1 > 30) return null;
  const next = codeFor({ edition: p.edition, board: p.board, words: p.audience }, p.d, p.n + 1);
  return typeof readCode(next, words) === 'object' ? next : null;
}

/**
 * SWD-024: the deck seed for the evening's deck number k. Draws up to 200 seeds from `${dealSeed}:deck:${k}` and keeps
 * the one whose first min(75, candidates) words hold the fewest to avoid, the earliest on a tie, stopping at the first
 * with none. `candidates` are word ids in `words.csv` row order.
 */
export function pickDeck(dealSeed: string, k: number, cands: readonly string[], avoid: ReadonlySet<string>): number {
  const rng = createRng(`${dealSeed}:deck:${k}`);
  const m = Math.min(75, cands.length);
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < 200; i++) {
    const d = rng.int(DECK_SEEDS);
    let score = 0;
    if (avoid.size > 0) {
      const deck = shuffle(cands, createRng(`secret-words:deck:${d}`));
      for (let j = 0; j < m; j++) if (avoid.has(deck[j]!)) score++;
    }
    if (score < bestScore) { best = d; bestScore = score; }
    if (score === 0) break;
  }
  return best;
}
