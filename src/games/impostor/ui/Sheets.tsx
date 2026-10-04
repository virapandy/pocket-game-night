// The sheets: How to play (IMP-070, IMP-072), More options (IMP-076), Settings (IMP-014, IMP-107, IMP-109) and
// Players between rounds (IMP-074). None shows a word or a role.
import { useState } from 'react';
import type { Preferences } from '../../../engine';
import { wordById, type Choices } from '../rules';
import { PREF } from './evening';
import { OptionButton, QuietButton, Sheet, Switch, Toast, useToast } from './parts';
import { PlayerList } from './Setup';

/**
 * The last-chance guess of a set of choices (IMP-076). Choices saved before the setting existed had the guess, so they
 * read as on (IMP-009, IMP-096).
 */
export const guessOn = (choices: Choices): boolean => choices.lastGuess !== false;

/**
 * IMP-070, IMP-072: "How to play", opened only on request (the choices screen or the menu). Its text follows the
 * choices it is given: the mode's paragraph, and the guess paragraph only with the last-chance guess on. "Practice
 * round first" (IMP-071) only when opened from a new evening's choices screen. No word, hint or role (IMP-013).
 */
export function RulesSheet({
  choices,
  onDone,
  onPractice,
}: {
  choices: Choices;
  onDone: () => void;
  onPractice?: () => void;
}) {
  return (
    <Sheet title="How to play" onDone={onDone}>
      <div className="imp-rules">
        <h2 className="imp-subtitle">Read this aloud</h2>
        <ol className="imp-read">
          <li>Everyone sees the secret word except one impostor.</li>
          <li>Clockwise, say one word about it. Don't say the word!</li>
          <li>Talk, then on 3, 2, 1 everyone points.</li>
          <li>Whoever gets the most fingers is revealed. Caught: you win. Wrong person: the impostor wins.</li>
        </ol>
        <p>
          {choices.mode === 'easy' ? 'The impostor sees the category and a hint.' : 'The impostor sees nothing and never starts.'}
        </p>
        {guessOn(choices) && <p>A caught impostor can win the round by guessing the word.</p>}
        <ul className="imp-read">
          <li>Not allowed: the word itself, a rhyme, a translation, or 'thing'.</li>
          <li>Repeating someone's clue is allowed.</li>
          <li>Kids may use up to 3 words.</li>
        </ul>
        {onPractice && (
          <QuietButton className="imp-practice-first" onClick={onPractice}>
            Practice round first
          </QuietButton>
        )}
      </div>
    </Sheet>
  );
}

/**
 * IMP-076: "More options": "Last guess for a caught impostor", Off / On. The change applies only on "Done"; any
 * other way of closing it keeps the choice as it was.
 */
export function MoreOptionsSheet({ lastGuess, onDone }: { lastGuess: boolean; onDone: (lastGuess: boolean) => void }) {
  const [on, setOn] = useState(lastGuess);
  return (
    <Sheet title="More options" onDone={() => onDone(on)}>
      <div className="imp-group-wrap">
        <div className="imp-group imp-group-wide" role="group" aria-labelledby="imp-group-guess">
          <span id="imp-group-guess" className="imp-group-label">
            Last guess for a caught impostor
          </span>
          <OptionButton selected={!on} onClick={() => setOn(false)}>
            Off
          </OptionButton>
          <OptionButton selected={on} onClick={() => setOn(true)}>
            On
          </OptionButton>
        </div>
        <p className="imp-small">A caught impostor can win the round by guessing the word.</p>
      </div>
    </Sheet>
  );
}

const readIds = (prefs: Preferences): string[] =>
  (prefs.get<unknown>(PREF.blockedWords, []) as unknown[]).filter((x): x is string => typeof x === 'string');

/**
 * IMP-109: the host switches "Larger text" and "Tap to show instead of hold" (with IMP-014's note), and IMP-107's
 * "Skipped words (N)" with "Bring back". Kept on this phone. Also shown in the app's Settings.
 */
export function ImpostorSettings({ prefs }: { prefs: Preferences }) {
  const [larger, setLarger] = useState(() => prefs.get<boolean>(PREF.largerText, false) === true);
  const [tap, setTap] = useState(() => prefs.get<boolean>(PREF.tapToShow, false) === true);
  const [skipped, setSkipped] = useState<string[]>(() => readIds(prefs));
  // Newest first: the list is kept oldest first.
  const shown = [...skipped].reverse().filter((id) => wordById(id));
  return (
    <section className="imp-settings" aria-label="Impostor">
      <Switch
        label="Larger text"
        checked={larger}
        onChange={(on) => {
          prefs.set(PREF.largerText, on);
          setLarger(on);
        }}
      />
      <Switch
        label="Tap to show instead of hold"
        checked={tap}
        onChange={(on) => {
          prefs.set(PREF.tapToShow, on);
          setTap(on);
        }}
      />
      {/* IMP-014: the note shows only while "Tap to show" is on. */}
      {tap && <p className="imp-small">Your screen reader will say the word out loud. Use earphones or turn the volume down.</p>}
      {shown.length > 0 && (
        <>
          <h2 className="imp-subtitle">Skipped words ({shown.length})</h2>
          <ul className="imp-skipped">
            {shown.map((id) => {
              const w = wordById(id)!;
              return (
                <li key={id} className="imp-skipped-row">
                  <span>{w.word}</span>
                  <button
                    type="button"
                    className="imp-quiet"
                    aria-label={`Bring back ${w.word}`}
                    onClick={() => {
                      const next = skipped.filter((x) => x !== id);
                      prefs.set(PREF.blockedWords, next);
                      setSkipped(next);
                    }}
                  >
                    Bring back
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/** Settings from the Impostor menu: closing returns to the same screen with nothing else changed (IMP-109). */
export function SettingsSheet({ prefs, onDone }: { prefs: Preferences; onDone: () => void }) {
  return (
    <Sheet title="Settings" onDone={onDone}>
      <ImpostorSettings prefs={prefs} />
    </Sheet>
  );
}

/**
 * IMP-074: "Players" between rounds: the list of IMP-003; ✕ removes at once with an undo toast inside the sheet
 * ("Kabir left · Points kept · Undo" when keeping score); never below 3. "Done" hands back the final list.
 */
export function PlayersSheet({
  players: start,
  past,
  keepingScore,
  onDone,
}: {
  players: readonly string[];
  past: readonly string[];
  keepingScore: boolean;
  onDone: (players: string[]) => void;
}) {
  const [players, setPlayers] = useState<string[]>(() => [...start]);
  const [tooFew, setTooFew] = useState(false);
  const [toast, showToast, clearToast] = useToast();
  return (
    <Sheet title="Players" onDone={() => onDone(players)}>
      <PlayerList
        players={players}
        past={past}
        onChange={(next) => {
          setTooFew(false);
          setPlayers(next);
        }}
        onRemove={(i) => {
          if (players.length <= 3) {
            setTooFew(true);
            return;
          }
          const name = players[i]!;
          setPlayers(players.filter((_, k) => k !== i));
          // "Undo" puts them back in the same seat.
          const back = () =>
            setPlayers((cur) =>
              cur.some((p) => p.toLowerCase() === name.toLowerCase()) ? cur : [...cur.slice(0, i), name, ...cur.slice(i)],
            );
          showToast(keepingScore ? `${name} left · Points kept` : `${name} left`, back);
        }}
      />
      {tooFew && (
        <p role="alert" className="imp-alert">
          Keep at least 3 players.
        </p>
      )}
      <Toast toast={toast} onDone={clearToast} />
    </Sheet>
  );
}
