// A code-only simulation of a paper-ticket Tambola evening: real-looking tickets, and players who claim
// on time, late, falsely, or never. The anchor checks each shouted claim against the paper ticket (here: the
// simulation, which knows the tickets) and the host records the result (TAM-037): a win, or a bogey for a
// late or false claim. The host ends the game once all 90 are out. Jev is not needed: every choice here
// comes from a seeded generator.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRng, HOST, play, startMatch, type Rng } from '../../src/engine';
import { rules, setupInput, type AnyMatch, type Pattern } from '../games/tambola/helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Persona = 'prompt' | 'late' | 'false' | 'never';
export interface SimPlayer { id: string; name: string; persona: Persona; tickets: number[][][] } // ticket = 3 rows

/** A valid-looking paper ticket: 3 rows of 5, each number in its column range, each column used. */
export function makeTicket(rng: Rng): number[][] {
  const col = (n: number) => (n === 90 ? 8 : Math.floor(n / 10));
  for (;;) {
    const rows: number[][] = [];
    const used = new Set<number>();
    for (let r = 0; r < 3; r++) {
      // Choose 5 distinct columns for this row.
      const chosen: number[] = [];
      while (chosen.length < 5) { const c = rng.int(9); if (!chosen.includes(c)) chosen.push(c); }
      const row = chosen.map((c) => {
        const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9;
        let n: number;
        do n = lo + rng.int(hi - lo + 1); while (used.has(n));
        used.add(n);
        return n;
      });
      rows.push(row.sort((a, b) => col(a) - col(b)));
    }
    const colsUsed = new Set(rows.flat().map(col));
    if (colsUsed.size === 9) return rows;
  }
}

/** The numbers a player reads out for a pattern on a ticket, once it is complete. */
export function patternNumbers(ticket: number[][], pattern: Pattern, called: number[]): number[] | null {
  const all = ticket.flat();
  const isCalled = (n: number) => called.includes(n);
  switch (pattern) {
    case 'early-five': {
      const done = all.filter(isCalled);
      return done.length >= 5 ? done.sort((a, b) => called.indexOf(a) - called.indexOf(b)).slice(0, 5) : null;
    }
    case 'top-line': return ticket[0]!.every(isCalled) ? ticket[0]! : null;
    case 'middle-line': return ticket[1]!.every(isCalled) ? ticket[1]! : null;
    case 'bottom-line': return ticket[2]!.every(isCalled) ? ticket[2]! : null;
    case 'four-corners': {
      const c = [ticket[0]![0]!, ticket[0]![4]!, ticket[2]![0]!, ticket[2]![4]!];
      return c.every(isCalled) ? c : null;
    }
    case 'full-house':
    case 'second-full-house': return all.every(isCalled) ? all : null;
  }
}

/** The call on which the numbers were all out, or -1. */
const completedAtIndex = (nums: number[], called: number[]) => Math.max(...nums.map((n) => called.indexOf(n)));

export interface SimResult { seed: string; match: AnyMatch; problems: string[]; players: SimPlayer[] }

export function simulate(seed: string): SimResult {
  const rng = createRng(`sim:${seed}`);
  const personas: Persona[] = ['prompt', 'late', 'false', 'never'];
  const count = 2 + rng.int(9);
  const players: SimPlayer[] = Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    persona: personas[rng.int(4)]!,
    tickets: Array.from({ length: 1 + rng.int(3) }, () => makeTicket(rng)),
  }));
  const setup = setupInput({ seed: `draw:${seed}`, players: players.map((p) => ({ id: p.id, name: p.name, tickets: p.tickets.length })) });
  let m = startMatch(rules, setup, 0);
  let at = 0;
  const problems: string[] = [];
  const pending: { playerId: string; pattern: Pattern }[] = [];

  const move = (mv: any) => {
    const r = play(rules, m, mv, { by: HOST, at: (at += 1000) });
    if (r.ok) m = r.value;
    return r;
  };
  const host = () => rules.view(m.state, { kind: 'host' });

  for (let guard = 0; guard < 1000 && !rules.isOver(m.state); guard++) {
    // TAM-145: after everyone who shouted has been recorded, the host closes the won tiers by hand.
    for (const p of host().awaitingClose as Pattern[]) move({ type: 'close-tier', pattern: p });
    // TAM-075: once the last Full House is closed, the host ends the game.
    if (host().readyToEnd) {
      move({ type: 'end' });
      break;
    }
    if (host().allCalled) {
      move({ type: 'end' });
      break;
    }
    const r = move({ type: 'call' });
    if (!r.ok) { problems.push(`call refused: ${r.reason}`); break; }
    const called: number[] = host().called;
    const latest = called[called.length - 1]!;

    // Late claims from the previous number come in now: the anchor rules them bogeys (TAM-043).
    for (const c of pending.splice(0)) {
      const before = host().claims.length;
      const rb = move({ type: 'record-bogey', ...c });
      const claim = host().claims[before];
      if (!rb.ok || !claim || claim.verdict !== 'bogey') problems.push(`late ${c.pattern} by ${c.playerId}: bogey not recorded (${rb.ok ? 'no claim' : rb.reason})`);
    }

    for (const p of players) {
      for (const pattern of host().openPatterns as Pattern[]) {
        if (rules.isOver(m.state)) break;
        if (pattern === 'second-full-house' && host().openPatterns.includes('full-house')) continue; // only after Full House is closed
        for (const t of p.tickets) {
          const nums = patternNumbers(t, pattern, called);
          const justNow = nums && completedAtIndex(nums, called) === called.length - 1;
          if (justNow && p.persona === 'prompt') {
            const already = host().claims.some((c: any) => c.pattern === pattern && c.playerId === p.id && c.verdict === 'accepted');
            if (already) continue;
            const rw = move({ type: 'record-win', pattern, playerIds: [p.id] });
            if (!rw.ok && host().openPatterns.includes(pattern)) {
              problems.push(`on-time ${pattern} by ${p.id} at ${latest} could not be recorded: ${rw.reason}`);
            }
          } else if (justNow && p.persona === 'late') {
            pending.push({ playerId: p.id, pattern });
          } else if (!nums && p.persona === 'false' && rng.int(40) === 0) {
            const rb = move({ type: 'record-bogey', playerId: p.id, pattern });
            if (!rb.ok) problems.push(`false ${pattern} by ${p.id}: bogey not recorded (${rb.reason})`);
          }
        }
      }
    }
  }
  if (!rules.isOver(m.state)) problems.push('the game never ended');
  const broken = rules.invariants(m.state);
  if (broken.length) problems.push(...broken);
  return { seed, match: m, problems, players };
}

/** TAM-074: a failing game is saved as a permanent replay test. Never delete these files. */
export function saveReplay(result: SimResult, note: string): string {
  const dir = fileURLToPath(new URL('../replays/', import.meta.url));
  mkdirSync(dir, { recursive: true });
  const file = `${dir}tambola-sim-${result.seed.replace(/[^a-z0-9-]/gi, '_')}.json`;
  writeFileSync(file, JSON.stringify({
    game: 'tambola',
    sim: result.seed,
    note,
    savedOn: new Date().toISOString().slice(0, 10),
    setup: result.match.setup,
    records: result.match.records,
  }, null, 1));
  return file;
}
