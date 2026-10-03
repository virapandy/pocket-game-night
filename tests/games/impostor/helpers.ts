// Shared helpers for the Impostor rule tests. The names and shapes are the "Test hooks the build provides",
// item 1 and item 2, in specs/impostor/README.md (scenarios v3.5, 4 October 2026), listed for the Build role in
// tests/games/impostor/README.md. Everything is imported from src/games/impostor/index.ts only.
//
// The module is loaded with a dynamic import, so that until the game is built every test fails on its own with
// "src/games/impostor is not built yet", instead of the whole file failing to load.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRng, HOST, play, startMatch, type Match, type Rng } from '../../../src/engine';

/** The moves that deal a word and so carry its `wordId` (Test hooks item 1, scenarios v3.5). */
export const DEALING = ['startDeal', 'nextRound', 'dealAgain', 'dontKnow', 'allowRepeats', 'setChoices'] as const;

/**
 * Test hooks item 1 (v3.5): live, `play` accepts a word-dealing move only with the id the rules give for that deal.
 * The rules list complete moves (the game contract's `legalMoves`), so a move the test writes without `wordId` takes
 * the `wordId` of the legal move of the same type and fields. When the legal moves carry no `wordId` (the build before
 * v3.5), the move is played as written.
 */
export function withWordId(rules: any, state: any, move: any): any {
  if (!move || !(DEALING as readonly string[]).includes(move.type) || 'wordId' in move) return move;
  const legal: any[] = rules.legalMoves(state, HOST) ?? [];
  const same = legal.find((m) => m.type === move.type && 'wordId' in m &&
    Object.keys(move).every((k) => k === 'choices' || JSON.stringify(m[k]) === JSON.stringify(move[k])));
  return same ? { ...move, wordId: same.wordId } : move;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const loaded: any = await import('../../../src/games/impostor').catch((e: unknown) => ({ __loadError: e }));

/** One export of src/games/impostor/index.ts, or a clear failure when it is not there yet. */
export function need<T = any>(name: string): T {
  if (loaded && '__loadError' in loaded) {
    const why = String((loaded.__loadError as Error)?.message ?? loaded.__loadError).split('\n')[0];
    throw new Error(`src/games/impostor is not built yet (needs ${name}): ${why}`);
  }
  if (loaded[name] === undefined) throw new Error(`${name} is not exported from src/games/impostor yet`);
  return loaded[name] as T;
}

export const rules = (): any => need('impostorRules');
export const pickImpostor = (players: readonly string[], recent: readonly string[], rng: Rng): string =>
  need<any>('pickImpostor')(players, recent, rng);
export const pickStarter = (players: readonly string[], started: readonly string[], skip: string | null, rng: Rng): { starter: string; newCycle: boolean } =>
  need<any>('pickStarter')(players, started, skip, rng);
export const pickWord = (words: readonly ImpostorWord[], filter: WordFilter, rng: Rng): ImpostorWord | null =>
  need<any>('pickWord')(words, filter, rng);
export const scoreRound = (outcome: { impostor: string; caught: boolean; guessedRight: boolean | null }, players: readonly string[]): Record<string, number> =>
  need<any>('scoreRound')(outcome, players);
export const readImpostorEvening = (saved: unknown): any => need<any>('readImpostorEvening')(saved);
export const readTestSeeds = (raw: string | null, release: boolean): any => need<any>('readTestSeeds')(raw, release);

// ---- The word list (IMP-054, IMP-055) ----

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export const CSV_PATH = here('../../../docs/games/impostor/words.csv');
export const JSON_PATH = here('../../../content/impostor/words.json');

/** A real CSV parser (RFC 4180: quoted fields, doubled quotes, commas and line breaks inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

export const CSV_TEXT = readFileSync(CSV_PATH, 'utf8');
const csv = parseCsv(CSV_TEXT);
export const CSV_HEADER = csv[0]!;
/** Every CSV row as an object keyed by the header. */
export const CSV_ROWS: Record<string, string>[] = csv.slice(1).map((r) => Object.fromEntries(CSV_HEADER.map((k, i) => [k, r[i] ?? ''])));

export interface ImpostorWord {
  id: string; word: string; other_names: string; category: string; audience: 'family' | 'grownups'; nonveg: boolean; hint: string;
  retired: boolean;
}
/** The words as the app's `words.json` must hold them (IMP-055, v3.5: with `retired`), built here straight from the CSV. */
export const WORDS: ImpostorWord[] = CSV_ROWS.map((r) => ({
  id: r.id!, word: r.word!, other_names: r.other_names!, category: r.category!,
  audience: r.audience as 'family' | 'grownups', nonveg: r.nonveg === 'yes', hint: r.hint!, retired: r.retired === 'yes',
}));
/** The words that may be dealt (IMP-054: a retired word is never dealt). `pickWord` tests pass this list. */
export const ACTIVE: ImpostorWord[] = WORDS.filter((w) => !w.retired);
export const RETIRED_IDS: string[] = WORDS.filter((w) => w.retired).map((w) => w.id);
export const wordById = (id: string): ImpostorWord => {
  const w = WORDS.find((x) => x.id === id);
  if (!w) throw new Error(`no word ${id} in words.csv`);
  return w;
};

/** The shipped list, `content/impostor/words.json` (IMP-055). */
export function shippedWords(): any[] {
  if (!existsSync(JSON_PATH)) throw new Error('content/impostor/words.json is not there yet (IMP-055)');
  return JSON.parse(readFileSync(JSON_PATH, 'utf8'));
}

/** The 9 categories, named and ordered exactly as IMP-007 (v3.5, 4 October 2026). */
export const CATEGORIES = [
  'Food', 'Festivals and occasions', 'Around the house', 'Out and about', 'Films, music and TV',
  'Sports and games', 'School and childhood', 'Weddings and family', 'Everyday moments',
] as const;
/** The 3 category names retired rows may still carry (IMP-054). */
export const RETIRED_CATEGORIES = ['Travel and places', 'Cricket and games', 'Desi life'] as const;
/**
 * The 6 category names that are the same before and after the 4 October rename. Tests of other rules use them where
 * the category does not matter (a `setChoices` that changes Mode or Score), so they read the same on either word list.
 */
export const COMMON_CATEGORIES = [
  'Food', 'Festivals and occasions', 'Around the house', 'Films, music and TV', 'School and childhood', 'Weddings and family',
] as const;

export interface WordFilter {
  words: 'family' | 'grownups';
  categories: readonly string[];
  nonveg: boolean;
  usedTonight: ReadonlySet<string>;
  recent: ReadonlySet<string>;
  blocked: ReadonlySet<string>;
  allowRepeats: boolean;
}

/** IMP-050: does this word pass the audience, category and non-veg choices? (Retired words: `ACTIVE`.) */
export const passesChoices = (w: ImpostorWord, f: { words: 'family' | 'grownups'; categories: readonly string[]; nonveg: boolean }) =>
  (f.words === 'grownups' ? w.audience === 'family' || w.audience === 'grownups' : w.audience === 'family') &&
  f.categories.includes(w.category) && (f.nonveg || !w.nonveg);

/** IMP-052: the group a deal must pick from (ids), or [] when no word is left. */
export function expectedGroup(words: readonly ImpostorWord[], f: WordFilter): string[] {
  const ok = words.filter((w) => passesChoices(w, f) && !f.blocked.has(w.id));
  if (f.allowRepeats) return ok.map((w) => w.id);
  const g1 = ok.filter((w) => !f.usedTonight.has(w.id) && !f.recent.has(w.id));
  if (g1.length) return g1.map((w) => w.id);
  return ok.filter((w) => !f.usedTonight.has(w.id) && f.recent.has(w.id)).map((w) => w.id);
}

// ---- Setup and playing an evening ----

export const P3 = ['Riya', 'Arjun', 'Meena'];
export const P4 = ['Riya', 'Arjun', 'Meena', 'Kabir'];
export const P5 = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya'];
/** Extra names for evenings of up to 20 players. */
export const NAMES = [
  'Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Asha', 'Nani', 'Dadu', 'Ishaan',
  'Tara', 'Vikram', 'Pooja', 'Rahul', 'Sana', 'Aman', 'Leela', 'Omar', 'Neha', 'Kiran',
];

export interface Choices {
  mode: 'easy' | 'hard'; talking: 'free' | 'timer'; score: boolean; words: 'family' | 'grownups';
  categories: string[]; nonveg: boolean; lastGuess?: boolean;
}
/** IMP-005, IMP-007 and IMP-076: a new evening's first-ever choices (the last-chance guess off). */
export const NEW_EVENING_CHOICES: Choices = {
  mode: 'easy', talking: 'free', score: false, words: 'family', categories: [...CATEGORIES], nonveg: false, lastGuess: false,
};
/**
 * The choices the rule tests play with unless a test says otherwise: the first-ever defaults with the last-chance
 * guess ON (IMP-039), so the tests written for v2.2, whose caught rounds have "Show the word" and a verdict, keep
 * checking the same rules. Tests of a round with the guess off pass `lastGuess: false` (IMP-033, IMP-076).
 */
export const DEFAULT_CHOICES: Choices = { ...NEW_EVENING_CHOICES, lastGuess: true };
/** Choices for a `setChoices` move in a test of another rule (categories valid on either word list). */
export const changedChoices = (over: Partial<Choices> = {}): Choices => ({ ...DEFAULT_CHOICES, categories: [...COMMON_CATEGORIES], ...over });
export const T0 = 1_791_043_200_000; // 3 October 2026, as in IMP-096's example

export interface EveningOptions {
  players?: string[];
  choices?: Partial<Choices>;
  seed?: string;
  starterSeed?: string;
  excludedWords?: { dealtTonight?: string[]; recent?: string[]; blocked?: string[] };
  testDeals?: { wordId?: string; impostor?: string; starter?: string }[];
}

/** The `SetupInput` of Test hooks item 1. */
export function setupInput(o: EveningOptions = {}): any {
  const config: any = {
    players: o.players ?? P4,
    choices: { ...DEFAULT_CHOICES, ...o.choices },
    excludedWords: {
      dealtTonight: o.excludedWords?.dealtTonight ?? [],
      recent: o.excludedWords?.recent ?? [],
      blocked: o.excludedWords?.blocked ?? [],
    },
  };
  if (o.testDeals) config.testDeals = o.testDeals;
  return {
    gameId: 'impostor',
    seeds: { word: o.seed ?? 'word-seed-1', starter: o.starterSeed ?? `starter-of-${o.seed ?? 'word-seed-1'}` },
    config,
  };
}

export type AnyMatch = Match<any, any, any>;

/** One Impostor evening on the engine, one second per move. Each helper plays through the referee (`play`). */
export class Evening {
  readonly rules = rules();
  match: AnyMatch;
  at: number;

  constructor(o: EveningOptions = {}, at = T0) {
    this.match = startMatch(this.rules, setupInput(o), at);
    this.at = at;
  }

  static from(match: AnyMatch): Evening {
    const e = Object.create(Evening.prototype) as Evening;
    (e as any).rules = rules();
    e.match = match;
    e.at = match.records.length ? match.records[match.records.length - 1]!.at : T0;
    return e;
  }

  /** Plays a move; returns whether the referee accepted it (a refused move changes nothing). */
  try(move: any, gap = 1000): boolean {
    const r = play(this.rules, this.match, withWordId(this.rules, this.state, move), { by: HOST, at: this.at + gap });
    if (!r.ok) return false;
    this.at += gap;
    this.match = r.value;
    return true;
  }

  /** Plays a move that must be accepted. */
  must(move: any, gap = 1000): this {
    const r = play(this.rules, this.match, withWordId(this.rules, this.state, move), { by: HOST, at: this.at + gap });
    if (!r.ok) throw new Error(`${JSON.stringify(move)} was refused: ${r.reason}`);
    this.at += gap;
    this.match = r.value;
    return this;
  }

  /** True when the referee refuses the move, and the evening is unchanged afterwards. */
  refuses(move: any): boolean {
    const before = this.match;
    const r = play(this.rules, this.match, withWordId(this.rules, this.state, move), { by: HOST, at: this.at + 1000 });
    return !r.ok && this.match === before;
  }

  get state() { return this.match.state; }
  host(): any { return this.rules.view(this.state, { kind: 'host' }); }
  room(): any { return this.rules.view(this.state, { kind: 'room' }); }
  player(name: string): any { return this.rules.view(this.state, { kind: 'player', playerId: name }); }
  players(): string[] { return this.host().players; }
  isOver(): boolean { return this.rules.isOver(this.state); }

  /** The round's impostor, read from the players' own views (exactly one says impostor). */
  impostor(): string {
    const imps = this.players().filter((p) => this.player(p)?.role === 'impostor');
    if (imps.length !== 1) throw new Error(`expected exactly one impostor in the players' views, got ${JSON.stringify(imps)}`);
    return imps[0]!;
  }
  /** The round's word id, from a crew member's view. */
  wordId(): string {
    const crew = this.players().find((p) => this.player(p)?.role === 'crew');
    if (!crew) throw new Error('no crew view');
    return this.player(crew).wordId;
  }
  crew(): string[] { const imp = this.impostor(); return this.players().filter((p) => p !== imp); }

  startDeal(practice = false) { return this.must({ type: 'startDeal', practice }); }
  /** Everyone taps "Done…" in seat order (one `seen` per player). */
  dealAll() { for (let i = 0; i < this.players().length; i++) this.must({ type: 'seen' }); return this; }
  toVote() { return this.must({ type: 'startTalk' }).must({ type: 'voteNow' }); }
  nextRound() { return this.must({ type: 'nextRound' }); }

  /**
   * Plays the round being dealt to its result. Returns what happened, read from the views.
   * caught: the vote reveals the impostor and the guess is right or wrong (`right: null`: the last-chance guess is off,
   * so the reveal completes the round); escaped: the vote reveals a crew member;
   * stillTie: a re-vote between the impostor and a crew member ends "Still a tie".
   */
  playRound(outcome: Outcome): RoundFacts {
    this.dealAll();
    const starter: string = this.host().starter;
    const impostor = this.impostor();
    const wordId = this.wordId();
    const crew = this.crew();
    this.toVote();
    let revealed: string | null = null;
    if (outcome.kind === 'caught') {
      this.must({ type: 'reveal', player: impostor });
      if (outcome.right !== null) this.must({ type: 'showWord' }).must({ type: 'verdict', right: outcome.right });
      revealed = impostor;
    } else if (outcome.kind === 'escaped') {
      revealed = crew[(outcome.pick ?? 0) % crew.length]!;
      this.must({ type: 'reveal', player: revealed });
    } else {
      this.must({ type: 'tie', players: this.players().filter((p) => p === impostor || p === crew[0]) }).must({ type: 'stillTie' });
    }
    return { impostor, wordId, starter, crew, revealed, outcome };
  }
}

export type Outcome = { kind: 'caught'; right: boolean | null } | { kind: 'escaped'; pick?: number } | { kind: 'stillTie' };
export interface RoundFacts { impostor: string; wordId: string; starter: string; crew: string[]; revealed: string | null; outcome: Outcome }

/** A random outcome for a round, from the test's own choices generator. */
export function randomOutcome(rng: Rng): Outcome {
  const k = rng.int(4);
  if (k === 0) return { kind: 'caught', right: true };
  if (k === 1) return { kind: 'caught', right: false };
  if (k === 2) return { kind: 'escaped', pick: rng.int(20) };
  return { kind: 'stillTie' };
}

/** The points a round must score, by IMP-041, worked out here from the outcome (practice rounds score nothing). */
export function expectedPoints(f: RoundFacts, players: readonly string[]): Record<string, number> {
  const pts: Record<string, number> = Object.fromEntries(players.map((p) => [p, 0]));
  if (f.outcome.kind === 'caught') {
    if (f.outcome.right === true) pts[f.impostor] = 1;
    else for (const c of f.crew) pts[c] = 1;
  } else pts[f.impostor] = 2;
  return pts;
}

export const seeded = (s: string) => createRng(s);
export const seedList = (n: number, prefix: string) => Array.from({ length: n }, (_, i) => `${prefix}-${i}`);

/** Word ids that may be dealt, are family and not non-veg (always allowed by the default choices). */
export const FAMILY_VEG = ACTIVE.filter((w) => w.audience === 'family' && !w.nonveg).map((w) => w.id);
/** The same, in the 6 categories named alike before and after 4 October. */
export const FAMILY_VEG_COMMON = ACTIVE.filter((w) => w.audience === 'family' && !w.nonveg && (COMMON_CATEGORIES as readonly string[]).includes(w.category)).map((w) => w.id);
