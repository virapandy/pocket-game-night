// UX list rows of 3 October 2026, lanes A to C (docs/handover.md 2b, docs/change-sop.md; the rows are the owner's
// approval, 2026-10-03). C2 screen behaviour written alongside the build: row 4 (PLT-302, screen readers hear calls and
// verdicts), row 7 (TAM-132, the question before calling starts with a ticket waiting), row 22 (TAM-140 and PLT-005,
// the "Game over" banner), row 24 (TAM-174, the proof line under each verdict). Row 9 (PLT-016, PLT-029) is in
// sessions.spec.ts and session-line.spec.ts. Also the two C1 rules a screenshot can't show: row 2 (TAM-122, tickets fit
// the width down to 320 px, no sideways sliding) and row 25 (TAM-107, TAM-172, the game code everywhere is this game's).
// Names and test ids: README.md, "UX list rows of 3 October 2026".
import { expect, test, type Locator, type Page } from './fixtures';
import {
  call, callMany, currentNumber, currentRhyme, endGame, fromMenu, hasMainLook, nextNumber, recordWin, setUpPaperGame,
} from './helpers';
import {
  allTickets, callUntil, cellBoxes, claimResult, closePhones, countOn, currentHandOut, enterTicketNumber, fakeCamera,
  gameCodeOf, handOutScreen, notHandedOutQuestion, numbersOf, oneAtATime, openHostTickets, phoneGame,
  playerWith, PORTRAIT, scanClaim, scanClaimButton, setUpPhoneGame, shownTickets, showClaim, textOutsideButtons,
} from './phone';

test.afterEach(closePhones);

const THREE = [{ name: 'Riya' }, { name: 'Asha' }, { name: 'Dad' }];
const TWELVE = [{ name: 'Riya', tickets: 3 }, { name: 'Asha', tickets: 3 }, { name: 'Dad', tickets: 3 }, { name: 'Kabir', tickets: 3 }];
const announcer = (page: Page) => page.getByTestId('announcer');
const proof = (page: Page) => claimResult(page).getByTestId('claim-proof');
const gameOver = (page: Page) => page.getByTestId('game-over');
const hostTicket = (host: Page, n: number) => host.locator(`[data-testid="host-ticket"][data-ticket="${n}"]`);

/** Seen by no one: clipped to nothing, or at most 1 × 1 px with its overflow hidden (a screen-reader-only region). */
async function visuallyHidden(l: Locator) {
  return l.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return s.clip === 'rect(0px, 0px, 0px, 0px)' || (r.width <= 1 && r.height <= 1 && s.overflow === 'hidden');
  });
}

/** Hands out every ticket but the last, so the last one is on the hand-out screen with "Start calling". */
async function upToTheLastTicket(page: Page) {
  for (let i = 0; i < 60; i++) {
    const next = page.getByRole('button', { name: 'Next ticket', exact: true });
    if (!(await next.isVisible())) return;
    await next.click();
  }
  throw new Error('the hand-out never reached its last ticket');
}

// ---------------------------------------------------------------- Row 4: PLT-302, screen readers hear what the room hears

test.describe('PLT-302 (UX list row 4): screen readers hear the call, its rhyme and every verdict', () => {
  test('a call: a polite live region says "25. Christmas Day" (the number and its rhyme); "Another rhyme" says the new one; nobody sees the region', async ({ page }) => {
    await setUpPaperGame(page);
    const n = await call(page);
    const region = announcer(page);
    await expect(region).toHaveCount(1);
    expect(await region.getAttribute('aria-live') ?? (await region.getAttribute('role') === 'status' ? 'polite' : null), 'a polite live region').toBe('polite');
    const rhyme = ((await currentRhyme(page).textContent()) ?? '').trim();
    expect(rhyme.length).toBeGreaterThan(0);
    await expect(region).toHaveText(`${n}. ${rhyme}`);
    // Never seen: it takes no space and covers nothing (TAM-123).
    expect(await visuallyHidden(region), 'the live region is screen-reader only').toBe(true);

    await page.getByRole('button', { name: 'Another rhyme' }).click();
    await expect(currentRhyme(page)).not.toHaveText(rhyme);
    const again = ((await currentRhyme(page).textContent()) ?? '').trim();
    await expect(region).toHaveText(`${n}. ${again}`);
    await expect(currentNumber(page)).toHaveText(String(n));
  });

  test('a recorded win (paper): it says the verdict, "Top Line: ✓ Riya"', async ({ page }) => {
    await setUpPaperGame(page);
    await callMany(page, 3);
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(claimResult(page)).toBeVisible();
    await expect(announcer(page)).toContainText(/Top Line: ✓ Riya/);
  });

  test('a scanned claim: it says the verdict\'s first line, "Early Five: ✓ Accepted, ₹… to Riya", and a bogey "✗ Bogey"; never the proof line', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000); // calling until 5 of a ticket's numbers are out can take 60 calls (as in phone-claims.spec.ts)
    await fakeCamera(page, 'ok');
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    // A bogey first: Top Line after one call.
    await call(page);
    await scanClaim(page, await showClaim(riya.page, 'Top Line'));
    await expect(claimResult(page).getByText(/Top Line: ✗ Bogey/)).toBeVisible({ timeout: 2000 });
    await expect(announcer(page)).toContainText(/Top Line: ✗ Bogey/);
    await expect(announcer(page)).not.toContainText(/your copy/);
  });

  test('an accepted scanned claim is announced, without its proof line', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000);
    await fakeCamera(page, 'ok');
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const mine = numbersOf(riya.grids.get(1)!);
    await callUntil(page, (c) => countOn(mine, c) >= 5);
    await scanClaim(page, await showClaim(riya.page, 'Early Five'));
    await expect(claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Riya/)).toBeVisible({ timeout: 2000 });
    await expect(announcer(page)).toContainText(/Early Five: ✓ Accepted, ₹\d+ to Riya/);
    await expect(announcer(page)).not.toContainText(/your copy/);
  });
});

// ---------------------------------------------------------------- Row 7: TAM-132, "Start calling" while a ticket waits
// Wording from N5 of the 1.1.0 release review (decided, 2026-10-03): the host can't know whether the player scanned,
// so the question asks "Has Dad got their ticket?" and "Yes, start calling" is its main button.

test.describe('TAM-132 (UX list row 7, N5): "Start calling" while a ticket waits asks first', () => {
  test('the question "Has Dad got their ticket?" names the ticket ("Ticket 3 is the last one to hand out."), with "Yes, start calling" as the main button, "Not yet, hand it out" and "Give a paper ticket"; no "Start anyway"; nothing is called yet', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    await upToTheLastTicket(page);
    await expect(handOutScreen(page).getByTestId('hand-out-ticket')).toHaveText(/Ticket 3\s*→\s*Dad/);
    await page.getByRole('button', { name: 'Start calling', exact: true }).click();
    const q = notHandedOutQuestion(page);
    await expect(q).toBeVisible();
    await expect(q).toContainText('Has Dad got their ticket?');
    await expect(q).toContainText('Ticket 3 is the last one to hand out.');
    for (const name of ['Yes, start calling', 'Not yet, hand it out', 'Give a paper ticket']) {
      await expect(q.getByRole('button', { name, exact: true })).toBeVisible();
    }
    await expect(q.getByRole('button', { name: 'Start anyway', exact: true }), '"Start anyway" is gone').toHaveCount(0);
    expect(await hasMainLook(q.getByRole('button', { name: 'Yes, start calling', exact: true })), '"Yes, start calling" is the main button').toBe(true);
    for (const name of ['Not yet, hand it out', 'Give a paper ticket']) {
      expect(await hasMainLook(q.getByRole('button', { name, exact: true })), `"${name}" is not the main look`).toBe(false);
    }
    await expect(nextNumber(page).filter({ visible: true })).toHaveCount(0);
  });

  test('"Not yet, hand it out" goes back to that ticket and its QR; calling has not started', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    await upToTheLastTicket(page);
    const before = await currentHandOut(page);
    await page.getByRole('button', { name: 'Start calling', exact: true }).click();
    await notHandedOutQuestion(page).getByRole('button', { name: 'Not yet, hand it out', exact: true }).click();
    await expect(notHandedOutQuestion(page)).toHaveCount(0);
    await expect(handOutScreen(page)).toBeVisible();
    await expect(page.getByTestId('ticket-qr')).toBeVisible();
    const after = await currentHandOut(page);
    expect(after.ticket).toBe(before.ticket);
    expect(after.player).toBe('Dad');
    expect(after.payload).toBe(before.payload);
    await expect(nextNumber(page).filter({ visible: true })).toHaveCount(0);
  });

  test('asked once: after "Not yet, hand it out", the next "Start calling" starts calling with no question, and the ticket stays Dad\'s phone ticket', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    await upToTheLastTicket(page);
    const dads = await currentHandOut(page);
    const start = page.getByRole('button', { name: 'Start calling', exact: true });
    await start.click();
    await notHandedOutQuestion(page).getByRole('button', { name: 'Not yet, hand it out', exact: true }).click();
    await expect(notHandedOutQuestion(page)).toHaveCount(0);
    await start.click();
    await expect(nextNumber(page)).toBeVisible();
    await expect(notHandedOutQuestion(page)).toHaveCount(0);
    await expect(page.getByText(/Dad plays on paper/)).toHaveCount(0);
    await openHostTickets(page);
    await expect(hostTicket(page, dads.ticket)).toContainText('Dad');
    await expect(hostTicket(page, dads.ticket).getByRole('button', { name: /^Switch to paper/ }), 'still a phone ticket').toBeVisible();
  });

  test('asked again after the ticket changes owner: "Not yet, hand it out", give it to Asha, "Start calling" asks "Has Asha got their ticket?"', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    await upToTheLastTicket(page);
    const start = page.getByRole('button', { name: 'Start calling', exact: true });
    await start.click();
    await notHandedOutQuestion(page).getByRole('button', { name: 'Not yet, hand it out', exact: true }).click();
    // The name on the hand-out screen is a button that lists the other players (TAM-175).
    await handOutScreen(page).getByTestId('hand-out-ticket').getByRole('button').first().click();
    await handOutScreen(page).getByRole('button', { name: 'Asha', exact: true }).click();
    await expect(handOutScreen(page).getByTestId('hand-out-ticket')).toHaveText(/Ticket 3\s*→\s*Asha/);
    await start.click();
    const q = notHandedOutQuestion(page);
    await expect(q).toBeVisible();
    await expect(q).toContainText('Has Asha got their ticket?');
    await expect(q).toContainText(/Ticket 3/);
    await expect(nextNumber(page).filter({ visible: true })).toHaveCount(0);
    // And it is asked once for Asha too.
    await q.getByRole('button', { name: 'Not yet, hand it out', exact: true }).click();
    await start.click();
    await expect(nextNumber(page)).toBeVisible();
    await openHostTickets(page);
    await expect(hostTicket(page, 3)).toContainText('Asha');
  });

  test('"Give a paper ticket": Dad plays on paper ("Dad plays on paper · Undo") and calling starts', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    await upToTheLastTicket(page);
    await page.getByRole('button', { name: 'Start calling', exact: true }).click();
    await notHandedOutQuestion(page).getByRole('button', { name: 'Give a paper ticket', exact: true }).click();
    await expect(nextNumber(page)).toBeVisible();
    await expect(page.getByText(/Dad plays on paper/).first()).toBeVisible();
    await openHostTickets(page);
    // The ticket itself says "paper", not just its "Switch to paper" button, which is gone.
    await expect.poll(() => textOutsideButtons(hostTicket(page, 3)), { message: 'ticket 3 says "paper"' }).toMatch(/paper/i);
    await expect(hostTicket(page, 3).getByRole('button', { name: /^Switch to paper/ }), 'already on paper').toHaveCount(0);
  });

  test('"Yes, start calling": calling starts, and the ticket stays in the game as Dad\'s: his claim by number is judged as usual', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000);
    await fakeCamera(page, 'denied');
    await setUpPhoneGame(page, THREE);
    await upToTheLastTicket(page);
    const dadsTicket = await currentHandOut(page);
    await page.getByRole('button', { name: 'Start calling', exact: true }).click();
    await notHandedOutQuestion(page).getByRole('button', { name: 'Yes, start calling', exact: true }).click();
    await expect(nextNumber(page)).toBeVisible();
    await openHostTickets(page);
    await expect(hostTicket(page, dadsTicket.ticket)).toContainText('Dad');
    // Still a phone ticket: it can still be switched to paper.
    await expect(hostTicket(page, dadsTicket.ticket).getByRole('button', { name: /^Switch to paper/ })).toBeVisible();
    await page.getByRole('button', { name: /^(Close|Done|Back)$/ }).first().click();
    // Dad scanned it (the host phone can't know he did).
    const d = await playerWith(browser, testInfo, [dadsTicket], 'Dad', PORTRAIT);
    const mine = numbersOf(d.grids.get(dadsTicket.ticket)!);
    await callUntil(page, (c) => countOn(mine, c) >= 5);
    await enterTicketNumber(page, dadsTicket.ticket, 'Early Five');
    await expect(claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Dad/)).toBeVisible({ timeout: 2000 });
  });
});

// ---------------------------------------------------------------- Row 22: TAM-140 and PLT-005, the "Game over" banner

test.describe('TAM-140 and PLT-005 (UX list row 22): the host\'s summary starts with a "Game over" banner', () => {
  test('after End, phone tickets: "✓ Game over · Players: phones away. Tap Done with this game." at the top, payouts visible below; it stays, nothing timed', async ({ page }) => {
    await phoneGame(page, THREE);
    await callMany(page, 3);
    await endGame(page);
    const banner = gameOver(page);
    await expect(banner).toBeVisible();
    await expect(banner).toHaveText(/✓\s*Game over\s*·\s*Players: phones away\.\s*Tap Done with this game\./);
    await expect(banner).not.toContainText(/Discarded/);
    const summary = page.getByTestId('payout-summary');
    await expect(summary).toBeVisible();
    const b = (await banner.boundingBox())!;
    const s = (await summary.boundingBox())!;
    expect(b.y + b.height, 'the banner is above the payouts').toBeLessThanOrEqual(s.y + 1);
    expect(b.y, 'the banner is at the top, on the screen as it first appears').toBeLessThan(page.viewportSize()!.height / 3);
    await expect(summary).toContainText('Riya');
    // Nothing timed takes it away.
    await page.waitForTimeout(6_000);
    await expect(banner).toBeVisible();
  });

  test('after End, paper tickets: "✓ Game over" at the top, with no line about phones (nobody has one), payouts below', async ({ page }) => {
    await setUpPaperGame(page, { players: ['Riya', 'Asha', 'Dad'] });
    await callMany(page, 3);
    await recordWin(page, 'Top Line', ['Riya']);
    await page.getByRole('button', { name: /^Close Top Line/ }).first().click();
    await endGame(page);
    const banner = gameOver(page);
    await expect(banner).toHaveText(/^\s*✓\s*Game over\s*$/);
    const b = (await banner.boundingBox())!;
    const s = (await page.getByTestId('payout-summary').boundingBox())!;
    expect(b.y + b.height, 'the banner is above the payouts').toBeLessThanOrEqual(s.y + 1);
  });

  test('after Discard: "Game over · Discarded · Nobody wins. Everyone gets their contribution back.", with what each person gets back still shown', async ({ page }) => {
    await setUpPaperGame(page, { players: ['Riya', 'Asha', 'Dad'] });
    await callMany(page, 2);
    await fromMenu(page, 'Discard game');
    await page.getByRole('dialog').getByRole('button', { name: /Discard/ }).click();
    const banner = gameOver(page);
    await expect(banner).toBeVisible();
    await expect(banner).toHaveText(/Game over\s*·\s*Discarded\s*·\s*Nobody wins\.\s*Everyone gets their contribution back\./);
    await expect(banner).not.toContainText(/phones away/);
    await expect(page.getByText(/hand back/i).first()).toBeVisible();
    const b = (await banner.boundingBox())!;
    const back = (await page.getByText(/hand back/i).first().boundingBox())!;
    expect(b.y + b.height, 'the banner is above what is handed back').toBeLessThanOrEqual(back.y + 1);
  });
});

// ---------------------------------------------------------------- Row 24: TAM-174, the proof line under each verdict

test.describe('TAM-174 (UX list row 24): every verdict shows its proof on a second, smaller line', () => {
  test('a scanned claim, accepted: "Ticket 1 · game 7K3P · same numbers as your copy"', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000);
    await fakeCamera(page, 'ok');
    const handOuts = await phoneGame(page, THREE);
    const code = await gameCodeOf(page);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const mine = numbersOf(riya.grids.get(1)!);
    await callUntil(page, (c) => countOn(mine, c) >= 5);
    await scanClaim(page, await showClaim(riya.page, 'Early Five'));
    const verdict = claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Riya/);
    await expect(verdict).toBeVisible({ timeout: 2000 });
    await expect(proof(page)).toHaveText(new RegExp(`^\\s*Ticket 1\\s*·\\s*game ${code}\\s*·\\s*same numbers as your copy\\s*$`));
    // A second line, under the verdict, and smaller.
    const v = (await verdict.boundingBox())!;
    const p = (await proof(page).boundingBox())!;
    expect(p.y, 'the proof is under the verdict').toBeGreaterThanOrEqual(v.y + v.height - 1);
    const size = (l: Locator) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(await size(proof(page)), 'the proof line is smaller than the verdict').toBeLessThan(await size(verdict));
  });

  test('a scanned claim, bogey: the same proof line', async ({ page, browser }, testInfo) => {
    await fakeCamera(page, 'ok');
    const handOuts = await phoneGame(page, THREE);
    const code = await gameCodeOf(page);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    await call(page);
    await scanClaim(page, await showClaim(riya.page, 'Top Line'));
    await expect(claimResult(page).getByText(/Top Line: ✗ Bogey/)).toBeVisible({ timeout: 2000 });
    await expect(proof(page)).toHaveText(new RegExp(`^\\s*Ticket 1\\s*·\\s*game ${code}\\s*·\\s*same numbers as your copy\\s*$`));
  });

  test('checked by ticket number (no QR compared): "Ticket 1 · game 7K3P · checked from your copy"', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000);
    await fakeCamera(page, 'denied');
    const handOuts = await phoneGame(page, THREE);
    const code = await gameCodeOf(page);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const mine = numbersOf(riya.grids.get(1)!);
    await callUntil(page, (c) => countOn(mine, c) >= 5);
    await scanClaimButton(page).click();
    await enterTicketNumber(page, 1, 'Early Five');
    await expect(claimResult(page).getByText(/Early Five: ✓ Accepted, ₹\d+ to Riya/)).toBeVisible({ timeout: 2000 });
    await expect(proof(page)).toHaveText(new RegExp(`^\\s*Ticket 1\\s*·\\s*game ${code}\\s*·\\s*checked from your copy\\s*$`));
    await expect(proof(page)).not.toContainText(/same numbers/);
  });

  test('a paper win recorded on the anchor\'s word has no proof line (nothing was compared)', async ({ page }) => {
    await setUpPaperGame(page, { players: ['Riya', 'Asha', 'Dad'] });
    await callMany(page, 3);
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(claimResult(page)).toBeVisible();
    await expect(proof(page)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- Row 25: TAM-107 and TAM-172, the game code is visible to the room

test.describe('TAM-107 and TAM-172 (UX list row 25): the game code is visible to the room, and it is this game\'s', () => {
  test('hand-out: "Game 7K3P" above the QR, the same code the tickets carry; calling: "Tambola · Game 7K3P" in the top bar, as text, not a control', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    const code = await gameCodeOf(page);
    const label = handOutScreen(page).getByTestId('game-code');
    await expect(label).toHaveText(new RegExp(`^\\s*Game ${code}\\s*$`));
    const l = (await label.boundingBox())!;
    const qr = (await page.getByTestId('ticket-qr').boundingBox())!;
    expect(l.y + l.height, '"Game 7K3P" sits above the QR').toBeLessThanOrEqual(qr.y + 1);
    // Hand out the rest and start calling.
    for (let i = 0; i < 10; i++) {
      const next = page.getByRole('button', { name: 'Next ticket', exact: true });
      if (!(await next.isVisible())) break;
      await next.click();
    }
    await page.getByRole('button', { name: 'Start calling', exact: true }).click();
    const q = notHandedOutQuestion(page);
    if (await q.isVisible()) await q.getByRole('button', { name: 'Yes, start calling', exact: true }).click();
    await expect(nextNumber(page)).toBeVisible();
    const bar = page.getByTestId('top-bar').getByTestId('game-code');
    await expect(bar).toHaveText(new RegExp(`^\\s*Tambola\\s*·\\s*Game ${code}\\s*$`));
    expect(await bar.evaluate((el) => el.closest('button, a[href], [role="button"]') === null), 'quiet text, not a control').toBe(true);
  });

  test('room view: a small "Game 7K3P" in the bottom-left corner, kept in from the edge, below the number and the last 3 calls', async ({ page }) => {
    await phoneGame(page, THREE);
    const code = await gameCodeOf(page);
    await callMany(page, 4);
    await fromMenu(page, 'Show the room');
    const room = page.getByTestId('room-view');
    const tag = room.getByTestId('room-game-code');
    await expect(tag).toHaveText(new RegExp(`^\\s*Game ${code}\\s*$`));
    const vp = page.viewportSize()!;
    const t = (await tag.boundingBox())!;
    expect(t.x, 'kept in from the left edge').toBeGreaterThanOrEqual(8);
    expect(t.x + t.width, 'in the left half').toBeLessThanOrEqual(vp.width / 2);
    expect(vp.height - (t.y + t.height), 'kept in from the bottom edge').toBeGreaterThanOrEqual(8);
    expect(t.y + t.height, 'in the bottom part of the screen').toBeGreaterThan(vp.height * 0.75);
    const num = (await room.getByTestId('current-number').boundingBox())!;
    const last = (await room.getByTestId('last-calls').boundingBox())!;
    expect(t.y, 'below the number').toBeGreaterThanOrEqual(num.y + num.height - 1);
    expect(t.y, 'below the last 3 calls').toBeGreaterThanOrEqual(last.y + last.height - 1);
    const size = (l: Locator) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(await size(tag), 'small').toBeLessThan(await size(room.getByTestId('current-number')) / 4);
  });
});

// ---------------------------------------------------------------- Row 2: TAM-122, tickets fit the width down to 320 px

/** Every visible ticket's cells: inside the screen, at least 24 px tall, and as wide as the width allows. */
async function expectTicketsFit(player: Page, width: number, where: string) {
  await player.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  const sideways = await player.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    return el.scrollWidth > window.innerWidth + 1;
  });
  expect(sideways, `${where}: the page slides sideways`).toBe(false);
  const tickets = shownTickets(player);
  const count = await tickets.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const cells = await cellBoxes(tickets.nth(i));
    expect(cells).toHaveLength(27);
    for (const c of cells) {
      expect(c.x, `${where}: a cell starts off the left edge`).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w, `${where}: a cell runs off the right edge`).toBeLessThanOrEqual(width + 0.5);
      expect(c.h, `${where}: cells never below 24 px tall`).toBeGreaterThanOrEqual(24);
      expect(c.w, `${where}: cells never below 24 px wide`).toBeGreaterThanOrEqual(24);
    }
    // About 32 px at 320 (16 px side margins and an 8 px frame allowed): at least (width − 40) / 9.
    const narrowest = Math.min(...cells.map((c) => c.w));
    expect(narrowest, `${where}: the cells fill the width (about 32 px at 320)`).toBeGreaterThanOrEqual((width - 40) / 9 - 0.5);
  }
}

test.describe('TAM-122 and TAM-191 (UX list row 2): the tickets fit the width down to 320 px', () => {
  for (const vp of [{ width: 320, height: 640 }, { width: 375, height: 667 }]) {
    test(`${vp.width} × ${vp.height}: "All tickets" and "One at a time" show every cell on the screen, no sideways sliding, cells at least 24 px`, async ({ page, browser }, testInfo) => {
      const handOuts = await phoneGame(page, TWELVE);
      const riya = await playerWith(browser, testInfo, handOuts, 'Riya', vp);
      await expect(shownTickets(riya.page)).toHaveCount(3);
      await expectTicketsFit(riya.page, vp.width, `All tickets, ${vp.width} px`);
      await oneAtATime(riya.page).click();
      await expect(shownTickets(riya.page)).toHaveCount(1);
      await expectTicketsFit(riya.page, vp.width, `One at a time, ${vp.width} px`);
      await allTickets(riya.page).click();
      await expect(shownTickets(riya.page)).toHaveCount(3);
    });
  }
});
