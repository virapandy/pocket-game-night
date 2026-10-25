// Mafia against the real rules engine, with Jev choosing (tests/sim/mafia-engine.ts). Report-only, not part of `npm test`.
// Run: caffeinate -i npx vitest run --config tests/vitest.extended.config.ts tests/sim/mafia-engine.run.ts
// Settings: MAFIA_SIZES (6,8,10,12,16), MAFIA_SHARES (never,when-found), MAFIA_GAMES per cell (20), MAFIA_RUN (seed name),
// MAFIA_MAX_DECISIONS (12000), JEV=off for the seeded stub chooser. Day points never offer "nobody" (--no-nobody).
// Writes reports/sim/mafia-engine.md and the choices in reports/runs/mafia-engine-<run>.json (gitignored).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';
import { jevForRun, makeBudget, USAGE_FILE, isoWeek } from './jev';
import { engineReport, runEngineSim, stubChooser, type Chooser, type Shares } from './mafia-engine';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const sizes = (process.env.MAFIA_SIZES ?? '6,8,10,12,16').split(',').map(Number);
const shares = (process.env.MAFIA_SHARES ?? 'never,when-found').split(',') as Shares[];
const games = Number(process.env.MAFIA_GAMES ?? 20);
const run = process.env.MAFIA_RUN ?? 'w43';
const maxDecisions = Number(process.env.MAFIA_MAX_DECISIONS ?? 12000);

const TASK: Record<string, string> = {
  'night-mafia': 'You are in the Mafia. Choose who to put out tonight (a Mafia partner may already have picked: choose the same name to agree).',
  'night-doctor': 'You are the Doctor. Choose who to protect tonight.',
  'night-police': 'You are the Police. Choose who to check tonight (you learn Mafia or Not Mafia).',
  day: 'It is day. Everyone points at one player at the same moment; the most-pointed player is out. Choose who you point at.',
  'day-again': 'The first point was tied. Point again among the tied names.',
};

it('Mafia against the real rules engine', async () => {
  const budget = makeBudget({ file: USAGE_FILE, runLimit: maxDecisions });
  const before = budget.used();
  const { jev, note } = jevForRun({ budget });
  let decisions = 0;
  const jevChooser: Chooser = async (asks) => {
    if (!jev) return null;
    const qs: Record<string, any> = {};
    asks.forEach((a, i) => (qs[`q${i}`] = { type: 'choice', instructions: { question: TASK[a.kind], you: a.player, note: 'Play to win for your side.' },
      criteria: Object.fromEntries(a.options.map((o) => [o, `the player ${o}`])) }));
    // one call per ask keeps each player's own facts apart (a fan-out shares one state)
    const out: string[][] = [];
    for (let i = 0; i < asks.length; i++) {
      const a = asks[i]!;
      const ans = await jev.choose({ game: 'Mafia, one phone passed round. The Village wins when every Mafia is out; the Mafia win when they are as many as everyone else.', you: a.player, facts: a.facts }, { pick: qs[`q${i}`] });
      if (!ans) return null;
      decisions++;
      const p = (ans.pick as any)?.probabilities ?? {};
      out.push(Object.entries(p).sort((x: any, y: any) => y[1] - x[1]).map(([k]) => k));
    }
    return out;
  };
  const chooser = jev ? jevChooser : stubChooser(run);
  const res = await runEngineSim({ sizes, shares, games, run, chooser, stop: () => !!jev && decisions >= maxDecisions - 20 });
  mkdirSync(`${ROOT}reports/sim`, { recursive: true });
  mkdirSync(`${ROOT}reports/runs`, { recursive: true });
  writeFileSync(`${ROOT}reports/runs/mafia-engine-${run}.json`, JSON.stringify(res.cells.map((c) => c.logs.map((l) => ({ seed: l.seed, winner: l.winner, choices: l.choices })))));
  const body = [`# Mafia against the real rules engine (${run})`, '',
    `Run ${new Date().toISOString().slice(0, 16)}Z. Chooser: ${jev ? 'Jev' : `seeded stub (${note})`}. Day point: no "nobody". Sizes ${sizes.join(', ')} × Police ${shares.join(', ')} × ${games} games.`,
    `Jev decisions this run: ${budget.thisRun} (shared count ${isoWeek(Date.now())}: ${before} before, ${budget.used()} after, of ${budget.cap}). Tool faults: ${jev?.stats.failures.length ?? 0}.`, '',
    ...engineReport(res)];
  writeFileSync(`${ROOT}reports/sim/mafia-engine-${jev ? 'jev' : 'stub'}.md`, body.join('\n') + '\n');
  console.log(`mafia-engine: ${res.cells.reduce((n, c) => n + c.logs.length, 0)} games, ${budget.thisRun} decisions, stopped ${res.stopped}`);
  expect(true).toBe(true);
});
