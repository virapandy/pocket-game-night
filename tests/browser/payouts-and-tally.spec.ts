// The payout screen (owner, 2026-09-30, docs/decisions.md): TAM-088 and TAM-089 (each person's row shows paid, won and
// net; "Settle with host" shows what the host gives each person), TAM-199 ("Settle with players": who pays whom for
// this game). The 1b review findings (29 September 2026, docs/games/tambola/changes-2026-09-29-money-and-1b.md): TAM-197 (from the payouts to the session tally), TAM-181 on the payout and session screens (buttons
// fixed at the bottom), PLT-017 (one compact row per person in the tally; a tap shows the details), TAM-109 (each session in the list has a
// readable label). Settle up stays player to player (PLT-028, unchanged: sessions.spec.ts). On a 390 × 844 screen.
// Names and test ids: tests/browser/README.md.
import { expect, test, type Locator, type Page } from './fixtures';
import {
  callMany, confirmPrizes, endGame, expectAtBottom, expectNoPaymentUi, expectNotHiddenBehind, handOvers, hostGivesList, openSession, openSessions,
  onTopAtCentre, payoutPeople, recordWin, setUpPaperGame, tallyPeople, THREE_TIERS, winEverythingAndEnd,
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
const settleWithHost = (page: Page) => page.getByRole('button', { name: 'Settle with host', exact: true });
const settleWithPlayers = (page: Page) => page.getByRole('button', { name: 'Settle with players', exact: true });

/** After the hand-overs, everyone is at ₹0: what each person pays minus what they receive equals minus their net. */
function expectEveryoneAtZero(people: { name: string; net: number }[], hs: { from: string; to: string; amount: number; text: string }[]) {
  for (const p of people) {
    const received = sum(hs.filter((h) => h.to === p.name).map((h) => h.amount));
    const paidOut = sum(hs.filter((h) => h.from === p.name).map((h) => h.amount));
    expect(received - paidOut, `${p.name} ends at ₹0 (net ${p.net})`).toBe(p.net);
  }
  for (const h of hs) {
    expect(Number.isInteger(h.amount) && h.amount > 0, `${h.text}: a whole, positive amount`).toBe(true);
    expect(h.from).not.toBe(h.to);
  }
}

/** Records Early Five for one player, closes it, and ends the game: the rest is handed back. */
async function earlyFiveThenEnd(page: Page, player: string) {
  await callMany(page, 3);
  await recordWin(page, 'Early Five', [player]);
  await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
  await endGame(page);
  await expect(summary(page)).toBeVisible();
}

test.describe('TAM-088 and TAM-089: each person\'s row shows paid, won and net; "Settle with host" shows what the host gives', () => {
  test('one row per person with paid, won and net; the nets add up to ₹0', { tag: '@smoke' }, async ({ page }) => {
    await setUpPaperGame(page, { players: SIX });
    await earlyFiveThenEnd(page, 'Riya');
    // Each tier with its winner and amount, or "not won" (TAM-088).
    await expect(summary(page).getByText(/Early Five/).first()).toBeVisible();
    await expect(summary(page).getByText(/not won/i).first()).toBeVisible();

    const people = await payoutPeople(page);
    expect(people.map((p) => p.name)).toEqual(SIX);
    for (const p of people) {
      expect(p.paid, `${p.name} paid`).toBe(50);
      expect(Number.isInteger(p.net), `${p.name}: net is a whole number of rupees`).toBe(true);
    }
    const riya = people.find((p) => p.name === 'Riya')!;
    expect(riya.won).toBeGreaterThan(0);
    expect(riya.net).toBeGreaterThan(0);
    for (const p of people.filter((x) => x.name !== 'Riya')) expect(p.won, `${p.name} won nothing`).toBe(0);
    // Money handed back counts in the net: others get some back, so they lose less than they paid.
    for (const p of people.filter((x) => x.name !== 'Riya')) {
      expect(p.net, `${p.name} got money back`).toBeGreaterThan(-50);
      expect(p.net).toBeLessThan(0);
    }
    expect(sum(people.map((p) => p.net)), 'the nets balance').toBe(0);

    // In words on each row: paid, won and net, with the amounts.
    for (const p of people) {
      const row = summary(page).locator(`[data-testid="payout-person"][data-name="${p.name}"]`);
      await expect(row).toContainText(p.name);
      await expect(row).toContainText(/paid/i);
      await expect(row).toContainText(/won/i);
      await expect(row).toContainText(/net/i);
      await expect(row).toContainText(`₹${Math.abs(p.net)}`);
    }
    // Below the rows, the two settle buttons.
    await expect(settleWithHost(page)).toBeVisible();
    await expect(settleWithPlayers(page)).toBeVisible();
  });

  test('"Settle with host": "Host gives Riya ₹…" per person (prize plus money back); the host gives out exactly the pot', { tag: '@smoke' }, async ({ page }) => {
    await setUpPaperGame(page, { players: SIX });
    await earlyFiveThenEnd(page, 'Riya');
    const people = await payoutPeople(page);
    await settleWithHost(page).click();
    await expect(page.getByTestId('settle-with-host')).toBeVisible();
    const gives = await hostGivesList(page);
    const by = Object.fromEntries(gives.map((g) => [g.name, g]));
    for (const p of people) {
      // Everyone gets something back here: Riya her prize and her share, the others their share.
      expect(by[p.name], `a "Host gives" line for ${p.name}`).toBeDefined();
      expect(by[p.name]!.amount, `${p.name}: what the host gives is what they paid plus their net`).toBe(p.paid + p.net);
      expect(by[p.name]!.text).toContain(`Host gives ${p.name} ₹${by[p.name]!.amount}`);
    }
    expect(sum(gives.map((g) => g.amount)), 'the host gives out the pot').toBe(300);
    await expectNoPaymentUi(page);
  });

  test('edge: a tie shares the prize; each winner gets their share plus money back from the host', async ({ page }) => {
    await setUpPaperGame(page, { players: SIX });
    await callMany(page, 3);
    await recordWin(page, 'Early Five', ['Riya', 'Asha']);
    await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
    await endGame(page);
    const people = await payoutPeople(page);
    expect(people.map((p) => p.name)).toEqual(SIX);
    const by = Object.fromEntries(people.map((p) => [p.name, p]));
    expect(by['Riya']!.won).toBeGreaterThan(0);
    expect(by['Asha']!.won).toBeGreaterThan(0);
    expect(Math.abs(by['Riya']!.won - by['Asha']!.won)).toBeLessThanOrEqual(1);
    expect(sum(people.map((p) => p.net))).toBe(0);
    await settleWithHost(page).click();
    const gives = await hostGivesList(page);
    for (const g of gives) expect(g.amount).toBe(by[g.name]!.paid + by[g.name]!.net);
    expect(sum(gives.map((g) => g.amount))).toBe(300);
    await expect(page.getByTestId('settle-with-host')).toContainText(`Host gives Asha ₹${by['Asha']!.paid + by['Asha']!.net}`);
  });

  test('edge: with "No money", nothing is handed over, so there is no "Host gives" and no ₹', async ({ page }) => {
    await setUpPaperGame(page, { players: FAMILY, contribution: 'none' });
    await callMany(page, 3);
    await recordWin(page, 'Early Five', ['Riya']);
    await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
    await endGame(page);
    await expect(summary(page)).toBeVisible();
    await expect(page.getByText(/Host gives/)).toHaveCount(0);
    await expect(summary(page).getByText(/₹/)).toHaveCount(0);
  });
});

test.describe('TAM-199: "Settle with players" says who pays whom for this game', () => {
  test('Riya +₹100, Asha −₹50, Dad −₹50: "Asha pays Riya ₹50" and "Dad pays Riya ₹50", two hand-overs', async ({ page }) => {
    await setUpPaperGame(page, { players: FAMILY });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    const people = await payoutPeople(page);
    expect(Object.fromEntries(people.map((p) => [p.name, p.net]))).toEqual({ Riya: 100, Asha: -50, Dad: -50 });
    // Nothing is listed until the host asks for it.
    await expect(page.getByTestId('hand-over')).toHaveCount(0);
    await settleWithPlayers(page).click();
    await expect(page.getByTestId('settle-with-players')).toBeVisible();
    const hs = await handOvers(page, 'settle-with-players');
    expect(hs.length, 'the fewest hand-overs: two').toBe(2);
    expect(hs.map((h) => h.text).sort()).toEqual(['Asha pays Riya ₹50', 'Dad pays Riya ₹50']);
    expectEveryoneAtZero(people, hs);
    await expectNoPaymentUi(page);
  });

  test('uneven nets with money handed back: every loser pays the winner, and everyone ends at ₹0 to the rupee', async ({ page }) => {
    await setUpPaperGame(page, { players: SIX });
    await earlyFiveThenEnd(page, 'Riya');
    const people = await payoutPeople(page);
    await settleWithPlayers(page).click();
    const hs = await handOvers(page, 'settle-with-players');
    expectEveryoneAtZero(people, hs);
    // One winner, five who lost a little: the fewest hand-overs is one from each of the five, all to Riya.
    expect(hs.length).toBe(5);
    for (const h of hs) {
      expect(h.to).toBe('Riya');
      expect(h.text).toBe(`${h.from} pays Riya ₹${h.amount}`);
    }
  });

  test('edge: a tie with nets in both directions; the hand-overs still add up exactly', async ({ page }) => {
    await setUpPaperGame(page, { players: SIX });
    await callMany(page, 3);
    await recordWin(page, 'Early Five', ['Riya', 'Asha']);
    await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
    await endGame(page);
    const people = await payoutPeople(page);
    await settleWithPlayers(page).click();
    const hs = await handOvers(page, 'settle-with-players');
    expectEveryoneAtZero(people, hs);
    const nonZero = people.filter((p) => p.net !== 0).length;
    expect(hs.length, 'never more than one fewer than the people with money to move').toBeLessThanOrEqual(nonZero - 1);
  });

  test('this game only: an earlier game in the same session does not change the hand-overs', async ({ page }) => {
    test.setTimeout(90_000);
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Dad', THREE_TIERS);
    await page.getByRole('button', { name: 'Play again' }).click();
    await confirmPrizes(page);
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    await settleWithPlayers(page).click();
    const hs = await handOvers(page, 'settle-with-players');
    expect(hs.map((h) => h.text).sort()).toEqual(['Asha pays Riya ₹50', 'Dad pays Riya ₹50']);
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

/** Scrolls the page, and every scrolling area in it, back to the top: the screen as it first appears. */
const toTop = (page: Page) =>
  page.evaluate(() => {
    window.scrollTo(0, 0);
    for (const el of Array.from(document.querySelectorAll('*'))) if (el.scrollTop > 0) el.scrollTop = 0;
  });

/** The button lies wholly on the 390 × 844 screen as it first appears, and nothing covers its centre. */
async function expectReachableWithoutScrolling(page: Page, l: Locator, what: string) {
  const vp = page.viewportSize()!;
  await expect(l, `${what} is on the payout screen`).toBeVisible();
  const b = (await l.boundingBox())!;
  expect(b.y, `${what} starts on the screen`).toBeGreaterThanOrEqual(-0.5);
  expect(b.y + b.height, `${what} ends on the screen (bottom at ${Math.round(b.y + b.height)} px, screen ${vp.height} px)`).toBeLessThanOrEqual(vp.height + 0.5);
  expect(await onTopAtCentre(l), `nothing covers ${what}`).toBe(true);
  return b;
}

test.describe('TAM-181 and TAM-199: "Settle with host" and "Settle with players" can be reached without scrolling', () => {
  // Product owner's review of 1 October 2026 (docs/handover.md "Next, in order" item 2): with 6 players both buttons sat
  // below the bottom of a 390 × 844 screen, so the host had to scroll to find them.
  test.setTimeout(120_000);

  for (const [label, players] of [['6 players', SIX], ['20 players', many(20)]] as const) {
    test(`${label}: both settle buttons are on the screen as it first appears, and a tap there works`, async ({ page }) => {
      await setUpPaperGame(page, { players: [...players] });
      await earlyFiveThenEnd(page, players[0]!);
      await toTop(page);
      await expectReachableWithoutScrolling(page, settleWithPlayers(page), '"Settle with players"');
      const host = await expectReachableWithoutScrolling(page, settleWithHost(page), '"Settle with host"');
      // "Play again" and "Session tally" are still fixed at the bottom (TAM-197), and neither settle button is under them.
      await expectAtBottom(page, playAgain(page), '"Play again"');
      await expectAtBottom(page, sessionTally(page), '"Session tally"');
      // A finger tap where "Settle with host" is, with no scrolling, opens what the host gives.
      await page.mouse.click(host.x + host.width / 2, host.y + host.height / 2);
      await expect(page.getByTestId('settle-with-host')).toBeVisible();
    });
  }
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

test.describe('PLT-017: tapping a person\'s row shows what they paid, won and got back', () => {
  test.setTimeout(90_000);
  const amount = (word: string, n: number) =>
    new RegExp(`${word}\\D{0,20}₹${n}(?!\\d)|₹${n}(?!\\d)\\D{0,3}${word}`, 'i');

  test('the winner: paid ₹50, won ₹150, got back ₹150', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    await openSession(page, DIWALI);
    const row = page.getByTestId('tally').locator('[data-testid="tally-person"][data-name="Riya"]');
    await row.click();
    const detail = page.getByTestId('tally-person-detail');
    await expect(detail).toBeVisible();
    await expect(detail).toContainText(amount('paid', 50));
    await expect(detail).toContainText(amount('won', 150));
    await expect(detail).toContainText(amount('got back', 150));
  });

  test('money handed back: Asha won nothing, but got back her share of the prizes nobody won', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page, { players: FAMILY, session: { name: DIWALI } });
    await earlyFiveThenEnd(page, 'Riya');
    await openSession(page, DIWALI);
    const asha = (await tallyPeople(page)).find((p) => p.name === 'Asha')!;
    expect(asha.gotBack).toBeGreaterThan(0);
    await page.getByTestId('tally').locator('[data-testid="tally-person"][data-name="Asha"]').click();
    const detail = page.getByTestId('tally-person-detail');
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Asha');
    await expect(detail).toContainText(amount('paid', 50));
    await expect(detail).toContainText(amount('won', 0));
    await expect(detail).toContainText(amount('got back', asha.gotBack));
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
