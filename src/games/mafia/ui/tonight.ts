// Tonight's Mafia game night as the screens keep it: one engine SavedGame holding every game of the night (MAF-093),
// saved at every move (MAF-091). Where the room is (the screen id and its where-line, MAF-090), where a resumed game
// night opens, the test loader (MAF-H6, item 34) and Home's row (MAF-091). No rules here: the rules engine is the referee.
import {
  HOST, SAVED_GAME_FORMAT, play, readSavedGame, replay, type Match, type MoveRecord, type Preferences, type SavedGame,
  type SavedGameStore, type SetupInput,
} from '../../../engine';
import { MAFIA_STORY_EDITION, mafiaRules, readTestSeeds, type MafiaConfig, type MafiaMove, type MafiaState, type MafiaView } from '../rules';
import { T } from './text';

export type MafiaMatch = Match<MafiaConfig, MafiaState, MafiaMove>;
export type MafiaSaved = SavedGame<MafiaConfig, MafiaMove>;

/**
 * Screen ids (Version 1.1 item 1): B1 deal pass, B2 role card, N0 Night begins, N1 night pass, N2 night job, N3 Night
 * over, M1 Morning, Y1 Day, V1 countdown, V2 picker, V2t tie, V3 re-vote, V3s "Still a tie", V4 vote result, G1 Game over,
 * G2 Tonight's summary.
 */
export type ScreenId = 'b1' | 'b2' | 'n0' | 'n1' | 'n2' | 'n3' | 'm1' | 'y1' | 'v1' | 'v2' | 'v2t' | 'v3' | 'v3s' | 'v4' | 'g1' | 'g2';

/** Private screens (Terms): no menu, no Pause, no toast. */
export const PRIVATE: readonly ScreenId[] = ['b2', 'n2'];
/** MAF-050 (item 2): the screens with the Pause icon; MAF-053: the room screens with "··· Menu" (the same list). */
export const ROOM_FRAME: readonly ScreenId[] = ['b1', 'n0', 'n1', 'n3', 'm1', 'y1', 'v2', 'v2t', 'v3', 'v3s', 'v4', 'g1'];

export const roomView = (m: MafiaMatch): MafiaView => mafiaRules.view(m.state, { kind: 'room' });
export const lastAt = (m: { records: readonly MoveRecord[] }) => m.records[m.records.length - 1]?.at ?? 0;

/** The where-line of a screen (MAF-090 with item 3). */
export function whereLine(screen: ScreenId, v: MafiaView): string {
  const r = v.round;
  switch (screen) {
    case 'b1':
    case 'b2':
      return T.where.deal(v.turn?.player ?? v.players[0] ?? '');
    case 'n0':
      return T.where.nightStart(r);
    case 'n1':
    case 'n2':
      return v.turn ? T.where.nightTurn(r, v.turn.player) : T.where.nightOver(r);
    case 'n3':
      return T.where.nightOver(r);
    case 'm1':
      return T.where.morning(r);
    case 'y1':
      return T.where.talking(r);
    case 'v1':
    case 'v2':
    case 'v2t':
    case 'v3':
      return T.where.vote(r);
    case 'v3s':
    case 'v4':
      // After the vote the rules wait for the next night (its round); a vote that ends the game keeps the day's.
      return T.where.afterVote(v.step === 'nightStart' ? r - 1 : r);
    case 'g1':
    case 'g2':
      return T.where.gameOver(v.game);
  }
}

/** Screen state kept beside the moves (not a move): `<prefix><id>` → the room screen showing. */
const uiKey = (id: string) => `mafia-ui.${id}`;
export function saveScreen(prefs: Preferences, id: string, screen: ScreenId) {
  prefs.set(uiKey(id), { screen });
}
function savedScreen(prefs: Preferences, id: string): ScreenId | null {
  const s = prefs.get<{ screen?: unknown } | null>(uiKey(id), null);
  return s && typeof s.screen === 'string' ? (s.screen as ScreenId) : null;
}

/**
 * MAF-091 (item 22): where a resumed game night opens: the room screen of the current step, never B2 or N2; the
 * countdown and the tie screen resume at V2 with nothing selected; after a recorded `tie`, V3; V3s and V4 as themselves.
 */
export function resumeScreen(m: MafiaMatch, prefs: Preferences, id: string): ScreenId {
  const v = roomView(m);
  const kept = savedScreen(prefs, id);
  const last = m.records[m.records.length - 1]?.move;
  // Item 27: Tonight's summary opens again as itself (its endings are recorded by then, so without "Oops, keep playing").
  if (kept === 'g2') return 'g2';
  switch (v.step) {
    case 'deal':
      return 'b1';
    case 'nightStart':
      if (kept === 'v4' || kept === 'v3s' || kept === 'n0') return kept;
      if (v.round > 1 && last?.type === 'voteOut') return 'v4';
      if (v.round > 1 && last?.type === 'voteNobody' && last.reason === 'secondTie') return 'v3s';
      return 'n0';
    case 'night':
      return 'n1';
    case 'day':
      if (kept === 'n3' || kept === 'm1' || kept === 'y1') return kept;
      if (kept === 'v1' || kept === 'v2' || kept === 'v2t') return 'v2';
      return last?.type === 'nightPick' || last?.type === 'leave' ? 'n3' : 'm1';
    case 'revote':
      return 'v3';
    case 'gameOver':
      // A night or a vote that ended the game shows its morning or result first.
      if (kept === 'n3' || kept === 'm1' || kept === 'v4') return kept;
      return 'g1';
    default:
      return 'g1';
  }
}

/** Opens a saved Mafia game night, replayed through the rules; null when it is not one or does not replay. */
export function loadNight(store: SavedGameStore, id: string): { saved: MafiaSaved; match: MafiaMatch } | null {
  const saved = store.get(id);
  if (!saved || saved.gameType !== 'mafia') return null;
  try {
    const r = replay(mafiaRules, saved.setup as SetupInput<MafiaConfig>, saved.records as readonly MoveRecord<MafiaMove>[]);
    return r.ok ? { saved: saved as MafiaSaved, match: r.value } : null;
  } catch {
    return null;
  }
}

/** A fresh role seed from the phone's secure random source (MAF-010, PO 32). */
function freshSeed(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * A new game night's setup (MAF-004, PO 32): the frozen story edition and a fresh role seed; in development and preview
 * builds the role seed, deals and story lists of `pgn.test.seeds` (item 33) instead.
 */
export function newSetup(id: string, testSeedsRaw: string | null, release: boolean): SetupInput<MafiaConfig> {
  const test = readTestSeeds(testSeedsRaw, release);
  const config: MafiaConfig = {
    edition: MAFIA_STORY_EDITION,
    ...(test?.deals ? { deals: test.deals } : {}),
    ...(test?.stories ? { stories: test.stories } : {}),
  };
  return { gameId: id, seeds: { roles: test?.seeds?.roles ?? freshSeed() }, config };
}

/** A new game night id. */
export function newNightId(): string {
  return `mafia-${freshSeed().slice(0, 12)}`;
}

/** Plays moves through the rules (each one second apart at most as late as now); null when the rules refuse one. */
export function playMoves(m: MafiaMatch, moves: readonly MafiaMove[], now: number): MafiaMatch | null {
  let cur = m;
  for (const move of moves) {
    const r = play(mafiaRules, cur, move, { by: HOST, at: Math.max(now, lastAt(cur)) });
    if (!r.ok) return null;
    cur = r.value;
  }
  return cur;
}

/** Saves the game night as it now is (MAF-091: every move as it happens). */
export function saveNight(store: SavedGameStore, base: { id: string; createdAt: number }, m: MafiaMatch, now: number) {
  const ended = roomView(m).step === 'ended';
  const game: MafiaSaved = {
    format: SAVED_GAME_FORMAT,
    gameType: 'mafia',
    id: base.id,
    createdAt: base.createdAt,
    updatedAt: Math.max(now, lastAt(m)),
    status: ended ? 'ended' : 'in-progress',
    setup: m.setup,
    records: m.records,
  };
  const prev = store.get(base.id);
  store.put({ ...(prev?.sessionId ? { sessionId: prev.sessionId } : {}), ...game } as SavedGame);
}

/**
 * MAF-H6 (item 34): `localStorage['pgn.test.load']`, a Mafia SavedGame opened on the next load as if resumed
 * (development and preview builds only). Kept on this phone; returns its id, or null.
 */
export function openTestLoad(store: SavedGameStore, raw: string | null, release: boolean): string | null {
  if (release || raw === null) return null;
  try {
    const read = readSavedGame(JSON.parse(raw));
    if (!read.ok || read.game.gameType !== 'mafia') return null;
    store.put(read.game);
    return loadNight(store, read.game.id) ? read.game.id : null;
  } catch {
    return null;
  }
}

/** The unfinished Mafia game night on this phone, most recently changed first; null when none. */
export function unfinishedNight(store: SavedGameStore): string | null {
  const list = store
    .list()
    .filter((g) => g.gameType === 'mafia' && (g.status === 'in-progress' || g.status === 'paused'))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return list[0]?.id ?? null;
}

/**
 * A reload's Mafia game night: the unfinished one, else (item 27) the one ended on Tonight's summary and still showing it,
 * most recently changed first; null when none.
 */
export function reloadNight(store: SavedGameStore, prefs: Preferences): string | null {
  const open = unfinishedNight(store);
  if (open) return open;
  const shown = store
    .list()
    .filter((g) => g.gameType === 'mafia' && g.status === 'ended' && savedScreen(prefs, g.id) === 'g2')
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return shown[0]?.id ?? null;
}

/** "9:10 pm" (as Home's other rows). */
function clock(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/**
 * MAF-091 / PO 30: Home's unfinished row. Line 1 "Mafia · " + the where-line of the screen it resumes at; line 2 the
 * first two players dealt this game who haven't left, "+n" for the rest, tonight's first `start` time, "Tap to resume".
 */
export function homeRow(store: SavedGameStore, prefs: Preferences, id: string): { line1: string; line2: string } | null {
  const night = loadNight(store, id);
  if (!night) return null;
  const v = roomView(night.match);
  if (v.step === 'idle' || v.step === 'ended') return null;
  const screen = resumeScreen(night.match, prefs, id);
  const staying = v.players.filter((p) => !v.left.includes(p));
  const names = staying.slice(0, 2).join(', ') + (staying.length > 2 ? ` +${staying.length - 2}` : '');
  const first = night.match.records.find((r) => r.move.type === 'start')?.at ?? night.saved.createdAt;
  return { line1: `Mafia · ${whereLine(screen, v)}`, line2: `${names} · ${clock(first)} · Tap to resume` };
}

/** MAF-001: the unfinished game night and the Start new dialog's body, or null. */
export function startNewAsk(store: SavedGameStore): { id: string; text: string } | null {
  const id = unfinishedNight(store);
  const night = id ? loadNight(store, id) : null;
  if (!id || !night) return null;
  const v = roomView(night.match);
  if (v.step === 'idle') return null;
  const staying = v.players.filter((p) => !v.left.includes(p));
  const names = staying.slice(0, 2).join(', ') + (staying.length > 2 ? ` +${staying.length - 2}` : '');
  const first = night.match.records.find((r) => r.move.type === 'start')?.at ?? night.saved.createdAt;
  return { id, text: `The game night from ${clock(first)} (${names}) will end.` };
}

/** MAF-001: "Start new (ends that one)" records `endEvening` for it (and `endGame` first when a game is still on). */
export function endUnfinished(store: SavedGameStore, id: string, now: number = Date.now()): void {
  const night = loadNight(store, id);
  if (!night) return;
  const step = roomView(night.match).step;
  if (step === 'ended') return;
  const moves: MafiaMove[] = step === 'gameOver' || step === 'idle' ? [{ type: 'endEvening' }] : [{ type: 'endGame' }, { type: 'endEvening' }];
  const next = playMoves(night.match, moves, now);
  if (next) saveNight(store, { id, createdAt: night.saved.createdAt }, next, now);
}
