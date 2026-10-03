// Impostor round screens built so far (C1/C2), written 3 October 2026 from the approved scenarios v2.2:
// the clues screen (IMP-016, IMP-020, IMP-022), the menu at each moment (IMP-075), the screen staying awake (IMP-087),
// Settings (IMP-109, with IMP-014's switch and IMP-107's list) and the hold screen's layout at every size (IMP-081).
// Every text, name and test id is the one in specs/impostor/README.md (Terms, Canonical strings, Test hooks).
// Expected to fail (not built yet): tests marked `test.fail` need the round result (the next lane).
import { expect, test, type Locator, type Page } from './fixtures';
import { backgroundAndReturn, expectOneMainButton, fromHome, isOutlined } from './helpers';
import {
  LONGEST, P4, P5, PANI_PURI, KHEER, SAMOSA, TZ, T0, dealAll, doneButton, dontKnow, exact, expectNoSecrets, fromMenu, hold,
  holdPad, imButton, mainButton, menuButton, onlyEvening, passName, phoneWith, press, privateBlock, privateWord,
  release, reveal, savedEvening, secretTerms, startEvening, textOf, toPicker, turn, word, type Move,
} from './impostor';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const H = 3600_000;
const fontSize = (l: Locator) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
const noPageScroll = (page: Page) => page.evaluate(() => {
  const s = document.scrollingElement!;
  return s.scrollHeight <= window.innerHeight && s.scrollWidth <= window.innerWidth;
});
/** Terms: "Fits in N lines": height ≤ N × line-height, nothing cut off. */
const fitsInLines = (l: Locator, n: number) => l.evaluate((el, n) => {
  const s = getComputedStyle(el);
  const lh = s.lineHeight === 'normal' ? parseFloat(s.fontSize) * 1.25 : parseFloat(s.lineHeight);
  return el.getBoundingClientRect().height <= n * lh + 0.5 && el.scrollWidth <= el.clientWidth;
}, n);
const starterName = (page: Page) => page.getByTestId('starter-name');
const clueOrder = (page: Page) => page.getByTestId('clue-order');
const anotherRound = (page: Page) => page.getByRole('button', { name: 'Another round of clues', exact: true });
const settingsClose = (page: Page) => page.getByRole('button', { name: /^(← Back|Back|Done|Close)$/ }).last();

test.describe('IMP-016, IMP-020, IMP-022: the clues screen', () => {
  const DEAL5 = { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] };

  test('top to bottom: everyone has seen, phone in the middle, MEENA, "starts", the clue order, then "Talk it over"; announced once', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: DEAL5 });
    await dealAll(page, P5);
    const parts = [
      page.getByText('✓ Everyone has seen their word.', { exact: true }),
      page.getByText('Phone in the middle, face up.', { exact: true }),
      starterName(page),
      page.getByText('starts', { exact: true }),
      clueOrder(page),
      mainButton(page),
    ];
    let lastBottom = -Infinity;
    for (const [i, p] of parts.entries()) {
      const b = (await p.boundingBox())!;
      expect(b, `part ${i + 1}`).not.toBeNull();
      expect(b.y, `part ${i + 1} is below the one above`).toBeGreaterThanOrEqual(lastBottom - 1);
      lastBottom = b.y + b.height;
    }
    await expect(starterName(page)).toHaveText(exact('Meena'));
    await expect(clueOrder(page)).toHaveText(exact('then clockwise: Meena → Kabir → Zoya → Riya → Arjun'));
    await expectOneMainButton(page, 'clues screen', 'Talk it over', true);
    await expect(mainButton(page)).toHaveText(exact('Talk it over'));
    await expect(page.getByTestId('announcer')).toHaveText(exact('Meena starts, then clockwise: Meena, Kabir, Zoya, Riya, Arjun'));
  });

  test('starter-name is 56 px at 390 and 360 wide for names up to 8 characters; clue-order is body text (17 px, 21 px with Larger text)', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: DEAL5 });
    await dealAll(page, P5);
    expect(await fontSize(starterName(page)), 'starter-name at 390').toBe(56);
    expect(await fontSize(clueOrder(page)), 'clue-order at 390').toBe(17);
    await page.setViewportSize({ width: 360, height: 640 });
    expect(await fontSize(starterName(page)), 'starter-name at 360').toBe(56);
    await page.setViewportSize({ width: 320, height: 568 });
    const at320 = await fontSize(starterName(page));
    expect(at320, 'starter-name at 320').toBeGreaterThanOrEqual(32);
    expect(at320, 'starter-name at 320').toBeLessThanOrEqual(56);
    await page.setViewportSize({ width: 812, height: 375 });
    const land = await fontSize(starterName(page));
    expect(land, 'starter-name at 812 × 375').toBeGreaterThanOrEqual(32);
    expect(land, 'starter-name at 812 × 375').toBeLessThanOrEqual(56);
    expect(await fitsInLines(starterName(page), land > 32 ? 1 : 2), 'starter-name never cut off').toBe(true);
  });

  test('Larger text: clue-order is 21 px', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: DEAL5, storage: { 'pgn.pref.largerText': true } });
    await dealAll(page, P5);
    expect(await fontSize(clueOrder(page))).toBe(21);
  });

  test('a 16-character starter at 320 × 568: 32 to 56 px, on 1 line (2 at 32 px), never cut off', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const players = ['Alexandrapetrova', 'Arjun', 'Meena'];
    await startEvening(page, { players, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Alexandrapetrova' }] } });
    await dealAll(page, players);
    const size = await fontSize(starterName(page));
    expect(size).toBeGreaterThanOrEqual(32);
    expect(size).toBeLessThanOrEqual(56);
    expect(await fitsInLines(starterName(page), size > 32 ? 1 : 2), 'starter-name never cut off').toBe(true);
    expect(await noPageScroll(page), 'no page scrolling').toBe(true);
  });

  test('20 names of 16 characters at 320 × 568 with Larger text: clue-order scrolls inside its own box; the main button stays wholly on screen', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 320, height: 568 });
    const players = Array.from({ length: 20 }, (_, i) => `${String.fromCharCode(65 + i)}layernamesixteen`.slice(0, 16));
    await startEvening(page, { players, seeds: { deals: [{ wordId: SAMOSA, impostor: players[1]!, starter: players[0]! }] }, storage: { 'pgn.pref.largerText': true } });
    await dealAll(page, players);
    expect(await noPageScroll(page), 'no page scrolling').toBe(true);
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
    const co = (await clueOrder(page).boundingBox())!, mb = (await mainButton(page).boundingBox())!;
    expect(co.y + co.height, 'clue-order ends above the main button').toBeLessThanOrEqual(mb.y + 0.5);
    const box = await clueOrder(page).evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight, oy: getComputedStyle(el).overflowY }));
    if (box.sh > box.ch) expect(box.oy, 'a clue order taller than its box scrolls inside it').toMatch(/auto|scroll/);
    const sn = await fontSize(starterName(page));
    expect(await fitsInLines(starterName(page), sn > 32 ? 1 : 2), 'starter-name never cut off').toBe(true);
  });

  test('3 to 5 players: "Another round of clues" (quiet) adds "Second round: MEENA starts again" under the clue order, records anotherRoundOfClues, then goes', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: DEAL5 });
    await dealAll(page, P5);
    await expect(anotherRound(page)).toBeVisible();
    expect(await isOutlined(anotherRound(page)), '"Another round of clues" is quiet').toBe(true);
    const before = (await onlyEvening(page)).records.length;
    await anotherRound(page).click();
    const line = page.getByText(exact('Second round: Meena starts again'));
    await expect(line).toBeVisible();
    const lb = (await line.boundingBox())!, cb = (await clueOrder(page).boundingBox())!;
    expect(lb.y, 'the line is under clue-order').toBeGreaterThanOrEqual(cb.y + cb.height - 1);
    await expect(anotherRound(page)).toHaveCount(0);
    await expect(starterName(page)).toHaveText(exact('Meena'));
    await expect(clueOrder(page)).toHaveText(exact('then clockwise: Meena → Kabir → Zoya → Riya → Arjun'));
    await expect(mainButton(page)).toHaveText(exact('Talk it over'));
    const after = await onlyEvening(page);
    expect(after.records.length).toBe(before + 1);
    expect(after.records.at(-1).move).toEqual({ type: 'anotherRoundOfClues' });
  });

  test('3 players have "Another round of clues"; 6 players do not', async ({ page }) => {
    const three = ['Riya', 'Arjun', 'Meena'];
    await startEvening(page, { players: three, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page, three);
    await expect(anotherRound(page)).toBeVisible();
    const six = [...P5, 'Dev'];
    await startEvening(page, { players: six, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page, six);
    await expect(anotherRound(page)).toHaveCount(0);
  });
});

test.describe('IMP-075: the menu at each moment', () => {
  const DEAL_MENU = ['Rules', 'Players', 'Deal again with a new word', 'Settings', 'End the evening'];
  const ROUND_MENU = ['Rules', 'Players', 'See my word again', 'Deal again with a new word', 'Settings', 'End the evening'];
  const BETWEEN_MENU = ['Rules', 'Players', 'Change how we play', 'Settings', 'History', 'End the evening'];

  async function menuItems(page: Page, where: string): Promise<string[]> {
    await expect(menuButton(page), `${where}: the menu button`).toBeVisible();
    await expect(menuButton(page)).toHaveText(/··· ?Menu/);
    await menuButton(page).click();
    const items = page.getByRole('menuitem');
    await expect(items.first()).toBeVisible();
    const out = await textOf(items);
    await page.keyboard.press('Escape');
    if (await items.first().isVisible()) await menuButton(page).click();
    await expect(items).toHaveCount(0);
    return out;
  }

  test('the deal: screen A, screen B, "No problem!" and "Welcome back." have the deal menu', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }, { wordId: PANI_PURI, impostor: 'Kabir' }] } });
    expect(await menuItems(page, 'screen A')).toEqual(DEAL_MENU);
    await imButton(page, 'Riya').click();
    expect(await menuItems(page, 'screen B')).toEqual(DEAL_MENU);
    await hold(page, 600);
    await dontKnow(page).click();
    await expect(page.getByRole('heading', { name: 'No problem! New word coming.' })).toBeVisible();
    expect(await menuItems(page, '"No problem!"')).toEqual(DEAL_MENU);
    await imButton(page, 'Riya').click();
    await hold(page, 600);
    await doneButton(page).click();
    await backgroundAndReturn(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    expect(await menuItems(page, '"Welcome back."')).toEqual(DEAL_MENU);
  });

  test('the clues screen has the round menu; "Change how we play" and History are not in it', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    expect(await menuItems(page, 'clues')).toEqual(ROUND_MENU);
  });

  test('no menu button on the read-aloud card', async ({ page }) => {
    await startEvening(page, { deal: false });
    await expect(menuButton(page)).toHaveCount(0);
  });

  test('no "← Back" during a round; the browser\'s Back keeps the same screen and records nothing', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await expect(page.getByRole('button', { name: /^(← )?Back$/ })).toHaveCount(0);
    await turn(page, 'Riya');
    const before = (await onlyEvening(page)).records;
    await page.goBack();
    await expect(passName(page)).toHaveText(exact('Arjun'));
    await dealAll(page, P4.slice(1));
    await expect(page.getByRole('button', { name: /^(← )?Back$/ })).toHaveCount(0);
    const atClues = (await onlyEvening(page)).records;
    expect(atClues.length).toBe(before.length + 3);
    await page.goBack();
    await expect(clueOrder(page)).toHaveText(exact('then clockwise: Riya → Arjun → Meena → Kabir'));
    expect((await onlyEvening(page)).records).toEqual(atClues);
  });

  // Marked: the Build role asked (docs/test-questions.md, 3 October 2026) whether "Change how we play" belongs here while
  // a round is still in progress; the orchestrator asked to hold it as a question for the product owner, not a bug.
  test.fail('the "left halfway" screen has the between-rounds menu (open question: "Change how we play" mid-round)', async ({ page }) => {
    const START: Move = { type: 'startDeal', practice: false };
    const e = savedEvening({ deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }], moves: [START, { type: 'seen' }, { type: 'seen' }] });
    await phoneWith(page, [e], { now: e.records.at(-1).at + 3 * H + 1 });
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
    const heading = page.getByRole('heading', { name: 'This round was left halfway. Start a fresh round?' });
    await expect(row.or(heading).first()).toBeVisible();
    if (await row.first().isVisible()) await row.getByText('Tap to resume').first().click();
    await expect(heading).toBeVisible();
    expect(await menuItems(page, '"left halfway"')).toEqual(BETWEEN_MENU);
  });

  test.fail('a round result has the between-rounds menu; History there has "← Back" to the same screen', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    await toPicker(page);
    await reveal(page, 'Riya');
    await expect(page.getByTestId('round-outcome')).toBeVisible();
    expect(await menuItems(page, 'result')).toEqual(BETWEEN_MENU);
    await fromMenu(page, 'History');
    await page.getByRole('button', { name: /^(← )?Back$/ }).click();
    await expect(page.getByTestId('round-outcome')).toBeVisible();
  });

  test.fail('IMP-006: "Change how we play" on a result opens the current choices; "← Back" records nothing; "Start round" records setChoices then nextRound', async ({ page }) => {
    await startEvening(page, { mode: 'hard', talking: 'timer', seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: 'IMPW-006', impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page);
    await mainButton(page).filter({ hasText: 'Start the 2-minute timer' }).click();
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(6000);
    await reveal(page, 'Riya');
    await expect(page.getByTestId('round-outcome')).toBeVisible();
    const atResult = (await onlyEvening(page)).records;
    await fromMenu(page, 'Change how we play');
    await expect(page.getByRole('heading', { name: 'How do you want to play?' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Mode', exact: true }).getByRole('button', { name: /Hard/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /^(← )?Back$/ }).click();
    await expect(page.getByTestId('round-outcome')).toBeVisible();
    expect((await onlyEvening(page)).records).toEqual(atResult);
    await fromMenu(page, 'Change how we play');
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
    const moves = (await onlyEvening(page)).records.slice(atResult.length).map((r: any) => r.move.type);
    expect(moves).toEqual(['setChoices', 'nextRound']);
  });
});

test.describe('IMP-087: the screen stays awake during a round', () => {
  async function stubWakeLock(page: Page, kind: 'ok' | 'missing' | 'refused') {
    await page.addInitScript((kind) => {
      const w = window as any;
      w.__wake = [];
      if (kind === 'missing') { try { delete (Navigator.prototype as any).wakeLock; } catch { /* */ } Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: undefined }); return; }
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: {
          request: (type: string) => {
            w.__wake.push(`request ${type}`);
            if (kind === 'refused') return Promise.reject(new Error('NotAllowedError'));
            const lock = { released: false, type, onrelease: null, addEventListener() {}, removeEventListener() {},
              release() { w.__wake.push('release'); lock.released = true; return Promise.resolve(); } };
            return Promise.resolve(lock);
          },
        },
      });
    }, kind);
  }
  const wakeCalls = (page: Page): Promise<string[]> => page.evaluate(() => (window as any).__wake);

  test('requested when the round\'s first screen A shows, and again on every return to visible during the round', async ({ page }) => {
    await stubWakeLock(page, 'ok');
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await expect.poll(async () => (await wakeCalls(page)).filter((c) => c === 'request screen').length, 'a request at screen A').toBeGreaterThanOrEqual(1);
    const n = (await wakeCalls(page)).filter((c) => c === 'request screen').length;
    await backgroundAndReturn(page);
    await expect.poll(async () => (await wakeCalls(page)).filter((c) => c === 'request screen').length, 'again on return during the deal').toBeGreaterThanOrEqual(n + 1);
    await imButton(page, 'Riya').click();
    await hold(page, 600);
    await doneButton(page).click();
    const m = (await wakeCalls(page)).filter((c) => c === 'request screen').length;
    await backgroundAndReturn(page);
    await expect.poll(async () => (await wakeCalls(page)).filter((c) => c === 'request screen').length, 'again on a second return').toBeGreaterThanOrEqual(m + 1);
  });

  for (const kind of ['missing', 'refused'] as const) {
    test(`wake lock ${kind}: the round goes on with no message`, async ({ page }) => {
      await stubWakeLock(page, kind);
      await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByTestId('toast')).toHaveCount(0);
      await dealAll(page);
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.getByRole('dialog')).toHaveCount(0);
    });
  }

  test.fail('released when the round\'s result block appears', async ({ page }) => {
    await stubWakeLock(page, 'ok');
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    await toPicker(page);
    await reveal(page, 'Riya');
    await expect(page.getByTestId('round-outcome')).toBeVisible();
    await expect.poll(async () => (await wakeCalls(page)).includes('release')).toBe(true);
  });
});

test.describe('IMP-109: Settings for Impostor', () => {
  const NOTE = 'Your screen reader will say the word out loud. Use earphones or turn the volume down.';
  const larger = (page: Page) => page.getByRole('switch', { name: 'Larger text', exact: true });
  const tapToShow = (page: Page) => page.getByRole('switch', { name: 'Tap to show instead of hold', exact: true });
  const skippedHeading = (page: Page) => page.getByRole('heading', { name: /^Skipped words/ });

  test('from Home: "Larger text" and "Tap to show instead of hold", both off, with the note; "Larger text" is kept on this phone', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await fromHome(page, 'Settings');
    await expect(larger(page)).not.toBeChecked();
    await expect(tapToShow(page)).not.toBeChecked();
    await expect(page.getByText(NOTE, { exact: true })).toBeVisible();
    await expect(skippedHeading(page)).toHaveCount(0);
    await larger(page).click();
    await expect(larger(page)).toBeChecked();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pgn.pref.largerText') ?? 'null'))).toBe(true);
    await tapToShow(page).click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pgn.pref.impostor.tapToShow') ?? 'null'))).toBe(true);
    await page.reload();
    await fromHome(page, 'Settings');
    await expect(larger(page)).toBeChecked();
    await expect(tapToShow(page)).toBeChecked();
  });

  test('IMP-107: "Skipped words (3)", newest first, each with "Bring back <word>"; a tap removes the row at once, no toast, no dialog', async ({ page }) => {
    // pgn.pref.impostor.blockedWords: oldest first (the Build role's reading, docs/test-questions.md, 3 October 2026).
    await phoneWith(page, [], { now: T0, storage: { 'pgn.pref.impostor.blockedWords': [SAMOSA, PANI_PURI, KHEER] } });
    await fromHome(page, 'Settings');
    await expect(skippedHeading(page)).toHaveText(exact('Skipped words (3)', []));
    const newestFirst = [word(KHEER).word, word(PANI_PURI).word, word(SAMOSA).word];
    let lastY = -Infinity;
    for (const w of newestFirst) {
      const b = page.getByRole('button', { name: `Bring back ${w}`, exact: true });
      await expect(b).toBeVisible();
      const y = (await b.boundingBox())!.y;
      expect(y, `${w} comes after the word above it`).toBeGreaterThan(lastY);
      lastY = y;
      await expect(page.getByText(w, { exact: true })).toBeVisible();
    }
    await page.getByRole('button', { name: `Bring back ${word(PANI_PURI).word}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `Bring back ${word(PANI_PURI).word}`, exact: true })).toHaveCount(0);
    await expect(skippedHeading(page)).toHaveText(exact('Skipped words (2)', []));
    await expect(page.getByTestId('toast')).toHaveCount(0);
    await expect(page.getByTestId('undo-toast')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pgn.pref.impostor.blockedWords') ?? 'null'))).toEqual([SAMOSA, KHEER]);
    await page.getByRole('button', { name: `Bring back ${word(SAMOSA).word}`, exact: true }).click();
    await page.getByRole('button', { name: `Bring back ${word(KHEER).word}`, exact: true }).click();
    await expect(skippedHeading(page)).toHaveCount(0);
  });

  test('mid-round from the menu: no secrets in Settings; "Larger text" applies when Settings closes; the same screen returns, nothing recorded', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] } });
    await dealAll(page, P5);
    const records = (await onlyEvening(page)).records;
    expect(await fontSize(clueOrder(page))).toBe(17);
    await fromMenu(page, 'Settings');
    await expect(larger(page)).toBeVisible();
    await expect(tapToShow(page)).toBeVisible();
    await expectNoSecrets(page, secretTerms(SAMOSA, 'hard'), 'Settings mid-round');
    await larger(page).click();
    await settingsClose(page).click();
    await expect(clueOrder(page)).toHaveText(exact('then clockwise: Meena → Kabir → Zoya → Riya → Arjun'));
    await expect(starterName(page)).toHaveText(exact('Meena'));
    expect(await fontSize(clueOrder(page)), 'body text with Larger text').toBe(21);
    expect((await onlyEvening(page)).records).toEqual(records);
  });

  test('mid-deal: "Tap to show instead of hold" takes effect on the next screen B', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await turn(page, 'Riya');
    await expect(passName(page)).toHaveText(exact('Arjun'));
    await fromMenu(page, 'Settings');
    await tapToShow(page).click();
    await settingsClose(page).click();
    await expect(passName(page)).toHaveText(exact('Arjun'));
    await imButton(page, 'Arjun').click();
    await expect(holdPad(page)).toHaveAccessibleName('Tap to see your word');
    await expect(page.getByRole('button', { name: 'Tap instead', exact: true })).toHaveCount(0);
  });

  test('with Larger text: the private block\'s small lines are 19 px and its body lines 21 px; the word 30 to 36 px', async ({ page }) => {
    await startEvening(page, { storage: { 'pgn.pref.largerText': true }, seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun', starter: 'Riya' }] } });
    await imButton(page, 'Riya').click();
    await press(page);
    await expect(privateBlock(page)).toBeVisible();
    const sizes = await privateBlock(page).evaluate((el) => Array.from(el.children).map((c) => parseFloat(getComputedStyle(c).fontSize)));
    expect(sizes[0], 'line 1').toBe(19);
    expect(sizes[2], 'line 3').toBe(21);
    expect(sizes[3], 'line 4').toBe(21);
    expect(sizes[4], 'line 5').toBe(19);
    const w = await fontSize(privateWord(page));
    expect(w).toBeGreaterThanOrEqual(30);
    expect(w).toBeLessThanOrEqual(36);
    await release(page);
  });
});

test.describe('IMP-081 and IMP-010: the hold screen with the longest word and a 16-character name, at every size', () => {
  const NAME = 'Alexandrapetrova';
  const SIZES = [[320, 568], [360, 640], [390, 844], [812, 375]] as const;
  for (const [width, height] of SIZES) {
    for (const largerText of [false, true]) {
      test(`${width} × ${height}${largerText ? ', Larger text' : ''}: after "Don't know this word?" appears, the block clears the name and the pad; nothing scrolls`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        const players = [NAME, 'Arjun', 'Meena', 'Kabir'];
        await startEvening(page, {
          players, storage: largerText ? { 'pgn.pref.largerText': true } : {},
          seeds: { deals: [{ wordId: LONGEST, impostor: 'Arjun', starter: NAME }] },
        });
        await imButton(page, NAME).click();
        await hold(page, 600);
        await expect(dontKnow(page)).toBeVisible();
        await press(page);
        await expect(privateWord(page)).toHaveText(word(LONGEST).word);
        const name = page.getByRole('heading', { name: new RegExp(`^${NAME}$`, 'i') });
        const nb = (await name.boundingBox())!, bb = (await privateBlock(page).boundingBox())!, pb = (await holdPad(page).boundingBox())!;
        const overlaps = (a: typeof nb, b: typeof nb) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
        expect(overlaps(nb, bb), `the block (y ${bb.y.toFixed(0)}–${(bb.y + bb.height).toFixed(0)}) overlaps the name (y ${nb.y.toFixed(0)}–${(nb.y + nb.height).toFixed(0)})`).toBe(false);
        if (width > height) expect(bb.x + bb.width, 'the block is wholly left of the pad').toBeLessThanOrEqual(pb.x + 0.5);
        else expect(bb.y + bb.height, 'the block is wholly above the pad').toBeLessThanOrEqual(pb.y + 0.5);
        expect(await fitsInLines(privateWord(page), 3), 'the longest word fits in 3 lines').toBe(true);
        expect(await noPageScroll(page), 'no page scrolling').toBe(true);
        for (const l of [mainButton(page), dontKnow(page)]) {
          const b = (await l.boundingBox())!;
          expect(overlaps(b, bb), 'the block covers no button').toBe(false);
        }
        await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
        await expect(dontKnow(page)).toBeInViewport({ ratio: 1 });
        await release(page);
      });
    }
  }
});
