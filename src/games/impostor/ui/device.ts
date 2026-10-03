// The phone around the screens: screen awake (IMP-087), vibration (IMP-012), and the page being hidden (IMP-018).
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

type Lock = { release: () => Promise<void> };
type WakeLockApi = { request: (type: 'screen') => Promise<Lock> };

/**
 * IMP-087: asks the phone to keep the screen on while `active` (from a round's first screen A to its result), again
 * on every return to visible, and again for each new `key` (a new round). Missing or refused: nothing else happens.
 */
export function useWakeLock(active: boolean, key: unknown) {
  const lock = useRef<Lock | null>(null);
  useEffect(() => {
    if (!active) return;
    let live = true;
    const request = () => {
      try {
        const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
        if (!api || typeof api.request !== 'function') return;
        api
          .request('screen')
          .then((l) => {
            if (live) lock.current = l;
            else void l.release().catch(() => {});
          })
          .catch(() => {});
      } catch {
        // Not allowed here: nothing to do.
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
      const l = lock.current;
      lock.current = null;
      if (l) void l.release().catch(() => {});
    };
  }, [active, key]);
}

/** IMP-012: a 10 ms buzz on each press of the pad, only where the phone can vibrate. */
export function buzz() {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
  } catch {
    // Not allowed: nothing to do.
  }
}

/** True while the page is hidden (IMP-018's privacy cover). `onReturn` runs on each return to visible. */
export function usePageHidden(onReturn: () => void): boolean {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden');
  const back = useRef(onReturn);
  back.current = onReturn;
  useEffect(() => {
    let wasHidden = document.visibilityState === 'hidden';
    const onChange = () => {
      const now = document.visibilityState === 'hidden';
      // In the same event, so the cover is drawn before the phone takes its app-switcher picture.
      flushSync(() => {
        setHidden(now);
        if (wasHidden && !now) back.current();
      });
      wasHidden = now;
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return hidden;
}

// ---- Sounds and voice (IMP-089, Test hooks item 7) ----

export type SoundName = 'tick' | 'ding' | 'chime' | 'drumroll';

/** Each sound's notes: [frequency Hz, start s, length s] and its peak gain. `chime` and `drumroll` are no louder than `tick`. */
const SOUNDS: Record<SoundName, { gain: number; wave: OscillatorType; notes: [number, number, number][] }> = {
  tick: { gain: 0.3, wave: 'square', notes: [[1000, 0, 0.05]] },
  ding: { gain: 0.3, wave: 'sine', notes: [[1320, 0, 0.5]] },
  chime: { gain: 0.25, wave: 'sine', notes: [[784, 0, 0.35], [1047, 0.3, 0.6]] },
  drumroll: { gain: 0.2, wave: 'triangle', notes: Array.from({ length: 16 }, (_, i) => [110 + (i % 2) * 20, i * 0.09, 0.07] as [number, number, number]) },
};

const RELEASE = import.meta.env.MODE === 'release';
let audio: AudioContext | null = null;

/** The app's existing sound setting (on unless the host turned it off). */
type Prefs = { get<T>(key: string, fallback: T): T };
const settings = (prefs: Prefs) => prefs.get<{ sound?: unknown; speakCalls?: unknown }>('tambola.settings', {}) ?? {};
export const soundOn = (prefs: Prefs) => settings(prefs).sound !== false;
/** The app's existing phone-voice setting (off by default). */
export const voiceOn = (prefs: Prefs) => settings(prefs).speakCalls === true;

/** Plays one named sound with Web Audio, only with sound on; development and preview builds note it in `window.__sounds`. */
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
    // No sound on this phone: nothing else happens.
  }
}

/** Says a countdown word aloud, only with phone voice on (IMP-030). */
export function speak(text: string, prefs: Prefs) {
  if (!voiceOn(prefs)) return;
  try {
    if (typeof speechSynthesis === 'undefined') return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN';
    speechSynthesis.speak(u);
  } catch {
    // No voice: nothing else happens.
  }
}

