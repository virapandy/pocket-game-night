// PLT-029 (Phase 1b, owner-approved 30 September 2026, docs/games/tambola/changes-2026-09-30-playtest.md section 2):
// the last setup step shows which session the game joins, "Session: Sunday 4 Oct · Change", and "Change" starts a
// new session or picks a recent unsettled one. With PLT-016 and PLT-019. Names: tests/browser/README.md.
// Owner, 2026-09-30 (docs/decisions.md): a first game, or one more than 3 hours after the last, shows
// "Session: <suggested name> (new) · Change"; Change lists up to 3 unsettled sessions from the last 7 days.
import { expect, test, type Page } from './fixtures';
import {
  answerSession, call, callMany, continueOrNew, endGame, HOME, nextNumber, openSession, openSessions, sessionNameField, setUpPaperGame,
} from './helpers';

test.use({ timezoneId: 'Asia/Kolkata' });

const T0 = new Date('2026-10-04T19:00:00+05:30'); // a Sunday evening
const HOUR = 3600_000;
const DAY = 24 * HOUR;
const FAMILY = ['Riya', 'Asha', 'Dad'];
const DIWALI = "Diwali at Nani's";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sessionLine = (page: Page) => page.getByTestId('session-line');
const changeButton = (page: Page) => sessionLine(page).getByRole('button', { name: /^Change/ });
const confirmButton = (page: Page) => page.getByRole('button', { name: 'Confirm prizes' });
const sessionRows = (page: Page) => page.getByTestId('session');

/** New game from home, up to (not including) "Confirm prizes". */
async function newGameUntilConfirm(page: Page, players = FAMILY) {
  await page.goto(HOME);
  await page.getByRole('button', { name: /^Tambola/ }).click();
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Paper tickets' }).click();
  await page.getByLabel('Number of players').fill(String(players.length));
  for (const [i, n] of players.entries()) await page.getByLabel(`Name of player ${i + 1}`, { exact: true }).fill(n);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Contribution per ticket').fill('50');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(confirmButton(page)).toBeVisible();
}

/** Taps "Confirm prizes" and checks that no session question follows: the line already said which session. */
async function confirmWithoutQuestion(page: Page) {
  await confirmButton(page).click();
  await page.waitForTimeout(500);
  await expect(sessionNameField(page)).toHaveCount(0);
  await expect(continueOrNew(page)).toHaveCount(0);
  await expect(nextNumber(page)).toBeVisible();
}

/** The first game of the evening, in "Diwali at Nani's", ended. */
async function firstGame(page: Page) {
  await page.clock.install({ time: T0 });
  await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
  await call(page);
  await endGame(page);
}

/** Taps "Change" on the session line, then "New session", names it and saves. */
async function changeToNewSession(page: Page, name: string) {
  await changeButton(page).click();
  await page.getByRole('button', { name: 'New session', exact: true }).click();
  await expect(sessionNameField(page)).toHaveValue('Sunday 4 Oct');
  await sessionNameField(page).fill(name);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(sessionLine(page)).toContainText(`Session: ${name}`);
}

test.describe('PLT-029: the session is shown, and can be changed, before the game starts', () => {
  test.setTimeout(90_000);

  test('Play again: one line above "Confirm prizes" says "Session: Diwali at Nani\'s · Change"; with no change the game joins it', async ({ page }) => {
    await firstGame(page);
    await page.clock.setSystemTime(new Date(T0.getTime() + HOUR));
    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(confirmButton(page)).toBeVisible();
    await expect(sessionLine(page)).toBeVisible();
    await expect(sessionLine(page)).toContainText(`Session: ${DIWALI}`);
    await expect(sessionLine(page), 'an existing session, not a new one').not.toContainText('(new)');
    await expect(changeButton(page)).toBeVisible();
    // Above "Confirm prizes", on one line.
    const line = (await sessionLine(page).boundingBox())!;
    const confirm = (await confirmButton(page).boundingBox())!;
    expect(line.y + line.height, 'above "Confirm prizes"').toBeLessThanOrEqual(confirm.y + 0.5);
    expect(line.height, 'one line').toBeLessThanOrEqual(56);
    await confirmWithoutQuestion(page);
    await openSessions(page);
    await expect(sessionRows(page)).toHaveCount(1);
    await expect(sessionRows(page).first()).toContainText(/(?<!\d)2 games(?![a-z])/);
  });

  test('New game from the home screen shows the same line on its last step', async ({ page }) => {
    await firstGame(page);
    await page.clock.setSystemTime(new Date(T0.getTime() + 2 * HOUR));
    await newGameUntilConfirm(page);
    await expect(sessionLine(page)).toContainText(`Session: ${DIWALI}`);
    await expect(changeButton(page)).toBeVisible();
  });

  test('"Change" → "New session" suggests the day as its name; the game starts in the new session with no further question', async ({ page }) => {
    await firstGame(page);
    await page.clock.setSystemTime(new Date(T0.getTime() + HOUR));
    await newGameUntilConfirm(page);
    await changeToNewSession(page, 'Cousins');
    await confirmWithoutQuestion(page);
    await call(page);
    await endGame(page);
    await openSessions(page);
    await expect(sessionRows(page)).toHaveCount(2);
    await expect(sessionRows(page).nth(0)).toContainText('Cousins');
    await expect(sessionRows(page).filter({ hasText: 'Cousins' })).toContainText(/(?<!\d)1 game(?![a-z])/);
    await expect(sessionRows(page).filter({ hasText: DIWALI })).toContainText(/(?<!\d)1 game(?![a-z])/);
  });

  test('"Change" can pick a recent unsettled session instead of the one shown', async ({ page }) => {
    await firstGame(page);
    // A second session, started with "Change" on the next game.
    await page.clock.setSystemTime(new Date(T0.getTime() + HOUR));
    await page.getByRole('button', { name: 'Play again' }).click();
    await changeToNewSession(page, 'Cousins');
    await confirmWithoutQuestion(page);
    await call(page);
    await endGame(page);
    // The next game shows the latest session, and "Change" offers "Diwali at Nani's" to pick.
    await page.clock.setSystemTime(new Date(T0.getTime() + 2 * HOUR));
    await newGameUntilConfirm(page);
    await expect(sessionLine(page)).toContainText('Session: Cousins');
    await changeButton(page).click();
    await expect(page.getByRole('button', { name: 'New session', exact: true })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(`^${esc(DIWALI)}`) }).click();
    await expect(sessionLine(page)).toContainText(`Session: ${DIWALI}`);
    await confirmWithoutQuestion(page);
    await callMany(page, 1);
    await endGame(page);
    await openSessions(page);
    await expect(sessionRows(page).filter({ hasText: DIWALI })).toContainText(/(?<!\d)2 games(?![a-z])/);
    await expect(sessionRows(page).filter({ hasText: 'Cousins' })).toContainText(/(?<!\d)1 game(?![a-z])/);
  });

  test('edge: a settled session is not offered to pick', async ({ page }) => {
    await firstGame(page);
    await openSession(page, DIWALI);
    const mark = page.getByRole('button', { name: 'Mark as settled', exact: true });
    if (!(await mark.isVisible())) await page.getByRole('button', { name: 'Settle up', exact: true }).click();
    await mark.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Mark as settled' }).click();
    // A new session for the next game, then one more game: "Diwali at Nani's" is settled, so it is not a choice.
    await page.clock.setSystemTime(new Date(T0.getTime() + HOUR));
    await newGameUntilConfirm(page);
    await changeToNewSession(page, 'Cousins');
    await confirmWithoutQuestion(page);
    await call(page);
    await endGame(page);
    await page.clock.setSystemTime(new Date(T0.getTime() + 2 * HOUR));
    await newGameUntilConfirm(page);
    await expect(sessionLine(page)).toContainText('Session: Cousins');
    await changeButton(page).click();
    await expect(page.getByRole('button', { name: 'New session', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`^${esc(DIWALI)}`) })).toHaveCount(0);
  });

  test('the first game of all: "Session: Sunday 4 Oct (new) · Change"; with no change the game starts a session of that name', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await newGameUntilConfirm(page);
    await expect(sessionLine(page)).toContainText('Session: Sunday 4 Oct (new)');
    await expect(changeButton(page)).toBeVisible();
    const line = (await sessionLine(page).boundingBox())!;
    const confirm = (await confirmButton(page).boundingBox())!;
    expect(line.y + line.height, 'above "Confirm prizes"').toBeLessThanOrEqual(confirm.y + 0.5);
    expect(line.height, 'one line').toBeLessThanOrEqual(56);
    await confirmButton(page).click();
    await answerSession(page); // keeps the suggested name, if a question still follows (PLT-016)
    await expect(nextNumber(page)).toBeVisible();
    await call(page);
    await endGame(page);
    await openSessions(page);
    await expect(sessionRows(page)).toHaveCount(1);
    await expect(sessionRows(page).first()).toContainText('Sunday 4 Oct');
  });

  test('more than 3 hours later: "Session: Monday 5 Oct (new)"; "Change" offers the unsettled "Diwali at Nani\'s" to continue', async ({ page }) => {
    await firstGame(page);
    await page.clock.setSystemTime(new Date(T0.getTime() + 20 * HOUR)); // Monday afternoon
    await newGameUntilConfirm(page);
    await expect(sessionLine(page)).toContainText('Session: Monday 5 Oct (new)');
    await changeButton(page).click();
    await expect(page.getByRole('button', { name: 'New session', exact: true })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(`^${esc(DIWALI)}`) }).click();
    await expect(sessionLine(page)).toContainText(`Session: ${DIWALI}`);
    await expect(sessionLine(page)).not.toContainText('(new)');
    await confirmWithoutQuestion(page);
    await call(page);
    await endGame(page);
    await openSessions(page);
    await expect(sessionRows(page)).toHaveCount(1);
    await expect(sessionRows(page).first()).toContainText(/(?<!\d)2 games(?![a-z])/);
  });

  test('more than 3 hours later, with no change, the game starts the new session shown', async ({ page }) => {
    await firstGame(page);
    await page.clock.setSystemTime(new Date(T0.getTime() + 20 * HOUR));
    await newGameUntilConfirm(page);
    await expect(sessionLine(page)).toContainText('Session: Monday 5 Oct (new)');
    await confirmButton(page).click();
    await answerSession(page, { newSession: true }); // if a question still follows (PLT-016), the same choice: new
    await expect(nextNumber(page)).toBeVisible();
    await call(page);
    await endGame(page);
    await openSessions(page);
    await expect(sessionRows(page)).toHaveCount(2);
    await expect(sessionRows(page).nth(0)).toContainText('Monday 5 Oct');
    await expect(sessionRows(page).filter({ hasText: DIWALI })).toContainText(/(?<!\d)1 game(?![a-z])/);
  });

  test('edge: "Change" lists at most 3 unsettled sessions', async ({ page }) => {
    test.setTimeout(150_000);
    await firstGame(page);
    const names = [DIWALI];
    for (const [i, name] of ['Cousins', 'Neighbours', 'Office'].entries()) {
      await page.clock.setSystemTime(new Date(T0.getTime() + (i + 1) * 0.5 * HOUR));
      await newGameUntilConfirm(page);
      await changeToNewSession(page, name);
      await confirmWithoutQuestion(page);
      await call(page);
      await endGame(page);
      names.push(name);
    }
    await page.clock.setSystemTime(new Date(T0.getTime() + 20 * HOUR));
    await newGameUntilConfirm(page);
    await expect(sessionLine(page)).toContainText('(new)');
    await changeButton(page).click();
    await expect(page.getByRole('button', { name: 'New session', exact: true })).toBeVisible();
    let offered = 0;
    for (const n of names) offered += await page.getByRole('button', { name: new RegExp(`^${esc(n)}`) }).count();
    expect(offered, 'four unsettled sessions: three are listed').toBe(3);
  });

  test('edge: a session whose last game was more than 7 days ago is not listed', async ({ page }) => {
    await firstGame(page);
    await page.clock.setSystemTime(new Date(T0.getTime() + 8 * DAY));
    await newGameUntilConfirm(page);
    await expect(sessionLine(page)).toContainText('Session: Monday 12 Oct (new)');
    await changeButton(page).click();
    await expect(page.getByRole('button', { name: 'New session', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`^${esc(DIWALI)}`) })).toHaveCount(0);
  });
});
