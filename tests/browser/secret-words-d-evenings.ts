// Secret Words, lane D: the saved game nights the lane D browser tests open (scenarios v3.7, 23 October 2026).
// The rules module cannot be loaded inside Playwright (its word list is a JSON import), so evenings are written here
// move by move from the scenarios (boards from the scenarios' own algorithm, oracle.ts; moves as Test hooks item 1).
// Every flow below is replayed through the real rules in tests/games/secret-words/lane-d-evenings.test.ts (`mirror`), so
// a browser test never opens an evening the rules would refuse. No Playwright import here: vitest loads this file too.
import { oracleBoard, oracleCode, type Kind, type OracleBoard } from '../games/secret-words/oracle';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Team = 'orange' | 'teal';
export interface TeamsInput {
  orange: string[]; teal: string[]; clueGivers: { orange: string | null; teal: string | null };
  partners: { orange: string | null; teal: string | null }; names: { id: string; orange: string; teal: string }; guessOnly: string[];
}
export interface Choices { map: 'pass' | 'shared' | 'own'; board: 'full' | 'easy'; landmine: 'lose' | 'turn'; words: 'family' | 'grownups' }
export const DEFAULT_CHOICES: Choices = { map: 'pass', board: 'full', landmine: 'lose', words: 'family' };
export const PAIR = { id: 'SWDT-01', orange: 'Chai Champions', teal: 'Coffee Commandos' };
/** 22 October 2026, 20:40 in India (as the rule tests). */
export const T0 = 1_792_683_000_000;

/** The example teams (Terms): orange Riya, Meena, Zoya, Om (clue giver Riya); teal Arjun, Kabir, Dev (clue giver Arjun). */
export function exampleTeams(o: Partial<TeamsInput> = {}): TeamsInput {
  return {
    orange: ['Riya', 'Meena', 'Zoya', 'Om'], teal: ['Arjun', 'Kabir', 'Dev'],
    clueGivers: { orange: 'Riya', teal: 'Arjun' }, partners: { orange: null, teal: null }, names: PAIR, guessOnly: [], ...o,
  };
}

export interface EveningOptions { seed?: string; teamsSeed?: string; teams?: TeamsInput; choices?: Partial<Choices>; codes?: string[] }

/** The rules' evening, played alongside to check every move (tests/games/secret-words/helpers.ts `Evening`). */
export interface Mirror { must(move: any): unknown; deal(type?: 'deal' | 'dealNew'): string; faceDown(kind?: Kind): number[]; view(): any }
let mirrorOf: ((o: any) => Mirror) | null = null;
/** Rule tests only: play every move of every evening built here through the real rules too. */
export function mirrorWith(f: ((o: any) => Mirror) | null) { mirrorOf = f; }

/** The first Full (or Easy) Whole-family code, from deck `from` on, whose board starts with `team` (deal index 0). */
export function codeStarting(team: Team, from = 1, board: 'full' | 'easy' = 'full'): string {
  for (let d = from; d < from + 500; d++) {
    const c = oracleCode({ edition: 1, board, words: 'family' }, d, 0);
    if (oracleBoard(c).starts === team) return c;
  }
  throw new Error('no code found');
}
export const CODES = [codeStarting('orange', 11), codeStarting('teal', 211), codeStarting('orange', 411), codeStarting('teal', 611)];
export const EASY_CODES = [codeStarting('orange', 11, 'easy'), codeStarting('teal', 211, 'easy')];

const other = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');

/** One Secret Words evening, one second per move, as the app saves it (engine SavedGame format 2). */
export class SwEvening {
  readonly setup: any;
  readonly records: { v: 1; seq: number; at: number; by: 'host'; move: any }[] = [];
  at = T0;
  private codes: string[];
  private deals = 0;
  board!: OracleBoard;
  turned = new Set<number>();
  turn: Team = 'orange';
  step: 'none' | 'clue' | 'guessing' | 'over' | 'gameover' = 'none';
  guessesLeft = 0;
  winner: Team | null = null;
  endedEarly = false;
  readonly mirror: Mirror | null;

  constructor(readonly o: EveningOptions = {}) {
    const teams = o.teams ?? exampleTeams();
    const choices = { ...DEFAULT_CHOICES, ...o.choices };
    if (choices.landmine !== 'lose') throw new Error('lane D evenings use Lose the game only');
    this.codes = o.codes ?? (choices.board === 'easy' ? EASY_CODES : CODES);
    this.setup = {
      gameId: 'secret-words',
      seeds: { deal: o.seed ?? 'lane-d-deal', teams: o.teamsSeed ?? 'lane-d-teams' },
      config: { players: [...teams.orange, ...teams.teal], teams, splits: 1, choices, excludedWords: { recent: [] }, testBoards: this.codes },
    };
    this.mirror = mirrorOf ? mirrorOf({ seed: this.setup.seeds.deal, teamsSeed: this.setup.seeds.teams, teams, choices, testBoards: this.codes }) : null;
  }

  private push(move: any) {
    this.at += 1000;
    this.records.push({ v: 1, seq: this.records.length + 1, at: this.at, by: 'host', move });
  }
  /** Any move: recorded as is (and played through the rules when mirrored). */
  must(move: any): this {
    if (move.type === 'deal' || move.type === 'dealNew') throw new Error('use deal()');
    if (move.type === 'clue') return this.clue(move.n, move.word);
    if (move.type === 'reveal') return this.mustReveal(move.cell);
    if (move.type === 'endTurn') { this.step = 'over'; }
    if (move.type === 'nextTurn') { this.turn = other(this.turn); this.step = 'clue'; }
    if (move.type === 'endGame') { this.endedEarly = true; this.step = 'gameover'; }
    this.mirror?.must(move);
    this.push(move);
    return this;
  }
  /** The next board of `codes` (deal, Play again, or dealNew = New board). */
  deal(type: 'deal' | 'dealNew' = 'deal'): string {
    const code = this.codes[this.deals++]!;
    if (this.mirror) {
      const m = this.mirror.deal(type);
      if (m !== code) throw new Error(`the rules dealt ${m}, the builder ${code}`);
    }
    this.push({ type, code });
    this.board = oracleBoard(code);
    this.turned = new Set();
    this.turn = this.board.starts;
    this.step = 'clue';
    this.winner = null;
    this.endedEarly = false;
    return code;
  }
  clue(n: number | 'inf', word?: string): this {
    this.mirror?.must(word === undefined ? { type: 'clue', n } : { type: 'clue', n, word });
    this.push(word === undefined ? { type: 'clue', n } : { type: 'clue', n, word });
    this.step = 'guessing';
    this.guessesLeft = n === 'inf' || n === 0 ? Infinity : n + 1;
    return this;
  }
  private leftOf(t: Team) { return this.board.kinds.filter((k, i) => k === t && !this.turned.has(i)).length; }
  mustReveal(cell: number): this {
    if (this.step !== 'guessing' || this.turned.has(cell)) throw new Error(`builder: reveal ${cell} not allowed now`);
    this.mirror?.must({ type: 'reveal', cell });
    this.push({ type: 'reveal', cell });
    this.turned.add(cell);
    const k = this.board.kinds[cell]!;
    this.guessesLeft--;
    if (k === 'landmine') { this.winner = other(this.turn); this.step = 'gameover'; return this; }
    if ((k === 'orange' || k === 'teal') && this.leftOf(k) === 0) { this.winner = k; this.step = 'gameover'; return this; }
    if (k !== this.turn || this.guessesLeft <= 0) this.step = 'over';
    return this;
  }
  endTurn(): this { return this.must({ type: 'endTurn' }).must({ type: 'nextTurn' }); }
  nextTurn(): this { return this.must({ type: 'nextTurn' }); }
  /** Face-down cells of a kind on the board in play, in cell order. */
  faceDown(kind?: Kind): number[] {
    return this.board.kinds.map((k, i) => (!this.turned.has(i) && (kind === undefined || k === kind) ? i : -1)).filter((i) => i >= 0);
  }
  /** The guessing team wins at once: clue ∞, then every one of its words. */
  winTurn(): this {
    const t = this.turn;
    this.clue('inf');
    for (const c of this.faceDown(t)) this.mustReveal(c);
    return this;
  }
  saved(status: 'in-progress' | 'ended' = 'in-progress', id = 'sw-lane-d', sessionId = 'session-sw-lane-d'): any {
    return {
      format: 2, gameType: 'secret-words', id, createdAt: T0, updatedAt: this.at, status, sessionId,
      setup: this.setup, records: this.records.map((r) => ({ ...r })),
    };
  }
}

/** Cells of `kind` on board `b`, in cell order. */
export const cellsOfKind = (b: OracleBoard, kind: Kind) => b.kinds.map((k, i) => (k === kind ? i : -1)).filter((i) => i >= 0);

/** A new evening dealt once. */
export function newEvening(o: EveningOptions = {}): SwEvening {
  const ev = new SwEvening(o);
  ev.deal();
  return ev;
}
const nobody = (ev: SwEvening) => ev.faceDown('nobody')[0]!;
const playAgainOn = (ev: SwEvening, orange: string, teal: string) => {
  ev.must({ type: 'setClueGivers', clueGivers: { orange, teal }, partners: { orange: null, teal: null } });
  ev.deal();
};

/** Every evening the lane D browser tests open. Game 1 is on CODES[0] (Chai Champions start), game 2 on CODES[1]. */
export const flows = {
  /** Chai Champions find all 9 in their first turn with a clue without a word. */
  orangeWinsAtOnce: (o: EveningOptions = {}) => newEvening(o).winTurn(),
  /** Chai Champions guessing in turn 1 after "2" and one of their words. */
  midGame: (o: EveningOptions = {}) => { const ev = newEvening(o).clue(2); return ev.mustReveal(ev.faceDown('orange')[0]!); },
  /** Coffee Commandos' pass screen of turn 2 (one phone). */
  tealPassStep: (o: EveningOptions = {}) => { const ev = newEvening(o).clue(1); return ev.mustReveal(nobody(ev)).nextTurn(); },
  /** Coffee Commandos turn over Chai Champions' last word: Chai Champions win. */
  otherTeamTurnsLast: () => {
    const ev = newEvening();
    const orange = ev.faceDown('orange');
    ev.clue('inf');
    for (const c of orange.slice(0, 8)) ev.mustReveal(c);
    ev.endTurn().clue(1);
    return ev.mustReveal(orange[8]!);
  },
  tealWins: () => { const ev = newEvening().clue(1); ev.mustReveal(nobody(ev)).nextTurn(); return ev.winTurn(); },
  /** Chai Champions find 7, then hit the Landmine: Coffee Commandos win. */
  landmine: () => {
    const ev = newEvening().clue('inf');
    for (const c of ev.faceDown('orange').slice(0, 7)) ev.mustReveal(c);
    return ev.mustReveal(ev.faceDown('landmine')[0]!);
  },
  /** Chai Champions win while Coffee Commandos have `leftOver` words left. */
  nearMiss: (leftOver: number) => {
    const ev = newEvening().clue(1);
    ev.mustReveal(ev.faceDown('orange')[0]!).endTurn().clue('inf');
    for (const c of ev.faceDown('teal').slice(0, 8 - leftOver)) ev.mustReveal(c);
    return ev.endTurn().winTurn();
  },
  /** Ended early by "End the game" after "Ocean 2" found 2. */
  endedEarlyWithBest: () => {
    const ev = newEvening().clue(2, 'Ocean');
    for (const c of ev.faceDown('orange').slice(0, 2)) ev.mustReveal(c);
    return ev.must({ type: 'endGame' });
  },
  /** Game 1 won by Chai Champions; Play again with Meena and Kabir; Coffee Commandos (starting, 9 words) win game 2 at once. */
  twoGames: () => { const ev = flows.orangeWinsAtOnce(); playAgainOn(ev, 'Meena', 'Kabir'); return ev.winTurn(); },
  /** One word found by Chai Champions, then "End the game"; teams `o`. */
  oneWordEndedEarly: (o: EveningOptions = {}) => {
    const ev = newEvening(o).clue(1);
    return ev.mustReveal(ev.faceDown('orange')[0]!).must({ type: 'endGame' });
  },
  /** Easy board, Chai Champions win at once. */
  easyWin: () => newEvening({ choices: { board: 'easy' } }).winTurn(),
  /** Game 1 with a partner, Arjun renamed "Arjun K" afterwards, then the night ended. */
  pairRenamedEnded: () => {
    const ev = newEvening({ teams: exampleTeams({ partners: { orange: 'Meena', teal: null } }) }).winTurn();
    const t = exampleTeams({ teal: ['Arjun K', 'Kabir', 'Dev'], clueGivers: { orange: 'Riya', teal: 'Arjun K' }, partners: { orange: 'Meena', teal: null } });
    ev.must({ type: 'setPlayers', players: [...t.orange, ...t.teal], teams: t, renames: { Arjun: 'Arjun K' } });
    return ev.must({ type: 'endEvening' });
  },
  /** Four players, Chai Champions' clue given (guessing). */
  fourPlayersGuessing: () => newEvening({ teams: exampleTeams({ orange: ['Riya', 'Meena'], teal: ['Arjun', 'Kabir'] }) }).clue(2),
};

/** SWD-128 best-clue cases: the game, and the DOM text expected (null: absent) with the word as shown upper case. */
export const bestClueFlows: { name: string; build: () => SwEvening; dom: string | null; shown?: string }[] = [
  {
    name: 'found equals its number: "Best clue: OCEAN 2 · all 2 found"',
    build: () => {
      const ev = newEvening().clue(2, 'Ocean');
      for (const c of ev.faceDown('orange').slice(0, 2)) ev.mustReveal(c);
      ev.endTurn().clue(1);
      ev.mustReveal(nobody(ev)).nextTurn().clue('inf');
      for (const c of ev.faceDown('orange')) ev.mustReveal(c);
      return ev;
    },
    dom: 'Best clue: Ocean 2 · all 2 found', shown: 'OCEAN',
  },
  {
    name: 'found more than its number: "Best clue: OCEAN for 2 · 3 words found"',
    build: () => {
      const ev = newEvening().clue(2, 'Ocean');
      for (const c of ev.faceDown('orange').slice(0, 3)) ev.mustReveal(c);
      ev.nextTurn().clue(1);
      ev.mustReveal(nobody(ev)).nextTurn().clue('inf');
      for (const c of ev.faceDown('orange')) ev.mustReveal(c);
      return ev;
    },
    dom: 'Best clue: Ocean for 2 · 3 words found', shown: 'OCEAN',
  },
  {
    name: '∞ with a word: "Best clue: RAIN (any number) · 9 found"',
    build: () => { const ev = newEvening().clue('inf', 'Rain'); for (const c of ev.faceDown('orange')) ev.mustReveal(c); return ev; },
    dom: 'Best clue: Rain (any number) · 9 found', shown: 'RAIN',
  },
  {
    name: '0 with a word: "Best clue: RAIN 0 · 9 found"',
    build: () => { const ev = newEvening().clue(0, 'Rain'); for (const c of ev.faceDown('orange')) ev.mustReveal(c); return ev; },
    dom: 'Best clue: Rain 0 · 9 found', shown: 'RAIN',
  },
  {
    name: 'a tie: the earliest clue',
    build: () => {
      const ev = newEvening().clue(2, 'Ocean');
      for (const c of ev.faceDown('orange').slice(0, 2)) ev.mustReveal(c);
      ev.endTurn().clue(2, 'Planet');
      for (const c of ev.faceDown('teal').slice(0, 2)) ev.mustReveal(c);
      ev.endTurn().clue('inf');
      for (const c of ev.faceDown('orange')) ev.mustReveal(c);
      return ev;
    },
    dom: 'Best clue: Ocean 2 · all 2 found', shown: 'OCEAN',
  },
  {
    name: 'the other team\'s clue when it found the most',
    build: () => {
      const ev = newEvening().clue(2, 'Ocean');
      for (const c of ev.faceDown('orange').slice(0, 2)) ev.mustReveal(c);
      ev.endTurn().clue(3, 'Planet');
      for (const c of ev.faceDown('teal').slice(0, 3)) ev.mustReveal(c);
      ev.endTurn().clue('inf');
      for (const c of ev.faceDown('orange')) ev.mustReveal(c);
      return ev;
    },
    dom: 'Best clue: Planet 3 · all 3 found', shown: 'PLANET',
  },
  {
    name: 'absent when no clue with a word found at least 2',
    build: () => {
      const ev = newEvening().clue(1, 'Ocean');
      ev.mustReveal(ev.faceDown('orange')[0]!).endTurn().clue(1);
      ev.mustReveal(nobody(ev)).nextTurn().clue('inf');
      for (const c of ev.faceDown('orange')) ev.mustReveal(c);
      return ev;
    },
    dom: null,
  },
];

/** The flows with their team variants, as the browser tests use them (for the rule test that replays them). */
export const ALL_FLOWS: [string, () => SwEvening][] = [
  ['orangeWinsAtOnce', () => flows.orangeWinsAtOnce()],
  ['orangeWinsAtOnce, partner and guess-only', () => flows.orangeWinsAtOnce({ teams: exampleTeams({ partners: { orange: 'Meena', teal: null }, guessOnly: ['Zoya'] }) })],
  ['orangeWinsAtOnce, two shared phones', () => flows.orangeWinsAtOnce({ choices: { map: 'shared' } })],
  ['orangeWinsAtOnce, four players guess-only', () => flows.orangeWinsAtOnce({ teams: exampleTeams({ orange: ['Riya', 'Meena'], teal: ['Arjun', 'Kabir'], guessOnly: ['Meena', 'Kabir'] }) })],
  ['orangeWinsAtOnce, four players', () => flows.orangeWinsAtOnce({ teams: exampleTeams({ orange: ['Riya', 'Meena'], teal: ['Arjun', 'Kabir'] }) })],
  ['orangeWinsAtOnce, guess-only Kabir and Dev', () => flows.orangeWinsAtOnce({ teams: exampleTeams({ guessOnly: ['Kabir', 'Dev'] }) })],
  ['orangeWinsAtOnce, teal partner', () => flows.orangeWinsAtOnce({ teams: exampleTeams({ partners: { orange: null, teal: 'Kabir' } }) })],
  ['orangeWinsAtOnce, twenty players', () => flows.orangeWinsAtOnce({ teams: twentyTeams() })],
  ['orangeWinsAtOnce then Play again', () => { const ev = flows.orangeWinsAtOnce(); playAgainOn(ev, 'Meena', 'Kabir'); return ev; }],
  ['midGame', () => flows.midGame()],
  ['midGame then endGame', () => flows.midGame().must({ type: 'endGame' })],
  ['tealPassStep', () => flows.tealPassStep()],
  ['tealPassStep then dealNew', () => { const ev = flows.tealPassStep(); ev.deal('dealNew'); return ev; }],
  ['otherTeamTurnsLast', flows.otherTeamTurnsLast],
  ['tealWins', flows.tealWins],
  ['landmine', flows.landmine],
  ['nearMiss 1', () => flows.nearMiss(1)],
  ['nearMiss 2', () => flows.nearMiss(2)],
  ['nearMiss 3', () => flows.nearMiss(3)],
  ['endedEarlyWithBest', flows.endedEarlyWithBest],
  ['twoGames', flows.twoGames],
  ['oneWordEndedEarly with a partner', () => flows.oneWordEndedEarly({ teams: exampleTeams({ partners: { orange: 'Meena', teal: null } }) })],
  ['easyWin', flows.easyWin],
  ['pairRenamedEnded', flows.pairRenamedEnded],
  ['fourPlayersGuessing', flows.fourPlayersGuessing],
  ['orangeWinsAtOnce then endEvening', () => flows.orangeWinsAtOnce().must({ type: 'endEvening' })],
  ...bestClueFlows.map((f) => [`best clue: ${f.name}`, f.build] as [string, () => SwEvening]),
];

/** 20 players, 10 a team ("Player A" … "Player T"). */
export function twentyTeams(): TeamsInput {
  const names = Array.from({ length: 20 }, (_, i) => `Player ${String.fromCharCode(65 + i)}`);
  return exampleTeams({ orange: names.slice(0, 10), teal: names.slice(10), clueGivers: { orange: names[0]!, teal: names[10]! } });
}
