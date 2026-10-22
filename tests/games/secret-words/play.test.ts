// Clues and guesses, the rules (specs/secret-words/04-play.md SWD-040 to SWD-046, SWD-101, SWD-103; 07-sessions.md
// SWD-118 for the moves' view). C3, written before the build, 22 October 2026. The screens (layouts, strings, timers)
// are C2 and are tested with them.
import { describe, expect, it } from 'vitest';
import { createRng, replay } from '../../../src/engine';
import {
  clueWarning, Evening, oracleFreeCell, penaltyCell, randomChoices, randomGame, reduceLetters, rules, setupInput, type Kind, type Team,
} from './helpers';

const other = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');

/** A dealt evening (Full, Whole family, one phone) at its first clue screen. */
function dealt(seed: string, choices: any = {}): Evening {
  const e = new Evening({ seed, choices });
  e.deal();
  return e;
}

describe('SWD-022 → play: the starting team', () => {
  it('the board\'s starting team (from its code) gives the first clue', () => {
    for (let i = 0; i < 40; i++) {
      const e = dealt(`starts-${i}`);
      expect(e.turn()).toBe(e.board().starts);
      expect(e.view().left).toEqual(e.board().starts === 'orange' ? { orange: 9, teal: 8 } : { orange: 8, teal: 9 });
    }
  });
});

describe('SWD-040: the clue', () => {
  it('a clue is a number 0–9 or ∞ (n: \'inf\'); anything else is refused', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'inf']) expect(dealt(`n-${n}`).try({ type: 'clue', n }), String(n)).toBe(true);
    for (const n of [10, -1, 1.5, '2', 'many', null, Infinity]) expect(dealt('bad-n').try({ type: 'clue', n }), String(n)).toBe(false);
  });

  it('the word is optional; recorded words are 1–24 characters, inner spaces and case kept', () => {
    const e = dealt('word');
    e.clue(2, 'Taj Mahal');
    expect(e.view().clueWord).toBe('Taj Mahal');
    const f = dealt('no-word');
    f.clue(2);
    expect(f.view().clueWord).toBeNull();
    expect(dealt('w24').try({ type: 'clue', n: 1, word: 'x'.repeat(24) })).toBe(true);
  });

  it('a word longer than 24 characters, or empty after trimming, is refused (SWD-101)', () => {
    for (const word of ['x'.repeat(25), '', '   ']) expect(dealt('w-bad').try({ type: 'clue', n: 1, word }), JSON.stringify(word)).toBe(false);
  });
});

describe('SWD-118: the clue and the guesses left in the room view', () => {
  it('before a clue: clue null, clueWord null, guessesLeft null', () => {
    const v = dealt('before').view();
    expect([v.clue, v.clueWord, v.guessesLeft]).toEqual([null, null, null]);
  });

  it('clue 1–9: number + 1 guesses before the first reveal ("3 guesses left (2 + 1 extra)"), then one fewer per guess', () => {
    for (const n of [1, 2, 9]) {
      const e = dealt(`left-${n}`);
      e.clue(n, 'Cricket');
      expect(e.view()).toMatchObject({ clue: n, clueWord: 'Cricket', guessesLeft: n + 1 });
      e.mustReveal(e.faceDown(e.turn())[0]!);
      expect(e.view().guessesLeft, `clue ${n}`).toBe(n);
    }
  });

  it('0 and ∞: unlimited ("Guess as many as you like")', () => {
    for (const n of [0, 'inf'] as const) {
      const e = dealt(`unl-${n}`);
      e.clue(n);
      expect(e.view()).toMatchObject({ clue: n, guessesLeft: 'unlimited' });
      e.mustReveal(e.faceDown(e.turn())[0]!);
      expect(e.view().guessesLeft).toBe('unlimited');
    }
  });
});

describe('SWD-041: guessing and the allowance', () => {
  it('clue 2 allows 3 guesses: after 3 of its own words the turn is over and a 4th reveal is refused', () => {
    const e = dealt('allowance');
    const t = e.turn();
    e.clue(2);
    const own = e.faceDown(t);
    for (const c of own.slice(0, 3)) e.mustReveal(c);
    expect(e.reveal(own[3]!)).toBe(false);
    expect(e.try({ type: 'endTurn' })).toBe(false);
    e.nextTurn();
    expect(e.turn()).toBe(other(t));
  });

  it('clue 0 and ∞ allow as many guesses as there are words', () => {
    for (const n of [0, 'inf'] as const) {
      const e = dealt(`many-${n}`);
      const t = e.turn();
      e.clue(n);
      const own = e.faceDown(t);
      for (const c of own.slice(0, own.length - 1)) e.mustReveal(c);
      expect(e.view().turn).toBe(t);
      expect(e.view().winner).toBeNull();
    }
  });

  it('no clue follows a reveal in the same turn; "Change clue" before the first reveal replaces the turn\'s clue', () => {
    const e = dealt('change');
    const t = e.turn();
    e.clue(2, 'Cricket');
    e.clue(3, 'Monsoon');
    expect(e.view()).toMatchObject({ clue: 3, clueWord: 'Monsoon', guessesLeft: 4 });
    expect(e.view().clues).toEqual([{ team: t, n: 3, word: 'Monsoon', found: 0 }]);
    e.mustReveal(e.faceDown(t)[0]!);
    expect(e.try({ type: 'clue', n: 1 })).toBe(false);
    expect(e.view().clues).toEqual([{ team: t, n: 3, word: 'Monsoon', found: 1 }]);
  });

  it('no turn ends by "End our turn" before one guess (clue 0 included)', () => {
    for (const n of [0, 1, 'inf'] as const) {
      const e = dealt(`early-${n}`);
      expect(e.try({ type: 'endTurn' })).toBe(false);
      e.clue(n);
      expect(e.try({ type: 'endTurn' })).toBe(false);
      e.mustReveal(e.faceDown(e.turn())[0]!);
      expect(e.try({ type: 'endTurn' })).toBe(true);
    }
  });

  it('a guess needs a clue first', () => {
    const e = dealt('no-clue');
    expect(e.reveal(e.faceDown(e.turn())[0]!)).toBe(false);
  });

  it('Property: over 2,000 random games, no turn records more guesses than its allowance (from its last clue), no clue follows a reveal in the same turn, no "End our turn" before one guess', () => {
    for (let i = 0; i < 2000; i++) {
      const rng = createRng(`allowance-${i}`);
      const e = new Evening({ seed: `allowance-${i}`, choices: randomChoices(rng) });
      randomGame(e, rng);
      let clue: number | 'inf' | null = null;
      let guesses = 0;
      for (const { move } of e.records) {
        switch (move.type) {
          case 'deal': case 'dealNew': case 'nextTurn': clue = null; guesses = 0; break;
          case 'clue':
            expect(guesses, `game ${i}: a clue after a reveal`).toBe(0);
            clue = move.n; break;
          case 'reveal':
            expect(clue, `game ${i}: a reveal without a clue`).not.toBeNull();
            guesses++;
            if (typeof clue === 'number' && clue > 0) expect(guesses, `game ${i}: guesses over the allowance`).toBeLessThanOrEqual(clue + 1);
            break;
          case 'endTurn': expect(guesses, `game ${i}: End our turn before a guess`).toBeGreaterThan(0); break;
        }
      }
    }
  });
});

describe('SWD-042: pick, then confirm', () => {
  it('a turned-over cell can\'t be revealed again; a cell outside the board is refused', () => {
    const e = dealt('pick');
    e.clue('inf');
    const c = e.faceDown(e.turn())[0]!;
    e.mustReveal(c);
    expect(e.try({ type: 'reveal', cell: c })).toBe(false);
    for (const cell of [-1, 25, 1.5, '3']) expect(e.try({ type: 'reveal', cell }), String(cell)).toBe(false);
    const easy = dealt('pick-easy', { board: 'easy' });
    easy.clue('inf');
    expect(easy.try({ type: 'reveal', cell: 16 })).toBe(false);
  });

  it('the rules list one reveal per face-down cell while guessing', () => {
    const e = dealt('listed');
    expect(e.legalOf('reveal')).toEqual([]);
    e.clue(2);
    expect(e.legalOf('reveal').map((m) => m.cell).sort((a, b) => a - b)).toEqual(e.faceDown());
  });
});

describe('SWD-043: what a guess does', () => {
  it('own word, guesses left: guessing continues and the cell shows its kind; the counts update', () => {
    const e = dealt('own');
    const t = e.turn();
    e.clue(2);
    const c = e.faceDown(t)[0]!;
    const before = e.view().left[t];
    e.mustReveal(c);
    expect(e.view().cells[c]).toEqual({ word: e.board().words[c], kind: t });
    expect(e.view().left[t]).toBe(before - 1);
    expect(e.view().turn).toBe(t);
    expect(e.legalOf('reveal').length).toBeGreaterThan(0);
  });

  it('nobody\'s word: turn over', () => {
    const e = dealt('nobody');
    const t = e.turn();
    e.clue(3);
    e.mustReveal(e.faceDown('nobody')[0]!);
    expect(e.legalOf('reveal')).toEqual([]);
    e.nextTurn();
    expect(e.turn()).toBe(other(t));
  });

  it('the other team\'s word: turn over, and it counts for them', () => {
    const e = dealt('theirs');
    const t = e.turn();
    e.clue(3);
    const before = e.view().left[other(t)];
    const c = e.faceDown(other(t))[0]!;
    e.mustReveal(c);
    expect(e.view().cells[c].kind).toBe(other(t));
    expect(e.view().left[other(t)]).toBe(before - 1);
    expect(e.legalOf('reveal')).toEqual([]);
  });

  it('either team\'s last word: game over, that team wins (also when the other team turns it over)', () => {
    // The guessing team finds its own last word.
    const a = dealt('last-own');
    const t = a.turn();
    a.winTurn();
    expect(a.view()).toMatchObject({ winner: t, endedEarly: false });
    // The other team's last word, turned over by the guessing team.
    const b = dealt('last-theirs');
    const s = b.turn();
    b.clue(1);
    b.mustReveal(b.faceDown('nobody')[0]!);
    b.nextTurn();
    b.clue('inf');
    const theirs = b.faceDown(other(s));
    for (const c of theirs.slice(0, -1)) b.mustReveal(c);
    b.endTurn();
    expect(b.turn()).toBe(s);
    b.clue(1);
    b.mustReveal(theirs[theirs.length - 1]!);
    expect(b.view()).toMatchObject({ winner: other(s), endedEarly: false });
    expect(rules().isOver(b.state)).toBe(false); // the evening goes on (isOver only after endEvening)
  });

  it('the Landmine, Lose the game: game over, the other team wins; the listed reveal has no freeCell', () => {
    const e = dealt('mine-lose', { landmine: 'lose' });
    const t = e.turn();
    e.clue(1);
    const mine = e.faceDown('landmine')[0]!;
    expect(e.legalOf('reveal').find((m) => m.cell === mine)).toEqual({ type: 'reveal', cell: mine });
    e.mustReveal(mine);
    expect(e.view()).toMatchObject({ winner: other(t), endedEarly: false });
  });

  it('the Landmine, Lose your turn: turn over; the other team\'s free word is list[createRng(`${seeds.deal}:landmine:${D}:${T}`).int(list.length)], recorded as freeCell', () => {
    for (let i = 0; i < 30; i++) {
      const e = new Evening({ seed: `mine-turn-${i}`, choices: { landmine: 'turn' } });
      e.deal();
      if (i % 3 === 1) e.deal('dealNew'); // D = 2
      if (i % 3 === 2) { e.clue(1); e.mustReveal(e.faceDown('nobody')[0]!); e.nextTurn(); } // T = 2
      const t = e.turn();
      e.clue(2);
      const mine = e.faceDown('landmine')[0]!;
      const list = e.faceDown(other(t));
      const free = oracleFreeCell(list, `${e.seeds.deal}:landmine:${e.dealNumber()}:${e.turnNumber()}`);
      const listed = e.legalOf('reveal').find((m) => m.cell === mine);
      expect(listed, `evening ${i}`).toEqual({ type: 'reveal', cell: mine, freeCell: free });
      // Only that freeCell is accepted.
      expect(e.try({ type: 'reveal', cell: mine }), `evening ${i}: no freeCell`).toBe(false);
      const wrong = list.find((c) => c !== free);
      if (wrong !== undefined) expect(e.try({ type: 'reveal', cell: mine, freeCell: wrong }), `evening ${i}: wrong freeCell`).toBe(false);
      const left = e.view().left[other(t)];
      e.must(listed);
      const v = e.view();
      expect(v.cells[mine].kind).toBe('landmine');
      expect(v.cells[free].kind).toBe(other(t));
      expect(v.left[other(t)]).toBe(left - 1);
      expect(v.winner).toBeNull();
      // Turn over; the Landmine stays turned over and can't be picked again.
      expect(e.legalOf('reveal')).toEqual([]);
      e.nextTurn();
      e.clue('inf');
      expect(e.try({ type: 'reveal', cell: mine })).toBe(false);
    }
  });

  it('the Landmine, Lose your turn, when the free word is the other team\'s last: game over, that team wins', () => {
    const e = dealt('mine-last', { landmine: 'turn' });
    const s = e.turn();
    e.clue(1);
    e.mustReveal(e.faceDown('nobody')[0]!);
    e.nextTurn();
    // The other team finds all but one of its words, then stops.
    e.clue('inf');
    const theirs = e.faceDown(other(s));
    for (const c of theirs.slice(0, -1)) e.mustReveal(c);
    e.endTurn();
    e.clue(1);
    const mine = e.faceDown('landmine')[0]!;
    const listed = e.legalOf('reveal').find((m) => m.cell === mine);
    expect(listed).toEqual({ type: 'reveal', cell: mine, freeCell: theirs[theirs.length - 1] });
    e.must(listed);
    expect(e.view()).toMatchObject({ winner: other(s), endedEarly: false });
  });

  it('the Easy board has no Landmine (no listed reveal carries a freeCell)', () => {
    const e = dealt('easy', { board: 'easy', landmine: 'turn' });
    expect(e.board().kinds).not.toContain('landmine');
    e.clue('inf');
    expect(e.legalOf('reveal').every((m) => !('freeCell' in m))).toBe(true);
  });
});

describe('SWD-044 and SWD-045: ending the turn, turn over', () => {
  it('"End our turn" records endTurn, then "Other team\'s turn" records nextTurn: the other team\'s clue is next', () => {
    const e = dealt('end-turn');
    const t = e.turn();
    e.clue(3);
    e.mustReveal(e.faceDown(t)[0]!);
    e.must({ type: 'endTurn' });
    expect(e.legalOf('reveal')).toEqual([]);
    expect(e.try({ type: 'clue', n: 1 })).toBe(false);
    e.nextTurn();
    expect(e.view()).toMatchObject({ turn: other(t), clue: null, clueWord: null, guessesLeft: null });
  });

  it('nextTurn is refused while a turn is still under way (before a clue, or while guesses remain)', () => {
    const e = dealt('next-early');
    expect(e.try({ type: 'nextTurn' })).toBe(false);
    e.clue(2);
    expect(e.try({ type: 'nextTurn' })).toBe(false);
    e.mustReveal(e.faceDown(e.turn())[0]!);
    expect(e.try({ type: 'nextTurn' })).toBe(false);
  });
});

describe('SWD-046: a clue that broke a rule', () => {
  it('brokeRule is listed from the clue until the turn\'s first guess, and never otherwise', () => {
    const e = dealt('window');
    expect(e.legalOf('brokeRule')).toEqual([]);
    e.clue(2);
    expect(e.legalOf('brokeRule')).toHaveLength(1);
    e.mustReveal(e.faceDown(e.turn())[0]!);
    expect(e.legalOf('brokeRule')).toEqual([]);
  });

  it('its cell is list[createRng(`${seeds.deal}:penalty:${D}:${T}`).int(list.length)] over the other team\'s face-down cells; penaltyCell gives the same', () => {
    for (let i = 0; i < 30; i++) {
      const e = new Evening({ seed: `penalty-${i}` });
      e.deal();
      if (i % 3 === 1) e.deal('dealNew');
      if (i % 3 === 2) { e.clue(1); e.mustReveal(e.faceDown('nobody')[0]!); e.nextTurn(); }
      const t = e.turn();
      e.clue(1);
      const want = oracleFreeCell(e.faceDown(other(t)), `${e.seeds.deal}:penalty:${e.dealNumber()}:${e.turnNumber()}`);
      expect(penaltyCell(e.state, e.seeds.deal), `evening ${i}`).toBe(want);
      expect(e.legalOf('brokeRule'), `evening ${i}`).toEqual([{ type: 'brokeRule', cell: want }]);
      const left = e.view().left[other(t)];
      e.brokeRule();
      expect(e.view().cells[want].kind).toBe(other(t));
      expect(e.view().left[other(t)]).toBe(left - 1);
      // The turn ends.
      expect(e.legalOf('reveal')).toEqual([]);
      e.nextTurn();
      expect(e.turn()).toBe(other(t));
    }
  });

  it('if the free word is that team\'s last: game over, that team wins', () => {
    const e = dealt('penalty-last');
    const s = e.turn();
    e.clue(1);
    e.mustReveal(e.faceDown('nobody')[0]!);
    e.nextTurn();
    e.clue('inf');
    const theirs = e.faceDown(other(s));
    for (const c of theirs.slice(0, -1)) e.mustReveal(c);
    e.endTurn();
    e.clue(2);
    e.brokeRule();
    expect(e.view()).toMatchObject({ winner: other(s), endedEarly: false });
  });
});

describe('SWD-101: the clue word', () => {
  it('reduceLetters: NFKC, lower case, a–z only', () => {
    expect(reduceLetters('ice-cream')).toBe('icecream');
    expect(reduceLetters('Taj Mahal')).toBe('tajmahal');
    expect(reduceLetters('मानसून')).toBe('');
    expect(reduceLetters('ＢＡＴ')).toBe('bat'); // full-width letters become a–z under NFKC
    expect(reduceLetters('  B-a-t!! 2 ')).toBe('bat');
    expect(reduceLetters('Café')).toBe('caf');
  });

  it('the worked cases with Bat and Monsoon face down: "bat" and "Batsman" warn Bat; "mon" warns Monsoon; "ca" and "मानसून" never warn', () => {
    const cells = [{ word: 'Kite', turned: false }, { word: 'Bat', turned: false }, { word: 'Monsoon', turned: false }];
    expect(clueWarning('bat', cells)).toBe('Bat');
    expect(clueWarning('Batsman', cells)).toBe('Bat');
    expect(clueWarning('mon', cells)).toBe('Monsoon');
    expect(clueWarning('ca', cells)).toBeNull();
    expect(clueWarning('मानसून', cells)).toBeNull();
    expect(clueWarning('', cells)).toBeNull();
  });

  it('at least 3 letters after reducing; equal, containing or contained; the first such word in data-index order', () => {
    const cells = [{ word: 'Kite', turned: false }, { word: 'Bat', turned: false }, { word: 'Monsoon', turned: false }];
    expect(clueWarning('b-a', cells)).toBeNull(); // 2 letters
    expect(clueWarning('B.A.T.', cells)).toBe('Bat');
    expect(clueWarning('soo', cells)).toBe('Monsoon');
    expect(clueWarning('monsoonbat', cells)).toBe('Bat'); // contains both: Bat is cell 1
    expect(clueWarning('kites', cells)).toBe('Kite');
    expect(clueWarning('Lamp', cells)).toBeNull();
  });

  it('words already turned over never warn', () => {
    const cells = [{ word: 'Kite', turned: false }, { word: 'Bat', turned: true }, { word: 'Monsoon', turned: false }];
    expect(clueWarning('bat', cells)).toBeNull();
    expect(clueWarning('monsoonbat', cells)).toBe('Monsoon');
  });

  it('replay rejects a clue word longer than 24 characters', () => {
    const e = dealt('replay-long');
    const records = [
      ...e.records,
      { v: 1, seq: e.records.length + 1, at: e.at + 1000, by: 'host', move: { type: 'clue', n: 1, word: 'y'.repeat(25) } },
    ];
    expect(replay(rules(), setupInput({ seed: 'replay-long' }), records as any).ok).toBe(false);
  });
});

describe('SWD-103: the recap (the room view\'s lastTurn)', () => {
  it('null on a board\'s first turn and again after "New board"', () => {
    const e = dealt('recap-null');
    expect(e.view().lastTurn).toBeNull();
    e.clue(1);
    e.mustReveal(e.faceDown('nobody')[0]!);
    e.nextTurn();
    expect(e.view().lastTurn).not.toBeNull();
    e.deal('dealNew');
    expect(e.view().lastTurn).toBeNull();
  });

  const cases: { name: string; ended: string; play: (e: Evening) => { found: number; cell?: number } }[] = [
    {
      name: '"End our turn" → stopped', ended: 'stopped',
      play: (e) => { e.clue(3); const own = e.faceDown(e.turn()); e.mustReveal(own[0]!); e.mustReveal(own[1]!); e.must({ type: 'endTurn' }); return { found: 2 }; },
    },
    {
      name: 'allowance used up → allowance', ended: 'allowance',
      play: (e) => { e.clue(1); const own = e.faceDown(e.turn()); e.mustReveal(own[0]!); e.mustReveal(own[1]!); return { found: 2 }; },
    },
    {
      name: 'a nobody\'s word → nobody, with its cell', ended: 'nobody',
      play: (e) => { e.clue(2); e.mustReveal(e.faceDown(e.turn())[0]!); const c = e.faceDown('nobody')[0]!; e.mustReveal(c); return { found: 1, cell: c }; },
    },
    {
      name: 'the other team\'s word → other, with its cell', ended: 'other',
      play: (e) => { e.clue(2); const c = e.faceDown(other(e.turn()))[0]!; e.mustReveal(c); return { found: 0, cell: c }; },
    },
    {
      name: 'broke a rule → rule (the free word is never found)', ended: 'rule',
      play: (e) => { e.clue(2); e.brokeRule(); return { found: 0 }; },
    },
  ];
  for (const c of cases) {
    it(`${c.name}, found = that turn's own words turned over by its guesses`, () => {
      const e = dealt(`recap-${c.ended}`);
      const t = e.turn();
      const want = c.play(e);
      e.nextTurn();
      expect(e.view().lastTurn).toEqual({ team: t, found: want.found, ended: c.ended, ...(want.cell === undefined ? {} : { cell: want.cell }) });
    });
  }

  // Version 3.6 (22 October): a last allowed guess on a wrong word gives that word's line; "allowance" only after the
  // team's own word (the allowance case above).
  const lastGuessWrong: { name: string; ended: 'nobody' | 'other' }[] = [
    { name: 'a nobody\'s word', ended: 'nobody' },
    { name: 'the other team\'s word', ended: 'other' },
  ];
  for (const c of lastGuessWrong) {
    it(`v3.6: the last allowed guess on ${c.name} → ${c.ended} with its cell, not allowance`, () => {
      const e = dealt(`recap-last-${c.ended}`);
      const t = e.turn();
      e.clue(1); // allowance 2
      e.mustReveal(e.faceDown(t)[0]!);
      const cell = e.faceDown(c.ended === 'nobody' ? 'nobody' : other(t))[0]!;
      e.mustReveal(cell); // the second and last allowed guess
      e.nextTurn();
      expect(e.view().lastTurn).toEqual({ team: t, found: 1, ended: c.ended, cell });
    });
  }

  it('v3.6: with a clue for 2, a wrong word as the third (last allowed) guess → its line, found 2', () => {
    const e = dealt('recap-last-third');
    const t = e.turn();
    e.clue(2); // allowance 3
    const own = e.faceDown(t);
    e.mustReveal(own[0]!);
    e.mustReveal(own[1]!);
    const cell = e.faceDown('nobody')[0]!;
    e.mustReveal(cell);
    e.nextTurn();
    expect(e.view().lastTurn).toEqual({ team: t, found: 2, ended: 'nobody', cell });
  });

  it('the Landmine (Lose your turn) → landmine; the free word does not count as found', () => {
    const e = dealt('recap-mine', { landmine: 'turn' });
    const t = e.turn();
    e.clue(3);
    e.mustReveal(e.faceDown(t)[0]!);
    e.mustReveal(e.faceDown('landmine')[0]!);
    e.nextTurn();
    expect(e.view().lastTurn).toMatchObject({ team: t, found: 1, ended: 'landmine' });
  });
});

describe('Kinds are the code\'s (SWD-022 → SWD-043)', () => {
  it('every turned-over cell shows the kind the board from its code gives', () => {
    const e = dealt('kinds');
    e.clue('inf');
    for (let i = 0; i < 3; i++) {
      const c = e.faceDown(e.turn())[0]!;
      e.mustReveal(c);
      expect(e.view().cells[c].kind as Kind).toBe(e.board().kinds[c]);
    }
  });
});
