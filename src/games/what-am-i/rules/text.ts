// Text the screens build from the rules (pure): the where-line (WAI-090, Version 1.1 item 40, Version 1.2 item 15; product
// owner 25 October, items 15 and 35), Home's row (WAI-091) and the tip line on T1 (WAI-011; product owner item 10, 11).
import { gameOpen } from './queue';
import { currentPlayer, toPlayOf } from './rules';
import type { WaiState } from './types';

/** "Riya", "Riya and Arjun", "Riya, Arjun and Meena". */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const own = (name: string) => `${name}'s`;

/**
 * The where-line: "Round 2 · Arjun's turn next" (T1, T4 after save, R1) · "Round 2 · Arjun guessing, 34 s left" (a paused
 * turn; `msLeft` is the turn's time left) · "Round 2 · Riya's turn, not saved yet" (T4 unsaved) · "Game over, game 1" (G1).
 * Null when tonight has ended or no game has started.
 */
export function whereLine(s: WaiState, msLeft?: number): string | null {
  if (s.step === 'gameOver') return `Game over, game ${s.game}`;
  if (!gameOpen(s)) return null;
  const p = currentPlayer(s) ?? '';
  const round = `Round ${s.round}`;
  if (s.step === 'review') return `${round} · ${own(p)} turn, not saved yet`;
  if (s.step === 'turn') {
    const left = Math.max(0, Math.ceil((msLeft ?? (s.choices?.time ?? 60) * 1000) / 1000));
    return `${round} · ${p} guessing, ${left} s left`;
  }
  return `${round} · ${own(p)} turn next`;
}

/** Home's unfinished row, line 1: "What Am I? · Round 2 · Arjun's turn" (and the where-line's other forms). */
export function homeLine1(s: WaiState, msLeft?: number): string | null {
  if (s.step === 'pass') return `What Am I? · Round ${s.round} · ${own(currentPlayer(s) ?? '')} turn`;
  const w = whereLine(s, msLeft);
  return w === null ? null : `What Am I? · ${w}`;
}

/** "8:05 pm": h:mm with lower-case am/pm, in the phone's local time. */
export function clockText(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** "Riya, Arjun +4": the first two current players in turn order, "+n" for the others (leavers not counted). */
export function playersShort(order: readonly string[]): string {
  const two = order.slice(0, 2).join(', ');
  return order.length > 2 ? `${two} +${order.length - 2}` : two;
}

/** Home's line 2: "Riya, Arjun +4 · 8:05 pm · Tap to resume" (`firstStart`: tonight's first `start`, local time). */
export const homeLine2 = (s: WaiState, firstStart: Date): string => `${playersShort(s.order)} · ${clockText(firstStart)} · Tap to resume`;

/** What the phone knows for the tip line (stored on this phone, not in the game). */
export interface PhoneTips {
  /** "Keep your screen on during the turn." is due: a wake lock was refused, and it has not shown this game. */
  readonly screenOn: boolean;
  /** This is the first T1 of this game on this phone. */
  readonly firstTurnOfGame: boolean;
  /** A rotation-lock event was recorded on this phone in an earlier game. */
  readonly rotationEarlier: boolean;
  readonly platform: 'iphone' | 'android';
}

/** The pack's unshown words still in the queue (not fallback words). */
function packUnshown(s: WaiState): number {
  if (!s.choices || s.choices.pack === 'mix' || s.fallback) return 0;
  return s.unshown.length;
}

/** WAI-011: T1's tip line, at most one, the first that applies; null for none. */
export function tipLine(s: WaiState, phone: PhoneTips): string | null {
  if (!gameOpen(s) || !s.choices) return null;
  const toPlay = toPlayOf(s);
  const joining = s.joined.filter((p) => toPlay.includes(p));
  if (joining.length > 0) return `Joining this round: ${joinNames(joining)}`;
  if (phone.screenOn) return 'Keep your screen on during the turn.';
  const pack = s.choices.pack;
  if (pack !== 'mix') {
    const n = packUnshown(s);
    if (n >= 1 && n <= 14) {
      return `Only ${n} new ${pack} ${n === 1 ? 'word' : 'words'} left. After that, words come from Mix of all.`;
    }
    if (s.fallback && s.unshown.length > 0) return `${pack} words used up. Words now come from Mix of all.`;
  }
  if (s.unshown.length === 0) {
    return 'All words used tonight. Words from earlier games come back, oldest first.';
  }
  if (phone.firstTurnOfGame) {
    if (s.choices.sounds) return 'Turn the sound up so the guesser hears each word count.';
    if (phone.rotationEarlier) {
      return phone.platform === 'iphone'
        ? 'Screen not turning? Turn off rotation lock.'
        : 'Screen not turning? Turn on Auto-rotate.';
    }
  }
  return null;
}
