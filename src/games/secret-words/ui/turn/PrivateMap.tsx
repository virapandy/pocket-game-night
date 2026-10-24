// P2, the private map (one phone; also SWD-037's "Show the map to" with two or three phones): SWD-031 (v3.6 fixed places,
// v3.7 map key), SWD-113 ("Not Riya? Go back", "Someone saw the map"), SWD-121 (hidden after 60 s, warning from 50 s).
// The map is in the page only while shown. No menu, no team bar, no Pause, no sound, no vibration.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Kind, Team } from '../../rules';
import { BoardGrid, type GridCell } from '../shared/BoardGrid';
import { useNow, useViewport } from '../shared/device';
import { SwMain } from '../shared/guard';
import { KindIcon } from '../shared/icons';
import { MapKey, WordCounts } from '../shared/parts';
import { HurryTimer, type TimerState } from './chrome';

const WARN_MS = 50_000;
const HIDE_MS = 60_000;
const PAD_IGNORE_MS = 500;

export function PrivateMap({
  team,
  teamName,
  givers,
  cells,
  kinds,
  columns,
  angle,
  counts,
  names,
  startShown,
  mainLabel,
  guardUntil,
  onMain,
  onNotMe,
  onSaw,
  onFlip,
  timer,
}: {
  team: Team;
  teamName: string;
  givers: readonly string[];
  /** Every cell with its kind; turned-over cells `found`. */
  cells: readonly GridCell[];
  kinds: readonly Kind[];
  columns: number;
  angle: 0 | 180;
  counts: { orange: number; teal: number };
  names: { orange: string; teal: string };
  /** Opened shown ("See the map again"). */
  startShown: boolean;
  mainLabel: string;
  guardUntil: number;
  onMain: () => void;
  onNotMe: () => void;
  /** "Someone saw the map": the map is removed first, then the New board dialog opens. */
  onSaw: () => void;
  onFlip: () => void;
  timer: TimerState;
}) {
  const vp = useViewport();
  const easy = columns === 4;
  const narrowList = vp.narrow && !easy;
  const [shown, setShown] = useState(startShown);
  const [everShown, setEverShown] = useState(startShown);
  const [list, setList] = useState(false);
  const lastPad = useRef(0);
  const [touchAt, setTouchAt] = useState(() => Date.now());
  const swallow = useRef(false);

  const now = Date.now();
  const warnAt = touchAt + WARN_MS;
  const hideAt = touchAt + HIDE_MS;
  useNow(shown ? (now < warnAt ? warnAt : hideAt) : null);
  const expired = shown && now >= hideAt;
  useEffect(() => {
    // SWD-121: removed at 60 000 ms.
    if (!expired) return;
    setShown(false);
    setList(false);
  }, [expired]);
  const visible = shown && now < hideAt;
  const warning = visible && now >= warnAt;

  const show = () => {
    setShown(true);
    setEverShown(true);
    setTouchAt(Date.now());
  };
  const hide = () => {
    setShown(false);
    setList(false);
  };
  const pad = () => {
    const t = Date.now();
    if (t - lastPad.current < PAD_IGNORE_MS) return;
    lastPad.current = t;
    if (visible) hide();
    else show();
  };

  const pair = givers.length > 1;
  const nameAnd = givers.join(' and ');
  const mine = kinds.map((k, i) => (k === team && !cells[i]!.found ? i : -1)).filter((i) => i >= 0);
  const mine2 = kinds.findIndex((k) => k === 'landmine');
  const landmineWord = mine2 >= 0 && !cells[mine2]!.found ? cells[mine2]!.word : null;
  const showList = visible && (list || narrowList);

  const ourWords = (
    <div className="sw-our-words" data-testid="our-words">
      <h2 className="sw-our-h2">{`Your words (${mine.length} left)`}</h2>
      <ul className="sw-our-list">
        {mine.map((i) => (
          <li key={i}>{cells[i]!.word}</li>
        ))}
      </ul>
      {landmineWord && !easy && (
        <p className="sw-small sw-avoid" data-testid="avoid-line">
          <KindIcon kind="landmine" />
          {`Never guess: ${landmineWord} (the Landmine)`}
        </p>
      )}
    </div>
  );
  const mapArea: ReactNode = showList ? (
    ourWords
  ) : visible ? (
    <BoardGrid variant="map" cells={cells} columns={columns} angle={angle} />
  ) : null;

  const heading = (
    <div className="sw-pm-head">
      <h1 className="sw-h1 sw-pm-name">{givers.join(' + ')}</h1>
      {!vp.landscape && visible && (
        <button
          type="button"
          className="sw-quiet sw-saw"
          onClick={() => {
            hide();
            onSaw();
          }}
        >
          Someone saw the map
        </button>
      )}
      {timer && <HurryTimer timer={timer} size={28} className="sw-pm-timer" />}
    </div>
  );
  const lines = (
    <>
      <p className="sw-small sw-private-line" data-testid="private-line">{`Only ${nameAnd} should see this screen.`}</p>
      <p className="sw-small">{`You give clues for ${teamName} (${team})`}</p>
      <WordCounts left={counts} names={names} />
    </>
  );
  const row = (
    <div className="sw-pm-row">
      {visible && !narrowList && (
        <>
          <button type="button" className="sw-quiet sw-half" onClick={() => setList(!list)}>
            {list ? 'Whole map' : 'Our words'}
          </button>
          <button type="button" className="sw-quiet sw-half" aria-label="Flip the board" onClick={onFlip}>
            ↻ Flip
          </button>
        </>
      )}
    </div>
  );
  const padButton = (
    <button type="button" className="sw-pad" data-testid="hold-pad" onClick={pad}>
      {visible ? 'Tap to hide' : 'Tap to see the map'}
    </button>
  );
  const slot = (
    <div className="sw-pm-slot">
      {!everShown && (
        <button type="button" className="sw-quiet sw-full" onClick={onNotMe}>
          {`Not ${pair ? nameAnd : givers[0]}? Go back`}
        </button>
      )}
      {vp.landscape && visible && (
        <button
          type="button"
          className="sw-quiet sw-full"
          onClick={() => {
            hide();
            onSaw();
          }}
        >
          Someone saw the map
        </button>
      )}
    </div>
  );
  const main = everShown && (
    <SwMain until={guardUntil} onClick={onMain} {...(vp.landscape ? { className: 'sw-col-main' } : {})}>
      {mainLabel}
    </SwMain>
  );
  const warn = warning && (
    <p className="sw-hide-warning" data-testid="hide-warning" role="status">
      Still looking? Tap to keep the map
    </p>
  );

  const root = (children: ReactNode, className: string) => (
    <div
      className={className}
      onPointerDownCapture={() => {
        if (warning) swallow.current = true;
        setTouchAt(Date.now());
      }}
      onClickCapture={(e) => {
        if (!swallow.current) return;
        swallow.current = false;
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {children}
    </div>
  );

  if (vp.landscape) {
    return root(
      <>
        <div className="sw-land-grid sw-pm-area">
          {mapArea}
          {warn}
        </div>
        <div className="sw-col">
          <div className="sw-col-scroll">
            {heading}
            {lines}
            <MapKey names={names} easy={easy} hidden={!visible} />
            {padButton}
            {row}
            {slot}
          </div>
          {main}
        </div>
      </>,
      `sw-pm sw-pm-land${vp.small ? ' sw-land-small' : ''}`,
    );
  }
  return root(
    <>
      <div className="sw-scroll sw-pm-scroll">
        {heading}
        {lines}
        {narrowList ? (
          <>
            <p className="sw-sideways-text" data-testid="turn-sideways">
              Turn your phone sideways to see the board.
            </p>
            {showList && ourWords}
            {warn}
          </>
        ) : (
          <div className={easy ? 'sw-pm-area sw-pm-area-easy' : 'sw-pm-area'}>
            {mapArea}
            {warn}
          </div>
        )}
        {!narrowList && <MapKey names={names} easy={easy} hidden={!visible} />}
        {!narrowList && row}
      </div>
      {/* RC fix: the pad and "Not Riya? Go back" stay pinned above the main (same order), so with Larger text or a short
          screen only the part above them scrolls and neither is ever cut off at the bottom. */}
      {padButton}
      {slot}
      {main}
    </>,
    'sw-fixed sw-pm',
  );
}
