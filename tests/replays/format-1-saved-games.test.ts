// PLT-014: old games still open after an app update. The fixture is real saved data written by the Phase 1a
// app (format 1, before sessions existed): one finished game and one game in progress. Every later version must
// still read them and replay them move for move. The browser side is tests/browser/format-1.spec.ts.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { moneyProblems, readSavedGame, replay } from '../../src/engine';
import { rules } from '../games/tambola/helpers';

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/phase-1a-saved-games.json', import.meta.url)), 'utf8'),
);
const saved = (id: string) => JSON.parse(fixture.localStorage[`pgn.game.${id}`]);

describe('PLT-014: format-1 Tambola games saved by the Phase 1a app still open', () => {
  for (const which of ['ended', 'inProgress'] as const) {
    const { id } = fixture.expect[which];

    it(`the ${which === 'ended' ? 'finished' : 'in-progress'} game reads and replays cleanly`, () => {
      const raw = saved(id);
      expect(raw.format).toBe(1);
      const r = readSavedGame(raw);
      if (!r.ok) expect.fail(`format-1 game refused: ${r.reason}`);
      const game = r.game;
      expect(game.id).toBe(id);
      expect(game.gameType).toBe('tambola');
      const played = replay(rules, game.setup as never, game.records as never);
      if (!played.ok) expect.fail(`format-1 game does not replay: ${played.reason}`);
      expect(rules.invariants(played.value.state)).toEqual([]);
      expect(rules.isOver(played.value.state)).toBe(which === 'ended');
      const summary = rules.view(played.value.state, { kind: 'host' }).summary;
      if (summary?.money) expect(moneyProblems(summary.money)).toEqual([]);
    });
  }
});
