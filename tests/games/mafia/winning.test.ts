// Section 05, winning (C3): the winner check, leavers, ending with no winner, whole random games (MAF-P4, MAF-P6).
// specs/mafia/05-winning.md (with Version 1.1 items 11 and 13); rule API specs/mafia/api.md.
// Written before the build, 25 October 2026.
import { describe, expect, it } from 'vitest';
import { HOST, replay } from '../../../src/engine';
import { GameNight, NINE, exampleNight, randomNight, rolesSeen, type Role } from './helpers';
import { GAME_1, NIGHT_1, NIGHT_2, NIGHT_3 } from './flows';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** [m, v]: Mafia who are in, others who are in (MAF-040), from each player's own view of their role. */
const mv = (g: GameNight) => {
  const roles = Object.fromEntries((g.room.players as string[]).map((p) => [p, g.pv(p).me.role]));
  const m = g.room.in.filter((p: string) => roles[p] === 'mafia').length;
  return [m, g.room.in.length - m];
};

describe('MAF-040 the winner check: worked example 1 (9 players, 2 Mafia → the Village wins)', () => {
  it('night 1 Kabir out (2, 6); day 1 Om out (2, 5); night 2 saved; day 2 Zoya out (1, 5); night 3 Meena out (1, 4); day 3 Arjun out (0, 4) → the Village wins', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    for (const m of NIGHT_1) g.must(m);
    expect(mv(g)).toEqual([2, 6]);
    g.voteOut('Om');
    expect(mv(g)).toEqual([2, 5]);
    g.startNight();
    for (const m of NIGHT_2) g.must(m);
    expect(g.room.morning.out).toBeNull();
    g.voteOut('Zoya');
    expect(mv(g)).toEqual([1, 5]);
    g.startNight();
    for (const m of NIGHT_3) g.must(m);
    expect(mv(g)).toEqual([1, 4]);
    expect(g.room.step).toBe('day');
    g.voteOut('Arjun');
    expect(g.room).toMatchObject({ step: 'gameOver', winner: 'village', caught: 2 });
    expect(g.room.roles).toEqual(rolesSeen(g));
    expect(g.room.tally).toEqual({ village: 1, mafia: 0 });
    expect(g.moves()).toEqual(GAME_1);
  });
});

describe('MAF-040 worked example 2 (6 players, 1 Mafia → the Mafia win)', () => {
  it('night 1 out (1, 4); day 1 a Villager out (1, 3); night 2 out (1, 2); day 2 a Villager out (1, 1) → the Mafia win', () => {
    const deal: Record<string, Role> = { Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'villager', Dev: 'police' };
    const g = new GameNight({ deals: { 1: deal } }).start(NINE.slice(0, 6), 1).dealAll();
    g.night({ Arjun: 'Riya', Meena: 'Meena' });
    expect(mv(g)).toEqual([1, 4]);
    g.voteOut('Kabir');
    expect(mv(g)).toEqual([1, 3]);
    expect(g.room.step).toBe('nightStart');
    g.night({ Arjun: 'Zoya', Meena: 'Dev' });
    expect(g.room.morning.out).toBe('Zoya');
    expect(mv(g)).toEqual([1, 2]);
    expect(g.room.step).toBe('day');
    g.voteOut('Dev');
    expect(g.room).toMatchObject({ step: 'gameOver', winner: 'mafia' });
    expect(g.room.tally).toEqual({ village: 0, mafia: 1 });
  });
  it('the night can end the game: the Mafia win at once after the night (m ≥ v)', () => {
    // 5 players, 1 Mafia: night 1 out (1, 3), day 1 a Villager out (1, 2), night 2 out (1, 1) → the Mafia win after the night.
    const deal: Record<string, Role> = { Riya: 'villager', Arjun: 'mafia', Meena: 'villager', Kabir: 'villager', Zoya: 'villager' };
    const g = new GameNight({ deals: { 1: deal } }).start(NINE.slice(0, 5), 1).dealAll();
    g.night({ Arjun: 'Riya' });
    g.voteOut('Kabir');
    g.night({ Arjun: 'Zoya' });
    expect(g.room).toMatchObject({ step: 'gameOver', winner: 'mafia' });
    expect(g.room.morning.out).toBe('Zoya');
  });
});

describe('MAF-041 leavers and the winner (items 11, 13)', () => {
  it('a day leave counts as out at once: the last Mafia leaving → the Village wins; the leaver\'s role is shown only at game over', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    for (const m of NIGHT_1) g.must(m);
    g.voteOut('Zoya').startNight();
    g.night();
    if (g.room.step !== 'day') throw new Error('the example should still be on day 2');
    expect(g.room.roles).toBeNull();
    g.leave('Arjun');
    expect(g.room).toMatchObject({ step: 'gameOver', winner: 'village' });
    expect(g.room.left).toEqual(['Arjun']);
    expect(g.room.roles.Arjun).toBe('mafia');
    expect(g.room.caught).toBe(1);
    expect(g.legal()).toContainEqual({ type: 'unleave', player: 'Arjun' });
    g.must({ type: 'unleave', player: 'Arjun' });
    expect(g.room).toMatchObject({ step: 'day', winner: null, roles: null, left: [] });
  });
  it('a night leave counts from step 4: two Villagers leave on night 1 of a 6-player game and the Mafia win after the night', () => {
    const deal: Record<string, Role> = { Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'villager', Dev: 'police' };
    const g = new GameNight({ deals: { 1: deal } }).start(NINE.slice(0, 6), 1).dealAll();
    g.startNight();
    g.leave('Riya');
    g.leave('Kabir');
    expect(g.room.step).toBe('night');
    g.night({ Arjun: 'Zoya', Meena: 'Meena' });
    // Zoya out (step 3), then Riya and Kabir leave (step 4): m 1, v 2 → on; the check counts the leavers as out.
    expect(g.room.left).toEqual(['Riya', 'Kabir']);
    expect(mv(g)).toEqual([1, 2]);
    expect(g.room.step).toBe('day');
    g.leave('Meena');
    expect(g.room).toMatchObject({ step: 'gameOver', winner: 'mafia' });
  });
});

describe('MAF-042 ending with no winner', () => {
  it('endGame: game over, no winner, every role shown; not in the tally but counted in games', () => {
    const g = exampleNight().dealAll();
    g.night();
    g.must({ type: 'endGame' });
    expect(g.room).toMatchObject({ step: 'gameOver', winner: null, games: 1, tally: { village: 0, mafia: 0 } });
    expect(Object.keys(g.room.roles).sort()).toEqual([...NINE].sort());
    g.must(g.legal().find((m) => m.type === 'start'));
    expect(g.room.games).toBe(2);
  });
  it('endEvening is legal at game over only; after it the game night is over and nothing is listed', () => {
    const g = exampleNight();
    expect(g.try({ type: 'endEvening' })).toBe(false);
    g.must({ type: 'endGame' }).must({ type: 'endEvening' });
    expect(g.room.step).toBe('ended');
    expect(g.rules.isOver(g.state)).toBe(true);
    expect(g.legal()).toEqual([]);
  });
});

describe('MAF-043 MAF-P6 whole random game nights (and MAF-P4)', () => {
  it('1,000 random game nights: each ends; each game has exactly one result; the tally adds up; replay gives the same state', () => {
    for (let i = 0; i < 1000; i++) {
      const { g, steps } = randomNight(`p6-${i}`);
      expect(g.rules.isOver(g.state), `p6-${i} did not end`).toBe(true);
      expect(g.rules.invariants(g.state)).toEqual([]);
      // Each game's result: the room view just before the next start / endEvening.
      const results = steps.filter((s) => s.ok && (s.move.type === 'start' || s.move.type === 'endEvening') && s.before.step === 'gameOver').map((s) => s.before);
      let village = 0, mafia = 0;
      for (const r of results) {
        if (r.winner === 'village') village++;
        else if (r.winner === 'mafia') mafia++;
        else expect(r.winner).toBeNull();
      }
      const final = g.room;
      expect(final.tally).toEqual({ village, mafia });
      expect(final.games).toBe(results.length);
      const re = replay(g.rules, g.match.setup, g.records);
      expect(re.ok, `p6-${i} replay`).toBe(true);
      if (re.ok) expect(re.value.state).toEqual(g.state);
    }
  });
  it('MAF-P4: "Mafia caught" never moves on a leave or its Undo, and only voted-out Mafia are caught', () => {
    for (let i = 0; i < 400; i++) {
      const { steps, deals } = randomNight(`p4-${i}`, { leaveEvery: 6 });
      for (const s of steps) {
        if (!s.ok) continue;
        if ((s.move.type === 'leave' || s.move.type === 'unleave') && s.after.step !== 'gameOver' && s.before.game === s.after.game) {
          expect(s.after.caught, `p4-${i} ${JSON.stringify(s.move)}`).toBe(s.before.caught);
        }
        if (s.after.step !== 'idle' && s.after.game > 0) {
          const deal = deals[s.after.game - 1]!;
          const caught = s.after.out.filter((o: any) => o.how === 'vote' && deal[o.player] === 'mafia').length;
          expect(s.after.caught, `p4-${i} caught`).toBe(caught);
        }
      }
    }
  });
  it('no move the rules forbid is accepted: picks of a disallowed name, a vote for a player who is out, a pick out of order, Deal again after the night started', () => {
    for (let i = 0; i < 200; i++) {
      const { steps, deals } = randomNight(`forbid-${i}`);
      for (const s of steps) {
        if (!s.ok) continue;
        const m = s.move, b = s.before;
        if (m.type === 'nightPick') {
          expect(b.step).toBe('night');
          expect(b.turn.player, `forbid-${i} pick out of order`).toBe(m.player);
          if (m.target !== null) expect(b.in).toContain(m.target);
          const deal = deals[b.game - 1]!;
          if (deal[m.player] === 'mafia' && b.in.includes(m.player)) expect(deal[m.target]).not.toBe('mafia');
          if (deal[m.player] === 'villager' && b.in.includes(m.player)) expect(m.target).not.toBe(m.player);
        }
        if (m.type === 'voteOut') expect(b.in).toContain(m.player);
        if (m.type === 'redeal') expect(b.step === 'deal' || (b.step === 'nightStart' && b.round === 1)).toBe(true);
      }
    }
  });
  it('the referee refuses junk at every step of a random game night', () => {
    const JUNK: any[] = [
      { type: 'nonsense' }, { type: 'start', players: ['A', 'B'], mafiaCount: 1 }, { type: 'nightPick', player: 'Nobody', target: 'Riya' },
      { type: 'voteOut', player: 'Nobody' }, { type: 'startNight', night: 99 }, { type: 'tie', players: ['Riya'] },
      { type: 'voteNobody', reason: 'bored' }, { type: 'addNext', name: '' }, { type: 'seen', player: 'Nobody' },
      { type: 'leave', player: 'Nobody' }, { type: 'unleave', player: 'Nobody' },
    ];
    for (let i = 0; i < 40; i++) {
      const { g, steps } = randomNight(`junk-${i}`);
      for (const s of steps.filter((_, j) => j % 7 === 0)) {
        // Re-create the state before this step by replay, then try every junk move on it.
        const at = g.records.findIndex((r: any) => r.move === s.move);
        if (at < 0) continue;
        const re = replay(g.rules, g.match.setup, g.records.slice(0, at));
        if (!re.ok) continue;
        for (const j of JUNK) expect(g.rules.apply(re.value.state, j, { by: HOST, at: 9e15 }).ok, `junk-${i} ${JSON.stringify(j)} at ${s.before.step}`).toBe(false);
      }
    }
  });
});
