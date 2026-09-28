// Calling numbers: specs/tambola/02-calling.md, 05-secrets-and-seeds.md (TAM-052), 07 (TAM-071), 09 (TAM-119).
import { describe, expect, it } from 'vitest';
import { HOST, play, startMatch } from '../../../src/engine';
import { Game, numberArrays, rules, setupInput, T0, uncalled } from './helpers';

describe('Tambola module', () => {
  it('exports its rules from src/games/tambola/index.ts (see tests/games/tambola/README.md)', () => {
    expect(rules, 'tambolaRules is not exported yet').toBeDefined();
    expect(rules.id).toBe('tambola');
  });
});

describe('TAM-010: the host draws the next number', () => {
  it('draws one new number from 1 to 90 and shows it with a rhyme', () => {
    const g = new Game();
    expect(g.host.current).toBeNull();
    g.call();
    const { current, called } = g.host;
    expect(called).toHaveLength(1);
    expect(current.number).toBe(called[0]);
    expect(current.number).toBeGreaterThanOrEqual(1);
    expect(current.number).toBeLessThanOrEqual(90);
    expect(current.rhyme?.n).toBe(current.number);
  });

  it('lists "call" as a legal move for the host while numbers remain', () => {
    const g = new Game();
    expect(rules.legalMoves(g.match.state, HOST)).toContainEqual({ type: 'call' });
  });
});

describe('TAM-011: no number is called twice', () => {
  it('90 calls give 90 different numbers, for many seeds', () => {
    for (let s = 0; s < 200; s++) {
      const g = new Game({ seed: `no-repeat-${s}` });
      g.call(90);
      expect(new Set(g.called).size).toBe(90);
      expect(rules.invariants(g.match.state)).toEqual([]);
    }
  });
});

describe('TAM-012: at most 90 numbers are called', () => {
  it('refuses a 91st call with "All 90 numbers called", and nothing changes', () => {
    const g = new Game();
    g.call(90);
    expect(g.host.allCalled).toBe(true);
    const before = g.match;
    const r = g.try({ type: 'call' });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('All 90 numbers called');
    expect(g.match).toBe(before);
    expect(rules.legalMoves(g.match.state, HOST)).not.toContainEqual({ type: 'call' });
  });
});

describe('TAM-013: every number from 1 to 90 can come up, fairly', () => {
  it('each number comes first in about 1 game in 90 over 90,000 draw seeds (chi-square, 0.1% level)', () => {
    const GAMES = 90_000;
    const firsts = new Array<number>(91).fill(0);
    const setup = setupInput();
    for (let i = 0; i < GAMES; i++) {
      const s = { ...setup, gameId: `fair-${i}`, seeds: { draw: `fairness-${i}` } };
      const m = startMatch(rules, s, T0);
      const r = play(rules, m, { type: 'call' }, { by: HOST, at: T0 + 1000 });
      if (!r.ok) throw new Error(r.reason);
      firsts[(rules.view(r.value.state, { kind: 'host' }) as { called: number[] }).called[0]!]! += 1;
    }
    const expected = GAMES / 90;
    let chi2 = 0;
    for (let n = 1; n <= 90; n++) chi2 += (firsts[n]! - expected) ** 2 / expected;
    // Critical value of chi-square with 89 degrees of freedom at the 0.1% level.
    expect(chi2, `chi-square ${chi2.toFixed(1)}: the first number is not fair`).toBeLessThan(135.98);
  });

  it('every game played to the end draws all 90 numbers', () => {
    for (let s = 0; s < 500; s++) {
      const g = new Game({ seed: `all-90-${s}` });
      g.call(90);
      expect([...g.called].sort((a, b) => a - b)).toEqual(Array.from({ length: 90 }, (_, i) => i + 1));
    }
  });
});

describe('TAM-014: the same draw seed always gives the same order', () => {
  it('two games from one seed call the same numbers in the same order', () => {
    const a = new Game({ seed: 'same-seed' }).call(90);
    const b = new Game({ seed: 'same-seed' }).call(90);
    expect(b.called).toEqual(a.called);
  });

  it('different seeds give different orders', () => {
    const a = new Game({ seed: 'seed-a' }).call(90);
    const b = new Game({ seed: 'seed-b' }).call(90);
    expect(b.called).not.toEqual(a.called);
  });
});

describe('TAM-016: the host can see what has been called', () => {
  it('after 23 calls the host sees all 23, and the last 5 most recent first', () => {
    const g = new Game().call(23);
    const { called, lastCalls } = g.host;
    expect(called).toHaveLength(23);
    expect(lastCalls).toEqual(called.slice(-5).reverse());
  });

  it('before 5 calls, the last calls show what there is', () => {
    const g = new Game().call(2);
    expect(g.host.lastCalls).toEqual([...g.called].reverse());
  });
});

describe('TAM-107: the room sees the called number and the last 3 calls', () => {
  it('room view shows the current number and the last 3, most recent first', () => {
    const g = new Game().call(10);
    const room = g.room;
    expect(room.current.number).toBe(g.called[9]);
    expect(room.lastCalls).toEqual(g.called.slice(-3).reverse());
  });
});

describe('TAM-052: the draw seed never leaves the host phone', () => {
  const SEED = 'very-secret-draw-seed-7f3a';
  const viewers = [{ kind: 'room' } as const, { kind: 'player', playerId: 'p1' } as const];

  it('room and player views never contain the draw seed', () => {
    const g = new Game({ seed: SEED }).call(30);
    for (const v of viewers) expect(JSON.stringify(g.view(v))).not.toContain(SEED);
  });

  it('room and player views never contain a number that has not been called yet', () => {
    for (let s = 0; s < 20; s++) {
      const g = new Game({ seed: `leak-${s}` }).call(s * 4);
      const notYet = new Set(uncalled(g));
      for (const v of viewers) {
        for (const list of numberArrays(g.view(v))) {
          const leaked = list.filter((n) => notYet.has(n) && n >= 1 && n <= 90);
          expect(leaked, `${v.kind} view shows uncalled numbers`).toEqual([]);
        }
      }
    }
  });

  it('the room view is the same whatever the draw order, given the same calls so far', () => {
    // Two seeds whose first call is the same: the room must not be able to tell them apart,
    // except through the rhyme, which is also public.
    const first = new Game({ seed: 'twin-0' }).call().called[0];
    let twin: Game | undefined;
    for (let i = 1; i < 5000 && !twin; i++) {
      const g = new Game({ seed: `twin-${i}` }).call();
      if (g.called[0] === first) twin = g;
    }
    expect(twin).toBeDefined();
    const a = new Game({ seed: 'twin-0' }).call();
    const strip = (v: any) => JSON.stringify({ ...v, current: v.current && { number: v.current.number } });
    expect(strip(twin!.room)).toBe(strip(a.room));
  });
});

describe('TAM-119 and TAM-071: a call can be undone only within 5 seconds', () => {
  it('within 5 seconds, the number goes back and the previous number shows again', () => {
    const g = new Game().call(3);
    const before = g.called;
    g.call();
    const rec = g.lastRecordOf('call');
    const r = g.undo(rec.seq, rec.at + 4_999);
    expect(r.ok).toBe(true);
    expect(g.called).toEqual(before);
    expect(g.host.current.number).toBe(before[2]);
    expect(uncalled(g)).toHaveLength(87);
  });

  it('after 5 seconds, the call cannot be taken back (TAM-071)', () => {
    const g = new Game().call(3);
    const rec = g.lastRecordOf('call');
    const before = g.called;
    const r = g.undo(rec.seq, rec.at + 5_001);
    expect(r.ok).toBe(false);
    expect(g.called).toEqual(before);
  });

  it('only the latest call can be undone, even inside 5 seconds', () => {
    const g = new Game();
    g.do({ type: 'call' }, T0 + 1_000);
    g.do({ type: 'call' }, T0 + 2_000);
    const first = g.records[0]!;
    expect(g.undo(first.seq, T0 + 3_000).ok).toBe(false);
    expect(g.called).toHaveLength(2);
  });

  it('the first call of a game can be undone, leaving no number shown', () => {
    const g = new Game();
    g.do({ type: 'call' }, T0 + 1_000);
    expect(g.undo(g.records[0]!.seq, T0 + 2_000).ok).toBe(true);
    expect(g.called).toEqual([]);
    expect(g.host.current).toBeNull();
  });
});
