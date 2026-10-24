// Layer 3 and 4: whole Secret Words game nights, each a test (so shards split them), seeds from SIM_RUN. Six personas, one,
// two and three phones, Full and Easy, both Landmine rules, timer on and off, Play again, Change teams, End the game with
// Undo, End for tonight, reload and resume (tests/sims/secret-words-runner.ts). The first SIM_SW_JEV_EVENINGS are played by
// Jev as the persona when a key is present; without one the scripted persona plays them. Report-only, like the Impostor
// evenings: a finding fails its evening, and the weekly job carries on.
// How many: SIM_SW_EVENINGS, else one in five of SIM_EVENINGS (200 by default: 40 Secret Words evenings; the 4 of a local
// run: none). SIM_SW_JEV_EVENINGS, else one in five of SIM_JEV_EVENINGS (50: 10).
import { test, expect } from '@playwright/test';
import { shared } from './jev-budget';
import { swConfigFor, playSwEvening, saveSwResult } from './secret-words-runner';

const N = Number(process.env.SIM_SW_EVENINGS ?? Math.floor(Number(process.env.SIM_EVENINGS ?? 4) / 5));
const JEV_N = Number(process.env.SIM_SW_JEV_EVENINGS ?? Math.floor(Number(process.env.SIM_JEV_EVENINGS ?? 0) / 5));
const RUN = process.env.SIM_RUN ?? 'local';
const { jev, note } = shared;

for (let i = 0; i < N; i++) {
  const seed = `${RUN}-${String(i + 1).padStart(3, '0')}`;
  const cfg = swConfigFor(seed, i);
  const byJev = i < JEV_N;
  test(`Secret Words evening ${seed} (${cfg.persona.id}, ${cfg.phones} phone${cfg.phones > 1 ? 's' : ''}, ${cfg.board}${byJev ? ', Jev' : ''})`, async ({ page, browser }, info) => {
    test.setTimeout(40 * 60_000);
    const baseURL = String(info.project.use.baseURL);
    const res = await playSwEvening(page, browser, baseURL, cfg, { jev: byJev ? jev : null });
    saveSwResult({ ...res, config: { ...res.config, persona: byJev && jev ? cfg.persona.id : null, personaPlayed: cfg.persona.id } });
    test.info().annotations.push({ type: 'jev', description: byJev ? (jev ? `${cfg.persona.id}: ${res.jevDecisions} decisions` : `${cfg.persona.id}: ${note}, scripted`) : 'scripted' });
    expect(res.findings, `evening ${seed}: steps and screenshots in reports/sim/screen/secret-words/${seed}/`).toEqual([]);
  });
}
