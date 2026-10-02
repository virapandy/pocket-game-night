// TAM-214 (UX list row 12, owner approved 1 October 2026; docs/games/tambola/ux-review-2026-10-01-several-tickets.md,
// decisions 1 and 2): a phone may hold another player's ticket, shown under that player's name, with claims and payouts
// going to them; a phone holds at most 3 tickets of a game ("This phone already holds 3 tickets").
// Names and test ids: README.md, "UX list of 1 October 2026, rows 8 to 15".
import { expect, test, type Page } from './fixtures';
import { endGame, mainButton, payoutPeople } from './helpers';
import {
  addTicketByCode, appStarted, callUntil, claimResult, closePhones, countOn, fakeCamera, gridOf, markedOn, newPhone, numbersOf,
  phoneGame, phoneTicket, playerWith, PORTRAIT, scanClaim, scanTicket, shownTickets, showClaim, tapCell,
} from './phone';

test.afterEach(closePhones);

/** Riya 1–2, Grandma 3, Dad 4. */
const FAMILY = [{ name: 'Riya', tickets: 2 }, { name: 'Grandma' }, { name: 'Dad' }];
const FULL = /This phone already holds 3 tickets/;

/** The claim screen's line, "Top Line · Ticket 3 · Grandma". */
const claimLine = (p: Page) => p.getByTestId('claim-screen');

test.describe('TAM-214: holding another player\'s ticket', () => {
  test('scanned: Grandma\'s ticket 3 shows "Grandma · Ticket 3" on Riya\'s phone; the claim reads "Top Line · Ticket 3 · Grandma"; the host credits and pays Grandma', async ({ page, browser }, testInfo) => {
    test.setTimeout(150_000); // calling until 5 of a ticket's numbers are out can take 60 or more calls at about 1 second each (TAM-101)
    await fakeCamera(page, 'ok');
    const handOuts = await phoneGame(page, FAMILY);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const g = handOuts.find((h) => h.player === 'Grandma')!;
    await scanTicket(riya.page, g.payload);
    await expect(shownTickets(riya.page)).toHaveCount(3);

    const held = phoneTicket(riya.page, g.ticket);
    // The ticket's label read on its own (an element whose whole text is "Grandma · Ticket 3"), not run together with its numbers.
    await expect(held.getByText(new RegExp(`^\\s*Grandma\\s*·\\s*Ticket ${g.ticket}\\s*$`)).first()).toBeVisible();
    await expect(held, 'Grandma\'s ticket never shows Riya\'s name').not.toContainText('Riya');
    for (const t of riya.tickets) {
      await expect(phoneTicket(riya.page, t), `Riya's ticket ${t} still shows her name`).toContainText('Riya');
      await expect(phoneTicket(riya.page, t)).not.toContainText('Grandma');
    }

    await showClaim(riya.page, 'Top Line', g.ticket);
    await expect(claimLine(riya.page)).toContainText(new RegExp(`Top Line\\s*·\\s*Ticket ${g.ticket}\\s*·\\s*Grandma`, 'i'));
    await expect(claimLine(riya.page)).not.toContainText('Riya');
    await riya.page.getByRole('button', { name: 'Done', exact: true }).click();

    // The host's own record decides (TAM-174): Grandma is credited and paid.
    const grid = await gridOf(held);
    await callUntil(page, (c) => countOn(numbersOf(grid), c) >= 5);
    const claim = await showClaim(riya.page, 'Early Five', g.ticket);
    await scanClaim(page, claim);
    await expect(claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Grandma/)).toBeVisible({ timeout: 2000 });
    await mainButton(page).click(); // Close Early Five
    await endGame(page);
    await expect(page.getByTestId('payout-summary')).toBeVisible();
    const people = await payoutPeople(page);
    expect(people.find((p) => p.name === 'Grandma')?.won, 'Grandma\'s prize').toBeGreaterThan(0);
    expect(people.find((p) => p.name === 'Riya')?.won, 'Riya won nothing').toBe(0);
  });

  test('typed code: Grandma\'s ticket shows just "Ticket 3", never Riya\'s name, also on the claim screen', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, FAMILY);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const g = handOuts.find((h) => h.player === 'Grandma')!;
    await addTicketByCode(riya.page, g.code);
    await expect(shownTickets(riya.page)).toHaveCount(3);
    const held = phoneTicket(riya.page, g.ticket);
    await expect(held.getByText(`Ticket ${g.ticket}`, { exact: true }).first(), 'the label "Ticket 3", read on its own').toBeVisible();
    await expect(held, 'a typed ticket never shows the phone\'s other name').not.toContainText('Riya');
    await showClaim(riya.page, 'Top Line', g.ticket);
    await expect(claimLine(riya.page)).toContainText(new RegExp(`Top Line\\s*·\\s*Ticket ${g.ticket}(?!\\d)`, 'i'));
    await expect(claimLine(riya.page)).not.toContainText('Riya');
  });
});

test.describe('TAM-214: a phone holds at most 3 tickets', () => {
  /** Riya 1–3, Grandma 4, Dad 5. */
  const RIYA_FULL = [{ name: 'Riya', tickets: 3 }, { name: 'Grandma' }, { name: 'Dad' }];

  test('a 4th ticket, by QR or by typed code, is refused: "This phone already holds 3 tickets"; the 3 and their marks stay', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, RIYA_FULL);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const [t1] = riya.tickets as [number];
    const mark = numbersOf(riya.grids.get(t1)!)[0]!;
    await tapCell(riya.page, t1, mark);
    const g = handOuts.find((h) => h.player === 'Grandma')!;
    const d = handOuts.find((h) => h.player === 'Dad')!;

    await scanTicket(riya.page, g.payload);
    await expect(riya.page.getByRole('alert').filter({ hasText: FULL }), 'the refusal of a 4th ticket by QR').toBeVisible();
    await expect(shownTickets(riya.page)).toHaveCount(3);
    await expect(phoneTicket(riya.page, g.ticket)).toHaveCount(0);
    expect(await markedOn(phoneTicket(riya.page, t1))).toEqual([mark]);

    await riya.page.reload();
    await expect(shownTickets(riya.page)).toHaveCount(3);
    await addTicketByCode(riya.page, d.code);
    await expect(riya.page.getByRole('alert').filter({ hasText: FULL }), 'the refusal of a 4th ticket by typed code').toBeVisible();
    await riya.page.keyboard.press('Escape').catch(() => {});
    await riya.page.reload();
    await expect(shownTickets(riya.page)).toHaveCount(3);
    await expect(phoneTicket(riya.page, d.ticket)).toHaveCount(0);
    for (const t of riya.tickets) await expect(phoneTicket(riya.page, t)).toBeVisible();
    expect(await markedOn(phoneTicket(riya.page, t1))).toEqual([mark]);
  });

  test('edge: scanning one of the 3 again is not a 4th: nothing is refused and nothing changes', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, RIYA_FULL);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const [t1, t2] = riya.tickets as [number, number];
    const mark = numbersOf(riya.grids.get(t1)!)[0]!;
    await tapCell(riya.page, t1, mark);
    await riya.page.reload();
    await scanTicket(riya.page, handOuts.find((h) => h.ticket === t2)!.payload);
    await expect(shownTickets(riya.page)).toHaveCount(3);
    await riya.page.waitForTimeout(300);
    await expect(riya.page.getByText(FULL)).toHaveCount(0);
    expect(await markedOn(phoneTicket(riya.page, t1))).toEqual([mark]);
  });

  test('edge: with 3 tickets held, a ticket of a new game still replaces them (TAM-171); it is never refused', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, RIYA_FULL);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    await expect(shownTickets(riya.page)).toHaveCount(3);
    const host2 = await newPhone(browser, testInfo);
    const next = await phoneGame(host2, [{ name: 'Riya' }, { name: 'Asha' }]);
    const mine = next.find((h) => h.player === 'Riya')!;
    await appStarted(riya.page);
    await scanTicket(riya.page, mine.payload);
    await expect(shownTickets(riya.page)).toHaveCount(1);
    await expect(phoneTicket(riya.page, mine.ticket)).toBeVisible();
    await expect(riya.page.getByText(FULL)).toHaveCount(0);
  });
});
