// Mafia's rule types (specs/mafia/api.md). Pure data: everything here is saved through the move records and replays.

export type Role = 'mafia' | 'doctor' | 'police' | 'villager';
export const ROLES: readonly Role[] = ['mafia', 'doctor', 'police', 'villager'];
/** A night job: a player's role, or `ghost` once they are out. */
export type JobKind = Role | 'ghost';

export interface MafiaConfig {
  /** MAF-H3: by game index k ("1", "2", …): player → role, for that game's first deal. */
  readonly deals?: Readonly<Record<string, Readonly<Record<string, Role>>>>;
  /** MAF-H5: story ids from stories.json to use instead of the whole list. */
  readonly stories?: { readonly out: readonly string[]; readonly saved: readonly string[] };
}

export type MafiaMove =
  | { readonly type: 'start'; readonly players: readonly string[]; readonly mafiaCount: number }
  | { readonly type: 'seen'; readonly player: string }
  | { readonly type: 'redeal' }
  | { readonly type: 'startNight'; readonly night: number }
  | { readonly type: 'nightPick'; readonly player: string; readonly target: string | null }
  | { readonly type: 'voteOut'; readonly player: string }
  | { readonly type: 'tie'; readonly players: readonly string[] }
  | { readonly type: 'voteNobody'; readonly reason: 'chosen' | 'secondTie' }
  | { readonly type: 'leave'; readonly player: string }
  | { readonly type: 'unleave'; readonly player: string }
  | { readonly type: 'addNext'; readonly name: string }
  | { readonly type: 'endGame' }
  | { readonly type: 'unEndGame' }
  | { readonly type: 'endEvening' };

export type Step = 'idle' | 'deal' | 'nightStart' | 'night' | 'day' | 'revote' | 'gameOver' | 'ended';
export type GameStep = Exclude<Step, 'idle' | 'ended'>;
export type Side = 'village' | 'mafia';

/** One night pick as made: who, as what job, whom. */
export interface Pick { player: string; target: string | null; kind: JobKind }

export interface NightRecord {
  night: number;
  turns: string[];
  picks: Pick[];
  /** Every Mafia pick made tonight, in order. */
  mafia: string[];
  target: string | null;
  chosen: boolean;
  protected: string | null;
  checked: { player: string; mafia: boolean } | null;
  out: string | null;
  left: string[];
  storyId: string | null;
}

export interface OutRecord { player: string; role: Role; how: 'night' | 'vote'; round: number }
export interface VoteRecord { day: number; tie: string[] | null; out: string | null; nobody: 'chosen' | 'secondTie' | null }
export interface LeftRecord { player: string; when: 'night' | 'day'; round: number }
export interface Morning { story: string; storyId: string | null; out: string | null }

export interface Game {
  number: number;
  /** `start`'s players and count (the deal leave's Undo, PO 16). */
  startPlayers: string[];
  startCount: number;
  /** Dealt this game, seat order (a deal leaver is removed; a later leaver stays). */
  players: string[];
  mafiaCount: number;
  roles: Record<string, Role>;
  redeals: number;
  step: GameStep;
  /** Players who have tapped "Done" in the deal. */
  seen: number;
  round: number;
  out: OutRecord[];
  left: string[];
  leftLog: LeftRecord[];
  /** Night leaves recorded and not yet applied. */
  leaving: string[];
  /** The night being played. */
  night: { turns: string[]; picks: Pick[] } | null;
  nights: NightRecord[];
  votes: VoteRecord[];
  /** Today's tie as recorded, and the tied players still in. */
  tie: string[] | null;
  tied: string[] | null;
  morning: Morning | null;
  vote: { player: string; role: Role } | null;
  winner: Side | null;
  endedEarly: boolean;
  /** Its `startNight { night: 1 }` is recorded (IMP-097). */
  started: boolean;
  /** Story ids used this game, by kind (since the kind's last fresh round). */
  used: { out: string[]; saved: string[] };
}

export type Undo =
  | { kind: 'leave'; player: string; prev: MafiaState }
  | { kind: 'endGame'; prev: MafiaState }
  | { kind: 'dealLeave'; player: string; redealt: boolean };

export interface MafiaState {
  seed: string;
  deals: Record<string, Record<string, Role>>;
  stories: { out: string[]; saved: string[] };
  games: Game[];
  next: string[];
  ended: boolean;
  undo: Undo | null;
}

export interface MafiaView {
  step: Step;
  game: number;
  players: string[];
  mafiaCount: number;
  round: number;
  turn: { player: string; i: number; of: number } | null;
  in: string[];
  out: OutRecord[];
  left: string[];
  leaving: string[];
  caught: number;
  morning: Morning | null;
  tied: string[] | null;
  vote: { player: string; role: Role } | null;
  winner: Side | null;
  roles: Record<string, Role> | null;
  tally: { village: number; mafia: number };
  games: number;
  next: string[];
}

export interface NightJob {
  kind: JobKind;
  names: { player: string; allowed: boolean; tags: string[] }[];
  latest: { by: string; target: string } | null;
  see: string[];
}

export interface MafiaPlayerView extends MafiaView {
  me: { role: Role; partners: string[] } | null;
  job: NightJob | null;
  checks: { player: string; mafia: boolean }[];
}
