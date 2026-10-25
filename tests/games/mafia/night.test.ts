// Section 03, the night (C3): night order, every role's night job, the night's resolution, night leaves; MAF-P3.
// specs/mafia/03-night.md (with Version 1.1 items 4, 8, 9, 10, 11, 26, 31); rule API specs/mafia/api.md.
// Example deal (MAF-H3): Mafia Arjun and Zoya; Doctor Meena; Police Dev; Villagers Riya, Kabir, Om, Sunita, Neha.
// Written before the build, 25 October 2026.
import { describe, expect, it } from 'vitest';
import { HOST, createRng, play, replay } from '../../../src/engine';
import {
  EXAMPLE_SEED, GameNight, NINE, QUIET_NIGHT, exampleNight, oracleNightOrder, oracleTarget, randomNight, readMafiaNight,
  savedOf, type Role,
} from './helpers';
import { FLOWS, NIGHT_1, NIGHT_2, NIGHT_3, savedFlow } from './flows';

/* eslint-disable @typescript-eslint/no-explicit-any */
const others = (except: string[]) => NINE.filter((p) => !except.includes(p));
const job = (g: GameNight) => g.pv(g.room.turn.player).job;
const allowed = (g: GameNight) => (job(g).names as any[]).filter((n) => n.allowed).map((n) => n.player);
const listedTargets = (g: GameNight) => g.legal().filter((m) => m.type === 'nightPick').map((m) => m.target);
const tagsOf = (g: GameNight, name: string) => (job(g).names as any[]).find((n) => n.player === name)?.tags;
/** Version 1.2 A (owner, 25 October): the tags every role sees: "you" on their own name, "out" on players who are out. */
const publicTags = (g: GameNight, name: string) =>
  name === g.room.turn.player ? ['you'] : (g.room.out as any[]).some((o) => o.player === name) ? ['out'] : [];

/** Plays a flow's picks, checking each turn is that player's. */
function playPicks(g: GameNight, list: any[], stopBefore = list.length) {
  for (const m of list.slice(0, stopBefore)) {
    expect(g.room.turn?.player, `turn before ${m.player}'s pick`).toBe(m.player);
    g.must(m);
  }
}
/** The example game to the start of night 2 (night 1 as flows.ts, Om voted out on day 1). */
function toNight2() {
  const g = exampleNight().dealAll();
  g.startNight();
  playPicks(g, NIGHT_1);
  g.voteOut('Om').startNight();
  return g;
}
function toNight3() {
  const g = toNight2();
  playPicks(g, NIGHT_2);
  g.voteOut('Zoya').startNight();
  return g;
}

describe('MAF-020 night begins (rules part)', () => {
  it('after the last seen: step nightStart, round 1; startNight { night: 1 } is listed, any other night number refused', () => {
    const g = exampleNight().dealAll();
    expect(g.room).toMatchObject({ step: 'nightStart', round: 1, turn: null });
    expect(g.legal()).toContainEqual({ type: 'startNight', night: 1 });
    expect(g.try({ type: 'startNight', night: 2 })).toBe(false);
    expect(g.try({ type: 'nightPick', player: 'Riya', target: 'Arjun' })).toBe(false);
    g.startNight();
    expect(g.room.step).toBe('night');
    expect(g.room.round).toBe(1);
  });
});

describe('MAF-021 the night pass: order and "i of T"', () => {
  it('game 1 night 1 starts at seat 0, night 2 at seat 1; out players keep their turn (ghost guess); i = turns taken + 1, T = 9', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    NIGHT_1.forEach((m: any, i) => {
      expect(g.room.turn).toEqual({ player: m.player, i: i + 1, of: 9 });
      g.must(m);
    });
    expect(NIGHT_1.map((m: any) => m.player)).toEqual(oracleNightOrder(NINE, 1, 1));
    g.voteOut('Om').startNight();
    const order = g.night();
    expect(order).toEqual(['Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om', 'Sunita', 'Neha', 'Riya']);
    expect(order).toEqual(oracleNightOrder(NINE, 1, 2));
  });
  it('game 2 night 1 starts at seat 1 ((k − 1) + (r − 1))', () => {
    const g = exampleNight();
    g.must({ type: 'endGame' }).must({ type: 'start', players: NINE, mafiaCount: 2 }).dealAll();
    expect(g.night()).toEqual(oracleNightOrder(NINE, 2, 1));
    expect(oracleNightOrder(NINE, 2, 1)[0]).toBe('Arjun');
  });
  it('a player who leaves before their turn is skipped and T drops by one from the next pass screen (item 11)', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 2);
    expect(g.room.turn).toEqual({ player: 'Meena', i: 3, of: 9 });
    g.leave('Neha');
    expect(g.room.turn).toEqual({ player: 'Meena', i: 3, of: 8 });
    const rest = g.night();
    expect(rest).toEqual(['Meena', 'Kabir', 'Zoya', 'Dev', 'Om', 'Sunita']);
  });
  it('the night order and T never depend on the roles (MAF-P7, rules part)', () => {
    for (let i = 0; i < 30; i++) {
      const orders = ['a', 'b'].map((v) => {
        const g = new GameNight({ seed: `order-${i}-${v}` }).start(NINE, 2).dealAll();
        g.startNight();
        const turns: any[] = [];
        while (g.room.step === 'night') { turns.push(g.room.turn); g.pickNow(); }
        return turns;
      });
      expect(orders[1]).toEqual(orders[0]);
    }
  });
});

describe('MAF-022 item 4: one names box for every role', () => {
  it('every night job lists every player dealt who has not left and is not leaving, in seat order, whatever the role', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    for (const m of NIGHT_1 as any[]) {
      expect(job(g).names.map((n: any) => n.player), `${m.player}'s names`).toEqual(NINE);
      g.must(m);
    }
    g.voteOut('Om').startNight();
    playPicks(g, NIGHT_2, 4);
    g.leave('Neha');
    while (g.room.step === 'night') {
      expect(job(g).names.map((n: any) => n.player)).toEqual(others(['Neha']));
      g.pickNow();
    }
  });
  it('only the player whose turn it is has a job; everyone else\'s job is null', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    expect(g.pv('Riya').job).not.toBeNull();
    for (const p of others(['Riya'])) expect(g.pv(p).job, p).toBeNull();
    expect(g.room).not.toHaveProperty('job');
  });
  it('legalMoves lists one nightPick per allowed name, exactly the names marked allowed', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    while (g.room.step === 'night') {
      expect(listedTargets(g)).toEqual(allowed(g));
      // Version 1.2 A (owner, 25 October): tags no longer follow `allowed`; they are the same for every role.
      for (const n of job(g).names as any[]) expect(n.tags, `${n.player} tags (Version 1.2 A)`).toEqual(publicTags(g, n.player));
      g.pickNow();
    }
  });
  it('a pick for another player, of a name not allowed, or null while a name is allowed, is refused', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    expect(g.try({ type: 'nightPick', player: 'Arjun', target: 'Kabir' })).toBe(false);
    expect(g.try({ type: 'nightPick', player: 'Riya', target: 'Riya' })).toBe(false);
    expect(g.try({ type: 'nightPick', player: 'Riya', target: null })).toBe(false);
    expect(g.try({ type: 'nightPick', player: 'Riya', target: 'Imran' })).toBe(false);
    g.must({ type: 'nightPick', player: 'Riya', target: 'Arjun' });
    expect(g.try({ type: 'nightPick', player: 'Riya', target: 'Kabir' })).toBe(false);
  });
});

describe('MAF-023 Mafia at night (items 4, 9, 10)', () => {
  it('the first Mafia: allowed everyone in who is not Mafia; tag "you" only, no "Mafia" tag (Version 1.2 A); no earlier pick; Zoya will see the pick', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 1);
    const j = job(g);
    expect(j.kind).toBe('mafia');
    expect(allowed(g)).toEqual(['Riya', 'Meena', 'Kabir', 'Dev', 'Om', 'Sunita', 'Neha']);
    expect(tagsOf(g, 'Arjun')).toEqual(['you']);
    expect(tagsOf(g, 'Zoya')).toEqual([]);
    expect(j.latest).toBeNull();
    expect(j.see).toEqual(['Zoya']);
  });
  it('each later Mafia sees the latest Mafia pick so far tonight; nothing else is pre-picked', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 4);
    expect(g.room.turn.player).toBe('Zoya');
    expect(job(g)).toMatchObject({ kind: 'mafia', latest: { by: 'Arjun', target: 'Kabir' }, see: [] });
  });
  it('with three Mafia: the first sees "Zoya and Dev"-style list of the two still to pick; the third sees the second\'s pick', () => {
    const twelve = [...NINE, 'Imran', 'Priya', 'Farhan'];
    const deal: Record<string, Role> = Object.fromEntries(twelve.map((p) => [p, 'villager'])) as Record<string, Role>;
    Object.assign(deal, { Arjun: 'mafia', Om: 'mafia', Farhan: 'mafia', Meena: 'doctor', Dev: 'police' });
    const g = new GameNight({ deals: { 1: deal } }).start(twelve, 3).dealAll();
    g.startNight();
    g.pickNow();                                   // Riya
    expect(job(g)).toMatchObject({ kind: 'mafia', latest: null, see: ['Om', 'Farhan'] });
    g.pickNow('Kabir');                            // Arjun
    while (g.room.turn.player !== 'Om') g.pickNow();
    expect(job(g)).toMatchObject({ latest: { by: 'Arjun', target: 'Kabir' }, see: ['Farhan'] });
    g.pickNow('Sunita');                           // Om picks someone else
    while (g.room.turn.player !== 'Farhan') g.pickNow();
    expect(job(g)).toMatchObject({ latest: { by: 'Om', target: 'Sunita' }, see: [] });
  });
  it('"first Mafia" is the first Mafia who is in: a Mafia who is out takes a ghost guess, never the Mafia job (item 9)', () => {
    const g = toNight3();
    // Zoya was voted out on day 2: on night 3 her turn is a ghost guess, and Arjun (the only Mafia in) sees nobody else.
    while (g.room.turn.player !== 'Zoya') g.pickNow();
    expect(job(g).kind).toBe('ghost');
    while (g.room.turn.player !== 'Arjun') g.pickNow();
    expect(job(g)).toMatchObject({ kind: 'mafia', latest: null, see: [] });
  });
  it('the worked example: Arjun picks Kabir, Zoya picks Om → the phone chooses with `mafia-example:1:night1` → Om', () => {
    const g = exampleNight().dealAll();
    g.night({ Arjun: 'Kabir', Zoya: 'Om', Meena: 'Meena' });
    expect(oracleTarget(EXAMPLE_SEED, 1, 1, ['Kabir', 'Om'])).toBe('Om');
    expect(g.room.morning.out).toBe('Om');
    expect(g.room.out).toEqual([{ player: 'Om', role: 'villager', how: 'night', round: 1 }]);
  });
  it('when the picks differ the target is pick(picks, `${roles}:${k}:night${r}`), repeats kept, for 300 seeds with three Mafia', () => {
    const twelve = [...NINE, 'Imran', 'Priya', 'Farhan'];
    const deal: Record<string, Role> = Object.fromEntries(twelve.map((p) => [p, 'villager'])) as Record<string, Role>;
    Object.assign(deal, { Arjun: 'mafia', Om: 'mafia', Farhan: 'mafia', Meena: 'doctor', Dev: 'police' });
    const targets = ['Riya', 'Kabir', 'Zoya', 'Sunita', 'Neha', 'Imran', 'Priya'];
    for (let i = 0; i < 300; i++) {
      const r = createRng(`differ-${i}`);
      const seed = `differ-${i}`;
      const mafiaPicks = [0, 1, 2].map(() => targets[r.int(3)]!);   // often two the same
      const g = new GameNight({ seed, deals: { 1: deal } }).start(twelve, 3).dealAll();
      g.night({ Arjun: mafiaPicks[0]!, Om: mafiaPicks[1]!, Farhan: mafiaPicks[2]!, Meena: 'Meena' });
      expect(g.room.morning.out, `${seed} ${mafiaPicks}`).toBe(oracleTarget(seed, 1, 1, mafiaPicks));
    }
  });
  it('the Mafia can never pick a Mafia (refused)', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 1);
    expect(g.try({ type: 'nightPick', player: 'Arjun', target: 'Zoya' })).toBe(false);
  });
});

describe('MAF-024 Doctor at night', () => {
  it('night 1: the Doctor may pick anyone in, themselves included', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 2);
    expect(job(g).kind).toBe('doctor');
    expect(allowed(g)).toEqual(NINE);
  });
  it('after protecting themselves: Meena not allowed, no "used" tag (Version 1.2 A); out players "out"', () => {
    const g = toNight2();
    playPicks(g, NIGHT_2, 1);
    expect(job(g).kind).toBe('doctor');
    expect(tagsOf(g, 'Meena')).toEqual(['you']);
    expect(tagsOf(g, 'Kabir')).toEqual(['out']);
    expect(tagsOf(g, 'Om')).toEqual(['out']);
    expect(allowed(g)).toEqual(['Riya', 'Arjun', 'Zoya', 'Dev', 'Sunita', 'Neha']);
  });
  it('night 3: Riya (protected on night 2) and Meena (used) are not allowed; no "protected last night" or "used" tag (Version 1.2 A)', () => {
    const g = toNight3();
    expect(g.room.turn.player).toBe('Meena');
    expect(tagsOf(g, 'Riya')).toEqual([]);
    expect(tagsOf(g, 'Meena')).toEqual(['you']);
    expect(allowed(g)).toEqual(['Arjun', 'Dev', 'Sunita', 'Neha']);
    expect(g.try({ type: 'nightPick', player: 'Meena', target: 'Riya' })).toBe(false);
  });
  it('"the previous night" is night r − 1 only: a player protected on night 1 may be protected on night 3', () => {
    // Doctor protects Riya (night 1), Kabir (night 2), then may protect Riya again (night 3). The Mafia (Arjun alone) pick
    // Sunita, then Zoya, so both are out and Riya and Kabir stay in.
    const deal: Record<string, Role> = { Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'villager', Dev: 'police', Om: 'villager', Sunita: 'villager', Neha: 'villager' };
    const g = new GameNight({ deals: { 1: deal } }).start(NINE, 1).dealAll();
    g.night({ Arjun: 'Sunita', Meena: 'Riya' });
    g.nobody().startNight();
    g.night({ Arjun: 'Zoya', Meena: 'Kabir' });
    g.nobody().startNight();
    while (g.room.turn.player !== 'Meena') g.pickNow();
    expect(allowed(g)).toContain('Riya');
    expect(allowed(g)).not.toContain('Kabir');
    expect(tagsOf(g, 'Kabir')).toEqual([]);   // Version 1.2 A: no "protected last night" tag
  });
});

describe('MAF-025 Police at night (item 8)', () => {
  it('allowed: everyone in but themselves; after a check the Police\'s own view holds the answer, nobody else\'s does', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 5);
    expect(job(g).kind).toBe('police');
    expect(allowed(g)).toEqual(others(['Dev']));
    expect(tagsOf(g, 'Dev')).toEqual(['you']);
    expect(JSON.stringify(job(g))).not.toMatch(/Not Mafia/);
    g.must(NIGHT_1[5]);  // Dev checks Zoya
    expect(g.pv('Dev').checks).toEqual([{ player: 'Zoya', mafia: true }]);
    for (const p of others(['Dev'])) expect(g.pv(p).checks, p).toEqual([]);
  });
  it('checked players are not allowed; no answer tag (Version 1.2 A): an out one is tagged "out" only; answers in checks only', () => {
    const g = toNight3();
    while (g.room.turn.player !== 'Dev') g.pickNow();
    expect(g.pv('Dev').checks).toEqual([{ player: 'Zoya', mafia: true }, { player: 'Arjun', mafia: true }]);
    expect(tagsOf(g, 'Zoya')).toEqual(['out']);
    expect(tagsOf(g, 'Arjun')).toEqual([]);
    expect(allowed(g)).toEqual(['Riya', 'Meena', 'Sunita', 'Neha']);
    g.must({ type: 'nightPick', player: 'Dev', target: 'Sunita' });
    expect(g.pv('Dev').checks[2]).toEqual({ player: 'Sunita', mafia: false });
  });
  it('a Police with nobody left to check: no name allowed, the only pick is null, a name or a check is refused', () => {
    // 6 players, 1 Mafia (Arjun): every night the Doctor protects the Mafia's pick, every day "Nobody today".
    const six = NINE.slice(0, 6);
    const deal: Record<string, Role> = { Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'villager', Dev: 'police' };
    const g = new GameNight({ deals: { 1: deal } }).start(six, 1).dealAll();
    const checks = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya'];
    checks.forEach((c, i) => {
      const victim = i % 2 === 0 ? 'Riya' : 'Kabir';
      g.night({ Arjun: victim, Meena: victim, Dev: c });
      expect(g.room.morning.out, `night ${i + 1}`).toBeNull();
      g.nobody().startNight();
    });
    while (g.room.turn.player !== 'Dev') g.pickNow();
    expect(job(g).kind).toBe('police');
    expect(allowed(g)).toEqual([]);
    expect(listedTargets(g)).toEqual([null]);
    expect(g.try({ type: 'nightPick', player: 'Dev', target: 'Riya' })).toBe(false);
    expect(g.try({ type: 'check', player: 'Dev', target: 'Riya' }), 'Version 1.2 C: no check when nobody is left').toBe(false);
    // Version 1.2 A: the names box still shows every name the same way as for every role.
    for (const n of job(g).names as any[]) expect(n.tags, n.player).toEqual(publicTags(g, n.player));
    g.must({ type: 'nightPick', player: 'Dev', target: null });
  });
});

describe('MAF-026 Villagers and players who are out', () => {
  it('a Villager may pick anyone in but themselves', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    expect(job(g).kind).toBe('villager');
    expect(allowed(g)).toEqual(others(['Riya']));
    expect(tagsOf(g, 'Riya')).toEqual(['you']);
  });
  it('a player who is out takes a ghost guess: any player who is in', () => {
    const g = toNight2();
    while (g.room.turn.player !== 'Kabir') g.pickNow();
    expect(job(g).kind).toBe('ghost');
    expect(allowed(g)).toEqual(['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev', 'Sunita', 'Neha']);
  });
  it('Villagers\' picks and ghost guesses change nothing: the night\'s result is the same whatever they pick', () => {
    const results = [0, 1].map((v) => {
      const g = toNight2();
      const pick: Record<string, string> = v === 0 ? { Kabir: 'Zoya', Om: 'Arjun', Sunita: 'Neha', Neha: 'Sunita', Riya: 'Zoya' } : { Kabir: 'Riya', Om: 'Dev', Sunita: 'Riya', Neha: 'Riya', Riya: 'Neha' };
      g.night({ Arjun: 'Sunita', Zoya: 'Sunita', Meena: 'Riya', Dev: 'Arjun', ...pick });
      return { out: g.room.out, in: g.room.in, step: g.room.step, morning: g.room.morning };
    });
    expect(results[1]).toEqual(results[0]);
  });
});

describe('MAF-027 the night resolves', () => {
  it('night 1 of the example: Kabir is out (out night 1, role shown), step day 1', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1);
    expect(g.room).toMatchObject({ step: 'day', round: 1, turn: null, caught: 0, winner: null, roles: null });
    expect(g.room.out).toEqual([{ player: 'Kabir', role: 'villager', how: 'night', round: 1 }]);
    expect(g.room.in).toEqual(others(['Kabir']));
    expect(g.room.morning.out).toBe('Kabir');
  });
  it('the Doctor protecting the target: nobody is out (night 2 of the example)', () => {
    const g = toNight2();
    playPicks(g, NIGHT_2);
    expect(g.room.morning.out).toBeNull();
    expect(g.room.out.map((o: any) => o.player)).toEqual(['Kabir', 'Om']);
    expect(g.room.in).toEqual(['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev', 'Sunita', 'Neha']);
  });
  it('night 3: Arjun alone picks Meena, the Doctor protects Sunita: Meena (the Doctor) is out, role shown', () => {
    const g = toNight3();
    playPicks(g, NIGHT_3);
    expect(g.room.morning.out).toBe('Meena');
    expect(g.room.out[g.room.out.length - 1]).toEqual({ player: 'Meena', role: 'doctor', how: 'night', round: 3 });
  });
  it('no Mafia pick (both Mafia leave before their turns): nobody is out, the fixed line; then the leaves apply and the Village wins', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow('Arjun');                // Riya
    g.leave('Arjun');
    g.leave('Zoya');
    g.night();
    expect(g.room.morning).toEqual({ story: QUIET_NIGHT, storyId: null, out: null });
    expect(g.room.left).toEqual(['Arjun', 'Zoya']);
    expect(g.room.step).toBe('gameOver');
    expect(g.room.winner).toBe('village');
  });
  it('a pick made before a night leave still counts: the Doctor protects Om, then leaves; the Mafia pick Om: nobody is out', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow('Kabir');                // Riya
    g.pickNow('Om');                   // Arjun
    g.pickNow('Om');                   // Meena (Doctor)
    g.leave('Meena');
    g.night({ Zoya: 'Om' });
    expect(g.room.morning.out).toBeNull();
    expect(g.room.left).toEqual(['Meena']);
    expect(g.room.in).not.toContain('Meena');
  });
  it('PO 15: Mafia picks naming a night leaver are dropped: Arjun picks Kabir, Kabir leaves, Zoya picks Om → Om is out; the Doctor protecting Kabir protects nobody', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow('Arjun');                // Riya
    g.pickNow('Kabir');                // Arjun
    g.pickNow('Kabir');                // Meena protects Kabir
    g.leave('Kabir');
    expect(g.room.turn.player).toBe('Zoya');
    expect(job(g).latest).toEqual({ by: 'Arjun', target: 'Kabir' });
    g.night({ Zoya: 'Om' });
    expect(g.room.morning.out).toBe('Om');
    expect(g.room.left).toEqual(['Kabir']);
  });
  it('PO 15: when every Mafia pick named the night leaver, nobody is out and the morning is the fixed line', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow('Arjun');                // Riya
    g.pickNow('Kabir');                // Arjun
    g.pickNow('Meena');                // Meena
    g.pickNow('Riya');                 // Kabir
    g.pickNow('Kabir');                // Zoya agrees
    g.leave('Kabir');
    g.night();
    expect(g.room.morning).toEqual({ story: QUIET_NIGHT, storyId: null, out: null });
    expect(g.room.left).toEqual(['Kabir']);
    expect(g.room.out).toEqual([]);
  });
  it('a night leaver is in no names box from the leave on (item 11), and applies only after the night (step 4)', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow();
    g.leave('Kabir');
    expect(g.room.leaving).toEqual(['Kabir']);
    expect(g.room.left).toEqual([]);
    while (g.room.step === 'night') {
      expect(job(g).names.map((n: any) => n.player)).not.toContain('Kabir');
      expect(listedTargets(g)).not.toContain('Kabir');
      g.pickNow();
    }
    expect(g.room.leaving).toEqual([]);
    expect(g.room.left).toEqual(['Kabir']);
    expect(g.room.out.map((o: any) => o.player)).not.toContain('Kabir');
    expect(g.room.roles).toBeNull();
  });
  it('the last player in the order leaving before their turn ends the night at once', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    playPicks(g, NIGHT_1, 8);
    expect(g.room.turn.player).toBe('Neha');
    g.leave('Neha');
    expect(g.room.step).toBe('day');
    expect(g.room.morning.out).toBe('Kabir');
    expect(g.room.left).toEqual(['Neha']);
  });
  it('Undo of a night leave works only as the very next move: unleave restores the night as it was', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow();
    const before = { room: g.room, job: g.pv(g.room.turn.player) };
    g.leave('Kabir');
    expect(g.legal()).toContainEqual({ type: 'unleave', player: 'Kabir' });
    g.must({ type: 'unleave', player: 'Kabir' });
    expect(g.room).toEqual(before.room);
    expect(g.pv(g.room.turn.player)).toEqual(before.job);
    g.leave('Kabir');
    g.pickNow();
    expect(g.try({ type: 'unleave', player: 'Kabir' })).toBe(false);
  });
});

describe('MAF-027 MAF-P3 night rules over random game nights', () => {
  it('500 random game nights: at most one out a night; a protected target never out; the Mafia never pick a Mafia; the Doctor never protects the same player two nights running nor themselves twice; the target is the scenario\'s', () => {
    for (let i = 0; i < 500; i++) {
      const { picks, steps, deals } = randomNight(`p3-${i}`);
      // Group picks by (game, night).
      const nights = new Map<string, typeof picks>();
      for (const p of picks) {
        const key = `${p.k}:${p.r}`;
        nights.set(key, [...(nights.get(key) ?? []), p]);
      }
      const leftNights = new Set(steps.filter((s) => s.ok && s.move.type === 'leave' && s.before.step === 'night').map((s) => `${s.before.game}:${s.before.round}`));
      const doctorSelf = new Map<number, number>();
      let lastDoctor: { k: number; r: number; target: string | null } | null = null;
      for (const [key, list] of nights) {
        const [k, r] = key.split(':').map(Number) as [number, number];
        const deal = deals[k - 1]!;
        for (const p of list) {
          if (p.kind === 'mafia') expect(deal[p.target!], `p3-${i} ${key}: Mafia picked a Mafia`).not.toBe('mafia');
          if (p.kind === 'doctor') {
            if (lastDoctor && lastDoctor.k === k && lastDoctor.r === r - 1 && p.target !== null) expect(p.target, `p3-${i} ${key}: same protect twice`).not.toBe(lastDoctor.target);
            if (p.target === p.player) doctorSelf.set(k, (doctorSelf.get(k) ?? 0) + 1);
            lastDoctor = { k, r, target: p.target };
          }
        }
        // The night's resolution: the step that ended the night.
        const end = steps.find((s) => s.ok && s.before.step === 'night' && s.before.game === k && s.before.round === r && s.after.step !== 'night' && s.move.type !== 'endGame');
        if (!end) continue;   // ended by End the game, or the night never finished
        const outs = end.after.out.filter((o: any) => o.how === 'night' && o.round === r);
        expect(outs.length, `p3-${i} ${key}: outs at night`).toBeLessThanOrEqual(1);
        const doctor = list.find((p) => p.kind === 'doctor');
        if (outs.length === 1 && doctor) expect(outs[0].player, `p3-${i} ${key}: protected target out`).not.toBe(doctor.target);
        if (!leftNights.has(key)) {
          const mafiaPicks = list.filter((p) => p.kind === 'mafia').map((p) => p.target as string);
          const target = oracleTarget(`roles-p3-${i}`, k, r, mafiaPicks);
          const expected = target !== null && doctor?.target !== target ? target : null;
          expect(outs[0]?.player ?? null, `p3-${i} ${key}: the night's out`).toBe(expected);
        }
      }
      for (const [k, n] of doctorSelf) expect(n, `p3-${i} game ${k}: Doctor protected themselves`).toBeLessThanOrEqual(1);
    }
  });
});

// ---- Version 1.2 (owner, 25 October 2026): privacy changes A and C (C3, MAF-P2/P7, guideline 51) ----

describe('MAF-022 to MAF-026 Version 1.2 A: the names box is the same for every role', () => {
  it('every turn of the worked example (three nights): tags are "you" on the own name, "out" on out players, nothing else', () => {
    const g = exampleNight().dealAll();
    for (const list of [NIGHT_1, NIGHT_2, NIGHT_3] as any[][]) {
      g.startNight();
      for (const m of list) {
        const j = job(g);
        for (const n of j.names as any[]) expect(n.tags, `night ${g.room.round}, ${m.player} (${j.kind}) sees ${n.player}`).toEqual(publicTags(g, n.player));
        g.must(m);
      }
      if (g.room.step === 'day') g.voteOut(list === NIGHT_1 ? 'Om' : list === NIGHT_2 ? 'Zoya' : 'Arjun');
    }
  });
  it('MAF-P7: for 150 random game nights, at every night turn the names and tags depend on nothing but who is out and whose turn it is', () => {
    for (let i = 0; i < 150; i++) {
      const { g } = randomNight(`v12a-${i}`, { games: 2 });
      let match: any = { setup: g.match.setup, records: [], state: g.rules.setup(g.match.setup) };
      for (const r of g.records as any[]) {
        const room = g.rules.view(match.state, { kind: 'room' }) as any;
        if (room.step === 'night' && room.turn) {
          const j = (g.rules.view(match.state, { kind: 'player', playerId: room.turn.player }) as any).job;
          const outs = new Set((room.out as any[]).map((o) => o.player));
          for (const n of j.names as any[]) {
            const want = n.player === room.turn.player ? ['you'] : outs.has(n.player) ? ['out'] : [];
            expect(n.tags, `v12a-${i} game ${room.game} night ${room.round}: ${room.turn.player} (${j.kind}) sees ${n.player}`).toEqual(want);
          }
        }
        const next = play(g.rules, match, r.move, { by: HOST, at: r.at });
        if (!next.ok) throw new Error(`v12a-${i}: replay refused ${JSON.stringify(r.move)}`);
        match = next.value;
      }
    }
  });
});

describe('MAF-025 Version 1.2 C: the Police\'s first tap is recorded at once (`check`)', () => {
  /** The example's night 1 at Dev's turn (6 of 9). */
  const atDev = () => { const g = exampleNight().dealAll(); g.startNight(); playPicks(g, NIGHT_1, 5); return g; };

  it('on the Police\'s turn legalMoves lists one check per allowed name (seat order), alongside the nightPicks', () => {
    const g = atDev();
    const checks = g.legal().filter((m) => m.type === 'check');
    expect(checks).toEqual(others(['Dev']).map((target) => ({ type: 'check', player: 'Dev', target })));
    expect(listedTargets(g)).toEqual(others(['Dev']));
  });
  it('a check is accepted at once: the Police\'s own view holds the answer (checks and job.check); the room view does not change', () => {
    const g = atDev();
    const room = g.room;
    expect(job(g).check, 'no check yet').toBeNull();
    g.must({ type: 'check', player: 'Dev', target: 'Zoya' });
    expect(g.room, 'MAF-P2: the room view is the same after the check').toEqual(room);
    expect(g.pv('Dev').checks).toEqual([{ player: 'Zoya', mafia: true }]);
    expect(job(g)).toMatchObject({ kind: 'police', check: { player: 'Zoya', mafia: true } });
    for (const p of others(['Dev'])) expect(g.pv(p).checks, p).toEqual([]);
  });
  it('after the check: only the checked name is allowed and listed; a second check or a pick of anyone else is refused', () => {
    const g = atDev();
    g.must({ type: 'check', player: 'Dev', target: 'Riya' });
    expect(allowed(g)).toEqual(['Riya']);
    expect(g.legal().filter((m) => m.type === 'check' || m.type === 'nightPick')).toEqual([{ type: 'nightPick', player: 'Dev', target: 'Riya' }]);
    expect(g.try({ type: 'check', player: 'Dev', target: 'Zoya' })).toBe(false);
    expect(g.try({ type: 'check', player: 'Dev', target: 'Riya' })).toBe(false);
    expect(g.try({ type: 'nightPick', player: 'Dev', target: 'Zoya' })).toBe(false);
    expect(g.pv('Dev').checks).toEqual([{ player: 'Riya', mafia: false }]);
    // Names and tags stay as for every role (Version 1.2 A).
    for (const n of job(g).names as any[]) expect(n.tags, n.player).toEqual(publicTags(g, n.player));
    g.must({ type: 'nightPick', player: 'Dev', target: 'Riya' });
    expect(g.pv('Dev').checks, 'the check is counted once').toEqual([{ player: 'Riya', mafia: false }]);
    expect(g.room.turn.player).toBe('Om');
  });
  it('the check survives a reload: the saved game night replays to the same answer and the same single allowed name', () => {
    const g = atDev();
    g.must({ type: 'check', player: 'Dev', target: 'Zoya' });
    const saved = savedOf(g);
    const re = replay(g.rules, saved.setup, saved.records);
    if (!re.ok) throw new Error(re.reason);
    const v = g.rules.view(re.value.state, { kind: 'player', playerId: 'Dev' }) as any;
    expect(v.job.check).toEqual({ player: 'Zoya', mafia: true });
    expect(v.checks).toEqual([{ player: 'Zoya', mafia: true }]);
    expect((v.job.names as any[]).filter((n) => n.allowed).map((n) => n.player)).toEqual(['Zoya']);
  });
  it('the night resolves as before; readMafiaNight reads the check as the night\'s `checked`', () => {
    const g = atDev();
    g.must({ type: 'check', player: 'Dev', target: 'Zoya' });
    playPicks(g, NIGHT_1.slice(5));
    expect(g.room.out).toEqual([{ player: 'Kabir', role: 'villager', how: 'night', round: 1 }]);
    const night = readMafiaNight(savedOf(g)).games[0].nights[0];
    expect(night.checked).toEqual({ player: 'Zoya', mafia: true });
    expect(night.picks.filter((p: any) => p.player === 'Dev')).toEqual([{ player: 'Dev', target: 'Zoya' }]);
  });
  it('a check is refused: not the Police\'s turn, by another player, of themselves, of a name not dealt', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    expect(g.try({ type: 'check', player: 'Riya', target: 'Arjun' }), 'a Villager\'s turn').toBe(false);
    expect(g.try({ type: 'check', player: 'Dev', target: 'Zoya' }), 'not Dev\'s turn').toBe(false);
    playPicks(g, NIGHT_1, 5);
    expect(g.try({ type: 'check', player: 'Riya', target: 'Zoya' }), 'another player on Dev\'s turn').toBe(false);
    expect(g.try({ type: 'check', player: 'Dev', target: 'Dev' }), 'themselves').toBe(false);
    expect(g.try({ type: 'check', player: 'Dev', target: 'Imran' }), 'not dealt').toBe(false);
    expect(g.pv('Dev').checks).toEqual([]);
  });
  it('MAF-P2: the room view after the check is the same whichever name is checked', () => {
    const rooms = ['Zoya', 'Riya', 'Arjun'].map((t) => { const g = atDev(); g.must({ type: 'check', player: 'Dev', target: t }); return g.room; });
    expect(rooms[1]).toEqual(rooms[0]);
    expect(rooms[2]).toEqual(rooms[0]);
  });
  it('a game night saved before 1.2 (a Police nightPick with no check) still replays (flows)', () => {
    const f = FLOWS.find((x) => x.name === 'morning1')!;
    const saved = savedFlow(f);
    expect((saved.records as any[]).some((r) => r.move.type === 'check')).toBe(false);
    expect(replay(new GameNight().rules, saved.setup, saved.records).ok).toBe(true);
  });
});
