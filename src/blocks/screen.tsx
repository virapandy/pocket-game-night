// Screens (docs/ux-guidelines.md 13, 17a, 24, 46a; Impostor IMP-081, IMP-088, IMP-109): the root with the text sizes, the
// screen with the pinned main button's space kept free, its content, and one scroll area.
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

const join = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

/**
 * The root of a game's screens: sets the text sizes (body 17 px, small 15 px; with Larger text 21 and 19 px,
 * guideline 24, IMP-109) and the spacing tokens every block reads. Put the game's own class in `className`.
 */
export function BlocksRoot({ larger, className, children }: { larger?: boolean; className?: string; children: ReactNode }) {
  return <div className={join('pgn', className, larger && 'pgn-larger')}>{children}</div>;
}

/**
 * One screen, the height of the phone. Its bottom padding (`--pgn-foot`) keeps the main button's space free, so nothing
 * sits under the pinned button. `page`: the screen scrolls as one page instead (guideline 46a: results, summaries);
 * a toast then makes the page end above it. Without `page` the screen never scrolls: put a `ScrollArea` inside for the
 * part that may. `onClickCapture` takes `useTapGuard`'s handler.
 */
export function Screen({
  page,
  className,
  onClickCapture,
  children,
}: {
  page?: boolean;
  className?: string;
  onClickCapture?: (e: ReactMouseEvent) => void;
  children: ReactNode;
}) {
  return (
    <main className={join('pgn-screen', className, page && 'pgn-page')} onClickCapture={onClickCapture}>
      {children}
    </main>
  );
}

/** A screen's content (above the main button), as a column; `hidden` while a sheet covers the screen. */
export function ScreenContent({ hidden, children }: { hidden?: boolean; children: ReactNode }) {
  return (
    <div className="pgn-screen-inner" hidden={hidden}>
      {children}
    </div>
  );
}

/** The one part of a fixed screen that scrolls (a list, a form), taking the space left. */
export function ScrollArea({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={join('pgn-scroll', className)}>{children}</div>;
}
