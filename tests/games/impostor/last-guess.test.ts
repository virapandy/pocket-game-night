// The last-chance guess as a setting, off by default (scenarios v3.5, 4 October 2026; the rules side of Impostor
// round 4, item 1): IMP-033, IMP-035, IMP-037, IMP-041, IMP-071, IMP-076, and IMP-096's "a saved evening whose choices
// has no lastGuess reads as lastGuess: true". Test hooks item 1: "showWord and verdict are legal only in a round where
// the impostor was revealed and lastGuess is true; with lastGuess false the reveal of the impostor completes the round."
// Expected to fail (not built yet): tests marked `it.fails` need the setting (Impostor round 4). A marked test that
// starts passing turns red: then remove its `.fails` mark.
import { describe, expect, it } from 'vitest';
import { createRng, HOST, replay } from '../../../src/engine';
import { DEFAULT_CHOICES, Evening, NAMES, P4, changedChoices, randomOutcome, scoreRound, seedList, type Outcome } from './helpers';

const OFF = { lastGuess: false };
const atVote = (seed: string, choices: Record<string, unknown> = OFF, practice = false) => {
  const e = new Evening({ seed, choices });
  e.startDeal(practice).dealAll().toVote();
  return e;
};
const canUndoAny = (e: Evening) => e.match.records.some((record) => e.rules.canUndo(e.state, { record, by: HOST, now: e.at + 1 }));

describe('IMP-033 and IMP-076: with the last-chance guess off, revealing the impostor completes the round', () => {
  it.fails('no "Show the word" and no verdict after the impostor is revealed', () => {
    for (const s of seedList(20, 'off-refuse')) {
      const e = atVote(s);
      e.must({ type: 'reveal', player: e.impostor() });
      expect(e.refuses({ type: 'showWord' }), `${s}: showWord`).toBe(true);
      expect(e.refuses({ type: 'verdict', right: true }), `${s}: verdict right`).toBe(true);
      expect(e.refuses({ type: 'verdict', right: false }), `${s}: verdict wrong`).toBe(true);
    }
  });

  it.fails('"Next round" follows the reveal at once; the views name the impostor and the word; nothing can be undone', () => {
    for (const s of seedList(20, 'off-next')) {
      const e = atVote(s);
      const imp = e.impostor();
      const word = e.wordId();
      e.must({ type: 'reveal', player: imp });
      expect(e.host()).toMatchObject({ impostor: imp, wordId: word });
      expect(e.room()).toMatchObject({ impostor: imp, wordId: word });
      expect(canUndoAny(e), `${s}: a reveal is never undone (IMP-037)`).toBe(false);
      e.must({ type: 'nextRound' });
      expect(canUndoAny(e)).toBe(false);
    }
  });

  it.fails('"This word didn\'t work" is legal on that result, and its undo too (IMP-107)', () => {
    const e = atVote('off-wdw');
    e.must({ type: 'reveal', player: e.impostor() });
    e.must({ type: 'wordDidntWork', blocked: true }).must({ type: 'wordDidntWork', blocked: false }).must({ type: 'nextRound' });
  });

  it.fails('the practice round with the guess off: a caught impostor completes it the same way (IMP-071)', () => {
    const e = atVote('off-practice', OFF, true);
    expect(e.host()).toMatchObject({ round: null, practice: true });
    e.must({ type: 'reveal', player: e.impostor() });
    expect(e.refuses({ type: 'showWord' })).toBe(true);
    e.must({ type: 'nextRound' });
    expect(e.host()).toMatchObject({ round: 1, practice: false });
  });

  it('a crew member revealed, or "Still a tie": no guess step, whatever the setting (IMP-034, IMP-038)', () => {
    for (const lastGuess of [false, true]) {
      const e = atVote(`crew-${lastGuess}`, { lastGuess });
      e.must({ type: 'reveal', player: e.crew()[0]! });
      expect(e.refuses({ type: 'showWord' })).toBe(true);
      e.must({ type: 'nextRound' });
    }
  });
});

describe('IMP-039: with the last-chance guess on, the caught round waits for "Show the word" and a verdict', () => {
  it('a reveal of the impostor does not complete the round; "Show the word", then one verdict, then "Next round"', () => {
    const e = atVote('on-flow', { lastGuess: true });
    e.must({ type: 'reveal', player: e.impostor() });
    expect(e.refuses({ type: 'nextRound' })).toBe(true);
    e.must({ type: 'showWord' }).must({ type: 'verdict', right: true }).must({ type: 'nextRound' });
  });
});

describe('IMP-076 and IMP-006: the setting changes between rounds with "Change how we play"', () => {
  it.fails('switched on after a round: the next caught round has the guess; switched off again: the one after has none', () => {
    const e = new Evening({ seed: 'switch', choices: OFF });
    e.startDeal().dealAll().toVote();
    e.must({ type: 'reveal', player: e.impostor() });
    e.must({ type: 'setChoices', choices: changedChoices({ lastGuess: true }) }).nextRound();
    e.dealAll().toVote();
    e.must({ type: 'reveal', player: e.impostor() });
    expect(e.refuses({ type: 'nextRound' }), 'guess on: waiting for "Show the word"').toBe(true);
    e.must({ type: 'showWord' }).must({ type: 'verdict', right: false });
    e.must({ type: 'setChoices', choices: changedChoices({ lastGuess: false }) }).nextRound();
    e.dealAll().toVote();
    e.must({ type: 'reveal', player: e.impostor() });
    expect(e.refuses({ type: 'showWord' }), 'guess off again').toBe(true);
    e.must({ type: 'nextRound' });
  });
});

describe('IMP-041: points with the guess off', () => {
  it('scoreRound: caught with the guess off (guessedRight null) gives every crew member +1, the impostor 0', () => {
    expect(scoreRound({ impostor: 'Arjun', caught: true, guessedRight: null }, P4)).toEqual({ Riya: 1, Arjun: 0, Meena: 1, Kabir: 1 });
  });

  it.fails('property (300 seeded evenings, guess off, Score Yes, 3 to 12 players): every round completes without a verdict and scores by scoreRound', () => {
    for (let i = 0; i < 300; i++) {
      const rng = createRng(`off-score-${i}`);
      const players = NAMES.slice(0, 3 + rng.int(10));
      const e = new Evening({ seed: `off-score-seed-${i}`, players, choices: { ...OFF, score: true } });
      e.startDeal();
      for (let r = 0; r < 1 + rng.int(6); r++) {
        const o = randomOutcome(rng);
        const outcome: Outcome = o.kind === 'caught' ? { kind: 'caught', right: null } : o;
        const f = e.playRound(outcome);
        const pts = scoreRound({ impostor: f.impostor, caught: outcome.kind === 'caught', guessedRight: null }, players);
        if (outcome.kind === 'caught') for (const p of players) expect(pts[p], `evening ${i}: ${p}`).toBe(p === f.impostor ? 0 : 1);
        else expect(pts[f.impostor]).toBe(2);
        e.nextRound();
      }
    }
  });
});

describe('IMP-096: an evening saved without lastGuess reads as the guess on', () => {
  const withoutLastGuess = () => {
    const { lastGuess: _drop, ...choices } = DEFAULT_CHOICES;
    return choices;
  };

  it('live and in replay: a caught round with no lastGuess in the choices has "Show the word" and a verdict', () => {
    const e = new Evening({ seed: 'old-choices' });
    // Start from a setup whose choices have no lastGuess at all, as every evening before version 3.
    e.match = { ...e.match, setup: { ...e.match.setup, config: { ...e.match.setup.config, choices: withoutLastGuess() } } };
    const fresh = replay(e.rules, e.match.setup, []);
    expect(fresh.ok).toBe(true);
    if (!fresh.ok) return;
    const live = Evening.from(fresh.value);
    live.startDeal().dealAll().toVote();
    live.must({ type: 'reveal', player: live.impostor() });
    expect(live.refuses({ type: 'nextRound' }), 'the round waits for the guess').toBe(true);
    live.must({ type: 'showWord' }).must({ type: 'verdict', right: true }).must({ type: 'nextRound' });
    const again = replay(live.rules, live.match.setup, live.match.records);
    expect(again.ok, !again.ok ? again.reason : '').toBe(true);
    if (again.ok) expect(again.value.state).toEqual(live.state);
  });
});
