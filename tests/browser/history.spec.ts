// Phase 1b: history tools on the host phone.
// Scenarios: PLT-006 (an unfinished setup is remembered), PLT-009 (play again from a past game's setup),
// PLT-010 (deleting a past game, with undo for 5 seconds), PLT-011 (clearing all history), PLT-025 (deleting a
// game that is still in an unsettled tally). Names and test ids: tests/browser/README.md.
import { expect, test, type Page } from './fixtures';
import {
  callMany, confirmPrizes, endGame, fillPlayers, HOME, nextNumber, openHistory, openSession, openTambola, setUpPaperGame, tallyPeople, THREE_TIERS, winEverythingAndEnd, chooseTicketType, ticketCard, fromHome,
} from './helpers';

test.use({ timezoneId: 'Asia/Kolkata' });

const T0 = new Date('2026-10-04T19:00:00+05:30');
const FAMILY = ['Riya', 'Asha', 'Dad'];
const DIWALI = "Diwali at Nani's";
const rows = (page: Page) => page.getByTestId('history-game');
const deleteButton = (page: Page) => page.getByRole('button', { name: /^Delete( game| this game)?$/ });
const undo = (page: Page) => page.getByRole('button', { name: /^Undo/ });
const amount = async (page: Page, label: string) => Number((await page.getByLabel(label, { exact: true }).inputValue()).replace(/[^\d]/g, ''));

/** A "No money" game played to the end (not in any tally), with a few calls. */
async function noMoneyGame(page: Page, players = FAMILY, calls = 3) {
  await setUpPaperGame(page, { players, contribution: 'none' });
  await callMany(page, calls);
  await endGame(page);
}

test('PLT-006: an unfinished setup is remembered, ready to change or confirm', async ({ page }) => {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await chooseTicketType(page, 'paper');
  await fillPlayers(page, ['Zoya', 'Farhan', 'Ira']);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Contribution per ticket').fill('70');
  // The host leaves without confirming.
  await page.goto(HOME);
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  if (await ticketCard(page, 'paper').isVisible()) await chooseTicketType(page, 'paper');
  await expect(page.getByLabel('Number of players')).toHaveValue('3');
  for (const [i, name] of ['Zoya', 'Farhan', 'Ira'].entries()) {
    await expect(page.getByLabel(`Name of player ${i + 1}`, { exact: true })).toHaveValue(name);
  }
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel('Contribution per ticket')).toHaveValue(/^\s*(₹\s*)?70\s*$/);
  await page.getByRole('button', { name: 'Next' }).click();
  await confirmPrizes(page);
  await expect(nextNumber(page)).toBeEnabled();
});

test('PLT-009: "Use this setup" starts a new game with the same players, contribution and tiers, and a new draw', async ({ page }) => {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await chooseTicketType(page, 'paper');
  await fillPlayers(page, FAMILY);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Contribution per ticket').fill('70');
  await page.getByRole('button', { name: 'Next' }).click();
  // The anchor sets Top Line to ₹50 (TAM-084); the pot is ₹210.
  await page.getByLabel('Top Line amount', { exact: true }).fill('50');
  await page.getByLabel('Top Line amount', { exact: true }).blur();
  const tiers = { early: await amount(page, 'Early Five amount'), full: await amount(page, 'Full House amount') };
  await confirmPrizes(page);
  const first = await callMany(page, 4);
  await endGame(page);

  await openHistory(page);
  await rows(page).first().click();
  await page.getByRole('button', { name: 'Use this setup' }).click();
  // A new game in Setup: walk through it, checking everything came back.
  if (await ticketCard(page, 'paper').isVisible()) await chooseTicketType(page, 'paper');
  const playersField = page.getByLabel('Number of players');
  if (await playersField.isVisible()) {
    for (const [i, name] of FAMILY.entries()) await expect(page.getByLabel(`Name of player ${i + 1}`, { exact: true })).toHaveValue(name);
    await page.getByRole('button', { name: 'Next' }).click();
  }
  const contribution = page.getByLabel('Contribution per ticket');
  if (await contribution.isVisible()) {
    await expect(contribution).toHaveValue(/^\s*(₹\s*)?70\s*$/);
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
  expect(await amount(page, 'Top Line amount')).toBe(50);
  expect(await amount(page, 'Early Five amount')).toBe(tiers.early);
  expect(await amount(page, 'Full House amount')).toBe(tiers.full);
  await confirmPrizes(page);
  // New draw seed: a different first four numbers.
  expect(await callMany(page, 4)).not.toEqual(first);
  await page.getByRole('button', { name: 'Record a win' }).click();
  await page.getByRole('button', { name: 'Early Five', exact: true }).click();
  for (const name of FAMILY) await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
});

test.describe('PLT-010: deleting a past game', () => {
  test('it disappears at once with "Deleted. Undo"; undo brings it back', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await noMoneyGame(page, ['Riya', 'Dad']);
    await noMoneyGame(page, ['Zoya', 'Ira', 'Farhan']);
    await openHistory(page);
    await expect(rows(page)).toHaveCount(2);
    await rows(page).first().click();
    await deleteButton(page).click();
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText(/2 players/);
    await expect(page.getByText(/Deleted\./).first()).toBeVisible();
    await undo(page).click();
    await expect(rows(page)).toHaveCount(2);
    await page.reload();
    await expect(rows(page)).toHaveCount(2);
  });

  test('after 5 seconds the undo is gone, and the game is gone for good', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await noMoneyGame(page, ['Riya', 'Dad']);
    await openHistory(page);
    await rows(page).first().click();
    await deleteButton(page).click();
    await expect(undo(page)).toBeVisible();
    await page.clock.runFor(6_000);
    await expect(undo(page)).toHaveCount(0);
    await expect(rows(page)).toHaveCount(0);
    await openHistory(page);
    await expect(rows(page)).toHaveCount(0);
  });

  test('a game in progress or paused cannot be deleted', async ({ page }) => {
    await setUpPaperGame(page, { players: ['Riya', 'Dad'] });
    await callMany(page, 2);
    await page.goto(HOME);
    await expect(page.getByTestId('unfinished-games').getByRole('button', { name: /Delete/ })).toHaveCount(0);
    await fromHome(page, 'History');
    for (let i = 0; i < (await rows(page).count()); i++) {
      if ((await rows(page).nth(i).textContent())?.match(/in progress|paused|2 numbers called/i)) {
        await rows(page).nth(i).click();
        await expect(deleteButton(page)).toHaveCount(0);
        await openHistory(page);
      }
    }
    await page.goto(HOME);
    await expect(page.getByTestId('unfinished-games').getByText(/2 numbers called/)).toBeVisible();
  });
});

test.describe('PLT-011: clearing all history', () => {
  test('asks "Delete all 2 past games from this phone? This can\'t be undone."; Keep keeps them; a game in progress is not affected', async ({ page }) => {
    await noMoneyGame(page, ['Riya', 'Dad']);
    await noMoneyGame(page, ['Zoya', 'Ira']);
    await setUpPaperGame(page, { players: ['Asha', 'Nani'] });
    const calls = await callMany(page, 2);
    await openHistory(page);
    await page.getByRole('button', { name: 'Clear all history' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(/Delete all 2 past games from this phone\? This can['’]t be undone\./);
    await dialog.getByRole('button', { name: 'Keep', exact: true }).click();
    await expect(rows(page)).toHaveCount(2);
    await page.getByRole('button', { name: 'Clear all history' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete all', exact: true }).click();
    await expect(rows(page).filter({ hasText: /Riya|Zoya/ })).toHaveCount(0);
    await page.reload();
    await expect(rows(page).filter({ hasText: /Riya|Zoya|Ended/ })).toHaveCount(0);
    // The game in progress is still there, exactly where it was.
    await page.goto(HOME);
    await page.getByTestId('unfinished-games').getByText('Tap to resume').first().click();
    await expect(page.getByTestId('current-number')).toHaveText(String(calls[1]));
  });
});

test.describe('PLT-025: deleting a game that is still in an unsettled tally', () => {
  test.setTimeout(90_000);

  async function twoTalliedGames(page: Page) {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS); // Riya +100, Asha −50, Dad −50
    await page.getByRole('button', { name: 'Play again' }).click();
    await confirmPrizes(page);
    await winEverythingAndEnd(page, 'Asha', THREE_TIERS); // Asha +100, Riya −50, Dad −50
  }
  const tallyBy = async (page: Page) => Object.fromEntries((await tallyPeople(page)).map((p) => [p.name, p]));

  test('the confirmation says so; after deleting, the tally leaves it out and still balances', async ({ page }) => {
    await twoTalliedGames(page);
    await openHistory(page);
    await rows(page).first().click(); // the newest: Asha won everything
    await deleteButton(page).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(
      /This game is in the unsettled tally for ['‘’"]Diwali at Nani['‘’]s['‘’"]\. Delete it and take it out of the tally\?/,
    );
    await dialog.getByRole('button', { name: /^Delete/ }).click();
    await page.clock.runFor(6_000);
    await openSession(page, DIWALI);
    const by = await tallyBy(page);
    expect(by['Riya']).toEqual({ name: 'Riya', paid: 50, gotBack: 150, net: 100 });
    expect(by['Asha']).toEqual({ name: 'Asha', paid: 50, gotBack: 0, net: -50 });
    expect(by['Dad']).toEqual({ name: 'Dad', paid: 50, gotBack: 0, net: -50 });
    const people = Object.values(by);
    expect(people.reduce((a, p) => a + p.paid, 0)).toBe(people.reduce((a, p) => a + p.gotBack, 0));
  });

  test('"Deleted. Undo" brings the game back into the same tally', async ({ page }) => {
    await twoTalliedGames(page);
    await openSession(page, DIWALI);
    const before = await tallyBy(page);
    await openHistory(page);
    await rows(page).first().click();
    await deleteButton(page).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Delete/ }).click();
    await undo(page).click();
    await openSession(page, DIWALI);
    expect(await tallyBy(page)).toEqual(before);
  });

  test('"Clear all history" also says how many games are in unsettled tallies', async ({ page }) => {
    await twoTalliedGames(page);
    await openHistory(page);
    await page.getByRole('button', { name: 'Clear all history' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(/Delete all 2 past games from this phone\?/);
    await expect(dialog).toContainText(/\b2\b[^.?!]*unsettled|unsettled[^.?!]*\b2\b/i);
    await dialog.getByRole('button', { name: 'Keep', exact: true }).click();
    await expect(rows(page)).toHaveCount(2);
  });

  test('row 19: with one past game in an unsettled tally, "Clear all history" says "It\'s in an unsettled tally, and will be taken out of it."', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    await openHistory(page);
    await expect(rows(page)).toHaveCount(1);
    await page.getByRole('button', { name: 'Clear all history' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(/Delete the past game from this phone\?/);
    await expect(dialog).toContainText(/It['’]s in an unsettled tally, and will be taken out of it\./);
    await expect(dialog).not.toContainText(/of them/);
    await dialog.getByRole('button', { name: 'Keep', exact: true }).click();
    await expect(rows(page)).toHaveCount(1);
  });
});
