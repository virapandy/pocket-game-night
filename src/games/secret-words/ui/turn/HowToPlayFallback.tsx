// A stand-in for How to play (SWD-011, 131), used only until lane A's How to play screen is passed in as `howToPlay`.
// It shows the clue rules (the part the dispute dialog's "Clue rules" opens at) and "Done".
import { useLayoutEffect, useRef } from 'react';
import { SwMain, useGuard } from '../shared/guard';

export function HowToPlayFallback({ onDone, at }: { onDone: () => void; at?: 'clue-rules' }) {
  const until = useGuard('how-to-play');
  const rules = useRef<HTMLHeadingElement | null>(null);
  useLayoutEffect(() => {
    if (at === 'clue-rules') rules.current?.scrollIntoView({ block: 'start' });
  }, [at]);
  return (
    <div className="sw-sheet" role="dialog" aria-modal="true" aria-label="How to play">
      <div className="sw-sheet-body">
        <h1 className="sw-h1">How to play</h1>
        <h2 ref={rules} className="sw-heading2">
          Clue rules
        </h2>
        <ol>
          <li>One word only. Names like Taj Mahal count as one.</li>
          <li>About meaning: no spelling, no rhymes, no 'top left'.</li>
          <li>
            Not a word on the board, or a form or part of one (no 'rail' while Railway is face down). Letters inside another
            word are fine (Pan with Japan).
          </li>
          <li>English, or a word you'd use in English (chai, dosa).</li>
        </ol>
      </div>
      <SwMain until={until} onClick={onDone}>
        Done
      </SwMain>
    </div>
  );
}
