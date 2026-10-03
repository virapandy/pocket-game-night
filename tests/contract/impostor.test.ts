// Impostor against the shared contract suite (PLT-100 onwards; IMP-062: the views keep every secret).
// The driver taps through evenings as a host would, following the "Tap → move" table in specs/impostor/README.md.
import { expect, it } from 'vitest';
import { createRng, type Match, type Rng } from '../../src/engine';
import { need, setupInput, NAMES } from '../games/impostor/helpers';
import { contractSuite } from './suite';

/* eslint-disable @typescript-eslint/no-explicit-any */
let impostorRules: any = null;
let notBuilt: unknown = null;
try { impostorRules = need('impostorRules'); } catch (e) { notBuilt = e; }
it('Impostor registers its rules for the contract suite (impostorRules)', () => { if (notBuilt) throw notBuilt; });

/** Where the evening is, worked out from its records (and, after a reveal, from the host view). */
function where(match: Match<any, any, any>) {
  let n = match.setup.config.players.length;
  let phase = 'start';
  let seen = 0, results = 0, tied: string[] = [], revealed = '', wordDidntWork = false;
  for (const { move: m } of match.records) {
    switch (m.type) {
      case 'startDeal': case 'nextRound': case 'dealAgain': case 'dontKnow': case 'allowRepeats':
        phase = 'deal'; seen = 0; wordDidntWork = false; break;
      case 'seen': seen++; if (seen === n) phase = 'clues'; break;
      case 'startTalk': phase = 'talk'; break;
      case 'voteNow': phase = 'picker'; tied = []; break;
      case 'tie': phase = 'revote'; tied = m.players; break;
      case 'reveal': phase = 'revealed'; revealed = m.player; break;
      case 'stillTie': phase = 'result'; results++; break;
      case 'showWord': phase = 'verdict'; break;
      case 'verdict': phase = 'result'; results++; break;
      case 'wordDidntWork': wordDidntWork = m.blocked; break;
      case 'setPlayers': n = m.players.length; break;
      case 'endEvening': phase = 'over'; break;
    }
  }
  if (phase === 'revealed') {
    const host = impostorRules.view(match.state, { kind: 'host' });
    if (host.impostor === revealed) phase = 'caught';
    else { phase = 'result'; results++; }
  }
  return { phase, n, seen, results, tied, wordDidntWork };
}

if (impostorRules) {
  contractSuite('Impostor', {
    rules: impostorRules,
    makeSetup: (seed) => {
      const r = createRng(`players:${seed}`);
      return setupInput({
        seed: `word-${seed}-secret`, starterSeed: `starter-${seed}-secret`, players: NAMES.slice(0, 3 + r.int(8)),
        choices: { mode: r.int(2) ? 'hard' : 'easy', score: r.int(2) === 0 },
      });
    },
    viewers: (setup) => [{ kind: 'room' }, ...setup.config.players.map((p: string) => ({ kind: 'player' as const, playerId: p }))],
    chooseMove(match, rng: Rng) {
      const w = where(match);
      const players: string[] = impostorRules.view(match.state, { kind: 'host' }).players;
      const any = () => players[rng.int(players.length)]!;
      switch (w.phase) {
        case 'start': return { type: 'startDeal', practice: rng.int(3) === 0 };
        case 'deal': {
          const k = rng.int(30);
          if (k === 0) return { type: 'dealAgain' };
          if (k === 1) return { type: 'dontKnow' };
          return { type: 'seen' };
        }
        case 'clues': return rng.int(6) === 0 && players.length <= 5 ? { type: 'anotherRoundOfClues' } : { type: 'startTalk' };
        case 'talk': return rng.int(20) === 0 ? { type: 'dealAgain' } : { type: 'voteNow' };
        case 'picker': {
          if (rng.int(5) === 0) {
            const a = any(); let b = any();
            while (b === a) b = any();
            return { type: 'tie', players: players.filter((p) => p === a || p === b) };
          }
          return { type: 'reveal', player: any() };
        }
        case 'revote': return rng.int(3) === 0 ? { type: 'stillTie' } : { type: 'reveal', player: w.tied[rng.int(w.tied.length)] };
        case 'caught': return { type: 'showWord' };
        case 'verdict': return { type: 'verdict', right: rng.int(2) === 0 };
        case 'result': {
          if (w.results >= 8 || rng.int(3) === 0) return { type: 'endEvening' };
          const k = rng.int(10);
          if (k === 0 && !w.wordDidntWork) return { type: 'wordDidntWork', blocked: true };
          if (k === 1 && players.length < 12) return { type: 'setPlayers', players: [...players, NAMES.find((p) => !players.includes(p))!] };
          if (k === 2 && players.length > 3) return { type: 'setPlayers', players: players.slice(1) };
          return { type: 'nextRound' };
        }
        default: return null;
      }
    },
    junkMoves: [
      { type: 'nonsense' },
      { type: 'reveal', player: 'Ghost' },
      { type: 'tie', players: ['Riya'] },
      { type: 'tie', players: ['Ghost', 'Spirit'] },
      { type: 'setPlayers', players: ['Riya', 'Arjun'] },
      { type: 'setPlayers', players: ['Riya', 'Arjun', 'riya'] },
      { type: 'setPlayers', players: NAMES.concat(['Extra']) },
      { type: 'startDeal', practice: false },
    ] as any[],
    maxMoves: 600,
  });

  it('impostorRules has the id "impostor" (Test hooks item 1)', () => {
    expect(impostorRules.id).toBe('impostor');
  });
}
