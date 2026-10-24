// The Mafia scenarios' own algorithms, written out with the engine's createRng and shuffle (specs/mafia/api.md, "The
// rules, exactly"), so the rule tests can compare the build with them. Pure, no game code: this file must load and
// work before src/games/mafia exists.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRng, shuffle } from '../../../src/engine';

export type Role = 'mafia' | 'doctor' | 'police' | 'villager';
export const ROLES: readonly Role[] = ['mafia', 'doctor', 'police', 'villager'];

/** Item 10: the generator's first value, r.int(2 ** 32) / 2 ** 32. */
export function firstValue(seed: string): number {
  return createRng(seed).int(2 ** 32) / 2 ** 32;
}
/** Item 10: list[floor(rng() × list.length)] with the first value of createRng(seed). */
export function pickFirst<T>(list: readonly T[], seed: string): T {
  if (list.length === 0) throw new RangeError('pickFirst needs at least one item');
  return list[Math.floor(firstValue(seed) * list.length)] as T;
}

/** MAF-003 (MF5): the suggested count and every allowed count, ascending. */
export function oracleCounts(n: number): { suggested: number; allowed: number[] } {
  const suggested = n <= 7 ? 1 : n <= 11 ? 2 : n <= 15 ? 3 : 4;
  const allowed: number[] = [];
  for (let m = Math.max(1, suggested - 1); m <= suggested + 1; m++) if (m === 1 || 2 * m + 1 < n) allowed.push(m);
  return { suggested, allowed };
}

/** MAF-010: M × mafia, then (n ≥ 6) doctor and police, then villagers. */
export function baseRoles(n: number, m: number): Role[] {
  const out: Role[] = Array.from({ length: m }, () => 'mafia' as Role);
  if (n >= 6) out.push('doctor', 'police');
  while (out.length < n) out.push('villager');
  return out;
}

/**
 * MAF-010 with item 16: one deal. `earlier` = the final deals of tonight's games 1 … k − 1 (player → role), in order.
 * `d` = 0 for the game's first deal, d for its d-th redeal.
 */
export function oracleDeal(
  roles: string, k: number, players: readonly string[], m: number, earlier: readonly Record<string, Role>[], d = 0,
): Record<string, Role> {
  const base = baseRoles(players.length, m);
  const seed = d === 0 ? `${roles}:${k}` : `${roles}:${k}:d${d}`;
  const g1 = earlier[k - 2]; // game k − 1
  const g2 = earlier[k - 3]; // game k − 2
  const onStreak = (p: string) => g1?.[p] === 'mafia' && g2?.[p] === 'mafia';
  for (let j = 0; j < 10_000; j++) {
    const shuffled = shuffle(base, createRng(j === 0 ? seed : `${seed}:r${j}`));
    const deal: Record<string, Role> = {};
    players.forEach((p, i) => { deal[p] = shuffled[i] as Role; });
    if (!players.some((p) => deal[p] === 'mafia' && onStreak(p))) return deal;
  }
  throw new Error('oracleDeal: no deal without a streak');
}

/**
 * Terms, "Night order": the players who take a turn tonight, in order. `gone` = players who left or are leaving
 * (skipped). `players` = dealt this game, seat order.
 */
export function oracleNightOrder(players: readonly string[], k: number, r: number, gone: ReadonlySet<string> = new Set()): string[] {
  const n = players.length;
  const start = ((k - 1) + (r - 1)) % n;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = players[(start + i) % n] as string;
    if (!gone.has(p)) out.push(p);
  }
  return out;
}

/** MAF-023: the Mafia's target from their picks in night order (null when there is none). */
export function oracleTarget(roles: string, k: number, r: number, picks: readonly string[]): string | null {
  if (picks.length === 0) return null;
  if (picks.every((p) => p === picks[0])) return picks[0] as string;
  return pickFirst(picks, `${roles}:${k}:night${r}`);
}

// ---- Stories (docs/games/mafia/stories.csv, edition 1.2) ----

export interface Story { id: string; kind: 'out' | 'saved'; text: string }

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

const csvRows = parseCsv(readFileSync(fileURLToPath(new URL('../../../docs/games/mafia/stories.csv', import.meta.url)), 'utf8'));
const head = csvRows[0]!;
/** Every story of the CSV, in row order, as stories.json must hold them. */
export const STORIES: Story[] = csvRows.slice(1).map((r) => ({
  id: r[head.indexOf('id')]!, kind: r[head.indexOf('kind')] as Story['kind'], text: r[head.indexOf('text')]!,
}));
export const STORY_TEXT = new Map(STORIES.map((s) => [s.id, s.text]));
export const QUIET_NIGHT = 'A quiet night. Nobody is out!';

/** MAF-037: the story for night r of game k, given the ids of this kind already used in this game. */
export function oracleStory(roles: string, k: number, r: number, kindIds: readonly string[], usedInGame: readonly string[]): string {
  let unused = [...kindIds].filter((id) => !usedInGame.includes(id)).sort();
  if (unused.length === 0) unused = [...kindIds].sort();
  return pickFirst(unused, `${roles}:${k}:story${r}`);
}
export function storyText(id: string, name: string | null): string {
  const t = STORY_TEXT.get(id);
  if (t === undefined) throw new Error(`no story ${id}`);
  return name === null ? t : t.split('{NAME}').join(name);
}
