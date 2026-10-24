// STAND-INS. Simple versions of the private screens (B1, B2, N0–N3: lane M3) and the day and results screens (M1, Y1,
// V1–V4, G1, G2: lane M4), so the room frame (lane M2) can be reached and checked. Each lane replaces its screens here
// (or moves them to their own file and points SCREENS at them); the frame (Room.tsx) only reads SCREENS.
// Words from text.csv; layouts are plain and not yet checked against the scenarios' sizes.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QuietButton } from '../../../blocks';
import type { MafiaView, Role } from '../rules';
import type { RoomCtx } from './ctx';
import { Main, NAME_GUARD_MS } from './parts';
import { T } from './text';
import type { ScreenId } from './tonight';

const roleWord = (r: Role) => T.role[r];
const wasLine = (name: string, r: Role) =>
  r === 'mafia' ? `${name} was MAFIA!` : r === 'villager' ? `${name} was a Villager.` : `${name} was the ${roleWord(r)}.`;
const countLine = (v: MafiaView) => `${v.in.length} players left · Mafia caught: ${v.caught} of ${v.mafiaCount}`;
const or = (names: readonly string[]) => (names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`);

function Quiet({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <QuietButton onClick={onClick}>{children}</QuietButton>;
}

// ---- B1, B2: the deal ----
function B1({ ctx }: { ctx: RoomCtx }) {
  const t = ctx.view.turn;
  if (!t) return null;
  return (
    <div className="maf-pass">
      <p className="maf-small" data-testid="deal-progress">{`Player ${t.i} of ${t.of}`}</p>
      <p className="maf-body">Pass the phone to</p>
      <p className="maf-pass-name maf-caps" data-testid="pass-name">{t.player}</p>
      <p className="maf-body">Everyone else, look away!</p>
      <Main ms={NAME_GUARD_MS} guardKey={t.player} onClick={() => ctx.go('b2')}>{`I'm ${t.player}`}</Main>
    </div>
  );
}

/** The pad: hold to see (or "Tap instead": tap to see, tap to hide). */
function Pad({ shown, tapMode, hold, onShow, onHide }: { shown: boolean; tapMode: boolean; hold: string; onShow: () => void; onHide: () => void }) {
  if (tapMode) {
    return (
      <button type="button" className="maf-pad" data-tap-guard="off" onClick={() => (shown ? onHide() : onShow())}>
        {shown ? 'Tap to hide' : hold === 'Hold here to see your role' ? 'Tap to see' : hold}
      </button>
    );
  }
  return (
    <button type="button" className="maf-pad" data-tap-guard="off" onPointerDown={onShow} onPointerUp={onHide} onPointerLeave={onHide}>
      {hold}
    </button>
  );
}

function B2({ ctx }: { ctx: RoomCtx }) {
  const t = ctx.view.turn;
  const [tapMode, setTapMode] = useState(false);
  const [shown, setShown] = useState(false);
  const [once, setOnce] = useState(false);
  if (!t) return null;
  const me = ctx.own(t.player).me;
  const next = ctx.view.players[t.i];
  const done = () => {
    if (!ctx.play({ type: 'seen', player: t.player })) return;
    ctx.go(next ? 'b1' : 'n0');
  };
  return (
    <div className="maf-pass">
      <p className="maf-small" data-testid="deal-progress">{`Player ${t.i} of ${t.of}`}</p>
      <p className="maf-pass-name maf-caps" data-testid="pass-name">{t.player}</p>
      {!tapMode && <Quiet onClick={() => setTapMode(true)}>Tap instead</Quiet>}
      <Pad shown={shown} tapMode={tapMode} hold="Hold here to see your role" onShow={() => { setShown(true); setOnce(true); }} onHide={() => setShown(false)} />
      {shown && me && (
        <div data-testid="private-block" aria-live="polite">
          <p className="maf-role maf-caps" data-testid="private-word">{roleWord(me.role)}</p>
        </div>
      )}
      {!once && <Quiet onClick={() => ctx.go('b1')}>{`Not ${t.player}? ← Back`}</Quiet>}
      {once && <Quiet onClick={ctx.askDealAgain}>Someone saw my role</Quiet>}
      {once && <Main onClick={done}>{next ? `Done, pass to ${next}` : "Done, everyone's seen"}</Main>}
    </div>
  );
}

// ---- N0 to N3: the night ----
function N0({ ctx }: { ctx: RoomCtx }) {
  const r = ctx.view.round;
  return (
    <div className="maf-pass">
      <h1 className="pgn-title">{`Night ${r}`}</h1>
      <p className="maf-body">Pass the phone round once more. Everyone does the same: tap to see your night job, pick one name, tap Done, pass it on.</p>
      <p className="maf-body">Keep your face still!</p>
      <Main onClick={() => ctx.play({ type: 'startNight', night: r }) && ctx.go('n1')}>Start the night</Main>
    </div>
  );
}

function N1({ ctx }: { ctx: RoomCtx }) {
  const t = ctx.view.turn;
  if (!t) return null;
  const out = ctx.view.out.some((o) => o.player === t.player);
  return (
    <div className="maf-pass">
      <p className="maf-small" data-testid="night-progress">{`Night ${ctx.view.round} · ${t.i} of ${t.of}`}</p>
      <p className="maf-body">Pass the phone to</p>
      <p className="maf-pass-name maf-caps" data-testid="pass-name">{t.player}</p>
      <p className="maf-body">Everyone else, look away!</p>
      {out && <p className="maf-body">You're out: pick who you think is Mafia.</p>}
      <Main ms={NAME_GUARD_MS} guardKey={t.player} onClick={() => ctx.go('n2')}>{`I'm ${t.player}`}</Main>
    </div>
  );
}

function jobLine(ctx: RoomCtx, player: string): string {
  const job = ctx.own(player).job;
  if (!job) return '';
  switch (job.kind) {
    case 'mafia':
      if (job.latest) return `MAFIA · ${job.latest.by}'s pick: ${job.latest.target}. Tap ${job.latest.target} to agree, or pick someone else.`;
      return job.see.length > 0 ? `MAFIA · Pick who goes out tonight. ${job.see.join(' and ')} will see your pick.` : 'MAFIA · Pick who goes out tonight.';
    case 'doctor':
      return 'DOCTOR · Pick someone to protect tonight.';
    case 'police':
      return job.names.some((n) => n.allowed) ? 'POLICE · Pick someone to check.' : 'POLICE · Nobody left to check.';
    case 'villager':
      return 'VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.';
    case 'ghost':
      return "YOU'RE OUT · Ghost guess: who's Mafia? Pick one.";
  }
}

function resultLine(ctx: RoomCtx, player: string, pick: string): string {
  const job = ctx.own(player).job;
  switch (job?.kind) {
    case 'mafia':
      return `${pick}.`;
    case 'doctor':
      return pick === player ? 'You are protected tonight.' : `${pick} is protected tonight.`;
    case 'police': {
      const after = ctx.peekOwn({ type: 'nightPick', player, target: pick }, player);
      const check = after?.checks.find((c) => c.player === pick);
      return check?.mafia ? `${pick}: MAFIA.` : `${pick}: Not Mafia.`;
    }
    case 'villager':
      return `You think it's ${pick}. At the end we'll see if you were right.`;
    default:
      return `Your guess: ${pick}.`;
  }
}

function N2({ ctx }: { ctx: RoomCtx }) {
  const t = ctx.view.turn;
  const [shown, setShown] = useState(false);
  const [firstAt, setFirstAt] = useState<number | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    if (firstAt === null) return;
    const left = firstAt + 4000 - Date.now();
    if (left <= 0) return;
    const id = setTimeout(() => tick((n) => n + 1), left);
    return () => clearTimeout(id);
  }, [firstAt]);
  if (!t) return null;
  const job = ctx.own(t.player).job;
  const none = job !== null && !job.names.some((n) => n.allowed);
  const move = { type: 'nightPick' as const, player: t.player, target: none ? null : pick };
  const after = ctx.peek(move);
  const ready = firstAt !== null && Date.now() - firstAt >= 4000 && (pick !== null || none);
  const done = () => {
    if (!ctx.play(move)) return;
    ctx.go(after?.step === 'night' ? 'n1' : 'n3');
  };
  return (
    <div className="maf-pass">
      <p className="maf-small" data-testid="night-progress">{`Night ${ctx.view.round}`}</p>
      <p className="maf-pass-name maf-caps" data-testid="pass-name">{t.player}</p>
      <button
        type="button"
        className="maf-pad"
        data-tap-guard="off"
        onClick={() => {
          setShown(!shown);
          if (firstAt === null) setFirstAt(Date.now());
        }}
      >
        {shown ? 'Tap to hide' : 'Tap to see your night job'}
      </button>
      {firstAt === null && <Quiet onClick={() => ctx.go('n1')}>{`Not ${t.player}? ← Back`}</Quiet>}
      {shown && job && (
        <>
          <p className="maf-body" data-testid="job-line">{jobLine(ctx, t.player)}</p>
          <div className="maf-names-box" data-testid="night-names">
            {job.names.map((n) => (
              <button key={n.player} type="button" className={pick === n.player ? 'pgn-option pgn-selected' : 'pgn-option'} disabled={!n.allowed} onClick={() => setPick(n.player)}>
                {n.player}
              </button>
            ))}
          </div>
          <p className="maf-body" data-testid="result-line">{pick ? resultLine(ctx, t.player, pick) : ''}</p>
        </>
      )}
      {ready && shown && <Main onClick={done}>{after?.step === 'night' && after.turn ? `Done, pass to ${after.turn.player}` : 'Done, night over'}</Main>}
    </div>
  );
}

function N3({ ctx }: { ctx: RoomCtx }) {
  return (
    <div className="maf-pass">
      <h1 className="pgn-title">Night over.</h1>
      <p className="maf-body">Host, take the phone and read the morning aloud.</p>
      <Main onClick={ctx.readMorning}>Read the morning</Main>
    </div>
  );
}

// ---- M1, Y1: the morning and the day ----
function BreakLine({ ctx }: { ctx: RoomCtx }) {
  return ctx.breakLine ? <p className="maf-body">Back after a break? Everyone can see their role again.</p> : null;
}

function M1({ ctx }: { ctx: RoomCtx }) {
  const v = ctx.view;
  const out = v.morning?.out ? v.out.find((o) => o.player === v.morning?.out) : undefined;
  const over = v.step === 'gameOver';
  return (
    <div className="maf-column">
      <h1 className="pgn-title">{`Morning, day ${v.round}`}</h1>
      <p className="maf-body" data-testid="story">{v.morning?.story ?? ''}</p>
      {out && <p className="maf-body" data-testid="role-line">{wasLine(out.player, out.role)}</p>}
      <p className="maf-small" data-testid="count-line">{countLine(v)}</p>
      <BreakLine ctx={ctx} />
      <Quiet onClick={ctx.seeRoleAgain}>See my role again</Quiet>
      {!over && <Quiet onClick={ctx.askEndGame}>End the game</Quiet>}
      {!over && <Quiet onClick={ctx.home}>{T.home}</Quiet>}
      <Main onClick={() => ctx.go(over ? 'g1' : 'y1')}>{over ? 'See who won' : 'Start talking'}</Main>
    </div>
  );
}

function outText(v: MafiaView, p: string): string {
  const o = v.out.find((x) => x.player === p);
  if (o) return `${p} · ${roleWord(o.role)} · ${o.how === 'night' ? `out night ${o.round}` : `voted out day ${o.round}`}`;
  return T.leave.left(p);
}

function Y1({ ctx }: { ctx: RoomCtx }) {
  const v = ctx.view;
  return (
    <div className="maf-column">
      <h1 className="pgn-title">{`Day ${v.round} · Talk it over`}</h1>
      <h2 className="maf-subtitle">Who's still in</h2>
      <ul className="maf-day-list">
        {v.in.map((p) => (
          <li key={p}>{p}</li>
        ))}
        {v.out.map((o) => (
          <li key={o.player} className="maf-greyed">{outText(v, o.player)}</li>
        ))}
        {v.left.map((p) => (
          <li key={p} className="maf-greyed">{outText(v, p)}</li>
        ))}
      </ul>
      <p className="maf-small">Out players: watch quietly, no hints!</p>
      <BreakLine ctx={ctx} />
      <Quiet onClick={ctx.seeRoleAgain}>See my role again</Quiet>
      <Quiet onClick={ctx.home}>{T.home}</Quiet>
      <Main onClick={() => ctx.go('v1')}>Time to vote</Main>
    </div>
  );
}

// ---- V1 to V4: the vote ----
function V1({ ctx }: { ctx: RoomCtx }) {
  const steps = ['3', '2', '1', 'Point!'];
  const [i, setI] = useState(0);
  const revote = ctx.view.step === 'revote';
  useEffect(() => {
    const id = setTimeout(() => (i < steps.length - 1 ? setI(i + 1) : ctx.go(revote ? 'v3' : 'v2')), 1000);
    return () => clearTimeout(id);
  });
  return (
    <div className="maf-pass">
      <p className="maf-body" data-testid="countdown-heading" role="heading" aria-level={1}>
        {revote && ctx.view.tied ? `Point only at ${or(ctx.view.tied)}` : 'Everyone in, point at who you think is Mafia.'}
      </p>
      <p className="maf-countdown" data-testid="countdown-number">{steps[i]}</p>
      <Quiet onClick={() => ctx.go(revote ? 'v3' : 'y1')}>Not yet</Quiet>
    </div>
  );
}

function Picker({ ctx, names, revote }: { ctx: RoomCtx; names: readonly string[]; revote: boolean }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="maf-column">
      <h1 className="pgn-title">Who got the most fingers?</h1>
      <div className="maf-names-box">
        {names.map((p) => (
          <button key={p} type="button" className={sel === p ? 'pgn-option pgn-selected' : 'pgn-option'} aria-pressed={sel === p} onClick={() => setSel(p)}>
            {p}
          </button>
        ))}
      </div>
      <p className="maf-small">Not sure?</p>
      {revote ? (
        <Quiet onClick={() => ctx.play({ type: 'voteNobody', reason: 'secondTie' }) && ctx.go('v3s')}>Still a tie</Quiet>
      ) : (
        <Quiet onClick={() => ctx.go('v2t')}>It's a tie</Quiet>
      )}
      <Quiet onClick={() => ctx.go('v1')}>Count again</Quiet>
      {!revote && <Quiet onClick={ctx.askNobody}>Nobody today</Quiet>}
      {!revote && <Quiet onClick={() => ctx.go('y1')}>← Back to talking</Quiet>}
      <Main disabled={sel === null} onClick={() => sel && ctx.play({ type: 'voteOut', player: sel }) && ctx.go('v4')}>
        {sel ? `Vote ${sel} out` : 'Vote out'}
      </Main>
    </div>
  );
}

function V2({ ctx }: { ctx: RoomCtx }) {
  return <Picker ctx={ctx} names={ctx.view.in} revote={false} />;
}
function V3({ ctx }: { ctx: RoomCtx }) {
  return <Picker ctx={ctx} names={ctx.view.tied ?? []} revote />;
}

function V2t({ ctx }: { ctx: RoomCtx }) {
  const [sel, setSel] = useState<string[]>([]);
  const tied = ctx.view.in.filter((p) => sel.includes(p));
  return (
    <div className="maf-column">
      <h1 className="pgn-title">Tap everyone who is tied</h1>
      <div className="maf-names-box">
        {ctx.view.in.map((p) => (
          <button
            key={p}
            type="button"
            className={sel.includes(p) ? 'pgn-option pgn-selected' : 'pgn-option'}
            aria-pressed={sel.includes(p)}
            onClick={() => setSel(sel.includes(p) ? sel.filter((x) => x !== p) : [...sel, p])}
          >
            {p}
          </button>
        ))}
      </div>
      <Quiet onClick={() => ctx.go('v2')}>Not a tie</Quiet>
      <Main disabled={tied.length < 2} onClick={() => ctx.play({ type: 'tie', players: tied }) && ctx.go('v1')}>
        {tied.length < 2 ? 'Point again' : `Point again: ${or(tied)}`}
      </Main>
    </div>
  );
}

function V3s({ ctx }: { ctx: RoomCtx }) {
  return (
    <div className="maf-column">
      <h1 className="pgn-title">Still a tie. Nobody is out today.</h1>
      <Quiet onClick={ctx.home}>{T.home}</Quiet>
      <Main onClick={() => ctx.go('n0')}>{`Start night ${ctx.view.round}`}</Main>
    </div>
  );
}

function V4({ ctx }: { ctx: RoomCtx }) {
  const v = ctx.view;
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timer.current = setTimeout(() => setShown(true), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const over = v.step === 'gameOver';
  if (!v.vote) return null;
  return (
    <div className="maf-column">
      <h1 className="pgn-title">
        <span className="maf-caps">{v.vote.player}</span> is out.
      </h1>
      {shown && <p className="maf-body" data-testid="role-line">{wasLine(v.vote.player, v.vote.role)}</p>}
      <p className="maf-small" data-testid="count-line">{countLine(v)}</p>
      {!over && <Quiet onClick={ctx.askEndGame}>End the game</Quiet>}
      {!over && <Quiet onClick={ctx.home}>{T.home}</Quiet>}
      <Main onClick={() => ctx.go(over ? 'g1' : 'n0')}>{over ? 'See who won' : `Start night ${v.round}`}</Main>
    </div>
  );
}

// ---- G1, G2: after a game, after tonight ----
function G1({ ctx }: { ctx: RoomCtx }) {
  const v = ctx.view;
  const title = v.winner === 'village' ? 'The Village wins!' : v.winner === 'mafia' ? 'The Mafia win!' : 'Game ended. No winner.';
  const line = v.winner === 'village' ? 'Every Mafia is out.' : v.winner === 'mafia' ? "They're as many as everyone else." : null;
  const status = (p: string) => {
    const o = v.out.find((x) => x.player === p);
    if (o) return o.how === 'night' ? `out night ${o.round}` : `voted out day ${o.round}`;
    return v.left.includes(p) ? 'left' : 'in to the end';
  };
  return (
    <div className="maf-column">
      <h1 className="pgn-title">{title}</h1>
      {line && <p className="maf-body">{line}</p>}
      <h2 className="maf-subtitle">Who was who</h2>
      <ul className="maf-day-list">
        {v.players.map((p) => (
          <li key={p}>{`${p} · ${v.roles?.[p] ? roleWord(v.roles[p]) : ''} · ${status(p)}`}</li>
        ))}
      </ul>
      {v.tally.village + v.tally.mafia > 0 && <p className="maf-small">{`Tonight: Village ${v.tally.village} · Mafia ${v.tally.mafia}`}</p>}
      <Quiet onClick={ctx.changePlayers}>Change players or roles</Quiet>
      <Quiet onClick={ctx.askEndTonight}>End for tonight</Quiet>
      <Quiet onClick={ctx.home}>{T.home}</Quiet>
      <Main onClick={ctx.playAgain}>Play again</Main>
    </div>
  );
}

function G2({ ctx }: { ctx: RoomCtx }) {
  const night = ctx.night();
  const s = night?.summary;
  return (
    <div className="maf-column">
      <h1 className="pgn-title">Tonight's Mafia</h1>
      {s && <p className="maf-body">{`${s.players} ${s.players === 1 ? 'player' : 'players'} · ${s.games} ${s.games === 1 ? 'game' : 'games'}`}</p>}
      <Quiet onClick={ctx.backFromSummary}>Oops, keep playing</Quiet>
      <Quiet onClick={() => ctx.finishTonight('home')}>{T.home}</Quiet>
      <Main onClick={() => ctx.finishTonight('else')}>Play something else</Main>
    </div>
  );
}

/** Screen id → its body (and its one main button). The frame draws the top bar, "Welcome back." and the dialogs. */
export const SCREENS: Record<ScreenId, (p: { ctx: RoomCtx }) => ReactNode> = {
  b1: B1, b2: B2, n0: N0, n1: N1, n2: N2, n3: N3, m1: M1, y1: Y1, v1: V1, v2: V2, v2t: V2t, v3: V3, v3s: V3s, v4: V4, g1: G1, g2: G2,
};

/** D5 "Whose role?" (MAF-015, stand-in for lane M3): one player's role again, then "Done, back to the day". */
export function RoleAgain({ ctx, player, onDone }: { ctx: RoomCtx; player: string; onDone: () => void }) {
  const [shown, setShown] = useState(false);
  const me = ctx.own(player).me;
  return (
    <div className="maf-pass">
      <p className="maf-pass-name maf-caps" data-testid="pass-name">{player}</p>
      <Pad shown={shown} tapMode hold="Tap to see" onShow={() => setShown(true)} onHide={() => setShown(false)} />
      {shown && me && <p className="maf-role maf-caps" data-testid="private-word">{roleWord(me.role)}</p>}
      <Main onClick={onDone}>Done, back to the day</Main>
    </div>
  );
}
