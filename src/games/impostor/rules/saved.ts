// Saved evenings (IMP-096), the browser's test seeds (IMP-064, Test hooks item 3) and the evening's totals (IMP-042).
import { replay, type SavedGame } from '../../../engine';
import { impostorRules } from './rules';
import type { Choices, ExcludedWords, ImpostorConfig, ImpostorMove, TestDeal } from './types';

export interface ImpostorEvening {
  readonly players: readonly string[];
  readonly choices: Choices;
  readonly excludedWords: ExcludedWords;
  readonly seeds: Readonly<Record<string, string>>;
  readonly moves: readonly ImpostorMove[];
  readonly status: SavedGame['status'];
}

/** IMP-096: the evening's starting players, choices and excluded words, its seeds, its moves in order and its status. */
export function readImpostorEvening(saved: SavedGame): ImpostorEvening {
  const config = saved.setup.config as ImpostorConfig;
  return {
    players: config.players,
    choices: config.choices,
    excludedWords: config.excludedWords,
    seeds: saved.setup.seeds,
    moves: saved.records.map((r) => r.move as ImpostorMove),
    status: saved.status,
  };
}

export interface TestSeeds {
  word?: string;
  starter?: string;
  deals?: TestDeal[];
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * IMP-064: reads `localStorage['pgn.test.seeds']`. Null in the release build, when the key is missing, or when it is not
 * JSON of the shape `{ word?, starter?, deals?: [{ wordId?, impostor?, starter? }] }`.
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
  for (const key of ['word', 'starter'] as const) {
    if (data[key] === undefined) continue;
    const v = data[key];
    if (typeof v !== 'string') return null;
    out[key] = v;
  }
  if (data.deals !== undefined) {
    if (!Array.isArray(data.deals)) return null;
    const deals: TestDeal[] = [];
    for (const d of data.deals) {
      if (!isObject(d)) return null;
      const deal: { wordId?: string; impostor?: string; starter?: string } = {};
      for (const key of ['wordId', 'impostor', 'starter'] as const) {
        if (d[key] === undefined) continue;
        const v = d[key];
        if (typeof v !== 'string') return null;
        deal[key] = v;
      }
      deals.push(deal);
    }
    out.deals = deals;
  }
  return out;
}

/**
 * IMP-042: every player's total over the evening's scored rounds (players who left included), worked out by
 * replaying the saved evening. Null when the saved record does not replay.
 */
export function eveningTotals(saved: SavedGame): Record<string, number> | null {
  const r = replay(impostorRules, saved.setup as SavedGame<ImpostorConfig>['setup'], saved.records as SavedGame<ImpostorConfig, ImpostorMove>['records']);
  return r.ok ? { ...r.value.state.totals } : null;
}
