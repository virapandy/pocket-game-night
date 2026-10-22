// The evening and its saved data (specs/secret-words/06-evening.md SWD-060, 062, 063, 064, 067; SWD-026's replay of a
// saved evening). C3 (saved data), written before the build, 22 October 2026. Deleting, saved choices and the app's
// 12-hour sweep are app behaviour, tested in the browser with the screens.
// Format fixture: tests/fixtures/secret-words-saved-evenings-v1.json (written from the scenarios' algorithms; never edit it).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HOST, readSavedGame, replay } from '../../../src/engine';
import { Evening, exampleTeams, readSecretWordsEvening, rules, type Team } from './helpers';

const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/secret-words-saved-evenings-v1.json', import.meta.url)), 'utf8'));
const evening = (e: Evening) => readSecretWordsEvening(e.saved());
const pick = (g: any) => ({ number: g.number, winner: g.winner, endedEarly: g.endedEarly, landmine: g.landmine, code: g.code, clueGivers: g.clueGivers, clues: g.clues });

describe('SWD-060: end of the evening', () => {
  it('endEvening at game over ends the evening: isOver, nothing listed, no move accepted', () => {
    const e = new Evening({ seed: 'night-end' });
    e.deal();
    e.winTurn();
    expect(e.rules.isOver(e.state)).toBe(false);
    e.must({ type: 'endEvening' });
    expect(e.rules.isOver(e.state)).toBe(true);
    expect(e.legal()).toEqual([]);
    expect(e.try({ type: 'deal', code: '27P3QX8' })).toBe(false);
    expect(evening(e).ended).toBe(true);
  });

  it('mid-game: leaving the summary records endGame, then endEvening; the game counts as ended early', () => {
    const e = new Evening({ seed: 'night-mid' });
    e.deal();
    const t = e.turn();
    e.winTurn();
    e.deal();
    e.clue(1);
    e.must({ type: 'endGame' }).must({ type: 'endEvening' });
    const ev = evening(e);
    expect(ev.ended).toBe(true);
    expect(ev.games.map((g: any) => [g.number, g.winner, g.endedEarly])).toEqual([[1, t, false], [2, null, true]]);
  });

  it('endEvening is refused before the first deal and while a game is in progress (endGame comes first)', () => {
    const e = new Evening({ seed: 'night-early' });
    expect(e.try({ type: 'endEvening' })).toBe(false);
    e.deal();
    expect(e.try({ type: 'endEvening' })).toBe(false);
  });
});

describe('SWD-062: leaving and resuming', () => {
  it('every move is saved: replaying the saved records gives the same evening', () => {
    const e = new Evening({ seed: 'resume', choices: { landmine: 'turn' } });
    e.deal();
    e.must({ type: 'mapSeen' });
    e.clue(2, 'Monsoon');
    e.mustReveal(e.faceDown(e.turn())[0]!);
    e.mustReveal(e.faceDown('landmine')[0]!);
    e.nextTurn();
    e.clue(1);
    const r = replay(e.rules, e.match.setup, e.records);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.state).toEqual(e.state);
      expect(e.rules.view(r.value.state, { kind: 'room' })).toEqual(e.view());
    }
  });
});

describe('SWD-063 (rules part): the 12-hour limit', () => {
  it('endGame and endEvening are accepted at the last move + 12 hours', () => {
    const e = new Evening({ seed: 'twelve' });
    e.deal();
    e.clue(1);
    const last = e.records.at(-1)!.at;
    const at = last + 12 * 3_600_000;
    for (const move of [{ type: 'endGame' }, { type: 'endEvening' }]) {
      const r = e.rules.apply(e.state, move, { by: HOST, at });
      expect(r.ok, move.type).toBe(true);
      if (r.ok) e.match = { ...e.match, state: r.value };
    }
    expect(e.rules.isOver(e.state)).toBe(true);
  });
});

describe('SWD-064: History (readSecretWordsEvening)', () => {
  it('games are numbered from 1, won and ended early; replaced boards are not games; a Landmine win is marked', () => {
    const e = new Evening({ seed: 'history' });
    e.deal();
    const t1 = e.turn();
    e.winTurn();
    e.deal();
    e.deal('dealNew');
    e.must({ type: 'endGame' });
    e.deal();
    const t3 = e.turn();
    e.clue(1);
    e.mustReveal(e.faceDown('landmine')[0]!);
    const ev = evening(e);
    expect(ev.games.map((g: any) => [g.number, g.winner, g.endedEarly, g.landmine])).toEqual([
      [1, t1, false, false], [2, null, true, false], [3, t3 === 'orange' ? 'teal' : 'orange', false, true],
    ]);
  });

  it('credited clue givers: the clue giver and partner when the game ends, each team\'s list clue giver first', () => {
    const e = new Evening({ seed: 'credits', teams: exampleTeams({ partners: { orange: 'Meena', teal: null } }) });
    e.deal();
    e.winTurn();
    e.must({ type: 'setClueGivers', clueGivers: { orange: 'Zoya', teal: 'Kabir' }, partners: { orange: null, teal: 'Dev' } });
    e.deal();
    e.must({ type: 'endGame' });
    expect(evening(e).games.map((g: any) => g.clueGivers)).toEqual([
      { orange: ['Riya', 'Meena'], teal: ['Arjun'] },
      { orange: ['Zoya'], teal: ['Kabir', 'Dev'] },
    ]);
  });

  it('a game\'s clues: every clue in force, oldest first, with found; a replaced clue is gone; a clue without a word has no word', () => {
    const e = new Evening({ seed: 'clues' });
    e.deal();
    const s = e.turn();
    const o: Team = s === 'orange' ? 'teal' : 'orange';
    e.clue(2, 'Cricket');
    e.clue(1, 'Monsoon'); // "Change clue": replaces Cricket
    const own = e.faceDown(s);
    e.mustReveal(own[0]!);
    e.mustReveal(own[1]!); // allowance used up
    e.nextTurn();
    e.clue(1);
    e.mustReveal(e.faceDown('nobody')[0]!);
    e.nextTurn();
    e.clue('inf', 'Rain');
    e.mustReveal(e.faceDown(s)[0]!);
    e.must({ type: 'endTurn' });
    e.nextTurn();
    e.must({ type: 'endGame' });
    expect(evening(e).games[0].clues).toEqual([
      { team: s, n: 1, word: 'Monsoon', found: 2 }, { team: o, n: 1, found: 0 }, { team: s, n: 'inf', word: 'Rain', found: 1 },
    ]);
  });

  it('names as renamed (SWD-127): an earlier game\'s credits follow a rename', () => {
    const e = new Evening({ seed: 'renamed' });
    e.deal();
    e.winTurn();
    const t = exampleTeams();
    e.must({
      type: 'setPlayers', players: ['Riya', 'Arjun K', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om'],
      teams: { ...t, teal: ['Arjun K', 'Kabir', 'Dev'], clueGivers: { orange: 'Riya', teal: 'Arjun K' } }, renames: { Arjun: 'Arjun K' },
    });
    expect(evening(e).games[0].clueGivers).toEqual({ orange: ['Riya'], teal: ['Arjun K'] });
  });
});

describe('SWD-067: Start new (ends that one)', () => {
  it('records endGame (a game was in progress) and endEvening; the old evening is then over', () => {
    const e = new Evening({ seed: 'start-new' });
    e.deal();
    e.clue(3);
    e.must({ type: 'endGame' }).must({ type: 'endEvening' });
    expect(e.rules.isOver(e.state)).toBe(true);
    expect(evening(e).games).toHaveLength(1);
  });
});

describe('Saved evenings: the format fixture always opens (SWD-026, SWD-062, SWD-064; PLT-014)', () => {
  it('the fixture is an engine SavedGame at format 2 and opens with readSavedGame unchanged', () => {
    for (const g of [fixture.ended, fixture.inProgress]) {
      expect(g.format).toBe(2);
      expect(g.gameType).toBe('secret-words');
      const r = readSavedGame(g);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.game).toEqual(g);
    }
  });

  it('it replays with the rules (live codes, a Landmine free word, a new board, a broken rule)', () => {
    for (const g of [fixture.ended, fixture.inProgress]) {
      const r = replay(rules(), g.setup, g.records);
      expect(r.ok, `${g.id}: ${(r as any).reason}`).toBe(true);
    }
  });

  it('the rules listed exactly these codes, free word and penalty cell when it was played (re-played move by move through legalMoves)', () => {
    const g = fixture.ended;
    let state = rules().setup(g.setup);
    for (const rec of g.records) {
      const m = rec.move;
      if (['deal', 'dealNew', 'brokeRule'].includes(m.type) || (m.type === 'reveal' && 'freeCell' in m)) {
        expect(rules().legalMoves(state, HOST), `record ${rec.seq}`).toContainEqual(m);
      }
      const r = rules().apply(state, m, { by: rec.by, at: rec.at });
      expect(r.ok, `record ${rec.seq}: ${(r as any).reason}`).toBe(true);
      if (!r.ok) return;
      state = r.value;
    }
    expect(rules().isOver(state)).toBe(true);
  });

  it('readSecretWordsEvening gives the games, credits, clues and tally the scenarios say', () => {
    const ended = readSecretWordsEvening(fixture.ended);
    expect(ended.ended).toBe(true);
    expect(ended.tally).toEqual(fixture.expected.tally);
    expect(ended.games.map(pick)).toEqual(fixture.expected.games.map(pick));
    const open = readSecretWordsEvening(fixture.inProgress);
    expect(open.ended).toBe(false);
    expect(open.games.map(pick)).toEqual(fixture.expected.games.slice(0, 2).map(pick));
    expect(open.tally).toEqual(fixture.expected.tally);
    expect(open.choices).toEqual({ map: 'pass', board: 'full', landmine: 'lose', words: 'family' });
    expect(open.teams.clueGivers).toEqual({ orange: 'Meena', teal: 'Kabir' });
  });
});
