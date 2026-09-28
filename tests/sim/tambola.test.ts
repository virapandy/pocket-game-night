// TAM-077: every game ends. Thousands of simulated paper-ticket games with players who claim on time,
// late, falsely or never. TAM-074: a failing game is saved to tests/replays/ as a permanent test.
import { describe, expect, it } from 'vitest';
import { moneyProblems, replay } from '../../src/engine';
import { rules } from '../games/tambola/helpers';
import { makeTicket, saveReplay, simulate } from './tambola-sim';
import { createRng } from '../../src/engine';

const GAMES = Number(process.env.SIM_GAMES ?? 2000);

describe('The simulation harness itself', () => {
  it('makes valid-looking paper tickets: 3 rows of 5, numbers in column ranges, all 9 columns used', () => {
    const rng = createRng('tickets');
    for (let i = 0; i < 500; i++) {
      const t = makeTicket(rng);
      expect(t.map((r) => r.length)).toEqual([5, 5, 5]);
      expect(new Set(t.flat()).size).toBe(15);
      const col = (n: number) => (n === 90 ? 8 : Math.floor(n / 10));
      expect(new Set(t.flat().map(col)).size).toBe(9);
      for (const row of t) expect(new Set(row.map(col)).size).toBe(5);
    }
  });
});

describe('TAM-077: every game ends', () => {
  it(`${GAMES} simulated games all end, keep every rule, and balance the money`, () => {
    const failures: string[] = [];
    for (let i = 0; i < GAMES; i++) {
      const seed = `sim-${i}`;
      const result = simulate(seed);
      const problems = [...result.problems];
      if (problems.length === 0) {
        const summary = rules.view(result.match.state, { kind: 'host' }).summary;
        if (!summary) problems.push('no summary at the end');
        else if (summary.money && moneyProblems(summary.money).length) problems.push(...moneyProblems(summary.money));
        const again = replay(rules, result.match.setup, result.match.records);
        if (!again.ok) problems.push(`replay failed: ${again.reason}`);
        else if (JSON.stringify(again.value.state) !== JSON.stringify(result.match.state)) problems.push('replay differs (TAM-073)');
      }
      if (problems.length) {
        const file = saveReplay(result, problems.join('; '));
        failures.push(`${seed}: ${problems[0]} (saved ${file.split('/tests/')[1]})`);
        if (failures.length >= 5) break;
      }
    }
    expect(failures).toEqual([]);
  });
});
