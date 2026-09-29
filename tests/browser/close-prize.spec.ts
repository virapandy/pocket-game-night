// After a win, closing the prize is the main action (family play-test, 30 September 2026,
// docs/games/tambola/changes-2026-09-30-playtest.md section 1): TAM-198, with TAM-145, TAM-100 and TAM-070.
// Owner, 2026-09-30 (docs/decisions.md): while dimmed, "Add another winner", the chip's Close and the menu still work.
// On a 390 × 844 screen. Names and test ids: tests/browser/README.md ("After a recorded win").
import { expect, test, type Locator, type Page } from './fixtures';
import {
  calledCount, callMany, currentNumber, fromMenu, mainButton, menuButton, menuItem, nextNumber, onTopAtCentre, recordBogey, recordWin,
  setUpPaperGame,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

const winCard = (page: Page) => page.getByTestId('claim-result');
const addAnotherWinner = (page: Page) => page.getByRole('button', { name: 'Add another winner' });
const recordAWin = (page: Page) => page.getByRole('button', { name: 'Record a win' });
/** The won prize's chip, and the Close on it (TAM-126: a Close kept on the chip is named just "Close"). */
const topChip = (page: Page) => page.getByTestId('prize-chip').filter({ hasText: /Top Line ✓ Riya/ });
const chipClose = (page: Page) => topChip(page).getByRole('button', { name: /Close/ });
type Box = { x: number; y: number; width: number; height: number };
const box = async (l: Locator): Promise<Box> => (await l.boundingBox())!;

/**
 * How an element looks at its centre: is something translucent lying over it (a dim layer), or is it itself
 * faded (opacity or a darkening filter on it or a parent)? Also whether it is the topmost thing there.
 */
function lookAt(l: Locator) {
  return l.evaluate((el) => {
    const alpha = (c: string) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return 0;
      const parts = m[1]!.split(/[ ,/]+/).filter(Boolean);
      return parts.length >= 4 ? parseFloat(parts[3]!) : 1;
    };
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const onTop = !!hit && (hit === el || el.contains(hit));
    // A translucent layer between the element and the eye: the hit element or one of its parents that does not
    // hold the element, with a background that is neither clear nor solid.
    let veiled = false;
    for (let n: Element | null = onTop ? null : hit; n && !n.contains(el); n = n.parentElement) {
      const s = getComputedStyle(n);
      const a = alpha(s.backgroundColor) * Number(s.opacity);
      if ((a > 0.05 && a < 0.98) || /blur|brightness/.test(s.backdropFilter ?? '')) veiled = true;
    }
    // Faded itself: the product of opacities up the tree, or a darkening/greying filter.
    let opacity = 1;
    let filtered = false;
    for (let n: Element | null = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      opacity *= Number(s.opacity);
      if (/brightness\((0(\.\d+)?|[1-9]\d?%)\)|grayscale|opacity\(/.test(s.filter)) filtered = true;
    }
    return { onTop, dimmed: veiled || opacity <= 0.7 || filtered, faded: opacity < 0.95 || filtered };
  });
}

/** Clicks the centre of an element as a finger would, even if something lies on top of it. */
async function tapAt(page: Page, l: Locator) {
  const b = await box(l);
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}

/** Animations running on the main button (or inside it) right now, with how many times each repeats. */
const buttonAnimations = (page: Page) =>
  mainButton(page).evaluate((el) =>
    el.getAnimations({ subtree: true })
      .filter((a) => a.playState === 'running' || a.pending)
      .map((a) => ({ iterations: a.effect?.getComputedTiming().iterations ?? 1 })),
  );

test.describe('TAM-198: after a win, closing the prize is the main action', () => {
  test.beforeEach(async ({ page }) => {
    // Keep the screen awake, so the one-time screen-sleep tip (TAM-128) is not on the screen.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: { request: async () => ({ released: false, release: async () => {}, addEventListener() {}, removeEventListener() {} }) },
      });
    });
    await setUpPaperGame(page);
    await callMany(page, 4);
  });

  test('the big button becomes "Close Top Line": filled, enabled, the same size and place as "Next number"', async ({ page }) => {
    await expect(mainButton(page)).toHaveAccessibleName('Next number');
    const before = await box(mainButton(page));
    const nextBg = await mainButton(page).evaluate((el) => getComputedStyle(el).backgroundColor);
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(mainButton(page)).toHaveAccessibleName('Close Top Line');
    await expect(mainButton(page)).toBeEnabled();
    await expect(mainButton(page)).toHaveText(/Close Top Line/);
    const after = await box(mainButton(page));
    for (const k of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(after[k] - before[k]), `same ${k}`).toBeLessThanOrEqual(1);
    // Filled: a solid background, like "Next number" had (not a grey, faded or outline-only button).
    const look = await mainButton(page).evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, body: getComputedStyle(document.body).backgroundColor }));
    expect(look.bg).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(look.bg).not.toBe(look.body);
    expect(nextBg).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    const l = await lookAt(mainButton(page));
    expect(l.onTop, 'nothing lies over "Close Top Line"').toBe(true);
    expect(l.faded, '"Close Top Line" is not faded').toBe(false);
    // "Next number" itself is gone until the prize is closed.
    await expect(nextNumber(page)).toHaveCount(0);
  });

  test('"Add another winner" sits just above it, as a secondary button', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(addAnotherWinner(page)).toBeVisible();
    const a = await box(addAnotherWinner(page));
    const m = await box(mainButton(page));
    expect(a.y + a.height, 'above the main button').toBeLessThanOrEqual(m.y + 0.5);
    expect(m.y - (a.y + a.height), 'just above: no more than 24 px between them').toBeLessThanOrEqual(24);
    expect(a.x < m.x + m.width && m.x < a.x + a.width, 'in the same column as the main button').toBe(true);
    const bg = (l: Locator) => l.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await bg(addAnotherWinner(page)), 'secondary: not filled like the main button').not.toBe(await bg(mainButton(page)));
    const l = await lookAt(addAnotherWinner(page));
    expect(l.onTop && !l.faded, '"Add another winner" is not dimmed').toBe(true);
  });

  test('the rest of the calling screen is dimmed; the win card, the number and the two buttons are not; the menu and the chip\'s Close can still be tapped', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(winCard(page)).toBeVisible();
    const problems: string[] = [];
    for (const [what, l] of [
      ['the win card', winCard(page)], ['the number', currentNumber(page)],
      ['"Close Top Line"', mainButton(page)], ['"Add another winner"', addAnotherWinner(page)],
    ] as const) {
      const look = await lookAt(l);
      if (!look.onTop) problems.push(`${what} is covered`);
      if (look.faded) problems.push(`${what} is faded`);
    }
    for (const [what, l] of [
      ['"Record a win"', recordAWin(page)], ['the top bar', page.getByTestId('top-bar').getByText(/of 90 called/)],
    ] as const) {
      if (!(await l.isVisible())) continue; // not on screen at all is fine too
      const look = await lookAt(l);
      if (!look.dimmed) problems.push(`${what} is not dimmed`);
    }
    // Owner, 2026-09-30: these still work while dimmed, so nothing lies over them. (Whether they look dimmed is not
    // decided, so it is not checked.)
    for (const [what, l] of [['the menu', menuButton(page)], ["the chip's Close", chipClose(page)]] as const) {
      await expect(l, `${what} is on the screen`).toBeVisible();
      if (!(await onTopAtCentre(l))) problems.push(`${what} is covered`);
    }
    expect(problems).toEqual([]);
  });

  test('a tap in the dimmed area does nothing there, and pulses "Close Top Line" once; it never blinks on its own', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(mainButton(page)).toHaveAccessibleName('Close Top Line');
    const count = await calledCount(page);
    // Left alone, the button does not blink or repeat anything.
    await page.waitForTimeout(1500);
    for (const a of await buttonAnimations(page)) expect(a.iterations, 'no repeating animation').not.toBe(Infinity);
    expect(await buttonAnimations(page), 'nothing moves before a stray tap').toEqual([]);

    // A stray tap where "Record a win" is.
    await tapAt(page, recordAWin(page));
    await expect.poll(async () => (await buttonAnimations(page)).length, { timeout: 1000, intervals: [20, 20, 50] }).toBeGreaterThan(0);
    for (const a of await buttonAnimations(page)) expect(a.iterations, 'the pulse plays once').toBe(1);
    // Nothing happened there: no prize list for a win.
    await expect(page.getByRole('button', { name: 'Early Five', exact: true })).toHaveCount(0);
    // Once: after the pulse, the button is still again.
    await page.waitForTimeout(2000);
    expect(await buttonAnimations(page), 'the pulse does not repeat').toEqual([]);

    // A stray tap on the top bar's progress text: it pulses once more, and still nothing else happens.
    await tapAt(page, page.getByTestId('top-bar').getByText(/of 90 called/));
    await expect.poll(async () => (await buttonAnimations(page)).length, { timeout: 1000, intervals: [20, 20, 50] }).toBeGreaterThan(0);
    for (const a of await buttonAnimations(page)) expect(a.iterations, 'the pulse plays once').toBe(1);
    await page.waitForTimeout(2000);

    // The game is exactly as it was: same calls, the win still shown, the button still "Close Top Line".
    expect(await calledCount(page)).toBe(count);
    await expect(winCard(page)).toBeVisible();
    await expect(mainButton(page)).toHaveAccessibleName('Close Top Line');
  });

  test('tapping "Close Top Line" closes the prize, the dimming goes, and the button is "Next number" again', async ({ page }) => {
    const before = await box(mainButton(page));
    await recordWin(page, 'Top Line', ['Riya']);
    await mainButton(page).click();
    await expect(mainButton(page)).toHaveAccessibleName('Next number');
    await expect(nextNumber(page)).toBeEnabled();
    const after = await box(mainButton(page));
    for (const k of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(after[k] - before[k]), `same ${k}`).toBeLessThanOrEqual(1);
    for (const l of [recordAWin(page), menuButton(page)]) {
      const look = await lookAt(l);
      expect(look.onTop && !look.dimmed, 'no longer dimmed').toBe(true);
    }
    // The screen works again: "Record a win" opens, and the win card has gone by itself (TAM-145).
    await expect(winCard(page)).toBeHidden();
    await recordAWin(page).click();
    await expect(page.getByRole('button', { name: 'Early Five', exact: true })).toBeVisible();
  });

  test('"Undo win" stays on the win card, not dimmed, until the prize is closed (TAM-070)', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    const undo = winCard(page).getByRole('button', { name: /^Undo/ });
    await expect(undo).toBeVisible();
    expect(await onTopAtCentre(undo)).toBe(true);
    await undo.click();
    await page.getByRole('dialog').getByRole('button', { name: /Undo/ }).click();
    // Undone: nothing to close, no dimming, "Next number" again.
    await expect(mainButton(page)).toHaveAccessibleName('Next number');
    const look = await lookAt(recordAWin(page));
    expect(look.onTop && !look.dimmed).toBe(true);
  });

  test('the same for every prize: "Close Early Five"; and it stays while another winner is added', async ({ page }) => {
    await recordWin(page, 'Early Five', ['Kabir']);
    await expect(mainButton(page)).toHaveAccessibleName('Close Early Five');
    await addAnotherWinner(page).click();
    await page.getByRole('button', { name: 'Meera', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(winCard(page).getByText(/Shared/)).toBeVisible();
    await expect(mainButton(page)).toHaveAccessibleName('Close Early Five');
    await mainButton(page).click();
    await expect(mainButton(page)).toHaveAccessibleName('Next number');
  });

  test('the Close on the prize chip works while dimmed, and closes the prize exactly as "Close Top Line" does', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(mainButton(page)).toHaveAccessibleName('Close Top Line');
    await expect(chipClose(page)).toBeVisible();
    await tapAt(page, chipClose(page)); // as a finger would: it must not be under the dim layer
    await expect(mainButton(page)).toHaveAccessibleName('Next number');
    await expect(nextNumber(page)).toBeEnabled();
    await expect(winCard(page)).toBeHidden();
    const look = await lookAt(recordAWin(page));
    expect(look.onTop && !look.dimmed, 'no longer dimmed').toBe(true);
    // Closed: the chip has no Close any more (TAM-126).
    await expect(page.getByTestId('prize-chip').filter({ hasText: /✓ Riya/ }).getByRole('button', { name: /Close/ })).toHaveCount(0);
  });

  test('"Add another winner" works while dimmed', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    await tapAt(page, addAnotherWinner(page));
    await page.getByRole('button', { name: 'Asha', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(winCard(page).getByText(/Shared/)).toBeVisible();
    await expect(mainButton(page)).toHaveAccessibleName('Close Top Line');
  });

  test('the menu works while dimmed: it opens with End game, Discard game and Show the room', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    await tapAt(page, menuButton(page)); // as a finger would: it must not be under the dim layer
    for (const name of ['End game', 'Discard game', 'Show the room']) await expect(menuItem(page, name).first()).toBeVisible();
  });

  test('"End game" from the menu, while the prize waits to be closed, ends the game with Riya\'s prize paid', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    await fromMenu(page, 'End game');
    await page.getByRole('dialog').getByRole('button', { name: 'End game' }).click();
    const summary = page.getByTestId('payout-summary');
    await expect(summary).toBeVisible();
    // Top Line is paid to Riya ("Top Line: Riya ₹40"), not listed as "not won".
    await expect(summary).toContainText(/Top Line\W{0,3}(✓\s*)?Riya/);
  });

  test('"Discard game" from the menu, while the prize waits to be closed, asks first and says a prize was won', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    await fromMenu(page, 'Discard game');
    await expect(page.getByRole('dialog').getByText(/1 prize was already won|prizes? (was|were) already won/)).toBeVisible();
  });

  test('"Show the room" from the menu, while the prize waits to be closed, shows the room view', async ({ page }) => {
    await recordWin(page, 'Top Line', ['Riya']);
    const n = (await currentNumber(page).textContent())!.trim();
    await fromMenu(page, 'Show the room');
    await expect(page.getByTestId('room-view')).toBeVisible();
    await expect(page.getByTestId('room-view')).toContainText(n);
  });

  test('edge: a bogey is not a win; nothing is dimmed and the button stays "Next number"', async ({ page }) => {
    await recordBogey(page, 'Top Line', 'Asha');
    await expect(winCard(page).getByText('✗ Bogey')).toBeVisible();
    await expect(mainButton(page)).toHaveAccessibleName('Next number');
    await expect(mainButton(page)).toBeEnabled();
    const look = await lookAt(recordAWin(page));
    expect(look.onTop && !look.dimmed).toBe(true);
  });
});
