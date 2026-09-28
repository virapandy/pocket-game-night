// Browser helpers: how the tests find things on screen. The names below are what the app must show;
// they come from the scenarios and journeys (buttons named as in the specs). Listed in tests/browser/README.md.
import { expect, type Page } from '@playwright/test';

export const HOME = './';

export interface SetupOptions {
  players?: string[]; // names; '' leaves a name blank
  contribution?: number | 'none';
}

export async function openTambola(page: Page) {
  await page.goto(HOME);
  await page.getByRole('button', { name: /^Tambola/ }).click();
}

/** Tambola → New game → Paper tickets → players → contribution → Confirm prizes. */
export async function setUpPaperGame(page: Page, opts: SetupOptions = {}) {
  const names = opts.players ?? ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani'];
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Paper tickets' }).click();
  await fillPlayers(page, names);
  await page.getByRole('button', { name: 'Next' }).click();
  if (opts.contribution === 'none') {
    await page.getByRole('button', { name: 'No money' }).click();
  } else {
    await page.getByLabel('Contribution per ticket').fill(String(opts.contribution ?? 50));
  }
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Confirm prizes' }).click();
  await expect(nextNumber(page)).toBeVisible();
}

/** The shared players step (PLT-024): number of players, then a name box per player. */
export async function fillPlayers(page: Page, names: string[]) {
  await page.getByLabel('Number of players').fill(String(names.length));
  for (const [i, name] of names.entries()) {
    await page.getByLabel(`Name of player ${i + 1}`).fill(name);
  }
}

export const nextNumber = (page: Page) => page.getByRole('button', { name: 'Next number' });
export const currentNumber = (page: Page) => page.getByTestId('current-number');
export const currentRhyme = (page: Page) => page.getByTestId('current-rhyme');
export const lastCalls = (page: Page) => page.getByTestId('last-calls');
export const board = (page: Page) => page.getByTestId('board');

/** Taps "Next number" and waits for a new number to show. Returns it. */
export async function call(page: Page): Promise<number> {
  const before = (await currentNumber(page).count()) ? ((await currentNumber(page).textContent()) ?? '').trim() : '';
  await nextNumber(page).click();
  await expect(currentNumber(page)).not.toHaveText(before === '' ? /^$/ : before);
  await expect(currentNumber(page)).toHaveText(/^\s*\d{1,2}\s*$/);
  return Number((await currentNumber(page).textContent())!.trim());
}

/** Calls `times` numbers and returns them in call order. */
export async function callMany(page: Page, times: number): Promise<number[]> {
  const out: number[] = [];
  for (let i = 0; i < times; i++) out.push(await call(page));
  return out;
}

/** The 1–90 board (TAM-016): shown on the host screen, or behind a "Board" button. */
export async function openBoard(page: Page) {
  if (!(await board(page).isVisible())) await page.getByRole('button', { name: 'Board' }).click();
  await expect(board(page)).toBeVisible();
}

/** The numbers marked on the host board (cells with data-called="true"), in board order. */
export async function calledNumbers(page: Page): Promise<number[]> {
  await openBoard(page);
  const cells = board(page).locator('[data-called="true"]');
  return (await cells.allTextContents()).map((t) => Number(t.trim()));
}

/** Check a claim: Check a claim → player → pattern → numbers read out → Check. */
export async function checkClaim(page: Page, player: string, pattern: string, numbers: number[]) {
  await page.getByRole('button', { name: 'Check a claim' }).click();
  await page.getByRole('button', { name: player, exact: true }).click();
  await page.getByRole('button', { name: pattern, exact: true }).click();
  await page.getByLabel('Numbers read out').fill(numbers.join(' '));
  await page.getByRole('button', { name: 'Check', exact: true }).click();
}

export async function endGame(page: Page) {
  await page.getByRole('button', { name: 'End game' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'End game' }).click();
}

/** Things every screen can be checked for: the app never moves money (TAM-090). */
export async function expectNoPaymentUi(page: Page) {
  await expect(page.getByText(/\b(pay now|upi:\/\/|wallet|send money|payment link)\b/i)).toHaveCount(0);
  await expect(page.locator('a[href^="upi:"]')).toHaveCount(0);
}
