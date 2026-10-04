// Saved evenings (specs/impostor/10-lifecycle.md, C3): IMP-096, the rules side, scenarios v3.5 (4 October 2026).
// The format fixture is tests/fixtures/impostor-saved-evenings-v3.json: SavedGames of exactly IMP-096's shape, with the
// dealt word id on every word-dealing move; it must always open. The v2.2 fixture, tests/fixtures/impostor-saved-
// evenings.json (no word ids), is now "a preview evening from before 3.1": it no longer replays, so the app hides it.
// The app side is in tests/browser/impostor-saved-evenings.spec.ts.
// Expected to fail (not built yet): tests marked `it.fails` need word ids in the moves and the last-chance guess
// setting (Impostor round 4, item 5). A marked test that starts passing turns red: then remove its `.fails` mark.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readSavedGame, replay, SAVED_GAME_FORMAT } from '../../../src/engine';
import { Evening, P4, changedChoices, readImpostorEvening, rules } from './helpers';

const read = (name: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../../fixtures/${name}`, import.meta.url)), 'utf8'));
const fixture = read('impostor-saved-evenings-v3.json');
const old = read('impostor-saved-evenings.json');

describe('IMP-096: saved evenings carry a format version', () => {
  it('the engine\'s current format is still 2, so the fixture is a current saved game (never format 1)', () => {
    expect(SAVED_GAME_FORMAT).toBe(2);
    for (const g of [fixture.ended, fixture.inProgress]) {
      expect(g.format).toBe(2);
      expect(g.gameType).toBe('impostor');
    }
  });

  it('the fixture opens with readSavedGame, unchanged', () => {
    for (const g of [fixture.ended, fixture.inProgress, old.ended, old.inProgress]) {
      const r = readSavedGame(g);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.game).toEqual(g);
    }
  });

  it('the fixture records the dealt word id on every word-dealing move (as the app must save them)', () => {
    for (const g of [fixture.ended, fixture.inProgress]) {
      for (const r of g.records) {
        if (['startDeal', 'nextRound', 'dealAgain', 'dontKnow', 'allowRepeats'].includes(r.move.type)) expect(r.move.wordId, `record ${r.seq}`).toMatch(/^IMPW-\d{3}$/);
      }
    }
  });

  it('readImpostorEvening gives the starting players, choices, excluded words, seeds, moves and status', () => {
    for (const g of [fixture.ended, fixture.inProgress]) {
      expect(readImpostorEvening(g)).toEqual({
        players: g.setup.config.players,
        choices: g.setup.config.choices,
        excludedWords: g.setup.config.excludedWords,
        seeds: g.setup.seeds,
        moves: g.records.map((r: any) => r.move),
        status: g.status,
      });
    }
  });

  it('the ended evening (last-chance guess off) replays with the rules, using its recorded word ids and forced deals exactly as live', () => {
    const r = replay(rules(), fixture.ended.setup, fixture.ended.records);
    expect(r.ok, !r.ok ? r.reason : '').toBe(true);
    if (r.ok) expect(rules().isOver(r.value.state)).toBe(true);
    const recs = fixture.ended.records;
    const ends = recs.filter((x: any) => x.move.type === 'reveal' || x.move.type === 'stillTie').map((x: any) => x.seq);
    expect(ends.length).toBe(3);
    ends.forEach((seq: number, k: number) => {
      const upTo = replay(rules(), fixture.ended.setup, recs.filter((x: any) => x.seq <= seq));
      expect(upTo.ok).toBe(true);
      if (!upTo.ok) return;
      const host = rules().view(upTo.value.state, { kind: 'host' });
      expect(host).toMatchObject({ round: k + 1, impostor: fixture.expect.ended.rounds[k].impostor, wordId: fixture.expect.ended.rounds[k].wordId });
    });
  });

  it('the evening in progress (last-chance guess on) replays to round 3\'s deal, with Riya and Arjun done', () => {
    const r = replay(rules(), fixture.inProgress.setup, fixture.inProgress.records);
    expect(r.ok, !r.ok ? r.reason : '').toBe(true);
    if (!r.ok) return;
    const e = Evening.from(r.value);
    expect(e.host()).toMatchObject({ round: 3, practice: false, players: P4, starter: null });
    expect(e.wordId()).toBe('IMPW-007');
    expect(e.isOver()).toBe(false);
    e.must({ type: 'seen' }).must({ type: 'seen' });
    expect(P4).toContain(e.host().starter);
  });

  it('later moves (setPlayers, setChoices) are moves, never changes to the saved setup', () => {
    // Up to round 2's result (its reveal of Riya, record 16): between rounds.
    const r = replay(rules(), fixture.ended.setup, fixture.ended.records.slice(0, 16));
    expect(r.ok, !r.ok ? r.reason : '').toBe(true);
    if (!r.ok) return;
    const e = Evening.from(r.value);
    e.must({ type: 'setPlayers', players: [...P4, 'Zoya'] });
    e.must({ type: 'setChoices', choices: changedChoices({ mode: 'hard', lastGuess: false }) });
    expect(e.match.setup).toEqual(fixture.ended.setup);
    expect(readImpostorEvening({ ...fixture.ended, records: e.match.records, status: 'in-progress' }).players).toEqual(P4);
  });

  it('an evening saved before 3.1, without word ids (the v2.2 fixture), no longer replays: the rules refuse it, so the app hides it', () => {
    for (const g of [old.ended, old.inProgress]) {
      const r = replay(rules(), g.setup, g.records);
      expect(r.ok, `${g.id} replays`).toBe(false);
    }
  });
});
