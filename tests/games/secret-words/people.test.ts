// People in the rules: pairs of clue givers, players during a game, and naming nobody for a wrong word
// (specs/secret-words/07-sessions.md SWD-123, SWD-125, SWD-127; the picker of SWD-122 only where these scenarios rely
// on it). C3, written before the build, 22 October 2026. The sheets, dialogs and toasts are screens (C2).
import { describe, expect, it } from 'vitest';
import { Evening, exampleTeams, readSecretWordsEvening, type TeamsInput } from './helpers';

const evening = (e: Evening) => readSecretWordsEvening(e.saved());
const NONE = { orange: null, teal: null };

/** A setPlayers move for these teams (players = orange then teal). */
function setPlayers(teams: TeamsInput, renames?: Record<string, string>): any {
  const move: any = { type: 'setPlayers', players: [...teams.orange, ...teams.teal], teams };
  if (renames) move.renames = renames;
  return move;
}

describe('SWD-123: pairs of clue givers', () => {
  it('a pair set at Make teams (config) or by "Swap clue givers" (setClueGivers) is credited for the game, both names', () => {
    const e = new Evening({ seed: 'pair', teams: exampleTeams({ partners: { orange: 'Meena', teal: null } }) });
    e.deal();
    e.must({ type: 'endGame' });
    e.must({ type: 'setClueGivers', clueGivers: { orange: 'Riya', teal: 'Arjun' }, partners: { orange: null, teal: 'Kabir' } });
    e.deal();
    e.must({ type: 'endGame' });
    expect(evening(e).games.map((g: any) => g.clueGivers)).toEqual([
      { orange: ['Riya', 'Meena'], teal: ['Arjun'] }, { orange: ['Riya'], teal: ['Arjun', 'Kabir'] },
    ]);
  });

  it('a partner must be an eligible player of the team other than the clue giver', () => {
    const e = new Evening({ seed: 'pair-bad', teams: exampleTeams({ guessOnly: ['Om'] }) });
    e.deal();
    e.must({ type: 'endGame' });
    const cg = { orange: 'Riya', teal: 'Arjun' };
    for (const partners of [
      { orange: 'Riya', teal: null }, // the clue giver
      { orange: 'Kabir', teal: null }, // the other team's player
      { orange: 'Om', teal: null }, // "Doesn't give clues"
      { orange: 'Nobody', teal: null },
    ]) expect(e.try({ type: 'setClueGivers', clueGivers: cg, partners }), JSON.stringify(partners)).toBe(false);
  });

  it('the team must keep at least 1 guesser: a partner that would leave none is refused', () => {
    const e = new Evening({ seed: 'pair-guesser', teams: exampleTeams({ orange: ['Riya', 'Meena', 'Zoya', 'Om'], teal: ['Arjun', 'Kabir'] }) });
    e.deal();
    e.must({ type: 'endGame' });
    expect(e.try({ type: 'setClueGivers', clueGivers: { orange: 'Riya', teal: 'Arjun' }, partners: { orange: null, teal: 'Kabir' } })).toBe(false);
    expect(e.try({ type: 'setClueGivers', clueGivers: { orange: 'Riya', teal: 'Arjun' }, partners: { orange: 'Meena', teal: null } })).toBe(true);
  });

  it('neither partner is a guesser or the picker that game', () => {
    for (let i = 0; i < 20; i++) {
      const e = new Evening({ seed: `pair-picker-${i}`, teams: exampleTeams({ partners: { orange: 'Meena', teal: 'Kabir' } }) });
      e.deal();
      for (let turn = 0; turn < 6 && !e.over(); turn++) {
        e.clue(1);
        const picker = e.view().picker;
        const team = e.turn();
        const guessers = team === 'orange' ? ['Zoya', 'Om'] : ['Dev'];
        expect(guessers, `evening ${i}, turn ${turn + 1}`).toContain(picker);
        e.mustReveal(e.faceDown('nobody')[0] ?? e.faceDown(team)[0]!);
        if (!e.over()) {
          if (e.legalOf('nextTurn').length) e.nextTurn();
          else e.endTurn();
        }
      }
    }
  });
});

describe('SWD-125: credit people, blame the board (the rules part)', () => {
  it('after a wrong word the room view names nobody who could have tapped: no picker, no guesser\'s name anywhere in it', () => {
    const e = new Evening({ seed: 'blame' });
    e.deal();
    const guessers = e.turn() === 'orange' ? ['Meena', 'Zoya', 'Om'] : ['Kabir', 'Dev'];
    e.clue(2);
    const picker = e.view().picker;
    expect(typeof picker).toBe('string');
    e.mustReveal(e.faceDown(e.other())[0]!);
    const v = e.view();
    expect(v.picker).toBeNull();
    const json = JSON.stringify(v);
    for (const name of guessers) expect(json, name).not.toContain(name);
  });

  it('moves never carry who tapped: a reveal is { type, cell } (with freeCell for the Landmine)', () => {
    const e = new Evening({ seed: 'no-tapper', choices: { landmine: 'turn' } });
    e.deal();
    e.clue('inf');
    for (const m of e.legalOf('reveal')) expect(Object.keys(m).sort()).toEqual('freeCell' in m ? ['cell', 'freeCell', 'type'] : ['cell', 'type']);
  });
});

describe('SWD-127: players during a game (setPlayers)', () => {
  it('rename: the name changes everywhere, team and place kept; earlier credits follow (renames: old → new)', () => {
    const e = new Evening({ seed: 'rename' });
    e.deal();
    e.clue(1);
    const t = exampleTeams();
    e.must(setPlayers({ ...t, orange: ['Riya', 'Meena', 'Zoya', 'Omi'] }, { Om: 'Omi' }));
    const ev = evening(e);
    expect(ev.players).toEqual(['Riya', 'Meena', 'Zoya', 'Omi', 'Arjun', 'Kabir', 'Dev']);
    expect(ev.teams.orange).toEqual(['Riya', 'Meena', 'Zoya', 'Omi']);
  });

  it('move a guesser to the end of the other team; add a player as a guesser; remove a guesser', () => {
    const e = new Evening({ seed: 'move' });
    e.deal();
    const t = exampleTeams();
    e.must(setPlayers({ ...t, orange: ['Riya', 'Meena', 'Om'], teal: ['Arjun', 'Kabir', 'Dev', 'Zoya'] }));
    e.must(setPlayers({ ...t, orange: ['Riya', 'Meena', 'Om', 'Neha'], teal: ['Arjun', 'Kabir', 'Dev', 'Zoya'] }));
    e.must(setPlayers({ ...t, orange: ['Riya', 'Meena', 'Om', 'Neha'], teal: ['Arjun', 'Dev', 'Zoya'] }));
    expect(evening(e).teams).toMatchObject({ orange: ['Riya', 'Meena', 'Om', 'Neha'], teal: ['Arjun', 'Dev', 'Zoya'] });
  });

  it('a team is never left with 1 player, or with no guesser; at most 20 players; no duplicate names', () => {
    const e = new Evening({ seed: 'limits', teams: exampleTeams({ orange: ['Riya', 'Meena', 'Zoya'], teal: ['Arjun', 'Kabir', 'Dev'] }) });
    e.deal();
    const t = e.o.teams!;
    expect(e.try(setPlayers({ ...t, teal: ['Arjun'] })), '1 player').toBe(false);
    expect(e.try(setPlayers({ ...t, teal: ['Arjun', 'Kabir'], partners: { orange: null, teal: 'Kabir' } })), 'no guesser').toBe(false);
    const many = Array.from({ length: 18 }, (_, i) => `P${i + 1}`);
    expect(e.try(setPlayers({ ...t, orange: ['Riya', 'Meena', 'Zoya', ...many.slice(0, 9)], teal: ['Arjun', 'Kabir', 'Dev', ...many.slice(9)] })), '24 players').toBe(false);
    expect(e.try(setPlayers({ ...t, orange: ['Riya', 'Meena', 'Zoya', 'Kabir'] })), 'Kabir twice').toBe(false);
    expect(e.try(setPlayers({ ...t, orange: ['Riya', 'Meena', 'Zoya', ...many.slice(0, 7)], teal: ['Arjun', 'Kabir', 'Dev', ...many.slice(7, 14)] })), '20 players').toBe(true);
  });

  it('the clue giver stays a player of the team: removing them needs a new clue giver in the same change', () => {
    const e = new Evening({ seed: 'giver-left' });
    e.deal();
    const t = exampleTeams();
    expect(e.try(setPlayers({ ...t, teal: ['Kabir', 'Dev'] })), 'Arjun removed, still clue giver').toBe(false);
    e.must(setPlayers({ ...t, teal: ['Kabir', 'Dev'], clueGivers: { orange: 'Riya', teal: 'Kabir' } }));
    expect(evening(e).teams.clueGivers).toEqual({ orange: 'Riya', teal: 'Kabir' });
    // The new clue giver now sees the map.
    expect(e.view({ kind: 'player', playerId: 'Kabir' }).cells.every((c: any) => c.kind !== undefined)).toBe(true);
  });

  it('the picker of a turn already under way is unaffected: moved or removed, they stay this turn\'s picker', () => {
    const e = new Evening({ seed: 'picker-stays', teams: exampleTeams({ orange: ['Riya', 'Meena', 'Zoya', 'Om'], teal: ['Arjun', 'Kabir', 'Dev', 'Neha'] }) });
    e.deal();
    e.clue(3);
    const picker = e.view().picker as string;
    const t = e.o.teams!;
    const team = e.turn();
    const without = (xs: string[]) => xs.filter((x) => x !== picker);
    const moved = team === 'orange'
      ? { ...t, orange: without(t.orange), teal: [...t.teal, picker] }
      : { ...t, teal: without(t.teal), orange: [...t.orange, picker] };
    e.must(setPlayers(moved));
    expect(e.view().picker).toBe(picker);
    const removed = team === 'orange' ? { ...moved, teal: without(moved.teal) } : { ...moved, orange: without(moved.orange) };
    e.must(setPlayers(removed));
    expect(e.view().picker).toBe(picker);
  });

  it('players can change at game over too (the Players menu is there)', () => {
    const e = new Evening({ seed: 'players-over' });
    e.deal();
    e.winTurn();
    const t = exampleTeams();
    e.must(setPlayers({ ...t, orange: [...t.orange, 'Neha'] }));
    expect(evening(e).players).toContain('Neha');
  });
});
