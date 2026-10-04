// The deal (IMP-010 to IMP-018, IMP-083, IMP-086, IMP-090): one player's turn. Screen A "Pass the phone to", screen
// B with the hold pad, and the private block, which is in the page only while held (or tapped open).
import { useContext, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as PointerEv, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { ImpostorWord } from '../rules';
import { buzz } from './device';
import { Caps, Dialog, HideMainButton, MainButton, QuietButton } from './parts';

/**
 * What one player may see: the round's word for the crew; for the impostor only what their mode allows. `lastGuess`
 * is the choice "Last guess for a caught impostor" (IMP-076), which changes only the impostor's fourth line.
 */
export type Secret = {
  readonly role: 'crew' | 'impostor';
  readonly word: ImpostorWord;
  readonly mode: 'easy' | 'hard';
  readonly lastGuess: boolean;
};

/** IMP-011: always five lines, in this order, for every role and mode. */
export function blockLines(s: Secret): [string, string, string, string, string] {
  const other = s.word.other_names ? `Also called ${s.word.other_names}` : '';
  if (s.role === 'crew') {
    return s.mode === 'easy'
      ? ['Your secret', s.word.word, `Category: ${s.word.category}`, "Give one-word clues. Don't say it!", other]
      : ['Your secret', s.word.word, 'Give one-word clues.', "Don't say it!", other];
  }
  return s.mode === 'easy'
    ? [
        'Your secret',
        "You're the impostor",
        `Category: ${s.word.category} · Hint: ${s.word.hint}`,
        s.lastGuess ? 'Listen, blend in, guess the word.' : "Listen and blend in. Don't get caught!",
        '',
      ]
    : ['Your secret', "You're the impostor", 'Listen and blend in.', s.lastGuess ? 'Guess the word if caught.' : "Don't get caught!", ''];
}

/**
 * IMP-073: a room name at its full size, shrunk only when it would not fit on one line, to the floor (then it wraps).
 * With `wrap` false (screen B's name, which never wraps) a name still too wide at the floor shrinks just enough to fit.
 */
export function useFitText(ref: RefObject<HTMLElement | null>, full: number, floor: number, key: unknown, wrap = true) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only names that do not fit get a size of their own, so equal screens stay equal in the page (IMP-012).
    if (el.scrollWidth <= el.clientWidth + 0.5) return;
    const now = Math.min(full, parseFloat(getComputedStyle(el).fontSize) || full);
    const size = Math.max(floor, Math.floor((now * el.clientWidth) / el.scrollWidth));
    el.style.fontSize = `${size}px`;
    if (size !== floor) return;
    if (wrap) el.style.whiteSpace = 'normal';
    else if (el.scrollWidth > el.clientWidth + 0.5) el.style.fontSize = `${Math.floor((size * el.clientWidth) / el.scrollWidth)}px`;
  }, [ref, full, floor, key, wrap]);
}

const HOLD_MS = 500;
const TAP_HIDE_MS = 8_000;

const stop = (e: { preventDefault: () => void }) => e.preventDefault();

/** One player's turn: screen A, then screen B. Remounted for every turn, so nothing carries over (IMP-010). */
export function Turn({
  name,
  next,
  progress,
  secret,
  banner,
  tapPref,
  seeAgain,
  onDone,
  onDontKnow,
  onHoldScreen,
}: {
  name: string;
  /** The next player's name, or null for the last player ("Done, everyone's seen"). */
  next: string | null;
  /** IMP-019: "Player N of M" on screens A and B; null during "See my word again" (IMP-017). */
  progress: Progress | null;
  secret: Secret;
  /** Above screen A: "Welcome back." (IMP-090), or the "No problem!" room screen (IMP-015). */
  banner: 'welcome' | 'noProblem' | null;
  /** The Settings switch "Tap to show instead of hold" (IMP-014), read when screen B opens. */
  tapPref: () => boolean;
  /** "See my word again" (IMP-017), opened from this screen: "Done, back to clues"; no "Don't know this word?". */
  seeAgain?: SeeAgainFrom;
  onDone: () => void;
  onDontKnow?: () => void;
  /** Told when screen B shows and when it goes (the screen marks itself `imp-hold-screen`, IMP-010 landscape). */
  onHoldScreen?: (shown: boolean) => void;
}) {
  const [screen, setScreen] = useState<'A' | 'B'>('A');
  useLayoutEffect(() => {
    if (screen !== 'B' || !onHoldScreen) return;
    onHoldScreen(true);
    return () => onHoldScreen(false);
  }, [screen, onHoldScreen]);
  if (screen === 'A') return <ScreenA name={name} progress={progress} banner={banner} onMe={() => setScreen('B')} />;
  return (
    <ScreenB
      name={name}
      next={next}
      progress={progress}
      secret={secret}
      tap={tapPref()}
      seeAgain={seeAgain ?? null}
      onDone={onDone}
      {...(onDontKnow ? { onDontKnow } : {})}
    />
  );
}

/** IMP-017: where "See my word again" was opened: its "Done, back to …" button returns there. */
export type SeeAgainFrom = 'clues' | 'talking' | 'the vote';

/** IMP-019: the current player's place in this round's seat order, from 1. */
export type Progress = { readonly n: number; readonly of: number };

/** IMP-019: "Player 2 of 4", 17 px (21 px with Larger text), centred; never announced (IMP-083). */
function DealProgress({ progress }: { progress: Progress | null }) {
  if (!progress) return null;
  return (
    <p className="imp-deal-progress" data-testid="deal-progress">
      Player {progress.n} of {progress.of}
    </p>
  );
}

function ScreenA({
  name,
  progress,
  banner,
  onMe,
}: {
  name: string;
  progress: Progress | null;
  banner: 'welcome' | 'noProblem' | null;
  onMe: () => void;
}) {
  const nameRef = useRef<HTMLParagraphElement>(null);
  useFitText(nameRef, 48, 32, name);
  return (
    <>
      <section className="imp-stage imp-center">
        {banner === 'noProblem' ? (
          <>
            <h1 className="imp-room-title">No problem! New word coming.</h1>
            <p className="imp-pass">
              Pass the phone back to <Caps>{name}</Caps>
            </p>
          </>
        ) : (
          <>
            {banner === 'welcome' && <p className="imp-welcome">Welcome back.</p>}
            <DealProgress progress={progress} />
            <p className="imp-pass">Pass the phone to</p>
            <p ref={nameRef} className="imp-pass-name imp-caps" data-testid="pass-name">
              {name}
            </p>
            <p className="imp-look-away" data-testid="look-away">
              Everyone else, look away!
            </p>
          </>
        )}
      </section>
      <MainButton onClick={onMe}>I'm {name}</MainButton>
    </>
  );
}

function ScreenB({
  name,
  next,
  progress,
  secret,
  tap: tapSetting,
  seeAgain,
  onDone,
  onDontKnow,
}: {
  name: string;
  next: string | null;
  progress: Progress | null;
  secret: Secret;
  tap: boolean;
  seeAgain: SeeAgainFrom | null;
  onDone: () => void;
  onDontKnow?: () => void;
}) {
  const [tapMode, setTapMode] = useState(tapSetting);
  const [shown, setShown] = useState(false);
  const [ready, setReady] = useState(false);
  const shownAt = useRef(0);
  const pointer = useRef<number | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);

  /** Hides the block in this same event (IMP-018). A release after 500 ms, or any tap-mode hide, adds "Done…". */
  const hide = (release: boolean) => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = null;
    pointer.current = null;
    const addDone = release && !readyRef.current && (tapMode || Date.now() - shownAt.current >= HOLD_MS);
    if (addDone) readyRef.current = true;
    flushSync(() => {
      setShown(false);
      if (addDone) setReady(true);
    });
  };
  const hideRef = useRef(hide);
  hideRef.current = hide;

  const show = () => {
    shownAt.current = Date.now();
    flushSync(() => setShown(true));
  };

  // IMP-018: scrolling, zooming, the page hidden or left: the block goes at once.
  useEffect(() => {
    if (!shown) return;
    const away = () => hideRef.current(false);
    const onVisibility = () => document.visibilityState === 'hidden' && away();
    const vv = window.visualViewport;
    window.addEventListener('scroll', away);
    window.addEventListener('pagehide', away);
    document.addEventListener('visibilitychange', onVisibility);
    vv?.addEventListener('resize', away);
    vv?.addEventListener('scroll', away);
    return () => {
      window.removeEventListener('scroll', away);
      window.removeEventListener('pagehide', away);
      document.removeEventListener('visibilitychange', onVisibility);
      vv?.removeEventListener('resize', away);
      vv?.removeEventListener('scroll', away);
    };
  }, [shown]);
  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
  }, []);

  // IMP-073: screen B's name is 48 px, shrunk to one line (floor 32 px; 20 px on 320 × 568 and 360 × 640), never wrapping.
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [nameFloor] = useState(() => (window.innerHeight <= 640 && window.innerHeight > window.innerWidth ? 20 : 32));
  useFitText(nameRef, 48, nameFloor, name, false);

  // IMP-010: when the block would be taller than its layer, lines 3 to 5 shrink to 15 px, then the word to 30 px.
  const layerRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0);
  useLayoutEffect(() => {
    if (!shown || fit >= 2) return;
    const layer = layerRef.current;
    const block = blockRef.current;
    if (layer && block && block.getBoundingClientRect().bottom > layer.getBoundingClientRect().bottom + 0.5) setFit(fit + 1);
  }, [shown, fit]);

  const lines = blockLines(secret);
  const long = secret.role === 'crew' && secret.word.word.length > 20;
  const padText = tapMode ? (shown ? 'Tap to hide' : 'Tap to see your word') : shown ? 'Let go to hide' : 'Hold here to see your word';
  const canDontKnow = ready && !seeAgain && !!onDontKnow;

  // IMP-015, F3: "Don't know this word?" asks first; "Back" (or the browser's or phone's Back) records nothing.
  const [asking, setAsking] = useState(false);
  const hideMain = useContext(HideMainButton) || asking;
  useEffect(() => {
    if (!asking) return;
    const back = () => setAsking(false);
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [asking]);

  const holdHandlers = {
    onPointerDown: (e: PointerEv<HTMLButtonElement>) => {
      if (pointer.current !== null) return; // only the first finger counts
      pointer.current = e.pointerId;
      // Touch pointers are captured by the pad; let go of it, so sliding off counts as letting go (IMP-086).
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Nothing captured.
      }
      buzz();
      show();
    },
    onPointerUp: (e: PointerEv) => e.pointerId === pointer.current && hide(true),
    onPointerCancel: (e: PointerEv) => e.pointerId === pointer.current && hide(true),
    onPointerLeave: (e: PointerEv) => e.pointerId === pointer.current && hide(true),
  };
  const tapHandlers = {
    onPointerDown: () => {
      if (!shown) buzz();
    },
    onClick: () => {
      if (shown) {
        hide(true);
        return;
      }
      show();
      tapTimer.current = setTimeout(() => hideRef.current(true), TAP_HIDE_MS);
    },
  };

  const blockClass = ['imp-block', long ? 'imp-block-long' : '', fit >= 1 ? 'imp-block-tight' : '', fit >= 2 ? 'imp-block-tighter' : '']
    .filter(Boolean)
    .join(' ');

  // Guideline 45a: everything on screen B has its place from the start, so nothing moves after the first hold.
  // The pad and "Tap instead" sit at fixed places above the main button's reserved space; "Don't know this word?"
  // and the main button keep their space, hidden, until the first hold.
  return (
    <>
      <div className="imp-turn-b">
        <DealProgress progress={progress} />
        <h1 ref={nameRef} className="imp-turn-name imp-caps" data-testid="pass-name">
          {name}
        </h1>
        <button
          type="button"
          className={canDontKnow ? 'imp-deal-text' : 'imp-deal-text imp-reserved'}
          onClick={canDontKnow ? () => setAsking(true) : undefined}
        >
          Don't know this word?
        </button>
      </div>
      {shown && (
        // IMP-010: an opaque layer over the top of screen B (over the whole top bar and the left half in landscape).
        <div className="imp-layer" ref={layerRef} onContextMenu={stop} onDragStart={stop}>
          <div ref={blockRef} className={blockClass} data-testid="private-block" draggable={false} onContextMenu={stop} onDragStart={stop}>
            <p className="imp-block-small" draggable={false}>
              {lines[0]}
            </p>
            <p className="imp-private-word" data-testid="private-word" draggable={false}>
              {lines[1]}
            </p>
            <p className="imp-block-body" draggable={false}>
              {lines[2]}
            </p>
            <p className="imp-block-body" draggable={false}>
              {lines[3]}
            </p>
            <p className="imp-block-small imp-line5" draggable={false}>
              {lines[4]}
            </p>
          </div>
        </div>
      )}
      <div className="imp-pad-area">
        <button
          type="button"
          className="imp-pad"
          data-testid="hold-pad"
          draggable={false}
          onContextMenu={stop}
          onDragStart={stop}
          {...(tapMode ? tapHandlers : holdHandlers)}
        >
          {padText}
        </button>
        {/* IMP-014: in tap mode "Tap instead" is not shown; its space stays, so the pad never moves. */}
        <button type="button" className={tapMode ? 'imp-quiet imp-reserved' : 'imp-quiet'} onClick={() => setTapMode(true)}>
          Tap instead
        </button>
      </div>
      {/* IMP-083: the block in a live region on the player's own turn only, emptied when it hides. */}
      <div className="imp-sr" data-testid="private-live" aria-live="assertive">
        {shown ? lines.filter(Boolean).join(' ') : ''}
      </div>
      <HideMainButton.Provider value={hideMain}>
        {ready && <MainButton onClick={onDone}>{seeAgain ? `Done, back to ${seeAgain}` : next === null ? "Done, everyone's seen" : `Done, pass to ${next}`}</MainButton>}
      </HideMainButton.Provider>
      {asking && onDontKnow && (
        <Dialog text="New word for everyone?">
          <QuietButton
            onClick={() => {
              setAsking(false);
              onDontKnow();
            }}
          >
            New word
          </QuietButton>
          <MainButton inline onClick={() => setAsking(false)}>
            Back
          </MainButton>
        </Dialog>
      )}
    </>
  );
}
