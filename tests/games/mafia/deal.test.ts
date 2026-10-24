// Section 02, the deal (C3), and the rules part of MAF-003/MAF-004 (the Mafia count and `start`).
// specs/mafia/02-deal.md, 01-setup.md; rule API specs/mafia/api.md. Written before the build, 25 October 2026.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, HOST } from '../../../src/engine';
import {
  EXAMPLE_DEAL, GameNight, NINE, ROOM, baseRoles, exampleNight, mafiaCounts, oracleCounts, oracleDeal, rolesSeen, type Role,
} from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
const POOL = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om', 'Sunita', 'Neha', 'Imran', 'Priya', 'Farhan', 'Lata', 'Ravi', 'Asha', 'Gopal', 'Uma'];
const count = (deal: Record<string, Role>, role: Role) => Object.values(deal).filter((r) => r === role).length;

describe('MAF-003 the Mafia count (rules part, MF5)', () => {
  it('mafiaCounts gives the suggested count and the allowed counts for 5 to 16 players', () => {
    for (let n = 5; n <= 16; n++) expect(mafiaCounts(n), `${n} players`).toEqual(oracleCounts(n));
  });
  it('MAF-003 worked values: 9 → 1, 2, 3 (suggest 2); 6 → 1, 2; 5 → 1 only; 16 → 3, 4, 5 (suggest 4)', () => {
    expect(mafiaCounts(9)).toEqual({ suggested: 2, allowed: [1, 2, 3] });
    expect(mafiaCounts(6)).toEqual({ suggested: 1, allowed: [1, 2] });
    expect(mafiaCounts(5)).toEqual({ suggested: 1, allowed: [1] });
    expect(mafiaCounts(16)).toEqual({ suggested: 4, allowed: [3, 4, 5] });
    expect(mafiaCounts(7).suggested).toBe(1);
    expect(mafiaCounts(8).suggested).toBe(2);
    expect(mafiaCounts(11).suggested).toBe(2);
    expect(mafiaCounts(12).suggested).toBe(3);
    expect(mafiaCounts(15).suggested).toBe(3);
  });
});

describe('MAF-004 start (rules part)', () => {
  it('a new game night has no game: step idle, nothing listed (start is a detail move)', () => {
    const g = new GameNight();
    expect(g.room.step).toBe('idle');
    expect(g.room.game).toBe(0);
    expect(g.room.players).toEqual([]);
    expect(g.legal()).toEqual([]);
    expect(g.rules.detailMoves).toEqual(expect.arrayContaining(['start', 'tie', 'addNext']));
    expect(g.rules.id).toBe('mafia');
  });
  it('start is refused with fewer than 5 or more than 16 players, a name twice, an empty or 17-character name, or a count MAF-003 does not allow', () => {
    const g = new GameNight();
    const bad: any[] = [
      { players: NINE.slice(0, 4), mafiaCount: 1 },
      { players: POOL.slice(0, 17), mafiaCount: 4 },
      { players: [...NINE.slice(0, 8), 'Riya'], mafiaCount: 2 },
      { players: [...NINE.slice(0, 8), '   '], mafiaCount: 2 },
      { players: [...NINE.slice(0, 8), 'A'.repeat(17)], mafiaCount: 2 },
      { players: NINE, mafiaCount: 0 },
      { players: NINE, mafiaCount: 4 },
      { players: NINE.slice(0, 5), mafiaCount: 2 },
      { players: NINE.slice(0, 6), mafiaCount: 3 },
    ];
    for (const b of bad) expect(g.try({ type: 'start', ...b }), JSON.stringify(b)).toBe(false);
    expect(g.records).toHaveLength(0);
    expect(g.try({ type: 'start', players: [...NINE.slice(0, 8), 'A'.repeat(16)], mafiaCount: 3 })).toBe(true);
  });
  it('start opens the deal: game 1, players in seat order, "Player 1 of 9" for seat 0', () => {
    const g = exampleNight();
    expect(g.room).toMatchObject({ step: 'deal', game: 1, players: NINE, mafiaCount: 2, round: 0, games: 1, turn: { player: 'Riya', i: 1, of: 9 } });
    expect(g.room.in).toEqual(NINE);
  });
  it('start is refused during a game (only at idle and game over)', () => {
    const g = exampleNight();
    expect(g.try({ type: 'start', players: NINE, mafiaCount: 2 })).toBe(false);
  });
});

describe('MAF-010 dealing roles (MAF-P1)', () => {
  it('the deal is the scenario\'s shuffle of M mafia, doctor, police, villagers with the seed `${roles}:1`, in seat order', () => {
    fc.assert(fc.property(fc.integer({ min: 5, max: 16 }), fc.nat(), fc.string({ minLength: 1, maxLength: 12 }), (n, mi, seed) => {
      const allowed = oracleCounts(n).allowed;
      const m = allowed[mi % allowed.length]!;
      const players = POOL.slice(0, n);
      const g = new GameNight({ seed }).start(players, m);
      expect(rolesSeen(g)).toEqual(oracleDeal(seed, 1, players, m, []));
    }), { numRuns: 300 });
  });
  it('MAF-P1: exactly M mafia, one doctor and one police with 6 or more players (none with 5), the rest villagers', () => {
    for (let i = 0; i < 400; i++) {
      const r = createRng(`p1-${i}`);
      const n = 5 + r.int(12);
      const allowed = oracleCounts(n).allowed;
      const m = allowed[r.int(allowed.length)]!;
      const g = new GameNight({ seed: `p1-${i}` }).start(POOL.slice(0, n), m);
      const deal = rolesSeen(g);
      expect(count(deal, 'mafia')).toBe(m);
      expect(count(deal, 'doctor')).toBe(n >= 6 ? 1 : 0);
      expect(count(deal, 'police')).toBe(n >= 6 ? 1 : 0);
      expect(count(deal, 'villager')).toBe(n - m - (n >= 6 ? 2 : 0));
      expect(Object.keys(deal).sort()).toEqual(POOL.slice(0, n).sort());
    }
  });
  it('MAF-P1: the same seeds give the same deal', () => {
    for (let i = 0; i < 50; i++) {
      const a = new GameNight({ seed: `same-${i}` }).start(NINE, 2);
      const b = new GameNight({ seed: `same-${i}` }).start(NINE, 2);
      expect(rolesSeen(b)).toEqual(rolesSeen(a));
    }
  });
  it('baseRoles (the oracle) reads MAF-010: 9 players, 2 Mafia', () => {
    expect(baseRoles(9, 2)).toEqual(['mafia', 'mafia', 'doctor', 'police', 'villager', 'villager', 'villager', 'villager', 'villager']);
    expect(baseRoles(5, 1)).toEqual(['mafia', 'villager', 'villager', 'villager', 'villager']);
  });
});

/** Plays `games` games in one game night, each ended at once (End the game, then Play again or a new start). */
function nightOfGames(seed: string, games: number, pick: (k: number, r: ReturnType<typeof createRng>) => { players: string[]; m: number }) {
  const g = new GameNight({ seed });
  const r = createRng(`games-${seed}`);
  const deals: Record<string, Role>[] = [];
  for (let k = 1; k <= games; k++) {
    const { players, m } = pick(k, r);
    g.must({ type: 'start', players, mafiaCount: m });
    const deal = rolesSeen(g);
    expect(deal, `game ${k} of ${seed}`).toEqual(oracleDeal(seed, k, players, m, deals));
    deals.push(deal);
    g.must({ type: 'endGame' });
  }
  return deals;
}

describe('MAF-010 streaks (item 16): nobody Mafia three games running', () => {
  it('over 300 game nights of 6 games with 5 to 7 players, each deal is the scenario\'s (with :r1, :r2 …) and nobody is mafia 3 games running', () => {
    let redone = 0;
    for (let i = 0; i < 300; i++) {
      const seed = `streak-${i}`;
      const deals = nightOfGames(seed, 6, (_k, r) => {
        const n = 5 + r.int(3);
        // Sometimes a different set of players, so a player not dealt breaks a streak.
        const players = r.int(4) === 0 ? POOL.slice(1, 1 + n) : POOL.slice(0, n);
        return { players, m: oracleCounts(n).allowed[r.int(oracleCounts(n).allowed.length)]! };
      });
      for (let k = 2; k < deals.length; k++) {
        for (const p of Object.keys(deals[k]!)) {
          const three = deals[k]![p] === 'mafia' && deals[k - 1]![p] === 'mafia' && deals[k - 2]![p] === 'mafia';
          expect(three, `${seed}: ${p} mafia in games ${k - 1}, ${k}, ${k + 1}`).toBe(false);
        }
      }
      // Count the deals where the first shuffle would have made a streak (so the rule was exercised).
      deals.forEach((d, k) => {
        if (k < 2) return;
        const first = oracleDeal(seed, k + 1, Object.keys(d), count(d, 'mafia'), []);
        if (JSON.stringify(first) !== JSON.stringify(d)) redone++;
      });
    }
    expect(redone, 'the streak rule changed at least 20 deals').toBeGreaterThanOrEqual(20);
  });
  it('a game ended early still counts as one of "the two games before" (item 16)', () => {
    // nightOfGames ends every game with endGame, so the check above already covers it; this one names it.
    const deals = nightOfGames('ended-early', 3, () => ({ players: NINE.slice(0, 5), m: 1 }));
    const mafia = (d: Record<string, Role>) => Object.keys(d).find((p) => d[p] === 'mafia');
    expect(!(mafia(deals[0]!) === mafia(deals[1]!) && mafia(deals[1]!) === mafia(deals[2]!))).toBe(true);
  });
});

describe('MAF-010 the deal pass (rules part, item 26)', () => {
  it('seen goes in seat order from seat 0: only the player whose turn it is; the last seen opens night 1', () => {
    const g = exampleNight();
    expect(g.try({ type: 'seen', player: 'Arjun' })).toBe(false);
    expect(g.legal().filter((m) => m.type === 'seen')).toEqual([{ type: 'seen', player: 'Riya' }]);
    NINE.forEach((p, i) => {
      expect(g.room.turn).toEqual({ player: p, i: i + 1, of: 9 });
      g.must({ type: 'seen', player: p });
    });
    expect(g.room.step).toBe('nightStart');
    expect(g.room.round).toBe(1);
    expect(g.room.turn).toBeNull();
    expect(g.legal()).toContainEqual({ type: 'startNight', night: 1 });
    expect(g.try({ type: 'seen', player: 'Riya' })).toBe(false);
  });
});

describe('MAF-H3 the deal override', () => {
  it('config.deals[1] gives game 1 exactly the example deal', () => {
    expect(rolesSeen(exampleNight())).toEqual(EXAMPLE_DEAL);
  });
  it('an override that does not match the players or the counts is ignored: the seed deals', () => {
    const wrongs: Record<string, Role>[] = [
      { ...EXAMPLE_DEAL, Kabir: 'mafia' },                       // 3 mafia for M = 2
      { ...EXAMPLE_DEAL, Riya: 'doctor' },                       // two doctors
      Object.fromEntries(Object.entries(EXAMPLE_DEAL).filter(([p]) => p !== 'Neha')) as Record<string, Role>,   // a player missing
      { ...EXAMPLE_DEAL, Imran: 'villager' },                    // a player too many
    ];
    for (const w of wrongs) {
      const g = new GameNight({ deals: { 1: w } }).start(NINE, 2);
      expect(rolesSeen(g)).toEqual(oracleDeal('mafia-example', 1, NINE, 2, []));
    }
  });
  it('the override is for its game index only, and not for a redeal', () => {
    const g = exampleNight();
    g.must({ type: 'redeal' });
    expect(rolesSeen(g)).toEqual(oracleDeal('mafia-example', 1, NINE, 2, [], 1));
    const h = new GameNight({ deals: { 2: EXAMPLE_DEAL } }).start(NINE, 2);
    const first = rolesSeen(h);
    expect(first).toEqual(oracleDeal('mafia-example', 1, NINE, 2, []));
    h.must({ type: 'endGame' }).must({ type: 'start', players: NINE, mafiaCount: 2 });
    expect(rolesSeen(h)).toEqual(EXAMPLE_DEAL);
  });
});

describe('MAF-011 / MAF-015 what each player\'s own view says (rules part)', () => {
  it('each player sees only their own role; a Mafia also sees the other Mafia (seat order); others no partners', () => {
    const g = exampleNight();
    expect(g.pv('Arjun').me).toEqual({ role: 'mafia', partners: ['Zoya'] });
    expect(g.pv('Zoya').me).toEqual({ role: 'mafia', partners: ['Arjun'] });
    expect(g.pv('Meena').me).toEqual({ role: 'doctor', partners: [] });
    expect(g.pv('Dev').me).toEqual({ role: 'police', partners: [] });
    expect(g.pv('Riya').me).toEqual({ role: 'villager', partners: [] });
    expect(g.pv('Imran').me).toBeNull();
  });
  it('with 3 Mafia, partners are the other two in seat order', () => {
    const twelve = [...NINE, 'Imran', 'Priya', 'Farhan'];
    const deal: Record<string, Role> = Object.fromEntries(twelve.map((p) => [p, 'villager'])) as Record<string, Role>;
    Object.assign(deal, { Om: 'mafia', Arjun: 'mafia', Farhan: 'mafia', Meena: 'doctor', Dev: 'police' });
    const g = new GameNight({ deals: { 1: deal } }).start(twelve, 3);
    expect(g.pv('Om').me.partners).toEqual(['Arjun', 'Farhan']);
    expect(g.pv('Farhan').me.partners).toEqual(['Arjun', 'Om']);
  });
});

describe('MAF-014 deal again (before night 1 only)', () => {
  it('redeal deals with `${roles}:1:d1`, then :d2, and the deal starts again at seat 0', () => {
    const g = new GameNight({ seed: 'redeal-1' }).start(NINE, 2);
    g.must({ type: 'seen', player: 'Riya' }).must({ type: 'seen', player: 'Arjun' });
    g.must({ type: 'redeal' });
    expect(rolesSeen(g)).toEqual(oracleDeal('redeal-1', 1, NINE, 2, [], 1));
    expect(g.room.turn).toEqual({ player: 'Riya', i: 1, of: 9 });
    expect(g.room.step).toBe('deal');
    g.must({ type: 'redeal' });
    expect(rolesSeen(g)).toEqual(oracleDeal('redeal-1', 1, NINE, 2, [], 2));
  });
  it('redeal is listed in the deal and on N0 of night 1, and refused from "Start the night" on (MF15)', () => {
    const g = exampleNight();
    expect(g.legal()).toContainEqual({ type: 'redeal' });
    g.dealAll();
    expect(g.legal()).toContainEqual({ type: 'redeal' });
    g.startNight();
    expect(g.legal()).not.toContainEqual({ type: 'redeal' });
    expect(g.try({ type: 'redeal' })).toBe(false);
  });
  it('a redeal of game 3 keeps the streak rule (seeds :d1, then :d1:r1 …)', () => {
    for (let i = 0; i < 100; i++) {
      const seed = `redeal-streak-${i}`;
      const g = new GameNight({ seed });
      const deals: Record<string, Role>[] = [];
      const five = NINE.slice(0, 5);
      for (let k = 1; k <= 2; k++) { g.must({ type: 'start', players: five, mafiaCount: 1 }); deals.push(rolesSeen(g)); g.must({ type: 'endGame' }); }
      g.must({ type: 'start', players: five, mafiaCount: 1 }).must({ type: 'redeal' });
      expect(rolesSeen(g)).toEqual(oracleDeal(seed, 3, five, 1, deals, 1));
    }
  });
});

describe('MAF-052 item 12: a leave during the deal deals again without them', () => {
  it('a leave in the deal takes Kabir out of the game at once; only redeal is legal; the redeal deals the 8 others from seat 0', () => {
    const g = new GameNight({ seed: 'deal-leave' }).start(NINE, 2);
    g.must({ type: 'seen', player: 'Riya' });
    g.leave('Kabir');
    expect(g.legal()).toEqual([{ type: 'redeal' }]);
    expect(g.try({ type: 'seen', player: 'Arjun' })).toBe(false);
    g.must({ type: 'redeal' });
    const eight = NINE.filter((p) => p !== 'Kabir');
    expect(g.room.players).toEqual(eight);
    expect(g.room.left).toEqual([]);
    expect(rolesSeen(g)).toEqual(oracleDeal('deal-leave', 1, eight, 2, [], 1));
    expect(g.room.turn).toEqual({ player: 'Riya', i: 1, of: 8 });
    expect(g.pv('Kabir').me).toBeNull();
  });
  it('with 5 players a leave in the deal is refused and not listed ("Mafia needs at least 5 players.")', () => {
    const g = new GameNight().start(NINE.slice(0, 5), 1);
    expect(g.legal().some((m) => m.type === 'leave')).toBe(false);
    expect(g.try({ type: 'leave', player: 'Kabir' })).toBe(false);
    const six = new GameNight().start(NINE.slice(0, 6), 1);
    expect(six.legal()).toContainEqual({ type: 'leave', player: 'Kabir' });
  });
  it('PO 16: Undo after a deal leave (unleave once the redeal is done) deals again with Kabir back in his seat, next :dN seed, Player 1 of 9', () => {
    const g = new GameNight({ seed: 'deal-undo' }).start(NINE, 2);
    g.leave('Kabir');
    expect(g.try({ type: 'unleave', player: 'Kabir' })).toBe(false);
    g.must({ type: 'redeal' });
    expect(g.legal()).toContainEqual({ type: 'unleave', player: 'Kabir' });
    g.must({ type: 'unleave', player: 'Kabir' });
    expect(g.room.players).toEqual(NINE);
    expect(g.room.mafiaCount).toBe(2);
    expect(g.room.turn).toEqual({ player: 'Riya', i: 1, of: 9 });
    expect(rolesSeen(g)).toEqual(oracleDeal('deal-undo', 1, NINE, 2, [], 2));
    g.must({ type: 'seen', player: 'Riya' });
    g.leave('Om');
    g.must({ type: 'redeal' }).must({ type: 'seen', player: 'Riya' });
    expect(g.try({ type: 'unleave', player: 'Om' })).toBe(false);
  });
  it('PO 16: after a deal leave the Mafia count is kept unless the new count of players forbids it, then the suggestion', () => {
    const six = NINE.slice(0, 6);
    const g = new GameNight({ seed: 'deal-count' }).start(six, 2);
    g.leave('Zoya');
    g.must({ type: 'redeal' });
    const five = six.filter((p) => p !== 'Zoya');
    expect(g.room).toMatchObject({ players: five, mafiaCount: 1 });
    expect(rolesSeen(g)).toEqual(oracleDeal('deal-count', 1, five, 1, [], 1));
    g.must({ type: 'unleave', player: 'Zoya' });
    expect(g.room).toMatchObject({ players: six, mafiaCount: 2 });
    expect(rolesSeen(g)).toEqual(oracleDeal('deal-count', 1, six, 2, [], 2));
  });
});

describe('MAF-H1 legalMoves lists complete moves; the room view holds no seed', () => {
  it('legalMoves for the host lists complete moves only (no detail move)', () => {
    const g = exampleNight();
    for (const m of g.rules.legalMoves(g.state, HOST) as any[]) expect(['start', 'tie', 'addNext']).not.toContain(m.type);
    expect(g.room).not.toHaveProperty('seeds');
    expect(JSON.stringify(g.rules.view(g.state, ROOM))).not.toContain('mafia-example');
  });
});
