// What the turn (lane W3) needs from this phone: sounds and vibration (WAI-022, logged for WAI-H8), the screen wake lock
// (WAI-025), the motion permission (WAI-013, Version 1.1 item 16), what the tip line knows about this phone (WAI-011:
// a refused wake lock, a rotation-lock event) and the "Riya: 5 saved · Undo" toast's place (WAI-031, Version 1.1 item 26).
import type { Preferences } from '../../../engine';
import { logSound, logVibrate, type SoundName } from './hooks';
import { PREF } from './night';
import { motionOn, motionState } from './Settings';

// ---------------------------------------------------------------- Sounds (WAI-022) and vibration

type AudioCtor = typeof AudioContext;
let audio: AudioContext | null = null;

/** The audio context, made (or woken) inside a tap so the phone lets it play. */
export function wakeAudio(): void {
  try {
    if (!audio) {
      const C = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext) as AudioCtor | undefined;
      if (!C) return;
      audio = new C();
    }
    if (audio.state === 'suspended') void audio.resume().catch(() => undefined);
  } catch {
    audio = null;
  }
}

/** One tone: frequency `from` to `to` Hz over `ms`, with a short fade in and out. */
function tone(from: number, to: number, ms: number, type: OscillatorType = 'sine', volume = 0.25) {
  const ctx = audio;
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime;
    const d = ms / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to !== from) osc.frequency.linearRampToValueAtTime(to, t0 + d);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + Math.min(0.01, d / 4));
    gain.gain.setValueAtTime(volume, t0 + d * 0.7);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + d);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + d + 0.02);
  } catch {
    /* no sound on this phone */
  }
}

/** WAI-022: plays one of the turn's sounds when Sounds is on (and logs it for WAI-H8). */
export function playSound(name: SoundName, on: boolean): void {
  if (!on) return;
  logSound(name);
  switch (name) {
    case 'countdown':
      return tone(880, 880, 100, 'sine');
    case 'got':
      return tone(660, 1320, 200, 'sine');
    case 'pass':
      return tone(220, 220, 200, 'triangle');
    case 'tick':
      return tone(1200, 1200, 50, 'square', 0.12);
    case 'timeUp':
      return tone(880, 220, 600, 'sawtooth', 0.2);
  }
}

/** WAI-022: Got it 40 ms; Pass 40, 60, 40 ms; time up 400 ms, where the phone can (whatever the Sounds switch). */
export function vibrate(pattern: number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  logVibrate(pattern);
  try {
    navigator.vibrate(pattern);
  } catch {
    /* not allowed */
  }
}

// ---------------------------------------------------------------- Wake lock (WAI-025)

interface Sentinel { release: () => Promise<void> }
let wanted = false;
let lock: Sentinel | null = null;

/** Asks for the screen to stay awake (T2's start). `onRefused`: refused or missing (the tip, WAI-011). */
export function holdScreenOn(onRefused: () => void): void {
  wanted = true;
  const api = typeof navigator !== 'undefined' ? (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock : undefined;
  if (!api || typeof api.request !== 'function') {
    onRefused();
    return;
  }
  let p: Promise<Sentinel>;
  try {
    p = api.request('screen');
  } catch {
    onRefused();
    return;
  }
  p.then(
    (s) => {
      if (!wanted) void s.release().catch(() => undefined);
      else {
        if (lock && lock !== s) void lock.release().catch(() => undefined);
        lock = s;
      }
    },
    () => onRefused(),
  );
}

/** Lets the screen sleep again (T4, Pause, the app hidden). */
export function letScreenSleep(): void {
  wanted = false;
  const s = lock;
  lock = null;
  if (s) void s.release().catch(() => undefined);
}

// ---------------------------------------------------------------- Motion permission (WAI-013, Version 1.1 item 16)

type PermissionFn = () => Promise<string>;
const permissionFn = (): PermissionFn | null => {
  const D = typeof window !== 'undefined' ? (window as unknown as { DeviceOrientationEvent?: { requestPermission?: PermissionFn } }).DeviceOrientationEvent : undefined;
  return D && typeof D.requestPermission === 'function' ? D.requestPermission.bind(D) : null;
};
export const needsPermission = (): boolean => permissionFn() !== null;

/** The motion answer's states on this phone (Version 1.1 item 16). */
export const setMotionState = (prefs: Preferences, v: 'unknown' | 'granted' | 'refused' | 'taps') => prefs.set(PREF.motionState, v);

/** Motion is wanted for a hand-hold turn: the Settings switch on and, where the phone asks, not refused. */
export function motionWanted(prefs: Preferences, hold: 'hand' | 'free'): boolean {
  if (hold !== 'hand' || !motionOn(prefs)) return false;
  if (!needsPermission()) return true;
  const st = motionState(prefs);
  return st === 'granted' || st === 'unknown';
}

/** T0 shows: hand hold, the switch on, the phone asks, and it has never answered. */
export const asksFirst = (prefs: Preferences, hold: 'hand' | 'free'): boolean =>
  hold === 'hand' && motionOn(prefs) && needsPermission() && motionState(prefs) === 'unknown';

/** Motion can run this turn (permission already given, or not needed). */
export const motionReady = (prefs: Preferences, hold: 'hand' | 'free'): boolean =>
  hold === 'hand' && motionOn(prefs) && (!needsPermission() || motionState(prefs) === 'granted');

let askedThisLoad = false;

/** "Yes, move the phone": the phone's own question. True when granted. */
export async function askMotion(prefs: Preferences): Promise<boolean> {
  const fn = permissionFn();
  askedThisLoad = true;
  if (!fn) return true;
  try {
    const r = await fn();
    setMotionState(prefs, r === 'granted' ? 'granted' : 'refused');
    return r === 'granted';
  } catch {
    setMotionState(prefs, 'refused');
    return false;
  }
}

/** With `granted`, the app asks again silently on each page load's first start tap; "denied" → `refused`. */
export function askAgainSilently(prefs: Preferences): void {
  const fn = permissionFn();
  if (!fn || askedThisLoad || motionState(prefs) !== 'granted') return;
  askedThisLoad = true;
  try {
    fn().then(
      (r) => { if (r !== 'granted') setMotionState(prefs, 'refused'); },
      () => setMotionState(prefs, 'refused'),
    );
  } catch {
    setMotionState(prefs, 'refused');
  }
}

// ---------------------------------------------------------------- What the tip line knows (WAI-011; Version 1.2 items 10, 11)

const KEY = {
  /** A wake lock was refused and the screen-on tip has not shown since. */
  wakeRefused: 'whatAmI.wakeRefused',
  /** The game (`<night>:<game>`) whose T1 last showed the screen-on tip. */
  screenTipGame: 'whatAmI.screenTipGame',
  /** The game (`<night>:<game>`) of the last rotation-lock event on this phone. */
  rotationGame: 'whatAmI.rotationGame',
} as const;

export const gameKey = (night: string, game: number) => `${night}:${game}`;

export function noteWakeRefused(prefs: Preferences): void {
  prefs.set(KEY.wakeRefused, true);
}
/** "Keep your screen on during the turn." is due in this game. */
export const screenTipDue = (prefs: Preferences, game: string): boolean =>
  prefs.get<boolean>(KEY.wakeRefused, false) === true && prefs.get<string | null>(KEY.screenTipGame, null) !== game;
export function screenTipShown(prefs: Preferences, game: string): void {
  prefs.set(KEY.screenTipGame, game);
  prefs.set(KEY.wakeRefused, false);
}

/** WAI-024: a rotation-lock event, recorded at most once per game. */
export function noteRotation(prefs: Preferences, game: string): void {
  if (prefs.get<string | null>(KEY.rotationGame, null) !== game) prefs.set(KEY.rotationGame, game);
}
/** A rotation-lock event was recorded on this phone in an earlier game. */
export const rotationEarlier = (prefs: Preferences, game: string): boolean => {
  const g = prefs.get<string | null>(KEY.rotationGame, null);
  return typeof g === 'string' && g !== game;
};

// ---------------------------------------------------------------- "Riya: 5 saved · Undo" (WAI-031)

/**
 * The night whose last "Save score" was made on this page: its toast shows while the rules still allow Undo. It goes on the
 * next start tap, on "Round 2", on Home and on a reload (this page memory is gone then).
 */
let savedToastNight: string | null = null;
const listeners = new Set<() => void>();
export const savedToastFor = () => savedToastNight;
export function showSavedToast(night: string): void {
  savedToastNight = night;
  for (const l of listeners) l();
}
export function clearSavedToast(): void {
  if (savedToastNight === null) return;
  savedToastNight = null;
  for (const l of listeners) l();
}
/** Calls `fn` whenever the toast shows or goes. */
export function onSavedToast(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
