// G2 the summary (SWD-060, 128) and D9 "Delete tonight's games" (SWD-065).
import { useState } from 'react';
import { keepNames } from '../../../../blocks';
import type { SecretWordsState } from '../../rules';
import { SwMain, useGuard, useTapWait } from '../shared/guard';
import { GameMenu, SwDialog } from '../shared/parts';
import { clueCredit, summaryLine, tallyLine, type PlayedGame } from './facts';

export function Summary({
  state,
  played,
  canOops,
  onOops,
  onHome,
  onSomethingElse,
  onDelete,
}: {
  /** The evening as it ends (a game in progress counted as ended early). */
  state: SecretWordsState;
  played: readonly PlayedGame[];
  /** "Oops, keep playing", only until the end is recorded. */
  canOops: boolean;
  onOops: () => void;
  onHome: () => void;
  onSomethingElse: () => void;
  onDelete: () => void;
}) {
  const until = useGuard('summary');
  // RC fix: the summary opens from the "End for tonight" dialog, whose button sits where "Oops, keep playing" now is; a
  // double tap's second tap must not take the evening back, so its buttons ignore taps for the first 800 ms too.
  const wait = useTapWait();
  const [deleting, setDeleting] = useState(false);
  const credit = clueCredit(state.games);
  return (
    <div className="sw-page sw-summary" onClickCapture={wait}>
      <div className="sw-topbar sw-topbar-plain">
        <div className="sw-top-actions">
          <GameMenu groups={[[{ label: "Delete tonight's games", onSelect: () => setDeleting(true) }]]} />
        </div>
      </div>
      <h1 className="sw-h1">{keepNames("Tonight's Secret Words")}</h1>
      <p data-testid="summary-line">{summaryLine(played)}</p>
      <p className="sw-strong" data-testid="tally">
        {tallyLine(state)}
      </p>
      {credit && <p data-testid="clue-credit">{credit}</p>}
      {/* RC fix: side by side in landscape, so "← Home" is on the first screen above the pinned main. */}
      <div className="sw-summary-buttons">
        {canOops && (
          <button type="button" className="sw-quiet sw-full" onClick={onOops}>
            Oops, keep playing
          </button>
        )}
        <button type="button" className="sw-quiet sw-full" onClick={onHome}>
          ← Home
        </button>
      </div>
      {!deleting && (
        <SwMain until={until} onClick={onSomethingElse}>
          Play something else
        </SwMain>
      )}
      {deleting && <DeleteDialog onDelete={onDelete} onKeep={() => setDeleting(false)} />}
    </div>
  );
}

function DeleteDialog({ onDelete, onKeep }: { onDelete: () => void; onKeep: () => void }) {
  const until = useGuard('delete');
  return (
    <SwDialog guardAll title="Delete tonight's games? The games and tally will be lost." onDismiss={onKeep}>
      <div className="sw-dialog-buttons">
        <button type="button" className="sw-quiet sw-full" onClick={onDelete}>
          Delete
        </button>
        <SwMain className="sw-main-inline" until={until} onClick={onKeep}>
          Keep it
        </SwMain>
      </div>
    </SwDialog>
  );
}
