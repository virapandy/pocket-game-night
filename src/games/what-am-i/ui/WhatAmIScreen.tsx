// What Am I? on the host phone (lane W2): setup (S1 Who's playing?, S2 Words and time, S3 Read this aloud, S4 How to play)
// up to the night's first `start`, then the game in its frame (Frame.tsx). Opened from the picker (a new night), History's
// "Play again" (WAI-092: S1 with its players, S2 with its last choices) or a resume (Home's row, a reload, back from History).
import { useState, type ReactNode } from 'react';
import { BlocksRoot } from '../../../blocks';
import type { Preferences, SavedGameStore, SessionPicker } from '../../../engine';
import type { Choices } from '../rules';
import { WhatAmIGame } from './Frame';
import { takeTestSetup } from './hooks';
import { createNight, lastChoices, openNight, PREF, record, sameChoices, startGame, tonightsNames, type Live } from './night';
import { HowToPlay, ReadAloud, WhosPlaying, WordsAndTime } from './Setup';
import './wai.css';

export type WhatAmIStart =
  | { readonly kind: 'new'; readonly names?: readonly string[] }
  | { readonly kind: 'again'; readonly id: string }
  | { readonly kind: 'resume'; readonly id: string; readonly welcome?: boolean };

type Step = 'names' | 'choices' | 'aloud' | 'how' | 'playing';

export function WhatAmIScreen({
  start,
  store,
  prefs,
  ui,
  sessions,
  settingsPanel,
  onExit,
  onBack,
  onHistory,
}: {
  start: WhatAmIStart;
  store: SavedGameStore;
  prefs: Preferences;
  /** `pgn.whatAmI-ui.*`. */
  ui: Preferences;
  sessions: SessionPicker;
  /** The app's own settings (Larger text and the rest), shown under What Am I?'s switch. */
  settingsPanel: ReactNode;
  /** Home. */
  onExit: () => void;
  /** S1's "← Back" (the picker, names kept for this visit), or G2's "Play something else" with tonight's names. */
  onBack: (names: string[]) => void;
  /** The menu's "History" on a game night (its "← Back" returns to that night). */
  onHistory: (id: string) => void;
}) {
  const [init] = useState(() => opening(start, store, prefs, sessions));
  const [step, setStep] = useState<Step>(init.step);
  const [howFrom, setHowFrom] = useState<Step>('names');
  const [names, setNames] = useState<string[]>(init.names);
  const [choices, setChoices] = useState<Choices>(init.choices);
  const [nightId, setNightId] = useState<string | null>(init.id);
  /** "Change players or words" from R1 or G1 (lane W4): setup for this night's game. */
  const [changing, setChanging] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(start.kind === 'resume' && start.welcome === true);
  const [larger, setLarger] = useState(() => prefs.get<boolean>(PREF.largerText, false) === true);
  const [gameKey, setGameKey] = useState(0);

  const how = (from: Step) => {
    setHowFrom(from);
    setStep('how');
  };
  const play = (id: string) => {
    setNightId(id);
    setChanging(null);
    setWelcome(false);
    setGameKey((k) => k + 1);
    setStep('playing');
  };
  const firstTurn = () => {
    const live = createNight({ store, prefs, sessions, players: names, choices, test: takeTestSetup() });
    if (live) play(live.saved.id);
  };
  /** S2's main while changing a night's game: G1 starts the next game; R1 records the changes and carries on. */
  const changeStart = () => {
    const live = changing ? openNight(store, changing) : null;
    if (!live) return;
    const s = live.match.state;
    if (s.step === 'gameOver') {
      if (startGame(store, prefs, live, names, choices)) play(live.saved.id);
      return;
    }
    let cur: Live | null = live;
    const sameNames = names.length === s.order.length && names.every((n, i) => n === s.order[i]);
    if (!sameNames) cur = cur && record(store, cur, { type: 'setPlayers', players: [...names] });
    if (cur && s.choices && !sameChoices(choices, s.choices)) cur = record(store, cur, { type: 'setChoices', choices });
    if (cur) play(cur.saved.id);
  };

  let screen: ReactNode;
  switch (step) {
    case 'names':
      screen = (
        <WhosPlaying
          names={names}
          onChange={setNames}
          {...(changing ? { backLabel: '← Back to the game' } : {})}
          onBack={() => (changing ? play(changing) : onBack(names))}
          onHowToPlay={() => how('names')}
          onNext={() => setStep('choices')}
        />
      );
      break;
    case 'choices': {
      const live = changing ? openNight(store, changing) : null;
      const midGame = live !== null && live.match.state.step !== 'gameOver';
      screen = (
        <WordsAndTime
          choices={choices}
          onChange={setChoices}
          onBack={() => setStep('names')}
          onHowToPlay={() => how('choices')}
          {...(midGame ? { startLabel: 'Carry on playing' } : {})}
          onStart={() => (changing ? changeStart() : setStep('aloud'))}
        />
      );
      break;
    }
    case 'aloud':
      screen = <ReadAloud choices={choices} onBack={() => setStep('choices')} onHowToPlay={() => how('aloud')} onFirstTurn={firstTurn} />;
      break;
    case 'how':
      screen = <HowToPlay onDone={() => setStep(howFrom)} />;
      break;
    default:
      screen = nightId ? (
        <WhatAmIGame
          key={`${nightId}:${gameKey}`}
          id={nightId}
          store={store}
          prefs={prefs}
          ui={ui}
          settingsPanel={settingsPanel}
          welcome={welcome}
          onHome={onExit}
          onHistory={() => onHistory(nightId)}
          onSettingsDone={() => setLarger(prefs.get<boolean>(PREF.largerText, false) === true)}
          onChangeSetup={() => {
            const live = openNight(store, nightId);
            if (!live) return;
            const s = live.match.state;
            setNames([...s.order]);
            if (s.choices) setChoices(s.choices);
            setChanging(nightId);
            setStep('names');
          }}
          onSomethingElse={onBack}
        />
      ) : null;
  }
  return (
    <BlocksRoot className="wai" larger={larger}>
      {screen}
    </BlocksRoot>
  );
}

/** Where the screen opens, and with what. */
function opening(
  start: WhatAmIStart,
  store: SavedGameStore,
  prefs: Preferences,
  sessions: SessionPicker,
): { step: Step; names: string[]; choices: Choices; id: string | null } {
  if (start.kind === 'resume') return { step: 'playing', names: [], choices: lastChoices(prefs), id: start.id };
  if (start.kind === 'again') {
    const live = openNight(store, start.id);
    if (live) {
      const s = live.match.state;
      return { step: 'names', names: [...s.order], choices: s.choices ?? lastChoices(prefs), id: null };
    }
  }
  const names = start.kind === 'new' && start.names ? [...start.names] : tonightsNames(store, sessions, Date.now());
  return { step: 'names', names: names.slice(0, 20), choices: lastChoices(prefs), id: null };
}
