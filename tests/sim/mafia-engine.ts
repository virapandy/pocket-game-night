// Mafia table simulation against the REAL rules engine (src/games/mafia/rules), owner's request of 25 October 2026.
// Reuses the idea of tests/tools/jev-design/sim-mafia.ts: code computes every fact, a chooser (Jev, or a seeded stub)
// only ranks the names a player could choose, and the engine is the referee. Differences from sim-mafia.ts:
//   - deals, the night order, night resolution, stories, ties and the winner all come from the engine (`play`);
//   - a Mafia, Doctor or Police is offered the names the GUIDE allows (sim-mafia.ts's lists: Mafia any non-Mafia in;
//     Doctor not last night's pick and themselves once; Police anyone in but themselves). When the engine refuses the
//     top choice, the refusal is recorded (a rule the engine enforced that the chooser tried) and the best-ranked name
//     the engine allows is played instead, from the same answer (no extra decision);
//   - Villagers' and ghosts' night picks have no effect on the result, so they are made by a seeded stub, not Jev;
//   - after every move: the engine's invariants; at the end: the winner re-checked by code from the roles, and the
//     saved game night replayed (same state, same readMafiaNight).
// Report-only: nothing here fails a build.
import { HOST, createRng, play, replay, startMatch, type Rng } from '../../src/engine';
import { mafiaRules, mafiaCounts, readMafiaNight } from '../../src/games/mafia/rules';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Role = 'mafia' | 'doctor' | 'police' | 'villager';
export type Shares = 'never' | 'when-found';
export interface Ask { kind: 'night-mafia' | 'night-doctor' | 'night-police' | 'day' | 'day-again'; player: string; facts: string[]; options: string[] }
/** Ranks each ask's options, best first (or null to stop the run cleanly). One answer per ask = one decision. */
export type Chooser = (asks: Ask[]) => Promise<string[][] | null>;

const NAMES = ['Asha', 'Bala', 'Chitra', 'Dev', 'Esha', 'Farid', 'Gita', 'Hari', 'Indu', 'Joe', 'Kavi', 'Latha', 'Mani', 'Nila', 'Omar', 'Priya'];
const R = mafiaRules as any;
const roleWord = (r: Role) => (r === 'villager' ? 'a Villager' : r === 'mafia' ? 'Mafia' : r === 'doctor' ? 'the Doctor' : 'the Police');

export interface Refusal { kind: string; player: string; tried: string; reason: string }
export interface GameLog {
  size: number; shares: Shares; seed: string; winner: 'village' | 'mafia' | null; unfinished: boolean; rounds: number;
  doctorSaves: number; ties: number; secondTies: number; mafiaDisagreements: number; decisions: number;
  refusals: Refusal[]; listDiffs: string[]; problems: string[]; choices: string[][];
}

export function stubChooser(seed: string): Chooser {
  const r = createRng(`stub:${seed}`);
  return async (asks) => asks.map((a) => {
    const o = [...a.options];
    for (let i = o.length - 1; i > 0; i--) { const j = r.int(i + 1); [o[i], o[j]] = [o[j]!, o[i]!]; }
    return o;
  });
}

export async function playEngineGame(o: { size: number; shares: Shares; seed: string; chooser: Chooser; maxRounds?: number }): Promise<GameLog | 'stopped'> {
  const players = NAMES.slice(0, o.size);
  const log: GameLog = { size: o.size, shares: o.shares, seed: o.seed, winner: null, unfinished: false, rounds: 0, doctorSaves: 0, ties: 0,
    secondTies: 0, mafiaDisagreements: 0, decisions: 0, refusals: [], listDiffs: [], problems: [], choices: [] };
  const stub = createRng(`villagers:${o.seed}`);
  let at = 1_792_942_800_000;
  let m: any = startMatch(R, { gameId: 'mafia', seeds: { roles: o.seed }, config: {} } as any, at);
  const room = () => R.view(m.state, { kind: 'room' });
  const pv = (p: string) => R.view(m.state, { kind: 'player', playerId: p });
  const P = (move: any): string | null => {
    const r = play(R, m, move, { by: HOST, at: (at += 1000) });
    if (!r.ok) return r.reason;
    m = r.value;
    const bad = R.invariants(m.state);
    if (bad.length) log.problems.push(`invariants after ${JSON.stringify(move)}: ${bad.join('; ')}`);
    return null;
  };
  const must = (move: any) => { const why = P(move); if (why) throw new Error(`engine refused ${JSON.stringify(move)}: ${why}`); };

  must({ type: 'start', players, mafiaCount: mafiaCounts(o.size).suggested });
  while (room().step === 'deal') must({ type: 'seen', player: room().turn.player });
  const roles: Record<string, Role> = Object.fromEntries(players.map((p) => [p, pv(p).me.role]));
  const doctor = players.find((p) => roles[p] === 'doctor') ?? null;
  const police = players.find((p) => roles[p] === 'police') ?? null;

  const pub: string[] = [];
  const priv: Record<string, string[]> = Object.fromEntries(players.map((p) => [p, []]));
  let lastProtect: string | null = null; let selfUsed = false;
  const facts = (p: string) => {
    const v = room(); const me = pv(p).me;
    return [`You are ${p}. Your role: ${me.role}.`, ...(me.partners.length ? [`Your Mafia partners: ${me.partners.join(', ')}.`] : []),
      `Players still in: ${v.in.join(', ')}.`, `Players out: ${v.out.length ? v.out.map((x: any) => `${x.player} (${roleWord(x.role)})`).join(', ') : 'nobody yet'}.`,
      ...pub, ...priv[p]!];
  };
  const ask = async (asks: Ask[]): Promise<string[][] | 'STOP'> => {
    const needs = asks.filter((a) => a.options.length > 1);
    let ranked: string[][] = [];
    if (needs.length) {
      const res = await o.chooser(needs);
      if (!res) return 'STOP';
      ranked = res; log.decisions += needs.length;
    }
    let i = 0;
    return asks.map((a) => {
      if (a.options.length <= 1) return [...a.options];
      const r = ranked[i++]!.filter((x) => a.options.includes(x));
      for (const x of a.options) if (!r.includes(x)) r.push(x);
      log.choices.push([a.kind, a.player, r[0]!]);
      return r;
    });
  };
  /** Plays the best-ranked name the engine accepts; records refusals of names the guide allowed. */
  const pickPlayed = (kind: string, player: string, ranked: string[], allowed: string[]): string | null => {
    for (const t of ranked) {
      const why = P({ type: 'nightPick', player, target: t });
      if (!why) return t;
      log.refusals.push({ kind, player, tried: t, reason: why });
      if (!allowed.length) break;
    }
    for (const t of allowed) if (!P({ type: 'nightPick', player, target: t })) return t;
    if (!P({ type: 'nightPick', player, target: null })) return null;
    throw new Error(`no night pick accepted for ${player}`);
  };

  const maxRounds = o.maxRounds ?? 40;
  for (let guard = 0; room().step !== 'gameOver'; guard++) {
    const v = room();
    if (v.round > maxRounds || guard > 2000) { log.unfinished = true; break; }
    if (v.step === 'nightStart') { must({ type: 'startNight', night: v.round }); log.rounds = v.round; continue; }
    if (v.step === 'night') {
      const p = v.turn.player as string; const me = pv(p); const job = me.job;
      const allowed: string[] = job.names.filter((n: any) => n.allowed).map((n: any) => n.player);
      const inNow: string[] = v.in.filter((x: string) => !v.leaving.includes(x));
      if (job.kind === 'mafia' || job.kind === 'doctor' || job.kind === 'police') {
        const guide = job.kind === 'mafia' ? inNow.filter((x) => roles[x] !== 'mafia')
          : job.kind === 'doctor' ? inNow.filter((x) => x !== lastProtect && (x !== p || !selfUsed))
          : inNow.filter((x) => x !== p);
        const a = new Set(allowed), g = new Set(guide);
        const onlyGuide = guide.filter((x) => !a.has(x)), onlyEngine = allowed.filter((x) => !g.has(x));
        if (onlyEngine.length) log.listDiffs.push(`${job.kind} ${p} night ${v.round}: engine allows ${onlyEngine.join(', ')} that the guide does not`);
        if (onlyGuide.length && !(job.kind === 'police')) log.listDiffs.push(`${job.kind} ${p} night ${v.round}: guide allows ${onlyGuide.join(', ')} that the engine does not`);
        if (job.kind === 'mafia' && job.latest) priv[p]!.push(`Night ${v.round}: ${job.latest.by} picked ${job.latest.target}. Choose the same name to agree, or a different one.`);
        const kind = `night-${job.kind}` as Ask['kind'];
        const res = await ask([{ kind, player: p, facts: facts(p), options: guide.length ? guide : allowed }]);
        if (res === 'STOP') return 'stopped';
        const t = pickPlayed(kind, p, res[0]!, allowed);
        if (job.kind === 'doctor') { lastProtect = t; if (t === p) selfUsed = true; priv[p]!.push(`Night ${v.round}: you protected ${t}.`); }
        if (job.kind === 'mafia') priv[p]!.push(`Night ${v.round}: you picked ${t}.`);
        if (job.kind === 'police' && t) { const c = pv(p).checks.find((x: any) => x.player === t); priv[p]!.push(`Night ${v.round}: you checked ${t}: ${c?.mafia ? 'Mafia' : 'Not Mafia'}.`); }
      } else {
        const t = allowed.length ? allowed[stub.int(allowed.length)]! : null;
        must({ type: 'nightPick', player: p, target: t });
      }
      if (room().step !== 'night' && doctor && !room().players.includes(doctor)) lastProtect = null;
      if (room().step === 'day' || room().step === 'gameOver') {
        const mo = room().morning;
        if (mo) pub.push(`Morning ${v.round}: ${mo.out ? `${mo.out} is out, ${roleWord(roles[mo.out]!)}.` : 'nobody is out.'}`);
        if (doctor && !room().in.includes(doctor)) lastProtect = null;
      }
      continue;
    }
    if (v.step === 'day') {
      if (o.shares === 'when-found' && police && v.in.includes(police)) {
        for (const c of pv(police).checks) if (c.mafia && v.in.includes(c.player)) pub.push(`Day ${v.round}: the Police says ${c.player} is Mafia.`);
      }
      const voters: string[] = v.in;
      const res = await ask(voters.map((x) => ({ kind: 'day', player: x, facts: facts(x), options: voters.filter((y) => y !== x) })));
      if (res === 'STOP') return 'stopped';
      const pts = voters.map((x, i) => res[i]![0]!);
      pub.push(`Day ${v.round}: ${voters.map((x, i) => `${x} pointed at ${pts[i]}`).join(', ')}.`);
      const top = topOf(pts);
      if (top.length === 1) must({ type: 'voteOut', player: top[0] });
      else {
        log.ties++;
        must({ type: 'tie', players: top });
        const tied: string[] = room().tied;
        pub.push(`Day ${v.round}: tie between ${tied.join(', ')}. Point again among them.`);
        const askers = voters.filter((x) => tied.some((t) => t !== x));
        const res2 = await ask(askers.map((x) => ({ kind: 'day-again', player: x, facts: facts(x), options: tied.filter((t) => t !== x) })));
        if (res2 === 'STOP') return 'stopped';
        const t2 = topOf(askers.map((_, i) => res2[i]![0]!));
        if (t2.length === 1) must({ type: 'voteOut', player: t2[0] });
        else { log.secondTies++; must({ type: 'voteNobody', reason: 'secondTie' }); }
      }
      const vv = room().vote;
      if (vv) pub.push(`Day ${v.round}: ${vv.player} was voted out, ${roleWord(vv.role)}.`); else pub.push(`Day ${v.round}: nobody out.`);
      continue;
    }
    throw new Error(`unexpected step ${v.step}`);
  }
  const end = room();
  log.winner = end.winner;
  if (!log.unfinished) {
    const inMafia = end.in.filter((p: string) => roles[p] === 'mafia').length;
    const others = end.in.length - inMafia;
    const code = inMafia === 0 ? 'village' : inMafia >= others ? 'mafia' : null;
    if (code !== end.winner) log.problems.push(`winner: engine ${end.winner}, code ${code} (in ${end.in.join(', ')})`);
    if (JSON.stringify(end.roles) !== JSON.stringify(roles)) log.problems.push('G1 roles differ from the deal');
  }
  // Saved game night: replay and readMafiaNight (MAF-093).
  const saved = { format: 2, gameType: 'mafia', id: `sim-${o.seed}`, createdAt: 0, updatedAt: at, status: 'in-progress', setup: m.setup, records: m.records };
  const again = replay(R, m.setup, m.records);
  if (!again.ok) log.problems.push(`replay refused: ${again.reason}`);
  else if (JSON.stringify(again.value.state) !== JSON.stringify(m.state)) log.problems.push('replay gives a different state');
  const night = readMafiaNight(saved as any);
  if (!night) log.problems.push('readMafiaNight returned null');
  else {
    const g = night.games[0]!;
    for (const n of g.nights) {
      if (n.target && !n.out && n.protected === n.target) log.doctorSaves++;
      if (new Set(n.mafia).size > 1) log.mafiaDisagreements++;
    }
    if (again.ok && JSON.stringify(readMafiaNight({ ...saved, records: again.value.records } as any)) !== JSON.stringify(night)) log.problems.push('readMafiaNight differs after replay');
  }
  return log;
}

function topOf(xs: string[]): string[] {
  const c = new Map<string, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  const max = Math.max(0, ...c.values());
  return [...c].filter(([, n]) => n === max).map(([k]) => k);
}

export interface Cell { size: number; shares: Shares; logs: GameLog[] }
export async function runEngineSim(o: { sizes: number[]; shares: Shares[]; games: number; run: string; chooser: Chooser; stop: () => boolean }) {
  const cells: Cell[] = []; let stopped: string | null = null;
  outer: for (const size of o.sizes) for (const shares of o.shares) {
    const cell: Cell = { size, shares, logs: [] }; cells.push(cell);
    for (let g = 1; g <= o.games; g++) {
      if (o.stop()) { stopped = 'decision limit'; break outer; }
      const res = await playEngineGame({ size, shares, seed: `${o.run}-${size}-${shares}-${g}`, chooser: o.chooser });
      if (res === 'stopped') { stopped = 'Jev or the budget stopped answering'; break outer; }
      cell.logs.push(res);
    }
  }
  return { cells, stopped };
}

export function engineReport(res: { cells: Cell[]; stopped: string | null }): string[] {
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const per = (g: GameLog[], f: (x: GameLog) => number) => (g.length ? (sum(g.map(f)) / g.length).toFixed(2) : 'n/a');
  const L = ['| Players | Police shares | Games | Village wins | Mafia wins | Unfinished | Village win % | Rounds/game | Doctor saves/game | Ties/game | Second ties/game | Mafia disagreed/game | Jev decisions |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const c of res.cells) {
    const g = c.logs; const vw = g.filter((x) => x.winner === 'village').length, mw = g.filter((x) => x.winner === 'mafia').length;
    const fin = vw + mw;
    L.push(`| ${c.size} | ${c.shares} | ${g.length} | ${vw} | ${mw} | ${g.length - fin} | ${fin ? Math.round((100 * vw) / fin) + '%' : 'n/a'} | ${per(g, (x) => x.rounds)} | ${per(g, (x) => x.doctorSaves)} | ${per(g, (x) => x.ties)} | ${per(g, (x) => x.secondTies)} | ${per(g, (x) => x.mafiaDisagreements)} | ${sum(g.map((x) => x.decisions))} |`);
  }
  const all = res.cells.flatMap((c) => c.logs);
  const byKind = new Map<string, number>();
  for (const r of all.flatMap((x) => x.refusals)) { const k = `${r.kind}: ${r.reason}`; byKind.set(k, (byKind.get(k) ?? 0) + 1); }
  const diffs = new Map<string, number>();
  for (const d of all.flatMap((x) => x.listDiffs)) { const k = d.replace(/^(\w+) \S+ night \d+: (engine|guide) allows .* that/, '$1: $2 allows names that'); diffs.set(k, (diffs.get(k) ?? 0) + 1); }
  L.push('', `Games: ${all.length}; stopped early: ${res.stopped ?? 'no'}. Jev decisions: ${sum(all.map((x) => x.decisions))}.`, '',
    '### Rules the engine refused that the chooser tried', '',
    ...(byKind.size ? [...byKind].sort((a, b) => b[1] - a[1]).map(([k, n]) => `- ${n} × ${k}`) : ['- None.']), '',
    '### Where the engine\'s allowed names differ from the guide-level list (code, no Jev)', '',
    ...(diffs.size ? [...diffs].map(([k, n]) => `- ${n} × ${k}`) : ['- None.']), '',
    '### Problems (invariants, winner re-check, replay)', '',
    ...(all.some((x) => x.problems.length) ? all.filter((x) => x.problems.length).slice(0, 20).map((x) => `- seed ${x.seed}: ${x.problems.slice(0, 3).join(' | ')}`) : ['- None: invariants held after every move, every winner matched the code\'s own count, every game night replayed to the same state and the same readMafiaNight.']));
  return L;
}
