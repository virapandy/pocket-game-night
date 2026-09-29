// Rhymes: specs/tambola/11-rhymes.md (TAM-150 to TAM-158) and TAM-015. The pack is content/tambola/rhymes.json.
import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/engine';
import { readCatalog } from '../../rhyme-catalog';
import { Game, pack, pickRhyme } from './helpers';

const NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1);
const INDIAN = new Set(['indian', 'cricket', 'bollywood', 'festival', 'hindi']);
const OTHER = new Set(['classic', 'playful']);
type Entry = (typeof pack.rhymes)[number];
const of = (n: number) => pack.rhymes.filter((r) => r.n === n);
const allowed = (n: number, language: 'en' | 'hi' | 'both', familyFriendly: boolean) =>
  of(n).filter((r) => (language === 'both' || r.lang === language) && (!familyFriendly || r.familyFriendly));
/** TAM-153: the family-friendly English rhymes with an Indian reference a Hindi game falls back to. */
const fallback = (n: number, rhymes: Entry[] = pack.rhymes) =>
  rhymes.filter((r) => r.n === n && r.lang === 'en' && r.familyFriendly && INDIAN.has(r.style));
/** What a game may show for `n` (TAM-153): with Hindi and no Hindi rhyme for `n`, the English fallback. */
const mayShow = (n: number, language: 'en' | 'hi' | 'both', familyFriendly: boolean) =>
  language === 'hi' && of(n).every((r) => r.lang !== 'hi') ? fallback(n) : allowed(n, language, familyFriendly);

/** Every rhyme shown in a full game (90 calls), with its number. */
function rhymesOfGame(seed: string, rhymes = { language: 'en', familyFriendly: true }) {
  const g = new Game({ seed, settings: { rhymes } });
  const shown: { n: number; rhyme: Entry | null }[] = [];
  for (let i = 0; i < 90; i++) {
    g.call();
    shown.push({ n: g.host.current.number, rhyme: g.host.current.rhyme });
  }
  return shown;
}

describe('TAM-157: the rhyme pack is valid', () => {
  it('carries a format version and the known languages', () => {
    expect(pack.format).toBe(1);
    expect(pack.languages).toEqual(expect.arrayContaining(['en', 'hi']));
  });

  it('every entry has a number 1–90, a language, a style, a family-friendly flag and text', () => {
    for (const r of pack.rhymes) {
      expect(Number.isInteger(r.n) && r.n >= 1 && r.n <= 90, JSON.stringify(r)).toBe(true);
      expect(pack.languages).toContain(r.lang);
      expect(Object.keys(pack.styleWeights)).toContain(r.style);
      expect(typeof r.familyFriendly).toBe('boolean');
      expect(r.text.trim().length).toBeGreaterThan(0);
    }
  });

  it('no number has the same rhyme twice', () => {
    for (const n of NUMBERS) {
      const texts = of(n).map((r) => r.text.trim().toLowerCase());
      expect(new Set(texts).size, `number ${n}`).toBe(texts.length);
    }
  });
});

describe('TAM-150: every number has several rhymes', () => {
  it.each(NUMBERS)('%i: at least 3 English, 2 of them family-friendly, and 1 family-friendly English with an Indian reference', (n) => {
    const en = of(n).filter((r) => r.lang === 'en');
    expect(en.length).toBeGreaterThanOrEqual(3);
    expect(en.filter((r) => r.familyFriendly).length).toBeGreaterThanOrEqual(2);
    expect(fallback(n).length).toBeGreaterThanOrEqual(1);
  });

  it('Hindi rhymes exist for most numbers, but not necessarily all: the pack has them for the same numbers as the catalog (55 of 90 today)', () => {
    const hindiIn = (rhymes: { n: number; lang: string }[]) => [...new Set(rhymes.filter((r) => r.lang === 'hi').map((r) => r.n))].sort((a, b) => a - b);
    const inCatalog = hindiIn(readCatalog());
    expect(inCatalog.length, 'most numbers').toBeGreaterThan(45);
    expect(hindiIn(pack.rhymes), 'numbers with a Hindi rhyme, pack against docs/games/tambola/rhymes.csv').toEqual(inCatalog);
  });
});

describe('TAM-156: rhymes are short enough to read aloud and fit the screen', () => {
  it('every rhyme is at most 40 characters', () => {
    const long = pack.rhymes.filter((r) => [...r.text].length > 40).map((r) => `${r.n}: ${r.text}`);
    expect(long).toEqual([]);
  });
});

describe('TAM-158: Indian references come first', () => {
  it('Indian styles weigh 2 and the others 1', () => {
    for (const [style, w] of Object.entries(pack.styleWeights)) {
      if (INDIAN.has(style)) expect(w, style).toBe(2);
      if (OTHER.has(style)) expect(w, style).toBe(1);
    }
  });

  it('every number has a family-friendly English rhyme with an Indian reference', () => {
    const missing = NUMBERS.filter((n) => !of(n).some((r) => r.lang === 'en' && r.familyFriendly && INDIAN.has(r.style)));
    expect(missing).toEqual([]);
  });

  it('over many games, each Indian-reference rhyme comes up about twice as often as each other rhyme', () => {
    // For every call, the chance of an Indian rhyme is 2·I / (2·I + O) over the allowed rhymes.
    let observed = 0, expected = 0, variance = 0;
    for (let s = 0; s < 300; s++) {
      for (const { n, rhyme } of rhymesOfGame(`weights-${s}`)) {
        const a = allowed(n, 'en', true);
        const i = a.filter((r) => INDIAN.has(r.style)).length;
        const p = (2 * i) / (2 * i + (a.length - i));
        expected += p;
        variance += p * (1 - p);
        if (rhyme && INDIAN.has(rhyme.style)) observed++;
      }
    }
    const z = (observed - expected) / Math.sqrt(variance);
    expect(Math.abs(z), `observed ${observed} Indian rhymes, expected about ${expected.toFixed(0)}`).toBeLessThan(4);
  });
});

describe('TAM-151: a rhyme is picked at random on each call', () => {
  it('every rhyme shown is one of the allowed rhymes for its number', () => {
    for (const { n, rhyme } of rhymesOfGame('allowed-only')) {
      expect(allowed(n, 'en', true)).toContainEqual(rhyme);
    }
  });

  it('over many games, every allowed rhyme for every number gets picked', () => {
    const seen = new Map<number, Set<string>>();
    for (let s = 0; s < 300; s++) {
      for (const { n, rhyme } of rhymesOfGame(`coverage-${s}`)) {
        if (!seen.has(n)) seen.set(n, new Set());
        seen.get(n)!.add(rhyme!.text);
      }
    }
    for (const n of NUMBERS) {
      const never = allowed(n, 'en', true).map((r) => r.text).filter((t) => !seen.get(n)?.has(t));
      expect(never, `number ${n}`).toEqual([]);
    }
  });
});

describe('TAM-152: the same game always shows the same rhymes', () => {
  it('two games from one seed show the same rhyme on every call', () => {
    expect(rhymesOfGame('same-rhymes')).toEqual(rhymesOfGame('same-rhymes'));
  });

  it('a replay shows the same rhymes, "Another rhyme" included', () => {
    const g = new Game({ seed: 'replay-rhymes' }).call(5);
    g.do({ type: 'another-rhyme' });
    g.call(3);
    g.do({ type: 'another-rhyme' });
    g.do({ type: 'another-rhyme' });
    const again = g.replayed();
    expect(Game.fromMatch(again).host.current).toEqual(g.host.current);
  });
});

describe('TAM-153: the host chooses the rhyme language', () => {
  it('Hindi: a number with a Hindi rhyme shows only Hindi rhymes', () => {
    for (const { n, rhyme } of rhymesOfGame('hindi', { language: 'hi', familyFriendly: true })) {
      if (of(n).some((r) => r.lang === 'hi')) expect(rhyme?.lang, `number ${n}`).toBe('hi');
    }
  });

  it('Hindi: a number with no Hindi rhyme shows a family-friendly English rhyme with an Indian reference, never the number alone', () => {
    for (const familyFriendly of [true, false]) {
      for (let s = 0; s < 5; s++) {
        for (const { n, rhyme } of rhymesOfGame(`hindi-fallback-${s}`, { language: 'hi', familyFriendly })) {
          if (of(n).some((r) => r.lang === 'hi')) continue;
          expect(rhyme, `number ${n}`).not.toBeNull();
          expect(fallback(n), `number ${n} (family-friendly filter ${familyFriendly ? 'on' : 'off'})`).toContainEqual(rhyme);
        }
      }
    }
  });

  it('Hindi: the numbers the catalog gives no Hindi rhyme fall back to English in a game (checked against the catalog)', () => {
    const catalog = readCatalog();
    const withoutHindi = new Set(NUMBERS.filter((n) => !catalog.some((r) => r.n === n && r.lang === 'hi')));
    expect(withoutHindi.size).toBeGreaterThan(0);
    const wrong: string[] = [];
    for (const { n, rhyme } of rhymesOfGame('hindi-catalog', { language: 'hi', familyFriendly: true })) {
      if (!withoutHindi.has(n)) continue;
      const ok = fallback(n, catalog).some((r) => r.text === rhyme?.text);
      if (!ok) wrong.push(`${n}: ${rhyme ? `"${rhyme.text}" (${rhyme.lang}, ${rhyme.style})` : 'no rhyme'}`);
    }
    expect(wrong, 'numbers with no Hindi rhyme in docs/games/tambola/rhymes.csv').toEqual([]);
  });

  it('English: only English rhymes', () => {
    for (const { rhyme } of rhymesOfGame('english', { language: 'en', familyFriendly: true })) expect(rhyme?.lang).toBe('en');
  });

  it('Both: either language can come up', () => {
    const langs = new Set(rhymesOfGame('both', { language: 'both', familyFriendly: true }).map((x) => x.rhyme?.lang));
    expect([...langs].sort()).toEqual(['en', 'hi']);
  });
});

describe('TAM-154: family-friendly rhymes by default', () => {
  it('a new game uses the family-friendly filter', () => {
    const g = new Game();
    expect(g.match.setup.config.settings.rhymes.familyFriendly).toBe(true);
    for (const { rhyme } of rhymesOfGame('ff-default')) expect(rhyme?.familyFriendly).toBe(true);
  });

  it('with the filter off, rhymes not marked family-friendly can come up', () => {
    const notFf = pack.rhymes.filter((r) => r.lang === 'en' && !r.familyFriendly);
    expect(notFf.length).toBeGreaterThan(0);
    let seen = 0;
    for (let s = 0; s < 200 && seen === 0; s++) {
      seen += rhymesOfGame(`ff-off-${s}`, { language: 'en', familyFriendly: false }).filter((x) => x.rhyme && !x.rhyme.familyFriendly).length;
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe('TAM-155: the anchor can ask for another rhyme', () => {
  it('shows a different allowed rhyme; the number and the calls stay the same', () => {
    const g = new Game({ seed: 'another' }).call(4);
    const before = g.host;
    g.do({ type: 'another-rhyme' });
    const after = g.host;
    expect(after.current.number).toBe(before.current.number);
    expect(after.called).toEqual(before.called);
    expect(after.current.rhyme.text).not.toBe(before.current.rhyme.text);
    expect(allowed(after.current.number, 'en', true)).toContainEqual(after.current.rhyme);
  });

  it('is not possible before the first number', () => {
    expect(new Game().try({ type: 'another-rhyme' }).ok).toBe(false);
  });
});

describe('pickRhyme (TAM-015, TAM-151, TAM-153, TAM-154)', () => {
  const ff = { language: 'en', familyFriendly: true };

  it('TAM-015: a number with no allowed rhyme gives null, so the number is shown alone', () => {
    const without67 = { ...pack, rhymes: pack.rhymes.filter((r) => r.n !== 67) };
    expect(pickRhyme(without67, 67, ff, createRng('x'))).toBeNull();
  });

  it('TAM-153: with Hindi, a number without Hindi rhymes gets a family-friendly English rhyme with an Indian reference', () => {
    const noHindi = new Set([7, 67]);
    const cut = { ...pack, rhymes: pack.rhymes.filter((r) => !(noHindi.has(r.n) && r.lang === 'hi')) };
    const rng = createRng('fallback');
    for (const n of noHindi) {
      const ok = fallback(n, cut.rhymes);
      expect(ok.length, `number ${n} has a fallback in the pack`).toBeGreaterThan(0);
      for (const familyFriendly of [true, false]) {
        for (let i = 0; i < 20; i++) expect(ok, `number ${n}`).toContainEqual(pickRhyme(cut, n, { language: 'hi', familyFriendly }, rng));
      }
    }
    // A number that keeps its Hindi rhymes still gets a Hindi one.
    expect(pickRhyme(cut, 8, { language: 'hi', familyFriendly: true }, rng)?.lang).toBe('hi');
  });

  it('TAM-153 and TAM-015: with Hindi, a number with no rhyme at all still gives null', () => {
    const without67 = { ...pack, rhymes: pack.rhymes.filter((r) => r.n !== 67) };
    expect(pickRhyme(without67, 67, { language: 'hi', familyFriendly: true }, createRng('x'))).toBeNull();
  });

  it('only returns rhymes allowed by the settings, for the right number', () => {
    const rng = createRng('pick');
    for (const n of NUMBERS) {
      for (const settings of [ff, { language: 'hi', familyFriendly: true }, { language: 'both', familyFriendly: false }]) {
        const r = pickRhyme(pack, n, settings, rng);
        expect(mayShow(n, settings.language as any, settings.familyFriendly)).toContainEqual(r);
      }
    }
  });

  it('never returns the excluded rhyme when another is allowed (TAM-155)', () => {
    const rng = createRng('exclude');
    for (const n of NUMBERS) {
      const first = pickRhyme(pack, n, ff, rng);
      for (let i = 0; i < 10; i++) expect(pickRhyme(pack, n, ff, rng, first.text).text).not.toBe(first.text);
    }
  });

  it('is repeatable: the same seed gives the same picks', () => {
    const a = createRng('same'), b = createRng('same');
    for (const n of NUMBERS) expect(pickRhyme(pack, n, ff, a)).toEqual(pickRhyme(pack, n, ff, b));
  });
});
