// Setup on the host phone: "Who's playing?" (SWD-003, SWD-132), "Make teams" (SWD-004 to SWD-008, SWD-013, SWD-014) with
// its "Clue givers" sheet (SWD-007, SWD-014, SWD-123), and "How do you want to play?" (SWD-009, SWD-066, SWD-119).
// Nothing here is recorded: the deal records it all (Test hooks item 1, tap → move).
import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { HideMainButton, OptionButton, QuietButton, Screen, ScreenContent, ScrollArea, Toast, useBackCloses, useToast } from '../../../blocks';
import type { SecretWordsChoices, SecretWordsTeamNames } from '../rules';
import type { ChoicesDraft } from './evening';
import { GuardedMain } from './guard';
import { TeamIcon } from './icons';
import { isEligible, nextEligible, otherTeam, TEAMS, teamsAlerts, type Team, type TeamsDraft } from './teams';

const MAX_PLAYERS = 20;
const MIN_PLAYERS = 4;
const MAX_NAME = 16;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const players = (n: number) => `${n} ${n === 1 ? 'player' : 'players'}`;

// ---------------------------------------------------------------- S1 Who's playing?

/** SWD-003: Impostor's names screen without the "Sit in a circle" line and without ▲ ▼. */
export function WhosPlaying({
  names,
  onChange,
  past,
  onBack,
  onNext,
}: {
  names: readonly string[];
  onChange: (next: string[]) => void;
  past: readonly string[];
  onBack: () => void;
  onNext: () => void;
}) {
  const [toast, showToast, clearToast] = useToast();
  const [text, setText] = useState('');
  const [dupOf, setDupOf] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const full = names.length >= MAX_PLAYERS;
  const [overflow, setOverflow] = useState(false);
  // SWD-132: every Enter adds the name typed before it, however fast. Two Enters can come before the screen is drawn
  // again, so the list is read from what was last added, and the name from the field itself.
  const list = useRef(names);
  list.current = names;
  const add = (raw: string, fromField: boolean) => {
    const now = list.current;
    const name = raw.trim();
    if (name === '') return;
    if (now.length >= MAX_PLAYERS) {
      setOverflow(true);
      return;
    }
    const existing = now.find((p) => same(p, name));
    if (existing) {
      if (fromField) setDupOf(existing);
      return;
    }
    const next = [...now, name];
    list.current = next;
    onChange(next);
    if (fromField) {
      if (field.current) field.current.value = '';
      setText('');
      setDupOf(null);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    add(field.current?.value ?? text, true);
    field.current?.focus();
  };
  const offered = past.filter((n) => !names.some((p) => same(p, n)));
  return (
    <Screen className="sw-setup">
      <header className="sw-bar">
        <QuietButton onClick={onBack}>← Back</QuietButton>
      </header>
      <ScrollArea>
        <h1 className="pgn-title">Who's playing?</h1>
        {names.length > 0 && (
          <ul className="sw-names">
            {names.map((p, i) => (
              <li key={`${p}-${i}`} className="sw-name-row">
                <span className="sw-name">{p}</span>
                <button
                  type="button"
                  className="sw-remove"
                  aria-label={`Remove ${p}`}
                  onClick={() => {
                    setOverflow(false);
                    onChange(names.filter((_, k) => k !== i));
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="sw-add" onSubmit={submit}>
          <label className="sw-sr" htmlFor="sw-player-name">
            Player name
          </label>
          <input
            ref={field}
            id="sw-player-name"
            className="sw-input"
            type="text"
            value={text}
            maxLength={MAX_NAME}
            placeholder="Type a name…"
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            onKeyDown={(e) => {
              // An Enter that only ends the keyboard's word suggestion (composing) adds nothing.
              if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
              submit(e);
            }}
            onChange={(e) => {
              setText(e.target.value);
              setDupOf(null);
            }}
          />
          <button type="submit" className="pgn-quiet sw-add-button" disabled={text.trim() === '' || full}>
            Add
          </button>
        </form>
        {dupOf && (
          <p role="alert" className="sw-alert">
            {dupOf} is already playing. Add an initial, like {dupOf} S.
          </p>
        )}
        {(full || overflow) && (
          <p role="alert" className="sw-alert">
            20 players is the most.
          </p>
        )}
        {names.length < MIN_PLAYERS && <p className="sw-small">Add at least 4 players.</p>}
        {!full && offered.length > 0 && (
          <div className="sw-past">
            {offered.map((n) => (
              <button key={n} type="button" className="sw-chip" onClick={() => add(n, false)}>
                {n}
              </button>
            ))}
          </div>
        )}
        {names.length > 0 && (
          <QuietButton
            className="sw-clear"
            onClick={() => {
              const before = [...names];
              onChange([]);
              showToast('List cleared', () => onChange(before));
            }}
          >
            Clear list
          </QuietButton>
        )}
      </ScrollArea>
      <Toast toast={toast} onDone={clearToast} />
      <GuardedMain disabled={names.length < MIN_PLAYERS} onClick={onNext}>
        Next
      </GuardedMain>
    </Screen>
  );
}

// ---------------------------------------------------------------- S2 Make teams

/** SWD-005: a second tap within 500 ms at the same place (a double tap) does nothing. */
function useDoubleTapGuard() {
  const last = useRef<{ x: number; y: number; at: number } | null>(null);
  return (e: ReactMouseEvent): boolean => {
    if (e.detail === 0) return true;
    const now = Date.now();
    const l = last.current;
    if (l && now - l.at < 500 && Math.abs(e.clientX - l.x) < 24 && Math.abs(e.clientY - l.y) < 24) return false;
    last.current = { x: e.clientX, y: e.clientY, at: now };
    return true;
  };
}

export function MakeTeams({
  draft,
  names,
  canRename,
  onMove,
  onShuffle,
  onNewNames,
  onClueGivers,
  onBack,
  onNext,
}: {
  draft: TeamsDraft;
  names: SecretWordsTeamNames;
  /** SWD-013: "New team names" until the names are fixed (not after "Play again with these teams"). */
  canRename: boolean;
  /** A tap on a name (SWD-005); returns the toast's text and its Undo. */
  onMove: (player: string) => { text: string; undo: () => void };
  /** "Shuffle teams" (SWD-006) and "New team names" (SWD-013); each returns its Undo. */
  onShuffle: () => () => void;
  onNewNames: () => () => void;
  onClueGivers: (next: TeamsDraft) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [toast, showToast, clearToast] = useToast();
  const [sheet, setSheet] = useState(false);
  const allow = useDoubleTapGuard();
  const alerts = teamsAlerts(draft);
  useBackCloses(sheet, () => setSheet(false));
  return (
    <Screen page className="sw-setup sw-teams">
      <HideMainButton.Provider value={sheet}>
        <ScreenContent hidden={sheet}>
          <header className="sw-bar">
            <QuietButton onClick={onBack}>← Back</QuietButton>
          </header>
          <h1 className="pgn-title">Make teams</h1>
          <p className="sw-small">Tap a name to move it to the other team.</p>
          <div className="sw-columns">
            {TEAMS.map((t) => (
              <section key={t} className={`sw-column sw-column-${t}`}>
                <h2 className="sw-team-heading">
                  <TeamIcon team={t} /> {names[t]} · {players(draft[t].length)}
                </h2>
                <p className="sw-small">{t === 'orange' ? 'Orange team' : 'Teal team'}</p>
                <ul className="sw-players">
                  {draft[t].map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        className="sw-player"
                        aria-label={`Move ${p} to ${names[otherTeam(t)]}`}
                        onClick={(e) => {
                          if (!allow(e)) return;
                          const m = onMove(p);
                          showToast(m.text, m.undo);
                        }}
                      >
                        <span className="sw-player-name">{p}</span>
                        {draft.clueGivers[t] === p && (
                          <span className="sw-badge" data-testid="clue-giver-badge">
                            Clue giver
                          </span>
                        )}
                        {!isEligible(draft, p) && (
                          <span className="sw-small sw-tag" data-testid="guess-only-tag">
                            Doesn't give clues
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {alerts.tooSmall && (
            <p role="alert" className="sw-alert">
              Each team needs at least 2 players.
            </p>
          )}
          {alerts.noGiver && (
            <p role="alert" className="sw-alert">
              Each team needs someone who can give clues.
            </p>
          )}
          <div className="sw-stack">
            <QuietButton
              className="sw-wide"
              onClick={() => {
                showToast('Teams shuffled', onShuffle());
              }}
            >
              Shuffle teams
            </QuietButton>
            {canRename && (
              <QuietButton
                className="sw-wide"
                onClick={() => {
                  showToast('New team names', onNewNames());
                }}
              >
                New team names
              </QuietButton>
            )}
            <QuietButton className="sw-wide" onClick={() => setSheet(true)}>
              Choose clue givers
            </QuietButton>
          </div>
        </ScreenContent>
        {!sheet && <Toast toast={toast} onDone={clearToast} />}
        <GuardedMain disabled={alerts.tooSmall || alerts.noGiver} onClick={onNext}>
          Next
        </GuardedMain>
      </HideMainButton.Provider>
      {sheet && (
        <ClueGiversSheet
          draft={draft}
          names={names}
          onDone={(next) => {
            setSheet(false);
            onClueGivers(next);
          }}
        />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------- S2a Clue givers sheet

/** SWD-007, SWD-014, SWD-123: per team, the clue giver, an optional partner and the "Doesn't give clues" switches. */
function ClueGiversSheet({ draft, names, onDone }: { draft: TeamsDraft; names: SecretWordsTeamNames; onDone: (next: TeamsDraft) => void }) {
  const [d, setD] = useState<TeamsDraft>(draft);
  const [partnerOpen, setPartnerOpen] = useState<Record<Team, boolean>>({ orange: draft.partners.orange !== null, teal: draft.partners.teal !== null });
  const id = useId();
  const setClueGiver = (t: Team, p: string) => setD({ ...d, clueGivers: { ...d.clueGivers, [t]: p } });
  const setPartner = (t: Team, p: string | null) => setD({ ...d, partners: { ...d.partners, [t]: p } });
  const toggleGuessOnly = (t: Team, p: string) => {
    const on = !d.guessOnly.includes(p);
    const guessOnly = on ? [...d.guessOnly, p] : d.guessOnly.filter((x) => x !== p);
    const clueGivers = { ...d.clueGivers };
    const partners = { ...d.partners };
    if (on) {
      if (partners[t] === p) partners[t] = null;
      if (clueGivers[t] === p) {
        const list = d[t];
        clueGivers[t] = partners[t] ?? nextEligible(list, guessOnly, list.indexOf(p) + 1);
        if (partners[t] === clueGivers[t]) partners[t] = null;
      }
    } else if (clueGivers[t] === null) {
      clueGivers[t] = p;
    }
    setD({ ...d, guessOnly, clueGivers, partners });
  };
  return (
    <div className="pgn-sheet sw-sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
      <div className="pgn-sheet-body">
        <h1 id={`${id}-title`} className="pgn-title">
          Clue givers
        </h1>
        {TEAMS.map((t) => {
          const list = d[t];
          const eligible = list.filter((p) => isEligible(d, p));
          const cg = d.clueGivers[t];
          const partner = d.partners[t];
          return (
            <section key={t} className="sw-cg-team">
              <div role="group" aria-labelledby={`${id}-${t}`} className="sw-cg-group">
                <h2 id={`${id}-${t}`} className="sw-team-heading">
                  <TeamIcon team={t} /> {names[t]}
                </h2>
                {list.map((p) => {
                  const go = !isEligible(d, p);
                  return (
                    <div key={p} className="sw-cg-row">
                      <OptionButtonLike selected={cg === p} disabled={go || partner === p} onClick={() => setClueGiver(t, p)}>
                        {p}
                      </OptionButtonLike>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={go}
                        aria-label={`${p}: doesn't give clues`}
                        className="sw-switch"
                        disabled={!go && eligible.length <= 1}
                        onClick={() => toggleGuessOnly(t, p)}
                      >
                        <span className="sw-switch-label">Doesn't give clues</span>
                        <span className={go ? 'sw-switch-track sw-switch-on' : 'sw-switch-track'} aria-hidden="true">
                          <span className="sw-switch-thumb" />
                        </span>
                      </button>
                      <p className="sw-small">Plays as a guesser only. Good for small kids.</p>
                    </div>
                  );
                })}
              </div>
              {list.length > 0 && eligible.length <= 1 && (
                <p role="alert" className="sw-alert">
                  Each team needs someone who can give clues.
                </p>
              )}
              <QuietButton
                className="sw-wide"
                onClick={() => {
                  if (partnerOpen[t]) setPartner(t, null);
                  setPartnerOpen({ ...partnerOpen, [t]: !partnerOpen[t] });
                }}
              >
                {partnerOpen[t] ? 'Remove partner' : 'Add a partner'}
              </QuietButton>
              <p className="sw-small">Two people give the clues together.</p>
              {partnerOpen[t] && (
                <div role="group" aria-label={`${names[t]} partner`} className="sw-cg-group">
                  {eligible.map((p) => (
                    <OptionButtonLike
                      key={p}
                      selected={partner === p}
                      // SWD-123: the team keeps at least 1 guesser; the clue giver can't be the partner.
                      disabled={p === cg || (partner !== p && list.length - 2 < 1)}
                      onClick={() => setPartner(t, p)}
                    >
                      {p}
                    </OptionButtonLike>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <HideMainButton.Provider value={false}>
        <GuardedMain onClick={() => onDone(d)}>Done</GuardedMain>
      </HideMainButton.Provider>
    </div>
  );
}

/** A choice button with `aria-pressed` that may be disabled (the blocks' OptionButton has no disabled state). */
function OptionButtonLike({ children, selected, disabled, onClick }: { children: string; selected: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={selected ? 'pgn-option pgn-selected sw-option' : 'pgn-option sw-option'} aria-pressed={selected} disabled={disabled} onClick={onClick}>
      {selected && (
        <span className="pgn-tick" aria-hidden="true">
          ✓{' '}
        </span>
      )}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- S3 How do you want to play?

const PHONES: readonly { value: SecretWordsChoices['map']; title: string; text: string; recommended?: boolean }[] = [
  { value: 'pass', title: 'One phone', text: 'Pass it to the clue giver to see the map. About 25 min a game.' },
  { value: 'shared', title: 'Two phones', text: 'One more phone, shared by both clue givers. About 15 min a game.', recommended: true },
  { value: 'own', title: 'Three phones', text: 'One more phone for each clue giver. About 15 min a game.' },
];

interface Group<K extends keyof SecretWordsChoices> {
  key: K;
  label: string;
  options: readonly { value: SecretWordsChoices[K]; text: string; line: string }[];
}
const BOARD: Group<'board'> = {
  key: 'board',
  label: 'Board',
  options: [
    { value: 'full', text: 'Full: 25 words', line: '9 and 8 words to find, 7 blank, 1 Landmine.' },
    { value: 'easy', text: 'Easy: 16 words', line: '6 and 5 words to find, 5 blank, no Landmine.' },
  ],
};
const LANDMINE: Group<'landmine'> = {
  key: 'landmine',
  label: 'Landmine',
  options: [
    { value: 'lose', text: 'Lose the game', line: 'Step on it and your team loses.' },
    { value: 'turn', text: 'Lose your turn', line: 'Step on it and your turn ends; the other team gets one word free.' },
  ],
};
const WORDS: Group<'words'> = {
  key: 'words',
  label: 'Words',
  options: [
    { value: 'family', text: 'Whole family', line: 'Words kids and grandparents know.' },
    { value: 'grownups', text: '+ Harder words', line: 'Adds words kids or elders may not know.' },
  ],
};

function ChoiceGroup<K extends 'board' | 'landmine' | 'words'>({ group, value, onPick }: { group: Group<K>; value: SecretWordsChoices[K]; onPick: (v: SecretWordsChoices[K]) => void }) {
  const id = useId();
  const chosen = group.options.find((o) => o.value === value) ?? group.options[0]!;
  return (
    <div role="group" aria-labelledby={id} className="sw-group">
      <span id={id} className="sw-group-label">
        {group.label}
      </span>
      <div className="sw-options">
        {group.options.map((o) => (
          <OptionButton key={o.value} selected={o.value === value} onClick={() => onPick(o.value)}>
            {o.text}
          </OptionButton>
        ))}
      </div>
      <p className="sw-small">{chosen.line}</p>
    </div>
  );
}

export function Choices({
  choices,
  sameAsLast,
  playerCount,
  onPhones,
  onBoard,
  onLandmine,
  onWords,
  onHowToPlay,
  onBack,
  onStart,
}: {
  choices: ChoicesDraft;
  sameAsLast: boolean;
  playerCount: number;
  onPhones: (v: SecretWordsChoices['map']) => void;
  onBoard: (v: SecretWordsChoices['board']) => void;
  onLandmine: (v: SecretWordsChoices['landmine']) => void;
  onWords: (v: SecretWordsChoices['words']) => void;
  onHowToPlay: () => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const id = useId();
  return (
    <Screen page className={`sw-setup sw-choices${choices.map === null ? ' sw-with-hint' : ''}`}>
      <header className="sw-bar">
        <QuietButton onClick={onBack}>← Back</QuietButton>
      </header>
      <h1 className="pgn-title">How do you want to play?</h1>
      {sameAsLast && <p className="sw-small">Same as last time</p>}
      <QuietButton className="sw-wide" onClick={onHowToPlay}>
        How to play
      </QuietButton>
      <div role="group" aria-labelledby={`${id}-phones`} className="sw-group">
        <span id={`${id}-phones`} className="sw-group-label">
          How many phones?
        </span>
        <div className="sw-phone-cards">
          {PHONES.map((c) => (
            <button
              key={c.value}
              type="button"
              className={choices.map === c.value ? 'sw-phone-card sw-phone-on' : 'sw-phone-card'}
              aria-pressed={choices.map === c.value}
              aria-labelledby={`${id}-${c.value}-t`}
              aria-describedby={`${id}-${c.value}-d`}
              onClick={() => onPhones(c.value)}
            >
              <span id={`${id}-${c.value}-t`} className="sw-phone-title">
                {c.title}
              </span>
              {c.recommended && (
                <span className="sw-small sw-recommended" data-testid="recommended">
                  Recommended
                </span>
              )}
              <span id={`${id}-${c.value}-d`} className="sw-phone-text">
                {c.text}
              </span>
            </button>
          ))}
        </div>
      </div>
      <ChoiceGroup group={BOARD} value={choices.board} onPick={onBoard} />
      {playerCount >= 9 && (
        <p className="sw-small" data-testid="big-group-hint">
          Big group? The Easy board is easier to read.
        </p>
      )}
      {choices.board === 'full' && <ChoiceGroup group={LANDMINE} value={choices.landmine} onPick={onLandmine} />}
      <ChoiceGroup group={WORDS} value={choices.words} onPick={onWords} />
      {choices.map === null && (
        <p className="sw-small sw-start-hint" data-testid="start-hint">
          Pick how many phones to start.
        </p>
      )}
      <GuardedMain disabled={choices.map === null} onClick={onStart}>
        Start the game
      </GuardedMain>
    </Screen>
  );
}

/** Larger text and the rest of this phone's settings (SWD-132, SWD-010's link): the app's own panel, with "← Back". */
export function SettingsScreen({ panel, onBack }: { panel: ReactNode; onBack: () => void }) {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <Screen page className="sw-setup">
      <header className="sw-bar">
        <QuietButton onClick={onBack}>← Back</QuietButton>
      </header>
      <h1 className="pgn-title">Settings</h1>
      {panel}
    </Screen>
  );
}
