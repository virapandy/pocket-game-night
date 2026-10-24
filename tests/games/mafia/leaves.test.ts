// MAF-052 which screen a leave was on: the leave move's optional `when` (C3 review fixes, 25 October 2026).
// Rule API: specs/mafia/api.md ("Leaves", "When each move is legal"). Orchestrator calls made while the owner was away,
// listed in docs/test-questions.md (25 October, "Mafia review fixes").
// Example deal (MAF-H3): Mafia Arjun and Zoya; Doctor Meena; Police Dev; Villagers Riya, Kabir, Om, Sunita, Neha.
import { describe, expect, it } from 'vitest';
import { GameNight, NINE, QUIET_NIGHT, exampleNight, readMafiaNight, savedOf } from './helpers';
import { NIGHT_1 } from './flows';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** The example game after night 1 (Kabir out), at day 1. */
function toDay1(): GameNight {
  const g = exampleNight().dealAll();
  g.startNight();
  for (const m of NIGHT_1) g.must(m);
  expect(g.room.step).toBe('day');
  return g;
}
/** N0 of night 2, after day 1's vote. */
function toN0Night2(voted = 'Om'): GameNight {
  const g = toDay1().voteOut(voted);
  expect(g.room).toMatchObject({ step: 'nightStart', round: 2 });
  return g;
}
const leftLog = (g: GameNight) => readMafiaNight(savedOf(g)).games[0].left;
/** A refused move changes nothing. */
function refused(g: GameNight, move: any) {
  const before = g.room;
  const records = g.records.length;
  expect(g.try(move), JSON.stringify(move)).toBe(false);
  expect(g.room).toEqual(before);
  expect(g.records.length).toBe(records);
}

describe('MAF-052 N0 of night 2 or later: `when: \'night\'` is a night leave of the coming night', () => {
  it('legalMoves on N0 of night 2 lists, for each player who is in, both the plain leave and { when: \'night\' }', () => {
    const g = toN0Night2();
    const leaves = g.legal().filter((m) => m.type === 'leave');
    const inNow = g.room.in as string[];
    for (const p of inNow) {
      expect(leaves).toContainEqual({ type: 'leave', player: p });
      expect(leaves).toContainEqual({ type: 'leave', player: p, when: 'night' });
    }
    expect(leaves.every((m) => inNow.includes(m.player))).toBe(true);
  });
  it('it waits for the night: still N0, Neha leaving (and counted in) until the night resolves, then left; logged { when: night, round: 2 }', () => {
    const g = toN0Night2();
    g.must({ type: 'leave', player: 'Neha', when: 'night' });
    expect(g.room).toMatchObject({ step: 'nightStart', round: 2, leaving: ['Neha'], left: [], winner: null });
    expect(g.room.in).toContain('Neha');
    g.startNight();
    expect(g.room.leaving).toEqual(['Neha']);
    expect(g.room.in).toContain('Neha');
    const order = g.night();
    expect(order).not.toContain('Neha');
    expect(g.room.leaving).toEqual([]);
    expect(g.room.left).toEqual(['Neha']);
    expect(g.room.in).not.toContain('Neha');
    const game = readMafiaNight(savedOf(g)).games[0];
    expect(game.left).toEqual([{ player: 'Neha', when: 'night', round: 2 }]);
    expect(game.nights[1].left).toEqual(['Neha']);
  });
  it('the night leaver is not in the night order: T is one less than without the leave', () => {
    const without = toN0Night2().startNight();
    const g = toN0Night2();
    g.must({ type: 'leave', player: 'Neha', when: 'night' }).startNight();
    expect(g.room.turn.of).toBe(without.room.turn.of - 1);
  });
  it('Undo works right after it: unleave is listed and restores N0 exactly; any later move closes the Undo', () => {
    const g = toN0Night2();
    const before = g.room;
    g.must({ type: 'leave', player: 'Neha', when: 'night' });
    expect(g.legal()).toContainEqual({ type: 'unleave', player: 'Neha' });
    g.must({ type: 'unleave', player: 'Neha' });
    expect(g.room).toEqual(before);
    g.must({ type: 'leave', player: 'Neha', when: 'night' }).startNight();
    expect(g.legal().some((m) => m.type === 'unleave')).toBe(false);
    refused(g, { type: 'unleave', player: 'Neha' });
  });
  it('the winner check waits for the night: the last Mafia leaving on N0 by night does not end the game until the night resolves', () => {
    const g = toN0Night2('Zoya');   // Zoya (Mafia) voted out on day 1: Arjun is the last Mafia
    g.must({ type: 'leave', player: 'Arjun', when: 'night' });
    expect(g.room).toMatchObject({ step: 'nightStart', winner: null, leaving: ['Arjun'] });
    const order = g.night();
    expect(order).not.toContain('Arjun');
    // No Mafia pick tonight: the fixed line; then the leave applies and the Village wins.
    expect(g.room).toMatchObject({ step: 'gameOver', winner: 'village', left: ['Arjun'] });
    const game = readMafiaNight(savedOf(g)).games[0];
    expect(game.left).toEqual([{ player: 'Arjun', when: 'night', round: 2 }]);
    expect(game.nights[1]).toMatchObject({ out: null, storyId: null, left: ['Arjun'] });
    expect(g.room.morning).toMatchObject({ story: QUIET_NIGHT, storyId: null, out: null });
  });
});

describe('MAF-052 a leave without `when` after the day\'s vote (V3s, V4) is a day leave of the day before', () => {
  it('it applies at once: still N0 of night 2, Neha left, not leaving; logged { when: day, round: 1 }', () => {
    const g = toN0Night2();
    g.leave('Neha');
    expect(g.room).toMatchObject({ step: 'nightStart', round: 2, leaving: [], left: ['Neha'] });
    expect(g.room.in).not.toContain('Neha');
    expect(leftLog(g)).toEqual([{ player: 'Neha', when: 'day', round: 1 }]);
    g.startNight();
    expect(g.night()).not.toContain('Neha');
  });
  it('`when: \'day\'` there is the same day leave', () => {
    const a = toN0Night2();
    a.leave('Neha');
    const b = toN0Night2();
    b.must({ type: 'leave', player: 'Neha', when: 'day' });
    expect(b.room).toEqual(a.room);
    expect(leftLog(b)).toEqual([{ player: 'Neha', when: 'day', round: 1 }]);
  });
  it('it runs the winner check at once: the last Mafia leaving after the day\'s vote ends the game, the Village wins', () => {
    const g = toN0Night2('Zoya');
    g.leave('Arjun');
    expect(g.room).toMatchObject({ step: 'gameOver', winner: 'village', left: ['Arjun'] });
    const game = readMafiaNight(savedOf(g)).games[0];
    expect(game.left).toEqual([{ player: 'Arjun', when: 'day', round: 1 }]);
    expect(game.nights).toHaveLength(1);
  });
  it('Undo works right after it and restores N0 exactly', () => {
    const g = toN0Night2();
    const before = g.room;
    g.leave('Neha');
    expect(g.legal()).toContainEqual({ type: 'unleave', player: 'Neha' });
    g.must({ type: 'unleave', player: 'Neha' });
    expect(g.room).toEqual(before);
  });
});

describe('MAF-052 night 1\'s Night begins: a leave is always a night leave', () => {
  it('a plain leave on N0 of night 1 waits for the night; logged { when: night, round: 1 }', () => {
    const g = exampleNight().dealAll();
    g.leave('Neha');
    expect(g.room).toMatchObject({ step: 'nightStart', round: 1, leaving: ['Neha'], left: [] });
    expect(g.room.in).toContain('Neha');
    expect(g.night()).not.toContain('Neha');
    expect(g.room.left).toEqual(['Neha']);
    expect(leftLog(g)).toEqual([{ player: 'Neha', when: 'night', round: 1 }]);
  });
  it('`when: \'night\'` is accepted and the same; `when: \'day\'` is refused', () => {
    const a = exampleNight().dealAll();
    a.leave('Neha');
    const b = exampleNight().dealAll();
    refused(b, { type: 'leave', player: 'Neha', when: 'day' });
    b.must({ type: 'leave', player: 'Neha', when: 'night' });
    expect(b.room).toEqual(a.room);
  });
  it('no "Deal again" while someone is leaving tonight: redeal not listed and refused; after Undo it is back', () => {
    const g = exampleNight().dealAll();
    expect(g.legal()).toContainEqual({ type: 'redeal' });
    g.leave('Neha');
    expect(g.legal()).not.toContainEqual({ type: 'redeal' });
    refused(g, { type: 'redeal' });
    g.must({ type: 'unleave', player: 'Neha' });
    expect(g.legal()).toContainEqual({ type: 'redeal' });
    expect(g.try({ type: 'redeal' })).toBe(true);
  });
});

describe('MAF-052 elsewhere `when` must match the phase; any other value is refused', () => {
  it('in the day (and the re-vote) `when: \'day\'` is accepted, `when: \'night\'` refused', () => {
    const g = toDay1();
    refused(g, { type: 'leave', player: 'Neha', when: 'night' });
    g.must({ type: 'leave', player: 'Neha', when: 'day' });
    expect(g.room.left).toEqual(['Neha']);
    expect(leftLog(g)).toEqual([{ player: 'Neha', when: 'day', round: 1 }]);
    const r = toDay1().must({ type: 'tie', players: ['Om', 'Riya'] });
    expect(r.room.step).toBe('revote');
    refused(r, { type: 'leave', player: 'Om', when: 'night' });
    r.must({ type: 'leave', player: 'Om', when: 'day' });
    expect(r.room.tied).toEqual(['Riya']);
  });
  it('in the night `when: \'night\'` is accepted, `when: \'day\'` refused', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow();
    refused(g, { type: 'leave', player: 'Neha', when: 'day' });
    g.must({ type: 'leave', player: 'Neha', when: 'night' });
    expect(g.room.leaving).toEqual(['Neha']);
  });
  it('in the deal any `when` is refused (a deal leave is neither)', () => {
    const g = new GameNight({ seed: 'deal-when' }).start(NINE, 2);
    refused(g, { type: 'leave', player: 'Kabir', when: 'night' });
    refused(g, { type: 'leave', player: 'Kabir', when: 'day' });
    expect(g.try({ type: 'leave', player: 'Kabir' })).toBe(true);
  });
  it('any other value is refused, on N0 of night 2, in the day, in the night', () => {
    const bad = ['evening', 'Night', 'DAY', '', null, 1, true, {}];
    const places: [string, () => GameNight][] = [
      ['N0 night 2', () => toN0Night2()],
      ['day 1', () => toDay1()],
      ['night 1', () => { const g = exampleNight().dealAll(); g.startNight(); return g; }],
    ];
    for (const [, make] of places) {
      const g = make();
      for (const when of bad) refused(g, { type: 'leave', player: 'Neha', when });
    }
  });
});

describe('MAF-052 / MAF-027 the night leave that ends the night has no Undo', () => {
  it('the last player still to take a turn leaving resolves the night at once; unleave is not listed and refused', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    for (const m of NIGHT_1.slice(0, 8)) g.must(m);
    expect(g.room.turn.player).toBe('Neha');
    g.must({ type: 'leave', player: 'Neha', when: 'night' });
    expect(g.room).toMatchObject({ step: 'day', left: ['Neha'], leaving: [] });
    expect(g.legal().some((m) => m.type === 'unleave')).toBe(false);
    refused(g, { type: 'unleave', player: 'Neha' });
  });
});

describe('MAF-052 the room view: a night leaver counts as in until the night resolves (`leaving`)', () => {
  it('during the night: in holds Kabir, leaving [Kabir], left []; after: in without him, leaving [], left [Kabir]', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow();
    g.leave('Kabir');
    expect(g.room.in).toEqual(NINE);
    expect(g.room).toMatchObject({ leaving: ['Kabir'], left: [] });
    g.night();
    expect(g.room.in).not.toContain('Kabir');
    expect(g.room).toMatchObject({ leaving: [], left: ['Kabir'] });
  });
});
