// One What Am I? game night on this phone (lane W2): the engine's SavedGame, the live match replayed from it, and what is
// worked out from saved nights: last-used choices (WAI-003, Version 1.1 item 45), tonight's names (WAI-002), the Start new
// question (WAI-001, Version 1.1 item 41), Home's row (WAI-090, WAI-091), History's row (WAI-092) and the 12-hour end
// (WAI-091, Version 1.1 item 44; product owner 25 October, item 33).
import {
  HOST, play, replay, SAVED_GAME_FORMAT, startMatch,
  type Match, type Preferences, type SavedGame, type SavedGameStore, type Session, type SessionPicker,
} from '../../../engine';
import {
  clockText, homeLine1, homeLine2, playersShort, validChoices, whatAmIRules, whereLine,
  type Choices, type WaiConfig, type WaiMove, type WaiState, type WaiWord,
} from '../rules';

export type Night = SavedGame<WaiConfig, WaiMove>;
export type NightMatch = Match<WaiConfig, WaiState, WaiMove>;
export interface Live { readonly saved: Night; readonly match: NightMatch }

export const GAME_TYPE = 'what-am-i';
const AUTO_END_MS = 12 * 3600_000;

/** This phone's What Am I? settings (`pgn.pref.*`). */
export const PREF = {
  lastChoices: 'whatAmI.lastChoices',
  largerText: 'largerText',
  /** Settings "Answer by moving the phone" (WAI-013): on unless turned off. */
  motion: 'whatAmI.motion',
  /** Version 1.1 item 16: unknown · granted · refused · taps. */
  motionState: 'whatAmI.motionState',
} as const;

/** Every What Am I? preference key, for WAI-H11 (clear this phone's stored state). */
export const PREF_PREFIX = 'whatAmI.';

export const DEFAULT_CHOICES: Choices = { pack: 'mix', time: 60, hold: 'hand', nonveg: false, sounds: true };

/** Screen state that is not a move, kept per game night (`pgn.whatAmI-ui.<id>`); the turn lanes add to it. */
export interface NightUi {
  /** The open turn's time left when it was last paused or hidden (WAI-040, WAI-090). */
  readonly msLeft?: number;
  /** T3 had a word on screen when the page went away (a reload resumes on the Paused cover, WAI-091). */
  readonly wordShowing?: boolean;
  /** "game:round" whose "Round 2" was tapped on R1 (R1 shows until then). */
  readonly roundStarted?: string;
}

export const readUi = (ui: Preferences, id: string): NightUi => {
  const v = ui.get<unknown>(id, {});
  return typeof v === 'object' && v !== null ? (v as NightUi) : {};
};
export const writeUi = (ui: Preferences, id: string, patch: Partial<NightUi>) => ui.set(id, { ...readUi(ui, id), ...patch });

export const isNight = (g: SavedGame): g is Night => g.gameType === GAME_TYPE;

/** Replays a saved game night. Null when it cannot be replayed. */
export function loadNight(saved: SavedGame): NightMatch | null {
  if (!isNight(saved)) return null;
  try {
    const r = replay(whatAmIRules, saved.setup, saved.records);
    return r.ok ? r.value : null;
  } catch {
    return null;
  }
}

/** The saved form of the match: "in-progress" until `endEvening`, then "ended". */
function toSaved(prev: Night, match: NightMatch, now: number): Night {
  return {
    format: SAVED_GAME_FORMAT,
    gameType: GAME_TYPE,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: now,
    status: match.state.step === 'ended' ? 'ended' : 'in-progress',
    setup: match.setup,
    records: match.records,
    ...(prev.sessionId !== undefined ? { sessionId: prev.sessionId } : {}),
  };
}

/** Records one move by the host and saves at once. Null when the rules refuse it. */
export function record(store: SavedGameStore, live: Live, move: WaiMove, at = Date.now()): Live | null {
  const last = live.match.records[live.match.records.length - 1];
  const when = Math.max(at, last?.at ?? 0);
  const r = play(whatAmIRules, live.match, move, { by: HOST, at: when });
  if (!r.ok) return null;
  const saved = toSaved(live.saved, r.value, when);
  store.put(saved);
  return { saved, match: r.value };
}

/**
 * The app takes back its own last moves (WAI-060's and WAI-064's Undo, WAI-042's "Kabir left · Undo"): the night is
 * replayed without its last `n` records. Null when that does not replay.
 */
export function dropLast(store: SavedGameStore, live: Live, n = 1): Live | null {
  const kept = live.match.records.slice(0, Math.max(0, live.match.records.length - n));
  const r = replay(whatAmIRules, live.match.setup, kept);
  if (!r.ok) return null;
  const saved = toSaved(live.saved, r.value, Math.max(Date.now(), live.saved.updatedAt));
  store.put(saved);
  return { saved, match: r.value };
}

export function openNight(store: SavedGameStore, id: string): Live | null {
  const saved = store.get(id);
  if (!saved || !isNight(saved)) return null;
  const match = loadNight(saved);
  return match ? { saved, match } : null;
}

// ---- Choices (WAI-003) ----

export function readChoices(raw: unknown): Choices {
  return validChoices(raw) ? { pack: raw.pack, time: raw.time, hold: raw.hold, nonveg: raw.nonveg, sounds: raw.sounds } : DEFAULT_CHOICES;
}
export const lastChoices = (prefs: Preferences): Choices => readChoices(prefs.get<unknown>(PREF.lastChoices, null));

export const sameChoices = (a: Choices, b: Choices) =>
  a.pack === b.pack && a.time === b.time && a.hold === b.hold && a.nonveg === b.nonveg && a.sounds === b.sounds;

// ---- Starting a game night (WAI-004, product owner 25 October, item 8) ----

/** A fresh secret seed from the phone's secure random source. */
export function freshSeed(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function sessionFor(sessions: SessionPicker, now: number): Session {
  const q = sessions.question(now);
  if (q.kind === 'join') return q.session;
  const d = new Date(now);
  return sessions.create(`${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`, now);
}

/** A new game night with its first `start` recorded (S3's "First turn"); the last-used choices saved on this phone. */
export function createNight(opts: {
  store: SavedGameStore;
  prefs: Preferences;
  sessions: SessionPicker;
  players: readonly string[];
  choices: Choices;
  /** WAI-H1b, WAI-H7: from the test hooks (never in the release build). */
  test: { seed?: string; words?: readonly WaiWord[] };
}): Live | null {
  const now = Date.now();
  const sessionId = sessionFor(opts.sessions, now).id;
  const config: WaiConfig = opts.test.words ? { testWords: [...opts.test.words] } : {};
  const setup = { gameId: GAME_TYPE, seeds: { words: opts.test.seed ?? freshSeed() }, config };
  const match = startMatch(whatAmIRules, setup, now) as NightMatch;
  const saved: Night = {
    format: SAVED_GAME_FORMAT,
    gameType: GAME_TYPE,
    id: freshSeed(8),
    createdAt: now,
    updatedAt: now,
    status: 'in-progress',
    sessionId,
    setup,
    records: [],
  };
  const live = record(opts.store, { saved, match }, { type: 'start', players: [...opts.players], choices: opts.choices }, now);
  if (!live) return null;
  opts.prefs.set(PREF.lastChoices, opts.choices);
  return live;
}

/** A game of an open night started again (Play again, "Change players or words" from G1): records `start`. */
export function startGame(store: SavedGameStore, prefs: Preferences, live: Live, players: readonly string[], choices: Choices): Live | null {
  const next = record(store, live, { type: 'start', players: [...players], choices });
  if (next) prefs.set(PREF.lastChoices, choices);
  return next;
}

// ---- Unfinished nights, Start new, the 12-hour end ----

/** The unfinished game night (at most one; the most recently changed if ever more). */
export function unfinishedNight(store: SavedGameStore): Live | null {
  const list = store
    .list()
    .filter((g): g is Night => isNight(g) && g.status === 'in-progress')
    .sort((a, b) => b.updatedAt - a.updatedAt);
  for (const saved of list) {
    const match = loadNight(saved);
    if (match && match.state.step !== 'ended') return { saved, match };
  }
  return null;
}

/** Ends a night: `endGame` if a game is open (an unsaved turn is dropped), then `endEvening`, both at `at`. */
export function endNight(store: SavedGameStore, live: Live, at = Date.now()): Live | null {
  let cur: Live | null = live;
  const s = cur.match.state;
  if (s.step === 'pass' || s.step === 'turn' || s.step === 'review') cur = record(store, cur, { type: 'endGame' }, at);
  if (!cur) return null;
  return record(store, cur, { type: 'endEvening' }, at);
}

/** "Start new (ends that one)" (WAI-001). */
export function endUnfinished(store: SavedGameStore, id: string): void {
  const live = openNight(store, id);
  if (live && live.match.state.step !== 'ended') endNight(store, live);
}

/** Version 1.1 item 44: a night left 12 hours after its last move ends when the app opens. */
export function sweepNights(store: SavedGameStore, now: number): void {
  for (const g of store.list()) {
    if (!isNight(g) || g.status !== 'in-progress') continue;
    const last = g.records[g.records.length - 1]?.at ?? g.updatedAt;
    if (now - last < AUTO_END_MS) continue;
    const match = loadNight(g);
    if (match && match.state.step !== 'ended') endNight(store, { saved: g, match }, now);
  }
}

/** Tonight's first `start`, or the night's creation. */
const firstStart = (live: Live) => live.match.records.find((r) => r.move.type === 'start')?.at ?? live.saved.createdAt;

/** Version 1.1 item 41: the unfinished night and the Start new dialog's body, or null. */
export function startNewAsk(store: SavedGameStore): { id: string; text: string } | null {
  const live = unfinishedNight(store);
  if (!live) return null;
  const s = live.match.state;
  return {
    id: live.saved.id,
    text: `The game night from ${clockText(new Date(firstStart(live)))} (${playersShort(s.order)}) will end.`,
  };
}

/** WAI-090, WAI-091: Home's row, two lines. */
export function homeRow(saved: SavedGame, ui: Preferences): { line1: string; line2: string } | null {
  if (!isNight(saved) || saved.status !== 'in-progress') return null;
  const match = loadNight(saved);
  if (!match) return null;
  const live = { saved, match };
  const msLeft = readUi(ui, saved.id).msLeft;
  const line1 = homeLine1(match.state, msLeft);
  if (line1 === null) return null;
  return { line1, line2: homeLine2(match.state, new Date(firstStart(live))) };
}

/** The where-line for a state, with the paused turn's time left from this phone's screen state. */
export const whereFor = (s: WaiState, ui: NightUi): string | null => whereLine(s, ui.msLeft);

// ---- History (WAI-092) ----

/** "What Am I? · 2 games", for an ended night with at least one game that had a saved turn; else null. */
export function historyTitle(saved: SavedGame): string | null {
  if (!isNight(saved) || saved.status === 'in-progress') return null;
  const match = loadNight(saved);
  if (!match) return null;
  const n = match.state.past.filter((g) => g.turns.length > 0).length;
  if (n === 0) return null;
  return `What Am I? · ${n} ${n === 1 ? 'game' : 'games'}`;
}

// ---- Names (WAI-002: tonight's names in their last order) ----

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function playersOf(g: SavedGame): string[] {
  if (isNight(g)) {
    const m = loadNight(g);
    return m ? [...m.state.order] : [];
  }
  const list = (g.setup?.config as { players?: unknown } | undefined)?.players;
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => (typeof p === 'string' ? p : typeof p === 'object' && p && typeof (p as { name?: unknown }).name === 'string' ? (p as { name: string }).name : ''))
    .map((n) => n.trim())
    .filter((n) => n !== '');
}

/** The most recent game of tonight's session: its players, in its order. Empty with no session tonight. */
export function tonightsNames(store: SavedGameStore, sessions: SessionPicker, now: number): string[] {
  const q = sessions.question(now);
  if (q.kind !== 'join') return [];
  const latest = store
    .list()
    .filter((g) => g.sessionId === q.session.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const out: string[] = [];
  for (const n of latest ? playersOf(latest) : []) if (!out.some((o) => sameName(o, n))) out.push(n);
  return out.slice(0, 20);
}
