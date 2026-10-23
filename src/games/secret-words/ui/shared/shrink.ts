// Text that shrinks in 1 px steps to stay on one line (SWD-030 pass-name, SWD-047 "Time's up!", SWD-125 poker line).
import { useLayoutEffect, useRef, useState } from 'react';

/**
 * The largest whole px from `max` down to `min` at which the element's text fits its width on one line. The element
 * must have `white-space: nowrap` (set while measuring) and a width of its own. Re-measured when `deps` change and on
 * resize.
 */
export function useShrinkToFit<T extends HTMLElement>(max: number, min: number, deps: readonly unknown[]) {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState(max);
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    const onResize = () => setTick((n) => n + 1);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize).catch(() => {});
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ws = el.style.whiteSpace;
    el.style.whiteSpace = 'nowrap';
    let s = max;
    el.style.fontSize = `${s}px`;
    while (s > min && el.scrollWidth > el.clientWidth + 0.5) {
      s -= 1;
      el.style.fontSize = `${s}px`;
    }
    el.style.whiteSpace = ws;
    el.style.fontSize = '';
    setSize(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, min, tick, ...deps]);
  return { ref, size };
}
