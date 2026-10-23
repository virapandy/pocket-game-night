// P1, the pass screen (SWD-030, 032 "Welcome back.", 047 timer, 103 recap, 104 Do Not Disturb tip, 126 waiting line).
import { useLayoutEffect, useRef, useState } from 'react';
import type { Team } from '../../rules';
import { useViewport } from '../shared/device';
import { SwMain } from '../shared/guard';
import { KindIcon } from '../shared/icons';
import { TeamBar, WhereLine, type MenuItem } from '../shared/parts';
import { useShrinkToFit } from '../shared/shrink';
import { HurryTimer, TopActions, type TimerState } from './chrome';

/** Hides the listed elements one by one, in order, while the scroll area's content doesn't fit (SWD-030, 040). */
export function useHideOrder(count: number, deps: readonly unknown[]) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hidden, setHidden] = useState(0);
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    const onResize = () => {
      setHidden(0);
      setTick((n) => n + 1);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useLayoutEffect(() => {
    setHidden(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (hidden < count && el.scrollHeight > el.clientHeight + 1) setHidden(hidden + 1);
  }, [hidden, count, tick]);
  return { ref, hidden };
}

function PassName({ names }: { names: readonly string[] }) {
  const single = names.length <= 1;
  const { ref, size } = useShrinkToFit<HTMLParagraphElement>(48, 32, [names.join('|')]);
  if (single) {
    return (
      <p ref={ref} className="sw-pass-name" data-testid="pass-name" style={{ fontSize: `${size}px`, whiteSpace: size > 32 ? 'nowrap' : 'normal' }}>
        {names[0] ?? ''}
      </p>
    );
  }
  return (
    <div className="sw-pass-name" data-testid="pass-name">
      <PassLine text={`${names[0]} +`} />
      <PassLine text={names.slice(1).join(' + ')} />
    </div>
  );
}

function PassLine({ text }: { text: string }) {
  const { ref, size } = useShrinkToFit<HTMLSpanElement>(48, 32, [text]);
  return (
    <span ref={ref} className="sw-pass-line" style={{ fontSize: `${size}px`, whiteSpace: size > 32 ? 'nowrap' : 'normal' }}>
      {text}
    </span>
  );
}

export function PassScreen({
  team,
  teamName,
  givers,
  welcome,
  where,
  waiting,
  recap,
  dnd,
  timer,
  onTimer,
  guardUntil,
  onReady,
  onPause,
  menu,
  covered,
}: {
  team: Team;
  teamName: string;
  givers: readonly string[];
  welcome: boolean;
  where: string;
  waiting: string | null;
  recap: string | null;
  dnd: boolean;
  timer: TimerState;
  onTimer: () => void;
  guardUntil: number;
  onReady: () => void;
  onPause: () => void;
  menu: readonly (readonly MenuItem[])[];
  covered: boolean;
}) {
  const vp = useViewport();
  const big = !vp.landscape && vp.width >= 390 && vp.height >= 700;
  const order = (['dnd', 'waiting', 'recap'] as const).filter((k) => (k === 'dnd' ? dnd : k === 'waiting' ? waiting !== null : recap !== null));
  const { ref, hidden } = useHideOrder(order.length, [team, givers.join('|'), waiting, recap, dnd, welcome, timer?.kind]);
  // Hide order (SWD-030): dnd-tip, then waiting-line, then recap-line.
  const gone = new Set<string>(order.slice(0, hidden));
  const showDnd = dnd && !gone.has('dnd');
  const showWaiting = waiting !== null && !gone.has('waiting');
  const showRecap = recap !== null && !gone.has('recap');
  const pair = givers.length > 1;
  return (
    <div className="sw-fixed sw-pass">
      <TeamBar team={team} />
      <div className="sw-topbar">
        <TopActions onPause={onPause} menu={menu} />
      </div>
      {timer && (
        <div className="sw-pass-timer">
          <HurryTimer timer={timer} size={big ? 120 : 72} />
        </div>
      )}
      <div className="sw-scroll" ref={ref}>
        {welcome && (
          <div className="sw-welcome">
            <p className="sw-welcome-text">Welcome back.</p>
            <WhereLine text={where} />
          </div>
        )}
        <h1 className="sw-h1 sw-turn-heading" data-testid="turn-heading">
          <KindIcon kind={team} className={`sw-ink-${team}`} />
          {teamName}, your turn
        </h1>
        <p className="sw-pass-to">Pass the phone to</p>
        <PassName names={givers} />
        <p className="sw-giver-line">{`${pair ? 'Clue givers' : 'Clue giver'} for ${teamName} (${team})`}</p>
        {showWaiting && (
          <p className="sw-small" data-testid="waiting-line">
            {waiting}
          </p>
        )}
        {showRecap && (
          <p className="sw-small" data-testid="recap-line">
            {recap}
          </p>
        )}
        {showDnd && (
          <p className="sw-small" data-testid="dnd-tip">
            Tip: turn on Do Not Disturb so messages don't pop up on the board.
          </p>
        )}
        <button type="button" className="sw-quiet sw-full" onClick={onTimer}>
          {timer && timer.kind === 'run' ? 'Stop timer' : 'Start 90-second timer'}
        </button>
      </div>
      {!covered && (
        <SwMain until={guardUntil} onClick={onReady}>
          {pair ? `We're ${givers.join(' and ')}` : `I'm ${givers[0] ?? ''}`}
        </SwMain>
      )}
    </div>
  );
}
