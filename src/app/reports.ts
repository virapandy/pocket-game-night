// Problem reports not yet shared (PLT-206, PLT-208, PLT-209). The app itself never sends a report anywhere: a report
// leaves the phone only when the person shares it through the phone's own share sheet (navigator.share), or copies it
// where the phone has no share sheet. Reports not yet shared are kept in this phone's storage, so they survive a
// reload, and are listed in Settings, "Reports to share". A report about a game still being played waits, without
// seeds, until that game has ended or been discarded (PLT-206); it never reaches the share sheet before.
import { addSeeds, readReport, shareParts, type Report, type SavedGameStore } from '../engine';
import { games } from './games';
import { gameStore, KEY_ROOT } from './storage';

// The preview build keeps its own reports (KEY_ROOT, owner decision 3 October 2026); the families' keys are unchanged.
const WAITING_KEY = `${KEY_ROOT}reports.waiting`;
/** Reports the old stub "sent" (before 22 October 2026): never shared, so they join the list once. */
const KEPT_KEY = `${KEY_ROOT}reports.kept`;
/** Ids of reports that waited for their game to end and have not yet been offered to the share sheet (Home's row). */
const HELD_KEY = `${KEY_ROOT}reports.held`;
/** How often reports waiting for their game are looked at (a game may have ended). */
const CHECK_MS = 1_500;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readList(key: string): Report[] {
  try {
    const raw = JSON.parse(storage()?.getItem(key) ?? '[]') as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((x) => {
      const r = readReport(JSON.stringify(x));
      return r.ok ? [r.report] : [];
    });
  } catch {
    return [];
  }
}
function writeList(key: string, list: readonly Report[]) {
  try {
    storage()?.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not keep the report', e);
  }
}
function readIds(key: string): string[] {
  try {
    const raw = JSON.parse(storage()?.getItem(key) ?? '[]') as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
function writeIds(key: string, ids: readonly string[]) {
  try {
    storage()?.setItem(key, JSON.stringify(ids));
  } catch {
    /* Home's row is a convenience; the report itself is kept */
  }
}

const listeners = new Set<() => void>();
const changed = () => listeners.forEach((f) => f());
export function onReportsChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** Short lines after sharing (PLT-208), shown by the app over any screen. */
const toastListeners = new Set<(text: string) => void>();
export function onShareToast(f: (text: string) => void): () => void {
  toastListeners.add(f);
  return () => toastListeners.delete(f);
}
const toast = (text: string) => toastListeners.forEach((f) => f(text));

export const THANKS = 'Thanks! Your report is on its way.';
export const NOT_SHARED = "Not shared. It's kept in Settings, under Reports to share.";
export const COPIED = 'Report copied. Paste it in a message to whoever shared this app.';
const NOT_COPIED = "Could not copy it. It's kept in Settings, under Reports to share.";
export const WAITS = 'Kept. You can share it when this game ends.';

let migrated = false;
function stored(): Report[] {
  if (!migrated) {
    migrated = true;
    const kept = readList(KEPT_KEY);
    if (kept.length > 0) {
      const waiting = readList(WAITING_KEY);
      const ids = new Set(waiting.map((r) => r.id));
      writeList(WAITING_KEY, [...kept.filter((r) => !ids.has(r.id)), ...waiting]);
    }
    try {
      storage()?.removeItem(KEPT_KEY);
    } catch {
      /* ignore */
    }
  }
  return readList(WAITING_KEY);
}

/** Adds the seeds to every report whose game has now ended or been discarded (PLT-206), and keeps that. */
function release(store: SavedGameStore = gameStore): Report[] {
  const list = stored();
  let any = false;
  const next = list.map((r) => {
    if (!r.waitingForGameEnd || !r.game) return r;
    const saved = store.get(r.game.id);
    if (!saved) return r;
    const done = addSeeds(r, saved);
    if (done !== r) any = true;
    return done;
  });
  if (any) {
    writeList(WAITING_KEY, next);
    queueMicrotask(changed); // never while a screen is being drawn
  }
  return next;
}

/** "Reports to share" (PLT-209): every report not yet shared, newest first. */
export function listedReports(): Report[] {
  return [...release()].sort((a, b) => b.at - a.at);
}

/** Home's row (PLT-206, PLT-208): reports whose game has ended and that have not yet been offered to the share sheet. */
export function readyReports(): Report[] {
  const held = new Set(readIds(HELD_KEY));
  if (held.size === 0) return [];
  return listedReports().filter((r) => held.has(r.id) && !r.waitingForGameEnd);
}

function forget(id: string) {
  writeList(
    WAITING_KEY,
    stored().filter((r) => r.id !== id),
  );
  writeIds(
    HELD_KEY,
    readIds(HELD_KEY).filter((x) => x !== id),
  );
}

export function deleteWaiting(id: string) {
  forget(id);
  changed();
}

function keep(report: Report) {
  writeList(WAITING_KEY, [...stored().filter((r) => r.id !== report.id), report]);
}

const titleOf = (report: Report): string | null => {
  if (report.game) return games.find((g) => g.info.id === report.game!.gameType)?.info.title ?? null;
  return report.from === 'player' ? 'Tambola' : null;
};

const sharing = new Set<string>();
export const isSharing = (id: string) => sharing.has(id);

type ShareNav = Navigator & { share?: (data: ShareData) => Promise<void>; canShare?: (data?: ShareData) => boolean };

/**
 * Opens the phone's share sheet for one report (PLT-208). Must be called straight from a tap: the share sheet needs it.
 * Shared: the report is removed. Closed without sharing: it stays. A share still open is never started twice.
 */
export function shareReport(report: Report) {
  if (report.waitingForGameEnd || sharing.has(report.id)) return;
  keep(report);
  const now = new Date();
  const when = now.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const parts = shareParts(report, { gameTitle: titleOf(report), when, at: now });
  const nav = (typeof navigator === 'undefined' ? null : navigator) as ShareNav | null;
  const done = (text: string) => {
    sharing.delete(report.id);
    changed();
    toast(text);
  };
  sharing.add(report.id);
  changed();

  if (!nav || typeof nav.share !== 'function') {
    // No share sheet: copy the text with the replay code. The report stays until a share completes.
    writeIds(
      HELD_KEY,
      readIds(HELD_KEY).filter((x) => x !== report.id),
    );
    const clip = nav?.clipboard;
    if (!clip || typeof clip.writeText !== 'function') return done(NOT_COPIED);
    clip.writeText(parts.textWithCode).then(
      () => done(COPIED),
      () => done(NOT_COPIED),
    );
    return;
  }

  let data: ShareData = { title: parts.title, text: parts.textWithCode };
  try {
    const file = new File([parts.fileText], parts.fileName, { type: 'application/json' });
    const withFile: ShareData = { title: parts.title, text: parts.text, files: [file] };
    if (typeof nav.canShare !== 'function' || nav.canShare(withFile)) data = withFile;
  } catch {
    /* this phone cannot make files: share the text with the replay code */
  }
  let opened: Promise<void>;
  try {
    opened = nav.share(data);
  } catch (e) {
    opened = Promise.reject(e);
  }
  opened.then(
    () => {
      forget(report.id);
      done(THANKS);
    },
    () => {
      // Closed without sharing (AbortError) or refused: the report stays, in Settings.
      writeIds(
        HELD_KEY,
        readIds(HELD_KEY).filter((x) => x !== report.id),
      );
      done(NOT_SHARED);
    },
  );
}

/**
 * The form's "Share report" (PLT-208). A report about a game still being played is kept without seeds until that game
 * ends (PLT-206), then offered on Home; otherwise the share sheet opens at once.
 */
export function shareFromForm(report: Report) {
  if (report.waitingForGameEnd) {
    keep(report);
    writeIds(HELD_KEY, [...readIds(HELD_KEY).filter((x) => x !== report.id), report.id]);
    changed();
    toast(WAITS);
    return;
  }
  shareReport(report);
}

let started = false;
/** Looks now and then whether a report's game has ended (PLT-206). It never sends or shows anything. */
export function startReportWatch(store: SavedGameStore) {
  if (started || typeof window === 'undefined') return;
  started = true;
  setInterval(() => {
    if (stored().some((r) => r.waitingForGameEnd)) release(store);
  }, CHECK_MS);
  release(store);
}

/** The app's version, set when the app is built. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

/** The phone type from the browser's user agent, such as "Pixel 7 (Android 14), Chrome 129" or "iPhone (iOS 17.0), Safari 17.0". */
export function phoneType(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): string {
  let device = 'Unknown device';
  const ios = /\b(iPhone|iPad|iPod)\b.*?OS (\d+(?:_\d+)*)/.exec(ua);
  const android = /Android\s*([\d.]*)(?:;\s*([^;)]+))?/.exec(ua);
  if (ios) device = `${ios[1]} (iOS ${ios[2]!.replace(/_/g, '.')})`;
  else if (android) {
    const model = android[2]?.trim();
    const version = android[1] ? `Android ${android[1]}` : 'Android';
    device = model && !/^(wv|K|Build\/)/.test(model) ? `${model} (${version})` : version;
  } else if (/Macintosh/.test(ua)) device = 'Mac';
  else if (/Windows/.test(ua)) device = 'Windows';
  else if (/Linux/.test(ua)) device = 'Linux';
  const browsers: [RegExp, string][] = [
    [/EdgA?\/(\d+)/, 'Edge'],
    [/CriOS\/(\d+)/, 'Chrome'],
    [/FxiOS\/(\d+)/, 'Firefox'],
    [/Firefox\/(\d+)/, 'Firefox'],
    [/SamsungBrowser\/(\d+)/, 'Samsung Internet'],
    [/Chrome\/(\d+)/, 'Chrome'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
  ];
  let browser = '';
  for (const [re, name] of browsers) {
    const m = re.exec(ua);
    if (m) {
      browser = `${name} ${m[1]}`;
      break;
    }
  }
  return browser ? `${device}, ${browser}` : device;
}
