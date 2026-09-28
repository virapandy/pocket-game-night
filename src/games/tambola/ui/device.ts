// Phone features the host screen uses: fresh seeds, screen wake lock, vibration and a short sound.
// Each one is optional: if the phone lacks it, the game still works.

/** A fresh secret seed or id from the phone's secure random source. */
export function freshSeed(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buzz() {
  try {
    navigator.vibrate?.(30);
  } catch {
    // Not supported.
  }
}

let audio: AudioContext | null = null;

/** A short, quiet tick (TAM-135). */
export function tick() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audio.destination);
    const t = audio.currentTime;
    osc.start(t);
    osc.stop(t + 0.05);
  } catch {
    // Not supported.
  }
}

interface WakeLockHandle {
  release(): Promise<void>;
}

/**
 * Keeps the screen awake while `active`, and asks again when the app comes back to the front (TAM-110).
 * Calls `onRefused(true)` if the phone says no (or cannot), so the host sees a "keep your screen on" hint.
 */
export function keepAwake(onRefused: (refused: boolean) => void): () => void {
  let lock: WakeLockHandle | null = null;
  let stopped = false;
  const request = async () => {
    const api = (navigator as unknown as { wakeLock?: { request(type: 'screen'): Promise<WakeLockHandle> } }).wakeLock;
    if (!api) {
      onRefused(true);
      return;
    }
    try {
      const l = await api.request('screen');
      if (stopped) {
        void l.release().catch(() => {});
        return;
      }
      lock = l;
      onRefused(false);
    } catch {
      if (!stopped) onRefused(true);
    }
  };
  const onVisibility = () => {
    if (document.visibilityState === 'visible') void request();
  };
  void request();
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    stopped = true;
    document.removeEventListener('visibilitychange', onVisibility);
    void lock?.release().catch(() => {});
    lock = null;
  };
}
