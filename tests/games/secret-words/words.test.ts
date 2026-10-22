// The word list (specs/secret-words/09-usability.md SWD-099 and 02-deal.md SWD-023; C3, content). Written before the
// build, 22 October 2026. The browser half of SWD-099 (every word fits its cell) is tests/browser/secret-words-c3.spec.ts.
import { describe, expect, it } from 'vitest';
import { candidates, CSV_HEADER, CSV_ROWS, shippedWords, TEAM_PAIRS, WORDS } from './helpers';

describe('SWD-099: the word list check', () => {
  it('words.csv has exactly the columns SWD-023 names, in order (the source the app is built from)', () => {
    expect(CSV_HEADER).toEqual(['id', 'word', 'meanings', 'category', 'audience', 'nonveg', 'edition', 'retired_in', 'notes']);
  });

  it('content/secret-words/words.json is built from words.csv: { id, word, meanings, category, audience, nonveg, edition, retired_in }[], row for row', () => {
    const shipped = shippedWords();
    expect(shipped).toEqual(WORDS);
  });

  it('ids are unique', () => {
    const ids = shippedWords().map((w: any) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every word is 3 to 8 letters A–Z, unique ignoring case', () => {
    const words: string[] = shippedWords().map((w: any) => w.word);
    expect(words.filter((w) => !/^[A-Za-z]{3,8}$/.test(w))).toEqual([]);
    const lower = words.map((w) => w.toLowerCase());
    expect(lower.filter((w, i) => lower.indexOf(w) !== i)).toEqual([]);
  });

  it('every edition\'s candidates are at most 775 words (31 deals of 25), for both Words choices', () => {
    const shipped = shippedWords();
    const editions = [...new Set(shipped.map((w: any) => w.edition as number))];
    for (const e of editions) {
      for (const a of ['family', 'grownups'] as const) expect(candidates(e, a, shipped).length, `edition ${e}, ${a}`).toBeLessThanOrEqual(775);
    }
  });
});

describe('SWD-023: words and editions', () => {
  it('edition 1 is every row with edition 1; audience is family or grownups; nonveg yes or no; retired_in blank or a later edition', () => {
    for (const r of CSV_ROWS) {
      expect(['family', 'grownups'], r.id).toContain(r.audience);
      expect(['yes', 'no'], r.id).toContain(r.nonveg);
      expect(Number.isInteger(Number(r.edition)) && Number(r.edition) >= 1, r.id).toBe(true);
      if (r.retired_in) expect(Number(r.retired_in), r.id).toBeGreaterThan(Number(r.edition));
    }
    expect(WORDS.filter((w) => w.edition === 1).length).toBeGreaterThan(0);
  });

  it('at most 7 editions fit the config symbol', () => {
    expect(Math.max(...WORDS.map((w) => w.edition))).toBeLessThanOrEqual(7);
  });

  it('edition 1, Whole family has 439 candidates (v3.5 item 9; SWD-039\'s worked number)', () => {
    expect(candidates(1, 'family').length).toBe(439);
  });

  it('non-veg words are dealt (K10): they are candidates like any other word', () => {
    const nonveg = WORDS.filter((w) => w.nonveg && w.edition === 1);
    const cands = new Set(candidates(1, 'grownups').map((w) => w.id));
    for (const w of nonveg) expect(cands.has(w.id), w.id).toBe(true);
  });
});

describe('SWD-013 (content): team-names.csv as the deal uses it', () => {
  it('20 pairs with ids SWDT-01 to SWDT-20; every name at most 18 characters', () => {
    expect(TEAM_PAIRS.map((p) => p.id)).toEqual(Array.from({ length: 20 }, (_, i) => `SWDT-${String(i + 1).padStart(2, '0')}`));
    for (const p of TEAM_PAIRS) {
      expect(p.orange.length, p.orange).toBeLessThanOrEqual(18);
      expect(p.teal.length, p.teal).toBeLessThanOrEqual(18);
    }
    expect(TEAM_PAIRS[0]).toEqual({ id: 'SWDT-01', orange: 'Chai Champions', teal: 'Coffee Commandos' });
  });
});
