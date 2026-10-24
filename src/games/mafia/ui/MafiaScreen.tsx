// Mafia on the host phone: setup (S1 Who's playing?, S2 Roles, S3 Read this aloud, S4 How to play) up to the first deal,
// then the game night in its room frame (Room.tsx). Opened new (from the picker, once Mafia is on it) or resumed (Home's
// row, a reload, or MAF-H6 in development and preview builds).
import { useEffect, useState, type ReactNode } from 'react';
import { startMatch, type Preferences, type SavedGameStore, type SetupInput } from '../../../engine';
import { BlocksRoot } from '../../../blocks';
import { mafiaCounts, mafiaRules, type MafiaConfig } from '../rules';
import { MafiaRoom } from './Room';
import { HowToPlay, ReadAloud, Roles, WhosPlaying } from './Setup';
import { newNightId, newSetup, playMoves, saveNight, saveScreen } from './tonight';
import './mafia.css';

export type MafiaStart =
  | { readonly kind: 'new'; readonly names?: readonly string[] }
  | { readonly kind: 'resume'; readonly id: string; readonly welcome?: boolean };

type Step = 'names' | 'roles' | 'aloud' | 'how' | 'room';

/** The game night being set up: its id, setup (role seed) and creation time, kept when S3's Back removes the deal. */
interface Pending {
  readonly id: string;
  readonly createdAt: number;
  readonly setup: SetupInput<MafiaConfig>;
}

const LARGER = 'largerText';

export function MafiaScreen({
  start,
  store,
  prefs,
  testSeedsRaw,
  release,
  settingsPanel,
  onExit,
  onBack,
  onHistory,
  onSomethingElse,
  onPlaying,
}: {
  start: MafiaStart;
  store: SavedGameStore;
  prefs: Preferences;
  /** `localStorage['pgn.test.seeds']` (item 33), read when a new game night's first `start` is recorded. */
  testSeedsRaw: () => string | null;
  release: boolean;
  /** This phone's settings (Larger text and the rest), from G1's menu. */
  settingsPanel: ReactNode;
  /** Home. */
  onExit: () => void;
  /** S1's "← Back": the picker, with the names as they are. */
  onBack: (names: string[]) => void;
  onHistory: () => void;
  /** G2's "Play something else": the picker with tonight's names. */
  onSomethingElse: (names: string[]) => void;
  /** True while a game night's screens show (the app keeps phone Back in the game), false on setup. */
  onPlaying?: (playing: boolean) => void;
}) {
  const [step, setStep] = useState<Step>(start.kind === 'resume' ? 'room' : 'names');
  const [howFrom, setHowFrom] = useState<Step>('names');
  const [names, setNames] = useState<string[]>(start.kind === 'new' && start.names ? [...start.names] : []);
  /** MAF-003 (item 27): the Mafia count, and the number of players it was set for. */
  const [count, setCount] = useState<{ m: number; n: number } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [room, setRoom] = useState<{ id: string; welcome: boolean } | null>(
    start.kind === 'resume' ? { id: start.id, welcome: start.welcome ?? true } : null,
  );
  const [larger, setLarger] = useState(() => prefs.get<boolean>(LARGER, false) === true);

  useEffect(() => {
    onPlaying?.(step === 'room');
  }, [step, onPlaying]);

  const toRoles = () => {
    // Item 27: M resets to the suggestion when the number of players changed since it was last set tonight.
    if (!count || count.n !== names.length) setCount({ m: mafiaCounts(names.length).suggested, n: names.length });
    setStep('roles');
  };
  const how = (from: Step) => {
    setHowFrom(from);
    setStep('how');
  };
  /** MAF-004: "Give everyone a role" records `start` and deals; the first game of tonight opens Read this aloud. */
  const deal = () => {
    if (!count) return;
    const now = Date.now();
    const id = pending?.id ?? newNightId();
    const setup = pending?.setup ?? newSetup(id, testSeedsRaw(), release);
    const createdAt = pending?.createdAt ?? now;
    const match = playMoves(startMatch(mafiaRules, setup, now), [{ type: 'start', players: names, mafiaCount: count.m }], now);
    if (!match) return;
    saveNight(store, { id, createdAt }, match, now);
    saveScreen(prefs, id, 'b1');
    setPending({ id, createdAt, setup });
    setStep('aloud');
  };
  /** MAF-005: S3's "← Back" removes the deal (PO 4: the same roles come again, same seed and game). */
  const undeal = () => {
    if (pending) store.remove(pending.id);
    setStep('roles');
  };

  let screen: ReactNode;
  switch (step) {
    case 'names':
      screen = <WhosPlaying names={names} onChange={setNames} onBack={() => onBack(names)} onHowToPlay={() => how('names')} onNext={toRoles} />;
      break;
    case 'roles':
      screen = count && (
        <Roles
          n={names.length}
          m={count.m}
          onCount={(m) => setCount({ m, n: names.length })}
          onBack={() => setStep('names')}
          onHowToPlay={() => how('roles')}
          onDeal={deal}
        />
      );
      break;
    case 'aloud':
      screen = count && (
        <ReadAloud
          m={count.m}
          onBack={undeal}
          onHowToPlay={() => how('aloud')}
          onPass={() => {
            if (!pending) return;
            setRoom({ id: pending.id, welcome: false });
            setStep('room');
          }}
        />
      );
      break;
    case 'how':
      screen = <HowToPlay onDone={() => setStep(howFrom)} />;
      break;
    default:
      screen = room && (
        <MafiaRoom
          key={room.id}
          id={room.id}
          store={store}
          prefs={prefs}
          welcome={room.welcome}
          settingsPanel={settingsPanel}
          onLargerChanged={() => setLarger(prefs.get<boolean>(LARGER, false) === true)}
          onHome={onExit}
          onHistory={onHistory}
          onSomethingElse={onSomethingElse}
        />
      );
  }
  return (
    <BlocksRoot className="maf" larger={larger}>
      {screen}
    </BlocksRoot>
  );
}
