// What happens to players' tickets after a game (UX list rows 20, 21 and 23, owner approved 3 October 2026;
// docs/games/tambola/ux-review-2026-10-03-after-the-game.md, docs/handover.md 2b; C3, tests first):
// - TAM-215 (row 20): the player's menu "Done with this game…" clears this phone's tickets after "Clear your tickets
//   from this phone?" ("Keep my tickets" main, "Clear tickets" outlined); held tickets are named and cleared too.
// - PLT-300 and TAM-171 (row 21): tickets more than 6 hours old open on Home with "Your tickets from 9:15 am /
//   yesterday, 9:15 pm / Sat 26 Sep · Open · Clear"; a typed-code ticket counts from when it was added.
// - TAM-179 and TAM-171 (row 23): a claim from an old game is looked up in the host's History ("That game has ended
//   (game 7K3P, 9:15 pm). This claim doesn't count." / "That game was discarded (game 7K3P). This claim doesn't
//   count."; unknown or deleted games as before); a new game's ticket says "Your tickets from game 7K3P were cleared."
// Names and test ids: README.md, "After the game: UX list rows 20, 21 and 23".
import { expect, test, type Page } from './fixtures';
import {
  call, endGame, expectOneMainButton, fromHome, fromMenu, hasMainLook, HOME, hostAGame, isOutlined, joinWithMyTicket, waitOutTapGuard,
  nextNumber, typeTicketCode,
} from './helpers';
import {
  claimRefused, claimResult, closePhones, currentHandOut, fakeCamera, handOutAll, markedOn, newPhone, phoneGame, phoneTicket,
  PORTRAIT, scanAll, scanClaim, scanTicket, setUpPhoneGame, showClaim, tapCell, gridOf, numbersOf, type HandOut,
} from './phone';

// Every phone here, host and players, reads times in India's time zone, so "9:15 pm" and "Sat 26 Sep" are the same on
// every computer that runs the tests.
const TZ = 'Asia/Kolkata';
test.use({ timezoneId: TZ, viewport: PORTRAIT });
test.afterEach(closePhones);

/** A moment in India's time: at('2026-10-03T09:15'). */
const at = (local: string) => new Date(`${local}:00+05:30`);
const HOUR = 3600_000;

/** A player's phone in India's time zone, its clock set to `time` (it then runs on from there). */
async function phoneAt(browser: Parameters<typeof newPhone>[0], testInfo: Parameters<typeof newPhone>[1], time: Date) {
  const p = await newPhone(browser, testInfo, PORTRAIT, { timezoneId: TZ });
  await p.clock.install({ time });
  await p.goto(HOME);
  await expect(p.getByRole('main').first()).toBeVisible();
  return p;
}

/** Opens the app again at a later time, as a player does the next morning. */
async function reopenAt(p: Page, time: Date) {
  await p.clock.setSystemTime(time);
  await p.goto(HOME);
  await expect(p.getByRole('main').first()).toBeVisible();
}

/** The row on Home for tickets more than 6 hours old (PLT-300, row 21). */
const savedTickets = (p: Page) => p.getByTestId('saved-tickets');
/** The confirmation of TAM-215: "Clear your tickets from this phone?". */
const clearQuestion = (p: Page) =>
  p.getByRole('dialog').or(p.getByRole('alertdialog')).filter({ hasText: 'Clear your tickets from this phone?' });
const keepButton = (p: Page) => clearQuestion(p).getByRole('button', { name: 'Keep my tickets', exact: true });
const clearButton = (p: Page) => clearQuestion(p).getByRole('button', { name: 'Clear tickets', exact: true });

/** The player's menu item "Done with this game…" (three dots or "..." at the end). */
const DONE = /^Done with this game(…|\.\.\.)?$/;
async function openPlayerMenu(p: Page) {
  await p.getByRole('button', { name: /Menu/ }).click();
  await expect(p.getByRole('menuitem', { name: DONE }).or(p.getByRole('button', { name: DONE })).first()).toBeVisible();
}
async function doneWithThisGame(p: Page) {
  const item = p.getByRole('menuitem', { name: DONE }).or(p.getByRole('button', { name: DONE })).first();
  if (!(await item.isVisible())) await openPlayerMenu(p);
  await p.getByRole('menuitem', { name: DONE }).or(p.getByRole('button', { name: DONE })).first().click();
  await expect(clearQuestion(p)).toBeVisible();
}

/** The game code on the host (TAM-170), as on the hand-out screen. */
async function hostGameCode(host: Page): Promise<string> {
  const code = ((await host.getByTestId('game-code').first().textContent()) ?? '').match(/\b([A-Z0-9]{4})\b/);
  if (!code) throw new Error('no game code on the host');
  return code[1]!;
}

/** Home with no tickets at all: the two choices, no ticket, no row of saved tickets, no "Your tickets". */
async function expectHomeWithoutTickets(p: Page, where: string) {
  await expect(hostAGame(p), `${where}: Home`).toBeVisible();
  await expect(joinWithMyTicket(p)).toBeVisible();
  await expect(p.getByTestId('phone-ticket'), `${where}: no ticket left on the phone`).toHaveCount(0);
  await expect(savedTickets(p), `${where}: no row of saved tickets`).toHaveCount(0);
  await expect(p.getByText(/Your tickets/), `${where}: nothing says "Your tickets"`).toHaveCount(0);
}

/** Sets up a phone game on the host, keeping the first hand-out's code, and hands every ticket out. */
async function phoneGameWithCode(host: Page, players: { name: string; tickets?: number }[]) {
  await setUpPhoneGame(host, players);
  const code = await hostGameCode(host);
  const first = await currentHandOut(host);
  const handOuts = await handOutAll(host);
  return { code, handOuts, first };
}

// ---------------------------------------------------------------- TAM-215 (row 20): "Done with this game…"

test.describe('TAM-215: "Done with this game…" clears this phone\'s tickets, after asking', () => {
  test('the last item of the player\'s menu; the question names the tickets and the game; "Keep my tickets" is the main button, "Clear tickets" outlined', async ({ page, browser }, testInfo) => {
    const { code, handOuts } = await phoneGameWithCode(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
    const riya = await newPhone(browser, testInfo, PORTRAIT);
    await riya.goto(HOME);
    await scanAll(riya, handOuts, 'Riya');
    await expect(phoneTicket(riya, 2)).toBeVisible();

    await openPlayerMenu(riya);
    // The last item of the menu.
    const items = riya.getByRole('menuitem').filter({ visible: true });
    const names: string[] = [];
    for (let i = 0; i < (await items.count()); i++) names.push(((await items.nth(i).textContent()) ?? '').replace(/\s+/g, ' ').trim());
    expect(names.length, `menu items: ${JSON.stringify(names)}`).toBeGreaterThan(1);
    expect(names[names.length - 1], `"Done with this game…" is the last item of ${JSON.stringify(names)}`).toMatch(/^Done with this game/);
    await riya.keyboard.press('Escape').catch(() => {});

    await doneWithThisGame(riya);
    const q = clearQuestion(riya);
    await expect(q).toContainText(new RegExp(`Tickets 1\\s*·\\s*2\\s*·\\s*Game ${code}`));
    await expect(q).toContainText('Your marks go too.');
    await expect(q).toContainText('Do this when the host says the game is over.');
    await expect(keepButton(riya)).toBeVisible();
    await expect(clearButton(riya)).toBeVisible();
    expect(await hasMainLook(keepButton(riya)), '"Keep my tickets" has the main look').toBe(true);
    expect(await isOutlined(clearButton(riya)), '"Clear tickets" is outlined, never the main look').toBe(true);
    await expectOneMainButton(riya, 'the "Clear your tickets" question', 'Keep my tickets', true);
  });

  test('"Keep my tickets" changes nothing; "Clear tickets" goes Home with no tickets, also after a reload; the next ticket opens as usual', async ({ page, browser }, testInfo) => {
    const { handOuts } = await phoneGameWithCode(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
    const riya = await newPhone(browser, testInfo, PORTRAIT);
    await riya.goto(HOME);
    await scanAll(riya, handOuts, 'Riya');
    const grid1 = numbersOf(await gridOf(phoneTicket(riya, 1).first()));
    const grid2 = numbersOf(await gridOf(phoneTicket(riya, 2).first()));
    await tapCell(riya, 1, grid1[0]!);
    await tapCell(riya, 2, grid2[3]!);

    // Keep: nothing changes.
    await doneWithThisGame(riya);
    await keepButton(riya).click();
    await expect(clearQuestion(riya)).toHaveCount(0);
    await expect(phoneTicket(riya, 1)).toBeVisible();
    await expect(phoneTicket(riya, 2)).toBeVisible();
    expect(await markedOn(phoneTicket(riya, 1))).toEqual([grid1[0]]);
    expect(await markedOn(phoneTicket(riya, 2))).toEqual([grid2[3]]);

    // Clear: Home, no tickets, for good.
    await doneWithThisGame(riya);
    await clearButton(riya).click();
    await expectHomeWithoutTickets(riya, 'after "Clear tickets"');
    await riya.reload();
    await expectHomeWithoutTickets(riya, 'after "Clear tickets" and a reload');
    await riya.goto(HOME);
    await expectHomeWithoutTickets(riya, 'after "Clear tickets", opening the app again');

    // The host's game goes on untouched (TAM-172), and the next ticket opens as usual.
    await expect(nextNumber(page)).toBeVisible();
    await page.goto(HOME);
    const next = await phoneGameWithCode(page, [{ name: 'Riya' }, { name: 'Dad' }]);
    await scanTicket(riya, next.handOuts.find((h) => h.player === 'Riya')!.payload);
    await expect(riya.getByTestId('phone-ticket')).toHaveCount(1);
    expect(await markedOn(riya.getByTestId('phone-ticket').first())).toEqual([]);
  });

  test('held tickets (TAM-214): the question names "Grandma\'s ticket 3", and "Clear tickets" clears it too', async ({ page, browser }, testInfo) => {
    const { code, handOuts } = await phoneGameWithCode(page, [{ name: 'Riya', tickets: 2 }, { name: 'Grandma' }, { name: 'Dad' }]);
    const riya = await newPhone(browser, testInfo, PORTRAIT);
    await riya.goto(HOME);
    await scanAll(riya, handOuts, 'Riya');
    await scanTicket(riya, handOuts.find((h) => h.player === 'Grandma')!.payload);
    await expect(riya.getByTestId('phone-ticket')).toHaveCount(3);

    await doneWithThisGame(riya);
    const q = clearQuestion(riya);
    await expect(q).toContainText(/Tickets 1\s*·\s*2\b/);
    await expect(q).toContainText(/Grandma['’]s ticket 3\b/);
    await expect(q).toContainText(new RegExp(`Game ${code}`));
    await clearButton(riya).click();
    await expectHomeWithoutTickets(riya, 'after clearing Riya\'s and Grandma\'s tickets');
    await riya.reload();
    await expectHomeWithoutTickets(riya, 'after clearing and a reload');
  });
});

// ---------------------------------------------------------------- PLT-300 and TAM-171 (row 21): old tickets open on Home

test.describe('PLT-300 and TAM-171: tickets more than 6 hours old open on Home, with "Your tickets from …", Open and Clear', () => {
  test('within 6 hours the tickets open as before; after 6 hours Home opens with "Your tickets from 9:15 am" below the two choices; Open shows every mark', async ({ page, browser }, testInfo) => {
    const start = at('2026-10-03T09:15');
    await page.clock.install({ time: start });
    const { handOuts } = await phoneGameWithCode(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
    const riya = await phoneAt(browser, testInfo, new Date(start.getTime() + 5 * 60_000));
    await scanAll(riya, handOuts, 'Riya');
    const grid = numbersOf(await gridOf(phoneTicket(riya, 1).first()));
    await tapCell(riya, 1, grid[2]!);

    // 5 hours 50 minutes after the game started: the tickets open, as before (TAM-171).
    await reopenAt(riya, new Date(start.getTime() + 5 * HOUR + 50 * 60_000));
    await expect(phoneTicket(riya, 1)).toBeVisible();
    await expect(savedTickets(riya)).toHaveCount(0);

    // 6 hours 10 minutes after: Home, with the row.
    await reopenAt(riya, new Date(start.getTime() + 6 * HOUR + 10 * 60_000));
    await expect(hostAGame(riya)).toBeVisible();
    await expect(joinWithMyTicket(riya)).toBeVisible();
    await expect(riya.getByTestId('phone-ticket'), 'the tickets do not open by themselves').toHaveCount(0);
    const row = savedTickets(riya);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Your tickets from 9:15 am');
    const top = (await row.boundingBox())!.y;
    for (const card of [hostAGame(riya), joinWithMyTicket(riya)]) {
      const b = (await card.boundingBox())!;
      expect(b.y + b.height, 'the row sits below the two choices').toBeLessThanOrEqual(top + 0.5);
    }
    const open = row.getByRole('button', { name: 'Open', exact: true });
    const clear = row.getByRole('button', { name: 'Clear', exact: true });
    await expect(open).toBeVisible();
    await expect(clear).toBeVisible();
    expect(await hasMainLook(open), '"Open" is quiet, never the main look').toBe(false);
    expect(await hasMainLook(clear), '"Clear" is quiet, never the main look').toBe(false);
    await expectOneMainButton(riya, 'Home with saved tickets', null);

    await open.click();
    await expect(phoneTicket(riya, 1)).toBeVisible();
    await expect(phoneTicket(riya, 2)).toBeVisible();
    expect(await markedOn(phoneTicket(riya, 1)), 'Open shows every mark').toEqual([grid[2]]);
  });

  for (const [what, startAt, reopen, label] of [
    ['the day before', '2026-10-02T21:15', '2026-10-03T10:00', 'Your tickets from yesterday, 9:15 pm'],
    ['earlier', '2026-09-26T19:30', '2026-10-03T10:00', 'Your tickets from Sat 26 Sep'],
  ] as const) {
    test(`a game from ${what}: "${label}"`, async ({ page, browser }, testInfo) => {
      const start = at(startAt);
      await page.clock.install({ time: start });
      const { handOuts } = await phoneGameWithCode(page, [{ name: 'Riya' }, { name: 'Asha' }]);
      const riya = await phoneAt(browser, testInfo, new Date(start.getTime() + 3 * 60_000));
      await scanAll(riya, handOuts, 'Riya');
      await reopenAt(riya, at(reopen));
      await expect(hostAGame(riya)).toBeVisible();
      await expect(riya.getByTestId('phone-ticket')).toHaveCount(0);
      await expect(savedTickets(riya)).toContainText(label);
    });
  }

  test('"Clear" asks as "Done with this game…" does: "Keep my tickets" keeps the row; "Clear tickets" clears them and the row goes', async ({ page, browser }, testInfo) => {
    const start = at('2026-10-02T21:15');
    await page.clock.install({ time: start });
    const { handOuts } = await phoneGameWithCode(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
    const riya = await phoneAt(browser, testInfo, new Date(start.getTime() + 3 * 60_000));
    await scanAll(riya, handOuts, 'Riya');
    await reopenAt(riya, at('2026-10-03T10:00'));
    const clear = savedTickets(riya).getByRole('button', { name: 'Clear', exact: true });
    await expect(clear).toBeVisible();
    await waitOutTapGuard(riya); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
    await clear.click();
    await expect(clearQuestion(riya)).toBeVisible();
    await expect(clearQuestion(riya)).toContainText(/Tickets 1\s*·\s*2\b/);
    expect(await hasMainLook(keepButton(riya)), '"Keep my tickets" has the main look').toBe(true);
    expect(await isOutlined(clearButton(riya)), '"Clear tickets" is outlined').toBe(true);
    await keepButton(riya).click();
    await expect(savedTickets(riya)).toContainText('Your tickets from yesterday, 9:15 pm');
    await clear.click();
    await clearButton(riya).click();
    await expectHomeWithoutTickets(riya, 'after "Clear" on Home');
    await riya.reload();
    await expectHomeWithoutTickets(riya, 'after "Clear" on Home and a reload');
  });

  test('a ticket added by typed code (no start time in the code) counts from when it was added to the phone', async ({ page, browser }, testInfo) => {
    const start = at('2026-10-03T09:15');
    await page.clock.install({ time: start });
    const { first } = await phoneGameWithCode(page, [{ name: 'Riya' }, { name: 'Asha' }]);
    // Typed on the phone at 11:40 am.
    const riya = await phoneAt(browser, testInfo, at('2026-10-03T11:40'));
    await typeTicketCode(riya, first.code);
    await expect(phoneTicket(riya, first.ticket)).toBeVisible();
    // 6 hours 15 minutes after the game started, but under 6 hours after it was added: it still opens.
    await reopenAt(riya, at('2026-10-03T15:30'));
    await expect(phoneTicket(riya, first.ticket)).toBeVisible();
    await expect(savedTickets(riya)).toHaveCount(0);
    // More than 6 hours after it was added: Home, with the time it was added.
    await reopenAt(riya, at('2026-10-03T17:50'));
    await expect(riya.getByTestId('phone-ticket')).toHaveCount(0);
    await expect(savedTickets(riya)).toContainText('Your tickets from 11:40 am');
  });
});

// ---------------------------------------------------------------- TAM-179 and TAM-171 (row 23): claims and tickets from an old game

/** Game A on the host: Riya (2 tickets) and Asha. Riya's phone holds her tickets and shows a Top Line claim QR for ticket 1. */
async function oldGameClaim(host: Page, browser: Parameters<typeof newPhone>[0], testInfo: Parameters<typeof newPhone>[1]) {
  const { code, handOuts } = await phoneGameWithCode(host, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
  const riya = await newPhone(browser, testInfo, PORTRAIT, { timezoneId: TZ });
  await riya.goto(HOME);
  await scanAll(riya, handOuts, 'Riya');
  // The game's start time as the tickets show it (TAM-170): "Riya · Ticket 1 · 2 · Game 7K3P · 9:15 pm".
  const header = (await riya.getByTestId('phone-ticket-header').first().textContent()) ?? '';
  const time = header.match(/\b(\d{1,2}:\d{2}\s*[ap]m)\b/i)?.[1];
  if (!time) throw new Error(`the ticket header "${header}" shows no start time`);
  const claim = await showClaim(riya, 'Top Line', 1);
  await riya.getByRole('button', { name: 'Done', exact: true }).click();
  return { code, time, claim, riya, handOuts };
}

/** A refusal shown calmly: never ✗ or "Bogey"; "Close" is its main button; nothing else is judged. */
async function expectCalmRefusal(host: Page, text: string | RegExp) {
  const refused = claimRefused(host);
  await expect(refused).toBeVisible({ timeout: 2000 });
  await expect(refused).toContainText(text);
  await expect(refused).not.toContainText('✗');
  await expect(refused).not.toContainText(/bogey/i);
  await expect(claimResult(host)).toHaveCount(0);
  const close = refused.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeVisible();
  expect(await hasMainLook(close), '"Close" is the main button of the refusal').toBe(true);
  return close;
}

/** Game B on the same host, after game A: Kabir and Dad, calling started. */
async function nextGame(host: Page) {
  await host.goto(HOME);
  await phoneGame(host, [{ name: 'Kabir' }, { name: 'Dad' }]);
  await call(host);
}

test.describe('TAM-179: a claim from an old game is looked up in History, and refused calmly', () => {
  test.beforeEach(async ({ page }) => {
    await fakeCamera(page, 'ok');
  });

  test('an ended game: "That game has ended (game 7K3P, 9:15 pm). This claim doesn\'t count."; nothing changes in this game', async ({ page, browser }, testInfo) => {
    const old = await oldGameClaim(page, browser, testInfo);
    await call(page);
    await endGame(page);
    await expect(page.getByTestId('payout-summary')).toBeVisible();
    await nextGame(page);
    await scanClaim(page, old.claim);
    const time = old.time.replace(/\s+/g, '\\s*');
    const close = await expectCalmRefusal(page, new RegExp(`That game has ended \\(game ${old.code}, ${time}\\)\\. This claim doesn['’]t count\\.`));
    await close.click();
    await expect(claimRefused(page)).toHaveCount(0);
    await expect(nextNumber(page)).toBeEnabled();
  });

  test('a discarded game: "That game was discarded (game 7K3P). This claim doesn\'t count."', async ({ page, browser }, testInfo) => {
    const old = await oldGameClaim(page, browser, testInfo);
    await call(page);
    await fromMenu(page, 'Discard game');
    await page.getByRole('dialog').getByRole('button', { name: /Discard/ }).click();
    await expect(page.getByText(/hand back/i).first()).toBeVisible();
    await nextGame(page);
    await scanClaim(page, old.claim);
    await expectCalmRefusal(page, new RegExp(`That game was discarded \\(game ${old.code}\\)\\. This claim doesn['’]t count\\.`));
  });

  test('a game deleted from History: "This claim is for another game (code 7K3P)", as before', async ({ page, browser }, testInfo) => {
    const old = await oldGameClaim(page, browser, testInfo);
    await call(page);
    await endGame(page);
    await expect(page.getByTestId('payout-summary')).toBeVisible();
    await page.goto(HOME);
    await fromHome(page, 'History');
    await page.getByRole('button', { name: 'Clear all history' }).click();
    // One past game: "Delete the past game from this phone?" with "Delete" (PLT-011, UX list row 19).
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await nextGame(page);
    await scanClaim(page, old.claim);
    await expectCalmRefusal(page, `This claim is for another game (code ${old.code})`);
    await expect(claimRefused(page)).not.toContainText(/That game (has ended|was discarded)/);
  });

  test('a game this phone never ran: "This claim is for another game (code 7K3P)", as before', async ({ page, browser }, testInfo) => {
    // Game A runs on a different host phone.
    const otherHost = await newPhone(browser, testInfo, PORTRAIT, { timezoneId: TZ });
    const old = await oldGameClaim(otherHost, browser, testInfo);
    await phoneGame(page, [{ name: 'Kabir' }, { name: 'Dad' }]);
    await call(page);
    await scanClaim(page, old.claim);
    await expectCalmRefusal(page, `This claim is for another game (code ${old.code})`);
    await expect(claimRefused(page)).not.toContainText(/That game (has ended|was discarded)/);
  });
});

test.describe('TAM-171: a new game\'s ticket replaces the old ones, with one quiet line', () => {
  test('scanning a ticket of a new game: the old tickets go, and the new ticket says "Your tickets from game 7K3P were cleared."', async ({ page, browser }, testInfo) => {
    const a = await phoneGameWithCode(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
    const riya = await newPhone(browser, testInfo, PORTRAIT);
    await riya.goto(HOME);
    await scanAll(riya, a.handOuts, 'Riya');
    await expect(riya.getByTestId('phone-ticket')).toHaveCount(2);
    await page.goto(HOME);
    const b = await phoneGameWithCode(page, [{ name: 'Dad' }, { name: 'Riya' }]);
    expect(b.code).not.toBe(a.code);
    const mine: HandOut = b.handOuts.find((h) => h.player === 'Riya')!;
    await scanTicket(riya, mine.payload);
    await expect(riya.getByTestId('phone-ticket')).toHaveCount(1);
    await expect(phoneTicket(riya, mine.ticket)).toBeVisible();
    await expect(riya.getByText(`Your tickets from game ${a.code} were cleared.`)).toBeVisible();
    await expect(riya.getByTestId('phone-ticket-header').first()).toContainText(`Game ${b.code}`);
  });

  test('adding a new game\'s ticket by typed code says the same', async ({ page, browser }, testInfo) => {
    const a = await phoneGameWithCode(page, [{ name: 'Riya' }, { name: 'Asha' }]);
    const riya = await newPhone(browser, testInfo, PORTRAIT);
    await riya.goto(HOME);
    await scanAll(riya, a.handOuts, 'Riya');
    await page.goto(HOME);
    const b = await phoneGameWithCode(page, [{ name: 'Riya' }, { name: 'Dad' }]);
    // The player's menu → "Add a ticket by code" (TAM-117, TAM-214).
    await riya.getByRole('button', { name: /Menu/ }).click();
    await riya.getByRole('menuitem', { name: 'Add a ticket by code' }).or(riya.getByRole('button', { name: 'Add a ticket by code' })).first().click();
    await riya.getByLabel('Ticket code', { exact: true }).fill(b.first.code);
    await riya.getByRole('button', { name: 'Open ticket', exact: true }).click();
    await expect(phoneTicket(riya, b.first.ticket)).toBeVisible();
    await expect(riya.getByTestId('phone-ticket')).toHaveCount(1);
    await expect(riya.getByText(`Your tickets from game ${a.code} were cleared.`)).toBeVisible();
  });
});
