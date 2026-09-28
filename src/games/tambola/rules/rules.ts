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
  type SummaryTier,
  type TambolaConfig,
  type TambolaMove,
  type TambolaSettings,
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

const refuse = (reason: string): Verdict<TambolaState> => ({ ok: false, reason });
const accept = (value: TambolaState): Verdict<TambolaState> => ({ ok: true, value });
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// ----- Derived facts -----

function called(state: TambolaState): number[] {
  return state.order.slice(0, state.calledCount);
}

function tierPatterns(state: TambolaState): Pattern[] {
  return state.config.tiers.map((t) => t.pattern);
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
  const split = apportion(amount, winners.map(() => 1));
  return new Map(winners.map(({ i }, k) => [i, split[k]!]));
}

function pot(config: TambolaConfig): number | null {
  if (!config.money) return null;
  return config.players.reduce((s, p) => s + p.tickets, 0) * config.money.contribution;
}

function moneyRecord(state: TambolaState, won: Map<string, number>): MoneyRecord | null {
  const money = state.config.money;
  if (!money) return null;
  return {
    currency: money.currency,
    people: state.players.map((p) => ({
      personId: p.id,
      name: p.name,
      paid: p.tickets * money.contribution,
      won: won.get(p.id) ?? 0,
    })),
  };
}

function summary(state: TambolaState): TambolaSummary | null {
  if (!state.result) return null;
  const tiers = state.config.tiers;
  const withLabel = (t: (typeof tiers)[number]) => (t.label !== undefined ? { label: t.label } : {});
  const bogeys = state.claims.filter((c) => c.verdict === 'bogey').map((c) => ({ playerId: c.playerId, pattern: c.pattern }));
  const base = { callsMade: state.calledCount, pot: pot(state.config), bogeys };
  const won = wonPatterns(state);
  const refund = (): TambolaSummary => {
    const out = new Map<string, number>();
    if (state.config.money) for (const p of state.players) out.set(p.id, p.tickets * state.config.money.contribution);
    return {
      ...base,
      result: state.result!,
      tiers: tiers.map((t) => ({ pattern: t.pattern, amount: 0, ...withLabel(t), winners: [] })),
      money: moneyRecord(state, out),
    };
  };
  // Discarded (TAM-140), or ended with no prize won (TAM-144): everyone gets their contribution back.
  if (state.result === 'discarded' || won.size === 0) return refund();

  // TAM-088: unclaimed tiers are spread across the won tiers, in proportion to their amounts.
  const wonTiers = tiers.filter((t) => won.has(t.pattern));
  const unclaimed = tiers.filter((t) => !won.has(t.pattern)).reduce((s, t) => s + t.amount, 0);
  const extra = apportion(unclaimed, wonTiers.map((t) => t.amount));
  const finalAmount = new Map(wonTiers.map((t, i) => [t.pattern, t.amount + extra[i]!]));

  const paidOut = new Map<string, number>();
  const summaryTiers: SummaryTier[] = tiers.map((t) => {
    const amount = finalAmount.get(t.pattern) ?? 0;
    const split = shares(state, t.pattern, amount);
    const winners = [...split.entries()]
      .sort(([a], [b]) => a - b)
      .map(([i, share]) => ({ playerId: state.claims[i]!.playerId, amount: share }));
    for (const w of winners) paidOut.set(w.playerId, (paidOut.get(w.playerId) ?? 0) + w.amount);
    return { pattern: t.pattern, amount, ...withLabel(t), winners };
  });
  return { ...base, result: 'ended', tiers: summaryTiers, money: moneyRecord(state, paidOut) };
}

// ----- Moves -----

function judgeClaim(state: TambolaState, move: Extract<TambolaMove, { type: 'claim' }>): Verdict<TambolaState> {
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
  const checks: ClaimCheck[] = numbers.map((n) => ({ number: n, called: position.has(n) }));
  let claim: ClaimRecord;
  if (checks.some((c) => !c.called)) {
    claim = { playerId, pattern, numbers: [...numbers], checks, verdict: 'bogey', reason: 'not-called', callsBefore: state.calledCount };
  } else {
    // TAM-038, TAM-043: the latest of the numbers must be the latest call, or the claim is late.
    const last = Math.max(...numbers.map((n) => position.get(n)!));
    claim =
      last === calledNow.length - 1
        ? { playerId, pattern, numbers: [...numbers], checks, verdict: 'accepted', callsBefore: state.calledCount }
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
    case 'claim':
      return judgeClaim(state, move);
    case 'close-tier': {
      if (!isPattern(move.pattern) || !tierPatterns(state).includes(move.pattern)) return refuse('That pattern is not a prize in this game.');
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
      return accept({ ...state, players: state.players.map((p) => (p.id === move.playerId ? { ...p, name } : p)) });
    }
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

  const patterns = config.tiers.map((t) => t.pattern);
  if (!patterns.every(isPattern)) problems.push('A prize tier has an unknown pattern.');
  if (new Set(patterns).size !== patterns.length) problems.push('A pattern is listed twice.');
  if (!patterns.includes('full-house')) problems.push('Full House must be a prize.');
  for (const t of config.tiers) {
    if (!Number.isSafeInteger(t.amount) || t.amount < 0) problems.push(`${t.pattern} has an amount that is not a whole number of zero or more.`);
  }
  if (config.money) {
    const c = config.money.contribution;
    if (!Number.isSafeInteger(c) || c < 1) problems.push('The contribution must be a whole amount of 1 or more.');
    const total = config.tiers.reduce((s, t) => s + t.amount, 0);
    const p = pot(config);
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
  const tierAmount = new Map(state.config.tiers.map((t) => [t.pattern, t.amount]));
  const prizeByClaim = new Map<number, number>();
  for (const p of new Set(state.claims.map((c) => c.pattern))) {
    for (const [i, amount] of shares(state, p, tierAmount.get(p) ?? 0)) prizeByClaim.set(i, amount);
  }
  const claims: ClaimView[] = state.claims.map((c, i) => {
    const prize = prizeByClaim.get(i);
    return {
      playerId: c.playerId,
      pattern: c.pattern,
      numbers: [...c.numbers],
      checks: c.checks.map((x) => ({ ...x })),
      verdict: c.verdict,
      ...(c.reason !== undefined ? { reason: c.reason } : {}),
      ...(c.completedAt !== undefined ? { completedAt: c.completedAt } : {}),
      ...(prize !== undefined ? { prize } : {}),
    };
  });
  return {
    players: state.players.map((p) => ({ id: p.id, name: p.name })),
    tiers: state.config.tiers.map((t) => ({ pattern: t.pattern, amount: t.amount, ...(t.label !== undefined ? { label: t.label } : {}) })),
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
      players: config.players.map((p) => ({ id: p.id, name: p.name.trim(), tickets: p.tickets })),
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
  detailMoves: ['claim', 'rename'],

  apply,
  view,
  isOver: (state) => state.result !== null,
  invariants,

  canUndo(state, { record, by, now }) {
    if (by !== HOST || state.result) return false;
    switch (record.move.type) {
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
