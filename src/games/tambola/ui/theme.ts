// Dark mode (TAM-134, TAM-188): an option on this phone, never the default, and never taken from the phone's
// own setting. Only colours change; sizes stay exactly the same.
import { DARK_MODE_PREF, type Preferences } from '../../../engine';

export function isDark(prefs: Preferences): boolean {
  return prefs.get<boolean>(DARK_MODE_PREF, false) === true;
}

export function setDark(prefs: Preferences, on: boolean) {
  prefs.set(DARK_MODE_PREF, on);
  if (on) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
}
