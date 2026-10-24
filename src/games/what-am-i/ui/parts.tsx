// What Am I?'s own shared pieces (lane W2, the frame the turn and results lanes use): the main button with its invisible
// guard (Terms "Guard"), switches, the undo toast (10 s, Terms), the phone's Back (Version 1.2 item 17), "··· Menu"
// (Version 1.1 item 39), dialogs named by their h1, the where-line, the names list with drag handles (WAI-002, WAI-041)
// and the scoreboard (WAI-032). The blocks (src/blocks) give the screen, quiet buttons, sheets and the toast bar.
import {
  useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { HideMainButton, MainButton, QuietButton, type ToastState } from '../../../blocks';

// ---------------------------------------------------------------- Main button and its guard

/** Terms "Guard": a main button ignores taps for 800 ms after its screen appears (1000 ms for the turn's start buttons). */
export const MAIN_GUARD_MS = 800;
export const START_GUARD_MS = 1000;

/**
 * The time until which a main button waits: `ms` from the first render with this `key`. A new key (a new screen) starts a
 * new wait; the same key never restarts it.
 */
export function useGuardUntil(key: unknown, ms: number = MAIN_GUARD_MS): number {
  const ref = useRef<{ key: unknown; until: number } | null>(null);
  if (ref.current === null || !Object.is(ref.current.key, key)) ref.current = { key, until: Date.now() + ms };
  return ref.current.until;
}

/**
 * The one solid button (pinned at the bottom, or `inline` in a dialog), `data-testid="main-button"`. It looks live at once
 * (Version 1.3 item 11); a tap inside its guard does nothing and is never carried on.
 */
export function Main({
  children,
  onClick,
  disabled,
  inline,
  guardKey,
  wait = MAIN_GUARD_MS,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  inline?: boolean;
  /** A new value restarts the guard (the same component showing a new screen). */
  guardKey?: unknown;
  wait?: number;
}) {
  const id = useId();
  const until = useGuardUntil(guardKey ?? id, wait);
  const hide = useContext(HideMainButton);
  if (hide && !inline) return null;
  return (
    <button
      type="button"
      data-testid="main-button"
      className={inline ? 'pgn-main pgn-main-inline' : 'pgn-main'}
      disabled={disabled}
      onClick={() => {
        if (disabled || Date.now() < until) return;
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- Switch

/** A switch named exactly by its words (`role="switch"`, `aria-checked`). */
export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="wai-switch" onClick={() => onChange(!checked)}>
      <span className="wai-switch-label">{label}</span>
      <span className={checked ? 'wai-switch-track wai-switch-on' : 'wai-switch-track'} aria-hidden="true">
        <span className="wai-switch-thumb" />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------- Toast (Terms: undo toasts last 10 s in What Am I?)

export const UNDO_TOAST_MS = 10_000;
const TOAST_MS = 4_000;

/** One toast at a time (a new one replaces the old): undo toasts 10 s, others 4 s. Shown with the blocks' `Toast`. */
export function useWaiToast(): [ToastState | null, (text: string, undo?: () => void) => void, () => void] {
  const [toast, setToast] = useState<ToastState | null>(null);
  const seq = useRef(0);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((cur) => (cur?.id === toast.id ? null : cur)), toast.undo ? UNDO_TOAST_MS : TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);
  const show = useCallback((text: string, undo?: () => void) => {
    seq.current += 1;
    setToast({ id: seq.current, text, ...(undo ? { undo } : {}) });
  }, []);
  const clear = useCallback(() => setToast(null), []);
  return [toast, show, clear];
}

// ---------------------------------------------------------------- The phone's Back (Version 1.2 item 17)

interface BackEntry { readonly level: number; readonly seq: number; readonly run: () => void }
const backStack: BackEntry[] = [];
let backSeq = 0;
function onPopState() {
  let top: BackEntry | null = null;
  for (const e of backStack) if (!top || e.level > top.level || (e.level === top.level && e.seq > top.seq)) top = e;
  top?.run();
}

/**
 * While `active`, the phone's Back calls `fn`, unless something at a higher `level` (or the same level, shown later) is
 * also listening: a screen is level 0, a sheet 1, a dialog 2, the menu 3. The app keeps the address (its back guard).
 */
export function useWaiBack(active: boolean, level: number, fn: () => void): void {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const entry: BackEntry = { level, seq: ++backSeq, run: () => ref.current() };
    backStack.push(entry);
    if (backStack.length === 1) window.addEventListener('popstate', onPopState);
    return () => {
      const i = backStack.indexOf(entry);
      if (i >= 0) backStack.splice(i, 1);
      if (backStack.length === 0) window.removeEventListener('popstate', onPopState);
    };
  }, [active, level]);
}

/** Escape (a keyboard's Back) while `active`. */
function useEscape(active: boolean, fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ref.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}

// ---------------------------------------------------------------- Pause, menu, where-line

/** The Pause button (icon and word, at least 48 px): accessible name "Pause". */
export function PauseButton({ onPause, className }: { onPause: () => void; className?: string }) {
  return (
    <button type="button" className={className ? `wai-pause ${className}` : 'wai-pause'} aria-label="Pause" onClick={onPause}>
      <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
        <rect x="1" y="1" width="4" height="14" rx="1" fill="currentColor" />
        <rect x="9" y="1" width="4" height="14" rx="1" fill="currentColor" />
      </svg>
      <span>Pause</span>
    </button>
  );
}

export interface MenuEntry {
  readonly label: string;
  readonly onSelect: () => void;
  /** Greyed with the small line "After this turn" (Version 1.1 item 30). */
  readonly greyed?: boolean;
}

/** "··· Menu" (accessible name "Menu") and its list of `role="menuitem"`; Escape, Back or "Close" closes it. */
export function GameMenu({ items }: { items: readonly MenuEntry[] }) {
  const [open, setOpen] = useState(false);
  useEscape(open, () => setOpen(false));
  useWaiBack(open, 3, () => setOpen(false));
  return (
    <>
      <button type="button" className="wai-menu-button" aria-label="Menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        ··· Menu
      </button>
      {open && (
        <div className="wai-menu-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="wai-menu-sheet">
            <div className="wai-menu" role="menu" aria-label="Menu">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className="wai-menu-item"
                  aria-disabled={item.greyed ? 'true' : undefined}
                  onClick={() => {
                    if (item.greyed) return;
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  <span>{item.label}</span>
                  {item.greyed && <span className="wai-menu-note">After this turn</span>}
                </button>
              ))}
            </div>
            <button type="button" className="pgn-quiet wai-menu-close" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** The where-line (WAI-090): "Round 2 · Arjun's turn next". */
export function WhereLine({ text }: { text: string }) {
  return (
    <p className="wai-small wai-where" data-testid="where-line">
      {text}
    </p>
  );
}

// ---------------------------------------------------------------- Dialogs

/**
 * A dialog named by its h1 (`role="dialog"`); body text, then its buttons, main last. `onDismiss` (Back, Escape, a tap on
 * the backdrop) is its quiet, non-destructive choice (Version 1.2 item 17). `cover`: the whole screen (the Paused cover).
 */
export function WaiDialog({
  title,
  children,
  onDismiss,
  cover,
  level = 2,
}: {
  title: string;
  children: ReactNode;
  onDismiss?: () => void;
  cover?: boolean;
  level?: number;
}) {
  const id = useId();
  useWaiBack(onDismiss !== undefined, level, () => onDismiss?.());
  useEscape(onDismiss !== undefined, () => onDismiss?.());
  return (
    <div className={cover ? 'wai-backdrop wai-cover-backdrop' : 'wai-backdrop'} onClick={(e) => !cover && e.target === e.currentTarget && onDismiss?.()}>
      <div className={cover ? 'wai-dialog wai-cover' : 'wai-dialog'} role="dialog" aria-modal="true" aria-labelledby={id}>
        <h1 id={id} className="wai-dialog-title">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Sheets

/**
 * A full-screen sheet with its h1 and its own pinned "Done" (the blocks' sheet look). Unlike the blocks' `Sheet`, its quiet
 * buttons are never guarded (the map's rule: only main buttons wait). `cover`: a dialog over it; the sheet behind is inert.
 */
export function WaiSheet({ title, children, onDone, cover }: { title: string; children: ReactNode; onDone: () => void; cover?: ReactNode }) {
  const id = useId();
  const covered = cover !== undefined && cover !== null && cover !== false;
  const until = useGuardUntil(id);
  return (
    <div className="pgn-sheet" role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className="pgn-sheet-body" inert={covered}>
        <h1 id={id} className="pgn-title">
          {title}
        </h1>
        {children}
      </div>
      <div style={{ display: 'contents' }} inert={covered}>
        <MainButton onClick={() => Date.now() >= until && onDone()}>Done</MainButton>
      </div>
      {covered && cover}
    </div>
  );
}

// ---------------------------------------------------------------- Names with drag handles (WAI-002, WAI-041)

/**
 * The names in turn order: each with a drag handle ("Move Riya": drag it, or the arrow keys move it up or down) and "✕"
 * ("Remove Riya"). `canMove(i)`: whether that name may move (players who have played this round stay in place).
 */
export function NameList({
  names,
  onRemove,
  onMove,
  canMove = () => true,
}: {
  names: readonly string[];
  onRemove: (name: string, index: number) => void;
  /** Moves the name at `from` to `to` (both indexes in `names`). */
  onMove: (from: number, to: number) => void;
  canMove?: (index: number) => boolean;
}) {
  const [drag, setDrag] = useState<{ from: number; to: number; dy: number } | null>(null);
  const start = useRef<{ y: number; h: number; pointer: number } | null>(null);
  const allowed = (i: number) => i >= 0 && i < names.length && canMove(i);
  const target = (from: number, dy: number, h: number) => {
    let to = Math.max(0, Math.min(names.length - 1, from + Math.round(dy / Math.max(1, h))));
    // A name moves only among the names that may move: step back towards `from` until one is found.
    while (to !== from && !allowed(to)) to += to > from ? -1 : 1;
    return to;
  };
  const down = (e: ReactPointerEvent<HTMLButtonElement>, i: number) => {
    if (!allowed(i)) return;
    const row = e.currentTarget.closest('li');
    start.current = { y: e.clientY, h: row?.getBoundingClientRect().height ?? 48, pointer: e.pointerId };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* not supported */ }
    setDrag({ from: i, to: i, dy: 0 });
  };
  const move = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s || !drag || e.pointerId !== s.pointer) return;
    const dy = e.clientY - s.y;
    setDrag({ ...drag, dy, to: target(drag.from, dy, s.h) });
  };
  const up = () => {
    if (drag && drag.to !== drag.from) onMove(drag.from, drag.to);
    start.current = null;
    setDrag(null);
  };
  const key = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : null;
    if (to === null) return;
    e.preventDefault();
    if (allowed(i) && allowed(to)) onMove(i, to);
  };
  if (names.length === 0) return null;
  return (
    <ul className="wai-names">
      {names.map((p, i) => {
        const dragging = drag?.from === i;
        return (
          <li
            key={p}
            className={dragging ? 'wai-name-row wai-dragging' : 'wai-name-row'}
            style={dragging ? { transform: `translateY(${drag.dy}px)` } : undefined}
          >
            <button
              type="button"
              className="wai-handle"
              aria-label={`Move ${p}`}
              aria-description="Drag to move, or use the arrow keys: up moves up, down moves down."
              aria-disabled={allowed(i) ? undefined : 'true'}
              onPointerDown={(e) => down(e, i)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => { start.current = null; setDrag(null); }}
              onKeyDown={(e) => key(e, i)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" />
                <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
                <rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
            <span className="wai-name">{p}</span>
            {drag && drag.to === i && !dragging && <span className="wai-sr">drop here</span>}
            <button type="button" className="wai-remove" aria-label={`Remove ${p}`} onClick={() => onRemove(p, i)}>
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** `list` with the item at `from` moved to `to`. */
export function moved<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x!);
  return out;
}

// ---------------------------------------------------------------- Scoreboard (WAI-032)

const turnsText = (n: number) => `${n} ${n === 1 ? 'turn' : 'turns'}`;

/** The scoreboard list: one row per player, "Arjun 7 (1 turn)", leavers last with "(left)". */
export function Scoreboard({ rows }: { rows: readonly { player: string; score: number; turns: number; left: boolean }[] }) {
  return (
    <ul className="wai-board" data-testid="scoreboard">
      {rows.map((r) => (
        <li key={r.player} className="wai-board-row">
          <span className="wai-board-name">{r.player}</span> <span className="wai-board-score">{r.score}</span>{' '}
          <span className="wai-board-turns">({turnsText(r.turns)})</span>
          {r.left && <span className="wai-board-left"> (left)</span>}
        </li>
      ))}
    </ul>
  );
}

/** The header's "← Home (game saved)": two short lines inside one 44 px button, so the header stays on one line at 320 px. */
export function HomeButton({ onClick }: { onClick: () => void }) {
  return (
    <QuietButton onClick={onClick} className="wai-home">
      {'← Home '}
      <span className="wai-home-note">(game saved)</span>
    </QuietButton>
  );
}

// ---------------------------------------------------------------- Toast host (C1, orchestrator 25 October)

/**
 * Holds a toast bar above the main button and keeps it clear of every button: while a toast shows, the game screen ends
 * above it (wai.css; the toast's height is `--wai-toast-h` on the What Am I? root), so its content scrolls above the toast, never under it.
 */
export function ToastHost({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const host = ref.current;
    const root = host?.closest<HTMLElement>('.wai');
    if (!host || !root) return;
    const set = () => {
      const t = host.querySelector('.pgn-toast');
      if (t) root.style.setProperty('--wai-toast-h', `${Math.ceil(t.getBoundingClientRect().height)}px`);
    };
    set();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(set);
    const t = host.querySelector('.pgn-toast');
    if (t) ro?.observe(t);
    return () => ro?.disconnect();
  });
  return (
    <div ref={ref} className="wai-toast-host">
      {children}
    </div>
  );
}
