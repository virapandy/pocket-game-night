// Impostor browser helpers. Every name, text and test id comes from specs/impostor/README.md (Terms, Canonical
// strings, Test hooks) of the scenarios v2.2. Listed for the Build role in tests/browser/README.md, "Impostor".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page } from '@playwright/test';
import { HOME, hostAGame } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const P4 = ['Riya', 'Arjun', 'Meena', 'Kabir'];
export const P5 = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya'];
export const CATEGORIES = [
  'Food', 'Festivals and occasions', 'Around the house', 'Travel and places', 'Films, music and TV',
  'Cricket and games', 'School and childhood', 'Weddings and family', 'Desi life',
];
export const DEFAULT_CHOICES = { mode: 'easy', talking: 'free', score: false, words: 'family', categories: CATEGORIES, nonveg: false };
/** India time, as the families play; the evening start times below read in it. */
export const TZ = 'Asia/Kolkata';
/** 3 October 2026, 21:30 in India (IMP-096's example time). */
export const T0 = 1_791_043_200_000;

// ---- Words (docs/games/impostor/words.csv) ----

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const csv = parseCsv(readFileSync(fileURLToPath(new URL('../../docs/games/impostor/words.csv', import.meta.url)), 'utf8'));
const header = csv[0]!;
export interface Word { id: string; word: string; other_names: string; category: string; hint: string }
export const WORDS: Word[] = csv.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((k, i) => [k, r[i] ?? ''])) as any);
export const word = (id: string): Word => {
  const w = WORDS.find((x) => x.id === id);
  if (!w) throw new Error(`no word ${id}`);
  return w;
};
export const SAMOSA = 'IMPW-004', PANI_PURI = 'IMPW-005', KHEER = 'IMPW-007', LONGEST = 'IMPW-402';

/** IMP-013: what must not be in the page during a round, for this word (and its category in Hard). */
export function secretTerms(id: string, mode: 'easy' | 'hard'): string[] {
  const w = word(id);
  const terms = [w.word, ...w.other_names.split(' / ').filter(Boolean), w.hint, "You're the impostor"];
  if (mode === 'hard') terms.push(w.category);
  return terms;
}

/**
 * IMP-013: the terms found in `document.documentElement.outerHTML` or `document.title`, case-insensitive, as whole
 * phrases (no letter or digit right before or after). Script sources are not checked.
 */
export async function secretsInPage(page: Page, terms: string[]): Promise<string[]> {
  return page.evaluate((terms) => {
    const html = document.documentElement.outerHTML.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') + '\n' + document.title;
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const amp = (s: string) => s.replace(/&/g, '&amp;').replace(/'/g, "(?:'|&#39;|&apos;)");
    return terms.filter((t) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${esc(t)}|${amp(esc(t))})(?![\\p{L}\\p{N}])`, 'iu').test(html));
  }, terms);
}
export async function expectNoSecrets(page: Page, terms: string[], where: string) {
  expect(await secretsInPage(page, terms), `${where}: secret text in the page`).toEqual([]);
}

/** A name matched case-insensitively (Terms, "Names"), inside an exact text. */
export const ci = (name: string) => name.replace(/[a-z]/gi, (c) => `[${c.toLowerCase()}${c.toUpperCase()}]`);
function pattern(text: string, names: string[]): string {
  let re = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const n of names) re = re.replace(new RegExp(`\\b${n}\\b`, 'g'), ci(n));
  return re;
}
/** An exact text as a regular expression, with each listed name matched case-insensitively. */
export const exact = (text: string, names: string[] = P5) => new RegExp(`^\\s*${pattern(text, names)}\\s*$`);
/** The same, without anchors: the text anywhere in the element. */
export const phrase = (text: string, names: string[] = P5) => new RegExp(pattern(text, names));

// ---- Storage (Test hooks items 3 and 13) ----

export interface TestSeeds { word?: string; starter?: string; deals?: { wordId?: string; impostor?: string; starter?: string }[] }

/** A fresh phone at `time` (fake clock installed), with these keys in storage before the app loads. */
const clocked = new WeakSet<Page>();
export async function freshPhone(page: Page, opts: { time?: number; seeds?: TestSeeds; storage?: Record<string, unknown>; fixed?: boolean } = {}) {
  if (!clocked.has(page)) { await page.clock.install({ time: opts.time ?? T0 }); clocked.add(page); }
  else await page.clock.setSystemTime(opts.time ?? T0);
  // `fixed`: Date.now() stays exactly at `time` while the app opens (timers still run), for limits measured to the ms.
  if (opts.fixed) await page.clock.setFixedTime(opts.time ?? T0);
  await page.goto(HOME);
  const items: Record<string, string> = {};
  if (opts.seeds) items['pgn.test.seeds'] = JSON.stringify(opts.seeds);
  for (const [k, v] of Object.entries(opts.storage ?? {})) items[k] = typeof v === 'string' ? v : JSON.stringify(v);
  await page.evaluate((items) => { localStorage.clear(); for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v); }, items);
  await page.reload();
}

/** Every saved Impostor evening on this phone (pgn.game.*). */
export async function savedEvenings(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const out: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('pgn.game.')) continue;
      try { const g = JSON.parse(localStorage.getItem(k)!); if (g?.gameType === 'impostor') out.push(g); } catch { /* not ours */ }
    }
    return out;
  });
}
export async function onlyEvening(page: Page): Promise<any> {
  const all = await savedEvenings(page);
  expect(all.length, 'one saved Impostor evening').toBe(1);
  return all[0];
}

// ---- Building saved evenings (IMP-096) for the tests that reopen one ----

export type Move = { type: string; [k: string]: unknown };
export type Outcome = { caught: 'right' | 'wrong' } | { escaped: string } | { stillTie: [string, string] };

/** The moves of one round's deal and vote (players in seat order; the impostor comes from the forced deal). */
export function roundMoves(players: string[], impostor: string, outcome: Outcome, first: Move = { type: 'nextRound' }): Move[] {
  const m: Move[] = [first, ...players.map(() => ({ type: 'seen' })), { type: 'startTalk' }, { type: 'voteNow' }];
  if ('caught' in outcome) m.push({ type: 'reveal', player: impostor }, { type: 'showWord' }, { type: 'verdict', right: outcome.caught === 'right' });
  else if ('escaped' in outcome) m.push({ type: 'reveal', player: outcome.escaped });
  else m.push({ type: 'tie', players: outcome.stillTie }, { type: 'stillTie' });
  return m;
}

export interface EveningSpec {
  id?: string;
  players?: string[];
  choices?: Partial<typeof DEFAULT_CHOICES>;
  deals: { wordId?: string; impostor?: string; starter?: string }[];
  moves: Move[];
  status?: 'in-progress' | 'ended';
  t0?: number;
  /** Time between moves, ms. */
  gap?: number;
  /** Times for some moves, by index (overrides the gap). */
  at?: Record<number, number>;
  sessionId?: string;
}
export const SESSION_ID = 'session-imp-test';

/** A SavedGame of IMP-096's shape (format 2, gameType "impostor"), with forced deals in config.testDeals. */
export function savedEvening(s: EveningSpec): any {
  const t0 = s.t0 ?? T0;
  let at = t0;
  const records = s.moves.map((move, i) => {
    at = s.at?.[i] ?? (i === 0 ? t0 : at + (s.gap ?? 20_000));
    return { v: 1, seq: i + 1, at, by: 'host', move };
  });
  return {
    format: 2, gameType: 'impostor', id: s.id ?? 'imp-test-evening', createdAt: t0, updatedAt: records.at(-1)?.at ?? t0,
    status: s.status ?? 'in-progress', sessionId: s.sessionId ?? SESSION_ID,
    setup: {
      gameId: 'impostor',
      seeds: { word: `word-seed-${s.id ?? 'test'}`, starter: `starter-seed-${s.id ?? 'test'}` },
      config: {
        players: s.players ?? P4,
        choices: { ...DEFAULT_CHOICES, ...s.choices },
        excludedWords: { dealtTonight: [], recent: [], blocked: [] },
        testDeals: s.deals,
      },
    },
    records,
  };
}
export const session = (id = SESSION_ID, createdAt = T0 - 60_000) => ({ format: 1, id, name: 'Saturday 3 Oct', createdAt, settlements: [] });

/** Opens the app at `now` on a phone that holds these evenings (and their session), and optional screen state. */
export async function phoneWith(page: Page, evenings: any[], opts: { now: number; ui?: Record<string, unknown>; storage?: Record<string, unknown>; fixed?: boolean }) {
  const storage: Record<string, unknown> = { ...opts.storage };
  for (const e of evenings) {
    storage[`pgn.game.${e.id}`] = e;
    if (e.sessionId) storage[`pgn.session.${e.sessionId}`] = session(e.sessionId, Math.min(e.createdAt - 60_000, T0 - 60_000));
  }
  for (const [id, ui] of Object.entries(opts.ui ?? {})) storage[`pgn.impostor-ui.${id}`] = ui;
  await freshPhone(page, { time: opts.now, storage, fixed: opts.fixed });
}

/** Home → the unfinished Impostor evening (IMP-001: Home's row, "Tap to resume"). */
export async function resumeFromHome(page: Page) {
  const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
  await expect(row.first()).toBeVisible();
  await row.getByText('Tap to resume').or(row.getByRole('button', { name: /Tap to resume/ })).first().click();
}

// ---- Starting an evening on screen ----

/** The "Impostor" game card (IMP-001); not the resume card "Impostor · round 4 · Tap to resume" above it. */
export const impostorCard = (page: Page) =>
  page.getByRole('button', { name: /^Impostor\b/ }).and(page.locator(':not([data-testid="resume-card"])'));
export const playerField = (page: Page) => page.getByLabel('Player name', { exact: true });

/** "Who's playing?": types each name and taps "Add". */
export async function addPlayers(page: Page, names: string[]) {
  for (const n of names) {
    await playerField(page).fill(n);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
}

export const option = (page: Page, group: string, name: string) =>
  page.getByRole('group', { name: group, exact: true }).getByRole('button', { name: new RegExp(`^\\s*${name.replace(/[+]/g, '\\+')}\\s*$`) });

export interface StartOptions {
  players?: string[];
  mode?: 'easy' | 'hard';
  talking?: 'free' | 'timer';
  score?: boolean;
  practice?: boolean;
  seeds?: TestSeeds;
  time?: number;
  storage?: Record<string, unknown>;
  /** false: stop on the read-aloud card. */
  deal?: boolean;
}

/**
 * A new phone → Home → "Host a game" → "Impostor" → names → choices → "Start round" → the read-aloud card →
 * "Start the deal" (or "Practice round first"), ending on the first "Pass the phone to…" screen.
 */
export async function startEvening(page: Page, o: StartOptions = {}) {
  await freshPhone(page, { time: o.time, seeds: o.seeds, storage: o.storage });
  await hostAGame(page).click();
  await impostorCard(page).click();
  await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
  await addPlayers(page, o.players ?? P4);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'How do you want to play?' })).toBeVisible();
  if (o.mode === 'hard') await option(page, 'Mode', 'Hard').click();
  if (o.talking === 'timer') await option(page, 'Talking', 'Timer').click();
  if (o.score) await option(page, 'Score', 'Yes').click();
  await mainButton(page).filter({ hasText: 'Start round' }).click();
  await expect(page.getByRole('heading', { name: 'Read this aloud' })).toBeVisible();
  if (o.deal === false) return;
  if (o.practice) await page.getByRole('button', { name: 'Practice round first', exact: true }).click();
  else await mainButton(page).filter({ hasText: 'Start the deal' }).click();
  await expect(passName(page)).toBeVisible();
}

// ---- The deal (IMP-010 to IMP-018) ----

export const mainButton = (page: Page) => page.getByTestId('main-button');
export const passName = (page: Page) => page.getByTestId('pass-name');
export const holdPad = (page: Page) => page.getByTestId('hold-pad');
export const privateBlock = (page: Page) => page.getByTestId('private-block');
export const privateWord = (page: Page) => page.getByTestId('private-word');
export const imButton = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(`^I'm ${ci(name)}$`) });
export const doneButton = (page: Page) => mainButton(page).filter({ hasText: /^Done, (pass to |everyone's seen)/ });
export const dontKnow = (page: Page) => page.getByRole('button', { name: "Don't know this word?", exact: true });

/**
 * Stops the fake clock from also moving with real time (Playwright's installed clock keeps ticking naturally), so a
 * hold of 499 ms is exactly 499 ms of the app's time. `page.clock.resume()` lets it run naturally again.
 */
export async function freezeClock(page: Page) {
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 50);
}

/** Presses the pad (pointerdown) and keeps it pressed for `ms` of fake time; `release` lets go (pointerup). */
export async function press(page: Page, ms = 0) {
  const box = await holdPad(page).boundingBox();
  if (!box) throw new Error('no hold pad on screen');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  if (ms) await page.clock.runFor(ms);
}
export async function release(page: Page) { await page.mouse.up(); }
/** A hold of `ms`; returns the private block's lines read while held. */
export async function hold(page: Page, ms = 600): Promise<string[]> {
  await press(page, 0);
  await expect(privateBlock(page)).toBeVisible();
  const lines = await blockLines(page);
  await page.clock.runFor(ms);
  await release(page);
  return lines;
}
/** The private block's five children, as text. */
export async function blockLines(page: Page): Promise<string[]> {
  return privateBlock(page).evaluate((el) => Array.from(el.children).map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim()));
}

/** One player's whole turn: "I'm <Name>", a 600 ms hold, "Done…". Returns the block lines they saw. */
export async function turn(page: Page, name: string): Promise<string[]> {
  await expect(passName(page)).toHaveText(new RegExp(`^\\s*${ci(name)}\\s*$`));
  await imButton(page, name).click();
  const lines = await hold(page, 600);
  await doneButton(page).click();
  return lines;
}
/** Everyone's turn in seat order; ends on the clues screen. Returns each player's block lines. */
export async function dealAll(page: Page, players: string[] = P4): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const p of players) out[p] = await turn(page, p);
  await expect(page.getByText('✓ Everyone has seen their word.', { exact: true })).toBeVisible();
  return out;
}

// ---- Menu, talk, vote and reveal ----

export const menuButton = (page: Page) => page.getByRole('button', { name: /Menu/ });
export const menuItem = (page: Page, name: string) => page.getByRole('menuitem', { name, exact: true });
export async function fromMenu(page: Page, item: string) {
  await menuButton(page).click();
  await menuItem(page, item).click();
}
export const revealLines = (page: Page) => page.getByTestId('reveal-line');

/** From the clues screen (Free flow): "Talk it over" → "Vote now" → the countdown → the picker. */
export async function toPicker(page: Page) {
  await mainButton(page).filter({ hasText: /^(Talk it over|Start the 2-minute timer)$/ }).click();
  await mainButton(page).filter({ hasText: 'Vote now' }).click();
  await page.clock.runFor(6000);
  await expect(page.getByRole('heading', { name: 'Who got the most fingers?' })).toBeVisible();
}
export const pickerName = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(`^(✓\\s*)?${ci(name)}(\\s*✓)?$`) });
/** On the picker: tap a name, then "Reveal <Name>", and let the reveal run `ms`. */
export async function reveal(page: Page, name: string, ms = 4000) {
  await pickerName(page, name).click();
  await mainButton(page).filter({ hasText: new RegExp(`^Reveal ${ci(name)}$`) }).click();
  await page.clock.runFor(ms);
}

export const textOf = (l: Locator) => l.evaluateAll((els) => els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()));

/**
 * Things drawn over each other on screen (the reviewer's layout check for IMP-081 and IMP-088, 3 October 2026): pairs
 * of visible controls and text that overlap by more than 1 px. Controls count by their boxes, text by the boxes of its
 * letters (see below); each is clipped by the boxes it scrolls in. An element and what it contains are never a pair. A toast only
 * counts against controls (it is a bar that may lie over text for its few seconds, but never over a button).
 */
export const overlapping = (page: Page): Promise<string[]> => page.evaluate(() => {
  for (const a of document.getAnimations()) { try { a.finish(); } catch { /* endless, such as the build-up dots */ } }
  const SKIP = ['announcer', 'private-live'];
  const CONTROL = 'button, input, [role="button"], [role="switch"], [role="checkbox"]';
  const BOXY = `${CONTROL}, [data-testid="practice-chip"], [data-testid="undo-toast"], [data-testid="toast"]`;
  const TOAST = '[data-testid="undo-toast"], [data-testid="toast"]';
  type R = { l: number; t: number; r: number; b: number };
  const clip = (el: Element, x: R): R | null => {
    let { l, t, r, b } = x;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const c = a.getBoundingClientRect();
      l = Math.max(l, c.left); t = Math.max(t, c.top); r = Math.min(r, c.right); b = Math.min(b, c.bottom);
    }
    l = Math.max(l, 0); t = Math.max(t, 0); r = Math.min(r, window.innerWidth); b = Math.min(b, window.innerHeight);
    return r - l > 1 && b - t > 1 ? { l, t, r, b } : null;
  };
  const items: { el: Element; name: string; rects: R[]; control: boolean; toast: boolean }[] = [];
  for (const el of Array.from(document.querySelectorAll(`${BOXY}, h1, h2, h3, p, li, [data-testid]`))) {
    const id = el.getAttribute('data-testid') ?? '';
    if (SKIP.includes(id) || SKIP.some((s) => el.closest(`[data-testid="${s}"]`))) continue;
    if (!(el as any).checkVisibility?.({ opacityProperty: true, visibilityProperty: true })) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    let raw: R[];
    if (el.matches(BOXY)) {
      const b = el.getBoundingClientRect();
      raw = [{ l: b.left, t: b.top, r: b.right, b: b.bottom }];
    } else {
      raw = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!(n.textContent ?? '').trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        // A line's box is taller than its letters (the space above capitals and below the baseline grows with the
        // font: 200 px digits have about 40 px of empty space above them), so each line counts from 0.2 em below
        // its top to 0.1 em above its bottom.
        const em = parseFloat(getComputedStyle(n.parentElement!).fontSize);
        for (const b of Array.from(range.getClientRects())) raw.push({ l: b.left, t: b.top + 0.2 * em, r: b.right, b: b.bottom - 0.1 * em });
      }
    }
    const rects = raw.map((x) => clip(el, x)).filter((x): x is R => !!x);
    if (!rects.length) continue;
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 28);
    items.push({ el, name: `${id ? `[${id}] ` : `${el.tagName.toLowerCase()} `}"${text}"`, rects, control: el.matches(CONTROL), toast: el.matches(TOAST) });
  }
  const out: string[] = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i]!, b = items[j]!;
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    if ((a.toast && !b.control) || (b.toast && !a.control)) continue;
    const hit = a.rects.some((x) => b.rects.some((y) => Math.min(x.r, y.r) - Math.max(x.l, y.l) > 1 && Math.min(x.b, y.b) - Math.max(x.t, y.t) > 1));
    if (hit) out.push(`${a.name} × ${b.name}`);
  }
  return out;
});
