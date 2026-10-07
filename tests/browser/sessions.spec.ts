// Phase 1b: sessions, the tally and settling up, on the host phone.
// Scenarios: PLT-016 (every game belongs to a named session), PLT-017 (the tally), PLT-018 (never across
// sessions), PLT-019 (settling marks the games done), PLT-020 (the same person across games), PLT-022 (sessions
// can be seen and renamed), PLT-023 (games without money stay out), PLT-026 (a game stays in its session),
// PLT-027 (a settled tally can be looked at later; undo for 5 seconds), PLT-028 (net amounts, "Settle up",
// "Mark as settled"), TAM-090 (no money is moved). Names and test ids: tests/browser/README.md.
import { expect, test, type Page } from './fixtures';
import {
  call, callMany, confirmPrizes, continueOrNew, currentNumber, endGame, expectNoPaymentUi, HOME, nextNumber, openHistory, openSession, openSessions, sessionNameField, setUpPaperGame, tallyPeople, THREE_TIERS, winEverythingAndEnd, chooseTicketType, openTambola,  waitOutTapGuard,
} from './helpers';

test.use({ timezoneId: 'Asia/Kolkata' });

const T0 = new Date('2026-10-04T19:00:00+05:30'); // a Sunday evening
const HOUR = 3600_000;
const FAMILY = ['Riya', 'Asha', 'Dad'];
const DIWALI = "Diwali at Nani's";

/** Setup up to (not including) "Confirm prizes". */
async function setUpUntilConfirm(page: Page, players = FAMILY) {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await chooseTicketType(page, 'paper');
  await page.getByLabel('Number of players').fill(String(players.length));
  for (const [i, n] of players.entries()) await page.getByLabel(`Name of player ${i + 1}`, { exact: true }).fill(n);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Contribution per ticket').fill('50');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
}

/** No session question is showing (after giving it a moment to appear). */
async function expectNoSessionQuestion(page: Page) {
  await page.waitForTimeout(500);
  await expect(sessionNameField(page)).toHaveCount(0);
  await expect(continueOrNew(page)).toHaveCount(0);
}

async function playAgain(page: Page) {
  await page.getByRole('button', { name: 'Play again' }).click();
  await confirmPrizes(page);
}

const sessionRows = (page: Page) => page.getByTestId('session');

test.describe('PLT-016: every game belongs to a named session', () => {
  test('the first game names its session on the session line, suggesting the day ("Sunday 4 Oct"), with no separate naming screen; later games join it without asking', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpUntilConfirm(page);
    // UX list row 9 (owner 2026-10-03): the line above "Confirm prizes" is the only place the first session is named.
    const line = page.getByTestId('session-line');
    await expect(line).toContainText('Session: Sunday 4 Oct (new)');
    await line.getByRole('button', { name: /^Change/ }).click();
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    await expect(sessionNameField(page)).toHaveValue('Sunday 4 Oct');
    await sessionNameField(page).fill(DIWALI);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(line).toContainText(`Session: ${DIWALI}`);
    await page.getByRole('button', { name: 'Confirm prizes' }).click();
    await expectNoSessionQuestion(page);
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0);
    await expect(nextNumber(page)).toBeVisible();
    await call(page);
    await endGame(page);

    // Play again, an hour later: same session, no question.
    await page.clock.setSystemTime(new Date(T0.getTime() + HOUR));
    await page.getByRole('button', { name: 'Play again' }).click();
    await page.getByRole('button', { name: 'Confirm prizes' }).click();
    await expectNoSessionQuestion(page);
    await expect(nextNumber(page)).toBeVisible();
    await call(page);
    await endGame(page);

    // A new game from the home screen, 2 hours after that one ended: still the same session, no question.
    await page.clock.setSystemTime(new Date(T0.getTime() + 3 * HOUR));
    await setUpUntilConfirm(page);
    await page.getByRole('button', { name: 'Confirm prizes' }).click();
    await expectNoSessionQuestion(page);
    await call(page);
    await endGame(page);

    await openSessions(page);
    await expect(sessionRows(page)).toHaveCount(1);
    await expect(sessionRows(page).first()).toContainText(DIWALI);
    await expect(sessionRows(page).first()).toContainText(/(?<!\d)3 games(?![a-z])/);
  });

  test('more than 3 hours after the session\'s last game ended, the app asks "Continue … or start a new session?"', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await call(page);
    await endGame(page);

    await page.clock.setSystemTime(new Date(T0.getTime() + 3 * HOUR + 5 * 60_000));
    await setUpUntilConfirm(page);
    await page.getByRole('button', { name: 'Confirm prizes' }).click();
    await expect(continueOrNew(page)).toBeVisible();
    await expect(continueOrNew(page)).toContainText(/Continue ['‘’"]Diwali at Nani['‘’]s['‘’"] or start a new session\?/);
    await expect(page.getByRole('button', { name: /^Continue / })).toBeVisible();
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    // A new session asks for its name, suggesting the day again.
    await expect(sessionNameField(page)).toHaveValue('Sunday 4 Oct');
    await sessionNameField(page).fill('Late show');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(nextNumber(page)).toBeVisible();
    await call(page);
    await endGame(page);

    // PLT-022: every session listed, newest first.
    await openSessions(page);
    await expect(sessionRows(page)).toHaveCount(2);
    await expect(sessionRows(page).nth(0)).toContainText('Late show');
    await expect(sessionRows(page).nth(1)).toContainText(DIWALI);
  });

  test('"Continue" keeps the game in the same session', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await call(page);
    await endGame(page);
    await page.clock.setSystemTime(new Date(T0.getTime() + 5 * HOUR));
    await setUpUntilConfirm(page);
    await page.getByRole('button', { name: 'Confirm prizes' }).click();
    await page.getByRole('button', { name: /^Continue / }).click();
    await expect(nextNumber(page)).toBeVisible();
    await openSessions(page);
    await expect(sessionRows(page)).toHaveCount(1);
    await expect(sessionRows(page).first()).toContainText(/(?<!\d)2 games(?![a-z])/);
  });
});

test.describe('PLT-017, PLT-019, PLT-020, PLT-027, PLT-028: tally, settle up, mark as settled', () => {
  test.setTimeout(120_000);

  test('two ended games and one in progress: the tally, who pays whom, settling, undo, and the settled record', { tag: '@smoke' }, async ({ page }) => {
    await page.clock.install({ time: T0 });
    // Game 1: Riya wins every prize. Riya +100, Asha −50, Dad −50.
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    // Game 2 (Play again, same names, PLT-020): Asha wins every prize. Asha +100, Riya −50, Dad −50.
    await playAgain(page);
    await winEverythingAndEnd(page, 'Asha', THREE_TIERS);
    // Game 3: still in progress, so not in the tally.
    await playAgain(page);
    await callMany(page, 2);

    await openSession(page, DIWALI);
    const people = await tallyPeople(page);
    // PLT-020: one line per person, matched by name across games.
    expect(people.map((p) => p.name).sort()).toEqual(['Asha', 'Dad', 'Riya']);
    const by = Object.fromEntries(people.map((p) => [p.name, p]));
    expect(by['Riya']).toEqual({ name: 'Riya', paid: 100, gotBack: 150, net: 50 });
    expect(by['Asha']).toEqual({ name: 'Asha', paid: 100, gotBack: 150, net: 50 });
    expect(by['Dad']).toEqual({ name: 'Dad', paid: 100, gotBack: 0, net: -100 });
    // It balances: everything paid in equals everything paid out.
    expect(people.reduce((a, p) => a + p.paid, 0)).toBe(people.reduce((a, p) => a + p.gotBack, 0));
    // PLT-028: the net amounts are shown, as words and ₹.
    await expect(page.getByTestId('tally').getByTestId('tally-person').filter({ hasText: 'Dad' })).toContainText('₹100');

    // "Settle up": the fewest hand-overs, adding up exactly to each net amount. Text only.
    await page.getByRole('button', { name: 'Settle up', exact: true }).click();
    const handOvers = page.getByTestId('settle-up').getByTestId('hand-over');
    await expect(handOvers).toHaveCount(2);
    await expect(page.getByTestId('settle-up')).toContainText('Dad pays Riya ₹50');
    await expect(page.getByTestId('settle-up')).toContainText('Dad pays Asha ₹50');
    for (let i = 0; i < 2; i++) {
      await expect(handOvers.nth(i)).toHaveAttribute('data-from', 'Dad');
      await expect(handOvers.nth(i)).toHaveAttribute('data-amount', '50');
    }
    await expectNoPaymentUi(page);

    // "Mark as settled" asks first (PLT-019).
    await page.getByRole('button', { name: 'Mark as settled', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Mark 2 games as settled? Do this after the money has changed hands.');
    await dialog.getByRole('button', { name: 'Mark as settled' }).click();
    // The tally is empty again, with "Settled. Undo" for 5 seconds (PLT-027).
    expect(await tallyPeople(page)).toEqual([]);
    await expect(page.getByText(/Settled\./).first()).toBeVisible();
    await page.getByRole('button', { name: /^Undo/ }).click();
    // Undo puts the games back into the unsettled tally exactly as before.
    expect((await tallyPeople(page)).sort((a, b) => a.name.localeCompare(b.name))).toEqual(
      [...people].sort((a, b) => a.name.localeCompare(b.name)),
    );

    // Settle again, and let the 5 seconds pass: the undo is gone.
    const mark = page.getByRole('button', { name: 'Mark as settled', exact: true });
    if (!(await mark.isVisible())) await page.getByRole('button', { name: 'Settle up', exact: true }).click();
    await mark.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Mark as settled' }).click();
    await page.clock.runFor(6_000);
    await expect(page.getByRole('button', { name: /^Undo/ })).toHaveCount(0);
    expect(await tallyPeople(page)).toEqual([]);

    // PLT-027: the settle is listed with its date and time; one tap shows what it said, read-only.
    const settlements = page.getByTestId('settlement');
    await expect(settlements).toHaveCount(1);
    await expect(settlements.first()).toContainText(/\d{1,2}[:.]\d{2}/);
    await expect(settlements.first()).toContainText(/Oct/);
    await settlements.first().click();
    const record = await tallyPeople(page, 'settlement-detail');
    expect(record.sort((a, b) => a.name.localeCompare(b.name))).toEqual([...people].sort((a, b) => a.name.localeCompare(b.name)));
    const detail = page.getByTestId('settlement-detail');
    await expect(detail.locator('input:not([disabled]), textarea:not([disabled]), select:not([disabled])')).toHaveCount(0);
    await expect(detail.getByRole('button', { name: /Settle up|Mark as settled|Edit/ })).toHaveCount(0);

    // PLT-019: settled games show "Settled" in history.
    await openHistory(page);
    await expect(page.getByTestId('history-game').filter({ hasText: 'Settled' })).toHaveCount(2);

    // PLT-019: later games in the same session start a new tally: game 3, once ended, is tallied alone.
    await page.goto(HOME);
    await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
    await page.getByTestId('unfinished-games').getByText('Tap to resume').first().click();
    await expect(nextNumber(page)).toBeVisible();
    await winEverythingAndEnd(page, 'Dad', THREE_TIERS);
    await openSession(page, DIWALI);
    const fresh = Object.fromEntries((await tallyPeople(page)).map((p) => [p.name, p]));
    expect(fresh['Dad']).toEqual({ name: 'Dad', paid: 50, gotBack: 150, net: 100 });
    expect(fresh['Riya']).toEqual({ name: 'Riya', paid: 50, gotBack: 0, net: -50 });
    // PLT-022: the session shows whether its tally is settled.
    await openSessions(page);
    await expect(sessionRows(page).first()).toContainText(/not settled|unsettled/i);
  });
});

test.describe('PLT-018 and PLT-023: what is never in a tally', () => {
  test.setTimeout(90_000);

  test('a game from another session is never tallied, and there is no way to add one', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    await page.clock.setSystemTime(new Date(T0.getTime() + 4 * HOUR));
    await setUpPaperGame(page, { players: FAMILY, session: { name: 'Monday', newSession: true } });
    await winEverythingAndEnd(page, 'Dad', THREE_TIERS);

    await openSession(page, DIWALI);
    const by = Object.fromEntries((await tallyPeople(page)).map((p) => [p.name, p]));
    expect(by['Riya']).toEqual({ name: 'Riya', paid: 50, gotBack: 150, net: 100 });
    expect(by['Dad']).toEqual({ name: 'Dad', paid: 50, gotBack: 0, net: -50 });
    await expect(page.getByRole('button', { name: /add (a )?game/i })).toHaveCount(0);
  });

  test('a "No money" game is in the session\'s games, but never in its tally', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    await setUpPaperGame(page, { players: FAMILY, contribution: 'none' });
    await winEverythingAndEnd(page, 'Asha', THREE_TIERS);

    await openSession(page, DIWALI);
    await expect(page.getByTestId('session-game')).toHaveCount(2);
    const by = Object.fromEntries((await tallyPeople(page)).map((p) => [p.name, p]));
    expect(by['Asha']).toEqual({ name: 'Asha', paid: 50, gotBack: 0, net: -50 });
    expect(by['Riya']).toEqual({ name: 'Riya', paid: 50, gotBack: 150, net: 100 });
  });
});

test('PLT-022: a session can be renamed at any time', async ({ page }) => {
  await page.clock.install({ time: T0 });
  await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
  await call(page);
  await endGame(page);
  await openSession(page, DIWALI);
  await page.getByRole('button', { name: /^Rename/ }).click();
  await sessionNameField(page).fill('Diwali 2026');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await openSessions(page);
  await expect(sessionRows(page).first()).toContainText('Diwali 2026');
  await expect(sessionRows(page).filter({ hasText: DIWALI })).toHaveCount(0);
});

test('PLT-026: a game left paused overnight stays in the session it was started in, and is tallied there', async ({ page }) => {
  await page.clock.install({ time: T0 });
  await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
  await winEverythingAndEnd(page, 'Asha', THREE_TIERS);
  await playAgain(page);
  const n = await call(page);
  // The next morning, 14 hours later: resume it (PLT-004) and end it.
  await page.clock.setSystemTime(new Date(T0.getTime() + 14 * HOUR));
  await page.goto(HOME);
  await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
  await page.getByRole('button', { name: /^Resume/ }).first().click();
  await expect(currentNumber(page)).toHaveText(String(n));
  await winEverythingAndEnd(page, 'Riya', THREE_TIERS);

  await openSessions(page);
  await expect(sessionRows(page)).toHaveCount(1);
  await expect(sessionRows(page).first()).toContainText(/(?<!\d)2 games(?![a-z])/);
  await openSession(page, DIWALI);
  const by = Object.fromEntries((await tallyPeople(page)).map((p) => [p.name, p]));
  expect(by['Riya']).toEqual({ name: 'Riya', paid: 100, gotBack: 150, net: 50 });
  expect(by['Asha']).toEqual({ name: 'Asha', paid: 100, gotBack: 150, net: 50 });
});

test('PLT-026 and PLT-016: with a game still paused from last night, a new game the next day asks "Continue … or start a new session?"', async ({ page }) => {
  await page.clock.install({ time: T0 });
  await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
  await winEverythingAndEnd(page, 'Asha', THREE_TIERS);
  await playAgain(page);
  await call(page); // left paused overnight
  await page.clock.setSystemTime(new Date(T0.getTime() + 14 * HOUR));
  await setUpUntilConfirm(page);
  await page.getByRole('button', { name: 'Confirm prizes' }).click();
  await expect(continueOrNew(page)).toContainText(/Continue ['‘’"]Diwali at Nani['‘’]s['‘’"] or start a new session\?/);
  await page.getByRole('button', { name: 'New session', exact: true }).click();
  await sessionNameField(page).fill('Monday');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(nextNumber(page)).toBeVisible();
  // Last night's paused game is still in "Diwali at Nani's", not in the new session.
  await openSessions(page);
  await expect(sessionRows(page)).toHaveCount(2);
  await expect(sessionRows(page).filter({ hasText: DIWALI })).toContainText(/(?<!\d)2 games(?![a-z])/);
  await expect(sessionRows(page).filter({ hasText: 'Monday' })).toContainText(/(?<!\d)1 game(?![a-z])/);
});
