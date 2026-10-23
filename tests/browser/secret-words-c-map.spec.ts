// Secret Words screen lane C: the map phone (M1), its "Remove this map" dialog (M2) and its "Next map?" dialog (M3).
// Scenarios v3.7 (23 October 2026): SWD-034, 035, 036, 038, 039 (screen), 117, 120, 121, and, tested first, the privacy
// parts SWD-025, SWD-031 (the map removed when hidden), SWD-032 (on leaving) and SWD-121 (after 60 s, "Still looking?").
// The tests open the map phone by the host's QR link (`#map=<code>&t=<pair id>[&p=own]`, SWD-033, 117) on a phone with no
// game night. Tests that also need lane A's screens (Home's saved-map row, Join, code entry, How to play) or lane B's
// (the host's turn screens) are marked `aheadOfSecretWordsScreens` with the lane named. For the coder:
// specs/secret-words/screens-c.md. Helpers: secret-words-c.ts.
import { expect, test, type Page } from './fixtures';
import { closePhones } from './phone';
import { hostAGame } from './helpers';
import { freshPhone, mainButton } from './impostor';
import { aheadOfSecretWordsScreens, boardCells, fromMenu, giveClue, hostEvening, menuButton, tapMain } from './secret-words';
import {
  bare, box, button, CODE, dialogNamed, easyCode, fakeWakeLock, fullCode, hideAppAndLook, hideMap, listButton, lockHeld,
  mapCell, mapCells, mapCellsOf, mapGrid, mapHeading, mapInPage, nextCode, openLinkAgain, openMapPhone, oracleBoard, PAIR,
  savedMap, showApp, showMap, shown, SIZES, T0, tapAt, textMetrics, toast, waitGuards,
} from './secret-words-c';
import { lastN, TEAM_PAIRS } from '../games/secret-words/oracle';

test.afterEach(async () => { await closePhones(); });
test.use({ viewport: { width: 390, height: 844 } });

const B = oracleBoard(CODE);
const STARTER = B.starts === 'orange' ? PAIR.orange : PAIR.teal;
const SMALL_LINE = "Tap a word when it's found to fade it (optional). The host's board is what counts.";
const END_LINE = 'Game over: tap Done with this game. New board on the host: tap Next map.';
const MISMATCH = "Doesn't match? Scan the host's code again.";
const WARNING = 'Still looking? Tap to keep the map';
const idx = (b: typeof B, k: string) => b.kinds.map((x, i) => (x === k ? i : -1)).filter((i) => i >= 0);
const landmineWord = (b: typeof B) => b.words[b.kinds.indexOf('landmine')]!;

// =============================================================== privacy first (SWD-025, 031, 032, 121)

test.describe('SWD-032: leaving the map phone (privacy)', () => {
  test('hidden: privacy-cover appears and the map is removed in the same task; back: the map phone with the map hidden and "Show map"', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await expect(mapCells(page)).toHaveCount(25);
    const seen = await hideAppAndLook(page);
    expect(seen.cover, 'privacy-cover in the same task as visibilitychange').toBe(true);
    expect(seen.mapParts, 'no map grid, cell or list left in the same task').toBe(0);
    await showApp(page);
    await expect(mapHeading(page)).toBeVisible();
    await expect(showMap(page)).toBeVisible();
    expect(await mapInPage(page), 'the map returns hidden (SWD-034)').toEqual([]);
    await waitGuards(page);
    await showMap(page).click();
    await expect(mapCells(page)).toHaveCount(25);
  });

  test('hidden while a list shows: the list goes too (map-list, avoid-line), in the same task', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await listButton(page, 'orange').click();
    await expect(page.getByTestId('map-list')).toBeVisible();
    const seen = await hideAppAndLook(page);
    expect(seen.cover).toBe(true);
    expect(seen.mapParts).toBe(0);
    await showApp(page);
    expect(await mapInPage(page)).toEqual([]);
  });

  test('a reload on the map phone shows no map until it is asked for again', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await expect(mapCells(page)).toHaveCount(25);
    await page.reload();
    await page.waitForLoadState('load');
    await waitGuards(page);
    expect(await mapInPage(page)).toEqual([]);
  });

  test('"← Back" → Home: Home holds no map (no grid, no kinds, no lists)', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await waitGuards(page);
    await button(page, '← Back').click();
    await expect(hostAGame(page)).toBeVisible();
    await expect(mapHeading(page)).toHaveCount(0);
    expect(await mapInPage(page)).toEqual([]);
  });
});

test.describe('SWD-034 / SWD-031: "Hide map" removes the map (privacy)', () => {
  test('"Hide map" removes the grid from the page and reads "Show map"; "Show map" brings it back', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await waitGuards(page);
    await hideMap(page).click();
    await expect(showMap(page)).toBeVisible();
    await expect(hideMap(page)).toHaveCount(0);
    expect(await mapInPage(page)).toEqual([]);
    // The rest of the screen stays.
    await expect(page.getByTestId('map-code-line')).toBeVisible();
    await expect(button(page, 'Done with this game')).toBeVisible();
    await waitGuards(page);
    await showMap(page).click();
    await expect(mapCells(page)).toHaveCount(25);
    await expect(hideMap(page)).toBeVisible();
  });

  test('"Hide map" with a list showing removes the list too', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await listButton(page, 'teal').click();
    await expect(page.getByTestId('map-list')).toBeVisible();
    await waitGuards(page);
    await hideMap(page).click();
    expect(await mapInPage(page)).toEqual([]);
  });

  test('screen-on lock: asked for ("screen") while the map shows, let go on "Hide map", asked for again on "Show map"', async ({ page }) => {
    await fakeWakeLock(page);
    await openMapPhone(page, { t: PAIR.id });
    await expect.poll(() => lockHeld(page)).toBe(true);
    await waitGuards(page);
    await hideMap(page).click();
    await expect.poll(() => lockHeld(page)).toBe(false);
    await waitGuards(page);
    await showMap(page).click();
    await expect.poll(() => lockHeld(page)).toBe(true);
  });
});

test.describe('SWD-121: the map phone hides the map after 60 seconds', () => {
  test('from 50 000 ms hide-warning (role status) "Still looking? Tap to keep the map"; at 60 000 ms the map is removed, "Show map" shows and the lock is let go', async ({ page }) => {
    await fakeWakeLock(page);
    await openMapPhone(page, { t: PAIR.id, frozen: true });
    await page.clock.runFor(49_800);
    await expect(page.getByTestId('hide-warning')).toHaveCount(0);
    await page.clock.runFor(300);
    const warning = page.getByTestId('hide-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toHaveAttribute('role', 'status');
    await expect(warning).toHaveText(WARNING);
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(9_700); // 59 800 ms
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(300); // 60 100 ms
    expect(await mapInPage(page)).toEqual([]);
    await expect(showMap(page)).toBeVisible();
    await expect(page.getByTestId('hide-warning')).toHaveCount(0);
    await expect.poll(() => lockHeld(page)).toBe(false);
  });

  test('every pointerdown on the screen restarts the clock', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id, frozen: true });
    await page.clock.runFor(40_000);
    await tapAt(page, mapHeading(page));
    await page.clock.runFor(49_700); // 89 700 ms since opening, 49 700 since the tap
    await expect(page.getByTestId('hide-warning')).toHaveCount(0);
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(400);
    await expect(page.getByTestId('hide-warning')).toBeVisible();
  });

  test('while the warning shows, the first tap on a cell only keeps the map: it removes the warning and fades nothing', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id, frozen: true });
    await page.clock.runFor(50_200);
    await expect(page.getByTestId('hide-warning')).toBeVisible();
    await tapAt(page, mapCell(page, 0));
    await expect(page.getByTestId('hide-warning')).toHaveCount(0);
    await expect(mapCell(page, 0)).not.toHaveAttribute('aria-label', /, found$/);
    expect((await savedMap(page)).found).toEqual([]);
    // The clock started again: no warning until 50 000 ms after that tap.
    await page.clock.runFor(49_700);
    await expect(page.getByTestId('hide-warning')).toHaveCount(0);
    await expect(mapCells(page)).toHaveCount(25);
  });

  test('while the warning shows, the first tap on "Done with this game" presses nothing', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id, frozen: true });
    await page.clock.runFor(50_200);
    await expect(page.getByTestId('hide-warning')).toBeVisible();
    await tapAt(page, button(page, 'Done with this game'));
    await expect(page.getByTestId('hide-warning')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await savedMap(page)).not.toBeNull();
  });

  test('"Show map" starts the clock again: hidden after 60 000 ms from that tap', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id, frozen: true });
    await page.clock.runFor(60_200);
    await expect(showMap(page)).toBeVisible();
    await page.clock.runFor(1_000);
    await showMap(page).click();
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(59_700);
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(400);
    expect(await mapInPage(page)).toEqual([]);
  });

  test('"Next map" shows the map even when hidden, and starts the clock again', async ({ page }) => {
    const code = fullCode(4242, 3);
    await openMapPhone(page, { code, t: PAIR.id, frozen: true });
    await page.clock.runFor(60_200);
    await expect(showMap(page)).toBeVisible();
    await page.clock.runFor(1_000);
    await button(page, 'Next map').click();
    await page.clock.runFor(1_000);
    await dialogNamed(page, 'Next map? Only after the host starts the next game.').getByRole('button', { name: 'Next map', exact: true }).click();
    await expect(mapCells(page)).toHaveCount(25);
    expect((await mapCellsOf(page)).map((c) => c.word)).toEqual(oracleBoard(nextCode(code)!).words);
    await page.clock.runFor(59_500);
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(600);
    expect(await mapInPage(page)).toEqual([]);
  });
});

/** SWD-025: on a room screen every face-down cell has the same attributes, classes, inline and computed style, except data-index and the word. */
async function faceDownUniform(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const cells = [...document.querySelectorAll('[data-testid="word-board"] [data-testid="board-cell"]')] as HTMLElement[];
    const down = cells.filter((c) => /, face down$/.test(c.getAttribute('aria-label') ?? ''));
    const sig = (el: HTMLElement) => {
      const word = (el.textContent ?? '').trim();
      const attrs = [...el.attributes].filter((a) => a.name !== 'data-index').map((a) => `${a.name}=${a.value.split(word).join('<WORD>')}`).sort().join('|');
      const cs = getComputedStyle(el);
      return `${attrs}\n${[...cs].map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';')}\n${el.innerHTML.split(word).join('<WORD>')}`;
    };
    const first = down[0] ? sig(down[0]) : '';
    return down.filter((c) => sig(c) !== first).map((c) => `cell ${c.getAttribute('data-index')} differs`);
  });
}

test.describe('SWD-025: a board phone that opened the map keeps its room screens free of the map', () => {
  test('host (two phones) → Home (keep this game) → the same code\'s link → "Open the map here" → "← Back" → resume: the clue and guessing screens hold no kind, no map, no code', async ({ page }) => {
    aheadOfSecretWordsScreens('lanes A and B: the host\'s turn screens, Home\'s row and the board-phone dialog');
    const code = fullCode(31_337, 2);
    await hostEvening(page, { phones: 'Two phones', boards: [code], seed: 'lane-c-025' });
    await expect(page.getByTestId('map-code-text')).toContainText(shown(code));
    await fromMenu(page, 'Home (keep this game)');
    await expect(hostAGame(page)).toBeVisible();
    await page.goto('about:blank');
    await page.goto(`./#map=${code}&t=${PAIR.id}`);
    await waitGuards(page);
    await page.getByTestId('board-phone-dialog').getByRole('button', { name: 'Open the map here', exact: true }).click();
    await expect(mapHeading(page)).toBeVisible();
    await waitGuards(page);
    await button(page, '← Back').click();
    await expect(hostAGame(page)).toBeVisible();
    expect(await mapInPage(page), 'Home').toEqual([]);
    await waitGuards(page);
    await page.getByTestId('unfinished-games').getByText('Tap to resume').click();
    await tapMain(page, /^The map phone has the map$/);
    await expect(page.getByTestId('clue-prompt')).toBeVisible();
    expect(await mapInPage(page), 'clue screen').toEqual([]);
    await giveClue(page, 2);
    await expect(boardCells(page).first()).toBeVisible();
    expect(await faceDownUniform(page), 'guessing').toEqual([]);
    expect(await mapInPage(page), 'guessing').toEqual([]);
    expect(await page.evaluate((c) => document.body.innerHTML.includes(c), shown(code)), 'no code on a room screen').toBe(false);
  });
});

// =============================================================== M1: the map phone (SWD-034, 117, 120)

test.describe('SWD-034: the map phone, portrait 390 × 844', () => {
  test('parts and order: heading row with "Hide map" at its right; map-teams; map-code-line; first-words; mismatch-line; the grid; map-key; the small line; the three list buttons; "Next map"; "Clue rules"; "Done with this game"; map-end-line', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await expect(page.getByTestId('map-teams')).toHaveText(`${PAIR.orange} (orange) · ${PAIR.teal} (teal)`);
    await expect(page.getByTestId('map-code-line')).toHaveText(`Host's code ${shown(CODE)} · ${STARTER} go first`);
    await expect(page.getByTestId('first-words')).toHaveText(`First words: ${B.words.slice(0, 3).join(' · ')}`);
    await expect(page.getByTestId('mismatch-line')).toHaveText(MISMATCH);
    await expect(page.getByText(SMALL_LINE, { exact: true })).toBeVisible();
    await expect(page.getByTestId('map-end-line')).toHaveText(END_LINE);
    await expect(page.getByTestId('my-team')).toHaveCount(0);
    const order = [
      mapHeading(page), page.getByTestId('map-teams'), page.getByTestId('map-code-line'), page.getByTestId('first-words'),
      page.getByTestId('mismatch-line'), mapGrid(page), page.getByTestId('map-key'), page.getByText(SMALL_LINE, { exact: true }),
      listButton(page, 'orange'), listButton(page, 'teal'), listButton(page, 'whole'), button(page, 'Next map'),
      button(page, 'Clue rules'), button(page, 'Done with this game'), page.getByTestId('map-end-line'),
    ];
    let prev = -Infinity;
    for (const [i, l] of order.entries()) {
      const b = await box(l);
      expect(b.y, `part ${i + 1} is below part ${i}`).toBeGreaterThanOrEqual(prev - 1);
      prev = b.y + b.height;
    }
    const h = await box(mapHeading(page));
    const hide = await box(hideMap(page));
    expect(Math.abs(hide.y + hide.height / 2 - (h.y + h.height / 2)), '"Hide map" on the heading\'s row').toBeLessThanOrEqual(22);
    expect(hide.x, '"Hide map" right of the heading').toBeGreaterThan(h.x + h.width - 1);
    expect(hide.height, '"Hide map" 44 px').toBeGreaterThanOrEqual(43.5);
  });

  test('no main button, no menu, no "↻" or Flip, no team bar, no Pause; "← Back" is there', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await expect(mainButton(page)).toHaveCount(0);
    await expect(menuButton(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Flip the board' })).toHaveCount(0);
    expect(await page.evaluate(() => document.body.innerText.includes('↻'))).toBe(false);
    await expect(page.getByTestId('team-bar')).toHaveCount(0);
    await expect(page.getByTestId('pause-button')).toHaveCount(0);
    await expect(button(page, '← Back')).toBeVisible();
  });

  test('the grid: 25 map-cells in the host board\'s order, each with its word and kind (accessible name), its icon (aria-hidden SVG, 16 × 16, top left, 2 px in); no ● or ◆', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    const cells = await mapCellsOf(page);
    expect(cells.map((c) => c.index)).toEqual([...Array(25).keys()]);
    expect(cells.map((c) => c.word)).toEqual(B.words);
    expect(cells.map((c) => c.kind)).toEqual(B.kinds);
    const icons = await mapCells(page).evaluateAll((els) => els.map((el) => {
      const svg = el.querySelector('svg');
      if (!svg) return null;
      const hidden = !!svg.closest('[aria-hidden="true"]');
      const s = svg.getBoundingClientRect(); const c = el.getBoundingClientRect();
      return { hidden, w: s.width, h: s.height, dx: s.left - c.left, dy: s.top - c.top };
    }));
    for (const [i, ic] of icons.entries()) {
      expect(ic, `cell ${i}: an SVG icon`).not.toBeNull();
      expect(ic!.hidden, `cell ${i}: icon aria-hidden`).toBe(true);
      expect(Math.abs(ic!.w - 16) <= 0.5 && Math.abs(ic!.h - 16) <= 0.5, `cell ${i}: icon 16 × 16 (${ic!.w} × ${ic!.h})`).toBe(true);
      expect(Math.abs(ic!.dx - 2) <= 1 && Math.abs(ic!.dy - 2) <= 1, `cell ${i}: icon 2 px in from the top left`).toBe(true);
    }
    expect(await page.evaluate(() => /[●◆]/.test(document.body.innerText))).toBe(false);
    // Word text: weight 600, never transformed, one line.
    for (let i = 0; i < 25; i++) {
      const m = await textMetrics(mapCell(page, i));
      expect(m.weight, `cell ${i}: weight 600`).toBe('600');
      expect(m.lines, `cell ${i}: one line`).toBe(1);
    }
    expect(await mapCells(page).evaluateAll((els) => els.every((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n: Node | null; const tt = new Set<string>();
      while ((n = w.nextNode())) if ((n.textContent ?? '').trim()) tt.add(getComputedStyle(n.parentElement!).textTransform);
      return [...tt].every((t) => t === 'none');
    })), 'word text is never transformed').toBe(true);
  });

  for (const size of [{ width: 390, height: 844, w: 71.6 }, { width: 360, height: 640, w: 65.6 }]) {
    test.describe(`${size.width} × ${size.height}`, () => {
      test.use({ viewport: { width: size.width, height: size.height } });
      test(`the grid is laid out as the board: 5 × 5 row-major, 8 px margins, 4 px gaps, cells ${size.w} px wide and 48–56 px tall`, async ({ page }) => {
        await openMapPhone(page, { t: PAIR.id });
        const boxes = await mapCells(page).evaluateAll((els) => els
          .map((el) => ({ i: Number(el.getAttribute('data-index')), r: el.getBoundingClientRect() }))
          .sort((a, b) => a.i - b.i).map(({ r }) => ({ x: r.left, y: r.top, w: r.width, h: r.height })));
        for (const [i, c] of boxes.entries()) {
          expect(Math.abs(c.w - size.w), `cell ${i}: ${size.w} px wide (${c.w})`).toBeLessThanOrEqual(0.6);
          expect(c.h >= 47.5 && c.h <= 56.5, `cell ${i}: 48–56 px tall (${c.h})`).toBe(true);
          if (i % 5) {
            expect(Math.abs(c.x - (boxes[i - 1]!.x + boxes[i - 1]!.w + 4)), `cell ${i}: 4 px right of cell ${i - 1}`).toBeLessThanOrEqual(0.6);
            expect(Math.abs(c.y - boxes[i - 1]!.y), `cell ${i}: same row as cell ${i - 1}`).toBeLessThanOrEqual(0.6);
          } else if (i) {
            expect(Math.abs(c.y - (boxes[i - 5]!.y + boxes[i - 5]!.h + 4)), `cell ${i}: 4 px under cell ${i - 5}`).toBeLessThanOrEqual(0.6);
          }
        }
        expect(Math.abs(boxes[0]!.x - 8), 'left margin 8 px').toBeLessThanOrEqual(0.6);
        expect(Math.abs(size.width - (boxes[4]!.x + boxes[4]!.w) - 8), 'right margin 8 px').toBeLessThanOrEqual(0.6);
      });
    });
  }

  test.describe('360 × 640, scrolled', () => {
    test.use({ viewport: { width: 360, height: 640 } });
    test('"Hide map" stays in view while the page scrolls (sticky)', async ({ page }) => {
      await openMapPhone(page, { t: PAIR.id });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(hideMap(page)).toBeInViewport();
      await expect(page.getByTestId('map-end-line')).toBeInViewport();
    });
  });

  test('the list buttons are stacked full width, 48 px each; "Whole map" is pressed on opening, the other two are not', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    const bs = [await box(listButton(page, 'orange')), await box(listButton(page, 'teal')), await box(listButton(page, 'whole'))];
    for (const [i, b] of bs.entries()) {
      expect(b.height, `list button ${i + 1}: 48 px`).toBeGreaterThanOrEqual(47.5);
      expect(b.width, `list button ${i + 1}: full width`).toBeGreaterThanOrEqual(390 - 48);
      if (i) expect(b.y, `list button ${i + 1} under ${i}`).toBeGreaterThanOrEqual(bs[i - 1]!.y + bs[i - 1]!.height - 1);
    }
    await expect(listButton(page, 'whole')).toHaveAttribute('aria-pressed', 'true');
    await expect(listButton(page, 'orange')).toHaveAttribute('aria-pressed', 'false');
    await expect(listButton(page, 'teal')).toHaveAttribute('aria-pressed', 'false');
  });

  test('map-key (v3.7): directly under the grid, exactly 2 lines: circle "<orange name>", diamond "<teal name>"; dash "nobody\'s word", landmine "Landmine: never guess"; four 16 px SVG icons', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await expectMapKey(page, [PAIR.orange, PAIR.teal, "nobody's word", 'Landmine: never guess'], 4);
    const g = await box(mapGrid(page));
    const k = await box(page.getByTestId('map-key'));
    expect(k.y, 'map-key under the grid').toBeGreaterThanOrEqual(g.y + g.height - 1);
    expect(k.y - (g.y + g.height), 'directly under the grid').toBeLessThanOrEqual(16);
  });

  test('"← Back" opens Home', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await waitGuards(page);
    await button(page, '← Back').click();
    await expect(hostAGame(page)).toBeVisible();
  });
});

/** The map key's entries in order, on exactly 2 lines, with `icons` 16 px SVG icons; every line at least 13 px. */
async function expectMapKey(page: Page, entries: string[], icons: number) {
  const key = page.getByTestId('map-key');
  await expect(key).toBeVisible();
  const g = await key.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => ((n.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const centres: number[] = []; const sizes: number[] = []; let n: Node | null;
    while ((n = walker.nextNode())) {
      const r = document.createRange(); r.selectNodeContents(n);
      for (const rect of r.getClientRects()) centres.push(rect.top + rect.height / 2);
      sizes.push(parseFloat(getComputedStyle(n.parentElement!).fontSize));
    }
    const lines: number[] = [];
    for (const c of centres.sort((a, b) => a - b)) if (!lines.length || c - lines[lines.length - 1]! > 6) lines.push(c);
    const svgs = [...el.querySelectorAll('svg')].map((s) => { const r = s.getBoundingClientRect(); return { w: r.width, h: r.height, hidden: !!s.closest('[aria-hidden="true"]') }; });
    return { text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(), lines: lines.length, min: Math.min(...sizes), svgs };
  });
  let at = -1;
  for (const e of entries) {
    const i = g.text.indexOf(e, at + 1);
    expect(i, `map-key holds "${e}" after the entry before it (text: ${g.text})`).toBeGreaterThan(at);
    at = i;
  }
  expect(g.lines, 'map-key: exactly 2 lines').toBe(2);
  expect(g.min, 'map-key: at least 13 px').toBeGreaterThanOrEqual(13);
  expect(g.svgs.length, 'map-key icons').toBe(icons);
  for (const s of g.svgs) {
    expect(Math.abs(s.w - 16) <= 0.5 && Math.abs(s.h - 16) <= 0.5, `icon 16 × 16 (${s.w} × ${s.h})`).toBe(true);
    expect(s.hidden, 'icon aria-hidden').toBe(true);
  }
}

test.describe('SWD-034 v3.7: map-key at 360 × 640 with the longest team names', () => {
  test.use({ viewport: { width: 360, height: 640 } });
  test('each line stays on one line (shrinking to 13 px, then names cut at 12 characters with "…")', async ({ page }) => {
    const longest = [...TEAM_PAIRS].sort((a, b) => (b.orange.length + b.teal.length) - (a.orange.length + a.teal.length))[0]!;
    await openMapPhone(page, { t: longest.id });
    const cut = (s: string) => (s.length > 12 ? s.slice(0, 12) : s);
    await expectMapKey(page, [cut(longest.orange), cut(longest.teal), "nobody's word", 'Landmine: never guess'], 4);
  });
});

test.describe('SWD-034 / SWD-092: narrow portrait 320 × 568', () => {
  test.use({ viewport: { width: 320, height: 568 } });
  test('Full board: "Turn your phone sideways to see the board." in place of the grid; map-key and the buttons stay; no host hint', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await expect(page.getByTestId('turn-sideways')).toContainText('Turn your phone sideways to see the board.');
    await expect(mapGrid(page)).toBeHidden();
    await expect(page.getByTestId('turn-sideways-hint')).toHaveCount(0);
    await expect(page.getByTestId('map-key')).toBeVisible();
    for (const n of ["Orange team's words", "Teal team's words", 'Whole map', 'Next map', 'Clue rules', 'Done with this game']) await expect(button(page, n)).toBeVisible();
    await expect(hideMap(page)).toBeVisible();
    // A list still works here.
    await listButton(page, 'orange').click();
    await expect(page.getByTestId('map-list')).toBeVisible();
  });

  test('Easy board (v3.6): a 4 × 4 grid, cells 73 px wide and 48 px tall, 8 px margins, 4 px gaps; map-key line 2 is the dash entry only', async ({ page }) => {
    const code = easyCode(2024, 0);
    await openMapPhone(page, { code, t: PAIR.id });
    await expect(page.getByTestId('turn-sideways')).toHaveCount(0);
    await expect(mapCells(page)).toHaveCount(16);
    const boxes = await mapCells(page).evaluateAll((els) => els
      .map((el) => ({ i: Number(el.getAttribute('data-index')), r: el.getBoundingClientRect() }))
      .sort((a, b) => a.i - b.i).map(({ r }) => ({ x: r.left, y: r.top, w: r.width, h: r.height })));
    for (const [i, c] of boxes.entries()) {
      expect(Math.abs(c.w - 73), `cell ${i}: 73 px wide (${c.w})`).toBeLessThanOrEqual(0.6);
      expect(Math.abs(c.h - 48), `cell ${i}: 48 px tall (${c.h})`).toBeLessThanOrEqual(0.6);
      if (i % 4) expect(Math.abs(c.x - (boxes[i - 1]!.x + boxes[i - 1]!.w + 4))).toBeLessThanOrEqual(0.6);
    }
    expect(Math.abs(boxes[0]!.x - 8)).toBeLessThanOrEqual(0.6);
    expect((await mapCellsOf(page)).map((c) => c.word)).toEqual(oracleBoard(code).words);
    await expectMapKey(page, [PAIR.orange, PAIR.teal, "nobody's word"], 3);
    await expect(page.getByTestId('map-key')).not.toContainText('Landmine');
  });
});

for (const land of [{ width: 812, height: 375, col: 200, margin: 16, cw: 100, ch: 56 }, { width: 568, height: 320, col: 160, margin: 8, cw: 69, ch: 54 }]) {
  test.describe(`SWD-034: landscape ${land.width} × ${land.height}`, () => {
    test.use({ viewport: { width: land.width, height: land.height } });
    test(`grid at the left (${land.margin} px margin, cells at least ${land.cw} × ${land.ch}); a ${land.col} px column at the right with the heading, lines, buttons and map-end-line, scrolling inside; no page scrolling`, async ({ page }) => {
      await openMapPhone(page, { t: PAIR.id });
      const g = await box(mapGrid(page));
      const first = await box(mapCell(page, 0));
      expect(Math.abs(first.x - land.margin), `grid ${land.margin} px from the left`).toBeLessThanOrEqual(1);
      for (let i = 0; i < 25; i++) {
        const c = await box(mapCell(page, i));
        expect(c.width, `cell ${i} width`).toBeGreaterThanOrEqual(land.cw - 0.5);
        expect(c.height, `cell ${i} height`).toBeGreaterThanOrEqual(land.ch - 0.5);
      }
      const column = [mapHeading(page), page.getByTestId('map-code-line'), page.getByTestId('first-words'), page.getByText(SMALL_LINE, { exact: true }),
        listButton(page, 'orange'), button(page, 'Next map'), button(page, 'Done with this game'), page.getByTestId('map-end-line')];
      for (const [i, l] of column.entries()) {
        const b = await box(l);
        expect(b.x, `column part ${i + 1} right of the grid`).toBeGreaterThanOrEqual(g.x + g.width - 1);
        expect(b.width, `column part ${i + 1} within ${land.col} px`).toBeLessThanOrEqual(land.col + 1);
      }
      expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= window.innerHeight + 1), 'no page scrolling').toBe(true);
      // The end line can be reached by scrolling the column.
      await page.getByTestId('map-end-line').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('map-end-line')).toBeInViewport();
      await expect(mapCell(page, 0)).toBeInViewport();
    });
  });
}

test.describe('SWD-034: every size, Larger text off and on', () => {
  for (const size of SIZES) {
    for (const larger of [false, true]) {
      test.describe(`${size.width} × ${size.height}${larger ? ', Larger text' : ''}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });
        test('no sideways scrolling; the heading, the code line and "Done with this game" are there', async ({ page }) => {
          await openMapPhone(page, { t: PAIR.id, larger });
          expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= window.innerWidth)).toBe(true);
          await expect(page.getByTestId('map-code-line')).toBeVisible();
          await expect(button(page, 'Done with this game')).toBeVisible();
        });
      });
    }
  }
});

test.describe('SWD-038: Larger text on the map phone', () => {
  test('the heading and lines grow (small line 15 → 19 px), the map\'s words keep their size, list words 24 → 28 px', async ({ page }) => {
    const measure = async () => {
      const cells: number[] = [];
      for (let i = 0; i < 25; i++) cells.push((await textMetrics(mapCell(page, i))).size);
      const heading = (await textMetrics(mapHeading(page))).size;
      const code = (await textMetrics(page.getByTestId('map-code-line'))).size;
      const small = (await textMetrics(page.getByText(SMALL_LINE, { exact: true }))).size;
      await listButton(page, 'orange').click();
      const li = (await textMetrics(page.getByTestId('map-list').getByRole('listitem').first())).size;
      return { cells, heading, code, small, li };
    };
    await openMapPhone(page, { t: PAIR.id });
    const off = await measure();
    await openMapPhone(page, { t: PAIR.id, larger: true });
    const on = await measure();
    expect(on.cells, 'map words: same size with Larger text (SWD-090)').toEqual(off.cells);
    expect(on.heading, 'heading grows').toBeGreaterThan(off.heading);
    expect(on.code, 'map-code-line grows').toBeGreaterThan(off.code);
    expect([off.small, on.small], 'small line 15 → 19 px').toEqual([15, 19]);
    expect([off.li, on.li], 'list words 24 → 28 px').toEqual([24, 28]);
  });
});

// =============================================================== SWD-117: team names (C3 for the QR format)

test.describe('SWD-117: team names on the map phone', () => {
  test('Next map keeps t: the team names and the next code\'s starting team', async ({ page }) => {
    const code = fullCode(1111, 4);
    const next = nextCode(code)!;
    const nb = oracleBoard(next);
    await openMapPhone(page, { code, t: PAIR.id });
    await waitGuards(page);
    await button(page, 'Next map').click();
    await waitGuards(page);
    await dialogNamed(page, 'Next map? Only after the host starts the next game.').getByRole('button', { name: 'Next map', exact: true }).click();
    await expect(page.getByTestId('map-teams')).toHaveText(`${PAIR.orange} (orange) · ${PAIR.teal} (teal)`);
    await expect(page.getByTestId('map-code-line')).toHaveText(`Host's code ${shown(next)} · ${nb.starts === 'orange' ? PAIR.orange : PAIR.teal} go first`);
    expect(await savedMap(page)).toMatchObject({ t: PAIR.id });
  });

  test('a link without t: no map-teams, "Host\'s code … · Orange/Teal team goes first", no my-team', async ({ page }) => {
    await openMapPhone(page, {});
    await expect(page.getByTestId('map-teams')).toHaveCount(0);
    await expect(page.getByTestId('map-code-line')).toHaveText(`Host's code ${shown(CODE)} · ${B.starts === 'orange' ? 'Orange' : 'Teal'} team goes first`);
    await expect(page.getByTestId('my-team')).toHaveCount(0);
  });
});

// =============================================================== SWD-120: lists

test.describe('SWD-120: the lists', () => {
  for (const team of ['orange', 'teal'] as const) {
    test(`"${team === 'orange' ? 'Orange' : 'Teal'} team's words": map-list replaces the grid: h2 "${team === 'orange' ? 'Orange' : 'Teal'} words (N)", the words as li in cell order at 24 px, then "Never guess: <WORD> (the Landmine)"; the button is pressed; "Whole map" returns the grid`, async ({ page }) => {
      await openMapPhone(page, { t: PAIR.id });
      const words = idx(B, team).map((i) => B.words[i]!);
      await listButton(page, team).click();
      const list = page.getByTestId('map-list');
      await expect(list).toBeVisible();
      await expect(mapGrid(page)).toBeHidden();
      await expect(list.getByRole('heading', { level: 2 })).toHaveText(`${team === 'orange' ? 'Orange' : 'Teal'} words (${words.length})`);
      await expect(list.getByRole('listitem')).toHaveText(words);
      expect((await textMetrics(list.getByRole('listitem').first())).size).toBe(24);
      await expect(page.getByTestId('avoid-line')).toHaveText(`Never guess: ${landmineWord(B)} (the Landmine)`);
      expect(await page.getByTestId('avoid-line').locator('svg').count(), 'the landmine icon').toBeGreaterThanOrEqual(1);
      await expect(listButton(page, team)).toHaveAttribute('aria-pressed', 'true');
      await expect(listButton(page, 'whole')).toHaveAttribute('aria-pressed', 'false');
      // List words can't be tapped to fade.
      await expect(list.getByRole('button')).toHaveCount(0);
      await list.getByRole('listitem').first().click();
      expect((await savedMap(page)).found).toEqual([]);
      await listButton(page, 'whole').click();
      await expect(mapCells(page)).toHaveCount(25);
      await expect(page.getByTestId('map-list')).toHaveCount(0);
      await expect(listButton(page, 'whole')).toHaveAttribute('aria-pressed', 'true');
      await expect(listButton(page, team)).toHaveAttribute('aria-pressed', 'false');
    });
  }

  test('faded words leave the list and its count', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    const orange = idx(B, 'orange');
    await mapCell(page, orange[0]!).click();
    await expect(mapCell(page, orange[0]!)).toHaveAttribute('aria-label', /, found$/);
    await listButton(page, 'orange').click();
    const list = page.getByTestId('map-list');
    await expect(list.getByRole('heading', { level: 2 })).toHaveText(`Orange words (${orange.length - 1})`);
    await expect(list.getByRole('listitem')).toHaveText(orange.slice(1).map((i) => B.words[i]!));
  });

  test('Easy board: no avoid-line', async ({ page }) => {
    await openMapPhone(page, { code: easyCode(77, 1), t: PAIR.id });
    await listButton(page, 'orange').click();
    await expect(page.getByTestId('map-list')).toBeVisible();
    await expect(page.getByTestId('avoid-line')).toHaveCount(0);
  });
});

// =============================================================== SWD-035: fading found words

test.describe('SWD-035: fading found words', () => {
  test('a tap marks a cell found (", found", struck through, the v3.6 light fill, full opacity), saved; a second tap within 500 ms does nothing; a later tap unfades', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id, frozen: true });
    const i = idx(B, 'teal')[0]!;
    const word = B.words[i]!;
    const cell = mapCell(page, i);
    await page.clock.runFor(1_000);
    await cell.click();
    await expect(cell).toHaveAttribute('aria-label', `${word}, teal team, found`);
    const m = await textMetrics(cell);
    expect(m.decoration, 'struck through').toContain('line-through');
    expect(m.opacity, 'full strength, not opacity (v3.6)').toBe(1);
    expect(await cellHasFill(page, i, '--team-teal'), 'fill color-mix(in srgb, var(--team-teal) 20%, var(--surface))').toBe(true);
    expect((await savedMap(page)).found).toEqual([i]);
    await page.clock.runFor(300);
    await cell.click(); // within 500 ms
    await expect(cell).toHaveAttribute('aria-label', `${word}, teal team, found`);
    await page.clock.runFor(400); // 700 ms after the first tap
    await cell.click();
    await expect(cell).toHaveAttribute('aria-label', `${word}, teal team`);
    expect((await savedMap(page)).found).toEqual([]);
  });

  test('fades are this phone\'s only and come back when the same code is opened again (no toast)', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await mapCell(page, 3).click();
    await expect(mapCell(page, 3)).toHaveAttribute('aria-label', /, found$/);
    await openLinkAgain(page, { t: PAIR.id });
    await expect(mapCell(page, 3)).toHaveAttribute('aria-label', /, found$/);
    await expect(toast(page)).toHaveCount(0);
  });
});

/** True if the cell (or an element inside it) is painted in color-mix(in srgb, <token> 20%, var(--surface)), within 2 per channel. */
async function cellHasFill(page: Page, i: number, token: string): Promise<boolean> {
  return page.evaluate(({ i, token }) => {
    const cell = document.querySelector(`[data-testid="map-grid"] [data-testid="map-cell"][data-index="${i}"]`) as HTMLElement;
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;left:-99px;width:1px;height:1px;background-color:color-mix(in srgb, var(${token}) 20%, var(--surface))`;
    cell.appendChild(probe);
    const want = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const ctx = document.createElement('canvas').getContext('2d')!;
    const rgb = (c: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
    const w = rgb(want);
    return [cell, ...cell.querySelectorAll('*')].some((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      if (!bg || bg === 'transparent' || /rgba\(.*,\s*0\)$/.test(bg)) return false;
      const g = rgb(bg);
      return g.slice(0, 3).every((v, k) => Math.abs(v - w[k]!) <= 2);
    });
  }, { i, token });
}

// =============================================================== SWD-036: one saved map

test.describe('SWD-036: clearing and replacing maps', () => {
  test('opening saves { code, savedAt, found: [], t }; savedAt is when it was first opened', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id, frozen: true });
    const s = await savedMap(page);
    expect(bare(s.code)).toBe(CODE);
    expect(s.found).toEqual([]);
    expect(s.t).toBe(PAIR.id);
    expect(Math.abs(s.savedAt - T0), 'savedAt = when it was opened').toBeLessThanOrEqual(2_000);
  });

  test('a different code replaces it, with the toast "New map opened. The old one is gone." at the bottom (16 px up); found marks cleared', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await mapCell(page, 0).click();
    const other = fullCode(9_999, 1);
    await openLinkAgain(page, { code: other, t: PAIR.id });
    await expect(toast(page)).toHaveText('New map opened. The old one is gone.');
    const t = await box(toast(page));
    expect(Math.abs(844 - (t.y + t.height) - 16), 'toast 16 px from the bottom').toBeLessThanOrEqual(1);
    const s = await savedMap(page);
    expect(bare(s.code)).toBe(other);
    expect(s.found).toEqual([]);
    expect((await mapCellsOf(page)).map((c) => c.word)).toEqual(oracleBoard(other).words);
  });

  test('"Done with this game" → dialog "Remove this map from your phone?" with "Remove" and main "Keep it"; "Keep it" keeps the map', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await waitGuards(page);
    await button(page, 'Done with this game').click();
    const d = dialogNamed(page, 'Remove this map from your phone?');
    await expect(d).toBeVisible();
    await expect(d.getByRole('button', { name: 'Remove', exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Keep it');
    await waitGuards(page);
    await d.getByTestId('main-button').click();
    await expect(d).toHaveCount(0);
    await expect(mapHeading(page)).toBeVisible();
    expect(bare((await savedMap(page)).code)).toBe(CODE);
  });

  test('"Remove" removes the saved map and opens Home, which holds no map', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await waitGuards(page);
    await button(page, 'Done with this game').click();
    await waitGuards(page);
    await dialogNamed(page, 'Remove this map from your phone?').getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(hostAGame(page)).toBeVisible();
    expect(await savedMap(page)).toBeNull();
    expect(await mapInPage(page)).toEqual([]);
    await expect(page.getByTestId('saved-map')).toHaveCount(0);
  });

  test('the app never opens a saved map by itself: Home with a saved map shows no map', async ({ page }) => {
    await freshPhone(page, { storage: { 'pgn.secretWords.map': { code: CODE, savedAt: T0 - 60_000, found: [], t: PAIR.id } } });
    await waitGuards(page);
    await expect(hostAGame(page)).toBeVisible();
    await expect(mapHeading(page)).toHaveCount(0);
    expect(await mapInPage(page)).toEqual([]);
  });

  test.describe('Home\'s saved-map row (A1 is lane A\'s screen)', () => {
    test.beforeEach(() => { aheadOfSecretWordsScreens("lane A: Home's saved-map row"); });
    const H6 = 6 * 3_600_000;
    test('up to 6 hours: a button "Secret Words map 27P-3QX8 · Tap to open" that opens the map with its found marks', async ({ page }) => {
      await freshPhone(page, { fixed: true, storage: { 'pgn.secretWords.map': { code: CODE, savedAt: T0 - H6, found: [3], t: PAIR.id } } });
      const row = page.getByRole('button', { name: `Secret Words map ${shown(CODE)} · Tap to open`, exact: true });
      await expect(page.getByTestId('saved-map')).toBeVisible();
      await expect(row).toBeVisible();
      await waitGuards(page);
      await row.click();
      await expect(mapHeading(page)).toBeVisible();
      await expect(mapCell(page, 3)).toHaveAttribute('aria-label', /, found$/);
      await expect(page.getByTestId('map-teams')).toHaveText(`${PAIR.orange} (orange) · ${PAIR.teal} (teal)`);
    });

    test('more than 6 hours: the text "Secret Words map 27P-3QX8" with "Open" and "Remove"; "Remove" asks the same dialog', async ({ page }) => {
      await freshPhone(page, { fixed: true, storage: { 'pgn.secretWords.map': { code: CODE, savedAt: T0 - H6 - 1_000, found: [], t: PAIR.id } } });
      const row = page.getByTestId('saved-map');
      await expect(row).toContainText(`Secret Words map ${shown(CODE)}`);
      await expect(row).not.toContainText('Tap to open');
      await expect(row.getByRole('button', { name: 'Open', exact: true })).toBeVisible();
      await waitGuards(page);
      await row.getByRole('button', { name: 'Remove', exact: true }).click();
      const d = dialogNamed(page, 'Remove this map from your phone?');
      await expect(d).toBeVisible();
      await waitGuards(page);
      await d.getByRole('button', { name: 'Remove', exact: true }).click();
      expect(await savedMap(page)).toBeNull();
      await expect(page.getByTestId('saved-map')).toHaveCount(0);
    });
  });
});

// =============================================================== SWD-039: Next map (M3)

test.describe('SWD-039: Next map', () => {
  test('asks "Next map? Only after the host starts the next game." (quiet "Next map", main "Not yet"); "Not yet" changes nothing', async ({ page }) => {
    await openMapPhone(page, { t: PAIR.id });
    await waitGuards(page);
    await button(page, 'Next map').click();
    const d = dialogNamed(page, 'Next map? Only after the host starts the next game.');
    await expect(d).toBeVisible();
    await expect(d.getByRole('button', { name: 'Next map', exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Not yet');
    await waitGuards(page);
    await d.getByTestId('main-button').click();
    await expect(d).toHaveCount(0);
    expect(bare((await savedMap(page)).code)).toBe(CODE);
    expect((await mapCellsOf(page)).map((c) => c.word)).toEqual(B.words);
  });

  test('"Next map" opens the next deal of the deck: its board, the toast "Next map. It should start with: A · B · C.", found cleared, savedAt now, t kept', async ({ page }) => {
    const code = fullCode(123_456, 5);
    const next = nextCode(code)!;
    const nb = oracleBoard(next);
    await openMapPhone(page, { code, t: PAIR.id });
    await mapCell(page, 1).click();
    await page.clock.runFor(3_600_000);
    const now = await page.evaluate(() => Date.now());
    await waitGuards(page);
    await button(page, 'Next map').click();
    await waitGuards(page);
    await dialogNamed(page, 'Next map? Only after the host starts the next game.').getByRole('button', { name: 'Next map', exact: true }).click();
    await expect(toast(page)).toHaveText(`Next map. It should start with: ${nb.words.slice(0, 3).join(' · ')}.`);
    const cells = await mapCellsOf(page);
    expect(cells.map((c) => c.word)).toEqual(nb.words);
    expect(cells.map((c) => c.kind)).toEqual(nb.kinds);
    await expect(page.getByTestId('first-words')).toHaveText(`First words: ${nb.words.slice(0, 3).join(' · ')}`);
    const s = await savedMap(page);
    expect(bare(s.code)).toBe(next);
    expect(s.found).toEqual([]);
    expect(s.t).toBe(PAIR.id);
    expect(Math.abs(s.savedAt - now), 'savedAt = now').toBeLessThanOrEqual(5_000);
  });

  test('the last deal of a deck (n = 16): the toast "No more maps from this code. Scan the host\'s new code." and nothing changes', async ({ page }) => {
    expect(lastN('full', 'family')).toBe(16);
    const last = fullCode(55_555, 16);
    expect(nextCode(last)).toBeNull();
    await openMapPhone(page, { code: last, t: PAIR.id });
    await mapCell(page, 2).click();
    await waitGuards(page);
    await button(page, 'Next map').click();
    await waitGuards(page);
    await dialogNamed(page, 'Next map? Only after the host starts the next game.').getByRole('button', { name: 'Next map', exact: true }).click();
    await expect(toast(page)).toHaveText("No more maps from this code. Scan the host's new code.");
    const s = await savedMap(page);
    expect(bare(s.code)).toBe(last);
    expect(s.found).toEqual([2]);
    expect((await mapCellsOf(page)).map((c) => c.word)).toEqual(oracleBoard(last).words);
  });

  test('taps within 500 ms are ignored: a double tap moves on one map, never two', async ({ page }) => {
    const code = fullCode(8_080, 0);
    const next = nextCode(code)!;
    await openMapPhone(page, { code, t: PAIR.id, frozen: true });
    await page.clock.runFor(2_000);
    await button(page, 'Next map').click();
    await page.clock.runFor(600);
    const d = dialogNamed(page, 'Next map? Only after the host starts the next game.');
    await d.getByRole('button', { name: 'Next map', exact: true }).click();
    await page.clock.runFor(100);
    await button(page, 'Next map').click(); // within 500 ms of the last tap
    await page.clock.runFor(100);
    await expect(d).toHaveCount(0);
    expect(bare((await savedMap(page)).code)).toBe(next);
    await page.clock.runFor(1_000);
    await button(page, 'Next map').click();
    await expect(d).toBeVisible();
  });
});

// =============================================================== SWD-034 v3.6: my team (three phones, &p=own)

test.describe('SWD-034 (v3.6): "I give clues for:" with three phones', () => {
  test('choosing a team: "I give clues for: <team>" with quiet "Change" (48 px); that team\'s list button first; saved; kept on reopening and by Next map; the grid shows both colours', async ({ page }) => {
    const code = fullCode(2_468, 2);
    await openMapPhone(page, { code, t: PAIR.id, p: 'own' });
    const mine = page.getByTestId('my-team');
    await expect(mine).toContainText('I give clues for:');
    for (const n of [PAIR.orange, PAIR.teal]) {
      const b = mine.getByRole('button', { name: n, exact: true });
      await expect(b).toHaveAttribute('aria-pressed', 'false');
      expect((await box(b)).height).toBeGreaterThanOrEqual(47.5);
    }
    // Before a choice: orange, teal, Whole map.
    expect((await box(listButton(page, 'orange'))).y).toBeLessThan((await box(listButton(page, 'teal'))).y);
    await mine.getByRole('button', { name: PAIR.teal, exact: true }).click();
    await expect(mine).toContainText(`I give clues for: ${PAIR.teal}`);
    const change = mine.getByRole('button', { name: 'Change', exact: true });
    await expect(change).toBeVisible();
    expect((await box(change)).height).toBeGreaterThanOrEqual(47.5);
    const [teal, orange, whole] = [await box(listButton(page, 'teal')), await box(listButton(page, 'orange')), await box(listButton(page, 'whole'))];
    expect(teal.y, 'the chosen team\'s list first').toBeLessThan(orange.y);
    expect(orange.y, '"Whole map" third').toBeLessThan(whole.y);
    await expect(mapCells(page)).toHaveCount(25);
    expect((await mapCellsOf(page)).map((c) => c.kind)).toEqual(oracleBoard(code).kinds);
    expect(await savedMap(page)).toMatchObject({ t: PAIR.id, p: 'own', team: 'teal' });
    await openLinkAgain(page, { code, t: PAIR.id, p: 'own' });
    await expect(page.getByTestId('my-team')).toContainText(`I give clues for: ${PAIR.teal}`);
    await waitGuards(page);
    await button(page, 'Next map').click();
    await waitGuards(page);
    await dialogNamed(page, 'Next map? Only after the host starts the next game.').getByRole('button', { name: 'Next map', exact: true }).click();
    expect(await savedMap(page)).toMatchObject({ t: PAIR.id, p: 'own', team: 'teal' });
    await expect(page.getByTestId('my-team')).toContainText(`I give clues for: ${PAIR.teal}`);
    // "Change" shows the two buttons again.
    await waitGuards(page);
    await page.getByTestId('my-team').getByRole('button', { name: 'Change', exact: true }).click();
    await expect(page.getByTestId('my-team').getByRole('button', { name: PAIR.orange, exact: true })).toBeVisible();
  });

  test('a different code clears the team', async ({ page }) => {
    await openMapPhone(page, { code: fullCode(3_000, 0), t: PAIR.id, p: 'own' });
    await page.getByTestId('my-team').getByRole('button', { name: PAIR.orange, exact: true }).click();
    expect((await savedMap(page)).team).toBe('orange');
    await openLinkAgain(page, { code: fullCode(3_001, 0), t: PAIR.id, p: 'own' });
    expect((await savedMap(page)).team).toBeUndefined();
    await expect(page.getByTestId('my-team').getByRole('button', { name: PAIR.orange, exact: true })).toBeVisible();
  });

  test('an unknown t with p=own: the buttons read "Orange team" / "Teal team"', async ({ page }) => {
    await openMapPhone(page, { t: 'SWDT-99', p: 'own' });
    const mine = page.getByTestId('my-team');
    await expect(mine.getByRole('button', { name: 'Orange team', exact: true })).toBeVisible();
    await expect(mine.getByRole('button', { name: 'Teal team', exact: true })).toBeVisible();
  });
});

// =============================================================== needs lane A's screens

test.describe('SWD-034 v3.6: "Clue rules" (How to play is lane A\'s screen)', () => {
  test('opens How to play at "Clue rules", nothing about the map in it; "Done" returns to the map phone', async ({ page }) => {
    aheadOfSecretWordsScreens('lane A: How to play (S5)');
    await openMapPhone(page, { t: PAIR.id });
    await waitGuards(page);
    await button(page, 'Clue rules').click();
    await expect(page.getByRole('heading', { name: 'How to play', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Clue rules', exact: true })).toBeInViewport();
    expect(await mapInPage(page)).toEqual([]);
    await tapMain(page, /^Done$/);
    await expect(mapHeading(page)).toBeVisible();
  });
});

test.describe('SWD-117: a typed code never shows team names or my-team (code entry is lane A\'s screen)', () => {
  test('Join → "Type the host\'s code" → "27p-3qx8" → the map phone: no map-teams, no my-team, "· Orange/Teal team goes first"', async ({ page }) => {
    aheadOfSecretWordsScreens('lane A: Join and code entry');
    await freshPhone(page);
    await waitGuards(page);
    await page.getByRole('button', { name: /^Join a game/ }).click();
    await waitGuards(page);
    await button(page, "Type the host's code").click();
    await page.getByLabel("Host's code", { exact: true }).fill('27p-3qx8');
    await tapMain(page, /^Open the map$/);
    await expect(mapHeading(page)).toBeVisible();
    await expect(page.getByTestId('map-teams')).toHaveCount(0);
    await expect(page.getByTestId('my-team')).toHaveCount(0);
    await expect(page.getByTestId('map-code-line')).toHaveText(`Host's code ${shown(CODE)} · ${B.starts === 'orange' ? 'Orange' : 'Teal'} team goes first`);
  });
});

