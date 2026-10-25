// After the What Am I? screen evenings (tests/sims/what-am-i-runner.ts): every evening's last saved game night is replayed
// through the real rules engine, and every in-game scoreboard that was on screen is compared with the engine's view at the
// same saved move. Report-only. Run after the evenings:
//   npx vitest run --config tests/vitest.extended.config.ts tests/sim/what-am-i-replay.run.ts
// Writes reports/sim/what-am-i-replay.md.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';
import { replay } from '../../src/engine';
import { whatAmIRules } from '../../src/games/what-am-i/rules';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DIR = `${ROOT}reports/sim/screen/what-am-i`;

it('What Am I? saved nights replay and match the scoreboards on screen', () => {
  const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => /^wai-.*\.json$/.test(f)) : [];
  const lines: string[] = []; let nights = 0, boards = 0, problems = 0;
  const R = whatAmIRules as any;
  for (const f of files.sort()) {
    const res = JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
    if (!res.night) continue;
    nights++;
    const full = replay(R, res.night.setup, res.night.records);
    if (!full.ok) { problems++; lines.push(`- ${res.seed}: the saved night does not replay: ${full.reason}`); continue; }
    const again = replay(R, res.night.setup, res.night.records);
    if (!again.ok || JSON.stringify(again.value.state) !== JSON.stringify(full.value.state)) { problems++; lines.push(`- ${res.seed}: replaying twice gives different states`); }
    for (const b of res.replays ?? []) {
      const part = replay(R, res.night.setup, res.night.records.slice(0, b.records));
      if (!part.ok) { lines.push(`- ${res.seed} step ${b.step} (${b.screen}): the first ${b.records} saved moves do not replay (${part.reason}); an undone move may have been removed since`); continue; }
      boards++;
      const eng = R.view(part.value.state, { kind: 'host' }).scoreboard.map((x: any) => ({ player: x.player, score: x.score, turns: x.turns }));
      if (JSON.stringify(eng) !== JSON.stringify(b.rows)) { problems++; lines.push(`- ${res.seed} step ${b.step} (${b.screen}): screen ${JSON.stringify(b.rows)} vs engine ${JSON.stringify(eng)}`); }
    }
  }
  const out = ['# What Am I? saved nights through the engine', '', `${nights} saved nights replayed (twice each); ${boards} scoreboards on screen compared with the engine's view at that saved move; ${problems} problems.`, '', ...(lines.length ? lines : ['- None.'])];
  writeFileSync(`${ROOT}reports/sim/what-am-i-replay.md`, out.join('\n') + '\n');
  console.log(out.slice(2, 3).join(''));
  expect(true).toBe(true);
});
