// The host hands out phone tickets (Phase 2, docs/games/tambola/ux-phone-tickets.md, section 1): one ticket at
// a time, already named for its player ("Ticket 3 → Riya (1 of 2)"), with a large QR that opens the app on the
// player's phone and a typed code for when scanning fails (TAM-117, TAM-132, TAM-172). The host confirms each
// hand-out; nothing comes back from the phones (offline). Late joiners get theirs the same way (TAM-212).
import { useState } from 'react';
import { encodeTicket, ticketInfo, typedCode, type TambolaView } from '../rules';
import { QrCode } from './qr';

/** The app's own address with the ticket in it, so a phone's camera opens the app (TAM-117). */
export function ticketLink(text: string): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin).href;
  return `${base}#t=${text}`;
}

export function HandOut({
  view,
  queue,
  index,
  startedAt,
  late,
  calls,
  onAssign,
  onPaper,
  onNext,
  onDone,
  onBack,
}: {
  view: TambolaView;
  /** The tickets to hand out, in order. */
  queue: readonly number[];
  /** How many are handed out so far; the one at this position is on screen. */
  index: number;
  startedAt: number;
  late: boolean;
  calls: number;
  onAssign: (ticket: number, playerId: string) => string | null;
  onPaper: (playerId: string) => void;
  onNext: () => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const number = queue[Math.min(index, queue.length - 1)];
  const ticket = view.tickets.find((t) => t.number === number);
  const nameOf = (id: string | undefined) => view.players.find((p) => p.id === id)?.name ?? '';
  const last = index >= queue.length - 1;

  // Who still needs a ticket: this one and every later one, by player (TAM-132).
  const waiting = new Map<string, number>();
  for (const n of queue.slice(index)) {
    const owner = view.tickets.find((t) => t.number === n)?.playerId;
    if (owner) waiting.set(owner, (waiting.get(owner) ?? 0) + 1);
  }
  const doneLabel = late && calls > 0 ? 'Back to calling' : 'Start calling';

  if (!ticket || number === undefined) {
    return (
      <main className="screen" data-testid="hand-out">
        <p className="lead">Every ticket is handed out.</p>
        <button type="button" className="button button-big" onClick={onDone}>
          {doneLabel}
        </button>
      </main>
    );
  }
  const owner = ticket.playerId!;
  const mine = view.tickets.filter((t) => t.playerId === owner).map((t) => t.number);
  const info = ticketInfo(view, number, startedAt);
  const link = ticketLink(encodeTicket(info));

  return (
    <main className="screen hand-out" data-testid="hand-out">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Back
        </button>
        <span className="bar-progress">Hand out tickets</span>
        <span className="game-code" data-testid="game-code">
          Game {view.code}
        </span>
      </header>
      <p className="hand-out-ticket" data-testid="hand-out-ticket">
        Ticket {number} →{' '}
        <button type="button" className="text-button hand-out-name" aria-expanded={picking} onClick={() => setPicking(!picking)}>
          {nameOf(owner)}
        </button>{' '}
        ({mine.indexOf(number) + 1} of {mine.length})
      </p>
      {picking ? (
        <div className="stack-tight">
          <p className="note">Give ticket {number} to:</p>
          <div className="choice-grid">
            {view.players
              .filter((p) => p.id !== owner)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="button button-quiet"
                  onClick={() => {
                    const why = onAssign(number, p.id);
                    setError(why);
                    if (!why) setPicking(false);
                  }}
                >
                  {p.name}
                </button>
              ))}
          </div>
          <button type="button" className="button button-quiet" onClick={() => setPicking(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="hand-out-qr">
          <QrCode text={link} testId="ticket-qr" size={240} label={`QR code for ticket ${number}`} />
          <p className="note">Scan with your phone's camera</p>
          <p className="note">
            or type: <strong className="ticket-code" data-testid="ticket-code">{typedCode(info)}</strong>
          </p>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="note" data-testid="hand-out-progress">
        {index} of {queue.length} handed out
      </p>
      <p className="note" data-testid="hand-out-waiting">
        Waiting: {[...waiting.entries()].map(([id, n]) => `${nameOf(id)} ${n}`).join(', ')}
      </p>
      <div className="bottom-action bottom-actions">
        <button type="button" className="button button-quiet" onClick={() => onPaper(owner)}>
          Can't scan? Give a paper ticket
        </button>
        <button type="button" className="button button-big" onClick={last ? onDone : onNext}>
          {last ? doneLabel : 'Next ticket'}
        </button>
      </div>
    </main>
  );
}
