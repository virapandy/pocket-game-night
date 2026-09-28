// Turning a saved Tambola game into a live match and back, plus the words used about it.
import { replay, SAVED_GAME_FORMAT, type GameStatus, type Match, type SavedGame } from '../../../engine';
import { PATTERN_NAMES, tambolaRules, type TambolaConfig, type TambolaMove, type TambolaState } from '../rules';

export type TambolaMatch = Match<TambolaConfig, TambolaState, TambolaMove>;
export type TambolaSaved = SavedGame<TambolaConfig, TambolaMove>;

/** Replays a saved game from its setup and moves (TAM-073). Null if it cannot be replayed. */
export function loadMatch(saved: SavedGame): TambolaMatch | null {
  if (saved.gameType !== 'tambola') return null;
  try {
    const r = replay(tambolaRules, (saved as TambolaSaved).setup, (saved as TambolaSaved).records);
    return r.ok ? r.value : null;
  } catch {
    return null;
  }
}

/** The saved form of a match, with its status and, once over, what each person paid and won. */
export function toSaved(prev: TambolaSaved, match: TambolaMatch, now: number, status?: GameStatus): TambolaSaved {
  const view = tambolaRules.view(match.state, { kind: 'host' });
  const derived: GameStatus = match.state.result === 'ended' ? 'ended' : match.state.result === 'discarded' ? 'abandoned' : 'in-progress';
  const next: TambolaSaved = {
    format: SAVED_GAME_FORMAT,
    gameType: 'tambola',
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: now,
    status: match.state.result ? derived : (status ?? derived),
    setup: match.setup,
    records: match.records,
  };
  return view.summary?.money ? { ...next, money: view.summary.money } : next;
}

export function newSaved(id: string, setup: TambolaMatch['setup'], now: number): TambolaSaved {
  return { format: SAVED_GAME_FORMAT, gameType: 'tambola', id, createdAt: now, updatedAt: now, status: 'in-progress', setup, records: [] };
}

/** One line about a saved game, for the home list and History (PLT-002, PLT-007). */
export function describeGame(saved: SavedGame): { players: number; calls: number; result: string } {
  const match = loadMatch(saved);
  const players = (saved as TambolaSaved).setup?.config?.players?.length ?? 0;
  if (!match) return { players, calls: 0, result: 'Could not be opened' };
  const view = tambolaRules.view(match.state, { kind: 'host' });
  let result = 'In progress';
  if (saved.status === 'paused') result = 'Paused';
  if (match.state.result === 'discarded') result = 'Abandoned';
  if (match.state.result === 'ended') {
    const last = [...(view.summary?.tiers ?? [])].reverse().find((t) => t.winners.length > 0);
    const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;
    result = last ? `${PATTERN_NAMES[last.pattern]}: ${[...new Set(last.winners.map((w) => name(w.playerId)))].join(', ')}` : 'Ended, no prize won';
  }
  return { players, calls: view.called.length, result };
}
