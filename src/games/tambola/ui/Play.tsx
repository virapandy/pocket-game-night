// The host phone during a game, on one screen that never scrolls (docs/games/tambola/ux-calling-screen.md,
// TAM-123 to TAM-129, TAM-138): a top bar with Back, the progress and a menu; the number, large; its rhyme;
// the last calls; prize chips; then "Record a win" and "Next number" at the bottom. Paper-ticket wins are
// recorded on the anchor's word (TAM-037); tiers are closed by hand (TAM-145). The board, Show the room,
// Check numbers (TAM-139), Settings, End game and Discard game live in the menu (TAM-124, TAM-127).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HOST, play, undo, type MoveRecord, type Preferences, type ReportSubject, type SavedGameStore } from '../../../engine';
import {
  checkNumbers,
  decodeClaim,
  gameCode,
  NEEDS,
  PATTERN_NAMES,
  readClaim,
  tambolaRules,
  type CheckResult,
  type Pattern,
  type Rhyme,
  type TambolaMove,
  type TambolaSettings,
  type TambolaView,
  type Tier,
} from '../rules';
import { buzz, freshSeed, keepAwake, tick } from './device';
import { plural, rupees } from './format';
import { HandOut } from './HandOut';
import { startScanner, type CameraFailure } from './scanner';
import { TicketGrid } from './TicketGrid';
import { toSaved, type TambolaMatch, type TambolaSaved } from './saved';
import { loadSettings, saveSettings, SettingsPanel } from './Settings';
import { Summary } from './Summary';
import { isDark, setDark } from './theme';
import { hasVoice, hush, speakCall } from './voice';

const CALL_UNDO_MS = 5_000;
/** TAM-101: two taps within half a second call one number. */
const NEXT_COOLDOWN_MS = 500;
/** A press on the number this long opens Show the room (TAM-124). */
const LONG_PRESS_MS = 600;
/** TAM-128: the screen-sleep tip is shown once per phone. */
const SLEEP_TIP_KEY = 'tambola.sleep-tip.seen';
/** TAM-186: 5 to 30 seconds between auto-calls, in 5-second steps, 10 by default. */
const AUTO_CALL_CHOICES = [5, 10, 15, 20, 25, 30];
const AUTO_CALL_DEFAULT = 10;
/** TAM-187: how long the "voice isn't working" note stays on screen (shown once per game). */
const VOICE_NOTE_MS = 8_000;

/** Short names for the prize chips (TAM-126). */
const CHIP_NAMES: Readonly<Record<Pattern, string>> = {
  'early-five': 'Early 5',
  'four-corners': 'Corners',
  'top-line': 'Top',
  'middle-line': 'Middle',
  'bottom-line': 'Bottom',
  'full-house': 'House',
  'second-full-house': '2nd House',
};

/** Milliseconds since the last call, from a clock that never jumps; a clock change counts as "long ago". */
function sinceLastCall(at: number | null): number {
  if (at === null) return Infinity;
  const d = performance.now() - at;
  return d < 0 ? Infinity : d;
}

type RecordSheet =
  | { step: 'pattern' }
  | {
      step: 'players';
      pattern: Pattern;
      picked: string[];
      adding: boolean;
      /** UX list row 6 (TAM-145): adding a winner in a phone-ticket game offers only the paper players by name. */
      paperOnly?: boolean;
      error?: string;
    };

type Sheet =
  | { kind: 'menu' }
  | { kind: 'record'; sheet: RecordSheet }
  | { kind: 'check'; pattern?: Pattern; text: string; result?: CheckResult }
  | { kind: 'board' }
  | { kind: 'late'; name: string; tickets: string; error?: string }
  /** Phase 2: "Scan a claim" (TAM-177, TAM-178). */
  | { kind: 'scan' }
  /** Phase 2: the host's list of every ticket (TAM-056, TAM-058, TAM-175). */
  | { kind: 'tickets' };

/** Phase 2: tickets being handed out (TAM-132, TAM-172, TAM-212). */
interface HandOutState {
  readonly queue: readonly number[];
  readonly index: number;
  readonly late: boolean;
}

type Dialog =
  | { kind: 'end' }
  | { kind: 'discard' }
  | { kind: 'undo-record'; seq: number }
  | { kind: 'prizes'; tiers: readonly Tier[] };

/** Shortcuts that warn the host once per game before turning on (TAM-061, TAM-062). */
type Shortcut = 'voice' | 'auto';
const WARNINGS: Readonly<Record<Shortcut, { title: string; text: string }>> = {
  voice: {
    title: 'Let the phone speak the calls?',
    text: "The anchor calling each number aloud is part of the fun. The phone's voice is here if the anchor needs a rest.",
  },
  auto: {
    title: 'Call numbers automatically?',
    text: 'The phone will call a number on a timer and say it aloud, without waiting for anyone. It pauses for every win.',
  },
};

type TambolaRecord = MoveRecord<TambolaMove>;
const isRecording = (r: TambolaRecord) => r.move.type === 'record-win' || r.move.type === 'record-bogey' || r.move.type === 'check-claim';

/** How many claims each move adds, so a record's claim can be found in the view. */
function claimsAdded(m: TambolaMove): number {
  if (m.type === 'record-win') return m.playerIds.length;
  return m.type === 'record-bogey' || m.type === 'claim' || m.type === 'check-claim' ? 1 : 0;
}

export function Play({
  initialSaved,
  initialMatch,
  store,
  prefs,
  resumed,
  startDialog,
  onHome,
  onPlayAgain,
  onSessionTally,
  onReport,
}: {
  initialSaved: TambolaSaved;
  initialMatch: TambolaMatch;
  store: SavedGameStore;
  prefs: Preferences;
  resumed: boolean;
  startDialog?: 'end' | 'discard';
  onHome: () => void;
  onPlayAgain: (saved: TambolaSaved) => void;
  /** TAM-197: from the payouts to the tally of the session this game is in. */
  onSessionTally?: (sessionId: string) => void;
  /** Phase 7: "Report a problem" about this game (PLT-200); in the menu, never in the thumb zone. */
  onReport?: (subject: ReportSubject) => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [match, setMatch] = useState(initialMatch);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(startDialog ? { kind: startDialog } : null);
  /** The recorded win or bogey shown on screen, by its move's number. */
  const [resultSeq, setResultSeq] = useState<number | null>(null);
  /** UX list row 24: how the claim on screen was checked: its QR against this phone's copy, or by number. Display only. */
  const [resultProof, setResultProof] = useState<ClaimProof | null>(null);
  /** The call the undo toast is for (TAM-125). */
  const [toastSeq, setToastSeq] = useState<number | null>(null);
  const [room, setRoom] = useState<false | 'menu' | 'press'>(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [device, setDevice] = useState<TambolaSettings>(() => loadSettings(prefs));
  const [cooldown, setCooldown] = useState(false);
  const [wakeRefused, setWakeRefused] = useState(false);
  const [tipSeen, setTipSeen] = useState(() => prefs.get<boolean>(SLEEP_TIP_KEY, false) === true);
  const [showResumed, setShowResumed] = useState(resumed);
  const [flash, setFlash] = useState(0);
  const [, setNow] = useState(0);
  const lastCallAt = useRef<number | null>(null);
  const mainRef = useRef<HTMLButtonElement | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Phase 1b, per game and off in every new one: the phone's voice and auto-call (TAM-060, TAM-120, TAM-180).
  const [voiceOn, setVoiceOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [autoOn, setAutoOn] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [autoSecs, setAutoSecs] = useState(AUTO_CALL_DEFAULT);
  const [warned, setWarned] = useState<Readonly<Record<Shortcut, boolean>>>({ voice: false, auto: false });
  const [asking, setAsking] = useState<Shortcut | null>(null);
  const [voiceNote, setVoiceNote] = useState(false);
  const voiceNoted = useRef(false);
  const autoSecsRef = useRef(autoSecs);
  autoSecsRef.current = autoSecs;
  const autoCallRef = useRef<() => void>(() => {});
  const [autoRetry, setAutoRetry] = useState(0);
  const [dark, setDarkState] = useState(() => isDark(prefs));
  const canSpeak = hasVoice();
  const phone = initialMatch.setup.config.ticketMode === 'phone';
  // Phase 2: before the first number, the host hands out every phone ticket (TAM-132, TAM-172).
  const [handOut, setHandOut] = useState<HandOutState | null>(() => {
    if (!phone || initialMatch.state.result || initialMatch.state.calledCount > 0) return null;
    const queue = initialMatch.state.tickets.filter((t) => t.status === 'in-play').map((t) => t.number);
    return queue.length > 0 ? { queue, index: 0, late: false } : null;
  });
  /** UX list row 8 (TAM-058): "Kabir plays on paper · Undo", until the first number is called. */
  const [paperUndo, setPaperUndo] = useState<{ seq: number; name: string; skipped: readonly number[] } | null>(null);

  const view = tambolaRules.view(match.state, { kind: 'host' });
  const over = view.over;
  const money = match.setup.config.money !== null;
  // The number "pops" only when it is newly called or repeated, never when the host comes back from
  // Settings or the room view (TAM-134): leaving this screen marks the current number as already shown.
  const popKey = `${flash}:${view.called.length}`;
  const quietKey = useRef(popKey);
  // Turning the phone rebuilds the layout (UX list row 11); the number must not pop again just for that.
  const landscape = useLandscape();
  const lastLandscape = useRef(landscape);
  if (lastLandscape.current !== landscape) {
    lastLandscape.current = landscape;
    quietKey.current = popKey;
  }
  useEffect(() => {
    if (settingsOpen || room) quietKey.current = popKey;
  }, [settingsOpen, room, popKey]);

  const commit = (next: TambolaMatch) => {
    const s = toSaved(saved, next, Date.now());
    store.put(s);
    setSaved(s);
    setMatch(next);
  };
  const move = (m: TambolaMove) => {
    const last = match.records[match.records.length - 1];
    const at = Math.max(Date.now(), last?.at ?? 0);
    const r = play(tambolaRules, match, m, { by: HOST, at });
    if (r.ok) commit(r.value);
    return r;
  };
  const undoRecord = (seq: number) => {
    const r = undo(tambolaRules, match, seq, { by: HOST, now: Date.now() });
    if (r.ok) commit(r.value);
    return r.ok;
  };
  const feel = () => {
    if (device.vibrate) buzz();
    if (device.sound) tick();
  };

  // TAM-110: keep the screen awake during the game, and ask again on return to the front.
  useEffect(() => (over ? undefined : keepAwake(setWakeRefused)), [over]);

  // TAM-180, TAM-187: the phone speaks the call when the voice or auto-call is on; a failure never stops the game.
  const speaking = canSpeak && (voiceOn || autoOn) && !muted;
  const onVoiceFail = () => {
    if (voiceNoted.current) return;
    voiceNoted.current = true;
    setVoiceNote(true);
  };
  const say = (n: number, rhyme: Rhyme | null) => {
    if (speaking) speakCall(n, rhyme, onVoiceFail);
  };
  useEffect(() => {
    if (!voiceNote) return;
    const t = setTimeout(() => setVoiceNote(false), VOICE_NOTE_MS);
    return () => clearTimeout(t);
  }, [voiceNote]);
  useEffect(() => () => hush(), []);

  // TAM-120: going to the background pauses auto-call; "Paused: tap to resume" shows on return.
  useEffect(() => {
    if (!autoOn) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setAutoPaused(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [autoOn]);

  // TAM-120, TAM-186: while running, the next number comes after the chosen time, counted from the last call
  // or from resuming. A new time applies from the next call.
  const calledNow = view.called.length;
  const autoCanCall = tambolaRules.legalMoves(match.state, HOST).some((m) => m.type === 'call');
  const autoRunning = autoOn && !autoPaused && !over && autoCanCall;
  useEffect(() => {
    if (!autoRunning) return;
    const t = setTimeout(() => autoCallRef.current(), autoSecsRef.current * 1000);
    return () => clearTimeout(t);
  }, [autoRunning, calledNow, autoRetry]);

  useEffect(() => {
    if (!showResumed) return;
    const t = setTimeout(() => setShowResumed(false), 4_000);
    return () => clearTimeout(t);
  }, [showResumed]);

  // TAM-119, TAM-125: the undo toast shows for 5 seconds after a call, if nothing else happened since.
  const lastRecord = match.records[match.records.length - 1];
  const toastLeft =
    !over && lastRecord && lastRecord.move.type === 'call' && lastRecord.seq === toastSeq ? lastRecord.at + CALL_UNDO_MS - Date.now() : -1;
  useEffect(() => {
    if (toastLeft < 0) return;
    const t = setTimeout(() => setNow(Date.now()), Math.min(1_000, toastLeft + 50));
    return () => clearTimeout(t);
  });

  // TAM-101: the button comes back once the new number is on screen and the double-tap window has passed.
  // Both a timer and the next animation frames check, so a slow or throttled timer cannot keep it disabled.
  useEffect(() => {
    if (!cooldown) return;
    let frame = 0;
    const release = () => {
      if (sinceLastCall(lastCallAt.current) >= NEXT_COOLDOWN_MS) {
        setCooldown(false);
        return true;
      }
      return false;
    };
    const onFrame = () => {
      if (!release()) frame = requestAnimationFrame(onFrame);
    };
    frame = requestAnimationFrame(onFrame);
    const timer = setTimeout(release, NEXT_COOLDOWN_MS + 20);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [cooldown]);

  useEffect(
    () => () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    },
    [],
  );

  if (over) {
    return (
      // TAM-181, TAM-197: the payouts scroll; "Play again" and "Session tally" stay fixed at the bottom.
      <main className="screen setup-screen over-screen">
        <header className="top-bar">
          <button type="button" className="button button-quiet" onClick={onHome}>
            ← Home
          </button>
          {onReport && (
            <button type="button" className="button button-quiet push-right" onClick={() => onReport({ kind: 'game', gameId: saved.id })}>
              Report a problem
            </button>
          )}
        </header>
        <div className="setup-body">
          <GameOver discarded={view.summary?.result === 'discarded'} phone={phone} money={money} />
          <Summary view={view} />
        </div>
        <div className="bottom-action bottom-actions">
          {saved.sessionId !== undefined && onSessionTally && (
            <button type="button" className="button button-quiet button-big" onClick={() => onSessionTally(saved.sessionId!)}>
              Session tally
            </button>
          )}
          {/* PLT-301, TAM-197 (owner 2026-10-01): "Play again" is outlined, not the main look. */}
          <button type="button" className="button button-quiet button-big" onClick={() => onPlayAgain(saved)}>
            Play again
          </button>
        </div>
      </main>
    );
  }

  const nameOf = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;
  const canCall = autoCanCall;
  const callNext = (auto: boolean): boolean => {
    // TAM-101: a second tap within half a second draws nothing. This compares times rather than
    // trusting a flag, so a late timer can never leave the button stuck. Auto-call is never a double tap.
    if ((!auto && sinceLastCall(lastCallAt.current) < NEXT_COOLDOWN_MS) || !canCall) return false;
    const r = move({ type: 'call' });
    if (!r.ok) return false;
    lastCallAt.current = performance.now();
    const rec = r.value.records[r.value.records.length - 1];
    setToastSeq(rec ? rec.seq : null);
    setCooldown(true);
    setResultSeq(null);
    setShowResumed(false);
    feel();
    const current = tambolaRules.view(r.value.state, { kind: 'host' }).current;
    if (current) say(current.number, current.rhyme);
    return true;
  };
  const onNext = () => void callNext(false);
  autoCallRef.current = () => {
    // If the call could not be made, try again after the same time rather than stopping.
    if (!callNext(true)) setAutoRetry((n) => n + 1);
  };
  const pauseAuto = () => {
    if (autoOn) setAutoPaused(true);
  };

  // UX list row 8: putting a player back on phone tickets, before the first call; their skipped tickets are handed
  // out next.
  const paperNote =
    paperUndo && view.called.length === 0 ? (
      <div className="toast paper-toast" role="status" data-testid="paper-toast">
        {paperUndo.name} plays on paper ·{' '}
        <button
          type="button"
          className="toast-button"
          onClick={() => {
            if (!undoRecord(paperUndo.seq)) return setPaperUndo(null);
            const skipped = paperUndo.skipped;
            setPaperUndo(null);
            if (skipped.length === 0) return;
            if (handOut) setHandOut({ ...handOut, queue: [...handOut.queue.slice(0, handOut.index), ...skipped, ...handOut.queue.slice(handOut.index)] });
            else setHandOut({ queue: skipped, index: 0, late: false });
          }}
        >
          Undo
        </button>
      </div>
    ) : null;

  if (handOut) {
    const done = () => setHandOut(null);
    return (
      <HandOut
        view={view}
        queue={handOut.queue}
        index={handOut.index}
        startedAt={saved.createdAt}
        late={handOut.late}
        calls={view.called.length}
        notice={paperNote}
        onAssign={(ticket, playerId) => {
          const r = move({ type: 'assign', ticket, playerId });
          return r.ok ? null : r.reason;
        }}
        onPaper={(playerId) => {
          // TAM-058: this player plays on paper; the rest of their tickets are skipped.
          const r = move({ type: 'to-paper', playerId });
          if (!r.ok) return;
          const owners = new Map(view.tickets.map((t) => [t.number, t.playerId]));
          const queue = [...handOut.queue.slice(0, handOut.index), ...handOut.queue.slice(handOut.index).filter((n) => owners.get(n) !== playerId)];
          const rec = r.value.records[r.value.records.length - 1];
          const skipped = handOut.queue.slice(handOut.index).filter((n) => owners.get(n) === playerId);
          setPaperUndo(rec && view.called.length === 0 ? { seq: rec.seq, name: nameOf(playerId), skipped } : null);
          if (handOut.index >= queue.length) done();
          else setHandOut({ ...handOut, queue });
        }}
        onNext={() => setHandOut({ ...handOut, index: handOut.index + 1 })}
        onDone={done}
        onBack={handOut.late ? done : onHome}
      />
    );
  }

  if (room) {
    return (
      <RoomView
        view={tambolaRules.view(match.state, { kind: 'room' })}
        code={phone ? view.code : null}
        money={money}
        names={nameOf}
        fromPress={room === 'press'}
        onBack={() => setRoom(false)}
      />
    );
  }

  if (settingsOpen) {
    const turn = (which: Shortcut, on: boolean) => {
      if (on && !warned[which]) return setAsking(which);
      if (which === 'voice') {
        setVoiceOn(on);
        if (on) setMuted(false);
      } else {
        setAutoOn(on);
        setAutoPaused(false);
      }
    };
    return (
      <main className="screen">
        <SettingsPanel
          settings={device}
          inGame
          onChange={(next) => {
            setDevice(next);
            saveSettings(prefs, next);
          }}
          dark={dark}
          onDark={(on) => {
            setDark(prefs, on);
            setDarkState(on);
          }}
          gameControls={
            <>
              <h2 className="section-title">This game</h2>
              <label className="check-row">
                <input type="checkbox" checked={voiceOn && canSpeak} disabled={!canSpeak} onChange={(e) => turn('voice', e.target.checked)} />
                <span>Phone speaks the call</span>
              </label>
              {!canSpeak && <p className="note">This phone has no voice, so it can't speak the calls. The anchor calls.</p>}
              <label className="check-row">
                <input type="checkbox" checked={autoOn} onChange={(e) => turn('auto', e.target.checked)} />
                <span>Auto-call</span>
              </label>
              {autoOn && (
                <label className="field">
                  <span>Time between calls</span>
                  <select value={String(autoSecs)} onChange={(e) => setAutoSecs(Number(e.target.value))}>
                    {AUTO_CALL_CHOICES.map((n) => (
                      <option key={n} value={String(n)}>
                        {n} seconds
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          }
          onDone={() => setSettingsOpen(false)}
        >
          <RenamePlayers view={view} rename={(playerId, name) => move({ type: 'rename', playerId, name })} />
        </SettingsPanel>
        {asking && (
          <Modal onClose={() => setAsking(null)}>
            <p className="lead">
              <strong>{WARNINGS[asking].title}</strong>
            </p>
            <p className="note">{WARNINGS[asking].text}</p>
            <div className="row">
              <button
                type="button"
                className="button"
                onClick={() => {
                  const which = asking;
                  setWarned((w) => ({ ...w, [which]: true }));
                  setAsking(null);
                  if (which === 'voice') {
                    setVoiceOn(true);
                    setMuted(false);
                  } else {
                    setAutoOn(true);
                    setAutoPaused(false);
                  }
                }}
              >
                Turn on
              </button>
              <button type="button" className="button button-quiet" onClick={() => setAsking(null)}>
                Cancel
              </button>
            </div>
          </Modal>
        )}
      </main>
    );
  }

  const wonCount = new Set(view.claims.filter((c) => c.verdict === 'accepted').map((c) => c.pattern)).size;
  const claimable = view.openPatterns.filter((p) => p !== 'second-full-house' || !view.openPatterns.includes('full-house'));
  const waiting = view.awaitingClose[0];
  const result = resultSeq === null ? undefined : (match.records.find((r) => r.seq === resultSeq) as TambolaRecord | undefined);
  const showTip = wakeRefused && !tipSeen;
  // The result shows in place of the rhyme and last calls, so it never covers the number (TAM-123, TAM-138).
  const showCard = !!result && isRecording(result);
  const resultClaimIndex = result ? match.records.filter((r) => r.seq <= result.seq).reduce((n, r) => n + claimsAdded(r.move), 0) - 1 : -1;
  // UX guideline 26a: screen readers hear the called number, its rhyme and every verdict, politely. "Repeat" adds a
  // no-break space every other time, so the same words are read again.
  const spoken =
    result && showCard
      ? spokenVerdict(result, resultClaimIndex, view, money, nameOf)
      : view.current
        ? `${view.current.number}${view.current.rhyme?.text ? `. ${view.current.rhyme.text}` : ''}${flash % 2 === 1 ? '\u00a0' : ''}`
        : '';
  // Closing a tier ends its result: it goes away by itself (TAM-145, owner decision 2026-09-29).
  const closeTier = (pattern: Pattern) => {
    const r = move({ type: 'close-tier', pattern });
    if (r.ok) setResultSeq(null);
  };
  const called = view.called.length;

  const confirmRecord = (kind: 'win' | 'bogey') => {
    if (sheet?.kind !== 'record' || sheet.sheet.step !== 'players') return;
    const s = sheet.sheet;
    const r =
      kind === 'win'
        ? move({ type: 'record-win', pattern: s.pattern, playerIds: s.picked })
        : move({
            type: 'record-bogey',
            playerId: s.picked[0]!,
            pattern: s.pattern,
          });
    if (!r.ok) {
      setSheet({ kind: 'record', sheet: { ...s, error: r.reason } });
      return;
    }
    const rec = r.value.records[r.value.records.length - 1];
    setResultSeq(rec ? rec.seq : null);
    setSheet(null);
    feel();
  };

  const startPress = () => {
    if (!view.current) return;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      setRoom('press');
    }, LONG_PRESS_MS);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  // TAM-198: while a won prize waits to be closed, the rest of the screen is dimmed; a stray tap there does
  // nothing but pulse the main button once (never a repeating blink).
  const dimmed = !!waiting && !view.readyToEnd;
  const pulse = () => {
    const el = mainRef.current;
    if (!el || typeof el.animate !== 'function') return;
    for (const a of el.getAnimations()) a.cancel();
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 450, iterations: 1, easing: 'ease-in-out' });
  };
  // UX list row 6 (TAM-145, TAM-198): in a phone-ticket game the next winner is a paper player, picked by name, or
  // another claim QR; with nobody on paper the scanner opens at once.
  const paperPlayers = (pattern: Pattern) => {
    const already = new Set(view.claims.filter((c) => c.pattern === pattern && c.verdict === 'accepted').map((c) => c.playerId));
    const onPaper = new Set(view.tickets.filter((t) => t.status === 'paper' && t.playerId !== undefined).map((t) => t.playerId!));
    return view.players.filter((p) => onPaper.has(p.id) && !already.has(p.id));
  };
  // UX review 2026-10-03 N1: a claim for a ticket that plays on paper is not a dead end. When its player can still win
  // that prize, the scanner offers the name list, as in paper games (also while a won prize waits to be closed).
  const paperWinner = (ticket: number, pattern: Pattern): string | null => {
    const t = view.tickets.find((x) => x.number === ticket);
    if (!t || t.status !== 'paper' || t.playerId === undefined || !view.openPatterns.includes(pattern)) return null;
    return paperPlayers(pattern).find((p) => p.id === t.playerId)?.name ?? null;
  };
  const pickByName = (pattern: Pattern) => {
    pauseAuto();
    setSheet({
      kind: 'record',
      sheet: { step: 'players', pattern, picked: [], adding: view.awaitingClose.includes(pattern), paperOnly: true },
    });
  };
  const addAnother = (pattern: Pattern) => {
    pauseAuto();
    if (phone && paperPlayers(pattern).length === 0) {
      setSheet({ kind: 'scan' });
      return;
    }
    setSheet({ kind: 'record', sheet: { step: 'players', pattern, picked: [], adding: true, ...(phone ? { paperOnly: true } : {}) } });
  };

  let main: ReactNode;
  if (view.readyToEnd) {
    main = (
      <button type="button" ref={mainRef} data-testid="main-button" className="button next-number" onClick={() => move({ type: 'end' })}>
        End game and show payouts
      </button>
    );
  } else if (waiting) {
    // TAM-198: after a win, closing the prize is the main action, in the same place and size as Next number.
    main = (
      <button type="button" ref={mainRef} className="button next-number raise" data-testid="main-button" onClick={() => closeTier(waiting)}>
        Close {PATTERN_NAMES[waiting]}
      </button>
    );
  } else {
    main = (
      <button
        type="button"
        ref={mainRef}
        data-testid="main-button"
        className="button next-number"
        disabled={(cooldown && sinceLastCall(lastCallAt.current) < NEXT_COOLDOWN_MS) || !canCall}
        onClick={onNext}
      >
        Next number
      </button>
    );
  }

  const recordButton = (
    <button
      type="button"
      className="button button-quiet record-win"
      onClick={() => {
        pauseAuto();
        setResultSeq(null);
        setSheet({ kind: 'record', sheet: { step: 'pattern' } });
      }}
    >
      Record a win
    </button>
  );
  // Phase 2: phone claims are scanned; "Record a win" stays for anyone on paper (TAM-058).
  const scanButton = (
    <button
      type="button"
      className={dimmed ? 'button button-quiet record-win raise' : 'button button-quiet record-win'}
      onClick={() => {
        pauseAuto();
        setResultSeq(null);
        setSheet({ kind: 'scan' });
      }}
    >
      Scan a claim
    </button>
  );
  const anyPaper = view.tickets.some((t) => t.status === 'paper');
  const addWinnerButton = waiting && (
    <button type="button" className="button button-quiet add-winner raise" onClick={() => addAnother(waiting)}>
      Add another winner
    </button>
  );
  const claimRow = phone ? (
    dimmed && waiting ? (
      <div className="record-row">
        {scanButton}
        {addWinnerButton}
      </div>
    ) : anyPaper ? (
      <div className="record-row">
        {scanButton}
        {recordButton}
      </div>
    ) : (
      scanButton
    )
  ) : dimmed && waiting ? (
    <div className="record-row">
      {recordButton}
      {addWinnerButton}
    </div>
  ) : (
    recordButton
  );

  const numberEl = (
    <>
      <div
        className="current-number raise"
        data-testid="current-number"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span key={popKey} className={popKey === quietKey.current ? undefined : 'flash'}>
          {view.current ? view.current.number : ''}
        </span>
      </div>
    </>
  );
  const tipEl = (
    <>
      {showTip && (
        <div className="sleep-tip" role="status">
          <p>Keep your screen on: this phone may let the screen sleep during the game.</p>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => {
              prefs.set(SLEEP_TIP_KEY, true);
              setTipSeen(true);
            }}
          >
            Got it
          </button>
        </div>
      )}
    </>
  );
  const noteEl = (
    <>
      {voiceNote && (
        <p className="voice-note" role="status">
          The phone's voice isn't working; the anchor calls.
        </p>
      )}
    </>
  );
  const sideEl = (
    <>
      {result && showCard ? (
        <ResultCard
          record={result}
          claimIndex={resultClaimIndex}
          proof={resultProof}
          view={view}
          money={money}
          nameOf={nameOf}
          onUndo={() => setDialog({ kind: 'undo-record', seq: result.seq })}
          onDone={() => setResultSeq(null)}
        />
      ) : (
        <>
          {!view.current && <p className="note first-hint">Tap Next number to call the first number.</p>}
          <p className="current-rhyme" data-testid="current-rhyme">
            {view.current?.rhyme?.text ?? ''}
          </p>
          {/* UX review 2026-10-03 polish: before the first call there is nothing to repeat and no last calls to show. */}
          {view.current && (
            <div className="rhyme-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setFlash((f) => f + 1);
                  if (view.current) say(view.current.number, view.current.rhyme);
                }}
              >
                Repeat
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  const r = move({ type: 'another-rhyme' });
                  const current = r.ok ? tambolaRules.view(r.value.state, { kind: 'host' }).current : null;
                  if (current) say(current.number, current.rhyme);
                }}
              >
                Another rhyme
              </button>
              {canSpeak && (voiceOn || autoOn) && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      if (!muted) hush();
                      setMuted(!muted);
                    }}
                  >
                    {muted ? 'Unmute voice' : 'Mute voice'}
                  </button>
                </>
              )}
            </div>
          )}
          {view.current && <LastCalls numbers={view.lastCalls} />}
        </>
      )}
    </>
  );
  const toastEl = (
    <>
      {!showCard && (
        <div className="toast-slot">
          {paperNote}
          {toastLeft >= 0 && lastRecord && view.current && (
            <div className="toast" data-testid="undo-toast">
              Called {view.current.number} ·{' '}
              <button
                type="button"
                className="toast-button"
                onClick={() => {
                  if (undoRecord(lastRecord.seq)) {
                    setToastSeq(null);
                    pauseAuto();
                  }
                }}
              >
                Undo ({Math.max(1, Math.ceil(toastLeft / 1000))}s)
              </button>
            </div>
          )}
          {showResumed && toastLeft < 0 && (
            <p className="toast" role="status">
              Game resumed
            </p>
          )}
        </div>
      )}
    </>
  );
  const autoEl = (
    <>
      {autoOn && (
        <button type="button" className="button button-quiet auto-call" onClick={() => setAutoPaused(!autoPaused)}>
          {autoPaused ? 'Paused: tap to resume' : 'Pause auto-call'}
        </button>
      )}
    </>
  );
  const chipsEl = <PrizeChips view={view} names={nameOf} onClose={closeTier} />;

  return (
    <main className={dimmed ? 'play dimmed' : 'play'}>
      {dimmed && <div className="dim-layer" aria-hidden="true" onClick={pulse} />}
      <p className="visually-hidden" role="status" aria-live="polite" data-testid="announcer">
        {spoken}
      </p>
      <header className="play-bar" data-testid="top-bar">
        <button type="button" className="bar-button" onClick={onHome}>
          ← Back
        </button>
        <span className="bar-progress">
          {view.allCalled ? 'All 90 numbers called' : `${called} of 90 called`}
          {/* UX list row 25 (TAM-107, TAM-172): the game code, quiet text on its own line, for the room to read. */}
          {phone && (
            <span className="bar-code" data-testid="game-code">
              {/* RC fix 2 (C1): on a narrow phone only "Game Z9QB" shows, on one line, clear of the big number. */}
              <span className="bar-code-game">Tambola · </span>Game {view.code}
            </span>
          )}
        </span>
        {wakeRefused && !showTip && <span className="bar-sleep">☾ Screen may sleep</span>}
        <button
          type="button"
          className="bar-button raise"
          aria-haspopup="menu"
          aria-expanded={sheet?.kind === 'menu'}
          onClick={() => setSheet(sheet?.kind === 'menu' ? null : { kind: 'menu' })}
        >
          ⋯ Menu
        </button>
      </header>

      {landscape ? (
        // UX list row 11 (TAM-107, TAM-129, TAM-138): in landscape the number fills the left half, with the prize
        // chips, notes and the undo toast under it; the rhyme and last calls sit on the right, and "Next number"
        // (72 px tall) has the bottom right to itself, with "Record a win" above it, never beside it.
        <div className="land">
          <section className="land-left" aria-label="Current number">
            {numberEl}
            {chipsEl}
            {tipEl}
            {noteEl}
            {autoEl}
            {toastEl}
          </section>
          <div className="land-right">
            {sideEl}
            <div className="play-bottom">
              {claimRow}
              {main}
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="stage" aria-label="Current number">
            {numberEl}
            {tipEl}
            {noteEl}
            <div className="stage-side">
              {sideEl}
              {chipsEl}
              {toastEl}
            </div>
          </section>
          <div className="play-bottom">
            {autoEl}
            {claimRow}
            {main}
          </div>
        </>
      )}

      {sheet?.kind === 'menu' && (
        <MenuSheet
          onClose={() => setSheet(null)}
          items={[
            ['Settings', () => setSettingsOpen(true)],
            ...(onReport ? [['Report a problem', () => onReport({ kind: 'game', gameId: saved.id })] as MenuEntry] : []),
            ['Show the room', () => setRoom('menu')],
            ['Board', () => setSheet({ kind: 'board' })],
            ...(phone ? [['Tickets', () => setSheet({ kind: 'tickets' })] as MenuEntry] : []),
            [
              'Check numbers',
              () => {
                pauseAuto();
                setSheet({ kind: 'check', text: '' });
              },
            ],
            // TAM-067: shown unless late joining is off; greyed out once the limit is reached.
            ...(match.setup.config.settings.lateJoinUntil > 0
              ? [['Add a late player', () => setSheet({ kind: 'late', name: '', tickets: '1' }), !view.canAddPlayer && view.lateJoiners.every((j) => !j.removable)] as MenuEntry]
              : []),
            ['End game', () => setDialog({ kind: 'end' })],
            ['Discard game', () => setDialog({ kind: 'discard' })],
          ]}
          setSheet={setSheet}
        />
      )}

      {sheet?.kind === 'record' && (
        <SheetFrame label="Record a win" onClose={() => setSheet(null)}>
          {sheet.sheet.step === 'pattern' ? (
            <>
              <h2 className="section-title">Record a win: which prize?</h2>
              <p className="note">The anchor has checked the ticket in front of the room.</p>
              {claimable.length === 0 ? (
                <p className="lead">Every prize is closed.</p>
              ) : (
                <div className="choice-grid">
                  {claimable.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="button button-quiet"
                      onClick={() =>
                        setSheet({
                          kind: 'record',
                          sheet: {
                            step: 'players',
                            pattern: p,
                            picked: [],
                            adding: false,
                          },
                        })
                      }
                    >
                      {PATTERN_NAMES[p]}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="button button-quiet" onClick={() => setSheet(null)}>
                Cancel
              </button>
            </>
          ) : (
            <PickPlayers
              sheet={sheet.sheet}
              view={view}
              onChange={(next) => setSheet({ kind: 'record', sheet: next })}
              onBack={() => setSheet({ kind: 'record', sheet: { step: 'pattern' } })}
              onCancel={() => setSheet(null)}
              onConfirm={() => confirmRecord('win')}
              onBogey={() => confirmRecord('bogey')}
              onScan={() => setSheet({ kind: 'scan' })}
            />
          )}
        </SheetFrame>
      )}

      {sheet?.kind === 'check' && (
        <SheetFrame label="Check numbers" onClose={() => setSheet(null)}>
          <CheckNumbers
            state={sheet}
            patterns={view.tiers.map((t) => t.pattern)}
            called={view.called}
            onChange={(next) => setSheet({ kind: 'check', ...next })}
            onClose={() => setSheet(null)}
          />
        </SheetFrame>
      )}

      {sheet?.kind === 'late' && (
        <SheetFrame label="Add a late player" onClose={() => setSheet(null)}>
          <LatePlayer
            state={sheet}
            view={view}
            money={match.setup.config.money}
            phone={phone}
            onChange={(next) => setSheet({ kind: 'late', ...next })}
            onAdd={() => {
              const tickets = Number(sheet.tickets.trim() || '1');
              const id = `late-${freshSeed(4)}`;
              const r = move({ type: 'add-player', player: { id, name: sheet.name, tickets } });
              if (!r.ok) return setSheet({ ...sheet, error: r.reason });
              setSheet(null);
              if (money) setDialog({ kind: 'prizes', tiers: tambolaRules.view(r.value.state, { kind: 'host' }).tiers });
              // TAM-212: a late joiner's phone tickets are handed out on the same screen as at the start.
              const theirs = r.value.state.tickets.filter((t) => t.playerId === id).map((t) => t.number);
              if (theirs.length > 0) setHandOut({ queue: theirs, index: 0, late: true });
            }}
            onRemove={(playerId) => {
              const r = move({ type: 'remove-player', playerId });
              if (!r.ok) return setSheet({ ...sheet, error: r.reason });
              setSheet(null);
              if (money) setDialog({ kind: 'prizes', tiers: tambolaRules.view(r.value.state, { kind: 'host' }).tiers });
            }}
            onClose={() => setSheet(null)}
          />
        </SheetFrame>
      )}

      {sheet?.kind === 'scan' && (
        <ClaimScanner
          view={view}
          pastGame={(code) => pastGameNote(store, saved.id, code)}
          paperWinner={paperWinner}
          onPickByName={pickByName}
          onCheck={(ticket, pattern, proof) => {
            const r = move({ type: 'check-claim', ticket, pattern });
            if (!r.ok) return r.reason;
            const rec = r.value.records[r.value.records.length - 1];
            setResultSeq(rec ? rec.seq : null);
            setResultProof(proof);
            setSheet(null);
            feel();
            return null;
          }}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet?.kind === 'tickets' && (
        <SheetFrame label="Tickets" onClose={() => setSheet(null)}>
          <HostTickets
            view={view}
            onAssign={(ticket, playerId) => {
              const r = move({ type: 'assign', ticket, playerId });
              return r.ok ? null : r.reason;
            }}
            onPaper={(playerId) => {
              const r = move({ type: 'to-paper', playerId });
              return r.ok ? null : r.reason;
            }}
            onClose={() => setSheet(null)}
          />
        </SheetFrame>
      )}

      {dialog?.kind === 'prizes' && (
        <Modal onClose={() => setDialog(null)}>
          <div className="stack-tight" data-testid="prize-update">
            <p className="lead">
              <strong>New prizes.</strong> The anchor announces them to the room:
            </p>
            <ul className="summary-tiers">
              {dialog.tiers.map((t) => (
                <li key={t.pattern} data-pattern={t.pattern} data-amount={String(t.amount)}>
                  {PATTERN_NAMES[t.pattern]}: {rupees(t.amount)}
                </li>
              ))}
            </ul>
            <p className="note">Pot {rupees(dialog.tiers.reduce((sum, t) => sum + t.amount, 0))}</p>
          </div>
          <button type="button" className="button" onClick={() => setDialog(null)}>
            Done
          </button>
        </Modal>
      )}

      {sheet?.kind === 'board' && (
        <SheetFrame label="Board" onClose={() => setSheet(null)}>
          <Board called={view.called} />
          <button type="button" className="button button-quiet" onClick={() => setSheet(null)}>
            Done
          </button>
        </SheetFrame>
      )}

      {dialog?.kind === 'end' && (
        <Modal onClose={() => setDialog(null)}>
          <p className="lead">End the game and show payouts?</p>
          {money && <p className="note">The money of any prize not won is handed back to everyone, equally per ticket.</p>}
          <div className="row">
            {/* TAM-103, PLT-301: "Keep playing" is the main button; ending is outlined (guideline 15). */}
            <button type="button" className="button button-quiet" onClick={() => (setDialog(null), move({ type: 'end' }))}>
              End game
            </button>
            <button type="button" className="button" onClick={() => setDialog(null)}>
              Keep playing
            </button>
          </div>
        </Modal>
      )}
      {dialog?.kind === 'discard' && (
        <Modal onClose={() => setDialog(null)}>
          <p className="lead">Discard this game? Nobody wins and it can't be resumed.</p>
          {wonCount > 0 && (
            <p className="lead">{wonCount === 1 ? '1 prize was already won.' : `${wonCount} prizes were already won.`} Discard anyway?</p>
          )}
          {money && <p className="note">Everyone gets their contribution back.</p>}
          <div className="row">
            {/* PLT-301: a destructive action is never the main button. */}
            <button type="button" className="button button-quiet" onClick={() => (setDialog(null), move({ type: 'discard' }))}>
              Discard game
            </button>
            <button type="button" className="button" onClick={() => setDialog(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {dialog?.kind === 'undo-record' && (
        <UndoRecordDialog
          record={match.records.find((r) => r.seq === dialog.seq) as TambolaRecord | undefined}
          nameOf={nameOf}
          onUndo={() => {
            const seq = dialog.seq;
            setDialog(null);
            if (undoRecord(seq)) setResultSeq(null);
          }}
          onKeep={() => setDialog(null)}
        />
      )}
    </main>
  );
}

/**
 * TAM-140, PLT-005 (UX list row 22): right after End or Discard, a "Game over" banner at the top of the host's
 * summary, with the payouts still below it. It stays until the host leaves the screen; nothing timed.
 */
function GameOver({ discarded, phone, money }: { discarded: boolean; phone: boolean; money: boolean }) {
  return (
    <div className="banner game-over" role="status" data-testid="game-over">
      {discarded ? (
        <p>
          Game over · Discarded · Nobody wins.{money ? ' Everyone gets their contribution back.' : ''}
        </p>
      ) : (
        <p>✓ Game over{phone ? ' · Players: phones away. Tap Done with this game.' : ''}</p>
      )}
    </div>
  );
}

/** The calling screen's landscape layout (TAM-129): the same test as the landscape block in styles.css. */
const LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 600px)';

function useLandscape(): boolean {
  const [on, setOn] = useState(() => typeof matchMedia === 'function' && matchMedia(LANDSCAPE_QUERY).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const m = matchMedia(LANDSCAPE_QUERY);
    const update = () => setOn(m.matches);
    update();
    m.addEventListener('change', update);
    return () => m.removeEventListener('change', update);
  }, []);
  return on;
}

/** A menu item: its words, what it does, and whether it is greyed out. */
type MenuEntry = [string, () => void, boolean?];

function MenuSheet({
  items,
  onClose,
  setSheet,
}: {
  items: MenuEntry[];
  onClose: () => void;
  setSheet: (s: Sheet | null) => void;
}) {
  useEscape(onClose);
  return (
    <div className="menu-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="menu" role="dialog" aria-modal="true" aria-label="Menu">
        <div role="menu" aria-label="Game menu" className="menu-list">
          {items.map(([label, act, disabled]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className="menu-item"
              disabled={disabled === true}
              onClick={() => {
                setSheet(null);
                act();
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="menu-item menu-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

/** TAM-067, TAM-184: add a late joiner, or take one out again before the next number. */
function LatePlayer({
  state,
  view,
  money,
  phone,
  onChange,
  onAdd,
  onRemove,
  onClose,
}: {
  state: Extract<Sheet, { kind: 'late' }>;
  view: TambolaView;
  money: { contribution: number } | null;
  phone: boolean;
  onChange: (next: { name: string; tickets: string; error?: string }) => void;
  onAdd: () => void;
  onRemove: (playerId: string) => void;
  onClose: () => void;
}) {
  const removable = view.lateJoiners.filter((j) => j.removable);
  return (
    <>
      <h2 className="section-title">Add a late player</h2>
      {view.canAddPlayer ? (
        <>
          <p className="note">
            {money
              ? `They pay ${rupees(money.contribution)} per ticket, and the prizes not won yet grow.`
              : phone
                ? 'They get phone tickets from the next sheet.'
                : 'They join with a paper ticket, like everyone else.'}
          </p>
          <label className="field">
            <span>Name of late player</span>
            <input
              type="text"
              autoComplete="off"
              maxLength={30}
              value={state.name}
              onChange={(e) => onChange({ name: e.target.value, tickets: state.tickets })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onAdd();
              }}
            />
          </label>
          <label className="field">
            <span>Tickets</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={3}
              value={state.tickets}
              onChange={(e) => onChange({ name: state.name, tickets: e.target.value })}
            />
          </label>
          <button type="button" className="button" disabled={state.name.trim() === ''} onClick={onAdd}>
            Add
          </button>
        </>
      ) : (
        <p className="lead">Late joining has closed for this game.</p>
      )}
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {removable.length > 0 && (
        <div className="stack-tight">
          <p className="note">Added by mistake? Take them out before the next number.</p>
          <div className="row">
            {removable.map((j) => (
              <button key={j.id} type="button" className="button button-quiet" onClick={() => onRemove(j.id)}>
                Remove {j.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="button" className="button button-quiet" onClick={onClose}>
        Close
      </button>
    </>
  );
}

function PickPlayers({
  sheet,
  view,
  onChange,
  onBack,
  onCancel,
  onConfirm,
  onBogey,
  onScan,
}: {
  sheet: Extract<RecordSheet, { step: 'players' }>;
  view: TambolaView;
  onChange: (next: Extract<RecordSheet, { step: 'players' }>) => void;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onBogey: () => void;
  /** UX list row 6: in a phone-ticket game, the next winner may instead show a claim QR. */
  onScan: () => void;
}) {
  const name = PATTERN_NAMES[sheet.pattern];
  const already = new Set(view.claims.filter((c) => c.pattern === sheet.pattern && c.verdict === 'accepted').map((c) => c.playerId));
  const onPaper = new Set(view.tickets.filter((t) => t.status === 'paper').map((t) => t.playerId));
  const players = view.players.filter((p) => !already.has(p.id) && (!sheet.paperOnly || onPaper.has(p.id)));
  const toggle = (id: string) => {
    const { error: _drop, ...rest } = sheet;
    onChange({
      ...rest,
      picked: sheet.picked.includes(id) ? sheet.picked.filter((x) => x !== id) : [...sheet.picked, id],
    });
  };
  return (
    <>
      <h2 className="section-title">{sheet.adding ? `Another ${name} winner` : `${name}: who won?`}</h2>
      <p className="note">
        {sheet.paperOnly
          ? 'A paper player: tap the name, or several for a tie. A phone player: scan their claim.'
          : 'Tap one name, or several for a tie. For a false claim, tap the name and then Bogey.'}
      </p>
      <div className="choice-grid">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            // PLT-301, guideline 17a: a chosen winner shows an outline, a ✓ and a tint, never the look of "Confirm".
            className={sheet.picked.includes(p.id) ? 'button button-quiet pick pick-on' : 'button button-quiet pick'}
            aria-pressed={sheet.picked.includes(p.id)}
            onClick={() => toggle(p.id)}
          >
            {sheet.picked.includes(p.id) && <span aria-hidden="true">✓ </span>}
            {p.name}
          </button>
        ))}
      </div>
      {sheet.error && (
        <p className="error" role="alert">
          {sheet.error}
        </p>
      )}
      <div className="row">
        <button type="button" className="button" disabled={sheet.picked.length === 0} onClick={onConfirm}>
          Confirm
        </button>
        <button type="button" className="button button-quiet" disabled={sheet.picked.length !== 1} onClick={onBogey}>
          Bogey
        </button>
      </div>
      {sheet.paperOnly && (
        <button type="button" className="button button-quiet" onClick={onScan}>
          Scan a claim
        </button>
      )}
      <div className="row">
        {!sheet.adding && (
          <button type="button" className="button button-quiet" onClick={onBack}>
            Back
          </button>
        )}
        <button type="button" className="button button-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </>
  );
}

function CheckNumbers({
  state,
  patterns,
  called,
  onChange,
  onClose,
}: {
  state: Extract<Sheet, { kind: 'check' }>;
  patterns: readonly Pattern[];
  called: readonly number[];
  onChange: (next: { pattern?: Pattern; text: string; result?: CheckResult }) => void;
  onClose: () => void;
}) {
  const pattern = state.pattern;
  const check = () => {
    if (!pattern) return;
    const numbers = (state.text.match(/-?\d+/g) ?? []).map(Number);
    onChange({
      pattern,
      text: state.text,
      result: checkNumbers(called, pattern, numbers),
    });
  };
  const r = state.result;
  return (
    <>
      <h2 className="section-title">Check numbers</h2>
      <p className="note">For a dispute: type the numbers read out and see which have been called. Nothing is recorded.</p>
      <div className="choice-grid">
        {patterns.map((p) => (
          <button
            key={p}
            type="button"
            className={p === pattern ? 'button button-quiet pick pick-on' : 'button button-quiet pick'}
            aria-pressed={p === pattern}
            onClick={() => onChange({ pattern: p, text: state.text })}
          >
            {p === pattern && <span aria-hidden="true">✓ </span>}
            {PATTERN_NAMES[p]}
          </button>
        ))}
      </div>
      {pattern && (
        <>
          <label className="field">
            <span>Numbers read out</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={`The ${NEEDS[pattern]} numbers, with spaces`}
              value={state.text}
              onChange={(e) => onChange({ pattern, text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') check();
              }}
            />
          </label>
          <button type="button" className="button" onClick={check}>
            Check
          </button>
        </>
      )}
      {r && (
        <div className="check-result" data-testid="check-result" aria-live="polite">
          {r.ok ? (
            <>
              <ul className="checks">
                {r.checks.map((c) => (
                  <li key={c.number} data-called={c.called ? 'true' : 'false'} className={c.called ? 'check-ok' : 'check-bad'}>
                    {c.number} {c.called ? '✓' : '✗'}
                  </li>
                ))}
              </ul>
              <p className="lead">
                {r.complete
                  ? `Complete: every number has been called.`
                  : `Not complete: ${plural(r.checks.filter((c) => !c.called).length, 'number')} not called yet.`}
              </p>
            </>
          ) : (
            <p className="error" role="alert">
              {r.reason}
            </p>
          )}
        </div>
      )}
      <button type="button" className="button button-quiet" onClick={onClose}>
        Close
      </button>
    </>
  );
}

/** What a recorded paper win or bogey says (TAM-037, TAM-039): the first line, then the shares of a tie. */
function paperVerdict(
  m: Extract<TambolaMove, { type: 'record-win' | 'record-bogey' }>,
  view: TambolaView,
  money: boolean,
  nameOf: (id: string) => string,
): { headline: string; detail: string | null } {
  const pattern = m.pattern;
  const name = PATTERN_NAMES[pattern];
  if (m.type === 'record-bogey') return { headline: `✗ Bogey: ${nameOf(m.playerId)}, ${name}`, detail: null };
  const winners = view.claims.filter((c) => c.pattern === pattern && c.verdict === 'accepted');
  const names = [...new Set(winners.map((c) => nameOf(c.playerId)))];
  const tier = view.tiers.find((t) => t.pattern === pattern);
  if (winners.length === 1) {
    const prize = money ? rupees(winners[0]!.prize ?? 0) : tier?.label;
    return { headline: `${name}: ✓ ${names.join(', ')}${prize ? `, ${prize}` : ''}`, detail: null };
  }
  return {
    headline: `${name}: ✓ ${names.join(', ')}`,
    detail: money
      ? `Shared by ${winners.length}: ${winners.map((c) => rupees(c.prize ?? 0)).join(', ')} (${rupees(tier?.amount ?? 0)} in all)`
      : `Shared by ${winners.length}${tier?.label ? `: ${tier.label}` : ''}`,
  };
}

/** What a phone-ticket claim's verdict says (TAM-033, TAM-038, TAM-174): the first line, and any detail. */
function phoneVerdict(
  c: TambolaView['claims'][number],
  view: TambolaView,
  money: boolean,
  nameOf: (id: string) => string,
): { headline: string; detail: string | null } {
  const name = PATTERN_NAMES[c.pattern];
  const owner = nameOf(c.playerId);
  const tier = view.tiers.find((t) => t.pattern === c.pattern);
  if (c.verdict === 'accepted') {
    const headline = money
      ? `${name}: ✓ Accepted, ${rupees(c.prize ?? 0)} to ${owner}`
      : `${name}: ✓ Accepted for ${owner}${tier?.label ? `: ${tier.label}` : ''}`;
    const shared = view.claims.filter((x) => x.pattern === c.pattern && x.verdict === 'accepted').length;
    const detail = shared > 1 ? (money ? `Shared by ${shared} (${rupees(tier?.amount ?? 0)} in all)` : `Shared by ${shared}`) : null;
    return { headline, detail };
  }
  if (c.reason === 'late') return { headline: `${name}: ✗ Bogey: too late`, detail: `${name} was complete at ${c.completedAt}.` };
  if (c.missing && c.missing.length > 0) return { headline: `${name}: ✗ Bogey: ${c.missing.join(', ')} not called`, detail: null };
  return { headline: `${name}: ✗ Bogey: ${plural(c.needed ?? 0, 'more number')} needed`, detail: null };
}

/** UX guideline 26a: the words a screen reader hears for a recorded win, bogey or checked claim. */
function spokenVerdict(record: TambolaRecord, claimIndex: number, view: TambolaView, money: boolean, nameOf: (id: string) => string): string {
  const m = record.move;
  if (m.type === 'record-win' || m.type === 'record-bogey') {
    const v = paperVerdict(m, view, money, nameOf);
    return v.detail ? `${v.headline}. ${v.detail}` : v.headline;
  }
  const c = view.claims[claimIndex];
  if (m.type !== 'check-claim' || !c) return '';
  const v = phoneVerdict(c, view, money, nameOf);
  return v.detail ? `${v.headline}. ${v.detail}` : v.headline;
}

function ResultCard({
  record,
  claimIndex,
  proof,
  view,
  money,
  nameOf,
  onUndo,
  onDone,
}: {
  record: TambolaRecord;
  claimIndex: number;
  proof: ClaimProof | null;
  view: TambolaView;
  money: boolean;
  nameOf: (id: string) => string;
  onUndo: () => void;
  onDone: () => void;
}) {
  const m = record.move;
  if (m.type === 'check-claim') {
    return <PhoneResult claimIndex={claimIndex} proof={proof} view={view} money={money} nameOf={nameOf} onUndo={onUndo} onDone={onDone} />;
  }
  if (m.type !== 'record-win' && m.type !== 'record-bogey') return null;
  const waiting = view.awaitingClose.includes(m.pattern);
  const { headline, detail } = paperVerdict(m, view, money, nameOf);
  return (
    <section className="result-card raise" data-testid="claim-result">
      <p className={m.type === 'record-win' ? 'verdict verdict-ok' : 'verdict verdict-bogey'}>{headline}</p>
      {detail && (
        <div className="result-body">
          <p className="note">{detail}</p>
        </div>
      )}
      {/* TAM-198: "Add another winner" and "Close <Pattern>" sit at the bottom, as the main actions. */}
      <div className="row result-actions">
        <button type="button" className="button button-quiet" onClick={onUndo}>
          {m.type === 'record-win' ? 'Undo win' : 'Undo bogey'}
        </button>
        {!waiting && (
          <button type="button" className="button button-quiet" onClick={onDone}>
            Done
          </button>
        )}
      </div>
    </section>
  );
}

function UndoRecordDialog({
  record,
  nameOf,
  onUndo,
  onKeep,
}: {
  record: TambolaRecord | undefined;
  nameOf: (id: string) => string;
  onUndo: () => void;
  onKeep: () => void;
}) {
  const m = record?.move;
  if (m?.type === 'check-claim') {
    return (
      <Modal onClose={onKeep}>
        <p className="lead">
          Undo ticket {m.ticket}'s {PATTERN_NAMES[m.pattern]} claim? The numbers called stay called.
        </p>
        <div className="row">
          <button type="button" className="button" onClick={onUndo}>
            Undo claim
          </button>
          <button type="button" className="button button-quiet" onClick={onKeep}>
            Keep it
          </button>
        </div>
      </Modal>
    );
  }
  if (!m || (m.type !== 'record-win' && m.type !== 'record-bogey')) return null;
  const who = m.type === 'record-win' ? m.playerIds.map(nameOf).join(' and ') : nameOf(m.playerId);
  const what = m.type === 'record-win' ? `${PATTERN_NAMES[m.pattern]} win` : `${PATTERN_NAMES[m.pattern]} bogey`;
  return (
    <Modal onClose={onKeep}>
      <p className="lead">
        Undo {who}'s {what}? {m.type === 'record-win' ? 'The prize is open again, and' : 'The'} numbers called stay called.
      </p>
      <div className="row">
        <button type="button" className="button" onClick={onUndo}>
          {m.type === 'record-win' ? 'Undo win' : 'Undo bogey'}
        </button>
        <button type="button" className="button button-quiet" onClick={onKeep}>
          Keep it
        </button>
      </div>
    </Modal>
  );
}

function PrizeChips({ view, names, onClose }: { view: TambolaView; names: (id: string) => string; onClose: (p: Pattern) => void }) {
  return (
    <ul className="prize-chips" data-testid="prize-chips" aria-label="Prizes">
      {view.tiers.map((t) => {
        const winners = [
          ...new Set(view.claims.filter((c) => c.pattern === t.pattern && c.verdict === 'accepted').map((c) => names(c.playerId))),
        ];
        const waiting = view.awaitingClose.includes(t.pattern);
        const open = view.openPatterns.includes(t.pattern);
        if (winners.length === 0) {
          return (
            <li key={t.pattern} className="prize-chip" data-testid="prize-chip">
              {open ? `${CHIP_NAMES[t.pattern]} ●` : CHIP_NAMES[t.pattern]}
            </li>
          );
        }
        return (
          <li key={t.pattern} className={waiting ? 'prize-chip chip-won' : 'prize-chip chip-closed'} data-testid="prize-chip">
            <span>
              {PATTERN_NAMES[t.pattern]} ✓ {winners.join(', ')}
            </span>
            {waiting && (
              <button type="button" className="chip-close raise" onClick={() => onClose(t.pattern)}>
                Close
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function LastCalls({ numbers, big }: { numbers: readonly number[]; big?: boolean }) {
  return (
    <div className={big ? 'last-calls last-calls-big' : 'last-calls'}>
      <span className="note">Last</span>
      <ol data-testid="last-calls">
        {numbers.map((n) => (
          <li key={n} data-number={n}>
            {n}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Board({ called }: { called: readonly number[] }) {
  const set = new Set(called);
  return (
    <section aria-label="Board">
      <h2 className="section-title">Board: {plural(called.length, 'number')} called</h2>
      <div className="board" data-testid="board">
        {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
          <div key={n} className={set.has(n) ? 'cell called' : 'cell'} data-number={n} data-called={set.has(n) ? 'true' : 'false'}>
            {n}
          </div>
        ))}
      </div>
    </section>
  );
}

function RoomView({
  view,
  code,
  money,
  names,
  fromPress,
  onBack,
}: {
  view: TambolaView;
  /** Phone-ticket games: the game code, small in the bottom-left corner (UX list row 25). */
  code: string | null;
  money: boolean;
  names: (id: string) => string;
  fromPress: boolean;
  onBack: () => void;
}) {
  // Opened by a long press (TAM-126), the finger is still down: its release must not close the view.
  // So a tap only counts once it started on this view. Opened from the menu, any tap counts (TAM-108).
  const pressed = useRef(!fromPress);
  const latest = view.claims[view.claims.length - 1];
  const tier = latest && view.tiers.find((t) => t.pattern === latest.pattern);
  const prize = latest?.verdict === 'accepted' ? (money ? rupees(latest.prize ?? 0) : tier?.label) : undefined;
  return (
    <main
      className="room"
      data-testid="room-view"
      onPointerDown={() => {
        pressed.current = true;
      }}
      onClick={() => {
        if (pressed.current) onBack();
      }}
    >
      <div className="room-number" data-testid="current-number">
        {view.current ? view.current.number : ''}
      </div>
      {/* RC fix (C1): in landscape this column sits beside the number; in portrait it stacks under it. */}
      <div className="room-side">
        <p className="room-rhyme" data-testid="current-rhyme">
          {view.current?.rhyme?.text ?? ''}
        </p>
        <LastCalls numbers={view.lastCalls} big />
        {latest && (
          <p className="room-verdict">
            {latest.verdict === 'accepted'
              ? `${PATTERN_NAMES[latest.pattern]}: ✓ ${names(latest.playerId)}${prize ? `, ${prize}` : ''}`
              : `✗ Bogey: ${names(latest.playerId)}, ${PATTERN_NAMES[latest.pattern]}`}
          </p>
        )}
        <p className="note">Tap anywhere to go back</p>
      </div>
      {code && (
        <p className="room-code" data-testid="room-game-code">
          Game {code}
        </p>
      )}
    </main>
  );
}

function RenamePlayers({ view, rename }: { view: TambolaView; rename: (id: string, name: string) => { ok: boolean; reason?: string } }) {
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <h2 className="section-title">Players</h2>
      {view.players.map((p, i) => (
        <label key={p.id} className="field">
          <span>Rename player {i + 1}</span>
          <input
            type="text"
            maxLength={30}
            value={texts[p.id] ?? p.name}
            onChange={(e) => setTexts({ ...texts, [p.id]: e.target.value })}
            onBlur={() => {
              const text = texts[p.id];
              if (text === undefined || text.trim() === p.name) return;
              const r = rename(p.id, text);
              setError(r.ok ? null : (r.reason ?? 'That name cannot be used.'));
              if (r.ok) {
                const { [p.id]: _done, ...rest } = texts;
                setTexts(rest);
              }
            }}
          />
        </label>
      ))}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

/** A sheet over the calling screen: it never moves what is under it (TAM-127). */
function SheetFrame({ label, children, onClose }: { label: string; children: ReactNode; onClose: () => void }) {
  useEscape(onClose);
  return (
    <div className="backdrop sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEscape(onClose);
  return (
    <div className="backdrop">
      <div className="dialog" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

// ---------- Phase 2: phone tickets ----------

/** A phone-ticket claim's verdict, where a paper win shows (TAM-033, TAM-038, TAM-174): the ticket, with the calls. */
function PhoneResult({
  claimIndex,
  proof,
  view,
  money,
  nameOf,
  onUndo,
  onDone,
}: {
  claimIndex: number;
  proof: ClaimProof | null;
  view: TambolaView;
  money: boolean;
  nameOf: (id: string) => string;
  onUndo: () => void;
  onDone: () => void;
}) {
  const c = view.claims[claimIndex];
  if (!c || c.ticket === undefined) return null;
  const owner = nameOf(c.playerId);
  const ticket = view.tickets.find((t) => t.number === c.ticket);
  const waiting = view.awaitingClose.includes(c.pattern);
  const { headline, detail } = phoneVerdict(c, view, money, nameOf);
  const out = c.verdict === 'bogey' && ticket?.status === 'out';
  return (
    <section className="result-card raise" data-testid="claim-result">
      <p className={c.verdict === 'accepted' ? 'verdict verdict-ok' : 'verdict verdict-bogey'}>{headline}</p>
      {/* UX review 2026-10-03 point b: on small phones the proof and the ticket scroll here; the buttons stay pinned below. */}
      <div className="result-body">
        {/* UX list row 24: the proof, on its own line in ordinary text, for accepted claims and bogeys alike. */}
        <p className="claim-proof" data-testid="claim-proof">
          Ticket {c.ticket}
          {view.code ? ` · game ${view.code}` : ''}
          {proof === 'qr' ? ' · same numbers as your copy' : proof === 'typed' ? ' · checked from your copy' : ''}
        </p>
        <p className="note">
          {owner}
          {detail ? ` · ${detail}` : ''}
          {out ? ` · Ticket ${c.ticket} is out.` : ''}
        </p>
        {ticket && <TicketGrid rows={ticket.rows} cell={24} marks={{ called: new Set(view.called) }} className="ticket-small" />}
      </div>
      <div className="row result-actions">
        <button type="button" className="button button-quiet" onClick={onUndo}>
          Undo claim
        </button>
        {!waiting && (
          <button type="button" className="button button-quiet" onClick={onDone}>
            Done
          </button>
        )}
      </div>
    </section>
  );
}

/** "9:15 pm", as a player's ticket shows its game's start time (TAM-170). */
const clockTime = (t: number) => {
  const d = new Date(t);
  return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`;
};

/**
 * UX list row 23 (TAM-179): a claim QR from another game, looked up in this phone's History. A phone-ticket game that
 * ended here: "That game has ended (game 7K3P, 9:15 pm). This claim doesn't count."; discarded: "That game was
 * discarded (game 7K3P). …". Anything else (never run here, deleted, still unfinished): null, and the usual words.
 */
function pastGameNote(store: SavedGameStore, currentId: string, code: string): string | null {
  for (const g of store.list()) {
    if (g.id === currentId || g.gameType !== 'tambola') continue;
    const setup = (g as TambolaSaved).setup;
    if (setup?.config?.ticketMode !== 'phone' || typeof setup.gameId !== 'string' || gameCode(setup.gameId) !== code) continue;
    if (g.status === 'ended') return `That game has ended (game ${code}, ${clockTime(g.createdAt)}). This claim doesn't count.`;
    if (g.status === 'abandoned') return `That game was discarded (game ${code}). This claim doesn't count.`;
  }
  return null;
}

/** How a phone claim was checked (UX list row 24): its QR compared with this phone's copy, or typed by number. */
type ClaimProof = 'qr' | 'typed';

/** How long the camera looks for a claim QR before typing the ticket number takes over (TAM-178). */
const NO_READ_MS = 10_000;

/**
 * "Scan a claim" (TAM-177, TAM-178, TAM-179): the camera opens at once and the prize comes from the QR.
 * "Enter ticket number" is always one tap away, and takes over after 10 seconds without a read or when the
 * camera can't be used. Refusals are calm and never a bogey.
 */
function ClaimScanner({
  view,
  pastGame,
  paperWinner,
  onPickByName,
  onCheck,
  onClose,
}: {
  view: TambolaView;
  /** N1: the name of the paper player who holds this ticket and can still win this prize, or null. */
  paperWinner: (ticket: number, pattern: Pattern) => string | null;
  /** N1: opens the name list for this prize, as in paper games. */
  onPickByName: (pattern: Pattern) => void;
  /** UX list row 23 (TAM-179): what this phone's History says about another game's code, if anything. */
  pastGame: (code: string) => string | null;
  /** Checks the claim; returns why it was refused, or null once it is recorded. `proof` is for the screen only. */
  onCheck: (ticket: number, pattern: Pattern, proof: ClaimProof) => string | null;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [typed, setTyped] = useState(false);
  const [failed, setFailed] = useState<CameraFailure | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [refused, setRefused] = useState<{ reason: string; checkByNumber?: number; info?: boolean; byName?: Pattern } | null>(null);
  // N1: a refused claim for a paper ticket whose player can still win offers the name list instead of a dead end.
  // Only the rules' "plays on paper" refusal does this; every other refusal (a claim that doesn't match its ticket,
  // a prize already won, a ticket that is out) keeps its own words and offers.
  const refuse = (reason: string, ticket?: number, claimed?: Pattern, checkByNumber?: number) => {
    // The rules give no code for this refusal, so the text is matched exactly. It depends on the string
    // "Ticket N plays on paper now: record the anchor's decision with Record a win." in rules/codes.ts (readClaim)
    // and rules/rules.ts (checkClaim); if that wording changes, change it here too.
    const paperRefusal =
      ticket !== undefined &&
      claimed !== undefined &&
      checkByNumber === undefined &&
      reason === `Ticket ${ticket} plays on paper now: record the anchor's decision with Record a win.`;
    if (!paperRefusal) {
      setRefused(checkByNumber !== undefined ? { reason, checkByNumber } : { reason });
      return;
    }
    // A QR claim's check (readClaim) does not know Second Full House waits for Full House; say so plainly.
    if (claimed === 'second-full-house' && view.openPatterns.includes('full-house')) {
      setRefused({ reason: 'Second Full House can be won once Full House is closed.' });
      return;
    }
    const name = paperWinner(ticket, claimed);
    if (name !== null) {
      setRefused({ reason: `Ticket ${ticket} plays on paper: pick ${name} by name if the anchor agrees.`, byName: claimed });
      return;
    }
    // While a won prize waits to be closed, Record a win is hidden, so the rules' words would point nowhere.
    if (view.awaitingClose.length > 0) {
      const holder = view.players.find((p) => p.id === view.tickets.find((t) => t.number === ticket)?.playerId);
      const won = holder !== undefined && view.claims.some((c) => c.pattern === claimed && c.verdict === 'accepted' && c.playerId === holder.id);
      setRefused({
        reason: won
          ? `${holder.name} has already won ${PATTERN_NAMES[claimed]}.`
          : `Ticket ${ticket} plays on paper and can't win ${PATTERN_NAMES[claimed]} now.`,
      });
      return;
    }
    setRefused({ reason });
  };
  const [number, setNumber] = useState('');
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [attempt, setAttempt] = useState(0);
  const onRead = useRef<(text: string) => void>(() => {});
  onRead.current = (text: string) => {
    const r = readClaim(view, text);
    const d = r.ok ? null : decodeClaim(text);
    if (d?.ok && d.claim.game !== view.code) {
      // UX list row 23 (TAM-179): another game's claim, looked up in this phone's History; calm, never a bogey.
      setRefused({ reason: pastGame(d.claim.game) ?? (r.ok ? '' : r.reason), info: true });
      return;
    }
    if (!r.ok) {
      if (d?.ok) refuse(r.reason, d.claim.ticket, d.claim.pattern, r.checkByNumber);
      else refuse(r.reason, undefined, undefined, r.checkByNumber);
      return;
    }
    const why = onCheck(r.ticket, r.pattern, 'qr');
    if (why) refuse(why, r.ticket, r.pattern);
  };
  useEscape(onClose);

  useEffect(() => {
    let done = false;
    const stop = startScanner(
      videoRef.current,
      (text) => {
        if (done) return;
        done = true;
        stop();
        onRead.current(text);
      },
      (why) => setFailed(why),
    );
    const timer = setTimeout(() => setTimedOut(true), NO_READ_MS);
    return () => {
      done = true;
      clearTimeout(timer);
      stop();
    };
  }, [attempt]);

  const claimable = view.openPatterns.filter((p) => p !== 'second-full-house' || !view.openPatterns.includes('full-house'));
  const fallback = failed !== null || timedOut;
  const showTyped = typed || fallback;
  const check = () => {
    const n = Number(number.trim());
    if (number.trim() === '' || !Number.isFinite(n)) return setRefused({ reason: 'Type the ticket number.' });
    if (!pattern) return setRefused({ reason: 'Pick the prize.' });
    const why = onCheck(n, pattern, 'typed');
    if (why) refuse(why, n, pattern);
  };

  return (
    <div className="backdrop sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Scan a claim" data-testid="claim-scanner">
        <h2 className="section-title">Scan a claim</h2>
        {refused ? (
          <div className="claim-refused stack-tight" data-testid="claim-refused" role="status">
            <p className="lead">
              {refused.info && (
                <span className="claim-info" aria-hidden="true">
                  ⓘ{' '}
                </span>
              )}
              {refused.reason}
            </p>
            <div className="row">
              {refused.byName !== undefined && (
                <button type="button" className="button" onClick={() => onPickByName(refused.byName!)}>
                  Pick the winner by name
                </button>
              )}
              <button type="button" className={refused.byName !== undefined ? 'button button-quiet' : 'button'} onClick={onClose}>
                Close
              </button>
              {refused.checkByNumber !== undefined && (
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => {
                    setNumber(String(refused.checkByNumber));
                    setTyped(true);
                    setRefused(null);
                  }}
                >
                  Check ticket {refused.checkByNumber} by number
                </button>
              )}
              <button
                type="button"
                className="button button-quiet"
                onClick={() => {
                  setRefused(null);
                  setAttempt((a) => a + 1);
                }}
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            {!showTyped && (
              <div className="scanner-frame">
                <video ref={videoRef} className="scanner-video" muted playsInline />
                <p className="note">Point the camera at the player's claim QR.</p>
              </div>
            )}
            {fallback && <p className="lead">Enter the ticket number instead</p>}
            {showTyped && (
              <>
                <label className="field">
                  <span>Ticket number</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && number.trim() !== '' && pattern !== null && check()}
                  />
                </label>
                <div className="choice-grid">
                  {claimable.map((p) => (
                    // PLT-301, TAM-178: the chosen prize shows an outline, a ✓ and a tint, never the look of "Check".
                    <button
                      key={p}
                      type="button"
                      className={p === pattern ? 'button button-quiet pick pick-on' : 'button button-quiet pick'}
                      aria-pressed={p === pattern}
                      onClick={() => setPattern(p)}
                    >
                      {p === pattern ? `✓ ${PATTERN_NAMES[p]}` : PATTERN_NAMES[p]}
                    </button>
                  ))}
                </div>
                {/* TAM-178: "Check" works only once a ticket number and a prize are filled in. */}
                <button type="button" className="button" disabled={number.trim() === '' || !pattern} onClick={check}>
                  Check
                </button>
              </>
            )}
          </>
        )}
        {!refused && (
          <div className="row">
            {!showTyped && (
              <button type="button" className="button button-quiet" onClick={() => setTyped(true)}>
                Enter ticket number
              </button>
            )}
            <button type="button" className="button button-quiet" onClick={onClose}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Menu → Tickets (TAM-056, host only): every ticket, its owner, "Change owner" and "Switch to paper". */
function HostTickets({
  view,
  onAssign,
  onPaper,
  onClose,
}: {
  view: TambolaView;
  onAssign: (ticket: number, playerId: string) => string | null;
  onPaper: (playerId: string) => string | null;
  onClose: () => void;
}) {
  const [changing, setChanging] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameOf = (id: string | undefined) => view.players.find((p) => p.id === id)?.name ?? '';
  const STATUS = { 'in-play': '', out: ' · out', paper: ' · on paper' } as const;
  return (
    <>
      <div className="row sheet-head">
        <h2 className="section-title grow">Tickets</h2>
        <button type="button" className="button button-quiet" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="note">Only this phone has this list. Game {view.code}.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <ul className="host-tickets">
        {view.tickets.map((t) => (
          <li key={t.number} className="host-ticket" data-testid="host-ticket" data-ticket={t.number}>
            <p className="host-ticket-line">
              <strong>Ticket {t.number}</strong> · {nameOf(t.playerId)}
              {STATUS[t.status ?? 'in-play']}
            </p>
            <TicketGrid rows={t.rows} cell={30} className="ticket-small" />
            <div className="row">
              <button type="button" className="button button-quiet" onClick={() => setChanging(changing === t.number ? null : t.number)}>
                Change owner of ticket {t.number}
              </button>
              {t.status !== 'paper' && (
                <button type="button" className="button button-quiet" onClick={() => setError(onPaper(t.playerId!))}>
                  Switch to paper ({nameOf(t.playerId)})
                </button>
              )}
            </div>
            {changing === t.number && (
              <div className="choice-grid">
                {view.players
                  .filter((p) => p.id !== t.playerId)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="button button-quiet"
                      onClick={() => {
                        const why = onAssign(t.number, p.id);
                        setError(why);
                        if (!why) setChanging(null);
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
