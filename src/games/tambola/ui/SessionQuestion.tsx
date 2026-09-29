// PLT-016: before the first number, the first game of a gathering asks for a session name (suggesting the day),
// and a game long after the last one asks "Continue '…' or start a new session?". Later games join silently.
import { useState } from 'react';
import type { Session } from '../../../engine';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The day, in the phone's time zone: "Sunday 4 Oct". */
export function suggestedSessionName(now: number): string {
  const d = new Date(now);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function SessionQuestionScreen({
  ask,
  onStart,
  onContinue,
  onBack,
}: {
  ask: 'name' | { continue: Session };
  onStart: (name: string) => void;
  onContinue: (session: Session) => void;
  onBack: () => void;
}) {
  const [naming, setNaming] = useState(ask === 'name');
  const [name, setName] = useState(() => suggestedSessionName(Date.now()));
  const start = () => onStart(name.trim() || suggestedSessionName(Date.now()));
  return (
    <main className="screen setup-screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Back
        </button>
      </header>
      {naming || ask === 'name' ? (
        <>
          <section className="stack setup-body">
            <h1 className="step-title">New session</h1>
            <p className="lead">Games played together make a session. Its tally adds up who owes whom.</p>
            <label className="field">
              <span>Session name</span>
              <input
                type="text"
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') start();
                }}
              />
            </label>
          </section>
          <div className="bottom-action">
            <button type="button" className="button button-big" onClick={start}>
              Start
            </button>
          </div>
        </>
      ) : (
        <section className="stack setup-body">
          <h1 className="step-title">Which session?</h1>
          <p className="lead">Continue '{ask.continue.name}' or start a new session?</p>
          <button type="button" className="button button-big" onClick={() => onContinue(ask.continue)}>
            Continue '{ask.continue.name}'
          </button>
          <button type="button" className="button button-quiet button-big" onClick={() => setNaming(true)}>
            New session
          </button>
        </section>
      )}
    </main>
  );
}
