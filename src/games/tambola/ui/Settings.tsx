// Game settings (TAM-130): every house rule in plain words with the convention as default,
// the rhyme choices, and this phone's vibration and sound (TAM-135).
import type { ReactNode } from 'react';
import type { Preferences } from '../../../engine';
import { tambolaDefaults, type RhymeLanguage, type TambolaSettings } from '../rules';

const KEY = 'tambola.settings';

/** The settings the next new game starts with: the defaults, plus anything the host changed. */
export function loadSettings(prefs: Preferences): TambolaSettings {
  const saved = prefs.get<Partial<TambolaSettings>>(KEY, {});
  return {
    ...tambolaDefaults,
    ...(saved.bogey === 'carry-on' || saved.bogey === 'out' ? { bogey: saved.bogey } : {}),
    ...(typeof saved.vibrate === 'boolean' ? { vibrate: saved.vibrate } : {}),
    ...(typeof saved.sound === 'boolean' ? { sound: saved.sound } : {}),
    ...(Number.isInteger(saved.lateJoinUntil) && saved.lateJoinUntil! >= 0 && saved.lateJoinUntil! <= 90 ? { lateJoinUntil: saved.lateJoinUntil! } : {}),
    rhymes: {
      language: saved.rhymes?.language === 'hi' || saved.rhymes?.language === 'both' ? saved.rhymes.language : tambolaDefaults.rhymes.language,
      familyFriendly: typeof saved.rhymes?.familyFriendly === 'boolean' ? saved.rhymes.familyFriendly : tambolaDefaults.rhymes.familyFriendly,
    },
  };
}

export function saveSettings(prefs: Preferences, settings: TambolaSettings) {
  // Voice and auto-call are chosen in each game and start off in every new one (TAM-060, TAM-120, TAM-180).
  prefs.set(KEY, { ...settings, speakCalls: false, autoCall: 'off' });
}

/** Choices for late joining (TAM-067): until how many numbers are called; 0 turns it off. */
const LATE_JOIN_CHOICES = [0, 5, 10, 15, 20, 30];

export function SettingsPanel({
  settings,
  onChange,
  inGame,
  children,
  gameControls,
  dark,
  onDark,
  onDone,
}: {
  settings: TambolaSettings;
  onChange: (next: TambolaSettings) => void;
  inGame: boolean;
  children?: ReactNode;
  /** In a game: the voice and auto-call switches, for this game only (TAM-180, TAM-120). */
  gameControls?: ReactNode;
  dark: boolean;
  onDark: (on: boolean) => void;
  onDone: () => void;
}) {
  const set = (patch: Partial<TambolaSettings>) => onChange({ ...settings, ...patch });
  return (
    <section className="stack" aria-labelledby="settings-title">
      {/* TAM-120 (UX list row 18): during a game, the way back to the calling screen is at the top, not only at the
          bottom of a long page. */}
      {inGame && (
        <header className="top-bar">
          <button type="button" className="button button-quiet" onClick={onDone}>
            ← Back
          </button>
        </header>
      )}
      <h1 id="settings-title" className="step-title">Settings</h1>

      {gameControls}

      <h2 className="section-title">This phone</h2>
      <label className="check-row">
        <input type="checkbox" checked={settings.vibrate} onChange={(e) => set({ vibrate: e.target.checked })} />
        <span>Vibration</span>
      </label>
      <label className="check-row">
        <input type="checkbox" checked={settings.sound} onChange={(e) => set({ sound: e.target.checked })} />
        <span>Sound</span>
      </label>
      <label className="check-row">
        <input type="checkbox" role="switch" checked={dark} onChange={(e) => onDark(e.target.checked)} />
        <span>Dark mode</span>
      </label>

      {children}

      <h2 className="section-title">House rules</h2>
      {inGame && <p className="note">Changes to house rules and rhymes apply from the next game, never to this one.</p>}
      <ul className="rules-list">
        <li>
          <strong>Ties:</strong> players who complete the same pattern on the same number share the prize.
        </li>
        <li>
          <strong>Late claims:</strong> a claim made after the next number is called is a bogey.
        </li>
        <li>
          <label className="field">
            <span>
              <strong>Bogey</strong> (a false claim)
            </span>
            <select value={settings.bogey} onChange={(e) => set({ bogey: e.target.value === 'carry-on' ? 'carry-on' : 'out' })}>
              <option value="out">The ticket is out for the rest of the game</option>
              <option value="carry-on">Carry on playing</option>
            </select>
          </label>
        </li>
        <li>
          <strong>Tickets per player:</strong> {settings.ticketsPerPlayer} each, up to {settings.maxTicketsPerPlayer}.
        </li>
        <li>
          <label className="field">
            <span>Late joining</span>
            <select
              value={String(LATE_JOIN_CHOICES.includes(settings.lateJoinUntil) ? settings.lateJoinUntil : 10)}
              onChange={(e) => set({ lateJoinUntil: Number(e.target.value) })}
            >
              {LATE_JOIN_CHOICES.map((n) => (
                <option key={n} value={String(n)}>
                  {n === 0 ? 'Off: no late players' : `Until ${n} numbers are called`}
                </option>
              ))}
            </select>
          </label>
        </li>
        <li>
          <strong>Calling:</strong> the anchor calls each number aloud. The phone's voice and auto-call can be turned on
          in a game's Settings.
        </li>
      </ul>

      <h2 className="section-title">Rhymes</h2>
      <label className="field">
        <span>Rhyme language</span>
        <select
          value={settings.rhymes.language}
          onChange={(e) => set({ rhymes: { ...settings.rhymes, language: e.target.value as RhymeLanguage } })}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="both">English and Hindi</option>
        </select>
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={settings.rhymes.familyFriendly}
          onChange={(e) => set({ rhymes: { ...settings.rhymes, familyFriendly: e.target.checked } })}
        />
        <span>Family-friendly rhymes only</span>
      </label>

      <button type="button" className="button" onClick={onDone}>
        Done
      </button>
    </section>
  );
}
