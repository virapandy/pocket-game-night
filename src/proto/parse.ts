// Reads a game's screen map (docs/games/<game>/screen-map.md; docs/proposals/design-before-code.md, stage 2) into
// screens, dialogs and the taps between them, for the tap-through prototype. Generic: it knows the map's format, never a
// game. Format read:
//   ## <section>                        a group of screens (e.g. the host phone, the map phone)
//   ### <ID>. <title>                   a screen; "Dialog …" or "Sheet …" in the title draws it as one
//   *Words:* … "quoted words" …         the words on screen; `main "X"` names the main button
//   Menu: A · B · C.  / Menu: as P1 + … the "··· Menu" items
//   | Tap | Leads to | … |               one row per button: where it leads (an ID like P3, "back", or same screen)
//   | # | Dialog | Words | Buttons → where | … |   one dialog per row, buttons "Label → target · …"
// Anything it cannot place (a missing or unknown target, a menu item no row explains) becomes a problem for the index.

export type Go =
  | { kind: 'go'; ids: string[]; missing: string[] }
  | { kind: 'back' }
  | { kind: 'stay' }
  | { kind: 'none' };

export interface Tap {
  /** What the button says. */
  label: string;
  /** The map's row as written (label and target), for the prototype's notes. */
  full: string;
  to: string;
  main: boolean;
  go: Go;
  /** A "(…)" note in the map's menu line, kept for the script renderer (e.g. "2/3" or "two or three phones"). */
  cond?: string;
}

/** One row of a screen's table as the map writes it. */
export interface RawRow {
  label: string;
  to: string;
  ids: string;
}

export interface ProtoScreen {
  id: string;
  title: string;
  kind: 'screen' | 'dialog' | 'sheet';
  section: string;
  /** Quoted words on the screen, in the map's order, without the buttons' own words. */
  words: string[];
  notes: string;
  taps: Tap[];
  menu: Tap[];
  /** Every row as written (the script renderer reads these). */
  rows: RawRow[];
  /** The *Words* part of the screen's notes, without its "Menu:" sentence. */
  wordsText: string;
}

export interface Problem {
  label: string;
  what: string;
  screens: string[];
}

export interface ProtoMap {
  title: string;
  screens: ProtoScreen[];
  problems: Problem[];
  /** Screens (not dialogs) where the map names no main button. */
  noMain: string[];
}

interface Row {
  label: string;
  to: string;
  ids?: string;
}

interface Raw {
  id: string;
  title: string;
  kind: ProtoScreen['kind'];
  section: string;
  notes: string;
  rows: Row[];
  /** Dialog-table rows: words given in their own cell. */
  extraWords: string[];
}

const ID_RE = /\b([A-Z]\d+[a-z]?)\b/g;
const QUOTED_RE = /["“]([^"”]+)["”]/g;
const MENU_PREFIX = /^(menu\s*(→|->)|other menu items|menu items)\s*/i;

const tidy = (s: string) => s.replace(/\*+/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();
const noParens = (s: string) => {
  let out = s;
  for (let prev = ''; prev !== out; ) {
    prev = out;
    out = out.replace(/\s*\([^()]*\)/g, '');
  }
  return out.trim();
};
const unquote = (s: string) => s.replace(/["“”]/g, '');
/** A comparable name: no brackets, quotes or menu prefix; "A ↔ B" and "A/B" alike; lower case. */
export const keyOf = (s: string) =>
  noParens(unquote(tidy(s)).replace(MENU_PREFIX, ''))
    .replace(/\s*(↔|\/)\s*/g, '/')
    .replace(/^(only)\s+/i, '')
    .replace(/[.:]+$/, '')
    .toLowerCase()
    .trim();

/** The label a button shows: no "(…)" notes, no "Menu →". */
const showLabel = (s: string) => noParens(unquote(tidy(s)).replace(MENU_PREFIX, '')) || tidy(s);

/** Splits on `sep` outside quotes and brackets. */
function splitOutside(s: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string;
    if (c === '"' || c === '“' || c === '”') quoted = c === '"' ? !quoted : c === '“';
    else if (!quoted && c === '(') depth++;
    else if (!quoted && c === ')') depth = Math.max(0, depth - 1);
    if (!quoted && depth === 0 && s.startsWith(sep, i)) {
      parts.push(cur);
      cur = '';
      i += sep.length - 1;
      continue;
    }
    cur += c;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const cells = (line: string) => {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split('|').map((c) => c.trim());
};

/** The screen IDs a "Leads to" names, outside quotes; IDs in brackets count only when none stand outside them. */
function idsIn(to: string): string[] {
  const text = to.replace(QUOTED_RE, ' ');
  const outside = [...noParens(text).matchAll(ID_RE)].map((m) => m[1] as string);
  return [...new Set(outside.length ? outside : [...text.matchAll(ID_RE)].map((m) => m[1] as string))];
}

const BACK_RE = /^(back\b|close\b)|\bthe step\b|\bopened from\b|\bcame from\b|\bback here\b/i;

function goOf(to: string, known: Set<string>): Go {
  const t = tidy(to);
  if (!t || /^[—–-]+$/.test(t)) return { kind: 'none' };
  const ids = idsIn(t);
  if (ids.length) return { kind: 'go', ids: ids.filter((i) => known.has(i)), missing: ids.filter((i) => !known.has(i)) };
  if (BACK_RE.test(t)) return { kind: 'back' };
  return { kind: 'stay' };
}

export function parseScreenMap(text: string): ProtoMap {
  const lines = text.replace(/```[\s\S]*?```/g, '').split('\n');
  const title = tidy(lines.find((l) => l.startsWith('# '))?.slice(2) ?? 'Screen map');
  const raws: Raw[] = [];
  let section = '';
  let cur: Raw | null = null;
  let header: string[] | null = null;
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      section = tidy(line.slice(3));
      cur = null;
      inTable = false;
      continue;
    }
    if (line.startsWith('### ')) {
      inTable = false;
      const m = /^###\s+([A-Z]\d+[a-z]?)\.\s+(.*)$/.exec(line.trim());
      cur = m ? { id: m[1] as string, title: tidy(m[2] as string), kind: 'screen', section, notes: '', rows: [], extraWords: [] } : null;
      if (cur) {
        if (/^(dialog)\b/i.test(cur.title)) cur.kind = 'dialog';
        else if (/^(sheet)\b/i.test(cur.title)) cur.kind = 'sheet';
        raws.push(cur);
      }
      continue;
    }
    if (line.trim().startsWith('|')) {
      const c = cells(line);
      if (!inTable) {
        header = c;
        inTable = true;
        continue;
      }
      if (c.every((x) => /^:?-+:?$/.test(x))) continue;
      if (!header) continue;
      const leads = header.findIndex((h) => /leads to/i.test(h));
      const buttons = header.findIndex((h) => /^buttons/i.test(h));
      const idsCol = header.findIndex((h) => /^ids$/i.test(h));
      if (leads >= 0 && cur) {
        cur.rows.push({ label: c[0] ?? '', to: c[leads] ?? '', ids: idsCol >= 0 ? (c[idsCol] ?? '') : '' });
      } else if (buttons >= 0) {
        const id = tidy(c[0] ?? '');
        if (!/^[A-Z]\d+[a-z]?$/.test(id)) continue;
        const dTitle = tidy(c[1] ?? id);
        const wordsCell = header.findIndex((h) => /^words/i.test(h));
        const rows: Row[] = [];
        for (const seg of splitOutside(c[buttons] ?? '', ' · ')) {
          const arrow = seg.search(/\s(→|->)\s/);
          if (arrow < 0) {
            const last = rows[rows.length - 1];
            if (last) last.to += ` · ${seg}`;
            continue;
          }
          rows.push({
            // "quiet "X"" / "main "X"": the label is X (the map's word for the look is never drawn).
            label: seg.slice(0, arrow).replace(/^\s*(?:quiet|main)\s+(?=["“*])/i, ''),
            to: seg.slice(arrow).replace(/^\s*(→|->)\s*/, ''),
            ids: idsCol >= 0 ? (c[idsCol] ?? '') : '',
          });
        }
        raws.push({
          id,
          title: dTitle,
          kind: /\bsheet\b/i.test(dTitle) ? 'sheet' : 'dialog',
          section,
          notes: wordsCell >= 0 ? (c[wordsCell] ?? '') : '',
          rows,
          extraWords: [unquote(noParens(dTitle))],
        });
      }
      continue;
    }
    inTable = false;
    header = null;
    if (cur && line.trim() && cur.rows.length === 0) cur.notes += ` ${line.trim()}`;
  }

  const known = new Set(raws.map((r) => r.id));
  const byId = new Map(raws.map((r) => [r.id, r]));
  const problems = new Map<string, Problem>();
  const problem = (label: string, what: string, screen: string) => {
    const k = `${label}\n${what}`;
    const p = problems.get(k) ?? { label, what, screens: [] };
    if (!p.screens.includes(screen)) p.screens.push(screen);
    problems.set(k, p);
  };

  // Every row of every screen becomes taps; "Menu → A / B" with "X / Y" pairs up.
  const tapsOf = new Map<string, Tap[]>();
  const menuRowsOf = new Map<string, Tap[]>();
  const menuAs = new Map<string, string[]>();
  for (const r of raws) {
    const taps: Tap[] = [];
    const menu: Tap[] = [];
    for (const row of r.rows) {
      const label = tidy(row.label);
      const isMenu = MENU_PREFIX.test(label);
      const to = tidy(row.to);
      const as = /^as\s+([A-Z]\d+[a-z]?(?:\s*\/\s*[A-Z]\d+[a-z]?)*)\s*$/.exec(to);
      if (isMenu && (as || !to)) {
        if (as) menuAs.set(r.id, [...(menuAs.get(r.id) ?? []), ...(as[1] as string).split('/').map((s) => s.trim())]);
        continue;
      }
      const names = isMenu ? noParens(label.replace(MENU_PREFIX, '')).split(/\s+\/\s+/) : [label];
      const targets = noParens(to).split(/\s+\/\s+/);
      if (names.length > 1 && names.length === targets.length) {
        names.forEach((n, i) => {
          const t = targets[i] as string;
          const go = goOf(t, known);
          menu.push({ label: showLabel(n), full: `${n} → ${t}`, to: t, main: false, go: go.kind === 'stay' ? { kind: 'go', ids: [], missing: [t] } : go });
        });
        continue;
      }
      const tap: Tap = { label: showLabel(label), full: `${label} → ${to}`, to, main: /\(main\)/i.test(label), go: goOf(to, known) };
      (isMenu ? menu : taps).push(tap);
    }
    tapsOf.set(r.id, taps);
    menuRowsOf.set(r.id, menu);
  }

  // Any "Menu → X" row anywhere says where X leads; so do plain rows, as a second choice.
  const globalMenu = new Map<string, Tap>();
  const globalRow = new Map<string, Tap>();
  for (const r of raws) {
    for (const t of menuRowsOf.get(r.id) ?? []) if (!globalMenu.has(keyOf(t.label))) globalMenu.set(keyOf(t.label), t);
    for (const t of tapsOf.get(r.id) ?? []) if (!globalRow.has(keyOf(t.label))) globalRow.set(keyOf(t.label), t);
  }

  const menuLine = (r: Raw) => {
    const m = /\bMenu:\s*(.+?)\.(?=\s+[A-Z*]|\s*$)/.exec(tidy(r.notes));
    const inherits = [...tidy(r.notes).matchAll(/\bmenu:?\s+as\s+([A-Z]\d+[a-z]?)/gi)].map((x) => x[1] as string);
    let items: string[] = [];
    if (m) {
      const body = (m[1] as string).replace(/^as\s+[A-Z]\d+[a-z]?\s*\+?\s*/, '');
      items = splitOutside(body, ' · ').map((i) => i.replace(/^only\s+/i, ''));
    }
    return { items, inherits };
  };

  const menus = new Map<string, Tap[]>();
  const menuOf = (id: string, seen: Set<string>): Tap[] => {
    const done = menus.get(id);
    if (done) return done;
    const r = byId.get(id);
    if (!r || seen.has(id)) return [];
    seen.add(id);
    const out: Tap[] = [];
    const add = (t: Tap) => {
      if (!out.some((o) => keyOf(o.label) === keyOf(t.label))) out.push(t);
    };
    const own = [...(menuRowsOf.get(id) ?? []), ...(tapsOf.get(id) ?? [])];
    const { items, inherits } = menuLine(r);
    for (const item of items) {
      const k = keyOf(item);
      const found = own.find((t) => keyOf(t.label) === k) ?? globalMenu.get(k) ?? globalRow.get(k);
      const cond = /^\(([^)]*)\)/.exec(item)?.[1];
      const base: Tap = found ? { ...found, label: showLabel(item), main: false } : { label: showLabel(item), full: item, to: '', main: false, go: { kind: 'none' } };
      add(cond ? { ...base, cond } : base);
    }
    for (const t of menuRowsOf.get(id) ?? []) add(t);
    for (const other of [...inherits, ...(menuAs.get(id) ?? [])]) for (const t of menuOf(other, seen)) add(t);
    menus.set(id, out);
    return out;
  };

  const noMain: string[] = [];
  const screens: ProtoScreen[] = raws.map((r) => {
    const notes = tidy(r.notes);
    const taps = tapsOf.get(r.id) ?? [];
    const menu = menuOf(r.id, new Set());
    // The main button: a row marked "(main)", else the one the words name with `main "X"`.
    const named = [...notes.matchAll(/\bmain\s+((?:["“][^"”]+["”]\s*(?:\/\s*)?)+)/g)].flatMap((m) =>
      [...(m[1] as string).matchAll(QUOTED_RE)].map((q) => keyOf(q[1] as string)),
    );
    let mainIndex = taps.findIndex((t) => t.main);
    if (mainIndex < 0) {
      mainIndex = taps.findIndex((t) => {
        const k = keyOf(t.label);
        return named.some((n) => k === n || (Math.min(k.length, n.length) >= 4 && (k.startsWith(n) || n.startsWith(k))));
      });
    }
    taps.forEach((t, i) => (t.main = i === mainIndex));
    if (mainIndex < 0 && r.kind === 'screen') noMain.push(r.id);

    const labels = new Set([...taps, ...menu].map((t) => keyOf(t.label)).concat(named));
    const wordsPart = notes.replace(/^.*?\*?Words:\*?/i, '').split(/\*?Intentions:\*?/i)[0] ?? '';
    const wordsText = wordsPart.replace(/\bMenu:.*?(\.\s|$)/g, ' ');
    // The heading: the title's first quoted words (a dialog-table title as a whole); dropped when the words repeat it.
    const heading = (r.extraWords[0] ?? [...r.title.matchAll(QUOTED_RE)].map((m) => m[1] as string)[0] ?? '').trim();
    const said = [...new Set([...wordsText.matchAll(QUOTED_RE)].map((m) => (m[1] as string).trim()))];
    const words = [...(heading && !said.some((w) => w.startsWith(heading)) ? [heading] : []), ...said].filter(
      (w, i, all) => w && all.indexOf(w) === i && !labels.has(keyOf(w)),
    );

    for (const t of [...taps, ...menu]) {
      if (t.go.kind === 'none') problem(t.label, 'no target in the map', r.id);
      if (t.go.kind === 'go') for (const m of t.go.missing) problem(t.label, `leads to "${m}", which is not a screen in the map`, r.id);
    }
    const rows = r.rows.map((x) => ({ label: tidy(x.label), to: tidy(x.to), ids: tidy(x.ids ?? '') }));
    return { id: r.id, title: r.title, kind: r.kind, section: r.section, words, notes, taps, menu, rows, wordsText };
  });

  return { title, screens, problems: [...problems.values()], noMain };
}
