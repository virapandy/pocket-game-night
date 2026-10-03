// Recording paper-ticket wins on the host phone (change request of 28 September 2026: trust the anchor):
// TAM-031, TAM-033, TAM-037, TAM-039, TAM-070, TAM-086, TAM-088, TAM-089, TAM-105, TAM-139, TAM-145.
import { expect, test, type Page } from './fixtures';
import {
  callMany, checkNumbers, dismiss, endGame, fromMenu, mainButton, menuItem, nextNumber, nextNumberWaits, recordBogey, recordWin,
  setUpPaperGame,
} from './helpers';

const result = (page: Page) => page.getByTestId('claim-result');
const fontPx = (page: Page, text: RegExp) =>
  result(page).getByText(text).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

test.describe('with six named players', () => {
  test.beforeEach(async ({ page }) => {
    await setUpPaperGame(page);
  });

  test('TAM-037, TAM-033, TAM-086, TAM-105: "Record a win" takes the prize and player, no numbers, and shows "Top Line: ✓ Riya, ₹…" large', async ({ page }) => {
    await callMany(page, 3);
    await page.getByRole('button', { name: 'Record a win' }).click();
    await page.getByRole('button', { name: 'Top Line', exact: true }).click();
    await page.getByRole('button', { name: 'Riya', exact: true }).click();
    // No numbers are typed with paper tickets.
    await expect(page.getByLabel('Numbers read out')).toHaveCount(0);
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(result(page).getByText(/Top Line: ✓ Riya, ₹\d+/)).toBeVisible();
    // Large text for the room (WCAG "large": at least 24 CSS px), and no ticket to show with paper tickets.
    expect(await fontPx(page, /Top Line: ✓ Riya/)).toBeGreaterThanOrEqual(24);
    await expect(result(page).locator('[data-called]')).toHaveCount(0);
  });

  test('TAM-037, TAM-033, TAM-105: a bogey ruled by the anchor shows "✗ Bogey" with the name, and appears in the summary', async ({ page }) => {
    await callMany(page, 3);
    await recordBogey(page, 'Top Line', 'Asha');
    await expect(result(page).getByText('✗ Bogey')).toBeVisible();
    await expect(result(page).getByText(/Asha/).first()).toBeVisible();
    await expect(result(page).getByText(/Top Line/).first()).toBeVisible();
    expect(await fontPx(page, /Bogey/)).toBeGreaterThanOrEqual(24);
    // A bogey does not stop the game: the next number can be called.
    await expect(nextNumber(page)).toBeEnabled();
    await endGame(page);
    await expect(page.getByTestId('payout-summary').getByText(/Bogey: Asha/)).toBeVisible();
  });

  test('TAM-039: the host picks the claiming player from the names in one tap', async ({ page }) => {
    await callMany(page, 3);
    await page.getByRole('button', { name: 'Record a win' }).click();
    await page.getByRole('button', { name: 'Early Five', exact: true }).click();
    for (const name of ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
  });

  test('TAM-039 and TAM-037: several players can be picked for a tie; both are credited in the summary', async ({ page }) => {
    await callMany(page, 3);
    await recordWin(page, 'Top Line', ['Riya', 'Asha']);
    await expect(result(page).getByText(/Shared/)).toBeVisible();
    await page.getByRole('button', { name: 'Close Top Line', exact: true }).click();
    await endGame(page);
    const summary = page.getByTestId('payout-summary');
    await expect(summary.getByText(/Riya/).first()).toBeVisible();
    await expect(summary.getByText(/Asha/).first()).toBeVisible();
  });

  test('TAM-031: a pattern not in this game cannot be chosen', async ({ page }) => {
    // 6 tickets: no Four Corners tier.
    await callMany(page, 3);
    await page.getByRole('button', { name: 'Record a win' }).click();
    await expect(page.getByRole('button', { name: 'Top Line', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Four Corners', exact: true })).toHaveCount(0);
  });

  test('TAM-070: the host can undo a wrongly recorded win, after confirming; the prize is open again', async ({ page }) => {
    await callMany(page, 3);
    await recordWin(page, 'Early Five', ['Kabir']);
    await expect(result(page).getByText(/Early Five: ✓ Kabir/)).toBeVisible();
    await result(page).getByRole('button', { name: /^Undo/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Undo/ }).click();
    await expect(nextNumber(page)).toBeEnabled();
    await page.getByRole('button', { name: 'Record a win' }).click();
    await expect(page.getByRole('button', { name: 'Early Five', exact: true })).toBeVisible();
  });

  // TAM-145 as reworded by the owner on 2026-09-30 (TAM-198): the main button becomes "Close Top Line" until closed.
  test('TAM-145: after a win the host can add another winner or close the tier; the main button is "Close Top Line" until then', async ({ page }) => {
    await callMany(page, 3);
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(page.getByRole('button', { name: 'Add another winner' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close Top Line', exact: true })).toBeVisible();
    await expect(mainButton(page)).toHaveAccessibleName('Close Top Line');
    expect(await nextNumberWaits(page)).toBe(true);
    await page.getByRole('button', { name: 'Add another winner' }).click();
    await page.getByRole('button', { name: 'Asha', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(result(page).getByText(/Shared/)).toBeVisible();
    await expect(mainButton(page)).toHaveAccessibleName('Close Top Line');
    await page.getByRole('button', { name: 'Close Top Line', exact: true }).click();
    await expect(nextNumber(page)).toBeEnabled();
  });

  // Owner decision 2026-09-29 (review finding 4): after the host closes a tier, its result goes away by itself.
  test('TAM-145: after "Close Top Line" the win goes away by itself; no Done is needed', { tag: '@smoke' }, async ({ page }) => {
    await callMany(page, 3);
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(result(page)).toBeVisible();
    await page.getByRole('button', { name: 'Close Top Line', exact: true }).click();
    // Nothing else is tapped: no Done, no Close, no tap on the card.
    await expect(result(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
    await expect(nextNumber(page)).toBeEnabled();
  });

  test('TAM-145: a shared win goes away by itself too, once the host closes the tier', async ({ page }) => {
    await callMany(page, 3);
    await recordWin(page, 'Top Line', ['Riya']);
    await page.getByRole('button', { name: 'Add another winner' }).click();
    await page.getByRole('button', { name: 'Asha', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(result(page).getByText(/Shared/)).toBeVisible();
    await page.getByRole('button', { name: 'Close Top Line', exact: true }).click();
    await expect(result(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
  });

  test('TAM-139, TAM-105: "Check numbers" is only in the menu; it shows ✓ and ✗ per number and records nothing', async ({ page }) => {
    const calls = await callMany(page, 6);
    // Not on the calling screen itself.
    await expect(page.getByRole('button', { name: 'Check numbers', exact: true })).toHaveCount(0);
    const notCalled = Array.from({ length: 90 }, (_, i) => i + 1).find((n) => !calls.includes(n))!;
    await checkNumbers(page, 'Top Line', [...calls.slice(-4), notCalled]);
    const check = page.getByTestId('check-result');
    for (const n of calls.slice(-4)) await expect(check.getByText(`${n} ✓`, { exact: true })).toBeVisible();
    await expect(check.getByText(`${notCalled} ✗`, { exact: true })).toBeVisible();
    await expect(check.locator('[data-called="true"]')).toHaveCount(4);
    await expect(check.locator('[data-called="false"]')).toHaveCount(1);
    await expect(check.getByText(/not complete/i)).toBeVisible();
    await dismiss(page);
    // Nothing was recorded: no win, no bogey, and the next number can be called.
    await expect(result(page)).toHaveCount(0);
    await expect(nextNumber(page)).toBeEnabled();
    await endGame(page);
    await expect(page.getByTestId('payout-summary').getByText(/Bogey/)).toHaveCount(0);
  });

  test('TAM-139: numbers that are all called complete the pattern on called numbers', async ({ page }) => {
    const calls = await callMany(page, 6);
    await checkNumbers(page, 'Top Line', calls.slice(-5));
    const check = page.getByTestId('check-result');
    await expect(check.locator('[data-called="true"]')).toHaveCount(5);
    await expect(check.getByText(/complete/i).first()).toBeVisible();
    await expect(check.getByText(/not complete/i)).toHaveCount(0);
  });

  test('TAM-139 wrong input: outside 1 to 90, typed twice, or too few ("Top Line needs 5 numbers")', async ({ page }) => {
    const calls = await callMany(page, 6);
    const four = calls.slice(-4);
    for (const nums of [[...four, 91], [...four, four[0]!]]) {
      await checkNumbers(page, 'Top Line', nums);
      const check = page.getByTestId('check-result');
      await expect(check.locator('[data-called]')).toHaveCount(0);
      await expect(check).not.toBeEmpty();
      await dismiss(page);
    }
    await checkNumbers(page, 'Top Line', four);
    await expect(page.getByText('Top Line needs 5 numbers')).toBeVisible();
  });

  test('TAM-124: the menu holds Settings, Show the room, Board, Check numbers, End game and Discard game', async ({ page }) => {
    await callMany(page, 1);
    await page.getByRole('button', { name: /Menu/ }).click();
    for (const name of ['Settings', 'Show the room', 'Board', 'Check numbers', 'End game', 'Discard game']) {
      await expect(menuItem(page, name).first()).toBeVisible();
    }
  });

  // TAM-088 and TAM-089 as reworded by the owner on 2026-09-30: each person's row shows paid, won and net.
  test('TAM-088 and TAM-089: the summary shows prizes not won, and per person paid, won and net', async ({ page }) => {
    await callMany(page, 3);
    await recordWin(page, 'Early Five', ['Riya']);
    await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
    await endGame(page);
    const summary = page.getByTestId('payout-summary');
    await expect(summary.getByText(/not won/i).first()).toBeVisible();
    for (const word of [/paid/i, /won/i, /net/i]) await expect(summary.getByText(word).first()).toBeVisible();
    await expect(summary.getByText('₹300').first()).toBeVisible(); // prizes plus money handed back equal the pot
  });
});

test('TAM-086: a win for a player left unnamed shows "Player 4"', async ({ page }) => {
  await setUpPaperGame(page, { players: ['Riya', 'Asha', 'Dad', ''] });
  await callMany(page, 3);
  await recordWin(page, 'Top Line', ['Player 4']);
  await expect(result(page).getByText(/Top Line: ✓ Player 4, ₹\d+/)).toBeVisible();
});

test('TAM-086 and TAM-090: with "No money" the win shows no amount', async ({ page }) => {
  await setUpPaperGame(page, { contribution: 'none' });
  await callMany(page, 3);
  await recordWin(page, 'Top Line', ['Riya']);
  await expect(result(page).getByText(/Top Line: ✓ Riya/)).toBeVisible();
  await expect(result(page).getByText(/₹/)).toHaveCount(0);
  // TAM-198 (owner, 2026-09-30): the menu still works while the won prize waits to be closed.
  await fromMenu(page, 'End game');
  await page.getByRole('dialog').getByRole('button', { name: 'End game' }).click();
  await expect(page.getByText(/handed back/i)).toHaveCount(0);
});
