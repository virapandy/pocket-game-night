// Interfaces for keeping games and preferences on the host phone. The app implements them
// (browser storage); games only see these shapes, so they never touch storage directly.
import type { SavedGame } from './saved-game';
import type { Session, SessionQuestion } from './session';

export interface SavedGameStore {
  /** Every saved game that can be read. A damaged one is skipped, never fatal. */
  list(): SavedGame[];
  get(id: string): SavedGame | undefined;
  /** Saves at once (PLT-003). */
  put(game: SavedGame): void;
  remove(id: string): void;
}

/** Small settings kept on this phone, such as house rules for the next game or names used before. */
export interface Preferences {
  get<T>(key: string, fallback: T): T;
  set(key: string, value: unknown): void;
}

/** Sessions kept on this phone (PLT-016, PLT-022). */
export interface SessionStore {
  list(): Session[];
  get(id: string): Session | undefined;
  put(session: Session): void;
  remove(id: string): void;
}

/** What a game's screens need to put a new game in a session (PLT-016). */
export interface SessionPicker {
  /** What to ask before a game starts now. */
  question(now: number): SessionQuestion;
  /** Makes a new session with this name; returns it. */
  create(name: string, now: number): Session;
}

/** Preference key for dark mode (TAM-134, TAM-188): remembered on this phone, for every game. */
export const DARK_MODE_PREF = 'app.dark-mode';
