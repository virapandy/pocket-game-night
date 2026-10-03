// "That's the night!" (IMP-092, IMP-095, IMP-097, IMP-098, IMP-101, IMP-106): fun lines, the final scoreboard or the
// summary line, and the ways out. Leaving records `endEvening` (the Game does it); "Share" does not leave.
import { useState } from 'react';
import type { ImpostorState } from '../rules';
import { Dialog, MainButton, QuietButton, Toast, useToast } from './parts';
import { Scoreboard } from './Reveal';
import { counts, funLines, plural, scoreRows, shareText, type Story } from './story';

export function Summary({
  state,
  story,
  canOops,
  onOops,
  onHome,
  onSomethingElse,
  onHistory,
  onDiscard,
}: {
  state: ImpostorState;
  story: Story;
  /** "Oops, keep playing": only within 3 hours of the summary first showing, and before `endEvening` (IMP-099). */
  canOops: boolean;
  onOops: () => void;
  onHome: () => void;
  onSomethingElse: () => void;
  onHistory: () => void;
  onDiscard: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const [toast, showToast, clearToast] = useToast();
  const c = counts(story);
  const none = c.rounds === 0;
  const fun = none ? [] : funLines(state, story).lines;
  const board = !none && story.scoreEver;

  const share = () => {
    const text = shareText(state, story);
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (typeof nav.share === 'function') {
      // Closing the share sheet without choosing an app: nothing else happens.
      try {
        void nav.share({ text }).catch(() => {});
      } catch {
        // Refused by the phone: nothing else happens.
      }
      return;
    }
    try {
      void navigator.clipboard?.writeText(text).catch(() => {});
    } catch {
      // No clipboard: the toast still says what to do.
    }
    showToast('Copied. Paste it into any chat.');
  };

  return (
    <main className="imp-screen imp-summary">
      <div className="imp-screen-inner">
        <div className="imp-scroll">
          <h1 className="imp-title">That's the night!</h1>
          {fun.map((line) => (
            <p key={line} className="imp-body imp-fun" data-testid="fun-line">
              {line}
            </p>
          ))}
          {board ? (
            <Scoreboard rows={scoreRows(state, story)} scoresFrom={story.firstScored} />
          ) : (
            <p className="imp-body" data-testid="summary-line">
              {plural(c.rounds, 'round')} · impostor caught {c.caught} · escaped {c.escaped}
            </p>
          )}
          <div className="imp-summary-quiet">
            {canOops && <QuietButton onClick={onOops}>Oops, keep playing</QuietButton>}
            <QuietButton onClick={onSomethingElse}>Play something else</QuietButton>
            {!none && <QuietButton onClick={share}>Share</QuietButton>}
            <QuietButton onClick={onHistory}>History</QuietButton>
            <QuietButton onClick={() => setAsking(true)}>Discard this evening</QuietButton>
          </div>
        </div>
      </div>
      <Toast toast={toast} onDone={clearToast} />
      {!asking && <MainButton onClick={onHome}>Back to Home</MainButton>}
      {asking && (
        <Dialog text="Discard this evening? Its rounds and scores will be lost.">
          <QuietButton onClick={onDiscard}>Discard</QuietButton>
          <MainButton inline onClick={() => setAsking(false)}>
            Keep it
          </MainButton>
        </Dialog>
      )}
    </main>
  );
}
