// Expected to fail (not built yet): tests marked `it.fails` wait for src/games/impostor (owner decision 2026-10-03).
// A marked test that starts passing turns red: then remove its `.fails` mark. What each test checks is unchanged.
// Impostor secrets and seeds (specs/impostor/07-secrets-and-seeds.md, C3): IMP-060 to IMP-064.
// The browser half (fresh seeds on the phone, test seeds honoured in preview builds, nothing secret on screen) is in
// tests/browser/impostor-privacy.spec.ts.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, HOST, replay, undo, type Rng } from '../../../src/engine';
import {
  CATEGORIES, DEFAULT_CHOICES, Evening, NAMES, P4, WORDS, pickImpostor, randomOutcome, readTestSeeds, seedList, wordById,
} from './helpers';

/**
 * A random evening on the engine: practice or not, redeals, every kind of outcome, undos, joins, leaves, choice
 * changes, "This word didn't work", sometimes ended. Returns the evening and, for every deal, its word and impostor.
 */
function randomEvening(seed: string, rng: Rng, rounds = 1 + rng.int(12)) {
  const n = 3 + rng.int(8);
  let players = NAMES.slice(0, n);
  const e = new Evening({ seed: `${seed}-word`, starterSeed: `${seed}-starter`, players, choices: { mode: rng.int(2) ? 'hard' : 'easy', score: rng.int(2) === 0 } });
  e.startDeal(rng.int(4) === 0);
  for (let r = 0; r < rounds; r++) {
    if (rng.int(6) === 0) { e.must({ type: 'seen' }); e.must({ type: 'dontKnow' }); }
    if (rng.int(8) === 0) e.must({ type: 'dealAgain' });
    const f = e.playRound(randomOutcome(rng));
    if (f.outcome.kind === 'caught' && rng.int(3) === 0) {
      const last = e.match.records.at(-1)!;
      const u = undo(e.rules, e.match, last.seq, { by: HOST, now: e.at + 1 });
      if (u.ok) { e.match = u.value; e.must({ type: 'verdict', right: rng.int(2) === 0 }); }
    }
    if (rng.int(5) === 0) e.must({ type: 'wordDidntWork', blocked: true });
    const roll = rng.int(8);
    if (roll === 0 && players.length < 12) { players = [...players, NAMES[12 + r % 8]!].filter((p, k, a) => a.indexOf(p) === k); e.must({ type: 'setPlayers', players }); }
    if (roll === 1 && players.length > 3) { players = players.slice(1); e.must({ type: 'setPlayers', players }); }
    if (roll === 2) e.must({ type: 'setChoices', choices: { ...DEFAULT_CHOICES, mode: rng.int(2) ? 'hard' : 'easy', score: rng.int(2) === 0 } });
    if (r < rounds - 1) e.nextRound();
  }
  if (rng.int(2) === 0) e.must({ type: 'endEvening' });
  return e;
}

describe('IMP-060: the word and the impostor come from their own seed', () => {
  it.fails('property (500 seeded evenings with random moves): replaying the saved setup and records gives exactly the same game; tolerance 0', () => {
    for (let i = 0; i < 500; i++) {
      const e = randomEvening(`imp060-${i}`, createRng(`imp060-${i}`));
      const r = replay(e.rules, e.match.setup, e.match.records);
      expect(r.ok, `evening imp060-${i}: ${!r.ok ? r.reason : ''}`).toBe(true);
      if (!r.ok) continue;
      expect(r.value.state).toEqual(e.state);
      const viewers = [{ kind: 'host' }, { kind: 'room' }, ...e.players().map((p) => ({ kind: 'player', playerId: p }))];
      for (const v of viewers) expect(e.rules.view(r.value.state, v)).toEqual(e.rules.view(e.state, v));
    }
  });

  it.fails('the same moves with the same seeds give the same words, impostors and starters, deal by deal', () => {
    const run = (word: string, starter: string) => {
      const e = new Evening({ seed: word, starterSeed: starter });
      e.startDeal();
      const out: [string, string, string][] = [];
      for (let r = 0; r < 8; r++) {
        const f = e.playRound({ kind: 'escaped' });
        out.push([f.wordId, f.impostor, f.starter]);
        e.nextRound();
      }
      return out;
    };
    expect(run('w-1', 's-1')).toEqual(run('w-1', 's-1'));
  });

  it.fails('the starter seed draws only starters: another starter seed changes no word or impostor', () => {
    for (const s of seedList(20, 'sep')) {
      const words = (starter: string) => {
        const e = new Evening({ seed: s, starterSeed: starter });
        e.startDeal();
        const out: [string, string][] = [];
        for (let r = 0; r < 6; r++) { const f = e.playRound({ kind: 'caught', right: false }); out.push([f.wordId, f.impostor]); e.nextRound(); }
        return out;
      };
      expect(words('starter-A')).toEqual(words('starter-B'));
    }
  });

  it.fails('the word seed draws only words and impostors: in Easy, another word seed changes no starter', () => {
    for (const s of seedList(20, 'sep2')) {
      const starters = (word: string) => {
        const e = new Evening({ seed: word, starterSeed: s });
        e.startDeal();
        const out: string[] = [];
        for (let r = 0; r < 6; r++) { out.push(e.playRound({ kind: 'escaped' }).starter); e.nextRound(); }
        return out;
      };
      expect(starters('word-A')).toEqual(starters('word-B'));
    }
  });

  it.fails('different word seeds give different evenings', () => {
    const first = new Set<string>();
    for (const s of seedList(50, 'diff')) { const e = new Evening({ seed: s }); e.startDeal(); first.add(`${e.wordId()}:${e.impostor()}`); }
    expect(first.size).toBeGreaterThan(25);
  });

  it.fails('"Change how we play" and later rounds make no new seeds: the setup never changes', () => {
    const e = new Evening({ seed: 'fixed' });
    const setup = e.match.setup;
    e.startDeal().playRound({ kind: 'escaped' });
    e.must({ type: 'setChoices', choices: { ...DEFAULT_CHOICES, mode: 'hard' } }).nextRound();
    expect(e.match.setup).toBe(setup);
    expect(e.match.setup.seeds).toEqual({ word: 'fixed', starter: 'starter-of-fixed' });
  });
});

describe('IMP-061: impostor choice is fair, with no 3 in a row', () => {
  const shares = (recent: string[], N = 10_000) => {
    const count: Record<string, number> = {};
    for (let i = 0; i < N; i++) { const p = pickImpostor(P4, recent, createRng(`imp061-${recent.join('.')}-${i}`)); count[p] = (count[p] ?? 0) + 1; }
    return Object.fromEntries(P4.map((p) => [p, (count[p] ?? 0) / N]));
  };

  it.fails('property 1 (10,000 seeds, 4 players, no history): each player\'s share is 25% ± 1.5%', () => {
    const s = shares([]);
    for (const p of P4) expect(Math.abs(s[p]! - 0.25), `${p}: ${s[p]}`).toBeLessThanOrEqual(0.015);
  });

  it.fails('property 2 (10,000 seeds, 4 players, recent impostors [Riya, Arjun]): Arjun\'s share is 25% ± 1.5%', () => {
    const s = shares(['Riya', 'Arjun']);
    expect(Math.abs(s.Arjun! - 0.25), `Arjun: ${s.Arjun}`).toBeLessThanOrEqual(0.015);
  });

  it.fails('property 3 (10,000 seeds, 4 players, recent impostors [Arjun, Arjun]): Arjun 0%; each other player 33.3% ± 1.5%', () => {
    const s = shares(['Arjun', 'Arjun']);
    expect(s.Arjun).toBe(0);
    for (const p of ['Riya', 'Meena', 'Kabir']) expect(Math.abs(s[p]! - 1 / 3), `${p}: ${s[p]}`).toBeLessThanOrEqual(0.015);
  });

  it.fails('only the last two completed rounds count: [Arjun, Arjun, Riya] rules nobody out', () => {
    const s = shares(['Arjun', 'Arjun', 'Riya'], 4000);
    for (const p of P4) expect(s[p]!).toBeGreaterThan(0.2);
  });

  it.fails('a redeal draws again by the same rule: after two rounds with Arjun as impostor, no deal of round 3 makes him impostor', () => {
    for (const s of seedList(40, 'streak')) {
      const e = new Evening({ seed: s, testDeals: [{ impostor: 'Arjun' }, { impostor: 'Arjun' }] });
      e.startDeal();
      e.playRound({ kind: 'escaped' }); e.nextRound();
      e.playRound({ kind: 'caught', right: true }); e.nextRound();
      for (let k = 0; k < 6; k++) {
        expect(e.impostor(), `${s}, deal ${k} of round 3`).not.toBe('Arjun');
        e.must({ type: k % 2 ? 'dealAgain' : 'dontKnow' });
      }
    }
  });

  it.fails('a redeal may draw the same player again', () => {
    let same = 0;
    for (const s of seedList(100, 'again')) {
      const e = new Evening({ seed: s });
      e.startDeal();
      const imp = e.impostor();
      e.must({ type: 'dealAgain' });
      if (e.impostor() === imp) same++;
    }
    expect(same).toBeGreaterThan(0);
  });

  it.fails('property 4 (1,000 seeded evenings of 30 rounds, 3 to 12 players): nobody is impostor in 3 completed rounds running; tolerance 0', () => {
    for (let i = 0; i < 1000; i++) {
      const rng = createRng(`imp061-p4-${i}`);
      const players = NAMES.slice(0, 3 + rng.int(10));
      const e = new Evening({ seed: `imp061-p4-seed-${i}`, players, choices: { words: 'grownups' } });
      e.startDeal(rng.int(4) === 0);
      const completed: string[] = [];
      for (let r = 0; r < 30; r++) {
        if (rng.int(10) === 0) e.must({ type: 'dealAgain' });
        completed.push(e.playRound(randomOutcome(rng)).impostor);
        const n = completed.length;
        if (n >= 3) expect(completed[n - 1] === completed[n - 2] && completed[n - 2] === completed[n - 3], `evening imp061-p4-${i}: ${completed.slice(-3)}`).toBe(false);
        e.nextRound();
      }
    }
  });
});

describe('IMP-062: the host sees nothing secret', () => {
  /** Everything secret about a round: the word, its names and other names, its hint and its id. */
  const secretsOf = (id: string) => {
    const w = wordById(id);
    return [id, w.word, ...w.word.split(' / '), ...(w.other_names ? w.other_names.split(' / ') : []), w.hint];
  };

  it.fails('before the reveal, the host and room views hold only { round, practice, players, starter }: no word, hint, other name or impostor', () => {
    for (let i = 0; i < 200; i++) {
      const rng = createRng(`imp062-${i}`);
      const e = new Evening({ seed: `imp062-${i}`, choices: { mode: rng.int(2) ? 'hard' : 'easy' } });
      e.startDeal(rng.int(3) === 0);
      const steps: (() => void)[] = [
        ...P4.map(() => () => { e.must({ type: 'seen' }); }),
        () => { e.must({ type: 'startTalk' }); },
        () => { e.must({ type: 'voteNow' }); },
        () => { e.must({ type: 'tie', players: P4.slice(0, 2) }); },
      ];
      const check = (where: string) => {
        const id = e.wordId();
        const imp = e.impostor();
        for (const v of [e.host(), e.room()]) {
          expect(Object.keys(v).sort(), where).toEqual(['players', 'practice', 'round', 'starter']);
          const text = JSON.stringify({ ...v, players: undefined, starter: undefined });
          for (const s of secretsOf(id)) expect(text.toLowerCase(), `${where}: "${s}"`).not.toContain(s.toLowerCase());
          expect(text, where).not.toContain(imp);
        }
      };
      check('start of the deal');
      for (const [k, step] of steps.entries()) { step(); check(`step ${k}`); }
    }
  });

  it.fails('player views never show another player\'s secret: the impostor\'s view has no word id', () => {
    for (const s of seedList(100, 'pv')) {
      const e = new Evening({ seed: s });
      e.startDeal();
      expect(JSON.stringify(e.player(e.impostor()))).not.toContain(e.wordId());
    }
  });
});

describe('IMP-064: test seeds work only in development and preview builds (readTestSeeds)', () => {
  const valid = { word: 'w-seed', starter: 's-seed', deals: [{ wordId: 'IMPW-004', impostor: 'Arjun', starter: 'Meena' }] };

  it.fails('the release build ignores the key: readTestSeeds(raw, true) is null for every raw', () => {
    expect(readTestSeeds(JSON.stringify(valid), true)).toBeNull();
    expect(readTestSeeds(null, true)).toBeNull();
    fc.assert(fc.property(fc.oneof(fc.string(), fc.json()), (raw) => { expect(readTestSeeds(raw, true)).toBeNull(); }), { numRuns: 500 });
  });

  it.fails('in other builds: a valid key is read exactly as given', () => {
    expect(readTestSeeds(JSON.stringify(valid), false)).toEqual(valid);
    expect(readTestSeeds(JSON.stringify({ word: 'only-word' }), false)).toEqual({ word: 'only-word' });
    expect(readTestSeeds(JSON.stringify({ deals: [{ impostor: 'Riya' }, {}] }), false)).toEqual({ deals: [{ impostor: 'Riya' }, {}] });
  });

  it.fails('null when the key is missing, not JSON, or not of that shape', () => {
    for (const raw of [null, '', 'not json', '{', '[]', '42', '"word"', 'null',
      JSON.stringify({ word: 5 }), JSON.stringify({ starter: true }), JSON.stringify({ deals: 'x' }),
      JSON.stringify({ deals: [{ impostor: 7 }] }), JSON.stringify({ deals: [{ wordId: ['IMPW-004'] }] }), JSON.stringify({ deals: [5] })]) {
      expect(readTestSeeds(raw, false), String(raw)).toBeNull();
    }
  });

  it.fails('a forced deal sets that round\'s word, impostor and starter; missing fields and later rounds fall back to the seeded pick', () => {
    const e = new Evening({ seed: 'forced', testDeals: [{ wordId: 'IMPW-004', impostor: 'Arjun', starter: 'Meena' }, { impostor: 'Kabir' }] });
    e.startDeal();
    expect(e.wordId()).toBe('IMPW-004');
    expect(e.impostor()).toBe('Arjun');
    e.dealAll();
    expect(e.host().starter).toBe('Meena');
    e.toVote().must({ type: 'reveal', player: 'Riya' }).nextRound();
    expect(e.impostor()).toBe('Kabir');
    // The second round's word is the seeded pick (a word of the list, not the first round's).
    expect(WORDS.map((w) => w.id)).toContain(e.wordId());
    expect(e.wordId()).not.toBe('IMPW-004');
  });

  it.fails('a redeal takes the next forced deal', () => {
    const e = new Evening({ seed: 'forced2', testDeals: [{ wordId: 'IMPW-004' }, { wordId: 'IMPW-005', impostor: 'Meena' }] });
    e.startDeal();
    expect(e.wordId()).toBe('IMPW-004');
    e.must({ type: 'dontKnow' });
    expect(e.wordId()).toBe('IMPW-005');
    expect(e.impostor()).toBe('Meena');
  });

  it.fails('forced deals are part of the setup, so replay gives the same game', () => {
    const e = new Evening({ seed: 'forced3', testDeals: [{ wordId: 'IMPW-007', impostor: 'Riya', starter: 'Kabir' }] });
    e.startDeal().playRound({ kind: 'caught', right: true });
    const r = replay(e.rules, e.match.setup, e.match.records);
    expect(r.ok && r.value.state).toEqual(e.state);
    expect(CATEGORIES).toContain(wordById('IMPW-007').category);
  });
});
