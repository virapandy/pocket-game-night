// PLT-120 and PLT-121: Chrome for Android on a real Android phone emulator (tests/android/README.md).
// Everything the browser tests check in desktop Chromium's phone mode, checked again where Android itself acts:
// the back gesture, pulling down, Android closing the app, keeping the screen awake, and a slowed processor.
import type { Page } from '@playwright/test';
import { expect, SCREENS, test, type ScreenName } from './fixtures';
import {
  call, callMany, calledNumbers, currentNumber, HOME, nextNumber, recordWin, setUpPaperGame, undoLastCall, waitOutTapGuard,
} from '../browser/helpers';

/** The first visit, online: wait until the service worker controls the page, so the app works offline after. */
async function firstVisit(page: Page) {
  await page.goto(HOME);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 30_000 }).toBe(true);
}

/** TAM-138: the page itself does not scroll, and Next number is fully on screen. */
async function expectNoScrolling(page: Page, what: string) {
  const r = await page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    const b = document.querySelector('[data-testid="main-button"]')?.getBoundingClientRect();
    return { scroll: el.scrollHeight - window.innerHeight, bottom: b ? b.bottom - window.innerHeight : null };
  });
  expect(r.scroll, `${what}: the calling screen scrolls by ${r.scroll}px`).toBeLessThanOrEqual(1);
  if (r.bottom !== null) expect(r.bottom, `${what}: Next number is cut off`).toBeLessThanOrEqual(0.5);
}

/** Resume the game if the app asks (TAM-112: "Game resumed" / "Tap to resume"). */
async function resumeIfAsked(page: Page) {
  const resume = page.getByRole('button', { name: /Tap to resume|Resume/ });
  if (await resume.first().isVisible().catch(() => false)) {
    await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
    await resume.first().click();
  }
}

for (const screen of Object.keys(SCREENS) as ScreenName[]) {
  const { width, height } = SCREENS[screen];
  test.describe(`PLT-120: a full paper game on the Android emulator at ${width} × ${height}`, () => {
    test.use({ screen });

    test(`setup, calling, wins, a tie, closing tiers, undo, ending and the payout summary, offline after the first visit (${width} × ${height})`, async ({ page, context }) => {
      await firstVisit(page);
      expect(await page.evaluate(() => [window.screen.width, window.screen.height])).toEqual([width, height]);
      await context.setOffline(true);
      expect(await page.evaluate(() => navigator.onLine)).toBe(false);

      await setUpPaperGame(page);
      await callMany(page, 6);
      await expectNoScrolling(page, 'after 6 calls');
      await recordWin(page, 'Early Five', ['Riya']);
      await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();

      // Undo the last call within 5 seconds (TAM-119): the number goes back.
      const before = (await calledNumbers(page)).length;
      await call(page);
      await undoLastCall(page).click();
      await expect.poll(async () => (await calledNumbers(page)).length).toBe(before);

      await callMany(page, 4);
      await expectNoScrolling(page, 'after the undo');
      // A tie: two winners share Top Line (TAM-041).
      await recordWin(page, 'Top Line', ['Asha', 'Dad']);
      await page.getByRole('button', { name: 'Close Top Line', exact: true }).click();
      await call(page);
      await recordWin(page, 'Full House', ['Nani']);
      await page.getByRole('button', { name: 'Close Full House', exact: true }).click();
      const endNow = page.getByRole('button', { name: 'End game and show payouts' });
      await expect(endNow).toBeVisible();
      await endNow.click();

      const summary = page.getByTestId('payout-summary');
      await expect(summary).toBeVisible();
      for (const name of ['Riya', 'Asha', 'Dad', 'Nani']) await expect(summary.getByText(name).first()).toBeVisible();
      await expect(summary.getByText('₹300').first()).toBeVisible(); // 6 tickets × ₹50: what goes out equals the pot
      expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    });
  });
}

test.describe('PLT-121: Android-only behaviour on the emulator (390 × 844)', () => {
  /** The gesture-navigation back gesture: a swipe in from the left edge, half-way down the screen. */
  async function backGesture(device: import('@playwright/test').AndroidDevice) {
    const y = Math.round(SCREENS.standard.height * 1.5);
    await device.shell(`input swipe 2 ${y} ${Math.round(SCREENS.standard.width * 1.5)} ${y} 200`);
  }

  test('TAM-111: swiping in from the edge (Android\'s back gesture) during a game does not navigate away, each time', async ({ page, device }) => {
    await setUpPaperGame(page);
    const calls = await callMany(page, 3);
    const url = page.url();
    for (let round = 1; round <= 3; round++) {
      await backGesture(device);
      await page.waitForTimeout(1500);
      expect(page.url(), `back gesture ${round}: the page navigated away`).toBe(url);
      await expect(currentNumber(page), `back gesture ${round}: the calling screen is gone`).toHaveText(String(calls[calls.length - 1]), { timeout: 3000 });
      calls.push(await call(page)); // the host carries on calling between gestures
    }
    expect((await calledNumbers(page)).sort((a, b) => a - b)).toEqual([...calls].sort((a, b) => a - b));
  });

  // TAM-111 says a swipe from the edge during a game never navigates away; it does not say "only after a tap".
  // So two or three back gestures in a row, with nothing tapped in between, must also leave the game on screen.
  test('TAM-111: back gestures in a row, with no tap in between, do not navigate away', async ({ page, device }) => {
    await setUpPaperGame(page);
    const calls = await callMany(page, 3);
    const url = page.url();
    for (let round = 1; round <= 3; round++) {
      await backGesture(device);
      await page.waitForTimeout(1500);
      expect(page.url(), `back gesture ${round} in a row: the page navigated away`).toBe(url);
      await expect(currentNumber(page), `back gesture ${round} in a row: the calling screen is gone`).toHaveText(String(calls[calls.length - 1]), { timeout: 3000 });
    }
    expect((await calledNumbers(page)).sort((a, b) => a - b)).toEqual([...calls].sort((a, b) => a - b));
  });

  test('TAM-111 and TAM-065: if the page is left anyway, the game resumes exactly where it was', async ({ page }) => {
    await setUpPaperGame(page);
    const calls = await callMany(page, 3);
    await page.goto('about:blank');
    await page.goto(HOME);
    await waitOutTapGuard(page); // 1.3.1 (I29, R2)
    await page.getByText('Tap to resume').first().click();
    await resumeIfAsked(page);
    await expect(currentNumber(page)).toHaveText(String(calls[2]));
    expect((await calledNumbers(page)).sort((a, b) => a - b)).toEqual([...calls].sort((a, b) => a - b));
  });

  test('TAM-111: pulling down on the calling screen does not refresh the page', async ({ page, device }) => {
    await setUpPaperGame(page);
    const n = await call(page);
    await page.evaluate(() => { (window as any).__notReloaded = true; });
    const x = Math.round(SCREENS.standard.width * 1.5);
    await device.shell(`input swipe ${x} 700 ${x} 2300 300`);
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => (window as any).__notReloaded === true), 'the page was refreshed by pulling down').toBe(true);
    await expect(currentNumber(page)).toHaveText(String(n));
  });

  test('TAM-112: Android closing Chrome in the background does not lose the game: it reopens at the same number', async ({ page, context, device }) => {
    await setUpPaperGame(page);
    const calls = await callMany(page, 4);
    const url = page.url();
    // The game on screen is saved on this phone (pgn.game.*) with every call, updated at or after the last call.
    await expect.poll(() => page.evaluate((n) => {
      for (const k of Object.keys(localStorage)) {
        if (!k.startsWith('pgn.game.')) continue;
        try {
          const g = JSON.parse(localStorage.getItem(k)!);
          if (g.gameType !== 'tambola' || g.status === 'ended' || !Array.isArray(g.records)) continue;
          const callRecords = g.records.filter((r: any) => r?.move?.type === 'call');
          const lastCall = callRecords.at(-1);
          if (callRecords.length >= n && lastCall && typeof g.updatedAt === 'number' && g.updatedAt >= lastCall.at) return true;
        } catch { /* not a saved game */ }
      }
      return false;
    }, calls.length), { message: 'the game was not saved after the last call', timeout: 10_000 }).toBe(true);
    await device.shell('input keyevent KEYCODE_HOME');
    // TAM-112's Given: Android discards an app that has been in the background a while, not the instant it leaves.
    await page.waitForTimeout(10_000);
    // Chrome really went to the background: it is no longer the resumed activity.
    await expect.poll(async () => {
      const out = (await device.shell('dumpsys activity activities')).toString();
      return out.split('\n').filter((l) => /ResumedActivity/.test(l) && /com\.android\.chrome/.test(l)).length;
    }, { message: 'Chrome is still the resumed activity after going home', timeout: 10_000 }).toBe(0);
    await context.close().catch(() => undefined);
    await device.shell('am kill com.android.chrome');
    await device.shell('am force-stop com.android.chrome');
    const again = await device.launchBrowser({ baseURL: page.url().replace(/#.*$/, '').replace(/[^/]*$/, '') });
    await new Promise((r) => setTimeout(r, 1500));
    // A fresh load of the app, as the host returning to it gets. Chrome comes back with one tab of its own; Playwright's
    // `newPage()` on a relaunched Chrome for Android fails inside Playwright ("Cannot read properties of undefined
    // (reading '_page')", weekly run 37254838465, a tool fault), so that tab is used: it is emptied first, so the app
    // loads from scratch from what was saved on the phone.
    const p = again.pages()[0] ?? (await again.waitForEvent('page', { timeout: 15_000 }));
    await p.goto('about:blank');
    await p.goto(url);
    await expect(p.getByText(/Game resumed|Tap to resume/)).toBeVisible();
    await resumeIfAsked(p);
    await expect(currentNumber(p)).toHaveText(String(calls[3]));
    await again.close();
  });

  test('TAM-064: the app can be installed to the home screen and opens offline from there', async ({ page, context, device }) => {
    await firstVisit(page);
    // Chrome's own installability check (the same one that offers "Install app" / "Add to Home screen").
    const cdp = await context.newCDPSession(page);
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
    expect(installabilityErrors.map((e: any) => e.errorId)).toEqual([]);
    const manifest = await cdp.send('Page.getAppManifest');
    expect(manifest.errors ?? []).toEqual([]);
    const start = new URL(JSON.parse(manifest.data ?? '{}').start_url ?? '.', manifest.url).toString();
    // Opening the installed app is opening its start address: offline, it must still load and start a game.
    await context.setOffline(true);
    await page.goto(start);
    await setUpPaperGame(page);
    await call(page);
    await expect(currentNumber(page)).toHaveText(/^\s*\d{1,2}\s*$/);
    void device;
  });

  test('TAM-110 and TAM-128: during a game Android keeps the screen awake, or the hint appears', async ({ page, device }) => {
    await setUpPaperGame(page);
    await call(page);
    await page.waitForTimeout(1500);
    const power = await device.shell('dumpsys power');
    const locks = power.toString().split('\n').filter((l) => /SCREEN_(BRIGHT|DIM)_WAKE_LOCK|FULL_WAKE_LOCK/.test(l) && /chrome|WakeLock|Blink|screen/i.test(l));
    const hint = page.getByText(/Screen may sleep|keep your screen on/i).first();
    const hinted = await hint.isVisible().catch(() => false);
    expect(locks.length > 0 || hinted, 'Android holds no screen wake lock for Chrome, and no hint is shown').toBe(true);
  });

  test('TAM-116: with the processor slowed like a budget phone, taps respond within 100 ms', async ({ page, context }) => {
    await setUpPaperGame(page);
    const cdp = await context.newCDPSession(page);
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
      await nextNumber(page).tap();
      await page.waitForTimeout(600);
      times.push(await page.evaluate(() => (window as any).__shown - (window as any).__down));
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    for (const t of times) expect(t, `a tap took ${Math.round(t)} ms to show (times: ${times.map(Math.round).join(', ')})`).toBeLessThanOrEqual(100);
  });
});

// The emulator's own tool, for the report: which Android and Chrome ran.
test('the emulator in use (for the report)', async ({ page, device }) => {
  await page.goto(HOME);
  const ua = await page.evaluate(() => navigator.userAgent);
  const android = (await device.shell('getprop ro.build.version.release')).toString().trim();
  test.info().annotations.push({ type: 'emulator', description: `${device.model()} Android ${android}; ${ua.match(/Chrome\/[\d.]+/)?.[0]}` });
  expect(ua).toMatch(/Android/);
});
