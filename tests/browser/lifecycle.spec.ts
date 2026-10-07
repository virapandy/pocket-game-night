// A game over time: TAM-065, TAM-066, TAM-068, TAM-103, TAM-111, TAM-112, TAM-115, TAM-140,
// PLT-002, PLT-003, PLT-004, PLT-005, PLT-007, PLT-008, PLT-012, PLT-013. End game and Discard are in the menu (TAM-124).
import { expect, test } from './fixtures';
import {
  call, callMany, calledNumbers, confirmPrizes, currentNumber, endGame, fromMenu, HOME, menuButton, menuItem, nextNumber, openTambola, recordWin, setUpPaperGame, fromHome,  waitOutTapGuard,
} from './helpers';

test('TAM-065, TAM-111, PLT-003: a refresh or reopen resumes the game exactly where it was', async ({ page }) => {
  await setUpPaperGame(page);
  const calls = await callMany(page, 5);
  await page.reload();
  const resume = page.getByRole('button', { name: /Tap to resume|Resume/ });
  await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
  if (await resume.first().isVisible()) await resume.first().click();
  await expect(currentNumber(page)).toHaveText(String(calls[4]));
  expect((await calledNumbers(page)).sort((a, b) => a - b)).toEqual([...calls].sort((a, b) => a - b));
});

test('TAM-112: after the phone discards the app, it reopens at the same number with "Game resumed"', async ({ page, context }) => {
  await setUpPaperGame(page);
  const n = await call(page);
  const url = page.url();
  await page.close();
  const again = await context.newPage();
  await again.goto(url);
  await expect(again.getByText(/Game resumed|Tap to resume/)).toBeVisible();
  const resume = again.getByRole('button', { name: /Tap to resume|Resume/ });
  await waitOutTapGuard(again); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
  if (await resume.first().isVisible()) await resume.first().click();
  await expect(currentNumber(again)).toHaveText(String(n));
});

test('TAM-111: pulling down does not refresh the page during a game', async ({ page }) => {
  await setUpPaperGame(page);
  await call(page);
  const overscroll = await page.evaluate(() => [getComputedStyle(document.documentElement).overscrollBehaviorY, getComputedStyle(document.body).overscrollBehaviorY]);
  expect(overscroll.some((v) => v === 'none' || v === 'contain')).toBe(true);
});

test('TAM-103 and TAM-066: ending needs a specific confirmation, then shows the payouts', async ({ page }) => {
  await setUpPaperGame(page);
  await callMany(page, 6);
  await recordWin(page, 'Early Five', ['Riya']);
  await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
  // End game is in the menu (TAM-124).
  await fromMenu(page, 'End game');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('End the game and show payouts?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep playing' }).click();
  await expect(nextNumber(page)).toBeVisible();
  // "End game" sits away from "Next number".
  const next = (await nextNumber(page).boundingBox())!;
  await menuButton(page).click();
  const end = (await menuItem(page, 'End game').first().boundingBox())!;
  expect(end.y + end.height).toBeLessThan(next.y - 100);
  await endGame(page);
  const summary = page.getByTestId('payout-summary');
  await expect(summary).toBeVisible();
  await expect(summary.getByText('Riya').first()).toBeVisible();
  await expect(summary.getByText('₹300').first()).toBeVisible(); // total paid out equals the pot
});

test('TAM-068: Play again keeps the players and prizes, and the anchor confirms again', async ({ page }) => {
  await setUpPaperGame(page, { players: ['Riya', 'Asha', 'Dad'] });
  const first = await callMany(page, 3);
  await endGame(page);
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
  await confirmPrizes(page); // Play again stays in the same session (PLT-016): the helper only answers if asked
  const second = await callMany(page, 3);
  expect(second).not.toEqual(first); // a new draw
  await page.getByRole('button', { name: 'Record a win' }).click();
  await page.getByRole('button', { name: 'Early Five', exact: true }).click();
  for (const name of ['Riya', 'Asha', 'Dad']) await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
});

test('PLT-005 and TAM-140: discarding asks first, voids the game, and shows contributions to hand back', async ({ page }) => {
  await setUpPaperGame(page, { players: ['Riya', 'Asha', 'Dad'] });
  await callMany(page, 6);
  await recordWin(page, 'Early Five', ['Asha']);
  // TAM-198 (owner, 2026-09-30): the menu still works while the won prize waits to be closed.
  await fromMenu(page, 'Discard game');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(/1 prize was already won|prizes? (was|were) already won/)).toBeVisible();
  await dialog.getByRole('button', { name: /Discard/ }).click();
  await expect(page.getByText(/hand back/i).first()).toBeVisible();
  await page.goto(HOME);
  await fromHome(page, 'History');
  await expect(page.getByText('Abandoned').first()).toBeVisible();
});

test('PLT-002: several unfinished games are allowed and listed on the home screen', async ({ page }) => {
  await setUpPaperGame(page);
  await callMany(page, 3);
  await page.goto(HOME);
  await setUpPaperGame(page, { players: ['X1', 'Y2'] });
  await call(page);
  await page.goto(HOME);
  const list = page.getByTestId('unfinished-games');
  await expect(list.getByText(/3 numbers called/)).toBeVisible();
  await expect(list.getByText(/1 number called/)).toBeVisible();
});

test('PLT-004: after more than 12 hours the app asks Resume, End it or Discard it, and never decides alone', async ({ page }) => {
  const t0 = new Date('2026-10-02T20:00:00+05:30');
  await page.clock.install({ time: t0 });
  await setUpPaperGame(page);
  await callMany(page, 2);
  await page.clock.setSystemTime(new Date(t0.getTime() + 13 * 3600_000));
  await page.goto(HOME);
  for (const name of [/^Resume/, /^End it/, /^Discard it/]) await expect(page.getByRole('button', { name })).toBeVisible();
});

test('PLT-004: within 12 hours the home screen shows the game with "Tap to resume", and one tap goes back in, paused', async ({ page }) => {
  const t0 = new Date('2026-10-02T20:00:00+05:30');
  await page.clock.install({ time: t0 });
  await setUpPaperGame(page);
  const calls = await callMany(page, 2);
  await page.clock.setSystemTime(new Date(t0.getTime() + 2 * 3600_000));
  await page.goto(HOME);
  // Not opened automatically: the host stays on the home screen, with the game listed.
  const list = page.getByTestId('unfinished-games');
  await expect(list.getByText(/2 numbers called/)).toBeVisible();
  const tap = list.getByText('Tap to resume');
  await expect(tap).toBeVisible();
  await expect(nextNumber(page)).toHaveCount(0);
  // The after-12-hours question is not asked yet.
  for (const name of [/^End it/, /^Discard it/]) await expect(page.getByRole('button', { name })).toHaveCount(0);
  // One tap goes straight back into the game, exactly where it was left.
  await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
  await tap.click();
  await expect(nextNumber(page)).toBeVisible();
  await expect(currentNumber(page)).toHaveText(String(calls[1]));
  expect((await calledNumbers(page)).sort((a, b) => a - b)).toEqual([...calls].sort((a, b) => a - b));
  // Paused: nothing is called on its own while the host waits.
  await page.clock.runFor(60_000);
  await expect(currentNumber(page)).toHaveText(String(calls[1]));
  expect(await calledNumbers(page)).toHaveLength(2);
});

test('PLT-007, PLT-008, PLT-013: History lists past games newest first, read-only, with a note that it lives on this phone', async ({ page }) => {
  await setUpPaperGame(page, { players: ['Riya', 'Dad'] });
  await callMany(page, 4);
  await endGame(page);
  await page.goto(HOME);
  await fromHome(page, 'History');
  await expect(page.getByText(/only on this phone/i)).toBeVisible();
  const row = page.getByTestId('history-game').first();
  await expect(row.getByText('Tambola')).toBeVisible();
  await expect(row.getByText(/2 players/)).toBeVisible();
  await row.click();
  await expect(page.getByTestId('call-list').locator('[data-number]')).toHaveCount(4);
  await expect(nextNumber(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Record a win' })).toHaveCount(0);
  await expect(page.locator('input:not([disabled]), textarea:not([disabled])')).toHaveCount(0);
});

test('PLT-013: the app asks the browser to keep its data when the first game starts', async ({ page }) => {
  // The stand-in goes on StorageManager.prototype, not on the navigator.storage object: WebKit can
  // replace that object's wrapper during page load, which silently drops a stand-in set on it
  // (see docs/test-questions.md, PLT-013).
  await page.addInitScript(() => {
    (window as any).__persist = 0;
    const standIn = async function persist() { (window as any).__persist++; return true; };
    (standIn as any).__standIn = true;
    if (typeof StorageManager !== 'undefined') StorageManager.prototype.persist = standIn;
  });
  await setUpPaperGame(page);
  // The stand-in must still be what the app would call, or this test proves nothing.
  expect(await page.evaluate(() => !!(navigator.storage?.persist as any)?.__standIn)).toBe(true);
  await call(page);
  expect(await page.evaluate(() => !!(navigator.storage?.persist as any)?.__standIn)).toBe(true);
  expect(await page.evaluate(() => (window as any).__persist)).toBeGreaterThan(0);
});

test('PLT-012: when storage is nearly full, the app says so and offers to delete the oldest games', async ({ page }) => {
  // Stand-in on StorageManager.prototype for the same reason as PLT-013 above.
  await page.addInitScript(() => {
    const standIn = async function estimate() { return { usage: 97, quota: 100 }; };
    (standIn as any).__standIn = true;
    if (typeof StorageManager !== 'undefined') StorageManager.prototype.estimate = standIn;
  });
  await page.goto(HOME);
  await fromHome(page, 'History');
  // The stand-in must still be what the app would call, or this test proves nothing.
  expect(await page.evaluate(() => !!(navigator.storage?.estimate as any)?.__standIn)).toBe(true);
  await expect(page.getByText(/storage is (nearly|almost) full/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Delete (the )?oldest/i })).toBeVisible();
});

test('TAM-115: if the browser cleared the saved data, a normal start screen appears with no error', async ({ page }) => {
  await setUpPaperGame(page);
  await callMany(page, 3);
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    const dbs = (await indexedDB.databases?.()) ?? [];
    await Promise.all(dbs.map((d) => new Promise((r) => { const q = indexedDB.deleteDatabase(d.name!); q.onsuccess = q.onerror = q.onblocked = r; })));
  });
  await page.goto(HOME);
  await expect(page.getByRole('heading', { name: 'Pocket Game Night' })).toBeVisible();
  await expect(page.getByText(/error|went wrong|corrupt|lost/i)).toHaveCount(0);
  await openTambola(page);
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
});
