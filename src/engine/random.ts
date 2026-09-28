// Seeded randomness. Rules never call Math.random(): every random choice comes from a generator
// built from a seed, so the same seed always gives the same game (TAM-073).
//
// Making a fresh secret seed needs real randomness, so that happens in the app, not here.

export type Seed = string;

export interface Rng {
  /** A whole number from 0 up to, but not including, `maxExclusive`. Every value is equally likely. */
  int(maxExclusive: number): number;
}

/** Builds a generator from a seed (cyrb128 hash feeding sfc32). Same seed, same sequence, on every phone. */
export function createRng(seed: Seed): Rng {
  let [a, b, c, d] = cyrb128(seed);
  const nextUint32 = (): number => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return t >>> 0;
  };
  // Warm up so similar seeds do not start with similar numbers.
  for (let i = 0; i < 15; i++) nextUint32();

  return {
    int(maxExclusive) {
      if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 2 ** 32) {
        throw new RangeError(`int() needs a whole number from 1 to 2^32, got ${maxExclusive}`);
      }
      // Rejection sampling: drop the top sliver of values so no result is favoured.
      const limit = 2 ** 32 - (2 ** 32 % maxExclusive);
      let x = nextUint32();
      while (x >= limit) x = nextUint32();
      return x % maxExclusive;
    },
  };
}

/** A new list in random order (Fisher–Yates). The input is left unchanged. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** One item chosen at random. */
export function pick<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new RangeError('pick() needs at least one item');
  return items[rng.int(items.length)] as T;
}

/**
 * A separate, repeatable seed for one purpose inside a game (for example rhyme choices), so using
 * one stream never shifts another. Not a way to hide secrets: a derived seed is only as secret as its parent.
 */
export function deriveSeed(seed: Seed, purpose: string): Seed {
  return cyrb128(`${purpose}\u0000${seed}`).map((n) => n.toString(16).padStart(8, '0')).join('');
}

function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}
