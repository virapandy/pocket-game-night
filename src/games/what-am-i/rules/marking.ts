// The marking decision on T3, as pure functions the turn screen feeds with orientation events and taps
// (specs/what-am-i/03-turn.md WAI-016, WAI-021, WAI-024 with Version 1.1 items 8 to 13, 18, 19, 21 and Version 1.2 item 8;
// product owner 25 October, item 13). Times are app times in ms; the screen takes them from the clock, never an event.

export type MarkKind = 'got' | 'pass';

/** Version 1.1 item 8: pitch θ in degrees from DeviceOrientationEvent β and γ (0 upright, +90 face up, −90 face down). */
export function pitch(beta: number, gamma: number): number {
  const r = Math.PI / 180;
  const x = Math.cos(beta * r) * Math.cos(gamma * r);
  return Math.asin(Math.max(-1, Math.min(1, x))) / r;
}

export const GOT_AT = -40;
export const PASS_AT = 40;
export const REARM_UNDER = 15;
export const HOLD_MS = 150;
export const FLASH_MS = 600;
export const GUARD_MS = 800;
export const COUNTDOWN_MS = 3000;
export const STEADY_SPREAD = 10;
export const STEADY_LIMIT = 35;
export const STEADY_SPAN_MS = 500;

export interface Sample { readonly t: number; readonly theta: number }

const mean = (xs: readonly Sample[]) => xs.reduce((n, s) => n + s.theta, 0) / xs.length;
const steady = (xs: readonly Sample[], m: number) => xs.every((s) => Math.abs(s.theta - m) <= STEADY_SPREAD);

/**
 * Version 1.1 item 9, Version 1.2 item 8: θ₀ from T2's events with times in [2500, 3000) ms (t from T2's start), only when
 * every event there is within 10 of their mean and |mean| < 35. Null otherwise (then {@link steadyReference} is used in T3).
 */
export function countdownReference(t2: readonly Sample[]): number | null {
  const xs = t2.filter((s) => s.t >= COUNTDOWN_MS - 500 && s.t < COUNTDOWN_MS);
  if (xs.length === 0) return null;
  const m = mean(xs);
  return steady(xs, m) && Math.abs(m) < STEADY_LIMIT ? m : null;
}

/**
 * Version 1.2 item 8: θ₀ from the first span of T3 at least 500 ms long whose events are all within 10 of their mean.
 * Feed it every T3 event in order with the events kept so far; it returns the events to keep and θ₀ once found.
 */
export function steadyReference(kept: readonly Sample[], next: Sample): { kept: Sample[]; theta0: number | null } {
  let xs = [...kept, next];
  while (xs.length > 1 && !steady(xs, mean(xs))) xs = xs.slice(1);
  if (xs.length > 1 && xs[xs.length - 1]!.t - xs[0]!.t >= STEADY_SPAN_MS) return { kept: xs, theta0: mean(xs) };
  return { kept: xs, theta0: null };
}

/** Motion marking between events. `armed`: the next motion mark is allowed (true at a turn's start). */
export interface Motion {
  readonly theta0: number | null;
  readonly armed: boolean;
  /** The span of events past one threshold so far: its direction and the time of its first event. */
  readonly span: { readonly kind: MarkKind; readonly from: number } | null;
}

export const startMotion = (theta0: number | null): Motion => ({ theta0, armed: true, span: null });

/**
 * One orientation event (Version 1.1 items 10 to 12): returns the motion state after it and the mark it fires, if any.
 * `blockedUntil`: marks are ignored before this time (the end of the flash plus the 800 ms guard, or T3's opening plus
 * 800 ms); a span completed inside it fires at the first event after it while still past the threshold. Hands-free hold
 * or motion off: don't call this.
 */
export function motionEvent(m: Motion, e: Sample, blockedUntil: number): { motion: Motion; mark: MarkKind | null } {
  if (m.theta0 === null) return { motion: m, mark: null };
  const d = e.theta - m.theta0;
  if (!m.armed) {
    const armed = Math.abs(d) < REARM_UNDER;
    return { motion: { ...m, armed, span: null }, mark: null };
  }
  const kind: MarkKind | null = d <= GOT_AT ? 'got' : d >= PASS_AT ? 'pass' : null;
  if (!kind) return { motion: { ...m, span: null }, mark: null };
  const span = m.span && m.span.kind === kind ? m.span : { kind, from: e.t };
  if (e.t - span.from >= HOLD_MS && e.t >= blockedUntil) return { motion: { ...m, armed: false, span: null }, mark: kind };
  return { motion: { ...m, span }, mark: null };
}

/** A rectangle in CSS px. */
export interface Rect { readonly x: number; readonly y: number; readonly width: number; readonly height: number }

/** WAI-020: the Pause button, 48 × 48 px, 16 px from the top and right edges. */
export const pauseRect = (w: number): Rect => ({ x: w - 64, y: 16, width: 48, height: 48 });

/**
 * Version 1.1 item 13: which marking area a tap at (x, y) is in, on a W × H screen as displayed: 'pass' (top half) or
 * 'got' (bottom half); null outside both (landscape grip bands of 15% at each short edge; the Pause button plus 8 px).
 */
export function tapArea(x: number, y: number, w: number, h: number, pause: Rect = pauseRect(w)): MarkKind | null {
  if (x < 0 || y < 0 || x > w || y > h) return null;
  if (w > h && (x < 0.15 * w || x >= 0.85 * w)) return null;
  const m = 8;
  if (x >= pause.x - m && x <= pause.x + pause.width + m && y >= pause.y - m && y <= pause.y + pause.height + m) return null;
  return y < h / 2 ? 'pass' : 'got';
}

/** Version 1.1 item 19: `time-left` as m:ss, ⌈(T − t)/1000⌉ seconds ("1:00", "0:34", "0:01"; "0:00" at time up). */
export function timeLeftText(turnMs: number, t: number): string {
  const s = Math.max(0, Math.ceil((turnMs - t) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Version 1.1 item 18: the tick times of a turn of T ms (three quick ticks at 10 s left, then one a second; none at T). */
export function tickTimes(turnMs: number): number[] {
  const out = [turnMs - 10000, turnMs - 9900, turnMs - 9800];
  for (let left = 9000; left >= 1000; left -= 1000) out.push(turnMs - left);
  return out;
}

/** Version 1.1 item 18: T2's countdown beeps. */
export const COUNTDOWN_BEEPS = [0, 1000, 2000] as const;

/** WAI-024, Version 1.1 item 21: |γ| ≥ 60 held for 500 ms while the screen reports portrait; reversed after 500 ms of |γ| < 45. */
export interface Rotation { readonly turned: boolean; readonly since: number | null }
export const startRotation: Rotation = { turned: false, since: null };
export function rotationEvent(r: Rotation, gamma: number, portrait: boolean, t: number): Rotation {
  const toward = r.turned ? Math.abs(gamma) < 45 : Math.abs(gamma) >= 60 && portrait;
  if (!toward) return { ...r, since: null };
  const since = r.since ?? t;
  if (t - since >= 500) return { turned: !r.turned, since: null };
  return { ...r, since };
}
