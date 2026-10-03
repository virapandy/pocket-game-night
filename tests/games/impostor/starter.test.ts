// Who starts the clues (specs/impostor/03-clues-and-talk.md): IMP-020 and IMP-021.
import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/engine';
import { Evening, NAMES, P4, P5, pickStarter, randomOutcome, seedList } from './helpers';

describe('IMP-020: who starts', () => {
  it('in Hard mode the starter is never the round\'s impostor; in Easy mode the impostor may start', () => {
    let impostorStartedEasy = 0;
    for (const s of seedList(400, 'who')) {
      for (const mode of ['easy', 'hard'] as const) {
        const e = new Evening({ seed: s, players: P5, choices: { mode } });
        e.startDeal().dealAll();
        const starter = e.host().starter;
        expect(P5).toContain(starter);
        if (mode === 'hard') expect(starter, `${s}: Hard starter is the impostor`).not.toBe(e.impostor());
        else if (starter === e.impostor()) impostorStartedEasy++;
      }
    }
    expect(impostorStartedEasy, 'in Easy the impostor starts some rounds').toBeGreaterThan(0);
  });

  it('the host and room views name the starter once picked, and nothing about the impostor or the word', () => {
    const e = new Evening({ seed: 'views', players: P5 });
    e.startDeal().dealAll();
    for (const v of [e.host(), e.room()]) {
      expect(Object.keys(v).sort()).toEqual(['players', 'practice', 'round', 'starter']);
      expect(P5).toContain(v.starter);
    }
  });
});

describe('IMP-021: the starter moves round, without repeats', () => {
  it('pickStarter picks among players not started this cycle and not skipped, uniformly; newCycle false', () => {
    const count: Record<string, number> = {};
    const N = 12_000;
    for (let i = 0; i < N; i++) {
      const r = pickStarter(P5, ['Riya', 'Meena'], 'Zoya', createRng(`ps-${i}`));
      expect(r.newCycle).toBe(false);
      count[r.starter] = (count[r.starter] ?? 0) + 1;
    }
    expect(Object.keys(count).sort()).toEqual(['Arjun', 'Kabir']);
    for (const p of ['Arjun', 'Kabir']) expect(Math.abs(count[p]! / N - 0.5)).toBeLessThanOrEqual(0.02);
  });

  it('example (Hard, 4 players): Riya, Arjun and Meena have started and Kabir is the impostor, so a new cycle starts and each of the three has one third', () => {
    const count: Record<string, number> = {};
    const N = 12_000;
    for (let i = 0; i < N; i++) {
      const r = pickStarter(P4, ['Riya', 'Arjun', 'Meena'], 'Kabir', createRng(`ex-${i}`));
      expect(r.newCycle).toBe(true);
      count[r.starter] = (count[r.starter] ?? 0) + 1;
    }
    expect(count.Kabir ?? 0).toBe(0);
    for (const p of ['Riya', 'Arjun', 'Meena']) expect(Math.abs(count[p]! / N - 1 / 3), p).toBeLessThanOrEqual(0.02);
  });

  it('when everyone has started (Easy, no skip), a new cycle starts and anyone may start', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const r = pickStarter(P4, P4, null, createRng(`all-${i}`));
      expect(r.newCycle).toBe(true);
      seen.add(r.starter);
    }
    expect([...seen].sort()).toEqual([...P4].sort());
  });

  it('the same seed gives the same starter', () => {
    for (const s of seedList(30, 'same')) {
      expect(pickStarter(P5, ['Arjun'], null, createRng(s))).toEqual(pickStarter(P5, ['Arjun'], null, createRng(s)));
    }
  });

  // Forced starters (Test hooks item 3) set the first rounds; the next starter must then follow the cycle.
  const forced = (starters: string[]) => starters.map((starter) => ({ starter }));

  it('after Riya, Arjun and Meena started, the next starter is Kabir (Easy, 4 players)', () => {
    for (const s of seedList(20, 'kabir')) {
      const e = new Evening({ seed: s, testDeals: forced(['Riya', 'Arjun', 'Meena']) });
      e.startDeal();
      for (let r = 0; r < 3; r++) { e.playRound({ kind: 'escaped' }); e.nextRound(); }
      e.dealAll();
      expect(e.host().starter).toBe('Kabir');
    }
  });

  it('the practice round counts for the cycle', () => {
    for (const s of seedList(20, 'practice')) {
      const e = new Evening({ seed: s, testDeals: forced(['Riya', 'Arjun', 'Meena']) });
      e.startDeal(true);
      for (let r = 0; r < 3; r++) { e.playRound({ kind: 'escaped' }); e.nextRound(); }
      e.dealAll();
      expect(e.host().starter).toBe('Kabir');
    }
  });

  it('a round dealt again after its clues screen showed still counts; one dealt again before it does not', () => {
    for (const s of seedList(20, 'redeal')) {
      // Riya and Arjun start rounds 1 and 2; round 3's clues show with Meena, then "Deal again": Meena counted.
      const e = new Evening({ seed: s, testDeals: forced(['Riya', 'Arjun', 'Meena']) });
      e.startDeal();
      for (let r = 0; r < 2; r++) { e.playRound({ kind: 'escaped' }); e.nextRound(); }
      e.dealAll();
      expect(e.host().starter).toBe('Meena');
      e.must({ type: 'dealAgain' });
      e.dealAll();
      expect(e.host().starter).toBe('Kabir');
    }
    for (const s of seedList(20, 'early')) {
      // Rounds 1 to 3 started by Riya, Arjun, Meena; round 4 dealt again during the deal: Kabir has still not started.
      const e = new Evening({ seed: s, testDeals: forced(['Riya', 'Arjun', 'Meena']) });
      e.startDeal();
      for (let r = 0; r < 3; r++) { e.playRound({ kind: 'escaped' }); e.nextRound(); }
      e.must({ type: 'seen' }).must({ type: 'dealAgain' });
      e.dealAll();
      expect(e.host().starter).toBe('Kabir');
    }
  });

  it('a removed player leaves the cycle; a player who joins enters it as not yet started', () => {
    for (const s of seedList(20, 'join')) {
      const e = new Evening({ seed: s, testDeals: forced(['Riya', 'Arjun', 'Meena']) });
      e.startDeal();
      for (let r = 0; r < 3; r++) {
        if (r > 0) e.nextRound();
        e.playRound({ kind: 'escaped' });
      }
      e.must({ type: 'setPlayers', players: [...P4, 'Zoya'] });
      e.nextRound().dealAll();
      expect(['Kabir', 'Zoya']).toContain(e.host().starter);
    }
    const starters = new Set<string>();
    for (const s of seedList(60, 'leave')) {
      const e = new Evening({ seed: s, testDeals: forced(['Riya', 'Arjun', 'Meena']) });
      e.startDeal();
      for (let r = 0; r < 3; r++) {
        if (r > 0) e.nextRound();
        e.playRound({ kind: 'escaped' });
      }
      // Kabir leaves: everyone left has started, so a new cycle starts among the three.
      e.must({ type: 'setPlayers', players: ['Riya', 'Arjun', 'Meena'] });
      e.nextRound().dealAll();
      starters.add(e.host().starter);
    }
    expect([...starters].sort()).toEqual(['Arjun', 'Meena', 'Riya']);
  });

  it('property (1,000 seeded evenings of 20 rounds, 3 to 12 players, Easy and Hard): within one cycle nobody starts twice; in Hard the starter is never the impostor; tolerance 0', () => {
    for (let i = 0; i < 1000; i++) {
      const rng = createRng(`imp021-${i}`);
      const n = 3 + rng.int(10);
      const players = NAMES.slice(0, n);
      const mode = i % 2 ? 'hard' as const : 'easy' as const;
      const e = new Evening({ seed: `imp021-seed-${i}`, players, choices: { mode } });
      e.startDeal(rng.int(4) === 0);
      let started = new Set<string>();
      for (let r = 0; r < 20; r++) {
        if (r > 0) e.nextRound();
        e.dealAll();
        const starter: string = e.host().starter;
        const impostor = e.impostor();
        if (mode === 'hard') expect(starter, `evening imp021-${i} round ${r}`).not.toBe(impostor);
        if (started.has(starter)) {
          // Only allowed as the first pick of a new cycle: nobody qualified.
          const qualified = players.filter((p) => !started.has(p) && !(mode === 'hard' && p === impostor));
          expect(qualified, `evening imp021-${i} round ${r}: ${starter} started twice in one cycle`).toEqual([]);
          started = new Set([starter]);
        } else started.add(starter);
        e.toVote();
        const o = randomOutcome(rng);
        if (o.kind === 'caught') e.must({ type: 'reveal', player: impostor }).must({ type: 'showWord' }).must({ type: 'verdict', right: o.right });
        else e.must({ type: 'reveal', player: players.find((p) => p !== impostor)! });
      }
    }
  });
});
