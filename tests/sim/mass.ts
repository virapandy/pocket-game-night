// Mass simulations of Tambola (PLT-116) with the generic simulated player (PLT-110 to PLT-113, PLT-123), and the
// plain summary (PLT-117). Code only: every choice comes from a seeded generator, or from Jev when a key is there
// and the weekly cap is not reached; the rules engine decides every verdict.
//
// Each game mixes, from its seed: paper or phone tickets, 2 to 60 tickets, a tier set (any subset with Full House,
// sometimes Four Corners and Second Full House), money or "No money", bogey rules, ties, late joiners (and removing
// one added by mistake), on-time, late, false and never-claiming players, undo of claims and of the last call,
// closing tiers, handing a phone ticket to someone else, "give a paper ticket", ending early and discarding.
// After every move it checks: no number called twice, the game's invariants, no secret in the room or a player's
// view (PLT-101, TAM-050 to TAM-052) and, for phone tickets, that the verdict is the one the called numbers give
// (TAM-034 to TAM-038). At the end: the game ended (TAM-077), the money adds up to the pot (TAM-091), and the
// replay gives the same game (TAM-073). A game that breaks a check is saved as a permanent replay (TAM-074).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRng, HOST, moneyProblems, play, replay, startMatch, undo, type Rng } from '../../src/engine';
import { mod, rules, settings, type AnyMatch, type Pattern } from '../games/tambola/helpers';
import { expected, nums, type Rows } from '../games/tambola/phone';
import { makeTicket } from './tambola-sim';
import { NO_KEY_MESSAGE, redact, WEEKLY_CAP, type Jev } from './jev';
import { decideAll, disagreement, type Chooser, type Decision, type Disagreement, type Option, type Persona, type PlayerKind, type Script, type Situation } from './player';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- Personas (PLT-116 scripted habits; PLT-123 Jev personas fall back to the same habits) ----------

export type Habit = 'prompt' | 'late' | 'false' | 'never' | 'eager';

export const PERSONAS: Record<string, Persona & { habit: Habit }> = {
  prompt: { id: 'prompt', habit: 'prompt', describe: 'a sharp guest who claims the moment a prize is complete' },
  late: { id: 'late', habit: 'late', describe: 'a guest who notices wins a number or two late' },
  false: { id: 'false', habit: 'false', describe: 'a guest who sometimes misreads a ticket and claims too soon' },
  never: { id: 'never', habit: 'never', describe: 'a guest who is only here for the snacks and never claims' },
  eager: { id: 'eager', habit: 'eager', describe: 'an over-eager child who shouts claims whenever excited' },
  // Jev personas (PLT-123). Without Jev they play the habit named here.
  'slow-grandparent': { id: 'slow-grandparent', habit: 'late', describe: 'a slow grandparent who marks carefully and often claims late' },
  'over-eager-child': { id: 'over-eager-child', habit: 'eager', describe: 'an over-eager child who claims at every near miss' },
  'distracted-guest': { id: 'distracted-guest', habit: 'never', describe: 'a distracted guest chatting and on the phone, who misses some wins' },
};
export const JEV_PERSONAS = ['slow-grandparent', 'over-eager-child', 'distracted-guest'] as const;
const SCRIPTED: Habit[] = ['prompt', 'late', 'false', 'never', 'eager'];

/** What a claim option carries besides its move: which ticket and prize, and what code knows about it. */
interface ClaimData { ticket: number; pattern: Pattern; state: 'now' | 'earlier' | 'not' }

/** A persona's habit, as a script over the offered options (every return is an offered key). */
export function habitScript(habit: Habit): Script {
  return (s, rng) => {
    const quiet = s.options.find((o) => o.move === null && !(o as any).data)!.key;
    const of = (st: ClaimData['state']) => s.options.filter((o) => (o as any).data?.state === st);
    const now = of('now'), earlier = of('earlier'), not = of('not');
    const any = (list: Option[]) => list[rng.int(list.length)]!.key;
    switch (habit) {
      case 'prompt': return now.length ? any(now) : quiet;
      case 'late':
        if (earlier.length && rng.int(2) === 0) return any(earlier);
        return now.length && rng.int(4) === 0 ? any(now) : quiet;
      case 'false':
        if (not.length && rng.int(80) === 0) return any(not);
        return now.length && rng.int(10) < 7 ? any(now) : quiet;
      case 'eager':
        if (now.length) return any(now);
        return not.length && rng.int(40) === 0 ? any(not) : quiet;
      case 'never': return quiet;
    }
  };
}

// ---------- One simulated game ----------

export interface SimGuest { id: string; name: string; persona: string; kind: PlayerKind; joinedLate: boolean }

export interface GameResult {
  seed: string;
  mode: 'paper' | 'phone';
  tickets: number;
  match: AnyMatch;
  ended: 'ended' | 'ended-early' | 'discarded' | 'never';
  problems: string[];
  accepted: number;
  bogeys: number;
  ties: number;
  callsBeforeFirstFullHouse: number | null;
  lateJoiners: number;
  undos: number;
  disagreements: Disagreement[];
  /** What each persona did (PLT-123): claims on time, late, false, and staying quiet with a win. */
  personaActs: Record<string, { onTime: number; late: number; falseClaims: number; missed: number }>;
  decisionsBy: Record<PlayerKind, number>;
  fallbacks: Record<string, number>;
}

export interface GameOpts {
  /** Jev client, or null (no key). */
  jev?: Jev | null;
  /** Share of guests who are Jev personas when Jev is offered (0 to 1). Default 0.3. */
  jevShare?: number;
  /** Check the room and one player view after every move (slower). Default true. */
  checkViews?: boolean;
}

const ALL_PATTERNS: Pattern[] = ['early-five', 'top-line', 'middle-line', 'bottom-line', 'four-corners', 'full-house', 'second-full-house'];
const LABEL: Record<Pattern, string> = {
  'early-five': 'Early Five', 'top-line': 'Top Line', 'middle-line': 'Middle Line', 'bottom-line': 'Bottom Line',
  'four-corners': 'Four Corners', 'full-house': 'Full House', 'second-full-house': 'Second Full House',
};

/** A 3 × 5 paper ticket laid out as 3 rows of 9 cells (a blank is null), like a phone ticket. */
export function paperRows(rng: Rng): Rows {
  const col = (n: number) => (n === 90 ? 8 : Math.floor(n / 10));
  return makeTicket(rng).map((r) => {
    const cells: (number | null)[] = Array(9).fill(null);
    r.forEach((n) => { cells[col(n)] = n; });
    return cells;
  });
}

/** Tiers adding up to the pot: from `planPrizes` for the chosen patterns, or an even split with Full House taking the rest. */
function makeTiers(patterns: Pattern[], tickets: number, contribution: number | null): { pattern: Pattern; amount: number }[] {
  const pot = contribution === null ? 0 : tickets * contribution;
  if (contribution !== null && typeof mod.planPrizes === 'function') {
    try {
      const removed = ALL_PATTERNS.filter((p) => !patterns.includes(p) && p !== 'full-house');
      const added = patterns.filter((p) => p === 'four-corners' || p === 'second-full-house');
      const plan = mod.planPrizes({ tickets, contribution, removed, added });
      const tiers = plan.tiers.filter((t: any) => patterns.includes(t.pattern)).map((t: any) => ({ pattern: t.pattern, amount: t.amount }));
      if (tiers.length === patterns.length && tiers.reduce((a: number, t: any) => a + t.amount, 0) === pot) return order(tiers);
    } catch { /* fall back below */ }
  }
  const each = patterns.length > 1 ? Math.floor(pot / (patterns.length * 2)) : 0;
  const tiers = patterns.map((p) => ({ pattern: p, amount: p === 'full-house' ? 0 : each }));
  const fh = tiers.find((t) => t.pattern === 'full-house')!;
  fh.amount = pot - tiers.reduce((a, t) => a + t.amount, 0);
  return order(tiers);
}
const order = <T extends { pattern: Pattern }>(t: T[]) => [...t].sort((a, b) => ALL_PATTERNS.indexOf(a.pattern) - ALL_PATTERNS.indexOf(b.pattern));

/** Every place a seed could show up in text: plain, URL-encoded, base64 (TAM-052, PLT-101). */
function seedForms(seed: string): string[] {
  return [seed, encodeURIComponent(seed), Buffer.from(seed).toString('base64').replace(/=+$/, '')];
}

/** Every array of whole numbers in a value, with where it is (such as "claims.missing"), leaving out the given keys. */
function numberLists(value: unknown, skip: Set<string>, path = '', out: { path: string; list: number[] }[] = []): { path: string; list: number[] }[] {
  if (Array.isArray(value)) {
    if (value.length && value.every((v) => Number.isInteger(v))) out.push({ path, list: value as number[] });
    else value.forEach((v) => numberLists(v, skip, path, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) if (!skip.has(k)) numberLists(v, skip, path ? `${path}.${k}` : k, out);
  }
  return out;
}

export async function playGame(seed: string, opts: GameOpts = {}): Promise<GameResult> {
  const rng = createRng(`mass:${seed}`);
  const choiceRng = createRng(`mass-choices:${seed}`);
  const viewRng = createRng(`mass-views:${seed}`);
  const jev = opts.jev ?? null;
  const jevShare = opts.jevShare ?? 0.3;
  const checkViews = opts.checkViews ?? true;
  const mode: 'paper' | 'phone' = rng.int(2) === 0 ? 'paper' : 'phone';

  // 2 to 60 tickets, 1 to 3 per guest.
  const target = 2 + rng.int(59);
  const guests: SimGuest[] = [];
  const ticketCounts: number[] = [];
  let total = 0;
  while (total < target) {
    const t = Math.min(1 + rng.int(3), target - total);
    const i = guests.length + 1;
    const useJev = jev !== null && rng.int(1000) < jevShare * 1000;
    const persona = useJev ? JEV_PERSONAS[rng.int(JEV_PERSONAS.length)]! : SCRIPTED[rng.int(SCRIPTED.length)]!;
    guests.push({ id: `p${i}`, name: `Player ${i}`, persona, kind: useJev ? 'jev' : 'scripted', joinedLate: false });
    ticketCounts.push(t);
    total += t;
  }
  if (guests.length === 1) {
    // At least two people at a party: split the tickets.
    ticketCounts[0] = 1;
    guests.push({ id: 'p2', name: 'Player 2', persona: 'prompt', kind: 'scripted', joinedLate: false });
    ticketCounts.push(Math.max(1, total - 1));
  }

  const patterns: Pattern[] = ALL_PATTERNS.filter((p) => p === 'full-house' || (p === 'second-full-house' ? rng.int(4) === 0 : rng.int(3) !== 0));
  const contribution = rng.int(7) === 0 ? null : [10, 20, 30, 50, 100][rng.int(5)]!;
  const tiers = makeTiers(patterns, ticketCounts.reduce((a, b) => a + b, 0), contribution);
  const houseRules = settings({ bogey: rng.int(2) ? 'out' : 'carry-on', lateJoinUntil: rng.int(6) === 0 ? 0 : 10 });
  const drawSeed = `draw-${seed}-${rng.int(1e9)}`;
  const sheetSeed = `sheet-${seed}-${rng.int(1e9)}`;
  const setup: any = {
    gameId: `mass-${seed}`,
    seeds: mode === 'phone' ? { draw: drawSeed, sheet: sheetSeed } : { draw: drawSeed },
    config: {
      ticketMode: mode,
      players: guests.map((g, i) => ({ id: g.id, name: g.name, tickets: ticketCounts[i]! })),
      money: contribution === null ? null : { currency: 'INR', contribution },
      tiers,
      settings: houseRules,
    },
  };

  const result: GameResult = {
    seed, mode, tickets: 0, match: null as any, ended: 'never', problems: [], accepted: 0, bogeys: 0, ties: 0,
    callsBeforeFirstFullHouse: null, lateJoiners: 0, undos: 0, disagreements: [], personaActs: {},
    decisionsBy: { random: 0, scripted: 0, jev: 0 }, fallbacks: {},
  };
  const problem = (p: string) => { if (result.problems.length < 20) result.problems.push(p); };

  let m: AnyMatch;
  try {
    m = startMatch(rules, setup, 0);
  } catch (e: any) {
    result.match = { setup, records: [], state: null } as any;
    problem(`setup refused: ${String(e?.message ?? e)}`);
    return result;
  }
  let at = 0;
  const host = (): any => rules.view(m.state, { kind: 'host' });

  // Paper tickets: the simulation holds each guest's paper tickets (the app never sees them).
  const paper = new Map<string, { number: number; rows: Rows }[]>();
  let paperNo = 0;
  const givePaper = (id: string, n: number) => {
    const list = paper.get(id) ?? [];
    for (let i = 0; i < n; i++) list.push({ number: ++paperNo, rows: paperRows(rng) });
    paper.set(id, list);
  };
  if (mode === 'paper') guests.forEach((g, i) => givePaper(g.id, ticketCounts[i]!));
  /** Phone tickets that were already complete for a pattern when their owner joined (TAM-067). */
  const precomplete = new Set<string>();
  /** Phone tickets whose owner now holds a paper ticket instead (TAM-058). */
  const onPaper = new Set<string>();

  const seen = new Set<number>();
  const check = (why: string) => {
    const hv = host();
    const called: number[] = hv.called;
    if (new Set(called).size !== called.length) problem(`a number was called twice (after ${why})`);
    if (called.some((n) => !Number.isInteger(n) || n < 1 || n > 90)) problem(`a called number is outside 1 to 90 (after ${why})`);
    for (const n of called) seen.add(n);
    const broken = rules.invariants(m.state);
    if (broken.length) problem(`invariants after ${why}: ${broken.join('; ')}`);
    if (!checkViews) return;
    const calledSet = new Set(called);
    const secrets = [drawSeed, ...(mode === 'phone' ? [sheetSeed] : [])].flatMap(seedForms);
    const room = rules.view(m.state, { kind: 'room' });
    const roomText = JSON.stringify(room);
    if (secrets.some((s) => roomText.includes(s))) problem(`a seed is in the room view (after ${why}) (PLT-101)`);
    // Claims are left out: a bogey may name a ticket's missing numbers (TAM-038), which says nothing about the draw.
    for (const { path, list } of numberLists(room, new Set(['tiers', 'summary', 'payouts', 'money', 'claims']))) {
      if (list.some((n) => n >= 1 && n <= 90 && !calledSet.has(n))) { problem(`the room view lists an uncalled number in ${path} (after ${why}) (TAM-052)`); break; }
    }
    if (mode === 'phone') {
      if (Array.isArray((room as any).tickets) && (room as any).tickets.length) problem(`the room view shows tickets (after ${why})`);
      const who = guests[viewRng.int(guests.length)]!;
      if (hv.players.some((p: any) => p.id === who.id)) {
        const pv: any = rules.view(m.state, { kind: 'player', playerId: who.id });
        const text = JSON.stringify(pv);
        if (secrets.some((s) => text.includes(s))) problem(`a seed is in ${who.id}'s view (after ${why}) (TAM-052)`);
        const own = new Set((pv.tickets ?? []).flatMap((t: any) => nums(t.rows)));
        const mine = hv.tickets.filter((t: any) => t.playerId === who.id).map((t: any) => t.number).sort();
        const shown = (pv.tickets ?? []).map((t: any) => t.number).sort();
        if (JSON.stringify(mine) !== JSON.stringify(shown)) problem(`${who.id}'s view shows tickets ${shown} but holds ${mine} (after ${why}) (TAM-050)`);
        for (const { path, list } of numberLists(pv, new Set(['tickets', 'tiers', 'summary', 'payouts', 'money']))) {
          if (list.some((n) => n >= 1 && n <= 90 && !own.has(n))) { problem(`${who.id}'s view lists a number not on their own tickets in ${path} (after ${why}) (TAM-051)`); break; }
        }
      }
    }
  };

  const move = (mv: any, why = mv.type): any => {
    const r = play(rules, m, mv, { by: HOST, at: (at += 1000) });
    if (r.ok) { m = r.value; check(why); }
    return r;
  };
  const undoSeq = (seq: number, now: number, why: string) => {
    const r = undo(rules, m, seq, { by: HOST, now });
    if (r.ok) { m = r.value; result.undos++; check(why); }
    return r;
  };
  const act = (persona: string) => (result.personaActs[persona] ??= { onTime: 0, late: 0, falseClaims: 0, missed: 0 });

  // Every guest's tickets: phone tickets from the host view, paper ones from the simulation.
  const ticketTotal = (): number => (mode === 'phone' ? host().tickets.length : [...paper.values()].reduce((a, l) => a + l.length, 0));
  const ticketsOf = (id: string): { number: number; rows: Rows; phone: boolean }[] => {
    if (mode === 'paper') return (paper.get(id) ?? []).map((t) => ({ ...t, phone: false }));
    const hv = host();
    const out = hv.tickets.filter((t: any) => t.playerId === id && t.status !== 'out')
      .map((t: any) => ({ number: t.number, rows: t.rows, phone: t.status !== 'paper' }));
    return out.concat((paper.get(id) ?? []).map((t) => ({ ...t, phone: false })));
  };

  for (let guard = 0; guard < 600 && !rules.isOver(m.state); guard++) {
    let hv = host();
    // The host: close tiers that are won (TAM-145), end once the last Full House is closed (TAM-075),
    // sometimes end early (TAM-066) or discard (TAM-140).
    const r = rng.int(2000);
    if (r === 0) { move({ type: 'discard' }); break; }
    if (r <= 3 && hv.called.length > 0) { move({ type: 'end' }); break; }
    for (const p of hv.awaitingClose as Pattern[]) move({ type: 'close-tier', pattern: p });
    hv = host();
    if (hv.readyToEnd || hv.allCalled) { move({ type: 'end' }); break; }

    // Late joiners (TAM-067), and sometimes one added by mistake and taken out again (TAM-184).
    if (hv.called.length < houseRules.lateJoinUntil && rng.int(12) === 0 && ticketTotal() <= 57) {
      const i = guests.length + 1;
      const t = 1 + rng.int(3);
      const useJev = jev !== null && rng.int(1000) < jevShare * 1000;
      const g: SimGuest = { id: `p${i}`, name: `Player ${i}`, persona: useJev ? JEV_PERSONAS[rng.int(3)]! : SCRIPTED[rng.int(5)]!, kind: useJev ? 'jev' : 'scripted', joinedLate: true };
      const before = mode === 'phone' ? new Set(host().tickets.map((x: any) => x.number)) : null;
      const ra = move({ type: 'add-player', player: { id: g.id, name: g.name, tickets: t } }, 'a late joiner');
      if (!ra.ok) problem(`late joiner at ${hv.called.length} called was refused: ${ra.reason}`);
      else if (rng.int(5) === 0) {
        const rr = move({ type: 'remove-player', playerId: g.id }, 'removing a late joiner');
        if (!rr.ok) problem(`removing a late joiner straight away was refused: ${rr.reason}`);
      } else {
        guests.push(g);
        result.lateJoiners++;
        if (mode === 'paper') givePaper(g.id, t);
        else {
          const calledNow: number[] = host().called;
          for (const tk of host().tickets.filter((x: any) => !before!.has(x.number))) {
            for (const p of patterns) if (expected(tk.rows, p, calledNow).verdict !== 'bogey' || expected(tk.rows, p, calledNow).reason === 'late') precomplete.add(`${tk.number}:${p}`);
          }
        }
      }
    }

    // Phone games: now and then a ticket changes hands (TAM-172) or a phone dies (TAM-058).
    if (mode === 'phone' && hv.called.length > 0 && rng.int(80) === 0) {
      const tk = hv.tickets[rng.int(hv.tickets.length)];
      const to = guests[rng.int(guests.length)]!;
      if (tk && tk.playerId !== to.id) {
        const ra = move({ type: 'assign', ticket: tk.number, playerId: to.id }, 'handing a ticket over');
        if (!ra.ok) problem(`handing ticket ${tk.number} to ${to.id} was refused: ${ra.reason}`);
      }
    }
    if (mode === 'phone' && hv.called.length > 0 && rng.int(150) === 0) {
      const g = guests[rng.int(guests.length)]!;
      if (host().players.some((p: any) => p.id === g.id)) {
        const rp = move({ type: 'to-paper', playerId: g.id }, 'giving a paper ticket');
        if (rp.ok) host().tickets.filter((t: any) => t.playerId === g.id).forEach((t: any) => onPaper.add(String(t.number)));
      }
    }

    // The next number.
    const rc = move({ type: 'call' });
    if (!rc.ok) { problem(`call refused: ${rc.reason}`); break; }
    // Undo the last call now and then, within 5 seconds (TAM-071, TAM-119), then call again.
    if (rng.int(40) === 0) {
      const last = m.records[m.records.length - 1]!;
      const calledBefore = host().called.length;
      const ru = undoSeq(last.seq, last.at + 2000, 'undoing the last call');
      if (!ru.ok) problem(`undoing the latest call 2 seconds later was refused: ${ru.reason}`);
      else if (host().called.length !== calledBefore - 1) problem('undoing the latest call did not take the number back');
      at += 2000;
      const again = move({ type: 'call' });
      if (!again.ok) { problem(`call after undo refused: ${again.reason}`); break; }
    }
    hv = host();
    const called: number[] = hv.called;

    // Every guest decides: claim something, or stay quiet. Code works out the facts first (PLT-110).
    const open = (hv.openPatterns as Pattern[]).filter((p) => p !== 'second-full-house' || !hv.openPatterns.includes('full-house'));
    const items: { situation: Situation<any>; chooser: Chooser; guest: SimGuest }[] = [];
    for (const g of guests) {
      if (!hv.players.some((p: any) => p.id === g.id)) continue;
      const facts: string[] = [];
      const options: (Option<any> & { data?: ClaimData })[] = [];
      let falseOffered = false;
      for (const t of ticketsOf(g.id)) {
        for (const p of open) {
          const e = expected(t.rows, p, called);
          const state: ClaimData['state'] = e.verdict === 'accepted' ? 'now' : e.reason === 'late' ? 'earlier' : 'not';
          if (state === 'now') facts.push(`Ticket ${t.number}, ${LABEL[p]}: complete with the number just called (${called[called.length - 1]})`);
          if (state === 'earlier') facts.push(`Ticket ${t.number}, ${LABEL[p]}: was complete at ${(e as any).completedAt}, earlier`);
          if (state === 'not' && falseOffered) continue;
          if (state === 'not') falseOffered = true;
          options.push({
            key: `claim-${p}-t${t.number}`,
            move: t.phone ? { type: 'check-claim', ticket: t.number, pattern: p } : null,
            says: `Shout "${LABEL[p]}!" for ticket ${t.number}${state === 'not' ? ' (not complete)' : ''}`,
            expects: 'accepted',
            data: { ticket: t.number, pattern: p, state },
          });
        }
      }
      if (options.every((o) => o.data!.state === 'not') && g.persona !== 'false' && g.persona !== 'eager' && g.persona !== 'over-eager-child') continue; // nothing to decide
      options.push({ key: 'stay-quiet', move: null, says: 'Say nothing for now' });
      if (!facts.length) facts.push('No prize is complete on your tickets yet');
      const persona = PERSONAS[g.persona]!;
      items.push({
        guest: g,
        situation: { game: 'Tambola', actor: g.id, persona, facts, options },
        chooser: { kind: g.kind, script: habitScript(persona.habit) },
      });
    }
    const decisions: Decision<any>[] = items.length ? await decideAll(items, choiceRng, jev) : [];

    // The shouted claims, in the order heard. The engine is the referee (PLT-112).
    const paperWins = new Map<Pattern, string[]>();
    decisions.forEach((d, i) => {
      const { guest: g, situation } = items[i]!;
      result.decisionsBy[d.by]++;
      if (d.fallback) result.fallbacks[d.fallback] = (result.fallbacks[d.fallback] ?? 0) + 1;
      const opt = situation.options.find((o) => o.key === d.key) as Option & { data?: ClaimData };
      const a = act(g.persona);
      if (!opt.data) {
        if (situation.options.some((o) => (o as any).data?.state === 'now')) a.missed++;
        return;
      }
      const { pattern, ticket, state } = opt.data;
      if (state === 'now') a.onTime++; else if (state === 'earlier') a.late++; else a.falseClaims++;
      if (rules.isOver(m.state)) return;
      if (opt.move) {
        // Phone ticket: the host checks it (TAM-178); the verdict must be what the called numbers say (TAM-034 to TAM-038).
        const before = host().claims.length;
        const status = host().tickets.find((t: any) => t.number === ticket)?.status;
        const wasOpen = host().openPatterns.includes(pattern);
        const rr = move(opt.move, `a claim for ${pattern} on ticket ${ticket}`);
        const clear = status === 'in-play' && wasOpen && !precomplete.has(`${ticket}:${pattern}`) && !onPaper.has(String(ticket))
          && host().openPatterns.includes(pattern)
          && !host().claims.slice(0, before).some((c: any) => c.ticket === ticket && c.pattern === pattern && c.verdict === 'accepted');
        const claim = rr.ok ? host().claims[before] : null;
        const verdict = claim ? claim.verdict : rr.ok ? 'nothing recorded' : 'refused';
        const want = expected(ticketsOf(g.id).find((t) => t.number === ticket)?.rows ?? [[], [], []], pattern, host().called);
        if (clear && rr.ok && claim && claim.verdict !== want.verdict) problem(`ticket ${ticket} ${pattern}: engine said ${claim.verdict}, the called numbers say ${want.verdict} (TAM-034)`);
        if (clear && !rr.ok) problem(`ticket ${ticket} ${pattern} claim refused: ${rr.reason}`);
        if (claim?.verdict === 'accepted') result.accepted++;
        if (claim?.verdict === 'bogey') result.bogeys++;
        const dis = disagreement(d, g.id, g.persona, verdict);
        if (dis) result.disagreements.push(dis);
      } else {
        // Paper ticket: the anchor checks it in the room (TAM-037) and the host records what the anchor decided.
        if (state === 'now' && host().openPatterns.includes(pattern)) {
          const list = paperWins.get(pattern) ?? [];
          if (!list.includes(g.id)) list.push(g.id);
          paperWins.set(pattern, list);
        } else {
          const rb = move({ type: 'record-bogey', playerId: g.id, pattern }, `a bogey for ${pattern}`);
          if (!rb.ok && host().openPatterns.includes(pattern)) problem(`bogey for ${g.id} ${pattern} not recorded: ${rb.reason}`);
          if (rb.ok) result.bogeys++;
          const dis = disagreement(d, g.id, g.persona, rb.ok ? 'bogey' : 'refused');
          if (dis) result.disagreements.push(dis);
        }
      }
    });
    // Paper wins: shared winners recorded together or one by one ("Add another winner", TAM-041, TAM-042).
    for (const [pattern, ids] of paperWins) {
      const already = host().claims.filter((c: any) => c.pattern === pattern && c.verdict === 'accepted').map((c: any) => c.playerId);
      const fresh = ids.filter((id) => !already.includes(id));
      if (!fresh.length) continue;
      const batches = rng.int(2) ? [fresh] : fresh.map((id) => [id]);
      for (const b of batches) {
        const rw = move({ type: 'record-win', pattern, playerIds: b }, `a win for ${pattern}`);
        if (!rw.ok && host().openPatterns.includes(pattern)) problem(`on-time ${pattern} for ${b.join(', ')} could not be recorded: ${rw.reason}`);
        if (rw.ok) result.accepted += b.length;
      }
    }
    // Sometimes the host undoes a recorded claim (TAM-070, TAM-072) and records it again if it was right.
    if (rng.int(60) === 0) {
      const claimRecs = m.records.filter((x: any) => ['record-win', 'record-bogey', 'check-claim'].includes(x.move.type));
      const rec: any = claimRecs[claimRecs.length - 1];
      if (rec && !rules.isOver(m.state)) {
        const ru = undoSeq(rec.seq, at + 1000, 'undoing a claim');
        at += 1000;
        if (!ru.ok) problem(`undoing a recorded claim was refused: ${ru.reason}`);
        else if (rng.int(2) === 0) move(rec.move, 'recording the claim again');
      }
    }
    if (result.callsBeforeFirstFullHouse === null && host().claims.some((c: any) => c.pattern === 'full-house' && c.verdict === 'accepted')) {
      result.callsBeforeFirstFullHouse = host().called.length;
    }
  }

  result.match = m;
  const hv = host();
  result.tickets = (hv.tickets?.length ?? 0) || [...paper.values()].reduce((a, l) => a + l.length, 0);
  if (!rules.isOver(m.state)) { problem('the game never ended (TAM-077)'); return result; }
  const summary = hv.summary;
  if (!summary) { problem('no summary at the end'); return result; }
  result.ended = summary.result === 'discarded' ? 'discarded' : hv.readyToEnd || hv.allCalled ? 'ended' : 'ended-early';
  result.ties = (summary.tiers ?? []).filter((t: any) => t.winners.length > 1).length;
  if (summary.money) for (const p of moneyProblems(summary.money)) problem(`money: ${p}`);
  if (summary.payouts && summary.pot !== null) {
    const out = summary.payouts.reduce((a: number, p: any) => a + p.won + p.handedBack, 0);
    if (out !== summary.pot) problem(`paid out plus handed back ${out}, pot ${summary.pot} (TAM-091)`);
    const gives = summary.payouts.reduce((a: number, p: any) => a + p.hostGives, 0);
    if (gives !== summary.pot) problem(`the host hands out ${gives}, pot ${summary.pot} (TAM-089)`);
    for (const t of summary.tiers) {
      if (t.winners.length && t.winners.reduce((a: number, w: any) => a + w.amount, 0) !== t.amount) problem(`${t.pattern} winners get ${t.winners.map((w: any) => w.amount)}, tier ${t.amount} (TAM-087)`);
    }
    if (summary.result === 'discarded' && summary.payouts.some((p: any) => p.hostGives !== p.paid)) problem('a discarded game does not hand back every contribution (TAM-140)');
  }
  const again = replay(rules, m.setup, m.records);
  if (!again.ok) problem(`replay failed: ${again.reason} (TAM-073)`);
  else if (JSON.stringify(again.value.state) !== JSON.stringify(m.state)) problem('the replay differs from the game (TAM-073)');
  return result;
}

// ---------- Replays (TAM-074) ----------

/** Saves a failing game as a permanent replay test. Never delete these files. Nothing here can hold the Jev key. */
export function saveMassReplay(r: GameResult, note: string): string {
  const dir = fileURLToPath(new URL('../replays/', import.meta.url));
  mkdirSync(dir, { recursive: true });
  const file = `tambola-mass-${r.seed.replace(/[^a-z0-9-]/gi, '_')}.json`;
  writeFileSync(dir + file, JSON.stringify({
    game: 'tambola', massSim: r.seed, note: redact(note), savedOn: new Date().toISOString().slice(0, 10),
    setup: r.match.setup, records: r.match.records,
  }, null, 1));
  return `tests/replays/${file}`;
}

// ---------- A run and its summary (PLT-117) ----------

export interface RunOpts extends GameOpts {
  games: number;
  /** Seeds are `${prefix}-${i}`. */
  prefix?: string;
  saveReplays?: boolean;
  /** The Jev situation, for the summary: 'no-key' | 'jev' | 'off'. */
  jevNote?: string;
}

export interface RunSummary {
  games: number;
  ended: Record<GameResult['ended'], number>;
  paperGames: number;
  phoneGames: number;
  ticketsLowest: number;
  ticketsHighest: number;
  claimsAccepted: number;
  bogeys: number;
  ties: number;
  lateJoiners: number;
  undos: number;
  firstFullHouse: { lowest: number | null; typical: number | null; highest: number | null; games: number };
  personas: GameResult['personaActs'];
  decisionsBy: Record<PlayerKind, number>;
  fallbacks: Record<string, number>;
  disagreements: number;
  jev: { line: string; calls: number; decisions: number; capReached: boolean; failures: string[] };
  failures: { seed: string; problems: string[]; replay: string | null }[];
}

export async function runMany(opts: RunOpts): Promise<RunSummary> {
  const prefix = opts.prefix ?? 'mass';
  const s: RunSummary = {
    games: 0, ended: { ended: 0, 'ended-early': 0, discarded: 0, never: 0 }, paperGames: 0, phoneGames: 0,
    ticketsLowest: Infinity, ticketsHighest: 0, claimsAccepted: 0, bogeys: 0, ties: 0, lateJoiners: 0, undos: 0,
    firstFullHouse: { lowest: null, typical: null, highest: null, games: 0 }, personas: {},
    decisionsBy: { random: 0, scripted: 0, jev: 0 }, fallbacks: {}, disagreements: 0,
    jev: { line: '', calls: 0, decisions: 0, capReached: false, failures: [] }, failures: [],
  };
  const fh: number[] = [];
  for (let i = 0; i < opts.games; i++) {
    const r = await playGame(`${prefix}-${i}`, opts);
    s.games++;
    s.ended[r.ended]++;
    if (r.mode === 'paper') s.paperGames++; else s.phoneGames++;
    s.ticketsLowest = Math.min(s.ticketsLowest, r.tickets);
    s.ticketsHighest = Math.max(s.ticketsHighest, r.tickets);
    s.claimsAccepted += r.accepted; s.bogeys += r.bogeys; s.ties += r.ties; s.lateJoiners += r.lateJoiners; s.undos += r.undos;
    if (r.callsBeforeFirstFullHouse !== null) fh.push(r.callsBeforeFirstFullHouse);
    for (const [p, a] of Object.entries(r.personaActs)) {
      const t = (s.personas[p] ??= { onTime: 0, late: 0, falseClaims: 0, missed: 0 });
      t.onTime += a.onTime; t.late += a.late; t.falseClaims += a.falseClaims; t.missed += a.missed;
    }
    for (const k of Object.keys(r.decisionsBy) as PlayerKind[]) s.decisionsBy[k] += r.decisionsBy[k];
    for (const [k, v] of Object.entries(r.fallbacks)) s.fallbacks[k] = (s.fallbacks[k] ?? 0) + v;
    s.disagreements += r.disagreements.length;
    if (r.problems.length) {
      const replayFile = opts.saveReplays && r.match?.records ? saveMassReplay(r, r.problems.join('; ')) : null;
      s.failures.push({ seed: r.seed, problems: r.problems.map((p) => redact(p)), replay: replayFile });
    }
  }
  if (s.ticketsLowest === Infinity) s.ticketsLowest = 0;
  fh.sort((a, b) => a - b);
  if (fh.length) s.firstFullHouse = { lowest: fh[0]!, typical: fh[Math.floor(fh.length / 2)]!, highest: fh[fh.length - 1]!, games: fh.length };
  const jev = opts.jev ?? null;
  if (jev) {
    s.jev = { line: '', calls: jev.stats.calls, decisions: jev.stats.decisions, capReached: jev.stats.capReached, failures: jev.stats.failures.slice(0, 5) };
    s.jev.line = jev.stats.capReached
      ? `Jev: weekly cap of ${WEEKLY_CAP.toLocaleString('en-GB')} decisions reached; the rest of the run used scripted players`
      : jev.stats.failures.length && jev.stats.decisions === 0 ? 'Jev unavailable: ran with random and scripted players'
      : `Jev: ${jev.stats.decisions} decisions in ${jev.stats.calls} calls`;
  } else {
    s.jev.line = opts.jevNote === 'off' ? 'Jev turned off: ran with random and scripted players' : NO_KEY_MESSAGE;
  }
  return s;
}

/** The plain summary (PLT-117). The same format with and without Jev (PLT-111). Never holds the key (PLT-115). */
export function summaryText(s: RunSummary, title = 'Tambola simulation'): string {
  const fh = s.firstFullHouse;
  const lines = [
    `# ${title}`,
    '',
    `Players: ${s.jev.line}`,
    `Games played: ${s.games} (${s.paperGames} paper, ${s.phoneGames} phone; ${s.ticketsLowest} to ${s.ticketsHighest} tickets)`,
    `How they ended: ${s.ended.ended} played to the end, ${s.ended['ended-early']} ended early, ${s.ended.discarded} discarded, ${s.ended.never} never ended`,
    `Claims: ${s.claimsAccepted} wins recorded, ${s.bogeys} bogeys, ${s.ties} shared prizes (ties)`,
    `Late joiners: ${s.lateJoiners}; undos: ${s.undos}`,
    `Numbers called before the first Full House: lowest ${fh.lowest ?? '-'}, typical ${fh.typical ?? '-'}, highest ${fh.highest ?? '-'} (${fh.games} games)`,
    `Decisions: ${s.decisionsBy.scripted} scripted, ${s.decisionsBy.random} random, ${s.decisionsBy.jev} by Jev`
      + (Object.keys(s.fallbacks).length ? `; fell back to scripts: ${Object.entries(s.fallbacks).map(([k, v]) => `${v} (${k})`).join(', ')}` : ''),
    `Players who expected another verdict (recorded, not applied): ${s.disagreements}`,
    '',
    'What the players did:',
    ...Object.entries(s.personas).sort().map(([p, a]) => `- ${p}: claims on time ${a.onTime}, claims made late ${a.late}, false claims ${a.falseClaims}, wins missed ${a.missed}`),
    '',
    `Failures: ${s.failures.length}`,
    ...s.failures.slice(0, 50).map((f) => `- ${f.seed}: ${f.problems.join('; ')}${f.replay ? ` Replay: ${f.replay}` : ''}`),
    ...(s.jev.failures.length ? ['', 'Jev problems (setup, not app bugs, PLT-122):', ...s.jev.failures.map((f) => `- ${f}`)] : []),
    '',
  ];
  return redact(lines.join('\n'));
}
