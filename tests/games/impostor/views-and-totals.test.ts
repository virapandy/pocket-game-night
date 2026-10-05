// What each viewer sees and how totals follow the players (5 October 2026; aimed at mutants that survived the
// mutation run of 4 October, reports/latest.md). From the approved scenarios only:
// - Test hooks item 1 and IMP-062: the host view is exactly { round, practice, players, starter }, plus `impostor` and
//   `wordId` once the vote has revealed someone or the re-vote ended "Still a tie"; a player's view is their own role only,
//   and only while they are in the round being dealt (IMP-079: a joiner has none).
// - IMP-071: the practice round has no round number, scores nothing and is not counted; the round after it is round 1.
// - IMP-040, IMP-041, IMP-043: no points with Score off; IMP-042, IMP-044, IMP-078: a player who leaves keeps their total,
//   a returning name (ignoring case) keeps it under the new spelling, a newcomer starts at 0.
// - IMP-052 and Test hooks item 1: "Change categories" from the no-words screen deals the same round again; a word-dealing
//   move without a word id is refused (any listed id is accepted live, decision I23).
import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/engine';
import { ACTIVE, Evening, P4, P5, changedChoices, need, pickWord, seedList } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
const totals = (e: Evening): Record<string, number> => need<any>('eveningTotals')({ setup: e.match.setup, records: e.match.records });
const TABLE = ['players', 'practice', 'round', 'starter'];
const REVEALED = ['impostor', 'players', 'practice', 'round', 'starter', 'wordId'];
const keys = (v: any) => Object.keys(v ?? {}).sort();

describe('Test hooks item 1, IMP-062: the host view keeps the secrets until the reveal', () => {
  it('before the first deal: round 1, not practice, the players, no starter; no player has a view', () => {
    const e = new Evening({ seed: 'view-0' });
    expect(e.host()).toEqual({ round: 1, practice: false, players: P4, starter: null });
    expect(e.room()).toEqual(e.host());
    for (const p of P4) expect(e.player(p)).toBeNull();
  });

  it('property (100 seeded rounds): at every step before the reveal the host and room views are exactly the table; after a reveal, a still tie or a caught impostor they add the impostor and the word', () => {
    for (const s of seedList(100, 'view-steps')) {
      const n = Number(s.split('-').at(-1));
      const e = new Evening({ players: P5, seed: s, choices: { lastGuess: true } });
      e.startDeal();
      expect(keys(e.host()), `${s}: deal`).toEqual(TABLE);
      expect(e.host().starter, `${s}: no starter while dealing`).toBeNull();
      expect(e.host().round).toBe(1);
      e.dealAll();
      const imp = e.impostor();
      const crew = e.crew();
      const word = e.wordId();
      expect(keys(e.host()), `${s}: clues`).toEqual(TABLE);
      expect(P5).toContain(e.host().starter);
      e.must({ type: 'startTalk' });
      expect(keys(e.host()), `${s}: talk`).toEqual(TABLE);
      e.must({ type: 'voteNow' });
      expect(keys(e.host()), `${s}: picker`).toEqual(TABLE);
      expect(e.room(), `${s}: the room view is the host view`).toEqual(e.host());
      const way = n % 3;
      if (way === 0) {
        e.must({ type: 'tie', players: [imp, crew[0]] });
        expect(keys(e.host()), `${s}: re-vote`).toEqual(TABLE);
        e.must({ type: 'stillTie' });
      } else if (way === 1) {
        e.must({ type: 'reveal', player: crew[n % crew.length]! });
      } else {
        e.must({ type: 'reveal', player: imp });
        expect(keys(e.host()), `${s}: caught (guess step)`).toEqual(REVEALED);
        e.must({ type: 'showWord' }).must({ type: 'verdict', right: false });
      }
      expect(keys(e.host()), `${s}: result`).toEqual(REVEALED);
      expect(e.host().impostor).toBe(imp);
      expect(e.host().wordId).toBe(word);
      expect(e.room()).toEqual(e.host());
      e.nextRound();
      expect(keys(e.host()), `${s}: the next deal`).toEqual(TABLE);
      expect(e.host().round).toBe(2);
    }
  });

  it('a player\'s view is only their own role: the impostor sees no word, the crew see the word id and nothing else', () => {
    const e = new Evening({ players: P5, seed: 'view-roles' });
    e.startDeal();
    const imp = e.impostor();
    for (const p of P5) {
      const v = e.player(p);
      if (p === imp) expect(v).toEqual({ role: 'impostor' });
      else expect(v).toEqual({ role: 'crew', wordId: e.wordId() });
    }
    expect(e.player('Dev'), 'someone not playing has no view').toBeNull();
  });

  it('IMP-079: a joiner added mid-round has no view until the next deal deals them in', () => {
    const e = new Evening({ players: P4, seed: 'view-joiner', choices: { lastGuess: false } });
    e.startDeal().dealAll();
    e.must({ type: 'setPlayers', players: [...P4, 'Zoya'] });
    expect(e.player('Zoya')).toBeNull();
    e.toVote();
    e.must({ type: 'reveal', player: e.impostor() });
    expect(e.player('Zoya')).toBeNull();
    e.nextRound();
    expect(['impostor', 'crew']).toContain(e.player('Zoya')?.role);
  });
});

describe('IMP-071: the practice round', () => {
  it('has no round number, is practice in the view, scores nothing with Score on, and the round after it is round 1', () => {
    const e = new Evening({ seed: 'practice-view', choices: { score: true, lastGuess: false } });
    e.startDeal(true);
    expect(e.host().round).toBeNull();
    expect(e.host().practice).toBe(true);
    e.playRound({ kind: 'escaped' });
    expect(e.host().round, 'the practice result: still no number').toBeNull();
    expect(Object.values(totals(e)).every((v) => v === 0), 'no points from the practice round').toBe(true);
    e.nextRound();
    expect(e.host().round).toBe(1);
    expect(e.host().practice).toBe(false);
    e.playRound({ kind: 'escaped' });
    const t = totals(e);
    expect(t[e.host().impostor], 'round 1 scores: the escaped impostor gets 2').toBe(2);
    e.nextRound();
    expect(e.host().round).toBe(2);
  });
});

describe('IMP-040, IMP-041: Score off scores nothing', () => {
  it('three rounds with Score off: every total stays 0', () => {
    const e = new Evening({ seed: 'score-off', choices: { score: false, lastGuess: true } });
    e.startDeal();
    e.playRound({ kind: 'escaped' }); e.nextRound();
    e.playRound({ kind: 'caught', right: true }); e.nextRound();
    e.playRound({ kind: 'caught', right: false });
    expect(Object.values(totals(e)).every((v) => v === 0)).toBe(true);
  });
});

describe('IMP-042, IMP-044, IMP-078: totals follow the players', () => {
  it('a player who leaves between rounds keeps their total; coming back as "kabir" keeps it under the new spelling; a newcomer has 0', () => {
    const e = new Evening({ seed: 'totals-follow', choices: { score: true, lastGuess: false }, testDeals: [{ impostor: 'Kabir', starter: 'Riya' }] });
    e.startDeal();
    e.playRound({ kind: 'escaped' }); // Kabir escapes: 2 points
    expect(totals(e).Kabir).toBe(2);
    e.must({ type: 'setPlayers', players: ['Riya', 'Arjun', 'Meena'] });
    expect(totals(e).Kabir, 'kept after leaving').toBe(2);
    e.must({ type: 'setPlayers', players: ['Riya', 'Arjun', 'Meena', 'kabir', 'Dev'] });
    const t = totals(e);
    expect(t.kabir, 'kept under the new spelling').toBe(2);
    expect('Kabir' in t, 'no second entry under the old spelling').toBe(false);
    expect(t.Dev, 'a newcomer starts at 0').toBe(0);
  });

  it('IMP-078: "Finish this round first" and "Deal again without" keep the leaver\'s points', () => {
    const e = new Evening({ players: P5, seed: 'totals-leavers', choices: { score: true, lastGuess: false }, testDeals: [{ impostor: 'Kabir', starter: 'Riya' }, { impostor: 'Arjun', starter: 'Meena' }] });
    e.startDeal();
    e.playRound({ kind: 'escaped' });
    e.nextRound();
    e.dealAll();
    e.must({ type: 'dealAgainWithout', player: 'Kabir' });
    expect(totals(e).Kabir).toBe(2);
    e.dealAll();
    e.must({ type: 'leaveAfterRound', player: 'Zoya' });
    e.toVote();
    e.must({ type: 'reveal', player: e.impostor() });
    const t = totals(e);
    expect(t.Kabir).toBe(2);
    expect('Zoya' in t, 'Zoya\'s entry is kept after she leaves').toBe(true);
    for (const p of ['Riya', 'Arjun', 'Meena', 'Zoya'].filter((p) => p !== e.host().impostor)) expect(t[p], `${p}: +1 for the catch`).toBeGreaterThanOrEqual(1);
  });
});

describe('IMP-052, Test hooks item 1: "Change categories" from the no-words screen', () => {
  const allowed = ACTIVE.filter((w) => w.audience === 'family' && !w.nonveg && w.category === 'Food').map((w) => w.id);
  const blocked = ACTIVE.filter((w) => w.category === 'Food').map((w) => w.id).filter((id) => !allowed.slice(0, 2).includes(id));
  const toNoWords = (seed: string) => {
    const e = new Evening({ seed, choices: { categories: ['Food'] }, excludedWords: { blocked } });
    e.startDeal(); e.playRound({ kind: 'escaped' }); e.nextRound(); e.playRound({ kind: 'escaped' });
    e.must({ type: 'nextRound' });
    return e;
  };
  const choices = changedChoices({ categories: ['Food', 'Festivals and occasions'] });

  it('is refused without a word id; with the dealt word\'s id it deals round 3 again, under the new categories', () => {
    const e = toNoWords('no-words-redeal');
    const used = new Set(e.match.records.map((r) => (r.move as any).wordId).filter(Boolean) as string[]);
    const expected = pickWord(ACTIVE, { words: 'family', categories: choices.categories, nonveg: false, usedTonight: used, recent: new Set(), blocked: new Set(blocked), allowRepeats: false }, createRng('no-words-redeal:word:3'))!.id;
    expect(e.host().round).toBe(3);
    expect(e.refuses({ type: 'setChoices', choices }), 'no wordId').toBe(true);
    // Any listed id is accepted live (decision I23); the screens record the pickWord id, checked in word-ids.test.ts.
    e.must({ type: 'setChoices', choices, wordId: expected });
    expect(e.host().round, 'the same round, dealt again').toBe(3);
    expect(e.wordId()).toBe(expected);
    expect(e.match.records.map((r) => r.move.type).slice(-2)).toEqual(['nextRound', 'setChoices']);
  });

  it('between rounds (not the no-words screen) setChoices deals nothing and refuses a word id', () => {
    const e = new Evening({ seed: 'choices-between' });
    e.startDeal(); e.playRound({ kind: 'escaped' });
    expect(e.refuses({ type: 'setChoices', choices, wordId: ACTIVE[0]!.id })).toBe(true);
    e.must({ type: 'setChoices', choices });
    expect(e.player('Riya')?.role, 'still the result: no new deal').toBeDefined();
    expect(e.host().round).toBe(1);
  });
});
