// Setup's main buttons that wait after their screen appears (SWD-114 version 3.6), on the shared tap guard (lane B,
// ui/shared/guard.tsx): for 800 ms the main shows the greyed look with its own label, has `aria-disabled="true"` and
// `data-guard="on"`, and a tap does nothing (not queued). A main disabled for another reason never has `data-guard`.
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
  const guarded = !disabled && Date.now() < until;
  return (
    <button
      type="button"
      data-testid="main-button"
      className={['pgn-main', inline && 'pgn-main-inline', guarded && 'sw-waiting'].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-disabled={guarded ? true : undefined}
      data-guard={guarded ? 'on' : undefined}
      onClick={() => {
        if (disabled || Date.now() < until) return;
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
