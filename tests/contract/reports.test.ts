// Phase 7: "Report a problem" (specs/platform/03-feedback.md, owner sign-off 29 September 2026).
// What a report holds, what it never holds, how a report about a game still being played waits for the game to
// end, how a report becomes a replay, and how reports are sorted. Scenarios: PLT-200, PLT-201, PLT-203, PLT-204,
// PLT-205, PLT-206, PLT-207, PLT-208. The screens, the stub destination and the waiting list (PLT-202, PLT-209)
// are checked in tests/browser/report-problem.spec.ts. Names and shapes: tests/contract/README.md, "Problem reports".
import { describe, expect, it } from 'vitest';
import * as engine from '../../src/engine';
import { replay, startMatch } from '../../src/engine';
import { Game, rules, settings, T0, type AnyMatch } from '../games/tambola/helpers';
import { nums, phoneTiers, PhoneGame } from '../games/tambola/phone';

/* eslint-disable @typescript-eslint/no-explicit-any */
const need = (name: string): any => {
  const f = (engine as any)[name];
  if (typeof f !== 'function') throw new Error(`${name} is not exported from src/engine yet (Phase 7, tests/contract/README.md "Problem reports")`);
  return f;
};
const makeReport = (input: any): any => need('makeReport')(input);
const makePlayerReport = (input: any): any => need('makePlayerReport')(input);
const addSeeds = (report: any, saved: any): any => need('addSeeds')(report, saved);
const reportText = (report: any): string => need('reportText')(report);
const readReport = (text: string): any => need('readReport')(text);
const sortReports = (reports: any[], opts: { now: number }): any => need('sortReports')(reports, opts);

// Seeds and names that cannot turn up anywhere by chance. The game id is made from neither (as in the app).
const DRAW = 'draw-seed-Qz71-report-secret';
const SHEET = 'sheet-seed-Wk48-report-secret';
const NAMES = ['Riyaben', 'Ashalata', 'Daddyji', 'Kabirbhai'];
const PLAYERS4 = NAMES.map((name, i) => ({ id: `p${i + 1}`, name, tickets: 1 }));
const APP = { appVersion: '1.7.0-test', phone: 'Pixel 7 (Android 14), Chrome 129' };
const DAY = 24 * 3600 * 1000;

/** Every way a secret could hide in a string: as is, URL-encoded, or in base64. */
function hides(text: string, secret: string): boolean {
  const b64 = Buffer.from(secret).toString('base64').replace(/=+$/, '');
  const b64url = b64.replace(/\+/g, '-').replace(/\//g, '_');
  return [secret, encodeURIComponent(secret), b64, b64url].some((s) => text.includes(s));
}

/** Money keys that must never hold an amount in a report (PLT-201). 0 and null are not amounts. */
const MONEY_KEYS = ['contribution', 'amount', 'pot', 'paid', 'won', 'net', 'prize', 'handedBack', 'hostGives', 'gotBack', 'gives'];
function moneyIn(value: unknown, path = '', out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v, i) => moneyIn(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (MONEY_KEYS.includes(k) && v !== null && v !== 0) out.push(`${path}.${k} = ${JSON.stringify(v)}`);
      moneyIn(v, `${path}.${k}`, out);
    }
  }
  return out;
}

/** A paper game with odd money amounts, so a leaked amount is easy to spot. Contribution ₹37, pot ₹148. */
function paperSetup(over: Record<string, unknown> = {}): any {
  const pot = 4 * 37;
  return {
    gameId: 'g-report-paper-1',
    seeds: { draw: DRAW },
    config: {
      ticketMode: 'paper',
      players: PLAYERS4,
      money: { currency: 'INR', contribution: 37 },
      tiers: [
        { pattern: 'early-five', amount: 23 }, { pattern: 'top-line', amount: 31 }, { pattern: 'full-house', amount: pot - 23 - 31 },
      ],
      settings: settings(),
      ...over,
    },
  };
}
function phoneSetup(): any {
  return {
    gameId: 'g-report-phone-1',
    seeds: { draw: DRAW, sheet: SHEET },
    config: { ticketMode: 'phone', players: PLAYERS4, money: { currency: 'INR', contribution: 37 }, tiers: phoneTiers(4 * 37), settings: settings() },
  };
}
const paperGame = (over: Record<string, unknown> = {}) => Game.fromMatch(startMatch(rules, paperSetup(over), T0));
const phoneGame = () => PhoneGame.of(startMatch(rules, phoneSetup(), T0));

/** The game as the app saves it (engine SavedGame, format 2), with its session and, once over, its money record. */
function saved(match: AnyMatch, status: string, extra: Record<string, unknown> = {}): any {
  const last = match.records[match.records.length - 1];
  const summary = rules.view(match.state, { kind: 'host' }).summary;
  return {
    format: 2, gameType: 'tambola', id: match.setup.gameId, createdAt: T0, updatedAt: last ? last.at : T0, status,
    setup: match.setup, records: match.records, sessionId: 'sess-diwali-1',
    ...(summary?.money ? { money: summary.money } : {}),
    ...extra,
  };
}
const statusOf = (g: Game) => (g.over ? 'ended' : 'in-progress');

function hostReport(g: Game, what = '', extra: Record<string, unknown> = {}): any {
  return makeReport({ what, ...APP, at: g.clock + 5000, game: { saved: saved(g.match, statusOf(g)), rules }, ...extra });
}

/** Replays a report's game; fails the test with the reason if it cannot be replayed. */
function replayOf(report: any): AnyMatch {
  const r = replay(rules, report.game.setup, report.game.records);
  if (!r.ok) expect.fail(`the report's game does not replay: ${r.reason}`);
  return r.value;
}
const claimsOf = (m: AnyMatch) =>
  rules.view(m.state, { kind: 'host' }).claims.map((c: any) => ({ playerId: c.playerId, pattern: c.pattern, verdict: c.verdict, ticket: c.ticket }));
const calledOf = (m: AnyMatch): number[] => rules.view(m.state, { kind: 'host' }).called;
const seedsOf = (report: any): Record<string, string> => report.game?.setup?.seeds ?? {};

/** An ended paper game: Early Five to Riyaben, a bogey for Ashalata, a rename, then ended. */
function endedPaperGame(): Game {
  const g = paperGame().call(6);
  g.do({ type: 'record-win', pattern: 'early-five', playerIds: ['p1'] }).close('early-five');
  g.do({ type: 'record-bogey', playerId: 'p2', pattern: 'top-line' });
  g.do({ type: 'rename', playerId: 'p3', name: 'Daddyji Sharma' });
  g.call(4).finish();
  return g;
}

describe('PLT-200: a report holds the app version, the phone type, the host\'s sentence, and the game\'s seeds and moves', () => {
  it('an ended game: version, phone, what happened, and every move with the seeds, so it can be replayed', () => {
    const g = endedPaperGame();
    const r = hostReport(g, 'The prize list looked wrong');
    expect(r.v).toBe(1);
    expect(r.from).toBe('host');
    expect(typeof r.id).toBe('string');
    expect(r.id.length).toBeGreaterThan(0);
    expect(r.appVersion).toBe(APP.appVersion);
    expect(r.phone).toBe(APP.phone);
    expect(r.what).toBe('The prize list looked wrong');
    expect(r.waitingForGameEnd).toBe(false);
    expect(r.game.gameType).toBe('tambola');
    expect(r.game.records.length).toBe(g.records.length);
    expect(seedsOf(r).draw).toBe(DRAW);
    expect(calledOf(replayOf(r))).toEqual(g.called);
  });

  it('"What happened?" is optional: an empty sentence still makes a report', () => {
    const r = hostReport(endedPaperGame(), '');
    expect(r.what).toBe('');
    expect(r.appVersion).toBe(APP.appVersion);
    expect(r.game.records.length).toBeGreaterThan(0);
  });

  it('from a screen with no game (such as home): a report with no game, not waiting for anything', () => {
    const r = makeReport({ what: 'The home screen was blank', ...APP, at: T0 });
    expect(r.game ?? null).toBeNull();
    expect(r.waitingForGameEnd).toBe(false);
    expect(r.what).toBe('The home screen was blank');
  });

  it('each report has its own id', () => {
    const ids = new Set(Array.from({ length: 40 }, (_, i) => makeReport({ what: 'same words', ...APP, at: T0 + (i % 3) }).id));
    expect(ids.size).toBe(40);
  });
});

describe('PLT-201: a report never holds names or session names; players become "Player 1", "Player 2"; it does hold the money numbers', () => {
  it('the setup\'s players are "Player 1" … in setup order; no name, old or new, is anywhere in the report', () => {
    const g = endedPaperGame();
    const r = hostReport(g, 'Something odd');
    expect(r.game.setup.config.players.map((p: any) => p.name)).toEqual(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    const text = reportText(r);
    for (const name of [...NAMES, 'Daddyji Sharma']) expect(text, `the name ${name}`).not.toContain(name);
  });

  it('a name the host types in "What happened?" becomes that player\'s "Player N"', () => {
    const r = hostReport(endedPaperGame(), 'Ashalata got a bogey but Riyaben was fine');
    expect(r.what).toBe('Player 2 got a bogey but Player 1 was fine');
  });

  it('a late joiner and a renamed player are "Player N" too, and the game still replays the same', () => {
    const g = paperGame().call(3);
    g.do({ type: 'add-player', player: { id: 'p5', name: 'Meerakumari', tickets: 1 } });
    g.do({ type: 'rename', playerId: 'p2', name: 'Ashalata K' });
    g.call(3).do({ type: 'record-win', pattern: 'early-five', playerIds: ['p5'] }).close('early-five').call(2).finish();
    const r = hostReport(g);
    const text = reportText(r);
    for (const name of [...NAMES, 'Meerakumari', 'Ashalata K']) expect(text, `the name ${name}`).not.toContain(name);
    const m = replayOf(r);
    const names = rules.view(m.state, { kind: 'host' }).players.map((p: any) => p.name);
    expect(names.every((n: string) => /^Player \d+$/.test(n)), `names after replay: ${names.join(', ')}`).toBe(true);
    expect(new Set(names).size).toBe(names.length);
    expect(claimsOf(m)).toEqual(claimsOf(g.match));
  });

  // Owner, 1 October 2026 (docs/decisions.md; was "no money amounts"): the game's money numbers ARE in the report.
  it('the money numbers are in: the contribution per ticket and every prize amount, as the host set them', () => {
    const r = hostReport(endedPaperGame());
    const back = readReport(reportText(r));
    expect(back.ok).toBe(true);
    const config = back.report.game.setup.config;
    expect(config.money).toEqual({ currency: 'INR', contribution: 37 });
    expect(config.tiers.map((t: any) => [t.pattern, t.amount])).toEqual([['early-five', 23], ['top-line', 31], ['full-house', 94]]);
  });

  it('the payouts are in: the saved game\'s money record, each person paid and won as recorded, names as "Player N"', () => {
    const g = endedPaperGame();
    const record = g.summary.money;
    expect(record, 'the ended game has a money record').toBeTruthy();
    const r = hostReport(g);
    const back = readReport(reportText(r)).report;
    expect(back.game.money, 'game.money: the payouts as the app recorded them').toBeTruthy();
    expect(back.game.money.currency).toBe(record.currency);
    expect(back.game.money.people.map((p: any) => ({ personId: p.personId, paid: p.paid, won: p.won })))
      .toEqual(record.people.map((p: any) => ({ personId: p.personId, paid: p.paid, won: p.won })));
    expect(back.game.money.people.map((p: any) => p.name)).toEqual(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    const text = reportText(r);
    for (const name of [...NAMES, 'Daddyji Sharma']) expect(text, `the name ${name}`).not.toContain(name);
  });

  it('edge: a game still being played holds its money numbers too (but no seeds, PLT-206), and no payouts yet', () => {
    const g = paperGame().call(4);
    const r = hostReport(g);
    expect(r.waitingForGameEnd).toBe(true);
    expect(r.game.setup.config.money.contribution).toBe(37);
    expect(r.game.setup.config.tiers.map((t: any) => t.amount)).toEqual([23, 31, 94]);
    expect(r.game.money ?? null).toBeNull();
  });

  it('edge: a "No money" game has no money numbers to add, and still makes a report', () => {
    const g = paperGame({ money: null, tiers: [{ pattern: 'early-five', amount: 0, label: 'Chocolate' }, { pattern: 'top-line', amount: 0, label: 'Ice cream' }, { pattern: 'full-house', amount: 0, label: 'The big cake' }] }).call(5).finish();
    const r = hostReport(g);
    expect(moneyIn(JSON.parse(reportText(r)))).toEqual([]);
    expect(r.game.money ?? null).toBeNull();
    expect(calledOf(replayOf(r))).toEqual(g.called);
  });

  it('no session name, and no settlement, even if handed in; the money record goes in with names replaced', () => {
    const g = endedPaperGame();
    const r = makeReport({
      what: '', ...APP, at: g.clock + 1000,
      game: { saved: saved(g.match, 'ended', { sessionName: 'Diwali at Nanima', settlementId: 'settle-1' }), rules },
    });
    const text = reportText(r);
    expect(text).not.toContain('Diwali');
    expect(text).not.toContain('settle-1');
    for (const name of NAMES) expect(text).not.toContain(name);
    expect(r.game.money.people.length).toBe(4);
  });

  it('what is sent is exactly what the host saw: the text reads back as the same report, and is the same every time', () => {
    const r = hostReport(endedPaperGame(), 'Shown before sending');
    const text = reportText(r);
    expect(reportText(r)).toBe(text);
    const back = readReport(text);
    expect(back.ok).toBe(true);
    expect(back.report).toEqual(r);
    expect(reportText(back.report)).toBe(text);
  });

  it('wrong input: text that is not a report is refused with a plain reason, never thrown', () => {
    for (const bad of ['', 'hello', '{}', '{"v":99}', JSON.stringify({ v: 1 }), '[1,2,3]']) {
      const r = readReport(bad);
      expect(r.ok, `"${bad}" is not a report`).toBe(false);
      expect(typeof r.reason).toBe('string');
    }
  });
});

describe('PLT-203: a crash report holds the error, and nothing personal', () => {
  it('the error message is in the report, with the version, the phone and the game so far', () => {
    const g = paperGame().call(5);
    const r = hostReport(g, '', { error: { message: 'TypeError: cannot read tiers of undefined', stack: 'at Play (Play.tsx:12)' } });
    expect(r.error.message).toContain('cannot read tiers of undefined');
    expect(r.appVersion).toBe(APP.appVersion);
    expect(r.game.records.length).toBe(5);
    for (const name of NAMES) expect(reportText(r)).not.toContain(name);
  });
});

describe('PLT-206: a report about a game still being played never holds its seeds until the game ends', () => {
  it('in progress: the moves so far, no seed in any form, and waiting for the game to end', () => {
    const g = phoneGame().call(12);
    g.claim(1, 'early-five');
    const r = hostReport(g, 'Claim looked odd');
    const text = reportText(r);
    expect(r.waitingForGameEnd).toBe(true);
    expect(Object.values(seedsOf(r)).filter((s) => typeof s === 'string' && s.length > 0)).toEqual([]);
    for (const seed of [DRAW, SHEET]) expect(hides(text, seed), `the report holds the seed ${seed}`).toBe(false);
    expect(r.game.records.length).toBe(g.records.length);
  });

  it('a paused game waits too', () => {
    const g = paperGame().call(4);
    const r = makeReport({ what: '', ...APP, at: g.clock + 1, game: { saved: saved(g.match, 'paused'), rules } });
    expect(r.waitingForGameEnd).toBe(true);
    expect(hides(reportText(r), DRAW)).toBe(false);
  });

  it('once the game has ended, the seeds are added; the moves stay those of the report, and they replay exactly', () => {
    const g = phoneGame().call(10);
    const r = hostReport(g, 'mid-game');
    const calledThen = [...g.called];
    const recordsThen = r.game.records;
    g.call(5).finish();
    const done = addSeeds(r, saved(g.match, 'ended'));
    expect(done.waitingForGameEnd).toBe(false);
    expect(seedsOf(done)).toEqual({ draw: DRAW, sheet: SHEET });
    expect(done.game.records).toEqual(recordsThen);
    expect(done.id).toBe(r.id);
    expect(done.what).toBe('mid-game');
    expect(calledOf(replayOf(done))).toEqual(calledThen);
  });

  it('a discarded game releases the seeds too, and so does one abandoned', () => {
    const g = paperGame().call(4);
    const r = hostReport(g);
    g.do({ type: 'discard' });
    expect(seedsOf(addSeeds(r, saved(g.match, 'ended'))).draw).toBe(DRAW);
    const h = paperGame().call(2);
    const r2 = hostReport(h);
    expect(seedsOf(addSeeds(r2, saved(h.match, 'abandoned'))).draw).toBe(DRAW);
  });

  it('wrong input: the same game still in progress, or another game that ended, adds no seeds', () => {
    const g = paperGame().call(4);
    const r = hostReport(g);
    g.call(3);
    const still = addSeeds(r, saved(g.match, 'in-progress'));
    expect(still.waitingForGameEnd).toBe(true);
    expect(hides(reportText(still), DRAW)).toBe(false);
    const other = Game.fromMatch(startMatch(rules, { ...paperSetup(), gameId: 'g-report-other', seeds: { draw: 'other-seed-Hh55' } }, T0)).call(3).finish();
    const wrong = addSeeds(r, saved(other.match, 'ended'));
    expect(wrong.waitingForGameEnd).toBe(true);
    const text = reportText(wrong);
    expect(hides(text, 'other-seed-Hh55')).toBe(false);
    expect(hides(text, DRAW)).toBe(false);
  });
});

describe('PLT-204: every report with seeds and moves becomes a replay of the exact game', () => {
  it('read back from its text, an ended game\'s report replays: the same calls, claims, bogeys and ending', () => {
    const g = endedPaperGame();
    const back = readReport(reportText(hostReport(g, 'replay me')));
    expect(back.ok).toBe(true);
    const m = replayOf(back.report);
    expect(calledOf(m)).toEqual(g.called);
    expect(claimsOf(m)).toEqual(claimsOf(g.match));
    expect(rules.isOver(m.state)).toBe(true);
    const s = rules.view(m.state, { kind: 'host' }).summary;
    expect(s.result).toBe(g.summary.result);
    expect(s.callsMade).toBe(g.summary.callsMade);
    expect(s.bogeys.map((b: any) => [b.playerId, b.pattern])).toEqual(g.summary.bogeys.map((b: any) => [b.playerId, b.pattern]));
    expect(rules.invariants(m.state)).toEqual([]);
  });

  it('money bugs can be replayed: the replayed game has the same pot, prize amounts, winners\' shares and payouts', () => {
    // Owner, 1 October 2026: reports include the money numbers so that money bugs can be replayed (PLT-204).
    const g = paperGame().call(6);
    g.do({ type: 'record-win', pattern: 'early-five', playerIds: ['p1', 'p3'] }).close('early-five');
    g.call(4).finish();
    const m = replayOf(readReport(reportText(hostReport(g, 'the shares looked wrong'))).report);
    const s = rules.view(m.state, { kind: 'host' }).summary;
    expect(s.pot).toBe(148);
    expect(s.pot).toBe(g.summary.pot);
    expect(s.tiers.map((t: any) => ({ pattern: t.pattern, amount: t.amount, winners: t.winners })))
      .toEqual(g.summary.tiers.map((t: any) => ({ pattern: t.pattern, amount: t.amount, winners: t.winners })));
    const pay = (xs: any[]) => xs.map((p: any) => ({ playerId: p.playerId, paid: p.paid, won: p.won, handedBack: p.handedBack, net: p.net, hostGives: p.hostGives }));
    expect(pay(s.payouts)).toEqual(pay(g.summary.payouts));
    expect(s.money.people.map((p: any) => [p.personId, p.paid, p.won])).toEqual(g.summary.money.people.map((p: any) => [p.personId, p.paid, p.won]));
  });

  it('a phone-ticket game replays too: the same tickets, the same claim verdicts', () => {
    const g = phoneGame();
    const t1 = nums(g.ticket(1).rows);
    g.callWhile(() => t1.filter((n) => g.called.includes(n)).length < 5);
    g.claim(1, 'early-five');
    g.claim(2, 'top-line');
    g.closeAll().call(3).finish();
    const m = replayOf(readReport(reportText(hostReport(g))).report);
    expect(calledOf(m)).toEqual(g.called);
    expect(claimsOf(m)).toEqual(claimsOf(g.match));
    expect(rules.view(m.state, { kind: 'host' }).tickets.map((t: any) => t.rows)).toEqual(g.tickets.map((t) => t.rows));
  });

  it('a report that waited for its game to end replays the game as it was when reported', () => {
    const g = paperGame().call(7);
    g.do({ type: 'record-win', pattern: 'early-five', playerIds: ['p4'] });
    const r = hostReport(g);
    const calledThen = [...g.called];
    const claimsThen = claimsOf(g.match);
    g.close('early-five').call(5).finish();
    const m = replayOf(readReport(reportText(addSeeds(r, saved(g.match, 'ended')))).report);
    expect(calledOf(m)).toEqual(calledThen);
    expect(claimsOf(m)).toEqual(claimsThen);
  });
});

describe('PLT-207: a player\'s report holds only what their phone has', () => {
  const RIYA_ROWS = [
    [4, null, 21, null, 45, null, 63, null, 88],
    [null, 12, null, 33, 49, null, null, 71, 85],
    [7, null, 28, 38, null, 56, 69, null, null],
  ];
  const ticketOnPhone = (ticket: number, rows: any, marks: number[]) => ({
    v: 1, game: '7K3P', ticket, name: 'Riyaben', rows, startedAt: T0, tiers: ['early-five', 'top-line', 'full-house'], marks,
  });

  it('the version, the phone type, their own tickets and their marks; never their name, a seed or a setup', () => {
    const r = makePlayerReport({ what: 'My marks disappeared', ...APP, at: T0, tickets: [ticketOnPhone(3, RIYA_ROWS, [4, 21, 45])] });
    expect(r.v).toBe(1);
    expect(r.from).toBe('player');
    expect(r.appVersion).toBe(APP.appVersion);
    expect(r.phone).toBe(APP.phone);
    expect(r.what).toBe('My marks disappeared');
    expect(r.tickets.map((t: any) => ({ ticket: t.ticket, rows: t.rows, marks: [...t.marks].sort((a: number, b: number) => a - b) }))).toEqual([
      { ticket: 3, rows: RIYA_ROWS, marks: [4, 21, 45] },
    ]);
    const text = reportText(r);
    expect(text).not.toContain('Riyaben');
    expect(r.game ?? null).toBeNull();
    expect(text).not.toMatch(/"seeds?"/);
    expect(r.waitingForGameEnd).toBe(false);
  });

  it('her own name typed in "What happened?" is never in the report; the rest of the sentence is', () => {
    const r = makePlayerReport({ what: 'Riyaben here, the ticket froze', ...APP, at: T0, tickets: [ticketOnPhone(3, RIYA_ROWS, [])] });
    expect(r.what).not.toContain('Riyaben');
    expect(r.what).toContain('the ticket froze');
  });

  it('several tickets on one phone: all of them, each with its own marks, and reads back as the same report', () => {
    const other = RIYA_ROWS.map((row) => row.map((n) => (n === null ? null : n + 1)));
    const r = makePlayerReport({ what: '', ...APP, at: T0, tickets: [ticketOnPhone(3, RIYA_ROWS, [4]), ticketOnPhone(4, other, [5, 13])] });
    expect(r.tickets.map((t: any) => t.ticket)).toEqual([3, 4]);
    expect(r.tickets[1].marks.slice().sort((a: number, b: number) => a - b)).toEqual([5, 13]);
    const back = readReport(reportText(r));
    expect(back.ok).toBe(true);
    expect(back.report).toEqual(r);
  });
});

describe('PLT-208: making a report sends nothing and needs no account', () => {
  it('making, reading and sorting reports never touch the network', async () => {
    const calls: string[] = [];
    const realFetch = globalThis.fetch;
    (globalThis as any).fetch = (...args: any[]) => { calls.push(String(args[0])); return Promise.reject(new Error('no network in this test')); };
    try {
      const g = endedPaperGame();
      const r = hostReport(g, 'offline please');
      readReport(reportText(r));
      addSeeds(r, saved(g.match, 'ended'));
      sortReports([r], { now: r.at });
      await new Promise((ok) => setTimeout(ok, 20));
    } finally {
      globalThis.fetch = realFetch;
    }
    expect(calls).toEqual([]);
  });

  it('a report holds no account, e-mail or sign-in details', () => {
    const text = reportText(hostReport(endedPaperGame(), 'x'));
    expect(text).not.toMatch(/"(email|account|userId|token|password|apiKey|key)"/i);
  });
});

describe('PLT-205: reports are sorted into bug, confusion, idea or noise, grouped, and ranked for the week', () => {
  const NOW = T0 + 30 * DAY;
  const at = (daysAgo: number, i = 0) => NOW - daysAgo * DAY + i * 1000;
  const r = (what: string, daysAgo: number, extra: Record<string, unknown> = {}, i = 0) =>
    makeReport({ what, ...APP, at: at(daysAgo, i), ...extra });
  const KINDS = ['bug', 'confusion', 'idea', 'noise'];

  function week() {
    return [
      r('', 1, { error: { message: 'TypeError: x is undefined' } }, 1),
      r('', 2, { error: { message: 'TypeError: x is undefined' } }, 2),
      r('It crashed', 3, { error: { message: 'TypeError: x is undefined' } }, 3),
      r('Where is the board?', 1, {}, 4),
      r('where is the board', 2, {}, 5),
      r('Please add a Hindi voice', 4, {}, 6),
      r('', 5, {}, 7),
      r('Old news', 8, {}, 8),
      r('From the future', -1, {}, 9),
    ];
  }

  it('every report of the last 7 days is in exactly one group, each group of one kind; older ones are left out', () => {
    const reports = week();
    const out = sortReports(reports, { now: NOW });
    const ids = out.groups.flatMap((g: any) => g.reportIds);
    const inWeek = reports.filter((x: any) => x.at <= NOW && x.at > NOW - 7 * DAY).map((x: any) => x.id);
    expect([...ids].sort()).toEqual([...inWeek].sort());
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of out.groups) expect(KINDS).toContain(g.kind);
  });

  it('a crash report is a bug; reports with the same error are one group', () => {
    const reports = week();
    const out = sortReports(reports, { now: NOW });
    const crashIds = reports.slice(0, 3).map((x: any) => x.id);
    const group = out.groups.find((g: any) => g.reportIds.includes(crashIds[0]));
    expect(group.kind).toBe('bug');
    expect([...group.reportIds].sort()).toEqual([...crashIds].sort());
  });

  it('the same words, ignoring case and punctuation, are one group; an empty report with no error is noise', () => {
    const reports = week();
    const out = sortReports(reports, { now: NOW });
    const board = out.groups.find((g: any) => g.reportIds.includes(reports[3].id));
    expect(board.reportIds).toContain(reports[4].id);
    const empty = out.groups.find((g: any) => g.reportIds.includes(reports[6].id));
    expect(empty.kind).toBe('noise');
  });

  it('ranked: the biggest group first; the same reports in any order give the same list', () => {
    const reports = week();
    const out = sortReports(reports, { now: NOW });
    const sizes = out.groups.map((g: any) => g.reportIds.length);
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    expect(sizes[0]).toBe(3);
    const shuffled = sortReports([...reports].reverse(), { now: NOW });
    const norm = (o: any) => o.groups.map((g: any) => ({ kind: g.kind, ids: [...g.reportIds].sort() }));
    expect(norm(shuffled)).toEqual(norm(out));
  });

  // Product owner, 1 October 2026 (docs/decisions.md): bug = something went wrong, confusion = didn't know how,
  // idea = a wish, otherwise noise. A report with a caught error stays a bug.
  const kindOf = (what: string, extra: Record<string, unknown> = {}) => {
    const one = r(what, 1, extra);
    const out = sortReports([one], { now: NOW });
    return out.groups.find((g: any) => g.reportIds.includes(one.id))?.kind;
  };
  const SORTED: [string, string][] = [
    ['The app crashed when I tapped Next number', 'bug'],
    ['There was an error on the payout screen', 'bug'],
    ['The prize amount was wrong', 'bug'],
    ["Undo didn't work", 'bug'],
    ['The screen got stuck on the board', 'bug'],
    ['How do I undo a call?', 'confusion'],
    ['Where is the board?', 'confusion'],
    ["I can't find the settings", 'confusion'],
    ['The prizes step is confusing', 'confusion'],
    ["We didn't understand the bogey rule", 'confusion'],
    ['Please add a Hindi voice', 'idea'],
    ['I wish it had dark mode', 'idea'],
    ['A timer would be nice', 'idea'],
    ['Could you make the numbers bigger?', 'idea'],
    ['Idea: a scoreboard for rummy', 'idea'],
    ['Lovely game, thank you', 'noise'],
    ['asdf', 'noise'],
    ['', 'noise'],
  ];
  for (const [what, kind] of SORTED) {
    it(`"${what}" is ${kind === 'idea' ? 'an' : 'a'} ${kind}`, () => {
      expect(kindOf(what)).toBe(kind);
    });
  }

  it('the words are found in any case: "CRASH", "WHERE IS", "WISH"', () => {
    expect(kindOf('IT WILL CRASH EVERY TIME')).toBe('bug');
    expect(kindOf('WHERE IS THE MENU')).toBe('confusion');
    expect(kindOf('WISH LIST: voices')).toBe('idea');
  });

  it("edge: a phone's curly apostrophe counts the same: \"didn’t work\" is a bug, \"can’t find\" a confusion", () => {
    expect(kindOf('Undo didn\u2019t work')).toBe('bug');
    expect(kindOf('I can\u2019t find the board')).toBe('confusion');
  });

  it('a report with a caught error stays a bug, whatever the words say', () => {
    const err = { error: { message: 'TypeError: y is undefined' } };
    expect(kindOf('Could you add a timer?', err)).toBe('bug');
    expect(kindOf('Where is the board?', err)).toBe('bug');
    expect(kindOf('Lovely game', err)).toBe('bug');
    expect(kindOf('', err)).toBe('bug');
  });

  it('in the week\'s list, "Where is the board?" and "where is the board" are one confusion group, the Hindi voice an idea', () => {
    const reports = week();
    const out = sortReports(reports, { now: NOW });
    expect(out.groups.find((g: any) => g.reportIds.includes(reports[3].id)).kind).toBe('confusion');
    expect(out.groups.find((g: any) => g.reportIds.includes(reports[5].id)).kind).toBe('idea');
  });

  it('works with no Jev and no reports: an empty list', () => {
    expect(sortReports([], { now: NOW }).groups).toEqual([]);
  });
});

