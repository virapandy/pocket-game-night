// Game nights when the app opens: SWD-063 (the 12-hour limit) and SWD-048 (opening straight on game over or on a summary
// not yet left).
import type { Preferences, SavedGameStore } from '../../../../engine';
import { loadNight, readUi, recordMoves, type Night } from '../turn/store';

const TWELVE_HOURS = 12 * 3600_000;

/**
 * SWD-063: every unfinished game night whose last move is more than 12 hours old ends: `endGame` (if a game is in
 * progress) and `endEvening`, both at the last move + 12 hours. A pending "Game ended" or summary is recorded the same way.
 */
export function sweepNights(store: SavedGameStore, ui: Preferences, now: number): void {
  for (const g of store.list()) {
    if (g.gameType !== 'secret-words' || g.status !== 'in-progress') continue;
    const match = loadNight(g);
    if (!match || match.state.ended) continue;
    const last = match.records[match.records.length - 1]?.at ?? g.createdAt;
    if (now - last <= TWELVE_HOURS) continue;
    const game = match.state.game;
    const mid = !!game && game.step !== 'over';
    const at = last + TWELVE_HOURS;
    const r = recordMoves(store, g as Night, match, mid ? [{ type: 'endGame' }, { type: 'endEvening' }] : [{ type: 'endEvening' }], at);
    if (r) {
      const cur = readUi(ui, g.id);
      ui.set(g.id, { ...cur, step: undefined, showing: false });
    }
  }
}

/**
 * SWD-048: the game night the app opens on: one at game over, or with a pending "Game ended" or summary (a summary whose
 * end was recorded as the app was hidden or reloaded shows again, without "Oops, keep playing"), that was not left with
 * "← Home" (newest first); null otherwise.
 */
export function nightToOpen(store: SavedGameStore, ui: Preferences): string | null {
  const list = store
    .list()
    .filter((g) => g.gameType === 'secret-words' && (g.status === 'in-progress' || g.status === 'ended'))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  for (const g of list) {
    const u = readUi(ui, g.id);
    if (u.showing === false) continue;
    const match = loadNight(g);
    if (!match) continue;
    if (match.state.ended) {
      if (u.step === 'summary' && u.showing === true) return g.id;
      continue;
    }
    const over = match.state.game?.step === 'over';
    if (u.step === 'summary' || u.step === 'game-over' || over) return g.id;
  }
  return null;
}
