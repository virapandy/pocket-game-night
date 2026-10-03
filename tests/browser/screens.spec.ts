// Screenshot comparison (docs/change-sop.md, "Added 3 October", item 2; owner approved). Reference pictures of every
// screen the UX list rows 1-25 of docs/handover.md touched, at 360 × 640, 390 × 844 and 812 × 375, on the Android
// phone. A C1 change that alters one of these pictures fails here until the product owner or UX designer approves the
// new picture; the approved picture then becomes the reference (`--update-snapshots`, committed with the change).
// Written layout rules a picture can't show stay in their own specs (for example "no sideways sliding").
//
// Tagged @screens: part of the complete run (release, nightly), never of quick verify. Steady pictures: the app's
// randomness (crypto.getRandomValues, Math.random) comes from a fixed seed, so games, tickets, game codes and QR codes
// are the same every run; the clock starts at 7:00 pm India time, 3 October 2026; animations and the text caret are off;
// QR codes (a pink box) and the counting-down "Called 24 · Undo (5s)" bar (words see-through) are covered, as they
// change with the running clock; the covers sit under any pop-up, never on top of it.
// The references are per platform (Playwright adds "-android-darwin" or "-android-linux" to each name): fonts differ.
// The list of screens: README.md, "Screenshot comparison".
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Browser, type Page, type TestInfo } from './fixtures';
import { callMany, endGame, fillPlayers, fromMenu, HOME, openHistory, openTambola, recordWin, setUpPaperGame, ticketCard, turnCueOn } from './helpers';
import {
  closePhones, enterTicketNumber, fakeCamera, gridOf, handOutScreen, newPhone, notHandedOutQuestion, openQuickMark, phoneGame,
  phoneTicket, rowOf, scanAll, tapCell, ticketChoice, type HandOut, type PhonePlayer,
} from './phone';

const TZ = 'Asia/Kolkata';
const T0 = new Date('2026-10-03T19:00:00+05:30');
const HOUR = 3600_000;
const SIZES = [
  { name: '360x640', width: 360, height: 640 },
  { name: '390x844', width: 390, height: 844 },
  { name: '812x375', width: 812, height: 375 },
] as const;
const THREE: PhonePlayer[] = [{ name: 'Riya' }, { name: 'Asha' }, { name: 'Dad' }];
const FAMILY = ['Riya', 'Asha', 'Dad'];

test.use({ timezoneId: TZ, locale: 'en-IN' });
test.afterEach(closePhones);
test.beforeEach(({}, testInfo) => {
  // The Android phone only (SOP item 2), and never in quick verify (the complete run's job).
  test.skip(testInfo.project.name !== 'android', 'screenshots are compared on the Android phone only');
  test.skip(/quick/i.test(process.env.GITHUB_WORKFLOW ?? ''), 'screenshot comparison runs in the complete run, not quick verify');
});

/**
 * Fixed randomness, and the clock set to `time`, on this phone before it opens the app. The clock then runs on, as a
 * real one does: a clock that never moves can stall the app (seen as clicks that never finish) and makes tickets
 * scanned one after another look added at the same moment. Each test finishes within the minute, so times on screen
 * read "7:00 pm".
 */
async function steady(page: Page, time = T0) {
  await page.addInitScript(() => {
    // The sequence carries on across page loads in this tab (a scan opens a new page), so ids made after a reload
    // never repeat earlier ones.
    const KEY = '__screens_seed';
    let s = Number(sessionStorage.getItem(KEY) ?? 0x5eed1234) | 0;
    const next = () => {
      s = (s + 0x6d2b79f5) | 0;
      sessionStorage.setItem(KEY, String(s));
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return (t ^ (t >>> 14)) >>> 0;
    };
    const c = window.crypto as Crypto;
    c.getRandomValues = (<T extends ArrayBufferView | null>(a: T): T => {
      if (!a) return a;
      const bytes = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
      for (let i = 0; i < bytes.length; i++) bytes[i] = next() & 0xff;
      return a;
    }) as Crypto['getRandomValues'];
    Math.random = () => next() / 2 ** 32;
  });
  await page.clock.install({ time });
}

/** A player's phone at this size, steady, with this player's tickets scanned. */
async function playerPhone(browser: Browser, testInfo: TestInfo, handOuts: HandOut[], name: string, size: { width: number; height: number }) {
  const p = await newPhone(browser, testInfo, { width: size.width, height: size.height }, { timezoneId: TZ });
  await steady(p);
  await p.goto(HOME);
  await expect(p.getByRole('main').first()).toBeVisible();
  await scanAll(p, handOuts, name);
  return p;
}

/**
 * The picture of the screen as it first appears (CSS pixels, so the files stay small), compared with its reference.
 * Fonts differ between computers, so each platform has its own references. Where this platform has no reference yet
 * (the first complete run on Linux), the test says so as a skip, never a pass; `SCREENS_NEW=1` with
 * `--update-snapshots` takes the new pictures instead, for the product owner or UX designer to approve.
 */
async function shot(page: Page, screen: string, size: string) {
  const name = `${screen}-${size}.png`;
  if (!process.env.SCREENS_NEW && !existsSync(test.info().snapshotPath(name, { kind: 'screenshot' }))) {
    test.skip(true, `no approved ${process.platform} reference picture for ${name} yet (README.md, "Screenshot comparison")`);
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  // Short timed states settle first, such as "Next number" resting for half a second after each call (TAM-135).
  await page.waitForTimeout(800);
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  // Covered, as they change with the running clock: QR codes (a ticket QR holds the game's start time to the
  // millisecond) and the "Called 24 · Undo (5s)" bar, whose seconds count down (its place and size still show).
  // The cover is painted in the page itself, in the covered thing's own layer, so a pop-up or a bar lying on top of
  // it still shows its words (Playwright's `mask` paints over everything, pop-ups included).
  await page.getByTestId('undo-toast').filter({ hasText: /Undo \(\d+s\)/ }).evaluateAll((els) => {
    for (const el of els) el.setAttribute('data-screens-cover', '');
  });
  await expect(page).toHaveScreenshot(name, { animations: 'disabled', caret: 'hide', scale: 'css', stylePath: COVER });
}

/** The covers (screens-cover.css): a pink box where a QR code is, and the counting-down bar with its words see-through. */
const COVER = fileURLToPath(new URL('./screens-cover.css', import.meta.url));
for (const size of SIZES) {
  test.describe(`Screens at ${size.width} × ${size.height}`, { tag: '@screens' }, () => {
    test.use({ viewport: { width: size.width, height: size.height } });
    test.setTimeout(90_000);

    // ---------------------------------------------------------------- Host phone

    test('host setup: ticket type (rows 11, 1), prizes with the session line (rows 9, 19), hand-out (rows 10, 19, 25), the "Has Dad got their ticket?" question (row 7, N5), "plays on paper · Undo" (row 8)', async ({ page }) => {
      await steady(page);
      await openTambola(page);
      await page.getByRole('button', { name: 'New game' }).click();
      await ticketCard(page, 'phone').click();
      await turnCueOn(page);
      await shot(page, 'host-ticket-type', size.name);
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await fillPlayers(page, FAMILY);
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByLabel('Contribution per ticket').fill('50');
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
      await shot(page, 'host-prizes', size.name);
      await page.getByRole('button', { name: 'Confirm prizes' }).click();
      await expect(handOutScreen(page)).toBeVisible();
      await shot(page, 'host-hand-out', size.name);
      await page.getByRole('button', { name: 'Next ticket', exact: true }).click();
      await page.getByRole('button', { name: 'Next ticket', exact: true }).click();
      await page.getByRole('button', { name: 'Start calling', exact: true }).click();
      await expect(notHandedOutQuestion(page)).toBeVisible();
      await shot(page, 'host-not-handed-out-question', size.name);
      await notHandedOutQuestion(page).getByRole('button', { name: 'Give a paper ticket', exact: true }).click();
      await expect(page.getByText(/Dad plays on paper/).first()).toBeVisible();
      await shot(page, 'host-plays-on-paper', size.name);
    });

    test('host calling screen with phone tickets after 3 calls (rows 11, 16, 25) and the room view (row 25)', async ({ page }) => {
      await steady(page);
      await phoneGame(page, THREE);
      await callMany(page, 3);
      await shot(page, 'host-calling', size.name);
      await fromMenu(page, 'Show the room');
      await expect(page.getByTestId('room-view')).toBeVisible();
      await shot(page, 'host-room-view', size.name);
    });

    test('host "Record a win" with the winner chosen (row 5), then the payout summary with "Game over" (rows 14, 22, 5)', async ({ page }) => {
      await steady(page);
      await setUpPaperGame(page, { players: FAMILY });
      await callMany(page, 3);
      await page.getByRole('button', { name: 'Record a win' }).click();
      await page.getByRole('button', { name: 'Top Line', exact: true }).click();
      await page.getByRole('button', { name: 'Riya', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Confirm', exact: true })).toBeEnabled();
      await shot(page, 'host-record-a-win', size.name);
      await page.getByRole('button', { name: 'Confirm', exact: true }).click();
      await page.getByRole('button', { name: /^Close Top Line/ }).first().click();
      await endGame(page);
      await expect(page.getByTestId('game-over')).toBeVisible();
      await shot(page, 'host-game-over-payouts', size.name);
    });

    test('host verdict by ticket number with its proof line (rows 24, 5)', async ({ page }) => {
      await steady(page);
      await fakeCamera(page, 'denied');
      await phoneGame(page, THREE);
      await callMany(page, 3);
      await enterTicketNumber(page, 1, 'Top Line');
      await expect(page.getByTestId('claim-result')).toBeVisible();
      await shot(page, 'host-verdict-proof', size.name);
    });

    test('host Settings during a game, "Back" at the top (row 18)', async ({ page }) => {
      await steady(page);
      await setUpPaperGame(page, { players: FAMILY });
      await callMany(page, 1);
      await fromMenu(page, 'Settings');
      await expect(page.getByRole('button', { name: /^(Back|← Back)$/ }).first()).toBeVisible();
      await shot(page, 'host-settings-in-game', size.name);
    });

    test('History: "Clear all history" with one past game in an unsettled tally (rows 5, 19)', async ({ page }) => {
      await steady(page);
      await setUpPaperGame(page, { players: FAMILY });
      await callMany(page, 3);
      await recordWin(page, 'Top Line', ['Riya']);
      await page.getByRole('button', { name: /^Close Top Line/ }).first().click();
      await endGame(page);
      await openHistory(page);
      await page.getByRole('button', { name: 'Clear all history' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await shot(page, 'history-clear-one', size.name);
    });

    // ---------------------------------------------------------------- Player's phone

    test('player: tickets with the cue line (rows 1, 2, 3), quick mark (row 3), "Which ticket?" (row 12), "Which prize?" (row 17), the claim QR (rows 13, 19), "Done with this game…" (row 20)', async ({ page, browser }, testInfo) => {
      await steady(page);
      const handOuts = await phoneGame(page, [{ name: 'Riya', tickets: 3 }, { name: 'Asha' }], 50, { cue: true });
      const riya = await playerPhone(browser, testInfo, handOuts, 'Riya', size);
      const top = rowOf(await gridOf(phoneTicket(riya, 1).first()), 0);
      for (const n of top) await tapCell(riya, 1, n);
      await expect(riya.getByTestId('pattern-cue')).toBeVisible();
      await shot(riya, 'player-tickets-cue', size.name);
      await openQuickMark(riya);
      await shot(riya, 'player-quick-mark', size.name);
      await riya.getByRole('button', { name: /^(Back|← Back)$/ }).first().click();
      await riya.getByRole('button', { name: 'Show claim', exact: true }).click();
      await expect(ticketChoice(riya, 1)).toBeVisible();
      await shot(riya, 'player-which-ticket', size.name);
      await ticketChoice(riya, 1).click();
      await expect(riya.getByRole('button', { name: 'Top Line', exact: true })).toBeVisible();
      await shot(riya, 'player-which-prize', size.name);
      await riya.getByRole('button', { name: 'Top Line', exact: true }).click();
      await expect(riya.getByTestId('claim-qr')).toBeVisible();
      await shot(riya, 'player-claim-qr', size.name);
      await riya.getByRole('button', { name: 'Done', exact: true }).first().click();
      const done = /^Done with this game(…|\.\.\.)?$/;
      await riya.getByRole('button', { name: /Menu/ }).click();
      await riya.getByRole('menuitem', { name: done }).or(riya.getByRole('button', { name: done })).first().click();
      await expect(riya.getByText('Clear your tickets from this phone?')).toBeVisible();
      await shot(riya, 'player-done-with-this-game', size.name);
    });

    test('player: Home with tickets more than 6 hours old, "Your tickets from 7:00 pm · Open · Clear" (row 21)', async ({ page, browser }, testInfo) => {
      await steady(page);
      const handOuts = await phoneGame(page, [{ name: 'Riya', tickets: 2 }, { name: 'Asha' }]);
      const riya = await playerPhone(browser, testInfo, handOuts, 'Riya', size);
      await riya.clock.setSystemTime(new Date(T0.getTime() + 6 * HOUR + 10 * 60_000));
      await riya.goto(HOME);
      await expect(riya.getByTestId('saved-tickets')).toBeVisible();
      await shot(riya, 'player-home-saved-tickets', size.name);
    });
  });
}
