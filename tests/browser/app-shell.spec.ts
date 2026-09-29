// The app shell: opens, installs, and works offline once opened (Phase 0 foundation; TAM-064, TAM-069, TAM-114).
import { expect, test, type Page } from './fixtures';
import { call, currentRhyme, HOME, openTambola, setUpPaperGame } from './helpers';

/** First visit with internet, then wait until the service worker has saved the app. */
async function visitOnceThenGoOffline(page: Page) {
  await page.goto(HOME);
  // The app saves itself on the first visit; updates wait for the host ('prompt'), so the worker
  // takes over from the next load. Wait until it is active, reload once online, then go offline.
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const sw = reg.active!;
    if (sw.state !== 'activated') await new Promise<void>((r) => sw.addEventListener('statechange', () => sw.state === 'activated' && r()));
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.context().setOffline(true);
}

// Owner decision 2026-09-28 (docs/decisions.md): these offline-reload tests run in Chromium only.
// Playwright's WebKit fails any navigation a service worker answers once setOffline(true) is on
// ("WebKit encountered an internal error"), even with no app code: microsoft/playwright#42775.
// Offline opening on iPhone is checked by hand instead and recorded in reports/latest.md.
const WEBKIT_OFFLINE_REASON =
  'Playwright WebKit cannot reload offline under a service worker (microsoft/playwright#42775); owner decision 2026-09-28 in docs/decisions.md, iPhone checked by hand';

test('the home screen opens and lists Tambola', async ({ page }) => {
  await page.goto(HOME);
  await expect(page.getByRole('heading', { name: 'Pocket Game Night' })).toBeVisible();
  await openTambola(page);
  await expect(page.getByRole('heading', { name: 'Tambola' })).toBeVisible();
});

test('the app is installable: it has a manifest with icons', async ({ page }) => {
  await page.goto(HOME);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await page.request.get(new URL(href!, page.url()).toString())).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThan(0);
});

test('after one visit, the app opens with no internet', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', WEBKIT_OFFLINE_REASON);
  await visitOnceThenGoOffline(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pocket Game Night' })).toBeVisible();
  await openTambola(page);
  await expect(page.getByRole('heading', { name: 'Tambola' })).toBeVisible();
});

test('TAM-064 and TAM-114: a full game works offline, with no offline error anywhere', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', WEBKIT_OFFLINE_REASON);
  await visitOnceThenGoOffline(page);
  await page.reload();
  await setUpPaperGame(page);
  for (let i = 0; i < 10; i++) await call(page);
  await expect(currentRhyme(page)).not.toBeEmpty();
  await expect(page.getByText(/offline|no internet|no connection|network error/i)).toHaveCount(0);
});

test('TAM-069: How to play opens offline from the start screen, with a sample ticket', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', WEBKIT_OFFLINE_REASON);
  await visitOnceThenGoOffline(page);
  await page.reload();
  await openTambola(page);
  await page.getByRole('button', { name: 'How to play' }).or(page.getByRole('link', { name: 'How to play' })).click();
  await expect(page.getByRole('heading', { name: /How to play/i })).toBeVisible();
  await expect(page.getByTestId('sample-ticket')).toBeVisible();
});
