// Version 1.3 (owner, 26 October 2026; MF21): why a name can't be picked. The rules give the reason for N2's private
// line as `job.names[].why` (specs/mafia/api.md, "`why`"; specs/mafia/03-night.md, MAF-022 Version 1.3 and the
// tester's reading). `why` is null exactly when `allowed` is true; otherwise the first reason that applies:
// you · out · partner · lastNight · selfUsed · checked { night, mafia } · checkDone.
// Example deal (MAF-H3): Mafia Arjun and Zoya; Doctor Meena; Police Dev; Villagers Riya, Kabir, Om, Sunita, Neha.
// Written before the build, 26 October 2026.
import { describe, expect, it } from 'vitest';
import { HOST, play } from '../../../src/engine';
import { GameNight, NINE, exampleNight, randomNight } from './helpers';
import { NIGHT_1, NIGHT_2 } from './flows';

/* eslint-disable @typescript-eslint/no-explicit-any */
const job = (g: GameNight) => g.pv(g.room.turn.player).job;
/** Every name's `why` on the current turn, by name (the field must be there, null or a reason). */
function whys(g: GameNight): Record<string, any> {
  const out: Record<string, any> = {};
  for (const n of job(g).names as any[]) {
    expect(n, `${g.room.turn.player} sees ${n.player}: a \`why\` field (api.md, Version 1.3)`).toHaveProperty('why');
    out[n.player] = n.why;
  }
  return out;
}
/** What `whys` must be: null for every name not listed. */
const want = (reasons: Record<string, any>, names: readonly string[] = NINE) =>
  Object.fromEntries(names.map((p) => [p, reasons[p] ?? null]));
const YOU = { kind: 'you' }, OUT = { kind: 'out' }, PARTNER = { kind: 'partner' }, LAST = { kind: 'lastNight' };
const USED = { kind: 'selfUsed' }, DONE = { kind: 'checkDone' };
const checked = (night: number, mafia: boolean) => ({ kind: 'checked', night, mafia });

function playPicks(g: GameNight, list: any[], stopBefore = list.length) {
  for (const m of list.slice(0, stopBefore)) {
    expect(g.room.turn?.player, `turn before ${m.player}'s pick`).toBe(m.player);
    g.must(m);
  }
}
/** Plays the turns of the current night up to (not including) `who`'s, each with the given pick or the first allowed. */
function upTo(g: GameNight, who: string, picks: Record<string, string> = {}) {
  for (let i = 0; i < 20 && g.room.turn?.player !== who; i++) g.pickNow(picks[g.room.turn.player]);
  expect(g.room.turn?.player).toBe(who);
}

describe('MAF-022 Version 1.3: `why` on night 1 of the worked example', () => {
  it('each role on night 1: own name "you" (not the Doctor), a Mafia\'s partner "partner", the Doctor none; null exactly where allowed', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    const expected: Record<string, Record<string, any>> = {
      Riya: { Riya: YOU }, Arjun: { Arjun: YOU, Zoya: PARTNER }, Meena: {}, Kabir: { Kabir: YOU }, Zoya: { Zoya: YOU, Arjun: PARTNER },
      Dev: { Dev: YOU }, Om: { Om: YOU }, Sunita: { Sunita: YOU }, Neha: { Neha: YOU },
    };
    for (const m of NIGHT_1 as any[]) {
      expect(g.room.turn.player).toBe(m.player);
      expect(whys(g), `${m.player}'s names`).toEqual(want(expected[m.player]!));
      for (const n of job(g).names as any[]) expect(n.why === null, `${m.player} sees ${n.player}: why null iff allowed`).toBe(n.allowed);
      g.must(m);
    }
  });
  it('the Police after tonight\'s check: the checked name null (still allowed), own name "you", every other name "checkDone"', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 5);
    g.must({ type: 'check', player: 'Dev', target: 'Zoya' });
    expect(whys(g)).toEqual(want({ Riya: DONE, Arjun: DONE, Meena: DONE, Kabir: DONE, Dev: YOU, Om: DONE, Sunita: DONE, Neha: DONE }));
    expect(job(g).check).toEqual({ player: 'Zoya', mafia: true });
  });
  it('MAF-P2: the room view is the same with `why` (it is in the player\'s own job only); other players\' jobs are null', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 1);
    expect(JSON.stringify(g.room)).not.toMatch(/why|partner|checkDone|selfUsed|lastNight/);
    for (const p of NINE.filter((x) => x !== 'Arjun')) expect(g.pv(p).job, p).toBeNull();
  });
});

describe('MAF-022 to MAF-026 Version 1.3: `why` on later nights (out players, the Doctor, the Police\'s earlier checks)', () => {
  /** Night 2 of the worked example: Kabir out on night 1, Om voted out on day 1. Order Arjun, Meena, Kabir, Zoya, Dev, … */
  function night2() {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1);
    g.voteOut('Om').startNight();
    return g;
  }
  it('night 2: out players read "out" for every role; a ghost\'s own name reads "you"; Dev\'s night-1 check of Zoya reads checked night 1, Mafia', () => {
    const g = night2();
    expect(g.room.turn.player).toBe('Arjun');
    expect(whys(g), 'Arjun (Mafia)').toEqual(want({ Arjun: YOU, Kabir: OUT, Om: OUT, Zoya: PARTNER }));
    g.must(NIGHT_2[0]);
    // Meena (Doctor) protected herself on night 1: "last night" and "used" both fit her own name; selfUsed wins
    // (orchestrator's decision, 26 October).
    expect(whys(g), 'Meena (Doctor)').toEqual(want({ Meena: USED, Kabir: OUT, Om: OUT }));
    g.must(NIGHT_2[1]);
    expect(whys(g), 'Kabir (out: a ghost guess)').toEqual(want({ Kabir: YOU, Om: OUT }));
    g.must(NIGHT_2[2]);
    expect(whys(g), 'Zoya (Mafia)').toEqual(want({ Zoya: YOU, Kabir: OUT, Om: OUT, Arjun: PARTNER }));
    g.must(NIGHT_2[3]);
    expect(whys(g), 'Dev (Police)').toEqual(want({ Dev: YOU, Kabir: OUT, Om: OUT, Zoya: checked(1, true) }));
    g.must(NIGHT_2[4]);
    expect(whys(g), 'Om (out: a ghost guess)').toEqual(want({ Om: YOU, Kabir: OUT }));
  });
  it('night 3: the Doctor\'s last-night pick (Riya) "lastNight", her own name "selfUsed"; Dev: Zoya out wins over checked, Arjun checked night 2', () => {
    const g = night2();
    playPicks(g, NIGHT_2);
    g.voteOut('Zoya').startNight();
    expect(g.room.turn.player).toBe('Meena');
    expect(whys(g), 'Meena (Doctor)').toEqual(want({ Meena: USED, Riya: LAST, Kabir: OUT, Om: OUT, Zoya: OUT }));
    upTo(g, 'Dev');
    expect(whys(g), 'Dev (Police)').toEqual(want({ Dev: YOU, Kabir: OUT, Om: OUT, Zoya: OUT, Arjun: checked(2, true) }));
    g.must({ type: 'check', player: 'Dev', target: 'Sunita' });
    expect(whys(g), 'Dev after checking Sunita').toEqual(want({
      Dev: YOU, Kabir: OUT, Om: OUT, Zoya: OUT, Arjun: checked(2, true), Riya: DONE, Meena: DONE, Neha: DONE,
    }));
  });
  it('a Not Mafia check on an earlier night reads checked, mafia false; a protection two nights ago is no reason (night r − 1 only)', () => {
    // Night 1: the Mafia pick Kabir, the Doctor protects Riya, Dev checks Riya (Not Mafia): Kabir is out. Day 1: nobody.
    const g = exampleNight().dealAll();
    g.night({ Riya: 'Arjun', Arjun: 'Kabir', Meena: 'Riya', Kabir: 'Zoya', Zoya: 'Kabir', Dev: 'Riya', Om: 'Arjun', Sunita: 'Riya', Neha: 'Om' });
    expect(g.room.out).toEqual([{ player: 'Kabir', role: 'villager', how: 'night', round: 1 }]);
    g.nobody().startNight();
    // Night 2 (order Arjun, Meena, …): the Mafia pick Sunita, the Doctor protects Neha, Dev checks Neha: Sunita is out.
    upTo(g, 'Meena', { Arjun: 'Sunita' });
    expect(whys(g), 'Meena on night 2').toEqual(want({ Riya: LAST, Kabir: OUT }));
    g.pickNow('Neha');
    upTo(g, 'Dev', { Kabir: 'Riya', Zoya: 'Sunita' });
    expect(whys(g), 'Dev on night 2').toEqual(want({ Dev: YOU, Kabir: OUT, Riya: checked(1, false) }));
    g.must({ type: 'check', player: 'Dev', target: 'Neha' });
    expect(whys(g), 'Dev after checking Neha').toEqual(want({
      Dev: YOU, Kabir: OUT, Riya: checked(1, false), Arjun: DONE, Meena: DONE, Zoya: DONE, Om: DONE, Sunita: DONE,
    }));
    g.night({ Dev: 'Neha' });
    expect(g.room.out.map((o: any) => o.player)).toEqual(['Kabir', 'Sunita']);
    g.nobody().startNight();
    // Night 3 starts at Meena: Riya was protected on night 1, not night 2, so Riya may be picked; Neha may not.
    expect(g.room.turn.player).toBe('Meena');
    expect(whys(g), 'Meena on night 3').toEqual(want({ Neha: LAST, Kabir: OUT, Sunita: OUT }));
  });
  it('a Police with nobody left to check: every name has a reason (own "you", the rest "checked" with their night), none "checkDone"', () => {
    const six = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev'];
    const g = new GameNight({ deals: { 1: { Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'villager', Dev: 'police' } } }).start(six, 1).dealAll();
    const checks = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya'];
    for (let r = 1; r <= 5; r++) {
      const victim = r % 2 === 1 ? 'Riya' : 'Kabir';
      g.night({ Arjun: victim, Meena: victim, Dev: checks[r - 1]!, Riya: 'Arjun', Kabir: 'Arjun', Zoya: 'Arjun' });
      g.nobody();
    }
    g.startNight();
    expect(g.room.turn.player).toBe('Dev');
    expect(whys(g)).toEqual(want({
      Dev: YOU, Riya: checked(1, false), Arjun: checked(2, true), Meena: checked(3, false), Kabir: checked(4, false), Zoya: checked(5, false),
    }, six));
  });
});

/** The reason the scenario gives (first that applies), from what the views say and what happened this game. */
interface History { game: number; doctorPicks: Record<number, string | null>; checks: { player: string; night: number }[]; checkedThisTurn: boolean; turn: string }
function oracleWhy(room: any, me: any, j: any, player: string, name: string, h: History, roleOf: (p: string) => string): any {
  const outs = new Set((room.out as any[]).map((o) => o.player));
  const ghost = outs.has(player);
  const role = me.role;
  if (name === player && !(role === 'doctor' && !ghost)) return YOU;
  if (outs.has(name)) return OUT;
  if (ghost) return undefined;
  if (role === 'mafia' && (me.partners as string[]).includes(name)) return PARTNER;
  if (role === 'doctor') {
    const last = h.doctorPicks[room.round - 1];
    const used = Object.values(h.doctorPicks).includes(player);
    if (name === player && used) return USED;   // wins over lastNight (orchestrator's decision, 26 October)
    if (name === last) return LAST;
  }
  if (role === 'police') {
    const c = h.checks.find((x) => x.player === name && x.night < room.round);
    if (c) return checked(c.night, roleOf(name) === 'mafia');
    if (j.check && name !== j.check.player) return DONE;
  }
  return undefined;
}

describe('MAF-022 Version 1.3: `why` for 120 random game nights', () => {
  it('at every night turn, every name: null exactly when allowed, else the first reason that applies (the scenario\'s order)', () => {
    for (let i = 0; i < 120; i++) {
      const { g } = randomNight(`v13-why-${i}`, { games: 2 });
      let match: any = { setup: g.match.setup, records: [], state: g.rules.setup(g.match.setup) };
      const h: History = { game: 0, doctorPicks: {}, checks: [], checkedThisTurn: false, turn: '' };
      for (const r of g.records as any[]) {
        const room = g.rules.view(match.state, { kind: 'room' }) as any;
        if (room.game !== h.game) { h.game = room.game; h.doctorPicks = {}; h.checks = []; }
        const pv = (p: string) => g.rules.view(match.state, { kind: 'player', playerId: p }) as any;
        if (room.step === 'night' && room.turn) {
          const player = room.turn.player as string;
          if (h.turn !== `${room.game}:${room.round}:${player}`) { h.turn = `${room.game}:${room.round}:${player}`; h.checkedThisTurn = false; }
          const v = pv(player);
          const where = `v13-why-${i} game ${room.game} night ${room.round}: ${player} (${v.job.kind})`;
          for (const n of v.job.names as any[]) {
            expect(n, `${where} sees ${n.player}`).toHaveProperty('why');
            if (n.allowed) { expect(n.why, `${where} sees ${n.player} (allowed)`).toBeNull(); continue; }
            const w = oracleWhy(room, v.me, v.job, player, n.player, h, (p) => pv(p).me?.role);
            expect(w, `${where} sees ${n.player}: not allowed, so the scenario has a reason`).toBeDefined();
            expect(n.why, `${where} sees ${n.player}`).toEqual(w);
          }
          // What happened, for the next nights (a Doctor's or Police's pick while they are in).
          const outs = new Set((room.out as any[]).map((o) => o.player));
          const m = r.move;
          if ((m.type === 'nightPick' || m.type === 'check') && m.player === player && !outs.has(player)) {
            if (v.me.role === 'doctor' && m.type === 'nightPick') h.doctorPicks[room.round] = m.target;
            if (v.me.role === 'police' && m.target !== null && (m.type === 'check' || !h.checkedThisTurn)) {
              h.checks.push({ player: m.target, night: room.round });
            }
            if (m.type === 'check') h.checkedThisTurn = true;
          }
        }
        const next = play(g.rules, match, r.move, { by: HOST, at: r.at });
        if (!next.ok) throw new Error(`v13-why-${i}: replay refused ${JSON.stringify(r.move)}`);
        match = next.value;
      }
    }
  });
});
