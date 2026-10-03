// Expected to fail (not built yet): tests marked `it.fails` wait for src/games/impostor (owner decision 2026-10-03).
// A marked test that starts passing turns red: then remove its `.fails` mark. What each test checks is unchanged.
// The vote, the reveal, the last guess and its undo (specs/impostor/04-vote-and-reveal.md): IMP-031 to IMP-035,
// IMP-037, IMP-038. Screens and timings are checked in the browser tests; here, the moves and views.
import { describe, expect, it } from 'vitest';
import { HOST, replay, undo } from '../../../src/engine';
import { DEFAULT_CHOICES, Evening, NAMES, P4, P5, seedList } from './helpers';

const atVote = (seed = 'vote', players = P4) => {
  const e = new Evening({ seed, players });
  e.startDeal().dealAll().toVote();
  return e;
};

describe('IMP-031: recording who got the most fingers: pick, then reveal', () => {
  it.fails('"Reveal <Name>" is accepted for any player once the vote has started, and records `reveal {player}`', () => {
    for (const p of P4) {
      const e = atVote(`reveal-${p}`);
      e.must({ type: 'reveal', player: p });
      expect(e.match.records.at(-1)!.move).toEqual({ type: 'reveal', player: p });
    }
  });

  it.fails('no reveal before "Vote now", and never of someone not playing', () => {
    const e = new Evening({ seed: 'early' });
    e.startDeal();
    expect(e.refuses({ type: 'reveal', player: 'Riya' }), 'during the deal').toBe(true);
    e.dealAll();
    expect(e.refuses({ type: 'reveal', player: 'Riya' }), 'on the clues screen').toBe(true);
    e.must({ type: 'startTalk' });
    expect(e.refuses({ type: 'reveal', player: 'Riya' }), 'during the talk').toBe(true);
    e.must({ type: 'voteNow' });
    expect(e.refuses({ type: 'reveal', player: 'Zoya' }), 'Zoya is not playing').toBe(true);
  });

  it.fails('a reveal is never repeated in a round', () => {
    const e = atVote('twice');
    e.must({ type: 'reveal', player: e.crew()[0] });
    expect(e.refuses({ type: 'reveal', player: e.impostor() })).toBe(true);
  });
});

describe('IMP-032: a tie gets one re-vote', () => {
  it.fails('"Point again" needs 2 or more different players; every player may be ticked', () => {
    const e = atVote('tie');
    expect(e.refuses({ type: 'tie', players: [] })).toBe(true);
    expect(e.refuses({ type: 'tie', players: ['Arjun'] })).toBe(true);
    expect(e.refuses({ type: 'tie', players: ['Arjun', 'Arjun'] })).toBe(true);
    expect(e.refuses({ type: 'tie', players: ['Arjun', 'Zoya'] })).toBe(true);
    expect(e.try({ type: 'tie', players: [...P4] })).toBe(true);
  });

  it.fails('the re-vote picks one of the tied players, or "Still a tie"; there is never a second re-vote', () => {
    const e = atVote('revote');
    e.must({ type: 'tie', players: ['Arjun', 'Meena'] });
    expect(e.refuses({ type: 'tie', players: ['Arjun', 'Meena'] }), 'no second re-vote').toBe(true);
    expect(e.refuses({ type: 'reveal', player: 'Riya' }), 'Riya was not tied').toBe(true);
    expect(e.try({ type: 'reveal', player: 'Meena' })).toBe(true);
    const f = atVote('revote-still');
    f.must({ type: 'tie', players: ['Arjun', 'Meena'] });
    expect(f.try({ type: 'stillTie' })).toBe(true);
  });

  it.fails('"Still a tie" only after a tie', () => {
    const e = atVote('still-early');
    expect(e.refuses({ type: 'stillTie' })).toBe(true);
  });
});

describe('IMP-033: caught: the guess comes before the word is shown', () => {
  it.fails('after the impostor is revealed: "Show the word", then a verdict; no verdict before the word, and no next round before a verdict', () => {
    for (const s of seedList(20, 'caught')) {
      const e = atVote(s);
      const imp = e.impostor();
      e.must({ type: 'reveal', player: imp });
      expect(e.refuses({ type: 'verdict', right: true }), 'verdict before "Show the word"').toBe(true);
      expect(e.refuses({ type: 'nextRound' }), 'the round has no result yet').toBe(true);
      e.must({ type: 'showWord' });
      expect(e.refuses({ type: 'showWord' })).toBe(true);
      expect(e.refuses({ type: 'nextRound' }), 'still waiting for the verdict').toBe(true);
      e.must({ type: 'verdict', right: false });
      expect(e.refuses({ type: 'verdict', right: true }), 'one verdict').toBe(true);
      e.must({ type: 'nextRound' });
    }
  });

  it.fails('the host and room views gain the impostor and the word id at the reveal, not before', () => {
    const e = atVote('views');
    const imp = e.impostor();
    const word = e.wordId();
    for (const v of [e.host(), e.room()]) {
      expect(v).not.toHaveProperty('impostor');
      expect(v).not.toHaveProperty('wordId');
    }
    e.must({ type: 'reveal', player: imp });
    for (const v of [e.host(), e.room()]) expect(v).toMatchObject({ impostor: imp, wordId: word });
  });
});

describe('IMP-034: the reveal when the crew got it wrong', () => {
  it.fails('revealing a crew member ends the round as escaped: no last guess, no "Show the word", straight to the next round', () => {
    for (const s of seedList(20, 'escaped')) {
      const e = atVote(s);
      const imp = e.impostor();
      const word = e.wordId();
      e.must({ type: 'reveal', player: e.crew()[1]! });
      expect(e.refuses({ type: 'showWord' })).toBe(true);
      expect(e.refuses({ type: 'verdict', right: true })).toBe(true);
      expect(e.refuses({ type: 'verdict', right: false })).toBe(true);
      expect(e.host()).toMatchObject({ impostor: imp, wordId: word });
      e.must({ type: 'nextRound' });
    }
  });
});

describe('IMP-035: the room judges the last guess', () => {
  it.fails('both verdicts are accepted and recorded exactly as tapped', () => {
    for (const right of [true, false]) {
      const e = atVote(`judge-${right}`);
      e.must({ type: 'reveal', player: e.impostor() }).must({ type: 'showWord' }).must({ type: 'verdict', right });
      expect(e.match.records.at(-1)!.move).toEqual({ type: 'verdict', right });
    }
  });
});

describe('IMP-037: undo the verdict only, before the next round', () => {
  const caughtRound = (seed: string, right = false) => {
    const e = atVote(seed);
    e.must({ type: 'reveal', player: e.impostor() }).must({ type: 'showWord' }).must({ type: 'verdict', right });
    return e;
  };
  const lastSeq = (e: Evening, type: string) => [...e.match.records].reverse().find((r) => r.move.type === type)!.seq;
  const canUndo = (e: Evening, seq: number) => {
    const record = e.match.records.find((r) => r.seq === seq)!;
    return e.rules.canUndo(e.state, { record, by: HOST, now: e.at + 1 });
  };

  it.fails('undoing the verdict is the engine\'s undo of that record: the verdict buttons come back, and the round has no result until a verdict is tapped again', () => {
    const e = caughtRound('undo');
    const seq = lastSeq(e, 'verdict');
    expect(canUndo(e, seq)).toBe(true);
    const u = undo(e.rules, e.match, seq, { by: HOST, now: e.at + 1 });
    expect(u.ok).toBe(true);
    if (!u.ok) return;
    const expected = replay(e.rules, e.match.setup, e.match.records.filter((r) => r.seq !== seq));
    expect(expected.ok && expected.value.state).toEqual(u.value.state);
    const after = Evening.from(u.value);
    expect(after.refuses({ type: 'nextRound' }), 'no result until a verdict').toBe(true);
    expect(after.refuses({ type: 'showWord' }), 'the word stays shown').toBe(true);
    after.must({ type: 'verdict', right: true }).must({ type: 'nextRound' });
  });

  it.fails('"This word didn\'t work" tapped meanwhile does not end the window, and stays after the undo', () => {
    const e = caughtRound('wdw');
    const seq = lastSeq(e, 'verdict');
    e.must({ type: 'wordDidntWork', blocked: true });
    expect(canUndo(e, seq)).toBe(true);
    const u = undo(e.rules, e.match, seq, { by: HOST, now: e.at + 1 });
    expect(u.ok).toBe(true);
    if (u.ok) expect(u.value.records.map((r) => r.move.type)).toContain('wordDidntWork');
  });

  const enders: [string, (e: Evening) => void][] = [
    ['"Next round"', (e) => { e.nextRound(); }],
    ['a change of players', (e) => { e.must({ type: 'setPlayers', players: [...P4, 'Zoya'] }); }],
    ['a change of choices', (e) => { e.must({ type: 'setChoices', choices: { ...DEFAULT_CHOICES, score: true } }); }],
    ['the end of the evening', (e) => { e.must({ type: 'endEvening' }); }],
  ];
  for (const [what, end] of enders) {
    it.fails(`no undo after ${what}`, () => {
      const e = caughtRound(`end-${what}`);
      const seq = lastSeq(e, 'verdict');
      end(e);
      expect(canUndo(e, seq)).toBe(false);
      expect(undo(e.rules, e.match, seq, { by: HOST, now: e.at + 1 }).ok).toBe(false);
    });
  }

  it.fails('only the round\'s latest verdict: an earlier round\'s verdict can never be undone', () => {
    const e = caughtRound('older');
    const first = lastSeq(e, 'verdict');
    e.nextRound().dealAll().toVote();
    e.must({ type: 'reveal', player: e.impostor() }).must({ type: 'showWord' }).must({ type: 'verdict', right: true });
    expect(canUndo(e, first)).toBe(false);
    expect(canUndo(e, lastSeq(e, 'verdict'))).toBe(true);
  });

  it.fails('a reveal, a deal or any other move is never undone', () => {
    const e = caughtRound('others');
    for (const r of e.match.records) {
      if (r.move.type === 'verdict') continue;
      expect(canUndo(e, r.seq), `${r.move.type} #${r.seq}`).toBe(false);
    }
  });

  it.fails('an escaped or "Still a tie" round has nothing to undo', () => {
    const e = atVote('esc');
    e.must({ type: 'reveal', player: e.crew()[0]! });
    for (const r of e.match.records) expect(canUndo(e, r.seq)).toBe(false);
    const f = atVote('still');
    f.must({ type: 'tie', players: [f.impostor(), f.crew()[0]!].sort((a, b) => P4.indexOf(a) - P4.indexOf(b)) }).must({ type: 'stillTie' });
    for (const r of f.match.records) expect(canUndo(f, r.seq)).toBe(false);
  });
});

describe('IMP-038: "Still a tie": the impostor escapes', () => {
  it.fails('ends the round with no last guess: no "Show the word", no verdict; the views gain the impostor and the word id', () => {
    for (const s of seedList(20, 'stilltie')) {
      const e = atVote(s, P5);
      const imp = e.impostor();
      const word = e.wordId();
      const other = e.crew()[0]!;
      e.must({ type: 'tie', players: P5.filter((p) => p === imp || p === other) }).must({ type: 'stillTie' });
      expect(e.refuses({ type: 'showWord' })).toBe(true);
      expect(e.refuses({ type: 'verdict', right: true })).toBe(true);
      expect(e.host()).toMatchObject({ impostor: imp, wordId: word });
      expect(e.room()).toMatchObject({ impostor: imp, wordId: word });
      e.must({ type: 'nextRound' });
    }
  });

  it.fails('works with a tie of every player, up to 20', () => {
    const players = NAMES.slice(0, 20);
    const e = atVote('twenty', players);
    e.must({ type: 'tie', players }).must({ type: 'stillTie' }).must({ type: 'nextRound' });
  });
});
