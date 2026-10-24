// Shared helpers for the Mafia rule tests (C3, written before the build, 25 October 2026).
// The names and shapes are MAF-H1 to MAF-H5 made exact for the Build role in specs/mafia/api.md. Everything is imported
// from src/games/mafia/index.ts only.
//
// The module is loaded with a dynamic import, so that until the game is built every test fails on its own with
// "src/games/mafia is not built yet", instead of the whole file failing to load.
import { HOST, createRng, play, startMatch, type Match } from '../../../src/engine';
import { oracleCounts, type Role } from './oracle';

export * from './oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */
const MODULE = '../../../src/games/mafia/index.ts';
const loaded: any = await import(/* @vite-ignore */ MODULE).catch((e: unknown) => ({ __loadError: e }));

/** One export of src/games/mafia/index.ts, or a clear failure when it is not there yet. */
export function need<T = any>(name: string): T {
  if (loaded && '__loadError' in loaded) {
    const why = String((loaded.__loadError as Error)?.message ?? loaded.__loadError).split('\n')[0];
    throw new Error(`src/games/mafia is not built yet (needs ${name}): ${why}`);
  }
  if (loaded[name] === undefined) throw new Error(`${name} is not exported from src/games/mafia yet`);
  return loaded[name] as T;
}

export const rules = (): any => need('mafiaRules');
export const mafiaCounts = (n: number): { suggested: number; allowed: number[] } => need<any>('mafiaCounts')(n);
export const readMafiaNight = (saved: unknown): any => need<any>('readMafiaNight')(saved);
export const readTestSeeds = (raw: string | null, release: boolean): any => need<any>('readTestSeeds')(raw, release);

// ---- The example players and deal (Terms) ----

import { NINE, EXAMPLE_DEAL } from './flows';
export { NINE, EXAMPLE_DEAL };
export const EXAMPLE_SEED = 'mafia-example';
export const ROOM = { kind: 'room' } as const;
export const HOST_VIEWER = { kind: 'host' } as const;
export const asPlayer = (playerId: string) => ({ kind: 'player', playerId }) as const;

export interface NightOptions {
  seed?: string;
  deals?: Record<string, Record<string, Role>>;
  stories?: { out: string[]; saved: string[] };
}
export function setupInput(o: NightOptions = {}): any {
  const config: any = {};
  if (o.deals) config.deals = o.deals;
  if (o.stories) config.stories = o.stories;
  return { gameId: 'mafia', seeds: { roles: o.seed ?? EXAMPLE_SEED }, config };
}

/** 25 October 2026, 21:10 in India (the example "9:10 pm"). */
export const T0 = 1_792_942_800_000;
export type AnyMatch = Match<any, any, any>;

/**
 * One Mafia game night on the engine, one second per move, through the referee (`play`), as specs/mafia/api.md.
 * The walking helpers (`dealAll`, `night`) take the moves `legalMoves` lists, so they follow the rules as built.
 */
export class GameNight {
  readonly rules = rules();
  match: AnyMatch;
  at: number;
  lastReason = '';

  constructor(readonly o: NightOptions = {}) {
    this.match = startMatch(this.rules, setupInput(o), T0);
    this.at = T0;
  }

  get state() { return this.match.state; }
  get records() { return this.match.records; }
  get room(): any { return this.rules.view(this.state, ROOM); }
  pv(player: string): any { return this.rules.view(this.state, asPlayer(player)); }
  legal(): any[] { return this.rules.legalMoves(this.state, HOST) as any[]; }
  moves(): any[] { return this.records.map((r: any) => r.move); }

  /** Plays a move; returns whether the referee accepted it (a refused move changes nothing). */
  try(move: any): boolean {
    const r = play(this.rules, this.match, move, { by: HOST, at: (this.at += 1000) });
    if (r.ok) { this.match = r.value; this.lastReason = ''; return true; }
    this.lastReason = r.reason;
    return false;
  }
  /** Plays a move that must be accepted. */
  must(move: any): this {
    if (!this.try(move)) throw new Error(`refused ${JSON.stringify(move)}: ${this.lastReason}`);
    return this;
  }

  start(players: readonly string[] = NINE, mafiaCount = 2): this { return this.must({ type: 'start', players: [...players], mafiaCount }); }
  /** Every player of the deal taps "Done" in turn (the room view's turn). */
  dealAll(): this {
    for (let i = 0; i < 40 && this.room.step === 'deal'; i++) this.must({ type: 'seen', player: this.room.turn.player });
    if (this.room.step !== 'nightStart') throw new Error(`the deal did not end on nightStart (step ${this.room.step})`);
    return this;
  }
  startNight(): this { return this.must({ type: 'startNight', night: this.room.round }); }
  /** The player whose night turn it is picks `target`, or, when not given, the first name `legalMoves` lists for them. */
  pickNow(target?: string | null): this {
    const player = this.room.turn?.player;
    if (this.room.step !== 'night' || !player) throw new Error(`not a night turn (step ${this.room.step})`);
    if (target !== undefined) return this.must({ type: 'nightPick', player, target });
    const first = this.legal().find((m) => m.type === 'nightPick');
    if (!first) throw new Error(`legalMoves lists no nightPick for ${player}`);
    return this.must(first);
  }
  /**
   * Plays the rest of the night: each player in turn picks picks[player] (a name or null), or the first allowed name.
   * Returns the order of turns taken.
   */
  night(picks: Record<string, string | null> = {}): string[] {
    const order: string[] = [];
    if (this.room.step === 'nightStart') this.startNight();
    for (let i = 0; i < 40 && this.room.step === 'night'; i++) {
      const p = this.room.turn.player as string;
      order.push(p);
      this.pickNow(p in picks ? picks[p] : undefined);
    }
    return order;
  }
  voteOut(player: string): this { return this.must({ type: 'voteOut', player }); }
  nobody(reason: 'chosen' | 'secondTie' = 'chosen'): this { return this.must({ type: 'voteNobody', reason }); }
  leave(player: string): this { return this.must({ type: 'leave', player }); }
}

/** A game night of the example: 9 players, 2 Mafia, the example deal for game 1 (MAF-H3), seed "mafia-example". */
export function exampleNight(o: NightOptions = {}): GameNight {
  return new GameNight({ deals: { 1: EXAMPLE_DEAL }, ...o }).start(NINE, 2);
}

/** The roles of game k as each player's own view shows them. */
export function rolesSeen(g: GameNight): Record<string, Role> {
  const out: Record<string, Role> = {};
  for (const p of g.room.players as string[]) out[p] = g.pv(p).me.role;
  return out;
}

/** A SavedGame of this game night (format 2), as the app keeps it (IMP-096). */
export function savedOf(g: GameNight, id = 'mafia-test-1'): any {
  return {
    format: 2, gameType: 'mafia', id, createdAt: T0, updatedAt: g.at, status: g.rules.isOver(g.state) ? 'ended' : 'in-progress',
    setup: g.match.setup, records: g.records,
  };
}

// ---- Random game nights (MAF-P3, MAF-P4, MAF-P6, the contract suite) ----

export const POOL = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om', 'Sunita', 'Neha', 'Imran', 'Priya', 'Farhan', 'Lata', 'Ravi', 'Asha', 'Gopal', 'Uma', 'Vikram', 'Leela'];

/** One night pick as it happened: who, as what (their own job's kind), whom. */
export interface PickEvent { k: number; r: number; player: string; kind: string; target: string | null }
/** One move tried by the random driver, with the room view before it. */
export interface Step { move: any; ok: boolean; before: any; after: any }

export interface RandomOptions {
  /** Games to start before "End for tonight" (default 1 to 4). */
  games?: number;
  /** Chance per move of a leave (default 1 in 25), of End the game (1 in 120), of an undo after a leave or End (1 in 3). */
  leaveEvery?: number; endEvery?: number;
  /** Most moves before giving up (the game night must have ended by then). */
  maxMoves?: number;
}

/**
 * A random game night, as a host might tap it, through the referee: `start` (detail move) with 5 to 16 random names and
 * an allowed count, then moves taken from `legalMoves`, with sometimes a `tie` (detail move) and an `addNext`.
 * Returns the night, every pick (with the picker's job kind) and every game's deal.
 */
export function randomNight(seed: string, o: RandomOptions = {}) {
  const r = createRng(`random-night:${seed}`);
  const g = new GameNight({ seed: `roles-${seed}` });
  const games = o.games ?? 1 + r.int(4);
  const leaveEvery = o.leaveEvery ?? 25;
  const endEvery = o.endEvery ?? 120;
  const deals: Record<string, Role>[] = [];
  const picks: PickEvent[] = [];
  const steps: Step[] = [];
  const doMove = (move: any) => {
    const before = g.room;
    if (move.type === 'nightPick') picks.push({ k: before.game, r: before.round, player: move.player, kind: g.pv(move.player).job?.kind, target: move.target });
    const ok = g.try(move);
    if (!ok && move.type === 'nightPick') picks.pop();
    steps.push({ move, ok, before, after: g.room });
    // Every deal (start, redeal, and the redeal of an Undo after a deal leave) happens in the deal step.
    if (ok && g.room.step === 'deal') deals[g.room.game - 1] = rolesSeen(g);
    return ok;
  };
  const n = 5 + r.int(12);
  const players = shuffleNames(POOL, r).slice(0, n);
  const counts = oracleCountsLocal(n);
  doMove({ type: 'start', players, mafiaCount: counts[r.int(counts.length)] });
  const max = o.maxMoves ?? 3000;
  for (let i = 0; i < max && !g.rules.isOver(g.state); i++) {
    const room = g.room;
    const legal = g.legal();
    if (legal.length === 0) throw new Error(`${seed}: nothing listed at step ${room.step} and the game night has not ended`);
    const undo = legal.find((m) => m.type === 'unleave' || m.type === 'unEndGame');
    if (undo && r.int(3) === 0) { doMove(undo); continue; }
    if (room.step === 'gameOver') {
      const again = legal.find((m) => m.type === 'start');
      if (room.games >= games || !again) doMove(legal.find((m) => m.type === 'endEvening'));
      else doMove(again);
      continue;
    }
    if (r.int(endEvery) === 0 && legal.some((m) => m.type === 'endGame')) { doMove({ type: 'endGame' }); continue; }
    const leaves = legal.filter((m) => m.type === 'leave');
    if (leaves.length && r.int(leaveEvery) === 0) { doMove(leaves[r.int(leaves.length)]); continue; }
    if (r.int(200) === 0) { doMove({ type: 'addNext', name: `New${i}` }); continue; }
    if (room.step === 'day' && r.int(4) === 0 && room.in.length >= 2) {
      const a = room.in[r.int(room.in.length)], b = room.in[r.int(room.in.length)];
      if (a !== b) { doMove({ type: 'tie', players: [a, b] }); continue; }
    }
    const pool = legal.filter((m) => !['leave', 'endGame', 'unleave', 'unEndGame', 'endEvening'].includes(m.type));
    if (pool.length === 0) { doMove(legal[r.int(legal.length)]); continue; }
    doMove(pool[r.int(pool.length)]);
  }
  return { g, deals, picks, steps };
}

function shuffleNames(names: readonly string[], r: { int(n: number): number }): string[] {
  const out = names.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = r.int(i + 1); [out[i], out[j]] = [out[j]!, out[i]!]; }
  return out;
}
function oracleCountsLocal(n: number): number[] { return oracleCounts(n).allowed; }
