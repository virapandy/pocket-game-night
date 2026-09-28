// Checking a paper-ticket claim on the host phone: TAM-031, TAM-033, TAM-037, TAM-039, TAM-086, TAM-105, TAM-070.
import { expect, test } from '@playwright/test';
import { callMany, checkClaim, setUpPaperGame } from './helpers';

test.beforeEach(async ({ page }) => {
  await setUpPaperGame(page);
});

test('TAM-037, TAM-033, TAM-086, TAM-105: an accepted claim shows ✓ for each number, "✓ Accepted" and the prize', async ({ page }) => {
  const calls = await callMany(page, 6);
  await checkClaim(page, 'Riya', 'Top Line', calls.slice(-5));
  const result = page.getByTestId('claim-result');
  await expect(result.getByText('✓ Accepted')).toBeVisible();
  await expect(result.getByText(/Accepted: ₹\d+ to Riya/)).toBeVisible();
  await expect(result.locator('[data-called="true"]')).toHaveCount(5);
  for (const n of calls.slice(-5)) await expect(result.getByText(`${n} ✓`, { exact: true })).toBeVisible();
});

test('TAM-037 and TAM-105: a bogey shows ✗ next to the number that was not called, and "✗ Bogey"', async ({ page }) => {
  const calls = await callMany(page, 6);
  const notCalled = Array.from({ length: 90 }, (_, i) => i + 1).find((n) => !calls.includes(n))!;
  await checkClaim(page, 'Asha', 'Top Line', [...calls.slice(-4), notCalled]);
  const result = page.getByTestId('claim-result');
  await expect(result.getByText('✗ Bogey')).toBeVisible();
  await expect(result.getByText(`${notCalled} ✗`, { exact: true })).toBeVisible();
  await expect(result.locator('[data-called="false"]')).toHaveCount(1);
});

test('TAM-038: a late claim says which number completed the pattern', async ({ page }) => {
  const calls = await callMany(page, 6);
  await callMany(page, 1);
  await checkClaim(page, 'Dad', 'Top Line', calls.slice(-5));
  await expect(page.getByTestId('claim-result').getByText(new RegExp(`Top Line was complete at ${calls[5]}(?!\\d)`))).toBeVisible();
});

test('TAM-039: the host picks the claiming player from the names in one tap', async ({ page }) => {
  await callMany(page, 5);
  await page.getByRole('button', { name: 'Check a claim' }).click();
  for (const name of ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
});

test('TAM-031: a pattern not in this game cannot be chosen', async ({ page }) => {
  // 6 tickets: no Four Corners tier.
  await callMany(page, 5);
  await page.getByRole('button', { name: 'Check a claim' }).click();
  await page.getByRole('button', { name: 'Riya', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Top Line', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Four Corners', exact: true })).toHaveCount(0);
});

test('TAM-070: the host can undo a wrongly accepted claim, after confirming', async ({ page }) => {
  const calls = await callMany(page, 6);
  await checkClaim(page, 'Kabir', 'Early Five', calls.slice(-5));
  await expect(page.getByTestId('claim-result').getByText('✓ Accepted')).toBeVisible();
  await page.getByRole('button', { name: /^Undo/ }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /Undo/ }).click();
  await page.getByRole('button', { name: 'Check a claim' }).click();
  await page.getByRole('button', { name: 'Riya', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Early Five', exact: true })).toBeVisible();
});

test('TAM-145: after an accepted claim the host can add another winner or close the tier; the next number waits', async ({ page }) => {
  const calls = await callMany(page, 6);
  await checkClaim(page, 'Riya', 'Top Line', calls.slice(-5));
  await expect(page.getByRole('button', { name: 'Add another winner' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close Top Line' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next number' })).toBeDisabled();
  await page.getByRole('button', { name: 'Add another winner' }).click();
  await page.getByRole('button', { name: 'Asha', exact: true }).click();
  await page.getByLabel('Numbers read out').fill(calls.slice(-5).join(' '));
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByTestId('claim-result').getByText(/Shared/)).toBeVisible();
  await page.getByRole('button', { name: 'Close Top Line' }).click();
  await expect(page.getByRole('button', { name: 'Next number' })).toBeEnabled();
});
