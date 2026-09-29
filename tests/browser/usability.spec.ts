// Usability on the host phone: TAM-104, TAM-106, TAM-109, TAM-110, TAM-113, TAM-116, TAM-118, TAM-135.
import { expect, test, type Page } from './fixtures';
import { call, callMany, dismiss, fromMenu, HOME, menuButton, nextNumber, openTambola, recordWin, setUpPaperGame } from './helpers';

/** Screens worth checking: home, Tambola, setup, a game, its menu, a recorded win, the room view. */
async function eachScreen(page: Page, check: (name: string) => Promise<void>) {
  await page.goto(HOME);
  await check('home');
  await openTambola(page);
  await check('tambola');
  await setUpPaperGame(page);
  await check('game');
  await callMany(page, 6);
  await menuButton(page).click();
  await check('menu');
  await dismiss(page);
  await recordWin(page, 'Early Five', ['Riya']);
  await check('win recorded');
  // TAM-198 (owner, 2026-09-30): the menu still works while the won prize waits to be closed.
  await fromMenu(page, 'Show the room');
  await check('room view');
}

test('TAM-104: every tappable control is at least 44 × 44 CSS px (board and ticket cells at least 24 × 24)', async ({ page }) => {
  const problems: string[] = [];
  await eachScreen(page, async (screen) => {
    const small = await page.evaluate(() => {
      const out: string[] = [];
      const sel = 'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="tab"]';
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === 'hidden') continue;
        const cell = el.closest('[data-testid="board"], [data-testid="ticket"]');
        const min = cell ? 24 : 44;
        if (r.width < min - 0.5 || r.height < min - 0.5) out.push(`"${(el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
      return out;
    });
    problems.push(...small.map((s) => `${screen}: ${s}`));
  });
  expect(problems).toEqual([]);
});

test('TAM-109: every button has a visible word, not just an icon', async ({ page }) => {
  const problems: string[] = [];
  await eachScreen(page, async (screen) => {
    const bare = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a[href]'))
        .filter((el) => el.getBoundingClientRect().width > 0 && !el.closest('[data-testid="board"], [data-testid="ticket"]'))
        .filter((el) => !/[\p{L}\p{N}]/u.test(el.innerText))
        .map((el) => el.outerHTML.slice(0, 60)),
    );
    problems.push(...bare.map((b) => `${screen}: ${b}`));
  });
  expect(problems).toEqual([]);
});

test('TAM-106: text contrast is at least 4.5:1 (3:1 large), and the called number at least 7:1', async ({ page }) => {
  const problems: string[] = [];
  await eachScreen(page, async (screen) => {
    const low = await page.evaluate(() => {
      const parse = (c: string) => { const m = c.match(/[\d.]+/g)!.map(Number); return { r: m[0]!, g: m[1]!, b: m[2]!, a: m[3] ?? 1 }; };
      const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
        const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const bgOf = (el: Element | null): { r: number; g: number; b: number } => {
        for (let e = el; e; e = e.parentElement) {
          const c = parse(getComputedStyle(e).backgroundColor);
          if (c.a > 0.9) return c;
        }
        return { r: 255, g: 255, b: 255 };
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
        const fg = parse(s.color), bg = bgOf(el);
        const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a) as [number, number];
        const ratio = (hi + 0.05) / (lo + 0.05);
        const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700;
        const large = size >= 24 || (bold && size >= 18.66);
        const need = el.closest('[data-testid="current-number"]') ? 7 : large ? 3 : 4.5;
        if (ratio < need) out.push(`"${n.textContent.trim().slice(0, 25)}" ${ratio.toFixed(2)}:1 (needs ${need})`);
      }
      return out;
    });
    problems.push(...low.map((l) => `${screen}: ${l}`));
  });
  expect(problems).toEqual([]);
});

test('TAM-110: the screen is kept awake during a game, and asked again on return', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__wake = 0;
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: async () => { (window as any).__wake++; return { released: false, release: async () => {}, addEventListener() {}, removeEventListener() {} }; } },
    });
  });
  await setUpPaperGame(page);
  await call(page);
  await expect.poll(() => page.evaluate(() => (window as any).__wake)).toBeGreaterThan(0);
  const before = await page.evaluate(() => (window as any).__wake);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => (window as any).__wake)).toBeGreaterThan(before);
});

test('TAM-110: if the phone refuses to stay awake, a "keep your screen on" hint appears', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { throw new Error('NotAllowedError'); } } });
  });
  await setUpPaperGame(page);
  await call(page);
  await expect(page.getByText(/keep your screen on/i)).toBeVisible();
});

test('TAM-135: "Next number" gives a short vibration, which can be turned off in settings', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__buzz = 0;
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: () => { (window as any).__buzz++; return true; } });
  });
  await setUpPaperGame(page);
  await call(page);
  await expect.poll(() => page.evaluate(() => (window as any).__buzz)).toBeGreaterThan(0);
  await fromMenu(page, 'Settings');
  await page.getByRole('checkbox', { name: 'Vibration' }).or(page.getByRole('switch', { name: 'Vibration' })).uncheck();
  await dismiss(page);
  const n = await page.evaluate(() => (window as any).__buzz);
  await call(page);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).__buzz)).toBe(n);
});

test('TAM-116: a tap shows a visible response within 100 ms on a slowed-down phone', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CPU slow-down needs Chromium');
  await setUpPaperGame(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      const w = window as any;
      w.__down = 0; w.__shown = 0;
      document.addEventListener('pointerup', (e) => { w.__down = e.timeStamp; }, { capture: true, once: true });
      const target = document.querySelector('[data-testid="current-number"]') ?? document.body;
      const obs = new MutationObserver(() => { if (!w.__shown) { w.__shown = performance.now(); obs.disconnect(); } });
      obs.observe(target.parentElement ?? document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    });
    await nextNumber(page).click();
    await page.waitForTimeout(400);
    times.push(await page.evaluate(() => (window as any).__shown - (window as any).__down));
  }
  times.sort((a, b) => a - b);
  expect(times[2], `tap-to-screen times: ${times.map(Math.round).join(', ')} ms`).toBeLessThanOrEqual(100);
});

test('TAM-116: usable within 5 seconds of opening over a slow connection the first time', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'network slow-down needs Chromium');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  // Roughly a slow 4G link: 1.6 Mbps down, 150 ms round trip.
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 90_000 });
  const start = Date.now();
  await page.goto(HOME);
  await expect(page.getByRole('button', { name: /^Tambola/ })).toBeEnabled();
  expect(Date.now() - start).toBeLessThan(5_000);
});

test('TAM-118: an iPhone host sees a one-time "Add to Home Screen" tip, which mentions separate saved games', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'iPhone only');
  await page.goto(HOME);
  const tip = page.getByTestId('install-tip');
  await expect(tip).toBeVisible();
  await expect(tip.getByText(/Add to Home Screen/)).toBeVisible();
  await expect(tip.getByText(/separate/i)).toBeVisible();
  await tip.getByRole('button', { name: /Got it|Close|OK/ }).click();
  await page.reload();
  await expect(page.getByTestId('install-tip')).toHaveCount(0);
});

test('TAM-118: Android hosts do not see the iPhone tip', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Android only');
  await page.goto(HOME);
  await expect(page.getByTestId('install-tip')).toHaveCount(0);
});

test('TAM-113: no update prompt appears during a game', async ({ page }) => {
  await setUpPaperGame(page);
  await callMany(page, 2);
  await expect(page.getByText(/update/i)).toHaveCount(0);
});

test('TAM-136: nothing needs dragging (no draggable elements)', async ({ page }) => {
  await setUpPaperGame(page);
  await callMany(page, 2);
  expect(await page.locator('[draggable="true"]').count()).toBe(0);
});
