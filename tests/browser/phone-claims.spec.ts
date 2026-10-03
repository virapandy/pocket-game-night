// Phase 2 (phone tickets): claims. The player shows a claim QR; the host scans it and gets the verdict, with no
// internet. The host's camera is replaced by the documented test hook `window.__pgnCamera` (phone.ts, fakeCamera;
// README.md "Phase 2: phone tickets"), so no real camera is needed.
// Scenarios: TAM-020, TAM-022, TAM-026, TAM-028, TAM-030, TAM-032, TAM-033, TAM-038, TAM-044, TAM-058, TAM-060,
// TAM-117, TAM-174, TAM-175, TAM-177, TAM-178, TAM-179, TAM-190, TAM-193, TAM-196.
import { expect, test, type Page } from './fixtures';
import { call, endGame, fromMenu, HOME, mainButton, nextNumber, payoutPeople, typeTicketCode } from './helpers';
import {
  callUntil, cellsWith, claimRefused, claimResult, closePhones, cornersOf, countOn, currentHandOut, enterTicketNumber,
  fakeCamera, gameCodeOf, gridOf, handOutAll, newPhone, numbersOf, openHostTickets, phoneGame, playerWith, PORTRAIT, readDrawnQr,
  phoneTicket, rowOf, scanClaim, scanClaimButton, setUpPhoneGame, showClaim, ticketChoice,
} from './phone';

test.afterEach(closePhones);

const THREE = [{ name: 'Riya' }, { name: 'Asha' }, { name: 'Dad' }];
const TWELVE = [{ name: 'Riya', tickets: 3 }, { name: 'Asha', tickets: 3 }, { name: 'Dad', tickets: 3 }, { name: 'Kabir', tickets: 3 }];

const hostTicket = (host: Page, n: number) => host.locator(`[data-testid="host-ticket"][data-ticket="${n}"]`);
/** Leaves a refusal or the scanner: Close, OK, Done or Cancel. */
async function dismissClaim(host: Page) {
  await host.getByRole('button', { name: /^(Close|OK|Done|Cancel)$/ }).first().click();
}

test.describe('The claim QR on the player\'s phone', () => {
  test('TAM-177 and TAM-193: "Show claim" → prize → the claim QR above the ticket, "EARLY FIVE · Ticket 1 · Riya", "Show this to the host"', { tag: '@smoke' }, async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    // Only this game's prizes are offered (TAM-031): no Four Corners with 3 tickets.
    await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
    for (const p of ['Early Five', 'Top Line', 'Full House']) await expect(riya.page.getByRole('button', { name: p, exact: true })).toBeVisible();
    await expect(riya.page.getByRole('button', { name: 'Four Corners', exact: true })).toHaveCount(0);
    await riya.page.getByRole('button', { name: 'Top Line', exact: true }).click();
    const screen = riya.page.getByTestId('claim-screen');
    await expect(screen).toBeVisible();
    await expect(screen).toContainText(/Top Line\s*·\s*Ticket 1\s*·\s*Riya/i);
    await expect(screen).toContainText(/Show this to the host/);
    const qr = screen.getByTestId('claim-qr');
    await expect(qr).toHaveAttribute('data-payload', /.+/);
    const ticket = screen.getByTestId('phone-ticket');
    await expect(ticket).toHaveAttribute('data-ticket', '1');
    const qrBox = (await qr.boundingBox())!, tBox = (await ticket.boundingBox())!;
    expect(qrBox.y + qrBox.height, 'the claim QR is above the ticket').toBeLessThanOrEqual(tBox.y + 1);
    // Top Line outlines the top row, and only it; never a verdict.
    expect(await cellsWith(ticket, 'data-outlined')).toEqual([...rowOf(riya.grids.get(1)!, 0)].sort((a, b) => a - b));
    await expect(riya.page.getByText(/accepted|bogey|you won|winner|correct|not called/i)).toHaveCount(0);
    await riya.page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(screen).toHaveCount(0);
  });

  test('TAM-177: the claim QR as drawn on screen reads back, with jsQR (the host\'s scanner library), exactly as its text', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const payload = await showClaim(riya.page, 'Top Line');
    expect(payload).not.toBe('');
    expect(await readDrawnQr(riya.page.getByTestId('claim-qr')), 'the claim QR does not read back as its text').toBe(payload);
  });

  test('TAM-190 and TAM-193: with several tickets the player picks the ticket; Four Corners outlines the corners, Full House all, Early Five nothing', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, TWELVE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const [t1, t2] = riya.tickets as [number, number];
    const screen = riya.page.getByTestId('claim-screen');
    const outlined = () => cellsWith(screen.getByTestId('phone-ticket'), 'data-outlined');
    const sorted = (a: number[]) => [...a].sort((x, y) => x - y);

    await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
    await expect(riya.page.getByText(/Which ticket\?/)).toBeVisible();
    await ticketChoice(riya.page, t2).click(); // its small picture may follow in the name (TAM-190, owner 2026-10-01)
    await riya.page.getByRole('button', { name: 'Four Corners', exact: true }).click();
    await expect(screen.getByTestId('phone-ticket')).toHaveCount(1);
    await expect(screen.getByTestId('phone-ticket')).toHaveAttribute('data-ticket', String(t2));
    expect(await outlined()).toEqual(sorted(cornersOf(riya.grids.get(t2)!)));
    const p1 = await screen.getByTestId('claim-qr').getAttribute('data-payload');
    await riya.page.getByRole('button', { name: 'Done', exact: true }).click();

    const full = await showClaim(riya.page, 'Full House', t1);
    await expect(screen.getByTestId('phone-ticket')).toHaveAttribute('data-ticket', String(t1));
    expect(await outlined()).toEqual(sorted(numbersOf(riya.grids.get(t1)!)));
    expect(full).not.toBe(p1);
    await riya.page.getByRole('button', { name: 'Done', exact: true }).click();

    await showClaim(riya.page, 'Early Five', t1);
    expect(await outlined()).toEqual([]);
  });
});

test.describe('The host scans the claim', () => {
  test.beforeEach(async ({ page }) => {
    await fakeCamera(page, 'ok');
  });

  test('TAM-177, TAM-174, TAM-020, TAM-033: a right claim is accepted within 2 seconds, with no internet: "Early Five: ✓ Accepted, ₹… to Riya", credited to Riya', { tag: '@smoke' }, async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000); // Calling until 5 of a ticket's numbers are out can take 60 or more calls at about 1 second each (TAM-101), as in calling.spec.ts.
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const mine = numbersOf(riya.grids.get(1)!);
    const called = await callUntil(page, (c) => countOn(mine, c) >= 5);
    const payload = await showClaim(riya.page, 'Early Five');
    await page.context().setOffline(true);
    await scanClaimButton(page).click();
    await expect.poll(() => page.evaluate(() => (window as any).__pgnCameraStarts), { message: 'the camera opens at once' }).toBe(1);
    await expect(page.getByTestId('claim-scanner')).toBeVisible();
    await page.evaluate((t) => (window as any).__pgnCameraState.onRead(t), payload);
    const verdict = claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Riya/);
    await expect(verdict).toBeVisible({ timeout: 2000 });
    const prize = Number((await verdict.textContent())!.match(/₹(\d+)/)![1]);
    // TAM-033: the ticket is shown with the called numbers highlighted, for the room.
    const shownCalled = await claimResult(page).locator('[data-called="true"]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-number'))));
    expect(shownCalled.length).toBeGreaterThanOrEqual(5);
    for (const n of shownCalled) expect(called).toContain(n);
    await page.context().setOffline(false);
    // Then as with paper: close the prize, end, and Riya is credited with no player picked.
    await expect(mainButton(page)).toHaveText(/Close Early Five/);
    await mainButton(page).click();
    await endGame(page);
    const people = await payoutPeople(page);
    expect(people.find((p: any) => p.name === 'Riya')!.won).toBe(prize);
  });

  test('TAM-177 and TAM-022/TAM-023: a claim with a number not called is a bogey: "Top Line: ✗ Bogey: 72 not called"', { tag: '@smoke' }, async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const top = rowOf(riya.grids.get(1)!, 0);
    const called = [await call(page)];
    const payload = await showClaim(riya.page, 'Top Line');
    await scanClaim(page, payload);
    const verdict = claimResult(page).getByText(/Top Line: ✗ Bogey: .*not called/);
    await expect(verdict).toBeVisible({ timeout: 2000 });
    const listed = ((await verdict.textContent())!.match(/Bogey: (.*) not called/)![1]!.match(/\d+/g) ?? []).map(Number);
    expect(listed.length).toBeGreaterThan(0);
    for (const n of listed) {
      expect(top).toContain(n);
      expect(called).not.toContain(n);
    }
  });

  test('TAM-038: a late claim is a bogey that says which number completed it: "Early Five was complete at 45"', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000); // Calling until 5 of a ticket's numbers are out can take 60 or more calls at about 1 second each (TAM-101), as in calling.spec.ts.
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const mine = numbersOf(riya.grids.get(1)!);
    const called = await callUntil(page, (c) => countOn(mine, c) >= 5);
    const at = called[called.length - 1]!;
    // The next number is called before the claim (the claim would still be on time before this call).
    await call(page);
    await scanClaim(page, await showClaim(riya.page, 'Early Five'));
    await expect(claimResult(page)).toContainText('✗ Bogey', { timeout: 2000 });
    await expect(claimResult(page)).toContainText(`Early Five was complete at ${at}`);
  });

  test('TAM-179 and TAM-196: a prize already won is refused calmly, "Early Five already won", and is not a bogey', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000); // Calling until 5 of a ticket's numbers are out can take 60 or more calls at about 1 second each (TAM-101), as in calling.spec.ts.
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const asha = await playerWith(browser, testInfo, handOuts, 'Asha', PORTRAIT);
    const mine = numbersOf(riya.grids.get(1)!);
    await callUntil(page, (c) => countOn(mine, c) >= 5);
    await scanClaim(page, await showClaim(riya.page, 'Early Five'));
    await expect(claimResult(page).getByText(/Early Five: ✓ Accepted/)).toBeVisible({ timeout: 2000 });
    await mainButton(page).click(); // Close Early Five
    await expect(nextNumber(page)).toBeVisible();
    await scanClaim(page, await showClaim(asha.page, 'Early Five'));
    await expect(claimRefused(page)).toContainText('Early Five already won', { timeout: 2000 });
    await expect(page.getByText(/Bogey/)).toHaveCount(0);
    await dismissClaim(page);
    await expect(nextNumber(page)).toBeVisible();
  });

  test('TAM-179 and TAM-044: a ticket that is out after a bogey is refused "Ticket 2 is out", not another bogey', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE);
    const asha = await playerWith(browser, testInfo, handOuts, 'Asha', PORTRAIT);
    await call(page);
    await scanClaim(page, await showClaim(asha.page, 'Full House'));
    await expect(claimResult(page)).toContainText('✗ Bogey', { timeout: 2000 });
    await call(page);
    await asha.page.getByRole('button', { name: 'Done', exact: true }).click();
    await scanClaim(page, await showClaim(asha.page, 'Early Five'));
    await expect(claimRefused(page)).toContainText('Ticket 2 is out', { timeout: 2000 });
    await dismissClaim(page);
    await endGame(page);
    // Only the one bogey is in the summary.
    await expect(page.getByTestId('payout-summary').getByText(/Bogey/)).toHaveCount(1);
  });

  test('TAM-179: a claim from another game is refused with its code, "This claim is for another game (code 7K3P)"; nothing changes', async ({ page, browser }, testInfo) => {
    await phoneGame(page, THREE);
    await call(page);
    const host2 = await newPhone(browser, testInfo);
    await setUpPhoneGame(host2, THREE);
    const code2 = await gameCodeOf(host2);
    const other = await handOutAll(host2);
    const riya2 = await playerWith(browser, testInfo, other, 'Riya', PORTRAIT);
    await scanClaim(page, await showClaim(riya2.page, 'Top Line'));
    await expect(claimRefused(page)).toContainText(`This claim is for another game (code ${code2})`, { timeout: 2000 });
    await expect(claimResult(page)).toHaveCount(0);
    await dismissClaim(page);
    await expect(mainButton(page)).toHaveText(/Next number/);
  });

  test('TAM-117, TAM-177 and TAM-031: a ticket opened by typed code offers every usual prize; the host refuses one this game doesn\'t have, calmly, not as a bogey', async ({ page, browser }, testInfo) => {
    // Owner decision 2026-09-30. With 3 tickets this game has no Four Corners (as above).
    await setUpPhoneGame(page, THREE);
    const h = await currentHandOut(page);
    await handOutAll(page);
    const typed = await newPhone(browser, testInfo, PORTRAIT);
    await typed.goto(HOME);
    await typeTicketCode(typed, h.code);
    await expect(phoneTicket(typed, h.ticket)).toBeVisible();
    await typed.getByRole('button', { name: 'Show claim', exact: true }).click();
    for (const p of ['Early Five', 'Top Line', 'Middle Line', 'Bottom Line', 'Four Corners', 'Full House']) {
      await expect(typed.getByRole('button', { name: p, exact: true }), `a typed-code ticket should offer ${p}`).toBeVisible();
    }
    await typed.getByRole('button', { name: 'Four Corners', exact: true }).click();
    const qr = typed.getByTestId('claim-qr');
    await expect(qr).toBeVisible();
    const payload = (await qr.getAttribute('data-payload')) ?? '';
    await call(page);
    await scanClaim(page, payload);
    await expect(claimRefused(page)).toBeVisible({ timeout: 2000 });
    expect(((await claimRefused(page).textContent()) ?? '').trim().length, 'the refusal gives a plain reason').toBeGreaterThan(0);
    await expect(claimResult(page)).toHaveCount(0);
    await expect(page.getByText(/Bogey/)).toHaveCount(0);
    await dismissClaim(page);
    await expect(mainButton(page)).toHaveText(/Next number/);
    // The ticket still plays: a real prize from the same typed-code phone is judged as usual.
    await typed.getByRole('button', { name: 'Done', exact: true }).click();
    await scanClaim(page, await showClaim(typed, 'Full House'));
    await expect(claimResult(page)).toContainText('✗ Bogey', { timeout: 2000 });
  });

  test('TAM-179: something that is not a claim QR is refused with a plain reason, and nothing changes', async ({ page }) => {
    await phoneGame(page, THREE);
    await call(page);
    await scanClaim(page, 'hello, this is not a claim');
    await expect(claimRefused(page)).toBeVisible({ timeout: 2000 });
    expect(((await claimRefused(page).textContent()) ?? '').trim().length).toBeGreaterThan(0);
    await expect(page.getByText(/Bogey/)).toHaveCount(0);
    await dismissClaim(page);
    await expect(mainButton(page)).toHaveText(/Next number/);
  });
});

test.describe('When scanning fails, typing the ticket number takes over', () => {
  for (const mode of ['denied', 'no-camera'] as const) {
    test(`TAM-178: camera ${mode === 'denied' ? 'permission refused' : 'missing'}: "Enter the ticket number instead" at once, and the verdict names the owner (TAM-174)`, async ({ page, browser }, testInfo) => {
      test.setTimeout(90_000); // Calling until 5 of a ticket's numbers are out can take 60 or more calls at about 1 second each (TAM-101), as in calling.spec.ts.
      await fakeCamera(page, mode);
      const handOuts = await phoneGame(page, THREE);
      const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
      const mine = numbersOf(riya.grids.get(1)!);
      await callUntil(page, (c) => countOn(mine, c) >= 5);
      await scanClaimButton(page).click();
      await expect(page.getByText('Enter the ticket number instead')).toBeVisible({ timeout: 1000 });
      await enterTicketNumber(page, 1, 'Early Five');
      await expect(claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Riya/)).toBeVisible({ timeout: 2000 });
    });
  }

  test('TAM-178 and TAM-036: with no read for 10 seconds the ticket number takes over; waiting never makes the claim late', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000); // Calling until 5 of a ticket's numbers are out can take 60 or more calls at about 1 second each (TAM-101), as in calling.spec.ts.
    await page.clock.install();
    await fakeCamera(page, 'ok');
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const mine = numbersOf(riya.grids.get(1)!);
    await callUntil(page, (c) => countOn(mine, c) >= 5);
    await scanClaimButton(page).click();
    await expect(page.getByTestId('claim-scanner')).toBeVisible();
    // "Enter ticket number" is always one tap away.
    await expect(page.getByRole('button', { name: 'Enter ticket number', exact: true })).toBeVisible();
    await page.clock.fastForward(9_000);
    await expect(page.getByLabel('Ticket number', { exact: true })).toBeHidden();
    await page.clock.fastForward(1_500);
    await expect(page.getByText('Enter the ticket number instead')).toBeVisible();
    await page.clock.fastForward(20_000);
    await enterTicketNumber(page, 1, 'Early Five');
    await expect(claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Riya/)).toBeVisible();
  });

  test('TAM-032: typing ticket 14 in a game of tickets 1 to 3: "No ticket 14 in this game", and nothing changes', async ({ page }) => {
    await fakeCamera(page, 'no-camera');
    await phoneGame(page, THREE);
    await call(page);
    await enterTicketNumber(page, 14, 'Top Line');
    await expect(page.getByText('No ticket 14 in this game')).toBeVisible();
    await expect(claimResult(page)).toHaveCount(0);
  });
});

test.describe('The host\'s list of tickets', () => {
  test.beforeEach(async ({ page }) => {
    await fakeCamera(page, 'no-camera');
  });

  test('TAM-175: the host corrects who holds ticket 1; its prize then goes to Arjun', async ({ page }) => {
    test.setTimeout(90_000); // Calling until 5 of a ticket's numbers are out can take 60 or more calls at about 1 second each (TAM-101), as in calling.spec.ts.
    await phoneGame(page, [{ name: 'Riya' }, { name: 'Arjun' }, { name: 'Dad' }]);
    await openHostTickets(page);
    const one = hostTicket(page, 1);
    await expect(one).toContainText('Riya');
    const grid = await gridOf(one);
    await one.getByRole('button', { name: /^Change owner/ }).click();
    await page.getByRole('button', { name: 'Arjun', exact: true }).click();
    await expect(hostTicket(page, 1)).toContainText('Arjun');
    await page.getByRole('button', { name: /^(Close|Done|Back)$/ }).first().click();
    await callUntil(page, (c) => countOn(numbersOf(grid), c) >= 5);
    await enterTicketNumber(page, 1, 'Early Five');
    await expect(claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Arjun/)).toBeVisible();
  });

  test('TAM-058: a player can switch from phone to paper mid-game; their ticket number is then refused and the anchor records their wins', async ({ page }) => {
    await phoneGame(page, THREE);
    await call(page);
    await openHostTickets(page);
    await hostTicket(page, 3).getByRole('button', { name: /^Switch to paper/ }).click();
    await expect(hostTicket(page, 3)).toContainText(/paper/i);
    await page.getByRole('button', { name: /^(Close|Done|Back)$/ }).first().click();
    await enterTicketNumber(page, 3, 'Early Five');
    await expect(page.getByText(/paper/i).first()).toBeVisible();
    await expect(claimResult(page)).toHaveCount(0);
    await dismissClaim(page);
    await page.getByRole('button', { name: 'Record a win' }).click();
    await page.getByRole('button', { name: 'Early Five', exact: true }).click();
    await page.getByRole('button', { name: 'Dad', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(claimResult(page).getByText(/Early Five: ✓ Dad/)).toBeVisible();
  });

  test('TAM-056: only the host has the list: it is in the host\'s menu, and holds every ticket handed out', async ({ page }) => {
    await phoneGame(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }, { name: 'Dad', tickets: 3 }]);
    await fromMenu(page, 'Tickets');
    await expect(page.getByTestId('host-ticket')).toHaveCount(6);
    for (const n of [1, 2, 3, 4, 5, 6]) expect(numbersOf(await gridOf(hostTicket(page, n)))).toHaveLength(15);
  });
});
