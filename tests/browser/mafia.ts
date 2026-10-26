// Mafia browser helpers (scenarios version 1.1, approved 25 October 2026; specs/mafia/). Names, texts and test ids come
// from specs/mafia/README.md (Terms, Canonical strings, screen IDs, test hooks) and the scenarios. Names written in
// capitals (RIYA, "KABIR is out.") are upper case by CSS only (product owner, 25 October), so the tests match names
// case-insensitively. Saved game nights are opened through MAF-H6 (`pgn.test.load`) from the move lists in
// tests/games/mafia/flows.ts (each one replayed through the rules by tests/games/mafia/saved.test.ts).
import { expect, test as pwTest, type Locator, type Page } from '@playwright/test';
import { freshPhone, mainButton } from './impostor';
import { hostAGame } from './helpers';
import { DEAL_2, EXAMPLE_DEAL, FLOW_T0, NINE, flow, savedFlow, type Flow } from '../games/mafia/flows';
import type { Role } from '../games/mafia/oracle';

export { mainButton, NINE, EXAMPLE_DEAL, DEAL_2, FLOW_T0 };
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Marks the running test as needing what this lane may not show: the Mafia card on "What shall we play?", Home's "Host a
 * game" line, or Home's unfinished-games row (the What Am I? lane owns Home and the picker; Mafia's card and row are held
 * back until What Am I? releases). Expected to fail until then; when it passes, Playwright reports "expected to fail, but
 * passed" and the tester removes the call. PGN_IGNORE_AHEAD=1 runs these tests unmarked (for a run with the card added).
 * Every other Mafia screen is built (lane-k, 25 October 2026): no other test carries a mark.
 */
export function needsMafiaCardOrHomeRow(what: string) {
  if (process.env.PGN_IGNORE_AHEAD) return;
  pwTest.fail(true, `Needs the Mafia card or Home row (held back until What Am I? releases): ${what}`);
  pwTest.setTimeout(120_000);
}

export const TZ = 'Asia/Kolkata';
export const SIZES = [
  { width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 812, height: 375 }, { width: 568, height: 320 },
];
export const BANNED = ['killed', 'dead', 'die', 'murder', 'lynch', 'eliminate', 'werewolf', 'moderator', 'session', 'evening'];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A case-insensitive, whole-text match (names in capitals are CSS only). */
export const exactly = (s: string) => new RegExp(`^\\s*${esc(s)}\\s*$`, 'i');

/** Runs the app's clock past every guard (800 ms mains, 1000 ms "I'm Riya", 500 ms screens). */
export async function waitGuards(page: Page, ms = 2000) { await page.clock.runFor(ms); }

// ---- Locators ----
export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { name: typeof name === 'string' ? exactly(name) : name });
export const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name: typeof name === 'string' ? exactly(name) : name });
export const mainIs = (page: Page, text: string) => expect(mainButton(page)).toHaveText(exactly(text));
export const byId = (page: Page, id: string) => page.getByTestId(id);
export const mafiaCard = (page: Page) => page.getByRole('button', { name: /^Mafia/ }).and(page.locator(':not([data-testid="resume-card"])'));
export const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
export const menuItem = (page: Page, name: string) => page.getByRole('menuitem', { name, exact: true }).or(page.getByRole('menu').getByRole('button', { name, exact: true }));
export const pad = (page: Page) => page.getByRole('button', { name: /^(Hold here to see your role|Tap to see|Tap to hide|Tap to see your night job)$/ });
export const nightNames = (page: Page) => byId(page, 'night-names').getByRole('button');
export const nameButton = (page: Page, name: string) => byId(page, 'night-names').getByRole('button', { name: new RegExp(`^${esc(name)}(, can't pick)?$`, 'i') });

/** Taps once the guards are past (a tap inside a guard must land: force, as the Secret Words tests). */
export async function tap(page: Page, target: Locator) {
  await waitGuards(page);
  await target.click({ force: true });
}
export async function fromMenu(page: Page, item: string) {
  await tap(page, menuButton(page));
  await menuItem(page, item).click({ force: true });
}

// ---- Phones ----
export interface MafiaSeeds { roles?: string; deals?: Record<string, Record<string, Role>>; stories?: { out: string[]; saved: string[] } }
export interface Boot { viewport?: { width: number; height: number }; larger?: boolean; seeds?: MafiaSeeds; time?: number; storage?: Record<string, unknown> }
const seedsItem = (s: MafiaSeeds = {}) => ({ mafia: { seeds: { roles: s.roles ?? 'mafia-example' }, ...(s.deals ? { deals: s.deals } : {}), ...(s.stories ? { stories: s.stories } : {}) } });

/** A new phone at Home with Mafia's test seeds (item 33). */
export async function boot(page: Page, o: Boot = {}) {
  if (o.viewport) await page.setViewportSize(o.viewport);
  await freshPhone(page, {
    time: o.time ?? FLOW_T0,
    storage: { ...(o.larger ? { 'pgn.pref.largerText': true } : {}), ...o.storage, 'pgn.test.seeds': seedsItem(o.seeds) },
  });
  await waitGuards(page);
}

/** The time just after a flow's last move (+ `after` ms). */
export const flowEnd = (f: Flow | string, after = 60_000) => {
  const x = typeof f === 'string' ? flow(f) : f;
  return FLOW_T0 + (x.moves.length - 1) * (x.gap ?? 1000) + after;
};
/** A phone that opens a saved game night through MAF-H6, as if resumed (item 34). */
export async function openFlow(page: Page, name: string, o: Boot & { after?: number } = {}) {
  const f = flow(name);
  await boot(page, { ...o, time: o.time ?? flowEnd(f, o.after), storage: { ...o.storage, 'pgn.test.load': savedFlow(f) } });
}

// ---- Setup screens ----
export async function toPicker(page: Page) {
  await tap(page, hostAGame(page));
  await expect(heading(page, 'What shall we play?')).toBeVisible();
}
export async function toNames(page: Page, o: Boot = {}) {
  await boot(page, o);
  await toPicker(page);
  await tap(page, mafiaCard(page));
  await expect(heading(page, "Who's playing?")).toBeVisible();
}
export const playerField = (page: Page) => page.getByLabel('Player name', { exact: true });
export async function typeNames(page: Page, names: readonly string[]) {
  for (const n of names) { await playerField(page).fill(n); await playerField(page).press('Enter'); }
}
/** Home → … → Roles for these players. */
export async function toRoles(page: Page, names: readonly string[] = NINE, o: Boot = {}) {
  await toNames(page, o);
  await typeNames(page, names);
  await tap(page, mainButton(page));
  await expect(heading(page, `Roles for ${names.length} players`)).toBeVisible();
}
/** Home → … → "Give everyone a role" → Read this aloud → "Pass the phone round" → the first deal pass screen. */
export async function toDeal(page: Page, names: readonly string[] = NINE, o: Boot = {}) {
  await toRoles(page, names, o);
  await tap(page, mainButton(page));
  await expect(heading(page, 'Read this aloud')).toBeVisible();
  await tap(page, mainButton(page));
  await expect(byId(page, 'deal-progress')).toHaveText(exactly(`Player 1 of ${names.length}`));
}

/**
 * The first deal pass screen (B1, "Player 1 of N") of a new game night, opened through MAF-H6 with only the `start`
 * recorded, so tests of the deal and what follows need neither Home's "Host a game" nor the picker's Mafia card. Forced
 * deals (`deals`) or a role seed (`roles`, the deal then comes from the shuffle, MAF-010) as in `pgn.test.seeds`.
 * The game night is the flow "deal-start" with these players and deals (tests/games/mafia/flows.ts).
 */
export async function openDeal(page: Page, names: readonly string[] = NINE, o: Boot & { deals?: Record<string, Record<string, Role>>; roles?: string } = {}) {
  const f: Flow = { ...flow('deal-start'), deals: o.deals ?? (o.roles ? {} : flow('deal-start').deals), moves: [{ type: 'start', players: [...names], mafiaCount: 2 }] };
  const saved = savedFlow(f);
  if (o.roles) saved.setup.seeds.roles = o.roles;
  await boot(page, { ...o, time: o.time ?? flowEnd(f), storage: { ...o.storage, 'pgn.test.load': saved } });
  await expect(byId(page, 'deal-progress')).toHaveText(exactly(`Player 1 of ${names.length}`));
}

// ---- The deal (B1, B2) ----
/** One player's deal turn: "I'm Riya", tap mode, see the role, then "Done, …". Returns the role word shown. */
export async function dealTurn(page: Page, name: string): Promise<string> {
  await expect(byId(page, 'pass-name')).toHaveText(exactly(name));
  await tap(page, button(page, `I'm ${name}`));
  await tap(page, button(page, 'Tap instead'));
  await tap(page, pad(page));
  const word = (await byId(page, 'private-word').innerText()).trim();
  await tap(page, pad(page));
  await tap(page, mainButton(page));
  return word;
}
export async function dealAll(page: Page, names: readonly string[] = NINE): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const n of names) out[n] = await dealTurn(page, n);
  await expect(heading(page, 'Night 1')).toBeVisible();
  return out;
}

// ---- The night (N0 to N3) ----
/** One player's night turn: "I'm Meena", "Tap to see your night job", tap `target`, 4000 ms, "Done, …". */
export async function nightTurn(page: Page, name: string, target: string | null) {
  await expect(byId(page, 'pass-name')).toHaveText(exactly(name));
  await tap(page, button(page, `I'm ${name}`));
  await tap(page, button(page, 'Tap to see your night job'));
  if (target !== null) await tap(page, nameButton(page, target));
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
}
/** A whole night: picks[player] for each player in the order the screens give. */
export async function playNight(page: Page, picks: Record<string, string | null>) {
  if (await button(page, 'Start the night').isVisible().catch(() => false)) await tap(page, mainButton(page));
  for (let i = 0; i < 20; i++) {
    if (await heading(page, 'Night over.').isVisible().catch(() => false)) return;
    const name = (await byId(page, 'pass-name').innerText()).trim();
    const key = Object.keys(picks).find((k) => k.toLowerCase() === name.toLowerCase()) ?? name;
    await nightTurn(page, key, picks[key] ?? null);
  }
  await expect(heading(page, 'Night over.')).toBeVisible();
}
/** From N3 (or straight from a resume on M1), to the morning. */
export async function toMorning(page: Page) {
  if (await heading(page, 'Night over.').isVisible().catch(() => false)) await tap(page, mainButton(page));
  await expect(heading(page, /^Morning, day \d+$/i)).toBeVisible();
}

// ---- What a room screen shows (MAF-016) ----
/**
 * Everything a room screen holds that the room could read: the visible text, every accessible name and label, the page
 * title, and the text of every aria-live region.
 */
export async function roomDump(page: Page): Promise<string> {
  return page.evaluate(() => {
    const parts: string[] = [`title:${document.title}`, `text:${document.body.innerText}`];
    for (const el of Array.from(document.querySelectorAll('[aria-label],[aria-labelledby],[title],[alt]'))) {
      parts.push(`label:${el.getAttribute('aria-label') ?? ''}|${el.getAttribute('title') ?? ''}|${el.getAttribute('alt') ?? ''}`);
    }
    for (const el of Array.from(document.querySelectorAll('[aria-live],[role="status"],[role="alert"],[role="log"]'))) parts.push(`live:${el.textContent ?? ''}`);
    return parts.join('\n');
  });
}

/** No page scrolling (MAF-080): the page is no taller and no wider than the screen. */
export async function noPageScroll(page: Page, where: string) {
  const s = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, vh: window.innerHeight, vw: window.innerWidth }));
  expect(s.h, `${where}: page scrolls`).toBeLessThanOrEqual(s.vh + 1);
  expect(s.w, `${where}: page scrolls sideways`).toBeLessThanOrEqual(s.vw + 1);
}
export async function box(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('not on screen');
  return b;
}

// ---- "More below ↓" scroll cue (player walks of 25 October; the What Am I? pattern, orchestrator's call) ----
/** The visible scroll cue: "More below" (the arrow may differ). */
export const moreBelowCue = (page: Page) => page.getByText(/More below/i);
/**
 * How the element sits: 'shown' when wholly inside the screen and every box that clips it; 'below' when part of it is
 * cut off at the bottom (by the screen or a scroll box); 'above' when cut off at the top.
 */
export const clipState = (l: Locator) => l.evaluate((el) => {
  const r = el.getBoundingClientRect();
  let top = 0, bottom = window.innerHeight;
  for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
    const s = getComputedStyle(a);
    if (s.overflowY !== 'visible') { const c = a.getBoundingClientRect(); top = Math.max(top, c.top); bottom = Math.min(bottom, c.bottom); }
  }
  if (r.bottom > bottom + 1) return 'below';
  if (r.top < top - 1) return 'above';
  return 'shown';
});
