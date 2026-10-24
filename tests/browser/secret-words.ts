// Secret Words browser helpers. Every name, text and test id comes from specs/secret-words/README.md (Terms, Canonical
// strings, Test hooks) of the scenarios v3.6 (22 October 2026). Boards come from the scenarios' own algorithm
// (tests/games/secret-words/oracle.ts), so a test knows every board it deals through `pgn.test.seeds` (Test hooks item 2).
import { expect, test as pwTest, type Locator, type Page } from '@playwright/test';
import { freshPhone, mainButton } from './impostor';
import { hostAGame } from './helpers';
import { oracleBoard, TEAM_PAIRS, type Kind, type OracleBoard } from '../games/secret-words/oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Marks the running test as written before the Secret Words screens exist (the C3 rule lane builds the rules first;
 * the screens are C1/C2 and come after). Expected to fail until then; when it passes, Playwright reports "expected to
 * fail, but passed" and the tester removes the call. PGN_IGNORE_AHEAD=1 runs these tests unmarked, to check them
 * against a branch that has the screens.
 */
export function aheadOfSecretWordsScreens(what: string) {
  if (process.env.PGN_IGNORE_AHEAD) return;
  pwTest.fail(true, `Secret Words screens not built yet: ${what}`);
  // A timed-out test does not count as the expected failure: give the first missing screen time to fail on a busy runner.
  pwTest.setTimeout(120_000);
}

export const NAMES = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om'];
export { TEAM_PAIRS };
export { oracleBoard, type Kind, type OracleBoard };

/** "27P3QX8" → "27P-3QX8" (Terms: shown `XXX-XXXX`). */
export const shown = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;

/** Runs the app's clock on past every tap guard (800 ms mains, 1 s "I'm Riya", 1.5 s "Other team's turn" from t = 300 ms). */
export async function waitGuards(page: Page) { await page.clock.runFor(2000); }

export interface HostOptions {
  phones: 'One phone' | 'Two phones' | 'Three phones';
  boards: string[];
  seed?: string;
  names?: string[];
  board?: 'full' | 'easy';
  time?: number;
}

/**
 * A new phone → Home → "Host a game" → "Secret Words" → names (Enter after each, SWD-132) → "Next" → Make teams "Next" →
 * Choices (phones card, Board) → "Start the game" → "Read this aloud" → "Let's play". Ends on the scan screen (two or
 * three phones) or the first pass screen (one phone).
 */
export async function hostEvening(page: Page, o: HostOptions) {
  await freshPhone(page, {
    time: o.time,
    storage: { 'pgn.test.seeds': { deal: o.seed ?? 'deal-seed-browser', teams: `teams-${o.seed ?? 'browser'}`, boards: o.boards } },
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
  await waitGuards(page);
  await mainButton(page).filter({ hasText: /^Start the game$/ }).click();
  await expect(page.getByRole('heading', { name: 'Read this aloud' })).toBeVisible();
  await waitGuards(page);
  await mainButton(page).filter({ hasText: /^Let's play$/ }).click();
  await waitGuards(page);
}

export const scanHeading = (page: Page) => page.getByRole('heading', { name: 'Clue givers: scan this to see the secret map' });
export const boardCells = (page: Page) => page.getByTestId('word-board').getByTestId('board-cell');
export const mapCells = (page: Page) => page.getByTestId('map-grid').getByTestId('map-cell');
export const menuButton = (page: Page) => page.getByRole('button', { name: /Menu/ });
export const menuItem = (page: Page, name: string) => page.getByRole('menuitem', { name, exact: true });
export async function fromMenu(page: Page, item: string) {
  await menuButton(page).click();
  await menuItem(page, item).click();
}

/** The kind an accessible name gives (SWD-093: "Kite, orange team" / "Kite, teal team" / "Kite, nobody's word" / "Kite, the Landmine"). */
export function kindOf(name: string): Kind | 'face down' | null {
  if (/, face down$/.test(name)) return 'face down';
  if (/, orange team\b/.test(name)) return 'orange';
  if (/, teal team\b/.test(name)) return 'teal';
  if (/, nobody's word\b/.test(name)) return 'nobody';
  if (/, the Landmine\b/.test(name)) return 'landmine';
  return null;
}

/** Words (text) and kinds (by accessible name) of cells, in `data-index` order. */
export async function cellsOf(cells: Locator): Promise<{ index: number; word: string; name: string }[]> {
  const out = await cells.evaluateAll((els) => els.map((el) => ({
    index: Number(el.getAttribute('data-index')),
    word: (el.textContent ?? '').trim(),
    name: el.getAttribute('aria-label') ?? (el.textContent ?? '').trim(),
  })));
  return out.sort((a, b) => a.index - b.index);
}

/** Taps the main button once its guard has passed. */
export async function tapMain(page: Page, text: RegExp) {
  await waitGuards(page);
  await mainButton(page).filter({ hasText: text }).click();
}

/** On the clue screen: picks a number key ("∞" is named "As many as you like") and confirms. */
export async function giveClue(page: Page, n: number | 'inf') {
  await expect(page.getByTestId('clue-prompt')).toBeVisible();
  await waitGuards(page);
  const key = n === 'inf' ? page.getByRole('button', { name: 'As many as you like', exact: true }) : page.getByTestId('clue-key').filter({ hasText: new RegExp(`^${n}$`) });
  await key.click();
  await tapMain(page, n === 'inf' ? /^Clue for ∞: start guessing$/ : new RegExp(`^Clue for ${n}: start guessing$`));
}

/** While guessing: picks a cell, taps "Reveal <WORD>", and runs the clock past the 300 ms turn. */
export async function revealCell(page: Page, index: number) {
  await waitGuards(page);
  await page.locator(`[data-testid="board-cell"][data-index="${index}"]`).click();
  await tapMain(page, /^Reveal /);
  await page.clock.runFor(400);
}

/** One phone: from the pass screen through the private map to the clue screen ("I'm …", the pad, "I have my clue"). */
export async function passToClue(page: Page) {
  await tapMain(page, /^(I'm |We're )/);
  await waitGuards(page);
  await page.getByTestId('hold-pad').click();
  await tapMain(page, /^I have my clue$/);
}
