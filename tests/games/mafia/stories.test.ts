// MAF-037 the morning story (C3: the stories file and the pick), MAF-P5, MAF-H5. specs/mafia/04-day.md (items 10, 32);
// rule API specs/mafia/api.md. The stories: docs/games/mafia/stories.csv, edition 1.2 (22 stories: 12 out, 10 saved).
// Written before the build, 25 October 2026.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_SEED, GameNight, NINE, QUIET_NIGHT, STORIES, exampleNight, oracleStory, randomNight, storyText, type Role,
} from './helpers';
import { NIGHT_1, NIGHT_2 } from './flows';

/* eslint-disable @typescript-eslint/no-explicit-any */
const FILE = fileURLToPath(new URL('../../../content/mafia/stories.json', import.meta.url));
const OUT_IDS = STORIES.filter((s) => s.kind === 'out').map((s) => s.id);
const SAVED_IDS = STORIES.filter((s) => s.kind === 'saved').map((s) => s.id);

describe('MAF-037 content/mafia/stories.json (edition 1.2)', () => {
  it('the CSV itself: 22 stories, 12 out and 10 saved, ids unique; every out story names {NAME}, no saved story does', () => {
    expect(STORIES).toHaveLength(22);
    expect(OUT_IDS).toHaveLength(12);
    expect(SAVED_IDS).toHaveLength(10);
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(22);
    for (const s of STORIES) {
      if (s.kind === 'out') expect(s.text, s.id).toContain('{NAME}');
      else expect(s.text, s.id).not.toContain('{NAME}');
    }
  });
  it('content/mafia/stories.json is the CSV row for row: { id, kind, text }, notes left out', () => {
    expect(existsSync(FILE), 'content/mafia/stories.json is not built yet').toBe(true);
    const json = JSON.parse(readFileSync(FILE, 'utf8'));
    expect(json).toEqual(STORIES);
  });
});

describe('MAF-037 the story each morning', () => {
  it('night 1 of the example (Kabir out): an out story, pick(unused out stories in id order, `mafia-example:1:story1`), every {NAME} replaced', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    for (const m of NIGHT_1) g.must(m);
    const id = oracleStory(EXAMPLE_SEED, 1, 1, OUT_IDS, []);
    expect(g.room.morning).toEqual({ story: storyText(id, 'Kabir'), storyId: id, out: 'Kabir' });
    expect(g.room.morning.story).not.toContain('{NAME}');
  });
  it('night 2 (the Doctor saved Riya): a saved story, with `mafia-example:1:story2`; it names nobody', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    for (const m of NIGHT_1) g.must(m);
    g.voteOut('Om').startNight();
    for (const m of NIGHT_2) g.must(m);
    const id = oracleStory(EXAMPLE_SEED, 1, 2, SAVED_IDS, []);
    expect(g.room.morning).toEqual({ story: storyText(id, null), storyId: id, out: null });
    for (const p of NINE) expect(g.room.morning.story).not.toContain(p);
  });
  it('no Mafia pick: the fixed line "A quiet night. Nobody is out!", no story id', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.leave('Arjun');
    g.leave('Zoya');
    g.night();
    expect(g.room.morning).toEqual({ story: QUIET_NIGHT, storyId: null, out: null });
  });
});

describe('MAF-H5 a short story list: reuse only when every story of a kind has been used', () => {
  // 1 Mafia (Arjun) and a Doctor (Meena) who never saves: 9 players; Arjun puts out a Villager each night, every day nobody
  // is voted out, so nights go on long enough to use the 2 out stories twice.
  const deal: Record<string, Role> = { Riya: 'villager', Arjun: 'mafia', Meena: 'doctor', Kabir: 'villager', Zoya: 'villager', Dev: 'police', Om: 'villager', Sunita: 'villager', Neha: 'villager' };
  it('with out = [MAFS-03, MAFS-01] and saved = [MAFS-16]: the stories follow the rule, the list sorted by id, used up before reuse', () => {
    for (const seed of ['h5-a', 'h5-b', 'h5-c', 'h5-d', 'h5-e']) {
      const g = new GameNight({ seed, deals: { 1: deal }, stories: { out: ['MAFS-03', 'MAFS-01'], saved: ['MAFS-16'] } }).start(NINE, 1).dealAll();
      const victims = ['Riya', 'Kabir', 'Zoya', 'Om'];
      const used: string[] = [];
      victims.forEach((v, i) => {
        const r = i + 1;
        g.night({ Arjun: v, Meena: i === 0 ? 'Meena' : (['Dev', 'Sunita'][i % 2] as string) });
        const expected = oracleStory(seed, 1, r, ['MAFS-03', 'MAFS-01'], used.length >= 2 ? used.slice(2) : used);
        expect(g.room.morning.storyId, `${seed} night ${r}`).toBe(expected);
        expect(g.room.morning.story).toBe(storyText(expected, v));
        used.push(expected);
        if (g.room.step === 'day') g.nobody().startNight();
      });
      expect(new Set(used.slice(0, 2)).size, `${seed}: both out stories before any repeat`).toBe(2);
    }
  });
});

describe('MAF-P5 over random game nights: no story repeats in a game while an unused one of its kind remains', () => {
  it('2,000 random game nights with the full list: within each game, each kind\'s stories are all different until all are used; saved stories name nobody', () => {
    for (let i = 0; i < 2000; i++) {
      const { steps } = randomNight(`p5-${i}`);
      let byGame = new Map<number, { out: string[]; saved: string[] }>();
      // An Undo (unleave, unEndGame) takes the game back to before the move it undoes: so do the stories used.
      const before: Map<number, { out: string[]; saved: string[] }>[] = [];
      const copy = (m: typeof byGame) => new Map([...m].map(([k, v]) => [k, { out: [...v.out], saved: [...v.saved] }]));
      for (const s of steps) {
        if (!s.ok) continue;
        if (s.move.type === 'unleave' || s.move.type === 'unEndGame') {
          // A deal leave's Undo also undoes its redeal: back two moves (no stories in the deal either way).
          if (s.before.step === 'deal') before.pop();
          byGame = before.pop() ?? byGame;
          continue;
        }
        before.push(copy(byGame));
        if (!s.after.morning || s.before.step !== 'night' || s.after.step === 'night') continue;
        const m = s.after.morning;
        if (m.storyId === null) { expect(m.story).toBe(QUIET_NIGHT); continue; }
        const kind = m.out === null ? 'saved' : 'out';
        expect(STORIES.find((x) => x.id === m.storyId)?.kind, `p5-${i}`).toBe(kind);
        const list = byGame.get(s.after.game) ?? { out: [], saved: [] };
        const all = kind === 'out' ? OUT_IDS : SAVED_IDS;
        const sinceReset = list[kind].slice(Math.floor(list[kind].length / all.length) * all.length);
        expect(sinceReset, `p5-${i} game ${s.after.game}: ${m.storyId} repeated`).not.toContain(m.storyId);
        list[kind].push(m.storyId);
        byGame.set(s.after.game, list);
        if (kind === 'saved') for (const p of s.after.players) expect(m.story, `p5-${i}`).not.toContain(p);
        else expect(m.story).toBe(storyText(m.storyId, m.out));
      }
    }
  });
});
