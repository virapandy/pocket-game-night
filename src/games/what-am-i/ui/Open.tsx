// What Am I? outside its own screens (lane W2): Home's unfinished row (WAI-090, WAI-091), the shared Start new dialog
// (WAI-001, Version 1.1 item 41) and a past game night in History (WAI-092).
import { BlocksRoot, QuietButton, Screen, ScreenContent, keepNames } from '../../../blocks';
import type { SavedGame } from '../../../engine';
import { joinNames } from '../rules';
import { historyTitle, loadNight } from './night';
import { Main, useWaiBack } from './parts';
import './wai.css';

/** Home's row: one button of two lines, "What Am I? · Round 2 · Arjun's turn" / "Riya, Arjun +4 · 8:05 pm · Tap to resume". */
export function NightRowButton({ row, onClick }: { row: { line1: string; line2: string }; onClick: () => void }) {
  return (
    <button type="button" className="wai-night-row" onClick={onClick}>
      <span className="wai-row-line">{keepNames(row.line1)}</span>
      <span className="wai-row-more">{row.line2}</span>
    </button>
  );
}

/** "Start a new game night?": two equal quiet buttons, no main button (Version 1.1 item 41). */
export function StartNewNightDialog({ text, onCarryOn, onStartNew }: { text: string; onCarryOn: () => void; onStartNew: () => void }) {
  return (
    <BlocksRoot className="wai">
      <div className="wai-backdrop">
        <div className="wai-dialog" role="dialog" aria-modal="true" aria-labelledby="wai-start-new">
          <h1 id="wai-start-new" className="wai-dialog-title">
            Start a new game night?
          </h1>
          <p className="wai-body">{text}</p>
          <div className="wai-equal">
            <QuietButton onClick={onCarryOn}>Carry on that one</QuietButton>
            <QuietButton onClick={onStartNew}>Start new (ends that one)</QuietButton>
          </div>
        </div>
      </div>
    </BlocksRoot>
  );
}

const dateTime = (t: number) =>
  new Date(t).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

/** WAI-092: a past game night: its players and games; "Play again" opens S1 with its players and S2 with its choices. */
export function PastNight({ saved, onBack, onPlayAgain }: { saved: SavedGame; onBack: () => void; onPlayAgain: () => void }) {
  useWaiBack(true, 0, onBack);
  const match = loadNight(saved);
  const s = match?.state;
  return (
    <BlocksRoot className="wai">
      <Screen page className="wai-setup wai-past">
        <ScreenContent>
          <header className="wai-bar">
            <QuietButton onClick={onBack}>← Back</QuietButton>
          </header>
          <h1 className="pgn-title">{keepNames(historyTitle(saved) ?? 'What Am I?')}</h1>
          <p className="wai-small">{dateTime(saved.createdAt)}</p>
          {s && s.past.length > 0 && <p className="wai-body">{joinNames(playersOf(s.past))}</p>}
          {s && (
            <ol className="wai-lines">
              {s.past
                .filter((g) => g.turns.length > 0)
                .map((g) => (
                  <li key={g.result.game}>
                    {`Game ${g.result.game}: `}
                    {g.result.winners.length === 0
                      ? 'nobody got a word'
                      : `${joinNames(g.result.winners)} ${g.result.winners.length === 1 ? 'won' : 'shared the win'} with ${g.result.top}`}
                  </li>
                ))}
            </ol>
          )}
        </ScreenContent>
        {s && <Main onClick={onPlayAgain}>Play again</Main>}
      </Screen>
    </BlocksRoot>
  );
}

function playersOf(past: readonly { turns: readonly { player: string }[] }[]): string[] {
  const out: string[] = [];
  for (const g of past) for (const t of g.turns) if (!out.includes(t.player)) out.push(t.player);
  return out;
}
