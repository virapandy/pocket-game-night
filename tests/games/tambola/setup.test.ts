// Setup and settings: specs/tambola/04-house-rules.md (TAM-045), 06-room-and-host.md (TAM-060, TAM-130),
// 09-usability.md (TAM-135), specs/platform/01-lifecycle.md (PLT-024: renaming during a game).
import { describe, expect, it } from 'vitest';
import { startMatch } from '../../../src/engine';
import { defaults, Game, rules, setupInput, T0 } from './helpers';

/** A setup is refused if setup() throws or the invariants report a problem straight away. */
function refused(input: unknown): boolean {
  expect(rules, 'tambolaRules is not exported yet').toBeDefined();
  try {
    const state = rules.setup(input);
    return rules.invariants(state).length > 0;
  } catch {
    return true;
  }
}

describe('TAM-060 and TAM-130: a new game starts with the room-ritual defaults and the conventions', () => {
  it('the phone does not speak, nothing is auto-marked, no Claim buttons, verdicts on the host phone only', () => {
    expect(defaults).toMatchObject({ speakCalls: false, autoMark: false, claimButtons: false, verdictsOnPhones: false });
  });

  it('house rules default to the conventions', () => {
    expect(defaults).toMatchObject({
      ties: 'share',
      lateClaims: 'bogey',
      bogey: 'out',
      ticketsPerPlayer: 1,
      maxTicketsPerPlayer: 3,
      lateJoinUntil: 10,
      autoCall: 'off',
    });
  });

  it('TAM-154: family-friendly rhymes; TAM-135: vibration and sound on', () => {
    expect(defaults.rhymes.familyFriendly).toBe(true);
    expect(defaults).toMatchObject({ vibrate: true, sound: true });
  });

  it('settings cannot be changed by a move during a game (a change applies to later games only)', () => {
    const g = new Game().call(3);
    const before = g.match.setup.config.settings;
    for (const move of [
      { type: 'settings', settings: { bogey: 'carry-on' } },
      { type: 'set-setting', key: 'bogey', value: 'carry-on' },
    ]) {
      expect(g.try(move).ok).toBe(false);
    }
    expect(g.match.setup.config.settings).toEqual(before);
  });
});

describe('TAM-045: 1 to 3 tickets per player', () => {
  it.each([1, 2, 3])('%i tickets is allowed', (tickets) => {
    expect(refused(setupInput({ players: [{ id: 'p1', name: 'Riya', tickets }, { id: 'p2', name: 'Asha' }] }))).toBe(false);
  });

  it.each([0, 4])('%i tickets is refused', (tickets) => {
    const input = setupInput({ players: [{ id: 'p1', name: 'Riya', tickets: 1 }, { id: 'p2', name: 'Asha' }] });
    input.config.players[0].tickets = tickets;
    expect(refused(input)).toBe(true);
  });
});

describe('TAM-082 at setup: tiers must add up to the pot', () => {
  it('a money game whose tiers do not add up to tickets × contribution is refused', () => {
    const input = setupInput();
    input.config.tiers[0].amount += 10;
    expect(refused(input)).toBe(true);
  });

  it('a game with tiers that add up starts', () => {
    const m = startMatch(rules, setupInput(), T0);
    expect(rules.invariants(m.state)).toEqual([]);
    expect(rules.isOver(m.state)).toBe(false);
  });
});

describe('PLT-024: players can be renamed at any time during the game', () => {
  it('a rename shows in the views and the summary', () => {
    const g = new Game().call(8);
    g.do({ type: 'rename', playerId: 'p1', name: 'Riya S' });
    expect(g.host.players.find((p: any) => p.id === 'p1').name).toBe('Riya S');
    g.do({ type: 'end' });
    expect(g.summary.money.people.find((p: any) => p.personId === 'p1').name).toBe('Riya S');
  });

  it('two players cannot have the same name', () => {
    const g = new Game().call(2);
    expect(g.try({ type: 'rename', playerId: 'p1', name: 'Asha' }).ok).toBe(false);
    expect(g.try({ type: 'rename', playerId: 'p1', name: ' asha ' }).ok).toBe(false);
    expect(g.host.players.find((p: any) => p.id === 'p1').name).toBe('Riya');
  });

  it('a blank name is refused', () => {
    expect(new Game().try({ type: 'rename', playerId: 'p1', name: '  ' }).ok).toBe(false);
  });

  it('two players with the same name cannot be set up', () => {
    expect(refused(setupInput({ players: [{ id: 'p1', name: 'Riya' }, { id: 'p2', name: 'Riya' }] }))).toBe(true);
  });
});

describe('Legal moves (contract): the host has a short, finite list', () => {
  it('before the end: call, end and discard; after the end: nothing', () => {
    const g = new Game();
    const types = rules.legalMoves(g.match.state, 'host').map((m: any) => m.type).sort();
    expect(types).toEqual(expect.arrayContaining(['call', 'discard', 'end']));
    expect(rules.detailMoves).toEqual(expect.arrayContaining(['claim', 'rename']));
    g.do({ type: 'end' });
    expect(rules.legalMoves(g.match.state, 'host')).toEqual([]);
  });

  it('a player phone has no moves with paper tickets', () => {
    expect(rules.legalMoves(new Game().match.state, 'p1')).toEqual([]);
  });

  it('a move from a player instead of the host is refused', () => {
    const g = new Game();
    const r = rules.apply(g.match.state, { type: 'call' }, { by: 'p1', at: T0 + 1 });
    expect(r.ok).toBe(false);
  });
});
