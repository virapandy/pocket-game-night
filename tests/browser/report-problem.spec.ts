// Phase 7: "Report a problem" on the host phone and on a player's phone (specs/platform/03-feedback.md, owner
// sign-off 29 September 2026). Scenarios: PLT-200, PLT-201, PLT-202, PLT-203, PLT-206, PLT-207, PLT-208, PLT-209.
// What a report holds is checked in detail in tests/contract/reports.test.ts; here, the screens, the preview, the
// stub destination (nothing leaves the phone), waiting for a connection and for the game to end, and the list of
// reports waiting to send. Names, test ids and the sending hook: tests/browser/README.md, "Phase 7: Report a problem".
import { expect, test, type BrowserContext, type Page } from './fixtures';
import {
  call, calledCount, callMany, confirmPrizes, currentNumber, endGame, HOME, menuButton, nextNumber, recordWin, setUpPaperGame,
} from './helpers';
import { closePhones, gridOf, newPhone, numbersOf, phoneGame, phoneTicket, PORTRAIT, scanAll, tapCell } from './phone';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.afterEach(closePhones);

const NAMES = ['Riyaben', 'Ashalata', 'Daddyji', 'Kabirbhai'];
const SESSION = 'Diwali Gathering';
const APP_ORIGIN = 'http://localhost:4173';

// ---------- The report form ----------

const reportItem = (page: Page) =>
  page.getByRole('menuitem', { name: 'Report a problem', exact: true }).or(page.getByRole('button', { name: 'Report a problem', exact: true })).first();
const whatField = (page: Page) => page.getByLabel('What happened?', { exact: true });
const preview = (page: Page) => page.getByTestId('report-preview');
const sendButton = (page: Page) => page.getByRole('button', { name: 'Send report', exact: true });
const keptOnPhone = (page: Page) => page.getByText(/kept on this phone/i).first();
const WAITS_FOR_END = /Your report will be sent when this game ends/;

/** "Report a problem": straight from the screen, or from its Menu (PLT-200). */
async function openReport(page: Page) {
  if (!(await reportItem(page).isVisible())) await menuButton(page).first().click();
  await reportItem(page).click();
  await expect(whatField(page)).toBeVisible();
}

/** The exact text the preview says will be sent (its `data-payload`), once it shows `what` (after names are replaced). */
async function previewText(page: Page, what?: string | RegExp): Promise<string> {
  await expect(preview(page)).toBeVisible();
  let text = '';
  await expect.poll(async () => {
    text = (await preview(page).getAttribute('data-payload')) ?? '';
    if (what === undefined) return text.length > 0;
    try {
      const w = JSON.parse(text).what as string;
      return typeof what === 'string' ? w === what : what.test(w);
    } catch {
      return false;
    }
  }, { message: 'report-preview data-payload holds the report with the words typed' }).toBe(true);
  return text;
}

/** Fills "What happened?", checks the preview, and returns the report it shows. */
async function writeReport(page: Page, typed: string, shown: string | RegExp = typed) {
  await whatField(page).fill(typed);
  const text = await previewText(page, shown);
  return { text, report: JSON.parse(text) };
}

// ---------- What leaves the phone (PLT-208) ----------

/** Every request the phone makes, and every sendBeacon call. */
async function watchNetwork(context: BrowserContext) {
  const requests: { url: string; method: string }[] = [];
  context.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  await context.addInitScript(() => {
    const w = window as any;
    w.__pgnBeacons = 0;
    if (navigator.sendBeacon) {
      const real = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = (...args: Parameters<Navigator['sendBeacon']>) => { w.__pgnBeacons++; return real(...args); };
    }
  });
  return requests;
}
async function expectNothingLeft(page: Page, requests: { url: string; method: string }[]) {
  const away = requests.filter((r) => !r.url.startsWith(APP_ORIGIN) && !r.url.startsWith('data:') && !r.url.startsWith('blob:'));
  expect(away, 'requests to any other server').toEqual([]);
  expect(requests.filter((r) => r.method !== 'GET'), 'anything sent to the app\'s own server').toEqual([]);
  expect(await page.evaluate(() => (window as any).__pgnBeacons ?? 0), 'sendBeacon calls').toBe(0);
}

// ---------- The sending hook ----------

/**
 * Stands in for the report destination, before the page loads. When `window.__pgnSendReport` exists, the app sends a
 * report by calling it with the report's text (exactly what the preview showed) instead of the stub. The promise
 * resolving means the report arrived; rejecting means it did not (the report stays waiting and is tried again).
 * mode 'ok' resolves at once; 'hang' waits until the test calls settleSend(); 'fail-once' rejects the first call.
 */
async function fakeSender(page: Page, mode: 'ok' | 'hang' | 'fail-once' = 'ok') {
  await page.addInitScript((mode) => {
    const w = window as any;
    const log = (): any[] => JSON.parse(localStorage.getItem('__pgnSentLog') ?? '[]');
    w.__pgnSendReport = (text: string) => {
      const entries = log();
      entries.push({ text, online: navigator.onLine });
      localStorage.setItem('__pgnSentLog', JSON.stringify(entries));
      if (mode === 'hang') return new Promise((resolve, reject) => { w.__pgnPending = { resolve, reject }; });
      if (mode === 'fail-once' && entries.length === 1) return Promise.reject(new Error('connection dropped'));
      return Promise.resolve();
    };
  }, mode);
}
/** Every call of the sending hook so far (kept across reloads), each with the report's text. */
const sent = (page: Page): Promise<{ text: string; online: boolean }[]> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('__pgnSentLog') ?? '[]'));
const sentCount = async (page: Page) => (await sent(page)).length;
const settleSend = (page: Page) => page.evaluate(() => (window as any).__pgnPending?.resolve());

// ---------- Reports waiting to send (PLT-209) ----------

/** Settings → "Reports waiting to send", reached by taps only (no page load, so it also works offline). */
async function openWaiting(page: Page) {
  const homeSettings = page.getByRole('button', { name: 'Settings', exact: true });
  if (!(await homeSettings.isVisible())) await page.getByRole('button', { name: /^Tambola/ }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: /^Reports waiting to send/ }).or(page.getByRole('link', { name: /^Reports waiting to send/ })).first().click();
}
const waitingReports = (page: Page) => page.getByTestId('waiting-report');

/** Today's date as the list may show it: "29 Sep" or "Sep 29" (the phone's own time zone). */
async function todayPattern(page: Page): Promise<RegExp> {
  const { d, m } = await page.evaluate(() => {
    const now = new Date();
    return { d: now.getDate(), m: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]! };
  });
  return new RegExp(`\\b${d}\\s+${m}|${m}\\w*\\.?\\s+${d}\\b`);
}

// ---------- Checks on a report's text ----------

const MONEY_KEYS = ['contribution', 'amount', 'pot', 'paid', 'won', 'net', 'prize', 'handedBack', 'hostGives', 'gotBack', 'gives'];
function moneyIn(value: unknown, path = '', out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v, i) => moneyIn(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (MONEY_KEYS.includes(k) && v !== null && v !== 0) out.push(`${path}.${k} = ${JSON.stringify(v)}`);
      moneyIn(v, `${path}.${k}`, out);
    }
  }
  return out;
}
function hides(text: string, secret: string): boolean {
  const b64 = Buffer.from(secret).toString('base64').replace(/=+$/, '');
  const b64url = b64.replace(/\+/g, '-').replace(/\//g, '_');
  return [secret, encodeURIComponent(secret), b64, b64url].some((s) => text.includes(s));
}
const seedValues = (report: any): string[] =>
  Object.values(report.game?.setup?.seeds ?? {}).filter((s): s is string => typeof s === 'string' && s.length > 0);
const callMoves = (report: any): number => (report.game?.records ?? []).filter((r: any) => r.move?.type === 'call').length;
function intsInArrays(value: unknown, out = new Set<number>()): Set<number> {
  if (Array.isArray(value)) {
    for (const v of value) {
      if (Number.isInteger(v)) out.add(v as number);
      else if (v && typeof v === 'object') intsInArrays(v, out);
    }
  } else if (value && typeof value === 'object') for (const v of Object.values(value)) intsInArrays(v, out);
  return out;
}

/** A paper game with odd money (₹37 a ticket), called a few times, Early Five won by Riyaben and closed. */
async function paperGameWithAWin(page: Page) {
  await setUpPaperGame(page, { players: NAMES, contribution: 37, session: { name: SESSION } });
  await callMany(page, 5);
  await recordWin(page, 'Early Five', ['Riyaben']);
  await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
  await expect(nextNumber(page)).toBeVisible();
}

// =====================================================================================================

test.describe('PLT-200, PLT-201, PLT-208: the host reports a problem after a game', () => {
  test('from the payout screen: the host sees exactly what will be sent; no names, session name or money; kept on this phone, nothing leaves', async ({ page, context }, testInfo) => {
    test.setTimeout(60_000);
    const requests = await watchNetwork(context);
    await paperGameWithAWin(page);
    const calls = await calledCount(page);
    await endGame(page);
    await expect(page.getByTestId('payout-summary')).toBeVisible();

    await openReport(page);
    // PLT-208: no account, no sign-in.
    await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
    const { text, report } = await writeReport(page, "Riyaben's prize looked wrong", "Player 1's prize looked wrong");

    // PLT-200: the app version, the phone type, and the game's seeds and moves.
    expect(report.v).toBe(1);
    expect(report.from).toBe('host');
    expect(typeof report.appVersion).toBe('string');
    expect(report.appVersion.length).toBeGreaterThan(0);
    expect(report.phone).toMatch(testInfo.project.name === 'iphone' ? /iPhone/ : /Android/);
    expect(report.waitingForGameEnd).toBe(false);
    expect(report.game.gameType).toBe('tambola');
    expect(seedValues(report).length).toBeGreaterThan(0);
    expect(callMoves(report)).toBe(calls);

    // PLT-201: players are "Player 1" …; no name, no session name, no money.
    for (const name of [...NAMES, SESSION, 'Diwali']) expect(text, `the report holds "${name}"`).not.toContain(name);
    expect(text).not.toContain('₹');
    expect(moneyIn(report)).toEqual([]);
    expect(report.game.setup.config.players.map((p: any) => p.name)).toEqual(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    // The host sees it: the words, the version and the phone are on screen in the preview.
    await expect(preview(page)).toContainText("Player 1's prize looked wrong");
    await expect(preview(page)).toContainText(report.appVersion);

    // PLT-208: the stub keeps the report on this phone; nothing leaves it.
    await sendButton(page).click();
    await expect(keptOnPhone(page)).toBeVisible();
    await page.waitForTimeout(1000);
    await expectNothingLeft(page, requests);
  });

  test('what is sent is exactly what the preview showed (with the sending hook)', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeSender(page, 'ok');
    await paperGameWithAWin(page);
    await endGame(page);
    await openReport(page);
    const { text } = await writeReport(page, 'Exactly this');
    await sendButton(page).click();
    await expect.poll(() => sentCount(page), { message: 'the report is sent once the host taps Send report' }).toBe(1);
    expect((await sent(page))[0]!.text).toBe(text);
  });
});

test.describe('PLT-200: "Report a problem" on every screen, in the menu, never in the thumb zone', () => {
  test('home: the form asks "What happened?"; the sentence is optional; Cancel sends nothing', async ({ page }) => {
    await fakeSender(page, 'ok');
    await page.goto(HOME);
    await openReport(page);
    await expect(whatField(page)).toHaveValue('');
    const report = JSON.parse(await previewText(page));
    expect(report.what).toBe('');
    expect(report.game ?? null).toBeNull();
    await expect(sendButton(page)).toBeEnabled();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(whatField(page)).toBeHidden();
    await page.waitForTimeout(500);
    expect(await sentCount(page)).toBe(0);
  });

  test('home: sent with no words at all, it still goes', async ({ page }) => {
    await fakeSender(page, 'ok');
    await page.goto(HOME);
    await openReport(page);
    await sendButton(page).click();
    await expect.poll(() => sentCount(page)).toBe(1);
    expect(JSON.parse((await sent(page))[0]!.text).what).toBe('');
  });

  test('calling screen: only in the Menu, in the top two-thirds of the screen; the report holds the game', async ({ page }) => {
    await setUpPaperGame(page, { players: NAMES });
    await call(page);
    await expect(reportItem(page)).toBeHidden();
    await menuButton(page).first().click();
    await expect(reportItem(page)).toBeVisible();
    const box = (await reportItem(page).boundingBox())!;
    const height = page.viewportSize()!.height;
    expect(box.y + box.height / 2, 'the item\'s centre is above the bottom third (the thumb zone)').toBeLessThan((height * 2) / 3);
    await reportItem(page).click();
    const report = JSON.parse(await previewText(page));
    expect(report.game.gameType).toBe('tambola');
    expect(callMoves(report)).toBe(1);
  });
});

test.describe('PLT-206: a report about a game still being played waits until the game ends', () => {
  test('mid-game: no seeds, "Your report will be sent when this game ends"; sent only after End game, with the seeds and the moves as they were', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeSender(page, 'ok');
    await setUpPaperGame(page, { players: NAMES, contribution: 37 });
    await callMany(page, 5);
    await openReport(page);
    const { text: midText, report: mid } = await writeReport(page, 'Numbers repeated');
    expect(mid.waitingForGameEnd).toBe(true);
    expect(seedValues(mid)).toEqual([]);
    expect(callMoves(mid)).toBe(5);
    await expect(page.getByText(WAITS_FOR_END).first()).toBeVisible();
    await sendButton(page).click();

    // The game carries on, and nothing is sent while it does, even online.
    await expect(nextNumber(page)).toBeVisible();
    await callMany(page, 2);
    await page.waitForTimeout(1500);
    expect(await sentCount(page), 'sent while the game is still being played').toBe(0);

    await endGame(page);
    await expect.poll(() => sentCount(page), { message: 'sent once the game ends', timeout: 10_000 }).toBe(1);
    const full = JSON.parse((await sent(page))[0]!.text);
    expect(full.id).toBe(mid.id);
    expect(full.what).toBe('Numbers repeated');
    expect(full.waitingForGameEnd).toBe(false);
    const seeds = seedValues(full);
    expect(seeds.length).toBeGreaterThan(0);
    for (const seed of seeds) expect(hides(midText, seed), 'the mid-game report held a seed').toBe(false);
    expect(callMoves(full)).toBe(5);
  });

  test('discarding the game also releases the report', async ({ page }) => {
    await fakeSender(page, 'ok');
    await setUpPaperGame(page, { players: NAMES, contribution: 'none' });
    await callMany(page, 3);
    await openReport(page);
    await writeReport(page, 'Discard me');
    await sendButton(page).click();
    await page.waitForTimeout(1000);
    expect(await sentCount(page)).toBe(0);
    await menuButton(page).first().click();
    await page.getByRole('menuitem', { name: 'Discard game', exact: true }).or(page.getByRole('button', { name: 'Discard game', exact: true })).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /^Discard/ }).click();
    await expect.poll(() => sentCount(page), { timeout: 10_000 }).toBe(1);
    expect(seedValues(JSON.parse((await sent(page))[0]!.text)).length).toBeGreaterThan(0);
  });
});

test.describe('PLT-203: crashes are caught, the game is safe, and a report is only offered', () => {
  const calm = (page: Page) => page.getByText(/Something went wrong; your game is safe/).first();

  test('an unexpected error: the calm message, nothing sent without asking; the offered report holds the error; the game is still there after a reload', async ({ page, context }) => {
    test.setTimeout(60_000);
    const requests = await watchNetwork(context);
    await fakeSender(page, 'ok');
    await setUpPaperGame(page, { players: NAMES });
    const calls = await callMany(page, 3);
    await page.evaluate(() => { setTimeout(() => { throw new Error('Test crash 4242'); }, 0); });
    await expect(calm(page)).toBeVisible();
    await page.waitForTimeout(1000);
    expect(await sentCount(page), 'a crash report sent without asking').toBe(0);
    await expect(page.getByRole('button', { name: 'Not now', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /^Report/ }).first().click();
    const report = JSON.parse(await previewText(page));
    expect(report.error?.message ?? '').toContain('Test crash 4242');
    for (const name of NAMES) expect(JSON.stringify(report)).not.toContain(name);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.waitForTimeout(500);
    expect(await sentCount(page)).toBe(0);
    await expectNothingLeft(page, requests);

    await page.reload();
    const resume = page.getByRole('button', { name: /Tap to resume|Resume/ });
    if (await resume.first().isVisible()) await resume.first().click();
    await expect(currentNumber(page)).toHaveText(String(calls[2]));
    expect(await calledCount(page)).toBe(3);
  });

  test('a failed promise too; "Not now" goes back to the game, which carries on', async ({ page }) => {
    await fakeSender(page, 'ok');
    await setUpPaperGame(page, { players: NAMES });
    await callMany(page, 2);
    await page.evaluate(() => { void Promise.reject(new Error('Test rejection 77')); });
    await expect(calm(page)).toBeVisible();
    await page.getByRole('button', { name: 'Not now', exact: true }).click();
    await expect(calm(page)).toBeHidden();
    await call(page);
    expect(await calledCount(page)).toBe(3);
    await page.waitForTimeout(500);
    expect(await sentCount(page)).toBe(0);
  });
});

test.describe('PLT-202: with no internet, a report waits and goes by itself when the connection returns', () => {
  test('sent offline after a game, it goes when the connection returns during the next game, without interrupting it', async ({ page, context }) => {
    test.setTimeout(60_000);
    await fakeSender(page, 'ok');
    await setUpPaperGame(page, { players: NAMES });
    await callMany(page, 3);
    await endGame(page);
    await context.setOffline(true);
    await openReport(page);
    await writeReport(page, 'Sent offline');
    await sendButton(page).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.waitForTimeout(1000);
    expect(await sentCount(page), 'sent with no connection').toBe(0);

    await page.getByRole('button', { name: 'Play again' }).click();
    await confirmPrizes(page);
    const n = await call(page);
    await context.setOffline(false);
    await expect.poll(() => sentCount(page), { message: 'sent when the connection returns', timeout: 10_000 }).toBe(1);
    const got = (await sent(page))[0]!;
    expect(JSON.parse(got.text).what).toBe('Sent offline');
    // Never interrupts the game: no dialog, the number stays, calling goes on.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(currentNumber(page)).toHaveText(String(n));
    await call(page);
  });
});

test.describe('PLT-209: reports waiting to send can be seen and cancelled, and each is sent only once', () => {
  test('two waiting reports are listed with their date and first line; one is deleted; only the other is sent', async ({ page, context }) => {
    test.setTimeout(60_000);
    await fakeSender(page, 'ok');
    await page.goto(HOME);
    await context.setOffline(true);
    for (const words of ['First problem: the board froze', 'Second problem: no sound']) {
      await openReport(page);
      await writeReport(page, words);
      await sendButton(page).click();
      await expect(whatField(page)).toBeHidden();
    }
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(2);
    const today = await todayPattern(page);
    for (const words of ['First problem: the board froze', 'Second problem: no sound']) {
      const item = waitingReports(page).filter({ hasText: words });
      await expect(item).toHaveCount(1);
      await expect(item).toContainText(today);
    }
    await waitingReports(page).filter({ hasText: 'First problem' }).getByRole('button', { name: /^Delete/ }).click();
    const confirm = page.getByRole('dialog').getByRole('button', { name: /^Delete/ });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await expect(waitingReports(page)).toHaveCount(1);

    await context.setOffline(false);
    await expect.poll(() => sentCount(page), { timeout: 10_000 }).toBe(1);
    await page.waitForTimeout(1500);
    const all = await sent(page);
    expect(all.length).toBe(1);
    expect(JSON.parse(all[0]!.text).what).toBe('Second problem: no sound');
    await expect(waitingReports(page)).toHaveCount(0);
  });

  test('the connection drops and returns while sending: the report is still sent only once', async ({ page, context }) => {
    test.setTimeout(60_000);
    await fakeSender(page, 'hang');
    await page.goto(HOME);
    await context.setOffline(true);
    await openReport(page);
    await writeReport(page, 'Only once');
    await sendButton(page).click();
    await context.setOffline(false);
    await expect.poll(() => sentCount(page), { timeout: 10_000 }).toBe(1);
    await context.setOffline(true);
    await context.setOffline(false);
    await page.waitForTimeout(1500);
    expect(await sentCount(page), 'sent again while the first send was still going').toBe(1);
    await settleSend(page);
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(0);
    await context.setOffline(true);
    await context.setOffline(false);
    await page.waitForTimeout(1500);
    expect(await sentCount(page)).toBe(1);
  });

  test('a send that fails keeps the report waiting; it is tried again, the same report, and then never again', async ({ page, context }) => {
    test.setTimeout(60_000);
    await fakeSender(page, 'fail-once');
    await page.goto(HOME);
    await context.setOffline(true);
    await openReport(page);
    await writeReport(page, 'Try again');
    await sendButton(page).click();
    await context.setOffline(false);
    await expect.poll(() => sentCount(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    await context.setOffline(true);
    await context.setOffline(false);
    await expect.poll(() => sentCount(page), { message: 'tried again', timeout: 15_000 }).toBe(2);
    await page.waitForTimeout(1500);
    const all = await sent(page);
    expect(all.length).toBe(2);
    expect(JSON.parse(all[1]!.text).id).toBe(JSON.parse(all[0]!.text).id);
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(0);
  });
});

test.describe('PLT-207, PLT-208: a player reports a problem from their phone ticket', () => {
  test('only what the phone has: version, phone type, their ticket and marks; never a name, another ticket or a seed; kept on the phone', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000);
    const handOuts = await phoneGame(page, [{ name: 'Riyaben' }, { name: 'Ashalata' }]);
    const asha = await newPhone(browser, testInfo, PORTRAIT);
    await asha.goto(HOME);
    await scanAll(asha, handOuts, 'Ashalata');
    const ashaTicket = handOuts.find((h) => h.player === 'Ashalata')!.ticket;
    const ashaNumbers = numbersOf(await gridOf(phoneTicket(asha, ashaTicket).first()));

    const riya = await newPhone(browser, testInfo, PORTRAIT);
    const requests = await watchNetwork(riya.context());
    await riya.goto(HOME);
    await scanAll(riya, handOuts, 'Riyaben');
    const mine = handOuts.find((h) => h.player === 'Riyaben')!.ticket;
    const grid = await gridOf(phoneTicket(riya, mine).first());
    const marks = numbersOf(grid).slice(0, 2);
    for (const n of marks) await tapCell(riya, mine, n);

    await openReport(riya);
    const { text, report } = await writeReport(riya, 'Riyaben here: my marks vanished', /my marks vanished/);
    expect(report.from).toBe('player');
    expect(report.appVersion.length).toBeGreaterThan(0);
    expect(report.phone).toMatch(testInfo.project.name === 'iphone' ? /iPhone/ : /Android/);
    expect(report.tickets.map((t: any) => ({ ticket: t.ticket, rows: t.rows, marks: [...t.marks].sort((a: number, b: number) => a - b) }))).toEqual([
      { ticket: mine, rows: grid, marks: [...marks].sort((a, b) => a - b) },
    ]);
    for (const name of ['Riyaben', 'Ashalata']) expect(text, `the report holds "${name}"`).not.toContain(name);
    const leaked = [...intsInArrays(report)].filter((n) => ashaNumbers.includes(n));
    expect(leaked, "Ashalata's ticket numbers in Riyaben's report").toEqual([]);
    expect(text).not.toMatch(/"(seeds?|setup)"/);

    await sendButton(riya).click();
    await expect(keptOnPhone(riya)).toBeVisible();
    await riya.waitForTimeout(1000);
    await expectNothingLeft(riya, requests);
  });
});
