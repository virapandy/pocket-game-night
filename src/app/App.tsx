import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { SavedGame } from '../engine';
import { games, type GameId } from './games';
import { gameStore, preferences } from './storage';

const TWELVE_HOURS = 12 * 3600_000;
const TIP_KEY = 'install-tip.seen';

type Route =
  | { name: 'home' }
  | { name: 'history' }
  | { name: 'past'; id: string }
  | { name: 'game'; gameId: GameId; open?: { id: string; action: 'resume' | 'end' | 'discard' } };

const gameOf = (type: string) => games.find((g) => g.info.id === type);
const time = (t: number) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const dateTime = (t: number) =>
  new Date(t).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

export function App() {
  // The service worker saves the whole app on the first visit, so it works offline afterwards.
  // A new version waits until the host chooses to update from the home screen, never mid-game (TAM-113).
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const home = () => setRoute({ name: 'home' });

  if (route.name === 'game') {
    const game = gameOf(route.gameId);
    if (game) {
      return <game.Screen onExit={home} store={gameStore} prefs={preferences} {...(route.open ? { open: route.open } : {})} />;
    }
  }
  if (route.name === 'history') return <History onBack={home} onOpen={(id) => setRoute({ name: 'past', id })} />;
  if (route.name === 'past') {
    const saved = gameStore.get(route.id);
    const game = saved && gameOf(saved.gameType);
    if (saved && game) return <game.PastGame saved={saved} onBack={() => setRoute({ name: 'history' })} />;
  }

  return (
    <Home
      needRefresh={needRefresh}
      onUpdate={() => void updateServiceWorker(true)}
      onGame={(gameId, open) => setRoute(open ? { name: 'game', gameId, open } : { name: 'game', gameId })}
      onHistory={() => setRoute({ name: 'history' })}
    />
  );
}

function Home({
  needRefresh,
  onUpdate,
  onGame,
  onHistory,
}: {
  needRefresh: boolean;
  onUpdate: () => void;
  onGame: (gameId: GameId, open?: { id: string; action: 'resume' | 'end' | 'discard' }) => void;
  onHistory: () => void;
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
      <button type="button" className="button button-quiet" onClick={onHistory}>
        History
      </button>
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

/** PLT-007, PLT-008, PLT-012, PLT-013: past games, newest first, kept only on this phone. */
function History({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
  const load = () =>
    gameStore
      .list()
      .filter((g) => (g.status === 'ended' || g.status === 'abandoned') && gameOf(g.gameType))
      .sort((a, b) => b.createdAt - a.createdAt);
  const [past, setPast] = useState<SavedGame[]>(load);
  const [nearlyFull, setNearlyFull] = useState(false);
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

  return (
    <main className="screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Home
        </button>
      </header>
      <h1 className="step-title">History</h1>
      <p className="note">Past games are kept only on this phone, and are lost if the app's data is cleared.</p>
      {nearlyFull && (
        <div className="banner" role="status">
          <p>This phone's storage for the app is nearly full. Nothing is deleted unless you choose.</p>
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
      {past.length === 0 ? (
        <p className="lead">No finished games yet.</p>
      ) : (
        <ul className="history-list">
          {past.map((g) => {
            const game = gameOf(g.gameType)!;
            const d = game.describe(g);
            return (
              <li key={g.id}>
                <button type="button" className="history-row" data-testid="history-game" onClick={() => onOpen(g.id)}>
                  <span className="history-title">{game.info.title}</span>
                  <span>{dateTime(g.createdAt)}</span>
                  <span>
                    {d.players} {d.players === 1 ? 'player' : 'players'} · {d.calls} {d.calls === 1 ? 'number' : 'numbers'} called
                  </span>
                  <span className="history-result">{d.result}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
