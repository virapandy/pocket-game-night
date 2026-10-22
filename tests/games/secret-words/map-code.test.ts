// The map code and the board it gives (specs/secret-words/02-deal.md SWD-020, 021, 022, 027; SWD-039's nextMapCode and
// SWD-002's typed-code rules, which read the same code). C3, written before the build, 22 October 2026.
// Random codes are made with the scenarios' own encoding (oracleCode in helpers.ts), so these tests do not depend on
// codeFor; codeFor is checked against the same encoding.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/engine';
import {
  ALPHABET, boardFromCode, candidates, codeFor, codeParts, DECKS, lastN, nextMapCode, oracleBoard, oracleCode, parseMapCode,
  WORDS, type Audience, type BoardSize,
} from './helpers';

const golden = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/secret-words-golden-boards.json', import.meta.url)), 'utf8'));

/** A random valid code of this board size (any audience, any deck, any valid deal index). */
function randomCode(rng: { int(n: number): number }, board: BoardSize): string {
  const words: Audience = rng.int(2) === 0 ? 'family' : 'grownups';
  return oracleCode({ edition: 1, board, words }, rng.int(DECKS), rng.int(lastN(board, words) + 1));
}

describe('SWD-022: the map code', () => {
  it('the worked example: 27P3QX8 is edition 1, Full, Whole family, deal index 5, deck seed P3QX, check 8', () => {
    const p = codeParts('27P3QX8');
    expect(p).toMatchObject({ config: 0, edition: 1, board: 'full', words: 'family', n: 5, check: 6 });
    expect(oracleCode({ edition: 1, board: 'full', words: 'family' }, p.d, 5)).toBe('27P3QX8');
  });

  it('codeFor makes the 7 symbols of SWD-022 (no hyphen), for every config of edition 1', () => {
    const rng = createRng('codeFor');
    for (let i = 0; i < 2000; i++) {
      const board: BoardSize = rng.int(2) ? 'easy' : 'full';
      const words: Audience = rng.int(2) ? 'grownups' : 'family';
      const d = i < 2 ? [0, DECKS - 1][i]! : rng.int(DECKS);
      const n = rng.int(lastN(board, words) + 1);
      expect(codeFor({ edition: 1, board, words }, d, n)).toBe(oracleCode({ edition: 1, board, words }, d, n));
    }
    expect(codeFor({ edition: 1, board: 'full', words: 'family' }, codeParts('27P3QX8').d, 5)).toBe('27P3QX8');
  });

  it('boardFromCode follows steps 1 to 4 exactly (words, their ids, kinds, starting team), for 2,000 random codes', () => {
    const rng = createRng('board-steps');
    for (let i = 0; i < 2000; i++) {
      const code = randomCode(rng, rng.int(2) ? 'easy' : 'full');
      const want = oracleBoard(code);
      const got = boardFromCode(code, WORDS);
      expect(got, code).toEqual({
        words: want.words, ids: want.ids, kinds: want.kinds, starts: want.starts, edition: 1, board: want.board, audience: want.audience,
      });
    }
  });

  it('Property: boardFromCode gives the same result for 10,000 codes on every call', () => {
    const rng = createRng('same-every-call');
    for (let i = 0; i < 10_000; i++) {
      const code = randomCode(rng, rng.int(2) ? 'easy' : 'full');
      expect(boardFromCode(code, WORDS)).toEqual(boardFromCode(code, WORDS));
    }
  });

  it('golden boards: the 5 recorded codes give exactly their recorded boards (a change is a C3 defect)', () => {
    expect(golden.boards).toHaveLength(5);
    for (const g of golden.boards) {
      const got = boardFromCode(g.code, WORDS);
      expect({ ids: got.ids, words: got.words, kinds: got.kinds, starts: got.starts }, g.code).toEqual({
        ids: g.ids, words: g.words, kinds: g.kinds, starts: g.starts,
      });
    }
  });

  it('a code is valid only if its check is right, its edition is shipped and 25·n + size ≤ candidates', () => {
    // Edition 1, Whole family: 439 candidates; the last valid n is 16 for Full and Easy (SWD-039).
    for (const board of ['full', 'easy'] as const) {
      expect(boardFromCode(oracleCode({ edition: 1, board, words: 'family' }, 1234, 16), WORDS)).not.toHaveProperty('error');
      expect(boardFromCode(oracleCode({ edition: 1, board, words: 'family' }, 1234, 17), WORDS)).toEqual({ error: 'invalid' });
    }
    // + Harder words: 452 candidates; Full 25·17 + 25 = 450 ≤ 452; Easy 25·17 + 16 = 441; n = 18 too large for both.
    expect(candidates(1, 'grownups').length).toBe(452);
    for (const board of ['full', 'easy'] as const) {
      expect(boardFromCode(oracleCode({ edition: 1, board, words: 'grownups' }, 99, 17), WORDS)).not.toHaveProperty('error');
      expect(boardFromCode(oracleCode({ edition: 1, board, words: 'grownups' }, 99, 18), WORDS)).toEqual({ error: 'invalid' });
    }
    // A wrong check symbol.
    expect(boardFromCode('27P3QX9', WORDS)).toEqual({ error: 'invalid' });
    // An edition this app doesn't ship (config 4 = edition 2), with a right check.
    expect(boardFromCode(oracleCode({ edition: 2, board: 'full', words: 'family' }, 1234, 0), WORDS)).toEqual({ error: 'newer' });
  });
});

describe('SWD-020: what a board holds', () => {
  for (const board of ['full', 'easy'] as const) {
    it(`Property: for 10,000 random valid ${board === 'full' ? 'Full' : 'Easy'} codes, exactly ${board === 'full' ? '9, 8, 7, 1' : '6, 5, 5, 0'} and all words distinct`, () => {
      const rng = createRng(`holds-${board}`);
      const want = board === 'full' ? [9, 8, 7, 1] : [6, 5, 5, 0];
      for (let i = 0; i < 10_000; i++) {
        const code = randomCode(rng, board);
        const b = boardFromCode(code, WORDS);
        expect(b.words, code).toHaveLength(board === 'full' ? 25 : 16);
        expect(b.kinds, code).toHaveLength(b.words.length);
        expect(new Set(b.words).size, code).toBe(b.words.length);
        const other = b.starts === 'orange' ? 'teal' : 'orange';
        const count = (k: string) => b.kinds.filter((x: string) => x === k).length;
        expect([count(b.starts), count(other), count('nobody'), count('landmine')], code).toEqual(want);
      }
    });
  }
});

describe('SWD-021: who starts', () => {
  it('Property: over 10,000 random valid codes, each team starts between 48% and 52% of boards', () => {
    const rng = createRng('who-starts');
    let orange = 0;
    for (let i = 0; i < 10_000; i++) if (boardFromCode(randomCode(rng, rng.int(2) ? 'easy' : 'full'), WORDS).starts === 'orange') orange++;
    expect(orange).toBeGreaterThanOrEqual(4800);
    expect(orange).toBeLessThanOrEqual(5200);
  });
});

describe('SWD-027: map code checks', () => {
  it('Property: every code codeFor makes passes the check; any one symbol changed, or two adjacent different symbols swapped, fails it', () => {
    const rng = createRng('checks');
    for (let i = 0; i < 2000; i++) {
      const board: BoardSize = rng.int(2) ? 'easy' : 'full';
      const words: Audience = rng.int(2) ? 'grownups' : 'family';
      const code = codeFor({ edition: 1, board, words }, rng.int(DECKS), rng.int(lastN(board, words) + 1));
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{7}$/);
      expect(parseMapCode(code, WORDS), code).toBe(code);
      expect(boardFromCode(code, WORDS), code).not.toHaveProperty('error');
      // One symbol changed: try a random other symbol at every place.
      for (let p = 0; p < 7; p++) {
        let s = ALPHABET[rng.int(31)]!;
        while (s === code[p]) s = ALPHABET[rng.int(31)]!;
        const bad = code.slice(0, p) + s + code.slice(p + 1);
        expect(parseMapCode(bad, WORDS), `${code} → ${bad}`).toBe('invalid');
        expect(boardFromCode(bad, WORDS), `${code} → ${bad}`).toEqual({ error: 'invalid' });
      }
      for (let p = 0; p < 6; p++) {
        if (code[p] === code[p + 1]) continue;
        const bad = code.slice(0, p) + code[p + 1] + code[p] + code.slice(p + 2);
        expect(parseMapCode(bad, WORDS), `${code} → ${bad}`).toBe('invalid');
      }
    }
  });

  it('every single-symbol change of the example code fails (all 6 × 30 + 30 changes)', () => {
    const code = '27P3QX8';
    for (let p = 0; p < 7; p++) {
      for (const s of ALPHABET) {
        if (s === code[p]) continue;
        expect(parseMapCode(code.slice(0, p) + s + code.slice(p + 1), WORDS)).toBe('invalid');
      }
    }
  });
});

describe('SWD-002: reading a typed code (parseMapCode)', () => {
  it('spaces and hyphens are removed and letters upper-cased: "27p-3qx8", " 27P 3QX8 " and "27P-3QX8" all read 27P3QX8', () => {
    for (const typed of ['27p-3qx8', ' 27P 3QX8 ', '27P-3QX8', '27p3qx8', '2-7-P-3-Q-X-8']) expect(parseMapCode(typed, WORDS), typed).toBe('27P3QX8');
  });

  it('not exactly 7 characters → invalid', () => {
    for (const typed of ['', '27P3QX', '27P3QX88', '27P-3QX']) expect(parseMapCode(typed, WORDS), typed).toBe('invalid');
  });

  it('a character outside the alphabet (0, O, 1, I, L included) → invalid', () => {
    for (const bad of ['0', 'O', '1', 'I', 'L', '#', 'é']) expect(parseMapCode(`27P3Q${bad}8`, WORDS), bad).toBe('invalid');
  });

  it('a wrong check symbol → invalid; a deal index too large for edition 1 → invalid', () => {
    expect(parseMapCode('27P3QX9', WORDS)).toBe('invalid');
    expect(parseMapCode(oracleCode({ edition: 1, board: 'full', words: 'family' }, 5000, 17), WORDS)).toBe('invalid');
  });

  it('a config symbol for an edition this app doesn\'t have (value ≥ 4 while the app has only edition 1), with a right check → newer', () => {
    for (const edition of [2, 3, 7]) {
      for (const board of ['full', 'easy'] as const) {
        const code = oracleCode({ edition, board, words: 'family' }, 777, 0);
        expect(parseMapCode(code, WORDS), code).toBe('newer');
        expect(parseMapCode(code.toLowerCase().replace(/^(...)/, '$1-'), WORDS), code).toBe('newer');
      }
    }
  });

  it('a newer-edition code with a wrong check is invalid (rule 1 comes before rule 2)', () => {
    const code = oracleCode({ edition: 2, board: 'full', words: 'family' }, 777, 0);
    const bad = code.slice(0, 6) + (code[6] === '2' ? '3' : '2');
    expect(parseMapCode(bad, WORDS)).toBe('invalid');
  });
});

describe('SWD-039: nextMapCode', () => {
  it('the worked example: 27P3QX8 → 28P3QXA (same config and deck seed, deal index n + 1, a new check)', () => {
    expect(nextMapCode('27P3QX8', WORDS)).toBe('28P3QXA');
  });

  it('for every config, n → n + 1 while valid; null after the last valid n (16 for Whole family, 17 for + Harder words)', () => {
    const rng = createRng('next-map');
    for (let i = 0; i < 500; i++) {
      const board: BoardSize = rng.int(2) ? 'easy' : 'full';
      const words: Audience = rng.int(2) ? 'grownups' : 'family';
      const d = rng.int(DECKS);
      const last = lastN(board, words);
      expect(last).toBe(words === 'family' ? 16 : 17);
      const n = rng.int(last + 1);
      const code = oracleCode({ edition: 1, board, words }, d, n);
      expect(nextMapCode(code, WORDS), code).toBe(n < last ? oracleCode({ edition: 1, board, words }, d, n + 1) : null);
    }
  });
});
