// What Am I? word order and its seed (C3; specs/what-am-i/02-words.md WAI-010 with Version 1.1 items 1 to 6; WAI-040 and
// WAI-043's hidden word, R2; WAI-044's new queue). The build is compared with the scenarios' own algorithm (oracle.ts).
// "Shown" is tracked by word text (product owner's clarification, 25 October, item 7): Bat shown as WAIW-040 counts as shown
// for WAIW-191 too.
import { describe, expect } from 'vitest';
import fc from 'fast-check';
import { createRng, shuffle } from '../../../src/engine';
import {
  EXAMPLE_SEED, EXAMPLE_WORDS, Night, PACKS, WORDS, eligible, fallbackWords, idOf, startQueue, wit, type PackChoice, type WaiWord,
} from './helpers';

const ids = (words: readonly WaiWord[]) => words.map((w) => w.id);

describe('WAI-010: the queue at start', () => {
  wit('Version 1.1 items 2, 3: the queue is shuffle(eligible sorted by id, createRng(`${seeds.words}:1`)) for each pack', () => {
    for (const nonveg of [false, true]) {
      for (const pack of ['mix', ...PACKS] as PackChoice[]) {
        for (const seed of ['alpha', 'b2', `s-${pack}`]) {
          const n = new Night({ seed }).start(undefined, { pack, nonveg });
          const want = startQueue(WORDS, seed, 1, pack, nonveg);
          expect(n.queue, `${pack}, non-veg ${nonveg}, seed ${seed}`).toEqual([...want.unshown, ...want.shown]);
        }
      }
    }
  });

  wit('WAI-H1: the same seed gives the same order; another seed another order', () => {
    const a = new Night({ seed: 'same' }).start().queue;
    const b = new Night({ seed: 'same' }).start().queue;
    const c = new Night({ seed: 'other' }).start().queue;
    expect(b).toEqual(a);
    expect(c).not.toEqual(a);
  });

  wit('the first word on T3 is the queue\'s first word, and each mark moves to the next one', () => {
    const n = new Night({ seed: 'next' }).start(undefined, { pack: 'Animals' });
    const q = n.queue;
    expect(n.got()).toBe(q[0]);
    expect(n.pass()).toBe(q[1]);
    expect(n.got()).toBe(q[2]);
    expect(n.queue.slice(0, q.length - 3)).toEqual(q.slice(3));
  });

  wit('Version 1.1 item 3: game 2 shuffles with `${seeds.words}:2`; words shown in game 1 follow, oldest first-shown first', () => {
    const n = new Night({ seed: 'two-games' }).start();
    const shown: string[] = [];
    shown.push(...n.turn('GGPGP', { timeUpWord: true }).shown); n.save();
    shown.push(...n.turn('PGG').shown); n.save();
    n.endGame();
    n.start();
    const want = startQueue(WORDS, 'two-games', 2, 'mix', false, shown);
    expect(want.shown).toEqual(shown);
    expect(n.queue).toEqual([...want.unshown, ...want.shown]);
    expect(n.queue.slice(-shown.length)).toEqual(shown);
  });
});

describe('Version 1.1 item 6: the worked example (WAI-H7, five Animals words)', () => {
  wit('the seed shuffles the five words to Owl, Tiger, Duck, Bat, Camel', () => {
    const n = new Night({ seed: EXAMPLE_SEED, testWords: EXAMPLE_WORDS }).start(undefined, { pack: 'Animals' });
    expect(n.queue).toEqual(['Owl', 'Tiger', 'Duck', 'Bat', 'Camel'].map((t) => idOf(t, 'Animals')));
  });

  wit('Owl (Got it), Tiger (Pass), Duck paused: queue Bat, Camel, Duck; then Bat, Camel, Duck at time up: shown part Owl, Tiger, Bat, Camel, Duck', () => {
    const id = (t: string) => idOf(t, 'Animals');
    // the oracle agrees with the scenario's stated order
    expect(shuffle(ids(EXAMPLE_WORDS).slice().sort(), createRng(`${EXAMPLE_SEED}:1`))).toEqual(['Owl', 'Tiger', 'Duck', 'Bat', 'Camel'].map(id));
    const n = new Night({ seed: EXAMPLE_SEED, testWords: EXAMPLE_WORDS }).start(['Riya', 'Arjun'], { pack: 'Animals' });
    expect(n.got()).toBe(id('Owl'));
    expect(n.pass()).toBe(id('Tiger'));
    expect(n.pauseHiding()).toBe(id('Duck'));
    expect(n.queue).toEqual([id('Bat'), id('Camel'), id('Duck')]);
    n.resume();
    expect(n.got()).toBe(id('Bat'));
    expect(n.got()).toBe(id('Camel'));
    expect(n.timeUp(true)).toBe(id('Duck'));
    expect(n.queue).toEqual(['Owl', 'Tiger', 'Bat', 'Camel', 'Duck'].map(id));
    const v = n.view;
    expect(v.turn.got).toEqual([id('Owl'), id('Bat'), id('Camel')]);
    expect(v.turn.passed).toEqual([id('Tiger'), id('Duck')]);
  });
});

describe('Version 1.1 items 4, 5: running out, and a hidden word', () => {
  // A small H7 list: six Animals words and six Food words, so Mix of all is the twelve.
  const SMALL: WaiWord[] = [
    ...WORDS.filter((w) => w.pack === 'Animals').slice(0, 6), ...WORDS.filter((w) => w.pack === 'Food' && !w.nonveg).slice(0, 6),
  ];

  wit('Animals runs out mid-turn: Mix of all minus shown and minus Animals, shuffled with `:1:mix`, is appended without stopping the turn', () => {
    const n = new Night({ seed: 'run-out', testWords: SMALL }).start(['Riya', 'Arjun'], { pack: 'Animals' });
    const shown: string[] = [];
    for (let i = 0; i < 6; i++) shown.push(i % 2 ? n.pass() : n.got());
    const fb = fallbackWords(SMALL, 'run-out', 1, 'Animals', false, shown);
    expect(fb.length).toBe(6);
    expect(n.queue.slice(0, fb.length)).toEqual(fb);
    expect(n.view.step).toBe('turn');
    expect(n.got()).toBe(fb[0]); // the turn goes on with the Mix word
  });

  wit('the pack already used up at start: the fallback is the unshown part from the first word (gameIndex 2)', () => {
    const n = new Night({ seed: 'used-up', testWords: SMALL }).start(['Riya', 'Arjun'], { pack: 'Animals' });
    const shown = n.turn('GGGGGG').shown; n.save();
    n.endGame();
    n.start(['Riya', 'Arjun'], { pack: 'Animals' });
    const want = startQueue(SMALL, 'used-up', 2, 'Animals', false, shown);
    expect(want.fallback).toBe(true);
    expect(n.queue.slice(0, want.unshown.length)).toEqual(want.unshown);
  });

  wit('the whole real Animals pack runs out: the fallback comes from the full Mix of all (92 words shown first)', () => {
    const n = new Night({ seed: 'animals-out' }).start(NAMES2, { pack: 'Animals' });
    const shown: string[] = [];
    while (shown.length < 92) {
      for (let i = 0; i < 10 && shown.length < 92; i++) shown.push(n.got());
      n.timeUp(false); n.save();
    }
    const fb = fallbackWords(WORDS, 'animals-out', 1, 'Animals', false, shown);
    expect(fb.length).toBe(714 - 92);
    expect(n.queue.slice(0, fb.length)).toEqual(fb);
  });

  wit('a hidden word goes to the end of the unshown part, before the shown part, and is not shown (R2)', () => {
    const n = new Night({ seed: 'hide' }).start();
    const first = n.turn('GP').shown; n.save();
    n.endGame(); n.start();
    const before = n.queue;
    const unshownLen = before.length - first.length;
    const hidden = n.pauseHiding();
    expect(hidden).toBe(before[0]);
    const after = n.queue;
    expect(after.slice(0, unshownLen - 1)).toEqual(before.slice(1, unshownLen));
    expect(after[unshownLen - 1]).toBe(hidden);
    expect(after.slice(unshownLen)).toEqual(first);
  });

  wit('WAI-043: a skipped turn\'s hidden word goes back unshown and is not in the turn\'s lists', () => {
    const n = new Night({ seed: 'skip-hide' }).start(undefined, { pack: 'Food' });
    const got = n.got();
    const before = n.queue; // Food's 88 words minus the one shown: 87 unshown
    const hidden = n.pauseHiding();
    n.skip();
    expect(n.view.turn.got).toEqual([got]);
    expect(n.view.turn.passed).toEqual([]);
    expect(n.view.turn.endedEarly).toBe(true);
    expect(n.queue.slice(0, 87)).toEqual([...before.slice(1, 87), hidden]);
  });
});

describe('WAI-010: a word in two packs is one word (R3; product owner, 25 October, item 7)', () => {
  wit('Bat shown from Animals (WAIW-040) in game 1 is in the shown part of a Sports and cricket game 2 (as WAIW-191), not unshown', () => {
    const list: WaiWord[] = [
      ...['Bat', 'Tiger', 'Owl'].map((t) => WORDS.find((w) => w.word === t && w.pack === 'Animals')!),
      ...WORDS.filter((w) => w.pack === 'Sports and cricket').slice(0, 4), WORDS.find((w) => w.id === 'WAIW-191')!,
    ];
    const n = new Night({ seed: 'bat', testWords: list }).start(['Riya', 'Arjun'], { pack: 'Animals' });
    const shown = n.turn('GGG').shown; n.save();
    expect(shown).toContain('WAIW-040');
    n.endGame();
    n.start(['Riya', 'Arjun'], { pack: 'Sports and cricket' });
    const want = startQueue(list, 'bat', 2, 'Sports and cricket', false, shown);
    expect(want.shown).toEqual(['WAIW-191']);
    expect(n.queue.slice(0, want.unshown.length)).toEqual(want.unshown);
    expect(n.queue.slice(0, want.unshown.length)).not.toContain('WAIW-191');
  });
});

describe('WAI-010 properties', () => {
  const list20 = WORDS.filter((w) => w.pack === 'Jobs').slice(0, 20);

  wit('within one game no word is shown twice while unshown eligible words remain (random turns, pauses, packs)', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 8 }), fc.constantFrom<PackChoice>('mix', 'Animals', 'Food', 'Jobs'),
      fc.array(fc.constantFrom('G', 'P', 'H', 'T'), { minLength: 1, maxLength: 120 }),
      (seed, pack, steps) => {
        const n = new Night({ seed }).start(['Riya', 'Arjun', 'Meena'], { pack });
        const elig = eligible(WORDS, pack, false).length;
        const shown: string[] = [];
        for (const s of steps) {
          if (s === 'G') shown.push(n.got());
          else if (s === 'P') shown.push(n.pass());
          else if (s === 'H') { n.pauseHiding(); n.resume(); }
          else { const t = n.timeUp(true); if (t) shown.push(t); n.save(); }
        }
        const firstLap = shown.slice(0, elig);
        expect(new Set(firstLap).size).toBe(firstLap.length);
      },
    ), { numRuns: 60 });
  });

  wit('across games, no word is shown twice tonight until every eligible word has been shown (20-word list, five games)', () => {
    fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 8 }), fc.array(fc.integer({ min: 1, max: 9 }), { minLength: 5, maxLength: 5 }), (seed, perGame) => {
      const n = new Night({ seed, testWords: list20 }).start(['Riya', 'Arjun'], { pack: 'mix' });
      const shown: string[] = [];
      perGame.forEach((k, g) => {
        if (g > 0) { n.endGame(); n.start(['Riya', 'Arjun'], { pack: 'mix' }); }
        for (let i = 0; i < k; i++) shown.push(n.got());
        n.timeUp(false); n.save();
      });
      const firstLap = shown.slice(0, 20);
      expect(new Set(firstLap).size).toBe(firstLap.length);
    }), { numRuns: 60 });
  });
});

describe('WAI-044: a changed pack builds a new queue with the same gameIndex', () => {
  wit('setChoices to Food between turns: the queue is Food\'s by WAI-010 with gameIndex 1, words shown tonight last', () => {
    const n = new Night({ seed: 'change-pack' }).start(undefined, { pack: 'mix' });
    const shown = n.turn('GGP').shown; n.save();
    n.play({ type: 'setChoices', choices: { pack: 'Food', time: 60, hold: 'hand', nonveg: false, sounds: true } });
    const want = startQueue(WORDS, 'change-pack', 1, 'Food', false, shown);
    expect(n.queue).toEqual([...want.unshown, ...want.shown]);
  });

  wit('a changed time alone keeps the queue as it was', () => {
    const n = new Night({ seed: 'change-time' }).start();
    n.turn('GP'); n.save();
    const q = n.queue;
    n.play({ type: 'setChoices', choices: { pack: 'mix', time: 90, hold: 'hand', nonveg: false, sounds: true } });
    expect(n.queue).toEqual(q);
  });
});

const NAMES2 = ['Riya', 'Arjun'];
