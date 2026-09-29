// The browser tests' `test` and `expect`: Playwright's own, plus one change that keeps the computer quiet.
// Every page starts with its sound turned down to nothing, so running the tests makes no beeps or speech on
// the machine running them. Nothing the tests check changes: the app still makes its tick (TAM-135) and still
// asks the phone to speak (TAM-180 and later) exactly as before; only the loudness is zero.
//  - Web Audio (the tick): whatever the app connects to the speakers goes through a gain of 0 first.
//  - Speech (the phone's real voice): each utterance is spoken at volume 0. Tests that stand in for the voice
//    (`fakeVoices` in helpers.ts) replace speechSynthesis afterwards, so they see what they always saw.
// On Android (Chromium), the browser is also started with --mute-audio (tests/playwright.config.ts).
import { test as base } from '@playwright/test';

export * from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      const w = window as any;
      try {
        const Base = w.BaseAudioContext ?? w.AudioContext ?? w.webkitAudioContext;
        const desc = Base && Object.getOwnPropertyDescriptor(Base.prototype, 'destination');
        if (desc?.get) {
          const silent = new WeakMap<object, AudioNode>();
          Object.defineProperty(Base.prototype, 'destination', {
            configurable: true,
            get(this: BaseAudioContext) {
              let node = silent.get(this);
              if (!node) {
                const real = desc.get!.call(this) as AudioDestinationNode;
                const gain = this.createGain();
                gain.gain.value = 0;
                gain.connect(real);
                node = gain;
                silent.set(this, node);
              }
              return node;
            },
          });
        }
      } catch {
        // No Web Audio here: nothing to silence.
      }
      try {
        const synth = w.speechSynthesis;
        if (synth && typeof synth.speak === 'function') {
          const speak = synth.speak.bind(synth);
          synth.speak = (u: SpeechSynthesisUtterance) => {
            try {
              u.volume = 0;
            } catch {
              // Read-only volume: speak as is.
            }
            return speak(u);
          };
        }
      } catch {
        // No speech here: nothing to silence.
      }
    });
    await use(context);
  },
});
