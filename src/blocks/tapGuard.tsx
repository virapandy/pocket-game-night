// The tap guard (docs/ux-guidelines.md 20; Impostor I29, IMP-010): taps on a new screen's buttons are ignored for 500 ms.
import { useCallback, useLayoutEffect, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

/** Guideline 20, IMP-010: how long after a new screen shows its buttons ignore taps. */
export const TAP_GUARD_MS = 500;

/**
 * Guideline 20 (M18), I29: a tap on a button within 500 ms of `screen` changing (or of the screen mounting) is ignored:
 * it does nothing at all, so a double tap never skips a screen. Returns the click handler to put on the screen's own
 * outer element (`onClickCapture`), so no element is added. Only buttons are guarded; a button inside an element marked
 * `data-tap-guard="off"` (Impostor's hold pad) never is, and neither is a click made by the keyboard (Enter in a text
 * field adds its name at once, IMP-003). Uses `Date.now()`, so a fake clock drives it. The one tap guard of the app.
 */
export function useTapGuard(screen: unknown): (e: ReactMouseEvent) => void {
  const shownAt = useRef(Date.now());
  useLayoutEffect(() => {
    shownAt.current = Date.now();
  }, [screen]);
  return useCallback((e: ReactMouseEvent) => {
    if (Date.now() - shownAt.current >= TAP_GUARD_MS) return;
    // A click from the keyboard (Enter or Space) is not a tap.
    if (e.detail === 0) return;
    const target = e.target as Element;
    const button = target.closest('button');
    if (!button || button.closest('[data-tap-guard="off"]')) return;
    e.stopPropagation();
    e.preventDefault();
  }, []);
}

/** `useTapGuard` around part of a screen, laid out as if it were not there (`display: contents`). */
export function TapGuard({ screen, children }: { screen: unknown; children: ReactNode }) {
  const guard = useTapGuard(screen);
  return (
    <div className="pgn-guard" onClickCapture={guard}>
      {children}
    </div>
  );
}
