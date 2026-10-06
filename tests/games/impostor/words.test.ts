// Impostor words (specs/impostor/06-words.md, C3): IMP-050 to IMP-055, scenarios v3.5 (4 October 2026: 311 rows,
// 291 active and 20 retired; new category names).
// The list rules are checked on docs/games/impostor/words.csv and on the shipped content/impostor/words.json;
// the picking rules through `pickWord` (Test hooks item 1), given the words that may be dealt (`ACTIVE`), and through
// whole evenings on the engine.
// Expected to fail (not built yet): tests marked `it.fails` need the 4 October list in content/impostor/words.json
// (Impostor round 4, item 5). A marked test that starts passing turns red: then remove its `.fails` mark.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '../../../src/engine';
import {
  ACTIVE, CATEGORIES, COMMON_CATEGORIES, CSV_HEADER, CSV_ROWS, DEFAULT_CHOICES, Evening, FAMILY_VEG, FAMILY_VEG_COMMON,
  RETIRED_CATEGORIES, RETIRED_IDS, WORDS, expectedGroup, passesChoices, pickWord, randomOutcome, seedList, shippedWords,
  wordById, type ImpostorWord, type WordFilter,
} from './helpers';

const none = new Set<string>();
const filter = (over: Partial<WordFilter> = {}): WordFilter => ({
  words: 'family', categories: [...CATEGORIES], nonveg: false, usedTonight: none, recent: none, blocked: none, allowRepeats: false, ...over,
});

/** fast-check: a random filter over the real list (audience, a non-empty set of categories, non-veg, used/recent/blocked sets). */
const filterArb = fc.record({
  words: fc.constantFrom<'family' | 'grownups'>('family', 'grownups'),
  categories: fc.subarray([...CATEGORIES], { minLength: 1 }),
  nonveg: fc.boolean(),
  used: fc.subarray(ACTIVE.map((w) => w.id)),
  recent: fc.subarray(ACTIVE.map((w) => w.id)),
  blocked: fc.subarray(ACTIVE.map((w) => w.id)),
  allowRepeats: fc.boolean(),
  seed: fc.string({ minLength: 1, maxLength: 12 }),
}).map((r) => ({
  seed: r.seed,
  f: {
    words: r.words, categories: r.categories, nonveg: r.nonveg, usedTonight: new Set(r.used), recent: new Set(r.recent),
    blocked: new Set(r.blocked), allowRepeats: r.allowRepeats,
  } as WordFilter,
}));

describe('IMP-050: words come from the list with the chosen audience', () => {
  it('Whole family deals only family words; + Grown-ups deals family or grown-ups words', () => {
    for (let i = 0; i < 300; i++) {
      const fam = pickWord(ACTIVE, filter({ words: 'family' }), createRng(`fam-${i}`));
      expect(fam).not.toBeNull();
      expect(fam!.audience).toBe('family');
    }
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const w = pickWord(ACTIVE, filter({ words: 'grownups' }), createRng(`gu-${i}`));
      expect(['family', 'grownups']).toContain(w!.audience);
      seen.add(w!.audience);
    }
    expect([...seen].sort(), '+ Grown-ups also deals grown-ups words').toEqual(['family', 'grownups']);
  });

  it('only from categories switched on, and non-veg words only with "Include non-veg food" on', () => {
    for (let i = 0; i < 300; i++) {
      const w = pickWord(ACTIVE, filter({ categories: ['Sports and games'] }), createRng(`cat-${i}`));
      expect(w!.category).toBe('Sports and games');
    }
    const nonvegIds = ACTIVE.filter((w) => w.nonveg).map((w) => w.id);
    expect(nonvegIds.length, 'the list has non-veg words to test with').toBeGreaterThan(0);
    const food = filter({ categories: ['Food'] });
    for (let i = 0; i < 2000; i++) expect(pickWord(ACTIVE, food, createRng(`veg-${i}`))!.nonveg).toBe(false);
    // Only the non-veg words left: with non-veg off nothing is dealt, with it on one of them is.
    const onlyNonveg = new Set(ACTIVE.filter((w) => w.category === 'Food' && !w.nonveg).map((w) => w.id));
    expect(pickWord(ACTIVE, filter({ categories: ['Food'], blocked: onlyNonveg, words: 'grownups' }), createRng('nv-off'))).toBeNull();
    const w = pickWord(ACTIVE, filter({ categories: ['Food'], blocked: onlyNonveg, words: 'grownups', nonveg: true }), createRng('nv-on'));
    expect(nonvegIds).toContain(w!.id);
  });

  it('property (10,000 seeded picks over random filters): every picked word passes the filter; tolerance 0', () => {
    fc.assert(
      fc.property(filterArb, ({ seed, f }) => {
        const w = pickWord(ACTIVE, f, createRng(seed));
        if (w === null) return;
        expect(passesChoices(w, f), `${w.id} does not pass ${JSON.stringify({ ...f, usedTonight: undefined, recent: undefined, blocked: undefined })}`).toBe(true);
        expect(f.blocked.has(w.id), `${w.id} is blocked`).toBe(false);
      }),
      { numRuns: 10_000 },
    );
  });

  it('a picked word is the list entry itself, whole (id, word, other names, category, hint)', () => {
    const w = pickWord(ACTIVE, filter(), createRng('whole'));
    expect(ACTIVE).toContainEqual(w);
  });
});

describe('IMP-052: tonight\'s and recent evenings\' words are avoided', () => {
  it('property: each pick comes from the first non-empty group (not tonight, not recent; then not tonight but recent), never blocked; null when both are empty', () => {
    fc.assert(
      fc.property(filterArb, ({ seed, f }) => {
        const group = expectedGroup(ACTIVE, f);
        const w = pickWord(ACTIVE, f, createRng(seed));
        if (group.length === 0) expect(w, 'no word is left, so pickWord gives null').toBeNull();
        else {
          expect(w, 'a word is left, so pickWord gives one').not.toBeNull();
          expect(group, `${w!.id} is not in the group IMP-052 picks from`).toContain(w!.id);
        }
      }),
      { numRuns: 3000 },
    );
  });

  it('a word dealt in the last 3 evenings is dealt only when every other allowed word was dealt tonight or recently', () => {
    const food = ACTIVE.filter((w) => passesChoices(w, { ...DEFAULT_CHOICES, categories: ['Food'] })).map((w) => w.id);
    const [a, b, ...rest] = food;
    // Group 1 is {a}: everything else was dealt tonight or recently.
    const f1 = filter({ categories: ['Food'], usedTonight: new Set(rest.slice(0, 10)), recent: new Set([b!, ...rest.slice(10)]) });
    for (let i = 0; i < 50; i++) expect(pickWord(ACTIVE, f1, createRng(`g1-${i}`))!.id).toBe(a);
    // Group 1 empty: the recent words not dealt tonight form group 2.
    const f2 = filter({ categories: ['Food'], usedTonight: new Set([a!, ...rest.slice(0, 10)]), recent: new Set([b!, ...rest.slice(10)]) });
    const picked = new Set<string>();
    for (let i = 0; i < 400; i++) picked.add(pickWord(ACTIVE, f2, createRng(`g2-${i}`))!.id);
    expect([...picked].every((id) => id === b || rest.slice(10).includes(id))).toBe(true);
  });

  it('picks uniformly by the seed within the group (3 words, 9,000 seeds: each 33.3% ± 2%)', () => {
    const three = FAMILY_VEG.slice(0, 3);
    const f = filter({ blocked: new Set(FAMILY_VEG.slice(3)), words: 'family' });
    expect(expectedGroup(ACTIVE, f).sort()).toEqual([...three].sort());
    const count: Record<string, number> = {};
    const N = 9000;
    for (let i = 0; i < N; i++) { const id = pickWord(ACTIVE, f, createRng(`uni-${i}`))!.id; count[id] = (count[id] ?? 0) + 1; }
    for (const id of three) expect(Math.abs((count[id] ?? 0) / N - 1 / 3), `${id} share`).toBeLessThanOrEqual(0.02);
  });

  it('the same seed always picks the same word', () => {
    for (const s of seedList(50, 'same')) {
      expect(pickWord(ACTIVE, filter(), createRng(s))).toEqual(pickWord(ACTIVE, filter(), createRng(s)));
    }
  });

  it('"Allow repeats": every allowed word that is not blocked may be dealt again, picked uniformly', () => {
    const three = FAMILY_VEG.slice(0, 3);
    const blocked = new Set(FAMILY_VEG.slice(3));
    // All three dealt tonight and recently: without "Allow repeats" no word is left.
    const f = filter({ usedTonight: new Set(three), recent: new Set(three), blocked });
    expect(pickWord(ACTIVE, f, createRng('rep-0'))).toBeNull();
    const count: Record<string, number> = {};
    const N = 9000;
    for (let i = 0; i < N; i++) {
      const id = pickWord(ACTIVE, { ...f, allowRepeats: true }, createRng(`rep-${i}`))!.id;
      count[id] = (count[id] ?? 0) + 1;
    }
    for (const id of three) expect(Math.abs((count[id] ?? 0) / N - 1 / 3), `${id} share`).toBeLessThanOrEqual(0.02);
    // Blocked words stay out even with "Allow repeats"; when every allowed word is blocked there is none.
    expect(pickWord(ACTIVE, { ...f, allowRepeats: true, blocked: new Set(FAMILY_VEG) }, createRng('rep-x'))).toBeNull();
  });

  it('an evening never deals a word from its frozen excluded sets while others are left (dealt tonight, recent, blocked)', () => {
    // The 6 categories named alike before and after 4 October, so at least 20 words stay allowed on either list.
    const k = Math.floor((FAMILY_VEG_COMMON.length - 20) / 3);
    const dealtTonight = FAMILY_VEG_COMMON.slice(0, k);
    const recent = FAMILY_VEG_COMMON.slice(k, 2 * k);
    const blocked = FAMILY_VEG_COMMON.slice(2 * k, 3 * k);
    for (const s of seedList(40, 'frozen')) {
      const e = new Evening({ seed: s, excludedWords: { dealtTonight, recent, blocked }, choices: { categories: [...COMMON_CATEGORIES] } });
      e.startDeal();
      for (let r = 0; r < 8; r++) {
        const id = e.wordId();
        expect(dealtTonight.includes(id) || recent.includes(id) || blocked.includes(id), `${s}: ${id} was excluded`).toBe(false);
        e.playRound({ kind: 'escaped' });
        e.nextRound();
      }
    }
  });
});

describe('IMP-051: no word repeats in an evening', () => {
  it('property (1,000 seeded evenings of 30 dealt rounds, random filters, no "Allow repeats"): no word id appears twice; tolerance 0', () => {
    let evenings = 0;
    for (let i = 0; evenings < 1000; i++) {
      const rng = createRng(`imp051-${i}`);
      // Random categories among the 6 named alike before and after 4 October, so the evening reads the same on either list.
      const categories = COMMON_CATEGORIES.filter(() => rng.int(2) === 0);
      const choices = { words: rng.int(2) ? 'grownups' as const : 'family' as const, categories, nonveg: rng.int(2) === 0 };
      // At least 40 words must pass, so 30 dealt rounds never run out of words.
      if (categories.length === 0 || ACTIVE.filter((w) => passesChoices(w, choices)).length < 40) continue;
      evenings++;
      const n = 3 + rng.int(10);
      const e = new Evening({ seed: `imp051-seed-${i}`, players: Array.from({ length: n }, (_, k) => `P${k + 1}`), choices });
      const dealt: string[] = [];
      e.startDeal(rng.int(4) === 0);
      dealt.push(e.wordId());
      while (dealt.length < 30) {
        const roll = rng.int(10);
        if (roll === 0) e.must({ type: 'dontKnow' }); // "Don't know this word?" (any moment of the deal)
        else if (roll === 1) e.must({ type: 'dealAgain' });
        else { e.playRound(randomOutcome(rng)); e.nextRound(); }
        dealt.push(e.wordId());
      }
      const dupes = dealt.filter((id, k) => dealt.indexOf(id) !== k);
      expect(dupes, `evening imp051-${i}: words dealt twice`).toEqual([]);
    }
  });

  it('given-up, dealt-again and practice words count as dealt (the next deal never brings them back)', () => {
    for (const s of seedList(30, 'counted')) {
      const e = new Evening({ seed: s });
      e.startDeal(true);
      const practice = e.wordId();
      e.must({ type: 'seen' }).must({ type: 'dontKnow' });
      const afterDontKnow = e.wordId();
      e.must({ type: 'dealAgain' });
      const afterDealAgain = e.wordId();
      expect(new Set([practice, afterDontKnow, afterDealAgain]).size).toBe(3);
      e.playRound({ kind: 'escaped' });
      e.nextRound();
      expect([practice, afterDontKnow, afterDealAgain]).not.toContain(e.wordId());
    }
  });
});

describe('IMP-053: both names are shown where a thing has two', () => {
  it('"Kheer / Payasam" is one word of the list, with "Payesh" as its other name', () => {
    const w = wordById('IMPW-007');
    expect(w.word).toBe('Kheer / Payasam');
    expect(w.other_names).toBe('Payesh');
    expect(shippedWords().find((x: any) => x.id === 'IMPW-007')).toEqual(w);
  });
});

const NAME_SPLIT = ' / ';
function checkRows(rows: ImpostorWord[], where: string) {
  // Retired rows (IMP-054) may carry a retired category name.
  const ids = new Set<string>();
  const words = new Set<string>();
  for (const r of rows) {
    expect(r.id, `${where}: id`).toMatch(/^IMPW-\d{3}$/);
    expect(ids.has(r.id), `${where}: ${r.id} is not unique`).toBe(false);
    ids.add(r.id);
    expect(r.word.trim(), `${where}: ${r.id} word`).not.toBe('');
    const allowed: readonly string[] = r.retired ? [...CATEGORIES, ...RETIRED_CATEGORIES] : CATEGORIES;
    expect(allowed, `${where}: ${r.id} category "${r.category}"`).toContain(r.category);
    expect(typeof r.retired, `${where}: ${r.id} retired`).toBe('boolean');
    expect(['family', 'grownups'], `${where}: ${r.id} audience`).toContain(r.audience);
    expect(typeof r.nonveg, `${where}: ${r.id} nonveg`).toBe('boolean');
    expect(r.hint.trim(), `${where}: ${r.id} hint`).not.toBe('');
    const names = [r.word, ...r.word.split(NAME_SPLIT), ...(r.other_names ? r.other_names.split(NAME_SPLIT) : [])].map((x) => x.trim().toLowerCase());
    expect(names, `${where}: ${r.id} hint "${r.hint}" gives the word away`).not.toContain(r.hint.trim().toLowerCase());
    const key = r.word.toLowerCase();
    expect(words.has(key), `${where}: the word "${r.word}" appears twice`).toBe(false);
    words.add(key);
  }
}

describe('IMP-054: every word in the list is valid', () => {
  it('words.csv: ids IMPW- plus 3 digits and unique, a word, one of the 9 categories (retired rows: or a retired name), audience, nonveg yes/no, retired "yes" or empty, a hint that is not the word or one of its names', () => {
    for (const r of CSV_ROWS) expect(['yes', 'no'], `${r.id} nonveg "${r.nonveg}"`).toContain(r.nonveg);
    expect(CSV_HEADER).toContain('retired');
    for (const r of CSV_ROWS) expect(['yes', ''], `${r.id} retired "${r.retired}"`).toContain(r.retired);
    checkRows(WORDS, 'words.csv');
  });

  it('the 4 October list: 311 rows, 291 active in the 9 categories, 20 retired', () => {
    expect(WORDS.length).toBe(311);
    expect(ACTIVE.length).toBe(291);
    expect(RETIRED_IDS.length).toBe(20);
    for (const w of ACTIVE) expect(CATEGORIES as readonly string[], `${w.id} is active in "${w.category}"`).toContain(w.category);
    expect(new Set(ACTIVE.map((w) => w.category)).size, 'every category has active words').toBe(9);
  });

  it('a renamed word gets a new id and its old row is retired with its old word (IMPW-397 → IMPW-403, IMPW-402 → IMPW-404)', () => {
    expect(wordById('IMPW-397')).toMatchObject({ word: 'One more on the seat', retired: true });
    expect(wordById('IMPW-403')).toMatchObject({ word: 'Squeezing in one more', retired: false });
    expect(wordById('IMPW-402')).toMatchObject({ word: 'Five more minutes, then phone off', retired: true });
    expect(wordById('IMPW-404')).toMatchObject({ word: 'Screen time', retired: false });
  });

  it('words.json has exactly the rows of words.csv, in the same order, with retired true/false, and passes the same checks', () => {
    const json = shippedWords();
    expect(Array.isArray(json)).toBe(true);
    checkRows(json, 'words.json');
    expect(json).toEqual(WORDS);
  });

  it('property (300 seeded evenings of 30 dealt rounds, random choices): a retired word is never dealt', () => {
    let evenings = 0;
    for (let i = 0; evenings < 300; i++) {
      const rng = createRng(`retired-${i}`);
      const categories = CATEGORIES.filter(() => rng.int(2) === 0);
      const choices = { words: rng.int(2) ? 'grownups' as const : 'family' as const, categories, nonveg: rng.int(2) === 0 };
      if (categories.length === 0 || ACTIVE.filter((w) => passesChoices(w, choices)).length < 40) continue;
      evenings++;
      const e = new Evening({ seed: `retired-seed-${i}`, choices });
      const dealt: string[] = [];
      e.startDeal(rng.int(4) === 0);
      dealt.push(e.wordId());
      while (dealt.length < 30) {
        const roll = rng.int(10);
        if (roll === 0) e.must({ type: 'dontKnow' });
        else if (roll === 1) e.must({ type: 'dealAgain' });
        else { e.playRound(randomOutcome(rng)); e.nextRound(); }
        dealt.push(e.wordId());
      }
      expect(dealt.filter((id) => RETIRED_IDS.includes(id)), `evening retired-${i}: retired words dealt`).toEqual([]);
      for (const id of dealt) expect(choices.categories as string[], `evening retired-${i}: ${id} is in a chosen category`).toContain(wordById(id).category);
    }
  });
});

describe('IMP-055: the shipped word list file', () => {
  it('each entry is exactly { id, word, other_names, category, audience, nonveg, hint, retired }, with nonveg and retired true/false and other_names as in the CSV', () => {
    const json = shippedWords();
    for (const e of json) expect(Object.keys(e).sort()).toEqual(['audience', 'category', 'hint', 'id', 'nonveg', 'other_names', 'retired', 'word']);
    expect(json.find((e: any) => e.id === 'IMPW-004')).toEqual({
      id: 'IMPW-004', word: 'Samosa', other_names: '', category: 'Food', audience: 'family', nonveg: false, hint: 'Tea time', retired: false,
    });
    expect(json.find((e: any) => e.id === 'IMPW-005').other_names).toBe('Golgappa / Puchka');
    expect(json.find((e: any) => e.id === 'IMPW-057').retired).toBe(true);
  });

  it('the CSV columns difficulty, close_cousin, change and notes are not in the file', () => {
    for (const col of ['difficulty', 'close_cousin', 'change', 'notes']) expect(CSV_HEADER).toContain(col);
    const text = JSON.stringify(shippedWords());
    for (const col of ['difficulty', 'close_cousin', 'change', 'notes']) expect(text).not.toContain(`"${col}"`);
  });
});

describe('words.csv of 6 October (decision I28): Bharatanatyam for grown-ups, Iron box hint "Wrinkles"', () => {
  it('the shipped list has IMPW-146 Bharatanatyam as + Grown-ups (never dealt with Whole family) and IMPW-086 Iron box with the hint "Wrinkles"', () => {
    const shipped = shippedWords();
    const b = shipped.find((w: any) => w.id === 'IMPW-146');
    const i = shipped.find((w: any) => w.id === 'IMPW-086');
    expect(b.word).toBe('Bharatanatyam');
    expect(b.audience).toBe('grownups');
    expect(i.word).toBe('Iron box');
    expect(i.hint).toBe('Wrinkles');
    const family = shipped.filter((w: any) => w.audience === 'family' && !w.retired).map((w: any) => w.id);
    expect(family).not.toContain('IMPW-146');
  });
});
