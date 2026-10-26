// Mafia game nights written move by move (specs/mafia/api.md "Moves"), as pure data: no game code. The browser tests
// open them through MAF-H6 (`localStorage['pgn.test.load']`, tests/browser/mafia.ts); the rule tests replay every one
// through the rules (tests/games/mafia/saved.test.ts, "every flow replays"), so a flow that breaks a rule fails there.
// The fixture tests/fixtures/mafia-saved-nights-v1.json holds some of them as saved on 25 October 2026 (MAF-093).
import type { Role } from './oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const NINE = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om', 'Sunita', 'Neha'];
export const EXAMPLE_DEAL: Record<string, Role> = {
  Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'mafia', Dev: 'police', Om: 'villager',
  Sunita: 'villager', Neha: 'villager',
};
/** Game 2's deal in the flows: Mafia Riya and Om; Doctor Sunita; Police Neha. */
export const DEAL_2: Record<string, Role> = {
  Riya: 'mafia', Arjun: 'villager', Meena: 'villager', Kabir: 'villager', Zoya: 'villager', Dev: 'villager', Om: 'mafia',
  Sunita: 'doctor', Neha: 'police',
};
export const SEED = 'mafia-example';
/** 25 October 2026, 21:10 in India ("9:10 pm"). */
export const FLOW_T0 = 1_792_942_800_000;

type Move = Record<string, unknown> & { type: string };
const seenAll = (players: readonly string[]): Move[] => players.map((player) => ({ type: 'seen', player }));
const picks = (list: [string, string | null][]): Move[] => list.map(([player, target]) => ({ type: 'nightPick', player, target }));

/**
 * Game 2's deal for the player-walk privacy flows (lane-q, 25 October): Arjun is Mafia again (with Om); Doctor Sunita;
 * Police Neha. So "Arjun was Mafia in 2 games" (MAF-064) is true only if the unfinished game 2 is counted.
 */
export const DEAL_2_ARJUN: Record<string, Role> = {
  Riya: 'villager', Arjun: 'mafia', Meena: 'villager', Kabir: 'villager', Zoya: 'villager', Dev: 'villager', Om: 'mafia',
  Sunita: 'doctor', Neha: 'police',
};
/** Game 2, night 1 (order Arjun … Riya): the Mafia pick Kabir; the Doctor protects herself; Neha checks Arjun. Kabir is out. */
export const G2_NIGHT_1 = picks([
  ['Arjun', 'Kabir'], ['Meena', 'Arjun'], ['Kabir', 'Om'], ['Zoya', 'Arjun'], ['Dev', 'Om'], ['Om', 'Kabir'],
  ['Sunita', 'Sunita'], ['Neha', 'Arjun'], ['Riya', 'Arjun'],
]);
const GAME_2_START: Move[] = [{ type: 'start', players: NINE, mafiaCount: 2 }, ...seenAll(NINE), { type: 'startNight', night: 1 }];

// ---- The MAF-040 worked example, game 1 (Village wins on day 3) ----
/** Night 1, order Riya … Neha: Arjun and Zoya pick Kabir; the Doctor (Meena) protects herself; Dev checks Zoya. Kabir is out. */
export const NIGHT_1 = picks([
  ['Riya', 'Arjun'], ['Arjun', 'Kabir'], ['Meena', 'Meena'], ['Kabir', 'Zoya'], ['Zoya', 'Kabir'], ['Dev', 'Zoya'],
  ['Om', 'Arjun'], ['Sunita', 'Riya'], ['Neha', 'Om'],
]);
/** Night 2, order Arjun … Riya: the Mafia pick Riya, the Doctor protects Riya: nobody is out. Dev checks Arjun. */
export const NIGHT_2 = picks([
  ['Arjun', 'Riya'], ['Meena', 'Riya'], ['Kabir', 'Zoya'], ['Zoya', 'Riya'], ['Dev', 'Arjun'], ['Om', 'Arjun'],
  ['Sunita', 'Neha'], ['Neha', 'Sunita'], ['Riya', 'Zoya'],
]);
/** Night 3, order Meena … Arjun: Arjun (the only Mafia left) picks Meena; the Doctor protects Sunita: Meena is out. */
export const NIGHT_3 = picks([
  ['Meena', 'Sunita'], ['Kabir', 'Arjun'], ['Zoya', 'Riya'], ['Dev', 'Sunita'], ['Om', 'Arjun'], ['Sunita', 'Arjun'],
  ['Neha', 'Arjun'], ['Riya', 'Arjun'], ['Arjun', 'Meena'],
]);
export const START_1: Move = { type: 'start', players: NINE, mafiaCount: 2 };
export const GAME_1: Move[] = [
  START_1, ...seenAll(NINE),
  { type: 'startNight', night: 1 }, ...NIGHT_1, { type: 'voteOut', player: 'Om' },
  { type: 'startNight', night: 2 }, ...NIGHT_2, { type: 'voteOut', player: 'Zoya' },
  { type: 'startNight', night: 3 }, ...NIGHT_3, { type: 'voteOut', player: 'Arjun' },
];

export interface Flow {
  name: string;
  /** What the flow shows when opened (for the reader). */
  what: string;
  deals: Record<string, Record<string, Role>>;
  moves: Move[];
  /** Time of each move after the first, ms (default 1000). */
  gap?: number;
}

const g1 = (n: number) => GAME_1.slice(0, n);
const idx = (m: Move) => GAME_1.indexOf(m);

/**
 * Version 1.2 C and A (owner, 25 October): six players, one Mafia (Arjun), Doctor Meena, Police Dev. Every night the
 * Doctor protects the Mafia's pick (Riya, then Kabir, …) so nobody is out, every day "Nobody today"; Dev checks Riya,
 * Arjun, Meena, Kabir and Zoya on nights 1 to 5. Night 6 starts at seat 5: Dev, with nobody left to check.
 */
export const SIX = NINE.slice(0, 6);
export const SIX_DEAL: Record<string, Role> = { Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'villager', Dev: 'police' };
function policeNobodyLeft(): Move[] {
  const moves: Move[] = [{ type: 'start', players: SIX, mafiaCount: 1 }, ...seenAll(SIX)];
  const checks = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya'];
  for (let r = 1; r <= 5; r++) {
    const victim = r % 2 === 1 ? 'Riya' : 'Kabir';
    moves.push({ type: 'startNight', night: r });
    for (let i = 0; i < 6; i++) {
      const p = SIX[((r - 1) + i) % 6]!;
      const target = p === 'Arjun' || p === 'Meena' ? victim : p === 'Dev' ? checks[r - 1]! : 'Arjun';
      moves.push({ type: 'nightPick', player: p, target });
    }
    moves.push({ type: 'voteNobody', reason: 'chosen' });
  }
  moves.push({ type: 'startNight', night: 6 });
  return moves;
}

export const FLOWS: Flow[] = [
  { name: 'deal-arjun', what: 'B1: the deal, Arjun to see his role (Player 2 of 9)', deals: { 1: EXAMPLE_DEAL },
    moves: [START_1, { type: 'seen', player: 'Riya' }] },
  { name: 'deal-start', what: 'B1: a new game night, only the start recorded (Player 1 of 9)', deals: { 1: EXAMPLE_DEAL }, moves: [START_1] },
  { name: 'night1-start', what: 'N0: night 1, every role seen', deals: { 1: EXAMPLE_DEAL }, moves: [START_1, ...seenAll(NINE)] },
  { name: 'night1-meena', what: 'N1: night 1, Meena\'s turn (3 of 9)', deals: { 1: EXAMPLE_DEAL },
    moves: [START_1, ...seenAll(NINE), { type: 'startNight', night: 1 }, ...NIGHT_1.slice(0, 2)] },
  { name: 'morning1', what: 'N3 then M1: night 1 over, Kabir out', deals: { 1: EXAMPLE_DEAL }, moves: g1(idx(NIGHT_1[8]!) + 1) },
  { name: 'day1-tie', what: 'V3: day 1, Om and Neha tied (the re-vote)', deals: { 1: EXAMPLE_DEAL },
    moves: [...g1(idx(NIGHT_1[8]!) + 1), { type: 'tie', players: ['Om', 'Neha'] }] },
  { name: 'night2-meena', what: 'N1: night 2, Meena\'s turn (2 of 9)', deals: { 1: EXAMPLE_DEAL },
    moves: [...g1(idx(NIGHT_2[0]!) + 1)] },
  { name: 'morning2', what: 'M1: morning, day 2 (nobody out: the Doctor saved Riya)', deals: { 1: EXAMPLE_DEAL },
    moves: g1(idx(NIGHT_2[8]!) + 1) },
  { name: 'vote2', what: 'V4 / N0: Zoya voted out on day 2 (Mafia caught: 1 of 2)', deals: { 1: EXAMPLE_DEAL },
    moves: g1(idx(NIGHT_2[8]!) + 2) },
  { name: 'day3', what: 'M1 / Y1: day 3, Meena out on night 3 (Arjun the last Mafia)', deals: { 1: EXAMPLE_DEAL }, moves: GAME_1.slice(0, -1) },
  { name: 'worked-example-ended', what: 'G1: MAF-023\'s worked example (Arjun picks Kabir, Zoya Om, the phone chooses Om), then End the game',
    deals: { 1: EXAMPLE_DEAL },
    moves: [START_1, ...seenAll(NINE), { type: 'startNight', night: 1 }, ...picks([
      ['Riya', 'Arjun'], ['Arjun', 'Kabir'], ['Meena', 'Meena'], ['Kabir', 'Zoya'], ['Zoya', 'Om'], ['Dev', 'Zoya'], ['Om', 'Arjun'],
      ['Sunita', 'Riya'], ['Neha', 'Kabir']]), { type: 'endGame' }] },
  { name: 'left-neha-ended', what: 'G1: day 1, Neha left by day, then End the game (no winner; Play again without Neha)', deals: { 1: EXAMPLE_DEAL },
    moves: [...g1(idx(NIGHT_1[8]!) + 1), { type: 'leave', player: 'Neha' }, { type: 'endGame' }] },
  { name: 'game1-over', what: 'G1: the Village wins game 1', deals: { 1: EXAMPLE_DEAL }, moves: GAME_1 },
  { name: 'game2-over', what: 'G1: game 2 ended with no winner (Tonight: Village 1 · Mafia 0)', deals: { 1: EXAMPLE_DEAL, 2: DEAL_2 },
    moves: [...GAME_1, { type: 'start', players: NINE, mafiaCount: 2 }, ...seenAll(NINE), { type: 'startNight', night: 1 }, { type: 'endGame' }] },
  { name: 'night3-meena', what: 'N1: night 3, Meena first (the Doctor protected Riya on night 2; Version 1.2 A)', deals: { 1: EXAMPLE_DEAL },
    moves: g1(idx(NIGHT_3[0]!)) },
  { name: 'night3-dev', what: 'N1: night 3, Dev\'s turn (the Police checked Zoya and Arjun; Version 1.2 A)', deals: { 1: EXAMPLE_DEAL },
    moves: g1(idx(NIGHT_3[3]!)) },
  { name: 'night2-dev-riya-checked', what: 'N1: night 2, Dev\'s turn (5 of 9); Dev checked Riya (Not Mafia) on night 1, Om voted out on day 1 (Version 1.3)',
    deals: { 1: EXAMPLE_DEAL },
    moves: [START_1, ...seenAll(NINE), { type: 'startNight', night: 1 }, ...NIGHT_1.map((m) => (m.player === 'Dev' ? { ...m, target: 'Riya' } : m)),
      { type: 'voteOut', player: 'Om' }, { type: 'startNight', night: 2 }, ...NIGHT_2.slice(0, 4)] },
  { name: 'night1-dev', what: 'N1: night 1, Dev\'s turn (the Police, 6 of 9; Version 1.2 C)', deals: { 1: EXAMPLE_DEAL },
    moves: [START_1, ...seenAll(NINE), { type: 'startNight', night: 1 }, ...NIGHT_1.slice(0, 5)] },
  { name: 'police-nobody-left', what: 'N1: six players, night 6, Dev (the Police) first, nobody left to check (Version 1.2 A)',
    deals: { 1: SIX_DEAL }, moves: policeNobodyLeft() },
  { name: 'day1-left-neha', what: 'Y1: day 1, Neha has left by day (Neha · left)', deals: { 1: EXAMPLE_DEAL },
    moves: [...g1(idx(NIGHT_1[8]!) + 1), { type: 'leave', player: 'Neha' }] },
  { name: 'game2-night1-kabir', what: 'N1: game 1 over (Village won), game 2 dealt (Arjun Mafia again), night 1, Kabir\'s turn (3 of 9)',
    deals: { 1: EXAMPLE_DEAL, 2: DEAL_2_ARJUN }, moves: [...GAME_1, ...GAME_2_START, ...G2_NIGHT_1.slice(0, 2)] },
  { name: 'game2-morning1', what: 'N3 then M1: game 1 over, game 2 night 1 over (Kabir out), Arjun Mafia again',
    deals: { 1: EXAMPLE_DEAL, 2: DEAL_2_ARJUN }, moves: [...GAME_1, ...GAME_2_START, ...G2_NIGHT_1] },
];

export function flow(name: string): Flow {
  const f = FLOWS.find((x) => x.name === name);
  if (!f) throw new Error(`no flow ${name}`);
  return f;
}

/** The SavedGame (format 2) of a flow, as the app keeps it; `at0` = the first move's time. */
export function savedFlow(f: Flow, o: { id?: string; at0?: number; status?: string } = {}): any {
  const at0 = o.at0 ?? FLOW_T0;
  const gap = f.gap ?? 1000;
  const records = f.moves.map((move, i) => ({ v: 1, seq: i + 1, at: at0 + i * gap, by: 'host', move }));
  const last = records[records.length - 1]?.at ?? at0;
  return {
    format: 2, gameType: 'mafia', id: o.id ?? `mafia-flow-${f.name}`, createdAt: at0, updatedAt: last,
    status: o.status ?? 'in-progress',
    setup: { gameId: o.id ?? `mafia-flow-${f.name}`, seeds: { roles: SEED }, config: { deals: f.deals } },
    records,
  };
}
