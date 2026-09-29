// Phase 2: a late joiner in a phone-ticket game gets phone tickets from the next sheet.
// Scenarios: TAM-212 (owner decision 2026-09-30), with TAM-067 (late joining), TAM-117 (QR and typed code),
// TAM-172 (named hand-out), TAM-056 (the host sees every ticket). Names and test ids: README.md,
// "Late joiners" and "Phase 2: phone tickets".
import { expect, test, type Page } from './fixtures';
import { calledCount, callMany, dismiss, fromMenu, HOME, nextNumber } from './helpers';
import {
  closePhones, currentHandOut, handOutScreen, newPhone, openHostTickets, phoneGame, phoneTicket,
  PORTRAIT, scanTicket,
} from './phone';

test.afterEach(closePhones);

const SIX = [{ name: 'Riya' }, { name: 'Asha' }, { name: 'Dad' }, { name: 'Meera' }, { name: 'Nani' }, { name: 'Arjun' }];
const CODE = /^[2-9A-HJKMNP-Z]{4}(-[2-9A-HJKMNP-Z]{4}){4}$/;

/** Menu → "Add a late player" → name and tickets → Add. */
async function addLatePlayer(page: Page, name: string, tickets: number) {
  await fromMenu(page, 'Add a late player');
  await page.getByLabel('Name of late player', { exact: true }).fill(name);
  await page.getByLabel('Tickets', { exact: true }).fill(String(tickets));
  await page.getByRole('button', { name: 'Add', exact: true }).click();
}

/** The prize update for the anchor may come before or after the hand-out; close it if it is showing. */
async function closePrizeUpdate(page: Page) {
  if (await page.getByTestId('prize-update').isVisible()) await dismiss(page);
}

test('TAM-212: after the first sheet, Kabir joins with 2 tickets and is handed tickets 7 and 8, then calling carries on', async ({ page, browser }, testInfo) => {
  const first = await phoneGame(page, SIX);
  expect(first.map((h) => h.ticket)).toEqual([1, 2, 3, 4, 5, 6]);
  await callMany(page, 4);
  await addLatePlayer(page, 'Kabir', 2);
  await closePrizeUpdate(page);

  // The same hand-out screen as before the game: named ticket, QR and typed code.
  await expect(handOutScreen(page)).toBeVisible();
  await expect(page.getByTestId('hand-out-ticket')).toHaveText(/Ticket 7\s*→\s*Kabir \(1 of 2\)/);
  const seven = await currentHandOut(page);
  expect(seven.payload).toMatch(/^https?:\/\/[^/]+\/pocket-game-night\//);
  expect(seven.code).toMatch(CODE);
  expect(first.map((h) => h.code)).not.toContain(seven.code);

  // Kabir's phone opens his ticket, with his name.
  const kabir = await newPhone(browser, testInfo, PORTRAIT);
  await kabir.goto(HOME);
  await scanTicket(kabir, seven.payload);
  await expect(phoneTicket(kabir, 7)).toBeVisible();
  await expect(kabir.getByText(/Kabir/).first()).toBeVisible();

  await page.getByRole('button', { name: 'Next ticket', exact: true }).click();
  await expect(page.getByTestId('hand-out-ticket')).toHaveText(/Ticket 8\s*→\s*Kabir \(2 of 2\)/);
  // After his last ticket, back to calling: the numbers already called are kept.
  await page.getByRole('button', { name: /^(Back to calling|Start calling)$/ }).click();
  await closePrizeUpdate(page);
  await expect(nextNumber(page)).toBeVisible();
  expect(await calledCount(page)).toBe(4);

  // The host sees all 8 tickets, 7 and 8 as Kabir's (TAM-056).
  await openHostTickets(page);
  await expect(page.getByTestId('host-ticket')).toHaveCount(8);
  for (const n of [7, 8]) await expect(page.locator(`[data-testid="host-ticket"][data-ticket="${n}"]`)).toContainText('Kabir');
});

test('TAM-212: the late joiner\'s typed code opens his ticket on a phone', async ({ page, browser }, testInfo) => {
  await phoneGame(page, SIX);
  await callMany(page, 2);
  await addLatePlayer(page, 'Kabir', 1);
  await closePrizeUpdate(page);
  await expect(page.getByTestId('hand-out-ticket')).toHaveText(/Ticket 7\s*→\s*Kabir \(1 of 1\)/);
  const h = await currentHandOut(page);
  const phone = await newPhone(browser, testInfo, PORTRAIT);
  await phone.goto(HOME);
  await phone.getByRole('button', { name: 'Enter ticket code', exact: true }).click();
  await phone.getByLabel('Ticket code', { exact: true }).fill(h.code);
  await phone.getByRole('button', { name: 'Open ticket', exact: true }).click();
  await expect(phoneTicket(phone, 7)).toBeVisible();
  await page.getByRole('button', { name: /^(Back to calling|Start calling)$/ }).click();
  await closePrizeUpdate(page);
  await expect(nextNumber(page)).toBeVisible();
});
