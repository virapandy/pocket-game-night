// Impostor round 5 (scenarios v3.8, owner decision I26, 4 October 2026): people arriving and leaving mid-round.
// IMP-078 (someone has to leave: `leaveAfterRound`, `dealAgainWithout`; fewer than 3; test seeds that don't fit),
// IMP-079 (someone arrives: `setPlayers` mid-round only adds), Test hooks items 1 and 3 (v3.8: every new deal deals the
// current list; pending leavers are dealt in until a round reaches its result; an entry naming someone who is not in
// that round is ignored as a whole).
// Written before the build (C3, tests first): the tests of what is not built yet are expected to fail (`it.fails`)
// until the C3 lane is on main; then the tester removes the marks. The refusals (a mid-round removal by setPlayers; a
// leaver with 3 players) already hold and stay unmarked: they must keep holding once the moves exist.
import { describe, expect, it } from 'vitest';
import { HOST } from '../../../src/engine';
import { Evening, P4, P5, need, randomOutcome, seedList, seeded } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
const totals = (e: Evening): Record<string, number> => need<any>('eveningTotals')({ setup: e.match.setup, records: e.match.records });
const lastMove = (e: Evening): any => e.match.records.at(-1)!.move;

/** The four moments of a round when the Players sheet can be opened: deal (after 2 "Done"), clues, talk, picker. */
type Moment = 'deal' | 'clues' | 'talk' | 'picker';
const MOMENTS: Moment[] = ['deal', 'clues', 'talk', 'picker'];
function toMoment(e: Evening, m: Moment) {
  if (m === 'deal') { e.must({ type: 'seen' }).must({ type: 'seen' }); return e; }
  e.dealAll();
  if (m === 'talk' || m === 'picker') e.must({ type: 'startTalk' });
  if (m === 'picker') e.must({ type: 'voteNow' });
  return e;
}
/** From any moment, finish the round with the impostor caught (no guess). */
function finishCaught(e: Evening) {
  // Deal the rest, talk, vote, reveal the impostor (whichever step the round is at).
  for (let i = 0; i < 40 && e.try({ type: 'seen' }); i++) { /* everyone taps Done */ }
  e.try({ type: 'startTalk' });
  e.try({ type: 'voteNow' });
  e.must({ type: 'reveal', player: e.impostor() });
  return e;
}

describe('IMP-079: someone arrives mid-round', () => {
  for (const m of MOMENTS) {
    it.fails(`at the ${m}: setPlayers with Dev at the end is accepted; Dev is not in the deal in progress, nor on its picker`, () => {
      const e = new Evening({ players: P5, seed: `join-${m}`, choices: { lastGuess: false } });
      e.startDeal();
      toMoment(e, m);
      const before = e.players();
      expect(e.try({ type: 'setPlayers', players: [...P5, 'Dev'] }), 'adding mid-round is accepted').toBe(true);
      expect(lastMove(e)).toEqual({ type: 'setPlayers', players: [...P5, 'Dev'] });
      expect(e.players(), 'this round\'s dealt players are unchanged').toEqual(before);
      expect(e.player('Dev')?.role, 'Dev has no role in this deal').toBeUndefined();
      if (m === 'picker') {
        expect(e.refuses({ type: 'reveal', player: 'Dev' }), 'Dev is not on this round\'s picker').toBe(true);
        expect(e.refuses({ type: 'tie', players: ['Dev', 'Riya'] })).toBe(true);
      }
    });
  }

  it.fails('Dev is dealt in by the next round, at the end of the seat order, with 0 points; no points from the round he joined in', () => {
    const e = new Evening({ players: P5, seed: 'join-next', choices: { score: true, lastGuess: false } });
    e.startDeal();
    toMoment(e, 'clues');
    e.must({ type: 'setPlayers', players: [...P5, 'Dev'] });
    finishCaught(e);
    expect(totals(e).Dev ?? 0).toBe(0);
    e.nextRound();
    expect(e.players()).toEqual([...P5, 'Dev']);
    expect(['impostor', 'crew']).toContain(e.player('Dev')?.role);
  });

  for (const redeal of ['dontKnow', 'dealAgain', 'dealAgainWithout'] as const) {
    it.fails(`a redeal of this round (${redeal}) deals Dev in`, () => {
      const e = new Evening({ players: P5, seed: `join-redeal-${redeal}`, choices: { lastGuess: false } });
      e.startDeal();
      toMoment(e, redeal === 'dontKnow' ? 'deal' : 'clues');
      e.must({ type: 'setPlayers', players: [...P5, 'Dev'] });
      if (redeal === 'dontKnow') e.must({ type: 'dontKnow' });
      else if (redeal === 'dealAgain') e.must({ type: 'dealAgain' });
      else e.must({ type: 'dealAgainWithout', player: 'Kabir' });
      const want = redeal === 'dealAgainWithout' ? ['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev'] : [...P5, 'Dev'];
      expect(e.players()).toEqual(want);
      expect(['impostor', 'crew']).toContain(e.player('Dev')?.role);
    });
  }

  for (const m of MOMENTS) {
    it(`at the ${m}: a setPlayers that removes someone is refused (a mid-round removal by itself is not a legal move)`, () => {
      const e = new Evening({ players: P5, seed: `remove-${m}` });
      e.startDeal();
      toMoment(e, m);
      expect(e.refuses({ type: 'setPlayers', players: ['Riya', 'Arjun', 'Meena', 'Zoya'] })).toBe(true);
      expect(e.refuses({ type: 'setPlayers', players: ['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev'] }), 'adding Dev does not make removing Kabir legal').toBe(true);
    });
  }
});

describe('IMP-078: "Finish this round first" (leaveAfterRound)', () => {
  for (const m of MOMENTS) {
    it.fails(`at the ${m}: leaveAfterRound Kabir is recorded; Kabir stays in this round, is removed at its result with his points kept`, () => {
      const e = new Evening({ players: P5, seed: `leave-${m}`, choices: { score: true, lastGuess: false } });
      e.startDeal();
      toMoment(e, m);
      const dealt = e.players();
      expect(e.try({ type: 'leaveAfterRound', player: 'Kabir' })).toBe(true);
      expect(lastMove(e)).toEqual({ type: 'leaveAfterRound', player: 'Kabir' });
      expect(e.players(), 'Kabir stays in this round').toEqual(dealt);
      expect(['impostor', 'crew']).toContain(e.player('Kabir')?.role);
      finishCaught(e);
      expect(e.players(), 'removed at the result').toEqual(['Riya', 'Arjun', 'Meena', 'Zoya']);
      expect(Object.keys(totals(e)), 'his points are kept').toContain('Kabir');
      e.nextRound();
      expect(e.players()).toEqual(['Riya', 'Arjun', 'Meena', 'Zoya']);
      expect(e.player('Kabir')?.role).toBeUndefined();
    });
  }

  it.fails('Kabir may still be revealed by the vote in the round he finishes', () => {
    const e = new Evening({ players: P5, seed: 'leave-vote', choices: { lastGuess: false } });
    e.startDeal();
    toMoment(e, 'clues');
    e.must({ type: 'leaveAfterRound', player: 'Kabir' });
    e.toVote();
    expect(e.try({ type: 'reveal', player: 'Kabir' })).toBe(true);
  });

  for (const redeal of ['dontKnow', 'dealAgain'] as const) {
    it.fails(`a pending leaver is dealt in by a redeal of this round (${redeal}) and removed at its result`, () => {
      const e = new Evening({ players: P5, seed: `leave-redeal-${redeal}`, choices: { lastGuess: false } });
      e.startDeal();
      toMoment(e, redeal === 'dontKnow' ? 'deal' : 'clues');
      e.must({ type: 'leaveAfterRound', player: 'Kabir' });
      e.must({ type: redeal });
      expect(e.players()).toEqual(P5);
      expect(['impostor', 'crew']).toContain(e.player('Kabir')?.role);
      finishCaught(e);
      expect(e.players()).toEqual(['Riya', 'Arjun', 'Meena', 'Zoya']);
    });
  }

  it.fails('when "End now" drops the round, the pending leaver is removed when endEvening is recorded (not among the final players)', () => {
    const e = new Evening({ players: P5, seed: 'leave-end' });
    e.startDeal();
    toMoment(e, 'talk');
    e.must({ type: 'leaveAfterRound', player: 'Kabir' });
    e.must({ type: 'endEvening' });
    expect(e.players()).toEqual(['Riya', 'Arjun', 'Meena', 'Zoya']);
  });

  it.fails('leaveAfterRound is refused for someone not in this round, twice for the same player, and between rounds', () => {
    const e = new Evening({ players: P5, seed: 'leave-refused', choices: { lastGuess: false } });
    e.startDeal();
    toMoment(e, 'clues');
    expect(e.refuses({ type: 'leaveAfterRound', player: 'Dev' })).toBe(true);
    e.must({ type: 'setPlayers', players: [...P5, 'Dev'] });
    e.must({ type: 'leaveAfterRound', player: 'Kabir' });
    expect(e.refuses({ type: 'leaveAfterRound', player: 'Kabir' }), 'a pending leaver cannot be marked again').toBe(true);
    finishCaught(e);
    expect(e.refuses({ type: 'leaveAfterRound', player: 'Riya' }), 'between rounds ✕ removes at once (setPlayers)').toBe(true);
  });
});

describe('IMP-078: "Deal again without Kabir" (dealAgainWithout)', () => {
  for (const m of MOMENTS) {
    it.fails(`at the ${m}: one move removes Kabir and deals the round again from the first player, with his points kept`, () => {
      const e = new Evening({ players: P5, seed: `without-${m}`, choices: { score: true, lastGuess: false } });
      e.startDeal();
      // A round 1 with points first, so Kabir has something to keep.
      e.playRound({ kind: 'caught', right: null });
      e.nextRound();
      toMoment(e, m);
      const round = e.host().round;
      expect(e.try({ type: 'dealAgainWithout', player: 'Kabir' })).toBe(true);
      const mv = lastMove(e);
      expect(mv.type).toBe('dealAgainWithout');
      expect(mv.player).toBe('Kabir');
      expect(mv.wordId, 'a word-dealing move carries its wordId (Test hooks item 1)').toMatch(/^IMPW-\d{3}$/);
      expect(Object.keys(mv).sort(), 'the record names no role').toEqual(['player', 'type', 'wordId']);
      expect(e.players()).toEqual(['Riya', 'Arjun', 'Meena', 'Zoya']);
      expect(e.host().round, 'the same round, dealt again').toBe(round);
      expect(e.host().starter, 'a new deal: no starter until everyone has seen').toBeNull();
      expect(e.player('Kabir')?.role).toBeUndefined();
      expect(e.players()).toContain(e.impostor());
      expect(Object.keys(totals(e))).toContain('Kabir');
      // The deal starts again from the first player: exactly 4 "Done" before clues.
      for (let i = 0; i < 4; i++) e.must({ type: 'seen' });
      expect(e.refuses({ type: 'seen' })).toBe(true);
    });
  }

  it.fails('property (300 seeded rounds, 4 to 12 players, any moment): dealAgainWithout never reveals roles: it is offered for every player of the round, and what it records and shows is the same whether the leaver is the impostor or not', () => {
    for (const s of seedList(300, 'no-reveal')) {
      const rng = seeded(s);
      const n = 4 + rng.int(9);
      const players = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Asha', 'Neel', 'Tara', 'Om', 'Isha', 'Ravi'].slice(0, n);
      const e = new Evening({ players, seed: s, choices: { lastGuess: false } });
      e.startDeal();
      toMoment(e, MOMENTS[rng.int(4)]!);
      const legal: any[] = e.rules.legalMoves(e.state, HOST) ?? [];
      const offered = legal.filter((mv) => mv.type === 'dealAgainWithout').map((mv) => mv.player).sort();
      expect(offered, `${s}: offered for every player of the round`).toEqual([...players].sort());
      const imp = e.impostor();
      const leaver = rng.int(2) === 0 ? imp : players.find((p) => p !== imp)!;
      const hostKeys = Object.keys(e.host()).sort();
      e.must({ type: 'dealAgainWithout', player: leaver });
      expect(Object.keys(lastMove(e)).sort(), `${s}`).toEqual(['player', 'type', 'wordId']);
      expect(Object.keys(e.host()).sort(), `${s}: the host view has the same fields`).toEqual(hostKeys);
      expect(e.host().impostor, `${s}: no impostor in the host view before the reveal`).toBeUndefined();
      expect(e.players()).toEqual(players.filter((p) => p !== leaver));
    }
  });
});

describe('IMP-078: fewer than 3 players never happens', () => {
  it('with 3 players, leaveAfterRound and dealAgainWithout are refused (the "3 players needed." dialog shows instead)', () => {
    const e = new Evening({ players: ['Riya', 'Arjun', 'Meena'], seed: 'three' });
    e.startDeal();
    toMoment(e, 'clues');
    expect(e.refuses({ type: 'leaveAfterRound', player: 'Meena' })).toBe(true);
    expect(e.refuses({ type: 'dealAgainWithout', player: 'Meena' })).toBe(true);
  });

  it.fails('with 4 players and a pending leaver (counted as gone), a second leaver is refused either way', () => {
    const e = new Evening({ players: P4, seed: 'four-pending' });
    e.startDeal();
    toMoment(e, 'talk');
    e.must({ type: 'leaveAfterRound', player: 'Kabir' });
    expect(e.refuses({ type: 'leaveAfterRound', player: 'Meena' })).toBe(true);
    expect(e.refuses({ type: 'dealAgainWithout', player: 'Meena' })).toBe(true);
  });
});

describe('Test hooks item 3 (v3.8, IMP-078 "no dead buttons"): test seeds that do not fit the players are ignored', () => {
  it.fails('a forced deal naming an impostor who is not playing is ignored as a whole: the round starts with seeded picks', () => {
    const e = new Evening({ players: P4, seed: 'unfit-imp', testDeals: [{ wordId: 'IMPW-004', impostor: 'Zoya', starter: 'Riya' }] });
    expect(e.try({ type: 'startDeal', practice: false }), 'the round can start').toBe(true);
    e.dealAll();
    expect(P4).toContain(e.impostor());
    expect(P4).toContain(e.host().starter);
  });

  it.fails('a forced deal naming a starter who is not playing is ignored as a whole', () => {
    const e = new Evening({ players: P4, seed: 'unfit-starter', testDeals: [{ wordId: 'IMPW-004', impostor: 'Arjun', starter: 'Zoya' }] });
    e.startDeal().dealAll();
    expect(P4).toContain(e.host().starter);
  });

  it.fails('a forced deal for round 2 naming a player who left after round 1 is ignored; round 2 still starts', () => {
    const e = new Evening({ players: P5, seed: 'unfit-left', choices: { lastGuess: false }, testDeals: [{}, { impostor: 'Kabir', starter: 'Kabir' }] });
    e.startDeal();
    toMoment(e, 'clues');
    e.must({ type: 'leaveAfterRound', player: 'Kabir' });
    finishCaught(e);
    expect(e.try({ type: 'nextRound' })).toBe(true);
    e.dealAll();
    expect(e.impostor()).not.toBe('Kabir');
    expect(e.host().starter).not.toBe('Kabir');
  });
});

describe('Test hooks item 1 (v3.8): every new deal deals the current list', () => {
  it.fails('property (200 seeded evenings of up to 8 rounds): after every deal, the dealt players are the current list (joiners in at the end, pending leavers still in); at each result pending leavers go; never fewer than 3', () => {
    const POOL = ['Dev', 'Asha', 'Neel', 'Tara', 'Om', 'Isha', 'Ravi', 'Sana'];
    for (const s of seedList(200, 'current-list')) {
      const rng = seeded(s);
      let list = [...P5];
      let pending: string[] = [];
      let fresh = 0;
      const e = new Evening({ players: list, seed: s, choices: { score: true, lastGuess: false } });
      e.startDeal();
      let dealt = [...list];
      const rounds = 1 + rng.int(8);
      for (let r = 0; r < rounds; r++) {
        if (r > 0) { e.nextRound(); dealt = [...list]; }
        expect(e.players(), `${s} round ${r + 1}: dealt the current list`).toEqual(dealt);
        // Up to three things happen mid-round, each at a random moment of the deal.
        for (let k = rng.int(4); k > 0; k--) {
          const roll = rng.int(4);
          if (roll === 0 && fresh < POOL.length) {
            list = [...list, POOL[fresh++]!];
            e.must({ type: 'setPlayers', players: list });
            expect(e.players(), `${s}: a joiner is not dealt in mid-round`).toEqual(dealt);
          } else if (roll === 1) {
            const can = dealt.filter((p) => !pending.includes(p) && list.includes(p));
            const after = list.length - pending.length - 1;
            const who = can[rng.int(can.length)];
            if (who && after >= 3) { e.must({ type: 'leaveAfterRound', player: who }); pending = [...pending, who]; }
          } else if (roll === 2) {
            const can = dealt.filter((p) => !pending.includes(p));
            const after = list.length - pending.length - 1;
            const who = can[rng.int(can.length)];
            if (who && after >= 3) {
              e.must({ type: 'dealAgainWithout', player: who });
              list = list.filter((p) => p !== who);
              dealt = [...list];
              expect(e.players(), `${s}: dealAgainWithout deals the current list`).toEqual(dealt);
            }
          } else {
            e.must({ type: 'dealAgain' });
            dealt = [...list];
            expect(e.players(), `${s}: dealAgain deals the current list`).toEqual(dealt);
          }
        }
        const o = randomOutcome(rng);
        e.playRound(o.kind === 'caught' ? { kind: 'caught', right: null } : o);
        list = list.filter((p) => !pending.includes(p));
        pending = [];
        expect(e.players(), `${s} round ${r + 1}: at the result, pending leavers go`).toEqual(list);
        expect(e.players().length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
