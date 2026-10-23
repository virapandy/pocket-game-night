// The saved game nights the lane D browser tests open (tests/browser/secret-words-d-evenings.ts) are written move by move,
// because the rules module can't load inside Playwright. This replays every one of them through the real rules (Test hooks
// item 1): every move accepted, the same boards dealt, the same winner, ended-early flag and face-down cells, and the saved
// evening reads back with readSecretWordsEvening. So a browser test never opens an evening the rules would refuse
// (SWD-050, 051, 054, 060, 064, 127, 128 as the browser tests use them).
import { afterEach, describe, expect, it } from 'vitest';
import { readSavedGame } from '../../../src/engine';
import { Evening, readSecretWordsEvening } from './helpers';
import { ALL_FLOWS, mirrorWith } from '../../browser/secret-words-d-evenings';

/* eslint-disable @typescript-eslint/no-explicit-any */

afterEach(() => mirrorWith(null));

describe('lane D browser evenings replay through the rules', () => {
  for (const [name, build] of ALL_FLOWS) {
    it(name, () => {
      mirrorWith((o) => new Evening(o) as any);
      const ev = build();
      const m = ev.mirror as unknown as Evening;
      expect(m.records.map((r) => r.move)).toEqual(ev.records.map((r) => r.move));
      const v = m.view();
      expect(v.winner).toBe(ev.winner);
      expect(v.endedEarly).toBe(ev.endedEarly);
      if (ev.winner === null && !ev.endedEarly) {
        for (const k of ['orange', 'teal', 'nobody', 'landmine'] as const) expect(m.faceDown(k), k).toEqual(ev.faceDown(k));
        expect(v.turn).toBe(ev.turn);
      }
      const read = readSavedGame(ev.saved());
      expect(read.ok).toBe(true);
      expect(() => readSecretWordsEvening((read as any).game)).not.toThrow();
    });
  }
});
