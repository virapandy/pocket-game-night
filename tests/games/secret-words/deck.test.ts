// The deck and replays (specs/secret-words/02-deal.md SWD-024, SWD-026; SWD-039's property; Test hooks item 2).
// C3, written before the build, 22 October 2026.
// Live codes: the rules list each deal's code in `legalMoves` (`deal` / `dealNew` with `code`); the app records that
// move. See specs/secret-words/api.md and docs/test-questions.md (22 October) for why `apply` cannot also refuse
// another valid code (the engine replays through the same `apply`).
import { describe, expect, it } from 'vitest';
import { createRng, replay } from '../../../src/engine';
import {
  candidates, codeParts, DeckOracle, Evening, lastN, nextMapCode, oracleBoard, oracleCode, oraclePickDeck, pickDeck, readTestSeeds,
  rules, setupInput, WORDS,
} from './helpers';

const FAMILY = candidates(1, 'family').map((w) => w.id);

/** Plays `deals` deals, each followed by "End the game" (a deal is legal again at game over: "Play again"). */
function dealMany(e: Evening, deals: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < deals; i++) {
    codes.push(e.deal());
    e.must({ type: 'endGame' });
  }
  return codes;
}

describe('SWD-024: the deck (pickDeck)', () => {
  it('draws up to 200 deck seeds from `${seeds.deal}:deck:${k}` and keeps the one whose first 75 words hold the fewest words to avoid, earliest on a tie', () => {
    const rng = createRng('avoid');
    for (let i = 0; i < 20; i++) {
      // Avoiding most of the list: no deck has none, so all 200 are drawn and the best kept.
      const avoid = new Set(FAMILY.filter(() => rng.int(10) < 7));
      const seed = `deck-seed-${i}`;
      expect(pickDeck(seed, 1 + (i % 3), FAMILY, avoid), seed).toBe(oraclePickDeck(seed, 1 + (i % 3), FAMILY, avoid));
    }
  });

  it('stops at the first deck seed with none to avoid', () => {
    for (let i = 0; i < 50; i++) {
      const seed = `first-${i}`;
      expect(pickDeck(seed, 1, FAMILY, new Set()), seed).toBe(createRng(`${seed}:deck:1`).int(31 ** 4));
    }
    // A few words to avoid: still usually found at once, else soon.
    const avoid = new Set(FAMILY.slice(0, 20));
    for (let i = 0; i < 50; i++) expect(pickDeck(`few-${i}`, 2, FAMILY, avoid)).toBe(oraclePickDeck(`few-${i}`, 2, FAMILY, avoid));
  });
});

describe('SWD-024: deals in an evening', () => {
  it('the first deal uses deck k = 1 picked at evening creation, avoiding the recent words, at deal index 0', () => {
    const recent = FAMILY.slice(100, 160);
    const e = new Evening({ seed: 'first-deal', recent });
    const code = e.deal();
    const d = oraclePickDeck('first-deal', 1, FAMILY, new Set(recent));
    expect(code).toBe(oracleCode({ edition: 1, board: 'full', words: 'family' }, d, 0));
  });

  it('deals then use n = 0, 1, 2, … in that deck (Play again)', () => {
    const e = new Evening({ seed: 'n-steps' });
    const codes = dealMany(e, 5);
    const d = codeParts(codes[0]!).d;
    expect(codes.map((c) => codeParts(c))).toEqual([0, 1, 2, 3, 4].map((n) => expect.objectContaining({ d, n, board: 'full', words: 'family' })));
  });

  it('"New board" (dealNew) uses up a deal index like any deal', () => {
    const e = new Evening({ seed: 'new-board' });
    const a = e.deal();
    const b = e.deal('dealNew');
    e.must({ type: 'endGame' });
    const c = e.deal();
    expect([a, b, c].map((x) => codeParts(x).n)).toEqual([0, 1, 2]);
    expect(new Set([a, b, c].map((x) => codeParts(x).d)).size).toBe(1);
  });

  it('when 25·n + size would exceed the candidates, the next deal picks deck k + 1, avoiding this evening\'s words, and starts at n = 0', () => {
    const e = new Evening({ seed: 'runs-out', recent: FAMILY.slice(0, 30) });
    const oracle = new DeckOracle('runs-out', FAMILY.slice(0, 30));
    const codes = dealMany(e, 19); // 17 deals fit in the first deck (n = 0 to 16)
    expect(codes).toEqual(Array.from({ length: 19 }, () => oracle.next({ board: 'full', words: 'family' })));
    expect(codeParts(codes[16]!).n).toBe(16);
    expect(codeParts(codes[17]!).n).toBe(0);
    expect(codeParts(codes[17]!).d).not.toBe(codeParts(codes[16]!).d);
  });

  it('a change of Words or of Board (setChoices between games) picks a new deck at the next deal', () => {
    const e = new Evening({ seed: 'changes' });
    const oracle = new DeckOracle('changes');
    const seq: { board: 'full' | 'easy'; words: 'family' | 'grownups' }[] = [
      { board: 'full', words: 'family' }, { board: 'full', words: 'family' }, { board: 'full', words: 'grownups' },
      { board: 'full', words: 'grownups' }, { board: 'easy', words: 'grownups' }, { board: 'easy', words: 'grownups' },
    ];
    let prev = seq[0]!;
    for (const c of seq) {
      if (c.board !== prev.board || c.words !== prev.words) e.must({ type: 'setChoices', choices: { ...e.choices, ...c } });
      prev = c;
      const code = e.deal();
      expect(code).toBe(oracle.next(c));
      if (oracle.newDeck) expect(codeParts(code).n, code).toBe(0);
      e.must({ type: 'endGame' });
    }
    expect(oracle.k).toBe(3);
  });

  it('a change of Landmine or of phones alone keeps the deck (the candidate list is unchanged)', () => {
    const e = new Evening({ seed: 'same-deck' });
    const a = e.deal();
    e.must({ type: 'endGame' });
    e.must({ type: 'setChoices', choices: { ...e.choices, landmine: 'turn', map: 'own' } });
    const b = e.deal();
    expect(codeParts(b)).toMatchObject({ d: codeParts(a).d, n: 1 });
  });

  it('Property: for 1,000 random evenings of 15 Full Whole-family deals with the edition-1 list, no word is on two boards', () => {
    for (let i = 0; i < 1000; i++) {
      const e = new Evening({ seed: `evening-${i}-${createRng(`x${i}`).int(1e9)}` });
      const seen = new Set<string>();
      for (const code of dealMany(e, 15)) {
        for (const id of oracleBoard(code).ids) {
          expect(seen.has(id), `evening ${i}: ${id} on two boards`).toBe(false);
          seen.add(id);
        }
      }
    }
  });
});

describe('SWD-039: Next map follows the deck', () => {
  it('Property: for 1,000 random evenings, every deal of the same deck as the deal before it has exactly nextMapCode of that deal\'s code; every deal with a new deck does not', () => {
    for (let i = 0; i < 1000; i++) {
      const r = createRng(`next-${i}`);
      const e = new Evening({ seed: `next-map-${i}`, choices: { words: r.int(2) ? 'family' : 'grownups', board: r.int(2) ? 'full' : 'easy' } });
      let prev: string | null = null;
      const deals = 3 + r.int(20);
      for (let j = 0; j < deals; j++) {
        // "Play again" deals; sometimes "New board" follows mid-game.
        const codes = [e.deal()];
        if (r.int(4) === 0) codes.push(e.deal('dealNew'));
        for (const code of codes) {
          if (prev) {
            const sameDeck = codeParts(prev).d === codeParts(code).d && codeParts(code).n === codeParts(prev).n + 1;
            if (sameDeck) expect(nextMapCode(prev, WORDS)).toBe(code);
            else expect(nextMapCode(prev, WORDS)).not.toBe(code);
          }
          prev = code;
        }
        e.must({ type: 'endGame' });
      }
    }
  });

  it('a deck runs out after the last valid n (16 for Whole family): nextMapCode is then null and the evening\'s next deal is a new deck', () => {
    expect(lastN('full', 'family')).toBe(16);
    const e = new Evening({ seed: 'last-n' });
    const codes = dealMany(e, 18);
    expect(nextMapCode(codes[16]!, WORDS)).toBeNull();
    expect(codeParts(codes[17]!).n).toBe(0);
  });
});

describe('SWD-026: replays', () => {
  it('every deal and dealNew records its code; brokeRule records its cell', () => {
    const e = new Evening({ seed: 'records' });
    e.deal();
    e.deal('dealNew');
    e.clue(2);
    e.brokeRule();
    const moves = e.records.map((r) => r.move);
    expect(moves[0]).toEqual({ type: 'deal', code: expect.stringMatching(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{7}$/) });
    expect(moves[1]).toEqual({ type: 'dealNew', code: expect.stringMatching(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{7}$/) });
    expect(moves[3]).toEqual({ type: 'brokeRule', cell: expect.any(Number) });
  });

  it('replay accepts any recorded code valid for the shipped editions and gives the same boards, reveals and results', () => {
    const rng = createRng('replay-any');
    for (let i = 0; i < 50; i++) {
      const code = oracleCode({ edition: 1, board: 'full', words: 'family' }, rng.int(31 ** 4), rng.int(17));
      const want = oracleBoard(code);
      const setup = setupInput({ seed: `replay-${i}` });
      const starts = want.starts;
      const own = want.kinds.map((k, j) => (k === starts ? j : -1)).filter((j) => j >= 0);
      const records = [
        { type: 'deal', code }, { type: 'clue', n: 'inf' }, ...own.map((cell) => ({ type: 'reveal', cell })),
      ].map((move, j) => ({ v: 1 as const, seq: j + 1, at: 1000 * (j + 1), by: 'host', move }));
      const r = replay(rules(), setup, records as any);
      expect(r.ok, `${code}: ${(r as any).reason}`).toBe(true);
      if (!r.ok) continue;
      const view = rules().view(r.value.state, { kind: 'room' });
      expect(view.cells.map((c: any) => c.word)).toEqual(want.words);
      expect(view.winner).toBe(starts);
      // After game over every cell shows its kind (SWD-051): the map is the code's.
      expect(view.cells.map((c: any) => c.kind)).toEqual(want.kinds);
    }
  });

  it('replay refuses a code that is not valid: a wrong check, a deal index too large, or an edition not shipped', () => {
    const bad = ['27P3QX9', oracleCode({ edition: 1, board: 'full', words: 'family' }, 10, 17), oracleCode({ edition: 2, board: 'full', words: 'family' }, 10, 0)];
    for (const code of bad) {
      const r = replay(rules(), setupInput(), [{ v: 1, seq: 1, at: 1000, by: 'host', move: { type: 'deal', code } }] as any);
      expect(r.ok, code).toBe(false);
    }
  });

  it('live, the rules list exactly one `deal` (and one `dealNew` mid-game), with the code SWD-024 gives', () => {
    const e = new Evening({ seed: 'listed' });
    const oracle = new DeckOracle('listed');
    expect(e.legalOf('deal')).toEqual([{ type: 'deal', code: oracle.next({ board: 'full', words: 'family' }) }]);
    expect(e.legalOf('dealNew')).toEqual([]);
    e.deal();
    expect(e.legalOf('deal')).toEqual([]);
    expect(e.legalOf('dealNew')).toEqual([{ type: 'dealNew', code: oracle.next({ board: 'full', words: 'family' }) }]);
  });

  it('live, play accepts only SWD-046\'s cell for brokeRule', () => {
    const e = new Evening({ seed: 'penalty-only' });
    e.deal();
    e.clue(1);
    const [listed] = e.legalOf('brokeRule');
    for (const cell of e.faceDown()) if (cell !== listed.cell) expect(e.try({ type: 'brokeRule', cell }), `cell ${cell}`).toBe(false);
    expect(e.try(listed)).toBe(true);
  });
});

describe('Test hooks item 2: seeds and test boards', () => {
  it('config.testBoards[i] is used for deal i + 1 and bypasses SWD-024', () => {
    const boards = ['27P3QX8', oracleCode({ edition: 1, board: 'full', words: 'family' }, 42, 9), oracleCode({ edition: 1, board: 'full', words: 'family' }, 43, 0)];
    const e = new Evening({ seed: 'hooked', testBoards: boards });
    expect(e.deal()).toBe(boards[0]);
    expect(e.deal('dealNew')).toBe(boards[1]);
    e.must({ type: 'endGame' });
    expect(e.deal()).toBe(boards[2]);
  });

  it('readTestSeeds reads { deal, teams, boards } in development and preview builds, and nothing in the release build', () => {
    const raw = JSON.stringify({ deal: 'd-1', teams: 't-1', boards: ['27P3QX8'] });
    expect(readTestSeeds(raw, false)).toEqual({ deal: 'd-1', teams: 't-1', boards: ['27P3QX8'] });
    expect(readTestSeeds(JSON.stringify({ deal: 'only' }), false)).toEqual({ deal: 'only' });
    expect(readTestSeeds(raw, true)).toBeNull();
    expect(readTestSeeds(null, false)).toBeNull();
    expect(readTestSeeds('not json', false)).toBeNull();
  });
});
