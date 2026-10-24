// Screen simulations for Secret Words (layers 3 and 4 of docs/proposals/e2e-and-jev-testing.md), in the style of
// impostor-runner.ts: one whole game night played through the real app (the preview build) in a hidden browser, from
// Home, as one of six personas, on one, two or three phones (the map phones are extra browser contexts that open the
// host's code the way a scan or the Join screen does). Names, texts and test ids come from specs/secret-words/README.md
// (Terms, Canonical strings, Test hooks). Report-only: the rules engine is the referee, nothing here judges a rule.
//
// What is checked after every step, on the host phone (and, for the last three, on the map phones too):
//   - at most one main button (the front dialog's, when one is open);
//   - privacy (SWD-025): no face-down board cell tells its kind (accessible name, markup, or any difference between
//     face-down cells), and no map is left in the page of a room screen (the private map and map phones are by design);
//   - nothing scrolls sideways, the main button is wholly on screen, nothing drawn over anything else on the pass,
//     clue and scan screens;
//   - no error in the browser console;
//   - the screen is one the spec knows; never a dead end; a screen with no clear way on (nothing to tap but the menu,
//     pause, flip and help); a persona that stays on one screen for 14 steps is "stuck".
// Jev (layer 4) may play the person choosing, as the persona, and rates each new screen ("which button next?"). Jev never
// sees a map: the screens that show one are never sent. A failing evening is saved (seed, choices, every step) in
// reports/sim/screen/secret-words/<seed>/ with its last 40 screenshots (not in tests/replays/screen/: that folder is
// replayed by the Impostor replay test).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { devices } from '@playwright/test';
import { freezeClock, freshPhone, overlapping, T0 } from '../browser/impostor';
import { backgroundAndReturn } from '../browser/helpers';
import { rngFrom, type Rng } from './impostor-runner';
import type { Jev } from '../sim/jev';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const SW_RESULT_DIR = `${ROOT}reports/sim/screen`;
export const SW_SHOTS_DIR = `${ROOT}reports/sim/screen/secret-words`;
export const JEV_PER_EVENING = Number(process.env.JEV_PER_EVENING ?? 30);
/** App time that passes before every step: past every tap guard (800 ms, 1 s, 1.5 s) and the 500 ms double-tap ignore. */
const STEP_MS = 2000;

// ---------- Who plays ----------
export interface Persona { id: string; describe: string }
export const PERSONAS: Persona[] = [
  { id: 'first-time-host', describe: 'a first-time host who has never seen the app, reads each screen and looks for the help before starting' },
  { id: 'grandparent', describe: 'a grandparent with weak English who reads slowly, taps carefully and sometimes taps the wrong thing' },
  { id: 'ten-year-old', describe: 'a 10-year-old who taps fast, presses Back, picks big numbers and pokes at every button' },
  { id: 'distracted-host', describe: 'a distracted host who puts the phone down, answers calls and comes back later' },
  { id: 'competitive-uncle', describe: 'a competitive uncle who types clue words, argues about clues and wants to win' },
  { id: 'guest-with-link', describe: 'a guest who just opened the link on their own phone and has never heard of the game' },
];

const SHORT = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Asha', 'Neel', 'Tara'];
const LONG = ['Alexandrapetrova', 'Bhagyashreemani', 'Chandrashekharan', 'Dhananjayapillai', 'Ekaterinavolkova', 'Fatimazahrakhan',
  'Gurpreetsandhuuu', 'Harikrishnanpill', 'Indumathiraghav'];
const SIZES = [[360, 640], [390, 844], [812, 375]] as const;
const CLUE_WORDS = ['fruit', 'sport', 'round', 'loud', 'sweet', 'night'];

export interface SwConfig {
  seed: string; index: number; width: number; height: number; players: string[]; persona: Persona; phones: 1 | 2 | 3;
  board: 'full' | 'easy'; landmine: 'lose' | 'turn'; words: 'family' | 'grownups'; timer: boolean; larger: boolean;
  games: number; endEarly: boolean[]; undoOnEnd: boolean; changeAfter: number | null; reloadAt: number[];
  mapOpen: 'link' | 'typed'; endMidGame: boolean; peekHistory: boolean;
}

/** Persona = index mod 6; phones cycle every 6 evenings (guest: two or three), so 18 evenings cover every pair. */
export function swConfigFor(seed: string, index: number): SwConfig {
  const r = rngFrom(`sw-config:${seed}`);
  const persona = PERSONAS[index % PERSONAS.length]!;
  const cycle = Math.floor(index / PERSONAS.length);
  const phones = (persona.id === 'guest-with-link' ? 2 + (cycle % 2) : 1 + (cycle % 3)) as 1 | 2 | 3;
  const [width, height] = r.pick(SIZES);
  const long = r.chance(0.2);
  const n = 4 + r.int(6);
  const games = 1 + r.int(3);
  return {
    seed, index, width, height, players: (long ? LONG : SHORT).slice(0, n), persona, phones,
    board: r.chance(0.5) ? 'full' : 'easy', landmine: r.chance(0.5) ? 'lose' : 'turn', words: r.chance(0.75) ? 'family' : 'grownups',
    timer: r.chance(0.5), larger: r.chance(0.15), games,
    endEarly: Array.from({ length: games }, () => r.chance(0.35)), undoOnEnd: r.chance(0.5),
    changeAfter: games > 1 && r.chance(0.5) ? r.int(games - 1) : null,
    reloadAt: [3 + r.int(10), 20 + r.int(30)], mapOpen: persona.id === 'guest-with-link' || r.chance(0.5) ? 'typed' : 'link',
    endMidGame: games === 1 && r.chance(0.12), peekHistory: r.chance(0.6),
  };
}

// ---------- What is on screen ----------
export interface Option { key: string; label: string; kind: 'button' | 'menuitem' | 'switch' | 'cell' | 'mapcell'; main: boolean; idx: number; testid: string; pressed: string | null; cellIndex: number }
export interface Snap {
  headings: string[]; ids: string[]; dialog: string | null; menuOpen: boolean; opts: Option[]; mains: { label: string; disabled: boolean; attrs: string }[];
  mainsInFront: number; scrollX: boolean; mainOff: boolean; vw: number; vh: number; body: string;
  cells: { index: number; label: string }[]; leaks: string[]; mapInPage: boolean; mapCells: { index: number; label: string }[];
  resumeRow: string | null; savedMap: boolean; text: Record<string, string>; turnTeam: 'orange' | 'teal' | null;
}

/** One round trip: names, buttons (marked data-sim="n" so they can be tapped), main buttons and the privacy facts. */
async function snapshot(page: Page): Promise<Snap> {
  const s = await page.evaluate(() => {
    const vis = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      return (el as any).checkVisibility ? (el as any).checkVisibility({ visibilityProperty: true }) : true;
    };
    const inBack = (el: Element) => !!el.closest('[aria-hidden="true"], [inert]');
    for (const e of Array.from(document.querySelectorAll('[data-sim]'))) e.removeAttribute('data-sim');
    const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open]')).filter(vis);
    const front = dialogs.at(-1) ?? null;
    const nameOf = (d: Element) => {
      const by = d.getAttribute('aria-labelledby');
      const labelled = by ? norm(document.getElementById(by.split(' ')[0]!)?.textContent) : '';
      return labelled || norm(d.getAttribute('aria-label')) || norm((d.querySelector('h1, h2, h3') as HTMLElement | null)?.textContent) || norm((d.querySelector('p') as HTMLElement | null)?.textContent) || norm(d.textContent).slice(0, 60) || 'dialog';
    };
    const headings = Array.from(document.querySelectorAll('h1, h2')).filter((h) => vis(h) && !inBack(h)).map((h) => norm(h.textContent));
    const ids = Array.from(new Set(Array.from(document.querySelectorAll('[data-testid]')).filter((e) => vis(e) && !inBack(e)).map((e) => e.getAttribute('data-testid')!)));
    const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')).filter(vis);
    const menuOpen = menuItems.length > 0;
    const scope: ParentNode = front ?? document.body;
    const sel = menuOpen ? '[role="menuitem"]' : 'button, [role="button"], [role="menuitem"], [role="switch"]';
    const opts: any[] = [];
    let n = 0;
    for (const el of Array.from(scope.querySelectorAll(sel))) {
      if (!vis(el) || inBack(el)) continue;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const label = norm(el.getAttribute('aria-label') ?? el.textContent);
      if (!label) continue;
      const tid = el.getAttribute('data-testid') ?? '';
      el.setAttribute('data-sim', String(n));
      const role = el.getAttribute('role');
      opts.push({
        label, idx: n, testid: tid, main: tid === 'main-button', pressed: el.getAttribute('aria-pressed'),
        kind: tid === 'board-cell' ? 'cell' : role === 'menuitem' ? 'menuitem' : role === 'switch' ? 'switch' : 'button',
        cellIndex: Number(el.getAttribute('data-index') ?? -1),
      });
      n++;
    }
    const mainEls = Array.from(document.querySelectorAll('[data-testid="main-button"]')).filter((e) => vis(e) && (!front || front.contains(e)));
    const mains = mainEls.map((e) => ({ label: norm(e.textContent), disabled: (e as HTMLButtonElement).disabled || e.getAttribute('aria-disabled') === 'true', attrs: Array.from(e.attributes).map((a) => `${a.name}=${a.value}`).join(' ').slice(0, 160) + ' in ' + (() => { const out: string[] = []; for (let a = e.parentElement; a && out.length < 4; a = a.parentElement) out.push(`${a.tagName.toLowerCase()}${a.getAttribute('role') ? `[${a.getAttribute('role')}]` : ''}${a.getAttribute('data-testid') ? `#${a.getAttribute('data-testid')}` : ''}`); return out.join('<'); })() }));
    const vw = window.innerWidth, vh = window.innerHeight;
    const dialogScrolls = !!front && (front as HTMLElement).scrollHeight > (front as HTMLElement).clientHeight + 1;
    const mainOff = !dialogScrolls && mainEls.some((e) => { const r = e.getBoundingClientRect(); return r.bottom > vh + 1 || r.top < -1 || r.left < -1 || r.right > vw + 1; });
    // Board cells: the privacy facts. A face-down cell must not tell its kind in its name, its markup, or by looking
    // different from another face-down cell (apart from being picked).
    const cellEls = Array.from(document.querySelectorAll('[data-testid="word-board"] [data-testid="board-cell"]')).filter(vis);
    const cells = cellEls.map((c) => ({ index: Number(c.getAttribute('data-index')), label: norm(c.getAttribute('aria-label') ?? c.textContent) }));
    const leaks: string[] = [];
    const sigs = new Map<string, string>();
    for (const c of cellEls) {
      const label = norm(c.getAttribute('aria-label') ?? '');
      if (!/, face down$/.test(label)) continue;
      const word = label.replace(/, face down$/, '');
      const clone = c.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-sim');
      // Being picked is shown to the room (a tick and the zoomed word): not a kind.
      clone.querySelectorAll('[data-testid="word-zoom"]').forEach((e) => e.remove());
      clone.querySelectorAll('[aria-hidden="true"]').forEach((e) => { if (/^[✓✔]?$/.test((e.textContent ?? '').trim()) && !e.querySelector('svg')) e.remove(); });
      for (const e of [clone, ...Array.from(clone.querySelectorAll('[class]'))]) {
        const kept = (e.getAttribute('class') ?? '').split(/\s+/).filter((t) => t && !/(select|pick|press|active|focus|hover|flag|zoom|lock)/i.test(t));
        if (kept.length) e.setAttribute('class', kept.join(' ')); else e.removeAttribute('class');
      }
      let html = clone.outerHTML.split(word).join('«word»');
      html = html.replace(/ data-sim="\d+"| data-index="\d+"| style="[^"]*"| aria-pressed="[^"]*"| aria-label="[^"]*"| tabindex="[^"]*"/g, '');
      if (/\b(orange|teal|nobody|landmine|mine)\b|data-kind|team-(orange|teal)/i.test(html.replace(/«word»/g, ''))) leaks.push(`cell ${c.getAttribute('data-index')} (${word}) markup names a kind: ${html.slice(0, 160)}`);
      sigs.set(c.getAttribute('data-index')!, html.replace(/\s+/g, ' '));
    }
    const forms = new Set(sigs.values());
    if (forms.size > 1) leaks.push(`face-down cells differ in markup (${forms.size} forms): ${[...forms].slice(0, 2).map((f) => f.slice(0, 500)).join(' / ')}`);
    const mapCells = Array.from(document.querySelectorAll('[data-testid="map-grid"] [data-testid="map-cell"]')).map((c) => ({ index: Number(c.getAttribute('data-index')), label: norm(c.getAttribute('aria-label') ?? c.textContent) }));
    const t = (id: string) => norm((document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null)?.textContent);
    const resume = document.querySelector('[data-testid="unfinished-games"]');
    const lastMainFront = mainEls.length;
    const colour = (v: string) => { const d = document.createElement('div'); d.style.background = `var(${v})`; document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; };
    const bar = document.querySelector('[data-testid="team-bar"]');
    const barColour = bar ? getComputedStyle(bar).backgroundColor : '';
    const turnTeam = !bar ? null : barColour === colour('--team-orange') ? 'orange' : barColour === colour('--team-teal') ? 'teal' : null;
    return {
      headings, ids, dialog: front ? nameOf(front) : null, menuOpen, opts, mains, mainsInFront: lastMainFront, vw, vh,
      scrollX: document.scrollingElement!.scrollWidth > vw + 1, mainOff, body: norm(document.body.innerText).slice(0, 600),
      cells, leaks, mapInPage: !!document.querySelector('[data-testid="map-grid"], [data-testid="our-words"], [data-testid="avoid-line"]'),
      turnTeam, mapCells, resumeRow: resume && /Secret Words/.test(resume.textContent ?? '') ? norm(resume.textContent) : null,
      savedMap: !!document.querySelector('[data-testid="saved-map"]'),
      text: { boardCheck: t('board-check'), mapCode: t('map-code-text'), firstWords: t('first-words'), toast: t('toast'), undoToast: t('undo-toast'), guessLine: t('guess-line'), whereLine: t('where-line'), gameHeading: t('game-heading') },
    } as any;
  }) as Snap;
  keyed(s.opts);
  return s;
}

/** Names the screen from its markers (specs/secret-words/README.md: headings and test ids). Null: not recognised. */
export function screenOf(s: Snap): string | null {
  const h = (re: RegExp) => s.headings.some((x) => re.test(x));
  const id = (x: string) => s.ids.includes(x);
  if (s.dialog) return 'dialog';
  if (s.menuOpen) return 'menu';
  if (s.opts.some((o) => o.kind === 'switch' && /^Larger text$/.test(o.label))) return 'settings';
  if (id('pause-cover')) return 'paused';
  if (h(/^Tonight's Secret Words$/)) return 'summary';
  if (h(/^How to play$/)) return 'how-to-play';
  if (id('history-game') || id('history-round') || h(/^(History|Sessions)/)) return 'history';
  if (h(/^Secret Words map$/)) return 'map-phone';
  if (h(/^Type the host's code$/)) return 'code-entry';
  if (h(/^Join a game$/)) return 'join';
  if (id('game-heading')) return 'game-over';
  if (id('hold-pad') || id('private-line')) return 'private-map';
  if (h(/^The board, before you start$/)) return 'preview';
  if (h(/^Clue givers: scan this to see the secret map$/)) return 'scan';
  if (id('clue-prompt')) return 'clue';
  if (id('word-board') && s.mains.some((m) => /^Other team's turn$/.test(m.label))) return 'turn-over';
  if (id('word-board') && (id('clue-line') || id('guess-line'))) return 'guessing';
  if (id('word-board')) return 'board';
  if (id('pass-name')) return 'pass';
  if (h(/^Read this aloud$/)) return 'read-aloud';
  if (h(/^How do you want to play\?$/)) return 'choices';
  if (h(/^Make teams$/)) return 'teams';
  if (h(/^Who's playing\?$/)) return 'who';
  if (h(/^What shall we play\?$/)) return 'what';
  if (s.opts.some((o) => /^Host a game/.test(o.label))) return 'home';
  return null;
}

// ---------- The checks after every step ----------
export interface Finding { kind: 'dead end' | 'secret shown' | 'layout' | 'main button' | 'console error' | 'not recognised' | 'did not finish' | 'crash' | 'no clear way on' | 'stuck' | 'map phone'; step: number; screen: string; detail: string; phone?: string }

/** Screens where a map may be in the page by design. */
const MAP_OK = new Set(['private-map', 'map-phone', 'dialog', 'menu']);
/** Buttons that are the screen's chrome, not a way on. */
const CHROME = /Menu|^Pause$|Flip|^How to play$|^Done$/;
/** Screens a persona may legitimately stay on for many steps. */
const LONG_OK = new Set(['guessing', 'map-phone', 'board', 'paused']);

async function checkStep(page: Page, s: Snap, screen: string | null, step: number, errors: string[], phone: string, isHost: boolean): Promise<Finding[]> {
  const f: Finding[] = [];
  const sc = screen ?? 'unknown';
  const add = (kind: Finding['kind'], detail: string) => f.push({ kind, step, screen: sc, detail, phone });
  if (!screen) add('not recognised', s.body.slice(0, 160));
  if (s.mainsInFront > 1) add('main button', `${s.mainsInFront} main buttons: ${s.mains.map((m) => m.label).join(' / ')}`);
  if (s.scrollX) add('layout', 'the page scrolls sideways');
  if (s.mainOff) add('layout', `the main button is not wholly on screen${s.dialog ? ` (in the dialog "${s.dialog}")` : ''}`);
  if (isHost) {
    for (const l of s.leaks) add('secret shown', `a face-down word's kind: ${l}`);
    if (s.mapInPage && !MAP_OK.has(sc)) add('secret shown', `the map is in the page on a room screen (${sc})`);
    if (['pass', 'clue'].includes(sc)) {
      const over = await overlapping(page).catch(() => [] as string[]);
      if (over.length) add('layout', `drawn over each other: ${over.slice(0, 3).join('; ')}`);
    }
  }
  for (const e of errors.splice(0)) add('console error', e.slice(0, 200));
  return f;
}

// ---------- Choosing ----------
export interface Step { n: number; screen: string; action: string; phone?: string }
export interface Ctx {
  cfg: SwConfig; r: Rng; gamesDone: number; gameIndex: number; turnsThisGame: number; undone: boolean; ended: boolean;
  changed: boolean; picked: boolean; started: boolean; typedNames: boolean; historyPeeked: boolean; phonesNow: 1 | 2 | 3;
  kinds: Map<string, string>; wantedTeamOps: number; reloads: number; steps: number; clueTyped: boolean; stepsOnScreen: number;
  endTonightPicked: boolean; sawGameOverFor: number; mapShownThisTurn: boolean; ops: Record<string, any>; oopsUsed: boolean;
}

const has = (opts: Option[], re: RegExp) => opts.filter((o) => re.test(o.label));
const KIND_OF = (label: string): string | null =>
  /, orange team\b/.test(label) ? 'orange' : /, teal team\b/.test(label) ? 'teal' : /, nobody's word\b/.test(label) ? 'nobody' : /, the Landmine\b/.test(label) ? 'landmine' : null;

/** The scripted persona: mostly the main button, sometimes a quiet button, the menu, hiding or reloading. */
export function scriptedPick(screen: string, s: Snap, ctx: Ctx): string {
  const { cfg, r } = ctx;
  const opts = s.opts;
  const p = cfg.persona.id;
  const main = opts.find((o) => o.main);
  const by = (re: RegExp) => has(opts, re);
  const first = (re: RegExp) => by(re)[0]?.key ?? null;
  const any = (xs: Option[]) => (xs.length ? r.pick(xs).key : null);
  const quiet = opts.filter((o) => !o.main && o.kind === 'button' && !CHROME.test(o.label) && o.testid !== 'board-cell' && o.testid !== 'clue-key');
  const distracted = p === 'distracted-host';
  const child = p === 'ten-year-old';
  const grand = p === 'grandparent';
  // The only way on is a main button that is still waiting for its tap guard: a person waits a moment.
  if (!['menu', 'dialog'].includes(screen) && s.mains.length && s.mains.every((m) => m.disabled) && !opts.some((o) => !CHROME.test(o.label) || /^Done$/.test(o.label))) return 'action:wait1500';
  if (distracted && !['home', 'what', 'who', 'dialog', 'menu'].includes(screen) && r.chance(0.07)) return r.chance(0.4) ? 'action:reopen' : r.chance(0.5) ? 'action:hide' : 'action:wait45000';
  if (grand && r.chance(0.07)) return 'action:wait30000';
  if (child && r.chance(0.04) && screen !== 'home') return 'action:back';
  if (ctx.cfg.reloadAt.includes(ctx.steps) && ctx.started && !ctx.ended && !['home', 'dialog', 'menu'].includes(screen)) return 'action:reopen';
  // Persona pokes: a quiet button now and then (never a destructive one: those follow the evening's plan).
  const poke = () => (r.chance(child ? 0.18 : grand ? 0.1 : 0.05) ? any(quiet.filter((o) => !/^(End |Delete|Remove|Start new|New board|Discard)/.test(o.label))) : null);

  switch (screen) {
    case 'home': {
      if (ctx.ended) {
        if (cfg.peekHistory && !ctx.historyPeeked) { ctx.historyPeeked = true; return first(/Menu/) ?? 'action:escape'; }
        return 'action:done';
      }
      if (s.resumeRow) return 'action:resume';
      if (!ctx.started) return 'action:host';
      return 'action:resume';
    }
    case 'what': ctx.picked = false; return 'action:pickgame';
    case 'who': {
      if (!ctx.typedNames || !s.opts.some((o) => /^Next$/.test(o.label))) return 'macro:names';
      if (ctx.changed && r.chance(0.35) && !ctx.ops.addedPlayer) { ctx.ops.addedPlayer = 1; return 'macro:addplayer'; }
      return first(/^Next$/) ?? main?.key ?? 'action:back';
    }
    case 'teams': {
      if (ctx.wantedTeamOps > 0) {
        ctx.wantedTeamOps--;
        const ops = by(/^(Shuffle teams|New team names)$/);
        const choose = by(/^Choose clue givers$/);
        if (choose.length && r.chance(0.3)) return choose[0]!.key;
        if (ops.length) return r.pick(ops).key;
      }
      return main?.key ?? 'action:back';
    }
    case 'choices': {
      if (!ctx.picked) return 'macro:choices';
      if (cfg.persona.id === 'first-time-host' && !ctx.ops.howto && r.chance(0.5)) { ctx.ops.howto = 1; return first(/^How to play$/) ?? main!.key; }
      return main?.key ?? 'action:back';
    }
    case 'read-aloud': {
      ctx.picked = false;
      if (r.chance(0.3)) return first(/^Show me the board first$/) ?? main!.key;
      return main?.key ?? 'action:back';
    }
    case 'preview': return main?.key ?? 'action:back';
    case 'scan': return 'macro:scan';
    case 'pass': {
      ctx.mapShownThisTurn = false;
      if (cfg.timer && !ctx.ops.timerThisTurn && r.chance(0.4)) { ctx.ops.timerThisTurn = 1; return first(/^Start 90-second timer$/) ?? main!.key; }
      return poke() ?? main?.key ?? any(quiet) ?? 'action:escape';
    }
    case 'private-map': {
      const done = by(/^(I have my clue|Done, hide the map|Back to my clue)$/);
      const pad = s.opts.find((o) => o.testid === 'hold-pad');
      if (!ctx.mapShownThisTurn && pad && /see the map/i.test(pad.label)) { ctx.mapShownThisTurn = true; return pad.key; }
      if (ctx.mapShownThisTurn && r.chance(0.25)) {
        const toggles = by(/^(Our words|Whole map|↻ Flip|Flip the board)$/);
        if (toggles.length) return r.pick(toggles).key;
      }
      if (r.chance(0.03)) return first(/^Someone saw the map$/) ?? done[0]?.key ?? 'action:escape';
      if (r.chance(0.03)) return first(/Go back$/) ?? done[0]?.key ?? 'action:escape';
      if (pad && /Tap to hide/i.test(pad.label) && r.chance(0.5)) return pad.key;
      return done[0]?.key ?? pad?.key ?? main?.key ?? 'action:escape';
    }
    case 'clue': {
      const warn = main && /^Clue for /.test(main.label);
      if (!warn) {
        if (!ctx.clueTyped && (p === 'competitive-uncle' ? r.chance(0.5) : r.chance(0.1))) { ctx.clueTyped = true; return 'macro:clueword'; }
        const keys = opts.filter((o) => o.testid === 'clue-key');
        if (keys.length) {
          if (child && r.chance(0.5)) return r.pick(keys).key;
          const pool = keys.filter((o) => /^[1-3]$/.test(o.label) || /^1$|^2$|^3$/.test(o.label));
          return any(pool.length ? pool : keys)!;
        }
      }
      ctx.clueTyped = false;
      if (r.chance(0.04) && by(/^See the map again$/).length) return first(/^See the map again$/)!;
      return main?.key ?? any(quiet) ?? 'action:escape';
    }
    case 'guessing': case 'board': return pickGuessing(s, ctx, main, quiet);
    case 'turn-over': {
      ctx.turnsThisGame++;
      ctx.ops.guessedThisTurn = 0;
      ctx.ops.timerThisTurn = 0;
      if (ctx.cfg.endEarly[ctx.gameIndex] && ctx.turnsThisGame >= 3 && !ctx.ops[`ended${ctx.gameIndex}`]) return first(/Menu/) ?? main!.key;
      if (ctx.cfg.endMidGame && ctx.turnsThisGame >= 4 && !ctx.ops.midEnd) return first(/Menu/) ?? main!.key;
      if (r.chance(0.04)) return first(/Menu/) ?? main!.key;
      return main?.key ?? 'action:escape';
    }
    case 'game-over': return pickGameOver(s, ctx, main, quiet);
    case 'summary': {
      if (!ctx.ended && !ctx.oopsUsed && r.chance(0.12) && by(/^Oops, keep playing$/).length) { ctx.oopsUsed = true; return first(/^Oops, keep playing$/)!; }
      if (r.chance(0.5)) return first(/^← Home$/) ?? main?.key ?? 'action:escape';
      return main?.key ?? first(/^← Home$/) ?? 'action:escape';
    }
    case 'paused': return main?.key ?? first(/^Carry on$/) ?? 'action:escape';
    case 'how-to-play': return first(/^Done$/) ?? main?.key ?? first(/^(← Back|Back)$/) ?? 'action:back';
    case 'settings': case 'history': return by(/^(← Back|Back|Done|Close|← Home)$/).at(-1)?.key ?? 'action:back';
    case 'menu': return pickMenu(s, ctx);
    case 'dialog': return pickDialog(s, ctx, main);
    default: {
      if (main && r.chance(0.82)) return main.key;
      return any(quiet) ?? main?.key ?? any(opts) ?? 'action:back';
    }
  }
}

function pickGuessing(s: Snap, ctx: Ctx, main: Option | undefined, quiet: Option[]): string {
  const { r, cfg } = ctx;
  const p = cfg.persona.id;
  const opts = s.opts;
  const by = (re: RegExp) => has(opts, re);
  const cells = opts.filter((o) => o.kind === 'cell' && /, face down$/.test(o.label));
  const uncle = p === 'competitive-uncle';
  const plain = (xs: Option[]) => (xs.length ? r.pick(xs).key : null);
  // The timer, the dispute, earlier clues, Someone else taps Reveal, Change clue: used by the persona who would.
  if (uncle && r.chance(0.06)) return by(/^Clue not allowed\?$/)[0]?.key ?? by(/Menu/)[0]?.key ?? 'action:escape';
  if (uncle && r.chance(0.04)) return by(/^Change clue$/)[0]?.key ?? 'action:escape';
  if (cfg.timer && !ctx.ops.timerThisTurn && r.chance(0.2)) { ctx.ops.timerThisTurn = 1; return by(/^Start 90-second timer$/)[0]?.key ?? by(/Menu/)[0]?.key ?? 'action:escape'; }
  if (by(/^Stop timer$/).length && r.chance(0.1)) return by(/^Stop timer$/)[0]!.key;
  if (r.chance(0.04)) return by(/^Oops, keep guessing$/)[0]?.key ?? by(/Menu/)[0]?.key ?? 'action:escape';
  if (ctx.cfg.endEarly[ctx.gameIndex] && ctx.turnsThisGame >= 3 && !ctx.ops[`ended${ctx.gameIndex}`]) return by(/Menu/)[0]?.key ?? 'action:escape';
  if (ctx.cfg.endMidGame && ctx.turnsThisGame >= 4 && !ctx.ops.midEnd) return by(/Menu/)[0]?.key ?? 'action:escape';
  const readyMain = main && /^Reveal /.test(main.label);
  if (readyMain && r.chance(0.88)) { ctx.ops.guessedThisTurn = (ctx.ops.guessedThisTurn ?? 0) + 1; return main!.key; }
  const endTurn = by(/^End our turn$/)[0];
  if (endTurn && (ctx.ops.guessedThisTurn ?? 0) >= 1 && r.chance(uncle ? 0.18 : p === 'grandparent' ? 0.3 : 0.12)) { ctx.ops.guessedThisTurn = 0; return endTurn.key; }
  if (main && !/^Reveal /.test(main.label) && !main.label.startsWith('Pick') && r.chance(0.6)) return main.key;
  if (cells.length) {
    // A guesser who has seen the map (uncle) leans on it; the others guess.
    const known = cells.filter((o) => ctx.kinds.get(o.label.replace(/, face down$/, '')) !== undefined);
    const lean = uncle ? 0.8 : p === 'ten-year-old' ? 0.2 : 0.5;
    if (known.length && r.chance(lean)) {
      const mine = known.filter((o) => ctx.kinds.get(o.label.replace(/, face down$/, '')) === ctx.ops.turnKind);
      const safe = known.filter((o) => ctx.kinds.get(o.label.replace(/, face down$/, '')) !== 'landmine');
      const pool = mine.length && r.chance(0.8) ? mine : safe.length ? safe : known;
      return r.pick(pool).key;
    }
    return plain(cells)!;
  }
  return main?.key ?? plain(quiet) ?? by(/Menu/)[0]?.key ?? 'action:escape';
}

function pickGameOver(s: Snap, ctx: Ctx, main: Option | undefined, quiet: Option[]): string {
  const { r, cfg } = ctx;
  const by = (re: RegExp) => has(s.opts, re);
  const first = (re: RegExp) => by(re)[0]?.key ?? null;
  // "Game ended · Undo": the plan may take it back once.
  if (s.text.undoToast && /Undo/.test(s.text.undoToast) && cfg.undoOnEnd && !ctx.undone && ctx.cfg.endEarly[ctx.gamesDone - 1]) {
    const u = by(/^Undo$/)[0];
    if (u) { ctx.undone = true; ctx.gamesDone--; ctx.gameIndex = ctx.gamesDone; ctx.ops[`ended${ctx.gameIndex}`] = 0; return u.key; }
  }
  const more = ctx.gamesDone < cfg.games;
  if (cfg.endMidGame && ctx.ops.midEnd && !ctx.endTonightPicked) { ctx.endTonightPicked = true; return first(/^End for tonight$/) ?? 'action:escape'; }
  if (!more) { ctx.endTonightPicked = true; return first(/^End for tonight$/) ?? first(/^← Home$/) ?? main?.key ?? 'action:escape'; }
  if (cfg.changeAfter !== null && ctx.gamesDone - 1 === cfg.changeAfter && !ctx.changed) {
    const c = first(/^Change teams, players, phones or board$/);
    if (c) { ctx.changed = true; ctx.typedNames = true; ctx.picked = false; ctx.wantedTeamOps = 1 + r.int(2); return c; }
  }
  if (r.chance(0.15) && by(/^Swap clue givers$/).length) return first(/^Swap clue givers$/)!;
  if (r.chance(0.04)) return first(/Menu/) ?? main?.key ?? 'action:escape';
  return main?.key ?? first(/^Play again$/) ?? any1(quiet, r) ?? 'action:escape';
}
function any1(xs: Option[], r: Rng) { return xs.length ? r.pick(xs).key : null; }

function pickMenu(s: Snap, ctx: Ctx): string {
  const { r, cfg } = ctx;
  const by = (re: RegExp) => has(s.opts, re);
  const wantEnd = (cfg.endEarly[ctx.gameIndex] && ctx.turnsThisGame >= 3 && !ctx.ops[`ended${ctx.gameIndex}`]) || (cfg.endMidGame && ctx.turnsThisGame >= 4 && !ctx.ops.midEnd);
  if (wantEnd) {
    const e = by(/^End the game$/)[0];
    if (e) { if (cfg.endMidGame && !cfg.endEarly[ctx.gameIndex]) ctx.ops.midEnd = 1; else ctx.ops[`ended${ctx.gameIndex}`] = 1; return e.key; }
  }
  if (ctx.ended) return by(/^History$/)[0]?.key ?? 'action:escape';
  // Safe items only: the rest of the evening's plan is made at the screens that own it.
  const safe = s.opts.filter((o) => !/^(End the game|End for tonight|New board|Home \(keep this game\))$/.test(o.label));
  if (r.chance(0.12) && by(/^Home \(keep this game\)$/).length) return by(/^Home \(keep this game\)$/)[0]!.key;
  if (r.chance(0.2)) return 'action:escape';
  const pick = safe.filter((o) => !/^Show the map to a clue giver$/.test(o.label) || ctx.phonesNow === 1 || r.chance(0.3));
  return pick.length ? r.pick(pick).key : 'action:escape';
}

function pickDialog(s: Snap, ctx: Ctx, main: Option | undefined): string {
  const { r, cfg } = ctx;
  const name = s.dialog ?? '';
  const by = (re: RegExp) => has(s.opts, re);
  const first = (re: RegExp) => by(re)[0]?.key ?? null;
  if (/^End this game with no winner\?/.test(name)) return first(/^End the game$/) ?? 'action:escape';
  if (/^End for tonight\?/.test(name)) {
    if (ctx.endTonightPicked || cfg.endMidGame || ctx.gamesDone >= cfg.games) return first(/^End for tonight$/) ?? 'action:escape';
    return first(/^Keep playing$/) ?? 'action:escape';
  }
  if (/^Delete tonight's games\?/.test(name)) return first(/^Keep it$/) ?? 'action:escape';
  if (/^Start a new game night\?/.test(name)) return first(/^Carry on that one$/) ?? 'action:escape';
  if (/^New board\?/.test(name)) return r.chance(0.2) ? first(/^New board$/) ?? 'action:escape' : first(/^Keep playing$/) ?? 'action:escape';
  if (/^Clue not allowed\?/.test(name)) return r.chance(0.5) ? first(/^Let it go$/) ?? 'action:escape' : r.chance(0.5) ? first(/^Try another clue$/) ?? 'action:escape' : first(/^Clue rules$/) ?? 'action:escape';
  if (/^Who taps Reveal/.test(name)) { const g = s.opts.filter((o) => o.kind === 'button' && !/^Cancel$/.test(o.label)); return g.length ? r.pick(g).key : first(/^Cancel$/) ?? 'action:escape'; }
  if (/^Show the map to/.test(name)) { const g = s.opts.filter((o) => o.kind === 'button' && !/^Cancel$/.test(o.label)); return g.length && r.chance(0.5) ? r.pick(g).key : first(/^Cancel$/) ?? 'action:escape'; }
  if (/^(Paused)$/.test(name)) return first(/^Carry on$/) ?? 'action:escape';
  if (/^Remove this map/.test(name)) return first(/^Keep it$/) ?? 'action:escape';
  if (/^This phone is the board/.test(name)) return first(/^No, keep the board$/) ?? 'action:escape';
  if (/would have only/.test(name)) return first(/^Don't remove/) ?? 'action:escape';
  if (main) return main.key;
  const keep = by(/^(Keep playing|Keep it|Not yet|Cancel|Done|OK|Back)$/)[0];
  return keep?.key ?? r.pick(s.opts)?.key ?? 'action:escape';
}

// ---------- Playing one evening ----------
export interface Flag { screen: string; step: number; jevChoice: string; probability: number; mainButton: string; screenshot: string }
export interface SwResult {
  seed: string; config: any; finished: boolean; steps: Step[]; findings: Finding[]; flags: Flag[]; games: number; jevDecisions: number;
  screens: string[]; stuckAt: { screen: string; steps: number }[]; noWayOn: string[]; phones: number; guardRescues: number;
}

interface Phone { page: Page; ctx: BrowserContext; errors: string[]; debt: number; label: string }

export async function playSwEvening(host: Page, browser: Browser, baseURL: string, cfg: SwConfig, opts: { jev?: Jev | null } = {}): Promise<SwResult> {
  const r = rngFrom(`sw-play:${cfg.seed}`);
  const errors: string[] = [];
  host.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  host.on('pageerror', (e) => errors.push(String(e)));
  await host.setViewportSize({ width: cfg.width, height: cfg.height });
  const storage: Record<string, unknown> = { 'pgn.test.seeds': { deal: `deal-${cfg.seed}`, teams: `teams-${cfg.seed}` } };
  if (cfg.larger) storage['pgn.pref.largerText'] = true;
  await freshPhone(host, { time: T0, storage });
  await freezeClock(host);

  const ctx: Ctx = {
    cfg, r, gamesDone: 0, gameIndex: 0, turnsThisGame: 0, undone: false, ended: false, changed: false, picked: false, started: false,
    typedNames: false, historyPeeked: false, phonesNow: cfg.phones, kinds: new Map(), wantedTeamOps: r.chance(0.5) ? 1 : 0, reloads: 0, steps: 0,
    clueTyped: false, stepsOnScreen: 0, endTonightPicked: false, sawGameOverFor: -1, mapShownThisTurn: false, ops: {}, oopsUsed: false,
  };
  const steps: Step[] = [];
  const findings: Finding[] = [];
  const flags: Flag[] = [];
  const shots: Buffer[] = [];
  const rated = new Set<string>();
  const screensSeen = new Set<string>();
  const stuckAt: { screen: string; steps: number }[] = [];
  const noWay = new Set<string>();
  const maps: Phone[] = [];
  let connectedCode = '';
  let jevDecisions = 0;
  let finished = false;
  let same = 0;
  let last = '';
  let stay = 0;
  let lastScreen = '';
  let stuckReported = false;
  let emptyRun = 0;
  let mainWait = 0;
  let baseScreen = '';
  let guardRescues = 0;
  const maxSteps = Number(process.env.SW_MAX_STEPS ?? 3000);

  const tickHost = (ms: number) => host.clock.runFor(ms);
  const tickMaps = (ms: number) => { for (const m of maps) m.debt += ms; };
  const tick = async (ms: number) => { await tickHost(ms); tickMaps(ms); };
  const syncMap = async (m: Phone) => { if (m.debt > 0) { const d = m.debt; m.debt = 0; await m.page.clock.runFor(Math.min(d, 600_000)).catch(() => {}); } };

  const addFinding = (kind: Finding['kind'], step: number, screen: string, detail: string, phone = 'host') => findings.push({ kind, step, screen, detail, phone });
  const clickOpt = async (page: Page, o: { idx: number }) => page.locator(`[data-sim="${o.idx}"]`).first().click({ timeout: 3000 });

  // ----- The map phones: other browser contexts that open the host's code the way a scan or the Join screen does -----
  async function newMapPhone(label: string): Promise<Phone> {
    const context = await browser.newContext({ ...devices['Pixel 7'], baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errs: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push(String(e)));
    await freshPhone(page, { time: T0, storage: cfg.larger ? { 'pgn.pref.largerText': true } : {} });
    await freezeClock(page);
    return { page, ctx: context, errors: errs, debt: 0, label };
  }
  async function hostTeamsInfo(): Promise<{ pair: string | null; names: { orange: string; teal: string } | null }> {
    return host.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (!k.startsWith('pgn.game.')) continue;
        try {
          const g = JSON.parse(localStorage.getItem(k)!);
          if (g?.gameType === 'secret-words' || g?.setup?.gameId === 'secret-words') {
            const t = g.setup?.config?.teams?.names;
            return { pair: t?.id ?? null, names: t ? { orange: t.orange, teal: t.teal } : null };
          }
        } catch { /* not ours */ }
      }
      return { pair: null, names: null };
    });
  }
  const shownCode = (s: Snap) => (/([2-9A-HJKMNP-Z]{3})-([2-9A-HJKMNP-Z]{4})/.exec(s.text.mapCode)?.slice(1, 3).join('') ?? '');

  async function mapSnap(m: Phone) { await syncMap(m); return snapshot(m.page); }
  function learnKinds(s: Snap) {
    for (const c of s.mapCells) {
      const k = KIND_OF(c.label);
      if (k) ctx.kinds.set(c.label.split(',')[0]!, k);
    }
  }
  async function mapStep(m: Phone, n: number, who: string, maxActs: number) {
    // Looks at the map phone, optionally fades a word, switches lists, hides and shows, opens Clue rules; reads the map for the guessers' sake.
    for (let a = 0; a < maxActs; a++) {
      await m.page.clock.runFor(900).catch(() => {});
      const s = await mapSnap(m);
      learnKinds(s);
      const sc = screenOf(s);
      if (sc === 'dialog') {
        const o = s.opts.find((x) => /^(Keep it|Not yet|Cancel|Done|OK)$/.test(x.label)) ?? s.opts[0];
        if (o) await clickOpt(m.page, o).catch(() => {});
        continue;
      }
      if (sc !== 'map-phone') break;
      const o = r.pick(s.opts.filter((x) => /^(Orange team's words|Teal team's words|Whole map|Hide map|Show map|Clue rules)$/.test(x.label) || x.kind === 'mapcell' || x.testid === 'map-cell'));
      if (!o) break;
      await clickOpt(m.page, o).catch(() => {});
    }
    void n; void who;
  }
  async function openMap(m: Phone, code: string, teamId: string | null, own: boolean, how: 'link' | 'typed', step: number) {
    const s0 = await mapSnap(m);
    if (how === 'link' || screenOf(s0) === 'map-phone') {
      await m.page.goto('about:blank');
      await m.page.goto(`./#map=${code}${teamId ? `&t=${teamId}` : ''}${own ? '&p=own' : ''}`);
    } else {
      await m.page.goto('./');
      await m.page.clock.runFor(STEP_MS);
      await m.page.getByRole('button', { name: /^Join a game/ }).click({ timeout: 4000 });
      await m.page.clock.runFor(STEP_MS);
      await m.page.getByRole('button', { name: "Type the host's code", exact: true }).click({ timeout: 4000 });
      await m.page.clock.runFor(STEP_MS);
      await m.page.getByLabel("Host's code", { exact: true }).fill(`${code.slice(0, 3)}-${code.slice(3)}`.toLowerCase());
      await m.page.clock.runFor(STEP_MS);
      await m.page.getByRole('button', { name: 'Open the map', exact: true }).click({ timeout: 4000 });
    }
    await m.page.clock.runFor(STEP_MS);
    const s = await mapSnap(m);
    if (screenOf(s) !== 'map-phone') addFinding('map phone', step, screenOf(s) ?? 'unknown', `${m.label}: the map did not open from ${how === 'link' ? 'the link' : 'the typed code'} (${s.body.slice(0, 100)})`, m.label);
    learnKinds(s);
  }
  async function pickMyTeam(m: Phone, i: number, names: { orange: string; teal: string } | null) {
    const s = await mapSnap(m);
    if (!s.ids.includes('my-team')) return;
    const want = names ? (i === 0 ? names.orange : names.teal) : null;
    const o = s.opts.find((x) => want && x.label === want) ?? s.opts.find((x) => !x.main && /Chai|Coffee|[A-Z]/.test(x.label) && !/^(Hide|Show|Next|Clue|Done|Whole|Orange|Teal)/.test(x.label));
    if (o) await clickOpt(m.page, o).catch(() => {});
  }
  /** At the host's scan screen: every map phone gets the map (a new code is opened, "Next map" is tapped otherwise). */
  async function connectMaps(hs: Snap, step: number) {
    const need = ctx.phonesNow - 1;
    while (maps.length > need) { const m = maps.pop()!; await m.ctx.close().catch(() => {}); }
    const code = shownCode(hs);
    const info = await hostTeamsInfo();
    const check = hs.text.boardCheck;
    const firstWords = /with: (.+?)(?:\.| Riya|$)/.exec(check)?.[1] ?? '';
    for (let i = 0; i < need; i++) {
      if (!maps[i]) maps[i] = await newMapPhone(`map phone ${i + 1}`);
      const m = maps[i]!;
      if (!code) { addFinding('map phone', step, 'scan', 'no map code on the scan screen', m.label); continue; }
      const fresh = (await mapSnap(m));
      const onMap = screenOf(fresh) === 'map-phone';
      const newCode = /^New code|scan this code/.test(check) || !/Next map/.test(check) || !onMap || connectedCode === '';
      if (onMap && code === connectedCode) {
        // The same deal again (a reload, a return to the scan screen): the map phone already has this map.
      } else if (newCode) {
        const how = cfg.persona.id === 'guest-with-link' && i === 0 && connectedCode === '' ? 'typed' : cfg.mapOpen;
        await openMap(m, code, info.pair, ctx.phonesNow === 3, how, step);
        if (ctx.phonesNow === 3) await pickMyTeam(m, i, info.names);
        if (cfg.persona.id === 'distracted-host' && r.chance(0.3)) { await m.page.reload(); await m.page.clock.runFor(900); const s2 = await mapSnap(m); const row = s2.opts.find((o) => o.testid === 'saved-map' || /^Secret Words map /.test(o.label)); if (row) await clickOpt(m.page, row).catch(() => {}); }
      } else {
        // The next board of the same deck: "Next map" on the map phone, then confirm.
        const s = await mapSnap(m);
        const next = s.opts.find((o) => o.label === 'Next map');
        if (!next) addFinding('map phone', step, 'map-phone', `${m.label}: no "Next map" button (${s.body.slice(0, 80)})`, m.label);
        else {
          await m.page.clock.runFor(1500);
          await clickOpt(m.page, (await mapSnap(m)).opts.find((o) => o.label === 'Next map') ?? next);
          for (let tries = 0; tries < 3; tries++) {
            await m.page.clock.runFor(1500);
            const d = await mapSnap(m);
            // SWD-121: while "Still looking? Tap to keep the map" shows, the first tap only removes it; tap Next map again.
            if (tries === 0 && !d.dialog && !d.text.toast) { await clickOpt(m.page, d.opts.find((o) => o.label === 'Next map') ?? next).catch(() => {}); await m.page.clock.runFor(1500); }
            const d2 = tries === 0 ? await mapSnap(m) : d;
            const confirm = d2.opts.find((o) => o.label === 'Next map' && d2.dialog);
            if (d2.dialog && confirm) { await clickOpt(m.page, confirm).catch(() => {}); break; }
            if (!d2.dialog && d2.text.toast) break;
            if (tries === 2) addFinding('map phone', step, 'map-phone', `${m.label}: "Next map" tapped, then neither a dialog nor a toast (${await m.page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Not yet/.test(x.textContent ?? '')); const out: string[] = []; for (let a: Element | null = b ?? null; a && out.length < 6; a = a.parentElement) { const r = a.getBoundingClientRect(); out.push(`<${a.tagName.toLowerCase()} role=${a.getAttribute('role')} modal=${a.getAttribute('aria-modal')} class=${a.getAttribute('class')} ${Math.round(r.width)}x${Math.round(r.height)} open=${a.hasAttribute('open')}>`); } return out.join(' < '); })} ${d.body.slice(0, 100)}; buttons: ${d.opts.map((o) => o.label).join(' | ').slice(0, 120)})`, m.label);
          }
        }
      }
      await m.page.clock.runFor(900);
      const after = await mapSnap(m);
      learnKinds(after);
      if (firstWords && screenOf(after) === 'map-phone') {
        const wants = firstWords.split(' · ').map((w) => w.trim()).filter(Boolean);
        const got = after.text.firstWords;
        if (wants.length && !wants.every((w) => got.includes(w))) addFinding('map phone', step, 'map-phone', `${m.label}: first words "${got}" do not match the host's board check "${firstWords}" (host: "${check.slice(0, 120)}"; phone toast: "${after.text.toast}"; code ${code})`, m.label);
      }
      const maxActs = cfg.persona.id === 'guest-with-link' ? 4 + r.int(6) : r.int(3);
      await mapStep(m, step, m.label, maxActs);
      if (cfg.persona.id === 'guest-with-link' && opts.jev && jevDecisions < JEV_PER_EVENING) {
        const sm = await mapSnap(m);
        const labels = sm.opts.map((o) => o.label).slice(0, 12);
        const asked = await askJevLabels(opts.jev, cfg, 'map-phone', sm.headings, labels, !rated.has('map-phone:guest'));
        jevDecisions += asked.decisions; rated.add('map-phone:guest');
        if (asked.choice !== null && labels[asked.choice]) { const o = sm.opts[asked.choice]!; if (!/^Done with this game$/.test(o.label)) await clickOpt(m.page, o).catch(() => {}); }
      }
    }
    connectedCode = code || connectedCode;
  }

  // ----- The macros: typing names and choosing the options (the same taps a person makes) -----
  async function macro(key: string, s: Snap, step: number) {
    if (key === 'macro:names') {
      const field = host.getByLabel('Player name', { exact: true });
      for (const nm of cfg.players) { await field.fill(nm); await field.press('Enter'); }
      ctx.typedNames = true;
    } else if (key === 'macro:addplayer') {
      const field = host.getByLabel('Player name', { exact: true });
      await field.fill('Neha'); await field.press('Enter');
    } else if (key === 'macro:choices') {
      const pick = async (name: string) => { await host.getByRole('button', { name, exact: true }).click({ timeout: 3000 }).catch(() => addFinding('crash', step, 'choices', `could not tap "${name}"`)); };
      let phones = cfg.phones;
      let board = cfg.board;
      if (ctx.changed) { phones = (cfg.persona.id === 'guest-with-link' ? r.pick([2, 3] as const) : r.pick([1, 2, 3] as const)); board = r.chance(0.5) ? 'full' : 'easy'; }
      ctx.phonesNow = phones as 1 | 2 | 3;
      await pick(phones === 1 ? 'One phone' : phones === 2 ? 'Two phones' : 'Three phones');
      await host.clock.runFor(900);
      await pick(board === 'full' ? 'Full: 25 words' : 'Easy: 16 words');
      if (board === 'full') { await host.clock.runFor(900); await pick(cfg.landmine === 'lose' ? 'Lose the game' : 'Lose your turn'); }
      if (cfg.words === 'grownups') { await host.clock.runFor(900); await pick('+ Harder words'); }
      ctx.picked = true;
    } else if (key === 'macro:clueword') {
      await host.getByLabel('Clue word (optional)', { exact: true }).fill(r.pick(CLUE_WORDS)).catch(() => {});
    } else if (key === 'macro:scan') {
      if (ctx.phonesNow > 1) await connectMaps(s, step);
      await host.clock.runFor(STEP_MS);
      const s2 = await snapshot(host);
      const main = s2.opts.find((o) => o.main);
      if (main) await clickOpt(host, main);
      else addFinding('dead end', step, 'scan', 'no main button on the scan screen after the maps were opened');
    }
  }

  // ----- The loop -----
  for (let n = 1; n <= maxSteps; n++) {
    ctx.steps = n;
    await tick(STEP_MS);
    const s = await snapshot(host);
    const screen = screenOf(s);
    screensSeen.add(screen ?? 'unknown');
    if (screen && ['scan', 'pass', 'preview', 'clue', 'guessing'].includes(screen)) ctx.started = true;
    if (screen === 'private-map' || s.mapCells.length) learnKinds(s);
    // Whose turn it is (for the competitive uncle's leaning): the team the map says is "you give clues for", else the clue-line.
    findings.push(...(await checkStep(host, s, screen, n, errors, 'host', true)));
    for (const m of maps) findings.push(...(await checkStep(m.page, await mapSnap(m), 'map-phone', n, m.errors, m.label, false)));
    // A game is over when game over appears after a game screen (menus, dialogs and Settings in between do not count).
    if (screen && !['menu', 'dialog', 'settings', 'history', 'how-to-play', 'paused'].includes(screen)) {
      if (screen === 'game-over' && baseScreen !== 'game-over') { ctx.gamesDone++; ctx.turnsThisGame = 0; ctx.gameIndex = ctx.gamesDone; ctx.kinds.clear(); }
      baseScreen = screen;
    }
    shots.push(await host.screenshot().catch(() => Buffer.alloc(0)));
    if (shots.length > 40) shots.shift();
    if (screen === 'home' && ctx.ended && (!cfg.peekHistory || ctx.historyPeeked) && !s.menuOpen && screen === 'home') { finished = true; break; }

    // Stuck: the persona stays on one screen for a long time.
    if (screen === lastScreen) stay++; else { stay = 0; stuckReported = false; }
    lastScreen = screen ?? '';
    if (stay >= 14 && !stuckReported && screen && !LONG_OK.has(screen)) {
      stuckReported = true;
      stuckAt.push({ screen, steps: stay });
      addFinding('stuck', n, screen, `${cfg.persona.id} stayed on this screen for ${stay} steps`);
    }
    // A main button that stays disabled (or guarded) for 6 steps in a row, 12 s of the app's time: nothing tells the persona what to do.
    if (screen && s.mains.length === 1 && s.mains[0]!.disabled && !s.opts.some((o) => o.main)) {
      mainWait++;
      if (mainWait === 6 && !['clue'].includes(screen)) {
        // The runner's clock is frozen: let real time run for 2.5 s. If the guard clears, it was the frozen clock, not the app.
        await host.clock.resume();
        await host.waitForTimeout(2500);
        const again = await snapshot(host);
        await freezeClock(host);
        if (again.opts.some((o) => o.main)) { guardRescues++; mainWait = 0; }
        else addFinding('stuck', n, screen, `the main button "${s.mains[0]!.label}" stayed disabled for 6 steps (12 s) and for 2.5 s of real time as well: ${s.mains[0]!.attrs}`);
      }
    } else mainWait = 0;
    // A screen with no clear way on.
    const forward = s.opts.filter((o) => !CHROME.test(o.label));
    if (screen && !['menu', 'dialog'].includes(screen) && forward.length === 0 && !s.mains.length) {
      emptyRun++;
      if (emptyRun >= 3) { noWay.add(screen); addFinding(s.opts.length ? 'no clear way on' : 'dead end', n, screen, s.opts.length ? `only the menu and chrome can be tapped: ${s.opts.map((o) => o.label).join(' / ').slice(0, 120)}` : 'nothing to tap'); emptyRun = 0; }
    } else emptyRun = 0;

    // Choose: Jev (as the persona) on a new screen, otherwise the scripted persona.
    let key = scriptedPick(screen ?? 'unknown', s, ctx);
    if (opts.jev && screen && jevDecisions < JEV_PER_EVENING && !['private-map', 'map-phone', 'guessing', 'board', 'menu', 'dialog'].includes(screen) && s.opts.filter((o) => o.kind !== 'cell').length >= 2 && r.chance(0.6)) {
      // How to play covers the page: only its own way out is a choice (the buttons behind it, such as Menu, cannot be tapped).
      const labels = s.opts.filter((o) => o.kind !== 'cell' && (screen !== 'how-to-play' || /^(Done|← Back|Back)$/.test(o.label))).slice(0, 12);
      const asked = await askJevLabels(opts.jev, cfg, screen, s.headings, labels.map((o) => o.label), !rated.has(screen), labels.findIndex((o) => o.main));
      jevDecisions += asked.decisions;
      rated.add(screen);
      if (asked.flag) { const path = `${SW_SHOTS_DIR}/${cfg.seed}-flag-${n}.png`; mkdirSync(SW_SHOTS_DIR, { recursive: true }); await host.screenshot({ path }).catch(() => {}); flags.push({ screen, step: n, ...asked.flag, screenshot: path.replace(ROOT, '') }); }
      // Only a button the plan allows: Jev may not end the evening or the game, or change the setup, on the persona's behalf.
      const chosen = asked.choice !== null ? labels[asked.choice] : null;
      if (chosen && (chosen.main || !/^(End |Delete|Start new|New board|Remove|Discard|Change teams|Home \(keep)/.test(chosen.label)) && !['who', 'choices', 'game-over'].includes(screen)) key = chosen.key;
    }
    steps.push({ n, screen: screen ?? 'unknown', action: key });
    const sig = `${screen}|${key}|${screen === 'guessing' ? s.cells.filter((c) => /face down/.test(c.label)).length : ''}`;
    same = sig === last ? same + 1 : 0;
    last = sig;
    if (same >= 25) { addFinding('dead end', n, screen ?? 'unknown', `stuck: "${key}" 25 times`); break; }
    try {
      if (key.startsWith('macro:')) await macro(key, s, n);
      else await act(host, key, s, n);
    } catch (e: any) {
      addFinding('crash', n, screen ?? 'unknown', `could not do "${key}": ${String(e?.message ?? e).split('\n')[0]!.slice(0, 160)}`);
      break;
    }
    if (screen === 'summary' && /← Home|Play something else/.test(key)) ctx.ended = true;
    if (screen === 'dialog' && /Start new \(ends that one\)$/.test(key)) ctx.ended = true;
    if (key === 'action:done') { finished = true; break; }
    // Whose words the guessers want: the colour of the team bar.
    if (s.turnTeam) ctx.ops.turnKind = s.turnTeam as any;
  }
  if (!finished) addFinding('did not finish', steps.length, steps.at(-1)?.screen ?? 'start', `no Home after the summary in ${steps.length} steps`);
  const result: SwResult = {
    seed: cfg.seed, config: { ...cfg, persona: cfg.persona.id }, finished, steps, findings, flags, games: ctx.gamesDone, jevDecisions,
    screens: [...screensSeen], stuckAt, noWayOn: [...noWay], phones: cfg.phones, guardRescues,
  };
  if (findings.length) {
    const dir = `${SW_SHOTS_DIR}/${cfg.seed}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/replay.json`, JSON.stringify({ $comment: 'A failing simulated Secret Words evening (layer 3): the seed and every step. No config key on purpose: the summary counts the evening from reports/sim/screen/sw-<seed>.json.', seed: cfg.seed, steps, findings }, null, 1));
    shots.forEach((b, i) => { if (b.length) writeFileSync(`${dir}/step-${String(steps.length - shots.length + i + 1).padStart(4, '0')}.png`, b); });
  }
  for (const m of maps) await m.ctx.close().catch(() => {});
  return result;
}

/** Does one step on the host. */
async function act(page: Page, key: string, s: Snap, step: number) {
  if (key === 'action:done') return;
  if (key.startsWith('action:wait')) { await page.clock.runFor(Number(key.slice(11)) || 1000); return; }
  if (key === 'action:hide') { await backgroundAndReturn(page); return; }
  if (key === 'action:escape') { await page.keyboard.press('Escape'); return; }
  if (key === 'action:back') {
    await page.goBack().catch(() => {});
    if (!page.url().includes('/pocket-game-night/')) await page.goto('./');
    return;
  }
  if (key === 'action:reopen') {
    await page.reload();
    await page.clock.runFor(STEP_MS);
    return;
  }
  if (key === 'action:host') { await page.getByRole('button', { name: /^Host a game/ }).click({ timeout: 3000 }); return; }
  if (key === 'action:pickgame') {
    await page.getByRole('button', { name: /^Secret Words/ }).and(page.locator(':not([data-testid="resume-card"])')).click({ timeout: 3000 });
    return;
  }
  if (key === 'action:resume') {
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Secret Words/ });
    await row.getByText('Tap to resume').first().click({ timeout: 3000 });
    return;
  }
  const o = s.opts.find((x) => x.key === key);
  if (!o) throw new Error(`no option ${key} on screen (step ${step})`);
  // A toast (such as "Game ended · Undo", 10 s) may lie over the button: a person waits for it to go.
  const covered = await page.locator(`[data-sim="${o.idx}"]`).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!top && !el.contains(top) && !!top.closest('[data-testid="undo-toast"], [data-testid="toast"]');
  }).catch(() => false);
  if (covered) { await page.clock.runFor(10500); await page.locator(`[data-sim="${o.idx}"]`).first().scrollIntoViewIfNeeded().catch(() => {}); }
  await page.locator(`[data-sim="${o.idx}"]`).first().click({ timeout: 3000 });
}

function keyed(opts: Option[]) {
  const seen = new Map<string, number>();
  for (const o of opts) {
    const base = `${o.kind}:${o.label.slice(0, 40)}`;
    const k = seen.get(base) ?? 0;
    seen.set(base, k + 1);
    o.key = `${base}${k ? `#${k}` : ''}`;
  }
  return opts;
}

/** Layer 4: Jev plays the persona's choice among the labels, and (once per screen per evening) rates which button comes next. */
async function askJevLabels(jev: Jev, cfg: SwConfig, screen: string, headings: string[], labels: string[], rate: boolean, mainIdx = -1): Promise<{ choice: number | null; flag: { jevChoice: string; probability: number; mainButton: string } | null; decisions: number }> {
  const criteria = Object.fromEntries(labels.map((l, i) => [`b${i}`, `Tap "${l}"`]));
  // Never the page text: it may hold a map. Only the headings and the names of the buttons are sent.
  const text = `Screen: ${headings.join(' / ')}. Buttons: ${labels.join(' | ')}`.slice(0, 600);
  const questions: Record<string, any> = {
    act: { type: 'choice', instructions: { question: `You are ${cfg.persona.describe}, playing Secret Words (a team word game) at a family party. Which do you tap now?`, screen: text, note: 'Pick what this person would really do. The app decides every result.' }, criteria },
  };
  if (rate) questions.rate = { type: 'choice', instructions: { question: 'You are seeing this phone screen for the first time. Which button would you press next to carry on the game?', screen: text }, criteria };
  if (!jev.available(Object.keys(questions).length)) return { choice: null, flag: null, decisions: 0 };
  const answers = await jev.choose({ game: 'Secret Words', screen }, questions);
  if (!answers) return { choice: null, flag: null, decisions: 0 };
  const top = (a: any): [string, number] | null => {
    const probs: Record<string, number> = a?.probabilities ?? {};
    const best = Object.entries(probs).sort((x, y) => y[1] - x[1])[0];
    return best ? [best[0], Number(best[1])] : a?.choice ? [a.choice, Number(a.confidence ?? 0)] : null;
  };
  const act = top(answers.act);
  const idx = act ? Number(act[0].slice(1)) : NaN;
  const choice = Number.isInteger(idx) && labels[idx] !== undefined ? idx : null;
  let flag: { jevChoice: string; probability: number; mainButton: string } | null = null;
  const rt = rate ? top(answers.rate) : null;
  if (rt && mainIdx >= 0) {
    const j = Number(rt[0].slice(1));
    if (labels[j] !== undefined && j !== mainIdx && rt[1] >= 0.6) flag = { jevChoice: labels[j]!, probability: Math.round(rt[1] * 100) / 100, mainButton: labels[mainIdx]! };
  }
  return { choice, flag, decisions: Object.keys(questions).length };
}

/** Writes one evening's result for the summary (reports/sim/screen/sw-<seed>.json). */
export function saveSwResult(res: SwResult) {
  mkdirSync(SW_RESULT_DIR, { recursive: true });
  writeFileSync(`${SW_RESULT_DIR}/sw-${res.seed}.json`, JSON.stringify({ ...res, steps: res.steps.length, game: 'Secret Words' }, null, 1));
}
