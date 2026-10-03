// PLT-016: a game long after the last one asks "Continue '…' or start a new session?" before the first number;
// "New session" then asks for its name (suggesting the day). The first game of all and later games ask nothing
// (UX list row 9: the session line above "Confirm prizes" is enough).
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
  ask: { continue: Session };
  onStart: (name: string) => void;
  onContinue: (session: Session) => void;
  onBack: () => void;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState(() => suggestedSessionName(Date.now()));
  const start = () => onStart(name.trim() || suggestedSessionName(Date.now()));
  return (
    <main className="screen setup-screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Back
        </button>
      </header>
      {naming ? (
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

/** Which session the next game joins (PLT-029): an existing one, or a new one with a name. */
export type SessionChoice =
  | { readonly kind: 'existing'; readonly session: Session }
  /** `chosen`: the host named it through "Change", so no question follows "Confirm prizes". */
  | { readonly kind: 'new'; readonly name: string; readonly chosen: boolean };

/**
 * PLT-029: one line above "Confirm prizes", "Session: Diwali at Nani's · Change". "Change" starts a new session
 * (the day as its suggested name) or picks one of up to 3 recent unsettled sessions.
 */
export function SessionLine({
  choice,
  recent,
  onChange,
}: {
  choice: SessionChoice;
  /** Sessions the host may pick instead: unsettled, recent, most recent first. */
  recent: () => readonly Session[];
  onChange: (next: SessionChoice) => void;
}) {
  const [panel, setPanel] = useState<null | 'list' | 'name'>(null);
  const [name, setName] = useState('');
  const shown = choice.kind === 'existing' ? choice.session.name : choice.name;
  const current = choice.kind === 'existing' ? choice.session.id : null;
  const options = panel === 'list' ? recent().filter((s) => s.id !== current).slice(0, 3) : [];
  const save = () => {
    onChange({ kind: 'new', name: name.trim() || suggestedSessionName(Date.now()), chosen: true });
    setPanel(null);
  };
  return (
    <>
      <p className="session-line" data-testid="session-line">
        <span className="session-line-text">
          Session: {shown}
          {choice.kind === 'new' ? ' (new)' : ''}
        </span>
        <span aria-hidden="true"> · </span>
        <button type="button" className="text-button session-change" onClick={() => setPanel('list')}>
          Change
        </button>
      </p>
      {panel && (
        <div className="backdrop">
          <div className="dialog" role="dialog" aria-modal="true" aria-label="Session">
            {panel === 'list' ? (
              <>
                <h2 className="section-title">Which session?</h2>
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => {
                    setName(suggestedSessionName(Date.now()));
                    setPanel('name');
                  }}
                >
                  New session
                </button>
                {options.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="button button-quiet"
                    onClick={() => {
                      onChange({ kind: 'existing', session: s });
                      setPanel(null);
                    }}
                  >
                    {s.name}
                  </button>
                ))}
                <button type="button" className="text-button" onClick={() => setPanel(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h2 className="section-title">New session</h2>
                <label className="field">
                  <span>Session name</span>
                  <input
                    type="text"
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') save();
                    }}
                  />
                </label>
                <div className="row">
                  <button type="button" className="button" onClick={save}>
                    Save
                  </button>
                  <button type="button" className="button button-quiet" onClick={() => setPanel('list')}>
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
