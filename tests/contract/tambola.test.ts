// Tambola against the shared contract suite.
import { expect, it } from 'vitest';
import type { Rng } from '../../src/engine';
import { tambola } from '../../src/games/tambola';
import { rules, setupInput, type Pattern } from '../games/tambola/helpers';
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
    const legal = rules.legalMoves(match.state, 'host');
    const someone = () => `p${1 + rng.int(6)}`;
    // TAM-145: a won tier waits to be closed; sometimes record another winner first. TAM-075: then the host ends.
    const closes = legal.filter((m: any) => m.type === 'close-tier');
    if (closes.length) {
      const pattern = closes[0].pattern as Pattern;
      if (rng.int(4) === 0) return { type: 'record-win', pattern, playerIds: [someone()] };
      return closes[rng.int(closes.length)];
    }
    if (host.readyToEnd) return { type: 'end' };
    if (called.length === 90) {
      // TAM-076: everything is out. Record one more win sometimes, then end.
      return rng.int(2) === 0 && host.openPatterns.includes('full-house')
        ? { type: 'record-win', pattern: 'full-house', playerIds: ['p1'] }
        : { type: 'end' };
    }
    const roll = rng.int(100);
    if (roll < 85 || called.length === 0) return { type: 'call' };
    if (roll < 88) return { type: 'another-rhyme' };
    const open: Pattern[] = host.openPatterns;
    if (open.length === 0) return { type: 'call' };
    const pattern = open[rng.int(open.length)]!;
    // TAM-037: the anchor rules; the host records a win (sometimes a tie) or a bogey.
    const kind = rng.int(3);
    if (kind === 0) return { type: 'record-bogey', playerId: someone(), pattern };
    const first = someone();
    const second = someone();
    return { type: 'record-win', pattern, playerIds: kind === 2 && second !== first ? [first, second] : [first] };
  },
  junkMoves: [
    { type: 'nonsense' },
    { type: 'record-win', pattern: 'top-line', playerIds: [] },
    { type: 'record-win', pattern: 'lucky-seven', playerIds: ['p1'] },
    { type: 'record-win', pattern: 'early-five', playerIds: ['ghost'] },
    { type: 'record-win', pattern: 'early-five', playerIds: ['p1', 'p1'] },
    { type: 'record-bogey', playerId: 'ghost', pattern: 'early-five' },
    { type: 'rename', playerId: 'p1', name: 'Asha' },
    { type: 'edit-tier', pattern: 'top-line', amount: 1 },
    { type: 'close-tier', pattern: 'lucky-seven' },
  ],
  maxMoves: 400,
});
