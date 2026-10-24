// MAF-037 / MAF-093 frozen story editions, and MAF-H2 the role seed is required (C3 review fixes, 25 October 2026).
// Rule API: specs/mafia/api.md ("Setup", "Stories"). Orchestrator calls made while the owner was away, listed in
// docs/test-questions.md (25 October, "Mafia review fixes").
import { afterAll, describe, expect, it, vi } from 'vitest';
import { startMatch } from '../../../src/engine';
import {
  GameNight, STORIES, T0, need, oracleStory, randomNight, readMafiaNight, savedOf, setupInput,
} from './helpers';
import { FLOWS, savedFlow } from './flows';

/* eslint-disable @typescript-eslint/no-explicit-any */
const OUT_IDS = STORIES.filter((s) => s.kind === 'out').map((s) => s.id);
const SAVED_IDS = STORIES.filter((s) => s.kind === 'saved').map((s) => s.id);
const storyIdsOf = (night: any): (string | null)[][] => night.games.map((g: any) => g.nights.map((n: any) => n.storyId));

describe('MAF-037 / MAF-093 the story edition (exports)', () => {
  it('MAFIA_STORY_EDITION is "1.2"; mafiaStoryEditions["1.2"] holds exactly the CSV\'s ids by kind, in row order', () => {
    expect(need('MAFIA_STORY_EDITION')).toBe('1.2');
    const editions = need<any>('mafiaStoryEditions');
    expect(editions['1.2']).toEqual({ out: OUT_IDS, saved: SAVED_IDS });
  });
});

describe('MAF-037 / MAF-093 stories come only from the game night\'s edition', () => {
  it('a game night with no edition named plays exactly as one naming "1.2" (missing means 1.2)', () => {
    for (let i = 0; i < 40; i++) {
      const { g } = randomNight(`edition-${i}`);
      const saved = savedOf(g);
      const named = { ...saved, setup: { ...saved.setup, config: { ...saved.setup.config, edition: '1.2' } } };
      expect(readMafiaNight(named), `edition-${i}`).toEqual(readMafiaNight(saved));
    }
  });
  it('an unknown edition is refused: setup throws and readMafiaNight returns null', () => {
    const input = { ...setupInput(), config: { edition: '9.9' } };
    expect(() => startMatch(new GameNight().rules, input, T0)).toThrow();
    const saved = savedFlow(FLOWS.find((f) => f.name === 'morning1')!);
    expect(readMafiaNight(saved)).not.toBeNull();
    for (const edition of ['9.9', '', '1.1', 'latest']) {
      const bad = { ...saved, setup: { ...saved.setup, config: { ...saved.setup.config, edition } } };
      expect(readMafiaNight(bad), edition).toBeNull();
    }
  });
});

describe('MAF-093 a night saved under edition 1.2 replays with the same stories when stories.json gains new ids', () => {
  // New stories sort between and after the 1.2 ids, so picking from the whole file would change most mornings.
  const EXTRA = [
    { id: 'MAFS-06', kind: 'out', text: 'New story: {NAME} went to fetch the chai and never came back.' },
    { id: 'MAFS-12', kind: 'out', text: 'New story: {NAME} was found asleep on the balcony, for good.' },
    { id: 'MAFS-22', kind: 'saved', text: 'New story: the Doctor arrived just in time.' },
    { id: 'MAFS-27', kind: 'saved', text: 'New story: a close call, but everyone woke up.' },
  ];
  afterAll(() => {
    vi.doUnmock('../../../content/mafia/stories.json');
    vi.resetModules();
  });

  it('40 random game nights saved now read the same (every storyId) through a build whose stories.json has 4 more stories', async () => {
    const nights = Array.from({ length: 40 }, (_, i) => savedOf(randomNight(`frozen-${i}`, { games: 3 }).g));
    const before = nights.map((s) => readMafiaNight(JSON.parse(JSON.stringify(s))));

    vi.doMock('../../../content/mafia/stories.json', () => ({ default: [...STORIES, ...EXTRA] }));
    vi.resetModules();
    const fresh: any = await import(/* @vite-ignore */ '../../../src/games/mafia/index.ts');
    // The mock took effect: the later build's stories list has the new ids.
    expect((fresh.mafiaStories as any[]).map((s) => s.id)).toEqual(expect.arrayContaining(EXTRA.map((s) => s.id)));

    let wouldDiffer = 0;
    nights.forEach((saved, i) => {
      const after = fresh.readMafiaNight(JSON.parse(JSON.stringify(saved)));
      expect(after, `frozen-${i}`).not.toBeNull();
      expect(storyIdsOf(after), `frozen-${i}`).toEqual(storyIdsOf(before[i]));
      expect(after, `frozen-${i}`).toEqual(before[i]);
      // Count the mornings that would have changed had the stories been picked from the whole new file.
      for (const game of before[i].games) {
        const used: Record<string, string[]> = { out: [], saved: [] };
        for (const n of game.nights) {
          if (n.storyId === null) continue;
          const kind = n.out ? 'out' : 'saved';
          const all = [...(kind === 'out' ? OUT_IDS : SAVED_IDS), ...EXTRA.filter((s) => s.kind === kind).map((s) => s.id)];
          const unusedLeft = all.filter((id) => !used[kind]!.includes(id));
          if (unusedLeft.length === 0) used[kind] = [];
          if (oracleStory(before[i].seeds.roles, game.number, n.night, all, used[kind]!) !== n.storyId) wouldDiffer++;
          used[kind]!.push(n.storyId);
        }
      }
    });
    // The check above is meaningful: with the new file's ids, some mornings would have told another story.
    expect(wouldDiffer).toBeGreaterThan(0);
  });
});

describe('MAF-093 a night saved without an edition always replays as 1.2, even after the current edition changes', () => {
  const NIGHT_MODULE = '../../../src/games/mafia/rules/night.ts';
  afterAll(() => {
    vi.doUnmock(NIGHT_MODULE);
    vi.resetModules();
  });

  it('with MAFIA_STORY_EDITION moved to a new edition "2.0" (other stories), 40 nights saved with no edition read exactly as before', async () => {
    const nights = Array.from({ length: 40 }, (_, i) => savedOf(randomNight(`legacy-${i}`, { games: 3 }).g));
    const asNamed = (s: any, edition: string) => ({ ...s, setup: { ...s.setup, config: { ...s.setup.config, edition } } });
    const before = nights.map((s) => readMafiaNight(JSON.parse(JSON.stringify(s))));

    const NEW = { out: OUT_IDS.slice(-2), saved: SAVED_IDS.slice(-2) };
    vi.doMock(NIGHT_MODULE, async (importOriginal) => {
      const orig: any = await importOriginal();
      return { ...orig, MAFIA_STORY_EDITION: '2.0', STORY_EDITIONS: { ...orig.STORY_EDITIONS, '2.0': NEW } };
    });
    vi.resetModules();
    const fresh: any = await import(/* @vite-ignore */ '../../../src/games/mafia/index.ts');
    // The later build: the current edition is "2.0", and it exists.
    expect(fresh.MAFIA_STORY_EDITION).toBe('2.0');
    expect(fresh.mafiaStoryEditions['2.0']).toEqual(NEW);

    let differs = 0;
    nights.forEach((saved, i) => {
      const after = fresh.readMafiaNight(JSON.parse(JSON.stringify(saved)));
      expect(after, `legacy-${i}`).toEqual(before[i]);
      const as20 = fresh.readMafiaNight(asNamed(saved, '2.0'));
      if (JSON.stringify(storyIdsOf(as20)) !== JSON.stringify(storyIdsOf(before[i]))) differs++;
    });
    // The check is meaningful: had the missing edition been read as "2.0", the stories would differ.
    expect(differs).toBeGreaterThan(0);
  });
});

describe('MAF-093 readMafiaNight returns null on any damaged setup or record', () => {
  it('a setup that is missing, not an object, with config or seeds of the wrong kind, or a record that is not a move, reads as null', () => {
    const saved = savedFlow(FLOWS.find((f) => f.name === 'morning1')!);
    const damaged: any[] = [
      { ...saved, setup: null },
      { ...saved, setup: 'mafia' },
      { ...saved, setup: { ...saved.setup, seeds: null } },
      { ...saved, setup: { ...saved.setup, config: { ...saved.setup.config, edition: 5 } } },
      { ...saved, records: [...saved.records.slice(0, 3), { ...saved.records[3], move: null }] },
      { ...saved, records: [...saved.records.slice(0, 3), { ...saved.records[3], move: { type: 'leave', player: 'Neha', when: 'evening' } }] },
    ];
    damaged.forEach((d, i) => {
      let out: unknown = 'threw';
      try { out = readMafiaNight(d); } catch { /* recorded as threw */ }
      expect(out, `damaged ${i}`).toBeNull();
    });
  });
});

describe('MAF-H2 setup needs a non-empty seeds.roles', () => {
  it('setup without seeds.roles, with an empty one or one that is not text is refused (throws)', () => {
    const rules = new GameNight().rules;
    for (const seeds of [{}, { roles: '' }, { roles: 5 }, { roles: null }]) {
      expect(() => startMatch(rules, { gameId: 'mafia', seeds, config: {} } as any, T0), JSON.stringify(seeds)).toThrow();
    }
    expect(() => startMatch(rules, setupInput(), T0)).not.toThrow();
  });
  it('a saved game night with no role seed reads as null', () => {
    const saved = savedFlow(FLOWS.find((f) => f.name === 'morning1')!);
    for (const seeds of [{}, { roles: '' }]) {
      expect(readMafiaNight({ ...saved, setup: { ...saved.setup, seeds } }), JSON.stringify(seeds)).toBeNull();
    }
  });
});
