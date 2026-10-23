// Secret Words game nights on this phone: the engine's SavedGame (SWD-026, SWD-062) and the match replayed from it, plus
// what Home and the picker read from them (SWD-115), Start new (SWD-067), tonight's names (SWD-003), the read-aloud card
// (SWD-010), the saved choices (SWD-066) and making a new game night at its first deal (SWD-009, Test hooks item 2).
import { whereLineFor } from './shared/where';
import {
  HOST, play, replay, SAVED_GAME_FORMAT, startMatch,
  type Match, type Preferences, type SavedGame, type SavedGameStore, type Session, type SessionPicker,
} from '../../../engine';
import {
  readTestSeeds, secretWordsRules,
  type SecretWordsChoices, type SecretWordsConfig, type SecretWordsMove, type SecretWordsState, type SecretWordsTeamNames, type Team,
} from '../rules';
import type { TeamsDraft } from './teams';

export type Night = SavedGame<SecretWordsConfig, SecretWordsMove>;
export type NightMatch = Match<SecretWordsConfig, SecretWordsState, SecretWordsMove>;

export const GAME_TYPE = 'secret-words';
const H = 3600_000;
/** SWD-115: "Last game night" is offered for 36 hours after it ended. */
const LAST_NIGHT_MS = 36 * H;

export const PREF = {
  lastChoices: 'secretWords.lastChoices',
  largerText: 'largerText',
} as const;

export const isNight = (g: SavedGame): g is Night => g.gameType === GAME_TYPE;

/** Replays a saved game night. Null when it cannot be replayed. */
export function loadNight(saved: SavedGame): NightMatch | null {
  if (!isNight(saved)) return null;
  try {
    const r = replay(secretWordsRules, saved.setup, saved.records);
    return r.ok ? r.value : null;
  } catch {
    return null;
  }
}

/** Every Secret Words game night on this phone that still replays. */
export function nightsOn(store: SavedGameStore): { saved: Night; match: NightMatch }[] {
  const out: { saved: Night; match: NightMatch }[] = [];
  for (const g of store.list()) {
    if (!isNight(g)) continue;
    const match = loadNight(g);
    if (match) out.push({ saved: g, match });
  }
  return out;
}

/** The saved form of the match: "in-progress" until `endEvening`, then "ended". */
function toSaved(prev: Night, match: NightMatch, now: number): Night {
  return {
    format: SAVED_GAME_FORMAT,
    gameType: GAME_TYPE,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: now,
    status: match.state.ended ? 'ended' : 'in-progress',
    setup: match.setup,
    records: match.records,
    ...(prev.sessionId !== undefined ? { sessionId: prev.sessionId } : {}),
  };
}

/** Records one move by the host and saves at once (PLT-003). Null when the rules refuse it. */
export function record(store: SavedGameStore, saved: Night, match: NightMatch, move: SecretWordsMove, now = Date.now()): { saved: Night; match: NightMatch } | null {
  const last = match.records[match.records.length - 1];
  const at = Math.max(now, last?.at ?? 0);
  const r = play(secretWordsRules, match, move, { by: HOST, at });
  if (!r.ok) return null;
  const next = toSaved(saved, r.value, at);
  store.put(next);
  return { saved: next, match: r.value };
}

/** The unfinished game night (no `endEvening`): at most one; the most recently changed if ever more. */
export function unfinishedNight(store: SavedGameStore): { saved: Night; match: NightMatch } | null {
  const list = nightsOn(store)
    .filter((n) => n.saved.status === 'in-progress' && !n.match.state.ended)
    .sort((a, b) => b.saved.updatedAt - a.saved.updatedAt);
  return list[0] ?? null;
}

/**
 * SWD-067: "Start new (ends that one)": `endGame` (if a game is in progress), then `endEvening`. No summary. A game night
 * with no game at all is then deleted (SWD-060).
 */
export function endNight(store: SavedGameStore, saved: Night, match: NightMatch, now = Date.now()): void {
  let cur: { saved: Night; match: NightMatch } | null = { saved, match };
  const g = match.state.game;
  if (g && g.step !== 'over') cur = record(store, cur.saved, cur.match, { type: 'endGame' }, now);
  if (!cur) return;
  const done = record(store, cur.saved, cur.match, { type: 'endEvening' }, now);
  if (done && done.match.state.games.length === 0) store.remove(saved.id);
}

// ---- What Home and the picker say (SWD-115) ----

/** "9:00 pm": the phone's local time, "pm" lower case, no leading zero. */
export function clock(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** Won games by team. */
export function tallyOf(s: SecretWordsState): Record<Team, number> {
  const tally: Record<Team, number> = { orange: 0, teal: 0 };
  for (const g of s.games) if (g.winner) tally[g.winner]++;
  return tally;
}

const teamsLine = (n: SecretWordsTeamNames) => `${n.orange} v ${n.teal}`;
const score = (s: SecretWordsState) => {
  const t = tallyOf(s);
  return `${t.orange}–${t.teal}`;
};

/** `where-line` (SWD-110 version 3.6) for Home's row and the resume card: the shared where-line, from the moves. */
export const whereLine = (s: SecretWordsState): string => whereLineFor(s);

/** Home's unfinished row, line 1: "Secret Words, 8:40 pm · Chai Champions v Coffee Commandos · 2–1". */
export const homeRowLine = (saved: Night, s: SecretWordsState) => `Secret Words, ${clock(saved.createdAt)} · ${teamsLine(s.teams.names)} · ${score(s)}`;
/** The picker's resume card, line 1: "Secret Words · Chai Champions v Coffee Commandos · 2–1". */
export const resumeCardLine = (s: SecretWordsState) => `Secret Words · ${teamsLine(s.teams.names)} · ${score(s)}`;
/** The Start new dialog's paragraph (SWD-115). */
export const startNewText = (saved: Night, s: SecretWordsState) =>
  `The game night from ${clock(saved.createdAt)} (${teamsLine(s.teams.names)}, ${score(s)}) will end.`;

/**
 * SWD-115 "Next day": the newest ended (recorded `endEvening`), not deleted game night with at least 1 game, while
 * now − its `endEvening` time < 36 h.
 */
export function lastNight(store: SavedGameStore, now: number): { saved: Night; match: NightMatch; text: string } | null {
  let best: { saved: Night; match: NightMatch; at: number } | null = null;
  for (const n of nightsOn(store)) {
    if (!n.match.state.ended || n.match.state.games.length === 0) continue;
    const end = [...n.saved.records].reverse().find((r) => r.move.type === 'endEvening');
    if (!end || now - end.at >= LAST_NIGHT_MS) continue;
    if (!best || end.at > best.at) best = { ...n, at: end.at };
  }
  if (!best) return null;
  const s = best.match.state;
  const t = tallyOf(s);
  return { saved: best.saved, match: best.match, text: `Last game night: ${s.teams.names.orange} ${t.orange} · ${s.teams.names.teal} ${t.teal}` };
}

// ---- Names (SWD-003) ----

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** A saved game's players in order, whatever the game (names as strings, or `{ name }`). */
function playersOf(g: SavedGame): string[] {
  if (isNight(g)) {
    const m = loadNight(g);
    if (m) return [...m.state.players];
  }
  const list = (g.setup?.config as { players?: unknown } | undefined)?.players;
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => (typeof p === 'string' ? p : typeof p === 'object' && p && typeof (p as { name?: unknown }).name === 'string' ? (p as { name: string }).name : ''))
    .map((n) => n.trim())
    .filter((n) => n !== '');
}

/** SWD-003 (as IMP-004): the most recent game of tonight's session: its players, in its order. */
export function tonightsNames(store: SavedGameStore, sessions: SessionPicker, now: number): string[] {
  const q = sessions.question(now);
  if (q.kind !== 'join') return [];
  const latest = store
    .list()
    .filter((g) => g.sessionId === q.session.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return latest ? playersOf(latest).slice(0, 20) : [];
}

/** SWD-003 (as IMP-003): the last 8 distinct names used in any game on this phone, newest game first. */
export function pastNames(store: SavedGameStore): string[] {
  const out: string[] = [];
  for (const g of store.list().sort((a, b) => b.createdAt - a.createdAt)) {
    for (const n of playersOf(g)) {
      if (out.length >= 8) return out;
      if (!out.some((o) => sameName(o, n))) out.push(n);
    }
  }
  return out;
}

/** SWD-010: the read-aloud card is due while no Secret Words game has been dealt in the current session. */
export function readAloudDue(store: SavedGameStore, sessions: SessionPicker, now: number): boolean {
  const q = sessions.question(now);
  if (q.kind !== 'join') return true;
  return !store.list().some((g) => isNight(g) && g.sessionId === q.session.id && g.records.some((r) => r.move.type === 'deal'));
}

/** SWD-013: the team-name pairs of the 3 most recently started other game nights. */
export function recentPairIds(store: SavedGameStore): string[] {
  return nightsOn(store)
    .sort((a, b) => b.saved.createdAt - a.saved.createdAt)
    .slice(0, 3)
    .map((n) => n.match.state.teams.names.id);
}

/** SWD-024: word ids of the 3 most recently started other game nights, frozen at the new one's creation. */
function recentWordIds(store: SavedGameStore): string[] {
  const ids = new Set<string>();
  for (const n of nightsOn(store).sort((a, b) => b.saved.createdAt - a.saved.createdAt).slice(0, 3)) {
    for (const id of n.match.state.dealt) ids.add(id);
  }
  return [...ids];
}

// ---- Choices (SWD-009, SWD-066, SWD-119) ----

/** The choices on screen: the phones card may be unpicked the first time on a phone. */
export interface ChoicesDraft {
  readonly map: SecretWordsChoices['map'] | null;
  readonly board: SecretWordsChoices['board'];
  readonly landmine: SecretWordsChoices['landmine'];
  readonly words: SecretWordsChoices['words'];
}

/** SWD-119 (K33): the Landmine default when none is saved: Lose your turn with Whole family, Lose the game with + Harder. */
export const landmineDefault = (words: SecretWordsChoices['words']): SecretWordsChoices['landmine'] => (words === 'grownups' ? 'lose' : 'turn');

/**
 * SWD-066: `pgn.pref.secretWords.lastChoices`, each field read on its own (an unknown value gives that field's
 * first-time state); `same` ("Same as last time") only when all four were valid (a missing `landmine` counts as valid);
 * `landmineSaved` when a Landmine value was saved (it then wins over SWD-119's default).
 */
export function readLastChoices(prefs: Preferences): { choices: ChoicesDraft; same: boolean; landmineSaved: boolean } {
  const raw = prefs.get<unknown>(PREF.lastChoices, null);
  const c = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof SecretWordsChoices, unknown>>;
  const map = c.map === 'pass' || c.map === 'shared' || c.map === 'own' ? c.map : null;
  const board = c.board === 'full' || c.board === 'easy' ? c.board : null;
  const words = c.words === 'family' || c.words === 'grownups' ? c.words : null;
  const landmine = c.landmine === 'lose' || c.landmine === 'turn' ? c.landmine : null;
  const w = words ?? 'family';
  return {
    choices: { map, board: board ?? 'full', words: w, landmine: landmine ?? landmineDefault(w) },
    same: raw !== null && map !== null && board !== null && words !== null && (c.landmine === undefined || landmine !== null),
    landmineSaved: landmine !== null,
  };
}

// ---- A new game night, at its first deal (SWD-009, SWD-010) ----

/** A fresh secret seed from the phone's secure random source. */
export function freshSeed(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function suggestedSessionName(now: number): string {
  const d = new Date(now);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Tonight's session by PLT-016's rules, with no question (as Impostor's evenings, IMP-102). */
function sessionFor(sessions: SessionPicker, now: number): Session {
  const q = sessions.question(now);
  if (q.kind === 'join') return q.session;
  return sessions.create(suggestedSessionName(now), now);
}

/** Test hooks item 2: the team seed, read on first entering Make teams for a new evening. */
export function teamSeedFor(testSeedsRaw: string | null, release: boolean): string {
  return readTestSeeds(testSeedsRaw, release)?.teams ?? freshSeed();
}

/**
 * "Let's play" / "Show me the board first" / "Start the game" in a new evening: the game night is created (seeds made
 * fresh unless a development or preview build has `pgn.test.seeds`), then its first `deal` is recorded, and the choices
 * are kept for next time (SWD-066).
 */
export function startNight(opts: {
  store: SavedGameStore;
  prefs: Preferences;
  sessions: SessionPicker;
  players: readonly string[];
  teams: TeamsDraft;
  names: SecretWordsTeamNames;
  splits: number;
  teamSeed: string;
  choices: SecretWordsChoices;
  testSeedsRaw: string | null;
  release: boolean;
}): { saved: Night; match: NightMatch } | null {
  const now = Date.now();
  const { store } = opts;
  const test = readTestSeeds(opts.testSeedsRaw, opts.release);
  const config: SecretWordsConfig = {
    players: [...opts.players],
    teams: {
      orange: [...opts.teams.orange],
      teal: [...opts.teams.teal],
      clueGivers: { ...opts.teams.clueGivers },
      partners: { ...opts.teams.partners },
      names: { id: opts.names.id, orange: opts.names.orange, teal: opts.names.teal },
      guessOnly: [...opts.teams.guessOnly],
    },
    splits: opts.splits,
    choices: { ...opts.choices },
    excludedWords: { recent: recentWordIds(store) },
    ...(test?.boards ? { testBoards: [...test.boards] } : {}),
  };
  const sessionId = sessionFor(opts.sessions, now).id;
  const setup = { gameId: GAME_TYPE, seeds: { deal: test?.deal ?? freshSeed(), teams: opts.teamSeed }, config };
  const match = startMatch(secretWordsRules, setup, now) as NightMatch;
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
  const deal = secretWordsRules.legalMoves(match.state, HOST).find((m) => m.type === 'deal');
  if (!deal) return null;
  const dealt = record(store, saved, match, deal, now);
  if (dealt) opts.prefs.set(PREF.lastChoices, { ...opts.choices });
  return dealt;
}
