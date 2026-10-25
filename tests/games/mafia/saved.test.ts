// Section 10 (saved data, C3): MAF-093 what a game night keeps and replays; the format version (IMP-096); the fixture
// that must always open; IMP-097 (keep); the flows the browser tests open (MAF-H6); MAF-H2/H3/H5 test seeds. Also the
// facts behind section 07's results (MAF-060 night lines, MAF-062 fun lines, MAF-064 summary; items 15, 17, 18, 19).
// specs/mafia/10-lifecycle.md, 07-results.md; rule API specs/mafia/api.md ("The game night"). Written before the build,
// 25 October 2026.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readSavedGame, replay } from '../../../src/engine';
import {
  EXAMPLE_DEAL, EXAMPLE_SEED, GameNight, NINE, STORIES, exampleNight, oracleNightOrder, oracleStory, randomNight, readMafiaNight,
  readTestSeeds, savedOf, type Role,
} from './helpers';
import { DEAL_2, FLOWS, GAME_1, NIGHT_1, NIGHT_2, NIGHT_3, savedFlow } from './flows';

/* eslint-disable @typescript-eslint/no-explicit-any */
const OUT_IDS = STORIES.filter((s) => s.kind === 'out').map((s) => s.id);
const SAVED_IDS = STORIES.filter((s) => s.kind === 'saved').map((s) => s.id);
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/mafia-saved-nights-v1.json', import.meta.url)), 'utf8')).nights as any[];
const asPicks = (list: any[]) => list.map((m) => ({ player: m.player, target: m.target }));

/** What readMafiaNight must say about game 1 of the example (the MAF-040 worked example), worked out by hand. */
function expectedGame1() {
  const s1 = oracleStory(EXAMPLE_SEED, 1, 1, OUT_IDS, []);
  return {
    number: 1, players: NINE, mafiaCount: 2, roles: EXAMPLE_DEAL, deals: 1, over: true, winner: 'village', endedEarly: false,
    nights: [
      { night: 1, turns: oracleNightOrder(NINE, 1, 1), picks: asPicks(NIGHT_1), mafia: ['Kabir', 'Kabir'], target: 'Kabir', chosen: false,
        protected: 'Meena', checked: { player: 'Zoya', mafia: true }, out: 'Kabir', left: [], storyId: s1 },
      { night: 2, turns: oracleNightOrder(NINE, 1, 2), picks: asPicks(NIGHT_2), mafia: ['Riya', 'Riya'], target: 'Riya', chosen: false,
        protected: 'Riya', checked: { player: 'Arjun', mafia: true }, out: null, left: [], storyId: oracleStory(EXAMPLE_SEED, 1, 2, SAVED_IDS, []) },
      { night: 3, turns: oracleNightOrder(NINE, 1, 3), picks: asPicks(NIGHT_3), mafia: ['Meena'], target: 'Meena', chosen: false,
        protected: 'Sunita', checked: { player: 'Sunita', mafia: false }, out: 'Meena', left: [], storyId: oracleStory(EXAMPLE_SEED, 1, 3, OUT_IDS, [s1]) },
    ],
    votes: [
      { day: 1, tie: null, out: 'Om', nobody: null }, { day: 2, tie: null, out: 'Zoya', nobody: null }, { day: 3, tie: null, out: 'Arjun', nobody: null },
    ],
    left: [],
    // Riya named a Mafia on all 3 nights she picked while in (item 17).
    spotter: { player: 'Riya', nights: 3, of: 3 },
    // Kabir and Om both guessed a Mafia twice as ghosts; Kabir sits first (Meena never guessed; Zoya, a Mafia, is not counted).
    ghost: 'Kabir',
  };
}

describe('MAF-093 what a finished game keeps (readMafiaNight)', () => {
  it('the example game: players in seat order, every role, every night\'s picks (Villagers and ghosts too), the Mafia\'s choice, votes, stories', () => {
    const g = exampleNight().dealAll();
    for (const m of GAME_1.slice(10)) g.must(m);
    const night = readMafiaNight(savedOf(g));
    expect(night).not.toBeNull();
    expect(night.seeds).toEqual({ roles: EXAMPLE_SEED });
    expect(night.games).toEqual([expectedGame1()]);
    expect(night.tally).toEqual({ village: 1, mafia: 0 });
    expect(night.ended).toBe(false);
    expect(night.keep).toBe(true);
    // Item 19: History's "3 nights" counts resolved nights; "The Village won".
    expect(night.games[0].nights).toHaveLength(3);
  });
  it('the Mafia\'s random choice is kept: the worked example (Kabir and Om) is chosen: true, target Om', () => {
    const g = exampleNight().dealAll();
    g.night({ Arjun: 'Kabir', Zoya: 'Om', Meena: 'Meena' });
    const n = readMafiaNight(savedOf(g)).games[0].nights[0];
    expect(n).toMatchObject({ mafia: ['Kabir', 'Om'], target: 'Om', chosen: true, out: 'Om' });
  });
  it('leavers are kept: a night leave in the night\'s left and as { when: night }; a day leave as { when: day }', () => {
    const g = exampleNight().dealAll();
    g.startNight();
    g.pickNow();
    g.leave('Neha');
    g.night();
    g.leave('Sunita');
    const game = readMafiaNight(savedOf(g)).games[0];
    expect(game.nights[0].left).toEqual(['Neha']);
    expect(game.left).toEqual([{ player: 'Neha', when: 'night', round: 1 }, { player: 'Sunita', when: 'day', round: 1 }]);
    expect(game.over).toBe(false);
  });
  it('a tie and the two kinds of nobody are kept in votes', () => {
    const g = exampleNight().dealAll();
    g.night();
    g.must({ type: 'tie', players: ['Om', 'Neha'] }).nobody('secondTie');
    g.night();
    g.nobody('chosen');
    const votes = readMafiaNight(savedOf(g)).games[0].votes;
    expect(votes).toEqual([
      { day: 1, tie: ['Om', 'Neha'], out: null, nobody: 'secondTie' },
      { day: 2, tie: null, out: null, nobody: 'chosen' },
    ]);
  });
  it('replay of the saved moves gives the same state, for every flow and 300 random game nights', () => {
    for (let i = 0; i < 300; i++) {
      const { g } = randomNight(`replay-${i}`);
      const saved = savedOf(g);
      const re = replay(g.rules, saved.setup, saved.records);
      expect(re.ok).toBe(true);
      if (re.ok) expect(re.value.state).toEqual(g.state);
      expect(readMafiaNight(JSON.parse(JSON.stringify(saved)))).toEqual(readMafiaNight(saved));
    }
  });
  it('readMafiaNight of something else is null (another game, a damaged game night)', () => {
    const saved = savedFlow(FLOWS[0]!);
    expect(readMafiaNight({ ...saved, gameType: 'impostor' })).toBeNull();
    expect(readMafiaNight({ ...saved, records: [...saved.records, { v: 1, seq: 99, at: saved.updatedAt + 1, by: 'host', move: { type: 'voteOut', player: 'Nobody' } }] })).toBeNull();
  });
});

describe('MAF-093 / IMP-096 saved data carries a format version and old game nights always open', () => {
  it('a saved game night reads through the engine\'s readSavedGame at format 2', () => {
    const r = readSavedGame(savedFlow(FLOWS[FLOWS.length - 1]!));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.game.format).toBe(2);
  });
  it('every game night of tests/fixtures/mafia-saved-nights-v1.json opens and replays', () => {
    expect(FIXTURE.length).toBeGreaterThanOrEqual(6);
    const rules = new GameNight().rules;
    for (const saved of FIXTURE) {
      const read = readSavedGame(saved);
      expect(read.ok, saved.id).toBe(true);
      expect(replay(rules, saved.setup, saved.records).ok, saved.id).toBe(true);
      expect(readMafiaNight(saved), saved.id).not.toBeNull();
    }
  });
  it('the fixture\'s finished example still reads exactly as on 25 October', () => {
    const night = readMafiaNight(FIXTURE.find((s) => s.id === 'mafia-v1-game1-over'));
    expect(night.games).toEqual([expectedGame1()]);
  });
});

describe('IMP-097 a game night with no game past the deal is not kept', () => {
  it('keep is false while only dealing (and after a game ended in the deal), true once a night 1 has started', () => {
    const g = exampleNight();
    expect(readMafiaNight(savedOf(g)).keep).toBe(false);
    g.dealAll();
    expect(readMafiaNight(savedOf(g)).keep).toBe(false);
    g.must({ type: 'endGame' });
    expect(readMafiaNight(savedOf(g)).keep).toBe(false);
    g.must(g.legal().find((m) => m.type === 'start')).dealAll().startNight();
    expect(readMafiaNight(savedOf(g)).keep).toBe(true);
  });
});

describe('MAF-H6 every flow the browser tests open replays through the rules', () => {
  for (const f of FLOWS) {
    it(`flow "${f.name}" (${f.what}) is accepted move by move`, () => {
      const saved = savedFlow(f);
      const rules = new GameNight().rules;
      const re = replay(rules, saved.setup, saved.records);
      if (!re.ok) throw new Error(`flow ${f.name}: ${re.reason}`);
      expect(readMafiaNight(saved)).not.toBeNull();
    });
  }
  it('the flows land on the steps the browser tests expect', () => {
    const rules = new GameNight().rules;
    const stepOf = (name: string) => {
      const saved = savedFlow(FLOWS.find((f) => f.name === name)!);
      const re = replay(rules, saved.setup, saved.records);
      if (!re.ok) throw new Error(re.reason);
      return rules.view(re.value.state, { kind: 'room' });
    };
    expect(stepOf('deal-arjun')).toMatchObject({ step: 'deal', turn: { player: 'Arjun', i: 2, of: 9 } });
    expect(stepOf('deal-start')).toMatchObject({ step: 'deal', turn: { player: 'Riya', i: 1, of: 9 } });
    expect(stepOf('night1-start')).toMatchObject({ step: 'nightStart', round: 1 });
    expect(stepOf('night1-meena')).toMatchObject({ step: 'night', round: 1, turn: { player: 'Meena', i: 3, of: 9 } });
    expect(stepOf('night3-meena')).toMatchObject({ step: 'night', round: 3, turn: { player: 'Meena', i: 1 } });
    expect(stepOf('night3-dev')).toMatchObject({ step: 'night', round: 3, turn: { player: 'Dev', i: 4 } });
    expect(stepOf('night1-dev')).toMatchObject({ step: 'night', round: 1, turn: { player: 'Dev', i: 6, of: 9 } });
    expect(stepOf('police-nobody-left')).toMatchObject({ step: 'night', round: 6, out: [], turn: { player: 'Dev', i: 1, of: 6 } });
    expect(stepOf('morning1')).toMatchObject({ step: 'day', round: 1, morning: { out: 'Kabir' } });
    expect(stepOf('day1-tie')).toMatchObject({ step: 'revote', tied: ['Om', 'Neha'] });
    expect(stepOf('night2-meena')).toMatchObject({ step: 'night', round: 2, turn: { player: 'Meena', i: 2, of: 9 } });
    expect(stepOf('morning2')).toMatchObject({ step: 'day', round: 2, morning: { out: null } });
    expect(stepOf('vote2')).toMatchObject({ step: 'nightStart', round: 3, vote: { player: 'Zoya', role: 'mafia' }, caught: 1 });
    expect(stepOf('game1-over')).toMatchObject({ step: 'gameOver', winner: 'village', game: 1 });
    expect(stepOf('game2-over')).toMatchObject({ step: 'gameOver', winner: null, game: 2, tally: { village: 1, mafia: 0 } });
    expect(stepOf('day1-left-neha')).toMatchObject({ step: 'day', left: ['Neha'] });
    expect(stepOf('left-neha-ended')).toMatchObject({ step: 'gameOver', winner: null, left: ['Neha'] });
    expect(stepOf('day3')).toMatchObject({ step: 'day', round: 3, morning: { out: 'Meena' }, caught: 1 });
    expect(stepOf('worked-example-ended')).toMatchObject({ step: 'gameOver', winner: null, morning: { out: 'Om' } });
  });
});

describe('MAF-062 fun lines and MAF-064 tonight\'s summary (the facts, items 15 and 17)', () => {
  it('two games (Village win, then ended early): games 2, tally Village 1 · Mafia 0, spotter Riya; game 2 has no fun lines', () => {
    const night = readMafiaNight(savedFlow(FLOWS.find((f) => f.name === 'game2-over')!));
    expect(night.games).toHaveLength(2);
    expect(night.games[1]).toMatchObject({ number: 2, roles: DEAL_2, over: true, winner: null, endedEarly: true, nights: [], spotter: null, ghost: null });
    expect(night.tally).toEqual({ village: 1, mafia: 0 });
    expect(night.summary).toEqual({ players: 9, games: 2, mostMafia: null, spotter: 'Riya' });
  });
  it('"Arjun was Mafia in 2 games": the player Mafia in the most games, at least 2; ties: seat order', () => {
    const third: Record<string, Role> = { ...DEAL_2, Riya: 'villager', Arjun: 'mafia' };   // Arjun and Om Mafia
    const g = new GameNight({ deals: { 1: EXAMPLE_DEAL, 2: DEAL_2, 3: third } });
    for (let k = 1; k <= 3; k++) g.must({ type: 'start', players: NINE, mafiaCount: 2 }).must({ type: 'endGame' });
    const night = readMafiaNight(savedOf(g));
    // Arjun: games 1 and 3; Om: games 2 and 3; Arjun sits first.
    expect(night.summary).toEqual({ players: 9, games: 3, mostMafia: { player: 'Arjun', games: 2 }, spotter: null });
    expect(night.tally).toEqual({ village: 0, mafia: 0 });
  });
  it('"players" counts everyone dealt in any game tonight (an added player too)', () => {
    const g = exampleNight();
    g.must({ type: 'addNext', name: 'Imran' }).must({ type: 'endGame' });
    g.must(g.legal().find((m) => m.type === 'start')).must({ type: 'endGame' });
    expect(readMafiaNight(savedOf(g)).summary.players).toBe(10);
  });
});

describe('MAF-H2, H3, H5 readTestSeeds (development and preview builds only)', () => {
  const full = { seeds: { roles: 'mafia-example' }, deals: { 1: EXAMPLE_DEAL }, stories: { out: ['MAFS-01', 'MAFS-02'], saved: ['MAFS-16'] } };
  it('reads the "mafia" part of pgn.test.seeds, with only the keys present', () => {
    expect(readTestSeeds(JSON.stringify({ mafia: full }), false)).toEqual(full);
    expect(readTestSeeds(JSON.stringify({ mafia: { seeds: { roles: 'x' } } }), false)).toEqual({ seeds: { roles: 'x' } });
    expect(readTestSeeds(JSON.stringify({ deals: [{ impostor: 'Riya' }], mafia: { deals: { 2: DEAL_2 } } }), false)).toEqual({ deals: { 2: DEAL_2 } });
  });
  it('is null in the release build, when missing, not JSON, not an object, with no "mafia" object or a part of the wrong type', () => {
    expect(readTestSeeds(JSON.stringify({ mafia: full }), true)).toBeNull();
    for (const raw of [null, 'not json', '[]', '3', '{}', '{"mafia":3}', '{"mafia":{"seeds":{"roles":5}}}', '{"mafia":{"stories":{"out":"MAFS-01"}}}', '{"mafia":{"deals":[]}}']) {
      expect(readTestSeeds(raw, false), String(raw)).toBeNull();
    }
  });
});
