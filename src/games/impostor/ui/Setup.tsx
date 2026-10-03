// Getting to the first deal: "Who's playing?" (IMP-003, IMP-004), "How do you want to play?" (IMP-005, IMP-007,
// IMP-009, IMP-088) and the read-aloud card (IMP-070).
import { useRef, useState, type FormEvent } from 'react';
import { CATEGORIES, type Choices } from '../rules';
import { MainButton, OptionButton, QuietButton, Sheet, Switch, Toast, useToast } from './parts';

const MAX_PLAYERS = 20;
const MIN_PLAYERS = 3;
const MAX_NAME = 16;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** The list of IMP-003: seat order, ▲ ▼ ✕, the field and "Add", past names, and the messages. */
export function PlayerList({
  players,
  onChange,
  past,
  onRemove,
}: {
  players: readonly string[];
  onChange: (next: string[]) => void;
  past: readonly string[];
  /** ✕: removes at once by default (setup, IMP-003). */
  onRemove?: (index: number) => void;
}) {
  const [text, setText] = useState('');
  const [dupOf, setDupOf] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const full = players.length >= MAX_PLAYERS;
  const add = (raw: string, fromField: boolean) => {
    const name = raw.trim();
    if (name === '' || full) return;
    const existing = players.find((p) => same(p, name));
    if (existing) {
      if (fromField) setDupOf(existing);
      return;
    }
    onChange([...players, name]);
    if (fromField) {
      setText('');
      setDupOf(null);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    add(text, true);
    field.current?.focus();
  };
  const move = (i: number, by: -1 | 1) => {
    const next = [...players];
    const j = i + by;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  const offered = past.filter((n) => !players.some((p) => same(p, n)));
  return (
    <div className="imp-players">
      {players.length > 0 && (
        <ol className="imp-player-list">
          {players.map((p, i) => (
            <li key={`${p}-${i}`} className="imp-player-row">
              <span className="imp-player-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="imp-player-name">{p}</span>
              <button type="button" className="imp-icon" aria-label={`Move ${p} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                ▲
              </button>
              <button
                type="button"
                className="imp-icon"
                aria-label={`Move ${p} down`}
                disabled={i === players.length - 1}
                onClick={() => move(i, 1)}
              >
                ▼
              </button>
              <button
                type="button"
                className="imp-icon"
                aria-label={`Remove ${p}`}
                onClick={() => (onRemove ? onRemove(i) : onChange(players.filter((_, k) => k !== i)))}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
      <form className="imp-add" onSubmit={submit}>
        <label className="imp-sr" htmlFor="imp-player-name">
          Player name
        </label>
        <input
          ref={field}
          id="imp-player-name"
          className="imp-input"
          type="text"
          value={text}
          maxLength={MAX_NAME}
          placeholder="Type a name…"
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
          onChange={(e) => {
            setText(e.target.value);
            setDupOf(null);
          }}
        />
        <button type="submit" className="imp-quiet imp-add-button" disabled={text.trim() === '' || full}>
          Add
        </button>
      </form>
      {dupOf && (
        <p role="alert" className="imp-alert">
          {dupOf} is already playing. Add an initial, like {dupOf} S.
        </p>
      )}
      {full && (
        <p role="alert" className="imp-alert">
          20 players is the most.
        </p>
      )}
      {players.length < MIN_PLAYERS && (
        <p role="alert" className="imp-alert">
          Add at least 3 players.
        </p>
      )}
      {!full && offered.length > 0 && (
        <div className="imp-past">
          {offered.map((n) => (
            <button key={n} type="button" className="imp-chip" onClick={() => add(n, false)}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** "Who's playing?" (IMP-003, IMP-004). */
export function WhosPlaying({
  players,
  onChange,
  past,
  onBack,
  onNext,
}: {
  players: readonly string[];
  onChange: (next: string[]) => void;
  past: readonly string[];
  onBack: () => void;
  onNext: () => void;
}) {
  const [toast, showToast, clearToast] = useToast();
  return (
    <main className="imp-screen imp-setup">
      <header className="imp-bar">
        <QuietButton onClick={onBack}>← Back</QuietButton>
      </header>
      <div className="imp-scroll">
        <h1 className="imp-title">Who's playing?</h1>
        <p className="imp-body">Sit in a circle. This is the passing and clue order.</p>
        <PlayerList players={players} onChange={onChange} past={past} />
        {players.length > 0 && (
          <QuietButton
            className="imp-clear"
            onClick={() => {
              const before = [...players];
              onChange([]);
              showToast('List cleared', () => onChange(before));
            }}
          >
            Clear list
          </QuietButton>
        )}
      </div>
      <Toast toast={toast} onDone={clearToast} />
      <MainButton disabled={players.length < MIN_PLAYERS} onClick={onNext}>
        Next
      </MainButton>
    </main>
  );
}

const GROUPS = [
  {
    key: 'mode',
    label: 'Mode',
    options: [
      { value: 'easy', text: 'Easy', line: 'The impostor gets the category and a hint.' },
      { value: 'hard', text: 'Hard', line: 'The impostor gets nothing and never starts.' },
    ],
  },
  {
    key: 'talking',
    label: 'Talking',
    options: [
      { value: 'free', text: 'Free flow', line: 'Talk as long as you like, then tap Vote now.' },
      { value: 'timer', text: 'Timer', line: 'Two minutes to talk, then a chime.' },
    ],
  },
  {
    key: 'score',
    label: 'Score',
    options: [
      { value: false, text: 'No', line: 'Just play. We count catches and escapes.' },
      { value: true, text: 'Yes', line: 'Points every round, totals for the night.' },
    ],
  },
  {
    key: 'words',
    label: 'Words',
    options: [
      { value: 'family', text: 'Whole family', line: 'Words kids and grandparents know.' },
      { value: 'grownups', text: '+ Grown-ups', line: 'Adds words kids or elders may not know.' },
    ],
  },
] as const;

/** "How do you want to play?" (IMP-005, IMP-007, IMP-088). */
export function HowToPlayChoices({
  choices,
  onChange,
  onBack,
  onStart,
}: {
  choices: Choices;
  onChange: (next: Choices) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const [sheet, setSheet] = useState(false);
  const n = choices.categories.length;
  return (
    <main className="imp-screen imp-setup">
      <div className="imp-screen-inner" hidden={sheet}>
        <header className="imp-bar">
          <QuietButton onClick={onBack}>← Back</QuietButton>
        </header>
        <div className="imp-scroll">
          <h1 className="imp-title">How do you want to play?</h1>
          <div className="imp-groups">
            {GROUPS.map((g) => {
              const current = choices[g.key];
              const chosen = g.options.find((o) => o.value === current) ?? g.options[0];
              return (
                <div key={g.key} className="imp-group-wrap">
                  <div className="imp-group" role="group" aria-labelledby={`imp-group-${g.key}`}>
                    <span id={`imp-group-${g.key}`} className="imp-group-label">
                      {g.label}
                    </span>
                    {g.options.map((o) => (
                      <OptionButton
                        key={String(o.value)}
                        selected={o.value === current}
                        onClick={() => o.value !== current && onChange({ ...choices, [g.key]: o.value })}
                      >
                        {o.text}
                      </OptionButton>
                    ))}
                  </div>
                  <p className="imp-small imp-option-line">{chosen.line}</p>
                </div>
              );
            })}
          </div>
          <button type="button" className="imp-row-button" onClick={() => setSheet(true)}>
            {n === CATEGORIES.length ? `Categories: all ${n} ›` : `Categories: ${n} of ${CATEGORIES.length} ›`}
          </button>
        </div>
        <MainButton onClick={onStart}>Start round</MainButton>
      </div>
      {sheet && (
        <CategoriesSheet
          choices={choices}
          onDone={(next) => {
            onChange(next);
            setSheet(false);
          }}
        />
      )}
    </main>
  );
}

/** IMP-007: 9 category switches and "Include non-veg food"; at least one category stays on. */
function CategoriesSheet({ choices, onDone }: { choices: Choices; onDone: (next: Choices) => void }) {
  const [on, setOn] = useState<string[]>(() => [...choices.categories]);
  const [nonveg, setNonveg] = useState(choices.nonveg);
  const one = on.length === 1;
  return (
    <Sheet title="Categories" onDone={() => onDone({ ...choices, categories: CATEGORIES.filter((c) => on.includes(c)), nonveg })}>
      <div className="imp-switches">
        {CATEGORIES.map((c) => (
          <Switch
            key={c}
            label={c}
            checked={on.includes(c)}
            disabled={one && on.includes(c)}
            onChange={(v) => setOn(v ? [...on, c] : on.filter((x) => x !== c))}
          />
        ))}
      </div>
      {one && (
        <p role="alert" className="imp-alert">
          Keep at least one category.
        </p>
      )}
      <Switch label="Include non-veg food" checked={nonveg} onChange={setNonveg} />
    </Sheet>
  );
}

/** IMP-070: the read-aloud card, once a session. No menu; "← Back" returns to the choices. */
export function ReadAloud({ onBack, onDeal }: { onBack: () => void; onDeal: (practice: boolean) => void }) {
  return (
    <main className="imp-screen">
      <header className="imp-bar">
        <QuietButton onClick={onBack}>← Back</QuietButton>
      </header>
      <div className="imp-scroll">
        <h1 className="imp-title">Read this aloud</h1>
        <ol className="imp-read">
          <li>Everyone gets the same secret word, except the impostor.</li>
          <li>Take turns to say one word about it. Don't say the word!</li>
          <li>Then talk, and all point at who you think the impostor is.</li>
          <li>Impostor: blend in. Caught? Guess the word to steal the round.</li>
        </ol>
        <QuietButton onClick={() => onDeal(true)}>Practice round first</QuietButton>
      </div>
      <MainButton onClick={() => onDeal(false)}>Start the deal</MainButton>
    </main>
  );
}
