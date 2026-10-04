// What the room sees after rounds end, worked out from the saved record (never stored twice): the completed rounds
// (IMP-094, IMP-105), who left and in what order (IMP-044, IMP-095), the first scored round (IMP-043), the scoreboard
// (IMP-044), the counts (IMP-040, IMP-092), the fun lines (IMP-095) and the Share text (IMP-106).
import type { MoveRecord, SetupInput } from '../../../engine';
import {
  impostorRules, wordById,
  type ImpostorConfig, type ImpostorMove, type ImpostorState, type Round,
} from '../rules';

export interface DoneRound {
  readonly number: number | null;
  readonly practice: boolean;
  readonly players: readonly string[];
  readonly wordId: string;
  readonly impostor: string;
  readonly revealed: string | null;
  readonly stillTie: boolean;
  readonly verdict: boolean | null;
  readonly points: Readonly<Record<string, number>> | null;
}

export interface Story {
  /** Completed rounds, in order (practice included). */
  readonly rounds: readonly DoneRound[];
  /** Players who left and are still away, in the order they left. */
  readonly left: readonly string[];
  /** The number of the evening's first scored round, or null. */
  readonly firstScored: number | null;
  /** Score was Yes at any point of the evening. */
  readonly scoreEver: boolean;
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const asDone = (r: Round): DoneRound => ({
  number: r.number,
  practice: r.practice,
  players: r.players,
  wordId: r.wordId,
  impostor: r.impostor,
  revealed: r.revealed,
  stillTie: r.stillTie,
  verdict: r.verdict,
  points: r.points,
});

/** Replays the record move by move, noting each completed round and each change of players. */
export function storyOf(setup: SetupInput<ImpostorConfig>, records: readonly MoveRecord<ImpostorMove>[]): Story {
  let state: ImpostorState = impostorRules.setup(setup);
  const rounds: DoneRound[] = [];
  let left: string[] = [];
  let scoreEver = state.choices.score;
  for (const rec of records) {
    const next = impostorRules.apply(state, rec.move, { by: rec.by, at: rec.at });
    if (!next.ok) break;
    const s = next.value;
    if (s.recentImpostors.length > state.recentImpostors.length && s.round) rounds.push(asDone(s.round));
    // Players leave by `setPlayers`, "Deal again without …", at a round's result or at the end (IMP-078).
    if (s.players !== state.players) {
      for (const p of state.players) {
        if (!s.players.some((q) => same(p, q))) left = [...left.filter((x) => !same(x, p)), p];
      }
      left = left.filter((x) => !s.players.some((q) => same(x, q)));
    }
    if (s.choices.score) scoreEver = true;
    state = s;
  }
  const firstScored = rounds.find((r) => r.points !== null)?.number ?? null;
  return { rounds, left, firstScored, scoreEver };
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const isCaught = (r: DoneRound) => !r.stillTie && r.revealed === r.impostor;

/** The counted rounds' catches and escapes (IMP-040, IMP-092). */
export function counts(story: Story): { rounds: number; caught: number; escaped: number } {
  const counted = story.rounds.filter((r) => !r.practice);
  const caught = counted.filter(isCaught).length;
  return { rounds: counted.length, caught, escaped: counted.length - caught };
}

/** IMP-044: "+2 Arjun", "+1 Arjun" or "+1 each: Riya, Meena, Kabir". Null when the round was not scored. */
export function pointsText(r: DoneRound): string | null {
  if (!r.points) return null;
  if (!isCaught(r)) return `+2 ${r.impostor}`;
  if (r.verdict) return `+1 ${r.impostor}`;
  return `+1 each: ${r.players.filter((p) => p !== r.impostor).join(', ')}`;
}

/** IMP-035, IMP-034, IMP-085: the round's outcome (`round-outcome`). */
export function outcomeLine(r: Pick<DoneRound, 'impostor' | 'revealed' | 'stillTie' | 'verdict'>): string {
  const caught = !r.stillTie && r.revealed === r.impostor;
  if (!caught) return `${r.impostor} escaped!`;
  return r.verdict ? `${r.impostor} wins the round!` : 'You caught the impostor!';
}

/** IMP-105: "Round 3 · Samosa · Arjun caught, guessed right", "Practice · Samosa · Arjun escaped". */
export function roundLine(r: DoneRound): string {
  const word = wordById(r.wordId)?.word ?? r.wordId;
  const how = isCaught(r) ? (r.verdict === null ? 'caught' : `caught, ${r.verdict ? 'guessed right' : 'wrong guess'}`) : 'escaped';
  return `${r.practice ? 'Practice' : `Round ${r.number}`} · ${word} · ${r.impostor} ${how}`;
}

export interface ScoreRow {
  readonly name: string;
  readonly points: number;
  readonly rank: number;
  readonly left: boolean;
}

/**
 * IMP-044: every player of the evening, highest total first, ranked 1-2-2-4; among equal totals current players in
 * seat order, then players who left, in the order they left.
 */
export function scoreRows(state: ImpostorState, story: Story): ScoreRow[] {
  const leftAt = (name: string) => story.left.findIndex((x) => same(x, name));
  const order = (name: string) => {
    const seat = state.players.indexOf(name);
    if (seat >= 0) return seat;
    const l = leftAt(name);
    return state.players.length + (l >= 0 ? l : story.left.length);
  };
  const rows = Object.entries(state.totals).map(([name, points]) => ({ name, points, left: !state.players.includes(name) }));
  rows.sort((a, b) => b.points - a.points || order(a.name) - order(b.name));
  return rows.map((r) => ({ ...r, rank: 1 + rows.filter((x) => x.points > r.points).length }));
}

/** IMP-095: "seat order" for the fun lines: the final seat order, then players who left, in the order they left. */
function seatOrder(state: ImpostorState, story: Story): string[] {
  return [...state.players, ...story.left.filter((p) => !state.players.some((q) => same(p, q)))];
}

/** The first player, in seat order, with the highest count. */
function top(counter: Map<string, number>, seats: readonly string[]): [string, number] | null {
  let best: [string, number] | null = null;
  const names = [...seats, ...[...counter.keys()].filter((k) => !seats.includes(k))];
  for (const p of names) {
    const n = counter.get(p) ?? 0;
    if (n > 0 && (!best || n > best[1])) best = [p, n];
  }
  return best;
}

/** IMP-095: up to 2 fun lines, counted rounds only. Line 1 alone is also used by Share (IMP-106). */
export function funLines(state: ImpostorState, story: Story): { best: string | null; lines: string[] } {
  const counted = story.rounds.filter((r) => !r.practice);
  const seats = seatOrder(state, story);
  const escapes = new Map<string, number>();
  const suspected = new Map<string, number>();
  for (const r of counted) {
    if (!isCaught(r)) escapes.set(r.impostor, (escapes.get(r.impostor) ?? 0) + 1);
    if (!r.stillTie && r.revealed !== null && r.revealed !== r.impostor) suspected.set(r.revealed, (suspected.get(r.revealed) ?? 0) + 1);
  }
  const lines: string[] = [];
  const b = top(escapes, seats);
  const best = b ? `Best impostor: ${b[0]}, escaped ${plural(b[1], 'time')}` : null;
  if (best) lines.push(best);
  const s = top(suspected, seats);
  if (s && s[1] >= 2) lines.push(`Most suspected: ${s[0]}, picked ${s[1]} times without being the impostor`);
  return { best, lines };
}

/** "Arjun and Meena", "Arjun, Meena and Kabir". */
const andList = (names: readonly string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/**
 * IMP-092, IMP-097, IMP-098: the summary's lead line. Score Yes at any point and a top total of at least 1: "Arjun wins
 * the game with 2 points!" or, shared, "Arjun and Meena share the game with 2 points!" (names in seat order).
 * Otherwise "Impostor caught 4 · escaped 3", counted rounds only, as in the result's `evening-line` (IMP-040).
 */
export function leadLine(state: ImpostorState, story: Story): string {
  const counted = story.rounds.filter((r) => !r.practice);
  if (story.scoreEver && counted.length > 0) {
    const totals = Object.entries(state.totals);
    const best = Math.max(0, ...totals.map(([, n]) => n));
    if (best >= 1) {
      const seats = seatOrder(state, story);
      const at = (name: string) => {
        const i = seats.findIndex((x) => same(x, name));
        return i < 0 ? seats.length : i;
      };
      const top = totals.filter(([, n]) => n === best).map(([name]) => name).sort((a, b) => at(a) - at(b));
      const pts = plural(best, 'point');
      return top.length === 1 ? `${top[0]} wins the game with ${pts}!` : `${andList(top)} share the game with ${pts}!`;
    }
  }
  const c = counts(story);
  return `Impostor caught ${c.caught} · escaped ${c.escaped}`;
}

/** IMP-106: the text Share sends, lines joined by "\n". */
export function shareText(state: ImpostorState, story: Story): string {
  const c = counts(story);
  const words = story.rounds.map((r) => wordById(r.wordId)?.word ?? r.wordId);
  const shown = words.slice(0, 8).join(', ') + (words.length > 8 ? '…' : '');
  const best = funLines(state, story).best;
  return [
    `Impostor game · ${plural(c.rounds, 'round')}`,
    `Impostor caught ${c.caught} · escaped ${c.escaped}`,
    ...(best ? [best] : []),
    ...(words.length > 0 ? [`Words: ${shown}`] : []),
  ].join('\n');
}
