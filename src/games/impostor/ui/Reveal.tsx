// The one result screen (IMP-033, IMP-034, IMP-037, IMP-038, IMP-039; F1, F2): right after "Reveal <Name>" the
// build-up "Arjun was…" for 1.5 s, then everything at once: "✓ Caught!" / "✗ Escaped!", who the impostor was, the
// word and its category, the outcome, the game line or points and scoreboard, and "Next round". With the
// last-chance guess on, a caught impostor guesses first ("Arjun guessed. Show the word", then the room's verdict).
// "Still a tie" shows at once. Reopened (or back from hidden) it shows at once, with no build-up (IMP-091).
// The screen scrolls as one page; only the main button stays pinned (guideline 46a, IMP-081).
// Between rounds (IMP-077, IMP-074): "Next round" with the outlined "End game" beside it, "Players (5) ›" on the game
// line's row. The 500 ms tap guard from the moment the lines appear is the screen's own (Game, I29).
import { useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Preferences } from '../../../engine';
import { wordById, type Round } from '../rules';
import { playSound } from './device';
import { Caps, HideMainButton, MainButton, QuietButton } from './parts';
import type { ScoreRow } from './story';

/** IMP-033: the build-up lasts 1.5 s. */
const BUILD_UP = 1500;

export interface ResultInfo {
  /** `round-outcome`: "You caught the impostor!", "Arjun wins the round!" or "Arjun escaped!". */
  readonly outcome: string;
  readonly eveningLine: string | null;
  readonly points: string | null;
  readonly rows: readonly ScoreRow[] | null;
  readonly scoresFrom: number | null;
  readonly canUndo: boolean;
  readonly canSkipWord: boolean;
}

/**
 * IMP-077: the outlined "End game" of the between-rounds screens, beside the main button (left half), or above it at
 * 320 px wide; hidden with the main button while a dialog or sheet covers the screen.
 */
export function EndGameButton({ onClick }: { onClick: () => void }) {
  const hide = useContext(HideMainButton);
  if (hide) return null;
  return (
    <button type="button" className="imp-quiet imp-end-game" onClick={onClick}>
      End game
    </button>
  );
}

/** One announcement (IMP-083) and the key that makes sure it is said once. */
interface Said {
  readonly key: string;
  readonly text: string;
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
  playerCount,
  onPlayers,
  onEndGame,
}: {
  round: Round;
  /** Just tapped: the build-up first (none after "Still a tie"). Otherwise everything at once. */
  live: boolean;
  result: ResultInfo | null;
  prefs: Preferences;
  announce: (text: string) => void;
  /** This round's announcements already made (IMP-083), kept across redraws of the screen. */
  heard: Set<string>;
  /** Records "Show the word"; true when it was recorded. */
  onShowWord: () => boolean;
  onVerdict: (right: boolean) => void;
  /** The build-up is over (the round's lines show). */
  onDone: () => void;
  onNext: () => void;
  onUndo: () => void;
  onSkipWord: () => void;
  /** IMP-074: "Players (5) ›", the current number of players. */
  playerCount: number;
  onPlayers: () => void;
  /** IMP-077: the outlined "End game" beside "Next round". */
  onEndGame: () => void;
}) {
  const tie = round.stillTie;
  const [building, setBuilding] = useState(() => live && !tie);
  const done = useRef(onDone);
  done.current = onDone;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    if (!live || tie) {
      setBuilding(false);
      return;
    }
    playSound('drumroll', prefsRef.current);
    const t = setTimeout(() => {
      setBuilding(false);
      done.current();
    }, BUILD_UP);
    return () => clearTimeout(t);
    // Started once per reveal: `live` turning false (back from hidden) shows everything at once.
  }, [live, tie]);

  const word = wordById(round.wordId);
  const wordText = word?.word ?? '';
  const named = round.revealed ?? round.impostor;
  const caught = !tie && round.revealed === round.impostor;
  const guessStep = caught && round.step === 'caught';
  const wordShown = !guessStep;
  const verdictStep = caught && round.step === 'guess';
  /** The last-chance guess was played in this round (guess step, verdict step, or a verdict tapped). */
  const lastChance = caught && (guessStep || verdictStep || round.verdict !== null);
  const complete = round.step === 'result' && result !== null;

  // IMP-083: what the announcer says, in screen order; each said once, as it appears.
  const said: Said[] = [];
  if (building) said.push({ key: 'build', text: `${named} was…` });
  else {
    const first = [caught ? '✓ Caught!' : '✗ Escaped!'];
    if (tie) first.push('Still a tie.');
    else if (!caught) first.push(`${named} was not the impostor.`);
    first.push(`${round.impostor} was the impostor`);
    if (lastChance) {
      // The last-chance guess: the caught lines with the guess line, then the word, then the outcome.
      said.push({ key: 'lines', text: [...first, guessLine(round.impostor)].join(' ') });
      if (wordShown) said.push({ key: 'word', text: `The word was ${wordText}` });
      if (complete) said.push({ key: 'outcome', text: result.outcome });
    } else if (complete) {
      said.push({ key: 'lines', text: [...first, `The word was ${wordText}`, result.outcome].join(' ') });
    }
  }
  // Reopened: nothing is said again.
  useState(() => {
    if (!live) for (const s of said) heard.add(s.key);
    return true;
  });
  const keys = said.map((s) => s.key).join('|');
  useEffect(() => {
    const fresh = said.filter((s) => !heard.has(s.key));
    if (fresh.length === 0) return;
    for (const s of fresh) heard.add(s.key);
    announce(fresh.map((s) => s.text).join(' '));
    // `keys` stands for the announcements.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, announce, heard]);

  // IMP-081: the screen appears scrolled to the top; after the verdict, scrolled so the outcome is wholly in view.
  const outcomeRef = useRef<HTMLHeadingElement>(null);
  const verdictTapped = useRef(false);
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [building]);
  useLayoutEffect(() => {
    const el = outcomeRef.current;
    if (!complete || !verdictTapped.current || !el) return;
    verdictTapped.current = false;
    const foot = document.querySelector('[data-testid="main-button"]')?.getBoundingClientRect().top ?? window.innerHeight;
    const r = el.getBoundingClientRect();
    if (r.bottom > foot - 8) window.scrollBy(0, r.bottom - foot + 8);
    else if (r.top < 0) window.scrollBy(0, r.top - 8);
  }, [complete]);

  if (building) {
    return (
      <section className="imp-stage imp-center">
        <p className="imp-build-up" data-testid="build-up">
          {named} was…
        </p>
      </section>
    );
  }

  let right: ReactNode = null;
  if (verdictStep) {
    right = (
      <div className="imp-verdict">
        <QuietButton
          onClick={() => {
            verdictTapped.current = true;
            onVerdict(true);
          }}
        >
          Guessed right
        </QuietButton>
        <QuietButton
          onClick={() => {
            verdictTapped.current = true;
            onVerdict(false);
          }}
        >
          Wrong guess
        </QuietButton>
      </div>
    );
  } else if (complete) {
    right = (
      <ResultBlock
        result={result}
        practice={round.practice}
        playerCount={playerCount}
        onPlayers={onPlayers}
        onUndo={onUndo}
        onSkipWord={onSkipWord}
      />
    );
  }

  return (
    <>
      <section className="imp-result-page">
        <div className="imp-result-left">
          <h1 className="imp-headline" data-testid="result-headline">
            {caught ? '✓ Caught!' : '✗ Escaped!'}
          </h1>
          {(tie || !caught) && (
            <p className="imp-result-note" data-testid="result-note">
              {tie ? 'Still a tie.' : `${named} was not the impostor.`}
            </p>
          )}
          <p className="imp-result-impostor" data-testid="result-impostor">
            <Caps>{round.impostor}</Caps> was the impostor
          </p>
          {/* IMP-039: the guess line stays until "Next round" (also reopened, IMP-091, and after "Undo", IMP-037). */}
          {lastChance && (
            <p className="imp-result-note" data-testid="guess-line">
              {guessLine(round.impostor)}
            </p>
          )}
          {wordShown && (
            <div className="imp-result-word-block">
              <p className="imp-body" data-testid="word-label">
                The word was
              </p>
              <p className={wordText.length > 12 ? 'imp-result-word imp-result-word-long' : 'imp-result-word'} data-testid="result-word">
                {wordText}
              </p>
              {word?.other_names && (
                <p className="imp-small" data-testid="also-called">
                  Also called {word.other_names}
                </p>
              )}
              <p className="imp-category" data-testid="word-category">
                {word?.category ?? ''}
              </p>
            </div>
          )}
          {complete && (
            <h2 ref={outcomeRef} className="imp-outcome" data-testid="round-outcome">
              {result.outcome}
            </h2>
          )}
        </div>
        {right && <div className="imp-result-right">{right}</div>}
      </section>
      {guessStep && (
        <MainButton
          onClick={() => {
            onShowWord();
          }}
        >
          {round.impostor} guessed. Show the word
        </MainButton>
      )}
      {complete && (
        <>
          <EndGameButton onClick={onEndGame} />
          <MainButton onClick={onNext}>Next round</MainButton>
        </>
      )}
    </>
  );
}

/** IMP-039: the caught impostor's last chance. */
const guessLine = (name: string) => `Last chance, ${name}! Guess the word out loud. Get it right and you win the round.`;

/**
 * Item 7 and 8 of IMP-033: the game line or this round's points (with "Players (5) ›" on the same row, right-aligned,
 * IMP-074) and the scoreboard, then the quiet buttons.
 */
function ResultBlock({
  result,
  practice,
  playerCount,
  onPlayers,
  onUndo,
  onSkipWord,
}: {
  result: ResultInfo;
  practice: boolean;
  playerCount: number;
  onPlayers: () => void;
  onUndo: () => void;
  onSkipWord: () => void;
}) {
  return (
    <>
      <div className="imp-result-line">
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
        <button type="button" className="imp-text-button imp-players-link" onClick={onPlayers}>
          Players ({playerCount}) ›
        </button>
      </div>
      {result.rows && <Scoreboard rows={result.rows} scoresFrom={result.scoresFrom} />}
      {(result.canUndo || result.canSkipWord) && (
        <div className="imp-result-quiet">
          {result.canUndo && <QuietButton onClick={onUndo}>Undo</QuietButton>}
          {result.canSkipWord && <QuietButton onClick={onSkipWord}>This word didn't work</QuietButton>}
        </div>
      )}
    </>
  );
}

/**
 * IMP-044: one row per player, rank, name and total; rows at least 36 px, growing when a name wraps. One column up
 * to 360 px wide and in landscape; two columns of 50% from 390 px wide in portrait, the first holding the first
 * ceil(n / 2) rows. Never its own scroll area. Players who left are greyed. "Scores since round N" when N > 1
 * (IMP-043).
 */
export function Scoreboard({ rows, scoresFrom }: { rows: readonly ScoreRow[]; scoresFrom: number | null }) {
  const perColumn = Math.ceil(rows.length / 2);
  return (
    <div className="imp-scoreboard" data-testid="scoreboard">
      {scoresFrom !== null && scoresFrom > 1 && <p className="imp-small">Scores since round {scoresFrom}</p>}
      <ol className="imp-score-list" style={{ ['--imp-score-rows' as string]: String(perColumn) }}>
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
