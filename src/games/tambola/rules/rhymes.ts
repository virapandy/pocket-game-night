// Rhymes (specs/tambola/11-rhymes.md): one allowed rhyme per call, picked by the game's seeded
// generator, with Indian-reference styles twice as likely (the pack's styleWeights, TAM-158).
import type { Rng } from '../../../engine';
import packJson from '../../../../content/tambola/rhymes.json';
import type { Rhyme, RhymePack, RhymeSettings } from './types';

/** The approved rhyme pack, built from docs/games/tambola/rhymes.csv. */
export const rhymePack = packJson as unknown as RhymePack;

/** Styles with an Indian reference (TAM-158). */
const INDIAN_STYLES = new Set(['indian', 'cricket', 'bollywood', 'festival', 'hindi']);

const byNumber = new WeakMap<RhymePack, Map<number, Rhyme[]>>();

function rhymesFor(pack: RhymePack, n: number): readonly Rhyme[] {
  let index = byNumber.get(pack);
  if (!index) {
    index = new Map();
    for (const r of pack.rhymes) {
      const list = index.get(r.n);
      if (list) list.push(r);
      else index.set(r.n, [r]);
    }
    byNumber.set(pack, index);
  }
  return index.get(n) ?? [];
}

/**
 * One rhyme for number `n` allowed by the host's settings (with the Hindi fallback, TAM-153), or null if none (TAM-015).
 * Never the `excludeText` rhyme if another one is allowed ("Another rhyme", TAM-155).
 */
export function pickRhyme(
  pack: RhymePack,
  n: number,
  settings: RhymeSettings,
  rng: Rng,
  excludeText?: string,
): Rhyme | null {
  const mine = rhymesFor(pack, n);
  let allowed = mine.filter(
    (r) => (settings.language === 'both' || r.lang === settings.language) && (!settings.familyFriendly || r.familyFriendly),
  );
  // A Hindi game and a number with no Hindi rhyme: one of its family-friendly English rhymes with an
  // Indian reference instead (TAM-153), whatever the family-friendly setting.
  if (allowed.length === 0 && settings.language === 'hi' && !mine.some((r) => r.lang === 'hi')) {
    allowed = mine.filter((r) => r.lang === 'en' && r.familyFriendly && INDIAN_STYLES.has(r.style));
  }
  if (allowed.length === 0) return null;
  const others = excludeText === undefined ? allowed : allowed.filter((r) => r.text !== excludeText);
  const pool = others.length > 0 ? others : allowed;
  const weights = pool.map((r) => Math.max(1, Math.round(pack.styleWeights[r.style] ?? 1)));
  let x = rng.int(weights.reduce((a, b) => a + b, 0));
  for (let i = 0; i < pool.length; i++) {
    x -= weights[i]!;
    if (x < 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}
