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
    rhymes: {
      language: saved.rhymes?.language === 'hi' || saved.rhymes?.language === 'both' ? saved.rhymes.language : tambolaDefaults.rhymes.language,
      familyFriendly: typeof saved.rhymes?.familyFriendly === 'boolean' ? saved.rhymes.familyFriendly : tambolaDefaults.rhymes.familyFriendly,
    },
  };
}

export function saveSettings(prefs: Preferences, settings: TambolaSettings) {
  prefs.set(KEY, settings);
}

export function SettingsPanel({
  settings,
  onChange,
  inGame,
  children,
  onDone,
}: {
  settings: TambolaSettings;
  onChange: (next: TambolaSettings) => void;
  inGame: boolean;
  children?: ReactNode;
  onDone: () => void;
}) {
  const set = (patch: Partial<TambolaSettings>) => onChange({ ...settings, ...patch });
  return (
    <section className="stack" aria-labelledby="settings-title">
      <h1 id="settings-title" className="step-title">Settings</h1>

      <h2 className="section-title">This phone</h2>
      <label className="check-row">
        <input type="checkbox" checked={settings.vibrate} onChange={(e) => set({ vibrate: e.target.checked })} />
        <span>Vibration</span>
      </label>
      <label className="check-row">
        <input type="checkbox" checked={settings.sound} onChange={(e) => set({ sound: e.target.checked })} />
        <span>Sound</span>
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
          <strong>Late joining:</strong> new players can join until {settings.lateJoinUntil} numbers are called (coming in a later version).
        </li>
        <li>
          <strong>Auto-call:</strong> off. The anchor calls each number aloud.
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
