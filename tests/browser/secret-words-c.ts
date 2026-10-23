// Secret Words screen lane C (the map phone, M1 to M3) browser helpers. Names, texts and test ids come from
// specs/secret-words/ (scenarios v3.7, 23 October 2026): README.md (Terms, Canonical strings, Test hooks) and 03-map.md,
// 07-sessions.md. What the screens need: specs/secret-words/screens-c.md. Shared pieces (board grid, word-zoom, team bar,
// where-line) are lane B's and are found by lane B's test ids (specs/secret-words/screens-b.md on lane-b).
import { expect, type Locator, type Page } from '@playwright/test';
import { freezeClock, freshPhone, T0 } from './impostor';
import { kindOf, shown, waitGuards } from './secret-words';
import { codeParts, oracleBoard, oracleCode, lastN, TEAM_PAIRS, type Kind } from '../games/secret-words/oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** The scenarios' example code and pair (SWD-117: `#map=27P3QX8&t=SWDT-01`). */
export const CODE = '27P3QX8';
export const PAIR = TEAM_PAIRS[0]!;
export { shown, T0 };

/** The five screen sizes (Terms). */
export const SIZES = [
  { width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 },
  { width: 812, height: 375 }, { width: 568, height: 320 },
] as const;

/** SWD-039: the code "Next map" opens (deal index n + 1 of the same deck and config), or null after the last valid n. */
export function nextCode(code: string): string | null {
  const p = codeParts(code);
  if (p.n + 1 > lastN(p.board, p.words, p.edition)) return null;
  return oracleCode({ edition: p.edition, board: p.board, words: p.words }, p.d, p.n + 1);
}

/** A Full / Easy Whole-family code with deck seed d and deal index n. */
export const fullCode = (d: number, n: number) => oracleCode({ edition: 1, board: 'full', words: 'family' }, d, n);
export const easyCode = (d: number, n: number) => oracleCode({ edition: 1, board: 'easy', words: 'family' }, d, n);

export interface MapLink { code?: string; t?: string; p?: 'own' }
/** The QR's link hash (SWD-033, 117): `#map=<code>&t=<pair id>` plus `&p=own` with three phones. */
export function mapHash(o: MapLink = {}): string {
  return `#map=${o.code ?? CODE}${o.t ? `&t=${o.t}` : ''}${o.p ? `&p=${o.p}` : ''}`;
}

/**
 * Stands in for the screen-on lock (wake lock) before the app loads: every `request(type)` and `release()` is logged in
 * `window.__wake` ("request screen" / "release"), as Impostor's tests do.
 */
export async function fakeWakeLock(page: Page) {
  await page.addInitScript(() => {
    const w = window as any; w.__wake = [];
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: (t: string) => {
          w.__wake.push(`request ${t}`);
          const l: any = { released: false, type: t, onrelease: null, addEventListener() {}, removeEventListener() {},
            release() { if (!l.released) { w.__wake.push('release'); l.released = true; } return Promise.resolve(); } };
          return Promise.resolve(l);
        },
      },
    });
  });
}
export const wakeLog = (page: Page): Promise<string[]> => page.evaluate(() => (window as any).__wake ?? []);
/** True when the last screen-on lock asked for is still held (a "request screen" after the last "release"). */
export async function lockHeld(page: Page): Promise<boolean> {
  const log = await wakeLog(page);
  return log.lastIndexOf('request screen') > log.lastIndexOf('release');
}

export interface OpenOptions extends MapLink {
  /** Storage before the app loads (for example a saved map, `pgn.pref.largerText`). */
  storage?: Record<string, unknown>;
  time?: number;
  larger?: boolean;
  /** Pause the app's clock before the map opens (SWD-121's timings to the 100 ms). */
  frozen?: boolean;
}

/**
 * A fresh phone (no game night) opened at the map link, as the phone's camera opens the host's QR (SWD-117). Ends on the
 * map phone. Going through about:blank makes the hash a fresh page load, as a scanned link is.
 */
export async function openMapPhone(page: Page, o: OpenOptions = {}) {
  const storage = { ...(o.storage ?? {}) };
  if (o.larger) storage['pgn.pref.largerText'] = true;
  await freshPhone(page, { time: o.time ?? T0, storage });
  if (o.frozen) await freezeClock(page);
  await page.goto('about:blank');
  await page.goto(`./${mapHash(o)}`);
  await expect(mapHeading(page)).toBeVisible();
}

/** Opens another link on the same phone (a second scan), keeping its storage. */
export async function openLinkAgain(page: Page, o: MapLink = {}) {
  await page.goto('about:blank');
  await page.goto(`./${mapHash(o)}`);
  await expect(mapHeading(page)).toBeVisible();
}

export const mapHeading = (page: Page) => page.getByRole('heading', { name: 'Secret Words map', exact: true });
export const mapGrid = (page: Page) => page.getByTestId('map-grid');
export const mapCells = (page: Page) => page.getByTestId('map-grid').getByTestId('map-cell');
export const mapCell = (page: Page, i: number) => page.locator(`[data-testid="map-grid"] [data-testid="map-cell"][data-index="${i}"]`);
export const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
export const hideMap = (page: Page) => button(page, 'Hide map');
export const showMap = (page: Page) => button(page, 'Show map');
export const listButton = (page: Page, which: 'orange' | 'teal' | 'whole') =>
  button(page, which === 'orange' ? "Orange team's words" : which === 'teal' ? "Teal team's words" : 'Whole map');
export const toast = (page: Page) => page.getByTestId('toast');
export const dialogNamed = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });

/** The saved map (`pgn.secretWords.map`, SWD-036), or null. */
export const savedMap = (page: Page): Promise<any> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('pgn.secretWords.map') ?? 'null'));
/** The code of a saved map without its hyphen (the shape allows either). */
export const bare = (code: string) => String(code).replace('-', '');

/** Words, accessible names and kinds of the map cells, in `data-index` order. */
export async function mapCellsOf(page: Page) {
  const out = await mapCells(page).evaluateAll((els) => els.map((el) => ({
    index: Number(el.getAttribute('data-index')),
    word: (el.textContent ?? '').trim(),
    name: el.getAttribute('aria-label') ?? (el.textContent ?? '').trim(),
  })));
  return out.sort((a, b) => a.index - b.index).map((c) => ({ ...c, kind: kindOf(c.name.replace(/, found$/, '')) as Kind | 'face down' | null }));
}

/**
 * Anything in the page that tells a word's kind (SWD-025, 031, 032, 121): the map's own parts, a cell's accessible name
 * with a kind, a list heading, a "Never guess" line. Returns what was found (empty = the page holds no map).
 */
export async function mapInPage(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = [];
    for (const id of ['map-grid', 'map-cell', 'map-list', 'our-words', 'avoid-line']) {
      if (document.querySelector(`[data-testid="${id}"]`)) found.push(`test id ${id}`);
    }
    for (const el of document.querySelectorAll('[aria-label]')) {
      const l = el.getAttribute('aria-label')!;
      if (/, (orange team|teal team|blank word|nobody's word|the Landmine)\b/.test(l)) found.push(`accessible name "${l}"`);
    }
    const html = document.documentElement.outerHTML.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    for (const t of ['Orange words (', 'Teal words (', 'Never guess:']) if (html.includes(t)) found.push(`text "${t}"`);
    return found;
  });
}

/**
 * Hides the app (`visibilitychange` to hidden) and, in the same task, reports whether the map is still in the page and
 * whether `privacy-cover` is there (SWD-032: "a full-screen privacy-cover appears and the map is removed in the same task").
 */
export async function hideAppAndLook(page: Page): Promise<{ mapParts: number; cover: boolean }> {
  return page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    return {
      mapParts: document.querySelectorAll('[data-testid="map-grid"], [data-testid="map-cell"], [data-testid="map-list"], [data-testid="avoid-line"]').length,
      cover: !!document.querySelector('[data-testid="privacy-cover"]'),
    };
  });
}
/** Brings the app back (`visibilitychange` to visible). */
export async function showApp(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/** The box of a locator (page coordinates of the current scroll). */
export async function box(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('not on screen');
  return b;
}

/** Font size (px) and line count of the element holding a locator's first text. */
export async function textMetrics(l: Locator) {
  return l.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => ((n.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const node = walker.nextNode();
    if (!node) return { size: 0, lines: 0, weight: '', decoration: '', opacity: 1 };
    const holder = node.parentElement!;
    const range = document.createRange();
    range.selectNodeContents(node);
    const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
    const cs = getComputedStyle(holder);
    let opacity = 1;
    for (let e: Element | null = holder; e && e !== el.parentElement; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity);
    return { size: parseFloat(cs.fontSize), lines: tops.size, weight: cs.fontWeight, decoration: cs.textDecorationLine, opacity };
  });
}

/** Pointer taps at the centre of a locator (a real pointerdown/up, as a finger), without Playwright's actionability wait. */
export async function tapAt(page: Page, l: Locator) {
  const b = await box(l);
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}

export { waitGuards, oracleBoard };
