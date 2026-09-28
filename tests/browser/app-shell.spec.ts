// The app shell: opens, installs, and works offline once opened (Phase 0 foundation; TAM-064, TAM-069, TAM-114).
import { expect, test, type Page } from '@playwright/test';
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

test('after one visit, the app opens with no internet', async ({ page }) => {
  await visitOnceThenGoOffline(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pocket Game Night' })).toBeVisible();
  await openTambola(page);
  await expect(page.getByRole('heading', { name: 'Tambola' })).toBeVisible();
});

test('TAM-064 and TAM-114: a full game works offline, with no offline error anywhere', async ({ page }) => {
  await visitOnceThenGoOffline(page);
  await page.reload();
  await setUpPaperGame(page);
  for (let i = 0; i < 10; i++) await call(page);
  await expect(currentRhyme(page)).not.toBeEmpty();
  await expect(page.getByText(/offline|no internet|no connection|network error/i)).toHaveCount(0);
});

test('TAM-069: How to play opens offline from the start screen, with a sample ticket', async ({ page }) => {
  await visitOnceThenGoOffline(page);
  await page.reload();
  await openTambola(page);
  await page.getByRole('button', { name: 'How to play' }).or(page.getByRole('link', { name: 'How to play' })).click();
  await expect(page.getByRole('heading', { name: /How to play/i })).toBeVisible();
  await expect(page.getByTestId('sample-ticket')).toBeVisible();
});
