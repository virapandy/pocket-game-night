// What Am I? game nights played through the screens (tests/sims/what-am-i-runner.ts), owner's request of 25 October 2026.
// Six personas (evening i is persona i mod 6), 3 to 10 players, motion and taps, hands-free, Pause, reloads and hiding,
// leaving and joining, End the game, Play again, End for tonight; the guest also opens Join a game on a second phone.
// How many: SIM_WAI_EVENINGS (default 0, so other sim runs are unchanged); the first SIM_WAI_JEV_EVENINGS are played by Jev
// as the persona when a key is present. Report-only: a finding fails its evening, the job carries on.
// Run: npm run build && SIM_WAI_EVENINGS=40 SIM_WAI_JEV_EVENINGS=40 SIM_RUN=w43 caffeinate -i taskpolicy -b \
//        npx playwright test --config tests/playwright.sims.config.ts what-am-i-evenings --workers=3
import { test, expect } from '@playwright/test';
import { shared } from './jev-budget';
import { waiConfigFor, playWaiEvening, saveWaiResult } from './what-am-i-runner';
import { TZ } from '../browser/what-am-i';

const N = Number(process.env.SIM_WAI_EVENINGS ?? 0);
const JEV_N = Number(process.env.SIM_WAI_JEV_EVENINGS ?? 0);
const RUN = process.env.SIM_RUN ?? 'local';
const { jev, note } = shared;
test.use({ timezoneId: TZ });

for (let i = 0; i < N; i++) {
  const seed = `${RUN}-${String(i + 1).padStart(3, '0')}`;
  const cfg = waiConfigFor(seed, i);
  const byJev = i < JEV_N;
  test(`What Am I? evening ${seed} (${cfg.persona.id}, ${cfg.players.length} players, ${cfg.hold}, ${cfg.motion ? 'motion' : 'taps'}${byJev ? ', Jev' : ''})`, async ({ page, browser }, info) => {
    test.setTimeout(30 * 60_000);
    const res = await playWaiEvening(page, browser, String(info.project.use.baseURL), cfg, { jev: byJev ? jev : null });
    saveWaiResult(res);
    test.info().annotations.push({ type: 'jev', description: byJev ? (jev ? `${res.jevDecisions} decisions` : `${note}, scripted`) : 'scripted' });
    expect(res.findings, `evening ${seed}: steps and screenshots in reports/sim/screen/what-am-i/${seed}/`).toEqual([]);
  });
}
