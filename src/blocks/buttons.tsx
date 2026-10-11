// Buttons (docs/ux-guidelines.md 14, 17a; Impostor Terms): the one main button, quiet buttons and the selected state.
import { createContext, useContext, type ReactNode } from 'react';

/**
 * Guideline 17a, IMP-080: at most one main button on screen. While a dialog, sheet or summary covers a screen, provide
 * `true` around that screen: its main button is left out of the page (the screen keeps its place underneath).
 */
export const HideMainButton = createContext(false);

/** Main button: the one solid button, 60 px, pinned at the bottom (bottom right in landscape). At most one on screen. */
export function MainButton({
  children,
  onClick,
  disabled,
  inline,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Inside a dialog: in the dialog's own flow instead of pinned at the bottom. */
  inline?: boolean;
}) {
  const hide = useContext(HideMainButton);
  if (hide && !inline) return null;
  return (
    <button
      type="button"
      data-testid="main-button"
      className={inline ? 'pgn-main pgn-main-inline' : 'pgn-main'}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Quiet button: outlined, at least 48 px tall, never the main look. */
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
  /** The game's own class for placing it. */
  className?: string;
  /** Its accessible name when the words alone are not enough. */
  label?: string;
}) {
  return (
    <button
      type="button"
      className={className ? `pgn-quiet ${className}` : 'pgn-quiet'}
      disabled={disabled}
      onClick={onClick}
      {...(label ? { 'aria-label': label } : {})}
    >
      {children}
    </button>
  );
}

/** Selected (guideline 26, never colour alone): outline, a decorative ✓ and the tint, `aria-pressed`; never the main look. */
export function OptionButton({ children, selected, onClick }: { children: ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={selected ? 'pgn-option pgn-selected' : 'pgn-option'} aria-pressed={selected} onClick={onClick}>
      {selected && (
        <span className="pgn-tick" aria-hidden="true">
          ✓{' '}
        </span>
      )}
      {children}
    </button>
  );
}
