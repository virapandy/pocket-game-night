// The Players sheet's changes (SWD-127, SWD-014, SWD-123), worked out from the evening's players and teams. Each
// confirmed change is one `setPlayers { players, teams, renames? }`. Pure functions.
import { teamsProblem, type SecretWordsState, type Team, type Teams } from '../../rules';
import { nextEligible, otherTeam } from '../teams';

export const MAX_PLAYERS = 20;
export const MAX_NAME = 16;

export interface PlayersChange {
  readonly players: readonly string[];
  readonly teams: Teams;
  readonly renames?: Readonly<Record<string, string>>;
}

type Draft = { orange: string[]; teal: string[]; clueGivers: Record<Team, string | null>; partners: Record<Team, string | null>; guessOnly: string[] };

const draftOf = (t: Teams): Draft => ({
  orange: [...t.orange],
  teal: [...t.teal],
  clueGivers: { ...t.clueGivers },
  partners: { ...t.partners },
  guessOnly: [...t.guessOnly],
});

const teamsOf = (d: Draft, names: Teams['names']): Teams => ({
  orange: d.orange,
  teal: d.teal,
  clueGivers: { ...d.clueGivers },
  partners: { ...d.partners },
  names,
  guessOnly: d.guessOnly.filter((p) => d.orange.includes(p) || d.teal.includes(p)),
});

export const teamOf = (t: Pick<Teams, 'orange'>, p: string): Team => (t.orange.includes(p) ? 'orange' : 'teal');

/** A guesser: neither the team's clue giver nor its partner. */
export const isGuesser = (t: Teams | Draft, p: string): boolean => {
  const team = teamOf(t, p);
  return t.clueGivers[team] !== p && t.partners[team] !== p;
};

const hasGuesser = (d: Draft, team: Team) => d[team].some((p) => p !== d.clueGivers[team] && p !== d.partners[team]);

/** SWD-123: a partner left with no guesser on the team becomes a guesser. */
function normalise(d: Draft): Draft {
  for (const t of ['orange', 'teal'] as const) {
    if (d.partners[t] !== null && !hasGuesser(d, t)) d.partners[t] = null;
  }
  return d;
}

function change(s: SecretWordsState, d: Draft, players: readonly string[], renames?: Record<string, string>): PlayersChange | null {
  const teams = teamsOf(normalise(d), s.teams.names);
  if (teamsProblem(players, teams) !== null) return null;
  return renames ? { players, teams, renames } : { players, teams };
}

// ---- Switch team ----

/** SWD-127: "Switch team" is for guessers, and disabled when their team would keep fewer than 2 players or no guesser. */
export function canSwitch(s: SecretWordsState, p: string): boolean {
  const t = s.teams;
  if (!isGuesser(t, p)) return false;
  const team = teamOf(t, p);
  const rest = t[team].filter((x) => x !== p);
  return rest.length >= 2 && rest.some((x) => x !== t.clueGivers[team] && x !== t.partners[team]);
}

export function switchTeam(s: SecretWordsState, p: string): PlayersChange | null {
  const d = draftOf(s.teams);
  const from = teamOf(d, p);
  const to = otherTeam(from);
  d[from] = d[from].filter((x) => x !== p);
  d[to] = [...d[to], p];
  return change(s, d, s.players);
}

// ---- Rename and add ----

/** Impostor's duplicate message, or null. */
export function duplicateOf(s: SecretWordsState, name: string, except?: string): string | null {
  const lower = name.trim().toLowerCase();
  return s.players.find((p) => p !== except && p.toLowerCase() === lower) ?? null;
}

export const duplicateText = (existing: string) => `${existing} is already playing. Add an initial, like ${existing} S.`;

export function rename(s: SecretWordsState, from: string, to: string): PlayersChange | null {
  const swap = (p: string) => (p === from ? to : p);
  const t = s.teams;
  const d: Draft = {
    orange: t.orange.map(swap),
    teal: t.teal.map(swap),
    clueGivers: { orange: t.clueGivers.orange && swap(t.clueGivers.orange), teal: t.clueGivers.teal && swap(t.clueGivers.teal) },
    partners: { orange: t.partners.orange && swap(t.partners.orange), teal: t.partners.teal && swap(t.partners.teal) },
    guessOnly: t.guessOnly.map(swap),
  };
  return change(s, d, s.players.map(swap), { [from]: to });
}

export function add(s: SecretWordsState, name: string, team: Team, guessOnly: boolean): PlayersChange | null {
  const d = draftOf(s.teams);
  d[team] = [...d[team], name];
  if (guessOnly) d.guessOnly = [...d.guessOnly, name];
  return change(s, d, [...s.players, name]);
}

// ---- Remove ----

/** SWD-014: "Remove" is disabled for a team's last eligible player. */
export function canRemove(s: SecretWordsState, p: string): boolean {
  const t = s.teams;
  if (t.guessOnly.includes(p)) return true;
  return t[teamOf(t, p)].filter((x) => !t.guessOnly.includes(x)).length > 1;
}

/** What removing a player needs: done at once, the D7a clue-giver question, or the D7b team-of-one question. */
export type RemovePlan =
  | { readonly kind: 'apply'; readonly change: PlayersChange }
  | { readonly kind: 'giver'; readonly team: Team; readonly options: readonly string[]; readonly preselect: string | null; readonly finish: (chosen: string) => PlayersChange | null }
  | { readonly kind: 'alone'; readonly team: Team; readonly left: string; readonly movers: readonly string[] };

/** The draft without `p`; a removed clue giver with a partner hands over to the partner (SWD-123). */
function without(s: SecretWordsState, p: string): { d: Draft; needsGiver: boolean } {
  const d = draftOf(s.teams);
  const team = teamOf(d, p);
  d[team] = d[team].filter((x) => x !== p);
  d.guessOnly = d.guessOnly.filter((x) => x !== p);
  let needsGiver = false;
  if (d.partners[team] === p) d.partners[team] = null;
  if (d.clueGivers[team] === p) {
    if (d.partners[team] !== null) {
      d.clueGivers[team] = d.partners[team];
      d.partners[team] = null;
    } else {
      d.clueGivers[team] = null;
      needsGiver = true;
    }
  }
  return { d, needsGiver };
}

function giverQuestion(s: SecretWordsState, d: Draft, team: Team, removed: string, players: readonly string[]): RemovePlan {
  const old = s.teams[team];
  const from = old.indexOf(removed) + 1;
  const ordered = [...old.slice(from), ...old.slice(0, from)].filter((x) => d[team].includes(x));
  const rest = [...ordered, ...d[team].filter((x) => !ordered.includes(x))];
  const options = d[team].filter((x) => !d.guessOnly.includes(x));
  return {
    kind: 'giver',
    team,
    options,
    preselect: nextEligible(rest, d.guessOnly, 0),
    finish: (chosen) => {
      const next: Draft = { ...d, clueGivers: { ...d.clueGivers, [team]: chosen } };
      return change(s, next, players);
    },
  };
}

/** SWD-127 D7b: guessers of the other team who can move over (their team keeps at least 2 players and a guesser). */
export function moversFor(s: SecretWordsState, team: Team): string[] {
  const o = otherTeam(team);
  const t = s.teams;
  return t[o].filter((x) => {
    if (!isGuesser(t, x)) return false;
    const rest = t[o].filter((y) => y !== x);
    return rest.length >= 2 && rest.some((y) => y !== t.clueGivers[o] && y !== t.partners[o]);
  });
}

export function planRemove(s: SecretWordsState, p: string): RemovePlan | null {
  const team = teamOf(s.teams, p);
  const list = s.teams[team];
  const players = s.players.filter((x) => x !== p);
  if (list.length - 1 < 2) return { kind: 'alone', team, left: list.find((x) => x !== p) ?? '', movers: moversFor(s, team) };
  const { d, needsGiver } = without(s, p);
  if (needsGiver) return giverQuestion(s, d, team, p, players);
  const c = change(s, d, players);
  return c ? { kind: 'apply', change: c } : null;
}

/** D7b "Move Zoya over": removes `p` and moves `mover` to the end of `p`'s team, in one change (D7a first if needed). */
export function planMoveOver(s: SecretWordsState, p: string, mover: string): RemovePlan | null {
  const team = teamOf(s.teams, p);
  const o = otherTeam(team);
  const players = s.players.filter((x) => x !== p);
  const { d, needsGiver } = without(s, p);
  d[o] = d[o].filter((x) => x !== mover);
  d[team] = [...d[team], mover];
  if (needsGiver) return giverQuestion(s, d, team, p, players);
  const c = change(s, d, players);
  return c ? { kind: 'apply', change: c } : null;
}

/** The change that puts the players and teams back as they were (Undo). */
export const restore = (s: SecretWordsState): PlayersChange => ({ players: [...s.players], teams: s.teams });
