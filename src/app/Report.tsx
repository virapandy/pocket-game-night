// "Report a problem" (Phase 7, PLT-200 to PLT-203, PLT-206 to PLT-209): the form with its preview of exactly what
// will be sent, the calm message after a crash, and the list of reports waiting to send (in Settings).
import { useEffect, useMemo, useState } from 'react';
import { reportText, type Report } from '../engine';
import { deleteWaiting, onReportsChange, waitingReports } from './reports';
import { Dialog } from './Sessions';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (t: number) => {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const firstLine = (r: Report) => r.what.split('\n')[0]?.trim() || (r.error ? 'After an unexpected error' : 'No words');

/** The form: "What happened?", a preview of exactly what will be sent (PLT-201), Send report and Cancel. */
export function ReportForm({
  build,
  onSend,
  onCancel,
}: {
  /** Makes the report for the words typed (same id and time every time). */
  build: (what: string) => Report;
  onSend: (report: Report) => void;
  onCancel: () => void;
}) {
  const [what, setWhat] = useState('');
  const report = useMemo(() => build(what), [build, what]);
  const text = reportText(report);
  const game = report.game;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="backdrop report-backdrop">
      <div className="dialog report-form" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <h2 id="report-title" className="section-title">
          Report a problem
        </h2>
        <div className="field">
          <label htmlFor="report-what">What happened?</label>
          <textarea id="report-what" rows={3} value={what} onChange={(e) => setWhat(e.target.value)} />
        </div>
        <p className="note">Optional. Player names are changed to Player 1, Player 2 … No money amounts are included.</p>
        {report.waitingForGameEnd && <p className="note report-wait">Your report will be sent when this game ends.</p>}
        <section className="report-preview" data-testid="report-preview" data-payload={text} aria-label="What will be sent">
          <h3 className="report-preview-title">What will be sent</h3>
          <p>Words: {report.what === '' ? '(none)' : report.what}</p>
          <p>App version: {report.appVersion}</p>
          <p>Phone: {report.phone}</p>
          {report.error && <p>Error: {report.error.message}</p>}
          {game && (
            <p>
              Game: {game.gameType}, {game.records.length} {game.records.length === 1 ? 'move' : 'moves'}
              {report.waitingForGameEnd ? ' (its secret numbers are added only when the game ends)' : ', with its seeds so it can be replayed'}
            </p>
          )}
          {report.tickets && <p>Your {report.tickets.length === 1 ? 'ticket' : 'tickets'} and marks: {report.tickets.map((t) => `Ticket ${t.ticket}`).join(', ')}</p>}
          <details>
            <summary>Show everything</summary>
            <pre className="report-text">{text}</pre>
          </details>
        </section>
        <div className="row">
          <button type="button" className="button" onClick={() => onSend(report)}>
            Send report
          </button>
          <button type="button" className="button button-quiet" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** PLT-203: after an unexpected error. Never sends anything by itself. */
export function CrashNotice({ onReport, onDismiss }: { onReport: () => void; onDismiss: () => void }) {
  return (
    <div className="crash-notice" role="alert">
      <p>Something went wrong; your game is safe.</p>
      <p className="note">You can tell us what happened, if you like.</p>
      <div className="row">
        <button type="button" className="button" onClick={onReport}>
          Report…
        </button>
        <button type="button" className="button button-quiet" onClick={onDismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}

/** A short line after sending; it never blocks a tap. */
export function ReportToast({ text }: { text: string }) {
  return (
    <p className="report-toast" role="status">
      {text}
    </p>
  );
}

/** PLT-209: Settings → "Reports waiting to send": each with its date and first line, and Delete. */
export function WaitingReports() {
  const [list, setList] = useState<Report[]>(waitingReports);
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState<Report | null>(null);
  useEffect(() => {
    const refresh = () => setList(waitingReports());
    const off = onReportsChange(refresh);
    const t = setInterval(refresh, 2_000);
    return () => {
      off();
      clearInterval(t);
    };
  }, []);
  return (
    <section className="stack-tight" aria-label="Problem reports">
      <button type="button" className="button button-quiet" aria-expanded={open} onClick={() => setOpen(!open)}>
        Reports waiting to send ({list.length})
      </button>
      {open &&
        (list.length === 0 ? (
          <p className="note">No reports waiting.</p>
        ) : (
          <ul className="waiting-list">
            {list.map((r) => (
              <li key={r.id} className="waiting-row" data-testid="waiting-report">
                <span>
                  <strong>{day(r.at)}</strong> {firstLine(r)}
                  {r.waitingForGameEnd && <span className="note"> (waits for its game to end)</span>}
                </span>
                <button type="button" className="button button-quiet" onClick={() => setAsking(r)}>
                  Delete…
                </button>
              </li>
            ))}
          </ul>
        ))}
      {asking && (
        <Dialog>
          <p className="lead">Delete this report? It will not be sent.</p>
          <div className="row">
            <button
              type="button"
              className="button"
              onClick={() => {
                deleteWaiting(asking.id);
                setAsking(null);
              }}
            >
              Delete report
            </button>
            <button type="button" className="button button-quiet" onClick={() => setAsking(null)}>
              Keep
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
