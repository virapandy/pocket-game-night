// Mafia on screen: the C3 browser checks (scenarios version 1.1, 25 October 2026), written before the screens exist.
// MAF-P2 / MAF-016 (no room screen differs with the roles), MAF-P7 (every role's night job is the same frame), MAF-010
// (the deal on screen is the scenario's deal), MAF-037 (the story read out), MAF-091 / MAF-H6 (resume, never on a
// private screen). Rules: tests/games/mafia/. Helpers: mafia.ts. Every test is `aheadOfMafiaScreens` until the screens exist.
import { expect, test, type Page } from './fixtures';
import {
  EXAMPLE_DEAL, NINE, aheadOfMafiaScreens, box, button, byId, dealAll, dealTurn, exactly, heading, mainButton, nameButton,
  nightNames, openFlow, pad, playNight, roomDump, tap, toDeal, toMorning, TZ,
} from './mafia';
import { oracleDeal, oracleStory, storyText, STORIES, type Role } from '../games/mafia/oracle';

test.use({ timezoneId: TZ });

/** Deal B: Mafia Riya and Om; Doctor Sunita; Police Neha (Kabir a Villager in both). */
const DEAL_B: Record<string, Role> = {
  Riya: 'mafia', Arjun: 'villager', Meena: 'villager', Kabir: 'villager', Zoya: 'villager', Dev: 'villager', Om: 'mafia', Sunita: 'doctor', Neha: 'police',
};
/** Night 1 picks that put Kabir out under either deal: Mafia pick Kabir, the Doctor protects themselves, the Police checks the first other name. */
function picksFor(deal: Record<string, Role>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of NINE) {
    const r = deal[p];
    out[p] = r === 'mafia' ? 'Kabir' : r === 'doctor' ? p : r === 'police' ? (p === 'Riya' ? 'Arjun' : 'Riya') : p === 'Kabir' ? 'Riya' : 'Kabir';
  }
  return out;
}

/** Walks deal, night 1, morning and day 1 by screen, keeping what every room screen shows. */
async function walk(page: Page, deal: Record<string, Role>): Promise<string[]> {
  const dumps: string[] = [];
  await toDeal(page, NINE, { seeds: { deals: { 1: deal } } });
  for (const n of NINE) { dumps.push(await roomDump(page)); await dealTurn(page, n); }
  await expect(heading(page, 'Night 1')).toBeVisible();
  dumps.push(await roomDump(page));
  await tap(page, mainButton(page));
  const picks = picksFor(deal);
  for (let i = 0; i < NINE.length; i++) {
    dumps.push(await roomDump(page));   // N1
    const name = (await byId(page, 'pass-name').innerText()).trim();
    const key = NINE.find((x) => x.toLowerCase() === name.toLowerCase())!;
    await tap(page, button(page, `I'm ${key}`));
    await tap(page, button(page, 'Tap to see your night job'));
    await tap(page, nameButton(page, picks[key]!));
    await page.clock.runFor(4100);
    await tap(page, mainButton(page));
  }
  dumps.push(await roomDump(page));     // N3
  await toMorning(page);
  dumps.push(await roomDump(page));     // M1
  await tap(page, mainButton(page));
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
  dumps.push(await roomDump(page));     // Y1
  return dumps;
}

test('MAF-016 MAF-P2: every room screen of the deal, night 1, morning and day 1 is identical under two different deals', async ({ page, browser }) => {
  aheadOfMafiaScreens('MAF-P2 room screens');
  const a = await walk(page, EXAMPLE_DEAL);
  const other = await browser.newPage({ timezoneId: TZ, viewport: page.viewportSize() ?? undefined });
  try {
    const b = await walk(other, DEAL_B);
    expect(b.length).toBe(a.length);
    for (let i = 0; i < a.length; i++) expect(b[i], `room screen ${i + 1}`).toBe(a[i]);
    // And the morning names Kabir, a Villager, in both: nothing of either deal's Mafia, Doctor or Police.
    expect(a[a.length - 2]).toMatch(/Kabir was a Villager\./i);
  } finally { await other.close(); }
});

test('MAF-016: a day leaver\'s role is on no room screen before game over ("Neha · left", no role)', async ({ page }) => {
  aheadOfMafiaScreens('MAF-016 leaver');
  await openFlow(page, 'day1-left-neha');
  await toMorning(page);
  await tap(page, mainButton(page));
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
  await expect(page.getByText(exactly('Neha · left'))).toBeVisible();
  const dump = await roomDump(page);
  expect(dump).not.toMatch(/Neha[^\n]{0,20}(Villager|Mafia|Doctor|Police)/i);
});

test('MAF-P7: every role\'s night job (N2) has the same elements in the same order and the same sizes (320 × 568 and 390 × 844)', async ({ page }) => {
  aheadOfMafiaScreens('MAF-P7 night job frame');
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await toDeal(page, NINE, { seeds: { deals: { 1: EXAMPLE_DEAL } }, viewport });
    await dealAll(page);
    await tap(page, mainButton(page));
    const frames: { who: string; order: string[]; sizes: Record<string, number>; names: number; buttonHeights: number[]; lineHeight: number }[] = [];
    // Night 1 order: Riya (Villager), Arjun (Mafia), Meena (Doctor), Kabir, Zoya (Mafia), Dev (Police), …: the first six cover every role.
    const picks: Record<string, string> = { Riya: 'Arjun', Arjun: 'Kabir', Meena: 'Meena', Kabir: 'Zoya', Zoya: 'Kabir', Dev: 'Zoya' };
    for (const who of Object.keys(picks)) {
      await tap(page, button(page, `I'm ${who}`));
      await tap(page, button(page, 'Tap to see your night job'));
      await tap(page, nameButton(page, picks[who]!));
      await page.clock.runFor(4100);
      await expect(mainButton(page)).toBeVisible();
      const order = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid]')).map((e) => e.getAttribute('data-testid')!)
        .filter((id) => ['night-progress', 'pass-name', 'job-line', 'night-names', 'result-line', 'main-button'].includes(id)));
      const sizes: Record<string, number> = {};
      for (const id of ['night-progress', 'pass-name', 'job-line', 'night-names', 'result-line', 'main-button']) sizes[id] = Math.round((await box(byId(page, id))).height);
      sizes.pad = Math.round((await box(pad(page))).height);
      const buttonHeights = await nightNames(page).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
      const lineHeight = await byId(page, 'job-line').evaluate((e) => parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.2);
      frames.push({ who, order, sizes, names: await nightNames(page).count(), buttonHeights, lineHeight });
      await tap(page, mainButton(page));
    }
    const first = frames[0]!;
    expect(first.order).toEqual(['night-progress', 'pass-name', 'job-line', 'night-names', 'result-line', 'main-button']);
    for (const f of frames) {
      expect(f.order, `${f.who}: order`).toEqual(first.order);
      for (const [k, v] of Object.entries(first.sizes)) expect(Math.abs(f.sizes[k]! - v), `${f.who}: ${k} height at ${viewport.width}`).toBeLessThanOrEqual(1);
      expect(f.names, `${f.who}: name buttons (item 4)`).toBe(9);
      for (const h of f.buttonHeights) expect(Math.abs(h - 56), `${f.who}: name button height`).toBeLessThanOrEqual(1);
      // Product owner, 25 October (P7 sameness wins): job and result boxes at least 2 lines tall, equal for every role.
      expect(f.sizes['job-line']!, `${f.who}: job line at least 2 lines`).toBeGreaterThanOrEqual(2 * f.lineHeight - 1);
      expect(f.sizes['result-line']!, `${f.who}: result line at least 2 lines`).toBeGreaterThanOrEqual(2 * f.lineHeight - 1);
    }
  }
});

test('MAF-P7: the main button of the night job stays hidden until both 4000 ms and a pick, for every role', async ({ page }) => {
  aheadOfMafiaScreens('MAF-P7 night job guard');
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  for (const [who, target] of [['Riya', 'Arjun'], ['Arjun', 'Kabir'], ['Meena', 'Meena']] as const) {
    await tap(page, button(page, `I'm ${who}`));
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 10);
    await button(page, 'Tap to see your night job').click({ force: true });
    await page.clock.runFor(3900);
    await expect(mainButton(page), `${who}: no pick yet, 3.9 s`).toBeHidden();
    await nameButton(page, target).click({ force: true });
    await expect(mainButton(page), `${who}: picked at 3.9 s`).toBeHidden();
    await page.clock.runFor(200);
    await expect(mainButton(page), `${who}: 4.1 s and a pick`).toBeVisible();
    await page.clock.runFor(1000);
    await mainButton(page).click({ force: true });
  }
});

test('MAF-010: with seeds.roles fixed, each role card shows the scenario\'s deal (shuffle with `${roles}:1`)', async ({ page }) => {
  aheadOfMafiaScreens('MAF-010 deal on screen');
  await toDeal(page, NINE, { seeds: { roles: 'browser-deal-1' } });
  const shown = await dealAll(page);
  const expected = oracleDeal('browser-deal-1', 1, NINE, 2, []);
  for (const p of NINE) expect(shown[p]!.toUpperCase(), p).toBe(expected[p]!.toUpperCase());
});

test('MAF-037: the morning reads the scenario\'s story with the name in it (night 1 of the example: Kabir)', async ({ page }) => {
  aheadOfMafiaScreens('MAF-037 story');
  await openFlow(page, 'morning1');
  await toMorning(page);
  const id = oracleStory('mafia-example', 1, 1, STORIES.filter((s) => s.kind === 'out').map((s) => s.id), []);
  await expect(byId(page, 'story')).toHaveText(exactly(storyText(id, 'Kabir')));
  await expect(byId(page, 'role-line')).toHaveText(exactly('Kabir was a Villager.'));
  await expect(byId(page, 'count-line')).toHaveText(exactly('8 players left · Mafia caught: 0 of 2'));
});

test('MAF-091 / MAF-H6: a reload during the night resumes on the pass screen of the player whose turn it is, never the night job', async ({ page }) => {
  aheadOfMafiaScreens('MAF-091 resume at night');
  await openFlow(page, 'night1-meena');
  await expect(page.getByText(exactly('Welcome back.'))).toBeVisible();
  await expect(byId(page, 'where-line')).toHaveText(exactly("Night 1 · Meena's turn with the phone"));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Meena'));
  await expect(byId(page, 'night-progress')).toHaveText(exactly('Night 1 · 3 of 9'));
  await expect(byId(page, 'job-line')).toHaveCount(0);
  await expect(byId(page, 'night-names')).toHaveCount(0);
  // Into the night job, then a reload: back to Meena's pass screen, nothing recorded for her.
  await tap(page, button(page, "I'm Meena"));
  await tap(page, button(page, 'Tap to see your night job'));
  await expect(byId(page, 'job-line')).toBeVisible();
  await page.reload();
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Meena'));
  await expect(byId(page, 'job-line')).toHaveCount(0);
  await expect(page.getByText(exactly('Welcome back.'))).toBeVisible();
});

test('MAF-091 / MAF-013: a reload during the deal resumes on that player\'s pass screen, never the role card', async ({ page }) => {
  aheadOfMafiaScreens('MAF-091 resume in the deal');
  await openFlow(page, 'deal-arjun');
  await expect(byId(page, 'where-line')).toHaveText(exactly("Dealing roles · Arjun's turn with the phone"));
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 2 of 9'));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Arjun'));
  await expect(byId(page, 'private-word')).toHaveCount(0);
  await tap(page, button(page, "I'm Arjun"));
  await tap(page, button(page, 'Tap instead'));
  await tap(page, pad(page));
  await expect(byId(page, 'private-word')).toBeVisible();
  await page.reload();
  await expect(byId(page, 'private-word')).toHaveCount(0);
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Arjun'));
});

test('MAF-091 item 22: after a recorded tie the game resumes at the re-vote (the tied players only)', async ({ page }) => {
  aheadOfMafiaScreens('MAF-091 resume at V3');
  await openFlow(page, 'day1-tie');
  await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
  await expect(byId(page, 'where-line')).toHaveText(exactly('Day 1 · vote'));
  for (const p of ['Om', 'Neha']) await expect(button(page, p)).toBeVisible();
  for (const p of ['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev', 'Sunita']) await expect(button(page, p)).toHaveCount(0);
  await expect(button(page, 'Still a tie')).toBeVisible();
  await expect(button(page, 'Nobody today')).toHaveCount(0);
});

test('MAF-091: a finished game resumes on Game over with "Welcome back." and "Game over, game 1"', async ({ page }) => {
  aheadOfMafiaScreens('MAF-091 resume at G1');
  await openFlow(page, 'game1-over');
  await expect(heading(page, 'The Village wins!')).toBeVisible();
  await expect(byId(page, 'where-line')).toHaveText(exactly('Game over, game 1'));
});
