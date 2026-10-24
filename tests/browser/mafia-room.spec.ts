// Mafia section 06, the room and the host (C2; scenarios version 1.1): MAF-050 to MAF-055 and MAF-090 (where-lines) on
// screen, with items 2, 3, 11 to 13. The screens are built (lane-k); MAF-055 needs Home's row (`needsMafiaCardOrHomeRow`).
// Helpers: mafia.ts.
import { expect, test, type Page } from './fixtures';
import {
  needsMafiaCardOrHomeRow, button, byId, exactly, fromMenu, heading, mainButton, menuButton, menuItem, openFlow, tap, toMorning, TZ,
} from './mafia';

test.use({ timezoneId: TZ });

async function menuItems(page: Page): Promise<string[]> {
  await tap(page, menuButton(page));
  const items = await page.getByRole('menu').getByRole('menuitem').or(page.getByRole('menu').getByRole('button')).allInnerTexts();
  await page.keyboard.press('Escape');
  return items.map((s) => s.trim());
}

test('MAF-050 items 2 and 3: Pause on each room screen shows the where-line; Carry on returns to the same screen', async ({ page }) => {
  const cases: [string, string, () => Promise<void>][] = [
    ['deal-arjun', "Dealing roles · Arjun's turn with the phone", async () => {}],
    ['night1-start', 'Night 1 · starting', async () => {}],
    ['night2-meena', "Night 2 · Meena's turn with the phone", async () => {}],
    ['morning2', 'Morning, day 2', async () => { await toMorning(page); }],
    ['game1-over', 'Game over, game 1', async () => {}],
  ];
  for (const [name, where, go] of cases) {
    await openFlow(page, name);
    await go();
    // B1 and N1 have no heading (their name is `pass-name`): read whichever the screen has, without waiting for one
    // that isn't there (lane M2's question: each missing heading cost the 10 s action timeout).
    await expect(mainButton(page)).toBeVisible();
    const headings = page.getByRole('heading');
    const h = (await headings.count()) ? (await headings.first().innerText()).trim() : '';
    const who = h ? '' : (await byId(page, 'pass-name').innerText()).trim();
    await tap(page, page.getByRole('button', { name: 'Pause', exact: true }));
    const cover = page.getByRole('dialog');
    await expect(cover.getByText(exactly('Paused'))).toBeVisible();
    await expect(cover.getByTestId('where-line')).toHaveText(exactly(where));
    await expect(cover.getByText(exactly("Tap Carry on when everyone's back."))).toBeVisible();
    await tap(page, cover.getByRole('button', { name: 'Carry on', exact: true }));
    await expect(cover).toHaveCount(0);
    if (h) await expect(page.getByRole('heading').first()).toHaveText(h);
    else await expect(byId(page, 'pass-name'), `${name}: same pass screen after Carry on`).toHaveText(exactly(who));
  }
});

test('MAF-090 item 3: the Day and vote where-lines ("Day 2 · talking", "Day 2 · vote", "Day 2 · after the vote")', async ({ page }) => {
  await openFlow(page, 'morning2');
  await toMorning(page);
  await tap(page, mainButton(page));
  await fromMenu(page, 'Pause');
  await expect(page.getByRole('dialog').getByTestId('where-line')).toHaveText(exactly('Day 2 · talking'));
  await tap(page, button(page, 'Carry on'));
  await tap(page, mainButton(page));
  await page.clock.runFor(5000);
  await tap(page, page.getByRole('button', { name: 'Pause', exact: true }));
  await expect(page.getByRole('dialog').getByTestId('where-line')).toHaveText(exactly('Day 2 · vote'));
  await tap(page, button(page, 'Carry on'));
  await tap(page, button(page, 'Zoya'));
  await tap(page, mainButton(page));
  await page.clock.runFor(1600);
  await tap(page, page.getByRole('button', { name: 'Pause', exact: true }));
  await expect(page.getByRole('dialog').getByTestId('where-line')).toHaveText(exactly('Day 2 · after the vote'));
});

test('MAF-053: the menu at each moment (only the items that apply, in order); no menu on the role card or the night job', async ({ page }) => {
  await openFlow(page, 'deal-arjun');
  expect(await menuItems(page)).toEqual(['How to play', 'Players', 'Deal again', 'Pause', 'Home (game is saved)', 'End the game', 'End for tonight']);
  await tap(page, button(page, "I'm Arjun"));
  await expect(menuButton(page)).toHaveCount(0);
  await openFlow(page, 'night1-start');
  expect(await menuItems(page)).toEqual(['How to play', 'Players', 'Deal again', 'Pause', 'Home (game is saved)', 'End the game', 'End for tonight']);
  await openFlow(page, 'night2-meena');
  expect(await menuItems(page)).toEqual(['How to play', 'Players', 'Pause', 'Home (game is saved)', 'End the game', 'End for tonight']);
  await tap(page, button(page, "I'm Meena"));
  await expect(menuButton(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0);
  await openFlow(page, 'morning2');
  await toMorning(page);
  expect(await menuItems(page)).toEqual(['How to play', 'Players', 'See my role again', 'Pause', 'Home (game is saved)', 'End the game', 'End for tonight']);
  await openFlow(page, 'game1-over');
  expect(await menuItems(page)).toEqual(['How to play', 'Players', 'Pause', 'Home (game is saved)', 'End for tonight', 'Settings', 'History']);
});

test('MAF-052 item 13: a day leave: the dialog\'s day body, the toast "Neha left · Undo", the Day list "Neha · left"; Undo puts her back', async ({ page }) => {
  await openFlow(page, 'morning1');
  await toMorning(page);
  await tap(page, mainButton(page));
  await fromMenu(page, 'Players');
  await tap(page, button(page, 'Remove Neha'));
  const d = page.getByRole('dialog').filter({ hasText: 'Neha has to leave?' });
  await expect(d.getByText(exactly('Neha goes out now. Their role stays secret until the game ends.'))).toBeVisible();
  await expect(d.getByRole('button', { name: "Don't remove Neha", exact: true })).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'Neha leaves', exact: true }));
  await expect(page.getByText(exactly('Neha left · Undo'))).toBeVisible();
  await expect(button(page, 'Remove Kabir')).toHaveCount(0);   // out players can't leave
  await page.keyboard.press('Escape');
  await expect(page.getByText(exactly('Neha · left'))).toBeVisible();
  await tap(page, button(page, 'Undo'));
  await expect(page.getByText(exactly('Neha · left'))).toHaveCount(0);
});

test('MAF-052 item 11: a night leave: the night body; the leaver is skipped and T drops by one', async ({ page }) => {
  await openFlow(page, 'night1-meena');
  await fromMenu(page, 'Players');
  await tap(page, button(page, 'Remove Neha'));
  const d = page.getByRole('dialog').filter({ hasText: 'Neha has to leave?' });
  await expect(d.getByText(exactly('Neha leaves when this night is over. Their role stays secret until the game ends.'))).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'Neha leaves', exact: true }));
  await page.keyboard.press('Escape');
  await expect(byId(page, 'night-progress')).toHaveText(exactly('Night 1 · 3 of 8'));
});

test('MAF-052 item 12: a leave during the deal deals again without them ("Player 1 of 8")', async ({ page }) => {
  await openFlow(page, 'deal-arjun');
  await fromMenu(page, 'Players');
  await tap(page, button(page, 'Remove Kabir'));
  const d = page.getByRole('dialog').filter({ hasText: 'Kabir has to leave?' });
  await expect(d.getByText(exactly('Kabir leaves. Everyone gets a new role without Kabir.'))).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'Kabir leaves', exact: true }));
  await page.keyboard.press('Escape');
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 1 of 8'));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Riya'));
});

test('MAF-051: Players mid-game adds a name for the next game ("Imran · joins next game")', async ({ page }) => {
  await openFlow(page, 'morning1');
  await toMorning(page);
  await fromMenu(page, 'Players');
  await page.getByLabel('Player name', { exact: true }).fill('Imran');
  await page.getByLabel('Player name', { exact: true }).press('Enter');
  await expect(page.getByText(exactly('Imran · joins next game'))).toBeVisible();
});

test('MAF-054: End the game: dialog, "Game ended. No winner.", toast "Game ended · Undo" whose Undo returns to the morning', async ({ page }) => {
  await openFlow(page, 'morning1');
  await toMorning(page);
  await tap(page, button(page, 'End the game'));
  const d = page.getByRole('dialog').filter({ hasText: 'End this game with no winner?' });
  await expect(d.getByText(exactly("Everyone's role will be shown."))).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'Keep playing', exact: true }));
  await expect(heading(page, 'Morning, day 1')).toBeVisible();
  await tap(page, button(page, 'End the game'));
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'End the game', exact: true }));
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
  await expect(page.getByText(exactly('Game ended · Undo'))).toBeVisible();
  await tap(page, button(page, 'Undo'));
  await expect(heading(page, 'Morning, day 1')).toBeVisible();
});

test('MAF-055 / MAF-091: "← Home" leaves the game unfinished; Home\'s row reads the where-line and resumes', async ({ page }) => {
  needsMafiaCardOrHomeRow('MAF-055 home row');
  await openFlow(page, 'night2-meena');
  await fromMenu(page, 'Home (game is saved)');
  const row = page.getByTestId('unfinished-games').filter({ hasText: /Mafia/ });
  await expect(row).toContainText("Mafia · Night 2 · Meena's turn with the phone");
  await expect(row).toContainText('Riya, Arjun +7 · 9:10 pm · Tap to resume');
  await tap(page, row.getByText('Tap to resume').or(row.getByRole('button', { name: /Tap to resume/ })).first());
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Meena'));
});

test('MAF-092 item 21: back after more than 6 hours, the morning shows "Back after a break? Everyone can see their role again."', async ({ page }) => {
  await openFlow(page, 'morning2', { after: 7 * 3_600_000 });
  await toMorning(page);
  await expect(page.getByText(exactly('Back after a break? Everyone can see their role again.'))).toBeVisible();
  await expect(menuItem(page, 'See my role again').or(button(page, 'See my role again'))).toHaveCount(1);
});
