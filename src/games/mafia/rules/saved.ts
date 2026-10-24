// The saved game night (MAF-093, MAF-062, MAF-064, IMP-097) and the browser's test seeds (MAF-H2, H3, H5; item 33).
import { readSavedGame, replay, type MoveRecord, type SavedGame, type SetupInput } from '../../../engine';
import { mafiaRules } from './rules';
import { ROLES, type Game, type MafiaConfig, type MafiaState, type MafiaMove, type NightRecord, type Role, type VoteRecord, type LeftRecord } from './types';

export interface MafiaNightGame {
  number: number;
  players: string[];
  mafiaCount: number;
  roles: Record<string, Role>;
  deals: number;
  over: boolean;
  winner: 'village' | 'mafia' | null;
  endedEarly: boolean;
  nights: (Omit<NightRecord, 'picks'> & { picks: { player: string; target: string | null }[] })[];
  votes: VoteRecord[];
  left: LeftRecord[];
  spotter: { player: string; nights: number; of: number } | null;
  ghost: string | null;
}

export interface MafiaNight {
  seeds: { roles: string };
  ended: boolean;
  keep: boolean;
  games: MafiaNightGame[];
  tally: { village: number; mafia: number };
  summary: { players: number; games: number; mostMafia: { player: string; games: number } | null; spotter: string | null };
}

/** Item 17: per Villager, the nights they picked while in, and those whose pick named a Mafia. */
function spotterNights(g: Game): Map<string, { nights: number; of: number }> {
  const out = new Map<string, { nights: number; of: number }>();
  for (const n of g.nights) {
    for (const p of n.picks) {
      if (p.kind !== 'villager') continue;
      const x = out.get(p.player) ?? { nights: 0, of: 0 };
      x.of += 1;
      if (p.target !== null && g.roles[p.target] === 'mafia') x.nights += 1;
      out.set(p.player, x);
    }
  }
  return out;
}

function spotterOf(g: Game): MafiaNightGame['spotter'] {
  const counts = spotterNights(g);
  let best: MafiaNightGame['spotter'] = null;
  for (const p of g.players) {
    const c = counts.get(p);
    if (c && c.nights >= 2 && (!best || c.nights > best.nights)) best = { player: p, nights: c.nights, of: c.of };
  }
  return best;
}

function ghostOf(g: Game): string | null {
  let best: { player: string; n: number } | null = null;
  for (const p of g.players) {
    if (g.roles[p] !== 'villager' && g.roles[p] !== 'doctor') continue;
    let n = 0;
    for (const night of g.nights) {
      for (const pick of night.picks) if (pick.kind === 'ghost' && pick.player === p && pick.target !== null && g.roles[pick.target] === 'mafia') n++;
    }
    if (n >= 1 && (!best || n > best.n)) best = { player: p, n };
  }
  return best?.player ?? null;
}

/** The player with the most of `count` over tonight's games, at least `min`; ties: the seat order of the first game each played. */
function mostOver(games: readonly Game[], count: (g: Game, p: string) => number, min: number): { player: string; n: number } | null {
  const totals = new Map<string, number>();
  const order: string[] = [];
  for (const g of games) {
    for (const p of g.players) {
      if (!totals.has(p)) { totals.set(p, 0); order.push(p); }
      totals.set(p, (totals.get(p) ?? 0) + count(g, p));
    }
  }
  let best: { player: string; n: number } | null = null;
  for (const p of order) {
    const n = totals.get(p) ?? 0;
    if (n >= min && (!best || n > best.n)) best = { player: p, n };
  }
  return best;
}

/** MAF-093: the game night as History, G1 and G2 read it, by replaying its moves. Null when it is not Mafia or does not replay. */
export function readMafiaNight(saved: unknown): MafiaNight | null {
  const read = readSavedGame(saved);
  if (!read.ok || read.game.gameType !== 'mafia') return null;
  const game = read.game as SavedGame<MafiaConfig, MafiaMove>;
  let r: ReturnType<typeof replay<MafiaConfig, MafiaState, MafiaMove>>;
  try {
    r = replay(mafiaRules, game.setup as SetupInput<MafiaConfig>, game.records as readonly MoveRecord<MafiaMove>[]);
  } catch {
    return null;   // no role seed, or an unknown story edition
  }
  if (!r.ok) return null;
  const s = r.value.state;
  const tally = { village: 0, mafia: 0 };
  const games: MafiaNightGame[] = s.games.map((g) => {
    const over = g.step === 'gameOver';
    if (over && g.winner) tally[g.winner]++;
    return {
      number: g.number, players: [...g.players], mafiaCount: g.mafiaCount, roles: { ...g.roles }, deals: 1 + g.redeals, over,
      winner: over ? g.winner : null, endedEarly: g.endedEarly,
      nights: g.nights.map((n) => ({ ...n, picks: n.picks.map((p) => ({ player: p.player, target: p.target })) })),
      votes: g.votes.map((v) => ({ ...v })), left: g.leftLog.map((l) => ({ ...l })),
      spotter: spotterOf(g), ghost: ghostOf(g),
    };
  });
  const players = new Set(s.games.flatMap((g) => g.players)).size;
  const mostMafia = mostOver(s.games, (g, p) => (g.roles[p] === 'mafia' ? 1 : 0), 2);
  const spotter = mostOver(s.games, (g, p) => spotterNights(g).get(p)?.nights ?? 0, 2);
  return {
    seeds: { roles: s.seed }, ended: s.ended, keep: s.games.some((g) => g.started), games, tally,
    summary: {
      players, games: s.games.length, mostMafia: mostMafia ? { player: mostMafia.player, games: mostMafia.n } : null,
      spotter: spotter?.player ?? null,
    },
  };
}

export interface MafiaTestSeeds {
  seeds?: { roles: string };
  deals?: Record<string, Record<string, Role>>;
  stories?: { out: string[]; saved: string[] };
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStrings = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === 'string');

/**
 * Item 33: the `"mafia"` part of `localStorage['pgn.test.seeds']`, with only the keys present. Null in the release build,
 * when missing, not JSON, not an object, with no "mafia" object, or with a part of the wrong type.
 */
export function readTestSeeds(raw: string | null, release: boolean): MafiaTestSeeds | null {
  if (release || raw === null) return null;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!isObject(data) || !isObject(data.mafia)) return null;
  const m = data.mafia;
  const out: MafiaTestSeeds = {};
  if (m.seeds !== undefined) {
    if (!isObject(m.seeds) || typeof m.seeds.roles !== 'string') return null;
    out.seeds = { roles: m.seeds.roles };
  }
  if (m.deals !== undefined) {
    if (!isObject(m.deals)) return null;
    const deals: Record<string, Record<string, Role>> = {};
    for (const [k, deal] of Object.entries(m.deals)) {
      if (!isObject(deal) || !Object.values(deal).every((r) => ROLES.includes(r as Role))) return null;
      deals[k] = { ...(deal as Record<string, Role>) };
    }
    out.deals = deals;
  }
  if (m.stories !== undefined) {
    if (!isObject(m.stories) || !isStrings(m.stories.out) || !isStrings(m.stories.saved)) return null;
    out.stories = { out: [...m.stories.out], saved: [...m.stories.saved] };
  }
  return out;
}
