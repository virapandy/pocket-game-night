// The word list and the word order (WAI-010 with Version 1.1 items 2 to 5; R3; product owner 25 October, item 7):
// eligible words sorted by id, shuffled with `${seeds.words}:${gameIndex}`, words shown tonight last (oldest first), and the
// Mix of all fallback shuffled with `${seeds.words}:${gameIndex}:mix`. "Shown" is tracked by word text.
import { createRng, shuffle } from '../../../engine';
import wordsJson from '../../../../content/what-am-i/words.json';
import type { Choices, PackChoice, WaiState, WaiWord } from './types';

/** content/what-am-i/words.json, row for row with words.csv. */
export const WORDS: readonly WaiWord[] = wordsJson as unknown as WaiWord[];

const byIdCache = new WeakMap<readonly WaiWord[], Map<string, WaiWord>>();
/** The word with this id in this list. */
export function wordById(list: readonly WaiWord[], id: string): WaiWord | undefined {
  let m = byIdCache.get(list);
  if (!m) {
    m = new Map(list.map((w) => [w.id, w]));
    byIdCache.set(list, m);
  }
  return m.get(id);
}

const textOf = (list: readonly WaiWord[], id: string): string => wordById(list, id)?.word ?? id;

const eligibleCache = new WeakMap<readonly WaiWord[], Map<string, readonly WaiWord[]>>();
/**
 * Eligible words (Terms), sorted by id: the pack's words, minus non-veg words while that switch is off. Retired words are
 * left out. Mix of all lists each word text once, keeping the copy with the lowest id (R3).
 */
export function eligible(list: readonly WaiWord[], pack: PackChoice, nonveg: boolean): readonly WaiWord[] {
  let m = eligibleCache.get(list);
  if (!m) {
    m = new Map();
    eligibleCache.set(list, m);
  }
  const key = `${pack}\u0000${nonveg}`;
  const hit = m.get(key);
  if (hit) return hit;
  const live = list
    .filter((w) => w.retired_in === null && (nonveg || !w.nonveg))
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  let out: WaiWord[];
  if (pack !== 'mix') out = live.filter((w) => w.pack === pack);
  else {
    const seen = new Set<string>();
    out = live.filter((w) => (seen.has(w.word) ? false : (seen.add(w.word), true)));
  }
  m.set(key, out);
  return out;
}

/** WAI-003: the number of words a pack option offers. */
export const packCount = (pack: PackChoice, nonveg: boolean, list: readonly WaiWord[] = WORDS): number =>
  eligible(list, pack, nonveg).length;

/** Version 1.1 item 4: Mix of all's eligible words minus every word shown tonight and minus the pack's words, shuffled. */
export function fallbackWords(
  list: readonly WaiWord[], seed: string, gameIndex: number, pack: PackChoice, nonveg: boolean, shownTexts: ReadonlySet<string>,
): string[] {
  const packTexts = new Set(eligible(list, pack, true).map((w) => w.word));
  const rest = eligible(list, 'mix', nonveg).filter((w) => !shownTexts.has(w.word) && !packTexts.has(w.word)).map((w) => w.id);
  return shuffle(rest, createRng(`${seed}:${gameIndex}:mix`));
}

/** Version 1.1 items 3 and 4: a fresh unshown part for this game's choices (at `start`, or a changed pack, WAI-044). */
export function buildUnshown(
  list: readonly WaiWord[], seed: string, gameIndex: number, choices: Choices, shownTonight: readonly string[],
): { unshown: string[]; fallback: boolean } {
  const shown = new Set(shownTonight);
  const ids = eligible(list, choices.pack, choices.nonveg).map((w) => w.id);
  const unshown = shuffle(ids, createRng(`${seed}:${gameIndex}`)).filter((id) => !shown.has(textOf(list, id)));
  if (choices.pack !== 'mix' && unshown.length === 0) {
    return { unshown: fallbackWords(list, seed, gameIndex, choices.pack, choices.nonveg, shown), fallback: true };
  }
  return { unshown, fallback: false };
}

/**
 * The queue's shown part: the words shown tonight that this game can show (the pack's copy of each; with the fallback,
 * Mix of all's copy of the rest), oldest first, leaving out any id in the unshown part. Words shown in this game join it
 * only once the unshown part is empty (Version 1.1 item 6: "Queue now: Bat, Camel, Duck").
 */
export function shownPart(s: WaiState): string[] {
  if (!s.choices) return [];
  const pool = new Map<string, string>();
  for (const w of eligible(s.words, s.choices.pack, s.choices.nonveg)) pool.set(w.word, w.id);
  if (s.fallback) for (const w of eligible(s.words, 'mix', s.choices.nonveg)) if (!pool.has(w.word)) pool.set(w.word, w.id);
  const inUnshown = new Set(s.unshown);
  const thisGame = new Set(s.unshown.length > 0 ? s.shownThisGame : []);
  const out: string[] = [];
  for (const text of s.shownTonight) {
    if (thisGame.has(text)) continue;
    const id = pool.get(text);
    if (id !== undefined && !inUnshown.has(id)) out.push(id);
  }
  return out;
}

/** WAI-H1: the remaining queue as word ids, next word first. Empty before the first start and when no game is open. */
export function queueFor(state: WaiState): string[] {
  if (!gameOpen(state)) return [];
  return [...state.unshown, ...shownPart(state)];
}

/** The word on screen next: the queue's first word, or null when the queue is empty. */
export function headOf(state: WaiState): string | null {
  if (!gameOpen(state)) return null;
  if (state.unshown.length > 0) return state.unshown[0]!;
  return shownPart(state)[0] ?? null;
}

export const gameOpen = (s: WaiState): boolean => s.step === 'pass' || s.step === 'turn' || s.step === 'review';

/** A word was shown (marked, or on screen at time up): it leaves the unshown part and goes to the end of the shown order. */
export function markShown(s: WaiState, id: string): Pick<WaiState, 'unshown' | 'fallback' | 'shownTonight' | 'shownThisGame'> {
  const text = textOf(s.words, id);
  let unshown = s.unshown.filter((x) => x !== id);
  const shownTonight = [...s.shownTonight.filter((t) => t !== text), text];
  let fallback = s.fallback;
  const c = s.choices!;
  if (!fallback && c.pack !== 'mix' && unshown.length === 0) {
    unshown = fallbackWords(s.words, s.seed, s.game, c.pack, c.nonveg, new Set(shownTonight));
    fallback = true;
  }
  const shownThisGame = s.shownThisGame.includes(text) ? s.shownThisGame : [...s.shownThisGame, text];
  return { unshown, fallback, shownTonight, shownThisGame };
}

/** Version 1.1 item 5, R2: a hidden word goes to the end of the unshown part, before the shown part, and is not shown. */
export function hideWord(s: WaiState, id: string): readonly string[] {
  return [...s.unshown.filter((x) => x !== id), id];
}

/** The pack name T3 shows for a word (its own pack: for a Mix of all fallback word too). */
export const packOf = (list: readonly WaiWord[], id: string): string | null => wordById(list, id)?.pack ?? null;
