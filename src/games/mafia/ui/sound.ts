// Mafia's two sounds (MAF-082, as IMP-089): `tick` in the countdown and `ding` at "Point!" and at the end of the day timer.
// Never on B2 or N2. With sound on only (the app's sound setting); development and preview builds note each one in
// `window.__sounds`, as Impostor and Secret Words do.

export type MafiaSound = "tick" | "ding";
type Prefs = { get<T>(key: string, fallback: T): T };

const SOUNDS: Record<
  MafiaSound,
  { gain: number; wave: OscillatorType; freq: number; length: number }
> = {
  tick: { gain: 0.3, wave: "square", freq: 1000, length: 0.05 },
  ding: { gain: 0.3, wave: "sine", freq: 1320, length: 0.5 },
};
const RELEASE = import.meta.env.MODE === "release";
let audio: AudioContext | null = null;

export const soundOn = (prefs: Prefs) =>
  (prefs.get<{ sound?: unknown }>("tambola.settings", {}) ?? {}).sound !==
  false;

export function playSound(name: MafiaSound, prefs: Prefs) {
  if (!soundOn(prefs)) return;
  const s = SOUNDS[name];
  if (!RELEASE) {
    const w = window as unknown as { __sounds?: unknown[] };
    if (!Array.isArray(w.__sounds)) w.__sounds = [];
    w.__sounds.push({ name, at: Date.now(), gain: s.gain });
  }
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    if (audio.state === "suspended") void audio.resume().catch(() => {});
    const t0 = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = s.wave;
    osc.frequency.value = s.freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(s.gain, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + s.length);
    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + s.length + 0.02);
  } catch {
    // No sound on this phone.
  }
}
