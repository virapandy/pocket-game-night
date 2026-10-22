// Winning, game over, Play again, End the game, New board (specs/secret-words/05-results.md SWD-050 to SWD-055).
// C3, written before the build, 22 October 2026. The game-over screen's text and layout are C2 and tested with it.
import { describe, expect, it } from 'vitest';
import { createRng, HOST } from '../../../src/engine';
import { codeParts, Evening, randomChoices, randomGame, readSecretWordsEvening, type Team } from './helpers';

const other = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');
const evening = (e: Evening) => readSecretWordsEvening(e.saved());

describe('SWD-050: who wins', () => {
  it('Property: every one of 10,000 random scripted games ends with exactly one winner, or ended early', () => {
    for (let i = 0; i < 10_000; i++) {
      const rng = createRng(`wins-${i}`);
      const choices = randomChoices(rng);
      const e = new Evening({ seed: `wins-${i}`, choices });
      randomGame(e, rng);
      const v = e.view();
      expect(e.over(), `game ${i} ended`).toBe(true);
      expect((v.winner !== null) !== (v.endedEarly === true), `game ${i}: exactly one of winner / ended early`).toBe(true);
      if (v.winner !== null) {
        expect(['orange', 'teal'], `game ${i}`).toContain(v.winner);
        const last = e.records[e.records.length - 1]!.move;
        const board = e.board();
        const hitMine = last.type === 'reveal' && board.kinds[last.cell] === 'landmine' && choices.board === 'full' && choices.landmine === 'lose';
        // A team wins when all its words are turned over, or the other team stepped on the Landmine (Lose the game).
        if (hitMine) expect(v.left[v.winner], `game ${i}`).toBeGreaterThan(0);
        else expect(v.left[v.winner], `game ${i}: the winner still has words left`).toBe(0);
        expect(v.left[other(v.winner)], `game ${i}: both teams finished`).toBeGreaterThan(0);
      }
    }
  });
});

describe('SWD-051: game over', () => {
  it('the whole map shows: every cell carries its kind; no move but the next game\'s, the night\'s end or players changes is accepted', () => {
    const e = new Evening({ seed: 'game-over' });
    e.deal();
    const t = e.turn();
    e.winTurn();
    const v = e.view();
    expect(v.winner).toBe(t);
    expect(v.cells.map((c: any) => c.kind)).toEqual(e.board().kinds);
    const types = new Set(e.legal().map((m) => m.type));
    for (const no of ['reveal', 'endTurn', 'nextTurn', 'brokeRule', 'dealNew', 'endGame', 'mapSeen']) expect(types.has(no), no).toBe(false);
    expect(types.has('deal')).toBe(true);
    expect(types.has('endEvening')).toBe(true);
    expect(e.try({ type: 'clue', n: 1 })).toBe(false);
  });
});

describe('SWD-052: tally', () => {
  it('"Tonight" counts won games only, by team: 0–0 before any; ended-early games and new boards never count', () => {
    const e = new Evening({ seed: 'tally' });
    e.deal();
    expect(evening(e).tally).toEqual({ orange: 0, teal: 0 });
    const w1 = e.turn();
    e.winTurn();
    expect(evening(e).tally).toEqual({ orange: w1 === 'orange' ? 1 : 0, teal: w1 === 'teal' ? 1 : 0 });
    e.deal();
    e.deal('dealNew');
    e.must({ type: 'endGame' });
    e.deal();
    const w3 = e.turn();
    e.winTurn();
    const want = { orange: 0, teal: 0 };
    want[w1]++;
    want[w3]++;
    expect(evening(e).tally).toEqual(want);
  });
});

describe('SWD-053: Play again', () => {
  it('same teams and choices; a new deal from the deck (the next deal index); the new board\'s starting team gives the first clue', () => {
    const e = new Evening({ seed: 'again', choices: { landmine: 'turn', map: 'shared' } });
    const a = e.deal();
    e.winTurn();
    const before = evening(e);
    const b = e.deal();
    expect(codeParts(b)).toMatchObject({ d: codeParts(a).d, n: codeParts(a).n + 1 });
    const after = evening(e);
    expect(after.teams).toEqual(before.teams);
    expect(after.choices).toEqual({ map: 'shared', board: 'full', landmine: 'turn', words: 'family' });
    expect(e.view()).toMatchObject({ winner: null, endedEarly: false, turn: e.board().starts, clue: null, lastTurn: null });
    expect(e.view().left).toEqual(e.board().starts === 'orange' ? { orange: 9, teal: 8 } : { orange: 8, teal: 9 });
  });

  it('"Swap clue givers" then "Play again": setClueGivers, then deal; the new clue givers see the map', () => {
    const e = new Evening({ seed: 'swap' });
    e.deal();
    e.winTurn();
    e.must({ type: 'setClueGivers', clueGivers: { orange: 'Meena', teal: 'Kabir' }, partners: { orange: null, teal: null } });
    e.deal();
    expect(evening(e).teams.clueGivers).toEqual({ orange: 'Meena', teal: 'Kabir' });
    expect(e.view({ kind: 'player', playerId: 'Meena' }).cells.every((c: any) => c.kind !== undefined)).toBe(true);
  });

  it('a clue giver must be an eligible player of that team', () => {
    const e = new Evening({ seed: 'swap-bad' });
    e.deal();
    e.winTurn();
    const p = { orange: null, teal: null };
    expect(e.try({ type: 'setClueGivers', clueGivers: { orange: 'Kabir', teal: 'Arjun' }, partners: p })).toBe(false); // Kabir is teal
    expect(e.try({ type: 'setClueGivers', clueGivers: { orange: 'Nobody', teal: 'Arjun' }, partners: p })).toBe(false);
    expect(e.try({ type: 'setClueGivers', clueGivers: { orange: null, teal: 'Arjun' }, partners: p })).toBe(false);
  });
});

describe('SWD-054: End the game', () => {
  const steps: [string, (e: Evening) => void][] = [
    ['right after the deal (scan or pass screen)', () => {}],
    ['on the clue screen after mapSeen', (e) => { if (e.choices.map === 'pass') e.must({ type: 'mapSeen' }); }],
    ['while guessing', (e) => { e.clue(2); }],
    ['after a guess', (e) => { e.clue(2); e.mustReveal(e.faceDown(e.turn())[0]!); }],
    ['at turn over', (e) => { e.clue(2); e.mustReveal(e.faceDown('nobody')[0]!); }],
    ['on a later turn', (e) => { e.clue(2); e.mustReveal(e.faceDown('nobody')[0]!); e.nextTurn(); }],
  ];
  for (const [name, to] of steps) {
    it(`endGame ${name}: game over with no winner, ended early, the whole map shown, the tally unchanged`, () => {
      const e = new Evening({ seed: `end-${name}` });
      e.deal();
      to(e);
      const tally = evening(e).tally;
      e.must({ type: 'endGame' });
      const v = e.view();
      expect(v).toMatchObject({ winner: null, endedEarly: true });
      expect(v.cells.map((c: any) => c.kind)).toEqual(e.board().kinds);
      expect(evening(e).tally).toEqual(tally);
      expect(evening(e).games.at(-1)).toMatchObject({ number: 1, winner: null, endedEarly: true });
    });
  }

  it('endGame is refused at game over (won or already ended) and before the first deal', () => {
    const e = new Evening({ seed: 'end-twice' });
    expect(e.try({ type: 'endGame' })).toBe(false);
    e.deal();
    e.must({ type: 'endGame' });
    expect(e.try({ type: 'endGame' })).toBe(false);
    e.deal();
    e.winTurn();
    expect(e.try({ type: 'endGame' })).toBe(false);
  });

  it('canUndo is always false (the "Game ended · Undo" toast is screen state, not a move)', () => {
    const e = new Evening({ seed: 'no-undo' });
    e.deal();
    e.clue(1);
    e.mustReveal(e.faceDown(e.turn())[0]!);
    e.must({ type: 'endGame' });
    for (const record of e.records) expect(e.rules.canUndo(e.state, { record, by: HOST, now: record.at + 1 }), record.move.type).toBe(false);
  });
});

describe('SWD-055: New board', () => {
  it('a new deal with the same teams, clue givers and choices; the starting team from the new code; turn numbers restart; not a game', () => {
    const e = new Evening({ seed: 'new-board', choices: { landmine: 'turn' } });
    const a = e.deal();
    e.clue(1);
    e.mustReveal(e.faceDown('nobody')[0]!);
    e.nextTurn();
    const before = evening(e);
    const b = e.deal('dealNew');
    expect(codeParts(b)).toMatchObject({ d: codeParts(a).d, n: codeParts(a).n + 1 });
    const v = e.view();
    expect(v).toMatchObject({ turn: e.board().starts, clue: null, lastTurn: null, winner: null, endedEarly: false });
    expect(v.cells.every((c: any) => c.kind === undefined)).toBe(true);
    expect(v.cells.map((c: any) => c.word)).toEqual(e.board().words);
    expect(e.turnNumber()).toBe(1);
    const after = evening(e);
    expect(after.teams).toEqual(before.teams);
    expect(after.choices).toEqual(before.choices);
    expect(after.games).toEqual([]);
    // Ended now, it is one game (ended early), not two.
    e.must({ type: 'endGame' });
    expect(evening(e).games).toHaveLength(1);
    expect(evening(e).games[0]).toMatchObject({ number: 1, endedEarly: true, code: b });
  });

  it('dealNew is refused before the first deal and at game over', () => {
    const e = new Evening({ seed: 'new-board-when' });
    expect(e.legalOf('dealNew')).toEqual([]);
    e.deal();
    e.winTurn();
    expect(e.legalOf('dealNew')).toEqual([]);
  });
});
