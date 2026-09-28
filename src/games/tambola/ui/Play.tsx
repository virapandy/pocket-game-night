// The host phone during a game, on one screen that never scrolls (docs/games/tambola/ux-calling-screen.md,
// TAM-123 to TAM-129, TAM-138): a top bar with Back, the progress and a menu; the number, large; its rhyme;
// the last calls; prize chips; then "Record a win" and "Next number" at the bottom. Paper-ticket wins are
// recorded on the anchor's word (TAM-037); tiers are closed by hand (TAM-145). The board, Show the room,
// Check numbers (TAM-139), Settings, End game and Discard game live in the menu (TAM-124, TAM-127).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HOST, play, undo, type MoveRecord, type Preferences, type SavedGameStore } from '../../../engine';
import {
  checkNumbers,
  NEEDS,
  PATTERN_NAMES,
  tambolaRules,
  type CheckResult,
  type Pattern,
  type TambolaMove,
  type TambolaSettings,
  type TambolaView,
} from '../rules';
import { buzz, keepAwake, tick } from './device';
import { plural, rupees } from './format';
import { toSaved, type TambolaMatch, type TambolaSaved } from './saved';
import { loadSettings, saveSettings, SettingsPanel } from './Settings';
import { Summary } from './Summary';

const CALL_UNDO_MS = 5_000;
/** TAM-101: two taps within half a second call one number. */
const NEXT_COOLDOWN_MS = 500;
/** A press on the number this long opens Show the room (TAM-124). */
const LONG_PRESS_MS = 600;
/** TAM-128: the screen-sleep tip is shown once per phone. */
const SLEEP_TIP_KEY = 'tambola.sleep-tip.seen';

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
      error?: string;
    };

type Sheet =
  | { kind: 'menu' }
  | { kind: 'record'; sheet: RecordSheet }
  | { kind: 'check'; pattern?: Pattern; text: string; result?: CheckResult }
  | { kind: 'board' };

type Dialog = { kind: 'end' } | { kind: 'discard' } | { kind: 'undo-record'; seq: number };

type TambolaRecord = MoveRecord<TambolaMove>;
const isRecording = (r: TambolaRecord) => r.move.type === 'record-win' || r.move.type === 'record-bogey';

export function Play({
  initialSaved,
  initialMatch,
  store,
  prefs,
  resumed,
  startDialog,
  onHome,
  onPlayAgain,
}: {
  initialSaved: TambolaSaved;
  initialMatch: TambolaMatch;
  store: SavedGameStore;
  prefs: Preferences;
  resumed: boolean;
  startDialog?: 'end' | 'discard';
  onHome: () => void;
  onPlayAgain: (saved: TambolaSaved) => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [match, setMatch] = useState(initialMatch);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(startDialog ? { kind: startDialog } : null);
  /** The recorded win or bogey shown on screen, by its move's number. */
  const [resultSeq, setResultSeq] = useState<number | null>(null);
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
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const view = tambolaRules.view(match.state, { kind: 'host' });
  const over = view.over;
  const money = match.setup.config.money !== null;

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
      <main className="screen">
        <header className="top-bar">
          <button type="button" className="button button-quiet" onClick={onHome}>
            ← Home
          </button>
        </header>
        <Summary view={view} />
        <button type="button" className="button button-big" onClick={() => onPlayAgain(saved)}>
          Play again
        </button>
      </main>
    );
  }

  const nameOf = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;
  const canCall = tambolaRules.legalMoves(match.state, HOST).some((m) => m.type === 'call');
  const onNext = () => {
    // TAM-101: a second tap within half a second draws nothing. This compares times rather than
    // trusting a flag, so a late timer can never leave the button stuck.
    if (sinceLastCall(lastCallAt.current) < NEXT_COOLDOWN_MS || !canCall) return;
    const r = move({ type: 'call' });
    if (!r.ok) return;
    lastCallAt.current = performance.now();
    const rec = r.value.records[r.value.records.length - 1];
    setToastSeq(rec ? rec.seq : null);
    setCooldown(true);
    setResultSeq(null);
    setShowResumed(false);
    feel();
  };

  if (room) {
    return <RoomView view={tambolaRules.view(match.state, { kind: 'room' })} money={money} names={nameOf} fromPress={room === 'press'} onBack={() => setRoom(false)} />;
  }

  if (settingsOpen) {
    return (
      <main className="screen">
        <SettingsPanel
          settings={device}
          inGame
          onChange={(next) => {
            setDevice(next);
            saveSettings(prefs, next);
          }}
          onDone={() => setSettingsOpen(false)}
        >
          <RenamePlayers view={view} rename={(playerId, name) => move({ type: 'rename', playerId, name })} />
        </SettingsPanel>
      </main>
    );
  }

  const wonCount = new Set(view.claims.filter((c) => c.verdict === 'accepted').map((c) => c.pattern)).size;
  const claimable = view.openPatterns.filter((p) => p !== 'second-full-house' || !view.openPatterns.includes('full-house'));
  const waiting = view.awaitingClose[0];
  const result = resultSeq === null ? undefined : (match.records.find((r) => r.seq === resultSeq) as TambolaRecord | undefined);
  const showTip = wakeRefused && !tipSeen;
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

  let main: ReactNode;
  if (view.readyToEnd) {
    main = (
      <button type="button" className="button next-number" onClick={() => move({ type: 'end' })}>
        End game and show payouts
      </button>
    );
  } else if (waiting) {
    main = (
      <button type="button" className="button next-number" disabled>
        Close {PATTERN_NAMES[waiting]} first
      </button>
    );
  } else {
    main = (
      <button
        type="button"
        className="button next-number"
        disabled={(cooldown && sinceLastCall(lastCallAt.current) < NEXT_COOLDOWN_MS) || !canCall}
        onClick={onNext}
      >
        Next number
      </button>
    );
  }

  return (
    <main className="play">
      <header className="play-bar" data-testid="top-bar">
        <button type="button" className="bar-button" onClick={onHome}>
          ← Back
        </button>
        <span className="bar-progress">{view.allCalled ? 'All 90 numbers called' : `${called} of 90 called`}</span>
        {wakeRefused && !showTip && <span className="bar-sleep">☾ Screen may sleep</span>}
        <button
          type="button"
          className="bar-button"
          aria-haspopup="menu"
          aria-expanded={sheet?.kind === 'menu'}
          onClick={() => setSheet(sheet?.kind === 'menu' ? null : { kind: 'menu' })}
        >
          ⋯ Menu
        </button>
      </header>

      <section className="stage" aria-label="Current number">
        <div
          key={flash}
          className="current-number flash"
          data-testid="current-number"
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onPointerCancel={endPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          {view.current ? view.current.number : ''}
        </div>
        <div className="stage-side">
          {!view.current && <p className="note first-hint">Tap Next number to call the first number.</p>}
          <p className="current-rhyme" data-testid="current-rhyme">
            {view.current?.rhyme?.text ?? ''}
          </p>
          <div className="rhyme-actions">
            <button type="button" className="text-button" disabled={!view.current} onClick={() => setFlash((f) => f + 1)}>
              Repeat
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" className="text-button" disabled={!view.current} onClick={() => move({ type: 'another-rhyme' })}>
              Another rhyme
            </button>
          </div>
          <LastCalls numbers={view.lastCalls} />
          <PrizeChips view={view} names={nameOf} onClose={(p) => move({ type: 'close-tier', pattern: p })} />
        </div>

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

        {result && isRecording(result) && (
          <ResultCard
            record={result}
            view={view}
            money={money}
            nameOf={nameOf}
            onUndo={() => setDialog({ kind: 'undo-record', seq: result.seq })}
            onAdd={(pattern) =>
              setSheet({
                kind: 'record',
                sheet: { step: 'players', pattern, picked: [], adding: true },
              })
            }
            onCloseTier={(pattern) => move({ type: 'close-tier', pattern })}
            onDone={() => setResultSeq(null)}
          />
        )}
      </section>

      <div className="play-bottom">
        {toastLeft >= 0 && lastRecord && view.current && (
          <div className="toast" data-testid="undo-toast">
            Called {view.current.number} ·{' '}
            <button
              type="button"
              className="toast-button"
              onClick={() => {
                if (undoRecord(lastRecord.seq)) setToastSeq(null);
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
        <button
          type="button"
          className="button button-quiet record-win"
          onClick={() => {
            setResultSeq(null);
            setSheet({ kind: 'record', sheet: { step: 'pattern' } });
          }}
        >
          Record a win
        </button>
        {main}
      </div>

      {sheet?.kind === 'menu' && (
        <MenuSheet
          onClose={() => setSheet(null)}
          items={[
            ['Settings', () => setSettingsOpen(true)],
            ['Show the room', () => setRoom('menu')],
            ['Board', () => setSheet({ kind: 'board' })],
            ['Check numbers', () => setSheet({ kind: 'check', text: '' })],
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
            <button type="button" className="button" onClick={() => (setDialog(null), move({ type: 'end' }))}>
              End game
            </button>
            <button type="button" className="button button-quiet" onClick={() => setDialog(null)}>
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
            <button type="button" className="button" onClick={() => (setDialog(null), move({ type: 'discard' }))}>
              Discard game
            </button>
            <button type="button" className="button button-quiet" onClick={() => setDialog(null)}>
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

function MenuSheet({
  items,
  onClose,
  setSheet,
}: {
  items: [string, () => void][];
  onClose: () => void;
  setSheet: (s: Sheet | null) => void;
}) {
  useEscape(onClose);
  return (
    <div className="menu-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="menu" role="dialog" aria-modal="true" aria-label="Menu">
        <div role="menu" aria-label="Game menu" className="menu-list">
          {items.map(([label, act]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className="menu-item"
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

function PickPlayers({
  sheet,
  view,
  onChange,
  onBack,
  onCancel,
  onConfirm,
  onBogey,
}: {
  sheet: Extract<RecordSheet, { step: 'players' }>;
  view: TambolaView;
  onChange: (next: Extract<RecordSheet, { step: 'players' }>) => void;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onBogey: () => void;
}) {
  const name = PATTERN_NAMES[sheet.pattern];
  const already = new Set(view.claims.filter((c) => c.pattern === sheet.pattern && c.verdict === 'accepted').map((c) => c.playerId));
  const players = view.players.filter((p) => !already.has(p.id));
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
      <p className="note">Tap one name, or several for a tie. For a false claim, tap the name and then Bogey.</p>
      <div className="choice-grid">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            className={sheet.picked.includes(p.id) ? 'button pick picked' : 'button button-quiet pick'}
            aria-pressed={sheet.picked.includes(p.id)}
            onClick={() => toggle(p.id)}
          >
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
            className={p === pattern ? 'button pick picked' : 'button button-quiet pick'}
            aria-pressed={p === pattern}
            onClick={() => onChange({ pattern: p, text: state.text })}
          >
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

function ResultCard({
  record,
  view,
  money,
  nameOf,
  onUndo,
  onAdd,
  onCloseTier,
  onDone,
}: {
  record: TambolaRecord;
  view: TambolaView;
  money: boolean;
  nameOf: (id: string) => string;
  onUndo: () => void;
  onAdd: (pattern: Pattern) => void;
  onCloseTier: (pattern: Pattern) => void;
  onDone: () => void;
}) {
  const m = record.move;
  if (m.type !== 'record-win' && m.type !== 'record-bogey') return null;
  const pattern = m.pattern;
  const name = PATTERN_NAMES[pattern];
  const waiting = view.awaitingClose.includes(pattern);
  let headline: string;
  let detail: string | null = null;
  if (m.type === 'record-bogey') {
    headline = `✗ Bogey: ${nameOf(m.playerId)}, ${name}`;
  } else {
    const winners = view.claims.filter((c) => c.pattern === pattern && c.verdict === 'accepted');
    const names = [...new Set(winners.map((c) => nameOf(c.playerId)))];
    const tier = view.tiers.find((t) => t.pattern === pattern);
    if (winners.length === 1) {
      const prize = money ? rupees(winners[0]!.prize ?? 0) : tier?.label;
      headline = `${name}: ✓ ${names.join(', ')}${prize ? `, ${prize}` : ''}`;
    } else {
      headline = `${name}: ✓ ${names.join(', ')}`;
      detail = money
        ? `Shared by ${winners.length}: ${winners.map((c) => rupees(c.prize ?? 0)).join(', ')} (${rupees(tier?.amount ?? 0)} in all)`
        : `Shared by ${winners.length}${tier?.label ? `: ${tier.label}` : ''}`;
    }
  }
  return (
    <section className="result-card" data-testid="claim-result" aria-live="polite">
      <p className={m.type === 'record-win' ? 'verdict verdict-ok' : 'verdict verdict-bogey'}>{headline}</p>
      {detail && <p className="note">{detail}</p>}
      <div className="row">
        {waiting && (
          <>
            <button type="button" className="button button-quiet" onClick={() => onAdd(pattern)}>
              Add another winner
            </button>
            <button type="button" className="button button-quiet button-strong" onClick={() => onCloseTier(pattern)}>
              Close {name}
            </button>
          </>
        )}
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
              <button type="button" className="chip-close" onClick={() => onClose(t.pattern)}>
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
  money,
  names,
  fromPress,
  onBack,
}: {
  view: TambolaView;
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
