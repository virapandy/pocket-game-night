// Section 04's C3 part, the votes (MAF-033 to MAF-036, items 14 and 24), and the rules of leaving, adding and ending
// (MAF-051, MAF-052, MAF-054, items 11 to 14). specs/mafia/04-day.md, 06-room.md; rule API specs/mafia/api.md.
// Written before the build, 25 October 2026.
import { describe, expect, it } from 'vitest';
import { undo } from '../../../src/engine';
import { GameNight, NINE, exampleNight, rolesSeen } from './helpers';
import { NIGHT_1 } from './flows';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** The example game on day 1 (Kabir out on night 1). */
function day1() {
  const g = exampleNight().dealAll();
  g.startNight();
  for (const m of NIGHT_1) g.must(m);
  expect(g.room.step).toBe('day');
  return g;
}
const DAY1_IN = ['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev', 'Om', 'Sunita', 'Neha'];

describe('MAF-033 who got the most fingers (rules part)', () => {
  it('day 1 lists voteOut for each player who is in, "Nobody today", leaves and End the game; never a vote for an out player', () => {
    const g = day1();
    const legal = g.legal();
    expect(legal.filter((m) => m.type === 'voteOut').map((m) => m.player)).toEqual(DAY1_IN);
    expect(legal).toContainEqual({ type: 'voteNobody', reason: 'chosen' });
    expect(legal).not.toContainEqual({ type: 'voteNobody', reason: 'secondTie' });
    expect(legal).toContainEqual({ type: 'endGame' });
    expect(legal.filter((m) => m.type === 'leave').map((m) => m.player)).toEqual(DAY1_IN);
    expect(g.try({ type: 'voteOut', player: 'Kabir' })).toBe(false);
    expect(g.try({ type: 'voteOut', player: 'Imran' })).toBe(false);
  });
});

describe('MAF-036 vote result', () => {
  it('voteOut: the player is out, role shown (out day r), the room view\'s vote holds it until the next night; step nightStart r + 1', () => {
    const g = day1();
    g.voteOut('Zoya');
    expect(g.room.vote).toEqual({ player: 'Zoya', role: 'mafia' });
    expect(g.room.out[1]).toEqual({ player: 'Zoya', role: 'mafia', how: 'vote', round: 1 });
    expect(g.room).toMatchObject({ step: 'nightStart', round: 2, caught: 1 });
    expect(g.room.in).toEqual(DAY1_IN.filter((p) => p !== 'Zoya'));
    g.startNight();
    expect(g.room.vote).toBeNull();
    expect(g.room.morning).toBeNull();
  });
  it('a villager voted out leaves "Mafia caught" unchanged', () => {
    const g = day1();
    g.voteOut('Om');
    expect(g.room.vote).toEqual({ player: 'Om', role: 'villager' });
    expect(g.room.caught).toBe(0);
  });
  it('the vote is final: no move takes it back (canUndo is false for every move)', () => {
    const g = day1();
    g.voteOut('Om');
    const last = g.records[g.records.length - 1];
    expect(g.rules.canUndo(g.state, { record: last, by: 'host', now: last.at + 1 })).toBe(false);
    expect(undo(g.rules, g.match, last.seq, { by: 'host', now: last.at + 1 }).ok).toBe(false);
  });
});

describe('MAF-034 a tie (MF6, items 14 and 24)', () => {
  it('tie { players } needs 2 or more distinct players who are in; then only those are voted on in the re-vote', () => {
    const g = day1();
    expect(g.try({ type: 'tie', players: ['Om'] })).toBe(false);
    expect(g.try({ type: 'tie', players: ['Om', 'Om'] })).toBe(false);
    expect(g.try({ type: 'tie', players: ['Om', 'Kabir'] })).toBe(false);
    g.must({ type: 'tie', players: ['Neha', 'Om'] });
    expect(g.room).toMatchObject({ step: 'revote', tied: ['Om', 'Neha'], round: 1 });
    const legal = g.legal();
    expect(legal.filter((m) => m.type === 'voteOut').map((m) => m.player)).toEqual(['Om', 'Neha']);
    expect(legal).toContainEqual({ type: 'voteNobody', reason: 'secondTie' });
    expect(legal).not.toContainEqual({ type: 'voteNobody', reason: 'chosen' });
    expect(g.try({ type: 'voteOut', player: 'Riya' })).toBe(false);
    expect(g.try({ type: 'voteNobody', reason: 'chosen' })).toBe(false);
    expect(g.try({ type: 'tie', players: ['Om', 'Neha'] })).toBe(false);
  });
  it('"Still a tie": voteNobody secondTie, nobody is out, step nightStart for night 2 (there is never a second re-vote)', () => {
    const g = day1();
    g.must({ type: 'tie', players: ['Om', 'Neha'] }).nobody('secondTie');
    expect(g.room).toMatchObject({ step: 'nightStart', round: 2, vote: null, tied: null });
    expect(g.room.in).toEqual(DAY1_IN);
  });
  it('the re-vote: "Vote Neha out" puts Neha out', () => {
    const g = day1();
    g.must({ type: 'tie', players: ['Om', 'Neha'] }).voteOut('Neha');
    expect(g.room.vote).toEqual({ player: 'Neha', role: 'villager' });
  });
  it('item 14: a tied player who leaves before the re-vote is dropped; with one left, the re-vote shows that name alone', () => {
    const g = day1();
    g.must({ type: 'tie', players: ['Om', 'Neha', 'Sunita'] });
    g.leave('Neha');
    expect(g.room.tied).toEqual(['Om', 'Sunita']);
    g.leave('Sunita');
    expect(g.room.tied).toEqual(['Om']);
    expect(g.legal().filter((m) => m.type === 'voteOut')).toEqual([{ type: 'voteOut', player: 'Om' }]);
  });
  it('voteNobody secondTie is refused outside the re-vote', () => {
    expect(day1().try({ type: 'voteNobody', reason: 'secondTie' })).toBe(false);
  });
});

describe('MAF-035 Nobody today (MF12)', () => {
  it('voteNobody chosen: nobody is out, straight to night 2', () => {
    const g = day1();
    g.nobody('chosen');
    expect(g.room).toMatchObject({ step: 'nightStart', round: 2, vote: null });
    expect(g.room.in).toEqual(DAY1_IN);
    expect(g.legal()).toContainEqual({ type: 'startNight', night: 2 });
  });
});

describe('MAF-052 someone has to leave (rules part)', () => {
  it('by day the leave applies at once: Neha is "left", not offered in the vote, her role not shown; Mafia caught unchanged', () => {
    const g = day1();
    g.leave('Neha');
    expect(g.room.left).toEqual(['Neha']);
    expect(g.room.in).toEqual(DAY1_IN.filter((p) => p !== 'Neha'));
    expect(g.room.caught).toBe(0);
    expect(g.room.roles).toBeNull();
    expect(g.room.out.map((o: any) => o.player)).not.toContain('Neha');
    expect(g.try({ type: 'voteOut', player: 'Neha' })).toBe(false);
    expect(g.legal().some((m) => m.type === 'voteOut' && m.player === 'Neha')).toBe(false);
  });
  it('a Mafia leaving by day: Mafia caught stays 0 (MAF-P4), her role stays secret until game over', () => {
    const g = day1();
    g.leave('Zoya');
    expect(g.room.caught).toBe(0);
    expect(g.room.out.map((o: any) => o.player)).toEqual(['Kabir']);
    expect(g.room.roles).toBeNull();
  });
  it('players who are out can\'t leave (not listed, refused); nobody leaves twice', () => {
    const g = day1();
    expect(g.try({ type: 'leave', player: 'Kabir' })).toBe(false);
    g.leave('Neha');
    expect(g.try({ type: 'leave', player: 'Neha' })).toBe(false);
  });
  it('Undo (unleave) right after a day leave removes it, nothing else changed; any later move closes the Undo (item 13)', () => {
    const g = day1();
    const before = g.room;
    const views = NINE.map((p) => g.pv(p));
    g.leave('Neha');
    g.must({ type: 'unleave', player: 'Neha' });
    expect(g.room).toEqual(before);
    expect(NINE.map((p) => g.pv(p))).toEqual(views);
    g.leave('Neha');
    g.must({ type: 'tie', players: ['Om', 'Riya'] });
    expect(g.try({ type: 'unleave', player: 'Neha' })).toBe(false);
    expect(g.legal().some((m) => m.type === 'unleave')).toBe(false);
  });
  it('unleave is refused for anyone but the player of the last leave', () => {
    const g = day1();
    g.leave('Neha');
    expect(g.try({ type: 'unleave', player: 'Om' })).toBe(false);
  });
});

describe('MAF-051 someone arrives (addNext)', () => {
  it('addNext joins the next game only: listed in next, not dealt now; "Play again" deals them at the end of the seat order', () => {
    const g = day1();
    g.must({ type: 'addNext', name: '  Imran ' });
    expect(g.room.next).toEqual(['Imran']);
    expect(g.room.players).toEqual(NINE);
    expect(g.pv('Imran').me).toBeNull();
    g.must({ type: 'endGame' });
    const again = g.legal().find((m) => m.type === 'start');
    expect(again).toEqual({ type: 'start', players: [...NINE, 'Imran'], mafiaCount: 2 });
    g.must(again);
    expect(g.room.players).toEqual([...NINE, 'Imran']);
    expect(g.room.next).toEqual([]);
    expect(Object.keys(rolesSeen(g))).toContain('Imran');
  });
  it('addNext refuses an empty name, a 17-character name, a player of this game and a name already added', () => {
    const g = day1();
    for (const name of ['', '   ', 'A'.repeat(17), 'Riya', 'Kabir']) expect(g.try({ type: 'addNext', name }), name).toBe(false);
    g.must({ type: 'addNext', name: 'Imran' });
    expect(g.try({ type: 'addNext', name: 'Imran' })).toBe(false);
  });
});

describe('MAF-061 Play again (rules part)', () => {
  it('Play again: the same players without leavers, the same Mafia count; with too few for it, the suggestion; under 5, not offered', () => {
    const g = day1();
    g.leave('Neha');
    g.must({ type: 'endGame' });
    expect(g.legal().find((m) => m.type === 'start')).toEqual({ type: 'start', players: NINE.filter((p) => p !== 'Neha'), mafiaCount: 2 });
    // 6 players with 2 Mafia (Arjun, Zoya); nobody out on night 1; Zoya leaves by day: 5 players allow only 1 Mafia.
    const six = new GameNight({ deals: { 1: { Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'mafia', Dev: 'police' } } })
      .start(NINE.slice(0, 6), 2).dealAll();
    six.night({ Arjun: 'Kabir', Zoya: 'Kabir', Meena: 'Kabir' });
    expect(six.room.morning.out).toBeNull();
    six.leave('Zoya');
    six.must({ type: 'endGame' });
    expect(six.legal().find((m) => m.type === 'start')).toEqual({ type: 'start', players: ['Riya', 'Arjun', 'Meena', 'Kabir', 'Dev'], mafiaCount: 1 });
    // 5 players (Arjun the Mafia): Riya out on night 1, Kabir leaves by day: 4 would remain, so no Play again.
    const five = new GameNight({ deals: { 1: { Riya: 'villager', Arjun: 'mafia', Meena: 'villager', Kabir: 'villager', Zoya: 'villager' } } })
      .start(NINE.slice(0, 5), 1).dealAll();
    five.night({ Arjun: 'Riya' });
    expect(five.room.morning.out).toBe('Riya');
    five.leave('Kabir');
    five.must({ type: 'endGame' });
    expect(five.legal().some((m) => m.type === 'start')).toBe(false);
    expect(five.legal()).toContainEqual({ type: 'endEvening' });
  });
  it('start at game over may also change the players and count ("Change players or roles"): game index k + 1', () => {
    const g = day1();
    g.must({ type: 'endGame' });
    g.must({ type: 'start', players: ['Uma', ...NINE.slice(0, 6)], mafiaCount: 1 });
    expect(g.room).toMatchObject({ step: 'deal', game: 2, games: 2, players: ['Uma', ...NINE.slice(0, 6)], mafiaCount: 1 });
  });
});

describe('MAF-054 End the game (rules part)', () => {
  it('endGame ends the game with no winner, every role shown; unEndGame (Undo) right after returns to where it was', () => {
    const g = day1();
    const before = g.room;
    g.must({ type: 'endGame' });
    expect(g.room).toMatchObject({ step: 'gameOver', winner: null });
    expect(g.room.roles).toEqual(rolesSeen(g));
    expect(g.legal()).toContainEqual({ type: 'unEndGame' });
    g.must({ type: 'unEndGame' });
    expect(g.room).toEqual(before);
  });
  it('endGame is legal from start until game over, not at game over; unEndGame only right after endGame', () => {
    const g = exampleNight();
    expect(g.legal()).toContainEqual({ type: 'endGame' });
    expect(g.try({ type: 'unEndGame' })).toBe(false);
    g.must({ type: 'endGame' });
    expect(g.try({ type: 'endGame' })).toBe(false);
    g.must({ type: 'start', players: NINE, mafiaCount: 2 });
    expect(g.try({ type: 'unEndGame' })).toBe(false);
  });
});
