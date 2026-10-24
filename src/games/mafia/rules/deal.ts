// MAF-003 (the Mafia count), MAF-010 (the deal, with item 16's streak rule) and MAF-H3 (the deal override).
import { createRng, shuffle } from '../../../engine';
import { ROLES, type Role } from './types';

/** MAF-003 (MF5): the suggested count and every allowed count, ascending. */
export function mafiaCounts(n: number): { suggested: number; allowed: number[] } {
  const suggested = n <= 7 ? 1 : n <= 11 ? 2 : n <= 15 ? 3 : 4;
  const allowed: number[] = [];
  for (let m = Math.max(1, suggested - 1); m <= suggested + 1; m++) if (m === 1 || 2 * m + 1 < n) allowed.push(m);
  return { suggested, allowed };
}

/** The count kept when the players change: the same if MAF-003 allows it, else the suggestion (MAF-061, PO 16). */
export function keptCount(n: number, m: number): number {
  const c = mafiaCounts(n);
  return c.allowed.includes(m) ? m : c.suggested;
}

/** MAF-010: M × mafia, then (n ≥ 6) doctor and police, then villagers. */
export function baseRoles(n: number, m: number): Role[] {
  const out: Role[] = Array.from({ length: m }, () => 'mafia' as Role);
  if (n >= 6) out.push('doctor', 'police');
  while (out.length < n) out.push('villager');
  return out;
}

/**
 * One deal of game k. `earlier` = the final deals of tonight's games 1 … k − 1, in order; `d` = 0 for the game's first deal,
 * d for its d-th redeal. Nobody is dealt `mafia` three games running (item 16).
 */
export function dealRoles(
  seedRoles: string, k: number, players: readonly string[], m: number, earlier: readonly Readonly<Record<string, Role>>[], d: number,
): Record<string, Role> {
  const base = baseRoles(players.length, m);
  const seed = d === 0 ? `${seedRoles}:${k}` : `${seedRoles}:${k}:d${d}`;
  const g1 = earlier[k - 2];
  const g2 = earlier[k - 3];
  const onStreak = (p: string) => g1?.[p] === 'mafia' && g2?.[p] === 'mafia';
  let deal: Record<string, Role> = {};
  for (let j = 0; j < 10_000; j++) {
    const shuffled = shuffle(base, createRng(j === 0 ? seed : `${seed}:r${j}`));
    deal = {};
    players.forEach((p, i) => { deal[p] = shuffled[i] as Role; });
    if (!players.some((p) => deal[p] === 'mafia' && onStreak(p))) return deal;
  }
  return deal;
}

/** MAF-H3: an override is used only when its players are exactly these and its roles are a valid deal for them. */
export function validOverride(
  deal: Readonly<Record<string, unknown>> | undefined, players: readonly string[], m: number,
): Record<string, Role> | null {
  if (!deal || typeof deal !== 'object') return null;
  const keys = Object.keys(deal);
  if (keys.length !== players.length || !players.every((p) => Object.prototype.hasOwnProperty.call(deal, p))) return null;
  const count = (r: Role) => players.filter((p) => deal[p] === r).length;
  if (!players.every((p) => ROLES.includes(deal[p] as Role))) return null;
  const extra = players.length >= 6 ? 1 : 0;
  if (count('mafia') !== m || count('doctor') !== extra || count('police') !== extra) return null;
  const out: Record<string, Role> = {};
  for (const p of players) out[p] = deal[p] as Role;
  return out;
}
