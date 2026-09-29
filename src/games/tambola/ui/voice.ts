// The phone's voice (TAM-180, TAM-185, TAM-187): optional, off in every new game. Uses the browser's built-in
// speech (speechSynthesis), which needs no internet when the phone's voice is installed. Nothing here is
// required: without a voice the game carries on and the anchor calls.
import type { Rhyme } from '../rules';

interface Part {
  readonly text: string;
  readonly voice: SpeechSynthesisVoice | null;
  readonly lang: string;
}

function synth(): SpeechSynthesis | null {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return null;
    return window.speechSynthesis;
  } catch {
    return null;
  }
}

/** Can this phone speak at all? (TAM-180: if not, the option is greyed out.) */
export function hasVoice(): boolean {
  return synth() !== null;
}

const lang = (v: SpeechSynthesisVoice) => (v.lang ?? '').replace('_', '-').toLowerCase();

function voices(): SpeechSynthesisVoice[] {
  try {
    return synth()?.getVoices() ?? [];
  } catch {
    return [];
  }
}

/** Indian English first, otherwise any English voice (TAM-180). */
function englishVoice(): SpeechSynthesisVoice | null {
  const all = voices();
  return all.find((v) => lang(v) === 'en-in') ?? all.find((v) => lang(v).startsWith('en')) ?? null;
}

function hindiVoice(): SpeechSynthesisVoice | null {
  return voices().find((v) => lang(v).startsWith('hi')) ?? null;
}

/**
 * Says the call: the number, the rhyme exactly as shown, then the number again. A Hindi rhyme is said only
 * in a Hindi voice; without one, only the number is said. An English rhyme (also the fallback in a Hindi
 * game, TAM-153) is said in the English voice. `onFail` is told if the phone cannot speak (TAM-187).
 */
export function speakCall(n: number, rhyme: Rhyme | null, onFail: () => void) {
  const s = synth();
  if (!s) return;
  const en = englishVoice();
  const number: Part = { text: String(n), voice: en, lang: en?.lang ?? 'en-IN' };
  const parts: Part[] = [number];
  if (rhyme && rhyme.text.trim() !== '') {
    if (rhyme.lang === 'hi') {
      const hi = hindiVoice();
      if (hi) parts.push({ text: rhyme.text, voice: hi, lang: hi.lang }, number);
    } else {
      parts.push({ text: rhyme.text, voice: en, lang: en?.lang ?? 'en-IN' }, number);
    }
  }
  try {
    // A new call replaces anything still being said.
    if (s.speaking || s.pending) s.cancel();
    for (const p of parts) {
      const u = new SpeechSynthesisUtterance(p.text);
      if (p.voice) u.voice = p.voice;
      u.lang = p.lang;
      u.addEventListener('error', (e) => {
        const why = (e as SpeechSynthesisErrorEvent).error;
        if (why === 'interrupted' || why === 'canceled') return;
        onFail();
      });
      s.speak(u);
    }
  } catch {
    onFail();
  }
}

/** Stops speaking at once (mute, or leaving the game). */
export function hush() {
  try {
    synth()?.cancel();
  } catch {
    // Nothing to stop.
  }
}
