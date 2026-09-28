// The referee: the host phone's one true game. It applies moves through a game's rules, checks the
// invariants after every move, replays saved games, and undoes a move by replaying without it.
// A match is never changed in place; every call returns a new one.

import type { GameRules, SetupInput, Verdict, Viewer } from './contract';
import { MOVE_RECORD_VERSION, type ActorId, type Move, type MoveRecord } from './moves';
import { silent, type Announce } from './events';

export interface Match<Config, State, M extends Move> {
  readonly setup: SetupInput<Config>;
  readonly records: readonly MoveRecord<M>[];
  readonly state: State;
}

type AnyRules<C, S, M extends Move> = GameRules<C, S, M, unknown>;

export function startMatch<C, S, M extends Move>(
  rules: AnyRules<C, S, M>,
  setup: SetupInput<C>,
  at: number,
  announce: Announce = silent,
): Match<C, S, M> {
  const state = rules.setup(setup);
  announce({ type: 'game-started', gameType: rules.id, gameId: setup.gameId, at });
  return { setup, records: [], state };
}

/** Plays one move. Refused, with a reason, if the game is over, the move is not allowed, or it would break a rule. */
export function play<C, S, M extends Move>(
  rules: AnyRules<C, S, M>,
  match: Match<C, S, M>,
  move: M,
  ctx: { by: ActorId; at: number },
  announce: Announce = silent,
): Verdict<Match<C, S, M>> {
  if (rules.isOver(match.state)) return { ok: false, reason: 'The game is over.' };
  const last = match.records[match.records.length - 1];
  if (last && ctx.at < last.at) return { ok: false, reason: 'A move cannot be earlier than the move before it.' };

  const result = step(rules, match.state, move, ctx);
  if (!result.ok) return result;

  const record: MoveRecord<M> = { v: MOVE_RECORD_VERSION, seq: (last?.seq ?? 0) + 1, at: ctx.at, by: ctx.by, move };
  const next = { setup: match.setup, records: [...match.records, record], state: result.value };

  const meta = { gameType: rules.id, gameId: match.setup.gameId, at: ctx.at };
  if (match.records.length === 0) announce({ type: 'first-action', ...meta });
  if (rules.isOver(next.state)) announce({ type: 'game-ended', ...meta });
  return { ok: true, value: next };
}

/**
 * Takes back one recorded move, if the game's rules allow it, by replaying every other move in order.
 * Later moves are kept (TAM-072). If any later move would no longer be allowed, the undo is refused
 * and the game stays as it was.
 */
export function undo<C, S, M extends Move>(
  rules: AnyRules<C, S, M>,
  match: Match<C, S, M>,
  seq: number,
  ctx: { by: ActorId; now: number },
): Verdict<Match<C, S, M>> {
  const record = match.records.find((r) => r.seq === seq);
  if (!record) return { ok: false, reason: `There is no move ${seq} to undo.` };
  if (!rules.canUndo(match.state, { record, by: ctx.by, now: ctx.now })) {
    return { ok: false, reason: 'That move cannot be undone.' };
  }
  const kept = match.records.filter((r) => r.seq !== seq);
  const replayed = replay(rules, match.setup, kept);
  if (!replayed.ok) return { ok: false, reason: `Undo would break a later move: ${replayed.reason}` };
  return { ok: true, value: replayed.value };
}

/** Rebuilds a game from its setup and move records. The same inputs always give the same game (TAM-073). */
export function replay<C, S, M extends Move>(
  rules: AnyRules<C, S, M>,
  setup: SetupInput<C>,
  records: readonly MoveRecord<M>[],
): Verdict<Match<C, S, M>> {
  let state = rules.setup(setup);
  for (const record of records) {
    if (record.v !== MOVE_RECORD_VERSION) return { ok: false, reason: `Move ${record.seq} has unknown format ${record.v}.` };
    if (rules.isOver(state)) return { ok: false, reason: `Move ${record.seq} comes after the game ended.` };
    const result = step(rules, state, record.move, { by: record.by, at: record.at });
    if (!result.ok) return { ok: false, reason: `Move ${record.seq}: ${result.reason}` };
    state = result.value;
  }
  return { ok: true, value: { setup, records, state } };
}

export function viewFor<C, S, M extends Move, V>(rules: GameRules<C, S, M, V>, match: Match<C, S, M>, viewer: Viewer): V {
  return rules.view(match.state, viewer);
}

function step<C, S, M extends Move>(rules: AnyRules<C, S, M>, state: S, move: M, ctx: { by: ActorId; at: number }): Verdict<S> {
  const result = rules.apply(state, move, ctx);
  if (!result.ok) return result;
  const broken = rules.invariants(result.value);
  if (broken.length > 0) return { ok: false, reason: `This move would break a rule: ${broken.join('; ')}` };
  return result;
}
