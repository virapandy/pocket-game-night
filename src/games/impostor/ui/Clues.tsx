// After the last "Done": straight to the clues (IMP-016, IMP-020, IMP-022). The phone goes in the middle, face up.
import { useEffect, useRef } from 'react';
import { useFitText } from './Deal';
import { Caps, LANDSCAPE, MainButton, QuietButton, TapGuard, useMediaQuery } from './parts';

/** The seat order from the starter, wrapping round (IMP-020). */
export function clueOrder(players: readonly string[], starter: string): string[] {
  const i = Math.max(0, players.indexOf(starter));
  return [...players.slice(i), ...players.slice(0, i)];
}

export function Clues({
  players,
  starter,
  talking,
  secondClues,
  onSecondClues,
  onTalk,
  onSeeAgain,
  announce,
}: {
  players: readonly string[];
  starter: string;
  talking: 'free' | 'timer';
  secondClues: boolean;
  onSecondClues: () => void;
  onTalk: () => void;
  /** IMP-017 (M19): the quiet "See my word again" opens "Whose word?". */
  onSeeAgain: () => void;
  announce: (text: string) => void;
}) {
  const order = clueOrder(players, starter);
  const nameRef = useRef<HTMLParagraphElement>(null);
  useFitText(nameRef, 56, 32, starter);
  const said = order.join(', ');
  useEffect(() => announce(`${starter} starts. Each say one word about your secret: ${said}`), [announce, starter, said]);
  const again = !secondClues && players.length <= 5;
  // IMP-020 (v3.8): at 812 × 375 there is no "Not enough clues?" at all (not drawn, not read out).
  const sideways = useMediaQuery(LANDSCAPE);
  // IMP-020: the starter, then the lines and the clue order, then the buttons. The order on screen comes from the CSS:
  // 360 px and up, the order of IMP-016 ("✓ Everyone…", "Phone…", the starter, "Each say…", the clue order), with "Go
  // round again" and "See my word again" stacked; at 320 px wide the starter first, then one box scrolling inside
  // with the lines and the clue order, then the two buttons side by side; at 812 × 375 the starter in the left half
  // and the rest in the right half, the two buttons sharing one row and no "Not enough clues?".
  // Guideline 20 (M18): a double tap on "Done, everyone's seen" never lands on this screen's buttons: they ignore
  // taps for 500 ms after it shows.
  return (
    <TapGuard screen="clues">
      <section className="imp-stage imp-clues">
        <div className="imp-clues-who">
          <p ref={nameRef} className="imp-starter imp-caps" data-testid="starter-name">
            {starter}
          </p>
          <p className="imp-starts">starts</p>
        </div>
        <div className="imp-clues-box">
          <div className="imp-clues-top">
            <p className="imp-body">✓ Everyone has seen their word.</p>
            <p className="imp-body">Phone in the middle, face up.</p>
          </div>
          <div className="imp-clues-rest">
            <p className="imp-body">Each say one word about your secret:</p>
            <p className="imp-body imp-clue-order" data-testid="clue-order">
              {order.join(' → ')}
            </p>
            {secondClues && (
              <p className="imp-body">
                Second round: <Caps>{starter}</Caps> starts again
              </p>
            )}
          </div>
        </div>
        {/* IMP-022 (I24): "Go round again" in the bottom bar, directly above the main button, with its small line
            above it; IMP-017: the quiet "See my word again" with it. */}
        <div className={again ? 'imp-clues-again imp-clues-two' : 'imp-clues-again'}>
          {again && !sideways && <p className="imp-small imp-clues-unsure">Not enough clues?</p>}
          <div className="imp-clues-buttons">
            {again && <QuietButton onClick={onSecondClues}>Go round again</QuietButton>}
            <QuietButton onClick={onSeeAgain}>See my word again</QuietButton>
          </div>
        </div>
      </section>
      <MainButton onClick={onTalk}>{talking === 'timer' ? 'Clues done, start timer' : 'Clues done, talk it over'}</MainButton>
    </TapGuard>
  );
}
