// Impostor's screens: "Who's playing?", "How do you want to play?", then the evening (Game). Also a past evening.
import { useRef, useState, type ReactNode } from 'react';
import type { Preferences, SavedGame, SavedGameStore, SessionPicker } from '../../../engine';
import type { Choices } from '../rules';
import {
  cardDue, clock, createEvening, describeEvening, lastChoices, loadEvening, pastNames, PREF, record, tonightsNames,
  type Evening, type EveningMatch,
} from './evening';
import { Game } from './Game';
import { QuietButton } from './parts';
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
  onHistory: () => void;
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
  const startRound = () => {
    const reuse = created && store.get(created.id)?.records.length === 0 ? created : null;
    const ev = createEvening({ store, prefs, sessions, players, choices, testSeedsRaw: testSeedsRaw(), release, reuse });
    setCreated(ev.saved);
    if (cardDue(prefs, ev.saved)) {
      setRoute({ name: 'game', ...ev, resumed: false, seq: nextSeq() });
      return;
    }
    // IMP-070: no card for a later evening of the session; the app records the start of the deal itself.
    const dealt = record(store, ev.saved, ev.match, { type: 'startDeal', practice: false });
    setRoute({ name: 'game', ...(dealt ?? ev), resumed: false, seq: nextSeq() });
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
          onHome={onExit}
          onHistory={onHistory}
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
  return <div className={larger ? 'imp imp-larger' : 'imp'}>{screen}</div>;
}

/** A past evening, read-only (PLT-008). The full look back (IMP-105) is the next build's. */
export function ImpostorPastGame({ saved, onBack, actions }: { saved: SavedGame; onBack: () => void; actions?: ReactNode }) {
  const d = describeEvening(saved);
  const match = loadEvening(saved);
  return (
    <div className="imp">
      <main className="imp-screen imp-setup">
        <header className="imp-bar">
          <QuietButton onClick={onBack}>← Back</QuietButton>
        </header>
        <div className="imp-scroll">
          <h1 className="imp-title">Impostor · {d.result}</h1>
          <p className="imp-body">Started {clock(saved.createdAt)}</p>
          {match && <p className="imp-body">{match.state.players.join(', ')}</p>}
          {actions}
        </div>
      </main>
    </div>
  );
}
