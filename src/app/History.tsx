// History (PLT-007 to PLT-013, PLT-025): past games, newest first, kept only on this phone; deleting a past
// game with undo for 5 seconds, clearing all history, and the tally a deleted game is taken out of.
import { useEffect, useState } from 'react';
import { inTally, type SavedGame } from '../engine';
import { mafia } from '../games/mafia';
import { games, secretWords } from './games';
import { asTallyGame, Dialog } from './Sessions';
import { gameStore, sessionStore } from './storage';

const gameOf = (type: string) => games.find((g) => g.info.id === type);
const dateTime = (t: number) =>
  new Date(t).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

export const isPast = (g: SavedGame) => g.status === 'ended' || g.status === 'abandoned';

/** The session whose unsettled tally holds this game, if any (PLT-025). */
export function unsettledSessionName(g: SavedGame): string | null {
  if (!inTally(asTallyGame(g))) return null;
  return sessionStore.get(g.sessionId!)?.name ?? null;
}

/** Deleted games kept in memory for 5 seconds, so "Undo" can bring them back (PLT-010). */
export interface Deleted {
  readonly games: readonly SavedGame[];
  readonly at: number;
}

export function History({
  onBack,
  backLabel = '← Home',
  onOpen,
  onOpenMafia,
  deleted,
  onUndoDelete,
}: {
  onBack: () => void;
  /** "← Home", or "← Back" when opened from a game's menu (IMP-075). */
  backLabel?: string;
  onOpen: (id: string) => void;
  /** MAF-093: a past Mafia game (its game night's id and its index there). */
  onOpenMafia: (id: string, game: number) => void;
  deleted: Deleted | null;
  onUndoDelete: () => void;
}) {
  const load = () =>
    gameStore
      .list()
      .filter((g) => isPast(g) && (gameOf(g.gameType) || (secretWords.isNight(g) && secretWords.historyTitle(g) !== null)))
      .sort((a, b) => b.createdAt - a.createdAt);
  // IMP-094: games that list an evening in progress as one row ("In progress"); never deleted from here.
  const [inProgress] = useState<SavedGame[]>(() =>
    gameStore
      .list()
      .filter((g) => g.status === 'in-progress' && (gameOf(g.gameType) as { listsInProgress?: boolean } | undefined)?.listsInProgress)
      .sort((a, b) => b.createdAt - a.createdAt),
  );
  const [past, setPast] = useState<SavedGame[]>(load);
  // MAF-093: Mafia lists each game that is over, from game nights finished or still going.
  const loadMafia = () => gameStore.list().flatMap((g) => mafia.historyRows(g));
  const [mafiaRows, setMafiaRows] = useState(loadMafia);
  /** Past games newest first, Mafia's games (each at its own start time) among them. */
  const entries: ({ kind: 'saved'; g: SavedGame; at: number } | { kind: 'mafia'; row: (typeof mafiaRows)[number]; at: number })[] = [
    ...past.map((g) => ({ kind: 'saved' as const, g, at: g.createdAt })),
    ...mafiaRows.map((row) => ({ kind: 'mafia' as const, row, at: row.at })),
  ].sort((a, b) => b.at - a.at);
  /** Mafia rows "Clear all history" deletes: those of game nights that have ended (one still going is kept). */
  const mafiaClear = mafiaRows.filter((r) => r.ended);
  const total = past.length + mafiaClear.length;
  const [nearlyFull, setNearlyFull] = useState(false);
  const [clearing, setClearing] = useState(false);
  useEffect(() => {
    let live = true;
    navigator.storage
      ?.estimate?.()
      .then(({ usage, quota }) => {
        if (live && usage !== undefined && quota) setNearlyFull(usage / quota >= 0.9);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const unsettled = past.filter((g) => unsettledSessionName(g) !== null).length;
  const clearAll = () => {
    for (const g of past) gameStore.remove(g.id);
    for (const id of new Set(mafiaClear.map((r) => r.id))) gameStore.remove(id);
    // Sessions left with no games at all go too.
    const left = new Set(gameStore.list().map((g) => g.sessionId));
    for (const s of sessionStore.list()) if (!left.has(s.id)) sessionStore.remove(s.id);
    setClearing(false);
    setPast(load());
    setMafiaRows(loadMafia());
  };
  const sessionName = (g: SavedGame) => (g.sessionId ? sessionStore.get(g.sessionId)?.name : undefined);

  return (
    <main className="screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          {backLabel}
        </button>
      </header>
      <h1 className="step-title">History</h1>
      <p className="note">Past games are kept only on this phone, and are lost if the app's data is cleared.</p>
      {deleted && (
        <div className="banner" role="status">
          <p>Deleted.</p>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => {
              onUndoDelete();
              setPast(load());
            }}
          >
            Undo
          </button>
        </div>
      )}
      {nearlyFull && (
        <div className="banner" role="status">
          <p>Storage is nearly full on this phone. Nothing is deleted unless you choose.</p>
          <button
            type="button"
            className="button"
            disabled={past.length === 0}
            onClick={() => {
              const oldest = past[past.length - 1];
              if (oldest) gameStore.remove(oldest.id);
              setPast(load());
            }}
          >
            Delete the oldest game
          </button>
        </div>
      )}
      {past.length === 0 && inProgress.length === 0 && mafiaRows.length === 0 ? (
        <p className="lead">No finished games yet.</p>
      ) : (
        <ul className="history-list">
          {[...inProgress.map((g) => ({ kind: 'saved' as const, g, at: g.createdAt })), ...entries].map((e) => {
            if (e.kind === 'mafia') {
              const r = e.row;
              return (
                <li key={r.key}>
                  <button type="button" className="history-row" data-testid="history-game" onClick={() => onOpenMafia(r.id, r.game)}>
                    <span className="history-title">{r.text}</span>
                  </button>
                </li>
              );
            }
            const g = e.g;
            const session = sessionName(g);
            if (secretWords.isNight(g)) {
              // SWD-064: "Secret Words · 3 games".
              return (
                <li key={g.id}>
                  <button type="button" className="history-row" data-testid="history-game" onClick={() => onOpen(g.id)}>
                    <span className="history-title">{secretWords.historyTitle(g)}</span>
                    <span>
                      {dateTime(g.createdAt)}
                      {session ? ` · ${session}` : ''}
                    </span>
                  </button>
                </li>
              );
            }
            const game = gameOf(g.gameType)!;
            const d = game.describe(g);
            return (
              <li key={g.id}>
                <button type="button" className="history-row" data-testid="history-game" onClick={() => onOpen(g.id)}>
                  <span className="history-title">{'rounds' in d ? `${game.info.title} · ${d.result}` : game.info.title}</span>
                  <span>
                    {dateTime(g.createdAt)}
                    {session ? ` · ${session}` : ''}
                  </span>
                  <span>
                    {d.players} {d.players === 1 ? 'player' : 'players'}
                    {'calls' in d ? ` · ${d.calls} ${d.calls === 1 ? 'number' : 'numbers'} called` : ''}
                  </span>
                  {/* Games counted in rounds already show it in the title. */}
                  {!('rounds' in d) && (
                    <span className="history-result">
                      {d.result}
                      {g.settlementId ? ' · Settled' : ''}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {total > 0 && (
        <button type="button" className="button button-quiet" onClick={() => setClearing(true)}>
          Clear all history
        </button>
      )}
      {clearing && (
        <Dialog>
          <p className="lead">
            {total === 1 ? 'Delete the past game' : `Delete all ${total} past games`} from this phone? This can't be undone.
          </p>
          {unsettled > 0 && (
            <p className="note">
              {total === 1
                ? "It's in an unsettled tally, and will be taken out of it."
                : unsettled === 1
                  ? '1 of them is in an unsettled tally, and will be taken out of it.'
                  : `${unsettled} of them are in unsettled tallies, and will be taken out of them.`}
            </p>
          )}
          <p className="note">Games in progress are kept.</p>
          {/* PLT-301: a destructive action is never the main button; "Keep" is. */}
          <div className="row">
            <button type="button" className="button button-quiet" onClick={clearAll}>
              {total === 1 ? 'Delete' : 'Delete all'}
            </button>
            <button type="button" className="button" onClick={() => setClearing(false)}>
              Keep
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
