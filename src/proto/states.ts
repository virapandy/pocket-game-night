// Reads what a screen map's prototype script says about exact states (a "**K… Exact states for the renderer**" part:
// one bullet per screen, "- **T3:** …"), and the facts those states point at: the example night's rounds of scores, a
// word sequence, numbered lines of a scenarios item, the tap guards. Also reads a screen's *Words* as clauses (the map
// separates the things on a screen with ";"), each with its role from the words before its first quote ("heading",
// "main", "quiet", "input", "Switch", "line"…). Generic: it knows the map's format, never a game.
import { sentences, stripParens } from './script';

export interface KPart {
  title: string;
  text: string;
}

/** Map text as it may be drawn: never the word "quiet" before a label, never the map's quote marks or bold marks. */
export function clean(s: string): string {
  return s
    .replace(/^\s*quiet\s+(?=["“])/i, '')
    .replace(/\bquiet\s+(?=["“])/gi, '')
    .replace(/["“”]/g, '')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "- **R1, G1:** text": the bullets of the exact-states part, by screen ID (with the ID's place in its bullet). */
export function statesOf(parts: KPart[], known: Set<string>): Record<string, { text: string; index: number }> {
  const out: Record<string, { text: string; index: number }> = {};
  const part = parts.find((p) => /exact states/i.test(p.title));
  if (!part) return out;
  const bullets = part.text.split(/\n(?=\s*-\s)/);
  for (const b of bullets) {
    const m = /^\s*-\s+\*\*([^*]+?):?\*\*:?\s*([\s\S]*)$/.exec(b.trim());
    if (!m) continue;
    const ids = (m[1] as string).split(/\s*,\s*/).map((x) => x.replace(/:$/, '').trim());
    const text = (m[2] as string).replace(/\s+/g, ' ').trim();
    ids.forEach((id, index) => {
      if (known.has(id)) out[id] = { text, index };
    });
  }
  return out;
}

/** Splits on ";" and sentence ends outside quotes and brackets. */
export function clauses(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let depth = 0;
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string;
    if (c === '"') quoted = !quoted;
    else if (!quoted && c === '(') depth++;
    else if (!quoted && c === ')') depth = Math.max(0, depth - 1);
    const top = !quoted && depth === 0;
    if (top && c === ';') {
      out.push(cur);
      cur = '';
      continue;
    }
    if (top && c === '.' && /\s/.test(s[i + 1] ?? '') && /[A-Z*"]/.test(s.slice(i + 1).trimStart()[0] ?? '')) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim().replace(/\.$/, '').trim()).filter(Boolean);
}

export interface Quote {
  text: string;
  /** The unquoted words just before it (since the last quote). */
  before: string;
  /** An alternative to the quote before it ("A" / "B"): not this state. */
  alt: boolean;
}

/** The quoted words of a clause outside brackets, with what stands before each. */
export function quotesOf(clause: string): Quote[] {
  const s = stripParens(clause);
  const out: Quote[] = [];
  const re = /"([^"]+)"/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    const before = s.slice(last, m.index).trim();
    out.push({ text: m[1] as string, before, alt: out.length > 0 && /^(\/|↔|or\b)/.test(before) });
    last = m.index + m[0].length;
  }
  return out;
}

/** The words before a clause's first quote, lower case, without brackets. */
export const leadOf = (clause: string) => (stripParens(clause).split('"')[0] ?? '').trim().toLowerCase();

/** The quoted words inside a clause's brackets (for "small pack name ("Animals")"). */
export const parenQuotes = (clause: string) =>
  [...clause.matchAll(/\(([^()]*)\)/g)].flatMap((m) => [...(m[1] as string).matchAll(/"([^"]+)"/g)].map((q) => q[1] as string));

/** A screen's *Words* paragraphs: "*Words:*" or "*Words, in the guesser's hand:*" (one per state), up to *Intentions*. */
export function wordVariants(notes: string): { name: string; text: string }[] {
  const body = notes.split(/\*?Intentions:\*?/i)[0] ?? '';
  const marks = [...body.matchAll(/\*?Words(?:,\s*([^:*]+))?:\*?/g)];
  if (!marks.length) return [{ name: '', text: body }];
  return marks.map((m, i) => ({
    name: (m[1] ?? '').trim().toLowerCase(),
    text: body.slice((m.index ?? 0) + m[0].length, marks[i + 1]?.index ?? body.length).replace(/\bMenu:.*?(\.\s|$)/g, ' ').trim(),
  }));
}

/** Scores by round from the example night ("Round 1: Riya … (5); Arjun 7 …", "Round 2 adds Arjun 7, …"). */
export function roundsOf(parts: KPart[], players: string[]): Record<string, number>[] {
  const rounds: Record<string, number>[] = [];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const p of parts) {
    for (const s of sentences(`${p.title} ${p.text}`.replace(/\s+/g, ' '))) {
      const r = /\bRound\s+(\d+)\b/.exec(s);
      if (!r) continue;
      const text = s.slice(r.index + r[0].length);
      const scores: Record<string, number> = {};
      const at = players
        .map((n) => ({ n, i: text.search(new RegExp(`\\b${esc(n)}\\b`)) }))
        .filter((x) => x.i >= 0)
        .sort((a, b) => a.i - b.i);
      at.forEach((x, k) => {
        const upto = at[k + 1]?.i ?? text.length;
        const num = /\(?\b(\d+)\b\)?/.exec(text.slice(x.i + x.n.length, upto));
        if (num) scores[x.n] = Number(num[1]);
      });
      // The round's own sentence names most players; a later mention ("Round 2 · Arjun guessing") is not a score.
      const k = Number(r[1]) - 1;
      if (Object.keys(scores).length >= 2 && !rounds[k]) rounds[k] = scores;
    }
  }
  return rounds.filter(Boolean);
}

/** The scoreboard after `upto` rounds, highest first (ties in turn order), as "Arjun 7 (1 turn)" lines. */
export function scoreboard(rounds: Record<string, number>[], players: string[], upto: number, withTurns: boolean): string[] {
  const used = rounds.slice(0, upto);
  const rows = players
    .map((n, i) => ({ n, i, score: used.reduce((t, r) => t + (r[n] ?? 0), 0), turns: used.filter((r) => n in r).length }))
    .filter((r) => r.turns > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i);
  return rows.map((r) => (withTurns ? `${r.n} ${r.score} (${r.turns} ${r.turns === 1 ? 'turn' : 'turns'})` : `${r.n} ${r.score}`));
}

/** The words that follow `first` in the example night ("Riya gets Tiger, Owl, …, passes Penguin, Zebra (5)"). */
export function sequenceFrom(parts: KPart[], first: string, players: string[]): string[] {
  for (const p of parts) {
    for (const c of `${p.text}`.replace(/\s+/g, ' ').split(/;/)) {
      const i = c.toLowerCase().indexOf(first.toLowerCase());
      if (i < 0) continue;
      const rest = stripParens(c.slice(i)).split(/[.(]/)[0] ?? '';
      return (rest.match(/\b[A-Z][a-z]+\b/g) ?? []).filter((w) => !players.includes(w));
    }
  }
  return [first];
}

/** A scenarios item's numbered lines ("42. … 1 "…" 2 "…""), in order. */
export function itemLines(doc: string, item: number): string[] {
  const lines = doc.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^${item}\\.\\s`).test(l.trim()));
  if (start < 0) return [];
  let end = lines.findIndex((l, i) => i > start && /^(\d+\.\s|#)/.test(l.trim()));
  if (end < 0) end = lines.length;
  const text = lines.slice(start, end).join(' ').replace(/^\s*\d+\.\s*/, '');
  const out: string[] = [];
  for (const m of text.matchAll(/\b(\d+)\s+"([^"]+)"/g)) if (Number(m[1]) === out.length + 1) out.push(m[2] as string);
  return out;
}

/** The labels of an item of drawings ("Drawings (…), alt texts: "…" · "…" · "…""), when it gives `n`. */
export function drawingLabels(doc: string, n: number): string[] {
  for (const l of doc.split(/\n(?=\s*\d+\.\s)/)) {
    if (!/^\s*\d+\.\s+Drawings\b/i.test(l)) continue;
    const q = [...l.matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);
    if (q.length >= n) return q.slice(0, n);
  }
  return [];
}

const ORDINAL: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
export const ordinal = (w: string) => ORDINAL[w.toLowerCase()] ?? (Number.parseInt(w, 10) || 0);
export const WORD_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

/** The map's tap guards ("greyed for 800 ms … (1 s on "A" and "B")"): the usual time and the longer ones by label. */
export interface Guards {
  ms: number;
  labels: [string, number][];
}

export function guardsOf(text: string): Guards {
  const i = text.search(/tap guards?\b/i);
  if (i < 0) return { ms: 0, labels: [] };
  const para = text.slice(i, i + 600).split(/\n\s*\n|\n-\s/)[0] ?? '';
  const ms = Number(/(\d+)\s*ms\b/.exec(para)?.[1] ?? 0);
  const labels: [string, number][] = [];
  for (const m of para.matchAll(/(\d+(?:\.\d+)?)\s*s\b([^;)]*)/g)) {
    for (const q of (m[2] as string).matchAll(/"([^"]+)"/g)) labels.push([q[1] as string, Number(m[1]) * 1000]);
  }
  return { ms, labels };
}

/** How long a main button with this label is guarded. */
export function guardFor(g: Guards, label: string): number {
  const l = label.toLowerCase();
  const hit = g.labels.find(([x]) => l.startsWith(x.toLowerCase()) || x.toLowerCase().startsWith(l));
  return hit ? hit[1] : g.ms;
}

/** The menu items a map's rules give for every screen ("*Menu*, in this order where an item applies: A · B · C."). */
export function menuOf(text: string): string[] {
  const m = /\*Menu\*,?[^:\n]*:\s*([\s\S]*?)\.(?:\s|$)/.exec(text);
  return m ? (m[1] as string).replace(/\s+/g, ' ').split(/\s+·\s+/).map((x) => x.trim()).filter(Boolean) : [];
}
