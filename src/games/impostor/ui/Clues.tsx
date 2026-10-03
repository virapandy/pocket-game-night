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
  useEffect(() => announce(`${starter} starts, then clockwise: ${said}`), [announce, starter, said]);
  return (
    <>
      <section className="imp-stage imp-clues">
        <p className="imp-body">✓ Everyone has seen their word.</p>
        <p className="imp-body">Phone in the middle, face up.</p>
        <p ref={nameRef} className="imp-starter imp-caps" data-testid="starter-name">
          {starter}
        </p>
        <p className="imp-starts">starts</p>
        <p className="imp-body imp-clue-order" data-testid="clue-order">
          then clockwise: {order.join(' → ')}
        </p>
        {secondClues && (
          <p className="imp-body">
            Second round: <Caps>{starter}</Caps> starts again
          </p>
        )}
        {!secondClues && players.length <= 5 && <QuietButton onClick={onSecondClues}>Another round of clues</QuietButton>}
      </section>
      <MainButton onClick={onTalk}>{talking === 'timer' ? 'Start the 2-minute timer' : 'Talk it over'}</MainButton>
    </>
  );
}
