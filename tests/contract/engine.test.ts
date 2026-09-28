// The engine on its own, with a tiny made-up game: seeded randomness, the referee, undo, replay,
// saved games and money. These pass as soon as the engine exists (Phase 0).
// Scenarios: TAM-014 and TAM-073 (repeatable), TAM-072 (undo keeps later moves), PLT-001 (states),
// PLT-014 (old saved games open), PLT-021 (money records balance).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  canChangeStatus, createRng, deriveSeed, HOST, isReadOnly, moneyProblems, pick, play, readSavedGame, replay,
  SAVED_GAME_FORMAT, shuffle, startMatch, undo, type EngineEvent, type GameRules, type GameStatus,
} from '../../src/engine';

// A counting game: add 1 to 3; the game is over at 10; the count may never pass 10.
type CountMove = { type: 'add'; by: number };
interface CountState { total: number; secret: string }
const counting: GameRules<{ target: number }, CountState, CountMove, { total: number }> = {
  id: 'counting',
  setup: ({ seeds }) => ({ total: 0, secret: seeds['secret'] ?? '' }),
  legalMoves: (s) => (s.total >= 10 ? [] : [1, 2, 3].map((by) => ({ type: 'add' as const, by }))),
  apply: (s, m) => (m.by >= 1 && m.by <= 3 ? { ok: true, value: { ...s, total: s.total + m.by } } : { ok: false, reason: 'Add 1 to 3.' }),
  view: (s) => ({ total: s.total }),
  isOver: (s) => s.total >= 10,
  invariants: (s) => (s.total > 10 ? ['The count passed 10.'] : []),
  canUndo: (_s, { record, now }) => now - record.at <= 5000,
};
const setup = { gameId: 'g1', seeds: { secret: 's' }, config: { target: 10 } };

describe('Seeded randomness (TAM-014, TAM-073)', () => {
  it('the same seed gives the same sequence; different seeds differ', () => {
    const seq = (seed: string) => { const r = createRng(seed); return Array.from({ length: 50 }, () => r.int(90)); };
    expect(seq('a')).toEqual(seq('a'));
    expect(seq('a')).not.toEqual(seq('b'));
  });

  it('int() stays in range, for any seed and range', () => {
    fc.assert(fc.property(fc.string(), fc.integer({ min: 1, max: 1000 }), (seed, max) => {
      const r = createRng(seed);
      for (let i = 0; i < 20; i++) { const x = r.int(max); expect(x >= 0 && x < max && Number.isInteger(x)).toBe(true); }
    }));
  });

  it('shuffle keeps every item exactly once and leaves the input alone', () => {
    const items = Array.from({ length: 90 }, (_, i) => i + 1);
    const out = shuffle(items, createRng('shuffle'));
    expect([...out].sort((a, b) => a - b)).toEqual(items);
    expect(items[0]).toBe(1);
  });

  it('pick refuses an empty list; deriveSeed is repeatable and differs by purpose', () => {
    expect(() => pick([], createRng('x'))).toThrow();
    expect(deriveSeed('s', 'rhymes')).toBe(deriveSeed('s', 'rhymes'));
    expect(deriveSeed('s', 'rhymes')).not.toBe(deriveSeed('s', 'draw'));
  });
});

describe('The referee', () => {
  it('plays legal moves, numbers the records from 1, and keeps each move time', () => {
    let m = startMatch(counting, setup, 1000);
    for (const [i, at] of [2000, 3000].entries()) {
      const r = play(counting, m, { type: 'add', by: 2 }, { by: HOST, at });
      expect(r.ok).toBe(true);
      if (r.ok) m = r.value;
      expect(m.records[i]).toMatchObject({ v: 1, seq: i + 1, at, by: HOST });
    }
    expect(m.state.total).toBe(4);
  });

  it('refuses an illegal move, a move that breaks an invariant, a move back in time, and any move after the end', () => {
    let m = startMatch(counting, setup, 0);
    expect(play(counting, m, { type: 'add', by: 7 }, { by: HOST, at: 1 }).ok).toBe(false);
    for (let i = 0; i < 3; i++) { const r = play(counting, m, { type: 'add', by: 3 }, { by: HOST, at: 10 + i }); if (r.ok) m = r.value; }
    expect(play(counting, m, { type: 'add', by: 3 }, { by: HOST, at: 20 }).ok).toBe(false); // would pass 10
    expect(play(counting, m, { type: 'add', by: 1 }, { by: HOST, at: 5 }).ok).toBe(false); // earlier than the last move
    const r = play(counting, m, { type: 'add', by: 1 }, { by: HOST, at: 30 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(play(counting, r.value, { type: 'add', by: 1 }, { by: HOST, at: 40 }).ok).toBe(false);
  });

  it('announces game started, first action and game ended', () => {
    const events: EngineEvent['type'][] = [];
    const announce = (e: EngineEvent) => events.push(e.type);
    let m = startMatch(counting, setup, 0, announce);
    for (let i = 0; i < 4; i++) {
      const r = play(counting, m, { type: 'add', by: i < 3 ? 3 : 1 }, { by: HOST, at: i + 1 }, announce);
      if (r.ok) m = r.value;
    }
    expect(events).toEqual(['game-started', 'first-action', 'game-ended']);
  });

  it('undo replays without the move and keeps later moves (TAM-072); seq numbers are never reused', () => {
    let m = startMatch(counting, setup, 0);
    for (const [by, at] of [[1, 1000], [2, 2000], [3, 3000]] as const) {
      const r = play(counting, m, { type: 'add', by }, { by: HOST, at }); if (r.ok) m = r.value;
    }
    const u = undo(counting, m, 2, { by: HOST, now: 2500 });
    expect(u.ok).toBe(true);
    if (!u.ok) return;
    expect(u.value.records.map((r) => r.seq)).toEqual([1, 3]);
    expect(u.value.state.total).toBe(4);
    const next = play(counting, u.value, { type: 'add', by: 1 }, { by: HOST, at: 4000 });
    expect(next.ok && next.value.records[2]!.seq).toBe(4);
  });

  it('undo is refused when the game says no, or when there is no such move', () => {
    let m = startMatch(counting, setup, 0);
    const r = play(counting, m, { type: 'add', by: 1 }, { by: HOST, at: 1000 }); if (r.ok) m = r.value;
    expect(undo(counting, m, 1, { by: HOST, now: 7000 }).ok).toBe(false);
    expect(undo(counting, m, 9, { by: HOST, now: 1001 }).ok).toBe(false);
  });

  it('replay gives the same state for any sequence of moves (TAM-073), and refuses unknown record formats', () => {
    fc.assert(fc.property(fc.array(fc.integer({ min: 1, max: 3 }), { maxLength: 8 }), (adds) => {
      let m = startMatch(counting, setup, 0);
      adds.forEach((by, i) => { const r = play(counting, m, { type: 'add', by }, { by: HOST, at: i + 1 }); if (r.ok) m = r.value; });
      const again = replay(counting, setup, m.records);
      expect(again.ok && again.value.state).toEqual(m.state);
    }));
    const bad = [{ v: 2, seq: 1, at: 1, by: HOST, move: { type: 'add', by: 1 } }] as never;
    expect(replay(counting, setup, bad).ok).toBe(false);
  });
});

describe('PLT-001: a game moves through clear states', () => {
  const ALL: GameStatus[] = ['setup', 'in-progress', 'paused', 'ended', 'abandoned'];
  it('only In progress and Paused can change; Ended and Abandoned are read-only', () => {
    expect(canChangeStatus('setup', 'in-progress')).toBe(true);
    expect(canChangeStatus('in-progress', 'paused')).toBe(true);
    expect(canChangeStatus('paused', 'in-progress')).toBe(true);
    expect(canChangeStatus('in-progress', 'ended')).toBe(true);
    expect(canChangeStatus('paused', 'abandoned')).toBe(true);
    for (const to of ALL) {
      expect(canChangeStatus('ended', to)).toBe(false);
      expect(canChangeStatus('abandoned', to)).toBe(false);
    }
    expect(ALL.filter(isReadOnly)).toEqual(['ended', 'abandoned']);
  });
});

describe('PLT-014: saved games carry a format version, and old ones still open', () => {
  const v1 = {
    format: 1, gameType: 'counting', id: 'g1', createdAt: 1, updatedAt: 2, status: 'paused', setup,
    records: [{ v: 1, seq: 1, at: 1, by: HOST, move: { type: 'add', by: 2 } }],
  };
  it('a format-1 saved game reads and replays', () => {
    expect(SAVED_GAME_FORMAT).toBeGreaterThanOrEqual(1);
    const r = readSavedGame(JSON.parse(JSON.stringify(v1)));
    expect(r.ok).toBe(true);
    if (r.ok) expect(replay(counting, r.game.setup as typeof setup, r.game.records as never).ok).toBe(true);
  });

  it('a damaged or unknown saved game gives a reason instead of crashing', () => {
    for (const raw of [null, 'x', {}, { ...v1, format: 999 }, { ...v1, records: 'no' }, { ...v1, status: 'lost' }]) {
      const r = readSavedGame(raw);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('PLT-021: money records balance', () => {
  it('balanced records have no problems; unbalanced or negative ones do', () => {
    const people = [
      { personId: 'a', name: 'Asha', paid: 100, won: 30 },
      { personId: 'b', name: 'Bala', paid: 50, won: 120 },
    ];
    expect(moneyProblems({ currency: 'INR', people })).toEqual([]);
    expect(moneyProblems({ currency: 'INR', people: [{ ...people[0]!, won: 31 }, people[1]!] })).not.toEqual([]);
    expect(moneyProblems({ currency: 'INR', people: [{ personId: 'a', name: 'A', paid: -1, won: -1 }] })).not.toEqual([]);
    expect(moneyProblems({ currency: 'INR', people: [{ personId: 'a', name: 'A', paid: 1.5, won: 1.5 }] })).not.toEqual([]);
  });
});
