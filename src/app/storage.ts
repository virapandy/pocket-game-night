// Browser storage for games and preferences: everything stays on this phone (PLT-012, PLT-013).
// Every change is written at once (PLT-003). A damaged entry is skipped, so it never stops the app opening.
import { readSavedGame, type Preferences, type SavedGame, type SavedGameStore } from '../engine';

const GAME_PREFIX = 'pgn.game.';
const PREF_PREFIX = 'pgn.pref.';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

let askedToKeepData = false;

/** PLT-013: ask the browser to keep the app's data, when the first game starts. */
function keepData() {
  if (askedToKeepData) return;
  askedToKeepData = true;
  try {
    void navigator.storage?.persist?.().catch(() => {});
  } catch {
    // Not supported: nothing to do.
  }
}

export const gameStore: SavedGameStore = {
  list() {
    const s = storage();
    if (!s) return [];
    const games: SavedGame[] = [];
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (!key?.startsWith(GAME_PREFIX)) continue;
      try {
        const read = readSavedGame(JSON.parse(s.getItem(key) ?? 'null'));
        if (read.ok) games.push(read.game);
      } catch {
        // A damaged entry: skip it.
      }
    }
    return games;
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
    if (game.records.length === 0) keepData();
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
