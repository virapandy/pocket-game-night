// The map stays private (specs/secret-words/02-deal.md SWD-025; SWD-123's partner; Test hooks item 1's player view).
// C3, written before the build, 22 October 2026. The browser half (the DOM of room screens) is
// tests/browser/secret-words-c3.spec.ts.
import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/engine';
import { Evening, exampleTeams, randomChoices, randomGame, ROOM } from './helpers';

/** The room view's face-down cells carry no kind, and nothing else in the view gives a face-down kind or the code away. */
function checkRoomView(e: Evening, where: string) {
  const view = e.view(ROOM);
  const board = e.board();
  const over = e.over();
  expect(view.cells.map((c: any) => c.word), where).toEqual(board.words);
  view.cells.forEach((c: any, i: number) => {
    if (over) expect(c.kind, `${where}: cell ${i} after game over`).toBe(board.kinds[i]);
    else if (c.kind !== undefined) expect(c.kind, `${where}: turned cell ${i}`).toBe(board.kinds[i]);
    // A face-down cell is exactly { word }: no kind, no other field.
    else expect(Object.keys(c), `${where}: face-down cell ${i}`).toEqual(['word']);
  });
  if (!over) {
    const json = JSON.stringify(view);
    expect(json, `${where}: the map code in the room view`).not.toContain(e.code());
    expect(json, `${where}: the deck seed`).not.toContain(e.seeds.deal);
    // The kinds list as a whole (the map) is never in the room view.
    expect(json, `${where}: the map in the room view`).not.toContain(JSON.stringify(board.kinds));
  }
}

describe('SWD-025: the map stays private', () => {
  it('Rule property: over 10,000 random games, viewFor(room) never contains a face-down cell\'s kind', () => {
    for (let i = 0; i < 10_000; i++) {
      const rng = createRng(`private-${i}`);
      const e = new Evening({ seed: `private-${i}`, choices: randomChoices(rng) });
      let step = 0;
      randomGame(e, rng, () => checkRoomView(e, `game ${i}, move ${++step}`));
      expect(e.over(), `game ${i} ended`).toBe(true);
    }
  });

  it('a guesser\'s player view is the room view; the clue giver\'s is the map (every cell with its kind)', () => {
    const e = new Evening({ seed: 'viewers' });
    e.deal();
    const board = e.board();
    for (const guesser of ['Meena', 'Zoya', 'Om', 'Kabir', 'Dev']) expect(e.view({ kind: 'player', playerId: guesser }), guesser).toEqual(e.view(ROOM));
    for (const giver of ['Riya', 'Arjun']) {
      const map = e.view({ kind: 'player', playerId: giver });
      expect(map.cells.map((c: any) => c.kind), giver).toEqual(board.kinds);
      expect(map.cells.map((c: any) => c.word), giver).toEqual(board.words);
    }
    expect(e.view({ kind: 'player', playerId: 'Nobody here' })).toEqual(e.view(ROOM));
  });

  it('SWD-123: a partner sees the map like the clue giver; the map follows the clue givers of the current game', () => {
    const e = new Evening({ seed: 'partner-view', teams: exampleTeams({ partners: { orange: 'Meena', teal: null } }) });
    e.deal();
    const kinds = e.board().kinds;
    expect(e.view({ kind: 'player', playerId: 'Meena' }).cells.map((c: any) => c.kind)).toEqual(kinds);
    expect(e.view({ kind: 'player', playerId: 'Zoya' })).toEqual(e.view(ROOM));
    e.must({ type: 'endGame' });
    e.must({ type: 'setClueGivers', clueGivers: { orange: 'Zoya', teal: 'Kabir' }, partners: { orange: null, teal: null } });
    e.deal();
    const k2 = e.board().kinds;
    expect(e.view({ kind: 'player', playerId: 'Zoya' }).cells.map((c: any) => c.kind)).toEqual(k2);
    expect(e.view({ kind: 'player', playerId: 'Kabir' }).cells.map((c: any) => c.kind)).toEqual(k2);
    for (const was of ['Riya', 'Arjun', 'Meena']) expect(e.view({ kind: 'player', playerId: was }), was).toEqual(e.view(ROOM));
  });
});
