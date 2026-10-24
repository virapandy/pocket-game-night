// The game's frame on the host phone (lane W2): it holds the saved game night, records every move at once, and gives every
// game screen (T1–T4 from lane W3, R1, G1 and G2 from lane W4) the same frame: "··· Menu" (Version 1.1 item 39, Version 1.3
// item 3), the Pause button and the Paused cover (WAI-040; Version 1.1 item 46; Version 1.3 item 8; product owner 25 October,
// item 16), D7 "End Riya's turn now?" (WAI-043), Players and leaving (WAI-041, WAI-042), "End the game?" (WAI-060, Version
// 1.2 item 5) and "End for tonight?" (WAI-063), the Scores sheet (D8), the Words and time sheet (WAI-044), Settings and
// History (Version 1.2 item 16), "Welcome back." with the where-line (WAI-090), and the phone's Back and the app being hidden.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HideMainButton, QuietButton, Toast, type ToastState } from '../../../blocks';
import type { Preferences, SavedGameStore } from '../../../engine';
import { headOf, joinNames, toPlayOf, whatAmIRules, type Choices, type WaiMove, type WaiState, type WaiView } from '../rules';
import {
  dropLast, openNight, readUi, record, sameChoices, whereFor, writeUi, type Live, type NightUi,
} from './night';
import { PlayersSheet } from './Players';
import { ChoicesForm, HowToPlay } from './Setup';
import { WaiSettings } from './Settings';
import { GameMenu, Main, PauseButton, Scoreboard, WaiDialog, WaiSheet, WhereLine, useWaiBack, useWaiToast, type MenuEntry } from './parts';
import { GameOverScreen, PassScreen, RoundOverScreen, SummaryScreen, TurnScreen, TurnEndScreen } from './Screens';

/** Which game screen a state shows. R1 stays until its "Round 2" is tapped (lane W4 sets `roundStarted`). */
export type WaiScreen = 'T1' | 'R1' | 'turn' | 'T4' | 'G1' | 'G2';
export function screenOf(s: WaiState, ui: NightUi): WaiScreen {
  switch (s.step) {
    case 'turn':
      return 'turn';
    case 'review':
      return 'T4';
    case 'gameOver':
      return 'G1';
    case 'ended':
    case 'new':
      return 'G2';
    default:
      return s.played.length === 0 && s.round > 1 && ui.roundStarted !== `${s.game}:${s.round}` ? 'R1' : 'T1';
  }
}

/** What every game screen gets from the frame. */
export interface StepProps {
  readonly live: Live;
  readonly state: WaiState;
  readonly view: WaiView;
  readonly ui: NightUi;
  readonly prefs: Preferences;
  /** The Pause button and "··· Menu" for this screen (null on T2 and T3, which have their own Pause and no menu). */
  readonly top: ReactNode;
  /** "Welcome back." and the where-line after a reload or a return from hidden (WAI-090), or null. */
  readonly welcome: ReactNode;
  /** Records a move and saves it; false when the rules refuse it. */
  readonly act: (move: WaiMove) => boolean;
  /** Takes back the app's own last moves (Undo toasts). */
  readonly dropLast: (n?: number) => boolean;
  readonly setUi: (patch: Partial<NightUi>) => void;
  /** Pause on T1, T4 or R1 (`pause { turn: false }`). */
  readonly pause: () => void;
  /** Pause during T2 or T3 (`pause { turn: true }`, with the word on T3 and the turn's time left). */
  readonly pauseTurn: (word: string | undefined, msLeft: number) => void;
  readonly toast: (text: string, undo?: () => void) => void;
  readonly onHome: () => void;
  readonly openPlayers: () => void;
  readonly openEndGame: () => void;
  readonly openEndTonight: () => void;
  readonly openHowToPlay: () => void;
  /** R1 and G1's "Change players or words" (lane W4): the app's setup screens for this night. */
  readonly onChangeSetup: () => void;
  /** G2's "Play something else": the picker with tonight's names. */
  readonly onSomethingElse: (names: string[]) => void;
  /** G2's "Oops, keep playing": takes back `endEvening` (and the `endGame` it added). */
  readonly keepPlaying: () => void;
  /** G2's "Delete tonight's games": removes this night and goes Home. */
  readonly deleteNight: () => void;
}

type Overlay = 'how' | 'players' | 'scores' | 'words' | 'settings' | 'end' | 'tonight' | null;

export function WhatAmIGame({
  id,
  store,
  prefs,
  ui: uiStore,
  settingsPanel,
  welcome: openedWelcome,
  onHome,
  onHistory,
  onSettingsDone,
  onChangeSetup,
  onSomethingElse,
}: {
  id: string;
  store: SavedGameStore;
  prefs: Preferences;
  /** `pgn.whatAmI-ui.*`: screen state that is not a move. */
  ui: Preferences;
  /** The app's own settings (Larger text and the rest), under What Am I?'s switch in the Settings sheet. */
  settingsPanel: ReactNode;
  /** Opened by a reload or from Home's row: "Welcome back." shows. */
  welcome: boolean;
  onHome: () => void;
  onHistory: () => void;
  /** After the Settings sheet's "Done" (Larger text may have changed). */
  onSettingsDone: () => void;
  onChangeSetup: () => void;
  onSomethingElse: (names: string[]) => void;
}) {
  const [live, setLive] = useState<Live | null>(() => openNight(store, id));
  const [ui, setUiState] = useState<NightUi>(() => readUi(uiStore, id));
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [skipAsk, setSkipAsk] = useState(false);
  const [welcome, setWelcome] = useState(openedWelcome);
  const [toast, showToast, clearToast] = useWaiToast();
  const liveRef = useRef(live);
  /** How many records "End for tonight" added (1: `endEvening`; 2: `endGame` too), for "Oops, keep playing". */
  const addedAtEnd = useRef(1);
  liveRef.current = live;

  const act = (move: WaiMove): boolean => {
    const cur = liveRef.current;
    if (!cur) return false;
    const next = record(store, cur, move);
    if (!next) return false;
    liveRef.current = next;
    setLive(next);
    setWelcome(false);
    return true;
  };
  const drop = (n = 1): boolean => {
    const cur = liveRef.current;
    if (!cur) return false;
    const next = dropLast(store, cur, n);
    if (!next) return false;
    liveRef.current = next;
    setLive(next);
    return true;
  };
  const setUi = (patch: Partial<NightUi>) => {
    writeUi(uiStore, id, patch);
    setUiState((cur) => ({ ...cur, ...patch }));
  };

  // WAI-091: a turn left in T2 or T3 (a reload, the app closed) comes back on the Paused cover with its time left.
  useEffect(() => {
    const cur = liveRef.current;
    if (!cur || cur.match.state.step !== 'turn' || cur.match.state.paused) return;
    const word = readUi(uiStore, id).wordShowing ? headOf(cur.match.state) : null;
    if (!act(word ? { type: 'pause', turn: true, word } : { type: 'pause', turn: true })) act({ type: 'pause', turn: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state = live?.match.state ?? null;
  const screen = state ? screenOf(state, ui) : 'G2';
  const between = screen === 'T1' || screen === 'R1' || screen === 'T4';

  const pause = () => {
    setOverlay(null);
    act({ type: 'pause', turn: false });
  };
  const pauseTurn = (word: string | undefined, msLeft: number) => {
    setUi({ msLeft, wordShowing: false });
    act(word ? { type: 'pause', turn: true, word } : { type: 'pause', turn: true });
  };

  // WAI-040, Version 1.2 item 17: the phone's Back on T1, T4 and R1 pauses; on G1 and G2 it goes Home. (T2 and T3 handle
  // their own; a dialog, sheet or the menu closes first.)
  useWaiBack(state !== null && !state.paused && screen !== 'turn', 0, () => {
    if (between) pause();
    else onHome();
  });
  // WAI-040: the app being hidden pauses T1, T4 and R1 (T2 and T3 pause themselves); coming back says "Welcome back.".
  useEffect(() => {
    const onVis = () => {
      const s = liveRef.current?.match.state;
      if (!s) return;
      if (document.visibilityState === 'hidden') {
        const sc = screenOf(s, readUi(uiStore, id));
        if (!s.paused && (sc === 'T1' || sc === 'R1' || sc === 'T4')) {
          setOverlay(null);
          setSkipAsk(false);
          act({ type: 'pause', turn: false });
        }
      } else {
        setWelcome(true);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!live || !state) {
    return (
      <main className="pgn-screen">
        <p className="wai-body">This game night could not be opened.</p>
        <QuietButton onClick={onHome}>← Home</QuietButton>
      </main>
    );
  }
  const view = whatAmIRules.view(state, { kind: 'host' });
  const player = view.player ?? '';
  const where = whereFor(state, ui);

  // ---- The menu (Version 1.1 item 39, Version 1.3 item 3) ----
  const item = (label: string, onSelect: () => void, greyed?: boolean): MenuEntry => ({ label, onSelect, ...(greyed ? { greyed } : {}) });
  const how = item('How to play', () => setOverlay('how'));
  const players = item('Players', () => setOverlay('players'), screen === 'T4');
  const scores = item('Scores', () => setOverlay('scores'));
  const words = item('Words and time', () => setOverlay('words'));
  const pauseItem = item('Pause', pause);
  const home = item('Home (game saved)', onHome);
  const end = item('End the game', () => setOverlay('end'));
  const tonight = item('End for tonight', () => setOverlay('tonight'));
  const settings = item('Settings', () => setOverlay('settings'));
  const history = item('History', onHistory);
  const menu: MenuEntry[] =
    screen === 'T1' || screen === 'R1'
      ? [how, players, scores, words, pauseItem, home, end, tonight, settings, history]
      : screen === 'T4'
        ? [how, players, scores, words, pauseItem, home, end, tonight, settings]
        : screen === 'G1'
          ? [how, tonight, settings, history]
          : [];
  const top =
    screen === 'turn' ? null : (
      <div className="wai-top">
        {between && <PauseButton onPause={pause} />}
        {menu.length > 0 && <GameMenu items={menu} />}
      </div>
    );
  const welcomeNode =
    welcome && where !== null && screen !== 'turn' && screen !== 'G2' ? (
      <div className="wai-welcome">
        <p className="wai-body">Welcome back.</p>
        <WhereLine text={where} />
      </div>
    ) : null;

  const endGame = () => {
    setOverlay(null);
    if (act({ type: 'endGame' })) showToast('Game ended · Undo', () => drop(1));
  };
  const endTonight = () => {
    setOverlay(null);
    const s = liveRef.current?.match.state;
    const open = s && (s.step === 'pass' || s.step === 'turn' || s.step === 'review');
    if (open && !act({ type: 'endGame' })) return;
    addedAtEnd.current = open ? 2 : 1;
    act({ type: 'endEvening' });
  };

  const props: StepProps = {
    live, state, view, ui, prefs, top, welcome: welcomeNode, act, dropLast: drop, setUi, pause, pauseTurn,
    toast: showToast, onHome, openPlayers: () => setOverlay('players'), openEndGame: () => setOverlay('end'),
    openEndTonight: () => setOverlay('tonight'), openHowToPlay: () => setOverlay('how'), onChangeSetup, onSomethingElse,
    keepPlaying: () => void drop(addedAtEnd.current),
    deleteNight: () => {
      store.remove(id);
      uiStore.set(id, null);
      onHome();
    },
  };

  // ---- The Paused cover (D1) and D7 ----
  if (state.paused) {
    return (
      <PausedCover
        where={where}
        player={player}
        turn={state.pausedTurn}
        onCarryOn={() => act({ type: 'resume' })}
        onEndTurn={() => setSkipAsk(true)}
        onHome={onHome}
        skip={
          skipAsk && state.pausedTurn ? (
            <SkipDialog
              player={player}
              onEnd={() => {
                setSkipAsk(false);
                act({ type: 'skip' });
              }}
              onCarryOn={() => setSkipAsk(false)}
            />
          ) : null
        }
      />
    );
  }
  if (overlay === 'how') return <HowToPlay onDone={() => setOverlay(null)} />;

  let body: ReactNode;
  switch (screen) {
    case 'T1':
      body = <PassScreen {...props} />;
      break;
    case 'turn':
      body = <TurnScreen {...props} />;
      break;
    case 'T4':
      body = <TurnEndScreen {...props} />;
      break;
    case 'R1':
      body = <RoundOverScreen {...props} />;
      break;
    case 'G1':
      body = <GameOverScreen {...props} />;
      break;
    default:
      body = <SummaryScreen {...props} />;
  }
  const sheet = overlay === 'players' || overlay === 'scores' || overlay === 'words' || overlay === 'settings';
  return (
    <>
      <HideMainButton.Provider value={sheet}>{body}</HideMainButton.Provider>
      <FrameToast toast={toast} onDone={clearToast} />
      {overlay === 'players' && (
        <PlayersSheet
          state={state}
          onAdd={(name) => act({ type: 'addPlayer', name })}
          onReorder={(order) => act({ type: 'reorder', order })}
          onLeave={(name) => act({ type: 'leave', player: name })}
          onUndoLeave={(name, order) => {
            const cur = liveRef.current;
            const last = cur?.match.records[cur.match.records.length - 1]?.move;
            if (last?.type === 'leave' && last.player === name) drop(1);
            else if (act({ type: 'addPlayer', name })) act({ type: 'reorder', order: [...order] });
          }}
          onEndGame={() => setOverlay('end')}
          onDone={() => setOverlay(null)}
        />
      )}
      {overlay === 'scores' && <ScoresSheet view={view} onDone={() => setOverlay(null)} />}
      {overlay === 'words' && state.choices && (
        <WordsSheet
          choices={state.choices}
          onDone={(c) => {
            if (state.choices && !sameChoices(c, state.choices)) act({ type: 'setChoices', choices: c });
            setOverlay(null);
          }}
          onCancel={() => setOverlay(null)}
        />
      )}
      {overlay === 'settings' && (
        <SettingsSheet
          prefs={prefs}
          panel={settingsPanel}
          onDone={() => {
            setOverlay(null);
            onSettingsDone();
          }}
        />
      )}
      {overlay === 'end' && <EndGameDialog state={state} onEnd={endGame} onKeep={() => setOverlay(null)} />}
      {overlay === 'tonight' && <EndTonightDialog onEnd={endTonight} onKeep={() => setOverlay(null)} />}
    </>
  );
}

function FrameToast({ toast, onDone }: { toast: ToastState | null; onDone: () => void }) {
  return (
    <div className="wai-toast-host">
      <Toast toast={toast} onDone={onDone} />
    </div>
  );
}

// ---------------------------------------------------------------- D1 Paused, D7

/** D1 (WAI-040): covers the whole screen; on T2/T3 the word is gone from the page and the body says the clock stopped. */
export function PausedCover({
  where,
  player,
  turn,
  onCarryOn,
  onEndTurn,
  onHome,
  skip,
}: {
  where: string | null;
  player: string;
  /** Paused from T2 or T3. */
  turn: boolean;
  onCarryOn: () => void;
  onEndTurn: () => void;
  onHome: () => void;
  skip: ReactNode;
}) {
  return (
    <>
      <WaiDialog title="Paused" cover>
        {where !== null && <WhereLine text={where} />}
        <p className="wai-body">
          {turn
            ? "The clock is stopped and the word is hidden. Tap Carry on playing when you're ready."
            : "Tap Carry on playing when you're ready."}
        </p>
        <div className="wai-dialog-buttons">
          {turn && <QuietButton onClick={onEndTurn}>{`End ${player}'s turn now`}</QuietButton>}
          <QuietButton onClick={onHome}>← Home (game saved)</QuietButton>
          <Main inline onClick={onCarryOn}>
            Carry on playing
          </Main>
        </div>
      </WaiDialog>
      {skip}
    </>
  );
}

/** D7 (WAI-043, Version 1.2 item 2). */
function SkipDialog({ player, onEnd, onCarryOn }: { player: string; onEnd: () => void; onCarryOn: () => void }) {
  return (
    <WaiDialog title={`End ${player}'s turn now?`} onDismiss={onCarryOn} level={3}>
      <p className="wai-body">{`${player}'s turn ends now. Words marked so far still count.`}</p>
      <div className="wai-dialog-buttons">
        <QuietButton onClick={onEnd}>{`End ${player}'s turn now`}</QuietButton>
        <Main inline onClick={onCarryOn}>
          Carry on playing
        </Main>
      </div>
    </WaiDialog>
  );
}

// ---------------------------------------------------------------- D5, D6

/** Version 1.2 item 5 (product owner 25 October, item 27): the body when the game is ended mid-round. */
export function endGameBody(s: WaiState): string {
  const still = toPlayOf(s);
  const midRound = s.played.length > 0 && still.length > 0;
  if (!midRound) return "Shows this game's winner. You can play again with the same people.";
  const who = still.length > 3 ? `${still.length} players haven't played.` : `${joinNames(still)} ${still.length === 1 ? "hasn't" : "haven't"} played.`;
  return `Round ${s.round} isn't done: ${who} Shows this game's winner.`;
}

function EndGameDialog({ state, onEnd, onKeep }: { state: WaiState; onEnd: () => void; onKeep: () => void }) {
  return (
    <WaiDialog title="End the game?" onDismiss={onKeep}>
      <p className="wai-body">{endGameBody(state)}</p>
      <div className="wai-dialog-buttons">
        <QuietButton onClick={onEnd}>End the game</QuietButton>
        <Main inline onClick={onKeep}>
          Keep playing
        </Main>
      </div>
    </WaiDialog>
  );
}

function EndTonightDialog({ onEnd, onKeep }: { onEnd: () => void; onKeep: () => void }) {
  return (
    <WaiDialog title="End for tonight?" onDismiss={onKeep}>
      <p className="wai-body">Shows tonight's summary. Every score is kept in History.</p>
      <div className="wai-dialog-buttons">
        <QuietButton onClick={onEnd}>End for tonight</QuietButton>
        <Main inline onClick={onKeep}>
          Keep playing
        </Main>
      </div>
    </WaiDialog>
  );
}

// ---------------------------------------------------------------- Sheets: Scores (D8), Words and time (D4), Settings

function ScoresSheet({ view, onDone }: { view: WaiView; onDone: () => void }) {
  useWaiBack(true, 1, onDone);
  return (
    <WaiSheet title="Scores" onDone={onDone}>
      <Scoreboard rows={view.scoreboard} />
    </WaiSheet>
  );
}

/** WAI-044: S2's choices; "Done" keeps them (from the next turn); Back closes without saving. */
function WordsSheet({ choices, onDone, onCancel }: { choices: Choices; onDone: (c: Choices) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Choices>(choices);
  useWaiBack(true, 1, onCancel);
  return (
    <WaiSheet title="Words and time" onDone={() => onDone(draft)}>
      <ChoicesForm choices={draft} onChange={setDraft} />
    </WaiSheet>
  );
}

/** Version 1.2 item 16: the app's Settings, with What Am I?'s "Answer by moving the phone" first. */
function SettingsSheet({ prefs, panel, onDone }: { prefs: Preferences; panel: ReactNode; onDone: () => void }) {
  useWaiBack(true, 1, onDone);
  return (
    <WaiSheet title="Settings" onDone={onDone}>
      <WaiSettings prefs={prefs} />
      {panel}
    </WaiSheet>
  );
}
