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
