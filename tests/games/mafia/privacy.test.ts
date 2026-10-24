// MAF-016 / MAF-P2 (C3): the room sees nothing secret. Rules part: the room view (what room screens may show) never
// differs with the roles, the night picks or the Police's answers, and each player's own view holds only their own
// secrets. The screens part is tests/browser/mafia-c3.spec.ts. specs/mafia/02-deal.md (item 31); rule API specs/mafia/api.md.
// Written before the build, 25 October 2026.
import { describe, expect, it } from 'vitest';
import { HOST, play } from '../../../src/engine';
import { EXAMPLE_DEAL, GameNight, NINE, ROOM, asPlayer, randomNight, type Role } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ROOM_FIELDS = ['step', 'game', 'players', 'mafiaCount', 'round', 'turn', 'in', 'out', 'left', 'leaving', 'caught', 'morning', 'tied', 'vote', 'winner', 'roles', 'tally', 'games', 'next'].sort();
const PLAYER_EXTRA = ['me', 'job', 'checks'];
/** Another deal of the same 9 players: Mafia Riya and Om; Doctor Sunita; Police Neha. Kabir is a Villager in both. */
const DEAL_B: Record<string, Role> = {
  Riya: 'mafia', Arjun: 'villager', Meena: 'villager', Kabir: 'villager', Zoya: 'villager', Dev: 'villager', Om: 'mafia',
  Sunita: 'doctor', Neha: 'police',
};

describe('MAF-016 the room view holds exactly the room\'s fields', () => {
  it('room and host views have exactly the API\'s fields; a player\'s view adds exactly me, job and checks', () => {
    const g = new GameNight({ deals: { 1: EXAMPLE_DEAL } });
    expect(Object.keys(g.room).sort()).toEqual(ROOM_FIELDS);
    g.start(NINE, 2);
    expect(Object.keys(g.room).sort()).toEqual(ROOM_FIELDS);
    expect(g.rules.view(g.state, { kind: 'host' })).toEqual(g.room);
    expect(Object.keys(g.pv('Riya')).sort()).toEqual([...ROOM_FIELDS, ...PLAYER_EXTRA].sort());
  });
});

describe('MAF-P2 the room view never differs with the roles', () => {
  it('two deals of the same players: the room view is the same after every move of the deal and night 1 until its last pick', () => {
    const a = new GameNight({ deals: { 1: EXAMPLE_DEAL } }).start(NINE, 2);
    const b = new GameNight({ deals: { 1: DEAL_B } }).start(NINE, 2);
    expect(b.room).toEqual(a.room);
    for (const p of NINE) { a.must({ type: 'seen', player: p }); b.must({ type: 'seen', player: p }); expect(b.room).toEqual(a.room); }
    a.startNight(); b.startNight();
    expect(b.room).toEqual(a.room);
    for (let i = 0; i < 8; i++) {
      // Each picks what their own role allows: the first allowed name (different names in the two games).
      a.pickNow(); b.pickNow();
      expect(b.room, `after turn ${i + 1}`).toEqual(a.room);
    }
  });
  it('for 300 random games, at every night turn the room view after the pick is the same whichever allowed name is picked', () => {
    for (let i = 0; i < 300; i++) {
      const { g } = randomNight(`p2-branch-${i}`, { games: 1 });
      // Walk the recorded moves again; at each night pick, branch on every allowed target.
      let match: any = { setup: g.match.setup, records: [], state: g.rules.setup(g.match.setup) };
      for (const r of g.records as any[]) {
        if (r.move.type === 'nightPick') {
          const legal = (g.rules.legalMoves(match.state, HOST) as any[]).filter((x) => x.type === 'nightPick');
          const rooms = legal.map((x) => {
            const res = play(g.rules, match, x, { by: HOST, at: r.at });
            if (!res.ok) throw new Error(`a listed pick was refused: ${JSON.stringify(x)}`);
            const v = g.rules.view(res.value.state, ROOM) as any;
            return v.step === 'night' ? v : null;      // after the last pick the night resolves: that may differ
          }).filter(Boolean);
          for (const v of rooms) expect(v, `p2-branch-${i}`).toEqual(rooms[0]);
        }
        const next = play(g.rules, match, r.move, { by: HOST, at: r.at });
        if (!next.ok) throw new Error(`replay refused ${JSON.stringify(r.move)}`);
        match = next.value;
      }
    }
  });
  it('before game over the room view never holds a role but those of players who are out (no left player\'s role, no "roles")', () => {
    for (let i = 0; i < 300; i++) {
      const { steps, deals } = randomNight(`p2-roles-${i}`, { leaveEvery: 8 });
      for (const s of steps) {
        const v = s.after;
        if (v.step === 'gameOver' || v.step === 'ended' || v.step === 'idle') continue;
        expect(v.roles, `p2-roles-${i}`).toBeNull();
        const outs = new Set(v.out.map((o: any) => o.player));
        for (const l of v.left) expect(outs.has(l), `p2-roles-${i}: ${l} left but shown as out`).toBe(false);
        for (const o of v.out) expect(o.role).toBe(deals[v.game - 1]![o.player]);
        if (v.vote) expect(outs.has(v.vote.player)).toBe(true);
      }
    }
  });
  it('the room view never holds the seed, a night pick or a Police answer (searched as text over 200 random game nights)', () => {
    for (let i = 0; i < 200; i++) {
      const { steps } = randomNight(`p2-text-${i}`);
      for (const s of steps) {
        // The story is free text (MAFS-14 says "check"), so it is left out of the word search.
        const text = JSON.stringify({ ...s.after, morning: s.after.morning && { ...s.after.morning, story: '' } });
        expect(text).not.toContain(`roles-p2-text-${i}`);
        expect(text).not.toMatch(/target|pick|check|Not Mafia|protect/i);
      }
    }
  });
});

describe('MAF-P2 each player\'s own view', () => {
  it('a Villager in both deals sees exactly the same through the deal and night 1 (no other role leaks to them)', () => {
    const a = new GameNight({ deals: { 1: EXAMPLE_DEAL } }).start(NINE, 2);
    const b = new GameNight({ deals: { 1: DEAL_B } }).start(NINE, 2);
    const steps = () => [a, b].map((g) => g.pv('Kabir'));
    expect(steps()[1]).toEqual(steps()[0]);
    for (const p of NINE) { a.must({ type: 'seen', player: p }); b.must({ type: 'seen', player: p }); expect(steps()[1]).toEqual(steps()[0]); }
    a.startNight(); b.startNight();
    for (let i = 0; i < 8; i++) { a.pickNow(); b.pickNow(); const [x, y] = steps(); expect(y, `turn ${i + 1}`).toEqual(x); }
  });
  it('only the Police\'s own view holds checks; a Mafia\'s holds its partners; nobody else\'s holds a role but their own', () => {
    for (let i = 0; i < 100; i++) {
      const g = new GameNight({ seed: `views-${i}` }).start(NINE, 2).dealAll();
      g.startNight();
      while (g.room.step === 'night') g.pickNow();
      for (const p of NINE) {
        const v = g.pv(p);
        if (v.me.role !== 'police') expect(v.checks, p).toEqual([]);
        if (v.me.role !== 'mafia') expect(v.me.partners, p).toEqual([]);
        expect(v.job).toBeNull();
      }
    }
  });
  it('a viewer who is not a player of this game sees the room view plus me null, job null, checks []', () => {
    const g = new GameNight({ deals: { 1: EXAMPLE_DEAL } }).start(NINE, 2);
    expect(g.rules.view(g.state, asPlayer('Imran'))).toEqual({ ...g.room, me: null, job: null, checks: [] });
  });
});
