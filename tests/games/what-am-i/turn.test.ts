// What Am I? marking rules in the rules (C3; specs/what-am-i/03-turn.md WAI-021 property and Version 1.1 items 14, 15;
// WAI-023 time up; WAI-014 hold for one player; WAI-015 someone else goes first; WAI-040 pause; WAI-043 skip).
// The motion side of marking (pitch, θ₀, held 150 ms, re-arm, guards, marking areas) is on the screen and is checked
// in tests/browser/what-am-i-marking.spec.ts with the orientation and clock hooks (WAI-H2, H3).
import { describe, expect } from 'vitest';
import fc from 'fast-check';
import { NAMES, Night, wit } from './helpers';

describe('WAI-021 / Version 1.1 item 14: marks and time up', () => {
  wit('each mark records got or pass for the word on screen; T4\'s lists hold them in the order shown', () => {
    const n = new Night({ seed: 'marks' }).start();
    const a = n.got(), b = n.pass(), c = n.got();
    expect(n.view.step).toBe('turn');
    expect(n.view.player).toBe('Riya');
    const t = n.timeUp(true)!;
    const v = n.view;
    expect(v.step).toBe('review');
    expect(v.turn.got).toEqual([a, c]);
    expect(v.turn.passed).toEqual([b, t]); // WAI-023: the time-up word is passed, last
    expect(v.turn.moved).toEqual([]);
    expect(v.turn.endedEarly).toBe(false);
  });

  wit('WAI-023 / Version 1.1 item 15: timeUp with no word (a flash was running) passes nothing', () => {
    const n = new Night({ seed: 'flash' }).start();
    const a = n.got();
    n.timeUp(false);
    expect(n.view.turn.got).toEqual([a]);
    expect(n.view.turn.passed).toEqual([]);
  });

  wit('timeUp in T2 (no mark yet): the turn ends with both lists empty', () => {
    const n = new Night({ seed: 't2' }).start();
    n.timeUp(false);
    expect(n.view.step).toBe('review');
    expect(n.view.turn.got).toEqual([]);
    expect(n.view.turn.passed).toEqual([]);
  });

  wit('property: got + pass + (1 if timeUp carries a word) = words shown in the turn', () => {
    fc.assert(fc.property(fc.string({ maxLength: 6 }), fc.array(fc.constantFrom('G', 'P', 'H'), { maxLength: 40 }), fc.boolean(), (seed, steps, withWord) => {
      const n = new Night({ seed: `p-${seed}` }).start(['Riya', 'Arjun']);
      let shown = 0;
      for (const s of steps) {
        if (s === 'G') { n.got(); shown++; }
        else if (s === 'P') { n.pass(); shown++; }
        else { n.pauseHiding(); n.resume(); } // hidden: not shown (R2)
      }
      if (n.timeUp(withWord)) shown++;
      const v = n.view;
      expect(v.turn.got.length + v.turn.passed.length).toBe(shown);
      const gotMoves = n.records.filter((r) => r.move.type === 'got').length;
      const passMoves = n.records.filter((r) => r.move.type === 'pass').length;
      const t = n.records.find((r) => r.move.type === 'timeUp')!;
      expect(gotMoves + passMoves + (t.move.word ? 1 : 0)).toBe(shown);
    }), { numRuns: 100 });
  });

  wit('no mark is accepted while paused, in T4, or for a word that is not on screen', () => {
    const n = new Night({ seed: 'refuse' }).start();
    n.got();
    n.pauseHiding();
    expect(n.accepts({ type: 'got', word: n.head })).toBe(false);
    expect(n.accepts({ type: 'pass', word: n.head })).toBe(false);
    n.resume();
    expect(n.accepts({ type: 'got', word: 'WAIW-999' })).toBe(false);
    n.timeUp(false);
    expect(n.accepts({ type: 'got', word: n.head })).toBe(false);
    expect(n.accepts({ type: 'timeUp' })).toBe(false);
  });
});

describe('WAI-040: pause and resume', () => {
  wit('a pause on T1 or T4 (turn: false) changes no list and no queue; resume returns', () => {
    const n = new Night({ seed: 'pause-t1' }).start();
    const q = n.queue;
    n.pause(false);
    expect(n.view.paused).toBe(true);
    expect(n.view.step).toBe('pass');
    n.resume();
    expect(n.view.paused).toBe(false);
    expect(n.queue).toEqual(q);
    const a = n.got();
    n.timeUp(false);
    n.pause(false);
    expect(n.view.step).toBe('review');
    expect(n.view.turn.got).toEqual([a]);
    n.resume();
    expect(n.view.paused).toBe(false);
  });

  wit('resume after a pause in T3: the next word is the queue\'s next, the hidden one is not in the lists', () => {
    const n = new Night({ seed: 'pause-t3' }).start();
    const q = n.queue;
    const hidden = n.pauseHiding();
    n.resume();
    expect(n.head).toBe(q[1]);
    n.timeUp(false);
    expect([...n.view.turn.got, ...n.view.turn.passed]).not.toContain(hidden);
  });

  wit('resume is refused when nothing is paused; a second pause is refused while paused', () => {
    const n = new Night({ seed: 'pause-twice' }).start();
    expect(n.accepts({ type: 'resume' })).toBe(false);
    n.pause(true);
    expect(n.accepts({ type: 'pause', turn: true })).toBe(false);
  });
});

describe('WAI-043: End Riya\'s turn now (skip)', () => {
  wit('skip after a pause in a turn opens T4 with the marks so far, ended early (Version 1.2 item 2)', () => {
    const n = new Night({ seed: 'skip' }).start();
    const a = n.got(), b = n.got(), c = n.pass();
    n.pauseHiding();
    n.skip();
    const v = n.view;
    expect(v.step).toBe('review');
    expect(v.paused).toBe(false);
    expect(v.player).toBe('Riya');
    expect(v.turn).toEqual({ got: [a, b], passed: [c], moved: [], endedEarly: true });
  });

  wit('skip from T2 (paused before any word): T4 with empty lists', () => {
    const n = new Night({ seed: 'skip-t2' }).start();
    n.pause(true);
    n.skip();
    expect(n.view.step).toBe('review');
    expect(n.view.turn.got).toEqual([]);
    expect(n.view.turn.endedEarly).toBe(true);
  });

  wit('skip is refused unless the turn is paused', () => {
    const n = new Night({ seed: 'skip-refused' }).start();
    n.got();
    expect(n.accepts({ type: 'skip' })).toBe(false);
  });

  wit('a skipped turn is saved by Save score like any other and counts as a turn played', () => {
    const n = new Night({ seed: 'skip-save' }).start();
    n.got(); n.got();
    n.pause(true);
    n.skip();
    n.save();
    const riya = n.view.scoreboard.find((r: any) => r.player === 'Riya');
    expect(riya).toMatchObject({ score: 2, turns: 1 });
    expect(n.view.player).toBe('Arjun');
  });
});

describe('WAI-014: hands-free for one player', () => {
  wit('setHold free for Riya changes only Riya\'s hold, for the rest of the game; hand gives it back', () => {
    const n = new Night({ seed: 'hold' }).start();
    expect(n.view.holds).toEqual(Object.fromEntries(NAMES.map((p) => [p, 'hand'])));
    n.play({ type: 'setHold', player: 'Riya', hold: 'free' });
    expect(n.view.holds.Riya).toBe('free');
    for (const p of NAMES.slice(1)) expect(n.view.holds[p]).toBe('hand');
    for (const _ of NAMES) n.savedTurn(1);
    expect(n.view.round).toBe(2);
    expect(n.view.holds.Riya).toBe('free');
    n.play({ type: 'setHold', player: 'Riya', hold: 'hand' });
    expect(n.view.holds.Riya).toBe('hand');
  });

  wit('a hands-free game: every player\'s hold is free', () => {
    const n = new Night({ seed: 'free' }).start(undefined, { hold: 'free' });
    expect(Object.values(n.view.holds)).toEqual(NAMES.map(() => 'free'));
  });
});

describe('WAI-015 / Version 1.1 item 28: someone else goes first', () => {
  wit('order R, A, M, K, Z, D on Riya\'s T1, choose Meena: M, R, A, K, Z, D; Meena now, Riya next', () => {
    const n = new Night({ seed: 'first' }).start();
    n.play({ type: 'reorder', order: ['Meena', 'Riya', 'Arjun', 'Kabir', 'Zoya', 'Dev'] });
    expect(n.view.order).toEqual(['Meena', 'Riya', 'Arjun', 'Kabir', 'Zoya', 'Dev']);
    expect(n.view.player).toBe('Meena');
    n.savedTurn(2);
    expect(n.view.player).toBe('Riya');
  });

  wit('later in the round: chosen player moves just before the current one; who has played stays in place', () => {
    const n = new Night({ seed: 'first-later' }).start();
    n.savedTurn(1); // Riya played
    expect(n.view.player).toBe('Arjun');
    n.play({ type: 'reorder', order: ['Riya', 'Zoya', 'Arjun', 'Meena', 'Kabir', 'Dev'] });
    expect(n.view.player).toBe('Zoya');
    expect(n.view.toPlay).toEqual(['Zoya', 'Arjun', 'Meena', 'Kabir', 'Dev']);
  });
});
