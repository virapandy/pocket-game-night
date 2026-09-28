// Undo, replay and the end of a game: specs/tambola/07-undo-replay-end.md, 10-lifecycle.md (TAM-140, TAM-141,
// TAM-143), and PLT-021. Money handed back when prizes are not won (TAM-066, TAM-088, TAM-089, TAM-093, TAM-144)
// is in handback.test.ts. Paper-ticket wins are recorded on the anchor's word (TAM-037).
import { describe, expect, it } from 'vitest';
import { moneyProblems, readSavedGame, replay, SAVED_GAME_FORMAT } from '../../../src/engine';
import { Game, rules, type Pattern } from './helpers';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('TAM-070: the host can undo a wrongly entered claim', () => {
  it('removes the claim and its prize; the pattern is open again; the rest is unchanged', () => {
    const g = new Game().call(10);
    g.win('top-line', 'p1');
    const claimRec = g.lastRecordOf('record-win');
    const called = g.called;
    const r = g.undo(claimRec.seq, claimRec.at + 60_000);
    expect(r.ok).toBe(true);
    expect(g.host.claims).toEqual([]);
    expect(g.host.openPatterns).toContain('top-line');
    expect(g.called).toEqual(called);
  });
});

describe('TAM-072: undo after later moves keeps those later moves', () => {
  it('3 numbers called after the wrong claim stay called, in the same order', () => {
    const g = new Game().call(10);
    g.win('top-line', 'p1');
    const claimRec = g.lastRecordOf('record-win');
    g.close('top-line').call(3);
    const called = g.called;
    expect(g.undo(claimRec.seq, g.clock + 1).ok).toBe(true);
    expect(g.called).toEqual(called);
    expect(g.host.claims).toEqual([]);
  });
});

describe('Ending a game can never be undone', () => {
  it('"end" is refused by undo', () => {
    const g = new Game().call(5).do({ type: 'end' });
    const rec = g.lastRecordOf('end');
    expect(g.undo(rec.seq, rec.at + 1).ok).toBe(false);
    expect(g.over).toBe(true);
  });
});

describe('TAM-073: any game can be replayed exactly', () => {
  it('replaying the setup and moves gives the same numbers, claims, rhymes and result', () => {
    const g = new Game({ seed: 'replay-me' }).call(12);
    g.do({ type: 'another-rhyme' });
    g.win('early-five', 'p1');
    g.bogey('p2', 'top-line');
    g.close('early-five').call(30);
    g.win('full-house', 'p3');
    g.finish();
    const again = g.replayed();
    expect(again.state).toEqual(g.match.state);
    expect(rules.view(again.state, { kind: 'host' })).toEqual(g.host);
  });

  it('a game saved as JSON and read back replays to the same result (TAM-143)', () => {
    const g = new Game({ seed: 'json-round-trip' }).call(40);
    g.win('full-house', 'p1');
    const saved = JSON.parse(JSON.stringify({ setup: g.match.setup, records: g.records }));
    const r = replay(rules, saved.setup, saved.records);
    expect(r.ok).toBe(true);
    if (r.ok) expect(rules.view(r.value.state, { kind: 'host' })).toEqual(g.host);
  });
});

describe('TAM-075 and TAM-046: the host ends the game after closing the last Full House tier', () => {
  it('Full House is closed by hand, then the host ends the game; the summary shows every pattern and who won it', () => {
    const g = new Game().call(8);
    g.win('early-five', 'p1');
    g.close('early-five').call(20);
    g.win('full-house', 'p3');
    expect(g.over).toBe(false);
    g.close('full-house');
    expect(g.over).toBe(false);
    expect(g.host.readyToEnd).toBe(true);
    expect(g.try({ type: 'call' }).ok).toBe(false);
    g.do({ type: 'end' });
    expect(g.over).toBe(true);
    expect(g.host.over).toBe(true);
    const tiers = g.summary.tiers;
    expect(tiers.map((t: any) => t.pattern).sort()).toEqual(['bottom-line', 'early-five', 'full-house', 'middle-line', 'top-line']);
    expect(tiers.find((t: any) => t.pattern === 'full-house').winners.map((w: any) => w.playerId)).toEqual(['p3']);
    expect(tiers.find((t: any) => t.pattern === 'early-five').winners.map((w: any) => w.playerId)).toEqual(['p1']);
    expect(g.try({ type: 'call' }).ok).toBe(false);
  });

  it('with a Second Full House tier, calling goes on after Full House is closed, until Second Full House is closed', () => {
    const tiers = [
      { pattern: 'early-five' as Pattern, amount: 40 },
      { pattern: 'full-house' as Pattern, amount: 160 },
      { pattern: 'second-full-house' as Pattern, amount: 100 },
    ];
    const g = new Game({ tiers }).call(30);
    g.win('full-house', 'p1');
    expect(g.win('second-full-house', 'p2').ok).toBe(false); // Full House first
    g.close('full-house');
    expect(g.host.readyToEnd).toBe(false);
    g.call(5);
    g.win('second-full-house', 'p2');
    g.close('second-full-house');
    expect(g.host.readyToEnd).toBe(true);
    g.do({ type: 'end' });
    expect(g.over).toBe(true);
  });
});

describe('TAM-076: when all 90 are called, every ticket is complete', () => {
  it('the host is told, can still record wins, and can end the game', () => {
    const g = new Game().call(90);
    expect(g.over).toBe(false);
    expect(g.host.allCalled).toBe(true);
    expect(g.win('top-line', 'p1').ok).toBe(true);
    expect(g.lastClaim.verdict).toBe('accepted');
    g.do({ type: 'end' });
    expect(g.over).toBe(true);
  });
});

describe('TAM-078 and TAM-089: the end-of-game summary is correct and balances', () => {
  it('lists each pattern with its winners, bogeys, calls made, and what each person paid and won', () => {
    const g = new Game({ players: [
      { id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha' }, { id: 'p3', name: 'Dad', tickets: 3 },
      { id: 'p4', name: 'Kabir' },
    ] }).call(6);
    g.win('early-five', 'p2');
    g.bogey('p4', 'top-line');
    g.closeAll().call(10);
    g.win('top-line', 'p1');
    g.closeAll().call(4);
    g.win('middle-line', 'p3');
    g.closeAll().call(3);
    g.win('bottom-line', 'p1');
    g.closeAll().call(20);
    g.win('full-house', 'p3');
    g.finish();

    const s = g.summary;
    expect(s.result).toBe('ended');
    expect(s.callsMade).toBe(g.called.length);
    expect(s.pot).toBe(7 * 50);
    expect(s.bogeys).toEqual([{ playerId: 'p4', pattern: 'top-line' }]);
    const winnersOf = (p: Pattern) => s.tiers.find((t: any) => t.pattern === p).winners.map((w: any) => w.playerId);
    expect(winnersOf('early-five')).toEqual(['p2']);
    expect(winnersOf('top-line')).toEqual(['p1']);
    expect(winnersOf('middle-line')).toEqual(['p3']);
    expect(winnersOf('bottom-line')).toEqual(['p1']);
    expect(winnersOf('full-house')).toEqual(['p3']);

    const money = s.money;
    expect(moneyProblems(money)).toEqual([]);
    const paid = Object.fromEntries(money.people.map((p: any) => [p.personId, p.paid]));
    expect(paid).toEqual({ p1: 100, p2: 50, p3: 150, p4: 50 });
    expect(sum(money.people.map((p: any) => p.won))).toBe(350);
    for (const t of s.tiers) expect(sum(t.winners.map((w: any) => w.amount))).toBe(t.amount);
    // TAM-141: only this game's people.
    expect(money.people.map((p: any) => p.personId).sort()).toEqual(['p1', 'p2', 'p3', 'p4']);
  });
});

describe('TAM-140: discarding a game with money', () => {
  it('the game is void: nobody wins, and each person gets their contribution back', () => {
    const g = new Game({ players: [{ id: 'p1', name: 'Riya', tickets: 2 }, { id: 'p2', name: 'Asha' }] }).call(10);
    g.win('early-five', 'p1');
    g.do({ type: 'discard' });
    expect(g.over).toBe(true);
    const s = g.summary;
    expect(s.result).toBe('discarded');
    for (const t of s.tiers) expect(t.winners).toEqual([]);
    expect(moneyProblems(s.money)).toEqual([]);
    for (const p of s.money.people) expect(p.won - p.paid).toBe(0);
  });
});

describe('TAM-090: a game with no money', () => {
  it('plays with text prizes, no amounts, and no money record', () => {
    const tiers = [
      { pattern: 'early-five' as Pattern, amount: 0, label: 'Chocolate' },
      { pattern: 'top-line' as Pattern, amount: 0, label: 'Ice cream' },
      { pattern: 'full-house' as Pattern, amount: 0, label: 'The big cake' },
    ];
    const g = new Game({ contribution: null, tiers }).call(10);
    g.win('top-line', 'p1');
    expect(g.lastClaim.verdict).toBe('accepted');
    g.closeAll().call(20);
    g.win('full-house', 'p2');
    g.finish();
    const s = g.summary;
    expect(s.money).toBeNull();
    expect(s.pot).toBeNull();
    expect(s.tiers.find((t: any) => t.pattern === 'top-line')).toMatchObject({ label: 'Ice cream', winners: [{ playerId: 'p1' }] });
  });
});

describe('TAM-143 and PLT-021: what a finished game keeps', () => {
  it('the setup holds players, tickets, contribution, tiers and seeds; the records hold every call and claim', () => {
    const g = new Game().call(10);
    g.win('early-five', 'p1');
    g.do({ type: 'end' });
    const { setup, records } = g.match;
    expect(setup.config.players).toHaveLength(6);
    expect(setup.config.money).toEqual({ currency: 'INR', contribution: 50 });
    expect(setup.config.tiers.length).toBeGreaterThan(0);
    expect(setup.seeds.draw).toBeDefined();
    expect(records.filter((r) => (r.move as any).type === 'call')).toHaveLength(10);
    expect(records.filter((r) => (r.move as any).type === 'record-win')).toHaveLength(1);
    for (const r of records) expect(typeof r.at).toBe('number');
  });

  it('a saved game with its money record reads back in the current format', () => {
    const g = new Game().call(40);
    g.win('full-house', 'p1');
    g.finish();
    const saved = {
      format: SAVED_GAME_FORMAT, gameType: 'tambola', id: 'g1', createdAt: 1, updatedAt: 2,
      status: 'ended', setup: g.match.setup, records: g.records, money: g.summary.money,
    };
    const r = readSavedGame(JSON.parse(JSON.stringify(saved)));
    expect(r.ok).toBe(true);
    if (r.ok) expect(moneyProblems(r.game.money!)).toEqual([]);
  });
});
