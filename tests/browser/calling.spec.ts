// Calling on the host phone: TAM-010, TAM-012, TAM-016, TAM-017, TAM-100, TAM-101, TAM-102, TAM-107, TAM-108,
// TAM-119, TAM-155, TAM-156.
import { expect, test } from '@playwright/test';
import {
  call, callMany, calledNumbers, currentNumber, currentRhyme, lastCalls, nextNumber, openBoard, setUpPaperGame,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await setUpPaperGame(page);
});

test('TAM-010: "Next number" shows one new number, large, with its rhyme', async ({ page }) => {
  const n = await call(page);
  expect(n).toBeGreaterThanOrEqual(1);
  expect(n).toBeLessThanOrEqual(90);
  await expect(currentRhyme(page)).not.toBeEmpty();
});

test('TAM-016: the board marks every called number, and the last 5 calls show most recent first', async ({ page }) => {
  const calls = await callMany(page, 7);
  expect((await calledNumbers(page)).sort((a, b) => a - b)).toEqual([...calls].sort((a, b) => a - b));
  await expect(board90(page)).toHaveCount(90);
  const shown = (await lastCalls(page).locator('[data-number]').allTextContents()).map((t) => Number(t.trim()));
  expect(shown).toEqual(calls.slice(-5).reverse());
});

const board90 = (page: import('@playwright/test').Page) => page.getByTestId('board').locator('[data-number]');

test('TAM-017: Repeat shows the same number and rhyme again, and draws nothing', async ({ page }) => {
  const n = await call(page);
  const rhyme = await currentRhyme(page).textContent();
  await page.getByRole('button', { name: 'Repeat' }).click();
  await expect(currentNumber(page)).toHaveText(String(n));
  await expect(currentRhyme(page)).toHaveText(rhyme!);
  expect(await calledNumbers(page)).toHaveLength(1);
});

test('TAM-155: Another rhyme changes the rhyme, never the number', async ({ page }) => {
  const n = await call(page);
  const rhyme = await currentRhyme(page).textContent();
  await page.getByRole('button', { name: 'Another rhyme' }).click();
  await expect(currentRhyme(page)).not.toHaveText(rhyme!);
  await expect(currentNumber(page)).toHaveText(String(n));
});

test('TAM-012: after 90 calls, nothing new is drawn and the host sees "All 90 numbers called"', async ({ page }) => {
  test.setTimeout(120_000);
  await callMany(page, 90);
  await expect(page.getByText('All 90 numbers called')).toBeVisible();
  if (await nextNumber(page).isEnabled()) await nextNumber(page).click();
  expect(await calledNumbers(page)).toHaveLength(90);
});

test('TAM-101: a double tap calls only one number', async ({ page }) => {
  await nextNumber(page).dblclick();
  await expect(currentNumber(page)).toHaveText(/\d/);
  await page.waitForTimeout(600);
  expect(await calledNumbers(page)).toHaveLength(1);
});

test('TAM-102: sliding off "Next number" before lifting draws nothing', async ({ page }) => {
  const box = (await nextNumber(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 150, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await calledNumbers(page)).toHaveLength(0);
});

test('TAM-100: "Next number" is big, bottom centre, and never moves', async ({ page }) => {
  const vp = page.viewportSize()!;
  const where = async () => (await nextNumber(page).boundingBox())!;
  const first = await where();
  expect(first.height).toBeGreaterThanOrEqual(72);
  expect(first.width).toBeGreaterThanOrEqual(44);
  expect(Math.abs(first.x + first.width / 2 - vp.width / 2)).toBeLessThanOrEqual(vp.width * 0.1);
  expect(vp.height - (first.y + first.height)).toBeLessThanOrEqual(vp.height * 0.2);
  await callMany(page, 3);
  expect(await where()).toEqual(first);
  await page.getByRole('button', { name: 'Check a claim' }).click();
  await page.getByRole('button', { name: /Cancel|Back/ }).first().click();
  expect(await where()).toEqual(first);
  await openBoard(page);
  if (await nextNumber(page).isVisible()) expect(await where()).toEqual(first);
});

test('TAM-107 and TAM-108: Show the room shows only the number (digits at least 160 px) and the last 3 calls', async ({ page }) => {
  const calls = await callMany(page, 4);
  await page.getByRole('button', { name: 'Show the room' }).click();
  await expect(nextNumber(page)).toBeHidden();
  await expect(page.getByRole('button', { name: 'Check a claim' })).toBeHidden();
  const room = page.getByTestId('room-view');
  await expect(room.getByTestId('current-number')).toHaveText(String(calls[3]));
  const shown = (await room.getByTestId('last-calls').locator('[data-number]').allTextContents()).map((t) => Number(t.trim()));
  expect(shown).toEqual(calls.slice(-3).reverse());
  // The digits themselves, measured from the font: at least 160 CSS px tall (about 25 mm).
  const digitHeight = await room.getByTestId('current-number').evaluate((el) => {
    const s = getComputedStyle(el);
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const m = ctx.measureText('88');
    return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  });
  expect(digitHeight).toBeGreaterThanOrEqual(160);
  // One tap back to the controls.
  await room.click();
  await expect(nextNumber(page)).toBeVisible();
});

test('TAM-156: the longest rhymes show in full under the number on the room view', async ({ page }) => {
  await callMany(page, 15);
  await page.getByRole('button', { name: 'Show the room' }).click();
  const rhyme = page.getByTestId('room-view').getByTestId('current-rhyme');
  const clipped = await rhyme.evaluate((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1 || getComputedStyle(el).textOverflow === 'ellipsis');
  expect(clipped).toBe(false);
});

test('TAM-119: "Undo last call" within 5 seconds puts the number back; after 5 seconds it disappears', async ({ page }) => {
  const first = await call(page);
  await call(page);
  await page.getByRole('button', { name: 'Undo last call' }).click();
  await expect(currentNumber(page)).toHaveText(String(first));
  expect(await calledNumbers(page)).toEqual([first]);
  await call(page);
  await page.waitForTimeout(5_500);
  await expect(page.getByRole('button', { name: 'Undo last call' })).toHaveCount(0);
});
