// Impostor's shared pieces (specs/impostor/README.md, Terms): the main button, quiet buttons, selected options,
// switches, toasts, dialogs, sheets and the "··· Menu". The next screens reuse these.
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';

/**
 * IMP-080: at most one main button on screen. While a dialog, sheet or the summary covers a screen, that screen's
 * main button is left out of the page (the screen keeps its place underneath).
 */
export const HideMainButton = createContext(false);

/** Main button: the one solid button, 60 px, fixed at the bottom (bottom right in landscape). At most one on screen. */
export function MainButton({
  children,
  onClick,
  disabled,
  inline,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Inside a dialog: in the dialog's own flow instead of fixed at the bottom. */
  inline?: boolean;
}) {
  const hide = useContext(HideMainButton);
  if (hide && !inline) return null;
  return (
    <button
      type="button"
      data-testid="main-button"
      className={inline ? 'imp-main imp-main-inline' : 'imp-main'}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Quiet button: outlined, 48 px tall, never the main look. */
export function QuietButton({
  children,
  onClick,
  disabled,
  className,
  label,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={className ? `imp-quiet ${className}` : 'imp-quiet'}
      disabled={disabled}
      onClick={onClick}
      {...(label ? { 'aria-label': label } : {})}
    >
      {children}
    </button>
  );
}

/** Selected (Terms): outline, a decorative ✓ and the tint, `aria-pressed`; never the main look. */
export function OptionButton({ children, selected, onClick }: { children: ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={selected ? 'imp-option imp-selected' : 'imp-option'} aria-pressed={selected} onClick={onClick}>
      {selected && (
        <span className="imp-tick" aria-hidden="true">
          ✓{' '}
        </span>
      )}
      {children}
    </button>
  );
}

/** A switch named exactly by its words (`role="switch"`). */
export function Switch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="imp-switch"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="imp-switch-label">{label}</span>
      <span className={checked ? 'imp-switch-track imp-switch-on' : 'imp-switch-track'} aria-hidden="true">
        <span className="imp-switch-thumb" />
      </span>
    </button>
  );
}

export interface ToastState {
  readonly id: number;
  readonly text: string;
  /** Undo toasts (5 s) carry an "Undo" button; other toasts last 4 s. */
  readonly undo?: () => void;
}

/** One toast at a time: a new one replaces the old. Undo toasts last 5 s, others 4 s (Terms). */
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

/** The toast bar, above the main button. */
export function Toast({ toast, onDone }: { toast: ToastState | null; onDone: () => void }) {
  if (!toast) return null;
  if (!toast.undo) {
    return (
      <p className="imp-toast" role="status" data-testid="toast">
        {toast.text}
      </p>
    );
  }
  const text = toast.text.replace(/ · Undo$/, '');
  return (
    <div className="imp-toast" data-testid="undo-toast" role="status">
      <span>{text} · </span>
      <button
        type="button"
        className="imp-toast-button"
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

/**
 * Dialog (Terms): `role="dialog"`, named by its words; buttons listed main last ("A" / "B (main)"). A destructive
 * choice is never the main one (IMP-080).
 */
export function Dialog({ text, children }: { text: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <div className="imp-backdrop">
      <div className="imp-dialog" role="dialog" aria-modal="true" aria-labelledby={id}>
        <p id={id} className="imp-dialog-text">
          {text}
        </p>
        <div className="imp-dialog-buttons">{children}</div>
      </div>
    </div>
  );
}

/** A sheet over the screen, with its own heading and its own main button "Done" (fixed at the bottom). */
export function Sheet({ title, children, onDone, doneLabel = 'Done' }: { title: string; children: ReactNode; onDone: () => void; doneLabel?: string }) {
  const id = useId();
  return (
    <div className="imp-sheet" role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className="imp-sheet-body">
        <h1 id={id} className="imp-title">
          {title}
        </h1>
        {children}
      </div>
      <MainButton onClick={onDone}>{doneLabel}</MainButton>
    </div>
  );
}

export interface MenuItem {
  readonly label: string;
  readonly onSelect: () => void;
}

/** "··· Menu" at the top right, with its items in a menu (IMP-075). */
export function Menu({ items }: { items: readonly MenuItem[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" className="imp-menu-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        ··· Menu
      </button>
      {open && (
        <div className="imp-menu-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="imp-menu" role="menu" aria-label="Menu">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className="imp-menu-item"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** A name shown in capitals by CSS only (Terms, "Names"): the page text stays as typed. */
export const Caps = ({ children }: { children: ReactNode }) => <span className="imp-caps">{children}</span>;
