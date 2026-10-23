// Secret Words' shared pieces, built in screen lane B and reused by lanes C and D (build-plan.md §2): the team bar
// (Terms), `pause-button` (SWD-110), `where-line` (SWD-032, 110), the grouped game menu (SWD-110 v3.7), dialogs, the
// counts (SWD-040) and the announcer (SWD-095).
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Team } from '../../rules';
import { KindIcon, PauseGlyph } from './icons';

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
}: {
  title: ReactNode;
  /** The title is a heading ("Paused") rather than the dialog's first sentence. */
  heading?: boolean;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
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
  return (
    <div className="sw-backdrop" onClick={(e) => e.target === e.currentTarget && onDismiss?.()}>
      <div
        className={className ? `sw-dialog ${className}` : 'sw-dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        {...(testId ? { 'data-testid': testId } : {})}
      >
        {heading ? (
          <h2 id={id} className="sw-dialog-heading">
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

/** SWD-031 v3.7, SWD-034 v3.7: the map key, two lines under the map (Easy: line 2 is the dash entry only). */
export function MapKey({ names, easy, hidden }: { names: { orange: string; teal: string }; easy: boolean; hidden?: boolean }) {
  return (
    <div className="sw-map-key sw-small" data-testid="map-key">
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
