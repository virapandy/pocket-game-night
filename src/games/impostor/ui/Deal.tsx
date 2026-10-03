// The deal (IMP-010 to IMP-018, IMP-083, IMP-086, IMP-090): one player's turn. Screen A "Pass the phone to", screen
// B with the hold pad, and the private block, which is in the page only while held (or tapped open).
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as PointerEv, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { ImpostorWord } from '../rules';
import { buzz } from './device';
import { Caps, MainButton, QuietButton } from './parts';

/** What one player may see: the round's word for the crew; for the impostor only what their mode allows. */
export type Secret = { readonly role: 'crew' | 'impostor'; readonly word: ImpostorWord; readonly mode: 'easy' | 'hard' };

/** IMP-011: always five lines, in this order, for every role and mode. */
export function blockLines(s: Secret): [string, string, string, string, string] {
  const other = s.word.other_names ? `Also called ${s.word.other_names}` : '';
  if (s.role === 'crew') {
    return s.mode === 'easy'
      ? ['Your secret', s.word.word, `Category: ${s.word.category}`, "Give one-word clues. Don't say it!", other]
      : ['Your secret', s.word.word, 'Give one-word clues.', "Don't say it!", other];
  }
  return s.mode === 'easy'
    ? ['Your secret', "You're the impostor", `Category: ${s.word.category} · Hint: ${s.word.hint}`, 'Listen, blend in, guess the word.', '']
    : ['Your secret', "You're the impostor", 'Listen and blend in.', 'Guess the word if caught.', ''];
}

/** IMP-073: a room name at its full size, shrunk only when it would not fit on one line, to the floor (then it wraps). */
export function useFitText(ref: RefObject<HTMLElement | null>, full: number, floor: number, key: unknown) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only names that do not fit get a size of their own, so equal screens stay equal in the page (IMP-012).
    if (el.scrollWidth <= el.clientWidth + 0.5) return;
    const size = Math.max(floor, Math.floor((full * el.clientWidth) / el.scrollWidth));
    el.style.fontSize = `${size}px`;
    if (size === floor) el.style.whiteSpace = 'normal';
  }, [ref, full, floor, key]);
}

const HOLD_MS = 500;
const TAP_HIDE_MS = 8_000;

const stop = (e: { preventDefault: () => void }) => e.preventDefault();

/** One player's turn: screen A, then screen B. Remounted for every turn, so nothing carries over (IMP-010). */
export function Turn({
  name,
  next,
  secret,
  banner,
  tapPref,
  seeAgain,
  onDone,
  onDontKnow,
}: {
  name: string;
  /** The next player's name, or null for the last player ("Done, everyone's seen"). */
  next: string | null;
  secret: Secret;
  /** Above screen A: "Welcome back." (IMP-090), or the "No problem!" room screen (IMP-015). */
  banner: 'welcome' | 'noProblem' | null;
  /** The Settings switch "Tap to show instead of hold" (IMP-014), read when screen B opens. */
  tapPref: () => boolean;
  /** "See my word again" (IMP-017): no "Don't know this word?". */
  seeAgain?: boolean;
  onDone: () => void;
  onDontKnow?: () => void;
}) {
  const [screen, setScreen] = useState<'A' | 'B'>('A');
  if (screen === 'A') return <ScreenA name={name} banner={banner} onMe={() => setScreen('B')} />;
  return (
    <ScreenB
      name={name}
      next={next}
      secret={secret}
      tap={tapPref()}
      seeAgain={!!seeAgain}
      onDone={onDone}
      {...(onDontKnow ? { onDontKnow } : {})}
    />
  );
}

function ScreenA({ name, banner, onMe }: { name: string; banner: 'welcome' | 'noProblem' | null; onMe: () => void }) {
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
            <p className="imp-pass">Pass the phone to</p>
            <p ref={nameRef} className="imp-pass-name imp-caps" data-testid="pass-name">
              {name}
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
  secret,
  tap: tapSetting,
  seeAgain,
  onDone,
  onDontKnow,
}: {
  name: string;
  next: string | null;
  secret: Secret;
  tap: boolean;
  seeAgain: boolean;
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

  const lines = blockLines(secret);
  const long = secret.role === 'crew' && secret.word.word.length > 20;
  const padText = tapMode ? (shown ? 'Tap to hide' : 'Tap to see your word') : 'Hold here to see your word';

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

  return (
    <>
      <h1 className="imp-turn-name imp-caps">{name}</h1>
      <section className="imp-hold">
        <div className="imp-block-area">
          {shown && (
            <div
              className={`imp-block${long ? ' imp-block-long' : ''}`}
              data-testid="private-block"
              draggable={false}
              onContextMenu={stop}
              onDragStart={stop}
            >
              <p className="imp-small" draggable={false}>
                {lines[0]}
              </p>
              <p className="imp-private-word" data-testid="private-word" draggable={false}>
                {lines[1]}
              </p>
              <p className="imp-body" draggable={false}>
                {lines[2]}
              </p>
              <p className="imp-body" draggable={false}>
                {lines[3]}
              </p>
              <p className="imp-small imp-line5" draggable={false}>
                {lines[4]}
              </p>
            </div>
          )}
        </div>
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
          {!tapMode && <QuietButton onClick={() => setTapMode(true)}>Tap instead</QuietButton>}
          {ready && !seeAgain && onDontKnow && <QuietButton onClick={onDontKnow}>Don't know this word?</QuietButton>}
        </div>
      </section>
      {/* IMP-083: the block in a live region on the player's own turn only, emptied when it hides. */}
      <div className="imp-sr" data-testid="private-live" aria-live="assertive">
        {shown ? lines.filter(Boolean).join(' ') : ''}
      </div>
      {ready && <MainButton onClick={onDone}>{next === null || seeAgain ? "Done, everyone's seen" : `Done, pass to ${next}`}</MainButton>}
    </>
  );
}
