// Entry of the tap-through prototype page (preview only; vite.config.ts leaves it out of the families' release build).
// The game comes from the address: <base>proto/<game>/. The maps are read from docs/games/<game>/screen-map.md at
// build time (the virtual module in vite.config.ts). A map with a prototype script (section K) is drawn one real phone
// screen per state in a phone-sized frame (Frame, then Play inside it, "?frame=1"); a map without one as before (Proto).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import maps, { scenarios } from 'virtual:screen-maps';
import { parseScreenMap } from './parse';
import { parseScript } from './script';
import { Proto } from './Proto';
import { Frame } from './Frame';
import { Play } from './Play';
import './proto.css';

const after = location.pathname.slice(location.pathname.indexOf('/proto/') + 7);
const game = decodeURIComponent(after.split('/')[0] ?? '');
const text = maps[game];

function page() {
  if (text === undefined) {
    return (
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
    );
  }
  const map = parseScreenMap(text);
  const script = parseScript(text, map.screens.map((s) => s.id));
  if (!script) return <Proto game={game} map={map} />;
  if (new URLSearchParams(location.search).has('frame')) {
    document.documentElement.classList.add('proto-in-frame');
    return <Play map={map} script={script} scenarios={scenarios[game] ?? ''} />;
  }
  document.documentElement.classList.add('proto-outer');
  return <Frame game={game} map={map} />;
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(<StrictMode>{page()}</StrictMode>);
