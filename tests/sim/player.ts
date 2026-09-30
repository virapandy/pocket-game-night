// The generic simulated player (PLT-110 to PLT-113, PLT-123). It works for any game on the engine contract:
// the options it may pick are the actor's legal moves (`rules.legalMoves`) plus any detail moves the game's
// simulation driver offers (for Tambola, "claim Top Line on ticket 3"), and "do nothing". Code states the facts
// first; the player only chooses. Three kinds of player:
//   random    picks any option, from a seeded generator;
//   scripted  a persona's fixed habits (claims on time, late, falsely, never), from a seeded generator;
//   jev       asks Jev (a typed Choice with probabilities) and samples from its probabilities with the seeded
//             generator; when Jev is unavailable or out of budget, the scripted habit takes over (PLT-111, PLT-113).
// The player never applies anything itself: the caller plays the chosen move through the engine, and the engine's
// verdict is final. When the player expected another outcome, `disagreement()` records it (PLT-112).
import type { ActorId, GameRules, Move, Rng } from '../../src/engine';
import type { ChoiceAnswer, ChoiceQuestion, Jev } from './jev';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PlayerKind = 'random' | 'scripted' | 'jev';

export interface Option<M extends Move = Move> {
  /** Short, stable id: letters, digits and dashes (Jev answers with it). */
  key: string;
  /** The move to play, or null for "do nothing now". */
  move: M | null;
  /** What choosing it means, in plain words (shown to Jev; never used by the referee). */
  says: string;
  /** What the player believes the verdict will be, if anything (PLT-112). */
  expects?: string;
}

export interface Persona {
  id: string;
  /** One line about how this person plays, for Jev ("a slow grandparent who ..."). */
  describe: string;
}

export interface Situation<M extends Move = Move> {
  game: string;
  actor: ActorId;
  persona: Persona;
  /** Facts worked out by code from the player's own view, such as "Ticket 3, Top Line: 5 of 5 called". */
  facts: string[];
  options: Option<M>[];
}

export interface Decision<M extends Move = Move> {
  key: string;
  move: M | null;
  expects?: string;
  by: PlayerKind;
  /** Jev's probabilities over the option keys, when Jev chose. */
  probabilities?: Record<string, number>;
  /** Why a Jev player fell back to its script (no key, cap reached, an answer outside the options). */
  fallback?: string;
}

/** A persona's habit: returns the key of the option it takes. Must return one of the offered keys. */
export type Script<M extends Move = Move> = (s: Situation<M>, rng: Rng) => string;

/** The actor's legal moves as options, plus the driver's extra options (detail moves and "do nothing"). */
export function optionsFor<M extends Move>(
  rules: GameRules<any, any, M, any>, state: unknown, actor: ActorId, extra: Option<M>[] = [],
  describe: (m: M) => string = (m) => JSON.stringify(m),
): Option<M>[] {
  const legal = rules.isOver(state as any) ? [] : rules.legalMoves(state as any, actor);
  const seen = new Set<string>();
  const out: Option<M>[] = [];
  const add = (o: Option<M>) => {
    let key = o.key.replace(/[^a-zA-Z0-9-]/g, '-');
    while (seen.has(key)) key += '-x';
    seen.add(key);
    out.push({ ...o, key });
  };
  legal.forEach((m) => add({ key: moveKey(m), move: m, says: describe(m) }));
  extra.forEach(add);
  return out;
}

export function moveKey(m: Move): string {
  const parts = Object.entries(m as any).filter(([k]) => k !== 'type').map(([, v]) => (Array.isArray(v) ? v.join('+') : String(v)));
  return [m.type, ...parts].join('-');
}

export function randomChoice<M extends Move>(s: Situation<M>, rng: Rng): Decision<M> {
  const o = s.options[rng.int(s.options.length)]!;
  return { key: o.key, move: o.move, expects: o.expects, by: 'random' };
}

export function scriptedChoice<M extends Move>(s: Situation<M>, rng: Rng, script: Script<M>, fallback?: string): Decision<M> {
  const key = script(s, rng);
  const o = s.options.find((x) => x.key === key) ?? s.options[0]!;
  return { key: o.key, move: o.move, expects: o.expects, by: 'scripted', ...(fallback ? { fallback } : {}) };
}

/** The Jev question for one situation: a Choice among the option keys, with the facts in the instructions. */
export function jevQuestion(s: Situation): ChoiceQuestion {
  return {
    type: 'choice',
    instructions: {
      question: `You are playing ${s.game} at a family party as ${s.persona.describe}. Which of these do you do now?`,
      facts: s.facts,
      note: 'The facts were worked out by the app and are correct. Pick what this person would really do; the host decides every result.',
    },
    criteria: Object.fromEntries(s.options.map((o) => [o.key, o.says])),
  };
}

/** Samples an option from Jev's probabilities with the seeded generator (the same answers give the same pick). */
export function sampleFrom(options: Option[], probabilities: Record<string, number>, rng: Rng): Option | null {
  const weights = options.map((o) => Math.max(0, Number(probabilities[o.key] ?? 0)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return null;
  let r = (rng.int(1_000_000) / 1_000_000) * total;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i]!;
    if (r < 0) return options[i]!;
  }
  return options[options.length - 1]!;
}

/** Turns one Jev answer into a decision; anything outside the offered options falls back to the script (PLT-110). */
export function fromJev<M extends Move>(s: Situation<M>, answer: ChoiceAnswer | undefined, rng: Rng, script: Script<M>): Decision<M> {
  if (!answer || answer.type !== 'choice') return scriptedChoice(s, rng, script, 'no answer from Jev');
  const offered = new Set(s.options.map((o) => o.key));
  const probs = answer.probabilities && typeof answer.probabilities === 'object' ? answer.probabilities : {};
  const picked = sampleFrom(s.options, probs, rng) ?? s.options.find((o) => o.key === answer.choice && offered.has(o.key));
  if (!picked) return scriptedChoice(s, rng, script, 'Jev answered outside the options');
  return { key: picked.key, move: picked.move as M | null, expects: picked.expects, by: 'jev', probabilities: probs };
}

export interface Chooser {
  kind: PlayerKind;
  script: Script<any>;
}

/**
 * Decides several situations at once. Jev players are asked together in one call (fan-out); everyone else, and every
 * Jev player when Jev is unavailable or out of budget, uses their script (or a random pick).
 */
export async function decideAll(
  items: { situation: Situation<any>; chooser: Chooser }[], rng: Rng, jev: Jev | null,
): Promise<Decision<any>[]> {
  const out: Decision<any>[] = new Array(items.length);
  const asking: number[] = [];
  items.forEach((it, i) => {
    if (it.situation.options.length === 0) throw new Error('a simulated player was asked with no options');
    if (it.chooser.kind === 'random') out[i] = randomChoice(it.situation, rng);
    else if (it.chooser.kind === 'scripted') out[i] = scriptedChoice(it.situation, rng, it.chooser.script);
    else asking.push(i);
  });
  if (asking.length) {
    const stopped = () => (jev?.stats.stoppedBy === 'run limit' ? "this run's Jev limit reached" : 'weekly Jev cap reached');
    const why = !jev ? 'no Jev key' : !jev.available(asking.length) ? (jev.stats.capReached ? stopped() : 'Jev unavailable') : null;
    let answers: Record<string, ChoiceAnswer> | null = null;
    if (!why && jev) {
      const questions = Object.fromEntries(asking.map((i) => [`q${i}`, jevQuestion(items[i]!.situation)]));
      answers = await jev.choose({ note: 'Each question is a different guest at the same Tambola game.' }, questions);
    }
    for (const i of asking) {
      const it = items[i]!;
      out[i] = answers
        ? fromJev(it.situation, answers[`q${i}`], rng, it.chooser.script)
        : scriptedChoice(it.situation, rng, it.chooser.script, why ?? (jev?.stats.capReached ? stopped() : 'Jev unavailable'));
    }
  }
  // PLT-110: whatever happened above, every decision is one of the offered options.
  items.forEach((it, i) => {
    if (!it.situation.options.some((o) => o.key === out[i]!.key)) throw new Error(`decision ${out[i]!.key} is not an offered option`);
  });
  return out;
}

export interface Disagreement { actor: string; persona: string; option: string; expected: string; verdict: string }

/** PLT-112: the engine's verdict stands; a different expectation is only written down. */
export function disagreement(d: Decision, actor: string, persona: string, verdict: string): Disagreement | null {
  if (!d.expects || d.expects === verdict) return null;
  return { actor, persona, option: d.key, expected: d.expects, verdict };
}
