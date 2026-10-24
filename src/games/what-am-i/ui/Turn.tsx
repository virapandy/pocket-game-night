// A turn on the host phone (lane W3): T1 the pass screen (WAI-012, WAI-014, WAI-015, the tip line WAI-011), T0 the motion
// question (WAI-013), T2 the countdown (WAI-016), T3 the word (WAI-020 to WAI-025: taps and motion, flashes, sounds and
// vibration, rotation lock, wake lock, `mark-live`), T4 Time's up with fixes and Save score (WAI-030, WAI-031, Version 1.3
// item 3) and the "Riya: 5 saved · Undo" toast. The marking decision itself is pure (rules/marking.ts).
//
// T1, T2 and T3 are one component (`TurnFlow`), so the turn keeps its clock when its first move turns the frame's screen
// from T1 to the turn: Screens.tsx gives the frame the same component for both.
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { QuietButton, Screen, ScreenContent, Toast } from '../../../blocks';
import {
  countdownReference, headOf, joinNames, motionEvent, packOf, pitch, rotationEvent, startMotion, startRotation, steadyReference,
  tapArea, tickTimes, timeLeftText, tipLine, toPlayOf, wordText, COUNTDOWN_BEEPS, FLASH_MS, GUARD_MS,
  type MarkKind, type Motion, type Rotation, type Sample, type WaiState,
} from '../rules';
import type { StepProps, WaiScreen } from './Frame';
import { platformOf } from './hooks';
import { turnKey } from './night';
import { HomeButton, Main, START_GUARD_MS, ToastHost, WaiDialog, useWaiBack } from './parts';
import { Drawing } from './Setup';
import {
  askAgainSilently, askMotion, asksFirst, clearSavedToast, gameKey, holdScreenOn, letScreenSleep, motionReady, motionWanted,
  noteRotation, noteWakeRefused, onSavedToast, playSound, rotationEarlier, savedToastFor, screenTipDue, screenTipShown, setMotionState,
  showSavedToast, vibrate, wakeAudio,
} from './turnPhone';
import './turn.css';

/** When this page loaded: a `resume` recorded before it was made on an earlier page (a reload), not by a tap here. */
const PAGE_LOADED = Date.now();

const COUNTDOWN_MS = 3000;
const holdOf = (s: WaiState, p: string) => s.holds[p] ?? s.choices?.hold ?? 'hand';
const portraitType = () => {
  try {
    return String(screen.orientation?.type ?? '').startsWith('portrait');
  } catch {
    return false;
  }
};

type Phase = 't1' | 't0' | 'count' | 'word' | 'idle';

/** How a fresh T1/T2/T3 opens: T1; the countdown after "Carry on playing"; or (a reload mid-turn) nothing until paused. */
function opening(p: StepProps): { phase: Phase; reload: boolean } {
  const s = p.state;
  if (s.step === 'pass' && !s.turn) {
    return p.ui.turnOn === turnKey(s) ? { phase: 'idle', reload: true } : { phase: 't1', reload: false };
  }
  const last = p.live.match.records[p.live.match.records.length - 1];
  if (last?.move.type === 'resume' && last.at > PAGE_LOADED) return { phase: 'count', reload: false };
  return { phase: 'idle', reload: false };
}

/** The turn's running parts, kept between renders. */
interface Run {
  /** T2's start (Date.now()). */
  t2: number;
  /** The turn time T, and the time left when this T2 started. */
  T: number;
  msLeft: number;
  motion: boolean;
  sawEarly: boolean;
  samples: Sample[];
  steady: Sample[];
  marking: Motion;
  rotation: Rotation;
  /** T3 opened (Date.now()) and the turn clock then. */
  segStart: number;
  elapsed0: number;
  /** The word on screen appeared (end of the last flash, or T3 opening). */
  wordAt: number;
  flashUntil: number;
  timers: number[];
}

export function TurnFlow(p: StepProps) {
  const ref = useRef(p);
  ref.current = p;
  const s = p.state;
  const player = p.view.player ?? s.turn?.player ?? '';
  const night = p.live.saved.id;
  const [init] = useState(() => opening(p));
  const [phase, setPhaseState] = useState<Phase>(init.phase);
  const phaseRef = useRef<Phase>(init.phase);
  const setPhase = (ph: Phase) => {
    phaseRef.current = ph;
    setPhaseState(ph);
  };
  const [count, setCount] = useState(3);
  const [shown, setShown] = useState<string | null>(null);
  const shownRef = useRef<string | null>(null);
  const [flash, setFlash] = useState<MarkKind | null>(null);
  const [live, setLive] = useState('');
  const [turned, setTurned] = useState<false | 1 | -1>(false);
  const [, setTick] = useState(0);
  const [chooser, setChooser] = useState(false);
  const run = useRef<Run | null>(null);
  const holdFor = (st: WaiState) => holdOf(st, st.turn?.player ?? ref.current.view.player ?? '');

  const clearTimers = () => {
    const r = run.current;
    if (!r) return;
    for (const t of r.timers) clearTimeout(t);
    r.timers = [];
  };
  const after = (ms: number, fn: () => void) => {
    const r = run.current;
    if (r) r.timers.push(window.setTimeout(fn, Math.max(0, ms)));
  };
  useEffect(() => () => clearTimers(), []);

  // ---- T2: the countdown (WAI-016) ----
  const beginCountdown = (msLeft: number) => {
    const cur = ref.current;
    const st = cur.state;
    const T = (st.choices?.time ?? 60) * 1000;
    const now = Date.now();
    clearTimers();
    run.current = {
      t2: now, T, msLeft, motion: motionReady(cur.prefs, holdFor(st)), sawEarly: false, samples: [], steady: [],
      marking: startMotion(null), rotation: run.current?.rotation ?? startRotation, segStart: 0, elapsed0: 0, wordAt: 0,
      flashUntil: 0, timers: [],
    };
    if (st.step === 'pass') cur.setUi({ turnOn: turnKey(st), msLeft, wordShowing: false });
    else cur.setUi({ msLeft, wordShowing: false });
    setCount(3);
    setFlash(null);
    setLive('');
    setPhase('count');
    wakeAudio();
    holdScreenOn(() => noteWakeRefused(ref.current.prefs));
    const on = ref.current.state.choices?.sounds !== false;
    for (const b of COUNTDOWN_BEEPS) {
      if (b === 0) playSound('countdown', on);
      else after(b, () => {
        setCount(3 - b / 1000);
        playSound('countdown', ref.current.state.choices?.sounds !== false);
      });
    }
    after(COUNTDOWN_MS, beginWord);
  };

  // ---- T3: the word (WAI-020, WAI-021) ----
  const beginWord = () => {
    const r = run.current;
    if (!r) return;
    const now = Date.now();
    r.segStart = now;
    r.elapsed0 = r.T - r.msLeft;
    r.wordAt = now;
    r.flashUntil = 0;
    const theta0 = r.motion && r.sawEarly ? countdownReference(r.samples) : null;
    r.marking = startMotion(theta0);
    r.steady = [];
    const head = headOf(ref.current.state);
    shownRef.current = head;
    setShown(head);
    setPhase('word');
    ref.current.setUi({ wordShowing: true });
    // WAI-010: every word left was already shown this turn, so time is up at once.
    if (head === null) return timeUp();
    const on = () => ref.current.state.choices?.sounds !== false;
    for (const t of tickTimes(r.T)) if (t > r.elapsed0) after(t - r.elapsed0, () => playSound('tick', on()));
    const ten = r.T - 10000;
    if (ten > r.elapsed0) after(ten - r.elapsed0, () => setLive('10 seconds left'));
    after(r.T - r.elapsed0, timeUp);
    const second = () => {
      const e = elapsed();
      const next = Math.floor(e / 1000) * 1000 + 1000;
      if (next >= r.T) return;
      after(next - e, () => {
        ref.current.setUi({ msLeft: r.T - elapsed() });
        setTick((n) => n + 1);
        second();
      });
    };
    second();
  };
  const elapsed = () => {
    const r = run.current;
    return r ? r.elapsed0 + (Date.now() - r.segStart) : 0;
  };

  const mark = (kind: MarkKind) => {
    const r = run.current;
    const word = shownRef.current;
    if (!r || phaseRef.current !== 'word' || word === null) return;
    const now = Date.now();
    if (now < r.flashUntil || now < r.wordAt + GUARD_MS) return;
    if (!ref.current.act({ type: kind, word })) return;
    r.flashUntil = now + FLASH_MS;
    setFlash(kind);
    setLive(kind === 'got' ? 'Got it' : 'Pass');
    playSound(kind, ref.current.state.choices?.sounds !== false);
    vibrate(kind === 'got' ? [40] : [40, 60, 40]);
    after(FLASH_MS, () => {
      const rr = run.current;
      if (!rr || phaseRef.current !== 'word') return;
      rr.wordAt = Date.now();
      const head = headOf(ref.current.state);
      shownRef.current = head;
      setShown(head);
      setFlash(null);
      // WAI-010: no word left that this turn has not shown, so time is up at once.
      if (head === null) timeUp();
    });
  };

  const timeUp = () => {
    const r = run.current;
    if (!r || phaseRef.current !== 'word') return;
    const inFlash = Date.now() < r.flashUntil;
    const word = inFlash ? null : shownRef.current;
    clearTimers();
    setPhase('idle');
    playSound('timeUp', ref.current.state.choices?.sounds !== false);
    vibrate([400]);
    ref.current.setUi({ wordShowing: false, msLeft: 0 });
    ref.current.act(word ? { type: 'timeUp', word } : { type: 'timeUp' });
  };

  /** Pause, the phone's Back or the app hidden during T2 or T3 (WAI-040). */
  const pauseNow = () => {
    const r = run.current;
    const ph = phaseRef.current;
    if (!r || (ph !== 'count' && ph !== 'word')) return;
    const now = Date.now();
    const msLeft = ph === 'count' ? r.msLeft : Math.max(0, r.T - elapsed());
    const word = ph === 'word' && now >= r.flashUntil ? shownRef.current ?? undefined : undefined;
    clearTimers();
    setPhase('idle');
    letScreenSleep();
    ref.current.pauseTurn(word, msLeft);
  };

  // A reload during T2 or T3 before the turn's first move: the turn comes back on the Paused cover (WAI-091).
  useEffect(() => {
    if (!init.reload) return;
    const cur = ref.current;
    const head = cur.ui.wordShowing ? headOf(cur.state) : null;
    const msLeft = cur.ui.msLeft ?? (cur.state.choices?.time ?? 60) * 1000;
    cur.pauseTurn(head ?? undefined, msLeft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // "Carry on playing" from a paused turn: the countdown again, then a new word with the time left.
  useEffect(() => {
    if (init.phase === 'count') beginCountdown(ref.current.ui.msLeft ?? (ref.current.state.choices?.time ?? 60) * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = phase === 'count' || phase === 'word';
  useWaiBack(running, 1, pauseNow);
  useWaiBack(phase === 't0', 1, () => setPhase('t1'));
  useEffect(() => {
    if (!running) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden') pauseNow();
    };
    const onHide = () => {
      const r = run.current;
      if (r && phaseRef.current === 'word') ref.current.setUi({ msLeft: Math.max(0, r.T - elapsed()) });
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // ---- Orientation (WAI-013, WAI-016, WAI-021, WAI-024) ----
  useEffect(() => {
    if (!running) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      const r = run.current;
      if (!r || e.beta === null || e.gamma === null) return;
      const t = Date.now();
      const ph = phaseRef.current;
      // Rotation lock: the page draws the turn sideways while the screen says portrait.
      const rot = rotationEvent(r.rotation, e.gamma, portraitType(), t);
      if (rot.turned !== r.rotation.turned) {
        setTurned(rot.turned ? (e.gamma >= 0 ? 1 : -1) : false);
        if (rot.turned) noteRotation(ref.current.prefs, gameKey(ref.current.live.saved.id, ref.current.state.game));
      }
      r.rotation = rot;
      if (!r.motion) return;
      const theta = pitch(e.beta, e.gamma);
      if (ph === 'count') {
        if (t - r.t2 <= 1000) r.sawEarly = true;
        r.samples.push({ t: t - r.t2, theta });
        return;
      }
      if (ph !== 'word' || !r.sawEarly) return;
      if (r.marking.theta0 === null) {
        const found = steadyReference(r.steady, { t, theta });
        r.steady = found.kept;
        if (found.theta0 !== null) r.marking = startMotion(found.theta0);
        return;
      }
      const blockedUntil = Math.max(r.wordAt, r.flashUntil) + GUARD_MS;
      const out = motionEvent(r.marking, { t, theta }, blockedUntil);
      r.marking = out.motion;
      if (out.mark) mark(out.mark);
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // ---- T1's start, T0 ----
  const startTurn = () => {
    const cur = ref.current;
    const st = cur.state;
    clearSavedToast();
    const hold = holdFor(st);
    wakeAudio();
    if (asksFirst(cur.prefs, hold)) {
      setPhase('t0');
      return;
    }
    if (motionReady(cur.prefs, hold)) askAgainSilently(cur.prefs);
    beginCountdown((st.choices?.time ?? 60) * 1000);
  };
  const yesMotion = () => {
    wakeAudio();
    const asked = askMotion(ref.current.prefs);
    void asked.then((ok) => {
      if (!ok) ref.current.toast('Tap bottom: Got it · Tap top: Pass');
      if (phaseRef.current === 't0') beginCountdown((ref.current.state.choices?.time ?? 60) * 1000);
    });
  };
  const useTaps = () => {
    const prefs = ref.current.prefs;
    setMotionState(prefs, 'taps');
    prefs.set('whatAmI.motion', false);
    beginCountdown((ref.current.state.choices?.time ?? 60) * 1000);
  };

  // ---- Taps on T3 (Version 1.1 item 13): the marking areas on the screen as displayed ----
  const onTap = (e: ReactMouseEvent) => {
    if (phaseRef.current !== 'word') return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    let x = e.clientX;
    let y = e.clientY;
    let w = W;
    let h = H;
    if (turned) {
      // The frame is turned 90° about the centre: back to its own (sideways) coordinates.
      const dx = x - W / 2;
      const dy = y - H / 2;
      w = H;
      h = W;
      if (turned === 1) {
        x = dy + w / 2;
        y = -dx + h / 2;
      } else {
        x = -dy + w / 2;
        y = dx + h / 2;
      }
    }
    const area = tapArea(x, y, w, h);
    if (area) mark(area);
  };

  // ---------------------------------------------------------------- Render
  if (phase === 'idle') return <div className="wai-turn-blank" />;

  if (phase === 't0') return <MotionQuestion onYes={yesMotion} onTaps={useTaps} />;

  if (phase === 'count' || phase === 'word') {
    const hold = holdFor(s);
    const r = run.current;
    const T = r?.T ?? (s.choices?.time ?? 60) * 1000;
    const id = phase === 'word' ? shown : null;
    return (
      <RoomFrame turned={turned} onTap={onTap} onPause={pauseNow}>
        {phase === 'count' ? (
          <>
            <p className="wai-turn-line">{hold === 'free' ? `${player}, don't turn round!` : 'Put it on your forehead or chest!'}</p>
            <div className="wai-word-area">
              <p className="wai-countdown" data-testid="countdown">
                {count}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="wai-turn-line">
              {hold === 'free' ? 'Clue givers: tap bottom for Got it, top for Pass.' : "Everyone else: give clues. Don't say the word!"}
            </p>
            <div className="wai-word-area">
              {id !== null && <FitWord text={wordText(s, id)} turned={turned} />}
            </div>
            {id !== null && <p className="wai-pack">{packOf(s.words, id) ?? ''}</p>}
            <p className="wai-time" data-testid="time-left">
              {timeLeftText(T, elapsed())}
            </p>
          </>
        )}
        {flash && (
          <div className={flash === 'got' ? 'wai-flash wai-flash-got' : 'wai-flash wai-flash-pass'} data-testid="mark-flash">
            {flash === 'got' ? 'Got it!' : 'Pass'}
          </div>
        )}
        <p className="wai-sr" data-testid="mark-live" aria-live="assertive">
          {live}
        </p>
      </RoomFrame>
    );
  }

  // ---- T1 ----
  return (
    <PassScreen
      p={p}
      player={player}
      night={night}
      chooser={chooser}
      setChooser={setChooser}
      onStart={startTurn}
    />
  );
}

// ---------------------------------------------------------------- T1 (WAI-012, WAI-014, WAI-015, WAI-011)

function PassScreen({
  p,
  player,
  night,
  chooser,
  setChooser,
  onStart,
}: {
  p: StepProps;
  player: string;
  night: string;
  chooser: boolean;
  setChooser: (on: boolean) => void;
  onStart: () => void;
}) {
  const s = p.state;
  const hold = holdOf(s, player);
  const free = hold === 'free';
  const ownChoice = free && s.holds[player] === 'free' && s.choices?.hold === 'hand';
  const toPlay = toPlayOf(s);
  const k = s.played.length + 1;
  const n = s.played.length + toPlay.length;
  const game = gameKey(night, s.game);
  // The phone's part of the tip line is fixed when this T1 opens (it shows once per game).
  const key = turnKey(s);
  const phone = useRef<{ key: string; screenOn: boolean; rotation: boolean } | null>(null);
  if (!phone.current || phone.current.key !== key) {
    phone.current = { key, screenOn: screenTipDue(p.prefs, game), rotation: rotationEarlier(p.prefs, game) };
  }
  const tip = tipLine(s, {
    screenOn: phone.current.screenOn,
    firstTurnOfGame: s.saved.length === 0,
    rotationEarlier: phone.current.rotation,
    platform: platformOf(),
  });
  useEffect(() => {
    if (tip === 'Keep your screen on during the turn.') screenTipShown(p.prefs, game);
  }, [tip, game, p.prefs]);
  const motion = motionWanted(p.prefs, hold);
  const others = toPlay.filter((q) => q !== player);

  return (
    <Screen page className="wai-game wai-pass">
      <ScreenContent>
        <header className="wai-bar">
          <HomeButton onClick={p.onHome} />
          {p.top}
        </header>
        {p.welcome}
        <h1 className="pgn-title">{`${player}, you're guessing`}</h1>
        {free ? (
          <>
            <p className="wai-small">{`Stand the phone behind ${player}, facing the room. ${player}, don't turn round!`}</p>
            {ownChoice && <p className="wai-small">{`Hands-free (${player}'s choice)`}</p>}
            <div className="wai-drawings wai-pass-drawings">
              <Drawing kind="behind" alt="Phone standing behind a seated player, facing the room" />
            </div>
            <p className="wai-rule">One clue giver taps: bottom half Got it · top half Pass</p>
          </>
        ) : (
          <>
            <p className="wai-small">Hold the phone on your forehead or chest, screen facing the room.</p>
            <div className="wai-drawings wai-pass-drawings">
              <Drawing kind="forehead" alt="Phone held on the forehead, screen facing the room" />
              <Drawing kind="chest" alt="Phone held against the chest, screen facing the room" />
            </div>
            <p className="wai-rule">{motion ? 'Phone down: Got it · Phone up: Pass' : 'Tap bottom: Got it · Tap top: Pass'}</p>
          </>
        )}
        <p className="wai-small wai-score-line">{`Round ${s.round} · player ${k} of ${n}`}</p>
        {tip !== null && (
          <p className="wai-small wai-tip" data-testid="tip-line">
            {tip}
          </p>
        )}
        <div className="wai-pass-buttons">
          <QuietButton onClick={() => p.act({ type: 'setHold', player, hold: free ? 'hand' : 'free' })}>
            {free ? `${player} will hold it` : `Hands-free for ${player}`}
          </QuietButton>
          <QuietButton onClick={() => setChooser(true)}>Someone else goes first</QuietButton>
        </div>
      </ScreenContent>
      <Main guardKey={`${night}:${turnKey(s)}`} wait={START_GUARD_MS} onClick={onStart}>
        {free ? `Start ${player}'s turn` : `I'm ${player}: start`}
      </Main>
      {chooser && (
        <WhoGoesNow
          player={player}
          names={others}
          onPick={(name) => {
            setChooser(false);
            const order = s.order.filter((q) => q !== name);
            const at = order.indexOf(player);
            order.splice(at < 0 ? 0 : at, 0, name);
            p.act({ type: 'reorder', order });
          }}
          onKeep={() => setChooser(false)}
        />
      )}
    </Screen>
  );
}

/** WAI-015, Version 1.1 item 28: "Who goes now?" with only the names still to play this round, and "Keep Riya first". */
function WhoGoesNow({ player, names, onPick, onKeep }: { player: string; names: readonly string[]; onPick: (n: string) => void; onKeep: () => void }) {
  return (
    <WaiDialog title="Players" onDismiss={onKeep}>
      <p className="wai-body">Who goes now?</p>
      <div className="wai-dialog-buttons">
        {names.map((n) => (
          <QuietButton key={n} onClick={() => onPick(n)}>
            {n}
          </QuietButton>
        ))}
        <QuietButton onClick={onKeep}>{`Keep ${player} first`}</QuietButton>
      </div>
    </WaiDialog>
  );
}

// ---------------------------------------------------------------- T0 (WAI-013)

function MotionQuestion({ onYes, onTaps }: { onYes: () => void; onTaps: () => void }) {
  return (
    <Screen page className="wai-game wai-motion">
      <ScreenContent>
        <h1 className="pgn-title">Answer by moving the phone?</h1>
        <MotionDrawing />
        <p className="wai-body">Move the phone down for Got it, up for Pass. Your phone will ask once. You can change this in Settings.</p>
        <div className="wai-pass-buttons">
          <QuietButton onClick={onTaps}>Use taps instead</QuietButton>
        </div>
      </ScreenContent>
      <Main guardKey="t0" onClick={onYes}>
        Yes, move the phone
      </Main>
    </Screen>
  );
}

function MotionDrawing() {
  return (
    <svg className="wai-drawing wai-motion-drawing" viewBox="0 0 100 90" aria-hidden="true">
      <rect x="38" y="24" width="24" height="40" rx="4" className="wai-drawing-phone" />
      <path d="M20 30 L20 10 M14 16 L20 10 L26 16" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M80 58 L80 80 M74 74 L80 80 L86 74" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

// ---------------------------------------------------------------- T2 and T3's frame (room-facing)

/** The whole screen, turned 90° when the phone is held sideways under a rotation lock (WAI-024). Pause 48 × 48, 16 px in. */
function RoomFrame({ turned, onTap, onPause, children }: { turned: false | 1 | -1; onTap: (e: ReactMouseEvent) => void; onPause: () => void; children: ReactNode }) {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const style = turned
    ? {
        width: `${size.h}px`, height: `${size.w}px`, left: `${(size.w - size.h) / 2}px`, top: `${(size.h - size.w) / 2}px`,
        transform: `rotate(${turned === 1 ? 90 : -90}deg)`,
      }
    : { width: `${size.w}px`, height: `${size.h}px`, left: '0px', top: '0px' };
  const landscape = turned ? size.h > size.w : size.w > size.h;
  return (
    <main className="wai-room" onClick={onTap}>
      <div className={landscape ? 'wai-room-frame wai-room-wide' : 'wai-room-frame'} style={style}>
        {children}
        <button
          type="button"
          className="wai-room-pause"
          aria-label="Pause"
          onClick={(e) => {
            e.stopPropagation();
            onPause();
          }}
        >
          <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
            <rect x="1" y="1" width="4" height="14" rx="1" fill="currentColor" />
            <rect x="9" y="1" width="4" height="14" rx="1" fill="currentColor" />
          </svg>
          <span>Pause</span>
        </button>
      </div>
    </main>
  );
}

/** WAI-020, Version 1.1 item 23: the largest size from 96 px down to 40 px (2 px steps) at which the word fits in 2 lines. */
function FitWord({ text, turned }: { text: string; turned: false | 1 | -1 }) {
  const el = useRef<HTMLHeadingElement>(null);
  const [fit, setFit] = useState<{ size: number; anywhere: boolean }>({ size: 96, anywhere: false });
  useLayoutEffect(() => {
    const h = el.current;
    const box = h?.parentElement;
    if (!h || !box) return;
    const measure = () => {
      const room = box.clientHeight;
      for (let size = 96; size >= 40; size -= 2) {
        h.style.fontSize = `${size}px`;
        h.style.overflowWrap = 'normal';
        const lh = size * 1.1;
        const lines = Math.round(h.offsetHeight / lh);
        if (lines <= 2 && h.scrollWidth <= h.clientWidth + 1 && (h.offsetHeight <= room || size === 40)) {
          setFit({ size, anywhere: false });
          return;
        }
      }
      setFit({ size: 40, anywhere: true });
    };
    measure();
    const on = () => measure();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [text, turned]);
  return (
    <h1
      ref={el}
      className="wai-the-word"
      data-testid="the-word"
      style={{ fontSize: `${fit.size}px`, overflowWrap: fit.anywhere ? 'anywhere' : 'normal' }}
    >
      {text}
    </h1>
  );
}

// ---------------------------------------------------------------- T4 (WAI-030, WAI-031; Version 1.3 item 3)

/** "Riya: 9 in all · Top: Arjun 14" / "Riya: 14 in all · Top so far" / "Top: Arjun and Meena 12". */
export function totalsLine(s: WaiState, player: string, got: number): string {
  const mine = (s.scores[player]?.score ?? 0) + got;
  const others = s.order.filter((q) => q !== player);
  const top = Math.max(0, ...others.map((q) => s.scores[q]?.score ?? 0));
  if (others.length === 0 || mine >= top) return `${player}: ${mine} in all · Top so far`;
  const leaders = others.filter((q) => (s.scores[q]?.score ?? 0) === top);
  return `${player}: ${mine} in all · Top: ${joinNames(leaders)} ${top}`;
}

export function TurnEnd(p: StepProps) {
  const s = p.state;
  const t = s.turn;
  const player = t?.player ?? p.view.player ?? '';
  const night = p.live.saved.id;
  // WAI-023, WAI-025: the screen may sleep once T4 shows.
  useEffect(() => {
    letScreenSleep();
  }, []);
  if (!t) return null;
  const got = t.got.length;
  const toPlay = toPlayOf(s);
  const next = toPlay.find((q) => q !== player);
  const chip = (id: string) => {
    const moved = t.moved.includes(id);
    const label = `${wordText(s, id)}${moved ? ' ↺' : ''}`;
    return (
      <li key={id}>
        <button type="button" className={moved ? 'wai-chip wai-chip-moved' : 'wai-chip'} aria-label={label} onClick={() => p.act({ type: 'fix', word: id })}>
          {label}
        </button>
      </li>
    );
  };
  const list = (title: 'Got it' | 'Passed', ids: readonly string[], cls: string) => (
    <section className={`wai-list wai-list-${cls}`} aria-labelledby={`wai-list-${cls}`}>
      <h2 id={`wai-list-${cls}`} className="wai-h2">
        {title}
      </h2>
      {ids.length === 0 ? <p className="wai-small">None</p> : <ul className="wai-chips">{ids.map(chip)}</ul>}
    </section>
  );
  return (
    <Screen className="wai-game wai-review">
      <header className="wai-bar">
        <HomeButton onClick={p.onHome} />
        {p.top}
      </header>
      {p.welcome}
      <h1 className="pgn-title">{`${t.endedEarly ? 'Turn ended early.' : "Time's up!"} ${player} got ${got}`}</h1>
      <p className="wai-small">{totalsLine(s, player, got)}</p>
      <div className="pgn-scroll wai-turn-lists" data-testid="turn-lists">
        {list('Got it', t.got, 'got')}
        {list('Passed', t.passed, 'passed')}
      </div>
      <p className="wai-small">Marked wrong? Tap a word to move it.</p>
      <p className="wai-small">{next ? `Next: ${next}` : 'Next: round over'}</p>
      <Main
        guardKey={`${night}:${s.game}:${s.saved.length}:review`}
        onClick={() => {
          if (p.act({ type: 'scoreTurn' })) showSavedToast(night);
        }}
      >
        Save score
      </Main>
    </Screen>
  );
}

// ---------------------------------------------------------------- "Riya: 5 saved · Undo" (WAI-031, Version 1.1 item 26)

/**
 * Shown by the frame on T1 and R1 while the last "Save score" made on this page can still be undone (no other move
 * since, pauses aside). Hidden while the Paused cover, a dialog or a sheet is open; gone after "Round 2" (R1 to T1).
 */
export function SavedToast({ p, screen, hidden }: { p: StepProps; screen: WaiScreen; hidden: boolean }) {
  const s = p.state;
  const night = p.live.saved.id;
  const [, bump] = useState(0);
  useEffect(() => onSavedToast(() => bump((n) => n + 1)), []);
  const prev = useRef<WaiScreen>(screen);
  useEffect(() => {
    if (prev.current === 'R1' && screen === 'T1') clearSavedToast();
    prev.current = screen;
  }, [screen]);
  const last = s.saved[s.saved.length - 1];
  const on =
    savedToastFor() === night && s.undo !== null && !s.paused && s.step === 'pass' && !s.turn && last !== undefined &&
    (screen === 'R1' || (screen === 'T1' && prev.current !== 'R1'));
  if (!on || hidden) return null;
  return (
    <ToastHost>
      <Toast
        toast={{ id: s.saved.length, text: `${last.player}: ${last.got} saved · Undo`, undo: () => p.act({ type: 'undoScore' }) }}
        onDone={() => clearSavedToast()}
      />
    </ToastHost>
  );
}
