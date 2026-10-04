// Layer 3 and 4: SIM_EVENINGS whole Impostor evenings, each a test (so shards split them), with fixed seeds from
// SIM_RUN. The first SIM_JEV_EVENINGS are played by Jev personas when a Jev key is present (layer 4); without a key
// they are played by the scripted host and the summary says so. A failing evening saves its replay and screenshots.
import { test, expect } from '@playwright/test';
import { makeBudget, jevForRun, USAGE_FILE } from '../sim/jev';
import { PERSONAS, configFor, playEvening, saveResult } from './impostor-runner';

const N = Number(process.env.SIM_EVENINGS ?? 4);
const JEV_N = Number(process.env.SIM_JEV_EVENINGS ?? 0);
const RUN = process.env.SIM_RUN ?? 'local';
const { jev, note } = jevForRun({ budget: makeBudget({ file: USAGE_FILE, runLimit: Number(process.env.JEV_DECISIONS ?? 400) }) });

for (let i = 0; i < N; i++) {
  const seed = `${RUN}-${String(i + 1).padStart(3, '0')}`;
  const persona = i < JEV_N ? PERSONAS[i % PERSONAS.length]! : null;
  test(`evening ${seed}${persona ? ` (Jev: ${persona.id})` : ''}`, async ({ page }) => {
    const cfg = configFor(seed, persona);
    const res = await playEvening(page, cfg, { jev: persona ? jev : null });
    saveResult({ ...res, config: { ...res.config, persona: persona && jev ? persona : null } });
    test.info().annotations.push({ type: 'jev', description: persona ? (jev ? `${persona.id}: ${res.jevDecisions} decisions` : `${persona.id}: ${note}, scripted`) : 'scripted' });
    expect(res.findings, `evening ${seed}: replay in tests/replays/screen/impostor-${seed}.json`).toEqual([]);
  });
}
