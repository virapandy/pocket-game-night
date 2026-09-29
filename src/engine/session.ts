// Sessions (PLT-016, PLT-022, PLT-026, PLT-027): every game belongs to one named gathering, such as
// "Diwali at Nani's". A session keeps its settles so they can be looked at later. Pure: the time comes in.
import type { SavedGame } from './saved-game';
import type { TallyPerson, HandOver } from './tally';

export const SESSION_FORMAT = 1;

/** One "Mark as settled" (PLT-019, PLT-027): what the tally said, kept read-only. */
export interface Settlement {
  readonly id: string;
  readonly at: number;
  readonly gameIds: readonly string[];
  readonly people: readonly TallyPerson[];
  readonly handOvers: readonly HandOver[];
}

export interface Session {
  readonly format: typeof SESSION_FORMAT;
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly settlements: readonly Settlement[];
}

/** A new game joins the latest session unless it starts more than this long after that session's last game (PLT-016). */
export const SESSION_GAP_MS = 3 * 3600_000;

export type SessionQuestion =
  /** The first game of a gathering: ask for a name. */
  | { readonly kind: 'name' }
  /** Long after the latest session's last game: "Continue '…' or start a new session?" */
  | { readonly kind: 'continue'; readonly session: Session }
  /** Join the latest session without asking. */
  | { readonly kind: 'join'; readonly session: Session };

/** When the session last saw a game: its games' last change, or when it was made. */
export function lastActivity(session: Session, games: readonly SavedGame[]): number {
  return games.filter((g) => g.sessionId === session.id).reduce((t, g) => Math.max(t, g.updatedAt), session.createdAt);
}

/** What to ask before a new game starts at `now` (PLT-016, PLT-026). */
export function sessionQuestion(sessions: readonly Session[], games: readonly SavedGame[], now: number): SessionQuestion {
  let latest: Session | null = null;
  let latestAt = -Infinity;
  for (const s of sessions) {
    const at = lastActivity(s, games);
    if (at > latestAt) {
      latest = s;
      latestAt = at;
    }
  }
  if (!latest) return { kind: 'name' };
  return now - latestAt > SESSION_GAP_MS ? { kind: 'continue', session: latest } : { kind: 'join', session: latest };
}

/** Reads a stored session; null if it is damaged or from a newer app. */
export function readSession(raw: unknown): Session | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Session;
  if (s.format !== SESSION_FORMAT || typeof s.id !== 'string' || typeof s.name !== 'string' || !Array.isArray(s.settlements)) return null;
  return s;
}

/** "Change" on the session line offers sessions whose last game was at most this long ago (PLT-029). */
export const RECENT_SESSION_MS = 7 * 24 * 3600_000;

/**
 * PLT-029: the unsettled sessions a new game may join instead of the one shown, most recent first: at most
 * `limit`, each with a game in the last 7 days. A session is settled once it has been marked as settled and
 * nothing new is left in its tally.
 */
export function recentUnsettledSessions(
  sessions: readonly Session[],
  games: readonly SavedGame[],
  now: number,
  limit = 3,
): Session[] {
  const unsettled = (s: Session) =>
    s.settlements.length === 0 || games.some((g) => g.sessionId === s.id && g.status === 'ended' && !g.settlementId && !!g.money);
  return sessions
    .map((s) => ({ s, at: lastActivity(s, games) }))
    .filter(({ s, at }) => now - at <= RECENT_SESSION_MS && unsettled(s))
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ s }) => s);
}
