// A screen the prototype script gives an exact state for (a "K… Exact states for the renderer" bullet, e.g. What Am I?'s
// K4). The screen's *Words* are read as clauses, each with its role ("heading", "main", "quiet", "input", "Switch",
// "line"…); the state bullet adds what the words only describe: which quoted words are buttons and where they lead
// ("(→ A2)"), lists of the example night's names, radio groups with a ✓, switches, numbered lines from the scenarios,
// drawings as labelled boxes, a scoreboard from the example rounds, word chips that move between lists, a big word with
// tap halves, a countdown. Nothing here knows a game: every name, word and number comes from the map and its script.
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { BlocksRoot, Dialog, HideMainButton, MainButton, OptionButton, QuietButton, Screen, ScreenContent, Sheet, Toast, useToast } from '../blocks';
import type { ProtoMap, ProtoScreen } from './parse';
import { stripParens, type Script } from './script';
import {
  WORD_NUM,
  clauses,
  clean,
  drawingLabels,
  guardFor,
  itemLines,
  leadOf,
  ordinal,
  parenQuotes,
  quotesOf,
  roundsOf,
  scoreboard,
  sequenceFrom,
  wordVariants,
} from './states';

export interface Arrive {
  lines: string[];
  heading?: string;
  toast?: string;
  /** The screen the toast's Undo opens. */
  undo?: string;
  from?: string;
}

export interface Nav {
  /** Opens a screen; `subject`: the player it is now for ("T1 for Arjun"). */
  go: (to: string, arrive: Arrive, subject?: string) => void;
  back: () => void;
  /** Remembers that something happened this visit ("the first time"). */
  mark: (key: string) => void;
}

/**
 * The main button with the map's visible tap guard: greyed for `ms` after it appears, then alive; a second tap within
 * the guard (a double tap) counts once. Its own component, so the guard ending redraws only the button.
 */
export function GuardedMain({
  ms,
  inline,
  disabled,
  onClick,
  children,
}: {
  ms: number;
  inline?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const [live, setLive] = useState(ms <= 0);
  const last = useRef(0);
  useEffect(() => {
    if (ms <= 0) return;
    const t = setTimeout(() => setLive(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return (
    <MainButton
      {...(inline ? { inline } : {})}
      disabled={!!disabled || !live}
      onClick={() => {
        if (!live || Date.now() - last.current < Math.max(ms, 500)) return;
        last.current = Date.now();
        onClick();
      }}
    >
      {children}
    </MainButton>
  );
}

const ID_RE = /\b([A-Z]\d+[a-z]?)\b/g;
const BACK = /^(back\b|close\b)|\bthe step\b|\bopened from\b|\bcame from\b|\bback here\b/i;
const CONDITION = /^(when|while|if|after|under|over|tie|mid-turn|before|once|from|taps only|hands-free)\b[^"]*:$/;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const low = (s: string) => s.toLowerCase();

function tellBar(text: string) {
  if (window.parent !== window) window.parent.postMessage({ proto: 'note', text }, location.origin);
}

type Part =
  | { t: 'h1'; text: string }
  | { t: 'p'; text: string; small?: boolean }
  | { t: 'button'; label: string; sub: string[]; to?: string }
  | { t: 'main' }
  | { t: 'input'; placeholder: string; add?: string }
  | { t: 'switch'; label: string; on: boolean; line?: string }
  | { t: 'radio'; title: string; options: { text: string; line?: string }[]; chosen: number; line?: string }
  | { t: 'names' }
  | { t: 'ol'; lines: string[] }
  | { t: 'boxes'; labels: string[] }
  | { t: 'scores'; lines: string[] }
  | { t: 'chips'; lists: { name: string; colour: string; words: string[] }[] }
  | { t: 'big'; texts: string[] }
  | { t: 'word' };

/** "(→ …)" after a quoted label in the state bullet: where it leads. */
function inlineTargets(state: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of state.matchAll(/"([^"]+)"\s*\((?:→|->)\s*([^()]*)\)/g)) out.set(m[1] as string, m[2] as string);
  return out;
}

/** The first screen ID a "Leads to" names (outside quotes; outside brackets first). */
function firstId(to: string, known: Set<string>): string | undefined {
  const t = to.replace(/"[^"]*"/g, ' ');
  const outside = [...stripParens(t).matchAll(ID_RE)].map((m) => m[1] as string).find((i) => known.has(i));
  return outside ?? [...t.matchAll(ID_RE)].map((m) => m[1] as string).find((i) => known.has(i));
}

/** Splits "Mix of all · 714 words with "…" · Animals · 92 words · …" into options (a count joins the name before it). */
function optionsOf(text: string): { text: string; line?: string }[] {
  const pieces: string[] = [];
  let cur = '';
  let quoted = false;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (c === '"') quoted = !quoted;
    else if (!quoted && c === '(') depth++;
    else if (!quoted && c === ')') depth = Math.max(0, depth - 1);
    if (!quoted && depth === 0 && text.startsWith(' · ', i)) {
      pieces.push(cur);
      cur = '';
      i += 2;
      continue;
    }
    cur += c;
  }
  pieces.push(cur);
  const out: { text: string; line?: string }[] = [];
  for (const raw of pieces) {
    const p = stripParens(raw).trim();
    const line = /\bwith\s+"([^"]+)"/.exec(p)?.[1];
    const name = clean(p.replace(/\bwith\s+"[^"]*"/, ''));
    if (!name) continue;
    const last = out[out.length - 1];
    if (last && /^\d[\d,]*\s+\w+$/.test(name) && !/^\d/.test(last.text)) {
      last.text = `${last.text} · ${name}`;
      if (line) last.line = line;
      continue;
    }
    out.push({ text: name, ...(line ? { line } : {}) });
  }
  return out;
}

export function StateView({
  map,
  screen,
  script,
  state,
  arrive,
  subject,
  seen,
  scenarios,
  under,
  nav,
}: {
  map: ProtoMap;
  screen: ProtoScreen;
  script: Script;
  state: { text: string; index: number };
  arrive: Arrive | undefined;
  subject: string | undefined;
  seen: string[];
  scenarios: string;
  under?: ReactNode;
  nav: Nav;
}) {
  const st = state.text;
  // The screen's rows; a dialog cell "Done → back; ✕ → D3; …" holds several buttons, one per "→".
  const rows = screen.rows.flatMap((r) => {
    const [to, ...more] = r.to.split(/;\s*(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const extra = more
      .map((m) => /^(.*?)\s(?:→|->)\s(.*)$/.exec(m.trim()))
      .filter((m): m is RegExpExecArray => !!m)
      .map((m) => ({ label: m[1] as string, to: m[2] as string, ids: r.ids }));
    return extra.length ? [{ ...r, to: to ?? '' }, ...extra] : [r];
  });
  const known = new Set(map.screens.map((s) => s.id));
  const players = script.players;
  const variants = wordVariants(screen.kind === 'screen' ? screen.notes : `Words: ${screen.notes}`);
  const [variant, setVariant] = useState(0);
  const [names, setNames] = useState<string[]>(players);
  const [typed, setTyped] = useState('');
  const [radio, setRadio] = useState<Record<string, number>>({});
  const [switches, setSwitches] = useState<Record<string, boolean>>({});
  const [chips, setChips] = useState<{ word: string; list: number; moved: boolean }[] | null>(null);
  const [wordAt, setWordAt] = useState(0);
  const [flash, setFlash] = useState<{ text: string; colour: string } | null>(null);
  const [tick, setTick] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const hideMain = useContext(HideMainButton);
  const [toast, showToast, clearToast] = useToast();
  const [portrait, setPortrait] = useState(() => innerHeight >= innerWidth);
  const shownAt = useRef(Date.now());
  const lastHalf = useRef(Date.now());

  // The player this screen is for: the script's first player, or the one a tap named ("T1 for Arjun").
  const who = (s: string) => (subject && players[0] ? s.replace(new RegExp(`\\b${esc(players[0])}\\b`, 'g'), subject) : s);
  const show = (s: string) => who(clean(s));

  // ——— Where taps lead ———
  const targets = inlineTargets(st);
  const rowFor = (label: string): string | undefined => {
    const l = low(clean(label));
    for (const r of rows) {
      const pieces = clean(r.label).split(/\s+\/\s+/);
      const tos = r.to.split(/\s+\/\s+/);
      const i = pieces.findIndex((p) => {
        const pl = low(p);
        return pl === l || low(p.split(',')[0] ?? '') === l || (l.length >= 4 && pl.startsWith(l));
      });
      if (i >= 0) return pieces.length > 1 && tos.length === pieces.length ? tos[i] : r.to;
    }
    return undefined;
  };
  const targetFor = (label: string) => {
    for (const [k, v] of targets) if (low(clean(k)) === low(clean(label))) return v;
    return rowFor(label);
  };
  const outcomeFor = (text: string) => script.outcomes.find((o) => o.screen === screen.id && o.tap && low(text).includes(o.tap));

  const follow = (label: string, to: string | undefined, extra = '') => {
    setMenuOpen(false);
    const o = outcomeFor(`${label} ${extra}`);
    if (o?.to) {
      // A term the script quotes itself ("the where-line "Round 2 · …"") is not added a second time.
      const lines = o.lines.length ? o.lines : o.terms.map((t) => script.terms[t] ?? '').filter(Boolean);
      return nav.go(o.to, { lines, from: label, ...(o.heading ? { heading: o.heading } : {}), ...(o.toast ? { toast: o.toast } : {}) });
    }
    if (!to) return tellBar(`Not in the map: "${clean(label)}" leads nowhere.`);
    const first = (to.split(/;(?=(?:[^"]*"[^"]*")*[^"]*$)/)[0] ?? '').trim();
    if (BACK.test(first)) return nav.back();
    const id = firstId(to, known);
    if (!id) {
      if (BACK.test(to)) return nav.back();
      const t = /\btoast\s+"([^"]+)"/.exec(to)?.[1];
      if (t) return showToast(show(t), /· Undo$/.test(t) ? () => undefined : undefined);
      return tellBar(`Stays on this screen: ${clean(to)}`);
    }
    if (id === screen.id && variants.length > 1) {
      setVariant((v) => (v + 1) % variants.length);
      return;
    }
    const outside = to.replace(/"[^"]*"/g, ' ');
    const forName = new RegExp(`\\b${id}\\b[^;]*?\\bfor\\s+([A-Z]\\w*)`).exec(outside)?.[1];
    const toastText = /\btoast\s+"([^"]+)"/.exec(to)?.[1];
    const undo = /\bUndo\s*(?:→|->)\s*([A-Z]\d+[a-z]?)/.exec(to)?.[1];
    nav.go(
      id,
      { lines: [], from: label, ...(toastText ? { toast: counted(toastText) } : {}), ...(undo && known.has(undo) ? { undo } : {}) },
      forName && players.includes(forName) ? forName : map.screens.find((x) => x.id === id)?.kind !== 'screen' ? subject : undefined,
    );
  };

  // ——— The main button ———
  const absent = /\bmain absent\b/i.test(st);
  const kMain = /\bmain(?:\s+button)?\s+"([^"]+)"/i.exec(st)?.[1] ?? /"([^"]+)"\s*\(main\)/i.exec(st)?.[1];
  const mainAbove = kMain ? new RegExp(`main(?:\\s+button)?\\s+"${esc(kMain)}"\\s*(?:\\([^)]*\\))?\\s*above\\b`, 'i').test(st) : false;
  const firstTime = /\bmain\s*(?:→|->)\s*([A-Z]\d+[a-z]?)\s+the first time,\s*then\s+([A-Z]\d+[a-z]?)/i.exec(st);
  // K4 names some buttons with their lines ("a button of two lines "A" / "B"", "the card button "A" with its line "B"").
  const kButtons = new Map<string, string[]>();
  for (const m of st.matchAll(/button of two lines\s+"([^"]+)"\s*\/\s*"([^"]+)"/gi)) kButtons.set(m[1] as string, [m[2] as string]);
  for (const m of st.matchAll(/card button\s+"([^"]+)"\s+with its line\s+"([^"]+)"/gi)) kButtons.set(m[1] as string, [m[2] as string]);

  // ——— The parts, from the words' clauses ———
  const words = variants[variant]?.text ?? '';
  const parts: Part[] = [];
  let mainLabel: string | undefined = kMain;
  let pause = false;
  let menu = false;
  const globalInput = (() => {
    for (const s of map.screens) {
      const m = /\binput\s+"([^"]+)"\s*\+\s*"([^"]+)"/.exec(s.notes);
      if (m) return { placeholder: m[1] as string, add: m[2] as string };
    }
    return undefined;
  })();
  const rounds = roundsOf(script.parts, players);
  const bigWord = /\bthe word\s+\*\*([^*]+)\*\*/.exec(st)?.[1] ?? /\bthe word\s+([A-Z]{2,})\b/.exec(st)?.[1];
  const sequence = bigWord ? sequenceFrom(script.parts, bigWord.charAt(0) + low(bigWord.slice(1)), players) : [];

  for (const c of clauses(words)) {
    const lead = leadOf(c);
    const qs = quotesOf(c).filter((q) => !q.alt);
    const claimed = qs.find((q) => kButtons.has(q.text) || q.text === kMain);
    if (claimed) {
      if (claimed.text === kMain) {
        if (mainAbove) parts.push({ t: 'main' });
      } else parts.push({ t: 'button', label: claimed.text, sub: kButtons.get(claimed.text) ?? [] });
      continue;
    }
    if (CONDITION.test(lead)) continue;
    if (/^per (name|player)\b/.test(lead)) continue;
    if (/\btip line\b|\bat most one\b/.test(lead)) {
      if (/\bno\s+tip line\b/i.test(st) || !qs[0]) continue;
      parts.push({ t: 'p', text: qs[0].text, small: true });
      continue;
    }
    if (/\bscoreboard\b/.test(lead) && rounds.length) {
      const phases = [...st.matchAll(/after round (\d+)|at game over/gi)];
      const ph = phases[state.index] ?? phases[0];
      const upto = ph?.[1] ? Number(ph[1]) : rounds.length;
      const example = [...st.matchAll(/"([^"]+)"/g)].map((m) => m[1] as string).find((q) => players.some((p) => q.startsWith(`${p} `)));
      parts.push({ t: 'scores', lines: scoreboard(rounds, players, upto, /\bturns?\b/.test(example ?? c)) });
      continue;
    }
    if (/\blists?\b/.test(lead) && /\bchips\b/i.test(st)) {
      const body = c.slice(c.indexOf(':') + 1);
      const lists = [...body.matchAll(/([A-Z][\w' ]*?)\s*(?:\(([^)]*)\))?\s*"([^"]+)"/g)].map((m) => ({
        name: (m[1] as string).trim(),
        colour: (m[2] ?? '').trim(),
        words: (m[3] as string).split(/\s*·\s*/),
      }));
      if (lists.length) parts.push({ t: 'chips', lists });
      continue;
    }
    if (/\bnames\b/.test(lead) && /\bnames\b/i.test(st)) {
      parts.push({ t: 'names' });
      continue;
    }
    if (/\badd row\b/.test(c) && globalInput) {
      parts.push({ t: 'input', ...globalInput });
      continue;
    }
    const item = /\bitem\s+(\d+)\b/i.exec(st)?.[1];
    if (/\bsteps\b|\bshort lines\b/.test(c) && item) {
      parts.push({ t: 'ol', lines: itemLines(scenarios, Number(item)) });
      const n = /\bthe\s+(\w+)\s+drawings\b/i.exec(st)?.[1];
      if (n) {
        const count = WORD_NUM[low(n)] ?? Number(n);
        const from = drawingLabels(scenarios, count);
        const said = /drawings of (.+)$/i.exec(stripParens(c))?.[1]?.split(/,\s*(?:and\s+)?|\s+and\s+/) ?? [];
        parts.push({ t: 'boxes', labels: from.length ? from : said.slice(0, count) });
      }
      continue;
    }
    if (/^(the\s+)?drawing\b/i.test(c)) {
      const what = /^drawing of (.+)$/i.exec(stripParens(c))?.[1];
      parts.push({ t: 'boxes', labels: [what ? `Drawing: ${what}` : 'Drawing'] });
      continue;
    }
    if (/^big\b/.test(lead)) {
      parts.push({ t: 'big', texts: qs.map((q) => q.text) });
      continue;
    }
    if (!qs.length && /^pause\b/i.test(c)) {
      pause = true;
      continue;
    }
    if (qs.some((q) => /^(···\s*)?menu$/i.test(q.text))) {
      menu = true;
      continue;
    }
    if (/^switch\b/.test(lead) && qs[0]) {
      const after = stripParens(c).split(`"${qs[0].text}"`)[1] ?? '';
      const line = qs.find((q) => /\bwith$/.test(q.before))?.text;
      parts.push({ t: 'switch', label: qs[0].text, on: /^\s*\**\s*on\b/i.test(after), ...(line ? { line } : {}) });
      continue;
    }
    if (/^"[^"]+"\s*(\([^)]*\))?\s*:/.test(c) && / · /.test(c) && /\bradio\b/i.test(st) && qs[0]) {
      const options = optionsOf(c.slice(c.indexOf(':', c.indexOf(qs[0].text) + qs[0].text.length) + 1));
      const picked = (/chosen one\s*\(([^)]*)\)/i.exec(st)?.[1] ?? '').split(/\s*,\s*/).filter(Boolean);
      const chosen = Math.max(0, options.findIndex((o) => picked.some((p) => low(o.text).startsWith(low(p)))));
      // A line that names two of the options is the group's ("30 s for small kids, 90 s for grandparents").
      let groupLine: string | undefined;
      for (const o of options) {
        if (o.line && options.filter((x) => o.line?.includes(x.text)).length >= 2) {
          groupLine = o.line;
          delete o.line;
        }
      }
      parts.push({ t: 'radio', title: qs[0].text, options, chosen, ...(groupLine ? { line: groupLine } : {}) });
      continue;
    }
    if (/\bheading\b/.test(lead) && qs[0]) {
      parts.push({ t: 'h1', text: qs[0].text });
      continue;
    }
    if (/(^|\s)main$/.test(lead) && qs[0]) {
      mainLabel ??= qs[0].text;
      continue;
    }
    if (/\binput\b/.test(lead) && qs[0]) {
      const add = qs.find((q) => /^\+/.test(q.before))?.text;
      parts.push({ t: 'input', placeholder: qs[0].text, ...(add ? { add } : {}) });
      continue;
    }
    if (/(^|\s)quiet$/.test(lead)) {
      for (const q of qs) parts.push({ t: 'button', label: q.text, sub: [] });
      continue;
    }
    if (/^the word\b/.test(lead) && bigWord && !parts.some((p) => p.t === 'word')) {
      parts.push({ t: 'word' });
      continue;
    }
    if (/\bthe\s+[a-z]+-[a-z]+\b/.test(c) && !qs.length) {
      const term = /\bthe\s+([a-z]+-[a-z]+)\b/.exec(c)?.[1] as string;
      if (script.terms[term] && !arrive?.lines.length) parts.push({ t: 'p', text: script.terms[term] as string, small: true });
      continue;
    }
    const list = qs.length ? qs.map((q) => q.text) : /\b(name|label|title)\s*$/.test(lead) ? parenQuotes(c) : [];
    for (const q of list) {
      if (screen.kind === 'screen' && rowFor(q) !== undefined && !/^\d/.test(q)) parts.push({ t: 'button', label: q, sub: [] });
      else parts.push({ t: 'p', text: q, small: /\bsmall\b/.test(lead) });
    }
  }

  // The heading: a "heading" clause, else the first line when the words start with it, else the screen's title.
  if (!parts.some((p) => p.t === 'h1')) {
    const first = parts[0];
    const firstClause = clauses(words)[0] ?? '';
    const sole = leadOf(firstClause) === '' && quotesOf(firstClause).filter((q) => !q.alt).length === 1;
    if (first?.t === 'p' && sole) parts[0] = { t: 'h1', text: first.text };
    else {
      const title = [...screen.title.matchAll(/"([^"]+)"/g)][0]?.[1] ?? stripParens(screen.title).trim();
      parts.unshift({ t: 'h1', text: title });
    }
  }
  const headAt = parts.findIndex((p) => p.t === 'h1');
  const arriveLines = [...(arrive?.heading ? [arrive.heading] : []), ...(arrive?.lines ?? [])];
  if (arriveLines.length) parts.splice(headAt + 1, 0, ...arriveLines.map((text): Part => ({ t: 'p', text })));

  // Dialogs: their buttons are the table's buttons.
  if (screen.kind !== 'screen') {
    for (const r of rows) {
      const l = clean(r.label);
      if (/^from\b/i.test(l) || /^[✕×]$/.test(l) || parts.some((p) => p.t === 'button' && p.label === l)) continue;
      if (kMain && low(l) === low(kMain)) continue;
      parts.push({ t: 'button', label: l, sub: [], to: r.to });
    }
  }
  if (!mainLabel && !absent) {
    const done = parts.find((p) => p.t === 'button' && /^done$/i.test(p.label)) as Extract<Part, { t: 'button' }> | undefined;
    if (done) {
      mainLabel = done.label;
      parts.splice(parts.indexOf(done), 1);
    } else if (rows.some((r) => /^done$/i.test(clean(r.label)))) mainLabel = 'Done';
  }
  if (absent) mainLabel = undefined;

  // ——— Word chips (count in the heading follows the first list) ———
  const chipPart = parts.find((p) => p.t === 'chips') as Extract<Part, { t: 'chips' }> | undefined;
  const startCount = chipPart?.lists[0]?.words.length ?? 0;
  const allChips = chips ?? chipPart?.lists.flatMap((l, li) => l.words.map((word) => ({ word, list: li, moved: false }))) ?? [];
  const nowCount = allChips.filter((c) => c.list === 0).length;
  function counted(s: string) {
    return chipPart && startCount !== nowCount ? s.replace(new RegExp(`\\b${startCount}\\b`), String(nowCount)) : s;
  }

  // ——— Timers: the guard, a countdown, a word's guard ———
  const guardMs = mainLabel ? guardFor(script.guards, mainLabel) : 0;
  useEffect(() => {
    shownAt.current = Date.now();
    const onResize = () => setPortrait(innerHeight >= innerWidth);
    addEventListener('resize', onResize);
    if (arrive?.toast) {
      const undo = arrive.undo;
      showToast(arrive.toast, /· Undo$/.test(arrive.toast) ? () => (undo ? nav.back() : undefined) : undefined);
    }
    return () => {
      removeEventListener('resize', onResize);
    };
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const after = /\bafter\s+(\d+)\s*s\b[^→]*?(?:→|->)\s*([A-Z]\d+[a-z]?)/i.exec(st);
  const anywhere = /\btap anywhere\b/i.test(st);
  const big = parts.find((p) => p.t === 'big') as Extract<Part, { t: 'big' }> | undefined;
  useEffect(() => {
    if (!after && !big) return;
    const i = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [after, big]);
  useEffect(() => {
    if (after && tick >= Number(after[1]) && known.has(after[2] as string)) nav.go(after[2] as string, { lines: [], from: '' }, subject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  const guarded = () => Date.now() - shownAt.current < (script.guards.ms || 0);

  const tapMain = () => {
    if (!mainLabel) return;
    if (firstTime) {
      const key = `${screen.id}:main`;
      const first = !seen.includes(key);
      nav.mark(key);
      return nav.go((first ? firstTime[1] : firstTime[2]) as string, { lines: [], from: mainLabel }, subject);
    }
    const to = targetFor(mainLabel);
    follow(mainLabel, to ? counted(to) : to);
  };

  // ——— The big word and its tap halves ———
  const bottom = /bottom half[^"]*"([^"]+)"/i.exec(st)?.[1];
  const top = /top half[^"]*"([^"]+)"/i.exec(st)?.[1];
  const halves = !!(bottom && top);
  const endAfter = /\bafter the\s+(\w+),\s*([A-Z]\d+[a-z]?)/i.exec(st);
  const flashOf = (half: string) => {
    const r = rows.find((x) => new RegExp(`\\b${half} half\\b`, 'i').test(x.label));
    const m = r && /\b(\w+)\s+flash\s+"([^"]+)"/.exec(r.to);
    return m ? { colour: m[1] as string, text: m[2] as string } : null;
  };
  const tapHalf = (half: 'top' | 'bottom') => {
    if (Date.now() - lastHalf.current < (script.guards.ms || 0)) return;
    lastHalf.current = Date.now();
    const f = flashOf(half);
    if (f) {
      setFlash(f);
      setTimeout(() => setFlash(null), 600);
    }
    const n = endAfter ? ordinal(endAfter[1] as string) : sequence.length;
    if (wordAt + 1 >= n && endAfter && known.has(endAfter[2] as string)) return nav.go(endAfter[2] as string, { lines: [], from: half }, subject);
    setWordAt((w) => w + 1);
  };
  const sideways = /\bsideways\b/i.test(st);

  // ——— Drawing ———
  const button = (p: Extract<Part, { t: 'button' }>, key: number) => (
    <QuietButton
      key={key}
      {...(p.sub.length ? { className: 'proto-rowbutton' } : {})}
      onClick={() => follow(p.label, p.to ?? targetFor(p.label), p.sub.join(' '))}
    >
      <span>{show(p.label)}</span>
      {p.sub.map((s) => (
        <span key={s} className="proto-sub">
          {show(s)}
        </span>
      ))}
    </QuietButton>
  );
  const nameRow = rows.find((r) => /tap a name/i.test(r.label));
  const pickName = !!(nameRow && arrive?.from && low(nameRow.label).includes(low(clean(arrive.from))));
  const handleRow = rows.find((r) => /drag handle/i.test(r.label)) ?? map.screens.flatMap((s) => s.rows).find((r) => /drag handle/i.test(r.label));
  const handleName = (n: string) => clean(/"([^"]+)"/.exec(handleRow?.label ?? '')?.[1] ?? 'Move').replace(new RegExp(`\\b${esc(players[0] ?? '')}\\b`), n);
  const crossTo = rows.find((r) => /^[✕×]$/.test(clean(r.label)))?.to;
  const removeName = (n: string) => {
    const id = crossTo ? firstId(crossTo, known) : undefined;
    if (id) return nav.go(id, { lines: [], from: '✕' });
    const before = names;
    setNames((all) => all.filter((x) => x !== n));
    const t = crossTo && /\btoast\s+"([^"]+)"/.exec(crossTo)?.[1];
    if (t) showToast(clean(t).replace(new RegExp(`\\b(${players.map(esc).join('|')})\\b`), n), () => setNames(before));
  };

  const draw = (p: Part, i: number): ReactNode => {
    switch (p.t) {
      case 'h1':
        return screen.kind === 'screen' ? (
          <h1 key={i} className="pgn-title">
            {counted(show(p.text))}
          </h1>
        ) : null;
      case 'p': {
        const t = show(p.text);
        const n = /^\d+ (players?)$/.exec(t);
        return (
          <p key={i} className={p.small ? 'proto-small' : undefined}>
            {n && parts.some((x) => x.t === 'names') ? `${names.length} ${names.length === 1 ? n[1]?.replace(/s$/, '') : n[1]?.replace(/([^s])$/, '$1s')}` : t}
          </p>
        );
      }
      case 'button':
        return button(p, i);
      case 'main':
        return mainLabel ? (
          <GuardedMain key={i} inline ms={guardMs} onClick={tapMain}>
            {show(mainLabel)}
          </GuardedMain>
        ) : null;
      case 'input':
        return (
          <div key={i} className="proto-addrow">
            <label className="proto-input">
              <input type="text" placeholder={show(p.placeholder)} aria-label={show(p.placeholder)} value={typed} onChange={(e) => setTyped(e.target.value)} />
            </label>
            {p.add && (
              <QuietButton
                onClick={() => {
                  const n = typed.trim();
                  if (n) setNames((all) => [...all, n]);
                  setTyped('');
                }}
              >
                {show(p.add)}
              </QuietButton>
            )}
          </div>
        );
      case 'switch': {
        const on = switches[p.label] ?? p.on;
        return (
          <div key={i} className="proto-switchrow">
            <label className="proto-switch">
              <input type="checkbox" role="switch" checked={on} onChange={() => setSwitches((s) => ({ ...s, [p.label]: !on }))} /> {show(p.label)}
            </label>
            {p.line && <span className="proto-sub">{show(p.line)}</span>}
          </div>
        );
      }
      case 'radio': {
        const sel = radio[p.title] ?? p.chosen;
        return (
          <fieldset key={i} className="proto-radios">
            <legend>{show(p.title)}</legend>
            {p.line && <p className="proto-small">{show(p.line)}</p>}
            {p.options.map((o, oi) => (
              <OptionButton key={o.text} selected={sel === oi} onClick={() => setRadio((r) => ({ ...r, [p.title]: oi }))}>
                <span className="proto-radio-text">
                  {show(o.text)}
                  {o.line && <span className="proto-sub">{show(o.line)}</span>}
                </span>
              </OptionButton>
            ))}
          </fieldset>
        );
      }
      case 'names':
        return (
          <ul key={i} className="proto-namelist">
            {names.map((n) => (
              <li key={n}>
                {pickName ? (
                  <QuietButton onClick={() => nav.go(firstId(nameRow?.to ?? '', known) ?? screen.id, { lines: [], from: n }, n)}>{n}</QuietButton>
                ) : (
                  <span className="proto-name">{n}</span>
                )}
                <QuietButton
                  className="proto-handle"
                  label={handleName(n)}
                  onClick={() =>
                    setNames((all) => {
                      const k = all.indexOf(n);
                      if (k <= 0) return all;
                      const next = [...all];
                      next.splice(k - 1, 2, n, all[k - 1] as string);
                      return next;
                    })
                  }
                >
                  ≡
                </QuietButton>
                <QuietButton className="proto-x" label={`Remove ${n}`} onClick={() => removeName(n)}>
                  ✕
                </QuietButton>
              </li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol key={i} className="proto-ol">
            {p.lines.map((l) => (
              <li key={l}>{show(l)}</li>
            ))}
          </ol>
        );
      case 'boxes':
        return (
          <div key={i} className="proto-boxes">
            {p.labels.map((l) => (
              <div key={l} className="proto-box" role="img" aria-label={show(l)}>
                {show(l)}
              </div>
            ))}
          </div>
        );
      case 'scores':
        return (
          <ol key={i} className="proto-scores">
            {p.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
        );
      case 'chips':
        return (
          <div key={i} className="proto-chiplists">
            {p.lists.map((l, li) => (
              <section key={l.name} className={`proto-chiplist proto-chips-${low(l.colour) || 'plain'}`}>
                <h2>{show(l.name)}</h2>
                <div className="proto-chips">
                  {allChips
                    .filter((c) => c.list === li)
                    .map((c) => (
                      <button
                        key={c.word}
                        type="button"
                        className="proto-chip"
                        onClick={() =>
                          setChips(allChips.map((x) => (x.word === c.word ? { ...x, list: (x.list + 1) % p.lists.length, moved: !x.moved } : x)))
                        }
                      >
                        {c.word}
                        {c.moved ? ' ↺' : ''}
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        );
      case 'big': {
        const at = Math.min(tick, p.texts.length - 1);
        return (
          <p key={i} className="proto-countdown" aria-live="polite">
            {p.texts[at]}
          </p>
        );
      }
      case 'word': {
        const w = sequence[wordAt] ?? bigWord ?? '';
        return (
          <p key={i} className="proto-bigword">
            {w.toUpperCase()}
          </p>
        );
      }
    }
  };

  const pauseTo = rowFor('Pause');
  const topBar = (pause || menu) && (
    <div className="proto-top">
      <div />
      <div className="proto-top-right">
        {pause && (
          <QuietButton className="proto-iconbutton proto-pause" label="Pause" onClick={() => follow('Pause', pauseTo)}>
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
              <rect x="3.5" y="3" width="3" height="10" rx="1" fill="currentColor" />
              <rect x="9.5" y="3" width="3" height="10" rx="1" fill="currentColor" />
            </svg>
            <span>Pause</span>
          </QuietButton>
        )}
        {menu && <QuietButton onClick={() => setMenuOpen(true)}>··· Menu</QuietButton>}
      </div>
    </div>
  );
  const menuTarget = (item: string): string | undefined => {
    const k = low(clean(item));
    const byTitle = [...map.screens].sort((a, b) => Number(a.kind === 'screen') - Number(b.kind === 'screen')).find((s) => low(stripParens(s.title)).trim() === k);
    if (byTitle) return byTitle.id;
    for (const s of map.screens)
      for (const r of s.rows) {
        const pieces = clean(r.label).split(/\s+\/\s+/).map((x) => low(x.replace(/^←\s*/, '')));
        if (pieces.includes(k)) return r.to;
      }
    return undefined;
  };
  const menuSheet = menuOpen && (
    <Sheet title="Menu" onDone={() => setMenuOpen(false)}>
      {script.menu.map((item) => (
        <QuietButton key={item} onClick={() => follow(item, menuTarget(item))}>
          {item}
        </QuietButton>
      ))}
    </Sheet>
  );

  if (screen.kind !== 'screen') {
    const head = parts.find((p) => p.t === 'h1') as { text: string } | undefined;
    return (
      <BlocksRoot className="proto">
        {under ?? (
          <Screen>
            <ScreenContent>{null}</ScreenContent>
          </Screen>
        )}
        <Dialog text={show(head?.text ?? stripParens(screen.title))}>
          <div className="proto-dialog-body">{parts.map((p, i) => (p.t === 'h1' ? null : draw(p, i)))}</div>
          {mainLabel && (
            <GuardedMain inline ms={guardMs} onClick={tapMain}>
              {show(mainLabel)}
            </GuardedMain>
          )}
        </Dialog>
        <Toast toast={toast} onDone={clearToast} />
      </BlocksRoot>
    );
  }

  if (halves) {
    const turned = sideways && portrait;
    return (
      <BlocksRoot className="proto">
        <div className={`proto-halves${turned ? ' proto-turned' : ''}`}>
          <button type="button" className="proto-half proto-half-top" onClick={() => tapHalf('top')} aria-label={show(top as string)}>
            <span className="proto-half-label">{show(top as string)}</span>
          </button>
          <button type="button" className="proto-half proto-half-bottom" onClick={() => tapHalf('bottom')} aria-label={show(bottom as string)}>
            <span className="proto-half-label">{show(bottom as string)}</span>
          </button>
          <div className="proto-halves-words">{parts.map((p, i) => (p.t === 'h1' ? null : draw(p, i)))}</div>
          {topBar && <div className="proto-halves-top">{topBar}</div>}
          {flash && (
            <div className={`proto-flash proto-flash-${low(flash.colour)}`} aria-live="polite">
              {flash.text}
            </div>
          )}
        </div>
      </BlocksRoot>
    );
  }

  const inlineMain = parts.some((p) => p.t === 'main');
  return (
    <BlocksRoot className="proto">
      <HideMainButton.Provider value={menuOpen || hideMain}>
        <Screen page>
          <ScreenContent hidden={menuOpen}>
            <div
              className="proto-state"
              {...(anywhere ? { onClick: () => !guarded() && after && nav.go(after[2] as string, { lines: [], from: '' }, subject) } : {})}
            >
              {topBar}
              {parts.map(draw)}
            </div>
          </ScreenContent>
          {mainLabel && !inlineMain && (
            <GuardedMain ms={guardMs} onClick={tapMain}>
              {show(mainLabel)}
            </GuardedMain>
          )}
          <Toast toast={toast} onDone={clearToast} />
        </Screen>
      </HideMainButton.Provider>
      {menuSheet}
    </BlocksRoot>
  );
}
