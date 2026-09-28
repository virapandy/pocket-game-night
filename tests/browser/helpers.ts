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
    await page.getByLabel(`Name of player ${i + 1}`, { exact: true }).fill(name);
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

/** The menu (⋯) in the top bar, named "Menu" (TAM-109: every icon has a word). */
export const menuButton = (page: Page) => page.getByRole('button', { name: /Menu/ });

/** An item of the menu: Settings, Show the room, Board, Check numbers, End game, Discard game (TAM-124). */
export const menuItem = (page: Page, name: string) =>
  page.getByRole('menuitem', { name, exact: true }).or(page.getByRole('button', { name, exact: true }));

/** Opens the menu (if needed) and taps one of its items. */
export async function fromMenu(page: Page, name: string) {
  if (!(await menuItem(page, name).first().isVisible())) await menuButton(page).click();
  await menuItem(page, name).first().click();
}

/** The sheet the board opens in (TAM-127), and the one tap that closes it. */
const boardSheet = (page: Page) => page.getByRole('dialog').filter({ has: board(page) });
export async function closeBoard(page: Page) {
  await boardSheet(page).getByRole('button', { name: /^(Close|Done|Back)/ }).first().click();
  await expect(board(page)).toBeHidden();
}

/** The 1–90 board (TAM-016): opened from the menu as a sheet (TAM-127). Returns true if it had to be opened. */
export async function openBoard(page: Page): Promise<boolean> {
  if (await board(page).isVisible()) return false;
  await fromMenu(page, 'Board');
  await expect(board(page)).toBeVisible();
  return true;
}

/** The numbers marked on the host board (cells with data-called="true"), in board order. Leaves the screen as it was. */
export async function calledNumbers(page: Page): Promise<number[]> {
  const opened = await openBoard(page);
  const cells = board(page).locator('[data-called="true"]');
  const out = (await cells.allTextContents()).map((t) => Number(t.trim()));
  if (opened) await closeBoard(page);
  return out;
}

/** Paper tickets (TAM-037): Record a win → prize → player(s) → Confirm. No numbers are typed. */
export async function recordWin(page: Page, pattern: string, players: string[]) {
  await page.getByRole('button', { name: 'Record a win' }).click();
  await page.getByRole('button', { name: pattern, exact: true }).click();
  for (const p of players) await page.getByRole('button', { name: p, exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
}

/** Paper tickets (TAM-037): the anchor ruled a bogey. Record a win → prize → player → Bogey. */
export async function recordBogey(page: Page, pattern: string, player: string) {
  await page.getByRole('button', { name: 'Record a win' }).click();
  await page.getByRole('button', { name: pattern, exact: true }).click();
  await page.getByRole('button', { name: player, exact: true }).click();
  await page.getByRole('button', { name: 'Bogey', exact: true }).click();
}

/** The optional helper (TAM-139): menu → Check numbers → pattern → numbers read out → Check. */
export async function checkNumbers(page: Page, pattern: string, numbers: number[]) {
  await fromMenu(page, 'Check numbers');
  await page.getByRole('button', { name: pattern, exact: true }).click();
  await page.getByLabel('Numbers read out').fill(numbers.join(' '));
  await page.getByRole('button', { name: 'Check', exact: true }).click();
}

/** Closes whatever sheet or dialog is open (Close, Done, Back or Cancel), never the top bar's Back. */
export async function dismiss(page: Page) {
  const dialogs = page.getByRole('dialog');
  const n = await dialogs.count();
  const scope = n > 0 && (await dialogs.nth(n - 1).isVisible()) ? dialogs.nth(n - 1) : page.locator('body');
  await scope
    .locator('button:not([data-testid="top-bar"] *)')
    .filter({ hasText: /^\s*(Close|Done|Back|Cancel)\b/ })
    .first()
    .click();
}

/** The undo toast (TAM-125): "Called 21 · Undo (5s)". */
export const undoToast = (page: Page) => page.getByTestId('undo-toast');
/** The undo for the last call (TAM-119): on the toast (TAM-125 checks the toast itself). */
export const undoLastCall = (page: Page) =>
  undoToast(page).getByRole('button', { name: /Undo/ }).or(page.getByRole('button', { name: 'Undo last call' })).first();

/** True when "Next number" can't be tapped: hidden, disabled, or showing "Close Top Line first" (TAM-126, TAM-145). */
export async function nextNumberWaits(page: Page): Promise<boolean> {
  const b = page.getByRole('button', { name: 'Next number', exact: true });
  return (await b.count()) === 0 || !(await b.isVisible()) || (await b.isDisabled());
}

export async function endGame(page: Page) {
  await fromMenu(page, 'End game');
  await page.getByRole('dialog').getByRole('button', { name: 'End game' }).click();
}

/** Things every screen can be checked for: the app never moves money (TAM-090). */
export async function expectNoPaymentUi(page: Page) {
  await expect(page.getByText(/\b(pay now|upi:\/\/|wallet|send money|payment link)\b/i)).toHaveCount(0);
  await expect(page.locator('a[href^="upi:"]')).toHaveCount(0);
}
