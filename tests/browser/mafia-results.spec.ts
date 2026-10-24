// Mafia section 07, game over and tonight (scenarios version 1.1): MAF-060 to MAF-064 and MAF-093's History line on
// screen, with items 15 and 17 to 19 and the product owner's clarifications 18, 27, 28, 31 (25 October). The facts
// behind them are rule-tested in tests/games/mafia/saved.test.ts. Written before the screens exist: every test is
// `aheadOfMafiaScreens`. Helpers: mafia.ts.
import { expect, test } from './fixtures';
import {
  aheadOfMafiaScreens, button, byId, exactly, fromMenu, heading, mainButton, openFlow, tap, TZ,
} from './mafia';

test.use({ timezoneId: TZ });

test('MAF-060: Game over after the example: winner, "Who was who" in seat order, each night\'s line, fun lines, tally, buttons', async ({ page }) => {
  aheadOfMafiaScreens('MAF-060 game over');
  await openFlow(page, 'game1-over');
  await expect(heading(page, 'The Village wins!')).toBeVisible();
  await expect(page.getByText(exactly('Every Mafia is out.'))).toBeVisible();
  await expect(heading(page, 'Who was who')).toBeVisible();
  const rows = [
    'Riya · Villager · in to the end', 'Arjun · Mafia · voted out day 3', 'Meena · Doctor · out night 3', 'Kabir · Villager · out night 1',
    'Zoya · Mafia · voted out day 2', 'Dev · Police · in to the end', 'Om · Villager · voted out day 1', 'Sunita · Villager · in to the end',
    'Neha · Villager · in to the end',
  ];
  const shown: string[] = [];
  for (const r of rows) { const l = page.getByText(exactly(r)); await expect(l, r).toBeVisible(); shown.push(r); }
  const ys = await Promise.all(rows.map(async (r) => (await page.getByText(exactly(r)).boundingBox())!.y));
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  await expect(page.getByText(exactly('Best Mafia spotter: Riya picked a Mafia 3 nights out of 3'))).toBeVisible();
  await expect(page.getByText(exactly('Best ghost guess: Kabir'))).toBeVisible();
  await expect(page.getByText(exactly('Tonight: Village 1 · Mafia 0'))).toBeVisible();
  for (const q of ['Change players or roles', 'End for tonight', '← Home']) await expect(button(page, q)).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Play again'));
  await tap(page, button(page, 'What happened each night'));
  for (const l of [
    'Night 1: the Mafia picked Kabir · the Doctor protected themselves · the Police checked Zoya (Mafia) · Kabir was out',
    'Night 2: the Mafia picked Riya · the Doctor protected Riya · the Police checked Arjun (Mafia) · nobody was out',
    'Night 3: the Mafia picked Meena · the Doctor protected Sunita · the Police checked Sunita (Not Mafia) · Meena was out',
  ]) await expect(page.getByText(exactly(l))).toBeVisible();
});

test('MAF-060 item 18: when the Mafia\'s picks differ, the night line names both and the phone\'s choice', async ({ page }) => {
  aheadOfMafiaScreens('MAF-060 differing picks');
  await openFlow(page, 'worked-example-ended');
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
  await tap(page, button(page, 'What happened each night'));
  await expect(page.getByText(exactly('Night 1: the Mafia picked Kabir and Om; the phone chose Om · the Doctor protected themselves · the Police checked Zoya (Mafia) · Om was out'))).toBeVisible();
  await expect(page.getByText(/^Tonight: Village/)).toHaveCount(0);   // no game tonight has a winner yet
});

test('MAF-042 / MAF-060: game 2 ended with no winner shows every role and tonight\'s tally from game 1', async ({ page }) => {
  aheadOfMafiaScreens('MAF-060 no winner');
  await openFlow(page, 'game2-over');
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
  await expect(page.getByText(exactly('Tonight: Village 1 · Mafia 0'))).toBeVisible();
  for (const r of ['Riya · Mafia · in to the end', 'Om · Mafia · in to the end', 'Sunita · Doctor · in to the end', 'Neha · Police · in to the end']) {
    await expect(page.getByText(exactly(r))).toBeVisible();
  }
});

test('MAF-061: "Play again" deals game 2 straight away (no Read this aloud): "Player 1 of 9" for seat 0', async ({ page }) => {
  aheadOfMafiaScreens('MAF-061 play again');
  await openFlow(page, 'game1-over');
  await tap(page, mainButton(page));
  await expect(heading(page, 'Read this aloud')).toHaveCount(0);
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 1 of 9'));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Riya'));
});

test('MAF-061 item 28: "Change players or roles" opens Who\'s playing? with "← Back to the game", which returns to Game over', async ({ page }) => {
  aheadOfMafiaScreens('MAF-061 change players');
  await openFlow(page, 'game1-over');
  await tap(page, button(page, 'Change players or roles'));
  await expect(heading(page, "Who's playing?")).toBeVisible();
  await expect(button(page, '← Back')).toHaveCount(0);
  await tap(page, button(page, '← Back to the game'));
  await expect(heading(page, 'The Village wins!')).toBeVisible();
});

test('MAF-063 / MAF-064: End for tonight → Tonight\'s summary: players, games, score, spotter; "Oops, keep playing" returns', async ({ page }) => {
  aheadOfMafiaScreens('MAF-064 summary');
  await openFlow(page, 'game2-over');
  await tap(page, button(page, 'End for tonight'));
  const d = page.getByRole('dialog').filter({ hasText: 'End for tonight?' });
  await expect(d.getByText(exactly("Tonight's score stays in History."))).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'End for tonight', exact: true }));
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await expect(page.getByText(exactly('9 players · 2 games'))).toBeVisible();
  await expect(page.getByText(exactly('Village 1 · Mafia 0'))).toBeVisible();
  await expect(page.getByText(exactly('Best Mafia spotter tonight: Riya'))).toBeVisible();
  await expect(page.getByText(/was Mafia in \d games/)).toHaveCount(0);
  for (const q of ['Oops, keep playing', '← Home']) await expect(button(page, q)).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Play something else'));
  await tap(page, button(page, 'Oops, keep playing'));
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
});

test('MAF-063 item 15: mid-game, End for tonight says "This game won\'t count for either side."', async ({ page }) => {
  aheadOfMafiaScreens('MAF-063 mid-game');
  await openFlow(page, 'night2-meena');
  await fromMenu(page, 'End for tonight');
  await expect(page.getByRole('dialog').getByText(exactly("Tonight's score stays in History. This game won't count for either side."))).toBeVisible();
});

test('MAF-064 item 29: G2\'s menu has only "Delete tonight\'s games"', async ({ page }) => {
  aheadOfMafiaScreens('MAF-064 G2 menu');
  await openFlow(page, 'game1-over');
  await tap(page, button(page, 'End for tonight'));
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'End for tonight', exact: true }));
  await tap(page, page.getByRole('button', { name: 'Menu', exact: true }));
  const items = (await page.getByRole('menu').getByRole('menuitem').or(page.getByRole('menu').getByRole('button')).allInnerTexts()).map((s) => s.trim());
  expect(items).toEqual(["Delete tonight's games"]);
});

test('MAF-093 item 19: History lists the game "Mafia · 9:10 pm · 9 players · The Village won · 3 nights"', async ({ page }) => {
  aheadOfMafiaScreens('MAF-093 history');
  await openFlow(page, 'game1-over');
  await fromMenu(page, 'History');
  await expect(page.getByText(exactly('Mafia · 9:10 pm · 9 players · The Village won · 3 nights'))).toBeVisible();
});
