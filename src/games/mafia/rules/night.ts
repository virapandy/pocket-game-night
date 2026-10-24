// The night (MAF-021 to MAF-027, items 4, 8, 9, 11): the order, each job's allowed names and tags, and the resolution.
import { createRng } from '../../../engine';
import storiesJson from '../../../../content/mafia/stories.json';
import editionsJson from './story-editions.json';
import type { Game, JobKind, MafiaState, NightJob, Role, Side } from './types';

export interface Story { readonly id: string; readonly kind: 'out' | 'saved'; readonly text: string }
export const STORIES: readonly Story[] = storiesJson as Story[];
const STORY_TEXT = new Map(STORIES.map((s) => [s.id, s.text]));
/** Frozen story editions (MAF-037, MAF-093): each edition's ids by kind. Never changed; a new edition is added. */
export const STORY_EDITIONS: Readonly<Record<string, { readonly out: readonly string[]; readonly saved: readonly string[] }>> =
  editionsJson.editions;
/** The edition a new game night uses. */
export const MAFIA_STORY_EDITION = '1.2';
export const QUIET_NIGHT = 'A quiet night. Nobody is out!';

/** Item 10: list[floor(rng() × list.length)] with the first value of createRng(seed), rng() = int(2³²) / 2³². */
export function pickFirst<T>(list: readonly T[], seed: string): T {
  const x = createRng(seed).int(2 ** 32) / 2 ** 32;
  return list[Math.floor(x * list.length)] as T;
}

export const isOut = (g: Game, p: string) => g.out.some((o) => o.player === p);
export const hasLeft = (g: Game, p: string) => g.left.includes(p);
/** In: not out and not left (a night leaver stays in until the night resolves). */
export const isIn = (g: Game, p: string) => g.players.includes(p) && !isOut(g, p) && !hasLeft(g, p);
/** In tonight: in, and not leaving tonight. */
export const inTonight = (g: Game, p: string) => isIn(g, p) && !g.leaving.includes(p);

/** Terms, "Night order": every player dealt who hasn't left and isn't leaving, from seat ((k − 1) + (r − 1)) mod n. */
export function nightOrder(g: Game): string[] {
  const n = g.players.length;
  const start = ((g.number - 1) + (g.round - 1)) % n;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = g.players[(start + i) % n] as string;
    if (!hasLeft(g, p) && !g.leaving.includes(p)) out.push(p);
  }
  return out;
}

/** The players still to take a turn tonight, in order. */
export function remaining(g: Game): string[] {
  const taken = g.night?.turns ?? [];
  return nightOrder(g).filter((p) => !taken.includes(p));
}

export function nightTurn(g: Game): { player: string; i: number; of: number } | null {
  if (g.step !== 'night' || !g.night) return null;
  const rest = remaining(g);
  const player = rest[0];
  if (player === undefined) return null;
  const taken = g.night.turns.length;
  return { player, i: taken + 1, of: taken + rest.length };
}

/** Every pick made this game, resolved nights first, then tonight's. */
function allPicks(g: Game) {
  return [...g.nights.flatMap((n) => n.picks), ...(g.night?.picks ?? [])];
}

/** This Police's checks this game, in order. */
export function checksOf(g: Game, player: string): { player: string; mafia: boolean }[] {
  return allPicks(g)
    .filter((p) => p.kind === 'police' && p.player === player && p.target !== null)
    .map((p) => ({ player: p.target as string, mafia: g.roles[p.target as string] === 'mafia' }));
}

export function jobKind(g: Game, player: string): JobKind {
  return isOut(g, player) ? 'ghost' : (g.roles[player] as Role);
}

/** The Doctor's protection on night r − 1 (only that night). */
function protectedLastNight(g: Game): string | null {
  const prev = g.nights.find((n) => n.night === g.round - 1);
  return prev?.picks.find((p) => p.kind === 'doctor')?.target ?? null;
}
const selfUsed = (g: Game, doctor: string) => allPicks(g).some((p) => p.kind === 'doctor' && p.player === doctor && p.target === doctor);

/** MAF-023 to MAF-026 with items 4 and 11: the names this player may pick tonight, seat order. */
export function allowedNames(g: Game, player: string): string[] {
  const inNow = g.players.filter((p) => inTonight(g, p));
  switch (jobKind(g, player)) {
    case 'ghost': return inNow;
    case 'mafia': return inNow.filter((p) => g.roles[p] !== 'mafia');
    case 'doctor': {
      const last = protectedLastNight(g);
      const used = selfUsed(g, player);
      return inNow.filter((p) => p !== last && !(p === player && used));
    }
    case 'police': {
      const checked = new Set(checksOf(g, player).map((c) => c.player));
      return inNow.filter((p) => p !== player && !checked.has(p));
    }
    case 'villager': return inNow.filter((p) => p !== player);
  }
}

/** N2's job (item 4): every player dealt, not left, not leaving tonight; greyed ones tagged by PO 9. */
export function nightJob(g: Game, player: string): NightJob {
  const kind = jobKind(g, player);
  const allowed = new Set(allowedNames(g, player));
  const checks = kind === 'police' ? new Map(checksOf(g, player).map((c) => [c.player, c.mafia ? 'Mafia' : 'Not Mafia'])) : new Map<string, string>();
  const last = kind === 'doctor' ? protectedLastNight(g) : null;
  const names = g.players.filter((p) => !hasLeft(g, p) && !g.leaving.includes(p)).map((p) => {
    let tags: string[] = [];
    if (!allowed.has(p)) {
      const answer = checks.get(p);
      if (p === player) tags = kind === 'doctor' && selfUsed(g, player) ? ['used'] : ['you'];
      else if (isOut(g, p)) tags = answer ? ['out', answer] : ['out'];
      else if (kind === 'mafia' && g.roles[p] === 'mafia') tags = ['Mafia'];
      else if (kind === 'doctor' && p === last) tags = ['protected last night'];
      else if (answer) tags = [answer];
      else tags = ['you'];
    }
    return { player: p, allowed: allowed.has(p), tags };
  });
  let latest: NightJob['latest'] = null;
  let see: string[] = [];
  if (kind === 'mafia') {
    const mafiaPicks = (g.night?.picks ?? []).filter((p) => p.kind === 'mafia' && p.target !== null);
    const l = mafiaPicks[mafiaPicks.length - 1];
    if (l) latest = { by: l.player, target: l.target as string };
    see = remaining(g).filter((p) => p !== player && g.roles[p] === 'mafia' && !isOut(g, p));
  }
  return { kind, names, latest, see };
}

/** MAF-040: m = Mafia in, v = others in. */
export function winnerOf(g: Game): Side | null {
  const inNow = g.players.filter((p) => isIn(g, p));
  const m = inNow.filter((p) => g.roles[p] === 'mafia').length;
  if (m === 0) return 'village';
  if (m >= inNow.length - m) return 'mafia';
  return null;
}

/** Ends the game when MAF-040 has a winner; true if it did. */
export function checkWinner(g: Game): boolean {
  const w = winnerOf(g);
  if (!w) return false;
  g.winner = w;
  g.step = 'gameOver';
  return true;
}

/** MAF-037: the story of a kind, never repeating in a game until every story of the kind is used. */
function pickStory(s: MafiaState, g: Game, kind: 'out' | 'saved'): string | null {
  const ids = s.stories[kind];
  if (ids.length === 0) return null;
  let unused = ids.filter((id) => !g.used[kind].includes(id)).sort();
  if (unused.length === 0) { g.used[kind] = []; unused = [...ids].sort(); }
  const id = pickFirst(unused, `${s.seed}:${g.number}:story${g.round}`);
  g.used[kind].push(id);
  return id;
}

/** MAF-027: the night resolves after its last turn (mutates the game). */
export function resolveNight(s: MafiaState, g: Game): void {
  const r = g.round;
  const night = g.night ?? { turns: [], picks: [] };
  const leaving = g.leaving;
  const mafia = night.picks.filter((p) => p.kind === 'mafia' && p.target !== null).map((p) => p.target as string);
  const valid = mafia.filter((t) => !leaving.includes(t) && !hasLeft(g, t));
  const same = valid.every((t) => t === valid[0]);
  const target = valid.length === 0 ? null : same ? (valid[0] as string) : pickFirst(valid, `${s.seed}:${g.number}:night${r}`);
  const doctor = night.picks.find((p) => p.kind === 'doctor')?.target ?? null;
  const police = night.picks.find((p) => p.kind === 'police' && p.target !== null);
  const out = target !== null && doctor !== target ? target : null;
  if (out !== null) g.out.push({ player: out, role: g.roles[out] as Role, how: 'night', round: r });
  let storyId: string | null = null;
  let story = QUIET_NIGHT;
  if (target !== null) {
    storyId = pickStory(s, g, out !== null ? 'out' : 'saved');
    const text = storyId === null ? undefined : STORY_TEXT.get(storyId);
    if (text !== undefined) story = out !== null ? text.split('{NAME}').join(out) : text;
    else storyId = null;
  }
  for (const p of leaving) { g.left.push(p); g.leftLog.push({ player: p, when: 'night', round: r }); }
  g.nights.push({
    night: r, turns: [...night.turns], picks: night.picks.map((p) => ({ ...p })), mafia, target,
    chosen: valid.length > 1 && !same, protected: doctor,
    checked: police ? { player: police.target as string, mafia: g.roles[police.target as string] === 'mafia' } : null,
    out, left: [...leaving], storyId,
  });
  g.night = null;
  g.leaving = [];
  g.morning = { story, storyId, out };
  if (!checkWinner(g)) g.step = 'day';
}
