// TAM-195 (owner, 1 October 2026; UX list rows 1 and 1a in docs/handover.md): the "your marks fill a pattern" cue
// on players' phones is a host option, off by default, set on the ticket-type step once "Phone tickets" is chosen,
// with a warning when turned on. It travels in the ticket QR (TAM-053, format version 2); older QRs and typed codes
// have it off. With it on, the message is one slim line that never covers a ticket and never pushes "One at a
// time", "Quick mark" or "Show claim" off a 375 × 812 screen, portrait or landscape, Larger text on or off, 1 to 3
// tickets. Names and test ids: README.md, "UX list of 1 October 2026".

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from './fixtures';
import { CUE_WARNING, cueSwitch, HOME, onTopAtCentre, openTambola, ticketCard, typeTicketCode } from './helpers';
import {
  allCueText, cellsWith, closePhones, cueMore, currentHandOut, gridOf, handOutAll, newPhone, openQuickMark, patternCue,
  pageFits, phoneGame, phoneTicket, playerMenu, playerWith, PORTRAIT, rowOf, scanTicket, setUpPhoneGame, shownTickets, tapCell, thumbnail,
} from './phone';

/** Real format-1 ticket QRs from the app at d3aa874 (tests/fixtures/ticket-qr-v1.json). */
const V1: { rule: { text: string; ticket: any }[]; browser: { link: string; ticket: number; name: string }[] } = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/ticket-qr-v1.json', import.meta.url)), 'utf8'),
);

test.afterEach(closePhones);

const SMALL_PORTRAIT = { width: 375, height: 812 };
const SMALL_LANDSCAPE = { width: 812, height: 375 };

/** Marks every number of a ticket's top row on the phone. Returns them. */
async function fillTopRow(player: Page, ticket: number): Promise<number[]> {
  const top = rowOf(await gridOf(phoneTicket(player, ticket).first()), 0);
  for (const n of top) await tapCell(player, ticket, n);
  return top;
}

/** Nothing on the phone points out a filled pattern (TAM-195 with the cue off). */
async function expectNoCue(player: Page, tickets: number[]) {
  await expect(patternCue(player)).toHaveCount(0);
  await expect(player.getByText(/Shout if it['’]s right|top row filled|patterns? filled|Pattern filled/i)).toHaveCount(0);
  for (const t of tickets) expect(await cellsWith(phoneTicket(player, t), 'data-cue'), `cue outline on ticket ${t}`).toEqual([]);
}

// ---------------------------------------------------------------- The host's switch

test.describe('TAM-195: the host\'s switch on the ticket-type step', () => {
  test('shown only once "Phone tickets" is chosen, off at first; turning it on shows the warning', async ({ page }) => {
    await openTambola(page);
    await page.getByRole('button', { name: 'New game' }).click();
    await expect(ticketCard(page, 'phone')).toBeVisible();
    await expect(cueSwitch(page), 'no cue switch before a ticket type is chosen').toHaveCount(0);
    await ticketCard(page, 'paper').click();
    await expect(cueSwitch(page), 'no cue switch with paper tickets').toHaveCount(0);
    await ticketCard(page, 'phone').click();
    await expect(cueSwitch(page)).toBeVisible();
    await expect(cueSwitch(page), 'off by default').not.toBeChecked();
    await expect(page.getByText(/Off: players spot their own wins, as on paper\./).first()).toBeVisible();
    await expect(page.getByText(CUE_WARNING), 'no warning while it is off').toHaveCount(0);

    await cueSwitch(page).click();
    await expect(page.getByText(CUE_WARNING).first()).toBeVisible();
    await expect(page.getByText(/paper players get no help\. Claims are still shouted and checked\./).first()).toBeVisible();
    const turnOn = page.getByRole('dialog').getByRole('button', { name: 'Turn on', exact: true });
    if (await turnOn.isVisible()) await turnOn.click();
    await expect(cueSwitch(page)).toBeChecked();
    // Going back to paper hides the switch again.
    await ticketCard(page, 'paper').click();
    await expect(cueSwitch(page)).toHaveCount(0);
  });

  test('players can\'t turn it on themselves: the player\'s menu has no cue switch', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, [{ name: 'Riya' }, { name: 'Asha' }]);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    await riya.page.getByRole('button', { name: /Menu/ }).click();
    await expect(riya.page.getByText(/marks fill a prize pattern|pattern cue/i)).toHaveCount(0);
    await expect(riya.page.getByRole('switch', { name: /pattern/i }).or(riya.page.getByRole('checkbox', { name: /pattern/i }))).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- With the cue off

test.describe('TAM-195: with the cue off (the default), nothing points out a filled pattern', () => {
  test('a full top row: no outline, no message line, no "Pattern filled"; "Show claim" still outlines the prize she picks', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, [{ name: 'Riya', tickets: 3 }, { name: 'Asha' }]);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const top = await fillTopRow(riya.page, 1);
    await expectNoCue(riya.page, riya.tickets);
    // Under the quick-mark pad too.
    await openQuickMark(riya.page);
    for (const t of riya.tickets) expect(await cellsWith(thumbnail(riya.page, t), 'data-cue'), `thumbnail ${t}`).toEqual([]);
    await expect(patternCue(riya.page)).toHaveCount(0);
    await riya.page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(phoneTicket(riya.page, 1)).toBeVisible();
    // "Which ticket?" has no "Pattern filled" tag.
    await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
    await expect(riya.page.getByRole('button', { name: 'Ticket 1', exact: true }).or(riya.page.getByRole('button', { name: /^Ticket 1\b/ })).first()).toBeVisible();
    await expect(riya.page.getByText(/Pattern filled/i)).toHaveCount(0);
    await riya.page.getByRole('button', { name: /^Ticket 1\b/ }).first().click();
    await riya.page.getByRole('button', { name: 'Top Line', exact: true }).click();
    const claim = riya.page.getByTestId('claim-screen');
    await expect(claim).toBeVisible();
    // The player picked Top Line, so its row is outlined on the claim screen (TAM-193).
    expect(await cellsWith(claim.getByTestId('phone-ticket'), 'data-outlined')).toEqual([...top].sort((a, b) => a - b));
  });

  test('an older ticket QR (format version 1, made before this change) still opens, with the cue off', async ({ page }, testInfo) => {
    const base = (testInfo.project.use as { baseURL: string }).baseURL;
    await page.goto(HOME);
    const old = V1.browser[0]!;
    await scanTicket(page, new URL(old.link, base).toString());
    await expect(phoneTicket(page, old.ticket)).toBeVisible();
    await expect(page.getByTestId('phone-ticket-header').first()).toContainText(new RegExp(`Ticket ${old.ticket}\\b`));
    await fillTopRow(page, old.ticket);
    await expectNoCue(page, [old.ticket]);
  });

  test('a ticket opened by typed code has the cue off, even when the host turned it on (a scanned QR of the same game has it on)', async ({ page, browser }, testInfo) => {
    await setUpPhoneGame(page, [{ name: 'Riya' }, { name: 'Asha' }], 50, { cue: true });
    const first = await currentHandOut(page);
    await handOutAll(page);
    // Scanned: the cue is on.
    const scanned = await newPhone(browser, testInfo, PORTRAIT);
    await scanned.goto(HOME);
    await scanTicket(scanned, first.payload);
    await fillTopRow(scanned, first.ticket);
    await expect(patternCue(scanned), 'the cue is on in this game').toBeVisible();
    // Typed: the code carries no cue setting, so it is off.
    const typed = await newPhone(browser, testInfo, PORTRAIT);
    await typed.goto(HOME);
    await typeTicketCode(typed, first.code);
    await expect(phoneTicket(typed, first.ticket)).toBeVisible();
    await fillTopRow(typed, first.ticket);
    await expectNoCue(typed, [first.ticket]);
  });
});

// ---------------------------------------------------------------- With the cue on: one slim line

/** The cue's text runs on one line: every piece of its text sits at the same height. */
async function lineCount(player: Page): Promise<number> {
  return patternCue(player).evaluate((el) => {
    const tops: number[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width < 1 || r.height < 1) continue;
        const mid = r.top + r.height / 2;
        if (!tops.some((t) => Math.abs(t - mid) <= r.height / 2)) tops.push(mid);
      }
    }
    return tops.length;
  });
}

/**
 * TAM-195 (row 1a): the cue is one line; it covers no part of any ticket shown; "One at a time" (when shown),
 * "Quick mark" and "Show claim" are wholly on the screen as it first appears and not covered.
 */
async function expectSlimCue(player: Page, where: string) {
  await player.evaluate(() => window.scrollTo(0, 0));
  const cue = patternCue(player);
  await expect(cue, `${where}: the cue line`).toBeVisible();
  expect(await lineCount(player), `${where}: the cue takes one line`).toBe(1);
  const c = (await cue.boundingBox())!;
  const tickets = shownTickets(player);
  for (let i = 0; i < (await tickets.count()); i++) {
    const t = (await tickets.nth(i).boundingBox())!;
    const overlapX = Math.min(c.x + c.width, t.x + t.width) - Math.max(c.x, t.x);
    const overlapY = Math.min(c.y + c.height, t.y + t.height) - Math.max(c.y, t.y);
    expect(overlapX > 1 && overlapY > 1, `${where}: the cue line covers ticket ${await tickets.nth(i).getAttribute('data-ticket')}`).toBe(false);
  }
  const vp = player.viewportSize()!;
  for (const name of ['One at a time', 'Quick mark', 'Show claim']) {
    const b = player.getByRole('button', { name, exact: true });
    if (name === 'One at a time' && (await b.count()) === 0) continue; // a single ticket may have no "One at a time"
    await expect(b, `${where}: "${name}"`).toBeVisible();
    const box = (await b.boundingBox())!;
    expect(box.y >= -0.5 && box.y + box.height <= vp.height + 0.5 && box.x >= -0.5 && box.x + box.width <= vp.width + 0.5,
      `${where}: "${name}" is wholly on the screen (box ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}×${Math.round(box.height)} on ${vp.width}×${vp.height})`).toBe(true);
    expect(await onTopAtCentre(b), `${where}: "${name}" is not covered`).toBe(true);
  }
}

/**
 * Product owner's answer 6 (2 October 2026, docs/handover.md step 3; UX list row 1): at 812 × 375 with 3 tickets and
 * Larger text, all three tickets fit with no scrolling: the page doesn't scroll and every ticket is wholly on screen.
 */
async function expectAllTicketsFit(player: Page, where: string) {
  await player.evaluate(() => window.scrollTo(0, 0));
  expect(await pageFits(player), `${where}: the page scrolls`).toBe(true);
  const vp = player.viewportSize()!;
  const tickets = shownTickets(player);
  expect(await tickets.count(), `${where}: tickets shown`).toBe(3);
  for (let i = 0; i < 3; i++) {
    const b = (await tickets.nth(i).boundingBox())!;
    expect(b.x >= -0.5 && b.y >= -0.5 && b.x + b.width <= vp.width + 0.5 && b.y + b.height <= vp.height + 0.5,
      `${where}: ticket ${await tickets.nth(i).getAttribute('data-ticket')} is wholly on screen (box ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}×${Math.round(b.height)})`).toBe(true);
  }
}

/** Checks the slim line in portrait and landscape (375 × 812), with Larger text off and on. */
async function expectSlimEverywhere(player: Page, tickets: number) {
  for (const larger of [false, true]) {
    if (larger) {
      await player.setViewportSize(SMALL_PORTRAIT);
      await playerMenu(player, 'Larger text');
      await player.keyboard.press('Escape').catch(() => {});
    }
    for (const vp of [SMALL_PORTRAIT, SMALL_LANDSCAPE]) {
      await player.setViewportSize(vp);
      await player.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
      await expectSlimCue(player, `${tickets} ticket(s), ${vp.width} × ${vp.height}, Larger text ${larger ? 'on' : 'off'}`);
      if (larger && tickets === 3 && vp === SMALL_LANDSCAPE) await expectAllTicketsFit(player, '3 tickets, 812 × 375, Larger text on');
    }
  }
}

test.describe('TAM-195 (row 1a): with the cue on, the message is one slim line that never covers a ticket or pushes the buttons off', () => {
  // Riya 3 tickets (1–3), Asha 2 (4–5), Dad 1 (6). Each fills the top row of their last ticket, the one lowest on screen.
  const PLAYERS = [{ name: 'Riya', tickets: 3 }, { name: 'Asha', tickets: 2 }, { name: 'Dad' }];

  for (const [name, count, last] of [['Dad', 1, 6], ['Asha', 2, 5], ['Riya', 3, 3]] as const) {
    test(`${count} ticket(s) on a 375 × 812 phone: portrait and landscape, Larger text off and on`, async ({ page, browser }, testInfo) => {
      test.setTimeout(90_000);
      const handOuts = await phoneGame(page, PLAYERS, 50, { cue: true });
      const player = await playerWith(browser, testInfo, handOuts, name, SMALL_PORTRAIT);
      expect(player.tickets.length).toBe(count);
      await fillTopRow(player.page, last);
      await expect(patternCue(player.page)).toContainText(new RegExp(`Ticket ${last}\\b`));
      // A full top row is also 5 marks: the line names both prizes, in prize order (product owner's answer 2, 2 October 2026).
      expect(await allCueText(player.page)).toMatch(new RegExp(`Ticket ${last}: Early Five and Top Line filled\\. Shout if it['’]s right!`, 'i'));
      await expectSlimEverywhere(player.page, count);
    });
  }

  test('fills on two tickets: one line, "Tickets 1 and 3: patterns filled · More"; "More" shows each one', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, PLAYERS, 50, { cue: true });
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', SMALL_PORTRAIT);
    await fillTopRow(riya.page, 1);
    await fillTopRow(riya.page, 3);
    await expect(patternCue(riya.page)).toContainText(/Tickets 1 and 3\b/);
    await expect(patternCue(riya.page)).toContainText(/patterns filled/i);
    await expect(cueMore(riya.page)).toBeVisible();
    await expectSlimCue(riya.page, '3 tickets, two with fills');
    const all = await allCueText(riya.page);
    // Each ticket names its prizes (product owner's answer 2, 2 October 2026); Early Five is said once (row 11).
    expect(all).toMatch(/Ticket 1: (Early Five and )?Top Line filled/i);
    expect(all).toMatch(/Ticket 3: (Early Five and )?Top Line filled/i);
    expect((all.match(/Early Five/gi) ?? []).length, `Early Five is said at most once in "${all}"`).toBeLessThanOrEqual(1);
    // Never a verdict, never a claim.
    await expect(riya.page.getByText(/accepted|you won|winner|correct|valid claim/i)).toHaveCount(0);
  });
});
