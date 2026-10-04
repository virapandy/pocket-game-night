// Talk, the countdown and "Who got the most fingers?" (IMP-023, IMP-024, IMP-027, IMP-030, IMP-031, IMP-032).
// Nothing here moves on by itself except the countdown a tap started (guideline 48).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Preferences } from '../../../engine';
import { playSound, speak } from './device';
import { MainButton, OptionButton, QuietButton } from './parts';

const TIMER_MS = 120_000;

const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** IMP-023: Free flow. Nothing on this screen changes by itself. */
export function FreeTalk({ onVote, onSeeAgain }: { onVote: () => void; onSeeAgain: () => void }) {
  return (
    <>
      <section className="imp-stage imp-center">
        <h1 className="imp-talk-heading" data-testid="talk-heading">
          Talk it over
        </h1>
        <p className="imp-body">Who sounded unsure?</p>
        {/* IMP-017 (M19): visible, not only in the menu. */}
        <QuietButton onClick={onSeeAgain}>See my word again</QuietButton>
      </section>
      <MainButton onClick={onVote}>Vote now</MainButton>
    </>
  );
}

/**
 * IMP-024, IMP-027 (F10): the 2-minute timer, with the label "Talk it over" above it and, at 0:00, "Time's up!" and
 * "1 more minute". Starts running only when the host just tapped "Clues done, start timer";
 * otherwise (reopened, back from "See my word again") it shows paused at its kept value. It pauses when the page is
 * hidden, never catches up, and only "Carry on" resumes it. The remaining time is kept at every change.
 */
export function TimerTalk({
  initialMs,
  autoStart,
  onVote,
  onSeeAgain,
  hold,
  keep,
  announce,
  prefs,
}: {
  initialMs: number;
  autoStart: boolean;
  onVote: () => void;
  /** IMP-017 (M19): the quiet "See my word again" opens "Whose word?". */
  onSeeAgain: () => void;
  /** IMP-017, IMP-027: "Whose word?" is open: the timer pauses at once and stays paused until "Carry on". */
  hold: boolean;
  keep: (ms: number) => void;
  announce: (text: string) => void;
  prefs: Preferences;
}) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.min(TIMER_MS, initialMs)));
  const [running, setRunning] = useState(() => autoStart && initialMs > 0);
  const endAt = useRef(0);
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + remainingRef.current;
    let t: ReturnType<typeof setTimeout>;
    const schedule = (left: number) => {
      t = setTimeout(tick, left % 1000 || 1000);
    };
    const tick = () => {
      const left = Math.max(0, endAt.current - Date.now());
      setRemaining(left);
      if (left <= 0) setRunning(false);
      else schedule(left);
    };
    schedule(remainingRef.current);
    return () => clearTimeout(t);
  }, [running]);

  const pause = () => {
    if (!running) return;
    const left = Math.max(0, endAt.current - Date.now());
    setRemaining(left);
    setRunning(false);
  };
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useEffect(() => {
    if (hold) pauseRef.current();
  }, [hold]);

  // IMP-027: the page hidden pauses it, exactly like "Pause".
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && pauseRef.current();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  useEffect(() => keep(remaining), [keep, remaining]);
  // Leaving the screen while it runs ("See my word again", "End now"): kept to the millisecond, shown paused on return.
  const runningRef = useRef(running);
  runningRef.current = running;
  const keepRef = useRef(keep);
  keepRef.current = keep;
  useEffect(
    () => () => {
      if (runningRef.current) keepRef.current(Math.max(0, endAt.current - Date.now()));
    },
    [],
  );

  // "1 minute left" and, at 0:00, the chime and "Time's up" (only when the timer got there, not on a reopen).
  const secs = Math.ceil(remaining / 1000);
  const prev = useRef(secs);
  useEffect(() => {
    const was = prev.current;
    prev.current = secs;
    if (was === secs) return;
    if (secs === 60 && was > 60) announce('1 minute left');
    if (secs === 0 && was > 0) {
      playSound('chime', prefs);
      announce("Time's up");
    }
  }, [secs, announce, prefs]);

  const up = remaining <= 0;
  // F10: "1 more minute" gives the room another minute (nothing recorded; no limit).
  const oneMore = () => {
    setRemaining(60_000);
    setRunning(true);
  };
  return (
    <>
      <section className="imp-stage imp-center imp-talk-timer">
        <div className="imp-timer-side">
          <p className="imp-timer-label" data-testid="timer-label">
            Talk it over
          </p>
          <p className="imp-timer" data-testid="timer">
            {mmss(remaining)}
          </p>
          {up && <h1 className="imp-times-up">Time's up!</h1>}
          {!up && !running && <p className="imp-small">Paused · Tap to carry on</p>}
        </div>
        <div className="imp-timer-buttons">
          {up ? (
            <QuietButton onClick={oneMore}>1 more minute</QuietButton>
          ) : (
            <QuietButton onClick={running ? pause : () => setRunning(true)}>{running ? 'Pause' : 'Carry on'}</QuietButton>
          )}
          <QuietButton onClick={onSeeAgain}>See my word again</QuietButton>
        </div>
      </section>
      <MainButton onClick={onVote}>{up ? 'Get ready to point' : 'Vote now'}</MainButton>
    </>
  );
}

/**
 * IMP-030: "Get ready to point…", then 3, 2, 1, "Point!", and the picker by itself at 6 s. No menu, no main button.
 * Remounted (a new key) to start again, as after a return from hidden.
 */
export function Countdown({ onDone, announce, prefs }: { onDone: () => void; announce: (t: string) => void; prefs: Preferences }) {
  const [shown, setShown] = useState<string | null>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const steps: [number, string, 'tick' | 'ding'][] = [
      [1000, '3', 'tick'],
      [2000, '2', 'tick'],
      [3000, '1', 'tick'],
      [4000, 'Point!', 'ding'],
    ];
    const timers = steps.map(([at, text, sound]) =>
      setTimeout(() => {
        setShown(text);
        playSound(sound, prefs);
        speak(text, prefs);
        announce(text);
      }, at),
    );
    timers.push(setTimeout(() => done.current(), 6000));
    return () => timers.forEach(clearTimeout);
  }, [announce, prefs]);
  return (
    <section className="imp-stage imp-center imp-countdown">
      <h1 className="imp-countdown-heading" data-testid="countdown-heading">
        Get ready to point…
      </h1>
      {shown !== null && (
        <p key={shown} className={shown === 'Point!' ? 'imp-count imp-count-point' : 'imp-count'} data-testid="countdown-number">
          {shown}
        </p>
      )}
    </section>
  );
}

/** Text button (Terms): no outline and no fill, body text, at least 48 px tall and 44 px wide. */
function TextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="imp-text-button" onClick={onClick}>
      {children}
    </button>
  );
}

/** "Point again: Arjun or Meena", "Point again: Arjun, Meena or Kabir" (IMP-032). */
const orList = (names: readonly string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;

/**
 * IMP-031, IMP-032: one button per name (two columns); pick one, then "Reveal <Name>". The first vote also has
 * "It's a tie" (tick 2 or more, then "Point again: …"); the re-vote has "Still a tie". "Count again" runs the
 * countdown again (the picker is remounted after it, so nothing stays selected).
 */
export function Picker({
  names,
  revote,
  onReveal,
  onTie,
  onStillTie,
  onCountAgain,
}: {
  names: readonly string[];
  revote: boolean;
  onReveal: (name: string) => void;
  onTie: (names: string[]) => void;
  onStillTie: () => void;
  onCountAgain: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [tieMode, setTieMode] = useState(false);
  const [ticked, setTicked] = useState<string[]>([]);
  const inSeatOrder = names.filter((n) => ticked.includes(n));
  let main;
  if (tieMode) {
    main = (
      <MainButton disabled={inSeatOrder.length < 2} onClick={() => inSeatOrder.length >= 2 && onTie(inSeatOrder)}>
        {inSeatOrder.length < 2 ? 'Point again' : `Point again: ${orList(inSeatOrder)}`}
      </MainButton>
    );
  } else {
    main = (
      <MainButton disabled={picked === null} onClick={() => picked !== null && onReveal(picked)}>
        {picked === null ? 'Reveal' : `Reveal ${picked}`}
      </MainButton>
    );
  }
  return (
    <>
      <section className="imp-stage imp-picker">
        <div className="imp-pick-names">
          <h1 className="imp-title">Who got the most fingers?</h1>
          <div className="imp-pick-list">
          {names.map((n) => (
            <OptionButton
              key={n}
              selected={tieMode ? ticked.includes(n) : picked === n}
              onClick={() => {
                if (tieMode) setTicked(ticked.includes(n) ? ticked.filter((x) => x !== n) : [...ticked, n]);
                else setPicked(n);
              }}
            >
              {n}
            </OptionButton>
          ))}
          </div>
        </div>
        {/* F8: 24 px below the names, "Not sure?" and two text buttons side by side, so they never look like names. */}
        <div className="imp-pick-unsure">
          <p className="imp-body">Not sure?</p>
          <div className="imp-pick-quiet">
            {!revote && !tieMode && (
              <TextButton
                onClick={() => {
                  setTieMode(true);
                  setPicked(null);
                  setTicked([]);
                }}
              >
                It's a tie
              </TextButton>
            )}
            {revote && <TextButton onClick={onStillTie}>Still a tie</TextButton>}
            <TextButton onClick={onCountAgain}>Count again</TextButton>
          </div>
        </div>
      </section>
      {main}
    </>
  );
}
