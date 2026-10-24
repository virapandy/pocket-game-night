// MAF-093 (items 19, 31): History's rows for a saved Mafia game night, one per game that is over:
// "Mafia · 9:10 pm · 9 players · The Village won · 3 nights" (each game's own `start` time; nights = resolved nights).
import type { SavedGame } from "../../../engine";
import { readMafiaNight } from "../rules";
import { D } from "./dayText";

/** "9:10 pm" (as Home's rows). */
function clock(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

export interface MafiaHistoryRow {
  readonly key: string;
  /** The saved game night's id, and the game's index in it. */
  readonly id: string;
  readonly game: number;
  /** The game night has ended (Clear all history deletes it; one still going is kept). */
  readonly ended: boolean;
  /** The game's `start` time (History sorts by it, newest first). */
  readonly at: number;
  readonly text: string;
}

/** The rows of one saved game night (none when it is not Mafia, or no game of it is over). */
export function historyRows(saved: SavedGame): MafiaHistoryRow[] {
  if (saved.gameType !== "mafia") return [];
  const night = readMafiaNight(saved);
  if (!night) return [];
  const starts = saved.records
    .filter((r) => (r.move as { type?: unknown }).type === "start")
    .map((r) => r.at);
  const rows: MafiaHistoryRow[] = [];
  night.games.forEach((g, i) => {
    if (
      !g.over ||
      (g.endedEarly && g.nights.length === 0 && g.votes.length === 0)
    )
      return;
    const at = starts[i] ?? saved.createdAt;
    const result =
      g.winner === "village"
        ? D.history.village
        : g.winner === "mafia"
          ? D.history.mafia
          : D.history.ended;
    rows.push({
      key: `${saved.id}:${g.number}`,
      id: saved.id,
      game: g.number,
      ended: saved.status !== 'in-progress' && saved.status !== 'paused',
      at,
      text: D.history.row(clock(at), g.players.length, result, g.nights.length),
    });
  });
  return rows;
}
