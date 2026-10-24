// The browser test hooks (specs/what-am-i/api.md, "Browser hooks"): `window.__waiTest`, in every build except the release
// build. WAI-H1b (seed) and WAI-H7 (word list) apply to the next game night started on this page; WAI-H5 sets the platform;
// WAI-H8 is the sound and vibration log (the turn lane writes to it with `logSound` and `logVibrate`); WAI-H11 forgets this
// phone's stored What Am I? state.
import type { WaiWord } from '../rules';

export type Platform = 'iphone' | 'android';
export type SoundName = 'countdown' | 'got' | 'pass' | 'tick' | 'timeUp';
export interface LogEntry { readonly t: number; readonly kind: 'sound' | 'vibrate'; readonly name?: SoundName; readonly pattern?: number[] }

let enabled = false;
let nextSeed: string | null = null;
let nextWords: readonly WaiWord[] | null = null;
let platform: Platform | null = null;
const log: LogEntry[] = [];

/** Installs `window.__waiTest` (development and preview builds only). `clearPhone`: WAI-H11, given by the app. */
export function installTestHooks(opts: { release: boolean; clearPhone: () => void }): void {
  if (opts.release || typeof window === 'undefined') return;
  enabled = true;
  (window as unknown as { __waiTest: unknown }).__waiTest = {
    setSeed(seed: string) { nextSeed = String(seed); },
    setWords(words: WaiWord[]) { nextWords = Array.isArray(words) ? words.map((w) => ({ ...w })) : null; },
    setPlatform(p: Platform) { platform = p === 'iphone' ? 'iphone' : 'android'; },
    log,
    clearPhone() { opts.clearPhone(); },
  };
}

/** The seed and word list the test hooks set for the next game night (taken once). Empty in the release build. */
export function takeTestSetup(): { seed?: string; words?: readonly WaiWord[] } {
  if (!enabled) return {};
  const out = { ...(nextSeed !== null ? { seed: nextSeed } : {}), ...(nextWords !== null ? { words: nextWords } : {}) };
  nextSeed = null;
  nextWords = null;
  return out;
}

/** WAI-H5: the platform (the rotation tip's wording, vibration): the hook's, else the phone's own. */
export function platformOf(): Platform {
  if (platform) return platform;
  if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) return 'iphone';
  return 'android';
}

/** WAI-H8: every sound played (the turn lane calls this as it plays one). */
export function logSound(name: SoundName): void {
  if (enabled) log.push({ t: Date.now(), kind: 'sound', name });
}

/** WAI-H8: every vibration asked for. */
export function logVibrate(pattern: number[]): void {
  if (enabled) log.push({ t: Date.now(), kind: 'vibrate', pattern: [...pattern] });
}
