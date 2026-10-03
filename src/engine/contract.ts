// The game contract: every game answers the same seven questions (see CLAUDE.md in this folder).
// Rules are pure functions of their inputs: no screen, network, storage, timers, clock or Math.random().

import type { Seed } from './random';
import type { ActorId, Move, MoveRecord } from './moves';
import type { ReportSafeGame } from './reports';

/** Who is looking. The room is what everyone may see on the host phone turned outwards. */
export type Viewer =
  | { readonly kind: 'host' }
  | { readonly kind: 'room' }
  | { readonly kind: 'player'; readonly playerId: ActorId };

export interface SetupInput<Config> {
  readonly gameId: string;
  /**
   * Named seeds, one per secret (Tambola: the draw seed and the sheet seed). Seeds never leave the
   * host phone; other phones receive only what their view allows.
   */
  readonly seeds: Readonly<Record<string, Seed>>;
  /** Players, settings and anything else the game asks for at setup. */
  readonly config: Config;
}

export interface MoveContext {
  readonly by: ActorId;
  /** The time on the move record. */
  readonly at: number;
  /**
   * The record's position number (`MoveRecord.seq`), so a game can name exactly which record a later undo may take
   * back (Impostor's verdict, IMP-037). Set by the referee in `play` and `replay`; absent when a rule is called directly.
   */
  readonly seq?: number;
}

export type Verdict<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string };

export interface UndoRequest<M extends Move> {
  readonly record: MoveRecord<M>;
  readonly by: ActorId;
  /** When the undo was asked for, so time windows (such as 5 seconds for a call) can be judged. */
  readonly now: number;
}

export interface GameRules<Config, State, M extends Move, View = unknown> {
  /** The game type, such as "tambola". */
  readonly id: string;

  /** 1. Setup: the starting state from the players, settings and seeds. */
  setup(input: SetupInput<Config>): State;

  /**
   * 2. Legal moves: what this actor can do right now, as a finite list of complete moves, so a generic
   * simulated player can choose from it. Moves whose details come from outside the game (numbers
   * read out from a paper ticket) cannot be listed; they are named in `detailMoves`, and apply() judges them.
   */
  legalMoves(state: State, actor: ActorId): readonly M[];
  readonly detailMoves?: readonly M['type'][];

  /**
   * 3. Apply: the state after a move. `ok: false` means the move is not allowed now, and nothing changes.
   * A move that is allowed but fails (a bogey claim) is `ok: true` with the verdict recorded in the state.
   */
  apply(state: State, move: M, ctx: MoveContext): Verdict<State>;

  /** 4. View: exactly what this viewer may see. Never another player's secret or an upcoming draw. */
  view(state: State, viewer: Viewer): View;

  /** 5. Game over: has the game ended? No moves are accepted after this. */
  isOver(state: State): boolean;

  /** 6. Invariants: every rule that must always hold, as plain-English problems. Empty means all is well. */
  invariants(state: State): readonly string[];

  /** 7. Undo: may this recorded move be taken back, by this actor, now? The engine undoes by replaying without it. */
  canUndo(state: State, request: UndoRequest<M>): boolean;

  /** State that lives only on one player's phone (Tambola: ticket marks). It never enters the game state. */
  readonly local?: PlayerLocal<View, unknown, unknown>;

  /**
   * Phase 7 (PLT-201): the setup and moves for a problem report, with every player name replaced by "Player N"
   * (money numbers kept, owner 2026-10-01), still replaying the same calls and claims. Seeds are left to the engine.
   */
  forReport?(setup: SetupInput<Config>, records: readonly MoveRecord<M>[]): ReportSafeGame<Config, M>;
}

export interface PlayerLocal<View, Local, Action> {
  initial(view: View): Local;
  apply(local: Local, action: Action): Local;
}

/** What the app needs to list a game. */
export interface GameInfo {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
}
