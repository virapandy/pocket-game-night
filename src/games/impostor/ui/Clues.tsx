// After the last "Done": straight to the clues (IMP-016, IMP-020, IMP-022). The phone goes in the middle, face up.
import { useEffect, useRef } from 'react';
import { useFitText } from './Deal';
import { Caps, MainButton, QuietButton } from './parts';

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
  announce,
}: {
  players: readonly string[];
  starter: string;
  talking: 'free' | 'timer';
  secondClues: boolean;
  onSecondClues: () => void;
  onTalk: () => void;
  announce: (text: string) => void;
}) {
  const order = clueOrder(players, starter);
  const nameRef = useRef<HTMLParagraphElement>(null);
  useFitText(nameRef, 56, 32, starter);
  const said = order.join(', ');
  useEffect(() => announce(`${starter} starts. Each say one word about your secret: ${said}`), [announce, starter, said]);
  // IMP-020: in landscape the starter sits in the left half; everything else, buttons included, in the right half.
  // IMP-022: "Go round again" sits at the bottom, directly above the main button (bottom right in landscape).
  return (
    <>
      <section className="imp-stage imp-clues">
        <div className="imp-clues-top">
          <p className="imp-body">✓ Everyone has seen their word.</p>
          <p className="imp-body">Phone in the middle, face up.</p>
        </div>
        <div className="imp-clues-who">
          <p ref={nameRef} className="imp-starter imp-caps" data-testid="starter-name">
            {starter}
          </p>
          <p className="imp-starts">starts</p>
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
        {/* IMP-022 (I24): in the bottom bar, directly above the main button, with its small line above it. */}
        {!secondClues && players.length <= 5 && (
          <div className="imp-clues-again">
            <p className="imp-small">Not enough clues?</p>
            <QuietButton onClick={onSecondClues}>Go round again</QuietButton>
          </div>
        )}
      </section>
      <MainButton onClick={onTalk}>{talking === 'timer' ? 'Clues done, start timer' : 'Clues done, talk it over'}</MainButton>
    </>
  );
}
