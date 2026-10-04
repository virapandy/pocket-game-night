// Impostor round screens (C1/C2), written 3 October 2026 from the approved scenarios v2.2, updated 4 October 2026 to v3.5:
// the clues screen (IMP-016, IMP-020, IMP-022), the menu at each moment (IMP-075), the screen staying awake (IMP-087),
// Settings (IMP-109, with IMP-014's switch and IMP-107's list) and the hold screen's layout at every size (IMP-081).
// Every text, name and test id is the one in specs/impostor/README.md (Terms, Canonical strings, Test hooks).
// Impostor round 4 is built (main df8f362, 4 October 2026): no test here is marked expected-to-fail.
import { expect, test, type Locator, type Page } from './fixtures';
import { backgroundAndReturn, expectOneMainButton, fromHome, isOutlined } from './helpers';
import {
  CLUES_DONE, LONGEST, P4, P5, PANI_PURI, KHEER, SAMOSA, TZ, T0, dealAll, doneButton, dontKnow, exact, expectNoSecrets, fromMenu, hold,
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
const anotherRound = (page: Page) => page.getByRole('button', { name: 'One more round of clues', exact: true });
const settingsClose = (page: Page) => page.getByRole('button', { name: /^(← Back|Back|Done|Close)$/ }).last();

test.describe('IMP-016, IMP-020, IMP-022: the clues screen', () => {
  const DEAL5 = { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] };

  test('top to bottom: everyone has seen, phone in the middle, MEENA, "starts", "Each say one word about your secret:", the clue order, then "Clues done, talk it over"; announced once', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: DEAL5 });
    await dealAll(page, P5);
    const parts = [
      page.getByText('✓ Everyone has seen their word.', { exact: true }),
      page.getByText('Phone in the middle, face up.', { exact: true }),
      starterName(page),
      page.getByText('starts', { exact: true }),
      page.getByText('Each say one word about your secret:', { exact: true }),
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
    await expect(clueOrder(page)).toHaveText(exact('Meena → Kabir → Zoya → Riya → Arjun'));
    await expectOneMainButton(page, 'clues screen', 'Clues done, talk it over', true);
    await expect(mainButton(page)).toHaveText(exact('Clues done, talk it over'));
    await expect(page.getByTestId('announcer')).toHaveText(exact('Meena starts. Each say one word about your secret: Meena, Kabir, Zoya, Riya, Arjun'));
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

  test('3 to 5 players: "One more round of clues" (quiet) adds "Second round: MEENA starts again" under the clue order, records anotherRoundOfClues, then goes', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: DEAL5 });
    await dealAll(page, P5);
    await expect(anotherRound(page)).toBeVisible();
    expect(await isOutlined(anotherRound(page)), '"One more round of clues" is quiet').toBe(true);
    const before = (await onlyEvening(page)).records.length;
    await anotherRound(page).click();
    const line = page.getByText(exact('Second round: Meena starts again'));
    await expect(line).toBeVisible();
    const lb = (await line.boundingBox())!, cb = (await clueOrder(page).boundingBox())!;
    expect(lb.y, 'the line is under clue-order').toBeGreaterThanOrEqual(cb.y + cb.height - 1);
    await expect(anotherRound(page)).toHaveCount(0);
    await expect(starterName(page)).toHaveText(exact('Meena'));
    await expect(clueOrder(page)).toHaveText(exact('Meena → Kabir → Zoya → Riya → Arjun'));
    await expect(mainButton(page)).toHaveText(exact('Clues done, talk it over'));
    const after = await onlyEvening(page);
    expect(after.records.length).toBe(before + 1);
    expect(after.records.at(-1).move).toEqual({ type: 'anotherRoundOfClues' });
  });

  test('3 players have "One more round of clues"; 6 players do not', async ({ page }) => {
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
  const DEAL_MENU = ['How to play', 'Players', 'Deal again with a new word', 'Settings', 'End the evening'];
  const ROUND_MENU = ['How to play', 'Players', 'See my word again', 'Deal again with a new word', 'Settings', 'End the evening'];
  const BETWEEN_MENU = ['How to play', 'Players', 'Change how we play', 'Settings', 'History', 'End the evening'];
  const HALFWAY_MENU = ['How to play', 'Players', 'Settings', 'History', 'End the evening'];

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
    await page.getByRole('dialog', { name: /New word for everyone\?/ }).getByRole('button', { name: 'New word', exact: true }).click();
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

  test('no menu button on "How to play" opened from the menu; "Done" returns to the same screen (v2.2\'s read-aloud card test retired)', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    await fromMenu(page, 'How to play');
    await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
    await expect(menuButton(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Practice round first', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(clueOrder(page)).toBeVisible();
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
    const order = await clueOrder(page).textContent();
    await page.goBack();
    await expect(clueOrder(page)).toHaveText(order!);
    expect((await onlyEvening(page)).records).toEqual(atClues);
  });

  // The open question is answered (decisions I21, IMP-075 v3.5): no "Change how we play" here; the menu as built is the
  // spec. Still marked only for the v3 rename "Rules" → "How to play" (lane C), and "Players" here shows the dialog.
  test('the "left halfway" screen: How to play · Players · Settings · History · End the evening; "Players" shows only "Change players after this round." and "OK"', async ({ page }) => {
    const START: Move = { type: 'startDeal', practice: false };
    const e = savedEvening({ deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }], moves: [START, { type: 'seen' }, { type: 'seen' }] });
    await phoneWith(page, [e], { now: e.records.at(-1).at + 3 * H + 1 });
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
    const heading = page.getByRole('heading', { name: 'This round was left halfway. Start a fresh round?' });
    await expect(row.or(heading).first()).toBeVisible();
    if (await row.first().isVisible()) await row.getByText('Tap to resume').first().click();
    await expect(heading).toBeVisible();
    expect(await menuItems(page, '"left halfway"')).toEqual(HALFWAY_MENU);
    await fromMenu(page, 'Players');
    const dialog = page.getByRole('dialog', { name: /Change players after this round\./ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(heading).toBeVisible();
  });

  test('a round result has the between-rounds menu; History there has "← Back" to the same screen', async ({ page }) => {
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

  test('IMP-006: "Change how we play" on a result opens the current choices; "← Back" records nothing; "Start round" records setChoices then nextRound', async ({ page }) => {
    await startEvening(page, { mode: 'hard', talking: 'timer', seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: 'IMPW-006', impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page);
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(6000);
    await reveal(page, 'Riya', 7500); // past the result's build-up (v3.5: 1.5 s; v2.2 build: 7 s)
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

  test('v3.5 timing: not released during the 1.5 s build-up; released at t = 1.5 s (IMP-033, IMP-034); with the last-chance guess, on the verdict; "Undo" requests it again', async ({ page }) => {
    await stubWakeLock(page, 'ok');
    await startEvening(page, { lastGuess: true, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page);
    await toPicker(page);
    await page.locator('body').evaluate(() => { (window as any).__wake = []; });
    await reveal(page, 'Riya', 0);
    await page.clock.runFor(1400);
    expect(await wakeCalls(page), 'during the build-up').not.toContain('release');
    await page.clock.runFor(100);
    await expect.poll(async () => (await wakeCalls(page)).includes('release'), 'released at 1.5 s').toBe(true);
    await mainButton(page).filter({ hasText: 'Next round' }).click();
    await dealAll(page);
    await toPicker(page);
    await reveal(page, 'Meena', 1500);
    await page.locator('body').evaluate(() => { (window as any).__wake = []; });
    await mainButton(page).filter({ hasText: /guessed\. Show the word$/ }).click();
    expect(await wakeCalls(page), 'not released before the verdict').not.toContain('release');
    await page.getByRole('button', { name: 'Wrong guess', exact: true }).click();
    await expect.poll(async () => (await wakeCalls(page)).includes('release'), 'released on the verdict').toBe(true);
    await page.locator('body').evaluate(() => { (window as any).__wake = []; });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(async () => (await wakeCalls(page)).filter((c) => c === 'request screen').length, 'requested again on "Undo"').toBeGreaterThanOrEqual(1);
  });

  test('released when the round\'s result block appears', async ({ page }) => {
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

  test('from Home: "Larger text" and "Tap to show instead of hold", both off; the note only while "Tap to show" is on (IMP-014, v3.5); both kept on this phone', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await fromHome(page, 'Settings');
    await expect(larger(page)).not.toBeChecked();
    await expect(tapToShow(page)).not.toBeChecked();
    await expect(page.getByText(NOTE, { exact: true }), 'no note while the switch is off').toBeHidden();
    await expect(skippedHeading(page)).toHaveCount(0);
    await larger(page).click();
    await expect(larger(page)).toBeChecked();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pgn.pref.largerText') ?? 'null'))).toBe(true);
    await tapToShow(page).click();
    await expect(page.getByText(NOTE, { exact: true })).toBeVisible();
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
    const order = await clueOrder(page).textContent();
    await larger(page).click();
    await settingsClose(page).click();
    await expect(clueOrder(page)).toHaveText(order!);
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
    await expect(page.getByRole('button', { name: 'Tap instead', exact: true })).toBeHidden();
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

// v2.2's hold-screen test ("the block clears the name") is retired: in v3.5 the block's layer covers the top bar,
// deal-progress, the name and "Don't know this word?" while held (IMP-010, guideline 45a).
test.describe('IMP-010, IMP-019, IMP-081: screen B at every size: the pad, the hold layer, nothing moves', () => {
  const NAME = 'Alexandrapetrova';
  const PAD: Record<string, [number, number]> = { '320x568': [288, 160], '360x640': [328, 160], '390x844': [358, 160], '812x375': [374, 160] };
  const SIZES = [[320, 568], [360, 640], [390, 844], [812, 375]] as const;
  for (const [width, height] of SIZES) {
    for (const largerText of [false, true]) {
      test(`${width} × ${height}${largerText ? ', Larger text' : ''}: the pad's size; the layer from the top to 8 px above the pad (left half in landscape); the block inside it; name, pad and "Tap instead" never move`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        const players = [NAME, 'Arjun', 'Meena', 'Kabir'];
        await startEvening(page, {
          players, storage: largerText ? { 'pgn.pref.largerText': true } : {},
          seeds: { deals: [{ wordId: LONGEST, impostor: 'Arjun', starter: NAME }] },
        });
        await imButton(page, NAME).click();
        const tapInstead = page.getByRole('button', { name: 'Tap instead', exact: true });
        const boxes = async () => Promise.all([passName(page), holdPad(page), tapInstead].map(async (l) => JSON.stringify(await l.boundingBox())));
        const before = await boxes();
        const pad = (await holdPad(page).boundingBox())!;
        const [pw, ph] = PAD[`${width}x${height}`]!;
        expect(Math.abs(pad.width - pw), `pad width ${pad.width}`).toBeLessThanOrEqual(1);
        expect(pad.height, 'pad at least 160 px tall').toBeGreaterThanOrEqual(ph - 0.5);
        await press(page);
        await expect(holdPad(page)).toHaveAccessibleName('Let go to hide');
        await expect(privateWord(page)).toHaveText(word(LONGEST).word);
        expect(await boxes(), 'nothing moves while held').toEqual(before);
        const bb = (await privateBlock(page).boundingBox())!;
        expect(bb.y, 'the block starts at the top').toBeGreaterThanOrEqual(-0.5);
        if (width > height) expect(bb.x + bb.width, 'the block is wholly left of the pad').toBeLessThanOrEqual(pad.x + 0.5);
        else expect(bb.y + bb.height, 'the block ends 8 px above the pad').toBeLessThanOrEqual(pad.y - 8 + 0.5);
        expect(await fitsInLines(privateWord(page), 2), 'the longest word fits in 2 lines (IMP-012)').toBe(true);
        // The opaque layer covers the name: the element at the name's centre is not the name.
        const nb = JSON.parse(before[0]!);
        const covered = await page.evaluate(([x, y]) => !document.elementFromPoint(x!, y!)?.closest('[data-testid="pass-name"]'), [nb.x + nb.width / 2, nb.y + nb.height / 2]);
        expect(covered, 'the layer covers the name while held').toBe(true);
        await page.clock.runFor(600);
        await release(page);
        await expect(dontKnow(page)).toBeVisible();
        await expect(holdPad(page)).toHaveAccessibleName('Hold here to see your word');
        expect(await boxes(), 'nothing moves after "Done…" appears').toEqual(before);
        expect(await noPageScroll(page), 'no page scrolling').toBe(true);
        await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
      });
    }
  }

  test('IMP-019: "Player 1 of 4" above "Pass the phone to" and the name on screen A, "Everyone else, look away!" under it; on screen B above the name; 17 px and 20 px', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    const progress = page.getByTestId('deal-progress'), look = page.getByTestId('look-away');
    await expect(progress).toHaveText(exact('Player 1 of 4', []));
    await expect(look).toHaveText(exact('Everyone else, look away!', []));
    expect(await fontSize(progress)).toBe(17);
    expect(await fontSize(look)).toBe(20);
    const p = (await progress.boundingBox())!, t = (await page.getByText('Pass the phone to', { exact: true }).boundingBox())!, n = (await passName(page).boundingBox())!, l = (await look.boundingBox())!;
    expect(p.y + p.height).toBeLessThanOrEqual(t.y + 1);
    expect(n.y + n.height).toBeLessThanOrEqual(l.y + 1);
    await imButton(page, 'Riya').click();
    await expect(progress).toHaveText(exact('Player 1 of 4', []));
    const p2 = (await progress.boundingBox())!, n2 = (await passName(page).boundingBox())!;
    expect(p2.y + p2.height, 'directly above the name').toBeLessThanOrEqual(n2.y + 1);
    await hold(page, 600);
    await doneButton(page).click();
    await expect(progress).toHaveText(exact('Player 2 of 4', []));
  });

  test('IMP-019: Larger text: deal-progress 21 px, look-away 24 px', async ({ page }) => {
    await startEvening(page, { storage: { 'pgn.pref.largerText': true }, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    expect(await fontSize(page.getByTestId('deal-progress'))).toBe(21);
    expect(await fontSize(page.getByTestId('look-away'))).toBe(24);
  });
});
