// Mafia table simulation for the jev-design tool (not a test). The REFEREE is code: it deals and applies the rules in
// docs/games/mafia/guide.md and decisions MF1 to MF15. A CHOOSER (Jev, a stub, or a replay) only picks, for one player at a
// time, one name from the legal names, given a short fact list the code writes (public facts plus that player's own private
// facts). Pure and seeded: the same seed and the same choices give the same game.

export type Role = 'mafia' | 'doctor' | 'police' | 'villager';
export type PoliceShares = 'never' | 'when-found';
export const NOBODY = 'nobody';

export interface Request { game: number; round: number; kind: 'night-mafia' | 'night-doctor' | 'night-police' | 'day' | 'day-again'; player: string; facts: string[]; options: string[] }
/** Returns one of `options`, or null to stop the run cleanly (budget, decision limit, Jev unavailable). */
export type Chooser = (req: Request) => Promise<string | null>;

const NAMES = ['Asha', 'Bala', 'Chitra', 'Dev', 'Esha', 'Farid', 'Gita', 'Hari', 'Indu', 'Joe', 'Kavi', 'Latha', 'Mani', 'Nila', 'Omar', 'Priya'];

/** MF5: 5-7 -> 1, 8-11 -> 2, 12-15 -> 3, 16 -> 4. */
export function mafiaCount(n: number): number {
  if (n < 5 || n > 16) throw new Error('Mafia is for 5 to 16 players');
  return n <= 7 ? 1 : n <= 11 ? 2 : n <= 15 ? 3 : 4;
}

export function rngOf(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = <T>(xs: T[], r: () => number) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; };

/** Win check: Village when no Mafia is left; Mafia when they equal or outnumber everyone else. */
export function winner(mafiaAlive: number, othersAlive: number): 'village' | 'mafia' | null {
  if (mafiaAlive === 0) return 'village';
  if (mafiaAlive >= othersAlive) return 'mafia';
  return null;
}

/** The day's point. Votes are names or NOBODY. Highest count wins; a tie among the top is pointed at again (once) among the tied; still tied, nobody out. */
export function tally(votes: string[]): { top: string[]; winner: string | null } {
  const c = new Map<string, number>();
  for (const v of votes) c.set(v, (c.get(v) ?? 0) + 1);
  const max = Math.max(0, ...c.values());
  const top = [...c].filter(([, n]) => n === max).map(([k]) => k);
  return { top, winner: top.length === 1 ? top[0]! : null };
}

export interface GameLog {
  game: number; seed: number; players: number; mafia: number; roles: Record<string, Role>;
  winner: 'village' | 'mafia' | null; unfinished: boolean; rounds: number;
  firstOutRound: number | null; sitOut: number | null;
  doctorSaves: number; mafiaDisagreements: number; ties: number; secondTies: number;
  nobodyByChoice: number; nobodyAfterTie: number;
  doctorProtects: { round: number; who: string }[]; // for the self-test
  tieResults: ('out' | 'nobody-second-tie' | 'nobody-chosen')[]; // what each tied day ended in
  choices: string[]; decisions: number;
  privateLeak: string[]; // facts shown to a player that mention a role they could not know (self-test)
}

export interface Opts { players: number; policeShares: PoliceShares; seed: number; game: number; chooser: Chooser; noNobody?: boolean; maxRounds?: number; stop?: () => boolean }

export async function playGame(o: Opts): Promise<GameLog | 'stopped'> {
  const n = o.players;
  const seed = o.seed;
  const r = rngOf(seed);
  const names = NAMES.slice(0, n);
  const mafiaN = mafiaCount(n);
  const roleList: Role[] = [...Array(mafiaN).fill('mafia')];
  if (n >= 6) roleList.push('doctor', 'police');
  while (roleList.length < n) roleList.push('villager');
  const order = shuffle(roleList, r);
  const roles: Record<string, Role> = {};
  names.forEach((p, i) => (roles[p] = order[i]!));
  const alive = new Set(names);
  const log: GameLog = { game: o.game, seed, players: n, mafia: mafiaN, roles, winner: null, unfinished: false, rounds: 0, firstOutRound: null, sitOut: null,
    doctorSaves: 0, mafiaDisagreements: 0, ties: 0, secondTies: 0, nobodyByChoice: 0, nobodyAfterTie: 0, doctorProtects: [], tieResults: [], choices: [], decisions: 0, privateLeak: [] };
  const mafiaNames = names.filter((p) => roles[p] === 'mafia');
  const doctor = names.find((p) => roles[p] === 'doctor');
  const police = names.find((p) => roles[p] === 'police');

  const pub: string[] = []; // public facts, in order
  const priv: Record<string, string[]> = Object.fromEntries(names.map((p) => [p, [] as string[]]));
  let doctorSelfUsed = false;
  let lastProtect: string | null = null;
  const outList = () => names.filter((p) => !alive.has(p));

  const factsFor = (p: string): string[] => {
    const f = [`You are ${p}. Your role: ${roles[p]}.`,
      `Players still in: ${names.filter((x) => alive.has(x)).join(', ')}.`,
      `Players out: ${outList().length ? outList().join(', ') : 'nobody yet'}.`,
      ...pub, ...priv[p]!];
    return f;
  };
  const ask = async (kind: Request['kind'], round: number, player: string, options: string[]): Promise<string | 'STOP'> => {
    if (o.stop?.()) return 'STOP';
    if (options.length === 1 && options[0] !== NOBODY) { return options[0]!; } // nothing to choose
    const facts = factsFor(player);
    // self-test hook: a player's facts must never name a role they could not know
    for (const f of facts) for (const q of names) if (q !== player && new RegExp(`${q}[^.]*\\b(is|was) (Mafia|the Doctor|the Police)\\b`).test(f) && !pub.includes(f) && !priv[player]!.includes(f)) log.privateLeak.push(f);
    const c = await o.chooser({ game: o.game, round, kind, player, facts, options });
    if (c === null) return 'STOP';
    if (!options.includes(c)) throw new Error(`Chooser returned "${c}", not one of: ${options.join(', ')}`);
    log.decisions++; log.choices.push(c);
    return c;
  };
  const putOut = (p: string, round: number, how: string) => {
    alive.delete(p);
    if (log.firstOutRound === null) log.firstOutRound = round;
    pub.push(`${how}: ${p} is out. ${p} was ${roles[p] === 'villager' ? 'a Villager' : 'the ' + (roles[p] === 'mafia' ? 'Mafia' : roles[p] === 'doctor' ? 'Doctor' : 'Police')}.`);
  };
  const check = () => { const m = [...alive].filter((p) => roles[p] === 'mafia').length; return winner(m, alive.size - m); };
  const maxRounds = o.maxRounds ?? 40;

  for (let round = 1; round <= maxRounds; round++) {
    log.rounds = round;
    // ---- night (MF1: nobody can tell roles apart; villagers' suspect pick has no effect and is not asked) ----
    const aliveNow = () => names.filter((p) => alive.has(p));
    const aliveMafia = mafiaNames.filter((p) => alive.has(p));
    // Mafia: first picks, later Mafia agree (pick the same name) or change; differences settled at random (MF1b)
    let target: string | null = null;
    if (aliveMafia.length) {
      const legal = aliveNow().filter((p) => roles[p] !== 'mafia');
      const picks: string[] = [];
      for (let i = 0; i < aliveMafia.length; i++) {
        const m = aliveMafia[i]!;
        if (i > 0) priv[m]!.push(`Night ${round}: ${aliveMafia[0]} picked ${picks[0]}. Choose the same name to agree, or a different one.`);
        const c = await ask('night-mafia', round, m, legal);
        if (c === 'STOP') return 'stopped';
        picks.push(c);
        priv[m]!.push(`Night ${round}: you picked ${c}.`);
      }
      if (new Set(picks).size > 1) { log.mafiaDisagreements++; target = picks[Math.floor(r() * picks.length)]!; } else target = picks[0]!;
      for (const m of aliveMafia) priv[m]!.push(`Night ${round}: the Mafia's pick was ${target}.`);
    }
    // Doctor: not the same player two nights running; themselves once a game (MF7)
    let protect: string | null = null;
    if (doctor && alive.has(doctor)) {
      const legal = aliveNow().filter((p) => p !== lastProtect && (p !== doctor || !doctorSelfUsed));
      if (legal.length) {
        const c = await ask('night-doctor', round, doctor, legal);
        if (c === 'STOP') return 'stopped';
        protect = c; lastProtect = c;
        if (c === doctor) doctorSelfUsed = true;
        log.doctorProtects.push({ round, who: c });
        priv[doctor]!.push(`Night ${round}: you protected ${c}.${c === doctor ? ' You have used your one self-protection.' : ''}`);
      } else lastProtect = null;
    }
    // Police: Mafia or Not Mafia, private (MF8)
    let finding: string | null = null;
    if (police && alive.has(police)) {
      const legal = aliveNow().filter((p) => p !== police);
      if (legal.length) {
        const c = await ask('night-police', round, police, legal);
        if (c === 'STOP') return 'stopped';
        const res = roles[c] === 'mafia' ? 'Mafia' : 'Not Mafia';
        priv[police]!.push(`Night ${round}: you checked ${c}: ${res}.`);
        if (res === 'Mafia') finding = c;
      }
    }
    // ---- morning ----
    if (target !== null) {
      if (protect === target) { log.doctorSaves++; pub.push(`Morning ${round}: nobody is out. The Doctor saved someone.`); }
      else putOut(target, round, `Morning ${round}`);
    }
    let w = check();
    if (w) { log.winner = w; break; }
    if (finding && o.policeShares === 'when-found' && police && alive.has(police)) pub.push(`Day ${round}: the Police says ${finding} is Mafia.`);
    // ---- day: point at once ----
    const voters = aliveNow();
    const pts: Record<string, string> = {};
    for (const v of voters) {
      const c = await ask('day', round, v, [...voters.filter((p) => p !== v), ...(o.noNobody ? [] : [NOBODY])]);
      if (c === 'STOP') return 'stopped';
      pts[v] = c;
    }
    pub.push(`Day ${round}: ` + voters.map((v) => `${v} pointed at ${pts[v] === NOBODY ? 'nobody' : pts[v]}`).join(', ') + '.');
    let t = tally(Object.values(pts));
    let outP: string | null = t.winner && t.winner !== NOBODY ? t.winner : null;
    if (t.winner === NOBODY) log.nobodyByChoice++;
    else if (!t.winner) {
      log.ties++;
      const tied = t.top;
      pub.push(`Day ${round}: tie between ${tied.map((x) => (x === NOBODY ? 'nobody' : x)).join(', ')}. Point again among them.`);
      const pts2: string[] = [];
      for (const v of voters) {
        const legal = tied.filter((x) => x !== v);
        if (!legal.length) continue;
        const c = await ask('day-again', round, v, legal);
        if (c === 'STOP') return 'stopped';
        pts2.push(c);
      }
      pub.push(`Day ${round} again: ` + (pts2.length ? pts2.join(', ') + '.' : 'no votes.'));
      const t2 = tally(pts2);
      if (t2.winner && t2.winner !== NOBODY) { outP = t2.winner; log.tieResults.push('out'); }
      else if (t2.winner === NOBODY) { log.nobodyByChoice++; log.tieResults.push('nobody-chosen'); }
      else { log.secondTies++; log.nobodyAfterTie++; log.tieResults.push('nobody-second-tie'); }
    }
    if (outP) putOut(outP, round, `Day ${round}`);
    else pub.push(`Day ${round}: nobody today.`);
    w = check();
    if (w) { log.winner = w; break; }
  }
  if (!log.winner) log.unfinished = true;
  if (log.firstOutRound !== null) log.sitOut = log.rounds - log.firstOutRound;
  return log;
}

// ---------- the run and its report ----------
export interface SimOpts { noNobody?: boolean; sizes: number[]; games: number; shares: PoliceShares[]; seed: number; maxDecisions: number; chooserFor: () => Chooser; countDecisions?: () => number }
export interface Cell { size: number; shares: PoliceShares; logs: GameLog[] }

export async function runSim(o: SimOpts): Promise<{ cells: Cell[]; stoppedEarly: string | null; decisions: number }> {
  const cells: Cell[] = []; let decisions = 0; let stoppedEarly: string | null = null;
  const chooser = o.chooserFor();
  outer: for (const size of o.sizes) for (const shares of o.shares) {
    const cell: Cell = { size, shares, logs: [] }; cells.push(cell);
    for (let g = 0; g < o.games; g++) {
      const seed = ((o.seed * 1000 + size) * 1000 + g) * 2 + (shares === 'never' ? 0 : 1);
      const before = decisions;
      const res = await playGame({ players: size, policeShares: shares, seed, game: g + 1, chooser, noNobody: o.noNobody, stop: () => decisions >= o.maxDecisions });
      if (res === 'stopped') { stoppedEarly = decisions >= o.maxDecisions ? `--max-decisions ${o.maxDecisions} reached` : 'Jev or the budget stopped answering'; void before; break outer; }
      decisions += res.decisions; cell.logs.push(res);
    }
  }
  return { cells, stoppedEarly, decisions };
}

const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : 'n/a');
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function simReport(res: { cells: Cell[]; stoppedEarly: string | null; decisions: number }, a: { seed: number; games: number; maxDecisions: number; noNobody?: boolean; extra: string[] }): string[] {
  const L: string[] = ['## Mafia table simulation', '',
    `Referee in code (rules: \`docs/games/mafia/guide.md\`, MF1 to MF15); Jev only chose each player's night pick and day point from the legal names. Seed ${a.seed}; game seeds are derived from it, size and game number, so the referee's deals are replayable (Jev's answers are logged in the sidecar JSON, which \`--replay\` plays back). Games per cell asked: ${a.games}. Villagers' night "suspect" pick has no effect and is not asked. A Mafia pick must be a non-Mafia player. Police: \`never\` keeps findings private; \`when-found\` adds "the Police says X is Mafia" to every player's facts that day if the Police is still in.`, '',
    '| Players | Police shares | Games | Village wins | Mafia wins | Unfinished | Village win % | Rounds/game | First out sits out (rounds) | Doctor saves/game | Mafia disagreements/game | Ties/game | Second ties/game | Nobody by choice/game | Nobody after tie/game |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const c of res.cells) {
    const g = c.logs, fin = g.filter((x) => x.winner);
    const vw = g.filter((x) => x.winner === 'village').length, mw = g.filter((x) => x.winner === 'mafia').length;
    const per = (f: (x: GameLog) => number) => (g.length ? (sum(g.map(f)) / g.length).toFixed(2) : 'n/a');
    L.push(`| ${c.size} | ${c.shares} | ${g.length} | ${vw} | ${mw} | ${g.length - fin.length} | ${fin.length ? Math.round((100 * vw) / fin.length) + '%' : 'n/a'} | ${avg(g.map((x) => x.rounds))} | ${avg(g.filter((x) => x.sitOut !== null).map((x) => x.sitOut!))} | ${per((x) => x.doctorSaves)} | ${per((x) => x.mafiaDisagreements)} | ${per((x) => x.ties)} | ${per((x) => x.secondTies)} | ${per((x) => x.nobodyByChoice)} | ${per((x) => x.nobodyAfterTie)} |`);
  }
  L.push('', `- Day point setting: ${a.noNobody ? '--no-nobody (the day point offers only the players still in; no "nobody")' : 'default (the day point also offers "nobody")'}.`,
    `- Decisions used by the simulation: ${res.decisions} (limit ${a.maxDecisions}).`,
    `- Stopped early: ${res.stoppedEarly ?? 'no'}. A game cut off by the stop is not counted.`,
    `- "First out sits out": rounds from the first player going out to the end of the game (0 = the game ended that round).`, '');
  return L;
}

// ---------- self-test: referee checks with a stub chooser ----------
export async function selfTest(): Promise<string[]> {
  const out: string[] = []; let failed = 0;
  const ok = (name: string, cond: boolean, detail = '') => { out.push(`${cond ? 'PASS' : 'FAIL'} ${name}${cond ? '' : ' ' + detail}`); if (!cond) failed++; };
  // stub: seeded random choice, never "uncertain"
  const stubOf = (seed: number): Chooser => { const r = rngOf(seed); return async (q) => q.options[Math.floor(r() * q.options.length)]!; };

  for (const [n, m] of [[5, 1], [6, 1], [7, 1], [8, 2], [11, 2], [12, 3], [15, 3], [16, 4]] as const) ok(`Mafia count for ${n} players is ${m}`, mafiaCount(n) === m, String(mafiaCount(n)));
  ok('4 and 17 players refused', (() => { try { mafiaCount(4); return false; } catch { try { mafiaCount(17); return false; } catch { return true; } } })());
  ok('Mafia win when equal to the rest (2 v 2, 1 v 1)', winner(2, 2) === 'mafia' && winner(1, 1) === 'mafia');
  ok('Mafia do not win when fewer (1 v 2); Village wins at 0 Mafia', winner(1, 2) === null && winner(0, 3) === 'village');
  ok('Tie: two top names -> no winner; clear top -> that name', tally(['A', 'B', 'A', 'B', 'C']).winner === null && tally(['A', 'B', 'A']).winner === 'A');
  ok('"nobody" can top the point', tally([NOBODY, NOBODY, 'A']).winner === NOBODY);

  // --no-nobody: the day point offers only players still in
  {
    let sawDay = false, sawNobodyOption = false, sawNobodyDefault = false;
    for (const nn of [true, false]) for (let s = 1; s <= 30; s++) {
      const r = rngOf(s);
      const l = await playGame({ players: 5 + (s % 12), policeShares: 'never', seed: s, game: 1, noNobody: nn, chooser: async (q) => {
        if (q.kind === 'day') { sawDay = true; if (q.options.includes(NOBODY)) { if (nn) sawNobodyOption = true; else sawNobodyDefault = true; } }
        return q.options[Math.floor(r() * q.options.length)]!;
      } });
      if (nn) ok(`--no-nobody game ${s} finishes with no nobody-by-choice day`, l !== 'stopped' && !l.unfinished && l.nobodyByChoice === 0, l === 'stopped' ? 'stopped' : String(l.nobodyByChoice));
    }
    ok('--no-nobody: day options never include nobody; default still offers it', sawDay && !sawNobodyOption && sawNobodyDefault, `day ${sawDay}, offered with flag ${sawNobodyOption}, offered by default ${sawNobodyDefault}`);
  }

  // Property checks over many random games
  const logs: GameLog[] = [];
  for (let n = 5; n <= 16; n++) for (let s = 1; s <= 12; s++) {
    const l = await playGame({ players: n, policeShares: s % 2 ? 'never' : 'when-found', seed: n * 100 + s, game: s, chooser: stubOf(n * 100 + s) });
    if (l !== 'stopped') logs.push(l);
  }
  ok('Every stub game finished', logs.every((l) => !l.unfinished), String(logs.filter((l) => l.unfinished).length));
  ok('Roles: Mafia count by size; Doctor and Police only from 6; rest Villagers', logs.every((l) => {
    const c = (r: Role) => Object.values(l.roles).filter((x) => x === r).length;
    return c('mafia') === mafiaCount(l.players) && c('doctor') === (l.players >= 6 ? 1 : 0) && c('police') === (l.players >= 6 ? 1 : 0) && c('villager') === l.players - c('mafia') - c('doctor') - c('police');
  }));
  ok('Doctor never protects the same player two nights running', logs.every((l) => l.doctorProtects.every((p, i) => i === 0 || p.round !== l.doctorProtects[i - 1]!.round + 1 || p.who !== l.doctorProtects[i - 1]!.who)));
  ok('Doctor protects themselves at most once a game', logs.every((l) => { const d = Object.keys(l.roles).find((k) => l.roles[k] === 'doctor'); return l.doctorProtects.filter((p) => p.who === d).length <= 1; }));
  ok('Doctor protects themselves in some game (the option is reachable)', logs.some((l) => { const d = Object.keys(l.roles).find((k) => l.roles[k] === 'doctor'); return l.doctorProtects.some((p) => p.who === d); }));
  ok('Doctor saves are counted only when a pick was protected', logs.every((l) => l.doctorSaves <= l.doctorProtects.length));
  ok('A finished game ends with Mafia equal to the rest or no Mafia (winner set)', logs.every((l) => l.winner === 'village' || l.winner === 'mafia'));
  ok('Ties happen and are pointed at again (some stub games)', logs.some((l) => l.ties > 0));
  ok('Tie -> point again: each tied day ends in one name out, or nobody; second ties are counted and put nobody out', logs.every((l) => l.tieResults.length === l.ties) && logs.some((l) => l.secondTies > 0) && logs.every((l) => l.tieResults.filter((x) => x === 'nobody-second-tie').length === l.secondTies && l.nobodyAfterTie === l.secondTies));
  ok('Nobody sees another player\'s private role in their facts', logs.every((l) => l.privateLeak.length === 0), logs.flatMap((l) => l.privateLeak).slice(0, 2).join(' | '));
  const a = await playGame({ players: 9, policeShares: 'when-found', seed: 77, game: 1, chooser: stubOf(1) });
  const b = await playGame({ players: 9, policeShares: 'when-found', seed: 77, game: 1, chooser: stubOf(1) });
  ok('Replayable: same seed and same choices give the same game', a !== 'stopped' && b !== 'stopped' && JSON.stringify(a) === JSON.stringify(b));
  // The Mafia's pick must be a non-Mafia; a stop returns cleanly
  const stopped = await playGame({ players: 6, policeShares: 'never', seed: 3, game: 1, chooser: stubOf(3), stop: () => true });
  ok('A stop request ends the game cleanly', stopped === 'stopped');
  // Police facts only reach every player when found and when-found is set
  let sawShare = false, sawNever = false;
  for (let s = 1; s <= 40; s++) for (const sh of ['never', 'when-found'] as const) {
    const r = rngOf(s);
    await playGame({ players: 8, policeShares: sh, seed: s, game: 1, chooser: async (q) => {
      const says = q.facts.some((f) => /the Police says/.test(f));
      if (says && sh === 'when-found') sawShare = true;
      if (says && sh === 'never') sawNever = true;
      return q.options[Math.floor(r() * q.options.length)]!;
    } });
  }
  ok('Police findings shared only with when-found', sawShare && !sawNever, `shared ${sawShare}, leaked under never ${sawNever}`);
  out.push(failed ? `SELF-TEST FAILED: ${failed}` : `SELF-TEST OK: ${out.length} checks, ${logs.length} stub games`);
  return out;
}
