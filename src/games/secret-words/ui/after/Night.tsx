// Screen lane D: a game night on the host from its first deal: lane B's turn screens (SecretWordsPlay) until game over,
// then G1 game over and G2 the summary, with D6 "End the game", D7 Players, D8 "End for tonight" and D9 "Delete tonight's
// games" (SWD-050–055, 060, 062, 063, 112, 127, 128). Scenarios: specs/secret-words/05-results.md, 06-evening.md.
//
// What is recorded when (Test hooks, tap → move): "End the game" records `endGame` only when its 10 s Undo toast
// expires, at a tap that leaves game over, a reload or the app being hidden (SWD-054); "End for tonight" records
// nothing until the summary is left (SWD-060). The screen state for a reload is `pgn.secretWords-ui.<id>` (SWD-048):
// step 'game-over' while the Undo toast runs, 'summary' while the summary is not left.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { HOST, play, type Preferences, type SavedGameStore } from '../../../../engine';
import { secretWordsRules, type SecretWordsMove, type SecretWordsState } from '../../rules';
import { usePageVisibility } from '../shared/device';
import { SwMain, useGuard } from '../shared/guard';
import { SwDialog, type MenuItem } from '../shared/parts';
import { ClueGiversSheet } from '../Setup';
import { SecretWordsPlay, type SecretWordsPlayProps } from '../turn/Turn';
import { loadNight, readUi, recordMoves, writeUi, type Night, type NightMatch, type SwUiState } from '../turn/store';
import { nextGiversLine, playedGames, stillFits, suggestedGivers, withEndGame, type NextGivers } from './facts';
import { GameOver } from './GameOver';
import { PlayersSheet, type PlayersToast } from './PlayersSheet';
import { Summary } from './Summary';
import './after.css';
import type { PlayersChange } from './players';

const ENDED_TOAST_MS = 10_000;
const TOAST_MS = 5_000;
const LAST_CHOICES = 'secretWords.lastChoices';

type Phase = 'play' | 'over' | 'summary';
type Loaded = { saved: Night; match: NightMatch };

export interface SecretWordsNightProps extends Omit<SecretWordsPlayProps, 'gameOver' | 'onMenu'> {
  /** "Change teams, players, phones or board" (SWD-112): Who's playing? with tonight's names; the next clue givers. */
  readonly onChangeSetup: (next: NextGivers) => void;
  /** "Play something else" (SWD-060): the picker, tonight's names kept. */
  readonly onSomethingElse: (names: string[]) => void;
}

const sameGivers = (a: NextGivers, s: SecretWordsState) =>
  a.clueGivers.orange === s.teams.clueGivers.orange &&
  a.clueGivers.teal === s.teams.clueGivers.teal &&
  a.partners.orange === s.teams.partners.orange &&
  a.partners.teal === s.teams.partners.teal;
const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** A step the moves alone can tell from now on (the ui step is dropped). */
const clearStep = (ui: Preferences, id: string, extra: Partial<SwUiState> = {}) => {
  const cur = readUi(ui, id);
  const { step: _old, ...rest } = cur;
  void _old;
  ui.set(id, { ...rest, ...extra });
};

/**
 * The next game (SWD-053, 112): `before` (changes) and the deal that follows them, recorded together; the choices kept
 * for next time (SWD-066); the turn screens open on the pass or scan screen (SWD-048).
 */
export function dealNext(store: SavedGameStore, prefs: Preferences, ui: Preferences, id: string, before: SecretWordsMove[]): Loaded | null {
  const saved = store.get(id) as Night | undefined;
  const match = loadNight(saved);
  if (!saved || !match) return null;
  let m = match;
  const at = Math.max(Date.now(), m.records[m.records.length - 1]?.at ?? 0);
  for (const move of before) {
    const r = play(secretWordsRules, m, move, { by: HOST, at });
    if (!r.ok) return null;
    m = r.value;
  }
  const deal = secretWordsRules.legalMoves(m.state, HOST).find((x) => x.type === 'deal');
  if (!deal) return null;
  const r = recordMoves(store, saved, match, [...before, deal]);
  if (!r) return null;
  const c = r.match.state.choices;
  prefs.set(LAST_CHOICES, { map: c.map, board: c.board, landmine: c.landmine, words: c.words });
  writeUi(ui, id, { step: c.map === 'pass' ? 'pass' : 'scan', showing: true, paused: false, pickerOverride: null });
  return r;
}

/** The moves that make the next game's clue givers (SWD-112: switch changes `setTeams`, the rest `setClueGivers`). */
export function giverMoves(s: SecretWordsState, n: NextGivers): SecretWordsMove[] {
  if (!sameList(n.guessOnly, s.teams.guessOnly)) {
    return [{ type: 'setTeams', teams: { ...s.teams, clueGivers: n.clueGivers, partners: n.partners, guessOnly: [...n.guessOnly] }, splits: s.splits }];
  }
  if (!sameGivers(n, s)) return [{ type: 'setClueGivers', clueGivers: { ...n.clueGivers }, partners: { ...n.partners } }];
  return [];
}

/** Opening (SWD-048): what the moves and the saved step say, recording what a reload records. */
function opening(store: SavedGameStore, ui: Preferences, id: string): { night: Loaded | null; phase: Phase; recorded: boolean } {
  const saved = store.get(id) as Night | undefined;
  const match = loadNight(saved);
  if (!saved || !match) return { night: null, phase: 'play', recorded: false };
  writeUi(ui, id, { showing: true });
  const step = readUi(ui, id).step;
  const s = match.state;
  if (s.ended) return { night: { saved, match }, phase: 'summary', recorded: true };
  const mid = !!s.game && s.game.step !== 'over';
  if (step === 'summary') {
    const r = recordMoves(store, saved, match, mid ? [{ type: 'endGame' }, { type: 'endEvening' }] : [{ type: 'endEvening' }]);
    return { night: r ?? { saved, match }, phase: 'summary', recorded: true };
  }
  if (step === 'game-over' && mid) {
    const r = recordMoves(store, saved, match, [{ type: 'endGame' }]);
    clearStep(ui, id);
    return { night: r ?? { saved, match }, phase: 'over', recorded: false };
  }
  if (!mid && s.game) return { night: { saved, match }, phase: 'over', recorded: false };
  return { night: { saved, match }, phase: 'play', recorded: false };
}

export function SecretWordsNight(props: SecretWordsNightProps) {
  const { id, store, prefs, ui, onHome, onSettings, onHistory, howToPlay, onChangeSetup, onSomethingElse } = props;
  const [init] = useState(() => opening(store, ui, id));
  const [night, setNightState] = useState<Loaded | null>(init.night);
  const nightRef = useRef(night);
  const setNight = (n: Loaded) => {
    nightRef.current = n;
    setNightState(n);
  };
  const [phase, setPhase] = useState<Phase>(init.phase);
  const [playKey, setPlayKey] = useState(0);
  const [pendingEnd, setPendingEnd] = useState<{ prevStep: string | undefined; at: number } | null>(null);
  const pendingRef = useRef(pendingEnd);
  pendingRef.current = pendingEnd;
  const [summary, setSummary] = useState<{ from: 'play' | 'over'; prevStep: string | undefined; recorded: boolean }>(() => ({
    from: 'over',
    prevStep: undefined,
    recorded: init.recorded,
  }));
  const [next, setNext] = useState<NextGivers | null>(null);
  const [sheet, setSheet] = useState<null | 'players' | 'swap' | 'howto'>(null);
  const [dialog, setDialog] = useState<null | 'end-game' | 'end-tonight'>(null);
  const [toast, setToast] = useState<(PlayersToast & { at: number }) | null>(null);

  /** The night as saved now (the turn screens may have recorded moves since). */
  const reload = (): Loaded | null => {
    const saved = store.get(id) as Night | undefined;
    const match = loadNight(saved);
    if (!saved || !match) return null;
    const n = { saved, match };
    setNight(n);
    return n;
  };
  const record = (moves: SecretWordsMove[], when?: number): Loaded | null => {
    const cur = reload();
    if (!cur) return null;
    const r = recordMoves(store, cur.saved, cur.match, moves, when);
    if (r) setNight(r);
    return r;
  };

  /** SWD-054: the pending `endGame` is recorded (toast expired, a tap that leaves, reload, hidden). */
  const recordEnd = () => {
    if (!pendingRef.current) return;
    pendingRef.current = null;
    setPendingEnd(null);
    const cur = reload();
    if (cur && cur.match.state.game && cur.match.state.game.step !== 'over') record([{ type: 'endGame' }]);
    clearStep(ui, id);
  };
  /** SWD-060: leaving the summary records `endGame` (if mid-game) and `endEvening`, once. */
  const recordEvening = () => {
    if (summary.recorded) return;
    setSummary((s) => ({ ...s, recorded: true }));
    const cur = reload();
    if (!cur || cur.match.state.ended) return;
    const g = cur.match.state.game;
    record(g && g.step !== 'over' ? [{ type: 'endGame' }, { type: 'endEvening' }] : [{ type: 'endEvening' }]);
  };

  // The "Game ended · Undo" toast: 10 s from the dialog's "End the game".
  useEffect(() => {
    if (!pendingEnd) return;
    const t = setTimeout(recordEnd, Math.max(0, pendingEnd.at + ENDED_TOAST_MS - Date.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEnd]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), Math.max(0, toast.at + TOAST_MS - Date.now()));
    return () => clearTimeout(t);
  }, [toast]);

  usePageVisibility(
    () => {
      if (pendingRef.current) recordEnd();
      if (phase === 'summary' && !summary.recorded) recordEvening();
    },
    () => {},
  );

  if (!night) return null;
  const match = night.match;
  const larger = prefs.get<boolean>('largerText', false) === true;

  // ---- What the screens show ----
  const overState = (pendingEnd ? withEndGame(match) : match).state;
  const suggested = suggestedGivers(overState);
  const nextGivers = next && stillFits(next, overState) ? next : suggested;

  const backToPlay = (prevStep: string | undefined) => {
    if (prevStep === undefined) clearStep(ui, id, { showing: true });
    else writeUi(ui, id, { step: prevStep, showing: true });
    reload();
    setPhase('play');
    setPlayKey((k) => k + 1);
  };

  const onPlayersChange = (c: PlayersChange): boolean => {
    const r = record([{ type: 'setPlayers', players: [...c.players], teams: c.teams, ...(c.renames ? { renames: { ...c.renames } } : {}) }]);
    if (r && phase === 'play') setPlayKey((k) => k + 1);
    return !!r;
  };

  const playAgain = () => {
    const cur = reload();
    if (!cur) return;
    const pending = !!pendingRef.current;
    const base = pending ? withEndGame(cur.match) : cur.match;
    const before: SecretWordsMove[] = [...(pending ? [{ type: 'endGame' } as const] : []), ...giverMoves(base.state, nextGivers)];
    const r = dealNext(store, prefs, ui, id, before);
    if (!r) return;
    pendingRef.current = null;
    setPendingEnd(null);
    setNight(r);
    setNext(null);
    setPhase('play');
    setPlayKey((k) => k + 1);
  };

  const leaveOver = (go: () => void) => () => {
    recordEnd();
    go();
  };

  const overMenu: MenuItem[][] = [
    [{ label: 'Players', onSelect: () => setSheet('players') }],
    [
      { label: 'How to play', onSelect: leaveOver(() => setSheet('howto')) },
      { label: 'Settings', onSelect: leaveOver(onSettings) },
      { label: 'History', onSelect: leaveOver(onHistory) },
    ],
  ];

  const endedToast = pendingEnd && (
    <div className="sw-toast sw-undo-toast" data-testid="undo-toast" role="status">
      <span>Game ended · </span>
      <button
        type="button"
        className="sw-toast-undo"
        onClick={() => {
          const p = pendingRef.current;
          pendingRef.current = null;
          setPendingEnd(null);
          backToPlay(p?.prevStep);
        }}
      >
        Undo
      </button>
    </div>
  );

  let body: ReactNode = null;
  if (phase === 'play') {
    body = (
      <SecretWordsPlay
        key={playKey}
        id={id}
        store={store}
        prefs={prefs}
        ui={ui}
        {...(props.start && playKey === 0 ? { start: props.start } : {})}
        onHome={onHome}
        onSettings={onSettings}
        onHistory={onHistory}
        {...(howToPlay ? { howToPlay } : {})}
        gameOver={() => (
          <OverSignal
            onOver={() => {
              reload();
              setPhase('over');
            }}
          />
        )}
        onMenu={(item) => {
          reload();
          if (item === 'players') setSheet('players');
          else setDialog(item);
        }}
      />
    );
  } else if (phase === 'over') {
    body = (
      <GameOver
        state={overState}
        nextLine={nextGiversLine(nextGivers)}
        larger={larger}
        menu={overMenu}
        toast={endedToast}
        onSwap={() => setSheet('swap')}
        onChange={() => {
          recordEnd();
          onChangeSetup(nextGivers);
        }}
        onHome={() => {
          recordEnd();
          writeUi(ui, id, { showing: false });
          onHome();
        }}
        onEndTonight={() => {
          recordEnd();
          setDialog('end-tonight');
        }}
        onPlayAgain={playAgain}
      />
    );
  } else {
    const shown = summary.recorded ? match : withEndGame(match);
    body = (
      <Summary
        state={shown.state}
        played={playedGames(shown.setup, shown.records)}
        canOops={!summary.recorded}
        onOops={() => {
          if (summary.from === 'over') {
            clearStep(ui, id, { showing: true });
            setPhase('over');
          } else backToPlay(summary.prevStep);
        }}
        onHome={() => {
          recordEvening();
          writeUi(ui, id, { showing: false });
          onHome();
        }}
        onSomethingElse={() => {
          recordEvening();
          writeUi(ui, id, { showing: false });
          onSomethingElse([...(reload()?.match.state.players ?? match.state.players)]);
        }}
        onDelete={() => {
          store.remove(id);
          ui.set(id, null);
          onHome();
        }}
      />
    );
  }

  const g = match.state.game;
  const midGame = !!g && g.step !== 'over';
  let overlay: ReactNode = null;
  if (sheet === 'players') {
    overlay = (
      <PlayersSheet
        state={match.state}
        atGameOver={phase === 'over'}
        onChange={onPlayersChange}
        onToast={(t) => setToast({ ...t, at: Date.now() })}
        onEndGame={() => {
          setSheet(null);
          setDialog('end-game');
        }}
        onDone={() => setSheet(null)}
      />
    );
  } else if (sheet === 'swap') {
    const t = overState.teams;
    overlay = (
      <ClueGiversSheet
        draft={{ orange: t.orange, teal: t.teal, clueGivers: nextGivers.clueGivers, partners: nextGivers.partners, guessOnly: nextGivers.guessOnly }}
        names={t.names}
        onDone={(d) => {
          setNext({ clueGivers: { ...d.clueGivers }, partners: { ...d.partners }, guessOnly: [...d.guessOnly] });
          setSheet(null);
        }}
      />
    );
  } else if (sheet === 'howto' && howToPlay) {
    overlay = <div className="sw-sheet sw-howto">{howToPlay({ onDone: () => setSheet(null) })}</div>;
  }
  if (dialog === 'end-game') {
    overlay = (
      <>
        {overlay}
        <EndGameDialog
          onEnd={() => {
            setDialog(null);
            const prevStep = readUi(ui, id).step;
            const p = { prevStep, at: Date.now() };
            pendingRef.current = p;
            setPendingEnd(p);
            writeUi(ui, id, { step: 'game-over', showing: true });
            reload();
            setPhase('over');
          }}
          onKeep={() => setDialog(null)}
        />
      </>
    );
  } else if (dialog === 'end-tonight') {
    overlay = (
      <>
        {overlay}
        <EndTonightDialog
          midGame={midGame && phase === 'play'}
          onEnd={() => {
            setDialog(null);
            const prevStep = readUi(ui, id).step;
            setSummary({ from: phase === 'play' ? 'play' : 'over', prevStep, recorded: false });
            writeUi(ui, id, { step: 'summary', showing: true });
            reload();
            setPhase('summary');
          }}
          onKeep={() => setDialog(null)}
        />
      </>
    );
  }

  return (
    <div className={`sw pgn${larger ? ' pgn-larger' : ''}`}>
      {sheet === 'howto' && phase === 'over' ? null : body}
      {overlay}
      {toast && (
        <div className="sw-toast" data-testid={toast.undo ? 'undo-toast' : 'toast'} role="status">
          {toast.undo ? (
            <>
              <span>{toast.text.replace(/Undo$/, '')}</span>
              <button
                type="button"
                className="sw-toast-undo"
                onClick={() => {
                  const undo = toast.undo;
                  setToast(null);
                  undo?.();
                }}
              >
                Undo
              </button>
            </>
          ) : (
            toast.text
          )}
        </div>
      )}
    </div>
  );
}

/** Lane B's turn screens reached game over: the night shows lane D's game over instead. */
function OverSignal({ onOver }: { onOver: () => void }) {
  const ref = useRef(onOver);
  ref.current = onOver;
  useLayoutEffect(() => {
    ref.current();
  }, []);
  return null;
}

/** D6 (SWD-054). */
function EndGameDialog({ onEnd, onKeep }: { onEnd: () => void; onKeep: () => void }) {
  const until = useGuard('end-game');
  return (
    <SwDialog title="End this game with no winner?" onDismiss={onKeep}>
      <div className="sw-dialog-buttons">
        <button type="button" className="sw-quiet sw-full" onClick={onEnd}>
          End the game
        </button>
        <SwMain className="sw-main-inline" until={until} onClick={onKeep}>
          Keep playing
        </SwMain>
      </div>
    </SwDialog>
  );
}

/** D8 (SWD-060). */
function EndTonightDialog({ midGame, onEnd, onKeep }: { midGame: boolean; onEnd: () => void; onKeep: () => void }) {
  const until = useGuard('end-tonight');
  return (
    <SwDialog
      title={midGame ? "End for tonight? This game won't count in the tally." : "End for tonight? Tonight's tally stays in History."}
      onDismiss={onKeep}
    >
      <div className="sw-dialog-buttons">
        <button type="button" className="sw-quiet sw-full" onClick={onEnd}>
          End for tonight
        </button>
        <SwMain className="sw-main-inline" until={until} onClick={onKeep}>
          Keep playing
        </SwMain>
      </div>
    </SwDialog>
  );
}
