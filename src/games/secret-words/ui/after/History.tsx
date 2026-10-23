// E1 a game night in History and E1a one game (SWD-064): the game rows, then a game's board with the whole map and every
// clue in force. Read from the saved moves (engine SavedGame format 2), so old game nights always open.
import { useState } from 'react';
import type { SavedGame } from '../../../../engine';
import { BlocksRoot } from '../../../../blocks';
import { loadNight, type Night } from '../turn/store';
import { eveningTitle, gameRow, gameTitle, playedGames, clueNumber } from './facts';
import { wholeMap, WholeBoard } from './GameOver';
import '../shared/sw.css';
import './after.css';

/** History's evening row title ("Secret Words · 3 games"), or null when the game night no longer replays. */
export function historyTitle(saved: SavedGame): string | null {
  const m = loadNight(saved);
  return m ? eveningTitle(m.state.games.length) : null;
}

export function PastNight({ saved, onBack }: { saved: SavedGame; onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const match = loadNight(saved as Night);
  if (!match) return null;
  const names = match.state.teams.names;
  const played = playedGames(match.setup, match.records);
  const game = open === null ? null : played[open];
  return (
    <BlocksRoot className="sw">
      <div className="sw pgn">
        <div className="sw-page sw-history-page">
          <div className="sw-topbar">
            <button type="button" className="sw-quiet" onClick={game ? () => setOpen(null) : onBack}>
              ← Back
            </button>
          </div>
          {game ? (
            <>
              <h1 className="sw-h1">{gameTitle(game.past, names)}</h1>
              <WholeBoard cells={wholeMap(game.words, game.kinds, game.turned)} columns={game.words.length === 16 ? 4 : 5} />
              <p data-testid="history-clues">
                Clues:{' '}
                {game.past.clues.map((c, i) => (
                  <span key={i}>
                    {i > 0 && ' · '}
                    {names[c.team]}{' '}
                    {c.word && (
                      <>
                        <span className="sw-caps">{c.word}</span>{' '}
                      </>
                    )}
                    {clueNumber(c.n)}
                  </span>
                ))}
              </p>
            </>
          ) : (
            <>
              <h1 className="sw-h1">{eveningTitle(played.length)}</h1>
              <ul className="sw-history-rounds">
                {played.map((g, i) => (
                  <li key={i}>
                    <button type="button" className="sw-quiet sw-full sw-wrap sw-history-round" data-testid="history-round" onClick={() => setOpen(i)}>
                      {gameRow(g.past, names)}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </BlocksRoot>
  );
}
