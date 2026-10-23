// Phase 7: "Report a problem" on the host phone and on a player's phone (specs/platform/03-feedback.md, owner
// sign-off 29 September 2026; PLT-208 and PLT-209 replaced by the share sheet version, decided 22 October 2026).
// Scenarios: PLT-200, PLT-201, PLT-202, PLT-203, PLT-206, PLT-207, PLT-208, PLT-209.
// What a report holds is checked in detail in tests/contract/reports.test.ts (and what is shared in
// tests/contract/report-share.test.ts); here, the screens, the preview, the phone's share sheet (stubbed: shared,
// closed without sharing, files not shareable, no share sheet), waiting for the game to end, and the list of
// "Reports to share". Names, test ids and the stubs: tests/browser/README.md, "Phase 7: Report a problem".
import { expect, test, type BrowserContext, type Locator, type Page } from './fixtures';
import {
  call, calledCount, callMany, confirmPrizes, currentNumber, endGame, hasMainLook, HOME, menuButton, nextNumber, recordWin, setUpPaperGame,  waitOutTapGuard,
} from './helpers';
import { closePhones, gridOf, newPhone, numbersOf, phoneGame, phoneTicket, PORTRAIT, scanAll, tapCell } from './phone';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.afterEach(closePhones);

const NAMES = ['Riyaben', 'Ashalata', 'Daddyji', 'Kabirbhai'];
const SESSION = 'Diwali Gathering';
/** PLT-200 (owner 2026-10-01): a release number major.minor.patch from 1.0.0 up (a build note after + or - is allowed). */
const RELEASE = /^[1-9]\d*\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const APP_ORIGIN = `http://localhost:${process.env.PGN_PORT ?? 4173}`;

// ---------- The report form ----------

const reportItem = (page: Page) =>
  page.getByRole('menuitem', { name: 'Report a problem', exact: true }).or(page.getByRole('button', { name: 'Report a problem', exact: true })).first();
const whatField = (page: Page) => page.getByLabel('What happened?', { exact: true });
const preview = (page: Page) => page.getByTestId('report-preview');
const sendButton = (page: Page) => page.getByRole('button', { name: 'Share report', exact: true }); // PLT-208 (22 Oct 2026): was "Send report"
// The exact words of PLT-208 / PLT-209 (an apostrophe may be straight or curly).
const THANKS = 'Thanks! Your report is on its way.';
const NOT_SHARED = /Not shared\. It['\u2019]s kept in Settings, under Reports to share\./;
const COPIED = 'Report copied. Paste it in a message to whoever shared this app.';
const WAITS_FOR_END = /This report can be shared when the game ends, so it can['\u2019]t give away the game\./;
const OLD_WAITS_FOR_END = /Your report will be sent when this game ends/;
const KEPT_MID_GAME = 'Kept. You can share it when this game ends.';
const HOME_ROW = 'A problem report is ready to share';
const TITLE = 'Pocket Game Night problem report';
const REPLAY_LINE = 'Replay attached. Please send this to whoever shared the app with you.';
const toast = (page: Page, words: string | RegExp) => page.getByText(words, { exact: typeof words === 'string' }).first();

/** "Report a problem": straight from the screen, or from its Menu (PLT-200). */
async function openReport(page: Page) {
  await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
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

// ---------- The phone's share sheet (PLT-208), stubbed ----------

type Can = 'files' | 'text' | 'none';
type Result = 'ok' | 'cancel' | 'cancel-once' | 'hang';
type Shared = { title?: string; text?: string; files: { name: string; type: string; text: string }[]; online: boolean };
/**
 * Stands in for the phone's share sheet, before the page loads. can: 'files' = navigator.canShare says yes to files
 * and text; 'text' = canShare says no to files (and share() refuses a call that holds files), text is fine; 'none' =
 * navigator.share and navigator.canShare do not exist (and navigator.clipboard.writeText records what is copied).
 * result: 'ok' resolves (shared); 'cancel' rejects with an AbortError (closed without sharing); 'cancel-once' does that
 * for the first call only; 'hang' waits until settleShare(). Every call is kept (across reloads) with its files read.
 */
async function fakeShare(page: Page, can: Can = 'files', result: Result = 'ok') {
  await page.addInitScript(({ can, result }) => {
    const w = window as any;
    const log = (): any[] => JSON.parse(localStorage.getItem('__pgnShareLog') ?? '[]');
    if (can === 'none') {
      for (const name of ['share', 'canShare']) {
        try { delete (Navigator.prototype as any)[name]; } catch { /* already absent */ }
        try { Object.defineProperty(navigator, name, { value: undefined, configurable: true }); } catch { /* ignore */ }
      }
      const copied = (): string[] => JSON.parse(localStorage.getItem('__pgnClipboardLog') ?? '[]');
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (t: string) => { localStorage.setItem('__pgnClipboardLog', JSON.stringify([...copied(), t])); return Promise.resolve(); },
          readText: () => Promise.resolve(copied().slice(-1)[0] ?? ''),
        },
      });
      return;
    }
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: (data?: { files?: unknown[] }) => can === 'files' || !(data && data.files && data.files.length),
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: { title?: string; text?: string; files?: File[] }) => {
        if (can === 'text' && data?.files && data.files.length) throw new TypeError('This phone cannot share files');
        // On WebKit, reading a file while the phone is offline can fail; that must not hide that the sheet was opened.
        const files: Shared['files'] = [];
        for (const f of data?.files ?? []) {
          let text = '';
          try { text = await f.text(); } catch { /* unreadable while offline on WebKit */ }
          files.push({ name: f.name, type: f.type, text });
        }
        const entries = log();
        entries.push({ title: data?.title, text: data?.text, files, online: navigator.onLine });
        localStorage.setItem('__pgnShareLog', JSON.stringify(entries));
        if (result === 'hang') return new Promise((resolve) => { w.__pgnShareSettle = resolve; });
        if (result === 'cancel' || (result === 'cancel-once' && entries.length === 1)) throw new DOMException('Share canceled', 'AbortError');
      },
    });
  }, { can, result });
}
/** Every call of the share sheet so far, each with its title, text and files. */
const shared = (page: Page): Promise<Shared[]> => page.evaluate(() => JSON.parse(localStorage.getItem('__pgnShareLog') ?? '[]'));
const shareCount = async (page: Page) => (await shared(page)).length;
const settleShare = (page: Page) => page.evaluate(() => (window as any).__pgnShareSettle?.());
/** What was copied to the clipboard (no share sheet). */
const copied = (page: Page): Promise<string[]> => page.evaluate(() => JSON.parse(localStorage.getItem('__pgnClipboardLog') ?? '[]'));
/** Text lines of a shared text, empty lines left out. */
const linesOf = (text: string | undefined) => (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
/** The replay code at the end of a text: its own line after the "Replay code:" line, standard base64, read as UTF-8. */
function replayCodeIn(text: string | undefined): string {
  const m = /(?:^|\n)Replay code:[ \t]*\n([A-Za-z0-9+/]+=*)[ \t]*\n?$/.exec(text ?? '');
  expect(m, 'the text ends with "Replay code:" and the report as one line of base64').not.toBeNull();
  return Buffer.from(m![1]!, 'base64').toString('utf8');
}
/** YYYYMMDD-HHMM of a moment in the phone's own time (the file name's stamp). */
const stamp = (page: Page) => page.evaluate(() => {
  const d = new Date(), z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`;
});

// ---------- Reports waiting to send (PLT-209) ----------

/** Settings → "Reports to share" (PLT-209, renamed 22 Oct 2026 from "Reports waiting to send"), reached by taps only. */
async function openWaiting(page: Page) {
  // Home's Settings (directly or in Home's menu ⋯, PLT-300), otherwise the Tambola start screen's Settings.
  const settings = page.getByRole('menuitem', { name: 'Settings', exact: true }).or(page.getByRole('button', { name: 'Settings', exact: true })).first();
  const menu = page.getByRole('button', { name: /Menu/ }).first();
  if (!(await settings.isVisible()) && (await menu.isVisible())) {
    await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
    await menu.click();
    await settings.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
    if (!(await settings.isVisible())) await page.keyboard.press('Escape');
  }
  if (!(await settings.isVisible())) {
    const host = page.getByRole('button', { name: /^Host a game/ });
    await waitOutTapGuard(page); // 1.3.1 (I29, R2)
    await ((await host.isVisible()) ? host : page.getByRole('button', { name: /^Tambola/ })).click();
  }
  await settings.click();
  await page.getByRole('button', { name: /^Reports to share/ }).or(page.getByRole('link', { name: /^Reports to share/ })).first().click();
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

/** Shares the open report; returns the share sheet's one call. */
async function shareAndGet(page: Page) {
  await sendButton(page).click();
  await expect.poll(() => shareCount(page), { message: 'the share sheet is called when the person taps "Share report"' }).toBe(1);
  return (await shared(page))[0]!;
}

test.describe('PLT-200, PLT-201, PLT-208: the host reports a problem after a game', () => {
  test('from the payout screen: the host sees exactly what will be sent; no names or session name; the money numbers are in; shared through the share sheet, nothing else leaves', { tag: '@smoke' }, async ({ page, context }, testInfo) => {
    test.setTimeout(60_000);
    const requests = await watchNetwork(context);
    await fakeShare(page, 'files', 'ok');
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
    // PLT-200 (owner 2026-10-01): a real release number, such as 1.0.0; never 0.0.0.
    expect(report.appVersion, 'PLT-200: the app version is a release number such as "1.0.0"').toMatch(RELEASE);
    expect(report.phone).toMatch(testInfo.project.name === 'iphone' ? /iPhone/ : /Android/);
    expect(report.waitingForGameEnd).toBe(false);
    expect(report.game.gameType).toBe('tambola');
    expect(seedValues(report).length).toBeGreaterThan(0);
    expect(callMoves(report)).toBe(calls);

    // PLT-201: players are "Player 1" …; no name, no session name.
    for (const name of [...NAMES, SESSION, 'Diwali']) expect(text, `the report holds "${name}"`).not.toContain(name);
    expect(report.game.setup.config.players.map((p: any) => p.name)).toEqual(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    // PLT-201, PLT-204 (owner, 1 October 2026): the money numbers are in: ₹37 a ticket, the prize amounts, the payouts.
    expect(report.game.setup.config.money?.contribution, 'the contribution per ticket').toBe(37);
    const tierAmounts = (report.game.setup.config.tiers ?? []).map((t: any) => t.amount);
    expect(tierAmounts.reduce((a: number, b: number) => a + b, 0), 'the prize amounts add up to the pot, 4 × ₹37').toBe(148);
    expect(report.game.money?.people?.map((p: any) => p.paid), 'the payouts: what each person paid').toEqual([37, 37, 37, 37]);
    expect(report.game.money.people.map((p: any) => p.name)).toEqual(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    expect(report.game.money.people[0].won, 'Player 1 won Early Five').toBeGreaterThan(0);
    // The host sees it: the words, the version and the money are on screen in the preview.
    await expect(preview(page)).toContainText("Player 1's prize looked wrong");
    await expect(preview(page)).toContainText(report.appVersion);
    await expect(preview(page), 'the host sees the contribution that is sent').toContainText('37');

    // Nothing is shared before the person taps the button (PLT-208).
    expect(await shareCount(page)).toBe(0);
    // PLT-208: the share sheet is given the report; the app itself sends nothing anywhere.
    const got = await shareAndGet(page);
    expect(got.files.length).toBe(1);
    expect(got.files[0]!.text, 'the file holds exactly what the preview showed').toBe(text);
    await expect(toast(page, THANKS)).toBeVisible();
    await page.waitForTimeout(1000);
    await expectNothingLeft(page, requests);
  });

  test('what the share sheet is given: the title, three lines of text, and the replay as a pgn-report-<date>-<time>.json file', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'ok');
    await paperGameWithAWin(page);
    await endGame(page);
    await openReport(page);
    const { text, report } = await writeReport(page, 'Exactly this');
    const before = await stamp(page);
    const got = await shareAndGet(page);
    const after = await stamp(page);

    expect(got.title).toBe(TITLE);
    const lines = linesOf(got.text);
    expect(lines.length, 'three lines, one item per line').toBe(3);
    expect(lines[0]).toMatch(/^Problem report · Tambola · app \S+ · .+$/);
    expect(lines[0]!).toContain(`app ${report.appVersion} ·`);
    expect(lines[1]).toBe('Exactly this');
    expect(lines[2]).toBe(REPLAY_LINE);

    expect(got.files.length).toBe(1);
    const file = got.files[0]!;
    const name = /^pgn-report-(\d{8}-\d{4})\.json$/.exec(file.name);
    expect(name, `the file name "${file.name}" is pgn-report-YYYYMMDD-HHMM.json`).not.toBeNull();
    expect([before, after], 'the stamp in the file name is the phone\'s date and time').toContain(name![1]);
    expect(file.type).toMatch(/json/);
    expect(file.text, 'the report as JSON, exactly the preview text').toBe(text);
    expect(JSON.parse(file.text).what).toBe('Exactly this');
    void testInfo;
  });

  test('where the phone can share text but not files: the text ends with "Replay code:" and the report as one line of base64; no file', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'text', 'ok');
    await paperGameWithAWin(page);
    await endGame(page);
    await openReport(page);
    const { text } = await writeReport(page, '₹37 was wrong, café', '₹37 was wrong, café');
    const got = await shareAndGet(page);
    expect(got.title).toBe(TITLE);
    expect(got.files, 'no file where files cannot be shared').toEqual([]);
    const lines = linesOf(got.text);
    expect(lines[0]).toMatch(/^Problem report · Tambola · app \S+ · .+$/);
    expect(lines[1]).toBe('₹37 was wrong, café');
    expect(replayCodeIn(got.text), 'the code is the report, as UTF-8 base64').toBe(text);
    expect(got.text).not.toContain(REPLAY_LINE);
    await expect(toast(page, THANKS)).toBeVisible();
  });

  test('where the phone has no share sheet: the report text with the replay code is copied to the clipboard, with the toast; nothing else leaves', async ({ page, context }) => {
    test.setTimeout(60_000);
    const requests = await watchNetwork(context);
    await fakeShare(page, 'none');
    await paperGameWithAWin(page);
    await endGame(page);
    await openReport(page);
    const { text } = await writeReport(page, 'Copy me');
    await sendButton(page).click();
    await expect(toast(page, COPIED)).toBeVisible();
    const clip = await copied(page);
    expect(clip.length, 'copied once').toBe(1);
    const lines = linesOf(clip[0]);
    expect(lines[0]).toMatch(/^Problem report · Tambola · app \S+ · .+$/);
    expect(lines[1]).toBe('Copy me');
    expect(replayCodeIn(clip[0]), 'the copied code is the report').toBe(text);
    await page.waitForTimeout(1000);
    await expectNothingLeft(page, requests);
  });

  test('when the share sheet is closed without sharing: the toast says so and the report stays in Settings, under Reports to share', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'cancel');
    await page.goto(HOME);
    await openReport(page);
    await writeReport(page, 'Closed the sheet');
    await sendButton(page).click();
    await expect(toast(page, NOT_SHARED)).toBeVisible();
    await expect(page.getByText(THANKS)).toHaveCount(0);
    expect(await shareCount(page)).toBe(1);
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(1);
    await expect(waitingReports(page).first()).toContainText('Closed the sheet');
  });

  test('when the sheet closes after sharing: the toast thanks them and the report is gone from the phone', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'ok');
    await page.goto(HOME);
    await openReport(page);
    await writeReport(page, 'Shared and gone');
    await sendButton(page).click();
    await expect(toast(page, THANKS)).toBeVisible();
    await expect(page.getByText(NOT_SHARED)).toHaveCount(0);
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(0);
  });
});

test.describe('PLT-200: "Report a problem" on every screen, in the menu, never in the thumb zone', () => {
  test('home: the form asks "What happened?"; the sentence is optional; Cancel shares nothing', async ({ page }) => {
    await fakeShare(page, 'files', 'ok');
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
    expect(await shareCount(page)).toBe(0);
  });

  test('home: shared with no words at all, it still goes, and the text says "(nothing written)"', async ({ page }) => {
    await fakeShare(page, 'files', 'ok');
    await page.goto(HOME);
    await openReport(page);
    const got = await shareAndGet(page);
    expect(linesOf(got.text)[1]).toBe('(nothing written)');
    expect(JSON.parse(got.files[0]!.text).what).toBe('');
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

test.describe('PLT-208: a report started from Home has no game in its first line', () => {
  test('first line is "Problem report · app <version> · <date and time>", nothing else changed', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'ok');
    await page.goto(HOME);
    await openReport(page);
    const { report } = await writeReport(page, 'From Home');
    const got = await shareAndGet(page);
    const lines = linesOf(got.text);
    expect(lines.length, 'three lines, one item per line').toBe(3);
    expect(lines[0]).toMatch(/^Problem report · app \S+ · .+$/);
    expect(lines[0]!).toContain(`app ${report.appVersion} ·`);
    expect(lines[0]).not.toMatch(/Problem report · [^·]*· app/);
    expect(lines[1]).toBe('From Home');
    expect(lines[2]).toBe(REPLAY_LINE);
  });
});

test.describe('PLT-206, PLT-208: a report about a game still being played waits until the game ends', () => {
  test('mid-game: no seeds, "This report can be shared when the game ends, so it can\'t give away the game."; Home offers "A problem report is ready to share" after End game, and Share then gives the seeds and the moves as they were', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'ok');
    await setUpPaperGame(page, { players: NAMES, contribution: 37 });
    await callMany(page, 5);
    await openReport(page);
    const { text: midText, report: mid } = await writeReport(page, 'Numbers repeated');
    expect(mid.waitingForGameEnd).toBe(true);
    expect(seedValues(mid)).toEqual([]);
    expect(callMoves(mid)).toBe(5);
    await expect(page.getByText(WAITS_FOR_END).first()).toBeVisible();
    await expect(page.getByText(OLD_WAITS_FOR_END)).toHaveCount(0);
    await sendButton(page).click();
    await expect(toast(page, KEPT_MID_GAME), 'PLT-208: Share tapped mid-game').toBeVisible();

    // The game carries on, and nothing is shared while it does.
    await expect(nextNumber(page)).toBeVisible();
    await callMany(page, 2);
    await page.waitForTimeout(1500);
    expect(await shareCount(page), 'shared while the game is still being played').toBe(0);

    await endGame(page);
    await page.goto(HOME);
    await waitOutTapGuard(page);
    await expect(page.getByText(HOME_ROW)).toBeVisible();
    expect(await shareCount(page), 'shared by itself when the game ended').toBe(0);
    await page.getByRole('button', { name: 'Share', exact: true }).first().click();
    await expect.poll(() => shareCount(page), { message: 'the same share sheet opens from Home\'s row', timeout: 10_000 }).toBe(1);
    const got = (await shared(page))[0]!;
    expect(got.title).toBe(TITLE);
    expect(got.files.length).toBe(1);
    const full = JSON.parse(got.files[0]!.text);
    expect(full.id).toBe(mid.id);
    expect(full.what).toBe('Numbers repeated');
    expect(full.waitingForGameEnd).toBe(false);
    const seeds = seedValues(full);
    expect(seeds.length).toBeGreaterThan(0);
    for (const seed of seeds) expect(hides(midText, seed), 'the mid-game report held a seed').toBe(false);
    expect(callMoves(full)).toBe(5);
    await expect(toast(page, THANKS)).toBeVisible();
    await expect(page.getByText(HOME_ROW)).toHaveCount(0);
  });

  test('discarding the game also releases the report to Home\'s row', async ({ page }) => {
    await fakeShare(page, 'files', 'ok');
    await setUpPaperGame(page, { players: NAMES, contribution: 'none' });
    await callMany(page, 3);
    await openReport(page);
    await writeReport(page, 'Discard me');
    await sendButton(page).click();
    await page.waitForTimeout(1000);
    expect(await shareCount(page)).toBe(0);
    await menuButton(page).first().click();
    await page.getByRole('menuitem', { name: 'Discard game', exact: true }).or(page.getByRole('button', { name: 'Discard game', exact: true })).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /^Discard/ }).click();
    await page.goto(HOME);
    await waitOutTapGuard(page);
    await expect(page.getByText(HOME_ROW)).toBeVisible();
    await page.getByRole('button', { name: 'Share', exact: true }).first().click();
    await expect.poll(() => shareCount(page), { timeout: 10_000 }).toBe(1);
    expect(seedValues(JSON.parse((await shared(page))[0]!.files[0]!.text)).length).toBeGreaterThan(0);
  });
});

test.describe('PLT-203: crashes are caught, the game is safe, and a report is only offered', () => {
  const calm = (page: Page) => page.getByText(/Something went wrong; your game is safe/).first();

  test('an unexpected error: the calm message, nothing shared without asking; the offered report holds the error; the game is still there after a reload', async ({ page, context }) => {
    test.setTimeout(60_000);
    const requests = await watchNetwork(context);
    await fakeShare(page, 'files', 'ok');
    await setUpPaperGame(page, { players: NAMES });
    const calls = await callMany(page, 3);
    // An uncaught error outside any handler. Thrown from a microtask, not a timer: every test page has Playwright's clock
    // installed (fixtures.ts), whose timers keep an error thrown inside them from reaching the page as uncaught.
    await page.evaluate(() => { queueMicrotask(() => { throw new Error('Test crash 4242'); }); });
    await expect(calm(page)).toBeVisible();
    await page.waitForTimeout(1000);
    expect(await shareCount(page), 'a crash report shared without asking').toBe(0);
    await expect(page.getByRole('button', { name: 'Not now', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /^Report/ }).first().click();
    const report = JSON.parse(await previewText(page));
    expect(report.error?.message ?? '').toContain('Test crash 4242');
    for (const name of NAMES) expect(JSON.stringify(report)).not.toContain(name);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.waitForTimeout(500);
    expect(await shareCount(page)).toBe(0);
    await expectNothingLeft(page, requests);

    await page.reload();
    const resume = page.getByRole('button', { name: /Tap to resume|Resume/ });
    await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
    if (await resume.first().isVisible()) await resume.first().click();
    await expect(currentNumber(page)).toHaveText(String(calls[2]));
    expect(await calledCount(page)).toBe(3);
  });

  test('a failed promise too; "Not now" goes back to the game, which carries on', async ({ page }) => {
    await fakeShare(page, 'files', 'ok');
    await setUpPaperGame(page, { players: NAMES });
    await callMany(page, 2);
    await page.evaluate(() => { void Promise.reject(new Error('Test rejection 77')); });
    await expect(calm(page)).toBeVisible();
    await page.getByRole('button', { name: 'Not now', exact: true }).click();
    await expect(calm(page)).toBeHidden();
    await call(page);
    expect(await calledCount(page)).toBe(3);
    await page.waitForTimeout(500);
    expect(await shareCount(page)).toBe(0);
  });
});

test.describe('PLT-202: a report waits until someone taps Share; nothing goes by itself, online or offline', () => {
  // Orchestrator's ruling, 23 Oct 2026 (specs/platform/03-feedback.md): replaces the old "goes by itself" test.
  test('offline then back online: nothing is shared or requested, and the report is still waiting on Home and in Settings', async ({ page, context }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'ok');
    const requests = await watchNetwork(context);
    await setUpPaperGame(page, { players: NAMES });
    await callMany(page, 3);
    await openReport(page);
    await writeReport(page, 'Written offline');
    await sendButton(page).click();
    await expect(toast(page, KEPT_MID_GAME)).toBeVisible();
    await endGame(page);
    await page.goto(HOME);
    await waitOutTapGuard(page);
    await expect(page.getByText(HOME_ROW)).toBeVisible();
    await context.setOffline(true);

    const before = requests.length;
    await page.waitForTimeout(1500);
    await context.setOffline(false);
    await page.waitForTimeout(2500);
    expect(await shareCount(page), 'shared by itself').toBe(0);
    expect(requests.slice(before), 'network requests after the connection returned').toEqual([]);
    await expectNothingLeft(page, requests);
    await expect(page.getByText(HOME_ROW)).toBeVisible();
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(1);
    await expect(waitingReports(page).first()).toContainText('Written offline');
    expect(await shareCount(page)).toBe(0);
  });

  test('a report kept at Home offline stays waiting when the connection returns, and only a tap on Share shares it', async ({ page, context }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'cancel');
    const requests = await watchNetwork(context);
    await page.goto(HOME);
    await openReport(page);
    await writeReport(page, 'Kept offline at Home');
    await context.setOffline(true);
    await sendButton(page).click();
    await expect(toast(page, NOT_SHARED)).toBeVisible();
    const before = requests.length;
    await context.setOffline(false);
    expect(await shareCount(page), 'the sheet was opened once (read once the phone is online again)').toBe(1);
    await page.reload();
    await page.waitForTimeout(2500);
    expect(await shareCount(page), 'shared again by itself').toBe(1);
    expect(requests.slice(before).filter((r) => r.method !== 'GET'), 'anything sent').toEqual([]);
    await expectNothingLeft(page, requests);
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(1);
    await expect(waitingReports(page).first()).toContainText('Kept offline at Home');
  });
});

// ---------- Reports to share (PLT-209) ----------

const itemShare = (item: Locator) => item.getByRole('button', { name: 'Share', exact: true });
const itemDelete = (item: Locator) => item.getByRole('button', { name: /^Delete/ });
const DELETE_ASKS = /Delete this report\? It hasn['’]t been shared\./;
/** Writes a report at Home and closes the share sheet without sharing, so it is kept. */
async function keepAReport(page: Page, words: string) {
  await openReport(page);
  await writeReport(page, words);
  await sendButton(page).click();
  await expect(toast(page, NOT_SHARED)).toBeVisible();
  await page.clock.runFor(61_000); // the next report is a minute newer (newest first)
}

test.describe('PLT-209: reports not yet shared can be seen, shared or deleted', () => {
  test('two kept reports are listed newest first with their date and first line, each with Share and Delete; Delete asks first; "Keep it" keeps it; Delete removes it, and nothing is shared', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'cancel');
    await page.goto(HOME);
    await keepAReport(page, 'First problem: the board froze');
    await keepAReport(page, 'Second problem: no sound');
    const calledBefore = await shareCount(page);
    expect(calledBefore).toBe(2);

    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(2);
    await expect(waitingReports(page).first(), 'newest first').toContainText('Second problem: no sound');
    await expect(waitingReports(page).last()).toContainText('First problem: the board froze');
    const today = await todayPattern(page);
    for (const words of ['First problem: the board froze', 'Second problem: no sound']) {
      const item = waitingReports(page).filter({ hasText: words });
      await expect(item).toHaveCount(1);
      await expect(item).toContainText(today);
      await expect(itemShare(item)).toBeEnabled();
      await expect(itemDelete(item)).toBeEnabled();
    }
    // The old note and the old name are gone.
    await expect(page.getByText(/Kept on this phone: sending isn.t set up yet/)).toHaveCount(0);
    await expect(page.getByText(/Reports waiting to send/)).toHaveCount(0);

    // Delete asks first; "Keep it" is the main button and keeps the report.
    const first = waitingReports(page).filter({ hasText: 'First problem' });
    await itemDelete(first).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(DELETE_ASKS);
    const keep = dialog.getByRole('button', { name: 'Keep it', exact: true });
    const del = dialog.getByRole('button', { name: 'Delete', exact: true });
    await expect(keep).toBeVisible();
    await expect(del).toBeVisible();
    expect(await hasMainLook(keep), '"Keep it" is the main button').toBe(true);
    expect(await hasMainLook(del), '"Delete" is not the main button').toBe(false);
    await keep.click();
    await expect(waitingReports(page)).toHaveCount(2);

    await itemDelete(first).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(waitingReports(page)).toHaveCount(1);
    await expect(waitingReports(page).first()).toContainText('Second problem: no sound');
    expect(await shareCount(page), 'deleting shares nothing').toBe(calledBefore);

    // The list survives a reload.
    await page.reload();
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(1);
  });

  test('Share in the list opens the share sheet; once it is shared the report is gone and is never shared twice', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'cancel-once');
    await page.goto(HOME);
    await keepAReport(page, 'Share me later');
    const firstFile = JSON.parse((await shared(page))[0]!.files[0]!.text);
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(1);
    await itemShare(waitingReports(page).first()).click();
    await expect.poll(() => shareCount(page)).toBe(2);
    const second = (await shared(page))[1]!;
    expect(second.title).toBe(TITLE);
    expect(JSON.parse(second.files[0]!.text).id, 'the same report').toBe(firstFile.id);
    await expect(toast(page, THANKS)).toBeVisible();
    await expect(waitingReports(page)).toHaveCount(0);
    await page.reload();
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(0);
    await page.waitForTimeout(1000);
    expect(await shareCount(page), 'shared again').toBe(2);
  });

  test('a share still going is not started twice (a second tap does nothing); the report goes only when the share completes', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'hang');
    await page.goto(HOME);
    await openReport(page);
    await writeReport(page, 'Only once');
    await sendButton(page).click();
    await expect.poll(() => shareCount(page)).toBe(1);
    await sendButton(page).click({ timeout: 1000 }).catch(() => {}); // a second tap while the sheet is open
    await page.waitForTimeout(1000);
    expect(await shareCount(page), 'a second share sheet while the first is open').toBe(1);
    await settleShare(page);
    await expect(toast(page, THANKS)).toBeVisible();
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(0);
    await page.waitForTimeout(1000);
    expect(await shareCount(page)).toBe(1);
  });

  test('a kept report and one that waited for its game to end are both listed, newest first, each with Share and Delete, once the game has ended', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'cancel');
    await setUpPaperGame(page, { players: NAMES, contribution: 37 });
    await callMany(page, 3);
    await openReport(page);
    await writeReport(page, 'Mid-game problem');
    await sendButton(page).click();
    await page.clock.runFor(61_000);
    await endGame(page);
    await openReport(page);
    await writeReport(page, 'Kept problem');
    await sendButton(page).click();
    await expect(toast(page, NOT_SHARED)).toBeVisible();
    expect(await shareCount(page), 'the mid-game report must not reach the share sheet').toBe(1);

    await page.goto(HOME);
    await openWaiting(page);
    await expect(waitingReports(page)).toHaveCount(2);
    for (const words of ['Mid-game problem', 'Kept problem']) await expect(waitingReports(page).filter({ hasText: words })).toHaveCount(1);
    await expect(page.getByText(/sending isn.t set up yet/)).toHaveCount(0);
    for (const item of [waitingReports(page).filter({ hasText: 'Mid-game problem' }), waitingReports(page).filter({ hasText: 'Kept problem' })]) {
      await expect(itemShare(item)).toBeEnabled();
      await expect(itemDelete(item)).toBeEnabled();
    }
  });

  test('while the game is still being played: its report is listed with Share disabled and "Waiting for the game to end"; it can be deleted', async ({ page }) => {
    test.setTimeout(60_000);
    await fakeShare(page, 'files', 'ok');
    await setUpPaperGame(page, { players: NAMES, contribution: 37 });
    await callMany(page, 3);
    await openReport(page);
    await writeReport(page, 'Still playing');
    await sendButton(page).click();
    await page.goto(HOME); // the game is still being played: Home offers to resume it
    await openWaiting(page);
    const item = waitingReports(page).filter({ hasText: 'Still playing' });
    await expect(item).toHaveCount(1);
    await expect(itemShare(item)).toBeDisabled();
    await expect(item).toContainText('Waiting for the game to end');
    await expect(itemDelete(item)).toBeEnabled();
    expect(await shareCount(page)).toBe(0);
    await itemDelete(item).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(waitingReports(page)).toHaveCount(0);
  });
});

test.describe('PLT-207, PLT-208: a player reports a problem from their phone ticket', () => {
  test('only what the phone has: version, phone type, their ticket and marks; never a name, another ticket or a seed; shared through the share sheet', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000);
    const handOuts = await phoneGame(page, [{ name: 'Riyaben' }, { name: 'Ashalata' }]);
    const asha = await newPhone(browser, testInfo, PORTRAIT);
    await asha.goto(HOME);
    await scanAll(asha, handOuts, 'Ashalata');
    const ashaTicket = handOuts.find((h) => h.player === 'Ashalata')!.ticket;
    const ashaNumbers = numbersOf(await gridOf(phoneTicket(asha, ashaTicket).first()));

    const riya = await newPhone(browser, testInfo, PORTRAIT);
    const requests = await watchNetwork(riya.context());
    await fakeShare(riya, 'files', 'ok');
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
    // PLT-200 (owner 2026-10-01): the same kind of release number on a player's phone.
    expect(report.appVersion, 'PLT-200: the app version is a release number such as "1.0.0"').toMatch(RELEASE);
    expect(report.phone).toMatch(testInfo.project.name === 'iphone' ? /iPhone/ : /Android/);
    expect(report.tickets.map((t: any) => ({ ticket: t.ticket, rows: t.rows, marks: [...t.marks].sort((a: number, b: number) => a - b) }))).toEqual([
      { ticket: mine, rows: grid, marks: [...marks].sort((a, b) => a - b) },
    ]);
    for (const name of ['Riyaben', 'Ashalata']) expect(text, `the report holds "${name}"`).not.toContain(name);
    const leaked = [...intsInArrays(report)].filter((n) => ashaNumbers.includes(n));
    expect(leaked, "Ashalata's ticket numbers in Riyaben's report").toEqual([]);
    expect(text).not.toMatch(/"(seeds?|setup)"/);

    const got = await shareAndGet(riya);
    expect(got.title).toBe(TITLE);
    expect(got.files[0]!.text, 'the file is the report the player saw').toBe(text);
    for (const name of ['Riyaben', 'Ashalata']) expect(`${got.text}${got.files[0]!.text}`, `the shared report holds "${name}"`).not.toContain(name);
    await expect(toast(riya, THANKS)).toBeVisible();
    await riya.waitForTimeout(1000);
    await expectNothingLeft(riya, requests);
  });
});
