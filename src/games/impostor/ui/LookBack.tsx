// IMP-105: looking back at a kept evening: the players, the choices, one row per completed round (with its points
// when scored), the fun lines and, when scored, the final scoreboard. Read-only (PLT-008).
import type { EveningMatch } from './evening';
import { Scoreboard } from './Reveal';
import { funLines, pointsText, roundLine, scoreRows, storyOf } from './story';

export function LookBack({ match }: { match: EveningMatch }) {
  const story = storyOf(match.setup, match.records);
  const state = match.state;
  const c = state.choices;
  const choices = [
    c.mode === 'hard' ? 'Hard' : 'Easy',
    c.talking === 'timer' ? 'Timer' : 'Free flow',
    c.score ? 'Score: Yes' : 'Score: No',
    c.words === 'grownups' ? '+ Grown-ups' : 'Whole family',
  ].join(' · ');
  const fun = funLines(state, story).lines;
  return (
    <>
      <p className="imp-body">{state.players.join(', ')}</p>
      <p className="imp-small">{choices}</p>
      {story.rounds.length > 0 && (
        <ol className="imp-look-rounds">
          {story.rounds.map((r, i) => {
            const pts = pointsText(r);
            return (
              <li key={i} className="imp-body" data-testid="history-round">
                <span className="imp-look-line">{roundLine(r)}</span>
                {pts !== null && <span className="imp-look-line imp-small">{pts}</span>}
              </li>
            );
          })}
        </ol>
      )}
      {fun.map((line) => (
        <p key={line} className="imp-body" data-testid="fun-line">
          {line}
        </p>
      ))}
      {story.scoreEver && story.rounds.some((r) => !r.practice) && (
        <Scoreboard rows={scoreRows(state, story)} scoresFrom={story.firstScored} />
      )}
    </>
  );
}
