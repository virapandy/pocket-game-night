// Secret Words, screen lane B (the turn on the host): helpers for the lane B browser tests (scenarios v3.7, 23 October 2026).
// Every text, role and test id comes from specs/secret-words/README.md (Terms, Canonical strings, the menu table, Test hooks)
// and the scenario named in each test. Which team a player is on, and who gives clues, are read from the saved evening's
// setup (Test hooks item 1: SetupInput `config.teams`), never guessed; boards come from the scenarios' own algorithm
// (oracle.ts) through `pgn.test.seeds` (Test hooks item 2).
//
// Lane B's screens are reached through lane A's setup screens (`hostEvening`, secret-words.ts): until lane A is merged
// these tests stop on the picker. See specs/secret-words/screens-b.md.
import { expect, type Locator, type Page } from '@playwright/test';
import { freshPhone, mainButton } from './impostor';
import { hostAGame } from './helpers';
import {
  boardCells, giveClue, menuButton, NAMES, oracleBoard, scanHeading, tapMain, waitGuards, type HostOptions, type Kind, type OracleBoard,
} from './secret-words';
import { oracleCode } from '../games/secret-words/oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Team = 'orange' | 'teal';
export const other = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');
export const colour = (t: Team) => (t === 'orange' ? 'orange' : 'teal');

/** A Full Whole-family code (edition 1) for deck `d`, deal `n`. */
export const fullCode = (d: number, n = 0) => oracleCode({ edition: 1, board: 'full', words: 'family' }, d, n);
export const easyCode = (d: number, n = 0) => oracleCode({ edition: 1, board: 'easy', words: 'family' }, d, n);

/** Cell indexes of a kind on the board, in cell order. */
export const indexesOf = (b: OracleBoard, kind: Kind) => b.kinds.map((k, i) => (k === kind ? i : -1)).filter((i) => i >= 0);

/** A board cell (board screens) by `data-index`. */
export const cellAt = (page: Page, i: number) => page.locator(`[data-testid="word-board"] [data-index="${i}"]`);
/** A private-map cell by `data-index`. */
export const mapCellAt = (page: Page, i: number) => page.locator(`[data-testid="map-grid"] [data-index="${i}"]`);

export const byId = (page: Page, id: string) => page.getByTestId(id);
export const pauseButton = (page: Page) => page.getByTestId('pause-button');
export const whereLine = (page: Page) => page.getByTestId('where-line');
export const resultLine = (page: Page) => page.getByTestId('result-line');
export const turnLine = (page: Page) => page.getByTestId('turn-line');
export const turnHeading = (page: Page) => page.getByTestId('turn-heading');
export const holdPad = (page: Page) => page.getByTestId('hold-pad');
export const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
export const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });
export const announcer = (page: Page) => page.getByTestId('announcer');

/** Every Secret Words evening saved on this phone, newest first. */
export async function evenings(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const out: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('pgn.game.')) continue;
      try { const g = JSON.parse(localStorage.getItem(k)!); if (g?.gameType === 'secret-words') out.push(g); } catch { /* not ours */ }
    }
    return out.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  });
}
/** The evening in progress (the newest). */
export async function evening(page: Page): Promise<any> {
  const all = await evenings(page);
  expect(all.length, 'a saved Secret Words evening (created at its first deal)').toBeGreaterThan(0);
  return all[0];
}
/** The moves recorded so far, oldest first. */
export async function moves(page: Page): Promise<any[]> {
  const all = await evenings(page);
  return all.length ? (all[0].records ?? []).map((r: any) => r.move) : [];
}
export const moveTypes = async (page: Page) => (await moves(page)).map((m) => m.type);

export interface Teams {
  orange: string[]; teal: string[];
  clueGivers: { orange: string | null; teal: string | null };
  partners: { orange: string | null; teal: string | null };
  names: { id: string; orange: string; teal: string };
  guessOnly: string[];
}
/** The evening's teams as set up (SetupInput `config.teams`), with later `setTeams` / `setClueGivers` moves applied. */
export async function teamsOf(page: Page): Promise<Teams> {
  const e = await evening(page);
  let t: Teams = JSON.parse(JSON.stringify(e.setup.config.teams));
  for (const r of e.records ?? []) {
    const m = r.move;
    if (m?.type === 'setTeams' || m?.type === 'setPlayers') t = JSON.parse(JSON.stringify(m.teams));
    if (m?.type === 'setClueGivers') t = { ...t, clueGivers: m.clueGivers, partners: m.partners };
  }
  return t;
}
export const clueGiver = (t: Teams, team: Team) => t.clueGivers[team]!;
/** Guessers (Terms): the team's players minus its clue giver and partner, in team list order. */
export const guessersOf = (t: Teams, team: Team) => t[team].filter((n) => n !== t.clueGivers[team] && n !== t.partners[team]);

/** The UI state `pgn.secretWords-ui.<id>` (SWD-048) of the evening in progress. */
export async function uiState(page: Page): Promise<any> {
  const id = (await evening(page)).id;
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), `pgn.secretWords-ui.${id}`);
}

export interface LaneBHost extends HostOptions {
  /** Taps "Show me the board first" instead of "Let's play" (SWD-010, 012). */
  preview?: boolean;
  landmine?: 'Lose the game' | 'Lose your turn';
  storage?: Record<string, unknown>;
}

/**
 * hostEvening (secret-words.ts) with lane B's extra choices: the Landmine option, the preview, extra storage (Larger text,
 * `pgn.pref.largerText`). Ends on the preview, the scan screen (two or three phones) or the first pass screen (one phone).
 */
export async function host(page: Page, o: LaneBHost) {
  const seed = o.seed ?? 'lane-b';
  await freshPhone(page, {
    time: o.time,
    storage: { ...o.storage, 'pgn.test.seeds': { deal: `deal-${seed}`, teams: `teams-${seed}`, boards: o.boards } },
  });
  await waitGuards(page);
  await hostAGame(page).click();
  await expect(page.getByRole('heading', { name: 'What shall we play?' })).toBeVisible();
  await waitGuards(page);
  await page.getByRole('button', { name: /^Secret Words/ }).and(page.locator(':not([data-testid="resume-card"])')).click();
  await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
  await waitGuards(page);
  const field = page.getByLabel('Player name', { exact: true });
  for (const n of o.names ?? NAMES) { await field.fill(n); await field.press('Enter'); }
  await waitGuards(page);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make teams' })).toBeVisible();
  await waitGuards(page);
  await mainButton(page).filter({ hasText: /^Next$/ }).click();
  await expect(page.getByRole('heading', { name: 'How do you want to play?' })).toBeVisible();
  await waitGuards(page);
  await page.getByRole('button', { name: o.phones, exact: true }).click();
  if (o.board === 'easy') await page.getByRole('button', { name: 'Easy: 16 words', exact: true }).click();
  else if (o.landmine) await page.getByRole('button', { name: o.landmine, exact: true }).click();
  await waitGuards(page);
  await mainButton(page).filter({ hasText: /^Start the game$/ }).click();
  await expect(page.getByRole('heading', { name: 'Read this aloud' })).toBeVisible();
  await waitGuards(page);
  if (o.preview) await quiet(page, 'Show me the board first').click();
  else await mainButton(page).filter({ hasText: /^Let's play$/ }).click();
  await waitGuards(page);
}

/** From the scan screen or the pass screen to the clue screen of the team whose turn it is. */
export async function toClueScreen(page: Page, phones: LaneBHost['phones']) {
  if (phones === 'One phone') {
    await tapMain(page, /^(I'm |We're )/);
    await waitGuards(page);
    await holdPad(page).click();
    await tapMain(page, /^I have my clue$/);
  } else if (await scanHeading(page).isVisible()) {
    await tapMain(page, /^(The map phone has the map|Both have the map)$/);
  }
  await expect(page.getByTestId('clue-prompt')).toBeVisible();
}

export interface Guessing { b: OracleBoard; teams: Teams; team: Team; code: string }
/** Hosts an evening on `code` and gives the first clue (`n`, optional `word`); ends on the guessing screen of turn 1. */
export async function toGuessing(page: Page, o: Omit<LaneBHost, 'boards'> & { code: string; n?: number | 'inf'; word?: string }): Promise<Guessing> {
  await host(page, { ...o, boards: [o.code] });
  await toClueScreen(page, o.phones);
  if (o.word !== undefined) await page.getByLabel('Clue word (optional)', { exact: true }).fill(o.word);
  await giveClue(page, o.n ?? 2);
  // The clue line shows on every guessing screen; a Full board in narrow portrait has no cells by design (SWD-092).
  await expect(page.getByTestId('clue-line')).toBeVisible();
  const b = oracleBoard(o.code);
  return { b, teams: await teamsOf(page), team: b.starts, code: o.code };
}

/** Picks a cell and taps "Reveal <WORD>"; runs the clock past the 300 ms turn. */
export async function guess(page: Page, i: number) {
  await waitGuards(page);
  await cellAt(page, i).click();
  await tapMain(page, /^Reveal /);
  await page.clock.runFor(400);
}

/** Ends the turn of the team guessing with "End our turn" → "Other team's turn". */
export async function endOurTurn(page: Page) {
  await waitGuards(page);
  await quiet(page, 'End our turn').click();
  await tapMain(page, /^Other team's turn$/);
}

/** Every item of the open game menu, in screen order, with the separators as '|'. Opens and closes the menu. */
export async function menuOf(page: Page): Promise<string[]> {
  await waitGuards(page);
  await menuButton(page).click();
  const menu = page.getByRole('menu');
  await expect(menu.first()).toBeVisible();
  const out = await menu.first().evaluate((m) => [...m.querySelectorAll('[role="menuitem"], [role="separator"]')]
    .map((el) => (el.getAttribute('role') === 'separator' ? '|' : (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim())));
  await closeMenu(page);
  return out;
}
/** Items only (no separators). */
export const itemsOnly = (m: string[]) => m.filter((x) => x !== '|');

export async function closeMenu(page: Page) {
  if (!(await page.getByRole('menuitem').first().isVisible().catch(() => false))) return;
  // v3.7 (SWD-110): the menu sheet has "Done" pinned at its bottom.
  const done = page.getByRole('button', { name: 'Done', exact: true }).filter({ visible: true });
  if (await done.count()) await done.last().click();
  else await menuButton(page).click();
  await expect(page.getByRole('menuitem')).toHaveCount(0);
}

/** The app goes to the background (visibilitychange to hidden), and later comes back. */
export async function hideApp(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
  });
}
export async function showApp(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
  });
}

/** Records `navigator.vibrate` calls and keeps `window.__sounds` (Test hooks item 3, as Impostor's hooks 7 and 8). */
export async function listenForEffects(page: Page) {
  await page.addInitScript(() => {
    (window as any).__vibrations = [];
    Object.defineProperty(Navigator.prototype, 'vibrate', { configurable: true, value: (p: unknown) => { (window as any).__vibrations.push(p); return true; } });
    (window as any).__sounds = (window as any).__sounds ?? [];
  });
}
export const vibrations = (page: Page): Promise<unknown[]> => page.evaluate(() => (window as any).__vibrations ?? []);
export const sounds = (page: Page): Promise<{ name: string; at: number; gain: number }[]> => page.evaluate(() => (window as any).__sounds ?? []);
export async function clearEffects(page: Page) { await page.evaluate(() => { (window as any).__vibrations = []; (window as any).__sounds = []; }); }

/** Box of a locator (throws when it is not on screen). */
export async function box(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('not on screen');
  return b;
}

/** No page scrolling (Terms): the page is no taller and no wider than the viewport. */
export const pageScrolls = (page: Page) => page.evaluate(() => {
  const s = document.scrollingElement!;
  return s.scrollHeight > window.innerHeight + 1 || s.scrollWidth > window.innerWidth + 1;
});

/** The tap-guard look (SWD-114 v3.6): greyed, `aria-disabled="true"`, `data-guard="on"`. */
export async function guardState(l: Locator) {
  return l.evaluate((el) => ({
    guard: el.getAttribute('data-guard'),
    ariaDisabled: el.getAttribute('aria-disabled'),
    disabled: (el as HTMLButtonElement).disabled,
    opacity: Number(getComputedStyle(el).opacity),
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
  }));
}

/** Computed font size in px. */
export const fontPx = (l: Locator) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
