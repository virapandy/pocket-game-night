// The map phone (SWD-034 to 036, 038, 039, 116, 117, 120, 121; screens M1 to M3): a clue giver's own phone showing the map
// a host's code gives. Privacy first (SWD-025, 031, 032, 121): the grid, the lists and every word's kind are in the page
// only while the map shows. They leave it in the same task as the app being hidden (with `privacy-cover`), on "Hide
// map", when the screen is left, and 60 000 ms after the last touch ("Still looking?" from 50 000 ms). The screen-on lock
// is held only while the map shows.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { Preferences } from '../../../engine';
import { BlocksRoot, Dialog, MainButton, QuietButton, Toast, useToast } from '../../../blocks';
import { boardFromCode, nextMapCode, WORDS } from '../rules';
import type { Board, Kind, Team } from '../rules';
import { knownPair, readSavedMap, writeSavedMap, SAVED_MAP_FORMAT, type SavedMap } from './mapSaved';
import './map-phone.css';

/** What opened the map: the code (no hyphen) and what the QR carried (SWD-117). */
export interface MapPhoneOpen {
  readonly code: string;
  readonly t?: string;
  readonly p?: string;
}

const WARN_MS = 50_000;
const HIDE_MS = 60_000;
const TAP_MS = 500;

const TEXT = {
  heading: 'Secret Words map',
  small: "Tap a word when it's found to fade it (optional). The host's board is what counts.",
  mismatch: "Doesn't match? Scan the host's code again.",
  end: 'Game over: tap Done with this game. New board on the host: tap Next map.',
  warning: 'Still looking? Tap to keep the map',
  sideways: 'Turn your phone sideways to see the board.',
  replaced: 'New map opened. The old one is gone.',
  noMore: "No more maps from this code. Scan the host's new code.",
  remove: 'Remove this map from your phone?',
  next: 'Next map? Only after the host starts the next game.',
} as const;

const shown = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;
const KIND_NAME: Record<Kind, string> = { orange: 'orange team', teal: 'teal team', nobody: 'blank word', landmine: 'the Landmine' };

type View = 'grid' | Team;
type Mode = 'portrait' | 'narrow' | 'land' | 'land-s';

function modeNow(): Mode {
  if (typeof window === 'undefined') return 'portrait';
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w > h) return h <= 340 || w < 700 ? 'land-s' : 'land';
  return w < 360 ? 'narrow' : 'portrait';
}

function useMode(): Mode {
  const [mode, setMode] = useState(modeNow);
  useEffect(() => {
    const on = () => setMode(modeNow());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return mode;
}

/** Kind icons (Terms "Team icon"): circle, diamond, dash, landmine; SVG, 16 × 16, `aria-hidden`. */
export function KindIcon({ kind }: { kind: Kind }) {
  return (
    <svg className={`swm-icon swm-icon-${kind}`} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {kind === 'orange' && <circle cx="8" cy="8" r="6.5" />}
      {kind === 'teal' && <path d="M8 1.2 14.8 8 8 14.8 1.2 8Z" />}
      {kind === 'nobody' && <rect x="2" y="6.5" width="12" height="3" rx="1.5" />}
      {kind === 'landmine' && (
        <>
          <circle cx="8" cy="9" r="5" />
          <rect x="7" y="1" width="2" height="4" rx="1" />
          <rect x="1" y="8" width="2.5" height="2" rx="1" />
          <rect x="12.5" y="8" width="2.5" height="2" rx="1" />
        </>
      )}
    </svg>
  );
}

/** SWD-090: one font size for the board (22 down to 12 px); a word that doesn't fit at 12 px shrinks alone to 10 px. */
function fitWords(words: readonly string[], cellWidth: number, family: string): { size: number; own: Record<number, number> } {
  const ctx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  const room = cellWidth - 8;
  if (!ctx || room <= 0) return { size: 16, own: {} };
  const width = (w: string, s: number) => {
    ctx.font = `600 ${s}px ${family}`;
    return ctx.measureText(w).width;
  };
  let size = 12;
  for (let s = 22; s >= 12; s--) {
    if (words.every((w) => width(w, s) <= room)) {
      size = s;
      break;
    }
  }
  const own: Record<number, number> = {};
  words.forEach((w, i) => {
    if (width(w, size) <= room) return;
    let s = size;
    while (s > 10 && width(w, s) > room) s -= 0.5;
    own[i] = s;
  });
  return { size, own };
}

/** The screen-on lock while `on` (SWD-034): asked for when it turns on, let go when it turns off. */
function useScreenOn(on: boolean) {
  useEffect(() => {
    if (!on) return;
    let live = true;
    let lock: { release: () => Promise<void> } | null = null;
    try {
      const api = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
      if (api && typeof api.request === 'function') {
        api
          .request('screen')
          .then((l) => {
            if (live) lock = l;
            else void l.release().catch(() => {});
          })
          .catch(() => {});
      }
    } catch {
      // Not allowed here: nothing to do.
    }
    return () => {
      live = false;
      if (lock) void lock.release().catch(() => {});
      lock = null;
    };
  }, [on]);
}

/** Opening (SWD-036): the same code keeps its found marks; a different one replaces the old map (with a toast). */
function opening(keys: Preferences, map: MapPhoneOpen): { saved: SavedMap; replaced: boolean } {
  const old = readSavedMap(keys);
  const t = knownPair(map.t) ? map.t : undefined;
  const p = map.p === 'own' ? ('own' as const) : undefined;
  const same = old?.code === map.code;
  const base = { v: SAVED_MAP_FORMAT, code: map.code, ...(t ? { t } : {}), ...(p ? { p } : {}) };
  if (old && same) {
    return { saved: { ...base, savedAt: old.savedAt, found: old.found, ...(p && old.team ? { team: old.team } : {}) }, replaced: false };
  }
  return { saved: { ...base, savedAt: Date.now(), found: [] }, replaced: old !== null };
}

export function MapPhone({
  map,
  onHome,
  keys,
  prefs,
  onClueRules,
  startHidden = false,
}: {
  map: MapPhoneOpen;
  onHome: () => void;
  /** The app's `pgn.*` keys (the saved map). */
  keys: Preferences;
  /** The app's preferences (Larger text). */
  prefs: Preferences;
  /** "Clue rules" (SWD-011): How to play, then back here with the map hidden. */
  onClueRules?: () => void;
  /** Back from How to play: the map opens hidden ("Show map"). */
  startHidden?: boolean;
}) {
  const [first] = useState(() => opening(keys, map));
  const [saved, setSaved] = useState<SavedMap>(first.saved);
  const [mapShown, setMapShown] = useState(!startHidden && !(typeof document !== 'undefined' && document.visibilityState === 'hidden'));
  const [covered, setCovered] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden');
  const [view, setView] = useState<View>('grid');
  const [warning, setWarning] = useState(false);
  const [clock, setClock] = useState(0);
  const [asking, setAsking] = useState<null | 'remove' | 'next'>(null);
  const [choosing, setChoosing] = useState(false);
  const [toast, showToast, clearToast] = useToast();
  const larger = prefs.get<boolean>('largerText', false) === true;
  const mode = useMode();

  const shownRef = useRef(mapShown);
  shownRef.current = mapShown;
  const warningRef = useRef(false);
  const swallow = useRef(false);
  const lastCellTap = useRef(-Infinity);
  const guardUntil = useRef(-Infinity);

  const board = boardFromCode(saved.code, WORDS);
  const pair = knownPair(saved.t);
  const names = { orange: pair?.orange ?? 'Orange team', teal: pair?.teal ?? 'Teal team' };

  const save = useCallback(
    (next: SavedMap) => {
      setSaved(next);
      writeSavedMap(keys, next);
    },
    [keys],
  );

  // SWD-036: what was opened is the phone's one saved map.
  useEffect(() => {
    writeSavedMap(keys, first.saved);
    if (first.replaced) showToast(TEXT.replaced);
  }, [first, keys, showToast]);

  /** SWD-121: the clock starts again (a show, Next map, any touch). */
  const restart = useCallback(() => {
    warningRef.current = false;
    setWarning(false);
    setClock((c) => c + 1);
  }, []);
  const hide = useCallback(() => {
    warningRef.current = false;
    setWarning(false);
    setMapShown(false);
    setView('grid');
  }, []);

  // SWD-121: "Still looking?" at 50 000 ms; the map leaves the page at 60 000 ms.
  useEffect(() => {
    if (!mapShown) return;
    const warn = setTimeout(() => {
      warningRef.current = true;
      setWarning(true);
    }, WARN_MS);
    const gone = setTimeout(hide, HIDE_MS);
    return () => {
      clearTimeout(warn);
      clearTimeout(gone);
    };
  }, [mapShown, clock, hide]);

  // SWD-121: each touch restarts the clock; while the warning shows, the first touch only does that.
  useEffect(() => {
    const down = () => {
      swallow.current = warningRef.current;
      if (shownRef.current) restart();
    };
    const click = (e: MouseEvent) => {
      if (!swallow.current) return;
      swallow.current = false;
      e.stopPropagation();
      e.preventDefault();
    };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('click', click, true);
    };
  }, [restart]);

  // SWD-032: hidden → the cover, and the map gone, in the same task; back → the map phone with the map hidden.
  useEffect(() => {
    const on = () => {
      const hidden = document.visibilityState === 'hidden';
      flushSync(() => {
        setCovered(hidden);
        if (hidden) hide();
      });
    };
    document.addEventListener('visibilitychange', on);
    window.addEventListener('pagehide', on);
    return () => {
      document.removeEventListener('visibilitychange', on);
      window.removeEventListener('pagehide', on);
    };
  }, [hide]);

  useScreenOn(mapShown && !covered);

  if ('error' in board) {
    return (
      <BlocksRoot className="sw-map" larger={larger}>
        <div className="swm-page">
          <div className="swm-top">
            <QuietButton onClick={onHome}>← Back</QuietButton>
          </div>
          <h1 className="swm-heading">{TEXT.heading}</h1>
          <p className="swm-small">{TEXT.mismatch}</p>
        </div>
      </BlocksRoot>
    );
  }

  const show = () => {
    setMapShown(true);
    setView('grid');
    restart();
  };
  const tapCell = (i: number) => {
    const now = Date.now();
    if (now - lastCellTap.current < TAP_MS) return;
    lastCellTap.current = now;
    const found = saved.found.includes(i) ? saved.found.filter((x) => x !== i) : [...saved.found, i].sort((a, b) => a - b);
    save({ ...saved, found });
  };
  const nextMap = () => {
    setAsking(null);
    guardUntil.current = Date.now() + TAP_MS;
    const next = nextMapCode(saved.code, WORDS);
    const nb = next ? boardFromCode(next, WORDS) : null;
    if (!next || !nb || 'error' in nb) {
      showToast(TEXT.noMore);
      return;
    }
    save({ ...saved, code: next, savedAt: Date.now(), found: [] });
    setMapShown(true);
    setView('grid');
    restart();
    showToast(`Next map. It should start with: ${nb.words.slice(0, 3).join(' · ')}.`);
  };
  const chooseTeam = (team: Team) => {
    save({ ...saved, team });
    setChoosing(false);
  };

  const starter = board.starts;
  const codeLine = pair
    ? `Host's code ${shown(saved.code)} · ${names[starter]} go first`
    : `Host's code ${shown(saved.code)} · ${starter === 'orange' ? 'Orange' : 'Teal'} team goes first`;
  const easy = board.board === 'easy';
  const landscape = mode === 'land' || mode === 'land-s';
  const sideways = mode === 'narrow' && !easy;
  const listOrder: Team[] = saved.team === 'teal' ? ['teal', 'orange'] : ['orange', 'teal'];

  const heading = (
    <div className="swm-head">
      <h1 className="swm-heading">{TEXT.heading}</h1>
      <QuietButton className="swm-hide" onClick={mapShown ? hide : show}>
        {mapShown ? 'Hide map' : 'Show map'}
      </QuietButton>
    </div>
  );

  const lines = (
    <>
      {pair && (
        <p className="swm-line" data-testid="map-teams">
          {`${pair.orange} (orange) · ${pair.teal} (teal)`}
        </p>
      )}
      <p className="swm-line" data-testid="map-code-line">
        {codeLine}
      </p>
      {saved.p === 'own' && (
        <div className="swm-my-team" data-testid="my-team">
          {saved.team && !choosing ? (
            <div className="swm-my-chosen">
              <span className="swm-line">{`I give clues for: ${names[saved.team]}`}</span>
              <QuietButton className="swm-change" onClick={() => setChoosing(true)}>
                Change
              </QuietButton>
            </div>
          ) : (
            <>
              <p className="swm-small">I give clues for:</p>
              <div className="swm-my-buttons">
                {(['orange', 'teal'] as const).map((t) => (
                  <PressButton key={t} pressed={saved.team === t} onClick={() => chooseTeam(t)}>
                    {names[t]}
                  </PressButton>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <p className="swm-line" data-testid="first-words">
        {`First words: ${board.words.slice(0, 3).join(' · ')}`}
      </p>
      <p className="swm-small" data-testid="mismatch-line">
        {TEXT.mismatch}
      </p>
    </>
  );

  const mapArea = mapShown ? (
    view !== 'grid' ? (
      <MapList board={board} team={view} found={saved.found} />
    ) : sideways ? (
      <p className="swm-sideways" data-testid="turn-sideways">
        {TEXT.sideways}
      </p>
    ) : (
      <MapGrid board={board} found={saved.found} onTap={tapCell} mode={mode} />
    )
  ) : null;

  const key = mapShown ? <MapKey names={names} easy={easy} /> : null;

  const buttons = (
    <>
      <p className="swm-small">{TEXT.small}</p>
      {mapShown && (
        <div className="swm-stack">
          {[...listOrder, 'grid' as const].map((v) => (
            <PressButton key={v} pressed={view === v} wide onClick={() => setView(v)}>
              {v === 'grid' ? 'Whole map' : v === 'orange' ? "Orange team's words" : "Teal team's words"}
            </PressButton>
          ))}
        </div>
      )}
      <div className="swm-stack">
        <QuietButton className="swm-wide" onClick={() => setAsking('next')}>
          Next map
        </QuietButton>
        <QuietButton
          className="swm-wide"
          onClick={() => {
            hide();
            onClueRules?.();
          }}
        >
          Clue rules
        </QuietButton>
        <QuietButton className="swm-wide" onClick={() => setAsking('remove')}>
          Done with this game
        </QuietButton>
      </div>
      <p className="swm-small" data-testid="map-end-line">
        {TEXT.end}
      </p>
    </>
  );

  const back = (
    <div className="swm-top">
      <QuietButton onClick={onHome}>← Back</QuietButton>
    </div>
  );

  let body: ReactNode;
  if (landscape) {
    body = (
      <div className={`swm-land${mode === 'land-s' ? ' swm-land-s' : ''}`}>
        <div className="swm-left">{mapArea}</div>
        <div className="swm-col">
          {back}
          {heading}
          {lines}
          {key}
          {buttons}
        </div>
      </div>
    );
  } else {
    body = (
      <div className="swm-page">
        {back}
        {heading}
        <div className="swm-pad swm-lines">{lines}</div>
        {mapArea && <div className={view === 'grid' && !sideways ? 'swm-grid-wrap' : 'swm-pad'}>{mapArea}</div>}
        {key && <div className="swm-pad">{key}</div>}
        <div className="swm-pad swm-lines">{buttons}</div>
      </div>
    );
  }

  return (
    <BlocksRoot className="sw-map" larger={larger}>
      <div
        className="swm-root"
        onClickCapture={(e) => {
          // SWD-039: taps within 500 ms of "Next map" opening the next map are ignored.
          if (Date.now() < guardUntil.current && (e.target as Element).closest('button')) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {body}
        {warning && mapShown && (
          <p className="swm-warning" role="status" data-testid="hide-warning">
            {TEXT.warning}
          </p>
        )}
        <Toast toast={toast} onDone={clearToast} />
        {asking === 'remove' && (
          <Dialog text={TEXT.remove}>
            <QuietButton
              onClick={() => {
                writeSavedMap(keys, null);
                setAsking(null);
                hide();
                onHome();
              }}
            >
              Remove
            </QuietButton>
            <MainButton inline onClick={() => setAsking(null)}>
              Keep it
            </MainButton>
          </Dialog>
        )}
        {asking === 'next' && (
          <Dialog text={TEXT.next}>
            <QuietButton onClick={nextMap}>Next map</QuietButton>
            <MainButton inline onClick={() => setAsking(null)}>
              Not yet
            </MainButton>
          </Dialog>
        )}
        {covered && <div className="swm-cover" data-testid="privacy-cover" />}
      </div>
    </BlocksRoot>
  );
}

function PressButton({ pressed, wide, onClick, children }: { pressed: boolean; wide?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`pgn-option swm-press${pressed ? ' pgn-selected' : ''}${wide ? ' swm-wide' : ''}`}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {pressed && (
        <span className="pgn-tick" aria-hidden="true">
          ✓{' '}
        </span>
      )}
      {children}
    </button>
  );
}

function MapGrid({ board, found, onTap, mode }: { board: Board; found: readonly number[]; onTap: (i: number) => void; mode: Mode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState<{ size: number; own: Record<number, number> } | null>(null);
  const cols = board.board === 'easy' ? 4 : 5;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const cell = el.querySelector('[data-testid="map-cell"]');
      if (!cell) return;
      const family = getComputedStyle(cell).fontFamily;
      setFit(fitWords(board.words, cell.getBoundingClientRect().width, family));
    };
    measure();
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [board, mode]);
  return (
    <div
      ref={ref}
      className={`swm-grid swm-cols-${cols}`}
      data-testid="map-grid"
      style={fit ? { fontSize: `${fit.size}px` } : undefined}
    >
      {board.words.map((word, i) => {
        const kind = board.kinds[i]!;
        const isFound = found.includes(i);
        const own = fit?.own[i];
        return (
          <button
            key={i}
            type="button"
            className={`swm-cell swm-${kind}${isFound ? ' swm-found' : ''}`}
            data-testid="map-cell"
            data-index={i}
            aria-label={`${word}, ${KIND_NAME[kind]}${isFound ? ', found' : ''}`}
            onClick={() => onTap(i)}
          >
            <KindIcon kind={kind} />
            <span className="swm-word" style={own ? { fontSize: `${own}px` } : undefined}>
              {word}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** SWD-120: a team's words not faded on this phone, then the Landmine to avoid (none on Easy). */
function MapList({ board, team, found }: { board: Board; team: Team; found: readonly number[] }) {
  const words = board.words.filter((_, i) => board.kinds[i] === team && !found.includes(i));
  const mine = board.kinds.indexOf('landmine');
  return (
    <div className="swm-list" data-testid="map-list">
      <h2 className="swm-list-heading">{`${team === 'orange' ? 'Orange' : 'Teal'} words (${words.length})`}</h2>
      <ul className="swm-list-words">
        {words.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
      {mine >= 0 && (
        <p className="swm-small swm-avoid" data-testid="avoid-line">
          <KindIcon kind="landmine" />
          {`Never guess: ${board.words[mine]} (the Landmine)`}
        </p>
      )}
    </div>
  );
}

const cut = (s: string) => (s.length > 12 ? `${s.slice(0, 12)}…` : s);

/** SWD-031/034 v3.7: two lines, each shrinking in 1 px steps to 13 px, then team names cut at 12 characters. */
function MapKey({ names, easy }: { names: { orange: string; teal: string }; easy: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [short, setShort] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let over = false;
      for (const line of el.querySelectorAll<HTMLElement>('.swm-key-line')) {
        line.style.fontSize = '';
        let s = parseFloat(getComputedStyle(line).fontSize);
        while (line.scrollWidth > line.clientWidth + 0.5 && s > 13) {
          s -= 1;
          line.style.fontSize = `${s}px`;
        }
        if (line.scrollWidth > line.clientWidth + 0.5) over = true;
      }
      if (over) setShort(true);
    };
    fit();
    const again = () => {
      setShort(false);
      requestAnimationFrame(fit);
    };
    window.addEventListener('resize', again);
    return () => window.removeEventListener('resize', again);
  }, [short, names.orange, names.teal]);
  const item = (kind: Kind, text: string) => (
    <span className="swm-key-item">
      <KindIcon kind={kind} />
      <span>{text}</span>
    </span>
  );
  return (
    <div className="swm-key" data-testid="map-key" ref={ref}>
      <div className="swm-key-line">
        {item('orange', short ? cut(names.orange) : names.orange)}
        {item('teal', short ? cut(names.teal) : names.teal)}
      </div>
      <div className="swm-key-line">
        {item('nobody', "nobody's word")}
        {!easy && item('landmine', 'Landmine: never guess')}
      </div>
    </div>
  );
}
