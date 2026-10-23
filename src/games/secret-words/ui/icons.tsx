// Team icons (Terms "Team icon"): our own SVG shapes, a filled circle for the orange team and a filled diamond for the
// teal team; `aria-hidden`, 16 × 16 px; never written as text characters.
import type { Team } from '../rules';

export function TeamIcon({ team }: { team: Team }) {
  return (
    <svg className={`sw-icon-${team}`} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {team === 'orange' ? <circle cx="8" cy="8" r="7" /> : <path d="M8 1 15 8 8 15 1 8Z" />}
    </svg>
  );
}
