// TAM-069: a one-page guide with a sample ticket. Part of the app, so it works offline.

const SAMPLE: (number | null)[][] = [
  [4, null, 23, null, 41, null, 62, null, 85],
  [null, 12, null, 36, 47, null, null, 78, 88],
  [7, null, 29, null, null, 55, 68, 71, null],
];

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <main className="screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Back
        </button>
      </header>
      <h1 className="step-title">How to play Tambola</h1>
      <p className="lead">Everyone has a ticket. The anchor calls numbers from 1 to 90, one at a time, with a rhyme.</p>
      <div className="sample-ticket" data-testid="sample-ticket" aria-label="A sample ticket">
        {SAMPLE.flat().map((n, i) => (
          <div key={i} className={n === null ? 'ticket-cell empty' : 'ticket-cell'}>
            {n ?? ''}
          </div>
        ))}
      </div>
      <p className="note">A ticket has 3 rows of 5 numbers. Each column holds its own range: 1–9, 10–19 … 80–90.</p>
      <ol className="rules-list">
        <li>When a number on your ticket is called, mark it.</li>
        <li>
          When you complete a pattern, shout it straight away, before the next number: <strong>Early Five</strong> (any 5 numbers),{' '}
          <strong>Top, Middle or Bottom Line</strong>, <strong>Four Corners</strong>, or <strong>Full House</strong> (all 15).
        </li>
        <li>Read your numbers out. The host checks them on this phone. A wrong or late claim is a bogey.</li>
        <li>The pot is shared as prizes. The app only works out the amounts: money changes hands in person.</li>
      </ol>
    </main>
  );
}
