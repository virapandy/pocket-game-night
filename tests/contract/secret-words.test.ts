// Secret Words against the shared contract suite (PLT-100 onwards; SWD-025: views keep every secret; seeds never
// leave the host). Written before the build, 22 October 2026. The driver taps through game nights as a host would,
// following the "Tap → move" table in specs/secret-words/README.md: complete moves from `legalMoves`, clues as detail
// moves, a few games, then "End for tonight".
import { expect, it } from 'vitest';
import { createRng, HOST, type Match, type Rng } from '../../src/engine';
import { need, randomChoices, randomClue, setupInput, exampleTeams } from '../games/secret-words/helpers';
import { contractSuite } from './suite';

/* eslint-disable @typescript-eslint/no-explicit-any */
let rules: any = null;
let notBuilt: unknown = null;
try { rules = need('secretWordsRules'); } catch (e) { notBuilt = e; }
it('Secret Words registers its rules for the contract suite (secretWordsRules)', () => { if (notBuilt) throw notBuilt; });

const JUNK: any[] = [
  { type: 'nonsense' },
  { type: 'deal', code: '27P3QX9' }, // wrong check symbol
  { type: 'reveal', cell: 99 },
  { type: 'clue', n: 12 },
  { type: 'clue', n: 2, word: 'x'.repeat(25) },
  { type: 'setPlayers', players: ['Riya', 'Arjun'], teams: { ...exampleTeams(), orange: ['Riya'], teal: ['Arjun'] } },
];

function choose(match: Match<any, any, any>, rng: Rng): any {
  const view = rules.view(match.state, { kind: 'room' });
  const legal: any[] = rules.legalMoves(match.state, HOST) ?? [];
  if (legal.length === 0) return null;
  const games = match.records.filter((r) => r.move.type === 'deal').length;
  const gameOver = view.winner !== null || view.endedEarly === true;
  if (games === 0) return legal.find((m) => m.type === 'deal') ?? null;
  if (gameOver) {
    if (games >= 3 || rng.int(4) === 0) return legal.find((m) => m.type === 'endEvening') ?? null;
    return legal.find((m) => m.type === 'deal') ?? null;
  }
  const pool: any[] = [];
  for (const m of legal) {
    if (m.type === 'endGame') { if (rng.int(80) === 0) pool.push(m); }
    else if (m.type === 'dealNew') { if (rng.int(60) === 0) pool.push(m); }
    else if (m.type === 'endEvening' || m.type === 'deal') continue;
    else pool.push(m);
  }
  pool.push(randomClue(rng));
  return pool[rng.int(pool.length)];
}

if (rules) {
  contractSuite('Secret Words', {
    rules,
    makeSetup: (seed) => {
      const r = createRng(`setup:${seed}`);
      return setupInput({ seed: `deal-${seed}-secret`, teamsSeed: `teams-${seed}-secret`, choices: randomChoices(r) });
    },
    viewers: (setup) => [{ kind: 'room' }, ...setup.config.players.map((p: string) => ({ kind: 'player' as const, playerId: p }))],
    chooseMove: choose,
    junkMoves: JUNK,
    maxMoves: 2000,
  });

  it('secretWordsRules has the id "secret-words" and clue is a detail move (Test hooks item 1)', () => {
    expect(rules.id).toBe('secret-words');
    expect(rules.detailMoves).toContain('clue');
  });
}
