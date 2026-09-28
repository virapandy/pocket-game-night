// The host phone during a game: calling (TAM-010 to TAM-017), the board, the room view (TAM-107),
// checking paper-ticket claims (TAM-037), closing prizes by hand (TAM-145), undo, end and discard.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HOST, play, undo, type Preferences, type SavedGameStore } from '../../../engine';
import {
  NEEDS,
  PATTERN_NAMES,
  tambolaRules,
  type ClaimView,
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
const NEXT_COOLDOWN_MS = 300;

type ClaimPanel =
  | { kind: 'claim'; step: 'player' | 'pattern' | 'numbers'; playerId?: string; pattern?: Pattern; text: string; error?: string }
  | { kind: 'result'; index: number };

type Dialog = { kind: 'end' } | { kind: 'discard' } | { kind: 'undo-claim'; index: number };

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
  const [panel, setPanel] = useState<ClaimPanel | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(startDialog ? { kind: startDialog } : null);
  const [room, setRoom] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [device, setDevice] = useState<TambolaSettings>(() => loadSettings(prefs));
  const [cooldown, setCooldown] = useState(false);
  const [wakeRefused, setWakeRefused] = useState(false);
  const [showResumed, setShowResumed] = useState(resumed);
  const [flash, setFlash] = useState(0);
  const [, setNow] = useState(0);
  const cooling = useRef(false);

  const view = tambolaRules.view(match.state, { kind: 'host' });
  const over = view.over;

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

  // TAM-119: "Undo last call" shows for 5 seconds after a call, if nothing else happened since.
  const lastRecord = match.records[match.records.length - 1];
  const undoCallLeft = lastRecord?.move.type === 'call' && !over ? lastRecord.at + CALL_UNDO_MS - Date.now() : -1;
  useEffect(() => {
    if (undoCallLeft < 0) return;
    const t = setTimeout(() => setNow(Date.now()), undoCallLeft + 50);
    return () => clearTimeout(t);
  }, [lastRecord, undoCallLeft]);

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
    if (cooling.current || !canCall) return;
    const r = move({ type: 'call' });
    if (!r.ok) return;
    // TAM-101: stays disabled until the new number is on screen, so a double tap calls one number.
    cooling.current = true;
    setCooldown(true);
    setTimeout(() => {
      cooling.current = false;
      setCooldown(false);
    }, NEXT_COOLDOWN_MS);
    setPanel(null);
    setShowResumed(false);
    feel();
  };

  if (room) return <RoomView view={tambolaRules.view(match.state, { kind: 'room' })} names={nameOf} onBack={() => setRoom(false)} />;

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

  const claimCount = view.claims.length;
  const wonCount = new Set(view.claims.filter((c) => c.verdict === 'accepted').map((c) => c.pattern)).size;
  const claimRecordSeq = (index: number) => match.records.filter((r) => r.move.type === 'claim')[index]?.seq;
  const claimable = view.openPatterns.filter((p) => p !== 'second-full-house' || !view.openPatterns.includes('full-house'));

  const checkClaim = () => {
    if (panel?.kind !== 'claim' || !panel.playerId || !panel.pattern) return;
    const numbers = (panel.text.match(/\d+/g) ?? []).map(Number);
    const r = move({ type: 'claim', playerId: panel.playerId, pattern: panel.pattern, numbers });
    if (!r.ok) {
      setPanel({ ...panel, error: r.reason });
      return;
    }
    feel();
    setPanel({ kind: 'result', index: claimCount });
  };

  return (
    <main className="screen play">
      <header className="top-bar wrap">
        <button type="button" className="button button-quiet" onClick={onHome}>
          ← Home
        </button>
        <button type="button" className="button button-quiet" onClick={() => setSettingsOpen(true)}>
          Settings
        </button>
        {!view.readyToEnd && (
          <button type="button" className="button button-quiet" onClick={() => setDialog({ kind: 'end' })}>
            End game
          </button>
        )}
        <button type="button" className="button button-quiet" onClick={() => setDialog({ kind: 'discard' })}>
          Discard game
        </button>
      </header>

      {showResumed && (
        <p className="banner" role="status">
          Game resumed
        </p>
      )}
      {wakeRefused && <p className="note">Keep your screen on: this phone may let the screen sleep during the game.</p>}
      {view.allCalled && (
        <p className="banner" role="status">
          All 90 numbers called. Every ticket is now a Full House: check the last claims, then end the game.
        </p>
      )}

      <section className="call" aria-label="Current number">
        <div key={flash} className="current-number flash" data-testid="current-number">
          {view.current ? view.current.number : ''}
        </div>
        <p className="current-rhyme" data-testid="current-rhyme">
          {view.current?.rhyme?.text ?? ''}
        </p>
        {!view.current && <p className="note">Tap Next number to call the first number.</p>}
        <div className="row">
          <button type="button" className="button button-quiet" disabled={!view.current} onClick={() => setFlash((f) => f + 1)}>
            Repeat
          </button>
          <button type="button" className="button button-quiet" disabled={!view.current} onClick={() => move({ type: 'another-rhyme' })}>
            Another rhyme
          </button>
          {undoCallLeft >= 0 && lastRecord && (
            <button
              type="button"
              className="button button-quiet"
              onClick={() => {
                const r = undo(tambolaRules, match, lastRecord.seq, { by: HOST, now: Date.now() });
                if (r.ok) commit(r.value);
              }}
            >
              Undo last call
            </button>
          )}
        </div>
        <LastCalls numbers={view.lastCalls} />
      </section>

      <div className="row">
        <button type="button" className="button" onClick={() => setRoom(true)}>
          Show the room
        </button>
        <button type="button" className="button" onClick={() => setPanel({ kind: 'claim', step: 'player', text: '' })}>
          Check a claim
        </button>
      </div>

      {panel?.kind === 'claim' && (
        <section className="panel" aria-label="Check a claim">
          {panel.step === 'player' && (
            <>
              <h2 className="section-title">Who is claiming?</h2>
              <div className="chips">
                {view.players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="button button-quiet"
                    onClick={() => setPanel({ ...panel, playerId: p.id, step: panel.pattern ? 'numbers' : 'pattern', text: '' })}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {panel.step === 'pattern' && (
            <>
              <h2 className="section-title">{nameOf(panel.playerId ?? '')} claims</h2>
              <div className="chips">
                {claimable.map((p) => (
                  <button key={p} type="button" className="button button-quiet" onClick={() => setPanel({ ...panel, pattern: p, step: 'numbers' })}>
                    {PATTERN_NAMES[p]}
                  </button>
                ))}
              </div>
            </>
          )}
          {panel.step === 'numbers' && panel.pattern && (
            <>
              <h2 className="section-title">
                {nameOf(panel.playerId ?? '')}: {PATTERN_NAMES[panel.pattern]}
              </h2>
              <label className="field">
                <span>Numbers read out</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  placeholder={`The ${NEEDS[panel.pattern]} numbers, with spaces`}
                  value={panel.text}
                  onChange={(e) => {
                    const { error: _drop, ...rest } = panel;
                    setPanel({ ...rest, text: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') checkClaim();
                  }}
                />
              </label>
              {panel.error && (
                <p className="error" role="alert">
                  {panel.error}
                </p>
              )}
              <button type="button" className="button" onClick={checkClaim}>
                Check
              </button>
            </>
          )}
          <button type="button" className="button button-quiet" onClick={() => setPanel(null)}>
            Cancel
          </button>
        </section>
      )}

      {panel?.kind === 'result' && view.claims[panel.index] && (
        <ClaimResult
          claim={view.claims[panel.index]!}
          view={view}
          money={match.setup.config.money !== null}
          nameOf={nameOf}
          onUndo={() => setDialog({ kind: 'undo-claim', index: panel.index })}
        />
      )}

      {view.awaitingClose.length > 0 && (
        <section className="panel" aria-label="Prizes won">
          {view.awaitingClose.map((p) => (
            <div key={p} className="stack-tight">
              <p className="lead">
                {PATTERN_NAMES[p]} is won. Anyone else with {PATTERN_NAMES[p]} on this number?
              </p>
              <div className="row">
                <button type="button" className="button button-quiet" onClick={() => setPanel({ kind: 'claim', step: 'player', pattern: p, text: '' })}>
                  {view.awaitingClose.length === 1 ? 'Add another winner' : `Add another ${PATTERN_NAMES[p]} winner`}
                </button>
                <button type="button" className="button" onClick={() => move({ type: 'close-tier', pattern: p })}>
                  Close {PATTERN_NAMES[p]}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {view.readyToEnd && (
        <button type="button" className="button button-big" onClick={() => move({ type: 'end' })}>
          End game and show payouts
        </button>
      )}

      <Prizes view={view} money={match.setup.config.money !== null} />
      <Board called={view.called} />

      <div className="next-spacer" aria-hidden="true" />
      <button type="button" className="button next-number" disabled={cooldown || !canCall} onClick={onNext}>
        Next number
      </button>

      {dialog?.kind === 'end' && (
        <Modal onClose={() => setDialog(null)}>
          <p className="lead">End the game and show payouts?</p>
          <p className="note">Prizes not won are shared across the prizes that were won.</p>
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
            <p className="lead">
              {wonCount === 1 ? '1 prize was already won.' : `${wonCount} prizes were already won.`} Discard anyway?
            </p>
          )}
          {match.setup.config.money && <p className="note">Everyone gets their contribution back.</p>}
          <div className="row">
            <button type="button" className="button" onClick={() => (setDialog(null), move({ type: 'discard' }))}>
              Discard game
            </button>
            <button type="button" className="button button-quiet" onClick={() => setDialog(null)}>
              Keep playing
            </button>
          </div>
        </Modal>
      )}
      {dialog?.kind === 'undo-claim' && view.claims[dialog.index] && (
        <Modal onClose={() => setDialog(null)}>
          <p className="lead">
            Undo {nameOf(view.claims[dialog.index]!.playerId)}'s {PATTERN_NAMES[view.claims[dialog.index]!.pattern]} claim? Any prize goes
            back and the numbers called stay called.
          </p>
          <div className="row">
            <button
              type="button"
              className="button"
              onClick={() => {
                const seq = claimRecordSeq(dialog.index);
                setDialog(null);
                if (seq === undefined) return;
                const r = undo(tambolaRules, match, seq, { by: HOST, now: Date.now() });
                if (r.ok) {
                  commit(r.value);
                  setPanel(null);
                }
              }}
            >
              Undo claim
            </button>
            <button type="button" className="button button-quiet" onClick={() => setDialog(null)}>
              Keep it
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function LastCalls({ numbers, big }: { numbers: readonly number[]; big?: boolean }) {
  if (numbers.length === 0) return null;
  return (
    <div className={big ? 'last-calls last-calls-big' : 'last-calls'}>
      <span className="note">Last calls</span>
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

function Prizes({ view, money }: { view: TambolaView; money: boolean }) {
  return (
    <section aria-label="Prizes">
      <h2 className="section-title">Prizes</h2>
      <ul className="prize-list">
        {view.tiers.map((t) => {
          const open = view.openPatterns.includes(t.pattern);
          const waiting = view.awaitingClose.includes(t.pattern);
          return (
            <li key={t.pattern}>
              <strong>{PATTERN_NAMES[t.pattern]}</strong> {money ? rupees(t.amount) : (t.label ?? '')}{' '}
              <span className="note">{waiting ? '· won, not closed yet' : open ? '· open' : '· closed'}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ClaimResult({
  claim,
  view,
  money,
  nameOf,
  onUndo,
}: {
  claim: ClaimView;
  view: TambolaView;
  money: boolean;
  nameOf: (id: string) => string;
  onUndo: () => void;
}) {
  const pattern = PATTERN_NAMES[claim.pattern];
  const tier = view.tiers.find((t) => t.pattern === claim.pattern);
  const winners = view.claims.filter((c) => c.pattern === claim.pattern && c.verdict === 'accepted');
  const others = [...new Set(winners.filter((c) => c !== claim).map((c) => nameOf(c.playerId)))];
  const prize = money ? rupees(claim.prize ?? 0) : tier?.label || pattern;
  return (
    <section className="panel" data-testid="claim-result" aria-live="polite">
      <p className={claim.verdict === 'accepted' ? 'verdict verdict-ok' : 'verdict verdict-bogey'}>
        {claim.verdict === 'accepted' ? '✓ Accepted' : '✗ Bogey'}
      </p>
      <p className="lead">
        {nameOf(claim.playerId)}: {pattern}
      </p>
      <ul className="checks">
        {claim.checks.map((c) => (
          <li key={c.number} data-called={c.called ? 'true' : 'false'} className={c.called ? 'check-ok' : 'check-bad'}>
            {c.number} {c.called ? '✓' : '✗'}
          </li>
        ))}
      </ul>
      {claim.verdict === 'accepted' && (
        <>
          <p className="lead">
            Accepted: {prize} to {nameOf(claim.playerId)}
          </p>
          {winners.length > 1 && (
            <p className="note">
              Shared with {others.join(', ') || 'another ticket'}: {plural(winners.length, 'winner')} split{' '}
              {money ? rupees(tier?.amount ?? 0) : 'the prize'}.
            </p>
          )}
        </>
      )}
      {claim.reason === 'not-called' && <p className="lead">A number marked ✗ has not been called.</p>}
      {claim.reason === 'late' && claim.completedAt !== undefined && (
        <p className="lead">
          {pattern} was complete at {claim.completedAt}. It had to be claimed before the next number.
        </p>
      )}
      <button type="button" className="button button-quiet" onClick={onUndo}>
        Undo this claim
      </button>
    </section>
  );
}

function RoomView({ view, names, onBack }: { view: TambolaView; names: (id: string) => string; onBack: () => void }) {
  const latest = view.claims[view.claims.length - 1];
  return (
    <main className="room" data-testid="room-view" onClick={onBack}>
      <div className="room-number" data-testid="current-number">
        {view.current ? view.current.number : ''}
      </div>
      <p className="room-rhyme" data-testid="current-rhyme">
        {view.current?.rhyme?.text ?? ''}
      </p>
      <LastCalls numbers={view.lastCalls} big />
      {latest && (
        <p className="room-verdict">
          {latest.verdict === 'accepted' ? '✓ Accepted' : '✗ Bogey'}: {names(latest.playerId)}, {PATTERN_NAMES[latest.pattern]}
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

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="backdrop">
      <div className="dialog" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
