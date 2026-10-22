// Secret Words on screen: the C3 browser checks (scenarios v3.6, 22 October 2026), written before the screens exist.
// SWD-099 (every word fits its cell), SWD-022 (host board = map phone for the same code), SWD-025 (no kind of a
// face-down cell in a room screen's DOM), SWD-117 (the QR format and team names on the map phone), SWD-129 (Show the
// map code again records nothing). Rules: tests/games/secret-words/. Helpers: secret-words.ts.
// Tests that need the Secret Words screens are marked `aheadOfSecretWordsScreens` (expected to fail until built).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from './fixtures';
import { closePhones, newPhone, readDrawnQr } from './phone';
import { freshPhone, mainButton } from './impostor';
import {
  aheadOfSecretWordsScreens, boardCells, cellsOf, fromMenu, giveClue, hostEvening, kindOf, mapCells, menuButton, oracleBoard,
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

test.describe('SWD-099: every word fits its cell', () => {
  test('every word, as word text (body font, weight 600), fits in 57 px at 12 px and in 63 px at 14 px', async ({ page }) => {
    await page.goto('./');
    const tooWide = await page.evaluate(async (words) => {
      const family = getComputedStyle(document.body).fontFamily;
      await document.fonts.load(`600 12px ${family}`, words.join(''));
      await document.fonts.load(`600 14px ${family}`, words.join(''));
      await document.fonts.ready;
      const span = document.createElement('span');
      span.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;font-family:${family};font-weight:600;text-transform:none;letter-spacing:normal`;
      document.body.appendChild(span);
      const out: string[] = [];
      for (const w of words) {
        span.textContent = w;
        span.style.fontSize = '12px';
        const at12 = span.getBoundingClientRect().width;
        span.style.fontSize = '14px';
        const at14 = span.getBoundingClientRect().width;
        if (at12 > 57 || at14 > 63) out.push(`${w} (${at12.toFixed(1)} px at 12, ${at14.toFixed(1)} px at 14)`);
      }
      span.remove();
      return out;
    }, WORDS);
    expect(tooWide, 'words to report to the product owner (SWD-099)').toEqual([]);
  });
});

test.describe('SWD-117: the map phone from the host\'s QR link', () => {
  const code = '27P3QX8';
  const b = oracleBoard(code);
  const pair = TEAM_PAIRS[0]!;
  const starter = b.starts === 'orange' ? pair.orange : pair.teal;

  test('#map=27P3QX8&t=SWDT-01 opens the map phone with team names; the hash is removed; the map is the code\'s', async ({ page }) => {
    aheadOfSecretWordsScreens('map phone (SWD-034, 117)');
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
    aheadOfSecretWordsScreens('map phone (SWD-117)');
    await freshPhone(page);
    await page.goto('about:blank');
    await page.goto(`./#map=${code}&t=SWDT-99`);
    await expect(page.getByRole('heading', { name: 'Secret Words map' })).toBeVisible();
    await expect(page.getByTestId('map-teams')).toHaveCount(0);
    await expect(page.getByTestId('map-code-line')).toHaveText(`Host's code ${shown(code)} · ${b.starts === 'orange' ? 'Orange' : 'Teal'} team goes first`);
  });

  test('&p=own (three phones): my-team "I give clues for:" with the two team names; saved with the map', async ({ page }) => {
    aheadOfSecretWordsScreens('map phone my-team (SWD-034, 117, v3.6)');
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
      aheadOfSecretWordsScreens('scan screen (SWD-033, 117)');
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
      aheadOfSecretWordsScreens('host board and map phone (SWD-022 browser check)');
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
    aheadOfSecretWordsScreens('Show the map code again (SWD-129)');
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
      aheadOfSecretWordsScreens('board screens (SWD-025 browser check)');
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
        // Turn 1: one of the team's own words, then a blank word (turn over).
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
      }
    });
  }
});

test.describe('SWD-117 / SWD-022: a typed code opens the same map, without team names', () => {
  test('the code entry with "27p-3qx8" opens the map phone: no map-teams, the code\'s words', async ({ page }) => {
    aheadOfSecretWordsScreens('Join → code entry → map phone (SWD-002, 117)');
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
