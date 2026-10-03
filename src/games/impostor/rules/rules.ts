// Impostor on the engine's game contract (src/engine/CLAUDE.md): setup, legal moves, apply, view, game over,
// invariants, undo. The contract is specs/impostor/ (scenarios v2.2), Test hooks item 1.
// Every word and impostor comes from the word seed; every starter from the starter seed (IMP-060). Each deal and each
// starter pick derives its own generator from its seed and its count, so the state stays plain data and replays exactly.
import { createRng, deriveSeed, HOST, type GameRules, type MoveContext, type Verdict, type Viewer } from '../../../engine';
import { pickImpostor, pickStarter, pickWord, scoreRound, wordById, WORDS } from './picks';
import {
  CATEGORIES, type Choices, type ImpostorConfig, type ImpostorMove, type ImpostorState, type ImpostorView, type Round,
  type RoundStep,
} from './types';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
/** IMP-022: "Another round of clues" for 3 to 5 players. */
const MAX_FOR_SECOND_CLUES = 5;

type Result = Verdict<ImpostorState>;
const ok = (value: ImpostorState): Result => ({ ok: true, value });
const no = (reason: string): Result => ({ ok: false, reason });

const isString = (x: unknown): x is string => typeof x === 'string';
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** A problem with a list of players, or null when it is fine (3 to 20 names, none repeated ignoring case). */
function playersProblem(players: unknown): string | null {
  if (!Array.isArray(players) || !players.every(isString)) return 'Players must be a list of names.';
  if (players.some((p) => p.trim() === '')) return 'A player has no name.';
  if (players.length < MIN_PLAYERS) return 'Add at least 3 players.';
  if (players.length > MAX_PLAYERS) return '20 players is the most.';
  const lower = players.map((p) => p.toLowerCase());
  if (new Set(lower).size !== lower.length) return 'A name is there twice.';
  return null;
}

function choicesProblem(c: unknown): string | null {
  if (typeof c !== 'object' || c === null) return 'Choices are missing.';
  const x = c as Partial<Record<keyof Choices, unknown>>;
  if (x.mode !== 'easy' && x.mode !== 'hard') return 'Unknown mode.';
  if (x.talking !== 'free' && x.talking !== 'timer') return 'Unknown talking choice.';
  if (typeof x.score !== 'boolean') return 'Score must be yes or no.';
  if (x.words !== 'family' && x.words !== 'grownups') return 'Unknown words choice.';
  if (typeof x.nonveg !== 'boolean') return 'Non-veg must be on or off.';
  if (!Array.isArray(x.categories) || x.categories.length === 0) return 'Keep at least one category.';
  if (!x.categories.every((k) => (CATEGORIES as readonly unknown[]).includes(k))) return 'Unknown category.';
  return null;
}

const copyChoices = (c: Choices): Choices => ({ ...c, categories: [...c.categories] });

function setup(config: ImpostorConfig, seeds: Readonly<Record<string, string>>): ImpostorState {
  const frozen = {
    dealtTonight: [...(config.excludedWords?.dealtTonight ?? [])],
    recent: [...(config.excludedWords?.recent ?? [])],
    blocked: [...(config.excludedWords?.blocked ?? [])],
  };
  return {
    seeds: { word: seeds.word ?? '', starter: seeds.starter ?? '' },
    testDeals: (config.testDeals ?? []).map((d) => ({ ...d })),
    frozen,
    players: [...config.players],
    choices: copyChoices(config.choices),
    phase: 'ready',
    pendingPractice: false,
    round: null,
    over: false,
    counted: 0,
    dealCount: 0,
    starterPicks: 0,
    dealt: [],
    blocked: [...frozen.blocked],
    allowRepeats: false,
    startedThisCycle: [],
    recentImpostors: [],
    moves: 0,
    undoVerdictSeq: null,
    undoVerdictAt: null,
    totals: Object.fromEntries(config.players.map((p) => [p, 0])),
  };
}

function wordFilter(s: ImpostorState, allowRepeats = s.allowRepeats) {
  return {
    words: s.choices.words,
    categories: s.choices.categories,
    nonveg: s.choices.nonveg,
    usedTonight: new Set([...s.frozen.dealtTonight, ...s.dealt]),
    recent: new Set(s.frozen.recent),
    blocked: new Set(s.blocked),
    allowRepeats,
  };
}

/** Whether any word could be dealt with "Allow repeats" (IMP-052: otherwise "Allow repeats" is not offered). */
const anyWordWithRepeats = (s: ImpostorState) =>
  pickWord(WORDS, wordFilter(s, true), { int: () => 0 }) !== null;

/**
 * Deals a round (a new one, or a redeal under the same number): the next forced deal if any, else the word and the
 * impostor from this deal's own generator. With no word left, the evening waits on the no-words screen (IMP-052).
 */
function deal(s: ImpostorState, practice: boolean): ImpostorState {
  const forced = s.testDeals[s.dealCount];
  const rng = createRng(deriveSeed(s.seeds.word, `deal-${s.dealCount}`));
  const forcedWord = forced?.wordId !== undefined ? wordById(forced.wordId) : undefined;
  const word = forcedWord ?? pickWord(WORDS, wordFilter(s), rng);
  if (!word) return { ...s, phase: 'noWords', pendingPractice: practice, round: null };
  const impostor = forced?.impostor ?? pickImpostor(s.players, s.recentImpostors, rng);
  const round: Round = {
    number: practice ? null : s.counted + 1,
    practice,
    players: [...s.players],
    wordId: word.id,
    impostor,
    step: 'deal',
    seen: 0,
    starter: null,
    secondClues: false,
    tied: null,
    revealed: null,
    stillTie: false,
    verdict: null,
    wordBlocked: false,
    blockAdded: false,
    points: null,
  };
  return {
    ...s,
    phase: 'round',
    pendingPractice: false,
    round,
    dealCount: s.dealCount + 1,
    dealt: [...s.dealt, word.id],
  };
}

/** The deal ends: the starter is picked (IMP-021) and the clues screen shows, which counts the round for the cycle. */
function pickTheStarter(s: ImpostorState, r: Round): ImpostorState {
  const forced = s.testDeals[s.dealCount - 1]?.starter;
  const skip = s.choices.mode === 'hard' ? r.impostor : null;
  const started = s.startedThisCycle.filter((p) => r.players.includes(p));
  let starter: string;
  let newCycle: boolean;
  if (forced !== undefined) {
    starter = forced;
    newCycle = !r.players.some((p) => p !== skip && !started.includes(p));
  } else {
    const rng = createRng(deriveSeed(s.seeds.starter, `starter-${s.starterPicks}`));
    ({ starter, newCycle } = pickStarter(r.players, started, skip, rng));
  }
  const cycle = newCycle ? [starter] : started.includes(starter) ? started : [...started, starter];
  return {
    ...s,
    starterPicks: s.starterPicks + 1,
    startedThisCycle: cycle,
    round: { ...r, starter, step: 'clues' },
  };
}

/** A round reaches its result: escaped (caught false) or caught with its verdict. */
function complete(s: ImpostorState, r: Round, caught: boolean, right: boolean | null, extra: Partial<Round>): ImpostorState {
  const scored = s.choices.score && !r.practice;
  const points = scored ? scoreRound({ impostor: r.impostor, caught, guessedRight: right }, r.players) : null;
  const totals = { ...s.totals };
  if (points) for (const [p, v] of Object.entries(points)) totals[p] = (totals[p] ?? 0) + v;
  return {
    ...s,
    counted: r.practice ? s.counted : s.counted + 1,
    recentImpostors: [...s.recentImpostors, r.impostor],
    totals,
    round: { ...r, ...extra, step: 'result', points },
  };
}

/** Totals follow the new list: a returning name (ignoring case) keeps its total under the new spelling (IMP-044). */
function totalsFor(totals: Readonly<Record<string, number>>, players: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [name, v] of Object.entries(totals)) {
    const now = players.find((p) => same(p, name));
    out[now ?? name] = v;
  }
  for (const p of players) if (!(p in out)) out[p] = 0;
  return out;
}

const REDEAL_STEPS: readonly RoundStep[] = ['deal', 'clues', 'talk', 'vote', 'revote', 'caught', 'guess'];
const AFTER_REVEAL: readonly RoundStep[] = ['caught', 'guess', 'result'];

/** Every accepted move adds one to the move counter, so replay rebuilds it exactly. */
function apply(s: ImpostorState, move: ImpostorMove, ctx: MoveContext): Result {
  const r = applyMove(s, move, ctx);
  return r.ok ? ok({ ...r.value, moves: s.moves + 1 }) : r;
}

function applyMove(s: ImpostorState, move: ImpostorMove, ctx: MoveContext): Result {
  if (s.over) return no('The evening has ended.');
  if (ctx.by !== HOST) return no('Only the host phone records moves.');
  if (typeof move !== 'object' || move === null) return no('Not a move.');
  const r = s.round;
  const step = s.phase === 'round' && r ? r.step : null;
  const betweenRounds = s.phase === 'noWords' || step === 'result';

  switch (move.type) {
    case 'startDeal':
      if (s.phase !== 'ready') return no('The deal has already started.');
      if (typeof move.practice !== 'boolean') return no('Practice must be yes or no.');
      return ok(deal(s, move.practice));

    case 'seen':
      if (!r || step !== 'deal') return no('Nobody is being dealt to.');
      if (r.seen >= r.players.length) return no('Everyone has seen their word.');
      if (r.seen + 1 < r.players.length) return ok({ ...s, round: { ...r, seen: r.seen + 1 } });
      return ok(pickTheStarter(s, { ...r, seen: r.seen + 1 }));

    case 'dontKnow':
      if (!r || step !== 'deal') return no('"Don\'t know this word?" is only during the deal.');
      return ok(deal({ ...s, blocked: s.blocked.includes(r.wordId) ? s.blocked : [...s.blocked, r.wordId] }, r.practice));

    case 'startTalk':
      if (step !== 'clues') return no('The clues screen is not showing.');
      return ok({ ...s, round: { ...r!, step: 'talk' } });

    case 'anotherRoundOfClues':
      if (step !== 'clues') return no('The clues screen is not showing.');
      if (r!.players.length > MAX_FOR_SECOND_CLUES) return no('A second round of clues is for 3 to 5 players.');
      if (r!.secondClues) return no('Only one more round of clues.');
      return ok({ ...s, round: { ...r!, secondClues: true } });

    case 'voteNow':
      if (step !== 'talk') return no('The talk is not on.');
      return ok({ ...s, round: { ...r!, step: 'vote' } });

    case 'tie': {
      if (step !== 'vote') return no('A tie is recorded only at the first vote.');
      const tied = move.players;
      if (!Array.isArray(tied) || !tied.every(isString)) return no('A tie needs names.');
      if (tied.length < 2 || new Set(tied).size !== tied.length) return no('A tie needs 2 or more different players.');
      if (!tied.every((p) => r!.players.includes(p))) return no('Someone tied is not playing.');
      return ok({ ...s, round: { ...r!, step: 'revote', tied: [...tied] } });
    }

    case 'reveal': {
      if (step !== 'vote' && step !== 'revote') return no('There is no vote to reveal.');
      const p = move.player;
      if (!isString(p) || !r!.players.includes(p)) return no('That player is not playing.');
      if (step === 'revote' && !r!.tied!.includes(p)) return no('That player was not tied.');
      if (p === r!.impostor) return ok({ ...s, round: { ...r!, step: 'caught', revealed: p } });
      return ok(complete(s, r!, false, null, { revealed: p }));
    }

    case 'stillTie':
      if (step !== 'revote') return no('"Still a tie" comes only after a tie.');
      return ok(complete(s, r!, false, null, { stillTie: true }));

    case 'showWord':
      if (step !== 'caught') return no('The word is shown only after the impostor is caught.');
      return ok({ ...s, round: { ...r!, step: 'guess' } });

    case 'verdict':
      if (step !== 'guess') return no('The verdict comes after the word is shown.');
      if (typeof move.right !== 'boolean') return no('The verdict is right or wrong.');
      return ok({ ...complete(s, r!, true, move.right, { verdict: move.right }), undoVerdictSeq: s.moves + 1, undoVerdictAt: ctx.at });

    case 'nextRound':
      if (step !== 'result') return no('The round has no result yet.');
      return ok(deal({ ...s, undoVerdictSeq: null, undoVerdictAt: null }, false));

    case 'dealAgain':
      if (!r || step === null || !REDEAL_STEPS.includes(step)) return no('There is no round to deal again.');
      return ok(deal(s, r.practice));

    case 'allowRepeats':
      if (s.phase !== 'noWords') return no('Words are left.');
      if (s.allowRepeats || !anyWordWithRepeats(s)) return no('Even repeats leave no word.');
      return ok(deal({ ...s, allowRepeats: true }, s.pendingPractice));

    case 'wordDidntWork': {
      if (!r || step === null || !AFTER_REVEAL.includes(step)) return no('"This word didn\'t work" comes after the reveal.');
      if (typeof move.blocked !== 'boolean') return no('Blocked must be yes or no.');
      if (move.blocked === r.wordBlocked) return no(move.blocked ? 'Already skipped.' : 'Not skipped.');
      if (move.blocked) {
        const add = !s.blocked.includes(r.wordId);
        return ok({ ...s, blocked: add ? [...s.blocked, r.wordId] : s.blocked, round: { ...r, wordBlocked: true, blockAdded: add } });
      }
      // Undo of the toast: take back only what this round's tap added (never a word frozen as blocked).
      const blocked = r.blockAdded ? s.blocked.filter((id) => id !== r.wordId) : s.blocked;
      return ok({ ...s, blocked, round: { ...r, wordBlocked: false, blockAdded: false } });
    }

    case 'setPlayers': {
      if (!betweenRounds) return no('Change players after this round.');
      const problem = playersProblem(move.players);
      if (problem) return no(problem);
      const players = [...move.players];
      return ok({
        ...s,
        players,
        totals: totalsFor(s.totals, players),
        startedThisCycle: s.startedThisCycle.filter((p) => players.includes(p)),
        undoVerdictSeq: null, undoVerdictAt: null,
      });
    }

    case 'setChoices': {
      if (!betweenRounds) return no('Choices change only between rounds.');
      const problem = choicesProblem(move.choices);
      if (problem) return no(problem);
      const next = { ...s, choices: copyChoices(move.choices), undoVerdictSeq: null, undoVerdictAt: null };
      // IMP-052 "Change categories": the same round is dealt again under the new choices.
      return ok(s.phase === 'noWords' ? deal(next, s.pendingPractice) : next);
    }

    case 'endEvening':
      return ok({ ...s, over: true, undoVerdictSeq: null, undoVerdictAt: null });

    default:
      return no('Unknown move.');
  }
}

function view(s: ImpostorState, viewer: Viewer): ImpostorView {
  const r = s.phase === 'round' ? s.round : null;
  if (viewer.kind === 'player') {
    if (!r || !r.players.includes(viewer.playerId)) return null;
    return viewer.playerId === r.impostor ? { role: 'impostor' } : { role: 'crew', wordId: r.wordId };
  }
  const practice = r ? r.practice : s.phase === 'noWords' ? s.pendingPractice : false;
  const table = {
    round: r ? r.number : practice ? null : s.counted + 1,
    practice,
    players: [...s.players],
    starter: r ? r.starter : null,
  };
  if (r && (r.revealed !== null || r.stillTie)) return { ...table, impostor: r.impostor, wordId: r.wordId };
  return table;
}

function invariants(s: ImpostorState): string[] {
  const problems: string[] = [];
  if (!s.seeds.word || !s.seeds.starter) problems.push('The word seed or starter seed is missing.');
  const pp = playersProblem(s.players);
  if (pp) problems.push(`Players: ${pp}`);
  const r = s.round;
  if (s.phase === 'round') {
    if (!r) problems.push('A round is on but none is dealt.');
    else {
      if (!r.players.includes(r.impostor)) problems.push('The impostor is not playing.');
      if (!wordById(r.wordId)) problems.push(`The word ${r.wordId} is not in the list.`);
      if (r.seen > r.players.length) problems.push('More players have seen their word than are playing.');
      if (r.starter !== null && !r.players.includes(r.starter)) problems.push('The starter is not playing.');
      if (r.revealed !== null && !r.players.includes(r.revealed)) problems.push('The revealed player is not playing.');
    }
  }
  if (s.counted > s.dealCount) problems.push('More rounds counted than dealt.');
  for (const [p, v] of Object.entries(s.totals)) {
    if (!Number.isInteger(v) || v < 0) problems.push(`${p}'s total is not a whole number of points.`);
  }
  return problems;
}

/** Moves listed for a generic player. `tie`, `setPlayers` and `setChoices` carry details from the room. */
function candidates(s: ImpostorState): ImpostorMove[] {
  const players = s.round?.players ?? s.players;
  return [
    { type: 'startDeal', practice: false },
    { type: 'startDeal', practice: true },
    { type: 'seen' },
    { type: 'dontKnow' },
    { type: 'startTalk' },
    { type: 'anotherRoundOfClues' },
    { type: 'voteNow' },
    ...players.map((player) => ({ type: 'reveal' as const, player })),
    { type: 'stillTie' },
    { type: 'showWord' },
    { type: 'verdict', right: true },
    { type: 'verdict', right: false },
    { type: 'nextRound' },
    { type: 'dealAgain' },
    { type: 'allowRepeats' },
    { type: 'wordDidntWork', blocked: true },
    { type: 'wordDidntWork', blocked: false },
    { type: 'endEvening' },
  ];
}

export const impostorRules: GameRules<ImpostorConfig, ImpostorState, ImpostorMove, ImpostorView> = {
  id: 'impostor',
  setup: (input) => setup(input.config, input.seeds),
  legalMoves(state, actor) {
    if (state.over || actor !== HOST) return [];
    return candidates(state).filter((m) => apply(state, m, { by: actor, at: 0 }).ok);
  },
  detailMoves: ['tie', 'setPlayers', 'setChoices'],
  apply,
  view,
  isOver: (state) => state.over,
  invariants,
  // IMP-037: only the round's latest verdict, until "Next round", a change of players or choices, or the end.
  canUndo(state, { record, by }) {
    return (
      !state.over &&
      by === HOST &&
      record.move.type === 'verdict' &&
      state.undoVerdictSeq !== null &&
      // The verdict's position is a lower bound for its seq (seq never goes below the position; it can be higher
      // after an earlier undo left a gap), and the time stamp must match too, so an older verdict never qualifies.
      record.seq >= state.undoVerdictSeq &&
      record.at === state.undoVerdictAt &&
      state.round?.verdict === record.move.right
    );
  },
};
