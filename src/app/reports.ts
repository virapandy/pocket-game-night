// Problem reports waiting to be sent (PLT-202, PLT-206, PLT-208, PLT-209). Reports are kept in this phone's
// storage until they are sent, so they survive a reload. A report about a game still being played waits until
// that game has ended or been discarded, then gets its seeds and goes (PLT-206).
//
// Sending: nothing is ever sent while the phone is offline, every waiting report is tried when the connection
// returns and when the app opens, and one report is never sent twice at the same time.
//
// TODO(PLT-208): there is no real destination yet (owner decision, 28 September 2026). Until one is chosen,
// "sending" goes to a stub that keeps the report on this phone and sends nothing anywhere. A real free,
// no-account destination must replace `stubSend` before any wider public release (docs/handover.md).
import { addSeeds, readReport, reportText, type Report, type SavedGameStore } from '../engine';

const WAITING_KEY = 'pgn.reports.waiting';
/** Reports the stub has "sent": kept on this phone only (PLT-208). */
const KEPT_KEY = 'pgn.reports.kept';
const KEPT_MAX = 50;
/** How often waiting reports are looked at (a game may have ended), and how long a failed send waits to retry. */
const CHECK_MS = 1_500;
const RETRY_MS = 30_000;

/** Stand-in for a real destination, used by the tests: `window.__pgnSendReport(text)`. */
type SendHook = (text: string) => Promise<unknown>;
const hook = (): SendHook | null => {
  const f = (window as unknown as { __pgnSendReport?: unknown }).__pgnSendReport;
  return typeof f === 'function' ? (f as SendHook) : null;
};
export const hasRealDestination = () => hook() !== null;

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

const listeners = new Set<() => void>();
const changed = () => listeners.forEach((f) => f());
export function onReportsChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

export const waitingReports = (): Report[] => readList(WAITING_KEY);

export function deleteWaiting(id: string) {
  writeList(
    WAITING_KEY,
    waitingReports().filter((r) => r.id !== id),
  );
  changed();
}

/** The stub destination (PLT-208): keeps the report on this phone. Nothing leaves it. */
function stubSend(text: string): Promise<void> {
  const r = readReport(text);
  if (r.ok) writeList(KEPT_KEY, [...readList(KEPT_KEY), r.report].slice(-KEPT_MAX));
  return Promise.resolve();
}

const inFlight = new Set<string>();
const failedAt = new Map<string, number>();
let store: SavedGameStore | null = null;

/** Tries every waiting report that may go now. */
export function sendWaiting() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const now = Date.now();
  for (const waiting of waitingReports()) {
    if (inFlight.has(waiting.id)) continue;
    const failed = failedAt.get(waiting.id);
    if (failed !== undefined && now - failed < RETRY_MS) continue;
    let report = waiting;
    if (report.waitingForGameEnd) {
      const saved = report.game ? store?.get(report.game.id) : undefined;
      if (!saved) continue;
      report = addSeeds(report, saved);
      if (report.waitingForGameEnd) continue;
      // The game is over: keep the report with its seeds (still on the host phone) until it is sent.
      writeList(
        WAITING_KEY,
        waitingReports().map((r) => (r.id === report.id ? report : r)),
      );
    }
    const text = reportText(report);
    const send = hook() ?? stubSend;
    inFlight.add(report.id);
    let sending: Promise<unknown>;
    try {
      sending = Promise.resolve(send(text));
    } catch (e) {
      sending = Promise.reject(e);
    }
    sending.then(
      () => {
        inFlight.delete(report.id);
        failedAt.delete(report.id);
        writeList(
          WAITING_KEY,
          waitingReports().filter((r) => r.id !== report.id),
        );
        changed();
      },
      () => {
        inFlight.delete(report.id);
        failedAt.set(report.id, Date.now());
      },
    );
  }
}

/** Keeps a report to send (PLT-202): at once if it can go, otherwise when the connection returns or its game ends. */
export function queueReport(report: Report) {
  writeList(WAITING_KEY, [...waitingReports().filter((r) => r.id !== report.id), report]);
  changed();
  sendWaiting();
}

let started = false;
/** Starts the quiet sender once, when the app opens. It never shows anything or changes the screen. */
export function startReportSender(games: SavedGameStore) {
  store = games;
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => {
    failedAt.clear();
    sendWaiting();
  });
  setInterval(() => {
    if (waitingReports().length > 0) sendWaiting();
  }, CHECK_MS);
  sendWaiting();
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
