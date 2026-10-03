// The sheets over a round: Rules (IMP-072), Settings (IMP-014, IMP-107, IMP-109) and Players between rounds
// (IMP-074). None shows a word or a role.
import { useState } from 'react';
import type { Preferences } from '../../../engine';
import { wordById } from '../rules';
import { PREF } from './evening';
import { Sheet, Switch, Toast, useToast } from './parts';
import { PlayerList } from './Setup';

/** IMP-072: "How to play", for the evening's mode. */
export function RulesSheet({ mode, onDone }: { mode: 'easy' | 'hard'; onDone: () => void }) {
  return (
    <Sheet title="How to play" onDone={onDone}>
      <div className="imp-rules">
        <p>
          {mode === 'easy'
            ? '1. Everyone sees the same secret word, except the impostor, who sees only the category and a hint.'
            : '1. Everyone sees the same secret word, except the impostor, who sees nothing.'}
        </p>
        <p>2. Take turns clockwise. Say one word about the secret word.</p>
        {mode === 'hard' && <p>The impostor never starts.</p>}
        <p>3. Not allowed: the word itself, a rhyme, a translation, or 'thing'. Repeating someone's clue is allowed.</p>
        <p>4. Talk it over, then everyone points at once on 3, 2, 1.</p>
        <p>5. Caught? The impostor gets one guess at the word to steal the round.</p>
        <p>Kids may use up to 3 words.</p>
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
      <p className="imp-small">Your screen reader will say the word out loud. Use earphones or turn the volume down.</p>
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
