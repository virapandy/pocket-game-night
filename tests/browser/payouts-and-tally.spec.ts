// The host is the bank for each game, and the 1b review findings (29 September 2026,
// docs/games/tambola/changes-2026-09-29-money-and-1b.md): TAM-089 (the payout screen says what the host gives each
// person), TAM-197 (from the payouts to the session tally), TAM-181 on the payout and session screens (buttons
// fixed at the bottom), PLT-017 (one compact row per person in the tally), TAM-109 (each session in the list has a
// readable label). Settle up stays player to player (PLT-028, unchanged: sessions.spec.ts). On a 390 × 844 screen.
// Names and test ids: tests/browser/README.md.
import { expect, test, type Page } from './fixtures';
import {
  callMany, confirmPrizes, endGame, expectAtBottom, expectNoPaymentUi, expectNotHiddenBehind, openSession, openSessions, payoutPeople, recordWin,
  setUpPaperGame, tallyPeople, THREE_TIERS, winEverythingAndEnd,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Kolkata' });

const T0 = new Date('2026-10-04T19:00:00+05:30'); // a Sunday evening
const HOUR = 3600_000;
const FAMILY = ['Riya', 'Asha', 'Dad'];
const DIWALI = "Diwali at Nani's";
const SIX = ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani'];
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const many = (n: number) => Array.from({ length: n }, (_, i) => `Guest ${i + 1}`);

const summary = (page: Page) => page.getByTestId('payout-summary');
const playAgain = (page: Page) => page.getByRole('button', { name: 'Play again', exact: true });
const sessionTally = (page: Page) => page.getByRole('button', { name: 'Session tally', exact: true });

/** Records Early Five for one player, closes it, and ends the game: the rest is handed back. */
async function earlyFiveThenEnd(page: Page, player: string) {
  await callMany(page, 3);
  await recordWin(page, 'Early Five', [player]);
  await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
  await endGame(page);
  await expect(summary(page)).toBeVisible();
}

test.describe('TAM-089: the payout summary says what the host hands each person', () => {
  test('per person: paid, prize won, money handed back, and "Host gives Riya ₹…"; the host gives out exactly the pot', async ({ page }) => {
    await setUpPaperGame(page, { players: SIX });
    await earlyFiveThenEnd(page, 'Riya');
    // Each tier with its winner and amount, or "not won" (TAM-088).
    await expect(summary(page).getByText(/Early Five/).first()).toBeVisible();
    await expect(summary(page).getByText(/not won/i).first()).toBeVisible();

    const people = await payoutPeople(page);
    expect(people.map((p) => p.name)).toEqual(SIX);
    for (const p of people) {
      expect(p.paid, `${p.name} paid`).toBe(50);
      expect(p.hostGives, `${p.name}: prize plus money back`).toBe(p.won + p.handedBack);
      expect(Number.isInteger(p.hostGives)).toBe(true);
    }
    const riya = people.find((p) => p.name === 'Riya')!;
    expect(riya.won).toBeGreaterThan(0);
    for (const p of people.filter((x) => x.name !== 'Riya')) expect(p.won, `${p.name} won nothing`).toBe(0);
    // The total the host gives out equals the pot, to the rupee.
    expect(sum(people.map((p) => p.hostGives))).toBe(300);

    // In words, per person: "Host gives Riya ₹…", matching the numbers.
    for (const p of people) {
      const row = summary(page).locator(`[data-testid="payout-person"][data-name="${p.name}"]`);
      await expect(row).toContainText(`Host gives ${p.name} ₹${p.hostGives}`);
      await expect(row).toContainText(/paid/i);
      await expect(row).toContainText(/handed back/i);
    }
  });

  test('there is no player-to-player hand-over on the payout screen (those are only in Settle up, PLT-028)', async ({ page }) => {
    await setUpPaperGame(page, { players: SIX });
    await earlyFiveThenEnd(page, 'Asha');
    await expect(summary(page).getByText(/Host gives Asha ₹\d+/)).toBeVisible();
    await expect(summary(page).getByTestId('hand-over')).toHaveCount(0);
    await expect(summary(page).getByText(/\b\w+ pays \w+/)).toHaveCount(0);
    await expectNoPaymentUi(page);
  });

  test('edge: a tie shares the prize; each winner gets their share plus money back from the host', async ({ page }) => {
    await setUpPaperGame(page, { players: SIX });
    await callMany(page, 3);
    await recordWin(page, 'Early Five', ['Riya', 'Asha']);
    await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
    await endGame(page);
    const people = await payoutPeople(page);
    const by = Object.fromEntries(people.map((p) => [p.name, p]));
    expect(by['Riya']!.won).toBeGreaterThan(0);
    expect(by['Asha']!.won).toBeGreaterThan(0);
    expect(Math.abs(by['Riya']!.won - by['Asha']!.won)).toBeLessThanOrEqual(1);
    for (const p of people) expect(p.hostGives).toBe(p.won + p.handedBack);
    expect(sum(people.map((p) => p.hostGives))).toBe(300);
    await expect(summary(page)).toContainText(`Host gives Asha ₹${by['Asha']!.hostGives}`);
  });

  test('edge: with "No money", nothing is handed over, so there is no "Host gives" and no ₹', async ({ page }) => {
    await setUpPaperGame(page, { players: FAMILY, contribution: 'none' });
    await callMany(page, 3);
    await recordWin(page, 'Early Five', ['Riya']);
    await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
    await endGame(page);
    await expect(summary(page)).toBeVisible();
    await expect(summary(page).getByText(/Host gives/)).toHaveCount(0);
    await expect(summary(page).getByText(/₹/)).toHaveCount(0);
  });
});

test.describe('TAM-197 and TAM-181: from the payouts to the session tally; buttons fixed at the bottom', () => {
  test.setTimeout(90_000);

  test('"Play again" and "Session tally" are fixed at the bottom; "Session tally" opens this game\'s session tally', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectAtBottom(page, playAgain(page), '"Play again"');
    await expectAtBottom(page, sessionTally(page), '"Session tally"');
    await sessionTally(page).click();
    await expect(page.getByTestId('tally')).toBeVisible();
    await expect(page.getByText(DIWALI).first()).toBeVisible();
    const by = Object.fromEntries((await tallyPeople(page)).map((p) => [p.name, p]));
    expect(by['Riya']).toEqual({ name: 'Riya', paid: 50, gotBack: 150, net: 100 });
    expect(by['Asha']).toEqual({ name: 'Asha', paid: 50, gotBack: 0, net: -50 });
    expect(by['Dad']).toEqual({ name: 'Dad', paid: 50, gotBack: 0, net: -50 });
  });

  test('edge: with two sessions, "Session tally" opens the one this game is in, not the other', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    await page.clock.setSystemTime(new Date(T0.getTime() + 4 * HOUR));
    await setUpPaperGame(page, { players: FAMILY, session: { name: 'Monday', newSession: true } });
    await winEverythingAndEnd(page, 'Dad', THREE_TIERS);
    await sessionTally(page).click();
    await expect(page.getByText('Monday').first()).toBeVisible();
    const by = Object.fromEntries((await tallyPeople(page)).map((p) => [p.name, p]));
    expect(by['Dad']).toEqual({ name: 'Dad', paid: 50, gotBack: 150, net: 100 });
    expect(by['Riya']).toEqual({ name: 'Riya', paid: 50, gotBack: 0, net: -50 });
  });

  test('with 20 players the payouts scroll, the two buttons stay at the bottom, and the last person is never hidden behind them', async ({ page }) => {
    test.setTimeout(120_000);
    await setUpPaperGame(page, { players: many(20) });
    await earlyFiveThenEnd(page, 'Guest 1');
    await page.evaluate(() => window.scrollTo(0, 0));
    const a = await expectAtBottom(page, playAgain(page), '"Play again"');
    await expectAtBottom(page, sessionTally(page), '"Session tally"');
    const last = summary(page).getByTestId('payout-person').last();
    await expect(last).toContainText('Guest 20');
    await expectNotHiddenBehind(page, last, [playAgain(page), sessionTally(page)], 'the last person on the payout screen');
    // Still at the bottom, in the same place, after scrolling.
    const again = await expectAtBottom(page, playAgain(page), '"Play again" after scrolling');
    expect(Math.round(again.y)).toBe(Math.round(a.y));
  });

  test('on the session screen, "Settle up" and "Mark as settled" are fixed at the bottom with 20 people in the tally', async ({ page }) => {
    test.setTimeout(120_000);
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: many(20), session: { name: DIWALI } });
    await earlyFiveThenEnd(page, 'Guest 1');
    await openSession(page, DIWALI);
    await expect(page.getByTestId('tally').getByTestId('tally-person')).toHaveCount(20);
    await page.evaluate(() => window.scrollTo(0, 0));
    const settle = page.getByRole('button', { name: 'Settle up', exact: true });
    await expectAtBottom(page, settle, '"Settle up"');
    const mark = page.getByRole('button', { name: 'Mark as settled', exact: true });
    if (await mark.isVisible()) await expectAtBottom(page, mark, '"Mark as settled"');
    const fixed = (await mark.isVisible()) ? [settle, mark] : [settle];
    await expectNotHiddenBehind(page, page.getByTestId('tally').getByTestId('tally-person').last(), fixed, 'the last person in the tally');

    await settle.click();
    await expect(page.getByTestId('settle-up').getByTestId('hand-over').first()).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectAtBottom(page, mark, '"Mark as settled" under the hand-overs');
    await expectNotHiddenBehind(page, page.getByTestId('settle-up').getByTestId('hand-over').last(), [mark], 'the last hand-over');
  });
});

test.describe('PLT-017: the tally is one compact row per person', () => {
  test('seven people: each is one short row with their name and balance, and all seven fit on the screen', async ({ page }) => {
    test.setTimeout(90_000);
    const seven = ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani', 'Arjun'];
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: seven, session: { name: DIWALI } });
    await earlyFiveThenEnd(page, 'Riya');
    await openSession(page, DIWALI);
    const rows = page.getByTestId('tally').getByTestId('tally-person');
    await expect(rows).toHaveCount(7);
    const people = await tallyPeople(page);
    for (let i = 0; i < 7; i++) {
      const row = rows.nth(i);
      const name = people[i]!.name;
      const b = (await row.boundingBox())!;
      expect(b.height, `${name}'s row is one compact line`).toBeLessThanOrEqual(60);
      await expect(row).toContainText(name);
      await expect(row, `${name}'s balance is shown`).toContainText(/₹\d+|Even/);
    }
    // All seven are on the screen at once, with nothing to scroll inside the tally.
    const vp = page.viewportSize()!;
    await rows.first().scrollIntoViewIfNeeded();
    const first = (await rows.first().boundingBox())!;
    const lastBox = (await rows.last().boundingBox())!;
    expect(lastBox.y + lastBox.height - first.y).toBeLessThanOrEqual(vp.height);
  });
});

test.describe('TAM-109: each session in the Sessions list has a readable label', () => {
  test('the name, how many games, and whether it is settled, as the button\'s own name', async ({ page }) => {
    test.setTimeout(90_000);
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    await page.getByRole('button', { name: 'Play again' }).click();
    await confirmPrizes(page);
    await winEverythingAndEnd(page, 'Asha', THREE_TIERS);
    // A second session, settled.
    await page.clock.setSystemTime(new Date(T0.getTime() + 4 * HOUR));
    await setUpPaperGame(page, { players: FAMILY, session: { name: 'Monday', newSession: true } });
    await winEverythingAndEnd(page, 'Dad', THREE_TIERS);
    await openSession(page, 'Monday');
    const mark = page.getByRole('button', { name: 'Mark as settled', exact: true });
    if (!(await mark.isVisible())) await page.getByRole('button', { name: 'Settle up', exact: true }).click();
    await mark.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Mark as settled' }).click();

    await openSessions(page);
    const diwali = page.getByRole('button', { name: new RegExp(DIWALI) });
    await expect(diwali).toHaveCount(1);
    await expect(diwali).toHaveAccessibleName(/^(?=.*Diwali at Nani's)(?=.*(?<!\d)2 games(?![a-z]))(?=.*(not settled|unsettled)).*/is);
    const monday = page.getByRole('button', { name: /Monday/ });
    await expect(monday).toHaveCount(1);
    await expect(monday).toHaveAccessibleName(/^(?=.*Monday)(?=.*(?<!\d)1 game(?![a-z]))(?!.*(not settled|unsettled))(?=.*settled).*/is);
    // The label is readable on screen too, not only to a screen reader.
    await expect(page.getByTestId('session').filter({ hasText: DIWALI })).toContainText(/(?<!\d)2 games/);
    // One tap on the labelled button opens the session.
    await diwali.click();
    await expect(page.getByTestId('tally')).toBeVisible();
    await expect(page.getByTestId('session-game')).toHaveCount(2);
  });
});
