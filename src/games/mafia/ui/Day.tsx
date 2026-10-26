// Mafia's morning and day (specs/mafia/04-day.md): M1 Morning (MAF-030, MAF-037, MAF-092), Y1 Day with the 2-minute timer
// (MAF-031), V1 the countdown (MAF-032), V2 the picker (MAF-033), V2t the tie and V3 the re-vote (MAF-034), V3s "Still a
// tie" and V4 the vote result (MAF-036). The "Nobody out today?" dialog (MAF-035) is drawn by the frame (Room.tsx) from
// NobodyDialog here. Strings: ./dayText.ts.
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { QuietButton } from "../../../blocks";
import type { MafiaView } from "../rules";
import type { RoomCtx } from "./ctx";
import { D } from "./dayText";
import { Main, MoreBelow, Question, TextLink } from "./parts";
import { T } from "./text";

const countLine = (v: MafiaView) =>
  D.count(v.in.length, v.caught, v.mafiaCount);

function Quiet({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return <QuietButton onClick={onClick}>{children}</QuietButton>;
}

// ---- The day timer (MAF-031, items 22 and 23) ----
// Not saved (a reload removes it). It keeps counting on V1 and by the wall clock while the app is hidden; only the Paused
// cover stops it. It ends when V2 opens, on "← Back to talking", and when the day is left.

const TIMER_MS = 120_000;
interface TimerState {
  /** Milliseconds left at `since` (or now, while stopped by the Paused cover). */
  left: number;
  /** When it last started counting; null while paused. */
  since: number | null;
  done: boolean;
}
let timer: TimerState | null = null;
let ding: ReturnType<typeof setTimeout> | null = null;
let onDing: (() => void) | null = null;
const listeners = new Set<() => void>();
let version = 0;
const changed = () => {
  version += 1;
  for (const l of listeners) l();
};
const leftNow = (t: TimerState, now = Date.now()) =>
  t.since === null ? t.left : t.left - (now - t.since);
function schedule() {
  if (ding) clearTimeout(ding);
  ding = null;
  if (!timer || timer.done || timer.since === null) return;
  ding = setTimeout(
    () => {
      if (!timer) return;
      timer = { left: 0, since: null, done: true };
      onDing?.();
      changed();
    },
    Math.max(0, leftNow(timer)),
  );
}
export const dayTimer = {
  start(sound: () => void) {
    onDing = sound;
    timer = { left: TIMER_MS, since: Date.now(), done: false };
    schedule();
    changed();
  },
  stop() {
    if (ding) clearTimeout(ding);
    ding = null;
    if (timer !== null) {
      timer = null;
      changed();
    }
  },
  pause(on: boolean) {
    if (!timer || timer.done) return;
    if (on && timer.since !== null)
      timer = { left: leftNow(timer), since: null, done: false };
    else if (!on && timer.since === null)
      timer = { ...timer, since: Date.now() };
    else return;
    schedule();
    changed();
  },
};
function useTimerVersion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
}
/** "2:00" … "0:01": seconds left rounded up, so never "0:00". */
const clockText = (ms: number) => {
  const s = Math.max(1, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function DayTimer({ ctx }: { ctx: RoomCtx }) {
  useTimerVersion();
  const [, tick] = useState(0);
  useEffect(() => {
    dayTimer.pause(ctx.paused);
  }, [ctx.paused]);
  const running = timer !== null && !timer.done && timer.since !== null;
  useEffect(() => {
    if (!running || !timer) return;
    // Wake at each whole second left.
    const left = leftNow(timer);
    const next = left - Math.floor((left - 1) / 1000) * 1000;
    const id = setTimeout(() => tick((n) => n + 1), Math.max(1, next));
    return () => clearTimeout(id);
  });
  const t = timer;
  return (
    <div className="maf-timer-row">
      {t && !t.done && (
        <p className="maf-timer" data-testid="day-timer" role="timer">
          {clockText(leftNow(t))}
        </p>
      )}
      {t?.done && <p className="maf-timer-up">{D.y1.timesUp}</p>}
      {t && !t.done ? (
        <TextLink onClick={() => dayTimer.stop()}>{D.y1.stop}</TextLink>
      ) : (
        <TextLink onClick={() => dayTimer.start(() => ctx.sound("ding"))}>
          {D.y1.timer}
        </TextLink>
      )}
    </div>
  );
}

// ---- M1 Morning ----
function BreakLine({ ctx }: { ctx: RoomCtx }) {
  return ctx.breakLine ? <p className="maf-body">{D.m1.breakLine}</p> : null;
}

/** MAF-030: the story, the role line of a player out tonight (never a leaver, item 32), the count line. */
export function M1({ ctx }: { ctx: RoomCtx }) {
  const v = ctx.view;
  const out = v.morning?.out
    ? v.out.find((o) => o.player === v.morning?.out && o.how === "night")
    : undefined;
  const over = v.step === "gameOver";
  useEffect(() => dayTimer.stop(), []);
  return (
    <div className="maf-column maf-day">
      <h1 className="pgn-title">{D.m1.title(v.round)}</h1>
      <p className="maf-story" data-testid="story">
        {v.morning?.story ?? ""}
      </p>
      {out && (
        <p className="maf-role-line" data-testid="role-line">
          {D.was(out.player, out.role)}
        </p>
      )}
      <p className="maf-small" data-testid="count-line">
        {countLine(v)}
      </p>
      <div className="maf-quiet-stack">
        {!over && <BreakLine ctx={ctx} />}
        {!over && <Quiet onClick={ctx.seeRoleAgain}>{D.m1.seeRole}</Quiet>}
        {!over && <Quiet onClick={ctx.askEndGame}>{D.m1.endGame}</Quiet>}
        <Quiet onClick={ctx.home}>{T.home}</Quiet>
      </div>
      <Main onClick={() => ctx.go(over ? "g1" : "y1")}>
        {over ? D.m1.seeWho : D.m1.talk}
      </Main>
    </div>
  );
}

// ---- Y1 Day ----
/** MAF-031 (item 21): who is in (seat order), then out players in the order they went out, then leavers as they left. */
export function Y1({ ctx }: { ctx: RoomCtx }) {
  const v = ctx.view;
  return (
    <div className="maf-column maf-day">
      <h1 className="pgn-title">{D.y1.title(v.round)}</h1>
      <h2 className="maf-subtitle">{D.y1.still}</h2>
      <ul className="maf-day-list maf-in-list">
        {v.in.map((p) => (
          <li key={p}>{p}</li>
        ))}
        {v.out.map((o) => (
          <li key={o.player} className="maf-greyed">
            {D.y1.out(o.player, o.role, o.how, o.round)}
          </li>
        ))}
        {v.left.map((p) => (
          <li key={p} className="maf-greyed">
            {D.y1.left(p)}
          </li>
        ))}
      </ul>
      {v.out.length > 0 && <p className="maf-small">{D.y1.watch}</p>}
      <DayTimer ctx={ctx} />
      <div className="maf-quiet-stack">
        <BreakLine ctx={ctx} />
        <Quiet onClick={ctx.seeRoleAgain}>{D.m1.seeRole}</Quiet>
        <Quiet onClick={ctx.home}>{T.home}</Quiet>
      </div>
      <Main onClick={() => ctx.go("v1")}>{D.y1.vote}</Main>
    </div>
  );
}

// ---- V1 the countdown ----
/** MAF-032: 3, 2, 1, Point! (1 s each, a tick each and a ding at "Point!"), then the picker by itself. No menu, no Pause. */
export function V1({ ctx }: { ctx: RoomCtx }) {
  const [i, setI] = useState(0);
  const revote = ctx.view.step === "revote";
  const steps = D.v1.steps;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  useEffect(() => {
    ctxRef.current.sound(i === steps.length - 1 ? "ding" : "tick");
    const id = setTimeout(() => {
      if (i < steps.length - 1) setI(i + 1);
      else ctxRef.current.go(revote ? "v3" : "v2");
    }, 1000);
    return () => clearTimeout(id);
  }, [i, revote, steps.length]);
  return (
    <div className="maf-countdown-screen">
      <p
        className="maf-countdown-heading"
        data-testid="countdown-heading"
        role="heading"
        aria-level={1}
      >
        {revote && ctx.view.tied ? D.v1.only(ctx.view.tied) : D.v1.heading}
      </p>
      <p
        className="maf-countdown"
        data-testid="countdown-number"
        aria-live="assertive"
      >
        {steps[i]}
      </p>
      <Quiet onClick={() => ctx.go(revote ? "v3" : "y1")}>{D.v1.notYet}</Quiet>
    </div>
  );
}

// ---- V2, V3 the picker ----
function Names({
  names,
  selected,
  onPick,
}: {
  names: readonly string[];
  selected: readonly string[];
  onPick: (p: string) => void;
}) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <div ref={setBox} className="maf-names-box maf-vote-names">
        {names.map((p) => (
          <button
            key={p}
            type="button"
            className={
              selected.includes(p) ? "pgn-option pgn-selected" : "pgn-option"
            }
            aria-pressed={selected.includes(p)}
            onClick={() => onPick(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <MoreBelow box={box} watch={names.join("|")} />
    </>
  );
}

function Picker({
  ctx,
  names,
  revote,
}: {
  ctx: RoomCtx;
  names: readonly string[];
  revote: boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => dayTimer.stop(), []);
  const pick = sel !== null && names.includes(sel) ? sel : null;
  return (
    <div className="maf-column maf-vote">
      <h1 className="pgn-title">{D.v2.title}</h1>
      <Names names={names} selected={pick ? [pick] : []} onPick={setSel} />
      <p className="maf-small maf-not-sure">{D.v2.notSure}</p>
      <div className="maf-vote-foot">
        <div className={revote ? "maf-vote-links maf-two" : "maf-vote-links"}>
          {revote ? (
            <Quiet
              onClick={() =>
                ctx.play({ type: "voteNobody", reason: "secondTie" }) &&
                ctx.go("v3s")
              }
            >
              {D.v3.still}
            </Quiet>
          ) : (
            <Quiet onClick={() => ctx.go("v2t")}>{D.v2.tie}</Quiet>
          )}
          <Quiet onClick={() => ctx.go("v1")}>{D.v2.again}</Quiet>
          {!revote && <Quiet onClick={ctx.askNobody}>{D.v2.nobody}</Quiet>}
        </div>
        {!revote && <Quiet onClick={() => ctx.go("y1")}>{D.v2.back}</Quiet>}
      </div>
      <Main
        disabled={pick === null}
        onClick={() =>
          pick && ctx.play({ type: "voteOut", player: pick }) && ctx.go("v4")
        }
      >
        {pick ? D.v2.vote(pick) : D.v2.voteOut}
      </Main>
    </div>
  );
}

/** MAF-033: every player who is in; "It's a tie", "Count again", "Nobody today"; "← Back to talking". */
export function V2({ ctx }: { ctx: RoomCtx }) {
  return <Picker ctx={ctx} names={ctx.view.in} revote={false} />;
}
/** MAF-034 (items 14, 23, 24): the re-vote: only the tied players still in; "Still a tie", "Count again". */
export function V3({ ctx }: { ctx: RoomCtx }) {
  return (
    <Picker
      ctx={ctx}
      names={(ctx.view.tied ?? []).filter((p) => ctx.view.in.includes(p))}
      revote
    />
  );
}

/** MAF-034: tick everyone tied (seat order); main "Point again" (disabled) until 2 are ticked. */
export function V2t({ ctx }: { ctx: RoomCtx }) {
  const [sel, setSel] = useState<string[]>([]);
  const tied = ctx.view.in.filter((p) => sel.includes(p));
  return (
    <div className="maf-column maf-vote">
      <h1 className="pgn-title">{D.v3.title}</h1>
      <Names
        names={ctx.view.in}
        selected={tied}
        onPick={(p) =>
          setSel(sel.includes(p) ? sel.filter((x) => x !== p) : [...sel, p])
        }
      />
      <Quiet onClick={() => ctx.go("v2")}>{D.v3.notTie}</Quiet>
      <Main
        disabled={tied.length < 2}
        onClick={() => ctx.play({ type: "tie", players: tied }) && ctx.go("v1")}
      >
        {tied.length < 2 ? D.v3.point : D.v3.pointAt(tied)}
      </Main>
    </div>
  );
}

/** MAF-034: "Still a tie. Nobody is out today."; quiet "← Home"; main "Start night r + 1". */
export function V3s({ ctx }: { ctx: RoomCtx }) {
  return (
    <div className="maf-column maf-vote">
      <h1 className="pgn-title">{D.v3.stillTitle}</h1>
      <span className="maf-grow" />
      <Quiet onClick={ctx.home}>{T.home}</Quiet>
      <Main onClick={() => ctx.go("n0")}>{D.v3.night(ctx.view.round)}</Main>
    </div>
  );
}

/**
 * MAF-036 (items 22, 25): "KABIR is out." at once; at 1500 ms the role line, the count line and the main button (its guard
 * from then). Quiet buttons from t = 0: "End the game" and "← Home", or only "← Home" when the vote ended the game.
 * Resumed, the role line shows at once.
 */
export function V4({ ctx }: { ctx: RoomCtx }) {
  const v = ctx.view;
  const [shown, setShown] = useState(ctx.resumed);
  useEffect(() => {
    if (shown) return;
    const id = setTimeout(() => setShown(true), 1500);
    return () => clearTimeout(id);
  }, [shown]);
  const over = v.step === "gameOver";
  if (!v.vote) return null;
  return (
    <div className="maf-column maf-vote">
      <h1 className="pgn-title">
        <span className="maf-caps">{v.vote.player}</span>
        {D.v4.out}
      </h1>
      {shown && (
        <p className="maf-role-line" data-testid="role-line">
          {D.was(v.vote.player, v.vote.role)}
        </p>
      )}
      {shown && (
        <p className="maf-small" data-testid="count-line">
          {countLine(v)}
        </p>
      )}
      <span className="maf-grow" />
      <div className="maf-quiet-stack">
        {!over && <Quiet onClick={ctx.askEndGame}>{D.m1.endGame}</Quiet>}
        <Quiet onClick={ctx.home}>{T.home}</Quiet>
      </div>
      {shown && (
        <Main onClick={() => ctx.go(over ? "g1" : "n0")}>
          {over ? D.m1.seeWho : D.v3.night(v.round)}
        </Main>
      )}
    </div>
  );
}

/** MAF-035: "Nobody out today?"; "Nobody today" records `voteNobody { reason: 'chosen' }` → N0; "Back to the vote" (main). */
export function NobodyDialog({
  round,
  onYes,
  onNo,
}: {
  round: number;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Question
      ask={D.nobody.ask}
      body={D.nobody.body(round + 1)}
      yes={D.nobody.yes}
      no={D.nobody.no}
      onYes={onYes}
      onNo={onNo}
    />
  );
}
