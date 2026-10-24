// The one saved map on this phone (SWD-036): `pgn.secretWords.map`. Format version 1 (`v: 1`, CLAUDE.md: saved data
// carries a format version). Version 1 is also the scenarios' unversioned shape `{ code, savedAt, found, t?, p?, team? }`,
// so a map saved before the version field was added still opens. Any other version, or a value of the wrong shape, reads
// as no saved map. Privacy: this holds the code and the found cells only, never a word or a kind.
import type { Preferences } from '../../../engine';
import { parseMapCode, TEAM_NAMES, WORDS } from '../rules';
import type { Team } from '../rules';

export const SAVED_MAP_KEY = 'secretWords.map';
export const SAVED_MAP_FORMAT = 1 as const;

export interface SavedMap {
  readonly v: typeof SAVED_MAP_FORMAT;
  /** The 7-symbol code, without its hyphen. */
  readonly code: string;
  /** When the code was first opened here, or when "Next map" opened it. */
  readonly savedAt: number;
  /** Cells faded on this phone, ascending. */
  readonly found: readonly number[];
  /** The team-name pair id from the QR (SWD-117), only a known one. */
  readonly t?: string;
  /** Three phones (SWD-034 v3.6). */
  readonly p?: 'own';
  /** "I give clues for:" (only with `p`). */
  readonly team?: Team;
}

export const knownPair = (t: unknown) => (typeof t === 'string' ? TEAM_NAMES.find((n) => n.id === t) ?? null : null);

/** The saved map, or null (none, another format version, or a damaged value). */
export function readSavedMap(keys: Preferences): SavedMap | null {
  let raw: unknown;
  try {
    raw = keys.get<unknown>(SAVED_MAP_KEY, null);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const m = raw as Record<string, unknown>;
  if (m.v !== undefined && m.v !== SAVED_MAP_FORMAT) return null;
  if (typeof m.code !== 'string' || typeof m.savedAt !== 'number' || !Number.isFinite(m.savedAt)) return null;
  const code = parseMapCode(m.code, WORDS);
  if (code === 'invalid' || code === 'newer') return null;
  const found = Array.isArray(m.found) ? m.found : [];
  if (!found.every((i) => Number.isInteger(i) && i >= 0 && i < 25)) return null;
  return {
    v: SAVED_MAP_FORMAT,
    code,
    savedAt: m.savedAt,
    found: [...new Set(found as number[])].sort((a, b) => a - b),
    ...(knownPair(m.t) ? { t: m.t as string } : {}),
    ...(m.p === 'own' ? { p: 'own' as const } : {}),
    ...(m.p === 'own' && (m.team === 'orange' || m.team === 'teal') ? { team: m.team } : {}),
  };
}

export function writeSavedMap(keys: Preferences, map: SavedMap | null): void {
  try {
    keys.set(SAVED_MAP_KEY, map);
  } catch {
    // Storage full or blocked: the map still shows, it just isn't kept.
  }
}
