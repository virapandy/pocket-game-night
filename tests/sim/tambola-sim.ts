// A code-only simulation of a paper-ticket Tambola evening: real-looking tickets, and players who claim
// on time, late, falsely, or never. The host calls, checks every shouted claim, and ends the game
// once all 90 are out. Jev is not needed: every choice here comes from a seeded generator.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRng, HOST, play, startMatch, type Rng } from '../../src/engine';
import { rules, setupInput, NEEDS, type AnyMatch, type Pattern } from '../games/tambola/helpers';

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
  const pending: { playerId: string; pattern: Pattern; numbers: number[] }[] = [];

  const move = (mv: any) => {
    const r = play(rules, m, mv, { by: HOST, at: (at += 1000) });
    if (r.ok) m = r.value;
    return r;
  };
  const host = () => rules.view(m.state, { kind: 'host' });

  for (let guard = 0; guard < 1000 && !rules.isOver(m.state); guard++) {
    if (host().allCalled) {
      // Everything is out: prompt players still claim Full House if it completed on the last call.
      move({ type: 'end' });
      break;
    }
    const r = move({ type: 'call' });
    if (!r.ok) { problems.push(`call refused: ${r.reason}`); break; }
    const called: number[] = host().called;
    const latest = called[called.length - 1]!;

    // Late claims from the previous number come in now.
    for (const c of pending.splice(0)) {
      const before = host().claims.length;
      move({ type: 'claim', ...c });
      const claim = host().claims[before];
      if (claim && !(claim.verdict === 'bogey' && claim.reason === 'late')) {
        problems.push(`late ${c.pattern} by ${c.playerId} was ${claim.verdict} (${claim.reason ?? 'no reason'})`);
      }
    }

    for (const p of players) {
      for (const pattern of host().openPatterns as Pattern[]) {
        if (rules.isOver(m.state)) break;
        for (const t of p.tickets) {
          const nums = patternNumbers(t, pattern, called);
          const justNow = nums && completedAtIndex(nums, called) === called.length - 1;
          if (justNow && p.persona === 'prompt') {
            const before = host().claims.length;
            move({ type: 'claim', playerId: p.id, pattern, numbers: nums });
            const claim = host().claims[before];
            if (claim && claim.verdict !== 'accepted' && host().openPatterns.includes(pattern)) {
              problems.push(`on-time ${pattern} by ${p.id} at ${latest} was ${claim.verdict}`);
            }
          } else if (justNow && p.persona === 'late') {
            pending.push({ playerId: p.id, pattern, numbers: nums });
          } else if (!nums && p.persona === 'false' && rng.int(40) === 0) {
            // A false claim always includes at least one number that was never called.
            const all = t.flat();
            const wrong = [...all.filter((n) => !called.includes(n)), ...all.filter((n) => called.includes(n))].slice(0, NEEDS[pattern]);
            if (wrong.length === NEEDS[pattern]) {
              const before = host().claims.length;
              move({ type: 'claim', playerId: p.id, pattern, numbers: wrong });
              const claim = host().claims[before];
              if (claim && claim.verdict === 'accepted') problems.push(`false ${pattern} by ${p.id} was accepted`);
            }
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
