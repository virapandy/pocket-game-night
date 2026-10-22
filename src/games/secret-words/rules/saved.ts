// Saved evenings (SWD-026, SWD-062, SWD-064) and the browser's test seeds (Test hooks item 2).
import { replay, type SavedGame } from '../../../engine';
import { secretWordsRules } from './rules';
import type { PastGame, SecretWordsChoices, SecretWordsConfig, SecretWordsMove, Team, Teams } from './types';

export interface SecretWordsEvening {
  readonly seeds: Readonly<Record<string, string>>;
  /** Now: after every recorded change. */
  readonly players: readonly string[];
  readonly teams: Teams;
  readonly choices: SecretWordsChoices;
  readonly status: SavedGame['status'];
  /** `endEvening` is recorded. */
  readonly ended: boolean;
  /** Won and ended-early games, in order; a replaced board is not a game, and a game in progress is not here yet. */
  readonly games: readonly PastGame[];
  /** Won games by team. */
  readonly tally: { readonly orange: number; readonly teal: number };
}

/** SWD-064: the evening as History and the summary read it, by replaying its moves. Null when it no longer replays. */
export function readSecretWordsEvening(saved: SavedGame): SecretWordsEvening | null {
  const r = replay(
    secretWordsRules,
    saved.setup as SavedGame<SecretWordsConfig>['setup'],
    saved.records as SavedGame<SecretWordsConfig, SecretWordsMove>['records'],
  );
  if (!r.ok) return null;
  const s = r.value.state;
  const tally: Record<Team, number> = { orange: 0, teal: 0 };
  for (const g of s.games) if (g.winner) tally[g.winner]++;
  return {
    seeds: saved.setup.seeds,
    players: s.players,
    teams: s.teams,
    choices: s.choices,
    status: saved.status,
    ended: s.ended,
    games: s.games,
    tally,
  };
}

export interface TestSeeds {
  deal?: string;
  teams?: string;
  boards?: string[];
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Test hooks item 2: reads `localStorage['pgn.test.seeds']`, `{ deal?, teams?, boards? }` with only the keys present.
 * Null in the release build, when the key is missing, or when it is not JSON of that shape.
 */
export function readTestSeeds(raw: string | null, release: boolean): TestSeeds | null {
  if (release || raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(data)) return null;
  const out: TestSeeds = {};
  for (const key of ['deal', 'teams'] as const) {
    if (data[key] === undefined) continue;
    const v = data[key];
    if (typeof v !== 'string') return null;
    out[key] = v;
  }
  if (data.boards !== undefined) {
    if (!Array.isArray(data.boards) || !data.boards.every((b) => typeof b === 'string')) return null;
    out.boards = [...(data.boards as string[])];
  }
  return out;
}
