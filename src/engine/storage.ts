// Interfaces for keeping games and preferences on the host phone. The app implements them
// (browser storage); games only see these shapes, so they never touch storage directly.
import type { SavedGame } from './saved-game';

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
