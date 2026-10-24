// Screen lane D (after the game): the words game over, the summary and History show, worked out from the moves
// (scenarios SWD-050–054, 060, 064, 112, 128; exact texts in docs/games/secret-words/text.csv). Pure functions.
import { HOST, play, type SavedGame } from '../../../../engine';
import {
  secretWordsRules, type ClueInForce, type Kind, type PastGame, type SecretWordsConfig, type SecretWordsMove, type SecretWordsState,
  type Team, type Teams,
} from '../../rules';
import type { NightMatch } from '../turn/store';
import { giversPlus, listAnd, other } from '../turn/words';
import { suggestClueGiver } from '../teams';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const clueNumber = (n: ClueInForce['n']) => (n === 'inf' ? '∞' : String(n));

/** The match as it would be with `endGame` recorded now (a game in progress ends early), not saved. */
export function withEndGame(match: NightMatch, at = Date.now()): NightMatch {
  const g = match.state.game;
  if (!g || g.step === 'over') return match;
  const r = play(secretWordsRules, match, { type: 'endGame' }, { by: HOST, at: Math.max(at, match.records[match.records.length - 1]?.at ?? 0) });
  return r.ok ? r.value : match;
}

/** The game that has just ended (the board in play, at game over). */
export function lastGame(s: SecretWordsState): PastGame | null {
  return s.game && s.game.step === 'over' ? (s.games[s.games.length - 1] ?? null) : null;
}

/** SWD-051, 054: heading. */
export function overHeading(s: SecretWordsState): string {
  const g = s.game;
  if (!g || !g.winner) return 'Game ended. No winner.';
  return `${s.teams.names[g.winner]} win!`;
}

/** SWD-051: the result line ("All 9 words found." / "Boom! Chai Champions hit the Landmine."); none when ended early. */
export function overResultLine(s: SecretWordsState): string | null {
  const g = s.game;
  if (!g || !g.winner) return null;
  if (g.landmine) return `Boom! ${s.teams.names[other(g.winner)]} hit the Landmine.`;
  const total = g.kinds.filter((k) => k === g.winner).length;
  return `All ${total} words found.`;
}

/** SWD-128: `near-miss`, after a won game, when the losing team had 1 or 2 words left. */
export function nearMiss(s: SecretWordsState): string | null {
  const g = s.game;
  if (!g || !g.winner) return null;
  const loser = other(g.winner);
  const left = g.kinds.filter((k, i) => k === loser && !g.turned[i]).length;
  if (left !== 1 && left !== 2) return null;
  return `${s.teams.names[loser]} were ${plural(left, 'word', 'words')} away!`;
}

/** SWD-128: the best clue of the game that has just ended: a clue with a word that found at least 2, the most, earliest. */
export function bestClue(clues: readonly ClueInForce[]): { word: string; number: string; found: string } | null {
  let best: ClueInForce | null = null;
  for (const c of clues) {
    if (!c.word || c.found < 2) continue;
    if (!best || c.found > best.found) best = c;
  }
  if (!best || !best.word) return null;
  const n = best.n;
  const all = typeof n === 'number' && n >= 1 && n === best.found;
  const numbered = typeof n === 'number' && n >= 1;
  const number = n === 'inf' ? '(any number)' : numbered && !all ? `for ${n}` : clueNumber(n);
  return { word: best.word, number, found: all ? `all ${best.found} found` : numbered ? `${best.found} words found` : `${best.found} found` };
}

/** Won games by team. */
export function tallyOf(s: SecretWordsState): Record<Team, number> {
  const t: Record<Team, number> = { orange: 0, teal: 0 };
  for (const g of s.games) if (g.winner) t[g.winner]++;
  return t;
}

/** SWD-128 (v3.9): "Chai Champions won the night, 3–2" (orange first on the score) / "A draw tonight, 2–2"; none when no game was won. */
export function nightResult(s: SecretWordsState): string | null {
  const t = tallyOf(s);
  if (t.orange + t.teal === 0) return null;
  const score = `${t.orange}–${t.teal}`;
  if (t.orange === t.teal) return `A draw tonight, ${score}`;
  return `${s.teams.names[t.orange > t.teal ? 'orange' : 'teal']} won the night, ${score}`;
}

/** SWD-052: "Tonight: Chai Champions 1 · Coffee Commandos 0". */
export function tallyLine(s: SecretWordsState): string {
  const t = tallyOf(s);
  return `Tonight: ${s.teams.names.orange} ${t.orange} · ${s.teams.names.teal} ${t.teal}`;
}

/** Games each player is credited with this evening (won and ended early; partners count, SWD-007, 123). */
export function creditedGames(s: SecretWordsState): (p: string) => number {
  const count = new Map<string, number>();
  for (const g of s.games) for (const p of [...g.clueGivers.orange, ...g.clueGivers.teal]) count.set(p, (count.get(p) ?? 0) + 1);
  return (p) => count.get(p) ?? 0;
}

export interface NextGivers {
  readonly clueGivers: Teams['clueGivers'];
  readonly partners: Teams['partners'];
  readonly guessOnly: readonly string[];
}

/** SWD-007: the next game's suggested clue givers (fewest games, earliest in the list), never with a partner. */
export function suggestedGivers(s: SecretWordsState): NextGivers {
  const games = creditedGames(s);
  const t = s.teams;
  return {
    clueGivers: { orange: suggestClueGiver(t.orange, t.guessOnly, games), teal: suggestClueGiver(t.teal, t.guessOnly, games) },
    partners: { orange: null, teal: null },
    guessOnly: [...t.guessOnly],
  };
}

const giversOfNext = (n: NextGivers, t: Team) => [n.clueGivers[t], n.partners[t]].filter((x): x is string => typeof x === 'string');

/** SWD-112: "Next clue givers: Meena and Kabir" (a pair "Nana + Aarav and Kabir"). */
export function nextGiversLine(n: NextGivers): string {
  return `Next clue givers: ${giversPlus(giversOfNext(n, 'orange'))} and ${giversPlus(giversOfNext(n, 'teal'))}`;
}

/** Still valid for these teams (names can change in the Players sheet). */
export function stillFits(n: NextGivers, s: SecretWordsState): boolean {
  const t = s.teams;
  const ok = (team: Team) => {
    const cg = n.clueGivers[team];
    const p = n.partners[team];
    return cg !== null && t[team].includes(cg) && !n.guessOnly.includes(cg) && (p === null || (t[team].includes(p) && p !== cg));
  };
  return ok('orange') && ok('teal') && n.guessOnly.every((p) => s.players.includes(p));
}

// ---- Every game of an evening, with its board at its end (summary, History) ----

export interface PlayedGame {
  readonly past: PastGame;
  readonly words: readonly string[];
  readonly kinds: readonly Kind[];
  readonly turned: readonly boolean[];
  /** The players when it ended (names as renamed since). */
  readonly players: readonly string[];
}

type Setup = SavedGame<SecretWordsConfig, SecretWordsMove>['setup'];

/** Replays the moves and keeps each game's board as it ended. */
export function playedGames(setup: Setup, records: readonly { move: SecretWordsMove; at: number; by: SavedGame['records'][number]['by'] }[]): PlayedGame[] {
  let s = secretWordsRules.setup(setup);
  const out: { words: readonly string[]; kinds: readonly Kind[]; turned: readonly boolean[]; players: string[] }[] = [];
  for (const r of records) {
    const v = secretWordsRules.apply(s, r.move, { by: r.by, at: r.at });
    if (!v.ok) break;
    const before = s.games.length;
    s = v.value;
    if (r.move.type === 'setPlayers' && r.move.renames) {
      const map = r.move.renames;
      for (const g of out) g.players = g.players.map((p) => (Object.prototype.hasOwnProperty.call(map, p) ? map[p]! : p));
    }
    if (s.games.length > before && s.game) out.push({ words: s.game.words, kinds: s.game.kinds, turned: s.game.turned, players: [...s.players] });
  }
  return out.map((g, i) => ({ ...g, past: s.games[i]! })).filter((g) => g.past !== undefined);
}

/** SWD-128: `summary-line` "7 players · 2 games · 17 words found". */
export function summaryLine(played: readonly PlayedGame[]): string {
  const players = new Set<string>();
  let words = 0;
  for (const g of played) {
    for (const p of g.players) players.add(p);
    for (const c of g.past.clues) words += c.found;
  }
  return `${plural(players.size, 'player', 'players')} · ${plural(played.length, 'game', 'games')} · ${plural(words, 'word found', 'words found')}`;
}

/** SWD-128: `clue-credit` "Clues tonight from Riya, Meena and Arjun" (order of first credit, orange first); null if none. */
export function clueCredit(games: readonly PastGame[]): string | null {
  const seen: string[] = [];
  for (const g of games) for (const p of [...g.clueGivers.orange, ...g.clueGivers.teal]) if (!seen.includes(p)) seen.push(p);
  return seen.length ? `Clues tonight from ${listAnd(seen)}` : null;
}

/** SWD-064: "Game 2 · Chai Champions won (Landmine)" / "Game 3 · Ended early". */
export function gameTitle(g: PastGame, names: Teams['names']): string {
  if (!g.winner) return `Game ${g.number} · Ended early`;
  return `Game ${g.number} · ${names[g.winner]} won${g.landmine ? ' (Landmine)' : ''}`;
}

/** SWD-064: a game row "Game 1 · Chai Champions won · Riya and Arjun gave clues". */
export function gameRow(g: PastGame, names: Teams['names']): string {
  return `${gameTitle(g, names)} · ${giversPlus(g.clueGivers.orange)} and ${giversPlus(g.clueGivers.teal)} gave clues`;
}

/** SWD-064: the evening row "Secret Words · 3 games". */
export const eveningTitle = (games: number) => `Secret Words · ${plural(games, 'game', 'games')}`;
