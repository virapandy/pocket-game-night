// What Am I? game over, tonight and saved data (C3; specs/what-am-i/07-results.md WAI-060 to WAI-064 with Version 1.1
// items 27, 34 to 37 and Version 1.2 item 6; specs/what-am-i/10-lifecycle.md WAI-092 saved data, B9).
import { describe, expect } from 'vitest';
import { replay } from '../../../src/engine';
import { K2_GOT, K2_PASSED, NAMES, Night, WORDS, playK2, rules, startQueue, wit } from './helpers';

describe('WAI-060: End the game', () => {
  wit('endGame from R1 ends the game: K2 gives "Arjun wins with 14", best turn Meena 8, three words nobody got', () => {
    const n = new Night({ seed: 'k2-end' }).start();
    const passed = playK2(n, K2_GOT, K2_PASSED);
    n.endGame();
    const v = n.view;
    expect(v.step).toBe('gameOver');
    expect(v.result).toEqual({
      game: 1, winners: ['Arjun'], top: 14, bestTurn: { player: 'Meena', got: 8 }, passed: [...passed[0]!, ...passed[1]!],
      moved: 0, endedEarly: 0, turns: 12,
    });
  });

  wit('Version 1.1 item 27: endGame during an unsaved turn records only endGame; that turn\'s marks do not count', () => {
    const n = new Night({ seed: 'unsaved' }).start(['Riya', 'Arjun']);
    n.savedTurn(2);
    n.got(); n.got(); n.got(); n.pass();
    n.timeUp(false); // Arjun's T4, not saved
    const moves = n.records.length;
    n.endGame();
    expect(n.records.length).toBe(moves + 1);
    expect(n.records[n.records.length - 1].move).toEqual({ type: 'endGame' });
    const v = n.view;
    expect(v.result.winners).toEqual(['Riya']);
    expect(v.result.turns).toBe(1);
    expect(v.result.passed).toEqual([]);
    expect(v.scoreboard.find((r: any) => r.player === 'Arjun')).toMatchObject({ score: 0, turns: 0 });
  });

  wit('endGame while a turn is paused in T3 is accepted (Undo returns to the Paused cover: the app replays without it)', () => {
    const n = new Night({ seed: 'paused-end' }).start();
    n.got();
    n.pauseHiding();
    n.endGame();
    expect(n.view.step).toBe('gameOver');
    const without = replay(rules(), n.match.setup, n.records.slice(0, -1));
    expect(without.ok).toBe(true);
    if (without.ok) {
      const v = rules().view(without.value.state, { kind: 'host' });
      expect(v.step).toBe('turn');
      expect(v.paused).toBe(true);
      expect(v.turn.got).toHaveLength(1);
    }
  });

  wit('no mark, fix or save is accepted after endGame', () => {
    const n = new Night({ seed: 'after-end' }).start();
    n.savedTurn(1);
    n.endGame();
    expect(n.accepts({ type: 'got', word: WORDS[0]!.id })).toBe(false);
    expect(n.accepts({ type: 'scoreTurn' })).toBe(false);
    expect(n.accepts({ type: 'endGame' })).toBe(false);
  });
});

describe('WAI-061: the winner and the lines of G1', () => {
  wit('a tie shares the win (WA7): Arjun and Meena 12', () => {
    const n = new Night({ seed: 'tie' }).start(['Riya', 'Arjun', 'Meena']);
    n.savedTurn(5); n.savedTurn(12); n.savedTurn(12);
    n.endGame();
    expect(n.view.result.winners).toEqual(['Arjun', 'Meena']);
    expect(n.view.result.top).toBe(12);
  });

  wit('Version 1.1 item 37 / R4: Arjun 12 (left), Meena 12, Dev 12: Meena and Dev share the win', () => {
    const n = new Night({ seed: 'r4' }).start(['Riya', 'Arjun', 'Meena', 'Dev']);
    n.savedTurn(3); n.savedTurn(12); n.savedTurn(12); n.savedTurn(12);
    n.play({ type: 'leave', player: 'Arjun' });
    n.endGame();
    expect(n.view.result.winners).toEqual(['Meena', 'Dev']);
    expect(n.view.result.top).toBe(12);
  });

  wit('R4: a leaver with the most points is never the winner; the best of those still in wins', () => {
    const n = new Night({ seed: 'r4-top' }).start(['Riya', 'Arjun', 'Meena']);
    n.savedTurn(9); n.savedTurn(4); n.savedTurn(6);
    n.play({ type: 'leave', player: 'Riya' });
    n.endGame();
    expect(n.view.result.winners).toEqual(['Meena']);
    expect(n.view.result.top).toBe(6);
  });

  wit('Version 1.1 item 35: every saved turn scored 0: no winner', () => {
    const n = new Night({ seed: 'zero' }).start(['Riya', 'Arjun']);
    n.savedTurn(0, 3); n.savedTurn(0, 1);
    n.endGame();
    expect(n.view.result.winners).toEqual([]);
    expect(n.view.result.turns).toBe(2);
  });

  wit('a game with no saved turn: no winner, no best turn', () => {
    const n = new Night({ seed: 'none' }).start(['Riya', 'Arjun']);
    n.endGame();
    expect(n.view.result).toMatchObject({ winners: [], bestTurn: null, turns: 0, passed: [] });
  });

  wit('best turn: the single turn with most Got it; ties the earliest', () => {
    const n = new Night({ seed: 'best' }).start(['Riya', 'Arjun', 'Meena']);
    n.savedTurn(3); n.savedTurn(6); n.savedTurn(6);
    n.savedTurn(2); n.savedTurn(1); n.savedTurn(0);
    n.endGame();
    expect(n.view.result.bestTurn).toEqual({ player: 'Arjun', got: 6 });
    expect(n.view.result.winners).toEqual(['Arjun']);
  });

  wit('Version 1.2 item 6: moved after time\'s up counts words showing ↺ in saved turns; turns ended early counts saved skips', () => {
    const n = new Night({ seed: 'record' }).start(['Riya', 'Arjun']);
    const r = n.turn('GGP'); n.fix(r.got[0]!); n.fix(r.passed[0]!); n.save();
    n.got(); n.pause(true); n.skip(); n.save();
    const k = n.turn('G'); n.fix(k.got[0]!); n.save(); // round 2, Riya
    n.endGame();
    expect(n.view.result.moved).toBe(3);
    expect(n.view.result.endedEarly).toBe(1);
  });
});

describe('WAI-062: Play again', () => {
  wit('start again: gameIndex 2, scores 0, same choices, per-player holds cleared, the queue by `:2` with game 1\'s words last', () => {
    const n = new Night({ seed: 'again' }).start(NAMES, { pack: 'Animals', time: 30 });
    n.play({ type: 'setHold', player: 'Riya', hold: 'free' });
    const shown = [...n.turn('GGP').shown]; n.save();
    n.endGame();
    n.start(NAMES, { pack: 'Animals', time: 30 });
    const v = n.view;
    expect(v.game).toBe(2);
    expect(v.round).toBe(1);
    expect(v.player).toBe('Riya');
    expect(v.holds.Riya).toBe('hand');
    expect(v.scoreboard.every((r: any) => r.score === 0 && r.turns === 0)).toBe(true);
    const want = startQueue(WORDS, 'again', 2, 'Animals', false, shown);
    expect(n.queue).toEqual([...want.unshown, ...want.shown]);
  });

  wit('a second start while a game is open is refused', () => {
    const n = new Night({ seed: 'twice' }).start();
    expect(n.accepts({ type: 'start', players: NAMES, choices: { pack: 'mix', time: 60, hold: 'hand', nonveg: false, sounds: true } })).toBe(false);
  });

  wit('start needs 2 to 20 different, non-empty names', () => {
    const c = { pack: 'mix', time: 60, hold: 'hand', nonveg: false, sounds: true };
    const n = new Night({ seed: 'names' });
    expect(n.accepts({ type: 'start', players: ['Riya'], choices: c })).toBe(false);
    expect(n.accepts({ type: 'start', players: ['Riya', 'Riya'], choices: c })).toBe(false);
    expect(n.accepts({ type: 'start', players: ['Riya', ''], choices: c })).toBe(false);
    expect(n.accepts({ type: 'start', players: Array.from({ length: 21 }, (_, i) => `P${i}`), choices: c })).toBe(false);
    expect(n.accepts({ type: 'start', players: Array.from({ length: 20 }, (_, i) => `P${i}`), choices: c })).toBe(true);
  });
});

describe('WAI-063 / WAI-064: End for tonight and the summary', () => {
  wit('endEvening needs the game ended first; after it the night is over and nothing more is accepted', () => {
    const n = new Night({ seed: 'evening' }).start();
    n.savedTurn(2);
    expect(n.accepts({ type: 'endEvening' })).toBe(false);
    n.endGame();
    n.endEvening();
    expect(n.view.step).toBe('ended');
    expect(rules().isOver(n.state)).toBe(true);
    expect(rules().legalMoves(n.state, 'host')).toEqual([]);
  });

  wit('two games: players who saved a turn (leavers included), games with a saved turn, words got, wins, best guesser', () => {
    const n = new Night({ seed: 'tonight' }).start(['Riya', 'Arjun', 'Meena']);
    n.savedTurn(3); n.savedTurn(5); n.savedTurn(1);
    n.play({ type: 'leave', player: 'Meena' });
    n.endGame(); // game 1: Arjun wins with 5
    n.start(['Riya', 'Arjun', 'Om']);
    n.savedTurn(7); n.savedTurn(2); n.savedTurn(7);
    n.endGame(); // game 2: Riya and Om share the win with 7
    n.start(['Riya', 'Arjun']);
    n.endGame(); // game 3: no saved turn, not counted
    n.endEvening();
    const t = n.view.tonight;
    expect(t.players).toEqual(['Riya', 'Arjun', 'Meena', 'Om']);
    expect(t.games).toBe(2);
    expect(t.got).toBe(25);
    expect(t.wins).toEqual([{ player: 'Riya', wins: 1 }, { player: 'Arjun', wins: 1 }, { player: 'Om', wins: 1 }]);
    expect(t.best).toEqual({ players: ['Riya'], got: 10 });
  });

  wit('Version 1.1 item 36: wins most first; a shared win counts for each', () => {
    const n = new Night({ seed: 'wins' }).start(['Riya', 'Arjun']);
    n.savedTurn(1); n.savedTurn(2); n.endGame();
    n.start(['Riya', 'Arjun']); n.savedTurn(1); n.savedTurn(2); n.endGame();
    n.start(['Riya', 'Arjun']); n.savedTurn(4); n.savedTurn(4); n.endGame();
    expect(n.view.tonight.wins).toEqual([{ player: 'Arjun', wins: 3 }, { player: 'Riya', wins: 1 }]);
  });

  wit('best guesser tonight: a tie lists every one (Meena and Dev)', () => {
    const n = new Night({ seed: 'best-tie' }).start(['Riya', 'Meena', 'Dev']);
    n.savedTurn(2); n.savedTurn(5); n.savedTurn(5);
    n.endGame(); n.endEvening();
    expect(n.view.tonight.best).toEqual({ players: ['Meena', 'Dev'], got: 5 });
  });
});

describe('WAI-092: saved data (B9)', () => {
  wit('every got, pass and timeUp with a word carries a real word id; replaying the records gives the same game', () => {
    const n = new Night({ seed: 'saved' }).start();
    playK2(n, K2_GOT, K2_PASSED);
    n.endGame();
    n.start();
    n.turn('GPG', { timeUpWord: true }); n.save();
    const known = new Set(WORDS.map((w) => w.id));
    for (const r of n.records) {
      if (['got', 'pass'].includes(r.move.type) || (r.move.type === 'timeUp' && r.move.word)) expect(known.has(r.move.word), JSON.stringify(r.move)).toBe(true);
    }
    const saved = JSON.parse(JSON.stringify({ setup: n.match.setup, records: n.records }));
    const again = replay(rules(), saved.setup, saved.records);
    expect(again.ok).toBe(true);
    if (again.ok) {
      expect(rules().view(again.value.state, { kind: 'host' })).toEqual(n.view);
      expect(rules().view(again.value.state, { kind: 'room' })).toEqual(rules().view(n.state, { kind: 'room' }));
    }
  });

  wit('no view shows the word seed', () => {
    const n = new Night({ seed: 'very-secret-seed-77' }).start();
    n.savedTurn(2);
    for (const viewer of [{ kind: 'host' }, { kind: 'room' }]) {
      expect(JSON.stringify(rules().view(n.state, viewer))).not.toContain('very-secret-seed-77');
    }
  });
});
