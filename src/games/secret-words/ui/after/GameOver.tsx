// G1 game over (SWD-051, 054, 112 with its version 3.7 bottom bar, 128): heading and line, the whole map, near-miss and
// best clue, the tally, the next clue givers with "Swap clue givers", "Change teams, players, phones or board", "← Home",
// and a pinned bar with quiet "End for tonight" beside (or above) main "Play again".
import type { ReactNode } from 'react';
import type { Kind, SecretWordsState } from '../../rules';
import { BoardGrid, type GridCell } from '../shared/BoardGrid';
import { useViewport } from '../shared/device';
import { SwMain, useGuard } from '../shared/guard';
import { GameMenu, TeamBar, type MenuItem } from '../shared/parts';
import { bestClue, lastGame, nearMiss, overHeading, overResultLine, tallyLine } from './facts';

/** SWD-051, 093: every cell named by kind; face-down cells faded and ", not found". */
export function wholeMap(words: readonly string[], kinds: readonly Kind[], turned: readonly boolean[]): GridCell[] {
  return words.map((word, i) => ({ word, kind: kinds[i]!, ...(turned[i] ? {} : { notFound: true }) }));
}

/** The board at game over and in History (E1a): the sideways line on a narrow phone with a Full board (SWD-092). */
export function WholeBoard({ cells, columns }: { cells: readonly GridCell[]; columns: number }) {
  const vp = useViewport();
  const easy = columns === 4;
  if (vp.narrow && !easy) {
    return (
      <div className="sw-sideways">
        <p className="sw-sideways-text" data-testid="turn-sideways">
          Turn your phone sideways to see the board.
        </p>
        <p className="sw-small" data-testid="turn-sideways-hint">
          Or choose the Easy board for the next game.
        </p>
      </div>
    );
  }
  return (
    <div className={easy ? 'sw-over-board sw-over-board-easy' : 'sw-over-board'}>
      <BoardGrid cells={cells} columns={columns} locked {...(easy ? { className: 'sw-grid-easy' } : {})} />
    </div>
  );
}

export function GameOver({
  state,
  nextLine,
  larger,
  menu,
  toast,
  onSwap,
  onChange,
  onHome,
  onEndTonight,
  onPlayAgain,
}: {
  /** The evening at game over (with a pending "End the game" applied). */
  state: SecretWordsState;
  nextLine: string;
  larger: boolean;
  menu: readonly (readonly MenuItem[])[];
  toast?: ReactNode;
  onSwap: () => void;
  onChange: () => void;
  onHome: () => void;
  onEndTonight: () => void;
  onPlayAgain: () => void;
}) {
  const vp = useViewport();
  const until = useGuard('game-over');
  const g = state.game;
  if (!g) return null;
  const line = overResultLine(state);
  const near = nearMiss(state);
  const best = bestClue(lastGame(state)?.clues ?? g.clues);
  const stacked = vp.landscape || vp.width < 360 || larger;
  const columns = g.words.length === 16 ? 4 : 5;
  return (
    <div className={['sw-over', stacked ? 'sw-over-stacked' : 'sw-over-side', vp.landscape && 'sw-over-land'].filter(Boolean).join(' ')}>
      {g.winner && <TeamBar team={g.winner} />}
      <div className="sw-topbar sw-topbar-plain">
        <div className="sw-top-actions">
          <GameMenu groups={menu} />
        </div>
      </div>
      <h1 className="sw-h1" data-testid="game-heading">
        {overHeading(state)}
      </h1>
      {line && (
        <p className="sw-over-line" data-testid="result-line">
          {line}
        </p>
      )}
      <WholeBoard cells={wholeMap(g.words, g.kinds, g.turned)} columns={columns} />
      {near && (
        <p className="sw-over-line" data-testid="near-miss">
          {near}
        </p>
      )}
      {best && (
        <p className="sw-over-line" data-testid="best-clue">
          Best clue: <span className="sw-caps">{best.word}</span> {best.number} · {best.found}
        </p>
      )}
      <p className="sw-over-line sw-strong" data-testid="tally">
        {tallyLine(state)}
      </p>
      <p className="sw-over-line" data-testid="next-clue-givers">
        {nextLine}
      </p>
      <button type="button" className="sw-quiet sw-full" onClick={onSwap}>
        Swap clue givers
      </button>
      <button type="button" className="sw-quiet sw-full sw-wrap" onClick={onChange}>
        Change teams, players, phones or board
      </button>
      <button type="button" className="sw-quiet sw-full" onClick={onHome}>
        ← Home
      </button>
      <div className="sw-over-bar">
        <button type="button" className="sw-quiet sw-over-end" onClick={onEndTonight}>
          End for tonight
        </button>
        <SwMain until={until} onClick={onPlayAgain}>
          Play again
        </SwMain>
      </div>
      {toast}
    </div>
  );
}
