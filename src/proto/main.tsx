// Entry of the tap-through prototype page (preview only; vite.config.ts leaves it out of the families' release build).
// The game comes from the address: <base>proto/<game>/. The maps are read from docs/games/<game>/screen-map.md at
// build time (the virtual module in vite.config.ts).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import maps from 'virtual:screen-maps';
import { parseScreenMap } from './parse';
import { Proto } from './Proto';
import './proto.css';

const after = location.pathname.slice(location.pathname.indexOf('/proto/') + 7);
const game = decodeURIComponent(after.split('/')[0] ?? '');
const text = maps[game];

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(
  <StrictMode>
    {text !== undefined ? (
      <Proto game={game} map={parseScreenMap(text)} />
    ) : (
      <main className="proto-index">
        <h1>Prototypes</h1>
        <p>{game ? `No screen map for "${game}".` : 'Pick a game:'}</p>
        <ul>
          {Object.keys(maps).map((g) => (
            <li key={g}>
              <a href={`${import.meta.env.BASE_URL}proto/${g}/`}>{g}</a>
            </li>
          ))}
        </ul>
      </main>
    )}
  </StrictMode>,
);
