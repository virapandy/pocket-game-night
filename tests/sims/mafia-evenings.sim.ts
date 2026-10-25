// Mafia game nights played through the screens with the privacy check after every step (tests/sims/mafia-runner.ts),
// owner's request of 25 October 2026. SIM_MAF_EVENINGS (default 0, so other sim runs are unchanged); the first
// SIM_MAF_JEV_EVENINGS are played by Jev as the persona when a key is present. Report-only.
// Run: npm run build && SIM_MAF_EVENINGS=20 SIM_MAF_JEV_EVENINGS=20 SIM_RUN=w43 caffeinate -i taskpolicy -b \
//        npx playwright test --config tests/playwright.sims.config.ts mafia-evenings --workers=3
import { test, expect } from '@playwright/test';
import { shared } from './jev-budget';
import { mafConfigFor, playMafEvening, saveMafResult } from './mafia-runner';
import { TZ } from '../browser/mafia';

const N = Number(process.env.SIM_MAF_EVENINGS ?? 0);
const JEV_N = Number(process.env.SIM_MAF_JEV_EVENINGS ?? 0);
const RUN = process.env.SIM_RUN ?? 'local';
const { jev, note } = shared;
test.use({ timezoneId: TZ });

for (let i = 0; i < N; i++) {
  const seed = `${RUN}-${String(i + 1).padStart(3, '0')}`;
  const cfg = mafConfigFor(seed, i);
  const byJev = i < JEV_N;
  test(`Mafia evening ${seed} (${cfg.persona.id}, ${cfg.players.length} players${byJev ? ', Jev' : ''})`, async ({ page }) => {
    test.setTimeout(40 * 60_000);
    const res = await playMafEvening(page, cfg, { jev: byJev ? jev : null });
    saveMafResult(res);
    test.info().annotations.push({ type: 'jev', description: byJev ? (jev ? `${res.jevDecisions} decisions` : `${note}, scripted`) : 'scripted' });
    expect(res.findings, `evening ${seed}: steps and screenshots in reports/sim/screen/mafia/${seed}/`).toEqual([]);
  });
}
