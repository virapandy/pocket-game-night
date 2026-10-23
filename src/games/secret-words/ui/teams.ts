// Make teams, worked out on the host phone before the first deal (SWD-004 to SWD-008, SWD-013, SWD-014, SWD-123, SWD-130).
// Pure functions of the names, the team seed and what is on screen; the screens only show and change their results.
import { createRng, shuffle } from '../../../engine';
import { TEAM_NAMES, type SecretWordsTeamNames, type Team as RulesTeam } from '../rules';

export type Team = RulesTeam;
export const TEAMS: readonly Team[] = ['orange', 'teal'];
export const otherTeam = (t: Team): Team => (t === 'orange' ? 'teal' : 'orange');

/** The teams on Make teams (and in the Clue givers sheet), before they are recorded at the deal. */
export interface TeamsDraft {
  readonly orange: readonly string[];
  readonly teal: readonly string[];
  readonly clueGivers: { readonly orange: string | null; readonly teal: string | null };
  readonly partners: { readonly orange: string | null; readonly teal: string | null };
  readonly guessOnly: readonly string[];
}

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** SWD-014: eligible = may give clues. */
export const isEligible = (d: Pick<TeamsDraft, 'guessOnly'>, p: string) => !d.guessOnly.includes(p);

/** SWD-005, SWD-014: the next eligible player of `list` from index `from`, in list order, wrapping to the first. */
export function nextEligible(list: readonly string[], guessOnly: readonly string[], from: number, skip: readonly string[] = []): string | null {
  for (let j = 0; j < list.length; j++) {
    const p = list[(from + j) % list.length]!;
    if (!guessOnly.includes(p) && !skip.includes(p)) return p;
  }
  return null;
}

/**
 * SWD-007: a team's suggested clue giver: its eligible member credited with the fewest games this evening, the earliest
 * in the team's list on a tie (game 1: the first eligible player). A suggestion never has a partner.
 */
export function suggestClueGiver(list: readonly string[], guessOnly: readonly string[], gamesOf: (p: string) => number = () => 0): string | null {
  let best: string | null = null;
  let bestN = Infinity;
  for (const p of list) {
    if (guessOnly.includes(p)) continue;
    const n = gamesOf(p);
    if (n < bestN) {
      best = p;
      bestN = n;
    }
  }
  return best;
}

/** SWD-004 / SWD-006 with SWD-130's rule: the teams of draw k, and the k used. */
export function drawSplit(
  names: readonly string[],
  seed: string,
  from: number,
  o: { guessOnly?: readonly string[]; now?: { orange: readonly string[]; teal: readonly string[] }; last?: { orange: readonly string[]; teal: readonly string[] } } = {},
): { orange: string[]; teal: string[]; k: number } {
  const go = o.guessOnly ?? [];
  const lastK = Math.max(from, 10);
  let split = { orange: [] as string[], teal: [] as string[] };
  let k = from;
  for (; k <= lastK; k++) {
    const order = shuffle(names, createRng(`${seed}:${k}`));
    const half = Math.ceil(names.length / 2);
    split = { orange: order.slice(0, half), teal: order.slice(half) };
    const count = (team: string[]) => team.filter((p) => go.includes(p)).length;
    const balanced = Math.abs(count(split.orange) - count(split.teal)) <= 1;
    const changed = !o.now || !(sameSet(split.orange, o.now.orange) && sameSet(split.teal, o.now.teal));
    const notLast = !o.last || !(
      (sameSet(split.orange, o.last.orange) && sameSet(split.teal, o.last.teal)) ||
      (sameSet(split.orange, o.last.teal) && sameSet(split.teal, o.last.orange))
    );
    if (balanced && changed && notLast) break;
  }
  return { ...split, k: Math.min(k, lastK) };
}

/** Teams from a draw, with SWD-007's clue givers and no partners. */
export function fromSplit(split: { orange: readonly string[]; teal: readonly string[] }, guessOnly: readonly string[], gamesOf?: (p: string) => number): TeamsDraft {
  return {
    orange: [...split.orange],
    teal: [...split.teal],
    clueGivers: { orange: suggestClueGiver(split.orange, guessOnly, gamesOf), teal: suggestClueGiver(split.teal, guessOnly, gamesOf) },
    partners: { orange: null, teal: null },
    guessOnly: guessOnly.filter((p) => split.orange.includes(p) || split.teal.includes(p)),
  };
}

export const teamOf = (d: TeamsDraft, p: string): Team => (d.orange.includes(p) ? 'orange' : 'teal');

/**
 * SWD-005: a tap on a name moves the player to the end of the other team. A clue giver who moves is replaced by the
 * player now at their old place (else the first), the next eligible one; the moved player is a guesser, unless the team
 * they join has no clue giver (an empty team: the next player to join it gives the clues).
 */
export function movePlayer(d: TeamsDraft, p: string): TeamsDraft {
  const from = teamOf(d, p);
  const to = otherTeam(from);
  const idx = d[from].indexOf(p);
  const fromList = d[from].filter((x) => x !== p);
  const toList = [...d[to], p];
  const clueGivers = { ...d.clueGivers };
  const partners = { ...d.partners };
  if (partners[from] === p) partners[from] = null;
  if (clueGivers[from] === p) {
    if (partners[from]) {
      clueGivers[from] = partners[from];
      partners[from] = null;
    } else {
      clueGivers[from] = fromList.length ? nextEligible(fromList, d.guessOnly, idx % fromList.length) : null;
    }
  }
  if (clueGivers[to] === null && isEligible(d, p)) clueGivers[to] = p;
  return { ...d, [from]: fromList, [to]: toList, clueGivers, partners } as TeamsDraft;
}

/**
 * SWD-004: back on Make teams after "Who's playing?": names no longer playing are dropped; new names join the smaller
 * team (orange if equal) at the end; a clue giver who left is replaced by SWD-007.
 */
export function keepTeams(d: TeamsDraft, names: readonly string[]): TeamsDraft {
  const stays = (p: string) => names.includes(p);
  const lists = { orange: d.orange.filter(stays), teal: d.teal.filter(stays) };
  for (const n of names) {
    if (lists.orange.includes(n) || lists.teal.includes(n)) continue;
    (lists.orange.length <= lists.teal.length ? lists.orange : lists.teal).push(n);
  }
  const guessOnly = d.guessOnly.filter(stays);
  const clueGivers = { ...d.clueGivers };
  const partners = { ...d.partners };
  for (const t of TEAMS) {
    if (partners[t] !== null && !stays(partners[t]!)) partners[t] = null;
    if (clueGivers[t] === null || !stays(clueGivers[t]!)) {
      clueGivers[t] = partners[t] ?? suggestClueGiver(lists[t], guessOnly);
      if (partners[t] === clueGivers[t]) partners[t] = null;
    }
  }
  return { orange: lists.orange, teal: lists.teal, clueGivers, partners, guessOnly };
}

/** What stops "Next" on Make teams (SWD-008, SWD-014), as the alerts read. */
export function teamsAlerts(d: TeamsDraft): { tooSmall: boolean; noGiver: boolean } {
  return {
    tooSmall: d.orange.length < 2 || d.teal.length < 2,
    noGiver: TEAMS.some((t) => d[t].length > 0 && !d[t].some((p) => isEligible(d, p))),
  };
}

/**
 * SWD-013: the evening's pair of team names, drawn with `${teamSeed}:names:${m}` among the pairs not used by the 3 most
 * recently started other game nights on this phone (all 20 if fewer than 4 remain), never the pair on screen.
 */
export function drawNames(teamSeed: string, m: number, recentIds: readonly string[], onScreen?: string): SecretWordsTeamNames {
  const all = TEAM_NAMES;
  let pool = all.filter((p) => !recentIds.includes(p.id));
  if (pool.length < 4) pool = [...all];
  if (onScreen) {
    const without = pool.filter((p) => p.id !== onScreen);
    pool = without.length > 0 ? without : all.filter((p) => p.id !== onScreen);
  }
  return pool[createRng(`${teamSeed}:names:${m}`).int(pool.length)]!;
}
