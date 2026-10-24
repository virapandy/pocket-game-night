// What Am I? word list (C3: the word list format; specs/what-am-i/02-words.md and 01-setup.md WAI-003; R3; WAI-092 B9).
// The list itself is docs/games/what-am-i/words.csv (726 rows, edition 1). The checks on the CSV run now; the checks on
// the build (content/what-am-i/words.json, the queue's eligible words) are written with `wit` (ahead of the build).
import { describe, expect, it } from 'vitest';
import {
  COUNTS_NONVEG, COUNTS_VEG, CSV_HEADER, CSV_LINES, CSV_ROWS, Night, PACKS, WORDS, eligible, shippedWords, wit, type PackChoice,
} from './helpers';

describe('words.csv as the scenarios count it (WAI-003, R3)', () => {
  it('has the header, 726 rows, ids WAIW-nnn unique and ascending, and only the eight packs', () => {
    expect(CSV_LINES[0]).toBe(CSV_HEADER);
    expect(CSV_ROWS).toHaveLength(726);
    const ids = WORDS.map((w) => w.id);
    for (const id of ids) expect(id).toMatch(/^WAIW-\d{3}$/);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(ids.slice().sort());
    for (const w of WORDS) {
      expect(PACKS).toContain(w.pack);
      expect(w.audience).toBe('family');
      expect(w.edition).toBe(1);
      expect(w.retired_in).toBeNull();
    }
    for (const r of CSV_ROWS) expect(['yes', 'no']).toContain(r[4]);
  });

  it('WAI-003: each option counts its eligible words: Mix of all 714, Animals 92, Food 88 … (non-veg off); Food 98, Mix 724 (on)', () => {
    for (const pack of ['mix', ...PACKS] as PackChoice[]) {
      expect(eligible(WORDS, pack, false).length, `${pack}, non-veg off`).toBe(COUNTS_VEG[pack]);
      expect(eligible(WORDS, pack, true).length, `${pack}, non-veg on`).toBe(COUNTS_NONVEG[pack]);
    }
  });

  it('R3: exactly two words sit in two packs, Bat and Swimming; Mix of all keeps the lowest id of each', () => {
    const texts = new Map<string, string[]>();
    for (const w of WORDS) texts.set(w.word, [...(texts.get(w.word) ?? []), w.id]);
    const twice = [...texts].filter(([, ids]) => ids.length > 1).map(([t, ids]) => [t, ids.sort()]);
    expect(twice).toEqual([['Bat', ['WAIW-040', 'WAIW-191']], ['Swimming', ['WAIW-170', 'WAIW-251']]]);
    const mix = eligible(WORDS, 'mix', true).map((w) => w.id);
    expect(mix).toContain('WAIW-040');
    expect(mix).toContain('WAIW-170');
    expect(mix).not.toContain('WAIW-191');
    expect(mix).not.toContain('WAIW-251');
  });

  it('WAI-020 / WAI-080: the longest word is 22 characters', () => {
    expect(Math.max(...WORDS.map((w) => w.word.length))).toBe(22);
  });
});

describe('the shipped word list (C3, list format; specs/what-am-i/api.md)', () => {
  wit('content/what-am-i/words.json holds every CSV row, in row order, with the CSV values (WAI-092: ids kept)', () => {
    expect(shippedWords()).toEqual(WORDS);
  });
});

describe('WAI-010 / WAI-003: the queue holds exactly the eligible words', () => {
  wit('each pack, non-veg off and on: the queue at start is every eligible word once (WAI-003 counts)', () => {
    for (const nonveg of [false, true]) {
      for (const pack of ['mix', ...PACKS] as PackChoice[]) {
        const n = new Night({ seed: `count-${pack}-${nonveg}` }).start(undefined, { pack, nonveg });
        const q = n.queue;
        expect(q.length, `${pack}, non-veg ${nonveg}`).toBe((nonveg ? COUNTS_NONVEG : COUNTS_VEG)[pack]);
        expect(new Set(q).size).toBe(q.length);
        expect(new Set(q)).toEqual(new Set(eligible(WORDS, pack, nonveg).map((w) => w.id)));
      }
    }
  });

  wit('WAI-003 / WA9: with "Include non-veg food" off no non-veg word is ever in the queue', () => {
    const nonvegIds = new Set(WORDS.filter((w) => w.nonveg).map((w) => w.id));
    expect(nonvegIds.size).toBe(10);
    for (const pack of ['mix', 'Food'] as PackChoice[]) {
      const q = new Night({ seed: `veg-${pack}` }).start(undefined, { pack, nonveg: false }).queue;
      for (const id of q) expect(nonvegIds.has(id), id).toBe(false);
    }
  });

  wit('R3 / Version 1.1 item 2: Mix of all has Bat and Swimming once each, the lowest-id copy (WAIW-040, WAIW-170)', () => {
    const q = new Night({ seed: 'r3' }).start(undefined, { pack: 'mix', nonveg: true }).queue;
    expect(q).toContain('WAIW-040');
    expect(q).toContain('WAIW-170');
    expect(q).not.toContain('WAIW-191');
    expect(q).not.toContain('WAIW-251');
  });
});
