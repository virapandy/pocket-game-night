// Secret Words screen lane B: the turn on the host, from the first deal to game over (S6 preview, S7 scan, S7a map code
// again, S7b show the map, P1 pass, P2 private map, P3 clue, P4 guessing, P5 end-turn line, P6 turn over; D1–D5, the
// menu and Pause). Scenarios SWD-012, 030–033, 037, 040–049, 090–098, 101–104, 110–114, 116, 122, 124–126, 129.
//
// How the app uses it: once lane A's setup has created the game night and recorded its first `deal`, render
// `<SecretWordsPlay id=… store=… prefs=… ui=… />` (with `start="preview"` after "Show me the board first"). It shows the
// step the game is on, worked out from the moves and `pgn.secretWords-ui.<id>` (SWD-048), so a reload, Home's resume
// row or a return from Settings or History renders the same component again.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { HOST, type Preferences, type SavedGameStore } from '../../../../engine';
import {
  clueWarning, secretWordsRules, type ClueNumber, type SecretWordsMove, type SecretWordsState, type Team,
} from '../../rules';
import { BoardGrid, type GridCell } from '../shared/BoardGrid';
import { playSound, usePageVisibility, useNow, useReducedMotion, useViewport, useWakeLock, vibrate } from '../shared/device';
import { useGuard } from '../shared/guard';
import { whereLineFor } from '../shared/where';
import { Announcer, type MenuItem } from '../shared/parts';
import { BoardScreen } from './BoardScreen';
import { TIMER_MS, type TimerState } from './chrome';
import { ClueScreen } from './ClueScreen';
import { DisputeDialog, EarlierCluesSheet, NewBoardDialog, PauseCover, PickerDialog, ShowMapSheet } from './dialogs';
import { HowToPlayFallback } from './HowToPlayFallback';
import { PassScreen } from './PassScreen';
import { PrivateMap } from './PrivateMap';
import { ScanScreen } from './ScanScreen';
import { loadNight, readUi, recordMoves, writeUi, type Night, type NightMatch, type SwUiState } from './store';
import {
  boardCheck, clueAnnouncement, giversAnd, giversOf, giversPlus, guessLine, plural, recapLine,
  waitingLine,
} from './words';
import '../shared/sw.css';

export interface SecretWordsPlayProps {
  /** The game night (a saved game with its first `deal` recorded). */
  readonly id: string;
  readonly store: SavedGameStore;
  /** `pgn.pref.*` (Larger text, sound). */
  readonly prefs: Preferences;
  /** `pgn.secretWords-ui.*` (SWD-048). */
  readonly ui: Preferences;
  /** "Show me the board first" (SWD-010, 012): open on the preview board. */
  readonly start?: 'preview';
  readonly onHome: () => void;
  readonly onSettings: () => void;
  readonly onHistory: () => void;
  /** Lane A's How to play (SWD-011); `at: 'clue-rules'` opens it at h2 "Clue rules" (SWD-124). */
  readonly howToPlay?: (o: { onDone: () => void; at?: 'clue-rules' }) => ReactNode;
  /** Lane D's game over (G1, SWD-051, 112). */
  readonly gameOver?: (o: { id: string; match: NightMatch }) => ReactNode;
  /** Lane D's Players sheet, "End the game" and "End for tonight" (SWD-127, 054, 060). */
  readonly onMenu?: (item: 'players' | 'end-game' | 'end-tonight') => void;
}

type Screen =
  | { readonly name: 'preview' }
  | { readonly name: 'scan' }
  | { readonly name: 'again'; readonly back: Screen }
  | { readonly name: 'pass'; readonly welcome: boolean }
  | { readonly name: 'map'; readonly again: boolean }
  | { readonly name: 'showPass'; readonly team: Team; readonly back: Screen; readonly welcome?: boolean }
  | { readonly name: 'showMap'; readonly team: Team; readonly back: Screen }
  | { readonly name: 'clue'; readonly changing: boolean }
  | { readonly name: 'board' }
  | { readonly name: 'over' };

type Overlay = null | 'pause' | 'dispute' | 'earlier' | 'picker' | 'newBoard' | 'showMap' | 'howto' | 'rules';


/** SWD-048: the step a mounting turn screen shows, from the moves and the saved screen state. */
function screenFor(match: NightMatch, ui: SwUiState): Screen {
  const s = match.state;
  const g = s.game;
  if (!g || g.step === 'over') return { name: 'over' };
  if (g.step === 'clue') {
    const fresh = g.turnNo === 1 && g.clues.length === 0;
    if (ui.step === 'preview' && fresh && !g.mapSeen) return { name: 'preview' };
    if (s.choices.map !== 'pass') return fresh ? { name: 'scan' } : { name: 'clue', changing: false };
    if (ui.step === 'map') return ui.paused ? { name: 'map', again: false } : { name: 'pass', welcome: true };
    return g.mapSeen ? { name: 'clue', changing: false } : { name: 'pass', welcome: false };
  }
  return { name: 'board' };
}

/** SWD-043, 046: the result line of the turn's last reveal (also after a reload, SWD-048). */
function resultLineOf(match: NightMatch): string | null {
  const s = match.state;
  const g = s.game;
  const last = match.records[match.records.length - 1]?.move as SecretWordsMove | undefined;
  if (!g || g.step === 'over' || !last) return null;
  if (last.type === 'brokeRule') return 'The clue broke a rule, so the other team got a free word.';
  if (last.type !== 'reveal') return null;
  const kind = g.kinds[last.cell];
  const team = g.turn;
  if (kind === 'landmine') return 'Boom! The Landmine. Your turn ends and the other team gets a free word.';
  if (kind === team) {
    const who = `✓ ${giversAnd(giversOf(s.teams, team))}'s clue works!`;
    if (g.step === 'turn-over') return `${who} That's all your guesses.`;
    const n = g.clue?.n ?? 0;
    if (n === 0 || n === 'inf') return `${who} Keep going, or end your turn.`;
    return `${who} ${plural(n + 1 - g.guesses, 'guess', 'guesses')} left.`;
  }
  if (kind === 'nobody') return "Nobody's word. Other team's turn next.";
  return "✗ The other team's word! It counts for them.";
}

const guessersOf = (s: SecretWordsState, team: Team) => s.teams[team].filter((p) => p !== s.teams.clueGivers[team] && p !== s.teams.partners[team]);

export function SecretWordsPlay(props: SecretWordsPlayProps) {
  const { id, store, prefs, ui, onHome, onSettings, onHistory, howToPlay, gameOver, onMenu } = props;
  const [night, setNightState] = useState(() => {
    const saved = store.get(id);
    const match = loadNight(saved);
    return saved && match ? { saved: saved as Night, match } : null;
  });
  const nightRef = useRef(night);
  const setNight = (n: { saved: Night; match: NightMatch }) => {
    nightRef.current = n;
    setNightState(n);
  };
  const [uiState, setUiState] = useState<SwUiState>(() => {
    const cur = readUi(ui, id);
    return writeUi(ui, id, { showing: true, ...(props.start === 'preview' && cur.step === undefined ? { step: 'preview' } : {}) });
  });
  const patchUi = useCallback((p: Partial<SwUiState>) => setUiState(writeUi(ui, id, p)), [ui, id]);

  const [screen, setScreen] = useState<Screen>(() => (night ? screenFor(night.match, uiState) : { name: 'over' }));
  const [seq, setSeq] = useState(0);
  const [endLine, setEndLine] = useState(() => {
    const g = night?.match.state.game;
    return uiState.step === 'end-turn' && g?.step === 'guessing' && g.guesses > 0;
  });
  const [overlay, setOverlay] = useState<Overlay>(() => (uiState.paused ? 'pause' : null));
  const [timer, setTimer] = useState<TimerState>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ n: ClueNumber | null; word: string }>({ n: null, word: '' });
  const [pokerUntil, setPokerUntil] = useState(0);
  const [anim, setAnim] = useState<{ shown: NightMatch; cells: number[] } | null>(null);
  /** When the last reveal's 300 ms turn ended (SWD-114: the turn-over guard counts from there). */
  const turnedAt = useRef<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const [hiddenCover, setHiddenCover] = useState(false);
  const [toast, setToast] = useState<{ text: string; at: number } | null>(null);
  const flipIgnoreUntil = useRef(0);
  const lastRecordTap = useRef(-Infinity);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduced = useReducedMotion();
  const vp = useViewport();
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const go = (s: Screen) => {
    setScreen(s);
    setSeq((n) => n + 1);
  };

  // SWD-048: the step saved for a reload.
  const match = night?.match;
  const state = match?.state;
  const game = state?.game ?? null;
  useEffect(() => {
    if (!game) return;
    let step: string | null = null;
    switch (screen.name) {
      case 'preview':
      case 'scan':
      case 'map':
      case 'clue':
        step = screen.name;
        break;
      case 'pass':
        // After the app was hidden on the private map, a reload still says "Welcome back." (SWD-032).
        step = screen.welcome ? 'map' : 'pass';
        break;
      case 'board':
        step = endLine ? 'end-turn' : game.step;
        break;
      default:
        step = null;
    }
    if (step && step !== uiState.step) patchUi({ step });
  }, [screen, endLine, game, uiState.step, patchUi]);

  // SWD-047: the chime at "Time's up!".
  useEffect(() => {
    if (!timer || timer.kind !== 'run') return;
    const wait = timer.at + TIMER_MS - Date.now();
    if (wait < 0) return;
    const t = setTimeout(() => playSound('chime', prefs), wait);
    return () => clearTimeout(t);
  }, [timer, prefs]);

  // SWD-102: the flip toast (2 s).
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), Math.max(0, toast.at + 2000 - Date.now()));
    return () => clearTimeout(t);
  }, [toast]);

  // SWD-032, 047: hidden → the timer pauses; a map screen is removed in the same task, with the privacy cover.
  usePageVisibility(
    () => {
      setTimer((t) => (t && t.kind === 'run' ? { kind: 'paused' } : t));
      if (screen.name === 'map') {
        setHiddenCover(true);
        go({ name: 'pass', welcome: true });
      } else if (screen.name === 'showMap') {
        setHiddenCover(true);
        go({ name: 'showPass', team: screen.team, back: screen.back, welcome: true });
      }
    },
    () => setHiddenCover(false),
  );

  const paused = overlay === 'pause';
  useWakeLock(!!game && game.step !== 'over' && !paused && !hiddenCover);

  const pokerShown = useNow(pokerUntil > Date.now() ? pokerUntil : null) < pokerUntil;

  // Guards (SWD-114): keyed on the screen appearing.
  const shownMatch = anim?.shown ?? match;
  const shownGame = shownMatch?.state.game ?? null;
  const boardPhase = !shownGame ? 'none' : shownGame.step === 'turn-over' ? 'over' : endLine ? 'end' : 'guess';
  const guardKey = screen.name === 'board' ? `${seq}:board:${boardPhase}` : `${seq}:${screen.name}`;
  const guardMs =
    screen.name === 'pass' || screen.name === 'showPass'
      ? 1000
      : screen.name === 'board' && boardPhase === 'over'
        ? 1500
        : 800;
  // "Other team's turn" after a reveal waits 1.5 s from the end of the 300 ms turn, not from when React drew it (SWD-114).
  const guardUntil = useGuard(guardKey, guardMs, boardPhase === 'over' ? turnedAt.current : null);

  if (!night || !match || !state) return null;
  const teams = state.teams;
  const names = { orange: teams.names.orange, teal: teams.names.teal };
  const map = state.choices.map;
  const three = map === 'own';

  // ---- Recording ----
  const record = (moves: SecretWordsMove[], tap = true): NightMatch | null => {
    const now = Date.now();
    if (tap && now - lastRecordTap.current < 800) return null;
    const cur = nightRef.current;
    if (!cur) return null;
    const r = recordMoves(store, cur.saved, cur.match, moves);
    if (!r) return null;
    if (tap) lastRecordTap.current = now;
    setNight(r);
    return r.match;
  };
  const legal = (m: NightMatch) => secretWordsRules.legalMoves(m.state, HOST);

  const later = (ms: number, f: () => void) => {
    if (ms <= 0) f();
    else timers.current.push(setTimeout(f, ms));
  };

  /** SWD-043, 046, 097: the 300 ms turn, then the result, the sound, the vibration and the announcement. */
  const turnOver = (before: NightMatch, after: NightMatch, cells: number[]) => {
    const last = after.records[after.records.length - 1]?.move as SecretWordsMove;
    const g = after.state.game!;
    const kind = last.type === 'reveal' ? g.kinds[last.cell] : null;
    const finish = () => {
      turnedAt.current = Date.now();
      setAnim(null);
      if (kind === 'landmine') {
        playSound('boom', prefs);
        vibrate(200);
      } else if (kind === before.state.game!.turn) {
        playSound('ding', prefs);
        vibrate(50);
      } else {
        playSound('thud', prefs);
        vibrate(50);
      }
      const line = resultLineOf(after);
      if (g.step === 'over') go({ name: 'over' });
      else if (line) setAnnounce(g.step === 'turn-over' ? `${line} Other team's turn` : line);
    };
    if (reduced) finish();
    else {
      setAnim({ shown: before, cells });
      // flushSync: the turned-over cell is on screen as soon as the 300 ms are up, never a moment later (SWD-043), so
      // no room screen ever shows the finished turn with that cell still drawn face down and turning (SWD-025).
      later(300, () => flushSync(finish));
    }
  };

  const nextTurnDone = (m: NightMatch) => {
    setEndLine(false);
    setTimer(null);
    setPick(null);
    setPokerUntil(0);
    setDraft({ n: null, word: '' });
    patchUi({ pickerOverride: null });
    go(m.state.choices.map === 'pass' ? { name: 'pass', welcome: false } : { name: 'clue', changing: false });
  };

  const newBoard = () => {
    const move = legal(match).find((m) => m.type === 'dealNew');
    if (!move) return;
    const m = record([move], false);
    if (!m) return;
    setOverlay(null);
    setTimer(null);
    setPick(null);
    setEndLine(false);
    setPokerUntil(0);
    setDraft({ n: null, word: '' });
    patchUi({ pickerOverride: null });
    go(m.state.choices.map === 'pass' ? { name: 'pass', welcome: false } : { name: 'scan' });
  };

  const toggleTimer = () => setTimer((t) => (t && t.kind === 'run' ? null : { kind: 'run', at: Date.now() }));

  const angles = uiState.angles ?? { orange: 0, teal: 0 };
  const flip = (team: Team) => {
    const next = angles[team] === 180 ? 0 : 180;
    if (!uiState.flipped) setToast({ text: 'Board flipped for the other side of the table', at: Date.now() });
    flipIgnoreUntil.current = Date.now() + 300;
    patchUi({ angles: { ...angles, [team]: next }, flipped: true });
  };

  // ---- Words ----
  const g = game;
  const turnTeam: Team = g?.turn ?? 'orange';
  const teamName = (t: Team) => teams.names[t];
  const T = g?.turnNo ?? 1;
  const firstDeal = state.deals === 1;
  const moveTypes = match.records.map((r) => r.move.type);
  const pickerName = uiState.pickerOverride ?? g?.picker ?? null;

  const whereText = (): string =>
    whereLineFor(
      state,
      screen.name === 'preview' ? 'preview' : screen.name === 'scan' || screen.name === 'again' ? 'scan' : screen.name === 'board' && endLine ? 'end-turn' : null,
    );

  // ---- The menu (SWD-110 v3.7; the menu table) ----
  const item = (label: string, onSelect: () => void, disabled?: boolean): MenuItem => (disabled ? { label, onSelect, disabled } : { label, onSelect });
  const pauseItem = item('Pause', () => openPause());
  const players = item('Players', () => onMenu?.('players'));
  const showMapItem = item('Show the map to a clue giver', () => setOverlay('showMap'));
  const codeAgain = item('Show the map code again', () => go({ name: 'again', back: screen }));
  const fix = [item('New board', () => setOverlay('newBoard'))];
  const leave = (endGame: boolean) => [
    item('Home (keep this game)', () => {
      patchUi({ showing: false });
      onHome();
    }),
    ...(endGame ? [item('End the game', () => onMenu?.('end-game'))] : []),
    item('End for tonight', () => onMenu?.('end-tonight')),
  ];
  const more = [item('How to play', () => setOverlay('howto')), item('Settings', onSettings), item('History', onHistory)];
  const twoThree = map !== 'pass' ? [showMapItem, codeAgain] : [];
  const small = vp.landscape && vp.small;
  const flipItem = small ? [item('Flip the board', () => flip(turnTeam))] : [];
  const menuFor = (step: 'preview' | 'scan' | 'pass' | 'clue' | 'guess' | 'end' | 'over'): MenuItem[][] => {
    switch (step) {
      case 'preview':
        return [[pauseItem, ...flipItem], fix, leave(false), more];
      case 'scan':
      case 'pass':
        return [[pauseItem, players], fix, leave(true), more];
      case 'clue':
        return [[pauseItem, players, ...twoThree], fix, leave(true), more];
      case 'guess': {
        const window = !!g && g.step === 'guessing' && g.guesses === 0;
        const play: MenuItem[] = [
          pauseItem,
          item('Earlier clues', () => setOverlay('earlier')),
          item(timer && timer.kind === 'run' ? 'Stop timer' : 'Start 90-second timer', toggleTimer),
          item('Clue not allowed?', () => setOverlay('dispute'), !window),
          ...(small ? [item('Change clue', () => changeClue(), !window)] : []),
          ...flipItem,
          ...(g && guessersOf(state, g.turn).length > 1 ? [item('Someone else taps Reveal', () => setOverlay('picker'))] : []),
          players,
          ...twoThree,
        ];
        return [play, fix, leave(true), more];
      }
      default:
        return [[pauseItem, item('Earlier clues', () => setOverlay('earlier')), ...flipItem, players, ...twoThree], fix, leave(true), more];
    }
  };

  function openPause() {
    setTimer((t) => (t && t.kind === 'run' ? { kind: 'paused' } : t));
    patchUi({ paused: true });
    setOverlay('pause');
  }
  const goHome = () => {
    patchUi({ paused: false, showing: false });
    setOverlay(null);
    onHome();
  };
  const carryOn = () => {
    patchUi({ paused: false });
    setOverlay(null);
  };

  const changeClue = () => {
    if (!g?.clue) return;
    setDraft({ n: g.clue.n, word: g.clue.word ?? '' });
    setOverlay(null);
    go({ name: 'clue', changing: true });
  };

  // ---- Overlays ----
  const covered = overlay !== null;
  let overlayNode: ReactNode = null;
  if (overlay === 'pause') overlayNode = <PauseCover where={whereText()} onCarryOn={carryOn} onHome={goHome} />;
  else if (overlay === 'dispute')
    overlayNode = (
      <DisputeDialog
        onTry={changeClue}
        onBroke={() => {
          const move = legal(match).find((m) => m.type === 'brokeRule');
          if (!move || move.type !== 'brokeRule') return;
          const before = match;
          const m = record([move]);
          if (!m) return;
          setOverlay(null);
          setPick(null);
          setTimer(null);
          turnOver(before, m, [move.cell]);
        }}
        onRules={() => setOverlay('rules')}
        onLetGo={() => setOverlay(null)}
      />
    );
  else if (overlay === 'earlier' && g)
    overlayNode = (
      <EarlierCluesSheet
        items={g.clues.map((c) => (
          <>
            {teamName(c.team)}:{' '}
            {c.word ? (
              <>
                <span className="sw-caps">{c.word}</span> {c.n === 'inf' ? '∞' : c.n}
              </>
            ) : c.n === 'inf' ? (
              '∞'
            ) : (
              String(c.n)
            )}
          </>
        ))}
        onDone={() => setOverlay(null)}
      />
    );
  else if (overlay === 'picker' && g)
    overlayNode = (
      <PickerDialog
        guessers={guessersOf(state, g.turn)}
        current={pickerName}
        onPick={(name) => {
          patchUi({ pickerOverride: name });
          setOverlay(null);
        }}
        onCancel={() => setOverlay(null)}
      />
    );
  else if (overlay === 'newBoard') overlayNode = <NewBoardDialog onNewBoard={newBoard} onKeep={() => setOverlay(null)} />;
  else if (overlay === 'showMap')
    overlayNode = (
      <ShowMapSheet
        choices={(['orange', 'teal'] as const).map((t) => ({ team: t, label: `${giversPlus(giversOf(teams, t))} (${teamName(t)})` }))}
        onChoose={(t) => {
          setOverlay(null);
          go({ name: 'showPass', team: t, back: screen });
        }}
        onCancel={() => setOverlay(null)}
      />
    );
  else if (overlay === 'howto' || overlay === 'rules') {
    const back = overlay === 'rules' ? () => setOverlay('dispute') : () => setOverlay(null);
    const o = overlay === 'rules' ? { onDone: back, at: 'clue-rules' as const } : { onDone: back };
    overlayNode = howToPlay ? <HowToPlaySheet at={overlay === 'rules' ? 'clue-rules' : undefined}>{howToPlay(o)}</HowToPlaySheet> : <HowToPlayFallback {...o} />;
  }

  // ---- Screens ----
  const room = secretWordsRules.view((shownMatch ?? match).state, { kind: 'room' });
  const columns = g && g.words.length === 16 ? 4 : 5;
  const recap = recapLine(state);
  let body: ReactNode = null;

  const mapCells = (): GridCell[] => (g ? g.words.map((word, i) => ({ word, kind: g.kinds[i]!, found: g.turned[i]! })) : []);
  const privateMap = (team: Team, startShown: boolean, mainLabel: string, onMain: () => void, onNotMe: () => void) =>
    g && (
      <PrivateMap
        team={team}
        teamName={teamName(team)}
        givers={giversOf(teams, team)}
        cells={mapCells()}
        kinds={g.kinds}
        columns={columns}
        angle={angles[team]}
        counts={room.left}
        names={names}
        startShown={startShown}
        mainLabel={mainLabel}
        guardUntil={guardUntil}
        onMain={onMain}
        onNotMe={onNotMe}
        onSaw={() => setOverlay('newBoard')}
        onPause={openPause}
        onFlip={() => flip(team)}
        timer={timer}
      />
    );

  switch (screen.name) {
    case 'preview':
      body = g && (
        <BoardScreen
          team={g.turn}
          heading="The board, before you start"
          turnLine={`${teamName(g.turn)} start`}
          counts={room.left}
          names={names}
          cells={room.cells}
          columns={columns}
          angle={angles[g.turn]}
          picked={null}
          locked
          turning={[]}
          ignoreTaps={() => Date.now() < flipIgnoreUntil.current}
          bottom={null}
          actions={{}}
          main={{ line2: 'Start', until: guardUntil, onClick: () => go(map === 'pass' ? { name: 'pass', welcome: false } : { name: 'scan' }) }}
          timer={null}
          onPause={openPause}
          menu={menuFor('preview')}
          onFlip={() => flip(g.turn)}
          covered={covered}
        />
      );
      break;
    case 'scan':
    case 'again': {
      const again = screen.name === 'again';
      const og = giversPlus(giversOf(teams, 'orange'));
      const tg = giversPlus(giversOf(teams, 'teal'));
      const giverLine = three
        ? `${og} (${names.orange}, orange) and ${tg} (${names.teal}, teal): scan on your own phones.`
        : `${og} and ${tg}: sit together and share one map phone (each gives clues for their own team).`;
      const base = `${location.origin}${import.meta.env.BASE_URL}`;
      body = g && (
        <ScanScreen
          giverLine={giverLine}
          three={three}
          qrText={`${base}#map=${g.code}&t=${teams.names.id}${three ? '&p=own' : ''}`}
          code={g.code}
          check={boardCheck(match, again)}
          dnd={!again && firstDeal && !moveTypes.includes('clue')}
          paused={paused}
          mainText={again ? 'Back to the game' : three ? 'Both have the map' : 'The map phone has the map'}
          guardUntil={guardUntil}
          onMain={() => (screen.name === 'again' ? go(screen.back) : go({ name: 'clue', changing: false }))}
          covered={covered}
          {...(again ? {} : { onPause: openPause, menu: menuFor('scan') })}
        />
      );
      break;
    }
    case 'pass':
    case 'showPass': {
      const show = screen.name === 'showPass';
      const team = show ? screen.team : turnTeam;
      body = (
        <PassScreen
          team={team}
          teamName={teamName(team)}
          givers={giversOf(teams, team)}
          welcome={!!screen.welcome}
          where={whereText()}
          waiting={show ? null : waitingLine(state, team)}
          recap={show ? null : recap}
          dnd={!show && firstDeal && !moveTypes.includes('mapSeen')}
          timer={timer}
          onTimer={toggleTimer}
          guardUntil={guardUntil}
          onReady={() => (screen.name === 'showPass' ? go({ name: 'showMap', team, back: screen.back }) : go({ name: 'map', again: false }))}
          onPause={openPause}
          menu={menuFor('pass')}
          covered={covered}
        />
      );
      break;
    }
    case 'map':
      body = privateMap(
        turnTeam,
        screen.again,
        screen.again ? 'Back to my clue' : 'I have my clue',
        () => {
          if (screen.again) {
            go({ name: 'clue', changing: false });
            return;
          }
          if (g && !g.mapSeen) {
            const m = record([{ type: 'mapSeen' }], false);
            if (!m) return;
          }
          setDraft({ n: null, word: '' });
          go({ name: 'clue', changing: false });
        },
        () => go({ name: 'pass', welcome: false }),
      );
      break;
    case 'showMap':
      body = privateMap(
        screen.team,
        false,
        'Done, hide the map',
        () => go(screen.back),
        () => go({ name: 'showPass', team: screen.team, back: screen.back }),
      );
      break;
    case 'clue': {
      if (!g) break;
      const changing = screen.changing;
      const cells = g.words.map((word, i) => ({ word, turned: g.turned[i]! }));
      body = (
        <ClueScreen
          team={turnTeam}
          teamName={teamName(turnTeam)}
          givers={giversOf(teams, turnTeam)}
          n={draft.n}
          word={draft.word}
          onKey={(n) => setDraft((d) => ({ ...d, n }))}
          onWord={(word) => setDraft((d) => ({ ...d, word }))}
          warning={clueWarning(draft.word, cells)}
          counts={room.left}
          names={names}
          tip={firstDeal && T === 1}
          anyone={firstDeal && T === 1}
          waiting={map !== 'pass' ? waitingLine(state, turnTeam) : null}
          recap={map !== 'pass' ? recap : null}
          onSeeMap={map === 'pass' && !changing ? () => go({ name: 'map', again: true }) : null}
          onKeep={
            changing
              ? () => {
                  setDraft({ n: null, word: '' });
                  go({ name: 'board' });
                }
              : null
          }
          timer={timer}
          onTimer={toggleTimer}
          guardUntil={guardUntil}
          onConfirm={() => {
            if (draft.n === null) return;
            const word = draft.word.trim();
            const move: SecretWordsMove = word ? { type: 'clue', n: draft.n, word } : { type: 'clue', n: draft.n };
            const m = record([move]);
            if (!m) return;
            setTimer(null);
            setPick(null);
            setPokerUntil(Date.now() + 3000);
            setAnnounce(clueAnnouncement(teamName(turnTeam), draft.n, word || undefined));
            setDraft({ n: null, word: '' });
            go({ name: 'board' });
          }}
          onPause={openPause}
          menu={menuFor('clue')}
          covered={covered}
        />
      );
      break;
    }
    case 'board': {
      if (!shownGame || !shownMatch) break;
      const sg = shownGame;
      const team = sg.turn;
      const phase = boardPhase;
      const guessing = sg.step === 'guessing';
      const clue = sg.clue;
      const word = pick !== null ? sg.words[pick] : null;
      const picker = pickerName ?? '';
      const earlier = guessing ? sg.clues.filter((c) => c.team === team).slice(0, -1).reverse().slice(0, 3) : [];
      const history =
        earlier.length > 0 ? (
          <p className="sw-small sw-history" data-testid="clue-history">
            Earlier:{' '}
            {earlier.map((c, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {c.word ? (
                  <>
                    <span className="sw-caps">{c.word}</span> {c.n === 'inf' ? '∞' : c.n}
                  </>
                ) : c.n === 'inf' ? (
                  '∞'
                ) : (
                  c.n
                )}
              </span>
            ))}
          </p>
        ) : undefined;
      const clueLine =
        guessing && clue ? (
          clue.word ? (
            <>
              <span className="sw-caps">{clue.word}</span> · {clue.n === 'inf' ? '∞' : clue.n}
            </>
          ) : (
            `Clue: ${clue.n === 'inf' ? 'any number' : clue.n}`
          )
        ) : undefined;
      const result = anim ? null : phase === 'end' ? `${teamName(team)} ended their turn.` : resultLineOf(shownMatch);
      const tip =
        !anim && phase === 'guess' && sg.guesses === 0 && firstDeal && sg.turnNo === 1
          ? `Tap a word to suggest it. ${picker} taps Reveal this turn; it moves round each turn.`
          : null;
      const bottom = result ? { id: 'result-line' as const, text: result } : tip ? { id: 'tip' as const, text: tip } : null;
      const actions =
        anim || phase === 'over'
          ? {}
          : phase === 'end'
            ? { oops: () => setEndLine(false) }
            : sg.guesses === 0
              ? { change: changeClue, dispute: () => setOverlay('dispute') }
              : {
                  endTurn: () => {
                    setPick(null);
                    setTimer(null);
                    setEndLine(true);
                  },
                };
      const main =
        phase === 'guess'
          ? {
              line2: word ? (
                <>
                  Reveal <span className="sw-caps">{word}</span>
                </>
              ) : (
                'Reveal'
              ),
              disabled: pick === null || !!anim,
              until: guardUntil,
              onClick: () => {
                if (pick === null || anim) return;
                const move = legal(match).find((m) => m.type === 'reveal' && m.cell === pick);
                if (!move || move.type !== 'reveal') return;
                const before = match;
                const m = record([move]);
                if (!m) return;
                setPick(null);
                turnOver(before, m, move.freeCell !== undefined ? [move.cell, move.freeCell] : [move.cell]);
              },
            }
          : {
              line2: "Other team's turn",
              until: guardUntil,
              onClick: () => {
                const m = record(phase === 'end' ? [{ type: 'endTurn' }, { type: 'nextTurn' }] : [{ type: 'nextTurn' }]);
                if (m) nextTurnDone(m);
              },
            };
      body = (
        <BoardScreen
          team={team}
          turnLine={pokerShown && phase === 'guess' ? `${giversPlus(giversOf(teams, team))}: no hints, no faces!` : phase === 'guess' && picker ? `${teamName(team)} guessing · ${picker} taps Reveal` : `${teamName(team)} guessing`}
          poker={pokerShown && phase === 'guess'}
          {...(clueLine !== undefined && phase !== 'over' ? { clueLine, guessLine: guessLine(clue!.n, sg.guesses) } : {})}
          {...(history && phase !== 'over' ? { history } : {})}
          counts={room.left}
          names={names}
          cells={room.cells}
          columns={columns}
          angle={angles[team]}
          picked={pick}
          locked={phase !== 'guess' || !!anim}
          turning={anim?.cells ?? []}
          {...(phase === 'guess' && !anim ? { onPick: (i: number) => setPick((p) => (p === i ? null : i)) } : {})}
          ignoreTaps={() => !!anim || Date.now() < flipIgnoreUntil.current}
          bottom={bottom}
          actions={actions}
          main={main}
          timer={timer}
          onPause={openPause}
          menu={menuFor(phase === 'guess' ? 'guess' : phase === 'end' ? 'end' : 'over')}
          onFlip={() => flip(team)}
          covered={covered}
        />
      );
      break;
    }
    case 'over':
      body = gameOver ? gameOver({ id, match }) : g && <GameOverStandIn cells={room.cells} columns={columns} />;
      break;
  }

  return (
    <div className={`sw pgn${prefs.get<boolean>('largerText', false) === true ? ' pgn-larger' : ''}`}>
      {body}
      {overlayNode}
      {toast && (
        <p className="sw-toast" data-testid="toast" role="status">
          {toast.text}
        </p>
      )}
      {hiddenCover && <div className="sw-privacy-cover" data-testid="privacy-cover" />}
      <Announcer text={announce} />
    </div>
  );
}

/** Lane A's How to play over the turn screens; opened at h2 "Clue rules" from the dispute dialog (SWD-124). */
function HowToPlaySheet({ at, children }: { at: 'clue-rules' | undefined; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (at !== 'clue-rules') return;
    const h2 = [...(ref.current?.querySelectorAll('h2') ?? [])].find((h) => h.textContent?.trim() === 'Clue rules');
    h2?.scrollIntoView({ block: 'start' });
  }, [at]);
  return (
    <div className={at ? 'sw-sheet sw-howto sw-howto-at' : 'sw-sheet sw-howto'} ref={ref}>
      {children}
    </div>
  );
}

/** Until lane D's game over is passed in: the whole map, nothing else. */
function GameOverStandIn({ cells, columns }: { cells: readonly GridCell[]; columns: number }) {
  return (
    <div className="sw-fixed">
      <BoardGrid cells={cells} columns={columns} locked />
    </div>
  );
}
