// Impostor's own shared pieces (specs/impostor/README.md, Terms): switches and the "··· Menu". The main button, quiet
// buttons, selected options, toasts, dialogs, sheets and the tap guard are shared building blocks (src/blocks/).
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';

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
/** True while the CSS media query matches (kept up to date as the phone turns). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const m = window.matchMedia?.(query);
      m?.addEventListener('change', onChange);
      return () => m?.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false, () => false);
}

/** The phone sideways (812 × 375), as the landscape layouts in impostor.css. */
export const LANDSCAPE = '(orientation: landscape) and (max-height: 600px)';

export const Caps = ({ children }: { children: ReactNode }) => <span className="imp-caps">{children}</span>;
