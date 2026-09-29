// Tambola's rules: the seven contract answers, for paper tickets (Phase 1a) and phone tickets (Phase 2).
// Pure: no screen, storage, clock or Math.random(). Randomness comes from the draw seed and the sheet seed.
import {
  createRng,
  deriveSeed,
  HOST,
  shuffle,
  type GameRules,
  type MoneyRecord,
  type MoveContext,
  type Verdict,
  type Viewer,
} from '../../../engine';
import { gameCode } from './codes';
import { apportion } from './prizes';
import { pickRhyme, rhymePack } from './rhymes';
import { cornerNumbers, makeTickets, numbersOn, rowNumbers, type Rows } from './tickets';
import {
  isPattern,
  NEEDS,
  PATTERN_NAMES,
  type ClaimCheck,
  type ClaimRecord,
  type ClaimView,
  type Pattern,
  type Payout,
  type PhoneTicket,
  type SummaryTier,
  type TambolaConfig,
  type TambolaMove,
  type TambolaPlayer,
  type TambolaSettings,
  type Tier,
  type TambolaState,
  type TambolaSummary,
  type TambolaView,
  type TicketView,
} from './types';

/** TAM-060, TAM-130, TAM-135, TAM-154: a new game starts with the room-ritual defaults and the conventions. */
export const tambolaDefaults: TambolaSettings = {
  ties: 'share',
  lateClaims: 'bogey',
  bogey: 'out',
  ticketsPerPlayer: 1,
  maxTicketsPerPlayer: 3,
  lateJoinUntil: 10,
  autoCall: 'off',
  speakCalls: false,
  autoMark: false,
  claimButtons: false,
  verdictsOnPhones: false,
  vibrate: true,
  sound: true,
  rhymes: { language: 'en', familyFriendly: true },
};

const ALL_NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1);
const MAX_TICKETS = 3;
const CALL_UNDO_MS = 5_000;

const refuse = (reason: string): Verdict<TambolaState> => ({
  ok: false,
  reason,
});
const accept = (value: TambolaState): Verdict<TambolaState> => ({
  ok: true,
  value,
});
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// ----- Derived facts -----

function called(state: TambolaState): number[] {
  return state.order.slice(0, state.calledCount);
}

function tierPatterns(state: TambolaState): Pattern[] {
  return state.tiers.map((t) => t.pattern);
}

function wonPatterns(state: TambolaState): Set<Pattern> {
  return new Set(state.claims.filter((c) => c.verdict === 'accepted').map((c) => c.pattern));
}

/** Won tiers the host has not closed yet (TAM-145). */
function awaitingClose(state: TambolaState): Pattern[] {
  const won = wonPatterns(state);
  return tierPatterns(state).filter((p) => won.has(p) && !state.closed.includes(p));
}

/** The last Full House tier in play: Second Full House if there is one. */
function lastFullHouse(state: TambolaState): Pattern {
  return tierPatterns(state).includes('second-full-house') ? 'second-full-house' : 'full-house';
}

function readyToEnd(state: TambolaState): boolean {
  return state.closed.includes(lastFullHouse(state));
}

function playerIndex(state: TambolaState): Map<string, number> {
  return new Map(state.players.map((p, i) => [p.id, i]));
}

/**
 * Each accepted claim's share of an amount, split to the rupee; the extra rupees go in player order
 * (then in claim order) (TAM-087). Returns claim index → amount.
 */
function shares(state: TambolaState, pattern: Pattern, amount: number): Map<number, number> {
  const order = playerIndex(state);
  const winners = state.claims
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.pattern === pattern && c.verdict === 'accepted')
    .sort((a, b) => order.get(creditedTo(state, a.c))! - order.get(creditedTo(state, b.c))! || a.i - b.i);
  const split = apportion(
    amount,
    winners.map(() => 1),
  );
  return new Map(winners.map(({ i }, k) => [i, split[k]!]));
}

/** Who a claim's prize goes to: with a phone ticket, whoever holds the ticket now (TAM-175). */
function creditedTo(state: TambolaState, claim: ClaimRecord): string {
  if (claim.ticket === undefined) return claim.playerId;
  return state.tickets.find((t) => t.number === claim.ticket)?.playerId ?? claim.playerId;
}

/** Pot = tickets in play × contribution (TAM-080), late joiners included (TAM-067). */
function pot(state: TambolaState): number | null {
  const money = state.config.money;
  if (!money) return null;
  return state.players.reduce((s, p) => s + p.tickets, 0) * money.contribution;
}

/**
 * The money of tiers nobody won, handed back equally per ticket, to the rupee (TAM-088, TAM-093).
 * Extra rupees go to tickets in the order the players were listed at setup, a player's tickets together.
 */
function handBack(state: TambolaState, total: number): Map<string, number> {
  const tickets = state.players.reduce((s, p) => s + p.tickets, 0);
  const each = Math.floor(total / tickets);
  let extra = total - each * tickets;
  const out = new Map<string, number>();
  for (const p of state.players) {
    const bonus = Math.min(extra, p.tickets);
    extra -= bonus;
    out.set(p.id, each * p.tickets + bonus);
  }
  return out;
}

function summary(state: TambolaState): TambolaSummary | null {
  if (!state.result) return null;
  const withLabel = (t: (typeof state.tiers)[number]) => (t.label !== undefined ? { label: t.label } : {});
  const bogeys = state.claims.filter((c) => c.verdict === 'bogey').map((c) => ({ playerId: c.playerId, pattern: c.pattern }));
  // A discarded game is void: nobody wins, and every contribution goes back (TAM-140).
  const void_ = state.result === 'discarded';

  const won = new Map<string, number>();
  const tiers: SummaryTier[] = state.tiers.map((t) => {
    const split = void_ ? new Map<number, number>() : shares(state, t.pattern, t.amount);
    const winners = [...split.entries()].sort(([a], [b]) => a - b).map(([i, amount]) => ({ playerId: creditedTo(state, state.claims[i]!), amount }));
    for (const w of winners) won.set(w.playerId, (won.get(w.playerId) ?? 0) + w.amount);
    return { pattern: t.pattern, amount: t.amount, ...withLabel(t), winners };
  });

  const money = state.config.money;
  if (!money) {
    return {
      result: state.result,
      callsMade: state.calledCount,
      pot: null,
      tiers,
      bogeys,
      payouts: null,
      money: null,
    };
  }
  // TAM-088, TAM-144: every tier nobody won hands its money back; with nothing won, that is the whole pot.
  const unclaimed = tiers.filter((t) => t.winners.length === 0).reduce((s, t) => s + t.amount, 0);
  const back = handBack(state, unclaimed);
  const payouts: Payout[] = state.players.map((p) => {
    const paid = p.tickets * money.contribution;
    const w = won.get(p.id) ?? 0;
    const handedBack = back.get(p.id) ?? 0;
    return {
      playerId: p.id,
      name: p.name,
      paid,
      won: w,
      handedBack,
      net: w + handedBack - paid,
      hostGives: w + handedBack,
    };
  });
  const record: MoneyRecord = {
    currency: money.currency,
    people: payouts.map((p) => ({
      personId: p.playerId,
      name: p.name,
      paid: p.paid,
      won: p.won + p.handedBack,
      prizes: p.won,
    })),
  };
  return {
    result: state.result,
    callsMade: state.calledCount,
    pot: pot(state),
    tiers,
    bogeys,
    payouts,
    money: record,
  };
}

// ----- Moves -----

/** Why a win or bogey for this pattern cannot be recorded now, or null if it can. */
function patternProblem(state: TambolaState, pattern: Pattern, forWin: boolean): string | null {
  if (state.calledCount === 0) return 'Call the first number before recording a claim.';
  if (!isPattern(pattern) || !tierPatterns(state).includes(pattern)) return 'That pattern is not a prize in this game.';
  if (!forWin) return null;
  const name = PATTERN_NAMES[pattern];
  if (state.closed.includes(pattern)) return `${name} already won.`;
  if (pattern === 'second-full-house' && !state.closed.includes('full-house')) {
    return 'Second Full House can be won once Full House is closed.';
  }
  return null;
}

/**
 * TAM-037: with paper tickets the anchor checks the ticket in the room and the host records the win.
 * The app does not check numbers or lateness; a win for an open tier is always accepted.
 */
function recordWin(state: TambolaState, move: Extract<TambolaMove, { type: 'record-win' }>): Verdict<TambolaState> {
  const problem = patternProblem(state, move.pattern, true);
  if (problem) return refuse(problem);
  const ids = move.playerIds;
  if (!Array.isArray(ids) || ids.length === 0) return refuse('Pick the player who won.');
  if (new Set(ids).size !== ids.length) return refuse('A player was picked twice.');
  for (const id of ids) {
    const player = state.players.find((p) => p.id === id);
    if (!player) return refuse('That player is not in this game.');
    if (state.claims.some((c) => creditedTo(state, c) === id && c.pattern === move.pattern && c.verdict === 'accepted')) {
      return refuse(`${player.name} has already won ${PATTERN_NAMES[move.pattern]}.`);
    }
  }
  const added: ClaimRecord[] = ids.map((playerId) => ({
    playerId,
    pattern: move.pattern,
    verdict: 'accepted',
    callsBefore: state.calledCount,
  }));
  return accept({ ...state, claims: [...state.claims, ...added] });
}

/** TAM-037, TAM-044: the anchor ruled a bogey; it is recorded against the player and listed in the summary. */
function recordBogey(state: TambolaState, move: Extract<TambolaMove, { type: 'record-bogey' }>): Verdict<TambolaState> {
  const problem = patternProblem(state, move.pattern, false);
  if (problem) return refuse(problem);
  if (!state.players.some((p) => p.id === move.playerId)) return refuse('That player is not in this game.');
  const claim: ClaimRecord = {
    playerId: move.playerId,
    pattern: move.pattern,
    verdict: 'bogey',
    callsBefore: state.calledCount,
  };
  return accept({ ...state, claims: [...state.claims, claim] });
}

/** Games saved before 28 September 2026 judged claims from typed numbers; they replay exactly as they were played. */
function judgeLegacyClaim(state: TambolaState, move: Extract<TambolaMove, { type: 'claim' }>): Verdict<TambolaState> {
  const { playerId, pattern, numbers } = move;
  if (!state.players.some((p) => p.id === playerId)) return refuse('That player is not in this game.');
  if (!isPattern(pattern) || !tierPatterns(state).includes(pattern)) return refuse('That pattern is not a prize in this game.');
  const name = PATTERN_NAMES[pattern];
  if (state.closed.includes(pattern)) return refuse(`${name} already won.`);
  if (pattern === 'second-full-house' && !state.closed.includes('full-house')) {
    return refuse('Second Full House can be claimed once Full House is closed.');
  }
  if (!Array.isArray(numbers) || !numbers.every((n) => Number.isInteger(n))) return refuse('Type the numbers read out.');
  const need = NEEDS[pattern];
  if (numbers.length !== need) return refuse(`${name} needs ${need} numbers read out; ${numbers.length} were entered.`);
  if (numbers.some((n) => n < 1 || n > 90)) return refuse('Every number is from 1 to 90.');
  if (new Set(numbers).size !== numbers.length) return refuse('A number was entered twice.');

  // TAM-037, TAM-035: only called numbers count; marks never matter.
  const calledNow = called(state);
  const position = new Map(calledNow.map((n, i) => [n, i]));
  const checks: ClaimCheck[] = numbers.map((n) => ({
    number: n,
    called: position.has(n),
  }));
  let claim: ClaimRecord;
  if (checks.some((c) => !c.called)) {
    claim = {
      playerId,
      pattern,
      numbers: [...numbers],
      checks,
      verdict: 'bogey',
      reason: 'not-called',
      callsBefore: state.calledCount,
    };
  } else {
    // TAM-038, TAM-043: the latest of the numbers must be the latest call, or the claim is late.
    const last = Math.max(...numbers.map((n) => position.get(n)!));
    claim =
      last === calledNow.length - 1
        ? {
            playerId,
            pattern,
            numbers: [...numbers],
            checks,
            verdict: 'accepted',
            callsBefore: state.calledCount,
          }
        : {
            playerId,
            pattern,
            numbers: [...numbers],
            checks,
            verdict: 'bogey',
            reason: 'late',
            completedAt: calledNow[last]!,
            callsBefore: state.calledCount,
          };
  }
  return accept({ ...state, claims: [...state.claims, claim] });
}

// ----- Late joiners (TAM-067, TAM-184, TAM-093) -----

/** Money is added to prizes in whole units of this many rupees where possible (TAM-092). */
const LATE_UNIT = 10;

/** Why a late player cannot be added now, or null if one can. */
function lateJoinProblem(state: TambolaState): string | null {
  if (state.result) return 'The game is over.';
  const limit = state.config.settings.lateJoinUntil;
  if (!(limit > 0)) return 'Late joining is turned off for this game.';
  if (state.calledCount >= limit) return `Late joining closed once ${limit} numbers were called.`;
  return null;
}

/**
 * Adds a late joiner's money to the prizes nobody has won yet (a tier with a recorded winner keeps its amount).
 * Split in proportion to the current amounts, in whole ₹10 units; the tier that takes the rest (Full House
 * when it is still open) takes anything smaller than a unit and stays the largest. Null if every prize is won.
 */
function growTiers(tiers: readonly Tier[], won: ReadonlySet<Pattern>, added: number): Tier[] | null {
  const open = tiers.filter((t) => !won.has(t.pattern));
  if (open.length === 0) return null;
  const sink =
    open.find((t) => t.pattern === 'full-house') ??
    open.find((t) => t.pattern === 'second-full-house') ??
    open.reduce((a, b) => (b.amount > a.amount ? b : a));
  const units = Math.floor(added / LATE_UNIT);
  const split = apportion(
    units,
    open.map((t) => t.amount),
  );
  const extra = new Map<Pattern, number>(open.map((t, i) => [t.pattern, split[i]! * LATE_UNIT]));
  extra.set(sink.pattern, extra.get(sink.pattern)! + added - units * LATE_UNIT);
  const after = (t: Tier) => t.amount + (extra.get(t.pattern) ?? 0);
  // Keep the sink the largest open prize: hand units back to it from any tier that grew past it.
  for (;;) {
    const over = open.find((t) => t !== sink && after(t) > after(sink) && extra.get(t.pattern)! >= LATE_UNIT);
    if (!over) break;
    extra.set(over.pattern, extra.get(over.pattern)! - LATE_UNIT);
    extra.set(sink.pattern, extra.get(sink.pattern)! + LATE_UNIT);
  }
  return tiers.map((t) => (extra.has(t.pattern) ? { ...t, amount: after(t) } : t));
}

function addPlayer(state: TambolaState, player: TambolaPlayer): Verdict<TambolaState> {
  const problem = lateJoinProblem(state);
  if (problem) return refuse(problem);
  if (!player || typeof player.id !== 'string' || player.id === '') return refuse('The late player needs an id.');
  if (state.players.some((p) => p.id === player.id)) return refuse('That id is already used in this game.');
  const name = typeof player.name === 'string' ? player.name.trim() : '';
  if (name === '') return refuse('Type the late player\'s name.');
  if (state.players.some((p) => sameName(p.name, name))) return refuse(`Another player is already called ${name}. Add an initial.`);
  if (!Number.isInteger(player.tickets) || player.tickets < 1 || player.tickets > MAX_TICKETS) {
    return refuse(`Each player has 1 to ${MAX_TICKETS} tickets.`);
  }
  const joiner: TambolaPlayer = { id: player.id, name, tickets: player.tickets };
  return join(state, joiner, state.tiers);
}

/** Adds a joiner to a state whose prizes are `tiers`, growing the prizes by their money. */
function join(state: TambolaState, joiner: TambolaPlayer, tiers: readonly Tier[], kept?: readonly PhoneTicket[]): Verdict<TambolaState> {
  const money = state.config.money;
  let next = tiers;
  if (money) {
    const grown = growTiers(tiers, wonPatterns(state), joiner.tickets * money.contribution);
    if (!grown) return refuse('Every prize has been won, so there is nothing left to share.');
    next = grown;
  }
  return accept({
    ...state,
    players: [...state.players, joiner],
    tiers: next,
    lateJoins: [...state.lateJoins, { playerId: joiner.id, calledAt: state.calledCount, before: tiers }],
    tickets: [...state.tickets, ...(kept ?? lateTickets(state, joiner))],
  });
}

/**
 * TAM-212: a late joiner in a phone-ticket game gets the next tickets in order, numbered after every ticket
 * already in the game, made by the same sheet rules from the sheet seed.
 */
function lateTickets(state: TambolaState, joiner: TambolaPlayer): PhoneTicket[] {
  if (state.config.ticketMode !== 'phone' || state.sheetSeed === null) return [];
  const last = state.tickets.reduce((m, t) => Math.max(m, t.number), 0);
  return makeTickets(state.sheetSeed, last + joiner.tickets)
    .slice(last)
    .map((t) => ({ number: t.number, sheet: t.sheet, rows: t.rows, playerId: joiner.id, status: 'in-play' as const, joinedAt: state.calledCount }));
}

/** Why this player cannot be taken out, or null if they can (TAM-184). */
function removeProblem(state: TambolaState, playerId: string): string | null {
  if (state.result) return 'The game is over.';
  const j = state.lateJoins.find((x) => x.playerId === playerId);
  if (!j) return 'Only a late joiner can be taken out.';
  if (state.calledCount !== j.calledAt) return 'A number has been called since they joined, so they stay in the game.';
  if (state.claims.some((c) => c.playerId === playerId)) return 'A win or bogey is recorded for them; undo it first.';
  return null;
}

/** Takes out a late joiner: their money comes out, and the prizes go back to what they were (TAM-184). */
function removePlayer(state: TambolaState, playerId: string): Verdict<TambolaState> {
  const problem = removeProblem(state, playerId);
  if (problem) return refuse(problem);
  const k = state.lateJoins.findIndex((x) => x.playerId === playerId);
  const later = state.lateJoins.slice(k + 1);
  const leaving = new Set([playerId, ...later.map((j) => j.playerId)]);
  let next: TambolaState = {
    ...state,
    players: state.players.filter((p) => !leaving.has(p.id)),
    tiers: state.lateJoins[k]!.before,
    lateJoins: state.lateJoins.slice(0, k),
    tickets: state.tickets.filter((t) => !leaving.has(t.playerId)),
  };
  // Anyone who joined after them joins again, in the same order, keeping the tickets already handed to them.
  for (const j of later) {
    const p = state.players.find((x) => x.id === j.playerId)!;
    const r = join(next, p, next.tiers, state.tickets.filter((t) => t.playerId === p.id));
    if (!r.ok) return r;
    next = { ...r.value, lateJoins: r.value.lateJoins.map((x) => (x.playerId === p.id ? { ...x, calledAt: j.calledAt } : x)) };
  }
  return accept(next);
}

// ----- Phone tickets (Phase 2) -----

/** The ticket with this number, if it is in the game (TAM-032, TAM-176). */
function ticketOf(state: TambolaState, ticket: unknown): PhoneTicket | undefined {
  if (!Number.isInteger(ticket)) return undefined;
  return state.tickets.find((t) => t.number === ticket);
}

/** The numbers a pattern needs on a ticket, or null for Early Five (any 5). */
function patternNumbers(rows: Rows, pattern: Pattern): number[] | null {
  switch (pattern) {
    case 'early-five':
      return null;
    case 'top-line':
      return rowNumbers(rows, 0);
    case 'middle-line':
      return rowNumbers(rows, 1);
    case 'bottom-line':
      return rowNumbers(rows, 2);
    case 'four-corners':
      return cornerNumbers(rows);
    default:
      return numbersOn(rows);
  }
}

/**
 * The host checked a phone ticket (TAM-020 to TAM-029, TAM-034 to TAM-038, TAM-174). Judged only on the numbers
 * called so far, never on marks: complete, and completed by the latest call → accepted; complete earlier → a late
 * bogey, with the number that completed it; otherwise a bogey with what is missing. A pattern already complete
 * when a late joiner's ticket came into the game cannot be claimed (TAM-067). The prize goes to the ticket's owner.
 */
function checkClaim(state: TambolaState, move: { readonly ticket: unknown; readonly pattern: unknown }): Verdict<TambolaState> {
  if (state.calledCount === 0) return refuse('Call the first number before checking a claim.');
  const ticket = ticketOf(state, move.ticket);
  if (!ticket) return refuse(`No ticket ${String(move.ticket)} in this game.`);
  const pattern = move.pattern;
  if (!isPattern(pattern) || !tierPatterns(state).includes(pattern)) return refuse('That pattern is not a prize in this game.');
  const name = PATTERN_NAMES[pattern];
  if (state.closed.includes(pattern)) return refuse(`${name} already won.`);
  if (pattern === 'second-full-house' && !state.closed.includes('full-house')) {
    return refuse('Second Full House can be won once Full House is closed.');
  }
  if (ticket.status === 'out') return refuse(`Ticket ${ticket.number} is out.`);
  if (ticket.status === 'paper') {
    return refuse(`Ticket ${ticket.number} plays on paper now: record the anchor's decision with Record a win.`);
  }
  if (state.claims.some((c) => c.ticket === ticket.number && c.pattern === pattern && c.verdict === 'accepted')) {
    return refuse(`Ticket ${ticket.number} has already won ${name}.`);
  }

  const calledNow = called(state);
  const position = new Map(calledNow.map((n, i) => [n, i]));
  const needs = patternNumbers(ticket.rows, pattern);
  const base = { playerId: ticket.playerId, pattern, ticket: ticket.number, callsBefore: state.calledCount };
  let completedIdx: number | null = null;
  let claim: ClaimRecord;
  if (needs === null) {
    const hits = numbersOn(ticket.rows)
      .filter((n) => position.has(n))
      .map((n) => position.get(n)!)
      .sort((a, b) => a - b);
    if (hits.length >= NEEDS['early-five']) completedIdx = hits[NEEDS['early-five'] - 1]!;
    claim = { ...base, verdict: 'bogey', reason: 'not-called', needed: NEEDS['early-five'] - hits.length };
  } else {
    const missing = needs.filter((n) => !position.has(n));
    if (missing.length === 0) completedIdx = Math.max(...needs.map((n) => position.get(n)!));
    claim = { ...base, verdict: 'bogey', reason: 'not-called', missing };
  }
  if (completedIdx !== null) {
    const onTime = completedIdx === calledNow.length - 1 && completedIdx >= ticket.joinedAt;
    claim = onTime ? { ...base, verdict: 'accepted' } : { ...base, verdict: 'bogey', reason: 'late', completedAt: calledNow[completedIdx]! };
  }
  // TAM-044: with "out", a bogey takes the ticket out of the game.
  const out = claim.verdict === 'bogey' && state.config.settings.bogey === 'out';
  return accept({
    ...state,
    claims: [...state.claims, claim],
    tickets: out ? state.tickets.map((t) => (t.number === ticket.number ? { ...t, status: 'out' as const } : t)) : state.tickets,
  });
}

/** TAM-172, TAM-175: the host gives a ticket to another player; its prizes, before and after, go with it. */
function assign(state: TambolaState, move: { readonly ticket: unknown; readonly playerId: unknown }): Verdict<TambolaState> {
  const ticket = ticketOf(state, move.ticket);
  if (!ticket) return refuse(`No ticket ${String(move.ticket)} in this game.`);
  const player = state.players.find((p) => p.id === move.playerId);
  if (!player) return refuse('That player is not in this game.');
  if (ticket.playerId === player.id) return refuse(`Ticket ${ticket.number} is already ${player.name}'s.`);
  return accept({ ...state, tickets: state.tickets.map((t) => (t.number === ticket.number ? { ...t, playerId: player.id } : t)) });
}

/** TAM-058: the player plays on paper from now on; their wins are recorded on the anchor's word. */
function toPaper(state: TambolaState, playerId: unknown): Verdict<TambolaState> {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return refuse('That player is not in this game.');
  const theirs = state.tickets.filter((t) => t.playerId === player.id && t.status !== 'paper');
  if (theirs.length === 0) return refuse(`${player.name} already plays on paper.`);
  return accept({ ...state, tickets: state.tickets.map((t) => (t.playerId === player.id ? { ...t, status: 'paper' as const } : t)) });
}

function apply(state: TambolaState, move: TambolaMove, ctx: MoveContext): Verdict<TambolaState> {
  if (ctx.by !== HOST) return refuse('Only the host phone makes moves.');
  if (state.result) return refuse('The game is over.');
  switch (move?.type) {
    case 'call': {
      if (awaitingClose(state).length > 0) return refuse('Close the prize that was just won before the next number.');
      if (readyToEnd(state)) return refuse('The last Full House is closed. End the game to show the payouts.');
      if (state.calledCount >= 90) return refuse('All 90 numbers called.');
      const n = state.order[state.calledCount]!;
      const rng = createRng(`${state.rhymeSeed}:${state.rhymeDraws}`);
      return accept({
        ...state,
        calledCount: state.calledCount + 1,
        callTimes: [...state.callTimes, ctx.at],
        rhyme: pickRhyme(rhymePack, n, state.config.settings.rhymes, rng),
        rhymeDraws: state.rhymeDraws + 1,
      });
    }
    case 'another-rhyme': {
      if (state.calledCount === 0) return refuse('Call a number first.');
      const n = state.order[state.calledCount - 1]!;
      const rng = createRng(`${state.rhymeSeed}:${state.rhymeDraws}`);
      const rhyme = pickRhyme(rhymePack, n, state.config.settings.rhymes, rng, state.rhyme?.text);
      return accept({ ...state, rhyme, rhymeDraws: state.rhymeDraws + 1 });
    }
    case 'record-win':
      return recordWin(state, move);
    case 'record-bogey':
      return recordBogey(state, move);
    case 'claim':
      return judgeLegacyClaim(state, move);
    case 'close-tier': {
      if (!isPattern(move.pattern) || !tierPatterns(state).includes(move.pattern))
        return refuse('That pattern is not a prize in this game.');
      // Closing a tier nobody won changes nothing, so undoing a wrong claim reopens its tier (TAM-145, TAM-070).
      if (!wonPatterns(state).has(move.pattern) || state.closed.includes(move.pattern)) return accept(state);
      return accept({ ...state, closed: [...state.closed, move.pattern] });
    }
    case 'rename': {
      const name = typeof move.name === 'string' ? move.name.trim() : '';
      if (!state.players.some((p) => p.id === move.playerId)) return refuse('That player is not in this game.');
      if (name === '') return refuse('A name cannot be blank.');
      if (state.players.some((p) => p.id !== move.playerId && sameName(p.name, name))) {
        return refuse(`Another player is already called ${name}. Add an initial.`);
      }
      return accept({
        ...state,
        players: state.players.map((p) => (p.id === move.playerId ? { ...p, name } : p)),
      });
    }
    case 'add-player':
      return addPlayer(state, move.player);
    case 'remove-player':
      return removePlayer(state, move.playerId);
    case 'check-claim':
      return checkClaim(state, move);
    case 'assign':
      return assign(state, move);
    case 'to-paper':
      return toPaper(state, move.playerId);
    case 'end':
      return accept({ ...state, result: 'ended' });
    case 'discard':
      return accept({ ...state, result: 'discarded' });
    default:
      return refuse('That is not a Tambola move.');
  }
}

// ----- Invariants -----

function invariants(state: TambolaState): string[] {
  const problems: string[] = [];
  const { config } = state;
  if (config.ticketMode !== 'paper' && config.ticketMode !== 'phone') problems.push('Tickets are paper or phone.');
  if (!Array.isArray(config.players) || config.players.length === 0) problems.push('A game needs at least one player.');
  const ids = new Set<string>();
  state.players.forEach((p, i) => {
    if (ids.has(p.id)) problems.push(`Two players share the id ${p.id}.`);
    ids.add(p.id);
    if (typeof p.name !== 'string' || p.name.trim() === '') problems.push(`Player ${i + 1} has no name.`);
    else if (state.players.some((q, j) => j < i && sameName(q.name, p.name))) problems.push(`Two players are called ${p.name}.`);
    if (!Number.isInteger(p.tickets) || p.tickets < 1 || p.tickets > MAX_TICKETS) {
      problems.push(`${p.name} has ${p.tickets} tickets; each player has 1 to ${MAX_TICKETS}.`);
    }
  });

  const patterns = state.tiers.map((t) => t.pattern);
  if (!patterns.every(isPattern)) problems.push('A prize tier has an unknown pattern.');
  if (new Set(patterns).size !== patterns.length) problems.push('A pattern is listed twice.');
  if (!patterns.includes('full-house')) problems.push('Full House must be a prize.');
  for (const t of state.tiers) {
    if (!Number.isSafeInteger(t.amount) || t.amount < 0)
      problems.push(`${t.pattern} has an amount that is not a whole number of zero or more.`);
  }
  if (config.money) {
    const c = config.money.contribution;
    if (!Number.isSafeInteger(c) || c < 1) problems.push('The contribution must be a whole amount of 1 or more.');
    const total = state.tiers.reduce((s, t) => s + t.amount, 0);
    const p = pot(state);
    if (total !== p) problems.push(`The prizes add up to ${total}, not the pot of ${p}.`);
  }

  if (state.order.length !== 90 || new Set(state.order).size !== 90 || state.order.some((n) => n < 1 || n > 90)) {
    problems.push('The draw order must hold each number from 1 to 90 once.');
  }
  if (state.calledCount < 0 || state.calledCount > 90) problems.push('At most 90 numbers are called.');
  if (state.callTimes.length !== state.calledCount) problems.push('Every call has a time.');
  if (config.ticketMode === 'phone') {
    const numbers = state.tickets.map((t) => t.number);
    if (new Set(numbers).size !== numbers.length) problems.push('Two phone tickets share a number.');
    if (state.tickets.length !== state.players.reduce((s, p) => s + p.tickets, 0)) problems.push('Every ticket paid for is in the game.');
    if (state.tickets.some((t) => !ids.has(t.playerId))) problems.push('Every phone ticket belongs to a player in the game.');
  } else if (state.tickets.length > 0) {
    problems.push('A paper-ticket game has no phone tickets.');
  }
  return problems;
}

// ----- View -----

function view(state: TambolaState, viewer: Viewer): TambolaView {
  const calledNow = called(state);
  const host = viewer.kind === 'host';
  const last = calledNow[calledNow.length - 1];
  const tierAmount = new Map(state.tiers.map((t) => [t.pattern, t.amount]));
  const prizeByClaim = new Map<number, number>();
  for (const p of new Set(state.claims.map((c) => c.pattern))) {
    for (const [i, amount] of shares(state, p, tierAmount.get(p) ?? 0)) prizeByClaim.set(i, amount);
  }
  const money = state.config.money !== null;
  const claims: ClaimView[] = state.claims.map((c, i) => {
    const prize = money ? prizeByClaim.get(i) : undefined;
    return {
      playerId: c.playerId,
      pattern: c.pattern,
      verdict: c.verdict,
      ...(prize !== undefined ? { prize } : {}),
      // Phase 2 claims say which ticket, and why a bogey is one (TAM-038). Paper claims stay as they were.
      ...(c.ticket !== undefined
        ? {
            ticket: c.ticket,
            ...(c.reason !== undefined ? { reason: c.reason } : {}),
            ...(c.missing !== undefined ? { missing: [...c.missing] } : {}),
            ...(c.needed !== undefined ? { needed: c.needed } : {}),
            ...(c.completedAt !== undefined ? { completedAt: c.completedAt } : {}),
          }
        : {}),
    };
  });
  const phone = state.config.ticketMode === 'phone';
  if (phone && viewer.kind === 'player') return playerView(state, viewer.playerId);
  const tickets: TicketView[] = host
    ? state.tickets.map((t) => ({ number: t.number, sheet: t.sheet, rows: t.rows, playerId: t.playerId, status: t.status }))
    : [];
  return {
    players: state.players.map((p) => ({ id: p.id, name: p.name })),
    tiers: state.tiers.map((t) => ({
      pattern: t.pattern,
      amount: t.amount,
      ...(t.label !== undefined ? { label: t.label } : {}),
    })),
    called: calledNow,
    current: last === undefined ? null : { number: last, rhyme: state.rhyme },
    lastCalls: calledNow.slice(-(host ? 5 : 3)).reverse(),
    allCalled: state.calledCount >= 90,
    openPatterns: tierPatterns(state).filter((p) => !state.closed.includes(p)),
    awaitingClose: awaitingClose(state),
    readyToEnd: readyToEnd(state),
    claims: host ? claims : claims.slice(-1),
    over: state.result !== null,
    summary: summary(state),
    canAddPlayer: lateJoinProblem(state) === null,
    lateJoiners: state.lateJoins.map((j) => {
      const p = state.players.find((x) => x.id === j.playerId)!;
      return { id: p.id, name: p.name, tickets: p.tickets, removable: removeProblem(state, p.id) === null };
    }),
    code: state.code,
    tickets,
  };
}

/**
 * TAM-050, TAM-051: a player's phone sees their own tickets, the players and the prizes, and nothing that was
 * called or will be: no calls, no board, no claims, no other ticket.
 */
function playerView(state: TambolaState, playerId: string): TambolaView {
  return {
    players: state.players.map((p) => ({ id: p.id, name: p.name })),
    tiers: state.tiers.map((t) => ({ pattern: t.pattern, amount: t.amount, ...(t.label !== undefined ? { label: t.label } : {}) })),
    called: [],
    current: null,
    lastCalls: [],
    allCalled: false,
    openPatterns: tierPatterns(state),
    awaitingClose: [],
    readyToEnd: false,
    claims: [],
    over: state.result !== null,
    summary: null,
    canAddPlayer: false,
    lateJoiners: [],
    code: state.code,
    tickets: state.tickets.filter((t) => t.playerId === playerId).map((t) => ({ number: t.number, rows: t.rows })),
  };
}

// ----- The contract -----

export const tambolaRules: GameRules<TambolaConfig, TambolaState, TambolaMove, TambolaView> = {
  id: 'tambola',

  setup({ gameId, seeds, config }) {
    const draw = seeds.draw;
    if (typeof draw !== 'string' || draw === '') throw new Error('Tambola needs a draw seed.');
    const phone = config.ticketMode === 'phone';
    const sheet = seeds.sheet;
    if (phone && (typeof sheet !== 'string' || sheet === '')) throw new Error('Phone tickets need a sheet seed.');
    // TAM-172, TAM-194: tickets are handed out strictly in order, each player's tickets together.
    const owners = phone ? config.players.flatMap((p) => Array.from({ length: Math.max(0, p.tickets) }, () => p.id)) : [];
    const tickets: PhoneTicket[] = phone
      ? makeTickets(sheet!, owners.length).map((t, i) => ({ number: t.number, sheet: t.sheet, rows: t.rows, playerId: owners[i]!, status: 'in-play', joinedAt: 0 }))
      : [];
    return {
      config,
      players: config.players.map((p) => ({
        id: p.id,
        name: p.name.trim(),
        tickets: p.tickets,
      })),
      tiers: config.tiers,
      lateJoins: [],
      order: shuffle(ALL_NUMBERS, createRng(deriveSeed(draw, 'tambola-draw'))),
      calledCount: 0,
      callTimes: [],
      rhyme: null,
      rhymeSeed: deriveSeed(draw, 'tambola-rhymes'),
      rhymeDraws: 0,
      claims: [],
      closed: [],
      result: null,
      tickets,
      sheetSeed: phone ? sheet! : null,
      code: phone ? gameCode(gameId) : null,
    };
  },

  legalMoves(state, actor) {
    if (actor !== HOST || state.result) return [];
    const waiting = awaitingClose(state);
    const endings: TambolaMove[] = [{ type: 'end' }, { type: 'discard' }];
    if (waiting.length > 0) return [...waiting.map((pattern) => ({ type: 'close-tier' as const, pattern })), ...endings];
    if (readyToEnd(state)) return endings;
    return state.calledCount < 90 ? [{ type: 'call' }, ...endings] : endings;
  },
  detailMoves: ['record-win', 'record-bogey', 'rename', 'add-player', 'remove-player', 'check-claim', 'assign', 'to-paper'],

  apply,
  view,
  isOver: (state) => state.result !== null,
  invariants,

  canUndo(state, { record, by, now }) {
    if (by !== HOST || state.result) return false;
    switch (record.move.type) {
      case 'record-win':
      case 'record-bogey':
      case 'claim':
      case 'check-claim':
        return true; // TAM-070: any time; later calls stay (TAM-072)
      case 'call': {
        // TAM-119, TAM-071: only the latest call, and only within 5 seconds of it.
        const lastAt = state.callTimes[state.callTimes.length - 1];
        return lastAt !== undefined && record.at === lastAt && now >= record.at && now - record.at <= CALL_UNDO_MS;
      }
      default:
        return false;
    }
  },
};
