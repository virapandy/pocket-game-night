// Secret Words, screen lane B: the shared pieces lane B builds first for lanes C and D (build-plan.md §2), each tested on
// its own (scenarios v3.7, 23 October 2026): the board grid (SWD-090, 091, 092, 093, 042 locked-cell zoom), the team bar
// (Terms), `pause-button` (SWD-110), `where-line` (SWD-032, 110) and the tap-guard look (SWD-114).
// Written before the screens exist: they fail until lane B (and lane A's setup screens, which lead here) are built.
import { expect, test, type Page } from './fixtures';
import { freezeClock, mainButton } from './impostor';
import { boardCells, cellsOf, kindOf, menuButton, passToClue, tapMain, waitGuards } from './secret-words';
import {
  box, byId, cellAt, clueGiver, easyCode, fontPx, fullCode, guardState, guess, host, holdPad, indexesOf, other, pageScrolls,
  pauseButton, quiet, teamsOf, toClueScreen, toGuessing, turnHeading,
} from './secret-words-b';
import { oracleBoard } from './secret-words';

const CODE = fullCode(4242, 3);
const B = oracleBoard(CODE);

// ---------------------------------------------------------------------------------------------------------------------
// The board grid (SWD-090 portrait, SWD-091 landscape, SWD-092 narrow portrait, SWD-093 never colour alone)
// ---------------------------------------------------------------------------------------------------------------------

/** Every cell's box, font size and word, in `data-index` order. */
async function grid(page: Page) {
  return boardCells(page).evaluateAll((els) => els.map((el) => {
    const r = el.getBoundingClientRect();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => ((n.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const holder = walker.nextNode()?.parentElement ?? el;
    const cs = getComputedStyle(holder);
    return {
      index: Number(el.getAttribute('data-index')), x: r.x, y: r.y, w: r.width, h: r.height,
      size: parseFloat(cs.fontSize), weight: cs.fontWeight, transform: cs.textTransform,
      word: (el.textContent ?? '').trim(),
    };
  }).sort((a, b) => a.index - b.index));
}

test.describe('SWD-090: the portrait board', () => {
  for (const { width, height, cellW } of [{ width: 390, height: 844, cellW: 71.6 }, { width: 360, height: 640, cellW: 65.6 }]) {
    test.describe(`${width} × ${height}`, () => {
      test.use({ viewport: { width, height } });
      test(`5 × 5 in row-major order: 8 px side margins, 4 px gaps, cells ${cellW} px wide and 48–56 px tall; one font size 12–22 px (word text: weight 600, not transformed); no page scrolling`, async ({ page }) => {
        await toGuessing(page, { phones: 'One phone', code: CODE, seed: `grid-${width}` });
        const cells = await grid(page);
        expect(cells).toHaveLength(25);
        expect(cells.map((c) => c.word), 'the code\'s words in cell order').toEqual(B.words);
        for (const c of cells) {
          const row = Math.floor(c.index / 5), col = c.index % 5;
          expect(Math.abs(c.w - cellW), `cell ${c.index} width ${c.w}`).toBeLessThanOrEqual(0.6);
          expect(c.h, `cell ${c.index} height`).toBeGreaterThanOrEqual(48 - 0.5);
          expect(c.h, `cell ${c.index} height`).toBeLessThanOrEqual(56 + 0.5);
          expect(Math.abs(c.x - (8 + col * (cellW + 4))), `cell ${c.index} column ${col}`).toBeLessThanOrEqual(0.6);
          if (row > 0) expect(Math.abs(c.y - (cells[c.index - 5]!.y + cells[c.index - 5]!.h + 4)), `cell ${c.index}: 4 px gap above`).toBeLessThanOrEqual(0.6);
          expect(c.weight, `${c.word}: weight 600`).toBe('600');
          expect(c.transform, `${c.word}: word text is never transformed`).toBe('none');
        }
        const sizes = [...new Set(cells.filter((c) => c.size >= 12).map((c) => c.size))];
        expect(sizes, 'one font size for the words that fit at 12 px or more').toHaveLength(1);
        expect(Number.isInteger(sizes[0]!) && sizes[0]! >= 12 && sizes[0]! <= 22, `board size ${sizes[0]} px`).toBe(true);
        expect(await pageScrolls(page), 'no page scrolling').toBe(false);
      });
    });
  }

  test.describe('390 × 844, Larger text on', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('Larger text doesn\'t change the board\'s font size; no page scrolling', async ({ page }) => {
      await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'grid-off' });
      const off = Math.max(...(await grid(page)).map((c) => c.size));
      await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'grid-on', storage: { 'pgn.pref.largerText': true } });
      const on = Math.max(...(await grid(page)).map((c) => c.size));
      expect(on).toBe(off);
      expect(await pageScrolls(page), 'no page scrolling with Larger text').toBe(false);
    });
  });
});

test.describe('SWD-091: the landscape board', () => {
  test.describe('812 × 375', () => {
    test.use({ viewport: { width: 812, height: 375 } });
    test('grid at the left (16 px left margin), 200 px panel at the right (16 px right margin, 12 px gap); cells at least 100 × 56; main 200 × 60 at the panel\'s bottom; no page scrolling', async ({ page }) => {
      await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'land-812' });
      const cells = await grid(page);
      for (const c of cells) {
        expect(c.w, `cell ${c.index} width`).toBeGreaterThanOrEqual(100 - 0.5);
        expect(c.h, `cell ${c.index} height`).toBeGreaterThanOrEqual(56 - 0.5);
      }
      expect(Math.abs(cells[0]!.x - 16)).toBeLessThanOrEqual(0.6);
      const gridRight = Math.max(...cells.map((c) => c.x + c.w));
      const main = await box(mainButton(page));
      expect(Math.abs(main.width - 200), `main width ${main.width}`).toBeLessThanOrEqual(0.6);
      expect(Math.abs(main.height - 60), `main height ${main.height}`).toBeLessThanOrEqual(0.6);
      expect(Math.abs(812 - 16 - (main.x + main.width)), 'panel: 16 px right margin').toBeLessThanOrEqual(0.6);
      expect(Math.abs(main.x - gridRight - 12), 'panel: 12 px from the grid').toBeLessThanOrEqual(0.6);
      expect(Math.abs(375 - 16 - (main.y + main.height)), 'main 16 px from the bottom').toBeLessThanOrEqual(0.6);
      expect(await pageScrolls(page)).toBe(false);
      // Until the first reveal the action slot holds "Change clue" and "Clue not allowed?" stacked, 200 × 48 each.
      for (const name of ['Change clue', 'Clue not allowed?']) {
        const b = await box(quiet(page, name));
        expect(Math.abs(b.width - 200), `${name} width`).toBeLessThanOrEqual(0.6);
        expect(Math.abs(b.height - 48), `${name} height`).toBeLessThanOrEqual(0.6);
      }
    });
  });

  test.describe('568 × 320', () => {
    test.use({ viewport: { width: 568, height: 320 } });
    test('a 160 px panel, 8 px margins; cells at least 69 × 54; main 160 × 60; "Change clue", "Clue not allowed?" and "Flip the board" are menu items; no page scrolling', async ({ page }) => {
      await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'land-568' });
      const cells = await grid(page);
      for (const c of cells) {
        expect(c.w, `cell ${c.index} width`).toBeGreaterThanOrEqual(69 - 0.5);
        expect(c.h, `cell ${c.index} height`).toBeGreaterThanOrEqual(54 - 0.5);
      }
      const main = await box(mainButton(page));
      expect(Math.abs(main.width - 160)).toBeLessThanOrEqual(0.6);
      expect(Math.abs(main.height - 60)).toBeLessThanOrEqual(0.6);
      expect(Math.abs(568 - 8 - (main.x + main.width)), '8 px right margin').toBeLessThanOrEqual(0.6);
      expect(await pageScrolls(page)).toBe(false);
      await expect(quiet(page, 'Change clue')).toHaveCount(0);
      await expect(quiet(page, 'Clue not allowed?')).toHaveCount(0);
      await waitGuards(page);
      await menuButton(page).click();
      for (const item of ['Change clue', 'Clue not allowed?', 'Flip the board']) await expect(page.getByRole('menuitem', { name: item, exact: true })).toBeVisible();
    });
  });
});

test.describe('SWD-092: narrow portrait (320 × 568)', () => {
  test.use({ viewport: { width: 320, height: 568 } });
  test('Full board: "Turn your phone sideways to see the board." in place of the grid, with "Or choose the Easy board for the next game."; the Reveal main stays disabled', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'narrow-full' });
    await expect(byId(page, 'turn-sideways')).toHaveText('Turn your phone sideways to see the board.');
    await expect(byId(page, 'turn-sideways-hint')).toHaveText('Or choose the Easy board for the next game.');
    await expect(boardCells(page)).toHaveCount(0);
    await expect(mainButton(page)).toHaveText(/: Reveal$/);
    await expect(mainButton(page)).toBeDisabled();
    // Turning to landscape shows the grid.
    await page.setViewportSize({ width: 568, height: 320 });
    await expect(boardCells(page)).toHaveCount(25);
    await expect(byId(page, 'turn-sideways')).toHaveCount(0);
  });

  test('Easy board: a 4 × 4 grid, cells 73 px wide and 48 px tall, 8 px margins, 4 px gaps; no sideways line; a pick and Reveal work', async ({ page }) => {
    const code = easyCode(4242, 3);
    const b = oracleBoard(code);
    await toGuessing(page, { phones: 'One phone', code, seed: 'narrow-easy', board: 'easy' });
    await expect(byId(page, 'turn-sideways')).toHaveCount(0);
    const cells = await grid(page);
    expect(cells).toHaveLength(16);
    for (const c of cells) {
      expect(Math.abs(c.w - 73), `cell ${c.index} width ${c.w}`).toBeLessThanOrEqual(0.6);
      expect(Math.abs(c.h - 48), `cell ${c.index} height ${c.h}`).toBeLessThanOrEqual(0.6);
      expect(Math.abs(c.x - (8 + (c.index % 4) * 77)), `cell ${c.index} column`).toBeLessThanOrEqual(0.6);
    }
    const own = indexesOf(b, b.starts)[0]!;
    await guess(page, own);
    await expect(cellAt(page, own)).toHaveAttribute('aria-label', new RegExp(`^${b.words[own]}, ${b.starts} team`));
  });
});

test.describe('SWD-093: never colour alone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('turned-over cells: "<Word>, orange team" / "teal team" / nobody\'s word, each with its icon (SVG, aria-hidden, 16 × 16, top left); face-down cells "<Word>, face down"; no ● or ◆ characters', async ({ page }) => {
    const { b } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'icons', n: 'inf' });
    const own = indexesOf(b, b.starts)[0]!;
    const nobody = indexesOf(b, 'nobody')[0]!;
    const before = await cellsOf(boardCells(page));
    for (const c of before) expect(c.name, `cell ${c.index}`).toBe(`${c.word}, face down`);
    await guess(page, own);
    await guess(page, nobody);
    const after = await cellsOf(page.getByTestId('word-board').locator('[data-index]'));
    expect(kindOf(after[own]!.name)).toBe(b.starts);
    expect(kindOf(after[nobody]!.name)).toBe('nobody');
    expect(after[nobody]!.name).toBe(`${b.words[nobody]}, nobody's word`);
    for (const i of [own, nobody]) {
      const icon = await cellAt(page, i).evaluate((el) => {
        const svg = el.querySelector('svg');
        if (!svg) return null;
        const r = svg.getBoundingClientRect(), c = el.getBoundingClientRect();
        return { hidden: svg.closest('[aria-hidden="true"]') !== null, w: r.width, h: r.height, dx: r.x - c.x, dy: r.y - c.y };
      });
      expect(icon, `cell ${i} has an SVG icon`).not.toBeNull();
      expect(icon!.hidden, 'aria-hidden').toBe(true);
      expect(Math.abs(icon!.w - 16) + Math.abs(icon!.h - 16), '16 × 16').toBeLessThanOrEqual(1);
      expect(icon!.dx, 'top left, inside the cell').toBeGreaterThanOrEqual(0);
      expect(icon!.dx, 'top left (2 px in)').toBeLessThanOrEqual(4);
      expect(icon!.dy, 'top left (2 px in)').toBeLessThanOrEqual(4);
    }
    expect(await page.evaluate(() => /[●◆]/.test(document.body.innerText))).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Tap to zoom on locked cells (SWD-042 v3.6) and locked look (Terms), on the preview board
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-042 (v3.6) / Terms "Locked": the preview board', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('every cell locked (aria-disabled, not greyed); a tap only zooms (28 px, weight 700) for 2 000 ms and picks nothing', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'locked', preview: true });
    await expect(page.getByRole('heading', { name: 'The board, before you start' })).toBeVisible();
    const cells = page.getByTestId('word-board').locator('[data-index]');
    await expect(cells).toHaveCount(25);
    for (let i = 0; i < 25; i++) {
      const c = cells.nth(i);
      await expect(c).toHaveAttribute('aria-disabled', 'true');
      expect(Number(await c.evaluate((el) => getComputedStyle(el).opacity)), 'not greyed').toBe(1);
    }
    await freezeClock(page);
    await cellAt(page, 12).click({ force: true });
    const zoom = page.getByTestId('word-zoom');
    await expect(zoom).toHaveText(B.words[12]!);
    expect(await fontPx(zoom)).toBe(28);
    await expect(cellAt(page, 12)).not.toHaveAttribute('aria-pressed', 'true');
    await page.clock.runFor(1900);
    await expect(zoom).toBeVisible();
    await page.clock.runFor(200);
    await expect(zoom).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The team bar (Terms)
// ---------------------------------------------------------------------------------------------------------------------

/** The team bar's colour against the team colour variable, resolved the same way. */
async function teamBar(page: Page) {
  return page.evaluate(() => {
    const bar = document.querySelector('[data-testid="team-bar"]') as HTMLElement | null;
    if (!bar) return null;
    const probe = document.createElement('div');
    document.body.appendChild(probe);
    const resolve = (v: string) => { probe.style.backgroundColor = `var(${v})`; return getComputedStyle(probe).backgroundColor; };
    const out = { orange: resolve('--team-orange'), teal: resolve('--team-teal') };
    probe.remove();
    const r = bar.getBoundingClientRect();
    return { colour: getComputedStyle(bar).backgroundColor, ...out, x: r.x, y: r.y, w: r.width, h: r.height, vw: window.innerWidth };
  });
}

test.describe('Terms: the team bar', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('an 8 px strip in the team colour across the top edge on the pass screen, the clue screen and the board; none on the private map; the next team\'s colour on its turn', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'bar' });
    const check = async (where: string, team: 'orange' | 'teal') => {
      const t = await teamBar(page);
      expect(t, `${where}: a team bar`).not.toBeNull();
      expect(Math.abs(t!.h - 8), `${where}: 8 px tall`).toBeLessThanOrEqual(0.5);
      expect(t!.y, `${where}: at the top edge`).toBeLessThanOrEqual(0.5);
      expect(Math.abs(t!.w - t!.vw), `${where}: across the screen`).toBeLessThanOrEqual(1);
      expect(t!.colour, `${where}: ${team} colour`).toBe(t![team]);
    };
    await check('pass screen', B.starts);
    await tapMain(page, /^I'm /);
    await expect(holdPad(page)).toBeVisible();
    expect(await teamBar(page), 'private map: no team bar').toBeNull();
    await waitGuards(page);
    await holdPad(page).click();
    await tapMain(page, /^I have my clue$/);
    await check('clue screen', B.starts);
    await waitGuards(page);
    await page.getByTestId('clue-key').filter({ hasText: /^1$/ }).click();
    await tapMain(page, /^Clue for 1: start guessing$/);
    await check('guessing', B.starts);
    await guess(page, indexesOf(B, 'nobody')[0]!);
    await check('turn over (the team that just played)', B.starts);
    await tapMain(page, /^Other team's turn$/);
    await check('next pass screen', other(B.starts));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// pause-button (SWD-110 v3.6)
// ---------------------------------------------------------------------------------------------------------------------

async function expectPauseBeside(page: Page, where: string) {
  const p = pauseButton(page);
  await expect(p, `${where}: pause-button`).toBeVisible();
  await expect(p).toHaveAccessibleName('Pause');
  const pb = await box(p), mb = await box(menuButton(page));
  expect(Math.abs(pb.width - 44) + Math.abs(pb.height - 44), `${where}: 44 × 44`).toBeLessThanOrEqual(1);
  expect(pb.x + pb.width, `${where}: left of "··· Menu"`).toBeLessThanOrEqual(mb.x + 0.5);
  expect(Math.abs(pb.y + pb.height / 2 - (mb.y + mb.height / 2)), `${where}: on the Menu's row`).toBeLessThanOrEqual(4);
  expect(await p.evaluate((el) => !!el.querySelector('svg')), `${where}: our own SVG icon`).toBe(true);
}

test.describe('SWD-110 (v3.6): pause-button', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('one phone: on the preview, pass, clue, guessing, end-turn line and turn over, left of "··· Menu"; not on the private map; a tap opens the Pause cover', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'pause-btn', preview: true });
    await expectPauseBeside(page, 'preview');
    await tapMain(page, /^Start$/);
    await expectPauseBeside(page, 'pass screen');
    await tapMain(page, /^I'm /);
    await expect(holdPad(page)).toBeVisible();
    await expect(pauseButton(page), 'private map: no pause-button').toHaveCount(0);
    await waitGuards(page);
    await holdPad(page).click();
    await tapMain(page, /^I have my clue$/);
    await expectPauseBeside(page, 'clue screen');
    await waitGuards(page);
    await page.getByTestId('clue-key').filter({ hasText: /^3$/ }).click();
    await tapMain(page, /^Clue for 3: start guessing$/);
    await expectPauseBeside(page, 'guessing');
    await guess(page, indexesOf(B, B.starts)[0]!);
    await waitGuards(page);
    await quiet(page, 'End our turn').click();
    await expectPauseBeside(page, 'end-turn line');
    await quiet(page, 'Oops, keep guessing').click();
    await guess(page, indexesOf(B, 'nobody')[0]!);
    await expectPauseBeside(page, 'turn over');
    await waitGuards(page);
    await pauseButton(page).click();
    await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
    await expect(page.getByTestId('pause-cover')).toBeVisible();
  });

  test('two phones: on the scan screen, left of "··· Menu"', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'pause-scan' });
    await expectPauseBeside(page, 'scan screen');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// where-line (SWD-110 v3.6, SWD-032): on the Pause cover and under "Welcome back."
// ---------------------------------------------------------------------------------------------------------------------

async function pausedWhere(page: Page): Promise<string> {
  await waitGuards(page);
  await pauseButton(page).click();
  const cover = page.getByRole('dialog', { name: 'Paused' });
  await expect(cover).toBeVisible();
  const text = ((await cover.getByTestId('where-line').textContent()) ?? '').trim();
  await tapMain(page, /^Carry on$/);
  await expect(cover).toHaveCount(0);
  return text;
}

test.describe('SWD-110 (v3.6): where-line for the step the game is on', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('preview "Before game 1"; pass and clue "Turn 1 · clue for <team>"; guessing "<team> guessing · 3 guesses left", then "2 guesses left"; end-turn "Turn 1 · <team> ended their turn"; turn over "Turn 1 over · <other> next"', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'where', preview: true });
    const teams = await teamsOf(page);
    const T = teams.names[B.starts], O = teams.names[other(B.starts)];
    expect(await pausedWhere(page)).toBe('Before game 1');
    await tapMain(page, /^Start$/);
    expect(await pausedWhere(page)).toBe(`Turn 1 · clue for ${T}`);
    await passToClue(page);
    expect(await pausedWhere(page)).toBe(`Turn 1 · clue for ${T}`);
    await waitGuards(page);
    await page.getByTestId('clue-key').filter({ hasText: /^2$/ }).click();
    await tapMain(page, /^Clue for 2: start guessing$/);
    expect(await pausedWhere(page)).toBe(`${T} guessing · 3 guesses left`);
    await guess(page, indexesOf(B, B.starts)[0]!);
    expect(await pausedWhere(page)).toBe(`${T} guessing · 2 guesses left`);
    await waitGuards(page);
    await quiet(page, 'End our turn').click();
    expect(await pausedWhere(page)).toBe(`Turn 1 · ${T} ended their turn`);
    await quiet(page, 'Oops, keep guessing').click();
    await guess(page, indexesOf(B, 'nobody')[0]!);
    expect(await pausedWhere(page)).toBe(`Turn 1 over · ${O} next`);
  });

  test('guessing with ∞: "<team> guessing · as many as you like"; scan screen "Scan the map, game 1"', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'where-inf' });
    const teams = await teamsOf(page);
    expect(await pausedWhere(page)).toBe('Scan the map, game 1');
    await toClueScreen(page, 'Two phones');
    await waitGuards(page);
    await page.getByRole('button', { name: 'As many as you like', exact: true }).click();
    await tapMain(page, /^Clue for ∞: start guessing$/);
    expect(await pausedWhere(page)).toBe(`${teams.names[B.starts]} guessing · as many as you like`);
  });

  test('a small line of at most 2 lines; names never shortened', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'where-fit' });
    await waitGuards(page);
    await pauseButton(page).click();
    const w = page.getByRole('dialog', { name: 'Paused' }).getByTestId('where-line');
    const teams = await teamsOf(page);
    await expect(w).toHaveText(`Turn 1 · clue for ${teams.names[B.starts]}`);
    const m = await w.evaluate((el) => ({ h: el.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.5, size: parseFloat(getComputedStyle(el).fontSize), sw: el.scrollWidth, cw: el.clientWidth }));
    expect(m.size, 'small line 15 px').toBe(15);
    expect(m.h, 'at most 2 lines').toBeLessThanOrEqual(2 * m.lh + 1);
    expect(m.sw, 'nothing cut off').toBeLessThanOrEqual(m.cw + 1);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The tap-guard look (SWD-114 v3.5 item 2, v3.6)
// ---------------------------------------------------------------------------------------------------------------------

/** SWD-114 v3.8: a guarded main is never greyed or aria-disabled. */
function expectLooksLive(s: Awaited<ReturnType<typeof guardState>>, when: string) {
  expect(s.ariaDisabled, `not aria-disabled ${when}`).not.toBe('true');
  expect(s.disabled, `not disabled ${when}`).toBe(false);
  expect(s.opacity, `normal look ${when}`).toBe(1);
}

test.describe('SWD-114: taps right after a screen appears', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('"I\'m Riya" waits 1 s but looks live at once (not greyed, not aria-disabled, label unchanged); a tap at 950 ms does nothing and is not queued; a tap at 1 000 ms works (v3.8)', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'guard-im', preview: true });
    await waitGuards(page);
    await freezeClock(page);
    await mainButton(page).filter({ hasText: /^Start$/ }).click();
    const teams = await teamsOf(page);
    const cg = clueGiver(teams, B.starts);
    const im = mainButton(page);
    await expect(im).toHaveText(`I'm ${cg}`);
    let s = await guardState(im);
    expect(s.text).toBe(`I'm ${cg}`);
    expectLooksLive(s, 'at once, inside the guard');
    await page.clock.runFor(950);
    await im.click({ force: true });
    await expect(turnHeading(page), 'still the pass screen').toBeVisible();
    await page.clock.runFor(100);
    s = await guardState(im);
    expectLooksLive(s, 'at 1 s');
    await expect(holdPad(page), 'the ignored tap was not queued').toHaveCount(0);
    await im.click();
    await expect(holdPad(page)).toBeVisible();
  });

  test('a main disabled for another reason ("Pick a number", "<picker>: Reveal" with no pick) keeps its label and never has data-guard', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'guard-other' });
    await passToClue(page);
    await waitGuards(page);
    await expect(mainButton(page)).toHaveText('Pick a number');
    await expect(mainButton(page)).toBeDisabled();
    expect((await guardState(mainButton(page))).guard).toBeNull();
    expect((await guardState(mainButton(page))).opacity, 'a real reason still looks greyed').toBeLessThan(1);
    await page.getByTestId('clue-key').filter({ hasText: /^2$/ }).click();
    await tapMain(page, /^Clue for 2: start guessing$/);
    await waitGuards(page);
    await expect(mainButton(page)).toHaveText(/: Reveal$/);
    await expect(mainButton(page)).toBeDisabled();
    expect((await guardState(mainButton(page))).guard).toBeNull();
    expect((await guardState(mainButton(page))).opacity, 'a real reason still looks greyed').toBeLessThan(1);
  });

  test('"Other team\'s turn" after a turn-ending reveal waits 1.5 s counted from t = 300 ms; on the end-turn line it waits 800 ms; both look live at once (v3.8)', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'guard-turn', n: 2 });
    await waitGuards(page);
    await freezeClock(page);
    await cellAt(page, indexesOf(B, 'nobody')[0]!).click();
    await mainButton(page).filter({ hasText: /: Reveal / }).click(); // t = 0
    await page.clock.runFor(300 + 1450);
    const next = mainButton(page).filter({ hasText: /^Other team's turn$/ });
    expectLooksLive(await guardState(next), 'at t = 1 750 ms');
    await next.click({ force: true });
    await expect(next, 'the tap at t = 1 750 ms did nothing').toBeVisible();
    await expect(turnHeading(page)).toHaveCount(0);
    await page.clock.runFor(100);
    expectLooksLive(await guardState(next), 'at t = 1 850 ms');
    await next.click();
    await expect(turnHeading(page)).toBeVisible();

    // The end-turn line: 800 ms from the line showing.
    await page.clock.resume();
    await passToClue(page);
    await waitGuards(page);
    await page.getByTestId('clue-key').filter({ hasText: /^2$/ }).click();
    await tapMain(page, /^Clue for 2: start guessing$/);
    await guess(page, indexesOf(B, other(B.starts))[0]!);
    await waitGuards(page);
    await freezeClock(page);
    await quiet(page, 'End our turn').click();
    const line = mainButton(page).filter({ hasText: /^Other team's turn$/ });
    expectLooksLive(await guardState(line), 'when the line shows');
    await line.click({ force: true });
    await expect(line, 'a tap at once does nothing').toBeVisible();
    await page.clock.runFor(750);
    await line.click({ force: true });
    await expect(line, 'a tap at 750 ms does nothing').toBeVisible();
    await expect(turnHeading(page)).toHaveCount(0);
    await page.clock.runFor(100);
    expectLooksLive(await guardState(line), 'at 850 ms');
    await line.click();
    await expect(turnHeading(page), 'a tap at 850 ms works').toBeVisible();
  });

  test('"Carry on" waits 800 ms from the cover appearing; closing the cover doesn\'t restart the guard of the screen beneath; quiet buttons never wait', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'guard-carry' });
    await waitGuards(page);
    await freezeClock(page);
    await pauseButton(page).click();
    const carry = mainButton(page).filter({ hasText: /^Carry on$/ });
    expectLooksLive(await guardState(carry), 'when the cover shows');
    await page.clock.runFor(400);
    await carry.click({ force: true });
    await expect(carry, 'a tap at 400 ms does nothing').toBeVisible();
    await page.clock.runFor(450);
    expectLooksLive(await guardState(carry), 'at 850 ms');
    await carry.click();
    await expect(carry).toHaveCount(0);
    const im = mainButton(page).filter({ hasText: /^I'm / });
    expectLooksLive(await guardState(im), 'the pass screen\'s main stays live');
    await im.click();
    await expect(holdPad(page), 'closing the cover did not restart the pass screen\'s guard').toBeVisible();
    // A quiet button is live at once.
    expect((await guardState(quiet(page, 'Start 90-second timer'))).guard).toBeNull();
  });
});
