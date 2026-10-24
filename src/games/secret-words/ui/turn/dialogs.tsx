// The turn's dialogs: D1 "Clue not allowed?" (SWD-124), D2 "Earlier clues" (SWD-041), D3 "Who taps Reveal this turn?"
// (SWD-122), D4 Paused (SWD-110), D5 "New board?" (SWD-055), S7b "Show the map to" (SWD-037). Each main waits 800 ms
// from the dialog appearing (SWD-114); quiet buttons never wait.
import type { ReactNode } from 'react';
import { SwMain, useGuard } from '../shared/guard';
import { SwDialog, WhereLine } from '../shared/parts';

export function DisputeDialog({ onTry, onBroke, onRules, onLetGo }: { onTry: () => void; onBroke: () => void; onRules: () => void; onLetGo: () => void }) {
  const until = useGuard('dispute');
  return (
    <SwDialog guardAll title="Clue not allowed? Both clue givers decide together." onDismiss={onLetGo} className="sw-dialog-stack">
      <div className="sw-dialog-buttons">
        <button type="button" className="sw-quiet sw-full" onClick={onTry}>
          Try another clue
        </button>
        <button type="button" className="sw-quiet sw-full sw-wrap" onClick={onBroke}>
          Turn ends, and one of their words is turned over for them
        </button>
        <button type="button" className="sw-quiet sw-full" onClick={onRules}>
          Clue rules
        </button>
        <SwMain className="sw-main-inline" until={until} onClick={onLetGo}>
          Let it go
        </SwMain>
      </div>
    </SwDialog>
  );
}

export function EarlierCluesSheet({ items, onDone }: { items: readonly ReactNode[]; onDone: () => void }) {
  const until = useGuard('earlier');
  return (
    <SwDialog title="Earlier clues" heading onDismiss={onDone} className="sw-dialog-sheet">
      <ul className="sw-earlier">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
      <SwMain className="sw-main-inline" until={until} onClick={onDone}>
        Done
      </SwMain>
    </SwDialog>
  );
}

export function PickerDialog({ guessers, current, onPick, onCancel }: { guessers: readonly string[]; current: string | null; onPick: (name: string) => void; onCancel: () => void }) {
  return (
    <SwDialog title="Who taps Reveal this turn?" onDismiss={onCancel}>
      <div className="sw-dialog-buttons">
        {guessers.map((g) => (
          <button key={g} type="button" className={g === current ? 'sw-pick-option sw-selected' : 'sw-pick-option'} aria-pressed={g === current} onClick={() => onPick(g)}>
            {g === current && (
              <span className="sw-tick" aria-hidden="true">
                ✓{' '}
              </span>
            )}
            {g}
          </button>
        ))}
        <button type="button" className="sw-quiet sw-full" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </SwDialog>
  );
}

export function PauseCover({ where, onCarryOn }: { where: string; onCarryOn: () => void }) {
  const until = useGuard('pause');
  return (
    <SwDialog title="Paused" heading className="sw-pause-cover" testId="pause-cover">
      <WhereLine text={where} />
      <p>Tap Carry on when you're ready.</p>
      <SwMain className="sw-main-inline" until={until} onClick={onCarryOn}>
        Carry on
      </SwMain>
    </SwDialog>
  );
}

export function NewBoardDialog({ onNewBoard, onKeep }: { onNewBoard: () => void; onKeep: () => void }) {
  const until = useGuard('new-board');
  return (
    <SwDialog
      guardAll
      title="New board? New words, same teams, fresh start. For when someone saw the map or the words are too hard. This board won't count."
      onDismiss={onKeep}
    >
      <div className="sw-dialog-buttons">
        <button type="button" className="sw-quiet sw-full" onClick={onNewBoard}>
          New board
        </button>
        <SwMain className="sw-main-inline" until={until} onClick={onKeep}>
          Keep playing
        </SwMain>
      </div>
    </SwDialog>
  );
}

export function ShowMapSheet({ choices, onChoose, onCancel }: { choices: readonly { label: string; team: 'orange' | 'teal' }[]; onChoose: (team: 'orange' | 'teal') => void; onCancel: () => void }) {
  return (
    <SwDialog title="Show the map to" heading onDismiss={onCancel}>
      <div className="sw-dialog-buttons">
        {choices.map((c) => (
          <button key={c.team} type="button" className="sw-quiet sw-full" onClick={() => onChoose(c.team)}>
            {c.label}
          </button>
        ))}
        <button type="button" className="sw-quiet sw-full" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </SwDialog>
  );
}
