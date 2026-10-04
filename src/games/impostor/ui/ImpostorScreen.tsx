// Impostor's screens: "Who's playing?", "How do you want to play?", then the evening (Game). Also a past evening.
import { useRef, useState, type ReactNode } from 'react';
import type { Preferences, SavedGame, SavedGameStore, SessionPicker } from '../../../engine';
import type { Choices } from '../rules';
import {
  clearUi, clock, createEvening, describeEvening, endEvening, lastChoices, loadEvening, pastNames, PREF, readChoices, record,
  tonightsNames, unfinishedEvening, type Evening, type EveningMatch,
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

function openRoute(
  store: SavedGameStore,
  open: ImpostorOpen | undefined,
): { route: Route; players?: string[]; choices?: Choices; created?: Evening } {
  if (!open) return { route: { name: 'players' } };
  const saved = store.get(open.id) as Evening | undefined;
  const match = saved && loadEvening(saved);
  if (!saved || !match) return { route: { name: 'players' } };
  // IMP-103: the past evening's choices (names not among the 9 dropped; no lastGuess reads as on).
  const choices = readChoices(match.state.choices, { savedEvening: true });
  if (open.action === 'reuse') return { route: { name: 'players' }, players: [...match.state.players], choices };
  // An evening made by "Start round" with no deal recorded (an older build's read-aloud card): back to its choices.
  if (match.state.phase === 'ready') {
    return { route: { name: 'choices' }, players: [...match.state.players], choices, created: saved };
  }
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
  players: kept,
  testSeedsRaw,
  release,
}: {
  /** Home. */
  onExit: () => void;
  /** "← Back" on "Who's playing?": "What shall we play?" (IMP-003), with the list as it is, kept for this visit. */
  onBack: (players: string[]) => void;
  /** History; `backTo` is the evening to return to with "← Back" (opened from the between-rounds menu, IMP-075). */
  onHistory: (backTo?: string) => void;
  /** "Play something else" on the summary: "What shall we play?" (IMP-102), with the evening's players. */
  onSomethingElse: (players: string[]) => void;
  store: SavedGameStore;
  prefs: Preferences;
  /** `pgn.impostor-ui.<id>` (Test hooks item 13). */
  ui: Preferences;
  sessions: SessionPicker;
  open?: ImpostorOpen;
  /** IMP-003: the list kept from earlier in the same visit ("← Back", then the Impostor card again). */
  players?: readonly string[];
  /** `localStorage['pgn.test.seeds']`, read at a new evening's first "Start round" (IMP-064). */
  testSeedsRaw: () => string | null;
  /** The release build (`--mode release`): test seeds are ignored. */
  release: boolean;
}) {
  const [start] = useState(() => openRoute(store, open));
  const [route, setRoute] = useState<Route>(start.route);
  const [players, setPlayers] = useState<string[]>(() => start.players ?? (kept ? [...kept] : null) ?? tonightsNames(store, sessions, Date.now()));
  const [choices, setChoices] = useState<Choices>(() => start.choices ?? lastChoices(prefs));
  /** IMP-009: the choices carried over (last time's, or "Play again"); null on a phone that has never played. */
  const [carried, setCarried] = useState<Choices | null>(() => (start.choices || prefs.get<unknown>(PREF.lastChoices, null) !== null ? choices : null));
  const [past] = useState(() => pastNames(store));
  /** The evening made by "Start round" with nothing recorded yet (reused by the next "Start round"). */
  const [created, setCreated] = useState<Evening | null>(start.created ?? null);
  const [larger, setLarger] = useState(() => prefs.get<boolean>(PREF.largerText, false) === true);

  const seqRef = useRef(0);
  const nextSeq = () => ++seqRef.current;
  /** IMP-001: another unfinished evening is ended (or carried on) before a new one starts. */
  const [asking, setAsking] = useState<{ saved: Evening; match: EveningMatch; practice: boolean } | null>(null);
  /** IMP-008, IMP-071: "Start round" (or "Practice round first") creates the evening and starts its first deal. */
  const begin = (practice: boolean) => {
    const reuse = created && store.get(created.id)?.records.length === 0 ? created : null;
    const ev = createEvening({ store, prefs, sessions, players, choices, testSeedsRaw: testSeedsRaw(), release, reuse });
    setCreated(ev.saved);
    const dealt = record(store, ev.saved, ev.match, { type: 'startDeal', practice });
    setRoute({ name: 'game', ...(dealt ?? ev), resumed: false, seq: nextSeq() });
  };
  const startRound = (practice: boolean) => {
    const other = unfinishedEvening(store);
    if (other && other.saved.id !== created?.id) setAsking({ ...other, practice });
    else begin(practice);
  };

  let screen: ReactNode;
  switch (route.name) {
    case 'players':
      screen = (
        <WhosPlaying
          players={players}
          onChange={setPlayers}
          past={past}
          onBack={() => onBack(players)}
          onNext={() => setRoute({ name: 'choices' })}
        />
      );
      break;
    case 'choices':
      screen = (
        <HowToPlayChoices
          choices={choices}
          onChange={setChoices}
          onBack={() => setRoute({ name: 'players' })}
          onStart={() => startRound(false)}
          onPractice={() => startRound(true)}
          lastGuess={choices.lastGuess}
          onLastGuess={(on) => on !== choices.lastGuess && setChoices({ ...choices, lastGuess: on })}
          sameAsLast={carried !== null && choices === carried}
        />
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
          onPlayAgain={(names, last) => {
            // IMP-092, IMP-103: the game just ended, so no "Start a new game?" follows.
            const c = readChoices(last, { savedEvening: true });
            setPlayers(names);
            setChoices(c);
            setCarried(c);
            setCreated(null);
            setRoute({ name: 'players' });
          }}
          onSomethingElse={() => {
            const s = store.get(route.saved.id);
            const m = s && loadEvening(s);
            onSomethingElse(m ? [...m.state.players] : [...route.saved.setup.config.players]);
          }}
          onBackToChoices={(saved) => {
            setCreated(saved);
            setPlayers([...saved.setup.config.players]);
            setChoices(readChoices(saved.setup.config.choices, { savedEvening: true }));
            setRoute({ name: 'choices' });
          }}
          onSettingsClosed={() => setLarger(prefs.get<boolean>(PREF.largerText, false) === true)}
        />
      );
  }
  return (
    <div className={larger ? 'imp imp-larger' : 'imp'}>
      <HideMainButton.Provider value={asking !== null}>{screen}</HideMainButton.Provider>
      {asking && (
        <Dialog text={`Start a new evening? The evening from ${clock(asking.saved.createdAt)} will be ended.`}>
          <QuietButton
            onClick={() => {
              endEvening(store, asking.saved, asking.match);
              clearUi(ui, asking.saved.id);
              setAsking(null);
              begin(asking.practice);
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
