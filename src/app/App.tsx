import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { makePlayerReport, makeReport, type Report, type ReportSubject, type SavedGame } from '../engine';
import { games, type GameId } from './games';
import { History, isPast, unsettledSessionName, type Deleted } from './History';
import { CrashNotice, ReportForm, ReportToast, WaitingReports } from './Report';
import { APP_VERSION, hasRealDestination, phoneType, queueReport, startReportSender } from './reports';
import { Dialog, SessionList, SessionScreen } from './Sessions';
import { gameStore, preferences, sessionPicker } from './storage';

const TWELVE_HOURS = 12 * 3600_000;
const TIP_KEY = 'install-tip.seen';
const UNDO_MS = 5_000;

type OpenAction = 'resume' | 'end' | 'discard' | 'reuse';

type Route =
  | { name: 'home' }
  | { name: 'history' }
  | { name: 'past'; id: string }
  | { name: 'sessions' }
  | { name: 'session'; id: string }
  | { name: 'game'; gameId: GameId; open?: { id: string; action: OpenAction }; startAt?: 'settings' }
  /** A player's phone (Phase 2): tickets opened from a ticket QR's link, or typed in. */
  | { name: 'phone'; gameId: GameId; link: string | null; enter: boolean | 'join'; nonce: number };

const gameOf = (type: string) => games.find((g) => g.info.id === type);

/** A ticket QR opens the app with "#t=<ticket>" (TAM-117). Read raw: the ticket text is decoded by the game. */
function phoneLink(): Extract<Route, { name: 'phone' }> | null {
  if (typeof location === 'undefined') return null;
  for (const g of games) {
    const prefix = `#${g.phone.linkKey}=`;
    if (location.hash.startsWith(prefix)) {
      return { name: 'phone', gameId: g.info.id as GameId, link: location.hash.slice(prefix.length), enter: false, nonce: Date.now() };
    }
  }
  return null;
}

/** Where the app opens: a scanned ticket, a place kept in the address, or a player's tickets (TAM-171). */
function firstRoute(): Route {
  const link = phoneLink();
  if (link) return link;
  const route = routeFromAddress();
  if (route.name !== 'home') return route;
  const holder = games.find((g) => g.phone.hasTickets(preferences));
  return holder ? { name: 'phone', gameId: holder.info.id as GameId, link: null, enter: false, nonce: 0 } : route;
}

/** History, Sessions and past games keep their place in the address, so a reload stays there (PLT-010). */
function routeFromAddress(): Route {
  const h = typeof location === 'undefined' ? '' : decodeURIComponent(location.hash.slice(1));
  if (h === 'history') return { name: 'history' };
  if (h === 'sessions') return { name: 'sessions' };
  if (h.startsWith('session/')) return { name: 'session', id: h.slice(8) };
  if (h.startsWith('past/')) return { name: 'past', id: h.slice(5) };
  return { name: 'home' };
}

function addressOf(route: Route): string {
  switch (route.name) {
    case 'history':
    case 'sessions':
      return route.name;
    case 'session':
      return `session/${route.id}`;
    case 'past':
      return `past/${route.id}`;
    default:
      return '';
  }
}
/**
 * TAM-111, UX guideline 23: during a game, the back gesture or button never leaves the game.
 * A spare history entry at the same address sits on top; going back uses it up and the game stays.
 * Chrome ignores entries added without a tap (they are skipped on the next back), so a new one is
 * added only while the host's tap is still "fresh": on entering the game, and after each later tap.
 */
function useBackGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const guarded = () => (history.state as { pgnGuard?: boolean } | null)?.pgnGuard === true;
    const tapFresh = () => {
      const ua = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
      return !ua || ua.isActive;
    };
    let href = location.href;
    const arm = () => {
      if (guarded() || !tapFresh()) return;
      href = location.href;
      history.pushState({ ...((history.state as object | null) ?? {}), pgnGuard: true }, '', href);
    };
    const onPop = () => {
      // The spare entry was used up: stay on this screen at the same address. A new one waits for the
      // next tap, never added here: Chrome would skip an entry added before the host touches the screen again.
      if (location.href !== href) history.replaceState(history.state, '', href);
    };
    arm();
    window.addEventListener('popstate', onPop);
    for (const e of ['click', 'pointerup', 'keydown'] as const) window.addEventListener(e, arm, true);
    return () => {
      window.removeEventListener('popstate', onPop);
      for (const e of ['click', 'pointerup', 'keydown'] as const) window.removeEventListener(e, arm, true);
    };
  }, [active]);
}

const time = (t: number) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

type Crash = { message: string; stack?: string };
const TOAST_MS = 6_000;

/** Errors from the phone or browser around the app (not the app's own mistakes): never shown as a crash. */
function ignorable(reason: unknown, message: string): boolean {
  if (!message || /ResizeObserver loop|^Script error\.?$/i.test(message)) return true;
  const name = reason instanceof Error || (reason && typeof reason === 'object') ? String((reason as { name?: unknown }).name ?? '') : '';
  if (/^(AbortError|NotAllowedError|NotSupportedError|SecurityError|NetworkError|NotReadableError|InvalidStateError)$/.test(name)) return true;
  return /service ?worker|Failed to fetch|Load failed|NetworkError|fetch.*failed/i.test(message);
}

/** The game a crash report is about: the one most recently changed on this phone, if a game is on screen. */
function gameOnScreen(): SavedGame | null {
  const list = gameStore.list().filter((g) => gameOf(g.gameType));
  return list.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}

/** Makes the report for the form: the same id and time as the host types (PLT-200, PLT-201, PLT-207). */
function reportMaker(subject: ReportSubject, error: Crash | null): (what: string) => Report {
  const common = { appVersion: APP_VERSION, phone: phoneType(), at: Date.now() };
  if (subject?.kind === 'tickets') {
    const id = makePlayerReport({ ...common, what: '', tickets: subject.tickets }).id;
    return (what) => makePlayerReport({ ...common, id, what, tickets: subject.tickets });
  }
  const saved = subject?.kind === 'game' ? gameStore.get(subject.gameId) : undefined;
  const game = saved ? gameOf(saved.gameType) : undefined;
  const input = { ...common, game: saved && game ? { saved, rules: game.rules } : null, error };
  const id = makeReport({ ...input, what: '' }).id;
  return (what) => makeReport({ ...input, id, what });
}

/**
 * The app, with "Report a problem" around every screen (Phase 7): the form, the calm message after an
 * unexpected error (PLT-203), and the quiet sender of waiting reports (PLT-202, PLT-208).
 */
export function App() {
  const routeName = useRef<Route['name']>('home');
  const [form, setForm] = useState<{ build: (what: string) => Report } | null>(null);
  const [crash, setCrash] = useState<Crash | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => startReportSender(gameStore), []);
  useEffect(() => {
    const seen = (reason: unknown, fallback: string) => {
      const message = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : fallback;
      if (ignorable(reason, message)) return;
      const stack = reason instanceof Error && reason.stack ? { stack: reason.stack } : {};
      setCrash((c) => c ?? { message, ...stack });
    };
    const onError = (e: ErrorEvent) => seen(e.error, e.message);
    const onRejection = (e: PromiseRejectionEvent) => seen(e.reason, String(e.reason ?? ''));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  useEffect(() => {
    if (toast === null) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const onReport = useCallback((subject: ReportSubject) => setForm({ build: reportMaker(subject, null) }), []);
  const cancel = useCallback(() => setForm(null), []);
  const send = (report: Report) => {
    queueReport(report);
    setForm(null);
    if (!hasRealDestination()) setToast('Thanks. Your report is kept on this phone.');
    else if (report.waitingForGameEnd) setToast('Thanks. Your report will be sent when this game ends.');
    else if (navigator.onLine === false) setToast('Thanks. Your report will be sent when this phone is back online.');
    else setToast('Thanks. Your report is on its way.');
  };

  return (
    <>
      <Screens onReport={onReport} routeName={routeName} />
      {crash && !form && (
        <CrashNotice
          onReport={() => {
            const subject: ReportSubject = routeName.current === 'game' ? (() => {
              const g = gameOnScreen();
              return g ? { kind: 'game', gameId: g.id } : null;
            })() : null;
            setForm({ build: reportMaker(subject, crash) });
            setCrash(null);
          }}
          onDismiss={() => setCrash(null)}
        />
      )}
      {form && <ReportForm build={form.build} onSend={send} onCancel={cancel} />}
      {toast && <ReportToast text={toast} />}
    </>
  );
}

function Screens({ onReport, routeName }: { onReport: (subject: ReportSubject) => void; routeName: RefObject<Route['name']> }) {
  // The service worker saves the whole app on the first visit, so it works offline afterwards.
  // A new version waits until the host chooses to update from the home screen, never mid-game (TAM-113).
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [route, setRoute] = useState<Route>(firstRoute);
  const initialRoute = useRef(route);
  routeName.current = route.name;
  // Scanning another ticket while the app is open changes only the address's "#t=…" part.
  useEffect(() => {
    const onHash = () => {
      const link = phoneLink();
      if (link) setRoute(link);
    };
    window.addEventListener('hashchange', onHash);
    // A ticket link that arrived while the app was still starting (before this listener) is kept, not dropped.
    const early = phoneLink();
    if (early && !(initialRoute.current.name === 'phone' && initialRoute.current.link === early.link)) setRoute(early);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const [deleted, setDeleted] = useState<Deleted | null>(null);
  useEffect(() => {
    const want = addressOf(route);
    if (decodeURIComponent(location.hash.slice(1)) === want) return;
    history.replaceState(history.state, '', want ? `#${encodeURIComponent(want).replace(/%2F/g, '/')}` : `${location.pathname}${location.search}`);
  }, [route]);
  useBackGuard(route.name === 'game');
  const home = () => setRoute({ name: 'home' });
  const expire = useCallback(() => setDeleted(null), []);

  // PLT-010: "Deleted. Undo" for 5 seconds; after that the game is gone for good.
  useEffect(() => {
    if (!deleted) return;
    const t = setTimeout(expire, Math.max(0, deleted.at + UNDO_MS - Date.now()));
    return () => clearTimeout(t);
  }, [deleted, expire]);

  if (route.name === 'game') {
    const game = gameOf(route.gameId);
    if (game) {
      return (
        <game.Screen
          onExit={home}
          store={gameStore}
          prefs={preferences}
          sessions={sessionPicker}
          onSession={(id) => setRoute({ name: 'session', id })}
          onReport={onReport}
          settingsExtra={<WaitingReports />}
          {...(route.open ? { open: route.open } : {})}
          {...(route.startAt ? { startAt: route.startAt } : {})}
        />
      );
    }
  }
  if (route.name === 'phone') {
    const game = gameOf(route.gameId);
    if (game) {
      return <game.phone.Screen prefs={preferences} link={route.link} enter={route.enter} nonce={route.nonce} onHome={home} onReport={onReport} />;
    }
  }
  if (route.name === 'history') {
    return (
      <History
        onBack={home}
        onOpen={(id) => setRoute({ name: 'past', id })}
        deleted={deleted}
        onUndoDelete={() => {
          for (const g of deleted?.games ?? []) gameStore.put(g);
          setDeleted(null);
        }}
      />
    );
  }
  if (route.name === 'sessions') return <SessionList onBack={home} onOpen={(id) => setRoute({ name: 'session', id })} />;
  if (route.name === 'session') return <SessionScreen id={route.id} onBack={() => setRoute({ name: 'sessions' })} />;
  if (route.name === 'past') {
    const saved = gameStore.get(route.id);
    const game = saved && gameOf(saved.gameType);
    if (saved && game) {
      return (
        <game.PastGame
          saved={saved}
          onBack={() => setRoute({ name: 'history' })}
          actions={
            <PastGameActions
              saved={saved}
              onReuse={() => setRoute({ name: 'game', gameId: game.info.id as GameId, open: { id: saved.id, action: 'reuse' } })}
              onDelete={() => {
                gameStore.remove(saved.id);
                setDeleted({ games: [saved], at: Date.now() });
                setRoute({ name: 'history' });
              }}
            />
          }
        />
      );
    }
  }

  return (
    <Home
      needRefresh={needRefresh}
      onUpdate={() => void updateServiceWorker(true)}
      onGame={(gameId, open) => setRoute(open ? { name: 'game', gameId, open } : { name: 'game', gameId })}
      onHistory={() => setRoute({ name: 'history' })}
      onSessions={() => setRoute({ name: 'sessions' })}
      onTickets={(enter) => setRoute({ name: 'phone', gameId: games[0].info.id as GameId, link: null, enter, nonce: Date.now() })}
      onSettings={() => setRoute({ name: 'game', gameId: games[0].info.id as GameId, startAt: 'settings' })}
      onReport={() => onReport(null)}
    />
  );
}

/** PLT-009, PLT-010, PLT-025: "Use this setup" and "Delete" on a past game. Unfinished games cannot be deleted. */
function PastGameActions({ saved, onReuse, onDelete }: { saved: SavedGame; onReuse: () => void; onDelete: () => void }) {
  const [asking, setAsking] = useState<string | null>(null);
  return (
    <div className="row">
      <button type="button" className="button" onClick={onReuse}>
        Use this setup
      </button>
      {isPast(saved) && (
        <button
          type="button"
          className="button button-quiet"
          onClick={() => {
            const session = unsettledSessionName(saved);
            if (session === null) onDelete();
            else setAsking(session);
          }}
        >
          Delete
        </button>
      )}
      {asking !== null && (
        <Dialog>
          <p className="lead">
            This game is in the unsettled tally for '{asking}'. Delete it and take it out of the tally?
          </p>
          <div className="row">
            <button type="button" className="button" onClick={onDelete}>
              Delete it
            </button>
            <button type="button" className="button button-quiet" onClick={() => setAsking(null)}>
              Keep
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

const SEEN_KEY = 'home.seen';

/**
 * Home (PLT-300): two equal choices, "Host a game" and "Join with my ticket", then any unfinished games as plain
 * rows. Sessions, History, Report a problem and Settings sit in the menu (⋯). A first visit says "You're ready for
 * game night" (TAM-057): the app is saved on this phone and opens with no internet from now on.
 */
function Home({
  needRefresh,
  onUpdate,
  onGame,
  onHistory,
  onSessions,
  onTickets,
  onSettings,
  onReport,
}: {
  needRefresh: boolean;
  /** Phase 7: "Report a problem" (PLT-200). */
  onReport: () => void;
  onUpdate: () => void;
  onGame: (gameId: GameId, open?: { id: string; action: OpenAction }) => void;
  onHistory: () => void;
  onSessions: () => void;
  /** Phase 2: a player's phone tickets (false), joining with a ticket ('join'), or typing a ticket code (true). */
  onTickets: (enter: boolean | 'join') => void;
  onSettings: () => void;
}) {
  const [holdsTickets] = useState(() => games.some((g) => g.phone.hasTickets(preferences, false)));
  const [firstVisit] = useState(() => preferences.get<boolean>(SEEN_KEY, false) !== true);
  useEffect(() => {
    if (firstVisit) preferences.set(SEEN_KEY, true);
  }, [firstVisit]);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);
  const [unfinished] = useState<SavedGame[]>(() =>
    gameStore
      .list()
      .filter((g) => (g.status === 'in-progress' || g.status === 'paused') && gameOf(g.gameType))
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
  const [now] = useState(() => Date.now());
  const host = games[0];
  const pick = (run: () => void) => () => {
    setMenu(false);
    run();
  };
  return (
    <main className="screen home">
      {needRefresh && (
        <div className="update" role="status">
          <span>A new version is ready.</span>
          <button type="button" className="button" onClick={onUpdate}>
            Update now
          </button>
        </div>
      )}
      <InstallTip />
      <header className="home-bar">
        <h1 className="app-title">Pocket Game Night</h1>
        <button type="button" className="bar-button" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
          ⋯ Menu
        </button>
      </header>
      {menu && (
        <div className="backdrop sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setMenu(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Menu">
            <div role="menu" aria-label="Home menu" className="menu-list">
              <button type="button" role="menuitem" className="menu-item" onClick={pick(onSessions)}>
                Sessions
              </button>
              <button type="button" role="menuitem" className="menu-item" onClick={pick(onHistory)}>
                History
              </button>
              <button type="button" role="menuitem" className="menu-item" onClick={pick(onReport)}>
                Report a problem
              </button>
              <button type="button" role="menuitem" className="menu-item" onClick={pick(onSettings)}>
                Settings
              </button>
            </div>
            <button type="button" className="menu-item menu-close" onClick={() => setMenu(false)}>
              Close
            </button>
          </div>
        </div>
      )}
      {firstVisit && <p className="ready">✓ You're ready for game night</p>}

      <div className="home-choices">
        <button type="button" className="choice-card home-card" onClick={() => onGame(host.info.id as GameId)}>
          <span className="choice-card-title">Host a game</span>
          <span className="choice-card-text">Run {host.info.title} on this phone</span>
        </button>
        <button type="button" className="choice-card home-card" onClick={() => onTickets('join')}>
          <span className="choice-card-title">Join with my ticket</span>
          <span className="choice-card-text">Got a QR or code from the host?</span>
        </button>
      </div>

      {holdsTickets && (
        <button type="button" className="home-row" onClick={() => onTickets(false)}>
          <span>Your tickets</span>
          <span aria-hidden="true">›</span>
        </button>
      )}
      {/* PLT-300 (UX list row 21): tickets more than 6 hours old wait here, with Open and Clear. */}
      {games.map((g) => (
        <g.phone.SavedTickets key={g.info.id} prefs={preferences} onOpen={() => onTickets(false)} />
      ))}

      {unfinished.length > 0 && (
        <section aria-labelledby="unfinished-title" className="stack-tight">
          <h2 id="unfinished-title" className="section-title">
            Unfinished games
          </h2>
          <ul className="unfinished" data-testid="unfinished-games">
            {unfinished.map((g) => {
              const game = gameOf(g.gameType)!;
              const d = game.describe(g);
              const id = game.info.id as GameId;
              const stale = now - g.updatedAt > TWELVE_HOURS;
              return (
                <li key={g.id} className="unfinished-row">
                  <p className="unfinished-line">
                    {game.info.title}, {time(g.createdAt)}, {d.calls} {d.calls === 1 ? 'number' : 'numbers'} called
                  </p>
                  {stale ? (
                    <>
                      <p className="note">Left more than 12 hours ago. What should happen to it?</p>
                      <div className="row">
                        <button type="button" className="button button-quiet" onClick={() => onGame(id, { id: g.id, action: 'resume' })}>
                          Resume
                        </button>
                        <button type="button" className="button button-quiet" onClick={() => onGame(id, { id: g.id, action: 'end' })}>
                          End it (with payouts so far)
                        </button>
                        <button type="button" className="button button-quiet" onClick={() => onGame(id, { id: g.id, action: 'discard' })}>
                          Discard it…
                        </button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="button button-quiet" onClick={() => onGame(id, { id: g.id, action: 'resume' })}>
                      Tap to resume
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

/** TAM-118: a one-time tip for iPhone hosts who have not added the app to the home screen. */
function InstallTip() {
  const [show, setShow] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    const iPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone =
      (navigator as unknown as { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
    return iPhone && !standalone && !preferences.get(TIP_KEY, false);
  });
  if (!show) return null;
  return (
    <aside className="tip" data-testid="install-tip">
      <p>
        Tip: tap Share, then Add to Home Screen, to open this app like any other.
      </p>
      <p>Games saved in Safari and in the Home Screen app are kept separate. The Home Screen app keeps them more reliably.</p>
      <button
        type="button"
        className="button"
        onClick={() => {
          preferences.set(TIP_KEY, true);
          setShow(false);
        }}
      >
        Got it
      </button>
    </aside>
  );
}

