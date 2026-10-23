// The board grid (shared by the host's board screens, the private map, the map phone and game over; lanes B, C, D).
//   SWD-090: one font size for all words of a board, the largest whole px from 22 down to 12 at which every word fits
//     in 1 line within its cell minus 4 px each side; a word that still doesn't fit at 12 px shrinks alone in 0.5 px
//     steps to 10 px (v3.6). Larger text never changes it. Word text: weight 600, never transformed.
//   SWD-093: every turned-over cell and every map cell has its kind's icon (SVG, aria-hidden, 16 × 16, top left, 2 px in)
//     and an accessible name ("Kite, orange team" / "teal team" / "nobody's word" / "the Landmine", ", found").
//   SWD-042: face-down cells are buttons ("Kite, face down", `aria-pressed`); a tap picks; turned-over cells are not
//     buttons. Tap to zoom (v3.6): `word-zoom`, the word at 28 px weight 700 over the cell, up to 2 cells wide, kept
//     inside the board; while picking it follows the pick; on locked and turned-over cells it shows for 2 000 ms.
//   SWD-102: `data-angle` 0 or 180; at 180 the grid turns as a whole, cells keep their `data-index`.
//   SWD-025: every face-down cell looks exactly the same: a shrunken word's size comes from a style rule keyed on its
//     `data-index`, never from the cell's own markup.
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Kind } from '../../rules';
import { createPortal } from 'react-dom';
import { KindIcon } from './icons';

export interface GridCell {
  readonly word: string;
  /** Present when turned over, or always on a map. */
  readonly kind?: Kind;
  /** A map cell faded as found (SWD-031, 035, 051). */
  readonly found?: boolean;
}

const KIND_NAME: Record<Kind, string> = { orange: 'orange team', teal: 'teal team', nobody: "nobody's word", landmine: 'the Landmine' };

/** SWD-093: a cell's accessible name. */
export function cellName(c: GridCell): string {
  if (!c.kind) return `${c.word}, face down`;
  return `${c.word}, ${KIND_NAME[c.kind]}${c.found ? ', found' : ''}`;
}

const MIN = 12;
const MAX = 22;
const FLOOR = 10;
const PAD = 4;

/**
 * SWD-090's measuring, without putting any word in the page (SWD-025, 032, 121): words are measured on an off-screen
 * canvas that is never attached, so no word, and no order of measuring, can be read from the page, and measuring never
 * makes the page lay itself out again (the guards of SWD-114 count from a screen appearing).
 */
let ctx: CanvasRenderingContext2D | null | undefined;
function measurer(family: string): (word: string, px: number) => number {
  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d');
  const c = ctx;
  return (word, px) => {
    if (!c) return 0;
    c.font = `600 ${px}px ${family}`;
    return c.measureText(word).width;
  };
}

/** Fittings already worked out, so a board measures only when its words, its cell size or the font change. */
const fitted = new Map<string, { size: number; alone: Map<number, number> }>();

/** SWD-090: the board's one size, and the sizes of the words that shrink alone. */
export function fitWords(words: readonly string[], room: number, family: string): { size: number; alone: Map<number, number> } {
  const key = `${typeof document === 'undefined' ? '' : (document.fonts?.status ?? '')}\n${family}\n${room}\n${words.join('\n')}`;
  const known = fitted.get(key);
  if (known) return known;
  const width = measurer(family);
  let size = MIN;
  for (let s = MAX; s >= MIN; s--) {
    if (words.every((w) => width(w, s) <= room)) {
      size = s;
      break;
    }
  }
  const alone = new Map<number, number>();
  if (size === MIN) {
    words.forEach((w, i) => {
      if (width(w, MIN) <= room) return;
      let s = MIN - 0.5;
      while (s > FLOOR && width(w, s) > room) s -= 0.5;
      alone.set(i, s);
    });
  }
  const fit = { size, alone };
  if (fitted.size > 40) fitted.clear();
  fitted.set(key, fit);
  return fit;
}

/**
 * The grid's cell size, kept up to date, in whole layout units (1/64 px). Every column (and row) gets exactly this size,
 * so no cell differs from another by a rounding of `1fr` (SWD-025: every face-down cell looks the same, wherever it is).
 * `h` is 0 where the rows have a fixed height of their own (the scrolling Easy board in narrow portrait).
 */
function useCellSize(ref: React.RefObject<HTMLDivElement | null>, columns: number, rows: number): { w: number; h: number } {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const unit = (x: number) => Math.max(0, Math.floor(x * 64) / 64);
    const read = () => {
      const cs = getComputedStyle(el);
      const colGap = parseFloat(cs.columnGap) || 0;
      const rowGap = parseFloat(cs.rowGap) || 0;
      const w = unit((parseFloat(cs.width) - colGap * (columns - 1)) / columns);
      const fixedRows = !!el.closest('.sw-board-scroll');
      const h = fixedRows ? 0 : unit((parseFloat(cs.height) - rowGap * (rows - 1)) / rows);
      setSize((cur) => (cur.w === w && cur.h === h ? cur : { w, h }));
    };
    read();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [ref, columns, rows]);
  return size;
}

/** SWD-090: the font sizes for these words at this cell width, re-measured once the app's font has loaded. */
function useFit(ref: React.RefObject<HTMLDivElement | null>, words: readonly string[], cellWidth: number) {
  const [fit, setFit] = useState<{ size: number; alone: Map<number, number> }>({ size: MIN, alone: new Map() });
  const [fontsTick, setFontsTick] = useState(0);
  const key = words.join('|');
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => live && setFontsTick((n) => n + 1)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || cellWidth <= 0) return;
    // The same fitting object for the same words and size: no new render when nothing changed.
    setFit(fitWords(words, cellWidth - 2 * PAD, getComputedStyle(el).fontFamily));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, cellWidth, fontsTick]);
  return fit;
}

export function BoardGrid({
  cells,
  columns,
  angle = 0,
  variant = 'board',
  picked = null,
  locked = false,
  turning = [],
  onPick,
  ignoreTaps,
  className,
}: {
  cells: readonly GridCell[];
  columns: number;
  angle?: 0 | 180;
  /** `board`: `word-board` / `board-cell` (room screens); `map`: `map-grid` / `map-cell` (map screens, never tappable). */
  variant?: 'board' | 'map';
  picked?: number | null;
  /** Every cell locked (aria-disabled): taps only zoom. */
  locked?: boolean;
  /** Cells turning over now (the 300 ms turn, SWD-043): shown face down, turning. */
  turning?: readonly number[];
  /** A tap on an unlocked face-down cell. */
  onPick?: (index: number) => void;
  /** True while taps on cells do nothing (the 300 ms turn, 300 ms after a flip). */
  ignoreTaps?: () => boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cellSize = useCellSize(ref, columns, Math.ceil(cells.length / columns));
  const cellWidth = cellSize.w;
  const words = cells.map((c) => c.word);
  const fit = useFit(ref, words, cellWidth);
  const gridId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const isMap = variant === 'map';

  // Tap to zoom on a locked or turned-over cell: 2 000 ms, another tap moves it.
  const [flash, setFlash] = useState<{ index: number; at: number } | null>(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash((f) => (f === flash ? null : f)), Math.max(0, flash.at + 2000 - Date.now()));
    return () => clearTimeout(t);
  }, [flash]);
  // A pick (or a pick moved or cleared) replaces a flash.
  useEffect(() => {
    setFlash(null);
  }, [picked]);
  const zoomIndex = isMap ? null : (flash?.index ?? picked);

  const tap = (i: number) => {
    if (isMap) return;
    if (ignoreTaps?.()) return;
    const c = cells[i]!;
    if (c.kind || locked || !onPick) setFlash({ index: i, at: Date.now() });
    else onPick(i);
  };

  const rules = [...fit.alone].map(([i, px]) => `[data-sw-grid="${gridId}"] [data-index="${i}"] .sw-word{font-size:${px}px}`).join('');
  const style = {
    '--sw-word': `${fit.size}px`,
    '--sw-cols': columns,
    ...(cellSize.w > 0 ? { '--sw-col-w': `${cellSize.w}px` } : {}),
    ...(cellSize.h > 0 ? { '--sw-row-h': `${cellSize.h}px` } : {}),
  } as CSSProperties;
  return (
    <div
      ref={ref}
      className={['sw-grid', isMap && 'sw-map-grid', className].filter(Boolean).join(' ')}
      data-testid={isMap ? 'map-grid' : 'word-board'}
      data-angle={String(angle)}
      data-sw-grid={gridId}
      style={style}
    >
      {rules && <style>{rules}</style>}
      {cells.map((c, i) => {
        const turningNow = turning.includes(i);
        const kind = turningNow ? undefined : c.kind;
        const zoom = zoomIndex === i ? <Zoom word={c.word} grid={ref} gridId={gridId} /> : null;
        const testId = isMap ? 'map-cell' : 'board-cell';
        if (kind) {
          return (
            <div
              key={i}
              role="img"
              data-testid={testId}
              data-index={i}
              aria-label={cellName({ ...c, kind })}
              className={['sw-cell', `sw-kind-${kind}`, c.found && 'sw-found', zoom && 'sw-zoomed'].filter(Boolean).join(' ')}
              onClick={() => tap(i)}
            >
              <span className="sw-cell-icon" aria-hidden="true">
                <KindIcon kind={kind} />
              </span>
              <span className="sw-word">{c.word}</span>
              {zoom}
            </div>
          );
        }
        const isLocked = locked || !onPick;
        return (
          <button
            key={i}
            type="button"
            data-testid={testId}
            data-index={i}
            aria-label={cellName({ word: c.word })}
            aria-pressed={picked === i}
            {...(isLocked ? { 'aria-disabled': 'true' as const } : {})}
            className={['sw-cell', 'sw-down', picked === i && 'sw-picked', turningNow && 'sw-turning', zoom && 'sw-zoomed'].filter(Boolean).join(' ')}
            onClick={() => tap(i)}
          >
            <span className="sw-word">{c.word}</span>
            {picked === i && (
              <span className="sw-pick-tick" aria-hidden="true">
                ✓
              </span>
            )}
            {zoom}
          </button>
        );
      })}
    </div>
  );
}

/** `word-zoom`: the word large over its cell, kept inside the board. Not a button; no kind in it. */
function Zoom({ word, grid, gridId }: { word: string; grid: React.RefObject<HTMLDivElement | null>; gridId: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const z = ref.current;
    const g = grid.current;
    const cell = z?.parentElement as HTMLElement | null;
    if (!z || !g || !cell) return;
    const cs = getComputedStyle(g);
    const gap = parseFloat(cs.columnGap) || 0;
    const cw = cell.offsetWidth;
    const ch = cell.offsetHeight;
    const natural = Math.ceil(z.scrollWidth);
    const width = Math.min(Math.max(natural, cw), 2 * cw + gap);
    const h = z.offsetHeight;
    let left = cell.offsetLeft + (cw - width) / 2;
    left = Math.max(0, Math.min(left, g.clientWidth - width));
    let top = cell.offsetTop + (ch - h) / 2;
    top = Math.max(0, Math.min(top, g.clientHeight - h));
    // Absolute positions start inside the cell's border.
    setPos({ left: left - cell.offsetLeft - cell.clientLeft, top: top - cell.offsetTop - cell.clientTop, width });
  }, [word, grid]);
  // The position goes in a style rule, not on the element, so the zoom looks the same for every word (SWD-042, 025).
  const sel = `[data-sw-grid="${gridId}"] .sw-zoom`;
  const rule = pos ? `${sel}{left:${pos.left}px;top:${pos.top}px;width:${pos.width}px}` : `${sel}{left:0;top:0;visibility:hidden}`;
  return (
    <>
      <span ref={ref} className="sw-zoom" data-testid="word-zoom">
        {word}
        <span className="sw-zoom-hit" aria-hidden="true" />
      </span>
      {createPortal(<style>{rule}</style>, document.head)}
    </>
  );
}
