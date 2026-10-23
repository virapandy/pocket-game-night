// Main buttons that wait after their screen appears (SWD-114 version 3.6). PLACEHOLDER for lane A: the shared
// tap-guard look belongs to lane B, which replaces this file's look (and may move it); the behaviour here follows the
// scenario: for 800 ms the main shows the greyed look with its own label, has `aria-disabled="true"` and
// `data-guard="on"`, and a tap does nothing (not queued). A main disabled for another reason never has `data-guard`.
import { useContext, useEffect, useState, type ReactNode } from 'react';
import { HideMainButton } from '../../../blocks';

export const MAIN_WAIT_MS = 800;

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
  const [waiting, setWaiting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setWaiting(false), wait);
    return () => clearTimeout(t);
  }, [wait]);
  const hide = useContext(HideMainButton);
  if (hide && !inline) return null;
  const guarded = waiting && !disabled;
  return (
    <button
      type="button"
      data-testid="main-button"
      className={inline ? 'pgn-main pgn-main-inline' : 'pgn-main'}
      disabled={disabled}
      aria-disabled={guarded ? true : undefined}
      data-guard={guarded ? 'on' : undefined}
      onClick={() => {
        if (waiting || disabled) return;
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
