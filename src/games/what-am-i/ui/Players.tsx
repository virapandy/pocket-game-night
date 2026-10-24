// D2 Players during a game (WAI-041; Version 1.1 items 30, 32; Version 1.3 item 6), D3 "Kabir has to leave?" (WAI-042) and
// the two-player dialog (Version 1.1 item 29, Version 1.2 item 7). Every change is recorded at once: `addPlayer`, `reorder`
// (only among players still to play this round) and `leave`, with the toast "Kabir left · Undo" (10 s).
import { useEffect, useRef, useState } from 'react';
import { QuietButton, Toast } from '../../../blocks';
import type { WaiState } from '../rules';
import { AddRow } from './Setup';
import { Main, NameList, WaiDialog, WaiSheet, moved, useWaiBack, useWaiToast } from './parts';

export function PlayersSheet({
  state,
  onAdd,
  onReorder,
  onLeave,
  onUndoLeave,
  onEndGame,
  onDone,
}: {
  state: WaiState;
  onAdd: (name: string) => void;
  onReorder: (order: string[]) => void;
  /** Records `leave`; false when refused. */
  onLeave: (name: string) => boolean;
  /** "Kabir left · Undo": back to his old place in the turn order. */
  onUndoLeave: (name: string, order: readonly string[]) => void;
  /** "End the game" in the two-player dialog (→ WAI-060). */
  onEndGame: () => void;
  onDone: () => void;
}) {
  const [ask, setAsk] = useState<{ name: string; two: boolean } | null>(null);
  const [toast, showToast, clearToast] = useWaiToast();
  const field = useRef<HTMLInputElement>(null);
  // "Add a player": the add row is focused once the dialog has closed (the sheet is no longer inert).
  const [focusAdd, setFocusAdd] = useState(0);
  useEffect(() => {
    if (focusAdd > 0) field.current?.focus();
  }, [focusAdd]);
  useWaiBack(ask === null, 1, onDone);
  const order = state.order;
  // Players who have saved a turn this round stay in place (WAI-041).
  const canMove = (i: number) => !state.played.includes(order[i]!);
  const leave = (name: string) => {
    const before = [...order];
    setAsk(null);
    if (onLeave(name)) showToast(`${name} left · Undo`, () => onUndoLeave(name, before));
  };
  const cover =
    ask === null ? null : ask.two ? (
      <WaiDialog title="2 players needed." onDismiss={() => setAsk(null)}>
        <p className="wai-body">Add someone, or end the game.</p>
        <div className="wai-dialog-buttons">
          <QuietButton onClick={onEndGame}>End the game</QuietButton>
          <QuietButton onClick={() => setAsk(null)}>{`Don't remove ${ask.name}`}</QuietButton>
          <Main
            inline
            onClick={() => {
              setAsk(null);
              setFocusAdd((n) => n + 1);
            }}
          >
            Add a player
          </Main>
        </div>
      </WaiDialog>
    ) : (
      <WaiDialog title={`${ask.name} has to leave?`} onDismiss={() => setAsk(null)}>
        <p className="wai-body">{`${ask.name}'s points stay on tonight's scoreboard.`}</p>
        <div className="wai-dialog-buttons">
          <QuietButton onClick={() => leave(ask.name)}>{`${ask.name} leaves`}</QuietButton>
          <Main inline onClick={() => setAsk(null)}>{`Don't remove ${ask.name}`}</Main>
        </div>
      </WaiDialog>
    );
  return (
    <WaiSheet title="Players" onDone={onDone} cover={cover}>
      <p className="wai-small">Add a name to join. New players go after the last player in this round.</p>
      <NameList
        names={order}
        canMove={canMove}
        onRemove={(name) => setAsk({ name, two: order.length <= 2 })}
        onMove={(from, to) => onReorder(moved(order, from, to))}
      />
      <AddRow names={order} onAdd={onAdd} fieldRef={field} />
      <Toast toast={toast} onDone={clearToast} />
    </WaiSheet>
  );
}
