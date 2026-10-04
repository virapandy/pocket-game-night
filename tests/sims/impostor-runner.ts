// Layer 3 and 4 of docs/proposals/e2e-and-jev-testing.md (owner approved 4 October 2026, "for 200"): a simulated host
// plays a whole Impostor evening through the real app (the preview build) in a hidden browser, choosing among the
// buttons on screen, with the same checks after every step:
//   - one main button at most, and none where the spec says (IMP-080);
//   - no secret word, other name, hint or role in the page outside the hold (IMP-013);
//   - nothing off screen and, on the room screens, nothing drawn over anything else (IMP-081);
//   - no error in the browser console;
//   - the screen is one the spec knows;
//   - never a dead end: the evening always reaches "Next round" or the summary.
// Jev (layer 4) may play the person choosing, as a persona, and rates each new screen ("which button next?"); a screen
// is flagged confusing when Jev's confident choice is not the main button. Jev never judges facts or rules.
// A failing evening is saved (seed, choices, every step) in tests/replays/screen/ and becomes a permanent test
// (tests/browser/impostor-sim-replays.spec.ts replays it step by step).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page } from '@playwright/test';
import {
  WORDS, freezeClock, holdPad, mainButton, overlapping, passName, press, release, startEvening,
} from '../browser/impostor';
import { backgroundAndReturn } from '../browser/helpers';
import type { Jev } from '../sim/jev';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const REPLAY_DIR = `${ROOT}tests/replays/screen`;
export const RESULT_DIR = `${ROOT}reports/sim/screen`;
/** About 30 Jev decisions an evening (the proposal's budget: 50 evenings × 30 = 1,500 a week). */
export const JEV_PER_EVENING = Number(process.env.JEV_PER_EVENING ?? 30);

// ---------- Seeded choices (the same seed always plays the same evening) ----------
export function rngFrom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const next = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, int: (n: number) => Math.floor(next() * n), chance: (p: number) => next() < p, pick: <T>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)]! };
}
export type Rng = ReturnType<typeof rngFrom>;

const SHORT = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Asha', 'Neel', 'Tara', 'Om', 'Isha', 'Ravi'];
const LONG = ['Alexandrapetrova', 'Bhagyashreemani', 'Chandrashekharan', 'Dhananjayapillai', 'Ekaterinavolkova', 'Fatimazahrakhan',
  'Gurpreetsandhuuu', 'Harikrishnanpill', 'Indumathiraghav', 'Jayalakshmiiyer', 'Kamaleshwarnath', 'Lakshminarayana'];
export const SIZES = [[360, 640], [390, 844], [812, 375]] as const;

export interface Persona { id: string; describe: string }
export const PERSONAS: Persona[] = [
  { id: 'slow-grandparent', describe: 'a slow grandparent who reads every word, taps carefully and sometimes taps the wrong thing' },
  { id: 'eager-child', describe: 'an over-eager child who taps fast, presses Back and pokes at every button' },
  { id: 'distracted-host', describe: 'a distracted host who puts the phone down, answers calls and comes back later' },
  { id: 'tying-group', describe: 'a group that keeps tying when they point and cannot agree' },
];

export interface EveningConfig {
  seed: string; width: number; height: number; players: string[]; mode: 'easy' | 'hard'; talking: 'free' | 'timer';
  score: boolean; lastGuess: boolean; practice: boolean; larger: boolean; rounds: number; persona: Persona | null;
}

export function configFor(seed: string, jevPersona: Persona | null): EveningConfig {
  const r = rngFrom(`config:${seed}`);
  const [width, height] = r.pick(SIZES);
  const n = 3 + r.int(10);
  const long = r.chance(0.2);
  const players = (long ? LONG : SHORT).slice(0, n);
  return {
    seed, width, height, players, mode: r.chance(0.35) ? 'hard' : 'easy', talking: r.chance(0.35) ? 'timer' : 'free',
    score: r.chance(0.5), lastGuess: r.chance(0.35), practice: r.chance(0.15), larger: r.chance(0.15), rounds: 2 + r.int(3),
    persona: jevPersona,
  };
}

// ---------- What is on screen ----------
export interface Option { key: string; label: string; kind: 'button' | 'menuitem' | 'switch' | 'action'; main: boolean; locator?: Locator }

/** Names the screen from its markers (the test ids and headings of specs/impostor/README.md). Null: not recognised. */
export async function screenName(page: Page): Promise<string | null> {
  const vis = async (l: Locator) => (await l.count()) > 0 && (await l.first().isVisible().catch(() => false));
  const h = (name: string | RegExp) => page.getByRole('heading', { name, exact: typeof name === 'string' });
  const id = (t: string) => page.getByTestId(t);
  if (await vis(page.getByRole('dialog'))) return 'dialog';
  if (await vis(page.getByRole('menuitem'))) return 'menu';
  if (await vis(h("That's the night!"))) return 'summary';
  if (await vis(h('How to play'))) return 'how-to-play';
  if (await vis(h('More options'))) return 'more-options';
  if (await vis(h('Categories'))) return 'categories';
  if (await vis(h('Players'))) return 'players';
  if (await vis(page.getByRole('switch', { name: 'Larger text', exact: true }))) return 'settings';
  if (await vis(id('history-game')) || await vis(id('history-round')) || await vis(h(/^History/))) return 'history';
  if (await vis(id('build-up'))) return 'build-up';
  if (await vis(page.getByRole('button', { name: 'Guessed right', exact: true }))) return 'verdict';
  if (await vis(id('result-word'))) return 'result';
  if (await vis(id('guess-line'))) return 'guess';
  if (await vis(id('result-headline'))) return 'result';
  if (await vis(id('countdown-heading'))) return 'countdown';
  if (await vis(h('Who got the most fingers?'))) return 'picker';
  if (await vis(id('timer')) || await vis(id('talk-heading'))) return 'talk';
  if (await vis(id('clue-order'))) return 'clues';
  if (await vis(h("You've played every word in these categories tonight!"))) return 'no-words';
  if (await vis(h('This round was left halfway. Start a fresh round?'))) return 'left-halfway';
  if (await vis(h('No problem! New word coming.'))) return 'no-problem';
  if (await vis(holdPad(page))) return 'deal-B';
  if (await vis(passName(page))) return 'deal-A';
  if (await vis(h('How do you want to play?'))) return 'choices';
  if (await vis(h("Who's playing?"))) return 'who';
  if (await vis(h('What shall we play?'))) return 'what';
  if (await vis(page.getByRole('button', { name: /^Host a game/ }))) return 'home';
  return null;
}

/** Every visible, enabled button, menu item and switch, in page order, with the main button marked. */
export async function optionsOnScreen(page: Page): Promise<Option[]> {
  const out: Option[] = [];
  const seen = new Map<string, number>();
  // An open dialog takes every tap: only what is inside it can be chosen.
  const dialog = page.getByRole('dialog');
  const scope = (await dialog.count()) && (await dialog.first().isVisible().catch(() => false)) ? dialog.first() : page.locator('body');
  // An open menu also takes every tap (a tap outside closes it): its items, or Escape, are the choices.
  const menuOpen = (await page.getByRole('menuitem').count()) > 0 && (await page.getByRole('menuitem').first().isVisible().catch(() => false));
  const roles = menuOpen ? ([['menuitem', 'menuitem']] as const) : ([['menuitem', 'menuitem'], ['button', 'button'], ['switch', 'switch']] as const);
  for (const [role, kind] of roles) {
    const all = scope.getByRole(role);
    const n = await all.count();
    for (let i = 0; i < n; i++) {
      const l = all.nth(i);
      if (!(await l.isVisible().catch(() => false)) || !(await l.isEnabled().catch(() => false))) continue;
      const info = await l.evaluate((el) => ({
        label: (el.getAttribute('aria-label') ?? (el.textContent ?? '')).replace(/\s+/g, ' ').trim(),
        main: el.getAttribute('data-testid') === 'main-button',
        inBack: !!el.closest('[aria-hidden="true"], [inert]'),
      })).catch(() => null);
      if (!info || info.inBack || !info.label) continue;
      const base = info.label.slice(0, 40);
      const k = seen.get(base) ?? 0;
      seen.set(base, k + 1);
      out.push({ key: `${kind}:${base}${k ? `#${k}` : ''}`, label: info.label, kind, main: info.main, locator: l });
    }
  }
  return out;
}

// ---------- The checks after every step ----------
export interface Finding { kind: 'dead end' | 'secret shown' | 'layout' | 'main button' | 'console error' | 'not recognised' | 'did not finish' | 'crash'; step: number; screen: string; detail: string }

/** Screens of a round where the spec allows no main button at all (IMP-080). */
const NO_MAIN = new Set(['countdown', 'build-up', 'verdict', 'what']);
/** Room screens that never scroll (IMP-081); the result screen (its guess and verdict steps included) and the summary
 * scroll as one page. */
const ROOM = new Set(['deal-A', 'no-problem', 'clues', 'talk', 'countdown', 'picker', 'build-up']);
/** Screens on which the round's secret must not be in the page (IMP-013, IMP-062). */
const SECRET = new Set(['deal-A', 'deal-B', 'no-problem', 'clues', 'talk', 'countdown', 'picker', 'build-up', 'guess', 'menu', 'dialog', 'how-to-play', 'settings', 'players']);

/**
 * IMP-013 for any word: the terms found in the page's text (hidden elements included), its title, or attribute values,
 * leaving out the app's own markup (class, style, id and test ids) and the words already revealed earlier in the evening
 * (an announcer still holding "The word was Extra chutney" is not this round's "Chutney").
 */
export async function secretsOnPage(page: Page, terms: string[], revealed: string[]): Promise<string[]> {
  return page.evaluate(([terms, revealed]) => {
    const parts = [document.documentElement.textContent ?? '', document.title];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      for (const a of Array.from(el.attributes)) if (!['class', 'style', 'id', 'data-testid'].includes(a.name)) parts.push(a.value);
    }
    const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let text = parts.join('\n');
    for (const w of revealed) text = text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc(w)}(?![\\p{L}\\p{N}])`, 'giu'), ' ');
    return terms.filter((t) => new RegExp(`(?<![\\p{L}\\p{N}])${esc(t)}(?![\\p{L}\\p{N}])`, 'iu').test(text));
  }, [terms, revealed] as const);
}

export async function checkStep(page: Page, screen: string | null, step: number, secretTerms: string[], errors: string[], revealed: string[] = []): Promise<Finding[]> {
  const f: Finding[] = [];
  const s = screen ?? 'unknown';
  if (!screen) f.push({ kind: 'not recognised', step, screen: s, detail: (await page.locator('body').innerText()).slice(0, 160).replace(/\s+/g, ' ') });
  const mains = await mainButton(page).filter({ visible: true }).count();
  const doneShown = screen === 'deal-B' && (await mainButton(page).filter({ hasText: /^Done, / }).isVisible().catch(() => false));
  if (mains > 1) f.push({ kind: 'main button', step, screen: s, detail: `${mains} main buttons` });
  if ((NO_MAIN.has(s) || (screen === 'deal-B' && !doneShown)) && mains > 0) f.push({ kind: 'main button', step, screen: s, detail: 'a main button where the spec has none (IMP-080)' });
  // While a player's block is shown (tap mode, tapped open), the word is in it by design and its layer covers the top of
  // screen B (IMP-010, IMP-013): those two checks wait until it hides.
  const blockShown = await page.getByTestId('private-block').isVisible().catch(() => false);
  if (SECRET.has(s) && secretTerms.length && !blockShown) {
    const found = await secretsOnPage(page, secretTerms, revealed);
    if (found.length) f.push({ kind: 'secret shown', step, screen: s, detail: `in the page: ${found.join(', ')} ${await whereInPage(page, found[0]!)}` });
  }
  const scroll = await page.evaluate(() => ({ h: document.scrollingElement!.scrollHeight > window.innerHeight + 1, w: document.scrollingElement!.scrollWidth > window.innerWidth + 1 }));
  if (scroll.w) f.push({ kind: 'layout', step, screen: s, detail: 'the page scrolls sideways' });
  if (ROOM.has(s) && scroll.h) f.push({ kind: 'layout', step, screen: s, detail: 'a room screen scrolls (IMP-081)' });
  if (mains === 1) {
    const box = await mainButton(page).filter({ visible: true }).boundingBox();
    const vp = page.viewportSize()!;
    if (box && (box.y + box.height > vp.height + 1 || box.y < -1 || box.x < -1 || box.x + box.width > vp.width + 1)) f.push({ kind: 'layout', step, screen: s, detail: 'the main button is not wholly on screen' });
  }
  if (ROOM.has(s) || (s === 'deal-B' && !blockShown)) {
    const over = await overlapping(page);
    if (over.length) f.push({ kind: 'layout', step, screen: s, detail: `drawn over each other: ${over.slice(0, 3).join('; ')}` });
  }
  for (const e of errors.splice(0)) f.push({ kind: 'console error', step, screen: s, detail: e.slice(0, 200) });
  return f;
}

/**
 * Words that are part of the app itself (the spec's strings and test ids, and Home's page, title included). IMP-013:
 * tests only check terms that do not occur there; a word whose hint is "Cover" would otherwise match `privacy-cover`.
 */
let chrome = readFileSync(`${ROOT}specs/impostor/README.md`, 'utf8').toLowerCase();
export function addChrome(text: string) { chrome += `\n${text.toLowerCase()}`; }
const inChrome = (t: string) => new RegExp(`(?<![\\p{L}\\p{N}])${t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u').test(chrome);

/** Where a term sits in the page: the nearest element with a test id (or its tag), whether it is visible, and the text around it. */
async function whereInPage(page: Page, term: string): Promise<string> {
  return page.evaluate((term) => {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu');
    if (re.test(document.title)) return '(in the page title)';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!re.test(n.textContent ?? '')) continue;
      const el = n.parentElement!;
      const host = el.closest('[data-testid]');
      const shown = (el as any).checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? true;
      return `(text in ${host ? `[${host.getAttribute('data-testid')}]` : el.tagName.toLowerCase()}, ${shown ? 'visible' : 'not visible'}: "${(el.textContent ?? '').trim().slice(0, 200)}")`;
    }
    for (const el of Array.from(document.querySelectorAll('*'))) {
      for (const a of Array.from(el.attributes)) if (re.test(a.value)) return `(in the attribute ${a.name}="${a.value.slice(0, 60)}" of ${el.getAttribute('data-testid') ?? el.tagName.toLowerCase()})`;
    }
    return '(in the HTML)';
  }, term);
}

/** The round's secret terms, from what the crew saw while holding (word, other names, hint; category in Hard). */
export function termsFor(word: string | null, mode: 'easy' | 'hard'): string[] {
  if (!word) return [];
  return rawTerms(word, mode).filter((t) => t === "You're the impostor" || !inChrome(t));
}
function rawTerms(word: string, mode: 'easy' | 'hard'): string[] {
  const w = WORDS.find((x) => x.word === word);
  const t = [word, "You're the impostor"];
  if (w) { t.push(...w.other_names.split(' / ').filter(Boolean), w.hint); if (mode === 'hard') t.push(w.category); }
  return t;
}

// ---------- Choosing ----------
export interface Step { n: number; screen: string; action: string }

/** The scripted host: mostly the main button, sometimes a quiet one, the menu, or closing and reopening the app. */
export function scriptedPick(screen: string, opts: Option[], r: Rng, ctx: { roundsDone: number; target: number; persona: string | null; ended: boolean }): string {
  const main = opts.find((o) => o.main);
  const by = (re: RegExp) => opts.filter((o) => re.test(o.label));
  const any = (xs: Option[]) => (xs.length ? r.pick(xs).key : null);
  const tying = ctx.persona === 'tying-group';
  const distracted = ctx.persona === 'distracted-host';
  if (distracted && ['deal-A', 'clues', 'talk', 'picker', 'result'].includes(screen) && r.chance(0.08)) return r.chance(0.5) ? 'action:reopen' : 'action:hide';
  switch (screen) {
    case 'deal-B': {
      const done = by(/^Done, /)[0];
      if (!done) return r.chance(0.04) && by(/^Tap instead$/).length ? by(/^Tap instead$/)[0]!.key : by(/^Tap to see your word$/).length ? by(/^Tap to see your word$/)[0]!.key : 'action:hold';
      if (by(/^Tap to hide$/).length) return by(/^Tap to hide$/)[0]!.key;
      if (r.chance(0.03)) return by(/^Don't know this word\?$/)[0]?.key ?? done.key;
      if (r.chance(0.03)) return 'action:hide';
      return done.key;
    }
    case 'countdown': return r.chance(0.04) ? 'action:reopen' : 'action:wait6000';
    case 'build-up': return 'action:wait1500';
    case 'picker': {
      const pressed = opts.filter((o) => o.kind === 'button' && !o.main && !/^(It's a tie|Count again|Still a tie|··· Menu)$/.test(o.label));
      if (main && /^(Reveal |Point again: )/.test(main.label) && r.chance(0.85)) return main.key;
      if (by(/^Still a tie$/).length && r.chance(tying ? 0.5 : 0.15)) return by(/^Still a tie$/)[0]!.key;
      if (by(/^It's a tie$/).length && r.chance(tying ? 0.5 : 0.08)) return by(/^It's a tie$/)[0]!.key;
      if (by(/^Count again$/).length && r.chance(0.04)) return by(/^Count again$/)[0]!.key;
      return any(pressed) ?? main?.key ?? 'action:wait1000';
    }
    case 'verdict': return any(by(/^(Guessed right|Wrong guess)$/))!;
    case 'result': {
      if (ctx.roundsDone >= ctx.target) return by(/Menu/)[0]?.key ?? main!.key; // then "End the evening"
      if (r.chance(0.04) && by(/^This word didn't work$/).length) return by(/^This word didn't work$/)[0]!.key;
      if (r.chance(0.03) && by(/^Undo$/).length) return by(/^Undo$/)[0]!.key;
      if (r.chance(0.07)) return by(/Menu/)[0]?.key ?? main!.key;
      if (r.chance(0.03)) return 'action:reopen';
      return main!.key;
    }
    case 'menu': {
      if (ctx.roundsDone >= ctx.target && by(/^End the evening$/).length) return by(/^End the evening$/)[0]!.key;
      const safe = opts.filter((o) => o.kind === 'menuitem' && o.label !== 'End the evening');
      if (r.chance(0.1)) return 'action:escape';
      return any(safe) ?? 'action:escape';
    }
    case 'dialog': {
      if (ctx.roundsDone >= ctx.target && by(/^(End the evening|End now)$/).length) return by(/^(End the evening|End now)$/)[0]!.key;
      const keep = by(/^(Keep playing|Keep it|Back|OK|Cancel|Carry on that evening)$/)[0];
      if (keep && r.chance(0.7)) return keep.key;
      const other = opts.filter((o) => o.kind === 'button' && !/^(Discard)$/.test(o.label));
      return any(other) ?? keep?.key ?? 'action:escape';
    }
    case 'summary': {
      if (!ctx.ended && r.chance(0.1) && by(/^Oops, keep playing$/).length) return by(/^Oops, keep playing$/)[0]!.key;
      return main?.key ?? 'action:escape';
    }
    case 'how-to-play': case 'more-options': case 'categories': case 'players':
      if (screen === 'players' && r.chance(0.2)) return any(opts.filter((o) => /^Remove /.test(o.label))) ?? main?.key ?? 'action:back';
      if (r.chance(0.15)) return 'action:back';
      return main?.key ?? by(/^(Done|Close|← Back|Back)$/)[0]?.key ?? 'action:back';
    case 'settings': case 'history':
      return by(/^(← Back|Back|Done|Close)$/).at(-1)?.key ?? 'action:back';
    case 'choices':
      return r.chance(0.85) ? main?.key ?? 'action:back' : 'action:back';
    case 'home':
      return 'action:resume';
    default: {
      if (ctx.persona === 'eager-child' && r.chance(0.08)) return 'action:back';
      if (main && r.chance(0.82)) return main.key;
      const quiet = opts.filter((o) => !o.main && o.kind === 'button' && !/Menu/.test(o.label));
      if (r.chance(0.5) && quiet.length) return r.pick(quiet).key;
      if (r.chance(0.3) && by(/Menu/).length) return by(/Menu/)[0]!.key;
      return main?.key ?? any(opts) ?? 'action:back';
    }
  }
}

// ---------- Playing one evening ----------
export interface EveningResult {
  seed: string; config: EveningConfig; finished: boolean; steps: Step[]; findings: Finding[]; flags: Flag[];
  rounds: number; jevDecisions: number; screens: string[];
}
export interface Flag { screen: string; step: number; jevChoice: string; probability: number; mainButton: string; screenshot: string }

export async function playEvening(page: Page, cfg: EveningConfig, opts: { jev?: Jev | null; replay?: Step[]; shotsDir?: string; maxSteps?: number } = {}): Promise<EveningResult> {
  const r = rngFrom(`play:${cfg.seed}`);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize({ width: cfg.width, height: cfg.height });
  const storage: Record<string, unknown> = {};
  await page.goto('./');
  addChrome(await page.content());
  if (cfg.larger) storage['pgn.pref.largerText'] = true;
  await startEvening(page, {
    players: cfg.players, mode: cfg.mode, talking: cfg.talking, score: cfg.score, practice: cfg.practice, storage,
    seeds: { word: `w-${cfg.seed}`, starter: `s-${cfg.seed}` }, ...(cfg.lastGuess ? { lastGuess: true } : {}),
  });
  // From here the app's clock moves only when the runner moves it (50 ms a step, the waits, the hold), never with the
  // computer's own time: the same seed then plays the same evening on any machine, fast or slow (evening 128 of weekly
  // run 37189752105 replayed differently on a slower computer, where a 5 s "Undo" toast had already gone by step 116).
  await freezeClock(page);
  const steps: Step[] = [];
  const findings: Finding[] = [];
  const flags: Flag[] = [];
  const shots: Buffer[] = [];
  const rated = new Set<string>();
  let word: string | null = null;
  const revealed: string[] = [];
  let roundsDone = 0;
  let ended = false;
  let finished = false;
  let same = 0;
  let last = '';
  let jevDecisions = 0;
  const maxSteps = opts.maxSteps ?? 500;
  const screensSeen = new Set<string>();

  for (let n = 1; n <= maxSteps; n++) {
    await page.clock.runFor(50);
    const screen = await screenName(page);
    screensSeen.add(screen ?? 'unknown');
    if (screen === 'result' && (await page.getByTestId('result-word').isVisible().catch(() => false))) {
      const shown = (await page.getByTestId('result-word').textContent().catch(() => null))?.trim();
      if (shown && !revealed.includes(shown)) revealed.push(shown);
      word = null;
    }
    findings.push(...(await checkStep(page, screen, n, termsFor(word, cfg.mode), errors, revealed)));
    shots.push(await page.screenshot().catch(() => Buffer.alloc(0)));
    if (shots.length > 40) shots.shift();
    if (screen === 'home' && ended) { finished = true; break; }
    const opts2 = await optionsOnScreen(page);
    if (!opts2.length && !['countdown', 'build-up'].includes(screen ?? '')) findings.push({ kind: 'dead end', step: n, screen: screen ?? 'unknown', detail: 'nothing to tap' });
    // Choose: a replay repeats the saved step; otherwise Jev (as a persona) or the scripted host.
    let key: string;
    // A replay repeats the saved steps; once they run out (an evening saved at a crash ends there), the scripted host
    // carries on from the same seed, so a fixed evening can still reach its end and the replay can pass.
    const saved = opts.replay?.[n - 1];
    if (saved) {
      key = saved.action;
    } else if (opts.replay) {
      key = scriptedPick(screen ?? 'unknown', opts2, r, { roundsDone, target: cfg.rounds, persona: null, ended });
    } else {
      key = scriptedPick(screen ?? 'unknown', opts2, r, { roundsDone, target: cfg.rounds, persona: cfg.persona?.id ?? null, ended });
      if (opts.jev && cfg.persona && screen && jevDecisions < JEV_PER_EVENING && opts2.length >= 2 && !['deal-A', 'deal-B', 'countdown', 'build-up'].includes(screen)) {
        const asked = await askJev(opts.jev, cfg, screen, opts2, !rated.has(screen), page);
        jevDecisions += asked.decisions;
        if (asked.flag) { const path = `${opts.shotsDir ?? RESULT_DIR}/${cfg.seed}-flag-${n}.png`; mkdirSync(opts.shotsDir ?? RESULT_DIR, { recursive: true }); await page.screenshot({ path }).catch(() => {}); flags.push({ ...asked.flag, step: n, screenshot: path.replace(ROOT, '') }); }
        rated.add(screen);
        if (asked.choice && !(roundsDone >= cfg.rounds)) key = asked.choice;
      }
    }
    steps.push({ n, screen: screen ?? 'unknown', action: key });
    const sig = `${screen}|${key}`;
    same = sig === last ? same + 1 : 0;
    last = sig;
    if (same >= 25) { findings.push({ kind: 'dead end', step: n, screen: screen ?? 'unknown', detail: `stuck: "${key}" 25 times` }); break; }
    try {
      const learned = await act(page, key, opts2);
      if (learned && learned !== "You're the impostor") word = learned;
    } catch (e: any) {
      findings.push({ kind: 'crash', step: n, screen: screen ?? 'unknown', detail: `could not do "${key}": ${String(e?.message ?? e).split('\n')[0]!.slice(0, 160)}` });
      break;
    }
    if (screen === 'result' && /^button:Next round/.test(key)) roundsDone++;
    if (screen === 'summary' && /Back to Home|Play something else/.test(key)) ended = true;
    if (screen === 'dialog' && /Discard$/.test(key)) ended = true;
  }
  if (!finished) findings.push({ kind: 'did not finish', step: steps.length, screen: steps.at(-1)?.screen ?? 'start', detail: `no summary left after ${steps.length} steps` });
  const result: EveningResult = { seed: cfg.seed, config: cfg, finished, steps, findings, flags, rounds: roundsDone, jevDecisions, screens: [...screensSeen] };
  if (findings.length && !opts.replay) {
    mkdirSync(REPLAY_DIR, { recursive: true });
    writeFileSync(`${REPLAY_DIR}/impostor-${cfg.seed}.json`, JSON.stringify({ $comment: 'A failing simulated evening (layer 3). Replayed step by step by tests/browser/impostor-sim-replays.spec.ts; never delete.', ...result, config: { ...cfg, persona: null } }, null, 1));
    const dir = `${opts.shotsDir ?? RESULT_DIR}/${cfg.seed}`;
    mkdirSync(dir, { recursive: true });
    shots.forEach((b, i) => { if (b.length) writeFileSync(`${dir}/step-${String(steps.length - shots.length + i + 1).padStart(3, '0')}.png`, b); });
  }
  return result;
}

/** Does one step. Returns the word read from the private block when the step was a hold. */
async function act(page: Page, key: string, opts: Option[]): Promise<string | null> {
  if (key === 'action:hold') {
    // The clock is frozen (playEvening): the 500 ms hold is moved on by hand.
    await press(page, 550);
    await expect(page.getByTestId('private-block')).toBeVisible({ timeout: 3000 });
    const w = await page.getByTestId('private-word').textContent().catch(() => null);
    await page.clock.runFor(600);
    await release(page);
    return w?.trim() ?? null;
  }
  if (key.startsWith('action:wait')) { await page.clock.runFor(Number(key.slice(11)) || 1000); return null; }
  if (key === 'action:reopen') {
    await page.reload();
    await page.clock.runFor(200);
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
    if (await row.first().isVisible().catch(() => false)) await row.getByText('Tap to resume').first().click();
    return null;
  }
  if (key === 'action:resume') {
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
    await row.getByText('Tap to resume').first().click({ timeout: 3000 });
    return null;
  }
  if (key === 'action:hide') { await backgroundAndReturn(page); return null; }
  if (key === 'action:back') {
    await page.goBack().catch(() => {});
    // Back past the app's first page leaves it (the browser closes the app on a phone): the host opens it again.
    if (!page.url().includes('/pocket-game-night/')) {
      await page.goto('./');
      await page.clock.runFor(200);
      const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
      if (await row.first().isVisible().catch(() => false)) await row.getByText('Tap to resume').first().click();
    }
    return null;
  }
  if (key === 'action:escape') { await page.keyboard.press('Escape'); return null; }
  const o = opts.find((x) => x.key === key);
  if (!o?.locator) throw new Error(`no option ${key} on screen`);
  const tapToSee = o.label === 'Tap to see your word';
  await waitOutCoveringToast(page, o.locator);
  await o.locator.click({ timeout: 3000 });
  if (tapToSee) {
    const w = await page.getByTestId('private-word').textContent({ timeout: 2000 }).catch(() => null);
    return w?.trim() ?? null;
  }
  return null;
}

/**
 * A toast (README, Terms: a bar above the main button; an undo toast lasts 5 s, others 4 s) may lie over the button
 * the host wants, such as a name chip in the Players sheet at 812 × 375. A real host waits for it to go, so the runner
 * moves the clock on 5.1 s first. Before this, the runner gave up after 3 s and called it a crash (evening 128 of weekly
 * run 37189752105: "Dev left · Undo" over the chip "Asha"). The toast's own buttons ("Undo") are never covered by it.
 */
async function waitOutCoveringToast(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
  const covered = await target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!top && !el.contains(top) && !!top.closest('[data-testid="undo-toast"], [data-testid="toast"]');
  }).catch(() => false);
  if (covered) await page.clock.runFor(5100);
}

/** Layer 4: Jev plays the persona's choice, and (once per screen per evening) rates which button comes next. */
async function askJev(jev: Jev, cfg: EveningConfig, screen: string, opts: Option[], rate: boolean, page: Page): Promise<{ choice: string | null; flag: Omit<Flag, 'step' | 'screenshot'> | null; decisions: number }> {
  const items = opts.slice(0, 12);
  const criteria = Object.fromEntries(items.map((o, i) => [`b${i}`, `Tap "${o.label}"`]));
  const text = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 600);
  const questions: Record<string, any> = {
    act: { type: 'choice', instructions: { question: `You are ${cfg.persona!.describe}, hosting Impostor on one phone at a family party. Which do you tap now?`, screen: text, note: 'Pick what this person would really do. The app decides every result.' }, criteria },
  };
  if (rate) questions.rate = { type: 'choice', instructions: { question: 'You are seeing this phone screen for the first time. Which button would you press next to carry on the game?', screen: text }, criteria };
  if (!jev.available(Object.keys(questions).length)) return { choice: null, flag: null, decisions: 0 };
  const answers = await jev.choose({ game: 'Impostor', screen }, questions);
  if (!answers) return { choice: null, flag: null, decisions: 0 };
  const top = (a: any): [string, number] | null => {
    const probs: Record<string, number> = a?.probabilities ?? {};
    const best = Object.entries(probs).sort((x, y) => y[1] - x[1])[0];
    return best ? [best[0], Number(best[1])] : a?.choice ? [a.choice, Number(a.confidence ?? 0)] : null;
  };
  const act = top(answers.act);
  const choiceIdx = act ? Number(act[0].slice(1)) : NaN;
  const choice = Number.isInteger(choiceIdx) && items[choiceIdx] ? items[choiceIdx]!.key : null;
  let flag: Omit<Flag, 'step' | 'screenshot'> | null = null;
  const main = items.find((o) => o.main);
  const rt = rate ? top(answers.rate) : null;
  if (rt && main) {
    const picked = items[Number(rt[0].slice(1))];
    if (picked && !picked.main && rt[1] >= 0.6) flag = { screen, jevChoice: picked.label, probability: Math.round(rt[1] * 100) / 100, mainButton: main.label };
  }
  return { choice, flag, decisions: Object.keys(questions).length };
}

/** Writes one evening's result for the summary (reports/sim/screen/<seed>.json). */
export function saveResult(res: EveningResult) {
  mkdirSync(RESULT_DIR, { recursive: true });
  writeFileSync(`${RESULT_DIR}/${res.seed}.json`, JSON.stringify({ ...res, steps: res.steps.length }, null, 1));
}
