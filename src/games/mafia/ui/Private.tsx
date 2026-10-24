// Mafia's deal and night screens (lane M3): B1 deal pass, B2 role card with "First time?" (MAF-010 to MAF-014), D5's role
// card again (MAF-015), N0 Night begins, N1 night pass, N2 night job, N3 Night over (MAF-020 to MAF-028).
// Privacy in look (MAF-P7, guideline 51): every role's card and every role's night job is the same frame. Each text box
// whose words differ by role has one fixed height for everyone: the tallest of all its variants (for this game's longest
// names, at this width and text size), measured off screen. So nobody can tell a role from the shape of the screen.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as PointerEv, type ReactNode, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { QuietButton } from '../../../blocks';
import type { MafiaPlayerView, Role } from '../rules';
import type { RoomCtx } from './ctx';
import { Main, NAME_GUARD_MS } from './parts';
import { CARD, FIRST_TIME, JOB, P, RESULT, partnerLine } from './privateText';
import './private.css';

const NIGHT_GUARD_MS = 4000;
const HOLD_MS = 500;
const TAP_HIDE_MS = 8_000;
const IDLE_HIDE_MS = 60_000;

const stop = (e: { preventDefault: () => void }) => e.preventDefault();
const Caps = ({ children }: { children: ReactNode }) => <span className="maf-caps">{children}</span>;

/** A name on one line: shrunk (never below 60 %) only when it would not fit; its box keeps one height for every name. */
function useFitName(ref: RefObject<HTMLElement | null>, key: unknown) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.fontSize = '';
    if (el.scrollWidth <= el.clientWidth + 0.5) return;
    const full = parseFloat(getComputedStyle(el).fontSize) || 28;
    el.style.fontSize = `${Math.max(Math.floor(full * 0.6), Math.floor((full * el.clientWidth) / el.scrollWidth))}px`;
  }, [ref, key]);
}

/** The players' names, longest first (for the tallest variant of a line). */
const longest = (names: readonly string[]) => [...names].sort((a, b) => b.length - a.length);

interface Slot {
  readonly cls: string;
  readonly texts: readonly ReactNode[];
}

/**
 * The tallest variant of each slot, measured off screen at the width of the measurer's parent. Returns the measurer (put
 * it inside the same column as the real lines) and the heights in px (empty until measured).
 */
function useSlotHeights(slots: readonly Slot[], key: string): [ReactNode, readonly number[]] {
  const inner = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<readonly number[]>([]);
  const measure = useCallback(() => {
    const el = inner.current;
    if (!el) return;
    const hs = Array.from(el.children).map((g) => Math.max(0, ...Array.from(g.children).map((c) => Math.ceil(c.getBoundingClientRect().height))));
    setHeights((prev) => (prev.length === hs.length && prev.every((h, i) => h === hs[i]) ? prev : hs));
  }, []);
  useLayoutEffect(measure, [measure, key]);
  useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);
  const node = (
    <div className="maf-measure" aria-hidden="true">
      <div ref={inner}>
        {slots.map((s, i) => (
          <div key={i}>
            {s.texts.map((t, j) => (
              <p key={j} className={s.cls}>
                {t}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
  return [node, heights];
}
const fixed = (h: number | undefined) => (h ? { height: `${h}px` } : undefined);

// ---- B1, N1 (and D5's first step): the pass screen ----
function PassScreen({
  progress,
  player,
  out,
  onMe,
}: {
  progress: { id: 'deal-progress' | 'night-progress'; text: string } | null;
  player: string;
  out?: boolean;
  onMe: () => void;
}) {
  const nameRef = useRef<HTMLParagraphElement>(null);
  useFitName(nameRef, player);
  return (
    <div className="maf-pass-screen">
      {progress && (
        <p className="maf-progress" data-testid={progress.id}>
          {progress.text}
        </p>
      )}
      <p className="maf-body">{P.passTo}</p>
      <p ref={nameRef} className="maf-big-name maf-caps" data-testid="pass-name">
        {player}
      </p>
      <p className="maf-body">{P.lookAway}</p>
      {out && <p className="maf-body maf-out-line">{P.outLine}</p>}
      <Main ms={NAME_GUARD_MS} guardKey={player} onClick={onMe}>
        {P.imMe(player)}
      </Main>
    </div>
  );
}

function B1({ ctx }: { ctx: RoomCtx }) {
  const t = ctx.view.turn;
  if (!t) return null;
  return <PassScreen progress={{ id: 'deal-progress', text: P.dealProgress(t.i, t.of) }} player={t.player} onMe={() => ctx.go('b2')} />;
}

// ---- B2: the role card (and D5's second step) ----
/** MAF-011, item 20: the Mafia's line 1 with this game's out and left players. */
function cardLines(ctx: RoomCtx, me: NonNullable<MafiaPlayerView['me']>): [string, string] {
  const [l1, l2] = CARD[me.role].lines;
  if (me.role !== 'mafia') return [l1, l2];
  return [partnerLine(me.partners, ctx.view.out.map((o) => o.player), ctx.view.left), l2];
}

/** Every variant of every card line, the same list for every player of this game (names: this game's longest). */
function cardSlots(players: readonly string[], m: number): Slot[] {
  const names = longest(players).slice(0, Math.max(0, m - 1));
  const partner = ['You are the only Mafia.'];
  if (names.length > 0) {
    partner.push(partnerLine(names, [], []), partnerLine(names, names, []), partnerLine(names, names.slice(1), names.slice(0, 1)));
    if (names.length > 1) partner.push(partnerLine(names, names.slice(0, 1), []));
  }
  const roles: Role[] = ['mafia', 'doctor', 'police', 'villager'];
  return [
    { cls: 'maf-card-line', texts: [...partner, ...roles.filter((r) => r !== 'mafia').map((r) => CARD[r].lines[0])] },
    { cls: 'maf-card-line', texts: roles.map((r) => CARD[r].lines[1]) },
    { cls: 'maf-card-line', texts: roles.map((r) => FIRST_TIME[r][0]) },
    { cls: 'maf-card-line', texts: roles.map((r) => FIRST_TIME[r][1]) },
    { cls: 'maf-card-line', texts: roles.map((r) => FIRST_TIME[r][2]) },
  ];
}

function RoleCard({
  ctx,
  player,
  progress,
  doneLabel,
  onDone,
  onBack,
  onSomeoneSaw,
}: {
  ctx: RoomCtx;
  player: string;
  progress: string | null;
  doneLabel: string;
  onDone: () => void;
  onBack: () => void;
  /** B2 in the deal only (MAF-014): "Someone saw my role" after the first look. */
  onSomeoneSaw?: () => void;
}) {
  const [tapMode, setTapMode] = useState(false);
  const [shown, setShown] = useState(false);
  const [held, setHeld] = useState(false);
  const [ready, setReady] = useState(false);
  const [first, setFirst] = useState(false);
  const shownAt = useRef(0);
  const pointer = useRef<number | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);
  const nameRef = useRef<HTMLParagraphElement>(null);
  useFitName(nameRef, player);

  const v = ctx.view;
  const [measure, h] = useSlotHeights(cardSlots(v.players, v.mafiaCount), `${v.players.join('|')}:${v.mafiaCount}`);

  /** Hides the block in this same event (IMP-018); a release after 500 ms, or any tap-mode hide, brings "Done, …". */
  const hide = (release: boolean) => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = null;
    pointer.current = null;
    const addDone = release && !readyRef.current && (tapMode || Date.now() - shownAt.current >= HOLD_MS);
    if (addDone) readyRef.current = true;
    flushSync(() => {
      setShown(false);
      setFirst(false);
      if (addDone) setReady(true);
    });
  };
  const hideRef = useRef(hide);
  hideRef.current = hide;
  const show = () => {
    shownAt.current = Date.now();
    flushSync(() => {
      setShown(true);
      setHeld(true);
    });
  };

  // IMP-018: scrolling, zooming or the page left: the block goes at once (the room frame handles the app hidden).
  useEffect(() => {
    if (!shown) return;
    const away = () => hideRef.current(false);
    const vv = window.visualViewport;
    window.addEventListener('scroll', away);
    window.addEventListener('pagehide', away);
    vv?.addEventListener('resize', away);
    vv?.addEventListener('scroll', away);
    return () => {
      window.removeEventListener('scroll', away);
      window.removeEventListener('pagehide', away);
      vv?.removeEventListener('resize', away);
      vv?.removeEventListener('scroll', away);
    };
  }, [shown]);
  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    [],
  );

  const me = ctx.own(player).me;
  if (!me) return null;
  const [line1, line2] = cardLines(ctx, me);
  const card = CARD[me.role];
  const extra = FIRST_TIME[me.role];

  const holdHandlers = {
    onPointerDown: (e: PointerEv<HTMLButtonElement>) => {
      if (pointer.current !== null) return;
      pointer.current = e.pointerId;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Nothing captured.
      }
      show();
    },
    onPointerUp: (e: PointerEv) => e.pointerId === pointer.current && hide(true),
    onPointerCancel: (e: PointerEv) => e.pointerId === pointer.current && hide(true),
    onPointerLeave: (e: PointerEv) => e.pointerId === pointer.current && hide(true),
  };
  const tapHandlers = {
    onClick: () => {
      if (shown) return hide(true);
      show();
      tapTimer.current = setTimeout(() => hideRef.current(true), TAP_HIDE_MS);
    },
  };

  return (
    <>
      <div className="maf-rolecard">
        <div className="maf-card-head">
          {progress && (
            <p className="maf-progress" data-testid="deal-progress">
              {progress}
            </p>
          )}
          <p ref={nameRef} className="maf-big-name maf-caps" data-testid="pass-name">
            {player}
          </p>
          <QuietButton className={tapMode ? 'maf-tap-instead maf-reserved' : 'maf-tap-instead'} onClick={() => setTapMode(true)}>
            {P.tapInstead}
          </QuietButton>
        </div>
        {shown && (
          <div className="maf-layer" onContextMenu={stop} onDragStart={stop}>
            <div className="maf-block" data-testid="private-block" draggable={false}>
              <p className="maf-card-word maf-caps" data-testid="private-word">
                {card.word}
              </p>
              <p className="maf-card-line" style={fixed(h[0])}>
                {line1}
              </p>
              <p className="maf-card-line" style={fixed(h[1])}>
                {line2}
              </p>
              <p className="maf-card-line maf-card-empty" />
              {first &&
                extra.map((l, i) => (
                  <p key={i} className="maf-card-line" style={fixed(h[2 + i])}>
                    {l}
                  </p>
                ))}
            </div>
            <QuietButton className="maf-first-time" onClick={() => setFirst(!first)}>
              {first ? P.hideThis : P.firstTime}
            </QuietButton>
          </div>
        )}
        <button
          type="button"
          className="maf-pad maf-b2-pad"
          data-tap-guard="off"
          draggable={false}
          onContextMenu={stop}
          onDragStart={stop}
          {...(tapMode ? tapHandlers : holdHandlers)}
        >
          {tapMode ? (shown ? P.tapHide : P.tapSee) : P.hold}
        </button>
        <div className="maf-b2-foot">
          {!held ? (
            <QuietButton onClick={onBack}>{P.notMe(player)}</QuietButton>
          ) : (
            onSomeoneSaw && <QuietButton onClick={onSomeoneSaw}>{P.someoneSaw}</QuietButton>
          )}
        </div>
        {measure}
        <div className="maf-sr" data-testid="private-live" aria-live="polite">
          {shown ? [card.word.toUpperCase(), line1, line2, ...(first ? extra : [])].join(' ') : ''}
        </div>
      </div>
      {ready && <Main onClick={onDone}>{doneLabel}</Main>}
    </>
  );
}

function B2({ ctx }: { ctx: RoomCtx }) {
  const t = ctx.view.turn;
  if (!t) return null;
  const next = ctx.view.players[t.i];
  return (
    <RoleCard
      ctx={ctx}
      player={t.player}
      progress={P.dealProgress(t.i, t.of)}
      doneLabel={next ? P.passOn(next) : P.allSeen}
      onBack={() => ctx.go('b1')}
      onSomeoneSaw={ctx.askDealAgain}
      onDone={() => {
        if (ctx.play({ type: 'seen', player: t.player })) ctx.go(next ? 'b1' : 'n0');
      }}
    />
  );
}

/** D5 "Whose role?" → that player's pass screen (no `deal-progress`), then their card; "Done, back to the day" (MAF-015). */
export function RoleAgain({ ctx, player, onDone }: { ctx: RoomCtx; player: string; onDone: () => void }) {
  const [step, setStep] = useState<'pass' | 'card'>('pass');
  if (step === 'pass') return <PassScreen progress={null} player={player} onMe={() => setStep('card')} />;
  return <RoleCard ctx={ctx} player={player} progress={null} doneLabel={P.backToDay} onBack={onDone} onDone={onDone} />;
}

// ---- N0 to N3: the night ----
function N0({ ctx }: { ctx: RoomCtx }) {
  const r = ctx.view.round;
  return (
    <div className="maf-pass-screen">
      <h1 className="pgn-title">{P.night(r)}</h1>
      <p className="maf-body">{P.nightLine}</p>
      <p className="maf-body">{P.faceStill}</p>
      <Main onClick={() => ctx.play({ type: 'startNight', night: r }) && ctx.go('n1')}>{P.startNight}</Main>
    </div>
  );
}

function N1({ ctx }: { ctx: RoomCtx }) {
  const t = ctx.view.turn;
  if (!t) return null;
  return (
    <PassScreen
      progress={{ id: 'night-progress', text: P.nightProgress(ctx.view.round, t.i, t.of) }}
      player={t.player}
      out={ctx.view.out.some((o) => o.player === t.player)}
      onMe={() => ctx.go('n2')}
    />
  );
}

/** Every job line and result line of tonight, for this game's longest names: the same list for every role (MAF-P7). */
function nightSlots(players: readonly string[], m: number): Slot[] {
  const names = longest(players);
  const a = names[0] ?? '';
  const see = names.slice(0, Math.min(3, Math.max(0, m - 1)));
  const [pre, mid, post] = JOB.mafiaLater(a, a);
  return [
    {
      cls: 'maf-n2-line',
      texts: [
        JOB.mafiaFirst(see),
        JOB.mafiaFirst([]),
        <>
          {pre}
          <Caps>{mid}</Caps>
          {post}
        </>,
        JOB.doctor,
        JOB.police,
        JOB.policeNone,
        JOB.villager,
        JOB.ghost,
      ],
    },
    {
      cls: 'maf-n2-line',
      texts: [
        RESULT.mafiaFirst(a, see),
        RESULT.mafiaFirst(a, []),
        RESULT.mafiaAgree(a),
        RESULT.mafiaDiffer(a),
        RESULT.doctor(a),
        RESULT.doctorSelf,
        RESULT.police(a, true),
        RESULT.police(a, false),
        RESULT.villager(a),
        RESULT.ghost(a),
      ],
    },
  ];
}

function N2({ ctx }: { ctx: RoomCtx }) {
  const t = ctx.view.turn;
  const [shown, setShown] = useState(false);
  const [firstAt, setFirstAt] = useState<number | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [, tick] = useState(0);
  const nameRef = useRef<HTMLParagraphElement>(null);
  useFitName(nameRef, t?.player);
  const v = ctx.view;
  const [measure, h] = useSlotHeights(nightSlots(v.players, v.mafiaCount), `${v.players.join('|')}:${v.mafiaCount}`);

  // The night job guard (Terms): 4000 ms from the first "Tap to see", counting while hidden.
  useEffect(() => {
    if (firstAt === null) return;
    const left = firstAt + NIGHT_GUARD_MS - Date.now();
    if (left <= 0) return;
    const id = setTimeout(() => tick((n) => n + 1), left);
    return () => clearTimeout(id);
  }, [firstAt]);
  // MAF-022: 60 s with no touch anywhere hides the job (the pick is kept).
  useEffect(() => {
    if (!shown) return;
    let timer = setTimeout(() => setShown(false), IDLE_HIDE_MS);
    const touched = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setShown(false), IDLE_HIDE_MS);
    };
    const away = () => setShown(false);
    const vv = window.visualViewport;
    document.addEventListener('pointerdown', touched, true);
    window.addEventListener('pagehide', away);
    vv?.addEventListener('resize', away);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', touched, true);
      window.removeEventListener('pagehide', away);
      vv?.removeEventListener('resize', away);
    };
  }, [shown]);

  if (!t) return null;
  const player = t.player;
  const own = ctx.own(player);
  const job = own.job;
  if (!job) return null;
  const none = !job.names.some((n) => n.allowed);
  const police = job.kind === 'police';
  const move = { type: 'nightPick' as const, player, target: none ? null : pick };
  const ready = firstAt !== null && Date.now() - firstAt >= NIGHT_GUARD_MS && (pick !== null || none);
  const after = ready ? ctx.peek(move) : null;

  let jobLine: ReactNode;
  let jobText = '';
  switch (job.kind) {
    case 'mafia':
      if (job.latest) {
        const [pre, mid, post] = JOB.mafiaLater(job.latest.by, job.latest.target);
        jobText = `${pre}${mid.toUpperCase()}${post}`;
        jobLine = (
          <>
            {pre}
            <Caps>{mid}</Caps>
            {post}
          </>
        );
      } else jobLine = JOB.mafiaFirst(job.see);
      break;
    case 'doctor':
      jobLine = JOB.doctor;
      break;
    case 'police':
      jobLine = none ? JOB.policeNone : JOB.police;
      break;
    case 'villager':
      jobLine = JOB.villager;
      break;
    default:
      jobLine = JOB.ghost;
  }

  let result = '';
  if (pick !== null) {
    switch (job.kind) {
      case 'mafia':
        result = job.latest ? (pick === job.latest.target ? RESULT.mafiaAgree(pick) : RESULT.mafiaDiffer(pick)) : RESULT.mafiaFirst(pick, job.see);
        break;
      case 'doctor':
        result = pick === player ? RESULT.doctorSelf : RESULT.doctor(pick);
        break;
      case 'police': {
        const check = ctx.peekOwn({ type: 'nightPick', player, target: pick }, player)?.checks.find((c) => c.player === pick);
        result = RESULT.police(pick, check?.mafia === true);
        break;
      }
      case 'villager':
        result = RESULT.villager(pick);
        break;
      default:
        result = RESULT.ghost(pick);
    }
  }

  const done = () => {
    if (!ctx.play(move)) return;
    ctx.go(after?.step === 'night' ? 'n1' : 'n3');
  };
  const doneLabel = after?.step === 'night' && after.turn ? P.passOn(after.turn.player) : P.nightOver;

  return (
    <>
      <div className={shown ? 'maf-job maf-job-shown' : 'maf-job'}>
        <p className="maf-n2-progress" data-testid="night-progress">
          {P.night(v.round)}
        </p>
        <p ref={nameRef} className="maf-n2-name maf-caps" data-testid="pass-name">
          {player}
        </p>
        <button
          type="button"
          className={shown ? 'maf-pad maf-n2-pad maf-pad-small' : 'maf-pad maf-n2-pad'}
          data-tap-guard="off"
          onClick={() => {
            setShown(!shown);
            if (firstAt === null) setFirstAt(Date.now());
          }}
        >
          {shown ? P.tapHide : P.seeJob}
        </button>
        {firstAt === null && (
          <QuietButton className="maf-n2-back" onClick={() => ctx.go('n1')}>
            {P.notMe(player)}
          </QuietButton>
        )}
        {shown && (
          <>
            <p className="maf-n2-line maf-n2-job" data-testid="job-line" style={fixed(h[0])}>
              {jobLine}
            </p>
            <div className="maf-n2-names" data-testid="night-names">
              {job.names.map((n) => {
                // MAF-025: the Police's first name tapped is the check; every other name greys out.
                const can = n.allowed && !(police && pick !== null && n.player !== pick);
                const tag = !n.allowed
                  ? n.tags.join(' · ')
                  : job.kind === 'doctor' && n.player === player
                    ? P.doctorSelf
                    : job.latest && n.player === job.latest.target
                      ? P.theirPick(job.latest.by)
                      : '';
                return (
                  <button
                    key={n.player}
                    type="button"
                    className={pick === n.player ? 'maf-nb maf-nb-on' : 'maf-nb'}
                    aria-pressed={pick === n.player}
                    aria-label={can ? n.player : P.cantPick(n.player)}
                    disabled={!can}
                    onClick={() => setPick(n.player)}
                  >
                    <span className="maf-nb-name">
                      {pick === n.player && <span aria-hidden="true">✓ </span>}
                      {n.player}
                    </span>
                    {tag && <span className="maf-nb-tag">{tag}</span>}
                  </button>
                );
              })}
            </div>
            <p className="maf-n2-line maf-n2-result" data-testid="result-line" style={fixed(h[1])}>
              {result}
            </p>
          </>
        )}
        {measure}
        <div className="maf-sr" data-testid="private-live" aria-live="polite">
          {shown ? [typeof jobLine === 'string' ? jobLine : jobText, result].filter(Boolean).join(' ') : ''}
        </div>
      </div>
      {shown && ready && <Main onClick={done}>{doneLabel}</Main>}
    </>
  );
}

function N3({ ctx }: { ctx: RoomCtx }) {
  return (
    <div className="maf-pass-screen">
      <h1 className="pgn-title">{P.overTitle}</h1>
      <p className="maf-body">{P.overLine}</p>
      <Main onClick={ctx.readMorning}>{P.readMorning}</Main>
    </div>
  );
}

/** The private-lane screens, for the room frame's SCREENS. */
export const PRIVATE_SCREENS = { b1: B1, b2: B2, n0: N0, n1: N1, n2: N2, n3: N3 } as const;
