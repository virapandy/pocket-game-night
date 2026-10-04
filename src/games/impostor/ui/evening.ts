// One Impostor evening on this phone: the engine's SavedGame (IMP-096) and the live match replayed from it, plus the
// things worked out from saved evenings: tonight's names (IMP-004), past names (IMP-003), the frozen word sets
// (IMP-052, IMP-096), the session (IMP-009), the unfinished row (IMP-001) and the 12-hour end (IMP-099, IMP-104).
import {
  HOST, play, replay, SAVED_GAME_FORMAT, startMatch, undo,
  type Match, type Preferences, type SavedGame, type SavedGameStore, type Session, type SessionPicker,
} from '../../../engine';
import {
  CATEGORIES, DEFAULT_CHOICES, impostorRules, readTestSeeds, RENAMED_CATEGORIES, withDealtWord,
  type AskedMove, type Choices, type ExcludedWords, type ImpostorConfig, type ImpostorMove, type ImpostorState,
} from '../rules';

export type Evening = SavedGame<ImpostorConfig, ImpostorMove>;
export type EveningMatch = Match<ImpostorConfig, ImpostorState, ImpostorMove>;

const GAME_TYPE = 'impostor';
const H = 3600_000;
/** IMP-090, IMP-091, IMP-099: a round left more than 3 hours is "left halfway". */
export const LEFT_HALFWAY_MS = 3 * H;
/** IMP-104: an evening left more than 12 hours ends by itself. */
const AUTO_END_MS = 12 * H;

export const PREF = {
  lastChoices: 'impostor.lastChoices',
  blockedWords: 'impostor.blockedWords',
  tapToShow: 'impostor.tapToShow',
  largerText: 'largerText',
  /** IMP-070: the session the read-aloud card was shown in, and for which evening. */
  cardShown: 'impostor.cardShown',
} as const;

/** Screen state that is not a move (Test hooks item 13): `pgn.impostor-ui.<id>`. */
export interface UiState {
  readonly timerMs?: number;
  readonly summaryShownAt?: number;
}

export const isImpostor = (g: SavedGame): g is Evening => g.gameType === GAME_TYPE;

/** Replays a saved evening (IMP-096). Null when it cannot be replayed. */
export function loadEvening(saved: SavedGame): EveningMatch | null {
  if (!isImpostor(saved)) return null;
  try {
    const r = replay(impostorRules, saved.setup, saved.records);
    return r.ok ? r.value : null;
  } catch {
    return null;
  }
}

const opensCache = new Map<string, { readonly updatedAt: number; readonly n: number; readonly ok: boolean }>();

/**
 * IMP-096: whether a saved evening still replays. One that doesn't (refused by the rules, or an error while reading,
 * such as a preview evening from before 3.1 without word ids) is never offered anywhere, and never crashes the app.
 */
export function eveningOpens(saved: SavedGame): boolean {
  if (!isImpostor(saved)) return true;
  const hit = opensCache.get(saved.id);
  if (hit && hit.updatedAt === saved.updatedAt && hit.n === saved.records.length) return hit.ok;
  const ok = loadEvening(saved) !== null;
  opensCache.set(saved.id, { updatedAt: saved.updatedAt, n: saved.records.length, ok });
  return ok;
}

/** The saved form of the match: "in-progress" until `endEvening`, then "ended" (PLT-001, IMP-096). */
export function toSaved(prev: Evening, match: EveningMatch, now: number): Evening {
  return {
    format: SAVED_GAME_FORMAT,
    gameType: GAME_TYPE,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: now,
    status: match.state.over ? 'ended' : 'in-progress',
    setup: match.setup,
    records: match.records,
    ...(prev.sessionId !== undefined ? { sessionId: prev.sessionId } : {}),
  };
}

/** Records one move by the host and saves at once (PLT-003). Null when the rules refuse it. */
export function record(
  store: SavedGameStore,
  saved: Evening,
  match: EveningMatch,
  move: AskedMove,
): { saved: Evening; match: EveningMatch } | null {
  const last = match.records[match.records.length - 1];
  const at = Math.max(Date.now(), last?.at ?? 0);
  // A word-dealing move records the id of the word it deals (Test hooks item 1, IMP-096).
  const r = play(impostorRules, match, withDealtWord(match.state, move), { by: HOST, at });
  if (!r.ok) return null;
  const next = toSaved(saved, r.value, at);
  store.put(next);
  return { saved: next, match: r.value };
}

/**
 * `endEvening` (IMP-097, IMP-101, IMP-104, IMP-001 "Start new"): the evening is kept as ended, or deleted when it has
 * no counted round. Returns the ended evening, or null when it was deleted (or could not be ended).
 */
export function endEvening(
  store: SavedGameStore,
  saved: Evening,
  match: EveningMatch,
  at = Date.now(),
): { saved: Evening; match: EveningMatch } | null {
  const last = match.records[match.records.length - 1];
  const when = Math.max(at, last?.at ?? 0);
  const r = play(impostorRules, match, { type: 'endEvening' }, { by: HOST, at: when });
  if (!r.ok) return null;
  if (r.value.state.counted === 0) {
    store.remove(saved.id);
    return null;
  }
  const next = toSaved(saved, r.value, when);
  store.put(next);
  return { saved: next, match: r.value };
}

/** IMP-037: the record of the verdict "Undo" may take back, or null. */
export function undoableVerdict(match: EveningMatch, now = Date.now()) {
  for (let i = match.records.length - 1; i >= 0; i--) {
    const record = match.records[i]!;
    if (record.move.type !== 'verdict') continue;
    return impostorRules.canUndo(match.state, { record, by: HOST, now }) ? record : null;
  }
  return null;
}

/** IMP-037: the engine's undo of that verdict record, saved at once. Null when it cannot be undone. */
export function undoVerdict(store: SavedGameStore, saved: Evening, match: EveningMatch): { saved: Evening; match: EveningMatch } | null {
  const record = undoableVerdict(match);
  if (!record) return null;
  const r = undo(impostorRules, match, record.seq, { by: HOST, now: Date.now() });
  if (!r.ok) return null;
  const next = toSaved(saved, r.value, Math.max(Date.now(), saved.updatedAt));
  store.put(next);
  return { saved: next, match: r.value };
}

/** IMP-101: the evening whose summary is showing and has not been left (in progress or already ended), if any. */
export function pendingSummary(store: SavedGameStore, ui: Preferences): string | null {
  for (const g of store.list().sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (isImpostor(g) && ui.get<UiState>(g.id, {}).summaryShownAt !== undefined) return g.id;
  }
  return null;
}

/** IMP-101: the summary was left; the screen state goes with it. */
export const clearUi = (ui: Preferences, id: string) => ui.set(id, {});

// ---- Rounds, as the room counts them ----

/** "round 4" on Home and the resume card (IMP-001): the round in progress, or the next one between rounds. */
export function roundToShow(state: ImpostorState): number {
  const r = state.phase === 'round' ? state.round : null;
  if (!r || r.step === 'result' || r.number === null) return state.counted + 1;
  return r.number;
}

/** The 12-hour clock of IMP-099: the move that completed the last completed round, or the first move. */
function lastCompletedAt(saved: Evening): number {
  let state = impostorRules.setup(saved.setup);
  let at = saved.records[0]?.at ?? saved.createdAt;
  for (const rec of saved.records) {
    const r = impostorRules.apply(state, rec.move, { by: rec.by, at: rec.at });
    if (!r.ok) break;
    if (r.value.recentImpostors.length > state.recentImpostors.length) at = rec.at;
    state = r.value;
  }
  return at;
}

/**
 * IMP-104: an evening left more than 12 hours after its last completed round ends by itself (kept with its completed
 * rounds, or deleted with none, IMP-097). Evenings whose summary was showing follow IMP-101 instead (not here).
 */
export function sweepEvenings(store: SavedGameStore, ui: Preferences, now: number): void {
  for (const g of store.list()) {
    if (!isImpostor(g) || g.status !== 'in-progress') continue;
    if (ui.get<UiState>(g.id, {}).summaryShownAt !== undefined) continue;
    if (now - lastCompletedAt(g) <= AUTO_END_MS) continue;
    const match = loadEvening(g);
    if (match) endEvening(store, g, match, now);
  }
}

/** The unfinished evening (IMP-001): at most one; the most recently changed if ever more. */
export function unfinishedEvening(store: SavedGameStore): { saved: Evening; match: EveningMatch } | null {
  const list = store
    .list()
    .filter((g): g is Evening => isImpostor(g) && g.status === 'in-progress')
    .sort((a, b) => b.updatedAt - a.updatedAt);
  for (const saved of list) {
    const match = loadEvening(saved);
    if (match) return { saved, match };
  }
  return null;
}

/** "8:40 pm", in Tambola's row format (IMP-001): made here, so every browser writes "pm" the same way. */
export function clock(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** IMP-001: the first two players in the current seat order, then "+N" for the others ("Riya, Arjun +2"). */
export function playersLabel(players: readonly string[]): string {
  const more = players.length - 2;
  return players.slice(0, 2).join(', ') + (more > 0 ? ` +${more}` : '');
}

/** Home's unfinished row and the resume card (IMP-001): "Impostor · Riya, Arjun +2 · round 4". */
export function unfinishedLine(saved: SavedGame): string {
  const match = loadEvening(saved);
  const players = match ? match.state.players : [];
  return `Impostor · ${playersLabel(players)} · round ${match ? roundToShow(match.state) : 1}`;
}

/** History and session rows: players and counted rounds. */
export function describeEvening(saved: SavedGame): { players: number; rounds: number; result: string } {
  const match = loadEvening(saved);
  const config = (saved as Evening).setup?.config;
  const players = match ? match.state.players.length : (config?.players?.length ?? 0);
  if (!match) return { players, rounds: 0, result: 'Could not be opened' };
  const n = match.state.counted;
  // IMP-094: an evening in progress shows no rounds, words or names in History.
  if (saved.status === 'in-progress') return { players, rounds: n, result: 'In progress' };
  return { players, rounds: n, result: `${n} ${n === 1 ? 'round' : 'rounds'}` };
}

// ---- Names (IMP-003, IMP-004) ----

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** A saved game's players in seat order, whatever the game (names as strings, or `{ name }`). */
function playersOf(g: SavedGame): string[] {
  if (isImpostor(g)) {
    const m = loadEvening(g);
    if (m) return [...m.state.players];
  }
  const list = (g.setup?.config as { players?: unknown } | undefined)?.players;
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => (typeof p === 'string' ? p : typeof p === 'object' && p && typeof (p as { name?: unknown }).name === 'string' ? (p as { name: string }).name : ''))
    .map((n) => n.trim())
    .filter((n) => n !== '');
}

/** IMP-004: the most recent game of tonight's session: its players, in its order. Empty with no session tonight. */
export function tonightsNames(store: SavedGameStore, sessions: SessionPicker, now: number): string[] {
  const q = sessions.question(now);
  if (q.kind !== 'join') return [];
  const latest = store
    .list()
    .filter((g) => g.sessionId === q.session.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return latest ? playersOf(latest).slice(0, 20) : [];
}

/** IMP-003: the last 8 distinct names used in any game on this phone, newest game first, in each game's seat order. */
export function pastNames(store: SavedGameStore): string[] {
  const out: string[] = [];
  const games = store.list().sort((a, b) => b.createdAt - a.createdAt);
  for (const g of games) {
    for (const n of playersOf(g)) {
      if (out.length >= 8) return out;
      if (!out.some((o) => sameName(o, n))) out.push(n);
    }
  }
  return out;
}

// ---- Choices (IMP-009) ----

/**
 * A stored choices object, checked; the defaults when missing or damaged. Category names not among the 9 are dropped
 * (all 9 when none is left); with `renamed`, names from before 4 October are mapped first (IMP-009, `lastChoices` only).
 * A missing `lastGuess` reads as off for a stored `lastChoices` (IMP-009) and as on for a past evening's choices
 * (`savedEvening`, IMP-096).
 */
export function readChoices(raw: unknown, opts: { renamed?: boolean; savedEvening?: boolean } = {}): Choices {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_CHOICES;
  const c = raw as Partial<Record<keyof Choices, unknown>>;
  const stored = Array.isArray(c.categories)
    ? (c.categories as unknown[]).map((k) => (opts.renamed && typeof k === 'string' ? RENAMED_CATEGORIES[k] ?? k : k))
    : null;
  const categories = stored ? CATEGORIES.filter((k) => stored.includes(k)) : [...CATEGORIES];
  return {
    mode: c.mode === 'hard' ? 'hard' : 'easy',
    talking: c.talking === 'timer' ? 'timer' : 'free',
    score: c.score === true,
    words: c.words === 'grownups' ? 'grownups' : 'family',
    categories: categories.length > 0 ? categories : [...CATEGORIES],
    nonveg: c.nonveg === true,
    lastGuess: typeof c.lastGuess === 'boolean' ? c.lastGuess : opts.savedEvening === true,
  };
}

export const lastChoices = (prefs: Preferences): Choices => readChoices(prefs.get<unknown>(PREF.lastChoices, null), { renamed: true });

// ---- Starting an evening (IMP-009, IMP-052, IMP-060, IMP-064, IMP-096) ----

/** A fresh secret seed from the phone's secure random source (IMP-060). */
export function freshSeed(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * IMP-008, IMP-009: tonight's session by PLT-016's rules, with no question: joined while the last game was within 3
 * hours; otherwise a new one with the suggested day name ("Sunday 4 Oct").
 */
function sessionFor(sessions: SessionPicker, now: number): Session {
  const q = sessions.question(now);
  if (q.kind === 'join') return q.session;
  return sessions.create(suggestedSessionName(now), now);
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function suggestedSessionName(now: number): string {
  const d = new Date(now);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** IMP-052, IMP-096: the word sets frozen at the first "Start round". */
function excludedWords(store: SavedGameStore, prefs: Preferences, sessionId: string, exceptId: string | null): ExcludedWords {
  const evenings = store
    .list()
    .filter((g): g is Evening => isImpostor(g) && g.id !== exceptId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const dealtTonight = new Set<string>();
  const recent = new Set<string>();
  const blocked = new Set<string>(
    (prefs.get<unknown>(PREF.blockedWords, []) as unknown[]).filter((x): x is string => typeof x === 'string'),
  );
  evenings.forEach((g, i) => {
    const m = loadEvening(g);
    if (!m) return;
    if (i < 3) for (const w of m.state.dealt) recent.add(w);
    if (g.sessionId === sessionId) {
      for (const w of m.state.dealt) dealtTonight.add(w);
      // "Don't know this word?" tonight (IMP-015): the evening's own blocked words beyond the frozen ones.
      for (const w of m.state.blocked) if (!m.state.frozen.blocked.includes(w)) blocked.add(w);
    }
  });
  return { dealtTonight: [...dealtTonight], recent: [...recent], blocked: [...blocked] };
}

/**
 * A new evening at its first "Start round" (or the same evening again, rewritten, when nothing was recorded yet):
 * seeds made fresh unless a development or preview build has `pgn.test.seeds` (IMP-064), saved at once.
 */
export function createEvening(opts: {
  store: SavedGameStore;
  prefs: Preferences;
  sessions: SessionPicker;
  players: readonly string[];
  choices: Choices;
  testSeedsRaw: string | null;
  release: boolean;
  /** An evening created before with no move yet (back from the read-aloud card): it is rewritten, not doubled. */
  reuse?: Evening | null;
}): { saved: Evening; match: EveningMatch } {
  const now = Date.now();
  const { store, prefs } = opts;
  const reuse = opts.reuse && opts.reuse.records.length === 0 ? opts.reuse : null;
  const sessionId = reuse?.sessionId ?? sessionFor(opts.sessions, now).id;
  let seeds: { word: string; starter: string };
  let testDeals: ImpostorConfig['testDeals'];
  if (reuse) {
    seeds = { word: reuse.setup.seeds.word ?? freshSeed(), starter: reuse.setup.seeds.starter ?? freshSeed() };
    testDeals = reuse.setup.config.testDeals;
  } else {
    const test = readTestSeeds(opts.testSeedsRaw, opts.release);
    seeds = { word: test?.word ?? freshSeed(), starter: test?.starter ?? freshSeed() };
    testDeals = test?.deals;
  }
  const config: ImpostorConfig = {
    players: [...opts.players],
    choices: { ...opts.choices, categories: [...opts.choices.categories] },
    excludedWords: excludedWords(store, prefs, sessionId, reuse?.id ?? null),
    ...(testDeals !== undefined ? { testDeals: testDeals.map((d) => ({ ...d })) } : {}),
  };
  const setup = { gameId: GAME_TYPE, seeds, config };
  const match = startMatch(impostorRules, setup, now) as EveningMatch;
  const saved: Evening = {
    format: SAVED_GAME_FORMAT,
    gameType: GAME_TYPE,
    id: reuse?.id ?? freshSeed(8),
    createdAt: reuse?.createdAt ?? now,
    updatedAt: now,
    status: 'in-progress',
    sessionId,
    setup,
    records: [],
  };
  store.put(saved);
  prefs.set(PREF.lastChoices, config.choices);
  return { saved, match };
}

/** IMP-070: the read-aloud card shows for the first Impostor evening of tonight's session only. */
export function cardDue(prefs: Preferences, saved: Evening): boolean {
  const shown = prefs.get<{ sessionId?: string; eveningId?: string } | null>(PREF.cardShown, null);
  if (!shown || shown.sessionId !== saved.sessionId) return true;
  return shown.eveningId === saved.id;
}

export function markCardShown(prefs: Preferences, saved: Evening) {
  prefs.set(PREF.cardShown, { sessionId: saved.sessionId, eveningId: saved.id });
}
