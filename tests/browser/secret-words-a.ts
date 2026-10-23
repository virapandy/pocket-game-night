// Secret Words screen lane A (Home, picker, Join, setup: A1-A3, J1-J2, D11, S1-S5; scenarios v3.7, 23 October 2026).
// Shared steps and models for secret-words-a-home.spec.ts and secret-words-a-setup.spec.ts. Names, texts and test ids
// come from docs/games/secret-words/scenarios.md (Terms, Canonical strings, Test hooks). What the screens need:
// tests/games/secret-words/screens-a.md.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page } from '@playwright/test';
import { createRng, shuffle } from '../../src/engine';
import { freshPhone, mainButton, T0 } from './impostor';
import { hostAGame } from './helpers';
import { ALPHABET, oracleCode, TEAM_PAIRS, type Audience, type BoardSize } from '../games/secret-words/oracle';
import { waitGuards } from './secret-words';

export { mainButton, freshPhone, waitGuards, T0 };
/* eslint-disable @typescript-eslint/no-explicit-any */

export const TZ = 'Asia/Kolkata';
export const NAMES = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om'];
export const SIZES = [
  { width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 812, height: 375 }, { width: 568, height: 320 },
];
export const CODE = '27P3QX8';
export const PAIR = { id: 'SWDT-01', orange: 'Chai Champions', teal: 'Coffee Commandos' };

// ---- Saved game nights (tests/fixtures/secret-words-saved-evenings-v1.json: orange 1, teal 1; never edited) ----

const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/secret-words-saved-evenings-v1.json', import.meta.url)), 'utf8'));
export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
/** Started 22 October 2026, 9:00 pm in India; games 1 and 2 are won (1-1); game 3's board has just been dealt. */
export const inProgress = (): any => clone(fixture.inProgress);
/** The same night ended: three games, 1-1, `endEvening` at END_AT. */
export const ended = (): any => clone(fixture.ended);
export const START_AT: number = fixture.inProgress.createdAt;
export const END_AT: number = fixture.ended.records.at(-1).at;
export const H = 3_600_000;
export const NIGHT_SESSION: string = fixture.inProgress.sessionId;
export const lastCode = (g: any): string => [...g.records].reverse().find((r: any) => r.move.type === 'deal' || r.move.type === 'dealNew').move.code;

/** A copy of a night for another team-name pair and time: `keep` records, then `endEvening` if asked, all shifted by `shift` ms. */
export function variant(g: any, o: { id: string; shift: number; names?: { id: string; orange: string; teal: string }; keep?: number; end?: boolean; map?: 'pass' | 'shared' | 'own' }): any {
  const v = clone(g);
  v.id = o.id;
  const records = v.records.slice(0, o.keep ?? v.records.length);
  if (o.end) records.push({ v: 1, seq: records.length + 1, at: records.at(-1).at + 7000, by: 'host', move: { type: 'endEvening' } });
  for (const r of records) r.at += o.shift;
  v.records = records;
  v.createdAt += o.shift;
  v.updatedAt = records.at(-1).at;
  v.status = o.end ? 'ended' : 'in-progress';
  if (o.names) v.setup.config.teams.names = o.names;
  if (o.map) {
    v.setup.config.choices.map = o.map;
    for (const r of v.records) if (r.move.type === 'setChoices') r.move.choices.map = o.map;
  }
  return v;
}

const sessionOf = (id: string, createdAt: number) => ({ format: 1, id, name: 'Thursday 22 Oct', createdAt, settlements: [] });
/** Opens the app at `now` on a phone holding these saved games (and their session) and any other storage. */
export async function phoneWithNights(page: Page, nights: any[], o: { now: number; fixed?: boolean; storage?: Record<string, unknown>; viewport?: { width: number; height: number } }) {
  if (o.viewport) await page.setViewportSize(o.viewport);
  const storage: Record<string, unknown> = { ...o.storage };
  for (const g of nights) {
    storage[`pgn.game.${g.id}`] = g;
    storage[`pgn.session.${g.sessionId}`] = sessionOf(g.sessionId, Math.min(g.createdAt, o.now) - 60_000);
  }
  await freshPhone(page, { time: o.now, storage, fixed: o.fixed });
}

/** Saved Secret Words game nights, read back from storage (pgn.game.*). */
export async function savedNights(page: Page): Promise<any[]> {
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
export const movesOf = (g: any): string[] => g.records.map((r: any) => r.move.type);

// ---- Codes (SWD-022 symbols) ----

/** A 7-symbol code from six symbol values, with the right check symbol (for codes the app should refuse or call newer). */
export function codeFromValues(v: number[]): string {
  const check = v.reduce((s, x, i) => s + (i + 1) * x, 0) % 31;
  return [...v, check].map((x) => ALPHABET[x]).join('');
}
export const dashed = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;
export const codeFor = (board: BoardSize, words: Audience, d = 0, n = 0) => oracleCode({ edition: 1, board, words }, d, n);

// ---- Screens ----

export const secretWordsCard = (page: Page) =>
  page.getByRole('button', { name: /^Secret Words/ }).and(page.locator(':not([data-testid="resume-card"])'));
export const joinCard = (page: Page) => page.getByRole('button', { name: /^Join a game/ });
export const playerField = (page: Page) => page.getByLabel('Player name', { exact: true });
export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { name, ...(typeof name === 'string' ? { exact: true } : {}) });
export const mainText = (page: Page, text: string | RegExp) => mainButton(page).filter({ hasText: typeof text === 'string' ? new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : text });
export const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

/** Taps a button once the app's tap guards (500 ms screens, 800 ms mains) have passed in app time. */
export async function tap(page: Page, target: Locator) {
  await waitGuards(page);
  await target.click();
}

/** Home → the picker "What shall we play?" → after `waitGuards`. */
export async function toPicker(page: Page) {
  await waitGuards(page);
  await hostAGame(page).click();
  await expect(heading(page, 'What shall we play?')).toBeVisible();
  await waitGuards(page);
}

export interface Boot {
  viewport?: { width: number; height: number };
  larger?: boolean;
  seed?: string;
  boards?: string[];
  storage?: Record<string, unknown>;
  time?: number;
}
/** A new phone at Home, with the Secret Words test seeds (Test hooks item 2). */
export async function boot(page: Page, o: Boot = {}) {
  if (o.viewport) await page.setViewportSize(o.viewport);
  await freshPhone(page, {
    time: o.time,
    storage: {
      ...(o.larger ? { 'pgn.pref.largerText': true } : {}),
      ...o.storage,
      'pgn.test.seeds': { deal: `deal-${o.seed ?? 'a'}`, teams: `teams-${o.seed ?? 'a'}`, boards: o.boards ?? [CODE] },
    },
  });
  await waitGuards(page);
}

/** Home → picker → the Secret Words card → "Who's playing?" (a new phone, no names). */
export async function toNames(page: Page, o: Boot = {}) {
  await boot(page, o);
  await toPicker(page);
  await secretWordsCard(page).click();
  await expect(heading(page, "Who's playing?")).toBeVisible();
  await waitGuards(page);
}
export async function typeNames(page: Page, names: string[]) {
  const field = playerField(page);
  for (const n of names) { await field.fill(n); await field.press('Enter'); }
  await waitGuards(page);
}
/** … → names typed → "Next" → Make teams. */
export async function toTeams(page: Page, o: Boot & { names?: string[] } = {}) {
  await toNames(page, o);
  await typeNames(page, o.names ?? NAMES);
  await mainText(page, 'Next').click();
  await expect(heading(page, 'Make teams')).toBeVisible();
  await waitGuards(page);
}
/** … → Make teams "Next" → "How do you want to play?". */
export async function toChoices(page: Page, o: Boot & { names?: string[] } = {}) {
  await toTeams(page, o);
  await mainText(page, 'Next').click();
  await expect(heading(page, 'How do you want to play?')).toBeVisible();
  await waitGuards(page);
}
export interface Choose { phones?: 'One phone' | 'Two phones' | 'Three phones'; board?: 'Full: 25 words' | 'Easy: 16 words'; landmine?: 'Lose the game' | 'Lose your turn'; words?: 'Whole family' | '+ Harder words' }
export const group = (page: Page, name: string) => page.getByRole('group', { name, exact: true });
export const pressed = async (l: Locator) => (await l.getAttribute('aria-pressed')) === 'true';
export async function choose(page: Page, c: Choose) {
  if (c.phones) await page.getByRole('button', { name: c.phones, exact: true }).click();
  if (c.board) await group(page, 'Board').getByRole('button', { name: c.board, exact: true }).click();
  if (c.landmine) await group(page, 'Landmine').getByRole('button', { name: c.landmine, exact: true }).click();
  if (c.words) await group(page, 'Words').getByRole('button', { name: c.words, exact: true }).click();
  await waitGuards(page);
}
/** … → Choices → options → "Start the game" → "Read this aloud". */
export async function toReadAloud(page: Page, o: Boot & { names?: string[]; choose?: Choose } = {}) {
  await toChoices(page, o);
  await choose(page, { phones: 'Two phones', ...o.choose });
  await mainText(page, 'Start the game').click();
  await expect(heading(page, 'Read this aloud')).toBeVisible();
  await waitGuards(page);
}

// ---- Make teams, read off the screen ----

export interface TeamsOnScreen {
  names: { orange: string; teal: string };
  orange: string[]; teal: string[];
  clueGivers: { orange: string | null; teal: string | null };
  guessOnly: string[];
}
/** Players come from the buttons "Move <name> to <other team>" (in page order); badges and tags by the row they sit in. */
export async function teamsOnScreen(page: Page): Promise<TeamsOnScreen> {
  const raw = await page.evaluate(() => {
    const h2s = [...document.querySelectorAll('h2')].map((h) => (h.textContent ?? '').trim()).filter((t) => / · \d+ players?$/.test(t));
    const moves = [...document.querySelectorAll('button[aria-label^="Move "]')].map((b) => b.getAttribute('aria-label')!);
    const owner = (el: Element) => {
      for (let p: Element | null = el; p; p = p.parentElement) {
        const own = p.querySelectorAll('button[aria-label^="Move "]');
        if (own.length === 1) return own[0]!.getAttribute('aria-label')!;
        if (own.length > 1) return null;
      }
      return null;
    };
    const badges = [...document.querySelectorAll('[data-testid="clue-giver-badge"]')].map(owner);
    const tags = [...document.querySelectorAll('[data-testid="guess-only-tag"]')].map(owner);
    return { h2s, moves, badges, tags };
  });
  expect(raw.h2s, 'two team headings "<name> · N players"').toHaveLength(2);
  const [orangeName, tealName] = raw.h2s.map((t) => t.replace(/ · \d+ players?$/, ''));
  const parse = (label: string) => { const m = /^Move (.+) to (.+)$/.exec(label)!; return { player: m[1]!, to: m[2]! }; };
  const orange: string[] = [], teal: string[] = [];
  for (const l of raw.moves) { const { player, to } = parse(l); (to === tealName ? orange : teal).push(player); }
  const cgOf = (team: string[]) => {
    const found = raw.badges.map((b) => (b ? parse(b).player : null)).filter((p): p is string => !!p && team.includes(p));
    return found[0] ?? null;
  };
  return {
    names: { orange: orangeName!, teal: tealName! }, orange, teal,
    clueGivers: { orange: cgOf(orange), teal: cgOf(teal) },
    guessOnly: raw.tags.map((t) => (t ? parse(t).player : '')).filter(Boolean),
  };
}
export const knownPair = (n: { orange: string; teal: string }) => TEAM_PAIRS.find((p) => p.orange === n.orange && p.teal === n.teal);

// ---- Models of SWD-004 / 006 / 130 (the scenarios' own steps, with the engine's createRng and shuffle) ----

export interface Split { orange: string[]; teal: string[] }
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
export function drawSplit(names: string[], seed: string, from: number, o: { guessOnly?: string[]; now?: Split } = {}): { split: Split; k: number } {
  const go = o.guessOnly ?? [];
  let split!: Split;
  let k = from;
  for (; k <= 10; k++) {
    const order = shuffle(names, createRng(`${seed}:${k}`));
    const half = Math.ceil(names.length / 2);
    split = { orange: order.slice(0, half), teal: order.slice(half) };
    const balanced = Math.abs(split.orange.filter((n) => go.includes(n)).length - split.teal.filter((n) => go.includes(n)).length) <= 1;
    const changed = !o.now || !(same(split.orange, o.now.orange) && same(split.teal, o.now.teal));
    if (balanced && changed) break;
  }
  return { split, k: Math.min(k, 10) };
}
/** The first eligible player of a team (game 1: SWD-007). */
export const firstEligible = (team: string[], go: string[] = []) => team.find((p) => !go.includes(p)) ?? null;

// ---- Layout and colour checks ----

export async function noSidewaysScroll(page: Page, where: string) {
  const w = await page.evaluate(() => ({ s: document.scrollingElement!.scrollWidth, i: window.innerWidth }));
  expect(w.s, `${where}: no sideways scrolling`).toBeLessThanOrEqual(w.i);
}
export async function box(l: Locator) {
  const b = await l.boundingBox();
  expect(b, 'on screen').not.toBeNull();
  return b!;
}
/** P10 (version 3.7): a small line is in `--text` and has at least 4.5:1 contrast with what is behind it. */
export async function smallLineColour(page: Page, l: Locator) {
  return l.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--text)';
    document.body.appendChild(probe);
    const text = getComputedStyle(probe).color;
    probe.remove();
    const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    let bg = [255, 255, 255];
    for (let p: Element | null = el; p; p = p.parentElement) {
      const c = rgb(getComputedStyle(p).backgroundColor);
      if (c.length >= 3 && (c[3] ?? 1) > 0.5) { bg = c.slice(0, 3); break; }
    }
    const mine = getComputedStyle(el).color;
    const a = lum(rgb(mine)), b = lum(bg);
    return { mine, text, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  });
}
