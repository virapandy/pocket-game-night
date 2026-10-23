// One Secret Words game night on this phone, for the turn screens: the engine's SavedGame replayed into a match, moves
// recorded and saved at once (PLT-003), and the screen state `pgn.secretWords-ui.<id>` (SWD-048).
import {
  HOST, play, replay, SAVED_GAME_FORMAT, type Match, type Preferences, type SavedGame, type SavedGameStore,
} from '../../../../engine';
import { secretWordsRules, type SecretWordsConfig, type SecretWordsMove, type SecretWordsState, type Team } from '../../rules';

export type Night = SavedGame<SecretWordsConfig, SecretWordsMove>;
export type NightMatch = Match<SecretWordsConfig, SecretWordsState, SecretWordsMove>;

/**
 * SWD-048: the screen state that is not a move. `step` names the step when the moves alone can't tell it ('preview',
 * 'scan', 'map', 'end-turn', 'game-over', 'summary'); other values are informative only.
 */
export interface SwUiState {
  readonly step?: string;
  readonly angles?: { readonly orange: 0 | 180; readonly teal: 0 | 180 };
  readonly paused?: boolean;
  readonly pickerOverride?: string | null;
  /** SWD-102 v3.7: the evening's first flip has shown its toast. */
  readonly flipped?: boolean;
}

export function readUi(ui: Preferences, id: string): SwUiState {
  const v = ui.get<SwUiState | null>(id, null);
  return v && typeof v === 'object' ? v : {};
}

export function writeUi(ui: Preferences, id: string, patch: Partial<SwUiState>): SwUiState {
  const next = { angles: { orange: 0, teal: 0 }, paused: false, pickerOverride: null, ...readUi(ui, id), ...patch } as SwUiState;
  ui.set(id, next);
  return next;
}

/** Replays a saved game night; null when it can't be replayed. */
export function loadNight(saved: SavedGame | undefined): NightMatch | null {
  if (!saved || saved.gameType !== 'secret-words') return null;
  try {
    const r = replay(secretWordsRules, saved.setup as Night['setup'], saved.records as Night['records']);
    return r.ok ? r.value : null;
  } catch {
    return null;
  }
}

function toSaved(prev: SavedGame, match: NightMatch, now: number): Night {
  return {
    format: SAVED_GAME_FORMAT,
    gameType: 'secret-words',
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: now,
    status: match.state.ended ? 'ended' : 'in-progress',
    setup: match.setup,
    records: match.records,
    ...(prev.sessionId !== undefined ? { sessionId: prev.sessionId } : {}),
    ...(prev.settlementId !== undefined ? { settlementId: prev.settlementId } : {}),
  };
}

/** Records moves by the host, in order, and saves once (PLT-003). Null when the rules refuse any of them. */
export function recordMoves(store: SavedGameStore, saved: SavedGame, match: NightMatch, moves: readonly SecretWordsMove[]): { saved: Night; match: NightMatch } | null {
  let m = match;
  const last = m.records[m.records.length - 1];
  const at = Math.max(Date.now(), last?.at ?? 0);
  for (const move of moves) {
    const r = play(secretWordsRules, m, move, { by: HOST, at });
    if (!r.ok) return null;
    m = r.value;
  }
  const next = toSaved(saved, m, at);
  store.put(next);
  return { saved: next, match: m };
}

export const otherTeam = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');
