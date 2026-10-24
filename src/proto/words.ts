// Reads a screen's *Words* (the screen map's prose) into segments of quoted words, with what joins them ("/", "↔",
// "or", "→" are alternatives; "+", "with" join) and the conditions the map writes in brackets ("(when …)", "(one
// phone)", "(from turn 2)"). The script renderer shows one state from it (screen map section K, rule 1). Generic: no game.

export interface Ctx {
  phones: number;
  turn: number;
  players: number;
  /** Players who would be left if one left (the night as it is). */
  left: number;
  guessers: number;
  /** The example night's text, lower case. */
  facts: string;
  boardWords: string[];
  shown: boolean;
  everShown: boolean;
  revealed: boolean;
  portrait: boolean;
  tall: boolean;
}

export interface Item {
  text: string;
  /** Unquoted words just before it, after any joining word ("main", "quiet", "input", "unfinished row"). */
  pre: string;
  cond?: string;
  /** "(+ "Recommended")". */
  extra?: string;
  /** "(placeholder 27P-3QX8)". */
  placeholder?: string;
  /** An alternative to the item before it. */
  alt: boolean;
  /** Joined to the item before by "with" (a sub-line of a button). */
  withPrev: boolean;
  /** Joined to the item before by "+". */
  plusPrev: boolean;
  /** Joined to the item before by "+", "with", "and" or a comma (same chain). */
  joinPrev: boolean;
  /** The other side of an "A ↔ B" toggle. */
  toggle: boolean;
  /** Quoted words of a variant bracket after it ("(older than 6 h: "Open" / "Clear")"): never shown in this state. */
  variants?: string[];
}

export interface Segment {
  items: Item[];
  /** All unquoted words of the segment (for triggers like "counts", "the board"). */
  unquoted: string;
  /** Unquoted words after the last quoted item. */
  trail: string;
  lead: string;
}

const OPEN = '"“';

function matchParen(s: string, i: number): number {
  let depth = 0;
  let quoted = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j] as string;
    if (c === '"' || c === '“' || c === '”') quoted = c === '"' ? !quoted : c === '“';
    else if (!quoted && c === '(') depth++;
    else if (!quoted && c === ')') {
      depth--;
      if (depth === 0) return j;
    }
  }
  return -1;
}

/** Splits the words on ";", " · " and sentence ends, outside quotes and brackets. */
export function segmentsOf(words: string): string[] {
  const out: string[] = [];
  let cur = '';
  let depth = 0;
  let quoted = false;
  for (let i = 0; i < words.length; i++) {
    const c = words[i] as string;
    if (c === '"' || c === '“' || c === '”') quoted = c === '"' ? !quoted : c === '“';
    else if (!quoted && c === '(') depth++;
    else if (!quoted && c === ')') depth = Math.max(0, depth - 1);
    const top = !quoted && depth === 0;
    if (top && c === ';') {
      out.push(cur);
      cur = '';
      continue;
    }
    if (top && words.startsWith(' · ', i)) {
      out.push(cur);
      // "errors "A" · "B"": the next quoted item is one of the same kind.
      const lead = /^\s*((?:errors?|alerts?|toasts?)\b[^"“]*)["“]/i.exec(cur)?.[1];
      cur = lead && /^\s*["“]/.test(words.slice(i + 3)) ? `${lead.trim()} ` : '';
      i += 2;
      continue;
    }
    if (top && c === '.' && /\s/.test(words[i + 1] ?? '') && /[A-Z*"]/.test(words.slice(i + 1).trimStart()[0] ?? '')) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

const quotesIn = (s: string) => [...s.matchAll(/["“]([^"”]+)["”]/g)].map((m) => m[1] as string);

function classify(paren: string): Pick<Item, 'cond' | 'extra' | 'placeholder'> & { variant?: string[] } {
  const p = paren.trim();
  const q = p.search(/["“]/);
  if (q < 0) {
    const ph = /^placeholder\s+(.+)$/i.exec(p);
    return ph ? { placeholder: ph[1] as string } : { cond: p };
  }
  const before = p.slice(0, q).trim();
  if (/^\+/.test(before)) return { extra: quotesIn(p)[0] ?? '' };
  if (before === '' || /:$/.test(before) || /\bW\d/.test(before) || /replaces/i.test(before)) return { variant: quotesIn(p) };
  return { cond: before.replace(/[;,]\s*(then.*)?$/i, '').trim() };
}

const ALT = /^(…\s*)?(\/|↔|→|or\b)/;

export function tokenize(seg: string): Segment {
  const items: Item[] = [];
  let buf = '';
  let unquoted = '';
  let lead = '';
  let i = 0;
  while (i < seg.length) {
    const c = seg[i] as string;
    if (c === '(') {
      // A bracket outside any item: kept in the unquoted words (its quotes are variants).
      const k = matchParen(seg, i);
      if (k > 0) {
        buf += seg.slice(i, k + 1);
        i = k + 1;
        continue;
      }
    }
    if (OPEN.includes(c)) {
      const close = seg.slice(i + 1).search(/["”]/);
      if (close < 0) {
        buf += seg.slice(i);
        break;
      }
      const text = seg.slice(i + 1, i + 1 + close).trim();
      i = i + close + 2;
      let j = i;
      while (seg[j] === ' ') j++;
      let paren: string | undefined;
      if (seg[j] === '(') {
        const k = matchParen(seg, j);
        if (k > 0) {
          paren = seg.slice(j + 1, k);
          i = k + 1;
        }
      }
      const between = buf.replace(/\([^()]*\)/g, ' ').trim();
      unquoted += ` ${buf}`;
      if (items.length === 0) lead = between;
      buf = '';
      const first = items.length === 0;
      const alt = !first && ALT.test(between);
      const withPrev = !first && /^with\b/i.test(between);
      const plusPrev = !first && /^\+/.test(between);
      const joinPrev = !first && !alt && /^(\+|with\b|and\b|,|&)/i.test(between);
      const toggle = alt && /^↔/.test(between);
      const pre = (first ? between : between.replace(/^(…\s*)?(\/|↔|→|or\b|\+|with\b|,|and\b)\s*/i, '')).trim();
      const item: Item = { text, pre, alt, withPrev, plusPrev, joinPrev, toggle };
      if (paren !== undefined) {
        const k = classify(paren);
        if (k.cond) item.cond = k.cond;
        if (k.extra) item.extra = k.extra;
        if (k.placeholder) item.placeholder = k.placeholder;
        if (k.variant) item.variants = k.variant;
      }
      items.push(item);
      continue;
    }
    buf += c;
    i++;
  }
  unquoted += ` ${buf}`;
  const trail = buf.trim();
  // A condition covers the items before it that have none ("A" / "B" and "C" (while shown)).
  for (let k = items.length - 1; k >= 0; k--) {
    const cond = (items[k] as Item).cond;
    if (!cond) continue;
    for (let j = k - 1; j >= 0 && !(items[j] as Item).cond; j--) (items[j] as Item).cond = cond;
  }
  const tm = /\b(after|when|while|until|if)\b|\bdisabled\b|\bsuch\b/i.exec(trail);
  const trailCond = tm ? trail.slice(tm.index) : '';
  if (trailCond) for (const it of items) if (!it.cond) it.cond = trailCond;
  return { items, unquoted: unquoted.trim(), trail, lead };
}

const NUM: Record<string, number> = { one: 1, two: 2, three: 3 };

function phonesIn(c: string): number[] | null {
  if (/\b2\/3\b/.test(c)) return [2, 3];
  const m = /\b(one|two|three)(?:\s+or\s+(two|three))?\s+phones?\b/.exec(c);
  if (m) return [NUM[m[1] as string] as number, ...(m[2] ? [NUM[m[2]] as number] : [])];
  const t = c.trim();
  if (t in NUM) return [NUM[t] as number];
  return null;
}

const FALSE_START = /^(when|while|if|after|until|once|before|at \d+|next day|older than|then|mid-game)\b|\bfirst\b|\bdisabled\b|\bsuch\b/;

/** Whether a condition the map writes holds in the example night and this screen's state. */
export function holds(raw: string | undefined, ctx: Ctx, line = ''): boolean {
  if (!raw) return true;
  const c = raw.toLowerCase().trim();
  if (/until shown/.test(c)) return !ctx.shown;
  if (/while shown/.test(c)) return ctx.shown;
  if (/before the first show/.test(c)) return !ctx.everShown;
  if (/until the first reveal/.test(c)) return !ctx.revealed;
  if (/after the first reveal/.test(c)) return ctx.revealed;
  const phones = phonesIn(c);
  if (phones) return phones.includes(ctx.phones);
  let m: RegExpExecArray | null;
  if ((m = /from turn (\d+)/.exec(c))) return ctx.turn >= Number(m[1]);
  if ((m = /(\d+)\+\s*guessers/.exec(c))) return ctx.guessers >= Number(m[1]);
  if ((m = /^(\d+)\+$/.exec(c))) return ctx.players >= Number(m[1]);
  if ((m = /^(\d+) left$/.exec(c))) return ctx.left === Number(m[1]);
  if (/^(next day|older than)/.test(c)) return false;
  if ((m = /^under (\d+)$/.exec(c))) return ctx.players < Number(m[1]);
  if ((m = /\b(full|easy) only\b/.exec(c))) return ctx.facts.includes(m[1] as string);
  if (/on the board/.test(c)) return ctx.boardWords.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(line));
  if (/portrait|landscape/.test(c)) {
    const tallOk = /tall portrait/.test(c) && ctx.portrait && ctx.tall;
    const landOk = /landscape/.test(c) && !ctx.portrait;
    const portOk = /(^|[^l]\s)portrait/.test(c) && !/tall portrait/.test(c) && ctx.portrait;
    return tallOk || landOk || portOk;
  }
  if (FALSE_START.test(c)) return false;
  return true;
}

/** Whether a "(…)" is a condition at all (and not a note such as "(main)" or "(large)"). */
export const isCondition = (raw: string | undefined) => {
  if (!raw) return false;
  const c = raw.toLowerCase().trim();
  return (
    FALSE_START.test(c) ||
    phonesIn(c) !== null ||
    /from turn|\d+\+|^\d+ left$|^under \d|(full|easy) only|on the board|shown|show\b|reveal|portrait|landscape/.test(c)
  );
};

/**
 * The items a segment shows in one state: of each run of alternatives the first whose condition holds (rule 1: "A / B"
 * shows A), and of the rest those whose condition holds. A leading "two phones" or "first opening only:" counts as a
 * condition on the item it introduces.
 */
export function chosen(seg: Segment, ctx: Ctx): Item[] {
  // Chains: items joined by "+", "with", "and"; a run of chains joined by alternatives is one choice.
  const runs: Item[][][] = [];
  for (const it of seg.items) {
    if (it.alt && runs.length) (runs[runs.length - 1] as Item[][]).push([it]);
    else if (!it.alt && runs.length && it.joinPrev) {
      const run = runs[runs.length - 1] as Item[][];
      (run[run.length - 1] as Item[]).push(it);
    } else runs.push([[it]]);
  }
  const ok = (it: Item) => {
    if (!holds(it.cond, ctx, it.text)) return false;
    if (phonesIn(it.pre.toLowerCase()) || /\bfirst\b/i.test(it.pre)) return holds(it.pre, ctx, it.text);
    return true;
  };
  const out: Item[] = [];
  for (const run of runs) {
    const pick = run.find((chain) => ok(chain[0] as Item));
    if (pick) out.push(...pick.filter(ok));
  }
  return out;
}

/** Every quoted text the words say outside variant brackets, with the "↔" second sides (a toggle's other state). */
export function quotedIn(words: string): { all: Set<string>; toggled: Set<string>; variantOnly: Set<string> } {
  const all = new Set<string>();
  const toggled = new Set<string>();
  const variants = new Set<string>();
  for (const s of segmentsOf(words)) {
    const seg = tokenize(s);
    for (const it of seg.items) {
      all.add(it.text.toLowerCase());
      if (it.toggle) toggled.add(it.text.toLowerCase());
      for (const v of it.variants ?? []) variants.add(v.toLowerCase());
    }
  }
  const variantOnly = new Set([...variants].filter((v) => !all.has(v)));
  return { all, toggled, variantOnly };
}
