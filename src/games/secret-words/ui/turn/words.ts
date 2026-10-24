// The turn screens' words, worked out from the game night (specs/secret-words/README.md, Canonical strings; exact
// texts in docs/games/secret-words/text.csv).
import { nextMapCode, secretWordsRules, WORDS, type ClueNumber, type SecretWordsMove, type SecretWordsState, type Team, type Teams } from '../../rules';
import type { NightMatch } from './store';

export const COLOUR: Record<Team, string> = { orange: 'orange', teal: 'teal' };
export const other = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');

/** The clue giver (and partner, SWD-123) of a team. */
export function giversOf(teams: Teams, team: Team): string[] {
  return [teams.clueGivers[team], teams.partners[team]].filter((x): x is string => typeof x === 'string');
}
/** "Riya" / "Nana and Aarav" (clue prompt, result line, waiting line, private-line). */
export const giversAnd = (g: readonly string[]) => g.join(' and ');
/** "Riya" / "Nana + Aarav" (private map heading, poker line, scan screen, "Show the map to"). */
export const giversPlus = (g: readonly string[]) => g.join(' + ');

/** "A", "A and B", "A, B and C". */
export function listAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const clueNumber = (n: ClueNumber) => (n === 'inf' ? '∞' : String(n));

/** A clue's allowance (Terms). */
export const allowance = (n: ClueNumber) => (n === 0 || n === 'inf' ? Infinity : n + 1);

/** SWD-118: `guess-line`. */
export function guessLine(n: ClueNumber, guesses: number): string {
  if (n === 0 || n === 'inf') return 'Guess as many as you like';
  const left = n + 1 - guesses;
  if (guesses === 0) return `${plural(left, 'guess', 'guesses')} left (${n} + 1 extra)`;
  return `${plural(left, 'guess', 'guesses')} left`;
}

/** SWD-103: the recap line, from the board's second turn. */
export function recapLine(s: SecretWordsState): string | null {
  const g = s.game;
  const last = g?.lastTurn;
  if (!g || !last) return null;
  const team = s.teams.names[last.team];
  const found = `Last turn: ${team} found ${plural(last.found, 'word', 'words')};`;
  const word = last.cell !== undefined ? g.words[last.cell] : undefined;
  switch (last.ended) {
    case 'rule':
      return `${found} the clue broke a rule.`;
    case 'landmine':
      return `${found} they stepped on the Landmine.`;
    case 'stopped':
      return `${found} they stopped.`;
    case 'allowance':
      return `${found} they used all their guesses.`;
    case 'nobody':
      return `${found} ${word} was nobody's.`;
    case 'other':
      return `${found} ${word} was yours!`;
  }
}

/** SWD-126: the waiting line. */
export function waitingLine(s: SecretWordsState, team: Team): string {
  return `While you wait, ${s.teams.names[other(team)]}: guess how many words ${giversAnd(giversOf(s.teams, team))}'s clue will be for.`;
}

/** Game number N (Terms): games so far + 1 while playing. */
export const gameNumber = (s: SecretWordsState) => s.games.length + 1;

/** SWD-095: the clue as announced. */
export function clueAnnouncement(teamName: string, n: ClueNumber, word?: string): string {
  const what = n === 'inf' ? 'as many as you like' : plural(n, 'word', 'words');
  return `Clue for ${teamName}: ${word ? `${word}, ` : ''}${what}`;
}

// ---- The board check (SWD-116) ----

interface DealFacts {
  readonly code: string;
  readonly givers: string;
  readonly giverList: { readonly orange: readonly string[]; readonly teal: readonly string[] };
  readonly map: SecretWordsState['choices']['map'];
}

/** Every deal of the game night so far (deals and new boards), with the clue givers and phones at that deal. */
export function dealsOf(match: NightMatch): DealFacts[] {
  const out: DealFacts[] = [];
  let state = secretWordsRules.setup(match.setup);
  for (const r of match.records) {
    const res = secretWordsRules.apply(state, r.move as SecretWordsMove, { by: r.by, at: r.at });
    if (!res.ok) break;
    state = res.value;
    if (r.move.type === 'deal' || r.move.type === 'dealNew') {
      const list = { orange: giversOf(state.teams, 'orange'), teal: giversOf(state.teams, 'teal') };
      out.push({ code: r.move.code, givers: JSON.stringify(list), giverList: list, map: state.choices.map });
    }
  }
  return out;
}

const firstWords = (s: SecretWordsState) => (s.game ? s.game.words.slice(0, 3).join(' · ') : '');

/** SWD-116: `board-check` on the scan screen (`again`: the "Show the map code again" screen, wording 1's form). */
export function boardCheck(match: NightMatch, again: boolean): string {
  const s = match.state;
  const three = s.choices.map === 'own';
  const words = firstWords(s);
  const first = three ? `The map phones should start with: ${words}` : `The map phone should start with: ${words}`;
  const firstAgain = three ? `The map phones' first words should be: ${words}` : `The map phone's first words should be: ${words}`;
  if (again) return first;
  const deals = dealsOf(match);
  const now = deals[deals.length - 1];
  const prev = deals[deals.length - 2];
  if (!now || !prev || prev.map !== now.map) return first;
  if (nextMapCode(prev.code, WORDS) !== now.code) return `New code: scan it again. ${firstAgain}`;
  if (prev.givers !== now.givers) {
    const nowNames = [giversPlus(now.giverList.orange), giversPlus(now.giverList.teal)];
    if (!three) return `Give the map phone to ${listAnd(nowNames)}. They tap Next map; its first words should be: ${words}`;
    const nowAll = new Set([...now.giverList.orange, ...now.giverList.teal]);
    const gone = [...prev.giverList.orange, ...prev.giverList.teal].filter((p) => !nowAll.has(p));
    const goneText = gone.length ? ` ${listAnd(gone)}: tap Done with this game.` : '';
    return `${listAnd(nowNames)}: scan this code on your phones and check they start with: ${words}.${goneText}`;
  }
  return three
    ? `On both map phones, tap Next map. Their first words should be: ${words}`
    : `On the map phone, tap Next map. Its first words should be: ${words}`;
}
