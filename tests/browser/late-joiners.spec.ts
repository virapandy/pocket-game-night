// Phase 1b: late joiners on the host phone (paper tickets).
// Scenarios: TAM-067 (a late joiner gets a ticket mid-game; new prize amounts shown for the anchor; no more
// after 10 numbers), TAM-184 (taken out again before the next number; not after; hidden when late joining is
// 0), TAM-093 (a late joiner's ticket counts in money handed back). Names and test ids: tests/browser/README.md.
import { expect, test, type Page } from '@playwright/test';
import { callMany, dismiss, endGame, fromMenu, menuButton, menuItem, openTambola, recordWin, setUpPaperGame } from './helpers';

const FAMILY = ['Riya', 'Asha', 'Dad']; // ₹50 each: a ₹150 pot

/** Menu → "Add a late player" → name (and tickets) → Add. */
async function addLatePlayer(page: Page, name: string, tickets?: number) {
  await fromMenu(page, 'Add a late player');
  await page.getByLabel('Name of late player', { exact: true }).fill(name);
  if (tickets !== undefined) await page.getByLabel('Tickets', { exact: true }).fill(String(tickets));
  await page.getByRole('button', { name: 'Add', exact: true }).click();
}

/** The amounts on the prize update shown for the anchor: { "Early Five": 30, … } from each row's data attributes. */
async function prizeUpdate(page: Page): Promise<Record<string, number>> {
  const update = page.getByTestId('prize-update');
  await expect(update).toBeVisible();
  const tiers = update.locator('[data-pattern]');
  const out: Record<string, number> = {};
  for (let i = 0; i < (await tiers.count()); i++) {
    out[(await tiers.nth(i).getAttribute('data-pattern'))!] = Number(await tiers.nth(i).getAttribute('data-amount'));
  }
  return out;
}
const total = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

test('TAM-067: after 6 numbers the host adds Kabir; the new prize amounts are shown for the anchor, adding up to the new pot', async ({ page }) => {
  await setUpPaperGame(page, { players: FAMILY });
  await callMany(page, 6);
  await addLatePlayer(page, 'Kabir');
  const update = await prizeUpdate(page);
  expect(Object.keys(update).sort()).toEqual(['early-five', 'full-house', 'top-line']);
  expect(total(update)).toBe(200);
  await expect(page.getByTestId('prize-update')).toContainText('₹');
  await dismiss(page);
  // Kabir can now be picked for a win.
  await recordWin(page, 'Early Five', ['Kabir']);
  await expect(page.getByTestId('claim-result')).toContainText('Kabir');
});

test('TAM-067 and TAM-093: the late joiner pays in and shares the money handed back like every other ticket', async ({ page }) => {
  await setUpPaperGame(page, { players: FAMILY });
  await callMany(page, 6);
  await addLatePlayer(page, 'Kabir');
  const update = await prizeUpdate(page);
  await dismiss(page);
  await recordWin(page, 'Full House', ['Riya']);
  await page.getByRole('button', { name: 'Close Full House', exact: true }).click();
  const endNow = page.getByRole('button', { name: 'End game and show payouts' });
  if (await endNow.isVisible()) await endNow.click();
  else await endGame(page);
  const summary = page.getByTestId('payout-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Kabir');
  // Early Five and Top Line were not won: their money goes back across 4 tickets, extra rupees in player order.
  const unwon = update['early-five']! + update['top-line']!;
  const kabirShare = Math.floor(unwon / 4);
  await expect(summary).toContainText(/Pot\s*₹\s*200\b/); // the pot now includes Kabir's ₹50
  await expect(summary).toContainText(`₹${kabirShare}`);
});

test('TAM-067: when 10 numbers have been called, the host can no longer add players', async ({ page }) => {
  await setUpPaperGame(page, { players: FAMILY });
  await callMany(page, 9);
  await menuButton(page).click();
  await expect(menuItem(page, 'Add a late player').first()).toBeEnabled();
  await page.keyboard.press('Escape');
  if (await menuItem(page, 'Add a late player').first().isVisible()) await menuButton(page).click();
  await callMany(page, 1);
  await menuButton(page).click();
  const item = menuItem(page, 'Add a late player');
  expect((await item.count()) === 0 || (await item.first().isDisabled())).toBe(true);
});

test.describe('TAM-184: a late joiner added by mistake can be taken out again', () => {
  test('before the next number: removing Kabir puts the prizes back, and shows them for the anchor', async ({ page }) => {
    await setUpPaperGame(page, { players: FAMILY });
    await callMany(page, 6);
    await addLatePlayer(page, 'Kabir');
    await dismiss(page);
    await fromMenu(page, 'Add a late player');
    await page.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const back = await prizeUpdate(page);
    expect(total(back)).toBe(150);
    await dismiss(page);
    await page.getByRole('button', { name: 'Record a win' }).click();
    await page.getByRole('button', { name: 'Early Five', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Kabir', exact: true })).toHaveCount(0);
  });

  test('once a number has been called after he joined, he can no longer be removed', async ({ page }) => {
    await setUpPaperGame(page, { players: FAMILY });
    await callMany(page, 6);
    await addLatePlayer(page, 'Kabir');
    await dismiss(page);
    await callMany(page, 1);
    await fromMenu(page, 'Add a late player');
    const remove = page.getByRole('button', { name: 'Remove Kabir', exact: true });
    expect((await remove.count()) === 0 || (await remove.isDisabled())).toBe(true);
  });

  test('edge: with late joining set to 0, "Add a late player" does not appear at all', async ({ page }) => {
    await openTambola(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    const setting = page.getByLabel(/^Late joining/);
    if ((await setting.evaluate((el) => el.tagName)) === 'SELECT') await setting.selectOption('0');
    else await setting.fill('0');
    await dismiss(page);
    await setUpPaperGame(page, { players: FAMILY });
    await callMany(page, 2);
    await menuButton(page).click();
    await expect(menuItem(page, 'Add a late player')).toHaveCount(0);
  });
});
