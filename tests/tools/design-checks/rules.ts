// The design rules. Each takes the screens (model.ts) and returns findings or "cannot check" results.
// Never guesses: where the source does not say, the result is "cannot", with the reason.
import type { Result, Rule, Screen, ScreenSet } from './model.ts';
import { quotedStrings } from './read-map.ts';

export interface Config {
  /** Scenario ids that exist (null: not supplied, so R6 cannot check that they exist). */
  knownScenarioIds: Set<string> | null;
  /** Screens shown between rounds or turns; guideline 47a: "carry on" and "stop" both visible, "← Home" leaves saved. */
  betweenRounds: Record<string, { need: string[]; why: string }>;
  /** Screens that are steps of a game in progress: playbook 12a wants stop and home visible without a menu. */
  gameSteps: string[];
  /** Phrases that must not appear on screen (decided for this game). */
  bannedWords: { word: RegExp; why: string; allow?: RegExp }[];
  /** Words retired for another game whose scope for this game is not decided: reported as "cannot check". */
  scopeUndecided: { word: RegExp; why: string }[];
  /** Button labels the guidelines forbid (15: never Yes/No). */
  bannedLabels: RegExp;
  /** Screens that show a secret by their own words and where it is not secret any more (after the game). */
  notSecret: Record<string, string>;
  /** Accepted exceptions, each with the decision that accepts it. */
  exceptions: { rule: Rule; screen: string; ref: string; why: string }[];
}

export const SECRET_WORDS: Omit<Config, 'knownScenarioIds'> = {
  betweenRounds: {
    G1: { need: ['carry on', 'stop', 'home'], why: 'game over: next game, end the night, leave' },
    G2: { need: ['carry on', 'home'], why: 'summary: the night is already ended, so no "stop" is needed' },
  },
  gameSteps: ['S6', 'S7', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
  bannedWords: [
    { word: /\b(spymasters?|agents?|operatives?|assassins?|key cards?|codenames?)\b/i, why: 'Codenames vocabulary (ux.md "No Codenames vocabulary")', allow: /Inspired by Codenames/i },
  ],
  scopeUndecided: [
    { word: /\b(evenings?|nights?|sessions?|crew|steals?)\b/i, why: 'retired on Impostor screens (decisions I25); whether Secret Words follows is not decided (its own ux.md says "evening")' },
  ],
  bannedLabels: /^(yes|no|ok|okay)$/i,
  notSecret: { G1: 'game over: the whole map is shown by design', E1: 'history of finished games', E1a: 'history of a finished game' },
  exceptions: [
    { rule: 'R7 secret behind a hold', screen: 'S7', ref: 'decisions K19 / K3', why: 'the map code and QR are shown to clue givers on the host phone; accepted as family trust' },
    { rule: 'R7 secret behind a hold', screen: 'S7a', ref: 'decisions K19 / K3', why: 'same code shown again on request' },
  ],
};

const f = (rule: Rule, screen: string, text: string): Result => ({ kind: 'finding', rule, screen, text });
const c = (rule: Rule, screen: string, text: string): Result => ({ kind: 'cannot', rule, screen, text });
const short = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function runRules(set: ScreenSet, cfg: Config): Result[] {
  const out: Result[] = [];
  const ids = new Set(set.screens.map((s) => s.id));
  const byId = new Map(set.screens.map((s) => [s.id, s]));
  const inbound = new Map<string, number>();
  const silent: string[] = []; const unnamed: string[] = [];
  const bump = (id: string) => inbound.set(id, (inbound.get(id) ?? 0) + 1);

  for (const s of set.screens) {
    // ---- R2: every button leads somewhere
    const words: string[] = []; const undefinedIds = new Set<string>();
    for (const b of s.buttons) {
      const t = b.target;
      if (t.kind === 'none') out.push(f('R2 button leads somewhere', s.id, `"${short(b.label)}" has no "leads to" written`));
      else if (t.kind === 'screen') {
        for (const id of t.ids) { bump(id); if (!ids.has(id)) undefinedIds.add(id); }
      } else if (t.kind === 'words') words.push(short(b.label, 40));
    }
    for (const id of undefinedIds) out.push(f('R2 button leads somewhere', s.id, `leads to ${id}, which has no section or row of its own in the map (its buttons are not checked)`));
    if (words.length) out.push(c('R2 button leads somewhere', s.id, `${words.length} row(s) say what happens only in words, with no screen id, so the target cannot be checked: ${words.map((w) => `"${w}"`).join(', ')}`));
    for (const b of s.buttons) if (b.target.kind === 'external') out.push(c('R2 button leads somewhere', s.id, `"${short(b.label, 40)}" leads to ${b.target.name}, a screen outside this map`));

    // ---- R1: a way out
    const exits = s.buttons.filter((b) => (b.target.kind === 'screen' && b.target.ids.some((i) => i !== s.id)) || b.target.kind === 'dynamic' || b.target.kind === 'external');
    const visibleOut = (s.intentions ?? []).filter((i) => i.visible && /^(back|home|stop|hide|done)/.test(i.name));
    if (!exits.length && !visibleOut.length) {
      const onlyWords = s.buttons.some((b) => b.target.kind === 'words');
      out.push(onlyWords
        ? c('R1 way out', s.id, 'no row names another screen or a way back; some rows are described only in words, so a way out cannot be ruled in or out')
        : f('R1 way out', s.id, 'no button leads to another screen and no back, home, stop or done is shown'));
    }

    // ---- R4: one main button
    const mains = new Set(s.mainLabels.map((m) => m.replace(/\s+/g, ' ')));
    for (const b of s.buttons) if (b.isMain) mains.add(b.label);
    for (const m of mains) if (/\b(end|delete|clear|remove|start new)\b/i.test(m)) out.push(f('R4 one main button', s.id, `the main button "${m}" is destructive (guideline 17a: never the main button)`));
    if (s.noMain) {
      const inDesc = s.mainLabelsInDescription;
      if (inDesc.length) out.push(f('R4 one main button', s.id, `the map says "no main" but its description also names a main button: ${inDesc.map((m) => `"${m}"`).join(', ')}`));
      else if (mains.size) out.push(c('R4 one main button', s.id, `says "no main", and a row names ${[...mains].map((m) => `"${m}"`).join(', ')} as main; probably a dialog opened from this screen, but the map does not say so`));
    }
    else if (mains.size > 1) out.push(c('R4 one main button', s.id, `names ${mains.size} main labels (${[...mains].map((m) => `"${short(m, 35)}"`).join(', ')}); they may be states of one button, so "one at a time" cannot be checked`));
    else if (mains.size === 0 && !s.mainMentioned && s.kind === 'screen') silent.push(s.id);
    else if (mains.size === 0 && s.mainMentioned && !s.noMain) unnamed.push(s.id);

    // ---- R5: banned words
    const strings = quotedStrings(s);
    const hit = new Map<string, Set<string>>(); const soft = new Map<string, Set<string>>();
    for (const str of strings) {
      for (const bw of cfg.bannedWords) { const m = bw.word.exec(str); if (m && !(bw.allow && bw.allow.test(str))) { if (!hit.has(bw.why)) hit.set(bw.why, new Set()); hit.get(bw.why)!.add(`"${short(str, 50)}" (${m[0]})`); } }
      for (const bw of cfg.scopeUndecided) { const m = bw.word.exec(str); if (m) { if (!soft.has(bw.why)) soft.set(bw.why, new Set()); soft.get(bw.why)!.add(`"${short(str, 50)}" (${m[0]})`); } }
    }
    for (const [why, set2] of hit) out.push(f('R5 banned words', s.id, `${[...set2].join('; ')}: ${why}`));
    for (const [why, set2] of soft) out.push(c('R5 banned words', s.id, `${[...set2].join('; ')}: ${why}`));
    for (const b of s.buttons) if (cfg.bannedLabels.test(b.label.trim())) out.push(f('R5 banned words', s.id, `button "${b.label}" is a bare yes/no/ok (guideline 15: name the action)`));

    // ---- R6: every rule hook has a scenario id
    for (const b of s.buttons) {
      const rec = b.records.trim();
      const hook = rec !== '' && !/^[—-]$/.test(rec) && !/^(nothing|see each|as S7)/i.test(rec) && !/^UI\b/.test(rec);
      if (hook && !b.scenarioIds.length) out.push(f('R6 rule hook has a scenario', s.id, `"${short(b.label, 45)}" records "${short(rec, 40)}" but its ids cell is "${b.idsText || 'empty'}"`));
      if (b.scenarioIds.length && cfg.knownScenarioIds) for (const id of b.scenarioIds) if (!cfg.knownScenarioIds.has(id)) out.push(f('R6 rule hook has a scenario', s.id, `"${short(b.label, 45)}" cites ${id}, which is not in the scenarios file`));
    }
  }

  if (silent.length) out.push(c('R4 one main button', '-', `the map does not say whether these screens have a main button: ${silent.join(', ')}`));
  if (unnamed.length) out.push(c('R4 one main button', '-', `a main button is mentioned but not named on: ${unnamed.join(', ')}`));
  // ---- R2 (whole map): path list and orphans
  for (const p of set.paths) for (const id of [p.from, p.to]) if (!ids.has(id)) out.push(f('R2 button leads somewhere', '-', `the paths list uses ${id}, which is not a screen in the map`));
  for (const p of set.paths) bump(p.to);
  for (const s of set.screens) if (!(inbound.get(s.id))) out.push(f('R1 way out', s.id, 'no row or path in the map names this screen, so as written nobody can reach it'));

  // ---- R3: stop and home
  for (const [id, need] of Object.entries(cfg.betweenRounds)) {
    const s = byId.get(id);
    if (!s) { out.push(f('R3 stop and home', id, `listed as a between-rounds screen but not in the map`)); continue; }
    if (!s.intentions) { out.push(c('R3 stop and home', id, 'no Intentions line to read')); continue; }
    for (const n of need.need) {
      const hit = s.intentions.find((i) => i.name === n || (n === 'carry on' && /play on|carry on|next/.test(i.name)));
      if (!hit) out.push(f('R3 stop and home', id, `guideline 47a (${need.why}): "${n}" is not listed among the screen's intentions`));
      else if (!hit.visible) out.push(f('R3 stop and home', id, `guideline 47a: "${n}" is only in the menu`));
    }
  }
  for (const id of cfg.gameSteps) {
    const s = byId.get(id);
    if (!s) continue;
    if (!s.intentions) { out.push(c('R3 stop and home', id, 'no Intentions line to read')); continue; }
    const menuOnly: string[] = []; const missing: string[] = [];
    for (const n of ['stop', 'home']) {
      const hit = s.intentions.find((i) => i.name === n);
      if (!hit) missing.push(n); else if (!hit.visible) menuOnly.push(n);
    }
    if (missing.length) out.push(c('R3 stop and home', id, `${missing.join(' and ')} not mentioned in the Intentions line, so whether they are reachable cannot be told`));
    if (menuOnly.length) out.push(f('R3 stop and home', id, `${menuOnly.join(' and ')} only in the menu (playbook 12a: a common intention reachable only through a menu is a finding; the map chose this on purpose, so it needs the owner's explicit decision)`));
  }

  // ---- R7: every secret is behind a hold
  const SECRET = /Your words|Landmine word|Our words|map area|Whole map|Hide map|Orange list|QR ≥|or type:/;
  const HOLD = /\bpad\b|\bhold\b|Tap to see|Show map|Tap to hide/i;
  const AUTO = /60 s|app hidden|silence/i;
  const secretOf = (s: Screen): boolean | 'via' => {
    if (SECRET.test(s.words) || s.buttons.some((b) => SECRET.test(b.label))) return true;
    return /^as (S\d+[a-z]?)\b/.test(s.words) ? 'via' : false;
  };
  for (const s of set.screens) {
    let sec = secretOf(s);
    if (sec === 'via') { const m = /^as (S\d+[a-z]?)/.exec(s.words)!; const o = byId.get(m[1]); sec = o ? secretOf(o) === true : false; }
    if (!sec) continue;
    if (cfg.notSecret[s.id]) continue;
    const exc = cfg.exceptions.find((e) => e.rule === 'R7 secret behind a hold' && e.screen === s.id);
    if (exc) { out.push({ kind: 'cannot', rule: 'R7 secret behind a hold', screen: s.id, text: `ACCEPTED EXCEPTION ${exc.ref}: ${exc.why}` }); continue; }
    const all = [s.words, ...s.buttons.map((b) => `${b.label} ${b.leadsText}`)].join(' ');
    if (HOLD.test(all) && AUTO.test(all)) {
      if (/Hide map/.test(all) && !/\bpad\b|Tap to see|\bhold\b/i.test(all)) out.push(c('R7 secret behind a hold', s.id, 'the map has a Hide/Show toggle and hides after 60 s, but the source never says whether it starts hidden or shown'));
    } else if (HOLD.test(all)) out.push(f('R7 secret behind a hold', s.id, 'a secret is shown, and its reveal control has no auto-hide (guideline 45: held, or tapped with an auto-hide)'));
    else out.push(f('R7 secret behind a hold', s.id, 'a secret is on screen with no hold or tap-to-show control written in the map (guideline 45)'));
  }
  return out;
}
