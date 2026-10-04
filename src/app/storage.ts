// Browser storage for games and preferences: everything stays on this phone (PLT-012, PLT-013).
// Every change is written at once (PLT-003). A damaged entry is skipped, so it never stops the app opening.
import {
  readSavedGame,
  readSession,
  recentUnsettledSessions,
  sessionQuestion,
  SESSION_FORMAT,
  type Preferences,
  type SavedGame,
  type SavedGameStore,
  type Session,
  type SessionPicker,
  type SessionStore,
} from '../engine';
import { games } from './games';

/**
 * The start of every key this app keeps. The owner's preview build (served under /preview/, owner decision 3 October
 * 2026) keeps its own saved games, sessions, settings and reports, so it never reads or changes the families' on the
 * same phone. The families' build keeps today's keys exactly, so every game saved before still opens.
 */
export const KEY_ROOT = (import.meta.env.BASE_URL ?? '/').endsWith('/preview/') ? 'pgn.preview.' : 'pgn.';

const GAME_PREFIX = `${KEY_ROOT}game.`;
const PREF_PREFIX = `${KEY_ROOT}pref.`;
const SESSION_PREFIX = `${KEY_ROOT}session.`;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

let keepDataAsks = 0;

/**
 * PLT-013: ask the browser to keep the app's data when the first game starts. Asked when the game is
 * created and again at its first call, so one lost or refused request does not leave the data unprotected.
 */
function keepData() {
  if (keepDataAsks >= 2) return;
  keepDataAsks++;
  try {
    const manager = typeof navigator === 'undefined' ? undefined : navigator.storage;
    if (manager && typeof manager.persist === 'function') void manager.persist().catch(() => {});
  } catch {
    // Not supported: nothing to do.
  }
}

/**
 * Whether a saved game still opens with its game's rules. One that doesn't (IMP-096: an Impostor evening from an earlier
 * preview build) is kept in storage but never listed: not on Home, in History, sessions or tonight's names.
 */
function opens(game: SavedGame): boolean {
  const g = games.find((x) => x.info.id === game.gameType);
  if (!g || !('opens' in g)) return true;
  try {
    return g.opens(game);
  } catch {
    return false;
  }
}

export const gameStore: SavedGameStore = {
  list() {
    const s = storage();
    if (!s) return [];
    const list: SavedGame[] = [];
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (!key?.startsWith(GAME_PREFIX)) continue;
      try {
        const read = readSavedGame(JSON.parse(s.getItem(key) ?? 'null'));
        if (read.ok && opens(read.game)) list.push(read.game);
      } catch {
        // A damaged entry: skip it.
      }
    }
    return list;
  },
  get(id) {
    try {
      const read = readSavedGame(JSON.parse(storage()?.getItem(GAME_PREFIX + id) ?? 'null'));
      return read.ok ? read.game : undefined;
    } catch {
      return undefined;
    }
  },
  put(game) {
    if (game.records.length <= 1) keepData();
    try {
      storage()?.setItem(GAME_PREFIX + game.id, JSON.stringify(game));
    } catch (e) {
      console.warn('Could not save the game', e);
    }
  },
  remove(id) {
    storage()?.removeItem(GAME_PREFIX + id);
  },
};

export const preferences: Preferences = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = storage()?.getItem(PREF_PREFIX + key);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      storage()?.setItem(PREF_PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: preferences are a convenience only.
    }
  },
};

export const sessionStore: SessionStore = {
  list() {
    const s = storage();
    if (!s) return [];
    const out: Session[] = [];
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (!key?.startsWith(SESSION_PREFIX)) continue;
      try {
        const read = readSession(JSON.parse(s.getItem(key) ?? 'null'));
        if (read) out.push(read);
      } catch {
        // A damaged entry: skip it.
      }
    }
    return out;
  },
  get(id) {
    try {
      return readSession(JSON.parse(storage()?.getItem(SESSION_PREFIX + id) ?? 'null')) ?? undefined;
    } catch {
      return undefined;
    }
  },
  put(session) {
    try {
      storage()?.setItem(SESSION_PREFIX + session.id, JSON.stringify(session));
    } catch (e) {
      console.warn('Could not save the session', e);
    }
  },
  remove(id) {
    storage()?.removeItem(SESSION_PREFIX + id);
  },
};

/** A fresh id from the phone's secure random source. */
export function freshId(bytes = 8): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** What a game's screens use to put a new game in a session (PLT-016). */
export const sessionPicker: SessionPicker = {
  question(now) {
    return sessionQuestion(sessionStore.list(), gameStore.list(), now);
  },
  create(name, now) {
    const session: Session = { format: SESSION_FORMAT, id: freshId(), name: name.trim(), createdAt: now, settlements: [] };
    sessionStore.put(session);
    return session;
  },
  recent(now, limit) {
    return recentUnsettledSessions(sessionStore.list(), gameStore.list(), now, limit);
  },
};

/** A small keyed store under one prefix of this app's keys. */
function keyed(prefix: string): Preferences {
  return {
    get<T>(key: string, fallback: T): T {
      try {
        const raw = storage()?.getItem(prefix + key);
        return raw == null ? fallback : (JSON.parse(raw) as T);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        storage()?.setItem(prefix + key, JSON.stringify(value));
      } catch {
        // Storage full or blocked: screen state is a convenience only.
      }
    },
  };
}

/** Impostor's screen state that is not a move (the paused timer, when the summary was shown): `pgn.impostor-ui.<id>`. */
export const impostorUi: Preferences = keyed(`${KEY_ROOT}impostor-ui.`);

/**
 * IMP-064, Test hooks item 3: `localStorage['pgn.test.seeds']`, read only at a new Impostor evening's first "Start
 * round". The release build (`npm run build -- --mode release`, the families' link) never uses it.
 */
export const IS_RELEASE = import.meta.env.MODE === 'release';
export function testSeedsRaw(): string | null {
  if (IS_RELEASE) return null;
  try {
    return storage()?.getItem('pgn.test.seeds') ?? null;
  } catch {
    return null;
  }
}
