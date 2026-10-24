// What Am I? end of a turn and scores (C3; specs/what-am-i/04-scores.md WAI-030 to WAI-033 with Version 1.1 items 26,
// 30 to 33, 38; and the rule parts of WAI-041 and WAI-042, people mid-game, which change the scoreboard).
import { describe, expect } from 'vitest';
import { K2_GOT, K2_PASSED, NAMES, Night, boardRows, playK2, wit } from './helpers';

describe('WAI-030: fixing a word on T4', () => {
  wit('a tap moves the word to the other list\'s end with ↺; moving it back removes the ↺; the count follows', () => {
    const n = new Night({ seed: 'fix' }).start();
    const a = n.got(), b = n.got(), c = n.pass();
    n.timeUp(false);
    n.fix(a);
    let t = n.view.turn;
    expect(t.got).toEqual([b]);
    expect(t.passed).toEqual([c, a]);
    expect(t.moved).toEqual([a]);
    n.fix(c);
    t = n.view.turn;
    expect(t.got).toEqual([b, c]);
    expect(t.passed).toEqual([a]);
    expect(new Set(t.moved)).toEqual(new Set([a, c]));
    n.fix(a);
    t = n.view.turn;
    expect(t.got).toEqual([b, c, a]);
    expect(t.passed).toEqual([]);
    expect(t.moved).toEqual([c]);
  });

  wit('Version 1.1 item 46: each tap is one fix (no guard on word chips); a fix outside T4 or of another word is refused', () => {
    const n = new Night({ seed: 'fix-refused' }).start();
    const a = n.got();
    expect(n.accepts({ type: 'fix', word: a })).toBe(false); // still in the turn
    n.timeUp(false);
    expect(n.accepts({ type: 'fix', word: n.head })).toBe(false); // not in this turn's lists
    n.fix(a); n.fix(a); n.fix(a);
    expect(n.records.filter((r) => r.move.type === 'fix')).toHaveLength(3);
    expect(n.view.turn.passed).toEqual([a]);
  });
});

describe('WAI-031: Save score, and Undo', () => {
  wit('Save score adds the Got it count (after fixes) and one turn; the next player\'s T1 opens', () => {
    const n = new Night({ seed: 'save' }).start();
    const a = n.got(); n.got(); n.got(); n.pass();
    n.timeUp(true);
    n.fix(a);
    n.save();
    const v = n.view;
    expect(v.step).toBe('pass');
    expect(v.player).toBe('Arjun');
    expect(v.turn).toBeNull();
    expect(v.scoreboard.find((r: any) => r.player === 'Riya')).toEqual({ player: 'Riya', score: 2, turns: 1, left: false });
  });

  wit('undoScore takes the points and the turn back and reopens T4 exactly as before (lists and ↺ kept)', () => {
    const n = new Night({ seed: 'undo' }).start();
    const a = n.got(); n.got(); n.pass();
    n.timeUp(true);
    n.fix(a);
    const before = n.view.turn;
    n.save();
    n.undoScore();
    const v = n.view;
    expect(v.step).toBe('review');
    expect(v.player).toBe('Riya');
    expect(v.turn).toEqual(before);
    expect(v.scoreboard.find((r: any) => r.player === 'Riya')).toMatchObject({ score: 0, turns: 0 });
  });

  wit('Version 1.1 item 26: Undo still works after a pause and resume (the toast is only hidden by the cover)', () => {
    const n = new Night({ seed: 'undo-pause' }).start();
    n.got(); n.timeUp(false); n.save();
    n.pause(false); n.resume();
    expect(n.accepts({ type: 'undoScore' })).toBe(true);
  });

  wit('Version 1.1 item 26: the turn is locked once the next turn has a move, or after any other recorded move', () => {
    const n = new Night({ seed: 'locked' }).start();
    n.got(); n.timeUp(false); n.save();
    n.got(); // Arjun's turn has started
    expect(n.accepts({ type: 'undoScore' })).toBe(false);
    const m = new Night({ seed: 'locked-2' }).start();
    m.got(); m.timeUp(false); m.save();
    m.play({ type: 'setHold', player: 'Arjun', hold: 'free' });
    expect(m.accepts({ type: 'undoScore' })).toBe(false);
    const k = new Night({ seed: 'locked-3' }).start();
    k.got(); k.timeUp(false); k.save(); k.undoScore();
    expect(k.accepts({ type: 'undoScore' })).toBe(false); // nothing saved to take back
  });

  wit('Version 1.1 item 26: Undo from R1 (after the round\'s last save) returns to that T4', () => {
    const n = new Night({ seed: 'undo-r1' }).start(['Riya', 'Arjun']);
    n.savedTurn(1);
    n.savedTurn(3);
    expect(n.view.round).toBe(2);
    n.undoScore();
    expect(n.view.step).toBe('review');
    expect(n.view.player).toBe('Arjun');
    expect(n.view.round).toBe(1);
  });

  wit('Save score is refused outside T4', () => {
    const n = new Night({ seed: 'save-refused' }).start();
    expect(n.accepts({ type: 'scoreTurn' })).toBe(false);
    n.got();
    expect(n.accepts({ type: 'scoreTurn' })).toBe(false);
  });
});

describe('WAI-032 / Version 1.1 item 38: scoreboards (example K2)', () => {
  wit('after round 1: Arjun 7, Dev 6, Riya 5, Meena 5, Zoya 4, Kabir 3 (ties in turn order); after round 2: Arjun 14, Meena 13, Dev 11, Riya 9, Kabir 7, Zoya 7', () => {
    const n = new Night({ seed: 'k2' }).start();
    for (let p = 0; p < 6; p++) n.savedTurn(K2_GOT[0]![p]!, K2_PASSED[0]![p]!);
    expect(boardRows(n.view)).toEqual([
      'Arjun 7 (1 turn)', 'Dev 6 (1 turn)', 'Riya 5 (1 turn)', 'Meena 5 (1 turn)', 'Zoya 4 (1 turn)', 'Kabir 3 (1 turn)',
    ]);
    for (let p = 0; p < 6; p++) n.savedTurn(K2_GOT[1]![p]!, K2_PASSED[1]![p]!);
    expect(boardRows(n.view)).toEqual([
      'Arjun 14 (2 turns)', 'Meena 13 (2 turns)', 'Dev 11 (2 turns)', 'Riya 9 (2 turns)', 'Kabir 7 (2 turns)', 'Zoya 7 (2 turns)',
    ]);
  });

  wit('Version 1.1 item 30: players who left are listed last, "(left)", in the order they left, with their points', () => {
    const n = new Night({ seed: 'left' }).start();
    n.savedTurn(3); n.savedTurn(1); n.savedTurn(5);
    n.play({ type: 'leave', player: 'Arjun' });
    n.play({ type: 'leave', player: 'Riya' });
    expect(boardRows(n.view)).toEqual([
      'Meena 5 (1 turn)', 'Kabir 0 (0 turns)', 'Zoya 0 (0 turns)', 'Dev 0 (0 turns)', 'Arjun 1 (1 turn) (left)', 'Riya 3 (1 turn) (left)',
    ]);
    expect(n.view.left).toEqual(['Arjun', 'Riya']);
    expect(n.view.order).toEqual(['Meena', 'Kabir', 'Zoya', 'Dev']);
  });
});

describe('WAI-033: round over', () => {
  wit('after the last player\'s save the round is over: round 2, everyone to play, the first player in the order next', () => {
    const n = new Night({ seed: 'round' }).start();
    for (let p = 0; p < 5; p++) n.savedTurn(1);
    expect(n.view.round).toBe(1);
    expect(n.view.toPlay).toEqual(['Dev']);
    n.savedTurn(1);
    const v = n.view;
    expect(v.round).toBe(2);
    expect(v.step).toBe('pass');
    expect(v.player).toBe('Riya');
    expect(v.toPlay).toEqual(NAMES);
  });

  wit('"Words nobody got" for a round: its passed words of saved turns, after fixes, in the order shown', () => {
    const n = new Night({ seed: 'nobody' }).start(['Riya', 'Arjun']);
    const r = n.turn('GPGP'); // Riya: got g1, passed p1, got g2, passed p2
    n.fix(r.got[0]!); // g1 moved to Passed: in the order shown it sits before p1
    n.save();
    const a = n.turn('PG', { timeUpWord: true });
    n.save();
    const v = n.view;
    expect(v.passedByRound[0]).toEqual([r.got[0], r.passed[0], r.passed[1], a.passed[0], a.passed[1]]);
  });

  wit('K2: round 1\'s words nobody got are Riya\'s two passes; the game\'s are three (with Kabir\'s round 2 pass)', () => {
    const n = new Night({ seed: 'k2-passed' }).start();
    const passed = playK2(n, K2_GOT, K2_PASSED);
    expect(n.view.passedByRound[0]).toEqual(passed[0]);
    expect(passed[0]).toHaveLength(2);
    expect(n.view.passedByRound[1]).toEqual(passed[1]);
    expect(passed[1]).toHaveLength(1);
  });

  wit('Version 1.1 item 33: changing words mid-game (setChoices from R1) keeps every score', () => {
    const n = new Night({ seed: 'change' }).start(['Riya', 'Arjun']);
    n.savedTurn(2); n.savedTurn(3);
    const rows = boardRows(n.view);
    n.play({ type: 'setChoices', choices: { pack: 'Animals', time: 30, hold: 'free', nonveg: false, sounds: false } });
    expect(boardRows(n.view)).toEqual(rows);
    expect(n.view.round).toBe(2);
    expect(n.view.choices).toMatchObject({ pack: 'Animals', time: 30, hold: 'free' });
  });
});

describe('WAI-041 / WAI-042: people mid-game (rule parts)', () => {
  wit('Om added mid-round goes to the end of the order and plays this round', () => {
    const n = new Night({ seed: 'om' }).start();
    n.savedTurn(1); n.savedTurn(1);
    n.play({ type: 'addPlayer', name: 'Om' });
    expect(n.view.order).toEqual([...NAMES, 'Om']);
    expect(n.view.toPlay).toEqual(['Meena', 'Kabir', 'Zoya', 'Dev', 'Om']);
    for (let i = 0; i < 4; i++) n.savedTurn(1);
    expect(n.view.player).toBe('Om');
    n.savedTurn(2);
    expect(n.view.round).toBe(2);
  });

  wit('Kabir leaves: out of the order, points kept; leaving on his own T1 hands T1 to the next player', () => {
    const n = new Night({ seed: 'leave' }).start();
    n.savedTurn(1); n.savedTurn(1); n.savedTurn(1);
    expect(n.view.player).toBe('Kabir');
    n.play({ type: 'leave', player: 'Kabir' });
    expect(n.view.player).toBe('Zoya');
    expect(n.view.order).toEqual(['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev']);
    n.savedTurn(1); n.savedTurn(1);
    expect(n.view.round).toBe(2); // the round ends without Kabir
  });

  wit('Version 1.1 items 32, 41: a leaver\'s exact name rejoins at the end of the order with their points and turns', () => {
    const n = new Night({ seed: 'rejoin' }).start();
    n.savedTurn(4);
    n.play({ type: 'leave', player: 'Riya' });
    n.play({ type: 'addPlayer', name: 'Riya' });
    expect(n.view.order).toEqual(['Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Riya']);
    expect(n.view.left).toEqual([]);
    expect(n.view.scoreboard.find((r: any) => r.player === 'Riya')).toEqual({ player: 'Riya', score: 4, turns: 1, left: false });
    // she had played this round: she next guesses in the next round (product owner, 25 October, item 24)
    expect(n.view.toPlay).not.toContain('Riya');
  });

  wit('a current player\'s name, an empty name, a 21st player and leaving below 2 players are refused', () => {
    const n = new Night({ seed: 'refuse' }).start(['Riya', 'Arjun']);
    expect(n.accepts({ type: 'addPlayer', name: 'Riya' })).toBe(false);
    expect(n.accepts({ type: 'addPlayer', name: '' })).toBe(false);
    expect(n.accepts({ type: 'leave', player: 'Arjun' })).toBe(false); // WAI-042: 2 players needed
    const big = new Night({ seed: 'big' }).start(Array.from({ length: 20 }, (_, i) => `P${i + 1}`));
    expect(big.accepts({ type: 'addPlayer', name: 'Om' })).toBe(false);
  });
});
