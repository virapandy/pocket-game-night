// Secret Words' phone helpers (shared by every Secret Words screen): sounds (SWD-097, Test hooks item 3), vibration,
// the screen-on lock, the page being hidden (SWD-032), screen sizes (Terms) and reduce motion (SWD-096).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// ---- Sounds ----

export type SoundName = 'ding' | 'thud' | 'boom' | 'chime';

/** Each sound's notes [Hz, start s, length s] and its peak gain; thud, boom and chime are no louder than ding (SWD-097). */
const SOUNDS: Record<SoundName, { gain: number; wave: OscillatorType; notes: [number, number, number][] }> = {
  ding: { gain: 0.3, wave: 'sine', notes: [[1320, 0, 0.45]] },
  thud: { gain: 0.25, wave: 'triangle', notes: [[140, 0, 0.25]] },
  boom: { gain: 0.25, wave: 'sawtooth', notes: [[80, 0, 0.6], [55, 0.05, 0.6]] },
  chime: { gain: 0.25, wave: 'sine', notes: [[784, 0, 0.35], [1047, 0.3, 0.6]] },
};

const RELEASE = import.meta.env.MODE === 'release';
let audio: AudioContext | null = null;

type Prefs = { get<T>(key: string, fallback: T): T };
/** The app's sound setting (on unless the host turned it off). */
export const soundOn = (prefs: Prefs) => (prefs.get<{ sound?: unknown }>('tambola.settings', {}) ?? {}).sound !== false;

/** Plays one sound with sound on; development and preview builds note it in `window.__sounds`. */
export function playSound(name: SoundName, prefs: Prefs) {
  if (!soundOn(prefs)) return;
  const s = SOUNDS[name];
  if (!RELEASE) {
    const w = window as unknown as { __sounds?: unknown[] };
    if (!Array.isArray(w.__sounds)) w.__sounds = [];
    w.__sounds.push({ name, at: Date.now(), gain: s.gain });
  }
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    if (audio.state === 'suspended') void audio.resume().catch(() => {});
    const t0 = audio.currentTime;
    for (const [freq, start, length] of s.notes) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = s.wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0 + start);
      gain.gain.linearRampToValueAtTime(s.gain, t0 + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + length);
      osc.connect(gain).connect(audio.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + length + 0.02);
    }
  } catch {
    // No sound on this phone.
  }
}

/** A buzz, only where the phone can vibrate. */
export function vibrate(ms: number) {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  } catch {
    // Not allowed.
  }
}

// ---- Screen-on lock ----

type Lock = { release: () => Promise<void> };
type WakeLockApi = { request: (type: 'screen') => Promise<Lock> };

/** Keeps the screen on while `active`; asks again on every return to visible; released when `active` ends. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let live = true;
    let lock: Lock | null = null;
    const request = () => {
      try {
        const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
        if (!api || typeof api.request !== 'function') return;
        api
          .request('screen')
          .then((l) => {
            if (live) lock = l;
            else void l.release().catch(() => {});
          })
          .catch(() => {});
      } catch {
        // Not allowed here.
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', onVisible);
      const l = lock;
      lock = null;
      if (l) void l.release().catch(() => {});
    };
  }, [active]);
}

/**
 * Calls `onHide` when the page goes to the background and `onShow` when it comes back. `onHide` runs inside
 * `flushSync`, so what it removes (a map, SWD-032) is gone in the same task, before the phone takes its picture.
 */
export function usePageVisibility(onHide: () => void, onShow: () => void) {
  const hide = useRef(onHide);
  const show = useRef(onShow);
  hide.current = onHide;
  show.current = onShow;
  useEffect(() => {
    let wasHidden = document.visibilityState === 'hidden';
    const onChange = () => {
      const now = document.visibilityState === 'hidden';
      if (now && !wasHidden) flushSync(() => hide.current());
      else if (!now && wasHidden) show.current();
      wasHidden = now;
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
}

// ---- Sizes (Terms: screen sizes, narrow portrait) ----

export interface Viewport {
  readonly width: number;
  readonly height: number;
  /** The phone sideways (812 × 375, 568 × 320). */
  readonly landscape: boolean;
  /** Terms: `innerWidth < 360` and taller than wide. */
  readonly narrow: boolean;
  /** 568 × 320 and the like: the 160 px board panel. */
  readonly small: boolean;
}

let cached: Viewport | null = null;
function read(): Viewport {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (cached && cached.width === width && cached.height === height) return cached;
  const landscape = width > height && height <= 600;
  cached = { width, height, landscape, narrow: width < 360 && height > width, small: landscape && width < 700 };
  return cached;
}
const subscribe = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
};

/** The window's size, kept up to date as the phone turns. */
export function useViewport(): Viewport {
  return useSyncExternalStore(subscribe, read, read);
}

/** True while the CSS media query matches. */
export function useMediaQuery(query: string): boolean {
  const sub = useCallback(
    (onChange: () => void) => {
      const m = window.matchMedia?.(query);
      m?.addEventListener('change', onChange);
      return () => m?.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(sub, () => window.matchMedia?.(query).matches ?? false, () => false);
}

/** SWD-096: reduce motion. */
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** Re-renders at `at` (ms since epoch), for timed screen changes driven by `Date.now()` and `setTimeout`. */
export function useNow(at: number | null): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (at === null) return;
    const wait = at - Date.now();
    if (wait <= 0) return;
    const t = setTimeout(() => setTick((n) => n + 1), wait);
    return () => clearTimeout(t);
  }, [at]);
  return Date.now();
}
