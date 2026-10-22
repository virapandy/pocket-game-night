// One-off (not part of npm test): deals 30 Full and 30 Easy boards (Whole family) with the engine and writes
// boards.json to the exchange folder. See README.md in the exchange folder.
//   SIM_MODE=deal npx vitest run --config tests/tools/sim-table/vitest.config.ts deal
import { mkdirSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { EXCHANGE, startEvening, toSimKind, toSimTeam, type BoardRecord, type Size } from './common';

const N = 30;

it.runIf(process.env.SIM_MODE === 'deal')('deal boards', () => {
  const boards: BoardRecord[] = [];
  for (const size of ['full', 'easy'] as Size[]) {
    for (let i = 1; i <= N; i++) {
      const id = `${size}-${String(i).padStart(2, '0')}`;
      // Full boards alternate the two Landmine rules (odd: Lose the game, even: Lose your turn); Easy has no Landmine.
      const rule: 'lose' | 'turn' = size === 'full' && i % 2 === 0 ? 'turn' : 'lose';
      const seed = `sim-table-${id}`;
      const ev = startEvening(seed, size, rule);
      const deal = ev.legal().find((m) => m.type === 'deal');
      if (!deal || !ev.try(deal)) throw new Error(`${id}: deal refused: ${ev.lastReason}`);
      const g = ev.state.game;
      const rows = size === 'full' ? 5 : 4;
      const words: string[] = [...g.words];
      const kinds = g.kinds.map(toSimKind);
      if (new Set(words).size !== words.length) throw new Error(`${id}: a word is on the board twice`);
      if (size === 'easy' && kinds.includes('landmine')) throw new Error(`${id}: Easy has a Landmine`);
      boards.push({
        id, size, landmineRule: size === 'easy' ? 'none' : rule, seed, code: g.code, first: toSimTeam(g.starts), rows,
        grid: Array.from({ length: rows }, (_, r) => words.slice(r * rows, r * rows + rows)),
        words, kinds, map: Object.fromEntries(words.map((w, k) => [w, kinds[k]!])),
      });
    }
  }
  mkdirSync(EXCHANGE, { recursive: true });
  writeFileSync(`${EXCHANGE}/boards.json`, JSON.stringify({
    note: 'team1 = orange team, team2 = teal team. map/kinds say what each word is. Plain data only.',
    engineCommit: 'b5f030b', words: 'Whole family', boards,
  }, null, 1));
});
