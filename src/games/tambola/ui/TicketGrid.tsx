// One Tambola ticket drawn as 3 rows of 9 cells (Phase 2), used on players' phones and on the host's screens.
// Every cell has `data-cell`, in row order; numbered cells also have `data-number` (tests/browser/README.md).
import type { CSSProperties } from 'react';
import type { Rows } from '../rules';

export interface CellMarks {
  readonly marked?: ReadonlySet<number>;
  readonly cue?: ReadonlySet<number>;
  readonly outlined?: ReadonlySet<number>;
  /** Host only (TAM-033): the called numbers, highlighted for the room. Never on a player's phone. */
  readonly called?: ReadonlySet<number>;
}

export function TicketGrid({
  rows,
  cell,
  marks = {},
  onTap,
  className,
}: {
  rows: Rows;
  /** The cell's size in CSS pixels. */
  cell: number;
  marks?: CellMarks;
  onTap?: (n: number) => void;
  className?: string;
}) {
  const style = { '--cell': `${cell}px` } as CSSProperties;
  return (
    <div className={className ? `ticket-grid ${className}` : 'ticket-grid'} style={style}>
      {rows.flatMap((row, r) =>
        row.map((n, c) => {
          if (n === null) return <div key={`${r}-${c}`} className="tcell tcell-blank" data-cell="" />;
          const marked = marks.marked?.has(n) === true;
          const attrs = {
            'data-cell': '',
            'data-number': String(n),
            ...(marked ? { 'data-marked': 'true' } : {}),
            ...(marks.cue?.has(n) ? { 'data-cue': 'true' } : {}),
            ...(marks.outlined?.has(n) ? { 'data-outlined': 'true' } : {}),
            ...(marks.called ? { 'data-called': marks.called.has(n) ? 'true' : 'false' } : {}),
          };
          const cls = [
            'tcell',
            marked ? 'tcell-marked' : '',
            marks.cue?.has(n) ? 'tcell-cue' : '',
            marks.outlined?.has(n) ? 'tcell-outlined' : '',
            marks.called?.has(n) ? 'tcell-called' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const content = (
            <>
              <span className="tcell-n">{n}</span>
              {/* TAM-195 (UX list row 11): a corner mark as well as the outline, so the cue never relies on colour alone. */}
              {marks.cue?.has(n) && <span className="tcell-cue-mark" data-testid="cue-mark" aria-hidden="true" />}
              {marked && (
                <span className="tcell-tick" aria-hidden="true">
                  ✓
                </span>
              )}
            </>
          );
          return onTap ? (
            <button key={`${r}-${c}`} type="button" className={cls} aria-pressed={marked} aria-label={marked ? `${n}, marked` : String(n)} onClick={() => onTap(n)} {...attrs}>
              {content}
            </button>
          ) : (
            <div key={`${r}-${c}`} className={cls} {...attrs}>
              {content}
            </div>
          );
        }),
      )}
    </div>
  );
}
