// A saved game is its setup plus its move records, never a snapshot of state, so it can always be
// replayed. Saved games carry a format version from the first release, and old ones must always
// still open after an update (PLT-014): add a reader for each old format, never delete one.

import type { SetupInput } from './contract';
import type { Move, MoveRecord } from './moves';
import type { MoneyRecord } from './money';

/** PLT-001. Only In progress and Paused games can change. */
export type GameStatus = 'setup' | 'in-progress' | 'paused' | 'ended' | 'abandoned';

const NEXT_STATUS: Readonly<Record<GameStatus, readonly GameStatus[]>> = {
  setup: ['in-progress'],
  'in-progress': ['paused', 'ended', 'abandoned'],
  paused: ['in-progress', 'ended', 'abandoned'],
  ended: [],
  abandoned: [],
};

export function canChangeStatus(from: GameStatus, to: GameStatus): boolean {
  return NEXT_STATUS[from].includes(to);
}

export function isReadOnly(status: GameStatus): boolean {
  return status === 'ended' || status === 'abandoned';
}

/**
 * Format 2 (Phase 1b) adds the session a game belongs to and whether it is settled (PLT-016, PLT-019).
 * Format 1 games open as games from before sessions: in no session, never tallied.
 */
export const SAVED_GAME_FORMAT = 2;

export interface SavedGame<Config = unknown, M extends Move = Move> {
  readonly format: typeof SAVED_GAME_FORMAT;
  readonly gameType: string;
  readonly id: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly status: GameStatus;
  readonly setup: SetupInput<Config>;
  readonly records: readonly MoveRecord<M>[];
  /** Present once a game with money has ended or been discarded (PLT-021, TAM-140). */
  readonly money?: MoneyRecord;
  /** The session the game was started in (PLT-016). It never changes, even if resumed the next day (PLT-026). */
  readonly sessionId?: string;
  /** Set once the game's tally is marked as settled (PLT-019): the settle's id. */
  readonly settlementId?: string;
}

/**
 * Reads a saved game of any known format and brings it up to the current one.
 * Returns the reason if it cannot be read, so one damaged game never stops the others opening.
 */
export function readSavedGame(raw: unknown): { ok: true; game: SavedGame } | { ok: false; reason: string } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'Not a saved game.' };
  const format = (raw as { format?: unknown }).format;
  switch (format) {
    case 1:
    case 2: {
      const g = raw as Omit<SavedGame, 'format'> & { format: number };
      if (typeof g.id !== 'string' || typeof g.gameType !== 'string' || !Array.isArray(g.records) || !g.setup) {
        return { ok: false, reason: 'The saved game is missing parts.' };
      }
      if (!(g.status in NEXT_STATUS)) return { ok: false, reason: `Unknown game state "${String(g.status)}".` };
      if (format === 1) {
        // Saved before sessions: no session, not settled.
        const { sessionId: _s, settlementId: _t, ...rest } = g;
        return { ok: true, game: { ...rest, format: SAVED_GAME_FORMAT } };
      }
      if (g.sessionId !== undefined && typeof g.sessionId !== 'string') return { ok: false, reason: 'The saved game has a damaged session.' };
      return { ok: true, game: { ...g, format: SAVED_GAME_FORMAT } };
    }
    default:
      return { ok: false, reason: `Saved with a newer or unknown format (${String(format)}). Update the app to open it.` };
  }
}
