// Phase 2 (phone tickets) browser helpers: the host phone and players' phones, each a separate browser
// context (its own storage, like a separate phone). Names, test ids and the camera hook are listed in
// tests/browser/README.md, "Phase 2: phone tickets".
import { expect, type Browser, type BrowserContext, type Locator, type Page, type TestInfo } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { silence } from './fixtures';
import { call, fillPlayers, fromMenu, HOME, nextNumber, openTambola, sessionNameField, continueOrNew } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PhonePlayer { name: string; tickets?: number }
export const PORTRAIT = { width: 390, height: 844 };
export const LANDSCAPE = { width: 844, height: 390 };

/**
 * Another phone: a new browser context with the same device settings as this test's project (Android or
 * iPhone), silent like every page (fixtures.ts). `viewport` defaults to the project's.
 */
export async function newPhone(browser: Browser, testInfo: TestInfo, viewport?: { width: number; height: number }): Promise<Page> {
  const use = testInfo.project.use as any;
  const context: BrowserContext = await browser.newContext({
    baseURL: use.baseURL,
    viewport: viewport ?? use.viewport,
    userAgent: use.userAgent,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
    serviceWorkers: 'allow',
  });
  await silence(context);
  opened.push(context);
  return context.newPage();
}

const opened: BrowserContext[] = [];
/** Closes every extra phone opened by newPhone (call in test.afterEach). */
export async function closePhones() {
  while (opened.length) await opened.pop()!.close().catch(() => {});
}

// ---------- The camera hook (host phone) ----------

/**
 * Stands in for the host phone's camera, before the page loads. When `window.__pgnCamera` exists, the app's
 * "Scan a claim" calls `window.__pgnCamera.start(onRead, onFail)` instead of opening the real camera, and calls
 * the function it returns when the scanner closes. `mode`: 'ok' (reads whatever the test shows it),
 * 'denied' (permission refused) or 'no-camera' (the phone has none): then onFail(mode) is called at once.
 */
export async function fakeCamera(page: Page, mode: 'ok' | 'denied' | 'no-camera' = 'ok') {
  await page.addInitScript((mode) => {
    const w = window as any;
    w.__pgnCameraStarts = 0;
    w.__pgnCamera = {
      start(onRead: (text: string) => void, onFail: (why: string) => void) {
        w.__pgnCameraStarts++;
        const state = { onRead, onFail, active: true };
        w.__pgnCameraState = state;
        if (mode !== 'ok') setTimeout(() => onFail(mode), 0);
        return () => { state.active = false; };
      },
    };
  }, mode);
}

/** Shows the host's (fake) camera a QR code with this text, once the scanner is open. */
export async function showToCamera(host: Page, text: string) {
  await expect.poll(() => host.evaluate(() => !!(window as any).__pgnCameraState?.active), { message: 'the scanner did not start the camera' }).toBe(true);
  await host.evaluate((t) => (window as any).__pgnCameraState.onRead(t), text);
}

// ---------- Host: setup and hand-out ----------

/** Tickets for player i: a select (or number field) labelled "Tickets for player 1" … */
async function setTickets(page: Page, i: number, tickets: number) {
  const field = page.getByLabel(`Tickets for player ${i + 1}`, { exact: true });
  if ((await field.evaluate((el) => el.tagName)) === 'SELECT') await field.selectOption(String(tickets));
  else await field.fill(String(tickets));
}

export const handOutScreen = (page: Page) => page.getByTestId('hand-out');

/** Tambola → New game → Phone tickets → players (and tickets each) → contribution → Confirm prizes → hand-out. */
export async function setUpPhoneGame(page: Page, players: PhonePlayer[], contribution: number | 'none' = 50) {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: /^Phone tickets/ }).click();
  await fillPlayers(page, players.map((p) => p.name));
  for (const [i, p] of players.entries()) if ((p.tickets ?? 1) !== 1) await setTickets(page, i, p.tickets!);
  await page.getByRole('button', { name: 'Next' }).click();
  if (contribution === 'none') await page.getByRole('button', { name: 'No money' }).click();
  else await page.getByLabel('Contribution per ticket').fill(String(contribution));
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Confirm prizes' }).click();
  // The session question (PLT-016) may come first; keep the suggestion or continue.
  await expect(handOutScreen(page).or(sessionNameField(page)).or(continueOrNew(page)).first()).toBeVisible();
  if (await continueOrNew(page).isVisible()) await page.getByRole('button', { name: /^Continue / }).click();
  if (await sessionNameField(page).isVisible()) await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(handOutScreen(page)).toBeVisible();
}

export interface HandOut { ticket: number; player: string; payload: string; code: string }

/** The ticket on the hand-out screen now: "Ticket 3 → Riya (1 of 2)", its QR text and typed code. */
export async function currentHandOut(page: Page): Promise<HandOut> {
  const label = (await page.getByTestId('hand-out-ticket').textContent()) ?? '';
  const m = label.match(/Ticket (\d+)\s*→\s*(.+?)\s*\(/);
  if (!m) throw new Error(`hand-out-ticket reads "${label}", not "Ticket 3 → Riya (1 of 2)"`);
  const payload = (await page.getByTestId('ticket-qr').getAttribute('data-payload')) ?? '';
  const code = ((await page.getByTestId('ticket-code').textContent()) ?? '').trim();
  return { ticket: Number(m[1]), player: m[2]!.trim(), payload, code };
}

/** Taps "Next ticket", or "Start calling" after the last ticket. Returns true when calling has started. */
export async function confirmHandOut(page: Page): Promise<boolean> {
  const next = page.getByRole('button', { name: 'Next ticket', exact: true });
  if (await next.isVisible()) {
    await next.click();
    return false;
  }
  await page.getByRole('button', { name: 'Start calling', exact: true }).click();
  await expect(nextNumber(page)).toBeVisible();
  return true;
}

/** Hands out every ticket in order and starts calling. Returns each ticket's QR text, by player name. */
export async function handOutAll(page: Page): Promise<HandOut[]> {
  const out: HandOut[] = [];
  for (let i = 0; i < 60; i++) {
    out.push(await currentHandOut(page));
    if (await confirmHandOut(page)) return out;
  }
  throw new Error('hand-out never reached "Start calling"');
}

/** Sets up a phone game on the host and hands out every ticket. */
export async function phoneGame(host: Page, players: PhonePlayer[], contribution: number | 'none' = 50) {
  await setUpPhoneGame(host, players, contribution);
  return handOutAll(host);
}

// ---------- Player phone ----------

/** "Scans" a ticket QR: the phone's camera opens the link inside it. */
export async function scanTicket(player: Page, payload: string) {
  await player.goto(payload);
  await expect(player.getByTestId('phone-ticket').first()).toBeVisible();
}

/** Opens every ticket of this player on their phone, in hand-out order. */
export async function scanAll(player: Page, handOuts: HandOut[], name: string) {
  for (const h of handOuts.filter((x) => x.player === name)) await scanTicket(player, h.payload);
}

export const phoneTicket = (player: Page, n: number) => player.locator(`[data-testid="phone-ticket"][data-ticket="${n}"]`);
/** Every ticket shown on the player's phone now (visible ones only). */
export const shownTickets = (player: Page) => player.locator('[data-testid="phone-ticket"]:visible');
export const cell = (scope: Locator, n: number) => scope.locator(`[data-number="${n}"]`);

/** A ticket's grid as 3 rows of 9 (null = blank), read from its 27 [data-cell] elements in row order. */
export async function gridOf(scope: Locator): Promise<(number | null)[][]> {
  const cells = await scope.locator('[data-cell]').evaluateAll((els) => els.map((e) => e.getAttribute('data-number')));
  if (cells.length !== 27) throw new Error(`a ticket should have 27 [data-cell] elements, found ${cells.length}`);
  return [0, 1, 2].map((r) => cells.slice(r * 9, r * 9 + 9).map((v) => (v === null || v === '' ? null : Number(v))));
}
export const numbersOf = (grid: (number | null)[][]) => grid.flat().filter((n): n is number => n !== null);
export const rowOf = (grid: (number | null)[][], r: number) => grid[r]!.filter((n): n is number => n !== null);
export const cornersOf = (grid: (number | null)[][]) => {
  const top = rowOf(grid, 0), bottom = rowOf(grid, 2);
  return [top[0]!, top[4]!, bottom[0]!, bottom[4]!];
};

/** Taps a number on a phone ticket to mark or unmark it (TAM-131). */
export async function tapCell(player: Page, ticket: number, n: number) {
  await cell(phoneTicket(player, ticket), n).click();
}
export async function markedOn(scope: Locator): Promise<number[]> {
  return (await scope.locator('[data-number][data-marked="true"]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-number'))))).sort((a, b) => a - b);
}

/** Show claim → (Which ticket?) → Which prize? → the claim QR. Returns the text inside the claim QR. */
export async function showClaim(player: Page, prize: string, ticket?: number): Promise<string> {
  await player.getByRole('button', { name: 'Show claim', exact: true }).click();
  if (ticket !== undefined) {
    const pick = player.getByRole('button', { name: `Ticket ${ticket}`, exact: true });
    if (await pick.isVisible()) await pick.click();
  }
  await player.getByRole('button', { name: prize, exact: true }).click();
  const qr = player.getByTestId('claim-qr');
  await expect(qr).toBeVisible();
  return (await qr.getAttribute('data-payload')) ?? '';
}

// ---------- Host: checking claims ----------

/** The host's button is "Scan a claim" (owner decision 2026-09-30). */
export const scanClaimButton = (host: Page) => host.getByRole('button', { name: 'Scan a claim', exact: true });
export const claimResult = (host: Page) => host.getByTestId('claim-result');
export const claimRefused = (host: Page) => host.getByTestId('claim-refused');

/** "Scan a claim", then the host's camera reads this claim QR. */
export async function scanClaim(host: Page, text: string) {
  await scanClaimButton(host).click();
  await expect(host.getByTestId('claim-scanner')).toBeVisible();
  await showToCamera(host, text);
}

/** The typed fallback: "Enter ticket number", the number, the prize (if asked), "Check" (TAM-174, TAM-178). */
export async function enterTicketNumber(host: Page, ticket: number, prize: string) {
  const field = host.getByLabel('Ticket number', { exact: true });
  if (!(await field.isVisible())) {
    if (!(await host.getByTestId('claim-scanner').isVisible())) await scanClaimButton(host).click();
    await host.getByRole('button', { name: 'Enter ticket number', exact: true }).click();
  }
  await field.fill(String(ticket));
  const prizeButton = host.getByRole('button', { name: prize, exact: true });
  if (await prizeButton.isVisible()) await prizeButton.click();
  await host.getByRole('button', { name: 'Check', exact: true }).click();
}

/** Calls numbers on the host until `done(called)` holds. Returns every number called, in order. */
export async function callUntil(host: Page, done: (called: number[]) => boolean, called: number[] = []): Promise<number[]> {
  while (!done(called)) {
    if (called.length >= 90) throw new Error('90 numbers called and the condition never held');
    called.push(await call(host));
  }
  return called;
}
export const countOn = (numbers: number[], called: number[]) => numbers.filter((n) => called.includes(n)).length;

/** Opens the host's list of every ticket (TAM-056): menu → Tickets. */
export async function openHostTickets(host: Page) {
  await fromMenu(host, 'Tickets');
  await expect(host.getByTestId('host-ticket').first()).toBeVisible();
}

/** The game code the host shows (TAM-170): four characters, no look-alikes. */
export async function gameCodeOf(host: Page): Promise<string> {
  const text = ((await host.getByTestId('game-code').first().textContent()) ?? '').trim();
  const m = text.match(/[2-9A-HJKMNP-Z]{4}/);
  if (!m) throw new Error(`game-code reads "${text}", not a 4-character code`);
  return m[0];
}

/** A player's phone that has opened the app once (TAM-057), then scanned their tickets. Returns every grid, by ticket. */
export async function playerWith(browser: Browser, testInfo: TestInfo, handOuts: HandOut[], name: string, viewport = PORTRAIT) {
  const page = await newPhone(browser, testInfo, viewport);
  await page.goto(HOME);
  await scanAll(page, handOuts, name);
  const grids = new Map<number, (number | null)[][]>();
  for (const h of handOuts.filter((x) => x.player === name)) grids.set(h.ticket, await gridOf(phoneTicket(page, h.ticket).first()));
  return { page, grids, tickets: [...grids.keys()] };
}

/** "One at a time" and "All tickets" (TAM-191); tabs are role="tab" named "Ticket 3". */
export const oneAtATime = (player: Page) => player.getByRole('button', { name: 'One at a time', exact: true });
export const allTickets = (player: Page) => player.getByRole('button', { name: 'All tickets', exact: true });
export const ticketTab = (player: Page, n: number) => player.getByRole('tab', { name: `Ticket ${n}`, exact: true });

/** Quick mark (TAM-192): the 1–90 pad, its message line and the thumbnails of every ticket. */
export const quickMarkPad = (player: Page) => player.getByTestId('quick-mark-pad');
export const quickMarkMessage = (player: Page) => player.getByTestId('quick-mark-message');
export const thumbnail = (player: Page, n: number) => player.locator(`[data-testid="quick-mark-thumbnail"][data-ticket="${n}"]`);
export async function openQuickMark(player: Page) {
  await player.getByRole('button', { name: 'Quick mark', exact: true }).click();
  await expect(quickMarkPad(player)).toBeVisible();
}
export async function padTap(player: Page, n: number) {
  await quickMarkPad(player).getByRole('button', { name: String(n), exact: true }).click();
}

/** The "your marks fill a pattern" cue (TAM-195). */
export const patternCue = (player: Page) => player.getByTestId('pattern-cue');
/** Numbers of the cells with this attribute set to "true" in a scope: data-marked, data-cue or data-outlined. */
export async function cellsWith(scope: Locator, attr: 'data-marked' | 'data-cue' | 'data-outlined'): Promise<number[]> {
  return (await scope.locator(`[data-number][${attr}="true"]`).evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-number'))))).sort((a, b) => a - b);
}

/** The phone's prize list (TAM-170, TAM-196): "Prizes", one prize-item per prize in this game. */
export async function openPrizes(player: Page) {
  const list = player.getByTestId('prize-list');
  if (!(await list.isVisible())) await player.getByRole('button', { name: /^Prizes/ }).click();
  await expect(list).toBeVisible();
  return list;
}
export const prizeItem = (player: Page, prize: string) => player.getByTestId('prize-item').filter({ hasText: prize });

/** The player's menu (⋯, named "Menu") and its switch "Larger text" (TAM-121). */
export async function playerMenu(player: Page, item: string) {
  await player.getByRole('button', { name: /Menu/ }).click();
  const el = player.getByRole('menuitem', { name: item, exact: true })
    .or(player.getByRole('button', { name: item, exact: true }))
    .or(player.getByRole('checkbox', { name: item, exact: true }))
    .or(player.getByRole('switch', { name: item, exact: true })).first();
  await el.click();
}

/** Every visible cell of a scope: its box, for size and layout checks. */
export async function cellBoxes(scope: Locator) {
  return scope.locator('[data-cell]').evaluateAll((els) => els.map((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, number: e.getAttribute('data-number') };
  }));
}

/** The page does not scroll: its content fits the screen. */
export async function pageFits(page: Page) {
  return page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    return el.scrollHeight <= window.innerHeight + 1 && el.scrollWidth <= window.innerWidth + 1;
  });
}

/** A whole number 1–90 on none of these grids. */
export function notOn(grids: (number | null)[][][]): number {
  const own = new Set(grids.flatMap((g) => numbersOf(g)));
  for (let n = 1; n <= 90; n++) if (!own.has(n)) return n;
  throw new Error('every number is on these tickets');
}

export { HOME };

// ---------- Reading a drawn QR (owner decision 2026-09-30: jsQR is the scanning library) ----------

/**
 * Photographs a QR as it is drawn on screen (with a margin of the page around it), and reads it with jsQR, as a
 * camera would. Returns the text it holds, or null if it cannot be read. Decoding runs in a blank page of the same
 * browser, so nothing is added to the app's own page.
 */
export async function readDrawnQr(qr: Locator): Promise<string | null> {
  await qr.scrollIntoViewIfNeeded();
  const page = qr.page();
  const box = (await qr.boundingBox())!;
  const view = page.viewportSize()!;
  const pad = 16;
  const x = Math.max(0, box.x - pad), y = Math.max(0, box.y - pad);
  const clip = { x, y, width: Math.min(view.width, box.x + box.width + pad) - x, height: Math.min(view.height, box.y + box.height + pad) - y };
  const png = (await page.screenshot({ clip, animations: 'disabled' })).toString('base64');
  const reader = await page.context().newPage();
  try {
    await reader.addScriptTag({ path: fileURLToPath(new URL('../../node_modules/jsqr/dist/jsQR.js', import.meta.url)) });
    return await reader.evaluate(async (src) => {
      const img = new Image();
      img.src = `data:image/png;base64,${src}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = (window as any).jsQR(data.data, data.width, data.height);
      return found ? (found.data as string) : null;
    }, png);
  } finally {
    await reader.close();
  }
}
