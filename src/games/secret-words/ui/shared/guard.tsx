// The tap guard of Secret Words' main buttons (SWD-114, v3.5 item 2, v3.6): a main button ignores taps for 800 ms after
// its screen appears (1 s for "I'm Riya", 1.5 s for "Other team's turn" after a turn-ending reveal), and the wait is
// invisible (version 3.8): the main looks live at once, with no greyed look, `aria-disabled` or `data-guard`. A tap during
// the wait does nothing and is not queued. A main disabled for another reason uses `disabled` and keeps its look.
// Quiet buttons never wait. Uses `Date.now()` and `setTimeout`, so a fake clock drives it.
import { useCallback, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { useNow } from './device';

export const GUARD_MS = 800;

/**
 * The time until which a screen's main waits: `ms` from the first render with this `key` (a screen appearing). A new
 * key starts a new wait; the same key never restarts it (closing a dialog, "Carry on", "Welcome back.").
 */
export function useGuard(key: unknown, ms: number = GUARD_MS, from?: number | null): number {
  const ref = useRef<{ key: unknown; until: number } | null>(null);
  if (ref.current === null || !Object.is(ref.current.key, key)) {
    // `from`: when the screen appeared, if known (a timer's own time). The screen is drawn a moment later, and on a busy
    // phone that moment must not lengthen the wait. Ignored when it is in the future or a whole wait ago.
    const now = Date.now();
    const start = from != null && from <= now && now - from < ms ? from : now;
    ref.current = { key, until: start + ms };
  }
  const until = ref.current.until;
  useNow(until);
  return until;
}

/** Secret Words' main button: the one solid button, with the tap-guard look while `until` is ahead. */
export function SwMain({
  children,
  onClick,
  disabled,
  until = 0,
  label,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** The guard's end (from `useGuard`). */
  until?: number;
  /** Its accessible name when the visible words are shortened. */
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-testid="main-button"
      className={['sw-main', className].filter(Boolean).join(' ')}
      disabled={disabled}
      {...(label ? { 'aria-label': label } : {})}
      onClick={() => {
        if (disabled || Date.now() < until) return;
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

/**
 * RC fix (pretend player, 24 October; SWD-114 applied to a dialog's quiet buttons): for `ms` after the element holding
 * this handler appears, a tap on any of its buttons (or its backdrop) does nothing, so the second tap of a double tap
 * that opened it can never land on a button sitting in the same spot. Invisible, as SWD-114 v3.8. A keyboard click
 * (Enter, Space) is not a tap and always works. Put the result on the element's `onClickCapture`.
 */
export function useTapWait(ms: number = GUARD_MS): (e: ReactMouseEvent) => void {
  const shownAt = useRef<number | null>(null);
  if (shownAt.current === null) shownAt.current = Date.now();
  return useCallback(
    (e: ReactMouseEvent) => {
      if (Date.now() - (shownAt.current ?? 0) >= ms) return;
      if (e.detail === 0) return;
      const target = e.target as Element;
      if (!target.closest('button') && target !== e.currentTarget) return;
      e.stopPropagation();
      e.preventDefault();
    },
    [ms],
  );
}
