// What Am I?: the scenarios' own word-order rules (WAI-010 with Version 1.1 items 2 to 5), written out with the engine's
// createRng and shuffle, and the word list read straight from docs/games/what-am-i/words.csv. The tests compare the build
// with these. Shared with the browser helper (tests/browser/what-am-i.ts). No game code is imported here.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRng, shuffle } from '../../../src/engine';

export const PACKS = [
  'Animals', 'Food', 'Around the house', 'Jobs', 'Sports and cricket', 'Festivals and places', 'Act it out', 'Famous Indians',
] as const;
export type Pack = (typeof PACKS)[number];
export type PackChoice = Pack | 'mix';

export interface WaiWord {
  id: string; word: string; pack: Pack; audience: 'family'; nonveg: boolean; edition: number; retired_in: number | null;
}

export const CSV_PATH = fileURLToPath(new URL('../../../docs/games/what-am-i/words.csv', import.meta.url));
export const CSV_TEXT = readFileSync(CSV_PATH, 'utf8');
export const CSV_HEADER = 'id,word,pack,audience,nonveg,edition,retired_in,notes';

/** One CSV line into fields (quoted fields allowed). */
export function csvFields(line: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

export const CSV_LINES = CSV_TEXT.split(/\r?\n/).filter((l) => l.trim() !== '');
export const CSV_ROWS: string[][] = CSV_LINES.slice(1).map(csvFields);

/** The word list as the build's content/what-am-i/words.json must hold it (specs/what-am-i/api.md). */
export const WORDS: WaiWord[] = CSV_ROWS.map((r) => ({
  id: r[0]!, word: r[1]!, pack: r[2] as Pack, audience: r[3] as 'family', nonveg: r[4] === 'yes', edition: Number(r[5]),
  retired_in: r[6] ? Number(r[6]) : null,
}));
export const byId = new Map(WORDS.map((w) => [w.id, w]));
export const idOf = (word: string, pack?: Pack): string => {
  const w = WORDS.find((x) => x.word === word && (!pack || x.pack === pack));
  if (!w) throw new Error(`no word "${word}" in words.csv`);
  return w.id;
};
export const textOf = (id: string, list: readonly WaiWord[] = WORDS): string => list.find((w) => w.id === id)?.word ?? `?${id}`;

const sortById = (a: WaiWord, b: WaiWord) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Eligible words (Terms), sorted by id (Version 1.1 item 2). Mix of all lists each word text once, keeping the copy with
 * the lowest id (R3).
 */
export function eligible(list: readonly WaiWord[], pack: PackChoice, nonveg: boolean): WaiWord[] {
  const live = list.filter((w) => w.retired_in === null && (nonveg || !w.nonveg)).slice().sort(sortById);
  if (pack !== 'mix') return live.filter((w) => w.pack === pack);
  const seen = new Set<string>();
  return live.filter((w) => (seen.has(w.word) ? false : (seen.add(w.word), true)));
}

/**
 * The queue at `start` (Version 1.1 items 3 and 4): the unshown part in shuffled order, then the shown part (words shown
 * earlier tonight, oldest first-shown first). `shownTonight` holds ids in the order they were first shown. "Shown" is by
 * word text (product owner, 25 October, item 7): a word in two packs shown under either id counts as shown for both.
 * When the chosen pack has no unshown word at start, the Mix of all fallback is the unshown part.
 */
export function startQueue(
  list: readonly WaiWord[], seed: string, gameIndex: number, pack: PackChoice, nonveg: boolean, shownTonight: readonly string[] = [],
): { unshown: string[]; shown: string[]; fallback: boolean } {
  const elig = eligible(list, pack, nonveg);
  const text = (id: string) => list.find((w) => w.id === id)?.word ?? id;
  const shown = new Set(shownTonight.map(text));
  let unshown = shuffle(elig.map((w) => w.id), createRng(`${seed}:${gameIndex}`)).filter((id) => !shown.has(text(id)));
  // the shown part: the eligible copy of each word shown tonight, in first-shown order
  const byText = new Map(elig.map((w) => [w.word, w.id]));
  const shownPart = shownTonight.map((id) => byText.get(text(id))).filter((id): id is string => id !== undefined);
  let fallback = false;
  if (pack !== 'mix' && unshown.length === 0) { unshown = fallbackWords(list, seed, gameIndex, pack, nonveg, shownTonight); fallback = true; }
  return { unshown, shown: shownPart, fallback };
}

/** Version 1.1 item 4: Mix of all's eligible words minus every word shown tonight and minus the pack's words, shuffled. */
export function fallbackWords(
  list: readonly WaiWord[], seed: string, gameIndex: number, pack: Pack, nonveg: boolean, shownTonight: readonly string[],
): string[] {
  const text = (id: string) => list.find((w) => w.id === id)?.word ?? id;
  const shown = new Set(shownTonight.map(text));
  const packTexts = new Set(eligible(list, pack, true).map((w) => w.word));
  const rest = eligible(list, 'mix', nonveg).filter((w) => !shown.has(w.word) && !packTexts.has(w.word)).map((w) => w.id);
  return shuffle(rest, createRng(`${seed}:${gameIndex}:mix`));
}

/** WAI-003's counts with words.csv edition 1. */
export const COUNTS_VEG: Record<PackChoice, number> = {
  mix: 714, Animals: 92, Food: 88, 'Around the house': 100, Jobs: 94, 'Sports and cricket': 87, 'Festivals and places': 91,
  'Act it out': 100, 'Famous Indians': 64,
};
export const COUNTS_NONVEG: Record<PackChoice, number> = { ...COUNTS_VEG, mix: 724, Food: 98 };

/** Version 1.1 item 6: the five Animals words of the worked example (WAI-H7), and a seed whose first game shuffles them to
 * Owl, Tiger, Duck, Bat, Camel (found with the engine's createRng and shuffle; checked in queue.test.ts). */
export const EXAMPLE_WORDS: WaiWord[] = ['Tiger', 'Camel', 'Owl', 'Duck', 'Bat'].map((t) => byId.get(idOf(t, 'Animals'))!);
export const EXAMPLE_SEED = 't31';

export const NAMES = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev'];
export const OM = 'Om';

/** K2 of the screen map (Version 1.1 item 38): Got it per turn, round 1 then round 2, in turn order; and the passes. */
export const K2_GOT: number[][] = [[5, 7, 5, 3, 4, 6], [4, 7, 8, 4, 3, 5]];
export const K2_PASSED: number[][] = [[2, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0]];
