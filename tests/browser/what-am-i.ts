// What Am I? browser helpers (scenarios version 1.3, approved 24 October 2026; specs/what-am-i/, hooks in
// specs/what-am-i/api.md). Every name, text and test id comes from the scenarios (Canonical strings and the Version 1.1 to
// 1.3 items, which win over older strings). Words and their order come from the scenarios' own algorithm
// (tests/games/what-am-i/oracle.ts), so a test knows each word T3 will show for a seed (WAI-H1b).
//
// Ahead of the build: `openApp` opens the app and looks for the browser hooks (`window.__waiTest`). While they are not
// there, the test is marked expected-to-fail and stops at once with "What Am I? is not built yet", so these tests cost
// about a second each in other runs and never turn them red. Once the screens and hooks exist they run normally.
// PGN_IGNORE_AHEAD=1 runs them unmarked.
import { expect, test as pwTest, type Locator, type Page } from '@playwright/test';
import { hostAGame } from './helpers';
import { freezeClock, freshPhone } from './impostor';
import { NAMES, WORDS, byId, eligible, startQueue, textOf, type PackChoice, type WaiWord } from '../games/what-am-i/oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */

export { NAMES, WORDS, byId, eligible, startQueue, textOf, type PackChoice, type WaiWord };
export const TZ = 'Asia/Kolkata';
/** Saturday 24 October 2026, 8:05 pm in India (the scenarios' "8:05 pm"). */
export const NIGHT = Date.UTC(2026, 9, 24, 14, 35, 0);
export const SIZES = [
  { width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 812, height: 375 }, { width: 568, height: 320 },
];
export const SIDEWAYS = { width: 812, height: 375 };
export const UPRIGHT = { width: 390, height: 844 };

// ---- Opening the app with the hooks (WAI-H1b to H11) ----

export interface PhoneOptions {
  time?: number;
  viewport?: { width: number; height: number };
  larger?: boolean;
  storage?: Record<string, unknown>;
  /** WAI-H4: DeviceOrientationEvent.requestPermission. */
  permission?: 'absent' | 'granted' | 'refused' | 'throws';
  /** WAI-H6: navigator.wakeLock. */
  wakeLock?: 'granted' | 'refused' | 'missing';
  /** WAI-H3: what screen.orientation.type says (changeable later with `setOrientationType`). */
  orientationType?: string;
  /** WAI-H5. */
  platform?: 'iphone' | 'android';
  /** WAI-H1b and WAI-H7 for the next game night started on this page. */
  seed?: string;
  words?: WaiWord[];
  /** Keep Playwright's clock running with real time (default: frozen; the test moves it with `page.clock.runFor`). */
  running?: boolean;
}

/**
 * A fresh phone at `time` with the What Am I? hooks; ends on Home with the clock frozen. Ahead of the build (no
 * `window.__waiTest`), marks the test expected-to-fail and throws "What Am I? is not built yet".
 */
export async function openApp(page: Page, o: PhoneOptions = {}) {
  if (o.viewport) await page.setViewportSize(o.viewport);
  await page.addInitScript((o: any) => {
    const w = window as any;
    w.__perm = []; w.__wake = [];
    const D = w.DeviceOrientationEvent;
    if (D) {
      if (o.permission === 'absent' || !o.permission) { try { delete D.requestPermission; } catch { /* none */ } }
      else D.requestPermission = () => {
        w.__perm.push(Date.now());
        if (o.permission === 'throws') return Promise.reject(new Error('NotAllowedError'));
        return Promise.resolve(o.permission === 'granted' ? 'granted' : 'denied');
      };
    }
    if (o.wakeLock === 'missing') { try { Object.defineProperty(navigator, 'wakeLock', { value: undefined, configurable: true }); } catch { /* none */ } }
    else {
      const lock = {
        request: (type: string) => {
          w.__wake.push({ t: Date.now(), kind: 'request', type });
          if (o.wakeLock === 'refused') return Promise.reject(new DOMException('refused', 'NotAllowedError'));
          const sentinel: any = new EventTarget();
          sentinel.released = false; sentinel.type = type;
          sentinel.release = () => { if (!sentinel.released) { sentinel.released = true; w.__wake.push({ t: Date.now(), kind: 'release' }); } return Promise.resolve(); };
          return Promise.resolve(sentinel);
        },
      };
      Object.defineProperty(navigator, 'wakeLock', { value: lock, configurable: true });
    }
    w.__orientType = o.orientationType ?? null;
    const SO = w.ScreenOrientation?.prototype;
    const real = SO && Object.getOwnPropertyDescriptor(SO, 'type');
    if (SO && real?.get) {
      Object.defineProperty(SO, 'type', { configurable: true, get(this: any) { return w.__orientType ?? real.get!.call(this); } });
    }
    w.__hidden = false;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (w.__hidden ? 'hidden' : 'visible') });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => w.__hidden });
  }, { permission: o.permission, wakeLock: o.wakeLock, orientationType: o.orientationType });
  await freshPhone(page, { time: o.time ?? NIGHT, storage: { ...(o.larger ? { 'pgn.pref.largerText': true } : {}), ...o.storage } });
  const hooks = await page.waitForFunction(() => !!(window as any).__waiTest, null, { timeout: 1500 }).then(() => true, () => false);
  if (!hooks) {
    if (!process.env.PGN_IGNORE_AHEAD) pwTest.fail(true, 'What Am I? is not built yet (window.__waiTest missing): written before the build');
    throw new Error('What Am I? is not built yet: window.__waiTest (WAI-H1b) is missing');
  }
  await page.evaluate((o: any) => {
    const t = (window as any).__waiTest;
    if (o.seed) t.setSeed(o.seed);
    if (o.words) t.setWords(o.words);
    if (o.platform) t.setPlatform(o.platform);
  }, { seed: o.seed, words: o.words, platform: o.platform });
  if (!o.running) await freezeClock(page);
}

export async function setOrientationType(page: Page, type: string) { await page.evaluate((t) => { (window as any).__orientType = t; }, type); }
export async function now(page: Page): Promise<number> { return page.evaluate(() => Date.now()); }
/** WAI-H8: the sound and vibration log. */
export async function soundLog(page: Page): Promise<{ t: number; kind: string; name?: string; pattern?: number[] }[]> {
  return page.evaluate(() => (window as any).__waiTest.log.slice());
}
export async function wakeLog(page: Page): Promise<{ t: number; kind: string }[]> { return page.evaluate(() => (window as any).__wake.slice()); }
export async function permissionCalls(page: Page): Promise<number[]> { return page.evaluate(() => (window as any).__perm.slice()); }
/**
 * Scrolls the page and every scrollable box on it by `dy` px. Playwright's mobile WebKit has no `mouse.wheel`, so
 * the scroll is set directly there; Chromium also gets the wheel, as before.
 */
export async function scrollBy(page: Page, dy: number) {
  await page.evaluate((dy) => {
    window.scrollBy(0, dy);
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) el.scrollTop += dy;
    }
  }, dy);
  if (page.context().browser()?.browserType().name() !== 'webkit') await page.mouse.wheel(0, dy);
}
/** WAI-H9: the app hidden or shown again. */
export async function setHidden(page: Page, hidden: boolean) {
  await page.evaluate((h) => { (window as any).__hidden = h; document.dispatchEvent(new Event('visibilitychange')); }, hidden);
}

// ---- Locators ----

export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { name, ...(typeof name === 'string' ? { exact: true } : {}) });
export const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name, ...(typeof name === 'string' ? { exact: true } : {}) });
export const mainButton = (page: Page) => page.getByTestId('main-button');
export const dialog = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
export const radio = (page: Page, name: string | RegExp) => page.getByRole('radio', { name, ...(typeof name === 'string' ? { exact: true } : {}) });
export const switchNamed = (page: Page, name: string) => page.getByRole('switch', { name, exact: true });
export const text = (page: Page, t: string) => page.getByText(t, { exact: true });
export const theWord = (page: Page) => page.getByTestId('the-word');
export const timeLeft = (page: Page) => page.getByTestId('time-left');
export const flash = (page: Page) => page.getByTestId('mark-flash');
export const tipLine = (page: Page) => page.getByTestId('tip-line');
export const whereLine = (page: Page) => page.getByTestId('where-line');
export const toast = (page: Page) => page.getByTestId('undo-toast');
export const scoreboard = (page: Page) => page.getByTestId('scoreboard');
export const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
export const menuItem = (page: Page, name: string) => page.getByRole('menuitem', { name, exact: true });
export const pauseButton = (page: Page) => page.getByRole('button', { name: 'Pause', exact: true });
export const playerField = (page: Page) => page.getByLabel('Player name', { exact: true });
export const card = (page: Page) => page.getByRole('button', { name: /^What Am I\?/ }).and(page.locator(':not([data-testid="unfinished-games"] *)'));

/** The rows of the scoreboard list as text ("Arjun 7 (1 turn)"). */
export async function boardRows(page: Page): Promise<string[]> {
  return scoreboard(page).getByRole('listitem').evaluateAll((els) => els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()));
}
/** The word chips under an h2 on T4 ("Got it" or "Passed"), as their button names. */
export function listChips(page: Page, h2: 'Got it' | 'Passed'): Locator {
  return page.getByRole('region', { name: h2, exact: true }).getByRole('button');
}
export async function chipNames(page: Page, h2: 'Got it' | 'Passed'): Promise<string[]> {
  return listChips(page, h2).evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').replace(/\s+/g, ' ').trim()));
}

// ---- Guards and taps (Terms: Guard, 800 ms; 1000 ms for the start buttons) ----

export async function guards(page: Page) { await page.clock.runFor(1100); }
export async function tap(page: Page, target: Locator) { await guards(page); await target.click(); }

// ---- Saved game nights (pgn.game.*) ----

export async function savedNights(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const out: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('pgn.game.')) continue;
      try { const g = JSON.parse(localStorage.getItem(k)!); if (g?.gameType === 'what-am-i') out.push(g); } catch { /* not ours */ }
    }
    return out;
  });
}
export async function onlyNight(page: Page): Promise<any> {
  const all = await savedNights(page);
  expect(all.length, 'one saved What Am I? game night').toBe(1);
  return all[0];
}
export async function moves(page: Page): Promise<any[]> { return (await onlyNight(page)).records.map((r: any) => r.move); }

// ---- Setup screens ----

export async function toPicker(page: Page) {
  await tap(page, hostAGame(page));
  await expect(heading(page, 'What shall we play?')).toBeVisible();
}
export async function addNames(page: Page, names: string[]) {
  for (const n of names) {
    await playerField(page).fill(n);
    await button(page, 'Add').click();
  }
}
export interface NightOptions extends PhoneOptions {
  players?: string[];
  pack?: PackChoice;
  time?: number;
  turnTime?: 30 | 60 | 90;
  hold?: 'hand' | 'free';
  nonveg?: boolean;
  sounds?: boolean;
  /** Stop on "Words and time" (S2) instead of starting. */
  stopAt?: 'S1' | 'S2' | 'S3';
}
export const packLabel = (pack: PackChoice, nonveg = false) =>
  `${pack === 'mix' ? 'Mix of all' : pack} · ${eligible(WORDS, pack, nonveg).length} words`;

/** Home → picker → Who's playing? (names) → Words and time (choices) → Read this aloud → First turn: ends on T1. */
export async function startNight(page: Page, o: NightOptions = {}) {
  await openApp(page, o);
  await toPicker(page);
  await tap(page, card(page));
  await expect(heading(page, "Who's playing?")).toBeVisible();
  await addNames(page, o.players ?? NAMES);
  if (o.stopAt === 'S1') return;
  await tap(page, mainButton(page));
  await expect(heading(page, 'Words and time')).toBeVisible();
  await chooseOnS2(page, o);
  if (o.stopAt === 'S2') return;
  await tap(page, mainButton(page)); // "Start with these words"
  await expect(heading(page, 'Read this aloud')).toBeVisible();
  if (o.stopAt === 'S3') return;
  await tap(page, mainButton(page)); // "First turn"
  await expect(heading(page, `${(o.players ?? NAMES)[0]}, you're guessing`)).toBeVisible();
}
export async function chooseOnS2(page: Page, o: NightOptions) {
  if (o.turnTime) await radio(page, `${o.turnTime} s`).click();
  if (o.hold) await radio(page, o.hold === 'hand' ? "In the guesser's hand" : 'Hands-free').click();
  if (o.nonveg !== undefined) await setSwitch(page, 'Include non-veg food (chicken, fish, egg)', o.nonveg);
  if (o.sounds !== undefined) await setSwitch(page, 'Sounds', o.sounds);
  if (o.pack) await radio(page, packLabel(o.pack, o.nonveg ?? false)).click();
}
export async function setSwitch(page: Page, name: string, on: boolean) {
  const s = switchNamed(page, name);
  if ((await s.getAttribute('aria-checked')) !== String(on)) await s.click();
  await expect(s).toHaveAttribute('aria-checked', String(on));
}

// ---- A turn ----

/** "I'm Riya: start" / "Start Riya's turn" after its 1000 ms guard. Returns the time of the tap (T2's t = 0). */
export async function startTurn(page: Page): Promise<number> {
  await guards(page);
  const t = await now(page);
  await mainButton(page).click();
  return t;
}
/** From T1: start, the 3 s countdown; ends with T3's first word showing. Returns T3's t = 0 (absolute ms). */
export async function toWord(page: Page): Promise<number> {
  const t2 = await startTurn(page);
  await page.clock.runFor(3000);
  await expect(theWord(page)).toBeVisible();
  return t2 + 3000;
}
/** The point in a marking area to tap (Version 1.1 item 13): the middle of the top or bottom area as displayed. */
export async function areaPoint(page: Page, area: 'top' | 'bottom'): Promise<{ x: number; y: number }> {
  const v = page.viewportSize()!;
  return { x: v.width / 2, y: area === 'top' ? v.height * 0.3 : v.height * 0.8 };
}
export async function tapAt(page: Page, x: number, y: number) { await page.mouse.click(x, y); }
/** One mark by tap: waits out the 800 ms guard, taps, waits the 600 ms flash. */
export async function tapMark(page: Page, area: 'top' | 'bottom') {
  await page.clock.runFor(800);
  const p = await areaPoint(page, area);
  await tapAt(page, p.x, p.y);
  await page.clock.runFor(600);
}
/** The word on T3 as the DOM holds it (word text as in the list; CAPITALS only by CSS). */
export async function shownWord(page: Page): Promise<string> { return ((await theWord(page).textContent()) ?? '').replace(/\s+/g, ' ').trim(); }
/** Taps marks ('G' bottom, 'P' top) and returns the words they marked. */
export async function marks(page: Page, seq: string): Promise<string[]> {
  const out: string[] = [];
  for (const m of seq) { out.push(await shownWord(page)); await tapMark(page, m === 'G' ? 'bottom' : 'top'); }
  return out;
}
/** Runs the turn clock to time up from T3's t = 0 (`t3`), turn time `T` seconds. */
export async function runToTimeUp(page: Page, t3: number, T: number) {
  const left = t3 + T * 1000 - (await now(page));
  if (left > 0) await page.clock.runFor(left);
  await expect(heading(page, /^Time's up!|^Turn ended early\./)).toBeVisible();
}
/** A whole turn from T1 by taps, then time up (30 s turns unless said); ends on T4. */
export async function playTurn(page: Page, seq: string, T = 30): Promise<string[]> {
  const t3 = await toWord(page);
  const ws = await marks(page, seq);
  await runToTimeUp(page, t3, T);
  return ws;
}
/** T4 "Save score" → T1 or R1. */
export async function saveScore(page: Page) { await tap(page, mainButton(page)); }

// ---- Orientation (WAI-H3) ----

/** β and γ for a pitch θ (Version 1.1 item 8: θ = asin(cos β · cos γ)). */
export function betaFor(theta: number, gamma = 0): number {
  const c = Math.sin((theta * Math.PI) / 180) / Math.cos((gamma * Math.PI) / 180);
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}
export interface Orient { t: number; theta?: number; gamma?: number; beta?: number }
/**
 * Schedules `deviceorientation` events inside the page at absolute app times (Playwright's clock runs the page's
 * timers), so each event arrives exactly at its time while the test then runs the clock on.
 */
export async function scheduleOrientation(page: Page, events: Orient[]) {
  const base = await now(page);
  const list = events.map((e) => ({ d: e.t - base, beta: e.beta ?? betaFor(e.theta ?? 0, e.gamma ?? 0), gamma: e.gamma ?? 0 }));
  await page.evaluate((list) => {
    // Playwright's WebKit throws "Illegal constructor" for `new DeviceOrientationEvent` under its clock: there the
    // event is a plain Event with the same type, prototype and alpha, beta, gamma and absolute fields.
    const orientationEvent = (beta: number, gamma: number): Event => {
      const init = { alpha: 0, beta, gamma, absolute: false };
      try { return new DeviceOrientationEvent('deviceorientation', init); } catch { /* WebKit */ }
      const ev = new Event('deviceorientation');
      const D = (window as any).DeviceOrientationEvent;
      if (D?.prototype) Object.setPrototypeOf(ev, D.prototype);
      for (const [k, v] of Object.entries(init)) Object.defineProperty(ev, k, { value: v, enumerable: true });
      return ev;
    };
    for (const e of list) {
      setTimeout(() => window.dispatchEvent(orientationEvent(e.beta, e.gamma)), Math.max(0, e.d));
    }
  }, list);
}
/** Events every 16 ms from `from` (inclusive) to `to` (exclusive), θ from `theta(t)`. */
export function every16(from: number, to: number, theta: (t: number) => number, gamma = 0): Orient[] {
  const out: Orient[] = [];
  for (let t = from; t < to; t += 16) out.push({ t, theta: theta(t), gamma });
  return out;
}

// ---- Through the menu ----

export async function fromMenu(page: Page, item: string) {
  await guards(page);
  await menuButton(page).click();
  await menuItem(page, item).click();
}
export async function menuItems(page: Page): Promise<{ name: string; disabled: boolean }[]> {
  await guards(page);
  await menuButton(page).click();
  return page.getByRole('menuitem').evaluateAll((els) => els.map((e) => ({
    name: (e.getAttribute('aria-label') ?? e.textContent ?? '').replace(/\s+/g, ' ').trim().replace(/After this turn$/, '').trim(),
    disabled: e.getAttribute('aria-disabled') === 'true' || (e as HTMLButtonElement).disabled === true,
  })));
}

// ---- Measuring ----

export async function box(l: Locator) {
  const b = await l.boundingBox();
  expect(b, 'on screen').not.toBeNull();
  return b!;
}
export async function noSidewaysScroll(page: Page, where: string) {
  const w = await page.evaluate(() => ({ s: document.scrollingElement!.scrollWidth, i: window.innerWidth }));
  expect(w.s, `${where}: no sideways scrolling`).toBeLessThanOrEqual(w.i);
}
/** Every visible text on the page (WAI-082's search). */
export async function screenText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText + ' ' + Array.from(document.querySelectorAll('[aria-label]')).map((e) => e.getAttribute('aria-label')).join(' '));
}
/** The queue for a seed and choices, as word texts (first game, nothing shown yet). */
export function firstWords(seed: string, pack: PackChoice, nonveg = false, list: readonly WaiWord[] = WORDS): string[] {
  const q = startQueue(list, seed, 1, pack, nonveg);
  return [...q.unshown, ...q.shown].map((id) => textOf(id, list));
}
