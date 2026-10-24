// D7 the Players sheet (SWD-127, SWD-014, SWD-123) with D7a "Who gives clues for … now?" and D7b the team-of-one
// question. Opened from the game menu at every step that has "Players" and at game over. Each confirmed change is
// handed to `onChange` (one `setPlayers`); toasts are the caller's, so they outlive the sheet.
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import type { SecretWordsState, Team } from '../../rules';
import { SwMain, useGuard } from '../shared/guard';
import { SwDialog } from '../shared/parts';
import { otherTeam, TEAMS } from '../teams';
import {
  add, canRemove, canSwitch, duplicateOf, duplicateText, isGuesser, MAX_NAME, MAX_PLAYERS, planMoveOver, planRemove, rename,
  restore, switchTeam, teamOf, type PlayersChange, type RemovePlan,
} from './players';

export interface PlayersToast {
  readonly text: string;
  /** "Undo" (records another change). */
  readonly undo?: () => void;
}

export function PlayersSheet({
  state,
  atGameOver,
  onChange,
  onToast,
  onEndGame,
  onDone,
  toast,
}: {
  state: SecretWordsState;
  atGameOver: boolean;
  /** Records one `setPlayers`; false when the rules refuse it. */
  onChange: (c: PlayersChange) => boolean;
  onToast: (t: PlayersToast) => void;
  /** D7b mid-game: "End the game" opens SWD-054's dialog. */
  onEndGame: () => void;
  onDone: () => void;
  /** The current toast, shown between the list and "Done" (never over either). */
  toast?: ReactNode;
}) {
  const id = useId();
  const names = state.teams.names;
  const until = useGuard('players');
  const [editing, setEditing] = useState<{ name: string; text: string; dup: string | null } | null>(null);
  const [text, setText] = useState('');
  const [guessOnly, setGuessOnly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [giver, setGiver] = useState<{ plan: Extract<RemovePlan, { kind: 'giver' }>; removed: string; chosen: string | null } | null>(null);
  const [alone, setAlone] = useState<{ plan: Extract<RemovePlan, { kind: 'alone' }>; removed: string } | null>(null);
  const child = giver !== null || alone !== null;

  useEffect(() => {
    if (child) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [child, onDone]);

  const left = (removed: string, before: SecretWordsState) => onToast({ text: `${removed} left · Undo`, undo: () => onChange(restore(before)) });

  const doPlan = (plan: RemovePlan | null, removed: string) => {
    if (!plan) return;
    const before = state;
    if (plan.kind === 'apply') {
      if (onChange(plan.change)) left(removed, before);
    } else if (plan.kind === 'giver') {
      setGiver({ plan, removed, chosen: plan.preselect });
    } else {
      setAlone({ plan, removed });
    }
  };

  const saveRename = () => {
    if (!editing) return;
    const to = editing.text.trim();
    if (to === '' || to === editing.name) {
      setEditing(null);
      return;
    }
    const dup = duplicateOf(state, to, editing.name);
    if (dup) {
      setEditing({ ...editing, dup });
      return;
    }
    const c = rename(state, editing.name, to);
    if (c && onChange(c)) setEditing(null);
  };

  const addTo = (team: Team) => {
    const name = text.trim();
    if (name === '') return;
    const dup = duplicateOf(state, name);
    if (dup) {
      setMessage(duplicateText(dup));
      return;
    }
    if (state.players.length >= MAX_PLAYERS) {
      setMessage('20 players is the most.');
      return;
    }
    const c = add(state, name, team, guessOnly);
    if (c && onChange(c)) {
      onToast({ text: `${name} joined ${names[team]}` });
      setText('');
      setGuessOnly(false);
      setMessage(null);
    }
  };

  return (
    <div className="sw-backdrop sw-players-backdrop">
      <div className="sw-dialog sw-players" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <h1 id={`${id}-title`} className="sw-dlg-heading">
          Players
        </h1>
        {/* RC fix: the list scrolls inside; "Done" stays pinned under it, and a toast sits above "Done", never over it. */}
        <div className="sw-players-scroll">
        {TEAMS.map((team) => (
          <section key={team} className="sw-players-team">
            <h2 className={`sw-heading2 sw-ink-${team}`}>{names[team]}</h2>
            <ul className="sw-players-list">
              {state.teams[team].map((p) => {
                const isEditing = editing?.name === p;
                return (
                  <li key={p} className="sw-players-row">
                    {isEditing ? (
                      <form
                        className="sw-players-edit"
                        onSubmit={(e: FormEvent) => {
                          e.preventDefault();
                          saveRename();
                        }}
                      >
                        <input
                          className="sw-clue-input"
                          aria-label="Player name"
                          value={editing.text}
                          maxLength={MAX_NAME}
                          autoComplete="off"
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, text: e.target.value, dup: null })}
                        />
                        <button type="submit" className="sw-quiet">
                          Done
                        </button>
                        {editing.dup && (
                          <p role="alert" className="sw-alert sw-players-msg">
                            {duplicateText(editing.dup)}
                          </p>
                        )}
                      </form>
                    ) : (
                      <button type="button" className="sw-players-name" aria-label={`Rename ${p}`} onClick={() => setEditing({ name: p, text: p, dup: null })}>
                        {p}
                      </button>
                    )}
                    <span className="sw-players-acts">
                    {isGuesser(state.teams, p) && (
                      <button
                        type="button"
                        className="sw-quiet sw-players-switch"
                        aria-label={`Move ${p} to ${names[otherTeam(team)]}`}
                        disabled={!canSwitch(state, p)}
                        onClick={() => {
                          const before = state;
                          const c = switchTeam(state, p);
                          if (c && onChange(c)) onToast({ text: `${p} moved to ${names[otherTeam(team)]} · Undo`, undo: () => onChange(restore(before)) });
                        }}
                      >
                        Switch team
                      </button>
                    )}
                    <button
                      type="button"
                      className="sw-remove sw-players-remove"
                      aria-label={`Remove ${p}`}
                      disabled={!canRemove(state, p)}
                      onClick={() => doPlan(planRemove(state, p), p)}
                    >
                      ✕
                    </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <div className="sw-players-add">
          <input
            className="sw-clue-input"
            aria-label="Player name"
            placeholder="Type a name…"
            value={text}
            maxLength={MAX_NAME}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            onChange={(e) => {
              setText(e.target.value);
              setMessage(null);
            }}
            onKeyDown={(e) => {
              // RC fix: Enter adds the name, as on "Who's playing?": to the team with fewer players (orange on a tie).
              if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
              e.preventDefault();
              addTo(state.teams.teal.length < state.teams.orange.length ? 'teal' : 'orange');
            }}
          />
          <button type="button" role="switch" aria-checked={guessOnly} aria-label="Doesn't give clues" className="sw-switch" onClick={() => setGuessOnly(!guessOnly)}>
            <span className="sw-switch-label">Doesn't give clues</span>
            <span className={guessOnly ? 'sw-switch-track sw-switch-on' : 'sw-switch-track'} aria-hidden="true">
              <span className="sw-switch-thumb" />
            </span>
          </button>
          {TEAMS.map((team) => (
            <button key={team} type="button" className="sw-quiet sw-full" disabled={text.trim() === ''} onClick={() => addTo(team)}>
              Add to {names[team]}
            </button>
          ))}
          {message && <p className="sw-alert sw-players-msg">{message}</p>}
        </div>
        </div>
        {toast}
        <SwMain className="sw-main-inline" until={until} onClick={onDone}>
          Done
        </SwMain>
      </div>
      {giver && (
        <GiverDialog
          teamName={names[giver.plan.team]}
          options={giver.plan.options}
          chosen={giver.chosen}
          onChoose={(p) => setGiver({ ...giver, chosen: p })}
          onCancel={() => setGiver(null)}
          onDone={() => {
            if (!giver.chosen) return;
            const before = state;
            const c = giver.plan.finish(giver.chosen);
            setGiver(null);
            if (c && onChange(c)) left(giver.removed, before);
          }}
        />
      )}
      {alone && (
        <AloneDialog
          teamName={names[alone.plan.team]}
          otherTeam={names[alone.plan.team === 'orange' ? 'teal' : 'orange']}
          left={alone.plan.left}
          removed={alone.removed}
          movers={alone.plan.movers}
          atGameOver={atGameOver}
          onMove={(m) => {
            const removed = alone.removed;
            setAlone(null);
            doPlan(planMoveOver(state, removed, m), removed);
          }}
          onKeep={() => setAlone(null)}
          onEndGame={() => {
            setAlone(null);
            onEndGame();
          }}
        />
      )}
    </div>
  );
}

/** D7a: "Who gives clues for Coffee Commandos now?"; closing without "Done" cancels the removal. */
function GiverDialog({
  teamName,
  options,
  chosen,
  onChoose,
  onCancel,
  onDone,
}: {
  teamName: string;
  options: readonly string[];
  chosen: string | null;
  onChoose: (p: string) => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const until = useGuard('giver');
  return (
    <SwDialog title={`Who gives clues for ${teamName} now?`} onDismiss={onCancel}>
      <div className="sw-dialog-buttons">
        {options.map((p) => (
          <button key={p} type="button" className={p === chosen ? 'sw-pick-option sw-selected' : 'sw-pick-option'} aria-pressed={p === chosen} onClick={() => onChoose(p)}>
            {p === chosen && (
              <span className="sw-tick" aria-hidden="true">
                ✓{' '}
              </span>
            )}
            {p}
          </button>
        ))}
        <SwMain className="sw-main-inline" until={until} disabled={chosen === null} onClick={onDone}>
          Done
        </SwMain>
      </div>
    </SwDialog>
  );
}

/** D7b: "Coffee Commandos would be left with only Arjun. Move someone over?" */
function AloneDialog({
  teamName,
  otherTeam,
  left,
  removed,
  movers,
  atGameOver,
  onMove,
  onKeep,
  onEndGame,
}: {
  teamName: string;
  otherTeam: string;
  left: string;
  removed: string;
  movers: readonly string[];
  atGameOver: boolean;
  onMove: (p: string) => void;
  onKeep: () => void;
  onEndGame: () => void;
}) {
  const until = useGuard('alone');
  return (
    <SwDialog title={`${teamName} would have only ${left} left. Move someone from ${otherTeam}?`} onDismiss={onKeep}>
      <div className="sw-dialog-buttons">
        {movers.length === 0 && <p>No one can move over.</p>}
        {movers.map((p) => (
          <button key={p} type="button" className="sw-quiet sw-full" onClick={() => onMove(p)}>
            Move {p} over
          </button>
        ))}
        {movers.length === 0 && !atGameOver && (
          <button type="button" className="sw-quiet sw-full" onClick={onEndGame}>
            End the game
          </button>
        )}
        <SwMain className="sw-main-inline" until={until} onClick={onKeep}>
          Don't remove {removed}
        </SwMain>
      </div>
    </SwDialog>
  );
}

export { teamOf };
