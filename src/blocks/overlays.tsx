// Dialogs and sheets (docs/ux-guidelines.md 15, 17a, 20; Impostor Terms, IMP-076, IMP-078, IMP-080).
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { MainButton } from './buttons';
import { useTapGuard } from './tapGuard';

/**
 * Dialog: `role="dialog"`, named by its words; buttons listed main last (a `QuietButton`, then `MainButton inline`). A
 * destructive choice is never the main one (IMP-080). Its buttons are tap-guarded for 500 ms from when it, or its
 * question, shows (I29).
 */
export function Dialog({ text, children, className }: { text: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  // I29: a dialog is a new screen: its buttons are guarded for 500 ms from when it (or its question) shows.
  const guard = useTapGuard(typeof text === 'string' ? text : 'dialog');
  return (
    <div className="pgn-backdrop" onClickCapture={guard}>
      <div className={className ? `pgn-dialog ${className}` : 'pgn-dialog'} role="dialog" aria-modal="true" aria-labelledby={id}>
        <p id={id} className="pgn-dialog-text">
          {text}
        </p>
        <div className="pgn-dialog-buttons">{children}</div>
      </div>
    </div>
  );
}

/**
 * A sheet over the screen, with its own heading and its own main button "Done" (pinned at the bottom). It scrolls as
 * one page, and its bottom space keeps every line (and a focused field) clear of "Done" (IMP-081). `cover` is a dialog
 * over the sheet: while it shows, the sheet behind it is inert, so neither a keyboard nor a screen reader reaches the
 * sheet's list or its "Done". Its buttons are tap-guarded for 500 ms from when it shows (I29). "Done" is the only way
 * a change is kept; the owner closes it on Back with `useBackCloses` (nothing saved, IMP-076).
 */
export function Sheet({
  title,
  children,
  onDone,
  doneLabel = 'Done',
  cover,
}: {
  title: string;
  children: ReactNode;
  onDone: () => void;
  doneLabel?: string;
  cover?: ReactNode;
}) {
  const id = useId();
  const covered = cover !== undefined && cover !== null && cover !== false;
  // I29: a sheet is a new screen: its buttons are guarded for 500 ms from when it shows.
  const guard = useTapGuard(title);
  return (
    <div className="pgn-sheet" role="dialog" aria-modal="true" aria-labelledby={id} onClickCapture={guard}>
      <div className="pgn-sheet-body" inert={covered}>
        <h1 id={id} className="pgn-title">
          {title}
        </h1>
        {children}
      </div>
      <div style={{ display: 'contents' }} inert={covered}>
        <MainButton onClick={onDone}>{doneLabel}</MainButton>
      </div>
      {covered && cover}
    </div>
  );
}

/**
 * While `open`, the browser's or phone's Back calls `close` (and nothing else): a sheet closes without saving, a dialog
 * closes changing nothing (IMP-015, IMP-076, IMP-078). The app's back guard keeps the address, so Back stays on the
 * screen underneath.
 */
export function useBackCloses(open: boolean, close: () => void): void {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const back = () => closeRef.current();
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [open]);
}
