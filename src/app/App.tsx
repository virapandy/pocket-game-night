import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { games, type GameId } from './games';

export function App() {
  // The service worker saves the whole app on the first visit, so it works offline afterwards.
  // A new version waits until the host chooses to update from the home screen, never mid-game.
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [open, setOpen] = useState<GameId | null>(null);

  const game = games.find((g) => g.info.id === open);
  if (game) return <game.Screen onExit={() => setOpen(null)} />;

  return (
    <main className="screen">
      {needRefresh && (
        <div className="update" role="status">
          <span>A new version is ready.</span>
          <button type="button" className="button" onClick={() => void updateServiceWorker(true)}>
            Update now
          </button>
        </div>
      )}
      <h1 className="app-title">Pocket Game Night</h1>
      <p className="lead">Pick a game. One phone runs it; the fun stays in the room.</p>
      <ul className="game-list">
        {games.map((g) => (
          <li key={g.info.id}>
            <button type="button" className="game-card" onClick={() => setOpen(g.info.id)}>
              <span className="game-card-title">{g.info.title}</span>
              <span className="game-card-tagline">{g.info.tagline}</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
