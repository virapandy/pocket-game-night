// Secret Words on screen: the C3 browser checks (scenarios v3.6, 22 October 2026), written before the screens exist.
// SWD-099 and SWD-090 v3.6 (every word fits its cell; a too-wide word shrinks alone), SWD-042 v3.6 (tap to zoom), SWD-022 (host board = map phone for the same code), SWD-025 (no kind of a
// face-down cell in a room screen's DOM), SWD-117 (the QR format and team names on the map phone), SWD-129 (Show the
// map code again records nothing). Rules: tests/games/secret-words/. Helpers: secret-words.ts.
// Tests that need screens from lanes A, C or D are marked `aheadOfSecretWordsScreens` (expected to fail until built);
// lane B's own checks (SWD-090, 042, 033 QR, 129) are real checks since 23 October (lane-b tests first).
// Lane C's map-phone checks (SWD-117's link, unknown t, my-team) and the typed code (lanes A and C) are real since 23 October
// (lane-e); SWD-022 and SWD-025 wait for lane D's game over.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from './fixtures';
import { closePhones, newPhone, readDrawnQr } from './phone';
import { freezeClock, freshPhone, mainButton } from './impostor';
import {
  boardCells, cellsOf, fromMenu, giveClue, hostEvening, kindOf, mapCells, menuButton, oracleBoard,
  passToClue, revealCell, scanHeading, shown, tapMain, TEAM_PAIRS, waitGuards, type OracleBoard,
} from './secret-words';
import { DECKS, oracleCode, parseCsv } from '../games/secret-words/oracle';

test.afterEach(async () => { await closePhones(); });

const WORDS: string[] = parseCsv(readFileSync(fileURLToPath(new URL('../../docs/games/secret-words/words.csv', import.meta.url)), 'utf8'))
  .slice(1).map((r) => r[1]!);

/** Five Full Whole-family codes, spread over the deck seeds and deal indexes. */
const CODES = [
  '27P3QX8',
  oracleCode({ edition: 1, board: 'full', words: 'family' }, 0, 0),
  oracleCode({ edition: 1, board: 'full', words: 'family' }, DECKS - 1, 16),
  oracleCode({ edition: 1, board: 'full', words: 'family' }, 314_159, 7),
  oracleCode({ edition: 1, board: 'full', words: 'family' }, 777_777, 12),
];

// SWD-099 asks every word to fit at 12 px (360 × 640) and 14 px (390 × 844). The owner's answer of 22 October (SWD-090,
// version 3.6): words that don't fit at 12 px stay and shrink alone, in 0.5 px steps, to a floor of 10 px; none is
// replaced for size. So the content check is the 10 px floor; the words that need it are listed, not failed.
test.describe('SWD-099 / SWD-090 (v3.6): every word fits its cell', () => {
  test('every word, as word text (body font, weight 600), fits in 57 px at the 10 px floor; words below 12 px are listed', async ({ page }, testInfo) => {
    await page.goto('./');
    const { tooWide, shrinks } = await page.evaluate(async (words) => {
      const family = getComputedStyle(document.body).fontFamily;
      for (const px of [10, 12, 14]) await document.fonts.load(`600 ${px}px ${family}`, words.join(''));
      await document.fonts.ready;
      const span = document.createElement('span');
      span.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;font-family:${family};font-weight:600;text-transform:none;letter-spacing:normal`;
      document.body.appendChild(span);
      const width = (w: string, px: number) => { span.textContent = w; span.style.fontSize = `${px}px`; return span.getBoundingClientRect().width; };
      const tooWide: string[] = [];
      const shrinks: string[] = [];
      for (const w of words) {
        const at10 = width(w, 10);
        const at12 = width(w, 12);
        const at14 = width(w, 14);
        if (at10 > 57) tooWide.push(`${w} (${at10.toFixed(1)} px at 10)`);
        else if (at12 > 57 || at14 > 63) shrinks.push(`${w} (${at12.toFixed(1)} px at 12, ${at14.toFixed(1)} px at 14)`);
      }
      span.remove();
      return { tooWide, shrinks };
    }, WORDS);
    testInfo.annotations.push({ type: 'SWD-090 v3.6: shrink alone (wider than 57 px at 12 or 63 px at 14)', description: shrinks.join(', ') || 'none' });
    expect(tooWide, 'words wider than a 360 × 640 cell even at the 10 px floor (SWD-090 v3.6): report to the product owner').toEqual([]);
  });
});

/** The ten words the scenarios name as too wide at 12 px on the test phones (SWD-090 v3.6). */
const WIDE_WORDS = ['Boundary', 'Rickshaw', 'Puncture', 'Mosquito', 'Monsoon', 'Homework', 'Umbrella', 'Diamond', 'Germany', 'Himalaya'];
/** The first Full Whole-family code (deal index 0) whose board holds one of them. */
const WIDE_CODE = (() => {
  for (let d = 0; d < 5000; d++) {
    const c = oracleCode({ edition: 1, board: 'full', words: 'family' }, d, 0);
    if (oracleBoard(c).words.some((w) => WIDE_WORDS.includes(w))) return c;
  }
  throw new Error('no board with a wide word in the first 5000 decks');
})();

/** One phone, guessing turn 1 on `code` with a clue for `n`. */
async function guessingOn(page: Page, code: string, seed: string, n: number | 'inf' = 2) {
  await hostEvening(page, { phones: 'One phone', boards: [code], seed });
  await passToClue(page);
  await giveClue(page, n);
  await expect(boardCells(page).first()).toBeVisible();
}

test.describe('SWD-090 (v3.6): a word that doesn\'t fit at 12 px shrinks alone', () => {
  test.use({ viewport: { width: 360, height: 640 } });
  test('360 × 640: one board size from 22 to 12 px; only a word that doesn\'t fit at 12 px is smaller, by 0.5 px steps, never below 10 px; every word fits in 1 line', async ({ page }) => {
    await guessingOn(page, WIDE_CODE, 'shrink-alone');
    const cells = await boardCells(page).evaluateAll((els) => els.map((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => ((n.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
      const node = walker.nextNode()!;
      const holder = node.parentElement!;
      const range = document.createRange();
      range.selectNodeContents(node);
      const textWidth = range.getBoundingClientRect().width;
      const lines = range.getClientRects().length;
      const cs = getComputedStyle(holder);
      // Would the word fit 0.5 px larger? Measured on a copy with the same font.
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;left:-9999px;white-space:nowrap;font-family:${cs.fontFamily};font-weight:${cs.fontWeight};letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform}`;
      probe.textContent = node.textContent;
      document.body.appendChild(probe);
      const at = (px: number) => { probe.style.fontSize = `${px}px`; return probe.getBoundingClientRect().width; };
      const size = parseFloat(cs.fontSize);
      const out = {
        word: (node.textContent ?? '').trim(), size, textWidth, lines, room: el.getBoundingClientRect().width - 8,
        fitsHalfLarger: at(size + 0.5) <= el.getBoundingClientRect().width - 8, fitsAt12: at(12) <= el.getBoundingClientRect().width - 8,
      };
      probe.remove();
      return out;
    }));
    expect(cells).toHaveLength(25);
    const board = Math.max(...cells.map((c) => c.size));
    expect(Number.isInteger(board) && board >= 12 && board <= 22, `board size ${board} px`).toBe(true);
    for (const c of cells) {
      expect(c.lines, `${c.word}: 1 line`).toBe(1);
      expect(c.textWidth, `${c.word}: fits its cell minus 4 px each side`).toBeLessThanOrEqual(c.room + 0.5);
      if (c.size === board) continue;
      expect(board, `${c.word} is smaller (${c.size} px), so the board is at 12 px`).toBe(12);
      expect(c.fitsAt12, `${c.word} is smaller only because it doesn't fit at 12 px`).toBe(false);
      expect(c.size, `${c.word}: floor 10 px`).toBeGreaterThanOrEqual(10);
      expect(Number.isInteger(c.size * 2), `${c.word}: 0.5 px steps (${c.size} px)`).toBe(true);
      expect(c.fitsHalfLarger, `${c.word}: the largest 0.5 px step that fits (${c.size} px)`).toBe(false);
    }
    // Never replaced for size: the board shows the code's words.
    expect(cells.map((c) => c.word)).toEqual(oracleBoard(WIDE_CODE).words);
  });
});

/** The zoom card's look, without its text: attributes, classes and the computed style (SWD-042 v3.6: no kind in it). */
async function zoomLook(page: Page) {
  return page.getByTestId('word-zoom').evaluate((el) => {
    const word = (el.textContent ?? '').trim();
    const attrs = [...el.attributes].map((a) => `${a.name}=${a.value.split(word).join('<WORD>')}`).sort().join('|');
    const cs = getComputedStyle(el);
    const skip = /^(left|right|top|bottom|inset|width|height|transform|translate|inline-size|block-size|perspective-origin|transform-origin|inset-.*)$/;
    const style = [...cs].filter((p) => !skip.test(p)).map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
    return `${attrs}\n${style}\n${el.innerHTML.split(word).join('<WORD>')}`;
  });
}

/** Checks `word-zoom` shows `index`'s word at 28 px weight 700, centred over the cell (shifted in at the board's edges). */
async function expectZoomOver(page: Page, index: number, word: string) {
  const zoom = page.getByTestId('word-zoom');
  await expect(zoom).toHaveCount(1);
  await expect(zoom).toBeVisible();
  await expect(zoom).toHaveText(word);
  const g = await page.evaluate((i) => {
    const z = document.querySelector('[data-testid="word-zoom"]') as HTMLElement;
    const walker = document.createTreeWalker(z, NodeFilter.SHOW_TEXT, { acceptNode: (n) => ((n.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const holder = walker.nextNode()!.parentElement!;
    const cs = getComputedStyle(holder);
    const box = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    const cell = document.querySelector(`[data-testid="word-board"] [data-index="${i}"]`)!;
    const cells = [...document.querySelectorAll('[data-testid="word-board"] [data-index]')].map(box);
    const xs = [...new Set(cells.map((c) => Math.round(c.x)))].sort((a, b) => a - b);
    return {
      size: cs.fontSize, weight: cs.fontWeight, zoom: box(z), cell: box(cell), board: box(document.querySelector('[data-testid="word-board"]')!),
      gap: xs.length > 1 ? xs[1]! - xs[0]! - cells[0]!.w : 0,
      role: z.getAttribute('role'), tag: z.tagName, buttons: z.querySelectorAll('button, [role="button"]').length,
      onTop: (() => { const c = box(z); const hit = document.elementFromPoint(c.x + c.w / 2, c.y + c.h / 2); return !!hit && (hit === z || z.contains(hit)); })(),
    };
  }, index);
  expect(g.size, 'word-zoom: 28 px').toBe('28px');
  expect(g.weight, 'word-zoom: weight 700').toBe('700');
  expect(g.tag === 'BUTTON' || g.role === 'button' || g.buttons > 0, 'word-zoom is not a button').toBe(false);
  expect(g.onTop, 'word-zoom is above the cells').toBe(true);
  expect(g.zoom.w, 'up to 2 cells wide').toBeLessThanOrEqual(2 * g.cell.w + g.gap + 1);
  expect(g.zoom.x, 'inside the board (left)').toBeGreaterThanOrEqual(g.board.x - 0.5);
  expect(g.zoom.y, 'inside the board (top)').toBeGreaterThanOrEqual(g.board.y - 0.5);
  expect(g.zoom.x + g.zoom.w, 'inside the board (right)').toBeLessThanOrEqual(g.board.x + g.board.w + 0.5);
  expect(g.zoom.y + g.zoom.h, 'inside the board (bottom)').toBeLessThanOrEqual(g.board.y + g.board.h + 0.5);
  const atEdgeX = g.zoom.x <= g.board.x + 0.5 || g.zoom.x + g.zoom.w >= g.board.x + g.board.w - 0.5;
  const atEdgeY = g.zoom.y <= g.board.y + 0.5 || g.zoom.y + g.zoom.h >= g.board.y + g.board.h - 0.5;
  if (!atEdgeX) expect(Math.abs(g.zoom.x + g.zoom.w / 2 - (g.cell.x + g.cell.w / 2)), 'centred over the cell (across)').toBeLessThanOrEqual(1);
  if (!atEdgeY) expect(Math.abs(g.zoom.y + g.zoom.h / 2 - (g.cell.y + g.cell.h / 2)), 'centred over the cell (down)').toBeLessThanOrEqual(1);
}

test.describe('SWD-042 (v3.6): tap to zoom', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('guessing: a tap picks and zooms; the zoom follows the pick, goes when unpicked or revealed; same look for every kind', async ({ page }) => {
    const b = oracleBoard(WIDE_CODE);
    await guessingOn(page, WIDE_CODE, 'zoom-guess', 2);
    await expect(page.getByTestId('word-zoom')).toHaveCount(0);
    // A wide word first (face down: nothing is turned yet), then one of the team's own words and a nobody's word, all different.
    const wide = b.words.findIndex((w) => WIDE_WORDS.includes(w));
    const own = b.kinds.map((k, i) => (k === b.starts && i !== wide ? i : -1)).filter((i) => i >= 0);
    const blank = b.kinds.findIndex((k, i) => k === 'nobody' && i !== wide);
    const cell = (i: number) => page.locator(`[data-testid="board-cell"][data-index="${i}"]`);
    await waitGuards(page);
    await cell(wide).click();
    await expect(cell(wide)).toHaveAttribute('aria-pressed', 'true');
    await expectZoomOver(page, wide, b.words[wide]!);
    await cell(own[0]!).click();
    await expect(cell(own[0]!)).toHaveAttribute('aria-pressed', 'true');
    await expectZoomOver(page, own[0]!, b.words[own[0]!]!);
    const ownLook = await zoomLook(page);
    await page.clock.runFor(2500); // stays while the cell is picked
    await expectZoomOver(page, own[0]!, b.words[own[0]!]!);
    await cell(blank).click();
    await expectZoomOver(page, blank, b.words[blank]!);
    expect(await zoomLook(page), 'the zoom carries no kind of a face-down word').toBe(ownLook);
    await cell(blank).click(); // unpick
    await expect(cell(blank)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('word-zoom')).toHaveCount(0);
    await cell(own[0]!).click();
    await expectZoomOver(page, own[0]!, b.words[own[0]!]!);
    await tapMain(page, /: Reveal /);
    await page.clock.runFor(400);
    await expect(page.getByTestId('word-zoom')).toHaveCount(0);
  });

  test('a turned-over cell: a tap only zooms, for 2 000 ms; another tap within that time moves it', async ({ page }) => {
    const b = oracleBoard(WIDE_CODE);
    await guessingOn(page, WIDE_CODE, 'zoom-turned', 2);
    const own = b.kinds.map((k, i) => (k === b.starts ? i : -1)).filter((i) => i >= 0);
    await revealCell(page, own[0]!);
    await revealCell(page, own[1]!);
    await waitGuards(page);
    await freezeClock(page);
    const cell = (i: number) => page.locator(`[data-testid="word-board"] [data-index="${i}"]`);
    await cell(own[0]!).click();
    await expectZoomOver(page, own[0]!, b.words[own[0]!]!);
    await expect(mainButton(page).filter({ hasText: /: Reveal$/ }), 'the tap picks nothing').toBeDisabled();
    await page.clock.runFor(1000);
    await cell(own[1]!).click(); // within 2 000 ms: moves the zoom
    await expectZoomOver(page, own[1]!, b.words[own[1]!]!);
    await page.clock.runFor(1900);
    await expectZoomOver(page, own[1]!, b.words[own[1]!]!);
    await page.clock.runFor(200);
    await expect(page.getByTestId('word-zoom')).toHaveCount(0);
  });
});

test.describe('SWD-117: the map phone from the host\'s QR link', () => {
  const code = '27P3QX8';
  const b = oracleBoard(code);
  const pair = TEAM_PAIRS[0]!;
  const starter = b.starts === 'orange' ? pair.orange : pair.teal;

  test('#map=27P3QX8&t=SWDT-01 opens the map phone with team names; the hash is removed; the map is the code\'s', async ({ page }) => {
    await freshPhone(page);
    await page.goto('about:blank');
    await page.goto(`./#map=${code}&t=${pair.id}`);
    await expect(page.getByRole('heading', { name: 'Secret Words map' })).toBeVisible();
    await expect(page.getByTestId('map-teams')).toHaveText(`${pair.orange} (orange) · ${pair.teal} (teal)`);
    await expect(page.getByTestId('map-code-line')).toHaveText(`Host's code ${shown(code)} · ${starter} go first`);
    await expect(page.getByTestId('first-words')).toHaveText(`First words: ${b.words.slice(0, 3).join(' · ')}`);
    expect(new URL(page.url()).hash).toBe('');
    const cells = await cellsOf(mapCells(page));
    expect(cells.map((c) => c.word)).toEqual(b.words);
    expect(cells.map((c) => kindOf(c.name))).toEqual(b.kinds);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pgn.secretWords.map') ?? 'null'));
    expect(saved).toMatchObject({ t: pair.id, found: [] });
    expect(String(saved.code).replace('-', '')).toBe(code);
    // Team icons are SVG shapes, never the characters ● or ◆ (Terms).
    expect(await page.evaluate(() => /[●◆]/.test(document.body.innerText))).toBe(false);
    // Two phones (no p): no "I give clues for:".
    await expect(page.getByTestId('my-team')).toHaveCount(0);
  });

  test('an unknown t is ignored: no map-teams, "Host\'s code 27P-3QX8 · Orange team goes first" (or Teal)', async ({ page }) => {
    await freshPhone(page);
    await page.goto('about:blank');
    await page.goto(`./#map=${code}&t=SWDT-99`);
    await expect(page.getByRole('heading', { name: 'Secret Words map' })).toBeVisible();
    await expect(page.getByTestId('map-teams')).toHaveCount(0);
    await expect(page.getByTestId('map-code-line')).toHaveText(`Host's code ${shown(code)} · ${b.starts === 'orange' ? 'Orange' : 'Teal'} team goes first`);
  });

  test('&p=own (three phones): my-team "I give clues for:" with the two team names; saved with the map', async ({ page }) => {
    await freshPhone(page);
    await page.goto('about:blank');
    await page.goto(`./#map=${code}&t=${pair.id}&p=own`);
    const mine = page.getByTestId('my-team');
    await expect(mine).toContainText('I give clues for:');
    await expect(mine.getByRole('button', { name: pair.orange, exact: true })).toBeVisible();
    await expect(mine.getByRole('button', { name: pair.teal, exact: true })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pgn.secretWords.map') ?? 'null'))).toMatchObject({ t: pair.id, p: 'own' });
  });

  for (const phones of ['Two phones', 'Three phones'] as const) {
    test(`the host's scan QR (${phones}) is <origin><BASE_URL>#map=<code>&t=<pair id>${phones === 'Three phones' ? '&p=own' : ''}`, async ({ page }) => {
      await hostEvening(page, { phones, boards: [code], seed: 'qr' });
      await expect(scanHeading(page)).toBeVisible();
      await expect(page.getByTestId('map-code-text')).toContainText(shown(code));
      const text = await readDrawnQr(page.getByTestId('map-qr'));
      const base = new URL('./', page.url()).href;
      const m = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#map=${code}&t=(SWDT-\\d\\d)${phones === 'Three phones' ? '&p=own' : ''}$`).exec(text ?? '');
      expect(m, `QR text: ${text}`).not.toBeNull();
      const p = TEAM_PAIRS.find((x) => x.id === m![1])!;
      expect(p).toBeDefined();
      // The pair id is this game night's: its names are the host's team names.
      await tapMain(page, phones === 'Two phones' ? /^The map phone has the map$/ : /^Both have the map$/);
      await expect(page.getByTestId('turn-heading')).toHaveText(`${b.starts === 'orange' ? p.orange : p.teal}, your turn`);
    });
  }
});

/** Host (two phones) at game over through "End the game", with the whole map shown: words and kinds by cell. */
async function hostBoardAtGameOver(page: Page, code: string) {
  await hostEvening(page, { phones: 'Two phones', boards: [code], seed: `host-${code}` });
  await expect(scanHeading(page)).toBeVisible();
  await expect(page.getByTestId('map-code-text')).toContainText(shown(code));
  const qr = await readDrawnQr(page.getByTestId('map-qr'));
  await tapMain(page, /^The map phone has the map$/);
  const heading = (await page.getByTestId('turn-heading').textContent())!.trim();
  await giveClue(page, 1);
  const during = await cellsOf(boardCells(page));
  await fromMenu(page, 'End the game');
  await waitGuards(page);
  await page.getByRole('dialog').getByRole('button', { name: 'End the game', exact: true }).click();
  await expect(page.getByTestId('game-heading')).toHaveText('Game ended. No winner.');
  const after = await cellsOf(page.getByTestId('word-board').locator('[data-index]'));
  return { qr, heading, during, after };
}

test.describe('SWD-022: the host board and a map phone given the same code agree', () => {
  for (const code of CODES) {
    test(`code ${shown(code)}: the same words in the same cells, the same kinds, the same starting team`, async ({ page, browser }, testInfo) => {
      const b: OracleBoard = oracleBoard(code);
      const host = await hostBoardAtGameOver(page, code);
      expect(host.during.map((c) => c.word)).toEqual(b.words);
      expect(host.after.map((c) => kindOf(c.name))).toEqual(b.kinds);
      const map = await newPhone(browser, testInfo);
      await map.goto(host.qr!);
      await expect(map.getByRole('heading', { name: 'Secret Words map' })).toBeVisible();
      const cells = await cellsOf(mapCells(map));
      expect(cells.map((c) => c.word)).toEqual(host.during.map((c) => c.word));
      expect(cells.map((c) => kindOf(c.name))).toEqual(host.after.map((c) => kindOf(c.name)));
      // Starting team: the host's first clue screen and the map phone's code line name the same team.
      const starterName = host.heading.replace(/, your turn$/, '');
      await expect(map.getByTestId('map-code-line')).toHaveText(`Host's code ${shown(code)} · ${starterName} go first`);
    });
  }
});

test.describe('SWD-129: Show the map code again', () => {
  test('two phones, at the clue screen: the scan screen for the current board, no menu, "Back to the game" returns; nothing is recorded', async ({ page }) => {
    const code = CODES[3]!;
    await hostEvening(page, { phones: 'Two phones', boards: [code], seed: 'again' });
    await tapMain(page, /^The map phone has the map$/);
    await expect(page.getByTestId('clue-prompt')).toBeVisible();
    const heading = (await page.getByTestId('turn-heading').textContent())!.trim();
    const before = await savedRecords(page);
    await fromMenu(page, 'Show the map code again');
    await expect(scanHeading(page)).toBeVisible();
    await expect(page.getByTestId('map-code-text')).toContainText(shown(code));
    await expect(page.getByTestId('board-check')).toBeVisible();
    await expect(page.getByText("Guessers: don't scan this one!", { exact: true })).toBeVisible();
    await expect(page.getByTestId('dnd-tip')).toHaveCount(0);
    await expect(menuButton(page)).toHaveCount(0);
    await tapMain(page, /^Back to the game$/);
    await expect(page.getByTestId('turn-heading')).toHaveText(heading);
    await expect(page.getByTestId('clue-prompt')).toBeVisible();
    expect(await savedRecords(page)).toEqual(before);
  });
});

/** The saved Secret Words evening's move records on this phone (pgn.game.*). */
async function savedRecords(page: Page): Promise<unknown[]> {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('pgn.game.')) continue;
      try { const g = JSON.parse(localStorage.getItem(k)!); if (g?.gameType === 'secret-words') return g.records; } catch { /* not ours */ }
    }
    return [];
  });
}

/**
 * SWD-025: on a room screen, every face-down cell has the same attributes, classes, inline style and computed style,
 * except `data-index` and the word text (which also appears in its accessible name).
 */
async function faceDownUniform(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const cells = [...document.querySelectorAll('[data-testid="word-board"] [data-testid="board-cell"]')] as HTMLElement[];
    const down = cells.filter((c) => /, face down$/.test(c.getAttribute('aria-label') ?? ''));
    const sig = (el: HTMLElement) => {
      const word = (el.textContent ?? '').trim();
      const attrs = [...el.attributes].filter((a) => a.name !== 'data-index')
        .map((a) => `${a.name}=${a.value.split(word).join('<WORD>')}`).sort().join('|');
      const cs = getComputedStyle(el);
      const style = [...cs].map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
      const inner = el.innerHTML.split(word).join('<WORD>');
      return `${attrs}\n${style}\n${inner}`;
    };
    const first = down[0] ? sig(down[0]) : '';
    return down.filter((c) => sig(c) !== first).map((c) => `cell ${c.getAttribute('data-index')} differs`);
  });
}

test.describe('SWD-025: room screens carry no kind of a face-down cell', () => {
  for (const phones of ['One phone', 'Two phones', 'Three phones'] as const) {
    test(`${phones}: 10 seeded games, at every step`, async ({ page }) => {
      test.setTimeout(10 * 60_000);
      for (let g = 0; g < 10; g++) {
        const code = oracleCode({ edition: 1, board: 'full', words: 'family' }, 10_007 * (g + 1), g);
        const b = oracleBoard(code);
        await hostEvening(page, { phones, boards: [code], seed: `private-${phones}-${g}` });
        const check = async (where: string) => {
          expect(await faceDownUniform(page), `game ${g + 1}, ${where}`).toEqual([]);
          // No map code on a room screen.
          expect(await page.evaluate((c) => document.body.innerHTML.includes(c), shown(code)), `game ${g + 1}, ${where}: the code`).toBe(false);
        };
        const toClue = async () => {
          if (phones === 'One phone') { await check('pass screen'); await passToClue(page); }
        };
        if (phones !== 'One phone') await tapMain(page, /^(The map phone has the map|Both have the map)$/);
        // Turn 1: one of the team's own words, then a nobody's word (turn over).
        await toClue();
        await check('clue screen');
        await giveClue(page, 2);
        await check('guessing');
        const own = b.kinds.map((k, i) => (k === b.starts ? i : -1)).filter((i) => i >= 0);
        const blank = b.kinds.indexOf('nobody');
        await revealCell(page, own[0]!);
        await check('after an own word');
        await revealCell(page, blank);
        await check('turn over');
        await tapMain(page, /^Other team's turn$/);
        // Turn 2: the other team finds all its words.
        await toClue();
        await check('clue screen, turn 2');
        await giveClue(page, 'inf');
        const theirs = b.kinds.map((k, i) => (k !== b.starts && k !== 'nobody' && k !== 'landmine' ? i : -1)).filter((i) => i >= 0);
        for (const c of theirs) {
          await revealCell(page, c);
          if (await page.getByTestId('game-heading').count()) break;
          await check(`guessing, turn 2, after cell ${c}`);
        }
        await expect(page.getByTestId('game-heading')).toBeVisible();
        // Game over (G1, lane D; SWD-025 ends here, SWD-051, 093): the other team won with all its words; from now on the
        // whole map is shown, every cell named with its kind (face-down cells ", not found"), none "face down".
        const winner = b.starts === 'orange' ? 'teal' : 'orange';
        const teamNames = await page.evaluate(() => {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)!;
            if (!k.startsWith('pgn.game.')) continue;
            try { const s = JSON.parse(localStorage.getItem(k)!); if (s?.gameType === 'secret-words') return s.setup.config.teams.names; } catch { /* not ours */ }
          }
          return null;
        });
        await expect(page.getByTestId('game-heading'), `game ${g + 1}`).toHaveText(`${teamNames[winner]} win!`);
        await expect(page.getByTestId('result-line'), `game ${g + 1}`).toHaveText(`All ${theirs.length} words found.`);
        const over = await cellsOf(boardCells(page));
        expect(over.map((c) => kindOf(c.name)), `game ${g + 1}: the whole map at game over`).toEqual(b.kinds);
      }
    });
  }
});

test.describe('SWD-117 / SWD-022: a typed code opens the same map, without team names', () => {
  test('the code entry with "27p-3qx8" opens the map phone: no map-teams, the code\'s words', async ({ page }) => {
    await freshPhone(page);
    await waitGuards(page);
    await page.getByRole('button', { name: /^Join a game/ }).click();
    await waitGuards(page);
    await page.getByRole('button', { name: "Type the host's code", exact: true }).click();
    await page.getByLabel("Host's code", { exact: true }).fill('27p-3qx8');
    await tapMain(page, /^Open the map$/);
    await expect(page.getByRole('heading', { name: 'Secret Words map' })).toBeVisible();
    await expect(page.getByTestId('map-teams')).toHaveCount(0);
    expect((await cellsOf(mapCells(page))).map((c) => c.word)).toEqual(oracleBoard('27P3QX8').words);
    await expect(mainButton(page)).toHaveCount(0);
  });
});
