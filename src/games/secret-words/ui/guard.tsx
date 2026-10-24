// Setup's main buttons that wait after their screen appears (SWD-114 version 3.6), on the shared tap guard (lane B,
// ui/shared/guard.tsx): for 800 ms the main looks live (version 3.8, no
// greyed look) but a tap does nothing (not queued). A main disabled for another reason uses `disabled`.
// Kept as `GuardedMain` so the setup screens keep the blocks' main-button place (pinned, or `inline` in a dialog).
import { useContext, useId, type ReactNode } from 'react';
import { HideMainButton } from '../../../blocks';
import { GUARD_MS, useGuard } from './shared';

export const MAIN_WAIT_MS = GUARD_MS;

export function GuardedMain({
  children,
  onClick,
  disabled,
  inline,
  wait = MAIN_WAIT_MS,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Inside a dialog: in the dialog's own flow instead of pinned at the bottom. */
  inline?: boolean;
  wait?: number;
}) {
  // One wait per mount: the screen (or dialog) holding this main appeared.
  const until = useGuard(useId(), wait);
  const hide = useContext(HideMainButton);
  if (hide && !inline) return null;
  return (
    <button
      type="button"
      data-testid="main-button"
      className={['pgn-main', inline && 'pgn-main-inline'].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={() => {
        if (disabled || Date.now() < until) return;
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
