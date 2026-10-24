// MAF-093: one past Mafia game, opened from its History row: its result, "Who was who" and what happened each night, with
// quiet "← Back" (to History) and main "Play again" (Who's playing? with its players). Read from the saved game night.
import type { SavedGame } from '../../../engine';
import { BlocksRoot, QuietButton, Screen, ScreenContent } from '../../../blocks';
import { readMafiaNight, type MafiaNightGame } from '../rules';
import { D } from './dayText';
import { Main } from './parts';
import { nightLine } from './Results';
import { T } from './text';
import './mafia.css';

function statusOf(g: MafiaNightGame, p: string): string {
  const night = g.nights.find((n) => n.out === p);
  if (night) return D.g1.outNight(night.night);
  const vote = g.votes.find((v) => v.out === p);
  if (vote) return D.g1.votedOut(vote.day);
  return g.left.some((l) => l.player === p) ? D.g1.left : D.g1.inToEnd;
}

export function PastGame({
  saved,
  game,
  onBack,
  onPlayAgain,
}: {
  saved: SavedGame;
  /** The game's index k in its game night. */
  game: number;
  onBack: () => void;
  /** Who's playing? with the game's players (those who didn't leave), in seat order. */
  onPlayAgain: (names: string[]) => void;
}) {
  const g0 = readMafiaNight(saved)?.games[game - 1];
  const g = g0?.over ? g0 : undefined;
  const title = !g ? D.history.ended : g.winner === 'village' ? D.g1.village : g.winner === 'mafia' ? D.g1.mafia : D.g1.none;
  return (
    <BlocksRoot className="maf">
      <Screen className="maf-past" page>
        <ScreenContent>
          <QuietButton className="maf-back" onClick={onBack}>
            {T.s1.back}
          </QuietButton>
          <div className="maf-column maf-results">
            <h1 className="pgn-title">{title}</h1>
            {g && (
              <>
                <h2 className="maf-subtitle">{D.g1.whoWasWho}</h2>
                <ul className="maf-who-list">
                  {g.players.map((p) => {
                    const r = g.roles[p];
                    return <li key={p}>{r ? D.g1.row(p, r, statusOf(g, p)) : p}</li>;
                  })}
                </ul>
                {g.nights.length > 0 && (
                  <>
                    <h2 className="maf-subtitle">{D.g1.each}</h2>
                    <ul className="maf-night-lines">
                      {g.nights.map((n) => (
                        <li key={n.night}>{nightLine(g, n)}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
          {g && <Main onClick={() => onPlayAgain(g.players.filter((p) => !g.left.some((l) => l.player === p)))}>{D.g1.again}</Main>}
        </ScreenContent>
      </Screen>
    </BlocksRoot>
  );
}
