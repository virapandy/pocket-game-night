// The shared contract suite: every registered game must pass it (tests/CLAUDE.md, PLT-100 onwards).
// Repeatable from seeds, no leaked secrets, no accepted illegal moves, always ends, undo replays cleanly.
// A game plugs in with a small driver; Tambola's is in tambola.test.ts.
import { describe, expect, it } from 'vitest';
import {
  createRng, HOST, play, replay, startMatch, undo, type GameRules, type Match, type Move, type Rng, type SetupInput, type Viewer,
} from '../../src/engine';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ContractDriver {
  rules: GameRules<any, any, any, any>;
  /** A complete setup for this seed, with every secret seed filled in. */
  makeSetup(seed: string): SetupInput<any>;
  /** Everyone other than the host who can look at the game. */
  viewers(setup: SetupInput<any>): Viewer[];
  /** A move to try next: usually a legal one, sometimes a detail move. Null means "nothing to do". */
  chooseMove(match: Match<any, any, any>, rng: Rng): Move | null;
  /** Moves that must always be refused. */
  junkMoves: Move[];
  /** The most moves a game can take before it must have ended. */
  maxMoves: number;
}

const GAMES = 60;

/** Plays one game with the driver's choices. Every move is one second after the last. */
export function playOut(d: ContractDriver, seed: string) {
  const setup = d.makeSetup(seed);
  const rng = createRng(`choices:${seed}`);
  let m = startMatch(d.rules, setup, 0);
  let at = 0;
  let refused = 0;
  for (let i = 0; i < d.maxMoves && !d.rules.isOver(m.state); i++) {
    const move = d.chooseMove(m, rng);
    if (!move) break;
    const r = play(d.rules, m, move, { by: HOST, at: (at += 1000) });
    if (r.ok) m = r.value;
    else refused++;
  }
  return { match: m, refused };
}

export function contractSuite(name: string, d: ContractDriver) {
  describe(`Contract suite: ${name}`, () => {
    it('is repeatable: the same seeds and choices give the same game (TAM-073)', () => {
      for (let i = 0; i < 10; i++) {
        const a = playOut(d, `repeat-${i}`).match;
        const b = playOut(d, `repeat-${i}`).match;
        expect(b.records).toEqual(a.records);
        expect(b.state).toEqual(a.state);
      }
    });

    it('never shows a secret seed to anyone but the host (TAM-052)', () => {
      for (let i = 0; i < GAMES; i++) {
        const { match } = playOut(d, `secret-${i}`);
        const secrets = Object.values(match.setup.seeds);
        for (const viewer of d.viewers(match.setup)) {
          const seen = JSON.stringify(d.rules.view(match.state, viewer));
          for (const s of secrets) expect(seen, `${JSON.stringify(viewer)} sees a seed`).not.toContain(s);
        }
      }
    });

    it('never accepts an illegal move, and every accepted move keeps the invariants', () => {
      for (let i = 0; i < GAMES; i++) {
        const { match } = playOut(d, `illegal-${i}`);
        expect(d.rules.invariants(match.state)).toEqual([]);
        for (const junk of d.junkMoves) {
          const r = d.rules.apply(match.state, junk as any, { by: HOST, at: 10_000_000 });
          if (r.ok) expect.fail(`accepted ${JSON.stringify(junk)}`);
        }
      }
    });

    it(`always ends within ${d.maxMoves} moves (TAM-077)`, () => {
      for (let i = 0; i < GAMES; i++) {
        const { match } = playOut(d, `ends-${i}`);
        expect(d.rules.isOver(match.state), `game ends-${i} did not end`).toBe(true);
        expect(d.rules.legalMoves(match.state, HOST)).toEqual([]);
      }
    });

    it('undo replays cleanly: the result is exactly the game replayed without that move', () => {
      for (let i = 0; i < 20; i++) {
        const { match } = playOut(d, `undo-${i}`);
        for (const record of match.records) {
          const now = record.at + 1;
          const u = undo(d.rules, match, record.seq, { by: HOST, now });
          if (!u.ok) continue;
          const expected = replay(d.rules, match.setup, match.records.filter((r) => r.seq !== record.seq));
          expect(expected.ok).toBe(true);
          if (expected.ok) expect(u.value.state).toEqual(expected.value.state);
          expect(d.rules.invariants(u.value.state)).toEqual([]);
        }
      }
    });
  });
}
