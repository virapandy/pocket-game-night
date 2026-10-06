// Word ids and per-deal seeds (scenarios v3.5, 4 October 2026; Impostor round 4, item 5, C3): Test hooks item 1,
// IMP-060, IMP-061, IMP-021, IMP-052, IMP-054, IMP-096. "Every move that deals a word carries the dealt word's id as
// wordId"; "the n-th deal of the evening picks its word with createRng(`${seeds.word}:word:${n}`), its impostor with
// createRng(`${seeds.word}:impostor:${n}`) and its starter with createRng(`${seeds.starter}:${n}`), so a recorded word id
// never shifts the impostor or starter draws"; "replay accepts any recorded id that exists in the shipped list (retired
// words included), so later edits to words.csv never change a past evening"; "a word-dealing move without wordId makes
// the evening unreplayable".
// Expected to fail (not built yet): tests marked `it.fails` need word ids in the moves and the per-deal seeds. A marked
// test that starts passing turns red: then remove its `.fails` mark.
import { describe, expect, it } from 'vitest';
import { createRng, replay, type MoveRecord } from '../../../src/engine';
import {
  ACTIVE, CATEGORIES, DEALING, Evening, NAMES, P4, RETIRED_IDS, changedChoices, pickImpostor, pickStarter, pickWord,
  randomOutcome, seedList,
} from './helpers';

const none = new Set<string>();
const FIRST_FILTER = { words: 'family' as const, categories: [...CATEGORIES], nonveg: false, usedTonight: none, recent: none, blocked: none, allowRepeats: false };
const isDealing = (m: { type: string; wordId?: unknown }) => (DEALING as readonly string[]).includes(m.type) && (m.type !== 'setChoices' || 'wordId' in m);

/** The word-dealing records of an evening, in order. */
const dealRecords = (e: Evening) => e.match.records.filter((r) => isDealing(r.move as any));

describe('Test hooks item 1 and IMP-096: every word-dealing move records the dealt word id', () => {
  it('startDeal, "New word" (dontKnow), dealAgain and nextRound each record the word the crew then sees', () => {
    for (const s of seedList(20, 'ids')) {
      const e = new Evening({ seed: s });
      const check = (type: string) => {
        const last = e.match.records.at(-1)!.move as any;
        expect(last.type).toBe(type);
        expect(last.wordId, `${s}: ${type} records the dealt word`).toBe(e.wordId());
      };
      e.startDeal(); check('startDeal');
      e.must({ type: 'seen' }).must({ type: 'dontKnow' }); check('dontKnow');
      e.dealAll().must({ type: 'dealAgain' }); check('dealAgain');
      e.playRound({ kind: 'escaped' }); e.nextRound(); check('nextRound');
    }
  });

  it('no word left: nextRound records wordId null; "Allow repeats" and "Change categories" (setChoices) record the word they deal', () => {
    // Every Food word but two blocked: two rounds use them up, the third finds none (IMP-052). Other categories stay
    // open, so "Change categories" to Food + Festivals can deal again.
    const allowed = ACTIVE.filter((w) => w.audience === 'family' && !w.nonveg && w.category === 'Food').map((w) => w.id);
    const blocked = ACTIVE.filter((w) => w.category === 'Food').map((w) => w.id).filter((id) => !allowed.slice(0, 2).includes(id));
    const e = new Evening({ seed: 'no-words', choices: { categories: ['Food'] }, excludedWords: { blocked } });
    e.startDeal(); e.playRound({ kind: 'escaped' }); e.nextRound(); e.playRound({ kind: 'escaped' });
    e.must({ type: 'nextRound' });
    expect((e.match.records.at(-1)!.move as any).wordId, 'the no-words screen: wordId null').toBeNull();
    e.must({ type: 'allowRepeats' });
    expect((e.match.records.at(-1)!.move as any).wordId).toBe(e.wordId());
    expect(allowed.slice(0, 2)).toContain(e.wordId());

    const f = new Evening({ seed: 'no-words-2', choices: { categories: ['Food'] }, excludedWords: { blocked } });
    f.startDeal(); f.playRound({ kind: 'escaped' }); f.nextRound(); f.playRound({ kind: 'escaped' });
    const dealt = new Set(dealRecords(f).map((r) => (r.move as any).wordId as string));
    f.must({ type: 'nextRound' });
    // setChoices is not a listed legal move (its choices come from the screen), so the test writes the expected id:
    // the 3rd deal (the no-words nextRound does not count) under the new choices (Test hooks item 1).
    const choices = changedChoices({ categories: ['Food', 'Festivals and occasions'] });
    const expected = pickWord(ACTIVE, {
      words: 'family', categories: choices.categories, nonveg: false, usedTonight: dealt, recent: none, blocked: new Set(blocked), allowRepeats: false,
    }, createRng('no-words-2:word:3'))!.id;
    f.must({ type: 'setChoices', choices, wordId: expected });
    const last = f.match.records.at(-1)!.move as any;
    expect(last.type).toBe('setChoices');
    expect(last.wordId).toBe(expected);
    expect(f.wordId()).toBe(expected);
  });
});

describe('Test hooks item 1, IMP-060, IMP-061, IMP-021: each deal draws from its own seeds', () => {
  it('deal 1: the word, the impostor and the starter are the picks of `${word}:word:1`, `${word}:impostor:1` and `${starter}:1`', () => {
    for (const s of seedList(50, 'per-deal')) {
      const e = new Evening({ seed: s, starterSeed: `${s}-st` });
      e.startDeal();
      expect(e.wordId(), `${s}: word`).toBe(pickWord(ACTIVE, FIRST_FILTER, createRng(`${s}:word:1`))!.id);
      expect(e.impostor(), `${s}: impostor`).toBe(pickImpostor(P4, [], createRng(`${s}:impostor:1`)));
      e.dealAll();
      expect(e.host().starter, `${s}: starter`).toBe(pickStarter(P4, [], null, createRng(`${s}-st:1`)).starter);
    }
  });

  it('a redeal is deal 2: "New word" draws from `${word}:word:2` and `${word}:impostor:2`, and the starter from `${starter}:2`', () => {
    for (const s of seedList(30, 'per-deal-2')) {
      const e = new Evening({ seed: s, starterSeed: `${s}-st` });
      e.startDeal();
      const first = e.wordId();
      e.must({ type: 'seen' }).must({ type: 'dontKnow' });
      const used = new Set([first]);
      expect(e.wordId(), `${s}: word`).toBe(pickWord(ACTIVE, { ...FIRST_FILTER, usedTonight: used, blocked: used }, createRng(`${s}:word:2`))!.id);
      expect(e.impostor(), `${s}: impostor`).toBe(pickImpostor(P4, [], createRng(`${s}:impostor:2`)));
      e.dealAll();
      expect(e.host().starter, `${s}: starter`).toBe(pickStarter(P4, [], null, createRng(`${s}-st:2`)).starter);
    }
  });

  it('property (200 seeded evenings): other recorded word ids replay with exactly the same impostors and starters, and the recorded words', () => {
    for (let i = 0; i < 200; i++) {
      const rng = createRng(`swap-${i}`);
      const players = NAMES.slice(0, 3 + rng.int(8));
      const e = new Evening({ seed: `swap-seed-${i}`, players, choices: { mode: rng.int(2) ? 'hard' : 'easy' } });
      e.startDeal(rng.int(4) === 0);
      const live: { impostor: string; starter: string }[] = [];
      for (let r = 0; r < 1 + rng.int(6); r++) {
        if (rng.int(6) === 0) { e.must({ type: 'seen' }); e.must({ type: 'dontKnow' }); }
        const f = e.playRound(randomOutcome(rng));
        live.push({ impostor: f.impostor, starter: f.starter });
        e.nextRound();
      }
      // Give every deal a different word of the list (a retired one sometimes): as if words.csv had changed since.
      const used = new Set(dealRecords(e).map((r) => (r.move as any).wordId));
      const spare = [...RETIRED_IDS, ...ACTIVE.map((w) => w.id)].filter((id) => !used.has(id));
      let k = rng.int(spare.length);
      const swapped: MoveRecord<any>[] = e.match.records.map((r) => isDealing(r.move as any) && (r.move as any).wordId
        ? { ...r, move: { ...r.move, wordId: spare[k++ % spare.length] } } : r);
      // Replay record by record: after each round's last deal, the crew sees the recorded word; the draws are the same.
      const ends = swapped.filter((r) => ['reveal', 'stillTie'].includes((r.move as any).type));
      let round = 0;
      for (const end of ends) {
        const upTo = replay(e.rules, e.match.setup, swapped.filter((x) => x.seq <= end.seq));
        expect(upTo.ok, `evening swap-${i}: ${!upTo.ok ? upTo.reason : ''}`).toBe(true);
        if (!upTo.ok) break;
        const lastDeal = [...swapped].filter((x) => x.seq <= end.seq && isDealing(x.move as any)).at(-1)!;
        const host = e.rules.view(upTo.value.state, { kind: 'host' });
        expect(host.wordId, `evening swap-${i}, round ${round + 1}: the recorded word`).toBe((lastDeal.move as any).wordId);
        expect(host.impostor, `evening swap-${i}, round ${round + 1}: the same impostor`).toBe(live[round]!.impostor);
        expect(host.starter, `evening swap-${i}, round ${round + 1}: the same starter`).toBe(live[round]!.starter);
        round++;
      }
      expect(round).toBe(live.length);
    }
  });
});

describe('IMP-054 and IMP-096: which recorded word ids replay', () => {
  const played = () => {
    const e = new Evening({ seed: 'replay-ids' });
    e.startDeal().playRound({ kind: 'escaped' });
    return e;
  };
  const withFirstDeal = (e: Evening, change: (m: any) => any) =>
    e.match.records.map((r, i) => (i === 0 ? { ...r, move: change(r.move) } : r));

  it('a retired word id replays, and the crew sees that word', () => {
    const e = played();
    const r = replay(e.rules, e.match.setup, withFirstDeal(e, (m) => ({ ...m, wordId: RETIRED_IDS[0] })));
    expect(r.ok, !r.ok ? r.reason : '').toBe(true);
    if (r.ok) expect(e.rules.view(r.value.state, { kind: 'host' }).wordId).toBe(RETIRED_IDS[0]);
  });

  it('a word-dealing move without wordId, or with an id not in the list, does not replay', () => {
    const e = played();
    const { wordId: _w, ...bare } = e.match.records[0]!.move as any;
    expect(replay(e.rules, e.match.setup, withFirstDeal(e, () => bare)).ok, 'no wordId').toBe(false);
    expect(replay(e.rules, e.match.setup, withFirstDeal(e, (m) => ({ ...m, wordId: 'IMPW-999' }))).ok, 'unknown id').toBe(false);
  });
});
