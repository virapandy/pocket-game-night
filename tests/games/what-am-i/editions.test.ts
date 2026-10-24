// What Am I? WAI-092: old saved game nights always open, word for word, after the word list changes (C3; specs/what-am-i/
// 10-lifecycle.md WAI-092 with B9; specs/what-am-i/api.md "Word-list editions"; orchestrator's call of 25 October 2026,
// docs/test-questions.md). A game night saves the list's edition in `config.edition` when it starts; replay uses only words
// with edition <= that edition that were not retired by then; a saved night with no edition is edition 1.
//
// The later list is made by replacing content/what-am-i/words.json for a fresh copy of the game module (vi.doMock): the
// shipped edition-1 list plus five edition-2 Animals words, with one edition-1 word that the saved night showed retired in
// edition 2.
import { describe, expect, vi } from 'vitest';
import { HOST, play, replay, startMatch } from '../../../src/engine';
import { WORDS, choices, eligible, need, rules as shippedRules, startQueue, wit, type WaiWord } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */

const NEW_WORDS: WaiWord[] = ['Platypus', 'Narwhal', 'Axolotl', 'Pangolin', 'Okapi'].map((word, i) => ({
  id: `WAIW-9${String(i + 1).padStart(2, '0')}`, word, pack: 'Animals', audience: 'family', nonveg: false, edition: 2, retired_in: null,
}));

/** The game module loaded afresh with `list` as content/what-am-i/words.json. */
async function moduleWith(list: WaiWord[]): Promise<any> {
  vi.resetModules();
  vi.doMock('../../../content/what-am-i/words.json', () => ({ default: list }));
  try {
    return await import('../../../src/games/what-am-i');
  } finally {
    vi.doUnmock('../../../content/what-am-i/words.json');
    vi.resetModules();
  }
}

/** Plays a two-game night through the engine with these rules, the host's taps driven by the queue. */
function playNight(rules: any, queueFor: (s: any) => string[], setup: any) {
  let m: any = startMatch(rules, setup, 1_000_000);
  let at = 1_000_000;
  const go = (move: any) => {
    const r = play(rules, m, move, { by: HOST, at: (at += 1000) });
    if (!r.ok) throw new Error(`refused ${JSON.stringify(move)}: ${r.reason}`);
    m = r.value;
  };
  const shown: string[] = [];
  const mark = (type: 'got' | 'pass') => { const w = queueFor(m.state)[0]!; shown.push(w); go({ type, word: w }); };
  const turn = (marks: string) => {
    for (const c of marks) mark(c === 'G' ? 'got' : 'pass');
    const w = queueFor(m.state)[0]!; shown.push(w); go({ type: 'timeUp', word: w });
    go({ type: 'scoreTurn' });
  };
  go({ type: 'start', players: ['Riya', 'Arjun', 'Meena'], choices: choices({ pack: 'Animals' }) });
  turn('GGPG'); turn('GPGGG'); turn('PGG');
  turn('GGG'); turn('GPG');
  go({ type: 'endGame' });
  go({ type: 'start', players: ['Riya', 'Arjun', 'Meena'], choices: choices({ pack: 'Animals' }) });
  turn('GGGG'); turn('GP');
  return { match: m, shown };
}

describe('WAI-092: a saved game night replays word for word after the list gains edition-2 words and retires one', () => {
  wit('the shipped list is edition 1 (`whatAmIEdition`)', () => {
    expect(need<number>('whatAmIEdition')).toBe(1);
  });

  wit('a night saved under edition 1 replays identically under the edition-2 list; with no edition saved too (edition 1)', async () => {
    const saved = playNight(shippedRules(), need('queueFor'), {
      gameId: 'what-am-i', seeds: { words: 'edition-night' }, config: { edition: 1 },
    });
    const retired = saved.shown[0]!; // the night's first word, retired in edition 2
    const later: WaiWord[] = [...WORDS.map((w) => (w.id === retired ? { ...w, retired_in: 2 } : w)), ...NEW_WORDS];
    const mod = await moduleWith(later);
    expect.soft(mod.whatAmIEdition, 'the edition-2 list').toBe(2);

    const json = JSON.parse(JSON.stringify({ setup: saved.match.setup, records: saved.match.records }));
    const noEdition = { ...json.setup, config: {} };
    for (const [label, setup] of [['config.edition 1', json.setup], ['no edition saved', noEdition]] as const) {
      const again = replay(mod.whatAmIRules, setup, json.records);
      expect(again.ok, `${label}: ${again.ok ? '' : again.reason}`).toBe(true);
      if (!again.ok) continue;
      for (const viewer of [{ kind: 'host' }, { kind: 'room' }]) {
        expect(mod.whatAmIRules.view(again.value.state, viewer), label).toEqual(shippedRules().view(saved.match.state, viewer));
      }
      expect(mod.queueFor(again.value.state), label).toEqual(need<any>('queueFor')(saved.match.state));
    }
  });

  wit('a new night under edition 1 on the edition-2 list deals exactly the edition-1 queue: no new word, the retired word still in', async () => {
    const retired = eligible(WORDS, 'Animals', false)[0]!.id;
    const later: WaiWord[] = [...WORDS.map((w) => (w.id === retired ? { ...w, retired_in: 2 } : w)), ...NEW_WORDS];
    const mod = await moduleWith(later);
    const m = startMatch(mod.whatAmIRules, { gameId: 'what-am-i', seeds: { words: 'ed-1' }, config: { edition: 1 } }, 1);
    const r = play(mod.whatAmIRules, m, { type: 'start', players: ['Riya', 'Arjun'], choices: choices({ pack: 'Animals' }) }, { by: HOST, at: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const want = startQueue(WORDS, 'ed-1', 1, 'Animals', false);
    expect(mod.queueFor(r.value.state)).toEqual([...want.unshown, ...want.shown]);
    expect(mod.queueFor(r.value.state)).toContain(retired);
  });

  wit('a night started under edition 2 uses the new words and leaves the retired one out', async () => {
    const retired = eligible(WORDS, 'Animals', false)[0]!.id;
    const later: WaiWord[] = [...WORDS.map((w) => (w.id === retired ? { ...w, retired_in: 2 } : w)), ...NEW_WORDS];
    const mod = await moduleWith(later);
    const m = startMatch(mod.whatAmIRules, { gameId: 'what-am-i', seeds: { words: 'ed-2' }, config: { edition: 2 } }, 1);
    const r = play(mod.whatAmIRules, m, { type: 'start', players: ['Riya', 'Arjun'], choices: choices({ pack: 'Animals' }) }, { by: HOST, at: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const q: string[] = mod.queueFor(r.value.state);
    expect(q).not.toContain(retired);
    for (const w of NEW_WORDS) expect(q).toContain(w.id);
    expect(q).toHaveLength(eligible(WORDS, 'Animals', false).length - 1 + NEW_WORDS.length);
  });
});
