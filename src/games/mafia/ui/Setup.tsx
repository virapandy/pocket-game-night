// Mafia setup (specs/mafia/01-setup.md): S1 "Who's playing?" (MAF-002), S2 Roles (MAF-003), S3 Read this aloud (MAF-005)
// and S4 How to play (MAF-006). Strings: ./text.ts (text.csv `mf.s1` to `mf.s4`).
import { useRef, useState, type FormEvent } from 'react';
import { QuietButton, Screen, ScreenContent, ScrollArea, Toast } from '../../../blocks';
import { mafiaCounts } from '../rules';
import { Main, TextLink, useUndoToast } from './parts';
import { T } from './text';

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 16;
const MAX_NAME = 16;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** MAF-002: Who's playing? Seat order, ✕ with Undo, the counter, "Next" from 5 names, at most 16. */
export function WhosPlaying({
  names,
  onChange,
  backLabel = T.s1.back,
  onBack,
  onHowToPlay,
  onNext,
}: {
  names: readonly string[];
  onChange: (next: string[]) => void;
  backLabel?: string;
  onBack: () => void;
  onHowToPlay: () => void;
  onNext: () => void;
}) {
  const [text, setText] = useState('');
  const [twice, setTwice] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [toast, showToast, clearToast] = useUndoToast();
  const field = useRef<HTMLInputElement>(null);
  // Every Enter adds the name typed before it, however fast (as SWD-132): the list is read from what was last added.
  const list = useRef(names);
  list.current = names;
  const add = () => {
    const name = (field.current?.value ?? text).trim();
    const now = list.current;
    if (name === '') return;
    if (now.length >= MAX_PLAYERS) {
      // Item 28: "Up to 16 players." and the field keeps the text.
      setFull(true);
      return;
    }
    const existing = now.find((p) => same(p, name));
    if (existing) {
      setTwice(existing);
      return;
    }
    const next = [...now, name.slice(0, MAX_NAME)];
    list.current = next;
    onChange(next);
    if (field.current) field.current.value = '';
    setText('');
    setTwice(null);
    setFull(false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    add();
    field.current?.focus();
  };
  const remove = (i: number) => {
    const before = [...names];
    const name = before[i]!;
    onChange(before.filter((_, k) => k !== i));
    setFull(false);
    showToast(T.s1.removed(name), () => onChange(before));
  };
  const tooFew = names.length < MIN_PLAYERS;
  return (
    <Screen className="maf-setup">
      <ScreenContent>
        <h1 className="pgn-title">{T.s1.title}</h1>
        <ScrollArea className="maf-names">
          {names.length > 0 && (
            <ol className="maf-player-list">
              {names.map((p, i) => (
                <li key={`${p}-${i}`} className="maf-player-row">
                  <span className="maf-player-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="maf-player-name">{p}</span>
                  <button type="button" className="maf-icon" aria-label={T.s1.remove(p)} onClick={() => remove(i)}>
                    ✕
                  </button>
                </li>
              ))}
            </ol>
          )}
          <form className="maf-add" onSubmit={submit}>
            <label className="maf-sr" htmlFor="maf-player-name">
              {T.s1.field}
            </label>
            <input
              ref={field}
              id="maf-player-name"
              className="maf-input"
              type="text"
              value={text}
              maxLength={MAX_NAME}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="done"
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
                submit(e);
              }}
              onChange={(e) => {
                setText(e.target.value);
                setTwice(null);
                setFull(false);
              }}
            />
            <button type="submit" className="pgn-quiet maf-add-button" disabled={text.trim() === ''}>
              {T.s1.add}
            </button>
          </form>
          {twice && (
            <p role="alert" className="maf-alert">
              {T.s1.twice(twice)}
            </p>
          )}
          {full && (
            <p role="alert" className="maf-alert">
              {T.s1.tooMany}
            </p>
          )}
          <p className="maf-small">{T.s1.count(names.length)}</p>
          {tooFew && (
            <p role="alert" className="maf-alert">
              {T.s1.tooFew}
            </p>
          )}
          <div className="maf-links">
            <TextLink onClick={onHowToPlay}>{T.s1.howToPlay}</TextLink>
          </div>
          <QuietButton className="maf-back" onClick={onBack}>
            {backLabel}
          </QuietButton>
        </ScrollArea>
      </ScreenContent>
      <Toast toast={toast} onDone={clearToast} />
      <Main disabled={tooFew} onClick={onNext}>
        {T.s1.next}
      </Main>
    </Screen>
  );
}

/** The rules box (MAF-003): body text, 1 px border, 12 px padding, one line each. */
export function RulesBox() {
  return (
    <ul className="maf-rules">
      {T.s2.rules.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

/** MAF-003: Roles for N players: the Mafia count between − and +, the other roles, the rules box. */
export function Roles({
  n,
  m,
  onCount,
  onBack,
  onHowToPlay,
  onDeal,
}: {
  n: number;
  m: number;
  onCount: (m: number) => void;
  onBack: () => void;
  onHowToPlay: () => void;
  onDeal: () => void;
}) {
  const { suggested, allowed } = mafiaCounts(n);
  const five = n === MIN_PLAYERS;
  return (
    <Screen className="maf-setup">
      <ScreenContent>
        <h1 className="pgn-title">{T.s2.title(n)}</h1>
        <ScrollArea>
          <div className="maf-count-row">
            <button type="button" className="maf-step" aria-label={T.s2.fewer} disabled={!allowed.includes(m - 1)} onClick={() => onCount(m - 1)}>
              −
            </button>
            <p className="maf-count">{T.s2.mafia(m)}</p>
            <button type="button" className="maf-step" aria-label={T.s2.more} disabled={!allowed.includes(m + 1)} onClick={() => onCount(m + 1)}>
              +
            </button>
          </div>
          <p className="maf-small">{T.s2.suggest(suggested, n)}</p>
          {five ? (
            <p className="maf-body">{T.s2.five}</p>
          ) : (
            <div className="maf-role-lines">
              <p className="maf-body">{T.s2.doctor}</p>
              <p className="maf-body">{T.s2.police}</p>
              <p className="maf-body">{T.s2.villagers(n - m - 2)}</p>
            </div>
          )}
          <RulesBox />
          <div className="maf-links">
            <TextLink onClick={onHowToPlay}>{T.s1.howToPlay}</TextLink>
          </div>
          <QuietButton className="maf-back" onClick={onBack}>
            {T.s1.back}
          </QuietButton>
        </ScrollArea>
      </ScreenContent>
      <Main onClick={onDeal}>{T.s2.main}</Main>
    </Screen>
  );
}

/** MAF-005: Read this aloud: the card for M Mafia; Back undoes the deal; "Pass the phone round" starts it. */
export function ReadAloud({ m, onBack, onHowToPlay, onPass }: { m: number; onBack: () => void; onHowToPlay: () => void; onPass: () => void }) {
  return (
    <Screen className="maf-setup maf-aloud">
      <ScreenContent>
        <h1 className="pgn-title">{T.s3.title}</h1>
        <ScrollArea>
          <p className="maf-card">{T.s3.card(m)}</p>
          <div className="maf-aloud-foot">
            <QuietButton className="maf-back" onClick={onBack}>
              {T.s1.back}
            </QuietButton>
            <TextLink onClick={onHowToPlay}>{T.s1.howToPlay}</TextLink>
          </div>
        </ScrollArea>
      </ScreenContent>
      <Main onClick={onPass}>{T.s3.main}</Main>
    </Screen>
  );
}

/** MAF-006: How to play: the seven steps, the rules box and the peek line; names nobody; Done returns unchanged. */
export function HowToPlay({ onDone }: { onDone: () => void }) {
  return (
    <Screen className="maf-setup" page>
      <ScreenContent>
        <h1 className="pgn-title">{T.s4.title}</h1>
        <ol className="maf-steps">
          {T.s4.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <RulesBox />
        <p className="maf-body">{T.s4.peek}</p>
      </ScreenContent>
      <Main onClick={onDone}>{T.s4.done}</Main>
    </Screen>
  );
}
