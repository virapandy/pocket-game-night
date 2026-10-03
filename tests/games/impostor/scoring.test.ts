// Impostor scoring (specs/impostor/05-scoring.md, C3): IMP-041 and IMP-042 through `scoreRound` (Test hooks item 1).
// What the result block shows (IMP-040, IMP-043, IMP-044) is checked in tests/browser/impostor-scoring.spec.ts.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, undo } from '../../../src/engine';
import { Evening, NAMES, P4, changedChoices, expectedPoints, randomOutcome, scoreRound, type RoundFacts } from './helpers';

describe('IMP-041: points when keeping score', () => {
  it('escaped (wrong person or "Still a tie"): the impostor +2, nobody else', () => {
    expect(scoreRound({ impostor: 'Arjun', caught: false, guessedRight: null }, P4)).toEqual({ Riya: 0, Arjun: 2, Meena: 0, Kabir: 0 });
  });
  it('caught and "Guessed right": the impostor +1, nobody else', () => {
    expect(scoreRound({ impostor: 'Arjun', caught: true, guessedRight: true }, P4)).toEqual({ Riya: 0, Arjun: 1, Meena: 0, Kabir: 0 });
  });
  it('caught and "Wrong guess": every crew member of that round +1, the impostor 0', () => {
    expect(scoreRound({ impostor: 'Arjun', caught: true, guessedRight: false }, P4)).toEqual({ Riya: 1, Arjun: 0, Meena: 1, Kabir: 1 });
  });
  it('every player of the round is listed, with 0 when they got no points', () => {
    const players = NAMES.slice(0, 12);
    const r = scoreRound({ impostor: 'Dev', caught: false, guessedRight: null }, players);
    expect(Object.keys(r).sort()).toEqual([...players].sort());
  });
});

describe('IMP-042: points always add up', () => {
  it('property: scoreRound gives exactly IMP-041\'s points for every outcome and every group of 3 to 20 players', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 20 }), fc.nat(), fc.constantFrom('escaped', 'right', 'wrong'),
        (n, k, kind) => {
          const players = NAMES.slice(0, n);
          const impostor = players[k % n]!;
          const caught = kind !== 'escaped';
          const r = scoreRound({ impostor, caught, guessedRight: caught ? kind === 'right' : null }, players);
          const want = Object.fromEntries(players.map((p) => [p, kind === 'escaped' ? (p === impostor ? 2 : 0) : kind === 'right' ? (p === impostor ? 1 : 0) : p === impostor ? 0 : 1]));
          expect(r).toEqual(want);
        },
      ),
      { numRuns: 2000 },
    );
  });

  it('property (1,000 seeded evenings of 1 to 30 rounds, 3 to 12 players, random outcomes, verdicts, undos, joins and leaves): each round\'s points equal scoreRound for its outcome (the evening totals are checked on screen: see tests/games/impostor/README.md)', () => {
    for (let i = 0; i < 1000; i++) {
      const rng = createRng(`imp042-${i}`);
      const n = 3 + rng.int(10);
      let players = NAMES.slice(0, n);
      const e = new Evening({ seed: `imp042-seed-${i}`, players, choices: { score: rng.int(2) === 0 } });
      let score = e.match.setup.config.choices.score as boolean;
      const totals: Record<string, number> = {};
      const rounds = 1 + rng.int(30);
      e.startDeal(rng.int(4) === 0);
      for (let r = 0; r < rounds; r++) {
        const practice = e.host().practice as boolean;
        const facts: RoundFacts = e.playRound(randomOutcome(rng));
        if (facts.outcome.kind === 'caught' && rng.int(4) === 0) {
          // "Undo" the verdict and tap the other one.
          const seq = e.match.records.at(-1)!.seq;
          const u = e.rules.canUndo(e.state, { record: e.match.records.at(-1)!, by: 'host', now: e.at + 1 });
          expect(u, `evening imp042-${i}: the verdict can be undone`).toBe(true);
          const res = undo(e.rules, e.match, seq, { by: 'host', now: e.at + 1 });
          expect(res.ok).toBe(true);
          if (res.ok) e.match = res.value;
          const right = !facts.outcome.right;
          e.must({ type: 'verdict', right });
          facts.outcome = { kind: 'caught', right };
        }
        if (score && !practice) {
          const got = scoreRound(
            { impostor: facts.impostor, caught: facts.outcome.kind === 'caught', guessedRight: facts.outcome.kind === 'caught' ? facts.outcome.right : null },
            players,
          );
          const want = expectedPoints(facts, players);
          expect(got, `evening imp042-${i} round ${r}`).toEqual(want);
          for (const [p, v] of Object.entries(got)) totals[p] = (totals[p] ?? 0) + v;
        }
        // Between rounds: sometimes someone joins or leaves, or the Score choice flips.
        const roll = rng.int(10);
        if (roll === 0 && players.length < 12) {
          players = [...players, NAMES[12 + rng.int(8)]!].filter((p, k, a) => a.indexOf(p) === k);
          e.must({ type: 'setPlayers', players });
        } else if (roll === 1 && players.length > 3) {
          const gone = rng.int(players.length);
          players = players.filter((_, k) => k !== gone);
          e.must({ type: 'setPlayers', players });
        } else if (roll === 2) {
          score = !score;
          e.must({ type: 'setChoices', choices: changedChoices({ score }) });
        }
        if (r < rounds - 1) e.nextRound();
      }
      expect(Object.values(totals).every((v) => Number.isInteger(v) && v >= 0), `evening imp042-${i}: totals are whole and not negative`).toBe(true);
    }
  });
});
