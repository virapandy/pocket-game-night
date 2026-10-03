// Impostor's screens: "Who's playing?", "How do you want to play?", then the evening (Game). Also a past evening.
import { useRef, useState, type ReactNode } from 'react';
import type { Preferences, SavedGame, SavedGameStore, Session, SessionPicker } from '../../../engine';
import type { Choices } from '../rules';
import {
  cardDue, clearUi, clock, createEvening, describeEvening, endEvening, lastChoices, loadEvening, pastNames, PREF, record,
  sessionToAsk, suggestedSessionName, tonightsNames, unfinishedEvening, type Evening, type EveningMatch,
} from './evening';
import { Game } from './Game';
import { Dialog, HideMainButton, MainButton, QuietButton } from './parts';
import { LookBack } from './LookBack';
import { HowToPlayChoices, WhosPlaying } from './Setup';
import './impostor.css';

export interface ImpostorOpen {
  readonly id: string;
  /** Resume the unfinished evening, or start a new one with a past evening's players and choices. */
  readonly action: 'resume' | 'reuse';
}

type Route =
  | { name: 'players' }
  | { name: 'choices' }
  | { name: 'game'; saved: Evening; match: EveningMatch; resumed: boolean; seq: number };

function openRoute(store: SavedGameStore, open: ImpostorOpen | undefined): { route: Route; players?: string[]; choices?: Choices } {
  if (!open) return { route: { name: 'players' } };
  const saved = store.get(open.id) as Evening | undefined;
  const match = saved && loadEvening(saved);
  if (!saved || !match) return { route: { name: 'players' } };
  if (open.action === 'reuse') return { route: { name: 'players' }, players: [...match.state.players], choices: match.state.choices };
  return { route: { name: 'game', saved, match, resumed: true, seq: 0 } };
}

export function ImpostorScreen({
  onExit,
  onBack,
  onHistory,
  onSomethingElse,
  store,
  prefs,
  ui,
  sessions,
  open,
  testSeedsRaw,
  release,
}: {
  /** Home. */
  onExit: () => void;
  /** "← Back" on "Who's playing?": "What shall we play?" (IMP-003). */
  onBack: () => void;
  /** History; `backTo` is the evening to return to with "← Back" (opened from the between-rounds menu, IMP-075). */
  onHistory: (backTo?: string) => void;
  /** "Play something else" on the summary: "What shall we play?" (IMP-102). */
  onSomethingElse: () => void;
  store: SavedGameStore;
  prefs: Preferences;
  /** `pgn.impostor-ui.<id>` (Test hooks item 13). */
  ui: Preferences;
  sessions: SessionPicker;
  open?: ImpostorOpen;
  /** `localStorage['pgn.test.seeds']`, read at a new evening's first "Start round" (IMP-064). */
  testSeedsRaw: () => string | null;
  /** The release build (`--mode release`): test seeds are ignored. */
  release: boolean;
}) {
  const [start] = useState(() => openRoute(store, open));
  const [route, setRoute] = useState<Route>(start.route);
  const [players, setPlayers] = useState<string[]>(() => start.players ?? tonightsNames(store, sessions, Date.now()));
  const [choices, setChoices] = useState<Choices>(() => start.choices ?? lastChoices(prefs));
  const [past] = useState(() => pastNames(store));
  /** The evening made by "Start round" with nothing recorded yet (back from the read-aloud card). */
  const [created, setCreated] = useState<Evening | null>(null);
  const [larger, setLarger] = useState(() => prefs.get<boolean>(PREF.largerText, false) === true);

  const seqRef = useRef(0);
  const nextSeq = () => ++seqRef.current;
  /** IMP-001: another unfinished evening is ended (or carried on) before a new one starts. */
  const [asking, setAsking] = useState<{ saved: Evening; match: EveningMatch } | null>(null);
  /** PLT-016: "Continue '…' or start a new session?" when the last game was more than 3 hours ago. */
  const [askSession, setAskSession] = useState<Session | null>(null);
  const begin = (sessionId?: string) => {
    const reuse = created && store.get(created.id)?.records.length === 0 ? created : null;
    if (!reuse && sessionId === undefined) {
      const old = sessionToAsk(sessions, Date.now());
      if (old) {
        setAskSession(old);
        return;
      }
    }
    const ev = createEvening({
      store, prefs, sessions, players, choices, testSeedsRaw: testSeedsRaw(), release, reuse,
      ...(sessionId !== undefined ? { sessionId } : {}),
    });
    setCreated(ev.saved);
    if (cardDue(prefs, ev.saved)) {
      setRoute({ name: 'game', ...ev, resumed: false, seq: nextSeq() });
      return;
    }
    // IMP-070: no card for a later evening of the session; the app records the start of the deal itself.
    const dealt = record(store, ev.saved, ev.match, { type: 'startDeal', practice: false });
    setRoute({ name: 'game', ...(dealt ?? ev), resumed: false, seq: nextSeq() });
  };
  const startRound = () => {
    const other = unfinishedEvening(store);
    if (other && other.saved.id !== created?.id) setAsking(other);
    else begin();
  };

  let screen: ReactNode;
  switch (route.name) {
    case 'players':
      screen = (
        <WhosPlaying
          players={players}
          onChange={setPlayers}
          past={past}
          onBack={onBack}
          onNext={() => setRoute({ name: 'choices' })}
        />
      );
      break;
    case 'choices':
      screen = (
        <HowToPlayChoices choices={choices} onChange={setChoices} onBack={() => setRoute({ name: 'players' })} onStart={startRound} />
      );
      break;
    default:
      screen = (
        <Game
          key={`${route.saved.id}-${route.seq}`}
          store={store}
          prefs={prefs}
          ui={ui}
          initial={{ saved: route.saved, match: route.match }}
          resumed={route.resumed}
          past={past}
          onHome={onExit}
          onHistory={(fromMenu) => onHistory(fromMenu ? route.saved.id : undefined)}
          onSomethingElse={onSomethingElse}
          onBackToChoices={(saved) => {
            setCreated(saved);
            setPlayers([...saved.setup.config.players]);
            setChoices(saved.setup.config.choices);
            setRoute({ name: 'choices' });
          }}
          onSettingsClosed={() => setLarger(prefs.get<boolean>(PREF.largerText, false) === true)}
        />
      );
  }
  return (
    <div className={larger ? 'imp imp-larger' : 'imp'}>
      <HideMainButton.Provider value={asking !== null || askSession !== null}>{screen}</HideMainButton.Provider>
      {askSession && (
        <Dialog text={`Continue '${askSession.name}' or start a new session?`}>
          <QuietButton
            onClick={() => {
              setAskSession(null);
              begin(sessions.create(suggestedSessionName(Date.now()), Date.now()).id);
            }}
          >
            New session
          </QuietButton>
          <MainButton
            inline
            onClick={() => {
              const s = askSession;
              setAskSession(null);
              begin(s.id);
            }}
          >
            Continue '{askSession.name}'
          </MainButton>
        </Dialog>
      )}
      {asking && (
        <Dialog text={`Start a new evening? The evening from ${clock(asking.saved.createdAt)} will be ended.`}>
          <QuietButton
            onClick={() => {
              endEvening(store, asking.saved, asking.match);
              clearUi(ui, asking.saved.id);
              setAsking(null);
              begin();
            }}
          >
            Start new
          </QuietButton>
          <MainButton
            inline
            onClick={() => {
              const other = asking;
              setAsking(null);
              setRoute({ name: 'game', saved: other.saved, match: other.match, resumed: true, seq: nextSeq() });
            }}
          >
            Carry on that evening
          </MainButton>
        </Dialog>
      )}
    </div>
  );
}

/** A past evening, read-only (PLT-008): IMP-105's look back. */
export function ImpostorPastGame({ saved, onBack, actions }: { saved: SavedGame; onBack: () => void; actions?: ReactNode }) {
  const match = loadEvening(saved);
  const d = describeEvening(saved);
  return (
    <div className="imp">
      <main className="imp-screen imp-setup">
        <header className="imp-bar">
          <QuietButton onClick={onBack}>← Back</QuietButton>
        </header>
        <div className="imp-scroll">
          <h1 className="imp-title">Impostor · {d.result}</h1>
          <p className="imp-body">Started {clock(saved.createdAt)}</p>
          {match && <LookBack match={match} />}
          {actions}
        </div>
      </main>
    </div>
  );
}
