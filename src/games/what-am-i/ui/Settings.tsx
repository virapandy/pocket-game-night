// What Am I?'s switch in the app's Settings (WAI-013; Version 1.1 item 16; Version 1.2 item 14): "Answer by moving the
// phone", on unless turned off. Turning it off and on again sets the motion answer back to `unknown`, so T0 asks again on
// the next hand-hold turn. While the phone said no, the small line says how to allow motion.
import { useState } from 'react';
import type { Preferences } from '../../../engine';
import { PREF } from './night';
import { Switch } from './parts';

export type MotionState = 'unknown' | 'granted' | 'refused' | 'taps';

export const motionOn = (prefs: Preferences): boolean => prefs.get<boolean>(PREF.motion, true) !== false;
export function motionState(prefs: Preferences): MotionState {
  const v = prefs.get<unknown>(PREF.motionState, 'unknown');
  return v === 'granted' || v === 'refused' || v === 'taps' ? v : 'unknown';
}

export function WaiSettings({ prefs }: { prefs: Preferences }) {
  const [on, setOn] = useState(() => motionOn(prefs));
  const [state, setState] = useState<MotionState>(() => motionState(prefs));
  return (
    <section className="wai wai-settings" aria-label="What Am I?">
      <Switch
        label="Answer by moving the phone"
        checked={on}
        onChange={(next) => {
          prefs.set(PREF.motion, next);
          if (next) {
            prefs.set(PREF.motionState, 'unknown');
            setState('unknown');
          }
          setOn(next);
        }}
      />
      {state === 'refused' && (
        <p className="wai-small">Your phone said no. To use moving, allow motion for this site in the phone's settings.</p>
      )}
    </section>
  );
}
