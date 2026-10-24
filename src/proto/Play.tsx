// The tap-through prototype with a prototype script (screen map section K): one real phone screen per state. Each screen
// shows one state of its *Words* (rule 1) filled with the example night, its buttons with their real labels (rules 2
// and 6), the example board where the script says (rule 3), and every tap follows the script's outcome or the map's one
// "Leads to" (rule 4); taps that stay change the screen (rule 5). Generic: the game is all in the map and its script.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BlocksRoot, Dialog, HideMainButton, OptionButton, QuietButton, Screen, ScreenContent, Sheet, Toast, useToast } from '../blocks';
import type { ProtoMap, ProtoScreen, RawRow } from './parse';
import { fullText, numberedLines, stripParens, type Cell, type Kind, type Outcome, type Script, type Team } from './script';
import { chosen, holds, isCondition, quotedIn, segmentsOf, tokenize, type Ctx, type Segment } from './words';
import { Index } from './Proto';
import { GuardedMain, StateView, type Arrive } from './State';
import { guardFor } from './states';

interface Visit {
  turned: string[];
  revealed: boolean;
  swapped: boolean;
  arrive: Record<string, Arrive>;
  /** The player a screen was opened for ("T1 for Arjun"), by screen. */
  subject: Record<string, string>;
  /** What has happened this visit ("the first time"). */
  seen: string[];
}

const framed = () => window.parent !== window;
/** Every screen is its own history entry, so the phone's Back goes to the previous screen. */
function navigate(to: string) {
  location.hash = to;
}

type Result = 'moved' | 'stay';

const hashId = () => decodeURIComponent(location.hash.slice(1));
const lower = (s: string) => s.toLowerCase();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ID_RE = /\b([A-Z]\d+[a-z]?)\b/g;
const quotes = (s: string) => [...s.matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);
const norm = (s: string) => lower(stripParens(s).replace(/\s+/g, ' ').trim());
const unknownText = (s: string) => /^…|…$/.test(s.trim());
const mainKey = (s: string) => lower(s.replace(/\b(\d+|N)\b|∞/g, '#'));

function tellBar(text: string) {
  if (window.parent !== window) window.parent.postMessage({ proto: 'note', text }, location.origin);
}

const freshVisit = (script: Script): Visit => ({ turned: [...script.turned], revealed: false, swapped: false, arrive: {}, subject: {}, seen: [] });

/** The phones a screen is for: its title or section says ("two or three phones"), else the example night. */
function phonesOf(screen: ProtoScreen, script: Script): number {
  const m = /\b(one|two|three)(?:\s+or\s+(?:two|three))?\s+phones?\b/i.exec(`${screen.title} ${screen.section}`);
  return m ? ({ one: 1, two: 2, three: 3 } as Record<string, number>)[lower(m[1] as string)] ?? script.phones : script.phones;
}

// ——— Rows: the screen's buttons, with their real labels ———

type RowType = 'button' | 'board' | 'keys' | 'people' | 'options' | 'input' | 'icon';

interface Row {
  raw: RawRow;
  label: string;
  /** "A ↔ B": B. */
  other?: string;
  cond?: string;
  type: RowType;
  /** Matched by a descriptor in the words ("unfinished row "…" + "…""): its first quoted words and the rest. */
  desc?: string;
  sub: string[];
  /** Part of an "A / B" row: kept only if the words name it (or, failing all, the first that holds). */
  part?: boolean;
  back: boolean;
  placeholder?: string;
  /** Extra keys ("/ ∞"). */
  keys?: string[];
}

const EVENT = /silence|app hidden|reload|any other way|\b\d+\s*h\b|^resume before\b|^close\b/i;

function parenCond(label: string): string | undefined {
  for (const m of label.matchAll(/\(([^()"]*)\)/g)) if (isCondition(m[1])) return (m[1] as string).trim();
  return undefined;
}

function descriptor(label: string, words: string): string[] | null {
  const d = esc(lower(label));
  const re = new RegExp(`(?:^|[\\s;·:,(])${d}\\s+"([^"]+)"((?:\\s*\\+\\s*"[^"]+")*)`, 'i');
  let m = re.exec(words);
  const parts = label.trim().split(/\s+/);
  if (!m && parts.length >= 3) {
    const stem = esc(lower(parts[0] as string).slice(0, 4));
    m = new RegExp(`(?:^|[\\s;·:,(])${stem}\\w*\\s+"([^"]+)"((?:\\s*\\+\\s*"[^"]+")*)`, 'i').exec(words);
  }
  if (!m) {
    // "A game row": the quoted words starting with that noun ("Game 2 · …").
    const noun = /^(?:a|an)\s+(\w+)\s+row$/i.exec(label.trim())?.[1];
    if (noun) {
      const q = quotes(words).find((x) => new RegExp(`^${esc(noun)}\\b`, 'i').test(x));
      if (q) return [q];
    }
    return null;
  }
  return [m[1] as string, ...quotes(m[2] ?? '')];
}

function rowsOf(screen: ProtoScreen, words: string): Row[] {
  const { all, toggled, variantOnly } = quotedIn(words);
  const heads = new Map<string, number>();
  for (const r of screen.rows) {
    const h = lower(r.label.split(',')[0] ?? '').trim();
    heads.set(h, (heads.get(h) ?? 0) + 1);
  }
  const out: Row[] = [];
  const seen = new Set<string>();
  const push = (r: Row) => {
    const k = `${r.type}:${lower(r.label)}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(r);
  };
  for (const raw of screen.rows) {
    let label = raw.label.trim();
    if (/^↳/.test(label) || /^(menu\s*(→|->)|menu items|other menu items)/i.test(label) || /\(toast\b/i.test(label) || /^from\s/i.test(label)) continue;
    const cond = parenCond(label);
    label = label.split(' · ').map((s) => s.trim()).filter((s) => !EVENT.test(stripParens(s).trim()))[0] ?? '';
    if (!label) continue;
    const head = (label.split(',')[0] ?? '').trim();
    if (label.includes(',') && (heads.get(lower(head)) ?? 0) > 1) label = head;
    const base = { raw, sub: [] as string[], back: false, ...(cond ? { cond } : {}) };
    const plain = stripParens(label).trim();
    if (/^(a|an|one)\s/i.test(plain)) {
      if (/number key/i.test(plain)) {
        push({ ...base, label: plain, type: 'keys', keys: plain.split(/\s*\/\s*/).slice(1) });
        continue;
      }
      if (/\bword\b/i.test(plain)) {
        push({ ...base, label: plain, type: 'board' });
        continue;
      }
      if (/\b(name|player|guesser)s?\b/i.test(plain)) {
        push({ ...base, label: plain, type: 'people' });
        continue;
      }
      if (/\b(option|card)\b/i.test(plain)) {
        push({ ...base, label: plain, type: 'options' });
        continue;
      }
    }
    if (/^type\s/i.test(plain)) {
      const ph = /\binput\s+"([^"]+)"/i.exec(words)?.[1] ?? plain.replace(/^type\s+(a\s+)?/i, '');
      push({ ...base, label: plain, type: 'input', placeholder: ph });
      continue;
    }
    if (/\s\/\s*Enter$/i.test(plain)) {
      push({ ...base, label: plain.replace(/\s*\/\s*Enter$/i, ''), type: 'input', placeholder: plain.replace(/\s*\/\s*Enter$/i, '') });
      continue;
    }
    if (/\bicon$/i.test(plain)) {
      push({ ...base, label: plain.replace(/\s*icon$/i, ''), type: 'icon' });
      continue;
    }
    const toggle = plain.split(/\s+↔\s+/);
    if (toggle.length > 1) {
      push({ ...base, label: toggle[0] as string, other: toggle[1] as string, type: 'button', back: /^←/.test(plain) });
      continue;
    }
    const parts = label.split(/\s+\/\s+/);
    for (const p of parts) {
      let l = stripParens(p).trim();
      if (variantOnly.has(lower(l))) continue;
      const pc = parenCond(p) ?? cond;
      const r: Row = { ...base, label: l, type: 'button', back: /^←/.test(l), ...(parts.length > 1 ? { part: true } : {}) };
      if (pc) r.cond = pc;
      if (/\scard$/i.test(l) && all.has(lower(l.replace(/\s+card$/i, '')))) l = r.label = l.replace(/\s+card$/i, '');
      if (!all.has(lower(l))) {
        const d = descriptor(l, words);
        if (d) {
          r.desc = d[0] as string;
          r.label = d[0] as string;
          r.sub = d.slice(1);
        }
      }
      if (r.part && !r.desc && !(all.has(lower(r.label)) && !toggled.has(lower(r.label)))) r.part = true;
      else if (r.part) delete r.part;
      push(r);
    }
  }
  return out;
}

// ——— Colours and icons (by the kind's name, or the team's colour) ———

const PALETTE: Record<string, string> = {
  orange: '#c75000',
  teal: '#00796b',
  red: '#b3261e',
  blue: '#1e5bb3',
  green: '#2e7d32',
  purple: '#6a1b9a',
  yellow: '#a87b00',
  pink: '#ad1457',
};
const NEUTRAL = /nobody|blank|neutral|bystander/i;
const colourOf = (k: Kind | undefined) => (!k ? '#888' : PALETTE[lower(k.name)] ?? (NEUTRAL.test(k.name) ? '#e6dccb' : '#2b2b2b'));
const lightKind = (k: Kind | undefined) => !!k && NEUTRAL.test(k.name);

function Icon({ kind }: { kind: Kind | undefined }) {
  if (!kind) return null;
  const c = 'currentColor';
  let shape: ReactNode;
  if (kind.team === 0) shape = <circle cx="8" cy="8" r="6" fill={c} />;
  else if (kind.team === 1) shape = <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" fill={c} />;
  else if (NEUTRAL.test(kind.name)) shape = <rect x="3" y="7" width="10" height="2.4" rx="1" fill={c} />;
  else
    shape = (
      <g fill={c}>
        <circle cx="8" cy="9" r="4.5" />
        <rect x="7.2" y="1.5" width="1.6" height="4" />
        <rect x="11" y="3" width="1.6" height="3.4" transform="rotate(45 11.8 4.7)" />
        <rect x="3.4" y="3" width="1.6" height="3.4" transform="rotate(-45 4.2 4.7)" />
      </g>
    );
  return (
    <svg className="proto-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      {shape}
    </svg>
  );
}

// ——— The board (rule 3; SWD-090/091 layout: 8 px margins, 4 px gaps, one font size that fits every word) ———

type BoardMode = 'board' | 'map' | 'whole';

function Board({
  script,
  mode,
  turned,
  faded,
  picked,
  onCell,
  onFade,
  rotated,
}: {
  script: Script;
  mode: BoardMode;
  turned: string[];
  faded: string[];
  picked: string | null;
  onCell?: (c: Cell) => void;
  /** Taps fade and unfade (the map phone's found marks): the board's turned words are not known here. */
  onFade?: boolean;
  rotated: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [font, setFont] = useState<{ size: number; own: Record<string, number> }>({ size: 18, own: {} });
  const cols = Math.max(...script.board.map((r) => r.length));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const cell = el.querySelector<HTMLElement>('.proto-cell');
      if (!cell) return;
      const width = cell.clientWidth - 8;
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return;
      const family = getComputedStyle(cell).fontFamily;
      const w = (word: string, px: number) => {
        ctx.font = `600 ${px}px ${family}`;
        return ctx.measureText(word).width;
      };
      const words = script.board.flat().map((c) => c.word);
      let size = 12;
      for (let px = 22; px >= 12; px--) {
        if (words.every((x) => w(x, px) <= width)) {
          size = px;
          break;
        }
      }
      const own: Record<string, number> = {};
      for (const x of words) {
        let px = size;
        while (px > 10 && w(x, px) > width) px -= 0.5;
        if (px !== size) own[x] = px;
      }
      setFont((f) => (f.size === size && JSON.stringify(f.own) === JSON.stringify(own) ? f : { size, own }));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [script]);
  const kindOf = (c: Cell) => script.kinds.find((k) => k.letter === c.kind);
  return (
    <div
      ref={ref}
      className={`proto-board${rotated ? ' proto-rotated' : ''}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, fontSize: `${font.size}px` }}
      role="grid"
      aria-label="Board"
    >
      {script.board.flat().map((c) => {
        const k = kindOf(c);
        const isTurned = turned.includes(c.word);
        const coloured = mode === 'map' || isTurned || mode === 'whole';
        const fade = (mode === 'map' && (faded.includes(c.word) || (!onFade && turned.includes(c.word)))) || (mode === 'whole' && !isTurned);
        const style: Record<string, string> = {};
        if (coloured) {
          const col = colourOf(k);
          style['--cell'] = col;
        }
        const own = font.own[c.word];
        if (own) style.fontSize = `${own}px`;
        const cls = [
          'proto-cell',
          coloured && 'proto-cell-coloured',
          coloured && lightKind(k) && 'proto-cell-light',
          fade && 'proto-cell-faded',
          picked === c.word && 'proto-cell-picked',
        ]
          .filter(Boolean)
          .join(' ');
        const name = coloured && k ? `${c.word}, ${k.team >= 0 ? `${k.name} team` : lower(k.name)}` : `${c.word}, face down`;
        const inner = (
          <>
            {coloured && <Icon kind={k} />}
            {picked === c.word && (
              <span className="proto-cell-tick" aria-hidden="true">
                ✓
              </span>
            )}
            <span className="proto-cell-word">{c.word}</span>
          </>
        );
        const tappable = onCell && !(mode === 'board' && isTurned);
        return tappable ? (
          <button key={c.word} type="button" className={cls} style={style} aria-label={name} aria-pressed={picked === c.word} onClick={() => onCell(c)}>
            {inner}
          </button>
        ) : (
          <div key={c.word} className={cls} style={style} role="gridcell" aria-label={name}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

// ——— Parts of a screen, in the map's order ———

interface Control {
  label: string;
  onlyGuessers: boolean;
  aria?: string;
}

type Part =
  | { t: 'line'; text: string; cls?: string }
  | { t: 'button'; row: Row; label: string; sub: string[] }
  | { t: 'board' }
  | { t: 'counts'; row?: Row }
  | { t: 'teambar'; winner?: boolean }
  | { t: 'qr' }
  | { t: 'keys'; row: Row }
  | { t: 'players' }
  | { t: 'teams'; controls: Control[]; nameAction?: string; colourLines: boolean }
  | { t: 'people'; who: 'guessers' | 'eligible' }
  | { t: 'numbered'; lines: string[] }
  | { t: 'full' }
  | { t: 'result' }
  | { t: 'listline'; text: string }
  | { t: 'input'; placeholder: string; label?: string }
  | { t: 'options'; title: string; options: { text: string; extra?: string }[] };

interface Built {
  parts: Part[];
  mainTexts: string[];
  badge?: string;
  switchLabel?: string;
}

function build(screen: ProtoScreen, words: string, rows: Row[], ctx: Ctx, script: Script, only: string[] | null, onlyAll: string[]): Built {
  const parts: Part[] = [];
  const mainTexts: string[] = [];
  let badge: string | undefined;
  let switchLabel: string | undefined;
  const once = new Set<string>();
  const add = (p: Part) => {
    if (p.t !== 'line' && p.t !== 'button' && p.t !== 'listline' && p.t !== 'input' && p.t !== 'options') {
      if (once.has(p.t)) return;
      once.add(p.t);
    }
    parts.push(p);
  };
  const hasRow = (t: RowType) => rows.find((r) => r.type === t);
  const teamNames = script.teams.map((t) => lower(t.name));
  const isTeamItem = (s: string) => teamNames.some((n) => new RegExp(`^${esc(n)}(\\s*\\(\\d+\\))?$`, 'i').test(s.trim()));
  const boardHere = script.boardScreens.includes(screen.id);
  const players = new Set(script.players.map((p) => p.toUpperCase()));
  const rowByText = (text: string) =>
    rows.find((r) => r.type === 'button' && (lower(r.label) === lower(text) || (r.desc !== undefined && r.desc === text)));

  for (const segText of segmentsOf(words)) {
    const seg: Segment = tokenize(segText);
    const un = lower(stripParens(seg.unquoted));
    const items = chosen(seg, ctx);
    const trailOk = !seg.items.length || items.length > 0 || !seg.items.every((i) => i.cond);

    if (only && seg.items.some((i) => onlyAll.includes(i.text))) {
      only.forEach((text) => add({ t: 'line', text }));
      continue;
    }
    if (/team bar/.test(un) && !/\bno team bar\b/.test(un)) add({ t: 'teambar', ...(/\bwinner\b/.test(un) ? { winner: true } : {}) });
    if (/numbered lines/.test(un)) {
      const id = rows.flatMap((r) => [...r.raw.ids.matchAll(/\b([A-Z]+-\d+)\b/g)].map((m) => m[1] as string))[0];
      if (id) add({ t: 'numbered', lines: id && scenariosDoc ? numberedLines(scenariosDoc, id) : [] });
    }
    // Team groups: "per team", or the two team names as quoted words.
    if (/\bper team\b/.test(un) || seg.items.filter((i) => isTeamItem(i.text)).length >= 2) {
      const controls: Control[] = seg.items
        .filter((i) => !isTeamItem(i.text))
        .filter(() => /\bper team\b/.test(un))
        .map((i) => ({ label: i.text, onlyGuessers: /guessers?/i.test(i.cond ?? ''), ...(i.cond && !/guessers?/i.test(i.cond) ? { aria: i.cond } : {}) }));
      const nameAction = /\bname\s*\((\w+)\)/i.exec(seg.unquoted)?.[1];
      const colourLines = seg.items.some((i) => /\bteam$/i.test(i.text) && !isTeamItem(i.text));
      add({ t: 'teams', controls, ...(nameAction ? { nameAction } : {}), colourLines });
      continue;
    }
    if (hasRow('options') && seg.items[0] && !seg.items[0].alt && (seg.items.slice(1).some((i) => i.alt) || /\s\/\s/.test(seg.trail))) {
      const first = seg.items[0];
      let options: { text: string; extra?: string }[];
      if (seg.items.length > 1) options = seg.items.slice(1).map((i) => ({ text: i.text, ...(i.extra ? { extra: i.extra } : {}) }));
      else {
        const trail = seg.trail;
        const cond = /\(([^)]*)\)/.exec(trail)?.[1];
        if (cond && !holds(cond, ctx)) continue;
        options = stripParens(trail)
          .split(/\s*\/\s*/)
          .map((t) => ({ text: t.trim() }))
          .filter((o) => o.text);
      }
      if (holds(first.cond, ctx)) parts.push({ t: 'options', title: first.text, options });
      continue;
    }
    if (/\bkeys\b/.test(un)) {
      const k = hasRow('keys');
      if (k) {
        add({ t: 'keys', row: k });
        continue;
      }
    }
    if (/names filled in|tonight's names/.test(un)) add({ t: 'players' });
    if (/one button per (guesser|player|eligible)/.test(un) && !once.has('teams')) {
      add({ t: 'people', who: /guesser/.test(un) ? 'guessers' : 'eligible' });
    }
    if (boardHere && /\b(the board|whole map|map grid|map area|cells locked|every cell locked)\b/.test(un)) add({ t: 'board' });
    if (/\bcounts\b/.test(un)) {
      const row = rows.find((r) => r.type === 'button' && r.label.length <= 3 && seg.unquoted.includes(r.label));
      add({ t: 'counts', ...(row ? { row } : {}) });
    }
    if (/\bqr\b/.test(un)) add({ t: 'qr' });
    if (/the result line/.test(un)) add({ t: 'result' });
    if (trailOk) {
      for (const m of seg.unquoted.matchAll(/\bthe\s+([a-z]+-[a-z]+)\b/g)) {
        const t = script.terms[m[1] as string];
        if (t && (!seg.trail.includes(m[0]) || items.length > 0 || !seg.items.length)) add({ t: 'line', text: t, cls: 'proto-small' });
      }
    }
    for (const m of seg.unquoted.matchAll(/\b([A-Z]{2,})\b/g)) {
      if (players.has(m[1] as string)) add({ t: 'line', text: m[1] as string, cls: 'proto-big' });
    }

    let lastButton: Extract<Part, { t: 'button' }> | null = null;
    for (const it of items) {
      const pre = lower(it.pre);
      if (/\bbadge\b/.test(pre)) {
        badge = it.text;
        continue;
      }
      if (/\bswitch\b/.test(pre)) {
        switchLabel = it.text;
        continue;
      }
      if (/\bmain\b/.test(pre)) {
        mainTexts.push(it.text);
        continue;
      }
      if (/\b(alerts?|errors?|toasts?|group)\b/.test(pre)) continue;
      it.text = it.text.replace(/\s*·\s*…$/, '');
      if (unknownText(it.text)) continue;
      if (/\binput\b/.test(pre) || it.placeholder) {
        parts.push({ t: 'input', placeholder: it.placeholder ?? it.text, ...(it.placeholder ? { label: it.text } : {}) });
        continue;
      }
      if (/\blist\b/.test(pre) || (it.plusPrev && parts[parts.length - 1]?.t === 'listline')) {
        parts.push({ t: 'listline', text: it.text });
        continue;
      }
      if (it.withPrev && lastButton) {
        lastButton.sub.push(it.text);
        continue;
      }
      if (it.plusPrev && lastButton && lastButton.row.desc) continue;
      const row = rowByText(it.text);
      if (row) {
        if (row.type === 'button' && !parts.some((p) => p.t === 'button' && p.row === row)) {
          lastButton = { t: 'button', row, label: row.label, sub: [...row.sub] };
          parts.push(lastButton);
        }
        continue;
      }
      if (rows.some((r) => lower(r.label) === lower(it.text) || lower(r.other ?? '') === lower(it.text))) continue;
      const people = hasRow('people');
      if (people && script.players.some((p) => it.text.startsWith(`${p} `) || it.text === p)) {
        parts.push({ t: 'button', row: people, label: it.text, sub: [] });
        continue;
      }
      const prev = parts[parts.length - 1];
      if (prev?.t === 'button' && /\bcard\b/i.test(prev.row.raw.label) && prev.sub.length === 0) {
        prev.sub.push(it.text);
        continue;
      }
      lastButton = null;
      parts.push({ t: 'line', text: it.text, ...(players.has(it.text) ? { cls: 'proto-big' } : {}) });
    }
  }
  if (only && !parts.some((p) => p.t === 'line' && only.includes(p.text))) only.forEach((text) => parts.unshift({ t: 'line', text }));
  if (script.lists.includes(screen.id) && !once.has('teams')) add({ t: 'teams', controls: [], colourLines: false });
  if (boardHere && !once.has('board')) {
    const i = parts.findIndex((p) => p.t === 'line');
    parts.splice(i + 1, 0, { t: 'board' });
  }
  return { parts, mainTexts, ...(badge ? { badge } : {}), ...(switchLabel ? { switchLabel } : {}) };
}

let scenariosDoc = '';

/** Draws the parts; on board screens, buttons next to each other share a row (the action slot). */
function groupButtons(parts: Part[], group: boolean, draw: (p: Part, i: number) => ReactNode, from = 0, to = parts.length): ReactNode[] {
  const out: ReactNode[] = [];
  let run: ReactNode[] = [];
  const flush = (k: number) => {
    if (run.length > 1)
      out.push(
        <div key={`g${k}`} className="proto-actions">
          {run}
        </div>,
      );
    else out.push(...run);
    run = [];
  };
  parts.forEach((p, i) => {
    if (i < from || i >= to || p.t === 'teambar') return;
    const n = draw(p, i);
    if (group && p.t === 'button') {
      if (n) run.push(n);
      return;
    }
    flush(i);
    out.push(n);
  });
  flush(parts.length);
  return out;
}

// ——— The swap: the other team's turn (names, colours, clue givers, players by position) ———

function swapper(script: Script, on: boolean): (s: string) => string {
  if (!on || script.teams.length < 2) return (s) => s;
  const [a, b] = script.teams as [Team, Team];
  const pairs: [string, string][] = [[a.name, b.name]];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  pairs.push([a.colour, b.colour], [cap(a.colour), cap(b.colour)]);
  a.members.forEach((m, i) => {
    const o = b.members[i];
    if (o) pairs.push([m, o], [m.toUpperCase(), o.toUpperCase()]);
  });
  const map = new Map<string, string>();
  for (const [x, y] of pairs) {
    map.set(x, y);
    map.set(y, x);
  }
  const re = new RegExp(`\\b(${[...map.keys()].sort((x, y) => y.length - x.length).map(esc).join('|')})\\b`, 'g');
  return (s) => s.replace(re, (m) => map.get(m) ?? m);
}

// ——— The page ———

export function Play({ map, script, scenarios }: { map: ProtoMap; script: Script; scenarios: string }) {
  scenariosDoc = scenarios;
  const [id, setId] = useState(hashId);
  const [nav, setNav] = useState(0);
  const visited = useRef<string[]>([hashId()]);
  const [visit, setVisit] = useState<Visit>(() => freshVisit(script));

  useEffect(() => {
    const report = () => {
      if (window.parent !== window) window.parent.postMessage({ proto: 'at', id: hashId() }, location.origin);
    };
    report();
    const onHash = () => {
      const next = hashId();
      const v = visited.current;
      if (v[v.length - 2] === next) v.pop();
      else v.push(next);
      setId(next);
      setNav((n) => n + 1);
      window.scrollTo(0, 0);
      report();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // A screen the script shows sideways ("sideways frame (812 × 375 by default for this screen)") asks the frame for that size.
  useEffect(() => {
    if (!framed()) return;
    const m = /\bsideways frame\s*\((\d+)\s*×\s*(\d+)/.exec(script.states[id]?.text ?? '');
    window.parent.postMessage({ proto: 'size', size: m ? `${m[1]} × ${m[2]}` : '' }, location.origin);
  }, [id, script]);

  const byId = new Map(map.screens.map((s) => [s.id, s]));
  const screen = byId.get(id);
  if (!screen) return <Index map={map} id={id} />;

  const go = (to: string, arrive: Arrive, reset: boolean, swap: boolean, subject?: string) => {
    setVisit((v) => {
      const base = reset ? { ...freshVisit(script), arrive: v.arrive, subject: v.subject, seen: v.seen } : v;
      const subjects = { ...base.subject };
      if (subject) subjects[to] = subject;
      else delete subjects[to];
      return { ...base, swapped: swap ? !base.swapped : base.swapped, arrive: { ...base.arrive, [to]: arrive }, subject: subjects };
    });
    if (to === id) setNav((n) => n + 1);
    else navigate(to);
  };
  const back = () => {
    if (visited.current.length > 1) return history.back();
    // Opened straight on this screen: "back" goes to the screen the map opens it from, never the index.
    const from = map.screens.find((s) => s.id !== id && s.rows.some((r) => new RegExp(`\\b${id}\\b`).test(r.to.replace(/"[^"]*"/g, ' '))));
    navigate(from ? from.id : '');
  };
  const state = script.states[screen.id];
  if (state) {
    const underId = visited.current.length > 1 ? visited.current[visited.current.length - 2] : undefined;
    const underScreen = underId ? byId.get(underId) : undefined;
    const under =
      screen.kind !== 'screen' && underScreen && underScreen.kind === 'screen' && underScreen.id !== screen.id ? (
        <div inert>
          <HideMainButton.Provider value>{drawStill(map, underScreen, script, visit, scenarios)}</HideMainButton.Provider>
        </div>
      ) : undefined;
    return (
      <StateView
        key={`${id}:${nav}`}
        map={map}
        screen={screen}
        script={script}
        state={state}
        arrive={visit.arrive[screen.id]}
        subject={visit.subject[screen.id]}
        seen={visit.seen}
        scenarios={scenarios}
        under={under}
        nav={{
          go: (to, arrive, subject) => go(to, arrive, false, false, subject),
          back,
          mark: (key) => setVisit((v) => (v.seen.includes(key) ? v : { ...v, seen: [...v.seen, key] })),
        }}
      />
    );
  }

  return (
    <View
      key={`${id}:${nav}`}
      map={map}
      screen={screen}
      script={script}
      visit={visit}
      under={visited.current.length > 1 ? byId.get(visited.current[visited.current.length - 2] as string) : undefined}
      onOutcome={(o, label, word) => {
        const lines = [...o.lines, ...o.terms.map((t) => script.terms[t] ?? '').filter(Boolean)];
        const arrive: Arrive = { lines, from: label, ...(o.heading ? { heading: o.heading } : {}), ...(o.toast ? { toast: o.toast } : {}) };
        setVisit((v) => ({
          ...v,
          turned: word && !v.turned.includes(word) ? [...v.turned, word] : v.turned,
          revealed: v.revealed || !!word,
          ...(o.to ? {} : { arrive: { ...v.arrive, [screen.id]: arrive } }),
        }));
        if (o.to) {
          go(o.to, arrive, false, !!o.forName);
          return 'moved';
        }
        return 'stay';
      }}
      onReveal={(word) => setVisit((v) => ({ ...v, turned: v.turned.includes(word) ? v.turned : [...v.turned, word], revealed: true }))}
      onGo={(to, label, toText) => {
        const withLines = quotes(toText.replace(/\b(toast|main)\s+"[^"]+"/g, '')).filter((q) => new RegExp(`with\\s+"${esc(q)}"`).test(toText));
        const toast = /\btoast\s+"([^"]+)"/.exec(toText)?.[1];
        go(to, { lines: withLines, from: label, ...(toast ? { toast } : {}) }, /\bdeal\b/.test(toText), false);
      }}
      onBack={back}
    />
  );
}

/** A screen drawn still, under a dialog. */
function drawStill(map: ProtoMap, screen: ProtoScreen, script: Script, visit: Visit, scenarios: string): ReactNode {
  const state = script.states[screen.id];
  if (state)
    return (
      <StateView
        map={map}
        screen={screen}
        script={script}
        state={state}
        arrive={visit.arrive[screen.id]}
        subject={visit.subject[screen.id]}
        seen={visit.seen}
        scenarios={scenarios}
        nav={{ go: () => undefined, back: () => undefined, mark: () => undefined }}
      />
    );
  return (
    <View
      map={map}
      screen={screen}
      script={script}
      visit={visit}
      under={undefined}
      onOutcome={() => 'stay'}
      onReveal={() => undefined}
      onGo={() => undefined}
      onBack={() => undefined}
    />
  );
}

function View({
  map,
  screen,
  script,
  visit,
  under,
  onOutcome,
  onReveal,
  onGo,
  onBack,
}: {
  map: ProtoMap;
  screen: ProtoScreen;
  script: Script;
  visit: Visit;
  under: ProtoScreen | undefined;
  onOutcome: (o: Outcome, label: string, word?: string) => Result;
  onReveal: (word: string) => void;
  onGo: (to: string, label: string, toText: string) => void;
  onBack: () => void;
}) {
  const arrive = visit.arrive[screen.id];
  const [shown, setShown] = useState(false);
  const [everShown, setEverShown] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [appeared, setAppeared] = useState<Set<string>>(new Set());
  const [rotated, setRotated] = useState(false);
  const [list, setList] = useState<string | null>(null);
  const [faded, setFaded] = useState<string[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [teams, setTeams] = useState<Team[]>(script.teams);
  const [cleared, setCleared] = useState(false);
  const [givers, setGivers] = useState<string[]>(script.clueGivers);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, showToast, clearToast] = useToast();
  const swap = swapper(script, visit.swapped);
  // Never the map's "quiet" before a label, nor its quote marks.
  const sub = (s: string) => swap(s).replace(/\bquiet\s+(?=["“])/gi, '').replace(/["“”]/g, '');
  const [portrait, setPortrait] = useState(() => innerHeight >= innerWidth);
  useEffect(() => {
    const r = () => setPortrait(innerHeight >= innerWidth);
    addEventListener('resize', r);
    return () => removeEventListener('resize', r);
  }, []);
  useEffect(() => {
    if (arrive?.toast) showToast(arrive.toast, () => undefined);
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = visit.swapped ? 1 : 0;
  const team = teams[current];
  const ctx: Ctx = {
    phones: phonesOf(screen, script),
    turn: script.turn,
    players: script.players.length,
    guessers: Math.max(0, (team?.members.length ?? 1) - 1),
    facts: script.facts,
    boardWords: script.board.flat().map((c) => c.word),
    shown,
    everShown,
    revealed: visit.revealed,
    portrait,
    tall: innerHeight >= 800,
  };

  // "*Words:* as S7 …": that screen's words.
  const asId = /^\s*as\s+([A-Z]\d+[a-z]?)\b/.exec(screen.wordsText)?.[1];
  const words = (asId && map.screens.find((x) => x.id === asId)?.wordsText) || screen.wordsText;
  const rows = rowsOf(screen, words);
  const onlyRules = script.only.filter((o) => o.screen === screen.id);
  const onlyAll = onlyRules.flatMap((o) => o.lines);
  let only: string[] | null = null;
  let extras = arrive?.lines ?? [];
  if (onlyRules.length) {
    if (arrive?.heading) {
      only = [arrive.heading, ...extras];
      extras = [];
    } else {
      only = (onlyRules.find((o) => o.from && arrive?.from && lower(o.from) === lower(arrive.from)) ?? onlyRules.find((o) => !o.from))?.lines ?? null;
    }
  } else if (arrive?.heading) extras = [arrive.heading, ...extras];
  const built = build(screen, words, rows, ctx, script, only, onlyAll);
  const full = script.fullText[screen.id];

  // The title's heading ("Dialog "Start a new game night?"", a dialog table's title).
  const titleQuote = quotes(stripParens(screen.title))[0];
  const heading = titleQuote ?? (screen.kind !== 'screen' ? stripParens(screen.title).trim() : undefined);
  let parts = built.parts;
  const firstLine = parts.find((p) => p.t === 'line') as { text: string } | undefined;
  if (heading && (!firstLine || !firstLine.text.startsWith(heading))) parts = [{ t: 'line', text: heading }, ...parts];
  const firstReal = parts.find((p) => p.t !== 'teambar');
  const asked = stripParens(screen.title).trim();
  if (screen.kind === 'screen' && firstReal && firstReal.t !== 'line' && /\?$/.test(asked)) parts = [{ t: 'line', text: asked }, ...parts];
  if (full) parts = [parts.find((p) => p.t === 'line') ?? { t: 'line', text: heading ?? screen.title }, { t: 'full' }];
  // Arrival lines: the result slot, else after the board, else under the heading.
  if (extras.length) {
    const lines: Part[] = extras.map((text) => ({ t: 'line', text, cls: 'proto-result' }));
    let at = parts.findIndex((p) => p.t === 'result');
    if (at < 0) at = parts.findIndex((p) => p.t === 'board');
    if (at < 0) at = parts.findIndex((p) => p.t === 'line');
    parts = [...parts.slice(0, at + 1), ...lines, ...parts.slice(at + 1)];
  }

  // Which rows show now (rule 1 and the screen's state).
  const until = /until shown/i.test(words);
  const setter = (r: Row) => {
    const t = lower((r.raw.to.split(';')[0] ?? '').trim());
    if (/\bshown\b/.test(t) && !/removed|hidden/.test(t)) return 'show';
    if (/\bremoved\b|\bhide\b/.test(t) && !/↔/.test(t)) return 'hide';
    return null;
  };
  const appearsBy = new Map<string, Row>();
  for (const r of rows) for (const m of r.raw.to.matchAll(/\bmain\s+"([^"]+)"/g)) appearsBy.set(mainKey(m[1] as string), r);
  const fromWords = (r: Row) => {
    for (const s of segmentsOf(words)) for (const it of tokenize(s).items) if (lower(it.text) === lower(r.label) && it.cond) return it.cond;
    return undefined;
  };
  const visible = (r: Row) => {
    if (!holds(r.cond, ctx, r.label)) return false;
    const wc = fromWords(r);
    if (wc && isCondition(wc) && !holds(wc, ctx, r.label)) return false;
    if (until) {
      const s = setter(r);
      if (s === 'show' && shown) return false;
      if (s === 'hide' && !shown) return false;
    }
    return true;
  };
  const partsOk = (r: Row, all: Row[]) => {
    if (!r.part) return true;
    const siblings = all.filter((x) => x.raw === r.raw);
    if (siblings.some((x) => !x.part && visible(x))) return false;
    return siblings.find((x) => visible(x)) === r;
  };
  const shownRows = rows.filter((r) => visible(r) && partsOk(r, rows));

  // The main button.
  const mainTexts = built.mainTexts;
  let mainRow = shownRows.find((r) => /\(main\)/i.test(r.raw.label));
  if (!mainRow && mainTexts.length)
    mainRow = shownRows.find((r) =>
      mainTexts.some((m) => {
        const a = lower(r.label);
        const b = lower(m);
        return a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));
      }),
    );
  if (!mainRow) mainRow = shownRows.find((r) => appearsBy.has(mainKey(r.label)));
  // No main named: the first plain button that leads on to another screen (or "Done"); else a screen's only button.
  if (!mainRow && screen.kind === 'screen' && !/\bno main\b/i.test(screen.notes)) {
    const quietWords = new Set<string>();
    const withSub = new Set<string>();
    for (const s of segmentsOf(words)) {
      const its = tokenize(s).items;
      its.forEach((it, i) => {
        if (/\bquiet\b/i.test(it.pre)) quietWords.add(lower(it.text));
        if (its[i + 1]?.withPrev) withSub.add(lower(it.text));
      });
    }
    const kinds = new Map(map.screens.map((x) => [x.id, x.kind]));
    mainRow = shownRows.find((r) => {
      if (r.type !== 'button' || r.desc || r.other || r.back || r.sub.length) return false;
      if (/\bback\b|\(quiet\b|\bcard\b/i.test(r.raw.label) || quietWords.has(lower(r.label)) || withSub.has(lower(r.label))) return false;
      const first = stripParens((r.raw.to.split(';')[0] ?? '').replace(/"[^"]*"/g, ' '));
      const target = [...first.matchAll(ID_RE)].map((m) => m[1] as string).find((i) => kinds.has(i));
      if (target) return kinds.get(target) === 'screen';
      return /^done\b/i.test(r.label);
    });
    if (!mainRow && shownRows.length === 1 && shownRows[0]?.type === 'button') mainRow = shownRows[0];
  }
  let mainLabel = mainRow ? (mainTexts[0] && mainRow.type === 'button' && !appearsBy.has(mainKey(mainRow.label)) ? mainTexts[0] : mainRow.label) : '';
  let mainDisabled = false;
  let mainHidden = false;
  const pickTemplate = mainRow && mainTexts[0] && new RegExp(`^${esc(mainTexts[0])}\\s+[A-Z]+$`).test(mainRow.label);
  if (pickTemplate && mainTexts[0]) {
    mainLabel = picked ? `${mainTexts[0]} ${picked.toUpperCase()}` : mainTexts[0];
    mainDisabled = !picked;
  }
  if (mainRow && appearsBy.has(mainKey(mainRow.label))) {
    const by = appearsBy.get(mainKey(mainRow.label)) as Row;
    if (by.type === 'keys') {
      mainHidden = key === null;
      mainLabel = mainRow.label.replace(/\b(N|\d+)\b/, key ?? 'N');
    } else mainHidden = !appeared.has(lower(mainRow.label));
  }
  if (mainRow?.other && flipped.has(mainRow.label)) mainLabel = mainRow.other;

  // The visible tap guard: the main button is greyed until its guard ends, and a double tap counts once.
  const guardMs = mainRow ? guardFor(script.guards, mainLabel) : 0;

  // ——— Taps ———
  const say = (text: string) => showToast(sub(text), /· Undo$/.test(text) ? () => undefined : undefined);
  const outcomeFor = (label: string, to: string, word?: string): Outcome | undefined => {
    const lab = lower(label.replace(/"/g, ''));
    const tapOk = (o: Outcome) => (!o.screen || o.screen === screen.id) && (lab === o.tap || new RegExp(`(^|\\W)${esc(o.tap)}(\\W|$)`).test(lab));
    const cands = script.outcomes.filter(tapOk);
    if (word) {
      const kindOf = (w: string) => script.board.flat().find((c) => lower(c.word) === lower(w))?.kind;
      const kindName = lower(script.kinds.find((k) => k.letter === kindOf(word))?.name ?? '');
      return (
        cands.find((o) => o.word && lower(o.word) === lower(word)) ??
        cands.find((o) => o.kind === kindName) ??
        cands.find((o) => o.word && kindOf(o.word) === kindOf(word))
      );
    }
    const direct = cands.find((o) => !o.word && !o.kind);
    if (direct) return direct;
    const n = norm(to);
    if (!n || /\b[A-Z]\d+[a-z]?\b/.test(stripParens(to))) return undefined;
    for (const o of script.outcomes) {
      if (o.word || o.kind) continue;
      const same = map.screens.some((s) =>
        s.rows.some((r) => (!o.screen || o.screen === s.id) && new RegExp(`(^|\\W)${esc(o.tap)}(\\W|$)`).test(lower(r.label)) && norm(r.to) === n),
      );
      if (same) return o;
    }
    return undefined;
  };

  const resolve = (to: string): { kind: 'go'; id: string } | { kind: 'back' } | { kind: 'stay' } | { kind: 'none' } => {
    const t = to.trim();
    if (!t || /^[—–-]+$/.test(t)) return { kind: 'none' };
    const first = (t.split(/;(?=(?:[^"]*"[^"]*")*[^"]*$)/)[0] ?? '').trim();
    const BACK = /^(back\b|close\b)|\bthe step\b|\bopened from\b|\bcame from\b|\bback here\b|\bthe same step\b/i;
    if (BACK.test(first)) return { kind: 'back' };
    const known = new Set(map.screens.map((s) => s.id));
    for (const seg of first.split(/\s*→\s*/)) {
      const outside = seg.replace(/"[^"]*"/g, ' ');
      const alts = outside.split(/\s+(?:\/|or)\s+(?![^(]*\))/);
      let firstId: string | undefined;
      for (const alt of alts) {
        const ids = [...stripParens(alt).matchAll(ID_RE)].map((m) => m[1] as string).filter((i) => known.has(i));
        if (!ids.length) continue;
        firstId ??= ids[0];
        const cond = /\(([^()]*)\)/.exec(alt)?.[1];
        if (cond && isCondition(cond) && !holds(cond, ctx)) continue;
        return { kind: 'go', id: ids[0] as string };
      }
      if (firstId) return { kind: 'go', id: firstId };
    }
    if (BACK.test(t)) return { kind: 'back' };
    return { kind: 'stay' };
  };

  /** A tap: the script's outcome, else the map's one target, else the screen changes as the map says (rule 5). */
  const tap = (label: string, to: string, opts: { row?: Row; word?: string } = {}) => {
    setMenuOpen(false);
    const o = outcomeFor(label, to, opts.word);
    if (o) {
      if (opts.word) setPicked(null);
      const r = onOutcome(o, label, opts.word);
      if (r === 'moved' || o.lines.length) return;
    }
    if (opts.word && !o) {
      onReveal(opts.word);
      setPicked(null);
    }
    const res = resolve(to);
    if (res.kind === 'go') return onGo(res.id, label, to);
    if (res.kind === 'back') return onBack();
    if (res.kind === 'none') return tellBar(`Not in the map: "${label}" leads nowhere.`);
    stay(label, to, opts.row);
  };

  const stay = (label: string, to: string, row?: Row) => {
    const t = lower(to);
    if (row && until) {
      const s = setter(row);
      if (s === 'show') {
        setShown(true);
        setEverShown(true);
      }
      if (s === 'hide') setShown(false);
    }
    for (const m of to.matchAll(/\bmain\s+"([^"]+)"/g)) setAppeared((a) => new Set(a).add(lower(m[1] as string)));
    if (row?.other) setFlipped((f) => {
      const n = new Set(f);
      if (n.has(row.label)) n.delete(row.label);
      else n.add(row.label);
      return n;
    });
    if (/list\s*↔\s*grid/.test(t) && row) {
      const lab = lower(flipped.has(row.label) && row.other ? row.other : label);
      const kind = script.kinds.find((k) => lab.includes(lower(k.name)));
      if (/whole/.test(lab)) setList(null);
      else setList(kind ? kind.letter : 'own');
    }
    if (/grid turned/.test(t)) setRotated((r) => !r);
    if (/\bempty\b/.test(t)) setCleared(true);
    const toastText = /\btoast\s+"([^"]+)"/.exec(to)?.[1];
    if (toastText && !(row?.type === 'people')) say(toastText);
  };

  // ——— Drawing ———
  const placed = new Set(parts.flatMap((p) => (p.t === 'button' || (p.t === 'counts' && p.row) ? [p.row as Row] : [])));
  const special = new Set<RowType>(['board', 'keys', 'people', 'options', 'input']);
  const label = (r: Row) => sub(r.other && flipped.has(r.label) ? r.other : r.label);
  const quiet = (r: Row, text?: string, subLines: string[] = []) => (
    <QuietButton key={`${r.raw.label}:${text ?? r.label}`} onClick={() => tap(r.label, r.raw.to, { row: r })} {...(subLines.length ? { className: 'proto-rowbutton' } : {})}>
      <span>{text ? sub(text) : label(r)}</span>
      {subLines.map((s) => (
        <span key={s} className="proto-sub">
          {sub(s)}
        </span>
      ))}
    </QuietButton>
  );
  const kindOfLetter = (l: string) => script.kinds.find((k) => k.letter === l);
  const boardRow = rows.find((r) => r.type === 'board');
  const mode: BoardMode = script.mapScreens.some((p) => lower(screen.title).includes(p) || lower(screen.section).includes(p))
    ? 'map'
    : /whole map/i.test(words)
      ? 'whole'
      : 'board';
  const before = /\bbefore\b/i.test(firstLine?.text ?? '');
  const turned = before ? [] : visit.turned;
  const peopleRow = rows.find((r) => r.type === 'people');
  const isGiver = (n: string) => givers.includes(n);
  const ownKind = script.kinds.find((k) => k.team === current);

  const counts = (
    <p className="proto-counts" aria-label="Words left">
      {script.kinds
        .filter((k) => k.team >= 0)
        .map((k, i) => (
          <span key={k.letter} style={{ color: colourOf(k) }}>
            {i > 0 && <span className="proto-sep"> · </span>}
            <Icon kind={k} />
            <span className="proto-count-text">
              {script.board.flat().filter((c) => c.kind === k.letter && !turned.includes(c.word)).length} left
            </span>
          </span>
        ))}
    </p>
  );

  const draw = (p: Part, i: number): ReactNode => {
    switch (p.t) {
      case 'line': {
        const first = parts.findIndex((x) => x.t === 'line') === i && screen.kind === 'screen';
        if (first) return <h1 key={i} className={`pgn-title ${p.cls ?? ""}`}>{sub(p.text)}</h1>;
        return (
          <p key={i} className={p.cls}>
            {sub(p.text)}
          </p>
        );
      }
      case 'button':
        if (!shownRows.includes(p.row) && p.row.type === 'button') return null;
        if (p.row === mainRow) return null;
        if (p.row.type === 'people') return quiet(p.row, p.label);
        return quiet(p.row, p.label, p.sub);
      case 'teambar': {
        // "team bar of the winner": the team the heading names, none when it names none.
        const head = (parts.find((x) => x.t === 'line') as { text: string } | undefined)?.text ?? '';
        const which = p.winner ? teams.findIndex((t) => head.includes(t.name)) : current;
        if (which < 0) return null;
        return <div key={i} className="proto-teambar" style={{ background: colourOf(script.kinds.find((k) => k.team === which)) }} aria-hidden="true" />;
      }
      case 'board': {
        if (screen.id && until && !shown) return <div key={i} className="proto-maparea" aria-hidden="true" />;
        if (list !== null && mode === 'map') {
          const letter = list === 'own' ? ownKind?.letter : list;
          const fadeHere = boardRow && /\bfade/i.test(boardRow.raw.to);
          const words = script.board.flat().filter((c) => c.kind === letter && (fadeHere || !turned.includes(c.word)));
          return (
            <ul key={i} className="proto-list">
              {parts.filter((x) => x.t === 'listline').map((x, j) => (
                <li key={`l${j}`} className="proto-small">
                  {sub((x as { text: string }).text)}
                </li>
              ))}
              {words.map((c) => (
                <li key={c.word} className={faded.includes(c.word) ? 'proto-found' : undefined}>
                  <span style={{ color: colourOf(kindOfLetter(c.kind)) }}>
                    <Icon kind={kindOfLetter(c.kind)} />
                  </span>{' '}
                  {c.word}
                </li>
              ))}
            </ul>
          );
        }
        const pick = boardRow && /\bpick/i.test(boardRow.raw.to);
        const fade = boardRow && /\bfade/i.test(boardRow.raw.to);
        return (
          <Board
            key={i}
            script={script}
            mode={mode}
            turned={turned}
            faded={faded}
            picked={picked}
            rotated={rotated}
            {...(pick
              ? { onCell: (c: Cell) => setPicked((x) => (x === c.word ? null : c.word)) }
              : fade
                ? { onFade: true, onCell: (c: Cell) => setFaded((f) => (f.includes(c.word) ? f.filter((x) => x !== c.word) : [...f, c.word])) }
                : {})}
          />
        );
      }
      case 'counts':
        return p.row ? (
          <div key={i} className="proto-countsrow">
            {counts}
            {quiet(p.row)}
          </div>
        ) : (
          <div key={i}>{counts}</div>
        );
      case 'qr':
        return (
          <div key={i} className="proto-qr" role="img" aria-label="Map code QR">
            QR
          </div>
        );
      case 'keys': {
        const keys = [...Array.from({ length: 10 }, (_, n) => String(n)), ...(p.row.keys ?? [])];
        return (
          <div key={i} className="proto-keys">
            {keys.map((k) => (
              <OptionButton key={k} selected={key === k} onClick={() => setKey(k)}>
                {k}
              </OptionButton>
            ))}
          </div>
        );
      }
      case 'players':
        return cleared ? null : (
          <ul key={i} className="proto-names">
            {script.players.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        );
      case 'teams':
        return (
          <div key={i} className="proto-teams">
            {teams.map((t, ti) => {
              const k = script.kinds.find((x) => x.team === ti);
              const other = teams[1 - ti]?.name ?? '';
              return (
                <section key={t.name}>
                  <h2 className="proto-team" style={{ color: colourOf(k) }}>
                    <Icon kind={k} /> {sub(t.name)} ({t.members.length})
                  </h2>
                  {p.colourLines && <p className="proto-small">{sub(`${t.colour.charAt(0).toUpperCase()}${t.colour.slice(1)} team`)}</p>}
                  {t.members.map((m) => {
                    const selectMode = peopleRow && /\bselected\b/i.test(peopleRow.raw.to);
                    const badge = built.badge && isGiver(m) ? <span className="proto-badge">{built.badge}</span> : null;
                    const nameButton = peopleRow ? (
                      selectMode ? (
                        <OptionButton
                          selected={isGiver(m)}
                          onClick={() => setGivers((g) => g.map((x) => (t.members.includes(x) ? m : x)))}
                        >
                          {sub(m)}
                        </OptionButton>
                      ) : (
                        <QuietButton
                          label={`Move ${sub(m)} to ${sub(other)}`}
                          onClick={() => {
                            const before = teams;
                            setTeams((all) =>
                              all.map((x, xi) => (xi === ti ? { ...x, members: x.members.filter((y) => y !== m) } : xi === 1 - ti ? { ...x, members: [...x.members, m] } : x)),
                            );
                            const tt = /\btoast\s+"([^"]+)"/.exec(peopleRow.raw.to)?.[1];
                            if (tt) {
                              const text = tt
                                .replace(new RegExp(`\\b(${script.players.map(esc).join('|')})\\b`), m)
                                .replace(new RegExp(`\\b(${script.teams.map((x) => esc(x.name)).join('|')})\\b`), other);
                              showToast(sub(text), () => setTeams(before));
                            }
                          }}
                        >
                          {sub(m)}
                        </QuietButton>
                      )
                    ) : p.nameAction ? (
                      <QuietButton label={`${p.nameAction} ${sub(m)}`} onClick={() => undefined}>
                        {sub(m)}
                      </QuietButton>
                    ) : (
                      <span>{sub(m)}</span>
                    );
                    return (
                      <div key={m} className="proto-member">
                        {nameButton}
                        {badge}
                        {p.controls
                          .filter((c) => !(c.onlyGuessers && isGiver(m)))
                          .map((c) => {
                            const text = c.label.replace(/…/, other);
                            const templates = map.screens.find((s) => s.id === screen.id)?.rows.flatMap((r) => quotes(r.to)) ?? [];
                            return (
                              <QuietButton
                                key={c.label}
                                className={c.label.length <= 2 ? 'proto-x' : 'proto-control'}
                                {...(c.aria ? { label: `${c.aria} ${sub(m)}` } : {})}
                                onClick={() => {
                                  const before = teams;
                                  const moving = /^move/i.test(c.label);
                                  setTeams((all) =>
                                    all.map((x, xi) =>
                                      xi === ti
                                        ? { ...x, members: x.members.filter((y) => y !== m) }
                                        : moving && xi === 1 - ti
                                          ? { ...x, members: [...x.members, m] }
                                          : x,
                                    ),
                                  );
                                  const tt = templates.find((q) => (moving ? /moved/ : /\bleft\b|removed/).test(q));
                                  if (tt)
                                    showToast(
                                      sub(
                                        tt
                                          .replace(new RegExp(`\\b(${script.players.map(esc).join('|')})\\b`), m)
                                          .replace(new RegExp(`\\b(${script.teams.map((x) => esc(x.name)).join('|')})\\b`), other),
                                      ),
                                      () => setTeams(before),
                                    );
                                }}
                              >
                                {sub(text)}
                              </QuietButton>
                            );
                          })}
                        {built.switchLabel && (
                          <label className="proto-switch">
                            <input type="checkbox" role="switch" /> {built.switchLabel}
                          </label>
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
        );
      case 'people': {
        const named = script.teams.find((t) => (heading ?? '').includes(t.name));
        const who = p.who === 'guessers' ? (team?.members ?? []).filter((m) => !isGiver(m)) : (named?.members ?? script.players);
        return (
          <div key={i} className="proto-people">
            {who.map((m) =>
              peopleRow ? (
                quiet(peopleRow, m)
              ) : (
                <OptionButton key={m} selected={choice.people === m} onClick={() => setChoice((c) => ({ ...c, people: m }))}>
                  {sub(m)}
                </OptionButton>
              ),
            )}
          </div>
        );
      }
      case 'numbered':
        return (
          <ol key={i} className="proto-ol">
            {p.lines.map((l) => (
              <li key={l}>{sub(l)}</li>
            ))}
          </ol>
        );
      case 'full': {
        const ids = full ?? [];
        const f = fullText(scenariosDoc, ids);
        return (
          <div key={i} className="proto-full">
            {f.blocks.map((b) => (
              <section key={b.heading}>
                <h2>{sub(b.heading)}</h2>
                <ol className="proto-ol">
                  {b.items.map((l) => (
                    <li key={l}>{sub(l)}</li>
                  ))}
                </ol>
              </section>
            ))}
            {f.small.map((s) => (
              <p key={s} className="proto-small">
                {s}
              </p>
            ))}
          </div>
        );
      }
      case 'result':
      case 'listline':
        return null;
      case 'input':
        return (
          <label key={i} className="proto-input">
            {p.label && <span>{sub(p.label)}</span>}
            <input type="text" placeholder={sub(p.placeholder)} aria-label={sub(p.label ?? p.placeholder)} />
          </label>
        );
      case 'options':
        return (
          <fieldset key={i} className="proto-options">
            <legend>{sub(p.title)}</legend>
            {p.options.map((o) => {
              const sel = choice[p.title] ?? p.options.find((x) => script.facts.includes(lower(x.text.replace(/^\+\s*/, ''))))?.text ?? p.options[0]?.text;
              return (
                <OptionButton key={o.text} selected={sel === o.text} onClick={() => setChoice((c) => ({ ...c, [p.title]: o.text }))}>
                  {sub(o.text)}
                  {o.extra && <span className="proto-sub"> {sub(o.extra)}</span>}
                </OptionButton>
              );
            })}
          </fieldset>
        );
    }
  };

  // Rows the words do not place: after the content (inputs and back first).
  const rest = shownRows.filter((r) => !placed.has(r) && r !== mainRow && !special.has(r.type) && r.type !== 'icon' && !r.back);
  const inputs = shownRows.filter((r) => r.type === 'input');
  const backs = shownRows.filter((r) => r.back && r !== mainRow && !placed.has(r));
  const icons = shownRows.filter((r) => r.type === 'icon');
  const menu = screen.menu.filter((t) => holds(t.cond, ctx));
  const boardScreen = parts.some((p) => p.t === 'board');

  const teambar = parts.findIndex((p) => p.t === 'teambar');
  const boardAt = parts.findIndex((p) => p.t === 'board');
  const top = (backs.length > 0 || icons.length > 0 || menu.length > 0) && screen.kind === 'screen' && (
        <div className="proto-top">
          <div>{backs.map((r) => quiet(r))}</div>
          <div className="proto-top-right">
            {icons.map((r) => (
              <QuietButton key={r.label} label={r.label} onClick={() => tap(r.label, r.raw.to, { row: r })} className="proto-iconbutton">
                <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
                  <rect x="3.5" y="3" width="3" height="10" rx="1" fill="currentColor" />
                  <rect x="9.5" y="3" width="3" height="10" rx="1" fill="currentColor" />
                </svg>
              </QuietButton>
            ))}
            {menu.length > 0 && <QuietButton onClick={() => setMenuOpen(true)}>··· Menu</QuietButton>}
          </div>
        </div>
      );
  const tail = (
    <>
      {inputs.filter((r) => !parts.some((p) => p.t === 'input' && p.placeholder === r.placeholder)).map((r) => (
        <label key={r.label} className="proto-input">
          <input type="text" placeholder={sub(r.placeholder ?? r.label)} aria-label={r.label} />
        </label>
      ))}
      {rest.length > 0 && <div className={boardScreen ? 'proto-actions' : 'proto-buttons'}>{rest.map((r) => quiet(r))}</div>}
      {screen.kind !== 'screen' && backs.map((r) => quiet(r))}
    </>
  );
  const body = (
    <>
      {teambar >= 0 && draw(parts[teambar] as Part, teambar)}
      {boardScreen ? (
        <div className="proto-split">
          {draw(parts[boardAt] as Part, boardAt)}
          <div className="proto-panel">
            <div className="proto-panel-a">
              {top}
              {groupButtons(parts, true, draw, 0, boardAt)}
            </div>
            <div className="proto-panel-b">
              {groupButtons(parts, true, draw, boardAt + 1)}
              {tail}
            </div>
          </div>
        </div>
      ) : (
        <>
          {top}
          {groupButtons(parts, false, draw)}
          {tail}
        </>
      )}
    </>
  );

  const main =
    mainRow && !mainHidden ? (
      <GuardedMain
        ms={guardMs}
        disabled={mainDisabled}
        onClick={() => tap(mainRow.label, mainRow.raw.to, { row: mainRow, ...(pickTemplate && picked ? { word: picked } : {}) })}
      >
        {sub(mainLabel)}
      </GuardedMain>
    ) : null;

  if (screen.kind === 'dialog') {
    const [head, ...more] = parts;
    return (
      <BlocksRoot className="proto">
        {under && under.kind === 'screen' && under.id !== screen.id ? (
          <div inert>
            <HideMainButton.Provider value>{drawStill(map, under, script, visit, scenariosDoc)}</HideMainButton.Provider>
          </div>
        ) : (
          <Screen>
            <ScreenContent>{null}</ScreenContent>
          </Screen>
        )}
        <Dialog text={head && head.t === 'line' ? sub(head.text) : sub(heading ?? screen.title)}>
          <div className="proto-dialog-body">
            {(head && head.t === 'line' ? more : parts).map((p, i) => draw(p, i + 1))}
            {rest.map((r) => quiet(r))}
            {backs.map((r) => quiet(r))}
          </div>
          {mainRow && !mainHidden && (
            <GuardedMain inline ms={guardMs} onClick={() => tap(mainRow.label, mainRow.raw.to, { row: mainRow })}>
              {sub(mainLabel)}
            </GuardedMain>
          )}
        </Dialog>
        <Toast toast={toast} onDone={clearToast} />
      </BlocksRoot>
    );
  }

  if (screen.kind === 'sheet') {
    const done = mainRow ?? shownRows.find((r) => /^done\b/i.test(r.label));
    const [head, ...more] = parts;
    return (
      <BlocksRoot className="proto">
        <Sheet title={head && head.t === 'line' ? sub(head.text) : sub(heading ?? screen.title)} doneLabel={done ? label(done) : 'Done'} onDone={() => (done ? tap(done.label, done.raw.to, { row: done }) : onBack())}>
          {(head && head.t === 'line' ? more : parts).map((p, i) => draw(p, i + 1))}
          {rest.filter((r) => r !== done).map((r) => quiet(r))}
        </Sheet>
        <Toast toast={toast} onDone={clearToast} />
      </BlocksRoot>
    );
  }

  return (
    <BlocksRoot className={`proto${boardScreen ? ' proto-boardscreen' : ''}`}>
      <HideMainButton.Provider value={menuOpen}>
        <Screen page>
          <ScreenContent hidden={menuOpen}>{body}</ScreenContent>
          {main}
          <Toast toast={toast} onDone={clearToast} />
        </Screen>
      </HideMainButton.Provider>
      {menuOpen && (
        <Sheet title="Menu" onDone={() => setMenuOpen(false)}>
          {menu.map((t, i) => {
            const text = sub(t.label.split(/\s*\/\s*(?=[A-Z])/)[0] ?? t.label);
            return (
              <QuietButton key={i} onClick={() => tap(t.label, t.to)}>
                {text}
              </QuietButton>
            );
          })}
        </Sheet>
      )}
    </BlocksRoot>
  );
}
