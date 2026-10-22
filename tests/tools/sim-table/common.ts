// Shared by deal.sim.ts and play.sim.ts. Imports the Secret Words rule API only through src/games/secret-words (index.ts).
import { HOST, play, startMatch, type Match } from '../../../src/engine';
import { secretWordsRules } from '../../../src/games/secret-words';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const EXCHANGE = process.env.SIM_TABLE_DIR ??
  '/private/tmp/claude-501/-Users-virat-Documents-Game-On/1645e29e-ed23-4a35-bddb-d976e911575b/scratchpad/sim-table';

export type Size = 'full' | 'easy';
export type TeamId = 'team1' | 'team2';              // team1 = the engine's orange team, team2 = the teal team
export type SimKind = TeamId | 'nobody' | 'landmine';
export const toSimKind = (k: string): SimKind => (k === 'orange' ? 'team1' : k === 'teal' ? 'team2' : (k as SimKind));
export const toEngineTeam = (t: TeamId): 'orange' | 'teal' => (t === 'team1' ? 'orange' : 'teal');
export const toSimTeam = (t: string): TeamId => (t === 'orange' ? 'team1' : 'team2');

export interface BoardRecord {
  id: string;                       // "full-01" .. "easy-30"
  size: Size;
  landmineRule: 'lose' | 'turn' | 'none';   // lose = Lose the game, turn = Lose your turn (other team gets a word free), none = Easy has no Landmine
  seed: string;                     // evening deal seed
  code: string;                     // the map code (SWD-022)
  first: TeamId;                    // the team that goes first
  rows: number;
  grid: string[][];                 // the words, row by row
  words: string[];                  // the same, row-major
  kinds: SimKind[];                 // row-major, same order as words
  map: Record<string, SimKind>;     // word -> kind
}

export const TEAMS = {
  orange: ['Riya', 'Meena', 'Zoya', 'Om'], teal: ['Arjun', 'Kabir', 'Dev'],
  clueGivers: { orange: 'Riya', teal: 'Arjun' }, partners: { orange: null, teal: null },
  names: { id: 'SWDT-01', orange: 'Chai Champions', teal: 'Coffee Commandos' }, guessOnly: [],
};

export function startEvening(seed: string, size: Size, landmine: 'lose' | 'turn', testBoards?: string[]) {
  const config: any = {
    players: [...TEAMS.orange, ...TEAMS.teal], teams: TEAMS, splits: 1,
    choices: { map: 'pass', board: size, landmine, words: 'family' }, excludedWords: { recent: [] },
  };
  if (testBoards) config.testBoards = testBoards;
  const rules: any = secretWordsRules;
  let match: Match<any, any, any> = startMatch(rules, { gameId: 'secret-words', seeds: { deal: seed, teams: 'sim-table-teams' }, config }, 1_792_683_000_000);
  let at = 1_792_683_000_000;
  let lastReason = '';
  return {
    rules,
    get state(): any { return match.state; },
    get lastReason() { return lastReason; },
    /** Plays a move through the referee; false (state unchanged) when refused. */
    try(move: any): boolean {
      const r = play(rules, match, move, { by: HOST, at: (at += 1000) });
      if (r.ok) { match = r.value; lastReason = ''; return true; }
      lastReason = r.reason; return false;
    },
    legal(): any[] { return [...(rules.legalMoves(match.state, HOST) ?? [])]; },
  };
}
