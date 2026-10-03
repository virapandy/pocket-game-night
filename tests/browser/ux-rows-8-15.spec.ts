// UX list of 1 October 2026, rows 8 to 15 (owner approved the behaviour; docs/handover.md step 2b,
// docs/games/tambola/ux-review-2026-10-01-several-tickets.md and ux-review-2026-10-01-action-hierarchy.md).
// Row 12 (holding another player's ticket, at most 3 per phone, TAM-214) is in held-tickets.spec.ts; the 12 px margin
// of "One at a time" (TAM-122, TAM-191) in phone-tickets.spec.ts; the prize chips wrapping (TAM-126) in layout.spec.ts.
// Scenarios: TAM-178 (row 8), TAM-181 (rows 9 and 15), TAM-190 (row 10), TAM-195 (row 11), TAM-125 and TAM-119
// (row 13), TAM-177 (row 14), TAM-117, TAM-132, TAM-183, TAM-193 (row 15), PLT-301.
// Names and test ids: README.md, "UX list of 1 October 2026, rows 8 to 15".
import { expect, test, type Locator, type Page } from './fixtures';
import {
  backgrounds, call, chooseTicketType, contrast, expectAtBottom, expectOneMainButton, fillPlayers, hasLinkLook, hasMainLook, HOME,
  isNeutral, isOutlined, onTopAtCentre, openTambola, openTypedCode, setUpPaperGame, undoToast,
} from './helpers';
import {
  allCueText, cellsWith, claimRefused, claimResult, closePhones, confirmHandOut, fakeCamera, gridOf, handOutScreen, newPhone,
  numbersOf, pageFits, patternCue, phoneGame, phoneTicket, playerWith, PORTRAIT, rowOf, scanClaimButton, setUpPhoneGame,
  shownTickets, showClaim, tapCell, ticketChoice, ticketChoiceOrder,
} from './phone';

test.afterEach(closePhones);

const THREE = [{ name: 'Riya' }, { name: 'Asha' }, { name: 'Dad' }];
/** Riya holds tickets 1–3; 4 tickets in all, so the prizes are Early Five, Top Line and Full House (TAM-081). */
const RIYA_THREE = [{ name: 'Riya', tickets: 3 }, { name: 'Asha' }];

const cancelOn = (p: Page) =>
  p.getByRole('button', { name: 'Cancel', exact: true }).or(p.getByRole('link', { name: 'Cancel', exact: true })).first();

// ---------------------------------------------------------------- Row 8: the host's typed claim form (TAM-178)

const scanner = (host: Page) => host.getByTestId('claim-scanner');
const ticketField = (host: Page) => host.getByLabel('Ticket number', { exact: true });
const enterButton = (host: Page) => host.getByRole('button', { name: 'Enter ticket number', exact: true });
const checkButton = (host: Page) => host.getByRole('button', { name: 'Check', exact: true });
/** A prize button in the typed form: named by the prize, with a ✓ before or after it once chosen. */
const formPrize = (host: Page, prize: string) => {
  const name = new RegExp(`^(✓\\s*)?${prize}(\\s*✓)?$`);
  return scanner(host).getByRole('button', { name }).or(scanner(host).getByRole('radio', { name })).first();
};

/** The controls inside `scope` with the main look (PLT-301), by their words. */
async function mainLookWithin(scope: Locator): Promise<string[]> {
  const all = scope.locator('button, [role="button"], a[href], [role="radio"], [role="switch"]').filter({ visible: true });
  const out: string[] = [];
  for (let i = 0; i < (await all.count()); i++) {
    if (await hasMainLook(all.nth(i))) out.push(((await all.nth(i).getAttribute('aria-label')) || (await all.nth(i).innerText())).replace(/\s+/g, ' ').trim());
  }
  return out;
}

/** TAM-178 wrong input: "Check" gives no verdict and no refusal (it may be greyed out, or a tap does nothing). */
async function checkDoesNothing(host: Page, when: string) {
  const b = checkButton(host);
  if ((await b.isVisible()) && (await b.isEnabled())) {
    await b.click();
    await host.waitForTimeout(500);
  }
  await expect(claimResult(host), `${when}: "Check" gave a verdict`).toHaveCount(0);
  await expect(claimRefused(host), `${when}: "Check" gave a refusal`).toHaveCount(0);
  await expect(ticketField(host), `${when}: the form stays open`).toBeVisible();
}

test.describe('TAM-178 (UX list row 8): the host\'s typed claim form', () => {
  test('with no camera the form opens at once, and "Enter ticket number" is hidden while it is open', async ({ page }) => {
    await fakeCamera(page, 'no-camera');
    await phoneGame(page, THREE);
    await call(page);
    await scanClaimButton(page).click();
    await expect(page.getByText('Enter the ticket number instead')).toBeVisible();
    await expect(ticketField(page)).toBeVisible();
    await expect(enterButton(page), '"Enter ticket number" while its form is already open').toBeHidden();
  });

  test('with a camera, before 10 seconds: "Enter ticket number" opens the form and is then hidden', async ({ page }) => {
    await fakeCamera(page, 'ok');
    await phoneGame(page, THREE);
    await call(page);
    await scanClaimButton(page).click();
    await expect(scanner(page)).toBeVisible();
    await expect(enterButton(page)).toBeVisible();
    await expect(ticketField(page)).toBeHidden();
    await enterButton(page).click();
    await expect(ticketField(page)).toBeVisible();
    await expect(enterButton(page), '"Enter ticket number" while its form is already open').toBeHidden();
  });

  test('the chosen prize shows an outline, a ✓ and a tint, never the look of "Check"; "Check" is the form\'s one main button and works only once ticket and prize are filled', async ({ page }) => {
    await fakeCamera(page, 'no-camera');
    await phoneGame(page, THREE);
    await call(page);
    await scanClaimButton(page).click();
    await expect(ticketField(page)).toBeVisible();

    // Wrong input: nothing filled; a ticket number only; a prize only.
    await checkDoesNothing(page, 'nothing filled in');
    await ticketField(page).fill('1');
    await checkDoesNothing(page, 'a ticket number but no prize');
    await ticketField(page).fill('');
    await formPrize(page, 'Top Line').click();
    await checkDoesNothing(page, 'a prize but no ticket number');

    // The chosen prize: chosen, ✓, outlined, tinted; never the main look. The others: never the main look either.
    const chosen = formPrize(page, 'Top Line');
    const state = await chosen.evaluate((e) => e.getAttribute('aria-pressed') ?? e.getAttribute('aria-checked') ?? e.getAttribute('aria-selected'));
    expect(state, 'the chosen prize says it is chosen (aria-pressed, aria-checked or aria-selected "true")').toBe('true');
    await expect(chosen, 'the chosen prize shows a ✓').toContainText('✓');
    expect(await hasMainLook(chosen), 'the chosen prize looks like "Check" (the main look)').toBe(false);
    expect(await isOutlined(chosen), 'the chosen prize is outlined').toBe(true);
    const other = formPrize(page, 'Early Five');
    await expect(other).not.toContainText('✓');
    expect(await hasMainLook(other)).toBe(false);
    const bg = (l: Locator) => l.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(await bg(chosen), 'the chosen prize has a light tint the others don\'t').not.toBe(await bg(other));

    // Both filled: "Check" works, and it is the only main look in the form.
    await ticketField(page).fill('1');
    await expect(checkButton(page)).toBeEnabled();
    expect(await mainLookWithin(scanner(page)), 'the controls with the main look in the typed form').toEqual(['Check']);
    await checkButton(page).click();
    await expect(claimResult(page).or(claimRefused(page)).first(), 'a verdict once ticket and prize are filled').toBeVisible({ timeout: 2000 });
  });
});

// ---------------------------------------------------------------- Rows 9 and 15: hand-out (TAM-181, TAM-132)

const paperLink = (page: Page) => {
  const name = /^Can.t scan\? Give a paper ticket/;
  return page.getByRole('link', { name }).or(page.getByRole('button', { name })).first();
};

test.describe('TAM-181 (UX list row 9): the hand-out screen', () => {
  test('"Next ticket", then "Start calling", is full width at the bottom, the one main button; "Can\'t scan? Give a paper ticket" is a link just above it', async ({ page }) => {
    await setUpPhoneGame(page, [{ name: 'Riya' }, { name: 'Asha' }]);
    const vw = page.viewportSize()!.width;
    for (const name of ['Next ticket', 'Start calling']) {
      const main = page.getByRole('button', { name, exact: true });
      await expect(main).toBeVisible();
      const b = await expectAtBottom(page, main, `"${name}"`);
      expect(b.x, `"${name}" reaches the left side (full width)`).toBeLessThanOrEqual(24);
      expect(vw - (b.x + b.width), `"${name}" reaches the right side (full width)`).toBeLessThanOrEqual(24);
      expect(await onTopAtCentre(main), `"${name}" is not covered`).toBe(true);
      await expectOneMainButton(page, `hand-out with "${name}"`, name, true);

      const link = paperLink(page);
      await expect(link).toBeVisible();
      expect(await hasLinkLook(link), '"Can\'t scan? Give a paper ticket" looks like a link (no fill, no border)').toBe(true);
      const l = (await link.boundingBox())!;
      expect(l.y + l.height, 'the link is above the main button').toBeLessThanOrEqual(b.y + 0.5);
      expect(b.y - (l.y + l.height), 'the link is just above the main button (within 40 px)').toBeLessThanOrEqual(40);
      expect(l.height, 'the link is still at least 44 px tall to tap (TAM-104)').toBeGreaterThanOrEqual(44);
      if (name === 'Next ticket') await main.click();
    }
  });
});

test('TAM-132 (UX list row 15): the waiting line reads "Waiting: Riya (2 tickets), Asha (1 ticket), Dad (1 ticket)", counting what each still waits for', async ({ page }) => {
  await setUpPhoneGame(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }, { name: 'Dad' }]);
  const waiting = handOutScreen(page).getByTestId('hand-out-waiting');
  const text = async () => ((await waiting.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  await expect.poll(text).toMatch(/Waiting:\s*Riya \(2 tickets\),\s*Asha \(1 ticket\),\s*Dad \(1 ticket\)/);
  await confirmHandOut(page);
  await expect.poll(text).toMatch(/Waiting:\s*Riya \(1 ticket\),\s*Asha \(1 ticket\),\s*Dad \(1 ticket\)/);
  await confirmHandOut(page);
  await expect.poll(text).toMatch(/Waiting:\s*Asha \(1 ticket\),\s*Dad \(1 ticket\)/);
  expect(await text()).not.toContain('Riya');
});

test('TAM-181 (UX list row 15): on the Tambola start screen "New game" is at the bottom, like every step', async ({ page }) => {
  await openTambola(page);
  const ng = page.getByRole('button', { name: 'New game', exact: true });
  await expectAtBottom(page, ng, '"New game"');
  expect(await onTopAtCentre(ng), '"New game" is not covered').toBe(true);
});

test('TAM-183 (UX list row 15): "Remove" on the prizes step is a neutral grey, never the main action\'s red, and still readable', async ({ page }) => {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await chooseTicketType(page, 'paper');
  await fillPlayers(page, ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani']);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
  const removes = page.getByRole('button', { name: /Remove/ }).filter({ visible: true });
  expect(await removes.count(), 'a remove control per removable tier').toBeGreaterThan(0);
  for (const r of await removes.all()) {
    const label = ((await r.getAttribute('aria-label')) || (await r.innerText())).trim();
    const look = await backgrounds(r);
    expect(isNeutral(look.color), `"${label}": its words are ${look.color}, not a neutral grey`).toBe(true);
    expect(await hasMainLook(r), `"${label}" has the main look`).toBe(false);
    expect(contrast(look.color, look.own), `"${label}": contrast of its words`).toBeGreaterThanOrEqual(4.5);
    const border = await r.evaluate((e) => {
      const s = getComputedStyle(e);
      return parseFloat(s.borderTopWidth) >= 1 && s.borderTopStyle !== 'none' ? s.borderTopColor : null;
    });
    if (border && !/rgba\([^)]*,\s*0\)$/.test(border)) expect(isNeutral(border), `"${label}": its border is ${border}, not grey`).toBe(true);
  }
});

// ---------------------------------------------------------------- Row 10: "Which ticket?" (TAM-190)

test.describe('TAM-190 (UX list row 10): "Which ticket?" shows a small picture of each ticket', () => {
  test('cue off: each choice holds a small picture of its ticket with her marks, in ticket order, none "Pattern filled", all on one 390 × 844 screen', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, RIYA_THREE);
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const [t1, t2, t3] = riya.tickets as [number, number, number];
    const fullHeight = (await phoneTicket(riya.page, t1).boundingBox())!.height;
    const mark = numbersOf(riya.grids.get(t2)!)[0]!;
    await tapCell(riya.page, t2, mark);
    // A full top row on ticket 3: with the cue off, nothing points it out, here either (TAM-195).
    for (const n of rowOf(riya.grids.get(t3)!, 0)) await tapCell(riya.page, t3, n);

    await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
    await expect(riya.page.getByText(/Which ticket\?/)).toBeVisible();
    expect(await ticketChoiceOrder(riya.page), 'the choices, in the order shown').toEqual([t1, t2, t3]);
    for (const t of [t1, t2, t3]) {
      const pic = ticketChoice(riya.page, t).getByTestId('ticket-picture');
      await expect(pic, `a small picture of ticket ${t} in its choice`).toBeVisible();
      await expect(pic).toHaveAttribute('data-ticket', String(t));
      expect(await gridOf(pic), `the picture of ticket ${t} shows its numbers`).toEqual(riya.grids.get(t));
      expect((await pic.boundingBox())!.height, `the picture of ticket ${t} is small (at most 60% of the full ticket's height)`).toBeLessThanOrEqual(fullHeight * 0.6);
    }
    expect(await cellsWith(ticketChoice(riya.page, t2).getByTestId('ticket-picture'), 'data-marked'), 'her mark shows in the picture').toEqual([mark]);
    expect(await cellsWith(ticketChoice(riya.page, t1).getByTestId('ticket-picture'), 'data-marked')).toEqual([]);
    await expect(riya.page.getByText(/Pattern filled/i), 'with the cue off nothing says "Pattern filled"').toHaveCount(0);
    expect(await pageFits(riya.page), 'every choice fits the screen with no scrolling').toBe(true);
    const vp = riya.page.viewportSize()!;
    for (const t of [t1, t2, t3]) {
      const b = (await ticketChoice(riya.page, t).boundingBox())!;
      expect(b.y >= -0.5 && b.y + b.height <= vp.height + 0.5, `the choice for ticket ${t} is wholly on the screen`).toBe(true);
    }
    // Picking still works as before.
    await ticketChoice(riya.page, t2).click();
    await riya.page.getByRole('button', { name: 'Early Five', exact: true }).click();
    await expect(riya.page.getByTestId('claim-screen').getByTestId('phone-ticket')).toHaveAttribute('data-ticket', String(t2));
  });

  test('cue on: the ticket the pattern message names first is listed first, marked "Pattern filled"', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, RIYA_THREE, 50, { cue: true });
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const [t1, t2, t3] = riya.tickets as [number, number, number];
    for (const n of rowOf(riya.grids.get(t3)!, 0)) await tapCell(riya.page, t3, n);
    await expect(patternCue(riya.page)).toContainText(new RegExp(`Ticket ${t3}\\b`));

    await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
    await expect(riya.page.getByText(/Which ticket\?/)).toBeVisible();
    const order = await ticketChoiceOrder(riya.page);
    expect(order[0], 'the ticket the message named is listed first').toBe(t3);
    expect([...order].sort((a, b) => a - b)).toEqual([t1, t2, t3]);
    await expect(ticketChoice(riya.page, t3)).toContainText(/Pattern filled/);
    for (const t of [t1, t2]) await expect(ticketChoice(riya.page, t)).not.toContainText(/Pattern filled/);
    await cancelOn(riya.page).click();
    await expect(phoneTicket(riya.page, t3)).toBeVisible();

    // Fills on two tickets: the one the line names first comes first.
    for (const n of rowOf(riya.grids.get(t2)!, 0)) await tapCell(riya.page, t2, n);
    const line = ((await patternCue(riya.page).textContent()) ?? '').replace(/\s+/g, ' ');
    const first = Number(line.match(/Tickets? (\d+)/)?.[1]);
    expect([t2, t3], `the cue line "${line}" names ticket ${t2} or ${t3} first`).toContain(first);
    await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
    expect((await ticketChoiceOrder(riya.page))[0], `"${line}" names ticket ${first} first`).toBe(first);
    await expect(ticketChoice(riya.page, first)).toContainText(/Pattern filled/);
  });
});

// ---------------------------------------------------------------- Row 11: the cue's outline and Early Five (TAM-195)

/** The width of the line drawn around an element: its border, CSS outline, or box-shadow spread, whichever is widest. */
function lineWidthIn(el: Element): number {
  const s = getComputedStyle(el);
  let w = 0;
  for (const k of ['top', 'right', 'bottom', 'left']) {
    const st = s.getPropertyValue(`border-${k}-style`);
    if (st !== 'none' && st !== 'hidden') w = Math.max(w, parseFloat(s.getPropertyValue(`border-${k}-width`)) || 0);
  }
  if (s.outlineStyle !== 'none') w = Math.max(w, parseFloat(s.outlineWidth) || 0);
  if (s.boxShadow && s.boxShadow !== 'none') {
    for (const part of s.boxShadow.split(/,(?![^(]*\))/)) {
      const px = part.replace(/rgba?\([^)]*\)/g, '').match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
      if (px.length >= 4) w = Math.max(w, px[3]!);
    }
  }
  return w;
}

test.describe('TAM-195 (UX list row 11): with the cue on, the outline is not colour alone; Early Five is said once', () => {
  test('every outlined cell has a thicker line (at least 4 px; it was 3) and a corner mark ("cue-mark"); no other cell has a corner mark', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, THREE, 50, { cue: true });
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const grid = riya.grids.get(1)!;
    const top = rowOf(grid, 0);
    for (const n of top) await tapCell(riya.page, 1, n);
    await tapCell(riya.page, 1, rowOf(grid, 2)[0]!); // a marked cell outside the top row
    await expect(patternCue(riya.page)).toBeVisible();
    const ticket = phoneTicket(riya.page, 1);
    const cue = await cellsWith(ticket, 'data-cue');
    expect(cue, 'the top row is outlined').toEqual(expect.arrayContaining([...top]));
    const outlineEls = ticket.getByTestId('cue-outline');
    const outlineWidths = await outlineEls.evaluateAll((els, fn) => els.map((e) => new Function('return ' + fn)()(e) as number), lineWidthIn.toString());
    for (const n of cue) {
      const c = ticket.locator(`[data-number="${n}"]`);
      const own = await c.evaluate((e, fn) => new Function('return ' + fn)()(e) as number, lineWidthIn.toString());
      expect(Math.max(own, ...outlineWidths), `cell ${n}: the outline is thicker than 3 CSS px, at least 4 (its own line, or a "cue-outline" in the ticket)`).toBeGreaterThanOrEqual(4);
      await expect(c.getByTestId('cue-mark'), `cell ${n} has a corner mark`).toBeVisible();
    }
    const plain = await ticket.locator('[data-cell]:not([data-cue="true"])').all();
    for (const c of plain) await expect(c.getByTestId('cue-mark'), 'a cell outside the pattern has a corner mark').toHaveCount(0);
  });

  test('Early Five on two tickets is said once: "Early Five filled on ticket 1"', async ({ page, browser }, testInfo) => {
    const handOuts = await phoneGame(page, RIYA_THREE, 50, { cue: true }); // Early Five, Top Line, Full House: no middle line
    const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
    const [t1, t2] = riya.tickets as [number, number];
    for (const n of rowOf(riya.grids.get(t1)!, 1)) await tapCell(riya.page, t1, n); // 5 marks, no prize row
    let all = await allCueText(riya.page);
    expect(all).toMatch(new RegExp(`Early Five filled on ticket ${t1}\\b`, 'i'));
    expect(all.match(/Early Five/gi) ?? [], `Early Five is said once in "${all}"`).toHaveLength(1);
    for (const n of rowOf(riya.grids.get(t2)!, 1)) await tapCell(riya.page, t2, n);
    all = await allCueText(riya.page);
    expect(all.match(/Early Five/gi) ?? [], `Early Five is said once, with 5 marks on two tickets, in "${all}"`).toHaveLength(1);
    expect(all).toMatch(new RegExp(`Early Five filled on ticket ${t1}\\b`, 'i')); // the first ticket only, never "on tickets 1 and 2"
    expect(all).not.toMatch(/on tickets\b/i);
  });
});

// ---------------------------------------------------------------- Row 13: the undo toast (TAM-125, TAM-119)

/** The toast's colour as seen (its background over what is behind it), what is behind it, and every text colour in it. */
const toastColours = (toast: Locator) =>
  toast.evaluate((el) => {
    const parse = (c: string) => { const m = c.match(/[\d.]+/g) ?? ['0', '0', '0', '0']; return [+m[0]!, +m[1]!, +m[2]!, m[3] === undefined ? 1 : +m[3]] as const; };
    let behind = [255, 255, 255, 1] as readonly number[];
    for (let e = el.parentElement; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c[3] >= 0.9) { behind = c; break; }
    }
    const own = parse(getComputedStyle(el).backgroundColor);
    const a = own[3] * Number(getComputedStyle(el).opacity);
    const seen = [0, 1, 2].map((i) => Math.round(own[i]! * a + behind[i]! * (1 - a)));
    const texts: string[] = [];
    for (const e of [el, ...Array.from(el.querySelectorAll('*'))]) {
      if (Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim())) texts.push(getComputedStyle(e).color);
    }
    return { seen: `rgb(${seen.join(', ')})`, behind: `rgb(${behind.slice(0, 3).join(', ')})`, texts };
  });

test.describe('TAM-125 and TAM-119 (UX list row 13): the undo toast is a light bar, with room above the button below it', () => {
  for (const kind of ['phone', 'paper'] as const) {
    test(`${kind} tickets: lighter than a main button (under 3:1 against the screen), words at 4.5:1, and at least 16 px above "${kind === 'phone' ? 'Scan a claim' : 'Record a win'}"`, async ({ page }) => {
      if (kind === 'phone') await phoneGame(page, THREE);
      else await setUpPaperGame(page);
      await call(page);
      await call(page);
      const toast = undoToast(page);
      await expect(toast).toBeVisible();
      const below = kind === 'phone' ? scanClaimButton(page) : page.getByRole('button', { name: 'Record a win' });
      const t = (await toast.boundingBox())!, b = (await below.boundingBox())!;
      expect(b.y - (t.y + t.height), 'space between the toast and the button below it').toBeGreaterThanOrEqual(16);
      const c = await toastColours(toast);
      expect(contrast(c.seen, c.behind), `the toast (${c.seen}) stands out from the screen (${c.behind}) like a main button`).toBeLessThan(3);
      for (const tc of c.texts) expect(contrast(tc, c.seen), `the toast's words (${tc} on ${c.seen})`).toBeGreaterThanOrEqual(4.5);
    });
  }
});

// ---------------------------------------------------------------- Row 14: "Which prize?" Cancel (TAM-177)

test('TAM-177 (UX list row 14): on "Which prize?" "Cancel" is a link, not a prize-like button; it goes back with no claim QR', async ({ page, browser }, testInfo) => {
  const handOuts = await phoneGame(page, THREE);
  const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
  await riya.page.getByRole('button', { name: 'Show claim', exact: true }).click();
  await expect(riya.page.getByRole('button', { name: 'Top Line', exact: true })).toBeVisible();
  const cancel = cancelOn(riya.page);
  await expect(cancel).toBeVisible();
  expect(await hasLinkLook(cancel), '"Cancel" looks like a link (no fill, no border)').toBe(true);
  expect(await hasLinkLook(riya.page.getByRole('button', { name: 'Top Line', exact: true })), 'a prize still looks like a button').toBe(false);
  await cancel.click();
  await expect(riya.page.getByTestId('claim-qr')).toHaveCount(0);
  await expect(phoneTicket(riya.page, 1)).toBeVisible();
  await expect(riya.page.getByRole('button', { name: 'Show claim', exact: true })).toBeVisible();
});

// ---------------------------------------------------------------- Row 15: polish (TAM-193, TAM-117)

test('TAM-193 (UX list row 15): "Done" under the claim QR is outlined, never the main look', async ({ page, browser }, testInfo) => {
  const handOuts = await phoneGame(page, THREE);
  const riya = await playerWith(browser, testInfo, handOuts, 'Riya', PORTRAIT);
  await showClaim(riya.page, 'Top Line');
  const screen = riya.page.getByTestId('claim-screen');
  const done = screen.getByRole('button', { name: 'Done', exact: true });
  await expect(done).toBeVisible();
  expect(await hasMainLook(done), '"Done" has the main look').toBe(false);
  expect(await isOutlined(done), '"Done" is outlined').toBe(true);
  const qr = (await screen.getByTestId('claim-qr').boundingBox())!;
  expect((await done.boundingBox())!.y, '"Done" is under the QR').toBeGreaterThanOrEqual(qr.y + qr.height - 1);
});

/** The field's hint: its placeholder, or the text it is described by. */
const hintOf = (field: Locator) =>
  field.evaluate((el) => (el.getAttribute('placeholder') || (el.getAttribute('aria-describedby') ?? '').split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ')).trim());
/** A pattern hint made only of X's and dashes ("XXXX-XXXX-XXXX-XXXX-XXXX", or "XXXX-XXXX-…"), never a real-looking code. */
const PATTERN_HINT = /^X{4}(-X{4})*(-?(…|\.\.\.))?$/;

test('TAM-117 (UX list row 15): the code field shows a pattern hint of X\'s; a phone with tickets adds one more with "Add a ticket by code"', async ({ page, browser }, testInfo) => {
  const handOuts = await phoneGame(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
  const [first, second] = handOuts.filter((h) => h.player === 'Riya') as [typeof handOuts[0], typeof handOuts[0]];
  const phone = await newPhone(browser, testInfo, PORTRAIT);
  await phone.goto(HOME);
  await openTypedCode(phone);
  const field = phone.getByLabel('Ticket code', { exact: true });
  expect(await hintOf(field), 'the code field\'s hint').toMatch(PATTERN_HINT);
  await field.fill(first.code);
  await phone.getByRole('button', { name: 'Open ticket', exact: true }).click();
  await expect(phoneTicket(phone, first.ticket)).toBeVisible();

  // On the ticket screen: the menu offers "Add a ticket by code", not "Enter a ticket code".
  await phone.getByRole('button', { name: /Menu/ }).click();
  const add = phone.getByRole('menuitem', { name: 'Add a ticket by code', exact: true }).or(phone.getByRole('button', { name: 'Add a ticket by code', exact: true })).first();
  await expect(add).toBeVisible();
  await expect(phone.getByText('Enter a ticket code', { exact: true })).toHaveCount(0);
  await add.click();
  expect(await hintOf(phone.getByLabel('Ticket code', { exact: true })), 'the same hint when adding a ticket').toMatch(PATTERN_HINT);
  await phone.getByLabel('Ticket code', { exact: true }).fill(second.code);
  await phone.getByRole('button', { name: 'Open ticket', exact: true }).click();
  await expect(shownTickets(phone)).toHaveCount(2);
  await expect(phoneTicket(phone, second.ticket)).toBeVisible();
});
