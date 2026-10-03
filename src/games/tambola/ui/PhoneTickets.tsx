// A player's phone (Phase 2, docs/games/tambola/ux-phone-tickets.md, sections 2, 2a and 3). It holds only this
// player's own tickets: never a called number, never another ticket (TAM-050, TAM-051). The player marks by hand,
// can use quick mark, crosses out prizes announced as won, and shows a claim QR the host scans (TAM-177).
// The phone checks nothing: only the host's scan decides (owner, 2026-09-29).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { PlayerTicketInput, Preferences, ReportSubject } from '../../../engine';
import { decodeTicket, decodeTypedCode, encodeClaim, PATTERN_NAMES, type Pattern } from '../rules';
import { QrCode } from './qr';
import {
  addTicket,
  AWAY_KEY,
  crossedOut,
  cueParts,
  cueLine,
  cueTickets,
  holderOf,
  LARGE_TEXT_KEY,
  LAYOUT_KEY,
  loadPhoneGame,
  marksOn,
  patternCells,
  patternCue,
  PHONE_FULL,
  phoneIsFull,
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
  /** `typing` false: "Join with my ticket" first offers the camera, then "Type the code" (PLT-300). */
  | { name: 'enter'; text: string; error: string | null; typing: boolean };

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

/**
 * The height an element is given by the layout (UX list row 1): the tickets take the room the bar, the cue line and
 * the buttons leave, measured rather than guessed, so Larger text or a wrapped header never pushes the buttons off.
 */
function useGivenHeight(): [(el: HTMLElement | null) => void, number | null] {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!el) return;
    const read = () => setHeight(el.clientHeight);
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, height];
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
  onReport,
}: {
  prefs: Preferences;
  link: string | null;
  /** true: the typed-code form; 'join': Home's "Join with my ticket" (scan with the camera, or type the code). */
  enter: boolean | 'join';
  nonce: number;
  onHome: () => void;
  /** Phase 7: "Report a problem" with only this phone's own tickets and marks (PLT-207). */
  onReport?: (subject: ReportSubject) => void;
}) {
  const [game, setGame] = useState<PhoneGameFacts | null>(() => loadPhoneGame(prefs));
  const [screen, setScreen] = useState<Screen>(() =>
    enter ? { name: 'enter', text: '', error: null, typing: enter === true } : { name: 'tickets' },
  );
  const [layout, setLayout] = useState<Layout>(() => (prefs.get<string>(LAYOUT_KEY, 'all') === 'one' ? 'one' : 'all'));
  const [selected, setSelected] = useState<number | null>(null);
  const [large, setLarge] = useState(() => prefs.get<boolean>(LARGE_TEXT_KEY, false) === true);
  const [popup, setPopup] = useState<'menu' | 'prizes' | 'cue' | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  /** TAM-214: a 4th ticket was refused ("This phone already holds 3 tickets"). */
  const [notice, setNotice] = useState<string | null>(null);
  const { w, h } = useViewport();
  const [ticketsRef, given] = useGivenHeight();

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
    const held = loadPhoneGame(prefs);
    if (phoneIsFull(held, t.game, t.ticket)) {
      setNotice(PHONE_FULL);
      setScreen({ name: 'tickets' });
      setPopup(null);
      return;
    }
    setNotice(null);
    const next = addTicket(held, {
      game: t.game,
      ticket: t.ticket,
      rows: t.rows,
      name: t.name,
      startedAt: t.startedAt,
      tiers: t.tiers,
      cue: t.cue,
    });
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
    const s = screen.name === 'enter' ? screen : { text: '', error: linkError, typing: true };
    const open = () => {
      const d = decodeTypedCode(s.text);
      if (!d.ok) return setScreen({ name: 'enter', text: s.text, error: d.reason, typing: true });
      if (phoneIsFull(loadPhoneGame(prefs), d.ticket.game, d.ticket.ticket)) {
        return setScreen({ name: 'enter', text: s.text, error: PHONE_FULL, typing: true });
      }
      setNotice(null);
      prefs.set(AWAY_KEY, false);
      save(addTicket(loadPhoneGame(prefs), { game: d.ticket.game, ticket: d.ticket.ticket, rows: d.ticket.rows }));
      setSelected(d.ticket.ticket);
      setScreen({ name: 'tickets' });
    };
    return (
      <main className={`screen ${rootClass}`}>
        <header className="top-bar">
          <button type="button" className="button button-quiet" onClick={game ? openTickets : leave}>
            <span aria-hidden="true">← </span>
            {game ? 'Back' : 'Home'}
          </button>
        </header>
        <h1 className="step-title">{s.typing ? 'Type the code' : 'Join with my ticket'}</h1>
        {!s.typing ? (
          <>
            <p className="lead">Scan the QR on the host's phone with your phone's camera. Your ticket opens here.</p>
            <p className="note">No QR to scan? The host's screen also shows a code under it.</p>
            <button type="button" className="button button-quiet button-big" onClick={() => setScreen({ name: 'enter', text: s.text, error: null, typing: true })}>
              Type the code
            </button>
          </>
        ) : (
          <>
            <p className="lead">Type the code shown under the QR on the host's phone, or scan the QR with your camera.</p>
            <label className="field">
              <span>Ticket code</span>
              <input
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                value={s.text}
                onChange={(e) => setScreen({ name: 'enter', text: e.target.value, error: null, typing: true })}
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
          </>
        )}
      </main>
    );
  }

  const tickets = game.tickets;
  const numbersList = tickets.map((t) => t.number);
  const current = tickets.find((t) => t.number === selected) ?? tickets[0]!;
  const cue = patternCue(game);
  const cueSays = cueLine(cue.fills);
  // TAM-214: when the phone holds tickets of more than one person, each ticket names its holder.
  const mixed = new Set(tickets.map((t) => holderOf(game, t))).size > 1;
  const labelOf = (t: (typeof tickets)[number]) => {
    const who = mixed ? holderOf(game, t) : null;
    return who ? `${who} · Ticket ${t.number}` : `Ticket ${t.number}`;
  };
  const crossed = crossedOut(game);
  const prizes = prizesOf(game);
  const mark = (ticket: number) => (n: number) => save(toggleMark(game, ticket, n));
  const marksFor = (ticket: number) => ({ marked: marksOn(game, ticket), cue: cue.cells.get(ticket) ?? new Set<number>() });

  // Cell sizes (TAM-122, TAM-173, TAM-191, UX list row 2): all tickets at once without scrolling, always within the
  // screen's width down to 320 px, with a 12 px margin each side (cells about 32 px at 320 px; never below the 24 px
  // floor of guideline 41). One at a time: at least 44 px in landscape. Landscape: two side by side, the third below.
  const landscape = w > h;
  const cols = landscape && tickets.length > 1 ? 2 : 1;
  const ticketRows = Math.ceil(tickets.length / cols);
  const caption = landscape ? 0 : 20;
  // The caption beside each ticket in landscape, and the ticket's 2 px border on each side.
  const side = (landscape ? 20 : 0) + 4;
  const chrome = landscape ? 104 : 190 + (cueSays ? 32 : 0);
  // The height: what the layout gives the tickets once measured (each ticket's caption and 4 px of border, 8 px
  // between rows); before that, an estimate.
  const tallest =
    given !== null
      ? Math.floor((given - ticketRows * (caption + 4) - (ticketRows - 1) * 8) / (3 * ticketRows))
      : Math.floor((h - chrome - ticketRows * (caption + 8)) / (3 * ticketRows));
  const allCell = Math.max(24, Math.min(80, Math.floor((w - 24 - (cols - 1) * 12 - cols * side) / (9 * cols)), tallest));
  // Portrait one at a time (owner decision 2026-10-01, replacing the full-width 42 px cells): the ticket keeps a
  // 12 px margin each side, with no border, and the cells fill the width between (40 px on a 390 px phone, 39 on 375).
  const oneTallest = given !== null ? Math.floor((given - caption - 4) / 3) : Math.floor((h - chrome - 60) / 3);
  const oneCell = landscape
    ? Math.max(44, Math.min(80, Math.floor((w - 24 - side) / 9), oneTallest))
    : Math.max(24, Math.min(80, Math.floor((w - 24) / 9), oneTallest));

  const header = (onBack?: () => void) => (
    <header className="phone-bar">
      {onBack && (
        <button type="button" className="bar-button" onClick={onBack}>
          <span aria-hidden="true">← </span>Back
        </button>
      )}
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
      {popup === 'cue' && (
        <Popup label="Patterns filled" onClose={() => setPopup(null)}>
          <div data-testid="pattern-cue-more" className="stack-tight">
            <ul className="cue-list">
              {cueParts(cue.fills).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="note">Shout if it's right! Only the host's check decides.</p>
            <button type="button" className="button button-quiet" onClick={() => setPopup(null)}>
              Close
            </button>
          </div>
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
            <button type="button" role="menuitem" className="menu-item" onClick={() => (setPopup(null), setScreen({ name: 'enter', text: '', error: null, typing: true }))}>
              Add a ticket by code
            </button>
            {onReport && (
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  setPopup(null);
                  const tickets: PlayerTicketInput[] = game.tickets.map((t) => ({
                    v: 1,
                    game: game.game,
                    ticket: t.number,
                    name: game.name ?? '',
                    rows: t.rows,
                    startedAt: game.startedAt ?? 0,
                    tiers: game.tiers ?? [],
                    marks: [...marksOn(game, t.number)],
                  }));
                  onReport({ kind: 'tickets', tickets });
                }}
              >
                Report a problem
              </button>
            )}
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

  // TAM-195 (rows 1a and 1): one slim line, never over a ticket and never pushing the buttons off screen; "More" when
  // it doesn't fit.
  const cueBox = cueSays && <CueLine line={cueSays.line} always={cueSays.more} onMore={() => setPopup('cue')} />;

  // `outlined`: the claim screen (UX list row 13) outlines only the chosen prize's pattern, never the cue's.
  const ticketBox = (t: (typeof tickets)[number], cell: number, extra?: { outlined?: ReadonlySet<number>; noTap?: boolean }) => (
    <section key={t.number} className={landscape ? 'phone-ticket phone-ticket-side' : 'phone-ticket'} data-testid="phone-ticket" data-ticket={t.number}>
      <p className="phone-ticket-caption">{labelOf(t)}</p>
      <TicketGrid
        rows={t.rows}
        cell={cell}
        marks={extra?.outlined ? { marked: marksOn(game, t.number), outlined: extra.outlined } : marksFor(t.number)}
        {...(extra?.noTap ? {} : { onTap: mark(t.number) })}
      />
    </section>
  );

  const startClaim = () => {
    setPopup(null);
    setScreen(tickets.length > 1 ? { name: 'claim-ticket' } : { name: 'claim-prize', ticket: tickets[0]!.number });
  };
  // PLT-301: "Show claim" is the player's one main button, in the bottom spot.
  const showClaimButton = (
    <button type="button" className="button" onClick={startClaim}>
      Show claim
    </button>
  );

  // ---------- Quick mark (TAM-192) ----------
  if (screen.name === 'quick') {
    const thumbCell = Math.max(8, Math.min(16, Math.floor((w - 32 - (tickets.length - 1) * 8) / (9 * tickets.length))));
    // A number marked on any ticket (on the pad or on the ticket) shows a fill and a ✓ on its key (owner 2026-10-01).
    const markedAnywhere = new Set(tickets.flatMap((t) => [...marksOn(game, t.number)]));
    return (
      <main className={`${rootClass} quick-screen`}>
        {header(() => setScreen({ name: 'tickets' }))}
        <p className="note listen">Listen to the anchor, then tap the number you heard.</p>
        <p className="quick-message" data-testid="quick-mark-message" aria-live="polite">
          {screen.message ?? '\u00a0'}
        </p>
        <div className="quick-pad" data-testid="quick-mark-pad">
          {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => {
            const on = markedAnywhere.has(n);
            return (
              <button
                key={n}
                type="button"
                className={on ? 'quick-key quick-key-on' : 'quick-key'}
                aria-pressed={on}
                onClick={() => {
                  const r = quickMark(game, n);
                  if (r.on.length === 0) return setScreen({ name: 'quick', message: `${n}: not on your tickets` });
                  save(r.game);
                  const where = r.on.length === 1 ? `ticket ${r.on[0]}` : `tickets ${r.on.slice(0, -1).join(', ')} and ${r.on[r.on.length - 1]}`;
                  setScreen({ name: 'quick', message: r.marked ? `✓ ${n} marked on ${where}` : `${n} unmarked on ${where}` });
                }}
              >
                {n}
                {on && <span className="quick-tick">✓</span>}
              </button>
            );
          })}
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
              <span className="thumb-caption">Ticket {t.number}</span>
              <TicketGrid rows={t.rows} cell={thumbCell} marks={marksFor(t.number)} className="ticket-thumb" />
            </button>
          ))}
        </div>
        <div className="phone-actions">
          {cueBox}
          <div className="phone-buttons">{showClaimButton}</div>
        </div>
        {popups}
      </main>
    );
  }

  if (screen.name === 'zoom') {
    const t = tickets.find((x) => x.number === screen.ticket) ?? current;
    return (
      <main className={rootClass}>
        {header(() => setScreen({ name: 'quick', message: screen.message }))}
        <div className="tickets tickets-one tickets-fill" ref={ticketsRef}>
          {ticketBox(t, oneCell)}
        </div>
        <div className="phone-actions">
          {cueBox}
          <div className="phone-buttons">{showClaimButton}</div>
        </div>
        {popups}
      </main>
    );
  }

  // ---------- Showing a claim (TAM-177, TAM-190, TAM-193) ----------
  if (screen.name === 'claim-ticket' || screen.name === 'claim-prize') {
    // UX list row 12: only the ticket the cue's line names first says "Pattern filled" (product owner, 3 October).
    const first = cueTickets(cue.fills)[0];
    const choiceOrder = first === undefined ? tickets : [...tickets.filter((t) => t.number === first), ...tickets.filter((t) => t.number !== first)];
    // The pictures stay small (at most half a full ticket's cells) so every choice fits on one screen.
    const pictureCell = Math.max(10, Math.min(22, Math.floor(allCell / 2), Math.floor((h - 220) / (tickets.length * 3 + tickets.length * 2))));
    return (
      <main className={`screen ${rootClass}`}>
        {screen.name === 'claim-ticket' ? (
          <>
            <h1 className="step-title">Which ticket?</h1>
            <div className="ticket-choices">
              {choiceOrder.map((t) => (
                // TAM-190 (UX list row 12): a small picture of each ticket with her marks; with the cue on, the
                // ticket its line names first comes first, marked "Pattern filled".
                <button key={t.number} type="button" className="button button-quiet ticket-choice" onClick={() => setScreen({ name: 'claim-prize', ticket: t.number })}>
                  <span className="ticket-choice-name">
                    Ticket {t.number}
                    {mixed && holderOf(game, t) ? ` · ${holderOf(game, t)}` : ''}
                    {t.number === first && <span className="ticket-choice-tag"> · Pattern filled</span>}
                  </span>
                  <span className="ticket-picture" data-testid="ticket-picture" data-ticket={t.number} aria-hidden="true">
                    <TicketGrid rows={t.rows} cell={pictureCell} marks={marksFor(t.number)} className="ticket-thumb" />
                  </span>
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
        {/* TAM-177 (UX list row 14): "Cancel" is a link, so it never looks like a prize. */}
        <button type="button" className="text-button link-button" onClick={() => setScreen({ name: 'tickets' })}>
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
        <p className="claim-title">{[PATTERN_NAMES[screen.pattern], `Ticket ${t.number}`, holderOf(game, t)].filter(Boolean).join(' · ')}</p>
        <div className="claim-body">
          <QrCode text={payload} testId="claim-qr" size={qrSize} label="Claim QR code" />
          <p className="lead">Show this to the host</p>
          {ticketBox(t, Math.min(allCell, 44), { outlined: new Set(patternCells(t.rows, screen.pattern)), noTap: true })}
        </div>
        <div className="phone-actions">
          {/* TAM-193: "Done" is outlined, so the QR stands out. */}
          <button type="button" className="button button-quiet button-big" onClick={() => setScreen({ name: 'tickets' })}>
            Done
          </button>
        </div>
      </main>
    );
  }

  // ---------- The tickets (TAM-131, TAM-173, TAM-191) ----------
  const showOne = layout === 'one';
  const shown = showOne ? [current] : tickets;
  return (
    <main className={rootClass}>
      {header()}
      {notice && (
        <p className="error phone-notice" role="alert">
          {notice}
        </p>
      )}
      {showOne && (
        <div className="ticket-tabs" role="tablist" aria-label="Your tickets">
          {tickets.map((t) => {
            const on = t.number === current.number;
            // PLT-301: the chosen tab is outlined, ticked and tinted, never the main look.
            return (
              <button
                key={t.number}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={`Ticket ${t.number}`}
                className={on ? 'ticket-tab ticket-tab-on' : 'ticket-tab'}
                onClick={() => setSelected(t.number)}
              >
                {t.number}
                {on && <span className="ticket-tab-tick"> ✓</span>}
              </button>
            );
          })}
        </div>
      )}
      <div className={`${showOne ? 'tickets tickets-one' : cols === 2 ? 'tickets tickets-two' : 'tickets'} tickets-fill`} ref={ticketsRef}>
        {shown.map((t) => ticketBox(t, showOne ? oneCell : allCell))}
      </div>
      <div className="phone-actions">
        {/* The cue line takes the place of the reminder (row 1); in landscape beside the buttons, so it adds no height. */}
        {!cueBox && <p className="note listen">Listen to the anchor and mark your numbers.</p>}
        {cueBox}
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
          {showClaimButton}
        </div>
      </div>
      {popups}
    </main>
  );
}

/** The cue's line (TAM-195, UX list row 1), with "More" when it names several tickets or the line doesn't fit. */
function CueLine({ line, always, onMore }: { line: string; always: boolean; onMore: () => void }) {
  const text = useRef<HTMLSpanElement>(null);
  const [more, setMore] = useState(false);
  useLayoutEffect(() => {
    const el = text.current;
    if (!el) return;
    const read = () => setMore(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [line]);
  return (
    <div className="pattern-cue" data-testid="pattern-cue" role="status">
      <span className="pattern-cue-text" ref={text}>
        {line}
      </span>
      {(always || more) && (
        <button type="button" className="pattern-cue-more" onClick={onMore}>
          More
        </button>
      )}
    </div>
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
