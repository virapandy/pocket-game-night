// The seeded picks: word (IMP-050 to IMP-052), impostor (IMP-061) and starter (IMP-021). Pure; the rng is the engine's.
import type { Rng } from '../../../engine';
import wordsJson from '../../../../content/impostor/words.json';
import type { ImpostorWord, WordFilter } from './types';

/** The shipped word list, built from docs/games/impostor/words.csv (IMP-055). */
export const WORDS = wordsJson as unknown as readonly ImpostorWord[];
/** The words that may be dealt (IMP-054: never a retired one). */
export const ACTIVE_WORDS: readonly ImpostorWord[] = WORDS.filter((w) => !w.retired);

const byId = new Map(WORDS.map((w) => [w.id, w]));
export const wordById = (id: string): ImpostorWord | undefined => byId.get(id);

/** IMP-050: does the word pass the audience, category and non-veg choices? */
export function passesChoices(w: ImpostorWord, f: Pick<WordFilter, 'words' | 'categories' | 'nonveg'>): boolean {
  if (f.words === 'family' && w.audience !== 'family') return false;
  if (!f.categories.includes(w.category)) return false;
  return f.nonveg || !w.nonveg;
}

/**
 * IMP-052: uniformly from the first non-empty group of allowed, unblocked words: (1) not dealt tonight and not recent,
 * (2) not dealt tonight but recent. With "Allow repeats", from every allowed, unblocked word. Null when none is left.
 */
export function pickWord(words: readonly ImpostorWord[], filter: WordFilter, rng: Rng): ImpostorWord | null {
  const ok = words.filter((w) => passesChoices(w, filter) && !filter.blocked.has(w.id));
  let pool = ok;
  if (!filter.allowRepeats) {
    const fresh = ok.filter((w) => !filter.usedTonight.has(w.id));
    const first = fresh.filter((w) => !filter.recent.has(w.id));
    pool = first.length > 0 ? first : fresh;
  }
  return pool.length > 0 ? pool[rng.int(pool.length)]! : null;
}

/** IMP-061: uniformly among players who were not the impostor in both of the last two completed rounds. */
export function pickImpostor(players: readonly string[], recentImpostors: readonly string[], rng: Rng): string {
  const n = recentImpostors.length;
  const twice = n >= 2 && recentImpostors[n - 1] === recentImpostors[n - 2] ? recentImpostors[n - 1] : null;
  const eligible = players.filter((p) => p !== twice);
  const pool = eligible.length > 0 ? eligible : players;
  return pool[rng.int(pool.length)]!;
}

/**
 * IMP-021: uniformly among players who have not started this cycle and are not `skip` (the impostor, in Hard).
 * When nobody qualifies, a new cycle starts first.
 */
export function pickStarter(
  players: readonly string[],
  startedThisCycle: readonly string[],
  skip: string | null,
  rng: Rng,
): { starter: string; newCycle: boolean } {
  const notSkipped = players.filter((p) => p !== skip);
  const eligible = notSkipped.filter((p) => !startedThisCycle.includes(p));
  const newCycle = eligible.length === 0;
  const pool = newCycle ? (notSkipped.length > 0 ? notSkipped : players) : eligible;
  return { starter: pool[rng.int(pool.length)]!, newCycle };
}

/** IMP-041: one round's points for every player of the round (0 when none). */
export function scoreRound(
  outcome: { impostor: string; caught: boolean; guessedRight: boolean | null },
  players: readonly string[],
): Record<string, number> {
  const points: Record<string, number> = {};
  for (const p of players) {
    if (!outcome.caught) points[p] = p === outcome.impostor ? 2 : 0;
    else if (outcome.guessedRight) points[p] = p === outcome.impostor ? 1 : 0;
    else points[p] = p === outcome.impostor ? 0 : 1;
  }
  return points;
}
