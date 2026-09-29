// Phase 1b: dark mode, an option and never the default.
// Scenarios: TAM-134 (starts light, even on a phone set to dark; the host can switch; text stays as large),
// TAM-188 (dark mode keeps the contrast rules of TAM-106, the sizes, and TAM-105's words and symbols; the choice
// is remembered on this phone; switching never changes the game in progress). Names: tests/browser/README.md.
import { expect, test, type Locator, type Page } from './fixtures';
import {
  callMany, calledNumbers, confirmPrizes, currentNumber, currentRhyme, dismiss, endGame, fromMenu, HOME, lastCalls, menuButton,
  nextNumber, openTambola, recordWin, setUpPaperGame, toggle,
} from './helpers';

// The phone itself is set to dark: the app must still start light (TAM-134).
test.use({ colorScheme: 'dark', viewport: { width: 390, height: 844 } });

const DARK = 'Dark mode';

/** How light the page's own background is, 0 (black) to 1 (white). The app paints an opaque background on html or body. */
const pageLightness = (page: Page) =>
  page.evaluate(() => {
    const parse = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return { r: m[0]!, g: m[1]!, b: m[2]!, a: m[3] ?? 1 }; };
    const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    for (const el of [document.body, document.documentElement]) {
      const c = parse(getComputedStyle(el).backgroundColor);
      if (c.a > 0.9) return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }
    return -1; // no opaque background: not allowed in dark mode
  });

/** Every visible text's contrast against its background (TAM-106): 4.5:1, 3:1 large, 7:1 for the called number. */
const lowContrast = (page: Page) =>
  page.evaluate(() => {
    const parse = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return { r: m[0]!, g: m[1]!, b: m[2]!, a: m[3] ?? 1 }; };
    const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const bgOf = (el: Element | null): { r: number; g: number; b: number } | null => {
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c.a > 0.9) return c;
      }
      return null;
    };
    const out: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || seen.has(el) || !n.textContent?.trim()) continue;
      seen.add(el);
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
      const bg = bgOf(el);
      if (!bg) { out.push(`"${n.textContent.trim().slice(0, 25)}" has no background behind it`); continue; }
      const [hi, lo] = [lum(parse(s.color)), lum(bg)].sort((a, b) => b - a) as [number, number];
      const ratio = (hi + 0.05) / (lo + 0.05);
      const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700;
      const large = size >= 24 || (bold && size >= 18.66);
      const need = el.closest('[data-testid="current-number"]') ? 7 : large ? 3 : 4.5;
      if (ratio < need) out.push(`"${n.textContent.trim().slice(0, 25)}" ${ratio.toFixed(2)}:1 (needs ${need})`);
    }
    return out;
  });

/** Turns dark mode on (or off) from the Tambola start screen's Settings. */
async function setDarkFromStart(page: Page, on: boolean) {
  await openTambola(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  if ((await toggle(page, DARK).isChecked()) !== on) await toggle(page, DARK).click();
  await dismiss(page);
}

type Size = { font: number; w: number; h: number };
const sizeOf = async (l: Locator): Promise<Size> => {
  const b = (await l.boundingBox())!;
  const font = await l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  return { font, w: Math.round(b.width), h: Math.round(b.height) };
};
async function sizes(page: Page) {
  return {
    number: await sizeOf(currentNumber(page)),
    rhyme: (await sizeOf(currentRhyme(page))).font,
    next: await sizeOf(nextNumber(page)),
    win: await sizeOf(page.getByRole('button', { name: 'Record a win' })),
    repeat: await sizeOf(page.getByRole('button', { name: 'Repeat', exact: true })),
    menu: await sizeOf(menuButton(page)),
  };
}

test.describe('TAM-134: dark mode is an option, not the default', () => {
  test('the app starts in light mode, even when the phone is set to dark', async ({ page }) => {
    await page.goto(HOME);
    expect(await pageLightness(page)).toBeGreaterThan(0.7);
    await setUpPaperGame(page);
    expect(await pageLightness(page)).toBeGreaterThan(0.7);
  });

  test('the host can switch to dark mode during a game, and text stays exactly as large', async ({ page }) => {
    await setUpPaperGame(page);
    await callMany(page, 3);
    const light = await sizes(page);
    await fromMenu(page, 'Settings');
    await toggle(page, DARK).click();
    await dismiss(page);
    expect(await pageLightness(page)).toBeGreaterThanOrEqual(0);
    expect(await pageLightness(page)).toBeLessThan(0.2);
    expect(await sizes(page)).toEqual(light);
  });
});

test.describe('TAM-188: dark mode keeps the readability rules', () => {
  test('every contrast rule still holds on every screen (4.5:1 text, 3:1 large, 7:1 for the number)', async ({ page }) => {
    await setDarkFromStart(page, true);
    const problems: string[] = [];
    const check = async (screen: string) => {
      expect(await pageLightness(page), `${screen} is dark`).toBeLessThan(0.2);
      problems.push(...(await lowContrast(page)).map((p) => `${screen}: ${p}`));
    };
    await page.goto(HOME);
    await check('home');
    await openTambola(page);
    await check('tambola');
    await setUpPaperGame(page);
    await callMany(page, 6);
    await check('game');
    await menuButton(page).click();
    await check('menu');
    await dismiss(page);
    await recordWin(page, 'Early Five', ['Riya']);
    await check('win recorded');
    await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
    await fromMenu(page, 'Show the room');
    await check('room view');
    expect(problems).toEqual([]);
  });

  test('colour is still never the only signal: chips and the result keep their words and symbols', async ({ page }) => {
    await setDarkFromStart(page, true);
    await setUpPaperGame(page);
    await callMany(page, 6);
    await recordWin(page, 'Early Five', ['Riya']);
    await expect(page.getByTestId('claim-result')).toContainText('✓');
    await expect(page.getByTestId('prize-chip').filter({ hasText: '✓' }).first()).toBeVisible();
    await expect(page.getByTestId('prize-chip').filter({ hasText: '●' }).first()).toBeVisible();
  });

  test('the choice is remembered on this phone for the next game', async ({ page }) => {
    await setUpPaperGame(page, { players: ['Riya', 'Asha'] });
    await callMany(page, 2);
    await fromMenu(page, 'Settings');
    await toggle(page, DARK).click();
    await dismiss(page);
    await endGame(page);
    await page.getByRole('button', { name: 'Play again' }).click();
    await confirmPrizes(page);
    expect(await pageLightness(page)).toBeLessThan(0.2);
    await page.reload();
    await page.goto(HOME);
    expect(await pageLightness(page)).toBeGreaterThanOrEqual(0);
    expect(await pageLightness(page)).toBeLessThan(0.2);
  });

  test('switching it never changes the game in progress', async ({ page }) => {
    await setUpPaperGame(page);
    const calls = await callMany(page, 5);
    for (const on of [true, false]) {
      await fromMenu(page, 'Settings');
      if ((await toggle(page, DARK).isChecked()) !== on) await toggle(page, DARK).click();
      await dismiss(page);
      await expect(currentNumber(page)).toHaveText(String(calls[4]));
      const shown = (await lastCalls(page).locator('[data-number]').allTextContents()).map((t) => Number(t.trim()));
      expect(shown).toEqual(calls.slice(-5).reverse());
      expect((await calledNumbers(page)).sort((a, b) => a - b)).toEqual([...calls].sort((a, b) => a - b));
      await expect(nextNumber(page)).toBeEnabled();
    }
  });
});
