// What Am I? against the shared contract suite (PLT-100 onwards; seeds never leave the host phone). Written before the
// build, 24 October 2026 (specs/what-am-i/api.md). The driver taps through game nights as a host would: marks from
// `legalMoves`, starts and people changes as detail moves, a few games, then "End for tonight".
// Ahead of the build (src/games/what-am-i missing) only the registration check below runs, through `wit`, and it must
// fail with "not built yet"; the suite itself joins once the rules exist.
import { expect } from 'vitest';
import { HOST, type Match, type Rng } from '../../src/engine';
import { AHEAD, NAMES, choices, need, setupInput, wit } from '../games/what-am-i/helpers';
import { contractSuite } from './suite';

/* eslint-disable @typescript-eslint/no-explicit-any */
let rules: any = null;
try { rules = need('whatAmIRules'); } catch { rules = null; }

wit('What Am I? registers its rules for the contract suite (whatAmIRules, id "what-am-i", the detail moves of api.md)', () => {
  const r = need('whatAmIRules');
  expect(r.id).toBe('what-am-i');
  expect([...r.detailMoves].sort()).toEqual(['addPlayer', 'reorder', 'setChoices', 'setHold', 'setPlayers', 'start']);
});

const C = choices();
const JUNK: any[] = [
  { type: 'nonsense' },
  { type: 'got', word: 'WAIW-999' },
  { type: 'fix', word: 'WAIW-999' },
  { type: 'start', players: ['Riya'], choices: C },
  { type: 'start', players: Array.from({ length: 21 }, (_, i) => `P${i}`), choices: C },
  { type: 'addPlayer', name: '' },
  { type: 'reorder', order: ['Nobody', 'Here'] },
];

function choose(match: Match<any, any, any>, rng: Rng): any {
  const v = rules.view(match.state, { kind: 'host' });
  const legal: any[] = rules.legalMoves(match.state, HOST) ?? [];
  const games = match.records.filter((r) => r.move.type === 'start').length;
  if (v.step === 'ended') return null;
  if (v.step === 'new' || v.step === 'gameOver') {
    if (games >= 3 || (games > 0 && rng.int(3) === 0)) return legal.find((m) => m.type === 'endEvening') ?? null;
    const players = NAMES.slice(0, 2 + rng.int(5));
    const packs = ['mix', 'Animals', 'Food', 'Jobs', 'Famous Indians'];
    return { type: 'start', players, choices: choices({ pack: packs[rng.int(packs.length)] as any, nonveg: rng.int(2) === 0 }) };
  }
  if (v.round > 3 && rng.int(4) === 0) return { type: 'endGame' };
  const pool: any[] = [];
  for (const m of legal) {
    if (m.type === 'endGame') { if (rng.int(150) === 0) pool.push(m); }
    else if (m.type === 'endEvening') continue;
    else if (m.type === 'timeUp') { if (rng.int(6) === 0) pool.push(m); }
    else pool.push(m);
  }
  if (v.step === 'pass' && rng.int(30) === 0) pool.push({ type: 'addPlayer', name: `New${match.records.length}` });
  if (v.step === 'pass' && rng.int(30) === 0) pool.push({ type: 'setHold', player: v.player, hold: rng.int(2) ? 'free' : 'hand' });
  if (pool.length === 0) return null;
  return pool[rng.int(pool.length)];
}

if (rules && !AHEAD) {
  contractSuite('What Am I?', {
    rules,
    makeSetup: (seed) => setupInput({ seed: `words-${seed}-secret` }),
    viewers: () => [{ kind: 'room' }],
    chooseMove: choose,
    junkMoves: JUNK,
    maxMoves: 4000,
  });
}
