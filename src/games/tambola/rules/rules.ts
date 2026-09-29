// Tambola's rules: the seven contract answers for paper tickets on one host phone (Phase 1a).
// Pure: no screen, storage, clock or Math.random(). Randomness comes from the draw seed.
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
import { apportion } from './prizes';
import { pickRhyme, rhymePack } from './rhymes';
import {
  isPattern,
  NEEDS,
  PATTERN_NAMES,
  type ClaimCheck,
  type ClaimRecord,
  type ClaimView,
  type Pattern,
  type Payout,
  type SummaryTier,
  type TambolaConfig,
  type TambolaMove,
  type TambolaPlayer,
  type TambolaSettings,
  type Tier,
  type TambolaState,
  type TambolaSummary,
  type TambolaView,
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
    .sort((a, b) => order.get(a.c.playerId)! - order.get(b.c.playerId)! || a.i - b.i);
  const split = apportion(
    amount,
    winners.map(() => 1),
  );
  return new Map(winners.map(({ i }, k) => [i, split[k]!]));
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
    const winners = [...split.entries()].sort(([a], [b]) => a - b).map(([i, amount]) => ({ playerId: state.claims[i]!.playerId, amount }));
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
    if (state.claims.some((c) => c.playerId === id && c.pattern === move.pattern && c.verdict === 'accepted')) {
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
function join(state: TambolaState, joiner: TambolaPlayer, tiers: readonly Tier[]): Verdict<TambolaState> {
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
  });
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
  let next: TambolaState = {
    ...state,
    players: state.players.filter((p) => p.id !== playerId && !later.some((j) => j.playerId === p.id)),
    tiers: state.lateJoins[k]!.before,
    lateJoins: state.lateJoins.slice(0, k),
  };
  // Anyone who joined after them joins again, in the same order.
  for (const j of later) {
    const p = state.players.find((x) => x.id === j.playerId)!;
    const r = join(next, p, next.tiers);
    if (!r.ok) return r;
    next = { ...r.value, lateJoins: r.value.lateJoins.map((x) => (x.playerId === p.id ? { ...x, calledAt: j.calledAt } : x)) };
  }
  return accept(next);
}

function apply(state: TambolaState, move: TambolaMove, ctx: MoveContext): Verdict<TambolaState> {
  if (ctx.by !== HOST) return refuse('Only the host phone makes moves in a paper-ticket game.');
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
  if (config.ticketMode !== 'paper') problems.push('Phase 1a plays with paper tickets only.');
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
    };
  });
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
  };
}

// ----- The contract -----

export const tambolaRules: GameRules<TambolaConfig, TambolaState, TambolaMove, TambolaView> = {
  id: 'tambola',

  setup({ seeds, config }) {
    const draw = seeds.draw;
    if (typeof draw !== 'string' || draw === '') throw new Error('Tambola needs a draw seed.');
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
  detailMoves: ['record-win', 'record-bogey', 'rename', 'add-player', 'remove-player'],

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
