// Toasts (docs/ux-guidelines.md 18, undo beats confirmation; Impostor Terms): one at a time, above the main button.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ToastState {
  readonly id: number;
  readonly text: string;
  /** Undo toasts (5 s) carry an "Undo" button; other toasts last 4 s. */
  readonly undo?: () => void;
}

/** One toast at a time: a new one replaces the old. Undo toasts last 5 s, others 4 s. Returns [toast, show, clear]. */
export function useToast(): [ToastState | null, (text: string, undo?: () => void) => void, () => void] {
  const [toast, setToast] = useState<ToastState | null>(null);
  const seq = useRef(0);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((cur) => (cur?.id === toast.id ? null : cur)), toast.undo ? 5_000 : 4_000);
    return () => clearTimeout(t);
  }, [toast]);
  const show = useCallback((text: string, undo?: () => void) => {
    seq.current += 1;
    setToast({ id: seq.current, text, ...(undo ? { undo } : {}) });
  }, []);
  const clear = useCallback(() => setToast(null), []);
  return [toast, show, clear];
}

/**
 * The toast bar, above the main button. It tells the element holding it its height (`--pgn-toast-h`), so a screen that
 * scrolls as one (`Screen page`, IMP-081) leaves room for it at the end and nothing stays under it. Text ending in
 * " · Undo" shows that ending as the button.
 */
export function Toast({ toast, onDone }: { toast: ToastState | null; onDone: () => void }) {
  const ref = useRef<HTMLElement | null>(null);
  const shown = toast !== null;
  useLayoutEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const set = () => host.style.setProperty('--pgn-toast-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    set();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(set);
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      host.style.removeProperty('--pgn-toast-h');
    };
  }, [shown, toast?.undo]);
  if (!toast) return null;
  if (!toast.undo) {
    return (
      <p ref={(e) => { ref.current = e; }} className="pgn-toast" role="status" data-testid="toast">
        {toast.text}
      </p>
    );
  }
  const text = toast.text.replace(/ · Undo$/, '');
  return (
    <div ref={(e) => { ref.current = e; }} className="pgn-toast" data-testid="undo-toast" role="status">
      <span>{text} · </span>
      <button
        type="button"
        className="pgn-toast-button"
        onClick={() => {
          toast.undo?.();
          onDone();
        }}
      >
        Undo
      </button>
    </div>
  );
}
