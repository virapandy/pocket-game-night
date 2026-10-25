// Repro of a What Am I? finding from the screen simulations of 25 October 2026 (reports/sim-what-am-i.md, finding 1):
// a mark whose 600 ms flash ends on the very millisecond the turn time runs out leaves a blank screen (`wai-turn-blank`,
// nothing to tap) instead of T4 "Time's up!". WAI-022 with Version 1.1 item 14 (marks in flight: "If time up ... comes
// during its flash, the mark stands and no next word is shown") and WAI-030 (time up opens T4). A sim file, so it is
// report-only and not part of `npm run test:browser`; once the app is fixed it can move to a browser test.
// Run: npm run build && npx playwright test --config tests/playwright.sims.config.ts what-am-i-blank-at-time-up
import { test, expect } from '@playwright/test';
import { startNight, toWord, now, heading, TZ, areaPoint, tapAt } from '../browser/what-am-i';

test.use({ timezoneId: TZ });

for (const [area, at] of [['top', 29_399], ['top', 29_400], ['top', 29_401], ['bottom', 29_400]] as const) {
  test(`WAI-022 item 14: a ${area === 'top' ? 'Pass' : 'Got it'} tapped ${at} ms into a 30 s turn (flash ends at ${at + 600} ms) still opens Time's up`, async ({ page }) => {
    await startNight(page, { players: ['Riya', 'Arjun', 'Meena'], turnTime: 30, hold: 'free', seed: 'r1' });
    const t3 = await toWord(page);
    await page.clock.runFor(t3 + at - (await now(page)));
    const p = await areaPoint(page, area);
    await tapAt(page, p.x, p.y);
    await page.clock.runFor(10_000);
    await expect(heading(page, /^Time's up! Riya got [01]$/)).toBeVisible({ timeout: 1000 });
  });
}
