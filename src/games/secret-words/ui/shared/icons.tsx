// Our own SVG icons (Terms "Team icon"; SWD-093 never colour alone; SWD-110 the pause glyph). Never text characters.
import type { Kind } from '../../rules';

/** A kind's icon: filled circle (orange), filled diamond (teal), short dash (nobody), a landmine. 16 × 16, aria-hidden. */
export function KindIcon({ kind, size = 16, className }: { kind: Kind; size?: number; className?: string }) {
  return (
    <svg
      className={className ? `sw-icon ${className}` : 'sw-icon'}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'orange' && <circle cx="8" cy="8" r="6.5" fill="currentColor" />}
      {kind === 'teal' && <path d="M8 1 L15 8 L8 15 L1 8 Z" fill="currentColor" />}
      {kind === 'nobody' && <rect x="3" y="7" width="10" height="2.5" rx="1" fill="currentColor" />}
      {kind === 'landmine' && (
        <g fill="currentColor">
          <circle cx="8" cy="9.5" r="4.5" />
          <rect x="7" y="1.5" width="2" height="3.5" rx="0.8" />
          <rect x="2" y="9" width="12" height="1.6" rx="0.8" />
        </g>
      )}
    </svg>
  );
}

/** The pause glyph (two bars). */
export function PauseGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="4" y="3" width="4.5" height="14" rx="1.2" fill="currentColor" />
      <rect x="11.5" y="3" width="4.5" height="14" rx="1.2" fill="currentColor" />
    </svg>
  );
}
