// The room frame of a Mafia game night (specs/mafia/06-room.md, 10-lifecycle.md): the Pause icon and "··· Menu" on
// room screens (MAF-050, MAF-053), the Paused cover and "Welcome back." with the where-line (MAF-090, MAF-091), the Players
// sheet and the three leave bodies (MAF-051, MAF-052, items 11–14), End the game (MAF-054), End for tonight (MAF-063),
// Deal again (MAF-014) and Home (MAF-055). The screens themselves come from SCREENS (StandIns.tsx).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { HOST, type Preferences, type SavedGameStore } from '../../../engine';
import { HideMainButton, QuietButton, Screen, ScreenContent, Toast } from '../../../blocks';
import { mafiaRules, readMafiaNight, type MafiaMove, type MafiaPlayerView, type MafiaView } from '../rules';
import type { RoomCtx } from './ctx';
import { MafDialog, Main, PausedCover, PlayersSheet, Question, TopBar, WelcomeBack, useUndoToast, type MenuItem, type PlayerRow } from './parts';
import { HowToPlay, MAX_PLAYERS } from './Setup';
import { NobodyDialog } from './Day';
import { D } from './dayText';
import { playSound } from './sound';
import { RoleAgain, SCREENS } from './StandIns';
import { T } from './text';
import {
  PRIVATE, ROOM_FRAME, lastAt, loadNight, playMoves, resumeScreen, roomView, saveNight, saveScreen, whereLine,
  type MafiaMatch, type ScreenId,
} from './tonight';

const SIX_HOURS = 6 * 3_600_000;
/** Screens that scroll as one page (MAF-080: G1, G2 and Day may scroll). */
const PAGE_SCREENS: readonly ScreenId[] = ['y1', 'g2'];
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

type Dialog =
  | { kind: 'leave'; player: string; body: string }
  | { kind: 'tooFew' }
  | { kind: 'end' }
  | { kind: 'tonight' }
  | { kind: 'dealAgain' }
  | { kind: 'nobody' }
  | { kind: 'delete' }
  | { kind: 'whose' };

export function MafiaRoom({
  id,
  store,
  prefs,
  welcome: welcomeAtStart,
  settingsPanel,
  onLargerChanged,
  onHome,
  onHistory,
  onSomethingElse,
  onChangePlayers,
}: {
  id: string;
  store: SavedGameStore;
  prefs: Preferences;
  /** Opened by a resume or a reload (MAF-091): "Welcome back." and the where-line. */
  welcome: boolean;
  settingsPanel: ReactNode;
  /** Settings may have changed Larger text. */
  onLargerChanged: () => void;
  onHome: () => void;
  onHistory: () => void;
  /** "Play something else": the picker with tonight's names. */
  onSomethingElse: (names: string[]) => void;
  /** G1's "Change players or roles" (MAF-061): Who's playing? with these names and "← Back to the game". */
  onChangePlayers: (names: string[]) => void;
}) {
  const [opened] = useState(() => loadNight(store, id));
  const base = useRef({ id, createdAt: opened?.saved.createdAt ?? Date.now() });
  const [match, setMatch] = useState<MafiaMatch | null>(opened?.match ?? null);
  const cur = useRef(match);
  cur.current = match;
  const [screen, setScreenState] = useState<ScreenId>(() => (opened ? resumeScreen(opened.match, prefs, id) : 'g1'));
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const [welcome, setWelcome] = useState(welcomeAtStart);
  // MAF-092 (item 21): back after more than 6 hours with the deal seen: the line shows on the next M1 or Y1.
  const [breakLine, setBreakLine] = useState(
    () => welcomeAtStart && !!opened && Date.now() - lastAt(opened.match) > SIX_HOURS && opened.match.records.some((r) => r.move.type === 'seen'),
  );
  const [paused, setPaused] = useState(false);
  const [players, setPlayers] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [how, setHow] = useState(false);
  const [settings, setSettings] = useState(false);
  const [again, setAgain] = useState<string | null>(null);
  /** Item 11: leaves asked for on N3, recorded when "Read the morning" is tapped. */
  const [n3Leaving, setN3Leaving] = useState<string[]>([]);
  const [g2From, setG2From] = useState<ScreenId>('g1');
  const [toast, showToast, clearToast] = useUndoToast();

  const go = useCallback(
    (s: ScreenId) => {
      const was = screenRef.current;
      if ((was === 'm1' || was === 'y1') && s !== was) setBreakLine(false);
      screenRef.current = s;
      setScreenState(s);
      saveScreen(prefs, id, s);
      setWelcome(false);
      // PO 14: opening B2 or N2 closes any toast (no undo after it).
      if (PRIVATE.includes(s)) clearToast();
    },
    [prefs, id, clearToast],
  );

  /** Records moves (saved at once); any recorded move closes an undo toast (item 13) unless it is that Undo. */
  const record = useCallback(
    (moves: readonly MafiaMove[], keepToast = false): MafiaMatch | null => {
      const m = cur.current;
      if (!m) return null;
      const next = playMoves(m, moves, Date.now());
      if (!next) return null;
      saveNight(store, base.current, next, Date.now());
      cur.current = next;
      setMatch(next);
      setWelcome(false);
      if (!keepToast) clearToast();
      return next;
    },
    [store, clearToast],
  );

  /** Item 27: leaving Tonight's summary records `endGame` (mid-game) and `endEvening`, once. */
  const endTonight = useCallback(() => {
    const m = cur.current;
    if (!m) return;
    const step = roomView(m).step;
    if (step !== 'ended') record(step === 'gameOver' ? [{ type: 'endEvening' }] : [{ type: 'endGame' }, { type: 'endEvening' }]);
  }, [record]);
  // Item 27: a game night reopened on Tonight's summary was left there (a reload): its endings are recorded now.
  const endOnOpen = useRef(endTonight);
  useEffect(() => {
    if (screenRef.current === 'g2') endOnOpen.current();
  }, []);

  // MAF-091: hiding the app on a private screen hides it: back to that player's pass screen, "Welcome back." on return.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const s = screenRef.current;
        if (s === 'b2') go('b1');
        else if (s === 'n2') go('n1');
        else if (s === 'g2') endTonight(); // item 27: G2 stays, now without "Oops, keep playing"
        setAgain(null);
      } else if (cur.current && ROOM_FRAME.includes(screenRef.current)) {
        setWelcome(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [go, endTonight]);

  if (!match) return null;
  const view: MafiaView = roomView(match);
  const legal = mafiaRules.legalMoves(match.state, HOST);
  const where = whereLine(screen, view);

  // ---- Leaving (MAF-052) ----
  const leaveBody = (p: string): string => {
    // MAF-052 (item 2): by day (M1, Y1, V2, V2t, V3, V3s, V4) a leave applies at once; V3s and V4 send it without `when`.
    if (view.step === 'deal') return T.leave.deal(p);
    if (screen === 'n3' || view.step === 'night' || screen === 'n0') return T.leave.night(p);
    return T.leave.day(p);
  };
  const leave = (p: string) => {
    const before = screenRef.current;
    setDialog(null);
    if (before === 'n3') {
      // Item 11: a leave on N3 applies when "Read the morning" is tapped.
      setN3Leaving((l) => [...l, p]);
      showToast(T.leave.toast(p), () => setN3Leaving((l) => l.filter((x) => x !== p)));
      return;
    }
    if (view.step === 'deal') {
      // Item 12: a leave during the deal deals again without them (N stays at least 5).
      if (view.players.length - 1 < 5 || !record([{ type: 'leave', player: p }, { type: 'redeal' }])) {
        setDialog({ kind: 'tooFew' });
        return;
      }
      go('b1');
      showToast(T.leave.toast(p), () => {
        if (record([{ type: 'unleave', player: p }], true)) go('b1');
      });
      return;
    }
    const night = view.step === 'night' || before === 'n0';
    const move: MafiaMove = before === 'n0' ? { type: 'leave', player: p, when: 'night' } : { type: 'leave', player: p };
    const next = record([move]);
    if (!next) return;
    const after = roomView(next);
    if (night && view.step === 'night' && after.step !== 'night') go('n3');   // the leaver's was the last turn: the night resolved
    else if (!night && after.step === 'gameOver') {
      // Item 13: a day leave that ends the game opens G1 at once; Undo returns to the screen before.
      setPlayers(false);
      go('g1');
    }
    const undoable = mafiaRules.legalMoves(next.state, HOST).some((m) => m.type === 'unleave' && m.player === p);
    if (undoable) {
      showToast(T.leave.toast(p), () => {
        if (record([{ type: 'unleave', player: p }], true)) go(before);
      });
    }
  };

  const rows: PlayerRow[] = view.players.map((p) => {
    const out = view.out.find((o) => o.player === p);
    if (out) {
      const when = out.how === 'night' ? `out night ${out.round}` : `voted out day ${out.round}`;
      return { name: p, text: `${p} · ${T.role[out.role]} · ${when}`, canLeave: false, greyed: true };
    }
    if (view.left.includes(p) || view.leaving.includes(p) || n3Leaving.includes(p)) return { name: p, text: T.leave.left(p), canLeave: false, greyed: true };
    return { name: p, canLeave: view.step !== 'gameOver' && view.step !== 'ended' };
  });
  for (const n of view.next) rows.push({ name: n, text: T.leave.joins(n), canLeave: false });
  const addNext = (name: string): string | null => {
    const taken = [...view.players.filter((p) => !view.left.includes(p)), ...view.next].find((p) => same(p, name));
    if (taken) return T.s1.twice(taken);
    if (view.players.length - view.left.length + view.next.length >= MAX_PLAYERS) return T.s1.tooMany;
    return record([{ type: 'addNext', name }]) ? null : T.s1.twice(name);
  };

  // ---- The menu (MAF-053) ----
  const canRedeal = legal.some((m) => m.type === 'redeal');
  const items: MenuItem[] = [
    { label: T.menu.how, onSelect: () => setHow(true) },
    { label: T.menu.players, onSelect: () => setPlayers(true) },
    ...(screen === 'm1' || screen === 'y1' ? [{ label: T.menu.seeRole, onSelect: () => setDialog({ kind: 'whose' }) }] : []),
    ...((screen === 'b1' || screen === 'n0') && canRedeal ? [{ label: T.menu.dealAgain, onSelect: () => setDialog({ kind: 'dealAgain' }) }] : []),
    { label: T.menu.pause, onSelect: () => setPaused(true) },
    { label: T.menu.home, onSelect: onHome },
    ...(screen !== 'g1' ? [{ label: T.menu.endGame, onSelect: () => setDialog({ kind: 'end' }) }] : []),
    { label: T.menu.endTonight, onSelect: () => setDialog({ kind: 'tonight' }) },
    ...(screen === 'g1' ? [{ label: T.menu.settings, onSelect: () => setSettings(true) }, { label: T.menu.history, onSelect: onHistory }] : []),
  ];

  const changePlayers = () => {
    const v = roomView(cur.current ?? match);
    onChangePlayers([...v.players.filter((p) => !v.left.includes(p)), ...v.next]);
  };

  const finishTonight = (then: 'home' | 'else') => {
    const v = roomView(cur.current ?? match);
    endTonight();
    saveScreen(prefs, id, 'g1'); // a later reload no longer reopens this summary
    const names = v.players.filter((p) => !v.left.includes(p));
    if (then === 'home') onHome();
    else onSomethingElse([...names, ...v.next]);
  };

  const ctx: RoomCtx = {
    view,
    own: (player) => mafiaRules.view(match.state, { kind: 'player', playerId: player }) as MafiaPlayerView,
    screen,
    go,
    play: (...moves) => record(moves) !== null,
    peek: (move) => {
      const next = playMoves(match, [move], Date.now());
      return next ? roomView(next) : null;
    },
    peekOwn: (move, player) => {
      const next = playMoves(match, [move], Date.now());
      return next ? (mafiaRules.view(next.state, { kind: 'player', playerId: player }) as MafiaPlayerView) : null;
    },
    night: () => readMafiaNight(store.get(id)),
    breakLine,
    askEndGame: () => setDialog({ kind: 'end' }),
    askEndTonight: () => setDialog({ kind: 'tonight' }),
    askDealAgain: () => setDialog({ kind: 'dealAgain' }),
    askNobody: () => setDialog({ kind: 'nobody' }),
    seeRoleAgain: () => setDialog({ kind: 'whose' }),
    home: onHome,
    readMorning: () => {
      if (n3Leaving.length > 0) {
        const next = record(n3Leaving.map((player) => ({ type: 'leave' as const, player })));
        setN3Leaving([]);
        if (next && roomView(next).step === 'gameOver') return go('g1');
      }
      go('m1');
    },
    finishTonight,
    backFromSummary: () => go(g2From),
    playAgain: () => {
      // MAF-061: fewer than 5 players left → Who's playing? (it says "Mafia needs at least 5 players.").
      const start = legal.find((m) => m.type === 'start');
      if (start) {
        if (record([start])) go('b1');
      } else changePlayers();
    },
    changePlayers,
    paused,
    resumed: welcome,
    lastMove: match.records[match.records.length - 1]?.move ?? null,
    sound: (name) => playSound(name, prefs),
  };

  if (how) return <HowToPlay onDone={() => setHow(false)} />;
  if (settings) {
    return (
      <Screen className="maf-settings" page>
        <ScreenContent>
          <QuietButton
            className="maf-back"
            onClick={() => {
              setSettings(false);
              onLargerChanged();
            }}
          >
            {T.s1.back}
          </QuietButton>
          {settingsPanel}
        </ScreenContent>
      </Screen>
    );
  }
  if (again !== null) {
    return (
      <Screen className="maf-room maf-private">
        <ScreenContent>
          <RoleAgain ctx={ctx} player={again} onDone={() => setAgain(null)} />
        </ScreenContent>
      </Screen>
    );
  }

  const framed = ROOM_FRAME.includes(screen);
  const covered = paused || players || dialog !== null;
  const Body = SCREENS[screen];

  const question = (): ReactNode => {
    if (!dialog) return null;
    switch (dialog.kind) {
      case 'leave':
        return (
          <Question
            ask={T.leave.ask(dialog.player)}
            body={dialog.body}
            yes={T.leave.yes(dialog.player)}
            no={T.leave.no(dialog.player)}
            onYes={() => leave(dialog.player)}
            onNo={() => setDialog(null)}
          />
        );
      case 'tooFew':
        return (
          <MafDialog title={T.leave.tooFew} onDismiss={() => setDialog(null)}>
            <Main inline onClick={() => setDialog(null)}>
              {T.leave.ok}
            </Main>
          </MafDialog>
        );
      case 'end':
        return (
          <Question
            ask={T.end.ask}
            body={T.end.body}
            yes={T.end.yes}
            no={T.end.no}
            onNo={() => setDialog(null)}
            onYes={() => {
              const from = screenRef.current;
              setDialog(null);
              if (!record([{ type: 'endGame' }])) return;
              go('g1');
              showToast(T.end.toast, () => {
                if (record([{ type: 'unEndGame' }], true)) go(from);
              });
            }}
          />
        );
      case 'tonight':
        return (
          <Question
            ask={T.tonight.ask}
            body={view.step === 'gameOver' ? T.tonight.over : T.tonight.midGame}
            yes={T.tonight.yes}
            no={T.tonight.no}
            onNo={() => setDialog(null)}
            onYes={() => {
              setDialog(null);
              setG2From(screenRef.current);
              go('g2');
            }}
          />
        );
      case 'dealAgain':
        return (
          <Question
            ask={T.dealAgain.ask}
            body={T.dealAgain.body}
            yes={T.dealAgain.yes}
            no={T.dealAgain.no}
            onNo={() => setDialog(null)}
            onYes={() => {
              setDialog(null);
              if (record([{ type: 'redeal' }])) go('b1');
            }}
          />
        );
      case 'nobody':
        return (
          <NobodyDialog
            round={view.round}
            onNo={() => setDialog(null)}
            onYes={() => {
              setDialog(null);
              if (record([{ type: 'voteNobody', reason: 'chosen' }])) go('n0');
            }}
          />
        );
      case 'delete':
        // MAF-064 item 29: D9 as Secret Words' (SWD-065).
        return (
          <MafDialog title={D.g2.deleteAsk} onDismiss={() => setDialog(null)}>
            <div className="pgn-dialog-buttons">
              <QuietButton
                onClick={() => {
                  setDialog(null);
                  store.remove(id);
                  onHome();
                }}
              >
                {D.g2.deleteYes}
              </QuietButton>
              <Main inline onClick={() => setDialog(null)}>
                {D.g2.deleteNo}
              </Main>
            </div>
          </MafDialog>
        );
      case 'whose':
        // D5: the names of players who are in.
        return (
          <MafDialog title="Whose role?" onDismiss={() => setDialog(null)}>
            <div className="maf-names-box">
              {view.in.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="pgn-option"
                  onClick={() => {
                    setDialog(null);
                    clearToast();
                    setAgain(p);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <QuietButton onClick={() => setDialog(null)}>Cancel</QuietButton>
          </MafDialog>
        );
    }
  };

  return (
    <>
      <div className="maf-room-wrap" inert={covered}>
        <HideMainButton.Provider value={covered}>
          <Screen className={`maf-room maf-${screen}`} page={PAGE_SCREENS.includes(screen)}>
            {framed && <TopBar items={items} onPause={() => setPaused(true)} />}
            {screen === 'g2' && <TopBar items={[{ label: D.g2.delete, onSelect: () => setDialog({ kind: 'delete' }) }]} />}
            {framed && welcome && <WelcomeBack where={where} />}
            <ScreenContent hidden={players}>
              <Body key={`${screen}:${view.turn?.player ?? ''}:${view.game}`} ctx={ctx} />
            </ScreenContent>
          </Screen>
        </HideMainButton.Provider>
      </div>
      {players && (
        <PlayersSheet
          rows={rows}
          canAdd={view.step !== 'ended'}
          onAdd={addNext}
          onRemove={(p) => setDialog({ kind: 'leave', player: p, body: leaveBody(p) })}
          onDone={() => {
            setPlayers(false);
            setDialog(null);
          }}
          cover={dialog && (dialog.kind === 'leave' || dialog.kind === 'tooFew') ? question() : null}
        />
      )}
      {!players && question()}
      {paused && <PausedCover where={where} onCarryOn={() => setPaused(false)} />}
      {!PRIVATE.includes(screen) && (
        <div className="maf-toast-layer">
          <Toast toast={toast} onDone={clearToast} />
        </div>
      )}
    </>
  );
}
