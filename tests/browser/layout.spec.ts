// The calling screen redesign (change request of 28 September 2026, docs/games/tambola/ux-calling-screen.md):
// TAM-123 to TAM-129 and TAM-138, all on a 390 × 844 screen unless a test says otherwise.
import { expect, test, type Locator, type Page } from './fixtures';
import {
  call, callMany, calledNumbers, closeBoard, currentNumber, currentRhyme, dismiss, fromMenu, lastCalls, mainButton, menuItem, nextNumber,
  nextNumberWaits, openBoard, recordBogey, recordWin, setUpPaperGame, undoToast,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

const topBar = (page: Page) => page.getByTestId('top-bar');
const recordAWin = (page: Page) => page.getByRole('button', { name: 'Record a win' });
const chips = (page: Page) => page.getByTestId('prize-chip');
type Box = { x: number; y: number; width: number; height: number };
const box = async (l: Locator): Promise<Box> => (await l.boundingBox())!;

/** The page itself never scrolls (TAM-138). */
async function pageScrolls(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    return el.scrollHeight > window.innerHeight + 1 || document.body.scrollHeight > window.innerHeight + 1;
  });
}

/** Fully inside the screen. */
async function fullyVisible(page: Page, l: Locator): Promise<boolean> {
  const b = await l.boundingBox();
  const vp = page.viewportSize()!;
  return !!b && b.width > 0 && b.x >= -0.5 && b.y >= -0.5 && b.x + b.width <= vp.width + 0.5 && b.y + b.height <= vp.height + 0.5;
}

/**
 * Nothing lies on top of it (TAM-138, TAM-123): at a grid of points across its box, the topmost element is
 * the element itself or something inside it. Returns the points that are covered, and by what.
 */
async function coveredPoints(l: Locator): Promise<string[]> {
  return l.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const out: string[] = [];
    for (const fx of [0.15, 0.3, 0.5, 0.7, 0.85]) {
      for (const fy of [0.15, 0.3, 0.5, 0.7, 0.85]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        const hit = document.elementFromPoint(x, y);
        if (hit && !el.contains(hit)) {
          const who = hit.closest<HTMLElement>('[data-testid], [role="dialog"]');
          out.push(`(${Math.round(x)}, ${Math.round(y)}) under ${who?.dataset.testid ?? who?.getAttribute("role") ?? `${hit.tagName} "${(hit.textContent ?? "").trim().slice(0, 40)}"`}`);
        }
      }
    }
    return out;
  });
}

/** Fully on the screen and not covered by anything. */
async function numberInView(page: Page, when: string): Promise<string[]> {
  const out: string[] = [];
  if (!(await fullyVisible(page, currentNumber(page)))) out.push(`${when}: the number is not fully on the screen`);
  const covered = await coveredPoints(currentNumber(page));
  if (covered.length) out.push(`${when}: the number is covered at ${covered.length} of 25 points, e.g. ${covered[0]}`);
  return out;
}

/** Text or controls that sit above the called number, other than the top bar (TAM-123). */
async function thingsAboveTheNumber(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const num = document.querySelector('[data-testid="current-number"]')!;
    const bar = document.querySelector('[data-testid="top-bar"]');
    const top = num.getBoundingClientRect().top;
    const out: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      if (bar?.contains(el) || el.contains(num) || num.contains(el)) continue;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
      const ownText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
      const control = el.matches('button, a[href], input, select, [role="button"]');
      if ((ownText || control) && r.bottom <= top + 1) out.push(`"${(el.innerText || el.tagName).trim().slice(0, 30)}"`);
    }
    return out;
  });
}

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;

/** The height of the digits themselves, measured from the font (as in TAM-107). */
const digitHeight = (l: Locator) =>
  l.evaluate((el) => {
    const s = getComputedStyle(el);
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const m = ctx.measureText('88');
    return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  });

/** A button's own background: transparent, or the same colour as what is behind it, means "not filled". */
const isFilled = (l: Locator) =>
  l.evaluate((el) => {
    const opaque = (c: string) => { const m = c.match(/[\d.]+/g); return !!m && (m[3] === undefined || Number(m[3]) > 0.1); };
    const own = getComputedStyle(el).backgroundColor;
    if (!opaque(own)) return false;
    for (let e = el.parentElement; e; e = e.parentElement) {
      const bg = getComputedStyle(e).backgroundColor;
      if (opaque(bg)) return bg !== own;
    }
    return own !== 'rgb(255, 255, 255)';
  });

test.describe('TAM-123: the number dominates the calling screen', () => {
  test.beforeEach(async ({ page }) => {
    await setUpPaperGame(page);
  });

  test('only a top bar with Back, the progress and the menu sits above the number', async ({ page }) => {
    await callMany(page, 3);
    const bar = topBar(page);
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('button', { name: /Back/ })).toBeVisible();
    await expect(bar.getByText('3 of 90 called')).toBeVisible();
    await expect(bar.getByRole('button', { name: /Menu/ })).toBeVisible();
    const above = await thingsAboveTheNumber(page);
    expect(above).toEqual([]);
  });

  test('the digits are at least 160 CSS px, the number takes about 40% of the screen, rhyme large under it, last 5 calls under that', async ({ page }) => {
    const calls = await callMany(page, 6);
    expect(await digitHeight(currentNumber(page))).toBeGreaterThanOrEqual(160);
    const vp = page.viewportSize()!;
    const num = await box(currentNumber(page));
    expect(num.height).toBeGreaterThanOrEqual(vp.height * 0.3);
    const rhyme = await box(currentRhyme(page));
    expect(rhyme.y).toBeGreaterThanOrEqual(num.y + num.height - 1);
    expect(await currentRhyme(page).evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(24);
    for (const name of ['Repeat', 'Another rhyme']) {
      const b = page.getByRole('button', { name, exact: true });
      const bb = await box(b);
      expect(bb.width).toBeGreaterThanOrEqual(44);
      expect(bb.height).toBeGreaterThanOrEqual(44);
      expect(await isFilled(b), `${name} is a quiet text button`).toBe(false);
    }
    const last = await box(lastCalls(page));
    expect(last.y).toBeGreaterThanOrEqual(rhyme.y + rhyme.height - 1);
    const shown = (await lastCalls(page).locator('[data-number]').allTextContents()).map((t) => Number(t.trim()));
    expect(shown).toEqual(calls.slice(-5).reverse());
  });

  test('TAM-138 and the long-rhyme edge: through all 90 calls nothing scrolls, and the number, rhyme and buttons stay fully visible', async ({ page }) => {
    test.setTimeout(180_000);
    const problems: string[] = [];
    for (let i = 1; i <= 90; i++) {
      await call(page);
      if (await pageScrolls(page)) problems.push(`call ${i}: the page scrolls`);
      for (const [name, l] of [['number', currentNumber(page)], ['rhyme', currentRhyme(page)], ['Record a win', recordAWin(page)]] as const) {
        if (!(await fullyVisible(page, l))) problems.push(`call ${i}: ${name} not fully visible`);
      }
      const clipped = await currentRhyme(page).evaluate((el) =>
        el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1 || getComputedStyle(el).textOverflow === 'ellipsis');
      if (clipped) problems.push(`call ${i}: rhyme "${(await currentRhyme(page).textContent())?.slice(0, 40)}" is cut off`);
      if (problems.length > 5) break;
    }
    for (const name of ['Repeat', 'Another rhyme']) {
      if (!(await fullyVisible(page, page.getByRole('button', { name, exact: true })))) problems.push(`after 90: ${name} not fully visible`);
    }
    expect(problems).toEqual([]);
  });
});

test.describe('TAM-138: the calling screen needs no scrolling, and the number never goes out of view', () => {
  test.beforeEach(async ({ page }) => {
    await setUpPaperGame(page);
  });

  test('after calls, a recorded win, closing a tier and an undo', async ({ page }) => {
    await callMany(page, 5);
    expect(await pageScrolls(page)).toBe(false);
    expect(await fullyVisible(page, currentNumber(page))).toBe(true);
    await recordWin(page, 'Top Line', ['Riya']);
    expect(await pageScrolls(page)).toBe(false);
    expect(await fullyVisible(page, currentNumber(page))).toBe(true);
    await page.getByRole('button', { name: 'Close Top Line', exact: true }).click();
    expect(await pageScrolls(page)).toBe(false);
    expect(await fullyVisible(page, currentNumber(page))).toBe(true);
    await call(page);
    await undoToast(page).getByRole('button', { name: /Undo/ }).click();
    expect(await pageScrolls(page)).toBe(false);
    expect(await fullyVisible(page, currentNumber(page))).toBe(true);
  });
});

/**
 * Review 2026-09-29, finding 2: the win card covered the called number. These tests keep the screen awake,
 * so the one-time screen-sleep tip (TAM-128) is not on the screen; the win, the bogey and the undo are.
 */
test.describe('TAM-138 and TAM-123: the number stays fully in view while a win is shown', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: { request: async () => ({ released: false, release: async () => {}, addEventListener() {}, removeEventListener() {} }) },
      });
    });
    await setUpPaperGame(page);
  });

  test('TAM-123: while a win is shown: still nothing but the top bar above the number, and nothing covers it', async ({ page }) => {
    await callMany(page, 5);
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(page.getByTestId('claim-result')).toBeVisible();
    expect(await thingsAboveTheNumber(page)).toEqual([]);
    expect(await numberInView(page, 'win shown')).toEqual([]);
  });


  test('TAM-138: nothing covers the number while a win or a bogey is shown, after closing the tier with no Done tapped (review 2026-09-29, finding 2)', async ({ page }) => {
    const problems: string[] = [];
    await callMany(page, 5);
    problems.push(...(await numberInView(page, 'after calls')));
    await recordWin(page, 'Top Line', ['Riya']);
    await expect(page.getByTestId('claim-result')).toBeVisible();
    problems.push(...(await numberInView(page, 'win shown')));
    await page.getByRole('button', { name: 'Close Top Line', exact: true }).click();
    await expect(nextNumber(page)).toBeEnabled();
    problems.push(...(await numberInView(page, 'after closing Top Line')));
    await call(page);
    await recordBogey(page, 'Middle Line', 'Asha');
    await expect(page.getByTestId('claim-result')).toBeVisible();
    problems.push(...(await numberInView(page, 'bogey shown')));
    expect(await pageScrolls(page)).toBe(false);
    expect(problems).toEqual([]);
  });

  test('TAM-138: after an undo of a call, nothing covers the number', async ({ page }) => {
    await callMany(page, 3);
    await call(page);
    await undoToast(page).getByRole('button', { name: /Undo/ }).click();
    await expect(undoToast(page).getByRole('button', { name: /Undo/ })).toHaveCount(0);
    expect(await numberInView(page, 'after undo')).toEqual([]);
  });
});

test.describe('TAM-124: one main button; End game and Discard live in the menu', () => {
  test.beforeEach(async ({ page }) => {
    await setUpPaperGame(page);
  });

  test('"Next number" is full width at the very bottom; "Record a win" is its own row just above it, not filled', async ({ page }) => {
    await callMany(page, 2);
    const vp = page.viewportSize()!;
    const next = await box(nextNumber(page));
    const rec = await box(recordAWin(page));
    expect(next.width).toBeGreaterThanOrEqual(vp.width - 48);
    expect(Math.abs(next.x + next.width / 2 - vp.width / 2)).toBeLessThanOrEqual(8);
    expect(vp.height - (next.y + next.height)).toBeLessThanOrEqual(40);
    expect(rec.width).toBeGreaterThanOrEqual(vp.width - 48);
    // Its own row, just above: never side by side.
    expect(rec.y + rec.height).toBeLessThanOrEqual(next.y + 1);
    expect(next.y - (rec.y + rec.height)).toBeLessThanOrEqual(24);
    expect(await isFilled(nextNumber(page))).toBe(true);
    expect(await isFilled(recordAWin(page))).toBe(false);
  });

  test('"Next number" is the only filled main button on the calling screen', async ({ page }) => {
    await callMany(page, 2);
    const filled = await page.evaluate(() => {
      const opaque = (c: string) => { const m = c.match(/[\d.]+/g); return !!m && (m[3] === undefined || Number(m[3]) > 0.1); };
      const behind = (el: Element) => {
        for (let e = el.parentElement; e; e = e.parentElement) {
          const bg = getComputedStyle(e).backgroundColor;
          if (opaque(bg)) return bg;
        }
        return 'rgb(255, 255, 255)';
      };
      return Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'))
        .filter((el) => el.getBoundingClientRect().width > 0 && !el.closest('[role="dialog"], [role="menu"]'))
        .filter((el) => el.innerText.trim() !== 'Next number')
        .filter((el) => { const own = getComputedStyle(el).backgroundColor; return opaque(own) && own !== behind(el); })
        .map((el) => el.innerText.trim().slice(0, 30));
    });
    expect(filled, 'filled buttons other than "Next number"').toEqual([]);
  });

  test('End game and Discard game appear only in the menu, and still ask for their confirmations', async ({ page }) => {
    await callMany(page, 2);
    for (const name of ['End game', 'Discard game']) await expect(menuItem(page, name).filter({ visible: true })).toHaveCount(0);
    await fromMenu(page, 'End game');
    await expect(page.getByRole('dialog').getByText('End the game and show payouts?')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Keep playing' }).click();
    await fromMenu(page, 'Discard game');
    await expect(page.getByRole('dialog').getByText(/Discard this game\? Nobody wins and it can.t be resumed\./)).toBeVisible();
    await dismiss(page);
    await expect(nextNumber(page)).toBeVisible();
  });

  test('"Show the room" also opens with a long press on the number', async ({ page }) => {
    await callMany(page, 2);
    const b = await box(currentNumber(page));
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(900);
    await page.mouse.up();
    await expect(page.getByTestId('room-view')).toBeVisible();
  });
});

test.describe('TAM-125: the undo toast never moves anything', () => {
  test.beforeEach(async ({ page }) => {
    await setUpPaperGame(page);
  });

  const fixed = (page: Page) => [topBar(page), currentNumber(page), recordAWin(page), nextNumber(page), page.getByTestId('prize-chips')];
  const boxes = async (page: Page) => Promise.all(fixed(page).map((l) => box(l)));

  test('"Called 21 · Undo (5s)" floats just above the bottom buttons, never covers them, and moves nothing when it comes and goes', async ({ page }) => {
    await callMany(page, 2);
    const n = await call(page);
    const toast = undoToast(page);
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(new RegExp(`Called ${n} · Undo`));
    const t = await box(toast);
    const rec = await box(recordAWin(page));
    expect(t.y + t.height).toBeLessThanOrEqual(rec.y + 1);
    // Review 2026-09-29, finding 3 (owner-approved TAM-125 change): the toast never covers the prize chips either.
    expect(overlaps(t, await box(page.getByTestId('prize-chips'))), 'the toast covers the prize chips').toBe(false);
    for (const c of await chips(page).all()) expect(overlaps(t, await box(c)), 'the toast covers a prize chip').toBe(false);
    const withToast = await boxes(page);
    const rhymeWith = await box(currentRhyme(page));
    await expect(toast).toHaveCount(0, { timeout: 7_000 });
    expect(await boxes(page)).toEqual(withToast);
    expect((await box(currentRhyme(page))).y).toBe(rhymeWith.y);
  });

  test('Undo on the toast puts the number back, and again nothing else moves', async ({ page }) => {
    const first = await call(page);
    await expect(undoToast(page)).toHaveCount(0, { timeout: 7_000 });
    const before = await boxes(page);
    await call(page);
    await undoToast(page).getByRole('button', { name: /Undo/ }).click();
    await expect(currentNumber(page)).toHaveText(String(first));
    await expect(undoToast(page)).toHaveCount(0);
    const after = await boxes(page);
    // The number's digits may differ in width; its place on the screen does not.
    expect(after[1]!.y).toBe(before[1]!.y);
    expect([after[0], after[2], after[3], after[4]]).toEqual([before[0], before[2], before[3], before[4]]);
  });

  test('edge: calling again replaces the toast; only the latest call can be undone', async ({ page }) => {
    const a = await call(page);
    const b = await call(page);
    await expect(undoToast(page)).toHaveCount(1);
    await expect(undoToast(page)).toHaveText(new RegExp(`Called ${b} · Undo`));
    await undoToast(page).getByRole('button', { name: /Undo/ }).click();
    await expect(currentNumber(page)).toHaveText(String(a));
    await expect(undoToast(page).getByRole('button', { name: /Undo/ })).toHaveCount(0);
    expect(await calledNumbers(page)).toEqual([a]);
  });
});

test.describe('TAM-126: prize chips show at a glance what is open, won and closed', () => {
  // TAM-126 as changed by the owner on 2026-09-30 (TAM-198): the main button reads "Close Top Line" (was "Close Top Line
  // first" on a greyed Next number), and the chip keeps its Close (docs/decisions.md, 2026-09-30).
  test('five tiers show as five chips; a win turns its chip into "Top Line ✓ Riya · Close", and the main button reads "Close Top Line"', async ({ page }) => {
    await setUpPaperGame(page);
    await callMany(page, 3);
    await expect(chips(page)).toHaveCount(5);
    for (const c of await chips(page).all()) await expect(c).toContainText('●');
    await recordWin(page, 'Top Line', ['Riya']);
    const top = chips(page).filter({ hasText: /Top Line ✓ Riya/ });
    await expect(top).toHaveCount(1);
    await expect(top.getByRole('button', { name: /Close/ })).toBeVisible();
    await expect(mainButton(page)).toHaveAccessibleName('Close Top Line');
    expect(await nextNumberWaits(page)).toBe(true);
    await mainButton(page).click();
    await expect(nextNumber(page)).toBeEnabled();
    // Closed: still "✓ Riya", no longer open (●) and no Close.
    const closed = chips(page).filter({ hasText: /✓ Riya/ });
    await expect(closed).not.toContainText('●');
    await expect(closed.getByRole('button', { name: /Close/ })).toHaveCount(0);
    await expect(chips(page).filter({ hasText: '●' })).toHaveCount(4);
  });

  test('with seven tiers (25 tickets) the chips stay on one line and scroll sideways inside their row; the page never scrolls', async ({ page }) => {
    test.setTimeout(90_000);
    await setUpPaperGame(page, { players: Array.from({ length: 25 }, (_, i) => `P${i + 1}x`) });
    await callMany(page, 2);
    await expect(chips(page)).toHaveCount(7);
    const tops = await Promise.all((await chips(page).all()).map(async (c) => Math.round((await box(c)).y)));
    expect(new Set(tops).size).toBe(1);
    const row = await page.getByTestId('prize-chips').evaluate((el) => ({
      overflows: el.scrollWidth > el.clientWidth + 1, overflowX: getComputedStyle(el).overflowX,
    }));
    if (row.overflows) expect(['auto', 'scroll']).toContain(row.overflowX);
    expect(await pageScrolls(page)).toBe(false);
  });
});

test.describe('TAM-127: the board opens as a sheet over the calling screen', () => {
  test('from the menu; the number is never pushed away; one tap closes it and the screen is exactly as it was', async ({ page }) => {
    await setUpPaperGame(page);
    const calls = await callMany(page, 7);
    await expect(page.getByTestId('board')).toBeHidden();
    const before = await Promise.all([currentNumber(page), nextNumber(page), recordAWin(page), lastCalls(page)].map((l) => box(l)));
    await openBoard(page);
    await expect(page.getByRole('dialog').filter({ has: page.getByTestId('board') })).toBeVisible();
    const marked = (await page.getByTestId('board').locator('[data-called="true"]').allTextContents()).map((t) => Number(t.trim()));
    expect(marked.sort((a, b) => a - b)).toEqual([...calls].sort((a, b) => a - b));
    expect(await box(currentNumber(page))).toEqual(before[0]);
    expect(await pageScrolls(page)).toBe(false);
    await closeBoard(page);
    const after = await Promise.all([currentNumber(page), nextNumber(page), recordAWin(page), lastCalls(page)].map((l) => box(l)));
    expect(after).toEqual(before);
    expect(await fullyVisible(page, currentNumber(page))).toBe(true);
  });
});

test.describe('TAM-128: the screen-sleep hint is a one-time tip, not a permanent line', () => {
  test('refused: a one-time tip, then only a small "Screen may sleep" icon with its word in the top bar', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { throw new Error('NotAllowedError'); } } });
    });
    await setUpPaperGame(page);
    await call(page);
    const tip = page.getByText(/keep your screen on/i);
    await expect(tip).toBeVisible();
    await page.getByRole('button', { name: /^(Got it|OK|Close)/ }).first().click();
    await expect(tip).toHaveCount(0);
    await expect(topBar(page).getByText('Screen may sleep')).toBeVisible();
    await expect(page.getByText('Screen may sleep')).toHaveCount(1);
    await callMany(page, 2);
    await expect(page.getByText(/keep your screen on/i)).toHaveCount(0);
    // One-time: a new game on this phone does not show the tip again, only the icon.
    await setUpPaperGame(page, { players: ['Riya', 'Asha'] });
    await call(page);
    await expect(page.getByText(/keep your screen on/i)).toHaveCount(0);
    await expect(topBar(page).getByText('Screen may sleep')).toBeVisible();
  });

  // Owner decision 2026-09-29: the one-time tip never covers the called number (TAM-128, TAM-138).
  test('TAM-128 and TAM-138: while the one-time tip is shown, it never covers the called number', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { throw new Error('NotAllowedError'); } } });
    });
    await setUpPaperGame(page);
    await call(page);
    await expect(page.getByText(/keep your screen on/i)).toBeVisible();
    expect(await numberInView(page, 'screen-sleep tip shown')).toEqual([]);
    await call(page);
    if (await page.getByText(/keep your screen on/i).isVisible()) {
      expect(await numberInView(page, 'screen-sleep tip still shown after the next call')).toEqual([]);
    }
    expect(await pageScrolls(page)).toBe(false);
  });

  test('when the phone keeps the screen awake, neither the tip nor the icon appears', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: { request: async () => ({ released: false, release: async () => {}, addEventListener() {}, removeEventListener() {} }) },
      });
    });
    await setUpPaperGame(page);
    await callMany(page, 2);
    await expect(page.getByText(/keep your screen on/i)).toHaveCount(0);
    await expect(page.getByText('Screen may sleep')).toHaveCount(0);
  });
});

test.describe('TAM-129: landscape, the phone on a stand facing the room', () => {
  test('number on the left half, rhyme and last calls on the right, buttons along the bottom; no scrolling; back to portrait unchanged', async ({ page }) => {
    await setUpPaperGame(page);
    const calls = await callMany(page, 4);
    const portraitDigits = await digitHeight(currentNumber(page));
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(currentNumber(page)).toHaveText(String(calls[3]));
    const vp = { width: 844, height: 390 };
    const num = await box(currentNumber(page));
    expect(num.x).toBeGreaterThanOrEqual(0);
    expect(num.x + num.width).toBeLessThanOrEqual(vp.width / 2 + 1);
    for (const l of [currentRhyme(page), lastCalls(page)]) expect((await box(l)).x).toBeGreaterThanOrEqual(vp.width / 2 - 1);
    for (const l of [nextNumber(page), recordAWin(page)]) {
      const b = await box(l);
      expect(vp.height - (b.y + b.height)).toBeLessThanOrEqual(40);
    }
    expect(await pageScrolls(page)).toBe(false);
    for (const l of [currentNumber(page), currentRhyme(page), nextNumber(page), recordAWin(page)]) expect(await fullyVisible(page, l)).toBe(true);
    // At least as readable as in portrait (owner decision 2026-09-29): digits at least 160 CSS px, never smaller than portrait.
    const landscapeDigits = await digitHeight(currentNumber(page));
    expect(landscapeDigits).toBeGreaterThanOrEqual(160);
    expect(landscapeDigits).toBeGreaterThanOrEqual(portraitDigits - 0.5);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(currentNumber(page)).toHaveText(String(calls[3]));
    const shown = (await lastCalls(page).locator('[data-number]').allTextContents()).map((t) => Number(t.trim()));
    expect(shown).toEqual(calls.slice(-5).reverse());
    expect(await calledNumbers(page)).toHaveLength(4);
  });
});
