// PLT-110 to PLT-113, PLT-122, PLT-123: the generic simulated player, with Jev stood in for by a fake (no internet,
// no key: PLT-114). A real Jev run is the optional step in tests/sim/extended.run.ts.
import { describe, expect, it } from 'vitest';
import { createRng, HOST, type GameRules } from '../../src/engine';
import { rules, setupInput } from '../games/tambola/helpers';
import { startMatch } from '../../src/engine';
import { isoWeek, makeBudget, makeJev, WEEKLY_CAP, type ChoiceAnswer, type JevRequest, type Transport } from './jev';
import { decideAll, disagreement, jevQuestion, optionsFor, type Chooser, type Situation } from './player';
import { playGame, runMany, summaryText, PERSONAS } from './mass';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

/* eslint-disable @typescript-eslint/no-explicit-any */
const FAKE_KEY = ['apikey', 'fake', 'x'.repeat(24)].join('_');

/** A fake Jev: answers every question with the probabilities `pick` gives over the offered keys. */
function fakeJev(pick: (keys: string[], q: any) => Record<string, number>, log: JevRequest[] = []): Transport {
  return async (body) => {
    log.push(body);
    const answers: Record<string, ChoiceAnswer> = {};
    for (const [id, q] of Object.entries(body.questions)) {
      const probabilities = pick(Object.keys(q.criteria), q);
      const choice = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
      answers[id] = { type: 'choice', choice, confidence: 0.5, probabilities };
    }
    return { model: 'fake', answers, usage: { input_tokens: 10 } };
  };
}
const uniform = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, 1 / keys.length]));
/** Always claims, and prefers a claim for a prize that is not complete (a "false claim"). */
const falseClaimer = (keys: string[], q: any) => {
  const notDone = keys.filter((k) => String(q.criteria[k]).includes('not complete'));
  const target = notDone[0] ?? keys.find((k) => k !== 'stay-quiet') ?? keys[0]!;
  return { [target]: 1 };
};

const quietScript = (s: Situation) => s.options.find((o) => o.move === null)?.key ?? s.options[0]!.key;

describe('PLT-110: the generic simulated player can play any game', () => {
  // A toy game on the same contract, to show nothing in the player is Tambola's: count to 3, or stop.
  type ToyMove = { type: 'add'; n: number } | { type: 'stop' };
  const toy: GameRules<any, { total: number; over: boolean }, ToyMove, any> = {
    setup: () => ({ total: 0, over: false }),
    legalMoves: (s) => (s.over ? [] : [{ type: 'add', n: 1 }, { type: 'add', n: 2 }, { type: 'stop' }]),
    apply: (s, m) => ({ ok: true, value: m.type === 'stop' ? { ...s, over: true } : { ...s, total: s.total + m.n } }),
    view: (s) => s,
    isOver: (s) => s.over || s.total >= 3,
    invariants: () => [],
  } as any;

  it('offers exactly the legal moves, for Tambola and for another game, and every decision is one of them', async () => {
    const m = startMatch(rules, setupInput(), 0);
    const tambolaOpts = optionsFor(rules, m.state, HOST);
    const legal = rules.legalMoves(m.state, HOST);
    expect(tambolaOpts.map((o) => o.move)).toEqual(legal);
    const toyOpts = optionsFor(toy, { total: 0, over: false }, HOST);
    expect(toyOpts.map((o) => o.move)).toEqual(toy.legalMoves({ total: 0, over: false }, HOST));
    expect(new Set(toyOpts.map((o) => o.key)).size).toBe(toyOpts.length);
    expect(optionsFor(toy, { total: 0, over: true }, HOST)).toEqual([]);

    const rng = createRng('plt-110');
    // Jev puts all its weight on keys that were never offered: the player must still pick an offered option.
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: fakeJev(() => ({ 'call-now-please': 1, 'win-everything': 1 })) });
    for (const [name, opts] of [['tambola', tambolaOpts], ['toy', toyOpts]] as const) {
      for (const kind of ['random', 'scripted', 'jev'] as const) {
        for (let i = 0; i < 20; i++) {
          const s: Situation = { game: name, actor: HOST, persona: PERSONAS.prompt!, facts: ['a fact'], options: opts as any };
          const [d] = await decideAll([{ situation: s, chooser: { kind, script: (x) => x.options[0]!.key } }], rng, jev);
          expect(opts.map((o) => o.key)).toContain(d!.key);
          expect(opts.find((o) => o.key === d!.key)!.move).toEqual(d!.move);
        }
      }
    }
  });

  it('code states the facts first; Jev only receives them and the options, and only chooses', () => {
    const s: Situation = {
      game: 'Tambola', actor: 'p1', persona: PERSONAS['slow-grandparent']!,
      facts: ['Ticket 3, Top Line: complete with the number just called (45)'],
      options: [
        { key: 'claim-top-line-t3', move: null, says: 'Shout "Top Line!" for ticket 3' },
        { key: 'stay-quiet', move: null, says: 'Say nothing for now' },
      ],
    };
    const q = jevQuestion(s);
    expect(q.type).toBe('choice');
    expect((q.instructions as any).facts).toEqual(s.facts);
    expect(Object.keys(q.criteria)).toEqual(['claim-top-line-t3', 'stay-quiet']);
  });

  it('in whole Tambola games with Jev players, every Jev decision is one the rules offered, and the game stays sound', async () => {
    const log: JevRequest[] = [];
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: fakeJev(uniform, log) });
    const s = await runMany({ games: 20, prefix: 'plt-110', jev, jevShare: 1 });
    expect(s.failures).toEqual([]);
    expect(s.decisionsBy.jev).toBeGreaterThan(0);
    expect(log.length).toBeGreaterThan(0);
    // Facts come from code in every question.
    for (const q of log.flatMap((b) => Object.values(b.questions))) expect((q.instructions as any).facts.length).toBeGreaterThan(0);
  });
});

describe('PLT-111: simulations work without Jev', () => {
  it('Jev unavailable (every call fails): scripted players take over and the run completes with the same summary format', async () => {
    const failing: Transport = async () => { throw new Error('connection refused'); };
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: failing });
    const down = await runMany({ games: 20, prefix: 'plt-111', jev, jevShare: 1 });
    const none = await runMany({ games: 20, prefix: 'plt-111', jev: null });
    expect(down.failures).toEqual([]);
    expect(down.decisionsBy.jev).toBe(0);
    expect(down.decisionsBy.scripted).toBeGreaterThan(0);
    expect(summaryText(down)).toContain('Jev unavailable: ran with random and scripted players');
    // Same summary format: the same lines, in the same order, whatever the numbers.
    const shape = (t: string) => t.split('\n').map((l) => l.replace(/:.*$/, ':').replace(/^- .*/, '-'));
    const a = shape(summaryText(down)).filter((l) => !l.startsWith('Jev problems') && l !== '-');
    const b = shape(summaryText(none)).filter((l) => l !== '-');
    expect(a.slice(0, b.length)).toEqual(b);
  });
});

describe('PLT-112: Jev is never the referee', () => {
  it('a Jev player that claims prizes that are not complete gets bogeys from the engine; its expectation is only recorded', async () => {
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: fakeJev(falseClaimer) });
    let bogeys = 0, disagreements = 0;
    for (let i = 0; i < 10; i++) {
      const r = await playGame(`plt-112-${i}`, { jev, jevShare: 1 });
      expect(r.problems).toEqual([]);
      bogeys += r.bogeys;
      disagreements += r.disagreements.length;
      // Every disagreement is "expected accepted, got something else"; the engine's verdict stood.
      for (const d of r.disagreements) {
        expect(d.expected).toBe('accepted');
        expect(d.verdict).not.toBe('accepted');
      }
      // No win was recorded for a false claim: every accepted claim in the engine is one the rules gave.
      const hv = rules.view(r.match.state, { kind: 'host' });
      expect(hv.claims.filter((c: any) => c.verdict === 'accepted').length).toBeLessThanOrEqual(r.accepted);
    }
    expect(bogeys).toBeGreaterThan(0);
    expect(disagreements).toBeGreaterThan(0);
  });

  it('a disagreement is written down only when the expectation differs from the verdict', () => {
    const d = { key: 'claim-top-line-t1', move: null, expects: 'accepted', by: 'jev' as const };
    expect(disagreement(d, 'p1', 'slow-grandparent', 'accepted')).toBeNull();
    expect(disagreement(d, 'p1', 'slow-grandparent', 'bogey')).toEqual({
      actor: 'p1', persona: 'slow-grandparent', option: 'claim-top-line-t1', expected: 'accepted', verdict: 'bogey',
    });
    expect(disagreement({ ...d, expects: undefined } as any, 'p1', 'x', 'bogey')).toBeNull();
  });
});

describe('PLT-113: Jev spending is capped at 20,000 decisions a week', () => {
  it('the weekly cap is the owner\'s 20,000 decisions', () => {
    expect(WEEKLY_CAP).toBe(20_000);
    expect(makeBudget().cap).toBe(20_000);
  });

  it('when a run reaches the cap, no more Jev calls are made and the run finishes with scripted players', async () => {
    const log: JevRequest[] = [];
    const budget = makeBudget({ usedAlready: WEEKLY_CAP - 12 });
    const jev = makeJev({ key: FAKE_KEY, budget, transport: fakeJev(uniform, log) });
    const s = await runMany({ games: 15, prefix: 'plt-113', jev, jevShare: 1 });
    const asked = log.reduce((a, b) => a + Object.keys(b.questions).length, 0);
    expect(asked).toBeLessThanOrEqual(12);
    expect(budget.used()).toBeLessThanOrEqual(WEEKLY_CAP);
    expect(s.jev.capReached).toBe(true);
    expect(s.failures).toEqual([]);
    expect(s.fallbacks['weekly Jev cap reached']).toBeGreaterThan(0);
    expect(s.decisionsBy.scripted).toBeGreaterThan(0);
    expect(summaryText(s)).toContain('weekly cap of 20,000 decisions reached; the rest of the run used scripted players');
  });

  it('the count is kept for the whole week across runs, and starts again the next week', async () => {
    const file = `${mkdtempSync(`${tmpdir()}/jev-usage-`)}/usage.json`;
    const monday = Date.UTC(2026, 8, 28, 9), sunday = Date.UTC(2026, 9, 4, 22), nextMonday = Date.UTC(2026, 9, 5, 9);
    expect(isoWeek(monday)).toBe('2026-W40');
    expect(isoWeek(sunday)).toBe('2026-W40');
    expect(isoWeek(nextMonday)).toBe('2026-W41');
    const first = makeBudget({ cap: 10, file, now: monday });
    expect(first.take(7)).toBe(true);
    expect(first.take(4)).toBe(false);
    const second = makeBudget({ cap: 10, file, now: sunday });
    expect(second.used()).toBe(7);
    expect(second.take(3)).toBe(true);
    expect(second.left()).toBe(0);
    const log: JevRequest[] = [];
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget({ cap: 10, file, now: sunday }), transport: fakeJev(uniform, log) });
    await runMany({ games: 3, prefix: 'plt-113-week', jev, jevShare: 1 });
    expect(log).toEqual([]);
    expect(makeBudget({ cap: 10, file, now: nextMonday }).left()).toBe(10);
  });
});

describe('PLT-122: Jev problems are kept apart from real bugs', () => {
  it('a failed call is retried once; then Jev is off for the run, listed as a setup problem, and no game fails for it', async () => {
    let calls = 0;
    const flaky: Transport = async () => { calls++; throw new Error(`time-out talking to Jev with Bearer ${FAKE_KEY}`); };
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: flaky });
    const s = await runMany({ games: 10, prefix: 'plt-122', jev, jevShare: 1 });
    expect(calls).toBe(2);
    expect(s.failures).toEqual([]);
    const text = summaryText(s);
    expect(text).toContain('Jev problems (setup, not app bugs, PLT-122):');
    expect(text).not.toContain(FAKE_KEY);
  });

  it('one failure followed by an answer still uses Jev', async () => {
    let calls = 0;
    const once: Transport = async (b, k) => { calls++; if (calls === 1) throw new Error('blip'); return fakeJev(uniform)(b, k); };
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: once });
    const s = await runMany({ games: 5, prefix: 'plt-122b', jev, jevShare: 1 });
    expect(s.decisionsBy.jev).toBeGreaterThan(0);
  });
});

describe('PLT-123: Jev personas play like real guests, but never decide', () => {
  it('slow grandparent, over-eager child and distracted guest choose only offered moves; the summary reports what they did', async () => {
    const byPersona = (keys: string[], q: any) => {
      const who = String(q.instructions.question);
      const claims = keys.filter((k) => k !== 'stay-quiet');
      if (who.includes('slow grandparent')) return Object.fromEntries(keys.map((k) => [k, String(q.criteria[k]).includes('not complete') ? 0 : k === 'stay-quiet' ? 0.6 : 0.4]));
      if (who.includes('over-eager child')) return Object.fromEntries(claims.map((k) => [k, 1]));
      return { 'stay-quiet': 1 };
    };
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: fakeJev(byPersona) });
    const s = await runMany({ games: 30, prefix: 'plt-123', jev, jevShare: 1 });
    expect(s.failures).toEqual([]);
    for (const p of ['slow-grandparent', 'over-eager-child', 'distracted-guest']) expect(Object.keys(s.personas)).toContain(p);
    expect(s.personas['over-eager-child']!.falseClaims).toBeGreaterThan(0);
    expect(s.personas['slow-grandparent']!.late).toBeGreaterThan(0);
    const text = summaryText(s);
    expect(text).toMatch(/- slow-grandparent: claims on time \d+, claims made late \d+/);
    expect(text).toMatch(/Decisions: \d+ scripted, \d+ random, [1-9]\d* by Jev/);
  });

  it('scripted and Jev players can be asked together; Jev players are asked in one call', async () => {
    const log: JevRequest[] = [];
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: fakeJev(uniform, log) });
    const s: Situation = { game: 'Tambola', actor: 'p1', persona: PERSONAS.prompt!, facts: ['f'], options: [
      { key: 'a', move: null, says: 'a', expects: 'accepted' }, { key: 'stay-quiet', move: null, says: 'q' },
    ] };
    const items: { situation: Situation; chooser: Chooser }[] = [
      { situation: s, chooser: { kind: 'jev', script: quietScript } },
      { situation: s, chooser: { kind: 'scripted', script: quietScript } },
      { situation: s, chooser: { kind: 'jev', script: quietScript } },
    ];
    const out = await decideAll(items, createRng('fan'), jev);
    expect(out.map((d) => d.by)).toEqual(['jev', 'scripted', 'jev']);
    expect(log.length).toBe(1);
    expect(Object.keys(log[0]!.questions).length).toBe(2);
    expect(jev.stats.decisions).toBe(2);
  });
});
