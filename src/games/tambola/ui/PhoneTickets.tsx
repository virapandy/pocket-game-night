// A player's phone (Phase 2, docs/games/tambola/ux-phone-tickets.md, sections 2, 2a and 3). It holds only this
// player's own tickets: never a called number, never another ticket (TAM-050, TAM-051). The player marks by hand,
// can use quick mark, crosses out prizes announced as won, and shows a claim QR the host scans (TAM-177).
// The phone checks nothing: only the host's scan decides (owner, 2026-09-29).
import { useEffect, useState, type ReactNode } from 'react';
import type { Preferences } from '../../../engine';
import { decodeTicket, decodeTypedCode, encodeClaim, PATTERN_NAMES, type Pattern } from '../rules';
import { QrCode } from './qr';
import {
  addTicket,
  AWAY_KEY,
  crossedOut,
  LARGE_TEXT_KEY,
  LAYOUT_KEY,
  loadPhoneGame,
  marksOn,
  patternCells,
  patternCue,
  prizesOf,
  quickMark,
  savePhoneGame,
  toggleCrossed,
  toggleMark,
  type PhoneGameFacts,
} from './phoneFacts';
import { TicketGrid } from './TicketGrid';

type Layout = 'all' | 'one';

type Screen =
  | { name: 'tickets' }
  | { name: 'quick'; message: string | null }
  | { name: 'zoom'; ticket: number; message: string | null }
  | { name: 'claim-ticket' }
  | { name: 'claim-prize'; ticket: number }
  | { name: 'claim'; ticket: number; pattern: Pattern }
  | { name: 'enter'; text: string; error: string | null };

/**
 * Whether this phone holds tickets: `open` means the player hasn't gone back home from them, so the app
 * opens straight on the tickets (a reload keeps them on screen, TAM-171).
 */
export function hasPhoneTickets(prefs: Preferences, open = true): boolean {
  return loadPhoneGame(prefs) !== null && (!open || prefs.get<boolean>(AWAY_KEY, false) !== true);
}

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const on = () => setSize(read());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return size;
}

const time = (t: number) => {
  const d = new Date(t);
  return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`;
};

/**
 * The player's tickets. `link` is a scanned ticket QR's text (from the app link), `enter` opens the typed-code
 * form; `nonce` changes with every new scan so the same screen takes each one.
 */
export function PhoneTickets({
  prefs,
  link,
  enter,
  nonce,
  onHome,
}: {
  prefs: Preferences;
  link: string | null;
  enter: boolean;
  nonce: number;
  onHome: () => void;
}) {
  const [game, setGame] = useState<PhoneGameFacts | null>(() => loadPhoneGame(prefs));
  const [screen, setScreen] = useState<Screen>(() => (enter ? { name: 'enter', text: '', error: null } : { name: 'tickets' }));
  const [layout, setLayout] = useState<Layout>(() => (prefs.get<string>(LAYOUT_KEY, 'all') === 'one' ? 'one' : 'all'));
  const [selected, setSelected] = useState<number | null>(null);
  const [large, setLarge] = useState(() => prefs.get<boolean>(LARGE_TEXT_KEY, false) === true);
  const [popup, setPopup] = useState<'menu' | 'prizes' | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const { w, h } = useViewport();

  const save = (next: PhoneGameFacts | null) => {
    savePhoneGame(prefs, next);
    setGame(next);
  };

  // A scanned ticket: added to this game's tickets, or replacing an old game's (TAM-171).
  useEffect(() => {
    if (!link) return;
    const d = decodeTicket(link);
    if (!d.ok) {
      setLinkError(d.reason);
      return;
    }
    setLinkError(null);
    prefs.set(AWAY_KEY, false);
    const t = d.ticket;
    const next = addTicket(loadPhoneGame(prefs), { game: t.game, ticket: t.ticket, rows: t.rows, name: t.name, startedAt: t.startedAt, tiers: t.tiers });
    save(next);
    setSelected(t.ticket);
    setScreen({ name: 'tickets' });
    setPopup(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  // Opening the tickets (not the code form) means the app opens on them again next time (TAM-171).
  useEffect(() => {
    if (!enter && !link) prefs.set(AWAY_KEY, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPopup(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [popup]);

  const setLayoutPref = (l: Layout) => {
    setLayout(l);
    prefs.set(LAYOUT_KEY, l);
  };
  const leave = () => {
    prefs.set(AWAY_KEY, true);
    onHome();
  };
  const openTickets = () => {
    prefs.set(AWAY_KEY, false);
    setScreen({ name: 'tickets' });
  };
  const rootClass = `phone${large ? ' phone-large' : ''}${w > h ? ' phone-landscape' : ''}`;

  if (screen.name === 'enter' || !game) {
    const s = screen.name === 'enter' ? screen : { text: '', error: linkError };
    const open = () => {
      const d = decodeTypedCode(s.text);
      if (!d.ok) return setScreen({ name: 'enter', text: s.text, error: d.reason });
      prefs.set(AWAY_KEY, false);
      save(addTicket(loadPhoneGame(prefs), { game: d.ticket.game, ticket: d.ticket.ticket, rows: d.ticket.rows }));
      setSelected(d.ticket.ticket);
      setScreen({ name: 'tickets' });
    };
    return (
      <main className={`screen ${rootClass}`}>
        <header className="top-bar">
          <button type="button" className="button button-quiet" onClick={game ? openTickets : leave}>
            ← {game ? 'Back' : 'Home'}
          </button>
        </header>
        <h1 className="step-title">Your Tambola ticket</h1>
        <p className="lead">Scan the QR on the host's phone with your camera, or type the code shown under it.</p>
        <label className="field">
          <span>Ticket code</span>
          <input
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="K7QM-2XPA-9RTD-4HWC-B3NF"
            value={s.text}
            onChange={(e) => setScreen({ name: 'enter', text: e.target.value, error: null })}
            onKeyDown={(e) => e.key === 'Enter' && open()}
          />
        </label>
        {s.error && (
          <p className="error" role="alert">
            {s.error}
          </p>
        )}
        <button type="button" className="button button-big" onClick={open}>
          Open ticket
        </button>
      </main>
    );
  }

  const tickets = game.tickets;
  const numbersList = tickets.map((t) => t.number);
  const current = tickets.find((t) => t.number === selected) ?? tickets[0]!;
  const cue = patternCue(game);
  const crossed = crossedOut(game);
  const prizes = prizesOf(game);
  const mark = (ticket: number) => (n: number) => save(toggleMark(game, ticket, n));
  const marksFor = (ticket: number) => ({ marked: marksOn(game, ticket), cue: cue.cells.get(ticket) ?? new Set<number>() });

  // Cell sizes (TAM-122, TAM-173, TAM-191): all tickets at once without scrolling, cells at least 40 px;
  // one at a time, cells at least 44 px. Landscape: two side by side, the third below.
  const landscape = w > h;
  const cols = landscape && tickets.length > 1 ? 2 : 1;
  const ticketRows = Math.ceil(tickets.length / cols);
  const caption = landscape ? 0 : 20;
  // The caption beside each ticket in landscape, and the ticket's 2 px border on each side.
  const side = (landscape ? 20 : 0) + 4;
  const chrome = landscape ? 104 : 190 + (cue.lines.length > 0 ? 24 * cue.lines.length : 0);
  const allCell = Math.max(
    40,
    Math.min(
      80,
      Math.floor((w - 16 - (cols - 1) * 12 - cols * side) / (9 * cols)),
      Math.floor((h - chrome - ticketRows * (caption + 8)) / (3 * ticketRows)),
    ),
  );
  const oneCell = Math.max(44, Math.min(80, Math.floor((w - 16 - side) / 9), Math.floor((h - chrome - 60) / 3)));

  const header = (
    <header className="phone-bar">
      <p className="phone-ticket-header" data-testid="phone-ticket-header">
        {[game.name, `Ticket ${numbersList.join(' · ')}`, `Game ${game.game}`, game.startedAt !== null ? time(game.startedAt) : null]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <div className="phone-bar-actions">
        <button type="button" className="bar-button" aria-expanded={popup === 'prizes'} onClick={() => setPopup(popup === 'prizes' ? null : 'prizes')}>
          Prizes ▾
        </button>
        <button type="button" className="bar-button" aria-haspopup="menu" aria-expanded={popup === 'menu'} onClick={() => setPopup(popup === 'menu' ? null : 'menu')}>
          ⋯ Menu
        </button>
      </div>
    </header>
  );

  const popups = (
    <>
      {popup === 'prizes' && (
        <Popup label="Prizes" onClose={() => setPopup(null)}>
          <p className="note">Tap a prize when the anchor says it's won, to cross it out. Tap again to undo.</p>
          <ul className="prize-list" data-testid="prize-list">
            {prizes.map((p) => {
              const gone = crossed.has(p);
              return (
                <li key={p}>
                  <button
                    type="button"
                    className={gone ? 'prize-item prize-crossed' : 'prize-item'}
                    data-testid="prize-item"
                    data-crossed={gone ? 'true' : 'false'}
                    aria-pressed={gone}
                    disabled={crossed.get(p) === 'host'}
                    onClick={() => save(toggleCrossed(game, p))}
                  >
                    <span className="prize-name">{PATTERN_NAMES[p]}</span>
                    {gone && <span className="prize-won"> won</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {!game.tiers && <p className="note">This ticket was typed in, so the phone doesn't know this game's prizes. The anchor will say.</p>}
          <button type="button" className="button button-quiet" onClick={() => setPopup(null)}>
            Close
          </button>
        </Popup>
      )}
      {popup === 'menu' && (
        <Popup label="Menu" onClose={() => setPopup(null)}>
          <div role="menu" aria-label="Ticket menu" className="menu-list">
            <label className="check-row">
              <input
                type="checkbox"
                checked={large}
                onChange={(e) => {
                  setLarge(e.target.checked);
                  prefs.set(LARGE_TEXT_KEY, e.target.checked);
                }}
              />
              <span>Larger text</span>
            </label>
            <button type="button" role="menuitem" className="menu-item" onClick={() => (setPopup(null), setScreen({ name: 'enter', text: '', error: null }))}>
              Enter a ticket code
            </button>
            <button type="button" role="menuitem" className="menu-item" onClick={leave}>
              Home
            </button>
          </div>
          <button type="button" className="menu-item menu-close" onClick={() => setPopup(null)}>
            Close
          </button>
        </Popup>
      )}
    </>
  );

  const cueBox = cue.lines.length > 0 && (
    <div className={landscape ? 'pattern-cue pattern-cue-float' : 'pattern-cue'} data-testid="pattern-cue" role="status">
      {cue.lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </div>
  );

  const ticketBox = (t: (typeof tickets)[number], cell: number, extra?: { outlined?: ReadonlySet<number>; noTap?: boolean }) => (
    <section key={t.number} className={landscape ? 'phone-ticket phone-ticket-side' : 'phone-ticket'} data-testid="phone-ticket" data-ticket={t.number}>
      <p className="phone-ticket-caption">Ticket {t.number}</p>
      <TicketGrid
        rows={t.rows}
        cell={cell}
        marks={{ ...marksFor(t.number), ...(extra?.outlined ? { outlined: extra.outlined } : {}) }}
        {...(extra?.noTap ? {} : { onTap: mark(t.number) })}
      />
    </section>
  );

  // ---------- Quick mark (TAM-192) ----------
  if (screen.name === 'quick') {
    const thumbCell = Math.max(8, Math.min(16, Math.floor((w - 32 - (tickets.length - 1) * 8) / (9 * tickets.length))));
    return (
      <main className={rootClass}>
        {header}
        <p className="note listen">Listen to the anchor, then tap the number you heard.</p>
        <p className="quick-message" data-testid="quick-mark-message" aria-live="polite">
          {screen.message ?? ' '}
        </p>
        <div className="quick-pad" data-testid="quick-mark-pad">
          {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className="quick-key"
              onClick={() => {
                const r = quickMark(game, n);
                if (r.on.length === 0) return setScreen({ name: 'quick', message: `${n}: not on your tickets` });
                save(r.game);
                const where = r.on.length === 1 ? `ticket ${r.on[0]}` : `tickets ${r.on.slice(0, -1).join(', ')} and ${r.on[r.on.length - 1]}`;
                setScreen({ name: 'quick', message: r.marked ? `✓ ${n} marked on ${where}` : `${n} unmarked on ${where}` });
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="thumbs">
          {tickets.map((t) => (
            <button
              key={t.number}
              type="button"
              className="thumb"
              data-testid="quick-mark-thumbnail"
              data-ticket={t.number}
              aria-label={`Open ticket ${t.number}`}
              onClick={() => setScreen({ name: 'zoom', ticket: t.number, message: screen.message })}
            >
              <TicketGrid rows={t.rows} cell={thumbCell} marks={marksFor(t.number)} className="ticket-thumb" />
            </button>
          ))}
        </div>
        {cueBox}
        <div className="phone-actions">
          <button type="button" className="button button-quiet" onClick={() => setScreen({ name: 'tickets' })}>
            Back
          </button>
        </div>
        {popups}
      </main>
    );
  }

  if (screen.name === 'zoom') {
    const t = tickets.find((x) => x.number === screen.ticket) ?? current;
    return (
      <main className={rootClass}>
        {header}
        <div className="tickets tickets-one">{ticketBox(t, oneCell)}</div>
        {cueBox}
        <div className="phone-actions">
          <button type="button" className="button button-quiet" onClick={() => setScreen({ name: 'quick', message: screen.message })}>
            Back
          </button>
        </div>
        {popups}
      </main>
    );
  }

  // ---------- Showing a claim (TAM-177, TAM-190, TAM-193) ----------
  if (screen.name === 'claim-ticket' || screen.name === 'claim-prize') {
    return (
      <main className={`screen ${rootClass}`}>
        {screen.name === 'claim-ticket' ? (
          <>
            <h1 className="step-title">Which ticket?</h1>
            <div className="choice-grid">
              {tickets.map((t) => (
                <button key={t.number} type="button" className="button button-quiet button-big" onClick={() => setScreen({ name: 'claim-prize', ticket: t.number })}>
                  Ticket {t.number}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="step-title">Which prize?</h1>
            <p className="note">Ticket {screen.ticket}. Shout first, then show the claim to the host.</p>
            <div className="choice-grid">
              {prizes.map((p) => {
                const gone = crossed.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    className="button button-quiet button-big"
                    disabled={gone}
                    onClick={() => setScreen({ name: 'claim', ticket: screen.ticket, pattern: p })}
                  >
                    {gone ? `${PATTERN_NAMES[p]} (won)` : PATTERN_NAMES[p]}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <button type="button" className="button button-quiet" onClick={() => setScreen({ name: 'tickets' })}>
          Cancel
        </button>
      </main>
    );
  }

  if (screen.name === 'claim') {
    const t = tickets.find((x) => x.number === screen.ticket) ?? current;
    const payload = encodeClaim({ game: game.game, ticket: t.number, pattern: screen.pattern, rows: t.rows });
    const qrSize = Math.max(160, Math.min(landscape ? h - 150 : w - 48, 320));
    return (
      <main className={`${rootClass} claim-screen`} data-testid="claim-screen">
        <p className="claim-title">{[PATTERN_NAMES[screen.pattern], `Ticket ${t.number}`, game.name].filter(Boolean).join(' · ')}</p>
        <div className="claim-body">
          <QrCode text={payload} testId="claim-qr" size={qrSize} label="Claim QR code" />
          <p className="lead">Show this to the host</p>
          {ticketBox(t, Math.min(allCell, 44), { outlined: new Set(patternCells(t.rows, screen.pattern)), noTap: true })}
        </div>
        <div className="phone-actions">
          <button type="button" className="button button-big" onClick={() => setScreen({ name: 'tickets' })}>
            Done
          </button>
        </div>
      </main>
    );
  }

  // ---------- The tickets (TAM-131, TAM-173, TAM-191) ----------
  const showOne = layout === 'one';
  const shown = showOne ? [current] : tickets;
  const startClaim = () => {
    setPopup(null);
    setScreen(tickets.length > 1 ? { name: 'claim-ticket' } : { name: 'claim-prize', ticket: tickets[0]!.number });
  };
  return (
    <main className={rootClass}>
      {header}
      {showOne && (
        <div className="ticket-tabs" role="tablist" aria-label="Your tickets">
          {tickets.map((t) => (
            <button
              key={t.number}
              type="button"
              role="tab"
              aria-selected={t.number === current.number}
              aria-label={`Ticket ${t.number}`}
              className={t.number === current.number ? 'ticket-tab ticket-tab-on' : 'ticket-tab'}
              onClick={() => setSelected(t.number)}
            >
              {t.number}
            </button>
          ))}
        </div>
      )}
      <div className={showOne ? 'tickets tickets-one' : cols === 2 ? 'tickets tickets-two' : 'tickets'}>
        {shown.map((t) => ticketBox(t, showOne ? oneCell : allCell))}
      </div>
      {cueBox}
      <div className="phone-actions">
        <p className="note listen">Listen to the anchor and mark your numbers.</p>
        <div className="phone-buttons">
          {tickets.length > 1 &&
            (showOne ? (
              <button type="button" className="button button-quiet" onClick={() => setLayoutPref('all')}>
                All tickets
              </button>
            ) : (
              <button type="button" className="button button-quiet" onClick={() => setLayoutPref('one')}>
                One at a time
              </button>
            ))}
          <button type="button" className="button button-quiet" onClick={() => (setPopup(null), setScreen({ name: 'quick', message: null }))}>
            Quick mark
          </button>
          <button type="button" className="button" onClick={startClaim}>
            Show claim
          </button>
        </div>
      </div>
      {popups}
    </main>
  );
}

function Popup({ label, children, onClose }: { label: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="backdrop sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
