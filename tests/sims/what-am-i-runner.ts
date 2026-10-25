// Screen simulations for What Am I? (owner's request of 25 October 2026: "extensive testing via Jev"), in the style of
// secret-words-runner.ts: one whole game night played through the real app (the preview build) in a hidden browser, from
// Home, as one of six personas. Jev chooses each action from what the screen offers (headings and button names only);
// once an evening's Jev share is used, or without a key, the scripted persona carries on. Report-only: the rules engine is
// the referee, nothing here judges a rule. Names, texts and test ids: specs/what-am-i/README.md and api.md.
//
// Checked by code after every step:
//   - scores add up: every scoreboard on screen (R1, G1, the Scores sheet) equals the engine's replay of the saved night
//     (checked after the run), its points sum to the words got in saved turns (counted from the saved moves: got, pass, timeUp, fix, scoreTurn,
//     undoScore), and T4's "Riya got 5" equals the Got it chips;
//   - every shown word is in exactly one list, or returned by Pause: on T4 the chips equal the saved moves' lists, no word
//     is in both, and every word seen on T3 this turn is in a list or was hidden by a pause;
//   - nothing is stuck: every screen but the countdown offers a way on (an enabled button), no screen holds the persona for
//     more than 30 steps (the word screen excepted), no unknown screen;
//   - saved nights replay: a reload keeps every saved move (the moves before it are a prefix of the moves after it); after
//     the run, what-am-i-replay.run.ts replays each evening's saved night through the engine and compares every in-game
//     scoreboard that was on screen with the engine's view at that point;
//   - also: at most one main button, nothing scrolls sideways, no console error.
// A failing evening writes reports/sim/screen/what-am-i/<seed>/ (steps and the last 30 screenshots).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Browser, Page } from '@playwright/test';
import { devices } from '@playwright/test';
import { openApp, NIGHT, setHidden } from '../browser/what-am-i';
import { WORDS } from '../games/what-am-i/oracle';
import { rngFrom, type Rng } from './impostor-runner';
import type { Jev } from '../sim/jev';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const WAI_RESULT_DIR = `${ROOT}reports/sim/screen/what-am-i`;
export const WAI_JEV_PER_EVENING = Number(process.env.WAI_JEV_PER_EVENING ?? 40);
const STEP_MS = 1100;
const TEXT = new Map(WORDS.map((w) => [w.id, w.word]));

export interface Persona { id: string; describe: string }
export const PERSONAS: Persona[] = [
  { id: 'first-time-host', describe: 'a first-time host who has never seen the app, reads each screen and looks for the help before starting' },
  { id: 'grandparent', describe: 'a grandparent with weak English who reads slowly, taps carefully and sometimes taps the wrong thing' },
  { id: 'ten-year-old', describe: 'a 10-year-old who taps fast, presses Back, and pokes at every button' },
  { id: 'distracted-host', describe: 'a distracted host who puts the phone down, answers calls and comes back later' },
  { id: 'competitive-uncle', describe: 'a competitive uncle who wants to win, checks the scores and fixes every wrong mark' },
  { id: 'guest', describe: 'a guest who just opened the link on their own phone, has never heard of the game, and is then handed the host phone' },
];
const SHORT = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Asha', 'Neel', 'Tara', 'Isha'];
const LONG = ['Alexandrapetrova', 'Bhagyashreemani', 'Chandrashekharan', 'Dhananjayapillai', 'Ekaterinavolkova', 'Fatimazahrakhan',
  'Gurpreetsandhuuu', 'Harikrishnanpill', 'Indumathiraghav', 'Jayalakshmiiyer'];
const SIZES = [[360, 640], [390, 844], [812, 375], [320, 568]] as const;
const PACKS = ['Mix of all', 'Animals', 'Food', 'Around the house', 'Jobs', 'Sports and cricket', 'Festivals and places', 'Act it out', 'Famous Indians'];

export interface WaiConfig {
  seed: string; index: number; persona: Persona; width: number; height: number; players: string[]; turnTime: 30 | 60;
  hold: 'hand' | 'free'; pack: string; nonveg: boolean; sounds: boolean; permission: 'absent' | 'granted' | 'refused';
  motion: boolean; larger: boolean; games: number; rounds: number[]; reloadAt: number[]; hideAt: number[]; pauses: number;
  leave: boolean; join: boolean; endMidRound: boolean; fixes: boolean; secondPhone: boolean; platform: 'iphone' | 'android';
}

export function waiConfigFor(seed: string, index: number): WaiConfig {
  const r = rngFrom(`wai-config:${seed}`);
  const persona = PERSONAS[index % PERSONAS.length]!;
  const [width, height] = r.pick(SIZES);
  const n = 3 + r.int(8); // 3 to 10
  const games = 1 + r.int(2);
  const permission = r.pick(['absent', 'granted', 'granted', 'refused'] as const);
  return {
    seed, index, persona, width, height, players: (r.chance(0.15) ? LONG : SHORT).slice(0, n), turnTime: r.chance(0.8) ? 30 : 60,
    hold: r.chance(0.6) ? 'hand' : 'free', pack: r.pick(PACKS), nonveg: r.chance(0.3), sounds: r.chance(0.8), permission,
    motion: r.chance(0.6), larger: r.chance(0.15), games, rounds: Array.from({ length: games }, () => (n > 6 ? 1 : 1 + r.int(2))),
    reloadAt: [10 + r.int(40), 80 + r.int(80)], hideAt: [20 + r.int(60)], pauses: r.int(3), leave: n > 3 && r.chance(0.4),
    join: r.chance(0.4), endMidRound: r.chance(0.25), fixes: persona.id === 'competitive-uncle' || r.chance(0.3),
    secondPhone: persona.id === 'guest' || r.chance(0.15), platform: r.chance(0.5) ? 'iphone' : 'android',
  };
}

// ---------- What is on screen ----------
interface Opt { key: string; label: string; idx: number; main: boolean; kind: string; checked: string | null }
interface Snap {
  h1: string[]; h2: string[]; ids: string[]; dialog: string | null; menuOpen: boolean; opts: Opt[]; mains: number;
  word: string | null; timeLeft: string | null; got: string[]; passed: string[]; rows: string[]; where: string | null;
  scrollX: boolean; body: string;
}
async function snapshot(page: Page): Promise<Snap> {
  const s = await page.evaluate(() => {
    const vis = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && ((el as any).checkVisibility ? (el as any).checkVisibility({ visibilityProperty: true }) : true); };
    const inBack = (el: Element) => !!el.closest('[aria-hidden="true"], [inert]');
    const norm = (x: string | null | undefined) => (x ?? '').replace(/\s+/g, ' ').trim();
    for (const e of Array.from(document.querySelectorAll('[data-sim]'))) e.removeAttribute('data-sim');
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open]')).filter(vis);
    const front = dialogs.at(-1) ?? null;
    const nameOf = (d: Element) => { const by = d.getAttribute('aria-labelledby'); return norm(d.querySelector('h1, h2')?.textContent) || (by ? norm(by.split(' ').map((x) => document.getElementById(x)?.textContent ?? '').join(' ')) : '') || norm(d.getAttribute('aria-label')) || 'dialog'; };
    const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')).filter(vis);
    const scope: ParentNode = front ?? document.body;
    const sel = menuItems.length ? '[role="menuitem"]' : 'button, [role="button"], [role="menuitem"], [role="switch"], [role="radio"]';
    const opts: any[] = []; let n = 0;
    for (const el of Array.from((menuItems.length ? document : scope).querySelectorAll(sel))) {
      if (!vis(el) || (!menuItems.length && inBack(el))) continue;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const label = norm(el.getAttribute('aria-label') ?? el.textContent);
      if (!label) continue;
      el.setAttribute('data-sim', String(n));
      opts.push({ label, idx: n, main: el.getAttribute('data-testid') === 'main-button', kind: el.getAttribute('role') ?? 'button', checked: el.getAttribute('aria-checked') });
      n++;
    }
    const mains = Array.from(document.querySelectorAll('[data-testid="main-button"]')).filter((e) => vis(e) && (!front || front.contains(e))).length;
    const chips = (name: string) => {
      const reg = Array.from(document.querySelectorAll('section, [role="region"]')).find((x) => { const by = x.getAttribute('aria-labelledby'); const nm = (by ? norm(document.getElementById(by)?.textContent) : '') || norm(x.getAttribute('aria-label')); return nm === name; });
      return reg ? Array.from(reg.querySelectorAll('button')).map((b) => norm(b.getAttribute('aria-label') ?? b.textContent)) : [];
    };
    const t = (id: string) => { const e = document.querySelector(`[data-testid="${id}"]`); return e && vis(e) ? norm(e.textContent) : null; };
    const board = document.querySelector('[data-testid="scoreboard"]');
    return {
      h1: Array.from(document.querySelectorAll('h1')).filter((h) => vis(h) && (!front || front.contains(h) || !inBack(h))).map((h) => norm(h.textContent)),
      h2: Array.from(document.querySelectorAll('h2')).filter((h) => vis(h) && !inBack(h)).map((h) => norm(h.textContent)),
      ids: Array.from(new Set(Array.from(document.querySelectorAll('[data-testid]')).filter((e) => vis(e)).map((e) => e.getAttribute('data-testid')!))),
      dialog: front ? nameOf(front) : null, menuOpen: menuItems.length > 0, opts, mains,
      word: t('the-word'), timeLeft: t('time-left'), got: chips('Got it'), passed: chips('Passed'),
      rows: board && vis(board) ? Array.from(board.querySelectorAll('li')).map((li) => norm(li.textContent)) : [],
      where: t('where-line'), scrollX: document.scrollingElement!.scrollWidth > window.innerWidth + 1, body: norm(document.body.innerText).slice(0, 300),
    };
  }) as Snap;
  const seen = new Map<string, number>();
  for (const o of s.opts) { const b = `${o.kind}:${o.label.slice(0, 50)}`; const k = seen.get(b) ?? 0; seen.set(b, k + 1); o.key = k ? `${b}#${k}` : b; }
  return s;
}

export function screenOf(s: Snap): string | null {
  const h = (re: RegExp) => s.h1.some((x) => re.test(x));
  if (s.menuOpen) return 'menu';
  if (s.dialog) return `dialog:${s.dialog}`;
  if (s.ids.includes('countdown')) return 'T2';
  if (s.ids.includes('the-word') || s.ids.includes('mark-flash')) return 'T3';
  if (h(/^(Time's up!|Turn ended early|Turn skipped)/)) return 'T4';
  if (h(/, you're guessing$/)) return 'T1';
  if (h(/^Answer by moving the phone\?$/)) return 'T0';
  if (h(/^Round \d+ done/)) return 'R1';
  if (h(/^Tonight's What Am I\?$/)) return 'G2';
  if (h(/wins with \d+!$|share the win with|^Nobody got a word|^Game ended/)) return 'G1';
  if (h(/^Words and time$/)) return 'S2';
  if (h(/^Who's playing\?$/)) return 'S1';
  if (h(/^Read this aloud$/)) return 'S3';
  if (h(/^What shall we play\?$/)) return 'picker';
  if (h(/^How to play$/)) return 'how-to-play';
  if (h(/^Join a game$/)) return 'join';
  if (h(/^(History|Sessions)/) || s.ids.includes('history-game')) return 'history';
  if (s.opts.some((o) => o.kind === 'switch' && /^Larger text$/.test(o.label))) return 'settings';
  if (s.opts.some((o) => /^Host a game/.test(o.label))) return 'home';
  return null;
}

// ---------- The saved game night and the code's own count ----------
async function savedNight(page: Page): Promise<any | null> {
  return page.evaluate(() => {
    let best: any = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('pgn.game.')) continue;
      try { const g = JSON.parse(localStorage.getItem(k)!); if (g?.gameType === 'what-am-i' && (!best || g.updatedAt >= best.updatedAt)) best = g; } catch { /* not ours */ }
    }
    return best;
  });
}
interface Count { savedGot: number; savedTurns: number; open: { got: string[]; passed: string[]; hidden: string[] } | null }
/** The code's own count from the saved moves of the last game (no engine): words got in saved turns, the open turn's lists. */
export function countFrom(records: any[]): Count {
  let savedGot = 0, savedTurns = 0;
  let open: Count['open'] = null;
  const stack: { got: string[]; passed: string[]; hidden: string[] }[] = [];
  for (const { move: m } of records) {
    const turn = () => (open ??= { got: [], passed: [], hidden: [] });
    switch (m.type) {
      case 'start': savedGot = 0; savedTurns = 0; open = null; stack.length = 0; break;
      case 'got': turn().got.push(m.word); break;
      case 'pass': turn().passed.push(m.word); break;
      case 'timeUp': turn(); if (m.word) open!.passed.push(m.word); break;
      case 'pause': if (m.turn) { turn(); if (m.word) open!.hidden.push(m.word); } break;
      case 'fix': if (open) {
        if (open.got.includes(m.word)) { open.got = open.got.filter((x) => x !== m.word); open.passed.push(m.word); }
        else if (open.passed.includes(m.word)) { open.passed = open.passed.filter((x) => x !== m.word); open.got.push(m.word); }
      } break;
      case 'scoreTurn': if (open) { savedGot += open.got.length; savedTurns++; stack.push(open); open = null; } break;
      case 'undoScore': { const t = stack.pop(); if (t) { savedGot -= t.got.length; savedTurns--; open = t; } break; }
      case 'endGame': open = null; break;
    }
  }
  return { savedGot, savedTurns, open };
}

// ---------- Results ----------
export interface Finding { kind: 'stuck' | 'no way on' | 'wrong score' | 'word lists' | 'replay' | 'main button' | 'layout' | 'console error' | 'not recognised' | 'crash' | 'guest phone' | 'did not finish'; step: number; screen: string; detail: string }
export interface WaiResult {
  seed: string; config: Omit<WaiConfig, 'persona'> & { persona: string }; byJev: boolean; findings: Finding[]; steps: number; jevDecisions: number;
  finished: boolean; games: number; turns: number; marks: { got: number; pass: number; motion: number; motionMissed: number }; screens: string[];
  reloads: number; hides: number; pauses: number; flags: { step: number; screen: string; jevChoice: string; probability: number; mainButton: string }[];
  jevNotes: string[];
  /** For the engine replay after the run: each in-game scoreboard on screen (at the first `records` saved moves), and the last saved night. */
  replays: { step: number; screen: string; records: number; rows: { player: string; score: number; turns: number }[]; left: number }[];
  night: { setup: any; records: any[]; id: string } | null;
}

export async function playWaiEvening(page: Page, browser: Browser, baseURL: string, cfg: WaiConfig, opts: { jev?: Jev | null } = {}): Promise<WaiResult> {
  const r: Rng = rngFrom(`wai-play:${cfg.seed}`);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const findings: Finding[] = [];
  const res: WaiResult = {
    seed: cfg.seed, config: { ...cfg, persona: cfg.persona.id }, byJev: !!opts.jev, findings, steps: 0, jevDecisions: 0, finished: false, games: 0, turns: 0,
    marks: { got: 0, pass: 0, motion: 0, motionMissed: 0 }, screens: [], reloads: 0, hides: 0, pauses: 0, flags: [], jevNotes: [], replays: [], night: null,
  };
  const add = (kind: Finding['kind'], step: number, screen: string, detail: string) => {
    if (!findings.some((f) => f.kind === kind && f.screen === screen && f.detail === detail)) findings.push({ kind, step, screen, detail });
  };
  const shots: { step: number; png: Buffer }[] = [];
  const log: string[] = [];

  // The guest's own phone first: Home → Join a game, where the What Am I? line must say it is played on the host's phone.
  if (cfg.secondPhone) {
    const ctx2 = await browser.newContext({ ...devices['Pixel 7'], baseURL, viewport: { width: 360, height: 640 } });
    try {
      const g = await ctx2.newPage();
      await g.goto('./');
      await g.waitForTimeout(2000); // Home's tap guard
      await g.getByRole('button', { name: /^Join a game/ }).first().click({ timeout: 5000 });
      const line = g.getByTestId('join-line-what-am-i');
      const txt = await line.textContent({ timeout: 5000 }).catch(() => null);
      if ((txt ?? '').replace(/\s+/g, ' ').trim() !== "What Am I? is played on the host's phone. Ask the host to add your name.") add('guest phone', 0, 'join', `join line: ${JSON.stringify(txt)}`);
    } catch (e) { add('guest phone', 0, 'join', `could not reach Join a game: ${String(e).slice(0, 120)}`); }
    finally { await ctx2.close(); }
  }

  await openApp(page, { viewport: { width: cfg.width, height: cfg.height }, larger: cfg.larger, permission: cfg.permission, seed: `wai-${cfg.seed}`, platform: cfg.platform, wakeLock: 'granted' });

  const plan = { gamesDone: 0, roundInGame: 1, namesTyped: false, choicesMade: false, started: false, ended: false, leaveDone: !cfg.leave, joinDone: !cfg.join,
    pausesLeft: cfg.pauses, fixesLeft: cfg.fixes ? 2 : 0, seenThisTurn: new Set<string>(), helpSeen: false, scoresSeen: false, someoneElse: false, holdSwap: false, endedOnce: false, lastWord: '', blankWaits: 0 };
  let jevLeft = opts.jev ? WAI_JEV_PER_EVENING : 0;
  let lastKey = '', sameCount = 0, prevRecords = 0; let lastNight: any = null;
  const rated = new Set<string>();
  const maxSteps = Number(process.env.WAI_MAX_STEPS ?? 2500);

  for (let step = 1; step <= maxSteps; step++) {
    res.steps = step;
    await page.clock.runFor(STEP_MS + r.int(97)); // a person's pace, not a metronome
    let s: Snap;
    try { s = await snapshot(page); } catch (e) { add('crash', step, '?', String(e).slice(0, 160)); break; }
    const sc = screenOf(s);
    if (!res.screens.includes(sc ?? 'unknown')) res.screens.push(sc ?? 'unknown');
    const screen = sc ?? 'unknown';
    if (shots.length >= 30) shots.shift();
    shots.push({ step, png: await page.screenshot().catch(() => Buffer.alloc(0)) });

    // ---- the checks ----
    if (!sc) {
      const html = await page.evaluate(() => document.body.innerHTML.replace(/\s+/g, ' ').slice(0, 400)).catch(() => '?');
      add('not recognised', step, 'unknown', `text "${s.body.slice(0, 100)}"; html ${html}`);
      mkdirSync(`${WAI_RESULT_DIR}/${cfg.seed}`, { recursive: true });
      await page.screenshot({ path: `${WAI_RESULT_DIR}/${cfg.seed}/unknown-${step}.png` }).catch(() => {});
    }
    if (s.mains > 1) add('main button', step, screen, `${s.mains} main buttons`);
    if (s.scrollX) add('layout', step, screen, 'the page scrolls sideways');
    for (const e of errors.splice(0)) add('console error', step, screen, e.slice(0, 200));
    if (!sc && plan.blankWaits === 9) add('stuck', step, 'unknown', `a blank screen (nothing on it) for ${10 * 3 + 10} s of app time after the last step: ${s.body.slice(0, 60)}`);
    if (screen !== 'T2' && s.opts.length === 0) {
      await page.clock.runFor(1500);
      const again = await snapshot(page);
      if (again.opts.length === 0 && screenOf(again) !== 'T2') add('no way on', step, screen, `nothing to tap: ${s.body.slice(0, 120)}`);
    }
    const key = `${screen}|${s.h1.join('/')}|${s.dialog ?? ''}`;
    if (key === lastKey && screen !== 'T3') { if (++sameCount === 30) add('stuck', step, screen, `30 steps on "${s.h1[0] ?? s.dialog ?? screen}"`); } else { lastKey = key; sameCount = 0; }
    const night = await savedNight(page).catch(() => null);
    let count: Count | null = null;
    if (night) {
      const lastStart = night.records.map((x: any) => x.move.type).lastIndexOf('start');
      count = countFrom(lastStart >= 0 ? night.records.slice(lastStart) : []);
      // The engine's replay runs after the evening (tests/sims/what-am-i-replay.run.ts: the src rules load a JSON file that
      // Playwright's loader cannot import); each scoreboard on screen and the evening's last saved night are kept for it.
      if (night.records.length !== prevRecords) { prevRecords = night.records.length; lastNight = night; }
    }
    if (screen === 'T3' && s.word) { plan.seenThisTurn.add(s.word); plan.lastWord = s.word; }
    if (screen === 'T4' && count?.open) {
      const strip = (x: string) => x.replace(/\s*↺$/, '');
      const got = s.got.map(strip), passed = s.passed.map(strip);
      const wantGot = count.open.got.map((id) => TEXT.get(id) ?? id), wantPassed = count.open.passed.map((id) => TEXT.get(id) ?? id);
      if (got.some((w) => passed.includes(w))) add('word lists', step, 'T4', `a word in both lists: ${got.filter((w) => passed.includes(w)).join(', ')}`);
      if ([...got].sort().join('|') !== [...wantGot].sort().join('|') || [...passed].sort().join('|') !== [...wantPassed].sort().join('|')) add('word lists', step, 'T4', `chips Got ${got.join(', ')} / Passed ${passed.join(', ')}; saved moves Got ${wantGot.join(', ')} / Passed ${wantPassed.join(', ')}`);
      const hidden = count.open.hidden.map((id) => TEXT.get(id) ?? id);
      for (const w of plan.seenThisTurn) if (!got.includes(w) && !passed.includes(w) && !hidden.includes(w)) add('word lists', step, 'T4', `"${w}" was shown on T3 but is in no list and was not hidden by a pause`);
      const m = /got (\d+)$/.exec(s.h1[0] ?? '');
      if (m && Number(m[1]) !== got.length) add('wrong score', step, 'T4', `heading "${s.h1[0]}" but ${got.length} Got it chips`);
    }
    if (s.rows.length && count) {
      const ui = s.rows.map((x) => { const m = /^(.*?)\s+(\d+)\s+\((\d+) turns?\)/.exec(x); return m ? { player: m[1]!.replace(/\s*\(left\)$/, ''), score: Number(m[2]), turns: Number(m[3]) } : null; });
      if (ui.some((x) => !x)) add('wrong score', step, screen, `scoreboard row not read: ${s.rows.join(' | ')}`);
      else {
        const sum = ui.reduce((n, x) => n + x!.score, 0), turns = ui.reduce((n, x) => n + x!.turns, 0);
        const onlyInGame = screen !== 'G2';
        if (onlyInGame && night) res.replays.push({ step, screen, records: night.records.length, rows: ui as any, left: s.rows.filter((x) => /\(left\)/.test(x)).length });
        if (onlyInGame && (sum !== count.savedGot || turns !== count.savedTurns)) add('wrong score', step, screen, `scoreboard sums ${sum} points / ${turns} turns; saved moves give ${count.savedGot} / ${count.savedTurns}`);
      }
    }

    // ---- choose ----
    let action: string | null = null;
    let viaJev = false;
    const realChoice = !['T2', 'T3'].includes(screen) && s.opts.length > 1;
    if (jevLeft > 0 && realChoice && opts.jev && !(screen === 'S1' && !plan.namesTyped)) {
      const labels = s.opts.map((o) => o.label);
      const rate = !rated.has(screen);
      const out = await askJev(opts.jev, cfg, screen, s, labels, rate);
      res.jevDecisions += out.decisions; jevLeft -= out.decisions;
      if (rate && out.decisions) rated.add(screen);
      if (out.flag) res.flags.push({ step, screen, ...out.flag });
      if (out.choice !== null) {
        const o = s.opts[out.choice]!;
        // Jev's choice is played unless it ends the night before the plan's first game is played through (the persona would
        // ask "are you sure?"; the scripted host keeps the night going), or it would loop on the same screen.
        const ending = /^(End for tonight|Start new|Delete)/.test(o.label) && plan.gamesDone === 0 && !plan.endedOnce;
        if (!ending && sameCount < 6) { action = o.key; viaJev = true; }
      }
    }
    if (!action) action = scripted(screen, s, cfg, plan, r, step);
    log.push(`${step} ${screen} ${s.h1[0] ?? s.dialog ?? ''}${s.timeLeft ? ` [${s.timeLeft}]` : ''} -> ${action}${viaJev ? ' (Jev)' : ''}`);
    if (action === 'done') { res.finished = true; break; }
    try { await act(page, action, s, cfg, res, plan); }
    catch (e) { add('crash', step, screen, `${action}: ${String(e).split('\n')[0]!.slice(0, 160)}`); await page.keyboard.press('Escape').catch(() => {}); }
    if (action === 'action:reload') {
      const after = await savedNight(page).catch(() => null);
      if (night && after && after.id === night.id) {
        const a = JSON.stringify(night.records), b = JSON.stringify(after.records.slice(0, night.records.length));
        if (a !== b) add('replay', step, screen, `a reload changed saved moves (${night.records.length} before, ${after.records.length} after)`);
      }
    }
  }
  res.night = lastNight ? { setup: lastNight.setup, records: lastNight.records, id: lastNight.id } : null;
  if (!res.finished) add('did not finish', res.steps, 'end', `evening still going after ${res.steps} steps`);
  if (findings.length) {
    const dir = `${WAI_RESULT_DIR}/${cfg.seed}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/steps.txt`, log.join('\n'));
    for (const sh of shots) if (sh.png.length) writeFileSync(`${dir}/step-${String(sh.step).padStart(4, '0')}.png`, sh.png);
  }
  return res;
}

type Plan = { gamesDone: number; roundInGame: number; namesTyped: boolean; choicesMade: boolean; started: boolean; ended: boolean; leaveDone: boolean; joinDone: boolean; pausesLeft: number; fixesLeft: number; seenThisTurn: Set<string>; helpSeen: boolean; scoresSeen: boolean; someoneElse: boolean; holdSwap: boolean; endedOnce: boolean; lastWord: string; blankWaits: number };

/** The scripted persona: mostly the main button; the evening's plan (pauses, reloads, leaving, joining, ending); persona pokes. */
function scripted(screen: string, s: Snap, cfg: WaiConfig, plan: Plan, r: Rng, step: number): string {
  const by = (re: RegExp) => s.opts.find((o) => re.test(o.label))?.key ?? null;
  const main = s.opts.find((o) => o.main)?.key ?? null;
  const p = cfg.persona.id;
  if (!['home', 'T2', 'menu'].includes(screen) && !screen.startsWith('dialog') && plan.started && !plan.ended) {
    if (cfg.reloadAt.includes(step)) return 'action:reload';
    if (cfg.hideAt.includes(step) || (p === 'distracted-host' && r.chance(0.03))) return 'action:hide';
    if (p === 'ten-year-old' && r.chance(0.03) && screen !== 'T3') return 'action:back';
  }
  const lastRound = cfg.rounds[plan.gamesDone] ?? 1;
  switch (screen) {
    case 'home': {
      if (plan.ended) return 'done';
      const row = by(/^What Am I\? ·/);
      if (row) return row;
      return by(/^Host a game/) ?? 'action:escape';
    }
    case 'picker': return by(/^What Am I\?/) ?? 'action:back';
    case 'S1': if (!plan.namesTyped) return 'macro:names'; return main ?? 'action:back';
    case 'S2': if (!plan.choicesMade) return 'macro:choices'; return main ?? 'action:back';
    case 'S3': if (p === 'first-time-host' && !plan.helpSeen) { plan.helpSeen = true; return by(/^How to play$/) ?? main!; } plan.started = true; return main ?? 'action:back';
    case 'how-to-play': return by(/^(← Back|Done|Close)/) ?? by(/Back/) ?? 'action:back';
    case 'T0': return (cfg.motion ? by(/^Yes, move the phone$/) : by(/^Use taps instead$/)) ?? main!;
    case 'T1': {
      plan.started = true;
      plan.seenThisTurn.clear();
      if (!plan.someoneElse && r.chance(0.08)) { plan.someoneElse = true; return by(/^Someone else goes first$/) ?? main!; }
      if (!plan.holdSwap && r.chance(0.08)) { plan.holdSwap = true; return by(/^(Hands-free for|.* will hold it$)/) ?? main!; }
      if ((!plan.leaveDone || !plan.joinDone) && r.chance(0.3)) return by(/^Menu$/) ?? main!;
      return main ?? 'action:escape';
    }
    case 'T2': return 'action:countdown';
    case 'T3': {
      if (plan.pausesLeft > 0 && r.chance(0.06)) { plan.pausesLeft--; return by(/^Pause$/) ?? 'mark:got'; }
      if (r.chance(p === 'grandparent' ? 0.25 : 0.1)) return 'action:wait3000';
      const free = cfg.hold === 'free';
      const g = r.chance(0.55);
      if (cfg.motion && !free && cfg.permission !== 'refused' && r.chance(0.7)) return g ? 'motion:got' : 'motion:pass';
      return g ? 'mark:got' : 'mark:pass';
    }
    case 'T4': {
      if (plan.fixesLeft > 0 && r.chance(0.4) && (s.got.length || s.passed.length)) { plan.fixesLeft--; return 'macro:fix'; }
      if (p === 'competitive-uncle' && !plan.scoresSeen && r.chance(0.3)) { plan.scoresSeen = true; return by(/^Menu$/) ?? main!; }
      return main ?? 'action:escape';
    }
    case 'R1': {
      if ((!plan.leaveDone || !plan.joinDone) && r.chance(0.5)) return by(/^Players/) ?? main!;
      const m = /^Round (\d+) done/.exec(s.h1[0] ?? '');
      const done = m ? Number(m[1]) : 1;
      if (done >= lastRound) return by(/^End the game$/) ?? main!;
      return main ?? 'action:escape';
    }
    case 'G1': {
      plan.endedOnce = true;
      if (plan.gamesDone + 1 < cfg.games) { plan.gamesDone++; return main ?? 'action:escape'; }
      plan.gamesDone = cfg.games;
      return by(/^End for tonight$/) ?? 'action:escape';
    }
    case 'G2': plan.ended = true; return by(/^← Home$/) ?? main ?? 'action:escape';
    case 'history': return by(/^← Back$/) ?? by(/Home/) ?? 'action:back';
    case 'settings': return by(/^Done$/) ?? 'action:escape';
    case 'join': return by(/Back|Home/) ?? 'action:back';
    case 'menu': {
      if (!plan.scoresSeen && by(/^Scores$/) && p === 'competitive-uncle') { plan.scoresSeen = true; return by(/^Scores$/)!; }
      if ((!plan.leaveDone || !plan.joinDone) && by(/^Players$/)) return by(/^Players$/)!;
      return 'action:escape';
    }
    default: break;
  }
  if (screen.startsWith('dialog:')) {
    const d = screen.slice(7);
    if (d === 'Paused') { if (cfg.endMidRound && r.chance(0.2)) return by(/^End .* turn now$/) ?? main!; return by(/^Carry on playing$/) ?? main ?? 'action:escape'; }
    if (/turn now\?$/.test(d)) return by(/^End .* turn now$/) ?? main!;
    if (d === 'Players') {
      if (!plan.joinDone) return 'macro:join';
      if (!plan.leaveDone) return 'macro:leave';
      return by(/^Done$/) ?? 'action:escape';
    }
    if (/has to leave\?$/.test(d)) return by(/ leaves$/) ?? main!;
    if (/players needed/.test(d)) return by(/^Add a player$/) ?? main!;
    if (d === 'End the game?') return by(/^End the game$/) ?? main!;
    if (d === 'End for tonight?') return by(/^End for tonight$/) ?? main!;
    if (/^Start a new game night\?$/.test(d)) return by(/^Carry on that one$/) ?? 'action:escape';
    if (/^Scores$/.test(d)) return by(/^Done$/) ?? 'action:escape';
    return main ?? by(/^(Done|OK|Close|Cancel)$/) ?? 'action:escape';
  }
  // Nothing to tap (a blank screen): a person waits a while before trying the phone's Back.
  if (!s.opts.length && plan.blankWaits < 10) { plan.blankWaits++; return 'action:wait3000'; }
  plan.blankWaits = 0;
  return main ?? s.opts[0]?.key ?? 'action:back';
}

async function act(page: Page, action: string, s: Snap, cfg: WaiConfig, res: WaiResult, plan: Plan) {
  const click = async (key: string) => {
    const o = s.opts.find((x) => x.key === key);
    if (!o) throw new Error(`no option ${key}`);
    await page.locator(`[data-sim="${o.idx}"]`).first().click({ timeout: 3000 });
  };
  if (action.startsWith('action:wait')) { await page.clock.runFor(Number(action.slice(11)) || 1000); return; }
  switch (action) {
    case 'action:escape': await page.keyboard.press('Escape'); return;
    case 'action:back': await page.evaluate(() => history.back()); await page.clock.runFor(300); if (!page.url().includes('/pocket-game-night/')) await page.goto('./'); return;
    case 'action:reload': res.reloads++; await page.reload(); return;
    case 'action:hide': res.hides++; await setHidden(page, true); await page.clock.runFor(20_000); await setHidden(page, false); return;
    case 'action:countdown': await page.clock.runFor(3000); return;
    case 'mark:got': case 'mark:pass': {
      await page.clock.runFor(800);
      const v = page.viewportSize()!;
      const y = action === 'mark:got' ? v.height * 0.8 : v.height * 0.3;
      await page.mouse.click(v.width / 2, y);
      await page.clock.runFor(600);
      if (action === 'mark:got') res.marks.got++; else res.marks.pass++;
      return;
    }
    case 'motion:got': case 'motion:pass': {
      await page.clock.runFor(800);
      const theta = action === 'motion:got' ? -55 : 55;
      const before = s.word;
      await orient(page, [...Array(25)].map((_, i) => ({ d: i * 16, theta })), [...Array(30)].map((_, i) => ({ d: 400 + i * 16, theta: 0 })));
      await page.clock.runFor(1000);
      res.marks.motion++;
      const after = await page.getByTestId('the-word').textContent({ timeout: 500 }).catch(() => null);
      if (after !== null && before !== null && after.replace(/\s+/g, ' ').trim() === before) res.marks.motionMissed++;
      if (action === 'motion:got') res.marks.got++; else res.marks.pass++;
      return;
    }
    case 'macro:names': {
      const field = page.getByLabel('Player name', { exact: true });
      const have = await page.getByRole('button', { name: /^Remove / }).count();
      if (have === 0) for (const n of cfg.players) { await field.fill(n); await field.press('Enter'); }
      plan.namesTyped = true; return;
    }
    case 'macro:choices': {
      const radio = (name: string | RegExp) => page.getByRole('radio', { name: typeof name === 'string' ? new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) : name }).first();
      await radio(`${cfg.turnTime} s`).click({ timeout: 3000 });
      await radio(cfg.hold === 'hand' ? "In the guesser's hand" : 'Hands-free').click({ timeout: 3000 });
      const sw = async (name: string, on: boolean) => { const x = page.getByRole('switch', { name, exact: true }); if ((await x.getAttribute('aria-checked')) !== String(on)) await x.click(); };
      await sw('Include non-veg food (chicken, fish, egg)', cfg.nonveg);
      await sw('Sounds', cfg.sounds);
      await radio(`${cfg.pack} ·`).click({ timeout: 3000 });
      plan.choicesMade = true; return;
    }
    case 'macro:fix': {
      const chips = page.getByRole('region', { name: /^(Got it|Passed)$/ }).getByRole('button');
      const n = await chips.count();
      if (n) await chips.nth(Math.floor(n / 2)).click({ timeout: 3000 });
      return;
    }
    case 'macro:join': {
      const field = page.getByRole('dialog').getByRole('textbox').first();
      await field.fill('Om'); await field.press('Enter');
      plan.joinDone = true; return;
    }
    case 'macro:leave': {
      const x = page.getByRole('dialog').getByRole('button', { name: /^Remove / });
      const n = await x.count();
      plan.leaveDone = true;
      if (n > 2) await x.nth(n - 1).click({ timeout: 3000 });
      return;
    }
    default: {
      // A phone held steady from the start tap through the countdown (orientation events within 1 s of T2, and steady in
      // [2500, 3000), WAI-016 and Version 1.1 item 9, 1.2 item 8), so motion can mark; harmless in hands-free.
      const o = s.opts.find((x) => x.key === action);
      if (o && /^(I'm .*: start|Start .*'s turn|Carry on playing)$/.test(o.label)) await steady(page, 5600);
      await click(action);
    }
  }
}

async function steady(page: Page, ms: number) { await orient(page, [...Array(Math.ceil(ms / 16))].map((_, i) => ({ d: i * 16, theta: 0 }))); }
async function orient(page: Page, ...lists: { d: number; theta: number }[][]) {
  const list = lists.flat().map((e) => ({ d: e.d, beta: (Math.acos(Math.max(-1, Math.min(1, Math.sin((e.theta * Math.PI) / 180)))) * 180) / Math.PI }));
  await page.evaluate((list) => {
    for (const e of list) setTimeout(() => {
      let ev: Event;
      try { ev = new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: e.beta, gamma: 0, absolute: false }); }
      catch { ev = new Event('deviceorientation'); for (const [k, v] of Object.entries({ alpha: 0, beta: e.beta, gamma: 0, absolute: false })) Object.defineProperty(ev, k, { value: v }); }
      window.dispatchEvent(ev);
    }, e.d);
  }, list);
}

/** Jev plays the persona's choice among the buttons (headings and names only), and rates each new screen once. */
async function askJev(jev: Jev, cfg: WaiConfig, screen: string, s: Snap, labels: string[], rate: boolean): Promise<{ choice: number | null; flag: { jevChoice: string; probability: number; mainButton: string } | null; decisions: number }> {
  const criteria = Object.fromEntries(labels.map((l, i) => [`b${i}`, `Tap "${l}"`]));
  const text = `Screen: ${[...s.h1, ...s.h2].join(' / ') || s.dialog || screen}. Buttons: ${labels.join(' | ')}`.slice(0, 700);
  const qs: Record<string, any> = { act: { type: 'choice', instructions: { question: `You are ${cfg.persona.describe}, running What Am I? (a guessing game: one player holds the phone on their forehead and the room gives clues) at a family party. Which do you tap now?`, screen: text, note: 'Pick what this person would really do. The app decides every result.' }, criteria } };
  if (rate) qs.rate = { type: 'choice', instructions: { question: 'You are seeing this phone screen for the first time. Which button would you press next to carry on the game?', screen: text }, criteria };
  if (!jev.available(Object.keys(qs).length)) return { choice: null, flag: null, decisions: 0 };
  const ans = await jev.choose({ game: 'What Am I?', screen }, qs);
  if (!ans) return { choice: null, flag: null, decisions: 0 };
  const top = (a: any): [string, number] | null => { const e = Object.entries((a?.probabilities ?? {}) as Record<string, number>).sort((x, y) => y[1] - x[1])[0]; return e ? [e[0], Number(e[1])] : null; };
  const a = top(ans.act); const i = a ? Number(a[0].slice(1)) : NaN;
  const mainIdx = s.opts.findIndex((o) => o.main);
  let flag = null;
  const rt = rate ? top(ans.rate) : null;
  if (rt && mainIdx >= 0) { const j = Number(rt[0].slice(1)); if (labels[j] !== undefined && j !== mainIdx && rt[1] >= 0.6) flag = { jevChoice: labels[j]!, probability: Math.round(rt[1] * 100) / 100, mainButton: labels[mainIdx]! }; }
  return { choice: Number.isInteger(i) && labels[i] !== undefined ? i : null, flag, decisions: Object.keys(qs).length };
}

export function saveWaiResult(res: WaiResult) {
  mkdirSync(WAI_RESULT_DIR, { recursive: true });
  writeFileSync(`${WAI_RESULT_DIR}/wai-${res.seed}.json`, JSON.stringify(res, null, 1));
}
export { NIGHT };
