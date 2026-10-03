// The host hands out phone tickets (Phase 2, docs/games/tambola/ux-phone-tickets.md, section 1): one ticket at
// a time, already named for its player ("Ticket 3 → Riya (1 of 2)"), with a large QR that opens the app on the
// player's phone and a typed code for when scanning fails (TAM-117, TAM-132, TAM-172). The host confirms each
// hand-out; nothing comes back from the phones (offline). Late joiners get theirs the same way (TAM-212).
import { Fragment, useState, type ReactNode } from 'react';
import { encodeTicket, ticketInfo, typedCode, type TambolaView } from '../rules';
import { QrCode } from './qr';

/** The typed code in its groups of 4: a narrow screen may wrap it between groups (after a dash), never inside one. */
function codeGroups(code: string): ReactNode[] {
  const groups = code.split('-');
  return groups.map((group, i) =>
    i < groups.length - 1 ? (
      <Fragment key={i}>
        <span>{group}-</span>
        <wbr />
      </Fragment>
    ) : (
      <span key={i}>{group}</span>
    ),
  );
}

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
  notice,
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
  /** UX list row 8 (TAM-058): "Kabir plays on paper · Undo", shown until the first number is called. */
  notice?: ReactNode;
  onAssign: (ticket: number, playerId: string) => string | null;
  onPaper: (playerId: string) => void;
  onNext: () => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** UX list row 7 (TAM-132): "Start calling" while a ticket still waits asks first. */
  const [asking, setAsking] = useState(false);
  /** Row 7 (C2): the ticket the host chose "Not yet, hand it out" for; the next "Start calling" for it doesn't ask again. */
  const [askedFor, setAskedFor] = useState<number | null>(null);
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
      <main className="screen hand-out" data-testid="hand-out">
        <div className="hand-out-body stack">
          <p className="lead">Every ticket is handed out.</p>
          {notice}
        </div>
        {/* UX list row 10 (TAM-181): the main button full width at the bottom, as on every hand-out screen. */}
        <div className="bottom-action hand-out-actions">
          <button type="button" className="button button-big" onClick={onDone}>
            {doneLabel}
          </button>
        </div>
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
      </header>
      <div className="hand-out-body stack">
        <p className="hand-out-ticket" data-testid="hand-out-ticket">
          Ticket {number} →{' '}
          <button type="button" className="text-button hand-out-name" aria-expanded={picking} onClick={() => setPicking(!picking)}>
            {nameOf(owner)}
          </button>{' '}
          <span className="hand-out-count">
            ({mine.indexOf(number) + 1} of {mine.length})
          </span>
        </p>
        {/* RC fix (C1): the QR (with the game code above it) is its own block, so in landscape it sits in a column
            of its own beside the words and buttons. */}
        {!picking && (
          <div className="hand-out-qr">
            {/* UX list row 25 (TAM-172): the game code above the QR, for the room to check against. */}
            <p className="game-code hand-out-code" data-testid="game-code">
              Game {view.code}
            </p>
            <QrCode text={link} testId="ticket-qr" size={240} label={`QR code for ticket ${number}`} />
          </div>
        )}
        <div className="hand-out-info">
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
                        if (!why) {
                          setPicking(false);
                          // A new owner hasn't been asked about yet (row 7).
                          setAskedFor(null);
                        }
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
            <div className="hand-out-scan">
              <p className="note">Scan with your camera to get your ticket. Check it says Game {view.code}.</p>
              <p className="note">
                or type: <strong className="ticket-code" data-testid="ticket-code">{codeGroups(typedCode(info))}</strong>
              </p>
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="hand-out-status">
            <p className="note" data-testid="hand-out-progress">
              {index} of {queue.length} handed out
            </p>
            <p className="note" data-testid="hand-out-waiting">
              Waiting: {[...waiting.entries()].map(([id, n]) => `${nameOf(id)} (${n} ${n === 1 ? 'ticket' : 'tickets'})`).join(', ')}
            </p>
          </div>
          {notice}
        </div>
      </div>
      {/* TAM-181 (UX list row 10): the one main button full width at the bottom, the paper fallback a link above it. */}
      <div className="bottom-action hand-out-actions">
        <button type="button" className="text-button hand-out-paper" onClick={() => onPaper(owner)}>
          Can't scan? Give a paper ticket
        </button>
        <button
          type="button"
          className="button button-big"
          onClick={() => {
            if (!last) return onNext();
            // UX list row 7: the last ticket's player isn't confirmed yet, so starting asks first (no one is charged
            // for a ticket they never got).
            // Asked once: after "Not yet, hand it out" the host has had the chance, so the next tap starts calling.
            if (doneLabel === 'Start calling' && waiting.size > 0 && askedFor !== number) return setAsking(true);
            onDone();
          }}
        >
          {last ? doneLabel : 'Next ticket'}
        </button>
      </div>
      {asking && (
        <div className="backdrop">
          {/* UX list row 7, N5 (C2): the host can't know whether the player scanned, so the question asks rather than
              tells, and "Yes, start calling" is the main answer. */}
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="start-ask-title" data-testid="start-ask">
            <h2 className="section-title" id="start-ask-title">
              Has {nameOf(owner)} got their ticket?
            </h2>
            <p className="note">Ticket {number} is the last one to hand out.</p>
            <div className="stack-tight">
              <button
                type="button"
                className="button"
                onClick={() => {
                  setAsking(false);
                  onDone();
                }}
              >
                Yes, start calling
              </button>
              <button
                type="button"
                className="button button-quiet"
                onClick={() => {
                  setAsking(false);
                  setAskedFor(number);
                }}
              >
                Not yet, hand it out
              </button>
              <button
                type="button"
                className="button button-quiet"
                onClick={() => {
                  setAsking(false);
                  onPaper(owner);
                }}
              >
                Give a paper ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
