// Phase 2 (phone tickets), on two or more phones: the host hands out tickets, players scan them, see and mark
// their own tickets, switch layouts, use quick mark and see the "your marks fill a pattern" cue.
// Scenarios: TAM-050, TAM-051, TAM-055, TAM-056, TAM-057, TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132,
// TAM-170, TAM-171, TAM-172, TAM-173, TAM-191, TAM-192, TAM-194, TAM-195, TAM-196.
// Every phone is its own browser context (its own storage). Names and test ids: README.md, "Phase 2: phone tickets".
import { expect, test, type Page } from './fixtures';
import { backgroundAndReturn, callMany, HOME } from './helpers';
import {
  allTickets, cellBoxes, cellsWith, closePhones, cornersOf, currentHandOut, confirmHandOut, gameCodeOf, gridOf,
  handOutAll, handOutScreen, LANDSCAPE, markedOn, newPhone, notOn, numbersOf, oneAtATime, openHostTickets, openPrizes,
  openQuickMark, padTap, pageFits, patternCue, phoneGame, phoneTicket, playerMenu, playerWith, PORTRAIT, prizeItem,
  quickMarkMessage, quickMarkPad, readDrawnQr, rowOf, scanTicket, setUpPhoneGame, shownTickets, tapCell, thumbnail, ticketTab,
} from './phone';

test.afterEach(closePhones);

const THREE = [{ name: 'Riya' }, { name: 'Asha' }, { name: 'Dad' }];
/** 12 tickets, so Four Corners is in the game (TAM-081), and every player has 3 tickets. */
const TWELVE = [{ name: 'Riya', tickets: 3 }, { name: 'Asha', tickets: 3 }, { name: 'Dad', tickets: 3 }, { name: 'Kabir', tickets: 3 }];

// ---------------------------------------------------------------- Host: handing out

test.describe('Host: handing out tickets', () => {
  test('TAM-172 and TAM-132: each ticket is pre-assigned "Ticket 1 → Riya (1 of 2)"; the host confirms each hand-out and sees who is still waiting', async ({ page }) => {
    await setUpPhoneGame(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }, { name: 'Dad' }]);
    const screen = handOutScreen(page);
    await expect(screen.getByTestId('hand-out-ticket')).toHaveText(/Ticket 1\s*→\s*Riya \(1 of 2\)/);
    await expect(screen.getByTestId('hand-out-progress')).toHaveText(/0 of 4 handed out/);
    const waiting = screen.getByTestId('hand-out-waiting');
    for (const n of ['Riya', 'Asha', 'Dad']) await expect(waiting).toContainText(n);

    await confirmHandOut(page);
    await expect(screen.getByTestId('hand-out-ticket')).toHaveText(/Ticket 2\s*→\s*Riya \(2 of 2\)/);
    await expect(screen.getByTestId('hand-out-progress')).toHaveText(/1 of 4 handed out/);
    await confirmHandOut(page);
    await expect(screen.getByTestId('hand-out-ticket')).toHaveText(/Ticket 3\s*→\s*Asha \(1 of 1\)/);
    await expect(screen.getByTestId('hand-out-progress')).toHaveText(/2 of 4 handed out/);
    // Riya has both her tickets: she is no longer waiting.
    await expect(waiting).not.toContainText('Riya');
    await expect(waiting).toContainText('Asha');
    await confirmHandOut(page);
    // After the last ticket, the main button is "Start calling".
    await expect(page.getByRole('button', { name: 'Start calling', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next ticket', exact: true })).toHaveCount(0);
    expect(await confirmHandOut(page)).toBe(true);
  });

  test('TAM-172: the host can hand the ticket to a different player before showing the QR, and the phone shows that name', async ({ page, browser }, testInfo) => {
    await setUpPhoneGame(page, THREE);
    // Tap the name to change it.
    await handOutScreen(page).getByTestId('hand-out-ticket').getByRole('button').first().click();
    await page.getByRole('button', { name: 'Asha', exact: true }).click();
    await expect(handOutScreen(page).getByTestId('hand-out-ticket')).toHaveText(/Ticket 1\s*→\s*Asha/);
    const h = await currentHandOut(page);
    const phone = await newPhone(browser, testInfo, PORTRAIT);
    await phone.goto(HOME);
    await scanTicket(phone, h.payload);
    await expect(phone.getByText(/Asha/).first()).toBeVisible();
    await expect(phone.getByText(/Ticket 1\b/).first()).toBeVisible();
  });

  test('TAM-117: the hand-out shows a large QR (a link to the app) and a typed code of 20 characters in 5 groups of 4, with no look-alikes', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    const qr = page.getByTestId('ticket-qr');
    await expect(qr).toBeVisible();
    const box = (await qr.boundingBox())!;
    expect(Math.min(box.width, box.height), 'the QR is large enough to scan from 30–50 cm').toBeGreaterThanOrEqual(200);
    await expect(qr.locator('svg, canvas, img').first()).toBeVisible();
    const h = await currentHandOut(page);
    // The phone's own camera opens a link: the QR holds the app's address, so no scanner app is needed.
    expect(h.payload).toMatch(/^https?:\/\/[^/]+\/pocket-game-night\//);
    // Owner decision 2026-09-30: 20 characters in 5 groups of 4, such as K7QM-2XPA-9RTD-4HWC-B3NF.
    expect(h.code).toMatch(/^[2-9A-HJKMNP-Z]{4}(-[2-9A-HJKMNP-Z]{4}){4}$/);
    await expect(handOutScreen(page).getByText(/Scan with your phone's camera/i)).toBeVisible();
  });

  test('TAM-117 and TAM-053: each ticket QR as drawn on screen reads back, with jsQR, exactly as its link', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    for (let i = 0; i < 3; i++) {
      const h = await currentHandOut(page);
      expect(h.payload).not.toBe('');
      expect(await readDrawnQr(page.getByTestId('ticket-qr')), `ticket ${h.ticket}'s QR does not read back as its link`).toBe(h.payload);
      await confirmHandOut(page);
    }
  });

  test('TAM-170: the host shows the game code while handing out and while calling', async ({ page }) => {
    await setUpPhoneGame(page, THREE);
    const code = await gameCodeOf(page);
    await handOutAll(page);
    expect(await gameCodeOf(page)).toBe(code);
  });

  test('TAM-058: "Can\'t scan? Give a paper ticket" moves the player to paper; their tickets are skipped and the anchor records their wins', async ({ page }) => {
    await setUpPhoneGame(page, [{ name: 'Riya' }, { name: 'Dad', tickets: 2 }, { name: 'Asha' }]);
    await confirmHandOut(page); // Riya's ticket
    await expect(handOutScreen(page).getByTestId('hand-out-ticket')).toHaveText(/→\s*Dad \(1 of 2\)/);
    await page.getByRole('button', { name: /^Can.t scan\? Give a paper ticket/ }).click();
    // Dad's second ticket is skipped too: next is Asha.
    await expect(handOutScreen(page).getByTestId('hand-out-ticket')).toHaveText(/→\s*Asha/);
    const rest = await handOutAll(page);
    expect(rest.map((h) => h.player)).toEqual(['Asha']);
    // Mixed game: phone claims are checked, paper wins are recorded (TAM-037).
    await callMany(page, 2);
    await expect(page.getByRole('button', { name: 'Scan a claim', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Record a win' }).click();
    await page.getByRole('button', { name: 'Early Five', exact: true }).click();
    await page.getByRole('button', { name: 'Dad', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(page.getByTestId('claim-result').getByText(/Early Five: ✓ Dad/)).toBeVisible();
  });
});

// ---------------------------------------------------------------- Player: the ticket

test.describe('Player: the ticket on the phone', () => {
  test('TAM-055 and TAM-056: the ticket on the phone is identical to the host\'s copy; the host sees every ticket and its owner', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }, { name: 'Dad' }]);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya');
    await openHostTickets(page);
    const hostTickets = page.getByTestId('host-ticket');
    await expect(hostTickets).toHaveCount(4);
    for (const t of riya.tickets) {
      const hostCopy = page.locator(`[data-testid="host-ticket"][data-ticket="${t}"]`);
      await expect(hostCopy).toContainText('Riya');
      expect(await gridOf(hostCopy)).toEqual(riya.grids.get(t));
    }
  });

  test('TAM-050 and TAM-051: the phone shows only the player\'s own tickets: no called numbers, no board, no other ticket', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }, { name: 'Dad' }]);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya');
    await callMany(page, 12);
    await riya.page.reload();
    await expect(shownTickets(riya.page)).toHaveCount(2);
    for (const id of ['current-number', 'last-calls', 'board', 'room-view']) await expect(riya.page.getByTestId(id)).toHaveCount(0);
    await expect(riya.page.locator('[data-called]')).toHaveCount(0);
    const own = new Set([...riya.grids.values()].flatMap(numbersOf));
    const shown = await riya.page.locator('[data-number]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-number'))));
    for (const n of shown) expect(own.has(n), `the phone shows ${n}, which is not on Riya's tickets`).toBe(true);
    await expect(riya.page.getByText(/Listen to the anchor/i).first()).toBeVisible();
  });

  test('TAM-170: the phone shows the player, ticket number, game code and start time, and this game\'s prizes', async ({ page, browser }, testInfo) => {
    await setUpPhoneGame(page, THREE);
    const code = await gameCodeOf(page);
    const handOuts = await handOutAll(page);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya');
    const top = riya.page.getByTestId('phone-ticket-header');
    await expect(top).toContainText('Riya');
    await expect(top).toContainText(/Ticket 1\b/);
    await expect(top).toContainText(code);
    await expect(top).toContainText(/\d{1,2}:\d{2}/);
    await openPrizes(riya.page);
    // 3 tickets: Early Five, Top Line, Full House (TAM-081), and nothing else.
    await expect(riya.page.getByTestId('prize-item')).toHaveCount(3);
    for (const p of ['Early Five', 'Top Line', 'Full House']) await expect(prizeItem(riya.page, p)).toHaveCount(1);
  });

  test('TAM-131: tapping a number marks it (fill and ✓); tapping again unmarks it; nothing asks for confirmation', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya');
    const n = numbersOf(riya.grids.get(1)!)[0]!;
    const c = phoneTicket(riya.page, 1).locator(`[data-number="${n}"]`);
    const bgBefore = await c.evaluate((e) => getComputedStyle(e).backgroundColor);
    await tapCell(riya.page, 1, n);
    await expect(c).toHaveAttribute('data-marked', 'true');
    await expect(c).toContainText('✓');
    expect(await c.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(bgBefore);
    await expect(riya.page.getByRole('dialog')).toHaveCount(0);
    await tapCell(riya.page, 1, n);
    await expect(c).not.toHaveAttribute('data-marked', 'true');
    await expect(c).not.toContainText('✓');
  });

  test('TAM-171: marks survive a reload and the app going to the background; a ticket for a new game replaces the old one', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya');
    const nine = numbersOf(riya.grids.get(1)!).slice(0, 9);
    for (const n of nine) await tapCell(riya.page, 1, n);
    await riya.page.reload();
    expect(await markedOn(phoneTicket(riya.page, 1))).toEqual([...nine].sort((a, b) => a - b));
    // The phone locks or the player switches apps and comes back.
    await backgroundAndReturn(riya.page);
    await expect(phoneTicket(riya.page, 1)).toBeVisible();
    expect(await markedOn(phoneTicket(riya.page, 1))).toHaveLength(9);

    // A new game on another host phone: scanning its ticket replaces the old one, with no marks.
    const host2 = await newPhone(browser, testInfo);
    await setUpPhoneGame(host2, THREE);
    const code2 = await gameCodeOf(host2);
    const h2 = await currentHandOut(host2);
    await scanTicket(riya.page, h2.payload);
    await expect(shownTickets(riya.page)).toHaveCount(1);
    await expect(riya.page.getByTestId('phone-ticket-header')).toContainText(code2);
    expect(await markedOn(shownTickets(riya.page).first())).toEqual([]);
  });

  test('TAM-121: "Larger text" makes the ticket and text bigger, with nothing cut off or overlapping', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya');
    const n = numbersOf(riya.grids.get(1)!)[0]!;
    const c = phoneTicket(riya.page, 1).locator(`[data-number="${n}"]`);
    const before = await c.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    await playerMenu(riya.page, 'Larger text');
    await riya.page.keyboard.press('Escape').catch(() => {});
    await expect.poll(() => c.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(before);
    const clipped = await riya.page.locator('[data-cell]').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).length);
    expect(clipped, 'cells whose text is cut off').toBe(0);
    const boxes = await cellBoxes(phoneTicket(riya.page, 1));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!, b = boxes[j]!;
      const overlap = a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
      expect(overlap, 'two cells overlap').toBe(false);
    }
    expect(await riya.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'nothing runs off the side').toBe(true);
  });
});

// ---------------------------------------------------------------- Several tickets: layouts

/** Layout facts about the tickets shown now. */
async function ticketBoxes(player: Page) {
  const tickets = shownTickets(player);
  const out: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < (await tickets.count()); i++) {
    const b = (await tickets.nth(i).boundingBox())!;
    out.push({ x: b.x, y: b.y, w: b.width, h: b.height });
  }
  return out;
}
async function smallestCell(player: Page) {
  const boxes = await cellBoxes(player.locator('[data-testid="phone-ticket"]:visible'));
  return Math.min(...boxes.map((b) => Math.min(b.w, b.h)));
}
/**
 * TAM-122 and TAM-191 (owner decision 2026-09-30): in "One at a time" on a 390 px portrait screen the whole ticket
 * fits, with no sideways sliding. Nothing scrolls or is clipped sideways: not the page, not the ticket, not anything
 * around it; and every cell lies fully on screen. Returns what is wrong, or an empty list.
 */
async function slidesSideways(player: Page): Promise<string[]> {
  return player.evaluate(() => {
    const wrong: string[] = [];
    const doc = document.scrollingElement ?? document.documentElement;
    if (doc.scrollWidth > window.innerWidth + 1) wrong.push(`page is ${doc.scrollWidth} px wide on a ${window.innerWidth} px screen`);
    const ticket = [...document.querySelectorAll<HTMLElement>('[data-testid="phone-ticket"]')].find((e) => e.offsetParent !== null);
    if (!ticket) return ['no ticket shown'];
    const around: HTMLElement[] = [...ticket.querySelectorAll<HTMLElement>('*'), ticket];
    for (let e = ticket.parentElement; e; e = e.parentElement) around.push(e);
    for (const e of around) {
      if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && !e.hasAttribute('data-cell')) {
        wrong.push(`<${e.tagName.toLowerCase()} ${e.getAttribute('data-testid') ?? e.className}> holds ${e.scrollWidth} px in ${e.clientWidth} px (overflow-x: ${getComputedStyle(e).overflowX})`);
      }
      if (e.scrollLeft !== 0) wrong.push(`<${e.tagName.toLowerCase()}> is slid ${e.scrollLeft} px sideways`);
    }
    for (const c of ticket.querySelectorAll<HTMLElement>('[data-cell]')) {
      const r = c.getBoundingClientRect();
      if (r.left < -1 || r.right > window.innerWidth + 1) { wrong.push(`a cell runs off the side (${Math.round(r.left)} to ${Math.round(r.right)} px)`); break; }
    }
    return wrong;
  });
}

test.describe('Several tickets on one phone', () => {
  test('TAM-173 and TAM-122: portrait 390 × 844: all 3 tickets stacked, no scrolling, cells at least 40 px, rows run across', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, TWELVE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    await expect(shownTickets(riya.page)).toHaveCount(3);
    expect(await pageFits(riya.page), 'the page scrolls').toBe(true);
    const boxes = await ticketBoxes(riya.page);
    for (const b of boxes) {
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.h).toBeLessThanOrEqual(PORTRAIT.height + 1);
      expect(b.x + b.w).toBeLessThanOrEqual(PORTRAIT.width + 1);
    }
    for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.y).toBeGreaterThanOrEqual(boxes[i - 1]!.y + boxes[i - 1]!.h - 1);
    expect(await smallestCell(riya.page)).toBeGreaterThanOrEqual(40);
    // Nothing forces landscape: the top row's cells run left to right on one line.
    const cells = (await cellBoxes(phoneTicket(riya.page, riya.tickets[0]!))).slice(0, 9);
    for (let i = 1; i < 9; i++) {
      expect(Math.abs(cells[i]!.y - cells[0]!.y)).toBeLessThanOrEqual(1);
      expect(cells[i]!.x).toBeGreaterThan(cells[i - 1]!.x);
    }
  });

  test('TAM-173 and TAM-122: landscape: two side by side and the third below, no scrolling; turning the phone keeps every mark', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, TWELVE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const marks = new Map<number, number[]>();
    for (const t of riya.tickets) {
      const pick = numbersOf(riya.grids.get(t)!).slice(0, 3);
      for (const n of pick) await tapCell(riya.page, t, n);
      marks.set(t, [...pick].sort((a, b) => a - b));
    }
    await riya.page.setViewportSize(LANDSCAPE);
    await expect(shownTickets(riya.page)).toHaveCount(3);
    // Turning the phone re-lays the page on the next frame; Android's emulated rotation returns before that frame
    // (measured: under 20 ms). Wait at most 1 second for the turn to finish, then it must fit.
    await expect.poll(() => pageFits(riya.page), { message: 'the page scrolls in landscape', timeout: 1_000 }).toBe(true);
    const [a, b, c] = await ticketBoxes(riya.page);
    expect(Math.abs(a!.y - b!.y), 'the first two sit side by side').toBeLessThanOrEqual(2);
    expect(b!.x).toBeGreaterThanOrEqual(a!.x + a!.w - 1);
    expect(c!.y, 'the third is below').toBeGreaterThanOrEqual(Math.max(a!.y + a!.h, b!.y + b!.h) - 1);
    for (const box of [a!, b!, c!]) expect(box.y + box.h).toBeLessThanOrEqual(LANDSCAPE.height + 1);
    expect(await smallestCell(riya.page)).toBeGreaterThanOrEqual(40);
    for (const t of riya.tickets) expect(await markedOn(phoneTicket(riya.page, t))).toEqual(marks.get(t));
    await riya.page.setViewportSize(PORTRAIT);
    for (const t of riya.tickets) expect(await markedOn(phoneTicket(riya.page, t))).toEqual(marks.get(t));
  });

  test('TAM-191 and TAM-122: "One at a time" shows one ticket with tabs, cells at least 42 px and the whole ticket on a 390 px portrait screen with no sideways sliding; "All tickets" shows all 3 again', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, TWELVE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const [t1, t2, t3] = riya.tickets as [number, number, number];
    await oneAtATime(riya.page).click();
    await expect(shownTickets(riya.page)).toHaveCount(1);
    for (const t of [t1, t2, t3]) await expect(ticketTab(riya.page, t)).toBeVisible();
    expect(await smallestCell(riya.page)).toBeGreaterThanOrEqual(42);
    expect(await slidesSideways(riya.page), 'the ticket slides sideways in portrait').toEqual([]);
    await ticketTab(riya.page, t2).click();
    await expect(shownTickets(riya.page)).toHaveCount(1);
    await expect(phoneTicket(riya.page, t2)).toBeVisible();
    expect(await smallestCell(riya.page)).toBeGreaterThanOrEqual(42);
    expect(await slidesSideways(riya.page), 'the ticket slides sideways in portrait').toEqual([]);
    expect(await gridOf(phoneTicket(riya.page, t2))).toEqual(riya.grids.get(t2));
    // A mark made here shows in "All tickets" too.
    const n = numbersOf(riya.grids.get(t2)!)[0]!;
    await tapCell(riya.page, t2, n);
    await allTickets(riya.page).click();
    await expect(shownTickets(riya.page)).toHaveCount(3);
    expect(await markedOn(phoneTicket(riya.page, t2))).toEqual([n]);
  });

  test('TAM-191: the choice of layout is remembered on the phone for the next game', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, TWELVE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    await oneAtATime(riya.page).click();
    await expect(shownTickets(riya.page)).toHaveCount(1);
    // The next game, on a second host phone: Riya scans her two new tickets.
    const host2 = await newPhone(browser, testInfo);
    const next = await phoneGame(host2, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
    for (const h of next.filter((x) => x.player === 'Riya')) await scanTicket(riya.page, h.payload);
    await expect(shownTickets(riya.page)).toHaveCount(1);
    await expect(riya.page.getByRole('tab')).toHaveCount(2);
    await expect(allTickets(riya.page)).toBeVisible();
  });
});

// ---------------------------------------------------------------- Quick mark

test.describe('Quick mark', () => {
  test('TAM-192: tap the number heard: "✓ 36 marked on ticket 3"; a number on no ticket: "37: not on your tickets"; tap again to unmark', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, TWELVE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const t = riya.tickets[1]!;
    const n = numbersOf(riya.grids.get(t)!)[2]!;
    await openQuickMark(riya.page);
    // A pad of 1 to 90, and no sign of what was called.
    for (const k of [1, 45, 90]) await expect(quickMarkPad(riya.page).getByRole('button', { name: String(k), exact: true })).toBeVisible();
    await expect(riya.page.locator('[data-called]')).toHaveCount(0);

    await padTap(riya.page, n);
    await expect(quickMarkMessage(riya.page)).toHaveText(new RegExp(`✓\\s*${n} marked on ticket ${t}\\b`));
    expect(await cellsWith(thumbnail(riya.page, t), 'data-marked')).toEqual([n]);
    for (const other of riya.tickets.filter((x) => x !== t)) expect(await cellsWith(thumbnail(riya.page, other), 'data-marked')).toEqual([]);

    const none = notOn([...riya.grids.values()]);
    await padTap(riya.page, none);
    await expect(quickMarkMessage(riya.page)).toHaveText(new RegExp(`${none}: not on your tickets`));
    for (const x of riya.tickets) expect(await cellsWith(thumbnail(riya.page, x), 'data-marked')).toEqual(x === t ? [n] : []);

    await padTap(riya.page, n);
    expect(await cellsWith(thumbnail(riya.page, t), 'data-marked')).toEqual([]);
  });

  test('TAM-192: every ticket shows under the pad as a thumbnail with marked cells clearly filled; tapping one opens it, "Back" returns', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, TWELVE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const [t1, t2] = riya.tickets as [number, number];
    const n = numbersOf(riya.grids.get(t1)!)[0]!;
    await tapCell(riya.page, t1, n);
    await openQuickMark(riya.page);
    for (const t of riya.tickets) await expect(thumbnail(riya.page, t)).toBeVisible();
    await expect(riya.page.getByTestId('quick-mark-thumbnail')).toHaveCount(3);
    // Thumbnails sit under the pad.
    const pad = (await quickMarkPad(riya.page).boundingBox())!;
    expect((await thumbnail(riya.page, t1).boundingBox())!.y).toBeGreaterThanOrEqual(pad.y + pad.height - 1);
    // A marked cell is filled differently from an unmarked one.
    const thumb = thumbnail(riya.page, t1);
    const marked = await thumb.locator(`[data-number="${n}"]`).evaluate((e) => getComputedStyle(e).backgroundColor);
    const other = numbersOf(riya.grids.get(t1)!)[1]!;
    const unmarked = await thumb.locator(`[data-number="${other}"]`).evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(marked).not.toBe(unmarked);
    expect(await cellsWith(thumb, 'data-marked')).toEqual([n]);

    await thumbnail(riya.page, t2).click();
    await expect(shownTickets(riya.page)).toHaveCount(1);
    await expect(phoneTicket(riya.page, t2)).toBeVisible();
    expect(await smallestCell(riya.page)).toBeGreaterThanOrEqual(42);
    expect(await slidesSideways(riya.page), 'the ticket slides sideways in portrait').toEqual([]);
    await riya.page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(quickMarkPad(riya.page)).toBeVisible();
  });

  test('TAM-194: when a player\'s tickets span two sheets, quick mark marks every ticket that has the number', async ({ page, browser }, testInfo) => {
    // Tickets 1–3 Riya, 4–5 Asha, 6–8 Dad: Dad's ticket 6 is on sheet 1, tickets 7 and 8 on sheet 2.
    const handOuts = await phoneGame(page, [{ name: 'Riya', tickets: 3 }, { name: 'Asha', tickets: 2 }, { name: 'Dad', tickets: 3 }]);
    const dad = await playerWith(browser, testInfo, handOuts, 'Dad', PORTRAIT);
    expect(dad.tickets).toEqual([6, 7, 8]);
    const six = new Set(numbersOf(dad.grids.get(6)!));
    const later = [7, 8].flatMap((t) => numbersOf(dad.grids.get(t)!).filter((n) => six.has(n)).map((n) => ({ n, t })));
    expect(later.length, 'ticket 6 shares no number with tickets 7 and 8 (very unlikely)').toBeGreaterThan(0);
    const { n, t } = later[0]!;
    await openQuickMark(dad.page);
    await padTap(dad.page, n);
    expect(await cellsWith(thumbnail(dad.page, 6), 'data-marked')).toEqual([n]);
    expect(await cellsWith(thumbnail(dad.page, t), 'data-marked')).toEqual([n]);
    await expect(quickMarkMessage(dad.page)).toContainText(String(6));
    await expect(quickMarkMessage(dad.page)).toContainText(String(t));
  });
});

// ---------------------------------------------------------------- The "your marks fill a pattern" cue

test.describe('The "your marks fill a pattern" cue', () => {
  test('TAM-195: marks covering the top row outline it and say "Your marks fill the top row of ticket 1. Shout if it\'s right!"; unmarking removes it', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const top = rowOf(riya.grids.get(1)!, 0);
    for (const n of top.slice(0, 4)) await tapCell(riya.page, 1, n);
    await expect(patternCue(riya.page)).toHaveCount(0);
    await tapCell(riya.page, 1, top[4]!);
    await expect(patternCue(riya.page)).toContainText("Your marks fill the top row of ticket 1. Shout if it's right!");
    expect(await cellsWith(phoneTicket(riya.page, 1), 'data-cue')).toEqual(expect.arrayContaining([...top]));
    // Never a verdict, never a claim.
    await expect(riya.page.getByText(/accepted|you won|winner|correct|valid claim/i)).toHaveCount(0);
    await expect(riya.page.getByTestId('claim-qr')).toHaveCount(0);
    // Also under the quick-mark pad.
    await openQuickMark(riya.page);
    expect(await cellsWith(thumbnail(riya.page, 1), 'data-cue')).toEqual(expect.arrayContaining([...top]));
    await riya.page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(phoneTicket(riya.page, 1)).toBeVisible();
    await tapCell(riya.page, 1, top[2]!);
    await expect(riya.page.getByText(/fill the top row/)).toHaveCount(0);
    expect(await cellsWith(phoneTicket(riya.page, 1), 'data-cue')).toEqual([]);
  });

  test('TAM-195: 5 marks point out Early Five; the four corners are never mentioned in a game without Four Corners', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE); // Early Five, Top Line, Full House
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const grid = riya.grids.get(1)!;
    const four = cornersOf(grid);
    for (const n of four) await tapCell(riya.page, 1, n);
    await expect(patternCue(riya.page)).toHaveCount(0);
    await expect(riya.page.getByText(/corner/i)).toHaveCount(0);
    // A fifth mark, off the top row: Early Five.
    const fifth = rowOf(grid, 1)[2]!;
    await tapCell(riya.page, 1, fifth);
    await expect(patternCue(riya.page)).toContainText(/ticket 1\b/);
    await expect(patternCue(riya.page)).toContainText("Shout if it's right!");
    await expect(patternCue(riya.page)).not.toContainText(/corner|row/i);
    await expect(riya.page.getByText(/accepted|you won|winner|correct/i)).toHaveCount(0);
  });

  test('TAM-195: with Four Corners in the game, marking the four corners outlines them', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, TWELVE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const t = riya.tickets[0]!;
    const four = cornersOf(riya.grids.get(t)!);
    for (const n of four) await tapCell(riya.page, t, n);
    await expect(patternCue(riya.page)).toContainText(new RegExp(`corners.*ticket ${t}\\b|ticket ${t}\\b.*corners`, 'i'));
    expect(await cellsWith(phoneTicket(riya.page, t), 'data-cue')).toEqual([...four].sort((a, b) => a - b));
  });
});

// ---------------------------------------------------------------- Won prizes crossed out by the player

test('TAM-196: the player crosses out a prize announced as won (tap again to undo); it cannot be picked in "Show claim"; the rest stay selectable', async ({ page, browser }, testInfo) => {
  const handOuts = await phoneGame(page, THREE);
  const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
  await openPrizes(riya.page);
  const top = prizeItem(riya.page, 'Top Line');
  await top.click();
  await expect(top).toHaveAttribute('data-crossed', 'true');
  await expect(top).toContainText(/won/i);
  await expect(prizeItem(riya.page, 'Early Five')).not.toHaveAttribute('data-crossed', 'true');
  await riya.page.keyboard.press('Escape').catch(() => {});
  await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
  const topButton = riya.page.getByRole('button', { name: /^Top Line/ });
  // Shown greyed and disabled, or not offered at all.
  if (await topButton.count()) await expect(topButton.first()).toBeDisabled();
  await expect(riya.page.getByRole('button', { name: 'Early Five', exact: true })).toBeEnabled();
  await expect(riya.page.getByRole('button', { name: 'Full House', exact: true })).toBeEnabled();
  // Undo the cross-out: Top Line can be picked again.
  await riya.page.reload();
  await openPrizes(riya.page);
  await prizeItem(riya.page, 'Top Line').click();
  await expect(prizeItem(riya.page, 'Top Line')).not.toHaveAttribute('data-crossed', 'true');
  await riya.page.keyboard.press('Escape').catch(() => {});
  await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
  await expect(riya.page.getByRole('button', { name: 'Top Line', exact: true })).toBeEnabled();
});

// ---------------------------------------------------------------- Typed code, and no internet

test('TAM-117 and TAM-057: typing the code on a phone opens the same ticket, with the same numbers', async ({ page, browser }, testInfo) => {
  await setUpPhoneGame(page, THREE);
  const h = await currentHandOut(page);
  const scanned = await newPhone(browser, testInfo, PORTRAIT);
  await scanned.goto(HOME);
  await scanTicket(scanned, h.payload);
  const want = await gridOf(phoneTicket(scanned, h.ticket));
  const typed = await newPhone(browser, testInfo, PORTRAIT);
  await typed.goto(HOME);
  await typed.getByRole('button', { name: 'Enter ticket code', exact: true }).click();
  await typed.getByLabel('Ticket code', { exact: true }).fill(h.code);
  await typed.getByRole('button', { name: 'Open ticket', exact: true }).click();
  await expect(phoneTicket(typed, h.ticket)).toBeVisible();
  expect(await gridOf(phoneTicket(typed, h.ticket))).toEqual(want);
  // The code carries the whole ticket: its number and the game code show too (TAM-170).
  const code = await gameCodeOf(page);
  await expect(typed.getByTestId('phone-ticket-header').first()).toContainText(new RegExp(`Ticket ${h.ticket}\\b`));
  await expect(typed.getByTestId('phone-ticket-header').first()).toContainText(code);
  // Wrong input: a code that is not a ticket is refused with a one-line reason.
  const other = await newPhone(browser, testInfo, PORTRAIT);
  await other.goto(HOME);
  await other.getByRole('button', { name: 'Enter ticket code', exact: true }).click();
  await other.getByLabel('Ticket code', { exact: true }).fill('ABCD-EFGH-JKMN');
  await other.getByRole('button', { name: 'Open ticket', exact: true }).click();
  await expect(other.getByRole('alert')).toBeVisible();
  await expect(other.getByTestId('phone-ticket')).toHaveCount(0);
});

test('TAM-057: scanning a ticket fetches nothing from any other server: everything is in the QR link', async ({ page, browser }, testInfo) => {
  await setUpPhoneGame(page, THREE);
  const h = await currentHandOut(page);
  const phone = await newPhone(browser, testInfo, PORTRAIT);
  await phone.goto(HOME);
  const origin = new URL(phone.url()).origin;
  const elsewhere: string[] = [];
  phone.on('request', (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) elsewhere.push(r.url()); });
  await scanTicket(phone, h.payload);
  await tapCell(phone, h.ticket, numbersOf(await gridOf(phoneTicket(phone, h.ticket)))[0]!);
  expect(elsewhere).toEqual([]);
});

// Owner decision 2026-09-28 (docs/decisions.md): offline reloads run in Chromium only, because Playwright's WebKit
// cannot load a page a service worker answers while offline (microsoft/playwright#42775). iPhone checked by hand.
// The decision of 2026-09-30 confirms it covers this test (TAM-057): the iPhone offline scan is a by-hand check.
test('TAM-057: with no internet, a phone that opened the app once opens its ticket from the QR and can mark it', async ({ page, browser, browserName }, testInfo) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot load offline under a service worker (microsoft/playwright#42775); owner decisions 2026-09-28 and 2026-09-30, iPhone checked by hand');
  await setUpPhoneGame(page, THREE);
  const h = await currentHandOut(page);
  const phone = await newPhone(browser, testInfo, PORTRAIT);
  await phone.goto(HOME);
  await phone.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const sw = reg.active!;
    if (sw.state !== 'activated') await new Promise<void>((r) => sw.addEventListener('statechange', () => sw.state === 'activated' && r()));
  });
  await phone.reload();
  await expect.poll(() => phone.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await phone.context().setOffline(true);
  await scanTicket(phone, h.payload);
  const n = numbersOf(await gridOf(phoneTicket(phone, h.ticket)))[0]!;
  await tapCell(phone, h.ticket, n);
  await expect(phoneTicket(phone, h.ticket).locator(`[data-number="${n}"]`)).toHaveAttribute('data-marked', 'true');
  await expect(phone.getByText(/offline|no internet|no connection|network error/i)).toHaveCount(0);
});
