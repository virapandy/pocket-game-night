// Tambola against the shared contract suite.
import { expect, it } from 'vitest';
import type { Rng } from '../../src/engine';
import { tambola } from '../../src/games/tambola';
import { NEEDS, rules, setupInput, type Pattern } from '../games/tambola/helpers';
import { contractSuite } from './suite';

/* eslint-disable @typescript-eslint/no-explicit-any */
it('Tambola registers its rules for the contract suite (tambola.rules)', () => {
  expect(rules, 'tambolaRules is not exported yet').toBeDefined();
  expect((tambola as any).rules).toBe(rules);
});

contractSuite('Tambola', {
  rules,
  makeSetup: (seed) => setupInput({ seed: `draw-${seed}-secret` }),
  viewers: (setup) => [{ kind: 'room' }, ...setup.config.players.map((p: any) => ({ kind: 'player' as const, playerId: p.id }))],
  chooseMove(match, rng: Rng) {
    const host = rules.view(match.state, { kind: 'host' });
    const called: number[] = host.called;
    if (called.length === 90) {
      // TAM-076: everything is out. Check one more claim sometimes, then end.
      return rng.int(2) === 0 && host.openPatterns.includes('full-house')
        ? { type: 'claim', playerId: 'p1', pattern: 'full-house', numbers: called.slice(-15) }
        : { type: 'end' };
    }
    const roll = rng.int(100);
    if (roll < 80 || called.length === 0) return { type: 'call' };
    if (roll < 83) return { type: 'another-rhyme' };
    const open: Pattern[] = host.openPatterns;
    if (open.length === 0) return { type: 'call' };
    const pattern = open[rng.int(open.length)]!;
    const need = NEEDS[pattern];
    const playerId = `p${1 + rng.int(6)}`;
    // On time, late, or with a number never called.
    const kind = rng.int(3);
    const pool = Array.from({ length: 90 }, (_, i) => i + 1);
    const numbers =
      called.length < need
        ? pool.slice(0, need)
        : kind === 0
          ? called.slice(-need)
          : kind === 1 && called.length > need
            ? called.slice(-need - 1, -1)
            : [...called.slice(-need + 1), pool.find((n) => !called.includes(n))!];
    return { type: 'claim', playerId, pattern, numbers };
  },
  junkMoves: [
    { type: 'nonsense' },
    { type: 'claim', playerId: 'p1', pattern: 'top-line', numbers: [1, 2, 3] },
    { type: 'claim', playerId: 'p1', pattern: 'lucky-seven', numbers: [1, 2, 3, 4, 5, 6, 7] },
    { type: 'claim', playerId: 'ghost', pattern: 'early-five', numbers: [1, 2, 3, 4, 5] },
    { type: 'claim', playerId: 'p1', pattern: 'early-five', numbers: [0, 91, 3, 4, 5] },
    { type: 'rename', playerId: 'p1', name: 'Asha' },
    { type: 'edit-tier', pattern: 'top-line', amount: 1 },
  ],
  maxMoves: 400,
});
