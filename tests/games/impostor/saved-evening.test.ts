// Saved evenings (specs/impostor/10-lifecycle.md, C3): IMP-096, the rules side. The fixture
// tests/fixtures/impostor-saved-evenings.json is a SavedGame of exactly IMP-096's shape; it must always open.
// The app side (it opens on the phone, and the app saves this shape at every move) is in
// tests/browser/impostor-saved-evenings.spec.ts.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readSavedGame, replay, SAVED_GAME_FORMAT } from '../../../src/engine';
import { Evening, P4, readImpostorEvening, rules } from './helpers';

const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/impostor-saved-evenings.json', import.meta.url)), 'utf8'));

describe('IMP-096: saved evenings carry a format version', () => {
  it('the engine\'s current format is still 2, so the fixture is a current saved game (never format 1)', () => {
    expect(SAVED_GAME_FORMAT).toBe(2);
    for (const g of [fixture.ended, fixture.inProgress]) {
      expect(g.format).toBe(2);
      expect(g.gameType).toBe('impostor');
    }
  });

  it('the fixture opens with readSavedGame, unchanged', () => {
    for (const g of [fixture.ended, fixture.inProgress]) {
      const r = readSavedGame(g);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.game).toEqual(g);
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

  it('the fixture replays with the rules, using its forced deals exactly as live', () => {
    const r = replay(rules(), fixture.ended.setup, fixture.ended.records);
    expect(r.ok, !r.ok ? r.reason : '').toBe(true);
    if (r.ok) expect(rules().isOver(r.value.state)).toBe(true);
    // Round by round: after each reveal (or "Still a tie") the views name the forced impostor and word.
    const recs = fixture.ended.records;
    const ends = recs.filter((x: any) => x.move.type === 'reveal' || x.move.type === 'stillTie').map((x: any) => x.seq);
    ends.forEach((seq: number, k: number) => {
      const upTo = replay(rules(), fixture.ended.setup, recs.filter((x: any) => x.seq <= seq));
      expect(upTo.ok).toBe(true);
      if (!upTo.ok) return;
      const host = rules().view(upTo.value.state, { kind: 'host' });
      expect(host).toMatchObject({ round: k + 1, impostor: fixture.expect.rounds[k].impostor, wordId: fixture.expect.rounds[k].wordId });
    });
  });

  it('the evening in progress replays to round 3\'s deal, with Riya and Arjun done', () => {
    const r = replay(rules(), fixture.inProgress.setup, fixture.inProgress.records);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const e = Evening.from(r.value);
    expect(e.host()).toMatchObject({ round: 3, practice: false, players: P4, starter: null });
    expect(e.isOver()).toBe(false);
    e.must({ type: 'seen' }).must({ type: 'seen' });
    expect(P4).toContain(e.host().starter);
  });

  it('later moves (setPlayers, setChoices) are moves, never changes to the saved setup', () => {
    // Up to round 2's result (its reveal of Riya, record 18): between rounds.
    const r = replay(rules(), fixture.ended.setup, fixture.ended.records.slice(0, 18));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const e = Evening.from(r.value);
    const setup = e.match.setup;
    e.must({ type: 'setPlayers', players: [...P4, 'Zoya'] });
    e.must({ type: 'setChoices', choices: { ...setup.config.choices, mode: 'hard' } });
    expect(e.match.setup).toEqual(fixture.ended.setup);
    expect(readImpostorEvening({ ...fixture.ended, records: e.match.records, status: 'in-progress' }).players).toEqual(P4);
  });
});
