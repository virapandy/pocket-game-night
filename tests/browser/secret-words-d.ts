// Secret Words, screen lane D (after the game): helpers for the lane D browser tests (scenarios v3.7, 23 October 2026).
// Screens G1 (game over), G2 (summary), D6 (End the game), D7 (Players sheet, with D7a and D7b), D8 (End for tonight),
// D9 (Delete tonight's games), E1 / E1a (History). Every text, role and test id comes from specs/secret-words/README.md
// (Terms, Canonical strings, the menu table, Test hooks) and the scenario each test names; the coder's note is
// specs/secret-words/screens-d.md.
//
// Most lane D tests do not play a game on screen: they save a game night on the phone (an engine SavedGame built with the
// rules, Test hooks item 1, exactly as the app stores it) and open the app on it. SWD-048: a reload returns to the last
// step, game over and the summary included. Tests that must pass through lane A's or lane B's screens are marked with
// `needsLanes` (expected to fail until those lanes are on the branch).
import { expect, type Locator, type Page } from '@playwright/test';
import { freshPhone, mainButton, session, textOf } from './impostor';
import { aheadOfSecretWordsScreens, menuButton, waitGuards, type Kind, type OracleBoard } from './secret-words';
import {
  bestClueFlows, cellsOfKind, CODES, codeStarting, EASY_CODES, exampleTeams, flows, newEvening, SwEvening, twentyTeams,
  type EveningOptions, type Team, type TeamsInput,
} from './secret-words-d-evenings';

/* eslint-disable @typescript-eslint/no-explicit-any */

export { bestClueFlows, cellsOfKind, CODES, codeStarting, EASY_CODES, exampleTeams, flows, newEvening, SwEvening, textOf, twentyTeams };
export type { EveningOptions, Team, TeamsInput };
type Evening = SwEvening;

/**
 * Marks a lane D test that has to pass through another lane's screens to get to its own (or to check what follows it):
 * expected to fail until those lanes are merged into the branch. As `aheadOfSecretWordsScreens` (PGN_IGNORE_AHEAD=1 runs
 * them unmarked); remove the call when Playwright says "expected to fail, but passed".
 */
export function needsLanes(lanes: 'A' | 'B' | 'A and B', what: string) {
  aheadOfSecretWordsScreens(`needs lane ${lanes}'s screens: ${what}`);
}

export const NAME: Record<Team, string> = { orange: 'Chai Champions', teal: 'Coffee Commandos' };
export const other = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');

/** The face-down cells of `team` on the board in play. */
export const left = (ev: Evening, team: Team) => ev.faceDown(team);

/** Cells turned over on the board in play, from the records since its deal (reveals, free words, broken rules). */
export function turnedOver(ev: Evening): Set<number> {
  const out = new Set<number>();
  for (const r of ev.records) {
    const m = r.move;
    if (m.type === 'deal' || m.type === 'dealNew') out.clear();
    if (m.type === 'reveal') { out.add(m.cell); if (typeof m.freeCell === 'number') out.add(m.freeCell); }
    if (m.type === 'brokeRule') out.add(m.cell);
  }
  return out;
}

const PHRASE: Record<Kind, string> = { orange: 'orange team', teal: 'teal team', nobody: 'blank word', landmine: 'the Landmine' };
/** SWD-051, 093: the accessible names of the whole map at game over (face-down cells: ", not found"). */
export function wholeMapNames(b: OracleBoard, turned: Set<number>): string[] {
  return b.words.map((w, i) => `${w}, ${PHRASE[b.kinds[i]!]}${turned.has(i) ? '' : ', not found'}`);
}

export const SW_SESSION = 'session-sw-lane-d';

/** The SavedGame the app stores for this evening (engine format 2), in the current session. */
export function savedOf(ev: SwEvening, o: { id?: string; status?: 'in-progress' | 'ended' } = {}): any {
  return ev.saved(o.status ?? 'in-progress', o.id ?? 'sw-lane-d', SW_SESSION);
}
export const lastAt = (saved: any): number => saved.records.at(-1)?.at ?? saved.createdAt;

export interface UiState { step: string; angles?: { orange: 0 | 180; teal: 0 | 180 }; paused?: boolean; pickerOverride?: string | null }

/**
 * Opens the app at `now` (default: a minute after the last move) on a phone holding these Secret Words evenings, their
 * session and, per evening id, the UI state `pgn.secretWords-ui.<id>` (SWD-048). This is a reload of the app.
 */
export async function phoneWithEvenings(page: Page, saved: any[], o: { now?: number; ui?: Record<string, UiState>; storage?: Record<string, unknown> } = {}) {
  const storage: Record<string, unknown> = { ...o.storage };
  for (const e of saved) {
    storage[`pgn.game.${e.id}`] = e;
    storage[`pgn.session.${e.sessionId}`] = session(e.sessionId, e.createdAt - 60_000);
  }
  for (const [id, ui] of Object.entries(o.ui ?? {})) {
    storage[`pgn.secretWords-ui.${id}`] = { angles: { orange: 0, teal: 0 }, paused: false, pickerOverride: null, ...ui };
  }
  const now = o.now ?? Math.max(...saved.map(lastAt)) + 60_000;
  await freshPhone(page, { time: now, storage });
}

/**
 * Opens the app on the evening and waits for `target` (a game over or summary part). SWD-048: a reload returns to the
 * step; if the app shows Home instead, Home's Secret Words row resumes it (SWD-062, 115).
 */
export async function openOn(page: Page, saved: any, target: Locator, o: { now?: number; ui?: UiState; storage?: Record<string, unknown> } = {}) {
  await phoneWithEvenings(page, [saved], { now: o.now, ui: o.ui ? { [saved.id]: o.ui } : undefined, storage: o.storage });
  await target.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => undefined);
  if (!(await target.first().isVisible())) {
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Secret Words/ });
    if (await row.count()) {
      await waitGuards(page);
      await row.getByText('Tap to resume').or(row.getByRole('button', { name: /Tap to resume/ })).first().click();
    }
  }
  await expect(target.first()).toBeVisible();
  await waitGuards(page);
}

/** Opens game over (G1) of an evening whose last game has ended. */
export async function openGameOver(page: Page, ev: Evening, o: { id?: string; now?: number; ui?: UiState; storage?: Record<string, unknown> } = {}) {
  const saved = savedOf(ev, { id: o.id });
  await openOn(page, saved, gameHeading(page), o);
  return saved;
}

// ---- G1, G2 parts (Test hooks item 4) ----
export const gameHeading = (page: Page) => page.getByTestId('game-heading');
export const resultLine = (page: Page) => page.getByTestId('result-line');
export const nearMiss = (page: Page) => page.getByTestId('near-miss');
export const bestClue = (page: Page) => page.getByTestId('best-clue');
export const tally = (page: Page) => page.getByTestId('tally');
export const nextClueGivers = (page: Page) => page.getByTestId('next-clue-givers');
export const teamBar = (page: Page) => page.getByTestId('team-bar');
export const undoToast = (page: Page) => page.getByTestId('undo-toast');
export const toast = (page: Page) => page.getByTestId('toast');
export const summaryHeading = (page: Page) => page.getByRole('heading', { name: "Tonight's Secret Words", exact: true });
export const summaryLine = (page: Page) => page.getByTestId('summary-line');
export const clueCredit = (page: Page) => page.getByTestId('clue-credit');
export const boardCells = (page: Page) => page.getByTestId('word-board').getByTestId('board-cell');
export const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name, exact: typeof name === 'string' });
export const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });
export const playAgain = (page: Page) => mainButton(page).filter({ hasText: /^Play again$/ });
export const endForTonight = (page: Page) => button(page, 'End for tonight');
export const homeButton = (page: Page) => button(page, '← Home');
export const home = (page: Page) => page.getByRole('button', { name: /^Host a game/ });

/** Accessible names of the board's cells, in `data-index` order. */
export async function cellNames(page: Page): Promise<string[]> {
  const out = await boardCells(page).evaluateAll((els) => els.map((el) => ({
    i: Number(el.getAttribute('data-index')), name: el.getAttribute('aria-label') ?? (el.textContent ?? '').trim(),
  })));
  return out.sort((a, b) => a.i - b.i).map((c) => c.name);
}

/** The colour a CSS colour expression resolves to inside the board (so its custom properties apply). */
export async function resolvedColour(page: Page, expr: string, within = '[data-testid="word-board"]'): Promise<string> {
  return page.evaluate(([expr, within]) => {
    const host = document.querySelector(within) ?? document.body;
    const probe = document.createElement('div');
    probe.style.backgroundColor = expr;
    host.appendChild(probe);
    const c = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return c;
  }, [expr, within] as const);
}

// ---- Saved data ----

/** Every Secret Words evening saved on this phone. */
export async function savedEvenings(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const out: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('pgn.game.')) continue;
      try { const g = JSON.parse(localStorage.getItem(k)!); if (g?.gameType === 'secret-words') out.push(g); } catch { /* not ours */ }
    }
    return out;
  });
}
/** The saved evening with this id (null when deleted). */
export async function savedById(page: Page, id: string): Promise<any | null> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), `pgn.game.${id}`);
}
/** The moves of the evening with this id, oldest first. */
export async function movesOf(page: Page, id: string): Promise<any[]> {
  const e = await savedById(page, id);
  return (e?.records ?? []).map((r: any) => r.move);
}
/** The moves recorded after the first `n`. */
export async function movesAfter(page: Page, id: string, n: number): Promise<any[]> {
  return (await movesOf(page, id)).slice(n);
}

// ---- Menus, app visibility ----

/** Every item of the open game menu, in screen order, with the separators as '|'. Opens and closes the menu. */
export async function menuItems(page: Page): Promise<string[]> {
  await waitGuards(page);
  await menuButton(page).click();
  const menu = page.getByRole('menu').first();
  await expect(menu).toBeVisible();
  const out = await menu.evaluate((m) => [...m.querySelectorAll('[role="menuitem"], [role="separator"]')]
    .map((el) => (el.getAttribute('role') === 'separator' ? '|' : (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim())));
  const done = page.getByRole('button', { name: 'Done', exact: true }).filter({ visible: true });
  if (await done.count()) await done.last().click();
  else await page.keyboard.press('Escape');
  await expect(page.getByRole('menuitem')).toHaveCount(0);
  return out;
}
export async function fromMenu(page: Page, item: string) {
  await waitGuards(page);
  await menuButton(page).click();
  await page.getByRole('menuitem', { name: item, exact: true }).click();
  await waitGuards(page);
}

/** The app goes to the background (visibilitychange to hidden), then comes back. */
export async function hideAndShowApp(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
  });
  await page.clock.runFor(100);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
  });
  await page.clock.runFor(100);
}

/** Records every screen-on lock request and release (as Impostor's wake lock tests). */
export async function watchWakeLock(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__wake = [];
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: (t: string) => {
          w.__wake.push(`request ${t}`);
          const l: any = { released: false, type: t, addEventListener() {}, removeEventListener() {}, release() { if (!l.released) { w.__wake.push('release'); l.released = true; } return Promise.resolve(); } };
          return Promise.resolve(l);
        },
      },
    });
  });
}
/** Locks requested minus locks released (0 = no screen-on lock held). */
export const heldLocks = (page: Page): Promise<number> => page.evaluate(() => {
  const log: string[] = (window as any).__wake ?? [];
  return log.filter((x) => x.startsWith('request')).length - log.filter((x) => x === 'release').length;
});

/** Box of a locator (throws when it is not on screen). */
export async function box(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('not on screen');
  return b;
}
