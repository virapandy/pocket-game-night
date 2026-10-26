// Mafia section 04, morning and day (C2; scenarios version 1.1): MAF-030 to MAF-036 on screen, with items 14, 23, 24,
// 25. The screens are built (lane-k): no mark. Saved game nights from
// tests/games/mafia/flows.ts through MAF-H6. Helpers: mafia.ts.
import { expect, test, type Page } from './fixtures';
import {
  button, byId, exactly, heading, mainButton, openFlow, tap, toMorning, TZ,
} from './mafia';

test.use({ timezoneId: TZ });

async function toDay1(page: Page) {
  await openFlow(page, 'morning1');
  await toMorning(page);
  await tap(page, mainButton(page));
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
}
async function toPicker1(page: Page) {
  await toDay1(page);
  await tap(page, mainButton(page));
  await page.clock.runFor(5000);
  await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
}

test('MAF-030: Morning, day 1: story, role line, count line, quiet buttons, main "Start talking"', async ({ page }) => {
  await openFlow(page, 'morning1');
  await toMorning(page);
  await expect(heading(page, 'Morning, day 1')).toBeVisible();
  await expect(byId(page, 'story')).toContainText(/Kabir/i);
  await expect(byId(page, 'role-line')).toHaveText(exactly('Kabir was a Villager.'));
  await expect(byId(page, 'count-line')).toHaveText(exactly('8 players left · Mafia caught: 0 of 2'));
  for (const q of ['See my role again', 'End the game', '← Home']) await expect(button(page, q)).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Start talking'));
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
});

test('MAF-030: a night with nobody out has no role line; the count line is unchanged', async ({ page }) => {
  await openFlow(page, 'morning2');
  await toMorning(page);
  await expect(heading(page, 'Morning, day 2')).toBeVisible();
  await expect(byId(page, 'role-line')).toHaveCount(0);
  await expect(byId(page, 'count-line')).toHaveText(exactly('7 players left · Mafia caught: 0 of 2'));
});

test('MAF-031: Day 1: who is still in (seat order), out players greyed with role, the out-players line, links and main', async ({ page }) => {
  await toDay1(page);
  await expect(heading(page, "Who's still in")).toBeVisible();
  await expect(page.getByText(exactly('Kabir · Villager · out night 1'))).toBeVisible();
  await expect(page.getByText(exactly('Out players: watch quietly, no hints!'))).toBeVisible();
  for (const q of ['See my role again', 'Start a 2-minute timer', '← Home']) await expect(button(page, q)).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Time to vote'));
});

test('MAF-031 item 23: the timer shows 2:00, 1:59 after 1 s, never 0:00; "Time\'s up!" at 120 s and the link reads "Start a 2-minute timer" again', async ({ page }) => {
  await toDay1(page);
  await tap(page, button(page, 'Start a 2-minute timer'));
  await expect(byId(page, 'day-timer')).toHaveText(exactly('2:00'));
  await expect(button(page, 'Stop timer')).toBeVisible();
  await page.clock.runFor(1000);
  await expect(byId(page, 'day-timer')).toHaveText(exactly('1:59'));
  await page.clock.runFor(118_000);
  await expect(byId(page, 'day-timer')).toHaveText(exactly('0:01'));
  await page.clock.runFor(1000);
  await expect(page.getByText(exactly("Time's up!"))).toBeVisible();
  await expect(page.getByText('0:00')).toHaveCount(0);
  await expect(button(page, 'Start a 2-minute timer')).toBeVisible();
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
});

test('MAF-032 / Version 1.4 item 6: the countdown heading, "3", "2", "1", "Point!", no menu and no Pause; then the picker opens by itself', async ({ page }) => {
  await toDay1(page);
  await tap(page, mainButton(page));
  await expect(byId(page, 'countdown-heading')).toHaveText(exactly('Everyone still playing: point at who you think is Mafia.'));
  await expect(byId(page, 'countdown-number')).toHaveText(exactly('3'));
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0);
  await expect(button(page, 'Not yet')).toBeVisible();
  await page.clock.runFor(5000);
  await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
});

test('MAF-033: the picker: names of players in, "It\'s a tie", "Count again", "Nobody today"; "Vote out" disabled until a pick', async ({ page }) => {
  await toPicker1(page);
  for (const p of ['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev', 'Om', 'Sunita', 'Neha']) await expect(button(page, p)).toBeVisible();
  await expect(button(page, 'Kabir')).toHaveCount(0);
  for (const t of ["It's a tie", 'Count again', 'Nobody today', '← Back to talking']) await expect(button(page, t)).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Vote out'));
  await expect(mainButton(page)).toBeDisabled();
  await tap(page, button(page, 'Om'));
  await expect(mainButton(page)).toHaveText(exactly('Vote Om out'));
});

test('MAF-036: vote result: "Om is out." at once; at 1.5 s the role line, the count line and main "Start night 2"', async ({ page }) => {
  await toPicker1(page);
  await tap(page, button(page, 'Om'));
  await tap(page, mainButton(page));
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 10);
  await expect(heading(page, 'Om is out.')).toBeVisible();
  await expect(byId(page, 'role-line')).toHaveCount(0);
  await page.clock.runFor(1600);
  await expect(byId(page, 'role-line')).toHaveText(exactly('Om was a Villager.'));
  await expect(byId(page, 'count-line')).toHaveText(exactly('7 players left · Mafia caught: 0 of 2'));
  await expect(mainButton(page)).toHaveText(exactly('Start night 2'));
  for (const q of ['End the game', '← Home']) await expect(button(page, q)).toBeVisible();
  await page.clock.runFor(1000);
  await tap(page, mainButton(page));
  await expect(heading(page, 'Night 2')).toBeVisible();
});

test('MAF-034 items 14 and 24: a tie: "Tap everyone who is tied", "Point again: Om or Neha", a re-vote with only them, "Still a tie"', async ({ page }) => {
  await toPicker1(page);
  await tap(page, button(page, "It's a tie"));
  await expect(heading(page, 'Tap everyone who is tied')).toBeVisible();
  await expect(button(page, 'Not a tie')).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Point again'));
  await expect(mainButton(page)).toBeDisabled();
  await tap(page, button(page, 'Neha'));
  await tap(page, button(page, 'Om'));
  await expect(mainButton(page)).toHaveText(exactly('Point again: Om or Neha'));
  await tap(page, mainButton(page));
  await expect(byId(page, 'countdown-heading')).toHaveText(exactly('Point only at Om or Neha'));
  await page.clock.runFor(5000);
  await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
  await expect(button(page, 'Riya')).toHaveCount(0);
  await expect(button(page, 'Nobody today')).toHaveCount(0);
  await tap(page, button(page, 'Still a tie'));
  await expect(heading(page, 'Still a tie. Nobody is out today.')).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Start night 2'));
  await expect(button(page, '← Home')).toBeVisible();
});

test('MAF-035: "Nobody today" asks first; "Back to the vote" records nothing; "Nobody today" goes straight to night 2', async ({ page }) => {
  await toPicker1(page);
  await tap(page, button(page, 'Nobody today'));
  const d = page.getByRole('dialog');
  await expect(d.getByRole('heading', { name: 'Nobody out today?' }).or(d.getByText(exactly('Nobody out today?')))).toBeVisible();
  await expect(d.getByText(exactly('Nobody goes out today. Straight to night 2.'))).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'Back to the vote', exact: true }));
  await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
  await tap(page, button(page, 'Nobody today'));
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Nobody today', exact: true }));
  await expect(heading(page, 'Night 2')).toBeVisible();
});

test('MAF-036 item 25: when the vote ends the game, main "See who won" and only "← Home" among the quiet buttons', async ({ page }) => {
  await openFlow(page, 'day3');
  await toMorning(page);
  await expect(byId(page, 'role-line')).toHaveText(exactly('Meena was the Doctor.'));
  await expect(byId(page, 'count-line')).toHaveText(exactly('5 players left · Mafia caught: 1 of 2'));
  await tap(page, mainButton(page));
  await tap(page, mainButton(page));
  await page.clock.runFor(5000);
  await tap(page, button(page, 'Arjun'));
  await tap(page, mainButton(page));
  await expect(heading(page, 'Arjun is out.')).toBeVisible();
  await page.clock.runFor(1600);
  await expect(byId(page, 'role-line')).toHaveText(exactly('Arjun was MAFIA!'));
  await expect(byId(page, 'count-line')).toHaveText(exactly('4 players left · Mafia caught: 2 of 2'));
  await expect(mainButton(page)).toHaveText(exactly('See who won'));
  await expect(button(page, '← Home')).toBeVisible();
  await expect(button(page, 'End the game')).toHaveCount(0);
  await page.clock.runFor(1000);
  await tap(page, mainButton(page));
  await expect(heading(page, 'The Village wins!')).toBeVisible();
});
