import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { makePlayerReport, makeReport, type Preferences, type Report, type ReportSubject, type SavedGame } from '../engine';
import { games, hostGames, impostor, phoneGames, tambola, type GameId, type HostGameId, type PhoneGameId } from './games';
import { History, isPast, unsettledSessionName, type Deleted } from './History';
import { CrashNotice, ReportForm, ReportToast, WaitingReports } from './Report';
import { APP_VERSION, hasRealDestination, phoneType, queueReport, startReportSender } from './reports';
import { Dialog, SessionList, SessionScreen } from './Sessions';
import { gameStore, impostorUi, IS_RELEASE, preferences, sessionPicker, testSeedsRaw } from './storage';

const TWELVE_HOURS = 12 * 3600_000;
const TIP_KEY = 'install-tip.seen';
const UNDO_MS = 5_000;

type OpenAction = 'resume' | 'end' | 'discard' | 'reuse';

type Route =
  | { name: 'home' }
  /** "What shall we play?" (IMP-001), after Home's "Host a game". */
  | { name: 'pick'; impostorPlayers?: string[]; names?: string[] }
  /** `backTo`: History opened from an Impostor evening's menu, with "← Back" to that evening (IMP-075). */
  | { name: 'history'; backTo?: string }
  | { name: 'past'; id: string }
  | { name: 'sessions' }
  | { name: 'session'; id: string }
  | {
      name: 'game';
      gameId: GameId;
      open?: { id: string; action: OpenAction };
      startAt?: 'settings';
      /** IMP-003: Impostor's list kept in the same visit; IMP-102: tonight's names for Tambola's new setup. */
      players?: string[];
    }
  /** A player's phone (Phase 2): tickets opened from a ticket QR's link, or typed in. */
  | { name: 'phone'; gameId: PhoneGameId; link: string | null; enter: boolean | 'join'; nonce: number };

const gameOf = (type: string) => games.find((g) => g.info.id === type);
const phoneGameOf = (type: string) => phoneGames.find((g) => g.info.id === type);

/** A ticket QR opens the app with "#t=<ticket>" (TAM-117). Read raw: the ticket text is decoded by the game. */
function phoneLink(): Extract<Route, { name: 'phone' }> | null {
  if (typeof location === 'undefined') return null;
  for (const g of phoneGames) {
    const prefix = `#${g.phone.linkKey}=`;
    if (location.hash.startsWith(prefix)) {
      return { name: 'phone', gameId: g.info.id as PhoneGameId, link: location.hash.slice(prefix.length), enter: false, nonce: Date.now() };
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
  // IMP-101: an Impostor summary that was showing and not left shows again.
  const summary = impostor.pendingSummary(gameStore, impostorUi);
  if (summary) return { name: 'game', gameId: 'impostor', open: { id: summary, action: 'resume' } };
  const holder = phoneGames.find((g) => g.phone.hasTickets(preferences));
  return holder ? { name: 'phone', gameId: holder.info.id as PhoneGameId, link: null, enter: false, nonce: 0 } : route;
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

/** "8:40 pm" (IMP-001), made here so every browser writes "pm" the same way (Safari on a Mac wrote "PM"). */
function time(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** Home's unfinished row: "Tambola, 8:40 pm, 12 numbers called" or "Impostor · Riya, Arjun +2 · round 4" (IMP-001). */
function unfinishedText(g: SavedGame): string {
  if (g.gameType === impostor.info.id) return impostor.unfinishedLine(g);
  const game = gameOf(g.gameType);
  const d = game?.describe(g);
  const calls = d && 'calls' in d ? d.calls : 0;
  return `${game?.info.title ?? g.gameType}, ${time(g.createdAt)}, ${calls} ${calls === 1 ? 'number' : 'numbers'} called`;
}

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

  if (route.name === 'game' && route.gameId === 'impostor') {
    const open = route.open;
    return (
      <impostor.Screen
        onExit={home}
        onBack={(players) => setRoute({ name: 'pick', impostorPlayers: players })}
        onHistory={(backTo) => setRoute(backTo ? { name: 'history', backTo } : { name: 'history' })}
        onSomethingElse={(names) => setRoute({ name: 'pick', names })}
        store={gameStore}
        prefs={preferences}
        ui={impostorUi}
        sessions={sessionPicker}
        testSeedsRaw={testSeedsRaw}
        release={IS_RELEASE}
        {...(open && (open.action === 'resume' || open.action === 'reuse') ? { open: { id: open.id, action: open.action } } : {})}
        {...(route.players ? { players: route.players } : {})}
      />
    );
  }
  if (route.name === 'game' && route.gameId === tambola.info.id) {
    return (
      <tambola.Screen
        onExit={home}
        store={gameStore}
        prefs={preferences}
        sessions={sessionPicker}
        onSession={(id) => setRoute({ name: 'session', id })}
        onReport={onReport}
        settingsExtra={
          <>
            {/* IMP-014, IMP-109: Impostor's switches, in its own sizes. */}
            <div className="imp">
              <impostor.Settings prefs={preferences} />
            </div>
            <WaitingReports />
          </>
        }
        {...(route.open ? { open: route.open } : {})}
        {...(route.startAt ? { startAt: route.startAt } : {})}
        {...(route.players ? { names: route.players } : {})}
      />
    );
  }
  if (route.name === 'pick') {
    return (
      <PickGame
        onBack={home}
        onPick={(id) => {
          // IMP-003: Impostor's list comes back in the same visit; IMP-102: tonight's names go to Tambola's setup.
          const players = id === impostor.info.id ? route.impostorPlayers : route.names;
          setRoute(players ? { name: 'game', gameId: id, players } : { name: 'game', gameId: id });
        }}
        onResume={(id) => setRoute({ name: 'game', gameId: 'impostor', open: { id, action: 'resume' } })}
      />
    );
  }
  if (route.name === 'phone') {
    const game = phoneGameOf(route.gameId);
    if (game) {
      return (
        <game.phone.Screen
          prefs={preferences}
          link={route.link}
          enter={route.enter}
          nonce={route.nonce}
          onHome={home}
          onReport={onReport}
          joinNote={impostor.joinNote}
        />
      );
    }
  }
  if (route.name === 'history') {
    const backTo = route.backTo;
    return (
      <History
        onBack={backTo ? () => setRoute({ name: 'game', gameId: 'impostor', open: { id: backTo, action: 'resume' } }) : home}
        backLabel={backTo ? '← Back' : '← Home'}
        onOpen={(id) => {
          // IMP-094: an Impostor evening in progress is resumed, never looked back at.
          const g = gameStore.get(id);
          if (g?.gameType === impostor.info.id && g.status === 'in-progress') setRoute({ name: 'game', gameId: 'impostor', open: { id, action: 'resume' } });
          else setRoute({ name: 'past', id });
        }}
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
      const PastGame = game.PastGame as (p: { saved: SavedGame; onBack: () => void; actions?: ReactNode; prefs?: Preferences }) => ReactNode;
      return (
        <PastGame
          saved={saved}
          prefs={preferences}
          onBack={() => setRoute({ name: 'history' })}
          actions={
            <PastGameActions
              saved={saved}
              reuseLabel={game.info.id === impostor.info.id ? impostor.reuseLabel : 'Use this setup'}
              onReuse={() => setRoute({ name: 'game', gameId: game.info.id as GameId, open: { id: saved.id, action: 'reuse' } })}
              onCarryOn={(id) => setRoute({ name: 'game', gameId: 'impostor', open: { id, action: 'resume' } })}
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
      onHost={() => setRoute({ name: 'pick' })}
      onGame={(gameId, open) => setRoute(open ? { name: 'game', gameId, open } : { name: 'game', gameId })}
      onHistory={() => setRoute({ name: 'history' })}
      onSessions={() => setRoute({ name: 'sessions' })}
      onTickets={(enter) => setRoute({ name: 'phone', gameId: phoneGames[0].info.id, link: null, enter, nonce: Date.now() })}
      onSettings={() => setRoute({ name: 'game', gameId: games[0].info.id as GameId, startAt: 'settings' })}
      onReport={() => onReport(null)}
    />
  );
}

/** PLT-009, PLT-010, PLT-025: "Use this setup" and "Delete" on a past game. Unfinished games cannot be deleted. */
function PastGameActions({
  saved,
  reuseLabel,
  onReuse,
  onCarryOn,
  onDelete,
}: {
  saved: SavedGame;
  /** "Use this setup" (PLT-009); Impostor's "Play again" (IMP-103). */
  reuseLabel: string;
  onReuse: () => void;
  /** IMP-001: "Carry on that game" (the unfinished Impostor game). */
  onCarryOn: (id: string) => void;
  onDelete: () => void;
}) {
  const [asking, setAsking] = useState<string | null>(null);
  /** IMP-001: Impostor's "Play again" while another Impostor game is unfinished asks once first. */
  const [startNew, setStartNew] = useState<{ id: string; startedAt: string } | null>(null);
  const reuse = () => {
    const u = saved.gameType === impostor.info.id ? impostor.unfinished(gameStore) : null;
    if (u && u.id !== saved.id) setStartNew(u);
    else onReuse();
  };
  // IMP-001, IMP-103: the unfinished Impostor game's own row has no "Play again" (a tap on the row resumes it).
  const ownUnfinished = saved.gameType === impostor.info.id && saved.status === 'in-progress';
  return (
    <div className="row">
      {!ownUnfinished && (
        <button type="button" className="button" onClick={reuse}>
          {reuseLabel}
        </button>
      )}
      {startNew && (
        <StartNewDialog
          startedAt={startNew.startedAt}
          onCarryOn={() => onCarryOn(startNew.id)}
          onStartNew={() => {
            impostor.endNow(gameStore, impostorUi, startNew.id);
            onReuse();
          }}
        />
      )}
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
 * Home (PLT-300): two equal choices, "Host a game" and "Join a game", then any unfinished games as plain
 * rows. Sessions, History, Report a problem and Settings sit in the menu (⋯). A first visit says "You're ready for
 * game night" (TAM-057): the app is saved on this phone and opens with no internet from now on.
 */
function Home({
  needRefresh,
  onUpdate,
  onHost,
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
  /** "Host a game": "What shall we play?" (IMP-001). */
  onHost: () => void;
  onGame: (gameId: GameId, open?: { id: string; action: OpenAction }) => void;
  onHistory: () => void;
  onSessions: () => void;
  /** Phase 2: a player's phone tickets (false), joining with a ticket ('join'), or typing a ticket code (true). */
  onTickets: (enter: boolean | 'join') => void;
  onSettings: () => void;
}) {
  const [holdsTickets] = useState(() => phoneGames.some((g) => g.phone.hasTickets(preferences, false)));
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
  const [unfinished] = useState<SavedGame[]>(() => {
    // IMP-104: an Impostor evening left more than 12 hours ends by itself before the list is made.
    impostor.sweep(gameStore, impostorUi);
    return gameStore
      .list()
      .filter((g) => (g.status === 'in-progress' || g.status === 'paused') && gameOf(g.gameType))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  });
  const [now] = useState(() => Date.now());
  const pick = (run: () => void) => () => {
    setMenu(false);
    run();
  };
  // I29: a tap on any of Home's buttons within 500 ms of Home showing is ignored (a double tap never skips a screen).
  const guard = impostor.useTapGuard('home');
  return (
    <main className="screen home" onClickCapture={guard}>
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
        <button type="button" className="choice-card home-card" onClick={onHost}>
          <span className="choice-card-title">Host a game</span>
          <span className="choice-card-text">{hostGames.map((g) => g.info.title).join(' or ')} on this phone</span>
        </button>
        <button type="button" className="choice-card home-card" onClick={() => onTickets('join')}>
          <span className="choice-card-title">Join a game</span>
          <span className="choice-card-text">Tambola ticket from the host</span>
        </button>
      </div>

      {holdsTickets && (
        <button type="button" className="home-row" onClick={() => onTickets(false)}>
          <span>Your tickets</span>
          <span aria-hidden="true">›</span>
        </button>
      )}
      {/* PLT-300 (UX list row 21): tickets more than 6 hours old wait here, with Open and Clear. */}
      {phoneGames.map((g) => (
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
              const id = game.info.id as GameId;
              // IMP-001: an Impostor evening is never "stale" here; IMP-104 ends it after 12 hours instead.
              const stale = id !== 'impostor' && now - g.updatedAt > TWELVE_HOURS;
              return (
                <li key={g.id} className="unfinished-row">
                  <p className="unfinished-line">{unfinishedText(g)}</p>
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

/**
 * IMP-001: "What shall we play?": one equal card per game, none with the main look and no main button; a tap
 * opens that game's setup at once. "← Back" returns to Home. An unfinished Impostor evening shows above the cards
 * ("Impostor · Riya, Arjun +2 · round 4", "Tap to resume"); the Impostor card then asks once before starting a new game.
 */
/**
 * IMP-001, F12: a game's line on its card, where a part with a number ("3–20 players", "2 hrs") never breaks across
 * two lines; the line still wraps between its parts.
 */
function Tagline({ text }: { text: string }) {
  const parts = text.split(' · ');
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {/\d/.test(part) ? <span className="nowrap">{part}</span> : part}
        </Fragment>
      ))}
    </>
  );
}

function PickGame({
  onBack,
  onPick,
  onResume,
}: {
  onBack: () => void;
  onPick: (id: HostGameId) => void;
  onResume: (id: string) => void;
}) {
  const [unfinished] = useState(() => {
    impostor.sweep(gameStore, impostorUi);
    return impostor.unfinished(gameStore);
  });
  const [asking, setAsking] = useState(false);
  // I29: the 500 ms tap guard from when this screen shows, and again when "Start a new game?" opens or closes.
  const guard = impostor.useTapGuard(asking);
  return (
    <main className="screen" onClickCapture={guard}>
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Back
        </button>
      </header>
      <h1 className="step-title">What shall we play?</h1>
      {unfinished && (
        <button type="button" className="choice-card" data-testid="resume-card" onClick={() => onResume(unfinished.id)}>
          <span className="choice-card-title">{unfinished.label}</span>
          <span className="choice-card-text">Tap to resume</span>
        </button>
      )}
      <div className="home-choices">
        {hostGames.map((g) => (
          <button
            key={g.info.id}
            type="button"
            className="choice-card"
            onClick={() => (g.info.id === impostor.info.id && unfinished ? setAsking(true) : onPick(g.info.id))}
          >
            <span className="choice-card-title">{g.info.title}</span>
            <span className="choice-card-text">
              <Tagline text={g.info.tagline} />
            </span>
          </button>
        ))}
      </div>
      {asking && unfinished && (
        <StartNewDialog
          startedAt={unfinished.startedAt}
          onCarryOn={() => onResume(unfinished.id)}
          onStartNew={() => {
            impostor.endNow(gameStore, impostorUi, unfinished.id);
            onPick(impostor.info.id);
          }}
        />
      )}
    </main>
  );
}

/**
 * IMP-001 (M22): asked once, before a new Impostor game while another is unfinished, from the Impostor card or
 * History's "Play again": two equal outlined buttons, neither with the main look.
 */
function StartNewDialog({ startedAt, onCarryOn, onStartNew }: { startedAt: string; onCarryOn: () => void; onStartNew: () => void }) {
  return (
    <div className="backdrop">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="start-new-text">
        <p id="start-new-text" className="lead">
          Start a new game? The game from {startedAt} will be ended.
        </p>
        <div className="row row-equal">
          <button type="button" className="button button-quiet" onClick={onCarryOn}>
            Carry on that game
          </button>
          <button type="button" className="button button-quiet" onClick={onStartNew}>
            Start new
          </button>
        </div>
      </div>
    </div>
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
        className="button button-quiet"
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

