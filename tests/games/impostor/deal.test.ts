// Impostor deal rules (specs/impostor/02-deal.md, 03-clues-and-talk.md IMP-025, 07-secrets-and-seeds.md IMP-063).
// What the screens show is checked in tests/browser/impostor-privacy.spec.ts; here, the moves and views behind them.
import { describe, expect, it } from 'vitest';
import { createRng, HOST } from '../../../src/engine';
import { Evening, FAMILY_VEG, NAMES, P3, P4, P5, WORDS, seedList } from './helpers';

const ids = new Set(WORDS.map((w) => w.id));

describe('IMP-010: each player sees their role privately, in seat order', () => {
  it('a round\'s deal is one "seen" per player in seat order; the starter is picked only after the last one', () => {
    for (const players of [P3, P4, P5]) {
      const e = new Evening({ players, seed: `deal-${players.length}` });
      e.startDeal();
      expect(e.host()).toMatchObject({ round: 1, practice: false, players, starter: null });
      for (let i = 0; i < players.length - 1; i++) {
        e.must({ type: 'seen' });
        expect(e.host().starter, `after ${i + 1} of ${players.length} seen`).toBeNull();
        expect(e.refuses({ type: 'startTalk' }), 'the clues cannot start before everyone has seen').toBe(true);
      }
      e.must({ type: 'seen' });
      expect(players).toContain(e.host().starter);
      expect(e.refuses({ type: 'seen' }), 'nobody is left to see their word').toBe(true);
    }
  });

  it('every move is recorded by the host', () => {
    const e = new Evening();
    e.startDeal();
    e.playRound({ kind: 'caught', right: false });
    expect(e.match.records.every((r) => r.by === HOST)).toBe(true);
    expect(e.match.records.map((r) => r.move.type)).toEqual([
      'startDeal', 'seen', 'seen', 'seen', 'seen', 'startTalk', 'voteNow', 'reveal', 'showWord', 'verdict',
    ]);
  });

  it('"Start the deal" is the first move; nothing else is accepted before it, and it is accepted once', () => {
    const e = new Evening();
    for (const m of [{ type: 'seen' }, { type: 'startTalk' }, { type: 'voteNow' }, { type: 'nextRound' }]) expect(e.refuses(m), m.type).toBe(true);
    e.startDeal();
    expect(e.refuses({ type: 'startDeal', practice: false })).toBe(true);
  });
});

describe('IMP-011: what each role sees (the views behind the private block)', () => {
  it('the impostor\'s view is exactly { role: "impostor" }; a crew member\'s is exactly { role: "crew", wordId } with a word of the list', () => {
    for (const mode of ['easy', 'hard'] as const) {
      for (const s of seedList(30, `views-${mode}`)) {
        const e = new Evening({ seed: s, choices: { mode } });
        e.startDeal();
        const imp = e.impostor();
        expect(e.player(imp)).toEqual({ role: 'impostor' });
        for (const c of e.crew()) {
          const v = e.player(c);
          expect(Object.keys(v).sort()).toEqual(['role', 'wordId']);
          expect(v.role).toBe('crew');
          expect(ids.has(v.wordId), `${v.wordId} is a word of the list`).toBe(true);
        }
      }
    }
  });

  it('the views stay the same through the deal, the clues and the vote of that round', () => {
    const e = new Evening({ seed: 'stable' });
    e.startDeal();
    const before = Object.fromEntries(P4.map((p) => [p, e.player(p)]));
    e.dealAll().toVote();
    for (const p of P4) expect(e.player(p)).toEqual(before[p]);
  });
});

describe('IMP-015: "Don\'t know this word?" redeals without giving anything away', () => {
  it('draws a new word and a new impostor, same players, same round number, and the deal runs again from the first player', () => {
    let sameImpostor = 0, otherImpostor = 0;
    for (const s of seedList(200, 'dontknow')) {
      const e = new Evening({ seed: s });
      e.startDeal();
      e.must({ type: 'seen' }).must({ type: 'seen' }); // Riya and Arjun are done; Meena gives up the word
      const word = e.wordId();
      const imp = e.impostor();
      e.must({ type: 'dontKnow' });
      expect(e.wordId()).not.toBe(word);
      expect(e.host()).toMatchObject({ round: 1, players: P4, starter: null });
      if (e.impostor() === imp) sameImpostor++; else otherImpostor++;
      // From the first player again: four "seen", not two.
      for (let i = 0; i < 3; i++) e.must({ type: 'seen' });
      expect(e.host().starter).toBeNull();
      e.must({ type: 'seen' });
      expect(P4).toContain(e.host().starter);
    }
    expect(sameImpostor, 'the same player may be drawn again').toBeGreaterThan(0);
    expect(otherImpostor).toBeGreaterThan(0);
  });

  it('works the same in a practice round and on the impostor\'s own turn (any player, any moment of the deal)', () => {
    for (let k = 0; k < 4; k++) {
      const e = new Evening({ seed: `turn-${k}` });
      e.startDeal(true);
      for (let i = 0; i < k; i++) e.must({ type: 'seen' });
      e.must({ type: 'dontKnow' });
      expect(e.host()).toMatchObject({ round: null, practice: true });
    }
  });

  it('can be used any number of times in a round', () => {
    const e = new Evening({ seed: 'many' });
    e.startDeal();
    const words = [e.wordId()];
    for (let i = 0; i < 12; i++) { e.must({ type: 'dontKnow' }); words.push(e.wordId()); }
    expect(new Set(words).size).toBe(words.length);
    expect(e.host().round).toBe(1);
  });

  it('the given-up word is not dealt again in the evening, even after "Allow repeats"', () => {
    const [a, b] = FAMILY_VEG;
    const blocked = WORDS.map((w) => w.id).filter((id) => id !== a && id !== b); // only a and b can be dealt
    const e = new Evening({ seed: 'given-up', excludedWords: { blocked }, testDeals: [{ wordId: a! }] });
    e.startDeal();
    expect(e.wordId()).toBe(a);
    e.must({ type: 'dontKnow' });
    expect(e.wordId()).toBe(b);
    e.playRound({ kind: 'escaped' });
    e.must({ type: 'nextRound' }); // nothing is left: the no-words screen (IMP-052)
    e.must({ type: 'allowRepeats' });
    for (let r = 0; r < 5; r++) {
      expect(e.wordId(), 'after "Allow repeats" only b may come back').toBe(b);
      e.playRound({ kind: 'escaped' });
      e.nextRound();
    }
  });
});

describe('IMP-016: after the last player, straight to the clues', () => {
  it('the last "seen" ends the deal: the starter is set and the clues can start', () => {
    const e = new Evening({ seed: 'clues' });
    e.startDeal().dealAll();
    expect(P4).toContain(e.host().starter);
    expect(e.try({ type: 'startTalk' })).toBe(true);
  });

  it('"Another round of clues" is accepted once, only with 3 to 5 players, before the talk', () => {
    for (const players of [P3, P4, P5]) {
      const e = new Evening({ players, seed: `again-${players.length}` });
      e.startDeal().dealAll();
      e.must({ type: 'anotherRoundOfClues' });
      expect(e.refuses({ type: 'anotherRoundOfClues' }), 'only once a round').toBe(true);
      e.must({ type: 'startTalk' });
    }
    for (const n of [6, 12]) {
      const e = new Evening({ players: NAMES.slice(0, n), seed: `again-${n}` });
      e.startDeal().dealAll();
      expect(e.refuses({ type: 'anotherRoundOfClues' }), `${n} players`).toBe(true);
    }
  });
});

describe('IMP-025: deal again with a new word', () => {
  const stages: [string, (e: Evening) => void][] = [
    ['during the deal', (e) => { e.must({ type: 'seen' }); }],
    ['on the clues screen', (e) => { e.dealAll(); }],
    ['during the talk', (e) => { e.dealAll().must({ type: 'startTalk' }); }],
    ['on the picker', (e) => { e.dealAll().toVote(); }],
  ];
  for (const [where, reach] of stages) {
    it(`${where}: a new word and a new impostor, the same players and round number, the deal from the first player`, () => {
      let changedImpostor = 0;
      for (const s of seedList(60, `again-${where}`)) {
        const e = new Evening({ seed: s });
        e.startDeal();
        reach(e);
        const word = e.wordId();
        const imp = e.impostor();
        e.must({ type: 'dealAgain' });
        expect(e.wordId()).not.toBe(word);
        if (e.impostor() !== imp) changedImpostor++;
        expect(e.host()).toMatchObject({ round: 1, players: P4, starter: null });
        e.dealAll();
        expect(P4).toContain(e.host().starter);
      }
      expect(changedImpostor, 'the impostor is drawn again').toBeGreaterThan(0);
    });
  }

  it('the dealt-again word stays used for the rest of the evening', () => {
    for (const s of seedList(30, 'again-used')) {
      const e = new Evening({ seed: s });
      e.startDeal();
      const dropped = e.wordId();
      e.must({ type: 'dealAgain' });
      for (let r = 0; r < 6; r++) {
        expect(e.wordId()).not.toBe(dropped);
        e.playRound({ kind: 'escaped' });
        e.nextRound();
      }
    }
  });

  it('a round dealt again in round 3 keeps the number 3 and the next round is 4', () => {
    const e = new Evening({ seed: 'numbers' });
    e.startDeal();
    e.playRound({ kind: 'escaped' }); e.nextRound();
    e.playRound({ kind: 'stillTie' }); e.nextRound();
    expect(e.host().round).toBe(3);
    e.dealAll().must({ type: 'dealAgain' });
    expect(e.host().round).toBe(3);
    e.playRound({ kind: 'caught', right: true }); e.nextRound();
    expect(e.host().round).toBe(4);
  });
});

describe('IMP-063: every crew member has the same word, every round one impostor', () => {
  it('property (1,000 seeded dealt rounds, 3 to 20 players): exactly one player\'s view says impostor; every other has the same word id; tolerance 0', () => {
    const rng = createRng('imp063');
    for (let i = 0; i < 1000; i++) {
      const n = 3 + rng.int(18);
      const players = NAMES.slice(0, n);
      const e = new Evening({ seed: `imp063-${i}`, players, choices: { mode: rng.int(2) ? 'hard' : 'easy' } });
      e.startDeal(rng.int(5) === 0);
      // Sometimes look at a later deal of the evening: a redeal, or the next round.
      const k = rng.int(3);
      if (k === 1) e.must({ type: 'dontKnow' });
      if (k === 2) { e.playRound({ kind: 'escaped' }); e.nextRound(); }
      const views = players.map((p) => e.player(p));
      const imps = views.filter((v) => v.role === 'impostor');
      expect(imps.length, `deal imp063-${i}`).toBe(1);
      const words = new Set(views.filter((v) => v.role === 'crew').map((v) => v.wordId));
      expect(words.size, `deal imp063-${i}: crew word ids ${[...words]}`).toBe(1);
      expect(views.filter((v) => v.role === 'crew').length).toBe(n - 1);
    }
  });
});
