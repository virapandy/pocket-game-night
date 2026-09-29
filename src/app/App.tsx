import { useCallback, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { SavedGame } from '../engine';
import { games, type GameId } from './games';
import { History, isPast, unsettledSessionName, type Deleted } from './History';
import { Dialog, SessionList, SessionScreen } from './Sessions';
import { gameStore, preferences, sessionPicker } from './storage';

const TWELVE_HOURS = 12 * 3600_000;
const TIP_KEY = 'install-tip.seen';
const UNDO_MS = 5_000;

type OpenAction = 'resume' | 'end' | 'discard' | 'reuse';

type Route =
  | { name: 'home' }
  | { name: 'history' }
  | { name: 'past'; id: string }
  | { name: 'sessions' }
  | { name: 'session'; id: string }
  | { name: 'game'; gameId: GameId; open?: { id: string; action: OpenAction } };

const gameOf = (type: string) => games.find((g) => g.info.id === type);

/** History, Sessions and past games keep their place in the address, so a reload stays there (PLT-010). */
function routeFromAddress(): Route {
  const h = typeof location === 'undefined' ? '' : decodeURIComponent(location.hash.slice(1));
  if (h === 'history') return { name: 'history' };
  if (h === 'sessions') return { name: 'sessions' };
  if (h.startsWith('session/')) return { name: 'session', id: h.slice(8) };
  if (h.startsWith('past/')) return { name: 'past', id: h.slice(5) };
  return { name: 'home' };
}

function addressOf(route: Route): string {
  switch (route.name) {
    case 'history':
    case 'sessions':
      return route.name;
    case 'session':
      return `session/${route.id}`;
    case 'past':
      return `past/${route.id}`;
    default:
      return '';
  }
}
const time = (t: number) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export function App() {
  // The service worker saves the whole app on the first visit, so it works offline afterwards.
  // A new version waits until the host chooses to update from the home screen, never mid-game (TAM-113).
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [route, setRoute] = useState<Route>(routeFromAddress);
  const [deleted, setDeleted] = useState<Deleted | null>(null);
  useEffect(() => {
    const want = addressOf(route);
    if (decodeURIComponent(location.hash.slice(1)) === want) return;
    history.replaceState(history.state, '', want ? `#${encodeURIComponent(want).replace(/%2F/g, '/')}` : `${location.pathname}${location.search}`);
  }, [route]);
  const home = () => setRoute({ name: 'home' });
  const expire = useCallback(() => setDeleted(null), []);

  // PLT-010: "Deleted. Undo" for 5 seconds; after that the game is gone for good.
  useEffect(() => {
    if (!deleted) return;
    const t = setTimeout(expire, Math.max(0, deleted.at + UNDO_MS - Date.now()));
    return () => clearTimeout(t);
  }, [deleted, expire]);

  if (route.name === 'game') {
    const game = gameOf(route.gameId);
    if (game) {
      return (
        <game.Screen
          onExit={home}
          store={gameStore}
          prefs={preferences}
          sessions={sessionPicker}
          onSession={(id) => setRoute({ name: 'session', id })}
          {...(route.open ? { open: route.open } : {})}
        />
      );
    }
  }
  if (route.name === 'history') {
    return (
      <History
        onBack={home}
        onOpen={(id) => setRoute({ name: 'past', id })}
        deleted={deleted}
        onUndoDelete={() => {
          for (const g of deleted?.games ?? []) gameStore.put(g);
          setDeleted(null);
        }}
      />
    );
  }
  if (route.name === 'sessions') return <SessionList onBack={home} onOpen={(id) => setRoute({ name: 'session', id })} />;
  if (route.name === 'session') return <SessionScreen id={route.id} onBack={() => setRoute({ name: 'sessions' })} />;
  if (route.name === 'past') {
    const saved = gameStore.get(route.id);
    const game = saved && gameOf(saved.gameType);
    if (saved && game) {
      return (
        <game.PastGame
          saved={saved}
          onBack={() => setRoute({ name: 'history' })}
          actions={
            <PastGameActions
              saved={saved}
              onReuse={() => setRoute({ name: 'game', gameId: game.info.id as GameId, open: { id: saved.id, action: 'reuse' } })}
              onDelete={() => {
                gameStore.remove(saved.id);
                setDeleted({ games: [saved], at: Date.now() });
                setRoute({ name: 'history' });
              }}
            />
          }
        />
      );
    }
  }

  return (
    <Home
      needRefresh={needRefresh}
      onUpdate={() => void updateServiceWorker(true)}
      onGame={(gameId, open) => setRoute(open ? { name: 'game', gameId, open } : { name: 'game', gameId })}
      onHistory={() => setRoute({ name: 'history' })}
      onSessions={() => setRoute({ name: 'sessions' })}
    />
  );
}

/** PLT-009, PLT-010, PLT-025: "Use this setup" and "Delete" on a past game. Unfinished games cannot be deleted. */
function PastGameActions({ saved, onReuse, onDelete }: { saved: SavedGame; onReuse: () => void; onDelete: () => void }) {
  const [asking, setAsking] = useState<string | null>(null);
  return (
    <div className="row">
      <button type="button" className="button" onClick={onReuse}>
        Use this setup
      </button>
      {isPast(saved) && (
        <button
          type="button"
          className="button button-quiet"
          onClick={() => {
            const session = unsettledSessionName(saved);
            if (session === null) onDelete();
            else setAsking(session);
          }}
        >
          Delete
        </button>
      )}
      {asking !== null && (
        <Dialog>
          <p className="lead">
            This game is in the unsettled tally for '{asking}'. Delete it and take it out of the tally?
          </p>
          <div className="row">
            <button type="button" className="button" onClick={onDelete}>
              Delete it
            </button>
            <button type="button" className="button button-quiet" onClick={() => setAsking(null)}>
              Keep
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Home({
  needRefresh,
  onUpdate,
  onGame,
  onHistory,
  onSessions,
}: {
  needRefresh: boolean;
  onUpdate: () => void;
  onGame: (gameId: GameId, open?: { id: string; action: OpenAction }) => void;
  onHistory: () => void;
  onSessions: () => void;
}) {
  const [unfinished] = useState<SavedGame[]>(() =>
    gameStore
      .list()
      .filter((g) => (g.status === 'in-progress' || g.status === 'paused') && gameOf(g.gameType))
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
  const [now] = useState(() => Date.now());
  return (
    <main className="screen">
      {needRefresh && (
        <div className="update" role="status">
          <span>A new version is ready.</span>
          <button type="button" className="button" onClick={onUpdate}>
            Update now
          </button>
        </div>
      )}
      <InstallTip />
      <h1 className="app-title">Pocket Game Night</h1>
      <p className="lead">Pick a game. One phone runs it; the fun stays in the room.</p>

      {unfinished.length > 0 && (
        <section aria-labelledby="unfinished-title" className="stack-tight">
          <h2 id="unfinished-title" className="section-title">
            Unfinished games
          </h2>
          <ul className="unfinished" data-testid="unfinished-games">
            {unfinished.map((g) => {
              const game = gameOf(g.gameType)!;
              const d = game.describe(g);
              const id = game.info.id as GameId;
              const stale = now - g.updatedAt > TWELVE_HOURS;
              return (
                <li key={g.id} className="unfinished-row">
                  <p className="unfinished-line">
                    {game.info.title}, {time(g.createdAt)}, {d.calls} {d.calls === 1 ? 'number' : 'numbers'} called
                  </p>
                  {stale ? (
                    <>
                      <p className="note">Left more than 12 hours ago. What should happen to it?</p>
                      <div className="row">
                        <button type="button" className="button" onClick={() => onGame(id, { id: g.id, action: 'resume' })}>
                          Resume
                        </button>
                        <button type="button" className="button button-quiet" onClick={() => onGame(id, { id: g.id, action: 'end' })}>
                          End it (with payouts so far)
                        </button>
                        <button type="button" className="button button-quiet" onClick={() => onGame(id, { id: g.id, action: 'discard' })}>
                          Discard it…
                        </button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="button" onClick={() => onGame(id, { id: g.id, action: 'resume' })}>
                      Tap to resume
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ul className="game-list">
        {games.map((g) => (
          <li key={g.info.id}>
            <button type="button" className="game-card" onClick={() => onGame(g.info.id)}>
              <span className="game-card-title">{g.info.title}</span>
              <span className="game-card-tagline">{g.info.tagline}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="row">
        <button type="button" className="button button-quiet grow" onClick={onSessions}>
          Sessions
        </button>
        <button type="button" className="button button-quiet grow" onClick={onHistory}>
          History
        </button>
      </div>
    </main>
  );
}

/** TAM-118: a one-time tip for iPhone hosts who have not added the app to the home screen. */
function InstallTip() {
  const [show, setShow] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    const iPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone =
      (navigator as unknown as { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
    return iPhone && !standalone && !preferences.get(TIP_KEY, false);
  });
  if (!show) return null;
  return (
    <aside className="tip" data-testid="install-tip">
      <p>
        Tip: tap Share, then Add to Home Screen, to open this app like any other.
      </p>
      <p>Games saved in Safari and in the Home Screen app are kept separate. The Home Screen app keeps them more reliably.</p>
      <button
        type="button"
        className="button"
        onClick={() => {
          preferences.set(TIP_KEY, true);
          setShow(false);
        }}
      >
        Got it
      </button>
    </aside>
  );
}

