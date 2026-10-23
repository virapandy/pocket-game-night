// `where-line` (SWD-110 v3.6, SWD-032, 115): the step a game night is on, in words. Shared by the Pause cover,
// "Welcome back.", Home's unfinished row and the picker's resume card.
import type { SecretWordsState } from '../../rules';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The where-line for `s`. `step` is what the moves alone can't tell (SWD-048 screen state): the preview, the scan screen,
 * the end-turn line; without it the moves decide (two or three phones before the board's first clue: the scan screen).
 */
export function whereLineFor(s: SecretWordsState, step?: 'preview' | 'scan' | 'end-turn' | 'summary' | null): string {
  const g = s.game;
  const names = s.teams.names;
  if (step === 'summary') return 'Game night over';
  if (!g) return 'Before game 1';
  if (g.step === 'over') return `Game over, game ${s.games.length}`;
  const number = s.games.length + 1;
  const fresh = g.turnNo === 1 && g.clues.length === 0;
  if (step === 'preview' && g.step === 'clue' && fresh) return `Before game ${number}`;
  if (g.step === 'clue') {
    if (step === 'scan' || (step == null && s.choices.map !== 'pass' && fresh)) return `Scan the map, game ${number}`;
    return `Turn ${g.turnNo} · clue for ${names[g.turn]}`;
  }
  if (g.step === 'guessing') {
    if (step === 'end-turn') return `Turn ${g.turnNo} · ${names[g.turn]} ended their turn`;
    const n = g.clue?.n;
    if (n === undefined || n === 0 || n === 'inf') return `${names[g.turn]} guessing · as many as you like`;
    return `${names[g.turn]} guessing · ${plural(n + 1 - g.guesses, 'guess', 'guesses')} left`;
  }
  return `Turn ${g.turnNo} over · ${names[g.turn === 'orange' ? 'teal' : 'orange']} next`;
}
