// The weekly long run (PLT-116, PLT-117, PLT-118, PLT-123): 100,000 scripted Tambola games, then, when a Jev key is
// present and the weekly cap (PLT-113) allows, a smaller run with Jev personas. Report-only: it writes
// reports/sim/summary-latest.md and fails if a game broke a check, which never holds back the preview link.
// Without a key it says "No Jev key: ran with random and scripted players" (PLT-114).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jevForRun, makeBudget, USAGE_FILE, WEEKLY_CAP } from './jev';
import { runMany, summaryText, type RunSummary } from './mass';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SIM_GAMES = Number(process.env.SIM_GAMES ?? 100_000);
const JEV_GAMES = Number(process.env.JEV_GAMES ?? 200);
const JEV_DECISIONS = Math.min(Number(process.env.JEV_DECISIONS ?? 2000), WEEKLY_CAP);

const parts: string[] = [];
const write = () => {
  mkdirSync(`${ROOT}reports/sim`, { recursive: true });
  writeFileSync(`${ROOT}reports/sim/summary-latest.md`, `${parts.join('\n')}\n_Written ${new Date().toISOString().slice(0, 10)}._\n`);
};

describe('PLT-118: the weekly long run', () => {
  let scripted: RunSummary;
  it(`${SIM_GAMES} scripted games (PLT-116)`, async () => {
    scripted = await runMany({ games: SIM_GAMES, prefix: 'weekly', jev: null, jevNote: 'no-key', saveReplays: true });
    parts.push(summaryText(scripted, `Tambola mass simulation: ${SIM_GAMES} scripted games`));
    write();
    expect(scripted.failures.map((f) => `${f.seed}: ${f.problems[0]}`)).toEqual([]);
  });

  it('the optional Jev step (PLT-123), or the no-key message (PLT-114)', async () => {
    // The weekly budget, held to this run's own limit too: whichever is lower.
    const budget = makeBudget({ file: USAGE_FILE, runLimit: JEV_DECISIONS });
    const { jev, note } = jevForRun({ budget });
    const s = await runMany({ games: jev ? JEV_GAMES : 20, prefix: 'weekly-jev', jev, jevNote: note, jevShare: 0.5, saveReplays: true });
    parts.push(summaryText(s, jev ? `Tambola with Jev personas: ${s.games} games` : `Tambola, optional Jev step: ${s.games} games`));
    parts.push(`Jev decisions used this week: ${makeBudget({ file: USAGE_FILE }).used()} of ${WEEKLY_CAP.toLocaleString('en-GB')}\n`);
    write();
    expect(s.failures.map((f) => `${f.seed}: ${f.problems[0]}`)).toEqual([]);
  });
});
