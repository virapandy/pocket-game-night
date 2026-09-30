// TAM-074: every game that ever failed is kept here as seeds plus move records, and must now replay
// cleanly: the moves are accepted and every rule holds; a simulated game also re-runs from its seed. Never delete a replay file.
// PLT-204: a problem report that shows a confirmed bug is saved here as it arrived, `{ "note": "...", "report": <the
// report's JSON> }`, and is replayed from the report's own seeds and moves (tests/contract/README.md, "Problem reports").
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { moneyProblems, replay } from '../../src/engine';
import { rules } from '../games/tambola/helpers';
import { simulate } from '../sim/tambola-sim';
import { playGame } from '../sim/mass';

const dir = fileURLToPath(new URL('.', import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

describe('Saved replays (TAM-074)', () => {
  it('the replay folder is readable', () => {
    expect(Array.isArray(files)).toBe(true);
  });

  for (const file of files) {
    it(`${file} replays cleanly`, async () => {
      const raw = JSON.parse(readFileSync(dir + file, 'utf8'));
      const saved = raw.report
        ? { game: raw.report.game?.gameType, setup: raw.report.game?.setup, records: raw.report.game?.records, note: raw.note, expect: raw.expect }
        : raw;
      expect(saved.game).toBe('tambola');
      const r = replay(rules, saved.setup, saved.records);
      if (!r.ok) expect.fail(`${file}: ${r.reason}. Saved because: ${saved.note}`);
      expect(rules.invariants(r.value.state)).toEqual([]);
      if (saved.expect?.over !== undefined) expect(rules.isOver(r.value.state)).toBe(saved.expect.over);
      // A game found by the simulation is also played again from its seed: it must now have no problems.
      if (saved.sim) expect(simulate(saved.sim).problems, `Saved because: ${saved.note}`).toEqual([]);
      // A game found by the mass simulation (PLT-116) is played again from its seed too.
      if (saved.massSim) expect((await playGame(saved.massSim)).problems, `Saved because: ${saved.note}`).toEqual([]);
      const summary = rules.view(r.value.state, { kind: 'host' }).summary;
      if (summary?.money) expect(moneyProblems(summary.money)).toEqual([]);
    });
  }
});
