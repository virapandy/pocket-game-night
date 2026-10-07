// "That's the game!" (IMP-092, IMP-095, IMP-097, IMP-098, IMP-101, IMP-106; F9): the quiet "Oops, keep playing" at the
// top (P3), the lead line, up to 2 fun lines, the final scoreboard, then the quiet "Play something else", "Home" and
// "More ›" (Share, History, and after a divider "Discard this game"), with the main button "Play again". The page scrolls as one
// (guideline 46a).
// Leaving records `endEvening` (the Game does it); "Share" does not leave.
import { useEffect, useState } from 'react';
import type { ImpostorState } from '../rules';
import { Dialog, MainButton, QuietButton, Toast, useTapGuard, useToast } from './parts';
import { Scoreboard } from './Reveal';
import { counts, funLines, leadLine, scoreRows, shareText, type Story } from './story';

export function Summary({
  state,
  story,
  canOops,
  onOops,
  onPlayAgain,
  onHome,
  onSomethingElse,
  onHistory,
  onDiscard,
}: {
  state: ImpostorState;
  story: Story;
  /** "Oops, keep playing": only within 3 hours of the summary first showing, and before `endEvening` (IMP-099). */
  canOops: boolean;
  onOops: () => void;
  /** IMP-092, IMP-103: a new game with this game's final players and choices. */
  onPlayAgain: () => void;
  onHome: () => void;
  onSomethingElse: () => void;
  onHistory: () => void;
  onDiscard: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const [more, setMore] = useState(false);
  const [toast, showToast, clearToast] = useToast();
  // I29: the 500 ms tap guard from when the summary shows (the discard dialog has its own).
  const guard = useTapGuard('summary');
  const c = counts(story);
  const none = c.rounds === 0;
  const fun = none ? [] : funLines(state, story).lines;
  const board = !none && story.scoreEver;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const share = () => {
    const text = shareText(state, story);
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (typeof nav.share === 'function') {
      // Closing the share sheet without choosing an app: nothing else happens.
      try {
        void nav.share({ text }).catch(() => {});
      } catch {
        // Refused by the phone: nothing else happens.
      }
      return;
    }
    try {
      void navigator.clipboard?.writeText(text).catch(() => {});
    } catch {
      // No clipboard: the toast still says what to do.
    }
    showToast('Copied. Paste it into any chat.');
  };

  const items: ({ label: string; onSelect: () => void } | 'divider')[] = [
    ...(none ? [] : [{ label: 'Share', onSelect: share }]),
    { label: 'History', onSelect: onHistory },
    'divider',
    { label: 'Discard this game', onSelect: () => setAsking(true) },
  ];

  return (
    <main className="imp-screen imp-summary imp-page" onClickCapture={guard}>
      <div className="imp-screen-inner">
        <div className="imp-summary-body">
          {/* IMP-092, IMP-101 (P3): the way back, visible at the top, full width; no extra confirmation on "End game". */}
          {canOops && (
            <QuietButton className="imp-oops" onClick={onOops}>
              Oops, keep playing
            </QuietButton>
          )}
          <h1 className="imp-title">That's the game!</h1>
          <p className="imp-lead" data-testid="summary-line">
            {leadLine(state, story)}
          </p>
          {fun.map((line) => (
            <p key={line} className="imp-body imp-fun" data-testid="fun-line">
              {line}
            </p>
          ))}
          {board && <Scoreboard rows={scoreRows(state, story)} scoresFrom={story.firstScored} />}
          <div className="imp-summary-quiet">
            <QuietButton onClick={onSomethingElse}>Play something else</QuietButton>
            <QuietButton onClick={onHome}>Home</QuietButton>
            <QuietButton onClick={() => setMore(!more)}>More ›</QuietButton>
          </div>
        </div>
      </div>
      {more && <MoreMenu items={items} onClose={() => setMore(false)} />}
      <Toast toast={toast} onDone={clearToast} />
      {!asking && <MainButton onClick={onPlayAgain}>Play again</MainButton>}
      {asking && (
        <Dialog text="Discard this game? Its rounds and scores will be lost.">
          <QuietButton onClick={onDiscard}>Discard</QuietButton>
          <MainButton inline onClick={() => setAsking(false)}>
            Keep it
          </MainButton>
        </Dialog>
      )}
    </main>
  );
}

/** "More ›": a menu over the summary, with a divider before the item that deletes (destructive last). */
function MoreMenu({
  items,
  onClose,
}: {
  items: readonly ({ label: string; onSelect: () => void } | 'divider')[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="imp-menu-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="imp-menu imp-more-menu" role="menu" aria-label="More">
        {items.map((item, i) =>
          item === 'divider' ? (
            <div key={`divider-${i}`} role="separator" className="imp-menu-divider" />
          ) : (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="imp-menu-item"
              onClick={() => {
                onClose();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
