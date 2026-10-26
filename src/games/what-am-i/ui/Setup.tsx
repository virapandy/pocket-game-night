// Setup on the host phone (lane W2): S1 "Who's playing?" (WAI-002), S2 "Words and time" (WAI-003, Version 1.3 item 4),
// S3 "Read this aloud" (WAI-005, Version 1.2 item 12) and S4 "How to play" (WAI-006, Version 1.1 items 42, 43; Version 1.2
// item 13; Version 1.3 item 7). Nothing here is recorded: S3's "First turn" (or S2's start mid-night) records `start`.
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QuietButton, Screen, ScreenContent, ScrollArea, Toast } from '../../../blocks';
import { PACKS, packCount, type Choices, type Hold, type PackChoice, type TurnTime } from '../rules';
import { Main, NameList, PageMoreBelow, Switch, ToastHost, moved, useWaiBack, useWaiToast } from './parts';

const MAX_PLAYERS = 20;
const MAX_NAME = 16;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** "Animals · 92 words", "Mix of all · 714 words" (WAI-003): eligible words of the shipped list. */
export const packLabel = (p: PackChoice, nonveg: boolean) => `${p === 'mix' ? 'Mix of all' : p} · ${packCount(p, nonveg)} words`;

// ---------------------------------------------------------------- S1 Who's playing?

/**
 * WAI-002: the names in turn order with drag handles and ✕, an add row (every Enter adds its name and keeps the field
 * focused), the 2-player and 20-player lines, "← Back" and "Next". `taken`: names the add row refuses besides the list's own
 * (none in setup). Mid-game (lane W4) the same screen shows "← Back to the game".
 */
export function WhosPlaying({
  names,
  onChange,
  onBack,
  backLabel = '← Back',
  onHowToPlay,
  onNext,
}: {
  names: readonly string[];
  onChange: (next: string[]) => void;
  onBack: () => void;
  backLabel?: string;
  onHowToPlay: () => void;
  onNext: () => void;
}) {
  const [toast, showToast, clearToast] = useWaiToast();
  useWaiBack(true, 0, onBack);
  const list = useRef(names);
  list.current = names;
  return (
    <Screen className="wai-setup">
      <header className="wai-bar">
        <QuietButton onClick={onBack}>{backLabel}</QuietButton>
        <QuietButton onClick={onHowToPlay}>How to play</QuietButton>
      </header>
      <ScrollArea>
        <h1 className="pgn-title">Who's playing?</h1>
        <p className="wai-small">Players take turns in this order. Drag a name to move it.</p>
        <NameList
          names={names}
          onRemove={(p, i) => {
            const before = [...list.current];
            onChange(before.filter((_, k) => k !== i));
            showToast(`${p} removed · Undo`, () => onChange(before));
          }}
          onMove={(from, to) => onChange(moved(list.current, from, to))}
        />
        <AddRow
          names={names}
          onAdd={(name) => {
            const next = [...list.current, name];
            list.current = next;
            onChange(next);
          }}
        />
        {names.length < 2 && (
          <p role="alert" className="wai-alert">
            What Am I? needs at least 2 players.
          </p>
        )}
        {names.length >= 2 && <p className="wai-small">{names.length} players</p>}
      </ScrollArea>
      <ToastHost>
        <Toast toast={toast} onDone={clearToast} />
      </ToastHost>
      <Main disabled={names.length < 2} onClick={onNext}>
        Next
      </Main>
    </Screen>
  );
}

/**
 * The add row ("Player name" + "Add"): a name twice gets Impostor's message; a 21st name shows "Up to 20 players." and adds
 * nothing. `accepts(name)`: a name the list does not hold but the game takes back (a leaver's exact name, Version 1.1 item
 * 32) is passed through as new.
 */
export function AddRow({
  names,
  onAdd,
  fieldRef,
}: {
  names: readonly string[];
  onAdd: (name: string) => void;
  fieldRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const own = useRef<HTMLInputElement>(null);
  const field = fieldRef ?? own;
  const id = useId();
  const [text, setText] = useState('');
  const [dupOf, setDupOf] = useState<string | null>(null);
  const [overflow, setOverflow] = useState(false);
  // Every Enter adds the name typed before it, however fast: the list is read from what was last added.
  const list = useRef(names);
  list.current = names;
  const full = names.length >= MAX_PLAYERS;
  const add = () => {
    const name = (field.current?.value ?? text).trim();
    if (name === '') return;
    const now = list.current;
    if (now.length >= MAX_PLAYERS) {
      setOverflow(true);
      return;
    }
    const existing = now.find((p) => same(p, name));
    if (existing) {
      setDupOf(existing);
      return;
    }
    list.current = [...now, name];
    onAdd(name);
    if (field.current) field.current.value = '';
    setText('');
    setDupOf(null);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    add();
    field.current?.focus();
  };
  return (
    <>
      <form className="wai-add" onSubmit={submit}>
        <label className="wai-sr" htmlFor={id}>
          Player name
        </label>
        <input
          ref={field}
          id={id}
          className="wai-input"
          type="text"
          value={text}
          maxLength={MAX_NAME}
          placeholder="Type a name…"
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
            submit(e);
          }}
          onChange={(e) => {
            setText(e.target.value);
            setDupOf(null);
            setOverflow(false);
          }}
        />
        <button type="submit" className="pgn-quiet wai-add-button" disabled={text.trim() === '' || full}>
          Add
        </button>
      </form>
      {dupOf && (
        <p role="alert" className="wai-alert">
          {dupOf} is already playing. Add an initial, like {dupOf} S.
        </p>
      )}
      {(full || overflow) && (
        <p role="alert" className="wai-alert">
          Up to 20 players.
        </p>
      )}
    </>
  );
}

// ---------------------------------------------------------------- S2 Words and time

const TIMES: readonly TurnTime[] = [30, 60, 90];
const HOLDS: readonly { hold: Hold; label: string; line: string }[] = [
  { hold: 'hand', label: "In the guesser's hand", line: 'Forehead or chest; the guesser moves it to answer.' },
  {
    hold: 'free',
    label: 'Stand the phone up',
    line: 'The phone stands behind the guesser; one clue giver taps to answer. Good for grandparents and small children.',
  },
];

/** One radio of a group (`role="radio"`, `aria-checked`, Version 1.1 item 45): ✓ on the chosen one; its line under it. */
function Radio({ label, line, checked, onPick }: { label: string; line?: string; checked: boolean; onPick: () => void }) {
  const id = useId();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      {...(line ? { 'aria-describedby': id } : {})}
      className={checked ? 'wai-radio wai-radio-on' : 'wai-radio'}
      onClick={onPick}
    >
      <span className="wai-radio-label">
        {label}
        {checked && (
          <span className="wai-tick" aria-hidden="true">
            {' '}✓
          </span>
        )}
      </span>
      {line && (
        <span id={id} className="wai-radio-line">
          {line}
        </span>
      )}
    </button>
  );
}

function Group({ title, children, row }: { title: string; children: ReactNode; row?: boolean }) {
  const id = useId();
  return (
    <section className="wai-group">
      <h2 id={id} className="wai-h2">
        {title}
      </h2>
      <div role="radiogroup" aria-labelledby={id} className={row ? 'wai-radios wai-radios-row' : 'wai-radios'}>
        {children}
      </div>
    </section>
  );
}

/** S2's choices, in Version 1.3 item 4's order (also the menu's "Words and time" sheet, WAI-044). */
export function ChoicesForm({ choices, onChange }: { choices: Choices; onChange: (c: Choices) => void }) {
  const set = (patch: Partial<Choices>) => onChange({ ...choices, ...patch });
  const packs: readonly PackChoice[] = ['mix', ...PACKS];
  return (
    <>
      <Group title="Time for each turn" row>
        {TIMES.map((t) => (
          <Radio key={t} label={`${t} s`} checked={choices.time === t} onPick={() => set({ time: t })} />
        ))}
      </Group>
      <p className="wai-small">30 s for small kids, 90 s for grandparents</p>
      <Group title="How to hold the phone">
        {HOLDS.map((h) => (
          <Radio key={h.hold} label={h.label} line={h.line} checked={choices.hold === h.hold} onPick={() => set({ hold: h.hold })} />
        ))}
      </Group>
      <p className="wai-small">You can change this for one player on their turn.</p>
      <Group title="Which words?">
        {packs.map((p) => (
          <Radio
            key={p}
            label={packLabel(p, choices.nonveg)}
            {...(p === 'mix' ? { line: 'Words from every pack.' } : {})}
            checked={choices.pack === p}
            onPick={() => set({ pack: p })}
          />
        ))}
      </Group>
      <div className="wai-switches">
        <Switch label="Include non-veg food (chicken, fish, egg)" checked={choices.nonveg} onChange={(nonveg) => set({ nonveg })} />
        <Switch label="Sounds" checked={choices.sounds} onChange={(sounds) => set({ sounds })} />
        <p className="wai-small">{choices.sounds ? 'So the guesser knows a word counted.' : "The guesser won't know a word counted."}</p>
      </div>
    </>
  );
}

/** S2 (WAI-003): the page scrolls; "Ready as it is, or change anything above." sits fixed just above the fixed main button. */
export function WordsAndTime({
  choices,
  onChange,
  onBack,
  onHowToPlay,
  onStart,
  startLabel = 'Start with these words',
}: {
  choices: Choices;
  onChange: (c: Choices) => void;
  onBack: () => void;
  onHowToPlay: () => void;
  onStart: () => void;
  /** From R1's "Change players or words": "Carry on playing" (lane W4). */
  startLabel?: string;
}) {
  useWaiBack(true, 0, onBack);
  return (
    <Screen page className="wai-setup wai-choices">
      <ScreenContent>
        <header className="wai-bar">
          <QuietButton onClick={onBack}>← Back</QuietButton>
          <QuietButton onClick={onHowToPlay}>How to play</QuietButton>
        </header>
        <h1 className="pgn-title">Words and time</h1>
        <ChoicesForm choices={choices} onChange={onChange} />
      </ScreenContent>
      <PageMoreBelow className="wai-more-ready" />
      <p className="wai-small wai-ready">Ready as it is, or change anything above.</p>
      <Main onClick={onStart}>{startLabel}</Main>
    </Screen>
  );
}

// ---------------------------------------------------------------- S3 Read this aloud

/** WAI-005's text for these choices (hold and time), ending before the Do Not Disturb tip. */
export function readAloudText(c: Choices): string {
  const answer =
    c.hold === 'free'
      ? 'The phone stands behind the guesser. One clue giver taps the bottom for Got it, the top to pass.'
      : 'Got it? Move the phone down. Stuck? Move it up to pass.';
  return (
    'One of us holds the phone on their forehead or chest, screen to the room. Everyone else gives clues: talk, act, make ' +
    `the noise, but never say the word. ${answer} Passing is free. A word in the wrong list? Fix it when time's up. You have ` +
    `${c.time} seconds. Play as many rounds as you like; tap End the game to see who got the most.`
  );
}

/** S3 (WAI-005): fits without scrolling the page; its text scrolls inside its own box if a phone is too small. */
export function ReadAloud({
  choices,
  onBack,
  onHowToPlay,
  onFirstTurn,
}: {
  choices: Choices;
  onBack: () => void;
  onHowToPlay: () => void;
  onFirstTurn: () => void;
}) {
  useWaiBack(true, 0, onBack);
  return (
    <Screen className="wai-setup wai-aloud">
      <header className="wai-bar">
        <QuietButton onClick={onBack}>← Back</QuietButton>
        <QuietButton onClick={onHowToPlay}>How to play</QuietButton>
      </header>
      <h1 className="pgn-title">Read this aloud</h1>
      <ScrollArea className="wai-aloud-text">
        <p className="wai-aloud-body">{readAloudText(choices)}</p>
        <p className="wai-small">Tip: turn on Do Not Disturb so messages don't buzz.</p>
      </ScrollArea>
      <Main onClick={onFirstTurn}>First turn</Main>
    </Screen>
  );
}

// ---------------------------------------------------------------- S4 How to play

const HOW_TO_PLAY = [
  'One player guesses. They hold the phone on their forehead or chest, screen facing the room.',
  'Everyone else gives clues: talk, act, make the noise. Never say the word.',
  'Got it? Phone down. Stuck? Phone up to pass. Passing is free.',
  'Or stand the phone up behind the guesser; a clue giver taps the bottom for Got it, the top to pass.',
  "When time's up, fix any word marked wrong, then save the score.",
  'One point for each word you got. Passing costs nothing.',
  'The room decides if a clue broke the rules.',
  "Said the word, or the guesser peeked? Move that word to Passed when time's up.",
  'Pass the phone to the next player. Everyone once is a round.',
  'Play as many rounds as you like. End the game to see who got the most.',
];

/** A simple drawing of a person (head and shoulders) with the phone where it is held (Version 1.1 item 43). */
export function Drawing({ kind, alt }: { kind: 'forehead' | 'chest' | 'behind'; alt: string }) {
  const phone =
    kind === 'forehead' ? { x: 41, y: 8, w: 18, h: 26 } : kind === 'chest' ? { x: 41, y: 50, w: 18, h: 26 } : { x: 70, y: 30, w: 18, h: 30 };
  return (
    <svg className="wai-drawing" data-testid="hold-drawing" role="img" aria-label={alt} viewBox="0 0 100 90">
      <circle cx="50" cy="28" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M18 88 C18 62 32 50 50 50 C68 50 82 62 82 88" fill="none" stroke="currentColor" strokeWidth="3" />
      {kind === 'behind' && <path d="M62 66 L94 66" stroke="currentColor" strokeWidth="3" />}
      <rect x={phone.x} y={phone.y} width={phone.w} height={phone.h} rx="3" className="wai-drawing-phone" />
    </svg>
  );
}

/** S4 (WAI-006): the steps as an `ol` with three drawings; "Done" returns to the screen it was opened from. */
export function HowToPlay({ onDone }: { onDone: () => void }) {
  useWaiBack(true, 1, onDone);
  return (
    <Screen page className="wai-setup wai-how">
      <ScreenContent>
        <h1 className="pgn-title">How to play</h1>
        <div className="wai-drawings">
          <Drawing kind="forehead" alt="Phone held on the forehead, screen facing the room" />
          <Drawing kind="chest" alt="Phone held against the chest, screen facing the room" />
          <Drawing kind="behind" alt="Phone standing behind a seated player, facing the room" />
        </div>
        <ol className="wai-lines">
          {HOW_TO_PLAY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </ScreenContent>
      <Main onClick={onDone}>Done</Main>
    </Screen>
  );
}
