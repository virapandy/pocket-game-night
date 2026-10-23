// The board screens' layout (Terms "Board screens"): the preview (SWD-012), guessing (SWD-041), the end-turn line
// (SWD-044) and turn over (SWD-045). Portrait: SWD-041's column and its 360 × 640 budget; landscape: SWD-091's grid at
// the left and the 200 px (812 × 375) or 160 px (568 × 320) panel; narrow portrait: SWD-092.
import type { ReactNode } from 'react';
import type { Team } from '../../rules';
import { BoardGrid, type GridCell } from '../shared/BoardGrid';
import { useViewport } from '../shared/device';
import { SwMain } from '../shared/guard';
import { TeamBar, WordCounts, type MenuItem } from '../shared/parts';
import { useShrinkToFit } from '../shared/shrink';
import { HurryTimer, TopActions, type TimerState } from './chrome';

export interface BoardMain {
  /** Line 1 in the landscape panels (the picker's name), and its text before " " in portrait. */
  readonly line1?: ReactNode;
  readonly line2: ReactNode;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly until: number;
  readonly onClick: () => void;
}

export interface BoardActions {
  /** Until the first reveal: "Change clue" and "Clue not allowed?". */
  readonly change?: () => void;
  readonly dispute?: () => void;
  /** From the first reveal: "End our turn". */
  readonly endTurn?: () => void;
  /** The end-turn line: "Oops, keep guessing". */
  readonly oops?: () => void;
}

export function BoardScreen({
  team,
  heading,
  turnLine,
  poker,
  clueLine,
  guessLine,
  history,
  counts,
  names,
  cells,
  columns,
  angle,
  picked,
  locked,
  turning,
  onPick,
  ignoreTaps,
  bottom,
  actions,
  main,
  timer,
  onPause,
  menu,
  onFlip,
  covered,
}: {
  team: Team | null;
  heading?: string;
  turnLine: string;
  /** The turn-line is the poker line (SWD-125): shrinks to 13 px. */
  poker?: boolean;
  clueLine?: ReactNode;
  guessLine?: string;
  history?: ReactNode;
  counts: { orange: number; teal: number };
  names: { orange: string; teal: string };
  cells: readonly GridCell[];
  columns: number;
  angle: 0 | 180;
  picked: number | null;
  locked: boolean;
  turning: readonly number[];
  onPick?: (i: number) => void;
  ignoreTaps: () => boolean;
  /** The tip or the result line (`tip` / `result-line`). */
  bottom?: { readonly id: 'tip' | 'result-line'; readonly text: string } | null;
  actions: BoardActions;
  main: BoardMain;
  timer: TimerState;
  onPause: () => void;
  menu: readonly (readonly MenuItem[])[];
  onFlip: () => void;
  /** A dialog or cover is over the screen: its main is left out. */
  covered: boolean;
}) {
  const vp = useViewport();
  const easy = columns === 4;
  const sideways = vp.narrow && !easy;
  const land = vp.landscape;
  const big = !land && vp.width >= 390 && vp.height >= 700;
  const { ref: turnRef, size: turnSize } = useShrinkToFit<HTMLParagraphElement>(17, poker ? 13 : 17, [turnLine, poker]);

  const turn = (
    <p ref={turnRef} className="sw-turn-line" data-testid="turn-line" style={{ fontSize: `${turnSize}px` }}>
      {turnLine}
    </p>
  );
  const clueBlock = clueLine !== undefined && (
    <div className="sw-clue-block">
      <p className="sw-clue-line" data-testid="clue-line">
        {clueLine}
      </p>
      {guessLine !== undefined && !(land && vp.small && actions.change) && (
        <p className="sw-small sw-guess-line" data-testid="guess-line">
          {guessLine}
        </p>
      )}
    </div>
  );
  const flip = !sideways && !(land && vp.small) && (
    <button type="button" className={land ? 'sw-flip sw-flip-icon' : 'sw-flip'} aria-label="Flip the board" onClick={onFlip}>
      {land ? '↻' : '↻ Flip'}
    </button>
  );
  const grid = sideways ? (
    <div className="sw-sideways">
      <p className="sw-sideways-text" data-testid="turn-sideways">
        Turn your phone sideways to see the board.
      </p>
      <p className="sw-small" data-testid="turn-sideways-hint">
        Or choose the Easy board for the next game.
      </p>
    </div>
  ) : (
    <BoardGrid
      cells={cells}
      columns={columns}
      angle={angle}
      picked={picked}
      locked={locked}
      turning={turning}
      ignoreTaps={ignoreTaps}
      {...(easy ? { className: 'sw-grid-easy' } : {})}
      {...(onPick ? { onPick } : {})}
    />
  );
  const bottomLine = (
    <div className="sw-bottom-line">
      {bottom && (
        <p className="sw-small sw-result" data-testid={bottom.id}>
          {bottom.text}
        </p>
      )}
    </div>
  );
  const mainButton = !covered && (
    <SwMain
      className={land ? 'sw-panel-main' : 'sw-board-main'}
      until={main.until}
      onClick={main.onClick}
      {...(main.disabled || sideways ? { disabled: true } : {})}
      {...(main.label ? { label: main.label } : {})}
    >
      {main.line1 !== undefined ? (
        <>
          <span className="sw-main-l1">{main.line1}</span> <span className="sw-main-l2">{main.line2}</span>
        </>
      ) : (
        main.line2
      )}
    </SwMain>
  );

  if (land) {
    const slot = (
      <div className="sw-panel-slot">
        {actions.change && !vp.small && (
          <>
            <button type="button" className="sw-quiet" onClick={actions.change}>
              Change clue
            </button>
            <button type="button" className="sw-quiet" onClick={actions.dispute}>
              Clue not allowed?
            </button>
          </>
        )}
        {actions.change && vp.small && guessLine !== undefined && (
          <p className="sw-small sw-guess-line sw-slot-line" data-testid="guess-line">
            {guessLine}
          </p>
        )}
        {actions.endTurn && (
          <button type="button" className="sw-quiet" onClick={actions.endTurn}>
            End our turn
          </button>
        )}
        {actions.oops && (
          <button type="button" className="sw-quiet" onClick={actions.oops}>
            Oops, keep guessing
          </button>
        )}
      </div>
    );
    return (
      <div className={`sw-board-land${vp.small ? ' sw-land-small' : ''}`}>
        {team && <TeamBar team={team} />}
        <div className="sw-land-grid">{grid}</div>
        <div className="sw-panel">
          {timer && (
            <div className="sw-panel-timer">
              <HurryTimer timer={timer} size={40} />
            </div>
          )}
          <div className="sw-panel-buttons">
            {flip}
            <TopActions onPause={onPause} menu={menu} />
          </div>
          <div className="sw-panel-middle">
            {heading && <h1 className="sw-h1 sw-h1-panel">{heading}</h1>}
            {turn}
            {clueBlock}
            {history}
            <WordCounts left={counts} names={names} twoLines />
            {bottomLine}
          </div>
          {slot}
          {mainButton}
        </div>
      </div>
    );
  }

  const slot = (
    <div className="sw-action-slot">
      {actions.change && (
        <>
          <button type="button" className="sw-quiet sw-half" onClick={actions.change}>
            Change clue
          </button>
          <button type="button" className="sw-quiet sw-half" onClick={actions.dispute}>
            Clue not allowed?
          </button>
        </>
      )}
      {actions.endTurn && (
        <button type="button" className="sw-quiet sw-full" onClick={actions.endTurn}>
          End our turn
        </button>
      )}
      {actions.oops && (
        <button type="button" className="sw-quiet sw-full" onClick={actions.oops}>
          Oops, keep guessing
        </button>
      )}
    </div>
  );
  return (
    <div className={['sw-board-port', easy && vp.narrow && 'sw-board-scroll'].filter(Boolean).join(' ')}>
      {team && <TeamBar team={team} />}
      <div className="sw-topbar">
        {timer && <HurryTimer timer={timer} size={big ? 56 : 40} className="sw-timer-top" />}
        <TopActions onPause={onPause} menu={menu} />
      </div>
      {heading && <h1 className="sw-h1 sw-board-h1">{heading}</h1>}
      {turn}
      {heading ? null : clueBlock}
      {big && history}
      <div className="sw-counts-row">
        <WordCounts left={counts} names={names} />
        {flip}
      </div>
      <div className="sw-grid-area">{grid}</div>
      {bottomLine}
      {slot}
      {mainButton}
    </div>
  );
}
