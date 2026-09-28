// Every move is a small, serialisable record. Saved failing games become permanent tests,
// so the record format carries a version number from day one.

/** Who made a move: `HOST`, or a player's id. */
export type ActorId = string;
export const HOST: ActorId = 'host';

/** A game's move: a `type` plus whatever details that move needs (pattern, player, numbers read out). */
export interface Move {
  readonly type: string;
}

export const MOVE_RECORD_VERSION = 1;

export interface MoveRecord<M extends Move = Move> {
  /** Record format version. */
  readonly v: typeof MOVE_RECORD_VERSION;
  /** Position in the game, counting from 1. Never reused, even after an undo. */
  readonly seq: number;
  /** When the move was made (milliseconds since 1970). Rules read time from here, never from the clock. */
  readonly at: number;
  readonly by: ActorId;
  readonly move: M;
}
