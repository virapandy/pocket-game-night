// Reads a screen map's prototype script (the "## … Prototype script" section; for Secret Words, section K of
// docs/games/secret-words/screen-map.md) into data for the renderer: the example night (players, teams, clue givers,
// facts), the example board, which screens draw it, and which outcome a tap follows. Generic: it knows the script's
// shape, never a game. A map without such a section has no script, and the prototype draws it as before.

export interface Team {
  name: string;
  colour: string;
  members: string[];
}

export interface Kind {
  letter: string;
  name: string;
  /** The team whose colour this kind is, or -1 (nobody, the Landmine…). */
  team: number;
}

export interface Cell {
  word: string;
  kind: string;
}

/** One "tap → outcome" of the script. */
export interface Outcome {
  /** The screen the tap is on, when the script names it. */
  screen?: string;
  /** The tap's words, lower case ("reveal", "other team's turn", "unfinished row"). */
  tap: string;
  /** "Reveal on Kite": that board word. */
  word?: string;
  /** "(any orange word)", "a teal word": that kind's name. */
  kind?: string;
  to?: string;
  lines: string[];
  heading?: string;
  toast?: string;
  /** "for Arjun (Coffee Commandos)": the turn passes to the other team. */
  forName?: string;
  /** Defined terms to show as lines on the target ("the where-line"). */
  terms: string[];
}

/** "G1 from "End the game" shows "…" only; otherwise "…" + "…" only." */
export interface Only {
  screen: string;
  from?: string;
  lines: string[];
}

export interface Script {
  players: string[];
  teams: Team[];
  clueGivers: string[];
  /** The example night's text, lower case, for picking options ("full board", "one phone"). */
  facts: string;
  phones: number;
  turn: number;
  board: Cell[][];
  kinds: Kind[];
  turned: string[];
  boardScreens: string[];
  /** Screens whose board shows every kind (the private map, the map phone). */
  mapScreens: string[];
  outcomes: Outcome[];
  only: Only[];
  /** Screens that list the example night's players with their buttons. */
  lists: string[];
  /** Screens that show the full text of scenarios: screen → scenario IDs. */
  fullText: Record<string, string[]>;
  /** `term` "first quoted words" from anywhere in the map ("where-line" → "Turn 4 · Chai Champions' clue"). */
  terms: Record<string, string>;
}

const NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };
const ID = /\b([A-Z]\d+[a-z]?)\b/g;

/** Splits on sentence ends ("." then a space and a capital, or the end) outside quotes and brackets. */
export function sentences(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string;
    cur += c;
    if (c === '"') quoted = !quoted;
    else if (!quoted && c === '(') depth++;
    else if (!quoted && c === ')') depth = Math.max(0, depth - 1);
    else if (!quoted && depth === 0 && c === '.' && (i === s.length - 1 || /\s/.test(s[i + 1] ?? ''))) {
      out.push(cur.trim());
      cur = '';
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

const quotes = (s: string) => [...s.matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);

export function parseScript(text: string, screenIds: string[]): Script | undefined {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^##\s/.test(l) && /prototype script/i.test(l));
  if (start < 0) return undefined;
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end < 0) end = lines.length;
  const body = lines.slice(start + 1, end).join('\n');
  const known = new Set(screenIds);

  // The parts: "**K1. Title.** text", up to the next bold title.
  const parts = body.split(/\n(?=\*\*[^*\n]+\*\*)/).map((p) => {
    const m = /^\*\*([^*]+)\*\*\s*([\s\S]*)$/.exec(p.trim());
    return { title: (m?.[1] ?? '').trim(), text: m?.[2] ?? p };
  });
  const part = (re: RegExp) => parts.find((p) => re.test(p.title));
  const flat = (s: string) => s.replace(/\s+/g, ' ').trim();

  // The example night.
  const night = flat(part(/example|night/i)?.text ?? '');
  const players = (/\bPlayers\s+([^.]+)\./.exec(night)?.[1] ?? '').split(/,\s*/).map((x) => x.trim()).filter(Boolean);
  const teams: Team[] = (/\bTeams:\s*([^.]+)\./.exec(night)?.[1] ?? '')
    .split(/;\s*/)
    .map((t) => /^(.+?)\s*\(([^)]+)\)\s*(.+)$/.exec(t.trim()))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ name: (m[1] as string).trim(), colour: (m[2] as string).trim(), members: (m[3] as string).split(/,\s*/).map((x) => x.trim()) }));
  const clueGivers = (/\bClue givers?\s+([^.]+)\./.exec(night)?.[1] ?? '').split(/,\s*|\s+and\s+/).map((x) => x.trim()).filter(Boolean);
  const phonesWord = /\b(one|two|three)\s+phones?\b/i.exec(night)?.[1]?.toLowerCase();
  const turn = Number(/\bturn\s+(\d+)/i.exec(night)?.[1] ?? 1);

  // The example board.
  const boardPart = part(/board/i)?.text ?? '';
  const block = /```[^\n]*\n([\s\S]*?)```/.exec(boardPart)?.[1] ?? '';
  const board: Cell[][] = block
    .split('\n')
    .map((row) => [...row.matchAll(/\s*([^()\s][^()]*?)\(([A-Z])\)/g)].map((m) => ({ word: (m[1] as string).trim(), kind: m[2] as string })))
    .filter((r) => r.length > 0);
  const legend = /kind in brackets:\s*([^)]*)\)/i.exec(flat(boardPart))?.[1] ?? '';
  const kinds: Kind[] = [...legend.matchAll(/\b([A-Z])\s+([^,]+)/g)].map((m) => {
    const name = (m[2] as string).trim();
    return { letter: m[1] as string, name, team: teams.findIndex((t) => t.colour.toLowerCase() === name.toLowerCase()) };
  });
  const turned = (/Turned over[^:]*:\s*([^.]+)\./i.exec(flat(boardPart))?.[1] ?? '')
    .replace(/\([^)]*\)/g, '')
    .split(/,\s*/)
    .map((x) => x.trim())
    .filter(Boolean);

  // The rendering rules: which screens draw the board, and which show every kind.
  const rules = flat(part(/render/i)?.text ?? '');
  const boardList = /with a board\s*\(([^)]*)\)/i.exec(rules)?.[1] ?? '';
  const boardScreens = [...boardList.matchAll(ID)].map((m) => m[1] as string).filter((i) => known.has(i));
  const every = /;\s*([^;.]*?)\s+shows? every kind/i.exec(rules)?.[1] ?? '';
  const phrases = every.split(/\s+and\s+|,\s*/).map((p) => p.replace(/^the\s+/i, '').trim().toLowerCase()).filter(Boolean);

  // Which outcome a tap follows.
  const outcomes: Outcome[] = [];
  const only: Only[] = [];
  const lists: string[] = [];
  const fullText: Record<string, string[]> = {};
  const names = new Set(players);
  for (const s of sentences(flat(part(/outcome/i)?.text ?? ''))) {
    const sentence = s.replace(/\.$/, '');
    const arrow = splitArrows(sentence);
    if (arrow.length > 1) {
      let left = (arrow[0] as string).trim();
      const right = arrow.slice(1).join(' → ');
      const o: Outcome = { tap: '', lines: [], terms: [] };
      const sm = /^([A-Z]\d+[a-z]?)\s+(.*)$/.exec(left);
      if (sm && known.has(sm[1] as string)) {
        o.screen = sm[1] as string;
        left = sm[2] as string;
      }
      const on = /^(.*?)\s+on\s+(.+)$/.exec(left);
      if (on) {
        left = on[1] as string;
        const what = (on[2] as string).trim();
        const k = /^(?:a|an|any)\s+(\w+)\s+word$/i.exec(what);
        if (k) o.kind = (k[1] as string).toLowerCase();
        else o.word = what;
      }
      const quotedTap = /"([^"]+)"/.exec(left)?.[1];
      o.tap = (quotedTap ?? left.replace(/^.*?'s\s+/, '')).trim().toLowerCase();
      const heading = /\bheading\s+"([^"]+)"/.exec(right)?.[1];
      if (heading) o.heading = heading;
      const toast = /\btoast\s+"([^"]+)"/.exec(right)?.[1];
      if (toast) o.toast = toast;
      o.lines = quotes(right.replace(/\b(heading|toast)\s+"[^"]+"/g, ''));
      const any = /\(any\s+(\w+)\s+word\)/i.exec(right);
      if (any) o.kind = (any[1] as string).toLowerCase();
      const to = [...right.replace(/"[^"]*"/g, '').matchAll(ID)].map((m) => m[1] as string).find((i) => known.has(i));
      if (to) o.to = to;
      const who = /\bfor\s+([A-Z][\w]*)/.exec(right.replace(/"[^"]*"/g, ''))?.[1];
      if (who && names.has(who)) o.forName = who;
      o.terms = [...right.replace(/"[^"]*"/g, '').matchAll(/\bthe\s+([a-z]+-[a-z]+)\b/g)].map((m) => m[1] as string);
      outcomes.push(o);
      continue;
    }
    const shows = /^([A-Z]\d+[a-z]?)\s+(?:from\s+"([^"]+)"\s+)?shows\s+(.*)$/.exec(sentence);
    if (shows && known.has(shows[1] as string) && /\bonly\b/.test(sentence)) {
      const [first, ...rest] = (shows[3] as string).split(/;\s*otherwise\s+/);
      only.push({ screen: shows[1] as string, ...(shows[2] ? { from: shows[2] } : {}), lines: quotes(first ?? '') });
      for (const r of rest) only.push({ screen: shows[1] as string, lines: quotes(r) });
      continue;
    }
    const full = /^([A-Z]\d+[a-z]?)\s+shows\s+the\s+full\b.*?\btext of\s+(.+)$/.exec(sentence);
    if (full && known.has(full[1] as string)) {
      let prefix = '';
      fullText[full[1] as string] = [...(full[2] as string).matchAll(/\b([A-Z]+-)?(\d+)\b/g)].map((m) => {
        if (m[1]) prefix = m[1];
        return `${prefix}${(m[2] as string).padStart(3, '0')}`;
      });
      continue;
    }
    const list = /^([A-Z]\d+[a-z]?)\s+lists\b/.exec(sentence);
    if (list && known.has(list[1] as string)) lists.push(list[1] as string);
  }

  // Defined terms: `term` "words" anywhere in the map (the first wording).
  const terms: Record<string, string> = {};
  for (const m of text.matchAll(/`([a-z]+(?:-[a-z]+)+)`\s*"([^"]+)"/g)) {
    const k = m[1] as string;
    if (!(k in terms)) terms[k] = m[2] as string;
  }

  return {
    players,
    teams,
    clueGivers,
    facts: night.toLowerCase(),
    phones: phonesWord ? (NUM[phonesWord] ?? 1) : 1,
    turn,
    board,
    kinds,
    turned,
    boardScreens,
    mapScreens: phrases,
    outcomes,
    only,
    lists,
    fullText,
    terms,
  };
}

/** Splits on "→" outside quotes. */
function splitArrows(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (const c of s) {
    if (c === '"') quoted = !quoted;
    if (c === '→' && !quoted) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

/** Removes "(…)" outside quotes (the scenarios' variants and notes). */
export function stripParens(s: string): string {
  let out = '';
  let depth = 0;
  let quoted = false;
  for (const c of s) {
    if (c === '"' && depth === 0) quoted = !quoted;
    if (!quoted && c === '(') {
      depth++;
      continue;
    }
    if (!quoted && c === ')' && depth > 0) {
      depth--;
      continue;
    }
    if (depth === 0) out += c;
  }
  return out;
}

export interface TextBlock {
  heading: string;
  items: string[];
}

/** A scenario's text: from "### <ID> " to the next heading. */
function scenario(doc: string, id: string): string {
  const lines = doc.split('\n');
  const i = lines.findIndex((l) => l.startsWith(`### ${id} `) || l.trim() === `### ${id}`);
  if (i < 0) return '';
  const end = lines.findIndex((l, j) => j > i && /^#{2,3}\s/.test(l));
  return lines.slice(i, end < 0 ? undefined : end).join(' ').replace(/\s+/g, ' ');
}

/** Numbered quoted lines of a scenario: `1 "…" 2 "…"`, in order. */
export function numberedLines(doc: string, id: string): string[] {
  const out: string[] = [];
  for (const m of stripParens(scenario(doc, id)).matchAll(/\b(\d+)\s+"([^"]+)"/g)) {
    if (Number(m[1]) === out.length + 1) out.push(m[2] as string);
  }
  return out;
}

/**
 * The full text the scenarios give a help screen: each h2 "…" with its numbered lines (a later "line 7 "…"" joins the
 * list it continues), then small lines like `credit`: "…". An h2 the scenarios give no lines for takes them from the
 * scenario it is a detail of ("(detail of SWD-010)").
 */
export function fullText(doc: string, ids: string[]): { blocks: TextBlock[]; small: string[] } {
  const blocks: TextBlock[] = [];
  const small: string[] = [];
  const mentioned: TextBlock[] = [];
  const parents: string[] = [];
  const touch = (b: TextBlock) => {
    const i = mentioned.indexOf(b);
    if (i >= 0) mentioned.splice(i, 1);
    mentioned.push(b);
  };
  for (const id of ids) {
    const raw = scenario(doc, id);
    const parent = /\(detail of ([A-Z]+-\d+)\)/.exec(raw)?.[1];
    if (parent) parents.push(parent);
    const text = stripParens(raw);
    let current: TextBlock | undefined;
    const re = /\bh2\s+"([^"]+)"|\b(\d+)\s+"([^"]+)"|`[\w-]+`:\s*"([^"]+)"|"([^"]+)"/g;
    for (const m of text.matchAll(re)) {
      if (m[1]) {
        current = blocks.find((b) => b.heading === m[1]) ?? { heading: m[1], items: [] };
        if (!blocks.includes(current)) blocks.push(current);
        touch(current);
      } else if (m[2]) {
        const n = Number(m[2]);
        const into =
          current && current.items.length === n - 1 ? current : [...mentioned].reverse().find((b) => b.items.length === n - 1);
        if (into) {
          into.items.push(m[3] as string);
          current = into;
        }
      } else if (m[4]) {
        if (!small.includes(m[4])) small.push(m[4]);
      } else if (m[5]) {
        const b = blocks.find((x) => x.heading === m[5]);
        if (b) {
          current = b;
          touch(b);
        }
      }
    }
  }
  for (const b of blocks) {
    if (b.items.length > 0) continue;
    for (const p of parents) {
      const found = numberedLines(doc, p);
      if (found.length) {
        b.items.push(...found);
        break;
      }
    }
  }
  return { blocks, small };
}
