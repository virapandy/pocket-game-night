// Screen simulations for Mafia (owner's request of 25 October 2026), in the style of what-am-i-runner.ts: whole game nights
// played through the real screens (the preview build) in a hidden browser, as one of six personas. Mafia is not on the
// picker yet (it ships after What Am I?), so each night opens on the first deal screen through MAF-H6 (`pgn.test.load`,
// only the `start` recorded, as tests/browser/mafia.ts `openDeal`), with this evening's own deals (MAF-H3). Report-only.
//
// Checked by code after every step (MAF-P2 / MAF-016: nothing secret on room screens):
//   - on every room screen (every screen but B2, N2 and G1/G2 after game over) the page's text, accessible names, title and
//     live regions never put a role (or "Not Mafia") next to the name of a player who is in or has left; hold none of the private parts (`private-word`, `job-line`, `night-names`, `result-line`); and on N0, N1 and
//     N3 name nobody but the player the phone is passed to (no night pick);
//   - the truth the check uses is what the deal screens showed each player (B2's role word), so a "Deal again" is followed;
//   - nothing stuck: a way on on every screen but the countdown, no screen for more than 30 steps, no unknown screen;
//   - at most one main button, nothing sideways, no console error; a reload keeps every saved move.
// Jev (when a key is present) chooses as the persona on room screens and picks names at night and in the vote, from button
// names only; never the page text. A failing evening writes reports/sim/screen/mafia/<seed>/ (its steps and a screenshot of
// each step that found something).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { freshPhone, freezeClock } from '../browser/impostor';
import { roomDump } from '../browser/mafia';
import { flow, savedFlow, FLOW_T0, type Flow } from '../games/mafia/flows';
import { baseRoles, oracleCounts, type Role } from '../games/mafia/oracle';
import { rngFrom, type Rng } from './impostor-runner';
import { PERSONAS, type Persona } from './what-am-i-runner';
import type { Jev } from '../sim/jev';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const MAF_RESULT_DIR = `${ROOT}reports/sim/screen/mafia`;
export const MAF_JEV_PER_EVENING = Number(process.env.MAF_JEV_PER_EVENING ?? 35);
const NAMES = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om', 'Sunita', 'Neha', 'Imran', 'Tara', 'Isha'];
const SIZES = [[360, 640], [390, 844], [812, 375], [320, 568]] as const;
const ROLE_WORD = /\b(mafia|doctor|police|villager)\b/i;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface MafConfig { seed: string; index: number; persona: Persona; width: number; height: number; players: string[]; games: number; reloadAt: number[]; hideAt: number[]; leave: boolean; join: boolean; endEarly: boolean; pause: boolean; larger: boolean }
export function mafConfigFor(seed: string, index: number): MafConfig {
  const r = rngFrom(`maf-config:${seed}`);
  const [width, height] = r.pick(SIZES);
  const n = 5 + r.int(8); // 5 to 12
  return { seed, index, persona: PERSONAS[index % PERSONAS.length]!, width, height, players: NAMES.slice(0, n), games: 1 + r.int(2),
    reloadAt: [15 + r.int(40), 90 + r.int(60)], hideAt: [30 + r.int(50)], leave: n > 5 && r.chance(0.4), join: r.chance(0.35), endEarly: r.chance(0.15), pause: r.chance(0.5), larger: r.chance(0.15) };
}
function dealFor(players: string[], seed: string): Record<string, Role> {
  const r = rngFrom(seed);
  const roles = baseRoles(players.length, oracleCounts(players.length).suggested);
  for (let i = roles.length - 1; i > 0; i--) { const j = r.int(i + 1); [roles[i], roles[j]] = [roles[j]!, roles[i]!]; }
  return Object.fromEntries(players.map((p, i) => [p, roles[i]!]));
}

interface Opt { key: string; label: string; idx: number; main: boolean; kind: string; inNames: boolean; pressed: string | null }
interface Snap { h1: string[]; ids: string[]; dialog: string | null; menuOpen: boolean; opts: Opt[]; mains: number; scrollX: boolean; body: string; passName: string | null; privateWord: string | null; resultLine: string | null; mainLabel: string | null; mainDisabled: boolean; privateParts: string[] }
async function snapshot(page: Page): Promise<Snap> {
  const s = await page.evaluate(() => {
    const vis = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && ((el as any).checkVisibility ? (el as any).checkVisibility({ visibilityProperty: true }) : true); };
    const inBack = (el: Element) => !!el.closest('[aria-hidden="true"], [inert]');
    const norm = (x: string | null | undefined) => (x ?? '').replace(/\s+/g, ' ').trim();
    for (const e of Array.from(document.querySelectorAll('[data-sim]'))) e.removeAttribute('data-sim');
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open]')).filter(vis);
    const front = dialogs.at(-1) ?? null;
    const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')).filter(vis);
    const scope: ParentNode = menuItems.length ? document : (front ?? document.body);
    const sel = menuItems.length ? '[role="menuitem"]' : 'button, [role="button"], [role="switch"], [role="checkbox"]';
    const opts: any[] = []; let n = 0;
    for (const el of Array.from(scope.querySelectorAll(sel))) {
      if (!vis(el) || (!menuItems.length && inBack(el))) continue;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const label = norm(el.getAttribute('aria-label') ?? el.textContent);
      if (!label) continue;
      el.setAttribute('data-sim', String(n));
      opts.push({ label, idx: n, main: el.getAttribute('data-testid') === 'main-button', kind: el.getAttribute('role') ?? 'button', inNames: !!el.closest('[data-testid="night-names"]'), pressed: el.getAttribute('aria-pressed') ?? el.getAttribute('aria-checked') });
      n++;
    }
    const mainEls = Array.from(document.querySelectorAll('[data-testid="main-button"]')).filter((e) => vis(e) && (!front || front.contains(e)));
    const t = (id: string) => { const e = document.querySelector(`[data-testid="${id}"]`); return e && vis(e) ? norm(e.textContent) : null; };
    return {
      h1: Array.from(document.querySelectorAll('h1')).filter((h) => vis(h)).map((h) => norm(h.textContent)),
      ids: Array.from(new Set(Array.from(document.querySelectorAll('[data-testid]')).filter((e) => vis(e)).map((e) => e.getAttribute('data-testid')!))),
      dialog: front ? (norm(front.querySelector('h1, h2, h3')?.textContent) || norm((front.getAttribute('aria-labelledby') ?? '').split(' ').map((x) => document.getElementById(x)?.textContent ?? '').join(' ')) || norm(front.getAttribute('aria-label')) || norm(front.querySelector('p')?.textContent) || 'dialog') : null,
      menuOpen: menuItems.length > 0, opts, mains: mainEls.length, scrollX: document.scrollingElement!.scrollWidth > window.innerWidth + 1,
      body: norm(document.body.innerText).slice(0, 300), passName: t('pass-name'), privateWord: t('private-word'), resultLine: t('result-line'),
      mainLabel: mainEls[0] ? norm(mainEls[0].textContent) : null, mainDisabled: !!mainEls[0] && ((mainEls[0] as HTMLButtonElement).disabled || mainEls[0].getAttribute('aria-disabled') === 'true'),
      privateParts: ['private-word', 'job-line', 'night-names', 'result-line'].filter((id) => document.querySelector(`[data-testid="${id}"]`)),
    };
  }) as Snap;
  const seen = new Map<string, number>();
  for (const o of s.opts) { const b = `${o.kind}:${o.label.slice(0, 50)}`; const k = seen.get(b) ?? 0; seen.set(b, k + 1); o.key = k ? `${b}#${k}` : b; }
  return s;
}

export function screenOf(s: Snap): string | null {
  const h = (re: RegExp) => s.h1.some((x) => re.test(x));
  const has = (re: RegExp) => s.opts.some((o) => re.test(o.label));
  if (s.menuOpen) return 'menu';
  if (s.dialog) return `dialog:${s.dialog}`;
  if (s.ids.includes('countdown-number') || s.ids.includes('countdown-heading')) return 'V1';
  if (s.ids.includes('deal-progress')) return has(/^I'm /) && !s.privateParts.length && !has(/^Tap instead$|^Hold here|^Tap to see$|^Tap to hide$/) ? 'B1' : 'B2';
  if (s.ids.includes('night-progress')) return has(/^I'm /) && !has(/^Tap to see your night job$|^Tap to hide$/) && !s.privateParts.length ? 'N1' : 'N2';
  if (h(/^Night \d+$/)) return 'N0';
  if (h(/^Night over\.$/)) return 'N3';
  if (h(/^Morning, day \d+$/i)) return 'M1';
  if (h(/^Day \d+ · Talk it over$/i)) return 'Y1';
  if (h(/^Who got the most fingers\?$/i)) return 'V2';
  if (h(/^Tap everyone who is tied$/i)) return 'V2t';
  if (h(/^Still a tie\. Nobody is out today\.$/i)) return 'V3s';
  if (h(/ is out\.$/i)) return 'V4';
  if (h(/^(The Village wins!|The Mafia win!|Game ended\. No winner\.)$/i)) return 'G1';
  if (h(/^Tonight's Mafia$/i)) return 'G2';
  if (h(/^Who's playing\?$/)) return 'S1';
  if (h(/^Roles for \d+ players$/)) return 'S2';
  if (h(/^Read this aloud$/)) return 'S3';
  if (h(/^How to play$/)) return 'S4';
  if (h(/^What shall we play\?$/)) return 'picker';
  if (h(/^(History|Sessions)/)) return 'history';
  if (s.opts.some((o) => /^Host a game/.test(o.label))) return 'home';
  return null;
}

export interface Finding { kind: 'privacy' | 'stuck' | 'no way on' | 'not recognised' | 'main button' | 'layout' | 'console error' | 'crash' | 'replay' | 'did not finish'; step: number; screen: string; detail: string }
export interface MafResult { seed: string; config: Omit<MafConfig, 'persona'> & { persona: string }; byJev: boolean; findings: Finding[]; steps: number; jevDecisions: number; finished: boolean; screens: string[]; games: number; nights: number; votes: number; reloads: number; roomChecks: number; rolesKnown: number; flags: { step: number; screen: string; jevChoice: string; probability: number; mainButton: string }[] }

export async function playMafEvening(page: Page, cfg: MafConfig, opts: { jev?: Jev | null } = {}): Promise<MafResult> {
  const r: Rng = rngFrom(`maf-play:${cfg.seed}`);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const findings: Finding[] = [];
  const res: MafResult = { seed: cfg.seed, config: { ...cfg, persona: cfg.persona.id }, byJev: !!opts.jev, findings, steps: 0, jevDecisions: 0, finished: false, screens: [], games: 1, nights: 0, votes: 0, reloads: 0, roomChecks: 0, rolesKnown: 0, flags: [] };
  const add = (kind: Finding['kind'], step: number, screen: string, detail: string) => { if (!findings.some((f) => f.kind === kind && f.screen === screen && f.detail === detail)) findings.push({ kind, step, screen, detail }); };

  await page.setViewportSize({ width: cfg.width, height: cfg.height });
  const deals = Object.fromEntries([1, 2, 3].map((k) => [String(k), dealFor(cfg.players, `${cfg.seed}:${k}`)]));
  const f: Flow = { ...flow('deal-start'), deals, moves: [{ type: 'start', players: [...cfg.players], mafiaCount: oracleCounts(cfg.players.length).suggested }] } as Flow;
  const saved = savedFlow(f, { id: `mafia-sim-${cfg.seed}` });
  saved.setup.seeds.roles = `sim-${cfg.seed}`;
  await freshPhone(page, { time: FLOW_T0 + 60_000, storage: { ...(cfg.larger ? { 'pgn.pref.largerText': true } : {}), 'pgn.test.seeds': { mafia: { seeds: { roles: `sim-${cfg.seed}` } } }, 'pgn.test.load': saved } });
  await freezeClock(page);

  // The truth for the privacy check: what B2 showed each player, this game.
  let roles: Record<string, string> = {};
  const shownOut = new Set<string>(); // players whose role a room screen may show (out at night or voted out)
  let gameOver = false;
  const plan = { gamesDone: 0, joinDone: !cfg.join, leaveDone: !cfg.leave, picked: new Set<string>(), paused: false, ended: false, tie: 0 };
  let jevLeft = opts.jev ? MAF_JEV_PER_EVENING : 0;
  let lastKey = '', same = 0, blank = 0;
  const log: string[] = [];
  const rated = new Set<string>();
  const jevRepeats = new Map<string, number>();
  const maxSteps = Number(process.env.MAF_MAX_STEPS ?? 1500);

  for (let step = 1; step <= maxSteps; step++) {
    res.steps = step;
    await page.clock.runFor(2000 + r.int(97));
    let s: Snap;
    try { s = await snapshot(page); } catch (e) { add('crash', step, '?', String(e).slice(0, 160)); break; }
    const sc = screenOf(s); const screen = sc ?? 'unknown';
    if (!res.screens.includes(screen)) res.screens.push(screen);
    const nBefore = findings.length;

    // ---- checks ----
    if (!sc) add('not recognised', step, 'unknown', s.body.slice(0, 160));
    if (s.mains > 1) add('main button', step, screen, `${s.mains} main buttons`);
    if (s.scrollX) add('layout', step, screen, 'the page scrolls sideways');
    for (const e of errors.splice(0)) add('console error', step, screen, e.slice(0, 200));
    if (screen !== 'V1' && !s.opts.length) { if (++blank === 8) add('no way on', step, screen, `nothing to tap for 8 steps: ${s.body.slice(0, 100)}`); } else blank = 0;
    const key = `${screen}|${s.h1.join('/')}|${s.dialog ?? ''}|${s.passName ?? ''}`;
    if (key === lastKey) { if (++same === 30) add('stuck', step, screen, `30 steps on "${s.h1[0] ?? s.dialog ?? screen}"`); } else { lastKey = key; same = 0; }
    if (screen === 'B1' || screen === 'N1') plan.picked.clear(); // a new pass, whoever chose on the screen before
    if (screen === 'B2' && s.privateWord && s.passName) {
      const name = cfg.players.concat(['Imran2']).find((p) => p.toLowerCase() === s.passName!.toLowerCase());
      if (name) roles[name] = s.privateWord.replace(/^(the|a)\s+/i, '');
    }
    if (screen === 'B1' && /^Player 1 of/.test(await page.getByTestId('deal-progress').textContent().catch(() => '') ?? '')) { if (Object.keys(roles).length >= cfg.players.length) { roles = {}; shownOut.clear(); gameOver = false; } }
    if (screen === 'G1') gameOver = true;
    if (screen === 'M1' || screen === 'V4') {
      const line = await page.getByTestId('role-line').textContent({ timeout: 300 }).catch(() => null);
      const m = line && /^(.+?) was /i.exec(line.trim());
      if (m) { const p = cfg.players.find((x) => x.toLowerCase() === m[1]!.toLowerCase()); if (p) shownOut.add(p); }
      if (screen === 'V4') { const h = /^(.+?) is out\.$/i.exec(s.h1[0] ?? ''); const p = h && cfg.players.find((x) => x.toLowerCase() === h[1]!.toLowerCase()); if (p) shownOut.add(p); }
    }
    const room = !['B2', 'N2', 'G1', 'G2', 'home', 'picker', 'history', 'unknown'].includes(screen) && !gameOver;
    if (room) {
      res.roomChecks++;
      res.rolesKnown = Math.max(res.rolesKnown, Object.keys(roles).length);
      const dump = await roomDump(page).catch(() => '');
      if (s.privateParts.length) add('privacy', step, screen, `private parts in a room screen's page: ${s.privateParts.join(', ')}`);
      // A Police answer shows as a name next to "Mafia" or "Not Mafia": the name-and-role check below catches it (How to play's
      // "The Police learns only Mafia or Not Mafia." names nobody).
      for (const p of Object.keys(roles)) {
        if (shownOut.has(p)) continue;
        const near = new RegExp(`\\b${esc(p)}\\b[^\\n|]{0,40}\\b(mafia|doctor|police|villager)\\b|\\b(mafia|doctor|police|villager)\\b[^\\n|]{0,12}\\b${esc(p)}\\b`, 'i').exec(dump);
        if (near && !/Mafia caught/i.test(near[0])) add('privacy', step, screen, `"${near[0]}" (${p} is ${roles[p]}, not shown)`);
      }
      if (['N0', 'N1', 'N3'].includes(screen) && !s.dialog) {
        const named = cfg.players.filter((p) => p.toLowerCase() !== (s.passName ?? '').toLowerCase() && new RegExp(`\\b${esc(p)}\\b`, 'i').test(dump.replace(/^label:.*$/gm, '')));
        if (named.length) add('privacy', step, screen, `a night screen names ${named.join(', ')} (not the player it is passed to)`);
      }
      void ROLE_WORD;
    }

    // A screenshot only when this step found something (a screenshot every step made a local run ten times slower).
    if (findings.length > nBefore) { mkdirSync(`${MAF_RESULT_DIR}/${cfg.seed}`, { recursive: true }); await page.screenshot({ path: `${MAF_RESULT_DIR}/${cfg.seed}/finding-${step}.png` }).catch(() => {}); }
    // ---- choose ----
    let action: string | null = null; let viaJev = false;
    const choosable = !['V1'].includes(screen) && s.opts.length > 1;
    if (jevLeft > 0 && choosable && opts.jev && !['B2'].includes(screen)) {
      const labels = s.opts.map((o) => o.label);
      const role = screen === 'N2' && s.passName ? roles[cfg.players.find((p) => p.toLowerCase() === s.passName!.toLowerCase()) ?? ''] : undefined;
      const out = await askJev(opts.jev, cfg, screen, s, labels, !rated.has(screen), role);
      res.jevDecisions += out.decisions; jevLeft -= out.decisions;
      if (out.decisions) rated.add(screen);
      if (out.flag) res.flags.push({ step, screen, ...out.flag });
      if (out.choice !== null) {
        const o = s.opts[out.choice]!;
        const ending = /^(End for tonight|End the game)$/.test(o.label) && plan.gamesDone === 0 && !gameOver;
        const k = `${screen}|${o.label}|${s.h1[0] ?? ''}`;
        const n = (jevRepeats.get(k) ?? 0) + 1; jevRepeats.set(k, n);
        if (!ending && same < 6 && (n < 4 || o.main)) { action = o.key; viaJev = true; }
      }
    }
    if (!action) action = scripted(screen, s, cfg, plan, r, step, roles, gameOver);
    log.push(`${step} ${screen} ${s.h1[0] ?? s.dialog ?? ''}${s.passName ? ` [${s.passName}]` : ''} -> ${action}${viaJev ? ' (Jev)' : ''}`);
    if (action === 'done') { res.finished = true; break; }
    if (screen === 'N0') res.nights++;
    if (/^button:Vote .* out$/.test(action)) res.votes++;
    const before = action === 'action:reload' ? await page.evaluate(() => localStorage.getItem('pgn.game.mafia-sim') ?? Object.keys(localStorage).filter((k) => k.startsWith('pgn.game.')).map((k) => localStorage.getItem(k)).join('\n')) : null;
    try { await act(page, action, s, res); }
    catch (e) { add('crash', step, screen, `${action}: ${String(e).split('\n')[0]!.slice(0, 160)}`); await page.keyboard.press('Escape').catch(() => {}); }
    if (before !== null) {
      const after = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pgn.game.')).map((k) => localStorage.getItem(k)).join('\n'));
      const recs = (x: string) => x.split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((g) => g?.gameType === 'mafia').map((g) => JSON.stringify(g.records));
      const b = recs(before), a = recs(after);
      if (b.some((x) => !a.some((y) => y.startsWith(x.slice(0, -1))))) add('replay', step, screen, 'a reload lost saved moves');
    }
  }
  if (!res.finished) add('did not finish', res.steps, 'end', `still going after ${res.steps} steps`);
  if (findings.length) {
    const dir = `${MAF_RESULT_DIR}/${cfg.seed}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/steps.txt`, log.join('\n'));
  }
  return res;
}

type Plan = { gamesDone: number; joinDone: boolean; leaveDone: boolean; picked: Set<string>; paused: boolean; ended: boolean; tie: number };
function scripted(screen: string, s: Snap, cfg: MafConfig, plan: Plan, r: Rng, step: number, roles: Record<string, string>, over: boolean): string {
  const by = (re: RegExp) => s.opts.find((o) => re.test(o.label))?.key ?? null;
  const main = s.opts.find((o) => o.main)?.key ?? null;
  const room = ['B1', 'N0', 'N1', 'N3', 'M1', 'Y1', 'V2', 'V4'].includes(screen);
  if (room && !over) {
    if (cfg.reloadAt.includes(step)) return 'action:reload';
    if (cfg.hideAt.includes(step)) return 'action:hide';
    if (cfg.pause && !plan.paused && r.chance(0.05) && by(/^Pause$/)) { plan.paused = true; return by(/^Pause$/)!; }
    if ((!plan.joinDone || !plan.leaveDone) && ['M1', 'Y1'].includes(screen) && r.chance(0.4)) return by(/^Menu$/) ?? main!;
    if (cfg.endEarly && !plan.ended && plan.gamesDone === 0 && screen === 'Y1' && r.chance(0.2)) return by(/^Menu$/) ?? main!;
  }
  switch (screen) {
    case 'home': return plan.ended ? 'done' : (by(/^Mafia ·/) ?? 'done');
    case 'B1': case 'N1': plan.picked.clear(); return by(/^I'm /) ?? main ?? 'action:wait2000';
    case 'B2': {
      if (by(/^Tap instead$/)) return by(/^Tap instead$/)!;
      const me = (s.passName ?? '').toLowerCase();
      if (by(/^Tap to see$/) && !plan.picked.has(me)) { plan.picked.add(me); return by(/^Tap to see$/)!; }
      if (by(/^Tap to hide$/)) return by(/^Tap to hide$/)!;
      return main ?? 'action:wait2000';
    }
    case 'N2': {
      if (by(/^Tap to see your night job$/)) { plan.picked.clear(); return by(/^Tap to see your night job$/)!; }
      const names = s.opts.filter((o) => o.inNames);
      if (names.length && !s.opts.some((o) => o.inNames && o.pressed === 'true') && !main) {
        const who = cfg.players.find((p) => p.toLowerCase() === (s.passName ?? '').toLowerCase()) ?? '';
        const role = (roles[who] ?? '').toLowerCase();
        const pool = role === 'mafia' ? names.filter((o) => !/mafia/i.test(roles[cfg.players.find((p) => o.label.toLowerCase().startsWith(p.toLowerCase())) ?? ''] ?? '')) : names;
        return r.pick(pool.length ? pool : names).key;
      }
      return main ?? 'action:wait2000';
    }
    case 'N0': case 'N3': case 'M1': case 'V4': case 'V3s': return main ?? 'action:wait2000';
    case 'Y1': return main ?? 'action:wait2000';
    case 'V1': return 'action:wait2000';
    case 'V2': {
      const names = s.opts.filter((o) => !o.main && cfg.players.some((p) => o.label.toLowerCase() === p.toLowerCase()));
      if (main && /^Vote .* out$/.test(s.mainLabel ?? '')) return main;
      const tie = by(/^It's a tie$/); const still = by(/^Still a tie$/); const nobody = by(/^Nobody today$/);
      if (still && r.chance(0.3)) return still;
      if (tie && plan.tie === 0 && r.chance(0.15)) { plan.tie = 1; return tie; }
      if (nobody && r.chance(0.05)) return nobody;
      return names.length ? r.pick(names).key : (main ?? 'action:wait2000');
    }
    case 'V2t': {
      const names = s.opts.filter((o) => !o.main && cfg.players.some((p) => o.label.toLowerCase().startsWith(p.toLowerCase())));
      const ticked = names.filter((o) => o.pressed === 'true').length;
      plan.tie = 0;
      if (ticked >= 2 && main) return main;
      const untick = names.filter((o) => o.pressed !== 'true');
      return untick.length ? untick[0]!.key : (by(/^Not a tie$/) ?? 'action:escape');
    }
    case 'G1': plan.gamesDone++; if (plan.gamesDone < cfg.games) return main ?? 'action:escape'; return by(/^End for tonight$/) ?? 'action:escape';
    case 'G2': plan.ended = true; return by(/^← Home$/) ?? main ?? 'done';
    case 'menu': {
      if (!plan.joinDone || !plan.leaveDone) return by(/^Players$/) ?? 'action:escape';
      if (cfg.endEarly && !plan.ended && by(/^End the game$/)) { cfg.endEarly = false; return by(/^End the game$/)!; }
      return 'action:escape';
    }
    default: break;
  }
  if (screen.startsWith('dialog:')) {
    const d = screen.slice(7);
    if (d === 'Paused') return by(/^Carry on$/) ?? main!;
    if (d === 'Players') {
      if (!plan.joinDone) { plan.joinDone = true; return 'macro:join'; }
      if (!plan.leaveDone) { plan.leaveDone = true; return 'macro:leave'; }
      return by(/^Done$/) ?? 'action:escape';
    }
    if (/has to leave\?$/.test(d)) return by(/ leaves$/) ?? main!;
    if (/^End this game with no winner\?$/.test(d)) return by(/^End the game$/) ?? main!;
    if (/^End for tonight\?$/.test(d)) return by(/^End for tonight$/) ?? main!;
    if (/^Nobody out today\?$/.test(d)) return by(/^Nobody today$/) ?? main!;
    if (/^Deal again\?$/.test(d)) return by(/^Keep these roles$/) ?? main!;
    if (/^Whose role\?$/.test(d)) return by(/^Cancel$/) ?? 'action:escape';
    return main ?? by(/^(Done|OK|Close|Cancel)$/) ?? 'action:escape';
  }
  if (!s.opts.length) return 'action:wait2000';
  return main ?? s.opts[0]!.key;
}

async function act(page: Page, action: string, s: Snap, res: MafResult) {
  if (action.startsWith('action:wait')) { await page.clock.runFor(Number(action.slice(11)) || 1000); return; }
  switch (action) {
    case 'action:escape': await page.keyboard.press('Escape'); return;
    case 'action:reload': res.reloads++; await page.reload(); return;
    case 'action:hide':
      await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.clock.runFor(30_000);
      await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
      return;
    case 'macro:join': { const field = page.getByRole('dialog').getByRole('textbox').first(); await field.fill('Imran'); await field.press('Enter'); return; }
    case 'macro:leave': { const x = page.getByRole('dialog').getByRole('button', { name: /^Remove / }); const n = await x.count(); if (n > 5) await x.nth(n - 1).click({ timeout: 3000 }); return; }
    default: {
      const o = s.opts.find((x) => x.key === action);
      if (!o) throw new Error(`no option ${action}`);
      await page.locator(`[data-sim="${o.idx}"]`).first().click({ timeout: 3000, force: true });
      if (s.opts.find((x) => x.key === action)?.inNames) await page.clock.runFor(4100); // the night job guard
    }
  }
}

async function askJev(jev: Jev, cfg: MafConfig, screen: string, s: Snap, labels: string[], rate: boolean, role?: string): Promise<{ choice: number | null; flag: { jevChoice: string; probability: number; mainButton: string } | null; decisions: number }> {
  const criteria = Object.fromEntries(labels.map((l, i) => [`b${i}`, `Tap "${l}"`]));
  const text = `Screen: ${s.h1.join(' / ') || s.dialog || screen}. Buttons: ${labels.join(' | ')}`.slice(0, 700);
  const who = role ? ` It is your secret night turn; your role is ${role}.` : '';
  const qs: Record<string, any> = { act: { type: 'choice', instructions: { question: `You are ${cfg.persona.describe}, playing Mafia (one phone passed round; the phone runs the night and the vote) at a family party.${who} Which do you tap now?`, screen: text, note: 'Pick what this person would really do. The app decides every result.' }, criteria } };
  if (rate && !role) qs.rate = { type: 'choice', instructions: { question: 'You are seeing this phone screen for the first time. Which button would you press next to carry on the game?', screen: text }, criteria };
  if (!jev.available(Object.keys(qs).length)) return { choice: null, flag: null, decisions: 0 };
  const ans = await jev.choose({ game: 'Mafia', screen }, qs);
  if (!ans) return { choice: null, flag: null, decisions: 0 };
  const top = (a: any): [string, number] | null => { const e = Object.entries((a?.probabilities ?? {}) as Record<string, number>).sort((x, y) => y[1] - x[1])[0]; return e ? [e[0], Number(e[1])] : null; };
  const a = top(ans.act); const i = a ? Number(a[0].slice(1)) : NaN;
  const mainIdx = s.opts.findIndex((o) => o.main);
  let flag = null;
  const rt = qs.rate ? top(ans.rate) : null;
  if (rt && mainIdx >= 0) { const j = Number(rt[0].slice(1)); if (labels[j] !== undefined && j !== mainIdx && rt[1] >= 0.6) flag = { jevChoice: labels[j]!, probability: Math.round(rt[1] * 100) / 100, mainButton: labels[mainIdx]! }; }
  return { choice: Number.isInteger(i) && labels[i] !== undefined ? i : null, flag, decisions: Object.keys(qs).length };
}

export function saveMafResult(res: MafResult) {
  mkdirSync(MAF_RESULT_DIR, { recursive: true });
  writeFileSync(`${MAF_RESULT_DIR}/maf-${res.seed}.json`, JSON.stringify(res, null, 1));
}
