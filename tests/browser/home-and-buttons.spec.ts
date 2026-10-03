// The UX list of 1 October 2026 (docs/handover.md step 2b, behaviour approved by the owner): Home with two equal
// choices (PLT-300, TAM-057), paper or phone as two equal cards (TAM-213), one main button per screen (PLT-301, UX
// guideline 17a), "Keep playing" as the End game question's main button (TAM-103, TAM-124), "Play again" outlined
// (TAM-197). On a 390 × 844 screen. Names and test ids: README.md, "UX list of 1 October 2026".
import { expect, test, type Locator, type Page } from './fixtures';
import {
  callMany, expectOneMainButton, fillPlayers, fromMenu, hasMainLook, HOME, hostAGame, isOutlined, joinWithMyTicket,
  mainLookButtons, menuButton, nextNumber, openTambola, openTypedCode, setUpPaperGame, ticketCard, winEverythingAndEnd,
  THREE_TIERS,
} from './helpers';
import { closePhones, currentHandOut, newPhone, phoneGame, phoneTicket, playerWith, PORTRAIT, setUpPhoneGame } from './phone';

test.use({ viewport: { width: 390, height: 844 } });
test.afterEach(closePhones);

const READY = /You['’]re ready for game night/;

/** The one-time iPhone tip (TAM-118) may show on a first visit: put it away so the screen can be read. */
async function dismissInstallTip(page: Page) {
  const tip = page.getByTestId('install-tip');
  if (await tip.isVisible().catch(() => false)) await tip.getByRole('button', { name: /^(Got it|Close|OK)/ }).first().click();
}

/** A card or option is shown as chosen: aria-pressed or aria-checked "true" (TAM-213, PLT-301). */
const isChosen = (l: Locator) =>
  l.evaluate((el) => el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-selected') === 'true');

/** Two controls look equal: the same size (within 2 px) and the same background and border colour. */
async function expectEqual(a: Locator, b: Locator, what: string) {
  const ba = (await a.boundingBox())!, bb = (await b.boundingBox())!;
  expect(Math.abs(ba.width - bb.width), `${what}: same width`).toBeLessThanOrEqual(2);
  expect(Math.abs(ba.height - bb.height), `${what}: same height`).toBeLessThanOrEqual(2);
  const look = (l: Locator) => l.evaluate((el) => { const s = getComputedStyle(el); return `${s.backgroundColor} / ${s.borderTopColor} / ${s.borderTopWidth} / ${s.fontWeight}`; });
  expect(await look(a), `${what}: the same look`).toBe(await look(b));
}

// ---------------------------------------------------------------- PLT-300 and TAM-057: Home

test.describe('PLT-300: Home: "Host a game" and "Join with my ticket"', () => {
  test('TAM-057: a first visit says "You\'re ready for game night"; the two choices are equal cards, neither in the main look, each saying what it is for', async ({ page }) => {
    await page.goto(HOME);
    await expect(page.getByText(READY).first()).toBeVisible();
    await dismissInstallTip(page);
    await expect(hostAGame(page)).toBeVisible();
    await expect(joinWithMyTicket(page)).toBeVisible();
    await expectEqual(hostAGame(page), joinWithMyTicket(page), 'Host a game and Join with my ticket');
    expect(await hasMainLook(hostAGame(page)), '"Host a game" has the main look').toBe(false);
    expect(await hasMainLook(joinWithMyTicket(page)), '"Join with my ticket" has the main look').toBe(false);
    await expect(hostAGame(page)).toContainText(/this phone/i);
    await expect(joinWithMyTicket(page)).toContainText(/QR|code/i);
    await expectOneMainButton(page, 'Home', null);
  });

  test('TAM-057: "You\'re ready for game night" shows on the first visit only, not when the app is opened again', async ({ page }) => {
    // Product owner's answer 3 (2 October 2026, docs/handover.md step 3): first visit only.
    await page.goto(HOME);
    await expect(page.getByText(READY).first()).toBeVisible();
    await dismissInstallTip(page);
    await page.reload();
    await expect(hostAGame(page)).toBeVisible();
    await expect(page.getByText(READY), 'the second visit still says "You\'re ready for game night"').toHaveCount(0);
    await page.goto(HOME);
    await expect(hostAGame(page)).toBeVisible();
    await expect(page.getByText(READY)).toHaveCount(0);
  });

  test('Sessions, History, Report a problem and Settings are still reachable from Home (directly or in its menu)', async ({ page }) => {
    for (const name of ['Sessions', 'History', 'Report a problem', 'Settings']) {
      await page.goto(HOME);
      await dismissInstallTip(page);
      await expect(hostAGame(page)).toBeVisible();
      const item = page.getByRole('menuitem', { name, exact: true }).or(page.getByRole('button', { name, exact: true })).first();
      if (!(await item.isVisible())) await menuButton(page).first().click();
      await expect(item, `"${name}" from Home`).toBeVisible();
    }
  });

  test('"Host a game" opens the Tambola start screen', async ({ page }) => {
    await page.goto(HOME);
    await dismissInstallTip(page);
    await hostAGame(page).click();
    const tambola = page.getByRole('button', { name: /^Tambola/ });
    const newGame = page.getByRole('button', { name: 'New game' });
    await expect(newGame.or(tambola).first()).toBeVisible();
    if (!(await newGame.isVisible())) await tambola.first().click(); // a game picker may come first
    await expect(newGame).toBeVisible();
  });

  test('"Join with my ticket" offers the camera and "Type the code"; typing the host\'s code opens the ticket; a wrong code is refused', async ({ page, browser }, testInfo) => {
    await setUpPhoneGame(page, [{ name: 'Riya' }, { name: 'Asha' }]);
    const h = await currentHandOut(page);
    const guest = await newPhone(browser, testInfo, PORTRAIT);
    await guest.goto(HOME);
    await dismissInstallTip(guest);
    await joinWithMyTicket(guest).click();
    await expect(guest.getByText(/camera/i).first(), 'scanning the host\'s QR with the camera is offered').toBeVisible();
    await expect(guest.getByRole('button', { name: /^Type the code/ })).toBeVisible();
    await guest.getByRole('button', { name: /^Type the code/ }).click();
    await guest.getByLabel('Ticket code', { exact: true }).fill(h.code);
    await guest.getByRole('button', { name: 'Open ticket', exact: true }).click();
    await expect(phoneTicket(guest, h.ticket)).toBeVisible();
    // Wrong input: a code that is not a ticket.
    const other = await newPhone(browser, testInfo, PORTRAIT);
    await other.goto(HOME);
    await dismissInstallTip(other);
    await openTypedCode(other);
    await other.getByLabel('Ticket code', { exact: true }).fill('ABCD-EFGH-JKMN');
    await other.getByRole('button', { name: 'Open ticket', exact: true }).click();
    await expect(other.getByRole('alert')).toBeVisible();
    await expect(other.getByTestId('phone-ticket')).toHaveCount(0);
  });

  test('unfinished games are plain rows below the two choices, with no main-look button; one tap still goes back in', async ({ page }) => {
    await setUpPaperGame(page);
    await callMany(page, 2);
    await page.goto(HOME);
    await dismissInstallTip(page);
    const list = page.getByTestId('unfinished-games');
    await expect(list).toBeVisible();
    await expect(hostAGame(page)).toBeVisible();
    await expect(joinWithMyTicket(page)).toBeVisible();
    const top = (await list.boundingBox())!.y;
    for (const card of [hostAGame(page), joinWithMyTicket(page)]) {
      const b = (await card.boundingBox())!;
      expect(b.y + b.height, 'the two choices sit above the unfinished games').toBeLessThanOrEqual(top + 0.5);
    }
    const controls = list.locator('button, [role="button"], a[href]').filter({ visible: true });
    for (let i = 0; i < (await controls.count()); i++) {
      expect(await hasMainLook(controls.nth(i)), `"${(await controls.nth(i).innerText()).trim()}" in the unfinished games has the main look`).toBe(false);
    }
    await expectOneMainButton(page, 'Home with an unfinished game', null);
    // Product owner's answer 1 (2 October 2026, docs/handover.md step 3): the words stay "Tap to resume" (PLT-004).
    await list.getByText('Tap to resume', { exact: true }).first().click();
    await expect(nextNumber(page)).toBeVisible();
  });
});

// ---------------------------------------------------------------- TAM-213: paper or phone

test.describe('TAM-213: paper or phone tickets, two equal cards, neither chosen in advance', () => {
  test('the start screen says "Housie on paper or on phones"; the cards are equal, each with its explanation, neither chosen', async ({ page }) => {
    await openTambola(page);
    await expect(page.getByText('Housie on paper or on phones').first()).toBeVisible();
    await expect(page.getByText(/Housie with paper tickets/)).toHaveCount(0);
    await page.getByRole('button', { name: 'New game' }).click();
    const paper = ticketCard(page, 'paper'), phone = ticketCard(page, 'phone');
    await expect(paper).toBeVisible();
    await expect(phone).toBeVisible();
    await expect(paper).toContainText('Always works. Print or bring tickets.');
    await expect(phone).toContainText('Each player gets their ticket on their phone. Everyone must have opened the link once.');
    await expectEqual(paper, phone, 'the paper and phone cards');
    for (const [card, name] of [[paper, 'paper'], [phone, 'phone']] as const) {
      expect(await isChosen(card), `the ${name} card is chosen in advance`).toBe(false);
      await expect(card, `the ${name} card shows a ✓ before anything is chosen`).not.toContainText('✓');
      expect(await hasMainLook(card), `the ${name} card has the main look`).toBe(false);
    }
    await expectOneMainButton(page, 'ticket-type step, nothing chosen', 'Next');
  });

  test('tapping a card marks it chosen with an outline, a ✓ and a tint, never the main look; "Next" is the main button and moves on', async ({ page }) => {
    await openTambola(page);
    await page.getByRole('button', { name: 'New game' }).click();
    const paper = ticketCard(page, 'paper'), phone = ticketCard(page, 'phone');
    const bgOf = (l: Locator) => l.evaluate((el) => getComputedStyle(el).backgroundColor);
    const unchosenBg = await bgOf(phone);
    await paper.click();
    await expect(paper, 'the ticket-type step stays until "Next"').toBeVisible();
    expect(await isChosen(paper)).toBe(true);
    expect(await isChosen(phone)).toBe(false);
    await expect(paper).toContainText('✓');
    await expect(phone).not.toContainText('✓');
    expect(await isOutlined(paper), 'the chosen card is outlined, not in the main look').toBe(true);
    expect(await bgOf(paper), 'the chosen card has a light tint').not.toBe(unchosenBg);
    await expectOneMainButton(page, 'ticket-type step, paper chosen', 'Next', true);
    // Only one is ever chosen.
    await phone.click();
    expect(await isChosen(phone)).toBe(true);
    expect(await isChosen(paper)).toBe(false);
    await expect(paper).not.toContainText('✓');
    expect(await hasMainLook(phone)).toBe(false);
    await expectOneMainButton(page, 'ticket-type step, phone chosen', 'Next', true);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByLabel('Number of players')).toBeVisible();
  });

  test('wrong input: "Next" before choosing a card does not move on', async ({ page }) => {
    await openTambola(page);
    await page.getByRole('button', { name: 'New game' }).click();
    const next = page.getByRole('button', { name: 'Next', exact: true });
    await expect(next).toBeVisible();
    if (await next.isEnabled()) await next.click();
    await expect(page.getByLabel('Number of players')).toHaveCount(0);
    await expect(ticketCard(page, 'paper')).toBeVisible();
  });
});

// ---------------------------------------------------------------- PLT-301: one main button per screen

test.describe('PLT-301: one main button per screen, and it is the next step', () => {
  test('host: setup, calling, the End game and Discard questions', async ({ page }) => {
    await page.goto(HOME);
    await dismissInstallTip(page);
    await expectOneMainButton(page, 'Home', null);
    await openTambola(page);
    await expectOneMainButton(page, 'Tambola start', 'New game');
    await page.getByRole('button', { name: 'New game' }).click();
    await ticketCard(page, 'paper').click();
    await expect(ticketCard(page, 'paper'), 'the ticket-type step stays until "Next" (TAM-213)').toBeVisible();
    await expectOneMainButton(page, 'ticket type (paper chosen)', 'Next', true);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await fillPlayers(page, ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani']);
    await expectOneMainButton(page, 'players', 'Next', true);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByLabel('Contribution per ticket').fill('50');
    await expectOneMainButton(page, 'contribution', 'Next', true);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
    await expectOneMainButton(page, 'prizes', 'Confirm prizes', true);
  });

  test('TAM-103 and TAM-124: the End game question\'s main button is "Keep playing"; "End game" is outlined; "Discard" is never the main look', async ({ page }) => {
    await setUpPaperGame(page);
    await callMany(page, 3);
    // "Next number" rests for a moment after each call (greyed while it does): check it once it is ready again.
    await expect(nextNumber(page)).toBeEnabled();
    await expectOneMainButton(page, 'calling', 'Next number', true);
    await fromMenu(page, 'End game');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('End the game and show payouts?')).toBeVisible();
    await expectOneMainButton(page, 'the End game question', 'Keep playing', true);
    const end = dialog.getByRole('button', { name: 'End game', exact: true });
    expect(await hasMainLook(end), '"End game" has the main look').toBe(false);
    expect(await isOutlined(end), '"End game" is outlined').toBe(true);
    await dialog.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(nextNumber(page)).toBeVisible();
    await fromMenu(page, 'Discard game');
    const discard = page.getByRole('dialog').getByRole('button', { name: /^Discard/ });
    await expect(discard.first()).toBeVisible();
    expect(await hasMainLook(discard.first()), '"Discard…" has the main look').toBe(false);
  });

  test('TAM-197 and TAM-089: on the payout screen "Play again" is outlined, not the main look; "Settle with host" is the main look until a tab is opened', async ({ page }) => {
    await setUpPaperGame(page, { players: ['Riya', 'Asha', 'Dad'] });
    await winEverythingAndEnd(page, 'Riya', THREE_TIERS);
    const again = page.getByRole('button', { name: 'Play again', exact: true });
    await expect(again).toBeVisible();
    expect(await hasMainLook(again), '"Play again" has the main look').toBe(false);
    expect(await isOutlined(again), '"Play again" is outlined').toBe(true);
    const main = await mainLookButtons(page);
    expect(main.length, `controls with the main look on the payout screen: ${JSON.stringify(main)}`).toBeLessThanOrEqual(1);
    // Product owner's answer 5 (2 October 2026, docs/handover.md step 3; TAM-089, UX list row 5): until a settle tab is
    // opened, "Settle with host" is the screen's one main button.
    expect(main.length === 1 && main[0]!.startsWith('Settle with host'), `"Settle with host" has the main look until a settle tab is opened; main look on: ${JSON.stringify(main)}`).toBe(true);
  });

  test('player: the tickets screen and "One at a time": "Show claim" is the one main button; a chosen tab is never the main look', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, [{ name: 'Riya', tickets: 3 }, { name: 'Asha' }]);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    await expectOneMainButton(riya.page, 'player tickets', 'Show claim', true);
    await riya.page.getByRole('button', { name: 'One at a time', exact: true }).click();
    await expectOneMainButton(riya.page, 'player, one at a time', 'Show claim', true);
  });
});
