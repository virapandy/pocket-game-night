// Mafia section 09, usability (C1/C2; scenarios version 1.1): MAF-080 to MAF-083 on screen, with item 6. Written before
// the screens exist: every test is `aheadOfMafiaScreens`. Helpers: mafia.ts.
import { expect, test, type Page } from './fixtures';
import {
  BANNED, SIZES, aheadOfMafiaScreens, box, button, byId, exactly, mainButton, nameButton, nightNames, noPageScroll, openFlow, tap,
  toMorning, TZ,
} from './mafia';

test.use({ timezoneId: TZ });

/** The flows that land on screens with no page scrolling allowed (MAF-080), and how to reach the screen from the resume. */
const NO_SCROLL: [string, string, (page: Page) => Promise<void>][] = [
  ['deal-arjun', 'B1', async () => {}],
  ['night1-start', 'N0', async () => {}],
  ['night2-meena', 'N1', async () => {}],
  ['morning2', 'M1', async (page) => { await toMorning(page); }],
  ['day1-tie', 'V3', async () => {}],
];

test('MAF-080: no page scrolling on B1, N0, N1, M1 and the re-vote at every size (Larger text off); one main button each', async ({ page }) => {
  aheadOfMafiaScreens('MAF-080 no page scroll');
  for (const viewport of SIZES) {
    for (const [name, screen, go] of NO_SCROLL) {
      await openFlow(page, name, { viewport });
      await go(page);
      await noPageScroll(page, `${screen} at ${viewport.width} × ${viewport.height}`);
      await expect(mainButton(page), `${screen}: one main button`).toHaveCount(1);
    }
  }
});

test('MAF-080: at 812 × 375 and 568 × 320 the main button sits bottom right', async ({ page }) => {
  aheadOfMafiaScreens('MAF-080 landscape main');
  for (const viewport of [{ width: 812, height: 375 }, { width: 568, height: 320 }]) {
    await openFlow(page, 'night1-start', { viewport });
    const b = await box(mainButton(page));
    expect(b.x + b.width, 'right edge').toBeGreaterThan(viewport.width - 40);
    expect(b.y + b.height, 'bottom edge').toBeGreaterThan(viewport.height - 40);
    expect(b.x, 'in the right half').toBeGreaterThanOrEqual(viewport.width / 2 - 1);
  }
});

test('MAF-080 item 6: N2 at 320 × 568 shows 3 rows of names (6) without scrolling; the rest scroll inside the names box; nothing scrolls the page', async ({ page }) => {
  aheadOfMafiaScreens('MAF-080 N2 at 320');
  await openFlow(page, 'night1-start', { viewport: { width: 320, height: 568 } });
  await tap(page, mainButton(page));
  await tap(page, button(page, "I'm Riya"));
  await tap(page, button(page, 'Tap to see your night job'));
  await noPageScroll(page, 'N2 at 320 × 568');
  const boxEl = await box(byId(page, 'night-names'));
  const inView = await nightNames(page).evaluateAll((els, b) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.top >= b.y - 1 && r.bottom <= b.y + b.height + 1; }).length, boxEl);
  expect(inView).toBeGreaterThanOrEqual(6);
  const scrolls = await byId(page, 'night-names').evaluate((e) => e.scrollHeight > e.clientHeight);
  expect(scrolls, '9 names: the box scrolls inside itself').toBe(true);
  await nameButton(page, 'Neha').scrollIntoViewIfNeeded();
  await expect(byId(page, 'job-line')).toBeInViewport();
  await expect(byId(page, 'result-line')).toBeAttached();
});

test('MAF-081: on N2 the job line and names are body text (17 px), the role word looks the same for every role', async ({ page }) => {
  aheadOfMafiaScreens('MAF-081 N2 text');
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  const looks: string[] = [];
  for (const [who, pick] of [['Riya', 'Arjun'], ['Arjun', 'Kabir'], ['Meena', 'Meena']] as const) {
    await tap(page, button(page, `I'm ${who}`));
    await tap(page, button(page, 'Tap to see your night job'));
    const style = await byId(page, 'job-line').evaluate((e) => { const s = getComputedStyle(e); return { size: s.fontSize, weight: s.fontWeight, colour: s.color }; });
    expect(style.size).toBe('17px');
    const nameSize = await nightNames(page).first().evaluate((e) => getComputedStyle(e).fontSize);
    expect(nameSize).toBe('17px');
    looks.push(`${style.weight}|${style.colour}`);
    await tap(page, nameButton(page, pick));
    await page.clock.runFor(4100);
    await tap(page, mainButton(page));
  }
  expect(new Set(looks).size).toBe(1);
});

test('MAF-082: no sound or vibration on the role card or the night job', async ({ page }) => {
  aheadOfMafiaScreens('MAF-082 silent private screens');
  await openFlow(page, 'night1-start');
  await page.evaluate(() => { (window as any).__vibrations = 0; navigator.vibrate = () => { (window as any).__vibrations++; return true; }; });
  await tap(page, mainButton(page));
  const before = await page.evaluate(() => ((window as any).__sounds ?? []).length);
  await tap(page, button(page, "I'm Riya"));
  await tap(page, button(page, 'Tap to see your night job'));
  await tap(page, nameButton(page, 'Arjun'));
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
  expect(await page.evaluate(() => ((window as any).__sounds ?? []).length)).toBe(before);
  expect(await page.evaluate(() => (window as any).__vibrations)).toBe(0);
});

test('MAF-082 / MAF-083: no Mafia screen says a banned word (killed, dead, die, murder, lynch, eliminate, werewolf, moderator, session, evening)', async ({ page }) => {
  aheadOfMafiaScreens('MAF-083 words');
  const screens: [string, (p: Page) => Promise<void>][] = [
    ['deal-arjun', async () => {}], ['night1-start', async () => {}], ['night2-meena', async () => {}],
    ['morning1', async (p) => { await toMorning(p); }], ['day1-tie', async () => {}], ['game1-over', async (p) => { await tap(p, button(p, 'What happened each night')); }],
  ];
  for (const [name, go] of screens) {
    await openFlow(page, name);
    await go(page);
    const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
    for (const w of BANNED) expect(text, `${name}: "${w}"`).not.toMatch(new RegExp(`\\b${w}\\b`));
  }
  await expect(page.getByText(exactly('Every Mafia is out.'))).toBeVisible();
});
