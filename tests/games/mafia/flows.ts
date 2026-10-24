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
  { name: 'day1-left-neha', what: 'Y1: day 1, Neha has left by day (Neha · left)', deals: { 1: EXAMPLE_DEAL },
    moves: [...g1(idx(NIGHT_1[8]!) + 1), { type: 'leave', player: 'Neha' }] },
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
