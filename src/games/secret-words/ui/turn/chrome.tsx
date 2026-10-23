// Pieces every turn screen uses: the timer (SWD-047), the top bar with Pause and the menu (SWD-110), the screen root.
import type { ReactNode } from 'react';
import { useNow } from '../shared/device';
import { GameMenu, PauseButton, type MenuItem } from '../shared/parts';
import { useShrinkToFit } from '../shared/shrink';

export type TimerState = { readonly kind: 'run'; readonly at: number } | { readonly kind: 'paused' } | null;

export const TIMER_MS = 90_000;

export function timerText(t: TimerState, now: number): string | null {
  if (!t) return null;
  if (t.kind === 'paused') return 'Paused';
  const elapsed = now - t.at;
  if (elapsed >= TIMER_MS) return "Time's up!";
  const secs = 90 - Math.floor(Math.max(0, elapsed) / 1000);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

/** The next moment the timer's text changes. */
function nextChange(t: TimerState, now: number): number | null {
  if (!t || t.kind !== 'run') return null;
  const elapsed = now - t.at;
  if (elapsed >= TIMER_MS) return null;
  return t.at + (Math.floor(Math.max(0, elapsed) / 1000) + 1) * 1000;
}

/** `hurry-timer`: "1:30" … "0:01", "Time's up!", "Paused"; words shrink to fit, floor 28 px. */
export function HurryTimer({ timer, size, className }: { timer: TimerState; size: number; className?: string }) {
  const now = Date.now();
  useNow(nextChange(timer, now));
  const text = timerText(timer, now);
  const isWords = text !== null && !/^\d/.test(text);
  const { ref, size: fitted } = useShrinkToFit<HTMLSpanElement>(size, isWords ? 28 : size, [text, size]);
  if (text === null) return null;
  return (
    <span ref={ref} className={className ? `sw-timer ${className}` : 'sw-timer'} data-testid="hurry-timer" style={{ fontSize: `${fitted}px` }}>
      {text}
    </span>
  );
}

/** The top bar's right end: Pause directly left of "··· Menu" (SWD-110 v3.6). */
export function TopActions({ onPause, menu, before }: { onPause: () => void; menu: readonly (readonly MenuItem[])[]; before?: ReactNode }) {
  return (
    <div className="sw-top-actions">
      {before}
      <PauseButton onPause={onPause} />
      <GameMenu groups={menu} />
    </div>
  );
}
