// Mafia against the shared contract suite (PLT-100 onwards; MAF-016: views keep every secret; seeds never leave the
// host). Written before the build, 25 October 2026. The driver taps through game nights as a host would, following
// specs/mafia/api.md: `start` (a detail move) with random names and an allowed count, then moves from `legalMoves`,
// sometimes a `tie` or an `addNext` (detail moves), a few games, then "End for tonight".
import { expect, it } from 'vitest';
import { HOST, type Match, type Rng } from '../../src/engine';
import { POOL, need, oracleCounts, setupInput } from '../games/mafia/helpers';
import { contractSuite } from './suite';

/* eslint-disable @typescript-eslint/no-explicit-any */
let rules: any = null;
let notBuilt: unknown = null;
try { rules = need('mafiaRules'); } catch (e) { notBuilt = e; }
it('Mafia registers its rules for the contract suite (mafiaRules)', () => { if (notBuilt) throw notBuilt; });

const JUNK: any[] = [
  { type: 'nonsense' },
  { type: 'start', players: ['Riya', 'Arjun', 'Meena'], mafiaCount: 1 },
  { type: 'nightPick', player: 'Nobody', target: 'Riya' },
  { type: 'voteOut', player: 'Nobody' },
  { type: 'startNight', night: 99 },
  { type: 'tie', players: ['Riya'] },
  { type: 'voteNobody', reason: 'bored' },
  { type: 'addNext', name: '' },
];

function choose(match: Match<any, any, any>, rng: Rng): any {
  const room = rules.view(match.state, { kind: 'room' });
  const legal: any[] = rules.legalMoves(match.state, HOST) ?? [];
  if (room.step === 'idle') {
    const n = 5 + rng.int(12);
    const allowed = oracleCounts(n).allowed;
    const start = rng.int(POOL.length - n + 1);
    return { type: 'start', players: POOL.slice(start, start + n), mafiaCount: allowed[rng.int(allowed.length)] };
  }
  if (legal.length === 0) return null;
  if (room.step === 'gameOver') {
    const again = legal.find((m) => m.type === 'start');
    if (!again || room.games >= 3 || rng.int(3) === 0) return legal.find((m) => m.type === 'endEvening') ?? null;
    return again;
  }
  if (room.step === 'day' && rng.int(5) === 0 && room.in.length >= 2) {
    const a = room.in[rng.int(room.in.length)], b = room.in[rng.int(room.in.length)];
    if (a !== b) return { type: 'tie', players: [a, b] };
  }
  if (rng.int(150) === 0) return { type: 'addNext', name: `Guest${rng.int(1000)}` };
  const pool: any[] = [];
  for (const m of legal) {
    if (m.type === 'endGame') { if (rng.int(100) === 0) pool.push(m); }
    else if (m.type === 'leave') { if (rng.int(30) === 0) pool.push(m); }
    else pool.push(m);
  }
  if (pool.length === 0) return legal[rng.int(legal.length)];
  return pool[rng.int(pool.length)];
}

if (rules) {
  contractSuite('Mafia', {
    rules,
    makeSetup: (seed) => setupInput({ seed: `roles-${seed}-secret` }),
    viewers: () => [{ kind: 'room' }, ...POOL.map((p) => ({ kind: 'player' as const, playerId: p }))],
    chooseMove: choose,
    junkMoves: JUNK,
    maxMoves: 4000,
  });

  it('mafiaRules has the id "mafia" and start, tie and addNext are detail moves (MAF-H1)', () => {
    expect(rules.id).toBe('mafia');
    expect([...rules.detailMoves].sort()).toEqual(['addNext', 'start', 'tie']);
  });
}
