// Secret Words' shared pieces, built in screen lane B and reused by lanes C and D (build-plan.md §2): the team bar
// (Terms), `pause-button` (SWD-110), `where-line` (SWD-032, 110), the grouped game menu (SWD-110 v3.7), dialogs, the
// counts (SWD-040) and the announcer (SWD-095).
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Team } from '../../rules';
import { KindIcon, PauseGlyph } from './icons';
import { useTapWait } from './guard';

/** Terms "Team bar": an 8 px strip in the team colour across the top edge. */
export function TeamBar({ team }: { team: Team }) {
  return <div className={`sw-team-bar sw-bar-${team}`} data-testid="team-bar" aria-hidden="true" />;
}

/** SWD-110 (v3.6): the pause icon button, 44 × 44, directly left of "··· Menu". */
export function PauseButton({ onPause }: { onPause: () => void }) {
  return (
    <button type="button" className="sw-pause" data-testid="pause-button" aria-label="Pause" onClick={onPause}>
      <PauseGlyph />
    </button>
  );
}

/** SWD-110 (v3.6): the small line saying where the game is ("Turn 4 · clue for Chai Champions"); names never shortened. */
export function WhereLine({ text }: { text: string }) {
  return (
    <p className="sw-small sw-where" data-testid="where-line">
      {text}
    </p>
  );
}

export interface MenuItem {
  readonly label: string;
  readonly onSelect: () => void;
  readonly disabled?: boolean;
}

/**
 * "··· Menu" and its sheet (SWD-110 v3.6, v3.7): items in groups with a 1 px rule (`role="separator"`) between groups
 * that have items; the list scrolls inside, "Done" pinned at the bottom, and a fade at the list's bottom edge while more
 * items are below. Escape or "Done" closes it.
 */
export function GameMenu({ groups }: { groups: readonly (readonly MenuItem[])[] }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const measure = () => {
    const el = listRef.current;
    if (el) setMore(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };
  useLayoutEffect(() => {
    if (open) measure();
  }, [open]);
  const shown = groups.filter((g) => g.length > 0);
  return (
    <>
      <button type="button" className="sw-menu-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        ··· Menu
      </button>
      {open && (
        <div className="sw-menu-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sw-menu-sheet">
            <div className="sw-menu-wrap">
              <div className="sw-menu" role="menu" aria-label="Menu" ref={listRef} onScroll={measure}>
                {shown.map((group, gi) => (
                  <div key={gi} style={{ display: 'contents' }}>
                    {gi > 0 && <div role="separator" className="sw-menu-rule" />}
                    {group.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        role="menuitem"
                        className="sw-menu-item"
                        disabled={item.disabled}
                        onClick={() => {
                          setOpen(false);
                          item.onSelect();
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              {more && <div className="sw-menu-fade" aria-hidden="true" />}
            </div>
            <button type="button" className="sw-quiet sw-menu-done" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * A dialog: `role="dialog"`, named by its first sentence or heading (`title`); buttons listed main last. Escape (or a
 * tap on the backdrop) is `onDismiss`, the safe choice.
 */
export function SwDialog({
  title,
  heading,
  children,
  onDismiss,
  className,
  testId,
  guardAll,
}: {
  title: ReactNode;
  /** The title is a heading ("Paused") rather than the dialog's first sentence. */
  heading?: boolean;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
  /** A yes/no question opened by a tap: its quiet buttons wait as its main does. */
  guardAll?: boolean;
}) {
  const id = useId();
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  // `guardAll`: every button of the dialog (quiet ones too) ignores taps for its first 800 ms (RC fix, SWD-114), so the
  // double tap that opened a yes/no question can't answer it.
  const wait = useTapWait();
  return (
    <div className="sw-backdrop" onClickCapture={guardAll ? wait : undefined} onClick={(e) => e.target === e.currentTarget && onDismiss?.()}>
      <div
        className={className ? `sw-dialog ${className}` : 'sw-dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        {...(testId ? { 'data-testid': testId } : {})}
      >
        {heading ? (
          <h2 id={id} className="sw-dlg-heading">
            {title}
          </h2>
        ) : (
          <p id={id} className="sw-dialog-text">
            {title}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

const words = (n: number) => `${n} ${n === 1 ? 'word' : 'words'}`;

/** SWD-040: the counts, circle "9 left" · diamond "8 left", named in full. `twoLines` for the landscape panel. */
export function WordCounts({
  left,
  names,
  twoLines,
}: {
  left: { orange: number; teal: number };
  names: { orange: string; teal: string };
  twoLines?: boolean;
}) {
  return (
    <p
      className={twoLines ? 'sw-counts sw-counts-two' : 'sw-counts'}
      data-testid="word-counts"
      aria-label={`${names.orange}: ${words(left.orange)} left. ${names.teal}: ${words(left.teal)} left.`}
    >
      <span className="sw-count sw-count-orange">
        <KindIcon kind="orange" />
        {left.orange} left
      </span>
      <span className="sw-count-sep"> · </span>
      <span className="sw-count sw-count-teal">
        <KindIcon kind="teal" />
        {left.teal} left
      </span>
    </p>
  );
}

/** SWD-095: the polite announcer, visually hidden. */
export function Announcer({ text }: { text: string }) {
  return (
    <p className="sw-visually-hidden" data-testid="announcer" aria-live="polite">
      {text}
    </p>
  );
}

/**
 * SWD-031 v3.7 (P8): each map-key line shrinks in 1 px steps from its own size down to 13 px to stay on one line (only
 * where it is kept to one line: portrait); if it still doesn't fit, team names show their first 12 characters and "…".
 */
function useKeyFit(deps: readonly unknown[]) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [short, setShort] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onResize = () => setTick((n) => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    let tooWide = false;
    for (const line of Array.from(box.querySelectorAll<HTMLElement>('.sw-key-line'))) {
      line.style.fontSize = '';
      if (getComputedStyle(line).whiteSpace !== 'nowrap') continue;
      let px = Math.round(parseFloat(getComputedStyle(line).fontSize));
      while (px > 13 && line.scrollWidth > line.clientWidth + 0.5) {
        px -= 1;
        line.style.fontSize = `${px}px`;
      }
      if (line.scrollWidth > line.clientWidth + 0.5) tooWide = true;
    }
    if (tooWide && !short) setShort(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, short, ...deps]);
  return { ref, short };
}

const upTo12 = (name: string) => (name.length > 12 ? `${name.slice(0, 12)}…` : name);

/** SWD-031 v3.7, SWD-034 v3.7: the map key, two lines under the map (Easy: line 2 is the dash entry only). */
export function MapKey({ names: full, easy, hidden }: { names: { orange: string; teal: string }; easy: boolean; hidden?: boolean }) {
  const { ref, short } = useKeyFit([full.orange, full.teal, easy, hidden]);
  const names = short ? { orange: upTo12(full.orange), teal: upTo12(full.teal) } : full;
  return (
    <div className="sw-map-key sw-small" data-testid="map-key" ref={ref}>
      {!hidden && (
        <>
          <p className="sw-key-line">
            <span className="sw-key">
              <KindIcon kind="orange" className="sw-ink-orange" />
              {names.orange}
            </span>
            <span className="sw-key">
              <KindIcon kind="teal" className="sw-ink-teal" />
              {names.teal}
            </span>
          </p>
          <p className="sw-key-line">
            <span className="sw-key">
              <KindIcon kind="nobody" />
              nobody's word
            </span>
            {!easy && (
              <span className="sw-key">
                <KindIcon kind="landmine" />
                Landmine: never guess
              </span>
            )}
          </p>
        </>
      )}
    </div>
  );
}
