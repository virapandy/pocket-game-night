// Setting up a game: TAM-137, PLT-024, TAM-063, TAM-080, TAM-081, TAM-084, TAM-090, TAM-060.
import { expect, test } from '@playwright/test';
import { confirmPrizes, expectNoPaymentUi, fillPlayers, nextNumber, openTambola, setUpPaperGame } from './helpers';

test('TAM-137: the first choice is Paper tickets or Phone tickets', async ({ page }) => {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await expect(page.getByRole('button', { name: 'Paper tickets' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Phone tickets/ })).toBeVisible();
});

test('TAM-063: 6 players with a contribution and the suggested split, ready to call within 60 seconds, no sign-in', async ({ page }) => {
  const start = Date.now();
  await setUpPaperGame(page);
  await expect(nextNumber(page)).toBeEnabled();
  expect(Date.now() - start).toBeLessThan(60_000);
  await expect(page.getByText(/sign in|log in|create an account/i)).toHaveCount(0);
});

test('PLT-024: blank names become Player 1, Player 2 …', async ({ page }) => {
  await setUpPaperGame(page, { players: ['Riya', '', 'Dad', ''] });
  await page.getByRole('button', { name: 'Record a win' }).click();
  await page.getByRole('button', { name: 'Early Five', exact: true }).click();
  for (const name of ['Riya', 'Player 2', 'Dad', 'Player 4']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
});

test('PLT-024: two players cannot have the same name; the app asks for an initial', async ({ page }) => {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Paper tickets' }).click();
  await fillPlayers(page, ['Riya', 'Riya']);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText(/initial/i)).toBeVisible();
  await expect(page.getByLabel('Contribution per ticket')).toHaveCount(0);
});

test('PLT-024: names used before are offered as one-tap suggestions', async ({ page }) => {
  await setUpPaperGame(page, { players: ['Zoya', 'Farhan'] });
  await page.goto('./');
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Paper tickets' }).click();
  await expect(page.getByRole('button', { name: 'Zoya' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Farhan' })).toBeVisible();
});

test('TAM-080 and TAM-081: the pot and the suggested tiers show before prizes are locked', async ({ page }) => {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Paper tickets' }).click();
  await fillPlayers(page, ['A1', 'B2', 'C3', 'D4', 'E5', 'F6']);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Contribution per ticket').fill('50');
  await expect(page.getByText('₹300').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  // 6 tickets: Early Five, three Lines, Full House (10 / 15 / 15 / 15 / 45 %) of ₹300.
  for (const tier of ['Early Five', 'Top Line', 'Middle Line', 'Bottom Line', 'Full House']) {
    await expect(page.getByText(tier, { exact: true }).first()).toBeVisible();
  }
  // Each tier's amount is shown once, in its own "<Pattern> amount" field (TAM-183); the five add up to the pot.
  const shown = await Promise.all(
    ['Early Five', 'Top Line', 'Middle Line', 'Bottom Line', 'Full House'].map(async (tier) => {
      const field = page.getByLabel(`${tier} amount`, { exact: true });
      await expect(field).toBeVisible();
      return Number((await field.inputValue()).replace(/[^\d]/g, ''));
    }),
  );
  expect(shown.reduce((a, b) => a + b, 0)).toBe(300);
  await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
  await expect(nextNumber(page)).toHaveCount(0);
});

test('TAM-084: the anchor can change a tier; the total still equals the pot', async ({ page }) => {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Paper tickets' }).click();
  await fillPlayers(page, ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8', 'I9', 'J10']);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Contribution per ticket').fill('50');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Top Line amount').fill('80');
  await page.getByLabel('Top Line amount').blur();
  // The anchor sees each tier's amount in its "<Pattern> amount" field (TAM-183: shown once, in the field).
  const tiers = ['Early Five', 'Top Line', 'Middle Line', 'Bottom Line', 'Full House'];
  const amounts = await Promise.all(
    tiers.map((tier) => page.getByLabel(`${tier} amount`, { exact: true }).inputValue()),
  );
  expect(Number(amounts[1].replace(/[^\d]/g, ''))).toBe(80);
  const total = amounts.map((t) => Number(t.replace(/[^\d]/g, ''))).reduce((a, b) => a + b, 0);
  expect(total).toBe(500);
  // Confirm prizes; the first game of a gathering also asks for a session name (PLT-016, Phase 1b).
  await confirmPrizes(page);
  await expect(nextNumber(page)).toBeVisible();
});

test('TAM-090: a game with No money; no payment button, link or wallet anywhere', async ({ page }) => {
  await setUpPaperGame(page, { contribution: 'none' });
  await expectNoPaymentUi(page);
  await expect(page.getByText('₹')).toHaveCount(0);
});

test('TAM-060: the phone does not speak calls by default', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__spoken = 0;
    const synth = window.speechSynthesis;
    if (synth) synth.speak = () => { (window as any).__spoken++; };
  });
  await setUpPaperGame(page);
  await nextNumber(page).click();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as any).__spoken)).toBe(0);
});

test('TAM-130: game settings list every house rule in plain words, with the convention as default', async ({ page }) => {
  await openTambola(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  for (const rule of [/tie/i, /late claim/i, /bogey/i, /tickets per player/i, /late join/i, /auto-call/i]) {
    await expect(page.getByText(rule).first()).toBeVisible();
  }
});
