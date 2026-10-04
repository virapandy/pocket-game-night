// Getting to the first deal: "Who's playing?" (IMP-003, IMP-004), "How do you want to play?" (IMP-005, IMP-007,
// IMP-009, IMP-088), with "How to play" on request (IMP-070).
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CATEGORIES, type Choices } from '../rules';
import { MainButton, OptionButton, QuietButton, Sheet, Switch, Toast, useToast } from './parts';
import { MoreOptionsSheet, RulesSheet } from './Sheets';

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
  // IMP-003 (M3): every Enter adds the name typed before it, however fast. Two Enters can come before the screen is
  // drawn again, so the list is read from what was last added, and the name from the field itself.
  const list = useRef(players);
  list.current = players;
  const add = (raw: string, fromField: boolean) => {
    const now = list.current;
    const name = raw.trim();
    if (name === '' || now.length >= MAX_PLAYERS) return;
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
          // Enter adds at once, even while the "Add" button still looks disabled for a name not yet drawn.
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            submit(e);
          }}
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
      { value: true, text: 'Yes', line: 'Points every round, totals for the game.' },
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

/**
 * "How do you want to play?" (IMP-005, IMP-007, IMP-088). Above "Start round", one row of two quiet buttons: "More
 * options ›" (IMP-076) left and "How to play" (IMP-070) right. "How to play" follows the choices on screen.
 */
export function HowToPlayChoices({
  choices,
  onChange,
  onBack,
  onStart,
  onPractice,
  lastGuess,
  onLastGuess,
  sameAsLast = false,
  phoneBack = false,
}: {
  choices: Choices;
  onChange: (next: Choices) => void;
  onBack: () => void;
  onStart: () => void;
  /** A new evening only: "Practice round first" in "How to play" (IMP-071). */
  onPractice?: () => void;
  /**
   * IMP-076: the last-chance guess on screen and its change. "More options ›" shows once these are given (the
   * setting itself is the rules' change).
   */
  lastGuess?: boolean;
  onLastGuess?: (on: boolean) => void;
  /** IMP-009: the choices were carried over and nothing has changed yet: "Same as last time". */
  sameAsLast?: boolean;
  /** IMP-006: the browser's or phone's Back, with no sheet open, does what "← Back" does ("Change how we play"). */
  phoneBack?: boolean;
}) {
  const [sheet, setSheet] = useState<'categories' | 'howTo' | 'more' | null>(null);
  const n = choices.categories.length;
  const more = onLastGuess !== undefined;
  // IMP-076: the browser's or phone's Back closes any sheet here ("More options", Categories, How to play) and
  // discards its change. The app's back guard (App.tsx) keeps the address, so Back stays on this screen.
  useEffect(() => {
    if (sheet === null) return;
    const back = () => setSheet(null);
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [sheet]);
  const backRef = useRef(onBack);
  backRef.current = onBack;
  useEffect(() => {
    if (!phoneBack || sheet !== null) return;
    const back = () => backRef.current();
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [phoneBack, sheet]);
  return (
    <main className="imp-screen imp-setup">
      <div className="imp-screen-inner" hidden={sheet !== null}>
        {/* IMP-088: the heading shares the bar's row on short phones (320 × 568), so everything fits unscrolled. */}
        <header className="imp-bar imp-bar-title">
          <QuietButton onClick={onBack}>← Back</QuietButton>
          <h1 className="imp-title">How do you want to play?</h1>
        </header>
        {sameAsLast && <p className="imp-small imp-same">Same as last time</p>}
        <div className="imp-scroll imp-choices-scroll">
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
          <button type="button" className="imp-row-button" onClick={() => setSheet('categories')}>
            {n === CATEGORIES.length ? `Categories: all ${n} ›` : `Categories: ${n} of ${CATEGORIES.length} ›`}
          </button>
          <div className="imp-choice-row">
            {more ? (
              <QuietButton className="imp-choice-more" onClick={() => setSheet('more')}>
                More options ›
              </QuietButton>
            ) : (
              <span className="imp-choice-more" />
            )}
            <QuietButton className="imp-choice-how" onClick={() => setSheet('howTo')}>
              How to play
            </QuietButton>
          </div>
        </div>
        <MainButton onClick={onStart}>Start round</MainButton>
      </div>
      {sheet === 'categories' && (
        <CategoriesSheet
          choices={choices}
          onDone={(next) => {
            onChange(next);
            setSheet(null);
          }}
        />
      )}
      {sheet === 'howTo' && (
        <RulesSheet
          choices={lastGuess === undefined ? choices : { ...choices, lastGuess }}
          onDone={() => setSheet(null)}
          {...(onPractice ? { onPractice } : {})}
        />
      )}
      {sheet === 'more' && (
        <MoreOptionsSheet
          lastGuess={lastGuess ?? false}
          onDone={(on) => {
            onLastGuess?.(on);
            setSheet(null);
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
  const done = () => {
    const categories = CATEGORIES.filter((c) => on.includes(c));
    const same = nonveg === choices.nonveg && categories.length === choices.categories.length && categories.every((c, i) => c === choices.categories[i]);
    // Nothing changed: the choices stay as they were ("Same as last time" stays, IMP-009).
    onDone(same ? choices : { ...choices, categories, nonveg });
  };
  return (
    <Sheet title="Categories" onDone={done}>
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
