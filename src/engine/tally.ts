// The session tally and "Settle up" (PLT-017 to PLT-021, PLT-023, PLT-025, PLT-028), shared by every game
// with money. It reads only each game's MoneyRecord, never a game's own rules (PLT-021).
// Money is calculated, never moved: nothing here makes or asks for a payment (TAM-090).
import type { MoneyRecord } from './money';
import type { GameStatus } from './saved-game';

/** One game as the tally sees it. `money` null or missing means a "No money" game (PLT-023). */
export interface TallyGame {
  readonly id: string;
  readonly sessionId: string;
  readonly status: GameStatus;
  readonly settled: boolean;
  readonly money?: MoneyRecord | null | undefined;
  readonly gameType?: string;
}

export interface TallyPerson {
  readonly name: string;
  readonly paid: number;
  /** Prizes won plus money handed back (PLT-017). */
  readonly gotBack: number;
  /** gotBack − paid. */
  readonly net: number;
}

export interface Tally {
  readonly sessionId: string;
  /** The games in this tally, in the order given. */
  readonly gameIds: readonly string[];
  readonly people: readonly TallyPerson[];
  readonly paidIn: number;
  readonly paidOut: number;
}

export interface HandOver {
  readonly from: string;
  readonly to: string;
  readonly amount: number;
}

/** Is this game in its session's unsettled tally? Ended, not settled, with money (PLT-017, PLT-019, PLT-023). */
export function inTally(game: Omit<TallyGame, 'sessionId'> & { readonly sessionId?: string | undefined }): boolean {
  return game.status === 'ended' && !game.settled && !!game.money && typeof game.sessionId === 'string';
}

/**
 * The unsettled tally of one session: every ended, unsettled game with money in that session, and nothing
 * else (PLT-017, PLT-018, PLT-019, PLT-023). People are matched by name across games (PLT-020) and listed in
 * the order they first appear.
 */
export function tallySession(sessionId: string, games: readonly TallyGame[]): Tally {
  const gameIds: string[] = [];
  const people = new Map<string, { name: string; paid: number; gotBack: number }>();
  for (const g of games) {
    if (g.sessionId !== sessionId || !inTally(g)) continue;
    gameIds.push(g.id);
    for (const p of g.money!.people) {
      const row = people.get(p.name) ?? { name: p.name, paid: 0, gotBack: 0 };
      row.paid += p.paid;
      row.gotBack += p.won;
      people.set(p.name, row);
    }
  }
  const list = [...people.values()].map((p) => ({ ...p, net: p.gotBack - p.paid }));
  return {
    sessionId,
    gameIds,
    people: list,
    paidIn: list.reduce((s, p) => s + p.paid, 0),
    paidOut: list.reduce((s, p) => s + p.gotBack, 0),
  };
}

/** Beyond this many people with money to settle, the exact search is too slow for a phone; a simple plan is used. */
const EXACT_LIMIT = 18;

/**
 * Who pays whom, in whole amounts, in the fewest hand-overs (PLT-028). The fewest is everyone not already at 0,
 * less one for every group that can settle among itself, so the people are split into as many groups that add up
 * to 0 as possible, and each group settles on its own. The same nets always give the same list.
 */
export function settleUp(people: readonly { readonly name: string; readonly net: number }[]): HandOver[] {
  const open = people.filter((p) => p.net !== 0);
  if (open.length === 0) return [];
  const groups = open.length <= EXACT_LIMIT ? zeroGroups(open.map((p) => p.net)) : [open.map((_, i) => i)];
  const out: HandOver[] = [];
  for (const g of groups) out.push(...settleGroup(g.map((i) => open[i]!)));
  return out;
}

/** Splits the nets into as many groups adding up to 0 as possible. Returns index groups. */
function zeroGroups(nets: readonly number[]): number[][] {
  const n = nets.length;
  const size = 1 << n;
  const total = new Float64Array(size);
  const best = new Int32Array(size);
  for (let mask = 1; mask < size; mask++) {
    const low = mask & -mask;
    const i = 31 - Math.clz32(low);
    total[mask] = total[mask ^ low]! + nets[i]!;
    let most = 0;
    for (let j = 0; j < n; j++) if (mask & (1 << j)) most = Math.max(most, best[mask ^ (1 << j)]!);
    best[mask] = most + (total[mask] === 0 ? 1 : 0);
  }
  // Walk back from everyone, taking people out one at a time; each time the rest adds up to 0, a group ends.
  const groups: number[][] = [];
  let current: number[] = [];
  let mask = size - 1;
  while (mask) {
    const here = best[mask]! - (total[mask] === 0 ? 1 : 0);
    let j = 0;
    while (!(mask & (1 << j)) || best[mask ^ (1 << j)] !== here) j++;
    current.push(j);
    mask ^= 1 << j;
    if (total[mask] === 0) {
      groups.push(current.sort((a, b) => a - b));
      current = [];
    }
  }
  return groups.sort((a, b) => a[0]! - b[0]!);
}

/** Settles one group that adds up to 0: the one who owes most pays the one owed most, until everyone is at 0. */
function settleGroup(group: readonly { readonly name: string; readonly net: number }[]): HandOver[] {
  const left = group.map((p) => ({ name: p.name, net: p.net }));
  const out: HandOver[] = [];
  for (;;) {
    let debtor = -1;
    let creditor = -1;
    left.forEach((p, i) => {
      if (p.net < 0 && (debtor < 0 || p.net < left[debtor]!.net)) debtor = i;
      if (p.net > 0 && (creditor < 0 || p.net > left[creditor]!.net)) creditor = i;
    });
    if (debtor < 0 || creditor < 0) return out;
    const d = left[debtor]!;
    const c = left[creditor]!;
    const amount = Math.min(-d.net, c.net);
    out.push({ from: d.name, to: c.name, amount });
    d.net += amount;
    c.net -= amount;
  }
}
