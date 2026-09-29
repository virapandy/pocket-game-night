// Tambola with phone tickets (Phase 2) against the shared contract suite: repeatable from both seeds
// (draw and sheet), neither seed in any view but the host's (TAM-052, TAM-053), no accepted illegal moves,
// always ends, undo replays cleanly. Moves: tests/games/tambola/README.md, "Phase 2: phone tickets".
import type { Rng } from '../../src/engine';
import { rules, type Pattern } from '../games/tambola/helpers';
import { phoneSetup } from '../games/tambola/phone';
import { contractSuite } from './suite';

/* eslint-disable @typescript-eslint/no-explicit-any */
const PLAYERS = [
  { id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha', tickets: 1 }, { id: 'p3', name: 'Dad', tickets: 3 },
  { id: 'p4', name: 'Kabir', tickets: 1 }, { id: 'p5', name: 'Meera', tickets: 2 },
];
const TICKETS = 9;

contractSuite('Tambola, phone tickets', {
  rules,
  makeSetup: (seed) => phoneSetup({ seed: `draw-${seed}-secret`, sheetSeed: `sheet-${seed}-secret`, players: PLAYERS }),
  viewers: () => [{ kind: 'room' }, ...PLAYERS.map((p) => ({ kind: 'player' as const, playerId: p.id }))],
  chooseMove(match, rng: Rng) {
    const host = rules.view(match.state, { kind: 'host' });
    const called: number[] = host.called;
    const legal = rules.legalMoves(match.state, 'host');
    const closes = legal.filter((m: any) => m.type === 'close-tier');
    const ticket = () => 1 + rng.int(TICKETS);
    if (closes.length) {
      const pattern = closes[0].pattern as Pattern;
      // TAM-041: sometimes another ticket claims the same tier before it is closed.
      if (rng.int(4) === 0) return { type: 'check-claim', ticket: ticket(), pattern };
      return closes[rng.int(closes.length)];
    }
    if (host.readyToEnd) return { type: 'end' };
    if (called.length === 90) {
      return rng.int(2) === 0 && host.openPatterns.includes('full-house')
        ? { type: 'check-claim', ticket: ticket(), pattern: 'full-house' }
        : { type: 'end' };
    }
    const roll = rng.int(100);
    if (roll < 80 || called.length === 0) return { type: 'call' };
    if (roll < 82) return { type: 'assign', ticket: ticket(), playerId: PLAYERS[rng.int(PLAYERS.length)]!.id }; // TAM-175
    if (roll < 83) return { type: 'to-paper', playerId: PLAYERS[rng.int(PLAYERS.length)]!.id }; // TAM-058
    const open: Pattern[] = host.openPatterns;
    if (open.length === 0) return { type: 'call' };
    return { type: 'check-claim', ticket: ticket(), pattern: open[rng.int(open.length)]! };
  },
  junkMoves: [
    { type: 'nonsense' },
    { type: 'check-claim', ticket: 0, pattern: 'top-line' },
    { type: 'check-claim', ticket: 99, pattern: 'top-line' },
    { type: 'check-claim', ticket: 1, pattern: 'lucky-seven' },
    { type: 'check-claim', ticket: '1', pattern: 'top-line' },
    { type: 'assign', ticket: 1, playerId: 'ghost' },
    { type: 'assign', ticket: 99, playerId: 'p1' },
    { type: 'to-paper', playerId: 'ghost' },
    { type: 'record-win', pattern: 'lucky-seven', playerIds: ['p1'] },
  ],
  maxMoves: 400,
});
