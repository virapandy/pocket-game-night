// Mafia's results (specs/mafia/07-results.md): G1 Game over (MAF-060 to MAF-062, the leaver line of MAF-041) and G2
// Tonight's summary (MAF-063, MAF-064). The facts come from the saved game night as History reads it (readMafiaNight).
// Strings: ./dayText.ts.
import { useState, type ReactNode } from "react";
import { QuietButton } from "../../../blocks";
import type { MafiaNightGame, MafiaView } from "../rules";
import type { RoomCtx } from "./ctx";
import { D } from "./dayText";
import { Main } from "./parts";
import { T } from "./text";

function Quiet({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return <QuietButton onClick={onClick}>{children}</QuietButton>;
}

type NightLine = MafiaNightGame["nights"][number];

/** MAF-060 item 18: one night's line, its clauses in order, each left out when that role made no pick. */
export function nightLine(g: MafiaNightGame, n: NightLine): string {
  const clauses: string[] = [];
  const picked = [...new Set(n.mafia)];
  if (picked.length === 0) clauses.push(D.g1.mafiaNone);
  else if (picked.length > 1 && n.target !== null && n.chosen)
    clauses.push(D.g1.phoneChose(picked, n.target));
  else clauses.push(D.g1.mafiaPicked(picked));
  if (n.protected !== null) {
    const doctor = n.picks.find(
      (p) => g.roles[p.player] === "doctor" && p.target === n.protected,
    )?.player;
    clauses.push(
      doctor === n.protected ? D.g1.protectedSelf : D.g1.protected(n.protected),
    );
  }
  if (n.checked) clauses.push(D.g1.checked(n.checked.player, n.checked.mafia));
  clauses.push(n.out ? D.g1.wasOut(n.out) : D.g1.nobodyOut);
  for (const p of n.left) clauses.push(D.g1.nightLeft(p));
  return D.g1.night(n.night, clauses);
}

/** MAF-041 (item 18): the players whose leave applied in the step that ended the game with a winner. */
function deciders(
  ctx: RoomCtx,
  v: MafiaView,
  g: MafiaNightGame | undefined,
): string[] {
  if (!g || v.winner === null) return [];
  const last = ctx.lastMove;
  if (last?.type === "leave") return [last.player]; // a day leave (night leaves wait for the night)
  const night = g.nights[g.nights.length - 1];
  const dayAfter = night ? g.votes.some((x) => x.day === night.night) : true;
  return night && !dayAfter ? [...night.left] : [];
}

function statusOf(v: MafiaView, p: string): string {
  const o = v.out.find((x) => x.player === p);
  if (o)
    return o.how === "night" ? D.g1.outNight(o.round) : D.g1.votedOut(o.round);
  return v.left.includes(p) ? D.g1.left : D.g1.inToEnd;
}

/** MAF-060: Game over. The page may scroll; the main button stays fixed. */
export function G1({ ctx }: { ctx: RoomCtx }) {
  const v = ctx.view;
  const [each, setEach] = useState(false);
  const night = ctx.night();
  const g = night?.games[v.game - 1];
  const title =
    v.winner === "village"
      ? D.g1.village
      : v.winner === "mafia"
        ? D.g1.mafia
        : D.g1.none;
  const line =
    v.winner === "village"
      ? D.g1.villageLine
      : v.winner === "mafia"
        ? D.g1.mafiaLine
        : null;
  const leavers = deciders(ctx, v, g);
  const roles = v.roles ?? g?.roles ?? {};
  const tally = night?.tally ?? v.tally;
  return (
    <div className="maf-column maf-results">
      <h1 className="pgn-title">{title}</h1>
      {line && <p className="maf-body">{line}</p>}
      {leavers.length > 0 && (
        <p className="maf-body">{D.g1.hadToLeave(leavers)}</p>
      )}
      <h2 className="maf-subtitle">{D.g1.whoWasWho}</h2>
      <ul className="maf-who-list">
        {v.players.map((p) => {
          const r = roles[p];
          return <li key={p}>{r ? D.g1.row(p, r, statusOf(v, p)) : p}</li>;
        })}
      </ul>
      {g && g.nights.length > 0 && (
        <>
          <Quiet onClick={() => setEach(!each)}>{D.g1.each}</Quiet>
          {each && (
            <ul className="maf-night-lines">
              {g.nights.map((n) => (
                <li key={n.night}>{nightLine(g, n)}</li>
              ))}
            </ul>
          )}
        </>
      )}
      {g?.spotter && (
        <p className="maf-fun">
          {D.g1.spotter(g.spotter.player, g.spotter.nights, g.spotter.of)}
        </p>
      )}
      {g?.ghost && <p className="maf-fun">{D.g1.ghost(g.ghost)}</p>}
      {tally.village + tally.mafia > 0 && (
        <p className="maf-small">{D.g1.tally(tally.village, tally.mafia)}</p>
      )}
      <div className="maf-quiet-row">
        <Quiet onClick={ctx.changePlayers}>{D.g1.change}</Quiet>
        <Quiet onClick={ctx.askEndTonight}>{D.g1.endTonight}</Quiet>
        <Quiet onClick={ctx.home}>{T.home}</Quiet>
      </div>
      <Main onClick={ctx.playAgain}>{D.g1.again}</Main>
    </div>
  );
}

/** MAF-064: Tonight's summary. "Oops, keep playing" returns while nothing is recorded yet (item 27). */
export function G2({ ctx }: { ctx: RoomCtx }) {
  const night = ctx.night();
  const s = night?.summary;
  const tally = night?.tally;
  return (
    <div className="maf-column maf-results">
      <h1 className="pgn-title">{D.g2.title}</h1>
      {s && <p className="maf-body">{D.g2.count(s.players, s.games)}</p>}
      {tally && tally.village + tally.mafia > 0 && (
        <p className="maf-body">{D.g2.score(tally.village, tally.mafia)}</p>
      )}
      {s?.mostMafia && (
        <p className="maf-body">
          {D.g2.mostMafia(s.mostMafia.player, s.mostMafia.games)}
        </p>
      )}
      {s?.spotter && <p className="maf-body">{D.g2.spotter(s.spotter)}</p>}
      <span className="maf-grow" />
      <div className="maf-quiet-stack">
        {!night?.ended && (
          <Quiet onClick={ctx.backFromSummary}>{D.g2.oops}</Quiet>
        )}
        <Quiet onClick={() => ctx.finishTonight("home")}>{T.home}</Quiet>
      </div>
      <Main onClick={() => ctx.finishTonight("else")}>{D.g2.elsewhere}</Main>
    </div>
  );
}
