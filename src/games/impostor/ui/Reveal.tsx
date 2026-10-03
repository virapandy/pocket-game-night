// The reveal and the round result (IMP-033 to IMP-038, IMP-040, IMP-043, IMP-044, IMP-107). One screen: the reveal
// lines stay once shown; then the result block. Live after a tap (timed lines); otherwise (reopened, back from
// hidden) every line up to the current step at once, with no build-up (IMP-091).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Preferences } from '../../../engine';
import { wordById, type Round } from '../rules';
import { playSound } from './device';
import { Caps, MainButton, QuietButton } from './parts';
import type { ScoreRow } from './story';

/** When each reveal step happens, in ms after the tap (IMP-033, IMP-034, IMP-038). */
const DOTS = [600, 1200, 1800];
const FIRST = 2500;
const SECOND = 4000;
const THIRD = 5500;
const RESULT = 7000;
const TIE_WORD = 1500;
const TIE_RESULT = 3000;

interface Line {
  readonly key: string;
  /** What the announcer says (IMP-083). */
  readonly said: string;
  readonly big: boolean;
  readonly node: ReactNode;
}

export interface ResultInfo {
  readonly headline: string;
  readonly eveningLine: string | null;
  readonly points: string | null;
  readonly rows: readonly ScoreRow[] | null;
  readonly scoresFrom: number | null;
  readonly canUndo: boolean;
  readonly canSkipWord: boolean;
}

export function Reveal({
  round,
  live,
  result,
  prefs,
  announce,
  heard,
  onShowWord,
  onVerdict,
  onDone,
  onNext,
  onUndo,
  onSkipWord,
}: {
  round: Round;
  /** Timed (just tapped) or all at once. */
  live: boolean;
  result: ResultInfo | null;
  prefs: Preferences;
  announce: (text: string) => void;
  /** This round's lines already announced (IMP-083), kept across redraws of the reveal. */
  heard: Set<string>;
  /** Records "Show the word"; true when it was recorded. */
  onShowWord: () => boolean;
  onVerdict: (right: boolean) => void;
  /** The timed reveal reached its result block. */
  onDone: () => void;
  onNext: () => void;
  onUndo: () => void;
  onSkipWord: () => void;
}) {
  const [t, setT] = useState(() => (live ? 0 : Infinity));
  const tie = round.stillTie;
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!live) {
      setT(Infinity);
      return;
    }
    if (!tie) playSound('drumroll', prefs);
    const marks = tie ? [TIE_WORD, TIE_RESULT] : [...DOTS, FIRST, SECOND, THIRD, RESULT];
    const timers = marks.map((m) => setTimeout(() => setT((cur) => Math.max(cur, m)), m));
    const end = tie ? TIE_RESULT : RESULT;
    timers.push(setTimeout(() => done.current(), end));
    return () => timers.forEach(clearTimeout);
    // Started once per reveal: `live` turning false stops it (all lines at once).
  }, [live, tie, prefs]);

  const word = wordById(round.wordId);
  const wordText = word?.word ?? '';
  const named = round.revealed ?? round.impostor;
  const caught = !tie && round.revealed === round.impostor;
  const lines: Line[] = [];
  const wordLine: Line = { key: 'word', said: `The word was ${wordText}.`, big: false, node: <>The word was {wordText}.</> };
  let resultReady = false;
  let showWordButton = false;
  if (tie) {
    lines.push({
      key: 'tie',
      said: `Still a tie! The impostor was ${round.impostor}. Escaped!`,
      big: true,
      node: (
        <>
          Still a tie! The impostor was <Caps>{round.impostor}</Caps>. Escaped!
        </>
      ),
    });
    if (t >= TIE_WORD) lines.push(wordLine);
    resultReady = t >= TIE_RESULT;
  } else {
    if (t < FIRST) {
      const dots = DOTS.filter((d) => t >= d).length;
      lines.push({
        key: 'build',
        said: `${named} was`,
        big: true,
        node: (
          <>
            {named} was
            <span data-testid="build-up-dots" aria-hidden="true">
              {'.'.repeat(dots)}
            </span>
          </>
        ),
      });
    } else if (caught) {
      lines.push({
        key: 'caught',
        said: `Caught red-handed! ${round.impostor} was the impostor.`,
        big: true,
        node: (
          <>
            Caught red-handed! <Caps>{round.impostor}</Caps> was the impostor.
          </>
        ),
      });
    } else {
      lines.push({ key: 'crew', said: `${named} was crew!`, big: true, node: <>{named} was crew!</> });
    }
    if (caught) {
      if (t >= SECOND) {
        const g = `${round.impostor}, one guess. Say it out loud! (No repeating the clues.)`;
        lines.push({ key: 'guess', said: g, big: false, node: g });
      }
      if (round.step === 'guess' || round.step === 'result') lines.push(wordLine);
      showWordButton = round.step === 'caught' && t >= SECOND;
      resultReady = round.step === 'result';
    } else {
      if (t >= SECOND) {
        lines.push({
          key: 'escaped',
          said: `The impostor was ${round.impostor}. Escaped!`,
          big: false,
          node: (
            <>
              The impostor was <Caps>{round.impostor}</Caps>. Escaped!
            </>
          ),
        });
      }
      if (t >= THIRD) lines.push(wordLine);
      resultReady = t >= RESULT;
    }
  }

  // IMP-083: each line announced as it appears (the build-up once, as "Arjun was"); nothing on a reopen. What was
  // said is kept by the evening's screen (`heard`), so drawing this screen again never loses or repeats a line.
  useState(() => {
    if (!live && heard.size === 0) for (const l of lines) heard.add(l.key);
    return true;
  });
  const keys = lines.map((l) => l.key).join('|');
  useEffect(() => {
    const fresh = lines.filter((l) => !heard.has(l.key));
    if (fresh.length === 0) return;
    for (const l of fresh) heard.add(l.key);
    announce(fresh.map((l) => l.said).join(' '));
    // `keys` stands for the lines.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, announce, heard]);

  // IMP-081: the lines scroll inside their own box, kept at the newest line.
  const box = useRef<HTMLDivElement>(null);
  const showAlso = lines.some((l) => l.key === 'word') && caught && !!word?.other_names;
  useLayoutEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [keys, resultReady]);

  return (
    <>
      <section className="imp-stage imp-reveal">
        <div ref={box} className="imp-reveal-lines">
          {lines.map((l) => (
            <p key={l.key} className={l.big ? 'imp-reveal-line imp-reveal-big' : 'imp-reveal-line'} data-testid="reveal-line">
              {l.node}
            </p>
          ))}
          {showAlso && (
            <p className="imp-small" data-testid="also-called">
              Also called {word!.other_names}
            </p>
          )}
          {caught && round.step === 'guess' && (
            <div className="imp-verdict">
              <QuietButton onClick={() => onVerdict(true)}>Guessed right</QuietButton>
              <QuietButton onClick={() => onVerdict(false)}>Wrong guess</QuietButton>
            </div>
          )}
        </div>
        {resultReady && result && <ResultBlock result={result} practice={round.practice} onUndo={onUndo} onSkipWord={onSkipWord} />}
      </section>
      {showWordButton && (
        <MainButton
          onClick={() => {
            // IMP-083: the word line is announced with the tap itself.
            if (onShowWord() && !heard.has(wordLine.key)) {
              heard.add(wordLine.key);
              announce(wordLine.said);
            }
          }}
        >
          Show the word
        </MainButton>
      )}
      {resultReady && result && <MainButton onClick={onNext}>Next round</MainButton>}
    </>
  );
}

function ResultBlock({
  result,
  practice,
  onUndo,
  onSkipWord,
}: {
  result: ResultInfo;
  practice: boolean;
  onUndo: () => void;
  onSkipWord: () => void;
}) {
  return (
    <div className="imp-result">
      <h2 className="imp-outcome" data-testid="round-outcome">
        {result.headline}
      </h2>
      {!practice && result.eveningLine !== null && (
        <p className="imp-body" data-testid="evening-line">
          {result.eveningLine}
        </p>
      )}
      {result.points !== null && (
        <p className="imp-body" data-testid="round-points">
          {result.points}
        </p>
      )}
      {result.rows && <Scoreboard rows={result.rows} scoresFrom={result.scoresFrom} />}
      {(result.canUndo || result.canSkipWord) && (
        <div className="imp-result-quiet">
          {result.canUndo && <QuietButton onClick={onUndo}>Undo</QuietButton>}
          {result.canSkipWord && <QuietButton onClick={onSkipWord}>This word didn't work</QuietButton>}
        </div>
      )}
    </div>
  );
}

/**
 * IMP-044: one row per player, rank, name and total; 36 px rows; one column up to 6 players, two from 7 (the first
 * column holds the first ceil(n / 2) rows). Players who left are greyed. "Scores from round N" when N > 1 (IMP-043).
 */
export function Scoreboard({ rows, scoresFrom }: { rows: readonly ScoreRow[]; scoresFrom: number | null }) {
  const two = rows.length >= 7;
  const perColumn = two ? Math.ceil(rows.length / 2) : rows.length;
  return (
    <div className="imp-scoreboard" data-testid="scoreboard">
      {scoresFrom !== null && scoresFrom > 1 && <p className="imp-small">Scores from round {scoresFrom}</p>}
      <ol
        className={two ? 'imp-score-list imp-score-two' : 'imp-score-list'}
        style={two ? { gridTemplateRows: `repeat(${perColumn}, 36px)` } : undefined}
      >
        {rows.map((r) => (
          <li
            key={r.name}
            className={r.left ? 'imp-score-row imp-score-left' : 'imp-score-row'}
            data-testid="score-row"
            data-name={r.name}
            data-points={r.points}
            data-rank={r.rank}
          >
            <span className="imp-score-rank">{r.rank}</span>
            <span className="imp-score-name">{r.name}</span>
            <span className="imp-score-points">{r.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
