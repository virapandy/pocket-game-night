// P3, the clue screen (SWD-040, 101 the clue word and its warning, 118 clue numbers, 103 recap, 126 waiting line).
import type { ClueNumber, Team } from '../../rules';
import { useViewport } from '../shared/device';
import { SwMain } from '../shared/guard';
import { KindIcon } from '../shared/icons';
import { TeamBar, WordCounts, type MenuItem } from '../shared/parts';
import { HurryTimer, TopActions, type TimerState } from './chrome';
import { useHideOrder } from './PassScreen';

const KEYS: readonly ClueNumber[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'inf'];

export function ClueScreen({
  team,
  teamName,
  givers,
  n,
  word,
  onKey,
  onWord,
  warning,
  counts,
  names,
  tip,
  anyone,
  waiting,
  recap,
  onSeeMap,
  onKeep,
  timer,
  onTimer,
  guardUntil,
  onConfirm,
  onPause,
  menu,
  covered,
}: {
  team: Team;
  teamName: string;
  givers: readonly string[];
  n: ClueNumber | null;
  word: string;
  onKey: (n: ClueNumber) => void;
  onWord: (w: string) => void;
  warning: string | null;
  counts: { orange: number; teal: number };
  names: { orange: string; teal: string };
  tip: boolean;
  anyone: boolean;
  waiting: string | null;
  recap: string | null;
  onSeeMap: (() => void) | null;
  onKeep: (() => void) | null;
  timer: TimerState;
  onTimer: () => void;
  guardUntil: number;
  onConfirm: () => void;
  onPause: () => void;
  menu: readonly (readonly MenuItem[])[];
  covered: boolean;
}) {
  const vp = useViewport();
  const order = (['tip', 'waiting', 'help', 'recap'] as const).filter((k) => (k === 'tip' ? tip : k === 'waiting' ? waiting !== null : k === 'recap' ? recap !== null : true));
  const { ref, hidden } = useHideOrder(order.length, [team, tip, waiting, recap, warning !== null, timer?.kind, onKeep !== null]);
  const gone = new Set<string>(order.slice(0, hidden));

  const keys = (
    <div className={vp.landscape ? (vp.small ? 'sw-keys sw-keys-row' : 'sw-keys sw-keys-six') : vp.width < 360 ? 'sw-keys sw-keys-tight' : 'sw-keys'}>
      {KEYS.map((k) => (
        <button
          key={String(k)}
          type="button"
          data-testid="clue-key"
          className={k === 'inf' ? 'sw-key-btn sw-key-inf' : 'sw-key-btn'}
          aria-pressed={n === k}
          {...(k === 'inf' ? { 'aria-label': 'As many as you like' } : {})}
          onClick={() => onKey(k)}
        >
          {k === 'inf' ? (
            <>
              <span className="sw-inf">∞</span>
              <span className="sw-many">many</span>
            </>
          ) : (
            String(k)
          )}
        </button>
      ))}
    </div>
  );
  const anyoneLine = anyone && (
    <p className="sw-small" data-testid="anyone-line">
      Anyone can tap the number.
    </p>
  );
  const help = !gone.has('help') && (
    <p className="sw-small" data-testid="clue-help">
      2 means up to 3 guesses. 0 or ∞: as many as you like.
    </p>
  );
  const input = (
    <label className="sw-field">
      <span className="sw-clue-label">Clue word (optional)</span>
      <input
        className="sw-clue-input"
        data-testid="clue-word"
        type="text"
        value={word}
        maxLength={24}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => onWord(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        onFocus={(e) => e.target.scrollIntoView({ block: 'nearest' })}
      />
    </label>
  );
  const rest = (
    <>
      {warning && (
        <p className="sw-clue-warning" data-testid="clue-warning">{`Careful: ${warning} is a word on the board.`}</p>
      )}
      <WordCounts left={counts} names={names} />
      {tip && !gone.has('tip') && (
        <p className="sw-small" data-testid="tip">
          One word, one number. No faces, no pointing!
        </p>
      )}
      {waiting !== null && !gone.has('waiting') && (
        <p className="sw-small" data-testid="waiting-line">
          {waiting}
        </p>
      )}
      {recap !== null && !gone.has('recap') && (
        <p className="sw-small" data-testid="recap-line">
          {recap}
        </p>
      )}
    </>
  );
  const buttons = (
    <>
      {onSeeMap && (
        <button type="button" className="sw-quiet sw-full" onClick={onSeeMap}>
          See the map again
        </button>
      )}
      {onKeep && (
        <button type="button" className="sw-quiet sw-full" onClick={onKeep}>
          Keep my clue
        </button>
      )}
      <button type="button" className="sw-quiet sw-full" onClick={onTimer}>
        {timer && timer.kind === 'run' ? 'Stop timer' : 'Start 90-second timer'}
      </button>
    </>
  );
  const head = (
    <>
      <h1 className="sw-h1 sw-turn-heading" data-testid="turn-heading">
        <KindIcon kind={team} className={`sw-ink-${team}`} />
        {teamName}, your turn
      </h1>
      <p className="sw-clue-prompt" data-testid="clue-prompt">{`${givers.join(' and ')}, say your clue out loud. How many words is it for?`}</p>
    </>
  );
  const main = !covered && (
    <SwMain until={guardUntil} onClick={onConfirm} {...(n === null ? { disabled: true } : {})}>
      {n === null ? 'Pick a number' : `Clue for ${n === 'inf' ? '∞' : n}: start guessing`}
    </SwMain>
  );
  const top = (
    <div className="sw-topbar">
      {timer && <HurryTimer timer={timer} size={28} className="sw-timer-top" />}
      <TopActions onPause={onPause} menu={menu} />
    </div>
  );

  if (vp.landscape && !vp.small) {
    return (
      <div className="sw-fixed sw-clue sw-clue-land">
        <TeamBar team={team} />
        {top}
        <div className="sw-clue-cols">
          <div className="sw-scroll" ref={ref}>
            {head}
            {input}
            {rest}
            {buttons}
          </div>
          <div className="sw-clue-right">
            {keys}
            {anyoneLine}
            {help}
          </div>
        </div>
        {main}
      </div>
    );
  }
  return (
    <div className="sw-fixed sw-clue">
      <TeamBar team={team} />
      {top}
      <div className="sw-scroll" ref={ref}>
        {head}
        {keys}
        {anyoneLine}
        {help}
        {input}
        {rest}
        {vp.landscape && buttons}
      </div>
      {/* RC fix: in portrait the quiet buttons sit pinned above the main, so none is ever half hidden behind it. */}
      {!vp.landscape && <div className="sw-clue-buttons">{buttons}</div>}
      {main}
    </div>
  );
}
